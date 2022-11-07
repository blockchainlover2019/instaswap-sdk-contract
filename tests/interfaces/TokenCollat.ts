import { User } from "./user";
import { TokenGeneral } from "./TokenGeneral";
import { TokenMarket } from "./TokenMarket";
import { TokenCollatUser } from "./TokenCollatUser";
import { Pool } from "./pool";
import { TokenReward } from "./TokenReward";
import { PublicKey } from "@solana/web3.js";

/**
 * Class for collateral tokens to be deposited to Ratio vaults and farmed out
 *
 * One pool per collateral
 *
 * One vault per collateral per user
 *
 * There are multiple types of collateral and they need to be handled separately
 *
 * From the general token class:
 * @param splToken: SPLToken;
 * @param mint: MintPubKey;
 * @param mintAuth: User;
 * @param name: string;
 * @param pool
 */
export class TokenCollat extends TokenGeneral {
  /** Pool has the reward tokens associated with it, has to be created after constructor for mint token */
  pool: Pool;
  platform: string;
  namePlatform: string;
  nameMarket: string;
  tokenReward: TokenReward;
  mktTokenArr: { name: string; tokenMarket: TokenMarket }[];

  // create the pool
  constructor(
    mintAuth: User,
    tokenReward: TokenReward,
    name: string,
    decimals: number,
    namePlatform: string = "saber",
    nameMarket: string,
    mktTokenArr: { name: string; tokenMarket: TokenMarket }[]
  ) {
    super(mintAuth, name, decimals);

    this.platform = namePlatform;
    this.namePlatform = namePlatform;
    this.nameMarket = nameMarket;
    this.tokenReward = tokenReward;
    this.mktTokenArr = mktTokenArr;
  }

  /**
   * Create the mint, the A.T.A. for the off-platform minter, and Ratio pool.
   * The minter user is some off-platform authority that created the mint token.
   * This user is entirely independent of Ratio.
   *
   * This function creates the mint account, an A.T.A. for the mint auth, and the Ratio Pool
   *
   * @param externalUser
   */
  public async initRatioCollat(mint? : PublicKey) {
    // Mint token to official token account

    // Check if mint is already created, for eg: saberLp token is already minted by deploy Swap function
    if (mint) {
      this.mint = mint;
    } else {
      await this.initMint();
    }

    // this has to be created after the mint is initialized
    this.pool = new Pool(
      this.mint, // mintPubKey
      this.mktTokenArr, // mktTokenArr
      this.nameToken, // nameCollat
      this.namePlatform, // platformName
      this.tokenReward, // tokenReward
      this // tokenCollat
    );
    await this.pool.initPool();

    // create the Assoc Token Acct for the off-platform minter
    this.mintAuth.tokens[this.name] = new TokenCollatUser(
      this.mintAuth,
      this,
      this.pool
    );

    await (this.mintAuth.tokens[this.name] as TokenCollatUser).initCollatUser();

    return this;
  }

  /**
   * set the users field for this specific token
   *
   * @param usersArr
   */
  public async initCollatForUsers(usersArr: User[]) {
    usersArr.forEach(async (user: User) => {
      // TokenUserCollat -> TokenCollatUser
      user.tokens[this.nameToken] = new TokenCollatUser(user, this, this.pool);
      await (user.tokens[this.nameToken] as TokenCollatUser).ata.initAta();
    });
  }
}
