/**
 * 数据管理层 - 负责 localStorage 读写和数据操作
 */
const STORAGE_KEY = 'haodianai_admin_tools';
const COVER_KEY = 'haodianai_covers';

const AdminData = {
  /* ---- 工具数据 ---- */
  loadTools() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    if (window.HaodianSeed && window.HaodianSeed.tools) {
      this.saveTools(window.HaodianSeed.tools);
      return window.HaodianSeed.tools;
    }
    return [];
  },

  saveTools(tools) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  },

  addTool(tool) {
    const tools = this.loadTools();
    tool.id = tool.id || this._genId(tool.title);
    tool.sortOrder = Math.max(0, ...tools.map(t => t.sortOrder || 0)) + 10;
    tools.push(tool);
    this.saveTools(tools);
    return tools;
  },

  updateTool(id, updates) {
    const tools = this.loadTools();
    const idx = tools.findIndex(t => t.id === id);
    if (idx === -1) return tools;
    tools[idx] = { ...tools[idx], ...updates };
    this.saveTools(tools);
    return tools;
  },

  deleteTool(id) {
    let tools = this.loadTools();
    tools = tools.filter(t => t.id !== id);
    this.saveTools(tools);
    return tools;
  },

  /* ---- 分类汇总 ---- */
  getGroups(tools) {
    const map = {};
    tools.forEach(t => {
      const g = t.group || '未分组';
      map[g] = (map[g] || 0) + 1;
    });
    return map;
  },

  getCategories(tools) {
    const map = {};
    tools.forEach(t => {
      const c = t.category || '未分类';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  },

  /* ---- 封面图片 ---- */
  loadCovers() {
    const raw = localStorage.getItem(COVER_KEY);
    return raw ? JSON.parse(raw) : {};
  },

  saveCover(toolId, dataUrl) {
    const covers = this.loadCovers();
    covers[toolId] = dataUrl;
    localStorage.setItem(COVER_KEY, JSON.stringify(covers));
  },

  removeCover(toolId) {
    const covers = this.loadCovers();
    delete covers[toolId];
    localStorage.setItem(COVER_KEY, JSON.stringify(covers));
  },

  /* ---- 导入导出 ---- */
  exportAsJS() {
    const tools = this.loadTools();
    const seed = window.HaodianSeed || {};
    seed.tools = tools;
    const content = 'window.HaodianSeed = ' + JSON.stringify(seed, null, 2) + ';\n';
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'haodianai-data.js';
    a.click();
    URL.revokeObjectURL(url);
  },

  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const code = e.target.result;
          const fn = new Function(code + '; return window.HaodianSeed;');
          const data = fn();
          if (data && data.tools) {
            this.saveTools(data.tools);
            resolve(data.tools);
          } else {
            reject(new Error('文件中未找到 tools 数据'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  },

  /* ---- 工具方法 ---- */
  _genId(title) {
    return (title || 'tool')
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  }
};
