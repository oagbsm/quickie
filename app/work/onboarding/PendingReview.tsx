import Link from "next/link";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import { refreshProviderPayoutSetup, startProviderPayoutSetup } from "./actions";

type Props = { status: "pending_review" | "approved" | "suspended"; stripeStatus: string; profileComplete: boolean; servicesSelected: boolean; qualificationMissing: boolean; emailVerified: boolean };

export default function PendingReview({ status, stripeStatus, profileComplete, servicesSelected, qualificationMissing, emailVerified }: Props) {
  const pending = status === "pending_review";
  const fullyReady = status === "approved" && profileComplete && stripeStatus === "ready" && emailVerified && !qualificationMissing;
  const payoutReady = stripeStatus === "ready";
  const payoutInProgress = ["onboarding", "restricted", "verification_pending"].includes(stripeStatus);

  if (status === "suspended") {
    return <StatusLayout><p className="text-xs font-black uppercase tracking-[.15em] text-[#b42318]">PROVIDER ACCOUNT</p><h1 className="mt-3 text-4xl font-black">Your account is suspended</h1><p className="mt-3 max-w-2xl leading-7 text-[#657089]">Quoting is currently disabled for this provider account. Please contact Quickola if you need help understanding the next steps.</p><Link href="/work" className="mt-7 inline-flex min-h-11 items-center rounded-xl border border-[#dbe1ea] px-5 font-black">Back to provider workspace</Link></StatusLayout>;
  }

  if (!pending) {
    const requirement = !emailVerified ? "Verify your email before sending quotes." : qualificationMissing ? "Complete the required qualification checks for your selected services." : !profileComplete ? "Complete the remaining provider profile requirements." : !payoutReady ? "Complete your payout setup before sending quotes." : "";
    return <StatusLayout><p className="text-xs font-black uppercase tracking-[.15em] text-[#159548]">PROVIDER ACCOUNT</p><h1 className="mt-3 text-4xl font-black">You’re approved</h1><p className="mt-3 max-w-2xl leading-7 text-[#657089]">{fullyReady ? "You can now send quotes on matching jobs." : "Your provider application is approved, but one operational requirement remains."}</p>{fullyReady ? <Link href="/work" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">View jobs</Link> : <div className="mt-7 rounded-2xl bg-[#fff8e8] p-5"><p className="font-black text-[#8a5a00]">Still needed</p><p className="mt-2 text-sm leading-6 text-[#6c5530]">{requirement}</p>{!payoutReady && profileComplete && emailVerified && !qualificationMissing && <>{stripeStatus === "verification_pending" ? <form action={refreshProviderPayoutSetup} className="mt-4"><button className="min-h-11 rounded-xl border border-[#dbe1ea] px-4 font-black">Check payout status</button></form> : <form action={startProviderPayoutSetup} className="mt-4"><button className="min-h-11 rounded-xl bg-[#23a955] px-4 font-black text-[#061b3f]">{payoutInProgress ? "Continue payout setup" : "Set up payouts"}</button></form>}</>}</div>}</StatusLayout>;
  }

  return <StatusLayout><p className="text-xs font-black uppercase tracking-[.15em] text-[#159548]">PROVIDER APPLICATION</p><h1 className="mt-3 text-4xl font-black">You’re all signed up!</h1><p className="mt-3 max-w-2xl leading-7 text-[#657089]">Your Quickola provider application has been submitted.</p><div className="mt-7 rounded-2xl bg-[#f5fbf6] p-5"><p className="text-xl font-black text-[#167d3c]">Awaiting Quickola approval</p><p className="mt-2 leading-7 text-[#39465b]">We’re reviewing your account. We’ll let you know when you’re approved and ready to send quotes.</p></div><div className="mt-7 grid gap-3 rounded-2xl border border-[#e7ebef] bg-white p-5 font-bold"><p className={profileComplete ? "text-[#167d3c]" : "text-[#8a5a00]"}>{profileComplete ? "✓" : "•"} Profile completed</p><p className={servicesSelected ? "text-[#167d3c]" : "text-[#8a5a00]"}>{servicesSelected ? "✓" : "•"} Services selected</p><p className={payoutReady || payoutInProgress ? "text-[#167d3c]" : "text-[#8a5a00]"}>{payoutReady || payoutInProgress ? "✓" : "•"} {payoutReady ? "Payouts set up" : "Payout setup still needed"}</p><p className="text-[#167d3c]">✓ Application submitted</p></div><p className="mt-7 leading-7 text-[#657089]">You can browse available jobs while your account is being reviewed. You’ll be able to send quotes once approved and fully eligible.</p><Link href="/work" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">View available jobs</Link></StatusLayout>;
}

function StatusLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><ProviderHeader /><section className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><div className="rounded-3xl border border-[#e7ebef] bg-white p-7 sm:p-10">{children}</div></section></main>;
}
