const cloudStore = require('../../utils/cloud-store');
const { nextReview } = require('../../utils/spaced-repetition');
const { mergeCategories, buildFolders, markMastered, unmarkMastered } = require('../../utils/study-folders');
const { buildPrompts } = require('../../utils/review-prompts');
const { removeReview } = require('../../utils/review-actions');
const { dueReviews } = require('../../utils/review-status');
const { recordReviewDay, buildReviewCoach } = require('../../utils/review-coach');
const { buildReviewCurve, selectCurveItem } = require('../../utils/review-curve');
const { monthKey, buildFilterOptions, filterStudyItems } = require('../../utils/study-filter');
const defaultCategories = ['错题', '概念', '硬件设计', 'AI想法'];

Page({
  data: {
    type: '错题', categories: defaultCategories, content: '', items: [], folders: [], mastered: [], dueItems: [], duePreview: [], coach: {}, curve: null,
    open: {}, openMastered: false, activePromptId: null, activePrompts: [], pendingRecordId: '', pendingSourceLabel: '',
    filter: { keyword: '', subject: '全部', source: '全部', month: '全部' },
    filterOptions: { subjects: ['全部'], sources: ['全部'], months: ['全部'] }, filtering: false
  },
  onReady() { this.drawCurve(); },
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
    this.renderItems(items);
  },
  renderItems(items) {
    const dueItems = dueReviews(items);
    const coach = buildReviewCoach({ activityDates: wx.getStorageSync('reviewActiveDates') || [], dueCount: dueItems.length, reviewCount: items.length });
    const curveItem = selectCurveItem(items, dueItems);
    const searchable = items.map(item => ({ ...item, subject: item.type, source: item.sourceLabel || '手动录入', date: item.created || item.masteredAt }));
    const visibleIds = new Set(filterStudyItems(searchable, this.data.filter).map(item => item.id));
    const visibleItems = items.filter(item => visibleIds.has(item.id));
    const months = [...new Set(searchable.map(item => monthKey(item.date)))].sort().reverse();
    const filter = this.data.filter;
    this.setData({
      items,
      folders: buildFolders(visibleItems, this.data.categories, 'type'),
      mastered: visibleItems.filter(item => item.mastered),
      dueItems, duePreview: dueItems.slice(0, 3), coach, curve: curveItem ? buildReviewCurve(curveItem) : null,
      filterOptions: { subjects: buildFilterOptions(searchable, 'subject'), sources: buildFilterOptions(searchable, 'source'), months: ['全部', ...months] },
      filtering: Boolean(filter.keyword || filter.subject !== '全部' || filter.source !== '全部' || filter.month !== '全部')
    });
    wx.nextTick(() => this.drawCurve());
  },
  drawCurve() {
    const curve = this.data.curve;
    if (!curve) return;
    wx.createSelectorQuery().in(this).select('#review-curve').fields({ node: true, size: true }).exec(result => {
      const target = result && result[0];
      if (!target || !target.node || !target.width || !target.height) return;
      const canvas = target.node;
      const context = canvas.getContext('2d');
      const ratio = wx.getSystemInfoSync().pixelRatio || 1;
      canvas.width = target.width * ratio;
      canvas.height = target.height * ratio;
      context.scale(ratio, ratio);
      const width = target.width;
      const height = target.height;
      const padding = { left: 28, right: 12, top: 16, bottom: 26 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      context.clearRect(0, 0, width, height);
      context.strokeStyle = '#dfe8f2';
      context.lineWidth = 1;
      context.setLineDash([3, 4]);
      [25, 50, 75].forEach(percent => {
        const y = padding.top + chartHeight * (1 - percent / 100);
        context.beginPath(); context.moveTo(padding.left, y); context.lineTo(width - padding.right, y); context.stroke();
      });
      context.setLineDash([]);
      context.strokeStyle = '#9eafc1';
      context.beginPath(); context.moveTo(padding.left, padding.top); context.lineTo(padding.left, height - padding.bottom); context.lineTo(width - padding.right, height - padding.bottom); context.stroke();
      context.strokeStyle = '#1677ff';
      context.lineWidth = 2.5;
      curve.points.forEach((point, index) => {
        const x = padding.left + chartWidth * point.day / 30;
        const y = padding.top + chartHeight * (1 - point.retention / 100);
        if (index === 0) context.beginPath(), context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.stroke();
      curve.milestones.forEach(node => {
        const x = padding.left + chartWidth * node.day / 30;
        const point = curve.points[node.day];
        const y = padding.top + chartHeight * (1 - point.retention / 100);
        context.fillStyle = node.status === 'done' ? '#1677ff' : node.status === 'current' ? '#f2994a' : '#b4c0ce';
        context.beginPath(); context.arc(x, y, node.status === 'current' ? 5 : 4, 0, Math.PI * 2); context.fill();
      });
      context.fillStyle = '#7890a7'; context.font = '10px sans-serif';
      context.fillText('今天', padding.left - 3, height - 8); context.fillText('30 天', width - padding.right - 25, height - 8);
    });
  },
  persist(items) { this.setItems(items); cloudStore.saveSnapshot('reviews', items).catch(() => {}); },
  recordActivity() {
    wx.setStorageSync('reviewActiveDates', recordReviewDay(wx.getStorageSync('reviewActiveDates') || []));
  },
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
  setFilterKeyword(e) { this.setData({ 'filter.keyword': e.detail.value }, () => this.renderItems(this.data.items)); },
  pickFilterSubject(e) { this.setData({ 'filter.subject': e.currentTarget.dataset.value }, () => this.renderItems(this.data.items)); },
  pickFilterSource(e) { this.setData({ 'filter.source': e.currentTarget.dataset.value }, () => this.renderItems(this.data.items)); },
  pickFilterMonth(e) { this.setData({ 'filter.month': e.currentTarget.dataset.value }, () => this.renderItems(this.data.items)); },
  clearFilter() { this.setData({ filter: { keyword: '', subject: '全部', source: '全部', month: '全部' } }, () => this.renderItems(this.data.items)); },
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
    this.recordActivity();
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
    this.recordActivity();
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
