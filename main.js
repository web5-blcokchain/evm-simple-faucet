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
  } catch (e) { console.error('查询Native余额出错:', e); }
  document.getElementById('nativeBalance').textContent = 'Native余额：' + nativeBal;
  // 代币余额
  let tokenBal = '--';
  if (currentToken.type === 'erc20' && currentToken.contract) {
    try {
      const abi = ["function balanceOf(address) view returns (uint256)"];
      const contract = new ethers.Contract(currentToken.contract, abi, provider);
      const bal = await contract.balanceOf(faucetAddr);
      tokenBal = ethers.formatUnits(bal, currentToken.decimals) + ' ' + currentToken.name;
    } catch (e) { console.error('查询ERC20余额出错:', e, currentToken); }
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
  console.log('切换代币:', currentToken);
  updateBalances();
  // 非native token提示
  const tip = document.getElementById('nonNativeTokenTip');
  if (tip) {
    if (currentToken.type !== 'native') {
      tip.classList.remove('d-none');
    } else {
      tip.classList.add('d-none');
    }
  }
}

// ========== 余额查询页面功能 ==========
function loadBalanceNetworks() {
  const netSel = document.getElementById('balanceNetworkSelect');
  netSel.innerHTML = '';
  NETWORKS.forEach((net, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = net.name;
    netSel.appendChild(opt);
  });
  netSel.selectedIndex = 0;
}

async function queryAllTokenBalances() {
  const netIdx = document.getElementById('balanceNetworkSelect').value;
  const network = NETWORKS[netIdx];
  const address = document.getElementById('balanceAddressInput').value.trim();
  const resultBox = document.getElementById('balanceResultBox');
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    resultBox.innerHTML = '<span class="text-danger">钱包地址格式错误</span>';
    return;
  }
  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  let html = `<div><b>地址：</b>${address}</div><ul class="list-group mt-2">`;
  for (const token of network.tokens) {
    let bal = '--';
    try {
      if (token.type === 'native') {
        const b = await provider.getBalance(address);
        bal = ethers.formatUnits(b, token.decimals) + ' ' + token.name;
      } else if (token.type === 'erc20' && token.contract) {
        const abi = ["function balanceOf(address) view returns (uint256)"];
        const contract = new ethers.Contract(token.contract, abi, provider);
        const b = await contract.balanceOf(address);
        bal = ethers.formatUnits(b, token.decimals) + ' ' + token.name;
      }
    } catch (e) {
      bal = '查询失败';
      console.error('余额查询失败', token, e);
    }
    html += `<li class="list-group-item d-flex justify-content-between align-items-center">${token.name}<span>${bal}</span></li>`;
  }
  html += '</ul>';
  resultBox.innerHTML = html;
}

// ========== 添加代币到小狐狸页面功能 ==========
function loadAddTokenNetworks() {
  const netSel = document.getElementById('addTokenNetworkSelect');
  netSel.innerHTML = '';
  NETWORKS.forEach((net, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = net.name;
    netSel.appendChild(opt);
  });
  netSel.selectedIndex = 0;
}

function renderAddNetworkStepsByIdx(idx) {
  const net = NETWORKS[idx];
  const container = document.getElementById('add-network-steps');
  let html = `<div class="mb-3 p-2 border rounded">
    <b>网络名称：</b> <span class="copy-text">${net.name}</span> <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyText('${net.name}')">复制</button><br>
    <b>RPC URL：</b> <span class="copy-text">${net.rpcUrl}</span> <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyText('${net.rpcUrl}')">复制</button><br>
    <b>Chain ID：</b> <span class="copy-text">${net.chainId}</span> <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyText('${net.chainId}')">复制</button><br>
    <b>区块浏览器：</b> <span class="copy-text">${net.explorerUrl}</span> <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyText('${net.explorerUrl}')">复制</button>
  </div>`;
  container.innerHTML = html + `<div class="text-muted small">在小狐狸钱包"设置-网络-添加网络"中填写以上参数。</div>`;
}

function renderAddTokenStepsByIdx(idx) {
  const net = NETWORKS[idx];
  const container = document.getElementById('add-token-steps');
  let html = '';
  net.tokens.forEach(token => {
    if (token.type === 'erc20' && token.contract) {
      html += `<div class="mb-3 p-2 border rounded">
        <b>代币名称：</b> <span class="copy-text">${token.name}</span> <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyText('${token.name}')">复制</button><br>
        <b>合约地址：</b> <span class="copy-text">${token.contract}</span> <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyText('${token.contract}')">复制</button><br>
        <b>精度(Decimals)：</b> <span class="copy-text">${token.decimals}</span> <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyText('${token.decimals}')">复制</button>
      </div>`;
    }
  });
  container.innerHTML = html + `<div class="text-muted small">在小狐狸钱包"导入代币"中填写以上参数。</div>`;
}

window.copyText = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板！');
  });
};

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

  // 余额查询页面初始化
  loadBalanceNetworks();
  document.getElementById('queryBalanceBtn').onclick = (e) => {
    e.preventDefault();
    queryAllTokenBalances();
  };

  // 添加代币到小狐狸页面初始化
  loadAddTokenNetworks();
  renderAddNetworkStepsByIdx(0);
  renderAddTokenStepsByIdx(0);
  document.getElementById('addTokenNetworkSelect').addEventListener('change', function() {
    const idx = this.value;
    renderAddNetworkStepsByIdx(idx);
    renderAddTokenStepsByIdx(idx);
  });

  // 页面初始时也调用一次onTokenChange，确保提示正确
  onTokenChange();
}); 