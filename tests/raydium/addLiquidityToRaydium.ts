import { ComputeBudgetProgram, Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { BN, Program, workspace } from "@project-serum/anchor";
import { RatioSdk } from "../../target/types/ratio_sdk";
import {
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { addZeros, delay, getAssocTokenAcct, handleTxn } from "../utils/fxns";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { User } from "../interfaces";
import { RATIO_GLOBAL_STATE_KEY, RATIO_TREASURY_KEY } from "../utils/constants";

// program
const programRatioSdk = workspace.RatioSdk as Program<RatioSdk>;

export const addLiquidityToRaydium = async (
  testUser: User,
  version: number
) => {
  if (version == 4) {
    await addLiquidityToRaydiumV4(
      testUser
    );
  } else if (version == 5) {
    await addLiquidityToRaydiumV5(
      testUser
    );
  }
}
export const addLiquidityToRaydiumV4 = async (
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

	const lpMint = new PublicKey(config.lpMint);
	const solMint = new PublicKey(config.baseMint);
	const usdcMint = new PublicKey(config.quoteMint);

	const user_lp_ata = getAssocTokenAcct(testUserWallet.publicKey, lpMint)[0];
  const connection = testUser.provider.connection;
	let ataUserTokenA = await getOrCreateAssociatedTokenAccount(connection, testUserWallet.payer, solMint, testUserWallet.publicKey, true);
	let ataUserTokenB = await getOrCreateAssociatedTokenAccount(connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
	let ataTokenATreasury = await getOrCreateAssociatedTokenAccount(connection, testUserWallet.payer, solMint, treasuryWalletKey, true);
	let ataTokenBTreasury = await getOrCreateAssociatedTokenAccount(connection, testUserWallet.payer, usdcMint, treasuryWalletKey, true);

  let userTokenABalance = await connection.getTokenAccountBalance(ataUserTokenA.address);
  let userTokenBBalance = await connection.getTokenAccountBalance(ataUserTokenB.address);

	let tx = new Transaction();

  const modelDataAcc = config.lpMint;
  const oldAmountA = new BN(0);
  const oldAmountB = new BN(0);

  tx.add(ComputeBudgetProgram.requestUnits({
	units: 1400000,
	additionalFee: 0,
  }));
	tx.add(await programRatioSdk.methods.addLiquidityToRaydium(
		4,
    oldAmountA,
    oldAmountB,
	).accounts({
		authority: testUserWallet.publicKey,
		globalState: RATIO_GLOBAL_STATE_KEY,
		ataTokenATreasury: ataTokenATreasury.address,
		ataTokenBTreasury: ataTokenBTreasury.address,
		ammId: new PublicKey(config.id),
		ammAuthority: new PublicKey(config.authority),
		ammOpenOrders: new PublicKey(config.openOrders),
		ammTargetOrders: new PublicKey(config.targetOrders),
    reserveTokenA: new PublicKey(config.baseVault), // Sol
    reserveTokenB: new PublicKey(config.quoteVault),// Usdc
    ataUserTokenA: ataUserTokenA.address,
    ataUserTokenB: ataUserTokenB.address,
    ataUserTokenLp: user_lp_ata,
    poolMint: new PublicKey(config.lpMint),
    tokenA: new PublicKey(config.baseMint),
    tokenB: new PublicKey(config.quoteMint),
    modelData: modelDataAcc,
		serumMarket: new PublicKey(config.marketId),
		raydiumSwapProgram: new PublicKey(config.programId),
		tokenProgram: TOKEN_PROGRAM_ID,
	}).instruction()
	);
	await handleTxn(tx, testUser.provider.connection, testUserWallet);

	await delay(2000);

}


export const addLiquidityToRaydiumV5 = async (
	testUser: User
) => {
	const testUserWallet = testUser.wallet;
	const treasuryWalletKey = new PublicKey(RATIO_TREASURY_KEY);

	// configuration keys for Raydium SOL_USDC Pool on raydium mainnet
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

	const lpMint = new PublicKey(config.lpMint);
	const solMint = new PublicKey(config.baseMint);
	const usdcMint = new PublicKey(config.quoteMint);

	const user_lp_ata = getAssocTokenAcct(testUserWallet.publicKey, lpMint)[0];
  const connection = testUser.provider.connection;
	let ataUserTokenA = await getOrCreateAssociatedTokenAccount(connection, testUserWallet.payer, solMint, testUserWallet.publicKey, true);
	let ataUserTokenB = await getOrCreateAssociatedTokenAccount(connection, testUserWallet.payer, usdcMint, testUserWallet.publicKey, true);
	let ataTokenATreasury = await getOrCreateAssociatedTokenAccount(connection, testUserWallet.payer, solMint, treasuryWalletKey, true);
	let ataTokenBTreasury = await getOrCreateAssociatedTokenAccount(connection, testUserWallet.payer, usdcMint, treasuryWalletKey, true);

  let userTokenABalance = await connection.getTokenAccountBalance(ataUserTokenA.address);
  let userTokenBBalance = await connection.getTokenAccountBalance(ataUserTokenB.address);
  
  console.log("ataUserTokenA.address =", ataUserTokenA.address.toBase58());
  console.log("ataUserTokenB.address =", ataUserTokenB.address.toBase58());

	let tx = new Transaction();

  const modelDataAcc = config.modelDataAccount;
  const oldAmountA = new BN(0);
  const oldAmountB = new BN(0);

  tx.add(ComputeBudgetProgram.requestUnits({
	units: 1400000,
	additionalFee: 0,
  }));
	tx.add(await programRatioSdk.methods.addLiquidityToRaydium(
		5,
    oldAmountA,
    oldAmountB,
	).accounts({
		authority: testUserWallet.publicKey,
		globalState: RATIO_GLOBAL_STATE_KEY,
		ataTokenATreasury: ataTokenATreasury.address,
		ataTokenBTreasury: ataTokenBTreasury.address,
		ammId: new PublicKey(config.id),
		ammAuthority: new PublicKey(config.authority),
		ammOpenOrders: new PublicKey(config.openOrders),
		ammTargetOrders: new PublicKey(config.targetOrders),
    reserveTokenA: new PublicKey(config.baseVault), // Sol
    reserveTokenB: new PublicKey(config.quoteVault),// Usdc
    ataUserTokenA: ataUserTokenA.address,
    ataUserTokenB: ataUserTokenB.address,
    ataUserTokenLp: user_lp_ata,
    poolMint: new PublicKey(config.lpMint),
    tokenA: new PublicKey(config.baseMint),
    tokenB: new PublicKey(config.quoteMint),
    modelData: modelDataAcc,
		serumMarket: new PublicKey(config.marketId),
		raydiumSwapProgram: new PublicKey(config.programId),
		tokenProgram: TOKEN_PROGRAM_ID,
	}).instruction()
	);

	await handleTxn(tx, testUser.provider.connection, testUserWallet);

	await delay(2000);

}
