import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { BN, Program, workspace } from "@project-serum/anchor";
import { RatioSdk } from "../../target/types/ratio_sdk";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { addZeros, delay, getAssocTokenAcct, handleTxn, simulateTxn, toUiAmount } from "../utils/fxns";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { User } from "../interfaces";
import { getMintDecimals } from "@project-serum/serum/lib/market";
import { DECIMALS_USDC, DECIMALS_USDT, RATIO_GLOBAL_STATE_KEY, RATIO_TREASURY_KEY } from "../utils/constants";
import { Accounts } from "../config/accounts";

// program
const programRatioSdk = workspace.RatioSdk as Program<RatioSdk>;

export const addLiquidityToSaber = async (
  testUser: User,
  accounts: Accounts
) => {
  const testUserWallet = testUser.wallet;
	const treasuryWalletKey = new PublicKey(RATIO_TREASURY_KEY);
  const saberSwap = accounts.saberUsdcUsdtSwap;

  const lpMint = saberSwap.state.poolTokenMint;
  const usdcMint = saberSwap.state.tokenA.mint;
  const usdtMint = saberSwap.state.tokenB.mint;

  const liquidationAmountUi = 0.01;
  const liquidationAmountUiPrecise = addZeros(liquidationAmountUi, await getMintDecimals(testUser.provider.connection, lpMint));
  const user_lp_ata = getAssocTokenAcct(testUserWallet.publicKey, lpMint)[0];
  
  let user_usdc_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
  let user_usdt_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, testUserWallet.publicKey, true);
  let treasury_usdc_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, treasuryWalletKey, true);
  let treasury_usdt_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, treasuryWalletKey, true);

  await delay(2000);
  let userLpAccountAmountPre = (await testUser.provider.connection.getTokenAccountBalance(user_lp_ata)).value.uiAmount;
  console.log("Lp amount before unwinding in user: ", userLpAccountAmountPre);

  let tx = new Transaction();
  tx.add(await programRatioSdk.methods.addLiquidityToSaber(
    new BN(0),
    new BN(0)
  ).accounts({
    authority: testUserWallet.publicKey,
    globalState: RATIO_GLOBAL_STATE_KEY,
    ataTokenATreasury: treasury_usdc_ata_before.address,
    ataTokenBTreasury: treasury_usdt_ata_before.address,
    ataUserTokenLp: user_lp_ata,
    ataUserTokenA: user_usdc_ata_before.address, //Coin Mint - USDC
    ataUserTokenB: user_usdt_ata_before.address, //Pc Mint - USDT
    reserveTokenA: saberSwap.state.tokenA.reserve,
    reserveTokenB: saberSwap.state.tokenB.reserve,
    poolMint: saberSwap.state.poolTokenMint,
    tokenA: usdcMint,
    tokenB: usdtMint,
    swapAccount: saberSwap.config.swapAccount,
    swapAuthority: saberSwap.config.authority,
    saberStableProgram: saberSwap.config.swapProgramID,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY
  }).instruction());

  
  //let res = await simulateTxn(testUser.provider.connection, tx, testUserWallet.publicKey);
  //console.log('simulate res =', res);
  await handleTxn(tx, testUser.provider.connection, testUserWallet);

  let user_usdc_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
  let user_usdt_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, testUserWallet.publicKey, true);
  let treasury_usdc_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, treasuryWalletKey, true);
  let treasury_usdt_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, treasuryWalletKey, true);

  console.log("\nUser Usdc Difference", toUiAmount(Number(user_usdc_ata_after.amount - user_usdc_ata_before.amount), DECIMALS_USDC));
  console.log("User Usdt Difference", toUiAmount(Number(user_usdt_ata_after.amount - user_usdt_ata_before.amount), DECIMALS_USDT));
  console.log("\Treasury Usdc Difference", toUiAmount(Number(treasury_usdc_ata_after.amount - treasury_usdc_ata_before.amount), DECIMALS_USDC));
  console.log("Treasury Usdt Difference", toUiAmount(Number(treasury_usdt_ata_after.amount - treasury_usdt_ata_before.amount), DECIMALS_USDT));

  let userLpAccountAmountPost = (await testUser.provider.connection.getTokenAccountBalance(user_lp_ata)).value.uiAmount;
  console.log("Lp amount after unwinding in user: ", userLpAccountAmountPost);
}
