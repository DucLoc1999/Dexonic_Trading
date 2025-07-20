"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "../../styles/swap.css";
import {
  ArrowUpDown,
  TrendingUp,
  Zap,
  RefreshCw,
  ChevronDown,
  ArrowLeft,
  LogOut,
  User,
  Users,
  ChevronUp,
} from "lucide-react";
import { useMultiWallet } from "@/components/wallet/multi-wallet-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChatButton } from "@/components/chat/chat-button";
import { MobileMenuBar } from "@/components/swap/mobile-menu-bar";
import { MultiWalletSelector } from "@/components/wallet/multi-wallet-selector";
import { AdminInitializer } from "@/components/swap/admin-initializer";
import { WalletDebug } from "@/components/wallet/wallet-debug";
import { Progress } from "@/components/ui/progress";
import { Dispatch, SetStateAction } from "react";
import SDK from "@pontem/liquidswap-sdk";
import { AptosClient } from "aptos";
import {
  SDK as AnimeSwapSDK,
  NetworkType as AnimeSwapNetworkType,
} from "@animeswap.org/v1-sdk";
import {
  Router,
  Trade,
  Coin,
  Currency,
  TradeType,
  Percent,
  Route,
  Pair,
} from "@pancakeswap/aptos-swap-sdk";
import { CurrencyAmount } from "@pancakeswap/swap-sdk-core";
import { toast } from "@/hooks/use-toast";

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl: string;
}

interface Quote {
  dex: string;
  outputAmount: string;
  priceImpact: string;
  fee: string;
  route: string[];
  isBest?: boolean; // Thêm thuộc tính này để fix linter error
  pool_address?: string; // Thêm thuộc tính này để lưu pool_address
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  image: string;
}

const tokens: Token[] = [
  {
    symbol: "APT",
    name: "Aptos",
    address: "0x1::aptos_coin::AptosCoin",
    decimals: 8,
    logoUrl: "/aptos-logo.svg",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address:
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    decimals: 6,
    logoUrl: "/usdc-logo.svg",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address:
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
    decimals: 6,
    logoUrl: "/usdt-logo.svg",
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address:
      "0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::multiswap_aggregator_v2::WBTC",
    decimals: 8,
    logoUrl: "/wbtc-logo.svg",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    address:
      "0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T",
    decimals: 8,
    logoUrl: "/weth-logo-diamond.svg",
  },
];

// Aggregator configuration
const AGGREGATOR_ADDRESS =
  "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127";
const SENDER_ADDRESS =
  "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8";
const RECEIVER_ADDRESS =
  "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8";

// Custom hook lấy số dư cho ví đang kết nối (Petra hoặc Pontem)
function useWalletBalances(
  tokens: Token[],
  address: string | null,
  connected: boolean
) {
  const [balances, setBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!connected || !address) {
      setBalances({});
      return;
    }
    const fetchBalances = async () => {
      try {
        console.log(`Fetching balances for address: ${address}`);
        // Use the same logic to avoid double /v1/
        const nodeUrl =
          process.env.NEXT_PUBLIC_APTOS_NODE_URL ||
          "https://fullnode.mainnet.aptoslabs.com";
        const baseUrl = nodeUrl.endsWith("/v1")
          ? nodeUrl.slice(0, -3)
          : nodeUrl;
        const res = await fetch(`${baseUrl}/v1/accounts/${address}/resources`);
        if (!res.ok) {
          console.log(`Failed to fetch resources: ${res.status}`);
          return;
        }

        const resources = await res.json();
        console.log("All resources:", resources);

        const newBalances: Record<string, string> = {};

        // Tìm tất cả CoinStore resources
        const coinStores = resources.filter((r: any) =>
          r.type.includes("0x1::coin::CoinStore")
        );
        console.log("All CoinStore resources:", coinStores);

        for (const token of tokens) {
          // Tìm CoinStore cho token chính xác
          const coinStore = resources.find((r: any) => {
            const isMatch = r.type === `0x1::coin::CoinStore<${token.address}>`;
            if (isMatch) {
              console.log(`Found exact CoinStore for ${token.symbol}:`, r.data);
            }
            return isMatch;
          });

          if (
            coinStore &&
            coinStore.data &&
            coinStore.data.coin &&
            coinStore.data.coin.value
          ) {
            const balance = (
              Number(coinStore.data.coin.value) / Math.pow(10, token.decimals)
            ).toFixed(6);
            console.log(`Balance for ${token.symbol}: ${balance}`);
            newBalances[token.symbol] = balance;
          } else {
            console.log(
              `No CoinStore found for ${token.symbol} (${token.address})`
            );
            newBalances[token.symbol] = "0.000000";
          }
        }

        console.log("Final balances:", newBalances);
        setBalances(newBalances);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setBalances({});
      }
    };
    fetchBalances();
  }, [connected, address, tokens]);

  return balances;
}

function useMarketOverview() {
  const [marketData, setMarketData] = useState([
    { pair: "APT/USDC", price: "-", change: "-", positive: true },
    { pair: "USDT/USDC", price: "-", change: "-", positive: true },
    { pair: "WETH/APT", price: "-", change: "-", positive: true },
    { pair: "WETH/USDC", price: "-", change: "-", positive: true },
    { pair: "WBTC/APT", price: "-", change: "-", positive: true },
    { pair: "WBTC/USDC", price: "-", change: "-", positive: true },
  ]);

  useEffect(() => {
    async function fetchMarket() {
      try {
        // Fetch real APT/USDC price from Liquidswap pool
        let aptUsdcPrice = null;
        try {
          const poolRes = await fetch(
            "https://fullnode.mainnet.aptoslabs.com/v1/accounts/0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa/resources"
          );
          if (poolRes.ok) {
            const poolData = await poolRes.json();
            const aptUsdcPool = poolData.find(
              (r: any) =>
                r.type.includes("TokenPairReserve") &&
                r.type.includes("aptos_coin::AptosCoin") &&
                r.type.includes("asset::USDC")
            );

            if (
              aptUsdcPool &&
              aptUsdcPool.data.reserve_x &&
              aptUsdcPool.data.reserve_y
            ) {
              const aptReserve =
                parseInt(aptUsdcPool.data.reserve_x) / 100000000; // APT has 8 decimals
              const usdcReserve =
                parseInt(aptUsdcPool.data.reserve_y) / 1000000; // USDC has 6 decimals
              aptUsdcPrice = usdcReserve / aptReserve;
              console.log("Real APT/USDC price from pool:", aptUsdcPrice);
            }
          }
        } catch (error) {
          console.log("Failed to fetch pool price, using CoinGecko fallback");
        }

        // Fallback to CoinGecko
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=aptos,usd-coin,tether,ethereum,wrapped-bitcoin&vs_currencies=usd&include_24hr_change=true"
        );
        const data = await res.json();

        // APT/USDC - use real pool price if available, otherwise CoinGecko
        const aptPrice = aptUsdcPrice || data.aptos.usd;
        const aptChange = data.aptos.usd_24h_change;
        // USDT/USDC
        const usdtPrice = data.tether.usd;
        const usdtChange = data.tether.usd_24h_change;
        // WETH/USDC
        const ethPrice = data.ethereum.usd;
        const ethChange = data.ethereum.usd_24h_change;
        // WETH/APT
        const wethApt = ethPrice / aptPrice;
        const wethAptChange = ethChange - aptChange; // xấp xỉ
        // WBTC/USDC
        const wbtcPrice = data["wrapped-bitcoin"].usd;
        const wbtcChange = data["wrapped-bitcoin"].usd_24h_change;
        // WBTC/APT
        const wbtcApt = wbtcPrice / aptPrice;
        const wbtcAptChange = wbtcChange - aptChange; // xấp xỉ

        setMarketData([
          {
            pair: "APT/USDC",
            price: aptUsdcPrice
              ? `$${aptUsdcPrice.toFixed(3)}`
              : `$${aptPrice.toFixed(3)}`,
            change: `${aptChange >= 0 ? "+" : ""}${aptChange.toFixed(2)}%`,
            positive: aptChange >= 0,
          },
          {
            pair: "USDT/USDC",
            price: `$${usdtPrice.toFixed(3)}`,
            change: `${usdtChange >= 0 ? "+" : ""}${usdtChange.toFixed(2)}%`,
            positive: usdtChange >= 0,
          },
          {
            pair: "WETH/APT",
            price: `${wethApt.toFixed(3)}`,
            change: `${wethAptChange >= 0 ? "+" : ""}${wethAptChange.toFixed(
              2
            )}%`,
            positive: wethAptChange >= 0,
          },
          {
            pair: "WETH/USDC",
            price: `$${ethPrice.toFixed(3)}`,
            change: `${ethChange >= 0 ? "+" : ""}${ethChange.toFixed(2)}%`,
            positive: ethChange >= 0,
          },
          {
            pair: "WBTC/APT",
            price: `${wbtcApt.toFixed(3)}`,
            change: `${wbtcAptChange >= 0 ? "+" : ""}${wbtcAptChange.toFixed(
              2
            )}%`,
            positive: wbtcAptChange >= 0,
          },
          {
            pair: "WBTC/USDC",
            price: `$${wbtcPrice.toFixed(3)}`,
            change: `${wbtcChange >= 0 ? "+" : ""}${wbtcChange.toFixed(2)}%`,
            positive: wbtcChange >= 0,
          },
        ]);
      } catch (e) {
        // fallback giữ nguyên data cũ
      }
    }
    fetchMarket();
    const interval = setInterval(fetchMarket, 60_000); // refresh mỗi phút
    return () => clearInterval(interval);
  }, []);
  return marketData;
}

// Mapping dex_id sang tên DEX
function getDexName(quote: any) {
  const dex = (quote.dex || "").toLowerCase().trim();
  // Trả đúng tên sàn theo quote.dex
  if (dex === "pancakeswap") return "PancakeSwap";
  if (dex === "liquidswap") return "Liquidswap";
  if (dex === "animeswap") return "AnimeSwap";
  if (dex === "panora") return "Panora";
  if (dex === "aries") return "Aries";
  if (dex === "econia") return "Econia";
  if (dex === "sushiswap") return "SushiSwap";
  if (dex === "thala") return "Thala";
  if (dex === "aux") return "Aux";
  // Nếu là Aggregator contract
  if (dex.includes("aggregator")) return "Aggregator";
  // Nếu có dex_id nhưng không phải các DEX trên, trả về Aggregator
  if (quote.dex_id) return "Aggregator";
  // Fallback
  return quote.dex || "Unknown DEX";
}

