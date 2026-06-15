import { redirect } from "next/navigation";
import { Resend } from "resend";
import Footer from "../components/Footer";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function sendContactMessage(formData: FormData) {
  "use server";

  const apiKey = process.env.RESEND_API_KEY || "re_ZLTDwBpR_5xKZ6k9K38EoF8rpLFDukR4D";
  const adminEmail = ["matointernationalgroup@gmail.com"];
  const fromEmail = process.env.FROM_EMAIL || "Acme <onboarding@resend.dev>";

  const name = clean(formData.get("name"));
  const email = clean(formData.get("email"));
  const phone = clean(formData.get("phone"));
  const topic = clean(formData.get("topic"));
  const message = clean(formData.get("message"));

  if (!apiKey) {
    console.error("Contact email skipped: missing RESEND_API_KEY.");
    redirect("/contact?status=missing-email-config");
  }

  if (!name || !email || !topic || !message) {
    redirect("/contact?status=missing-fields");
  }

  const resend = new Resend(apiKey);

  let failedReason = "";

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New Quickola contact message: ${topic}`,
      text: [
        "New Quickola contact message",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        `Topic: ${topic}`,
        "",
        "Message:",
        message,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#071638;">
          <h2 style="margin:0 0 12px;">New Quickola contact message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>Topic:</strong> ${topic}</p>
          <hr style="border:none;border-top:1px solid #dfe8ef;margin:18px 0;" />
          <p style="white-space:pre-wrap;"><strong>Message:</strong><br />${message}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend contact email error:", error);
      failedReason = error.message || "resend-error";
    } else {
      console.log("Contact email sent:", data);
    }
  } catch (error) {
    console.error("Failed to send contact email:", error);
    failedReason = "exception";
  }

  if (failedReason) {
    redirect(`/contact?status=email-failed&reason=${encodeURIComponent(failedReason)}`);
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

  if (status === "missing-email-config") {
    return (
      <div className="mb-5 rounded-[18px] border border-[#ffd6a8] bg-[#fff7ed] p-4 text-[14px] font-extrabold text-[#9a4b00]">
        Email is not configured yet. Add RESEND_API_KEY in .env.local.
      </div>
    );
  }

  if (status === "email-failed") {
    return (
      <div className="mb-5 rounded-[18px] border border-[#ffd0d0] bg-[#fff1f1] p-4 text-[14px] font-extrabold text-[#a11b1b]">
        Message could not be sent. Check the terminal logs for the exact Resend error.
      </div>
    );
  }

  return null;
}

export const metadata = {
  title: "Contact Quickola | Fair Price Checks in Slough",
  description:
    "Contact Quickola for Slough fair-price checks, provider questions, partnerships or local service support.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams?.status;

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#071638]">
      <section className="relative overflow-hidden bg-[#071638] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(63,196,118,0.25),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(54,124,255,0.22),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[12px] font-black uppercase tracking-[0.14em] text-white/85">
              Contact Quickola
            </div>
            <h1 className="mt-6 max-w-[760px] text-[44px] font-black leading-[0.96] tracking-[-0.065em] sm:text-[64px]">
              Need help with a Slough price check?
            </h1>
            <p className="mt-5 max-w-[620px] text-[18px] font-medium leading-[1.65] text-white/76">
              Message us about customer requests, price questions, wrong prices, partnerships or anything Quickola-related.
            </p>
            <div className="mt-7 grid max-w-[620px] gap-3 sm:grid-cols-3">
              {["Fast reply", "No spam", "Slough-first"].map((item) => (
                <div key={item} className="rounded-[18px] border border-white/12 bg-white/10 p-4 text-[14px] font-black text-white">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/12 bg-white p-5 text-[#071638] shadow-[0_30px_80px_rgba(0,0,0,0.22)] sm:p-6">
            <StatusMessage status={status} />
            <form action={sendContactMessage} className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">Your name</span>
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className="h-[52px] w-full rounded-[14px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-[52px] w-full rounded-[14px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">Phone / WhatsApp optional</span>
                <input
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="07123 456789"
                  className="h-[52px] w-full rounded-[14px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">What is this about?</span>
                <select
                  name="topic"
                  required
                  defaultValue=""
                  className="h-[52px] w-full rounded-[14px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold outline-none transition focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
                >
                  <option value="" disabled>
                    Choose a topic
                  </option>
                  <option value="Customer price check">Customer price check</option>
                  <option value="Wrong price or service info">Wrong price or service info</option>
                  <option value="Partnership">Partnership</option>
                  <option value="General question">General question</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-extrabold">Message</span>
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
              <p className="text-center text-[13px] font-semibold text-[#607089]">
                We’ll only use your details to reply. No spam.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-3">
          <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Customers</p>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.035em]">Ask about a price</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#556177]">
              Send us a quote or job detail and we’ll help you understand what looks fair before booking.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Support</p>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.035em]">General questions</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#556177]">
              Message us about Quickola, local service pricing, customer requests or partnership questions.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Corrections</p>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.035em]">Report a price issue</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#556177]">
              Tell us if a service range looks wrong, outdated or too vague for Slough users.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}