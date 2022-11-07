// utils
import {
  DECIMALS_SBR,
  DECIMALS_USDCUSDT,
  DECIMALS_USDC,
  DECIMALS_USDT,
  MINT_USDR_KEY,
  MINT_RAYDIUM_USDT_USDC_LP_KEY,
  MINT_USDC_KEY,
  MINT_USDT_KEY,
  RAYDIUM_USDT_USDC_FARM_KEY,
  RAYDIUM_USDT_USDC_LP_ACC_KEY,
  RAYDIUM_USDT_USDC_REWARD_ACC_KEY,
  RAYDIUM_USDC_VAULT_KEY,
  RAYDIUM_USDT_VAULT_KEY,
  RAYDIUM_USDT_USDC_REWARD_USDC_ACC_KEY,
} from "../utils/constants";
// interfaces
import { TokenReward } from "../interfaces/TokenReward";
import { User } from "../interfaces/user";
import { TokenCollat } from "../interfaces/TokenCollat";
import { TokenMarket } from "../interfaces/TokenMarket";
import { TokenPda } from "../interfaces/TokenPDA";
import { GlobalState } from "../interfaces/GlobalState";
import { Keypair, PublicKey } from "@solana/web3.js";
import { RaydiumStablePool } from "../interfaces";
import { MintPubKey } from "../utils/interfaces";
import { addZeros, mintToAta, toUiAmount } from "../utils/fxns";
import { Oracle } from "../interfaces/oracle";
import { ATA } from "../interfaces/ata";
import { TokenGeneral } from "../interfaces/TokenGeneral";
import { BlackList } from "../interfaces/blacklist";
// @ts-ignore
import { createMintToInstruction } from "@solana/spl-token";
import { StableSwap, deployNewSwap, SWAP_PROGRAM_ID, ISeedPoolAccountsFn } from "@saberhq/stableswap-sdk";
import { u64, TOKEN_PROGRAM_ID, sleep } from "@saberhq/token-utils";
import { SignerWallet, Provider as SaberProvider } from "@saberhq/solana-contrib";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount, Account as TokenAccount, getMint } from "@solana/spl-token";


export class Accounts {
  public global: GlobalState;
  public blackList: BlackList;
  public usdr: TokenPda;
  public ratioMint: TokenGeneral;
  public ataRatioTreasury: ATA;
  public ataRatioVault: ATA;
  public ataUsdrTreasury: ATA;
  public sbr: TokenReward;
  public lpSaberUsdcUsdt: TokenCollat;
  public usdc: TokenMarket;
  public usdt: TokenMarket;

  public raydiumUsdcUsdtPool: RaydiumStablePool;
  public saberUsdcUsdtSwap: StableSwap;

  constructor(externalUser: User, oracleReporter: User) {

    // init usdr mint acct
    // this.usdr = new TokenPda(MINT_USDR_SEED, [], "usdr", DECIMALS_USDR);
    this.usdr = {
      pubKey: new PublicKey(MINT_USDR_KEY),
    } as any;

    // init global state acct
    this.global = new GlobalState(this.usdr, oracleReporter);
    this.blackList = new BlackList();

    // create the market tokens
    this.usdc = new TokenMarket(
      externalUser,
      DECIMALS_USDC,
      "usdc",
      "usdcUsdt",
      "saber"
    );
    this.usdt = new TokenMarket(
      externalUser,
      DECIMALS_USDT,
      "usdt",
      "usdcUsdt",
      "saber"
    );

    // create the reward token
    this.sbr = new TokenReward(externalUser, "sbr", DECIMALS_SBR); // rewardsMintKP.publicKey,

    // init the collateral token (lp)
    this.lpSaberUsdcUsdt = new TokenCollat(
      externalUser,
      this.sbr,
      "lpSaberUsdcUsdt",
      DECIMALS_USDCUSDT,
      "saber",
      "usdcUsdt",
      [
        { name: "usdc", tokenMarket: this.usdc },
        { name: "usdt", tokenMarket: this.usdt },
      ]
    );

    // inti raydium stable usdc-usdt pool
    this.raydiumUsdcUsdtPool = new RaydiumStablePool(
      new MintPubKey(MINT_RAYDIUM_USDT_USDC_LP_KEY),
      new PublicKey(RAYDIUM_USDC_VAULT_KEY),
      new PublicKey(RAYDIUM_USDT_VAULT_KEY),
      new MintPubKey(RAYDIUM_USDT_USDC_FARM_KEY)
    );
  }

