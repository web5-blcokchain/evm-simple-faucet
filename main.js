// main.js

// ========== 配置与全局变量 ==========
// 请确保 config.js 已在 index.html 中引入
let currentNetwork = null;
let currentToken = null;
let captcha = { question: '', answer: '' };

// ========== 工具函数 ==========
function generateCaptcha() {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  captcha.question = `${a} + ${b} = ?`;
  captcha.answer = (a + b).toString();
  document.getElementById('captchaQuestion').textContent = captcha.question;
  document.getElementById('captchaInput').value = '';
}

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function setClaimBtnState() {
  const addr = document.getElementById('addressInput').value.trim();
  const captchaInput = document.getElementById('captchaInput').value.trim();
  const validAddr = isValidAddress(addr);
  const validCaptcha = captchaInput === captcha.answer;
  document.getElementById('claimBtn').disabled = !(validAddr && validCaptcha);
}

// ========== 余额查询 ==========
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

function onNetworkChange() {
  const idx = document.getElementById('networkSelect').value;
  currentNetwork = NETWORKS[idx];
  loadTokens();
}

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

function onTokenChange() {
  const idx = document.getElementById('tokenSelect').value;
  currentToken = currentNetwork.tokens[idx];
  updateBalances();
}

// ========== 事件绑定 ==========
document.addEventListener('DOMContentLoaded', () => {
  loadNetworks();
  generateCaptcha();
  setClaimBtnState();

  document.getElementById('networkSelect').addEventListener('change', () => {
    onNetworkChange();
  });
  document.getElementById('tokenSelect').addEventListener('change', () => {
    onTokenChange();
  });
  document.getElementById('addressInput').addEventListener('input', setClaimBtnState);
  document.getElementById('captchaInput').addEventListener('input', setClaimBtnState);
  document.getElementById('refreshCaptcha').addEventListener('click', () => {
    generateCaptcha();
    setClaimBtnState();
  });
  document.getElementById('faucetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultBox = document.getElementById('resultBox');
    resultBox.textContent = '';
    const addr = document.getElementById('addressInput').value.trim();
    if (!isValidAddress(addr)) {
      resultBox.innerHTML = '<span class="text-danger">钱包地址格式错误</span>';
      return;
    }
    // ====== 领取核心逻辑 ======
    // 1. 用内置私钥创建钱包
    const PRIVATE_KEY = '0xYourFaucetPrivateKey'; // TODO: 替换为你的私钥
    const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl);
    let wallet;
    try {
      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    } catch (e) {
      resultBox.innerHTML = '<span class="text-danger">水龙头钱包配置错误</span>';
      return;
    }
    // 2. 发起转账
    try {
      let tx;
      let amount = '0.01'; // 默认发放数量，可根据需求调整或配置
      if (currentToken.type === 'native') {
        tx = await wallet.sendTransaction({
          to: addr,
          value: ethers.parseUnits(amount, currentToken.decimals)
        });
      } else if (currentToken.type === 'erc20' && currentToken.contract) {
        const abi = ["function transfer(address,uint256) returns (bool)"];
        const contract = new ethers.Contract(currentToken.contract, abi, wallet);
        tx = await contract.transfer(addr, ethers.parseUnits(amount, currentToken.decimals));
      } else {
        resultBox.innerHTML = '<span class="text-danger">代币类型不支持</span>';
        return;
      }
      resultBox.innerHTML = `<span class="text-success">领取成功！</span><br>交易哈希：<a href="${currentNetwork.explorerUrl}${tx.hash}" target="_blank">${tx.hash}</a>`;
      await tx.wait();
      updateBalances();
      generateCaptcha();
      setClaimBtnState();
    } catch (err) {
      let msg = err && err.message ? err.message : String(err);
      resultBox.innerHTML = `<span class="text-danger">领取失败：${msg}</span>`;
    }
  });
}); 