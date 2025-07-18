"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AptosClient } from "aptos";

// Extend Window interface to include aptos
declare global {
  interface Window {
    aptos?: any;
    pontem?: any;
  }
}

interface PontemContextType {
  connected: boolean;
  address: string | null;
  network: string | null;
  signAndSubmitTransaction: (payload: any) => Promise<any>;
  connect: () => Promise<void>;
  disconnect: () => void;
  isPontemAvailable: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  // Multi-account support
  accounts: string[];
  currentAccountIndex: number;
  switchAccount: (index: number) => Promise<void>;
  getAccounts: () => Promise<string[]>;
  refreshWalletState: () => Promise<void>;
}

const PontemContext = createContext<PontemContextType | undefined>(undefined);

export const usePontem = () => {
  const context = useContext(PontemContext);
  if (!context) {
    throw new Error("usePontem must be used within a PontemProvider");
  }
  return context;
};

export const PontemProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isPontemAvailable, setIsPontemAvailable] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);

  // Helper to get the Pontem wallet object from window
  function getPontemObject() {
    if (typeof window === "undefined") return null;
    if ((window as any).pontem) return (window as any).pontem;
    if ((window as any).Pontem) return (window as any).Pontem;
    if ((window as any).aptos && (window as any).aptos.isPontem)
      return (window as any).aptos;
    return null;
  }

  // Get all accounts from Pontem
  const getAccounts = async (): Promise<string[]> => {
    try {
      const pontem = getPontemObject();
      if (!pontem) return [];

      // Try different methods to get accounts
      let accountList: string[] = [];

      if (typeof pontem.getAccounts === "function") {
        accountList = await pontem.getAccounts();
      } else if (typeof pontem.accounts === "function") {
        accountList = await pontem.accounts();
      } else if (Array.isArray(pontem.accounts)) {
        accountList = pontem.accounts;
      } else if (typeof pontem.listAccounts === "function") {
        accountList = await pontem.listAccounts();
      }

      if (accountList.length > 0) {
        console.log("Pontem accounts found:", accountList);
      }
      return accountList;
    } catch (error) {
      console.error("Failed to get Pontem accounts:", error);
      return [];
    }
  };

  // Switch to a different account
  const switchAccount = async (index: number) => {
    try {
      const pontem = getPontemObject();
      if (!pontem) throw new Error("Pontem not available");

      if (index >= 0 && index < accounts.length) {
        // Try different methods to switch account
        if (typeof pontem.switchAccount === "function") {
          await pontem.switchAccount(index);
        } else if (typeof pontem.selectAccount === "function") {
          await pontem.selectAccount(index);
        } else if (typeof pontem.setAccount === "function") {
          await pontem.setAccount(index);
        }

        setCurrentAccountIndex(index);
        setAddress(accounts[index]);
        console.log(`Switched to account ${index}:`, accounts[index]);
      }
    } catch (error) {
      console.error("Failed to switch account:", error);
      throw error;
    }
  };

  // Manual refresh function for Pontem
  const refreshWalletState = async () => {
    try {
      console.log("Manually refreshing Pontem wallet state...");
      const pontem = getPontemObject();
      if (!pontem) {
        console.log("Pontem not available for refresh");
        return;
      }

      // Re-fetch accounts
      const accountList = await getAccounts();
      if (accountList.length > 0) {
        setConnected(true);
        setAddress(accountList[0]);
        setAccounts(accountList);
        setCurrentAccountIndex(0);
        setNetwork("mainnet");
        setConnectionStatus("connected");
        console.log("Successfully refreshed Pontem wallet state:", accountList);
      } else {
        // Fallback to single account
        let account;
        try {
          account = await pontem.account();
        } catch (error) {
          try {
            account = await pontem.getAccount();
          } catch (e) {
            account = pontem.account || pontem.address || null;
          }
        }

        if (account && (account.address || typeof account === "string")) {
          setConnected(true);
          setAddress(account.address || account);
          setAccounts([account.address || account]);
          setCurrentAccountIndex(0);
          setNetwork("mainnet");
          setConnectionStatus("connected");
          console.log(
            "Successfully refreshed Pontem wallet state:",
            account.address || account
          );
        } else {
          setConnected(false);
          setAddress(null);
          setAccounts([]);
          setCurrentAccountIndex(0);
          setConnectionStatus("disconnected");
          console.log("No account found during refresh");
        }
      }
    } catch (error) {
      console.error("Failed to refresh Pontem wallet state:", error);
      setConnectionStatus("error");
    }
  };

  const connect = async () => {
    try {
      setConnectionStatus("connecting");
      const pontem = getPontemObject();

      if (pontem) {
        console.log("Attempting to connect to Pontem wallet...", pontem);

        // Connect to Pontem
        const response = await pontem.connect();
        console.log("Pontem connection response:", response);

        // Get all accounts
        const accountList = await getAccounts();
        setAccounts(accountList);

        if (accountList.length > 0) {
          // Use the first account by default
          const currentAddress = accountList[0];
          setConnected(true);
          setAddress(currentAddress);
          setCurrentAccountIndex(0);
          setNetwork("mainnet"); // Pontem typically uses mainnet
          setConnectionStatus("connected");
          console.log(
            "Successfully connected to Pontem wallet with accounts:",
            accountList
          );
        } else {
          // Fallback to single account method
          let account;
          try {
            account = await pontem.account();
          } catch (error) {
            try {
              account = await pontem.getAccount();
            } catch (e) {
              account = pontem.account || pontem.address || null;
            }
          }

          if (account && (account.address || typeof account === "string")) {
            setConnected(true);
            setAddress(account.address || account);
            setAccounts([account.address || account]);
            setCurrentAccountIndex(0);
            setNetwork("mainnet");
            setConnectionStatus("connected");
            console.log(
              "Successfully connected to Pontem wallet:",
              account.address || account
            );
          } else {
            throw new Error("No account information received");
          }
        }
      } else {
        console.log("Pontem wallet not detected");
        setConnectionStatus("error");
        alert(
          "Pontem Wallet không được tìm thấy. Vui lòng cài đặt Pontem Wallet extension và thử lại."
        );
      }
    } catch (error) {
      console.error("Failed to connect to Pontem:", error);
      setConnectionStatus("error");
      alert(
        "Không thể kết nối với Pontem Wallet. Vui lòng kiểm tra extension và thử lại."
      );
    }
  };

  const disconnect = () => {
    try {
      const pontem = getPontemObject();
      if (pontem && typeof pontem.disconnect === "function") {
        pontem.disconnect();
      }
    } catch (error) {
      console.error("Failed to disconnect from Pontem:", error);
    } finally {
      setConnected(false);
      setAddress(null);
      setNetwork(null);
      setConnectionStatus("disconnected");
      setAccounts([]);
      setCurrentAccountIndex(0);
    }
  };

  const signAndSubmitTransaction = async (payload: any) => {
    try {
      const pontem = getPontemObject();
      if (!pontem) {
        throw new Error("Pontem wallet not available");
      }

      // Try using window.aptos first (Pontem Wallet 2.6.21 standard)
      if (typeof window !== "undefined" && window.aptos) {
        console.log("Using window.aptos for transaction");
        const response = await window.aptos.signAndSubmitTransaction(payload);
        console.log("Pontem transaction response:", response);
        if (response && response.hash) return response;
        if (response && response.success) return response;
        throw new Error(
          "Pontem wallet did not return a transaction hash. Please update your wallet or use another wallet."
        );
      }

      // Fallback to pontem object if window.aptos not available
      if (pontem.signAndSubmitTransaction) {
        console.log("Using pontem.signAndSubmitTransaction");
        const response = await pontem.signAndSubmitTransaction(payload);
        console.log("Pontem transaction response:", response);
        if (response && response.hash) return response;
        if (response && response.success) return response;
        throw new Error(
          "Pontem wallet did not return a transaction hash. Please update your wallet or use another wallet."
        );
      }

      // Nếu chỉ có signTransaction, báo lỗi rõ ràng
      throw new Error(
        "Pontem wallet does not support direct transaction submission. Please update your wallet or use another wallet."
      );
    } catch (error) {
      console.error("Pontem transaction failed:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkPontemAvailability = () => {
        const pontem = getPontemObject();
        const isAvailable = !!pontem;
        setIsPontemAvailable(isAvailable);

        if (isAvailable) {
          console.log("Pontem wallet detected", pontem);

          const checkConnection = async () => {
            try {
              // Try to get accounts first
              const accountList = await getAccounts();
              if (accountList.length > 0) {
                setConnected(true);
                setAddress(accountList[0]);
                setAccounts(accountList);
                setCurrentAccountIndex(0);
                setNetwork("mainnet");
                setConnectionStatus("connected");
                console.log(
                  "Already connected to Pontem wallet with accounts:",
                  accountList
                );
                return;
              }

              // Fallback to single account check
              let account;
              try {
                account = await pontem.account();
              } catch (error) {
                try {
                  account = await pontem.getAccount();
                } catch (e) {
                  account = pontem.account || pontem.address || null;
                }
              }

              if (account && (account.address || typeof account === "string")) {
                setConnected(true);
                setAddress(account.address || account);
                setAccounts([account.address || account]);
                setCurrentAccountIndex(0);
                setNetwork("mainnet");
                setConnectionStatus("connected");
                console.log(
                  "Already connected to Pontem wallet:",
                  account.address || account
                );
              } else {
                setConnectionStatus("disconnected");
              }
            } catch (error) {
              console.log("Not connected to Pontem wallet");
              setConnectionStatus("disconnected");
            }
          };

          checkConnection();

          // Add event listeners for Pontem wallet changes
          const handlePontemAccountChange = async () => {
            console.log("Pontem account change detected, reconnecting...");
            try {
              // Re-fetch accounts and update state
              const accountList = await getAccounts();
              if (accountList.length > 0) {
                setConnected(true);
                setAddress(accountList[0]);
                setAccounts(accountList);
                setCurrentAccountIndex(0);
                setNetwork("mainnet");
                setConnectionStatus("connected");
                console.log(
                  "Successfully reconnected to Pontem wallet with accounts:",
                  accountList
                );
              } else {
                // Fallback to single account
                let account;
                try {
                  account = await pontem.account();
                } catch (error) {
                  try {
                    account = await pontem.getAccount();
                  } catch (e) {
                    account = pontem.account || pontem.address || null;
                  }
                }

                if (
                  account &&
                  (account.address || typeof account === "string")
                ) {
                  setConnected(true);
                  setAddress(account.address || account);
                  setAccounts([account.address || account]);
                  setCurrentAccountIndex(0);
                  setNetwork("mainnet");
                  setConnectionStatus("connected");
                  console.log(
                    "Successfully reconnected to Pontem wallet:",
                    account.address || account
                  );
                }
              }
            } catch (error) {
              console.error("Failed to reconnect to Pontem wallet:", error);
              setConnectionStatus("error");
            }
          };

          // Listen for Pontem wallet events
          if (pontem && typeof pontem.on === "function") {
            pontem.on("accountChanged", handlePontemAccountChange);
            pontem.on("accountsChanged", handlePontemAccountChange);
            pontem.on("connect", handlePontemAccountChange);
            pontem.on("disconnect", () => {
              console.log("Pontem wallet disconnected");
              setConnected(false);
              setAddress(null);
              setAccounts([]);
              setCurrentAccountIndex(0);
              setConnectionStatus("disconnected");
            });
          }

          // Also listen for window events that might indicate wallet changes
          window.addEventListener(
            "pontemAccountChanged",
            handlePontemAccountChange
          );
          window.addEventListener(
            "pontemAccountsChanged",
            handlePontemAccountChange
          );

          // Poll for changes every 2 seconds as fallback, chỉ khi đã connected
          let pollInterval: NodeJS.Timeout | null = null;
          if (connected) {
            pollInterval = setInterval(async () => {
              try {
                const currentAccounts = await getAccounts();
                const currentAddress = currentAccounts[0] || address;

                if (currentAddress !== address) {
                  console.log("Address change detected via polling:", {
                    old: address,
                    new: currentAddress,
                  });
                  handlePontemAccountChange();
                }
              } catch (error) {
                console.log("Polling check failed:", error);
              }
            }, 2000);
          }

          return () => {
            if (pollInterval) clearInterval(pollInterval);
            window.removeEventListener(
              "pontemAccountChanged",
              handlePontemAccountChange
            );
            window.removeEventListener(
              "pontemAccountsChanged",
              handlePontemAccountChange
            );

            if (pontem && typeof pontem.removeListener === "function") {
              pontem.removeListener(
                "accountChanged",
                handlePontemAccountChange
              );
              pontem.removeListener(
                "accountsChanged",
                handlePontemAccountChange
              );
              pontem.removeListener("connect", handlePontemAccountChange);
              pontem.removeListener("disconnect", () => {});
            }
          };
        } else {
          console.log("Pontem wallet not detected");
          setConnectionStatus("disconnected");
        }
      };

      checkPontemAvailability();
      window.addEventListener("load", checkPontemAvailability);

      return () => {
        window.removeEventListener("load", checkPontemAvailability);
      };
    }
  }, [connected, address]);

  const value: PontemContextType = {
    connected,
    address,
    network,
    signAndSubmitTransaction,
    connect,
    disconnect,
    isPontemAvailable,
    connectionStatus,
    accounts,
    currentAccountIndex,
    switchAccount,
    getAccounts,
    refreshWalletState,
  };

  return (
    <PontemContext.Provider value={value}>{children}</PontemContext.Provider>
  );
};
