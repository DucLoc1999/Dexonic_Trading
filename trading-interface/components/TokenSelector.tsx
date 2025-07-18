"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import liquidswapTokens from "@/data/liquidswap-tokens.json";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";
import { MoveResource } from "@aptos-labs/ts-sdk";
import Image from "next/image";

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  source?: string;
}

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  source?: string;
  balance?: bigint;
}

interface TokenSelectorProps {
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
  disabled?: boolean;
  otherSelectedToken?: Token; // The token selected in the other field
  onAmountChange?: (amount: string) => void; // For percentage buttons
  currentAmount?: string; // Current amount in the input field
  onUserTokensChange?: (tokens: Token[]) => void; // Callback to pass user tokens to parent
}

// Convert the JSON data to our Token interface format
const popularTokens: Token[] = Object.entries(liquidswapTokens).map(
  ([, tokenData]) => ({
    symbol: tokenData.symbol,
    name: tokenData.name,
    address: tokenData.type,
    decimals: tokenData.decimals,
    logoURI: tokenData.logoUrl,
    source: tokenData.source,
  })
);

export function TokenSelector({
  selectedToken,
  onTokenSelect,
  disabled,
  otherSelectedToken,
  onUserTokensChange,
}: TokenSelectorProps) {
  const { connected, account } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch user's tokens when wallet is connected and dropdown opens
  useEffect(() => {
    const fetchUserTokens = async () => {
      if (!connected || !account || !isOpen) return;

      setLoadingTokens(true);
      try {
        // Get all account resources directly
        const client = new AptosClient(
          process.env.NEXT_PUBLIC_APTOS_NODE_URL ||
            "https://api.mainnet.aptoslabs.com/v1"
        );
        const resources = await client.getAccountResources(
          account.address.toString()
        );

        // Filter for coin stores and extract token addresses
        const coinStores = resources.filter(
          (resource) =>
            resource.type.startsWith("0x1::coin::CoinStore<") &&
            resource.type.endsWith(">")
        );

        // Extract token addresses from coin store types
        const userTokenAddresses = coinStores
          .map((resource) => {
            const match = resource.type.match(/0x1::coin::CoinStore<(.+)>/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        // Match with our token list and add balances
        const userTokensWithBalances = popularTokens
          .filter((token) => userTokenAddresses.includes(token.address))
          .map((token) => {
            const coinStore = coinStores.find(
              (resource) =>
                resource.type === `0x1::coin::CoinStore<${token.address}>`
            );
            const balance = coinStore
              ? BigInt(
                  (coinStore as MoveResource<{ coin: { value: string } }>).data
                    .coin.value
                )
              : BigInt(0);
            return { ...token, balance };
          })
          .filter((token) => token.balance && token.balance > BigInt(0)); // Only show tokens with balance > 0

        setUserTokens(userTokensWithBalances);
        onUserTokensChange?.(userTokensWithBalances);
      } catch (error) {
        console.error("Error fetching user tokens:", error);
        setUserTokens([]);
        onUserTokensChange?.([]);
      } finally {
        setLoadingTokens(false);
      }
    };

    fetchUserTokens();
  }, [connected, account, isOpen, onUserTokensChange]);

  const filteredTokens = popularTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (token.source &&
        token.source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort tokens: those with balance first, then alphabetically
  const sortedTokens = filteredTokens.sort((a, b) => {
    const aHasBalance = userTokens.some((t) => t.address === a.address);
    const bHasBalance = userTokens.some((t) => t.address === b.address);

    if (aHasBalance && !bHasBalance) return -1;
    if (!aHasBalance && bHasBalance) return 1;

    // If both have balance or both don't have balance, sort alphabetically
    return a.symbol.localeCompare(b.symbol);
  });

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Helper function to format balance
  const formatBalance = (balance: bigint, decimals: number): string => {
    if (balance === BigInt(0)) return "0";
    const balanceNumber = Number(balance) / Math.pow(10, decimals);
    if (balanceNumber < 0.000001) return "< 0.000001";
    return balanceNumber.toFixed(6).replace(/\.?0+$/, "");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 border border-[#3A3A3A] rounded-lg bg-[#2A2A2A]",
          "hover:border-[#6EFFF8] focus:outline-none focus:ring-2 focus:ring-[#6EFFF8] focus:border-transparent",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2">
          {selectedToken ? (
            <>
              {selectedToken.logoURI ? (
                <Image
                  src={selectedToken.logoURI}
                  alt={selectedToken.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                  width={24}
                  height={24}
                />
              ) : null}
              <div
                className={cn(
                  "w-6 h-6 bg-gradient-to-r from-[#310086] to-[#007573] rounded-full flex items-center justify-center text-white text-xs font-semibold",
                  selectedToken.logoURI && "hidden"
                )}
              >
                {selectedToken.symbol.charAt(0)}
              </div>
              <span className="font-medium text-[#ffffff]">
                {selectedToken.symbol}
              </span>
            </>
          ) : (
            <span className="text-[#6EFFF8]">Select token</span>
          )}
        </div>
        <svg
          className={cn(
            "w-4 h-4 text-[#6EFFF8] transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg shadow-lg z-10 w-80 max-h-80 overflow-hidden">
          <div className="p-3 border-b border-[#3A3A3A]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6EFFF8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6EFFF8] focus:border-transparent bg-[#2A2A2A] text-[#ffffff] placeholder-[#6EFFF8]"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {sortedTokens.map((token) => {
              const isSelected = selectedToken?.address === token.address;
              const isOtherSelected =
                otherSelectedToken?.address === token.address;
              const isDisabled = isSelected || isOtherSelected;

              return (
                <button
                  key={token.address}
                  onClick={() => !isDisabled && handleTokenSelect(token)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 transition-colors",
                    !isDisabled && "hover:bg-[#2A2A2A]",
                    isDisabled && "opacity-50 cursor-not-allowed bg-[#2A2A2A]",
                    isSelected && "bg-[#2A2A2A] border-l-2 border-[#6EFFF8]",
                    isOtherSelected &&
                      "bg-[#2A2A2A] border-l-2 border-yellow-500"
                  )}
                >
                  {token.logoURI ? (
                    <Image
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                      width={32}
                      height={32}
                    />
                  ) : null}
                  <div
                    className={cn(
                      "w-8 h-8 bg-gradient-to-r from-[#310086] to-[#007573] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0",
                      token.logoURI && "hidden"
                    )}
                  >
                    {token.symbol.charAt(0)}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-2 text-[#ffffff]">
                      {token.symbol}
                      {isSelected && (
                        <span className="text-xs bg-[#6EFFF8]/20 text-[#6EFFF8] px-1.5 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                      {isOtherSelected && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                          Used
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[#ffffff] truncate">
                      {token.name}
                      {token.source && (
                        <span className="ml-1 text-xs text-[#ffffff]/70">
                          ({token.source})
                        </span>
                      )}
                    </div>
                    {connected && (
                      <div className="text-xs text-[#ffffff]/70 mt-1">
                        {loadingTokens ? (
                          <span className="text-[#ffffff]/70">
                            Loading tokens...
                          </span>
                        ) : userTokens.some(
                            (t) => t.address === token.address
                          ) ? (
                          <span className="text-green-400">
                            Balance:{" "}
                            {formatBalance(
                              userTokens.find(
                                (t) => t.address === token.address
                              )?.balance || BigInt(0),
                              token.decimals
                            )}{" "}
                            {token.symbol}
                          </span>
                        ) : (
                          <span className="text-[#ffffff]/70">
                            Available for swap
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            {sortedTokens.length === 0 && (
              <div className="px-3 py-4 text-center text-[#ffffff]/70">
                No tokens found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Balance display */}
      {connected &&
        selectedToken &&
        userTokens.some((t) => t.address === selectedToken.address) && (
          <div className="mt-2">
            <div className="text-xs text-[#6EFFF8]">
              Balance:{" "}
              {formatBalance(
                userTokens.find((t) => t.address === selectedToken.address)
                  ?.balance || BigInt(0),
                selectedToken.decimals
              )}{" "}
              {selectedToken.symbol}
            </div>
          </div>
        )}
    </div>
  );
}
