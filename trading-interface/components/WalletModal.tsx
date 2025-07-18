"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  useWallet,
  groupAndSortWallets,
  AdapterWallet,
  AdapterNotDetectedWallet,
} from "@aptos-labs/wallet-adapter-react";
import Image from "next/image";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => void;
}

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const {
    wallet,
    wallets,
    notDetectedWallets,
    connected,
    account,
    disconnect,
  } = useWallet();
  const { availableWallets, installableWallets } = groupAndSortWallets([
    ...wallets,
    ...notDetectedWallets,
  ]);
  const allWallets = [...availableWallets, ...installableWallets];
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);

  useEffect(() => {
    if (account && account.address) {
      setAccountAddress(account.address.toString());
    }
  }, [account]);

  const handleWalletSelect = (
    wallet: AdapterWallet | AdapterNotDetectedWallet
  ) => {
    onConnect(wallet.name);
    onClose();
  };

  const handleCopyAddress = async () => {
    if (!account || !accountAddress) return;
    try {
      await navigator.clipboard.writeText(accountAddress);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleDisconnect = async () => {
    disconnect();
    onClose();
  };

  if (!isOpen) return null;

  if (connected && wallet && account)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-[#1A1A1A] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-[#3A3A3A]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]">
            <h2 className="text-xl font-semibold text-[#ffffff]">
              Wallet Connected
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[#6EFFF8] hover:text-[#ffffff] transition-colors rounded-lg hover:bg-[#2A2A2A]"
            >
              <svg
                className="w-5 h-5"
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

          {/* Wallet Info */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Wallet Name */}
              <div className="flex items-center gap-3 p-4 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A]">
                <div className="w-8 h-8">
                  <Image
                    src={wallet.icon}
                    alt={wallet.name}
                    width={32}
                    height={32}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-[#ffffff]">
                    {wallet.name}
                  </h3>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6EFFF8]">
                  Wallet Address
                </label>
                <div className="flex items-center gap-2 p-3 bg-[#2A2A2A] rounded-lg border border-[#3A3A3A]">
                  <code className="flex-1 text-sm text-[#ffffff] font-mono break-all">
                    {accountAddress || "Loading address..."}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="flex items-center gap-1 p-2 text-[#6EFFF8] hover:text-[#ffffff] transition-colors rounded-lg hover:bg-[#3A3A3A]"
                    title="Copy address"
                  >
                    {copyFeedback ? (
                      <>
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-xs text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#2A2A2A] text-[#ffffff] rounded-lg hover:bg-[#3A3A3A] transition-colors font-medium border border-[#3A3A3A]"
              >
                Close
              </button>
              <button
                onClick={handleDisconnect}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-[#3A3A3A]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]">
          <h2 className="text-xl font-semibold text-[#ffffff]">
            Connect Wallet
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#6EFFF8] hover:text-[#ffffff] transition-colors rounded-lg hover:bg-[#2A2A2A]"
          >
            <svg
              className="w-5 h-5"
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

        {/* Wallet List */}
        <div className="p-6">
          <div className="space-y-3">
            {allWallets.map((wallet, id) => (
              <button
                key={id}
                onClick={() => handleWalletSelect(wallet)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                  "hover:border-[#6EFFF8] hover:bg-[#2A2A2A]",
                  "focus:outline-none focus:ring-2 focus:ring-[#6EFFF8] focus:ring-offset-2 focus:ring-offset-[#1A1A1A]",
                  wallet.readyState === "Installed"
                    ? "border-[#3A3A3A] bg-[#2A2A2A]"
                    : "border-[#3A3A3A] bg-[#2A2A2A]"
                )}
              >
                <div className="w-8 h-8">
                  <Image
                    src={wallet.icon}
                    alt={wallet.name}
                    width={32}
                    height={32}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#ffffff]">
                      {wallet.name}
                    </h3>
                    {wallet.readyState === "Installed" && (
                      <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                        Installed
                      </span>
                    )}
                  </div>
                  {/* <p className="text-sm text-gray-500">{wallet.description}</p> */}
                </div>
                {wallet.readyState !== "Installed" && (
                  <a
                    href={wallet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="w-5 h-5 text-[#6EFFF8]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-[#3A3A3A]">
            <p className="text-sm text-[#6EFFF8] text-center">
              Don&apos;t have a wallet?{" "}
              <a
                href="https://petra.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A571FF] hover:text-[#6EFFF8] font-medium transition-colors"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
