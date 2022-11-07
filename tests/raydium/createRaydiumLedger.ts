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
  
  // init
  const programRatioLending = workspace.RatioLending as Program<RatioLending>;
  
  /**
   * * we have params and their classes like this so we can guarantee-
   *     we are passing in the right values
   * zhaohui wrote this
   */
  const createRaydiumLedgerCall = async (
    userConnection: Connection,
    userWallet: Wallet,
    vaultKey: PublicKey,
    pool: RaydiumStablePool
  ) => {
    const stakerInfo = await pool.getStakerInfoKey(userWallet.publicKey)
    
    const txn = new Transaction().add(
      programRatioLending.instruction.createRaydiumLedger({
        accounts: {
          authority: userWallet.publicKey,
          pool: pool.pubKey,
          vault: vaultKey,
          raydiumProgram: pool.farmPid,
          stakePool: pool.farmId,
          stakerInfo,
          systemProgram: SYSTEM_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
      })
    );
  
    await handleTxn(txn, userConnection, userWallet);
  };
  
  export const createRaydiumLedgerPASS = async (
    user: User,
    accounts: Accounts
  ) => {
  
    await createRaydiumLedgerCall(
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // vault
      accounts.raydiumUsdcUsdtPool.getVaultKey(user.wallet.publicKey),
      // pool
      accounts.raydiumUsdcUsdtPool,
    );
  };
  