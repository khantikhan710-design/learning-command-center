# Goodnotes / WPS 资料卡 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add source-aware study material cards and record-to-review links without duplicating Goodnotes/WPS notebooks.

**Architecture:** A pure utility owns source labels, old-record fallbacks and review-draft creation. Record creates/display cards; Review accepts a draft and stores recordId. File bytes stay in CloudBase; a failed upload offers text-only save and never reports a file as saved.

**Tech Stack:** WeChat Mini Program JavaScript/WXML/WXSS, wx local storage/navigation, CloudBase helper, Node assert tests.

---

### Task 1: Material-card utility and tests

**Files:**
- Create: miniprogram/utils/study-material-cards.js
- Create: tests/study-material-cards.test.cjs

- [ ] **Step 1: Write the failing test**

Create tests/study-material-cards.test.cjs:

~~~
const assert = require('node:assert/strict');
const { MATERIAL_SOURCES, normalizeMaterialSource, materialTitle, createReviewDraft } = require('../miniprogram/utils/study-material-cards');

assert.deepEqual(MATERIAL_SOURCES, ['Goodnotes', 'WPS 扫描', '纸质拍照', '其他']);
assert.equal(normalizeMaterialSource('Goodnotes'), 'Goodnotes');
assert.equal(normalizeMaterialSource('未知软件'), '其他');
assert.equal(materialTitle({ title: '  极限错题集  ', content: '说明' }), '极限错题集');
assert.equal(materialTitle({ content: '第一行标题\\n第二行说明' }), '第一行标题');
assert.equal(materialTitle({}), '未命名资料卡');
assert.deepEqual(createReviewDraft({ id: 'r1', source: 'WPS 扫描', title: '微分方程错题', content: '变量代换漏写初值条件' }), {
  recordId: 'r1',
  sourceLabel: 'WPS 扫描',
  content: '【资料卡｜WPS 扫描】微分方程错题\\n变量代换漏写初值条件'
});
assert.deepEqual(createReviewDraft({ id: 'r2', content: '' }), {
  recordId: 'r2',
  sourceLabel: '其他',
  content: '【资料卡｜其他】未命名资料卡'
});
console.log('study material card tests passed');
~~~

- [ ] **Step 2: Run it and confirm failure**

Run: node tests\\study-material-cards.test.cjs

Expected: module-not-found failure.

- [ ] **Step 3: Implement the minimal utility**

Create miniprogram/utils/study-material-cards.js:

~~~
const MATERIAL_SOURCES = ['Goodnotes', 'WPS 扫描', '纸质拍照', '其他'];

function normalizeMaterialSource(source) {
  return MATERIAL_SOURCES.includes(source) ? source : '其他';
}

function materialTitle(record) {
  const title = String(record && record.title || '').trim();
  if (title) return title;
  const firstLine = String(record && record.content || '').split(/\r?\n/)[0].trim();
  return firstLine || '未命名资料卡';
}

function createReviewDraft(record) {
  const sourceLabel = normalizeMaterialSource(record && record.source);
  const title = materialTitle(record);
  const body = String(record && record.content || '').trim();
  return {
    recordId: record && record.id,
    sourceLabel,
    content: '【资料卡｜' + sourceLabel + '】' + title + (body ? '\\n' + body : '')
  };
}

module.exports = { MATERIAL_SOURCES, normalizeMaterialSource, materialTitle, createReviewDraft };
~~~

- [ ] **Step 4: Verify then commit**

Run: node tests\\study-material-cards.test.cjs

Expected: study material card tests passed.

~~~
git add miniprogram/utils/study-material-cards.js tests/study-material-cards.test.cjs
git commit -m "feat: add study material card utility"
~~~

### Task 2: Source-aware Record cards and safe attachment failure

**Files:**
- Modify: miniprogram/pages/record/record.js
- Modify: miniprogram/pages/record/record.wxml
- Modify: miniprogram/pages/record/record.wxss

- [ ] **Step 1: Add data projection and controls**

At the top of record.js add:

~~~
const { MATERIAL_SOURCES, normalizeMaterialSource, materialTitle, createReviewDraft } = require('../../utils/study-material-cards');
~~~

Extend Record data with:

~~~
source: 'Goodnotes',
sources: MATERIAL_SOURCES,
title: '',
focusRecordId: ''
~~~

