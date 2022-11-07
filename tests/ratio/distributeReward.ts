import { Program, Wallet, workspace } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import { handleTxn } from "../utils/fxns";
import { User } from "../interfaces/user";
import { assert } from "chai";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { TokenRewardUser } from "../interfaces/TokenReward";
import { GlobalState } from "../interfaces/GlobalState";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

const distributeRewardCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  userRewardToken: TokenRewardUser,
  globalState: GlobalState,
  pool: Pool,
  vault: Vault,
) => {
  const userRewardBalPre = Number(
    (await userConnection.getTokenAccountBalance(userRewardToken.ata.pubKey))
      .value.amount
  );
  const rewardVaultBalPre = Number(
    (await userConnection.getTokenAccountBalance(vault.ataReward.pubKey)).value
      .amount
  );
  const txn = new Transaction().add(
    programRatioLending.instruction.distributeReward({
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataRewardVault: vault.ataReward.pubKey,
        ataRewardUser: userRewardToken.ata.pubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
  const userRewardBalPost = Number(
    (await userConnection.getTokenAccountBalance(userRewardToken.ata.pubKey))
      .value.amount
  );
  const rewardVaultBalPost = Number(
    (await userConnection.getTokenAccountBalance(vault.ataReward.pubKey))
      .value.amount
  );
  const userGain = userRewardBalPost - userRewardBalPre;
  console.log("user's gain =", userGain);

  assert(rewardVaultBalPost === 0, "Not harvested all rewards.");
  assert(rewardVaultBalPre === userGain, "Reward should be sent at all.");
};

export const distributeRewardsPASS = async (
  user: User,
  accounts: Accounts
) => {
  
  // console.log("treasury.tokens =", treasury.tokens);

  const confirmation = await distributeRewardCall(
    user.provider.connection, // userConnection
    user.wallet, // userWallet
    user.tokens.sbr, // userRewardToken
    accounts.global, // global state
    accounts.lpSaberUsdcUsdt.pool, // pool
    user.tokens.lpSaber.vault, // vault,
  );
};
