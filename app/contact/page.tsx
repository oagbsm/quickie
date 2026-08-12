import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "../components/Footer";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import { escapeHtml, sendAdminNotifications } from "@/lib/server/notifications";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function sendContactMessage(formData: FormData) {
  "use server";

  const name = clean(formData.get("name"));
  const email = clean(formData.get("email"));
  const phone = clean(formData.get("phone"));
  const topic = clean(formData.get("topic"));
  const message = clean(formData.get("message"));
  const website = clean(formData.get("website"));

  if (website) redirect("/contact?status=sent");

  if (
    !name ||
    !email ||
    !topic ||
    message.length < 10 ||
    !/^\S+@\S+\.\S+$/.test(email)
  ) {
    redirect("/contact?status=missing-fields");
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || "Not provided");
  const safeTopic = escapeHtml(topic);
  const safeMessage = escapeHtml(message);
  const result = await sendAdminNotifications({
    telegramHtml: [
      "📩 <b>New Quickola contact message</b>",
      `Topic: <b>${safeTopic}</b>`,
      `Name: <b>${safeName}</b>`,
      `Email: ${safeEmail}`,
      phone ? `Phone: ${safePhone}` : "Phone: not provided",
      "",
      `<b>Message</b>\n${safeMessage}`,
    ].join("\n"),
  });

  if (!result.telegramSent) {
    console.error("Contact notification delivery failed:", result.errors);
    redirect("/contact?status=delivery-failed");
  }

  redirect("/contact?status=sent");
}

function StatusMessage({ status }: { status?: string }) {
  if (status === "sent") {
    return (
      <div className="mb-5 rounded-[18px] border border-[#bfe8cc] bg-[#effaf2] p-4 text-[14px] font-extrabold text-[#08783f]">
        Message sent. We’ll get back to you soon.
      </div>
    );
  }

  if (status === "missing-fields") {
    return (
      <div className="mb-5 rounded-[18px] border border-[#ffd6a8] bg-[#fff7ed] p-4 text-[14px] font-extrabold text-[#9a4b00]">
        Please fill in your name, email, topic and message.
      </div>
    );
  }

  if (status === "delivery-failed") {
    return (
      <div className="mb-5 rounded-[18px] border border-[#ffd6a8] bg-[#fff7ed] p-4 text-[14px] font-extrabold text-[#9a4b00]">
        We could not deliver your message. Please try again in a moment.
      </div>
    );
  }

  return null;
}

export const metadata = {
  title: "Help and support | Quickola",
  description:
    "Contact Quickola for account help, existing bookings and business enquiries.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams?.status;

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#071638]"><MarketplaceHeader />
      <section className="relative overflow-hidden bg-[#071638] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(63,196,118,0.25),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(54,124,255,0.22),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-2 text-[13px] font-black text-white/75 transition hover:text-white"
            >
              <span aria-hidden="true">←</span> Back to homepage
            </Link>
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[12px] font-black uppercase tracking-[0.14em] text-white/85">
              Contact Quickola
            </div>
            <h1 className="mt-6 max-w-[760px] text-[44px] font-black leading-[0.96] tracking-[-0.065em] sm:text-[64px]">
              Help and support
            </h1>
            <p className="mt-5 max-w-[620px] text-[18px] font-medium leading-[1.65] text-white/76">
              Contact Quickola about an existing account, booking or business enquiry. To post a new local service job, start from the homepage.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/12 bg-white p-5 text-[#071638] shadow-[0_30px_80px_rgba(0,0,0,0.22)] sm:p-6">
            <StatusMessage status={status} />
            <form action={sendContactMessage} className="grid gap-4">
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">
                  Your name
                </span>
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className="h-[52px] w-full rounded-[14px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Your email address"
                  className="h-[52px] w-full rounded-[14px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">
                  Phone / WhatsApp optional
                </span>
                <input
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="07123 456789"
                  className="h-[52px] w-full rounded-[14px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">
                  What is this about?
                </span>
                <select
                  name="topic"
                  required
                  defaultValue=""
                  className="h-[52px] w-full rounded-[14px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold outline-none transition focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                >
                  <option value="" disabled>
                    Choose a topic
                  </option>
                  <option value="Cleaning booking">Cleaning booking</option>
                  <option value="Pricing question">Pricing question</option>
                  <option value="Commercial contract">
                    Commercial contract
                  </option>
                  <option value="General question">General question</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">
                  Message
                </span>
                <textarea
                  name="message"
                  required
                  minLength={10}
                  placeholder="Tell us what you need..."
                  className="h-[130px] w-full resize-none rounded-[14px] border border-[#dfe5ee] bg-white px-4 py-3 text-[15px] font-semibold outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                />
              </label>

              <button
                type="submit"
                className="mt-2 h-[56px] rounded-[16px] bg-[#0b8f41] px-6 text-[16px] font-black text-white shadow-[0_14px_32px_rgba(11,143,65,0.22)] transition hover:bg-[#08783f]"
              >
                Send message →
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-3">
          <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">
              Customers
            </p>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.035em]">
              Booking support
            </h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#556177]">
              Ask about an existing booking, property details or what is
              included in a Quickola clean.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">
              Support
            </p>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.035em]">
              General questions
            </h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#556177]">
              Message us about Quickola Property Services, accessibility or
              general support.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">
              Contracts
            </p>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.035em]">
              Commercial enquiries
            </h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#556177]">
              Property managers and businesses can discuss a tailored
              managed-cleaning setup.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
