// anchor/solana imports
import {
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { addZeros, handleTxn } from "../utils/fxns";
import {
  DEBT_CEILING_GLOBAL_USDR,
  DEBT_CEILING_USER_USDR,
  DECIMALS_USD,
  DECIMALS_USDR,
  TVL_LIMIT_USD,
} from "../utils/constants";
import { Accounts } from "../config/accounts";
import { RatioLending } from "../../target/types/ratio_lending";
import { User } from "../interfaces/user";

/**
 * Creates global state account and usdr mint account
 * auth needs to be 7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi, this will fail otherwise
 */
export const createGlobalStatePASS = async (
  superUser: User,
  accounts: Accounts
) => {
  assert(
    superUser.wallet.publicKey.toString() ===
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this PASS test, please use super user account"
  );
  // create the global state account and mint account
  // check if global state exists. If not, create it
  // we are not throwing an error or asserting account-not-created here
  //    because we may be running this multiple times on a live localnet
  //    or devnet, or even mainnet.
  //    So, we will just pass on recreating global state if it exists
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  if (!globalStateAccttInfo)
    await accounts.global.initGlobalState(superUser, accounts.ratioMint.mint);
  else console.log("GLOBAL STATE ALREADY CREATED", globalStateAccttInfo);

  // check if global state exists
  const globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();
  // testing if each of the global state's parameters exists
  assert(
    globalState.authority.toBase58() === superUser.wallet.publicKey.toBase58(),
    "\n global state auth is not super user"
  );
  assert(
    globalState.tvlCollatCeilingUsd.toNumber() ===
      addZeros(TVL_LIMIT_USD, DECIMALS_USD),
    `Global-state TVL Limit: ${globalState.tvlCollatCeilingUsd} \nTVL Limit: ${TVL_LIMIT_USD}`
  );
  assert(globalState.tvlUsd.toNumber() === 0, "Err: Global-state.tvl != 0");
  assert(
    globalState.totalDebt.toNumber() === 0,
    "Err: Global-state-total-debt != 0"
  );
  assert(
    globalState.debtCeilingGlobal.toNumber() ===
      addZeros(DEBT_CEILING_GLOBAL_USDR, DECIMALS_USDR),
    `GlobalState Global Debt Ceiling: ${
      globalState.debtCeilingGlobal
    } Global Debt Ceiling: ${addZeros(DEBT_CEILING_GLOBAL_USDR, DECIMALS_USDR)}`
  );
  assert(
    globalState.debtCeilingUser.toNumber() ===
      addZeros(DEBT_CEILING_USER_USDR, DECIMALS_USDR),
    `GlobalState User Debt Ceiling: ${
      globalState.debtCeilingUser
    } User Debt Ceiling: ${addZeros(DEBT_CEILING_USER_USDR, DECIMALS_USDR)}`
  );
};

/**
 * In this FAIL test - we try to create a new global state when it already exists
 */
export const createGlobalStateFAIL_duplicate = async (
  oracleReporter: User,
  superUser: User,
  accounts: Accounts
) => {
  // check if global state exists. It should exist for this test
  accounts.global.getAccountInfo();
  const globalStateAccountInfo: web3.AccountInfo<Buffer> =
    await superUser.provider.connection.getAccountInfo(accounts.global.pubKey);

  assert(
    globalStateAccountInfo,
    "Please place test after global state account creation"
  );

  // { code: 0, byte: 0x0, name: "AlreadyInUse", msg: "Already in use" },
  await expect(
    accounts.global.initGlobalState(superUser, accounts.ratioMint.mint)
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 0);
};
