// anchor imports
import {
    Program,
    web3,
    workspace,
    BN,
    IdlAccounts,
  } from "@project-serum/anchor";
  // utils
  import { assert, expect } from "chai";
  // local
  import { handleTxn } from "../utils/fxns";
  import * as constants from "../utils/constants";
  import { Accounts } from "../config/accounts";
  import { RatioLending } from "../../target/types/ratio_lending";
  import { User } from "../interfaces";
  
  const programRatioLending = workspace.RatioLending as Program<RatioLending>;
  
  /**
   * Calls setInstaswapFee
   * @param accounts
   * @param user
   * @param feeNum - new fee Numerator value
   * @returns transaction receipt
   */
  const setInstaswapFeeCall = async (
    accounts: Accounts,
    user: User,
    feeNum: number
  ) => {
    const txnSetInstaswapFee = new web3.Transaction().add(
      programRatioLending.instruction.setInstaswapFee(new BN(feeNum), {
        accounts: {
          authority: user.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [user.wallet.payer],
      })
    );
    // send transaction
    const receipt = await handleTxn(
      txnSetInstaswapFee,
      user.provider.connection,
      user.wallet
    );
    return receipt;
  };
  
  /**
   * Verify that Instaswap fee cannot be set by a non-super user
   * @param notSuperUser
   * @param accounts
   */
  export const setInstaswapFeeFAIL_auth = async (
    notSuperUser: User,
    accounts: Accounts
  ) => {
    assert(
      notSuperUser.wallet.publicKey.toString() !==
        "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
      "For this fail test, do not use super user account"
    );
  
    let globalStateAccttInfo: web3.AccountInfo<Buffer> =
      await accounts.global.getAccountInfo();
    assert(
      globalStateAccttInfo,
      "Global State must be created to run admin panel tests"
    );
  
    const newBorrowFee = 100;
  
    await expect(
      setInstaswapFeeCall(accounts, notSuperUser, newBorrowFee)
    ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2001);
  };
  
  /**
   * Verify super user can set Instaswap fee
   * @param superUser
   * @param accounts
   */
  export const setInstaswapFeePASS = async (
    superUser: User,
    accounts: Accounts,
    newInstaswapFee: number
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
  
    let confirmation = await setInstaswapFeeCall(
      accounts,
      superUser,
      newInstaswapFee
    );
    assert(confirmation, "Failed to set Borrow Fee");
  
    let globalState: IdlAccounts<RatioLending>["globalState"] =
      await accounts.global.getAccount();
  
    assert(
      globalState.instaswapFeeNumer.toNumber() == newInstaswapFee,
      "Borrow Fee was not updated even though transaction succeeded."
    );
  
    confirmation = await setInstaswapFeeCall(
      accounts,
      superUser,
      constants.DEFAULT_FEE_NUMERATOR
    );
    assert(confirmation, "Failed to set Borrow Fee back to original value");
  
    globalState = await accounts.global.getAccount();
    assert(
      globalState.instaswapFeeNumer.toNumber() == constants.DEFAULT_FEE_NUMERATOR,
      "Borrow Fee was not updated even though transaction succeeded."
    );
  };
  