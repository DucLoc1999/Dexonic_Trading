"use client"

import React, { useState } from "react"
import { useMultiWallet, WalletType } from "./multi-wallet-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, LogOut, AlertCircle, ChevronDown, Users } from "lucide-react"

export const MultiWalletSelector: React.FC = () => {
  const { 
    connected, 
    address, 
    network, 
    connect, 
    disconnect, 
    availableWallets, 
    connectionStatus,
    activeWallet,
    accounts,
    currentAccountIndex,
    switchAccount,
    refreshWalletState
  } = useMultiWallet()

  const [isOpen, setIsOpen] = useState(false)
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false)

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Connection Error'
      case 'disconnected':
      default:
        return 'Connect Wallet'
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-400'
      case 'connecting':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      case 'disconnected':
      default:
        return 'text-gray-400'
    }
  }

  const getButtonVariant = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'outline'
      case 'connecting':
        return 'secondary'
      case 'error':
        return 'destructive'
      case 'disconnected':
      default:
        return 'default'
    }
  }

  const getButtonIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <LogOut className="w-4 h-4" />
      case 'connecting':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      case 'disconnected':
      default:
        return <Wallet className="w-4 h-4" />
    }
  }

  const handleWalletAction = () => {
    if (connected) {
      disconnect()
      setIsOpen(false)
    } else {
      setIsOpen(true)
    }
  }

  const handleConnectWallet = async (walletType: WalletType) => {
    try {
      await connect(walletType)
      setIsOpen(false)
    } catch (error) {
      console.error(`Failed to connect to ${walletType}:`, error)
    }
  }

  const handleSwitchAccount = async (index: number) => {
    try {
      await switchAccount(index)
      setIsAccountSelectorOpen(false)
    } catch (error) {
      console.error("Failed to switch account:", error)
    }
  }

  const handleRefreshWallet = async () => {
    try {
      await refreshWalletState()
    } catch (error) {
      console.error("Failed to refresh wallet:", error)
    }
  }

  const getWalletDisplayName = (walletType: WalletType) => {
    switch (walletType) {
      case 'petra':
        return 'Petra Wallet'
      case 'pontem':
        return 'Pontem Wallet'
      default:
        return 'Unknown Wallet'
    }
  }

  const getWalletInstallUrl = (walletType: WalletType) => {
    switch (walletType) {
      case 'petra':
        return 'https://petra.app/'
      case 'pontem':
        return 'https://pontem.network/'
      default:
        return '#'
    }
  }

  if (availableWallets.length === 0) {
    return (
      <div className="flex flex-col space-y-2">
        <Button
          onClick={() => window.open('https://petra.app/', '_blank')}
          variant="outline"
          size="sm"
          className="swap-button-secondary"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Install Wallet
        </Button>
        <div className="text-xs text-gray-400 text-center">
          No wallets detected
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      {connected ? (
        // Connected state
        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleWalletAction}
            variant={getButtonVariant() as any}
            size="sm"
            className="swap-button-secondary flex items-center"
          >
            {getButtonIcon()}
            <span className="ml-2 font-mono">
              {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : getConnectionStatusText()}
            </span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          {/* Đã xoá nút Refresh ở đây */}
          {/* Đã xoá hiển thị tên ví ở đây */}
          {/* Account Selector for Pontem */}
          {activeWallet === 'pontem' && accounts.length > 1 && (
            <div className="flex flex-col space-y-1">
              <Button
                onClick={() => setIsAccountSelectorOpen(true)}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <Users className="w-3 h-3 mr-1" />
                Switch Account ({currentAccountIndex + 1}/{accounts.length})
              </Button>
              
              <Dialog open={isAccountSelectorOpen} onOpenChange={setIsAccountSelectorOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {accounts.map((account, index) => (
                      <Button
                        key={account}
                        onClick={() => handleSwitchAccount(index)}
                        variant={index === currentAccountIndex ? "default" : "outline"}
                        className="w-full justify-start"
                        size="sm"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Account {index + 1}</span>
                          <span className="text-xs text-gray-500">
                            {account.slice(0, 8)}...{account.slice(-6)}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      ) : (
        // Disconnected state - show wallet selector
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant={getButtonVariant() as any}
              size="sm"
              disabled={connectionStatus === 'connecting'}
              className="swap-button-secondary"
            >
              {getButtonIcon()}
              <span className="ml-2">{getConnectionStatusText()}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {availableWallets.map((walletType) => (
                <Button
                  key={walletType}
                  onClick={() => handleConnectWallet(walletType)}
                  className="w-full justify-start gap-3 h-12"
                  variant="outline"
                >
                  <Wallet className="w-5 h-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{getWalletDisplayName(walletType)}</span>
                    <span className="text-xs text-gray-500">
                      {walletType === 'pontem' ? 'Multi-account support' : 'Available'}
                    </span>
                  </div>
                </Button>
              ))}
              
              {availableWallets.length === 0 && (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">No wallets detected</p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => window.open('https://petra.app/', '_blank')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Install Petra Wallet
                    </Button>
                    <Button
                      onClick={() => window.open('https://pontem.network/', '_blank')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Install Pontem Wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {connectionStatus === 'error' && (
        <div className="text-xs text-red-400 text-center">
          Please check your wallet extension
        </div>
      )}
    </div>
  )
} 