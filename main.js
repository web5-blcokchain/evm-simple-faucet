// main.js

// ========== 配置与全局变量 ==========
// 请确保 config.js 已在 index.html 中引入
let currentNetwork = null; // 当前选中的网络对象
let currentToken = null;   // 当前选中的代币对象
let captcha = { question: '', answer: '' }; // 当前验证码

// ========== 工具函数 ==========

/**
 * 生成简单算术验证码，并刷新到页面
 */
function generateCaptcha() {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  captcha.question = `${a} + ${b} = ?`;
  captcha.answer = (a + b).toString();
  document.getElementById('captchaQuestion').textContent = captcha.question;
  document.getElementById('captchaInput').value = '';
}

/**
 * 校验EVM钱包地址格式
 * @param {string} addr 
 * @returns {boolean}
 */
function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/**
 * 根据输入内容动态设置领取按钮状态和输入框高亮
 */
function setClaimBtnState() {
  const addr = document.getElementById('addressInput').value.trim();
  const captchaInput = document.getElementById('captchaInput').value.trim();
  const validAddr = isValidAddress(addr);
  const validCaptcha = captchaInput === captcha.answer;
  document.getElementById('claimBtn').disabled = !(validAddr && validCaptcha);
  // 输入框高亮
  document.getElementById('addressInput').classList.toggle('is-invalid', addr && !validAddr);
  document.getElementById('captchaInput').classList.toggle('is-invalid', captchaInput && !validCaptcha);
}

/**
 * 启用/禁用表单所有输入控件
 * @param {boolean} enabled 
 */
function setFormEnabled(enabled) {
  document.getElementById('networkSelect').disabled = !enabled;
  document.getElementById('tokenSelect').disabled = !enabled;
  document.getElementById('addressInput').disabled = !enabled;
  document.getElementById('captchaInput').disabled = !enabled;
  document.getElementById('refreshCaptcha').disabled = !enabled;
  document.getElementById('claimBtn').disabled = !enabled || document.getElementById('claimBtn').disabled;
}

// ========== 余额查询 ==========

/**
 * 查询水龙头钱包的Native和所选代币余额，并刷新到页面
 */
async function updateBalances() {
  if (!currentNetwork || !currentToken) return;
  const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl);
  const faucetAddr = currentNetwork.faucetAddress;
  // Native余额
  let nativeBal = '--';
  try {
    const bal = await provider.getBalance(faucetAddr);
    nativeBal = ethers.formatEther(bal) + ' ' + currentNetwork.tokens[0].name;
  } catch (e) {}
  document.getElementById('nativeBalance').textContent = 'Native余额：' + nativeBal;
  // 代币余额
  let tokenBal = '--';
  if (currentToken.type === 'erc20' && currentToken.contract) {
    try {
      const abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
      const contract = new ethers.Contract(currentToken.contract, abi, provider);
      const bal = await contract.balanceOf(faucetAddr);
      tokenBal = ethers.formatUnits(bal, currentToken.decimals) + ' ' + currentToken.name;
    } catch (e) {}
  } else if (currentToken.type === 'native') {
    tokenBal = nativeBal;
  }
  document.getElementById('tokenBalance').textContent = '代币余额：' + tokenBal;
}

// ========== 下拉框与联动 ==========

/**
 * 加载所有支持的网络到下拉框
 */
function loadNetworks() {
  const netSel = document.getElementById('networkSelect');
  netSel.innerHTML = '';
  NETWORKS.forEach((net, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = net.name;
    netSel.appendChild(opt);
  });
  netSel.selectedIndex = 0;
  onNetworkChange();
}

/**
 * 网络切换时，加载对应代币
 */
function onNetworkChange() {
  const idx = document.getElementById('networkSelect').value;
  currentNetwork = NETWORKS[idx];
  loadTokens();
}

/**
 * 加载当前网络下所有支持的代币到下拉框
 */
function loadTokens() {
  const tokenSel = document.getElementById('tokenSelect');
  tokenSel.innerHTML = '';
  currentNetwork.tokens.forEach((tok, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = tok.name;
    tokenSel.appendChild(opt);
  });
  tokenSel.selectedIndex = 0;
  onTokenChange();
}

/**
 * 代币切换时，刷新余额
 */
