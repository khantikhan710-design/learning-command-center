# Refresh Insights And Backup Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Today learning card on entry and show the latest local backup status.

**Architecture:** Small pure utilities select an insight from a stored cursor and format backup status. Page code only reads/writes WeChat storage and renders those values.

**Tech Stack:** WeChat Mini Program JavaScript/WXML/WXSS, Node.js assertion tests.

---

### Task 1: Insight rotation

**Files:**
- Modify: `miniprogram/utils/daily-insights.js`
- Modify: `tests/daily-insights.test.cjs`
- Modify: `miniprogram/pages/index/index.js`

- [x] Write a failing test for sequential selection and wrap-around.
- [x] Add a pure next-insight selector and persist its cursor when Today appears.
- [x] Run the insight test.

### Task 2: Local backup state

**Files:**
- Create: `miniprogram/utils/backup-status.js`
- Create: `tests/backup-status.test.cjs`
- Modify: `miniprogram/pages/archive/archive.js`
- Modify: `miniprogram/pages/archive/archive.wxml`
- Modify: `miniprogram/pages/archive/archive.wxss`

- [x] Write a failing status-format test.
- [x] Save backup time only after clipboard export succeeds and render it in Archive.
- [x] Run the complete test suite and push.
