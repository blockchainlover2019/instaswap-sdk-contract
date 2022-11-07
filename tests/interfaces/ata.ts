// anchor/solana
import { Program, utils, Wallet, workspace } from "@project-serum/anchor";
import { AccountInfo, Connection, PublicKey, Signer } from "@solana/web3.js";
// TODO: figure out why linter throws error. It is because of quarry's package
import {
  // @ts-ignore
  mintTo,
  // @ts-ignore
  burn,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { User } from "../interfaces/user";
import { addZeros, createAtaOnChain, getAssocTokenAcct } from "../utils/fxns";
import { MintPubKey } from "../utils/interfaces";
import { RatioLending } from "../../target/types/ratio_lending";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * Associated Token Account
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 */
export class ATA {
  pubKey: PublicKey;
  bump?: number;
  /**  The public key of the mint account */
  mint: MintPubKey;
  /** The name of the token */
  nameToken?: string;
  /** The identifier of this class instance */
  nameInstance?: string;
  /** (DEPRECATED) The identifier of this class instance */
  name?: string;
  mintAuthPubKey?: PublicKey;
  mintAuth: User;
  decimals: number;
  /** in some cases, the auth is a P.D.A., not a User */
  authPubKey: PublicKey;
  owner: User;

  constructor(
    authPubKey: PublicKey,
    mintPubKey: MintPubKey,
    mintAuth: User,
    decimals: number,
    nameToken?: string,
    nameInstance?: string,
    mintAuthPubKey?: PublicKey,
    owner?: User
  ) {
    this.mint = mintPubKey;
    /** in some cases, the owner is a P.D.A., not a User */
    this.authPubKey = authPubKey;
    this.owner = owner;
    this.decimals = decimals;
    this.nameToken = nameToken;
    // TODO: deprecated
    this.name = nameInstance;
    this.nameInstance = nameInstance;
    this.mintAuth = mintAuth;
    // this is for PDA-based mints
    this.mintAuthPubKey = mintAuthPubKey
      ? mintAuthPubKey
      : this.mintAuth.wallet.publicKey;

    const [ataPubKey, ataBump] = getAssocTokenAcct(this.authPubKey, this.mint);
    this.pubKey = ataPubKey;
    this.bump = ataBump;
  }

  public async getBalance(
    program: Program<any> = programRatioLending as Program<RatioLending>
  ) {
    return await program.provider.connection.getTokenAccountBalance(
      this.pubKey
    );
  }

  /**
   * Get system account info for this address
   * @returns Object
   */
  public async getAccountInfo(): Promise<AccountInfo<Buffer>> {
    return await programRatioLending.provider.connection.getAccountInfo(
      this.pubKey
    );
  }

  /**
   * Mint token to this a.t.a. for testing purposes
   * If a.t.a. doesnt exist, create it
   * @param mintAmount
   * @param mintAuth
   * @param mintPubKey
   */
  public async mintToAta(
    mintAmount: number,
    destination: PublicKey = this.pubKey,
    user: User = this.mintAuth
  ) {
    await mintTo(
      user.provider.connection, // connection — Connection to use
      this.mintAuth.wallet.payer, // payer — Payer of the transaction fees
      this.mint, // mint — Mint for the account
      destination, // destination — Address of the account to mint to
      this.mintAuthPubKey, // authority — Minting authority
      mintAmount // mintAmount — Amount to mint
    );
  }

  /**
   * after a test ends, it can be useful to burn tokens
   *  to reset the balance for the next test.
   *
   * Setting burn amount to -1 will burn all tokens
   */
  public async burnTokens(
    burnAmount: number,
    mintAuth: User,
    userWallet: Wallet
  ) {
    // check if -1, then get the total amount in account
    const amtToBurn = (
      burnAmount === -1 ? (await this.getBalance()).value.amount : burnAmount
    ) as number;
    if (amtToBurn === 0) return;

    // send burn txn
    await burn(
      mintAuth.provider.connection, // connection
      userWallet.payer, // payer
      this.pubKey, // account: acct to burn tokens from
      this.mint, // mint: the token mint
      userWallet.publicKey, // owner: Account owner
      amtToBurn // amount: Amt of token to burn
    );
  }

  public async initAta(
    amtToMint: number = 0,
    userWallet: Wallet = this.owner.wallet,
    userConnection: Connection = this.owner.provider.connection
  ) {
    await createAtaOnChain(
      userWallet, // user wallet
      this, // assoc token acct
      this.mint, // mint pub key
      this.authPubKey, // auth, can be different than payer
      userConnection // connection
    );
    // mint tokens to this ata
    if (amtToMint > 0) {
      await this.mintToAta(addZeros(amtToMint, this.decimals));
    }
    return this;
  }
}
