import { Keypair, PublicKey } from "@solana/web3.js";
import keyArrSuper from "./super.json";
import keyArrBase from "./base.json";
import keyArrTest from "./test.json";
import keyArrOracleReporter from "./oracleReporter.json";
import keyArrTreasury from "./treasury.json";
import keyArrExternal from "./external.json";

export class Key {
  name: string;
  keypairArr: Uint8Array;
  keypair: Keypair;
  pubKey: PublicKey;
  secretKey: Uint8Array;
  secretMnemonic?: string;

  constructor(name: string, keypairArr: number[], secretMnemonic?: string) {
    this.name = name;
    this.keypairArr = new Uint8Array(keypairArr as any[]);
    this.keypair = Keypair.fromSecretKey(this.keypairArr);
    this.pubKey = this.keypair.publicKey;
    this.secretKey = this.keypair.secretKey;
    this.secretMnemonic = secretMnemonic;
  }
}

// base
export const superUser = new Key(
  "super",
  keyArrSuper,
  "arrow pulp weasel silent tenant utility possible rose hard problem toast wife retreat away torch cargo game slogan expect often world wait monitor boy"
);

export const base = new Key("base", keyArrBase);

export const test = new Key(
  "test",
  keyArrTest,
  "wagon smooth fit gold tumble right combine width width law like glad"
);

export const treasury = new Key(
  "treasury",
  keyArrTreasury,
  "trust gallery giggle resemble sure neglect road obscure convince gorilla slush mention"
);

export const oracleReporter = new Key(
  "oracleReporter",
  keyArrOracleReporter,
  "sign bacon room symptom regular agree clean fever negative forward wine ball"
);

export const external = new Key("external", keyArrExternal);
