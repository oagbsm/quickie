import { useMemo } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CollapsibleSection, EmptyState, FeaturedJobCard, JobCard, PrimaryButton, ProgressBar } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getJob, getJobs, transition } from "@/lib/api";
import { displayName, primaryAction } from "@/lib/types";
import { colors, spacing, styles, typography } from "@/lib/theme";

export default function Today() {
  const { worker, standaloneCleaner } = useAuth(); const router = useRouter(); const client = useQueryClient(); const owner = worker?.id || standaloneCleaner?.user_id;
  const query = useQuery({ queryKey: ["jobs", owner, "today"], queryFn: () => getJobs(worker?.id || null, "today", standaloneCleaner?.user_id), enabled: Boolean(owner), refetchInterval: 60_000 });
  const jobs = useMemo(() => query.data || [], [query.data]);
  const primary = useMemo(() => [...jobs].sort((a, b) => { const active = (status: string) => ["in_progress", "action_required"].includes(status); if (active(a.status) !== active(b.status)) return active(a.status) ? -1 : 1; return new Date(a.access_start_at).getTime() - new Date(b.access_start_at).getTime(); })[0], [jobs]);
  const detail = useQuery({ queryKey: ["job", primary?.id, "today-detail"], queryFn: () => getJob(primary!.id, worker?.id || null, standaloneCleaner?.user_id), enabled: Boolean(owner && primary), retry: 1 });
  const mutation = useMutation({ mutationFn: ({ id, next }: { id: string; next: string }) => transition(id, next), onSuccess: () => { void client.invalidateQueries({ queryKey: ["jobs"] }); void client.invalidateQueries({ queryKey: ["job", primary?.id] }); } });
  if (query.isLoading) return <Loading />;
  if (query.isError) return <View style={[styles.screen, { justifyContent: "center", padding: spacing.lg }]}><View style={styles.card}><Text style={styles.heading}>Couldn’t load Home</Text><Text style={[styles.body, { marginTop: 8, marginBottom: spacing.md }]}>Check your connection and try again.</Text><PrimaryButton label="Try again" onPress={() => void query.refetch()} /></View></View>;
  const taskList = detail.data?.checklist_tasks || []; const evidence = detail.data?.evidence_submissions || []; const completed = taskList.filter((task) => task.completed && (!task.photo_required || evidence.some((item) => item.checklist_task_id === task.id && item.storage_path))).length; const active = Boolean(primary && ["in_progress", "action_required"].includes(primary.status)); const action = primary ? primaryAction[primary.status] : undefined; const firstName = displayName(worker?.display_name || standaloneCleaner?.display_name, "there").split(/\s+/)[0];
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: spacing.lg }]} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.blue} />}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg }}><View><Text style={typography.meta}>GOOD MORNING</Text><Text style={[styles.title, { marginTop: 4 }]}>Hi, {firstName}</Text><Text style={[styles.body, { marginTop: 4 }]}>{jobs.length ? `${jobs.length} job${jobs.length === 1 ? "" : "s"} today` : "Your cleaner workspace"}</Text></View><View style={notification}><Text style={{ color: colors.ink, fontSize: 18 }}>♢</Text></View></View>
    {primary ? <FeaturedJobCard job={primary} actionLabel={mutation.isPending ? "Saving…" : active ? "Continue clean" : action?.label || "View job"} onPress={() => active || !action ? router.push(`/clean/${primary.id}`) : mutation.mutate({ id: primary.id, next: action.next })} /> : <View style={styles.card}><EmptyState title={worker ? "You’re all caught up" : "Your workspace is ready"} copy={worker ? "New assigned cleans will appear here." : "Add a clean and keep the checklist, evidence and report together."} action={worker ? "View jobs" : "Add a clean"} onPress={() => router.push(worker ? "/(tabs)/jobs" : "/add-job")} /></View>}
    {primary && taskList.length > 0 && <View style={[styles.card, { marginTop: spacing.md }]}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={typography.card}>Progress today</Text><Text style={typography.meta}>{completed}/{taskList.length}</Text></View><Text style={[typography.meta, { marginTop: 5, marginBottom: 9 }]}>{active ? "Keep moving through the clean" : "Your next clean is ready"}</Text><ProgressBar value={completed / taskList.length} /></View>}
    {jobs.length > 1 && <CollapsibleSection title="Today" count={jobs.length - 1}><View>{jobs.slice(1).map((job) => <JobCard key={job.id} job={job} onPress={() => router.push(`/clean/${job.id}`)} />)}</View></CollapsibleSection>}
    <CollapsibleSection title="Upcoming" initiallyOpen={jobs.length === 0}><View style={styles.card}><Text style={typography.body}>Upcoming work will appear here as it is scheduled.</Text><View style={{ marginTop: spacing.md }}><PrimaryButton compact label="View all jobs" onPress={() => router.push("/(tabs)/jobs")} /></View></View></CollapsibleSection>
    <CollapsibleSection title="Recent activity" initiallyOpen={false}><View style={styles.card}><Text style={typography.body}>Completed cleans and reports are kept in Jobs.</Text></View></CollapsibleSection>
  </ScrollView>;
}
const notification = { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, alignItems: "center" as const, justifyContent: "center" as const, borderWidth: 1, borderColor: colors.border };
const Loading = () => <View style={[styles.screen, { padding: spacing.md }]}><View style={[styles.card, { height: 170, marginTop: spacing.lg, opacity: 0.65 }]} /><View style={[styles.card, { height: 82, marginTop: spacing.md, opacity: 0.45 }]} /></View>;
