import { ModeContextProvider } from "@/src/context/ModeContext";
import { Stack } from "expo-router";

function Layout() {
  return (
    <ModeContextProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Only define the group here */}
        <Stack.Screen name="(modals)" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </ModeContextProvider>
  );
}

export default Layout;
