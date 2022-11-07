// anchor imports
import {
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
// utils
import { assert, expect } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { addZeros, handleTxn } from "../utils/fxns";
import { DECIMALS_USD, TVL_LIMIT_USD } from "../utils/constants";
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * Calls setGlobalTvlLimit
 * @param limit - new TVL limit
 * @returns transaction receipt
 */
const setGlobalTvlLimitCall = async (
  accounts: Accounts,
  user: User,
  limit: number
) => {
  const txnSetGlobalTvlLimit = new web3.Transaction().add(
    programRatioLending.instruction.setGlobalTvlLimit(new BN(limit), {
      accounts: {
        authority: user.wallet.publicKey,
        globalState: accounts.global.pubKey,
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
 * Verify that global tvl limit cannot be set by a non-super user
 */
export const setGlobalTvlLimitFAIL_auth = async (
  notSuperUser: User,
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

  const newTvlLimitUSD = 2_000_000_000;

  await expect(
    setGlobalTvlLimitCall(accounts, notSuperUser, newTvlLimitUSD)
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2003);

  const globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();
  assert(
    globalState.tvlCollatCeilingUsd.toNumber() != newTvlLimitUSD,
    "TVL Limit updated even though transaction was rejected."
  );
};

/**
 * Verify super user can set global TVL limit
 */
export const setGlobalTvlLimitPASS = async (
  superUser: User,
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

  const newTvlLimitUsd = 2_000_000_000;

  let confirmation = await setGlobalTvlLimitCall(
    accounts,
    superUser,
    newTvlLimitUsd
  );
  assert(confirmation, "Failed to set TVL Limit");

  let globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();

  assert(
    globalState.tvlCollatCeilingUsd.toNumber() === newTvlLimitUsd,
    "TVL Limit was not updated even though transaction succeeded."
  );

  confirmation = await setGlobalTvlLimitCall(
    accounts,
    superUser,
    addZeros(TVL_LIMIT_USD, DECIMALS_USD)
  );
  assert(confirmation, "Failed to set TVL Limit back to original value");

  globalState = await accounts.global.getAccount();
  assert(
    globalState.tvlCollatCeilingUsd.toNumber() === addZeros(TVL_LIMIT_USD, DECIMALS_USD),
    "TVL Limit was not updated even though transaction succeeded."
  );
};
