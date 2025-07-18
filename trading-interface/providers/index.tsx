"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";
import { CurrentTokenProvider } from "@/context/CurrentTokenContext";
import { TimeframeProvider } from "@/context/TimeframeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayoutProvider } from "@/context/AppLayoutContext";

const queryClient = new QueryClient();

export default function Providers({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{ network: Network.MAINNET }}
      onError={(error) => {
        console.log("Error", error);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppLayoutProvider value={{ headerSlot: false }}>
          <CurrentTokenProvider>
            <TimeframeProvider>{children}</TimeframeProvider>
          </CurrentTokenProvider>
        </AppLayoutProvider>
      </QueryClientProvider>
    </AptosWalletAdapterProvider>
  );
}
