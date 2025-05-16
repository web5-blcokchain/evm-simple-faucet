// config.js
// 支持的区块链网络和代币配置（测试数据）

// 全局可配置项
const FAUCET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // TODO: 替换为你的私钥
const CLAIM_LOADING_TEXT = '领取中...';
const SUCCESS_TEXT = '领取成功！';
const FAIL_TEXT = '领取失败：';
const INVALID_ADDRESS_TEXT = '钱包地址格式错误';
const WALLET_ERROR_TEXT = '水龙头钱包配置错误';
const UNSUPPORTED_TOKEN_TEXT = '代币类型不支持';

const NETWORKS = [
  {
    name: 'RWA-Test',
    chainId: 31337,
    rpcUrl: 'https://test-hardhat-node.usdable.com', // 免费公开RPC
    explorerUrl: 'https://goerli.etherscan.io/tx/',
    tokens: [
      {
        name: 'ETH',
        type: 'native',
        contract: '',
        decimals: 18,
        amount: '1'
      },
      {
        name: 'USDT',
        type: 'erc20',
        contract: '0xa51807d5a12E7e78148c66dC4851CD33EEd1FDfD', // Goerli USDT
        decimals: 18,
        amount: '10'
      }
    ]
  }
  // 可继续添加更多网络
]; 