  public async initAccounts(userSuper: User, platformParticipants: User[]) {
    // ratio mint
    this.ratioMint = new TokenGeneral(userSuper, "Ratio", 6);
    await this.ratioMint.initMint();

    //Init Global State
    await this.global.initGlobalState(userSuper, this.ratioMint.mint);
    
    // userSuper is currently treasury
    this.ataRatioTreasury = new ATA(
      userSuper.wallet.publicKey,
      this.ratioMint.mint,
      userSuper,
      6
    );
    this.ataRatioVault = await (new ATA(
      this.global.pubKey,
      this.ratioMint.mint,
      userSuper,
      6
    )).initAta(null, userSuper.wallet, userSuper.provider.connection);

    // init Ratio Collat, initCollatForUsers moved to bottom since it must be run after saber LP mint is created (when saber pool is deployed)
    // init the token mint, oracle and market-token
    await this.sbr.initTokenReward();
    await this.usdc.initMktToken(25331785.961795); // amount found on explorer.solana.com on 3/24/22 5:15pm EST
    await this.usdc.initMrktTokenForUsers(platformParticipants.concat([userSuper]), 10_000);

    await this.usdt.initMktToken(16555962.623743); // amount found on explorer.solana.com on 3/24/22 5:15pm EST
    await this.usdt.initMrktTokenForUsers(platformParticipants.concat([userSuper]), 10_000);

    const raydiumUsdcOracleA = new Oracle(new PublicKey(MINT_USDC_KEY), "USDC");
    const raydiumUsdcOracleB = new Oracle(new PublicKey(MINT_USDT_KEY), "USDT");
    await this.raydiumUsdcUsdtPool.initPoolKeys(
      raydiumUsdcOracleA,
      raydiumUsdcOracleB,
      new PublicKey(RAYDIUM_USDT_USDC_LP_ACC_KEY),
      new PublicKey(RAYDIUM_USDT_USDC_REWARD_ACC_KEY),
      new PublicKey(RAYDIUM_USDT_USDC_REWARD_USDC_ACC_KEY)
    );
    this.ataUsdrTreasury = new ATA(
      userSuper.wallet.publicKey,
      this.usdr.pubKey,
      userSuper,
      6
    );
    await this.ataUsdrTreasury.initAta(
      0,
      userSuper.wallet,
      userSuper.provider.connection
    );

    //Saber Swap Init
    const saberProvider: SaberProvider = new SignerWallet(userSuper.wallet.payer).createProvider(userSuper.provider.connection);
    const usdcMint = this.usdc.mint;
    const usdtMint = this.usdt.mint;
    const initialTokenUsdcSaberSwapAmount = addZeros(10_000_000, DECIMALS_USDC);
    const initialTokenUsdtSaberSwapAmount = addZeros(10_000_000, DECIMALS_USDT);
    const AMP_FACTOR = 100;
    const seedPoolAccounts: ISeedPoolAccountsFn = ({
      tokenAAccount,
      tokenBAccount,
    }) => ({
      instructions: [
        createMintToInstruction(
          usdcMint,
          tokenAAccount,
          this.usdc.mintAuth.wallet.publicKey,
          initialTokenUsdcSaberSwapAmount,
          [this.usdc.mintAuth.wallet.payer],
          TOKEN_PROGRAM_ID,
        ),
        createMintToInstruction(
          usdtMint,
          tokenBAccount,
          this.usdt.mintAuth.wallet.publicKey,
          initialTokenUsdtSaberSwapAmount,
          [this.usdt.mintAuth.wallet.payer],
          TOKEN_PROGRAM_ID,
        ),
      ],
      signers: [this.usdc.mintAuth.wallet.payer],
    });

    const { swap: newSwap } = await deployNewSwap({
      // @ts-ignore
      provider: saberProvider,
      adminAccount: userSuper.wallet.publicKey,
      // @ts-ignore
      ampFactor: new u64(AMP_FACTOR),
      tokenAMint: usdcMint,
      tokenBMint: usdtMint,
      seedPoolAccounts,
      swapProgramID: SWAP_PROGRAM_ID,
      useAssociatedAccountForInitialLP: true,
    });
    this.saberUsdcUsdtSwap = newSwap;
    let swapLpMint = newSwap.state.poolTokenMint;
    let adminLpTokenAccount: TokenAccount= await getOrCreateAssociatedTokenAccount(userSuper.provider.connection, userSuper.wallet.payer, swapLpMint, userSuper.wallet.publicKey);
    console.log("Super User saberLP token-acoount: ", toUiAmount(Number(adminLpTokenAccount.amount), DECIMALS_USDCUSDT));

    // init the token mint, oracle and market token
    await this.lpSaberUsdcUsdt.initRatioCollat(swapLpMint); // Passing mint since mint is already created in deployNewSwap function
    await this.lpSaberUsdcUsdt.initCollatForUsers(platformParticipants.concat([userSuper]));
  }
}
