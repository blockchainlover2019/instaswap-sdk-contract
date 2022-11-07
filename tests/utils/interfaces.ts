// anchor/solana
import { web3, workspace, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
// local
import { RatioLending } from "../../target/types/ratio_lending";
// utils
import { getPda } from "./fxns";
// interfaces
import { ATA } from "../interfaces/ata";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * Base Account
 * Just a public key
 * @property pubKey - PublicKey: Public Key for account
 */
export class Acct {
  pubKey: PublicKey;

  constructor(pubKey: PublicKey) {
    this.pubKey = pubKey;
  }

  /**
   * Get system account info for this address
   * @returns Object
   */
  public async getAccountInfo(): Promise<web3.AccountInfo<Buffer>> {
    return await programRatioLending.provider.connection.getAccountInfo(
      this.pubKey
    );
  }
}

/**
 * Program Derived Address
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 */
export class PDA extends Acct {
  constructor(pubKey: PublicKey) {
    super(pubKey);
  }
  bump: number;
}

export class MintPubKey extends PublicKey {}

/**
 * BaseAcct - a PDA with get-account method
 */
export class BaseAcct extends PDA {
  type: string;

  /**
   * Get account state for this address
   * @returns IdlAccounts<RatioLending>["<type of account>"]
   */
  public async getAccount(): Promise<any> {
    return await programRatioLending.account[this.type].fetch(this.pubKey);
  }

  constructor(constant: string, seedsArr: Buffer[]) {
    const [pubkey, bump] = getPda(
      [Buffer.from(constant), ...seedsArr],
      programRatioLending.programId
    );
    super(pubkey);
    this.bump = bump;
  }
}

/**
 * Associated Token Account - specifically for market tokens
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 */
export class AtaMarket extends ATA {}
