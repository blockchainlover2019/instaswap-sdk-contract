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

    #[msg("Transfer amount is invalid")]
    InvalidTransferAmount,

    #[msg("Invalid platform type")]
    InvalidPlatformType,

    #[msg("Invalid platform, should be Saber")]
    InvalidSaberPlatformType,
}
