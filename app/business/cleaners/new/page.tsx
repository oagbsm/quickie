import Link from "next/link";
import PendingButton from "@/app/components/PendingButton";
import { addWorker } from "../../str-actions";

const field =
  "mt-1.5 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3.5 py-2.5 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";
const errors: Record<string, string> = {
  required: "Enter a name and at least one contact method.",
  preferred:
    "The preferred contact method must have a matching email address or mobile number.",
  duplicate:
    "A cleaner with that email address or mobile number already exists in this workspace.",
  save: "The cleaner could not be added. No partial record was saved. Please try again.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/business/cleaners"
        className="text-sm font-bold text-[#526078]"
      >
        ← Cleaners
      </Link>
      <div className="mb-6 mt-4">
        <p className="text-sm font-extrabold text-[#2d67b2]">YOUR CLEANER</p>
        <h1 className="mt-1 text-3xl font-extrabold">
          Add cleaner or contractor
        </h1>
        <p className="mt-2 text-[#657089]">
          Quickola creates a private seven-day invitation link for you to share.
          Automated email and SMS delivery are not enabled.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          tabIndex={-1}
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 font-bold text-red-800"
        >
          {errors[error] || errors.save}
        </div>
      )}
      <form
        action={addWorker}
        className="grid gap-5 rounded-xl bg-white p-5 shadow-sm sm:p-7"
      >
        <label className="font-bold">
          Name <span aria-hidden="true">*</span>
          <input
            name="displayName"
            autoComplete="name"
            required
            minLength={2}
            className={field}
          />
        </label>
        <label className="font-bold">
          Business name{" "}
          <span className="font-normal text-[#657089]">(optional)</span>
          <input
            name="companyName"
            autoComplete="organization"
            className={field}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Email <span className="font-normal text-[#657089]">(optional)</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              className={field}
            />
          </label>
          <label className="font-bold">
            Mobile number{" "}
            <span className="font-normal text-[#657089]">(optional)</span>
            <input
              name="mobile"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              className={field}
            />
          </label>
        </div>
        <label className="font-bold">
          Preferred contact method
          <select name="preferredContactMethod" required className={field}>
            <option value="email">Email</option>
            <option value="mobile">Mobile</option>
          </select>
        </label>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/business/cleaners"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border px-5 font-bold"
          >
            Cancel
          </Link>
          <PendingButton
            idle="Add cleaner"
            pending="Adding cleaner…"
            className="min-h-12 rounded-lg bg-[#071f49] px-5 font-extrabold text-white"
          />
        </div>
      </form>
    </div>
  );
}
