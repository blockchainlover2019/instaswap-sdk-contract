// libraries
use anchor_lang::prelude::*;
use anchor_lang::{ 
  solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
    borsh::{
        try_from_slice_unchecked
    }
  }
};
use borsh::{ BorshDeserialize };
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use crate::{constants::*, states::*, events::{InstaswapOutputEvent}, errors::*};
use raydium_contract_instructions::stable_instruction::{
  AmmInstruction,
  DepositInstruction,
};
use std::str::FromStr;
pub fn handle(
    ctx: Context<AddLiquidityToRaydium>, 
    version: u8,
    old_amount_a: u64,
    old_amount_b: u64
) -> Result<()> {
    let accts = ctx.accounts;
    
    // let global_state = try_from_slice_unchecked::<GlobalState>(&accts.global_state.try_borrow_data()?)?;
    let global_state = Box::new(GlobalState::deserialize(&mut &accts.global_state.try_borrow_data()?[8..]).unwrap());
    
    require!(accts.ata_token_a_treasury.owner == global_state.treasury 
      && accts.ata_token_b_treasury.owner == global_state.treasury, RatioLendingError::InvalidAccountInput);

    let mut token_a_amount = accts.ata_user_token_a.amount.checked_sub(old_amount_a).unwrap();
    let mut token_b_amount = accts.ata_user_token_b.amount.checked_sub(old_amount_b).unwrap();

    // cut fee
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

    token_a_amount = token_a_amount.checked_sub(fee_amount_token_a).unwrap();
    token_b_amount = token_b_amount.checked_sub(fee_amount_token_b).unwrap();

    token::transfer(accts.collect_fee_token_a(), fee_amount_token_a)?;
    token::transfer(accts.collect_fee_token_b(), fee_amount_token_b)?;
    // calculate adding amounts
    let amm_info = accts.amm_id.try_borrow_data()?;

    let base_need_take_pnl;
    let quote_need_take_pnl;

    if version == 4 {
      let parsed_amm_info_v4 = Box::new(try_from_slice_unchecked::<RaydiumLiquidityStateV4>(&amm_info)?);
      base_need_take_pnl = parsed_amm_info_v4.base_need_take_pnl;
      quote_need_take_pnl = parsed_amm_info_v4.quote_need_take_pnl;
    } else {
      let parsed_amm_info_v5 = Box::new(try_from_slice_unchecked::<RaydiumLiquidityStateV5>(&amm_info)?);
      base_need_take_pnl = parsed_amm_info_v5.base_need_take_pnl;
      quote_need_take_pnl = parsed_amm_info_v5.quote_need_take_pnl;
    }

    let orders_info = accts.amm_open_orders.try_borrow_data()?;
    let parsed_orders_info: SerumMarketOpenOrders = try_from_slice_unchecked::<SerumMarketOpenOrders>(&orders_info)?;

    let real_reserve_a = accts.reserve_token_a.amount
        .checked_add(parsed_orders_info.base_token_total)
        .unwrap()
        .checked_sub(base_need_take_pnl)
        .unwrap();
    let real_reserve_b = accts.reserve_token_b.amount
        .checked_add(parsed_orders_info.quote_token_total)
        .unwrap()
        .checked_sub(quote_need_take_pnl)
        .unwrap();

    let constant_slippage = 1;
    let constant_slippage_deno = 1000;

    let expected_token_b_amt = u128::from(token_a_amount)
        .checked_mul(real_reserve_b as u128)
        .unwrap()
        .checked_div(real_reserve_a as u128)
        .unwrap()
        .checked_mul(constant_slippage_deno + constant_slippage)
        .unwrap()
        .checked_div(constant_slippage_deno)
        .unwrap() as u64;

    if expected_token_b_amt > token_b_amount {
        token_a_amount = u128::from(token_b_amount)
            .checked_mul(real_reserve_a as u128)
            .unwrap()
            .checked_div(real_reserve_b as u128)
            .unwrap()
            .checked_mul(constant_slippage_deno)
            .unwrap()
            .checked_div(constant_slippage_deno + constant_slippage)
            .unwrap() as u64;
    } else {
        token_b_amount = expected_token_b_amt;
    }

    drop(amm_info);
    drop(orders_info);

    let ata_user_token_lp_amount_before = accts.ata_user_token_lp.amount;
    
    msg!("token amounts = {:?}, {:?}", token_a_amount, token_b_amount);

    let data = AmmInstruction::Deposit(DepositInstruction {
      max_coin_amount: token_a_amount,
      max_pc_amount: token_b_amount,
      base_side: 0,
    })
    .pack()?;
    let mut accounts = vec![
        // spl token
        AccountMeta::new_readonly(spl_token::id(), false),
        // amm
        AccountMeta::new(accts.amm_id.key(), false),
        AccountMeta::new_readonly(accts.amm_authority.key(), false),
        AccountMeta::new_readonly(accts.amm_open_orders.key(), false),
        AccountMeta::new(accts.amm_target_orders.key(), false),
        AccountMeta::new(accts.pool_mint.key(), false),
        AccountMeta::new(accts.reserve_token_a.key(), false),
        AccountMeta::new(accts.reserve_token_b.key(), false),
    ];
    if version == 5 {
      accounts.push(AccountMeta::new_readonly(accts.model_data.key(), false));
    }
    accounts.extend([
        // serum
        AccountMeta::new_readonly(accts.serum_market.key(), false),
        // user
        AccountMeta::new(accts.ata_user_token_a.key(), false),
        AccountMeta::new(accts.ata_user_token_b.key(), false),
        AccountMeta::new(accts.ata_user_token_lp.key(), false),
        AccountMeta::new_readonly(accts.authority.key(), true),
    ]);
    
    let mut account_info_vec = vec![
      accts.token_program.to_account_info(),
      accts.amm_id.to_account_info(),
      accts.amm_authority.to_account_info(),
      accts.amm_open_orders.to_account_info(),
      accts.amm_target_orders.to_account_info(),
      accts.pool_mint.to_account_info(),
      accts.reserve_token_a.to_account_info(),
      accts.reserve_token_b.to_account_info()
    ];
    if version == 5 {
      account_info_vec.push(accts.model_data.to_account_info());
    }
    account_info_vec.extend([
      accts.serum_market.to_account_info(),
      accts.ata_user_token_a.to_account_info(),
      accts.ata_user_token_b.to_account_info(),
      accts.ata_user_token_lp.to_account_info(),
      accts.authority.to_account_info(),
      accts.raydium_swap_program.to_account_info(),
    ]);
    invoke(
        &Instruction {
          program_id: accts.raydium_swap_program.key(),
          accounts,
          data
        },
        &account_info_vec
    )?;

    accts.ata_user_token_lp.reload()?;
    let ata_user_token_lp_amount_after = accts.ata_user_token_lp.amount;
    let output_lp_amount = ata_user_token_lp_amount_after.checked_sub(ata_user_token_lp_amount_before).unwrap();

    emit!(InstaswapOutputEvent {
        user_wallet: accts.authority.key(),
        token_a_mint: accts.token_a.key(),
        token_b_mint: accts.token_b.key(),
        fee_amount_token_a,
        fee_amount_token_b,
        pool_mint: accts.pool_mint.key(),
        platform_name: "RAYDIUM".to_string(),
        output_lp_amount,
    });

    Ok(())
}

