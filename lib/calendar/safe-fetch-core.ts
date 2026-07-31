import { isIP } from "node:net";
import { resolve4, resolve6 } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { Readable } from "node:stream";

export type CalendarFetchErrorCode =
  | "invalid_calendar_url"
  | "unsupported_protocol"
  | "calendar_address_blocked"
  | "calendar_unavailable"
  | "calendar_timeout"
  | "calendar_too_large"
  | "calendar_content_type"
  | "calendar_redirect_limit";

export class CalendarFetchError extends Error {
  readonly code: CalendarFetchErrorCode;

  constructor(code: CalendarFetchErrorCode) {
    super(code);
    this.code = code;
    this.name = "CalendarFetchError";
  }
}

export type CalendarFetchDependencies = {
  resolve?: (hostname: string) => Promise<string[]>;
  fetch?: typeof globalThis.fetch;
};

const blockedHostnames = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.azure.internal",
]);

function ipv4Parts(address: string) {
  const parts = address.split(".").map(Number);
  return parts.length === 4 && parts.every((part) => part >= 0 && part <= 255)
    ? parts
    : null;
}

export function isBlockedCalendarAddress(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mapped) return isBlockedCalendarAddress(mapped[1]);
  if (isIP(normalized) === 4) {
    const parts = ipv4Parts(normalized)!;
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (isIP(normalized) === 6) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized === "fd00:ec2::254"
    );
  }
  return true;
}

export function validateCalendarUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new CalendarFetchError("invalid_calendar_url");
  }
  if (url.protocol !== "https:")
    throw new CalendarFetchError("unsupported_protocol");
  if (url.username || url.password)
    throw new CalendarFetchError("invalid_calendar_url");
  const hostname = url.hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^\[|\]$/g, "");
  if (
    !hostname ||
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    (isIP(hostname) > 0 && isBlockedCalendarAddress(hostname))
  )
    throw new CalendarFetchError("calendar_address_blocked");
  if (hostname !== url.hostname) url.hostname = hostname;
  url.hash = "";
  return url;
}

async function defaultResolve(hostname: string) {
  if (isIP(hostname)) return [hostname];
  const [v4, v6] = await Promise.all([
    resolve4(hostname).catch(() => []),
    resolve6(hostname).catch(() => []),
  ]);
  return [...v4, ...v6];
}

export async function assertSafeCalendarDestination(
  url: URL,
  resolver: (hostname: string) => Promise<string[]> = defaultResolve,
) {
  let addresses: string[];
  try {
    addresses = await resolver(url.hostname);
  } catch {
    throw new CalendarFetchError("calendar_unavailable");
  }
  if (!addresses.length || addresses.some(isBlockedCalendarAddress))
    throw new CalendarFetchError("calendar_address_blocked");
  return addresses;
}

function pinnedHttpsFetch(
  url: URL,
  address: string,
  signal: AbortSignal,
  headers: Record<string, string>,
) {
  return new Promise<Response>((resolve, reject) => {
    const request = httpsRequest(
      {
        protocol: "https:",
        hostname: address,
        family: isIP(address),
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        servername: url.hostname,
        headers: { ...headers, Host: url.host },
      },
      (response) => {
        const responseHeaders = new Headers();
        for (const [name, value] of Object.entries(response.headers)) {
          if (Array.isArray(value))
            for (const item of value) responseHeaders.append(name, item);
          else if (value !== undefined) responseHeaders.set(name, value);
        }
        resolve(
          new Response(Readable.toWeb(response) as ReadableStream<Uint8Array>, {
            status: response.statusCode || 500,
            statusText: response.statusMessage,
            headers: responseHeaders,
          }),
        );
      },
    );
    const abort = () => request.destroy(new Error("calendar_request_aborted"));
    signal.addEventListener("abort", abort, { once: true });
    request.once("close", () => signal.removeEventListener("abort", abort));
    request.once("error", reject);
    request.end();
  });
}

async function logDevelopmentResponse(response: Response) {
  if (process.env.NODE_ENV !== "development") return;
  let first200Bytes = "";
  try {
    const reader = response.clone().body?.getReader();
    if (reader) {
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (total < 200) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        const remaining = 200 - total;
        const chunk = value.subarray(0, remaining);
        chunks.push(chunk);
        total += chunk.byteLength;
      }
      void reader.cancel().catch(() => undefined);
      const preview = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        preview.set(chunk, offset);
        offset += chunk.byteLength;
      }
      first200Bytes = new TextDecoder("utf-8", { fatal: false }).decode(preview);
    }
  } catch {
    first200Bytes = "<response preview unavailable>";
  }
  console.info("[calendar-fetch] response", {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    contentType: response.headers.get("content-type") || "",
    first200Bytes,
  });
}

export async function fetchCalendarText(
  input: string,
  dependencies: CalendarFetchDependencies = {},
  options: { timeoutMs?: number; maxBytes?: number; maxRedirects?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? 8_000;
  const maxBytes = options.maxBytes ?? 2_000_000;
  const maxRedirects = options.maxRedirects ?? 3;
  const resolver = dependencies.resolve ?? defaultResolve;
  let current = validateCalendarUrl(input);

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const addresses = await assertSafeCalendarDestination(current, resolver);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      const headers = {
        Accept: "text/calendar,text/plain;q=0.9,*/*;q=0.2",
      };
      response = dependencies.fetch
        ? await dependencies.fetch(current, {
            redirect: "manual",
            signal: controller.signal,
            headers,
          })
        : await pinnedHttpsFetch(
            current,
            addresses[0],
            controller.signal,
            headers,
          );
    } catch (error) {
      clearTimeout(timeout);
      if (controller.signal.aborted)
        throw new CalendarFetchError("calendar_timeout");
      void error;
      throw new CalendarFetchError("calendar_unavailable");
    }

    await logDevelopmentResponse(response);

    if (response.status >= 300 && response.status < 400) {
      clearTimeout(timeout);
      if (redirects === maxRedirects)
        throw new CalendarFetchError("calendar_redirect_limit");
      const location = response.headers.get("location");
      if (!location) throw new CalendarFetchError("calendar_unavailable");
      current = validateCalendarUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) {
      clearTimeout(timeout);
      throw new CalendarFetchError("calendar_unavailable");
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (
      contentType &&
      !contentType.includes("text/calendar") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/octet-stream")
    ) {
      clearTimeout(timeout);
      const error = new CalendarFetchError("calendar_content_type");
      if (process.env.NODE_ENV === "development")
        console.error("[calendar-fetch] content type rejected", error);
      throw error;
    }
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > maxBytes) {
      clearTimeout(timeout);
      throw new CalendarFetchError("calendar_too_large");
    }
    if (!response.body) {
      clearTimeout(timeout);
      return "";
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      let next: ReadableStreamReadResult<Uint8Array>;
      try {
        next = await reader.read();
      } catch {
        clearTimeout(timeout);
        throw new CalendarFetchError(
          controller.signal.aborted ? "calendar_timeout" : "calendar_unavailable",
        );
      }
      const { done, value } = next;
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        clearTimeout(timeout);
        throw new CalendarFetchError("calendar_too_large");
      }
      chunks.push(value);
    }
    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    clearTimeout(timeout);
    return new TextDecoder("utf-8", { fatal: false }).decode(body);
  }
  throw new CalendarFetchError("calendar_redirect_limit");
}
