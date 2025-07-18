"use server";

import React from "react";
import Header from "../components/Header";
import MainComponentLeft from "@/components/MainComponentLeft";
import MainComponentCenter from "@/components/MainComponentCenter";
import MainComponentRight from "@/components/MainComponentRight";
import TransactionHistory from "@/components/TransactionHitory";
import Footer from "@/components/Footer";
import { RightSideProvider } from "@/context/RightSideContext";
import ButtonToggle from "@/components/ButtonToggle";
import TradingAgentsServer from "@/components/TradingAgentsServer";

export default async function Home() {
  return (
    <div className="flex flex-col relative bg-[#000000] min-w-[100vw] min-h-[100vh] w-full h-full m-0 p-0 text-gray-300 font-sans">
      {/* Header */}
      <div className="relative w-full border-2 border-[#3A3A3A] rounded-t-2xl">
        <Header />
      </div>

      <div className="flex flex-row relative w-full h-full">
        {/* Left MainComponent */}
        <div className="w-[15%] relative min-h-[400px] border-2 border-[#3A3A3A] bg-[#101010] overflow-auto">
          <MainComponentLeft />
        </div>

        {/* Center Content */}
        <div className="w-[65%] relative min-h-[400px] border-2 border-[#3A3A3A] bg-[#101010] overflow-auto">
          <div className="relative p-2 border-b border-[#2A2A2A]">
            <MainComponentCenter />
          </div>
          <div className="relative p-2">
            <TransactionHistory />
          </div>
        </div>

        {/* Right MainComponent */}
        <div className="w-[20%] relative min-h-[400px] border-2 border-[#3A3A3A] bg-[#101010] overflow-auto">
          <RightSideProvider>
            <ButtonToggle />
            <MainComponentRight />
            <TradingAgentsServer />
          </RightSideProvider>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full border-2 border-[#3A3A3A] rounded-b-2xl">
        <Footer />
      </div>
    </div>
  );
}
