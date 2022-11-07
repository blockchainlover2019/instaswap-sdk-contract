// anchor/solana
import { PublicKey } from "@solana/web3.js";
// interfaces
import { BaseAcct } from "../utils/interfaces";
import { ATA } from "./ata";
import { User } from "./user";

/**
 * Token created by a P.D.A.
 *
 * These have no user authority
 * from Base-Acct:
 * @property type;
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce
 * getAccount()
 */
export class TokenPda extends BaseAcct {
  /** String identifier for logging purposes */
  nameToken: string;
  /** Number of decimals, the precision */
  decimals: number;
  mintAuthPubKey: PublicKey;

  constructor(
    constant: string,
    seedsArr: Buffer[],
    nameToken: string,
    decimals: number
  ) {
    super(constant, seedsArr);

    this.nameToken = nameToken;
    this.decimals = decimals;
    this.type = "pda-token";
  }
}

export class TokenPDAUser {
  tokenPda: TokenPda;
  ata: ATA;

  constructor(user: User, tokenPda: TokenPda, mintAuthPubKey) {
    this.tokenPda = tokenPda;
    // TODO 030: get mintauthpubkey
    this.tokenPda.mintAuthPubKey;

    this.ata = new ATA(
      user.wallet.publicKey, // authPubKey
      tokenPda.pubKey, // mintPubKey
      null as User, // mintAuth
      tokenPda.decimals, // decimals
      tokenPda.nameToken, // nameToken
      `pda-user-${tokenPda.nameToken}`, // nameInstance
      mintAuthPubKey, // mintAuthPubKey
      user // owner
    );
  }
}
