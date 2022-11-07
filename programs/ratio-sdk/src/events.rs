use anchor_lang::prelude::*;
//normal user action

#[event]
pub struct UserEvent {
    pub mint: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub coll_price: u64,
    pub total_coll: u64,
    pub total_debt: u64,
    #[index]
    pub action: String,
}

#[event]
pub struct LiquidationStarted {
    pub mint: Pubkey,
    pub user: Pubkey,
    pub liquidate_id: u64,
    pub liquidate_amount: u64,
    pub liquidate_burn: u64,
    pub coll_price: u64,
    pub total_coll: u64,
    pub total_debt: u64,
    pub timestamp: i64,
}

#[event]
pub struct LiquidatedAsset {
    pub mint: Pubkey,
    pub user: Pubkey,
    pub liquidate_id: u64,
    pub asset_mint: Pubkey,
    pub asset_amount: u64,
}

#[event]
pub struct ExecutedInternalIx {
    pub mint: Pubkey,
    pub user: Pubkey,
    pub liquidate_id: u64,
}

#[event]
pub struct InsufficientLiquidation {
    pub mint: Pubkey,
    pub user: Pubkey,
    pub liquidate_id: u64,
    pub liquidate_amount: u64,
    pub asset_amount: u64,
    pub liquidate_burn: u64,
    pub liquidate_mint: Pubkey,
}

#[event]
pub struct LiquidationEnded {
    pub mint: Pubkey,
    pub user: Pubkey,
    pub liquidate_id: u64,
    pub liquidate_fee: u64,
    pub liquidate_amount: u64,
    pub liquidate_burn: u64,
    pub liquidate_mint: Pubkey,
}

#[event]
pub struct HarvestEvent {
    pub mint: Pubkey,
    pub user: Pubkey,
    #[index]
    pub reward: Pubkey,
    pub amount: u64,
}

//admin action
#[event]
pub struct ReportedPrice {
    pub mint: Pubkey,
    pub market_price: u64,
    pub fair_price: u64,
}

#[event]
pub struct FundedRatio {
    pub amount: u64,
    pub duration: i64,
}

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
