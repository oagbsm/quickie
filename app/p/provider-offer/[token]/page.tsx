import { createClient } from "@supabase/supabase-js";
import { acceptProviderOffer, markProviderCustomerContactStatus, markProviderJobOutcome, markProviderOfferOpened, rejectProviderOffer } from "../../../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProviderOfferPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    accepted?: string;
    rejected?: string;
    contact?: string;
    outcome?: string;
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

function isExpired(value: string | null | undefined) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

async function getOffer(token: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: match, error } = await supabaseAdmin
    .from("request_matches")
    .select(
      `
        id,
        status,
        rough_range,
        minimum_charge,
        callout_fee,
        availability,
        quoted_price,
        provider_offer_expires_at,
        requests:request_id (
          id,
          service,
          area,
          postcode,
          details,
          time_needed,
          provider_lane,
          job_size,
          job_risk,
          customer_budget,
          email,
          phone
        ),
        businesses:business_id (
          id,
          business_name,
          category
        )
      `
    )
    .eq("provider_offer_token", token)
    .single();

  if (error || !match) {
    console.error("Provider offer page failed to load:", error);
    return null;
  }

  return match as any;
}

export default async function ProviderOfferPage({ params, searchParams }: ProviderOfferPageProps) {
  const { token: rawToken } = await params;
  const token = rawToken.trim();

  if (!token) {
    return (
      <main className="min-h-screen bg-[#f4f8fb] px-4 py-6 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
        <section className="mx-auto max-w-[520px] rounded-[26px] border border-[#ffd4da] bg-white p-6 text-center shadow-[0_18px_44px_rgba(7,22,56,0.08)]">
          <p className="text-[42px]">⚠️</p>
          <h1 className="mt-3 text-[28px] font-black tracking-[-0.05em]">Offer not found</h1>
          <p className="mt-2 text-[14px] font-bold leading-relaxed text-[#63708a]">
            This Quickola provider link is missing a valid offer token.
          </p>
        </section>
      </main>
    );
  }

  const query = await searchParams;
  const offer = await getOffer(token);

  if (!offer) {
    return (
      <main className="min-h-screen bg-[#f4f8fb] px-4 py-6 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
        <section className="mx-auto max-w-[520px] rounded-[26px] border border-[#ffd4da] bg-white p-6 text-center shadow-[0_18px_44px_rgba(7,22,56,0.08)]">
          <p className="text-[42px]">⚠️</p>
          <h1 className="mt-3 text-[28px] font-black tracking-[-0.05em]">Offer not found</h1>
          <p className="mt-2 text-[14px] font-bold leading-relaxed text-[#63708a]">
            This Quickola provider link is invalid or no longer available.
          </p>
        </section>
      </main>
    );
  }

  await markProviderOfferOpened(token);

  const request = Array.isArray(offer.requests) ? offer.requests[0] : offer.requests;
  const business = Array.isArray(offer.businesses) ? offer.businesses[0] : offer.businesses;
  const expired = isExpired(offer.provider_offer_expires_at);
  const contactStatus = query?.contact || (["completed", "customer_cancelled", "job_not_completed"].includes(offer.status) ? "customer_contacted" : offer.status);
  const jobOutcome = query?.outcome || (offer.status === "completed" ? "job_completed" : offer.status);
  const hasContactedCustomer = ["customer_contacted", "in_progress", "completed", "job_completed", "customer_cancelled", "job_not_completed"].includes(contactStatus) || ["completed", "customer_cancelled", "job_not_completed"].includes(offer.status);
  const hasFinalOutcome = ["job_completed", "completed", "customer_cancelled", "job_not_completed"].includes(jobOutcome);
  const alreadyAccepted = ["accepted", "customer_contacted", "customer_no_answer", "customer_unreachable", "in_progress", "completed", "customer_cancelled", "job_not_completed"].includes(offer.status) || query?.accepted === "1";
  const alreadyRejected = offer.status === "rejected" || query?.rejected === "1";
  const jobType = getDetail(request?.details, "Job type") || request?.service;
  const jobDetail = getDetail(request?.details, "Job detail");

  return (
    <main className="min-h-screen bg-[#f4f8fb] px-4 py-5 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <section className="mx-auto max-w-[560px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[24px] font-black tracking-[-0.05em]">Quickola</p>
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[#08783f]">Provider job offer</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-black text-[#075cff] shadow-sm ring-1 ring-[#dfe7f2]">
            {label(offer.status)}
          </span>
        </div>

        {alreadyAccepted ? (
          <div className="mb-4 overflow-hidden rounded-[26px] border border-[#cfeedd] bg-white shadow-[0_18px_44px_rgba(7,22,56,0.08)]">
            <div className="bg-[#f1fbf5] p-5 text-center">
              <p className="text-[34px]">✅</p>
              <h1 className="mt-2 text-[25px] font-black tracking-[-0.05em] text-[#08783f]">
                {hasFinalOutcome ? "Job update saved" : hasContactedCustomer ? "Customer contacted" : "Job accepted"}
              </h1>
              <p className="mx-auto mt-2 max-w-[420px] text-[13px] font-bold leading-relaxed text-[#2f5d43]">
                {hasFinalOutcome
                  ? "Thanks. Quickola has saved the job outcome. Zayn will handle any customer confirmation or issue follow-up."
                  : hasContactedCustomer
                    ? "Thanks. When the job is finished, update the outcome below so Quickola can close the loop properly."
                    : "Thanks. Contact the customer first, then update Quickola using the steps below."}
              </p>
            </div>

            <div className="space-y-4 p-4 text-left sm:p-5">
              <div className="rounded-[20px] border border-[#dfe7f2] bg-[#fbfdff] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#071638] text-[13px] font-black text-white">1</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black uppercase tracking-[0.08em] text-[#08783f]">Customer details</p>
                    <p className="mt-1 text-[12px] font-bold leading-relaxed text-[#63708a]">Use these details only for this Quickola job.</p>

                    <div className="mt-3 grid gap-2">
                      <a
                        className="flex items-center justify-between rounded-[14px] bg-white px-3 py-3 text-[14px] font-black text-[#071638] ring-1 ring-[#dfe7f2]"
                        href={request?.phone ? `tel:${request.phone}` : undefined}
                      >
                        <span>Phone</span>
                        <span className="text-[#075cff]">{request?.phone || "Not provided"}</span>
                      </a>
                      <a
                        className="flex items-center justify-between rounded-[14px] bg-white px-3 py-3 text-[14px] font-black text-[#071638] ring-1 ring-[#dfe7f2]"
                        href={request?.email ? `mailto:${request.email}` : undefined}
                      >
                        <span>Email</span>
                        <span className="truncate pl-3 text-[#075cff]">{request?.email || "Not provided"}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#dfe7f2] bg-[#f7fbff] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#075cff] text-[13px] font-black text-white">2</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black uppercase tracking-[0.08em] text-[#071638]">Contact status</p>
                    <p className="mt-1 text-[12px] font-bold leading-relaxed text-[#63708a]">Tell Quickola what happened after you tried the customer.</p>

                    {contactStatus === "customer_contacted" || contactStatus === "in_progress" || hasContactedCustomer ? (
                      <p className="mt-3 rounded-[13px] bg-[#f1fbf5] px-3 py-2 text-[12px] font-black text-[#08783f]">
                        ✅ Customer contacted
                      </p>
                    ) : contactStatus === "customer_no_answer" ? (
                      <p className="mt-3 rounded-[13px] bg-[#fff8e8] px-3 py-2 text-[12px] font-black text-[#8a5a00]">
                        📞 Customer did not answer
                      </p>
                    ) : contactStatus === "customer_unreachable" ? (
                      <p className="mt-3 rounded-[13px] bg-[#fff6f7] px-3 py-2 text-[12px] font-black text-[#d4142a]">
                        ❌ Could not reach customer
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        <form action={markProviderCustomerContactStatus}>
                          <input type="hidden" name="token" value={token} />
                          <input type="hidden" name="contact_status" value="customer_contacted" />
                          <button type="submit" className="h-11 w-full rounded-[14px] bg-[#08783f] px-4 text-[13px] font-black text-white">
                            ✅ I called/contacted the customer
                          </button>
                        </form>
                        <form action={markProviderCustomerContactStatus}>
                          <input type="hidden" name="token" value={token} />
                          <input type="hidden" name="contact_status" value="customer_no_answer" />
                          <button type="submit" className="h-11 w-full rounded-[14px] bg-white px-4 text-[13px] font-black text-[#8a5a00] ring-1 ring-[#f1d48a]">
                            📞 Customer did not answer
                          </button>
                        </form>
                        <form action={markProviderCustomerContactStatus}>
                          <input type="hidden" name="token" value={token} />
                          <input type="hidden" name="contact_status" value="customer_unreachable" />
                          <button type="submit" className="h-11 w-full rounded-[14px] bg-white px-4 text-[13px] font-black text-[#d4142a] ring-1 ring-[#ffd4da]">
                            ❌ I cannot reach the customer
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {hasContactedCustomer ? (
                <div className="rounded-[20px] border border-[#f2dfaa] bg-[#fffdf7] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-[13px] font-black text-white">3</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-black uppercase tracking-[0.08em] text-[#071638]">Job outcome</p>
                      <p className="mt-1 text-[12px] font-bold leading-relaxed text-[#63708a]">Only update this after the job is finished or cancelled.</p>

                      {jobOutcome === "job_completed" || jobOutcome === "completed" ? (
                        <p className="mt-3 rounded-[13px] bg-[#f1fbf5] px-3 py-2 text-[12px] font-black text-[#08783f]">
                          ✅ Job marked as completed
                        </p>
                      ) : jobOutcome === "customer_cancelled" ? (
                        <p className="mt-3 rounded-[13px] bg-[#fff8e8] px-3 py-2 text-[12px] font-black text-[#8a5a00]">
                          ⚠️ Marked as customer cancelled
                        </p>
                      ) : jobOutcome === "job_not_completed" ? (
                        <p className="mt-3 rounded-[13px] bg-[#fff6f7] px-3 py-2 text-[12px] font-black text-[#d4142a]">
                          ❌ Marked as not completed
                        </p>
                      ) : (
                        <div className="mt-3 grid gap-2">
                          <form action={markProviderJobOutcome} className="rounded-[14px] bg-white p-3 ring-1 ring-[#dfe7f2]">
                            <input type="hidden" name="token" value={token} />
                            <input type="hidden" name="outcome" value="job_completed" />
                            <label className="block">
                              <span className="mb-1.5 block text-[12px] font-black text-[#071638]">Final amount charged (£)</span>
                              <input
                                name="final_amount_charged"
                                inputMode="decimal"
                                placeholder="60"
                                className="h-10 w-full rounded-[12px] border border-[#d9e8df] bg-white px-3 text-[14px] font-bold outline-none focus:border-[#08783f]"
                              />
                            </label>
                            <button type="submit" className="mt-2 h-11 w-full rounded-[14px] bg-[#08783f] px-4 text-[13px] font-black text-white">
                              ✅ Job completed
                            </button>
                          </form>
                          <form action={markProviderJobOutcome}>
                            <input type="hidden" name="token" value={token} />
                            <input type="hidden" name="outcome" value="customer_cancelled" />
                            <button type="submit" className="h-11 w-full rounded-[14px] bg-white px-4 text-[13px] font-black text-[#8a5a00] ring-1 ring-[#f1d48a]">
                              ⚠️ Customer cancelled
                            </button>
                          </form>
                          <form action={markProviderJobOutcome}>
                            <input type="hidden" name="token" value={token} />
                            <input type="hidden" name="outcome" value="job_not_completed" />
                            <button type="submit" className="h-11 w-full rounded-[14px] bg-white px-4 text-[13px] font-black text-[#d4142a] ring-1 ring-[#ffd4da]">
                              ❌ Could not complete job
                            </button>
                          </form>
                        </div>
                      )}

                      <p className="mt-3 rounded-[12px] bg-white px-3 py-2 text-[11px] font-bold leading-relaxed text-[#63708a] ring-1 ring-[#ede7d6]">
                        Quickola will only confirm with the customer after you mark the job completed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {alreadyRejected ? (
          <div className="mb-4 rounded-[22px] border border-[#ffd4da] bg-[#fff6f7] p-5 text-center">
            <p className="text-[36px]">❌</p>
            <h1 className="mt-2 text-[25px] font-black tracking-[-0.05em] text-[#d4142a]">Rejected</h1>
            <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#7a3d46]">
              Thanks. We’ll try another provider for this request.
            </p>
          </div>
        ) : null}

        {expired && !alreadyAccepted && !alreadyRejected ? (
          <div className="mb-4 rounded-[22px] border border-[#ffd4da] bg-[#fff6f7] p-5 text-center">
            <p className="text-[36px]">⏰</p>
            <h1 className="mt-2 text-[25px] font-black tracking-[-0.05em] text-[#d4142a]">Offer expired</h1>
            <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#7a3d46]">
              This job link has expired. Quickola may already be trying another provider.
            </p>
          </div>
        ) : null}

        <div className="rounded-[28px] border border-[#dfe7f2] bg-white p-5 shadow-[0_18px_44px_rgba(7,22,56,0.08)]">
          <div className="rounded-[22px] bg-[#061638] p-5 text-white">
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-white/60">Job nearby</p>
            <h1 className="mt-2 text-[31px] font-black leading-none tracking-[-0.07em]">
              {label(jobType)}
            </h1>
            <p className="mt-3 text-[15px] font-bold text-white/80">
              {request?.postcode || label(request?.area)} · Needed {label(request?.time_needed)}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[18px] bg-[#f7fbff] p-4 ring-1 ring-[#dfe7f2]">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#63708a]">Guide</p>
              <p className="mt-1 text-[20px] font-black tracking-[-0.04em]">{offer.rough_range || "Not set"}</p>
            </div>
            <div className="rounded-[18px] bg-[#f7fbff] p-4 ring-1 ring-[#dfe7f2]">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#63708a]">Minimum</p>
              <p className="mt-1 text-[20px] font-black tracking-[-0.04em]">{offer.minimum_charge ? `£${offer.minimum_charge}` : "Not set"}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[20px] border border-[#e7edf6] bg-[#fbfdff] p-4">
            <h2 className="text-[15px] font-black">Job details</h2>
            <div className="mt-3 space-y-2 text-[13px] font-bold text-[#46536d]">
              <p><span className="text-[#071638]">Service:</span> {label(request?.service)}</p>
              <p><span className="text-[#071638]">Job:</span> {label(jobType)}</p>
              <p><span className="text-[#071638]">Detail:</span> {label(jobDetail)}</p>
              <p><span className="text-[#071638]">Area:</span> {request?.postcode || label(request?.area)}</p>
              <p><span className="text-[#071638]">Provider:</span> {business?.business_name || "Your business"}</p>
            </div>
          </div>

          {!expired && !alreadyAccepted && !alreadyRejected ? (
            <div className="mt-4 space-y-3">
              <form action={acceptProviderOffer} className="rounded-[20px] border border-[#cfeedd] bg-[#f7fcf8] p-4">
                <input type="hidden" name="token" value={token} />

                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-black">Your rough price</span>
                  <input
                    name="quoted_price"
                    inputMode="numeric"
                    placeholder="40"
                    className="h-11 w-full rounded-[14px] border border-[#d9e8df] bg-white px-4 text-[14px] font-bold outline-none focus:border-[#08783f]"
                  />
                </label>

                <label className="mt-3 block">
                  <span className="mb-1.5 block text-[13px] font-black">When can you do it?</span>
                  <input
                    name="availability"
                    placeholder="Today 5pm"
                    className="h-11 w-full rounded-[14px] border border-[#d9e8df] bg-white px-4 text-[14px] font-bold outline-none focus:border-[#08783f]"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-3 h-12 w-full rounded-[15px] bg-[#08783f] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(8,120,63,0.18)]"
                >
                  Accept job
                </button>
              </form>

              <form action={rejectProviderOffer} className="rounded-[20px] border border-[#ffd4da] bg-[#fff8f9] p-4">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="reason" value="Provider rejected using offer link." />
                <button
                  type="submit"
                  className="h-11 w-full rounded-[14px] bg-white px-5 text-[14px] font-black text-[#d4142a] ring-1 ring-[#ffd4da]"
                >
                  Reject job
                </button>
              </form>
            </div>
          ) : null}

          <p className="mt-4 text-center text-[12px] font-semibold leading-relaxed text-[#63708a]">
            Accept only if you can contact the customer quickly. Final price is agreed directly with the customer after details are confirmed.
          </p>
        </div>
      </section>
    </main>
  );
}