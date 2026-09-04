# Learning Visual Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify focus-session categories with Today tasks and make focus time plus spaced repetition progress visual and actionable.

**Architecture:** Keep data local and dependency-free. Pure utilities build focus attribution options, dashboard series, and Ebbinghaus curve data; pages only render those prepared objects. This keeps statistics reliable, testable, and ready for CloudBase sync later.

**Tech Stack:** WeChat Mini Program JavaScript, WXML/WXSS, Node.js assertion tests, native Canvas.

---

### Task 1: Use Today categories in Focus attribution

**Files:**
- Create: `miniprogram/utils/focus-attribution.js`
- Create: `tests/focus-attribution.test.cjs`
- Modify: `miniprogram/pages/focus/focus.js`
- Modify: `miniprogram/pages/focus/focus.wxml`

- [ ] **Step 1: Write the failing tests**

```js
const { buildFocusAttribution } = require('../miniprogram/utils/focus-attribution');
const options = buildFocusAttribution(
  [{ id: '1', title: '刷题', subject: '高等数学', done: false }],
  ['专业基础', '高等数学']
);
assert.deepEqual(options.subjectOptions, ['未分类', '专业基础', '高等数学']);
assert.equal(options.taskOptions[1].title, '刷题');
```

- [ ] **Step 2: Run the test and verify it fails because the utility is absent**

Run: `node tests/focus-attribution.test.cjs`

- [ ] **Step 3: Implement the pure builder and consume `studyTaskCategories` in Focus**

```js
const savedCategories = wx.getStorageSync('studyTaskCategories') || [];
const attribution = buildFocusAttribution(wx.getStorageSync('studyTasks') || [], savedCategories);
this.setData(attribution);
```

- [ ] **Step 4: Rename the labels in the focus UI to `专注科目` and `关联任务（可选）`**

- [ ] **Step 5: Re-run the focused test and commit**

Run: `node tests/focus-attribution.test.cjs`

### Task 2: Add a seven-day focus dashboard to Archive

**Files:**
- Modify: `miniprogram/utils/focus-statistics.js`
- Modify: `tests/focus-statistics.test.cjs`
- Modify: `miniprogram/pages/archive/archive.js`
- Modify: `miniprogram/pages/archive/archive.wxml`
- Modify: `miniprogram/pages/archive/archive.wxss`

- [ ] **Step 1: Write failing tests for seven calendar days and normalized bars**

```js
const dashboard = buildFocusDashboard([{ endedAt: now, minutes: 30, subject: '高数' }], now);
assert.equal(dashboard.daily.length, 7);
assert.equal(dashboard.daily.at(-1).minutes, 30);
assert.equal(dashboard.subjects[0].percent, 100);
```

- [ ] **Step 2: Run the test and verify `buildFocusDashboard` is missing**

Run: `node tests/focus-statistics.test.cjs`

- [ ] **Step 3: Implement the pure dashboard builder**

Build last-seven-day totals, category/task totals, and render-ready heights/percentages. Never invent minutes for missing days.

- [ ] **Step 4: Render the native visual cards**

Render a vertical daily bar chart with dates on the x-axis and minutes on the y-axis, then horizontal subject and task contribution bars below it.

- [ ] **Step 5: Run focus-statistics tests and commit**

Run: `node tests/focus-statistics.test.cjs`

### Task 3: Show the active item’s Ebbinghaus curve on Review

**Files:**
- Create: `miniprogram/utils/review-curve.js`
- Create: `tests/review-curve.test.cjs`
- Modify: `miniprogram/pages/review/review.js`
- Modify: `miniprogram/pages/review/review.wxml`
- Modify: `miniprogram/pages/review/review.wxss`

- [ ] **Step 1: Write failing tests for curve milestones**

```js
const model = buildReviewCurve({ stage: 2, type: '错题', content: '拉普拉斯变换' });
assert.deepEqual(model.milestones.map(node => node.status), ['done', 'done', 'current', 'future', 'future', 'future']);
assert.ok(model.points[0].retention > model.points.at(-1).retention);
```

- [ ] **Step 2: Run the test and verify it fails because the utility is absent**

Run: `node tests/review-curve.test.cjs`

- [ ] **Step 3: Implement the curve model**

Use the existing 1/2/4/7/15/30-day schedule. A single unmastered due item is selected first; otherwise the closest upcoming item. Mark completed nodes blue, the next node orange, and later nodes grey.

- [ ] **Step 4: Render the curve and milestone timeline**

Draw a dependency-free Canvas curve in the Review page and show the selected item title, stage, and next review date. If no active items exist, show an explicit empty state.

- [ ] **Step 5: Run review curve tests and commit**

Run: `node tests/review-curve.test.cjs`

### Task 4: Verify and publish

**Files:**
- Modify: no additional production files

- [ ] **Step 1: Run the complete test suite**

Run: `Get-ChildItem tests/*.test.cjs | ForEach-Object { node $_.FullName }`

- [ ] **Step 2: Inspect the diff and preserve the DevTools-owned project config**

Run: `git status --short; git diff --check`

- [ ] **Step 3: Commit feature work and push to the existing GitHub remote**

```bash
git add miniprogram tests docs/superpowers
git commit -m "feat: visualize focus and review progress"
git push origin master
```
