/* ═══════════════════════════════════════════════════════════
   媒体库管理设置页面
   配置管理、扫描刮削、数据库管理（查看/编辑/删除条目）
   对应后端 /api/admin/media/* 接口
   ═══════════════════════════════════════════════════════════ */

// ─── 管理API ─────────────────────────────────────────────
const MediaAdminAPI = {
  // 获取所有媒体库配置
  getConfigs() { return API.get('/api/admin/media/config/list'); },
  // 保存配置
  saveConfig(cfg) { return API.post('/api/admin/media/config/save', cfg); },
  // 获取媒体条目列表（后台）
  getItems(params) { return API.get('/api/admin/media/items', params); },
  // 更新媒体条目
  updateItem(item) { return API.post('/api/admin/media/items/update', item); },
  // 删除媒体条目
  deleteItem(id) { return API.post('/api/admin/media/items/delete', null, { id: String(id) }); },
  // 开始扫描
  startScan(mediaType) { return API.post('/api/admin/media/scan/start', { media_type: mediaType }); },
  // 获取扫描进度
  getScanProgress(mediaType) { return API.get('/api/admin/media/scan/progress', { media_type: mediaType }); },
  // 开始刮削
  startScrape(mediaType, itemId) { return API.post('/api/admin/media/scrape/start', { media_type: mediaType, item_id: itemId || 0 }); },
  // 清空数据库
  clearDB(mediaType) { return API.post('/api/admin/media/clear', null, { media_type: mediaType }); },
};

