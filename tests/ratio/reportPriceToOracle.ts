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
import { Connection, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
// utils
import { assert, expect } from "chai";
// local
import { addZeros, handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { RatioLending } from "../../target/types/ratio_lending";
// interfaces
import { User } from "../interfaces/user";
import { Oracle } from "../interfaces/oracle";
import { DECIMALS_PRICE } from "../utils/constants";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * This fxn isnt properly annotated.
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param oracle
 * @returns
 */
const reportPriceToOracleCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  oracle: Oracle,
  newPrice: number
) => {
  const txn = new web3.Transaction().add(
    programRatioLending.instruction.reportPriceToOracle(
      // price of token
      new BN(newPrice),
      new BN(newPrice), // This is fair price, but for testing purpose we are giving this same as market_price
      {
        accounts: {
          authority: userWallet.publicKey,
          globalState: accounts.global.pubKey,
          oracle: oracle.pubKey,
        },
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);

  return receipt;
};

export const reportPriceToOraclePASS = async (
  oracleReporter: User,
  // oracleReporterConnection: Connection, // userConnection
  // oracleReporterWallet: Wallet, // userWallet
  accounts: Accounts
) => {
  const newPriceUsdc = addZeros(1.02, DECIMALS_PRICE);
  const newPriceUsdt = addZeros(0.98, DECIMALS_PRICE);
  // derive price feed account
  console.log("getting price feed acct");

  // get price feed info
  const priceFeedUsdc = await accounts.usdc.oracle.getAccountInfo();
  const priceFeedUsdt = await accounts.usdt.oracle.getAccountInfo();

  // if not created, create price feed
  if (priceFeedUsdc) {
    const confirmation = await reportPriceToOracleCall(
      oracleReporter.provider.connection,
      oracleReporter.wallet,
      accounts,
      accounts.usdc.oracle,
      newPriceUsdc
    );
    console.log("updated price feed: ", confirmation);
  } else console.log("this price feed was not created");
  if (priceFeedUsdt) {
    const confirmation = await reportPriceToOracleCall(
      oracleReporter.provider.connection,
      oracleReporter.wallet,
      accounts,
      accounts.usdt.oracle,
      newPriceUsdt
    );
    console.log("updated price feed: ", confirmation);
  } else console.log("this price feed was not created");

  // get the price feed state
  // asserts
  assert(
    (await accounts.usdc.oracle.getAccount()).marketPrice.toNumber() == newPriceUsdc,
    "price mismatch with usdc"
  );
  assert(
    (await accounts.usdt.oracle.getAccount()).marketPrice.toNumber() == newPriceUsdt,
    "price mismatch with usdt"
  );
};

/**
 * Fail when attempting to make a price feed that already exists
 *
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param oracle
 */
export const reportPriceToOracleFAIL_NotUpdater = async (
  userBase: User,
  // userConnection: Connection,
  // userWallet: Wallet,
  accounts: Accounts,
  newPrice: number
) => {
  // get price feed info
  const priceFeedInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(accounts.usdc.oracle.pubKey);
  assert(priceFeedInfo, "Price feed does not exist, test needs a price feed");

  // get the price feed state
  const priceFeedAccBefore: IdlAccounts<RatioLending>["oracle"] =
    await accounts.usdc.oracle.getAccount();

  await expect(
    reportPriceToOracleCall(
      userBase.provider.connection,
      userBase.wallet,
      accounts,
      accounts.usdc.oracle,
      newPrice
    ),
    "No error was thrown was trying to update oracle by not oracle reporter"
  ).is.rejected;

  // get the price feed state
  const priceFeedAcc: IdlAccounts<RatioLending>["oracle"] =
    await accounts.usdc.oracle.getAccount();
  // asserts
  assert(
    priceFeedAcc.marketPrice.toNumber() == priceFeedAccBefore.marketPrice.toNumber(),
    "price mismatch"
  );
};
