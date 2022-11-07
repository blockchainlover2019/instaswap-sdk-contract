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
import { EMER_STATE_DISABLED } from "../utils/constants";
import { Accounts } from "../config/accounts";
import { RatioLending } from "../../target/types/ratio_lending";
import { User } from "../interfaces/user";

const programRatioLending = workspace.RatioLending as Program<RatioLending>;

/**
 * Calls toggleEmerState
 * @param accounts 
 * @param user 
 * @param new_state - new emergency state
 * @returns transaction receipt
 */
export const toggleEmerStateCall = async (
    accounts: Accounts,
    user: User,
    new_state: number
) => {
    const txnToggleEmerState = new web3.Transaction().add(
        programRatioLending.instruction.toggleEmerState(
            new BN(new_state),
            {
                accounts: {
                    authority: user.wallet.publicKey,
                    globalState: accounts.global.pubKey,
                },
                signers: [user.wallet.payer],
            }
        )
    )
    // send transaction
    const receipt = await handleTxn(
        txnToggleEmerState,
        user.provider.connection,
        user.wallet);
    return receipt;
};

/**
 * Verify that emmergency state cannot be toggled by a non-super user
 * @param notSuperUser 
 * @param accounts 
 */
export const toggleEmerStateFAIL_auth = async (
    notSuperUser: User,
    accounts: Accounts,
) => {
    assert(
        notSuperUser.wallet.publicKey.toString() !==
        "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
        "For this fail test, do not use super user account"
    );

    let globalStateAccttInfo: web3.AccountInfo<Buffer> =
        await accounts.global.getAccountInfo();
    assert(globalStateAccttInfo, "Global State must be created to run admin panel tests");

    const newEmerState = 1;

    await expect(
        toggleEmerStateCall(accounts, notSuperUser, newEmerState)
    ).to.be.eventually.rejectedWith(Error).and.have.property('code', 2001);

    const globalState: IdlAccounts<RatioLending>["globalState"] =
        await accounts.global.getAccount();
    assert(globalState.paused != newEmerState,
        "Emergency State updated even though transaction was rejected.");
};

/**
 * Verify super user can toggle emergency state
 * @param superUser 
 * @param accounts 
 */
export const toggleEmerStatePASS = async (
    superUser: User,
    accounts: Accounts,
) => {
    assert(
        superUser.wallet.publicKey.toString() ==
        "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
        "For this pass test, you must use super user account"
    );

    let globalStateAccttInfo: web3.AccountInfo<Buffer> =
        await accounts.global.getAccountInfo();
    assert(globalStateAccttInfo, "Global State must be created to run admin panel tests");

    const newEmerState = 1;

    let confirmation = await toggleEmerStateCall(accounts, superUser, newEmerState);
    assert(confirmation, "Failed to toggle emergency state");

    let globalState: IdlAccounts<RatioLending>["globalState"] =
        await accounts.global.getAccount();

    assert(globalState.paused == newEmerState,
        "Emergency state was not updated even though transaction succeeded.");

    confirmation = await toggleEmerStateCall(accounts, superUser, EMER_STATE_DISABLED);
    assert(confirmation, "Failed to disable emergency state");

    globalState = await accounts.global.getAccount();
    assert(globalState.paused == EMER_STATE_DISABLED,
        "Emergency State was not updated even though transaction succeeded.");
};

/**
 * Verify super user cannot set the emergency state to the same value
 * @param superUser 
 * @param accounts 
 */
export const toggleEmerStateFAIL_SetSameValueTwice = async (
    superUser: User,
    accounts: Accounts,
) => {
    assert(
        superUser.wallet.publicKey.toString() ==
        "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
        "For this pass test, you must use super user account"
    );

    let globalStateAccttInfo: web3.AccountInfo<Buffer> =
        await accounts.global.getAccountInfo();
    assert(globalStateAccttInfo, "Global State must be created to run admin panel tests");

    const newEmerState = 1;

    let confirmation = await toggleEmerStateCall(accounts, superUser, newEmerState);
    assert(confirmation, "Failed to toggle emergency state");

    let globalState: IdlAccounts<RatioLending>["globalState"] =
        await accounts.global.getAccount();

    assert(globalState.paused == newEmerState,
        "Emergency state was not updated even though transaction succeeded.");

    await expect(
        toggleEmerStateCall(accounts, superUser, newEmerState)
    ).to.be.eventually.rejectedWith(Error).and.have.property('code', 6005);

    confirmation = await toggleEmerStateCall(accounts, superUser, EMER_STATE_DISABLED);
    assert(confirmation, "Failed to disable emergency state");

    globalState = await accounts.global.getAccount();
    assert(globalState.paused == EMER_STATE_DISABLED,
        "Emergency State was not updated even though transaction succeeded.");
};