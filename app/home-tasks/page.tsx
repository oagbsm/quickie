"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { createSmallJobRequest } from "../actions";

const taskTypes = [
  "Flat-pack assembly",
  "Shelves / curtain pole",
  "TV mounting",
  "Ring doorbell / camera",
  "Cupboard fix",
  "Small repair",
  "Other home task",
];

const urgencyOptions = ["Today", "Tomorrow", "This week", "Flexible"];
const ukPhoneDigitsPattern = "^\\d{10}$";
const slPostcodePattern = "^[Ss][Ll][1-7]\\s?\\d[A-Za-z]{2}$";

type PhotoPreview = {
  id: string;
  name: string;
  url: string;
  file: File;
};

export default function HomeTasksPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [isPending, startTransition] = useTransition();

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setStepError(null);
    setPhotos((currentPhotos) => {
      const remainingSlots = Math.max(5 - currentPhotos.length, 0);
const nextFiles = selectedFiles.slice(0, remainingSlots).map((file) => ({
  id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
  name: file.name,
  url: URL.createObjectURL(file),
  file,
}));

      return [...currentPhotos, ...nextFiles].slice(0, 5);
    });

    event.target.value = "";
  }

  function removePhoto(photoId: string) {
    setPhotos((currentPhotos) => {
      const photoToRemove = currentPhotos.find((photo) => photo.id === photoId);
      if (photoToRemove) URL.revokeObjectURL(photoToRemove.url);
      return currentPhotos.filter((photo) => photo.id !== photoId);
    });
  }

  function goToStepTwo() {
    if (photos.length === 0) {
      setStepError("Add at least one photo so we can understand the job.");
      return;
    }

    if (!selectedTaskType) {
      setStepError("Choose what small job you need.");
      return;
    }

    setStepError(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePhoneDigitsChange(event: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneDigits(digitsOnly);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

const formData = new FormData(form);
formData.set("taskType", selectedTaskType);

photos.forEach((photo) => {
  formData.append("photos", photo.file, photo.name);
});

startTransition(async () => {
  await createSmallJobRequest(formData);
});
  }

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, [photos]);

  return (
    <main className="min-h-screen bg-[#071638] px-0 text-[#071638] sm:px-5 sm:py-6 lg:flex lg:items-start lg:px-8 lg:py-6 xl:px-12">
      <section className="mx-auto grid min-h-screen w-full max-w-[430px] origin-top scale-[0.9] overflow-hidden bg-[#071638] sm:min-h-0 sm:scale-100 sm:rounded-[34px] sm:shadow-[0_24px_90px_rgba(0,0,0,0.35)] lg:min-h-[790px] lg:max-w-[1357px] lg:translate-x-8 lg:scale-[1.2] lg:grid-cols-[0.88fr_1.12fr] lg:overflow-hidden lg:rounded-[42px] xl:max-w-[1426px] xl:translate-x-10">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#071638] via-[#08204d] to-[#062914] text-white lg:min-h-[790px]">
          <div className="relative z-20 flex items-center justify-between px-4 pb-1 pt-3 text-white sm:px-5 sm:pt-5 lg:px-9 lg:pt-8">
            <Link
              href="/"
              className="rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[13px] font-extrabold tracking-[-0.02em] text-white transition hover:bg-white/15"
            >
              ← Back
            </Link>
            <span className="rounded-full bg-[#11a84f] px-3 py-1 text-[11px] font-black uppercase tracking-[-0.02em] text-white">
              Home Tasks
            </span>
          </div>

          <header className="relative min-h-[205px] overflow-hidden px-5 pb-1 pt-0 text-white sm:min-h-[230px] lg:flex lg:min-h-[690px] lg:flex-col lg:justify-between lg:px-12 lg:pb-10 lg:pt-12">
            <div className="pointer-events-none absolute -right-16 top-4 h-56 w-56 rounded-full bg-[#11a84f]/20 blur-3xl lg:right-4 lg:top-20 lg:h-80 lg:w-80" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl lg:h-72 lg:w-72" />

            <div className="relative z-10 max-w-[265px] lg:max-w-[540px]">
              <div className="mb-2 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[-0.02em] text-[#c8f7d9] lg:mb-4 lg:text-xs">
                Photos first
              </div>

              <h1 className="text-[32px] font-black leading-[0.88] tracking-[-0.078em] sm:text-[38px] lg:text-[81px] xl:text-[87px]">
                Show us the job. <span className="text-[#39d86d]">We’ll find a tasker.</span>
              </h1>

              <p className="mt-2 max-w-[220px] text-[12px] font-semibold leading-[1.32] text-white/82 sm:max-w-[270px] sm:text-[14px] lg:mt-7 lg:max-w-[495px] lg:text-[22px] lg:leading-[1.45]">
                Upload photos so we can check the job and connect you with one trusted local tasker.
              </p>
            </div>

            <div className="absolute bottom-[-4px] right-[-8px] h-[205px] w-[160px] sm:h-[235px] sm:w-[185px] lg:bottom-[-16px] lg:right-[-20px] lg:h-[472px] lg:w-[368px] xl:h-[523px] xl:w-[408px]">
              <Image
                src="/quickola_koala_cutout.png"
                alt="Kola the Quickola koala"
                fill
                priority
                sizes="(min-width: 1280px) 385px, (min-width: 1024px) 340px, 185px"
                className="object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.34)]"
              />
            </div>

            <div className="relative z-10 mt-8 hidden max-w-[420px] rounded-[28px] border border-white/12 bg-white/10 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur lg:block">
              <p className="text-[13px] font-black uppercase tracking-[-0.02em] text-[#c8f7d9]">
                How it works
              </p>
              <div className="mt-4 space-y-3.5 text-[15px] font-bold leading-[1.35] text-white/82">
                <p>1. Add photos of the job.</p>
                <p>2. Add your postcode and phone number.</p>
                <p>3. Quickola sends it to one suitable local tasker.</p>
              </div>
            </div>
          </header>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative z-20 -mt-9 rounded-t-[32px] bg-white px-5 pb-4 pt-3 shadow-[0_-18px_45px_rgba(0,0,0,0.18)] sm:px-6 sm:pb-6 lg:mt-0 lg:flex lg:flex-col lg:justify-start lg:rounded-none lg:bg-[#f8fbff] lg:px-14 lg:pb-10 lg:pt-10 lg:shadow-none xl:px-16"
        >
          <div className="mb-3 flex items-center gap-2 lg:mb-5">
            <span className={`h-2 flex-1 rounded-full ${step === 1 ? "bg-[#07833f]" : "bg-[#dfe7ef]"}`} />
            <span className={`h-2 flex-1 rounded-full ${step === 2 ? "bg-[#07833f]" : "bg-[#dfe7ef]"}`} />
          </div>

          {step === 1 ? (
            <>
              <div className="rounded-[20px] border border-[#dfe7ef] bg-[#f8fbff] p-3 shadow-[0_10px_24px_rgba(7,22,56,0.05)] lg:rounded-[32px] lg:border-[#d8e4ee] lg:bg-white lg:p-6 lg:shadow-[0_14px_36px_rgba(7,22,56,0.07)]">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-[16px] font-black tracking-[-0.04em] text-[#071638] lg:text-[32px]">
                    Add photos
                  </label>
                  <span className="rounded-full bg-[#e9f8ef] px-2.5 py-1 text-[10px] font-black uppercase tracking-[-0.02em] text-[#07833f]">
                    Step 1
                  </span>
                </div>
                <p className="mt-1 text-[13px] font-semibold leading-[1.35] text-[#52627a] lg:text-[15px]">
                  Photos help us understand the job properly.
                </p>

                <label
                  className={`mt-2 flex flex-col items-center justify-center rounded-[18px] border-2 border-dashed bg-white px-4 py-2 text-center transition lg:mt-5 lg:min-h-[167px] lg:rounded-[25px] lg:py-8 ${
                    photos.length >= 5
                      ? "cursor-not-allowed border-[#dfe7ef] opacity-60"
                      : "cursor-pointer border-[#b9e6ca] hover:border-[#07833f] hover:bg-[#f6fff9]"
                  }`}
                >
                  <span className="text-[24px] lg:text-[53px]">📸</span>
                  <span className="mt-2 text-[15px] font-black tracking-[-0.03em] text-[#07833f] lg:text-[18px]">
                    Tap to upload photos
                  </span>
                  <span className="mt-1 text-[12px] font-semibold text-[#7f8ca3] lg:text-[13px]">
                    Up to 5 photos
                  </span>
                  <input type="file" multiple accept="image/*" disabled={photos.length >= 5} onChange={handlePhotoChange} className="hidden" />
                </label>

                {photos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square overflow-hidden rounded-[12px] border border-[#dfe7ef] bg-white">
                        <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#071638]/80 text-[12px] font-black leading-none text-white"
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-2 rounded-full bg-[#f6fff9] px-3 py-1.5 text-center text-[10px] font-black tracking-[-0.02em] text-[#07833f] lg:mt-4 lg:text-[12px]">
                No payment now • One local tasker • You choose
              </div>

              {stepError ? (
                <div className="mt-2 rounded-[14px] bg-[#fff2f2] px-3 py-2 text-center text-[11px] font-black tracking-[-0.02em] text-[#b42318]">
                  {stepError}
                </div>
              ) : null}

              <div className="mt-3 lg:mt-4">
                <label className="mb-1.5 block text-[14px] font-black tracking-[-0.03em] text-[#071638] lg:text-[21px]">
                  What small job do you need?
                </label>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-2.5">
                  {taskTypes.map((item) => (
                    <label key={item} className="cursor-pointer">
                      <input
                        type="radio"
                        name="taskType"
                        value={item}
                        checked={selectedTaskType === item}
                        onChange={() => setSelectedTaskType(item)}
                        required
                        className="peer sr-only"
                      />
                      <span className="flex min-h-[36px] items-center justify-center rounded-[14px] border border-[#dfe7ef] bg-white px-2.5 py-1.5 text-center text-[10px] font-extrabold leading-[1.1] text-[#071638] transition peer-checked:border-[#07833f] peer-checked:bg-[#f0fff5] peer-checked:text-[#07833f] hover:border-[#07833f] hover:bg-[#f6fff9] lg:min-h-[60px] lg:rounded-[18px] lg:text-[15px]">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={goToStepTwo}
                className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-[16px] bg-[#07833f] text-[16px] font-black tracking-[-0.03em] text-white shadow-[0_16px_32px_rgba(7,131,63,0.25)] transition hover:-translate-y-0.5 hover:bg-[#066f36] active:scale-[0.99] lg:mt-6 lg:min-h-[67px] lg:rounded-[21px] lg:text-[21px]"
              >
                Continue to contact details
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-black leading-[1] tracking-[-0.06em] text-[#071638] lg:text-[44px]">
                    Almost done
                  </h2>
                  <p className="mt-1 text-[13px] font-semibold text-[#52627a] lg:text-[16px]">
                    Add your phone number so the tasker can contact you directly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full bg-[#f1f5f9] px-3 py-2 text-[12px] font-black text-[#071638]"
                >
                  Edit
                </button>
              </div>

              <div className="mt-4 lg:mt-6">
                <label htmlFor="postcode" className="mb-2 block text-[14px] font-black tracking-[-0.03em] text-[#071638] lg:text-[17px]">
                  Postcode
                </label>
<input
  id="postcode"
  name="postcode"
  required
  pattern={slPostcodePattern}
  title="Enter a valid SL1 to SL7 postcode only. Example: SL1 1AA"
  placeholder="e.g. SL1 1AA"
  className="h-12 w-full rounded-[16px] border border-[#dfe7ef] bg-white px-4 text-[14px] font-semibold uppercase text-[#071638] outline-none transition placeholder:normal-case placeholder:text-[#8b96aa] focus:border-[#07833f] focus:ring-4 focus:ring-[#07833f]/10 lg:h-14 lg:text-[16px]"
/>
              </div>

              <div className="mt-4">
                <label htmlFor="taskDescription" className="mb-2 block text-[14px] font-black tracking-[-0.03em] text-[#071638] lg:text-[17px]">
                  Describe the task
                </label>
                <textarea
                  id="taskDescription"
                  name="taskDescription"
                  required
                  rows={4}
                  placeholder="e.g. Assemble IKEA wardrobe, put up 2 shelves, fix cupboard hinge..."
                  className="w-full resize-none rounded-[18px] border border-[#dfe7ef] bg-white px-4 py-3 text-[14px] font-semibold text-[#071638] outline-none transition placeholder:text-[#8b96aa] focus:border-[#07833f] focus:ring-4 focus:ring-[#07833f]/10 lg:text-[16px]"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-[14px] font-black tracking-[-0.03em] text-[#071638] lg:text-[17px]">
                  When do you need it?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {urgencyOptions.map((item) => (
                    <label key={item} className="cursor-pointer">
                      <input type="radio" name="urgency" value={item} required className="peer sr-only" />
                      <span className="flex min-h-[42px] items-center justify-center rounded-[14px] border border-[#dfe7ef] bg-white px-2 py-2 text-center text-[12px] font-extrabold text-[#071638] transition peer-checked:border-[#07833f] peer-checked:bg-[#f0fff5] peer-checked:text-[#07833f] hover:border-[#07833f] hover:bg-[#f6fff9] lg:min-h-[52px] lg:text-[14px]">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="phoneDigits" className="mb-2 block text-[14px] font-black tracking-[-0.03em] text-[#071638] lg:text-[17px]">
                  Phone number
                </label>
                <input type="hidden" name="phone" value={`+44${phoneDigits}`} />
                <div className="flex h-12 w-full overflow-hidden rounded-[16px] border border-[#dfe7ef] bg-white focus-within:border-[#07833f] focus-within:ring-4 focus-within:ring-[#07833f]/10 lg:h-14">
                  <span className="flex shrink-0 items-center border-r border-[#dfe7ef] bg-[#f8fbff] px-4 text-[14px] font-black text-[#071638] lg:text-[16px]">
                    +44
                  </span>
                  <input
                    id="phoneDigits"
                    name="phoneDigits"
                    type="tel"
                    inputMode="numeric"
                    required
                    pattern={ukPhoneDigitsPattern}
                    minLength={10}
                    maxLength={10}
                    title="Enter 10 digits after +44. Example: 7123456789"
                    placeholder="7123456789"
                    value={phoneDigits}
                    onChange={handlePhoneDigitsChange}
                    className="h-full min-w-0 flex-1 border-0 bg-white px-4 text-[14px] font-semibold text-[#071638] outline-none placeholder:text-[#8b96aa] lg:text-[16px]"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-bold leading-[1.3] text-[#7f8ca3] lg:text-[12px]">
                  +44 is fixed. Enter the remaining 10 digits only.
                </p>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#07833f] text-[17px] font-black tracking-[-0.03em] text-white shadow-[0_16px_32px_rgba(7,131,63,0.25)] transition hover:-translate-y-0.5 hover:bg-[#066f36] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 lg:mt-8 lg:min-h-[64px] lg:rounded-[20px] lg:text-[20px]"
              >
                {isPending ? "Sending..." : "Send my task to Quickola"}
              </button>

              <div className="mt-4 rounded-[16px] bg-[#f6fff9] px-4 py-3 text-center text-[12px] font-bold leading-[1.35] text-[#52627a] lg:text-[13px]">
                No payment now. You pay the tasker directly if you choose to book.
              </div>
            </>
          )}
        </form>
      </section>
    </main>
  );
}