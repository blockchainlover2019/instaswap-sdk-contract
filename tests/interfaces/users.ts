import * as testKeys from "../../.config/testKeys";
import { User } from "./user";
import { Program, Wallet, workspace } from "@project-serum/anchor";
import { RatioSdk } from "../../target/types/ratio_sdk";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { addZeros, airdropSol, createAtaOnChain, createAtaOnChainByKey, getAssocTokenAcct, getPda } from "../utils/fxns";
// init
const programRatioSdk = workspace.RatioSdk as Program<RatioSdk>;

export class Users {
  public base: User;
  public test: User;
  public super: User;
  public oracleReporter: User;
  public treasury: User;
  public external: User;

  constructor() {
    this.base = new User(testKeys.base.keypair, "base");
    this.test = new User(testKeys.test.keypair, "test");
    this.oracleReporter = new User(
      testKeys.oracleReporter.keypair,
      "oracleReporter"
    );
    this.super = new User(
      (programRatioSdk.provider.wallet as Wallet).payer,
      "super"
    );
    this.treasury = new User(testKeys.treasury.keypair, "treasury");
    this.external = new User(testKeys.external.keypair, "external");
  }

  public async initAirdrops() {
    const usersArr = [
      this.base,
      this.test,
      this.external,
      this.oracleReporter,
      this.treasury,
    ];
    for (let idx = 0; idx < usersArr.length; idx += 1) {
      const user: User = usersArr[idx];

      await airdropSol(
        user.provider,
        user.wallet.publicKey,
        addZeros(100000 * LAMPORTS_PER_SOL, 0)
      );
    }
  }
}
