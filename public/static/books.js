/* ═══════════════════════════════════════════════════════════
   书籍库页面 - 书架 + 阅读器
   ═══════════════════════════════════════════════════════════ */

function renderBookLibrary(container) {
  container.innerHTML = '<div id="book-browser"></div>';
  createMediaBrowser(document.getElementById('book-browser'), {
    mediaType: 'book',
    renderCard: bookCard,
    renderListRow: bookListRow,
    onItemClick: (item) => openBookReader(item),
  });
}

// ── 书籍卡片 ──
function bookCard(item) {
  const name = getMediaName(item);
  const author = item.authors ? parseAuthors(item.authors).join(', ') : '';
  const cover = item.cover
    ? `<img src="${escapeHtml(item.cover)}" alt="${escapeHtml(name)}" loading="lazy">`
    : `<div class="placeholder">📚</div>`;

  return `
    <div class="media-card">
      <div class="cover" style="padding-top:140%;">${cover}</div>
      <div class="info">
        <div class="title" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <div class="meta">${escapeHtml(author)}</div>
      </div>
    </div>
  `;
}

// ── 书籍列表行 ──
function bookListRow(item) {
  const name = getMediaName(item);
  const author = item.authors ? parseAuthors(item.authors).join(', ') : '';
  const thumb = item.cover
    ? `<img src="${escapeHtml(item.cover)}" class="thumb">`
    : `<span style="font-size:20px;">📚</span>`;

  return `
    ${thumb}
    <div class="list-info">
      <div class="list-title">${escapeHtml(name)}</div>
      <div class="list-meta">${escapeHtml(author)}</div>
    </div>
  `;
}

