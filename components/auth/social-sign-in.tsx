import { authClient } from "@/lib/auth-client";
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function SocialSignIn() {
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: "/" as any,
            });
            console.log('OAuth signIn result:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Google login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.7}
            className="flex-row items-center justify-center bg-white border border-gray-200 py-4 px-6 rounded-2xl shadow-sm"
        >
            {loading ? (
                <ActivityIndicator color="#000" />
            ) : (
                <>
                    <Ionicons name="logo-google" size={20} color="#000" style={{ marginRight: 12 }} />
                    <Text className="text-black font-bold text-lg">
                        Continue with Google
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}