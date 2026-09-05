# 学习指挥台 1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在本机优先模式下交付周复盘、资料检索、真实提醒状态和合规知识来源目录。

**Architecture:** 新建四个纯函数工具模块，页面只负责渲染与事件处理。归档页消费周复盘、提醒和来源数据；记录/复盘页消费同一个不修改原数据的筛选器；今日页消费提醒状态。所有功能在 CloudBase 未授权时仍可运行。

**Tech Stack:** WeChat Mini Program WXML/WXSS/CommonJS，Node `assert` 测试，现有 `wx` 本机存储。

---

## 文件职责

- `miniprogram/utils/weekly-review.js`：滚动 7 日计划完成率、专注科目占比、到期薄弱分类与连续学习天数。
- `miniprogram/utils/study-filter.js`：兼容中文日期的月份归一化、筛选选项与非变异筛选。
- `miniprogram/utils/reminder-state.js`：本机到期提醒与“微信订阅未配置/待授权”真实状态。
- `miniprogram/utils/knowledge-sources.js`：高校公开资源和用户资料路径的静态目录。
- `tests/weekly-review.test.cjs`、`tests/study-filter.test.cjs`、`tests/reminder-state.test.cjs`、`tests/knowledge-sources.test.cjs`：纯函数回归测试。
- `miniprogram/pages/archive/*`：周复盘、来源和订阅状态卡片。
- `miniprogram/pages/index/*`：到期复盘横幅。
- `miniprogram/pages/record/*`、`miniprogram/pages/review/*`：关键词/科目/来源/月度筛选。

## Task 1: 周复盘计算模块

**Files:** Create `miniprogram/utils/weekly-review.js`; Create `tests/weekly-review.test.cjs`.

- [ ] **Step 1: 写失败测试**

```js
const assert = require('node:assert/strict');
const { buildWeeklyReview } = require('../miniprogram/utils/weekly-review');
const now = new Date('2026-09-05T12:00:00+08:00');
const summary = buildWeeklyReview({
  now,
  tasks: [
    { id: 'a', subject: '考研数学', createdAt: '2026-09-02T08:00:00+08:00', completedAt: '2026-09-03T08:00:00+08:00' },
    { id: 'b', subject: '硬件电路', createdAt: '2026-09-04T08:00:00+08:00' }
  ],
  sessions: [
    { subject: '考研数学', minutes: 60, endedAt: new Date('2026-09-04T08:00:00+08:00').getTime() },
    { subject: '硬件电路', minutes: 30, endedAt: new Date('2026-09-05T08:00:00+08:00').getTime() }
  ],
  reviews: [
    { type: '电路', next: '2026/9/4', mastered: false },
    { type: '电路', next: '2026/9/1', mastered: false },
    { type: '高数', next: '2026/9/3', mastered: false }
  ],
  activityDates: ['2026/9/3', '2026/9/4', '2026/9/5']
});
assert.deepEqual(summary.plan, { total: 2, completed: 1, percent: 50 });
assert.deepEqual(summary.subjects, [{ name: '考研数学', minutes: 60, percent: 67 }, { name: '硬件电路', minutes: 30, percent: 33 }]);
assert.deepEqual(summary.weakTopics, [{ name: '电路', dueCount: 2 }, { name: '高数', dueCount: 1 }]);
assert.equal(summary.streak, 3);
console.log('weekly review tests passed');
```

- [ ] **Step 2: 验证失败** — Run `node tests/weekly-review.test.cjs`; expected: missing module.

- [ ] **Step 3: 最小实现**

