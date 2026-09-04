# 个性化复习教练 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a personalized, offline review-stage prompt that reacts to true review activity and overdue workload.

**Architecture:** `review-coach.js` is a pure utility for date history, streak/gap calculations, and coach copy. Review actions record a local date once per day. Today and Review render the same calculated coach state; local backup exports the new date history.

**Tech Stack:** WeChat Mini Program JavaScript/WXML/WXSS, CommonJS utilities, Node `assert` tests.

---

### Task 1: Test and implement the review coach utility

**Files:**
- Create: `miniprogram/utils/review-coach.js`
- Create: `tests/review-coach.test.cjs`

- [x] Write a failing test for `recordReviewDay` same-day de-duplication and `buildReviewCoach`. Cover no reviews, a first reviewed day, three consecutive days, today not reviewed after yesterday, a two-day gap, and a four-item backlog.
- [x] Run `node tests\\review-coach.test.cjs`; expect a missing-module failure.
- [x] Implement `formatLocalDate(now)`, `recordReviewDay(dates, now)`, and `buildReviewCoach({ activityDates, dueCount, reviewCount, now })`. Return `{ title, message, streak, missedDays }`; parse only valid `YYYY/M/D` dates and never use UTC/GMT strings.
- [x] Run `node tests\\review-coach.test.cjs`; expect `review coach tests passed`.
- [x] Commit utility and test with `git commit -m "feat: add personalized review coach"`.

### Task 2: Persist the review activity safely

**Files:**
- Modify: `miniprogram/pages/review/review.js`
- Modify: `miniprogram/utils/local-backup.js`
- Modify: `tests/local-backup.test.cjs`

- [x] Add `reviewActiveDates` to backup `ARRAY_KEYS`; older backups without that key must normalize to an empty array before validation.
- [x] Extend the backup fixture with `reviewActiveDates` and assert it round-trips unchanged.
- [x] In Review, add `recordActivity()` that writes the result of `recordReviewDay(wx.getStorageSync('reviewActiveDates'), new Date())` to local storage.
- [x] Invoke `recordActivity()` when the user performs `review()` or `done()`; do not invoke it when undoing, deleting, or viewing content.

### Task 3: Render the personal coach state

**Files:**
- Modify: `miniprogram/pages/review/review.js`
- Modify: `miniprogram/pages/review/review.wxml`
- Modify: `miniprogram/pages/review/review.wxss`
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [x] In Review `setItems`, calculate `coach` from `reviewActiveDates`, `dueItems.length`, and `items.length`; expose it in data.
- [x] Place `coach.title` and `coach.message` at the top of the existing due card.
- [x] In Today `load()`, calculate the same coach state and expose it alongside due reviews.
- [x] Add the coach title/message below the Today card heading, using existing card spacing and muted text styles.

### Task 4: Verify, commit, and push

**Files:**
- Modify: `docs/superpowers/plans/2026-09-04-review-coach.md`

- [x] Run `node --check` on the new utility plus both modified page scripts.
- [x] Run `Get-ChildItem tests\\*.test.cjs | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }`; all tests must pass.
- [x] Run `git diff --check`; do not stage `project.config.json`.
- [x] Mark this plan complete, commit all feature files as `feat: personalize review coaching`, and push `master` to `origin`.
