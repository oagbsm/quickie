import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyseWalkthroughFrames, type WalkthroughFrame } from "@/lib/server/walkthrough-analysis";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await request.json() as { scanId?: string; frames?: WalkthroughFrame[] };
  const invalidFrame = Array.isArray(body.frames) ? body.frames.find((frame) => !frame || !Number.isInteger(frame.frameIndex) || typeof frame.dataUrl !== "string" || !/^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(frame.dataUrl)) : undefined;
  if (!body.scanId || !Array.isArray(body.frames) || body.frames.length < 1 || body.frames.length > 25 || invalidFrame) return NextResponse.json({ error: "invalid_frames", ...(process.env.NODE_ENV !== "production" ? { frameCount: Array.isArray(body.frames) ? body.frames.length : 0, invalidFrameIndex: invalidFrame && typeof invalidFrame === "object" && "frameIndex" in invalidFrame ? invalidFrame.frameIndex : null } : {}) }, { status: 400 });
  try {
    const result = await analyseWalkthroughFrames(body.frames);
    const { data: scan, error: scanError } = await supabase.from("cleaner_walkthrough_scans").select("id,cleaner_user_id,work_item_id").eq("id", body.scanId).eq("cleaner_user_id", user.id).maybeSingle();
    if (scanError || !scan) return NextResponse.json({ error: "walkthrough_not_found" }, { status: 404 });
    const { error: clearError } = await supabase.from("cleaner_walkthrough_issues").delete().eq("scan_id", body.scanId);
    if (clearError) throw clearError;
    if (result.issues.length) { const { error } = await supabase.from("cleaner_walkthrough_issues").insert(result.issues.map((issue) => ({ scan_id: body.scanId, work_item_id: scan.work_item_id, ...issue }))); if (error) throw error; }
    const { error } = await supabase.from("cleaner_walkthrough_scans").update({ status: result.issues.length ? "review_required" : "completed", frame_count: body.frames.length, issue_count: result.issues.length, resolved_issue_count: 0, provider: "gemini", model: result.model, error_message: null, completed_at: result.issues.length ? null : new Date().toISOString() }).eq("id", body.scanId).eq("cleaner_user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ...result, framesChecked: body.frames.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "walkthrough_analysis_failed";
    if (process.env.NODE_ENV !== "production") console.info("walkthrough_backend_debug", { stage: "analysis_route_failed", provider: "gemini", errorName: error instanceof Error ? error.name : "UnknownError", errorCode: message });
    await supabase.from("cleaner_walkthrough_scans").update({ status: "failed", error_message: message }).eq("id", body.scanId).eq("cleaner_user_id", user.id);
    return NextResponse.json({ error: message }, { status: message === "gemini_not_configured" ? 503 : 502 });
  }
}
