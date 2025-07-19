"use client";

import { createContext, useContext, useState } from "react";

export const RightSideContext = createContext({
  isSwapActive: false,
  setIsSwapActive: (isSwapActive: boolean) => {},
});

export const useRightSide = () => {
  const context = useContext(RightSideContext);
  if (!context) {
    throw new Error("useRightSide must be used within a RightSideProvider");
  }
  return context;
};

export const RightSideProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isSwapActive, setIsSwapActive] = useState(true);
  return (
    <RightSideContext.Provider value={{ isSwapActive, setIsSwapActive }}>
      {children}
    </RightSideContext.Provider>
  );
};
