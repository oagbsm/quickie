

export default function PrivacyPage() {
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
          Privacy policy
        </h1>

        <p className="mt-4 text-[15px] font-semibold leading-[1.65] text-[#556177]">
          Last updated: May 2026
        </p>

        <div className="mt-8 space-y-7 text-[15.5px] font-medium leading-[1.75] text-[#44506a]">
          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">1. What information we collect</h2>
            <p className="mt-2">
              Quickola may collect the service you are looking for, your selected area, your email address, your optional phone number, and any request details you submit.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">2. How we use your information</h2>
            <p className="mt-2">
              We use your information to show fair price guidance, review your request, contact you about your request, and help find a suitable local provider.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">3. Contact details</h2>
            <p className="mt-2">
              If you submit your email or phone number, we use it only to follow up about your Quickola request unless you clearly agree to something else later.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">4. Local providers</h2>
            <p className="mt-2">
              To help with your request, we may share limited request information with a suitable local provider. We aim to share only what is needed to understand the job and respond properly.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">5. Business information</h2>
            <p className="mt-2">
              If a business signs up, we may collect business name, category, areas covered, WhatsApp or phone number, starting price, availability, description, and internal review notes.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">6. Analytics and security</h2>
            <p className="mt-2">
              We may use basic analytics and security tools to understand website usage, prevent spam, detect abuse, protect the admin area, and keep Quickola working properly.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">7. How long we keep data</h2>
            <p className="mt-2">
              We keep request and business information for as long as needed to operate Quickola, handle follow-ups, improve matching, prevent abuse, and maintain business records.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">8. Your choices</h2>
            <p className="mt-2">
              You can ask us to update or delete your request information by contacting us. We may keep limited information where needed for security, legal, or record-keeping reasons.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">9. Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy as Quickola develops. The latest version will be shown on this page.
            </p>
          </section>

          <section className="rounded-[18px] border border-[#d8eddd] bg-[#f6fcf8] p-4">
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#071638]">Contact</h2>
            <p className="mt-2">
              For privacy questions, contact Quickola at <a className="font-extrabold text-[#08783f]" href="mailto:hello@quickola.com">quickolauk@gmail.com</a>.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}