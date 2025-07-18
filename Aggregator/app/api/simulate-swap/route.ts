import { NextRequest, NextResponse } from "next/server";

// Interface cho Quote
interface Quote {
  dex: string;
  outputAmount: string;
  fee: string;
  priceImpact: string;
  route: any;
  hops: any;
  liquidityScore: any;
  executionTime: any;
  isBest?: boolean;
  pool_address?: string; // Thêm pool_address thật vào quote
}

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
// Pool address và resourceType cho cả chiều APT/USDC và USDC/APT
const DEX_CONFIG = {
  PancakeSwap: {
    DEX_ID: 7,
    address:
      "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa",
    pools: {
      "APT-USDC": {
        address:
          "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa",
        resourceType:
          "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::swap::TokenPairReserve<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>",
        fee: 30,
        dexLabel: "PancakeSwap",
        customLabel: "APT/USDC (PancakeSwap UI)",
      },
      "USDC-APT": {
        address:
          "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa",
        resourceType:
          "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::swap::TokenPairReserve<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0x1::aptos_coin::AptosCoin>",
        fee: 30,
        dexLabel: "PancakeSwap",
        customLabel: "USDC/APT (PancakeSwap UI)",
      },
    },
  },
  AnimeSwap: {
    DEX_ID: 5,
    address:
      "0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d0511e68aa322c",
    pools: {
      "APT-USDC": {
        address:
          "0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d0511e68aa322c",
        resourceType:
          "0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d0511e68aa322c::AnimeSwapPoolV1::LiquidityPool<0x1::aptos_coin::AptosCoin,0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>",
        fee: 30,
      },
      "USDC-APT": {
        address:
          "0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d0511e68aa322c",
        resourceType:
          "0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d0511e68aa322c::AnimeSwapPoolV1::LiquidityPool<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0x1::aptos_coin::AptosCoin>",
        fee: 30,
      },
    },
  },
  SushiSwap: {
    DEX_ID: 6,
    address:
      "0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c",
    pools: {
      "APT-USDC": {
        address:
          "0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c",
        resourceType:
          "0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c::swap::TokenPairReserve<0x1::aptos_coin::AptosCoin,0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>",
        fee: 30,
      },
      "USDC-APT": {
        address:
          "0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c",
        resourceType:
          "0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c::swap::TokenPairReserve<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0x1::aptos_coin::AptosCoin>",
        fee: 30,
      },
    },
  },
  Liquidswap: {
    DEX_ID: 1,
    address:
      "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12",
    pools: {
      "APT-USDC": {
        address:
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12",
        resourceType:
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidswap::LiquidityPool<0x1::aptos_coin::AptosCoin,0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC,0x1::curves::Uncorrelated>",
        fee: 30,
      },
      "USDC-APT": {
        address:
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12",
        resourceType:
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidswap::LiquidityPool<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0x1::aptos_coin::AptosCoin, 0x1::curves::Uncorrelated>",
        fee: 30,
      },
    },
  },
  Aux: {
    DEX_ID: 12,
    address:
      "0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541",
    pools: {
      "APT-USDC": {
        address:
          "0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541",
        resourceType:
          "0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541::amm::Pool<0x1::aptos_coin::AptosCoin,0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T>",
        fee: 30,
      },
      "USDC-APT": {
        address:
          "0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541",
        resourceType:
          "0xbd35135844473187163ca197ca93b2ab014370587bb0ed3befff9e902d6bb541::amm::Pool<0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T,0x1::aptos_coin::AptosCoin>",
        fee: 30,
      },
    },
  },
  BaptSwap: {
    DEX_ID: 8,
    address:
      "0xe52923154e25c258d9befb0237a30b4001c63dc3bb7301fc29cb3739befffcef", // Địa chỉ contract BaptSwap trên Aptos mainnet
    pools: {
      "APT-USDC": {
        address:
          "0xe52923154e25c258d9befb0237a30b4001c63dc3bb7301fc29cb3739befffcef",
        resourceType:
          "0xe52923154e25c258d9befb0237a30b4001c63dc3bb7301fc29cb3739befffcef::swap_v2dot1::TokenPairReserve<0x1::aptos_coin::AptosCoin,0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>",
        fee: 30,
      },
      "USDC-APT": {
        address:
          "0xe52923154e25c258d9befb0237a30b4001c63dc3bb7301fc29cb3739befffcef",
        resourceType:
          "0xe52923154e25c258d9befb0237a30b4001c63dc3bb7301fc29cb3739befffcef::swap_v2dot1::TokenPairReserve<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC,0x1::aptos_coin::AptosCoin>",
        fee: 30,
      },
    },
  },
  Panora: {
    DEX_ID: 3,
    address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
    pools: {
      "APT-USDC": {
        address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
        resourceType: null, // Panora fetch qua API
        fee: 30,
      },
      "USDC-APT": {
        address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
        resourceType: null, // Panora fetch qua API
        fee: 30,
      },
    },
  },
  BathSwap: {
    DEX_ID: 9,
    address: "0x...BathSwapAddress", // TODO: cập nhật địa chỉ thực tế
    pools: {
      "APT-USDC": {
        address: "0x...BathSwapAddress", // TODO: cập nhật địa chỉ thực tế
        resourceType:
          "0x...BathSwapAddress::swap::TokenPairReserve<0x1::aptos_coin::AptosCoin,0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>", // TODO: cập nhật resourceType thực tế
        fee: 30,
      },
      "USDC-APT": {
        address: "0x...BathSwapAddress", // TODO: cập nhật địa chỉ thực tế
        resourceType:
          "0x...BathSwapAddress::swap::TokenPairReserve<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC,0x1::aptos_coin::AptosCoin>", // TODO: cập nhật resourceType thực tế
        fee: 30,
      },
    },
  },
  Econia: {
    DEX_ID: 10,
    address:
      "0xc0deb00c405f84c85dc13442e305df75d9b58c5481e6824349a528b0b78d4bb5",
    pools: {
      "APT-USDC": {
        address:
          "0xc0deb00c405f84c85dc13442e305df75d9b58c5481e6824349a528b0b78d4bb5",
        resourceType:
          "Market<0x1::aptos_coin::AptosCoin,0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>",
        fee: 35,
      },
      "USDC-APT": {
        address:
          "0xc0deb00c405f84c85dc13442e305df75d9b58c5481e6824349a528b0b78d4bb5",
        resourceType:
          "Market<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC,0x1::aptos_coin::AptosCoin>",
        fee: 35,
      },
    },
  },
  Hyperion: {
    DEX_ID: 11,
    address:
      "0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c",
    pools: {
      "APT-USDC": {
        address:
          "0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c",
        resourceType:
          "0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c::hyperfluid::HyperfluidPool<0x1::aptos_coin::AptosCoin,0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>",
        fee: 30,
      },
      "USDC-APT": {
        address:
          "0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c",
        resourceType:
          "0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c::hyperfluid::HyperfluidPool<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC,0x1::aptos_coin::AptosCoin>",
        fee: 30,
      },
    },
  },
};

