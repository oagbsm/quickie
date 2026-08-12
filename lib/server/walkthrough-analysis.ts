import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

export type WalkthroughFrame = { frameIndex: number; dataUrl: string };
export type WalkthroughIssue = { frameIndex: number; category: "rubbish" | "bins" | "dishes" | "clutter" | "bed_presentation" | "linen" | "cleaning_equipment" | "stain_or_mess"; confidence: "low" | "medium" | "high"; description: string };
type WalkthroughResult = { model: string; scanStatus: "completed" | "review_required"; issues: WalkthroughIssue[] };
type WalkthroughProvider = { name: "gemini"; analyse: (frames: WalkthroughFrame[]) => Promise<WalkthroughResult> };

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const categories = new Set<WalkthroughIssue["category"]>(["rubbish", "bins", "dishes", "clutter", "bed_presentation", "linen", "cleaning_equipment", "stain_or_mess"]);
const confidences = new Set<WalkthroughIssue["confidence"]>(["low", "medium", "high"]);

function backendDebug(stage: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "production") console.info("walkthrough_backend_debug", { stage, ...details });
}

function safeError(error: unknown) {
  const value = error as { name?: string; message?: string; status?: number; code?: string };
  return {
    errorName: value?.name || "Error",
    message: String(value?.message || error || "Unknown error").replace(/key[=:]\s*\S+/gi, "key=[redacted]").replace(/https?:\/\/\S+/gi, "[url]").slice(0, 240),
    ...(value?.status ? { status: value.status } : {}),
    ...(value?.code ? { code: value.code } : {}),
  };
}

function parseImageDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("walkthrough_invalid_image_data");
  return { mimeType: match[1] === "image/jpg" ? "image/jpeg" : match[1], data: match[2] };
}

const responseSchema = {
  type: Type.OBJECT,
  required: ["scanStatus", "issues"],
  properties: {
    scanStatus: { type: Type.STRING, enum: ["completed", "review_required"] },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["frameIndex", "category", "confidence", "description"],
        properties: {
          frameIndex: { type: Type.INTEGER },
          category: { type: Type.STRING, enum: ["rubbish", "bins", "dishes", "clutter", "bed_presentation", "linen", "cleaning_equipment", "stain_or_mess"] },
          confidence: { type: Type.STRING, enum: ["low", "medium", "high"] },
          description: { type: Type.STRING },
        },
      },
    },
  },
} as const;

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned); } catch { throw new Error("walkthrough_ai_invalid_response"); }
}

function validateResult(value: unknown, frames: WalkthroughFrame[], model: string): WalkthroughResult {
  if (!value || typeof value !== "object") throw new Error("walkthrough_ai_invalid_response");
  const candidate = value as { scanStatus?: unknown; issues?: unknown };
  if (candidate.scanStatus !== "completed" && candidate.scanStatus !== "review_required") throw new Error("walkthrough_ai_invalid_response");
  if (!Array.isArray(candidate.issues) || candidate.issues.length > 25) throw new Error("walkthrough_ai_invalid_response");
  const frameIndexes = new Set(frames.map((frame) => frame.frameIndex));
  const issues = candidate.issues.map((item) => {
    if (!item || typeof item !== "object") throw new Error("walkthrough_ai_invalid_response");
    const issue = item as Partial<WalkthroughIssue>;
    if (!Number.isInteger(issue.frameIndex) || !frameIndexes.has(issue.frameIndex as number) || !categories.has(issue.category as WalkthroughIssue["category"]) || !confidences.has(issue.confidence as WalkthroughIssue["confidence"]) || typeof issue.description !== "string" || !issue.description.trim() || issue.description.length > 500) throw new Error("walkthrough_ai_invalid_response");
    return { frameIndex: issue.frameIndex as number, category: issue.category as WalkthroughIssue["category"], confidence: issue.confidence as WalkthroughIssue["confidence"], description: issue.description.trim() };
  });
  if ((issues.length > 0 && candidate.scanStatus !== "review_required") || (issues.length === 0 && candidate.scanStatus !== "completed")) throw new Error("walkthrough_ai_invalid_response");
  return { model, scanStatus: candidate.scanStatus, issues };
}

async function analyseWithGemini(frames: WalkthroughFrame[]): Promise<WalkthroughResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("gemini_not_configured");
  const model = process.env.GEMINI_WALKTHROUGH_MODEL?.trim() || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });
  const parts = [
    { text: "Review these representative walkthrough frames from a cleaning job. Only flag obvious, visible possible issues for cleaner review: rubbish/trash, overflowing bins, dirty dishes, obvious clutter on floors or surfaces, badly presented or unmade beds, towels or linen left incorrectly, cleaning products or equipment left behind, or obvious large visible stains/messes. Do not infer hygiene or cleanliness that cannot be visually confirmed. Do not certify that the property is clean. Avoid guessing; when uncertain return no issue. Return only the requested JSON." },
    ...frames.flatMap((frame) => [{ text: `Frame index: ${frame.frameIndex}` }, { inlineData: parseImageDataUrl(frame.dataUrl) }]),
  ];
  backendDebug("gemini_request_start", { provider: "gemini", model, frameCount: frames.length });
  let response;
  try {
    response = await ai.models.generateContent({ model, contents: [{ role: "user", parts }], config: { responseMimeType: "application/json", responseSchema } });
  } catch (error) {
    const details = safeError(error);
    const stage = details.errorName === "AbortError" || /timeout/i.test(details.message) ? "provider_timeout" : details.status ? "provider_http_error" : "provider_unknown_error";
    backendDebug(stage, { provider: "gemini", model, ...details });
    throw new Error("gemini_request_failed");
  }
  backendDebug("gemini_response_received", { provider: "gemini", model, hasText: Boolean(response.text) });
  let parsed: unknown;
  try { parsed = parseJson(response.text || ""); } catch (error) { backendDebug("provider_response_parse_failed", { provider: "gemini", model, ...safeError(error) }); throw error; }
  let result: WalkthroughResult;
  try { result = validateResult(parsed, frames, model); } catch (error) { backendDebug("provider_schema_validation_failed", { provider: "gemini", model, ...safeError(error) }); throw error; }
  backendDebug("gemini_response_validated", { provider: "gemini", model, issueCount: result.issues.length });
  return result;
}

const activeProvider: WalkthroughProvider = { name: "gemini", analyse: analyseWithGemini };

export async function analyseWalkthroughFrames(frames: WalkthroughFrame[]) {
  backendDebug("provider_selected", { provider: activeProvider.name, frameCount: frames.length });
  return activeProvider.analyse(frames);
}
