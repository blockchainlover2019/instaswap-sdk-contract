// anchor/solana
import {
  BN,
  IdlAccounts,
  Program,
  Wallet,
  workspace,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
// utils
import { assert, expect } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import { addZeros, getAssocTokenAcct, handleTxn } from "../utils/fxns";
import { DECIMALS_PRICE, DECIMALS_USDCUSDT } from "../utils/constants";
// interfaces
import { MintPubKey } from "../utils/interfaces";
import { User } from "../interfaces/user";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
import { GlobalState } from "../interfaces/GlobalState";
import { Miner } from "../interfaces/miner";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 */
export const depositCollateralCall = async (
  amtToDeposit: number,
  userConnection: Connection,
  userWallet: Wallet,
  tokenCollatUserAta: PublicKey,
  vaultKey: PublicKey,
  ataCollatKey: PublicKey,
  mintCollatPubKey: MintPubKey,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  oracleA: PublicKey,
  oracleB: PublicKey,
  globalState: GlobalState,
  user: User
) => {
  const txn = new Transaction().add(
    programRatioLending.instruction.depositCollateral(new BN(amtToDeposit), {
      accounts: {
        authority: userWallet.publicKey, //
        globalState: globalState.pubKey, //
        pool: poolKey, //
        // user-derived accounts
        userState: user.userState.pubKey,
        vault: vaultKey, //
        // A.T.A.s
        ataCollatUser: tokenCollatUserAta, //
        ataCollatVault: ataCollatKey, //
        mintCollat: mintCollatPubKey,
        oracleA: oracleA,
        oracleB: oracleB,
        swapTokenA: tokenA,
        swapTokenB: tokenB,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const depositCollateralFAIL_NotEnoughTokens = async (
  user: User,
  accounts: Accounts,
  tokenCollatUserAta: PublicKey,
  vaultKey: PublicKey,
  ataCollatKey: PublicKey,
  mintCollatPubKey: MintPubKey,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  oracleA: PublicKey,
  oracleB: PublicKey,
  amtToDeposit: number
) => {
  // const amtToDeposit = addZeros(100000, DECIMALS_USDCUSDT);
  // const userlpSaber = user.tokens.lpSaber;
  // const ataBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  // console.log("current bal =", ataBalPre);
  // assert(
  //   amtToDeposit > ataBalPre,
  //   "Test requires attempting to deposit more tokens than in the ATA. Please increase deposit amount"
  // );

  await expect(
    depositCollateralCall(
      // amt to deposit
      amtToDeposit,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      tokenCollatUserAta,
      vaultKey,
      ataCollatKey,
      mintCollatPubKey,
      poolKey,
      tokenA,
      tokenB,
      oracleA,
      oracleB,
      // globalState
      accounts.global,
      user
    ),
    "No error was thrown when trying to deposit an amount greater than the user's balance"
  ).is.rejected;

  // const ataBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  // const diff = ataBalPost - ataBalPre;

  // assert(
  //   diff === 0,
  //   "Deposit did not fail when trying to deposit more tokens than in the user's ATA"
  // );
};

export const depositCollateralPASS = async (
  user: User, 
  accounts: Accounts,
  tokenCollatUserAta: PublicKey,
  vaultKey: PublicKey,
  ataCollatKey: PublicKey,
  mintCollatPubKey: MintPubKey,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  oracleA: PublicKey,
  oracleB: PublicKey,
  amtToDepositPrecise: number
  ) => {
  // mint tokens to the user's account first

  // Commenting this out since LP tokens are already transferred to user ATA on init

  
  // await user.tokens.lpSaber.ata.mintToAta(addZeros(10000, DECIMALS_USDCUSDT));
  // amt of collateral to deposit with precision
  // const amtToDepositUi = 1000;
  // const amtToDepositPrecise = addZeros(amtToDepositUi, DECIMALS_USDCUSDT);

  // price, with precision
  // const priceUsd = 1.02 * 10 ** DECIMALS_PRICE; // TODO: fix price feed
  // const globalStateAcct: IdlAccounts<RatioLending>["globalState"] =
  //   await accounts.global.getAccount();

  // const userlpSaber = user.tokens.lpSaber;

  // const tvlPre = globalStateAcct.tvlUsd.toNumber();
  // const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  // const vaultBalPre = Number(
  //   (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  // );

  // assert(
  //   userBalPre >= amtToDepositPrecise,
  //   "Test requires ATA balance to be >= deposit amount. Please increase deposit amount" +
  //     `\nATA bal.: ${userBalPre}   deposit amt: ${amtToDepositPrecise}`
  // );
  // const doesExist = await user.tokens.lpSaber.vault.miner.ata.getAccountInfo();
  // !doesExist &&
  //   (await user.tokens.lpSaber.vault.miner.ata.initAta(
  //     0,
  //     user.wallet,
  //     user.provider.connection
  //   ));
  // assert(
  //   amtToDepositPrecise * LAMPORTS_PER_SOL * priceUsd + globalStateAcct.tvlUsd.toNumber() < globalStateAcct.tvlCollatCeilingUsd.toNumber(),
  //   "Amount attempting to deposit will exceed TVL limit. Please decrease amtToDepositPrecise.\n" +
  //   "Deposit Amount USD: " + (amtToDepositPrecise * priceUsd * LAMPORTS_PER_SOL) + " TVL: " + globalStateAcct.tvlUsd.toNumber() +
  //   " TVL Limit: " + globalStateAcct.tvlCollatCeilingUsd.toNumber());

  await depositCollateralCall(
    // deposit amount
    amtToDepositPrecise,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    tokenCollatUserAta,
    vaultKey,
    ataCollatKey,
    mintCollatPubKey,
    poolKey,
    tokenA,
    tokenB,
    oracleA,
    oracleB,

    // // user token
    // user.tokens.lpSaber,
    // // vault
    // user.tokens.lpSaber.vault,
    // // mint pubKey
    // accounts.lpSaberUsdcUsdt.mint,
    // // pool
    // accounts.lpSaberUsdcUsdt.pool,

    // globalState
    accounts.global,
    user
  );

  // const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  // const vaultBalPost = Number(
  //   (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  // );
  // const userDiff = userBalPost - userBalPre;
  // const vaultDiff = vaultBalPost - vaultBalPre;
  // console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  // console.log(
  //   `vault balance: ${vaultBalPre} -> ${vaultBalPost} ∆=${vaultDiff}`
  // );

  // const differenceThreshold = 0.0001; // set arbitrarily
  // assert(
  //   Math.abs(amtToDepositPrecise + userDiff) < differenceThreshold,
  //   `Expected User ATA Diff: ${-amtToDepositPrecise}  Actual User ATA Diff: ${userDiff}`
  // );
  // assert(
  //   Math.abs(vaultDiff - amtToDepositPrecise) < differenceThreshold,
  //   `Expected Vault Diff: ${amtToDepositPrecise}   Actual Vault Diff: ${vaultDiff}`
  // );
};

// TODO: unit test doesn't work (although passing) because TVL prices aren't implemented
export const depositCollateralFAIL_DepositExceedingTVL = async (
  user: User,
  accounts: Accounts,
  tokenCollatUserAta: PublicKey,
  vaultKey: PublicKey,
  ataCollatKey: PublicKey,
  mintCollatPubKey: MintPubKey,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  oracleA: PublicKey,
  oracleB: PublicKey,
  depositAmountPrecise: number
) => {
  // const depositAmountUi = 2;
  // const depositAmountPrecise = addZeros(depositAmountUi, DECIMALS_USDCUSDT);
  const priceUsdUi = 1.02; // placeholder, get from price feed
  const priceUsdPrecise = addZeros(priceUsdUi, DECIMALS_PRICE);
  // const userlpSaber = user.tokens.lpSaber;
  // const ataBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  const globalStateAcct: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();
  const tvlPre = globalStateAcct.tvlUsd;

  // assert(
  //   ataBalPre >= depositAmountPrecise,
  //   "Starting balance < amount of tokens trying to be deposited. Please increase tokens in ATA.\n" +
  //     `ATA Balance: ${ataBalPre}  Deposit Amount: ${depositAmountPrecise}`
  // );
  assert(
    depositAmountPrecise * priceUsdPrecise + globalStateAcct.tvlUsd.toNumber() >
      globalStateAcct.tvlCollatCeilingUsd.toNumber(),
    "Amount attempting to deposit will not exceed TVL limit. Please increase amtToDeposit.\n" +
      `Deposit Amount USD: ${depositAmountPrecise * priceUsdPrecise}\n` +
      `TVL: ${globalStateAcct.tvlUsd.toNumber()}   TVL Limit: ${globalStateAcct.tvlCollatCeilingUsd.toNumber()}`
  );

  // lp price is about 2$
  // deposit amount is 1_000_000 => 2_000_000$ and tvl_ceiling is 1_000_000$
  await expect(
    depositCollateralCall(
      // deposit amount
      depositAmountPrecise * 500_000,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      tokenCollatUserAta,
      vaultKey,
      ataCollatKey,
      mintCollatPubKey,
      poolKey,
      tokenA,
      tokenB,
      oracleA,
      oracleB,
      // globalState
      accounts.global,
      user
    )
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6010);

  // const ataBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  // const diff = ataBalPost - ataBalPre;

  // assert(
  //   diff === 0,
  //   "Deposit failed but token balance changed after deposit attempt"
  // );

  const tvlPost = (await accounts.global.getAccount()).tvlUsd;
  // this might have to be adjusted so that pre - post < small value (due to price fluctuations)
  assert(
    tvlPre.toNumber() - tvlPost.toNumber() === 0,
    "TVL changed after failed deposit when it should've stayed the same"
  );
};