Replace the map inside setRecords:

~~~
records = sort(records).map(record => ({
  ...record,
  source: normalizeMaterialSource(record.source),
  displayTitle: materialTitle(record),
  displayDate: formatRecordDate(record.date)
}));
~~~

Add these Record methods:

~~~
chooseSource() {
  wx.showActionSheet({
    itemList: this.data.sources,
    success: result => this.setData({ source: this.data.sources[result.tapIndex] })
  });
},
inputTitle(e) { this.setData({ title: e.detail.value }); },
createReview(e) {
  const record = this.data.records.find(item => item.id === e.currentTarget.dataset.id);
  if (!record) return;
  wx.setStorageSync('reviewDraftFromRecord', createReviewDraft(record));
  wx.switchTab({ url: '/pages/review/review' });
}
~~~

- [ ] **Step 2: Replace save with the explicit upload contract**

Replace Record save():

~~~
save() {
  const hasText = this.data.title.trim() || this.data.content.trim();
  const hasAttachments = this.data.images.length || this.data.files.length;
  if (!hasText && !hasAttachments) return wx.showToast({ title: '写内容或添加附件', icon: 'none' });
  const makeRecord = (images = [], files = []) => ({
    id: Date.now(),
    subject: this.data.subject,
    source: normalizeMaterialSource(this.data.source),
    title: this.data.title.trim(),
    content: this.data.content,
    images, files,
    date: new Date().toLocaleString('zh-CN'),
    pinned: false
  });
  const finish = record => {
    this.persist([record, ...this.data.records]);
    this.setData({ title: '', content: '', images: [], files: [] });
    wx.showToast({ title: '资料卡已保存', icon: 'success' });
  };
  if (!hasAttachments) return finish(makeRecord());
  Promise.all([cloudStore.uploadImages(this.data.images), cloudStore.uploadFiles(this.data.files)])
    .then(([images, files]) => finish(makeRecord(images, files)))
    .catch(() => wx.showModal({
      title: '附件未保存',
      content: '当前云存储不可用，文件尚未保存。可继续编辑并稍后重试，或仅保存文字资料卡。',
      confirmText: '仅保存文字',
      cancelText: '继续编辑',
      success: result => { if (result.confirm) finish(makeRecord()); }
    }));
}
~~~

- [ ] **Step 3: Add Record markup and styles**

Below the subject pills in record.wxml:

~~~
<view class="material-meta">
  <text class="source-chip" bindtap="chooseSource">来源：{{source}} · 选择</text>
  <input class="input material-title" value="{{title}}" placeholder="资料标题，例如：积分中值定理错题第 3 组" bindinput="inputTitle" />
</view>
~~~

In every existing record item, show this before existing image/file blocks:

~~~
<text class="tag">{{record.pinned?'📌 ':''}}{{record.displayDate}} · {{record.source}}</text>
<text class="record-title selectable" user-select>{{record.displayTitle}}</text>
<text wx:if="{{record.content}}" class="content selectable" user-select>{{record.content}}</text>
<text wx:if="{{record.content}}" class="copy-text" data-text="{{record.content}}" catchtap="copyRecordText">复制文字</text>
<text class="copy-text" data-id="{{record.id}}" catchtap="createReview">转为复盘</text>
~~~

Append record.wxss:

