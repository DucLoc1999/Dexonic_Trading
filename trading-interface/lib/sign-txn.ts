"use client";

import { AptosClient } from "aptos";
import { InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";
import 'dotenv/config';
import { AptosSignAndSubmitTransactionOutput, InputTransactionData } from "@aptos-labs/wallet-adapter-react";

type Reserve = {
  reserveIn: bigint;
  reserveOut: bigint;
  type: string;
}

type SwapWithPontemOutput = {
  payload: InputGenerateTransactionPayloadData;
  typeArguments: string[];
  functionName: string;
  moduleAddress: string;
}

// -- CONFIG --
const getClient = () => {
  const nodeUrl = process.env.NEXT_PUBLIC_APTOS_NODE_URL;
  
  if (!nodeUrl) {
    throw new Error("Aptos node url is not set");
  }
  
  const client = new AptosClient(nodeUrl);
  return client;
};

// -- 1. Get Coin Decimals --
export async function getCoinDecimals(coinType: string): Promise<number | null> {
  try {
    const client = getClient();
    const address = coinType.split("::")[0];
    
    // Handle different token types
    let resourceType: string;
    
    if (coinType.includes("::asset::")) {
      // For asset tokens like USDT, use AssetStore
      resourceType = `0x1::asset::AssetStore<${coinType}>`;
    } else {
      // For standard coins, use CoinStore
      resourceType = `0x1::coin::CoinStore<${coinType}>`;
    }
    
    const resource = await client.getAccountResource(address, resourceType);
    
    // Handle different data structures
    if (resource.data && typeof resource.data === 'object') {
      if ('decimals' in resource.data) {
        return parseInt((resource.data as any).decimals);
      } else if ('coin' in resource.data && (resource.data as any).coin && 'decimals' in (resource.data as any).coin) {
        return parseInt((resource.data as any).coin.decimals);
      }
    }
    
    // Fallback: try to get decimals from coin info
    try {
      const coinInfoResource = await client.getAccountResource(address, `0x1::coin::CoinInfo<${coinType}>`);
      if (coinInfoResource.data && typeof coinInfoResource.data === 'object' && 'decimals' in coinInfoResource.data) {
        return parseInt((coinInfoResource.data as any).decimals);
      }
    } catch (coinInfoError) {
      console.log(`Could not get coin info for ${coinType}:`, coinInfoError);
    }
    
    // Default decimals for common tokens
    const defaultDecimals: { [key: string]: number } = {
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT": 6,
      "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T": 6, // USDC
      "0x1::aptos_coin::AptosCoin": 8,
    };
    
    return defaultDecimals[coinType] || 8; // Default to 8 decimals
    
  } catch (e) {
    console.error("getCoinDecimals error:", e);
    
    // Fallback to default decimals for common tokens
    const defaultDecimals: { [key: string]: number } = {
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT": 6,
      "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T": 6, // USDC
      "0x1::aptos_coin::AptosCoin": 8,
    };
    
    return defaultDecimals[coinType] || 8; // Default to 8 decimals
  }
}

// -- 2. Check Balance --
export async function checkBalance(accountAddress: string, coinType?: string): Promise<bigint> {
  try {
    const client = getClient();
    if (!coinType) {
      const resources = await client.getAccountResources(accountAddress);
      console.dir(resources, { depth: null });
      return BigInt(0);
    }
    const resource = await client.getAccountResource(
      accountAddress,
      `0x1::coin::CoinStore<${coinType}>`
    );
    const data = resource.data as { coin: { value: string } };
    return BigInt(data.coin.value);
  } catch (e: unknown) {
    if (e instanceof Error && 'status' in e && e.status === 404) {
      console.log(`No balance found for ${accountAddress}`);
      return BigInt(0);
    }
    throw e;
  }
}

// -- 2.1. Check Resource --
export async function checkResource(accountAddress: string, resourceType: string) {
  const client = getClient();
  const resource = await client.getAccountResource(accountAddress, resourceType);
  console.dir(resource, { depth: null });
}

// -- 3. Check and Register Coin --
export async function checkAndRegisterCoin(
  wallet: { account: { address: string }; signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<AptosSignAndSubmitTransactionOutput> },
  coinType: string
): Promise<void> {
  try {
    const client = getClient();
    await client.getAccountResource(wallet.account.address, `0x1::coin::CoinStore<${coinType}>`);
  } catch (e: unknown) {
    if (e instanceof Error && 'status' in e && e.status === 404) {
      const client = getClient();
      const payload: InputGenerateTransactionPayloadData = {
        function: "0x1::managed_coin::register",
        typeArguments: [coinType],
        functionArguments: [],
      };
      const tx = await wallet.signAndSubmitTransaction({ data: payload });
      await client.waitForTransaction(tx.hash);
    } else {
      throw e;
    }
  }
}

// -- 4. Get Pool Reserves --
export async function getPoolReserves(
  coinIn: string,
  coinOut: string
): Promise<Reserve[]> {
  try {
    // Get all pools
    const res = await fetch("https://api.liquidswap.com/pools/registered");
    const allPools = await res.json();
    
    // Find pools
    const pools = allPools.filter((pool: { coinX: { type: string }; coinY: { type: string } }) => (pool.coinX.type === coinIn || pool.coinY.type === coinIn) && (pool.coinX.type === coinOut || pool.coinY.type === coinOut));
    if (!pools.length) {
      throw new Error("No pool found for this token pair.");
    }

    const results: Reserve[] = [];
    for (const pool of pools) {
      const reserveX = BigInt(pool.coinX.reserve);
      const reserveY = BigInt(pool.coinY.reserve);

      // Map reserves back to coinIn and coinOut correctly
      if (pool.coinX.type === coinIn && pool.coinY.type === coinOut) {
        // coinIn is coinX, coinOut is coinY
        results.push({ reserveIn: reserveX, reserveOut: reserveY, type: pool.type });
      } else if (pool.coinX.type === coinOut && pool.coinY.type === coinIn) {
        // coinIn is coinY, coinOut is coinX
        results.push({ reserveIn: reserveY, reserveOut: reserveX, type: pool.type });
      }
    }
    return results;
  } catch (e: unknown) {
    if (e instanceof Error && 'status' in e && e.status !== 404) throw e;
    else {
      console.log(`No pool found for this tokens pair: ${coinIn} and ${coinOut}`);
    }
  }

  throw new Error("No pool found for this token pair.");
}

// -- 5. Get Amount Out --
export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  const amountInWithFee = amountIn * BigInt(997);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * BigInt(1000) + amountInWithFee;
  return numerator / denominator;
}

