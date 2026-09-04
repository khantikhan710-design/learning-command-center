const cloudStore = require('../../utils/cloud-store');
const { mergeCategories, buildFolders } = require('../../utils/study-folders');
const { getPreviewUrls, currentPreviewUrl } = require('../../utils/evidence-links');
const { formatRecordDate } = require('../../utils/date-display');
const { MATERIAL_SOURCES, normalizeMaterialSource, materialTitle, createReviewDraft } = require('../../utils/study-material-cards');
const { isCloudPath, saveLocalImages, saveLocalFiles } = require('../../utils/local-attachments');
const defaults = ['考研数学', '专业基础', '硬件电路', '英语', 'AI学习'];
const sort = records => [...records].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

Page({
  data: { subject: '考研数学', categories: defaults, source: 'Goodnotes', sources: MATERIAL_SOURCES, title: '', content: '', images: [], files: [], records: [], folders: [], open: {}, activeRecordId: '', focusRecordId: '', touchStartX: 0 },
  onShow() {
    const categories = wx.getStorageSync('recordCategories') || defaults;
    this.setData({ categories });
    this.setRecords(wx.getStorageSync('studyRecords') || []);
    const openRecordId = wx.getStorageSync('openRecordId');
    if (openRecordId) {
      wx.removeStorageSync('openRecordId');
      const record = this.data.records.find(item => String(item.id) === String(openRecordId));
      if (record) {
        const folderKey = 'open.' + record.subject;
        this.setData({ [folderKey]: true, focusRecordId: record.id });
      }
    }
    cloudStore.loadSnapshot('records').then(records => records && this.setRecords(records)).catch(() => {});
  },
  setRecords(records) {
    records = sort(records).map(record => ({
      ...record,
      files: (record.files || []).map((file, index) => ({ ...file, attachmentId: file.attachmentId || file.cloudFileID || file.localFilePath || file.path || `${record.id}-${index}` })),
      source: normalizeMaterialSource(record.source), displayTitle: materialTitle(record), displayDate: formatRecordDate(record.date)
    }));
    wx.setStorageSync('studyRecords', records);
    this.setData({ records, folders: buildFolders(records, this.data.categories) });
  },
  persist(records) {
    this.setRecords(records);
    cloudStore.saveSnapshot('records', sort(records)).catch(() => {});
    this.setData({ activeRecordId: '' });
  },
  pickSubject(e) { this.setData({ subject: e.currentTarget.dataset.s }); },
  chooseSource() {
    wx.showActionSheet({ itemList: this.data.sources, success: result => this.setData({ source: this.data.sources[result.tapIndex] }) });
  },
  addCategory() {
    wx.showModal({ title: '新增分类', editable: true, placeholderText: '例如：模电专题', success: result => {
      const categories = mergeCategories(this.data.categories, result.content);
      if (categories.length === this.data.categories.length) return;
      wx.setStorageSync('recordCategories', categories);
      this.setData({ categories, subject: categories[categories.length - 1] });
      this.setRecords(this.data.records);
    }});
  },
  input(e) { this.setData({ content: e.detail.value }); },
  inputTitle(e) { this.setData({ title: e.detail.value }); },
  chooseImage() { wx.chooseMedia({ count: 3, mediaType: ['image'], success: result => this.setData({ images: [...this.data.images, ...result.tempFiles.map(file => file.tempFilePath)] }) }); },
  chooseFile() { wx.chooseMessageFile({ count: 5, type: 'file', success: result => this.setData({ files: [...this.data.files, ...result.tempFiles] }) }); },
  toggleFolder(e) { const name = e.currentTarget.dataset.n; this.setData({ [`open.${name}`]: !this.data.open[name] }); },
  start(e) { this.setData({ touchStartX: e.touches[0].clientX }); },
  end(e) { const distance = e.changedTouches[0].clientX - this.data.touchStartX; if (distance < -50) this.setData({ activeRecordId: e.currentTarget.dataset.id }); if (distance > 50) this.setData({ activeRecordId: '' }); },
  pin(e) { const id = e.currentTarget.dataset.id; this.persist(this.data.records.map(record => record.id === id ? { ...record, pinned: !record.pinned } : record)); },
  remove(e) { const id = e.currentTarget.dataset.id; wx.showModal({ title: '删除记录？', content: '删除后无法恢复。', success: result => result.confirm && this.persist(this.data.records.filter(record => record.id !== id)) }); },
  save() {
    const hasText = this.data.title.trim() || this.data.content.trim();
    const hasAttachments = this.data.images.length || this.data.files.length;
    if (!hasText && !hasAttachments) return wx.showToast({ title: '写内容或添加附件', icon: 'none' });
    const makeRecord = (images = [], files = []) => ({ id: Date.now(), subject: this.data.subject, source: normalizeMaterialSource(this.data.source), title: this.data.title.trim(), content: this.data.content, images, files: files.map((file, index) => ({ ...file, attachmentId: file.cloudFileID || file.localFilePath || file.path || String(index) })), date: new Date().toLocaleString('zh-CN'), pinned: false });
    const finish = (record, message = '资料卡已保存') => {
      this.persist([record, ...this.data.records]);
      this.setData({ title: '', content: '', images: [], files: [] });
      wx.showToast({ title: message, icon: 'success' });
    };
    if (!hasAttachments) return finish(makeRecord());
    Promise.all([cloudStore.uploadImages(this.data.images), cloudStore.uploadFiles(this.data.files)])
      .then(([images, files]) => finish(makeRecord(images, files)))
      .catch(() => Promise.all([saveLocalImages(this.data.images), saveLocalFiles(this.data.files)])
        .then(([images, files]) => finish(makeRecord(images, files), '附件已保存到本机'))
        .catch(() => wx.showModal({
          title: '附件未保存',
          content: '云端和本机文件保存都失败了。请检查手机存储空间后重试。',
          showCancel: false
        })));
  },
  createReview(e) {
    const record = this.data.records.find(item => item.id === e.currentTarget.dataset.id);
    if (!record) return;
    wx.setStorageSync('reviewDraftFromRecord', createReviewDraft(record));
    wx.switchTab({ url: '/pages/review/review' });
  },
  previewRecordImage(e) {
    const images = e.currentTarget.dataset.images || [];
    const current = e.currentTarget.dataset.image;
    if (!images.length) return;
    if (!isCloudPath(current)) return wx.previewImage({ current, urls: images.filter(image => !isCloudPath(image)), showmenu: true });
    wx.cloud.getTempFileURL({ fileList: images, success: result => {
      const urls = getPreviewUrls(result.fileList);
      if (!urls.length) return wx.showToast({ title: '图片暂时无法读取', icon: 'none' });
      wx.previewImage({ current: currentPreviewUrl(result.fileList, current) || urls[0], urls, showmenu: true });
    }, fail: () => wx.showToast({ title: '图片暂时无法读取', icon: 'none' }) });
  },
  copyRecordText(e) { wx.setClipboardData({ data: e.currentTarget.dataset.text || '', success: () => wx.showToast({ title: '文字已复制', icon: 'success' }) }); },
  fileActions(e) {
    const file = e.currentTarget.dataset.f;
    wx.showActionSheet({ itemList: ['打开、转发或用其他应用', '复制文件名'], success: result => {
      if (result.tapIndex === 0) this.openFile(file);
      if (result.tapIndex === 1) wx.setClipboardData({ data: file.name || '', success: () => wx.showToast({ title: '文件名已复制', icon: 'success' }) });
    }});
  },
  openFile(eventOrFile) {
    const file = eventOrFile && (eventOrFile.cloudFileID || eventOrFile.localFilePath) ? eventOrFile : eventOrFile.currentTarget.dataset.f;
    if (file.localFilePath) return wx.openDocument({ filePath: file.localFilePath, showMenu: true, fail: () => wx.showToast({ title: '本机附件暂时无法打开', icon: 'none' }) });
    wx.cloud.downloadFile({ fileID: file.cloudFileID, success: result => wx.openDocument({ filePath: result.tempFilePath, showMenu: true }), fail: () => wx.showToast({ title: '文件暂时无法打开', icon: 'none' }) });
  }
});
