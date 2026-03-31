/* ═══════════════════════════════════════════════════════════
   文件浏览页面
   ═══════════════════════════════════════════════════════════ */

function renderFileBrowser(container) {
  const personalPath = APP_CONFIG.homePath + APP_CONFIG.username + '/';
  let currentPath = Storage.get('current_path', personalPath);

  container.innerHTML = `
    <div id="file-browser">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <button class="btn-back" id="fb-back">← 上级</button>
        <div style="flex:1;display:flex;align-items:center;gap:8px;">
          <span style="font-size:13px;color:var(--text-muted);">路径：</span>
          <input type="text" class="search-input" id="fb-path" style="flex:1;max-width:500px;"
                 value="${escapeHtml(currentPath)}">
          <button class="pill-btn active" id="fb-go">前往</button>
        </div>
        <button class="pill-btn" id="fb-home" title="回到个人目录">🏠 我的文件</button>
      </div>
      <div id="fb-content">
        <div class="loading-state"><div class="loading-spinner"></div><div>加载中...</div></div>
      </div>
    </div>
  `;

  async function loadDir(path) {
    currentPath = path;
    Storage.set('current_path', path);
    document.getElementById('fb-path').value = path;
    const content = document.getElementById('fb-content');
    content.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><div>加载中...</div></div>';

    const resp = await API.fsList(path);
    if (resp.code !== 200) {
      content.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div class="text">${escapeHtml(resp.message || '加载失败')}</div></div>`;
      return;
    }

    const items = resp.data?.content || [];
    if (items.length === 0) {
      content.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div class="text">此目录为空</div></div>';
      return;
    }

    // 排序：文件夹在前
    items.sort((a, b) => {
      if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    let html = '<div class="list-view">';
    for (const item of items) {
      const icon = item.is_dir ? '📁' : getFileIcon(item.name);
      const size = item.is_dir ? '-' : formatSize(item.size);
      const date = item.modified ? new Date(item.modified).toLocaleDateString() : '-';
      html += `
        <div class="list-item" data-path="${escapeHtml(path + item.name + (item.is_dir ? '/' : ''))}" data-isdir="${item.is_dir}">
          <span style="font-size:24px;flex-shrink:0;">${icon}</span>
          <div class="list-info">
            <div class="list-title">${escapeHtml(item.name)}</div>
            <div class="list-meta">${size} · ${date}</div>
          </div>
        </div>`;
    }
    html += '</div>';
    content.innerHTML = html;

    // 绑定点击事件
    content.querySelectorAll('.list-item').forEach(el => {
      el.addEventListener('click', () => {
        const p = el.dataset.path;
        if (el.dataset.isdir === 'true') {
          loadDir(p);
        } else {
          // 打开文件预览（简单跳转）
          window.open(API.base + '/d' + p, '_blank');
        }
      });
    });
  }

  // 事件绑定
  document.getElementById('fb-back').addEventListener('click', () => {
    const parts = currentPath.replace(/\/$/, '').split('/');
    parts.pop();
    const parent = parts.join('/') + '/';
    loadDir(parent || '/');
  });

  document.getElementById('fb-go').addEventListener('click', () => {
    let p = document.getElementById('fb-path').value;
    if (!p.startsWith('/')) p = '/' + p;
    if (!p.endsWith('/')) p += '/';
    loadDir(p);
  });

  document.getElementById('fb-path').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('fb-go').click();
  });

  document.getElementById('fb-home').addEventListener('click', () => {
    loadDir(personalPath);
  });

  loadDir(currentPath);
}

function getFileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const icons = {
    mp4: '🎬', mkv: '🎬', avi: '🎬', mov: '🎬', wmv: '🎬', flv: '🎬', webm: '🎬',
    mp3: '🎵', flac: '🎵', wav: '🎵', aac: '🎵', ogg: '🎵', m4a: '🎵', wma: '🎵',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', bmp: '🖼️', webp: '🖼️', svg: '🖼️', heic: '🖼️',
    pdf: '📕', epub: '📗', mobi: '📘', azw3: '📙', txt: '📄', doc: '📝', docx: '📝',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
    js: '⚡', ts: '⚡', py: '🐍', go: '🔵', java: '☕', html: '🌐', css: '🎨',
    json: '📋', xml: '📋', yaml: '📋', yml: '📋', md: '📝',
  };
  return icons[ext] || '📄';
}

/* ═══════════════════════════════════════════════════════════
   通用媒体浏览器组件
   ═══════════════════════════════════════════════════════════ */

function createMediaBrowser(container, options) {
  const {
    mediaType,
    renderCard,
    renderListRow,
    onItemClick,
    onItemsChange,
  } = options;

  let viewMode = 'waterfall';
  let browseMode = 'all';
  let orderBy = 'name';
  let orderDir = 'asc';
  let page = 1;
  let keyword = '';
  let selectedFolder = '';
  let folders = [];
  let items = [];
  let total = 0;
  const pageSize = 40;

  function render() {
    container.innerHTML = `
      <!-- 工具栏 -->
      <div class="media-toolbar">
        <div class="toolbar-group">
          <button class="pill-btn ${browseMode === 'all' ? 'active' : ''}" data-browse="all">全部</button>
          <button class="pill-btn ${browseMode === 'folder' ? 'active' : ''}" data-browse="folder">目录</button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <span class="toolbar-label">排序:</span>
          <button class="pill-btn ${orderBy === 'name' ? 'active' : ''}" data-sort="name">
            名称 ${orderBy === 'name' ? (orderDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button class="pill-btn ${orderBy === 'date' ? 'active' : ''}" data-sort="date">
            日期 ${orderBy === 'date' ? (orderDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button class="pill-btn ${orderBy === 'size' ? 'active' : ''}" data-sort="size">
            大小 ${orderBy === 'size' ? (orderDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        </div>
        <div class="toolbar-spacer"></div>
        <input type="text" class="search-input" placeholder="搜索..." value="${escapeHtml(keyword)}" data-action="search">
        <div class="toolbar-group">
          <button class="pill-btn ${viewMode === 'waterfall' ? 'active' : ''}" data-view="waterfall" title="瀑布流">⊞</button>
          <button class="pill-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list" title="列表">☰</button>
        </div>
      </div>

      <!-- 文件夹列表 -->
      <div id="mb-folders" class="folder-list" style="display:${browseMode === 'folder' ? 'flex' : 'none'}"></div>

      <!-- 内容区 -->
      <div id="mb-content"></div>

      <!-- 分页 -->
      <div id="mb-pagination" class="pagination" style="display:none"></div>
    `;

    bindEvents();
    loadData();
  }

  function bindEvents() {
    // 浏览模式切换
    container.querySelectorAll('[data-browse]').forEach(btn => {
      btn.addEventListener('click', () => {
        browseMode = btn.dataset.browse;
        page = 1;
        render();
      });
    });

    // 排序
    container.querySelectorAll('[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.dataset.sort;
        if (orderBy === col) {
          orderDir = orderDir === 'asc' ? 'desc' : 'asc';
        } else {
          orderBy = col;
          orderDir = 'asc';
        }
        page = 1;
        render();
      });
    });

    // 视图切换
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        renderContent();
      });
    });

    // 搜索
    const searchInput = container.querySelector('[data-action="search"]');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        keyword = searchInput.value;
        page = 1;
        loadData();
      }, 400));
    }
  }

  async function loadData() {
    const content = document.getElementById('mb-content');
    if (!content) return;
    content.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><div>加载中...</div></div>';

    // 加载文件夹列表
    if (browseMode === 'folder' && folders.length === 0) {
      const fResp = await API.getMediaFolders(mediaType);
      if (fResp.code === 200) folders = fResp.data || [];
      renderFolders();
    }

    // 加载媒体列表
    const params = {
      media_type: mediaType,
      page: String(page),
      page_size: String(pageSize),
      order_by: orderBy,
      order_dir: orderDir,
    };
    if (browseMode === 'folder' && selectedFolder) params.folder_path = selectedFolder;
    if (keyword) params.keyword = keyword;

    const resp = await API.getMediaList(params);
    if (resp.code === 200) {
      items = resp.data?.content || [];
      total = resp.data?.total || 0;
    } else {
      items = [];
      total = 0;
    }

    if (onItemsChange) onItemsChange(items);
    renderContent();
    renderPagination();
  }

  function renderFolders() {
    const el = document.getElementById('mb-folders');
    if (!el) return;
    let html = `<button class="folder-btn ${selectedFolder === '' ? 'active' : ''}" data-folder="">📂 全部目录</button>`;
    for (const f of folders) {
      const name = f.split('/').filter(Boolean).pop() || f;
      html += `<button class="folder-btn ${selectedFolder === f ? 'active' : ''}" data-folder="${escapeHtml(f)}" title="${escapeHtml(f)}">📁 ${escapeHtml(name)}</button>`;
    }
    el.innerHTML = html;
    el.querySelectorAll('.folder-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedFolder = btn.dataset.folder;
        page = 1;
        renderFolders();
        loadData();
      });
    });
  }

  function renderContent() {
    const content = document.getElementById('mb-content');
    if (!content) return;

    if (items.length === 0) {
      content.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div class="text">暂无内容</div></div>';
      return;
    }

    if (viewMode === 'waterfall') {
      let html = '<div class="waterfall-grid">';
      for (const item of items) {
        html += `<div class="waterfall-item" data-id="${item.id}">${renderCard(item)}</div>`;
      }
      html += '</div>';
      content.innerHTML = html;
    } else {
      let html = '<div class="list-view">';
      for (const item of items) {
        html += `<div class="list-item" data-id="${item.id}">${renderListRow ? renderListRow(item) : defaultListRow(item)}</div>`;
      }
      html += '</div>';
      content.innerHTML = html;
    }

    // 绑定点击
    content.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        const item = items.find(i => i.id === id);
        if (item && onItemClick) onItemClick(item);
      });
    });
  }

  function defaultListRow(item) {
    return `
      <span style="font-size:20px;">🎬</span>
      <div class="list-info">
        <div class="list-title">${escapeHtml(getMediaName(item))}</div>
        <div class="list-meta">${item.release_date ? item.release_date.slice(0, 4) : ''}</div>
      </div>
    `;
  }

  function renderPagination() {
    const el = document.getElementById('mb-pagination');
    if (!el) return;
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = `
      <button class="page-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">← 上一页</button>
      <span class="page-info">${page} / ${totalPages} 页（共 ${total} 项）</span>
      <button class="page-btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页 →</button>
    `;
    el.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        page = parseInt(btn.dataset.page);
        loadData();
      });
    });
  }

  render();
  return { refresh: loadData };
}