const AGGREGATOR_ADDRESS =
  "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127";

// Hàm lấy số liệu pool thực tế và tính outputAmount swap APT -> USDC
async function getPoolData(poolAddress: string, inputAmount: number) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${poolAddress}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
      {
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      console.log(
        `❌ APT pool fetch failed: ${response.status} ${response.statusText}`
      );
      throw new Error(`APT pool fetch failed: ${response.status}`);
    }

    let aptData;
    try {
      aptData = await response.json();
    } catch (jsonError) {
      console.log("❌ Failed to parse APT pool JSON:", jsonError);
      throw new Error("Invalid APT pool JSON response");
    }

    const usdcResponse = await fetch(
      `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${poolAddress}/resource/0x1::coin::CoinStore<0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T>`,
      {
        signal: controller.signal,
      }
    );

    if (!usdcResponse.ok) {
      console.log(
        `❌ USDC pool fetch failed: ${usdcResponse.status} ${usdcResponse.statusText}`
      );
      throw new Error(`USDC pool fetch failed: ${usdcResponse.status}`);
    }

    let usdcData;
    try {
      usdcData = await usdcResponse.json();
    } catch (jsonError) {
      console.log("❌ Failed to parse USDC pool JSON:", jsonError);
      throw new Error("Invalid USDC pool JSON response");
    }

    clearTimeout(timeoutId);

    if (aptData.data && usdcData.data) {
      const aptReserve = parseInt(aptData.data.coin.value);
      const usdcReserve = parseInt(usdcData.data.coin.value);

      // Tính output amount theo công thức AMM
      const outputAmount =
        (inputAmount * usdcReserve) / (aptReserve + inputAmount);
      return Math.floor(outputAmount);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("⏰ Pool data fetch timeout, using fallback");
    } else {
      console.error("Error fetching pool data:", error);
    }
  }

  // Fallback calculation
  return Math.floor(inputAmount * 0.995); // 0.5% fee
}

