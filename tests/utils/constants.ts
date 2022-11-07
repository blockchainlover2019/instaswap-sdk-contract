import { PlatformType } from "./types";

// seeds
export const USDR_TOKEN_SEED = "USDR_TOKEN_SEED";
export const GLOBAL_STATE_SEED = "GLOBAL_STATE_SEED";
export const POOL_SEED = "POOL_SEED";
export const VAULT_SEED = "VAULT_SEED";
export const MINT_USDR_KEY = "USDrbBQwQbQ2oWHUPfA8QBHcyVxKUq1xHyXsSLKdUq2";
export const MINT_RATIO_KEY = "ratioMVg27rSZbSvBopUvsdrGUzeALUfFma61mpxc8J";
export const MINT_USDR_KEYPAIR = [
  251, 13, 59, 235, 78, 236, 123, 64, 175, 12, 131, 201, 144, 193, 154, 173,
  223, 234, 42, 241, 204, 119, 249, 83, 15, 47, 6, 121, 184, 68, 85, 163, 7, 7,
  51, 53, 239, 27, 86, 29, 79, 32, 112, 12, 85, 30, 202, 238, 51, 40, 170, 112,
  17, 54, 255, 88, 82, 72, 138, 64, 134, 44, 240, 141,
];
export const ORACLE_SEED = "ORACLE_SEED";
export const BLACKLIST_SEED = "BLACKLIST_SEED";
export const USER_STATE_SEED = "USER_STATE_SEED";

// default platform values
export const EMER_STATE_DISABLED = 0;
export const EMER_STATE_ENABLED = 1;
export const TVL_LIMIT_USD = 1_000_000;
export const DEBT_CEILING_GLOBAL_USDR = 500_000;
export const DEBT_CEILING_POOL_USDR = 500_000;
export const DEBT_CEILING_USER_USDR = 1_000;
export const DECIMALS_RATIO = 6;
export const DECIMALS_USDR = 6;
export const DECIMALS_USD = 6;
export const DECIMALS_PRICE = 6;
export const DEFAULT_FEE_NUMERATOR = 30;

// raydium
export const RAYDIUM_LIQUIDITY_VERSION = 4;
export const RAYDIUM_FARM_VERSION = 5;
export const MINT_RAY_KEY = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R";
export const MINT_USDC_KEY = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const RAYDIUM_USDC_VAULT_KEY =
  "jfrmNrBtxnX1FH36ATeiaXnpA4ppQcKtv7EfrgMsgLJ";
export const MINT_USDT_KEY = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
export const MINT_USH_KEY = "9iLH8T7zoWhY7sBmj1WK9ENbWdS1nL8n9wAxaeRitTa6";
export const MINT_SUSDC9_KEY = "JEFFSQ3s8T3wKsvp4tnRAsUBW7Cqgnf8ukBZC4C8XBm1";

export const RAYDIUM_USDT_VAULT_KEY =
  "5XkWQL9FJL4qEvL8c3zCzzWnMGzerM3jbGuuyRprsEgG";
export const MINT_RAYDIUM_USDT_USDC_LP_KEY =
  "As3EGgLtUVpdNpE6WCKauyNRrCCwcQ57trWQ3wyRXDa6";
export const RAYDIUM_USDT_USDC_FARM_KEY =
  "5oCZkR2k955Mvmgq3A4sFd76D5k4qZn45VpaCkp8H3uS";
export const RAYDIUM_USDT_USDC_LP_ACC_KEY =
  "DduzAhNLsqaeSno9aELfZ8TqtWh9c4kyTGRwxK4JaBw2";
export const RAYDIUM_USDT_USDC_REWARD_ACC_KEY =
  "DpjXRkiQEBXqLh8jpHZZRztwEej1GarxVvpBi1SR8rKk"; // RAY
export const RAYDIUM_USDT_USDC_REWARD_USDC_ACC_KEY =
  "6fomjaXLVgTbTaQLGRnKsJGBJ4Rt556v6NhynWDnrb5u"; // USDC

export const SABER_DECIMALS_PROGRAM =
  "DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB";
export const SABER_DECIMALS_USDC9_WRAPPER_ACCOUNT =
  "AnKLLfpMcceM6YXtJ9nGxYekVXqfWy8WNsMZXoQTCVQk";
export const SABER_DECWRAPPER_UNDERLYING_TOKENS_ACCOUNT =
  "77XHXCWYQ76E9Q3uCuz1geTaxsqJZf9RfX5ZY7yyLDYt";


// test vars
export const DECIMALS_SBR = 6; // included on state acct
export const DECIMALS_RAY = 6; // included on state acct
export const DECIMALS_USDCUSDT = 6; // included on state acct
export const DECIMALS_USDCUSDT_RAYDIUM = 6; // included on state acct
export const DECIMALS_USDC = 6; // included on state acct
export const DECIMALS_USDT = 6; // included on state acct

// platform types
export const PLATFORM_TYPE_RAYDIUM: PlatformType = 0; // TODO: Add in another ticket. jkap 2/13/22
// export const PLATFORM_TYPE_ORCA: PlatformType = 1; // TODO: Add in another ticket. jkap 2/13/22
export const PLATFORM_TYPE_SABER: PlatformType = 2;
// export const PLATFORM_TYPE_MERCURIAL: PlatformType = 3; // TODO: Add in another ticket. jkap 2/13/22
export const PLATFORM_TYPE_UNKNOWN: PlatformType = 4;