~~~
.material-meta{margin:18rpx 0}.source-chip{display:inline-block;padding:10rpx 14rpx;border-radius:12rpx;background:#edf6ff;color:#1677ff;font-size:23rpx}.material-title{margin-top:14rpx;width:auto}.record-title{display:block;margin-top:14rpx;font-size:29rpx;font-weight:700;color:#27394e}.record-title+.content{margin-top:10rpx}
~~~

- [ ] **Step 4: Manual check and commit**

After Ctrl+R, verify all four sources, title-only save, legacy fallback title/source, left-swipe action survival, and the exact “附件未保存” dialog. Confirming “仅保存文字” must create a record with no file entry.

~~~
git add miniprogram/pages/record/record.js miniprogram/pages/record/record.wxml miniprogram/pages/record/record.wxss
git commit -m "feat: add source-aware study material cards"
~~~

### Task 3: Link material cards to Review

**Files:**
- Modify: miniprogram/pages/review/review.js
- Modify: miniprogram/pages/review/review.wxml
- Modify: miniprogram/pages/review/review.wxss
- Modify: miniprogram/pages/record/record.js
- Modify: miniprogram/pages/record/record.wxml

- [ ] **Step 1: Receive and save the Record draft**

Extend Review data:

~~~
pendingRecordId: '',
pendingSourceLabel: ''
~~~

At the end of Review onShow:

~~~
const draft = wx.getStorageSync('reviewDraftFromRecord');
if (draft) {
  wx.removeStorageSync('reviewDraftFromRecord');
  this.setData({ content: draft.content, pendingRecordId: draft.recordId, pendingSourceLabel: draft.sourceLabel });
}
~~~

In the item created by Review save(), add:

~~~
recordId: this.data.pendingRecordId || undefined,
sourceLabel: this.data.pendingSourceLabel || undefined
~~~

After successful Review save clear all draft state:

~~~
this.setData({ content: '', pendingRecordId: '', pendingSourceLabel: '' });
~~~

- [ ] **Step 2: Add safe source navigation**

Add to review.js:

~~~
openRelatedRecord(e) {
  const recordId = e.currentTarget.dataset.id;
  const exists = (wx.getStorageSync('studyRecords') || []).some(record => record.id === recordId);
  if (!exists) return wx.showToast({ title: '原资料已删除，复盘文字仍保留', icon: 'none' });
  wx.setStorageSync('openRecordId', recordId);
  wx.switchTab({ url: '/pages/record/record' });
}
~~~

At the end of Record onShow after loading records:

~~~
const openRecordId = wx.getStorageSync('openRecordId');
if (openRecordId) {
  wx.removeStorageSync('openRecordId');
  const record = this.data.records.find(item => item.id === openRecordId);
  if (record) {
    const folderKey = 'open.' + record.subject;
    this.setData({ [folderKey]: true, focusRecordId: openRecordId });
  }
}
~~~

In active and mastered Review cards:

~~~
<text wx:if="{{review.recordId}}" class="related-record" data-id="{{review.recordId}}" bindtap="openRelatedRecord">📎 来自资料卡：{{review.sourceLabel || '其他'}}</text>
~~~

Add the focused class to a Record item:

~~~
<view class="record {{focusRecordId===record.id?'focused-record':''}}" data-id="{{record.id}}" bindtouchstart="start" bindtouchend="end">
~~~

Append styles:

~~~
/* review.wxss */ .related-record{display:block;margin-top:12rpx;color:#1677ff;font-size:23rpx}
/* record.wxss */ .focused-record{outline:3rpx solid #78b4ff;outline-offset:8rpx;border-radius:16rpx}
~~~

- [ ] **Step 3: Manual check and commit**

Create Goodnotes card -> 转为复盘 -> save -> tap source label -> expanded source folder and highlighted card. Delete source card, repeat tap; expected toast says source was deleted while review text remains.

~~~
git add miniprogram/pages/review miniprogram/pages/record tests/study-material-cards.test.cjs
git commit -m "feat: link study material cards to reviews"
~~~

### Task 4: Regression checks and roadmap

**Files:**
- Modify: ROADMAP.md
- Test: tests/*.test.cjs

- [ ] **Step 1: Update integration status**

Replace Roadmap item 5 with:

~~~
5. 已完成首版：Goodnotes/WPS/纸质资料通过“资料卡”选择来源、标题、关键图或文件并关联复盘；原始笔记仍由外部软件保留。自动读取第三方内容、直接跳转和自动同步仍需各服务开放 API 或明确可用跳转方式。
~~~

- [ ] **Step 2: Test all scripts**

Run:

~~~
$tests = Get-ChildItem tests -Filter '*.test.cjs' | Sort-Object Name; foreach ($test in $tests) { node $test.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
~~~

Expected: all scripts pass, including study material card tests passed.

- [ ] **Step 3: Syntax-check edited JavaScript**

Run:

~~~
node --check miniprogram\pages\record\record.js
node --check miniprogram\pages\review\review.js
node --check miniprogram\utils\study-material-cards.js
~~~

Expected: zero exit code and no output.

- [ ] **Step 4: Commit and push**

~~~
git add ROADMAP.md
git commit -m "docs: record material card integration status"
git push origin master
~~~

