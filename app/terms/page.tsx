

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfd] px-4 py-10 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[860px] rounded-[26px] border border-[#e1e6ee] bg-white p-5 shadow-[0_18px_50px_rgba(7,22,56,0.06)] sm:p-8">
        <a href="/" className="inline-flex items-center gap-3 text-[14px] font-bold text-[#08783f]">
          <span>←</span>
          Back to Quickola
        </a>

        <div className="mt-8 flex items-center gap-3">
          <img src="/quickola/logo-mark.png" alt="Quickola" className="h-11 w-11 rounded-full object-contain" />
          <p className="text-[24px] font-extrabold tracking-[-0.04em]">Quickola</p>
        </div>

        <h1 className="mt-8 text-[38px] font-extrabold leading-[1.02] tracking-[-0.05em] sm:text-[52px]">
          Terms of use
        </h1>

        <p className="mt-4 text-[15px] font-semibold leading-[1.65] text-[#556177]">
          Last updated: May 2026
        </p>

        <div className="mt-8 space-y-7 text-[15.5px] font-medium leading-[1.75] text-[#44506a]">
          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">1. What Quickola does</h2>
            <p className="mt-2">
              Quickola helps users check estimated fair price ranges for local services and request help finding a suitable local provider. Price ranges shown on Quickola are estimates only and are not final quotes.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">2. No guaranteed booking</h2>
            <p className="mt-2">
              Submitting a request does not guarantee that a provider will be available, suitable, or willing to accept the job. Quickola may manually review requests and provider options before sending an update.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">3. Providers are independent</h2>
            <p className="mt-2">
              Local service providers are independent businesses or individuals. Quickola is not responsible for the quality, safety, timing, pricing, conduct, or completion of work carried out by a provider.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">4. Fair price ranges</h2>
            <p className="mt-2">
              Fair price ranges are guidance based on typical local pricing patterns. Final prices can change because of property size, job condition, urgency, travel, parts, parking, access, timing, and provider availability.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">5. User information</h2>
            <p className="mt-2">
              When you submit your email or phone number, you agree that Quickola may use those details to contact you about that request. You should only submit accurate information and only request services you genuinely need.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">6. Business listings</h2>
            <p className="mt-2">
              Businesses may be reviewed, approved, rejected, edited, or removed by Quickola at any time. Quickola does not guarantee that any business will receive leads, requests, rankings, or bookings.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">7. No misuse</h2>
            <p className="mt-2">
              You must not use Quickola to submit fake requests, spam, scrape data, impersonate another person, attack the website, or interfere with the service.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">8. Changes</h2>
            <p className="mt-2">
              Quickola may update these terms as the service develops. Continued use of Quickola means you accept the latest version of these terms.
            </p>
          </section>

          <section className="rounded-[18px] border border-[#d8eddd] bg-[#f6fcf8] p-4">
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">Contact</h2>
            <p className="mt-2">
              For questions, contact Quickola at <a className="font-extrabold text-[#08783f]" href="mailto:hello@quickola.com">hello@quickola.com</a>.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}