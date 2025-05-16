// config.js
// 支持的区块链网络和代币配置

const NETWORKS = [
  {
    name: 'Goerli',
    chainId: 5,
    rpcUrl: 'https://goerli.infura.io/v3/your-infura-key',
    explorerUrl: 'https://goerli.etherscan.io/tx/',
    faucetAddress: '0xYourFaucetWalletAddress',
    tokens: [
      {
        name: 'ETH',
        type: 'native',
        contract: '',
        decimals: 18
      },
      {
        name: 'USDT',
        type: 'erc20',
        contract: '0xYourGoerliUSDTAddress',
        decimals: 6
      }
    ]
  },
  {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/your-infura-key',
    explorerUrl: 'https://sepolia.etherscan.io/tx/',
    faucetAddress: '0xYourFaucetWalletAddress',
    tokens: [
      {
        name: 'ETH',
        type: 'native',
        contract: '',
        decimals: 18
      }
    ]
  }
  // 可继续添加更多网络
]; 