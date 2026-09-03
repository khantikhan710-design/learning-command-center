# 今日任务分类管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让今日任务的分类可新增、重命名和删除，并使旧“自定义”任务安全迁移为“未分类”。

**Architecture:** 新建 `task-categories` 纯工具模块，将分类名称规范化、任务批量更新和分类迁移集中处理；今日页只负责交互和存储。任务云端快照从数组升级为 `{ tasks, categories }`，读取端兼容原有数组快照，确保本地与云端同步恢复一致。

**Tech Stack:** 微信小程序原生 JavaScript/WXML、微信云函数 Node.js、Node 内置 `assert` 测试。

---

## 文件结构

- Create: `miniprogram/utils/task-categories.js` — 分类规则、分类迁移和任务引用更新。
- Create: `tests/task-categories.test.cjs` — 纯逻辑回归测试。
- Modify: `miniprogram/pages/index/index.js` — 分类菜单、新建/管理交互、本地与云端状态读写。
- Modify: `miniprogram/utils/cloud-store.js` — 任务状态对象的云端读取、保存兼容层。
- Modify: `cloudfunctions/studyData/index.js` — 允许任务快照使用经过验证的对象格式。
- Modify: `tests/cloud-store.test.cjs` — 覆盖任务状态对象的云端调用。

### Task 1: 分类领域逻辑与红绿测试

**Files:**
- Create: `tests/task-categories.test.cjs`
- Create: `miniprogram/utils/task-categories.js`

- [ ] **Step 1: 写入失败测试，描述分类的新增、重命名、删除和旧数据兼容**

```js
const assert = require('node:assert/strict');
const {
  DEFAULT_TASK_CATEGORIES, UNCATEGORIZED, normalizeTaskCategories,
  normalizeTaskSubjects, createCategory, renameCategory, deleteCategory
} = require('../miniprogram/utils/task-categories');

assert.deepEqual(DEFAULT_TASK_CATEGORIES, ['考研数学', '专业基础', '硬件电路', '英语', 'AI 学习']);
assert.deepEqual(normalizeTaskCategories([' 英语 ', '英语', '未分类', '']), ['英语']);
assert.deepEqual(normalizeTaskSubjects([{ id: 'a', subject: '自定义' }, { id: 'b' }]), [
  { id: 'a', subject: UNCATEGORIZED }, { id: 'b', subject: UNCATEGORIZED }
]);
assert.deepEqual(createCategory(['英语'], ' 通信原理 '), { categories: ['英语', '通信原理'], error: null });
assert.equal(createCategory(['英语'], '英语').error, 'duplicate');
assert.equal(createCategory(['英语'], ' ').error, 'empty');
assert.deepEqual(renameCategory(['英语', '通信原理'], [{ id: 'a', subject: '通信原理' }], '通信原理', '信号与系统'), {
  categories: ['英语', '信号与系统'], tasks: [{ id: 'a', subject: '信号与系统' }], error: null
});
assert.deepEqual(deleteCategory(['英语', '通信原理'], [{ id: 'a', subject: '通信原理' }], '通信原理'), {
  categories: ['英语'], tasks: [{ id: 'a', subject: UNCATEGORIZED }]
});
console.log('task category tests passed');
```

- [ ] **Step 2: 运行测试并确认它因模块不存在而失败**

Run: `node tests/task-categories.test.cjs`

Expected: 失败并显示 `Cannot find module '../miniprogram/utils/task-categories'`。

- [ ] **Step 3: 实现最小分类工具模块**

