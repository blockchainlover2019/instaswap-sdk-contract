// anchor/solana
import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Transaction } from "@solana/web3.js";
// saber
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// utils
import { RatioLending } from "../../target/types/ratio_lending";
// interfaces
import { Miner } from "../interfaces/miner";
import { QuarryClass } from "../interfaces/quarry";
import { User } from "../interfaces/user";
import { MintPubKey } from "../utils/interfaces";
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
import { GlobalState } from "../interfaces/GlobalState";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export const depositAndStakeCollatCall = async (
  depositAmount: number,
  userWallet: Wallet,
  userConnection: Connection,
  globalState: GlobalState,
  pool: Pool,
  vault: Vault,
  user: User,
  collatTokenUser: TokenCollatUser,
  mintPubKey: MintPubKey,
  quarry: QuarryClass,
  miner: Miner
) => {
  const txn = new Transaction().add(
    programRatioLending.instruction.depositCollateral(new BN(depositAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        userState: user.userState.pubKey,
        vault: vault.pubKey,
        ataCollatVault: vault.ataCollat.pubKey,
        ataCollatUser: collatTokenUser.ata.pubKey,
        mintCollat: mintPubKey,
        oracleA: pool.oracles.usdc.pubKey,
        oracleB: pool.oracles.usdt.pubKey,
        swapTokenA: pool.ataMarketTokens.usdc.pubKey,
        swapTokenB: pool.ataMarketTokens.usdt.pubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );
  txn.add(
    programRatioLending.instruction.stakeCollateralToSaber(null, {
      accounts: {
        authority: userWallet.publicKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataCollatVault: vault.ataCollat.pubKey,
        ataCollatMiner: miner.ata.pubKey,
        quarry: quarry.pubkey,
        miner: miner.pubkey,
        rewarder: quarry.rewarder,
        quarryProgram: QUARRY_ADDRESSES.Mine,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  // send the txn
  await handleTxn(txn, userConnection, userWallet);
};

export const depositAndStakeCollatPASS = async (
  user: User,
  accounts: Accounts,
  depositAmt
) => {
  await depositAndStakeCollatCall(
    depositAmt,
    user.wallet,
    user.provider.connection,
    accounts.global,
    accounts.lpSaberUsdcUsdt.pool,
    user.tokens.lpSaber.vault,
    user,
    user.tokens.lpSaber,
    accounts.lpSaberUsdcUsdt.mint,
    accounts.lpSaberUsdcUsdt.pool.quarry,
    user.tokens.lpSaber.vault.miner
  );
};
