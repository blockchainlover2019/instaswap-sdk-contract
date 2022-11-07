// anchor/solana
import { workspace, Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
// saber
import {
  findMinterAddress,
  QuarrySDK,
  QuarryWrapper,
  RewarderWrapper,
  QUARRY_ADDRESSES,
} from "@quarryprotocol/quarry-sdk";
import { TokenAmount, Token as SToken, u64 } from "@saberhq/token-utils";
import {
  SignerWallet,
  Provider as SaberProvider,
} from "@saberhq/solana-contrib";
// local
import { RatioLending } from "../../target/types/ratio_lending";
// interfaces
import { TokenReward } from "./TokenReward";
import { TokenCollat } from "./TokenCollat";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export class QuarryClass {
  public payer: Keypair;
  public provider: SaberProvider;
  public sdk: QuarrySDK;
  public pubkey: PublicKey; // quarryKey
  public mintWrapper: PublicKey; // mintWrapperKey
  public rewarder: PublicKey; // rewarderKey
  public minter: PublicKey;
  public rewarderWrapper: RewarderWrapper; // rewarderWrapper
  public rewardClaimFeeAccount: PublicKey;
  public quarryWrapper: QuarryWrapper; // quarryWrapper
  public tokenReward: TokenReward;
  public tokenCollat: TokenCollat;

  // TokenAccountReward -> TokenReward
  constructor(tokenReward: TokenReward, tokenCollat: TokenCollat) {
    this.tokenReward = tokenReward;
    this.tokenCollat = tokenCollat;
    this.payer = (this.tokenReward.mintAuth.wallet as any).payer;
    this.provider = new SignerWallet(this.payer).createProvider(
      this.tokenReward.mintAuth.provider.connection
    );
    this.sdk = QuarrySDK.load({
      provider: this.provider,
    });
  }

  /**
   * create the quarry on chain
   * @param sbrMint
   * @param collateralToken
   */
  async initQuarry() {
    const sbrSToken = SToken.fromMint(
      this.tokenReward.mint,
      this.tokenReward.decimals
    );
    const baseHardCap = TokenAmount.parse(sbrSToken, "1000000000000");

    // create the mint wrapper
    const { tx: txWrapper, mintWrapper: mintWrapperKey } =
      await this.sdk.mintWrapper.newWrapper({
        hardcap: baseHardCap.toU64(),
        tokenMint: this.tokenReward.mint,
        baseKP: this.tokenReward.mintAuth.wallet.payer,
        admin: this.tokenReward.mintAuth.wallet.publicKey,
        payer: this.tokenReward.mintAuth.wallet.publicKey,
      });
    this.mintWrapper = mintWrapperKey;

    // assign wrapper to be the new auth
    await this.tokenReward.splToken.setAuthority(
      this.tokenReward.mint, // account
      this.mintWrapper, // newAuthority
      "MintTokens", // authorityTYpe
      this.tokenReward.mintAuth.wallet.publicKey, // currentAuthority
      [this.tokenReward.mintAuth.wallet.payer] // Signer
    );
    await this.tokenReward.splToken.setAuthority(
      this.tokenReward.mint, // account
      this.mintWrapper, // newAruthority
      "FreezeAccount", // authorityTYpe
      this.tokenReward.mintAuth.wallet.publicKey, // currentAuthority
      [this.tokenReward.mintAuth.wallet.payer] // Signer
    );

    // this.tokenReward.mintAuth = null as User;

    // send the txn to create the wrapper which is now the auth for this reward token
    await txWrapper.confirm();

    // create the rewarder
    const { tx: txRewarder, key: rewarderPubKey } =
      await this.sdk.mine.createRewarder({
        mintWrapper: this.mintWrapper,
        authority: this.payer.publicKey,
      });
    this.rewarder = rewarderPubKey;

    // send the rewarder ixn
    await txRewarder.confirm();

    // set annual rewards
    this.rewarderWrapper = await this.sdk.mine.loadRewarderWrapper(
      this.rewarder
    );

    const rate_tx = this.rewarderWrapper.setAnnualRewards({
      newAnnualRate: new u64(1_000_000_000_000),
    });
    await rate_tx.confirm();
    this.rewardClaimFeeAccount =
      this.rewarderWrapper.rewarderData.claimFeeTokenAccount;

    const allowance = new u64(1_000_000_000);

    const txMinter = await this.sdk.mintWrapper.newMinterWithAllowance(
      this.mintWrapper,
      this.rewarder,
      allowance
    );
    await txMinter.confirm();
    [this.minter] = await findMinterAddress(
      this.mintWrapper, // mintWrapperKey
      this.rewarder, // rewarderKey,
      QUARRY_ADDRESSES.MintWrapper
    );

    // only a rewarder can create a quarry
    const collateralSToken = SToken.fromMint(this.tokenCollat.mint, 9); // prev: usdcUsdtLPToken
    const { quarry: quarryPubKey, tx: txQuarry } =
      await this.rewarderWrapper.createQuarry({
        token: collateralSToken, // token: baseToken, == sbrSToken
      });
    await txQuarry.confirm();
    this.pubkey = quarryPubKey;

    // set rewards share for quarry
    this.quarryWrapper = await this.rewarderWrapper.getQuarry(collateralSToken);
    const share_tx = await this.quarryWrapper.setRewardsShare(
      new u64(100_000_000)
    );
    share_tx.confirm();
  }
}
