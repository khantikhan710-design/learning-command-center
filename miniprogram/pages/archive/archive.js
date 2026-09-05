const cloudStore = require('../../utils/cloud-store');
const { buildMonthlyFolders, toggleFolderOpen, buildRecordClipboardText, filterRecordsBySource, updateRecordById } = require('../../utils/archive-folders');
const { formatRecordDate } = require('../../utils/date-display');
const { isCloudPath } = require('../../utils/local-attachments');
const { buildMonthlyMarkdown } = require('../../utils/obsidian-export');
const { STORAGE_KEYS, createBackup, parseBackup, summarizeBackup, backupFileName } = require('../../utils/local-backup');
const { buildFocusDashboard } = require('../../utils/focus-statistics');
const { getBackupStatus, buildLocalSafetyStatus } = require('../../utils/backup-status');
const { buildWeeklyReview, buildWeeklyReport } = require('../../utils/weekly-review');
const { buildReviewCoach } = require('../../utils/review-coach');
const { dueReviews } = require('../../utils/review-status');
const { buildReminderState } = require('../../utils/reminder-state');
const { KNOWLEDGE_SOURCES } = require('../../utils/knowledge-sources');
const { createReviewDraft } = require('../../utils/study-material-cards');

Page({
  data: {
    folders: [], open: {}, showRestore: false, backupText: '', backupPreview: null,
    backupStatus: { text: '尚未生成完整备份', needsBackup: true },
    weeklyStats: { totalMinutes: 0, daily: [], subjects: [], tasks: [] },
    weeklyReview: { plan: { total: 0, completed: 0, percent: 0 }, totalMinutes: 0, subjects: [], weakTopics: [], streak: 0 },
    reminderState: { dueCount: 0, title: '今天没有到期复盘', message: '本机提醒已启用；微信订阅消息待配置。', subscription: '未配置' },
    knowledgeSources: KNOWLEDGE_SOURCES,
    cloudStatus: { state: 'unknown', title: '云同步尚未检测', message: '当前以本机数据为准；可手动检测云连接。' },
    localSafety: { needsBackup: true, unsavedFiles: 0, oversizedFiles: 0 }, weeklyReport: '', archiveSource: '全部', archiveSourceOptions: ['全部']
  },
  onShow() {
    const localRecords = wx.getStorageSync('studyRecords') || [];
    const localReviews = wx.getStorageSync('reviewItems') || [];
    const localTasks = wx.getStorageSync('studyTasks') || [];
    const sessions = wx.getStorageSync('focusSessions') || [];
    const activityDates = wx.getStorageSync('reviewActiveDates') || [];
    const reviewCoach = buildReviewCoach({ activityDates, dueCount: localReviews.filter(item => !item.mastered).length, reviewCount: localReviews.length });
    this.setData({
      weeklyStats: buildFocusDashboard(sessions),
      weeklyReview: buildWeeklyReview({ tasks: localTasks, sessions, reviews: localReviews, activityDates }),
      reminderState: buildReminderState({ dueCount: dueReviews(localReviews).length, missedDays: reviewCoach.missedDays }),
      backupStatus: this.readBackupStatus(),
      cloudStatus: cloudStore.getCloudStatus(),
      localSafety: buildLocalSafetyStatus({ backupAt: wx.getStorageSync('lastLocalBackupAt'), records: localRecords }),
      weeklyReport: buildWeeklyReport(buildWeeklyReview({ tasks: localTasks, sessions, reviews: localReviews, activityDates }))
    });
    this.setEntries(localRecords, localReviews, localTasks);
    Promise.all([cloudStore.loadSnapshot('records'), cloudStore.loadSnapshot('reviews'), cloudStore.loadTaskState()]).then(([records, reviews, taskState]) => {
      const cloudTasks = Array.isArray(taskState) ? taskState : taskState && taskState.tasks;
      this.setEntries(records || localRecords, reviews || localReviews, cloudTasks || localTasks);
    }).catch(() => {});
  },
  setEntries(records, reviews, tasks) {
    this.rawEntries = { records, reviews, tasks };
    const archiveSourceOptions = ['全部', ...new Set(records.map(record => record.source).filter(Boolean))];
    const archiveSource = archiveSourceOptions.includes(this.data.archiveSource) ? this.data.archiveSource : '全部';
    const folders = buildMonthlyFolders(filterRecordsBySource(records, archiveSource), reviews, tasks).map(folder => ({
      ...folder,
      records: folder.records.map(record => ({
        ...record,
        displayDate: formatRecordDate(record.date),
        images: record.images || [],
        files: record.files || [],
        clipboardText: buildRecordClipboardText(record)
      })),
      reviews: folder.reviews.map(review => ({ ...review, displayDate: review.created || review.masteredAt || '未记录时间' })),
      tasks: folder.tasks.map(task => ({ ...task, statusLabel: task.done ? '已完成' : '未完成' }))
    }));
    this.setData({ folders, archiveSource, archiveSourceOptions });
  },
  toggleFolder(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ open: toggleFolderOpen(this.data.open, key) });
  },
  copyRecordText(e) {
    const text = e.currentTarget.dataset.text || '';
    if (!text) return wx.showToast({ title: '这条记录没有可复制的文字', icon: 'none' });
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '记录文字已复制', icon: 'success' }) });
  },
  previewRecordImage(e) {
    const images = e.currentTarget.dataset.images || [];
    const current = e.currentTarget.dataset.image;
    if (!images.length) return;
    if (!isCloudPath(current)) return wx.previewImage({ current, urls: images.filter(image => !isCloudPath(image)), showMenu: true });
    wx.cloud.getTempFileURL({
      fileList: images,
      success: result => {
        const urls = (result.fileList || []).filter(file => file.status === 0 && file.tempFileURL).map(file => file.tempFileURL);
        if (!urls.length) return wx.showToast({ title: '图片暂时无法读取', icon: 'none' });
        const matching = (result.fileList || []).find(file => file.fileID === current);
        wx.previewImage({ current: matching && matching.tempFileURL || urls[0], urls, showMenu: true });
      },
      fail: () => wx.showToast({ title: '图片暂时无法读取', icon: 'none' })
    });
  },
  fileActions(e) {
    const file = e.currentTarget.dataset.file;
    if (!file) return;
    if (file.status === 'needs_source') return wx.showModal({ title: '原件未保存', content: file.reason || '请回到“记录”页重新选择并保存原件。', showCancel: false });
    wx.showActionSheet({
      itemList: ['打开 / 转发 / 用其他应用', '复制文件名'],
      success: result => {
        if (result.tapIndex === 0) this.openFile(file);
        if (result.tapIndex === 1) wx.setClipboardData({ data: file.name || '', success: () => wx.showToast({ title: '文件名已复制', icon: 'success' }) });
      }
    });
  },
  openFile(file) {
    if (file.localFilePath) return wx.openDocument({ filePath: file.localFilePath, showMenu: true, fail: () => wx.showToast({ title: '本机附件暂时无法打开', icon: 'none' }) });
    if (!file.cloudFileID) return wx.showToast({ title: '找不到可打开的附件原件', icon: 'none' });
    wx.cloud.downloadFile({ fileID: file.cloudFileID, success: result => wx.openDocument({ filePath: result.tempFilePath, showMenu: true }), fail: () => wx.showToast({ title: '云端附件暂时无法打开', icon: 'none' }) });
  },
  chooseArchiveSource() {
    wx.showActionSheet({ itemList: this.data.archiveSourceOptions, success: result => {
      const archiveSource = this.data.archiveSourceOptions[result.tapIndex];
      this.setData({ archiveSource }, () => {
        const entries = this.rawEntries || { records: [], reviews: [], tasks: [] };
        this.setEntries(entries.records, entries.reviews, entries.tasks);
      });
    }});
  },
  manageRecord(e) {
    const record = e.currentTarget.dataset.record;
    if (!record) return;
    wx.showActionSheet({ itemList: [record.pinned ? '取消置顶' : '置顶', '转为复盘', '删除资料卡'], success: result => {
      if (result.tapIndex === 0) return this.persistArchiveRecords(updateRecordById(this.rawEntries.records, record.id, item => ({ ...item, pinned: !item.pinned })));
      if (result.tapIndex === 1) {
        wx.setStorageSync('reviewDraftFromRecord', createReviewDraft(record));
        return wx.switchTab({ url: '/pages/review/review' });
      }
      wx.showModal({ title: '删除资料卡？', content: '删除后无法恢复。', confirmColor: '#e65050', success: confirm => {
        if (confirm.confirm) this.persistArchiveRecords(this.rawEntries.records.filter(item => String(item.id) !== String(record.id)));
      }});
    }});
  },
  persistArchiveRecords(records) {
    wx.setStorageSync('studyRecords', records);
    const entries = this.rawEntries || { reviews: [], tasks: [] };
    this.setEntries(records, entries.reviews, entries.tasks);
    cloudStore.saveSnapshot('records', records).catch(() => this.setData({ cloudStatus: cloudStore.getCloudStatus() }));
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
  goReview() { wx.switchTab({ url: '/pages/review/review' }); },
  copySource(e) {
    const source = this.data.knowledgeSources.find(item => item.id === e.currentTarget.dataset.id);
    if (!source || !source.url) return wx.showToast({ title: '请通过自己的资料卡补充该来源', icon: 'none' });
    wx.setClipboardData({ data: source.url, success: () => wx.showToast({ title: '来源链接已复制', icon: 'success' }) });
  },
  checkCloud() {
    wx.showLoading({ title: '检测中' });
    cloudStore.checkConnection().then(() => wx.showToast({ title: '云同步可用', icon: 'success' })).catch(() => wx.showToast({ title: '云开发不可用', icon: 'none' })).finally(() => {
      wx.hideLoading();
      this.setData({ cloudStatus: cloudStore.getCloudStatus() });
    });
  },
  copyWeeklyReport() {
    wx.setClipboardData({ data: this.data.weeklyReport, success: () => wx.showToast({ title: '本周报告已复制', icon: 'success' }) });
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
  exportBackupFile() {
    const text = createBackup(this.readBackupStorage());
    const name = backupFileName();
    const path = `${wx.env.USER_DATA_PATH}/${name}`;
    wx.getFileSystemManager().writeFile({ filePath: path, data: text, encoding: 'utf8', success: () => {
      wx.setStorageSync('lastLocalBackupAt', new Date().toISOString());
      this.setData({ backupStatus: this.readBackupStatus(), localSafety: buildLocalSafetyStatus({ backupAt: wx.getStorageSync('lastLocalBackupAt'), records: wx.getStorageSync('studyRecords') || [] }) });
      if (typeof wx.shareFileMessage === 'function') return wx.shareFileMessage({ filePath: path, fileName: name, success: () => wx.showToast({ title: '备份文件已发起转发', icon: 'success' }), fail: () => wx.showToast({ title: '文件已生成，可用复制备份', icon: 'none' }) });
      wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '当前环境不支持转发，已复制', icon: 'none' }) });
    }, fail: () => wx.showToast({ title: '备份文件生成失败', icon: 'none' }) });
  },
  chooseBackupFile() {
    wx.chooseMessageFile({ count: 1, type: 'file', success: result => {
      const file = (result.tempFiles || [])[0];
      if (!file) return;
      wx.getFileSystemManager().readFile({ filePath: file.path, encoding: 'utf8', success: read => {
        this.setData({ showRestore: true, backupText: read.data, backupPreview: null });
        this.previewRestore();
      }, fail: () => wx.showToast({ title: '无法读取备份文件', icon: 'none' }) });
    }});
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
