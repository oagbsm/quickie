import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors, styles } from "@/lib/theme";

export default function AuthCallback() { const { code } = useLocalSearchParams<{ code?: string }>(); const [error, setError] = useState(""); const [ready, setReady] = useState(false); useEffect(() => { let active = true; if (!code) { setError("This confirmation link is invalid or has expired."); return () => { active = false; }; } void supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => { if (!active) return; if (exchangeError) { if (__DEV__) console.error("cleaner_signup_failed", { stage: "auth_confirmation", message: exchangeError.message, status: exchangeError.status, code: exchangeError.code }); setError("This confirmation link is invalid or has expired."); } else setReady(true); }); return () => { active = false; }; }, [code]); if (error) return <View style={[styles.screen, { justifyContent: "center", padding: 24 }]}><View style={styles.card}><Text style={styles.heading}>{error}</Text></View></View>; if (ready) return <Redirect href="/" />; return <View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={colors.blue} /></View>; }
