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
  // 输入框高亮
  document.getElementById('addressInput').classList.toggle('is-invalid', addr && !validAddr);
  document.getElementById('captchaInput').classList.toggle('is-invalid', captchaInput && !validCaptcha);
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
    resultBox.innerHTML = '';
    const addr = document.getElementById('addressInput').value.trim();
    // 禁用表单，按钮loading
    setFormEnabled(false);
    document.getElementById('claimBtn').innerHTML = '领取中...';
    // 校验
    if (!isValidAddress(addr)) {
      resultBox.innerHTML = '<span class="text-danger">钱包地址格式错误</span>';
      setFormEnabled(true);
      document.getElementById('claimBtn').innerHTML = `领取${currentToken.amount} ${currentToken.name}`;
      return;
    }
    // ====== 领取核心逻辑 ======
    const PRIVATE_KEY = '0xYourFaucetPrivateKey'; // TODO: 替换为你的私钥
    const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl);
    let wallet;
    try {
      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    } catch (e) {
      resultBox.innerHTML = '<span class="text-danger">水龙头钱包配置错误</span>';
      setFormEnabled(true);
      document.getElementById('claimBtn').innerHTML = `领取${currentToken.amount} ${currentToken.name}`;
      return;
    }
    try {
      let tx;
      let amount = currentToken.amount;
      resultBox.innerHTML = `<span class='text-info'>正在发放 ${amount} ${currentToken.name}，请稍候...</span>`;
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
        setFormEnabled(true);
        document.getElementById('claimBtn').innerHTML = `领取${currentToken.amount} ${currentToken.name}`;
        return;
      }
      resultBox.innerHTML = `<span class="text-success">领取成功！</span><br>发放数量：${amount} ${currentToken.name}<br>交易哈希：<a href="${currentNetwork.explorerUrl}${tx.hash}" target="_blank">${tx.hash}</a>`;
      await tx.wait();
      updateBalances();
      generateCaptcha();
      setClaimBtnState();
    } catch (err) {
      let msg = err && err.message ? err.message : String(err);
      resultBox.innerHTML = `<span class="text-danger">领取失败：${msg}</span>`;
    }
    setFormEnabled(true);
    document.getElementById('claimBtn').innerHTML = `领取${currentToken.amount} ${currentToken.name}`;
  });
  // 按钮文案联动
  document.getElementById('tokenSelect').addEventListener('change', () => {
    document.getElementById('claimBtn').innerHTML = `领取${currentNetwork.tokens[document.getElementById('tokenSelect').value].amount} ${currentNetwork.tokens[document.getElementById('tokenSelect').value].name}`;
  });
});

// 启用/禁用表单
function setFormEnabled(enabled) {
  document.getElementById('networkSelect').disabled = !enabled;
  document.getElementById('tokenSelect').disabled = !enabled;
  document.getElementById('addressInput').disabled = !enabled;
  document.getElementById('captchaInput').disabled = !enabled;
  document.getElementById('refreshCaptcha').disabled = !enabled;
  document.getElementById('claimBtn').disabled = !enabled || document.getElementById('claimBtn').disabled;
} 