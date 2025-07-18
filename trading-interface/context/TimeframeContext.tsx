import { createContext, useContext, useState } from "react";

interface TimeframeType {
  timeframe: string;
}

interface TimeframeContextValue {
  timeframe: TimeframeType;
  setTimeframe: (timeframe: TimeframeType) => void;
}

export const TimeframeContext = createContext<
  TimeframeContextValue | undefined
>(undefined);

export function useTimeframe() {
  const context = useContext(TimeframeContext);
  if (context === undefined) {
    throw new Error("useTimeframe must be used within a TimeframeProvider");
  }
  return context;
}

export function TimeframeProvider({ children }: { children: React.ReactNode }) {
  const [timeframe, setTimeframe] = useState<TimeframeType>({
    timeframe: "1h",
  });

  const value: TimeframeContextValue = {
    timeframe,
    setTimeframe,
  };

  return (
    <TimeframeContext.Provider value={value}>
      {children}
    </TimeframeContext.Provider>
  );
}
