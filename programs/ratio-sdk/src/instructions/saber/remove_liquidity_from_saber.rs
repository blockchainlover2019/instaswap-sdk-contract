// libraries
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use stable_swap_anchor::{withdraw, StableSwap, SwapOutput, SwapToken, SwapUserContext, Withdraw};
// local
use crate::{
    constants::*,
    events::{InstaswapReverseEvent},
    states::GlobalState,
    errors::*
};

use std::str::FromStr;

/// remove liquidity from saber pool and cut fees
pub fn handle(ctx: Context<RemoveLiquidityFromSaber>, lp_amount_to_unwind: u64) -> Result<()> {
    let accts = ctx.accounts;
    let global_state = GlobalState::deserialize(&mut &accts.global_state.try_borrow_data()?[8..]).unwrap();
    
    require!(accts.ata_treasury_a.owner == global_state.treasury 
      && accts.ata_treasury_b.owner == global_state.treasury, RatioLendingError::InvalidAccountInput);

    let token_a_amount_before = accts.ata_user_a.amount;
    let token_b_amount_before = accts.ata_user_b.amount;

    withdraw(
        CpiContext::new(
            accts.saber_stable_program.to_account_info(),
            Withdraw {
                input_lp: accts.ata_user_lp.to_account_info(),
                output_a: SwapOutput {
                    user_token: SwapToken {
                        user: accts.ata_user_a.to_account_info(),
                        reserve: accts.saber_swap_account.reserve_a.to_account_info(),
                    },
                    fees: accts.saber_swap_account.fee_account_a.to_account_info(),
                },
                output_b: SwapOutput {
                    user_token: SwapToken {
                        user: accts.ata_user_b.to_account_info(),
                        reserve: accts.saber_swap_account.reserve_b.to_account_info(),
                    },
                    fees: accts.saber_swap_account.fee_account_b.to_account_info(),
                },
                pool_mint: accts.saber_swap_account.lp_mint.to_account_info(),
                user: SwapUserContext {
                    token_program: accts.token_program.to_account_info(),
                    swap_authority: accts.saber_swap_account.authority.to_account_info(),
                    user_authority: accts.authority.to_account_info(),
                    swap: accts.saber_swap_account.amm_id.to_account_info(),
                },
            },
        ),
        lp_amount_to_unwind,
        0,
        0,
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

    let fee_amount_token_a = u128::from(output_a_amount)
        .checked_mul(global_state.instaswap_fee_numer as u128)
        .unwrap()
        .checked_div(global_state.fee_deno as u128)
        .unwrap() as u64;

    let fee_amount_token_b = u128::from(output_b_amount)
        .checked_mul(global_state.instaswap_fee_numer as u128)
        .unwrap()
        .checked_div(global_state.fee_deno as u128)
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
        pool_mint: accts.saber_swap_account.lp_mint.key(),
        platform_name: "SABER".to_string(),
        output_a_amount,
        output_b_amount,
        input_lp_amount: lp_amount_to_unwind
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SaberSwap<'info> {
    /// CHECK: it will be checked in the stable-swap-program
    pub amm_id: AccountInfo<'info>,
    /// CHECK: it will be checked in the stable-swap-program
    pub authority: AccountInfo<'info>,

    /// CHECK: it will be checked in the stable-swap-program
    #[account(mut)]
    pub reserve_a: Box<Account<'info, TokenAccount>>,

    /// CHECK: it will be checked in the stable-swap-program
    #[account(mut)]
    pub reserve_b: Box<Account<'info, TokenAccount>>,

    /// CHECK: it will be checked in the stable-swap-program
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    /// CHECK: it will be checked in the stable-swap-program
    #[account(mut)]
    pub fee_account_a: AccountInfo<'info>,

    /// CHECK: it will be checked in the stable-swap-program
    #[account(mut)]
    pub fee_account_b: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RemoveLiquidityFromSaber<'info> {
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
        token::mint = saber_swap_account.reserve_a.mint
    )]
    pub ata_treasury_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = saber_swap_account.reserve_b.mint
    )]
    pub ata_treasury_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = authority,
        associated_token::mint = saber_swap_account.lp_mint
    )]
    pub ata_user_lp: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = authority,
        associated_token::mint = saber_swap_account.reserve_a.mint
    )]
    pub ata_user_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = authority,
        associated_token::mint = saber_swap_account.reserve_b.mint
    )]
    pub ata_user_b: Box<Account<'info, TokenAccount>>,

    pub saber_swap_account: SaberSwap<'info>,

    pub saber_stable_program: Program<'info, StableSwap>,
    pub token_program: Program<'info, Token>,
}

impl<'info> RemoveLiquidityFromSaber<'info> {
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
