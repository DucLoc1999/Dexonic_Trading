"use client"

import React from "react"
import { usePetra } from "./petra-context"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, AlertCircle } from "lucide-react"

export const WalletSelector: React.FC = () => {
  const { 
    connected, 
    address, 
    network, 
    connect, 
    disconnect, 
    isPetraAvailable, 
    connectionStatus 
  } = usePetra()

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
    } else {
      connect()
    }
  }

  if (!isPetraAvailable) {
    return (
      <div className="flex flex-col space-y-2">
        <Button
          onClick={() => window.open('https://pontem.network/', '_blank')}
          variant="outline"
          size="sm"
          className="swap-button-secondary"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Install Pontem
        </Button>
        <div className="text-xs text-gray-400 text-center">
          Pontem Wallet not detected
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      <Button
        onClick={handleWalletAction}
        variant={getButtonVariant() as any}
        size="sm"
        disabled={connectionStatus === 'connecting'}
        className="swap-button-secondary"
      >
        {getButtonIcon()}
        <span className="ml-2">{getConnectionStatusText()}</span>
      </Button>
      
      {connected && address && (
        <div className="text-xs text-gray-400 text-center">
          {address.slice(0, 8)}...{address.slice(-6)}
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <div className="text-xs text-red-400 text-center">
          Please check Petra extension
        </div>
      )}
    </div>
  )
} 