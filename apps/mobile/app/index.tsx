import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function Index() { const { session, worker, standaloneCleaner, loading } = useAuth(); if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}><ActivityIndicator color={colors.blue} /></View>; if (!session) return <Redirect href="/sign-in" />; if (!standaloneCleaner && !worker) return <Redirect href="/onboarding" />; if (standaloneCleaner && !standaloneCleaner.onboarding_completed_at) return <Redirect href="/onboarding" />; return <Redirect href="/(tabs)/today" />; }
