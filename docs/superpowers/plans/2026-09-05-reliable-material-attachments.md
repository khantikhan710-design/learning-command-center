# 可靠资料附件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让资料卡只标记真实已保存的附件，并在云端/本机保存失败时保留正文、展示原件提示、允许重选替换或删除。

**Architecture:** 使用独立的附件状态工具生成可测试的 `saved` / `needs_source` 两类记录。记录页仍优先尝试 CloudBase，失败后逐项本机保存；文件无法持久化时由用户确认是否保留正文和“原件占位附件”。来源选择改为真实导入引导，不承诺读取 Goodnotes 或 WPS 内部资料。

**Tech Stack:** 微信小程序原生 JavaScript/WXML、`wx.chooseMessageFile`、`wx.saveFile`、Node 内置 `assert` 测试。

---

### Task 1: 定义附件状态与失败文案

**Files:**
- Create: `miniprogram/utils/attachment-status.js`
- Create: `tests/attachment-status.test.cjs`

- [ ] **Step 1: 写失败测试**

```js
const assert = require('node:assert/strict');
const { MAX_LOCAL_FILE_BYTES, createSourcePlaceholder, describeSaveFailure } = require('../miniprogram/utils/attachment-status');

assert.equal(MAX_LOCAL_FILE_BYTES, 10 * 1024 * 1024);
assert.deepEqual(createSourcePlaceholder({ name: '电路.pdf', size: 12 * 1024 * 1024, type: 'file' }, '文件超过本机 10MB 限额'), {
  name: '电路.pdf', type: 'file', size: 12 * 1024 * 1024,
  attachmentId: 'source-电路.pdf-12582912', status: 'needs_source',
  reason: '文件超过本机 10MB 限额'
});
assert.equal(describeSaveFailure({ errMsg: 'saveFile:fail exceed max file size' }), '本机小程序文件空间不足或文件超过 10MB 限额');
```

- [ ] **Step 2: 运行并确认失败**

Run: `node tests/attachment-status.test.cjs`

Expected: `MODULE_NOT_FOUND`。

- [ ] **Step 3: 写最小实现**

```js
const MAX_LOCAL_FILE_BYTES = 10 * 1024 * 1024;
function createSourcePlaceholder(file, reason) {
  const name = file.name || '未命名附件';
  const size = Number(file.size) || 0;
  return { name, type: file.type || 'file', size, attachmentId: `source-${name}-${size}`, status: 'needs_source', reason };
}
function describeSaveFailure(error) {
  const message = String(error && (error.errMsg || error.message) || '');
  if (/size|space|quota|max/i.test(message)) return '本机小程序文件空间不足或文件超过 10MB 限额';
  return '附件未能保存到小程序，请保留 Goodnotes/WPS 原件';
}
module.exports = { MAX_LOCAL_FILE_BYTES, createSourcePlaceholder, describeSaveFailure };
```

- [ ] **Step 4: 运行通过测试**

Run: `node tests/attachment-status.test.cjs`

Expected: `attachment status tests passed`。

- [ ] **Step 5: 提交**

```bash
git add miniprogram/utils/attachment-status.js tests/attachment-status.test.cjs
git commit -m "feat: model durable attachment status"
```

### Task 2: 本机文件逐项保存与占位回退

**Files:**
- Modify: `miniprogram/utils/local-attachments.js`
- Modify: `tests/local-attachments.test.cjs`

- [ ] **Step 1: 写失败测试**

```js
const { saveLocalFilesWithStatus } = require('../miniprogram/utils/local-attachments');
const result = await saveLocalFilesWithStatus([
  { name: '小文件.pdf', path: '/tmp/a.pdf', size: 100 },
  { name: '大文件.pdf', path: '/tmp/b.pdf', size: 11 * 1024 * 1024 }
], fakeWx);
assert.equal(result.files[0].status, 'saved');
assert.equal(result.placeholders[0].status, 'needs_source');
```

- [ ] **Step 2: 运行并确认失败**

Run: `node tests/local-attachments.test.cjs`

Expected: `saveLocalFilesWithStatus is not a function`。

- [ ] **Step 3: 写最小实现**

```js
async function saveLocalFilesWithStatus(files, api = wx) {
  const outcomes = await Promise.all(files.map(async file => {
    if (Number(file.size) > MAX_LOCAL_FILE_BYTES) return { placeholder: createSourcePlaceholder(file, '文件超过本机 10MB 限额') };
    try {
      const [saved] = await saveLocalFiles([file], api);
      return { file: { ...saved, status: 'saved' } };
    } catch (error) {
      return { placeholder: createSourcePlaceholder(file, describeSaveFailure(error)) };
    }
  }));
  return { files: outcomes.filter(item => item.file).map(item => item.file), placeholders: outcomes.filter(item => item.placeholder).map(item => item.placeholder) };
}
```

- [ ] **Step 4: 运行通过测试**

Run: `node tests/local-attachments.test.cjs`

Expected: `local attachment tests passed`。

- [ ] **Step 5: 提交**

```bash
git add miniprogram/utils/local-attachments.js tests/local-attachments.test.cjs
git commit -m "fix: retain failed document attachments as source placeholders"
```

### Task 3: 资料卡真实失败流程与来源导入引导

