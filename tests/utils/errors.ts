import { ProgramError } from "@project-serum/anchor";
// import the custom errors we created
import { IDL } from "../../target/types/ratio_sdk";

export const errors = [
  { code: 0, byte: 0x0, name: "AlreadyInUse", msg: "Already in use" },
  {
    code: 2000,
    byte: 0x7d0,
    name: "ConstraintMut",
    msg: "A mut constraint was violated",
  },
  {
    code: 2001,
    byte: 0x7d1,
    name: "ConstraintHasOne",
    msg: "A has_one constraint was violated",
  },
  {
    code: 2002,
    byte: 0x7d2,
    name: "ConstraintSigner",
    msg: "A signer constraint was violated",
  },
  {
    code: 2003,
    byte: 0x7d3,
    name: "ConstraintRaw",
    msg: "A raw constraint was violated",
  },
  {
    code: 2004,
    byte: 0x7d4,
    name: "ConstraintOwner",
    msg: "An owner constraint was violated",
  },
  {
    code: 2005,
    byte: 0x7d5,
    name: "ConstraintRentExempt",
    msg: "A rent exempt constraint was violated",
  },
  {
    code: 2006,
    byte: 0x7d6,
    name: "ConstraintSeeds",
    msg: "A seeds constraint was violated",
  },
  {
    code: 2007,
    byte: 0x7d7,
    name: "ConstraintExecutable",
    msg: "An executable constraint was violated",
  },
  {
    code: 2008,
    byte: 0x7d8,
    name: "ConstraintState",
    msg: "A state constraint was violated",
  },
  {
    code: 2009,
    byte: 0x7d9,
    name: "ConstraintAssociated",
    msg: "An associated constraint was violated",
  },
  {
    code: 2010,
    byte: 0x7da,
    name: "ConstraintAssociatedInit",
    msg: "An associated init constraint was violated",
  },
  {
    code: 2011,
    byte: 0x7db,
    name: "ConstraintClose",
    msg: "A close constraint was violated",
  },
  {
    code: 2012,
    byte: 0x7dc,
    name: "ConstraintAddress",
    msg: "An address constraint was violated",
  },
  {
    code: 2013,
    byte: 0x7dd,
    name: "ConstraintZero",
    msg: "Expected zero account discriminant",
  },
  {
    code: 2014,
    byte: 0x7de,
    name: "ConstraintTokenMint",
    msg: "A token mint constraint was violated",
  },
  {
    code: 2015,
    byte: 0x7df,
    name: "ConstraintTokenOwner",
    msg: "A token owner constraint was violated",
  },
  {
    code: 2016,
    byte: 0x7e0,
    name: "ConstraintMintMintAuthority",
    msg: "A mint mint authority constraint was violated",
  },
  {
    code: 2017,
    byte: 0x7e1,
    name: "ConstraintMintFreezeAuthority",
    msg: "A mint freeze authority constraint was violated",
  },
  {
    code: 2018,
    byte: 0x7e2,
    name: "ConstraintMintDecimals",
    msg: "A mint decimals constraint was violated",
  },
  {
    code: 2019,
    byte: 0x7e3,
    name: "ConstraintSpace",
    msg: "A space constraint was violated",
  },

  // Account errors
  {
    code: 3000,
    byte: 0xbb8,
    name: "AccountDiscriminatorAlreadySet",
    msg: "The account discriminator was already set on this account",
  },
  {
    code: 3001,
    byte: 0xbb9,
    name: "AccountDiscriminatorNotFound",
    msg: "No 8 byte discriminator was found on the account",
  },
  {
    code: 3002,
    byte: 0xbba,
    name: "AccountDiscriminatorMismatch",
    msg: "8 byte discriminator did not match what was expected",
  },
  {
    code: 3003,
    byte: 0xbbb,
    name: "AccountDidNotDeserialize",
    msg: "Failed to deserialize the account",
  },
  {
    code: 3004,
    byte: 0xbbc,
    name: "AccountDidNotSerialize",
    msg: "Failed to serialize the account",
  },
  {
    code: 3005,
    byte: 0xbbd,
    name: "AccountNotEnoughKeys",
    msg: "Not enough account keys given to the instruction",
  },
  {
    code: 3006,
    byte: 0xbbe,
    name: "AccountNotMutable",
    msg: "The given account is not mutable",
  },
  {
    code: 3007,
    byte: 0xbbf,
    name: "AccountOwnedByWrongProgram",
    msg: "The given account is owned by a different program than expected",
  },
  {
    code: 3008,
    byte: 0xbc0,
    name: "InvalidProgramId",
    msg: "Program ID was not as expected",
  },
  {
    code: 3009,
    byte: 0xbc1,
    name: "InvalidProgramExecutable",
    msg: "Program account is not executable",
  },
  {
    code: 3010,
    byte: 0xbc2,
    name: "AccountNotSigner",
    msg: "The given account did not sign",
  },
  {
    code: 3011,
    byte: 0xbc3,
    name: "AccountNotSystemOwned",
    msg: "The given account is not owned by the system program",
  },
  {
    code: 3012,
    byte: 0xbc4,
    name: "AccountNotInitialized",
    msg: "The program expected this account to be already initialized",
  },
  {
    code: 3013,
    byte: 0xbc5,
    name: "AccountNotProgramData",
    msg: "The given account is not a program data account",
  },
  {
    code: 3014,
    byte: 0xbc6,
    name: "AccountNotAssociatedTokenAccount",
    msg: "The given account is not the associated token account",
  },
  {
    code: 1100,
    byte: 0x44C,
    name: "KeyMismatch",
    msg: "Keys do not match..",
  },
  ...IDL.errors.map((item) => {
    return { ...item, byte: item.code };
  }),
];

export const translateError = (error) => {
  const idlErrors = new Map(errors.map((e) => [e.code, `${e.name}: ${e.msg}`]));

  // throw the translated error
  // console.log("the error", error);
  // console.log("the translated error ", ProgramError.parse(error, idlErrors));
  throw ProgramError.parse(error, idlErrors);
};
