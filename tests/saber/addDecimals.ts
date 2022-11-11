// anchor imports
import { Program, workspace } from "@project-serum/anchor";
// solana imports
import { Token as SToken } from "@saberhq/token-utils";
// utils
import { assert, expect } from "chai";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// quarry
import { QuarrySDK, QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// local
import { RatioSdk } from "../../target/types/ratio_sdk";
// import { Periphery } from "../../target/types/periphery";
import { DECIMALS_USDCUSDT, MINT_SUSDC9_KEY, MINT_USDC_KEY, SABER_DECIMALS_PROGRAM, SABER_DECIMALS_USDC9_WRAPPER_ACCOUNT, SABER_DECWRAPPER_UNDERLYING_TOKENS_ACCOUNT } from "../utils/constants";
import { User } from "../interfaces/user";
import { handleTxn, getAssocTokenAcct, createAtaOnChainByKey } from "../utils/fxns";
import BN from 'bn.js';

// init
const programRatioSdk = workspace.RatioSdk as Program<RatioSdk>;


export const wrapDecimals = async (
  user: User
) => {
  let [userUsdcTokenAccount] = getAssocTokenAcct(user.wallet.publicKey, new PublicKey(MINT_USDC_KEY));
  let usdcPrevBal = (await user.provider.connection.getTokenAccountBalance(userUsdcTokenAccount)).value.uiAmount;
  let [userSUsdc9TokenAccount] = getAssocTokenAcct(user.wallet.publicKey, new PublicKey(MINT_SUSDC9_KEY));
  if (!(await user.provider.connection.getAccountInfo(userSUsdc9TokenAccount))) {
    await createAtaOnChainByKey(
      user.wallet, 
      userSUsdc9TokenAccount, 
      new PublicKey(MINT_SUSDC9_KEY),
      user.wallet.publicKey,
      user.provider.connection
    );
  }

  const txn = new Transaction().add(await programRatioSdk.methods
    .wrapDecimalsToken(new BN(0)) // old_amount is 0
    .accounts({
      authority: user.wallet.publicKey,
      ataUserUnderlyingToken: userUsdcTokenAccount,
      ataUserWrappedToken: userSUsdc9TokenAccount,
      wrapper: new PublicKey(SABER_DECIMALS_USDC9_WRAPPER_ACCOUNT),
      wrapperMint: new PublicKey(MINT_SUSDC9_KEY),
      underlyingMint: new PublicKey(MINT_USDC_KEY),
      wrapperUnderlyingTokens: new PublicKey(SABER_DECWRAPPER_UNDERLYING_TOKENS_ACCOUNT),
      saberDecimalsProgram: new PublicKey(SABER_DECIMALS_PROGRAM),
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .instruction()
  );
  let txHash = await sendAndConfirmTransaction(user.provider.connection, txn, [user.wallet.payer]);
  let usdcPostBal = (await user.provider.connection.getTokenAccountBalance(userUsdcTokenAccount)).value.uiAmount;
  let sUsdc9Bal = (await user.provider.connection.getTokenAccountBalance(userSUsdc9TokenAccount)).value.uiAmount;
  console.log(`usdc change `, usdcPostBal - usdcPrevBal);
  console.log(`sUSDC-9 change `, sUsdc9Bal);
}

export const unwrapDecimals = async (
  user: User
) => {
  let [userUsdcTokenAccount] = getAssocTokenAcct(user.wallet.publicKey, new PublicKey(MINT_USDC_KEY));
  let [userSUsdc9TokenAccount] = getAssocTokenAcct(user.wallet.publicKey, new PublicKey(MINT_SUSDC9_KEY));
  
  let usdcPrevBal = (await user.provider.connection.getTokenAccountBalance(userUsdcTokenAccount)).value.uiAmount;
  let sUsdc9PrevBal = (await user.provider.connection.getTokenAccountBalance(userSUsdc9TokenAccount)).value.uiAmount;

  const txn = new Transaction().add(await programRatioSdk.methods
    .unwrapDecimalsToken(new BN(0)) // old_amount is 0
    .accounts({
      authority: user.wallet.publicKey,
      ataUserUnderlyingToken: userUsdcTokenAccount,
      ataUserWrappedToken: userSUsdc9TokenAccount,
      wrapper: new PublicKey(SABER_DECIMALS_USDC9_WRAPPER_ACCOUNT),
      wrapperMint: new PublicKey(MINT_SUSDC9_KEY),
      underlyingMint: new PublicKey(MINT_USDC_KEY),
      wrapperUnderlyingTokens: new PublicKey(SABER_DECWRAPPER_UNDERLYING_TOKENS_ACCOUNT),
      saberDecimalsProgram: new PublicKey(SABER_DECIMALS_PROGRAM),
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .instruction()
  );
  let txHash = await sendAndConfirmTransaction(user.provider.connection, txn, [user.wallet.payer]);
  
  let usdcPostBal = (await user.provider.connection.getTokenAccountBalance(userUsdcTokenAccount)).value.uiAmount;
  let sUsdc9PostBal = (await user.provider.connection.getTokenAccountBalance(userSUsdc9TokenAccount)).value.uiAmount;
  console.log(`usdc change `, usdcPostBal - usdcPrevBal);
  console.log(`sUSDC-9 change `, sUsdc9PostBal - sUsdc9PrevBal);
}