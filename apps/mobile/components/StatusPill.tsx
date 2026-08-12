import { Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { statusLabel } from "@/lib/types";

export function StatusPill({ status }: { status: string }) { const done = ["ready", "evidence_submitted"].includes(status); const danger = status === "action_required"; return <View accessibilityLabel={`Status: ${statusLabel[status] || status.replaceAll("_", " ")}`} style={{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: danger ? colors.softRed : done ? colors.softGreen : colors.softBlue }}><Text style={{ color: danger ? colors.danger : done ? colors.green : colors.blue, fontSize: 11, fontWeight: "800" }}>{statusLabel[status] || status.replaceAll("_", " ")}</Text></View>; }
