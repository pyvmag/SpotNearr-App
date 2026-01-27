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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useFonts } from "expo-font"; // ✅ 1. Re-added Font Loader
import { Ionicons } from "@expo/vector-icons"; 
import * as SplashScreen from "expo-splash-screen"; // ✅ 2. Re-added Splash Screen
import "./globals.css";

// Keep Splash Screen visible while we load resources
SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL as string,
  {
    expectAuth: true,
    unsavedChangesWarning: false,
  }
);

function FullScreenLoader() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}

function NavigationGate() {
  const { data: session, isPending: isAuthPending } = authClient.useSession();
  const router = useRouter();
  const segments = useSegments();
  const { isConnected } = useNetInfo();

  const [isMounted, setIsMounted] = useState(false);
  const [wasLoggedIn, setWasLoggedIn] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ✅ Skip Convex when offline
  const user = useQuery(
    api.users.getMe,
    isConnected ? {} : "skip"
  );

  const createUser = useMutation(api.users.createUserIfNotExists);

  // 1. Load persisted login state
  useEffect(() => {
    setIsMounted(true);
    AsyncStorage.getItem("wasLoggedIn").then((v) => {
      setWasLoggedIn(v === "true");
    });
  }, []);

  // 2. Persist login state AFTER auth resolves
  useEffect(() => {
    if (isAuthPending) return;

    if (session) {
      AsyncStorage.setItem("wasLoggedIn", "true");
      setWasLoggedIn(true);
    } else if (isConnected) {
      // Only mark as logged out if we are definitely online and server says so
      AsyncStorage.setItem("wasLoggedIn", "false");
      setWasLoggedIn(false);
    }
  }, [session, isAuthPending, isConnected]);

  // 3. Navigation logic
  useEffect(() => {
    if (!isMounted || isAuthPending || wasLoggedIn === null) return;

    const inAuth = segments[0] === "(auth)";
    const inProfile = segments[0] === "ProfileCompletion";

    // 🔌 OFFLINE MODE
    if (isConnected === false) {
      if (wasLoggedIn) {
        if (inAuth) router.replace("/(main)/(tabs)");
      } else {
        if (!inAuth) router.replace("/(auth)");
      }
      return;
    }

    // 🌐 ONLINE MODE
    if (!session) {
      if (!inAuth) router.replace("/(auth)");
      return;
    }

    // Wait for user data (prevents race conditions)
    if (user === undefined) return;

    // Create user if missing
    if (user === null && !isSyncing) {
      setIsSyncing(true);
      createUser().finally(() => setIsSyncing(false));
      return;
    }

    // Profile completion
    if (user) {
      if (!user.profileCompleted) {
        if (!inProfile) router.replace("/ProfileCompletion");
      } else {
        if (inAuth || inProfile) {
          router.replace("/(main)/(tabs)");
        }
      }
    }
  }, [session, user, isConnected, isAuthPending, isMounted, wasLoggedIn, segments, isSyncing]);

  // --- RENDERING LOGIC (The Guards) ---

  const inAuth = segments[0] === "(auth)";

  // 1. Base Loading: Wait for Mount, Auth Check, and Local Storage
  if (!isMounted || isAuthPending || wasLoggedIn === null) {
    return <FullScreenLoader />;
  }

  // 2. User Data Loading Guard:
  // If we are Online, Logged In, but don't have the User Doc yet... WAIT.
  // This prevents the app from rendering before we know if "Profile is Completed".
  if (isConnected && session && user === undefined) {
    return <FullScreenLoader />;
  }

  // 3. Redirect Guard (Prevent Flashes):
  // If we are logged in, but standing on the Login Screen... don't show the screen.
  // The useEffect above is about to redirect us.
  if (session && inAuth) {
    return <FullScreenLoader />;
  }
  
  // If we are logged out (and online), but standing on a Protected Screen...
  if (!session && isConnected && !inAuth) {
    return <FullScreenLoader />;
  }

  return <Slot />;
}

export default function MyLayout() {
  // ✅ Load Fonts for Icons
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // ✅ Hide Splash Screen when fonts are ready
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // ✅ Don't render ANYTHING until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <StrictMode>
      <ConvexProvider client={convex}>
        <ConvexBetterAuthProvider
          client={convex}
          authClient={authClient}
        >
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