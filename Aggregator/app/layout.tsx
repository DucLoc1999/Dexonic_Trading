import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { MultiWalletProvider } from "@/components/wallet/multi-wallet-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dexonic Dex Aggregator - The Future of DeFi Trading",
  description:
    "Experience lightning-fast swaps with the best rates across multiple DEXs on Aptos blockchain. Powered by Dexonic.",
  generator: "v0.dev",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MultiWalletProvider>
          {children}
          <Toaster />
        </MultiWalletProvider>
      </body>
    </html>
  );
}
