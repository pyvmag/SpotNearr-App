import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export const useUserProfile = () => {
  const userProfile = useQuery(api.users.getMe);
  return userProfile;
};