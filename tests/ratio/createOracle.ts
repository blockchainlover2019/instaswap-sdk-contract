// anchor/solana imports
import {
  getProvider,
  Program,
  web3,
  workspace,
  BN,
  Wallet,
  IdlAccounts,
} from "@project-serum/anchor";
import {
  Connection,
  SystemProgram,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { Oracle } from "../interfaces/oracle";
import { GlobalState } from "../interfaces/GlobalState";
// program
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

const createOracleCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  globalState: GlobalState,
  oracle: Oracle
) => {
  const txn = new web3.Transaction().add(
    programRatioLending.instruction.createOracle({
        accounts: {
          authority: userWallet.publicKey,
          globalState: globalState.pubKey,
          oracle: oracle.pubKey,
          mint: oracle.mint, // the mint account that represents the token this oracle reports for
          // system accts
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);

  return receipt;
};

/**
 * This isnt even properly annotated.
 * Pass when attempting to make a oracle that doesn't exist
 * @param accounts
 * @param oracle
 */
export const createOraclePASS = async (
  oracleReporterUser: User,
  accounts: Accounts,
  oracle: Oracle
) => {
  // get oracle info
  const oracleInfo: web3.AccountInfo<Buffer> = await oracle.getAccountInfo();

  // if not created, create oracle
  if (!oracleInfo) {
    const confirmation = await createOracleCall(
      oracleReporterUser.provider.connection,
      oracleReporterUser.wallet,
      accounts.global,
      oracle
    );
    console.log("created oracle: ", confirmation);
  } else console.log("this oracle already created");

  // get the oracle state
  const oracleAcct: IdlAccounts<RatioLending>["oracle"] = await oracle.getAccount();
  // final asserts
  assert(
    !!oracleAcct,
    "oracle not created"
  );
};

/**
 * Fail when attempting to create a oracle that already exists
 */
export const createOracleFAIL_Duplicate = async (
  oracleReporterUser: User,
  accounts: Accounts,
  oracle: Oracle
) => {
  // get oracle info
  const oracleInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(
      oracle.pubKey
    );
  // if oracle created, try to create another one for the same mint (should fail)
  assert(oracleInfo, "Oracle does not exist, test needs a oracle");
  await expect(
    createOracleCall(
      oracleReporterUser.provider.connection,
      oracleReporterUser.wallet,
      accounts.global,
      oracle
    ),
    "No error was thrown was trying to create a duplicate oracle"
  ).is.rejected;
};