```js
const DEFAULT_TASK_CATEGORIES = ['考研数学', '专业基础', '硬件电路', '英语', 'AI 学习'];
const UNCATEGORIZED = '未分类';

function clean(value) { return String(value || '').trim(); }
function normalizeTaskCategories(categories) {
  const source = Array.isArray(categories) ? categories : DEFAULT_TASK_CATEGORIES;
  return source.reduce((result, item) => {
    const name = clean(item);
    return name && name !== UNCATEGORIZED && !result.includes(name) ? [...result, name] : result;
  }, []);
}
function normalizeTaskSubjects(tasks) {
  return (tasks || []).map(task => ({ ...task, subject: task.subject && task.subject !== '自定义' ? task.subject : UNCATEGORIZED }));
}
function createCategory(categories, name) {
  const value = clean(name);
  if (!value) return { categories, error: 'empty' };
  if (value === UNCATEGORIZED || categories.includes(value)) return { categories, error: 'duplicate' };
  return { categories: [...categories, value], error: null };
}
function renameCategory(categories, tasks, oldName, newName) {
  const result = createCategory(categories.filter(name => name !== oldName), newName);
  if (result.error) return { categories, tasks, error: result.error };
  const value = clean(newName);
  return { categories: result.categories, tasks: (tasks || []).map(task => task.subject === oldName ? { ...task, subject: value } : task), error: null };
}
function deleteCategory(categories, tasks, name) {
  return { categories: categories.filter(item => item !== name), tasks: (tasks || []).map(task => task.subject === name ? { ...task, subject: UNCATEGORIZED } : task) };
}
module.exports = { DEFAULT_TASK_CATEGORIES, UNCATEGORIZED, normalizeTaskCategories, normalizeTaskSubjects, createCategory, renameCategory, deleteCategory };
```

- [ ] **Step 4: 运行分类测试并确认通过**

Run: `node tests/task-categories.test.cjs`

Expected: 输出 `task category tests passed`，退出码为 0。

- [ ] **Step 5: 提交领域逻辑与测试**

```bash
git add miniprogram/utils/task-categories.js tests/task-categories.test.cjs
git commit -m "feat: add task category management logic"
```

### Task 2: 任务状态云端兼容

**Files:**
- Modify: `tests/cloud-store.test.cjs`
- Modify: `miniprogram/utils/cloud-store.js`
- Modify: `cloudfunctions/studyData/index.js`

- [ ] **Step 1: 为任务状态对象写失败测试**

该项目的现有云端客户端测试是静态配置测试，没有可运行的 `wx` 测试桩。保留现有断言后，在 `tests/cloud-store.test.cjs` 新增：

```js
assert.match(source, /function loadTaskState\(\) \{ return callData\('load', 'tasks'\)\.then\(result => result\.items\); \}/);
assert.match(source, /function saveTaskState\(state\) \{ return callData\('save', 'tasks', \{ items: state \}\); \}/);
```

并读取云函数源码：

```js
const cloudFunctionSource = fs.readFileSync(require.resolve('../cloudfunctions/studyData/index'), 'utf8');
assert.match(cloudFunctionSource, /event\.name === 'tasks'/);
assert.match(cloudFunctionSource, /Array\.isArray\(event\.items\.tasks\)/);
assert.match(cloudFunctionSource, /Array\.isArray\(event\.items\.categories\)/);
```

- [ ] **Step 2: 运行测试并确认因 API 缺失失败**

Run: `node tests/cloud-store.test.cjs`

Expected: 失败并显示某条 `assert.match` 的模式不匹配。

- [ ] **Step 3: 在客户端添加兼容读写 API**

在 `miniprogram/utils/cloud-store.js` 中新增并导出：

```js
function loadTaskState() { return callData('load', 'tasks').then(result => result.items); }
function saveTaskState(state) { return callData('save', 'tasks', { items: state }); }
```

保留原有 `loadSnapshot` 与 `saveSnapshot`，让记录、复盘和专注功能不受影响。

在 `cloudfunctions/studyData/index.js` 中将保存校验替换为：

```js
const validItems = Array.isArray(event.items) || (
  event.name === 'tasks' && event.items && Array.isArray(event.items.tasks) && Array.isArray(event.items.categories)
);
if (!validItems) throw new Error('Invalid snapshot data');
```

- [ ] **Step 4: 运行云端客户端测试并确认通过**

Run: `node tests/cloud-store.test.cjs && node tests/cloud-data-isolation.test.cjs`

Expected: 依次输出 `cloud store configuration tests passed` 和 `cloud data isolation tests passed`。

- [ ] **Step 5: 提交云端兼容层**

```bash
git add miniprogram/utils/cloud-store.js cloudfunctions/studyData/index.js tests/cloud-store.test.cjs
git commit -m "feat: persist task categories with task snapshots"
```

### Task 3: 今日页分类交互

**Files:**
- Modify: `miniprogram/pages/index/index.js`

- [ ] **Step 1: 引入分类工具并替换固定“自定义”分类**

在文件顶部新增：

