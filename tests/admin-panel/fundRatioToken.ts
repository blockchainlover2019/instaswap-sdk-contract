// anchor/solana
import {
    BN,
    IdlAccounts,
    Program,
    Wallet,
    workspace,
  } from "@project-serum/anchor";
  import {
    TOKEN_PROGRAM_ID,
    // @ts-ignore
    getAssociatedTokenAddress,
    // @ts-ignore
    createAssociatedTokenAccount
  } from "@solana/spl-token";
  import { Connection, Transaction, PublicKey } from "@solana/web3.js";
  // utils
  import { assert, expect } from "chai";
  // local
  import { RatioLending } from "../../target/types/ratio_lending";
  import { Accounts } from "../config/accounts";
  import { addZeros, handleTxn } from "../utils/fxns";
  // interfaces
  import { User } from "../interfaces/user";
  import { GlobalState } from "../interfaces/GlobalState";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export const fundRatioToken = async (
    userConnection: Connection,
    userWallet: Wallet,
    globalState: GlobalState,
    pool: PublicKey,
    ratioMint: PublicKey,
    ratioVault: PublicKey,
) => {
    const fundAmount = 10000;
    const durationInDay = 30; // 30 days

    const transaction = new Transaction();
    const ataUserRatio = await getAssociatedTokenAddress(ratioMint, userWallet.publicKey);
    if (!(await userConnection.getAccountInfo(ataUserRatio))) {
        await createAssociatedTokenAccount(
            userConnection,
            userWallet.payer,
            ratioMint,
            userWallet.publicKey
        );
    }
    
    let balance = (await userConnection.getTokenAccountBalance(ataUserRatio)).value.uiAmount;
    console.log("ratio balance =", balance);

    const txn = transaction.add(
        await programRatioLending.methods.fundRatioToken(
            new BN(Math.round(fundAmount * 10 ** 6)),
            new BN(durationInDay * 24 * 3600),
        ).accounts({
            authority: userWallet.publicKey,
            globalState: globalState.pubKey, //
            pool,
            ratioVault,
            userVault: ataUserRatio,
            tokenProgram: TOKEN_PROGRAM_ID
        }).instruction()
    );
    
    await handleTxn(txn, userConnection, userWallet);
}

export const fundRatioTokenPASS = async (user: User, accounts: Accounts) => {
    await fundRatioToken(
        user.provider.connection,
        user.wallet,
        accounts.global,
        // pool
        accounts.lpSaberUsdcUsdt.pool.pubKey,
        accounts.ratioMint.mint,
        accounts.ataRatioVault.pubKey
    );
}

export const fundRatioTokenFAIL_auth = async (user: User, accounts: Accounts) => {
    await expect(fundRatioToken(
        user.provider.connection,
        user.wallet,
        accounts.global,
        // pool
        accounts.lpSaberUsdcUsdt.pool.pubKey,
        accounts.ratioMint.mint,
        accounts.ataRatioVault.pubKey
    )).to.be.eventually.rejectedWith(Error).and.have.property('code', 6022);
}

