const cloudStore = require('../../utils/cloud-store');
const { buildMonthlyFolders } = require('../../utils/archive-folders');
const { formatRecordDate } = require('../../utils/date-display');

Page({
  data: { folders: [], open: {} },
  onShow() {
    const localRecords = wx.getStorageSync('studyRecords') || [];
    const localReviews = wx.getStorageSync('reviewItems') || [];
    this.setEntries(localRecords, localReviews);
    Promise.all([cloudStore.loadSnapshot('records'), cloudStore.loadSnapshot('reviews')]).then(([records, reviews]) => {
      this.setEntries(records || localRecords, reviews || localReviews);
    }).catch(() => {});
  },
  setEntries(records, reviews) {
    const folders = buildMonthlyFolders(records, reviews).map(folder => ({
      ...folder,
      records: folder.records.map(record => ({ ...record, displayDate: formatRecordDate(record.date) })),
      reviews: folder.reviews.map(review => ({ ...review, displayDate: review.created || review.masteredAt || '未记录时间' }))
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
  }
});
