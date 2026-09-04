const cloudStore = require('../../utils/cloud-store');
const { buildMonthlyFolders } = require('../../utils/archive-folders');
const { formatRecordDate } = require('../../utils/date-display');
const { buildMonthlyMarkdown } = require('../../utils/obsidian-export');
const { STORAGE_KEYS, createBackup, parseBackup, summarizeBackup } = require('../../utils/local-backup');
const { buildFocusDashboard } = require('../../utils/focus-statistics');
const { getBackupStatus } = require('../../utils/backup-status');

Page({
  data: { folders: [], open: {}, showRestore: false, backupText: '', backupPreview: null, backupStatus: { text: '尚未生成完整备份', needsBackup: true }, weeklyStats: { totalMinutes: 0, daily: [], subjects: [], tasks: [] } },
  onShow() {
    const localRecords = wx.getStorageSync('studyRecords') || [];
    const localReviews = wx.getStorageSync('reviewItems') || [];
    const localTasks = wx.getStorageSync('studyTasks') || [];
    this.setData({ weeklyStats: buildFocusDashboard(wx.getStorageSync('focusSessions') || []), backupStatus: this.readBackupStatus() });
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
  },
  readBackupStorage() {
    return STORAGE_KEYS.reduce((storage, key) => {
      storage[key] = wx.getStorageSync(key);
      return storage;
    }, {});
  },
  readBackupStatus() {
    return getBackupStatus(wx.getStorageSync('lastLocalBackupAt'));
  },
  copyBackup() {
    const text = createBackup(this.readBackupStorage());
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.setStorageSync('lastLocalBackupAt', new Date().toISOString());
        this.setData({ backupStatus: this.readBackupStatus() });
        wx.showToast({ title: '备份已复制', icon: 'success' });
      }
    });
  },
  toggleRestore() {
    this.setData({ showRestore: !this.data.showRestore, backupText: '', backupPreview: null });
  },
  setBackupText(e) {
    this.setData({ backupText: e.detail.value, backupPreview: null });
  },
  previewRestore() {
    try {
      const backup = parseBackup(this.data.backupText);
      this.setData({ backupPreview: summarizeBackup(backup) });
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },
  confirmRestore() {
    let backup;
    try {
      backup = parseBackup(this.data.backupText);
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
      return;
    }
    const summary = summarizeBackup(backup);
    wx.showModal({
      title: '确认恢复备份？',
      content: `将覆盖本机现有数据：任务 ${summary.tasks} 项、记录 ${summary.records} 条、复盘 ${summary.reviews} 条。`,
      confirmText: '确认覆盖', confirmColor: '#e65050',
      success: result => {
        if (!result.confirm) return;
        STORAGE_KEYS.forEach(key => wx.setStorageSync(key, backup.data[key]));
        this.setEntries(backup.data.studyRecords, backup.data.reviewItems, backup.data.studyTasks);
        this.setData({ showRestore: false, backupText: '', backupPreview: null, open: {} });
        wx.showToast({ title: '本机数据已恢复', icon: 'success' });
      }
    });
  }
});
