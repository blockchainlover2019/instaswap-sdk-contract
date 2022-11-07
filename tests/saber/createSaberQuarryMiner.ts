// anchor imports
import { Program, workspace } from "@project-serum/anchor";
// solana imports
import { Token as SToken } from "@saberhq/token-utils";
// utils
import { assert, expect } from "chai";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// quarry
import { QuarrySDK, QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// local
import { RatioLending } from "../../target/types/ratio_lending";
// import { Periphery } from "../../target/types/periphery";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { handleTxn } from "../utils/fxns";
// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;
// const programPeriphery = workspace.Periphery as Program<Periphery>;

/**
 * Pass when attempting to make a quarry miner that doesn't exist
 */
export const createSaberQuarryMinerPASS = async (
  user: User,
  accounts: Accounts
) => {
  const minerUser = user.tokens.lpSaber.vault.miner;
  const confirmation = await minerUser.initMiner();
  console.log("created miner: ", confirmation);

  // create the SToken for collateral (usdc usdt lp) mint  prev poolMintToken
  const mintCollatSToken = SToken.fromMint(
    accounts.lpSaberUsdcUsdt.mint,
    DECIMALS_USDCUSDT
  );

  // get the miner. param is the authority
  const miner =
    await accounts.lpSaberUsdcUsdt.pool.quarry.quarryWrapper.getMiner(
      user.tokens.lpSaber.vault.pubKey
    );
  assert(
    miner.authority.equals(user.tokens.lpSaber.vault.pubKey),
    "Miner authority mismatch"
  );
};

export const createSaberQuarryMinerFAIL_forOtherUserReward = async (
  user: User,
  otherUser: User,
  accounts: Accounts
) => {
  const minerUser = user.tokens.lpSaber.vault.miner;
  const otherUserMiner = otherUser.tokens.lpSaber.vault.miner;
  const txn = new Transaction().add(
    // programPeriphery.instruction.createSaberQuarryMiner(miner.bump, {
    programRatioLending.instruction.createSaberQuarryMiner(minerUser.bump, {
      accounts: {
        authority: minerUser.tokenCollatUser.authority.wallet.publicKey,
        pool: minerUser.pool.pubKey,
        vault: minerUser.vault.pubKey,
        miner: minerUser.pubkey,
        ataCollatMiner: otherUserMiner.ata.pubKey,
        // quarry
        quarry: minerUser.pool.quarry.pubkey,
        rewarder: minerUser.pool.quarry.rewarder,
        mintCollat: minerUser.tokenCollatUser.tokenCollat.mint,
        quarryProgram: QUARRY_ADDRESSES.Mine,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    })
  );
  // send transaction
  await expect(
    handleTxn(txn, user.provider.connection, user.wallet)
  ).to.be.rejected;
}
// createSaberQuarryMinerFAIL_dupMinerForOneVault

export const createSaberQuarryMinerFAIL_dupMiner = async (
  user: User,
  accounts: Accounts
) => {
  const minerUser = user.tokens.lpSaber.vault.miner;
  await expect(
    minerUser.initMiner()
  ).to.be.rejected;
};