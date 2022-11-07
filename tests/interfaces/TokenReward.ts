import { ATA } from "./ata";
import { QuarryClass } from "./quarry";
import { TokenGeneral } from "./TokenGeneral";
import { User } from "./user";

export class TokenReward extends TokenGeneral {
  public quarry: QuarryClass;

  constructor(mintAuth: User, nameToken: string, decimals: number) {
    super(mintAuth, nameToken, decimals);
  }

  /**
   * Just a simple wrapper for now, here for when more logic is needed
   */
  public async initTokenReward() {
    await this.initMint();
  }
}

export class TokenRewardUser {
  tokenReward: TokenReward;
  ata: ATA;

  constructor(user: User, tokenReward: TokenReward) {
    this.tokenReward = tokenReward;
    this.ata = new ATA(
      user.wallet.publicKey, // authPubKey
      tokenReward.mint, // mintPubKey
      tokenReward.mintAuth, // mintAuth
      tokenReward.decimals, // decimals
      tokenReward.nameToken, // nameToken
      `reward-user-${tokenReward.nameToken}`, // nameInstance
      null, // mintAuthPubKey
      user // owner
    );
  }

  /**
   * Init the A.T.A.
   */
  // public async initTokenRewardUser() {}
}
