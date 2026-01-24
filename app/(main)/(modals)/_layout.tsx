import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",   // ✅ bottom-up modal
        headerShown: false,      // ✅ hides header by default
      }}
    >
      <Stack.Screen
        name="CreatePosts"
        options={{
          headerShown: true,
          title: "New Post",
          headerRight: () => (
            <TouchableOpacity>
              <Ionicons
                name="ellipsis-horizontal-circle"
                size={24}
                color="#10b981"
              />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen name="AddBusiness/create-business" />
      <Stack.Screen name="profile/AllFavouritesScreen" />
      <Stack.Screen
        name="location-picker"
        options={{ title: "Select Location" }}
      />
    </Stack>
  );
}
