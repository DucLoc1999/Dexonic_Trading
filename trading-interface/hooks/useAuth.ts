'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosSignMessageInput } from "@aptos-labs/wallet-adapter-core";
import {
  autoAuthenticateAddress,
  checkAddressHasSession,
  checkAuth,
  signOut as serverSignOut,
  verifySignature,
} from '@/app/actions/auth';

export function useAuth() {
  const { account, connected, signMessage, isLoading: isWalletLoading } = useWallet();
  const address = account?.address.toString();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedAddress, setAuthenticatedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!connected) {
        setIsAuthenticated(false);
        setAuthenticatedAddress(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const authData = await checkAuth();

        if (authData) {
          setIsAuthenticated(true);
          setAuthenticatedAddress(authData.address);

          if (address && authData.address !== address) {
            const hasSession = await checkAddressHasSession(address);

            if (hasSession) {
              const result = await autoAuthenticateAddress(address);

              if (result.success) {
                setIsAuthenticated(true);
                setAuthenticatedAddress(address);
                toast.success('Automatically signed in with connected wallet');
              } else {
                setIsAuthenticated(false);
                toast.info('Wallet address changed. Please sign in again.');
              }
            } else {
              setIsAuthenticated(false);
              toast.info('Wallet address changed. Please sign in again.');
            }
          }
        } else {
          if (address) {
            const hasSession = await checkAddressHasSession(address);

            if (hasSession) {
              const result = await autoAuthenticateAddress(address);

              if (result.success) {
                setIsAuthenticated(true);
                setAuthenticatedAddress(address);
                toast.success('Automatically signed in with connected wallet');
              } else {
                setIsAuthenticated(false);
                setAuthenticatedAddress(null);
              }
            } else {
              setIsAuthenticated(false);
              setAuthenticatedAddress(null);
            }
          }
        }
      } catch {
        console.log("verify authenticate error");
        setIsAuthenticated(false);
        setAuthenticatedAddress(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [connected, address]);

  const signIn = async (toasting: boolean = true) => {
    if (!address) {
      return;
    }

    try {
      setIsLoading(true);

      // Simple message for the user to sign
      const message = `Sign this message to login to the app.

Address:
${address}`;

      // User signs this simple message
      const signature = await signMessage({
        message: message,
        nonce: "login",
      });

      // Send to server for verification
      await verifySignature(message, signature.signature.toString());

      setIsAuthenticated(true);
      setAuthenticatedAddress(address);
      if (toasting) toast.success('Successfully signed in');
    } catch {
      console.log("sign in error");
      setIsAuthenticated(false);
      setAuthenticatedAddress(null);
      if (toasting) toast.error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (toasting: boolean = true) => {
    try {
      await serverSignOut();
    } catch {
      console.log("sign out error")
      // Error handling is silent
    }

    setIsAuthenticated(false);
    setAuthenticatedAddress(null);
    if (toasting) toast.success('Signed out successfully');
  };

  return {
    isAuthenticated,
    isLoading,
    authenticatedAddress,
    signIn,
    signOut,
    connected,
    isWalletLoading,
    currentAddress: address,
  };
}
