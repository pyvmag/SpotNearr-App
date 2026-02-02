import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Generic caching service using AsyncStorage
 * Supports timestamp-based expiry and type-safe operations
 */

export interface CacheConfig {
  key: string;
  maxAge: number; // in milliseconds
}

/**
 * Get cached data if it exists and is not stale
 * @param key - Cache key
 * @param maxAge - Maximum age in milliseconds before cache is considered stale
 * @returns Cached data or null if not found/stale
 */
export async function getCachedData<T>(
  key: string,
  maxAge: number
): Promise<T | null> {
  try {
    const dataKey = `${key}_data`;
    const timeKey = `${key}_time`;

    // Get both data and timestamp
    const [cachedData, cachedTime] = await Promise.all([
      AsyncStorage.getItem(dataKey),
      AsyncStorage.getItem(timeKey),
    ]);

    // If either is missing, cache is invalid
    if (!cachedData || !cachedTime) {
      return null;
    }

    // Check if cache is stale
    const timestamp = parseInt(cachedTime, 10);
    const now = Date.now();
    const age = now - timestamp;

    if (age > maxAge) {
      // Cache is stale, clear it
      await clearCache(key);
      return null;
    }

    // Parse and return cached data
    return JSON.parse(cachedData) as T;
  } catch (error) {
    console.error(`[CacheService] Error reading cache for ${key}:`, error);
    return null;
  }
}

/**
 * Save data to cache with current timestamp
 * @param key - Cache key
 * @param data - Data to cache
 */
export async function setCachedData<T>(
  key: string,
  data: T
): Promise<void> {
  try {
    const dataKey = `${key}_data`;
    const timeKey = `${key}_time`;
    const now = Date.now();

    await Promise.all([
      AsyncStorage.setItem(dataKey, JSON.stringify(data)),
      AsyncStorage.setItem(timeKey, now.toString()),
    ]);

    console.log(`[CacheService] Cached data for ${key} at ${new Date(now).toISOString()}`);
  } catch (error) {
    console.error(`[CacheService] Error saving cache for ${key}:`, error);
    throw error;
  }
}

/**
 * Clear cached data for a specific key
 * @param key - Cache key to clear
 */
export async function clearCache(key: string): Promise<void> {
  try {
    const dataKey = `${key}_data`;
    const timeKey = `${key}_time`;

    await Promise.all([
      AsyncStorage.removeItem(dataKey),
      AsyncStorage.removeItem(timeKey),
    ]);

    console.log(`[CacheService] Cleared cache for ${key}`);
  } catch (error) {
    console.error(`[CacheService] Error clearing cache for ${key}:`, error);
  }
}

/**
 * Check if cache is stale without retrieving data
 * @param key - Cache key
 * @param maxAge - Maximum age in milliseconds
 * @returns true if cache is stale or missing
 */
export async function isCacheStale(
  key: string,
  maxAge: number
): Promise<boolean> {
  try {
    const timeKey = `${key}_time`;
    const cachedTime = await AsyncStorage.getItem(timeKey);

    if (!cachedTime) {
      return true;
    }

    const timestamp = parseInt(cachedTime, 10);
    const now = Date.now();
    const age = now - timestamp;

    return age > maxAge;
  } catch (error) {
    console.error(`[CacheService] Error checking cache staleness for ${key}:`, error);
    return true; // Treat errors as stale cache
  }
}

/**
 * Get cache metadata (timestamp, age)
 * @param key - Cache key
 * @returns Cache metadata or null if not found
 */
export async function getCacheMetadata(key: string): Promise<{
  timestamp: number;
  age: number;
  formattedDate: string;
} | null> {
  try {
    const timeKey = `${key}_time`;
    const cachedTime = await AsyncStorage.getItem(timeKey);

    if (!cachedTime) {
      return null;
    }

    const timestamp = parseInt(cachedTime, 10);
    const now = Date.now();
    const age = now - timestamp;

    return {
      timestamp,
      age,
      formattedDate: new Date(timestamp).toISOString(),
    };
  } catch (error) {
    console.error(`[CacheService] Error getting cache metadata for ${key}:`, error);
    return null;
  }
}

// Pre-defined cache configurations
export const CACHE_KEYS = {
  CATEGORIES: "spotnearr_categories_v1",
  FEED: "spotnearr_feed_v1", // Cache first 20 feed posts only
} as const;

export const CACHE_DURATIONS = {
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  ONE_DAY: 24 * 60 * 60 * 1000,        // 1 day
  ONE_HOUR: 60 * 60 * 1000,            // 1 hour
} as const;
