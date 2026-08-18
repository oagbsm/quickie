"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { submitConsumerJob as submitConsumerJobServer } from "@/app/post-job/actions";
import { getJob, getService, marketplaceServices, type MarketplaceJob, type PricingQuestion } from "@/app/data/marketplace";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = { initialService?: string; initialPostcode?: string; initialLocation?: string; initialJob?: string; error?: string; onStarted?: () => void };
type Step = 1 | 2 | 3 | 4;
const input = "mt-2 min-h-12 w-full rounded-xl border border-[#dfe5ee] bg-white px-4 py-3 text-[15px] font-semibold text-[#061b3f] outline-none focus:border-[#23a955] focus:ring-4 focus:ring-[#e9f9ee]";
const featured = ["cleaning", "gardening", "handyman", "plumbing", "electrical", "removals", "furniture-assembly", "painting"];
const servicePickerIcons: Record<string, string> = {
  cleaning: "/icons/services/cleaning.svg",
  gardening: "/icons/services/gardening.svg",
  handyman: "/icons/services/handyman.svg",
  "furniture-assembly": "/icons/services/assembly.svg",
  plumbing: "/icons/services/plumbing.svg",
  electrical: "/icons/services/electrical.svg",
  removals: "/icons/services/moving.svg",
  painting: "/icons/services/painting.svg",
};
const locationIds = ["postcode", "when", "date", "fromPostcode", "toPostcode"];

