import { Transaction } from "@solana/web3.js";
import { BN, Program, workspace } from "@project-serum/anchor";
import { RatioLending } from "../../target/types/ratio_lending";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { addZeros, delay, getAssocTokenAcct, handleTxn, toUiAmount } from "../utils/fxns";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { User } from "../interfaces";
import { Accounts } from "../config/accounts";
import { getMintDecimals } from "@project-serum/serum/lib/market";
import { DECIMALS_USDC, DECIMALS_USDT } from "../utils/constants";

// program
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export const removeLiquidityFromSaber = async (
  testUser: User,
  treasury: User,
  accounts: Accounts
) => {
  const testUserWallet = testUser.wallet;
  const treasuryWallet = treasury.wallet;
  const saberSwap = accounts.saberUsdcUsdtSwap;

  const lpMint = saberSwap.state.poolTokenMint;
  const usdcMint = saberSwap.state.tokenA.mint;
  const usdtMint = saberSwap.state.tokenB.mint;

  const liquidationAmountUi = 0.01;
  const liquidationAmountUiPrecise = addZeros(liquidationAmountUi, await getMintDecimals(testUser.provider.connection, lpMint));
  console.log("Unwinding Amount: ", liquidationAmountUi);

  const user_lp_ata = getAssocTokenAcct(testUserWallet.publicKey, lpMint)[0];

  let user_usdc_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
  let user_usdt_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, testUserWallet.publicKey, true);
  let treasury_usdc_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, treasuryWallet.publicKey, true);
  let treasury_usdt_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, treasuryWallet.publicKey, true);

  await delay(2000);

  let userLpAccountAmountPre = (await testUser.provider.connection.getTokenAccountBalance(user_lp_ata)).value.uiAmount;
  console.log("Lp amount before unwinding in user: ", userLpAccountAmountPre);

  let tx = new Transaction();
  tx.add(await programRatioLending.methods.removeLiquidityFromSaber(
    new BN(liquidationAmountUiPrecise)
  ).accounts({
    authority: testUserWallet.publicKey,
    globalState: accounts.global.pubKey,
    ataTreasuryA: treasury_usdc_ata_before.address,
    ataTreasuryB: treasury_usdt_ata_before.address,
    ataUserLp: user_lp_ata,
    ataUserA: user_usdc_ata_before.address, //Coin Mint - USDC
    ataUserB: user_usdt_ata_before.address, //Pc Mint - USDT
    saberSwapAccount: {
      ammId: saberSwap.config.swapAccount,
      authority: saberSwap.config.authority,
      reserveA: saberSwap.state.tokenA.reserve,
      reserveB: saberSwap.state.tokenB.reserve,
      lpMint: saberSwap.state.poolTokenMint,
      feeAccountA: saberSwap.state.tokenA.adminFeeAccount,
      feeAccountB: saberSwap.state.tokenB.adminFeeAccount,
    },
    saberStableProgram: saberSwap.config.swapProgramID,
    tokenProgram: TOKEN_PROGRAM_ID,
  }).instruction());

  await handleTxn(tx, testUser.provider.connection, testUserWallet);

  let user_usdc_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
  let user_usdt_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, testUserWallet.publicKey, true);
  let treasury_usdc_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, treasuryWallet.publicKey, true);
  let treasury_usdt_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, treasuryWallet.publicKey, true);

  console.log("\nUser Usdc Difference", toUiAmount(Number(user_usdc_ata_after.amount - user_usdc_ata_before.amount), DECIMALS_USDC));
  console.log("User Usdt Difference", toUiAmount(Number(user_usdt_ata_after.amount - user_usdt_ata_before.amount), DECIMALS_USDT));
  console.log("\Treasury Usdc Difference", toUiAmount(Number(treasury_usdc_ata_after.amount - treasury_usdc_ata_before.amount), DECIMALS_USDC));
  console.log("Treasury Usdt Difference", toUiAmount(Number(treasury_usdt_ata_after.amount - treasury_usdt_ata_before.amount), DECIMALS_USDT));

  let userLpAccountAmountPost = (await testUser.provider.connection.getTokenAccountBalance(user_lp_ata)).value.uiAmount;
  console.log("Lp amount after unwinding in user: ", userLpAccountAmountPost);
}
