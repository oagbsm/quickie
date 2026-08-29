"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { saveProviderOnboarding, startProviderPayoutSetup, refreshProviderPayoutSetup, submitProviderApplication, updateProviderTerms, uploadProviderProfilePhoto } from "./actions";

type ServiceOption = { slug: string; name: string; jobs: { slug: string; name: string }[] };
type Props = { services: ServiceOption[]; initial: Record<string, unknown>; initialServices: string[]; profileComplete: boolean; photoUrl: string | null; status: string; stripeStatus: string; emailVerified: boolean; actionReason?: string | null; error?: string; saved?: string; payouts?: string; initialStep?: number };

export default function OnboardingForm({ services, initial, initialServices, profileComplete, photoUrl, status, stripeStatus, emailVerified, actionReason, error, saved, payouts, initialStep = 1 }: Props) {
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
  const hasBasicProfile = Boolean((initial.display_name || initial.business_name) && initial.phone && initial.provider_type);
  const hasServices = selectedServices.length > 0;
  const quoteReadinessComplete = profileComplete && hasPhoto && termsAccepted && emailVerified;
  const fullyReady = quoteReadinessComplete && status === "approved" && payoutReady;
  const canSubmit = ["draft", "action_required"].includes(status) && quoteReadinessComplete;
  const errorMessage = error === "email_unverified" ? "Verify your email before continuing." : error === "provider_email_missing" ? "Verify your provider email before setting up payouts." : error === "terms" ? "Accept the Quickola provider terms before continuing." : error === "photo" ? "Add a JPG, PNG or WebP image up to 5MB." : error === "quote_setup" ? "Finish your provider setup to send quotes." : error === "incomplete" ? "Complete the remaining provider setup before submitting." : error === "suspended" ? "This provider profile is suspended." : error ? "We couldn’t save that update. Please try again." : "";
  const missing = [!hasPhoto && "Profile photo", !termsAccepted && "Provider terms", status !== "approved" && "Quickola review", !payoutReady && "Payout setup"].filter(Boolean).join(" · ");

  async function handleTermsChange(event: ChangeEvent<HTMLInputElement>) {
    const previous = termsAccepted;
    const next = event.target.checked;
    setTermsAccepted(next);
    setTermsError("");
    setTermsSaving(true);
    try {
      const result = await updateProviderTerms(next);
      if (!result.ok) {
        setTermsAccepted(previous);
        setTermsError(result.error === "email_unverified" ? "Verify your email before changing the terms." : "Could not save the terms change. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setTermsAccepted(previous);
      setTermsError("Could not save the terms change. Please try again.");
    } finally {
      setTermsSaving(false);
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    if (photoSaving) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const previousPreview = photoPreview;
    const previousHasPhoto = hasPhoto;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setHasPhoto(true);
    setPhotoError("");
    setPhotoSaving(true);
    try {
      const form = new FormData();
      form.set("profilePhoto", file);
      const result = await uploadProviderProfilePhoto(form);
      if (!result.ok) {
        setPhotoPreview(previousPreview);
        setHasPhoto(previousHasPhoto);
        setPhotoError(result.error === "photo" ? "Use a JPG, PNG or WebP image up to 5MB." : "Could not upload the photo. Please try again.");
        URL.revokeObjectURL(preview);
        return;
      }
      setPhotoPickerOpen(false);
      router.refresh();
    } catch {
      setPhotoPreview(previousPreview);
      setHasPhoto(previousHasPhoto);
      setPhotoError("Could not upload the photo. Please try again.");
      URL.revokeObjectURL(preview);
    } finally {
      setPhotoSaving(false);
    }
  }

  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><header className="border-b border-[#e7ebef] bg-white"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-5 sm:px-8"><span className="text-xl font-black">Quickola</span><span className="text-sm font-black text-[#167d3c]">Provider setup</span></div></header><section className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><p className="text-xs font-black uppercase tracking-[.15em] text-[#159548]">JOIN QUICKOLA</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Get started with local jobs</h1><p className="mt-2 text-[#657089]">Set up the basics, choose your services, and browse Maidenhead opportunities. Finish the remaining setup when you’re ready to send quotes.</p>{!emailVerified && <p className="mt-5 rounded-xl bg-[#fff8e8] p-4 text-sm font-bold text-[#8a5a00]">Verify your authenticated email before continuing.</p>}{(errorMessage || saved || payouts) && <p className="mt-3 rounded-xl bg-[#fff8e8] p-3 text-sm font-bold text-[#8a5a00]">{errorMessage || (saved ? "Your provider profile has been saved." : "Payout status refreshed.")}</p>}{actionReason && status === "action_required" && <div className="mt-5 rounded-2xl border border-[#f0d8a8] bg-[#fff8e8] p-5"><p className="font-black text-[#8a5a00]">One change is needed before approval</p><p className="mt-2 text-sm leading-6 text-[#6c5530]">{actionReason}</p></div>}<div className="mt-7 flex gap-2"><button type="button" onClick={() => setStep(1)} className={`rounded-full px-3 py-2 text-xs font-black ${step === 1 ? "bg-[#061b3f] text-white" : "bg-white text-[#657089] ring-1 ring-[#e7ebef]"}`}>1 Basic profile</button><button type="button" disabled={!hasBasicProfile} onClick={() => setStep(2)} className={`rounded-full px-3 py-2 text-xs font-black ${step === 2 ? "bg-[#061b3f] text-white" : "bg-white text-[#657089] ring-1 ring-[#e7ebef]"}`}>2 Services</button><button type="button" disabled={!hasBasicProfile || !hasServices} onClick={() => setStep(3)} className={`rounded-full px-3 py-2 text-xs font-black ${step === 3 ? "bg-[#061b3f] text-white" : "bg-white text-[#657089] ring-1 ring-[#e7ebef]"}`}>3 Quote readiness</button></div><form action={saveProviderOnboarding} className="mt-5 rounded-3xl border border-[#e7ebef] bg-white p-6"><input type="hidden" name="currentStep" value={step} /><input type="hidden" name="existingPhotoPath" value={String(initial.profile_photo_url || "")} />{selectedServices.map((value) => <input key={value} type="hidden" name="service" value={value} />)}{step === 1 && <section><h2 className="text-2xl font-black">Basic profile</h2><p className="mt-2 text-sm text-[#657089]">Quickola is currently available for jobs in Maidenhead.</p><div className="mt-5 grid gap-4"><label className="font-bold">Provider type<select name="providerType" value={providerType} onChange={(event) => setProviderType(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4"><option value="individual">Individual</option><option value="business">Business</option></select></label>{providerType === "business" ? <label className="font-bold">Business or trading name<input name="businessName" defaultValue={String(initial.business_name || "")} required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label> : <label className="font-bold">Name<input name="displayName" defaultValue={String(initial.display_name || "")} required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label>}<label className="font-bold">Mobile number<input name="phone" type="tel" defaultValue={String(initial.phone || "")} required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Email<input value={String(initial.email || "")} readOnly className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] bg-[#f7f8fa] px-4 text-[#657089]" /></label></div><button className="mt-6 min-h-11 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Continue to services</button></section>}{step === 2 && <section><h2 className="text-2xl font-black">What work do you do?</h2><p className="mt-2 text-sm text-[#657089]">Choose specific jobs across one or more categories. Matching Maidenhead jobs will appear in your workspace.</p><div className="mt-5 grid gap-2">{services.map((service) => { const values = service.jobs.map((job) => `${service.slug}|${job.slug}`); const count = values.filter((value) => selectedServices.includes(value)).length; const open = openCategories.includes(service.slug); return <div key={service.slug} className="rounded-2xl border border-[#e7ebef]"><button type="button" aria-expanded={open} onClick={() => setOpenCategories((current) => open ? current.filter((item) => item !== service.slug) : [...current, service.slug])} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left font-black"><span>{service.name}</span><span className="text-sm text-[#657089]">{count ? `${count} selected` : "None selected"} {open ? "⌃" : "⌄"}</span></button>{open && <div className="grid gap-2 border-t border-[#e7ebef] p-3 sm:grid-cols-2">{service.jobs.map((job) => { const value = `${service.slug}|${job.slug}`; return <label key={value} className="flex min-h-11 items-center gap-3 rounded-xl border border-[#e7ebef] px-3 text-sm font-bold"><input type="checkbox" checked={selectedServices.includes(value)} onChange={() => setSelectedServices((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} className="h-5 w-5 accent-[#23a955]" />{job.name}</label>; })}</div>}</div>; })}</div><button className="mt-6 min-h-11 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">See matching Maidenhead jobs</button></section>}{step === 3 && <section><h2 className="text-2xl font-black">Get ready to send quotes</h2><p className="mt-2 text-sm leading-6 text-[#657089]">You can browse jobs now. Complete the items below before sending a quote.</p>{fullyReady ? <div className="mt-5 rounded-2xl bg-[#f5fbf6] p-5"><p className="text-xl font-black text-[#167d3c]">Ready to send quotes</p><p className="mt-2 text-sm leading-6 text-[#39465b]">You’re all set. You can now quote on matching jobs.</p><a href="/work" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#23a955] px-4 font-black text-[#061b3f]">View jobs</a></div> : <><div className="mt-5 grid gap-3 rounded-2xl bg-[#f5fbf6] p-5 text-sm font-bold"><p>Profile photo — {hasPhoto ? "Ready" : "Needed"}</p><p>Provider terms — {termsAccepted ? "Ready" : "Needed"}</p><p>Quickola review — {status === "approved" ? "Approved" : status === "pending_review" ? "In progress" : status === "action_required" ? "Action needed" : status === "suspended" ? "Suspended" : "Not submitted"}</p><p>Payouts — {payoutReady ? "Ready" : stripeStatus === "verification_pending" ? "Verification in progress" : stripeStatus === "onboarding" || stripeStatus === "restricted" ? "Setup in progress" : "Needed"}</p>{missing && <p className="pt-2 text-[#8a5a00]">Still needed: {missing}</p>}</div><div className="mt-5"><p className="font-bold">Profile photo</p>{photoPreview && <Image src={photoPreview} alt="Provider profile preview" width={96} height={96} unoptimized className="mt-2 h-24 w-24 rounded-2xl object-cover" />}{(!hasPhoto || photoPickerOpen) && <label className="mt-3 block font-bold"><span className="sr-only">Choose profile photo</span><input name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full rounded-xl border border-[#dbe1ea] p-3" onChange={handlePhotoChange} disabled={photoSaving} /><span className="mt-1 block text-xs text-[#657089]">{photoSaving ? "Uploading…" : photoError || "JPG, PNG or WebP up to 5MB. Businesses may use a logo/profile image."}</span></label>}{hasPhoto && !photoPickerOpen && <button type="button" onClick={() => { setPhotoPickerOpen(true); setPhotoError(""); }} className="mt-3 min-h-9 rounded-xl border border-[#dbe1ea] px-3 text-sm font-black">Change photo</button>}</div><label className="mt-5 flex items-start gap-3 rounded-xl border border-[#e7ebef] p-4 text-sm font-bold"><input type="checkbox" checked={termsAccepted} onChange={handleTermsChange} disabled={termsSaving} className="mt-1 h-5 w-5 accent-[#23a955]" /><span>I accept the <a href="/provider-terms" target="_blank" rel="noreferrer" className="text-[#167d3c] underline underline-offset-2">Quickola provider terms</a>{termsSaving ? " — Saving…" : termsError ? <span className="mt-1 block text-xs text-[#b42318]">{termsError}</span> : ""}.</span></label><div className="mt-5 flex flex-wrap gap-3">{!payoutReady && stripeStatus === "not_started" && <button type="submit" formAction={startProviderPayoutSetup} className="min-h-11 rounded-xl bg-[#23a955] px-4 font-black text-[#061b3f]">Set up payouts</button>}{!payoutReady && ["onboarding", "restricted"].includes(stripeStatus) && <button type="submit" formAction={startProviderPayoutSetup} className="min-h-11 rounded-xl bg-[#23a955] px-4 font-black text-[#061b3f]">Continue payout setup</button>}{!payoutReady && stripeStatus === "verification_pending" && <button type="submit" formAction={refreshProviderPayoutSetup} className="min-h-11 rounded-xl border border-[#dbe1ea] px-4 font-black">Check payout status</button>}{canSubmit && <button type="submit" formAction={submitProviderApplication} className="min-h-11 rounded-xl bg-[#061b3f] px-4 font-black text-white">Submit for review</button>}</div></>}</section>}</form></section></main>;
}
