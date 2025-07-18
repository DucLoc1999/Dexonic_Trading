"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";

// ========================
// DEX_ID mapping theo smart contract:
// Liquidswap: 1
// Econia: 2
// Panora: 3
// Amnis: 4
// AnimeSwap: 5
// SushiSwap: 6
// PancakeSwap: 7
// ========================
// Pool address và type token cho cả chiều APT/USDC và USDC/APT
// ... (bổ sung hoặc cập nhật các object cấu hình pool tương tự như BE)

export const AdminInitializer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitialize = async () => {
    setIsInitializing(true);

    // Simulate initialization process
    setTimeout(() => {
      setIsInitialized(true);
      setIsInitializing(false);
    }, 2000);
  };

  if (isInitialized) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-500 font-medium">
              Aggregator Initialized
            </span>
            <Badge variant="secondary" className="text-xs">
              Ready
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Admin Initialization</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-300">
              Aggregator needs to be initialized
            </span>
          </div>
          <Button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="w-full"
          >
            {isInitializing ? "Initializing..." : "Initialize Aggregator"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