```js
const { dueReviews, parseChineseDate } = require('./review-status');
const DAY = 86400000;
const dayStart = value => { const date = new Date(value); return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); };
const withinWeek = (value, now) => { const day = dayStart(value); const end = dayStart(now) + DAY; return Number.isFinite(day) && day >= end - 7 * DAY && day < end; };
function buildWeeklyReview({ tasks = [], sessions = [], reviews = [], activityDates = [], now = new Date() }) {
  const weekTasks = tasks.filter(item => withinWeek(item.createdAt, now));
  const completed = weekTasks.filter(item => item.completedAt && withinWeek(item.completedAt, now)).length;
  const totals = sessions.filter(item => withinWeek(item.endedAt, now)).reduce((map, item) => { const name = String(item.subject || '未分类').trim() || '未分类'; map[name] = (map[name] || 0) + Number(item.minutes || 0); return map; }, {});
  const totalMinutes = Object.values(totals).reduce((sum, minutes) => sum + minutes, 0);
  const subjects = Object.entries(totals).map(([name, minutes]) => ({ name, minutes, percent: totalMinutes ? Math.round(minutes / totalMinutes * 100) : 0 })).sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name));
  const weak = dueReviews(reviews, now).reduce((map, item) => { const name = String(item.type || '未分类').trim() || '未分类'; map[name] = (map[name] || 0) + 1; return map; }, {});
  const weakTopics = Object.entries(weak).map(([name, dueCount]) => ({ name, dueCount })).sort((a, b) => b.dueCount - a.dueCount || a.name.localeCompare(b.name));
  const active = new Set(activityDates.map(parseChineseDate).filter(Boolean).map(dayStart)); let streak = 0; for (let day = dayStart(now); active.has(day); day -= DAY) streak += 1;
  return { plan: { total: weekTasks.length, completed, percent: weekTasks.length ? Math.round(completed / weekTasks.length * 100) : 0 }, totalMinutes, subjects, weakTopics, streak };
}
module.exports = { buildWeeklyReview };
```

- [ ] **Step 4: 验证通过** — Run `node tests/weekly-review.test.cjs`; expected: `weekly review tests passed`.
- [ ] **Step 5: 提交** — Stage only `weekly-review.js` and its test, then commit `feat: add weekly learning review metrics`.

## Task 2: 共享检索筛选模块

**Files:** Create `miniprogram/utils/study-filter.js`; Create `tests/study-filter.test.cjs`.

- [ ] **Step 1: 写失败测试**

```js
const assert = require('node:assert/strict');
const { monthKey, filterStudyItems, buildFilterOptions } = require('../miniprogram/utils/study-filter');
const records = [
  { id: 1, subject: '高数', source: 'Goodnotes', title: '极限错题', content: '夹逼准则', date: '2026/9/5 09:30' },
  { id: 2, subject: '硬件电路', source: 'WPS 扫描', title: '节点法', content: 'KCL', date: '2026/8/30 12:00' }
];
assert.equal(monthKey(records[0].date), '2026-09');
assert.deepEqual(buildFilterOptions(records, 'subject'), ['全部', '硬件电路', '高数']);
assert.deepEqual(filterStudyItems(records, { keyword: 'KCL', subject: '全部', source: '全部', month: '全部' }).map(item => item.id), [2]);
assert.deepEqual(filterStudyItems(records, { keyword: '', subject: '高数', source: 'Goodnotes', month: '2026-09' }).map(item => item.id), [1]);
assert.deepEqual(filterStudyItems(records, { keyword: 'missing', subject: '全部', source: '全部', month: '全部' }), []);
console.log('study filter tests passed');
```

- [ ] **Step 2: 验证失败** — Run `node tests/study-filter.test.cjs`; expected: missing module.

- [ ] **Step 3: 最小实现**

```js
function parseLocalDate(value) { const match = String(value || '').match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/); if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])); const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function monthKey(value) { const date = parseLocalDate(value); return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : '未记录月份'; }
function buildFilterOptions(items, field) { return ['全部', ...[...new Set((items || []).map(item => String(item[field] || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'))]; }
function filterStudyItems(items, filter) { const keyword = String(filter.keyword || '').trim().toLowerCase(); return (items || []).filter(item => { const text = [item.title, item.content, item.subject, item.type, item.source, item.sourceLabel, ...(item.files || []).map(file => file.name)].join('\n').toLowerCase(); const subject = item.subject || item.type; const source = item.source || item.sourceLabel || '手动录入'; return (!keyword || text.includes(keyword)) && (filter.subject === '全部' || subject === filter.subject) && (filter.source === '全部' || source === filter.source) && (filter.month === '全部' || monthKey(item.date || item.created || item.masteredAt) === filter.month); }); }
module.exports = { monthKey, buildFilterOptions, filterStudyItems };
```

