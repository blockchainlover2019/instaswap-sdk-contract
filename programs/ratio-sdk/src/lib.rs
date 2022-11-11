// libraries
use anchor_lang::prelude::*;
// local imports
pub mod constants;
pub mod enums;
pub mod errors;
pub mod instructions;
pub mod states;
pub mod utils;
pub mod events;
// crates
use crate::instructions::*;

declare_id!("5Exy8rs5vusEwFCGHUVZAEo9QtpcTne9ni9jukH2AHB8");

#[program]
pub mod ratio_sdk {
    use super::*;

    /**
     * Add liqudity to saber, cut fee here.
     */
     pub fn add_liquidity_to_saber(
        ctx: Context<AddLiquidityToSaber>,
        old_amount_a: u64,
        old_amount_b: u64
    ) -> Result<()> {
        add_liquidity_to_saber::handle(ctx, old_amount_a, old_amount_b)
    }
    
    /**
     * Remove liqudity to saber, cut fee here.
     */
    pub fn remove_liquidity_from_saber(
      ctx: Context<RemoveLiquidityFromSaber>,
      lp_amount_to_unwind: u64,
    ) -> Result<()> {
        remove_liquidity_from_saber::handle(ctx, lp_amount_to_unwind)
    }
    
    /**
     * Add liqudity to raydium
     */
    pub fn add_liquidity_to_raydium(
        ctx: Context<AddLiquidityToRaydium>,
        version: u8,
        old_amount_a: u64,
        old_amount_b: u64,
    ) -> Result<()> {
        add_liquidity_to_raydium::handle(ctx, version, old_amount_a, old_amount_b)
    }

    /**
     * Remove Liquidity from Raydium v5, cut fee here.
     */
    pub fn remove_liquidity_from_raydium_v5(
        ctx: Context<RemoveLiquidityFromRaydiumV5>,
        lp_amount_to_unwind: u64,
    ) -> Result<()> {
        remove_liquidity_from_raydium_v5::handle(ctx, lp_amount_to_unwind)
    }

    /**
     * Remove Liquidity from Raydium v4, cut fee here.
     */
    pub fn remove_liquidity_from_raydium_v4(
        ctx: Context<RemoveLiquidityFromRaydiumV4>,
        lp_amount_to_unwind: u64,
    ) -> Result<()> {
        remove_liquidity_from_raydium_v4::handle(ctx, lp_amount_to_unwind)
    }

    /**
     * adding decimals via saber add decimals program
     */
    pub fn wrap_decimals_token(
      ctx: Context<WrapDecimalsToken>,
      old_amount: u64,
    ) -> Result<()> {
      wrap_decimals_token::handle(ctx, old_amount)
    }

    /**
     * removing decimals via saber add decimals program
     */
    pub fn unwrap_decimals_token(
      ctx: Context<WrapDecimalsToken>,
      old_amount: u64,
    ) -> Result<()> {
      unwrap_decimals_token::handle(ctx, old_amount)
    }

}
