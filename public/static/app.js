/* ═══════════════════════════════════════════════════════════
   OpenList APIPages - 应用核心框架
   路由系统、侧边栏、主题切换、API通信
   ═══════════════════════════════════════════════════════════ */

// ─── 全局配置 ─────────────────────────────────────────────
const APP_CONFIG = {
  apiBase: '', // 后端API地址，留空则使用当前域名
  homePath: '/home/', // 默认我的文件起始路径
  username: 'admin',
};

// ─── 本地存储工具 ─────────────────────────────────────────
const Storage = {
  get(key, def = null) {
    try { const v = localStorage.getItem('ol_' + key); return v !== null ? JSON.parse(v) : def; } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('ol_' + key, JSON.stringify(val)); } catch {}
  }
};

// ─── 主题管理 ─────────────────────────────────────────────
const Theme = {
  current: Storage.get('theme', 'light'),
  init() {
    document.documentElement.setAttribute('data-theme', this.current);
  },
  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.current);
    Storage.set('theme', this.current);
  }
};

// ─── 简易路由系统 ─────────────────────────────────────────
const Router = {
  routes: {},
  currentRoute: '',
  register(path, handler) { this.routes[path] = handler; },
  navigate(path) {
    if (this.currentRoute === path) return;
    this.currentRoute = path;
    window.location.hash = path;
    this.render();
  },
  render() {
    const path = this.currentRoute || 'files';
    const handler = this.routes[path];
    if (handler) {
      // 更新侧边栏激活状态
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.route === path);
      });
      // 更新顶栏标题
      const titles = {
        files: '📂 文件浏览',
        video: '🎬 影视资源库',
        music: '🎵 音乐资源库',
        image: '🖼️ 图片图库',
        books: '📚 书籍库',
        'media-manage': '🛠️ 媒体库管理',
        settings: '⚙️ 站点设置',
      };
      const topTitle = document.getElementById('topbar-title');
      if (topTitle) topTitle.textContent = titles[path] || '';
      // 渲染页面
      const container = document.getElementById('page-container');
      if (container) {
        container.innerHTML = '';
        handler(container);
        container.scrollTop = 0;
      }
    }
  },
  init() {
    const hash = window.location.hash.slice(1);
    this.currentRoute = hash || 'files';
    window.addEventListener('hashchange', () => {
      this.currentRoute = window.location.hash.slice(1) || 'files';
      this.render();
    });
    this.render();
  }
};

// ─── API 通信 ─────────────────────────────────────────────
const API = {
  base: APP_CONFIG.apiBase,
  token: Storage.get('auth_token', ''),

  async request(method, path, body = null, params = null) {
    let url = this.base + path;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      url += '?' + qs;
    }
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = this.token;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    try {
      const resp = await fetch(url, opts);
      return await resp.json();
    } catch (e) {
      return { code: 500, message: e.message, data: null };
    }
  },

  get(path, params) { return this.request('GET', path, null, params); },
  post(path, body) { return this.request('POST', path, body); },

  // 媒体库公开API
  getMediaList(query) { return this.get('/api/fs/media/list', query); },
  getMediaItem(id) { return this.get(`/api/fs/media/item/${id}`); },
  getAlbumList(params) { return this.get('/api/fs/media/albums', params); },
  getAlbumTracks(albumName, albumArtist) {
    return this.get('/api/fs/media/album', { album_name: albumName, album_artist: albumArtist });
  },
  getMediaFolders(mediaType) { return this.get('/api/fs/media/folders', { media_type: mediaType }); },

  // 文件系统API
  fsList(path, params = {}) { return this.post('/api/fs/list', { path, ...params }); },
  fsGet(path) { return this.post('/api/fs/get', { path }); },

  // 设置API
  getSettings() { return this.get('/api/public/settings'); },
  saveSettings(items) { return this.post('/api/admin/setting/save', items); },
};

// ─── 工具函数 ─────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return bytes.toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return dateStr.slice(0, 10);
}

function getMediaName(item) {
  return item.scraped_name || item.file_name || '';
}

function parseAuthors(authors) {
  if (!authors) return [];
  try { return JSON.parse(authors); } catch { return authors ? [authors] : []; }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ─── 侧边栏管理 ──────────────────────────────────────────
const Sidebar = {
  collapsed: Storage.get('sidebar_collapsed', false),
  mobileShow: false,

  init() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (this.collapsed) sidebar.classList.add('collapsed');

    // 移动端菜单按钮
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      this.toggleMobile();
    });
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      this.toggleMobile(false);
    });

    // 折叠按钮
    document.getElementById('btn-collapse')?.addEventListener('click', () => {
      this.toggleCollapse();
    });

    // 主题切换
    document.getElementById('btn-theme')?.addEventListener('click', () => {
      Theme.toggle();
      this.updateThemeIcon();
    });

    // 导航项点击
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.dataset.route;
        if (route) {
          Router.navigate(route);
          this.toggleMobile(false);
        }
      });
    });

    this.updateThemeIcon();
  },

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    Storage.set('sidebar_collapsed', this.collapsed);
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('collapsed', this.collapsed);
    // 更新折叠按钮图标
    const btn = document.getElementById('btn-collapse');
    if (btn) btn.textContent = this.collapsed ? '▶' : '◀';
  },

  toggleMobile(show) {
    this.mobileShow = show !== undefined ? show : !this.mobileShow;
    document.getElementById('sidebar')?.classList.toggle('mobile-show', this.mobileShow);
    document.getElementById('sidebar-overlay')?.classList.toggle('show', this.mobileShow);
  },

  updateThemeIcon() {
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = Theme.current === 'dark' ? '☀️' : '🌙';
  }
};

// ─── 应用初始化 ──────────────────────────────────────────
function initApp() {
  Theme.init();

  // 加载设置
  loadAppSettings().then(() => {
    Sidebar.init();

    // 注册路由
    Router.register('files', renderFileBrowser);
    Router.register('video', renderVideoLibrary);
    Router.register('music', renderMusicLibrary);
    Router.register('image', renderImageLibrary);
    Router.register('books', renderBookLibrary);
    Router.register('media-manage', renderMediaManage);
    Router.register('settings', renderSettings);

    Router.init();
  });
}

async function loadAppSettings() {
  // 从本地存储加载设置
  APP_CONFIG.homePath = Storage.get('home_path', '/home/');
  APP_CONFIG.username = Storage.get('username', 'admin');
  APP_CONFIG.apiBase = Storage.get('api_base', '');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);
