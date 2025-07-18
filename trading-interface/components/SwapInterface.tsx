"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { TokenSelector } from "@/components/TokenSelector";
import { useWalletUtils } from "@/lib/wallet-utils";
import { cn } from "@/lib/utils";

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  balance?: bigint;
}

interface Quote {
  amountOut: number;
  amountOutRaw: bigint;
  amountIn: number;
  amountInRaw: bigint;
  reserves: {
    reserveIn: bigint;
    reserveOut: bigint;
  };
  poolFound: boolean;
}

export function SwapInterface() {
  const { connected, account } = useWallet();
  const { getSwapQuote, executeSwap } = useWalletUtils();
  const [fromToken, setFromToken] = useState<Token | undefined>();
  const [toToken, setToToken] = useState<Token | undefined>();
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"from" | "to">("from"); // Track which input is being used
  const [copyFeedback, setCopyFeedback] = useState<"from" | "to" | null>(null);
  const [refreshTimer, setRefreshTimer] = useState(60); // Timer countdown in seconds
  const [slippage, setSlippage] = useState(0.5); // Default slippage 0.5%
  const [showSettings, setShowSettings] = useState(false); // Settings modal state
  const [isRefreshing, setIsRefreshing] = useState(false); // Track refresh state
  const [fromUserTokens, setFromUserTokens] = useState<Token[]>([]);
  const [toUserTokens, setToUserTokens] = useState<Token[]>([]);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Auto-refresh quote every 1 minute
  useEffect(() => {
    const interval = setInterval(async () => {
      if (
        connected &&
        fromToken &&
        toToken &&
        fromAmount &&
        parseFloat(fromAmount) > 0 &&
        inputMode === "from"
      ) {
        try {
          setIsRefreshing(true);
          const quoteResult = await getSwapQuote({
            fromToken,
            toToken,
            fromAmount,
            toAmount: "",
            slippage,
            isExactOutput: false, // Exact input when typing in "from" field
          });
          setQuote(quoteResult);
          setToAmount(quoteResult.amountOut.toFixed(6));
          setError(null);
        } catch (err: unknown) {
          console.error("Error refreshing quote:", err);
          // Don't show error for auto-refresh, just log it
        } finally {
          setIsRefreshing(false);
        }
      } else if (
        connected &&
        fromToken &&
        toToken &&
        toAmount &&
        parseFloat(toAmount) > 0 &&
        inputMode === "to"
      ) {
        try {
          setIsRefreshing(true);
          const quoteResult = await getSwapQuote({
            fromToken,
            toToken,
            fromAmount: "",
            toAmount,
            slippage,
            isExactOutput: true, // Exact output when typing in "to" field
          });
          setQuote(quoteResult);
          setFromAmount(quoteResult.amountIn.toFixed(6));
          setError(null);
        } catch (err: unknown) {
          console.error("Error refreshing quote:", err);
          // Don't show error for auto-refresh, just log it
        } finally {
          setIsRefreshing(false);
        }
      }
    }, 60000); // 1 minute = 60000ms

    return () => clearInterval(interval);
  }, [
    connected,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    inputMode,
    slippage,
    getSwapQuote,
  ]);

  // Timer countdown effect
  useEffect(() => {
    if (
      connected &&
      fromToken &&
      toToken &&
      ((fromAmount && parseFloat(fromAmount) > 0) ||
        (toAmount && parseFloat(toAmount) > 0))
    ) {
      const timer = setInterval(() => {
        setRefreshTimer((prev) => {
          if (prev <= 1) {
            // Trigger a manual refresh when timer reaches 0
            setTimeout(() => {
              if (
                connected &&
                fromToken &&
                toToken &&
                fromAmount &&
                parseFloat(fromAmount) > 0 &&
                inputMode === "from"
              ) {
                setIsRefreshing(true);
                getSwapQuote({
                  fromToken,
                  toToken,
                  fromAmount,
                  toAmount: "",
                  slippage,
                  isExactOutput: false, // Exact input when typing in "from" field
                })
                  .then((quoteResult) => {
                    setQuote(quoteResult);
                    setToAmount(quoteResult.amountOut.toFixed(6));
                    setError(null);
                  })
                  .catch((err) => {
                    console.error("Manual refresh error:", err);
                  })
                  .finally(() => {
                    setIsRefreshing(false);
                  });
              } else if (
                connected &&
                fromToken &&
                toToken &&
                toAmount &&
                parseFloat(toAmount) > 0 &&
                inputMode === "to"
              ) {
                setIsRefreshing(true);
                getSwapQuote({
                  fromToken,
                  toToken,
                  fromAmount: "",
                  toAmount,
                  slippage,
                  isExactOutput: true, // Exact output when typing in "to" field
                })
                  .then((quoteResult) => {
                    setQuote(quoteResult);
                    setFromAmount(quoteResult.amountIn.toFixed(6));
                    setError(null);
                  })
                  .catch((err) => {
                    console.error("Manual refresh error:", err);
                  })
                  .finally(() => {
                    setIsRefreshing(false);
                  });
              }
            }, 100);
            return 60; // Reset to 60 seconds
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setRefreshTimer(60); // Reset timer when no valid quote
    }
  }, [
    connected,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    inputMode,
    slippage,
    getSwapQuote,
  ]);

  // Debounced quote fetching
  const debouncedGetQuote = useCallback(
    (
      fromToken: Token,
      toToken: Token,
      amount: string,
      isFromInput: boolean
    ) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(async () => {
        if (
          !connected ||
          !fromToken ||
          !toToken ||
          !amount ||
          parseFloat(amount) <= 0
        ) {
          setQuote(null);
          setError(null);
          return;
        }

        setIsGettingQuote(true);
        setError(null);

        try {
          const quoteResult = await getSwapQuote({
            fromToken,
            toToken,
            fromAmount: isFromInput ? amount : "",
            toAmount: isFromInput ? "" : amount,
            slippage,
            isExactOutput: !isFromInput, // Exact output when typing in "to" field, exact input when typing in "from" field
          });

          setQuote(quoteResult);

          // Update the other input field with the calculated amount
          if (isFromInput) {
            setToAmount(quoteResult.amountOut.toFixed(6));
          } else {
            setFromAmount(quoteResult.amountIn.toFixed(6));
          }
        } catch (err: unknown) {
          console.error("Error getting quote:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get quote";
          setError(errorMessage);
          setQuote(null);
          if (isFromInput) {
            setToAmount("");
          } else {
            setFromAmount("");
          }
        } finally {
          setIsGettingQuote(false);
        }
      }, 800); // Increased debounce time to reduce API calls
    },
    [connected, getSwapQuote, slippage]
  );

  // Handle from amount input
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setInputMode("from");
    if (fromToken && toToken && value && parseFloat(value) > 0) {
      debouncedGetQuote(fromToken, toToken, value, true);
    } else {
      setToAmount("");
      setQuote(null);
      setError(null);
    }
  };

  // Handle to amount input
  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    setInputMode("to");
    if (fromToken && toToken && value && parseFloat(value) > 0) {
      debouncedGetQuote(fromToken, toToken, value, false);
    } else {
      setFromAmount("");
      setQuote(null);
      setError(null);
    }
  };

  // Copy token address to clipboard
  const copyTokenAddress = async (token: Token, type: "from" | "to") => {
    try {
      await navigator.clipboard.writeText(token.address);
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount("0");
    setToAmount("0");
    setQuote(null);
    setError(null);
  };

  const handleSwap = async () => {
    if (!connected || !fromToken || !toToken || !fromAmount || !account) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check balance first
      const userToken = fromUserTokens.find(
        (t) => t.address === fromToken.address
      );
      if (!userToken) {
        throw new Error(`You don't own ${fromToken.symbol}`);
      }

      const amountIn = BigInt(
        parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)
      );

      if ((userToken.balance || BigInt(0)) < amountIn) {
        throw new Error(`Insufficient ${fromToken.symbol} balance`);
      }

      // Execute the swap
      const result = await executeSwap({
        fromToken,
        toToken,
        fromAmount,
        slippage,
        isExactOutput: inputMode === "to", // Exact output when user typed in "to" field
      });

      // Reset form after successful swap
      setFromAmount("");
      setToAmount("");
      setQuote(null);
      alert(`Swap completed successfully! Transaction: ${result.txHash}`);
    } catch (err: unknown) {
      let errorMessage: string;

      if (typeof err === "string" && err === "Rejected by User") {
        errorMessage = "Transaction was cancelled by user";
      } else {
        errorMessage = "Swap failed. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check balance when fromToken or fromAmount changes
  useEffect(() => {
    const checkBalance = async () => {
      if (connected && fromToken && fromAmount && parseFloat(fromAmount) > 0) {
        try {
          // Only check balance if user owns this token
          const userToken = fromUserTokens.find(
            (t) => t.address === fromToken.address
          );
          if (userToken) {
            const amountIn = BigInt(
              parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)
            );
            setInsufficientBalance((userToken.balance || BigInt(0)) < amountIn);
          } else {
            // User doesn't own this token, so balance is insufficient
            setInsufficientBalance(true);
          }
        } catch (error) {
          console.error("Error checking balance:", error);
          setInsufficientBalance(false);
        }
      } else {
        setInsufficientBalance(false);
      }
    };

    checkBalance();
  }, [connected, fromToken, fromAmount, fromUserTokens]);

  const canSwap =
    connected &&
    account &&
    fromToken &&
    toToken &&
    fromAmount &&
    parseFloat(fromAmount) > 0 &&
    !isGettingQuote &&
    !error &&
    !insufficientBalance;

  return (
    <div className="max-w-md mx-auto bg-[#1A1A1A] rounded-2xl shadow-xl border border-[#3A3A3A]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]">
        <h2 className="text-xl font-bold text-[#ffffff]">Swap</h2>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-[#ffffff] hover:text-[#6EFFF8] transition-colors"
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Swap Form */}
      <div className="p-6 space-y-4">
        {/* From Token */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-sm font-medium text-[#ffffff]"
              htmlFor="from-amount"
            >
              From
            </label>
            {fromToken && (
              <button
                onClick={() => copyTokenAddress(fromToken, "from")}
                className="flex items-center gap-1 text-xs text-[#6EFFF8] hover:text-[#ffffff] transition-colors"
                title="Copy token address"
              >
                {copyFeedback === "from" ? (
                  <>
                    <svg
                      className="w-3 h-3 text-green-500"
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
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
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
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <TokenSelector
              selectedToken={fromToken}
              onTokenSelect={setFromToken}
              disabled={!connected}
              otherSelectedToken={toToken}
              onAmountChange={handleFromAmountChange}
              currentAmount={fromAmount}
              onUserTokensChange={setFromUserTokens}
            />
            <div className="flex-1">
              <input
                id="from-amount"
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                disabled={!connected || !fromToken}
                className="w-full px-3 py-2 border border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6EFFF8] focus:border-transparent disabled:opacity-50 bg-[#2A2A2A] text-[#ffffff] placeholder-[#6EFFF8]"
              />
              {/* Percentage buttons for From token */}
              {connected &&
                fromToken &&
                fromUserTokens.some((t) => t.address === fromToken.address) && (
                  <div className="flex gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const userToken = fromUserTokens.find(
                          (t) => t.address === fromToken.address
                        );
                        const balance = userToken?.balance || BigInt(0);
                        const amount =
                          Math.round(
                            (Number(balance) /
                              Math.pow(10, fromToken.decimals)) *
                              0.25 *
                              Math.pow(10, fromToken.decimals)
                          ) / Math.pow(10, fromToken.decimals);
                        handleFromAmountChange(amount.toString());
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded transition-colors text-[#ffffff] border border-[#3A3A3A]"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const userToken = fromUserTokens.find(
                          (t) => t.address === fromToken.address
                        );
                        const balance = userToken?.balance || BigInt(0);
                        const amount =
                          Math.round(
                            (Number(balance) /
                              Math.pow(10, fromToken.decimals)) *
                              0.5 *
                              Math.pow(10, fromToken.decimals)
                          ) / Math.pow(10, fromToken.decimals);
                        handleFromAmountChange(amount.toString());
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded transition-colors text-[#ffffff] border border-[#3A3A3A]"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const userToken = fromUserTokens.find(
                          (t) => t.address === fromToken.address
                        );
                        const balance = userToken?.balance || BigInt(0);
                        const amount =
                          Math.round(
                            (Number(balance) /
                              Math.pow(10, fromToken.decimals)) *
                              Math.pow(10, fromToken.decimals)
                          ) / Math.pow(10, fromToken.decimals);
                        handleFromAmountChange(amount.toString());
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded transition-colors text-[#ffffff] border border-[#3A3A3A]"
                    >
                      Max
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center my-2">
          <button
            onClick={handleSwapTokens}
            disabled={!connected}
            className="p-2 bg-[#2A2A2A] rounded-full hover:bg-[#3A3A3A] transition-colors disabled:opacity-50 border border-[#3A3A3A]"
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* To Token */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-sm font-medium text-[#ffffff]"
              htmlFor="to-amount"
            >
              To
            </label>
            {toToken && (
              <button
                onClick={() => copyTokenAddress(toToken, "to")}
                className="flex items-center gap-1 text-xs text-[#6EFFF8] hover:text-[#ffffff] transition-colors"
                title="Copy token address"
              >
                {copyFeedback === "to" ? (
                  <>
                    <svg
                      className="w-3 h-3 text-green-500"
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
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
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
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <TokenSelector
              selectedToken={toToken}
              onTokenSelect={setToToken}
              disabled={!connected}
              otherSelectedToken={fromToken}
              onAmountChange={handleToAmountChange}
              currentAmount={toAmount}
              onUserTokensChange={setToUserTokens}
            />
            <div className="flex-1">
              <input
                id="to-amount"
                type="number"
                placeholder="0.0"
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                disabled={!connected || !toToken}
                className="w-full px-3 py-2 border border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6EFFF8] focus:border-transparent disabled:opacity-50 bg-[#2A2A2A] text-[#ffffff] placeholder-[#6EFFF8]"
              />
              {/* Percentage buttons for To token */}
              {connected &&
                toToken &&
                toUserTokens.some((t) => t.address === toToken.address) && (
                  <div className="flex gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const userToken = toUserTokens.find(
                          (t) => t.address === toToken.address
                        );
                        const balance = userToken?.balance || BigInt(0);
                        const amount =
                          Math.round(
                            (Number(balance) / Math.pow(10, toToken.decimals)) *
                              0.25 *
                              Math.pow(10, toToken.decimals)
                          ) / Math.pow(10, toToken.decimals);
                        handleToAmountChange(amount.toString());
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded transition-colors text-[#ffffff] border border-[#3A3A3A]"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const userToken = toUserTokens.find(
                          (t) => t.address === toToken.address
                        );
                        const balance = userToken?.balance || BigInt(0);
                        const amount =
                          Math.round(
                            (Number(balance) / Math.pow(10, toToken.decimals)) *
                              0.5 *
                              Math.pow(10, toToken.decimals)
                          ) / Math.pow(10, toToken.decimals);
                        handleToAmountChange(amount.toString());
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded transition-colors text-[#ffffff] border border-[#3A3A3A]"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const userToken = toUserTokens.find(
                          (t) => t.address === toToken.address
                        );
                        const balance = userToken?.balance || BigInt(0);
                        const amount =
                          Math.round(
                            (Number(balance) / Math.pow(10, toToken.decimals)) *
                              Math.pow(10, toToken.decimals)
                          ) / Math.pow(10, toToken.decimals);
                        handleToAmountChange(amount.toString());
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded transition-colors text-[#ffffff] border border-[#3A3A3A]"
                    >
                      Max
                    </button>
                  </div>
                )}
            </div>
          </div>
          {isGettingQuote && (
            <div className="flex items-center gap-2 text-sm text-[#6EFFF8] mt-2">
              <div className="w-4 h-4 border-2 border-[#6EFFF8] border-t-transparent rounded-full animate-spin" />
              Getting best quote...
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Swap Details */}
        {canSwap && quote && (
          <div className="bg-[#2A2A2A] rounded-lg p-4 space-y-2 border border-[#3A3A3A]">
            <div className="flex justify-between text-sm">
              <span className="text-[#6EFFF8]">Rate</span>
              <span className="font-medium text-[#ffffff]">
                1 {fromToken.symbol} ={" "}
                {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)}{" "}
                {toToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6EFFF8]">Slippage</span>
              <span className="font-medium text-[#ffffff]">{slippage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6EFFF8]">Network Fee</span>
              <span className="font-medium text-[#ffffff]">~0.0001 APT</span>
            </div>
            {account && account.address && (
              <div className="flex justify-between text-sm">
                <span className="text-[#6EFFF8]">Wallet</span>
                <span className="font-medium font-mono text-xs text-[#ffffff]">
                  {account.address.toString().slice(0, 6)}...
                  {account.address.toString().slice(-4)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#6EFFF8]">Minimum Received</span>
              <span className="font-medium text-[#ffffff]">
                {(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)}{" "}
                {toToken?.symbol}
              </span>
            </div>

            {/* Refresh Timer */}
            <div className="pt-2 border-t border-[#3A3A3A]">
              <div className="flex justify-between text-xs text-[#6EFFF8] mb-1">
                <span>Quote refreshes in</span>
                <div className="flex items-center gap-1">
                  {isRefreshing && (
                    <div className="w-3 h-3 border border-[#6EFFF8] border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{refreshTimer}s</span>
                </div>
              </div>
              <div className="w-full bg-[#3A3A3A] rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-1000 ease-linear ${
                    isRefreshing ? "bg-green-500" : "bg-[#6EFFF8]"
                  }`}
                  style={{ width: `${((60 - refreshTimer) / 60) * 100}%` }}
                />
              </div>
              {isRefreshing && (
                <div className="text-xs text-green-400 mt-1">
                  Refreshing quote...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!canSwap || isLoading}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-medium transition-colors",
            canSwap && !isLoading
              ? "text-[#ffffff] cursor-pointer"
              : "text-[#6EFFF8] cursor-not-allowed",
            canSwap && !isLoading
              ? "bg-gradient-to-r from-[#310086] to-[#007573] hover:from-[#4000A8] hover:to-[#009999]"
              : "bg-[#2A2A2A] border border-[#3A3A3A]"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Swapping...
            </div>
          ) : !connected ? (
            "Connect Wallet"
          ) : !fromToken || !toToken ? (
            "Select Tokens"
          ) : !fromAmount ? (
            "Enter Amount"
          ) : insufficientBalance ? (
            `Insufficient ${fromToken?.symbol} Balance`
          ) : error ? (
            "Cannot Swap"
          ) : (
            <div className="flex items-center justify-center gap-2">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Swap
            </div>
          )}
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 w-96 max-w-sm mx-4 border border-[#3A3A3A]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#ffffff]">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#6EFFF8] hover:text-[#ffffff] transition-colors"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#ffffff] mb-2">
                  Slippage Tolerance
                </label>

                {/* Quick Options */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setSlippage(0.05)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      slippage === 0.05
                        ? "bg-gradient-to-r from-[#310086] to-[#007573] text-[#ffffff]"
                        : "bg-[#2A2A2A] text-[#ffffff] hover:bg-[#3A3A3A] border border-[#3A3A3A]"
                    }`}
                  >
                    0.05%
                  </button>
                  <button
                    onClick={() => setSlippage(0.1)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      slippage === 0.1
                        ? "bg-gradient-to-r from-[#310086] to-[#007573] text-[#ffffff]"
                        : "bg-[#2A2A2A] text-[#ffffff] hover:bg-[#3A3A3A] border border-[#3A3A3A]"
                    }`}
                  >
                    0.1%
                  </button>
                  <button
                    onClick={() => setSlippage(0.5)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      slippage === 0.5
                        ? "bg-gradient-to-r from-[#310086] to-[#007573] text-[#ffffff]"
                        : "bg-[#2A2A2A] text-[#ffffff] hover:bg-[#3A3A3A] border border-[#3A3A3A]"
                    }`}
                  >
                    0.5%
                  </button>
                </div>

                {/* Custom Input */}
                <div>
                  <label className="block text-xs text-[#6EFFF8] mb-1">
                    Custom Slippage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="50"
                    value={slippage}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0.01 && value <= 50) {
                        setSlippage(value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6EFFF8] focus:border-transparent text-sm bg-[#2A2A2A] text-[#ffffff] placeholder-[#6EFFF8]"
                    placeholder="0.5"
                  />
                </div>
              </div>

              <div className="text-xs text-[#6EFFF8]">
                <p>
                  Your transaction will revert if the price changes unfavorably
                  by more than this percentage.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gradient-to-r from-[#310086] to-[#007573] text-[#ffffff] rounded-lg hover:from-[#4000A8] hover:to-[#009999] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
