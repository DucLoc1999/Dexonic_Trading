"use client";

import React from "react";
import { SwapInterface } from "./SwapInterface";
import { useRightSide } from "@/context/RightSideContext";

const MainComponentRight = () => {
  const { isSwapActive } = useRightSide();

  return (
    <div className="flex flex-col border border-[#3A3A3A] bg-[#000000]">
      {/* Content based on active button */}
      {isSwapActive && (
        <div className="flex flex-col border border-[#3A3A3A] bg-[#000000] p-4">
          <SwapInterface />
        </div>
      )}
    </div>
  );
};

export default MainComponentRight;