- [ ] **Step 4: 验证通过** — Run `node tests/study-filter.test.cjs`; expected: `study filter tests passed`.
- [ ] **Step 5: 提交** — Commit only this utility and test as `feat: add study record filtering`.

## Task 3: 提醒状态与知识来源元数据

**Files:** Create `miniprogram/utils/reminder-state.js`, `miniprogram/utils/knowledge-sources.js`, `tests/reminder-state.test.cjs`, `tests/knowledge-sources.test.cjs`.

- [ ] **Step 1: 写失败测试**

```js
const assert = require('node:assert/strict');
const { buildReminderState } = require('../miniprogram/utils/reminder-state');
const { KNOWLEDGE_SOURCES } = require('../miniprogram/utils/knowledge-sources');
assert.deepEqual(buildReminderState({ dueCount: 2, missedDays: 1, subscriptionTemplateIds: [] }), { dueCount: 2, title: '有 2 条复盘已到期', message: '已间隔 1 天，先处理最早的一条。', subscription: '未配置' });
assert.equal(KNOWLEDGE_SOURCES[0].subject, '电路');
assert.equal(KNOWLEDGE_SOURCES[0].url.startsWith('https://'), true);
console.log('reminder and sources tests passed');
```

- [ ] **Step 2: 验证失败** — Run `node tests/reminder-state.test.cjs` and `node tests/knowledge-sources.test.cjs`; expected: missing modules.

- [ ] **Step 3: 最小实现**

```js
function buildReminderState({ dueCount = 0, missedDays = 0, subscriptionTemplateIds = [] }) { const configured = Array.isArray(subscriptionTemplateIds) && subscriptionTemplateIds.length > 0; if (dueCount) return { dueCount, title: `有 ${dueCount} 条复盘已到期`, message: missedDays ? `已间隔 ${missedDays} 天，先处理最早的一条。` : '先完成最早的一条；订阅消息仍待配置。', subscription: configured ? '待授权' : '未配置' }; return { dueCount: 0, title: '今天没有到期复盘', message: configured ? '订阅消息可在授权后使用。' : '本机提醒已启用；微信订阅消息待配置。', subscription: configured ? '待授权' : '未配置' }; }
module.exports = { buildReminderState };
```

```js
const KNOWLEDGE_SOURCES = [
  { id: 'xidian-circuit', subject: '电路', title: '西电｜电路分析基础公开课程资源', topics: '基本定律、网络、动态、正弦稳态、频响、二端口', usage: '公开课程链接；仅复制链接，不保存教材全文', url: 'https://web.xidian.edu.cn/lyang/kcjx.html' },
  { id: 'hardware-notes', subject: '硬件/模电', title: '个人资料卡与公开课件', topics: '器件、放大、反馈、运放、电源、原理图与调试', usage: '上传自己的笔记、扫描件或公开课件后再做复盘', url: '' },
  { id: 'math-domestic', subject: '高数', title: '国内高数教材章节索引', topics: '极限、微分、积分、多元微积分、级数、常微分方程、数一题型', usage: '默认同济体系；教材内容以本人上传页面和笔记为准', url: '' },
  { id: 'english-personal', subject: '英语', title: '个人词表与外刊摘记', topics: '真题词汇、错词、词根词缀、外刊生词', usage: '从自己的词表或外刊摘记建立资料卡，不抓取商业词库', url: '' }
];
module.exports = { KNOWLEDGE_SOURCES };
```

- [ ] **Step 4: 验证通过** — Run both tests; expected: each prints its success message.
- [ ] **Step 5: 提交** — Commit only the two modules and tests as `feat: add transparent reminder and source states`.

## Task 4: 归档与今日页接线

