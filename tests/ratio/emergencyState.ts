import { IdlAccounts, Program, workspace } from "@project-serum/anchor";
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { assert, expect } from "chai";
import {
  DECIMALS_USDCUSDT,
  DECIMALS_USDR,
  EMER_STATE_DISABLED,
  EMER_STATE_ENABLED,
} from "../utils/constants";
import { toggleEmerStateCall } from "../admin-panel/toggleEmerState";
import { depositCollateralCall } from "./depositCollateral";
import { withdrawCollateralCall } from "./withdrawCollateral";
import { borrowUsdrCall } from "./borrowUsdr";

export const emergencyStatePASS_DepositDisabled = async (
  superUser: User,
  user: User,
  accounts: Accounts
) => {
  const depositAmount = 0.2 * 10 ** DECIMALS_USDCUSDT;

  let globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();

  if (globalState.paused == EMER_STATE_DISABLED) {
    let confirmation = await toggleEmerStateCall(
      accounts,
      superUser,
      EMER_STATE_ENABLED
    );
    assert(confirmation, "Failed to enable emergency state");
    globalState = await accounts.global.getAccount();
    assert(
      globalState.paused == EMER_STATE_ENABLED,
      "Failed to enable emergency state"
    );
  }

  const userlpSaber = user.tokens.lpSaber;

  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPre = Number(
    (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  );

  assert(
    userBalPre >= depositAmount,
    "Test requires ATA balance to be >= deposit amount. Please increase deposit amount" +
      `\nATA bal.: ${userBalPre}   deposit amt: ${depositAmount}`
  );

  await expect(
    depositCollateralCall(
      // deposit amount
      depositAmount,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      user.tokens.lpSaber.ata.pubKey,
      user.tokens.lpSaber.vault.pubKey,
      user.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdt.pubKey,
      // globalState
      accounts.global,
      user
    )
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6005);

  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPost = Number(
    (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  );

  assert(
    userBalPre == userBalPost,
    "User Bal changed despite deposit being rejected"
  );
  assert(
    vaultBalPre == vaultBalPost,
    "Vault Bal changed depsite deposit being rejected"
  );
};

export const emergencyStatePASS_BorrowDisabled = async (
  superUser: User,
  user: User,
  accounts: Accounts
) => {
  const borrowAmount = 10 * 10 ** DECIMALS_USDR;
  const usdrUser = user.tokens.usdr;

  const userUsdrBalPre = Number((await usdrUser.ata.getBalance()).value.amount);

  let globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();

  // Disable emergency state if necessary
  if (globalState.paused == EMER_STATE_DISABLED) {
    let confirmation = await toggleEmerStateCall(
      accounts,
      superUser,
      EMER_STATE_ENABLED
    );
    assert(confirmation, "Failed to enable emergency state");
    globalState = await accounts.global.getAccount();
    assert(
      globalState.paused == EMER_STATE_ENABLED,
      "Failed to enable emergency state"
    );
  }

  await expect(
    borrowUsdrCall(
      // borrow/mint amount
      borrowAmount,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // userToken
      user.tokens.lpSaber,
      // userUSDr
      user.tokens.usdr,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // globalState
      accounts.global,
      // blacklist
      accounts.blackList,
      // mintColl
      accounts.lpSaberUsdcUsdt,
      user.userState,
      user.tokens.lpSaber.vault
    )
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6005);

  const userUsdrBalPost = Number(
    (await usdrUser.ata.getBalance()).value.amount
  );

  assert(
    userUsdrBalPre == userUsdrBalPost,
    "User Bal changed despite borrow being rejected"
  );
};

export const emergencyStatePASS_WithdrawDisabled = async (
  superUser: User,
  user: User,
  accounts: Accounts
) => {
  const withdrawAmount = 0.1 * 10 ** DECIMALS_USDCUSDT;
  const userlpSaber = user.tokens.lpSaber;

  // check balances before
  const vaultBalPre = Number(
    (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  );
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  // let globalStateAcct: IdlAccounts<RatioLending>["globalState"] = await accounts.global.getAccount();
  // const tvlPre = globalStateAcct.tvlUsd.toNumber();

  assert(
    withdrawAmount <= vaultBalPre,
    "Test requires withdrawing an amount less than the vault balance so it will succeed.\n" +
      `Withdraw Amount: ${withdrawAmount}   Vault Balance: ${vaultBalPre}`
  );

  let globalState: IdlAccounts<RatioLending>["globalState"] =
    await accounts.global.getAccount();

  // Disable emergency state if necessary
  if (globalState.paused == EMER_STATE_DISABLED) {
    let confirmation = await toggleEmerStateCall(
      accounts,
      superUser,
      EMER_STATE_ENABLED
    );
    assert(confirmation, "Failed to enable emergency state");
    globalState = await accounts.global.getAccount();
    assert(
      globalState.paused == EMER_STATE_ENABLED,
      "Failed to enable emergency state"
    );
  }

  await expect(
    withdrawCollateralCall(
      // withdrawAmount: number,
      withdrawAmount,
      // userConnection: Connection,
      user.provider.connection,
      // userWallet: Wallet,
      user.wallet,
      user.tokens.lpSaber.ata.pubKey,
      user.tokens.lpSaber.vault.pubKey,
      user.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.global,
      accounts.blackList,
      user.userState,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.oracle.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.oracle.pubKey,
    )
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6005);

  // check balances after
  const vaultBalPost = Number(
    (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  );
  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);

  assert(
    userBalPre == userBalPost,
    "User Bal changed despite withdraw being rejected"
  );
  assert(
    vaultBalPre == vaultBalPost,
    "Vault Bal changed depsite withdraw being rejected"
  );

  globalState = await accounts.global.getAccount();

  // Unpause emergency state
  if (globalState.paused == EMER_STATE_ENABLED) {
    let confirmation = await toggleEmerStateCall(
      accounts,
      superUser,
      EMER_STATE_DISABLED
    );
    assert(confirmation, "Failed to disable emergency state");
    globalState = await accounts.global.getAccount();
    assert(
      globalState.paused == EMER_STATE_DISABLED,
      "Failed to disable emergency state"
    );
  }
};
