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
import { handleTxn, toUiAmount } from "../utils/fxns";
import { User } from "../interfaces/user";
import { assert, use } from "chai";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { TokenRewardUser } from "../interfaces/TokenReward";
import { GlobalState } from "../interfaces/GlobalState";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { DECIMALS_RATIO } from "../utils/constants";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

const distributeRatioCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  ata_ratio_vault: PublicKey,
  ata_ratio_user: PublicKey,
  globalState: GlobalState,
  pool: Pool,
  vault: Vault,
) => {
  const userRatioBalPre = Number(
    (await userConnection.getTokenAccountBalance(ata_ratio_user))
      .value.amount
  );
  const vaultRatioBalPre = Number(
    (await userConnection.getTokenAccountBalance(ata_ratio_vault)).value
      .amount
  );
  const txn = new Transaction().add(
    programRatioLending.instruction.distributeReward({
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataRewardVault: ata_ratio_vault,
        ataRewardUser: ata_ratio_user,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
  const userRatioBalPost = Number(
    (await userConnection.getTokenAccountBalance(ata_ratio_user))
      .value.amount
  );
  const vaultRatioBalPost = Number(
    (await userConnection.getTokenAccountBalance(ata_ratio_vault))
      .value.amount
  );
  const userGain = userRatioBalPost - userRatioBalPre;
  console.log("user's gain =", toUiAmount(userGain, DECIMALS_RATIO));
  assert(vaultRatioBalPost === 0, "Not harvested all ratio rewards.");
  assert(vaultRatioBalPre === userGain, "ratio Reward should be sent fully");
};

export const distributeRatioPASS = async (
  user: User,
  accounts: Accounts
) => {
  const ata_ratio_vault = await getOrCreateAssociatedTokenAccount(user.provider.connection, user.wallet.payer, accounts.ratioMint.mint, user.tokens.lpSaber.vault.pubKey, true);
  const ata_ratio_user = await getOrCreateAssociatedTokenAccount(user.provider.connection, user.wallet.payer, accounts.ratioMint.mint, user.wallet.publicKey);

  const confirmation = await distributeRatioCall(
    user.provider.connection, // userConnection
    user.wallet, // userWallet
    ata_ratio_vault.address, //Vault's Ratio ATA Account
    ata_ratio_user.address, // User's Ratio ATA Account
    accounts.global, // global state
    accounts.lpSaberUsdcUsdt.pool, // pool
    user.tokens.lpSaber.vault, // vault,
  );
};
