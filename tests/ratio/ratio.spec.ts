// anchor/solana
import { Program, workspace, setProvider } from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
// utils
import { expect, use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
// local imports
import { RatioLending } from "../../target/types/ratio_lending";
import { Accounts } from "../config/accounts";
import {
  createGlobalStateFAIL_duplicate,
  createGlobalStatePASS,
} from "./createGlobalState";
import {
  createPoolFAIL_dup,
  createPoolFAIL_noGlobalState,
  createPoolFAIL_auth,
  createPoolPASS,
} from "./createPool";
import {
  setPoolDebtCeilingFAIL_auth,
  setPoolDebtCeilingPASS,
} from "../admin-panel/setPoolDebtCeiling";
import { createVaultFAIL_BeforeRaydiumLedger, createVaultFAIL_Duplicate, createVaultPASS } from "./createVault";
import {
  depositCollateralPASS,
  depositCollateralFAIL_NotEnoughTokens,
  depositCollateralFAIL_DepositExceedingTVL,
} from "./depositCollateral";
import {
  withdrawCollateralFAIL_NotEnoughTokensInVault,
  withdrawCollateralFAIL_AttemptWithdrawFromOtherUser,
  withdrawCollateralPASS,
  withdrawCollateralPASS_AfterBorrow,
  withdrawCollateralFAIL_BlackList,
} from "./withdrawCollateral";
import { borrowUsdrPASS } from "./borrowUsdr";
import { createVaultRewardAta } from "./createRewardVault";
import { distributeRewardsPASS } from "./distributeReward";
import {
  DECIMALS_USDCUSDT,
  DECIMALS_USDCUSDT_RAYDIUM,
  DECIMALS_USDR,
  MINT_USDC_KEY,
  PLATFORM_TYPE_RAYDIUM,
  RAYDIUM_USDC_VAULT_KEY,
  RAYDIUM_USDT_VAULT_KEY,
} from "../utils/constants";
import {
  reportPriceToOracleFAIL_NotUpdater,
  reportPriceToOraclePASS,
} from "./reportPriceToOracle";
import { createOracleFAIL_Duplicate, createOraclePASS } from "./createOracle";
import {
  createSaberQuarryMinerPASS,
  createSaberQuarryMinerFAIL_forOtherUserReward,
  createSaberQuarryMinerFAIL_dupMiner,
} from "../saber/createSaberQuarryMiner";
import {
  stakeCollateralToSaberPASS,
  stakeCollateralToSaberFAIL_ToOtherMiner,
} from "../saber/stakeCollateralToSaber";
import {
  unstakeColalteralFromSaberFAIL_AttemptToUnstakeMoreThanWasStaked,
  unstakeColalteralFromSaberFAIL_AttemptToUnstakeFromAnotherUser,
  unstakeColalteralFromSaberFAIL_fromOtherUserMiner,
  unstakeColalteralFromSaberPASS,
} from "../saber/unstakeCollateralFromSaber";
import {
  harvestRewardsFromSaberPASS,
  harvestRewardsFromSaberFAIL_harvestOtherUserReward,
} from "../saber/harvestRewardFromSaber";
import {
  // repayUsdrFAIL_RepayMoreThanBorrowed,
  repayUsdrPASS_RepayFullAmountBorrowed,
  // repayUsdrPASS_RepayLessThanBorrowed,
  // repayUsdrFAIL_ZeroUsdr,
  // repayUsdrFAIL_RepayAnotherUsersDebt,
} from "../ratio/repayUsdr";
import {
  emergencyStatePASS_DepositDisabled,
  emergencyStatePASS_BorrowDisabled,
  emergencyStatePASS_WithdrawDisabled,
} from "../ratio/emergencyState";
import { createUserStatePASS } from "./createUserState";
import { depositAndStakeCollatPASS } from "./depositAndStakeCollat";
// interfaces
import { Users } from "../interfaces/users";
import { setGlobalTvlLimitPASS } from "../admin-panel/setGlobalTvlLimit";
import { addZeros, handleTxn, toUiAmount } from "../utils/fxns";
import { getMintInfo, sleep } from "@saberhq/token-utils";
// @ts-ignore
import { getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { stakeCollateralToRaydiumPASS } from "../raydium/stakeCollateralToRaydium";
import { harvestRewardFromRaydiumPASS } from "../raydium/harvestRewardFromRaydium";
import { unstakeCollateralFromRaydiumPASS } from "../raydium/unstakeCollateralFromRaydium";
import { createRaydiumLedgerPASS } from "../raydium/createRaydiumLedger";
import { createBlackListPASS } from "./createBlackList";
import { setInstaswapFeeFAIL_auth, setInstaswapFeePASS } from "../admin-panel/setInstaswapFee";

import { liquidate } from "./liquidate";

import { harvestRatioPASS } from "./harvestRatio";
import { distributeRatioPASS } from "./distributeRatioReward";
import { addLiquidityToRaydium } from "../raydium/addLiquidityToRaydium";
import { removeLiquidityFromRaydiumV4 } from "../raydium/removeLpFromRaydiumv4";
import { removeLiquidityFromRaydiumV5 } from "../raydium/removeLpFromRaydiumv5";
import { removeLiquidityFromSaber } from "../saber/removeLpFromSaber";
import { unwrapDecimals, wrapDecimals } from "../saber/addDecimals";
import { updateUserDebtInterest } from "./updateUserDebtInterest";
import { setPoolBorrowFeePASS } from "../admin-panel/setPoolBorrowFee";
import { setPoolHarvestFeePASS } from "../admin-panel/setPoolHarvestFee";
import { setPoolDepositFeePASS } from "../admin-panel/setPoolDepositFee";

// init env
chaiUse(chaiAsPromised);
// constants
const programRatioLending = workspace.RatioLending as Program<RatioLending>;
// init variables
let accounts: Accounts;
const users = new Users();
console.log("program keys id: ", programRatioLending.programId.toString());

describe("ratio core test suite", async () => {
  // Configure the client to use the local cluster.
  const provider = programRatioLending.provider;
  setProvider(provider);
  let userEventListener = null;
  let harvestEventListener = null;
  let priceReportEventListener = null;
  let liquidateStartListener = null;
  let liquidateAssetListener = null;
  let executeInternalTxListener = null;
  let liquidateEndListener = null;
  let instaswapReverseEventListener = null;

  before(async () => {
    await users.initAirdrops();

    accounts = new Accounts(users.external, users.oracleReporter);
    await accounts.initAccounts(users.super, [users.base, users.test]);

    await users.initUsers(accounts);
  });
  it('PASS: Attach Event Listener', async() => {
      userEventListener = programRatioLending.addEventListener(
        'UserEvent',
        (event, slot) => {
          console.log({
            ...event,
            mint: event.mint.toString(),
            user: event.user.toString(),
            totalColl: event.totalColl.toNumber(),
            totalDebt: event.totalDebt.toNumber(),
          });
        }
      );
      harvestEventListener = programRatioLending.addEventListener(
        'HarvestEvent',
        (event, slot) => {
          console.log(event);
        }
      );
      priceReportEventListener = programRatioLending.addEventListener(
        'ReportedPrice',
        (event, slot) => {
          console.log(event);
        }
      );
      liquidateStartListener = programRatioLending.addEventListener(
        'LiquidationStarted',
        (event, slot) => {
          console.log('Liquidate Started', {
            ...event,
            mint: event.mint.toString(),
            user: event.user.toString(),
            liquidateAmount: event.liquidateAmount.toNumber(),
            liquidateBurn: event.liquidateBurn.toNumber(),
            totalColl: event.totalColl.toNumber(),
            totalDebt: event.totalDebt.toNumber(),
            collPrice: event.collPrice.toNumber()

          });
        }
      );
      liquidateAssetListener = programRatioLending.addEventListener(
        'LiquidatedAsset',
        (event, slot) => {
          console.log('LiquidatedAsset', {
            ...event,
            mint: event.mint.toString(),
            user: event.user.toString(),
            assetMint: event.assetMint.toString(),
            assetAmount: event.assetAmount.toNumber(),
          });
        }
      );
      executeInternalTxListener = programRatioLending.addEventListener(
        'ExecutedInternalIx',
        (event, slot) => {
          console.log('ExecutedInternalIx', {
            ...event,
            mint: event.mint.toString(),
            user: event.user.toString(),
          });
        }
      );
      liquidateEndListener = programRatioLending.addEventListener(
        'LiquidationEnded',
        (event, slot) => {
          console.log('Liquidate Ended', {
            ...event,
            mint: event.mint.toString(),
            user: event.user.toString(),
            liquidateFee: event.liquidateFee.toNumber(),
          });
        }
      );
      
      instaswapReverseEventListener = programRatioLending.addEventListener(
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
  // pre-global state tests
  it("FAIL: Create pool without global state", async () => {
    await createPoolFAIL_noGlobalState(
      users.base,
      accounts,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.sbr.mint
    );
  });

  it("PASS: Create Global State", async () => {
    await createGlobalStatePASS(users.super, accounts);
    await setGlobalTvlLimitPASS(users.super, accounts);
    await createBlackListPASS(users.super, accounts);
  });

  it("FAIL: Create Global State - duplicate", async () => {
    await createGlobalStateFAIL_duplicate(
      users.oracleReporter,
      users.super,
      accounts
    );
  });

  // pool tests
  it("FAIL: Create Pool - User is not super", async () => {
    await createPoolFAIL_auth(
      users.base,
      accounts,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.sbr.mint
    );
  });

  it("PASS: Create Pool - lpSaberUsdcUsdt", async () => {
    await createPoolPASS(
      users.super,
      accounts,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.sbr.mint
    );
  });

  it("PASS: Create Pool - raydiumUsdcUsdtPool", async () => {
    await createPoolPASS(
      users.super,
      accounts,
      accounts.raydiumUsdcUsdtPool.pubKey,
      accounts.raydiumUsdcUsdtPool.tokenA,
      accounts.raydiumUsdcUsdtPool.tokenB,
      accounts.raydiumUsdcUsdtPool.lpMintPubkey,
      accounts.raydiumUsdcUsdtPool.rewardMint,
      PLATFORM_TYPE_RAYDIUM
    );
  });

  it("FAIL: Create Pool - duplicate", async () => {
    await createPoolFAIL_dup(
      users.super,
      accounts,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.sbr.mint
    );
  });

  // set pool debt ceiling
  it("FAIL: Set Pool Debt Ceiling - User is not super", async () => {
    await setPoolDebtCeilingFAIL_auth(
      users.base,
      accounts.lpSaberUsdcUsdt.pool,
      accounts
    );
  });

  it("PASS: Set Pool Debt Ceiling", async () => {
    await setPoolDebtCeilingPASS(
      users.super,
      accounts.lpSaberUsdcUsdt.pool,
      accounts
    );
  });

  it("PASS: Set Pool Borrow Fee", async () => {
    await setPoolBorrowFeePASS(
      users.super,
      accounts.lpSaberUsdcUsdt.pool,
      accounts
    );
  });

  it("PASS: Set Pool Harvest Fee", async () => {
    await setPoolHarvestFeePASS(
      users.super,
      accounts.lpSaberUsdcUsdt.pool,
      accounts
    );
  });

  it("PASS: Set Pool Deposit Fee", async () => {
    await setPoolDepositFeePASS(
      users.super,
      accounts.lpSaberUsdcUsdt.pool,
      accounts
    );
  });

  // // oracle tests - usdc oracle
  it("PASS: Create Oracle - USDC", async () => {
    //await createOraclePASS(users.oracleReporter, accounts, "usdc");
    await createOraclePASS(users.super, accounts, accounts["usdc"].oracle);
  });

  // oracle tests - mainnet usdc oracle
  it("PASS: Create Oracle - MAINNET USDC", async () => {
    await createOraclePASS(
      users.super,
      accounts,
      accounts.raydiumUsdcUsdtPool.oracleA
    );
  });

  // oracle tests - mainnet usdt oracle
  it("PASS: Create Oracle - MAINNET USDT", async () => {
    await createOraclePASS(
      users.super,
      accounts,
      accounts.raydiumUsdcUsdtPool.oracleB
    );
  });

  // oracle tests - duplicated usdc oracle
  it("FAIL: Create Oracle - Duplicate", async () => {
    await createOracleFAIL_Duplicate(
      users.oracleReporter,
      accounts,
      accounts["usdc"].oracle
    );
  });

  // // oracle tests - usdt oracle
  it("PASS: Create Oracle - USDT", async () => {
    //await createOraclePASS(users.oracleReporter, accounts, "usdt");
    await createOraclePASS(users.super, accounts, accounts["usdt"].oracle);
  });

  it("PASS: Report Price - USDC", async () => {
    await reportPriceToOraclePASS(users.oracleReporter, accounts);
  });

  it("FAIL: Update Price Feed - Not Updater", async () => {
    // TODO: refactor to include just the high level classes
    const newPrice = 134000000;

    await reportPriceToOracleFAIL_NotUpdater(users.base, accounts, newPrice);
  });

  it("PASS: Create User State", async () => {
    await createUserStatePASS(users.base);
    await createUserStatePASS(users.test);
  });

  // vault tests
  it("PASS: Create Vault for base user", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultPASS(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.vault.pubKey,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey
    );
  });

  it("FAIL: Create Raydium Vault before ledger", async () => {
    await createVaultFAIL_BeforeRaydiumLedger(
      users.base.wallet,
      users.base.provider.connection,
      accounts.raydiumUsdcUsdtPool.getVaultKey(users.base.wallet.publicKey),
      accounts.raydiumUsdcUsdtPool.pubKey,
      accounts.raydiumUsdcUsdtPool.lpMintPubkey,
      accounts.raydiumUsdcUsdtPool.getVaultAtaCollatKey(
        users.base.wallet.publicKey
      ),
      accounts.raydiumUsdcUsdtPool
    );
  });

  it("PASS: Create raydium ledger before creating vault", async () => {
    await createRaydiumLedgerPASS(users.base, accounts);
  });
  it("PASS: Create Raydium Vault for base user", async () => {
    await createVaultPASS(
      users.base.wallet,
      users.base.provider.connection,
      accounts.raydiumUsdcUsdtPool.getVaultKey(users.base.wallet.publicKey),
      accounts.raydiumUsdcUsdtPool.pubKey,
      accounts.raydiumUsdcUsdtPool.lpMintPubkey,
      accounts.raydiumUsdcUsdtPool.getVaultAtaCollatKey(
        users.base.wallet.publicKey
      ),
      accounts.raydiumUsdcUsdtPool
    );
  });


  it("FAIL: Create Vault - Duplicate", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultFAIL_Duplicate(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.vault.pubKey,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey
    );
  });

  it("PASS: Create Vault for test user", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultPASS(
      users.test.wallet,
      users.test.provider.connection,
      users.test.tokens.lpSaber.vault.pubKey,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      users.test.tokens.lpSaber.vault.ataCollat.pubKey
    );
  });

  it("FAIL: Create Vault - Duplicate from another account", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultFAIL_Duplicate(
      users.test.wallet,
      users.test.provider.connection,
      users.test.tokens.lpSaber.vault.pubKey,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      users.test.tokens.lpSaber.vault.ataCollat.pubKey
    );
  });

  it("PASS: Create Quarry Miner", async () => {
    await createSaberQuarryMinerPASS(users.base, accounts);
    await createSaberQuarryMinerPASS(users.test, accounts);
  });

  it("FAIL: Create Quarry Miner - To harvest other user's reward", async () => {
    await createSaberQuarryMinerFAIL_forOtherUserReward(
      users.base,
      users.test,
      accounts
    );
  });

  it("FAIL: Create Quarry Miner - Duplicated Miner for same vault", async () => {
    await createSaberQuarryMinerFAIL_dupMiner(users.base, accounts);
  });

  // depositing collateral
  it("FAIL: Deposit Collateral - Not Enough Tokens", async () => {
    await depositCollateralFAIL_NotEnoughTokens(
      users.test,
      accounts,
      users.test.tokens.lpSaber.ata.pubKey,
      users.test.tokens.lpSaber.vault.pubKey,
      users.test.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdt.pubKey,
      addZeros(10000000, DECIMALS_USDCUSDT)
    );
  });

  it("PASS: Deposit Collateral - first time for base with event test", async () => {

    const amtToDepositUi = 1000;
    let baseSaberLpTokenAccount = await getAccount(provider.connection, users.base.tokens.lpSaber.ata.pubKey);
    console.log("Base User saberLP token-acoount: ", toUiAmount(Number(baseSaberLpTokenAccount.amount), DECIMALS_USDCUSDT));
    const amtToDepositPrecise = addZeros(amtToDepositUi, DECIMALS_USDCUSDT);
    await depositCollateralPASS(
      users.base,
      accounts,
      users.base.tokens.lpSaber.ata.pubKey,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdt.pubKey,
      amtToDepositPrecise
    );
  });

  it("PASS: Deposit Raydium Collateral", async () => {
    const amtToDepositUi = 1;
    const amtToDepositPrecise = addZeros(
      amtToDepositUi,
      DECIMALS_USDCUSDT_RAYDIUM
    );
    await depositCollateralPASS(
      users.base,
      accounts,
      users.base.tokens.lpUsdcUsdtRaydiumAta,
      accounts.raydiumUsdcUsdtPool.getVaultKey(users.base.wallet.publicKey),
      accounts.raydiumUsdcUsdtPool.getVaultAtaCollatKey(
        users.base.wallet.publicKey
      ),
      accounts.raydiumUsdcUsdtPool.lpMintPubkey,
      accounts.raydiumUsdcUsdtPool.pubKey,
      new PublicKey(RAYDIUM_USDC_VAULT_KEY),
      new PublicKey(RAYDIUM_USDT_VAULT_KEY),
      accounts.raydiumUsdcUsdtPool.oracleA.pubKey,
      accounts.raydiumUsdcUsdtPool.oracleB.pubKey,
      amtToDepositPrecise
    );
  });

  it("PASS: Deposit Collateral - first time for test", async () => {
    const amtToDepositUi = 1000;
    const amtToDepositPrecise = addZeros(amtToDepositUi, DECIMALS_USDCUSDT);
    let testSaberLpTokenAccount = await getAccount(provider.connection, users.test.tokens.lpSaber.ata.pubKey);
    console.log("Test User saberLP token-acoount: ", toUiAmount(Number(testSaberLpTokenAccount.amount), DECIMALS_USDCUSDT));
    await depositCollateralPASS(
      users.test,
      accounts,
      users.test.tokens.lpSaber.ata.pubKey,
      users.test.tokens.lpSaber.vault.pubKey,
      users.test.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdt.pubKey,
      amtToDepositPrecise
    );
  });

  it("FAIL: Deposit Collateral - Deposit Exceeding TVL", async () => {
    const depositAmountUi = 1;
    const depositAmountPrecise = addZeros(depositAmountUi, DECIMALS_USDCUSDT);
    // mint tokens to the user's account first
    await depositCollateralFAIL_DepositExceedingTVL(
      users.base,
      accounts,
      users.base.tokens.lpSaber.ata.pubKey,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdt.pubKey,
      depositAmountPrecise
    );
  });

  // withrawing collateral
  it("FAIL: Withdraw Collateral - Not Enough Tokens in Vault", async () => {
    const withdrawAmountUi = 1005;
    const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
    await withdrawCollateralFAIL_NotEnoughTokensInVault(
      users.base,
      users.base.tokens.lpSaber.ata.pubKey,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.global,
      accounts.blackList,
      users.base.userState,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.oracle.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.oracle.pubKey,
      withdrawAmountPrecise
    );
  });

  it("FAIL: Withdraw Collateral - Attempt Withdraw From Other User", async () => {
    const withdrawAmountUi = 0.1;
    const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
    await withdrawCollateralFAIL_AttemptWithdrawFromOtherUser(
      users.base,
      users.test,
      users.base.tokens.lpSaber.ata.pubKey,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.global,
      accounts.blackList,
      users.base.userState,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.oracle.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.oracle.pubKey,
      withdrawAmountPrecise
    );
  });

  it("PASS: Withdraw collateral", async () => {
    const withdrawAmountUi = 0.1;
    const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
    await withdrawCollateralPASS(
      users.base,
      users.base.tokens.lpSaber.ata.pubKey,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.global,
      accounts.blackList,
      users.base.userState,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.oracle.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.oracle.pubKey,
      withdrawAmountPrecise
    );

    await withdrawCollateralPASS(
      users.test,
      users.test.tokens.lpSaber.ata.pubKey,
      users.test.tokens.lpSaber.vault.pubKey,
      users.test.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.global,
      accounts.blackList,
      users.test.userState,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.oracle.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.oracle.pubKey,
      withdrawAmountPrecise
    );
  });

  it("PASS: BlackList Add", async () => {
    await programRatioLending.rpc.addToBlacklist(users.base.wallet.publicKey, {
      accounts: {
        authority: users.super.wallet.publicKey,
        globalState: accounts.global.pubKey,
        blacklist: accounts.blackList.pubKey,
      },
    });
  });

  it("FAIL: BlackList ADD: Duplicated", async () => {
    await expect(
      handleTxn(programRatioLending.transaction.addToBlacklist(users.base.wallet.publicKey, {
        accounts: {
          authority: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
          blacklist: accounts.blackList.pubKey,
        },
      }), users.super.provider.connection, users.super.wallet)
    ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6024);
  });
  it("FAIL: Withdraw from Blacklist", async () => {
    const withdrawAmountUi = 0.1;
    const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
    await withdrawCollateralFAIL_BlackList(
      users.base,
      users.base.tokens.lpSaber.ata.pubKey,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.global,
      accounts.blackList,
      users.base.userState,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.oracle.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.oracle.pubKey,
      withdrawAmountPrecise
    );
  });
  it("PAss: remove from Blacklist", async () => {

    await handleTxn(programRatioLending.transaction.removeFromBlacklist(users.base.wallet.publicKey, {
      accounts: {
        authority: users.super.wallet.publicKey,
        globalState: accounts.global.pubKey,
        blacklist: accounts.blackList.pubKey,
      },
    }), users.super.provider.connection, users.super.wallet);
  });

  it("FAIL: remove from Blacklist not existing", async () => {
    await expect(
      handleTxn(programRatioLending.transaction.removeFromBlacklist(users.base.wallet.publicKey, {
        accounts: {
          authority: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
          blacklist: accounts.blackList.pubKey,
        },
      }), users.super.provider.connection, users.super.wallet)
    ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6026);
  });

  it("PASS: Withdraw Raydium collateral", async () => {
    const withdrawAmountUi = 0.1;
    const withdrawAmountPrecise =
      withdrawAmountUi * 10 ** DECIMALS_USDCUSDT_RAYDIUM;
    await withdrawCollateralPASS(
      users.base,
      users.base.tokens.lpUsdcUsdtRaydiumAta,
      accounts.raydiumUsdcUsdtPool.getVaultKey(users.base.wallet.publicKey),
      accounts.raydiumUsdcUsdtPool.getVaultAtaCollatKey(
        users.base.wallet.publicKey
      ),
      accounts.raydiumUsdcUsdtPool.lpMintPubkey,
      accounts.raydiumUsdcUsdtPool.pubKey,
      accounts.global,
      accounts.blackList,
      users.base.userState,
      new PublicKey(RAYDIUM_USDC_VAULT_KEY),
      new PublicKey(RAYDIUM_USDT_VAULT_KEY),
      accounts.raydiumUsdcUsdtPool.oracleA.pubKey,
      accounts.raydiumUsdcUsdtPool.oracleB.pubKey,
      withdrawAmountPrecise
    );
  });

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdr<'info>`)
  it("PASS: Borrow/mint USDr for base", async () => {
    await borrowUsdrPASS(users.base, accounts);
  });
  it("PASS: Borrow/mint USDr for test", async () => {
    await borrowUsdrPASS(users.test, accounts);
  });

  it("PASS: Withdraw collateral though vault has debt", async () => {
    const withdrawAmountUi = 500;
    const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
    await withdrawCollateralPASS_AfterBorrow(
      users.base,
      users.base.tokens.lpSaber.ata.pubKey,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.global,
      accounts.blackList,
      users.base.userState,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.ata.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[0].tokenMarket.oracle.pubKey,
      accounts.lpSaberUsdcUsdt.mktTokenArr[1].tokenMarket.oracle.pubKey,
      withdrawAmountPrecise
    );
  });

  it("PASS: Repay USDr - Repaying Exact Amount Originally Borrowed", async () => {
    await repayUsdrPASS_RepayFullAmountBorrowed(users.base, accounts);
  });

  it("PASS: Create vault ataReward", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultRewardAta(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataReward.pubKey,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.sbr.mint
    );
  });
  it("PASS: Create raydium vault ataReward", async () => {
    await createVaultRewardAta(
      users.base.wallet,
      users.base.provider.connection,
      accounts.raydiumUsdcUsdtPool.getVaultKey(users.base.wallet.publicKey),
      accounts.raydiumUsdcUsdtPool.getVaultAtaRewardKey(
        users.base.wallet.publicKey
      ),
      accounts.raydiumUsdcUsdtPool.pubKey,
      accounts.raydiumUsdcUsdtPool.rewardMint
    );

    await createVaultRewardAta(
      users.base.wallet,
      users.base.provider.connection,
      accounts.raydiumUsdcUsdtPool.getVaultKey(users.base.wallet.publicKey),
      accounts.raydiumUsdcUsdtPool.getVaultAtaRewardBKey(
        users.base.wallet.publicKey
      ),
      accounts.raydiumUsdcUsdtPool.pubKey,
      accounts.raydiumUsdcUsdtPool.oracleA.mint
    );
  });

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdr<'info>`)
  // this works but we need fail tests
  it("PASS: Borrow/mint USDr", async () => {
    await borrowUsdrPASS(users.base, accounts);
  });

  it("PASS: Emergency State Disables Deposits", async () => {
    await emergencyStatePASS_DepositDisabled(users.super, users.base, accounts);
  });

  it("PASS: Emergency State Disables Borrowing", async () => {
    await emergencyStatePASS_BorrowDisabled(users.super, users.base, accounts);
  });

  it("PASS: Emergency State Disables Withdraws", async () => {
    await emergencyStatePASS_WithdrawDisabled(
      users.super,
      users.base,
      accounts
    );
  });

  // // This works

  it("PASS: Harvest rewards from the User Vault", async () => {
    await distributeRewardsPASS(users.base, accounts);
  });

  it("FAIL: Unstake From Saber - Try To Unstake More Than Was Staked", async () => {
    await unstakeColalteralFromSaberFAIL_AttemptToUnstakeMoreThanWasStaked(
      users.base,
      accounts
    );
  });

  it("PASS: Stake to saber", async () => {
    await stakeCollateralToSaberPASS(users.base, accounts);
  });

  it("FAIL: Stake to saber - Stake to other user's miner", async () => {
    const amtToDepositUi = 1000;
    const amtToDepositPrecise = addZeros(amtToDepositUi, DECIMALS_USDCUSDT);
    await depositCollateralPASS(
      users.base,
      accounts,
      users.base.tokens.lpSaber.ata.pubKey,
      users.base.tokens.lpSaber.vault.pubKey,
      users.base.tokens.lpSaber.vault.ataCollat.pubKey,
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.pool.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.ataMarketTokens.usdt.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdc.pubKey,
      accounts.lpSaberUsdcUsdt.pool.oracles.usdt.pubKey,
      amtToDepositPrecise
    );
    await stakeCollateralToSaberFAIL_ToOtherMiner(
      users.base,
      users.test,
      accounts
    );
  });

  it("PASS: Harvest rewards from the saber quarry mine", async () => {
    await harvestRewardsFromSaberPASS(users.base, users.super, accounts);
  });
  it("FAIL: Harvest rewards from the saber quarry mine - Harvest other user's reward", async () => {
    await harvestRewardsFromSaberFAIL_harvestOtherUserReward(
      users.base,
      users.test,
      users.super,
      accounts
    );
  });

  it("FAIL: Unstake From Saber - Try To Unstake More Than Was Staked", async () => {
    await unstakeColalteralFromSaberFAIL_AttemptToUnstakeMoreThanWasStaked(
      users.base,
      accounts
    );
  });

  it("FAIL: Unstake From Saber - Unstake For Another User", async () => {
    await unstakeColalteralFromSaberFAIL_AttemptToUnstakeFromAnotherUser(
      users.base,
      users.test,
      accounts
    );
  });
  it("FAIL: Unstake From Saber - Unstake from other user's miner", async () => {
    const amtToStake = 100 * 10 ** DECIMALS_USDCUSDT;
    await depositAndStakeCollatPASS(users.test, accounts, amtToStake);

    await unstakeColalteralFromSaberFAIL_fromOtherUserMiner(
      users.base,
      users.test,
      accounts
    );
  });

  it("PASS: Unstake From Saber", async () => {
    await unstakeColalteralFromSaberPASS(users.base, accounts);
  });

  it("PASS: Deposit and stake to Saber miner", async () => {
    const amtToStake = 100 * 10 ** DECIMALS_USDCUSDT;
    await depositAndStakeCollatPASS(users.base, accounts, amtToStake);
  });

  it("PASS: Stake to raydium", async () => {
    await stakeCollateralToRaydiumPASS(users.base, users.super, accounts);
  });
  it("PASS: Harvest rewards from raydium", async () => {
    await harvestRewardFromRaydiumPASS(users.base, users.super, accounts);
  });
  it("PASS: Unstake From Raydium", async () => {
    await unstakeCollateralFromRaydiumPASS(users.base, users.super, accounts);
  });

  it("PASS: Harvest Ratio Rewards", async () => {
    await harvestRatioPASS(users.base, accounts, users.super);
  });

  it("PASS: Distribute Ratio Rewards", async () => {
    await distributeRatioPASS(users.base, accounts);
  })

  // set instaswap fee
  it("FAIL: Set Instaswap fee - User is not super", async () => {
    await setInstaswapFeeFAIL_auth(users.base, accounts);
  });
  it("PASS: Set Instaswap fee", async () => {
    await setInstaswapFeePASS(users.super, accounts, 1);
  });
  it("PASS: instaswap - remove liquidity raydium v4 and cut fees", async () => {
    await removeLiquidityFromRaydiumV4(users.test, users.super, accounts);
  });
  it("PASS: instaswap - remove liquidity raydium v5 and cut fees", async () => {
    await removeLiquidityFromRaydiumV5(users.test, users.super, accounts);
  });
  it("PASS: instaswap - remove liquidity saber and cut fees", async () => {
    await removeLiquidityFromSaber(users.test, users.super, accounts);
  });
  
  it("PASS: instaswap - add liquidity to raydiumV4 and cut fees", async () => {
    await addLiquidityToRaydium(users.test, users.super, accounts, 4);
  });

  it("PASS: instaswap - add liquidity to raydiumV5 and cut fees", async () => {
    await addLiquidityToRaydium(users.test, users.super, accounts, 5);
  });

  it("PASS: Update user debt interest", async () => {
    // TODO: refactor to include just the high level classes
    const pool = accounts.lpSaberUsdcUsdt.pool;
    const user = users.base;
    const vault = user.tokens.lpSaber.vault;
    await updateUserDebtInterest(pool, user, vault,  users.oracleReporter, accounts);
  });

  it("PASS: liquidate", async () => {
    const pool = accounts.lpSaberUsdcUsdt.pool;
    const user = users.base;
    const vault = user.tokens.lpSaber.vault;

    const amtToLiquidate = addZeros(1, DECIMALS_USDCUSDT);
    await liquidate(pool, user, vault,  users.oracleReporter, accounts, amtToLiquidate);
  });

  it("PASS: liquidate again to check liquidation id", async () => {
    const pool = accounts.lpSaberUsdcUsdt.pool;
    const user = users.test;
    const vault = user.tokens.lpSaber.vault;

    const amtToLiquidate = addZeros(1, DECIMALS_USDCUSDT);
    await liquidate(pool, user, vault,  users.oracleReporter, accounts, amtToLiquidate);
  });

  it("PASS: Remove Event Listener", async () => {
    console.log('Listener ID', {userEventListener, harvestEventListener, priceReportEventListener, liquidateStartListener, liquidateAssetListener, executeInternalTxListener, liquidateEndListener, instaswapReverseEventListener});
    await programRatioLending.removeEventListener(userEventListener);  
    await programRatioLending.removeEventListener(harvestEventListener);  
    await programRatioLending.removeEventListener(priceReportEventListener);  
    await programRatioLending.removeEventListener(liquidateStartListener);  
    await programRatioLending.removeEventListener(liquidateAssetListener);  
    await programRatioLending.removeEventListener(executeInternalTxListener);  
    await programRatioLending.removeEventListener(liquidateEndListener);  
    await programRatioLending.removeEventListener(instaswapReverseEventListener);
  });

  it("Add Decimals", async () => {
    await wrapDecimals(users.test, accounts);
  });

  it("Remove Decimals", async () => {
    await unwrapDecimals(users.test, accounts);
  });
});
