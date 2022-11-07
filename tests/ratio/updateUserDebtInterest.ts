// anchor/solana
import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
// local
import { RatioLending } from "../../target/types/ratio_lending";
// interfaces
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { Vault } from "../interfaces/vault";

//@ts-ignore
import { Pool } from "../interfaces";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export const updateUserDebtInterest = async (
  pool: Pool, 
  user: User, 
  vault: Vault, 
  reporter: User, 
  accounts: Accounts,
) => {
  const SWITCHBOARD_MAINNET_USDR_USDC = 
    new PublicKey("3kQwNesSZdbFagwER26mBveGeLSWLLdsnE7tbsJCeoTt");
  let txHash = await programRatioLending.methods.updateUsdrDebtInterest()
    .accounts({
      authority: reporter.wallet.publicKey,
      globalState: accounts.global.pubKey,
      vault: vault.pubKey,
      feedAccount: SWITCHBOARD_MAINNET_USDR_USDC
    })
    .signers([reporter.wallet.payer])
    .rpc();
  console.log(`tx hash is`, txHash);
}