export default function ConsumerJobComposer({ initialService = "", initialPostcode = "", initialLocation = "", initialJob = "", error = "", onStarted }: Props) {
  const [categorySlug, setCategorySlug] = useState(initialService);
  const [jobSlug, setJobSlug] = useState(initialJob);
  const [answers, setAnswers] = useState<Record<string, string | number>>(initialPostcode ? { postcode: initialPostcode } : {});
  const [moreOpen, setMoreOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [budgetMode, setBudgetMode] = useState<"open" | "set">("open");
  const [budget, setBudget] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<Step>(initialJob ? 2 : 1);
  const [submissionKey] = useState(() => crypto.randomUUID());
  const composerRef = useRef<HTMLDivElement>(null);
  const [submissionState, action, pending] = useActionState(submitConsumerJobServer, { message: "" });
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const auth = createSupabaseBrowserClient();
    void auth.auth.getSession().then((result: { data: { session: Session | null } }) => setAuthenticated(Boolean(result.data.session))).catch(() => setAuthenticated(false));
  }, []);

  const service = getService(categorySlug);
  const activeJobSlug = jobSlug || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("job") || "" : "");
  const selectedJob = getJob(categorySlug, activeJobSlug);
  const questions = useMemo(() => selectedJob?.pricingQuestions.filter((question) => !question.showWhen || question.showWhen.values.includes(String(answers[question.showWhen.question] || ""))) || [], [selectedJob, answers]);
  const firstIncomplete = questions.findIndex((question) => question.required && !hasAnswer(question, answers));
  const ready = Boolean(selectedJob && firstIncomplete === -1);
  const detailQuestions = questions.filter((question) => !locationIds.includes(question.id));
  const locationQuestions = questions.filter((question) => locationIds.includes(question.id));
  const detailReady = detailQuestions.every((question) => !question.required || hasAnswer(question, answers));
  const locationReady = locationQuestions.every((question) => !question.required || hasAnswer(question, answers));
  const setAnswer = (id: string, value: string | number) => setAnswers((current) => ({ ...current, [id]: value }));
  const scrollToComposerOnMobile = () => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    requestAnimationFrame(() => {
      const element = composerRef.current;
      if (!element) return;
      const header = document.querySelector("header");
      const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 64;
      const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  };
  const preserveSharedAnswers = (current: Record<string, string | number>) => Object.fromEntries(Object.entries(current).filter(([key]) => locationIds.includes(key)));
  const preserveCompatibleAnswers = (current: Record<string, string | number>, nextJob: MarketplaceJob | undefined) => Object.fromEntries(Object.entries(current).filter(([key]) => nextJob?.pricingQuestions.some((question) => question.id === key) || locationIds.includes(key)));
  const reset = () => { setCategorySlug(""); setJobSlug(""); setMobileStep(1); scrollToComposerOnMobile(); };
  const selectJob = (slug: string) => {
    const nextJob = getJob(categorySlug, slug);
    setJobSlug(slug);
    setAnswers((current) => ({ ...preserveCompatibleAnswers(current, nextJob), ...(nextJob?.inferredAnswers || {}) }));
    setMobileStep(2);
    onStarted?.();
  };

  return <div ref={composerRef} id="job-composer" className="relative z-30 scroll-mt-24 rounded-[24px] bg-white p-4 pt-3 text-[#061b3f] shadow-[0_22px_60px_rgba(0,0,0,.24)] md:rounded-[28px] md:p-5 lg:border lg:border-[#e6ebef] lg:p-9">
    <div className="mb-2 md:hidden"><MobileProgress step={selectedJob ? mobileStep : 1} /></div>
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#159548]">Choose a service</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">{selectedJob ? `${selectedJob.name} ✓` : service ? service.name : "What do you need?"}</h2></div>{(service || selectedJob) && <button type="button" onClick={reset} className="min-h-11 rounded-xl px-3 text-sm font-black text-[#526078] hover:bg-[#eef8f1]">Change</button>}</div>
    {error && <p role="alert" className="mt-3 rounded-xl bg-[#fff3e7] p-3 text-base font-bold text-[#974c00]">{error}</p>}
    {!service ? <CategoryPicker moreOpen={moreOpen} onMore={() => setMoreOpen((value) => !value)} onSelect={(slug) => { setCategorySlug(slug); setJobSlug(""); setMobileStep(1); setAnswers((current) => preserveSharedAnswers(current)); scrollToComposerOnMobile(); }} /> : !selectedJob ? <JobPicker service={service} onSelect={selectJob} /> : <>
      <div className="mt-4 md:hidden"><MobileStepForm step={mobileStep} selectedJob={selectedJob} detailQuestions={detailQuestions} locationQuestions={locationQuestions} answers={answers} detailReady={detailReady} locationReady={locationReady} ready={ready} budgetMode={budgetMode} budget={budget} note={note} noteOpen={noteOpen} setAnswer={setAnswer} setStep={setMobileStep} setBudgetMode={setBudgetMode} setBudget={setBudget} setNote={setNote} setNoteOpen={setNoteOpen} onPost={() => setContactOpen(true)} /></div>
      <div className="mt-4 hidden md:block"><DesktopForm questions={questions} answers={answers} firstIncomplete={firstIncomplete} setAnswer={setAnswer} budgetMode={budgetMode} budget={budget} setBudgetMode={setBudgetMode} setBudget={setBudget} note={note} noteOpen={noteOpen} setNote={setNote} setNoteOpen={setNoteOpen} ready={ready} onPost={() => setContactOpen(true)} /></div>
    </>}
    {contactOpen && <ContactSheet authenticated={authenticated} submissionKey={submissionKey} pending={pending} message={submissionState.message} category={categorySlug} job={selectedJob} answers={answers} note={note} budget={budgetMode === "set" ? budget : ""} location={initialLocation} action={action} onClose={() => setContactOpen(false)} />}
  </div>;
}

function MobileProgress({ step }: { step: Step }) { return <div aria-label={`Step ${step} of 4`}><div className="flex items-center justify-center gap-1.5" aria-hidden="true">{[1, 2, 3, 4].map((item) => <span key={item} className={`grid h-8 w-8 place-items-center rounded-full text-base font-black ${item === step ? "bg-[#061b3f] text-white" : "border-2 border-[#d9e0e8] bg-white text-[#718096]"}`}>{item}</span>)}</div><p className="mt-0.5 text-center text-sm font-semibold text-[#66758c]">Step {step} of 4</p></div>; }

