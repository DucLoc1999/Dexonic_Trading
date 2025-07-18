// Contract Configuration
export const CONTRACT_CONFIG = {
  // Main Contract Address
  AGGREGATOR_ADDRESS:
    "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127",

  // Admin Wallet
  ADMIN_ADDRESS:
    "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127",
  ADMIN_PRIVATE_KEY:
    "6708FC6C7CDCBE1B439936FB781D59B23A071F75A6C13A462C6EDB44E28561E9",

  // Network Configuration
  NETWORK: "mainnet",
  RPC_URL: "https://fullnode.mainnet.aptoslabs.com",

  // Transaction Hashes
  DEPLOY_TX_HASH:
    "0xe9b8b41b2d6c033cf731b237331b10e5ebdab585d2d28b49198276db46b05611",
  INITIALIZE_TX_HASH:
    "0x18a0812742f42bc9f68932ee72c96e5065bc80069f0086cd842b5876f77b2a21",

  // Explorer Links
  EXPLORER_BASE_URL: "https://explorer.aptoslabs.com",
  DEPLOY_EXPLORER_URL:
    "https://explorer.aptoslabs.com/txn/0xe9b8b41b2d6c033cf731b237331b10e5ebdab585d2d28b49198276db46b05611?network=mainnet",
  INITIALIZE_EXPLORER_URL:
    "https://explorer.aptoslabs.com/txn/0x18a0812742f42bc9f68932ee72c96e5065bc80069f0086cd842b5876f77b2a21?network=mainnet",

  // DEX Configuration
  DEX_CONFIG: {
    PancakeSwap: {
      address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
      fee: "0.30",
      priority: 1,
    },
    Liquidswap: {
      address:
        "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12",
      fee: "0.30",
      priority: 2,
    },
    AnimeSwap: {
      address: "0x16fe2bdfb864e0b24582543b4b5a3b910b2bb12f",
      fee: "0.25",
      priority: 3,
    },
    Panora: {
      address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
      fee: "0.18",
      priority: 4,
    },
    Aries: {
      address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
      fee: "0.20",
      priority: 5,
    },
    Econia: {
      address:
        "0xc0deb00c405f84c85dc13442e305df75d9b58c5481e6824349a528b0b78d4bb5",
      fee: "0.35",
      priority: 6,
    },
    SushiSwap: {
      address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
      fee: "0.30",
      priority: 7,
    },
    Thala: {
      address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
      fee: "0.25",
      priority: 8,
    },
    Aux: {
      address: "0x1eabed72c53feb3805180a7c8464bc46f1103de1",
      fee: "0.30",
      priority: 9,
    },
  },

  // Token Configuration
  TOKENS: {
    APT: {
      symbol: "APT",
      address: "0x1::aptos_coin::AptosCoin",
      decimals: 8,
      logo: "/aptos-logo.svg",
    },
    USDC: {
      symbol: "USDC",
      address:
        "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T",
      decimals: 6,
      logo: "/usdc-logo.svg",
    },
    USDT: {
      symbol: "USDT",
      address:
        "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b::coin::T",
      decimals: 6,
      logo: "/usdt-logo.svg",
    },
    WETH: {
      symbol: "WETH",
      address:
        "0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T",
      decimals: 8,
      logo: "/weth-logo-diamond.svg",
    },
  },
};

// Environment variables
export const ENV_CONFIG = {
  NEXT_PUBLIC_APTOS_NODE_URL: "https://fullnode.mainnet.aptoslabs.com",
  NEXT_PUBLIC_AGGREGATOR_ADDRESS: CONTRACT_CONFIG.AGGREGATOR_ADDRESS,
};

// Contract functions
export const CONTRACT_FUNCTIONS = {
  INITIALIZE: "initialize",
  SIMULATE_SWAP: "simulate_swap",
  EXECUTE_SWAP: "execute_swap",
  GET_CONFIG: "get_config",
  EXECUTE_LIQUIDSWAP_SWAP: "execute_liquidswap_swap",
  EXECUTE_ECONIA_SWAP: "execute_econia_swap",
  EXECUTE_PANORA_SWAP: "execute_panora_swap",
  EXECUTE_AMNIS_SWAP: "execute_amnis_swap",
  EXECUTE_ANIMESWAP_SWAP: "execute_animeswap_swap",
  EXECUTE_SUSHISWAP_SWAP: "execute_sushiswap_swap",
};
