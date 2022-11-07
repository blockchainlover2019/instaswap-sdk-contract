// modules
use anchor_lang::prelude::*;
// local
use crate::{errors::RatioLendingError, states::*};
pub fn assert_tvl_allowed(tvl_limit: u64, tvl: u64, amount: u64) -> Result<()> {
    let new_tvl = tvl.checked_add(amount).unwrap();

    // check if the new tvl is within tvl range
    if tvl_limit < new_tvl {
        return Err(RatioLendingError::GlobalTVLExceeded.into());
    }

    Ok(())
}

pub fn is_global_state_paused(global_state: &Account<GlobalState>) -> Result<()> {
    require!(global_state.paused == 0, RatioLendingError::NotAllowed);

    Ok(())
}

#[derive(Clone)]
pub struct CollateralPrice{
    pub fair_price: u64,
    pub virtual_price: u64
}


pub fn calc_token_value(token_amount: u64, token_price: u64, mint_decimals: u8) -> Result<u128> {
    let amount = (token_price as u128)
        .checked_mul(token_amount as u128)
        .unwrap()
        .checked_div(10u128.checked_pow(mint_decimals as u32).unwrap())
        .unwrap();

    Ok(amount)
}
pub fn bump(seeds:&[&[u8]], program_id: &Pubkey) -> u8 {
    let (_found_key, bump) = Pubkey::find_program_address(seeds, program_id);
    bump
}
