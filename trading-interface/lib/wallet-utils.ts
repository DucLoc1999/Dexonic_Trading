"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { 
  checkBalance, 
  checkAndRegisterCoin, 
  getPoolReserves, 
  getAmountOut, 
  getAmountIn,
  getAnimeSwapPoolReserves,
  getAnimeSwapAmountOut,
  getAnimeSwapAmountIn,
  swapWithAnimeSwap,
  waitForTransaction
} from "./sign-txn";

export interface SwapParams {
  fromToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
  toToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
  fromAmount?: string;
  toAmount?: string;
  slippage: number;
  isExactOutput?: boolean;
}

export function useWalletUtils() {
  const { connected, account, signAndSubmitTransaction } = useWallet();

  const checkTokenBalance = async (tokenAddress: string) => {
    if (!connected || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      const balance = await checkBalance(account.address.toString(), tokenAddress);
      return balance;
    } catch (error) {
      console.error("Error checking balance:", error);
      throw error;
    }
  };

  const registerTokenIfNeeded = async (tokenAddress: string) => {
    if (!connected || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      await checkAndRegisterCoin(
        { account: { address: account.address.toString() }, signAndSubmitTransaction },
        tokenAddress
      );
    } catch (error) {
      console.error("Error registering token:", error);
      throw error;
    }
  };

  const getSwapQuote = async (params: SwapParams) => {
    if (!connected || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      const { fromToken, toToken, fromAmount, toAmount } = params;
      
      // Get AnimeSwap pool reserves
      const reserves = await getAnimeSwapPoolReserves(fromToken.address, toToken.address);
      if (!reserves.length) {
        throw new Error("No AnimeSwap liquidity pool found for this token pair");
      }

      // AnimeSwap only has one pool per token pair, so we use the first (and only) reserve
      const bestReserve = reserves[0];

      if (fromAmount && parseFloat(fromAmount) > 0) {
        // Calculate amount out from amount in using AnimeSwap formula
        const amountIn = BigInt(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));
        const amountOut = getAnimeSwapAmountOut(amountIn, bestReserve.reserveIn, bestReserve.reserveOut, bestReserve.fee);
        const amountOutDecimal = Number(amountOut) / Math.pow(10, toToken.decimals);
        
        return {
          amountOut: amountOutDecimal,
          amountOutRaw: amountOut,
          amountIn: parseFloat(fromAmount),
          amountInRaw: amountIn,
          reserves: bestReserve,
          poolFound: true
        };
      } else if (toAmount && parseFloat(toAmount) > 0) {
        // Calculate amount in from amount out using AnimeSwap formula
        const amountOut = BigInt(parseFloat(toAmount) * Math.pow(10, toToken.decimals));
        const amountIn = getAnimeSwapAmountIn(amountOut, bestReserve.reserveIn, bestReserve.reserveOut, bestReserve.fee);
        const amountInDecimal = Number(amountIn) / Math.pow(10, fromToken.decimals);
        
        return {
          amountOut: parseFloat(toAmount),
          amountOutRaw: amountOut,
          amountIn: amountInDecimal,
          amountInRaw: amountIn,
          reserves: bestReserve,
          poolFound: true
        };
      } else {
        throw new Error("Either fromAmount or toAmount must be provided");
      }
    } catch (error) {
      console.error("Error getting AnimeSwap quote:", error);
      throw error;
    }
  };

  const executeSwap = async (params: SwapParams) => {
    if (!connected || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      const { fromToken, toToken, fromAmount, slippage } = params;
      
      if (!fromAmount) {
        throw new Error("fromAmount is required for swap execution");
      }
      
      // Register tokens if needed
      await registerTokenIfNeeded(fromToken.address);
      await registerTokenIfNeeded(toToken.address);
      
      // Get quote
      const quote = await getSwapQuote(params);
      
      // Calculate minimum amount out with slippage
      const minAmountOut = quote.amountOutRaw * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
      
      // Convert amount to bigint
      const amountIn = BigInt(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));

      console.log('swapWithAnimeSwap params:')
      console.log({accountAddress: account.address.toString(),
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      amountIn,
      minAmountOut,
      poolType: quote.reserves.type,
      isExactOutput: params.isExactOutput || false})
      
      const swapData = await swapWithAnimeSwap(
        account.address.toString(),
        fromToken.address,
        toToken.address,
        amountIn,
        minAmountOut,
        quote.reserves.type,
        params.isExactOutput || false
      );
      
      // Submit the transaction using the wallet adapter
      const tx = await signAndSubmitTransaction({
        sender: account.address,
        data: swapData.payload,
      });
      
      // Wait for transaction confirmation
      await waitForTransaction(tx.hash);
      
      const txHash = tx.hash;

      // Save the transaction hash to the txnHistory.txt file
      const response = await fetch("/api/save-txn", {
        method: "POST",
        body: JSON.stringify({ txHash }),
      });

      if (!response.ok) {
        throw new Error("Failed to save transaction hash");
      } else {
        console.log("Transaction saved");
      }
      
      return {
        txHash,
        amountOut: quote.amountOut,
        minAmountOut: Number(minAmountOut) / Math.pow(10, toToken.decimals)
      };
    } catch (error) {
      console.error("Error executing swap:", error);
      
      // Handle user rejection specifically
      if (error instanceof Error && error.message.includes("Rejected by User")) {
        throw new Error("Transaction was cancelled by user");
      }
      
      throw error;
    }
  };

  return {
    connected,
    account,
    checkTokenBalance,
    registerTokenIfNeeded,
    getSwapQuote,
    executeSwap
  };
} 