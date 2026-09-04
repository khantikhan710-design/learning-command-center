const cloudStore = require('../../utils/cloud-store');
const { buildMonthlyFolders } = require('../../utils/archive-folders');
const { formatRecordDate } = require('../../utils/date-display');
const { buildMonthlyMarkdown } = require('../../utils/obsidian-export');

Page({
  data: { folders: [], open: {} },
  onShow() {
    const localRecords = wx.getStorageSync('studyRecords') || [];
    const localReviews = wx.getStorageSync('reviewItems') || [];
    const localTasks = wx.getStorageSync('studyTasks') || [];
    this.setEntries(localRecords, localReviews, localTasks);
    Promise.all([cloudStore.loadSnapshot('records'), cloudStore.loadSnapshot('reviews'), cloudStore.loadTaskState()]).then(([records, reviews, taskState]) => {
      const cloudTasks = Array.isArray(taskState) ? taskState : taskState && taskState.tasks;
      this.setEntries(records || localRecords, reviews || localReviews, cloudTasks || localTasks);
    }).catch(() => {});
  },
  setEntries(records, reviews, tasks) {
    const folders = buildMonthlyFolders(records, reviews, tasks).map(folder => ({
      ...folder,
      records: folder.records.map(record => ({ ...record, displayDate: formatRecordDate(record.date) })),
      reviews: folder.reviews.map(review => ({ ...review, displayDate: review.created || review.masteredAt || '未记录时间' })),
      tasks: folder.tasks.map(task => ({ ...task, statusLabel: task.done ? '已完成' : '未完成' }))
    }));
    this.setData({ folders });
  },
  toggleFolder(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`open.${key}`]: !this.data.open[key] });
  },
  copySummary(e) {
    const folder = this.data.folders.find(item => item.key === e.currentTarget.dataset.key);
    if (!folder) return;
    const text = [`${folder.label} 学习归档`, `学习记录：${folder.recordCount} 条`, `复盘条目：${folder.reviewCount} 条`, ...folder.records.map(record => `记录｜${record.subject || '未分类'}｜${record.content || '附件记录'}`), ...folder.reviews.map(review => `复盘｜${review.type || '未分类'}｜${review.content}`)].join('\n');
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '本月摘要已复制', icon: 'success' }) });
  },
  copyObsidian(e) {
    const folder = this.data.folders.find(item => item.key === e.currentTarget.dataset.key);
    if (!folder) return;
    const markdown = buildMonthlyMarkdown(folder);
    wx.setClipboardData({ data: markdown, success: () => wx.showToast({ title: 'Obsidian 文本已复制', icon: 'success' }) });
  }
});
