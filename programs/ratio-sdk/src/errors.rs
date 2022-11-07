use anchor_lang::prelude::*;

#[error_code]
pub enum RatioLendingError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("AlreadyInUse")]
    AlreadyInUse,

    #[msg("InvalidProgramAddress")]
    InvalidProgramAddress,

    #[msg("InvalidState")]
    InvalidState,

    #[msg("InvalidOwner")]
    InvalidOwner,

    #[msg("NotAllowed")]
    NotAllowed,

    #[msg("Math operation overflow")]
    MathOverflow,

    #[msg("InvalidOracleConfig")]
    InvalidOracleConfig,

    #[msg("InvalidAccountInput")]
    InvalidAccountInput,

    #[msg("This function works on devnet only")]
    InvalidCluster,

    #[msg("Global TVL Exceeded")]
    GlobalTVLExceeded,

    #[msg("LTV Exceeded")]
    LTVExceeded,

    #[msg("Global Debt Ceiling Exceeded")]
    GlobalDebtCeilingExceeded,

    #[msg("Pool Debt Ceiling Exceeded")]
    PoolDebtCeilingExceeded,

    #[msg("User Debt Ceiling Exceeded")]
    UserDebtCeilingExceeded,

    #[msg("Can't withdraw due to debt")]
    WithdrawNotAllowedWithDebt,

    #[msg("Transfer amount is invalid")]
    InvalidTransferAmount,

    #[msg("Invalid platform type")]
    InvalidPlatformType,

    #[msg("Invalid platform, should be Saber")]
    InvalidSaberPlatformType,

    #[msg("Attempting to repay more than the amount originally borrowed")]
    RepayingMoreThanBorrowed,

    #[msg("Reward mint account mismatch")]
    RewardMintMismatch,

    #[msg("The pool is paused by admin")]
    PoolPaused,

    #[msg("Create Raydium Ledger first")]
    LedgerNotCreated,
    
    #[msg("Invalid Funding Wallet")]
    InvalidFundingWallet,

    #[msg("Already added in BlackList")]
    AlreadyAddedBlackList,

    #[msg("Can't add to blacklist anymore")]
    ReachedBlacklistLimit,

    #[msg("Not found in BlackList")]
    NotFoundBlackList,

    #[msg("You are blocked from our smart contract")]
    BlockedFromRatioLending,

    #[msg("Liquidation is already started")]
    LiquidationAlreadyStarted,
    
    #[msg("Invalid Interal Program To Pass")]
    InvalidInternalProgramToPass,

    #[msg("Invalid USDr amount to burn")]
    InvalidUSDrAmountToBurn,

    #[msg("Liquidation isn't started")]
    NoLiquidation,

    #[msg("Debt exceeds Liquidation")]
    DebtExceededLiquidation,

    #[msg("RaydiumLedger should be created before User Vault")]
    RaydiumLedgerNotInitialized,

    #[msg("Not allowed until 1 week is passed from last interest time")]
    InterestNotAllowed,

    #[msg("Price from switchboard is stale")]
    SwitchboardStaleFeed,

    #[msg("Price from switchboard exceeds confidence interval")]
    ConfidenceIntervalExceeded,
}
