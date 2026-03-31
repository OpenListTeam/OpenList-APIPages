/* ═══════════════════════════════════════════════════════════
   站点设置页面 - 我的文件路径设置
   ═══════════════════════════════════════════════════════════ */

function renderSettings(container) {
  const homePath = Storage.get('home_path', '/home/');
  const username = Storage.get('username', 'admin');
  const apiBase = Storage.get('api_base', '');

  container.innerHTML = `
    <div class="settings-page">
      <h2 style="font-size:22px;font-weight:700;margin-bottom:6px;">⚙️ 站点设置</h2>
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:28px;">
        配置个人文件路径和后端连接信息
      </p>

      <!-- 我的文件路径设置 -->
      <div class="settings-card">
        <h3>📂 我的文件路径</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
          设置个人文件的起始路径。例如设置为 <code>/home/</code>，当前用户名为 <code>admin</code>，
          则个人路径为 <code>/home/admin/</code>
        </p>
        <div class="settings-row">
          <label class="settings-label">起始路径</label>
          <input type="text" class="settings-input" id="setting-home-path" 
                 value="${escapeHtml(homePath)}" placeholder="/home/">
        </div>
        <div class="settings-hint">路径必须以 / 开头和结尾，例如 /home/ 或 /data/users/</div>
        
        <div class="settings-row" style="margin-top:16px;">
          <label class="settings-label">当前用户名</label>
          <input type="text" class="settings-input" id="setting-username" 
                 value="${escapeHtml(username)}" placeholder="admin">
        </div>
        <div class="settings-hint">
          完整个人路径：<strong id="personal-path-preview">${escapeHtml(homePath + username + '/')}</strong>
        </div>
      </div>

      <!-- 后端连接设置 -->
      <div class="settings-card">
        <h3>🔗 后端连接</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
          配置 OpenList 后端 API 地址。留空则使用当前域名。
        </p>
        <div class="settings-row">
          <label class="settings-label">API 地址</label>
          <input type="text" class="settings-input" id="setting-api-base" 
                 value="${escapeHtml(apiBase)}" placeholder="https://your-openlist-server.com">
        </div>
        <div class="settings-hint">例如 https://openlist.example.com，留空使用当前域名</div>
      </div>

      <!-- 媒体库说明 -->
      <div class="settings-card">
        <h3>📺 媒体库说明</h3>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;">
          媒体库功能需要在 OpenList 后端管理面板中配置并启用。<br>
          <strong>影视资源</strong>：支持电影和电视剧，自动刮削封面、简介、评分等信息<br>
          <strong>音乐资源</strong>：按专辑合并展示，支持在线播放和歌词显示<br>
          <strong>图片图库</strong>：瀑布流展示，支持全屏预览和切换<br>
          <strong>书籍库</strong>：支持在线阅读，翻页和目录导航
        </p>
      </div>

      <div style="display:flex;gap:12px;margin-top:8px;">
        <button class="btn-save" id="btn-save-settings">💾 保存设置</button>
        <button class="btn-back" id="btn-reset-settings">↩ 重置</button>
      </div>
    </div>
  `;

  // 实时预览个人路径
  const pathInput = document.getElementById('setting-home-path');
  const userInput = document.getElementById('setting-username');
  const preview = document.getElementById('personal-path-preview');

  function updatePreview() {
    let p = pathInput.value || '/home/';
    if (!p.startsWith('/')) p = '/' + p;
    if (!p.endsWith('/')) p += '/';
    const u = userInput.value || 'admin';
    preview.textContent = p + u + '/';
  }
  pathInput.addEventListener('input', updatePreview);
  userInput.addEventListener('input', updatePreview);

  // 保存
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    let hp = pathInput.value || '/home/';
    if (!hp.startsWith('/')) hp = '/' + hp;
    if (!hp.endsWith('/')) hp += '/';
    const un = userInput.value || 'admin';
    const ab = document.getElementById('setting-api-base').value.replace(/\/+$/, '');

    Storage.set('home_path', hp);
    Storage.set('username', un);
    Storage.set('api_base', ab);

    APP_CONFIG.homePath = hp;
    APP_CONFIG.username = un;
    APP_CONFIG.apiBase = ab;
    API.base = ab;

    showToast('设置已保存 ✓');
  });

  // 重置
  document.getElementById('btn-reset-settings').addEventListener('click', () => {
    pathInput.value = '/home/';
    userInput.value = 'admin';
    document.getElementById('setting-api-base').value = '';
    updatePreview();
  });
}

// ─── Toast 提示 ──────────────────────────────────────────
function showToast(msg, duration = 2000) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '10px 24px',
    borderRadius: '10px',
    fontSize: '14px',
    zIndex: '9999',
    transition: 'opacity 0.3s',
    backdropFilter: 'blur(10px)',
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
