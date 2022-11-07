import { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
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

// program
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export const removeLiquidityFromRaydiumV5 = async (
	testUser: User,
	treasury: User,
	accounts: Accounts
) => {
	const testUserWallet = testUser.wallet;
	const treasuryWallet = treasury.wallet;

	// configuration keys for Raydium USDT_USDC Pool on raydium mainnet
	const config = {
		"id": "2EXiumdi14E9b8Fy62QcA5Uh6WdHS2b38wtSxp72Mibj",
		"baseMint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
		"quoteMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
		"lpMint": "As3EGgLtUVpdNpE6WCKauyNRrCCwcQ57trWQ3wyRXDa6",
		"baseDecimals": 6,
		"quoteDecimals": 6,
		"lpDecimals": 6,
		"version": 5,
		"programId": "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h",
		"authority": "3uaZBfHPfmpAHW7dsimC1SnyR61X4bJqQZKWmRSCXJxv",
		"openOrders": "4zbGjjRx8bmZjynJg2KnkJ54VAk1crcrYsGMy79EXK1P",
		"targetOrders": "AYf5abBGrwjz2n2gGP4YG91hJer22zakrizrRhddTehS",
		"baseVault": "5XkWQL9FJL4qEvL8c3zCzzWnMGzerM3jbGuuyRprsEgG", //Coin vault
		"quoteVault": "jfrmNrBtxnX1FH36ATeiaXnpA4ppQcKtv7EfrgMsgLJ", //Pc Vault
		"withdrawQueue": "11111111111111111111111111111111",
		"lpVault": "11111111111111111111111111111111",
		"marketVersion": 3,
		"marketProgramId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
		"marketId": "77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS",
		"marketAuthority": "FGBvMAu88q9d1Csz7ZECB5a2gbWwp6qicNxN2Mo7QhWG",
		"marketBaseVault": "H61Y7xVnbWVXrQQx3EojTEqf3ogKVY5GfGjEn5ewyX7B", //Coin Vault
		"marketQuoteVault": "9FLih4qwFMjdqRAGmHeCxa64CgjP1GtcgKJgHHgz44ar", //Pc Vault
		"marketBids": "37m9QdvxmKRdjm3KKV2AjTiGcXMfWHQpVFnmhtb289yo",
		"marketAsks": "AQKXXC29ybqL8DLeAVNt3ebpwMv8Sb4csberrP6Hz6o5",
		"marketEventQueue": "9MgPMkdEHFX7DZaitSh6Crya3kCCr1As6JC75bm3mjuC",
		"modelDataAccount": "CDSr3ssLcRB6XYPJwAfFt18MZvEZp4LjHcvzBVZ45duo"
	};

	const liquidationAmountUi = 0.01;
	const liquidationAmountUiPrecise = addZeros(liquidationAmountUi, config.lpDecimals);
	console.log("Unwinding Amount: ", liquidationAmountUi);

	const lpMint = new PublicKey(config.lpMint);
	const usdtMint = new PublicKey(config.baseMint);
	const usdcMint = new PublicKey(config.quoteMint);

	const user_lp_ata = getAssocTokenAcct(testUserWallet.publicKey, lpMint)[0];

	let user_usdt_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, testUserWallet.publicKey, true);
	let user_usdc_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
	let treasury_usdt_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, treasuryWallet.publicKey, true);
	let treasury_usdc_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, treasuryWallet.publicKey, true);

	await delay(2000);

	// let userLpAccountAmountPre = (await testUser.provider.connection.getTokenAccountBalance(user_lp_ata)).value.uiAmount;
	// console.log("Lp amount before unwinding in user: ", userLpAccountAmountPre);

	let tx = new Transaction();
	// Request additional compute units
	// tx.add(ComputeBudgetProgram.requestUnits({
	//   units: 1400000,
	//   additionalFee: 0,
	// }));
	tx.add(await programRatioLending.methods.removeLiquidityFromRaydiumV5(
		new BN(liquidationAmountUiPrecise)
	).accounts({
		authority: testUserWallet.publicKey,
		globalState: accounts.global.pubKey,
		ataTreasuryA: treasury_usdt_ata_before.address,
		ataTreasuryB: treasury_usdc_ata_before.address,
		ataUserLp: user_lp_ata,
		ataUserA: user_usdt_ata_before.address, //Coin Mint - USDT
		ataUserB: user_usdc_ata_before.address, //Pc Mint - USDC
		ammId: new PublicKey(config.id),
		ammAuthority: new PublicKey(config.authority),
		ammOpenOrders: new PublicKey(config.openOrders),
		ammTargetOrders: new PublicKey(config.targetOrders),
		modelData: new PublicKey(config.modelDataAccount),
		ammLpMint: new PublicKey(config.lpMint),
		ammReserveA: new PublicKey(config.baseVault), // Usdt
		ammReserveB: new PublicKey(config.quoteVault),// Usdc
		serumMarket: new PublicKey(config.marketId),
		serumCoinVault: new PublicKey(config.marketBaseVault), // Usdt
		serumPcVault: new PublicKey(config.marketQuoteVault), // Usdc
		serumVaultSigner: new PublicKey(config.marketAuthority),
		serumEventQ: new PublicKey(config.marketEventQueue),
		serumBids: new PublicKey(config.marketBids),
		serumAsks: new PublicKey(config.marketAsks),
		raydiumStableAmmProgram: new PublicKey(config.programId),
		serumProgram: new PublicKey(config.marketProgramId),
		tokenProgram: TOKEN_PROGRAM_ID,
	}).instruction()
	);

	await handleTxn(tx, testUser.provider.connection, testUserWallet);

	await delay(2000);


	// let user_usdt_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, testUserWallet.publicKey, true);
	// let user_usdc_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
	// let treasury_usdt_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdtMint, treasuryWallet.publicKey, true);
	// let treasury_usdc_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, treasuryWallet.publicKey, true);

	// console.log("\nUser Usdt Difference", toUiAmount(Number(user_usdt_ata_after.amount - user_usdt_ata_before.amount), config.baseDecimals));
	// console.log("User Usdc Difference", toUiAmount(Number(user_usdc_ata_after.amount - user_usdc_ata_before.amount), config.quoteDecimals));
	// console.log("\Treasury Usdt Difference", toUiAmount(Number(treasury_usdt_ata_after.amount - treasury_usdt_ata_before.amount), config.baseDecimals));
	// console.log("Treasury Usdc Difference", toUiAmount(Number(treasury_usdc_ata_after.amount - treasury_usdc_ata_before.amount), config.quoteDecimals));

	// let userLpAccountAmountPost = (await testUser.provider.connection.getTokenAccountBalance(user_lp_ata)).value.uiAmount;
	// console.log("Lp amount after unwinding in user: ", userLpAccountAmountPost);
}
