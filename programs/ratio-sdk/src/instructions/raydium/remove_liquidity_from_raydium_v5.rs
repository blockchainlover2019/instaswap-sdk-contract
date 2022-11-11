// libraries
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use raydium_contract_instructions::stable_instruction::withdraw;
use anchor_lang::{ 
  solana_program::{
    program::invoke,
    borsh::{
        try_from_slice_unchecked
    }
  }
};

// local
use crate::{
    constants::*,
    events::{InstaswapReverseEvent},
    states::GlobalState,
    errors::*
};

use std::str::FromStr;

/// remove liquidity from raydium pool v5 and cut fees
pub fn handle(ctx: Context<RemoveLiquidityFromRaydiumV5>, lp_amount_to_unwind: u64) -> Result<()> {
    let accts = ctx.accounts;
    
    let global_state = GlobalState::deserialize(&mut &accts.global_state.try_borrow_data()?[8..]).unwrap();
    let treasury = global_state.treasury;
    require!(accts.ata_treasury_a.owner == treasury
      && accts.ata_treasury_b.owner == treasury, RatioLendingError::InvalidAccountInput);
  
    let token_a_amount_before = accts.ata_user_a.amount;
    let token_b_amount_before = accts.ata_user_b.amount;

    let withdraw_ix = withdraw(
        &accts.raydium_stable_amm_program.key(),
        &accts.amm_id.key(),
        &accts.amm_authority.key(),
        &accts.amm_open_orders.key(),
        &accts.amm_target_orders.key(),
        &accts.amm_lp_mint.key(),
        &accts.amm_reserve_a.key(),
        &accts.amm_reserve_b.key(),
        &accts.model_data.key(),
        &accts.serum_program.key(),
        &accts.serum_market.key(),
        &accts.serum_coin_vault.key(),
        &accts.serum_pc_vault.key(),
        &accts.serum_vault_signer.key(),
        &accts.ata_user_lp.key(),
        &accts.ata_user_a.key(),
        &accts.ata_user_b.key(),
        &accts.authority.key(),
        None,
        Some(&accts.serum_event_q.key()),
        Some(&accts.serum_bids.key()),
        Some(&accts.serum_asks.key()),
        lp_amount_to_unwind,
    )?;

    invoke(
        &withdraw_ix,
        &[
            accts.token_program.to_account_info(),
            accts.amm_id.to_account_info(),
            accts.amm_authority.to_account_info(),
            accts.amm_open_orders.to_account_info(),
            accts.amm_target_orders.to_account_info(),
            accts.amm_lp_mint.to_account_info(),
            accts.amm_reserve_a.to_account_info(),
            accts.amm_reserve_b.to_account_info(),
            accts.model_data.to_account_info(),
            accts.serum_program.to_account_info(),
            accts.serum_market.to_account_info(),
            accts.serum_coin_vault.to_account_info(),
            accts.serum_pc_vault.to_account_info(),
            accts.serum_vault_signer.to_account_info(),
            accts.ata_user_lp.to_account_info(),
            accts.ata_user_a.to_account_info(),
            accts.ata_user_b.to_account_info(),
            accts.authority.to_account_info(),
            accts.serum_event_q.to_account_info(),
            accts.serum_bids.to_account_info(),
            accts.serum_asks.to_account_info(),
            accts.raydium_stable_amm_program.to_account_info(),
        ],
    )?;

    accts.ata_user_a.reload()?;
    accts.ata_user_b.reload()?;

    let token_a_amount_after = accts.ata_user_a.amount;
    let token_b_amount_after = accts.ata_user_b.amount;

    let mut output_a_amount = token_a_amount_after
        .checked_sub(token_a_amount_before)
        .unwrap();
    let mut output_b_amount = token_b_amount_after
        .checked_sub(token_b_amount_before)
        .unwrap();
        
    let fee_number = global_state.instaswap_fee_numer as u128;
    let fee_deno = global_state.fee_deno as u128;

    let fee_amount_token_a = u128::from(output_a_amount)
        .checked_mul(fee_number)
        .unwrap()
        .checked_div(fee_deno)
        .unwrap() as u64;

    let fee_amount_token_b = u128::from(output_b_amount)
        .checked_mul(fee_number)
        .unwrap()
        .checked_div(fee_deno)
        .unwrap() as u64;

    token::transfer(accts.collect_fee_token_a(), fee_amount_token_a)?;
    token::transfer(accts.collect_fee_token_b(), fee_amount_token_b)?;

    output_a_amount = output_a_amount.checked_sub(fee_amount_token_a).unwrap();
    output_b_amount = output_b_amount.checked_sub(fee_amount_token_b).unwrap();

    emit!(InstaswapReverseEvent {
        user_wallet: accts.authority.key(),
        token_a_mint: accts.ata_user_a.mint.key(),
        token_b_mint: accts.ata_user_b.mint.key(),
        fee_amount_token_a,
        fee_amount_token_b,
        pool_mint: accts.amm_lp_mint.key(),
        platform_name: "RAYDIUM".to_string(),
        output_a_amount,
        output_b_amount,
        input_lp_amount: lp_amount_to_unwind
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveLiquidityFromRaydiumV5<'info> {
    pub authority: Signer<'info>,

    #[account(
      seeds = [GLOBAL_STATE_SEED.as_ref()],
      bump,
      seeds::program = Pubkey::from_str(RATIO_PROGRAM_ID).unwrap(),
      constraint = *global_state.to_account_info().owner == Pubkey::from_str(RATIO_PROGRAM_ID).unwrap()
    )]
    /// CHECK: global_state in ratio
    pub global_state: AccountInfo<'info>,

    #[account(
        mut,
        token::mint = amm_reserve_a.mint
    )]
    pub ata_treasury_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = amm_reserve_b.mint
    )]
    pub ata_treasury_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = amm_lp_mint,
        associated_token::authority = authority
    )]
    pub ata_user_lp: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = amm_reserve_a.mint,
        associated_token::authority = authority,
    )]
    pub ata_user_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = amm_reserve_b.mint,
        associated_token::authority = authority
    )]
    pub ata_user_b: Box<Account<'info, TokenAccount>>,

    /// CHECK: raydium will check
    #[account(mut)]
    pub amm_id: AccountInfo<'info>,
    /// CHECK: raydium will check
    pub amm_authority: AccountInfo<'info>,
    /// CHECK: raydium will check
    #[account(mut)]
    pub amm_open_orders: AccountInfo<'info>,
    /// CHECK: raydium will check
    #[account(mut)]
    pub amm_target_orders: AccountInfo<'info>,
    /// CHECK: raydium will check
    pub model_data: AccountInfo<'info>,
    /// CHECK: raydium will check.
    #[account(mut)]
    pub amm_lp_mint: Box<Account<'info, Mint>>,

    // for pool USDT-USDC, this will be USDT Mint
    #[account(
        mut,
        token::mint = serum_coin_vault.mint,
        token::authority = amm_authority
    )]
    pub amm_reserve_a: Box<Account<'info, TokenAccount>>,

    // for pool USDT-USDC, this will be USDC Mint
    #[account(
        mut,
        token::mint = serum_pc_vault.mint,
        token::authority = amm_authority
    )]
    pub amm_reserve_b: Box<Account<'info, TokenAccount>>,

    /// CHECK: Serum will check
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,
    // for pool USDT-USDC, this will be USDC
    #[account(
        mut,
        token::authority = serum_vault_signer
    )]
    pub serum_pc_vault: Box<Account<'info, TokenAccount>>,
    // for pool USDT-USDC, this will be USDT
    #[account(
        mut,
        token::authority = serum_vault_signer
    )]
    pub serum_coin_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: Serum will check
    #[account(mut)]
    pub serum_event_q: AccountInfo<'info>,
    /// CHECK: Serum will check
    #[account(mut)]
    pub serum_bids: AccountInfo<'info>,
    /// CHECK: Serum will check
    #[account(mut)]
    pub serum_asks: AccountInfo<'info>,
    /// CHECK: Serum will check
    pub serum_vault_signer: AccountInfo<'info>,

    /// CHECK: Raydium will check
    pub raydium_stable_amm_program: AccountInfo<'info>,
    /// CHECK: Raydium will check
    pub serum_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> RemoveLiquidityFromRaydiumV5<'info> {
    fn collect_fee_token_a(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ata_user_a.to_account_info(),
                to: self.ata_treasury_a.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
    fn collect_fee_token_b(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ata_user_b.to_account_info(),
                to: self.ata_treasury_b.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
}
