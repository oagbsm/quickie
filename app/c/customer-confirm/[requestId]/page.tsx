import { createClient } from "@supabase/supabase-js";
import { submitCustomerJobConfirmation } from "../../../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CustomerConfirmPageProps = {
  params: Promise<{
    requestId: string;
  }>;
  searchParams?: Promise<{
    submitted?: string;
  }>;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function label(value: string | null | undefined) {
  if (!value) return "Not provided";
  return value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDetail(details: string | null | undefined, name: string) {
  if (!details) return "Not provided";
  const line = details
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(`${name.toLowerCase()}:`));

  if (!line) return "Not provided";
  return line.slice(line.indexOf(":") + 1).trim();
}

async function getRequest(requestId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: request, error } = await supabaseAdmin
    .from("requests")
    .select(
      "id, service, area, postcode, details, time_needed, phone, email, status, pol_status, zayn_status, estimated_value, customer_paid_amount, customer_rating, customer_issue, customer_feedback, customer_confirmed_at"
    )
    .eq("id", requestId)
    .single();

  if (error || !request) {
    console.error("Customer confirmation page failed to load:", error);
    return null;
  }

  return request as any;
}

export default async function CustomerConfirmPage({ params, searchParams }: CustomerConfirmPageProps) {
  const { requestId: rawRequestId } = await params;
  const query = await searchParams;
  const requestId = rawRequestId.trim();
  const request = requestId ? await getRequest(requestId) : null;
  const submitted = query?.submitted === "1" || Boolean(request?.customer_confirmed_at);

  if (!request) {
    return (
      <main className="min-h-screen bg-[#f4f8fb] px-4 py-6 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
        <section className="mx-auto max-w-[560px] rounded-[26px] border border-[#ffd4da] bg-white p-6 text-center shadow-[0_18px_44px_rgba(7,22,56,0.08)]">
          <p className="text-[42px]">⚠️</p>
          <h1 className="mt-3 text-[28px] font-black tracking-[-0.05em]">Job not found</h1>
          <p className="mt-2 text-[14px] font-bold leading-relaxed text-[#63708a]">
            This Quickola confirmation link is invalid or no longer available.
          </p>
        </section>
      </main>
    );
  }

  const jobType = getDetail(request.details, "Job type") || request.service;
  const jobDetail = getDetail(request.details, "Job detail");
  const canConfirm = request.zayn_status === "confirm_customer_satisfaction" || request.pol_status === "provider_marked_completed" || request.status === "provider_marked_completed" || submitted;

  return (
    <main className="min-h-screen bg-[#f4f8fb] px-4 py-5 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <section className="mx-auto max-w-[620px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[24px] font-black tracking-[-0.05em]">Quickola</p>
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[#08783f]">Quality check</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-black text-[#075cff] shadow-sm ring-1 ring-[#dfe7f2]">
            {submitted ? "Submitted" : "Customer confirmation"}
          </span>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[#dfe7f2] bg-white shadow-[0_18px_44px_rgba(7,22,56,0.08)]">
          <div className="bg-[#061638] p-5 text-white">
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-white/60">Was your job completed okay?</p>
            <h1 className="mt-2 text-[31px] font-black leading-none tracking-[-0.07em]">
              {label(jobType)}
            </h1>
            <p className="mt-3 text-[15px] font-bold text-white/80">
              {request.postcode || label(request.area)} · Needed {label(request.time_needed)}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <div className="rounded-[20px] border border-[#e7edf6] bg-[#fbfdff] p-4">
              <h2 className="text-[15px] font-black">Job details</h2>
              <div className="mt-3 space-y-2 text-[13px] font-bold text-[#46536d]">
                <p><span className="text-[#071638]">Service:</span> {label(request.service)}</p>
                <p><span className="text-[#071638]">Job:</span> {label(jobType)}</p>
                <p><span className="text-[#071638]">Detail:</span> {label(jobDetail)}</p>
                <p><span className="text-[#071638]">Area:</span> {request.postcode || label(request.area)}</p>
                <p><span className="text-[#071638]">Provider reported amount:</span> {request.estimated_value ? `£${request.estimated_value}` : "Not provided"}</p>
              </div>
            </div>

            {submitted ? (
              <div className="mt-4 rounded-[22px] border border-[#cfeedd] bg-[#f1fbf5] p-5 text-center">
                <p className="text-[36px]">✅</p>
                <h2 className="mt-2 text-[24px] font-black tracking-[-0.05em] text-[#08783f]">Thanks for confirming</h2>
                <p className="mx-auto mt-2 max-w-[440px] text-[13px] font-bold leading-relaxed text-[#2f5d43]">
                  Your feedback helps Quickola improve service quality, protect customers, and monitor provider standards.
                </p>
                <div className="mt-4 rounded-[16px] bg-white p-4 text-left ring-1 ring-[#dfe7f2]">
                  <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#08783f]">Saved response</p>
                  <p className="mt-2 text-[13px] font-bold text-[#46536d]">Paid amount: {request.customer_paid_amount ? `£${request.customer_paid_amount}` : "Not provided"}</p>
                  <p className="mt-1 text-[13px] font-bold text-[#46536d]">Rating: {request.customer_rating ? `${request.customer_rating}/5` : "Not provided"}</p>
                  <p className="mt-1 text-[13px] font-bold text-[#46536d]">Issue: {label(request.customer_issue)}</p>
                </div>
              </div>
            ) : canConfirm ? (
              <form action={submitCustomerJobConfirmation} className="mt-4 space-y-4 rounded-[22px] border border-[#dfe7f2] bg-[#f7fbff] p-4">
                <input type="hidden" name="request_id" value={request.id} />

                <div>
                  <h2 className="text-[20px] font-black tracking-[-0.04em]">Quickola quality check</h2>
                  <p className="mt-1 text-[13px] font-bold leading-relaxed text-[#63708a]">
                    To improve Quickola quality and provider standards, please confirm how the job went. This helps us protect customers and work with better providers.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-black">How much did you pay? (£)</span>
                  <input
                    name="customer_paid_amount"
                    inputMode="decimal"
                    placeholder={request.estimated_value ? String(request.estimated_value) : "40"}
                    className="h-12 w-full rounded-[15px] border border-[#dfe7f2] bg-white px-4 text-[15px] font-bold outline-none focus:border-[#075cff]"
                  />
                </label>

                <div>
                  <p className="mb-2 text-[13px] font-black">How would you rate the job?</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <label key={rating} className="cursor-pointer rounded-[14px] bg-white p-3 text-center ring-1 ring-[#dfe7f2]">
                        <input className="sr-only" type="radio" name="customer_rating" value={rating} required />
                        <span className="block text-[20px]">⭐</span>
                        <span className="mt-1 block text-[12px] font-black text-[#071638]">{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[13px] font-black">Were there any issues?</p>
                  <div className="grid gap-2">
                    <label className="cursor-pointer rounded-[14px] bg-white p-3 text-[13px] font-black text-[#08783f] ring-1 ring-[#cfeedd]">
                      <input className="mr-2" type="radio" name="customer_issue" value="no_issue" required />
                      No issue, completed okay
                    </label>
                    <label className="cursor-pointer rounded-[14px] bg-white p-3 text-[13px] font-black text-[#8a5a00] ring-1 ring-[#f1d48a]">
                      <input className="mr-2" type="radio" name="customer_issue" value="minor_issue" required />
                      Minor issue
                    </label>
                    <label className="cursor-pointer rounded-[14px] bg-white p-3 text-[13px] font-black text-[#d4142a] ring-1 ring-[#ffd4da]">
                      <input className="mr-2" type="radio" name="customer_issue" value="serious_issue" required />
                      Serious issue
                    </label>
                    <label className="cursor-pointer rounded-[14px] bg-white p-3 text-[13px] font-black text-[#d4142a] ring-1 ring-[#ffd4da]">
                      <input className="mr-2" type="radio" name="customer_issue" value="not_completed" required />
                      Job was not completed
                    </label>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-black">Optional comment</span>
                  <textarea
                    name="customer_feedback"
                    rows={4}
                    placeholder="Tell us anything we should know..."
                    className="w-full rounded-[15px] border border-[#dfe7f2] bg-white px-4 py-3 text-[14px] font-bold outline-none focus:border-[#075cff]"
                  />
                </label>

                <button type="submit" className="h-12 w-full rounded-[15px] bg-[#08783f] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(8,120,63,0.18)]">
                  Submit confirmation
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-[22px] border border-[#fff0d9] bg-[#fffaf2] p-5 text-center">
                <p className="text-[34px]">⏳</p>
                <h2 className="mt-2 text-[23px] font-black tracking-[-0.05em] text-[#8a5a00]">Not ready yet</h2>
                <p className="mx-auto mt-2 max-w-[430px] text-[13px] font-bold leading-relaxed text-[#7a5b28]">
                  This confirmation page becomes active after the provider marks the job as completed.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
