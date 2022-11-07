## Link to Jira Ticket

https://ratiofinance.atlassian.net/browse/RFM-xyz

## Link(s) to PRs in separate repositories that are part of the SAME ticket

We have three versions of application 
test, prev, prod

- The branch name should be `test/mainnet`, `prev/mainnet`, `prod/mainnet`
- All PR should be made into `test/mainnet` for the development
- It should be the same as for the contract, backend & frontend

https://github.com/RatioFinance/Ratio-frontend/pull/abc
https://github.com/RatioFinance/rf-engine/pull/xyz

## Description

Provide a description of the changes (additions, updates, deletions) made to the codebase and how they apply to the ticket

### Steps to test
We test the contract for only localnet & mainnet, but not for devnnet

`You should build several unit-test for every instruction to be failed & passed`

1. To test on localnet, you should run anchor test 
- `anchor test` to build & test in your local

2. Build & write buffer to deploy the program to the mainnet
- You should set `rpc url` for mainnet
- `anchor run deploy-test` for test version
- `anchor run deploy-prev` for prev version
3. Deploy the contract for production
- `anchor run deploy-prod` to build & write-buffer into the mainnet
- `solana program set-buffer-authority <buffer_address> --new-buffer-authority HXCRCJVSpoNPG53ZkCsp6XGBf1Qn3LaxzVqnDepAANDM`
- Update the contract in goki wallet

### Risks and notes
- Append the contract instructions at the end of `lib.rs` file 

Describe apparent or potential risks, breaking changes, issues that could be the result of merging this code

### Checklist (you can prefill these checkboxes with 'x')

- [ ] Code includes the most recent changes to `mainnet_dev`. `git pull --rebase origin mainnet_dev` and fixed all merge conflicts
Commit hash for HEAD: ________
- [ ] All commits begin with ticket number, and include brief description of changes made: `RFM-000 add xyz function...`
- [ ] PR is named correctly
- [ ] Code is tested and working at each commit
- [ ] Jira ticket is moved to 'In Testing'/'In Review'
- [ ] PR is assigned to all developers that pushed/contributed to PR
- [ ] PR is assigned a reviewer
- [ ] PR is tagged properly
