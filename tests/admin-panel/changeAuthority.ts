// anchor imports
import { Program, web3, workspace, IdlAccounts } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
// utils
import { assert, expect } from "chai";
// local
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { RatioLending } from "../../target/types/ratio_lending";
import { User } from "../interfaces/user";

const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * Calls changeAuthority
 * @param accounts
 * @param user
 * @param newAuthority
 * @returns transaction receipt
 */
const changeAuthorityCall = async (
  accounts: Accounts,
  user: User,
  newAuthority: PublicKey
) => {
  const txnChangeAuthority = new web3.Transaction().add(
    programRatioLending.instruction.changeAuthority(newAuthority, {
      accounts: {
        authority: user.wallet.publicKey,
        globalState: accounts.global.pubKey,
      },
    })
  );

  // send transaction
  const receipt = await handleTxn(
    txnChangeAuthority,
    user.provider.connection,
    user.wallet
  );
  return receipt;
};

/**
 * Verify that change super owner cannot be set by a non-super user
 * @param notSuperUser
 * @param accounts
 */
export const changeAuthorityFAIL_auth = async (
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

  const newAuthority: PublicKey = notSuperUser.wallet.publicKey;

  await expect(
    changeAuthorityCall(accounts, notSuperUser, newAuthority)
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2001);

  const globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();
  assert(
    globalState.authority.toBase58() != newAuthority.toBase58(),
    "Authority is updated even though transaction was rejected."
  );
};

/**
 * Verify super user can change treansury wallet
 * @param superUser
 * @param newAuthority address of new super owner
 * @param accounts
 */
export const changeAuthorityPASS = async (
  superUser: User,
  newAuthority: User,
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

  let confirmation = await changeAuthorityCall(
    accounts,
    superUser,
    newAuthority.wallet.publicKey
  );
  assert(confirmation, "Failed to set Super owner");

  let globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();

  assert(
    globalState.authority.toBase58() ==
      newAuthority.wallet.publicKey.toBase58(),
    "Super owner was not updated even though transaction succeeded."
  );

  confirmation = await changeAuthorityCall(
    accounts,
    newAuthority,
    superUser.wallet.publicKey
  );
  assert(confirmation, "Failed to set Super owner back to original value");

  globalState = await accounts.global.getAccount();
  assert(
    globalState.authority.toBase58() == superUser.wallet.publicKey.toBase58(),
    "Super owner was not updated even though transaction succeeded."
  );
};
