import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";

export type AppMode = "user" | "business";

export const ModeContext = createContext<{
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  activeBusinessId: string | null;
  setActiveBusinessId: (id: string | null) => void;
}>({
  mode: "user",
  setMode: () => {},
  activeBusinessId: null,
  setActiveBusinessId: () => {},
});

export function ModeContextProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("user");
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const savedMode = await AsyncStorage.getItem("ACTIVE_MODE");
      const savedBusinessId = await AsyncStorage.getItem("ACTIVE_BUSINESS_ID");

      if (savedMode === "user" || savedMode === "business") {
        setModeState(savedMode);
      }
      if (savedBusinessId) {
        setActiveBusinessIdState(savedBusinessId);
      }
    })();
  }, []);

  const setMode = async (newMode: AppMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem("ACTIVE_MODE", newMode);

    if (newMode === "user") {
      setActiveBusinessIdState(null);
      await AsyncStorage.removeItem("ACTIVE_BUSINESS_ID");
    }
  };

  const setActiveBusinessId = async (id: string | null) => {
    setActiveBusinessIdState(id);
    if (id) {
      await AsyncStorage.setItem("ACTIVE_BUSINESS_ID", id);
    } else {
      await AsyncStorage.removeItem("ACTIVE_BUSINESS_ID");
    }
  };

  return (
    <ModeContext.Provider
      value={{ mode, setMode, activeBusinessId, setActiveBusinessId }}
    >
      {children}
    </ModeContext.Provider>
  );
}
