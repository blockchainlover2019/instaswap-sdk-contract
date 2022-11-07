// solana/anchor
import { BN, Program, web3, workspace } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// local
import { RatioLending } from "../../target/types/ratio_lending";
// utils
import {
  DEBT_CEILING_GLOBAL_USDR,
  DEBT_CEILING_USER_USDR,
  DECIMALS_USD,
  DECIMALS_USDR,
  GLOBAL_STATE_SEED,
  MINT_RATIO_KEY,
  MINT_USDR_KEYPAIR,
  TVL_LIMIT_USD,
} from "../utils/constants";
import { translateError } from "../utils/errors";
import { addZeros, handleTxn } from "../utils/fxns";
// interfaces
import { BaseAcct } from "../utils/interfaces";
import { TokenPda } from "./TokenPDA";
import { User } from "./user";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export class GlobalState extends BaseAcct {
  usdr: TokenPda;
  oracleReporter: User;
  

  constructor(usdr: TokenPda, oracleReporter: User) {
    super(GLOBAL_STATE_SEED, []);
    this.type = "globalState";
    this.usdr = usdr;
    this.oracleReporter = oracleReporter;
  }

  // public async getAccount(): Promise<IdlAccounts<RatioLending>["vault"]> {
  //   return await this.getAccount();
  // }

  public async initGlobalState(userSuper: User, ratioMint: PublicKey) {
    // create txn
    const txn = new web3.Transaction();
    // add instruction
    try {
      const txHash = await programRatioLending.methods.createGlobalState(
        new BN(addZeros(TVL_LIMIT_USD, DECIMALS_USD)),
        new BN(addZeros(DEBT_CEILING_GLOBAL_USDR, DECIMALS_USDR)),
        new BN(addZeros(DEBT_CEILING_USER_USDR, DECIMALS_USDR)),
        // for verifying
        this.oracleReporter.wallet.publicKey,).accounts({
          authority: userSuper.wallet.publicKey,
          globalState: this.pubKey,
          mintUsdr: this.usdr.pubKey,
          ratioMint: ratioMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([Keypair.fromSecretKey(new Uint8Array(MINT_USDR_KEYPAIR))]).rpc()
      return txHash;
    } catch (e) {
      translateError(e);
    }
  }
}
