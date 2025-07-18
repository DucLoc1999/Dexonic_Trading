"use client";

import React from "react";
import { useRightSide } from "@/context/RightSideContext";

const ButtonToggle = () => {
  const { isSwapActive, setIsSwapActive } = useRightSide();

  return (
    <div className="flex w-full lg:w-auto mb-4">
      {/* Swap */}
      <button
        className={`flex-1 lg:flex-none w-[50%] h-[50%] text-[18px] lg:text-xl font-bold border border-[#232323] transition-colors ${
          isSwapActive
            ? "bg-[#4A4A4A] text-[#ffffff]"
            : "bg-[#000000] text-[#B5B5B5] hover:bg-[#4A4A4A] hover:text-[#ffffff]"
        }`}
        style={{ fontFamily: "Montserrat", fontWeight: 700 }}
        onClick={() => setIsSwapActive(true)}
      >
        Swap
      </button>
      {/* Trading Agents */}
      <button
        className={`flex-1 lg:flex-none w-[50%] h-[50%] text-[18px] lg:text-xl font-bold border border-[#232323] transition-colors ${
          !isSwapActive
            ? "bg-[#4A4A4A] text-[#ffffff]"
            : "bg-[#000000] text-[#B5B5B5] hover:bg-[#4A4A4A] hover:text-[#ffffff]"
        }`}
        style={{ fontFamily: "Montserrat", fontWeight: 700 }}
        onClick={() => setIsSwapActive(false)}
      >
        Trading Agents
      </button>
    </div>
  );
};

export default ButtonToggle;
