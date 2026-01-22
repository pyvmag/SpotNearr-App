import { StrictMode, useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import {
  ConvexReactClient,
  ConvexProvider,
  useQuery,
  useMutation,
} from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/convex/_generated/api";
import { View, ActivityIndicator } from "react-native";
import { LocationProvider } from "@/src/context/LocationContext";
import { ModeContextProvider } from "@/src/context/ModeContext";
import "./globals.css"
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL as string, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

function NavigationGate() {
  const { data: session, isPending: isAuthPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();
  
  const user = useQuery(api.users.getMe);
  const createUser = useMutation(api.users.createUserIfNotExists);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Set isMounted to true after the first paint
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 2. IMPORTANT: Do nothing until the layout is mounted AND auth state is known
    if (!isMounted || isAuthPending) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inProfileCompletion = segments[0] === "ProfileCompletion";

    // CASE: Not Logged In
    if (!session) {
      if (!inAuthGroup) router.replace("/(auth)");
      return;
    }

    // CASE: Logged In, but no record (Syncing)
    if (session && user === null && !isSyncing) {
      setIsSyncing(true);
      createUser()
        .then(() => setIsSyncing(false))
        .catch(() => setIsSyncing(false));
      return;
    }

    // CASE: Record exists, check completion
    if (user) {
      if (!user.profileCompleted) {
        if (!inProfileCompletion) router.replace("/ProfileCompletion");
      } else {
        if (inAuthGroup || inProfileCompletion) {
          router.replace("/(main)/(tabs)");
        }
      }
    }
  }, [session, isAuthPending, user, segments, isSyncing, isMounted]);

  // 3. DO NOT return <Slot /> until isMounted is true.
  // Returning null or a loading spinner here solves the "Navigation Context" error.
  if (!isMounted || isAuthPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return <Slot />;
}

export default function MyLayout() {
  return (
    <StrictMode>
      <ConvexProvider client={convex}>
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          <LocationProvider>
            <ModeContextProvider>
              <NavigationGate />
            </ModeContextProvider>
          </LocationProvider>
        </ConvexBetterAuthProvider>
      </ConvexProvider>
    </StrictMode>
  );
}