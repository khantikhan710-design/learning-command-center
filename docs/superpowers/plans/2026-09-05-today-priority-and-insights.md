# Today Priority And Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add long-press priority ordering and sourced rotating learning content to Today without increasing user maintenance.

**Architecture:** Pure utilities produce reordered tasks and a date-based insight. The Today page only handles touch geometry and persists once on drop.

**Tech Stack:** WeChat Mini Program JavaScript/WXML/WXSS, Node.js assertion tests.

---

### Task 1: Stable manual task ordering

**Files:**
- Modify: `miniprogram/utils/task-actions.js`
- Modify: `tests/task-actions.test.cjs`
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [x] Add a failing assertion for moving an unpinned unfinished task before another unpinned unfinished task.
- [x] Implement a pure group-safe reorder helper.
- [x] Capture task bounding boxes on long press, reorder in memory while dragging, persist once on touch end.
- [x] Run `node tests/task-actions.test.cjs`.

### Task 2: Curated daily learning card

**Files:**
- Create: `miniprogram/utils/daily-insights.js`
- Create: `tests/daily-insights.test.cjs`
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [x] Add a failing deterministic-date test.
- [x] Implement locally curated insight rotation with type and source metadata.
- [x] Replace the generic hero headline with the insight card while retaining date and daily metrics.
- [x] Run all tests and push.