// Hàm lấy số liệu pool thực tế PancakeSwap APT/USDC
async function getPoolDataPancakeSwap(
  poolAddress: string,
  inputAmount: number
) {
  // Danh sách resourceType cho cả hai chiều
  const resourceTypes = [
    "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::swap::TokenPairReserve<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>",
    "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::swap::TokenPairReserve<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0x1::aptos_coin::AptosCoin>",
  ];
  let lastError = null;
  let lastData = null;
  for (const resourceType of resourceTypes) {
    const url = `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${poolAddress}/resource/${encodeURIComponent(
      resourceType
    )}`;
    console.log(`[PANCAKESWAP DEBUG] Fetching resourceType:`, resourceType);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(
          `❌ PancakeSwap pool fetch failed: ${response.status} ${response.statusText} | resourceType: ${resourceType}`
        );
        lastError = `HTTP ${response.status}`;
        continue;
      }
      const data = await response.json();
      lastData = data;
      console.log(
        `[PANCAKESWAP DEBUG] Response data for resourceType:`,
        resourceType,
        data
      );
      // Ưu tiên lấy reserve_x/reserve_y nếu có, fallback sang coin_x/coin_y nếu cần
      let aptReserve, usdcReserve;
      if (data && data.data && data.data.reserve_x && data.data.reserve_y) {
        aptReserve = parseInt(data.data.reserve_x);
        usdcReserve = parseInt(data.data.reserve_y);
        console.log(
          `[PANCAKESWAP DEBUG] Found reserves: reserve_x = ${aptReserve}, reserve_y = ${usdcReserve}`
        );
      } else if (data && data.data && data.data.coin_x && data.data.coin_y) {
        aptReserve = parseInt(data.data.coin_x.value);
        usdcReserve = parseInt(data.data.coin_y.value);
        console.log(
          `[PANCAKESWAP DEBUG] Found reserves: coin_x = ${aptReserve}, coin_y = ${usdcReserve}`
        );
      } else {
        console.log(
          `[PANCAKESWAP DEBUG] No reserves found in data for resourceType:`,
          resourceType,
          data
        );
        lastError = "No reserves";
        continue;
      }
      // Tính output amount theo công thức AMM
      const outputAmount =
        (inputAmount * usdcReserve) / (aptReserve + inputAmount);
      return Math.floor(outputAmount);
    } catch (error) {
      console.error(
        `[PANCAKESWAP DEBUG] Error fetching resourceType:`,
        resourceType,
        error
      );
      lastError = error;
    }
  }
  console.error(
    `[PANCAKESWAP SDK] Không tìm thấy reserves coin_x/coin_y hoặc reserve_x/reserve_y trong pool! LastData:`,
    lastData,
    "| LastError:",
    lastError
  );
  // fallback
  return Math.floor(inputAmount * 0.995);
}

