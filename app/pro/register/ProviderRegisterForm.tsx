import ProviderGoogleButton from "../login/ProviderGoogleButton";

export default function ProviderRegisterForm({ signupIntent = false }: { signupIntent?: boolean }) {
  return <div className="mt-6 rounded-2xl border border-[#e7ebef] bg-white p-5"><p className="text-sm leading-6 text-[#657089]">Use your Google account to create and manage your Quickola provider profile.</p><ProviderGoogleButton next={signupIntent ? "/pro/register" : "/work/onboarding"} /><p className="mt-3 text-center text-xs font-bold text-[#8a95a5]">Quick, secure and no password needed.</p></div>;
}