// ─── 媒体库管理主页面 ────────────────────────────────────
function renderMediaManage(container) {
  const mediaTypes = [
    { type: 'video', title: '影视', icon: '🎬' },
    { type: 'music', title: '音乐', icon: '🎵' },
    { type: 'image', title: '图片', icon: '🖼️' },
    { type: 'book',  title: '书籍', icon: '📚' },
  ];

  let activeTab = Storage.get('manage_active_tab', 'video');
  let configs = {};
  let scanTimers = {};

  container.innerHTML = `
    <div class="settings-page" style="max-width:1200px;">
      <h2 style="font-size:22px;font-weight:700;margin-bottom:6px;">🛠️ 媒体库管理</h2>
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:24px;">
        配置媒体库、扫描文件、刮削元数据、管理数据库条目
      </p>

      <!-- 标签页切换 -->
      <div class="manage-tabs" id="manage-tabs"></div>

      <!-- 当前标签页内容 -->
      <div id="manage-content"></div>
    </div>
  `;

  // 渲染标签页
  function renderTabs() {
    const tabsEl = document.getElementById('manage-tabs');
    tabsEl.innerHTML = mediaTypes.map(mt =>
      `<button class="manage-tab ${activeTab === mt.type ? 'active' : ''}" data-type="${mt.type}">
        ${mt.icon} ${mt.title}
      </button>`
    ).join('');
    tabsEl.querySelectorAll('.manage-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.type;
        Storage.set('manage_active_tab', activeTab);
        renderTabs();
        renderTabContent();
      });
    });
  }

  // 加载配置
  async function loadConfigs() {
    const resp = await MediaAdminAPI.getConfigs();
    if (resp.code === 200 && Array.isArray(resp.data)) {
      resp.data.forEach(cfg => { configs[cfg.media_type] = cfg; });
    }
    // 确保每种类型都有默认配置
    mediaTypes.forEach(mt => {
      if (!configs[mt.type]) {
        configs[mt.type] = {
          media_type: mt.type,
          enabled: false,
          scan_path: '/',
          path_merge: false,
        };
      }
    });
  }

  // 渲染当前标签页内容
  function renderTabContent() {
    const mt = mediaTypes.find(m => m.type === activeTab);
    if (!mt) return;
    const cfg = configs[activeTab] || { media_type: activeTab, enabled: false, scan_path: '/', path_merge: false };
    const contentEl = document.getElementById('manage-content');

    contentEl.innerHTML = `
      <!-- 配置区域 -->
      <div class="settings-card">
        <h3>${mt.icon} ${mt.title}库配置</h3>
        <div class="manage-config-row">
          <div class="manage-config-item">
            <span class="settings-label">启用</span>
            <div class="toggle-switch ${cfg.enabled ? 'on' : ''}" id="cfg-enabled" data-field="enabled">
              <div class="toggle-knob"></div>
            </div>
          </div>
          <div class="manage-config-item" style="flex:1;">
            <span class="settings-label">扫描路径</span>
            <input type="text" class="settings-input" id="cfg-scan-path" value="${escapeHtml(cfg.scan_path || '/')}" placeholder="/" style="max-width:300px;">
          </div>
          <div class="manage-config-item">
            <span class="settings-label">路径合并</span>
            <div class="toggle-switch ${cfg.path_merge ? 'on' : ''}" id="cfg-path-merge" data-field="path_merge">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;">
          <button class="manage-action-btn primary" id="btn-save-config">💾 保存配置</button>
          <button class="manage-action-btn success" id="btn-scan">🔍 立即扫描</button>
          <button class="manage-action-btn warning" id="btn-scrape">✨ 立即刮削</button>
          <button class="manage-action-btn danger" id="btn-clear">🗑️ 清空数据库</button>
        </div>

        <!-- 进度显示 -->
        <div id="manage-progress" style="display:none;margin-top:12px;"></div>
      </div>

      <!-- 数据库管理 -->
      <div class="settings-card" style="padding:0;overflow:hidden;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
          <h3 style="margin:0;">📋 数据库管理</h3>
          <span style="font-size:13px;color:var(--text-muted);" id="manage-total-count"></span>
        </div>
        <div id="manage-table-container">
          <div class="loading-state"><div class="loading-spinner"></div><div>加载中...</div></div>
        </div>
        <div id="manage-pagination" class="pagination" style="padding:12px;display:none;"></div>
      </div>
    </div>
    `;

    // 绑定开关事件
    document.querySelectorAll('.toggle-switch').forEach(el => {
      el.addEventListener('click', () => {
        el.classList.toggle('on');
      });
    });

    // 保存配置
    document.getElementById('btn-save-config').addEventListener('click', async () => {
      const newCfg = {
        media_type: activeTab,
        enabled: document.getElementById('cfg-enabled').classList.contains('on'),
        scan_path: document.getElementById('cfg-scan-path').value || '/',
        path_merge: document.getElementById('cfg-path-merge').classList.contains('on'),
      };
      const resp = await MediaAdminAPI.saveConfig(newCfg);
      if (resp.code === 200) {
        configs[activeTab] = { ...configs[activeTab], ...newCfg };
        showToast('配置已保存 ✓');
      } else {
        showToast('保存失败：' + (resp.message || '未知错误'));
      }
    });

    // 扫描
    document.getElementById('btn-scan').addEventListener('click', async () => {
      const btn = document.getElementById('btn-scan');
      btn.disabled = true;
      btn.textContent = '⏳ 扫描中...';
      const progressEl = document.getElementById('manage-progress');
      progressEl.style.display = 'block';
      progressEl.innerHTML = '<div class="manage-progress-bar"><div class="manage-progress-text">正在启动扫描...</div></div>';

      await MediaAdminAPI.startScan(activeTab);

      // 轮询进度
      if (scanTimers[activeTab]) clearInterval(scanTimers[activeTab]);
      scanTimers[activeTab] = setInterval(async () => {
        const resp = await MediaAdminAPI.getScanProgress(activeTab);
        if (resp.code === 200 && resp.data) {
          const d = resp.data;
          const msg = d.message || (d.running ? '扫描中...' : '完成');
          const pct = d.total > 0 ? Math.round(d.done / d.total * 100) : 0;
          progressEl.innerHTML = `
            <div class="manage-progress-bar">
              <div class="manage-progress-fill" style="width:${pct}%"></div>
              <div class="manage-progress-text">${escapeHtml(msg)} ${d.total > 0 ? `(${d.done}/${d.total})` : ''}</div>
            </div>
          `;
          if (!d.running) {
            clearInterval(scanTimers[activeTab]);
            btn.disabled = false;
            btn.textContent = '🔍 立即扫描';
            loadItems();
            setTimeout(() => { progressEl.style.display = 'none'; }, 3000);
          }
        }
      }, 1500);
    });

    // 刮削
    document.getElementById('btn-scrape').addEventListener('click', async () => {
      const btn = document.getElementById('btn-scrape');
      btn.disabled = true;
      btn.textContent = '⏳ 刮削中...';
      await MediaAdminAPI.startScrape(activeTab, 0);
      showToast('刮削任务已启动，后台运行中...');
      btn.disabled = false;
      btn.textContent = '✨ 立即刮削';
      // 延迟刷新
      setTimeout(() => loadItems(), 5000);
    });

    // 清空数据库
    document.getElementById('btn-clear').addEventListener('click', async () => {
      const mt = mediaTypes.find(m => m.type === activeTab);
      if (!confirm(`⚠️ 确定要清空「${mt.title}库」的所有数据吗？\n此操作不可恢复！`)) return;
      const resp = await MediaAdminAPI.clearDB(activeTab);
      if (resp.code === 200) {
        showToast('数据库已清空 ✓');
        loadItems();
      } else {
        showToast('清空失败：' + (resp.message || '未知错误'));
      }
    });

    // 加载数据
    loadItems();
  }

  // ─── 数据库管理表格 ──────────────────────────────────
  let itemsPage = 1;
  const itemsPageSize = 20;

  async function loadItems() {
    const tableEl = document.getElementById('manage-table-container');
    if (!tableEl) return;
    tableEl.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><div>加载中...</div></div>';

    const resp = await MediaAdminAPI.getItems({
      media_type: activeTab,
      page: String(itemsPage),
      page_size: String(itemsPageSize),
    });

    if (resp.code !== 200) {
      tableEl.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div class="text">${escapeHtml(resp.message || '加载失败')}</div></div>`;
      return;
    }

    const items = resp.data?.content || [];
    const total = resp.data?.total || 0;
    const totalPages = Math.ceil(total / itemsPageSize);

    document.getElementById('manage-total-count').textContent = `共 ${total} 条`;

    if (items.length === 0) {
      tableEl.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div class="text">暂无数据，请先扫描</div></div>';
      document.getElementById('manage-pagination').style.display = 'none';
      return;
    }

    // 渲染表格
    let html = `
      <div class="manage-table-wrap">
        <table class="manage-table">
          <thead>
            <tr>
              <th>文件路径</th>
              <th>名称</th>
              <th>封面</th>
              <th>发布时间</th>
              <th>评分</th>
              <th>类型</th>
              <th>作者/演员</th>
              <th>隐藏</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const item of items) {
      const name = item.scraped_name || item.file_name || '';
      const authors = item.authors ? (() => { try { return JSON.parse(item.authors).slice(0, 2).join(', '); } catch { return item.authors; } })() : '-';
      html += `
        <tr data-id="${item.id}">
          <td class="cell-path" title="${escapeHtml(item.file_path)}">${escapeHtml(item.file_path)}</td>
          <td>${escapeHtml(name)}</td>
          <td>${item.cover ? `<img src="${escapeHtml(item.cover)}" class="manage-thumb">` : '-'}</td>
          <td>${item.release_date ? item.release_date.slice(0, 10) : '-'}</td>
          <td>${item.rating > 0 ? item.rating.toFixed(1) : '-'}</td>
          <td>${escapeHtml((item.genre || '-').split(',')[0])}</td>
          <td class="cell-authors">${escapeHtml(authors)}</td>
          <td>
            <div class="toggle-switch mini ${item.hidden ? 'on' : ''}" data-action="toggle-hidden" data-id="${item.id}">
              <div class="toggle-knob"></div>
            </div>
          </td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="manage-btn-edit" data-action="edit" data-id="${item.id}">编辑</button>
              <button class="manage-btn-delete" data-action="delete" data-id="${item.id}">删除</button>
            </div>
          </td>
        </tr>
      `;
    }

    html += '</tbody></table></div>';
    tableEl.innerHTML = html;

    // 绑定表格事件
    tableEl.querySelectorAll('[data-action="toggle-hidden"]').forEach(el => {
      el.addEventListener('click', async () => {
        const id = parseInt(el.dataset.id);
        const item = items.find(i => i.id === id);
        if (!item) return;
        el.classList.toggle('on');
        await MediaAdminAPI.updateItem({ ...item, hidden: el.classList.contains('on') });
      });
    });

    tableEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const item = items.find(i => i.id === id);
        if (item) openEditModal(item);
      });
    });

    tableEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('确定删除此条目？')) return;
        const id = parseInt(btn.dataset.id);
        await MediaAdminAPI.deleteItem(id);
        loadItems();
      });
    });

    // 分页
    const pagEl = document.getElementById('manage-pagination');
    if (totalPages > 1) {
      pagEl.style.display = 'flex';
      pagEl.innerHTML = `
        <button class="page-btn" ${itemsPage <= 1 ? 'disabled' : ''} data-page="${itemsPage - 1}">← 上一页</button>
        <span class="page-info">${itemsPage} / ${totalPages} 页</span>
        <button class="page-btn" ${itemsPage >= totalPages ? 'disabled' : ''} data-page="${itemsPage + 1}">下一页 →</button>
      `;
      pagEl.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          itemsPage = parseInt(btn.dataset.page);
          loadItems();
        });
      });
    } else {
      pagEl.style.display = 'none';
    }
  }

  // ─── 编辑弹窗 ──────────────────────────────────────────
  function openEditModal(item) {
    // 移除已有弹窗
    document.getElementById('edit-modal-overlay')?.remove();

    const fields = [
      { key: 'scraped_name', label: '名称', type: 'text' },
      { key: 'cover', label: '封面URL', type: 'text' },
      { key: 'release_date', label: '发布时间', type: 'text', placeholder: 'YYYY-MM-DD' },
      { key: 'rating', label: '评分 (0-10)', type: 'number', step: '0.1', min: '0', max: '10' },
      { key: 'genre', label: '类型（逗号分隔）', type: 'text' },
      { key: 'authors', label: '作者/演员（JSON数组）', type: 'text' },
      { key: 'description', label: '简介', type: 'textarea' },
      { key: 'plot', label: '剧情/内容', type: 'textarea' },
    ];

    // 音乐专属
    if (activeTab === 'music') {
      fields.push(
        { key: 'album_name', label: '专辑名', type: 'text' },
        { key: 'album_artist', label: '专辑艺术家', type: 'text' },
      );
    }
    // 书籍专属
    if (activeTab === 'book') {
      fields.push(
        { key: 'publisher', label: '出版社', type: 'text' },
        { key: 'isbn', label: 'ISBN', type: 'text' },
      );
    }

    const overlay = document.createElement('div');
    overlay.id = 'edit-modal-overlay';
    overlay.className = 'modal-overlay';

    let fieldsHtml = '';
    for (const f of fields) {
      const val = item[f.key] ?? '';
      if (f.type === 'textarea') {
        fieldsHtml += `
          <div class="modal-field">
            <label>${f.label}</label>
            <textarea id="edit-${f.key}" rows="3">${escapeHtml(String(val))}</textarea>
          </div>
        `;
      } else {
        fieldsHtml += `
          <div class="modal-field">
            <label>${f.label}</label>
            <input type="${f.type}" id="edit-${f.key}" value="${escapeHtml(String(val))}"
                   ${f.placeholder ? `placeholder="${f.placeholder}"` : ''}
                   ${f.step ? `step="${f.step}"` : ''}
                   ${f.min ? `min="${f.min}"` : ''}
                   ${f.max ? `max="${f.max}"` : ''}>
          </div>
        `;
      }
    }

    overlay.innerHTML = `
      <div class="modal-content">
        <h3 style="margin:0 0 20px;font-size:16px;color:var(--text-primary);">✏️ 编辑媒体信息</h3>
        <div class="modal-fields">${fieldsHtml}</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
          <button class="btn-back" id="edit-cancel">取消</button>
          <button class="btn-save" id="edit-save">保存</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById('edit-cancel').addEventListener('click', () => overlay.remove());

    document.getElementById('edit-save').addEventListener('click', async () => {
      const updated = { ...item };
      for (const f of fields) {
        const el = document.getElementById(`edit-${f.key}`);
        if (el) {
          if (f.type === 'number') {
            updated[f.key] = parseFloat(el.value) || 0;
          } else if (f.type === 'textarea') {
            updated[f.key] = el.value;
          } else {
            updated[f.key] = el.value;
          }
        }
      }
      const resp = await MediaAdminAPI.updateItem(updated);
      if (resp.code === 200) {
        showToast('保存成功 ✓');
        overlay.remove();
        loadItems();
      } else {
        showToast('保存失败：' + (resp.message || '未知错误'));
      }
    });

    // ESC关闭
    const escHandler = (e) => {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
  }

  // 初始化
  loadConfigs().then(() => {
    renderTabs();
    renderTabContent();
  });
}
