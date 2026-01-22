import BusinessProfileScreen from "@/components/profile/BusinessProfileScreen";
import { Id } from "@/convex/_generated/dataModel";
import { useLocalSearchParams } from "expo-router";

export default function BusinessProfilePage() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();

  if (!businessId) return null;

  return <BusinessProfileScreen businessId={businessId as Id<"businesses">} />;
}