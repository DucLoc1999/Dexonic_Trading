"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTimeframe } from "@/context/TimeframeContext";
import { useCurrentToken } from "@/context/CurrentTokenContext";
import { coinsListAptos } from "@/data/tokens-list";

interface AdxDataPoint {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  adx: number;
  predicted_trend: string;
}

interface PsarDataPoint {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  psar: number;
  predicted_trend: string;
}

interface CandlestickProps {
  candle: PsarDataPoint;
  index: number;
  onHover?: (candle: PsarDataPoint, pos: { x: number; y: number }) => void;
  onLeave?: () => void;
}

const MainComponentCenter = () => {
  const [psarData, setPsarData] = useState<PsarDataPoint[]>([]);
  const [selectedCandle, setSelectedCandle] = useState<PsarDataPoint | null>(
    null
  );
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [adxAreaData, setAdxAreaData] = useState<AdxDataPoint[]>([]);
  const [adxTooltip, setAdxTooltip] = useState<{
    x: number;
    y: number;
    value: number;
    dotX: number;
  } | null>(null);
  const [currentAdxValue, setCurrentAdxValue] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [currentPsarValue, setCurrentPsarValue] = useState<number>(0);
  const [currentPsarPrice, setCurrentPsarPrice] = useState<number>(0);
  const [rsi7Data, setRsi7Data] = useState<any[]>([]);
  const [rsi14Data, setRsi14Data] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredToken, setHoveredToken] = useState<{
    symbol: string;
    rsi: number;
    x: number;
    y: number;
    type: "rsi7" | "rsi14";
  } | null>(null);

  // Get contexts
  const { currentToken } = useCurrentToken();
  const { timeframe } = useTimeframe();

  // Fetch PSAR Candlestick Chart data
  const fetchPsarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have a valid token symbol
      if (!currentToken.symbol) {
        console.warn("No token symbol available, skipping PSAR data fetch");
        setPsarData([]);
        return;
      }

      const params = new URLSearchParams({
        timeframe: timeframe.timeframe,
      });
      const url = `https://api.vistia.co/api/v2_2/al-trade/trend-predict/trend-reversal-signal/psar-chart/${
        currentToken.symbol
      }?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setPsarData(data);
      // Set initial PSAR value and price to the last data point
      if (data.length > 0) {
        setCurrentPsarValue(data[data.length - 1].psar);
        setCurrentPsarPrice(data[data.length - 1].close);
      }
    } catch (err) {
      console.error("Error fetching candle data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch chart data"
      );
      setPsarData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch ADX Area Chart data
  const fetchAdxAreaData = async () => {
    try {
      // Check if we have a valid token symbol
      if (!currentToken.symbol) {
        console.warn("No token symbol available, skipping ADX data fetch");
        return;
      }

      const params = new URLSearchParams({
        timeframe: timeframe.timeframe,
      });
      const url = `https://api.vistia.co/api/v2_2/al-trade/trend-predict/trend-reversal-signal/adx-chart/${
        currentToken.symbol
      }?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Failed to fetch ADX area data");
        return;
      }
      const data = await res.json();
      setAdxAreaData(data);
      // Set initial ADX value and price to the last data point
      if (data.length > 0) {
        setCurrentAdxValue(data[data.length - 1].adx);
        setCurrentPrice(data[data.length - 1].close);
      }
    } catch (err) {
      console.error("Error fetching ADX area data:", err);
    }
  };

  // Fetch RSI7 Chart data
  const fetchRsi7Data = async () => {
    try {
      // Check if we have a valid token symbol
      if (!currentToken.symbol) {
        console.warn("No token symbol available, skipping RSI7 data fetch");
        return;
      }

      const params = new URLSearchParams({
        heatMapType: "rsi7",
        timeframe: timeframe.timeframe,
      });
      const url = `https://api.vistia.co/api/v2_2/al-trade/chart-data?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Failed to fetch RSI7 data");
        return;
      }
      const data = await res.json();

      // Filter data to only include tokens from coinsListAptos
      const filteredData = data.filter((item: any) => {
        const symbol = item.symbol.replace("USDT", "").toLowerCase();
        return symbol in coinsListAptos;
      });

      setRsi7Data(filteredData);
    } catch (err) {
      console.error("Error fetching RSI7 data:", err);
    }
  };

  // Fetch RSI14 Chart data
  const fetchRsi14Data = async () => {
    try {
      // Check if we have a valid token symbol
      if (!currentToken.symbol) {
        console.warn("No token symbol available, skipping RSI14 data fetch");
        return;
      }

      const params = new URLSearchParams({
        heatMapType: "rsi14",
        timeframe: timeframe.timeframe,
      });
      const url = `https://api.vistia.co/api/v2_2/al-trade/chart-data?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Failed to fetch RSI14 data");
        return;
      }
      const data = await res.json();

      // Filter data to only include tokens from coinsListAptos
      const filteredData = data.filter((item: any) => {
        const symbol = item.symbol.replace("USDT", "").toLowerCase();
        return symbol in coinsListAptos;
      });

      setRsi14Data(filteredData);
    } catch (err) {
      console.error("Error fetching RSI14 data:", err);
    }
  };

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch data if we have a valid token symbol
      if (currentToken.symbol) {
        await fetchPsarData();
        await fetchAdxAreaData();
        await fetchRsi7Data();
        await fetchRsi14Data();
      }
    };
    fetchData();
  }, [currentToken.symbol, timeframe.timeframe]);

  // Candlestick chart constants
  const candleChartHeight = 250; // Back to original height
  const candleWidth = 25; // Reduced from 40
  const candleSpacing = 45; // Reduced from 60
  const candleChartWidth =
    psarData.length > 0 ? psarData.length * candleSpacing + 120 : 800;
  const chartTopMargin = 60; // Reduced to move everything up
  const chartLeftMargin = 100; // Left margin for price axis and labels
  const chartBottomMargin = 100; // Much more space below the chart

  // Calculate scale for candlestick chart
  const maxPrice = Math.max(...psarData.map((d) => d.high));
  const minPrice = Math.min(...psarData.map((d) => d.low));
  const priceRange = maxPrice - minPrice;

  // Function to convert price to Y coordinate
  const priceToY = (price: number) => {
    if (priceRange === 0 || !isFinite(priceRange) || !isFinite(price)) {
      return candleChartHeight / 2 + chartTopMargin;
    }
    return (
      chartTopMargin +
      candleChartHeight -
      ((price - minPrice) / priceRange) * candleChartHeight
    );
  };

  // Component for a single candlestick
  const Candlestick: React.FC<CandlestickProps> = ({
    candle,
    index,
    onHover,
    onLeave,
  }) => {
    const x = index * candleSpacing + chartLeftMargin; // Position candles to the right of price axis
    const isGreen = candle.close > candle.open;

    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    const openY = priceToY(candle.open);
    const closeY = priceToY(candle.close);
    const psarY = priceToY(candle.psar);

    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);

    const handleMouseEnter = () => {
      if (onHover) onHover(candle, { x: x + candleWidth / 2, y: bodyTop });
    };

    const handleMouseLeave = () => {
      if (onLeave) onLeave();
    };

    return (
      <g
        key={index}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: "pointer" }}
      >
        {/* Line from high to low */}
        <line
          x1={x + candleWidth / 2}
          y1={highY}
          x2={x + candleWidth / 2}
          y2={lowY}
          stroke={isGreen ? "#22c55e" : "#ef4444"}
          strokeWidth="2"
        />

        {/* Candlestick body */}
        <rect
          x={x}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight || 2}
          fill={isGreen ? "#22c55e" : "#ef4444"}
          stroke={isGreen ? "#16a34a" : "#dc2626"}
          strokeWidth="1"
        />

        {/* PSAR dot */}
        <circle
          cx={x + candleWidth / 2}
          cy={psarY}
          r="3"
          fill={psarY < bodyTop ? "#ef4444" : "#22c55e"}
        />
      </g>
    );
  };

  // Area chart code - fixed dimensions
  const areaChartWidth = 600;
  const areaChartHeight = 300;
  const padding = 20;
  const innerWidth = areaChartWidth - padding * 2;
  const innerHeight = areaChartHeight - padding * 2;

  // Calculate scale for area chart
  const maxValue = Math.max(...adxAreaData.map((item) => item.adx), 0);

  // Calculate Y-axis thresholds
  const topThreshold = Math.ceil(maxValue / 10) * 10; // Round up to nearest 10
  const bottomThreshold = 0;
  const middleThreshold = Math.round((topThreshold + bottomThreshold) / 2);

  // Calculate time thresholds for X-axis (5 points: start, 25%, 50%, 75%, end)
  const getTimeThresholds = () => {
    if (adxAreaData.length === 0) return [];

    const indices = [
      0, // start
      Math.floor(adxAreaData.length * 0.25), // 25%
      Math.floor(adxAreaData.length * 0.5), // 50%
      Math.floor(adxAreaData.length * 0.75), // 75%
      adxAreaData.length - 1, // end
    ];

    return indices.map((index) => ({
      index,
      timestamp: adxAreaData[index]?.time,
      x: xScale(index),
    }));
  };

  // Calculate time thresholds for PSAR chart X-axis (5 points: start, 25%, 50%, 75%, end)
  const getPsarTimeThresholds = () => {
    if (psarData.length === 0) return [];

    const indices = [
      0, // start
      Math.floor(psarData.length * 0.25), // 25%
      Math.floor(psarData.length * 0.5), // 50%
      Math.floor(psarData.length * 0.75), // 75%
      psarData.length - 1, // end
    ];

    return indices.map((index) => ({
      index,
      timestamp: psarData[index]?.time,
      x: index * candleSpacing + chartLeftMargin + candleWidth / 2, // Align with candle centers
    }));
  };

  // Convert timestamp to datetime format
  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Function to convert coordinates for area chart
  const xScale = (index: number) =>
    (index / (adxAreaData.length - 1)) * innerWidth;
  const yScale = (value: number) => {
    if (topThreshold === 0) return innerHeight;
    return innerHeight - (value / topThreshold) * innerHeight;
  };

  // Create smooth path for area using curve
  const createSmoothPath = (values: AdxDataPoint[]) => {
    if (!values.length) return "";

    let path = `M ${xScale(0)} ${yScale(values[0].adx)}`;

    for (let i = 1; i < values.length; i++) {
      const prevX = xScale(i - 1);
      const prevY = yScale(values[i - 1].adx);
      const currX = xScale(i);
      const currY = yScale(values[i].adx);

      const cp1x = prevX + (currX - prevX) * 0.5;
      const cp1y = prevY;
      const cp2x = currX - (currX - prevX) * 0.5;
      const cp2y = currY;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currX} ${currY}`;
    }

    path += ` L ${xScale(values.length - 1)} ${innerHeight}`;
    path += ` L ${xScale(0)} ${innerHeight}`;
    path += " Z";

    return path;
  };

  // Create smooth line for area chart
  const createSmoothLine = (values: AdxDataPoint[]) => {
    if (!values.length) return "";

    let path = `M ${xScale(0)} ${yScale(values[0].adx)}`;

    for (let i = 1; i < values.length; i++) {
      const prevX = xScale(i - 1);
      const prevY = yScale(values[i - 1].adx);
      const currX = xScale(i);
      const currY = yScale(values[i].adx);

      const cp1x = prevX + (currX - prevX) * 0.5;
      const cp1y = prevY;
      const cp2x = currX - (currX - prevX) * 0.5;
      const cp2y = currY;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currX} ${currY}`;
    }

    return path;
  };

  const handleAdxAreaMouseMove = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - padding; // Adjust for padding
    const index = Math.round((mouseX / innerWidth) * (adxAreaData.length - 1));
    if (index >= 0 && index < adxAreaData.length) {
      const item = adxAreaData[index];
      let tooltipX = xScale(index) + padding; // Add padding back for display
      let dotX = xScale(index) + padding; // Dot position (same as original tooltip position)

      // Update current ADX value and price for the top-left tag
      setCurrentAdxValue(item.adx);
      setCurrentPrice(item.close);

      // Adjust tooltip position if it's near the end to prevent overflow
      const tooltipWidth = 70; // Width of the tooltip
      const chartRightEdge = areaChartWidth - padding;
      if (tooltipX + tooltipWidth > chartRightEdge) {
        tooltipX = tooltipX - tooltipWidth - 10; // Move tooltip to the left
      }

      setAdxTooltip({
        x: tooltipX,
        y: yScale(item.adx) + padding,
        value: item.adx,
        dotX: dotX, // Store original dot position
      });
    } else {
      setAdxTooltip(null);
    }
  };

  const handleAdxAreaMouseLeave = () => {
    setAdxTooltip(null);
    // Reset to the last ADX value and price when mouse leaves
    if (adxAreaData.length > 0) {
      setCurrentAdxValue(adxAreaData[adxAreaData.length - 1].adx);
      setCurrentPrice(adxAreaData[adxAreaData.length - 1].close);
    }
  };

  // Show loading or error state
  if (loading) {
    return (
      <div className="w-full h-full border border-[#3A3A3A] bg-[#000000] p-4">
        <div className="flex items-center justify-center h-full">
          <span className="text-[#01B792]" style={{ fontFamily: "Montserrat" }}>
            Loading chart data...
          </span>
        </div>
      </div>
    );
  }

  if (error || psarData.length === 0) {
    return (
      <div className="w-full h-full border border-[#3A3A3A] bg-[#000000] p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-[#3A3A3A] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            <span
              className="text-[#3A3A3A] text-sm"
              style={{ fontFamily: "Montserrat" }}
            >
              {error || "No chart data available"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#000000] p-4">
      {/* First Row: RSI7 and ADX Charts */}
      <div className="flex flex-row">
        {/* RSI7 Chart */}
        <div className="relative w-[50%] h-[50%] min-h-[50vh] bg-gradient-to-b from-[#57070a] via-[#232424] to-[#014d0f] rounded-tl-xl overflow-auto border border-[#3A3A3A]">
          <p
            className="absolute left-[1%] top-[1%] px-2 py-1 text-[#ffffff] text-sm bg-[#0E0E0E] border border-[#3A3A3A] rounded w-fit h-fit text-center z-10"
            style={{ fontFamily: "Montserrat", fontWeight: 700 }}
          >
            RSI7
          </p>

          {/* RSI 70 line */}
          <div className="absolute top-[30%] left-0 w-full border-t-2 border-[#A30003]">
            <span className="absolute font-bold text-sm">70</span>
          </div>

          {/* RSI 30 line */}
          <div className="absolute top-[70%] left-0 right-0 border-t-2 border-[#01BABA] w-[55%] min-w-full">
            <span className="absolute font-bold text-sm">30</span>
          </div>

          {/* Render token icons */}
          {rsi7Data.map((item, idx) => {
            const symbol = item.symbol.replace("USDT", "").toUpperCase();
            const total = rsi7Data.length;
            const left = (idx * 100) / total;
            const top = 100 - item.rsi;
            const offsetY = idx % 2 === 0 ? 0 : -18;

            return (
              <div
                key={item.symbol}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  transition: "top 0.2s, left 0.2s",
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredToken({
                    symbol: symbol,
                    rsi: item.rsi,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                    type: "rsi7",
                  });
                }}
                onMouseLeave={() => setHoveredToken(null)}
              >
                <Image
                  src={`/icon/${symbol}.svg`}
                  alt={symbol}
                  width={24}
                  height={24}
                  className="bg-gradient-to-r from-white via-gray-300 to-white rounded-full p-[2px] border border-white cursor-pointer"
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))",
                  }}
                />
              </div>
            );
          })}

          {/* RSI7 Hover Tooltip */}
          {hoveredToken && hoveredToken.type === "rsi7" && (
            <div
              className="fixed z-50 px-3 py-2 bg-[#1A1A1A] border border-[#6EFFF8] rounded-lg shadow-lg text-white text-sm"
              style={{
                left: hoveredToken.x - 60,
                top: hoveredToken.y - 50,
                transform: "translateX(-50%)",
                fontFamily: "Montserrat",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="bg-white p-1 rounded-full">
                  <Image
                    src={`/icon/${hoveredToken.symbol}.svg`}
                    alt={hoveredToken.symbol}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                </div>
                <span className="text-[#6EFFF8]">{hoveredToken.symbol}</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-[#ffffff]">RSI: </span>
                <span
                  className={`font-bold ${
                    hoveredToken.rsi > 70
                      ? "text-red-400"
                      : hoveredToken.rsi < 30
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {hoveredToken.rsi.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ADX Area Chart */}
        <div className="relative bg-black border rounded-tr-xl w-[50%] h-[50%] min-h-[50vh] border-[#3A3A3A]">
          <div
            className="absolute left-[1%] top-[1%] px-2 py-1 text-[#ffffff] text-sm bg-[#0E0E0E] border border-[#3A3A3A] rounded w-fit h-fit z-10 flex justify-between items-center gap-4"
            style={{ fontFamily: "Montserrat", fontWeight: 700 }}
          >
            <span>ADX: {currentAdxValue.toFixed(2)}</span>
            <span>
              Price: $
              {Number(currentPrice.toFixed(2)) > 0
                ? currentPrice.toFixed(2)
                : currentPrice.toString()}
            </span>
          </div>
          <div className="absolute inset-0 pt-8">
            <svg
              width="100%"
              height="100%"
              className="bg-black z-0"
              onMouseMove={handleAdxAreaMouseMove}
              onMouseLeave={handleAdxAreaMouseLeave}
            >
              <defs>
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#1e40af" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#1e40af" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1e40af" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              <g transform={`translate(${padding}, ${padding})`}>
                {/* Y-axis labels */}
                <text
                  x={10}
                  y={yScale(topThreshold) + 4}
                  fill="white"
                  fontSize="12"
                  textAnchor="start"
                >
                  {topThreshold}
                </text>
                <text
                  x={10}
                  y={yScale(middleThreshold) + 4}
                  fill="white"
                  fontSize="12"
                  textAnchor="start"
                >
                  {middleThreshold}
                </text>
                <text
                  x={10}
                  y={yScale(bottomThreshold) + 4}
                  fill="white"
                  fontSize="12"
                  textAnchor="start"
                >
                  {bottomThreshold}
                </text>

                {/* X-axis time labels */}
                {getTimeThresholds().map((threshold, idx) => (
                  <text
                    key={`time-${idx}`}
                    x={threshold.x}
                    y={innerHeight + 20}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {formatDateTime(threshold.timestamp)}
                  </text>
                ))}

                {/* Area fill */}
                <path
                  d={createSmoothPath(adxAreaData)}
                  fill="url(#areaGradient)"
                />

                {/* Line */}
                <path
                  d={createSmoothLine(adxAreaData)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* Current value point */}
                <circle
                  cx={xScale(adxAreaData.length - 1)}
                  cy={yScale(adxAreaData[adxAreaData.length - 1]?.adx)}
                  r="6"
                  fill="#3b82f6"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* Current value label */}
                <text
                  x={xScale(adxAreaData.length - 1)}
                  y={yScale(adxAreaData[adxAreaData.length - 1]?.adx) - 30}
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {adxAreaData[adxAreaData.length - 1]?.adx}
                </text>

                {/* Predicted trend arrows and dots */}
                {adxAreaData.map((item, index) => {
                  if (item.predicted_trend === "UP") {
                    return (
                      <g key={`trend-up-${index}`}>
                        {/* Dot on the line */}
                        <circle
                          cx={xScale(index)}
                          cy={yScale(item.adx)}
                          r="4"
                          fill="#22c55e"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {/* Arrow */}
                        <image
                          href="/img/green-arrow-up.png"
                          x={xScale(index) - 8}
                          y={yScale(item.adx) + 10}
                          width="16"
                          height="16"
                        />
                      </g>
                    );
                  } else if (item.predicted_trend === "DOWN") {
                    return (
                      <g key={`trend-down-${index}`}>
                        {/* Dot on the line */}
                        <circle
                          cx={xScale(index)}
                          cy={yScale(item.adx)}
                          r="4"
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {/* Arrow */}
                        <image
                          href="/img/red-arrow-down.png"
                          x={xScale(index) - 8}
                          y={yScale(item.adx) - 26}
                          width="16"
                          height="16"
                        />
                      </g>
                    );
                  }
                  return null;
                })}

                {/* Tooltip ADX */}
                {adxTooltip && (
                  <g className="items-center justify-center">
                    {/* Dot at hover point */}
                    <circle
                      cx={adxTooltip.dotX - padding}
                      cy={adxTooltip.y - padding}
                      r="4"
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* Tooltip box */}
                    <rect
                      x={adxTooltip.x - 40}
                      y={adxTooltip.y - 80}
                      width={120}
                      height={50}
                      fill="#222"
                      stroke="#ffffff"
                      rx={6}
                    />
                    <text
                      x={adxTooltip.x + 20}
                      y={adxTooltip.y - 62}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      ADX: {adxTooltip.value.toFixed(2)}
                    </text>
                    <text
                      x={adxTooltip.x + 20}
                      y={adxTooltip.y - 45}
                      fill="#ffffff"
                      fontSize="10"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {formatDateTime(
                        adxAreaData[
                          Math.round(
                            ((adxTooltip.dotX - padding) / innerWidth) *
                              (adxAreaData.length - 1)
                          )
                        ]?.time
                      )}
                    </text>
                  </g>
                )}
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Second Row: PSAR Candlestick and RSI14 Charts */}
      <div className="flex flex-row">
        {/* PSAR Candlestick Chart */}
        <div className="bg-black rounded-bl-xl border border-[#3A3A3A] relative w-[50%] h-[50%] min-h-[50vh]">
          <div
            className="absolute left-[1%] top-[1%] px-2 py-1 text-[#ffffff] text-sm bg-[#0E0E0E] border border-[#3A3A3A] rounded w-fit h-fit z-10 flex justify-between items-center gap-4"
            style={{ fontFamily: "Montserrat", fontWeight: 700 }}
          >
            <span>
              PSAR:{" "}
              {Number(currentPsarValue.toFixed(2)) > 0
                ? currentPsarValue.toFixed(2)
                : currentPsarValue.toString()}
            </span>
            <span>
              Price: $
              {Number(currentPsarPrice.toFixed(2)) > 0
                ? currentPsarPrice.toFixed(2)
                : currentPsarPrice.toString()}
            </span>
          </div>
          <div className="overflow-x-auto h-full">
            <svg
              width={candleChartWidth}
              height={candleChartHeight + chartBottomMargin}
              className="rounded w-fit h-full overflow-auto"
            >
              {/* Candlesticks */}
              {psarData.length > 0 ? (
                psarData.map((candle, index) => (
                  <Candlestick
                    key={index}
                    candle={candle}
                    index={index}
                    onHover={(c, pos) => {
                      setSelectedCandle(c);
                      setPopupPos(pos);
                      setCurrentPsarValue(c.psar);
                      setCurrentPsarPrice(c.close);
                    }}
                    onLeave={() => {
                      setSelectedCandle(null);
                      setPopupPos(null);
                      // Reset to the last values when mouse leaves
                      if (psarData.length > 0) {
                        setCurrentPsarValue(psarData[psarData.length - 1].psar);
                        setCurrentPsarPrice(
                          psarData[psarData.length - 1].close
                        );
                      }
                    }}
                  />
                ))
              ) : (
                <text
                  x={candleChartWidth / 2}
                  y={candleChartHeight / 2}
                  fill="#fff"
                  fontSize="18"
                  textAnchor="middle"
                >
                  No candlestick data
                </text>
              )}

              {/* Price axis on the left */}
              {[...Array(5)].map((_, i) => {
                const price = maxPrice - ((maxPrice - minPrice) / 4) * i;
                const y = priceToY(price);
                return (
                  <g key={i}>
                    {/* Y-axis line */}
                    <line
                      x1={chartLeftMargin - 10}
                      y1={y}
                      x2={chartLeftMargin - 5}
                      y2={y}
                      stroke="#8ab4f8"
                      strokeWidth="2"
                    />
                    {/* Price text */}
                    <text
                      x={10}
                      y={y + 5}
                      fill="#8ab4f8"
                      fontSize="14"
                      textAnchor="start"
                      fontWeight="bold"
                    >
                      {price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </text>
                  </g>
                );
              })}

              {/* Main Y-axis line */}
              <line
                x1={chartLeftMargin - 5}
                y1={chartTopMargin}
                x2={chartLeftMargin - 5}
                y2={chartTopMargin + candleChartHeight}
                stroke="#8ab4f8"
                strokeWidth="2"
              />

              {/* Time axis at bottom */}
              {getPsarTimeThresholds().map((threshold, idx) => (
                <g key={`time-${idx}`}>
                  {/* X-axis tick mark */}
                  <line
                    x1={threshold.x}
                    y1={chartTopMargin + candleChartHeight}
                    x2={threshold.x}
                    y2={chartTopMargin + candleChartHeight + 5}
                    stroke="#8ab4f8"
                    strokeWidth="2"
                  />
                  {/* Time text */}
                  <text
                    x={threshold.x}
                    y={chartTopMargin + candleChartHeight + 25}
                    fill="#8ab4f8"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {formatDateTime(threshold.timestamp)}
                  </text>
                </g>
              ))}

              {/* Main X-axis line */}
              <line
                x1={chartLeftMargin - 5}
                y1={chartTopMargin + candleChartHeight}
                x2={candleChartWidth - 20}
                y2={chartTopMargin + candleChartHeight}
                stroke="#8ab4f8"
                strokeWidth="2"
              />

              {/* Candlestick popup */}
              {popupPos && selectedCandle && (
                <foreignObject
                  x={Math.max(0, popupPos.x - 130)}
                  y={Math.max(10, popupPos.y - 160)}
                  width="180"
                  height="180"
                  style={{ pointerEvents: "none", zIndex: 50 }}
                >
                  <div
                    className={`p-2 rounded border shadow-lg text-xs w-fit h-fit mt-[20px] ${
                      selectedCandle.close > selectedCandle.open
                        ? "bg-[#ffffff] text-green-400 border-green-500"
                        : "bg-[#ffffff] text-red-400 border-red-500"
                    }`}
                    style={{ fontFamily: "monospace" }}
                  >
                    <b>• Price</b>
                    <br />
                    Open: {selectedCandle.open}
                    <br />
                    High: {selectedCandle.high}
                    <br />
                    Low: {selectedCandle.low}
                    <br />
                    Close: {selectedCandle.close}
                    <br />
                    PSAR: {selectedCandle.psar.toFixed(4)}
                  </div>
                </foreignObject>
              )}
            </svg>
          </div>
        </div>

        {/* RSI14 Chart */}
        <div className="relative w-[50%] h-[50%] min-h-[50vh] bg-gradient-to-b from-[#57070a] via-[#232424] to-[#014d0f] rounded-br-xl overflow-hidden border border-[#3A3A3A]">
          <p
            className="absolute left-[1%] top-[1%] px-2 py-1 text-[#ffffff] text-sm bg-[#0E0E0E] border border-[#3A3A3A] rounded-br-xl w-fit h-fit text-center z-10"
            style={{ fontFamily: "Montserrat", fontWeight: 700 }}
          >
            RSI14
          </p>

          {/* RSI 70 line */}
          <div className="absolute top-[30%] left-0 w-full border-t-2 border-[#A30003]">
            <span className="absolute font-bold text-sm">70</span>
          </div>

          {/* RSI 30 line */}
          <div className="absolute top-[70%] left-0 right-0 border-t-2 border-[#01BABA] w-[55%] min-w-full">
            <span className="absolute font-bold text-sm">30</span>
          </div>

          {/* Render token icons from RSI14 API */}
          {rsi14Data.map((item, idx) => {
            const symbol = item.symbol.replace("USDT", "").toUpperCase();
            const total = rsi14Data.length;
            const left = (idx * 100) / total;
            const top = 100 - item.rsi;
            const offsetY = idx % 2 === 0 ? 0 : -18;
            return (
              <div
                key={item.symbol}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  transition: "top 0.2s, left 0.2s",
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredToken({
                    symbol: symbol,
                    rsi: item.rsi,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                    type: "rsi14",
                  });
                }}
                onMouseLeave={() => setHoveredToken(null)}
              >
                <Image
                  src={`/icon/${symbol}.svg`}
                  alt={symbol}
                  width={24}
                  height={24}
                  className="bg-gradient-to-r from-white via-gray-300 to-white rounded-full p-[2px] border border-white cursor-pointer"
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))",
                  }}
                />
              </div>
            );
          })}

          {/* RSI14 Hover Tooltip */}
          {hoveredToken && hoveredToken.type === "rsi14" && (
            <div
              className="fixed z-50 px-3 py-2 bg-[#1A1A1A] border border-[#6EFFF8] rounded-lg shadow-lg text-white text-sm"
              style={{
                left: hoveredToken.x - 60,
                top: hoveredToken.y - 50,
                transform: "translateX(-50%)",
                fontFamily: "Montserrat",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="bg-white p-1 rounded-full">
                  <Image
                    src={`/icon/${hoveredToken.symbol}.svg`}
                    alt={hoveredToken.symbol}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                </div>
                <span className="text-[#6EFFF8]">{hoveredToken.symbol}</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-[#ffffff]">RSI: </span>
                <span
                  className={`font-bold ${
                    hoveredToken.rsi > 70
                      ? "text-red-400"
                      : hoveredToken.rsi < 30
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {hoveredToken.rsi.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainComponentCenter;