**Files:** Modify `miniprogram/pages/archive/archive.js`, `.wxml`, `.wxss`; modify `miniprogram/pages/index/index.js`, `.wxml`, `.wxss`.

- [ ] **Step 1: 先扩展周复盘测试的空状态断言**

```js
const empty = buildWeeklyReview({ tasks: [], sessions: [], reviews: [], activityDates: [], now: new Date('2026-09-05T12:00:00+08:00') });
assert.deepEqual(empty.plan, { total: 0, completed: 0, percent: 0 });
assert.deepEqual(empty.weakTopics, []);
```

- [ ] **Step 2: 运行测试** — Run `node tests/weekly-review.test.cjs`; expected: PASS.

- [ ] **Step 3: Archive JS 集成**

Add imports for `buildWeeklyReview`, `buildReminderState`, `KNOWLEDGE_SOURCES`. In `onShow`, calculate from `studyTasks`, `focusSessions`, `reviewItems`, `studyActiveDates`, and `reviewCoach.missedDays`; put `weeklyReview`, `reminderState`, and `knowledgeSources` in data before any optional cloud request. Add `goReview()` with `wx.switchTab({ url: '/pages/review/review' })`. Add `copySource(e)`: empty URL shows `该来源请通过自己的资料卡补充`; otherwise `wx.setClipboardData` copies only the URL.

- [ ] **Step 4: Archive WXML 与样式**

Render before existing “近 7 天专注看板”:

```xml
<view class="card weekly-review-card"><view class="backup-title">本周学习复盘</view><view class="review-grid"><view><text class="review-number">{{weeklyReview.plan.percent}}%</text><text>计划完成</text></view><view><text class="review-number">{{weeklyReview.totalMinutes}}</text><text>专注分钟</text></view><view><text class="review-number">{{weeklyReview.streak}}</text><text>连续学习</text></view></view><view wx:if="{{weeklyReview.weakTopics.length}}" class="weak-box"><text>建议优先复盘：</text><text wx:for="{{weeklyReview.weakTopics}}" wx:key="name">{{item.name}} {{item.dueCount}} 条</text></view><view wx:else class="muted">本周还没有到期薄弱项，继续把新错题放入复盘队列。</view></view>
```

Add a second card for `reminderState` with only a `goReview` button when `dueCount > 0`, and a source directory that displays `title`, `topics`, `usage`, and `复制链接` only if `url` exists. Add responsive three-column `.review-grid`, wrapping `.source-row`, and muted no-URL text.

- [ ] **Step 5: Today JS/WXML 集成**

Calculate `reminderState` inside existing `load()` after `reviewCoach`; insert before “今日任务”:

```xml
<view wx:if="{{reminderState.dueCount}}" class="card reminder-banner"><view><view class="reminder-title">{{reminderState.title}}</view><view class="muted">{{reminderState.message}}</view></view><button size="mini" bindtap="goReview">去复盘</button></view>
```

Add `.reminder-banner` as a horizontal flexible card, no system notification claim.

- [ ] **Step 6: 验证与提交** — Run `node --check miniprogram/pages/archive/archive.js`, `node --check miniprogram/pages/index/index.js`, `node tests/weekly-review.test.cjs`; then commit relevant pages and test as `feat: show weekly review and reminder readiness`.

## Task 5: 记录与复盘筛选界面

**Files:** Modify `miniprogram/pages/record/record.js`, `.wxml`, `.wxss`; modify `miniprogram/pages/review/review.js`, `.wxml`, `.wxss`.

- [ ] **Step 1: 运行现有筛选测试** — Run `node tests/study-filter.test.cjs`; expected: PASS.

- [ ] **Step 2: Record JS 集成**

Import `monthKey`, `buildFilterOptions`, `filterStudyItems`. Add `filter: { keyword: '', subject: '全部', source: '全部', month: '全部' }` and `filterOptions` to data. Preserve full normalized `records`; derive `visible = filterStudyItems(records, this.data.filter)` only for `buildFolders(visible, categories)`. Add `setFilterKeyword`, `pickFilterSubject`, `pickFilterSource`, `pickFilterMonth`, `clearFilter`, all of which modify only page state then rederive folders. Generate month options as `['全部', ...new Set(records.map(item => monthKey(item.date)))]` sorted descending.

