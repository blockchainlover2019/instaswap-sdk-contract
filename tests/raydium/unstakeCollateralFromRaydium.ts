// anchor/solana
import {
    BN,
    Program,
    Wallet,
    workspace,
  } from "@project-serum/anchor";
  import {
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  import { Connection, PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
  import { RatioLending } from "../../target/types/ratio_lending";
  import { getAssocTokenAcct, handleTxn } from "../utils/fxns";
  // interfaces
  import { Accounts } from "../config/accounts";
  import { User } from "../interfaces/user";
  import { RaydiumStablePool } from "../interfaces/pool";
import { SYSTEM_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { DECIMALS_USDCUSDT_RAYDIUM } from "../utils/constants";
import { GlobalState } from "../interfaces/GlobalState";
  
  // init
  const programRatioLending = workspace.RatioLending as Program<RatioLending>;
  
  /**
   * * we have params and their classes like this so we can guarantee-
   *     we are passing in the right values
   * zhaohui wrote this
   */
  const unstakeFromRaydiumCall = async (
    userConnection: Connection,
    userWallet: Wallet,
    globalState: GlobalState,
    vaultKey: PublicKey,
    pool: RaydiumStablePool,
    ataRewardTreasury: PublicKey,
    unstakeAmount: number,
  ) => {
    const ataCollatKey = pool.getVaultAtaCollatKey(userWallet.publicKey)
    const ataRewardKey = pool.getVaultAtaRewardKey(userWallet.publicKey)
    const ataRewardBKey = pool.getVaultAtaRewardBKey(userWallet.publicKey)
    const stakerInfo = await pool.getStakerInfoKey(userWallet.publicKey)
    const txn = new Transaction().add(
      programRatioLending.instruction.unstakeCollateralFromRaydium(new BN(unstakeAmount), {
        accounts: {
          authority: userWallet.publicKey,
          globalState: globalState.pubKey,
          ataRewardTreasury,
          pool: pool.pubKey,
          vault: vaultKey,
          raydiumProgram: pool.farmPid,
          stakePool: pool.farmId,
          poolAuthority: pool.farmAuthority,
          stakerInfo,
          ataCollatVault: ataCollatKey,
          vaultLpToken: pool.lpTokenAcc,
          destRewardTokenA: ataRewardKey,
          vaultRewardTokenA: pool.rewardTokenAcc,
          destRewardTokenB: ataRewardBKey,
          vaultRewardTokenB: pool.rewardBTokenAcc,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY
        },
      })
    );
  
    await handleTxn(txn, userConnection, userWallet);
  };
  
  export const unstakeCollateralFromRaydiumPASS = async (
    user: User,
    treasury: User,
    accounts: Accounts
  ) => {
    const unstakeAmountUi = 0.2;
    const unstakeAmountPrecise = unstakeAmountUi * 10 ** DECIMALS_USDCUSDT_RAYDIUM;
    
    const preRewardTreasuryBal = (await user.provider.connection.getTokenAccountBalance(
      treasury.tokens.rayAta
    )).value.uiAmount;

    await unstakeFromRaydiumCall(
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // global state
      accounts.global,
      // vault
      accounts.raydiumUsdcUsdtPool.getVaultKey(user.wallet.publicKey),
      // pool
      accounts.raydiumUsdcUsdtPool,
      // ataRewardTreasury
      treasury.tokens.rayAta,
      unstakeAmountPrecise
    );
    
    const postRewardTreasuryBal = (await user.provider.connection.getTokenAccountBalance(
      treasury.tokens.rayAta
    )).value.uiAmount;
    
    console.log("reward amount changes in treasury: ", postRewardTreasuryBal - preRewardTreasuryBal);
  };
  