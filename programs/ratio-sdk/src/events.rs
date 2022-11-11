use anchor_lang::prelude::*;
//normal user action

#[event]
pub struct InstaswapOutputEvent {
    pub user_wallet: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub fee_amount_token_a: u64,
    pub fee_amount_token_b: u64,
    pub pool_mint: Pubkey,
    pub output_lp_amount: u64,
    pub platform_name: String,
}

#[event]
pub struct InstaswapReverseEvent {
    pub user_wallet: Pubkey,
    pub pool_mint: Pubkey,
    pub input_lp_amount: u64,

    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    
    pub output_a_amount: u64,
    pub output_b_amount: u64,
    
    pub fee_amount_token_a: u64,
    pub fee_amount_token_b: u64,

    pub platform_name: String,
}
