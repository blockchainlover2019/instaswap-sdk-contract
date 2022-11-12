// anchor/solana
import { Program, workspace, setProvider } from "@project-serum/anchor";
// utils
import { expect, use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
// local imports
import { RatioSdk } from "../target/types/ratio_sdk";
// interfaces
import { Users } from "./interfaces/users";
import { addLiquidityToRaydium } from "./raydium/addLiquidityToRaydium";
import { removeLiquidityFromRaydiumV4 } from "./raydium/removeLpFromRaydiumv4";
import { removeLiquidityFromRaydiumV5 } from "./raydium/removeLpFromRaydiumv5";
import { addLiquidityToSaber } from "./saber/addLiquidityToSaber";
import { removeLiquidityFromSaber } from "./saber/removeLiquidityFromSaber";
import { unwrapDecimals, wrapDecimals } from "./saber/addDecimals";
import { Accounts } from "./config/accounts";

// init env
chaiUse(chaiAsPromised);
// constants
const programRatioSdk = workspace.RatioSdk as Program<RatioSdk>;
// init variables
const users = new Users()
let accounts: Accounts;
describe("ratio sdk core test suite", async () => {
  // Configure the client to use the local cluster.
  const provider = programRatioSdk.provider;
  setProvider(provider);
  let instaswapReverseEventListener = null;

  it('setup', async () => {
    await users.initAirdrops();
    accounts = new Accounts();
    await accounts.initAccounts(users.super);
  });

  it('PASS: Attach Event Listener', async() => {
    instaswapReverseEventListener = programRatioSdk.addEventListener(
      'InstaswapReverseEvent',
      async (event: any, slot: number, signature: string) => {
        console.log('Instaswap Reverse Output',
          {
            user_wallet: event.userWallet.toString(),

            token_a_mint: event.tokenAMint.toString(),
            token_b_mint: event.tokenBMint.toString(),
            fee_a_amount: event.feeAmountTokenA.toString(),
            fee_b_amount: event.feeAmountTokenB.toString(),

            output_a_amount: event.outputAAmount.toString(),
            output_b_amount: event.outputBAmount.toString(),
            
            pool_mint: event.poolMint.toString(),
            platform_name: event.platformName,

            tx: signature
          });

        }
      );
  })
  
  it("PASS: instaswap - remove liquidity raydium v4 and cut fees", async () => {
    await removeLiquidityFromRaydiumV4(users.test);
  });

  it("PASS: instaswap - remove liquidity raydium v5 and cut fees", async () => {
    await removeLiquidityFromRaydiumV5(users.test);
  });

  it("PASS: instaswap - remove liquidity saber and cut fees", async () => {
    await removeLiquidityFromSaber(users.super, accounts);
  });

  it("PASS: instaswap - add liquidity saber and cut fees", async () => {
    await addLiquidityToSaber(users.super, accounts);
  });
  
  it("PASS: instaswap - add liquidity to raydiumV4 and cut fees", async () => {
    await addLiquidityToRaydium(users.test, 4);
  });

  it("PASS: instaswap - add liquidity to raydiumV5 and cut fees", async () => {
    await addLiquidityToRaydium(users.test, 5);
  });

  it("Add Decimals", async () => {
    await wrapDecimals(users.test);
  });

  it("Remove Decimals", async () => {
    await unwrapDecimals(users.test);
  });
  
  it("PASS: Remove Event Listener", async () => {
   await programRatioSdk.removeEventListener(instaswapReverseEventListener);
  });

});