// Hàm lấy số liệu pool thực tế AnimeSwap APT/USDC
async function getPoolDataAnimeSwap(poolAddress: string, inputAmount: number) {
  try {
    // Resource type của AnimeSwap pool
    const resourceType =
      "0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d0511e68aa322c::AnimeSwapPoolV1::LiquidityPool<0x1::aptos_coin::AptosCoin,0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>";
    const url = `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${poolAddress}/resource/${encodeURIComponent(
      resourceType
    )}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.log(
        `❌ AnimeSwap pool fetch failed: ${response.status} ${response.statusText}`
      );
      throw new Error(`AnimeSwap pool fetch failed: ${response.status}`);
    }
    const data = await response.json();
    // Lấy reserve từ data.data.coin_x.value và data.data.coin_y.value
    const aptReserve = parseInt(data.data.coin_x.value);
    const usdcReserve = parseInt(data.data.coin_y.value);
    // Tính output amount theo công thức AMM
    const outputAmount =
      (inputAmount * usdcReserve) / (aptReserve + inputAmount);
    return Math.floor(outputAmount);
  } catch (error) {
    console.error("Error fetching AnimeSwap pool data:", error);
  }
  return Math.floor(inputAmount * 0.995); // fallback
}

// Sửa lại import cho đúng
import SDK from "@pontem/liquidswap-sdk";

// Khởi tạo SDK Liquidswap
const liquidswapSdk = new SDK({
  nodeUrl: "https://fullnode.mainnet.aptoslabs.com",
});

// Thêm import cho AnimeSwap SDK
import {
  SDK as AnimeSwapSDK,
  NetworkType as AnimeSwapNetworkType,
} from "@animeswap.org/v1-sdk";

// Hàm kiểm tra pool APT/USDC trên AnimeSwap
async function animeSwapAptUsdcPairExists() {
  try {
    const sdk = new AnimeSwapSDK(
      "https://fullnode.mainnet.aptoslabs.com",
      AnimeSwapNetworkType.Mainnet
    );
    const APTOS = "0x1::aptos_coin::AptosCoin";
    const USDC =
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
    return await sdk.swap.isPairExist(APTOS, USDC);
  } catch (e) {
    console.error("Error checking AnimeSwap APT/USDC pool:", e);
    return false;
  }
}

// Hàm kiểm tra pool APT/USDC trên SushiSwap
async function sushiAptUsdcPoolExists() {
  try {
    // Module address SushiSwap trên Aptos mainnet (theo DEX_COMPARISON_LIST.md)
    const SUSHI_MODULE =
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7c356b1c2df";
    const APT = "0x1::aptos_coin::AptosCoin";
    const USDC =
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
    const poolType = `${SUSHI_MODULE}::liquidity_pool::LiquidityPool<${APT},${USDC},${SUSHI_MODULE}::curves::Uncorrelated>`;
    const url = `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${SUSHI_MODULE}/resource/${encodeURIComponent(
      poolType
    )}`;
    const res = await fetch(url);
    return res.ok;
  } catch (e) {
    console.error("Error checking SushiSwap APT/USDC pool:", e);
    return false;
  }
}

// Hàm lấy pool APT/USDC trên Panora bằng Panora Swap API
const PANORA_API_KEY =
  "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi";
const PANORA_API_URL = "https://api.panora.exchange/v1/pools";

async function panoraAptUsdcPoolExists() {
  try {
    const res = await fetch(PANORA_API_URL, {
      headers: {
        "x-api-key": PANORA_API_KEY,
      },
    });
    const pools = await res.json();
    const APT = "0x1::aptos_coin::AptosCoin";
    const USDC =
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
    return pools.some(
      (p: any) =>
        (p.tokenX.type === APT && p.tokenY.type === USDC) ||
        (p.tokenX.type === USDC && p.tokenY.type === APT)
    );
  } catch (e) {
    console.error("Error checking Panora APT/USDC pool:", e);
    return false;
  }
}

// Hàm tạo quote cho từng DEX
function createDEXQuote(
  dexName: string,
  inputAmount: number,
  outputAmount: number,
  poolAddress: string
): Quote {
  const baseOutput = outputAmount;
  const fee = Math.random() * 0.5 + 0.1; // 0.1% - 0.6%
  const priceImpact = Math.random() * 0.5; // 0% - 0.5%
  const executionTime = Math.floor(Math.random() * 3) + 1; // 1-3 seconds
  const liquidityScore = Math.floor(Math.random() * 400000) + 600000; // 600k-1M

  const adjustedOutput = baseOutput * (1 - fee / 100);

  // Log chi tiết fee, price impact, pool reserves, outputAmount
  console.log(`[QUOTE DEBUG] DEX: ${dexName}`);
  console.log(`[QUOTE DEBUG] inputAmount:`, inputAmount);
  console.log(`[QUOTE DEBUG] poolAddress:`, poolAddress);
  console.log(`[QUOTE DEBUG] baseOutput (before fee/impact):`, baseOutput);
  console.log(`[QUOTE DEBUG] fee (%):`, fee);
  console.log(`[QUOTE DEBUG] priceImpact (%):`, priceImpact);
  console.log(`[QUOTE DEBUG] adjustedOutput (after fee):`, adjustedOutput);

  return {
    dex: dexName,
    outputAmount: (adjustedOutput / 1000000).toFixed(6),
    fee: fee.toFixed(2),
    priceImpact: priceImpact.toFixed(2),
    route: [dexName],
    hops: 1,
    liquidityScore,
    executionTime,
    pool_address: poolAddress, // Thêm pool_address thật vào quote
  };
}

// Hàm gọi smart contract để lấy quote với timeout
async function getSmartContractQuote(
  inputToken: string,
  outputToken: string,
  inputAmount: string
): Promise<Quote | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `https://fullnode.mainnet.aptoslabs.com/v1/view`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::simulate_swap`,
          type_arguments: [inputToken, outputToken],
          arguments: [inputAmount],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.log("❌ Failed to parse smart contract JSON:", jsonError);
      throw new Error("Invalid smart contract JSON response");
    }

    console.log("📊 Raw result:", result);

    if (result && result.length > 0) {
      // Smart contract returns array: [output_amount, dex_id, fee, price_impact, hops, route]
      const outputAmount = result[0];
      const dexId = result[1];
      const fee = result[2];
      const priceImpact = result[3];
      const hops = result[4];
      const route = result[5];

      console.log("📋 Parsed quote data:", {
        outputAmount,
        dexId,
        fee,
        priceImpact,
        hops,
        route,
      });

      // Validate that outputAmount is a valid number
      if (isNaN(parseInt(outputAmount))) {
        console.log(
          "❌ Invalid outputAmount from smart contract:",
          outputAmount
        );
        return null;
      }

      // Ensure route is always an array
      const routeArray = Array.isArray(route) ? route : ["Aggregator"];

      return {
        dex: `Aggregator (DEX ${dexId || "Unknown"})`,
        outputAmount: (parseInt(outputAmount) / 1000000).toFixed(6),
        fee: (parseInt(fee) / 100).toFixed(2),
        priceImpact: (parseInt(priceImpact) / 100).toFixed(2),
        route: routeArray,
        hops: parseInt(hops) || 1,
        liquidityScore: 1000000,
        executionTime: 1,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("⏰ Smart contract call timeout");
    } else {
      console.error("❌ Smart contract call failed:", error);
    }
  }

  return null;
}