#[derive(Debug, BorshDeserialize)]
pub struct RaydiumLiquidityStateV5 {
    pub padding: [u64; 28],
    pub base_need_take_pnl: u64,
    pub quote_need_take_pnl: u64
}

#[derive(Debug, BorshDeserialize)]
pub struct RaydiumLiquidityStateV4 {
    pub padding: [u64; 24],
    pub base_need_take_pnl: u64,
    pub quote_need_take_pnl: u64
}

#[derive(BorshDeserialize)]
#[repr(packed)]
pub struct SerumMarketOpenOrders {
    pub padding: [u8; 13],
    pub market: Pubkey,
    pub owner: Pubkey,
    pub base_token_free: u64,
    pub base_token_total: u64,
    pub quote_token_free: u64,
    pub quote_token_total: u64,
}

impl<'info> AddLiquidityToRaydium<'info> {
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
pub struct AddLiquidityToRaydium<'info> {
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

    #[account(mut)]
    /// CHECK: raydium will check
    pub amm_id: AccountInfo<'info>,
    /// CHECK: raydium will check
    pub amm_authority: AccountInfo<'info>,
    /// CHECK: raydium will check
    pub amm_open_orders: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: raydium will check
    pub amm_target_orders: AccountInfo<'info>,

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

    #[account(mut)]
    /// CHECK: raydium will check
    pub pool_mint: AccountInfo<'info>,

    #[account(mut)]
    pub token_a: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub token_b: Box<Account<'info, Mint>>,

    /// CHECK: raydium will check
    pub model_data: AccountInfo<'info>,
    /// CHECK: raydium will check
    pub serum_market: AccountInfo<'info>,
    /// CHECK: raydium will check
    pub raydium_swap_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>
}