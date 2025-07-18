"use client";

import { ReactNode, useEffect, useState } from "react";
import { Brain, Shuffle, TrendUp } from "@phosphor-icons/react";
//import { ArrowRight, Bot, Construction, Network, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { AuthPageProps } from "@/types/chat";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PageHeader } from "./page-header";
import { useAppLayoutContext } from "@/context/AppLayoutContext";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}
function SignatureLoadingOverlay() {
  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <Card className="max-w-md bg-[#121212] border-[#27272A] p-6">
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-semibold text-[#7f00ff]">
            Waiting for signature
          </h3>
          <p className="mt-2 text-muted-foreground">
            Please check your wallet and sign the message to verify your
            identity. This won&apos;t cost any gas fees or initiate
            transactions.
          </p>
          <div className="mt-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#7f00ff]"></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AuthPage({ isConnectStep, error, signIn, setError }: AuthPageProps) {
  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col items-center justify-start bg-background p-6 pt-12">
      <div className="w-full max-w-6xl">
        {/* Welcome section */}

        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight title-gradient sm:text-4xl md:text-4xl">
            Vistia AI Trading Assistant
          </h1>

          <p className="text-xl text-muted-foreground">
            {isConnectStep
              ? "Welcome! Connect your wallet to proceed"
              : "One last step - verify your wallet to start trading"}
          </p>
        </div>
        {/* Feature Highlight */}
        <div className="mb-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <FeatureCard
            icon={<Brain className="h-10 w-10 text-[#7f00ff]" />}
            title="Market Analysis"
            description="Swap tokens, bridge assets, and set limit orders with our intelligent assistant"
          />
          <FeatureCardOne
            icon={<TrendUp className="h-8 w-8 text-[#7f00ff]" />}
            title="Smart Trading"
            description="Execute trades, set limit orders, and deploy strategies using natural language"
          />
          <FeatureCardTwo
            icon={<Shuffle className="h-8 w-8 text-[#7f00ff]" />}
            title="Cross-Chain Operations"
            description="Seamlessly bridge assets between Pocket Network and other blockchains"
          />
        </div>

        {/* Action section */}
        <div className="flex flex-col items-center text-xl text-muted-foreground">
          <h2 className="mb-6 text-2xl font-semibold text-[#7f00ff]">
            {isConnectStep ? "Connect Wallet" : "Sign in"} to Start Trading
          </h2>
          {error && (
            <p className="mb-4 text-center text-destructive">{error}</p>
          )}
          {isConnectStep ? (
            <ConnectButton />
          ) : (
            <Button
              onClick={async () => {
                try {
                  setError(null);
                  await signIn();
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Verification failed"
                  );
                }
              }}
              size="lg"
              className="max-w-48 bg-[#7f00ff] text-white hover:bg-[#7f00ff]/90"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthGuardClient({
  children,
  initialAuth = false,
}: {
  children: React.ReactNode;
  initialAuth?: boolean;
}) {
  const {
    isAuthenticated,
    signIn,
    connected: isConnected,
    isWalletLoading: isConnecting,
    isLoading: authLoading,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCompletedAuth, setHasCompletedAuth] = useState(initialAuth);

  const { headerSlot } = useAppLayoutContext();

  useEffect(() => {
    // Only set initializing to false when we've determined the initial auth state
    if (!isConnecting && !authLoading) {
      // Add a small delay to prevent flashing states
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isConnecting, authLoading]);

  // Track when authentication is fully completed
  useEffect(() => {
    if (isAuthenticated && isConnected && !isInitializing) {
      // Add a small delay to ensure stability
      const timer = setTimeout(() => {
        setHasCompletedAuth(true);
      }, 200);

      return () => clearTimeout(timer);
    } else if (!isAuthenticated || !isConnected) {
      setHasCompletedAuth(false);
    }
  }, [isAuthenticated, isConnected, isInitializing]);

  // Modified signIn function that tracks signing state
  const handleSignIn = async () => {
    try {
      setError(null);
      setIsSigning(true);
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsSigning(false);
    }
  };

  if (headerSlot) {
    return <PageHeader title="AI Trading Assistant" />;
  }

  // Show nothing during initial load to prevent flashing
  if (isInitializing) {
    return null;
  }

  // Only show authenticated content when we're sure authentication is complete
  if (!isConnected || !isAuthenticated || !hasCompletedAuth) {
    const isConnectStep = !isConnected;

    return (
      <>
        <AuthPage
          isConnectStep={isConnectStep}
          error={error}
          signIn={handleSignIn}
          setError={setError}
        />
        {isSigning && <SignatureLoadingOverlay />}
      </>
    );
  }

  return <>{children}</>;
}
// Helper Components
function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-[#27272A] bg-[#121212] p-6 text-center backdrop-blur-sm transition-all hover:border-[#7f00ff]/50 hover:bg-[#1a1a1a]">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-[#7f00ff]">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
function FeatureCardOne({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-[#27272A] bg-[#121212] p-6 text-center backdrop-blur-sm transition-all hover:border-[#7f00ff]/50 hover:bg-[#1a1a1a]">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-[#7f00ff]">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
function FeatureCardTwo({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-[#27272A] bg-[#121212] p-6 text-center backdrop-blur-sm transition-all hover:border-[#7f00ff]/50 hover:bg-[#1a1a1a]">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-[#7f00ff]">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