function MobileStepForm({ step, selectedJob, detailQuestions, locationQuestions, answers, detailReady, locationReady, ready, budgetMode, budget, note, noteOpen, setAnswer, setStep, setBudgetMode, setBudget, setNote, setNoteOpen, onPost }: { step: Step; selectedJob: MarketplaceJob; detailQuestions: PricingQuestion[]; locationQuestions: PricingQuestion[]; answers: Record<string, string | number>; detailReady: boolean; locationReady: boolean; ready: boolean; budgetMode: "open" | "set"; budget: string; note: string; noteOpen: boolean; setAnswer: (id: string, value: string | number) => void; setStep: (step: Step) => void; setBudgetMode: (mode: "open" | "set") => void; setBudget: (value: string) => void; setNote: (value: string) => void; setNoteOpen: (value: boolean) => void; onPost: () => void }) {
  if (step === 2) return <StepPanel title="Job details"><div className="grid gap-1">{detailQuestions.map((question) => <Question key={question.id} question={question} value={answers[question.id]} active onChange={(value) => setAnswer(question.id, value)} />)}</div><button type="button" disabled={!detailReady} onClick={() => setStep(3)} className="mt-5 min-h-12 w-full rounded-xl bg-[#23dc63] px-5 text-base font-black disabled:opacity-40">Continue</button></StepPanel>;
  if (step === 3) return <StepPanel title="Where & when"><div className="grid gap-1">{locationQuestions.map((question) => <Question key={question.id} question={question} value={answers[question.id]} active onChange={(value) => setAnswer(question.id, value)} />)}</div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setStep(2)} className="min-h-12 flex-1 rounded-xl border border-[#dfe5ee] px-4 text-base font-black">Back</button><button type="button" disabled={!locationReady} onClick={() => setStep(4)} className="min-h-12 flex-1 rounded-xl bg-[#23dc63] px-4 text-base font-black disabled:opacity-40">Continue</button></div></StepPanel>;
  if (step === 4) return <StepPanel title="Budget & post"><BudgetChoice mode={budgetMode} value={budget} onModeChange={setBudgetMode} onChange={setBudget} /><button type="button" onClick={() => setNoteOpen(!noteOpen)} className="mt-3 min-h-11 text-left text-base font-black text-[#167d3c]">{noteOpen ? "− Hide note" : "+ Add a note"} <span className="font-normal text-[#707b8d]">(optional)</span></button>{noteOpen && <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="Anything else we should know? (optional)" className={input} />}<div className="mt-5 flex gap-2"><button type="button" onClick={() => setStep(3)} className="min-h-12 flex-1 rounded-xl border border-[#dfe5ee] px-4 text-base font-black">Back</button><button type="button" disabled={!ready || (budgetMode === "set" && !budget)} onClick={onPost} className="min-h-12 flex-1 rounded-xl bg-[#23dc63] px-4 text-base font-black disabled:opacity-40">Post what you need</button></div></StepPanel>;
  return <StepPanel title={selectedJob.name}><p className="text-sm text-[#707b8d]">Your service is selected. Continue to add the details people need to send an offer.</p><button type="button" onClick={() => setStep(2)} className="mt-5 min-h-12 w-full rounded-xl bg-[#23dc63] px-5 text-base font-black">Start job details</button></StepPanel>;
}

