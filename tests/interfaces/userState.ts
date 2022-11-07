// anchor/solana
import { Program, Wallet, web3, workspace } from "@project-serum/anchor";
import { Connection, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { RatioLending } from "../../target/types/ratio_lending";
import { USER_STATE_SEED } from "../utils/constants";
// local
import { getPda, handleTxn } from "../utils/fxns";
import { PDA } from "../utils/interfaces";
import { User } from "./user";

// init
const programRatioLending = workspace.RatioLending as Program<RatioLending>;

export class UserState extends PDA {
  bump: number;
  type: string;
  user: User;

  constructor(user: User, program: Program<any> = programRatioLending) {
    // derive account from seeds
    const [userStatePubKey, userStateBump] = getPda(
      [Buffer.from(USER_STATE_SEED), user.wallet.publicKey.toBuffer()],
      program.programId
    );
    super(userStatePubKey);

    this.bump = userStateBump;
    this.user = user;
    this.type = "userState";
  }

  async createUserState(
    user: User = this.user,
    userConnection: Connection = this.user.provider.connection,
    userWallet: Wallet = this.user.wallet,
    program: Program<any> = programRatioLending
  ) {
    const txn = new web3.Transaction().add(
      program.instruction.createUserState(
        // user_state_bump
        // this.bump,
        {
          accounts: {
            // account that owns the vault
            authority: user.wallet.publicKey,
            // the user state acct is the general state for holding platform information about a user
            userState: this.pubKey,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );

    // send transaction
    const receipt = await handleTxn(txn, userConnection, userWallet);

    return receipt;
  }

  async isAccountCreated(): Promise<Boolean> {
    const userStateInfo: web3.AccountInfo<Buffer> = await this.getAccountInfo();
    return !!userStateInfo;
  }
}
