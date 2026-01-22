// This file must be located at app/index.tsx
import { useUserProfile } from "@/hooks/useUserProfile";
import { authClient } from "@/lib/auth-client";
import { Button, Text, View } from "react-native";
import "../../globals.css";

export default function Index() {
  const userProfile = useUserProfile();

  const handleSignOut = async () => {
    try {
      // Sign out using Better Auth
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Navigation will be handled by app/_layout.tsx auth state change
            console.log('Successfully signed out');
          },
          onError: (error) => {
            console.error("Sign out error:", error);
          }
        }
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Welcome to Dashboard!
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 30 }}>
        You are successfully logged in as user: {userProfile?.name || 'Loading...'}
      </Text>
      
      <Button 
        title="Sign Out" 
        onPress={handleSignOut} 
        color="#007AFF"
      />
    </View>
  );
}