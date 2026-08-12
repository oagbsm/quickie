import { Modal, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActionRow, Icon } from "@/components/ui";
import { colors, radii, spacing, styles } from "@/lib/theme";

export default function QuickActions() {
  const router = useRouter();
  const close = () => router.replace("/(tabs)/today");
  return <Modal visible transparent animationType="slide" onRequestClose={close}><View style={{ flex: 1, justifyContent: "flex-end" }}><Pressable accessibilityLabel="Close add sheet" onPress={close} style={{ flex: 1, backgroundColor: "rgba(7,22,56,0.42)" }} /><View style={sheet}><View style={handle} /><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}><View><Text style={styles.eyebrow}>ADD NEW</Text><Text style={[styles.heading, { fontSize: 25, marginTop: 5 }]}>Add new</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={8} style={closeButton}><Icon name="×" color={colors.ink} size={24} /></Pressable></View><ActionRow icon="scan" title="AI walkthrough" description="Scan a property for visible issues" onPress={() => router.replace("/walkthrough/instant")} /><ActionRow icon="add" title="Add clean" description="Schedule work for yourself or a client" onPress={() => router.replace("/add-job")} /><ActionRow icon="host" title="Add client or property" description="Keep your existing work organised" onPress={() => router.replace("/invite-host")} /></View></View></Modal>;
}
const sheet = { backgroundColor: colors.white, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: spacing.lg, paddingBottom: 34, ...({ shadowColor: colors.ink, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 8 } as object) };
const handle = { width: 42, height: 4, borderRadius: 3, backgroundColor: colors.border, alignSelf: "center" as const, marginBottom: spacing.lg };
const closeButton = { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: "center" as const, justifyContent: "center" as const };
