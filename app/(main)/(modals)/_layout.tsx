import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function ModalsLayout() {
  return (
    <Stack>
      {/* 1. The missing CreatePosts screen */}
      <Stack.Screen
        name="CreatePosts"
        options={{
          presentation: "modal",
          title: "New Post",
          headerRight: () => (
            <TouchableOpacity onPress={() => {/* Add your logic here */}}>
              <Ionicons
                name="ellipsis-horizontal-circle"
                size={24}
                color="#10b981" // Using an emerald green to match your brand
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* 2. Your existing screens */}
      <Stack.Screen
        name="AddBusiness/create-business"
        options={{
          headerShown: false,
          presentation: "modal",
          title: "Create Business",
        }}
      />

      <Stack.Screen
        name="profile/AllFavouritesScreen"
        options={{
          headerShown: false,
          presentation: "modal",
          title: "All Favorites",
        }}
      />

      <Stack.Screen
        name="location-picker"
        options={{
          presentation: "modal",
          title: "Select Location",
        }}
      />
    </Stack>
  );
}