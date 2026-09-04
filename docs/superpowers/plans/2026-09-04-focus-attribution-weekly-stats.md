# 专注归属与周统计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Record each completed focus session with an optional subject/task and show its current-week summary.

**Architecture:** focus-statistics is a pure local-data module. Focus page reads current tasks/categories, stores a session snapshot under focusSessions, and Archive renders the weekly aggregate. Existing focusMinutes and cloud calls remain compatible.

**Tech Stack:** WeChat Mini Program JS/WXML/WXSS, wx storage, Node assert.

---

### Task 1: Statistics utility

**Files:** Create miniprogram/utils/focus-statistics.js; Create tests/focus-statistics.test.cjs

- [ ] Write failing tests for week filtering and totals:

~~~
const assert = require('node:assert/strict');
const { sessionsForWeek, summarizeSessions } = require('../miniprogram/utils/focus-statistics');
const now = new Date('2026-09-04T12:00:00+08:00').getTime();
const sessions = [
 { minutes: 30, endedAt: new Date('2026-09-01T08:00:00+08:00').getTime(), subject: '考研数学', taskTitle: '欧几里得刷题' },
 { minutes: 20, endedAt: new Date('2026-09-04T09:00:00+08:00').getTime(), subject: '英语', taskTitle: '' },
 { minutes: 50, endedAt: new Date('2026-08-30T09:00:00+08:00').getTime(), subject: '考研数学' }
];
assert.equal(sessionsForWeek(sessions, now).length, 2);
assert.deepEqual(summarizeSessions(sessionsForWeek(sessions, now)), {
 totalMinutes: 50,
 subjects: [{ name: '考研数学', minutes: 30 }, { name: '英语', minutes: 20 }],
 tasks: [{ name: '欧几里得刷题', minutes: 30 }]
});
console.log('focus statistics tests passed');
~~~

- [ ] Run node tests\focus-statistics.test.cjs; expect module-not-found.
- [ ] Implement sessionsForWeek using local Monday 00:00 and summarizeSessions using stable descending-minute groups; map missing subject to 未分类 and omit missing task titles.
- [ ] Re-run test; expect focus statistics tests passed.
- [ ] Commit: git add miniprogram/utils/focus-statistics.js tests/focus-statistics.test.cjs; git commit -m "feat: add focus statistics utility"

### Task 2: Optional focus attribution

**Files:** Modify miniprogram/pages/focus/focus.js; Modify miniprogram/pages/focus/focus.wxml; Modify miniprogram/pages/focus/focus.wxss

- [ ] In onShow load studyTasks and taskCategories. Build taskOptions as [{id:'',title:'不关联具体任务',subject:''}] plus every unfinished task. Build subjectOptions as ['未分类'] plus taskCategories.
- [ ] Add data selectedSubject:'未分类', selectedTaskId:'', selectedTaskTitle:'', subjectOptions:[], taskOptions:[].
- [ ] Add picker handlers: choosing a task writes its id/title and its subject (when present); choosing subject clears only the task selection.
- [ ] Add this WXML card before the timer:

~~~
<view class="card attribution"><view class="picker-title">本轮归属（可不选）</view><picker mode="selector" range="{{subjectOptions}}" value="{{subjectIndex}}" bindchange="pickSubject"><view class="attribution-row">科目：{{selectedSubject}} <text>选择 ›</text></view></picker><picker mode="selector" range="{{taskOptions}}" range-key="title" value="{{taskIndex}}" bindchange="pickTask"><view class="attribution-row">任务：{{selectedTaskTitle || '不关联具体任务'}} <text>选择 ›</text></view></picker></view>
~~~

- [ ] In finish create session { id:Date.now(), minutes, endedAt:Date.now(), strict, subject:selectedSubject, taskId:selectedTaskId, taskTitle:selectedTaskTitle }; append it to focusSessions before the existing cloud call.
- [ ] Add basic styles for .attribution and .attribution-row matching existing cards.
- [ ] Ctrl+R manual check: default start, subject-only start, task selection auto-sets subject, and one completed 1-minute session creates focusSessions.
- [ ] Commit focus files with message feat: attribute focus sessions

### Task 3: Weekly card in Archive

**Files:** Modify miniprogram/pages/archive/archive.js; Modify miniprogram/pages/archive/archive.wxml; Modify miniprogram/pages/archive/archive.wxss

- [ ] Import sessionsForWeek and summarizeSessions. In onShow read focusSessions, compute weeklyStats with Date.now(), and include it in page data.
- [ ] Add above the backup card:

~~~
<view class="card weekly"><view class="backup-title">本周专注</view><view class="weekly-total">{{weeklyStats.totalMinutes}} 分钟</view><view class="muted">只统计本版本开始记录的专注归属。</view><view wx:if="{{weeklyStats.subjects.length}}" class="weekly-list"><view wx:for="{{weeklyStats.subjects}}" wx:key="name" class="weekly-row">{{item.name}}<text>{{item.minutes}} 分钟</text></view></view><view wx:if="{{weeklyStats.tasks.length}}" class="subhead">具体任务</view><view wx:for="{{weeklyStats.tasks}}" wx:key="name" class="weekly-row">{{item.name}}<text>{{item.minutes}} 分钟</text></view></view>
~~~

- [ ] Add .weekly-total and .weekly-row styles.
- [ ] Ctrl+R and complete a short session; Archive must show its minutes, subject, and task.
- [ ] Run all tests and syntax checks:
~~~
$tests = Get-ChildItem tests -Filter '*.test.cjs' | Sort-Object Name; foreach ($test in $tests) { node $test.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
node --check miniprogram\pages\focus\focus.js
node --check miniprogram\pages\archive\archive.js
~~~
- [ ] Commit and push: git add miniprogram/pages/focus miniprogram/pages/archive; git commit -m "feat: show weekly attributed focus statistics"; git push origin master

