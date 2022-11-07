// anchor/solana
import { Program, Wallet, workspace } from "@project-serum/anchor";
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
import { SignerWallet } from "@saberhq/solana-contrib";
import { Token as SToken } from "@saberhq/token-utils";
import { QuarrySDK, QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import { MintPubKey } from "../utils/interfaces";
import { assert, expect } from "chai";
import { handleTxn, delay } from "../utils/fxns";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { User } from "../interfaces/user";
import { Miner } from "../interfaces/miner";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { GlobalState } from "../interfaces/GlobalState";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

const harvestFromSaberCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  // ratio-state accounts
  globalState: GlobalState,
  pool: Pool,
  // user-authored accounts
  vault: Vault,
  miner: Miner,
  // Quarry-specific accounts
  quarryAccount: PublicKey,
  quarryRewarder: PublicKey,
  minterPubKey: PublicKey,
  mintWrapperPubKey: PublicKey,
  mintWrapperProgramPubKey: PublicKey,
  claimFeeTokenAccountPubKey: PublicKey,
  mintRewardPubkey: PublicKey, // mintSbrPubkey,
  ataRatioTreasury: PublicKey,
) => {
  const treasuryBalPre = Number(
    (await userConnection.getTokenAccountBalance(ataRatioTreasury)).value.amount
  );
  const txn = new Transaction().add(
    programRatioLending.instruction.harvestRewardsFromSaber({
      accounts: {
        // ratio-state accounts
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        // user-authored accounts
        vault: vault.pubKey,
        miner: miner.pubkey,
        // Quarry-specific accounts
        quarry: quarryAccount,
        rewarder: quarryRewarder,
        minter: minterPubKey,
        mintWrapper: mintWrapperPubKey,
        mintWrapperProgram: mintWrapperProgramPubKey,
        claimFeeTokenAccount: claimFeeTokenAccountPubKey, // is this a quarry-specific account?
        ataRewardVault: vault.ataReward.pubKey,
        ataCollatMiner: miner.ata.pubKey,
        ataCollatVault: vault.ataCollat.pubKey,
        ataRatioTreasury,
        mintReward: mintRewardPubkey, // SBR for this example
        // system accounts
        quarryProgram: QUARRY_ADDRESSES.Mine,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );
  await handleTxn(txn, userConnection, userWallet);
  const treasuryBalPost = Number(
    (await userConnection.getTokenAccountBalance(ataRatioTreasury)).value.amount
  );
  const harvestFee = treasuryBalPost - treasuryBalPre;
  console.log("Saber harvestFee =", harvestFee);
};

export const harvestRewardsFromSaberPASS = async (
  user: User,
  treasury: User,
  accounts: Accounts
) => {
  // wait here to make rewards
  await delay(2000);
  const confirmation = await harvestFromSaberCall(
    user.provider.connection, // userConnection
    user.wallet, // userWallet
    accounts.global, // globalState
    accounts.lpSaberUsdcUsdt.pool, // pool
    user.tokens.lpSaber.vault, // vault,
    user.tokens.lpSaber.vault.miner, // minerKeys
    // quarry accounts
    accounts.lpSaberUsdcUsdt.pool.quarry.pubkey, // quarryAccount
    accounts.lpSaberUsdcUsdt.pool.quarry.rewarder, // quarryRewarder
    accounts.lpSaberUsdcUsdt.pool.quarry.minter, // minterPubKey
    accounts.lpSaberUsdcUsdt.pool.quarry.mintWrapper, // mintWrapperPubKey
    QUARRY_ADDRESSES.MintWrapper, // mintWrapperProgramPubKey
    accounts.lpSaberUsdcUsdt.pool.quarry.rewardClaimFeeAccount, // claimFeeTokenAccountPubKey
    accounts.sbr.mint, // mintRewardPubkey,
    treasury.tokens.sbr.ata.pubKey,
  );

  const userQuarryProvider = new SignerWallet(
    (user.wallet as any).payer
  ).createProvider(user.provider.connection);
  const sdk: QuarrySDK = QuarrySDK.load({ provider: userQuarryProvider });
  const rewarder = await sdk.mine.loadRewarderWrapper(
    accounts.lpSaberUsdcUsdt.pool.quarry.rewarder
  ); // .rewarderKey

  const poolMintToken = SToken.fromMint(
    accounts.lpSaberUsdcUsdt.mint,
    DECIMALS_USDCUSDT
  );
  const quarry = await rewarder.getQuarry(poolMintToken);

  const miner = await quarry.getMiner(user.tokens.lpSaber.vault.pubKey);
  assert(
    miner.authority.equals(user.tokens.lpSaber.vault.pubKey),
    "Miner'authority mismatch"
  );
};


export const harvestRewardsFromSaberFAIL_harvestOtherUserReward = async (
  user: User,
  otherUser: User,
  treasury: User,
  accounts: Accounts
) => {
  // wait here to make rewards
  await delay(2000);
  await expect(harvestFromSaberCall(
    user.provider.connection, // userConnection
    user.wallet, // userWallet
    accounts.global, // globalState
    accounts.lpSaberUsdcUsdt.pool, // pool
    user.tokens.lpSaber.vault, // vault,
    otherUser.tokens.lpSaber.vault.miner, // minerKeys
    // quarry accounts
    accounts.lpSaberUsdcUsdt.pool.quarry.pubkey, // quarryAccount
    accounts.lpSaberUsdcUsdt.pool.quarry.rewarder, // quarryRewarder
    accounts.lpSaberUsdcUsdt.pool.quarry.minter, // minterPubKey
    accounts.lpSaberUsdcUsdt.pool.quarry.mintWrapper, // mintWrapperPubKey
    QUARRY_ADDRESSES.MintWrapper, // mintWrapperProgramPubKey
    accounts.lpSaberUsdcUsdt.pool.quarry.rewardClaimFeeAccount, // claimFeeTokenAccountPubKey
    accounts.sbr.mint, // mintRewardPubkey
    treasury.tokens.sbr.ata.pubKey,
  )).to.be.eventually.rejectedWith(Error).and.have.property('code', 1100);

  const userQuarryProvider = new SignerWallet(
    (user.wallet as any).payer
  ).createProvider(user.provider.connection);
  const sdk: QuarrySDK = QuarrySDK.load({ provider: userQuarryProvider });
  const rewarder = await sdk.mine.loadRewarderWrapper(
    accounts.lpSaberUsdcUsdt.pool.quarry.rewarder
  ); // .rewarderKey

  const poolMintToken = SToken.fromMint(
    accounts.lpSaberUsdcUsdt.mint,
    DECIMALS_USDCUSDT
  );
  const quarry = await rewarder.getQuarry(poolMintToken);

  const miner = await quarry.getMiner(user.tokens.lpSaber.vault.pubKey);
  assert(
    miner.authority.equals(user.tokens.lpSaber.vault.pubKey),
    "Miner'authority mismatch"
  );
};

