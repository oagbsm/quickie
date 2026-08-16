"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function ProfilePhotoField({ currentUrl, currentPath }: { currentUrl?: string | null; currentPath?: string | null }) {
  const [preview, setPreview] = useState(currentUrl || "");
  const [remove, setRemove] = useState(false);
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  return <fieldset><legend className="font-bold">Profile photo or logo</legend>{preview && !remove ? <Image src={preview} alt="Current provider profile" width={96} height={96} unoptimized className="mt-3 h-24 w-24 rounded-2xl object-cover" /> : <p className="mt-3 text-sm text-[#657089]">No photo uploaded.</p>}<input type="hidden" name="existingPhotoPath" value={remove ? "" : currentPath || ""} /><label className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-[#dbe1ea] px-4 text-sm font-black">{preview && !remove ? "Replace photo" : "Upload photo"}<input name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setRemove(false); setPreview(URL.createObjectURL(file)); } }} /></label>{preview && !remove && <button type="submit" name="photoAction" value="remove" onClick={() => setRemove(true)} className="ml-2 min-h-11 rounded-xl border border-red-200 px-4 text-sm font-black text-red-700">Remove photo</button>}<p className="mt-2 text-xs text-[#657089]">JPG, PNG or WebP up to 5MB.</p></fieldset>;
}
