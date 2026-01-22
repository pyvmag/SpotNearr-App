import { ModeContext } from "@/src/context/ModeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useContext } from "react";

export default function TabsLayout() {
  const router = useRouter();
  const context = useContext(ModeContext);

  // safety (prevents crash during initial render)
  if (!context) return null;

  const { mode } = context;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:
          mode === "business" ? "#10B981" : "#3B82F6",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: mode === "user" ? undefined : null,
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: mode === "user" ? undefined : null,
          tabBarLabel: "Explore",
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass" size={24} color={color} />
          ),
        }}
      />

      {/* ✅ ONLY show Create for BUSINESS mode */}
      <Tabs.Screen
        name="create"
        options={{
          href: mode === "business" ? undefined : null,
          tabBarLabel: "Create",
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={28} color={color} />
        }}
        listeners={{ tabPress: (e) => { e.preventDefault(); router.push("/(main)/(modals)/CreatePosts"); } }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          tabBarLabel: "Notifications",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="notifications-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
