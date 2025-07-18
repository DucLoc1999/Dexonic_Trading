"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface PetraContextType {
  connected: boolean
  address: string | null
  network: string | null
  signAndSubmitTransaction: (payload: any) => Promise<any>
  connect: () => Promise<void>
  disconnect: () => void
  isPetraAvailable: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  // Multi-account support (Petra typically has single account, but for interface consistency)
  accounts: string[]
  currentAccountIndex: number
  switchAccount: (index: number) => Promise<void>
  getAccounts: () => Promise<string[]>
  refreshWalletState: () => Promise<void>
}

const PetraContext = createContext<PetraContextType | undefined>(undefined)

export const usePetra = () => {
  const context = useContext(PetraContext)
  if (!context) {
    throw new Error("usePetra must be used within a PetraProvider")
  }
  return context
}

export const PetraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [network, setNetwork] = useState<string | null>(null)
  const [isPetraAvailable, setIsPetraAvailable] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [accounts, setAccounts] = useState<string[]>([])
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0)

  const connect = async () => {
    try {
      setConnectionStatus('connecting')
      
      // Check if Petra wallet is available
      if (typeof window !== "undefined" && (window as any).aptos) {
        const aptos = (window as any).aptos
        
        console.log("Attempting to connect to Petra wallet...")
        
        // Request connection
        const response = await aptos.connect()
        console.log("Petra connection response:", response)
        
        // Get account info
        const account = await aptos.account()
        console.log("Petra account:", account)
        
        if (account && account.address) {
          setConnected(true)
          setAddress(account.address)
          setNetwork(account.publicKey ? "mainnet" : "testnet")
          setAccounts([account.address]) // Petra typically has single account
          setCurrentAccountIndex(0)
          setConnectionStatus('connected')
          console.log("Successfully connected to Petra wallet:", account.address)
        } else {
          throw new Error("No account information received")
        }
      } else {
        // Petra wallet not available
        console.log("Petra wallet not detected")
        setConnectionStatus('error')
        alert("Petra Wallet không được tìm thấy. Vui lòng cài đặt Petra Wallet extension và thử lại.")
      }
    } catch (error) {
      console.error("Failed to connect to Petra:", error)
      setConnectionStatus('error')
      alert("Không thể kết nối với Petra Wallet. Vui lòng kiểm tra extension và thử lại.")
    }
  }

  const disconnect = () => {
    try {
      if (typeof window !== "undefined" && (window as any).aptos) {
        const aptos = (window as any).aptos
        aptos.disconnect()
      }
    } catch (error) {
      console.error("Failed to disconnect from Petra:", error)
    } finally {
      setConnected(false)
      setAddress(null)
      setNetwork(null)
      setConnectionStatus('disconnected')
      setAccounts([])
      setCurrentAccountIndex(0)
    }
  }

  const signAndSubmitTransaction = async (payload: any) => {
    try {
      if (typeof window !== "undefined" && (window as any).aptos) {
        const aptos = (window as any).aptos
        
        // Sign and submit transaction
        const response = await aptos.signAndSubmitTransaction(payload)
        console.log("Transaction response:", response)
        return response
      } else {
        throw new Error("Petra wallet not available")
      }
    } catch (error) {
      console.error("Transaction failed:", error)
      throw error
    }
  }

  // Multi-account support (Petra typically has single account)
  const switchAccount = async (index: number) => {
    // Petra doesn't support multi-account switching, but we keep the interface consistent
    console.log("Petra doesn't support account switching")
  }

  const getAccounts = async (): Promise<string[]> => {
    // Petra typically has single account
    return accounts
  }

  const refreshWalletState = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).aptos) {
        const aptos = (window as any).aptos
        const account = await aptos.account()
        if (account && account.address) {
          setConnected(true)
          setAddress(account.address)
          setNetwork(account.publicKey ? "mainnet" : "testnet")
          setAccounts([account.address])
          setCurrentAccountIndex(0)
          setConnectionStatus('connected')
          console.log("Refreshed Petra wallet state:", account.address)
        } else {
          setConnected(false)
          setAddress(null)
          setNetwork(null)
          setConnectionStatus('disconnected')
          setAccounts([])
          setCurrentAccountIndex(0)
          console.log("Refreshed Petra wallet state: Disconnected")
        }
      } else {
        setConnected(false)
        setAddress(null)
        setNetwork(null)
        setConnectionStatus('disconnected')
        setAccounts([])
        setCurrentAccountIndex(0)
        console.log("Refreshed Petra wallet state: Not available")
      }
    } catch (error) {
      console.error("Failed to refresh Petra wallet state:", error)
      setConnected(false)
      setAddress(null)
      setNetwork(null)
      setConnectionStatus('error')
      setAccounts([])
      setCurrentAccountIndex(0)
    }
  }

  useEffect(() => {
    // Check if Petra is available on mount
    if (typeof window !== "undefined") {
      const checkPetraAvailability = () => {
        const isAvailable = !!(window as any).aptos
        setIsPetraAvailable(isAvailable)
        
        if (isAvailable) {
          console.log("Petra wallet detected")
          
          // Check if already connected
          const checkConnection = async () => {
            try {
              const aptos = (window as any).aptos
              const account = await aptos.account()
              if (account && account.address) {
                setConnected(true)
                setAddress(account.address)
                setNetwork(account.publicKey ? "mainnet" : "testnet")
                setAccounts([account.address])
                setCurrentAccountIndex(0)
                setConnectionStatus('connected')
                console.log("Already connected to Petra wallet:", account.address)
              }
            } catch (error) {
              console.log("Not connected to Petra wallet")
              setConnectionStatus('disconnected')
            }
          }
          
          checkConnection()
        } else {
          console.log("Petra wallet not detected")
          setConnectionStatus('disconnected')
        }
      }
      
      checkPetraAvailability()
      
      // Listen for Petra wallet installation
      window.addEventListener('load', checkPetraAvailability)
      
      return () => {
        window.removeEventListener('load', checkPetraAvailability)
      }
    }
  }, [])

  const value: PetraContextType = {
    connected,
    address,
    network,
    signAndSubmitTransaction,
    connect,
    disconnect,
    isPetraAvailable,
    connectionStatus,
    accounts,
    currentAccountIndex,
    switchAccount,
    getAccounts,
    refreshWalletState,
  }

  return <PetraContext.Provider value={value}>{children}</PetraContext.Provider>
} 