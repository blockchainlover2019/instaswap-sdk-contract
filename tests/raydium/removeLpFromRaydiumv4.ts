import { ComputeBudgetProgram, Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { BN, Program, workspace } from "@project-serum/anchor";
import { RatioSdk } from "../../target/types/ratio_sdk";
import {
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { addZeros, delay, getAssocTokenAcct, handleTxn, toUiAmount } from "../utils/fxns";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { User } from "../interfaces";
import { RATIO_GLOBAL_STATE_KEY, RATIO_TREASURY_KEY } from "../utils/constants";

// program
const programRatioSdk = workspace.RatioSdk as Program<RatioSdk>;

export const removeLiquidityFromRaydiumV4 = async (
	testUser: User
) => {
	const testUserWallet = testUser.wallet;
	const treasuryWalletKey = new PublicKey(RATIO_TREASURY_KEY);

	// configuration keys for Raydium SOL_USDC Pool on raydium mainnet
	const config = {
		"id": "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
		"baseMint": "So11111111111111111111111111111111111111112",
		"quoteMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
		"lpMint": "8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu",
		"baseDecimals": 9,
		"quoteDecimals": 6,
		"lpDecimals": 9,
		"version": 4,
		"programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
		"authority": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
		"openOrders": "HRk9CMrpq7Jn9sh7mzxE8CChHG8dneX9p475QKz4Fsfc",
		"targetOrders": "CZza3Ej4Mc58MnxWA385itCC9jCo3L1D7zc3LKy1bZMR",
		"baseVault": "DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz",
		"quoteVault": "HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz",
		"withdrawQueue": "G7xeGGLevkRwB5f44QNgQtrPKBdMfkT6ZZwpS9xcC97n",
		"lpVault": "Awpt6N7ZYPBa4vG4BQNFhFxDj4sxExAA9rpBAoBw2uok",
		"marketVersion": 3,
		"marketProgramId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
		"marketId": "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
		"marketAuthority": "F8Vyqk3unwxkXukZFQeYyGmFfTG3CAX4v24iyrjEYBJV",
		"marketBaseVault": "36c6YqAwyGKQG66XEp2dJc5JqjaBNv7sVghEtJv4c7u6",
		"marketQuoteVault": "8CFo8bL8mZQK8abbFyypFMwEDd8tVJjHTTojMLgQTUSZ",
		"marketBids": "14ivtgssEBoBjuZJtSAPKYgpUK7DmnSwuPMqJoVTSgKJ",
		"marketAsks": "CEQdAFKdycHugujQg9k2wbmxjcpdYZyVLfV9WerTnafJ",
		"marketEventQueue": "5KKsLVU6TcbVDK4BS6K1DGDxnh4Q9xjYJ8XaDCG5t8ht"
	};

	const liquidationAmountUi = 0.01;
	const liquidationAmountUiPrecise = addZeros(liquidationAmountUi, config.lpDecimals);
	console.log("Unwinding Amount: ", liquidationAmountUi);

	const lpMint = new PublicKey(config.lpMint);
	const solMint = new PublicKey(config.baseMint);
	const usdcMint = new PublicKey(config.quoteMint);

	const user_lp_ata = getAssocTokenAcct(testUserWallet.publicKey, lpMint)[0];

	let user_sol_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, solMint, testUserWallet.publicKey, true);
	let user_usdc_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
	let treasury_sol_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, solMint, treasuryWalletKey, true);
	let treasury_usdc_ata_before = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, treasuryWalletKey, true);

	let userLpAccountAmountPre = (await testUser.provider.connection.getTokenAccountBalance(user_lp_ata)).value.uiAmount;
	console.log("Lp amount before unwinding in user: ", userLpAccountAmountPre);

	let tx = new Transaction();
	// Request additional compute units
	tx.add(ComputeBudgetProgram.requestUnits({
	  units: 2000000,
	  additionalFee: 0,
	}));
	tx.add(await programRatioSdk.methods.removeLiquidityFromRaydiumV4(
		new BN(liquidationAmountUiPrecise)
	).accounts({
		authority: testUserWallet.publicKey,
		globalState: RATIO_GLOBAL_STATE_KEY,
		ataTreasuryA: treasury_sol_ata_before.address,
		ataTreasuryB: treasury_usdc_ata_before.address,
		ataUserLp: user_lp_ata,
		ataUserA: user_sol_ata_before.address, //Coin Mint - Sol
		ataUserB: user_usdc_ata_before.address, //Pc Mint - USDC
		ammId: new PublicKey(config.id),
		ammAuthority: new PublicKey(config.authority),
		ammOpenOrders: new PublicKey(config.openOrders),
		ammTargetOrders: new PublicKey(config.targetOrders),
		ammWithdrawQueue: new PublicKey(config.withdrawQueue),
		ammTempLp: new PublicKey(config.lpVault),
		ammLpMint: new PublicKey(config.lpMint),
		ammReserveA: new PublicKey(config.baseVault), // Sol
		ammReserveB: new PublicKey(config.quoteVault),// Usdc
		serumMarket: new PublicKey(config.marketId),
		serumEventQueue: new PublicKey(config.marketEventQueue),
		serumBids: new PublicKey(config.marketBids),
		serumAsks: new PublicKey(config.marketAsks),
		serumCoinVault: new PublicKey(config.marketBaseVault), // Sol
		serumPcVault: new PublicKey(config.marketQuoteVault), // Usdc
		serumVaultSigner: new PublicKey(config.marketAuthority),
		raydiumAmmProgram: new PublicKey(config.programId),
		serumProgram: new PublicKey(config.marketProgramId),
		tokenProgram: TOKEN_PROGRAM_ID,
	}).instruction()
	);

	await handleTxn(tx, testUser.provider.connection, testUserWallet);

	await delay(2000);

	let user_sol_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, solMint, testUserWallet.publicKey, true);
	let user_usdc_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
	let treasury_sol_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, solMint, treasuryWalletKey, true);
	let treasury_usdc_ata_after = await getOrCreateAssociatedTokenAccount(testUser.provider.connection, testUserWallet.payer, usdcMint, treasuryWalletKey, true);

	console.log("\nUser Sol Difference", toUiAmount(Number(user_sol_ata_after.amount - user_sol_ata_before.amount), config.baseDecimals));
	console.log("User Usdc Difference", toUiAmount(Number(user_usdc_ata_after.amount - user_usdc_ata_before.amount), config.quoteDecimals));
	console.log("\Treasury Sol Difference", toUiAmount(Number(treasury_sol_ata_after.amount - treasury_sol_ata_before.amount), config.baseDecimals));
	console.log("Treasury Usdc Difference", toUiAmount(Number(treasury_usdc_ata_after.amount - treasury_usdc_ata_before.amount), config.quoteDecimals));

	let userLpAccountAmountPost = (await testUser.provider.connection.getTokenAccountBalance(user_lp_ata)).value.uiAmount;
	console.log("Lp amount after unwinding in user: ", userLpAccountAmountPost);
}
