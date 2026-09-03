# 任务滑动操作与临时离开摘要 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为今日任务增加滑动管理操作，并在严格专注返回时保留临时离开实际用时。

**Architecture:** `utils/task-actions.js` 负责纯任务排序与更新，便于 Node 测试；今日页负责手势和微信交互。`utils/focus-guard.js` 提供离开秒数格式化，专注页只保存和展示结果。

**Tech Stack:** 微信小程序原生 WXML/WXSS/JavaScript、`wx.getStorageSync`、Node `assert`。

---

### Task 1: 可测试的任务操作工具

**Files:**
- Create: `C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\utils\task-actions.js`
- Create: `C:\Users\zly88\WeChatProjects\miniprogram-1\tests\task-actions.test.cjs`

- [ ] **Step 1: 写失败测试**

```js
const assert = require('node:assert/strict');
const { sortTasks, updateTask, removeTask } = require('../miniprogram/utils/task-actions');
const tasks = [{ id: 'a', pinned: false }, { id: 'b', pinned: true }, { id: 'c', pinned: false }];
assert.deepEqual(sortTasks(tasks).map(x => x.id), ['b', 'a', 'c']);
assert.equal(updateTask(tasks, 'a', { subject: 'AI 学习' })[0].subject, 'AI 学习');
assert.deepEqual(removeTask(tasks, 'b').map(x => x.id), ['a', 'c']);
```

- [ ] **Step 2: 运行失败测试**

Run: `node C:\Users\zly88\WeChatProjects\miniprogram-1\tests\task-actions.test.cjs`

Expected: `MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现最小工具函数**

```js
function sortTasks(tasks) { return [...tasks].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))); }
function updateTask(tasks, id, patch) { return tasks.map(task => task.id === id ? { ...task, ...patch } : task); }
function removeTask(tasks, id) { return tasks.filter(task => task.id !== id); }
module.exports = { sortTasks, updateTask, removeTask };
```

- [ ] **Step 4: 运行通过测试**

Run: `node C:\Users\zly88\WeChatProjects\miniprogram-1\tests\task-actions.test.cjs`

Expected: 退出码 `0`。

### Task 2: 今日页滑动操作

**Files:**
- Modify: `C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\pages\index\index.js`
- Modify: `C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\pages\index\index.wxml`
- Modify: `C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\pages\index\index.wxss`

- [ ] **Step 1: 增加页面状态**

```js
data: { activeTaskId: '', touchStartX: 0, categories: ['考研数学','专业基础','硬件电路','英语','AI 学习','自定义'] }
```

- [ ] **Step 2: 实现手势与操作**

```js
onTaskTouchStart(e) { this.setData({ touchStartX: e.touches[0].clientX }); }
onTaskTouchEnd(e) { if (e.changedTouches[0].clientX - this.data.touchStartX < -50) this.setData({ activeTaskId: e.currentTarget.dataset.id }); }
togglePin(e) { this.persist(updateTask(this.data.tasks, e.currentTarget.dataset.id, { pinned: !e.currentTarget.dataset.pinned })); }
chooseCategory(e) { wx.showActionSheet({ itemList: this.data.categories, success: r => this.persist(updateTask(this.data.tasks, e.currentTarget.dataset.id, { subject: this.data.categories[r.tapIndex] })) }); }
confirmDelete(e) { wx.showModal({ title: '删除任务？', content: '删除后无法恢复。', success: r => r.confirm && this.persist(removeTask(this.data.tasks, e.currentTarget.dataset.id)) }); }
```

- [ ] **Step 3: 绑定 WXML**

每张任务卡以 `catchtouchstart` 和 `catchtouchend` 绑定手势；仅当 `activeTaskId === item.id` 时显示置顶、分类、删除按钮。三个按钮使用 `catchtap`，避免触发完成状态。

- [ ] **Step 4: 写样式**

操作区按效果图使用黄色置顶、蓝色分类、红色删除；卡片收起时不占额外高度，展开时按钮在卡片右侧。

- [ ] **Step 5: 手动验证**

在开发者工具中验证：滑动、置顶排序、分类刷新、取消删除、确认删除，以及点击完成和时长选择仍正常。

### Task 3: 临时离开实际用时

**Files:**
- Modify: `C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\utils\focus-guard.js`
- Modify: `C:\Users\zly88\WeChatProjects\miniprogram-1\tests\focus-guard.test.cjs`
- Modify: `C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\pages\focus\focus.js`
- Modify: `C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\pages\focus\focus.wxml`

- [ ] **Step 1: 写失败测试**

```js
assert.equal(formatElapsed(138), '2 分 18 秒');
assert.equal(formatElapsed(0), '0 秒');
```

- [ ] **Step 2: 添加实现并测试通过**

```js
function formatElapsed(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return minutes ? `${minutes} 分 ${remain} 秒` : `${remain} 秒`;
}
```

- [ ] **Step 3: 在离开和返回时保存摘要**

严格专注的 `onHide` 创建临时离开时同时设置 `breakStartAt: Date.now()` 和 `lastBreakText: ''`。`endBreak('returned')` 用 `Math.min(300, Math.floor((Date.now() - this.data.breakStartAt) / 1000))` 计算并设置 `lastBreakText`；下一次开始离开时清除旧摘要。

- [ ] **Step 4: 展示摘要并验证**

严格专注卡在 `lastBreakText` 非空时显示 `本次临时离开：已用 {{lastBreakText}}`。验证返回时出现、开始下一次离开时消失。

### Task 4: 全量检查

**Files:**
- Test: `C:\Users\zly88\WeChatProjects\miniprogram-1\tests\*.test.cjs`

- [ ] **Step 1: 执行测试和语法检查**

Run:

```powershell
node C:\Users\zly88\WeChatProjects\miniprogram-1\tests\task-actions.test.cjs
node C:\Users\zly88\WeChatProjects\miniprogram-1\tests\focus-guard.test.cjs
node C:\Users\zly88\WeChatProjects\miniprogram-1\tests\timer.test.cjs
node --check C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\pages\index\index.js
node --check C:\Users\zly88\WeChatProjects\miniprogram-1\miniprogram\pages\focus\focus.js
```

Expected: 全部退出码为 `0`。

- [ ] **Step 2: 开发者工具编译检查**

按 `Ctrl + R`，确认没有红色编译错误。
