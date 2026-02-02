import { Share, Alert } from "react-native";
import * as Linking from "expo-linking";

/**
 * Share a business profile inside the SpotNearr app
 * Route: app/profile/BusinessProfile.tsx
 * Deep link: spotnearr://profile/BusinessProfile?businessId=xxx
 */
export const shareBusiness = async (business: {
  _id: string;
  name: string;
}) => {
  if (!business?._id) return;

  const deepLink = Linking.createURL("profile/BusinessProfile", {
    queryParams: {
      businessId: business._id,
    },
  });

  const message = `Check out ${business.name} on SpotNearr 🏪

${deepLink}`;

  try {
    await Share.share({
      message,        // Android
      url: deepLink,  // iOS
      title: `Share ${business.name}`,
    });
  } catch (error: any) {
    Alert.alert("Share failed", error.message);
  }
};

/**
 * Share a post or offer inside the SpotNearr app
 * Route: app/post/[id].tsx
 * Deep link: spotnearr://post/xxx
 */
export const shareContent = async (
  content: {
    _id: string;
    type?: "post" | "offer";
    caption?: string;
    offerTitle?: string;
  },
  business?: {
    name?: string;
  }
) => {
  if (!content?._id) return;

  const deepLink = Linking.createURL(`post/${content._id}`);

  const typeLabel =
    content.type === "offer"
      ? "Save big with this offer 🔥"
      : "Check out this post 👀";

  const businessName = business?.name || "a local business";

  const description =
    content.caption || content.offerTitle || "";

  const message = `${typeLabel} from ${businessName} on SpotNearr

${description}

${deepLink}`;

  try {
    await Share.share({
      message,        // Android
      url: deepLink,  // iOS
      title: "Share on SpotNearr",
    });
  } catch (error: any) {
    Alert.alert("Share failed", error.message);
  }
};
