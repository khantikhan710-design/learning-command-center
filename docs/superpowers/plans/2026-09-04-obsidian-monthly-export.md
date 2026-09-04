# Obsidian 月度导出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** 在归档页按月汇总任务、记录和复盘，并一键复制可粘贴到 Obsidian 的 Markdown 笔记。

**Architecture:** 纯工具模块负责月份判定与 Markdown 生成；任务工具模块负责创建/完成日期；归档页面只读取本地数据、展示统计并调用剪贴板 API。

**Tech Stack:** 微信小程序原生 JavaScript/WXML/WXSS、Node \`assert\` 测试、Obsidian Markdown。

---

### Task 1: 为任务写入可归档日期

**Files:**
- Modify: \`miniprogram/utils/task-actions.js\`
- Modify: \`tests/task-actions.test.cjs\`
- Modify: \`miniprogram/pages/index/index.js\`

- [ ] **Step 1: 写入失败测试**

\`\`\`js
const { createTask, toggleTaskDone } = require('../miniprogram/utils/task-actions');
const created = createTask([], { id: 'new', title: '导出测试', subject: '电路', minutes: null }, '2026-09-04T08:00:00.000Z');
assert.equal(created[0].createdAt, '2026-09-04T08:00:00.000Z');
const completed = toggleTaskDone(created, 'new', '2026-09-05T08:00:00.000Z');
assert.equal(completed[0].completedAt, '2026-09-05T08:00:00.000Z');
const restored = toggleTaskDone(completed, 'new', '2026-09-06T08:00:00.000Z');
assert.equal(Object.hasOwn(restored[0], 'completedAt'), false);
\`\`\`

- [ ] **Step 2: 运行确认失败**

Run: \`node tests/task-actions.test.cjs\`  
Expected: \`createTask is not a function\`。

- [ ] **Step 3: 最小实现**

在 \`task-actions.js\` 增加并导出：

\`\`\`js
function createTask(tasks, task, now = new Date().toISOString()) {
  return [...tasks, { ...task, createdAt: now }];
}
function toggleTaskDone(tasks, id, now = new Date().toISOString()) {
  return tasks.map(task => {
    if (task.id !== id) return task;
    if (!task.done) return { ...task, done: true, completedAt: now };
    const { completedAt, ...restored } = task;
    return { ...restored, done: false };
  });
}
\`\`\`

在 \`index.js\` 的 \`toggle\` 调用 \`toggleTaskDone(this.data.tasks, id)\`；\`addTask\` 调用 \`createTask(this.data.tasks, task)\`，并保留 \`order: nextTopOrder(this.data.tasks)\`。

- [ ] **Step 4: 验证并提交**

Run: \`node tests/task-actions.test.cjs\`  
Expected: \`task action tests passed\`

\`\`\`bash
git add miniprogram/utils/task-actions.js miniprogram/pages/index/index.js tests/task-actions.test.cjs
git commit -m "feat: timestamp tasks for monthly archives"
\`\`\`

### Task 2: 将任务加入月度文件夹

**Files:**
- Modify: \`miniprogram/utils/archive-folders.js\`
- Modify: \`tests/archive-folders.test.cjs\`

- [ ] **Step 1: 写入失败测试**

\`\`\`js
const tasks = [
  { id: 't1', createdAt: '2026-09-01T08:00:00.000Z', done: false },
  { id: 't2', completedAt: '2026-08-30T08:00:00.000Z', done: true },
  { id: 'legacy', title: '旧任务，无日期' }
];
const folders = buildMonthlyFolders(records, reviews, tasks);
assert.deepEqual(folders.map(folder => [folder.key, folder.taskCount]), [['2026-09', 1], ['2026-08', 1]]);
\`\`\`

- [ ] **Step 2: 运行确认失败**

Run: \`node tests/archive-folders.test.cjs\`  
Expected: 任务数量断言失败。

- [ ] **Step 3: 最小实现**

将签名改为 \`buildMonthlyFolders(records, reviews, tasks = [])\`。每个桶使用 \`{ key, records: [], reviews: [], tasks: [] }\`。对每个任务仅从 \`createdAt\` 和 \`completedAt\` 的有效月份建桶，同一任务在同一个月只加入一次；旧任务没有日期时跳过。返回对象增加 \`taskCount: folder.tasks.length\`。

- [ ] **Step 4: 验证并提交**

Run: \`node tests/archive-folders.test.cjs\`  
Expected: \`archive folder tests passed\`

\`\`\`bash
git add miniprogram/utils/archive-folders.js tests/archive-folders.test.cjs
git commit -m "feat: include dated tasks in monthly archives"
\`\`\`

### Task 3: 生成 Obsidian Markdown

**Files:**
- Create: \`miniprogram/utils/obsidian-export.js\`
- Create: \`tests/obsidian-export.test.cjs\`

- [ ] **Step 1: 写入失败测试**

\`\`\`js
const { buildMonthlyMarkdown } = require('../miniprogram/utils/obsidian-export');
const markdown = buildMonthlyMarkdown({
  key: '2026-09', label: '2026 年 09 月',
  tasks: [{ title: '电路刷题', subject: '专业基础', createdAt: '2026-09-01T08:00:00.000Z', done: true, completedAt: '2026-09-02T08:00:00.000Z' }],
  records: [{ subject: '硬件电路', content: '完成原理图', images: ['cloud://x'], files: [{ name: '原理图.pdf' }] }],
  reviews: [{ type: '概念', content: '复习戴维南定理', mastered: true }]
}, '2026-09-04');
assert.match(markdown, /title: "学习归档-2026-09"/);
assert.match(markdown, /- \[x\] 电路刷题（专业基础）/);
assert.match(markdown, /### 硬件电路/);
assert.match(markdown, /原理图.pdf/);
assert.match(markdown, /- \[x\] 复习戴维南定理/);
\`\`\`

- [ ] **Step 2: 运行确认失败**

Run: \`node tests/obsidian-export.test.cjs\`  
Expected: \`Cannot find module\`。

- [ ] **Step 3: 最小实现**

创建 \`obsidian-export.js\` 并导出 \`buildMonthlyMarkdown(folder, exportedOn)\`。输出 YAML frontmatter：

\`\`\`md
---
title: "学习归档-2026-09"
tags: [学习归档, 2026年09月]
exported: 2026-09-04
---
\`\`\`

之后依次生成“本月概览”“本月任务”“学习记录”“复盘条目”“附件索引”。任务用 \`- [x]\` 或 \`- [ ]\`；记录、复盘按学科/分类分组；空记录写“附件记录”；附件列出图片数量和文件名；任何空分组写 \`- 无\`。

- [ ] **Step 4: 验证并提交**

Run: \`node tests/obsidian-export.test.cjs\`  
Expected: \`obsidian export tests passed\`

\`\`\`bash
git add miniprogram/utils/obsidian-export.js tests/obsidian-export.test.cjs
git commit -m "feat: generate Obsidian monthly markdown"
\`\`\`

### Task 4: 接入归档页面

**Files:**
- Modify: \`miniprogram/pages/archive/archive.js\`
- Modify: \`miniprogram/pages/archive/archive.wxml\`
- Modify: \`miniprogram/pages/archive/archive.wxss\`

- [ ] **Step 1: 读取任务并汇总**

在 \`onShow\` 读取 \`const localTasks = wx.getStorageSync('studyTasks') || [];\`，将 \`setEntries\` 改为接收 \`tasks\`，调用 \`buildMonthlyFolders(records, reviews, tasks)\`。云端读取失败继续使用本地任务、记录和复盘。

- [ ] **Step 2: 添加复制处理器**

\`\`\`js
copyObsidian(e) {
  const folder = this.data.folders.find(item => item.key === e.currentTarget.dataset.key);
  if (!folder) return;
  wx.setClipboardData({
    data: buildMonthlyMarkdown(folder, new Date().toISOString().slice(0, 10)),
    success: () => wx.showToast({ title: '已复制，可粘贴到 Obsidian', icon: 'success' })
  });
}
\`\`\`

- [ ] **Step 3: 添加导出界面**

月度统计增加 \`任务 {{item.taskCount}} 项\`。在展开内容顶部新增：

\`\`\`xml
<button size="mini" class="copy-obsidian" data-key="{{item.key}}" bindtap="copyObsidian">复制 Obsidian Markdown</button>
\`\`\`

添加与现有浅蓝按钮一致的样式，并在展开内容显示任务标题、学科与完成状态。

- [ ] **Step 4: 全量验证并提交**

Run:

\`\`\`powershell
Get-ChildItem tests -Filter '*.test.cjs' | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
\`\`\`

Expected: 所有测试输出 \`passed\` 且退出码为 0。

\`\`\`bash
git add miniprogram/pages/archive/archive.js miniprogram/pages/archive/archive.wxml miniprogram/pages/archive/archive.wxss
git commit -m "feat: export monthly archive to Obsidian markdown"
\`\`\`

