import Link from "next/link";
import Header from "@/app/homepagecomponents/Header";
import Footer from "@/app/components/Footer";

type Props = {
  eyebrow: string;
  title: string;
  intro: string;
  sectionTitle: string;
  sectionIntro: string;
  uses: string[];
  capabilities: [string, string][];
  scheduleTitle: string;
  schedule: string;
};

export default function SolutionPage(props: Props) {
  return (
    <div className="public-shell">
      <Header />
      <main id="main-content">
        <section className="public-hero">
          <div className="public-container">
            <p className="eyebrow !text-[#67dc79]">{props.eyebrow}</p>
            <h1 className="public-page-title mt-5 max-w-[820px]">
              {props.title}
            </h1>
            <p className="public-body-lg mt-6 max-w-[660px] text-white/75">
              {props.intro}
            </p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/create-account"
                className="public-button public-button-primary"
              >
                Create account
              </Link>
              <p className="public-note">Local marketplace currently focused on Maidenhead and nearby areas.</p>
            </div>
          </div>
        </section>
        <section className="public-section">
          <div className="public-container grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="eyebrow">Built for your workflow</p>
              <h2 className="public-section-title mt-4">
                {props.sectionTitle}
              </h2>
              <p className="public-body-lg public-muted mt-5">
                {props.sectionIntro}
              </p>
            </div>
            <ul className="border-t border-[#dbe3df]">
              {props.uses.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-b border-[#dbe3df] py-4 text-[1.02rem] font-semibold"
                >
                  <span className="text-[#08783f]" aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="public-section bg-[#f5f7f6]">
          <div className="public-container">
            <p className="eyebrow">What stays organised</p>
            <h2 className="public-section-title mt-4 max-w-[720px]">
              One clear record for the work that matters.
            </h2>
            <div className="mt-10 grid gap-x-10 gap-y-9 md:grid-cols-2">
              {props.capabilities.map(([heading, copy]) => (
                <article
                  key={heading}
                  className="border-t border-[#9eafa6] pt-5"
                >
                  <h3 className="public-card-title">{heading}</h3>
                  <p className="public-body public-muted mt-3 max-w-[520px]">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="public-section">
          <div className="public-container grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <h2 className="public-section-title">{props.scheduleTitle}</h2>
            <div>
              <p className="public-body-lg public-muted">{props.schedule}</p>
              <p className="public-note mt-5 border-l-2 border-[#08783f] pl-4">
                We review your locations, workflow requirements and preferred
                schedule before confirming the software is a fit.
              </p>
            </div>
          </div>
        </section>
        <section className="bg-[#eaf4ed] py-12">
          <div className="public-container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[clamp(1.65rem,3vw,2.1rem)] font-extrabold tracking-[-.03em]">
                Ready to coordinate your cleaning workflow?
              </h2>
              <p className="public-body public-muted mt-2">
                Tell us about your locations and the service you need.
              </p>
            </div>
            <Link
              href="/create-account"
              className="public-button public-button-primary shrink-0"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
