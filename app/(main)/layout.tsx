import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The Tab navigator */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* Modals (e.g., Post creation, Business filters) */}
      <Stack.Screen 
        name="(modals)" 
        options={{ 
          presentation: 'modal',
          headerShown: true,
          headerTitle: "Select Options" 
        }} 
      />
    </Stack>
  );
}