// Type definitions for Aptos transaction data
interface SwapEvent {
  type: string;
  data: {
    x_in: string;
    y_out: string;
    x_out: string;
    y_in: string;
  };
}

interface TransactionEvent {
  type: string;
  data: any;
}

interface TransactionChange {
  address: string;
  data?: {
    type: string;
    data: {
      coin?: {
        value: string;
      };
      coin_x_reserve?: {
        value: string;
      };
      coin_y_reserve?: {
        value: string;
      };
      fee?: string;
      dao_fee?: string;
      last_block_timestamp?: string;
    };
  };
}

interface TransactionPayload {
  function: string;
  type_arguments: string[];
  arguments: string[];
}

export interface AptosTransaction {
  hash: string;
  success: boolean;
  timestamp: string;
  gas_used: string;
  sender: string;
  events: TransactionEvent[];
  changes: TransactionChange[];
  payload: TransactionPayload;
}

// Type for transactions from Aptos SDK
type AptosSDKTransaction = any; // Using any for now to handle SDK type differences

interface SwapInfo {
  txHash: string;
  success: boolean;
  timestamp: string;
  gasUsed: string;
  sender: string;
  amountIn: string;
  amountOut: string;
  tokenIn: string;
  tokenOut: string;
  function: string;
  poolType: string;
}

interface BalanceChanges {
  [coinType: string]: string;
}

interface PoolInfo {
  coinXReserve: string;
  coinYReserve: string;
  fee: string;
  daoFee: string;
  lastBlockTimestamp: string;
}

export function extractSwapInfo(transaction: AptosTransaction): SwapInfo | null {
  const swapEvent = transaction.events.find((event: TransactionEvent) => 
    event.type.includes('SwapEvent')
  ) as SwapEvent | undefined;
  
  if (!swapEvent) return null;
  
  const swapData = swapEvent.data;
  
  return {
    txHash: transaction.hash,
    success: transaction.success,
    timestamp: transaction.timestamp,
    gasUsed: transaction.gas_used,
    sender: transaction.sender,
    
    // Swap amounts (in smallest units)
    amountIn: swapData.x_in,
    amountOut: swapData.y_out,
    
    // Token types from payload
    tokenIn: transaction.payload.type_arguments[0], // USDC
    tokenOut: transaction.payload.type_arguments[1], // USDT
    
    // Function used
    function: transaction.payload.function,
    
    // Pool info
    poolType: transaction.payload.type_arguments[2], // Stable
  };
}

export function extractBalanceChanges(transaction: AptosTransaction): BalanceChanges {
  const balanceChanges: BalanceChanges = {};
  
  transaction.changes.forEach((change: TransactionChange) => {
    if (change.data?.type?.includes('CoinStore') && 
        change.address === transaction.sender) {
      const coinType = change.data.type;
      const coinValue = change.data.data.coin?.value || '0';
      balanceChanges[coinType] = coinValue;
    }
  });
  
  return balanceChanges;
}

export function extractPoolInfo(transaction: AptosTransaction): PoolInfo | null {
  const poolChange = transaction.changes.find((change: TransactionChange) => 
    change.data?.type?.includes('LiquidityPool')
  );
  
  if (!poolChange) return null;
  
  const poolData = poolChange.data!.data;
  
  return {
    coinXReserve: poolData.coin_x_reserve?.value || '0',
    coinYReserve: poolData.coin_y_reserve?.value || '0',
    fee: poolData.fee || '0',
    daoFee: poolData.dao_fee || '0',
    lastBlockTimestamp: poolData.last_block_timestamp || '0',
  };
}

/**
 * Calculate price per coin at transaction time
 * @param transaction - Aptos transaction data
 * @param baseCoinType - The coin type to get price for (e.g., APT address)
 * @param quoteCoinType - The quote coin type (e.g., USDT address)
 * @returns Price in quote coin per base coin, or null if not a swap transaction
 */
export function calculatePriceAtTransaction(
  transaction: AptosTransaction,
  baseCoinType: string,
  quoteCoinType: string
): number | null {
  const swapInfo = extractSwapInfo(transaction);
  if (!swapInfo) return null;

  // Check if this is a swap between the specified coins
  if (swapInfo.tokenIn !== baseCoinType && swapInfo.tokenIn !== quoteCoinType) return null;
  if (swapInfo.tokenOut !== baseCoinType && swapInfo.tokenOut !== quoteCoinType) return null;

  // Calculate price based on actual swap amounts
  const amountIn = parseFloat(swapInfo.amountIn);
  const amountOut = parseFloat(swapInfo.amountOut);

  if (amountIn === 0 || amountOut === 0) return null;

  // Determine the direction of the swap
  const isBaseToQuote = swapInfo.tokenIn === baseCoinType && swapInfo.tokenOut === quoteCoinType;
  const isQuoteToBase = swapInfo.tokenIn === quoteCoinType && swapInfo.tokenOut === baseCoinType;

  if (isBaseToQuote) {
    // Selling base coin for quote coin: price = quote_amount / base_amount
    return amountOut / amountIn;
  } else if (isQuoteToBase) {
    // Buying base coin with quote coin: price = quote_amount / base_amount
    return amountIn / amountOut;
  }

  return null;
}

