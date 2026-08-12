import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { StandaloneCleaner, Worker } from "./types";

type SignUpInput = { email: string; password: string };
type AuthValue = { session: Session | null; user: User | null; worker: Worker | null; standaloneCleaner: StandaloneCleaner | null; cleanerAccess: boolean; loading: boolean; error: string | null; signIn: (email: string, password: string) => Promise<string | null>; signUp: (input: SignUpInput) => Promise<{ error: string | null; session: Session | null; existing: boolean }>; resetPassword: (email: string) => Promise<string | null>; signOut: () => Promise<void>; refreshWorker: () => Promise<void> };
const Context = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); const [worker, setWorker] = useState<Worker | null>(null); const [standaloneCleaner, setStandaloneCleaner] = useState<StandaloneCleaner | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const mountedRef = useRef(true); const lastResolvedAccess = useRef<string | null>(null);
  useEffect(() => {
    let mounted = true; let generation = 0; mountedRef.current = true;
    const resolveAccess = async (userId: string, currentGeneration: number) => {
      const active = () => mounted && currentGeneration === generation;
      if (!active()) return;
      const workerResult = await supabase.from("workers").select("id,display_name,email,mobile,status,invitation_status,account_id").eq("user_id", userId).eq("status", "active").eq("invitation_status", "accepted").maybeSingle();
      if (!active()) return;
      if (workerResult.error) { setError("We could not verify cleaner access."); setWorker(null); } else setWorker((workerResult.data as Worker | null) || null);
      const directResult = await supabase.from("cleaner_profiles").select("user_id,role,display_name,business_name,service_area,onboarding_completed_at,interested_in_marketplace_work,workspace_account_id").eq("user_id", userId).maybeSingle();
      if (!active()) return;
      if (directResult.error && directResult.error.code !== "42P01") setError("We could not verify cleaner access.");
      setStandaloneCleaner((directResult.data as StandaloneCleaner | null) || null);
      let standaloneFound = Boolean(directResult.data);
      if (!workerResult.data && (!directResult.data || !directResult.data.workspace_account_id) && !directResult.error) {
        if (__DEV__) console.log("direct_cleaner_initialization_started", { stage: "direct_cleaner_initialization_started", standaloneCleaner: true });
        const { data: initialized, error: initializeError } = await supabase.rpc("initialize_direct_cleaner_profile");
        if (initializeError) {
          if (__DEV__ && userId && initializeError.code !== "42501") console.error("direct_cleaner_initialization_failed", { stage: "direct_cleaner_initialization_failed", message: initializeError.message, code: initializeError.code, standaloneCleaner: true });
        } else if (initialized) {
          if (__DEV__) console.log("direct_cleaner_initialization_succeeded", { stage: "direct_cleaner_initialization_succeeded", standaloneCleaner: true });
          const refreshed = await supabase.from("cleaner_profiles").select("user_id,role,display_name,business_name,service_area,onboarding_completed_at,interested_in_marketplace_work,workspace_account_id").eq("user_id", userId).maybeSingle();
          if (!active()) return;
          setStandaloneCleaner((refreshed.data as StandaloneCleaner | null) || null);
          standaloneFound = Boolean(refreshed.data);
        }
      }
      if (__DEV__ && active()) { const accessState = `${standaloneFound}:${Boolean(workerResult.data)}`; if (lastResolvedAccess.current !== accessState) { lastResolvedAccess.current = accessState; console.log("cleaner_access_resolved", { stage: "cleaner_access_resolved", standaloneCleaner: standaloneFound, invitedCleaner: Boolean(workerResult.data) }); } }
    };
    const applySession = (next: Session | null) => {
      if (!mounted) return;
      const currentGeneration = ++generation; setSession(next); setError(null); setLoading(true);
      if (!next?.user) { setWorker(null); setStandaloneCleaner(null); setLoading(false); return; }
      void resolveAccess(next.user.id, currentGeneration).finally(() => { if (mounted && currentGeneration === generation) setLoading(false); });
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setTimeout(() => applySession(next), 0); });
    return () => { mounted = false; mountedRef.current = false; listener.subscription.unsubscribe(); };
  }, []);
  const value = useMemo<AuthValue>(() => ({ session, user: session?.user || null, worker, standaloneCleaner, cleanerAccess: Boolean(worker || standaloneCleaner), loading, error,
    signIn: async (email, password) => { setError(null); const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }); if (signInError) return signInError.message; return null; },
    signUp: async ({ email, password }) => { setError(null); const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { emailRedirectTo: "quickola://auth/callback", data: { account_kind: "quickola_cleaner" } } }); if (signUpError) { if (__DEV__) console.error("direct_cleaner_initialization_failed", { stage: "auth_signup", message: signUpError.message, status: signUpError.status, code: signUpError.code, standaloneCleaner: true }); const text = signUpError.message.toLowerCase(); return { error: signUpError.code === "user_already_exists" || text.includes("already registered") ? "An account already exists with this email." : text.includes("fetch") || text.includes("network") ? "Couldn't connect. Check your connection and try again." : signUpError.message, session: null, existing: false }; } return { error: null, session: data.session, existing: Boolean(data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) }; },
    resetPassword: async (email) => { const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase()); return resetError ? resetError.message : null; }, signOut: async () => { await supabase.auth.signOut(); }, refreshWorker: async () => { if (!session?.user || !mountedRef.current) return; setLoading(true); setTimeout(() => { if (!mountedRef.current || !session.user) return; void (async () => { const { data } = await supabase.from("cleaner_profiles").select("user_id,role,display_name,business_name,service_area,onboarding_completed_at,interested_in_marketplace_work,workspace_account_id").eq("user_id", session.user.id).maybeSingle(); if (mountedRef.current) { setStandaloneCleaner((data as StandaloneCleaner | null) || null); setLoading(false); } })(); }, 0); }
  }), [session, worker, standaloneCleaner, loading, error]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error("AuthProvider is missing"); return value; }