function onTokenChange() {
  const idx = document.getElementById('tokenSelect').value;
  currentToken = currentNetwork.tokens[idx];
  updateBalances();
}

// ========== 事件绑定与主流程 ==========
document.addEventListener('DOMContentLoaded', () => {
  // 用私钥推导faucetAddress，赋值给每个network
  const wallet = new ethers.Wallet(FAUCET_PRIVATE_KEY);
  NETWORKS.forEach(net => { net.faucetAddress = wallet.address; });

  // 初始化下拉框、验证码、按钮状态
  loadNetworks();
  generateCaptcha();
  setClaimBtnState();

  // 下拉框、输入框、验证码等交互事件
  document.getElementById('networkSelect').addEventListener('change', () => {
    onNetworkChange();
  });
  document.getElementById('tokenSelect').addEventListener('change', () => {
    onTokenChange();
    // 按钮文案联动
    document.getElementById('claimBtn').innerHTML = `领取${currentNetwork.tokens[document.getElementById('tokenSelect').value].amount} ${currentNetwork.tokens[document.getElementById('tokenSelect').value].name}`;
  });
  document.getElementById('addressInput').addEventListener('input', setClaimBtnState);
  document.getElementById('captchaInput').addEventListener('input', setClaimBtnState);
  document.getElementById('refreshCaptcha').addEventListener('click', () => {
    generateCaptcha();
    setClaimBtnState();
  });

  // 领取表单提交事件
  document.getElementById('faucetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultBox = document.getElementById('resultBox');
    resultBox.innerHTML = '';
    const addr = document.getElementById('addressInput').value.trim();
    // 禁用表单，按钮loading
    setFormEnabled(false);
    document.getElementById('claimBtn').innerHTML = '领取中...';
    // 校验
    if (!isValidAddress(addr)) {
      resultBox.innerHTML = `<span class="text-danger">${INVALID_ADDRESS_TEXT}</span>`;
      setFormEnabled(true);
      document.getElementById('claimBtn').innerHTML = `领取${currentToken.amount} ${currentToken.name}`;
      return;
    }
    // ====== 领取核心逻辑 ======
    const PRIVATE_KEY = FAUCET_PRIVATE_KEY; // 从config.js读取
    const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl);
    let wallet;
    try {
      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    } catch (e) {
      resultBox.innerHTML = `<span class="text-danger">${WALLET_ERROR_TEXT}</span>`;
      setFormEnabled(true);
      document.getElementById('claimBtn').innerHTML = `领取${currentToken.amount} ${currentToken.name}`;
      return;
    }
    try {
      let tx;
      let amount = currentToken.amount;
      resultBox.innerHTML = `<span class='text-info'>${CLAIM_LOADING_TEXT} 发放 ${amount} ${currentToken.name}，请稍候...</span>`;
      if (currentToken.type === 'native') {
        // Native Token 转账
        tx = await wallet.sendTransaction({
          to: addr,
          value: ethers.parseUnits(amount, currentToken.decimals)
        });
      } else if (currentToken.type === 'erc20' && currentToken.contract) {
        // ERC20 Token 转账
        const abi = ["function transfer(address,uint256) returns (bool)"];
        const contract = new ethers.Contract(currentToken.contract, abi, wallet);
        tx = await contract.transfer(addr, ethers.parseUnits(amount, currentToken.decimals));
      } else {
        resultBox.innerHTML = `<span class="text-danger">${UNSUPPORTED_TOKEN_TEXT}</span>`;
        setFormEnabled(true);
        document.getElementById('claimBtn').innerHTML = `领取${currentToken.amount} ${currentToken.name}`;
        return;
      }
      // 展示领取结果和交易哈希
      resultBox.innerHTML = `<span class="text-success">${SUCCESS_TEXT}</span><br>发放数量：${amount} ${currentToken.name}<br>交易哈希：<a href="${currentNetwork.explorerUrl}${tx.hash}" target="_blank">${tx.hash}</a>`;
      await tx.wait();
      updateBalances();
      generateCaptcha();
      setClaimBtnState();
    } catch (err) {
      let msg = err && err.message ? err.message : String(err);
      resultBox.innerHTML = `<span class="text-danger">${FAIL_TEXT}${msg}</span>`;
    }
    setFormEnabled(true);
    document.getElementById('claimBtn').innerHTML = `领取${currentToken.amount} ${currentToken.name}`;
  });
}); 