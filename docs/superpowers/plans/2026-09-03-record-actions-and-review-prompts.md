# Record Actions and Review Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make saved learning evidence directly usable and make reviews reversible and more thought-provoking.

**Architecture:** Keep image/document actions in the record page, using WeChat's native preview and document menus. Keep review state in the existing `reviewItems` collection; add a reversible mastered flag and derive offline prompts through a small pure utility.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript, Node assertion tests, existing CloudBase snapshot storage.

---

### Task 1: Offline review prompts

**Files:**
- Create: `miniprogram/utils/review-prompts.js`
- Create: `tests/review-prompts.test.cjs`
- Modify: `miniprogram/pages/review/review.js`
- Modify: `miniprogram/pages/review/review.wxml`

- [x] Write a failing test that expects three prompts for a wrong-answer item and one prompt mentioning changed conditions.
- [x] Run `node tests/review-prompts.test.cjs` and confirm the module is missing.
- [x] Implement `buildPrompts(type, content)` with deterministic templates for wrong answers, concepts, hardware design, and AI ideas.
- [x] Add a `举一反三` action that displays the generated prompts under the active review item.
- [x] Re-run `node tests/review-prompts.test.cjs` and confirm it passes.

### Task 2: Reversible mastery

**Files:**
- Modify: `miniprogram/utils/study-folders.js`
- Modify: `tests/study-folders.test.cjs`
- Modify: `miniprogram/pages/review/review.js`
- Modify: `miniprogram/pages/review/review.wxml`

- [x] Write a failing test that expects `unmarkMastered` to clear the mastered state while keeping the review data.
- [x] Run `node tests/study-folders.test.cjs` and confirm the new export is missing.
- [x] Implement `unmarkMastered` and bind a `取消掌握` button in the expanded completed section.
- [x] Re-run `node tests/study-folders.test.cjs` and confirm it passes.

### Task 3: Usable saved evidence

**Files:**
- Modify: `miniprogram/pages/record/record.js`
- Modify: `miniprogram/pages/record/record.wxml`
- Modify: `miniprogram/pages/record/record.wxss`

- [x] Add a record-image preview handler that passes every saved image to `wx.previewImage` with `showmenu: true`.
- [x] Render saved image thumbnails with the handler and make record text selectable.
- [x] Retain `wx.openDocument({ showMenu: true })` for PDF/Word items so the native document menu remains available.
- [x] Run all Node tests and JavaScript syntax checks after the page changes.
