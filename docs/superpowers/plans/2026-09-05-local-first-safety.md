# Local-First Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the mini program safe and useful without CloudBase by exposing honest sync status, backup files, local safety checks, archive actions, assisted material intake, and a weekly report.

**Architecture:** Extend existing utility modules instead of adding opaque storage paths. `cloud-store.js` becomes the single source of cloud health, while backup and attachment utilities remain pure and testable. Pages only render the derived state and call WeChat APIs for user-initiated sharing or file selection.

**Tech Stack:** WeChat Mini Program native APIs, CommonJS utilities, Node `assert` tests.

---

### Task 1: Cloud state and safety report

**Files:**
- Modify: `miniprogram/utils/cloud-store.js`
- Modify: `miniprogram/utils/backup-status.js`
- Modify: `tests/cloud-store.test.cjs`
- Modify: `tests/backup-status.test.cjs`

- [ ] Write failing tests for a failed cloud status, a successful cloud status, overdue backup, and unsaved attachment count.
- [ ] Implement `getCloudStatus`, `markCloudAvailable`, `markCloudUnavailable`, and `buildLocalSafetyStatus`.
- [ ] Run both tests and commit `feat: add local-first safety status`.

### Task 2: Surface status and resilient backup file flow

**Files:**
- Modify: `miniprogram/pages/index/index.js`, `index.wxml`, `index.wxss`
- Modify: `miniprogram/pages/archive/archive.js`, `archive.wxml`, `archive.wxss`
- Modify: `miniprogram/utils/local-backup.js`
- Modify: `tests/local-backup.test.cjs`

- [ ] Write failing tests for a generated backup filename and imported backup text.
- [ ] Add a cloud status card and a one-tap connection check.
- [ ] Add generated JSON backup export, share fallback, file selection import, preview, and confirm restore.
- [ ] Run relevant tests plus syntax checks and commit `feat: add backup file import and cloud check`.

### Task 3: Archive management and source filtering

**Files:**
- Modify: `miniprogram/pages/archive/archive.js`, `archive.wxml`, `archive.wxss`
- Modify: `miniprogram/utils/archive-folders.js`
- Modify: `tests/archive-folders.test.cjs`

- [ ] Write failing tests for source filter options and record pin/delete transformations.
- [ ] Add archive source chips, record action sheet, two-step deletion, pin toggle, and conversion to a review draft.
- [ ] Verify record page receives the draft, then commit `feat: manage records from archive`.

### Task 4: Material intake and weekly report

**Files:**
- Modify: `miniprogram/pages/record/record.js`, `record.wxml`, `record.wxss`
- Modify: `miniprogram/utils/study-material-cards.js`
- Modify: `miniprogram/pages/archive/archive.js`, `archive.wxml`, `archive.wxss`
- Modify: `miniprogram/utils/weekly-review.js`
- Modify: `tests/study-material-cards.test.cjs`, `tests/weekly-review.test.cjs`

- [ ] Write failing tests for source-based draft titles and a copyable weekly report.
- [ ] Add a user-confirmed WPS/Goodnotes intake prompt that pre-fills title/source/date after file selection.
- [ ] Add a weekly report derived from real local sessions, tasks, and due reviews, with clipboard copy.
- [ ] Run the complete test suite and commit `feat: improve offline learning workflow`.

### Task 5: Verification and delivery

**Files:**
- Modify: `README.md`

- [ ] Document local-first behavior and cloud prerequisites.
- [ ] Run every `tests/*.test.cjs`, `node --check` for all project scripts except the bundled Agent UI, and `git diff --check`.
- [ ] Push only project code and documentation; do not stage `project.config.json`.