- [ ] **Step 3: Record WXML/WXSS 集成**

Directly under “学习收藏夹” add an input and three horizontal chip rows. Use this structure:

```xml
<view class="filter-card"><input value="{{filter.keyword}}" placeholder="搜索标题、正文或附件名" bindinput="setFilterKeyword"/><scroll-view scroll-x class="filter-row"><text wx:for="{{filterOptions.subjects}}" wx:key="*this" class="filter-chip {{filter.subject===item?'active':''}}" data-value="{{item}}" bindtap="pickFilterSubject">{{item}}</text></scroll-view><scroll-view scroll-x class="filter-row"><text wx:for="{{filterOptions.sources}}" wx:key="*this" class="filter-chip {{filter.source===item?'active':''}}" data-value="{{item}}" bindtap="pickFilterSource">{{item}}</text></scroll-view><scroll-view scroll-x class="filter-row"><text wx:for="{{filterOptions.months}}" wx:key="*this" class="filter-chip {{filter.month===item?'active':''}}" data-value="{{item}}" bindtap="pickFilterMonth">{{item}}</text></scroll-view><text class="clear-filter" bindtap="clearFilter">清空筛选</text></view>
```

Keep record pin/delete/copy/review actions unchanged because their handlers use `records`, not the filtered folder copy.

- [ ] **Step 4: Review JS/WXML 集成**

Apply the same state and event names. While deriving options, map each review to a transient `{ ...item, subject: item.type, source: item.sourceLabel || '手动录入', date: item.created || item.masteredAt }`, filter it, then build active folders and filtered mastered items. Add an empty state only when a non-default filter is active and no active or mastered match exists. Preserve review, master, undo, delete and related-record handlers against original ids.

- [ ] **Step 5: 统一样式与验证**

Add `.filter-card`, `.filter-row`, `.filter-chip`, `.filter-chip.active`, `.clear-filter` to both WXSS files. Chips must wrap/scroll and never cover swipe actions. Run `node --check miniprogram/pages/record/record.js`, `node --check miniprogram/pages/review/review.js`, and `node tests/study-filter.test.cjs`.

- [ ] **Step 6: 提交** — Commit only pages, filter utility, and test as `feat: search and filter study materials`.

## Task 6: 回归、更新说明与交付

**Files:** Modify `CHANGELOG.md` only if it exists.

- [ ] **Step 1: 添加 1.2 说明**

```markdown
## 1.2

- 新增本周学习复盘、薄弱知识点与科目投入统计。
- 记录与复盘支持关键词、分类、来源、月份检索。
- 新增本机复盘提醒和透明的微信订阅消息配置状态。
- 新增高校公开资料与个人教材资料的知识来源目录。
```

- [ ] **Step 2: 跑全量单测**

Run:

```powershell
$tests = Get-ChildItem tests -Filter '*.test.cjs' | Sort-Object Name
foreach ($test in $tests) { node $test.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: all test files print their pass messages; process exits `0`.

- [ ] **Step 3: 跑语法和空白检查**

Run:

```powershell
$scripts = Get-ChildItem miniprogram -Recurse -Filter '*.js' | Where-Object { $_.FullName -notmatch '\\components\\agent-ui\\' }
foreach ($script in $scripts) { node --check $script.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
git diff --check
```

Expected: exit `0`; no whitespace error.

- [ ] **Step 4: DevTools 冒烟检查**

Recompile and verify: Archive empty/nonempty weekly cards; Record/Review filters preserve delete/pin/copy/review; Today’s due reminder routes to Review; source link copies only actual URLs; no card says a cloud push happened.

- [ ] **Step 5: 提交交付文档**

Stage only the changelog and this plan. Never stage `project.config.json`, because it is a user/DevTools-owned working-tree modification. Commit `docs: document learning command center 1.2`.
