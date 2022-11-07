//! Anchor-compatible SDK for the Raydium farm program.

#![deny(missing_docs)]
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![allow(clippy::nonstandard_macro_braces)]

mod accounts;
mod instructions;

pub use accounts::*;
pub use instructions::*;

use anchor_lang::prelude::*;

declare_id!("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z");

/// Farm Program
#[derive(Clone)]
pub struct Farm;

impl anchor_lang::Id for Farm {
    fn id() -> Pubkey {
        ID
    }
}
