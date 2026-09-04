const cloudStore = require('../../utils/cloud-store');
const { nextReview } = require('../../utils/spaced-repetition');
const { mergeCategories, buildFolders, markMastered, unmarkMastered } = require('../../utils/study-folders');
const { buildPrompts } = require('../../utils/review-prompts');
const { removeReview } = require('../../utils/review-actions');
const { dueReviews } = require('../../utils/review-status');
const defaultCategories = ['错题', '概念', '硬件设计', 'AI想法'];

Page({
  data: { type: '错题', categories: defaultCategories, content: '', items: [], folders: [], mastered: [], dueItems: [], duePreview: [], open: {}, openMastered: false, activePromptId: null, activePrompts: [], pendingRecordId: '', pendingSourceLabel: '' },
  onShow() {
    this.setData({ categories: wx.getStorageSync('reviewCategories') || defaultCategories });
    this.setItems(wx.getStorageSync('reviewItems') || []);
    cloudStore.loadSnapshot('reviews').then(items => items && this.setItems(items)).catch(() => {});
    const draft = wx.getStorageSync('reviewDraftFromRecord');
    if (draft) {
      wx.removeStorageSync('reviewDraftFromRecord');
      this.setData({ content: draft.content, pendingRecordId: draft.recordId, pendingSourceLabel: draft.sourceLabel });
    }
  },
  setItems(items) {
    wx.setStorageSync('reviewItems', items);
    const dueItems = dueReviews(items);
    this.setData({ items, folders: buildFolders(items, this.data.categories, 'type'), mastered: items.filter(item => item.mastered), dueItems, duePreview: dueItems.slice(0, 3) });
  },
  persist(items) { this.setItems(items); cloudStore.saveSnapshot('reviews', items).catch(() => {}); },
  pick(e) { this.setData({ type: e.currentTarget.dataset.t }); },
  addCategory() {
    wx.showModal({ title: '新增复盘分类', editable: true, placeholderText: '例如：信号与系统', success: result => {
      const categories = mergeCategories(this.data.categories, result.content);
      if (categories.length === this.data.categories.length) return;
      wx.setStorageSync('reviewCategories', categories);
      this.setData({ categories, type: categories[categories.length - 1] });
      this.setItems(this.data.items);
    }});
  },
  input(e) { this.setData({ content: e.detail.value }); },
  toggleFolder(e) { const name = e.currentTarget.dataset.n; this.setData({ [`open.${name}`]: !this.data.open[name] }); },
  toggleMastered() { this.setData({ openMastered: !this.data.openMastered }); },
  save() {
    if (!this.data.content.trim()) return wx.showToast({ title: '写下一个可复习的问题', icon: 'none' });
    const schedule = nextReview(0);
    this.persist([{ id: Date.now(), type: this.data.type, content: this.data.content, created: new Date().toLocaleDateString('zh-CN'), stage: 0, next: schedule.next, mastered: false, recordId: this.data.pendingRecordId || undefined, sourceLabel: this.data.pendingSourceLabel || undefined }, ...this.data.items]);
    this.setData({ content: '', pendingRecordId: '', pendingSourceLabel: '' });
  },
  review(e) {
    const id = e.currentTarget.dataset.id;
    this.persist(this.data.items.map(item => item.id === id ? { ...item, ...nextReview(item.stage) } : item));
  },
  reviewDue(e) {
    this.review(e);
  },
  showPrompts(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.items.find(review => review.id === id);
    if (!item) return;
    this.setData({ activePromptId: id, activePrompts: buildPrompts(item.type, item.content) });
  },
  done(e) {
    const id = e.currentTarget.dataset.id;
    this.persist(markMastered(this.data.items, id, new Date().toLocaleDateString('zh-CN')));
    this.setData({ activePromptId: null, activePrompts: [] });
  },
  undoDone(e) {
    const id = e.currentTarget.dataset.id;
    this.persist(unmarkMastered(this.data.items, id));
    wx.showToast({ title: '已恢复到复盘队列', icon: 'success' });
  },
  openRelatedRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    const record = (wx.getStorageSync('studyRecords') || []).find(item => String(item.id) === String(recordId));
    if (!record) return wx.showToast({ title: '原资料已删除，复盘文字仍保留', icon: 'none' });
    wx.setStorageSync('openRecordId', record.id);
    wx.switchTab({ url: '/pages/record/record' });
  },
  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({ title: '删除复盘？', content: '删除后无法恢复。', confirmColor: '#e65050', success: result => {
      if (result.confirm) this.persist(removeReview(this.data.items, id));
    }});
  }
});
