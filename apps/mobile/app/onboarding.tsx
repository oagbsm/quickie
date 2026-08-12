import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { colors, styles } from "@/lib/theme";

export default function Onboarding() {
  const { session, worker, refreshWorker } = useAuth(); const router = useRouter(); const [name, setName] = useState(""); const [business, setBusiness] = useState(""); const [area, setArea] = useState(""); const [message, setMessage] = useState(""); const [pending, setPending] = useState(false); const userId = session?.user.id; const mounted = useRef(true); useEffect(() => () => { mounted.current = false; }, []);
  if (!session) return <Redirect href="/sign-in" />; if (worker) return <Redirect href="/(tabs)/today" />;
  async function finish() {
    if (!name.trim()) { setMessage("Enter your name."); return; }
    setPending(true); setMessage("");
    if (!userId) return;
    const { error: initializeError } = await supabase.rpc("initialize_direct_cleaner_profile");
    if (initializeError) {
      if (!mounted.current) return;
      setMessage(initializeError.message === "business_user_cannot_become_direct_cleaner" ? "This account is set up for business management. Use a separate cleaner account to continue." : "Couldn't create your cleaner profile. Check your connection and try again.");
      setPending(false); return;
    }
    const { error: profileError } = await supabase.from("cleaner_profiles").update({ display_name: name.trim(), business_name: business.trim() || null, service_area: area.trim() || null, onboarding_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", userId);
    if (!mounted.current) return;
    if (profileError) {
      if (__DEV__) console.error("direct_cleaner_initialization_failed", { stage: "onboarding_profile_save", message: profileError.message, code: profileError.code, standaloneCleaner: true });
      setMessage(profileError.message.toLowerCase().includes("fetch") || profileError.message.toLowerCase().includes("network") ? "Couldn't connect. Check your connection and try again." : profileError.message);
      setPending(false); return;
    }
    await refreshWorker();
    if (!mounted.current) return;
    router.replace(worker ? "/(tabs)/today" : "/");
    setPending(false);
  }
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled"><Text style={styles.eyebrow}>FIRST-TIME SETUP</Text><Text style={[styles.title, { marginTop: 8, fontSize: 29 }]}>Set up your profile</Text><Text style={[styles.body, { marginTop: 8 }]}>Tell us a little about yourself. You can add more details later.</Text><View style={form}><Text style={label}>Your name</Text><TextInput autoCapitalize="words" autoComplete="name" value={name} onChangeText={(value) => { setName(value); setMessage(""); }} style={input} placeholder="Your name" placeholderTextColor="#9aa5b5" /><Text style={[label, { marginTop: 22 }]}>Cleaning business name <Text style={optional}>(optional)</Text></Text><TextInput autoCapitalize="words" value={business} onChangeText={setBusiness} style={input} placeholder="Your business name" placeholderTextColor="#9aa5b5" /><Text style={[label, { marginTop: 22 }]}>Area or postcode <Text style={optional}>(optional)</Text></Text><TextInput value={area} onChangeText={setArea} style={input} placeholder="e.g. Slough, SL1" placeholderTextColor="#9aa5b5" />{message && <Text accessibilityLiveRegion="polite" style={error}>{message}</Text>}<Pressable disabled={pending} onPress={() => void finish()} style={[button, pending && { opacity: 0.5 }]}><Text style={buttonText}>{pending ? "Saving…" : "Continue"}</Text></Pressable></View></ScrollView></KeyboardAvoidingView>;
}
const content = { flexGrow: 1, justifyContent: "center" as const, padding: 24, paddingTop: 40, paddingBottom: 40 }; const form = { marginTop: 30, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 20 }; const label = { color: colors.ink, fontSize: 14, fontWeight: "700" as const }; const optional = { color: colors.muted, fontWeight: "400" as const }; const input = { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, color: colors.ink, fontSize: 16, marginTop: 8 }; const error = { color: colors.danger, fontSize: 14, marginTop: 12 }; const button = { minHeight: 52, borderRadius: 11, backgroundColor: colors.navy, alignItems: "center" as const, justifyContent: "center" as const, marginTop: 20 }; const buttonText = { color: colors.white, fontSize: 16, fontWeight: "800" as const };
