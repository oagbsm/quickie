import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";
import refinements from "./home-refinements.module.css";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "Managed business cleaning platform in Slough | Quickola",
  description:
    "Add properties, request one-off or recurring cleans and track every booking. Quickola manages cleaner assignment and coordination across Slough.",
  alternates: { canonical: "/" },
};

const features = [
  [
    "building",
    "Manage every property",
    "Keep addresses, access instructions and cleaning requirements together in one place.",
  ],
  [
    "calendar",
    "Request cleans quickly",
    "Choose a property, service, date and frequency through one simple booking flow.",
  ],
  [
    "document",
    "Follow every booking",
    "See when a booking is received, confirmed, assigned, in progress and completed.",
  ],
] as const;

const steps = [
  [
    "building",
    "01",
    "Add your properties",
    "Save addresses, property details and access instructions.",
  ],
  [
    "calendar",
    "02",
    "Request a clean",
    "Choose the property, service, date and frequency.",
  ],
  [
    "clean",
    "03",
    "Quickola arranges the service",
    "We assign and manage the cleaner for the booking.",
  ],
  [
    "chart",
    "04",
    "Follow the progress",
    "Track the booking from receipt through completion.",
  ],
] as const;

export default function Home() {
  return (
    <div className={styles.page}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <section className={styles.heroShell}>
        <HomeHeader />
        <main id="main-content">
          <div className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Managed business cleaning</p>
              <h1>
                <span className={refinements.heroLine}>The smarter way to</span>{" "}
                <br />
                manage every clean, <br />
                <span className={refinements.greenText}>every time.</span>
              </h1>
              <div className={styles.stroke} aria-hidden="true">
                <i />
                <i />
              </div>
              <p className={styles.intro}>
                Add properties, request one-off or recurring cleans, and track
                every booking in one place. Quickola handles the cleaning. You
                stay in control.
              </p>
              <div className={styles.heroActions}>
                <Link
                  href="/business/enquire"
                  className={`${styles.primaryButton} ${refinements.primaryCta}`}
                >
                  Request business access <span>→</span>
                </Link>
                <Link href="/how-it-works" className={styles.darkButton}>
                  See how it works <PlayIcon />
                </Link>
              </div>
              <div className={styles.heroBenefits}>
                <Benefit
                  icon="clock"
                  title="Save time"
                  text="Automate requests"
                />
                <Benefit
                  icon="target"
                  title="Booking updates"
                  text="Clear lifecycle"
                />
                <Benefit
                  icon="shield"
                  title="Managed service"
                  text="Quickola coordinates"
                />
              </div>
              <p className={styles.srOnly}>
                Controlled service currently available in Slough.
              </p>
            </div>
            <DashboardPreview />
          </div>
          <div className={styles.onboarding}>
            <Icon name="people" />
            <span>
              Now onboarding property managers and Airbnb operators across
              Slough.
            </span>
          </div>
        </main>
      </section>

      <section className={styles.featuresSection} id="for-businesses">
        <div className={styles.featuresWrap}>
          <div className={styles.featuresLead}>
            <p className={styles.greenLabel}>Built for property teams</p>
            <h2>
              Everything you need to organise property cleaning in one place.
            </h2>
          </div>
          <p className={styles.featuresIntro}>
            Keep property details, cleaning requests and booking progress
            together without relying on separate message threads.
          </p>
          <div className={styles.featureGrid}>
            {features.map(([icon, title, text], index) => (
              <Feature
                key={title}
                icon={icon}
                title={title}
                text={text}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.processSection} id="how-it-works">
        <div className={styles.processWrap}>
          <div className={styles.processHeading}>
            <p className={styles.greenLabel}>How it works</p>
            <h2>
              Simple steps.
              <br />
              Powerful results.
            </h2>
          </div>
          <ol className={styles.steps}>
            {steps.map(([icon, number, title, text], index) => (
              <Step
                key={number}
                icon={icon}
                number={number}
                title={title}
                text={text}
                index={index}
              />
            ))}
          </ol>
          <div className={`${styles.ctaPanel} ${refinements.ctaPanel}`}>
            <div>
              <h2>Ready to simplify your property cleaning?</h2>
              <p>
                Add your properties, request cleans and follow every booking
                from one place.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/business/enquire" className={styles.ctaLight}>
                Request business access <span>→</span>
              </Link>
              <Link href="#how-it-works" className={styles.ctaDark}>
                See how it works <PlayIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.trustStrip}>
        <Trust
          icon="phone"
          title="UK-based support"
          text="Here when you need us"
        />
        <Trust
          icon="shield"
          title="Managed service"
          text="Assignment by Quickola"
        />
        <Trust icon="pin" title="Serving Slough" text="Controlled pilot area" />
        <Trust
          icon="building"
          title="MATO GROUP LTD"
          text="Company number 17327292"
        />
      </footer>
      <Footer />
    </div>
  );
}

function HomeHeader() {
  const links = [
    ["How it works", "#how-it-works"],
    ["For businesses", "#for-businesses"],
  ];
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="Quickola homepage">
        <Image
          src="/quickola/logo-mark.png"
          alt=""
          width={30}
          height={31}
          priority
        />
        <span>Quickola</span>
      </Link>
      <nav aria-label="Primary navigation">
        {links.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.headerActions}>
        <Link href="/business/sign-in">Sign in</Link>
        <Link href="/business/enquire" className={refinements.headerCta}>
          Request business access <span>→</span>
        </Link>
      </div>
      <details className={styles.mobileMenu}>
        <summary>Menu</summary>
        <nav aria-label="Mobile navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          <Link href="/business/sign-in">Sign in</Link>
          <Link href="/business/enquire">Request business access</Link>
        </nav>
      </details>
    </header>
  );
}

