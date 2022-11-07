// anchor imports
import {
  getProvider,
  Program,
  web3,
  workspace,
  IdlAccounts,
  Wallet,
} from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { getAssocTokenAcct, handleTxn } from "../utils/fxns";
import { MintPubKey } from "../utils/interfaces";
import { Pool, RaydiumStablePool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

const createVaultCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  vaultKey: PublicKey,
  poolKey: PublicKey,
  mintPubKey: MintPubKey,
  ataCollatKey: PublicKey,
  raydiumPoolInfo: RaydiumStablePool | null = null
) => {
  const txn = new web3.Transaction().add(
    programRatioLending.instruction.createVault(
      {
        accounts: {
          // account that owns the vault
          authority: userWallet.publicKey,
          // state account where all the platform funds go thru or maybe are stored
          pool: poolKey,
          // the user's vault is the authority for the collateral tokens within it
          vault: vaultKey,
          // this is the vault's ATA for the collateral's mint, previously named tokenColl
          ataCollatVault: ataCollatKey,
          // the mint address for the specific collateral provided to this vault
          mintCollat: mintPubKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        },
        remainingAccounts: raydiumPoolInfo ? [{
          pubkey: await raydiumPoolInfo.getStakerInfoKey(userWallet.publicKey),
          isWritable: false,
          isSigner: false
        },{
          pubkey: raydiumPoolInfo.farmId,
          isWritable: false,
          isSigner: false
        }] : []
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);

  return receipt;
};

/**
 * Pass when attempting to make a vault that doesn't exist
 */
export const createVaultPASS = async (
  userWallet: Wallet,
  userConnection: Connection,
  vaultKey: PublicKey,
  poolKey: PublicKey,
  mintPubKey: MintPubKey,
  ataCollatKey: PublicKey,
  raydiumPoolInfo: RaydiumStablePool | null = null,
) => {
  // derive vault account
  console.log("getting vault acct");

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await programRatioLending.account.vault.getAccountInfo(vaultKey);

  // if not created, create user vault
  if (!vaultInfo) {
    const confirmation = await createVaultCall(
      userConnection,
      userWallet,
      vaultKey,
      poolKey,
      mintPubKey,
      ataCollatKey,
      raydiumPoolInfo
    );
    console.log("created vault: ", confirmation);
  } else console.log("User vault already created");

  // get the user vault state
  const vaultLpSaberAcct: IdlAccounts<RatioLending>["vault"] =
  await programRatioLending.account.vault.fetch(vaultKey);
  console.log("vaultLpSaberAcct.debt:", vaultLpSaberAcct.debt);
  // final asserts
  assert(vaultLpSaberAcct.debt.toNumber() == 0, "debt mismatch");
};

/**
 * Pass when attempting to make a vault that doesn't exist
 */
 export const createVaultFAIL_BeforeRaydiumLedger = async (
  userWallet: Wallet,
  userConnection: Connection,
  vaultKey: PublicKey,
  poolKey: PublicKey,
  mintPubKey: MintPubKey,
  ataCollatKey: PublicKey,
  raydiumPoolInfo: RaydiumStablePool | null = null,
) => {
  // derive vault account
  console.log("getting vault acct");

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await programRatioLending.account.vault.getAccountInfo(vaultKey);

  // if not created, create user vault
  await expect(createVaultCall(
    userConnection,
    userWallet,
    vaultKey,
    poolKey,
    mintPubKey,
    ataCollatKey,
    raydiumPoolInfo
  )).to.be.eventually.rejectedWith(Error).and.have.property('code', 6033)
};

/**
 * Fail when attempting to make a vault that already exists
 */
export const createVaultFAIL_Duplicate = async (
  userWallet: Wallet,
  userConnection: Connection,
  vaultKey: PublicKey,
  poolKey: PublicKey,
  mintPubKey: MintPubKey,
  ataCollatKey: PublicKey
) => {
  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(vaultKey);

  // if vault created, try to create another one for the same user (should fail)
  assert(vaultInfo, "User vault does not exist, test needs a vault");
  await expect(
    createVaultCall(userConnection, userWallet, vaultKey, poolKey, mintPubKey, ataCollatKey),
    "No error was thrown was trying to create a duplicate user vault"
  ).is.rejected;

  // get the user vault state
  const vaultLpSaberAcct: IdlAccounts<RatioLending>["vault"] =
    await programRatioLending.account.vault.fetch(vaultKey);
    console.log("vaultLpSaberAcct debt: ", vaultLpSaberAcct.debt);
    // final asserts
    assert(vaultLpSaberAcct.debt.toNumber() == 0, "debt mismatch");
  };
