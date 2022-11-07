// anchor/solana
import {
    Program,
    Wallet,
    workspace,
  } from "@project-serum/anchor";
  import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID
  } from "@solana/spl-token";
  import { Connection, Transaction, SystemProgram, PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
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

export const setRatioMint = async (
    userConnection: Connection,
    userWallet: Wallet,
    globalState: GlobalState,
    ratioMint: PublicKey,
    ratioVault: PublicKey
) => {
    const transaction = new Transaction();
    const txn = transaction.add(
        await programRatioLending.methods.setRatioMint()
        .accounts({
            authority: userWallet.publicKey,
            globalState: globalState.pubKey, //
            ratioVault,
            ratioMint: ratioMint,
            // system accts
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
        }).instruction()
    );
    
    await handleTxn(txn, userConnection, userWallet);
}

export const setRatioMintPASS = async (user: User, accounts: Accounts) => {
    await setRatioMint(
        user.provider.connection,
        user.wallet,
        accounts.global,
        accounts.ratioMint.mint,
        accounts.ataRatioVault.pubKey
    );
}

export const setRatioMintFAIL_auth = async (user: User, accounts: Accounts) => {
    await expect(
        setRatioMint(
            user.provider.connection,
            user.wallet,
            accounts.global,
            accounts.ratioMint.mint,
            accounts.ataRatioVault.pubKey
        )
    ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2001);
}