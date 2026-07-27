import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  const secret = process.env.CALENDAR_URL_ENCRYPTION_KEY;
  if (!secret || secret.length < 32)
    throw new Error("calendar_encryption_not_configured");
  return createHash("sha256").update(secret).digest();
}

export function encryptCalendarUrl(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptCalendarUrl(value: string) {
  const [version, ivText, tagText, ciphertextText] = value.split(".");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText)
    throw new Error("calendar_secret_invalid");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function calendarUrlFingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function maskCalendarUrl(value: string) {
  const hostname = new URL(value).hostname.replace(/^www\./, "");
  return `${hostname}/calendar/••••••••`;
}