// -- 6. Get Amount In --
export function getAmountIn(amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  const numerator = reserveIn * amountOut * BigInt(1000);
  const denominator = (reserveOut - amountOut) * BigInt(997);
  return numerator / denominator + BigInt(1);
}

// -- 7. Swap with Pontem (Liquidswap) --
export async function swapWithPontem(
  accountAddress: string,
  coinIn: string,
  coinOut: string,
  amountIn: bigint,
  minAmountOut: bigint,
  poolType: string,
  isExactOutput: boolean = false
): Promise<SwapWithPontemOutput> {
  if (!accountAddress) {
    throw new Error("Account address is undefined");
  }
  const [coinX, ] = [coinIn, coinOut].sort();

  // Determine module address and function based on pool type
  let moduleAddress: string;
  let moduleName: string;
  let functionName: string;
  let typeArguments: string[];

  // Extract type arguments from pool type
  const extractTypeArguments = (poolType: string): string[] => {
    // Match the pattern: anything<coinX, coinY, curveType> - just extract what's in the brackets
    const match = poolType.match(/<([^>]+)>/);
    if (!match) {
      throw new Error(`Could not parse pool type: ${poolType}`);
    }
    
    // Split by comma, but be careful with nested generics
    const typeArgs = match[1].split(',').map(arg => arg.trim());
    return typeArgs;
  };

  // Determine if coinIn-coinOut matches coinX-coinY or coinY-coinX
  const isCoinInCoinX = coinIn === coinX;
  // const isCoinInCoinY = coinIn === coinY;

  if (poolType.includes("0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12")) {
    // V0 pool
    moduleAddress = "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12";
    moduleName = "scripts";
    functionName = isExactOutput ? "swap_into" : "swap";
    typeArguments = extractTypeArguments(poolType);
  } else if (poolType.includes("0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e")) {
    // V0.5 pool (same as v0)
    moduleAddress = "0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e";
    moduleName = "scripts";
    functionName = isExactOutput ? "swap_into" : "swap";
    typeArguments = extractTypeArguments(poolType);
  } else if (poolType.includes("0x54cb0bb2c18564b86e34539b9f89cfe1186e39d89fce54e1cd007b8e61673a85")) {
    // V1 pool
    moduleAddress = "0x54cb0bb2c18564b86e34539b9f89cfe1186e39d89fce54e1cd007b8e61673a85";
    moduleName = "router";
    
    // Determine the correct function based on swap type and coin order
    if (isExactOutput) {
      // Exact output swap
      if (isCoinInCoinX) {
        functionName = "swap_x_for_exact_y";
      } else {
        functionName = "swap_y_for_exact_x";
      }
    } else {
      // Exact input swap
      if (isCoinInCoinX) {
        functionName = "swap_exact_x_for_y";
      } else {
        functionName = "swap_exact_y_for_x";
      }
    }
    
    typeArguments = extractTypeArguments(poolType);
  } else {
    throw new Error(`Unknown pool type: ${poolType}`);
  }

  // Ensure type arguments are strings
  typeArguments = typeArguments.map(arg => String(arg));

  // Construct arguments based on version and swap type
  let functionArguments: string[];

  if (poolType.includes("0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12") || 
      poolType.includes("0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e")) {
    // V0/V0.5 pools
    if (isExactOutput) {
      // swap_into: coin_val_max, coin_out
      functionArguments = [
        amountIn.toString(),      // coin_val_max: maximum input amount
        minAmountOut.toString(),  // coin_out: exact output amount
      ];
    } else {
      // swap: coin_val, coin_out_min_val
      functionArguments = [
        amountIn.toString(),      // coin_val: input amount
        minAmountOut.toString(),  // coin_out_min_val: minimum out
      ];
    }
  } else {
    // V1 pools
    if (isExactOutput) {
      // swap_x_for_exact_y or swap_y_for_exact_x: coins_in, coins_required_out
      functionArguments = [
        amountIn.toString(),      // coins_in: maximum input amount
        minAmountOut.toString(),  // coins_required_out: exact output amount
      ];
    } else {
      // swap_exact_x_for_y or swap_exact_y_for_x: coins_in, coins_out_min_val
      functionArguments = [
        amountIn.toString(),      // coins_in: input amount
        minAmountOut.toString(),  // coins_out_min_val: minimum out
      ];
    }
  }

  const payload: InputGenerateTransactionPayloadData = {
    function: `${moduleAddress}::${moduleName}::${functionName}`,
    typeArguments: typeArguments,
    functionArguments: functionArguments,
  };

  // Ensure type_arguments is properly set
  if (!payload.typeArguments || payload.typeArguments.length === 0) {
    throw new Error("Type arguments are empty");
  }

  return {
    payload,
    typeArguments,
    functionName,
    moduleAddress
  };
}

// -- 8. Wait for Transaction Confirmation --
export async function waitForTransaction(txHash: string): Promise<void> {
  try {
    const client = getClient();
    await client.waitForTransaction(txHash);
  } catch (error) {
    console.error("Error waiting for transaction confirmation:", error);
    throw error;
  }
}

// -- 9. Get wallet transaction --
export async function getWalletTransactionHistory(walletAddress: string, numberOfTransactions?: number) {
  const client = getClient();
  const transactions = await client.getAccountTransactions(walletAddress);
  return transactions.slice(-(numberOfTransactions || 10));
}
