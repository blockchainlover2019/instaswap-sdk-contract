// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount},
};
use add_decimals::{ 
  ID as SaberDecimalsProgramId,
  cpi::{ 
    deposit,
    accounts::UserStake
  }
};
pub fn handle(
    ctx: Context<WrapDecimalsToken>, 
    old_amount: u64
) -> Result<()> {
    let accts = ctx.accounts; 
    let wrap_amount = accts.ata_user_underlying_token.amount.checked_sub(old_amount).unwrap();
    deposit(
      CpiContext::new(
        accts.saber_decimals_program.to_account_info(),
        UserStake {
          wrapper: accts.wrapper.to_account_info(),
          wrapper_mint: accts.wrapper_mint.to_account_info(),
          wrapper_underlying_tokens: accts.wrapper_underlying_tokens.to_account_info(),
          owner: accts.authority.to_account_info(),
          user_underlying_tokens: accts.ata_user_underlying_token.to_account_info(),
          user_wrapped_tokens: accts.ata_user_wrapped_token.to_account_info(),
          token_program: accts.token_program.to_account_info()
        }
      ),
      wrap_amount
    )?;
    Ok(())
}

#[derive(Accounts)]
pub struct WrapDecimalsToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut, 
        associated_token::authority = authority,
        associated_token::mint = underlying_mint
    )]
    pub ata_user_underlying_token: Box<Account<'info, TokenAccount>>,
      
    #[account(
      mut, 
      associated_token::authority = authority, 
      associated_token::mint = wrapper_mint
    )]
    pub ata_user_wrapped_token: Box<Account<'info, TokenAccount>>,
    /// CHECK: saber will check this
    pub wrapper: AccountInfo<'info>,
    #[account(mut)]
    pub wrapper_mint: Account<'info, Mint>,
    #[account(mut)]
    pub underlying_mint: Account<'info, Mint>,
    #[account(mut)]
    pub wrapper_underlying_tokens: Account<'info, TokenAccount>,
    #[account(address = SaberDecimalsProgramId)]
    /// CHECK: saber will check this
    pub saber_decimals_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}


