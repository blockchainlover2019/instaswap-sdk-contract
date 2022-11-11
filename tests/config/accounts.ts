// utils
import {
  DECIMALS_USDCUSDT,
  DECIMALS_USDC,
  DECIMALS_USDT,
} from "../utils/constants";
// interfaces
import { User } from "../interfaces/user";
import { Keypair, PublicKey } from "@solana/web3.js";
import { addZeros, toUiAmount } from "../utils/fxns";
// @ts-ignore
import { createMint, createMintToInstruction } from "@solana/spl-token";
import { StableSwap, deployNewSwap, SWAP_PROGRAM_ID, ISeedPoolAccountsFn } from "@saberhq/stableswap-sdk";
import { u64, TOKEN_PROGRAM_ID, sleep } from "@saberhq/token-utils";
import { SignerWallet, Provider as SaberProvider } from "@saberhq/solana-contrib";
// @ts-ignore
import { getOrCreateAssociatedTokenAccount, Account as TokenAccount, getMint } from "@solana/spl-token";

class TokenMint {
  mint: PublicKey;
  mintAuth: User;
}
export class Accounts {
  public usdc: TokenMint;
  public usdt: TokenMint;
  public saberUsdcUsdtSwap: any;

  constructor() {
    this.usdc = new TokenMint();
    this.usdt = new TokenMint();
  }

  public async initAccounts(userSuper: User) {
    //Saber Swap Init
    const saberProvider: SaberProvider = new SignerWallet(userSuper.wallet.payer).createProvider(userSuper.provider.connection);
    
    this.usdc.mintAuth = userSuper;
    this.usdt.mintAuth = userSuper;
    this.usdc.mint = await createMint(userSuper.provider.connection, userSuper.wallet.payer, userSuper.wallet.publicKey, null, DECIMALS_USDC);
    this.usdt.mint = await createMint(userSuper.provider.connection, userSuper.wallet.payer, userSuper.wallet.publicKey, null, DECIMALS_USDT);

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
  }
}
