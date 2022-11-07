// anchor imports
import {
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
// solana imports
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { handleTxn } from "../utils/fxns";
import {
  DEBT_CEILING_POOL_USDR,
  DECIMALS_USDC,
  DECIMALS_USDR,
  DECIMALS_USDT,
  PLATFORM_TYPE_SABER,
} from "../utils/constants";
import { Accounts } from "../config/accounts";
import { RatioLending } from "../../target/types/ratio_lending";
import { User, Pool } from "../interfaces";

const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * Calls setPoolDebtCeiling
 * @param accounts
 * @param user
 * @param pool
 * @param ceiling - new pool debt ceiling
 * @returns transaction receipt
 */
const setPoolDebtCeilingCall = async (
  accounts: Accounts,
  user: User,
  pool: Pool,
  ceiling: number
) => {
  const txnSetGlobalTvlLimit = new web3.Transaction().add(
    programRatioLending.instruction.setPoolDebtCeiling(new BN(ceiling), {
      accounts: {
        authority: user.wallet.publicKey,
        globalState: accounts.global.pubKey,
        pool: pool.pubKey,
      },
      signers: [user.wallet.payer],
    })
  );
  // send transaction
  const receipt = await handleTxn(
    txnSetGlobalTvlLimit,
    user.provider.connection,
    user.wallet
  );
  return receipt;
};

/**
 * Verify that pool debt ceiling cannot be set by a non-super user
 * @param notSuperUser
 * @param pool
 * @param accounts
 */
export const setPoolDebtCeilingFAIL_auth = async (
  notSuperUser: User,
  pool: Pool,
  accounts: Accounts
) => {
  assert(
    notSuperUser.wallet.publicKey.toString() !==
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this fail test, do not use super user account"
  );

  let globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Global State must be created to run admin panel tests"
  );

  const poolAcctInfo: web3.AccountInfo<Buffer> = await pool.getAccountInfo();
  assert(
    poolAcctInfo,
    "Pool must be created to run setPoolDebtCeiling tests"
  );

  const newPoolDebtCeiling = 10_000_000;

  await expect(
    setPoolDebtCeilingCall(accounts, notSuperUser, pool, newPoolDebtCeiling)
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2001);

  const poolAcct: IdlAccounts<RatioLending>["pool"] =
    await accounts.lpSaberUsdcUsdt.pool.getAccount();
  assert(
    poolAcct.debtCeiling.toNumber() != newPoolDebtCeiling,
    "Pool Debt Ceiling updated even though transaction was rejected."
  );
};

/**
 * Verify super user can set pool debt ceiling
 * @param superUser
 * @param pool
 * @param accounts
 */
export const setPoolDebtCeilingPASS = async (
  superUser: User,
  pool: Pool,
  accounts: Accounts
) => {
  assert(
    superUser.wallet.publicKey.toString() ==
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this pass test, you must use super user account"
  );

  let globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Global State must be created to run admin panel tests"
  );

  const poolAcctInfo: web3.AccountInfo<Buffer> = await pool.getAccountInfo();
  assert(
    poolAcctInfo,
    "Pool must be created to run setPoolDebtCeiling tests"
  );

  const newPoolDebtCeiling = 10_000_000;

  let confirmation = await setPoolDebtCeilingCall(
    accounts,
    superUser,
    pool,
    newPoolDebtCeiling
  );
  assert(confirmation, "Failed to set Pool Debt Ceiling");

  let poolAcct: IdlAccounts<RatioLending>["pool"] =
    await accounts.lpSaberUsdcUsdt.pool.getAccount();

  assert(
    poolAcct.debtCeiling.toNumber() == newPoolDebtCeiling,
    "Pool Debt Ceiling was not updated even though transaction succeeded."
  );

  confirmation = await setPoolDebtCeilingCall(
    accounts,
    superUser,
    pool,
    DEBT_CEILING_POOL_USDR * 10 ** DECIMALS_USDR
  );
  assert(
    confirmation,
    "Failed to set Pool Debt Ceiling back to original value"
  );

  poolAcct = await accounts.lpSaberUsdcUsdt.pool.getAccount();
  assert(
    poolAcct.debtCeiling.toNumber() == DEBT_CEILING_POOL_USDR * 10 ** DECIMALS_USDR,
    "Pool Debt Ceiling was not updated even though transaction succeeded."
  );
};
