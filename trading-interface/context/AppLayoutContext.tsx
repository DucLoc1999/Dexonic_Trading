"use client";

import { createContext, useContext } from "react";

export type AppLayoutContextType = {
  headerSlot?: boolean;
};

const AppLayoutContext = createContext<AppLayoutContextType | undefined>(undefined);

export const useAppLayoutContext = () => {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error("useAppLayoutContext must be used within AppLayoutProvider");
  }
  return context;
};

export const AppLayoutProvider = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AppLayoutContextType;
}) => (
  <AppLayoutContext.Provider value={value}>
    {children}
  </AppLayoutContext.Provider>
);
