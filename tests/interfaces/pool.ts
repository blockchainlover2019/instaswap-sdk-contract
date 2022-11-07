// anchor/solana
import { IdlAccounts, Program, web3, workspace } from "@project-serum/anchor";
import { Farm } from "@raydium-io/raydium-sdk";
import { PublicKey } from "@solana/web3.js";
// generated
import { RatioLending } from "../../target/types/ratio_lending";
// local
import { DEBT_CEILING_POOL_USDR, MINT_RAY_KEY, POOL_SEED, RAYDIUM_FARM_VERSION, VAULT_SEED } from "../utils/constants";
import { getAssocTokenAcct, getPda } from "../utils/fxns";
import { AtaMarket, BaseAcct, MintPubKey } from "../utils/interfaces";
import { Oracle } from "./oracle";
import { QuarryClass } from "./quarry";
import { TokenCollat } from "./TokenCollat";
import { TokenMarket } from "./TokenMarket";
import { TokenReward } from "./TokenReward";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

const platformNameToNumber = (platformName: string) => {
  const platformMapping = {
    raydium: 0,
    orca: 1,
    saber: 2,
    mercurial: 3,
    unknown: 4,
  };
  const platformNumber = platformMapping[platformName];

  return platformNumber;
};

/**
 * The general class for pool state accounts
 *
 * Pools pertain to a single collateral token, which comes from a:
 *   single market,
 *   single platform,
 *   single farm
 *
 * They contain links to oracles, the token accounts in the market they come from
 */
export class Pool extends BaseAcct { // TODO : change class name Pool to SaberPool
  // TODO 008: change pool.name to pool.nameCollat
  name: string;
  platform: string;
  oracles: {
    usdc?: Oracle;
    usdt?: Oracle;
  };
  ataMarketTokens: {
    usdc?: AtaMarket;
    usdt?: AtaMarket;
  };
  /**
   * TODO 001: change to rewardTokens[] where each item is a RewardToken instance
   *    We need to access [mint, mintAuth, name, etc.] from multiple places
   */
  rewardTokenMints: MintPubKey[];
  tokenReward: TokenReward;
  tokenCollat: TokenCollat;
  quarry: QuarryClass;

  constructor(
    mintPubKey: MintPubKey,
    mktTokenArr: { name: string; tokenMarket: TokenMarket }[],
    nameCollat: string,
    platformName: string = "saber",
    tokenReward: TokenReward,
    tokenCollat: TokenCollat
  ) {
    super(POOL_SEED, [mintPubKey.toBuffer()]);

    this.type = "pool";
    // TODO 008: change pool.name to pool.nameCollat
    this.name = nameCollat;
    this.platform = platformName;

    this.oracles = {
      usdc: null as Oracle,
      usdt: null as Oracle,
    };

    this.ataMarketTokens = {
      usdc: null as AtaMarket,
      usdt: null as AtaMarket,
    };

    mktTokenArr.forEach(
      ({ name, tokenMarket }: { name: string; tokenMarket: TokenMarket }) => {
        // set the oracle
        this.oracles[name] = tokenMarket.oracle;
        // set the market token
        this.ataMarketTokens[name] = tokenMarket.ata;
      }
    );

    this.tokenReward = tokenReward;
    this.tokenCollat = tokenCollat;
    this.quarry = new QuarryClass(this.tokenReward, this.tokenCollat);
  }

  /**
   * Create the pool and the quarry for the pool
   */
  public async initPool() {
    await this.quarry.initQuarry();
  }
}

/**
 * Class for raydium pool state accounts
 */
 export class RaydiumStablePool extends BaseAcct {
  lpMintPubkey: MintPubKey;
  farmPid: PublicKey = Farm.getProgramId(RAYDIUM_FARM_VERSION);
  farmId: PublicKey;
  farmAuthority: PublicKey;
  lpTokenAcc: PublicKey;
  rewardTokenAcc: PublicKey;
  rewardBTokenAcc: PublicKey;

  rewardMint: MintPubKey = new MintPubKey(MINT_RAY_KEY);
  tokenA: PublicKey;
  tokenB: PublicKey;
  oracleA: Oracle;
  oracleB: Oracle;
  constructor(
    mintPubKey: MintPubKey,
    tokenA: PublicKey,
    tokenB: PublicKey,
    farmId: PublicKey
  ) {
    super(POOL_SEED, [mintPubKey.toBuffer()]);

    this.type = "raydiumPool";
    this.lpMintPubkey = mintPubKey;
    this.farmId = farmId
    this.tokenA = tokenA;
    this.tokenB = tokenB;
    
  }
  public async initPoolKeys(
    oracleA: Oracle,
    oracleB: Oracle,
    lpTokenAcc: PublicKey,
    rewardTokenAcc: PublicKey,
    rewardBTokenAcc: PublicKey,
  ) {
    this.oracleA = oracleA;
    this.oracleB = oracleB;
    this.lpTokenAcc = lpTokenAcc;
    this.rewardTokenAcc = rewardTokenAcc;
    this.rewardBTokenAcc = rewardBTokenAcc;
    this.farmAuthority = (await Farm.getAssociatedAuthority({
      programId: this.farmPid,
      poolId: this.farmId
    })).publicKey


  }
  public getVaultKey(owner: PublicKey) {
    return getPda(
      [Buffer.from(VAULT_SEED), this.lpMintPubkey.toBuffer(), owner.toBuffer()],
      programRatioLending.programId
    )[0];
  }
  public getVaultAtaCollatKey(owner: PublicKey) {
    return getAssocTokenAcct(this.getVaultKey(owner), this.lpMintPubkey)[0];
  }
  public getVaultAtaRewardKey(owner: PublicKey) {
    return getAssocTokenAcct(this.getVaultKey(owner), this.rewardMint)[0];
  }
  public getVaultAtaRewardBKey(owner: PublicKey) {
    return getAssocTokenAcct(this.getVaultKey(owner), this.oracleA.mint)[0];
  }
  public async getStakerInfoKey(owner: PublicKey) {
    const vaultKey = this.getVaultKey(owner)
    return await Farm.getAssociatedLedgerAccount(
      {
        programId: this.farmPid,
        poolId: this.farmId,
        owner: vaultKey
      }
    )
  }
  
}
