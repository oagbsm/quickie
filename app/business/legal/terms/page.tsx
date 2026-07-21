import Link from "next/link";
export const metadata = {
  title: "Quickola Business Terms",
  description:
    "Terms for Quickola controlled-pilot business cleaning accounts.",
};
const sections = [
  [
    "1. Business service",
    "Quickola coordinates managed cleaning for organisations and professionally managed properties. Account access does not guarantee coverage or acceptance of every request.",
  ],
  [
    "2. Requests and confirmation",
    "A submitted date or time remains a request until Quickola confirms availability. The confirmed service order records the property, service, schedule, price and relevant requirements.",
  ],
  [
    "3. Prices",
    "Portal estimates use the saved property information and selected requirements. Exceptional work may require review. Any different final price must be communicated before the work proceeds.",
  ],
  [
    "4. Access and safe working",
    "The customer must provide accurate site, access, parking and hazard information and ensure safe, timely access for the agreed service.",
  ],
  [
    "5. Changes and cancellations",
    "Cancellation eligibility, notice periods and any applicable charges are stated in the confirmed service order or separately agreed account terms. Quickola will not apply an unpublished portal charge.",
  ],
  [
    "6. Service concerns",
    "Customers should contact Quickola promptly about a service concern and provide relevant booking information so it can be reviewed.",
  ],
  [
    "7. Data protection",
    "Account, property, access and booking information is handled under the Quickola Privacy Policy and used to coordinate the requested service.",
  ],
  [
    "8. Larger accounts",
    "A separately agreed service schedule, data-processing agreement or service-level agreement may supplement these terms for larger accounts.",
  ],
];
export default function Page() {
  return (
    <main className="min-h-screen bg-[#f4f6f9] px-5 py-12 text-[#071638]">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-7 shadow-sm sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#079448]">
          Controlled Slough pilot
        </p>
        <h1 className="mt-3 text-4xl font-black">Quickola Business Terms</h1>
        <p className="mt-2 text-sm font-bold text-[#657089]">
          Version: business-pilot-2026-07-22
        </p>
        {sections.map(([h, p]) => (
          <section key={h} className="mt-7">
            <h2 className="text-xl font-black">{h}</h2>
            <p className="mt-2 leading-7 text-[#44506a]">{p}</p>
          </section>
        ))}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/privacy-policy" className="font-black text-[#079448]">
            Privacy Policy
          </Link>
          <Link
            href="/business/legal/cancellation"
            className="font-black text-[#079448]"
          >
            Cancellation information
          </Link>
          <Link href="/contact" className="font-black text-[#079448]">
            Contact
          </Link>
        </div>
      </article>
    </main>
  );
}
