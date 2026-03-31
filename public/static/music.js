/* ═══════════════════════════════════════════════════════════
   音乐资源库页面 - 专辑浏览 + 底部播放器 + 歌词页面
   ═══════════════════════════════════════════════════════════ */

// ─── 全局音乐播放器状态 ──────────────────────────────────
const MusicPlayer = {
  audio: new Audio(),
  playlist: [],       // 当前播放列表
  currentIndex: -1,
  isPlaying: false,
  playMode: 'order',  // order | loop | single | shuffle
  volume: Storage.get('music_volume', 0.8),
  lyricsVisible: false,
  lyrics: [],         // 解析后的歌词 [{time, text}]

  init() {
    this.audio.volume = this.volume;
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('loadedmetadata', () => this.updateUI());
    this.audio.addEventListener('play', () => { this.isPlaying = true; this.updateUI(); });
    this.audio.addEventListener('pause', () => { this.isPlaying = false; this.updateUI(); });
    this.audio.addEventListener('error', () => {
      showToast('播放失败，尝试下一首');
      setTimeout(() => this.next(), 1500);
    });
  },

  get currentTrack() {
    return this.playlist[this.currentIndex] || null;
  },

  async play(track, playlist, index) {
    if (playlist) this.playlist = playlist;
    if (index !== undefined) this.currentIndex = index;
    if (track) {
      // 获取播放地址
      const resp = await API.fsGet(track.file_path);
      if (resp.code === 200 && resp.data?.raw_url) {
        this.audio.src = resp.data.raw_url;
        this.audio.play();
        this.isPlaying = true;
        this.showPlayer();
        this.loadLyrics(track);
        this.updateUI();
      } else {
        showToast('获取播放地址失败');
      }
    }
  },

  togglePlay() {
    if (this.audio.src) {
      if (this.isPlaying) {
        this.audio.pause();
      } else {
        this.audio.play();
      }
    }
  },

  prev() {
    if (this.playlist.length === 0) return;
    if (this.playMode === 'shuffle') {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    }
    this.play(this.playlist[this.currentIndex]);
  },

  next() {
    if (this.playlist.length === 0) return;
    if (this.playMode === 'shuffle') {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    this.play(this.playlist[this.currentIndex]);
  },

  onEnded() {
    if (this.playMode === 'single') {
      this.audio.currentTime = 0;
      this.audio.play();
    } else {
      this.next();
    }
  },

  toggleMode() {
    const modes = ['order', 'loop', 'single', 'shuffle'];
    const idx = modes.indexOf(this.playMode);
    this.playMode = modes[(idx + 1) % modes.length];
    if (this.playMode === 'loop') this.audio.loop = false;
    this.updateUI();
    const labels = { order: '顺序播放', loop: '列表循环', single: '单曲循环', shuffle: '随机播放' };
    showToast(labels[this.playMode]);
  },

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.audio.volume = this.volume;
    Storage.set('music_volume', this.volume);
    this.updateUI();
  },

  seek(ratio) {
    if (this.audio.duration) {
      this.audio.currentTime = ratio * this.audio.duration;
    }
  },

  showPlayer() {
    document.body.classList.add('has-player');
    const player = document.getElementById('music-player');
    if (player) player.classList.remove('hidden');
  },

  hidePlayer() {
    document.body.classList.remove('has-player');
    const player = document.getElementById('music-player');
    if (player) player.classList.add('hidden');
  },

  async loadLyrics(track) {
    this.lyrics = [];
    // 尝试从同目录加载 .lrc 文件
    if (track.file_path) {
      const lrcPath = track.file_path.replace(/\.[^.]+$/, '.lrc');
      try {
        const resp = await API.fsGet(lrcPath);
        if (resp.code === 200 && resp.data?.raw_url) {
          const lrcResp = await fetch(resp.data.raw_url);
          if (lrcResp.ok) {
            const text = await lrcResp.text();
            this.lyrics = parseLRC(text);
          }
        }
      } catch {}
    }
  },

  onTimeUpdate() {
    this.updateProgressUI();
    this.updateLyricsHighlight();
  },

  updateProgressUI() {
    const current = this.audio.currentTime || 0;
    const duration = this.audio.duration || 0;
    const ratio = duration > 0 ? current / duration : 0;

    // 更新底部播放器进度
    const fill = document.getElementById('player-progress-fill');
    if (fill) fill.style.width = (ratio * 100) + '%';
    const timeNow = document.getElementById('player-time-now');
    if (timeNow) timeNow.textContent = formatDuration(Math.floor(current));
    const timeTotal = document.getElementById('player-time-total');
    if (timeTotal) timeTotal.textContent = formatDuration(Math.floor(duration));

    // 歌词页进度
    const lyricsFill = document.getElementById('lyrics-progress-fill');
    if (lyricsFill) lyricsFill.style.width = (ratio * 100) + '%';
    const lyricsTimeNow = document.getElementById('lyrics-time-now');
    if (lyricsTimeNow) lyricsTimeNow.textContent = formatDuration(Math.floor(current));
    const lyricsTimeTotal = document.getElementById('lyrics-time-total');
    if (lyricsTimeTotal) lyricsTimeTotal.textContent = formatDuration(Math.floor(duration));
  },

  updateLyricsHighlight() {
    if (!this.lyricsVisible || this.lyrics.length === 0) return;
    const time = this.audio.currentTime;
    let activeIdx = -1;
    for (let i = this.lyrics.length - 1; i >= 0; i--) {
      if (time >= this.lyrics[i].time) { activeIdx = i; break; }
    }
    const lines = document.querySelectorAll('.lyrics-line');
    lines.forEach((el, i) => {
      el.classList.toggle('active', i === activeIdx);
      el.classList.toggle('near', Math.abs(i - activeIdx) === 1);
    });
    // 自动滚动到当前歌词
    if (activeIdx >= 0 && lines[activeIdx]) {
      lines[activeIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  updateUI() {
    const track = this.currentTrack;
    if (!track) return;

    const name = getMediaName(track);
    const artist = track.album_artist || track.authors || '';

    // 更新底部播放器
    const trackName = document.getElementById('player-track-name');
    if (trackName) trackName.textContent = name;
    const trackArtist = document.getElementById('player-track-artist');
    if (trackArtist) trackArtist.textContent = artist;
    const albumArt = document.getElementById('player-album-art');
    if (albumArt) albumArt.src = track.cover || '';
    if (albumArt && !track.cover) albumArt.style.display = 'none';
    if (albumArt && track.cover) albumArt.style.display = 'block';

    // 播放/暂停按钮
    const playBtn = document.getElementById('player-play-btn');
    if (playBtn) playBtn.textContent = this.isPlaying ? '⏸' : '▶';

    // 播放模式按钮
    const modeBtn = document.getElementById('player-mode-btn');
    if (modeBtn) {
      const icons = { order: '➡️', loop: '🔁', single: '🔂', shuffle: '🔀' };
      modeBtn.textContent = icons[this.playMode];
    }

    // 音量
    const volFill = document.getElementById('volume-fill');
    if (volFill) volFill.style.width = (this.volume * 100) + '%';

    // 歌词页信息
    const lyricsTrackName = document.getElementById('lyrics-track-name');
    if (lyricsTrackName) lyricsTrackName.textContent = name;
    const lyricsTrackArtist = document.getElementById('lyrics-track-artist');
    if (lyricsTrackArtist) lyricsTrackArtist.textContent = artist;
    const lyricsAlbumArt = document.getElementById('lyrics-album-art');
    if (lyricsAlbumArt) lyricsAlbumArt.src = track.cover || '';
    const lyricsBg = document.getElementById('lyrics-bg');
    if (lyricsBg) lyricsBg.style.backgroundImage = track.cover ? `url('${track.cover}')` : '';

    const lyricsPlayBtn = document.getElementById('lyrics-play-btn');
    if (lyricsPlayBtn) lyricsPlayBtn.textContent = this.isPlaying ? '⏸' : '▶';

    // 更新歌词内容
    this.renderLyricsContent();

    // 高亮当前播放曲目
    document.querySelectorAll('.track-item').forEach(el => {
      el.classList.toggle('playing', parseInt(el.dataset.id) === track.id);
    });
  },

  renderLyricsContent() {
    const scroll = document.getElementById('lyrics-scroll');
    if (!scroll) return;
    if (this.lyrics.length === 0) {
      scroll.innerHTML = '<div class="lyrics-line" style="padding-top:40vh;color:rgba(255,255,255,0.4);">暂无歌词</div>';
      return;
    }
    scroll.innerHTML = this.lyrics.map((l, i) =>
      `<div class="lyrics-line" data-idx="${i}">${escapeHtml(l.text || '···')}</div>`
    ).join('');
  },

  toggleLyrics() {
    this.lyricsVisible = !this.lyricsVisible;
    const overlay = document.getElementById('lyrics-overlay');
    if (overlay) {
      overlay.classList.toggle('show', this.lyricsVisible);
    }
    if (this.lyricsVisible) {
      this.updateUI();
      this.updateLyricsHighlight();
    }
  }
};

// ─── LRC 歌词解析 ────────────────────────────────────────
function parseLRC(text) {
  const lines = text.split('\n');
  const result = [];
  const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
  for (const line of lines) {
    const times = [];
    let match;
    while ((match = timeReg.exec(line)) !== null) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;
      times.push(min * 60 + sec + ms / 1000);
    }
    const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
    for (const t of times) {
      result.push({ time: t, text });
    }
  }
  result.sort((a, b) => a.time - b.time);
  return result;
}

// ─── 音乐库主页面 ────────────────────────────────────────
function renderMusicLibrary(container) {
  let currentView = 'browse'; // browse | album
  let currentAlbum = null;

  function showBrowse() {
    currentView = 'browse';
    container.innerHTML = '<div id="music-browser"></div>';
    createMediaBrowser(document.getElementById('music-browser'), {
      mediaType: 'audio',
      renderCard: albumCard,
      renderListRow: albumListRow,
      onItemClick: (item) => showAlbumDetail(item),
    });
  }

  function showAlbumDetail(item) {
    currentView = 'album';
    currentAlbum = item;
    renderAlbumDetail(container, item, () => showBrowse());
  }

  showBrowse();
}

// ── 专辑卡片 ──
function albumCard(item) {
  const name = item.album || getMediaName(item);
  const artist = item.album_artist || item.authors || '';
  const cover = item.cover
    ? `<img src="${escapeHtml(item.cover)}" alt="${escapeHtml(name)}" loading="lazy">`
    : `<div class="placeholder">🎵</div>`;

  return `
    <div class="media-card">
      <div class="cover" style="padding-top:100%;">${cover}</div>
      <div class="info">
        <div class="title" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <div class="meta">${escapeHtml(artist)}</div>
      </div>
    </div>
  `;
}

// ── 专辑列表行 ──
function albumListRow(item) {
  const name = item.album || getMediaName(item);
  const artist = item.album_artist || item.authors || '';
  const thumb = item.cover
    ? `<img src="${escapeHtml(item.cover)}" class="thumb" style="width:40px;height:40px;border-radius:6px;">`
    : `<span style="font-size:20px;">🎵</span>`;

  return `
    ${thumb}
    <div class="list-info">
      <div class="list-title">${escapeHtml(name)}</div>
      <div class="list-meta">${escapeHtml(artist)}</div>
    </div>
  `;
}

// ── 专辑详情页 ──
async function renderAlbumDetail(container, item, onBack) {
  const albumName = item.album || getMediaName(item);
  const albumArtist = item.album_artist || item.authors || '';

  container.innerHTML = `
    <div class="detail-page">
      <button class="btn-back" id="album-back">← 返回</button>
      <div class="album-detail">
        <div class="album-cover">
          ${item.cover ? `<img src="${escapeHtml(item.cover)}" alt="${escapeHtml(albumName)}">` : '<div class="placeholder" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:64px;background:var(--bg-hover);color:var(--text-muted);">🎵</div>'}
        </div>
        <div class="album-info">
          <h1>${escapeHtml(albumName)}</h1>
          <div class="artist">${escapeHtml(albumArtist)}</div>
          <div class="album-meta">
            ${item.release_date ? `<span>${item.release_date.slice(0, 4)}</span>` : ''}
            ${item.genre ? `<span> · ${escapeHtml(item.genre)}</span>` : ''}
          </div>
          ${item.description ? `<p style="font-size:14px;color:var(--text-secondary);line-height:1.7;margin-top:8px;">${escapeHtml(item.description)}</p>` : ''}
          <button class="btn-play" id="album-play-all" style="margin-top:16px;">▶ 播放全部</button>
        </div>
      </div>
      <div id="album-tracks">
        <div class="loading-state"><div class="loading-spinner"></div><div>加载曲目...</div></div>
      </div>
    </div>
  `;

  document.getElementById('album-back').addEventListener('click', onBack);

  // 加载专辑曲目
  let tracks = [];
  const resp = await API.getAlbumTracks(albumName, albumArtist);
  if (resp.code === 200 && resp.data) {
    tracks = resp.data;
  } else {
    // 回退：使用媒体列表搜索
    const listResp = await API.getMediaList({
      media_type: 'audio',
      keyword: albumName,
      page: '1',
      page_size: '100',
    });
    if (listResp.code === 200) {
      tracks = (listResp.data?.content || []).filter(t =>
        (t.album || '').toLowerCase() === albumName.toLowerCase()
      );
    }
  }

  // 为每个曲目补充封面
  tracks.forEach(t => { if (!t.cover && item.cover) t.cover = item.cover; });

  const tracksEl = document.getElementById('album-tracks');
  if (tracks.length === 0) {
    tracksEl.innerHTML = '<div class="empty-state"><div class="icon">🎵</div><div class="text">暂无曲目</div></div>';
    return;
  }

  let html = '<div class="track-list">';
  tracks.forEach((t, i) => {
    const name = getMediaName(t);
    const duration = t.duration ? formatDuration(t.duration) : '';
    html += `
      <div class="track-item" data-id="${t.id}" data-idx="${i}">
        <span class="track-num">${i + 1}</span>
        <span class="track-title">${escapeHtml(name)}</span>
        <span class="track-duration">${duration}</span>
      </div>
    `;
  });
  html += '</div>';
  tracksEl.innerHTML = html;

  // 绑定曲目点击
  tracksEl.querySelectorAll('.track-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      MusicPlayer.play(tracks[idx], tracks, idx);
    });
  });

  // 播放全部
  document.getElementById('album-play-all').addEventListener('click', () => {
    if (tracks.length > 0) {
      MusicPlayer.play(tracks[0], tracks, 0);
    }
  });
}

