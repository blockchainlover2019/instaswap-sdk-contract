// anchor/solana
import {
  web3,
  Provider,
  utils,
  getProvider,
  Wallet,
} from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  Signer,
  TokenAmount,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  // @ts-ignore
  mintTo,
  // @ts-ignore
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
// local
import { translateError } from "./errors";
import { TestTokens } from "./types";
import { User } from "../interfaces/user";

/**
 * We use user provider and user wallet because
 * @param txn
 * @param userProvider
 * @param userWallet
 * @returns receipt - string
 */
export const handleTxn = async (
  txn: web3.Transaction,
  userConnection: Connection,
  userWallet: Wallet
) => {
  // return await sendAndConfirmTransaction(userConnection, txn,  [userWallet.payer]);
  // prep txn
  txn.feePayer = userWallet.publicKey;
  try {
    txn.recentBlockhash = (await userConnection.getLatestBlockhash()).blockhash;
  } catch (error) {
    throw error;
  }

  // send txn
  try {
    const signedTxn: Transaction = await userWallet.signTransaction(txn);
    const rawTxn: Buffer = signedTxn.serialize();
    const options = {
      skipPreflight: true,
      commitment: "singleGossip",
    };

    const receipt: string = await userConnection.sendRawTransaction(
      rawTxn,
      options
    );
    const confirmation: web3.RpcResponseAndContext<web3.SignatureResult> =
      await userConnection.confirmTransaction(receipt);
    if (confirmation.value.err)
      throw new Error(JSON.stringify(confirmation.value.err));
    else return receipt;
  } catch (error) {
    translateError(error);
  }
};

export const simulateTxn = async (
  connection: Connection,
  tx: Transaction,
  userPublicKey: PublicKey
) => {
  const blockhashInfo = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhashInfo.blockhash;
  tx.feePayer = userPublicKey;
  const simulationResult = await connection.simulateTransaction(
    tx.compileMessage()
  );
  return simulationResult;
};

export const airdropSol = async (
  provider: Provider,
  target: web3.PublicKey,
  lamps: number
): Promise<string> => {
  const sig: string = await provider.connection.requestAirdrop(target, lamps);
  await provider.connection.confirmTransaction(sig);
  return sig;
};

export const safeAirdropSol = async (
  provider: Provider,
  target: web3.PublicKey,
  lamps: number
): Promise<void> => {
  while ((await getSolBalance(target, provider)) < lamps) {
    try {
      // Request Airdrop for user
      await airdropSol(provider, target, lamps);
    } catch (e) {
      console.log(e);
    }
  }
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Returns the same value as Token.getAssociatedTokenAddress()
 * but this function does this synchronously
 * and also returns a bump if needed
 *
 * @param authPubKey PublicKey
 * @param mintPubKey PublicKey
 * @returns [PublicKey, number]
 */
export const getAssocTokenAcct = (
  authPubKey: PublicKey,
  mintPubKey: PublicKey
): [PublicKey, number] => {
  const seeds: Buffer[] = [
    authPubKey.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mintPubKey.toBuffer(),
  ];
  const programId: PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID;
  return utils.publicKey.findProgramAddressSync(seeds, programId);
};

export const getAcctInfo = async (
  provider: Provider,
  acctPubKey: PublicKey
): Promise<web3.AccountInfo<Buffer>> => {
  const accountInfo: web3.AccountInfo<Buffer> =
    await provider.connection.getAccountInfo(acctPubKey);
  return accountInfo;
};

export const getAcctBalance = async (
  acctPubKey: PublicKey,
  provider: Provider = getProvider()
): Promise<TokenAmount> => {
  return (await provider.connection.getTokenAccountBalance(acctPubKey)).value;
};

/**
 * Wrapper that reduces line length since
 * utils.publicKey.findProgramAddressSync usually causes a line wrap
 * @param seeds
 * @param programId
 * @returns
 */
export const getPda = (seeds: Buffer[], programId: PublicKey) => {
  return utils.publicKey.findProgramAddressSync(seeds, programId);
};

export const derivePdaAsync = async (
  seeds: Buffer[],
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  const [pubKey, bump] = await PublicKey.findProgramAddress(seeds, programId);
  return [pubKey, bump];
};

export const getSolBalance = async (
  pubKey: PublicKey,
  provider: Provider = getProvider()
) => {
  return await provider.connection.getBalance(pubKey);
};

export const createAtaOnChainByKey = async (
  userWallet: Wallet,
  ataKey: PublicKey,
  mintPubKey: PublicKey,
  auth?: PublicKey,
  userConnection: Connection = null
) => {
  // check if the mint exists
  if (!(await userConnection.getAccountInfo(mintPubKey)))
    throw new Error("Mint account does not exist");

  const txn = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      userWallet.publicKey, // payer: web3.PublicKey,
      ataKey, // associatedToken: web3.PublicKey,
      auth || userWallet.publicKey, // owner: web3.PublicKey,
      mintPubKey // mint: web3.PublicKey,
    )
  );
  if (userConnection) {
    await handleTxn(txn, userConnection, userWallet);
  } else {
    throw new Error("no connection provided");
  }
};
/**
 * inputNumber * 10 ** NUM_DECIMALS
 * @param inputNumber - number
 * @param numDecimals - number < 100
 * @returns
 */
export const addZeros = (inputNumber: number, numDecimals: number) => {
  if (numDecimals >= 100) throw new Error("Must be < 100 decimal places");
  return inputNumber * 10 ** numDecimals;
};

export const toUiAmount = (inputNumber: number, numDecimals: number) => {
  if (numDecimals >= 100) throw new Error("Must be < 100 decimal places");
  return inputNumber / (10 ** numDecimals);
};

export const getMaxTokenAccountKey = async (
  mint: PublicKey,
  connection: Connection,
  walletPubkey: PublicKey
) => {
  const parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletPubkey,
    {
      programId: TOKEN_PROGRAM_ID
    },
    'confirmed'
  )
  let result: any = null
  let maxAmount = 0;
  parsedTokenAccounts.value.forEach(async (tokenAccountInfo) => {
    const tokenAccountPubkey = tokenAccountInfo.pubkey
    const parsedInfo = tokenAccountInfo.account.data.parsed.info
    const mintAddress = parsedInfo.mint
    const amount = parsedInfo.tokenAmount.uiAmount
    if (mintAddress === mint.toBase58() && amount >= maxAmount) {
      result = tokenAccountPubkey
      maxAmount = amount
    }
  })
  return result
}