/**
 * Get historical price data for a coin pair
 * @param baseCoinType - The base coin type (e.g., USDC address)
 * @param quoteCoinType - The quote coin type (e.g., USDT address)
 * @param startTimestamp - Start timestamp in seconds
 * @param endTimestamp - End timestamp in seconds
 * @param limit - Maximum number of data points to return (default: 100)
 * @returns Array of historical price data points
 */
export async function getHistoricalPriceData(
  baseCoinType: string,
  quoteCoinType: string,
  startTimestamp: number,
  endTimestamp: number,
  limit: number = 100
): Promise<HistoricalPriceData[]> {
  try {
    // Get all pools for this coin pair
    const res = await fetch("https://api.liquidswap.com/pools/registered");
    const allPools = await res.json();
    
    // Find pools for this coin pair
    const pools = allPools.filter((pool: any) => 
      (pool.coinX.type === baseCoinType || pool.coinY.type === baseCoinType) &&
      (pool.coinX.type === quoteCoinType || pool.coinY.type === quoteCoinType)
    );

    if (pools.length === 0) {
      throw new Error(`No pools found for ${baseCoinType} and ${quoteCoinType}`);
    }

    // Get historical data from Liquidswap API
    const historicalRes = await fetch(
      `https://api.liquidswap.com/pools/${pools[0].address}/historical-data?` +
      `start_timestamp=${startTimestamp}&` +
      `end_timestamp=${endTimestamp}&` +
      `limit=${limit}`
    );

    if (!historicalRes.ok) {
      throw new Error(`Failed to fetch historical data: ${historicalRes.statusText}`);
    }

    const historicalData = await historicalRes.json();
    
    // Transform the data to our format
    return historicalData.map((dataPoint: any) => ({
      timestamp: dataPoint.timestamp,
      price: dataPoint.price,
      volume: dataPoint.volume || 0,
      liquidity: dataPoint.liquidity || 0,
      poolAddress: pools[0].address,
      baseCoinType,
      quoteCoinType
    }));

  } catch (error) {
    console.error("Error fetching historical price data:", error);
    throw error;
  }
}

/**
 * Get historical price data for a specific wallet's transactions
 * @param walletAddress - The wallet address to analyze
 * @param baseCoinType - The base coin type
 * @param quoteCoinType - The quote coin type
 * @param startTimestamp - Start timestamp in seconds
 * @param endTimestamp - End timestamp in seconds
 * @returns Array of price data from wallet's swap transactions
 */
export async function getWalletHistoricalPrices(
  walletAddress: string,
  baseCoinType: string,
  quoteCoinType: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<WalletPriceData[]> {
  try {
    const client = new (await import("aptos")).AptosClient(
      process.env.NEXT_PUBLIC_APTOS_NODE_URL || "https://api.mainnet.aptoslabs.com/v1"
    );

    // Get wallet transactions
    const transactions = await client.getAccountTransactions(walletAddress);
    
    // Filter transactions by timestamp and type
    const filteredTransactions = transactions.filter((tx: AptosSDKTransaction) => {
      const txTimestamp = parseInt((tx as any).timestamp) / 1000000; // Convert to seconds
      return txTimestamp >= startTimestamp && 
             txTimestamp <= endTimestamp &&
             (tx as any).payload?.function?.includes('swap');
    });

    // Extract price data from each transaction
    const priceData: WalletPriceData[] = [];
    
    for (const tx of filteredTransactions) {
      const price = calculatePriceAtTransaction(tx as any, baseCoinType, quoteCoinType);
      if (price !== null) {
        const swapInfo = extractSwapInfo(tx as any);
        if (swapInfo) {
          priceData.push({
            timestamp: parseInt((tx as any).timestamp) / 1000000,
            price,
            txHash: (tx as any).hash,
            amountIn: swapInfo.amountIn,
            amountOut: swapInfo.amountOut,
            tokenIn: swapInfo.tokenIn,
            tokenOut: swapInfo.tokenOut
          });
        }
      }
    }

    return priceData.sort((a, b) => a.timestamp - b.timestamp);

  } catch (error) {
    console.error("Error fetching wallet historical prices:", error);
    throw error;
  }
}

export function filterTransactions(transactions: AptosTransaction[], walletAddress: string) {
  return transactions.filter((transaction) => transaction.sender === walletAddress);
}

// Additional interfaces for the new functions
interface HistoricalPriceData {
  timestamp: number;
  price: number;
  volume: number;
  liquidity: number;
  poolAddress: string;
  baseCoinType: string;
  quoteCoinType: string;
}

interface WalletPriceData {
  timestamp: number;
  price: number;
  txHash: string;
  amountIn: string;
  amountOut: string;
  tokenIn: string;
  tokenOut: string;
}