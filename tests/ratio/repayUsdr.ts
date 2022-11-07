// anchor imports
import { BN, Program, Wallet, web3, workspace } from "@project-serum/anchor";
// solana imports
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// utils
import { assert, expect } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import { GlobalState } from "../interfaces/GlobalState";
import { Pool } from "../interfaces/pool";
import { TokenPda, TokenPDAUser } from "../interfaces/TokenPDA";
import { User } from "../interfaces/user";
import { Vault } from "../interfaces/vault";
import { DECIMALS_USDR } from "../utils/constants";
import { addZeros, getAssocTokenAcct, handleTxn } from "../utils/fxns";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

const repayUsdrCall = async (
  amtToRepay: number,
  userConnection: Connection,
  userWallet: Wallet,
  tokenUsdrUser: TokenPDAUser,
  userState: PublicKey,
  mintUsdr: TokenPda,
  pool: Pool,
  vault: Vault,
  globalState: GlobalState
) => {
  const globalStateData = await programRatioLending.account.globalState.fetch(globalState.pubKey)
  const treasury = globalStateData.treasury;
  const [ataUsdrTreasury] = getAssocTokenAcct(treasury, globalState.usdr.pubKey);
  
  const txn = new Transaction().add(
    programRatioLending.instruction.repayUsdr(new BN(amtToRepay), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        ataUsdrTreasury,
        pool: pool.pubKey,
        vault: vault.pubKey,
        mintUsdr: mintUsdr.pubKey,
        ataUsdr: tokenUsdrUser.ata.pubKey,
        userState,
        // system accts
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const repayUsdrFAIL_RepayMoreThanBorrowed = async (
  user: User,
  accounts: Accounts
) => {
  const vault: Vault = user.tokens.lpSaber.vault;
  const repayAmountExcessUi = 1 * LAMPORTS_PER_SOL;
  const repayAmountExcessPrecise = addZeros(repayAmountExcessUi, DECIMALS_USDR);

  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdr = user.tokens.usdr;
  const ataUsdrBalPre = (await userUsdr.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = (await vault.getAccount()).debt.toNumber();

  assert(
    repayAmountExcessPrecise >= vaultDebtPre,
    "Test requires repay amount >= vault balance. Please increase repay amount." +
      `Repay Amount: ${repayAmountExcessPrecise}  ||  Vault Balance: ${vaultDebtPre}`
  );
  assert(
    repayAmountExcessPrecise <= ataUsdrBalPre,
    "Test requires that ATA balance be >= repay amount. Please increase ATA balance." +
      `Repay Amount: ${repayAmountExcessPrecise}  ||  ATA Balance: ${ataUsdrBalPre}`
  );

  await expect(
    repayUsdrCall(
      // amtToRepay
      repayAmountExcessPrecise,
      // userConnection
      user.provider.connection,
      // userWallet
      user.wallet,
      // tokenUsdrUser
      user.tokens.usdr,
      // userState
      user.userState.pubKey,
      // mintUsdr
      accounts.usdr,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      user.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6019); // RepayingMoreThanBorrowed

  const ataUsdrBalPost = (await userUsdr.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = (await vault.getAccount()).debt.toNumber();
  const ataDiff = ataUsdrBalPost - ataUsdrBalPre;
  const vaultDiff = vaultDebtPost - vaultDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    vaultDiff == 0,
    "Repay rejected but vault debt changed. Vault Diff: " + vaultDiff
  );
};

export const repayUsdrPASS_RepayFullAmountBorrowed = async (
  user: User,
  accounts: Accounts
) => {
  const vault: Vault = user.tokens.lpSaber.vault;
  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();

  // check if global state exists
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdr = user.tokens.usdr;
  const ataUsdrBalPre = addZeros(
    (await userUsdr.ata.getBalance()).value.uiAmount,
    DECIMALS_USDR
  );
  const vaultDebtPre = (await vault.getAccount()).debt.toNumber();
  const repayAmountPrecise = ataUsdrBalPre;

  // assert(
  //   ataUsdrBalPre === vaultDebtPre,
  //   "Test requires ataUsdrBal == vaultDebt. Please make these values equal." +
  //     `ATA Usdr Bal: ${ataUsdrBalPre}     Vault Debt : ${vaultDebtPre}`
  // );

  await repayUsdrCall(
    // amtToRepay
    repayAmountPrecise,
    // userConnection
    user.provider.connection,
    // userWallet
    user.wallet,
    // tokenUsdrUser
    user.tokens.usdr,
    // userState
    user.userState.pubKey,
    // mintUsdr
    accounts.usdr,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // vault
    user.tokens.lpSaber.vault,
    // globalState
    accounts.global
  );

  const ataUsdrBalPost = (await userUsdr.ata.getBalance()).value.uiAmount;
  // const vaultDebtPost = (await vault.getAccount()).debt.toNumber();

  assert(
    ataUsdrBalPost === 0,
    `ATA Bal not what expected \nATA Bal: ${ataUsdrBalPost} - Expected Bal: 0`
  );
  // assert(
  //   vaultDebtPost === 0,
  //   `Vault Debt not what expected \nVault Debt: ${vaultDebtPost} - Expected Debt: 0`
  // );
};

export const repayUsdrPASS_RepayLessThanBorrowed = async (
  user: User,
  vault: Vault,
  accounts: Accounts
) => {
  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdr = user.tokens.usdr;
  const ataUsdrBalPre = (await userUsdr.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = (await vault.getAccount()).debt.toNumber();

  const repayAmount = 1;

  assert(
    repayAmount <= vaultDebtPre,
    "Test requires repay amount <= vault balance. Please decrease repay amount. \n" +
      `Repay Amount: ${repayAmount}   Vault Balance: ${vaultDebtPre}`
  );
  assert(
    repayAmount <= ataUsdrBalPre,
    "Test requires that ATA balance be >= repay amount. Please increase ATA balance. \n" +
      `Repay Amount: ${repayAmount}    ATA Balance: ${ataUsdrBalPre}`
  );

  await repayUsdrCall(
    // amtToRepay
    repayAmount * LAMPORTS_PER_SOL,
    // userConnection
    user.provider.connection,
    // userWallet
    user.wallet,
    // tokenUsdrUser
    user.tokens.usdr,
    // userState
    user.userState.pubKey,
    // mintUsdr
    accounts.usdr,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // vault
    user.tokens.lpSaber.vault,
    // globalState
    accounts.global
  );

  const ataUsdrBalPost = (await userUsdr.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = (await vault.getAccount()).debt.toNumber();
  const ataDiff = ataUsdrBalPost - ataUsdrBalPre;
  const vaultDiff = vaultDebtPost - vaultDebtPre;

  assert(
    ataDiff == -repayAmount,
    "ATA diff not what expected" +
      "ATA Diff: " +
      ataDiff +
      "Expected Diff: " +
      -repayAmount
  );
  assert(
    vaultDiff == -repayAmount,
    "Vault diff not what expected" +
      "Vault Diff: " +
      vaultDiff +
      "Expected Diff: " +
      -repayAmount
  );
};

export const repayUsdrFAIL_ZeroUsdr = async (
  user: User,
  vault: Vault,
  accounts: Accounts
) => {
  const repayAmount = 0;

  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdr = user.tokens.usdr;
  const ataUsdrBalPre = (await userUsdr.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = (await vault.getAccount()).debt.toNumber();

  assert(
    repayAmount == 0,
    "Test requires repay amount == 0 Repay Amount: " + repayAmount
  );

  await expect(
    repayUsdrCall(
      // amtToRepay
      repayAmount * LAMPORTS_PER_SOL,
      // userConnection
      user.provider.connection,
      // userWallet
      user.wallet,
      // tokenUsdrUser
      user.tokens.usdr,
      // userState
      user.userState.pubKey,
      // mintUsdr
      accounts.usdr,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      user.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6015); // InvalidTransferAmount

  const ataUsdrBalPost = (await userUsdr.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = (await vault.getAccount()).debt.toNumber();
  const ataDiff = ataUsdrBalPost - ataUsdrBalPre;
  const vaultDiff = vaultDebtPost - vaultDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    vaultDiff == 0,
    "Repay rejected but vault debt changed. Vault Diff: " + vaultDiff
  );
};

export const repayUsdrFAIL_RepayAnotherUsersDebt = async (
  user: User,
  otherUser: User,
  otherUserVault: Vault, // TODO: vault -> vault
  accounts: Accounts
) => {
  const repayAmountUi = 1;
  const repayAmountPrecise = repayAmountUi * 10 ** DECIMALS_USDR;
  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  assert(
    await otherUserVault.getAccount(),
    "Test requires vault to already be created"
  );

  const userUsdr = user.tokens.usdr;
  const userAtaUsdrBalPre = (await userUsdr.ata.getBalance()).value.uiAmount;
  const otherUserVaultDebtPre = (
    await otherUserVault.getAccount()
  ).debt.toNumber();

  assert(
    repayAmountPrecise <= userAtaUsdrBalPre,
    "Test requires repayAmount <= User Usdr Balance." +
      "User Usdr Balance: " +
      userAtaUsdrBalPre +
      " Repay Amount: " +
      repayAmountPrecise
  );
  assert(
    repayAmountPrecise <= otherUserVaultDebtPre,
    "Test requires repayAmount <= Other User Vault Debt." +
      "Repay Amount: " +
      repayAmountPrecise +
      " Other User Vault Debt: " +
      otherUserVaultDebtPre
  );

  await expect(
    repayUsdrCall(
      // amtToRepay
      repayAmountPrecise,
      // userConnection
      user.provider.connection,
      // userWallet
      user.wallet,
      // tokenUsdrUser
      user.tokens.usdr,
      // userState
      user.userState.pubKey,
      // mintUsdr
      accounts.usdr,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      otherUser.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2003); // Raw Constraint Violated

  const userAtaUsdrBalPost = (await userUsdr.ata.getBalance()).value.uiAmount;
  const otherUserVaultDebtPost = (
    await otherUserVault.getAccount()
  ).debt.toNumber();
  const ataDiff = userAtaUsdrBalPost - userAtaUsdrBalPre;
  const vaultDiff = otherUserVaultDebtPost - otherUserVaultDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    vaultDiff == 0,
    "Repay rejected but vault debt changed. Vault Diff: " + vaultDiff
  );
};
