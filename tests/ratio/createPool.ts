import {
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import {
  DEBT_CEILING_POOL_USDR,
  DECIMALS_USDC,
  DECIMALS_USDR,
  DECIMALS_USDT,
  DEFAULT_FEE_NUMERATOR,
  PLATFORM_TYPE_SABER,
} from "../utils/constants";
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { Pool } from "../interfaces/pool";
import { PlatformType } from "../utils/types";

// program
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

const createPoolCall = async (
  user: User,
  accounts: Accounts,
  riskLevel: number,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  lpMint: PublicKey,
  rewardMint: PublicKey,
  platformType: PlatformType = PLATFORM_TYPE_SABER,
  borrowFeeNum: number = DEFAULT_FEE_NUMERATOR,
  harvestFeeNum: number = DEFAULT_FEE_NUMERATOR,
  depositFeeNum: number = 0
) => {
  const debtCeiling = DEBT_CEILING_POOL_USDR * 10 ** DECIMALS_USDR;

  // TODO 013: update the frontend createPool call
  const txnCreateUserPool = new web3.Transaction().add(
    programRatioLending.instruction.createPool(
      new BN(riskLevel), // risk_level: u8,
      new BN(debtCeiling), // debt_ceiling: u64,
      platformType, // platform_type: u8,
      new BN(borrowFeeNum), // borrow_fee_num: u64,
      new BN(harvestFeeNum), // harvest_fee_num: u64,
      new BN(depositFeeNum), // deposit_fee_num: u64,
      {
        accounts: {
          authority: user.wallet.publicKey,
          pool: poolKey,
          globalState: accounts.global.pubKey,
          mintCollat: lpMint,
          swapTokenA: tokenA,
          swapTokenB: tokenB,
          mintReward: rewardMint,
          // system accts
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(
    txnCreateUserPool,
    user.provider.connection,
    user.wallet
  );
  console.log("created pool", receipt);
  return receipt;
};

export const createPoolFAIL_auth = async (
  notSuperUser: User,
  accounts: Accounts,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  lpMint: PublicKey,
  rewardMint: PublicKey,
  platformType: PlatformType = PLATFORM_TYPE_SABER
) => {
  assert(
    notSuperUser.wallet.publicKey.toString() !==
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this fail test, do not use super user account"
  );
  // get token pool info
  const poolAcctInfo: web3.AccountInfo<Buffer> =
    await notSuperUser.provider.connection.getAccountInfo(poolKey);

  // if created, we cannot run this test
  if (poolAcctInfo) console.log("\n\n Pool already created, skipping test \n");
  else {
    // params
    const riskLevel = 0;

    // asserts
    // this does not identify the correct error code properly
    await expect(
      createPoolCall(
        notSuperUser,
        accounts,
        riskLevel,
        poolKey,
        tokenA,
        tokenB,
        lpMint,
        rewardMint,
        platformType
      )
    ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2001);
  }
};

export const createPoolFAIL_noGlobalState = async (
  superUser: User,
  accounts: Accounts,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  lpMint: PublicKey,
  rewardMint: PublicKey,
  platformType: PlatformType = PLATFORM_TYPE_SABER
) => {
  /**
   * we are not throwing an error or asserting pool-not-created here
   *   because we may be running this multiple times on a live localnet
   *   or devnet, or even mainnet.
   *   So, we will just pass on recreating pool if it exists
   */
  const globalStateInfo = await accounts.global.getAccountInfo();

  if (!globalStateInfo) {
    // params
    const riskLevel = 0;

    await expect(
      createPoolCall(
        superUser,
        accounts,
        riskLevel,
        poolKey,
        tokenA,
        tokenB,
        lpMint,
        rewardMint,
        platformType
      ),
      "The program expected this account to be already initialized"
    ).to.be.eventually.rejectedWith(Error).and.have.property('code', 3012);
  } else {
    console.log("\n\n SKIPPING TEST: GLOBAL STATE EXISTS");
  }
};

export const createPoolFAIL_dup = async (
  superUser: User,
  accounts: Accounts,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  lpMint: PublicKey,
  rewardMint: PublicKey,
  platformType: PlatformType = PLATFORM_TYPE_SABER
) => {
  const globalStateInfo = await accounts.global.getAccountInfo();
  assert(
    globalStateInfo,
    "Global state account does not exist. Please place this test after the PASS test."
  );
  const poolInfo: web3.AccountInfo<Buffer> = await programRatioLending.account.pool.getAccountInfo(poolKey);
  assert(
    poolInfo,
    "Pool account does not exist. Please place this test after the PASS test."
  );
  assert(
    superUser.wallet.publicKey.toString() ===
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "Please use super user account"
  );

  // params
  const riskLevel = 0;

  await expect(
    createPoolCall(
      superUser,
      accounts,
      riskLevel,
      poolKey,
      tokenA,
      tokenB,
      lpMint,
      rewardMint,
      platformType
    ),
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 0);
};

export const createPoolPASS = async (
  superUser: User,
  accounts: Accounts,
  poolKey: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  lpMint: PublicKey,
  rewardMint: PublicKey,
  platformType: PlatformType = PLATFORM_TYPE_SABER
) => {
  assert(
    superUser.wallet.publicKey.toString() ===
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this PASS test, please use super user account"
  );
  /**
   * get token pool info to check if it exists. If not, create it.
   *
   * we are not throwing an error or asserting pool-not-created here
   *   because we may be running this multiple times on a live localnet
   *   or devnet, or even mainnet.
   *   So, we will just pass on recreating pool if it exists
   */
   const poolAcctInfo: web3.AccountInfo<Buffer> = await programRatioLending.account.pool.getAccountInfo(poolKey);

  // if not created, create token pool
  if (!poolAcctInfo) {
    const riskLevel = 0;

    const confirmation = await createPoolCall(
      superUser,
      accounts,
      riskLevel,
      poolKey,
      tokenA,
      tokenB,
      lpMint,
      rewardMint,
      platformType
    );
    console.log("token pool created- confirmation: ", confirmation);
  } else console.log("token pool already created:");
};
