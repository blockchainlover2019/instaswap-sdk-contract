import { createAtaOnChain } from "../utils/fxns";
import { ATA } from "./ata";
import { Pool } from "./pool";
import { TokenCollat } from "./TokenCollat";
import { User } from "./user";
import { Vault } from "./vault";

/**
 * User Token class for a given collateral type
 *
 * For a given user, each collateral type has a pool, a vault, and the user's A.T.A.
 *
 * Contains an A.T.A. and a Vault
 *
 * @class A.T.A.
 * @property pubKey - PublicKey: Public Key for A.T.A.
 * @property bump? - u8: Bump/nonce for A.T.A.
 * @class Vault
 * @property pubKey - PublicKey: Public Key for A.T.A.
 * @property bump - u8: Bump/nonce for A.T.A.
 * @property ATA
 * @method getAccountInfo
 */
export class TokenCollatUser {
  /** The user that authorizes/signs for this account */
  authority: User;
  /** The user's A.T.A. for the collateral token */
  ata: ATA;
  /** The user's vault for the collateral token */
  vault: Vault;
  nameInstance: string;
  tokenCollat: TokenCollat;

  constructor(authority: User, tokenCollat: TokenCollat, pool: Pool) {
    this.authority = authority;
    this.tokenCollat = tokenCollat;
    this.nameInstance = `collat-user-${this.tokenCollat.nameToken}`;

    // create the user's A.T.A. for this collateral token
    this.ata = new ATA(
      this.authority.wallet.publicKey, // authPubKey
      this.tokenCollat.mint, // mintPubKey
      this.tokenCollat.mintAuth, // mintAuth
      this.tokenCollat.decimals, // decimals
      this.tokenCollat.nameToken, // nameToken
      this.nameInstance, // nameInstance
      null, // mintAuthPubKey
      this.authority // owner
    );

    this.vault = new Vault(this.authority.wallet, pool, this.authority, this);
  }

  /** create an A.T.A. on chain for this given user and collateral pair */
  public async initCollatUser() {
    await this.ata.initAta();
  }
}
