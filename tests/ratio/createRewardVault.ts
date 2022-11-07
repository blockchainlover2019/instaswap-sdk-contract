// anchor imports
import { web3, Wallet } from "@project-serum/anchor";
import { Connection, PublicKey} from "@solana/web3.js";
import { handleTxn } from "../utils/fxns";
import { MintPubKey } from "../utils/interfaces";
//@ts-ignore
import { createAssociatedTokenAccountInstruction } from "@solana/spl-token";

/**
 * The rpc call that creates a rewards vault
 * A reward vault has ...
 * It does ...
 */
const createRewardVaultCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  vaultKey: PublicKey,
  vaultAtaRewardKey: PublicKey,
  poolKey: PublicKey,
  rewardMint: MintPubKey
) => {
  const txn = new web3.Transaction().add(
    createAssociatedTokenAccountInstruction(
      userWallet.publicKey,
      vaultAtaRewardKey,
      vaultKey,
      rewardMint
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);

  return receipt;
};

/**
 * Pass when attempting to make a vault that doesn't exist
 */
export const createVaultRewardAta = async (
  userWallet: Wallet,
  userConnection: Connection,
  vaultKey: PublicKey,
  vaultAtaRewardKey: PublicKey,
  poolKey: PublicKey,
  mintPubKey: MintPubKey
) => {
  const confirmation = await createRewardVaultCall(
    userConnection,
    userWallet,
    vaultKey,
    vaultAtaRewardKey,
    poolKey,
    mintPubKey
  );
  console.log("created reward vault: ", confirmation);

  // const vaultReward = await vault.ataReward.getBalance();
  // assert(
  //   vaultReward.value.amount == "0",
  //   "vault ata of reward balance mismatch"
  // );
};
