import Footer from "../components/Footer";

export const metadata = {
  title: "Privacy Policy | Quickola",
  description:
    "Read Quickola's privacy policy, including what information we collect, how we use it, and how to contact us.",
};

const lastUpdated = "6 May 2026";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e8ef] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[66px] w-full max-w-[1120px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="Quickola homepage">
          <img
            src="/quickola/logo-mark.png"
            alt="Quickola"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span className="text-[25px] font-extrabold leading-none tracking-[-0.035em] text-[#071638]">
            Quickola
          </span>
        </a>

        <a
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#dfe5ee] bg-white px-4 text-[14px] font-bold text-[#071638] shadow-[0_6px_14px_rgba(7,22,56,0.035)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2]"
        >
          Back home
        </a>
      </div>
    </header>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[#edf0f5] pt-7 first:border-t-0 first:pt-0">
      <h2 className="text-[22px] font-black leading-[1.15] tracking-[-0.03em] text-[#071638]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15.5px] font-semibold leading-[1.7] text-[#44506a]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfd] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <Header />

      <section className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[28px] border border-[#dfe5ee] bg-white p-5 shadow-[0_18px_55px_rgba(7,22,56,0.055)] sm:p-8 lg:p-10">
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#08783f]">
            Privacy Policy
          </p>

          <h1 className="mt-3 max-w-[780px] text-[38px] font-black leading-[1.04] tracking-[-0.055em] text-[#071638] sm:text-[52px]">
            How Quickola handles your information
          </h1>

          <p className="mt-4 max-w-[760px] text-[16px] font-semibold leading-[1.65] text-[#44506a] sm:text-[17px]">
            Quickola helps people check fair local service prices and request a local match. This policy explains what information we collect, why we collect it, and how we protect it.
          </p>

          <div className="mt-5 inline-flex rounded-full border border-[#d8eddd] bg-[#f1faf4] px-4 py-2 text-[13px] font-black text-[#08783f]">
            Last updated: {lastUpdated}
          </div>

          <div className="mt-9 space-y-8">
            <Section title="1. Who we are">
              <p>
                Quickola is a local service price-check and request-matching platform. Our website helps users check guide price ranges for services such as cleaning, removals, plumbing, locksmiths, gardening and other local services.
              </p>
              <p>
                In this policy, “Quickola”, “we”, “us” and “our” refer to the Quickola service.
              </p>
            </Section>

            <Section title="2. Information we collect">
              <p>We may collect information you provide when you use our website or submit a request, including:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Your name, if you provide it.</li>
                <li>Your email address.</li>
                <li>Your phone number, if you provide it.</li>
                <li>The service you need, such as plumber, cleaner, man and van, locksmith or similar.</li>
                <li>Your area or postcode-level location.</li>
                <li>Job details, urgency, property/job type and other information you choose to submit.</li>
                <li>Messages or enquiries you send to us.</li>
              </ul>
              <p>
                We may also collect basic technical information such as device type, browser type, pages visited and approximate analytics data to understand how people use the website.
              </p>
            </Section>

            <Section title="3. How we use your information">
              <p>We use your information to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Show or improve guide price ranges for local services.</li>
                <li>Receive and manage your service request.</li>
                <li>Contact you about your request.</li>
                <li>Help find a suitable local provider where available.</li>
                <li>Improve Quickola, including our website, categories, price logic and user experience.</li>
                <li>Prevent misuse, spam or fraudulent requests.</li>
                <li>Comply with legal obligations where required.</li>
              </ul>
            </Section>

            <Section title="4. Sharing your information">
              <p>
                We do not sell your personal information.
              </p>
              <p>
                If you request a local match, we may share the relevant job details with a suitable local provider so they can understand the request. We aim to share only what is needed to help with the job. We do not publish your request publicly.
              </p>
              <p>
                We may also share information with service providers that help us operate Quickola, such as website hosting, database, analytics, email or security tools. These providers should only process the information for the purposes of helping us run the service.
              </p>
            </Section>

            <Section title="5. Providers and completed jobs">
              <p>
                If you are a local service provider, we may collect business information such as your business name, service category, areas covered, contact details, availability, prices, job status, completed jobs, notes, reviews or customer feedback.
              </p>
              <p>
                We may use this information to decide whether to send future requests, improve matching quality, prevent poor customer experiences and maintain trust on Quickola.
              </p>
            </Section>

            <Section title="6. Cookies and analytics">
              <p>
                Quickola may use cookies or similar technologies to keep the website working, understand performance, measure traffic and improve the product.
              </p>
              <p>
                Analytics information is generally used in an aggregated way, for example to understand which pages are visited, which categories are popular and where users drop off.
              </p>
            </Section>

            <Section title="7. How long we keep information">
              <p>
                We keep personal information only for as long as reasonably necessary for the purposes described in this policy, including managing requests, improving the service, resolving disputes, preventing misuse and meeting legal or accounting requirements.
              </p>
              <p>
                Request information may be kept so we can understand demand, improve price ranges and track whether a job was completed or followed up.
              </p>
            </Section>

            <Section title="8. Your rights">
              <p>
                Depending on where you live, you may have rights over your personal information, including the right to access, correct, delete, restrict or object to certain processing of your data.
              </p>
              <p>
                To make a request, contact us using the details below. We may need to verify your identity before acting on your request.
              </p>
            </Section>

            <Section title="9. Security">
              <p>
                We take reasonable steps to protect your information from unauthorised access, loss, misuse or disclosure. No online service can guarantee complete security, but we aim to keep data access limited and appropriate.
              </p>
            </Section>

            <Section title="10. Children">
              <p>
                Quickola is not intended for children. We do not knowingly collect personal information from children.
              </p>
            </Section>

            <Section title="11. Changes to this policy">
              <p>
                We may update this privacy policy as Quickola develops. If we make material changes, we will update the date at the top of this page.
              </p>
            </Section>

            <Section title="12. Contact us">
              <p>
                If you have questions about this privacy policy or how your information is handled, contact us at:
              </p>
              <p>
                <a href="mailto:hello@quickola.co.uk" className="font-black text-[#08783f] underline underline-offset-4">
                  hello@quickola.co.uk
                </a>
              </p>
            </Section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
