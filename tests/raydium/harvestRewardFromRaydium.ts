// anchor/solana
import {
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
import { GlobalState } from "../interfaces/GlobalState";
  
  // init
  const programRatioLending = workspace.RatioLending as Program<RatioLending>;
  
  /**
   * * we have params and their classes like this so we can guarantee-
   *     we are passing in the right values
   * zhaohui wrote this
   */
  const harvestRewardFromRaydiumCall = async (
    userConnection: Connection,
    userWallet: Wallet,
    vaultKey: PublicKey,
    pool: RaydiumStablePool,
    globalState: GlobalState,
    ataRatioTreasury: PublicKey,
  ) => {
    const ataCollatKey = pool.getVaultAtaCollatKey(userWallet.publicKey)
    const ataRewardKey = pool.getVaultAtaRewardKey(userWallet.publicKey)
    const ataRewardBKey = pool.getVaultAtaRewardBKey(userWallet.publicKey)
    const stakerInfo = await pool.getStakerInfoKey(userWallet.publicKey)
    const treasuryBalPre = Number(
      (await userConnection.getTokenAccountBalance(ataRatioTreasury)).value.amount
    );
    const txn = new Transaction().add(
      programRatioLending.instruction.harvestRewardsFromRaydium({
        accounts: {
          globalState: globalState.pubKey,
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
          clock: SYSVAR_CLOCK_PUBKEY,
          ataRatioTreasury,
        },
      })
    );
  
    await handleTxn(txn, userConnection, userWallet);
    const treasuryBalPost = Number(
      (await userConnection.getTokenAccountBalance(ataRatioTreasury)).value.amount
    );
    const harvestFee = treasuryBalPost - treasuryBalPre;
    console.log("Raydium harvestFee =", harvestFee);
  };
  
  export const harvestRewardFromRaydiumPASS = async (
    user: User,
    treasury: User,
    accounts: Accounts
  ) => {
  
    await harvestRewardFromRaydiumCall(
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // vault
      accounts.raydiumUsdcUsdtPool.getVaultKey(user.wallet.publicKey),
      // pool
      accounts.raydiumUsdcUsdtPool,
      accounts.global,
      treasury.tokens.rayAta,
    );
  };
  