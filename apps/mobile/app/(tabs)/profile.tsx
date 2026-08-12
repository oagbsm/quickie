import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { colors, spacing, styles, typography } from "@/lib/theme";
import { Icon, ProfileRow, ScreenHeader, SectionHeader } from "@/components/ui";
import { displayName } from "@/lib/types";

export default function Profile() {
  const { worker, standaloneCleaner, user, signOut } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState("Not enabled");
  const cleanerName = displayName(worker?.display_name || standaloneCleaner?.display_name, "Cleaner");
  const initials = useMemo(() => cleanerName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), [cleanerName]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!Constants.isDevice) return;
      const permissions = await Notifications.getPermissionsAsync();
      if (mounted) setNotifications(permissions.granted ? "Notifications enabled" : "Not enabled");
    })();
    return () => { mounted = false; };
  }, []);

  async function enableNotifications() {
    if (!worker) return Alert.alert("Notifications", "Notifications for assigned work are not available on this profile yet.");
    if (!Constants.isDevice) return Alert.alert("Use a physical device", "Push tokens are not available in the simulator.");
    if (notifications === "Notifications enabled") return;
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return setNotifications("Not enabled");
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const { error } = await supabase.from("worker_push_tokens").upsert({ worker_id: worker.id, user_id: user!.id, token, platform: "expo" }, { onConflict: "token" });
    if (error) Alert.alert("Could not save notifications", "Try again later.");
    else setNotifications("Notifications enabled");
  }

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ScreenHeader title="Profile" subtitle="You and your cleaning work." />
    <View style={[identity, { marginBottom: spacing.lg }]}><View style={avatar}><Text style={avatarText}>{initials}</Text></View><View style={{ flex: 1 }}><Text style={typography.card}>{cleanerName}</Text>{standaloneCleaner?.business_name && <Text style={[typography.body, { marginTop: 3 }]}>{displayName(standaloneCleaner.business_name)}</Text>}{standaloneCleaner?.service_area && <Text style={[typography.meta, { marginTop: 4 }]}>{standaloneCleaner.service_area}</Text>}</View></View>
    <Section title="MY WORK">
      <ProfileRow icon="host" label="Clients" detail="Keep every client and clean organised" onPress={() => router.push("/(tabs)/clients")} />
      <ProfileRow icon="calendar" label="Properties" detail="Access details and instructions in one place" onPress={() => router.push("/add-job")} />
      <ProfileRow icon="check" label="Completed cleans" detail="Your work history and proof of completed jobs" onPress={() => router.push("/(tabs)/jobs")} />
      <ProfileRow icon="report" label="Clean reports" detail="Professional proof of every completed clean" onPress={() => router.push("/reports")} />
    </Section>
    <Section title="WORK PREFERENCES">
      <ProfileRow icon="profile" label="Personal details" detail="Name and email" onPress={() => router.push("/profile/edit")} />
      <ProfileRow icon="host" label="Cleaning business" detail={standaloneCleaner?.business_name ? displayName(standaloneCleaner.business_name) : "Add a business name"} onPress={() => router.push("/profile/edit")} />
      <ProfileRow icon="calendar" label="Service area" detail={standaloneCleaner?.service_area || "Add an area"} onPress={() => router.push("/profile/edit")} />
      <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}><Text style={rowLabel}>Quickola job offers</Text><Text style={typography.meta}>Coming later · no offers available yet</Text></View>
    </Section>
    <Section title="APP">
      <View style={preference}><View style={iconCircle}><Icon name="settings" size={18} /></View><View style={{ flex: 1 }}><Text style={rowLabel}>Notifications</Text><Text style={typography.meta}>Updates about assigned work.</Text><Text style={[typography.caption, { color: notifications === "Notifications enabled" ? colors.green : colors.muted, marginTop: 3 }]}>{notifications}</Text></View><Pressable accessibilityRole="button" onPress={() => void enableNotifications()} style={smallButton}><Text style={{ color: colors.blue, fontWeight: "800", fontSize: 12 }}>{notifications === "Notifications enabled" ? "Enabled" : "Enable"}</Text></Pressable></View>
      <ProfileRow icon="settings" label="Settings" detail="App preferences" />
    </Section>
    <Section title="ACCOUNT"><Pressable accessibilityRole="button" onPress={() => void signOut().then(() => router.replace("/sign-in"))} style={{ minHeight: 50, justifyContent: "center" }}><Text style={{ color: colors.danger, fontSize: 15, fontWeight: "700" }}>Sign out</Text></Pressable></Section>
  </ScrollView>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={{ marginBottom: spacing.lg }}><SectionHeader title={title} /><View style={{ backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: spacing.sm }}>{children}</View></View>; }
const identity = { backgroundColor: colors.white, borderRadius: 18, padding: spacing.lg, flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.md }; const avatar = { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.navy, alignItems: "center" as const, justifyContent: "center" as const }; const avatarText = { color: colors.white, fontSize: 21, fontWeight: "900" as const }; const preference = { minHeight: 82, flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.sm }; const iconCircle = { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.softBlue, alignItems: "center" as const, justifyContent: "center" as const }; const rowLabel = { color: colors.ink, fontSize: 15, fontWeight: "800" as const }; const smallButton = { minHeight: 40, borderRadius: 10, backgroundColor: colors.softBlue, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: spacing.sm };
