import { PlatformType } from "./types";

// seeds
export const GLOBAL_STATE_SEED = "GLOBAL_STATE_SEED";

// default platform values
export const DECIMALS_RATIO = 6;
export const DECIMALS_USDR = 6;
export const DECIMALS_USD = 6;
export const DECIMALS_PRICE = 6;
export const DEFAULT_FEE_NUMERATOR = 30;

// ratio
export const RATIO_GLOBAL_STATE_KEY = "G4Ssyc3WngzCnHbeeNhtdbEhZ7R7uXHMATuY9Uay2ycX";
export const RATIO_TREASURY_KEY = "HXCRCJVSpoNPG53ZkCsp6XGBf1Qn3LaxzVqnDepAANDM";
export const MINT_USDR_KEY = "USDrbBQwQbQ2oWHUPfA8QBHcyVxKUq1xHyXsSLKdUq2";
export const MINT_RATIO_KEY = "ratioMVg27rSZbSvBopUvsdrGUzeALUfFma61mpxc8J";

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

// saber
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