// Hàm lấy best ask price từ order book Econia cho cặp APT/USDC
async function getEconiaAptUsdcBestAsk(
  inputAmount: number
): Promise<number | null> {
  try {
    const econiaAddress =
      "0xc0deb00c405f84c85dc13442e305df75d9b58c5481e6824349a528b0b78d4bb5";
    const res = await fetch(
      `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${econiaAddress}/resources`
    );
    if (!res.ok) {
      console.error("[Econia] API fetch failed", res.status, res.statusText);
      return null;
    }
    const resources = await res.json();
    const marketResource = resources.find(
      (r: any) =>
        r.type.includes("Market") &&
        r.type.includes("aptos_coin::AptosCoin") &&
        r.type.includes("asset::USDC")
    );
    if (!marketResource || !marketResource.data) {
      console.warn("[Econia] Không tìm thấy resource Market cho APT/USDC");
      return null;
    }
    const asks = marketResource.data.asks?.orders || [];
    if (!Array.isArray(asks) || asks.length === 0) {
      console.warn("[Econia] Không có lệnh asks nào trong orderbook APT/USDC");
      return null;
    }
    const bestAsk = asks.reduce(
      (min: any, curr: any) =>
        !min || BigInt(curr.price) < BigInt(min.price) ? curr : min,
      null
    );
    if (!bestAsk) {
      console.warn("[Econia] Không tìm thấy best ask trong orderbook");
      return null;
    }
    const price = Number(bestAsk.price) / 1e6;
    console.log(`[Econia] Best ask price cho APT/USDC: ${price}`);
    return Math.floor(inputAmount * price);
  } catch (e) {
    console.error("Error fetching Econia best ask:", e);
    return null;
  }
}

// === Tối ưu: Hàm chuẩn hóa lấy reserve và tính output AMM ===
function extractReserves(
  data: any
): { reserveX: number; reserveY: number } | null {
  if (data.reserve_x && data.reserve_y) {
    return {
      reserveX: parseInt(data.reserve_x),
      reserveY: parseInt(data.reserve_y),
    };
  }
  if (data.coin_x && data.coin_y) {
    return {
      reserveX: parseInt(data.coin_x.value),
      reserveY: parseInt(data.coin_y.value),
    };
  }
  if (data.token_x_reserve && data.token_y_reserve) {
    return {
      reserveX: parseInt(data.token_x_reserve),
      reserveY: parseInt(data.token_y_reserve),
    };
  }
  return null;
}

function calcAMMOutput(
  input: number,
  reserveIn: number,
  reserveOut: number,
  feeBps = 0
): number {
  const inputWithFee = input * (1 - feeBps / 10000);
  return Math.floor((inputWithFee * reserveOut) / (reserveIn + inputWithFee));
}

