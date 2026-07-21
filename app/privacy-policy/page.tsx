import Header from "../homepagecomponents/Header";
import Footer from "../components/Footer";
export const metadata = {
  title: "Privacy Policy | Quickola Property Services",
  description:
    "How Quickola uses and protects customer and booking information.",
};
const sections = [
  [
    "Information we collect",
    "Business contact details, address and postcode, property and cleaning details, access instructions, priorities, booking history, communications and payment status where applicable.",
  ],
  [
    "How we use it",
    "To assess business enquiries, operate accounts, calculate prices, arrange and deliver cleaning, communicate about services, provide support, prevent abuse and maintain business records.",
  ],
  [
    "Who receives it",
    "We share only the information needed with people and systems involved in operating Quickola and delivering an agreed service, including hosting, database, communications and security processors acting for us.",
  ],
  [
    "How long we keep it",
    "We retain information only as long as needed for bookings, support, legal obligations, safety, fraud prevention and business records.",
  ],
  [
    "Your choices",
    "You may ask to access, correct or delete information, object to or restrict some uses, or raise a concern with the UK Information Commissioner’s Office.",
  ],
  [
    "Contact",
    "Privacy questions and requests can be submitted through the Quickola contact form.",
  ],
];
export default function Privacy() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#071638]">
      <Header />
      <section className="mx-auto max-w-[900px] px-5 pb-16 pt-28 sm:px-8 lg:pt-40">
        <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#079448]">
          Privacy policy
        </p>
        <h1 className="mt-3 text-[44px] font-black tracking-[-.05em]">
          Your information, handled with care.
        </h1>
        <p className="mt-3 text-[14px] font-semibold text-[#667188]">
          Last updated 22 July 2026
        </p>
        <div className="mt-8 space-y-4">
          {sections.map(([title, text]) => (
            <section
              key={title}
              className="rounded-[18px] border border-[#e1e8ef] bg-white p-6"
            >
              <h2 className="text-[20px] font-black">{title}</h2>
              <p className="mt-2 text-[15px] font-semibold leading-7 text-[#536079]">
                {text}
              </p>
            </section>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
