# 每日学习闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add offline due-review reminders and a copyable daily learning summary to the mini-program.

**Architecture:** A pure `review-status` utility parses the existing Chinese date string, selects due unmastered review items, and builds the summary text. Today and Review consume it while preserving existing storage and cloud-sync behavior.

**Tech Stack:** WeChat Mini Program JavaScript/WXML/WXSS, CommonJS utilities, Node `assert` tests.

---

### Task 1: Review status utility

**Files:**
- Create: `miniprogram/utils/review-status.js`
- Create: `tests/review-status.test.cjs`

- [x] Write a failing test that imports `dueReviews` and `buildDailySummary`, passes five reviews (today, overdue, future, mastered, invalid date), and asserts IDs `[1, 2]` plus the exact multiline summary.
- [x] Run `node tests\\review-status.test.cjs`; expect a module-not-found failure before implementation.
- [x] Implement `parseChineseDate(value)` with `/^(\\d{4})\\/(\\d{1,2})\\/(\\d{1,2})$/` and a round-trip Date validity check; implement `dueReviews(items, now)` to exclude mastered/invalid/future items; implement `buildDailySummary({ date, completed, total, focusMinutes, goalMinutes, dueItems })` with at most three first-line review excerpts.
- [x] Run `node tests\\review-status.test.cjs`; expect `review status tests passed`.
- [x] Commit only the utility and its test with `git commit -m "feat: add daily review status utility"`.

### Task 2: Today closing card

**Files:**
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [x] Import `dueReviews` and `buildDailySummary` in `index.js`; in `load()`, calculate due items from local `reviewItems` and expose `dueItems` plus `dueReviewCount` in page data.
- [x] Add `goReview()` using `wx.switchTab({ url: '/pages/review/review' })` and `copyDailySummary()` using `wx.setClipboardData`; construct its text through `buildDailySummary` and toast `今日总结已复制` after success.
- [x] Insert a `daily-loop` card after completed tasks. It shows `completed/total`, `focusMinutes/goalMinutes`, due count, conditional `去复盘`, and `复制今日总结`.
- [x] Add styles for `daily-loop`, `loop-title`, `loop-grid`, `loop-metric`, `loop-value`, `loop-label`, `loop-actions`, and `loop-review`; use existing card colours and no fixed-position controls.

### Task 3: Review-page due card

**Files:**
- Modify: `miniprogram/pages/review/review.js`
- Modify: `miniprogram/pages/review/review.wxml`
- Modify: `miniprogram/pages/review/review.wxss`

- [x] Import `dueReviews`; add `dueItems` to page data; in `setItems(items)`, set `dueItems: dueReviews(items)` along with folders and mastered items.
- [x] Add `reviewDue(e) { this.review(e); }` so the reminder card uses the existing spaced-repetition completion path.
- [x] Add a `due-card` before the creation card: show an empty message when none are due, otherwise render up to three items, their content, and a `复习完成` button bound to `reviewDue`; when more exist, show the remaining count and direct the user to existing folders.
- [x] Add styles for `due-card`, `due-title`, `due-empty`, `due-item`, `due-content`, and `due-more` without changing existing folder, mastered, or delete styles.

### Task 4: Verify, commit, and push

**Files:**
- Modify: `docs/superpowers/plans/2026-09-04-daily-study-loop.md`

- [x] Run `node --check miniprogram\\utils\\review-status.js`, `node --check miniprogram\\pages\\index\\index.js`, and `node --check miniprogram\\pages\\review\\review.js`; every command must exit 0.
- [x] Run all test files: `Get-ChildItem tests\\*.test.cjs | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }`; every test must pass.
- [x] Run `git diff --check` and `git status --short`; preserve the DevTools-owned `project.config.json` without staging it.
- [x] Mark plan checkboxes complete, commit feature files and plan as `feat: add daily study loop reminders`, and run `git push origin master`.
