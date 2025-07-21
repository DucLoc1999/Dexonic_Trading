"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrentToken } from "@/context/CurrentTokenContext";
import { coinsListAptos } from "@/data/tokens-list";

// Simple toast notification system
const toast = {
  success: (message: string) => {
    // Create toast element
    const toastElement = document.createElement("div");
    toastElement.className =
      "fixed top-4 right-4 bg-[#01B792] text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full";
    toastElement.textContent = message;
    toastElement.style.fontFamily = "Montserrat";
    toastElement.style.fontWeight = "600";

    // Add to DOM
    document.body.appendChild(toastElement);

    // Animate in
    setTimeout(() => {
      toastElement.classList.remove("translate-x-full");
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      toastElement.classList.add("translate-x-full");
      setTimeout(() => {
        if (document.body.contains(toastElement)) {
          document.body.removeChild(toastElement);
        }
      }, 300);
    }, 3000);
  },
};

interface MainComponentLeftProps {
  // Remove symbol and price props since we'll use context
}

interface CoinGeckoData {
  usd: number;
  usd_24h_vol: number;
}

interface CoinGeckoPercentageChangeData {
  id: string;
  symbol: string;
  name: string;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
}

interface CoinGeckoHistoryData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface CoinMarketCapData {
  data: {
    bullish: number;
    bearish: number;
    total: number;
  };
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

const MainComponentLeft: React.FC<MainComponentLeftProps> = () => {
  // Use the context instead of props
  const { currentToken } = useCurrentToken();

  // const [coinGeckoIds, setCoinGeckoIds] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<CoinGeckoData | null>(null);
  const [percentageChangeData, setPercentageChangeData] =
    useState<CoinGeckoPercentageChangeData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<CoinMarketCapData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get coin gecko id by symbol
  // useEffect(() => {
  //   console.log("fetching coin gecko ids...");
  //   async function fetchCoinGeckoIds() {
  //     const response = await fetch("/api/coingecko/token-list");
  //     const data = await response.json();
  //     console.log("coin list:", data);
  //     setCoinGeckoIds(data);
  //   }
  //   fetchCoinGeckoIds();
  // }, []);

  // Map symbol to CoinGecko ID
  const getCoinGeckoId = (symbol: string) => {
    const baseSymbol: string = symbol
      .replace(/(USDT|USDC|usdc|usdt)$/, "")
      .toLowerCase();
    // const coinList: { [key: string]: string } = {
    //   btc: "bitcoin",
    //   eth: "ethereum",
    //   ada: "cardano",
    //   sol: "solana",
    //   dot: "polkadot",
    //   link: "chainlink",
    //   uni: "uniswap",
    //   ltc: "litecoin",
    //   bch: "bitcoin-cash",
    //   xrp: "ripple",
    //   atom: "cosmos",
    //   avax: "avalanche-2",
    //   algo: "algorand",
    //   apt: "aptos",
    //   bnb: "binancecoin",
    //   mkr: "maker",
    //   yfi: "yearn-finance",
    //   aave: "aave",
    //   gno: "gnosis",
    //   rose: "oasis-network",
    //   hbar: "hedera-hashgraph",
    //   tao: "bittensor",
    //   min: "minima",
    //   pokt: "pocket-network",
    //   paxg: "pax-gold",
    //   wbeth: "wrapped-beacon-eth",
    //   wbtc: "wrapped-bitcoin",
    //   wpokt: "wrapped-pocket-network",
    //   bifi: "beefy-finance",
    //   boba: "boba-network",
    //   glmr: "moonbeam",
    //   gmlr: "moonbeam",
    //   movr: "moonriver",
    // };
    return coinsListAptos[baseSymbol].id;
  };

  // Fetch 24h volume data
  const fetchVolumeData = async () => {
    setLoading(true);
    setError(null);

    try {
      const coinId = getCoinGeckoId(currentToken.symbol);
      const response = await fetch(`/api/coingecko/volume24h/${coinId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoData = await response.json();
      setVolumeData(data);
    } catch (err) {
      console.error("Error fetching volume data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch volume data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch price change percentage data (1H, 24H, 7D)
  const fetchPercentageChangeData = async () => {
    try {
      const coinId = getCoinGeckoId(currentToken.symbol);
      const response = await fetch(
        `/api/coingecko/percentage-change/${coinId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoPercentageChangeData = await response.json();
      setPercentageChangeData(data);
    } catch (err) {
      console.error("Error fetching market data:", err);
    }
  };

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      const coinId = getCoinGeckoId(currentToken.symbol);
      const response = await fetch(`/api/coingecko/chart-data/${coinId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData: CoinGeckoHistoryData = await response.json();

      // Format the data before saving to state
      if (rawData && rawData.prices && rawData.prices.length > 0) {
        const formattedData = rawData.prices.map((price: [number, number]) => {
          const timestamp = price[0];
          const priceValue = price[1];
          const date = new Date(timestamp);
          const timeString = date.toLocaleTimeString();
          const dateString = date.toLocaleDateString();

          return {
            timeString,
            dateString,
            price: Number(priceValue),
            timestamp: timestamp,
          };
        });

        // Limit to reasonable number of points for chart performance
        const step = Math.max(1, Math.floor(formattedData.length / 20));
        const filteredData = formattedData.filter(
          (_, index) => index % step === 0
        );

        setChartData(filteredData);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setChartData([]);
    }
  };

  // Format volume to readable format
  const formatVolume = (volume: number): string => {
    if (volume >= 1e12) {
      return `$${(volume / 1e12).toFixed(2)}T`;
    } else if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  };

  // Generic function to format percentage change
  const formatPercentageChange = (timeframe: "1h" | "4h" | "1D"): string => {
    if (!percentageChangeData) return "NaN";

    let change: number | undefined;
    switch (timeframe) {
      case "1h":
        change = percentageChangeData.price_change_percentage_1h_in_currency;
        break;
      case "4h":
        // Calculate 4H change from chart data
        if (chartData && chartData.length > 1) {
          const currentPrice = chartData[chartData.length - 1].price;
          const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
          let price4HoursAgo = chartData[0].price;

          // Find price closest to 4 hours ago
          for (let i = chartData.length - 1; i >= 0; i--) {
            if (chartData[i].timestamp <= fourHoursAgo) {
              price4HoursAgo = chartData[i].price;
              break;
            }
          }

          change = ((currentPrice - price4HoursAgo) / price4HoursAgo) * 100;
        }
        break;
      case "1D":
        change = percentageChangeData.price_change_percentage_24h_in_currency;
        break;
      default:
        return "NaN";
    }

    if (change === undefined) return "NaN";
    return change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  };

  // Generic function to get color for percentage change
  const getPercentageChangeColor = (timeframe: "1h" | "4h" | "1D"): string => {
    if (!percentageChangeData) return "text-[#01B792]";

    let change: number | undefined;
    switch (timeframe) {
      case "1h":
        change = percentageChangeData.price_change_percentage_1h_in_currency;
        break;
      case "4h":
        // Calculate 4H change from chart data
        if (chartData && chartData.length > 1) {
          const currentPrice = chartData[chartData.length - 1].price;
          const fourHoursAgo =
            chartData[chartData.length - 1].timestamp - 4 * 60 * 60 * 1000;
          let price4HoursAgo = chartData[0].price;

          // Find price closest to 4 hours ago
          for (let i = chartData.length - 1; i >= 0; i--) {
            if (chartData[i].timestamp <= fourHoursAgo) {
              price4HoursAgo = chartData[i].price;
              break;
            }
          }

          change = ((currentPrice - price4HoursAgo) / price4HoursAgo) * 100;
        }
        break;
      case "1D":
        change = percentageChangeData.price_change_percentage_24h_in_currency;
        break;
      default:
        return "text-[#01B792]";
    }

    if (change === undefined) return "text-[#01B792]";
    return change >= 0 ? "text-[#01B792]" : "text-[#FF4349]";
  };

  // Fetch data on component mount and when symbol changes
  useEffect(() => {
    if (currentToken.symbol) {
      const fetchData = async () => {
        await fetchVolumeData();
        await fetchPercentageChangeData();
        await fetchChartData();
        // await fetchSentimentData();
      };
      fetchData();
    }
  }, [currentToken]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Content - Takes available space */}
      <div className="flex-1 flex flex-col p-2">
        {/* Token Section */}
        <div className="flex items-center bg-[#000] rounded-t-xl px-4 py-3 border border-[#3A3A3A] overflow-auto">
          {/* Icon */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <Image
              src={`/icon/${currentToken.symbol.replace(
                /(USDT|USDC|usdc|usdt)$/,
                ""
              )}.svg`}
              alt={currentToken.symbol}
              width={32}
              height={32}
              className="w-8 h-8 bg-white rounded-full p-1 flex items-center justify-center"
            />
          </div>
          <div className="ml-3 flex flex-col justify-center flex-1">
            <div
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Montserrat", fontWeight: 700 }}
            >
              {currentToken.symbol.replace(/(USDT|USDC|usdc|usdt)$/, "")}/
              {currentToken.symbol.endsWith("USDT") ? "USDT" : "USDC"}
            </div>
            <div className="flex items-center mt-1">
              <div
                className="text-gray-400 text-sm font-mono"
                style={{ fontFamily: "Montserrat" }}
              >
                0xf2...1b17fa
              </div>
              <Image
                src="/img/Copy.svg"
                alt="Copy"
                width={16}
                height={16}
                className="w-4 h-4 ml-2 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText("0xf2...1b17fa");
                  toast.success("Token address copied to clipboard");
                }}
              />
              <Image
                src="/img/token1.svg"
                alt=""
                width={16}
                height={16}
                className="ml-2 bg-white rounded-full p-[1px]"
              />
              <Image
                src="/img/token2.svg"
                alt=">"
                width={16}
                height={16}
                className="ml-1 bg-white rounded-full p-[1px]"
              />
            </div>
          </div>
        </div>

        {/* Price and Volume Row */}
        <div className="grid grid-cols-2">
          <div className="border border-[#3A3A3A] text-[#ffffff] p-3 flex flex-col justify-between items-center overflow-auto">
            <span
              className="text-sm mb-1 overflow-auto whitespace-nowrap"
              style={{ fontFamily: "Montserrat" }}
            >
              PRICE
            </span>
            <p
              className="text-[#01B792] text-lg font-bold"
              style={{ fontFamily: "Montserrat", fontWeight: 700 }}
            >
              {`$${currentToken.price.toString()}`}
            </p>
          </div>
          <div className="border border-[#3A3A3A] text-[#ffffff] p-3 flex flex-col justify-between items-center overflow-auto">
            <span
              className="text-sm mb-1 overflow-auto whitespace-nowrap"
              style={{ fontFamily: "Montserrat" }}
            >
              24H VOLUME
            </span>
            <p
              className={`text-lg font-bold ${
                loading
                  ? "text-[#01B792]"
                  : error
                  ? "text-[#FF4349]"
                  : "text-[#ffffff]"
              }`}
              style={{ fontFamily: "Montserrat", fontWeight: 700 }}
            >
              {loading
                ? "Loading..."
                : error
                ? "Error"
                : volumeData
                ? formatVolume(volumeData.usd_24h_vol)
                : "Nan"}
            </p>
          </div>
        </div>

        {/* Percentage Change Row */}
        <div className="grid grid-cols-3">
          <div className="border border-[#3A3A3A] text-[#ffffff] p-3 flex flex-col justify-center items-center overflow-auto">
            <span className="text-sm mb-1" style={{ fontFamily: "Montserrat" }}>
              1H
            </span>
            <p
              className={`text-sm font-bold ${
                loading ? "text-[#01B792]" : getPercentageChangeColor("1h")
              }`}
              style={{ fontFamily: "Montserrat", fontWeight: 700 }}
            >
              {loading ? "Loading..." : formatPercentageChange("1h")}
            </p>
          </div>
          <div className="border border-[#3A3A3A] text-[#ffffff] p-3 flex flex-col justify-center items-center overflow-auto">
            <span className="text-sm mb-1" style={{ fontFamily: "Montserrat" }}>
              4H
            </span>
            <p
              className={`text-sm font-bold ${
                loading ? "text-[#01B792]" : getPercentageChangeColor("4h")
              }`}
              style={{ fontFamily: "Montserrat", fontWeight: 700 }}
            >
              {loading ? "Loading..." : formatPercentageChange("4h")}
            </p>
          </div>
          <div className="border border-[#3A3A3A] text-[#ffffff] p-3 flex flex-col justify-center items-center overflow-auto">
            <span className="text-sm mb-1" style={{ fontFamily: "Montserrat" }}>
              1D
            </span>
            <p
              className={`text-sm font-bold ${
                loading ? "text-[#01B792]" : getPercentageChangeColor("1D")
              }`}
              style={{ fontFamily: "Montserrat", fontWeight: 700 }}
            >
              {loading ? "Loading..." : formatPercentageChange("1D")}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="border border-[#3A3A3A] h-48 p-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span
                className="text-[#01B792] text-sm"
                style={{ fontFamily: "Montserrat" }}
              >
                Loading chart...
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <Tooltip
                  formatter={(value: any) => {
                    return [
                      `$${
                        value.toFixed(2) > 0
                          ? value.toFixed(2)
                          : value.toFixed(8)
                      }`,
                      "Price",
                    ];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${payload[0].payload.timeString} ${payload[0].payload.dateString}`;
                    }
                    return `${label}`;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={
                    chartData.length > 1 &&
                    chartData[chartData.length - 1].price >= chartData[0].price
                      ? "#01B792"
                      : "#FF4349"
                  }
                  fill={
                    chartData.length > 1 &&
                    chartData[chartData.length - 1].price >= chartData[0].price
                      ? "#01B792"
                      : "#FF4349"
                  }
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sentiment Analysis - keep this commented out for now, do not delete */}

        {/* Trading Signals */}
        <div className="space-y-2">
          <h3
            className="text-white text-lg font-bold mb-3 items-center justify-center"
            style={{ fontFamily: "Montserrat", fontWeight: 700 }}
          >
            TRADING SIGNALS
          </h3>
          <div className="space-y-2">
            {["RSI7", "RSI14", "ADX", "PSAR"].map((signal) => (
              <div
                key={signal}
                className="flex items-center justify-between p-3 rounded border border-[#232323] bg-gradient-to-r from-[#0A001C] to-[#001E1D]"
              >
                <span
                  className="text-white text-base font-semibold"
                  style={{ fontFamily: "Montserrat" }}
                >
                  {signal}
                </span>
                <button className="w-6 h-6 flex items-center justify-center border border-[#3A3A3A] rounded text-white text-sm">
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Fixed at bottom */}
      <div className="mt-auto p-4">
        {/* Available On */}
        <div className="border border-[#3A3A3A] p-3">
          <div className="flex items-center w-[70%] sm:w-[100%] md:w-[100%] justify-between overflow-auto">
            <span
              className="text-white text-sm mr-8"
              style={{ fontFamily: "Montserrat" }}
            >
              AVAILABLE ON
            </span>
            <Image
              src="/img/CHPLAY.svg"
              alt="Google Play"
              width={24}
              height={24}
              className="mr-2"
            />
            <Image
              src="/img/APP.svg"
              alt="App Store"
              width={24}
              height={24}
              className="mr-2"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-6 min-w-[180px] min-h-[30px] overflow-auto gap-0">
          <div className="border border-[#3A3A3A] min-w-[30px] min-h-[30px] p-[5px] flex items-center justify-center hover:border-[#6EFFF8] transition-colors duration-300 cursor-pointer">
            <Link
              href="https://x.com/dexonic_finance"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/img/imgX.svg" alt="X" width={24} height={24} />
            </Link>
          </div>
          <div className="border border-[#3A3A3A] min-w-[30px] min-h-[30px] p-[5px] flex items-center justify-center hover:border-[#6EFFF8] transition-colors duration-300 cursor-pointer">
            <Image
              src="/img/telegram.svg"
              alt="Telegram"
              width={24}
              height={24}
            />
          </div>
          <div className="border border-[#3A3A3A] min-w-[30px] min-h-[30px] p-[5px] flex items-center justify-center hover:border-[#6EFFF8] transition-colors duration-300 cursor-pointer">
            <Image
              src="/img/discord.svg"
              alt="Discord"
              width={24}
              height={24}
            />
          </div>
          <div className="border border-[#3A3A3A] min-w-[30px] min-h-[30px] p-[5px] flex items-center justify-center hover:border-[#6EFFF8] transition-colors duration-300 cursor-pointer">
            <Image src="/img/imgIn.svg" alt="LinkedIn" width={24} height={24} />
          </div>
          <div className="border border-[#3A3A3A] min-w-[30px] min-h-[30px] p-[5px] flex items-center justify-center hover:border-[#6EFFF8] transition-colors duration-300 cursor-pointer">
            <Image src="/img/gmail.svg" alt="Gmail" width={24} height={24} />
          </div>
          <div className="border border-[#3A3A3A] min-w-[30px] min-h-[30px] p-[5px] flex items-center justify-center hover:border-[#6EFFF8] transition-colors duration-300 cursor-pointer">
            <Image
              src="/img/dexonic.png"
              alt="Dexonic"
              width={24}
              height={24}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainComponentLeft;
