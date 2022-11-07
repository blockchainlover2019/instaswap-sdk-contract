import * as testKeys from "../../.config/testKeys";
import { User } from "./user";
import { Program, Wallet, workspace } from "@project-serum/anchor";
import { RatioLending } from "../../target/types/ratio_lending";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { DECIMALS_USDCUSDT, DECIMALS_SBR, MINT_RAY_KEY, MINT_RAYDIUM_USDT_USDC_LP_KEY, VAULT_SEED } from "../utils/constants";
import { addZeros, airdropSol, createAtaOnChain, createAtaOnChainByKey, getAssocTokenAcct, getPda } from "../utils/fxns";
import { TokenReward, TokenRewardUser } from "./TokenReward";
import { Accounts } from "../config/accounts";
import { TokenPDAUser } from "./TokenPDA";
import { TokenCollatUser } from "./TokenCollatUser";
// @ts-ignore
import { mintTo, transfer, getOrCreateAssociatedTokenAccount, Account as TokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export class Users {
  public base: User;
  public test: User;
  public super: User;
  public oracleReporter: User;
  public treasury: User;
  public external: User;

  constructor() {
    this.base = new User(testKeys.base.keypair, "base");
    this.test = new User(testKeys.test.keypair, "test");
    this.oracleReporter = new User(
      testKeys.oracleReporter.keypair,
      "oracleReporter"
    );
    this.super = new User(
      (programRatioLending.provider.wallet as Wallet).payer,
      "super"
    );
    this.treasury = new User(testKeys.treasury.keypair, "treasury");
    this.external = new User(testKeys.external.keypair, "external");
  }

  public async initAirdrops() {
    const usersArr = [
      this.base,
      this.test,
      this.external,
      this.oracleReporter,
      this.treasury,
    ];
    for (let idx = 0; idx < usersArr.length; idx += 1) {
      const user: User = usersArr[idx];

      await airdropSol(
        user.provider,
        user.wallet.publicKey,
        addZeros(100000 * LAMPORTS_PER_SOL, 0)
      );
    }
  }

  public async initUsers(accounts: Accounts) {

    // for treasury
    this.super.tokens.sbr = new TokenRewardUser(this.super, accounts.sbr);
    this.super.tokens.ratio = new TokenRewardUser(this.super, accounts.ratioMint as TokenReward);
    this.super.tokens.rayAta = getAssocTokenAcct(this.super.wallet.publicKey, new PublicKey(MINT_RAY_KEY))[0];

    await createAtaOnChain(
      this.super.wallet, // user wallet
      this.super.tokens.sbr.ata, // assoc token acct
      this.super.tokens.sbr.tokenReward.mint, // mint pub key
      this.super.wallet.publicKey, // auth, can be different than payer
      this.super.provider.connection // connection
    );

    // for treasury
    await createAtaOnChain(
      this.super.wallet, // user wallet
      this.super.tokens.ratio.ata, // assoc token acct
      this.super.tokens.ratio.tokenReward.mint, // mint pub key
      this.super.wallet.publicKey, // auth, can be different than payer
      this.super.provider.connection // connection
    );

    await createAtaOnChainByKey(
      this.super.wallet, // user wallet
      this.super.tokens.rayAta, // assoc token acct
      new PublicKey(MINT_RAY_KEY), // mint pub key
      this.super.wallet.publicKey, // auth, can be different than payer
      this.super.provider.connection // connection
    );
    await this.super.tokens.ratio.ata.mintToAta(1000000 * 10 ** 6);

    // Super User Lp Token account
    let adminLpTokenAccount: TokenAccount = await getOrCreateAssociatedTokenAccount(this.super.provider.connection, this.super.wallet.payer, accounts.lpSaberUsdcUsdt.mint, this.super.wallet.publicKey);
    for (const user of [this.base, this.test]) {
      await user.initUser();

      user.tokens.usdr = new TokenPDAUser(
        user,
        accounts.usdr,
        accounts.global.pubKey
      );
      await user.tokens.usdr.ata.initAta();

      user.tokens.sbr = new TokenRewardUser(user, accounts.sbr);
      // ratio
      user.tokens.ratio = new TokenRewardUser(user, accounts.ratioMint as TokenReward);

      await createAtaOnChain(
        user.wallet, // user wallet
        user.tokens.ratio.ata, // assoc token acct
        user.tokens.ratio.tokenReward.mint, // mint pub key
        user.wallet.publicKey, // auth, can be different than payer
        user.provider.connection // connection
      );
      await user.tokens.ratio.ata.mintToAta(1000000 * 10 ** 6);
      await createAtaOnChain(
        user.wallet, // user wallet
        user.tokens.sbr.ata, // assoc token acct
        user.tokens.sbr.tokenReward.mint, // mint pub key
        user.wallet.publicKey, // auth, can be different than payer
        user.provider.connection // connection
      );
      user.tokens.lpSaber = new TokenCollatUser(
        user,
        accounts.lpSaberUsdcUsdt,
        accounts.lpSaberUsdcUsdt.pool
      );
      // Transfer Lp tokens from super user to base user
      await transfer(
        user.provider.connection,
        user.wallet.payer,
        adminLpTokenAccount.address,
        user.tokens.lpSaber.ata.pubKey,
        this.super.wallet.payer,
        addZeros(5_000_000, DECIMALS_USDCUSDT),
        [],
        TOKEN_PROGRAM_ID
      );

      try {
        user.tokens.rayAta = getAssocTokenAcct(user.wallet.publicKey, new PublicKey(MINT_RAY_KEY))[0]
        await createAtaOnChainByKey(
          user.wallet, // user wallet
          user.tokens.rayAta, // assoc token acct
          new PublicKey(MINT_RAY_KEY), // mint pub key
          user.wallet.publicKey, // auth, can be different than payer
          user.provider.connection // connection
        );
      } catch (e) {
        console.log(e)
      }
      try {
        user.tokens.lpUsdcUsdtRaydiumAta = getAssocTokenAcct(user.wallet.publicKey, new PublicKey(MINT_RAYDIUM_USDT_USDC_LP_KEY))[0]

        await createAtaOnChainByKey(
          user.wallet, // user wallet
          user.tokens.lpUsdcUsdtRaydiumAta, // assoc token acct
          new PublicKey(MINT_RAYDIUM_USDT_USDC_LP_KEY), // mint pub key
          user.wallet.publicKey, // auth, can be different than payer
          user.provider.connection // connection
        );
      } catch (e) {
        console.log(e)
      }
      user.lpUsdcUsdtRaydiumVaultKey = getPda(
        [Buffer.from(VAULT_SEED), new PublicKey(MINT_RAYDIUM_USDT_USDC_LP_KEY).toBuffer(), user.wallet.publicKey.toBuffer()],
        programRatioLending.programId
      )[0];
    }
  }
}
