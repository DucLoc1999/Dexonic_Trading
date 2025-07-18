"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { PetraProvider, usePetra } from "./petra-context"
import { PontemProvider, usePontem } from "./pontem-context"

export type WalletType = 'petra' | 'pontem' | null

interface MultiWalletContextType {
  activeWallet: WalletType
  setActiveWallet: (wallet: WalletType) => void
  connected: boolean
  address: string | null
  network: string | null
  signAndSubmitTransaction: (payload: any) => Promise<any>
  connect: (walletType: WalletType) => Promise<void>
  disconnect: () => void
  availableWallets: WalletType[]
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  // Multi-account support
  accounts: string[]
  currentAccountIndex: number
  switchAccount: (index: number) => Promise<void>
  getAccounts: () => Promise<string[]>
  refreshWalletState: () => Promise<void>
}

const MultiWalletContext = createContext<MultiWalletContextType | undefined>(undefined)

export const useMultiWallet = () => {
  const context = useContext(MultiWalletContext)
  if (!context) {
    throw new Error("useMultiWallet must be used within a MultiWalletProvider")
  }
  return context
}

const WalletConnector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWallet, setActiveWallet] = useState<WalletType>(null)
  const [availableWallets, setAvailableWallets] = useState<WalletType[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  const petra = usePetra()
  const pontem = usePontem()

  // Determine available wallets
  useEffect(() => {
    const wallets: WalletType[] = []
    if (petra.isPetraAvailable) wallets.push('petra')
    if (pontem.isPontemAvailable) wallets.push('pontem')
    setAvailableWallets(wallets)
  }, [petra.isPetraAvailable, pontem.isPontemAvailable])

  // Get current wallet state
  const getCurrentWallet = () => {
    switch (activeWallet) {
      case 'petra':
        return petra
      case 'pontem':
        return pontem
      default:
        return null
    }
  }

  const currentWallet = getCurrentWallet()

  const connect = async (walletType: WalletType) => {
    if (!walletType) return

    setConnectionStatus('connecting')
    setActiveWallet(walletType)

    try {
      switch (walletType) {
        case 'petra':
          await petra.connect()
          break
        case 'pontem':
          await pontem.connect()
          break
      }
      setConnectionStatus('connected')
    } catch (error) {
      console.error(`Failed to connect to ${walletType}:`, error)
      setConnectionStatus('error')
      setActiveWallet(null)
    }
  }

  const disconnect = () => {
    if (currentWallet) {
      currentWallet.disconnect()
    }
    setActiveWallet(null)
    setConnectionStatus('disconnected')
  }

  // Update connection status based on current wallet
  useEffect(() => {
    if (currentWallet) {
      setConnectionStatus(currentWallet.connectionStatus)
    } else {
      setConnectionStatus('disconnected')
    }
  }, [currentWallet?.connectionStatus])

  // Multi-account support
  const accounts = currentWallet?.accounts || []
  const currentAccountIndex = currentWallet?.currentAccountIndex || 0
  
  const switchAccount = async (index: number) => {
    if (currentWallet && typeof currentWallet.switchAccount === 'function') {
      await currentWallet.switchAccount(index)
    }
  }

  const getAccounts = async () => {
    if (currentWallet && typeof currentWallet.getAccounts === 'function') {
      return await currentWallet.getAccounts()
    }
    return []
  }

  const refreshWalletState = async () => {
    if (currentWallet && typeof currentWallet.refreshWalletState === 'function') {
      await currentWallet.refreshWalletState()
    }
  }

  const value: MultiWalletContextType = {
    activeWallet,
    setActiveWallet,
    connected: currentWallet?.connected || false,
    address: currentWallet?.address || null,
    network: currentWallet?.network || null,
    signAndSubmitTransaction: currentWallet?.signAndSubmitTransaction || (async () => { throw new Error("No wallet connected") }),
    connect,
    disconnect,
    availableWallets,
    connectionStatus,
    accounts,
    currentAccountIndex,
    switchAccount,
    getAccounts,
    refreshWalletState,
  }

  return <MultiWalletContext.Provider value={value}>{children}</MultiWalletContext.Provider>
}

export const MultiWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PetraProvider>
      <PontemProvider>
        <WalletConnector>
          {children}
        </WalletConnector>
      </PontemProvider>
    </PetraProvider>
  )
} 