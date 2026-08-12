import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, JobCard } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getJobs, getMarketplaceOpportunities } from "@/lib/api";
import type { MarketplaceOpportunity } from "@/lib/types";
import { colors, spacing, styles } from "@/lib/theme";

type Tab = "upcoming" | "in_progress" | "completed" | "opportunities";
type OpportunityFilter = "all" | "today" | "tomorrow";
const labels: Record<Tab, string> = { upcoming: "Upcoming", in_progress: "In progress", completed: "Completed", opportunities: "Available" };
const pretty = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Jobs() {
  const { worker, standaloneCleaner } = useAuth(); const router = useRouter(); const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState<OpportunityFilter>("all"); const [area, setArea] = useState("All areas");
  const owner = worker?.id || standaloneCleaner?.user_id;
  const jobs = useQuery({ queryKey: ["jobs", owner, tab], queryFn: () => getJobs(worker?.id || null, tab as "upcoming" | "in_progress" | "completed", standaloneCleaner?.user_id), enabled: Boolean(owner && tab !== "opportunities") });
  const opportunities = useQuery({ queryKey: ["marketplace-opportunities"], queryFn: getMarketplaceOpportunities, enabled: Boolean(standaloneCleaner && tab === "opportunities") });
  const areas = useMemo(() => ["All areas", ...new Set((opportunities.data || []).map((item) => item.postcode_district))], [opportunities.data]);
  const visibleOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...(opportunities.data || [])].filter((item) => {
      const matchesSearch = !query || `${item.job_type_slug} ${item.category_slug} ${item.postcode_district} ${item.optional_note || ""}`.toLowerCase().includes(query);
      const matchesArea = area === "All areas" || item.postcode_district === area;
      const timing = (item.requested_timing || "").toLowerCase();
      const matchesTiming = filter === "all" || timing.includes(filter);
      return matchesSearch && matchesArea && matchesTiming;
    }).sort((a, b) => (a.requested_timing || "").localeCompare(b.requested_timing || ""));
  }, [area, filter, opportunities.data, search]);
  const refresh = () => tab === "opportunities" ? void opportunities.refetch() : void jobs.refetch();
  const loading = tab === "opportunities" ? opportunities.isLoading : jobs.isLoading;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={tab === "opportunities" ? opportunities.isRefetching : jobs.isRefetching} onRefresh={refresh} tintColor={colors.blue} />}>
    <View style={{ marginBottom: spacing.lg }}><Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{tab === "opportunities" ? "LOCAL MARKETPLACE" : "YOUR WORK"}</Text><Text style={[styles.title, { marginTop: 4 }]}>{tab === "opportunities" ? "Browse jobs" : "Jobs"}</Text><Text style={[styles.body, { marginTop: 4 }]}>{tab === "opportunities" ? "Find relevant local work and send a private quote." : "Your booked work and local opportunities."}</Text></View>
    <View style={tabBar}>{(Object.keys(labels) as Tab[]).filter((key) => key !== "opportunities" || Boolean(standaloneCleaner)).map((key) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={[tabButton, tab === key && selectedTab]}><Text style={{ color: tab === key ? colors.white : colors.muted, fontSize: 12, fontWeight: "800" }}>{labels[key]}</Text></Pressable>)}</View>
    {tab === "opportunities" && <MarketplaceFilters search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} area={area} setArea={setArea} areas={areas} />}
    {loading ? <ActivityIndicator style={{ marginTop: 35 }} color={colors.blue} /> : tab === "opportunities" ? <MarketplaceList opportunities={visibleOpportunities} onOpen={(id) => router.push(`/marketplace/opportunity/${id}`)} /> : jobs.data?.length ? <View style={{ marginTop: spacing.lg }}>{jobs.data.map((job) => <JobCard key={job.id} job={job} onPress={() => router.push(`/clean/${job.id}`)} />)}</View> : <View style={[styles.card, { marginTop: spacing.lg }]}><EmptyState title={tab === "in_progress" ? "No cleans in progress" : tab === "completed" ? "No completed cleans yet" : "No upcoming cleans"} copy="Your booked work will appear here." action={tab === "upcoming" ? "Add clean" : "Back to Home"} onPress={() => tab === "upcoming" ? router.push("/add-job") : router.push("/(tabs)/today")} /></View>}
  </ScrollView>;
}