// ─── 初始化底部播放器和歌词页面（在HTML中调用） ──────────
function initMusicPlayerUI() {
  MusicPlayer.init();

  // 底部播放器事件
  document.getElementById('player-play-btn')?.addEventListener('click', () => MusicPlayer.togglePlay());
  document.getElementById('player-prev-btn')?.addEventListener('click', () => MusicPlayer.prev());
  document.getElementById('player-next-btn')?.addEventListener('click', () => MusicPlayer.next());
  document.getElementById('player-mode-btn')?.addEventListener('click', () => MusicPlayer.toggleMode());

  // 进度条点击
  document.getElementById('player-progress-bar')?.addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    MusicPlayer.seek(ratio);
  });

  // 音量条点击
  document.getElementById('volume-slider')?.addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    MusicPlayer.setVolume(ratio);
  });

  // 点击专辑封面打开歌词
  document.getElementById('player-album-art')?.addEventListener('click', () => MusicPlayer.toggleLyrics());

  // 歌词页关闭
  document.getElementById('lyrics-close-btn')?.addEventListener('click', () => MusicPlayer.toggleLyrics());

  // 歌词页播放控制
  document.getElementById('lyrics-play-btn')?.addEventListener('click', () => MusicPlayer.togglePlay());
  document.getElementById('lyrics-prev-btn')?.addEventListener('click', () => MusicPlayer.prev());
  document.getElementById('lyrics-next-btn')?.addEventListener('click', () => MusicPlayer.next());

  // 歌词页进度条
  document.getElementById('lyrics-progress-bar')?.addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    MusicPlayer.seek(ratio);
  });
}
