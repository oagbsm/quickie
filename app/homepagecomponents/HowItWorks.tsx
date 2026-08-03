function ServiceIcon({ type }: { type: "home" | "airbnb" | "tenancy" }) {
  const common = "h-7 w-7 fill-none stroke-current stroke-[1.8]";
  if (type === "home") return <svg viewBox="0 0 32 32" className={common} aria-hidden="true"><path d="m5 14 11-9 11 9v13H5Z" strokeLinejoin="round"/><path d="M12 27v-8h8v8M22 8l3 2.5" strokeLinecap="round"/><path d="m22.5 14 .8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8Z" fill="currentColor" stroke="none"/></svg>;
  if (type === "airbnb") return <svg viewBox="0 0 32 32" className={common} aria-hidden="true"><path d="M5 17h22v9H5zM8 17v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5M9 13h5M18 13h5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 26v2M24 26v2" strokeLinecap="round"/><path d="m25 4 .8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8Z" fill="currentColor" stroke="none"/></svg>;
  return <svg viewBox="0 0 32 32" className={common} aria-hidden="true"><path d="M8 5h13v22H8zM21 10h4v17h-4" strokeLinejoin="round"/><circle cx="17" cy="16" r="1" fill="currentColor" stroke="none"/><path d="m4 24 3-3M4 21l3 3M24 8l3-3M24 5l3 3" strokeLinecap="round"/></svg>;
}

const services = [
  { type: "home" as const, title: "Property standards", text: "Keep access details, timings and guest-ready requirements with each property." },
  { type: "airbnb" as const, title: "Booking-driven turnovers", text: "Turn each guest changeover into a clear clean workflow around checkout and arrival." },
  { type: "tenancy" as const, title: "Checklist and evidence", text: "Give your existing cleaner one place to complete tasks, add evidence and report issues." },
];
const steps = [
  ["01", "Add your property", "Save the timings, access details and guest-ready standard."],
  ["02", "Invite your cleaner", "Bring the cleaner or contractor you already use into the workspace."],
  ["03", "Coordinate to ready", "Assign the turnover, follow progress and know when the property is ready."],
];

export default function HowItWorks() {
  return <>
    <section id="services" className="bg-white px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto max-w-[1120px]"><div className="max-w-[650px]"><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#079448]">STR turnover coordination</p><h2 className="mt-3 text-[36px] font-black leading-[1.03] tracking-[-.045em] sm:text-[48px]">One clear workflow.<br/>Every property ready.</h2><p className="mt-4 text-[16px] font-semibold leading-7 text-[#667188]">Bring your bookings, existing cleaners and property standards into one operational workflow.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{services.map((service, index) => <article key={service.title} className={`rounded-[24px] border p-6 sm:p-7 ${index === 1 ? "border-[#cfe9d7] bg-[#f3faf5]" : "border-[#e3e9f0] bg-white"}`}><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#071638] text-[#4bd35f]"><ServiceIcon type={service.type}/></span><h3 className="mt-6 text-[22px] font-black tracking-[-.035em]">{service.title}</h3><p className="mt-2 text-[14px] font-semibold leading-6 text-[#68738a]">{service.text}</p><a href="#how" className="mt-6 inline-flex text-[13px] font-black text-[#07833f]">See the workflow <span className="ml-2">→</span></a></article>)}</div></div></section>
    <section id="how" className="bg-[#f5f7f9] px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto max-w-[1120px]"><div className="text-center"><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#079448]">How Quickola works</p><h2 className="mt-3 text-[36px] font-black tracking-[-.045em] sm:text-[48px]">Coordinate every clean without the admin.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{steps.map(([number, title, text]) => <div key={number} className="rounded-[22px] bg-white p-6 shadow-[0_10px_30px_rgba(7,22,56,.04)]"><span className="text-[12px] font-black tracking-[.12em] text-[#079448]">{number}</span><h3 className="mt-8 text-[20px] font-black">{title}</h3><p className="mt-2 text-[14px] font-semibold leading-6 text-[#68738a]">{text}</p></div>)}</div></div></section>
    <section className="bg-[#061a3d] px-5 py-14 text-white sm:px-8"><div className="mx-auto flex max-w-[1120px] flex-col gap-6 rounded-[24px] border border-white/10 bg-white/5 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#4bd35f]">For STR operators</p><h2 className="mt-2 text-[28px] font-black sm:text-[36px]">Keep every turnover moving.</h2><p className="mt-3 max-w-[690px] text-[14px] font-semibold leading-6 text-white/68">Bring your existing cleaners, bookings and property standards into one coordinated workflow.</p></div><a href="/business/sign-up" className="inline-flex h-13 shrink-0 items-center justify-center rounded-xl bg-[#4bd35f] px-7 text-[14px] font-black text-[#061a3d]">Create account →</a></div></section>
  </>;
}
