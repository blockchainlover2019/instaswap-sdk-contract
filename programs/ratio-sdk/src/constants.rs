#[cfg(feature = "test")]
pub const USDR_MINT: &str = "USR33Ar1N3xG7fZbJPeNRyMMNsgVtkddHeo6chWTFaA";
#[cfg(feature = "prev")]
pub const USDR_MINT: &str = "USDpeWMjbpDqbc4edaA6FvE4yNyASMxs4e8kRuKLoe1";
#[cfg(feature = "prod")]
pub const USDR_MINT: &str = "USDrbBQwQbQ2oWHUPfA8QBHcyVxKUq1xHyXsSLKdUq2";


// seeds
pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_SEED";
pub const POOL_SEED: &[u8] = b"POOL_SEED";
pub const USER_STATE_SEED: &[u8] = b"USER_STATE_SEED";
pub const VAULT_SEED: &[u8] = b"VAULT_SEED";
pub const VAULT_LIQUIDATE_SEED: &[u8] = b"VAULT_LIQUIDATE_SEED";
pub const ORACLE_SEED: &[u8] = b"ORACLE_SEED";
pub const BLACKLIST_SEED: &[u8] = b"BLACKLIST_SEED";
pub const MAX_BLACKILIST_SIZE:usize = 300;
// numbers
pub const DECIMALS_USDR: u8 = 6;
pub const DEFAULT_FEE_NUMERATOR: u64 = 30;
pub const DEFAULT_FEE_DENOMINATOR: u64 = 10000;
pub const DEFAULT_RATIOS_DECIMALS: u8 = 8;
pub const DEFAULT_RATIOS: [u64; 10] = [
    99009901, // AAA
    97799511, // AA
    96618357, // A
    95011876, // BBB
    93023256, // BB
    91116173, // B
    90090090, // CCC
    89086860, // CC
    88105727, // C
    86206897, // D
];

pub const ACC_PRECISION: u128 = 100_000_000_000;
pub const ONE_DAY_IN_SEC: i64 = 86_400;
pub const ONE_YEAR_IN_SEC: i64 = 31_536_000;

pub const LIQUIDATE_LAMPORT:u64 = 50_000_000;
//for unwind lp
pub const SABER_STABLE_SWAP_PROGRAM_ID: &str = "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ";
pub const RAYDIUM_STABLE_SWAP_PROGRAM_ID: &str = "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h";

//for selling  assets
pub const JUP_AG_PROGRAM_ID_V2: &str = "JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo";
pub const JUP_AG_PROGRAM_ID_V3: &str = "JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph";

//for liquidation
pub const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// usdr interest
pub const SWITCHBOARD_USDR_USDC_ID: &str = "3kQwNesSZdbFagwER26mBveGeLSWLLdsnE7tbsJCeoTt";