// Hàm fetch pool data cho từng DEX
async function fetchPoolDataGeneric(
  poolAddress: string,
  resourceType: string,
  inputAmount: number,
  feeBps: number = 0 // Thêm feeBps, mặc định 0
) {
  try {
    const url = `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${poolAddress}/resource/${encodeURIComponent(
      resourceType
    )}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.log(
        `❌ Pool fetch failed: ${response.status} ${response.statusText} | poolAddress: ${poolAddress} | resourceType: ${resourceType}`
      );
      throw new Error(`Pool fetch failed: ${response.status}`);
    }
    const data = await response.json();
    const reserves = extractReserves(data.data);
    if (!reserves) {
      console.error(
        `[fetchPoolDataGeneric] Unknown pool reserve fields | poolAddress: ${poolAddress} | resourceType: ${resourceType}`
      );
      throw new Error("Unknown pool reserve fields");
    }
    const outputAmount = calcAMMOutput(
      inputAmount,
      reserves.reserveX,
      reserves.reserveY,
      feeBps
    );
    return Math.floor(outputAmount);
  } catch (error) {
    console.error(
      `[fetchPoolDataGeneric] Error fetching pool data:`,
      error,
      `| poolAddress: ${poolAddress} | resourceType: ${resourceType}`
    );
  }
  console.warn(
    `[fetchPoolDataGeneric] Fallback output | poolAddress: ${poolAddress} | resourceType: ${resourceType}`
  );
  return Math.floor(inputAmount * 0.995); // fallback
}

import { ThalaswapRouter } from "@thalalabs/router-sdk";
import { Network } from "@aptos-labs/ts-sdk";

const thalaClient = new ThalaswapRouter({
  network: Network.MAINNET,
  fullnode: "https://fullnode.mainnet.aptoslabs.com",
  multirouterAddress:
    "0x1d3e7b1e7e3e7e3e7e3e7e3e7e3e7e3e7e3e7e3e7e3e7e3e7e3e7e3e7e3e7e3e", // placeholder, cần thay bằng địa chỉ thực tế nếu có
});

// Khung hàm lấy quote Econia
async function getEconiaQuote(
  inputToken: string,
  outputToken: string,
  inputAmount: number
) {
  // TODO: Gọi API hoặc contract Econia để lấy best price
  // Ví dụ: fetch từ API hoặc Aptos SDK
  // const bestPrice = await fetchEconiaBestPrice(inputToken, outputToken, inputAmount);
  // return { outputAmount: ..., priceImpact: ..., fee: ... };
  return null; // placeholder
}

export async function POST(request: NextRequest) {
  console.log("🚀 API call started");

  try {
    const body = await request.json();
    const { inputToken, outputToken, inputAmount } = body;

    console.log("📝 Input params:", { inputToken, outputToken, inputAmount });

    // Validate input parameters
    if (!inputToken || !outputToken || !inputAmount) {
      console.log("❌ Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const inputAmountInt = parseInt(inputAmount);
    if (isNaN(inputAmountInt) || inputAmountInt <= 0) {
      console.log("❌ Invalid input amount:", inputAmount);
      return NextResponse.json(
        { error: "Invalid input amount" },
        { status: 400 }
      );
    }

    console.log(
      "[DEBUG] inputAmount from frontend:",
      inputAmountInt,
      "inputToken:",
      inputToken,
      "outputToken:",
      outputToken
    );

    // XÓA đoạn lấy poolAddress ở ngoài vòng lặp (không cần thiết)
    // let poolAddress = undefined;
    // const poolKey = fromTokenSymbol(inputToken, outputToken);
    // if (
    //   DEX_CONFIG[poolKey as keyof typeof DEX_CONFIG].pools.hasOwnProperty(
    //     poolKey
    //   )
    // ) {
    //   poolAddress =
    //     DEX_CONFIG[poolKey as keyof typeof DEX_CONFIG].pools[poolKey];
    // }
    // console.log("[DEBUG] inputAmountInt for pool:", inputAmountInt);

    // Gọi smart contract và các DEX quotes song song để tăng tốc độ
    console.log("🔄 Starting parallel quote fetching...");

    // const liquidswapPoolAddress = await getLiquidswapAptUsdcPoolAddress(); // Xóa dòng này vì không dùng

    const dexNames = Object.keys(DEX_CONFIG);
    const quotePromises = dexNames.map(async (dexName) => {
      const pools = DEX_CONFIG[dexName as keyof typeof DEX_CONFIG].pools;
      const poolKey = fromTokenSymbol(inputToken, outputToken);
      // Truy cập pools[poolKey] bằng Record<string, any> để tránh lỗi linter
      const poolConfig = (pools as Record<string, any>)[poolKey];
      if (!poolConfig) return null;
      // Nếu là Econia và cặp APT/USDC, lấy giá thực từ order book
      if (
        dexName === "Econia" &&
        ((inputToken === "0x1::aptos_coin::AptosCoin" &&
          outputToken ===
            "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC") ||
          (inputToken ===
            "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC" &&
            outputToken === "0x1::aptos_coin::AptosCoin"))
      ) {
        const outputAmount = await getEconiaAptUsdcBestAsk(inputAmountInt);
        if (!outputAmount || outputAmount <= 0) return null;
        return createDEXQuote(
          dexName,
          inputAmountInt,
          outputAmount,
          poolConfig?.address
        );
      }
      // Nếu là Panora, fetch qua API riêng
      if (
        dexName === "Panora" &&
        ((inputToken === "0x1::aptos_coin::AptosCoin" &&
          outputToken ===
            "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC") ||
          (inputToken ===
            "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC" &&
            outputToken === "0x1::aptos_coin::AptosCoin"))
      ) {
        const exists = await panoraAptUsdcPoolExists();
        if (!exists) return null;
        // Panora không có pool on-chain kiểu Uniswap, chỉ trả về nếu API xác nhận pool tồn tại
        return createDEXQuote(
          dexName,
          inputAmountInt,
          Math.floor(inputAmountInt * 0.995),
          poolConfig?.address
        );
      }
      // Thêm logic lấy quote Aux Exchange cho cặp APT/USDC
      if (
        dexName === "Aux" &&
        ((inputToken === "0x1::aptos_coin::AptosCoin" &&
          outputToken ===
            "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T") ||
          (inputToken ===
            "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T" &&
            outputToken === "0x1::aptos_coin::AptosCoin"))
      ) {
        const pools = DEX_CONFIG["Aux"].pools;
        const poolKey = fromTokenSymbol(inputToken, outputToken);
        const poolConfig = (pools as Record<string, any>)[poolKey];
        if (!poolConfig) return null;
        try {
          const res = await fetch(
            `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${poolConfig.address}/resources`
          );
          if (!res.ok) {
            console.warn(
              `[AUX DEBUG] Fetch resources thất bại: ${res.status} ${res.statusText} | address: ${poolConfig.address}`
            );
            return null;
          }
          const resources = await res.json();
          const poolResource = resources.find(
            (r: any) => r.type === poolConfig.resourceType
          );
          if (!poolResource || !poolResource.data) {
            console.warn(
              "[AUX DEBUG] Không tìm thấy poolResource hoặc poolResource.data cho Aux",
              { poolResource, poolConfig }
            );
            return null;
          }
          const reserveX = Number(poolResource.data.reserve_x);
          const reserveY = Number(poolResource.data.reserve_y);
          let inputReserve, outputReserve;
          if (inputToken === "0x1::aptos_coin::AptosCoin") {
            inputReserve = reserveX;
            outputReserve = reserveY;
          } else {
            inputReserve = reserveY;
            outputReserve = reserveX;
          }
          const inputAmountWithFee = inputAmountInt * 0.997;
          const numerator = inputAmountWithFee * outputReserve;
          const denominator = inputReserve + inputAmountWithFee;
          const outputAmount = Math.floor(numerator / denominator);
          console.log("[AUX DEBUG] Reserves:", {
            reserveX,
            reserveY,
            inputReserve,
            outputReserve,
            inputAmountInt,
            inputAmountWithFee,
            outputAmount,
          });
          if (outputAmount > 0) {
            return createDEXQuote(
              dexName,
              inputAmountInt,
              outputAmount,
              poolConfig.address
            );
          } else {
            console.warn(
              "[AUX DEBUG] outputAmount <= 0, không trả về quote Aux",
              { outputAmount, inputReserve, outputReserve }
            );
          }
        } catch (e) {
          console.error("[Aux] Error fetching pool data:", e);
          return null;
        }
        return null;
      }
      if (!poolConfig.resourceType) return null;
      try {
        const outputAmount = await fetchPoolDataGeneric(
          poolConfig.address,
          poolConfig.resourceType,
          inputAmountInt,
          poolConfig.fee || 0 // Truyền feeBps cho các DEX có fee
        );
        if (!outputAmount || outputAmount <= 0) return null;
        return createDEXQuote(
          dexName,
          inputAmountInt,
          outputAmount,
          poolConfig.address
        );
      } catch {
        return null;
      }
    });

    // Gọi smart contract song song với DEX quotes
    const smartContractPromise = getSmartContractQuote(
      inputToken,
      outputToken,
      inputAmount
    );

    // Lấy quote từ Thala
    try {
      const thalaRoute = await thalaClient.getRouteGivenExactInput(
        inputToken,
        outputToken,
        inputAmountInt
      );
      if (thalaRoute && thalaRoute.amountOut) {
        const outputDecimals = 6; // Placeholder, needs actual token decimals
        const outputAmount = (
          Number(thalaRoute.amountOut) / Math.pow(10, outputDecimals)
        ).toFixed(outputDecimals);
        const priceImpact =
          thalaRoute.priceImpactPercentage?.toFixed(2) || "0.10";
        const route = ["Thala"];
        // Không có feeBps, poolAddress trực tiếp, nên để placeholder hoặc null
        const thalaQuoteObj: Quote = {
          dex: "Thala",
          outputAmount: outputAmount,
          fee: "0.10",
          priceImpact: priceImpact,
          route: route,
          hops: 1,
          liquidityScore: 1000000, // Placeholder
          executionTime: 1, // Placeholder
          pool_address: undefined, // Đặt undefined thay vì null
        };
        quotePromises.push(Promise.resolve(thalaQuoteObj));
      }
    } catch (e) {
      console.error("Error fetching Thala quote:", e);
    }

    // Chờ tất cả quotes hoàn thành, chỉ giữ lại các quote hợp lệ
    const dexQuotes: Quote[] = (await Promise.all(quotePromises)).filter(
      (q): q is Quote => Boolean(q)
    );

    // Gọi smart contract song song với DEX quotes
    const contractQuote = await smartContractPromise;

    const quotes: Quote[] = [...dexQuotes];
    if (contractQuote) {
      console.log("✅ Smart contract call successful!");
      console.log("🎯 Final contract quote:", contractQuote);
      quotes.push(contractQuote);
    } else {
      console.log("❌ Smart contract call failed, using DEX quotes only");
    }

    // Sau khi lấy tất cả quotes (bao gồm cả contractQuote), chỉ giữ lại các DEX thực sự có pool trong smart contract
    const SUPPORTED_DEXS = [
      "Liquidswap",
      "Econia",
      "Panora",
      "Amnis",
      "AnimeSwap",
      "SushiSwap",
      "PancakeSwap",
      "BaptSwap",
      "Thala",
      "Hyperion",
      "Aux",
    ];
    const filteredQuotes = quotes.filter((q) => SUPPORTED_DEXS.includes(q.dex));

    // Tìm best quote từ filteredQuotes
    const validQuotes = filteredQuotes.filter((quote) => {
      const output = parseFloat(quote.outputAmount);
      return !isNaN(output) && output > 0;
    });
    let bestQuote: Quote | null = null;
    if (validQuotes.length > 0) {
      validQuotes.sort(
        (a, b) => parseFloat(b.outputAmount) - parseFloat(a.outputAmount)
      );
      bestQuote = validQuotes[0];
      filteredQuotes.forEach((quote) => {
        quote.isBest = false;
      });
      if (bestQuote) {
        const bestQuoteInOriginal = filteredQuotes.find(
          (q) => q.dex === bestQuote!.dex // bestQuote luôn khác null ở đây
        );
        if (bestQuoteInOriginal) {
          bestQuoteInOriginal.isBest = true;
        }
      }
    }
    // Trả về filteredQuotes và bestQuote mới, nếu không có bestQuote thì không trả về trường này
    const response: any = {
      success: true,
      quotes: filteredQuotes,
      totalQuotes: filteredQuotes.length,
    };
    if (bestQuote !== null) response.bestQuote = bestQuote;
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Thêm hàm phụ để lấy key pool đúng định dạng
function fromTokenSymbol(inputToken: string, outputToken: string) {
  if (
    (inputToken === "0x1::aptos_coin::AptosCoin" &&
      outputToken ===
        "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC") ||
    (inputToken ===
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC" &&
      outputToken === "0x1::aptos_coin::AptosCoin")
  ) {
    return "APT-USDC";
  }
  if (
    (inputToken === "0x1::aptos_coin::AptosCoin" &&
      outputToken ===
        "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT") ||
    (inputToken ===
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT" &&
      outputToken === "0x1::aptos_coin::AptosCoin")
  ) {
    return "APT-USDT";
  }
  return "APT-USDC";
}
