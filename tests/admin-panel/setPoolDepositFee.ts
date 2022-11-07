// anchor imports
import {
    Program,
    web3,
    workspace,
    BN,
    IdlAccounts,
  } from "@project-serum/anchor";
  // utils
  import { assert } from "chai";
  // local
  import { handleTxn } from "../utils/fxns";
  import { Accounts } from "../config/accounts";
  import { RatioLending } from "../../target/types/ratio_lending";
  import { User, Pool } from "../interfaces";
  
  const programRatioLending = workspace.RatioLending as Program<RatioLending>;
  
  /**
   * Calls setPoolDepositFee
   * @param accounts
   * @param user
   * @param pool
   * @param fee_num - new pool fee
   * @returns transaction receipt
   */
  const setPoolDepositFeeCall = async (
    accounts: Accounts,
    user: User,
    pool: Pool,
    fee_num: number
  ) => {
    const txnSetPoolDepositFee = new web3.Transaction().add(
      programRatioLending.instruction.setPoolDepositFee(new BN(fee_num), {
        accounts: {
          authority: user.wallet.publicKey,
          globalState: accounts.global.pubKey,
          pool: pool.pubKey,
        },
        signers: [user.wallet.payer],
      })
    );
    // send transaction
    const receipt = await handleTxn(
      txnSetPoolDepositFee,
      user.provider.connection,
      user.wallet
    );
    return receipt;
  };
  
  /**
   * Verify super user can set pool Deposit fee
   * @param superUser
   * @param pool
   * @param accounts
   */
  export const setPoolDepositFeePASS = async (
    superUser: User,
    pool: Pool,
    accounts: Accounts
  ) => {
    assert(
      superUser.wallet.publicKey.toString() ==
        "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
      "For this pass test, you must use super user account"
    );
  
    let globalStateAccttInfo: web3.AccountInfo<Buffer> =
      await accounts.global.getAccountInfo();
    assert(
      globalStateAccttInfo,
      "Global State must be created to run admin panel tests"
    );
  
    const poolAcctInfo: web3.AccountInfo<Buffer> = await pool.getAccountInfo();
    assert(
      poolAcctInfo,
      "Pool must be created to run setPoolDepositFee tests"
    );
  
    const newPoolDepositFee = 500;
  
    let confirmation = await setPoolDepositFeeCall(
      accounts,
      superUser,
      pool,
      newPoolDepositFee
    );
    assert(confirmation, "Failed to set Pool Deposit Fee");
  
    let poolAcct: IdlAccounts<RatioLending>["pool"] =
      await accounts.lpSaberUsdcUsdt.pool.getAccount();
  
    assert(
      poolAcct.depositFeeNumer.toNumber() == newPoolDepositFee,
      "Pool Deposit Fee was not updated even though transaction succeeded."
    );
  };
  