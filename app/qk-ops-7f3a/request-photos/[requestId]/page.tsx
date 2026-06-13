

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

type RequestPhotoPayload = {
  photo_bucket?: string;
  photo_paths?: string[];
  service?: string;
  postcode?: string;
};

type RequestRow = {
  id: string;
  service: string | null;
  postcode: string | null;
  area: string | null;
  created_at: string | null;
  raw_payload: RequestPhotoPayload | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not given";
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function RequestPhotosPage({ params }: PageProps) {
  const { requestId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: request, error } = await supabase
    .from("requests")
    .select("id, service, postcode, area, created_at, raw_payload")
    .eq("id", requestId)
    .single<RequestRow>();

  if (error || !request) {
    notFound();
  }

  const payload = request.raw_payload || {};
  const bucket = payload.photo_bucket || "request-photos";
  const photoPaths = Array.isArray(payload.photo_paths) ? payload.photo_paths : [];

  const signedPhotos = await Promise.all(
    photoPaths.map(async (path, index) => {
      const { data, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 10);

      return {
        path,
        index: index + 1,
        url: signedError ? null : data?.signedUrl || null,
      };
    }),
  );

  return (
    <main className="min-h-screen bg-[#eef4ff] px-4 py-6 text-[#071638]">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/qk-ops-7f3a"
            className="rounded-full border border-[#c8d4ea] bg-white px-4 py-2 text-sm font-black text-[#365076] shadow-sm"
          >
            ← Back to admin
          </Link>

          <span className="rounded-full bg-[#071638] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-sm">
            Request photos
          </span>
        </div>

        <section className="rounded-[28px] border border-[#d8e1f0] bg-white p-5 shadow-[0_20px_60px_rgba(7,22,56,0.10)] sm:p-7">
          <div className="flex flex-col gap-4 border-b border-[#e4ebf5] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#07833f]">Quickola job evidence</p>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#071638] sm:text-4xl">
                {formatLabel(request.service || payload.service)} photos
              </h1>
              <p className="mt-2 text-sm font-bold text-[#657089]">
                {formatLabel(request.area)} · {request.postcode || payload.postcode || "No postcode"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5f8fd] p-4 text-sm font-bold text-[#365076]">
              <p>
                <span className="text-[#071638]">Photos:</span> {photoPaths.length}
              </p>
              <p className="mt-1 break-all">
                <span className="text-[#071638]">Request:</span> {request.id}
              </p>
            </div>
          </div>

          {photoPaths.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-[#c8d4ea] bg-[#f8fbff] p-8 text-center">
              <p className="text-lg font-black text-[#071638]">No photos uploaded for this request.</p>
              <p className="mt-2 text-sm font-bold text-[#657089]">
                If the customer uploaded photos, check that the request saved `raw_payload.photo_paths` correctly.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {signedPhotos.map((photo) => (
                <article key={photo.path} className="overflow-hidden rounded-[24px] border border-[#d8e1f0] bg-[#f8fbff] shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#e4ebf5] px-4 py-3">
                    <p className="text-sm font-black text-[#071638]">Photo {photo.index}</p>
                    {photo.url ? (
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-black text-[#07833f] underline decoration-2 underline-offset-4"
                      >
                        Open full size
                      </a>
                    ) : (
                      <span className="text-xs font-black text-red-600">Could not load</span>
                    )}
                  </div>

                  {photo.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.url}
                      alt={`Request photo ${photo.index}`}
                      className="h-72 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center p-4 text-center text-sm font-bold text-[#657089]">
                      Signed URL could not be created for this photo.
                    </div>
                  )}

                  <div className="break-all px-4 py-3 text-[11px] font-bold text-[#657089]">{photo.path}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}