// anchor/solana
import { Program, web3, workspace } from "@project-serum/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// saber
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// utils
import { getPda, handleTxn } from "../utils/fxns";
import { RatioLending } from "../../target/types/ratio_lending";
// interfaces
import { ATA } from "./ata";
import { Pool } from "./pool";
import { Vault } from "./vault";
import { TokenReward } from "./TokenReward";
import { TokenCollatUser } from "./TokenCollatUser";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  // @ts-ignore
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * owned by a user
 */
export class Miner {
  pubkey: PublicKey;
  bump: number;
  ata: ATA;
  // TODO: combine reward token into one class and input
  tokenReward: TokenReward;
  tokenCollatUser: TokenCollatUser;
  pool: Pool;
  vault: Vault;

  constructor(
    tokenCollatUser: TokenCollatUser,
    tokenReward: TokenReward,
    vault: Vault,
    pool: Pool
  ) {
    this.tokenReward = tokenReward;
    this.vault = vault;
    this.tokenCollatUser = tokenCollatUser;
    this.pool = pool;

    const [pubkey, bump] = getPda(
      [
        Buffer.from("Miner"), // b"Miner".as_ref(),
        this.pool.quarry.pubkey.toBuffer(), // quarry.key().to_bytes().as_ref(),
        this.vault.pubKey.toBuffer(), // authority.key().to_bytes().as_ref()
      ],
      QUARRY_ADDRESSES.Mine
    );
    this.pubkey = pubkey;
    this.bump = bump;

    // alias: miner_vault
    this.ata = new ATA(
      this.pubkey, // authPubKey
      this.tokenCollatUser.tokenCollat.mint, // mintPubKey
      this.tokenCollatUser.tokenCollat.mintAuth, // mintAuth
      this.tokenCollatUser.tokenCollat.decimals, // decimals
      this.tokenCollatUser.tokenCollat.nameToken, // nameToken
      `miner-${this.tokenCollatUser.tokenCollat.nameToken}-${this.tokenReward.nameToken}`, // nameInstance
      null // mintAuthPubKey
      // this.tokenCollatUser.authority // owner
    );
  }
  async initMiner() {
    const txn = new web3.Transaction().add(
      // programPeriphery.instruction.createSaberQuarryMiner(miner.bump, {
      programRatioLending.instruction.createSaberQuarryMiner(this.bump, {
        accounts: {
          authority: this.tokenCollatUser.authority.wallet.publicKey,
          pool: this.pool.pubKey,
          vault: this.vault.pubKey,
          miner: this.pubkey,
          ataCollatMiner: this.ata.pubKey,
          // quarry
          quarry: this.pool.quarry.pubkey,
          rewarder: this.pool.quarry.rewarder,
          mintCollat: this.tokenCollatUser.tokenCollat.mint,
          quarryProgram: QUARRY_ADDRESSES.Mine,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        },
      })
    );
    // send transaction
    const receipt = await handleTxn(
      txn,
      this.tokenCollatUser.authority.provider.connection,
      this.tokenCollatUser.authority.wallet
    );
    return receipt;
  }
}
