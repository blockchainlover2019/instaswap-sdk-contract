// anchor/solana
import {
  BN,
  IdlAccounts,
  Program,
  Wallet,
  workspace,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
// utils
import { assert, expect } from "chai";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import { addZeros, getAssocTokenAcct, handleTxn } from "../utils/fxns";
import { DECIMALS_PRICE, DECIMALS_USDCUSDT } from "../utils/constants";
// interfaces
import { MintPubKey } from "../utils/interfaces";
import { User } from "../interfaces/user";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
import { GlobalState } from "../interfaces/GlobalState";
import { Miner } from "../interfaces/miner";
import { SYSTEM_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { BlackList } from "../interfaces/blacklist";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 */
export const createBlackListPASS = async (
  superUser: User,
  accounts: Accounts
) => {
  await programRatioLending.rpc.createBlacklist({
    accounts: {
      authority: superUser.wallet.publicKey, //
      globalState: accounts.global.pubKey, //
      blacklist: accounts.blackList.pubKey,
      systemProgram: SYSTEM_PROGRAM_ID,
    },
  });
};
