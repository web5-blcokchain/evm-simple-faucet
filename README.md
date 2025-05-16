# EVM Faucet 水龙头项目

## 项目简介

本项目是一个支持多链多币种的 EVM 测试币水龙头，前端纯静态实现，支持多条 EVM 兼容测试链和多种测试代币的领取、余额查询、钱包添加网络与代币等功能。适合开发者和测试用户便捷获取测试币。

---

## 快速开始

1. **克隆代码**
   ```bash
   git clone <your-repo-url>
   cd evm-faucet
   ```
2. **安装依赖**
   本项目为纯前端静态项目，无需安装依赖。只需本地有 Node.js 环境用于 Live Server 或直接用 VSCode Live Server 插件打开 `index.html` 即可。

3. **运行项目**
   - 推荐用 VSCode 的 Live Server 插件或 `python3 -m http.server` 启动本地静态服务。
   - 直接用浏览器打开 `index.html` 也可，但部分浏览器安全策略下本地文件跨域可能导致部分功能异常。

---

## 目录结构

```
├── index.html           # 主页面
├── main.js              # 主功能脚本
├── config.js            # 配置文件（重点）
├── navbar.js            # 公用导航栏组件
├── libs/                # 第三方依赖（ethers.js、bootstrap等）
├── README.md            # 项目说明
├── 项目介绍.md          # 详细项目背景与需求
├── 开发计划.md          # 开发计划与进度
```

---

## 配置参数说明（重点）

所有可配置参数均在 `config.js` 文件中集中管理。**开发者务必根据实际需求修改本文件！**

### 1. 全局参数
- `FAUCET_PRIVATE_KEY`：水龙头钱包私钥（仅用于测试网，严禁主网！）
- 其他全局提示语、按钮文案等

### 2. 网络与代币配置
- `NETWORKS` 数组，每个对象代表一条链：
  - `name`：网络名称（如 Goerli、Sepolia、RWA-Test）
  - `chainId`：链ID
  - `rpcUrl`：该链的 RPC 节点地址
  - `explorerUrl`：区块链浏览器地址模板
  - `tokens`：代币数组，每个代币对象：
    - `name`：代币名称（如 ETH、USDT）
    - `type`：'native' 或 'erc20'
    - `contract`：ERC20 合约地址（native 留空）
    - `decimals`：代币精度
    - `amount`：每次领取数量

#### 示例：
```js
const NETWORKS = [
  {
    name: 'RWA-Test',
    chainId: 31337,
    rpcUrl: 'https://test-hardhat-node.usdable.com',
    explorerUrl: 'https://goerli.etherscan.io/tx/',
    tokens: [
      { name: 'ETH', type: 'native', contract: '', decimals: 18, amount: '1' },
      { name: 'USDT', type: 'erc20', contract: '0x...', decimals: 6, amount: '10' }
    ]
  }
];
```

### 3. 配置步骤
1. 申请/准备测试网钱包私钥，填入 `FAUCET_PRIVATE_KEY`。
2. 配置支持的链和代币，按上述格式补充 `NETWORKS`。
3. 如需支持更多链或代币，直接在 `NETWORKS` 数组中添加即可。
4. 如需修改领取额度、提示语等，直接修改对应字段。

---

## 主要功能
- 多链多币种测试币领取（支持 Native 和 ERC20）
- 余额查询（支持所有配置代币）
- 一键生成小狐狸钱包添加网络/代币参数
- 算术验证码防刷、基础频率限制
- 响应式美观 UI，支持移动端
- 公用导航栏，页面间自由切换
- 帮助文档、FAQ、免责声明

---

## 常见问题
- 领取失败、余额异常、节点不可用等问题请优先检查 config.js 配置和网络环境。
- 如遇页面空白，请检查浏览器控制台报错，确认所有依赖已本地化并正确引用。
- 详细操作说明见"帮助文档"页面。

---

## 免责声明
本项目仅供测试学习，严禁用于主网或大额资产。因使用本项目造成的任何损失由用户自行承担。

---

## 联系方式
- 开发者邮箱：dev@example.com
- GitHub: https://github.com/your-repo 