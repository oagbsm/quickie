import type { Metadata } from "next";
import { Suspense } from "react";
import PublicHeader from "../components/PublicHeader";
import SignInForm from "./SignInForm";
export const metadata:Metadata={title:"Sign in | Quickola",description:"Sign in to your Quickola turnover coordination account.",robots:{index:false,follow:false},alternates:{canonical:"/business/sign-in"}};
export default function Page(){return <div className="min-h-screen bg-[#f3f6f8]"><PublicHeader/><main id="main-content" className="mx-auto max-w-lg px-5 py-16"><Suspense fallback={<div className="rounded-3xl bg-white p-7 text-center font-bold">Loading sign in…</div>}><SignInForm/></Suspense></main></div>}
