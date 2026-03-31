/* ═══════════════════════════════════════════════════════════
   影视资源库页面 - 浏览 + 详情 + 播放器
   ═══════════════════════════════════════════════════════════ */

function renderVideoLibrary(container) {
  let currentView = 'browse'; // browse | detail
  let currentItem = null;

  function showBrowse() {
    currentView = 'browse';
    container.innerHTML = '<div id="video-browser"></div>';
    createMediaBrowser(document.getElementById('video-browser'), {
      mediaType: 'video',
      renderCard: videoCard,
      renderListRow: videoListRow,
      onItemClick: (item) => showDetail(item),
    });
  }

  function showDetail(item) {
    currentView = 'detail';
    currentItem = item;
    renderVideoDetail(container, item, () => showBrowse());
  }

  showBrowse();
}

// ── 视频卡片 ──
function videoCard(item) {
  const name = getMediaName(item);
  const rating = item.rating > 0 ? `<div class="badge">⭐ ${item.rating.toFixed(1)}</div>` : '';
  const cover = item.cover
    ? `<img src="${escapeHtml(item.cover)}" alt="${escapeHtml(name)}" loading="lazy">`
    : `<div class="placeholder">🎬</div>`;
  const year = item.release_date ? item.release_date.slice(0, 4) : '';

  return `
    <div class="media-card">
      <div class="cover">${cover}${rating}</div>
      <div class="info">
        <div class="title" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <div class="meta">${year}</div>
      </div>
    </div>
  `;
}

// ── 视频列表行 ──
function videoListRow(item) {
  const name = getMediaName(item);
  const thumb = item.cover
    ? `<img src="${escapeHtml(item.cover)}" class="thumb">`
    : `<span style="font-size:20px;">🎬</span>`;
  const year = item.release_date ? item.release_date.slice(0, 4) : '';
  const genre = item.genre ? item.genre.split(',')[0] : '';
  const rating = item.rating > 0 ? `<span style="color:#fbbf24;font-size:13px;">⭐ ${item.rating.toFixed(1)}</span>` : '';

  return `
    ${thumb}
    <div class="list-info">
      <div class="list-title">${escapeHtml(name)}</div>
      <div class="list-meta">${year} ${genre}</div>
    </div>
    ${rating}
  `;
}

// ── 视频详情页 ──
async function renderVideoDetail(container, item, onBack) {
  // 如果只有ID，需要获取完整信息
  if (!item.file_path) {
    const resp = await API.getMediaItem(item.id);
    if (resp.code === 200 && resp.data) item = resp.data;
  }

  const name = getMediaName(item);
  const authors = parseAuthors(item.authors);
  const genres = item.genre ? item.genre.split(',').filter(Boolean) : [];
  const videoType = item.video_type === 'movie' ? '电影' : (item.video_type === 'tv' ? '电视剧' : '');

  const backdrop = item.cover ? `<div class="detail-backdrop" style="background-image:url('${escapeHtml(item.cover)}')"></div>` : '';

  const coverHtml = item.cover
    ? `<img src="${escapeHtml(item.cover)}" alt="${escapeHtml(name)}">`
    : `<div class="placeholder">🎬</div>`;

  const ratingHtml = item.rating > 0
    ? `<span class="detail-rating">⭐ ${item.rating.toFixed(1)}</span>` : '';

  const yearHtml = item.release_date
    ? `<span style="color:var(--text-muted);font-size:14px;">${item.release_date.slice(0, 4)}</span>` : '';

  const typeHtml = videoType
    ? `<span style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:6px;padding:3px 8px;color:#a5b4fc;font-size:12px;">${videoType}</span>` : '';

  const genresHtml = genres.length > 0
    ? `<div class="detail-tags">${genres.map(g => `<span class="detail-tag">${escapeHtml(g)}</span>`).join('')}</div>` : '';

  const authorsHtml = authors.length > 0
    ? `<div class="detail-section"><span style="color:var(--text-muted);font-size:13px;">主演：</span><span style="color:var(--text-secondary);font-size:13px;">${authors.slice(0, 5).map(a => escapeHtml(a)).join(' / ')}</span></div>` : '';

  const plotHtml = (item.plot || item.description)
    ? `<div class="detail-section"><div class="detail-section-title">剧情简介</div><p>${escapeHtml(item.plot || item.description)}</p></div>` : '';

  container.innerHTML = `
    <div class="detail-page">
      ${backdrop}
      <button class="btn-back" id="video-back">← 返回</button>
      <div class="detail-content">
        <div class="detail-cover">${coverHtml}</div>
        <div class="detail-info">
          <h1>${escapeHtml(name)}</h1>
          <div class="detail-meta">${ratingHtml}${yearHtml}${typeHtml}</div>
          ${genresHtml}
          ${authorsHtml}
          <button class="btn-play" id="video-play-btn">▶ 立即播放</button>
          ${plotHtml}
        </div>
      </div>
    </div>
    <div id="video-player-container"></div>
  `;

  document.getElementById('video-back').addEventListener('click', onBack);
  document.getElementById('video-play-btn').addEventListener('click', () => {
    openVideoPlayer(item);
  });
}

// ── 视频播放器 ──
async function openVideoPlayer(item) {
  // 获取播放地址
  const resp = await API.fsGet(item.file_path);
  if (resp.code !== 200 || !resp.data?.raw_url) {
    showToast('获取播放地址失败：' + (resp.message || '未知错误'));
    return;
  }

  const rawUrl = resp.data.raw_url;
  const name = getMediaName(item);

  const overlay = document.createElement('div');
  overlay.className = 'video-player-overlay';
  overlay.innerHTML = `
    <div class="video-player-topbar">
      <button class="btn-back" id="vp-close">← 返回</button>
      <span style="color:#e2e8f0;font-size:14px;font-weight:500;">${escapeHtml(name)}</span>
    </div>
    <div class="video-player-area">
      <video id="vp-video" controls autoplay style="width:100%;height:100%;background:#000;">
        <source src="${escapeHtml(rawUrl)}">
      </video>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('vp-close').addEventListener('click', () => {
    const video = document.getElementById('vp-video');
    if (video) { video.pause(); video.src = ''; }
    overlay.remove();
  });

  // ESC关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      const video = document.getElementById('vp-video');
      if (video) { video.pause(); video.src = ''; }
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}
