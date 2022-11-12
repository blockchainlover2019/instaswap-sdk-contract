// libraries
use anchor_lang::prelude::*;

use stable_swap_anchor::{deposit, Deposit, SwapUserContext, SwapToken};
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use crate::{constants::*, states::*, events::{InstaswapOutputEvent}, errors::*};

use std::str::FromStr;

pub fn handle(
    ctx: Context<AddLiquidityToSaber>, 
    old_amount_a: u64, 
    old_amount_b: u64
) -> Result<()> {
    let accts = ctx.accounts; 
  
    let global_state = GlobalState::deserialize(&mut &accts.global_state.try_borrow_data()?[8..]).unwrap();
    require!(accts.ata_token_a_treasury.owner == global_state.treasury 
      && accts.ata_token_b_treasury.owner == global_state.treasury, RatioLendingError::InvalidAccountInput);
  
    let mut token_a_amount = accts.ata_user_token_a.amount.checked_sub(old_amount_a).unwrap();
    let mut token_b_amount = accts.ata_user_token_b.amount.checked_sub(old_amount_b).unwrap();

    let fee_amount_token_a = u128::from(token_a_amount)
        .checked_mul(global_state.instaswap_fee_numer as u128)
        .unwrap()
        .checked_div(global_state.fee_deno as u128)
        .unwrap() as u64;
    
    let fee_amount_token_b = u128::from(token_b_amount)
        .checked_mul(global_state.instaswap_fee_numer as u128)
        .unwrap()
        .checked_div(global_state.fee_deno as u128)
        .unwrap() as u64;
    
    token::transfer(accts.collect_fee_token_a(), fee_amount_token_a)?;
    token::transfer(accts.collect_fee_token_b(), fee_amount_token_b)?;
    
    token_a_amount = token_a_amount.checked_sub(fee_amount_token_a).unwrap();
    token_b_amount = token_b_amount.checked_sub(fee_amount_token_b).unwrap();

    let ata_user_token_lp_amount_before = accts.ata_user_token_lp.amount;

    deposit(
        CpiContext::new(
            accts.saber_stable_program.to_account_info(),
            Deposit {
                user: SwapUserContext {
                    token_program: accts.token_program.to_account_info(),
                    swap_authority: accts.swap_authority.to_account_info(),
                    user_authority: accts.authority.to_account_info(),
                    swap: accts.swap_account.to_account_info()
                },
                input_a: SwapToken {
                    user: accts.ata_user_token_a.to_account_info(),
                    reserve: accts.reserve_token_a.to_account_info(),
                },
                input_b: SwapToken {
                    user: accts.ata_user_token_b.to_account_info(),
                    reserve: accts.reserve_token_b.to_account_info(),
                },
                pool_mint: accts.pool_mint.to_account_info(),
                output_lp: accts.ata_user_token_lp.to_account_info(),
            }  
        ),
        token_a_amount,
        token_b_amount,
        0 //min_mint_amount
    )?;

    accts.ata_user_token_lp.reload()?;
    let ata_user_token_lp_amount_after = accts.ata_user_token_lp.amount;
    let output_lp_amount = ata_user_token_lp_amount_after.checked_sub(ata_user_token_lp_amount_before).unwrap();

    emit!(InstaswapOutputEvent {
        user_wallet: accts.authority.key(),
        pool_mint: accts.pool_mint.key(),

        token_a_mint: accts.token_a.key(),
        token_b_mint: accts.token_b.key(),
        fee_amount_token_a,
        fee_amount_token_b,

        output_lp_amount,
        platform_name: "SABER".to_string(),
    });

    Ok(())
}

impl<'info> AddLiquidityToSaber<'info> {
    fn collect_fee_token_a(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ata_user_token_a.to_account_info(),
                to: self.ata_token_a_treasury.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
    fn collect_fee_token_b(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ata_user_token_b.to_account_info(),
                to: self.ata_token_b_treasury.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
}

#[derive(Accounts)]
pub struct AddLiquidityToSaber<'info> {
    #[account(mut)]
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
        token::mint = token_a
    )]
    pub ata_token_a_treasury: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = token_b
    )]
    pub ata_token_b_treasury: Box<Account<'info, TokenAccount>>,

    #[account(
        mut, 
        associated_token::authority = authority, 
        associated_token::mint = token_a
    )]
    pub ata_user_token_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut, 
        associated_token::authority = authority, 
        associated_token::mint = token_b
    )]
    pub ata_user_token_b: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut, 
        associated_token::authority = authority, 
        associated_token::mint = pool_mint
    )]
    pub ata_user_token_lp: Box<Account<'info, TokenAccount>>,

    #[account(
        mut, 
        constraint = reserve_token_a.mint == token_a.key()
    )]
    pub reserve_token_a: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = reserve_token_b.mint == token_b.key()
    )]
    pub reserve_token_b: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub pool_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub token_a: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub token_b: Box<Account<'info, Mint>>,
    /// CHECK: saber will check
    pub swap_authority: AccountInfo<'info>,
    /// CHECK: saber will check
    pub swap_account: AccountInfo<'info>,
    /// CHECK: saber will check
    pub saber_stable_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

