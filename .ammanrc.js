// to run this amman, install amman cli with below command
// npm i -g @metaplex-foundation/amman
module.exports = {
  validator: {
    killRunningValidators: true,
    programs: [],
    accountsCluster: 'https://solana-api.projectserum.com',
    accounts: [
        // programs
        {
            label: 'quarry mine',
            accountId:'QMNeHCGYnLVDn1icRAfQZpjPLBNkfGbSKRB83G5d8KB',
            executable: true,
        },{
            label: 'quarry mine wrapper',
            accountId:'QMWoBmAyJLAsA1Lh9ugMTw2gciTihncciphzdNzdZYV',
            executable: true,
        },{
            label: 'Ratio Lending',
            accountId:'RFLeGTwFXiXXETdJkZuu9iKgXNkYbywLpTu1TioDsDQ',
            executable: true,
        },
        // individual token mints
        {
            label: 'USDC mainnet token mint',
            accountId:'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },{
            label: 'USDT mainnet token mint',
            accountId:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        },{
            label: 'USDH mainnet token mint',
            accountId:'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX',
        },{
            label: 'cUSDC mainnet token mint',
            accountId:'993dVFL2uXWYeoXuEBFXR4BijeXdTv4s6BzsCjJZuwqk',
        },{
            label: 'cUSDT mainnet token mint',
            accountId:'BTsbZDV7aCMRJ3VNy9ygV4Q2UeEo9GpR8D6VvmMZzNr8',
        },{
            label: 'UXD mainnet token mint',
            accountId:'7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
        },{
            label: 'SBR mainnet token mint',
            accountId:'iouQcQBAiEXe6cKLS85zmZxUqaCqBdeHFpqKoSz615u',
        },{
            label: 'RATIO mainnet token mint',
            accountId:'ratioMVg27rSZbSvBopUvsdrGUzeALUfFma61mpxc8J',
        },{
            label: 'USDr mainnet token mint',
            accountId:'USDrbBQwQbQ2oWHUPfA8QBHcyVxKUq1xHyXsSLKdUq2',
        },
        
        // saber lp token mints
        {
            label: 'Saber USDC-USDT LP mainnet token mint',
            accountId:'2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf',
        },{
            label: 'Saber USDH-USDC LP mainnet token mint',
            accountId:'HUBBGekfLpdZhZcqjLeecLVz39o1ysDkicZpgMgZgPFS',
        },{
            label: 'Saber cUSDT-cUSDC LP mainnet token mint',
            accountId:'SUSeGZEV69Xy7rQfhDffyTysHgEP3nJUDMxEZJSvJr1',
        },{
            label: 'Saber UXD-USDC LP mainnet token mint',
            accountId:'UXDgmqLd1roNYkC4TmJzok61qcM9oKs5foDADiFoCiJ',
        },
        
        // Ratio Global State
        {
            label: 'Ratio Global State',
            accountId:'G4Ssyc3WngzCnHbeeNhtdbEhZ7R7uXHMATuY9Uay2ycX'
        },

        // token accs of each lp pool
        {
            label: 'USDC-USDT Reserve A',
            accountId:'CfWX7o2TswwbxusJ4hCaPobu2jLCb1hfXuXJQjVq3jQF'
        },{
            label: 'USDC-USDT Reserve B',
            accountId:'EnTrdMMpdhugeH6Ban6gYZWXughWxKtVGfCwFn78ZmY3'
        },{
            label: 'USDH-USDC Reserve A',
            accountId:'6YjT74rmcfCpw8LSjPNx5JTmZoYLGrTKnf9arfSgZ4SR'
        },{
            label: 'USDH-USDC Reserve B',
            accountId:'F8GSmi3vA8M8TsybLya1LQ4n1aFHCRbZ6k437PeTdXtg'
        },{
            label: 'cUSDT-cUSDC Reserve A',
            accountId:'4XqU6QN4QJKva4fF4eyCnPtJG99pKecuUuCPDax5BEqU'
        },{
            label: 'cUSDT-cUSDC Reserve B',
            accountId:'F7k8DuuawVEZ3new4A9ahWVojCkEG8BrLsCwyhRvmEHa'
        },{
            label: 'UXD-USDC Reserve A',
            accountId:'9zj4aX38Uxf3h6AUjS4EipWS8mwbEofasHAf3a1uKGds'
        },{
            label: 'UXD-USDC Reserve B',
            accountId:'CwQDG1MWunn9cLNwcZLd8YBacweSR7ARo32w4mLua1Yr'
        },

        // ratio pools
        {
            label: 'USDT-USDC Pool',
            accountId:'uQV9J7m2xHXmfht3GpHKNdWhhoc3XnCg4KxhCjxFY5P'
        },
        {
            label: 'USDH-USDC Pool',
            accountId:'GZLthHzBhLWp1Gux7nRwfHNrZqbT3RSW2xYAFW77TkQp'
        },
        {
            label: 'cUSDT-cUSDC Pool',
            accountId:'3pzAfQQSRrR9bWrxen8Gq6rj5bjfG7PkrKWAYE6j28sq'
        },
        {
            label: 'UXD-USDC Pool',
            accountId:'A1c1K6JXYeGbAiKqpkUeJNfwiQ9vUtQ1iid1oDJEFf9g'
        },

        // oracles
        {
            label: 'USDC Oracle',
            accountId:'HchZtTTqfjDXmWCktCwAFf9L2v4xexcuH1J5bWERDGQY'
        },{
            label: 'USDT Oracle',
            accountId:'3yxzDiuYX1x41oPhmmpnuux6ibro2XJGpiHAXpwicjdq'
        },{
            label: 'USDH Oracle',
            accountId:'FxVduz9GVWNBkk68nvFtDHSucBAwfvu8kbZnKEZseKpa'
        },{
            label: 'cUSDC Oracle',
            accountId:'9waiGJyRz4xMAUn1kNBJD1Q54eJdy9rhLgXjDFJDjoVt'
        },{
            label: 'cUSDT Oracle',
            accountId:'FbnbDGjebixkV9KmcwZMWrbScyNaiv1ox3GpDipfwbZq'
        },{
            label: 'UXD Oracle',
            accountId:'9va9NkNhJjL1kHCRmxxWDHWiNYEWuaFnd7BHGgx7XCnY'
        },

        // query keys
        {
            label: 'Saber USDH-USDC query',
            accountId:'H6TWopq51MkjYqtCy8xTRJrzm88esDWoNVpL87Akybwn '
        },{
            label: 'Saber cUSDT-cUSDC query',
            accountId:'ByuGnzyRgj73HKmQnLLC61Qgn6EtteeQ7qx9TPHwDYzN '
        },{
            label: 'Saber USDC-USDT query',
            accountId:'Hs1X5YtXwZACueUtS9azZyXFDWVxAMLvm3tttubpK7ph '
        },{
            label: 'Saber UXD-USDC query',
            accountId:'BMMiE1bNCW61k3rw4Kfzx7er36JMrEsFGr1Bcng9i6Aq '
        },
    ],
    jsonRpcUrl: 'http://127.0.0.1:8899',
    websocketUrl: '',
    commitment: 'confirmed',
    ledgerDir: '.amman-ledger',
    resetLedger: true,
    verifyFees: false,
    detached: process.env.CI != null,
  },
  relay: {
    enabled: process.env.CI == null,
    killlRunningRelay: true,
  },
  storage: {
    enabled: process.env.CI == null,
    storageId: 'mock-storage',
    clearOnStart: true,
  },
}