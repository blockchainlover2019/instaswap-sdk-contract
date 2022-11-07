// anchor/solana
import { BN, IdlAccounts, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { DECIMALS_USDR } from "../utils/constants";
import { addZeros, getAssocTokenAcct, handleTxn } from "../utils/fxns";
// interfaces
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { Pool } from "../interfaces/pool";
import { TokenPDAUser } from "../interfaces/TokenPDA";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
import { GlobalState } from "../interfaces/GlobalState";
import { TokenCollat } from "../interfaces/TokenCollat";
import { UserState } from "../interfaces/userState";
import { Vault } from "../interfaces/vault";
import { assert } from "chai";
import { BlackList } from "../interfaces/blacklist";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdr<'info>`)
export const borrowUsdrCall = async (
  borrowAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  tokenCollatUser: TokenCollatUser,
  userUSDr: TokenPDAUser,
  pool: Pool,
  globalState: GlobalState,
  blackList: BlackList,
  tokenCollat: TokenCollat,
  userState: UserState,
  vault: Vault
) => {
  const globalStateData = await programRatioLending.account.globalState.fetch(globalState.pubKey)
  const treasury = globalStateData.treasury
  const [ataUsdrTreasury] = getAssocTokenAcct(treasury, globalState.usdr.pubKey);
  const txn = new Transaction().add(
    programRatioLending.instruction.borrowUsdr(new BN(borrowAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        blacklist: blackList.pubKey,
        treasury,
        pool: pool.pubKey,

        vault: tokenCollatUser.vault.pubKey,
        userState: userState.pubKey,

        ataUsdr: userUSDr.ata.pubKey,
        ataUsdrTreasury,

        swapTokenA: pool.ataMarketTokens.usdc.pubKey,
        swapTokenB: pool.ataMarketTokens.usdt.pubKey,

        oracleA: pool.oracles.usdc.pubKey,
        oracleB: pool.oracles.usdt.pubKey,

        mintCollat: tokenCollat.mint, // the collat token mint that the pool represents
        mintUsdr: userUSDr.tokenPda.pubKey,

        // system accts
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
  console.log(
    "tokenCollatUser ata balance",
    await tokenCollatUser.ata.getBalance()
  );
};
// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdr<'info>`)
export const borrowUsdrPASS = async (user: User, accounts: Accounts) => {
  const tokenUsdrUser = user.tokens.usdr;
  
  const borrowAmtUi = 500;
  const borrowAmtPrecise = addZeros(borrowAmtUi, DECIMALS_USDR);

  const poolState: IdlAccounts<RatioLending>["pool"]  = await accounts.lpSaberUsdcUsdt.pool.getAccount();
  
  const prevTreasuryUsdrAmount = await (await accounts.ataUsdrTreasury.getBalance()).value.uiAmount;
  // create the ata
  // const doesExistOnChain = await user.connection user.tokens.usdr.ata;
  const doesExistOnChain = await tokenUsdrUser.ata.getAccountInfo();

  !doesExistOnChain && (await tokenUsdrUser.ata.initAta());

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdr<'info>`)
  await borrowUsdrCall(
    // borrow/mint amount
    borrowAmtPrecise,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // tokenCollatUser
    user.tokens.lpSaber,
    // tokenUsdrUser
    tokenUsdrUser,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global,
    // blacklist
    accounts.blackList,
    // mintColl
    accounts.lpSaberUsdcUsdt,
    user.userState,
    user.tokens.lpSaber.vault
  );

  const userBalPost = Number(
    (await tokenUsdrUser.ata.getBalance()).value.amount
  );
  const postTreasuryUsdrAmount = await (await accounts.ataUsdrTreasury.getBalance()).value.uiAmount;
  console.log(`user USDR balance: ${0} -> ${userBalPost} ∆=${userBalPost}`);

  // check borrow fee
  const borrowFee = poolState.borrowFeeNumer.toNumber() / 10000;
  const expectedFee = borrowAmtUi * borrowFee;
  assert(postTreasuryUsdrAmount - prevTreasuryUsdrAmount == expectedFee
    , "Borrow fee amount mismatch");
};
