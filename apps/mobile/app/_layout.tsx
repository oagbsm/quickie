import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "@/lib/auth";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 2, refetchOnReconnect: true } } });

export default function RootLayout() {
  useEffect(() => { void Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) }); }, []);
  return <QueryClientProvider client={queryClient}><AuthProvider><Stack screenOptions={{ headerShown: false }} /></AuthProvider></QueryClientProvider>;
}
