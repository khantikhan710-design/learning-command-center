const cloudStore = require('../../utils/cloud-store');
const { nextReview } = require('../../utils/spaced-repetition');
const { buildFolders, markMastered, unmarkMastered } = require('../../utils/study-folders');
const { buildPrompts } = require('../../utils/review-prompts');
const types = ['错题', '概念', '硬件设计', 'AI想法'];

Page({
  data: { type: '错题', content: '', items: [], folders: [], mastered: [], open: {}, openMastered: false, activePromptId: null, activePrompts: [] },
  onShow() {
    this.setItems(wx.getStorageSync('reviewItems') || []);
    cloudStore.loadSnapshot('reviews').then(items => items && this.setItems(items)).catch(() => {});
  },
  setItems(items) {
    wx.setStorageSync('reviewItems', items);
    this.setData({ items, folders: buildFolders(items, types, 'type'), mastered: items.filter(item => item.mastered) });
  },
  persist(items) { this.setItems(items); cloudStore.saveSnapshot('reviews', items).catch(() => {}); },
  pick(e) { this.setData({ type: e.currentTarget.dataset.t }); },
  input(e) { this.setData({ content: e.detail.value }); },
  toggleFolder(e) { const name = e.currentTarget.dataset.n; this.setData({ [`open.${name}`]: !this.data.open[name] }); },
  toggleMastered() { this.setData({ openMastered: !this.data.openMastered }); },
  save() {
    if (!this.data.content.trim()) return wx.showToast({ title: '写下一个可复习的问题', icon: 'none' });
    const schedule = nextReview(0);
    this.persist([{ id: Date.now(), type: this.data.type, content: this.data.content, created: new Date().toLocaleDateString('zh-CN'), stage: 0, next: schedule.next, mastered: false }, ...this.data.items]);
    this.setData({ content: '' });
  },
  review(e) {
    const id = e.currentTarget.dataset.id;
    this.persist(this.data.items.map(item => item.id === id ? { ...item, ...nextReview(item.stage) } : item));
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
  }
});
