// anchor/solana
import {
    BN,
    Program,
    Wallet,
    workspace,
} from "@project-serum/anchor";
import {
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { Connection, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
// utils
import { assert, expect } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import { addZeros, handleTxn, toUiAmount } from "../utils/fxns";
import { User } from "../interfaces/user";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { GlobalState } from "../interfaces/GlobalState";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export const harvestRatioCall = async (
    userConnection: Connection,
    userkey: PublicKey,
    globalState: GlobalState,
    pool: Pool,
    vault: Vault,
    ataRatioGlobal: PublicKey,
    ataRatioVault: PublicKey,
    ataRatioTreasury: PublicKey,
    superUser: Wallet
) => {
    const transaction = new Transaction();
    const txn = transaction.add(
        await programRatioLending.methods.harvestRatio()
            .accounts({
                globalState: globalState.pubKey, //
                pool: pool.pubKey, //
                vault: vault.pubKey, //
                ataRatioGlobal,
                ataRatioVault,
                ataRatioTreasury,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).instruction()
    );

    await handleTxn(txn, userConnection, superUser);
}

export const harvestRatioPASS = async (user: User, accounts: Accounts, superUser: User) => {

    await programRatioLending.methods.fundRatioToken(
        new BN(addZeros(100000, 6)),
        null
    ).accounts({
        authority: superUser.wallet.publicKey,
        globalState: accounts.global.pubKey,
        pool: accounts.lpSaberUsdcUsdt.pool.pubKey,
        ratioVault: accounts.ataRatioVault.pubKey,
        userVault: superUser.tokens.ratio.ata.pubKey,
        tokenProgram: TOKEN_PROGRAM_ID
    }).rpc();

    let userRatioVault = await getOrCreateAssociatedTokenAccount(user.provider.connection, user.wallet.payer, accounts.ratioMint.mint, user.tokens.lpSaber.vault.pubKey, true);
    console.log("User Ratio Vault Balance before harvesting: ", toUiAmount(Number(userRatioVault.amount), accounts.ratioMint.decimals));
    await harvestRatioCall(
        user.provider.connection,
        user.wallet.publicKey,
        accounts.global,
        accounts.lpSaberUsdcUsdt.pool,
        user.tokens.lpSaber.vault,
        accounts.ataRatioVault.pubKey,
        userRatioVault.address,
        accounts.ataRatioTreasury.pubKey,
        superUser.wallet
    );
    userRatioVault = await getOrCreateAssociatedTokenAccount(user.provider.connection, user.wallet.payer, accounts.ratioMint.mint, user.tokens.lpSaber.vault.pubKey, true);
    console.log("User Ratio Vault Balance after harvesting: ", toUiAmount(Number(userRatioVault.amount), accounts.ratioMint.decimals));

}