"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, TrendingUp, Zap, RefreshCw, ChevronDown, History, Settings } from "lucide-react"

export const MobileMenuBar = () => {
  const [activeTab, setActiveTab] = useState("swap")

  const tabs = [
    { id: "swap", label: "Swap", icon: ArrowUpDown },
    { id: "limit", label: "Limit", icon: TrendingUp },
    { id: "dca", label: "DCA", icon: Zap },
    { id: "cross-chain", label: "Cross-chain", icon: RefreshCw },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="mobile-menu relative px-2 py-3 md:hidden">
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 animate-pulse">
        <div className="swap-badge rounded-full p-1">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      <div className="flex space-x-2 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              className="mobile-menu-item flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
              {tab.id === "limit" && (
                <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 swap-badge text-xs px-1.5 py-0.5 ml-1">
                  New
                </div>
              )}
              {tab.id === "cross-chain" && (
                <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 swap-badge text-xs px-1.5 py-0.5 ml-1">
                  Beta
                </div>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
