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
  document.getElementById('faucetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // 领取逻辑后续实现
    document.getElementById('resultBox').textContent = '领取功能开发中...';
  });
}); 