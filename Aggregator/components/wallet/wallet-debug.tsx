"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

export const WalletDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkWallets = () => {
      const info: any = {
        petra: {
          available: !!(window as any).aptos,
          object: (window as any).aptos,
          methods: (window as any).aptos ? Object.keys((window as any).aptos) : []
        },
        pontem: {
          available: !!(window as any).pontem || !!(window as any).Pontem,
          object: (window as any).pontem || (window as any).Pontem,
          methods: []
        }
      }

      // Check Pontem methods
      const pontemObj = (window as any).pontem || (window as any).Pontem
      if (pontemObj) {
        info.pontem.methods = Object.keys(pontemObj)
      }

      // Check all wallet-related properties
      const walletProps = Object.keys(window).filter(key => 
        key.toLowerCase().includes('wallet') || 
        key.toLowerCase().includes('pontem') || 
        key.toLowerCase().includes('aptos')
      )
      info.allWalletProps = walletProps

      setDebugInfo(info)
    }

    checkWallets()
    
    // Check again after a delay to catch late-loading extensions
    const timer = setTimeout(checkWallets, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  const testConnection = async (walletType: 'petra' | 'pontem') => {
    try {
      if (walletType === 'petra' && (window as any).aptos) {
        const response = await (window as any).aptos.connect()
        console.log('Petra connect response:', response)
        alert('Petra connection successful!')
      } else if (walletType === 'pontem') {
        const pontem = (window as any).pontem || (window as any).Pontem
        if (pontem) {
          const response = await pontem.connect()
          console.log('Pontem connect response:', response)
          alert('Pontem connection successful!')
        } else {
          alert('Pontem not found!')
        }
      }
    } catch (error) {
      console.error(`${walletType} connection error:`, error)
      alert(`${walletType} connection failed: ${error}`)
    }
  }

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Info className="w-4 h-4 mr-2" />
        Debug Wallets
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Wallet Debug Info
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Petra Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold">Petra Wallet</h4>
            {debugInfo.petra?.available ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          {debugInfo.petra?.available && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500">
                Methods: {debugInfo.petra.methods.join(', ')}
              </div>
              <Button
                onClick={() => testConnection('petra')}
                size="sm"
                variant="outline"
              >
                Test Connection
              </Button>
            </div>
          )}
        </div>

        {/* Pontem Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold">Pontem Wallet</h4>
            {debugInfo.pontem?.available ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          {debugInfo.pontem?.available && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500">
                Methods: {debugInfo.pontem.methods.join(', ')}
              </div>
              <Button
                onClick={() => testConnection('pontem')}
                size="sm"
                variant="outline"
              >
                Test Connection
              </Button>
            </div>
          )}
        </div>

        {/* All Wallet Properties */}
        <div className="space-y-2">
          <h4 className="font-semibold">All Wallet Properties</h4>
          <div className="text-xs text-gray-500 space-y-1">
            {debugInfo.allWalletProps?.map((prop: string) => (
              <div key={prop} className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {prop}
                </Badge>
                <span>{typeof (window as any)[prop]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Debug Instructions */}
        <div className="space-y-2">
          <h4 className="font-semibold">Debug Instructions</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <p>1. Open browser console (F12)</p>
            <p>2. Run: <code>copy(debug-pontem.js)</code></p>
            <p>3. Paste and run in console</p>
            <p>4. Check for Pontem wallet objects</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 