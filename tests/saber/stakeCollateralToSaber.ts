// anchor/solana
import {
  IdlAccounts,
  Program,
  Wallet,
  workspace,
} from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Transaction } from "@solana/web3.js";
// quarry
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// utils
import { assert, expect } from "chai";
import { RatioLending } from "../../target/types/ratio_lending";
import { DECIMALS_USD, DECIMALS_USDCUSDT } from "../utils/constants";
import { handleTxn } from "../utils/fxns";
// interfaces
import { Accounts } from "../config/accounts";
import { MintPubKey } from "../utils/interfaces";
import { User } from "../interfaces/user";
import { Miner } from "../interfaces/miner";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
import { QuarryClass } from "../interfaces/quarry";
import { GlobalState } from "../interfaces/GlobalState";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 * zhaohui wrote this
 */
const stakeToSaberCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  tokenCollatUser: TokenCollatUser,
  vault: Vault,
  mintPubKey: MintPubKey,
  pool: Pool,
  globalState: GlobalState,
  quarry: QuarryClass,
  miner: Miner,
) => {
  const userBal = (await tokenCollatUser.ata.getBalance()).value.amount;
  console.log("ata balance: ", userBal);
  const txn = new Transaction().add(
    programRatioLending.instruction.stakeCollateralToSaber(null, {
      accounts: {
        authority: userWallet.publicKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        miner: miner.pubkey,
        ataCollatVault: vault.ataCollat.pubKey,
        ataCollatMiner: miner.ata.pubKey,
        quarry: quarry.pubkey,
        rewarder: quarry.rewarder,
        quarryProgram: QUARRY_ADDRESSES.Mine,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const stakeCollateralToSaberPASS = async (
  user: User,
  accounts: Accounts
) => {
  const amountToStakeUi = 0.2;
  const amountToStakePrecise = amountToStakeUi * 10 ** DECIMALS_USDCUSDT;
  const priceUsd = 1; // TODO: fix price feed
  const globalStateAcct: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();

  const userlpSaber = user.tokens.lpSaber;

  // const tvlPre = globalStateAcct.tvlUsd.toNumber();
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPre = Number(
    (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  );

  assert(
    userBalPre >= amountToStakePrecise,
    "Test requires ATA balance to be >= deposit amount. Please decrease deposit amount" +
      `\n ATA Balance: ${userBalPre} < Stake Amount: ${amountToStakePrecise}`
  );

  // TODO: get the real world oracle values from here, make a query
  assert(
    amountToStakePrecise * priceUsd +
      globalStateAcct.tvlUsd.toNumber() / 10 ** DECIMALS_USD <
      globalStateAcct.tvlCollatCeilingUsd.toNumber() / 10 ** DECIMALS_USD,
    "Amount attempting to deposit will exceed TVL limit. Please decrease amountToStakePrecise.\n" +
      `\nDeposit Amount USD: ${amountToStakePrecise * priceUsd}` +
      `\nTVL: ${globalStateAcct.tvlUsd.toNumber() / 10 ** DECIMALS_USD}` +
      `\nTVL Limit: ${
        globalStateAcct.tvlCollatCeilingUsd.toNumber() / 10 ** DECIMALS_USD
      }`
  );

  await stakeToSaberCall(
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    user.tokens.lpSaber,
    // vault
    user.tokens.lpSaber.vault,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global,
    // quarry-mine quarry
    accounts.lpSaberUsdcUsdt.pool.quarry,
    ///quarry-mine miner of vault
    user.tokens.lpSaber.vault.miner
  );

  const userBalPost = (await userlpSaber.ata.getBalance()).value.uiAmount;
  const vaultBalPost = (await userlpSaber.vault.ataCollat.getBalance()).value
    .uiAmount;
  const userDiff = userBalPost - userBalPre;

  console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  console.log(`vault balance: ${vaultBalPre} -> ${vaultBalPost}`);
  // console.log(`farm balance: ${quarryBalPre} -> ${quarryBalPost}`);

  const differenceThreshold = 0.0001; // set arbitrarily
  // assert(
  //   Math.abs(amountToStakePrecise + userDiff) < differenceThreshold,
  //   "Expected User ATA Diff: " +
  //     -amountToStakePrecise +
  //     " Actual User ATA Diff: " +
  //     userDiff
  // );
  // assert(
  //   vaultBalPost.toFixed() == "0",
  //   "Expected vault ata balance to be zero"
  // );
};

export const stakeCollateralToSaberFAIL_ToOtherMiner = async (
  user: User,
  otherUser: User,
  accounts: Accounts
) => {
  const amountToStakeUi = 0.2;
  const amountToStakePrecise = amountToStakeUi * 10 ** DECIMALS_USDCUSDT;
  const priceUsd = 1; // TODO: fix price feed
  const globalStateAcct: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();

  const userlpSaber = user.tokens.lpSaber;

  // const tvlPre = globalStateAcct.tvlUsd.toNumber();
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPre = Number(
    (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  );

  assert(
    userBalPre >= amountToStakePrecise,
    "Test requires ATA balance to be >= deposit amount. Please decrease deposit amount" +
      `\n ATA Balance: ${userBalPre} < Stake Amount: ${amountToStakePrecise}`
  );

  // TODO: get the real world oracle values from here, make a query
  assert(
    amountToStakePrecise * priceUsd +
      globalStateAcct.tvlUsd.toNumber() / 10 ** DECIMALS_USD <
      globalStateAcct.tvlCollatCeilingUsd.toNumber() / 10 ** DECIMALS_USD,
    "Amount attempting to deposit will exceed TVL limit. Please decrease amountToStakePrecise.\n" +
      `\nDeposit Amount USD: ${amountToStakePrecise * priceUsd}` +
      `\nTVL: ${globalStateAcct.tvlUsd.toNumber() / 10 ** DECIMALS_USD}` +
      `\nTVL Limit: ${
        globalStateAcct.tvlCollatCeilingUsd.toNumber() / 10 ** DECIMALS_USD
      }`
  );

  await expect(stakeToSaberCall(
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    user.tokens.lpSaber,
    // vault
    user.tokens.lpSaber.vault,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global,
    // quarry-mine quarry
    accounts.lpSaberUsdcUsdt.pool.quarry,
    ///quarry-mine miner of vault
    otherUser.tokens.lpSaber.vault.miner
  )).to.be.eventually.rejectedWith(Error).and.have.property('code', 1100);

  const userBalPost = (await userlpSaber.ata.getBalance()).value.uiAmount;
  const vaultBalPost = (await userlpSaber.vault.ataCollat.getBalance()).value
    .uiAmount;
  const userDiff = userBalPost - userBalPre;

  console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  console.log(`vault balance: ${vaultBalPre} -> ${vaultBalPost}`);
  // console.log(`farm balance: ${quarryBalPre} -> ${quarryBalPost}`);

};
