// anchor imports
import {
    Program,
    web3,
    workspace,
    BN,
    IdlAccounts,
    IdlError,
    ProgramError,
    eventDiscriminator
  } from "@project-serum/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { handleTxn } from "../utils/fxns";
import * as constants from "../utils/constants";
import { Accounts } from "../config/accounts";
import { RatioLending } from "../../target/types/ratio_lending";
import { User } from "../utils/interfaces";
import { program } from "@project-serum/anchor/dist/cjs/spl/token";

const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * Calls changeTreasuryWallet
 * @param accounts 
 * @param user 
 * @param newTreasury - new treasury program address
 * @returns transaction receipt
 */
const changeTreasuryWalletCall = async (
	accounts: Accounts, 
	user: User, 
	newTreasury: PublicKey
) => {
	const txnSetGlobalTvlLimit = new web3.Transaction().add(
    programRatioLending.instruction.changeTreasuryWallet(
			{
				accounts: {
					authority: user.wallet.publicKey,
					globalState: accounts.global.pubKey,
          treasury: newTreasury,
				},
				signers: [user.wallet.payer],
			}
		)
	)
	// send transaction
	const receipt = await handleTxn(
    txnSetGlobalTvlLimit, 
    user.provider.connection, 
    user.wallet);
	return receipt;
};

/**
 * Verify that change treasury wallet cannot be set by a non-super user
 * @param notSuperUser 
 * @param accounts 
 */
export const changeTreasuryWalletFAIL_auth = async (
  notSuperUser: User,
  accounts: Accounts,
) => {
  assert(
    notSuperUser.wallet.publicKey.toString() !==
    "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this fail test, do not use super user account"
  );

  let globalStateAccttInfo: web3.AccountInfo<Buffer> =
  await accounts.global.getAccountInfo();
  assert(globalStateAccttInfo, "Global State must be created to run admin panel tests");

  const newTreasury: PublicKey = notSuperUser.wallet.publicKey;

  await expect(
    changeTreasuryWalletCall(accounts, notSuperUser, newTreasury)
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2001);

  const globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();
  assert(globalState.treasury.toBase58() != newTreasury.toBase58(), 
  "Treasury updated even though transaction was rejected.");
};

/**
 * Verify super user can change treansury wallet
 * @param superUser
 * @param newTreasury address of new treasury
 * @param accounts 
 */
export const changeTreasuryWalletPASS = async (
  superUser: User,
  newTreasury: PublicKey,
  accounts: Accounts,
) => {
  assert(
    superUser.wallet.publicKey.toString() ==
    "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this pass test, you must use super user account"
  );

  let globalStateAccttInfo: web3.AccountInfo<Buffer> =
  await accounts.global.getAccountInfo();
  assert(globalStateAccttInfo, "Global State must be created to run admin panel tests");

  let confirmation = await changeTreasuryWalletCall(accounts, superUser, newTreasury);
  assert(confirmation, "Failed to set Treasury Wallet");

  let globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();

  assert(globalState.treasury.toBase58() == newTreasury.toBase58(), 
  "Treasury Wallet was not updated even though transaction succeeded.");

  confirmation = await changeTreasuryWalletCall(accounts, superUser, superUser.wallet.publicKey);
  assert(confirmation, "Failed to set Treasury Wallet back to original value");

  globalState = await accounts.global.getAccount();
  assert(globalState.treasury.toBase58() == superUser.wallet.publicKey.toBase58(), 
  "Treasury Wallet was not updated even though transaction succeeded.");
};
