/**
 * UI 渲染层 - 负责页面交互和渲染
 */
let currentTab = 'tools';
let filterGroup = '';
let filterCategory = '';

function init() {
  renderSidebar();
  switchTab('tools');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.sidebar-nav li').forEach(li => {
    li.classList.toggle('active', li.dataset.tab === tab);
  });
  const main = document.getElementById('main');
  if (tab === 'tools') renderToolsPage(main);
  else if (tab === 'categories') renderCategoriesPage(main);
  else if (tab === 'io') renderIOPage(main);
}

function renderSidebar() {
  document.querySelectorAll('.sidebar-nav li').forEach(li => {
    li.addEventListener('click', () => switchTab(li.dataset.tab));
  });
}

/* ---- 工具管理页 ---- */
function renderToolsPage(el) {
  const tools = AdminData.loadTools();
  const covers = AdminData.loadCovers();
  const groups = ['', ...Object.keys(AdminData.getGroups(tools))];
  const cats = ['', ...Object.keys(AdminData.getCategories(tools))];
  const filtered = tools.filter(t => {
    if (filterGroup && t.group !== filterGroup) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    return true;
  });

  el.innerHTML = `
    <h2>工具管理 <span style="font-size:.8rem;color:var(--muted)">(${filtered.length}/${tools.length})</span></h2>
    <div class="filter-bar">
      <select id="fGroup"><option value="">全部 Group</option>${groups.filter(Boolean).map(g => `<option ${g === filterGroup ? 'selected' : ''}>${g}</option>`).join('')}</select>
      <select id="fCat"><option value="">全部 Category</option>${cats.filter(Boolean).map(c => `<option ${c === filterCategory ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <button class="btn btn-brand" onclick="openToolModal()">+ 新增工具</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>封面</th><th>标题</th><th>分类</th><th>Group</th><th>URL</th><th>操作</th></tr></thead>
        <tbody>${filtered.map(t => renderToolRow(t, covers)).join('')}</tbody>
      </table>
    </div>`;

  document.getElementById('fGroup').onchange = e => { filterGroup = e.target.value; renderToolsPage(el); };
  document.getElementById('fCat').onchange = e => { filterCategory = e.target.value; renderToolsPage(el); };
}

function renderToolRow(t, covers) {
  const coverSrc = covers[t.id];
  const coverHtml = coverSrc
    ? `<div class="cover-preview"><img src="${coverSrc}"></div>`
    : `<div class="cover-preview">${t.logo || '--'}</div>`;
  return `<tr>
    <td>${coverHtml}<input type="file" accept="image/*" class="hidden" id="file-${t.id}" onchange="handleCoverUpload('${t.id}',this)">
      <button class="btn btn-outline" style="font-size:.7rem;margin-top:4px" onclick="document.getElementById('file-${t.id}').click()">上传</button></td>
    <td><strong>${t.title}</strong><br><span style="font-size:.75rem;color:var(--muted)">${(t.description || '').slice(0, 30)}</span></td>
    <td>${t.category || '-'}</td>
    <td>${t.group || '-'}</td>
    <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><a href="${t.url}" target="_blank">${t.url || '-'}</a></td>
    <td>
      <button class="btn btn-outline" onclick="openToolModal('${t.id}')">编辑</button>
      <button class="btn btn-danger" onclick="deleteTool('${t.id}')">删除</button>
    </td>
  </tr>`;
}

/* ---- 封面上传 ---- */
function handleCoverUpload(toolId, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    AdminData.saveCover(toolId, e.target.result);
    switchTab('tools');
  };
  reader.readAsDataURL(file);
}

/* ---- 工具表单模态 ---- */
function openToolModal(editId) {
  const tools = AdminData.loadTools();
  const tool = editId ? tools.find(t => t.id === editId) : {};
  const isEdit = !!editId;
  const fields = [
    { key: 'title', label: '标题', type: 'text' },
    { key: 'description', label: '描述', type: 'textarea' },
    { key: 'url', label: 'URL', type: 'text' },
    { key: 'category', label: '分类 (Category)', type: 'text' },
    { key: 'group', label: '分组 (Group)', type: 'text' },
    { key: 'mediaClass', label: 'Media Class', type: 'text' },
    { key: 'mediaText', label: 'Media Text', type: 'text' },
    { key: 'logo', label: 'Logo 缩写', type: 'text' },
    { key: 'tags', label: '标签 (逗号分隔)', type: 'text' },
  ];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <h3>${isEdit ? '编辑工具' : '新增工具'}</h3>
    ${fields.map(f => `<div class="form-row"><label>${f.label}</label>
      ${f.type === 'textarea'
        ? `<textarea id="f-${f.key}">${getValue(tool, f.key)}</textarea>`
        : `<input type="text" id="f-${f.key}" value="${getValue(tool, f.key)}">`}
    </div>`).join('')}
    <div class="form-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-brand" onclick="saveTool('${editId || ''}')">保存</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
}

function getValue(tool, key) {
  if (key === 'tags') return (tool.tags || []).join(', ');
  return (tool[key] || '').toString().replace(/"/g, '&quot;');
}

function saveTool(editId) {
  const data = {};
  ['title','description','url','category','group','mediaClass','mediaText','logo'].forEach(k => {
    data[k] = document.getElementById('f-' + k).value.trim();
  });
  data.tags = document.getElementById('f-tags').value.split(',').map(s => s.trim()).filter(Boolean);

  if (!data.title) { alert('标题不能为空'); return; }
  if (editId) AdminData.updateTool(editId, data);
  else AdminData.addTool(data);
  closeModal();
  switchTab('tools');
}

function deleteTool(id) {
  if (!confirm('确认删除该工具？')) return;
  AdminData.deleteTool(id);
  AdminData.removeCover(id);
  switchTab('tools');
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
}

/* ---- 分类管理页 ---- */
function renderCategoriesPage(el) {
  const tools = AdminData.loadTools();
  const groups = AdminData.getGroups(tools);
  const cats = AdminData.getCategories(tools);
  el.innerHTML = `
    <h2>分类管理</h2>
    <h3 style="margin:16px 0 8px;font-size:1rem">Group 分组</h3>
    <div class="cat-grid">${Object.entries(groups).map(([g, n]) =>
      `<div class="cat-card"><h4>${g}</h4><span class="count">${n} 个工具</span></div>`
    ).join('')}</div>
    <h3 style="margin:24px 0 8px;font-size:1rem">Category 分类</h3>
    <div class="cat-grid">${Object.entries(cats).map(([c, n]) =>
      `<div class="cat-card"><h4>${c}</h4><span class="count">${n} 个工具</span></div>`
    ).join('')}</div>
    <div style="margin-top:24px">
      <button class="btn btn-brand" onclick="promptAddCategory()">+ 新增分类/分组</button>
      <p style="font-size:.8rem;color:var(--muted);margin-top:8px">提示：新增工具时填写新的 Group 或 Category 即可自动创建</p>
    </div>`;
}

function promptAddCategory() {
  alert('在新增或编辑工具时，直接填写新的 Group 或 Category 名称即可自动创建分类。');
}

/* ---- 数据导入导出页 ---- */
function renderIOPage(el) {
  el.innerHTML = `
    <h2>数据导入 / 导出</h2>
    <div class="io-section">
      <div class="io-card">
        <h4>导出数据</h4>
        <p>将当前所有工具数据导出为 haodianai-data.js 格式</p>
        <button class="btn btn-brand" onclick="AdminData.exportAsJS()">下载 haodianai-data.js</button>
      </div>
      <div class="io-card">
        <h4>导入数据</h4>
        <p>上传 haodianai-data.js 文件以覆盖当前数据</p>
        <input type="file" id="importFile" accept=".js">
        <button class="btn btn-outline" style="margin-top:8px" onclick="handleImport()">导入</button>
      </div>
    </div>
    <div class="io-card" style="margin-top:16px">
      <h4>重置数据</h4>
      <p>清除 localStorage，恢复到种子数据</p>
      <button class="btn btn-danger" onclick="resetData()">重置</button>
    </div>`;
}

function handleImport() {
  const file = document.getElementById('importFile').files[0];
  if (!file) { alert('请先选择文件'); return; }
  AdminData.importFromFile(file)
    .then(() => { alert('导入成功'); switchTab('tools'); })
    .catch(err => alert('导入失败: ' + err.message));
}

function resetData() {
  if (!confirm('确认重置？将清除所有修改，恢复到种子数据。')) return;
  localStorage.removeItem('haodianai_admin_tools');
  localStorage.removeItem('haodianai_covers');
  switchTab('tools');
}

document.addEventListener('DOMContentLoaded', init);
