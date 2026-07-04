import Footer from "../components/Footer";

export const metadata = {
  title: "Terms of Use | Quickola",
  description:
    "Read Quickola's terms of use, including fair price guides, provider matching, contact sharing and user responsibilities.",
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

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfd] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <Header />

      <section className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[28px] border border-[#dfe5ee] bg-white p-5 shadow-[0_18px_55px_rgba(7,22,56,0.055)] sm:p-8 lg:p-10">
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#08783f]">
            Terms of Use
          </p>

          <h1 className="mt-3 max-w-[780px] text-[38px] font-black leading-[1.04] tracking-[-0.055em] text-[#071638] sm:text-[52px]">
            Terms for using Quickola
          </h1>

          <p className="mt-4 max-w-[760px] text-[16px] font-semibold leading-[1.65] text-[#44506a] sm:text-[17px]">
            Quickola helps users check fair local service price ranges and request a local provider match. These terms explain how the service works and what users and providers should expect.
          </p>

          <div className="mt-5 inline-flex rounded-full border border-[#d8eddd] bg-[#f1faf4] px-4 py-2 text-[13px] font-black text-[#08783f]">
            Last updated: {lastUpdated}
          </div>

          <div className="mt-9 space-y-8">
            <Section title="1. What Quickola does">
              <p>
                Quickola is a fair-price and provider comparison engine. We help users check guide price ranges, compare options and request help finding a suitable provider.
              </p>
              <p>
                Quickola is starting with local services such as cleaning, removals, plumbing, locksmiths, gardening and similar services. Over time, Quickola may expand into other provider categories.
              </p>
            </Section>

            <Section title="2. Price ranges are guides only">
              <p>
                Any price range shown on Quickola is an estimate or guide only. It is not a final quote, guarantee or fixed offer.
              </p>
              <p>
                Final prices can change because of job size, property condition, urgency, location, travel, parking, access, parts, materials, availability, provider pricing and other details confirmed after your request.
              </p>
            </Section>

            <Section title="3. No automatic booking">
              <p>
                Submitting a request on Quickola does not automatically book a provider. You can check a price range first and continue only if you want help finding a local match.
              </p>
              <p>
                Quickola may manually review requests, provider availability and price information before sending you a next step.
              </p>
            </Section>

            <Section title="4. Contact sharing and consent">
              <p>
                We do not aim to share your contact details with providers automatically. Where possible, we first check provider availability and then ask whether you are happy for your details to be shared.
              </p>
              <p>
                If you ask us to connect you with a provider, you agree that Quickola may use your submitted details to contact you about that request and, where appropriate, share relevant job details with a suitable provider.
              </p>
            </Section>

            <Section title="5. Providers are independent">
              <p>
                Local service providers are independent businesses or individuals. Quickola may help introduce or match users and providers, but the final work is carried out by the provider, not by Quickola.
              </p>
              <p>
                Quickola is not responsible for the quality, safety, timing, pricing, conduct, materials, damage, loss, cancellation, refund, dispute or completion of work carried out by an independent provider.
              </p>
            </Section>

            <Section title="6. Provider standards">
              <p>
                Quickola may track provider response speed, completed jobs, customer feedback, no-shows, complaints, pricing behaviour and reliability.
              </p>
              <p>
                Providers with repeated poor feedback, no-shows, unfair pricing, rude behaviour or poor communication may be removed from future Quickola matches.
              </p>
            </Section>

            <Section title="7. User responsibilities">
              <p>
                You should provide accurate request details and only submit requests for services you genuinely need. You should not submit fake requests, misleading information, spam or abusive content.
              </p>
              <p>
                You are responsible for checking final provider details, scope, price, timing and terms before allowing a provider to start work.
              </p>
            </Section>

            <Section title="8. Provider responsibilities">
              <p>
                Providers should respond honestly, confirm availability clearly, explain prices before starting, attend as agreed, communicate professionally and complete work to a reasonable standard.
              </p>
              <p>
                If a provider agrees to a Quickola completed-job fee or provider plan, the provider is responsible for paying the agreed fee when due.
              </p>
            </Section>

            <Section title="9. No guarantee of availability or results">
              <p>
                Quickola does not guarantee that a provider will be available, suitable, affordable, accepted by you, or able to complete the job.
              </p>
              <p>
                Quickola may decide not to match a request if we cannot find a suitable provider or if the request appears unsuitable, unsafe, fake or outside our current coverage.
              </p>
            </Section>

            <Section title="10. Payments">
              <p>
                At launch, users may usually pay providers directly unless Quickola states otherwise. Any payment arrangement should be confirmed clearly before work begins.
              </p>
              <p>
                Quickola may charge providers for completed jobs, subscriptions, provider tools, profiles or other services. Any provider fees should be agreed separately.
              </p>
            </Section>

            <Section title="11. No misuse">
              <p>
                You must not use Quickola to scrape data, attack the website, impersonate another person or business, submit fraudulent requests, abuse providers or users, bypass platform rules, or interfere with the service.
              </p>
            </Section>

            <Section title="12. Changes to the service and terms">
              <p>
                Quickola is developing quickly. We may change, pause, remove or expand features, categories, pricing, provider rules, matching processes and these terms over time.
              </p>
              <p>
                Continued use of Quickola means you accept the latest version of these terms.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                For questions about these terms, contact Quickola at:{" "}
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