import { Wallet } from "@project-serum/anchor";
// @ts-ignore
import { mintTo } from "@solana/spl-token";
import { SPLToken } from "@saberhq/token-utils";
import { Connection, Signer } from "@solana/web3.js";
import { addZeros, createAtaOnChain } from "../utils/fxns";
import { MintPubKey } from "../utils/interfaces";
import { ATA } from "./ata";
import { Oracle } from "./oracle";
import { TokenGeneral } from "./TokenGeneral";
import { User } from "./user";

/**
 * Token that exists within a market
 *
 * Contains an A.T.A., mint, market its within, Ratio oracle
 *
 * @class A.T.A.
 * @property mint - MintPubKey: mint for A.T.A.
 * @property bump? - u8: Bump/nonce for A.T.A.
 * @method getAccountInfo
 */
export class TokenMarket extends TokenGeneral {
  /** Must be created in the initMint call */
  mint: MintPubKey;
  /** Must be created after the initMint call */
  ata: ATA;
  // nameToken: string;
  nameMarket: string;
  namePlatform: string;
  /// oracle account
  oracle: Oracle;

  /**
   * We need to also call initAta following instantiation to create the A.T.A.
   *
   * The mint used for creating the A.T.A. requires an async call, which cannot be done in the constructor.
   * @param mintAuth
   * @param decimals
   * @param nameToken
   * @param nameMarket
   * @param namePlatform
   */
  constructor(
    mintAuth: User,
    decimals: number,
    nameToken: string,
    nameMarket: string,
    namePlatform: string
  ) {
    super(mintAuth, `mkt-${namePlatform}-${nameMarket}-${nameToken}`, decimals);

    this.nameMarket = nameMarket;
    this.namePlatform = namePlatform;
    this.nameToken = nameToken;
  }

  /**
   * Create the mint, oracle, market token ata, and mint
   * @param initTokenAmt
   */
  public async initMktToken(initTokenAmt: number = 0) {
    // add the spl token and mint pub key
    await this.initMint();

    if (!this.mint) throw new Error("Mint not initialized");

    this.ata = await new ATA(
      this.mintAuth.wallet.publicKey, // authPubKey
      this.mint, // mintPubKey
      this.mintAuth, // mintAuth
      this.decimals, // decimals
      this.nameToken, // nameToken
      `mkt-${this.nameToken}`, // nameInstance
      null, // mintAuthPubKey
      this.mintAuth // owner
    ).initAta(initTokenAmt);

    this.oracle = new Oracle(this.mint, this.nameToken);

    console.log(`${this.name} ata balance: `, await this.ata.getBalance());
  }

  /**
   * set the users field for this specific token
   *
   * @param usersArr
   */
   public async initMrktTokenForUsers(usersArr: User[], amountToMint?: number) {
    usersArr.forEach(async (user: User) => {
      // TokenUserCollat -> TokenCollatUser
      user.tokens[this.nameToken] = new TokenMarketUser(user, this);
      let ata = await (user.tokens[this.nameToken] as TokenMarketUser).ata.initAta(amountToMint);
    });
  }
}

export class TokenMarketUser {
  tokenMarket: TokenMarket;
  ata: ATA;
  mint: MintPubKey;

  constructor(user: User, tokenMarket: TokenMarket) {
    this.tokenMarket = tokenMarket;
    this.mint = this.tokenMarket.mint;

    this.ata = new ATA(
      user.wallet.publicKey, // authPubKey
      this.tokenMarket.mint, // mintPubKey
      this.tokenMarket.mintAuth, // mintAuth
      this.tokenMarket.decimals, // decimals
      this.tokenMarket.nameToken, // nameToken
      `mkt-user-${this.tokenMarket.nameToken}`, // nameInstance
      null, // mintAuthPubKey
      user // owner
    );
  }
}
