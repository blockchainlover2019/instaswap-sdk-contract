import { PublicKey } from "@solana/web3.js";
import { BLACKLIST_SEED } from "../utils/constants";
import { BaseAcct, MintPubKey } from "../utils/interfaces";
// anchor/solana imports
import {
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { addZeros, handleTxn } from "../utils/fxns";
import {
  DEBT_CEILING_GLOBAL_USDR,
  DEBT_CEILING_USER_USDR,
  DECIMALS_USD,
  DECIMALS_USDR,
  TVL_LIMIT_USD,
} from "../utils/constants";
import { Accounts } from "../config/accounts";
import { RatioLending } from "../../target/types/ratio_lending";
import { User } from "../interfaces/user";
/**
 * Oracle <- this is incorrectly named. Should be Oracle
 * @property mint - PublicKey: Public Key for token mint
 * @property price - price for this feed - jkap: dont think we need price
 * @property type
 */
export class BlackList extends BaseAcct {
  addresses: PublicKey[];
  bump: number;

  constructor() {
    super(BLACKLIST_SEED, []);

    this.type = "blacklist";
  }
}
