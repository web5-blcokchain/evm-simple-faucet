// navbar.js

function renderNavbar(active) {
  const nav = `
  <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">EVM Faucet</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link${active==='home' ? ' active' : ''}" id="nav-home" href="#">主页</a>
          </li>
          <li class="nav-item">
            <a class="nav-link${active==='balance' ? ' active' : ''}" id="nav-balance" href="#">余额查询</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" id="nav-addtoken" href="#">添加代币到小狐狸</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" id="nav-help" href="#">帮助文档</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  `;
  document.getElementById('navbar-placeholder').innerHTML = nav;
}

function showPage(page) {
  document.getElementById('page-home').style.display = page === 'home' ? '' : 'none';
  document.getElementById('page-balance').style.display = page === 'balance' ? '' : 'none';
  renderNavbar(page);
  bindNavEvents();
}

function bindNavEvents() {
  document.getElementById('nav-home').onclick = (e) => { e.preventDefault(); showPage('home'); };
  document.getElementById('nav-balance').onclick = (e) => { e.preventDefault(); showPage('balance'); };
  // 其它菜单项可后续扩展
}

document.addEventListener('DOMContentLoaded', () => {
  showPage('home');
}); 