function DashboardPreview() {
  return (
    <figure
      className={`${styles.dashboard} ${refinements.dashboard} ${refinements.imagePreview}`}
    >
      <Image
        src="/106.png"
        alt="Quickola business dashboard preview"
        width={1536}
        height={1024}
        className={refinements.previewImage}
        priority
      />
    </figure>
  );
}
function Benefit({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <span>
        <Icon name={icon} />
      </span>
      <p>
        <strong>{title}</strong>
        <small>{text}</small>
      </p>
    </div>
  );
}
function Feature({
  icon,
  title,
  text,
  index,
}: {
  icon: string;
  title: string;
  text: string;
  index: number;
}) {
  return (
    <article>
      <span className={styles[`featureIcon${index}`]}>
        <Icon name={icon} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}
function Step({
  icon,
  number,
  title,
  text,
  index,
}: {
  icon: string;
  number: string;
  title: string;
  text: string;
  index: number;
}) {
  return (
    <li className={styles[`step${index}`]}>
      {index > 0 && (
        <span className={styles.connector} aria-hidden="true">
          ⟷
        </span>
      )}
      <span className={styles.stepIcon}>
        <Icon name={icon} />
      </span>
      <b>{number}</b>
      <h3>{title}</h3>
      <p>{text}</p>
    </li>
  );
}
function Trust({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <Icon name={icon} />
      <p>
        <strong>{title}</strong>
        <span>{text}</span>
      </p>
    </div>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4Z" />
    </svg>
  );
}
function Icon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, React.ReactNode> = {
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2M9 2h6" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3 19c.5-4 2.6-6 6-6s5.5 2 6 6M14 14c3-.7 5.5 1.3 6 4" />
      </>
    ),
    trend: (
      <>
        <path d="m4 16 5-5 4 3 6-7" />
        <path d="M15 7h4v4" />
      </>
    ),
    building: (
      <>
        <path d="M5 21V4h10v17M15 9h4v12M8 8h2M8 12h2M8 16h2M13 13h2M11 21v-3h2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    document: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h4M8 16h3M15 14v5M13 17h4" />
      </>
    ),
    star: (
      <>
        <path d="m12 3 2.7 5.4 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9Z" />
      </>
    ),
    scale: (
      <>
        <path d="M12 4v17M7 21h10M5 7h14M7 7l-3 6h6Zm10 0-3 6h6Z" />
      </>
    ),
    clean: (
      <>
        <path d="M7 20h10M9 20l1-8h4l1 8M11 12V7h2v5M17 5l1-2M19 8h2M17 10l2 2M6 5 4 3" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M9 20V5M14 20v-8M19 20V3" />
      </>
    ),
    contract: (
      <>
        <path d="M4 4h8v4M4 4v16h16v-8M11 13l9-9M15 4h5v5" />
      </>
    ),
    phone: (
      <>
        <path d="M7 3 4 5c-1 7 8 16 15 15l2-3-5-3-2 2c-3-1-5-3-6-6l2-2Z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
      {paths[name]}
    </svg>
  );
}
