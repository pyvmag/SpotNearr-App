import NetInfo from "@react-native-community/netinfo";

/**
 * Network utility functions for handling online/offline states
 */

/**
 * Check if device is currently online
 * @returns true if connected to network
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error("[NetworkUtils] Error checking network status:", error);
    return false; // Assume offline on error
  }
}

/**
 * Subscribe to network status changes
 * @param callback - Function to call when network status changes
 * @returns Unsubscribe function
 */
export function subscribeToNetworkStatus(
  callback: (isConnected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    callback(state.isConnected ?? false);
  });

  return unsubscribe;
}

/**
 * Get detailed network information
 * @returns Network state details
 */
export async function getNetworkState() {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      type: state.type, // wifi, cellular, etc.
      isInternetReachable: state.isInternetReachable ?? false,
    };
  } catch (error) {
    console.error("[NetworkUtils] Error getting network state:", error);
    return {
      isConnected: false,
      type: "unknown",
      isInternetReachable: false,
    };
  }
}
