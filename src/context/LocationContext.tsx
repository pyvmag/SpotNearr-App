import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { createContext, useContext, useEffect, useState } from "react";

type UserLocation = {
  lat: number;
  lng: number;
  label: string; // city / area
};

type LocationContextType = {
  location: UserLocation | null;
  loading: boolean;
  requestCurrentLocation: () => Promise<void>;
  setManualLocation: (location: UserLocation) => Promise<void>;
};

const LocationContext = createContext<LocationContextType | null>(null);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user_location");
        if (stored) {
          setLocation(JSON.parse(stored));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading stored location:', error);
        setLoading(false);
      }
    })();
  }, []);

  const saveLocation = async (loc: UserLocation) => {
    try {
      setLocation(loc);
      await AsyncStorage.setItem("user_location", JSON.stringify(loc));
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const requestCurrentLocation = async () => {
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log('Location permission denied:', status);
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const place = geo[0];
      const label =
        place?.district ||
        place?.city ||
        place?.region ||
        "Current location";

      await saveLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        label,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setLoading(false);
    }
  };

  const setManualLocation = async (loc: UserLocation) => {
    await saveLocation(loc);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        requestCurrentLocation,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useUserLocation must be used inside LocationProvider");
  return ctx;
};