function StepPanel({ title, children }: { title: string; children: ReactNode }) { return <section><h3 className="text-lg font-black tracking-[-.02em]">{title}</h3>{children}</section>; }
function DesktopForm({ questions, answers, firstIncomplete, setAnswer, budgetMode, budget, setBudgetMode, setBudget, note, noteOpen, setNote, setNoteOpen, ready, onPost }: { questions: PricingQuestion[]; answers: Record<string, string | number>; firstIncomplete: number; setAnswer: (id: string, value: string | number) => void; budgetMode: "open" | "set"; budget: string; setBudgetMode: (mode: "open" | "set") => void; setBudget: (value: string) => void; note: string; noteOpen: boolean; setNote: (value: string) => void; setNoteOpen: (value: boolean) => void; ready: boolean; onPost: () => void }) { return <>{questions.map((question, index) => <Question key={question.id} question={question} value={answers[question.id]} active={index <= firstIncomplete || firstIncomplete === -1} onChange={(value) => setAnswer(question.id, value)} />)}<BudgetChoice mode={budgetMode} value={budget} onModeChange={setBudgetMode} onChange={setBudget} /><button type="button" onClick={() => setNoteOpen(!noteOpen)} className="mt-3 min-h-11 text-left text-base font-black text-[#167d3c]">{noteOpen ? "− Hide note" : "+ Add a note"} <span className="font-normal text-[#707b8d]">(optional)</span></button>{noteOpen && <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="Anything else we should know? (optional)" className={input} />}<button type="button" disabled={!ready || (budgetMode === "set" && !budget)} onClick={onPost} className="mt-4 min-h-12 w-full rounded-xl bg-[#23dc63] px-5 text-base font-black disabled:opacity-40">Post what you need</button></>; }
function CategoryPicker({ moreOpen, onMore, onSelect }: { moreOpen: boolean; onMore: () => void; onSelect: (slug: string) => void }) { const services = moreOpen ? marketplaceServices : marketplaceServices.filter((item) => featured.includes(item.slug)); return <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:gap-4">{services.map((item) => <button type="button" key={item.slug} onClick={() => onSelect(item.slug)} aria-label={`Choose ${item.shortName}`} className="flex h-16 min-h-16 items-center justify-center gap-1.5 rounded-2xl border border-[#e3e8ef] px-2 text-base font-black text-[#061b3f] hover:border-[#23a955] hover:bg-[#eef8f1] md:h-auto md:min-h-12 md:rounded-xl lg:h-[72px] lg:min-h-[72px] lg:gap-3 lg:rounded-[15px] lg:text-[18px]"><span className="grid h-[38px] w-[38px] shrink-0 place-items-center md:h-10 md:w-10"><Image src={servicePickerIcons[item.slug] || item.image} alt="" width={40} height={40} className="h-full w-full object-contain" /></span>{item.shortName}</button>)}<button type="button" onClick={onMore} className="col-span-2 h-16 min-h-16 rounded-2xl border border-dashed border-[#b8c4bd] px-2 text-base font-black text-[#167d3c] hover:bg-[#eef8f1] md:col-span-1 md:h-auto md:min-h-12 md:rounded-xl lg:col-span-1 lg:h-[72px] lg:min-h-[72px] lg:rounded-[15px] lg:text-[18px]">{moreOpen ? "Fewer" : "More services"}</button></div>; }
function JobPicker({ service, onSelect }: { service: NonNullable<ReturnType<typeof getService>>; onSelect: (slug: string) => void }) { return <div className="mt-4"><p className="text-base font-black">What needs doing?</p><div className="mt-2 grid gap-2 md:grid-cols-2">{service.jobs.filter((item) => item.active).map((item) => <button type="button" key={item.slug} onClick={() => onSelect(item.slug)} className="min-h-11 rounded-xl border border-[#e6ebef] px-3 text-left text-base font-black hover:border-[#23a955] hover:bg-[#eef8f1]">{item.name}</button>)}</div></div>; }
function hasAnswer(question: PricingQuestion, answers: Record<string, string | number>) { const value = answers[question.id]; return value !== undefined && value !== "" && value !== 0; }
function BudgetChoice({ mode, value, onModeChange, onChange }: { mode: "open" | "set"; value: string; onModeChange: (mode: "open" | "set") => void; onChange: (value: string) => void }) { return <fieldset className="mt-5 rounded-xl border border-[#e6ebef] p-3"><legend className="px-1 text-sm font-black">Budget <span className="font-normal text-[#707b8d]">(optional)</span></legend><div className="mt-1 grid gap-2 text-sm font-semibold"><label className="flex items-center gap-2"><input type="radio" name="budget-choice" checked={mode === "open"} onChange={() => onModeChange("open")} />Open to offers</label><label className="flex items-center gap-2"><input type="radio" name="budget-choice" checked={mode === "set"} onChange={() => onModeChange("set")} />I have a budget</label></div><p className="mt-2 text-xs text-[#707b8d]">{mode === "open" ? "You’ll see prices before choosing anyone." : "People can still send their own price."}</p>{mode === "set" && <label className="mt-3 block text-sm font-black">£ <input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" type="number" min="1" max="100000" step="0.01" placeholder="150" className="ml-1 min-h-11 w-40 rounded-xl border border-[#dfe5ee] bg-white px-3 font-semibold outline-none focus:border-[#23a955]" /></label>}</fieldset>; }
function Question({ question, value, active, onChange }: { question: PricingQuestion; value?: string | number; active: boolean; onChange: (value: string | number) => void }) { if (!active) return null; const label = question.id === "postcode" ? "Where is the job?" : question.id === "when" ? "When do you need it?" : question.label; if (question.type === "postcode") return <label className="mt-4 block text-base font-black">{label}<input value={String(value || "")} onChange={(event) => onChange(event.target.value.toUpperCase())} placeholder={question.placeholder} className={input} /></label>; if (question.type === "counter") return <div className="mt-4 flex min-h-12 items-center justify-between rounded-xl border border-[#e6ebef] px-3"><span className="text-base font-black">{label}</span><div className="flex items-center gap-3"><button type="button" onClick={() => onChange(Math.max(0, Number(value || 0) - 1))} aria-label={`Decrease ${label}`} className="grid h-10 w-10 place-items-center rounded-full bg-[#f0f3f6] text-lg font-black">−</button><span className="w-5 text-center font-black">{value || 0}</span><button type="button" onClick={() => onChange(Number(value || 0) + 1)} aria-label={`Increase ${label}`} className="grid h-10 w-10 place-items-center rounded-full bg-[#061b3f] text-lg font-black text-white">+</button></div></div>; if (question.type === "date") return <label className="mt-4 block text-base font-black">{label}<input type="date" value={String(value || "")} onChange={(event) => onChange(event.target.value)} className={input} /></label>; return <div className="mt-4"><p className="text-base font-black">{label}</p><div className="mt-2 flex flex-wrap gap-2">{(question.options || []).map((option) => <button type="button" key={option} onClick={() => onChange(option)} className={`min-h-11 rounded-xl border px-4 text-sm font-black ${value === option ? "border-[#23a955] bg-[#eef8f1] text-[#167d3c]" : "border-[#e6ebef]"}`}>{option}</button>)}</div></div>; }
function ContactSheet({ authenticated, submissionKey, pending, message, category, job, answers, note, budget, location, action, onClose }: { authenticated: boolean; submissionKey: string; pending: boolean; message: string; category: string; job: MarketplaceJob | undefined; answers: Record<string, string | number>; note: string; budget: string; location: string; action: (formData: FormData) => void; onClose: () => void }) { return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#061b3f]/55 p-3"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-5 text-[#061b3f] shadow-2xl sm:p-7"><h2 className="text-2xl font-black">{authenticated ? "Post your job" : "Get quotes from local people"}</h2><p className="mt-2 text-sm leading-5 text-[#707b8d]">{authenticated ? "Your job will be posted immediately and local people who can help can send private offers." : "Save your job and start receiving offers."}</p>{message && <p role="alert" className="mt-4 rounded-xl bg-[#fff3e7] p-3 text-sm font-bold text-[#974c00]">{message}</p>}<form action={action} className="mt-5"><input type="hidden" name="submissionKey" value={submissionKey} /><input type="hidden" name="category" value={category} /><input type="hidden" name="service" value={job?.slug || ""} /><input type="hidden" name="answers" value={JSON.stringify(answers)} /><input type="hidden" name="postcode" value={String(answers.postcode || answers.fromPostcode || "")} /><input type="hidden" name="when" value={String(answers.when || answers.date || "")} /><input type="hidden" name="budget" value={budget} /><input type="hidden" name="description" value={note} /><input type="hidden" name="location" value={location} />{job && job.photoRequirement !== "none" && <label className="mt-4 block text-sm font-black">Add photos <span className="font-normal text-[#707b8d]">({job.photoRequirement})</span><input name="photos" type="file" accept="image/*" multiple className="mt-2 block w-full text-sm" /></label>}<button disabled={pending} className="mt-5 min-h-12 w-full rounded-xl bg-[#23dc63] px-5 text-sm font-black disabled:opacity-60">{pending ? "Posting your job…" : authenticated ? "Post job & get quotes" : "Continue with email"}</button></form>{!authenticated && <p className="mt-3 text-center text-xs text-[#707b8d]">Your job will be posted immediately after signing in.</p>}<button type="button" onClick={onClose} className="mt-3 w-full text-sm font-black text-[#707b8d]">Cancel</button></div></div>; }
