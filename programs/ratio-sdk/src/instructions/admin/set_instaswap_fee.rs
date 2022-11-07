// libraries
use anchor_lang::prelude::*;
// local
use crate::{constants::*, states::GlobalState};

pub fn handle(ctx: Context<SetInstaswapFee>, fee_num: u64) -> Result<()> {
    ctx.accounts.global_state.instaswap_fee_numer = fee_num;

    Ok(())
}

#[derive(Accounts)]
pub struct SetInstaswapFee<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        has_one = authority
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
}