function MarketplaceFilters({ search, setSearch, filter, setFilter, area, setArea, areas }: { search: string; setSearch: (value: string) => void; filter: OpportunityFilter; setFilter: (value: OpportunityFilter) => void; area: string; setArea: (value: string) => void; areas: string[] }) {
  return <View style={{ marginTop: spacing.lg }}><TextInput value={search} onChangeText={setSearch} placeholder="Search jobs or areas" placeholderTextColor={colors.muted} style={searchInput} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>{(["all", "today", "tomorrow"] as OpportunityFilter[]).map((value) => <Pressable key={value} onPress={() => setFilter(value)} style={[chip, filter === value && activeChip]}><Text style={{ color: filter === value ? colors.white : colors.ink, fontSize: 12, fontWeight: "800" }}>{value === "all" ? "Any timing" : pretty(value)}</Text></Pressable>)}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{areas.map((value) => <Pressable key={value} onPress={() => setArea(value)} style={[chip, area === value && activeChip]}><Text style={{ color: area === value ? colors.white : colors.ink, fontSize: 12, fontWeight: "800" }}>{value}</Text></Pressable>)}</ScrollView></ScrollView></View>;
}

function MarketplaceList({ opportunities, onOpen }: { opportunities: MarketplaceOpportunity[]; onOpen: (id: string) => void }) {
  if (!opportunities.length) return <View style={[styles.card, { marginTop: spacing.sm }]}><EmptyState title="No matching jobs" copy="Try another area or timing filter. Eligible opportunities will appear here." /></View>;
  return <View style={{ marginTop: spacing.sm }}><View style={resultsHeader}><Text style={{ color: colors.ink, fontWeight: "900" }}>{opportunities.length} {opportunities.length === 1 ? "job" : "jobs"}</Text><Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>Private quotes · no fixed price</Text></View>{opportunities.map((opportunity) => <MarketplaceCard key={opportunity.id} opportunity={opportunity} onPress={() => onOpen(opportunity.id)} />)}</View>;
}

function MarketplaceCard({ opportunity, onPress }: { opportunity: MarketplaceOpportunity; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, marketplaceCard, pressed && { opacity: 0.88 }]}><View style={cardTop}><View style={{ flex: 1 }}><Text style={eyebrow}>OPEN · {opportunity.postcode_district}</Text><Text style={[styles.heading, { marginTop: 7 }]}>{pretty(opportunity.job_type_slug)}</Text></View><View style={quoteBadge}><Text style={{ color: colors.navy, fontSize: 11, fontWeight: "900" }}>QUOTE</Text></View></View><Text style={[styles.body, { marginTop: 10 }]}>{opportunity.requested_timing || "Flexible timing"}</Text>{opportunity.optional_note && <Text numberOfLines={2} style={[styles.body, { marginTop: 8, color: colors.ink }]}>{opportunity.optional_note}</Text>}<View style={cardFooter}><Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>{opportunity.photo_count ? `${opportunity.photo_count} photos · ` : ""}{pretty(opportunity.category_slug)}</Text><Text style={{ color: colors.blue, fontWeight: "900" }}>View & quote →</Text></View></Pressable>;
}

const tabBar = { flexDirection: "row" as const, backgroundColor: "#ebe8f2", borderRadius: 13, padding: 3, gap: 3, flexWrap: "wrap" as const };
const tabButton = { flex: 1, minHeight: 46, borderRadius: 10, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 8 };
const selectedTab = { backgroundColor: colors.navy };
const searchInput = { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.white, paddingHorizontal: 15, color: colors.ink, fontWeight: "700" as const };
const chip = { minHeight: 38, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: "center" as const, justifyContent: "center" as const };
const activeChip = { backgroundColor: colors.navy, borderColor: colors.navy };
const resultsHeader = { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginBottom: 10 };
const marketplaceCard = { marginBottom: 11, padding: 17 };
const cardTop = { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 10 };
const eyebrow = { color: colors.muted, fontSize: 11, fontWeight: "900" as const, letterSpacing: 0.7 };
const quoteBadge = { borderRadius: 8, backgroundColor: "#e9f5ed", paddingHorizontal: 9, paddingVertical: 7 };
const cardFooter = { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16, paddingTop: 13, flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, gap: 8 };
