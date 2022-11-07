// anchor/solana
import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    // @ts-ignore
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
// utils
import { assert, expect, use } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import { DECIMALS_USDC, DECIMALS_USDCUSDT, DECIMALS_USDT } from "../utils/constants";
import { addZeros, getAssocTokenAcct, handleTxn, toUiAmount } from "../utils/fxns";
// interfaces
import { User } from "../interfaces/user";
import { MintPubKey } from "../utils/interfaces";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { GlobalState } from "../interfaces/GlobalState";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
import { UserState } from "../interfaces/userState";
import { TokenMarket } from "../interfaces/TokenMarket";
import { BlackList } from "../interfaces/blacklist";
import { Miner } from "../interfaces/miner";
import { QuarryClass } from "../interfaces/quarry";
import { StableSwap, SWAP_PROGRAM_ID } from "@saberhq/stableswap-sdk";
import { sleep, u64 } from "@saberhq/token-utils";
import { Users } from "../interfaces";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount, getAccount as getTokenAccount } from "@solana/spl-token";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 */
export const unwindLpSaberCall = async (
    reporter: User,
    baseUser: User,
    accounts: Accounts,
    liquidationAmountUi: number,
    saberSwap: StableSwap,
    pool: Pool,
    ataUsdcVaultKey: PublicKey 
) => {
    const liquidationAmountUiPrecise = addZeros(liquidationAmountUi, DECIMALS_USDCUSDT);

    let txn = new Transaction().add(
        programRatioLending.instruction.removeLiquidityFromSaber(
            new BN(liquidationAmountUiPrecise),
            {
                accounts: {
                    authority: reporter.wallet.publicKey,
                    baseUser: baseUser.wallet.publicKey,
                    globalState: accounts.global.pubKey,
                    pool: accounts.lpSaberUsdcUsdt.pool.pubKey,
                    userState: baseUser.userState.pubKey,
                    vault: baseUser.tokens.lpSaber.vault.pubKey,
                    ataVault: baseUser.tokens.lpSaber.vault.ataCollat.pubKey,
                    ataOutputVault: ataUsdcVaultKey,
                    saberSwap: {
                        ammId: saberSwap.config.swapAccount,
                        authority: saberSwap.config.authority,
                        feeAccount: saberSwap.state.tokenA.adminFeeAccount,
                        lpMint: saberSwap.state.poolTokenMint,
                        reserveA: saberSwap.state.tokenA.reserve,
                        reserveB: saberSwap.state.tokenB.reserve,
                    },
                    swapProgram: SWAP_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }
            },
        ));

    const reciept = await handleTxn(txn, reporter.provider.connection, reporter.wallet);
    
    return reciept;
}
export const unwindLpSaberPASS = async (
    users: Users,
    accounts: Accounts,
    liquidationAmountUi: number,
) => {
    console.log("Liquidating Amount: ", liquidationAmountUi);
    
    const saberSwap = accounts.saberUsdcUsdtSwap;
    const userLpSaber = users.base.tokens.lpSaber;
    const pool = accounts.lpSaberUsdcUsdt.pool;

    const ataUsdcVaultPre = await getOrCreateAssociatedTokenAccount(users.base.provider.connection, users.base.wallet.payer, users.base.tokens.usdc.mint, users.base.tokens.lpSaber.vault.pubKey, true);
    const vaultBalPre = (await userLpSaber.vault.ataCollat.getBalance()).value.uiAmount;

    console.log("\nUSDC in Vault Before Unwinding: ", toUiAmount(ataUsdcVaultPre.amount.toString(), DECIMALS_USDC));
    console.log("Saber LP in vault Before Unwinding: ", vaultBalPre)

    await unwindLpSaberCall(
        users.oracleReporter,
        users.base,
        accounts,
        liquidationAmountUi,
        saberSwap,
        pool,
        ataUsdcVaultPre.address
    );

    const ataUsdcVaultPost = await getOrCreateAssociatedTokenAccount(users.base.provider.connection, users.base.wallet.payer, users.base.tokens.usdc.mint, users.base.tokens.lpSaber.vault.pubKey, true);
    console.log("\nUSDC in Vault After Unwinding: ", toUiAmount(ataUsdcVaultPost.amount.toString(), DECIMALS_USDC));

    const vaultBalPost = (await userLpSaber.vault.ataCollat.getBalance()).value.uiAmount;
    console.log("Saber LP in Vault After Unwinding: ", vaultBalPost)

    const ataUsdcVaultDiff = toUiAmount(Number(ataUsdcVaultPost.amount - ataUsdcVaultPre.amount), DECIMALS_USDC);
    const vaultBalDiff = vaultBalPre - vaultBalPost

    // Slippage 0.5 % , this can include swap fees..etc
    const onePercentOfLiquidationAmount = liquidationAmountUi * 0.005;
    
    assert(
        Math.abs(ataUsdcVaultDiff - liquidationAmountUi) < onePercentOfLiquidationAmount,
        `Expected USDC Vault Diff: ${liquidationAmountUi} Actual USDC Vault Diff: ${ataUsdcVaultDiff}`
    );
    assert(
        Math.abs(vaultBalDiff - liquidationAmountUi) < onePercentOfLiquidationAmount,
        `Expected Vault LP Balance Diff: ${liquidationAmountUi} Actual Vault LP Balance Diff: ${vaultBalDiff}`
    );
};

// Here super User is not signing the tx and hence will fail
export const unwindLpSaberFAIL = async (
    users: Users,
    accounts: Accounts,
    liquidationAmountUi: number,
) => {

    const saberSwap = accounts.saberUsdcUsdtSwap;
    const userLpSaber = users.base.tokens.lpSaber;
    const pool = accounts.lpSaberUsdcUsdt.pool;

    const ataUsdcVaultPre = await getOrCreateAssociatedTokenAccount(users.base.provider.connection, users.base.wallet.payer, users.base.tokens.usdc.mint, users.base.tokens.lpSaber.vault.pubKey, true);
    const vaultBalPre = (await userLpSaber.vault.ataCollat.getBalance()).value.uiAmount;
    
    await expect(unwindLpSaberCall(
        users.base,
        users.base,
        accounts,
        liquidationAmountUi,
        saberSwap,
        pool,
        ataUsdcVaultPre.address
    )).to.be.eventually.rejectedWith(Error).and.have.property('code', 2012);
    
    const ataUsdcVaultPost = await getOrCreateAssociatedTokenAccount(users.base.provider.connection, users.base.wallet.payer, users.base.tokens.usdc.mint, users.base.tokens.lpSaber.vault.pubKey, true);
    const vaultBalPost = (await userLpSaber.vault.ataCollat.getBalance()).value.uiAmount;

    const ataUsdcVaultDiff = toUiAmount(Number(ataUsdcVaultPost.amount - ataUsdcVaultPre.amount), DECIMALS_USDC);
    const vaultBalDiff = vaultBalPre - vaultBalPost

    assert(
        ataUsdcVaultDiff == 0 ,
        `Expected USDC Vault Diff: 0\t Actual USDC Vault Diff: ${ataUsdcVaultDiff}`
    );
    assert(
        vaultBalDiff == 0,
        `Expected Vault LP Balance Diff: 0\t Actual Vault LP Balance Diff: ${vaultBalDiff}`
    );
};

