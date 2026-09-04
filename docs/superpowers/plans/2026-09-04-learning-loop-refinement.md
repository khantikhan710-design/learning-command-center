# Learning Loop Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the core study loop reliable and immediately actionable without requiring system or cloud permissions.

**Architecture:** Introduce pure utilities for durable focus timing and daily recommendations. Pages persist only serializable timer state and render utility-produced view data. Existing task/review storage remains the single source of truth.

**Tech Stack:** WeChat Mini Program JavaScript/WXML/WXSS, Node.js assertion tests.

---

### Task 1: Durable focus timing

**Files:**
- Create: `miniprogram/utils/focus-session.js`
- Create: `tests/focus-session.test.cjs`
- Modify: `miniprogram/pages/focus/focus.js`

- [ ] Write a failing test showing a session computes remaining seconds from `endsAt`, reaches zero after expiry, and creates a completion record only once.
- [ ] Implement the pure helpers and persist `focusTimerState` when starting, pausing, finishing, and returning from background.
- [ ] Run `node tests/focus-session.test.cjs` and commit.

### Task 2: Daily next-step recommendation

**Files:**
- Create: `miniprogram/utils/daily-plan.js`
- Create: `tests/daily-plan.test.cjs`
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`

- [ ] Write failing tests for due-review priority, pending-task fallback, and empty-day fallback.
- [ ] Implement a pure recommendation and plan-vs-actual summary.
- [ ] Render one focused next action with links to Focus or Review.
- [ ] Run `node tests/daily-plan.test.cjs` and commit.

### Task 3: Refine core page hierarchy

**Files:**
- Modify: `miniprogram/pages/focus/focus.wxml`
- Modify: `miniprogram/pages/focus/focus.wxss`
- Modify: `miniprogram/pages/review/review.wxml`
- Modify: `miniprogram/pages/review/review.wxss`

- [ ] Make primary actions and explanatory copy consistent with the new daily loop; preserve all current behaviours.
- [ ] Run full tests, JavaScript syntax checks, `git diff --check`; commit and push.
