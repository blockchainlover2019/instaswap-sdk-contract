import { ORACLE_SEED } from "../utils/constants";
import { BaseAcct, MintPubKey } from "../utils/interfaces";

/**
 * Oracle <- this is incorrectly named. Should be Oracle
 * @property mint - PublicKey: Public Key for token mint
 * @property price - price for this feed - jkap: dont think we need price
 * @property type
 */
export class Oracle extends BaseAcct {
  mint: MintPubKey;
  nameToken: string;

  constructor(mintMarketPubKey: MintPubKey, nameToken: string) {
    super(ORACLE_SEED, [mintMarketPubKey.toBuffer()]);

    this.type = "oracle";
    this.mint = mintMarketPubKey;
    this.nameToken = nameToken;
  }
}
