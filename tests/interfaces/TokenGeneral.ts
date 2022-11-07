// anchor/solana
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Wallet } from "@project-serum/anchor";
import { Signer } from "@solana/web3.js";
// saber
import { SPLToken } from "@saberhq/token-utils";
//
import { MintPubKey } from "../utils/interfaces";
import { ATA } from "./ata";
import { User } from "./user";

/**
 * Base token-type class
 *
 * There are multiple types of tokens, used in different scenarios
 */
export class TokenGeneral {
  splToken: SPLToken;
  /** Should be the external off-platform user */
  mintAuth: User;
  /** String identifier for logging purposes */
  name: string;
  nameToken: string;
  /** Number of decimals, the precision */
  decimals: number;
  /** Calculated from the init-mint call */
  mint: MintPubKey;

  constructor(mintAuth: User, name: string, decimals: number) {
    this.name = name;
    this.nameToken = name;
    this.mintAuth = mintAuth;
    this.decimals = decimals;
  }

  /** Create the mint account for a given token */
  async initMint() {
    this.splToken = await SPLToken.createMint(
      // connection
      this.mintAuth.provider.connection,
      // payer
      (this.mintAuth.provider.wallet as Wallet).payer as Signer,
      // mint-authority
      this.mintAuth.provider.wallet.publicKey,
      // freeze-authority
      this.mintAuth.provider.wallet.publicKey,
      // decimals
      this.decimals,
      // program id
      TOKEN_PROGRAM_ID
    );

    this.mint = this.splToken.publicKey as MintPubKey;
  }

  /**
   * Mint a token to an ATA
   *
   * First check if its created
   * @param amountToMint
   * @param destinationATA
   * @param user
   */
  async mintToAta(amountToMint: number, destinationATA: ATA, user?: User) {
    if (!destinationATA.pubKey) throw new Error("A.T.A. not created");
    if (
      !user &&
      !(await user.provider.connection.getAccountInfo(destinationATA.pubKey))
    )
      await destinationATA.initAta(
        amountToMint,
        user.wallet,
        user.provider.connection
      );
    else {
      await destinationATA.mintToAta(amountToMint);
    }
  }
}
