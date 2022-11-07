// anchor/solana
import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
// local
import { RatioLending } from "../../target/types/ratio_lending";
import { addZeros, getAssocTokenAcct, handleTxn } from "../utils/fxns";
// interfaces
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { Vault } from "../interfaces/vault";
import { getATAAddressSync } from "@saberhq/token-utils";
import { DECIMALS_USDCUSDT, MINT_USDC_KEY, MINT_USDR_KEY } from "../utils/constants";

//@ts-ignore
import { getOrCreateAssociatedTokenAccount, createAssociatedTokenAccountInstruction, transfer } from "@solana/spl-token";
import { Pool } from "../interfaces";
import { depositCollateralPASS } from "./depositCollateral";
import { assert } from "chai";
// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export const liquidate = async (pool: Pool, user: User, vault: Vault, reporter: User, accounts: Accounts, amtToLiquidate: number) => {
  console.log(`Simulating Liquidation: liquidate ${amtToLiquidate} collat`);

  await depositCollateralPASS(
    user,
    accounts,
    user.tokens.lpSaber.ata.pubKey,
    vault.pubKey,
    vault.ataCollat.pubKey,
    accounts.lpSaberUsdcUsdt.mint,
    pool.pubKey,
    pool.ataMarketTokens.usdc.pubKey,
    pool.ataMarketTokens.usdt.pubKey,
    pool.oracles.usdc.pubKey,
    pool.oracles.usdt.pubKey,
    amtToLiquidate,
  );

  const [liquidateAuth] = PublicKey.findProgramAddressSync([
    Buffer.from("VAULT_LIQUIDATE_SEED"),
    vault.pubKey.toBuffer(),
  ], programRatioLending.programId);
  
  const ataCollatLiq = await getOrCreateAssociatedTokenAccount(programRatioLending.provider.connection, reporter.wallet.payer, new PublicKey(vault.ataCollat.mint), liquidateAuth, true);

  console.log('Start Liquidation')
  //trigger liquidation
  const preCollAmount = (await programRatioLending.account.vault.fetch(vault.pubKey)).totalColl;
  await programRatioLending.rpc.startLiquidation(new BN(amtToLiquidate), new BN(amtToLiquidate * 0.8), {
    accounts:{
      authority: reporter.wallet.publicKey,
      globalState: accounts.global.pubKey,
      vault: vault.pubKey,
      liquidateAuthority: liquidateAuth,
      ataCollatVault: vault.ataCollat.pubKey,
      ataCollatLiq: ataCollatLiq.address,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      pool: pool.pubKey,
      userState: user.userState.pubKey,      

      mintCollat: vault.ataCollat.mint,

      oracleA: pool.oracles.usdc.pubKey,
      oracleB: pool.oracles.usdt.pubKey,
      swapTokenA: pool.ataMarketTokens.usdc.pubKey,
      swapTokenB: pool.ataMarketTokens.usdt.pubKey,
    }, 
    signers: [reporter.wallet.payer]
  });
  const postCollAmount = (await programRatioLending.account.vault.fetch(vault.pubKey)).totalColl;
  assert(preCollAmount.toNumber() - postCollAmount.toNumber() == amtToLiquidate, "Not Liquidated with exact collat amount");

  console.log('Transfer All assets');
  ///transfer all assets from vault to liquidate auth
  const assets = [
    accounts.sbr.mint,
  ];
  for (const assetMint of assets) {
    const ataAssetVault = (await getOrCreateAssociatedTokenAccount(programRatioLending.provider.connection, reporter.wallet.payer, new PublicKey(assetMint), vault.pubKey, true)).address;
    const ataAssetLiq = (await getOrCreateAssociatedTokenAccount(programRatioLending.provider.connection, reporter.wallet.payer, new PublicKey(assetMint), liquidateAuth, true)).address;
    await programRatioLending.rpc.liquidateAsset({
      accounts:{
        authority: reporter.wallet.publicKey,
        globalState: accounts.global.pubKey,
        vault: vault.pubKey,
        liquidateAuthority: liquidateAuth,
        ataAssetVault,
        ataAssetLiq,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [reporter.wallet.payer]
    });
  }
  console.log('Simulating Jup Swap');
  //unwind & sell assets into USDr
  const tx = new Transaction();
  const testMint = MINT_USDC_KEY
  const ataToken = getATAAddressSync({mint: new PublicKey(testMint), owner: liquidateAuth});

  tx.add(
    createAssociatedTokenAccountInstruction(
      liquidateAuth,
      ataToken,
      liquidateAuth,
      new PublicKey(testMint)
    )
  );

  for(const ix of tx.instructions)  {
    await programRatioLending.rpc.executeInternalIx(ix.data, {
      accounts: {
        authority: reporter.wallet.publicKey,
        globalState: accounts.global.pubKey,
        vault: vault.pubKey,
        liquidateAuthority: liquidateAuth,
      },
      remainingAccounts: ix.keys.map((meta) => 
        meta.pubkey.equals(liquidateAuth) ? {
          ...meta, isSigner: false
        } : meta
      ).concat({
        pubkey: ix.programId,
        isWritable: false,
        isSigner: false
      }),
      signers: [reporter.wallet.payer]
    });
  }
  const ataStableLiq = await getOrCreateAssociatedTokenAccount(programRatioLending.provider.connection, reporter.wallet.payer, new PublicKey(MINT_USDR_KEY), liquidateAuth, true);
  const amtToSimulate = amtToLiquidate * 2.5;
  await transfer(programRatioLending.provider.connection, user.wallet.payer, user.tokens.usdr.ata.pubKey, ataStableLiq.address, user.wallet.publicKey, amtToSimulate);
  console.log(`Transferred ${amtToSimulate}USDr to Simulate`);

  //end liquidation
  const globalStateData = await programRatioLending.account.globalState.fetch(accounts.global.pubKey)

  const treasury = globalStateData.treasury
  const [ataStableTreasury] = getAssocTokenAcct(treasury, accounts.global.usdr.pubKey);

  console.log('End Liquidation');

  await programRatioLending.rpc.endLiquidation({
    accounts:{
      authority: reporter.wallet.publicKey,
      globalState: accounts.global.pubKey,
      vault: vault.pubKey,
      liquidateAuthority: liquidateAuth,

      mintUsdr: MINT_USDR_KEY,

      ataStableLiq: ataStableLiq.address,
      ataStableTreasury: ataStableTreasury,

      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    signers: [reporter.wallet.payer]
  });
  const postUSDrAmount = await programRatioLending.provider.connection.getTokenAccountBalance(ataStableLiq.address);
  
  assert(postUSDrAmount.value.uiAmount == 0, "Not Liquidated with exact debt");
};
