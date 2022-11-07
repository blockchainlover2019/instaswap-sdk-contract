// anchor/solana
import {
    BN,
    IdlAccounts,
    Program,
    Wallet,
    workspace,
  } from "@project-serum/anchor";
  import { Connection, Transaction, PublicKey } from "@solana/web3.js";
  // utils
  import { assert, expect } from "chai";
  // local
  import { RatioLending } from "../../target/types/ratio_lending";
  import { Accounts } from "../config/accounts";
  import { handleTxn } from "../utils/fxns";
  import { User } from "../interfaces/user";
  import { GlobalState } from "../interfaces/GlobalState";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export const changeFundingWallet = async (
    userConnection: Connection,
    userWallet: Wallet,
    fundingWallet: PublicKey,
    globalState: GlobalState,
) => {
    const transaction = new Transaction();
    const txn = transaction.add(
        await programRatioLending.methods.changeFundingWallet()
        .accounts({
            authority: userWallet.publicKey,
            globalState: globalState.pubKey, //
            fundingWallet
        }).instruction()
    );
    
    await handleTxn(txn, userConnection, userWallet);
}

export const changeFundingWalletPASS = async (user: User, fundingUser: User, accounts: Accounts) => {
    await changeFundingWallet(
        user.provider.connection,
        user.wallet,
        fundingUser.wallet.publicKey,
        accounts.global
    );
}

export const changeFundingWalletFAIL_auth = async (user: User, fundingUser: User, accounts: Accounts) => {
    await expect(changeFundingWallet(
        user.provider.connection,
        user.wallet,
        fundingUser.wallet.publicKey,
        accounts.global
    )).to.be.eventually.rejectedWith(Error).and.have.property('code', 2001);
}
