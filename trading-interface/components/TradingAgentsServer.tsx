"use client";

import React, { useState, useEffect } from "react";
import { useRightSide } from "@/context/RightSideContext";
import { getTradingAgentsData } from "@/app/actions/trading-agents";
import { Chat } from "@/components/ai-swap/Chat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

interface TradingAgentsData {
  success: boolean;
  userId?: string;
  messages?: any[];
  error?: string;
  requiresAuth?: boolean;
  debug?: string;
}

export default function TradingAgentsServer() {
  const { isSwapActive } = useRightSide();
  const { isAuthenticated, signIn, connected } = useAuth();
  const [data, setData] = useState<TradingAgentsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const { connect, connected: isConnected } = useWallet();

  useEffect(() => {
    if (!isSwapActive && isAuthenticated && connected) {
      setLoading(true);
      setError(null);

      getTradingAgentsData()
        .then((result) => {
          console.log("TradingAgents data result:", result);
          setData(result);
          if (!result.success) {
            setError(result.error || "Failed to load trading agents");
          }
        })
        .catch((err) => {
          console.error("Error fetching trading agents data:", err);
          setError("Failed to load trading agents");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isSwapActive, isAuthenticated, connected]);

  const handleSignIn = async () => {
    try {
      setIsSigning(true);
      setError(null);
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsSigning(false);
    }
  };

  if (isSwapActive) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col border border-[#3A3A3A] bg-[#000000]">
        <div className="flex flex-col border border-[#3A3A3A] bg-[#000000] p-4">
          <div className="flex items-center justify-center h-48">
            <span
              className="text-[#01B792]"
              style={{ fontFamily: "Montserrat" }}
            >
              Loading Trading Agents...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If we have valid data, show the chat directly
  if (data?.success && data?.userId) {
    return (
      <div className="flex flex-col border border-[#3A3A3A] bg-[#000000]">
        <div className="flex flex-col border border-[#3A3A3A] bg-[#000000] p-4">
          <Chat
            userId={data.userId}
            initialMessages={data.messages || []}
            isAuthenticated={true}
          />
        </div>
      </div>
    );
  }

  // Show authentication UI
  return (
    <div className="flex flex-col border border-[#3A3A3A] bg-[#000000]">
      <div className="flex flex-col border border-[#3A3A3A] bg-[#000000] p-4">
        <div className="flex flex-col items-center justify-center h-48 space-y-6">
          <div className="text-center">
            <h3
              className="text-xl font-bold text-[#7f00ff] mb-2"
              style={{ fontFamily: "Montserrat" }}
            >
              Trading Agents
            </h3>
            <p
              className="text-[#B5B5B5] text-sm"
              style={{ fontFamily: "Montserrat" }}
            >
              Connect your wallet and sign in to access AI trading assistance
            </p>
          </div>

          {error && (
            <div className="text-center">
              <span
                className="text-red-400 text-sm"
                style={{ fontFamily: "Montserrat" }}
              >
                {error}
              </span>
              {data?.debug && (
                <div
                  className="text-[#666666] text-xs mt-1"
                  style={{ fontFamily: "Montserrat" }}
                >
                  Debug: {data.debug}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center space-y-3">
            {!isConnected ? null : !isAuthenticated ? (
              <Button
                onClick={handleSignIn}
                disabled={isSigning}
                className="bg-[#7f00ff] text-white hover:bg-[#7f00ff]/90"
                style={{ fontFamily: "Montserrat" }}
              >
                {isSigning ? "Signing..." : "Sign In"}
              </Button>
            ) : (
              <span
                className="text-[#01B792] text-sm"
                style={{ fontFamily: "Montserrat" }}
              >
                Loading your trading data...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
