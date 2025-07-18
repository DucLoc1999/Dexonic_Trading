"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getWalletTransactionHistory, getCoinDecimals } from "@/lib/sign-txn";
import {
  extractSwapInfo,
  AptosTransaction,
  getWalletHistoricalPrices,
  calculatePriceAtTransaction,
} from "@/lib/extract-txn";

interface SwapTransaction {
  txHash: string;
  timestamp: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  success: boolean;
  usdValue?: number;
  price?: number;
}

// Common coin types
const COIN_TYPES = {
  USDT: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
  USDC: "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T",
  APT: "0x1::aptos_coin::AptosCoin",
};

const TransactionHistory = () => {
  const [swapTransactions, setSwapTransactions] = useState<SwapTransaction[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account } = useWallet();

  useEffect(() => {
    if (account?.address) {
      setLoading(true);
      getWalletTransactionHistory(account.address.toString(), 50) // Get more transactions to filter
        .then(async (transactions) => {
          // Convert transactions to AptosTransaction format and filter
          const aptosTransactions: AptosTransaction[] = transactions
            .filter((tx: any) => tx.sender === account.address.toString())
            .map((tx: any) => ({
              hash: tx.hash,
              success: tx.success || false,
              timestamp: tx.timestamp,
              gas_used: tx.gas_used || "0",
              sender: tx.sender,
              events: tx.events || [],
              changes: tx.changes || [],
              payload: tx.payload || {
                function: "",
                type_arguments: [],
                arguments: [],
              },
            }));

          const swaps: SwapTransaction[] = [];

          for (const tx of aptosTransactions) {
            const swapInfo = extractSwapInfo(tx);
            if (swapInfo && swapInfo.success) {
              // Calculate price and USD value
              const price = calculatePriceAtTransaction(
                tx,
                swapInfo.tokenIn,
                swapInfo.tokenOut
              );

              // Get decimals for both tokens
              const tokenInDecimals = await getCoinDecimals(swapInfo.tokenIn);
              const tokenOutDecimals = await getCoinDecimals(swapInfo.tokenOut);

              // Calculate USD value (assuming USDT/USDC as stable)
              let usdValue = 0;
              if (
                price &&
                tokenInDecimals !== null &&
                tokenOutDecimals !== null
              ) {
                const amountInNum =
                  parseFloat(swapInfo.amountIn) / Math.pow(10, tokenInDecimals);
                const amountOutNum =
                  parseFloat(swapInfo.amountOut) /
                  Math.pow(10, tokenOutDecimals);

                // If one of the tokens is USDT or USDC, use that for USD value
                if (
                  swapInfo.tokenIn === COIN_TYPES.USDT ||
                  swapInfo.tokenIn === COIN_TYPES.USDC
                ) {
                  usdValue = amountInNum;
                } else if (
                  swapInfo.tokenOut === COIN_TYPES.USDT ||
                  swapInfo.tokenOut === COIN_TYPES.USDC
                ) {
                  usdValue = amountOutNum;
                } else if (price) {
                  // If neither is stable, estimate USD value using price
                  usdValue = amountInNum * price;
                }
              }

              swaps.push({
                txHash: swapInfo.txHash,
                timestamp: swapInfo.timestamp,
                tokenIn: swapInfo.tokenIn,
                tokenOut: swapInfo.tokenOut,
                amountIn: swapInfo.amountIn,
                amountOut: swapInfo.amountOut,
                success: swapInfo.success,
                usdValue: usdValue,
                price: price || 0,
              });
            }
          }

          setSwapTransactions(swaps.slice(0, 10)); // Show last 10 swaps
        })
        .catch((err) => {
          console.error("Error fetching transaction history:", err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [account?.address]);

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const txTime = new Date(parseInt(timestamp) * 1000); // Convert seconds to milliseconds
    const diffInSeconds = Math.floor((now.getTime() - txTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  };

  // Get token symbol from full type
  const getTokenSymbol = (tokenType: string): string => {
    const parts = tokenType.split("::");
    if (parts.length >= 3) {
      const name = parts[2];
      // Handle common token names
      if (name.includes("USDT")) return "USDT";
      if (name.includes("USDC")) return "USDC";
      if (name.includes("BTC")) return "BTC";
      if (name.includes("ETH")) return "ETH";
      if (name.includes("APT")) return "APT";
      return name;
    }
    return tokenType;
  };

  // Determine if it's a Buy or Sell
  const getTransactionType = (tokenIn: string, tokenOut: string): string => {
    const stableCoins = ["USDT", "USDC"];
    const tokenInSymbol = getTokenSymbol(tokenIn);
    const tokenOutSymbol = getTokenSymbol(tokenOut);

    // If swapping unstable coin for stable coin, it's a Buy
    if (
      !stableCoins.includes(tokenInSymbol) &&
      stableCoins.includes(tokenOutSymbol)
    ) {
      return "Buy";
    }
    // If swapping stable coin for unstable coin, it's a Sell
    if (
      stableCoins.includes(tokenInSymbol) &&
      !stableCoins.includes(tokenOutSymbol)
    ) {
      return "Sell";
    }
    // If both are stable coins, it's a Buy (as per requirement)
    if (
      stableCoins.includes(tokenInSymbol) &&
      stableCoins.includes(tokenOutSymbol)
    ) {
      return "Buy";
    }
    // Default to Buy for other cases
    return "Buy";
  };

  // Format token pair
  const getTokenPair = (tokenIn: string, tokenOut: string): string => {
    const tokenInSymbol = getTokenSymbol(tokenIn);
    const tokenOutSymbol = getTokenSymbol(tokenOut);
    return `${tokenInSymbol}/${tokenOutSymbol}`;
  };

  // Format transaction hash
  const formatTxHash = (hash: string): string => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Format USD value
  const formatUSDValue = (value: number): string => {
    if (value === 0) return "$0.00";
    return `$${value.toFixed(2)}`;
  };

  // Format price
  const formatPrice = (price: number): string => {
    if (price === 0) return "$0.00";
    return `$${price.toFixed(6)}`;
  };

  // Handle transaction click
  const handleTransactionClick = (txHash: string) => {
    window.open(`https://aptoscan.com/transaction/${txHash}`, "_blank");
  };

  if (loading) {
    return (
      <div className="w-full border border-[#3A3A3A] bg-[#000000] p-4 mt-4">
        <h3
          className="text-white text-lg font-bold mb-4"
          style={{ fontFamily: "Montserrat" }}
        >
          Transaction History
        </h3>
        <div className="flex items-center justify-center h-48">
          <span className="text-[#01B792]" style={{ fontFamily: "Montserrat" }}>
            Loading transaction history...
          </span>
        </div>
      </div>
    );
  }

  if (error || swapTransactions.length === 0) {
    return (
      <div className="w-full border border-[#3A3A3A] bg-[#000000] p-4 mt-4">
        <h3
          className="text-white text-lg font-bold mb-4"
          style={{ fontFamily: "Montserrat" }}
        >
          Transaction History
        </h3>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-10 h-10 text-[#3A3A3A] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span
              className="text-[#3A3A3A] text-sm"
              style={{ fontFamily: "Montserrat" }}
            >
              {error || "No swap transactions found"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-[#3A3A3A] bg-[#000000] p-4 mt-4">
      <h3
        className="text-white text-lg font-bold mb-4"
        style={{ fontFamily: "Montserrat" }}
      >
        Transaction History
      </h3>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 p-3 border-b border-[#3A3A3A] text-sm font-semibold">
        <span className="text-[#6EFFF8]" style={{ fontFamily: "Montserrat" }}>
          Time
        </span>
        <span className="text-[#6EFFF8]" style={{ fontFamily: "Montserrat" }}>
          Token Pair
        </span>
        <span className="text-[#6EFFF8]" style={{ fontFamily: "Montserrat" }}>
          Type
        </span>
        <span className="text-[#6EFFF8]" style={{ fontFamily: "Montserrat" }}>
          USD
        </span>
        <span className="text-[#6EFFF8]" style={{ fontFamily: "Montserrat" }}>
          Price
        </span>
        <span className="text-[#6EFFF8]" style={{ fontFamily: "Montserrat" }}>
          Transaction
        </span>
      </div>

      {/* Table Rows */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {swapTransactions.map((tx, index) => (
          <div
            key={tx.txHash}
            className="grid grid-cols-6 gap-4 p-3 border-b border-[#3A3A3A]/50 hover:bg-[#1A1A1A] transition-colors text-sm"
          >
            {/* Time */}
            <span className="text-white" style={{ fontFamily: "Montserrat" }}>
              {formatTimeAgo(tx.timestamp)}
            </span>

            {/* Token Pair */}
            <span className="text-white" style={{ fontFamily: "Montserrat" }}>
              {getTokenPair(tx.tokenIn, tx.tokenOut)}
            </span>

            {/* Type */}
            <span
              className={`font-semibold ${
                getTransactionType(tx.tokenIn, tx.tokenOut) === "Buy"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
              style={{ fontFamily: "Montserrat" }}
            >
              {getTransactionType(tx.tokenIn, tx.tokenOut)}
            </span>

            {/* USD */}
            <span className="text-white" style={{ fontFamily: "Montserrat" }}>
              {formatUSDValue(tx.usdValue || 0)}
            </span>

            {/* Price */}
            <span className="text-white" style={{ fontFamily: "Montserrat" }}>
              {formatPrice(tx.price || 0)}
            </span>

            {/* Transaction Hash */}
            <button
              onClick={() => handleTransactionClick(tx.txHash)}
              className="text-[#6EFFF8] hover:text-[#A571FF] transition-colors text-left"
              style={{ fontFamily: "Montserrat" }}
            >
              {formatTxHash(tx.txHash)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
