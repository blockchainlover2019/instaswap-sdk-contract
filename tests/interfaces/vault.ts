// anchor/solana
import { Wallet } from "@project-serum/anchor";
// utils
import { VAULT_SEED } from "../utils/constants";
// interfaces
import { BaseAcct } from "../utils/interfaces";
import { ATA } from "./ata";
import { Miner } from "./miner";
import { Pool } from "./pool";
import { TokenCollatUser } from "./TokenCollatUser";
import { User } from "./user";

/**
 * Vault
 * Just a public key
 * @property pubKey - PublicKey: Public Key for account
 * @property bump - u8: Bump/nonce
 * @method getAccountInfo - gets account state information on chain
 */
export class Vault extends BaseAcct {
  ataCollat: ATA;
  ataReward: ATA;
  pool: Pool;
  owner: User;
  miner: Miner;

  constructor(
    userWallet: Wallet,
    pool: Pool,
    owner: User,
    tokenCollatUser: TokenCollatUser
  ) {
    super(VAULT_SEED, [
      pool.tokenCollat.mint.toBuffer(),
      userWallet.publicKey.toBuffer(),
    ]);
    this.type = "vault";
    this.owner = owner;
    this.pool = pool;

    // get ata info
    this.ataCollat = new ATA(
      this.pubKey, // authPubKey
      this.pool.tokenCollat.mint, // mintPubKey
      this.pool.tokenCollat.mintAuth, // mintAuth
      this.pool.tokenCollat.decimals, // decimals
      this.pool.tokenCollat.nameToken, // nameToken
      null, // nameInstance
      null, // mintAuthPubKey
      this.owner // userOwner
    );
    this.ataReward = new ATA(
      this.pubKey, // authPubKey
      this.pool.tokenReward.mint, // mintPubKey
      this.pool.tokenReward.mintAuth, // mintAuth
      this.pool.tokenReward.decimals, // decimals
      this.pool.tokenReward.nameToken, // nameToken
      null, // nameInstance
      null, // mintAuthPubKey
      this.owner // userOwner
    );

    // create miner
    if (!this.pool.quarry) throw new Error("Please add quarry instance");
    this.miner = new Miner(tokenCollatUser, this.pool.tokenReward, this, this.pool);
  }

  /**
   * Create the A.T.A.s on chain
   */
  public async initVault() {
    await this.ataCollat.initAta();
    await this.ataReward.initAta();
  }
}
