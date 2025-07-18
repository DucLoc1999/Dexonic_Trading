import { createContext, useContext, useState } from "react";

interface CurrentTokenType {
  symbol: string;
  price: number;
}

interface CurrentTokenContextValue {
  currentToken: CurrentTokenType;
  setCurrentToken: (token: CurrentTokenType) => void;
}

export const CurrentTokenContext = createContext<
  CurrentTokenContextValue | undefined
>(undefined);

export function useCurrentToken() {
  const context = useContext(CurrentTokenContext);
  if (context === undefined) {
    throw new Error(
      "useCurrentToken must be used within a CurrentTokenProvider"
    );
  }
  return context;
}

export function CurrentTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentToken, setCurrentToken] = useState<CurrentTokenType>({
    symbol: "BTC",
    price: 0,
  });

  const value: CurrentTokenContextValue = {
    currentToken,
    setCurrentToken,
  };

  return (
    <CurrentTokenContext.Provider value={value}>
      {children}
    </CurrentTokenContext.Provider>
  );
}