// ── 书籍阅读器 ──
async function openBookReader(item) {
  // 获取文件地址
  const resp = await API.fsGet(item.file_path);
  if (resp.code !== 200 || !resp.data?.raw_url) {
    showToast('获取文件地址失败');
    return;
  }

  const rawUrl = resp.data.raw_url;
  const name = getMediaName(item);
  const ext = (item.file_name || '').split('.').pop()?.toLowerCase() || '';

  // 创建阅读器覆盖层
  const reader = document.createElement('div');
  reader.className = 'book-reader';
  reader.id = 'book-reader';

  let pageMode = Storage.get('book_page_mode', 'single'); // single | dual
  let showToc = Storage.get('book_show_toc', true);
  let currentPage = 1;
  let totalPages = 1;
  let toc = [];

  reader.innerHTML = `
    <div class="reader-topbar">
      <button class="btn-back" id="reader-close">← 返回</button>
      <span style="flex:1;font-size:14px;font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        ${escapeHtml(name)}
      </span>
      <div style="display:flex;gap:6px;">
        <button class="pill-btn" id="reader-toc-toggle" title="目录">📑</button>
        <button class="pill-btn" id="reader-mode-toggle" title="页面模式">${pageMode === 'single' ? '📄' : '📖'}</button>
      </div>
    </div>
    <div class="reader-content">
      <div class="reader-sidebar ${showToc ? '' : 'hidden'}" id="reader-toc">
        <h4 style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:12px;">📑 目录</h4>
        <div id="reader-toc-list">
          <div style="color:var(--text-muted);font-size:13px;">加载中...</div>
        </div>
      </div>
      <div class="reader-pages ${pageMode === 'dual' ? 'dual' : ''}" id="reader-pages">
        <div class="loading-state"><div class="loading-spinner"></div><div>加载书籍...</div></div>
      </div>
    </div>
    <div class="reader-bottombar">
      <button class="pill-btn" id="reader-prev">← 上一页</button>
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="number" id="reader-page-input" value="1" min="1" 
               style="width:60px;text-align:center;padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text-primary);font-size:13px;outline:none;">
        <span style="color:var(--text-muted);font-size:13px;" id="reader-page-total">/ 1</span>
      </div>
      <button class="pill-btn" id="reader-next">下一页 →</button>
    </div>
  `;

  document.body.appendChild(reader);

  // 关闭
  document.getElementById('reader-close').addEventListener('click', () => reader.remove());

  // 目录切换
  document.getElementById('reader-toc-toggle').addEventListener('click', () => {
    showToc = !showToc;
    Storage.set('book_show_toc', showToc);
    document.getElementById('reader-toc').classList.toggle('hidden', !showToc);
  });

  // 页面模式切换
  document.getElementById('reader-mode-toggle').addEventListener('click', () => {
    pageMode = pageMode === 'single' ? 'dual' : 'single';
    Storage.set('book_page_mode', pageMode);
    document.getElementById('reader-mode-toggle').textContent = pageMode === 'single' ? '📄' : '📖';
    document.getElementById('reader-pages').classList.toggle('dual', pageMode === 'dual');
    renderBookPage();
  });

  // 翻页
  document.getElementById('reader-prev').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= (pageMode === 'dual' ? 2 : 1);
      if (currentPage < 1) currentPage = 1;
      renderBookPage();
    }
  });

  document.getElementById('reader-next').addEventListener('click', () => {
    const step = pageMode === 'dual' ? 2 : 1;
    if (currentPage + step <= totalPages) {
      currentPage += step;
      renderBookPage();
    }
  });

  // 页码跳转
  document.getElementById('reader-page-input').addEventListener('change', (e) => {
    const p = parseInt(e.target.value);
    if (p >= 1 && p <= totalPages) {
      currentPage = p;
      renderBookPage();
    }
  });

  // 键盘翻页
  const keyHandler = (e) => {
    if (!document.getElementById('book-reader')) {
      document.removeEventListener('keydown', keyHandler);
      return;
    }
    if (e.key === 'Escape') { reader.remove(); document.removeEventListener('keydown', keyHandler); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (currentPage > 1) { currentPage -= (pageMode === 'dual' ? 2 : 1); if (currentPage < 1) currentPage = 1; renderBookPage(); }
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const step = pageMode === 'dual' ? 2 : 1;
      if (currentPage + step <= totalPages) { currentPage += step; renderBookPage(); }
    }
  };
  document.addEventListener('keydown', keyHandler);

  // 根据文件类型加载
  if (ext === 'pdf') {
    await loadPDFBook(rawUrl);
  } else if (ext === 'epub') {
    await loadEpubBook(rawUrl);
  } else if (ext === 'txt') {
    await loadTextBook(rawUrl);
  } else {
    // 通用：使用iframe
    const pages = document.getElementById('reader-pages');
    pages.innerHTML = `<iframe src="${escapeHtml(rawUrl)}" style="width:100%;height:100%;border:none;"></iframe>`;
  }

  function renderBookPage() {
    document.getElementById('reader-page-input').value = currentPage;
    document.getElementById('reader-page-total').textContent = `/ ${totalPages}`;
    // 具体渲染由各加载器实现
    if (window._bookRenderPage) window._bookRenderPage(currentPage, pageMode);
  }

  // PDF 加载器（使用浏览器内置PDF或canvas）
  async function loadPDFBook(url) {
    const pages = document.getElementById('reader-pages');
    // 使用 iframe 方式加载 PDF
    pages.innerHTML = `
      <iframe src="${escapeHtml(url)}" 
              style="width:100%;height:100%;border:none;border-radius:8px;"
              title="${escapeHtml(name)}">
      </iframe>
    `;
    // PDF 使用内置翻页，隐藏底部翻页栏
    document.querySelector('.reader-bottombar').style.display = 'none';
    document.getElementById('reader-toc-list').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">PDF 使用内置导航</div>';
  }

  // EPUB 加载器（简化版，使用iframe）
  async function loadEpubBook(url) {
    const pages = document.getElementById('reader-pages');
    pages.innerHTML = `
      <iframe src="${escapeHtml(url)}" 
              style="width:100%;height:100%;border:none;border-radius:8px;"
              title="${escapeHtml(name)}">
      </iframe>
    `;
    document.querySelector('.reader-bottombar').style.display = 'none';
    document.getElementById('reader-toc-list').innerHTML = '<div style="color:var(--text-muted);font-size:13px;">EPUB 使用内置导航</div>';
  }

  // 纯文本加载器
  async function loadTextBook(url) {
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      const lines = text.split('\n');
      const linesPerPage = 40;
      totalPages = Math.ceil(lines.length / linesPerPage);

      // 简单目录：按章节标题
      toc = [];
      lines.forEach((line, i) => {
        if (/^(第.{1,10}[章节回]|Chapter\s+\d)/i.test(line.trim())) {
          toc.push({ title: line.trim(), page: Math.floor(i / linesPerPage) + 1 });
        }
      });
      renderToc();

      window._bookRenderPage = (page, mode) => {
        const start = (page - 1) * linesPerPage;
        const end = mode === 'dual' ? start + linesPerPage * 2 : start + linesPerPage;
        const pageLines = lines.slice(start, end);
        const pages = document.getElementById('reader-pages');
        if (mode === 'dual') {
          const mid = Math.ceil(pageLines.length / 2);
          const left = pageLines.slice(0, mid);
          const right = pageLines.slice(mid);
          pages.innerHTML = `
            <div style="flex:1;padding:24px;overflow-y:auto;font-size:15px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;font-family:serif;">${escapeHtml(left.join('\n'))}</div>
            <div style="width:1px;background:var(--border);"></div>
            <div style="flex:1;padding:24px;overflow-y:auto;font-size:15px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;font-family:serif;">${escapeHtml(right.join('\n'))}</div>
          `;
        } else {
          pages.innerHTML = `
            <div style="max-width:700px;width:100%;padding:24px;overflow-y:auto;font-size:15px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;font-family:serif;">${escapeHtml(pageLines.join('\n'))}</div>
          `;
        }
      };

      renderBookPage();
    } catch (e) {
      const pages = document.getElementById('reader-pages');
      pages.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div class="text">加载失败：${escapeHtml(e.message)}</div></div>`;
    }
  }

  function renderToc() {
    const tocList = document.getElementById('reader-toc-list');
    if (toc.length === 0) {
      tocList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">无目录信息</div>';
      return;
    }
    tocList.innerHTML = toc.map(t =>
      `<div class="toc-item" data-page="${t.page}">${escapeHtml(t.title)}</div>`
    ).join('');
    tocList.querySelectorAll('.toc-item').forEach(el => {
      el.addEventListener('click', () => {
        currentPage = parseInt(el.dataset.page);
        renderBookPage();
        // 高亮
        tocList.querySelectorAll('.toc-item').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
      });
    });
  }
}