// Thêm hàm format tiền tệ USD
function formatUSD(value: number | string) {
  if (isNaN(Number(value))) return value;
  return (
    "$" +
    Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Khởi tạo client và SDK Liquidswap
const aptosClient = new AptosClient("https://fullnode.mainnet.aptoslabs.com");
const sdk = new SDK(aptosClient);

const animeSwapSdk = new AnimeSwapSDK(
  "https://fullnode.mainnet.aptoslabs.com",
  AnimeSwapNetworkType.Mainnet
);

export default function SwapPage() {
  const {
    address,
    connected,
    network,
    signAndSubmitTransaction,
    availableWallets,
    connectionStatus,
    activeWallet,
  } = useMultiWallet();
  const [fromToken, setFromToken] = useState<Token>(tokens[0]);
  const [toToken, setToToken] = useState<Token>(tokens[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [activeSwapTab, setActiveSwapTab] = useState("swap");
  const [swapMode, setSwapMode] = useState<"same-address" | "cross-address">(
    "same-address"
  );
  const [receiverAddress, setReceiverAddress] = useState(RECEIVER_ADDRESS);

  // NEW: State for balances
  const [fromBalance, setFromBalance] = useState<string>("");
  const [toBalance, setToBalance] = useState<string>("");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // 1. Thêm state lưu balances cho tất cả token
  const [allTokenBalances, setAllTokenBalances] = useState<
    Record<string, string>
  >({});

  // Thay thế allTokenBalances bằng balances từ hook mới
  const balances = useWalletBalances(tokens, address, connected);

  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showFromDropdown &&
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFromDropdown(false);
      }
      if (
        showToDropdown &&
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target as Node)
      ) {
        setShowToDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFromDropdown, showToDropdown]);

  // Debug logging for wallet connection
  useEffect(() => {
    console.log("Wallet connection status:", {
      connected,
      address,
      network,
      connectionStatus,
      activeWallet,
      availableWallets: availableWallets.length,
    });
  }, [
    connected,
    address,
    network,
    connectionStatus,
    activeWallet,
    availableWallets,
  ]);

  // Check for existing user session
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Fetch quotes from the aggregator
  const fetchQuotes = async () => {
    if (!connected || !fromAmount) {
      // Thêm điều kiện chỉ fetch khi đã kết nối ví và nhập số lượng
      setQuotes([]);
      return;
    }
    // Chuẩn hóa dấu phẩy thành dấu chấm
    const cleanAmount = fromAmount.replace(",", ".");
    const parsedAmount = Number.parseFloat(cleanAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setQuotes([]);
      return;
    }

    setIsLoadingQuotes(true);

    try {
      // Convert amount to octas (smallest unit)
      const amountInOctas = Math.floor(
        parsedAmount * Math.pow(10, fromToken.decimals)
      );
      if (isNaN(amountInOctas) || amountInOctas <= 0) {
        setQuotes([]);
        setIsLoadingQuotes(false);
        return;
      }
      // Call the aggregator's simulate_swap function
      console.log("🔄 Calling API with payload:", {
        inputToken: fromToken.address,
        outputToken: toToken.address,
        inputAmount: amountInOctas.toString(),
      });

      const response = await fetch(`/api/simulate-swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          inputToken: fromToken.address,
          outputToken: toToken.address,
          inputAmount: amountInOctas.toString(),
        }),
      });

      console.log(
        "📡 API Response status:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.quotes && Array.isArray(data.quotes)) {
          console.log(
            "🔍 DEBUG: Setting quotes from API:",
            data.quotes.map((q: Quote) => ({
              dex: q.dex,
              outputAmount: q.outputAmount,
            }))
          );

          // Sử dụng bestQuote từ API thay vì tự tính toán
          if (data.bestQuote) {
            console.log(
              "🏆 Best quote from API:",
              data.bestQuote.dex,
              "with output:",
              data.bestQuote.outputAmount
            );
          }

          // Force sort quotes theo outputAmount để đảm bảo thứ tự đúng
          const sortedQuotes = data.quotes.sort(
            (a: Quote, b: Quote) =>
              Number.parseFloat(b.outputAmount) -
              Number.parseFloat(a.outputAmount)
          );
          // Luôn chọn bestQuote là quote có outputAmount lớn nhất sau khi sort
          const bestQuote = sortedQuotes[0];
          setQuotes(sortedQuotes);
        } else {
          setQuotes([]);
        }
      } else {
        setQuotes([]);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      setQuotes([]);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  useEffect(() => {
    if (connected && fromAmount) {
      // Thêm điều kiện chỉ fetch khi đã kết nối ví và nhập số lượng
      const debounce = setTimeout(fetchQuotes, 800);
      return () => clearTimeout(debounce);
    } else {
      setQuotes([]);
    }
  }, [connected, fromAmount, fromToken, toToken]);

  // NEW: Fetch balance for a given token and address
  async function fetchTokenBalance(
    address: string,
    tokenAddress: string,
    decimals: number
  ): Promise<string> {
    try {
      if (!address) {
        console.log("No address provided for balance fetch");
        return "0.00";
      }

      console.log(
        `Fetching balance for token: ${tokenAddress} at address: ${address}`
      );

      // Use Aptos public node
      const nodeUrl =
        process.env.NEXT_PUBLIC_APTOS_NODE_URL ||
        "https://fullnode.mainnet.aptoslabs.com";

      // Ensure nodeUrl doesn't end with /v1 to avoid double /v1/v1/
      const baseUrl = nodeUrl.endsWith("/v1") ? nodeUrl.slice(0, -3) : nodeUrl;

      // Get all resources for the account
      const res = await fetch(`${baseUrl}/v1/accounts/${address}/resources`);
      if (!res.ok) {
        console.log(`Failed to fetch resources for ${address}: ${res.status}`);
        return "0.00";
      }

      const resources = await res.json();
      // Thêm log toàn bộ resource để debug
      console.log("All resources for address", address, resources);

      // Find CoinStore for the token
      const coinStore = resources.find((r: any) => {
        const isMatch = r.type === `0x1::coin::CoinStore<${tokenAddress}>`;
        if (isMatch) {
          console.log(`Found exact CoinStore for ${tokenAddress}:`, r.data);
        }
        return isMatch;
      });

      if (
        coinStore &&
        coinStore.data &&
        coinStore.data.coin &&
        coinStore.data.coin.value
      ) {
        const balance = (
          Number(coinStore.data.coin.value) / Math.pow(10, decimals)
        ).toFixed(6);
        console.log(`Balance for ${tokenAddress}: ${balance}`);
        return balance;
      }

      console.log(`No CoinStore found for ${tokenAddress}`);
      return "0.000000";
    } catch (e) {
      console.error(`Error fetching balance for ${tokenAddress}:`, e);
      return "0.00";
    }
  }

  // 2. Fetch balance cho tất cả token khi ví kết nối hoặc address thay đổi
  useEffect(() => {
    let cancelled = false;
    async function fetchAllBalances() {
      if (connected && address) {
        const balances: Record<string, string> = {};
        for (const token of tokens) {
          balances[token.symbol] = await fetchTokenBalance(
            address,
            token.address,
            token.decimals
          );
        }
        if (!cancelled) setAllTokenBalances(balances);
      } else {
        setAllTokenBalances({});
      }
    }
    fetchAllBalances();
    return () => {
      cancelled = true;
    };
  }, [connected, address]);

  // Function to update balances
  async function updateBalances() {
    console.log(
      `Balance update triggered - Connected: ${connected}, Address: ${address}`
    );

    if (connected && address) {
      setIsLoadingBalance(true);
      console.log(
        `Fetching balances for tokens: ${fromToken.symbol} and ${toToken.symbol}`
      );

      try {
        const [from, to] = await Promise.all([
          fetchTokenBalance(address, fromToken.address, fromToken.decimals),
          fetchTokenBalance(address, toToken.address, toToken.decimals),
        ]);

        console.log(`Setting balances - From: ${from}, To: ${to}`);
        setFromBalance(from);
        setToBalance(to);
        setIsLoadingBalance(false);
      } catch (error) {
        console.error("Error updating balances:", error);
        setFromBalance("0.00");
        setToBalance("0.00");
        setIsLoadingBalance(false);
      }
    } else {
      console.log("Wallet not connected, clearing balances");
      setFromBalance("");
      setToBalance("");
      setIsLoadingBalance(false);
    }
  }

  // NEW: Effect to fetch balances when wallet or token changes
  useEffect(() => {
    let cancelled = false;

    const updateBalancesWithCancel = async () => {
      if (!cancelled) {
        await updateBalances();
      }
    };

    updateBalancesWithCancel();
    return () => {
      cancelled = true;
    };
  }, [connected, address, fromToken, toToken]);

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  // Thêm hàm thực hiện swap trên DEX cụ thể
  const executeSwapOnDex = async (quote: Quote) => {
    if (!connected || !address) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!quote || Number.parseFloat(quote.outputAmount) <= 0) {
      alert("Invalid quote for this DEX. Please try again.");
      return;
    }
    const fromBalanceNum = Number(fromBalance);
    const fromAmountNum = Number(fromAmount);
    if (
      !isNaN(fromBalanceNum) &&
      !isNaN(fromAmountNum) &&
      fromBalanceNum < fromAmountNum
    ) {
      alert("Insufficient balance for swap!");
      return;
    }
    const aptBalance = balances["APT"] || "0";
    const aptBalanceNum = Number(aptBalance);
    if (aptBalanceNum < 0.01) {
      alert("Số dư APT không đủ để trả gas fee! Cần ít nhất 0.01 APT.");
      return;
    }
    setIsSwapping(true);
    try {
      // Nếu là Liquidswap thì dùng SDK mới cho mọi cặp token
      if (quote.dex === "Liquidswap") {
        const amountIn = Math.floor(
          Number(fromAmount) * Math.pow(10, fromToken.decimals)
        );
        // minAmountOut lấy đúng từ quote.outputAmount * 10^toToken.decimals * (1 - slippage / 100)
        const minAmountOut = Math.floor(
          Number(quote.outputAmount) * (1 - slippage / 100)
        );
        // Chọn version và curveType phù hợp (ưu tiên 0.5 nếu pool hỗ trợ, fallback 0)
        // Nếu quote có pool_address, có thể lấy version/curveType từ quote nếu backend trả về
        const txPayload = sdk.Swap.createSwapTransactionPayload({
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: amountIn,
          toAmount: minAmountOut,
          slippage: slippage / 100, // ví dụ 0.005 cho 0.5%
          version: 0.5, // hoặc 0 nếu pool chưa hỗ trợ v0.5
          curveType: "uncorrelated", // hoặc lấy từ quote nếu có
          interactiveToken: "from",
          stableSwapType: "normal",
        });
        console.log("[LIQUIDSWAP SWAP] txPayload:", txPayload);
        if (signAndSubmitTransaction) {
          try {
            const result = await signAndSubmitTransaction(txPayload);
            if (result && result.hash) {
              alert(
                `Swap completed successfully on Liquidswap!\nTransaction hash: ${result.hash}`
              );
            } else if (result && result.success) {
              alert("Swap transaction submitted successfully on Liquidswap!");
            } else {
              alert("Swap completed successfully on Liquidswap!");
            }
            setFromAmount("");
            setQuotes([]);
            updateBalances();
          } catch (txError) {
            let txErrorMsg = "";
            if (
              typeof txError === "object" &&
              txError !== null &&
              "message" in txError &&
              typeof (txError as any).message === "string"
            ) {
              txErrorMsg = (txError as any).message;
            }
            alert(
              "Swap failed: " +
                (txErrorMsg || JSON.stringify(txError) || "Unknown error")
            );
          }
        } else {
          alert("Không tìm thấy ví Aptos để gửi transaction!");
        }
        setIsSwapping(false);
        return;
      }
      // Nếu là AnimeSwap và cặp APT/USDC thì dùng AnimeSwap SDK
      if (
        quote.dex === "AnimeSwap" &&
        fromToken.symbol === "APT" &&
        toToken.symbol === "USDC"
      ) {
        const amountIn = Math.floor(
          Number(fromAmount) * Math.pow(10, fromToken.decimals)
        );
        try {
          // 1. Lấy route tốt nhất
          const trades = await animeSwapSdk.route.getRouteSwapExactCoinForCoin({
            fromCoin: fromToken.address,
            toCoin: toToken.address,
            amount: amountIn,
          });
          if (!trades || trades.length === 0) {
            alert("No route found for this swap on AnimeSwap!");
            setIsSwapping(false);
            return;
          }
          const bestTrade = trades[0];
          // 2. Tạo transaction payload
          const txPayload = animeSwapSdk.route.swapExactCoinForCoinPayload({
            trade: bestTrade,
            slippage: slippage / 100,
          });
          // 3. Gửi transaction qua ví
          if (signAndSubmitTransaction) {
            const result = await signAndSubmitTransaction(txPayload);
            if (result && result.hash) {
              alert(
                `Swap completed successfully on AnimeSwap!\nTransaction hash: ${result.hash}`
              );
            } else if (result && result.success) {
              alert("Swap transaction submitted successfully on AnimeSwap!");
            } else {
              alert("Swap completed successfully on AnimeSwap!");
            }
            setFromAmount("");
            setQuotes([]);
            updateBalances();
          } else {
            alert("Không tìm thấy ví Aptos để gửi transaction!");
          }
        } catch (txError) {
          let txErrorMsg = "";
          if (
            typeof txError === "object" &&
            txError !== null &&
            "message" in txError &&
            typeof (txError as any).message === "string"
          ) {
            txErrorMsg = (txError as any).message;
          }
          alert(
            "Swap failed: " +
              (txErrorMsg || JSON.stringify(txError) || "Unknown error")
          );
        }
        setIsSwapping(false);
        return;
      }
      // Nếu là SushiSwap, tạo payload entry_function_payload gọi contract SushiSwap trên Aptos
      if (quote.dex === "SushiSwap") {
        if (!quote.pool_address) {
          alert("Không tìm thấy pool_address cho SushiSwap. Không thể swap.");
          setIsSwapping(false);
          return;
        }
        const amountIn = Math.floor(
          Number(fromAmount) * Math.pow(10, fromToken.decimals)
        );
        const minAmountOut = Math.floor(
          Number(quote.outputAmount) * (1 - slippage / 100)
        );
        const typeArgs = [fromToken.address, toToken.address];
        transactionPayload = {
          type: "entry_function_payload",
          function:
            "0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c::swap::swap_exact_in",
          type_arguments: typeArgs,
          arguments: [
            quote.pool_address,
            amountIn.toString(),
            minAmountOut.toString(),
          ],
        };
      }
      // Nếu là Aux, tạo payload entry_function_payload gọi contract Aux trên Aptos
      if (quote.dex === "Aux") {
        const amountIn = Math.floor(
          Number(fromAmount) * Math.pow(10, fromToken.decimals)
        );
        const minAmountOut = Math.floor(
          Number(quote.outputAmount) * (1 - slippage / 100)
        );
        const typeArgs = [fromToken.address, toToken.address];
        const transactionPayload = {
          type: "entry_function_payload",
          function:
            "0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541::amm::swap_exact_coin_for_coin_with_signer",
          type_arguments: typeArgs,
          arguments: [amountIn.toString(), minAmountOut.toString()],
        };
        if (signAndSubmitTransaction) {
          try {
            const result = await signAndSubmitTransaction(transactionPayload);
            if (result && result.hash) {
              alert(
                `Swap completed successfully on Aux!\nTransaction hash: ${result.hash}`
              );
            } else if (result && result.success) {
              alert("Swap transaction submitted successfully on Aux!");
            } else {
              alert("Swap completed successfully on Aux!");
            }
            setFromAmount("");
            setQuotes([]);
            updateBalances();
          } catch (txError) {
            let txErrorMsg = "";
            if (
              typeof txError === "object" &&
              txError !== null &&
              "message" in txError &&
              typeof (txError as any).message === "string"
            ) {
              txErrorMsg = (txError as any).message;
            }
            alert(
              "Swap failed: " +
                (txErrorMsg || JSON.stringify(txError) || "Unknown error")
            );
          }
        } else {
          alert("Không tìm thấy ví Aptos để gửi transaction!");
        }
        setIsSwapping(false);
        return;
      }
      // ... giữ nguyên logic swap cho các DEX khác ...
      // Convert amount to octas
      const amountInOctas = Math.floor(
        Number.parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)
      );
      const minOutputAmount = Math.floor(
        Number.parseFloat(quote.outputAmount) * (1 - slippage / 100)
      ); // 5% slippage
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes from now

      let transactionPayload;
      let typeArgs = [fromToken.address, toToken.address];
      // Nếu là PancakeSwap, route trực tiếp tới entry function của PancakeSwap
      if (quote.dex === "PancakeSwap") {
        try {
          // 1. Tạo đối tượng Coin cho fromToken và toToken
          const fromCoin = new Coin(
            1,
            fromToken.address,
            fromToken.decimals,
            fromToken.symbol
          );
          const toCoin = new Coin(
            1,
            toToken.address,
            toToken.decimals,
            toToken.symbol
          );
          // 2. Fetch reserves pool PancakeSwap từ Aptos node
          const poolAddress =
            quote.pool_address ||
            "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa";
          const resourceTypes = [
            "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::swap::TokenPairReserve<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>",
            "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::swap::TokenPairReserve<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0x1::aptos_coin::AptosCoin>",
          ];
          let reserves = null;
          let lastData = null;
          for (const resourceType of resourceTypes) {
            const url = `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${poolAddress}/resource/${encodeURIComponent(
              resourceType
            )}`;
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            lastData = data;
            // Ưu tiên lấy reserve_x/reserve_y nếu có, fallback sang coin_x/coin_y nếu cần
            let reserveX, reserveY;
            if (
              data &&
              data.data &&
              data.data.reserve_x &&
              data.data.reserve_y
            ) {
              reserveX = data.data.reserve_x;
              reserveY = data.data.reserve_y;
              console.log(
                "[PANCAKESWAP DEBUG] Found reserves: reserve_x =",
                reserveX,
                ", reserve_y =",
                reserveY
              );
            } else if (
              data &&
              data.data &&
              data.data.coin_x &&
              data.data.coin_y
            ) {
              reserveX = data.data.coin_x.value;
              reserveY = data.data.coin_y.value;
              console.log(
                "[PANCAKESWAP DEBUG] Found reserves: coin_x =",
                reserveX,
                ", coin_y =",
                reserveY
              );
            } else {
              console.log(
                "[PANCAKESWAP DEBUG] No reserves found in data for resourceType:",
                resourceType,
                data
              );
              continue;
            }
            reserves = {
              reserveX,
              reserveY,
            };
            break;
          }
          // Thêm kiểm tra reserves hợp lệ trước khi tạo Pair/Route/Trade
          if (
            !reserves ||
            isNaN(Number(reserves.reserveX)) ||
            isNaN(Number(reserves.reserveY)) ||
            Number(reserves.reserveX) <= 0 ||
            Number(reserves.reserveY) <= 0
          ) {
            alert(
              "Pool PancakeSwap không có thanh khoản hoặc reserves không hợp lệ."
            );
            setIsSwapping(false);
            return;
          }
          // 3. Tạo CurrencyAmount cho từng token
          const reserveA = CurrencyAmount.fromRawAmount(
            fromCoin,
            reserves.reserveX
          );
          const reserveB = CurrencyAmount.fromRawAmount(
            toCoin,
            reserves.reserveY
          );
          if (!reserveA || !reserveB) {
            alert("Không tạo được CurrencyAmount cho reserves PancakeSwap.");
            setIsSwapping(false);
            return;
          }
          // 4. Tạo Pair, Route, Trade
          let pair, route, trade;
          try {
            pair = new Pair(reserveA, reserveB);
            route = new Route([pair], fromCoin, toCoin);
            const amountIn =
              Number(fromAmount) * Math.pow(10, fromToken.decimals);
            const amountInRaw = CurrencyAmount.fromRawAmount(
              fromCoin,
              amountIn.toString()
            );
            trade = Trade.exactIn(route, amountInRaw);
          } catch (err) {
            alert(
              "Không tạo được Pair/Route/Trade cho PancakeSwap. Dữ liệu pool có thể không hợp lệ."
            );
            setIsSwapping(false);
            return;
          }
          // Kiểm tra trade.route.pairs là mảng
          if (!trade || !trade.route || !Array.isArray(trade.route.pairs)) {
            alert(
              "Không tạo được trade hợp lệ cho PancakeSwap (route.pairs lỗi)."
            );
            setIsSwapping(false);
            return;
          }
          // Log debug chi tiết
          console.log("PancakeSwap debug:", {
            fromCoin,
            toCoin,
            reserveA,
            reserveB,
            pair,
            route,
            trade,
            reserves,
          });
          // 5. Tạo payload swap qua SDK
          const txPayload = Router.swapCallParameters(trade, {
            allowedSlippage: new Percent(Math.floor(slippage * 100), 10000),
          });
          if (!txPayload) {
            alert("Không tạo được transaction payload cho PancakeSwap.");
            setIsSwapping(false);
            return;
          }
          // Chuyển đổi sang đúng định dạng Aptos
          const aptosPayload = {
            type: "entry_function_payload",
            function: txPayload.function,
            type_arguments: txPayload.typeArguments,
            arguments: txPayload.functionArguments,
          };
          // Chỉ log payload đúng chuẩn
          console.log("[PANCAKESWAP SDK SWAP] Aptos Payload:", aptosPayload);
          if (signAndSubmitTransaction) {
            try {
              const result = await signAndSubmitTransaction(aptosPayload);
              if (result && result.hash) {
                alert(
                  `Swap completed successfully on PancakeSwap!\nTransaction hash: ${result.hash}`
                );
              } else if (result && result.success) {
                alert(
                  "Swap transaction submitted successfully on PancakeSwap!"
                );
              } else {
                alert("Swap completed successfully on PancakeSwap!");
              }
              setFromAmount("");
              setQuotes([]);
              updateBalances();
            } catch (txError) {
              // Log chi tiết object lỗi
              console.error(
                "[PANCAKESWAP TRANSACTION FAILED]",
                txError,
                JSON.stringify(txError)
              );
              let txErrorMsg = "";
              if (
                typeof txError === "object" &&
                txError !== null &&
                "message" in txError &&
                typeof (txError as any).message === "string"
              ) {
                txErrorMsg = (txError as any).message;
              }
              alert(
                "Swap failed: " +
                  (txErrorMsg || JSON.stringify(txError) || "Unknown error")
              );
            }
          } else {
            alert("Không tìm thấy ví Aptos để gửi transaction!");
          }
        } catch (sdkError) {
          let sdkErrorMsg = "";
          if (
            sdkError &&
            typeof sdkError === "object" &&
            "message" in sdkError &&
            typeof (sdkError as any).message === "string"
          ) {
            sdkErrorMsg = (sdkError as any).message;
          }
          alert(
            "PancakeSwap SDK error: " +
              (sdkErrorMsg || JSON.stringify(sdkError) || "Unknown error")
          );
        }
        setIsSwapping(false);
        return;
      } else {
        // Các DEX khác giữ nguyên logic aggregator
        let args = [
          amountInOctas.toString(),
          minOutputAmount.toString(),
          deadline.toString(),
        ];
        const dexNeedPoolAddress = ["Liquidswap", "AnimeSwap", "SushiSwap"];
        if (quote.pool_address && dexNeedPoolAddress.includes(quote.dex)) {
          args.push(quote.pool_address);
        }
        transactionPayload = {
          type: "entry_function_payload",
          function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::swap_exact_input`,
          type_arguments: typeArgs,
          arguments: args,
        };
        console.log(
          `[DEBUG SWAP] Executing on ${quote.dex} with swap_exact_input`
        );
        console.log(`[DEBUG SWAP] Payload:`, transactionPayload);
      }

      // Log chi tiết để debug trước khi gửi transaction
      console.log("[DEBUG SWAP] Payload:", transactionPayload);
      console.log("[DEBUG SWAP] type_arguments:", typeArgs);
      // Không còn biến args, chỉ log arguments từ transactionPayload
      console.log("[DEBUG SWAP] arguments:", transactionPayload.arguments);
      if (quote.pool_address) {
        console.log("[DEBUG SWAP] pool_address:", quote.pool_address);
      }

      // Sign and submit transaction
      const result = await signAndSubmitTransaction(transactionPayload);
      console.log("Transaction result:", result);

      // Kiểm tra kết quả transaction
      if (result && result.hash) {
        const alertMsg = `Swap completed successfully on ${quoteToUse.dex}!\nTransaction hash: ${result.hash}`;
        alert(alertMsg);
        toast({
          title: `Swap thành công trên ${quoteToUse.dex}!`,
          description: (
            <div>
              <div>
                Txn:{" "}
                <a
                  href={`https://explorer.aptoslabs.com/txn/${result.hash}`}
                  target="_blank"
                  className="underline"
                >
                  {result.hash.slice(0, 8)}...{result.hash.slice(-6)}
                </a>
              </div>
              <div>Phí: {result.gas_used || "-"} APT</div>
              <div>
                Swap: {fromAmount} {fromToken.symbol}
              </div>
              <div>
                Nhận: {Number(quoteToUse.outputAmount).toFixed(4)}{" "}
                {toToken.symbol}
              </div>
            </div>
          ),
          duration: 10000,
          closeButton: true,
        });
        setSwapSuccessInfo({
          dex: quoteToUse.dex,
          hash: result.hash,
          gasUsed: result.gas_used || "-",
          fromAmount,
          fromSymbol: fromToken.symbol,
          toAmount: Number(quoteToUse.outputAmount).toFixed(4),
          toSymbol: toToken.symbol,
        });
      } else if (result && result.success) {
        alert(`Swap transaction submitted successfully on ${quoteToUse.dex}!`);
        toast({
          title: `Swap đã gửi lên ${quoteToUse.dex}!`,
          description: "Giao dịch đã được gửi lên blockchain.",
          duration: 10000,
          closeButton: true,
        });
        // KHÔNG setSwapSuccessInfo(null) ở đây
      } else {
        alert(`Swap completed successfully on ${quoteToUse.dex}!`);
        toast({
          title: `Swap thành công trên ${quoteToUse.dex}!`,
          description: "Giao dịch đã hoàn tất.",
          duration: 10000,
          closeButton: true,
        });
        // KHÔNG setSwapSuccessInfo(null) ở đây
      }

      setFromAmount("");
      setQuotes([]);
      // Refresh balances
      updateBalances();
    } catch (error) {
      let errorMsg = "";
      let errorStack = "";
      if (typeof error === "object" && error !== null) {
        if ("message" in error && typeof (error as any).message === "string") {
          errorMsg = (error as any).message;
        }
        if ("stack" in error && typeof (error as any).stack === "string") {
          errorStack = (error as any).stack;
        }
      }
      console.error(
        "Swap failed:",
        error,
        JSON.stringify(error),
        errorMsg,
        errorStack
      );
      // Hiển thị lỗi chi tiết hơn
      let errorMessage = `Swap failed on ${quoteToUse.dex}. `;
      if (error instanceof Error) {
        errorMessage += error.message;
        if (error.message.includes("Simulation error")) {
          errorMessage +=
            "\n\nCó thể do:\n- Số dư không đủ\n- Gas fee không đủ\n- Token không được hỗ trợ\n- Smart contract lỗi";
        }
      } else if (typeof error === "object" && error !== null) {
        errorMessage += JSON.stringify(error);
      } else {
        errorMessage += error?.toString() || "Unknown error";
      }
      alert(errorMessage);
      toast({
        title: "Swap thất bại!",
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
        closeButton: true,
      });
      setSwapSuccessInfo(null);
    } finally {
      setIsSwapping(false);
    }
  };

  // Khi user chọn DEX, luôn ưu tiên bestQuote là Liquidswap nếu có
  const getBestQuoteByDex = (dexName: string) => {
    if (!quotes || quotes.length === 0) return null;
    return quotes.find((q) => q.dex === dexName) || null;
  };

  // Sửa lại executeSwap để luôn lấy bestQuote là Liquidswap nếu có quote Liquidswap, không cần kiểm tra selectedDex
  const executeSwap = async () => {
    if (!connected || !address) {
      toast({
        title: "Chưa kết nối ví!",
        description: "Vui lòng kết nối ví trước khi swap.",
        variant: "destructive",
      });
      return;
    }
    setIsSwapping(true);
    try {
      // Always refresh quote before swap
      const amountInOctas = Math.floor(
        Number.parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)
      );
      const response = await fetch(`/api/simulate-swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          inputToken: fromToken.address,
          outputToken: toToken.address,
          inputAmount: amountInOctas.toString(),
        }),
      });
      if (!response.ok) {
        toast({
          title: "Lỗi lấy báo giá",
          description: "Không thể lấy báo giá mới. Vui lòng thử lại.",
          variant: "destructive",
        });
        setIsSwapping(false);
        return;
      }
      const data = await response.json();
      let quoteToUse = null;
      if (data && data.bestQuote) {
        quoteToUse = data.bestQuote;
      } else if (
        data &&
        data.quotes &&
        Array.isArray(data.quotes) &&
        data.quotes.length > 0
      ) {
        quoteToUse = data.quotes[0];
      }
      if (!quoteToUse || Number.parseFloat(quoteToUse.outputAmount) <= 0) {
        toast({
          title: "Không có báo giá khả dụng",
          description:
            "Không có báo giá hoặc output bằng 0. Vui lòng thử lại hoặc chọn cặp token khác.",
          variant: "destructive",
        });
        setIsSwapping(false);
        return;
      }
      // Kiểm tra số dư
      const fromBalanceNum = Number(fromBalance);
      const fromAmountNum = Number(fromAmount);
      if (
        !isNaN(fromBalanceNum) &&
        !isNaN(fromAmountNum) &&
        fromBalanceNum < fromAmountNum
      ) {
        toast({
          title: "Số dư không đủ!",
          description: `Bạn chỉ có ${fromBalance} ${fromToken.symbol}, không đủ để swap ${fromAmount} ${fromToken.symbol}.`,
          variant: "destructive",
        });
        setIsSwapping(false);
        return;
      }
      // Kiểm tra gas fee (APT balance)
      const aptBalance = balances["APT"] || "0";
      const aptBalanceNum = Number(aptBalance);
      if (aptBalanceNum < 0.01) {
        toast({
          title: "Số dư APT không đủ!",
          description: "Cần ít nhất 0.01 APT để trả gas fee.",
          variant: "destructive",
        });
        setIsSwapping(false);
        return;
      }
      // Tính lại minAmountOut từ quote mới nhất
      const minOutputAmount = Math.floor(
        Number.parseFloat(quoteToUse.outputAmount) * (1 - slippage / 100)
      );
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes from now
      let transactionPayload;
      let typeArgs = [fromToken.address, toToken.address];
      let args;
      if (swapMode === "cross-address") {
        args = [
          receiverAddress,
          amountInOctas.toString(),
          minOutputAmount.toString(),
          deadline.toString(),
        ];
        transactionPayload = {
          type: "entry_function_payload",
          function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::swap_cross_address_v2`,
          type_arguments: typeArgs,
          arguments: args,
        };
      } else if (quoteToUse.dex === "PancakeSwap") {
        if (!quoteToUse.pool_address)
          throw new Error("Missing pool_address for PancakeSwap");
        transactionPayload = {
          type: "entry_function_payload",
          function:
            "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::swap::swap_exact_in",
          type_arguments: typeArgs,
          arguments: [
            quoteToUse.pool_address,
            amountInOctas.toString(),
            minOutputAmount.toString(),
          ],
        };
      } else {
        args = [
          amountInOctas.toString(),
          minOutputAmount.toString(),
          deadline.toString(),
        ];
        const dexNeedPoolAddress = ["Liquidswap", "AnimeSwap", "SushiSwap"];
        if (
          quoteToUse.pool_address &&
          dexNeedPoolAddress.includes(quoteToUse.dex)
        ) {
          args.push(quoteToUse.pool_address);
        }
        transactionPayload = {
          type: "entry_function_payload",
          function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::swap_exact_input`,
          type_arguments: typeArgs,
          arguments: args,
        };
      }
      // Gửi transaction qua wallet
      const result = await signAndSubmitTransaction(transactionPayload);
      if (result && result.hash) {
        const alertMsg = `Swap completed successfully on ${quoteToUse.dex}!\nTransaction hash: ${result.hash}`;
        alert(alertMsg);
        toast({
          title: `Swap thành công trên ${quoteToUse.dex}!`,
          description: (
            <div>
              <div>
                Txn:{" "}
                <a
                  href={`https://explorer.aptoslabs.com/txn/${result.hash}`}
                  target="_blank"
                  className="underline"
                >
                  {result.hash.slice(0, 8)}...{result.hash.slice(-6)}
                </a>
              </div>
              <div>Phí: {result.gas_used || "-"} APT</div>
              <div>
                Swap: {fromAmount} {fromToken.symbol}
              </div>
              <div>
                Nhận: {Number(quoteToUse.outputAmount).toFixed(4)}{" "}
                {toToken.symbol}
              </div>
            </div>
          ),
          duration: 10000,
          closeButton: true,
        });
        setSwapSuccessInfo({
          dex: quoteToUse.dex,
          hash: result.hash,
          gasUsed: result.gas_used || "-",
          fromAmount,
          fromSymbol: fromToken.symbol,
          toAmount: Number(quoteToUse.outputAmount).toFixed(4),
          toSymbol: toToken.symbol,
        });
      } else if (result && result.success) {
        alert(`Swap transaction submitted successfully on ${quoteToUse.dex}!`);
        toast({
          title: `Swap đã gửi lên ${quoteToUse.dex}!`,
          description: "Giao dịch đã được gửi lên blockchain.",
          duration: 10000,
          closeButton: true,
        });
        // KHÔNG setSwapSuccessInfo(null) ở đây
      } else {
        alert(`Swap completed successfully on ${quoteToUse.dex}!`);
        toast({
          title: `Swap thành công trên ${quoteToUse.dex}!`,
          description: "Giao dịch đã hoàn tất.",
          duration: 10000,
          closeButton: true,
        });
        // KHÔNG setSwapSuccessInfo(null) ở đây
      }
      setFromAmount("");
      setQuotes([]);
      updateBalances();
    } catch (error) {
      let errorMsg = "";
      let errorStack = "";
      if (typeof error === "object" && error !== null) {
        if ("message" in error && typeof (error as any).message === "string") {
          errorMsg = (error as any).message;
        }
        if ("stack" in error && typeof (error as any).stack === "string") {
          errorStack = (error as any).stack;
        }
      }
      console.error(
        "Swap failed:",
        error,
        JSON.stringify(error),
        errorMsg,
        errorStack
      );
      let errorMessage = "Swap failed. ";
      if (error instanceof Error) {
        errorMessage += error.message;
        if (error.message.includes("Simulation error")) {
          errorMessage +=
            "\n\nCó thể do:\n- Số dư không đủ\n- Gas fee không đủ\n- Token không được hỗ trợ\n- Smart contract lỗi";
        }
      } else {
        errorMessage += error?.toString() || "Unknown error";
      }
      toast({
        title: "Swap thất bại!",
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
        closeButton: true,
      });
      setSwapSuccessInfo(null);
    } finally {
      setIsSwapping(false);
    }
  };

  // Sắp xếp quotes theo outputAmount giảm dần (lợi nhất lên trên) và chỉ hiển thị 6 DEX:
  // Chỉ giữ lại các DEX swap được và có pool trong smart contract
  const SUPPORTED_DEXS = [
    "Liquidswap",
    "Econia",
    "Panora",
    "Amnis",
    "AnimeSwap",
    "SushiSwap",
    "PancakeSwap",
    "Aux", // Thêm dòng này để hiển thị Aux
  ];
  const sortedQuotes = quotes
    .slice()
    .filter((q) => {
      const output = parseFloat(q.outputAmount);
      // Loại bỏ Aggregator và các DEX không hỗ trợ
      return !isNaN(output) && output > 0 && SUPPORTED_DEXS.includes(q.dex);
    })
    .sort((a, b) => parseFloat(b.outputAmount) - parseFloat(a.outputAmount))
    .slice(0, 6); // Chỉ hiển thị 6 DEX đầu tiên

  // Tính toán bestQuote từ sortedQuotes (chỉ các DEX hiển thị trong bảng)
  const bestQuote = sortedQuotes.length > 0 ? sortedQuotes[0] : null;

  // Debug log để kiểm tra sortedQuotes
  if (quotes.length > 0) {
    console.log(
      "🔍 DEBUG: sortedQuotes after filtering and sorting:",
      sortedQuotes.map((q) => ({ dex: q.dex, outputAmount: q.outputAmount }))
    );
  }

  // Debug log để kiểm tra tất cả quotes và sắp xếp
  let validQuotesForDebug: { dex: string; outputAmount: number }[] = [];
  if (quotes.length > 0) {
    validQuotesForDebug = quotes
      .map((q: Quote) => ({
        dex: q.dex,
        outputAmount: parseFloat(q.outputAmount),
      }))
      .filter((q) => !isNaN(q.outputAmount) && q.outputAmount > 0)
      .sort((a: any, b: any) => b.outputAmount - a.outputAmount);
    console.log(
      "🔍 DEBUG: All quotes sorted by outputAmount:",
      validQuotesForDebug
    );
  }

  // Reset tất cả isBest về false trước
  quotes.forEach((quote) => {
    quote.isBest = false;
  });

  // Gắn badge "Best" cho quote có output cao nhất trong bảng Compare DEX Quotes
  if (bestQuote) {
    const bestQuoteInOriginal = quotes.find((q) => q.dex === bestQuote.dex);
    if (bestQuoteInOriginal) {
      bestQuoteInOriginal.isBest = true;
    }
  }

  // Debug log để kiểm tra bestQuote
  if (bestQuote) {
    console.log("🔍 DEBUG: Best quote found:", {
      dex: bestQuote.dex,
      outputAmount: bestQuote.outputAmount,
      allQuotes: quotes.map((q) => ({
        dex: q.dex,
        outputAmount: q.outputAmount,
      })),
    });

    // Kiểm tra xem bestQuote có thực sự là cao nhất không
    const validQuotes = quotes.filter((q) => {
      const output = Number.parseFloat(q.outputAmount);
      return !isNaN(output) && output > 0;
    });

    if (validQuotes.length > 0) {
      const maxOutput = Math.max(
        ...validQuotes.map((q) => Number.parseFloat(q.outputAmount))
      );
      const maxDex = validQuotes.find(
        (q) => Number.parseFloat(q.outputAmount) === maxOutput
      );
      console.log(
        "🔍 DEBUG: Verification - Max output:",
        maxOutput,
        "Max DEX:",
        maxDex?.dex
      );

      if (
        Number.parseFloat(bestQuote.outputAmount).toFixed(6) !==
        maxOutput.toFixed(6)
      ) {
        // Nếu chênh lệch nhỏ hơn 0.000001 thì bỏ qua warning
        if (
          Math.abs(Number.parseFloat(bestQuote.outputAmount) - maxOutput) > 1e-6
        ) {
          console.warn("⚠️ WARNING: Best quote is not the highest!", {
            bestQuote: bestQuote.outputAmount,
            maxOutput,
          });
        }
      } else {
        console.log("✅ SUCCESS: Best quote is correct!");
      }
    } else {
      console.log("⚠️ WARNING: No valid quotes found");
    }
  }

  // Thêm state cho timer
  const REFRESH_INTERVAL = 30; // giây
  const REFRESH_INTERVAL_MS = REFRESH_INTERVAL * 1000;
  const [refreshTimerMs, setRefreshTimerMs] = useState(REFRESH_INTERVAL_MS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer khi input thay đổi
  useEffect(() => {
    setRefreshTimerMs(REFRESH_INTERVAL_MS);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (!fromAmount) return;
    // Bắt đầu countdown chỉ để cập nhật UI
    countdownRef.current = setInterval(() => {
      setRefreshTimerMs((prev) => {
        if (prev <= 1000) {
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    // Gọi fetchQuotes đúng 1 lần sau 30s
    timerRef.current = setTimeout(() => {
      fetchQuotes();
      setRefreshTimerMs(REFRESH_INTERVAL_MS);
    }, REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fromAmount, fromToken, toToken]);

  // Khi user nhấn Refresh
  const handleManualRefresh = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    fetchQuotes();
    setRefreshTimerMs(REFRESH_INTERVAL_MS);
    // Bắt đầu lại countdown chỉ để cập nhật UI
    countdownRef.current = setInterval(() => {
      setRefreshTimerMs((prev) => {
        if (prev <= 1000) {
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    // Gọi fetchQuotes đúng 1 lần sau 30s
    timerRef.current = setTimeout(() => {
      fetchQuotes();
      setRefreshTimerMs(REFRESH_INTERVAL_MS);
    }, REFRESH_INTERVAL_MS);
  };

  const marketData = useMarketOverview();

  // Add real-time price display component
  const [realPrice, setRealPrice] = useState<string>("-");

  // Thêm hàm fetchRealPoolPrice để lấy giá từ pool thực tế
  async function fetchRealPoolPrice(
    fromToken: Token,
    toToken: Token,
    setRealPrice: Dispatch<SetStateAction<string>>
  ) {
    // Chỉ lấy giá cho cặp APT/USDC từ PancakeSwap pool, bạn có thể mở rộng cho các cặp khác nếu cần
    if (fromToken.symbol === "APT" && toToken.symbol === "USDC") {
      try {
        const poolRes = await fetch(
          "https://fullnode.mainnet.aptoslabs.com/v1/accounts/0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa/resources"
        );
        if (poolRes.ok) {
          const poolData = await poolRes.json();
          const aptUsdcPool = poolData.find(
            (r: any) =>
              r.type.includes("TokenPairReserve") &&
              r.type.includes("aptos_coin::AptosCoin") &&
              r.type.includes("asset::USDC")
          );
          if (
            aptUsdcPool &&
            aptUsdcPool.data.reserve_x &&
            aptUsdcPool.data.reserve_y
          ) {
            const aptReserve = parseInt(aptUsdcPool.data.reserve_x) / 1e8; // 8 decimals
            const usdcReserve = parseInt(aptUsdcPool.data.reserve_y) / 1e6; // 6 decimals
            const price = usdcReserve / aptReserve;
            setRealPrice(`$${price.toFixed(3)}`);
            return;
          }
        }
      } catch (e) {
        // fallback giữ nguyên giá cũ
      }
    }
    // Nếu không phải cặp hỗ trợ, hoặc lỗi, đặt giá trị mặc định
    setRealPrice("-");
  }

  // Thêm useEffect để tự động fetch giá pool mỗi 30s khi chọn cặp token
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (connected && fromAmount && fromToken && toToken) {
      // Thêm điều kiện chỉ fetch khi đã kết nối ví và nhập số lượng
      // Fetch ngay lần đầu
      fetchRealPoolPrice(fromToken, toToken, setRealPrice);
      // Sau đó cứ 30s fetch lại
      intervalId = setInterval(() => {
        fetchRealPoolPrice(fromToken, toToken, setRealPrice);
      }, 30000);
    } else {
      setRealPrice("-");
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [connected, fromAmount, fromToken, toToken]);

  // Thêm các state cho Nav bar
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Debug log Best Quote chỉ khi quotes thực sự thay đổi
  const prevQuotesRef = useRef<Quote[] | null>(null);
  useEffect(() => {
    // So sánh quotes mới với quotes cũ, chỉ log nếu khác
    const prevQuotes = prevQuotesRef.current;
    const quotesString = JSON.stringify(quotes);
    const prevQuotesString = prevQuotes ? JSON.stringify(prevQuotes) : null;
    if (quotes.length > 0 && quotesString !== prevQuotesString) {
      console.log(
        "🔍 DEBUG: sortedQuotes after filtering and sorting:",
        sortedQuotes.map((q) => ({ dex: q.dex, outputAmount: q.outputAmount }))
      );
      const validQuotesForDebug = quotes
        .map((q: Quote) => ({
          dex: q.dex,
          outputAmount: parseFloat(q.outputAmount),
        }))
        .filter((q) => !isNaN(q.outputAmount) && q.outputAmount > 0)
        .sort((a: any, b: any) => b.outputAmount - a.outputAmount);
      console.log(
        "🔍 DEBUG: All quotes sorted by outputAmount:",
        validQuotesForDebug
      );
      if (bestQuote) {
        console.log("🔍 DEBUG: Best quote found:", {
          dex: bestQuote.dex,
          outputAmount: bestQuote.outputAmount,
          allQuotes: quotes.map((q) => ({
            dex: q.dex,
            outputAmount: q.outputAmount,
          })),
        });
        // Kiểm tra xem bestQuote có thực sự là cao nhất không
        const validQuotes = quotes.filter((q) => {
          const output = Number.parseFloat(q.outputAmount);
          return !isNaN(output) && output > 0;
        });
        if (validQuotes.length > 0) {
          const maxOutput = Math.max(
            ...validQuotes.map((q) => Number.parseFloat(q.outputAmount))
          );
          const maxDex = validQuotes.find(
            (q) => Number.parseFloat(q.outputAmount) === maxOutput
          );
          console.log(
            "🔍 DEBUG: Verification - Max output:",
            maxOutput,
            "Max DEX:",
            maxDex?.dex
          );
          if (
            Number.parseFloat(bestQuote.outputAmount).toFixed(6) !==
            maxOutput.toFixed(6)
          ) {
            // Nếu chênh lệch nhỏ hơn 0.000001 thì bỏ qua warning
            if (
              Math.abs(Number.parseFloat(bestQuote.outputAmount) - maxOutput) >
              1e-6
            ) {
              console.warn("⚠️ WARNING: Best quote is not the highest!", {
                bestQuote: bestQuote.outputAmount,
                maxOutput,
              });
            }
          } else {
            console.log("✅ SUCCESS: Best quote is correct!");
          }
        } else {
          console.log("⚠️ WARNING: No valid quotes found");
        }
      }
    }
    prevQuotesRef.current = quotes;
  }, [quotes, bestQuote, sortedQuotes]);

  // State cho slippage
  const [slippage, setSlippage] = useState(0.5); // mặc định 0.5%
  const slippageOptions = [0.1, 0.5, 1];
  const [customSlippage, setCustomSlippage] = useState("");
  const isCustom =
    customSlippage !== "" && !slippageOptions.includes(Number(customSlippage));

  // State for custom slippage input focus
  const [customSlippageFocused, setCustomSlippageFocused] = useState(false);

  // Handler for Enter key or blur on custom slippage
  const handleCustomSlippageBlur = useCallback(() => {
    setCustomSlippageFocused(false);
    // Remove % if user pasted it
    if (customSlippage.endsWith("%")) {
      const val = customSlippage.replace(/%/g, "");
      setCustomSlippage(val);
      setSlippage(Number(val) || 0);
    }
  }, [customSlippage]);
  const handleCustomSlippageFocus = useCallback(() => {
    setCustomSlippageFocused(true);
  }, []);
  const handleCustomSlippageKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
      // Only allow numbers, dot, backspace, delete, arrows
      if (
        !/^[0-9.]$/.test(e.key) &&
        ![
          "Backspace",
          "Delete",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
          "Enter",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
    },
    []
  );

  // Danh sách DEX hỗ trợ cross-address swap
  const CROSS_ADDRESS_SUPPORTED_DEXS = [
    "Liquidswap",
    "PancakeSwap",
    "AnimeSwap",
  ];

  // Thêm state để hiển thị Card swap thành công
  const [swapSuccessInfo, setSwapSuccessInfo] = useState<null | {
    dex: string;
    hash: string;
    gasUsed: string;
    fromAmount: string;
    fromSymbol: string;
    toAmount: string;
    toSymbol: string;
  }>(null);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background image */}
      <div
        style={{
          backgroundImage: "url('/top-bg-sm.png')",
          backgroundSize: "70% auto",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      {/* Navigation Bar giống landing page */}
      <nav className="relative z-50 bg-black/80 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="/dexonic_gold.svg"
                alt="Dexonic Logo"
                className="h-10 w-10 mr-3 inline-block align-middle"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Dexonic Dex Aggregator
              </span>
            </div>
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="https://dexonic.finance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/swap"
                className="text-yellow-400 border-b-2 border-yellow-400 font-semibold transition-colors"
              >
                Swap
              </Link>
              <Link
                href="/profile"
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Profile
              </Link>
              {/* Auth Buttons */}
              {!user ? (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    variant="outline"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400 transition-all duration-300 bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    onClick={() => setShowSignupModal(true)}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold transition-all duration-300"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all duration-300 cursor-pointer"
                  >
                    <img
                      src={user.image || "/placeholder.svg"}
                      alt={user.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-yellow-400 font-medium">
                      {user.name}
                    </span>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:border-gray-500 bg-transparent"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {/* Wallet Selector */}
              <MultiWalletSelector />
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-yellow-400"
            >
              {isMenuOpen ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </button>
          </div>
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <Link
                href="/"
                className="block text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/swap"
                className="block text-yellow-400 border-b-2 border-yellow-400 font-semibold transition-colors"
              >
                Swap
              </Link>
              <Link
                href="/profile"
                className="block text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Profile
              </Link>
              {/* Auth Buttons */}
              {!user ? (
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    variant="outline"
                    className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    onClick={() => setShowSignupModal(true)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all duration-300 cursor-pointer"
                  >
                    <img
                      src={user.image || "/placeholder.svg"}
                      alt={user.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-yellow-400 font-medium">
                      {user.name}
                    </span>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
              {/* Wallet Selector */}
              <MultiWalletSelector />
            </div>
          )}
        </div>
      </nav>
      {/* Phục hồi lại phần render chức năng swap */}
      <div className="swap-main-container flex justify-center items-start gap-8 max-w-[1280px] mx-auto px-4 py-8">
        {/* Left Sidebar - Swap Settings */}
        <div className="hidden xl:block w-80">
          {/* Admin Initializer - Only show for admin */}
          {connected && address === AGGREGATOR_ADDRESS && (
            <div className="mb-4">
              <AdminInitializer />
            </div>
          )}
          <Card className="settings-panel mb-4">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Swap Settings
              </h3>
              {/* Wallet Status */}
              {connected && address && (
                <div className="wallet-status mb-4 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-white">
                      {activeWallet === "pontem"
                        ? "Pontem Wallet Connected"
                        : "Petra Wallet Connected"}
                    </span>
                  </div>
                  <div className="w-full flex justify-center">
                    <code className="text-xs text-gray-400 font-mono text-center">
                      {address.slice(0, 10)}...{address.slice(-6)}
                    </code>
                  </div>
                </div>
              )}
              {/* Slippage Tolerance */}
              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-2 block">
                  Slippage Tolerance
                </label>
                <div className="flex space-x-2">
                  {slippageOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`slippage-button px-3 py-1 text-xs rounded font-bold transition-colors duration-150
                        ${!isCustom && slippage === option ? "active" : ""}
                      `}
                      onClick={() => {
                        setSlippage(option);
                        setCustomSlippage("");
                      }}
                    >
                      {option}%
                    </button>
                  ))}
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <input
                      type="text"
                      min="0"
                      step="0.01"
                      placeholder="Custom"
                      value={
                        isCustom
                          ? customSlippageFocused
                            ? customSlippage
                            : customSlippage !== ""
                            ? customSlippage + "%"
                            : ""
                          : ""
                      }
                      onFocus={handleCustomSlippageFocus}
                      onBlur={handleCustomSlippageBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          (e.target as HTMLInputElement).blur();
                        }
                        // Only allow numbers, dot, backspace, delete, arrows
                        if (
                          !/^[0-9.]$/.test(e.key) &&
                          ![
                            "Backspace",
                            "Delete",
                            "ArrowLeft",
                            "ArrowRight",
                            "Tab",
                            "Enter",
                          ].includes(e.key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        // Only allow numbers and dot
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setCustomSlippage(val);
                        setSlippage(Number(val) || 0);
                      }}
                      className={`swap-input px-2 py-1 text-xs w-16 rounded font-bold transition-colors duration-150 slippage-button${
                        isCustom ? " active" : ""
                      } text-center`}
                      style={{ textAlign: "center" }}
                    />
                  </div>
                </div>
              </div>
              {/* Transaction Deadline */}
              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-2 block">
                  Transaction Deadline
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue="20"
                    className="swap-input px-3 py-2 w-20"
                  />
                  <span className="text-gray-400 text-sm">minutes</span>
                </div>
              </div>
              {/* MEV Protection */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">MEV Protection</span>
                <button className="mev-toggle w-10 h-6 rounded-full relative">
                  <div className="w-4 h-4 bg-black rounded-full absolute right-1 top-1"></div>
                </button>
              </div>
            </CardContent>
          </Card>
          {/* Recent Transactions */}
          <Card className="swap-card">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3">
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {/* Cập nhật thời gian các giao dịch */}
                <div className="transaction-item flex items-center justify-between p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">APT → USDC</span>
                  </div>
                  <span className="text-xs text-gray-400">3m ago</span>
                </div>
                <div className="transaction-item flex items-center justify-between p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">APT → USDC</span>
                  </div>
                  <span className="text-xs text-gray-400">36m ago</span>
                </div>
                <div className="transaction-item flex items-center justify-between p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">APT → USDC</span>
                  </div>
                  <span className="text-xs text-gray-400">68m ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Main Swap Card */}
        <div className="flex-1 min-w-[350px] max-w-[540px] mx-auto">
          {/* Swap Card */}
          <Card className="swap-card p-6">
            <CardContent className="p-6">
              {/* Swap Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Swap</h2>
                <div className="flex items-center space-x-2">
                  <button
                    className="swap-button-secondary p-2 rounded-lg"
                    onClick={swapTokens}
                    title="Đảo chiều"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                  <button
                    className="swap-button-secondary p-2 rounded-lg"
                    onClick={handleManualRefresh}
                    title="Làm mới báo giá"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Real-time Price Display */}
              {fromToken.symbol === "APT" && toToken.symbol === "USDC" && (
                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">
                        Real-time APT/USDC Price:
                      </span>
                    </div>
                    <span className="text-lg font-bold text-yellow-400">
                      {realPrice}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    From PancakeSwap Pool • Updates every 30s
                  </div>
                </div>
              )}
              {/* Swap Mode Selector */}
              <div className="flex flex-col w-full max-w-md mb-4">
                <span className="text-sm text-gray-300 mb-2 text-left">
                  Swap Mode:
                </span>
                <div className="swap-mode-selector flex justify-center items-center gap-0 bg-[#23272f] rounded-xl p-1 w-full">
                  <button
                    onClick={() => setSwapMode("same-address")}
                    className={`swap-mode-button w-1/2 flex-1 py-3 rounded-xl text-base font-semibold flex items-center justify-center transition-colors duration-150 ${
                      swapMode === "same-address"
                        ? "active bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg"
                        : "text-gray-300"
                    }`}
                  >
                    <User className="w-5 h-5 mr-2" />
                    Same Address
                  </button>
                  <button
                    onClick={() => setSwapMode("cross-address")}
                    className={`swap-mode-button w-1/2 flex-1 py-3 rounded-xl text-base font-semibold flex items-center justify-center transition-colors duration-150 ${
                      swapMode === "cross-address"
                        ? "active bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg"
                        : "text-gray-300"
                    }`}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Cross Address
                  </button>
                </div>
              </div>
              {/* Receiver Address Input (for cross-address mode) */}
              {swapMode === "cross-address" && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Receiver Address
                  </label>
                  <Input
                    type="text"
                    value={
                      receiverAddress === RECEIVER_ADDRESS
                        ? ""
                        : receiverAddress
                    }
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder={
                      !connected
                        ? "Enter Receiver Address First"
                        : "Add Receiver Address"
                    }
                    className="swap-input"
                  />
                  <div className="cross-address-info flex items-center justify-between mt-2 p-2 rounded-lg">
                    <span className="text-xs text-gray-400">
                      Sender:{" "}
                      {address
                        ? `${address.slice(0, 10)}...${address.slice(-6)}`
                        : "Add You Wallet First"}
                    </span>
                    <span className="text-xs text-gray-400">
                      Receiver:{" "}
                      {receiverAddress === RECEIVER_ADDRESS
                        ? "Add Receiver Address First"
                        : receiverAddress
                        ? `${receiverAddress.slice(
                            0,
                            10
                          )}...${receiverAddress.slice(-6)}`
                        : "Add Receiver Address First"}
                    </span>
                  </div>
                </div>
              )}
              {/* Wallet Connection Status */}
              {!connected && (
                <div className="wallet-status disconnected mb-4 p-3 rounded-lg">
                  <div className="text-center">
                    {availableWallets.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-red-400">
                          No wallets detected
                        </p>
                        <p className="text-xs text-gray-400">
                          Please install a wallet extension
                        </p>
                        <div className="flex space-x-2 justify-center">
                          <Button
                            onClick={() =>
                              window.open("https://petra.app/", "_blank")
                            }
                            variant="outline"
                            size="sm"
                          >
                            Install Petra
                          </Button>
                          <Button
                            onClick={() =>
                              window.open("https://pontem.network/", "_blank")
                            }
                            variant="outline"
                            size="sm"
                          >
                            Install Pontem
                          </Button>
                        </div>
                      </div>
                    ) : connectionStatus === "error" ? (
                      <div className="space-y-2">
                        <p className="text-sm text-red-400">
                          Connection failed
                        </p>
                        <p className="text-xs text-gray-400">
                          Please check your Petra extension
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-white">
                        Connect your Aptos wallet to start trading
                      </p>
                    )}
                  </div>
                </div>
              )}
              {/* From Token */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">
                      You pay
                    </label>
                    <div className="flex items-center gap-2">
                      {connected && Number(fromBalance) > 0 && (
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded bg-white text-yellow-500 text-xs font-semibold mr-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-150 hover:bg-yellow-400 hover:text-white active:bg-yellow-400 active:text-white"
                          style={{ marginRight: 8 }}
                          onClick={() => setFromAmount(fromBalance)}
                        >
                          Max
                        </button>
                      )}
                      <span className="text-xs text-gray-400">
                        Balance:{" "}
                        {connected
                          ? isLoadingBalance
                            ? "Loading..."
                            : fromBalance || "0.00"
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="token-selector rounded-xl p-4"
                    ref={fromDropdownRef}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="0"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          className="bg-transparent border-none text-2xl font-bold text-white placeholder-gray-400 p-0 h-auto focus:ring-0"
                          disabled={!connected}
                        />
                        <div className="text-sm text-gray-400 mt-1">
                          ≈ $
                          {fromToken.symbol === "APT" &&
                          toToken.symbol === "USDC" &&
                          realPrice !== "-"
                            ? (
                                parseFloat(fromAmount || "0") *
                                parseFloat(realPrice.replace("$", ""))
                              ).toFixed(2)
                            : "0.00"}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowFromDropdown(!showFromDropdown)}
                        className="swap-button-secondary flex items-center space-x-2 rounded-lg px-3 py-2 ml-4"
                      >
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                          <img
                            src={fromToken.logoUrl || "/default-token.svg"}
                            alt={fromToken.symbol}
                            className="w-5 h-5 object-contain"
                          />
                        </div>
                        <span className="ml-2 font-semibold text-white">
                          {fromToken.symbol}
                        </span>
                        <ChevronDown className="w-4 h-4 ml-1 text-white" />
                      </button>
                    </div>
                  </div>
                  {/* Token Dropdown */}
                  {showFromDropdown && (
                    <div
                      ref={fromDropdownRef}
                      className="token-dropdown absolute top-full left-0 right-0 mt-2 rounded-xl z-50 max-h-48 overflow-y-auto"
                    >
                      {tokens
                        .filter((token) => token.symbol !== toToken.symbol)
                        .map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setFromToken(token);
                              setShowFromDropdown(false);
                            }}
                            className="token-option w-full flex items-center justify-between p-3 first:rounded-t-xl last:rounded-b-xl hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                                <img
                                  src={token.logoUrl || "/default-token.svg"}
                                  alt={token.symbol}
                                  className="w-5 h-5 object-contain"
                                />
                              </div>
                              <div className="text-left">
                                <div className="text-white font-semibold">
                                  {token.symbol}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {token.name}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white text-sm font-medium">
                                {connected
                                  ? balances[token.symbol] ?? "0.00"
                                  : "0.00"}
                              </div>
                              <div className="text-xs text-gray-400">
                                Balance
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {/* To Token */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">
                      You receive
                    </label>
                    <span className="text-xs text-gray-400">
                      Balance:{" "}
                      {connected
                        ? isLoadingBalance
                          ? "Loading..."
                          : toBalance || "0.00"
                        : "0.00"}
                    </span>
                  </div>
                  <div
                    className="token-selector rounded-xl p-4"
                    ref={toDropdownRef}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-white">
                          {bestQuote &&
                          toToken &&
                          fromAmount &&
                          ((realPrice &&
                            !isNaN(parseFloat(realPrice.replace("$", "")))) ||
                            (marketData && marketData.length > 0))
                            ? (() => {
                                const amountA = parseFloat(fromAmount);
                                let P =
                                  realPrice &&
                                  !isNaN(parseFloat(realPrice.replace("$", "")))
                                    ? parseFloat(realPrice.replace("$", ""))
                                    : null;
                                if (!P && marketData) {
                                  const pair = `${fromToken.symbol}/${toToken.symbol}`;
                                  const found = marketData.find(
                                    (row) => row.pair === pair
                                  );
                                  if (found && found.price) {
                                    P = parseFloat(
                                      found.price.replace("$", "")
                                    );
                                  }
                                }
                                if (!P)
                                  return parseFloat(
                                    bestQuote.outputAmount
                                  ).toFixed(6);
                                const fee = bestQuote.fee
                                  ? parseFloat(bestQuote.fee) / 100
                                  : 0;
                                const priceImpact = bestQuote.priceImpact
                                  ? parseFloat(bestQuote.priceImpact) / 100
                                  : 0;
                                const slippagePct = slippage / 100;
                                const amountB =
                                  amountA *
                                  P *
                                  (1 - fee) *
                                  (1 - priceImpact) *
                                  (1 - slippagePct);
                                return amountB.toFixed(6);
                              })()
                            : bestQuote && toToken && bestQuote.outputAmount
                            ? parseFloat(bestQuote.outputAmount).toFixed(6)
                            : "0"}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          ≈ $
                          {bestQuote &&
                          toToken &&
                          fromAmount &&
                          ((realPrice &&
                            !isNaN(parseFloat(realPrice.replace("$", "")))) ||
                            (marketData && marketData.length > 0))
                            ? (() => {
                                const amountA = parseFloat(fromAmount);
                                let P =
                                  realPrice &&
                                  !isNaN(parseFloat(realPrice.replace("$", "")))
                                    ? parseFloat(realPrice.replace("$", ""))
                                    : null;
                                if (!P && marketData) {
                                  const pair = `${fromToken.symbol}/${toToken.symbol}`;
                                  const found = marketData.find(
                                    (row) => row.pair === pair
                                  );
                                  if (found && found.price) {
                                    P = parseFloat(
                                      found.price.replace("$", "")
                                    );
                                  }
                                }
                                if (!P)
                                  return parseFloat(
                                    bestQuote.outputAmount
                                  ).toFixed(2);
                                const fee = bestQuote.fee
                                  ? parseFloat(bestQuote.fee) / 100
                                  : 0;
                                const priceImpact = bestQuote.priceImpact
                                  ? parseFloat(bestQuote.priceImpact) / 100
                                  : 0;
                                const slippagePct = slippage / 100;
                                const amountB =
                                  amountA *
                                  P *
                                  (1 - fee) *
                                  (1 - priceImpact) *
                                  (1 - slippagePct);
                                return amountB.toFixed(2);
                              })()
                            : bestQuote &&
                              toToken &&
                              bestQuote.outputAmount &&
                              toToken.symbol === "USDC"
                            ? parseFloat(bestQuote.outputAmount).toFixed(2)
                            : "0.00"}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowToDropdown(!showToDropdown)}
                        className="swap-button-secondary flex items-center space-x-2 rounded-lg px-3 py-2 ml-4"
                      >
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                          <img
                            src={toToken.logoUrl || "/default-token.svg"}
                            alt={toToken.symbol}
                            className="w-5 h-5 object-contain"
                          />
                        </div>
                        <span className="ml-2 font-semibold text-white">
                          {toToken.symbol}
                        </span>
                        <ChevronDown className="w-4 h-4 ml-1 text-white" />
                      </button>
                    </div>
                  </div>
                  {/* Token Dropdown */}
                  {showToDropdown && (
                    <div
                      ref={toDropdownRef}
                      className="token-dropdown absolute bottom-full left-0 right-0 mb-2 rounded-xl z-50 max-h-48 overflow-y-auto"
                    >
                      {tokens
                        .filter((token) => token.symbol !== fromToken.symbol)
                        .map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setToToken(token);
                              setShowToDropdown(false);
                            }}
                            className="token-option w-full flex items-center justify-between p-3 first:rounded-t-xl last:rounded-b-xl hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                                <img
                                  src={token.logoUrl || "/default-token.svg"}
                                  alt={token.symbol}
                                  className="w-5 h-5 object-contain"
                                />
                              </div>
                              <div className="text-left">
                                <div className="text-white font-semibold">
                                  {token.symbol}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {token.name}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white text-sm font-medium">
                                {connected
                                  ? balances[token.symbol] ?? "0.00"
                                  : "0.00"}
                              </div>
                              <div className="text-xs text-gray-400">
                                Balance
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Thanh thời gian refresh nằm giữa You receive và Compare DEX Quotes */}
              {fromAmount && (
                <div className="mt-4 mb-4 flex items-center gap-2">
                  <div className="flex-1" style={{ direction: "rtl" }}>
                    <Progress
                      value={100 * (refreshTimerMs / REFRESH_INTERVAL_MS)}
                      className="h-2 bg-white [&_.bg-primary]:bg-yellow-500"
                    />
                    <div
                      className="text-xs text-gray-400 mt-1"
                      style={{ direction: "ltr" }}
                    >
                      Price will update in {Math.floor(refreshTimerMs / 1000)}s
                    </div>
                  </div>
                  <button
                    className="ml-2 px-3 py-1 rounded bg-yellow-500 text-black text-xs font-semibold hover:bg-yellow-400 transition float-right"
                    onClick={handleManualRefresh}
                    title="Refresh quotes now"
                    disabled={
                      refreshTimerMs === REFRESH_INTERVAL_MS || isLoadingQuotes
                    }
                    style={{ minWidth: 70 }}
                  >
                    {isLoadingQuotes ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              )}
              {/* Route Information */}
              {(isLoadingQuotes || quotes.length > 0) && (
                <div className="route-info rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Compare DEX Quotes
                    </span>
                    {bestQuote && (
                      <Badge className="swap-badge text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Best: {getDexName(bestQuote)}
                      </Badge>
                    )}
                  </div>
                  {isLoadingQuotes ? (
                    <div className="swap-loading flex items-center space-x-2 p-2 rounded">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      <span className="text-sm text-gray-400">
                        Finding best route...
                      </span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-left">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700">
                            <th className="py-1 pr-4 text-left w-32">DEX</th>
                            <th className="py-1 pr-4 text-right">Output</th>
                            <th className="py-1 pr-4 text-right">
                              DEX Fee (%)
                            </th>
                            <th className="py-1 pr-4 text-right">
                              Agg Fee (%)
                            </th>
                            <th className="py-1 pr-4 text-right">
                              Price Impact
                            </th>
                            <th className="py-1 pr-4 text-left">Route</th>
                            <th className="py-1 pr-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedQuotes.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="text-center text-gray-400 py-4"
                              >
                                Không có DEX nào hỗ trợ swap cặp token này hoặc
                                pool không tồn tại trên smart contract.
                              </td>
                            </tr>
                          ) : (
                            sortedQuotes.map((q, idx) => {
                              const hasUnstable = q.dex === "Liquidswap";
                              const isBest = idx === 0;
                              const dexColWidth =
                                hasUnstable && isBest ? "w-64" : "w-48";
                              return (
                                <tr
                                  key={q.dex + q.outputAmount}
                                  className={
                                    idx === 0 ? "bg-yellow-900/20" : ""
                                  }
                                >
                                  <td
                                    className={`py-1 pr-4 font-semibold text-white text-left flex flex-row items-center ${dexColWidth}`}
                                  >
                                    <span>{getDexName(q)}</span>
                                    {hasUnstable && (
                                      <span className="ml-2 px-2 py-0.5 rounded bg-red-600 text-white text-xs font-bold align-middle whitespace-nowrap">
                                        Unstable Pool
                                      </span>
                                    )}
                                    {isBest && (
                                      <span className="ml-2 text-yellow-400 font-bold">
                                        Best
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1 pr-4 text-white text-right">
                                    {/* Tính lại Output: trừ thêm Agg Fee 0.3% */}
                                    {(() => {
                                      const amountA = parseFloat(fromAmount);
                                      const dexFee = q.fee
                                        ? parseFloat(q.fee) / 100
                                        : 0;
                                      const priceImpact = q.priceImpact
                                        ? parseFloat(q.priceImpact) / 100
                                        : 0;
                                      const aggFee = 0.003; // 0.3%
                                      const slippagePct = slippage / 100;
                                      if (!isNaN(amountA) && amountA > 0) {
                                        let P = 1;
                                        if (
                                          realPrice &&
                                          !isNaN(
                                            parseFloat(
                                              realPrice.replace("$", "")
                                            )
                                          )
                                        ) {
                                          P = parseFloat(
                                            realPrice.replace("$", "")
                                          );
                                        } else if (marketData) {
                                          const pair = `${fromToken.symbol}/${toToken.symbol}`;
                                          const found = marketData.find(
                                            (row) => row.pair === pair
                                          );
                                          if (found && found.price) {
                                            P = parseFloat(
                                              found.price.replace("$", "")
                                            );
                                          }
                                        }
                                        const amountB =
                                          amountA *
                                          P *
                                          (1 - dexFee) *
                                          (1 - aggFee) *
                                          (1 - priceImpact) *
                                          (1 - slippagePct);
                                        return amountB.toFixed(6);
                                      }
                                      // Nếu không có fromAmount, fallback về outputAmount đã trừ aggFee
                                      return (
                                        Number(q.outputAmount) *
                                        (1 - aggFee)
                                      ).toFixed(6);
                                    })()}
                                  </td>
                                  <td className="py-1 pr-4 text-white text-right">
                                    {q.fee}
                                  </td>
                                  <td className="py-1 pr-4 text-white text-right">
                                    0.30
                                  </td>
                                  <td className="py-1 pr-4 text-white text-right">
                                    {q.priceImpact}
                                  </td>
                                  <td className="py-1 pr-4 text-white text-left">
                                    {Array.isArray(q.route)
                                      ? q.route.join(" → ")
                                      : q.dex}
                                  </td>
                                  <td className="py-1 pr-4 text-center">
                                    <button
                                      onClick={() => executeSwapOnDex(q)}
                                      disabled={
                                        !connected ||
                                        !fromAmount ||
                                        Number.parseFloat(fromAmount) <= 0 ||
                                        isSwapping ||
                                        Number.parseFloat(q.outputAmount) <=
                                          0 ||
                                        Number(fromBalance) <
                                          Number(fromAmount) ||
                                        (swapMode === "cross-address" &&
                                          !CROSS_ADDRESS_SUPPORTED_DEXS.includes(
                                            q.dex
                                          ))
                                      }
                                      className={`px-2 py-1 text-xs rounded font-semibold ${
                                        swapMode === "cross-address" &&
                                        !CROSS_ADDRESS_SUPPORTED_DEXS.includes(
                                          q.dex
                                        )
                                          ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-60"
                                          : "bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                      }`}
                                      title={
                                        swapMode === "cross-address" &&
                                        !CROSS_ADDRESS_SUPPORTED_DEXS.includes(
                                          q.dex
                                        )
                                          ? `Cross-Address Swap not supported for ${getDexName(
                                              q
                                            )}`
                                          : `Swap on ${getDexName(q)}`
                                      }
                                    >
                                      {isSwapping
                                        ? "Swapping..."
                                        : q.dex === "SushiSwap"
                                        ? "Cross-chain Swap"
                                        : "Swap"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {/* Swap Button */}
              <Button
                onClick={() => {
                  if (bestQuote) {
                    executeSwapOnDex(bestQuote);
                  }
                }}
                disabled={
                  !connected ||
                  !fromAmount ||
                  Number.parseFloat(fromAmount) <= 0 ||
                  isSwapping ||
                  (swapMode === "cross-address" &&
                    (!receiverAddress ||
                      receiverAddress === RECEIVER_ADDRESS ||
                      receiverAddress.trim() === "")) ||
                  !bestQuote ||
                  Number.parseFloat(bestQuote.outputAmount) <= 0 ||
                  Number(fromBalance) < Number(fromAmount)
                }
                className="swap-execute-button w-full font-bold py-4 rounded-xl text-lg mt-6"
              >
                {isSwapping ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    {swapMode === "cross-address"
                      ? "Cross-Address Swapping..."
                      : "Swapping..."}
                  </div>
                ) : !connected ? (
                  "Connect Aptos Wallet"
                ) : !fromAmount || Number.parseFloat(fromAmount) <= 0 ? (
                  "Enter Amount"
                ) : swapMode === "cross-address" &&
                  (!receiverAddress ||
                    receiverAddress === RECEIVER_ADDRESS ||
                    receiverAddress.trim() === "") ? (
                  "Add Receiver Address"
                ) : swapMode === "cross-address" ? (
                  `Swap ${fromToken.symbol} → ${toToken.symbol} (Cross-Address)`
                ) : (
                  `Swap ${fromToken.symbol} for ${toToken.symbol}`
                )}
              </Button>
              {/* Cross-Address Info */}
              {swapMode === "cross-address" && connected && fromAmount && (
                <div className="cross-address-info mt-3 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">
                      Cross-Address Swap
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>
                      From:{" "}
                      {address
                        ? `${address.slice(0, 10)}...${address.slice(-6)}`
                        : "Add You Wallet First"}
                    </div>
                    <div>
                      To:{" "}
                      {receiverAddress === RECEIVER_ADDRESS
                        ? "Add Receiver Address First"
                        : receiverAddress
                        ? `${receiverAddress.slice(
                            0,
                            10
                          )}...${receiverAddress.slice(-6)}`
                        : "Add Receiver Address First"}
                    </div>
                    <div>Using: Dexonic DEX Aggregator</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Right Sidebar - Market Info */}
        <div className="hidden xl:block w-80">
          {/* Market Overview */}
          <Card className="swap-card">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3">Market Overview</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-gray-400 font-normal">
                      Pair
                    </th>
                    <th className="text-right text-gray-400 font-normal">
                      Price
                    </th>
                    <th className="text-right text-gray-400 font-normal">
                      24h Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marketData.map((row) => (
                    <tr
                      key={row.pair}
                      className="border-b border-gray-800 last:border-0"
                    >
                      <td className="py-2 text-white">{row.pair}</td>
                      <td className="py-2 text-right text-white">
                        {/* Nếu là WETH/APT hoặc WBTC/APT thì không có dấu $ phía trước */}
                        {(() => {
                          const noDollarPairs = ["WETH/APT", "WBTC/APT"];
                          let price = row.price;
                          if (
                            typeof price === "string" &&
                            price.startsWith("$")
                          )
                            price = price.slice(1);
                          const num = Number(price.replace(/,/g, ""));
                          if (noDollarPairs.includes(row.pair)) {
                            return isNaN(num)
                              ? row.price
                              : num.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                });
                          }
                          return isNaN(num) ? row.price : formatUSD(num);
                        })()}
                      </td>
                      <td
                        className={`py-2 text-right font-semibold ${
                          row.positive ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card className="swap-card mt-6">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3">Platform Stats</h3>
              <div className="space-y-3">
                <div className="platform-stat flex justify-between">
                  <span className="text-gray-400 text-sm">24h Volume</span>
                  <span className="text-white font-medium">$2,068</span>
                </div>
                <div className="platform-stat flex justify-between">
                  <span className="text-gray-400 text-sm">Total Liquidity</span>
                  <span className="text-white font-medium">$30,868</span>
                </div>
                <div className="platform-stat flex justify-between">
                  <span className="text-gray-400 text-sm">Active Pairs</span>
                  <span className="text-white font-medium">68</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Chat Button - Only visible when user is logged in */}
      <ChatButton user={user} />
      {swapSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Card className="max-w-md w-full shadow-2xl animate-fade-in">
            <CardHeader>
              <CardTitle>Swap thành công trên {swapSuccessInfo.dex}!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Txn:</span>{" "}
                  <a
                    href={`https://explorer.aptoslabs.com/txn/${swapSuccessInfo.hash}`}
                    target="_blank"
                    className="underline"
                  >
                    {swapSuccessInfo.hash.slice(0, 8)}...
                    {swapSuccessInfo.hash.slice(-6)}
                  </a>
                </div>
                <div>
                  <span className="font-semibold">Phí:</span>{" "}
                  {swapSuccessInfo.gasUsed} APT
                </div>
                <div>
                  <span className="font-semibold">Swap:</span>{" "}
                  {swapSuccessInfo.fromAmount} {swapSuccessInfo.fromSymbol}
                </div>
                <div>
                  <span className="font-semibold">Nhận:</span>{" "}
                  {swapSuccessInfo.toAmount} {swapSuccessInfo.toSymbol}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setSwapSuccessInfo(null)}
              >
                Đóng
              </button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
