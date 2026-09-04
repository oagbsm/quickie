import "server-only";

type ProviderPhotoStorage = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (path: string, expiresIn: number) => Promise<{
        data: { signedUrl?: string | null } | null;
        error?: unknown;
      }>;
    };
  };
};

const PHOTO_BUCKET = "marketplace-provider-photos";

/** Resolve a stored provider photo without exposing a private storage path. */
export async function resolveProviderPhotoUrl(
  admin: ProviderPhotoStorage,
  photoReference: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  const value = String(photoReference || "").trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
    } catch {
      return null;
    }
  }

  if (value.startsWith("/") || value.includes("\\") || value.includes("..") || value.includes("\0")) return null;

  try {
    const { data, error } = await admin.storage.from(PHOTO_BUCKET).createSignedUrl(value, expiresIn);
    return error ? null : data?.signedUrl || null;
  } catch {
    return null;
  }
}
