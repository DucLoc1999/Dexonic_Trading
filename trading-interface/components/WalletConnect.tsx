"use client";

import { useState, useEffect } from "react";
import { useWallet, AccountAddress } from "@aptos-labs/wallet-adapter-react";
import { WalletModal } from "./WalletModal";
import Image from "next/image";

export function WalletConnect() {
  const { wallet, connected, connect, disconnect, account } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);

  const handleConnect = async (walletId: string) => {
    try {
      console.log("Connecting to wallet:", walletId);
      await connect(walletId);
      console.log("Wallet connected successfully");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  const formatAddress = (addr: AccountAddress | string) => {
    const addrString = typeof addr === "string" ? addr : addr.toString();
    return `${addrString.slice(0, 6)}...${addrString.slice(-4)}`;
  };

  useEffect(() => {
    if (account && account.address) {
      setAccountAddress(account.address.toString());
    }
    console.log("Account changed:", account);
  }, [connected, account]);

  return (
    <>
      {connected && wallet ? (
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg border border-[#6EFFF8] transition-all duration-300"
            style={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              background:
                "linear-gradient(90deg, rgba(49,0,134,1) 0%, rgba(0,117,111,1) 50%)",
            }}
            onClick={() => setIsModalOpen(true)}
          >
            <Image
              src={wallet.icon}
              alt={wallet.name}
              className="w-6 h-6"
              width={24}
              height={24}
            />
            <span className="text-sm font-medium text-[#ffffff]">
              {wallet.name}
            </span>
          </button>
          <div
            className="flex items-center gap-2 px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg border border-[#6EFFF8] transition-all duration-300"
            style={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              background:
                "linear-gradient(90deg, rgba(0,117,111,1) 0%, rgba(49,0,134,1) 100%)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#ffffff] font-mono">
                {accountAddress
                  ? formatAddress(accountAddress)
                  : connected
                  ? "Loading address..."
                  : "Not connected"}
              </span>
              <button
                onClick={disconnect}
                className="p-1 text-[#6EFFF8] hover:text-red-400 transition-colors rounded"
                title="Disconnect"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="border border-[#6EFFF8] rounded-[5px] px-4 py-2 w-[200px] h-[40px] flex items-center justify-around mr-[40px] cursor-pointer transition-all duration-300 hover:border-[#A571FF] hover:shadow-lg"
          style={{
            fontFamily: "Montserrat",
            fontWeight: 700,
            background:
              "linear-gradient(90deg, rgba(49,0,134,1) 0%, rgba(0,117,111,1) 50%)",
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-[#ffffff] ">Connect Wallet</span>
        </button>
      )}

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
}