```js
const {
  DEFAULT_TASK_CATEGORIES, UNCATEGORIZED, normalizeTaskCategories,
  normalizeTaskSubjects, createCategory, renameCategory, deleteCategory
} = require('../../utils/task-categories');
```

将 `data.categories` 改为 `DEFAULT_TASK_CATEGORIES`，不再包含“自定义”。

- [ ] **Step 2: 使加载流程兼容本地和旧/新云端快照**

将 `onShow` 和 `load` 拆分为读取状态与渲染状态：

```js
loadLocalState() {
  const tasks = normalizeTaskSubjects(wx.getStorageSync('studyTasks') || []);
  const categories = normalizeTaskCategories(wx.getStorageSync('studyTaskCategories'));
  wx.setStorageSync('studyTasks', tasks);
  wx.setStorageSync('studyTaskCategories', categories);
  return { tasks, categories };
}
```

`onShow` 先加载本机状态，再调用 `cloudStore.loadTaskState()`；当云端返回数组时视为旧任务数组，当返回 `{ tasks, categories }` 时恢复完整状态。任何云端失败都被捕获，不影响本机显示。

- [ ] **Step 3: 保存任务与分类状态**

将 `persist(tasks)` 改为 `persist(tasks, categories = this.data.categories)`：规范化任务和分类，分别保存 `studyTasks` 与 `studyTaskCategories`，调用 `cloudStore.saveTaskState({ tasks: sorted, categories: cleanCategories })`，最后调用 `load()`。

新增任务对象使用：

```js
{ id: String(Date.now()), title, subject: UNCATEGORIZED, minutes: null, done: false, pinned: false, order: nextTopOrder(this.data.tasks) }
```

- [ ] **Step 4: 实现分类、新建和管理菜单**

实现以下页面方法：

```js
chooseCategory(e) {
  const id = e.currentTarget.dataset.id;
  const items = [...this.data.categories, '＋ 新建分类', '管理分类'];
  wx.showActionSheet({ itemList: items, success: ({ tapIndex }) => {
    if (tapIndex < this.data.categories.length) return this.persist(updateTask(this.data.tasks, id, { subject: this.data.categories[tapIndex] }));
    if (tapIndex === this.data.categories.length) return this.promptCreateCategory(id);
    this.manageCategories();
  }});
}
```

`promptCreateCategory(taskId)` 使用 `wx.showModal({ editable: true, placeholderText: '例如：通信原理' })`，调用 `createCategory`；失败时按错误码显示“分类名称不能为空”或“已有同名分类”，成功时更新当前任务分类并持久化。

`manageCategories()` 在分类列表为空时显示“还没有分类，可先新建分类”；否则先让用户选择分类，再显示“重命名”“删除”。重命名使用可编辑 `wx.showModal` 并调用 `renameCategory`。删除先显示内容为“分类下的任务将变为未分类，任务内容不会删除。”的确认框，确认后调用 `deleteCategory` 并持久化。

- [ ] **Step 5: 全量运行回归测试和语法检查**

Run:

```powershell
Get-ChildItem miniprogram,cloudfunctions -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
Get-ChildItem tests -Filter '*.test.cjs' | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: 所有 JavaScript 语法检查通过；所有测试分别输出 `... tests passed`，退出码为 0。

- [ ] **Step 6: 提交今日页功能**

```bash
git add miniprogram/pages/index/index.js
git commit -m "feat: manage task categories from today page"
```

### Task 4: 开发者工具验证与交付

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 在 README 的功能清单补充任务分类管理**

新增一行：

```markdown
- 今日任务分类：可新建、重命名、删除；删除分类后任务保留为“未分类”。
```

- [ ] **Step 2: 在微信开发者工具进行手动验证**

执行下列场景：

1. 左滑任务 → 分类 → 新建“通信原理”，确认当前任务显示该分类。
2. 管理“通信原理” → 重命名为“信号与系统”，确认关联任务同步更新。
3. 删除“信号与系统”，确认任务仍在且显示“未分类”。
4. 关闭并重新打开项目，确认分类与任务仍在。
5. 云函数部署后，在第二台设备或清除本机存储后验证云端恢复完整任务状态。

- [ ] **Step 3: 最终验证与提交**

Run: `git diff --check; git status --short`

Expected: `git diff --check` 无输出；状态只包含 README 修改。

```bash
git add README.md
git commit -m "docs: describe task category management"
git push origin master
```
