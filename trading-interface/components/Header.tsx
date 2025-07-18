"use client";

import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, Search, X, RefreshCw } from "lucide-react";
import { useCurrentToken } from "@/context/CurrentTokenContext";
import { useTimeframe } from "@/context/TimeframeContext";
import { coinsListAptos } from "@/data/tokens-list";
import { WalletConnect } from "./WalletConnect";

const navLinks = [
  { label: "DASHBOARD", href: "#" },
  { label: "AGGREGATOR", href: "#" },
  { label: "ASSETS VAULT", href: "#" },
  { label: "DOCUMENTS", href: "#" },
];

const Header = () => {
  const [hoverTab, setHoverTab] = useState<number | null>(null);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const underlineRef = useRef<HTMLDivElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  // Toolbar
  const { setCurrentToken } = useCurrentToken();
  const { setTimeframe } = useTimeframe();
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tokenList, setTokenList] = useState<
    { symbol: string; price: number }[]
  >([]);
  const [timeFrame, setTimeFrame] = useState("1h");
  const timeFrameOptions = ["1h", "4h", "1D"];
  const [showTimeFrameDropdown, setShowTimeFrameDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchTokenList = async () => {
      try {
        const response = await fetch(
          "https://api.vistia.co/api/v2_2/prices/coin-prices"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch token list");
        }

        const data = await response.json();

        // Filter data to only include tokens from coinsListAptos
        const filteredData = data.filter((token: any) => {
          const symbol = token.symbol.replace("USDT", "").toLowerCase();
          return symbol in coinsListAptos;
        });

        setTokenList(filteredData);

        // Set default selection if filtered data is available
        if (filteredData.length > 0) {
          setCurrentToken({
            symbol: filteredData[0].symbol,
            price: filteredData[0].price,
          });
        }
      } catch (err) {
        console.error("Error fetching token list:", err);
        setTokenList([]);
      }
    };

    fetchTokenList();
  }, []);

  // Hiệu ứng underline sẽ theo hoverTab nếu có, nếu không thì ở tab 0 (DASHBOARD)
  const activeIdx = hoverTab !== null ? hoverTab : 0;

  useLayoutEffect(() => {
    const current = navRefs.current[activeIdx];
    if (current) {
      setUnderlineStyle({
        left: current.offsetLeft,
        width: current.offsetWidth,
      });
    }
  }, [activeIdx]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force a complete page reload
    window.location.reload();
  };

  return (
    <div className="relative grid grid-rows-2">
      <header className="border-b-2 border-[#3A3A3A] px-8 py-4 ">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-[10px] ">
            <div className="w-8 h-8  rounded-full"></div>{" "}
            {/* Placeholder for logo icon */}
            <div className=" mt-[10px] ml-[20px]">
              <Image
                src="/img/logo.svg"
                alt="Logo"
                width={150}
                height={50}
                priority
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-[10px] rounded-lg text-[20px] mt-[10px] relative">
            <div
              className="flex items-center justify-around rounded-md px-2 py-1 w-[700px] font-bold relative"
              style={{ fontFamily: "Montserrat", fontWeight: 700 }}
              onMouseEnter={() => {}}
              onMouseLeave={() => setHoverTab(null)}
            >
              {navLinks.map((item, idx) => (
                <a
                  key={item.label}
                  href={item.href}
                  ref={(el) => {
                    navRefs.current[idx] = el;
                  }}
                  className={`no-underline px-4 py-2 text-base font-bold transition-colors duration-200 relative z-10
                  ${
                    activeIdx === idx
                      ? "bg-clip-text bg-gradient-to-r from-[#6EFFF8] to-[#A571FF] text-transparent"
                      : "text-[#ffffff]"
                  }
                `}
                  onMouseEnter={() => setHoverTab(idx)}
                  // style={{ textDecoration: "none" }}
                  tabIndex={idx}
                >
                  {item.label}
                </a>
              ))}
              {/* Underline */}
              <div
                ref={underlineRef}
                className="absolute bottom-[-6px] h-[3px] bg-gradient-to-r from-[#6EFFF8] to-[#A571FF] rounded transition-all duration-300 z-0"
                style={{
                  left: underlineStyle.left,
                  width: underlineStyle.width,
                }}
              />
            </div>
          </nav>

          {/* Connect Wallet */}
          <WalletConnect />
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-row min-h-[80px] items-center gap-6 p-6 bg-[#000000]">
        {/* Search */}
        <div className="flex flex-col relative w-[50%] max-w-[600px] min-w-[350px]">
          <div
            className={`flex flex-col items-center px-4 h-14 shadow-2xl border-2 border-[#3A3A3A] bg-[#101010] hover:border-[#6EFFF8] transition-all duration-300 group ${
              showSuggestions ? "rounded-t-2xl" : "rounded-2xl"
            }`}
          >
            <div className="flex flex-row w-full h-full justify-between items-center">
              <input
                id="search-input"
                placeholder="Search for tokens..."
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setShowSuggestions(!!e.target.value);
                }}
                className="bg-transparent text-white placeholder-gray-400 w-full h-full outline-none text-lg font-medium"
                style={{ fontFamily: "Montserrat", color: "#ffffff" }}
                autoComplete="off"
              />
              <div>
                {!showSuggestions ? (
                  <Search
                    className="relative h-full text-[#6EFFF8] group-hover:text-[#A571FF] transition-colors duration-300"
                    size={20}
                    style={{ width: "auto" }}
                    onClick={() => setShowSuggestions(true)}
                  />
                ) : (
                  <X
                    className="relative h-full aspect-square text-[#6EFFF8] group-hover:text-[#A571FF] transition-colors duration-300"
                    size={20}
                    style={{ width: "auto" }}
                    onClick={() => setShowSuggestions(false)}
                  />
                )}
              </div>
            </div>
            {showSuggestions && (
              <div className="absolute top-full left-0 w-full bg-[#1A1A1A] rounded-b-2xl z-10 max-h-[300px] overflow-y-auto border-2 border-[#3A3A3A] border-t-0 shadow-2xl backdrop-blur-sm justify-between z-9999">
                {tokenList
                  .filter((token) =>
                    token.symbol
                      .toLowerCase()
                      .includes(searchValue.toLowerCase())
                  )
                  .slice(0, 8)
                  .map((token) => (
                    <button
                      key={token.symbol}
                      className="w-full px-6 py-4 cursor-pointer hover:bg-[#3A3A3A] text-white flex justify-between items-center border-b border-[#2A2A2A] last:border-b-0 transition-all duration-200 hover:scale-[1.02]"
                      onMouseDown={() => {
                        setSearchValue("");
                        setShowSuggestions(false);
                        setCurrentToken({
                          symbol: token.symbol,
                          price: token.price,
                        });
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Montserrat",
                          fontWeight: 600,
                          fontSize: "16px",
                          color: "#ffffff",
                        }}
                      >
                        {token.symbol}
                      </span>
                      <span
                        style={{
                          fontFamily: "Montserrat",
                          fontWeight: 600,
                          fontSize: "16px",
                          color: "#01B792",
                        }}
                      >
                        ${token.price.toString()}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Time Frame */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <span
            className="text-[18px] lg:text-[22px] text-white whitespace-nowrap font-semibold"
            style={{ fontFamily: "Montserrat", color: "#ffffff" }}
          >
            Time frame
          </span>
          <div className="relative">
            <button
              className={`flex items-center justify-between px-4 py-3 text-white font-bold border-2 border-[#3A3A3A] bg-[#101010] hover:bg-[#2A2A2A] hover:border-[#6EFFF8] transition-all duration-300 min-w-[100px] shadow-lg hover:shadow-xl pl-4 ${
                showTimeFrameDropdown ? "rounded-t-2xl" : "rounded-2xl"
              }`}
              style={{
                fontFamily: "Montserrat",
                fontWeight: 700,
                fontSize: "16px",
                color: "#ffffff",
              }}
              onMouseEnter={() => setShowTimeFrameDropdown(true)}
              onMouseLeave={() => setShowTimeFrameDropdown(false)}
            >
              <span style={{ color: "#ffffff" }}>{timeFrame}</span>
              <ChevronDown
                size={18}
                className="text-[#6EFFF8] transition-transform duration-300"
              />
            </button>
            {showTimeFrameDropdown && (
              <div className="absolute top-full left-0 w-full bg-[#1A1A1A] rounded-b-2xl z-10 max-h-[300px] overflow-y-auto border-2 border-[#3A3A3A] border-t-0 shadow-2xl backdrop-blur-sm">
                {timeFrameOptions.map((option) => (
                  <button
                    key={option}
                    className={`w-full px-6 py-4 text-left hover:bg-[#3A3A3A] transition-all duration-200 hover:scale-[1.02] ${
                      timeFrame === option
                        ? "text-[#01B792] bg-[#2A2A2A]"
                        : "text-white"
                    }`}
                    style={{
                      fontFamily: "Montserrat",
                      fontWeight: 600,
                      fontSize: "16px",
                      color: timeFrame === option ? "#01B792" : "#ffffff",
                    }}
                    onClick={() => {
                      setTimeFrame(option);
                      setShowTimeFrameDropdown(false);
                      setTimeframe({
                        timeframe: option,
                      });
                    }}
                    onMouseEnter={() => setShowTimeFrameDropdown(true)}
                    onMouseLeave={() => setShowTimeFrameDropdown(false)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center justify-center px-4 py-3 text-white font-bold border-2 border-[#3A3A3A] bg-[#101010] hover:bg-[#2A2A2A] hover:border-[#6EFFF8] transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl ${
              isRefreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontSize: "16px",
              color: "#ffffff",
            }}
          >
            <RefreshCw
              size={18}
              className={`text-[#6EFFF8] transition-transform duration-300 ${
                isRefreshing
                  ? "animate-spin"
                  : isHovering
                  ? "rotate-180"
                  : "rotate-0"
              }`}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            />
          </button>
        </div>

        {/* Action Buttons */}
      </div>
    </div>
  );
};

export default Header;
