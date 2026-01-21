import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert
} from "react-native";
// Use the context-aware SafeAreaView to avoid deprecation warnings
import { SafeAreaView } from "react-native-safe-area-context"; 
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export default function ProfileSetupScreen() {
    const { data: session, isPending: isSessionPending } = authClient.useSession();
    const router = useRouter();

    // Profile State
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");

    // Status State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

    const updateProfile = useMutation(api.users.updateProfile);

    // Check availability as they type - skipped until session and valid string exist
    const checkUsernameQuery = useQuery(
        api.users.checkUsernameAvailability,
        (session && username.length >= 3) ? { username } : "skip"
    );

    const isValidUsername = (val: string) => /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/.test(val);

    // Auto-fill name from social login if available
    useEffect(() => {
        if (session?.user?.name && !name) {
            setName(session.user.name);
        }
    }, [session]);

    // Handle Username Validation Logic
    useEffect(() => {
        if (!username) {
            setUsernameAvailable(null);
            setIsCheckingUsername(false);
            return;
        }
        if (!isValidUsername(username)) {
            setUsernameAvailable(false);
            setIsCheckingUsername(false);
            return;
        }
        if (checkUsernameQuery !== undefined) {
            setUsernameAvailable(checkUsernameQuery);
            setIsCheckingUsername(false);
        }
    }, [checkUsernameQuery, username]);

    const handleUsernameChange = (text: string) => {
        const cleaned = text.toLowerCase().replace(/\s/g, "");
        setUsername(cleaned);
        if (isValidUsername(cleaned) && cleaned.length >= 3) {
            setIsCheckingUsername(true);
        }
    };

    const handleContinue = async () => {
        if (!session || !usernameAvailable || !name.trim()) return;

        setIsSubmitting(true);
        try {
            await updateProfile({
                username: username.trim(),
                name: name.trim(),
                bio: bio.trim(),
                role: "user",
                profileCompleted: true,
            });

            // Navigate to main app immediately
            router.replace("/(main)/(tabs)");
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Setup Failed", "We couldn't save your profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canContinue = 
        usernameAvailable === true && 
        name.trim().length > 0 && 
        !isSubmitting && 
        !isCheckingUsername;

    if (isSessionPending) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 px-6 py-8" showsVerticalScrollIndicator={false}>
                <View className="items-center mb-8">
                    <Image 
                        source={require("../assets/images/icon.png")} 
                        className="w-16 h-16 mb-4" 
                    />
                    <Text className="text-3xl font-bold text-black mb-1">Create Profile</Text>
                    <Text className="text-gray-500 text-center">Set up your identity on Spotnearr</Text>
                </View>

                {/* Name Input */}
                <View className="mb-4">
                    <Text className="text-sm font-bold text-gray-700 mb-2">Full Name</Text>
                    <TextInput
                        className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                        placeholder="John Doe"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Username Input */}
                <View className="mb-4">
                    <Text className="text-sm font-bold text-gray-700 mb-2">Username</Text>
                    <View className="relative">
                        <TextInput
                            className={`border-2 rounded-xl px-4 py-3 bg-gray-50 ${
                                usernameAvailable === true ? "border-green-500" :
                                usernameAvailable === false ? "border-red-500" : "border-gray-200"
                            }`}
                            placeholder="unique_handle"
                            value={username}
                            onChangeText={handleUsernameChange}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View className="absolute right-3 top-3.5">
                            {isCheckingUsername ? (
                                <ActivityIndicator size="small" color="gray" />
                            ) : usernameAvailable === true ? (
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            ) : usernameAvailable === false ? (
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                            ) : null}
                        </View>
                    </View>
                    {usernameAvailable === false && (
                        <Text className="text-red-500 text-xs mt-1 ml-1">
                            Username is taken, too short, or invalid
                        </Text>
                    )}
                </View>

                {/* Bio Input */}
                <View className="mb-8">
                    <Text className="text-sm font-bold text-gray-700 mb-2">Bio</Text>
                    <TextInput
                        className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 min-h-[100px]"
                        placeholder="Tell your neighbors about yourself..."
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={4}
                        maxLength={150}
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    className={`py-4 rounded-2xl mb-10 ${canContinue ? "bg-black" : "bg-gray-300"}`}
                    onPress={handleContinue}
                    disabled={!canContinue}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className={`text-center font-bold text-lg ${canContinue ? "text-white" : "text-gray-500"}`}>
                            Finish Setup
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}