**Files:**
- Modify: `miniprogram/pages/record/record.js`
- Modify: `miniprogram/pages/record/record.wxml`
- Create: `tests/record-source-flow.test.cjs`

- [ ] **Step 1: 写失败测试**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const script = fs.readFileSync('miniprogram/pages/record/record.js', 'utf8');
const wxml = fs.readFileSync('miniprogram/pages/record/record.wxml', 'utf8');
assert.match(script, /saveLocalFilesWithStatus/);
assert.match(script, /confirmKeepSourceOnly/);
assert.match(script, /showSourceGuide/);
assert.match(wxml, /原件未保存/);
```

- [ ] **Step 2: 运行并确认失败**

Run: `node tests/record-source-flow.test.cjs`

Expected: assertion failure because the page lacks the new flow.

- [ ] **Step 3: 写最小实现**

Implement these page behaviors:

```js
chooseSource() {
  wx.showActionSheet({ itemList: this.data.sources, success: result => {
    const source = this.data.sources[result.tapIndex];
    this.setData({ source });
    this.showSourceGuide(source);
  }});
},
showSourceGuide(source) {
  const guide = SOURCE_GUIDES[source];
  wx.showModal({ title: '来源导入提示', content: guide.content, confirmText: guide.action, success: result => {
    if (!result.confirm) return;
    if (guide.kind === 'image') this.chooseImage();
    if (guide.kind === 'file') this.chooseFile();
  }});
}
```

After a cloud upload failure, call `saveLocalImages` and `saveLocalFilesWithStatus` separately. On any document placeholder, show a modal whose confirm handler calls `confirmKeepSourceOnly` to save the record with both durable files and `needs_source` placeholders. The cancel handler writes nothing. Include only durable local paths in “已附资料”.

- [ ] **Step 4: 运行通过测试与语法检查**

Run: `node tests/record-source-flow.test.cjs; node --check miniprogram/pages/record/record.js`

Expected: page behavior test passes and no syntax output.

- [ ] **Step 5: 提交**

```bash
git add miniprogram/pages/record/record.js miniprogram/pages/record/record.wxml tests/record-source-flow.test.cjs
git commit -m "feat: guide source imports and preserve failed documents honestly"
```

### Task 4: 替换或删除未保存原件

**Files:**
- Modify: `miniprogram/utils/record-attachments.js`
- Modify: `miniprogram/pages/record/record.js`
- Modify: `miniprogram/pages/record/record.wxml`
- Modify: `tests/record-attachments.test.cjs`

- [ ] **Step 1: 写失败测试**

```js
const { replaceAttachment } = require('../miniprogram/utils/record-attachments');
assert.deepEqual(replaceAttachment([{ id: 'r1', files: [{ attachmentId: 'source-a', status: 'needs_source' }] }], 'r1', 'source-a', { attachmentId: 'saved-a', status: 'saved', localFilePath: 'wxfile://saved/a.pdf' }), [{ id: 'r1', files: [{ attachmentId: 'saved-a', status: 'saved', localFilePath: 'wxfile://saved/a.pdf' }] }]);
```

- [ ] **Step 2: 运行并确认失败**

Run: `node tests/record-attachments.test.cjs`

Expected: `replaceAttachment is not a function`。

- [ ] **Step 3: 写最小实现**

```js
function replaceAttachment(records, recordId, attachmentId, replacement) {
  return records.map(record => String(record.id) !== String(recordId) ? record : {
    ...record,
    files: (record.files || []).map(file => String(file.attachmentId) === String(attachmentId) ? replacement : file)
  });
}
```

For `needs_source`, `fileActions` must show `重新选择原件并保存 / 复制文件名 / 删除这份附件`; re-selection calls `wx.chooseMessageFile({ count: 1, type: 'file' })`, then first tries cloud upload and falls back to `saveLocalFilesWithStatus`. A replacement occurs only when returned status is `saved`; a second failure leaves the placeholder unchanged and shows its real reason.

- [ ] **Step 4: 运行通过测试**

Run: `node tests/record-attachments.test.cjs; node tests/record-source-flow.test.cjs`

Expected: both tests pass.

- [ ] **Step 5: 提交**

```bash
git add miniprogram/utils/record-attachments.js miniprogram/pages/record/record.js miniprogram/pages/record/record.wxml tests/record-attachments.test.cjs
git commit -m "feat: replace unavailable source attachments"
```

### Task 5: 全量验证与合并准备

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新数据边界说明**

Add that PDF/Word is only marked saved after local or cloud persistence, local space is limited to 10MB, and Goodnotes/WPS files require manual export to a selectable WeChat file.

- [ ] **Step 2: 运行全量测试**

Run: `Get-ChildItem tests -Filter '*.test.cjs' | Sort-Object Name | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }`

Expected: every suite prints `passed` and command exits 0.

- [ ] **Step 3: 检查语法与差异**

Run: `Get-ChildItem miniprogram -Recurse -Filter '*.js' | Where-Object { $_.FullName -notmatch '\\components\\agent-ui\\' } | ForEach-Object { node --check $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }; git diff --check`

Expected: no syntax or whitespace errors.

- [ ] **Step 4: 提交**

```bash
git add README.md
git commit -m "docs: explain reliable attachment behavior"
```
