"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import ProviderHeaderNavigation from "@/app/components/marketplace/ProviderHeaderNavigation";
import { saveProviderOnboarding, startProviderPayoutSetup, submitProviderApplication, updateProviderTerms, uploadProviderProfilePhoto } from "./actions";

type ServiceOption = { slug: string; name: string; jobs: { slug: string; name: string }[] };
type Props = { services: ServiceOption[]; initial: Record<string, unknown>; initialServices: string[]; profileComplete: boolean; basicProfileComplete: boolean; photoUrl: string | null; status: string; stripeStatus: string; emailVerified: boolean; actionReason?: string | null; error?: string; saved?: string; initialStep?: number };

export default function OnboardingForm({ services, initial, initialServices, profileComplete, basicProfileComplete, photoUrl, status, stripeStatus, emailVerified, actionReason, error, saved, initialStep = 1 }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [selectedServices, setSelectedServices] = useState(initialServices);
  const [photoPreview, setPhotoPreview] = useState(photoUrl || "");
  const [hasPhoto, setHasPhoto] = useState(Boolean(photoUrl));
  const [photoPickerOpen, setPhotoPickerOpen] = useState(!photoUrl);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(Boolean(initial.provider_terms_accepted_at));
  const [termsSaving, setTermsSaving] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [providerType, setProviderType] = useState(String(initial.provider_type || "individual"));
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const payoutReady = stripeStatus === "ready";
  const hasBasicProfile = basicProfileComplete;
  const hasServices = selectedServices.length > 0;
  const profileReady = hasBasicProfile && emailVerified;
  const quoteReadinessComplete = profileComplete;
  const canSubmit = ["draft", "action_required"].includes(status) && quoteReadinessComplete;
  const payoutVerifying = stripeStatus === "verification_pending";
  const payoutActionRequired = stripeStatus === "restricted";

  function toggleCategory(service: ServiceOption) {
    const values = service.jobs.map((job) => `${service.slug}|${job.slug}`);
    const allSelected = values.every((value) => selectedServices.includes(value));
    setSelectedServices((current) => allSelected ? current.filter((value) => !values.includes(value)) : [...new Set([...current, ...values])]);
  }

  async function handleTermsChange(event: ChangeEvent<HTMLInputElement>) {
    const previous = termsAccepted;
    const next = event.target.checked;
    setTermsAccepted(next); setTermsError(""); setTermsSaving(true);
    try { const result = await updateProviderTerms(next); if (!result.ok) { setTermsAccepted(previous); setTermsError("Could not save the terms change. Please try again."); return; } router.refresh(); }
    catch { setTermsAccepted(previous); setTermsError("Could not save the terms change. Please try again."); }
    finally { setTermsSaving(false); }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    if (photoSaving) return;
    const file = event.target.files?.[0]; if (!file) return;
    const previousPreview = photoPreview; const previousHasPhoto = hasPhoto; const preview = URL.createObjectURL(file);
    setPhotoPreview(preview); setHasPhoto(true); setPhotoError(""); setPhotoSaving(true);
    try { const form = new FormData(); form.set("profilePhoto", file); const result = await uploadProviderProfilePhoto(form); if (!result.ok) { setPhotoPreview(previousPreview); setHasPhoto(previousHasPhoto); setPhotoError("Use a JPG, PNG or WebP image up to 5MB."); URL.revokeObjectURL(preview); return; } setPhotoPickerOpen(false); router.refresh(); }
    catch { setPhotoPreview(previousPreview); setHasPhoto(previousHasPhoto); setPhotoError("Could not upload the photo. Please try again."); URL.revokeObjectURL(preview); }
    finally { setPhotoSaving(false); }
  }

  const errorMessage = error ? "We couldn’t save your services. Please try again." : "";
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]">
      <header className="border-b border-[#e7ebef] bg-white"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8"><Link href="/work" className="text-xl font-black">Quickola</Link><ProviderHeaderNavigation pending /></div></header>
      <section className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><p className="text-xs font-black uppercase tracking-[.15em] text-[#159548]">JOIN QUICKOLA</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Get started with local jobs</h1><p className="mt-2 text-[#657089]">Set up your profile, choose services, and get ready to send quotes.</p>
        {!emailVerified && <p className="mt-5 rounded-xl bg-[#fff8e8] p-3 text-sm font-bold text-[#8a5a00]">Verify your authenticated email before continuing.</p>}
        {errorMessage && <p className="mt-5 rounded-xl bg-[#fff1f0] p-3 text-sm font-bold text-[#a12b20]">{errorMessage}</p>}
        {saved && <p className="mt-5 text-sm font-black text-[#167d3c]">✓ Saved</p>}
        {actionReason && status === "action_required" && <div className="mt-5 rounded-2xl border border-[#f0d8a8] bg-[#fff8e8] p-5"><p className="font-black text-[#8a5a00]">One change is needed before approval</p><p className="mt-2 text-sm leading-6 text-[#6c5530]">{actionReason}</p></div>}
        <div className="mt-7 grid grid-cols-3 border-b border-[#e7ebef] pb-3 text-center text-xs font-black sm:flex sm:justify-between sm:text-left"><button type="button" onClick={() => setStep(1)} className={step === 1 ? "text-[#167d3c]" : "text-[#657089]"}>1 Basic profile</button><button type="button" disabled={!hasBasicProfile} onClick={() => setStep(2)} className={step === 2 ? "text-[#167d3c]" : "text-[#657089]"}>2 Services</button><button type="button" disabled={!hasBasicProfile || !hasServices} onClick={() => setStep(3)} className={step === 3 ? "text-[#167d3c]" : "text-[#657089]"}>3 Quote readiness</button></div>
        <form action={saveProviderOnboarding} className="mt-5 rounded-3xl border border-[#e7ebef] bg-white p-6"><input type="hidden" name="currentStep" value={step} /><input type="hidden" name="existingPhotoPath" value={String(initial.profile_photo_url || "")} />{selectedServices.map((value) => <input key={value} type="hidden" name="service" value={value} />)}
          {step === 1 && <section><h2 className="text-2xl font-black">Basic profile</h2><div className="mt-5 grid gap-4"><label className="font-bold">Provider type<select name="providerType" value={providerType} onChange={(event) => setProviderType(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border px-4"><option value="individual">Individual</option><option value="business">Business</option></select></label><label className="font-bold">{providerType === "business" ? "Business or trading name" : "Name"}<input name={providerType === "business" ? "businessName" : "displayName"} defaultValue={String(initial[providerType === "business" ? "business_name" : "display_name"] || "")} required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><label className="font-bold">Mobile number<input name="phone" type="tel" defaultValue={String(initial.phone || "")} required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label></div><button className="mt-6 min-h-11 rounded-xl bg-[#23a955] px-5 font-black">Continue to services</button></section>}
          {step === 2 && <section><h2 className="text-2xl font-black">What work do you do?</h2><p className="mt-2 text-sm text-[#657089]">Choose the jobs you&apos;d like to receive.</p><div className="mt-5 grid gap-5">{services.map((service) => { const open = openCategories.includes(service.slug); const values = service.jobs.map((job) => `${service.slug}|${job.slug}`); const selectedCount = values.filter((value) => selectedServices.includes(value)).length; const allSelected = values.length > 0 && selectedCount === values.length; return <div key={service.slug}><div className="flex items-center justify-between gap-3"><button type="button" onClick={() => setOpenCategories((current) => open ? current.filter((item) => item !== service.slug) : [...current, service.slug])} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left font-black"><span>{service.name}</span><span aria-hidden="true" className="text-[#657089]">{open ? "−" : "+"}</span></button><button type="button" onClick={() => toggleCategory(service)} className="min-h-11 shrink-0 text-sm font-black text-[#167d3c]">{allSelected ? "Deselect all" : "Select all"}</button></div><p className="text-xs font-bold text-[#657089]">{selectedCount} selected</p>{open && <div className="mt-2 grid gap-1.5 sm:grid-cols-2">{service.jobs.map((job) => { const value = `${service.slug}|${job.slug}`; return <label key={value} className="flex min-h-11 items-center gap-3 py-2 text-sm font-bold"><input type="checkbox" checked={selectedServices.includes(value)} onChange={() => setSelectedServices((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} className="h-4 w-4 accent-[#23a955]" />{job.name}</label>; })}</div>}</div>; })}</div><button className="mt-7 min-h-11 rounded-xl bg-[#23a955] px-5 font-black">Continue to quote readiness</button></section>}
          {step === 3 && <section><h2 className="text-2xl font-black">{canSubmit ? "Almost done" : "Quote readiness"}</h2><p className="mt-2 text-[#657089]">{canSubmit ? "Everything is ready." : "Finish these last steps to submit your profile."}</p><div className="mt-5 grid gap-3 rounded-2xl bg-[#f5fbf6] p-5 text-sm font-bold"><p className={profileReady ? "text-[#167d3c]" : "text-[#8a5a00]"}>{profileReady ? "✓" : "○"} Profile</p><p className={hasServices ? "text-[#167d3c]" : "text-[#8a5a00]"}>{hasServices ? "✓" : "○"} Services</p><p className={termsAccepted ? "text-[#167d3c]" : "text-[#8a5a00]"}>{termsAccepted ? "✓" : "○"} Provider terms</p><p className={payoutReady ? "text-[#167d3c]" : "text-[#8a5a00]"}>{payoutReady ? "✓ Payouts ready" : payoutVerifying ? "○ Payout details received — verification in progress" : "○ Payouts"}</p></div>{canSubmit && <p className="mt-5 text-sm leading-6 text-[#526078]">Submit your profile and we&apos;ll review it before you can start receiving jobs.</p>}{!canSubmit && <><div className="mt-5"><p className="font-bold">Profile photo</p>{photoPreview && <Image src={photoPreview} alt="Provider profile preview" width={96} height={96} unoptimized className="mt-2 h-24 w-24 rounded-2xl object-cover" />}{(!hasPhoto || photoPickerOpen) && <label className="mt-3 block font-bold"><span className="sr-only">Choose profile photo</span><input name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={photoSaving} className="block w-full rounded-xl border p-3" /><span className="mt-1 block text-xs text-[#657089]">{photoSaving ? "Uploading…" : photoError || "JPG, PNG or WebP up to 5MB."}</span></label>}{hasPhoto && !photoPickerOpen && <button type="button" onClick={() => { setPhotoPickerOpen(true); setPhotoError(""); }} className="mt-3 rounded-xl border px-3 py-2 text-sm font-black">Change photo</button>}</div><label className="mt-5 flex gap-3 rounded-xl border p-4 text-sm font-bold"><input type="checkbox" checked={termsAccepted} onChange={handleTermsChange} disabled={termsSaving} />I accept the <a href="/provider-terms">Quickola provider terms</a>{termsError && <span>{termsError}</span>}</label>{payoutVerifying && <p className="mt-4 rounded-xl bg-[#fff8e8] p-4 text-sm font-bold text-[#8a5a00]">Stripe is checking your information. You don&apos;t need to set up payouts again.</p>}{payoutActionRequired && <p className="mt-4 rounded-xl bg-[#fff8e8] p-4 text-sm font-bold text-[#8a5a00]">Payout setup needs more information.</p>}<div className="mt-5 flex flex-wrap gap-3">{!payoutReady && !payoutVerifying && <button type="submit" formAction={startProviderPayoutSetup} className="min-h-11 rounded-xl bg-[#23a955] px-4 font-black">{payoutActionRequired ? "Continue payout setup" : "Set up payouts"}</button>}</div></>}{canSubmit && <button type="submit" formAction={submitProviderApplication} className="mt-5 min-h-11 rounded-xl bg-[#061b3f] px-4 font-black text-white">Submit for review</button>}</section>}
        </form>
      </section>
    </main>
  );
}
