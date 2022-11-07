// libraries
use anchor_lang::prelude::*;
use add_decimals::{
  cpi::{ 
    withdraw,
    accounts::UserStake
  }
};
use crate::wrap_decimals_token::*;
pub fn handle(
    ctx: Context<WrapDecimalsToken>, 
    old_amount: u64
) -> Result<()> {
    let accts = ctx.accounts; 
    let unwrap_amount = accts.ata_user_wrapped_token.amount.checked_sub(old_amount).unwrap();
    withdraw(
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
      unwrap_amount
    )?;
    Ok(())
}

