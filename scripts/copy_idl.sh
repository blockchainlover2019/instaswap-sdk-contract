#!/bin/bash

#variables to store what the current version of required dependencies should be
ANCHOR_VERSION="anchor-cli 0.22.1"

#relative path to idl file in frontend directory
PATH_TO_IDL="ratio-frontend/src/utils/ratio-lending-idl.json"

#check if solana cli exists
current_solana_version=$(solana --version)
if [ "$current_solana_version" = "bash: solana: command not found" ]; then
    printf "Error: Solana CLI is not installed, please install Solana CLI before moving forward\n"
    exit 1
else
    printf "Solana CLI detected\n"
fi

#check if node exists
current_node_version=$(node --version)
if [ "$current_node_version" = "bash: node: command not found" ]; then
    printf "Error: Node is not installed, please install node before moving forward\n"
    exit 1
else
    printf "Node detected\n"
fi

#check if anchor version is correct
current_anchor_version=$(anchor --version)
if [ "$current_anchor_version" = "$ANCHOR_VERSION" ]; then
    echo "Correct Anchor version detected"
else
    printf "Error: Current anchor version: ${output}\n"
    printf "Change anchor version to: ${ANCHOR_VERSION}\n"
    exit 1
fi

#make sure frontend repo exist in parent directory
if [ -d "../../ratio-frontend" ] 
then
    printf "Frontend repo detected \n" 
else
    printf "Error: Cannot find frontend directory, please make sure you are running this script from within the scripts directory, and ratio-frontend is located in the same parent directory as ratio-contracts\n"
    exit 1
fi

#move into outerdirectory, /ratio-contracts
cd ..

#make sure the local contract repo code is up to date with the most recent commit on main
#this outputs to console incase there are any issues such as changes that need to be stashed/ commited
printf "Pulling most recent commit in main branch from ratio-contracts repo \n" 
git fetch
git checkout main
git pull

#build the contracts to create the target directory containing the idl
#this outputs to console incase there are any issues in the build
printf "Building smart contracts \n" 
anchor build

#copy the stable pool idl into the frontend code
cp target/idl/stable_pool.json ../${PATH_TO_IDL}

printf "\nIDL Successfully updated in: ${PATH_TO_IDL}\n"
 