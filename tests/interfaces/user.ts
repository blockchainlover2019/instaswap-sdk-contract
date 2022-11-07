// anchor/solana
import { Program, Provider, AnchorProvider, Wallet, workspace } from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
// local
import { airdropSol } from "../utils/fxns";
import { RatioLending } from "../../target/types/ratio_lending";
import { UserState } from "./userState";
import { TokenCollatUser } from "./TokenCollatUser";
import { TokenReward, TokenRewardUser } from "./TokenReward";
import { TokenPDAUser } from "./TokenPDA";
import { ATA } from "./ata";
import { Vault } from "./vault";
import { TokenMarketUser } from "./TokenMarket";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export class User {
  wallet: Wallet;
  provider: Provider;
  tokens?: {
    usdr?: TokenPDAUser;
    lpSaber?: TokenCollatUser; // this doesnt get created until the pass case for vault
    sbr?: TokenRewardUser;
    lpUsdcUsdtRaydiumAta?: PublicKey;
    rayAta?: PublicKey;
    ratio?: TokenRewardUser;
    ray?: TokenRewardUser;
    usdc?: TokenMarketUser;
    usdt? : TokenMarketUser;
  };
  userState: UserState;
  name: string;
  lpUsdcUsdtRaydiumVaultKey?: PublicKey

  constructor(keypair: Keypair, nameUser: string) {
    this.wallet = new Wallet(keypair);
    this.provider = new AnchorProvider(
      programRatioLending.provider.connection,
      this.wallet,
      {
        skipPreflight: true,
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );
    this.tokens = {};

    this.userState = new UserState(this);
    this.name = nameUser;
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

  public async addTokenReward(tokenReward: TokenReward) {
    this.tokens[tokenReward.nameToken] = tokenReward as TokenReward;
    await (this.tokens[tokenReward.nameToken] as TokenReward).initTokenReward();
  }
}
