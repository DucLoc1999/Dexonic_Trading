"use client";

import React, { useState } from "react";
import Swap from "./Swap";
import MainComponentRight from "@/components/MainComponentRight";
import { Search, TrendingUp, Users } from "lucide-react";
import MainComponentLeft from "@/components/MainComponentLeft";

const Main = () => {
  const [showSwap, setShowSwap] = useState(false);
  const [showTradingAgents, setShowTradingAgents] = useState(false);

  const handleSwapClick = () => {
    setShowSwap(true);
    setShowTradingAgents(false); // Ẩn MainComponentRight khi ấn Swap
  };

  const handleTradingAgentsClick = () => {
    setShowTradingAgents(true);
    setShowSwap(false);
  };

  const handleBackClick = () => {
    setShowSwap(false);
    setShowTradingAgents(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-row min-h-[80px] items-center gap-4 p-4 bg-[#000000]">
        {/* Search */}
        <div className="flex flex-col w-[40%] max-w-[400px] min-w-[300px] h-full">
          <div className="flex items-center h-12 rounded-xl relative shadow-lg border border-[#3A3A3A] bg-[#101010]">
            <input
              id="search-input"
              placeholder="Search for tokens..."
              className="bg-transparent border-none text-white placeholder-gray-400 pl-12 pr-10 w-full h-full outline-none"
              style={{ fontFamily: "Montserrat" }}
            />
            <Search
              className="relative left-4 top-1/2 -translate-y-1/2 text-[#ffffff]"
              size={20}
            />
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-[#01B792] to-[#310086] rounded-b-xl mt-1"></div>
        </div>

        {/* Time Frame */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <span
            className="text-[16px] lg:text-[20px] text-[#808080] whitespace-nowrap"
            style={{ fontFamily: "Montserrat" }}
          >
            Time frame
          </span>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 text-white font-semibold border border-[#3A3A3A] bg-[#101010] rounded-md hover:bg-[#2A2A2A] transition-colors min-w-[80px]">
              <span>1h</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSwapClick}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#01B792] to-[#310086] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            style={{ fontFamily: "Montserrat" }}
          >
            <TrendingUp size={20} />
            Swap
          </button>
          <button
            onClick={handleTradingAgentsClick}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6EFFF8] to-[#A571FF] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            style={{ fontFamily: "Montserrat" }}
          >
            <Users size={20} />
            Trading Agents
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* Container relative để định vị MainComponentRight */}
        <div className="relative h-full">
          {/* Hiển thị Swap hoặc MainComponentRight tương ứng */}
          {showSwap && (
            <div className="absolute inset-0 z-10 bg-[#000000]">
              <Swap />
            </div>
          )}
          {showTradingAgents && (
            <div className="absolute inset-0 z-10 bg-[#000000]">
              <MainComponentRight />
            </div>
          )}
          {!showSwap && !showTradingAgents && (
            <div className="h-full">
              <MainComponentLeft />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Main;
