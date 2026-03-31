/* ═══════════════════════════════════════════════════════════
   图片图库页面 - 瀑布流 + 图片预览器
   ═══════════════════════════════════════════════════════════ */

function renderImageLibrary(container) {
  let allItems = [];

  container.innerHTML = '<div id="image-browser"></div>';
  createMediaBrowser(document.getElementById('image-browser'), {
    mediaType: 'image',
    renderCard: imageCard,
    renderListRow: imageListRow,
    onItemClick: (item) => openImageViewer(item, allItems),
    onItemsChange: (items) => { allItems = items; },
  });
}

// ── 图片卡片（自适应高度） ──
function imageCard(item) {
  const name = getMediaName(item);
  // 图片直接展示预览
  const src = item.cover || (API.base + '/d' + item.file_path);
  return `
    <div class="media-card image-card">
      <div class="cover">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(name)}" loading="lazy"
             style="width:100%;display:block;border-radius:var(--radius-md) var(--radius-md) 0 0;"
             onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\' style=\\'padding:40px 0;\\'>🖼️</div>'">
      </div>
      <div class="info">
        <div class="title" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <div class="meta">${item.size ? formatSize(item.size) : ''}</div>
      </div>
    </div>
  `;
}

// ── 图片列表行 ──
function imageListRow(item) {
  const name = getMediaName(item);
  const src = item.cover || (API.base + '/d' + item.file_path);
  return `
    <img src="${escapeHtml(src)}" class="thumb" style="width:48px;height:48px;border-radius:6px;object-fit:cover;" loading="lazy">
    <div class="list-info">
      <div class="list-title">${escapeHtml(name)}</div>
      <div class="list-meta">${item.size ? formatSize(item.size) : ''} ${item.modified ? formatDate(item.modified) : ''}</div>
    </div>
  `;
}

// ── 图片预览器 ──
function openImageViewer(item, items) {
  let currentIdx = items.findIndex(i => i.id === item.id);
  if (currentIdx < 0) currentIdx = 0;

  function getImageUrl(it) {
    return it.cover || (API.base + '/d' + it.file_path);
  }

  const viewer = document.createElement('div');
  viewer.className = 'image-viewer';
  viewer.innerHTML = `
    <button class="viewer-close-btn" id="iv-close">✕</button>
    <button class="viewer-nav-btn prev" id="iv-prev">‹</button>
    <button class="viewer-nav-btn next" id="iv-next">›</button>
    <img class="viewer-img" id="iv-img" src="${escapeHtml(getImageUrl(items[currentIdx]))}" alt="">
    <div class="viewer-controls">
      <span class="viewer-counter" id="iv-counter">${currentIdx + 1} / ${items.length}</span>
      <button class="viewer-fullscreen-btn" id="iv-fullscreen">⛶ 全屏</button>
    </div>
  `;

  document.body.appendChild(viewer);

  function updateImage() {
    const img = document.getElementById('iv-img');
    if (img) img.src = getImageUrl(items[currentIdx]);
    const counter = document.getElementById('iv-counter');
    if (counter) counter.textContent = `${currentIdx + 1} / ${items.length}`;
  }

  document.getElementById('iv-close').addEventListener('click', () => viewer.remove());
  document.getElementById('iv-prev').addEventListener('click', () => {
    currentIdx = (currentIdx - 1 + items.length) % items.length;
    updateImage();
  });
  document.getElementById('iv-next').addEventListener('click', () => {
    currentIdx = (currentIdx + 1) % items.length;
    updateImage();
  });
  document.getElementById('iv-fullscreen').addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      viewer.requestFullscreen();
    }
  });

  // 键盘导航
  const keyHandler = (e) => {
    if (e.key === 'Escape') { viewer.remove(); document.removeEventListener('keydown', keyHandler); }
    if (e.key === 'ArrowLeft') { currentIdx = (currentIdx - 1 + items.length) % items.length; updateImage(); }
    if (e.key === 'ArrowRight') { currentIdx = (currentIdx + 1) % items.length; updateImage(); }
  };
  document.addEventListener('keydown', keyHandler);

  // 点击背景关闭
  viewer.addEventListener('click', (e) => {
    if (e.target === viewer) { viewer.remove(); document.removeEventListener('keydown', keyHandler); }
  });

  // 触摸滑动支持
  let touchStartX = 0;
  viewer.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
  viewer.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) { currentIdx = (currentIdx - 1 + items.length) % items.length; }
      else { currentIdx = (currentIdx + 1) % items.length; }
      updateImage();
    }
  });
}
