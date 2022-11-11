// anchor/solana
import { Program, Provider, AnchorProvider, Wallet, workspace } from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
// local
import { airdropSol } from "../utils/fxns";
import { RatioSdk } from "../../target/types/ratio_sdk";

// init
const programRatioSdk = workspace.RatioSdk as Program<RatioSdk>;

export class User {
  wallet: Wallet;
  provider: Provider;

  constructor(keypair: Keypair, nameUser: string) {
    this.wallet = new Wallet(keypair);
    this.provider = new AnchorProvider(
      programRatioSdk.provider.connection,
      this.wallet,
      {
        skipPreflight: true,
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );
  }

  /**
   * Initialize acct, airdrop
   */
  public async initUser() {
    await airdropSol(
      this.provider,
      this.wallet.publicKey,
      99999 * LAMPORTS_PER_SOL
    );
  }
}
