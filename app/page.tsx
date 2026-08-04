import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "STR turnover coordination and property-ready proof | Quickola",
  description:
    "Add properties, invite the cleaners you already use, coordinate turnovers and receive proof when each property is guest-ready.",
  alternates: { canonical: "/" },
};

const steps = [
  [
    "01",
    "Add your property",
    "Save the address, timings, access details and guest-ready standard.",
  ],
  [
    "02",
    "Invite your cleaner",
    "Add the cleaner or contractor you already trust. Quickola does not supply cleaners.",
  ],
  [
    "03",
    "Coordinate the turnover",
    "Set the changeover window, assign the work and follow progress.",
  ],
  [
    "04",
    "Confirm it is ready",
    "Required tasks, photos and issue checks determine the final readiness state.",
  ],
];
const faqs = [
  [
    "Does Quickola provide cleaners?",
    "No. Quickola is coordination software for operators who already have their own cleaner or cleaning contractor.",
  ],
  [
    "How is a property marked ready?",
    "The cleaner must submit completion, finish every mandatory task, provide required photos and notes, confirm key return where required, and resolve every blocking issue.",
  ],
  [
    "Does Quickola handle cleaning payments?",
    "No. Rates, invoices and payments remain between you and your cleaner or contractor.",
  ],
  [
    "Can I create turnovers manually?",
    "Yes. Manual turnover creation is the complete V1 workflow. Calendar integrations may be added later, but are not presented as available today.",
  ],
];

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  if (query.code)
    redirect(`/auth/callback?purpose=signup-confirmation&code=${encodeURIComponent(query.code)}`);
  return (
    <main className="min-h-screen bg-white text-[#071638]">
      <PublicNav />
      <section className="overflow-hidden bg-[#071a3a] px-4 py-10 text-white sm:px-8 sm:py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1180px] gap-8 sm:gap-12 lg:grid-cols-[.93fr_1.07fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[.12em] text-[#8db9ef]">
              For Airbnb hosts and property managers
            </p>
            <h1 className="mt-4 text-[2.5rem] font-extrabold leading-[1.04] tracking-[-.045em] sm:text-6xl">
              Stop a missed clean becoming your next bad review.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/78">
              See whether every property is ready before the next guest
              arrives—with cleaner confirmation, checklists, photos and issues
              in one place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/business/sign-up"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 font-extrabold text-[#071a3a]"
              >
                Start free — takes 2 minutes
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-6 font-extrabold"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-3 text-sm font-bold text-white/65">
              No card required · Start with one property · Use your existing
              cleaner
            </p>
          </div>
          <DashboardPreview />
        </div>
      </section>
      <section
        aria-label="Product principles"
        className="border-b px-5 py-5 sm:px-8"
      >
        <div className="mx-auto grid max-w-[1180px] gap-3 text-sm font-extrabold sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Bring your own cleaner",
            "Property-specific checklists",
            "Completion evidence",
            "Clear property-ready status",
          ].map((x) => (
            <p key={x} className="flex items-center gap-2">
              <span className="text-emerald-600" aria-hidden="true">
                ●
              </span>
              {x}
            </p>
          ))}
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[.12em] text-[#2d67b2]">
              Bring your own cleaner
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.03em] sm:text-5xl">
              Clear operations without changing who does the work.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#657089]">
              Quickola gives operators and their existing cleaners one shared
              record for assignments, standards, progress, evidence and issues.
              It is not a marketplace or managed cleaning service.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [
                "A standard for every property",
                "Store checkout and check-in times, access details, bed setup, linen instructions and an editable checklist.",
              ],
              [
                "Proof attached to the work",
                "Require completion photos, task evidence, notes and key-return confirmation instead of relying on chat messages.",
              ],
              [
                "Issues surfaced early",
                "Cleaners can report access, damage, linen, supply and timing problems. Blocking issues prevent a ready decision.",
              ],
            ].map(([h, p]) => (
              <article key={h} className="border-t-2 border-[#173e70] pt-5">
                <h3 className="text-xl font-extrabold">{h}</h3>
                <p className="mt-3 leading-7 text-[#657089]">{p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="how-it-works" className="bg-[#f3f6f9] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1120px]">
          <p className="text-sm font-extrabold uppercase tracking-[.12em] text-[#2d67b2]">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-.03em] sm:text-5xl">
            From checkout to guest-ready.
          </h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-[#dfe4eb] md:grid-cols-4">
            {steps.map(([n, h, p]) => (
              <li key={n} className="bg-white p-6">
                <p className="text-sm font-extrabold text-[#2d67b2]">{n}</p>
                <h3 className="mt-8 text-xl font-extrabold">{h}</h3>
                <p className="mt-3 text-sm leading-6 text-[#657089]">{p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[.12em] text-[#2d67b2]">
              Property-ready verification
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.03em] sm:text-5xl">
              Ready is a decision backed by evidence.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#657089]">
              A completion button alone is not enough. Quickola evaluates the
              checklist, required photos and notes, key return and unresolved
              issues on the server. If something is missing, the operator sees
              exactly what remains.
            </p>
          </div>
          <div className="border-l-4 border-emerald-600 bg-emerald-50 p-7">
            <p className="text-xs font-extrabold tracking-[.12em] text-emerald-800">
              PROPERTY READY
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-emerald-950">
              Harbour View is guest-ready
            </h3>
            <p className="mt-3 text-emerald-900">
              Verified 14:18 · 12 mandatory tasks · 6 evidence files · no
              blocking issues
            </p>
            <p className="mt-5 border-t border-emerald-200 pt-4 text-sm text-emerald-900">
              Example product state
            </p>
          </div>
        </div>
      </section>
      <section className="bg-[#071a3a] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-[900px]">
          <p className="text-sm font-extrabold uppercase tracking-[.12em] text-[#8db9ef]">
            Straight answers
          </p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-5xl">
            What operators need to know.
          </h2>
          <div className="mt-8 divide-y divide-white/15">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold">
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p className="max-w-3xl pb-2 leading-7 text-white/68">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="px-5 py-16 text-center sm:px-8">
        <h2 className="text-3xl font-extrabold tracking-[-.03em] sm:text-5xl">
          Know the next guest can check in.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[#657089]">
          Start with one property, its readiness standard and the cleaner you
          already use.
        </p>
        <Link
          href="/business/sign-up"
          className="mt-7 inline-flex min-h-12 items-center rounded-lg bg-[#071f49] px-6 font-extrabold text-white"
        >
          Start free — no card required
        </Link>
      </section>
      <footer className="border-t px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 text-sm text-[#657089] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Quickola</p>
          <div className="flex gap-5">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/business/sign-in">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PublicNav() {
  return (
    <header className="border-b bg-white px-5 sm:px-8">
      <div className="mx-auto flex h-17 max-w-[1180px] items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold"
        >
          <Image
            src="/quickola/logo-mark.png"
            alt=""
            width={34}
            height={34}
            priority
          />
          Quickola
        </Link>
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 text-sm font-bold md:flex"
        >
          <Link href="/product">Product</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/business">For STR operators</Link>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/business/sign-in"
            className="inline-flex min-h-11 items-center px-3 text-sm font-bold"
          >
            Sign in
          </Link>
          <Link
            href="/business/sign-up"
            className="inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-4 text-sm font-extrabold text-white"
          >
            Create account
          </Link>
        </div>
        <details className="group relative sm:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border px-3 font-bold">
            Menu
          </summary>
          <nav
            aria-label="Primary navigation"
            className="absolute right-0 top-12 z-40 grid w-64 gap-1 rounded-lg border bg-white p-3 shadow-xl"
          >
            <Link
              className="min-h-11 rounded-lg px-3 py-3 font-bold"
              href="/product"
            >
              Product
            </Link>
            <Link
              className="min-h-11 rounded-lg px-3 py-3 font-bold"
              href="/#how-it-works"
            >
              How it works
            </Link>
            <Link
              className="min-h-11 rounded-lg px-3 py-3 font-bold"
              href="/business"
            >
              For STR operators
            </Link>
            <Link
              className="min-h-11 rounded-lg px-3 py-3 font-bold"
              href="/business/sign-in"
            >
              Sign in
            </Link>
            <Link
              className="min-h-11 rounded-lg bg-[#071f49] px-3 py-3 text-center font-extrabold text-white"
              href="/business/sign-up"
            >
              Create account
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
function DashboardPreview() {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/15 bg-white p-2 shadow-2xl sm:p-3">
      <Image
        src="/106.png"
        alt="Quickola dashboard preview showing property readiness and upcoming guest arrivals"
        width={1536}
        height={1024}
        className="h-auto w-full rounded-lg object-cover"
        priority
      />
      <figcaption className="hidden px-2 pb-1 pt-2 text-right text-xs font-semibold text-[#59677d] sm:block">
        Product preview
      </figcaption>
    </figure>
  );
}
