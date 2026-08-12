import { Pressable, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors, styles } from "@/lib/theme";

export default function NoAccess() { const { session, signOut } = useAuth(); const router = useRouter(); if (!session) return <Redirect href="/sign-in" />; return <View style={[styles.screen, { justifyContent: "center", padding: 24 }]}><View style={styles.card}><Text style={styles.eyebrow}>ACCOUNT ACCESS</Text><Text style={[styles.title, { fontSize: 26, marginTop: 8 }]}>This account can’t use cleaner tools</Text><Text style={[styles.body, { marginTop: 12 }]}>Your account has a restriction that prevents cleaner access. Your own Quickola work is not affected by a host or business relationship being removed.</Text><Pressable onPress={() => void signOut().then(() => router.replace("/sign-in"))} style={{ minHeight: 50, borderRadius: 10, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginTop: 22 }}><Text style={{ color: colors.white, fontWeight: "800" }}>Sign out</Text></Pressable></View></View>; }
