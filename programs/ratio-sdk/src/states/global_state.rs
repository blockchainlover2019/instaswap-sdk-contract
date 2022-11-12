// libraries
use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct GlobalState {
    /// Bump/nonce for the global state pda
    pub bump: u8,
    pub authority: Pubkey,
    /// Public key for the treasury account
    pub treasury: Pubkey,
    /// Public key for the account that can report new prices to the oracle accounts
    pub oracle_reporter: Pubkey,
    /// Mint address for USDr
    pub mint_usdr: Pubkey,
    /// aliases: tvlCollatCeilingUsd;  prev: tvl_limit, tvl_limit_usd, tvlLimit
    pub tvl_collat_ceiling_usd: u128,
    /// total collateral amount in usd locked in the RatioLending
    pub tvl_usd: u128,
    /// total collateral amount in usd per risk level
    pub tvl_collat: [u128; 4],
    /// Is contract paused
    pub paused: u8,
    /// The total amount of debt minted via the Ratio platform, in USDr
    pub total_debt: u64, // prev: total_debt
    /// The limit on the global mintable debt, in USDr
    pub debt_ceiling_global: u64,
    /// The limit on the mintable debt per user, in USDr
    pub debt_ceiling_user: u64,
    /// The numerator for calculating the fee, deprecated, use pool state value instead
    pub unused_harvest_fee_numer: u64,
    /// The denomenator for calculating the fee
    pub fee_deno: u64,
    /// The collateral per risk
    pub coll_per_risklv: [u64; 10], // can we rename this

    pub ratio_mint: Pubkey,
    pub funding_wallet: Pubkey,

    /// deprecated, use pool state state value instead
    pub unused_borrow_fee_numer: u64,
    pub instaswap_fee_numer: u64,

    pub liquidate_count: u64,

    pub peg_treasury: Pubkey,

    /// extra space
    pub reserved: [u64; 15],
}
