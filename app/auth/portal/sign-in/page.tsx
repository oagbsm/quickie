import { Suspense } from "react";
import PublicHeader from "../../../business/components/PublicHeader";
import SignInForm from "../../../business/sign-in/SignInForm";

export default function Page() { return <div className="min-h-screen bg-[#f3f6f8]"><PublicHeader/><main id="main-content" className="mx-auto max-w-lg px-5 py-16"><Suspense fallback={<div className="rounded-3xl bg-white p-7 text-center font-bold">Loading sign in…</div>}><SignInForm/></Suspense></main></div>; }
