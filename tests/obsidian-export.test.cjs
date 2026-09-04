const assert = require('node:assert/strict');
const { buildMonthlyMarkdown } = require('../miniprogram/utils/obsidian-export');

const markdown = buildMonthlyMarkdown({
  key: '2026-09',
  label: '2026 年 09 月',
  records: [{ id: 'r1', subject: '硬件电路', content: '完成原理图设计', images: ['cloud://image-a'], files: [{ name: '原理图.pdf' }] }],
  reviews: [{ id: 'v1', type: '概念', content: '复习节点电压法', mastered: true }],
  tasks: [{ id: 't1', title: '电路刷题', subject: '专业基础', done: true, createdAt: '2026-09-01T04:00:00.000Z', completedAt: '2026-09-03T04:00:00.000Z' }]
}, '2026-09-04');

assert.match(markdown, /title: "学习归档-2026-09"/);
assert.match(markdown, /## 本月任务/);
assert.match(markdown, /### 本月新增[\s\S]*- \[x\] 电路刷题（专业基础）/);
assert.match(markdown, /### 本月完成[\s\S]*- \[x\] 电路刷题（专业基础）/);
assert.match(markdown, /### 硬件电路[\s\S]*完成原理图设计/);
assert.match(markdown, /### 概念[\s\S]*- \[x\] 复习节点电压法/);
assert.match(markdown, /原理图.pdf/);
assert.match(markdown, /图片 1 张/);
console.log('obsidian export tests passed');
