import { useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Share, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createReportShare, getCleanerReport, getReportEvidenceUrls } from "@/lib/api";
import type { ReportChecklistTask, ReportData, ReportEvidence } from "@/lib/types";
import { colors, spacing, styles, typography } from "@/lib/theme";
import { formatDate, formatTime } from "@/lib/types";
import { Icon, PrimaryButton, ScreenHeader, SectionHeader, SecondaryButton } from "@/components/ui";

export default function Report() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["cleaner-report", id], queryFn: () => getCleanerReport(id), enabled: Boolean(id) });
  const report: ReportData | undefined = query.data?.report_data;
  const evidence = report?.evidence || [];
  const evidencePaths = useMemo(() => evidence.map((item) => item.storage_path).filter((path): path is string => Boolean(path)), [evidence]);
  const images = useQuery({ queryKey: ["cleaner-report-images", id, evidencePaths], queryFn: () => getReportEvidenceUrls(evidencePaths), enabled: evidencePaths.length > 0, staleTime: 5 * 60 * 1000 });
  const share = useMutation({ mutationFn: () => createReportShare(id), onSuccess: async (token) => { await Share.share({ message: `${report?.property_name || "This property"} has been completed.\nView the Quickola clean report:\nhttps://quickola.co.uk/report/${token}` }); }, onError: () => setError("Could not prepare the share link. Please try again.") });
  if (query.isLoading) return <Loading />;
  if (query.isError || !report) return <View style={[styles.screen, { justifyContent: "center", padding: spacing.lg }]}><Text style={styles.heading}>Report unavailable</Text><Text style={[styles.body, { marginTop: 7 }]}>This report could not be loaded.</Text></View>;
  const checklist = report.checklist || [];
  const issues = report.issues || [];
  const completed = checklist.filter((task) => task.completed).length;
  const imageByPath = new Map((images.data || []).filter((item) => Boolean(item.path && item.signedUrl)).map((item) => [item.path!, item.signedUrl!]));
  const groups = groupChecklist(checklist);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ScreenHeader eyebrow="CLEAN REPORT" title="Clean report" back={() => router.back()} />
    <View style={styles.card}><View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}><View style={{ flex: 1 }}><Text style={typography.card}>{report.property_name || "Completed clean"}</Text><Text style={[typography.body, { marginTop: 5 }]}>{report.address || "Address not recorded"}</Text></View><View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Icon name="check" color={colors.green} size={17} /><Text style={{ color: colors.green, fontWeight: "800" }}>Completed</Text></View></View><Text style={[typography.meta, { marginTop: spacing.md }]}>Completed {formatDateTime(report.completed_at || report.cleaning_date)}</Text><Text style={[typography.meta, { marginTop: 4 }]}>Window · {report.cleaning_start ? formatTime(report.cleaning_start) : "—"} – {report.cleaning_end ? formatTime(report.cleaning_end) : "—"}</Text><Text style={[typography.meta, { marginTop: 4 }]}>Completed by · {report.cleaner_name || "Cleaner"}</Text></View>
    <View style={summary}><SummaryItem value={`${completed}/${checklist.length}`} label="tasks" /><SummaryItem value={`${evidence.length}`} label="photos" /><SummaryItem value={`${issues.length}`} label="issues" /></View>
    {report.ai_walkthrough && <View style={[styles.card, { marginTop: spacing.md }]}><SectionHeader title="AI walkthrough" /><Text style={{ color: colors.green, fontWeight: "800" }}>✓ Completed</Text><Text style={[typography.meta, { marginTop: 5 }]}>{report.ai_walkthrough.frames_checked || 0} frames reviewed · {report.ai_walkthrough.potential_issues || 0} potential issues detected · {report.ai_walkthrough.resolved_issues || 0} resolved</Text><Text style={[typography.caption, { marginTop: spacing.sm }]}>Quickola AI checks walkthrough imagery for possible visible issues. Results are assistive and may not identify every cleaning issue.</Text></View>}
    <View style={{ marginTop: spacing.xl }}><SectionHeader title="Checklist" />{groups.map(([section, tasks]) => <View key={section} style={{ marginBottom: spacing.lg }}><Text style={styles.eyebrow}>{section}</Text>{tasks.map((task, index) => <ReportTask key={`${task.id || task.label}-${index}`} task={task} evidence={evidence} imageByPath={imageByPath} />)}</View>)}</View>
    <View style={{ marginTop: spacing.sm }}><SectionHeader title="Evidence" /><Text style={typography.body}>{evidence.length} photo{evidence.length === 1 ? "" : "s"} submitted</Text>{images.isLoading && <ActivityIndicator style={{ marginTop: spacing.sm }} color={colors.blue} />}<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm }}>{evidence.map((item, index) => { const url = item.storage_path ? imageByPath.get(item.storage_path) : undefined; return url ? <Image accessibilityLabel="Clean evidence" key={`${item.storage_path}-${index}`} source={{ uri: url }} style={largeThumb} /> : null; })}</View></View>
    <View style={{ marginTop: spacing.xl }}><SectionHeader title={`Issues${issues.length ? ` · ${issues.length}` : ""}`} />{issues.length ? issues.map((issue, index) => <View key={issue.id || index} style={issueRow}><Text style={typography.card}>{issue.title || "Issue"}</Text><Text style={[typography.body, { marginTop: 4 }]}>{issue.description || "No details recorded."}</Text></View>) : <Text style={typography.body}>No issues reported.</Text>}</View>
    <View style={{ marginTop: spacing.xl }}><PrimaryButton label={share.isPending ? "Preparing link…" : "Share report"} onPress={() => { setError(""); share.mutate(); }} disabled={share.isPending} />{error && <Text style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</Text>}<View style={{ marginTop: spacing.sm }}><SecondaryButton label="Back to Today" onPress={() => router.replace("/(tabs)/today")} /></View></View>
  </ScrollView>;
}
function ReportTask({ task, evidence, imageByPath }: { task: ReportChecklistTask; evidence: ReportEvidence[]; imageByPath: Map<string, string> }) { const taskEvidence = evidence.filter((item) => item.task_id === task.id || item.checklist_task_id === task.id); return <View style={taskRow}><View style={{ flex: 1, flexDirection: "row", gap: spacing.sm }}><Icon name={task.completed ? "check" : "issue"} color={task.completed ? colors.green : colors.muted} size={17} /><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontSize: 15, fontWeight: task.completed ? "600" : "800" }}>{task.label}</Text>{taskEvidence.length > 0 && <View style={{ flexDirection: "row", gap: 6, marginTop: 7 }}>{taskEvidence.map((item, index) => { const url = item.storage_path ? imageByPath.get(item.storage_path) : undefined; return url ? <Image accessibilityLabel="Task evidence" key={`${item.storage_path}-${index}`} source={{ uri: url }} style={thumb} /> : null; })}</View>}</View></View><Text style={{ color: task.completed ? colors.green : colors.muted, fontSize: 12, fontWeight: "800" }}>{task.completed ? "Done" : "Review"}</Text></View>; }
function SummaryItem({ value, label }: { value: string; label: string }) { return <View style={{ flex: 1, alignItems: "center" }}><Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>{value}</Text><Text style={typography.caption}>{label}</Text></View>; }
function groupChecklist(tasks: ReportChecklistTask[]) { const groups = new Map<string, ReportChecklistTask[]>(); tasks.forEach((task) => groups.set(task.section_title || "Checklist", [...(groups.get(task.section_title || "Checklist") || []), task])); return Array.from(groups.entries()); }
function formatDateTime(value?: string | null) { return value ? `${formatDate(value)} · ${formatTime(value)}` : "Not recorded"; }
const summary = { flexDirection: "row" as const, backgroundColor: colors.softBlue, borderRadius: 14, paddingVertical: spacing.md, marginTop: spacing.md };
const taskRow = { minHeight: 50, flexDirection: "row" as const, alignItems: "flex-start" as const, justifyContent: "space-between" as const, gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#eef0f2" };
const thumb = { width: 48, height: 42, borderRadius: 7, backgroundColor: colors.softBlue };
const largeThumb = { width: 96, height: 76, borderRadius: 10, backgroundColor: colors.softBlue };
const issueRow = { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#eef0f2" };
const Loading = () => <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}><ActivityIndicator color={colors.blue} /></View>;
