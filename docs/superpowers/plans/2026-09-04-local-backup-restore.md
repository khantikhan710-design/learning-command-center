# Local Backup and Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在归档页面提供不依赖云开发的本地完整备份和安全恢复。

**Architecture:** `local-backup.js` 只负责生成、验证、统计 JSON；归档页负责读取/写入微信本地存储、展示备份文本和二次确认。

**Tech Stack:** 微信小程序原生 JavaScript/WXML/WXSS、Node `assert` 测试。

---

### Task 1: Add backup utility

**Files:**
- Create: `miniprogram/utils/local-backup.js`
- Create: `tests/local-backup.test.cjs`

- [ ] Write failing tests for `createBackup`, `parseBackup`, and `summarizeBackup`.
- [ ] Run `node tests/local-backup.test.cjs` and confirm the module is absent.
- [ ] Implement format validation and summary counts.
- [ ] Re-run the test and confirm it passes.

### Task 2: Add archive page controls

**Files:**
- Modify: `miniprogram/pages/archive/archive.js`
- Modify: `miniprogram/pages/archive/archive.wxml`
- Modify: `miniprogram/pages/archive/archive.wxss`

- [ ] Read selected storage keys and copy a JSON backup to the clipboard.
- [ ] Add a restore textarea, preview summary, and destructive-action confirmation.
- [ ] Restore only after valid parsing and explicit confirmation.

### Task 3: Verify and deliver

- [ ] Run every `tests/*.test.cjs` script and `node --check miniprogram/pages/archive/archive.js`.
- [ ] Commit only feature files and leave `project.config.json` untouched.
