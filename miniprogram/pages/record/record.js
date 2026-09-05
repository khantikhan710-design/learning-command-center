const cloudStore = require('../../utils/cloud-store');
const { mergeCategories, buildFolders } = require('../../utils/study-folders');
const { getPreviewUrls, currentPreviewUrl } = require('../../utils/evidence-links');
const { formatRecordDate } = require('../../utils/date-display');
const { MATERIAL_SOURCES, normalizeMaterialSource, materialTitle, createReviewDraft, createSourceImportDraft } = require('../../utils/study-material-cards');
const { isCloudPath, saveLocalImages, saveLocalFilesWithStatus } = require('../../utils/local-attachments');
const { removeAttachment, replaceAttachment } = require('../../utils/record-attachments');
const { monthKey, buildFilterOptions, filterStudyItems } = require('../../utils/study-filter');
const defaults = ['考研数学', '专业基础', '硬件电路', '英语', 'AI学习'];
const sort = records => [...records].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
const SOURCE_GUIDES = {
  Goodnotes: { kind: 'file', action: '选择文件', content: '请先在 Goodnotes 导出 PDF 到微信文件传输助手，再回到这里选择该文件。小程序不能直接读取 Goodnotes 内的笔记。' },
  'WPS 扫描': { kind: 'file', action: '选择文件', content: '请先在 WPS 中把 PDF/Word 分享到微信文件传输助手，再回到这里选择该文件。纸质扫描照片可改用“图片”。' },
  '纸质拍照': { kind: 'image', action: '添加图片', content: '现在可从相册选择纸质题目照片。图片只有保存成功后才会成为资料卡附件。' },
  其他: { kind: '', action: '知道了', content: '可以只记录文字，也可以用“PDF / Word”从微信文件传输助手选择已有资料。' }
};

Page({
  data: {
    subject: '考研数学', categories: defaults, source: 'Goodnotes', sources: MATERIAL_SOURCES,
    title: '', content: '', images: [], files: [], importHint: '', records: [], folders: [], open: {}, activeRecordId: '', focusRecordId: '', touchStartX: 0,
    filter: { keyword: '', subject: '全部', source: '全部', month: '全部' },
    filterOptions: { subjects: ['全部'], sources: ['全部'], months: ['全部'] }, filtering: false
  },
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
      files: (record.files || []).map((file, index) => ({ ...file, status: file.status || 'saved', attachmentId: file.attachmentId || file.cloudFileID || file.localFilePath || file.path || `${record.id}-${index}` })),
      source: normalizeMaterialSource(record.source), displayTitle: materialTitle(record), displayDate: formatRecordDate(record.date)
    }));
    wx.setStorageSync('studyRecords', records);
    this.renderRecords(records);
  },
  renderRecords(records) {
    const visible = filterStudyItems(records, this.data.filter);
    const months = [...new Set(records.map(item => monthKey(item.date)))].sort().reverse();
    const filter = this.data.filter;
    this.setData({
      records,
      folders: buildFolders(visible, this.data.categories),
      filterOptions: { subjects: buildFilterOptions(records, 'subject'), sources: buildFilterOptions(records, 'source'), months: ['全部', ...months] },
      filtering: Boolean(filter.keyword || filter.subject !== '全部' || filter.source !== '全部' || filter.month !== '全部')
    });
  },
  persist(records) {
    this.setRecords(records);
    cloudStore.saveSnapshot('records', sort(records)).catch(() => {});
    this.setData({ activeRecordId: '' });
  },
  pickSubject(e) { this.setData({ subject: e.currentTarget.dataset.s }); },
  chooseSource() {
    wx.showActionSheet({ itemList: this.data.sources, success: result => {
      const source = this.data.sources[result.tapIndex];
      this.setData({ source });
      this.showSourceGuide(source);
    }});
  },
  showSourceGuide(source) {
    const guide = SOURCE_GUIDES[source] || SOURCE_GUIDES.其他;
    wx.showModal({ title: '来源导入提示', content: guide.content, confirmText: guide.action, cancelText: '仅标记', success: result => {
      if (!result.confirm) return;
      if (guide.kind === 'image') this.chooseImage();
      if (guide.kind === 'file') this.chooseFile();
    }});
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
  setFilterKeyword(e) { this.setData({ 'filter.keyword': e.detail.value }, () => this.renderRecords(this.data.records)); },
  pickFilterSubject(e) { this.setData({ 'filter.subject': e.currentTarget.dataset.value }, () => this.renderRecords(this.data.records)); },
  pickFilterSource(e) { this.setData({ 'filter.source': e.currentTarget.dataset.value }, () => this.renderRecords(this.data.records)); },
  pickFilterMonth(e) { this.setData({ 'filter.month': e.currentTarget.dataset.value }, () => this.renderRecords(this.data.records)); },
  clearFilter() { this.setData({ filter: { keyword: '', subject: '全部', source: '全部', month: '全部' } }, () => this.renderRecords(this.data.records)); },
  chooseImage() { wx.chooseMedia({ count: 3, mediaType: ['image'], success: result => this.setData({ images: [...this.data.images, ...result.tempFiles.map(file => file.tempFilePath)] }) }); },
  chooseFile() { wx.chooseMessageFile({ count: 5, type: 'file', success: result => {
    const files = result.tempFiles || [];
    const draft = createSourceImportDraft(this.data.source, files[0]);
    this.setData({ files: [...this.data.files, ...files], title: this.data.title.trim() || draft.title, importHint: files.length ? draft.dateHint : '' });
  }}); },
  toggleFolder(e) { const name = e.currentTarget.dataset.n; this.setData({ [`open.${name}`]: !this.data.open[name] }); },
  start(e) { this.setData({ touchStartX: e.touches[0].clientX }); },
  end(e) { const distance = e.changedTouches[0].clientX - this.data.touchStartX; if (distance < -50) this.setData({ activeRecordId: e.currentTarget.dataset.id }); if (distance > 50) this.setData({ activeRecordId: '' }); },
  openRecordActions(e) { this.setData({ activeRecordId: e.currentTarget.dataset.id }); },
  pin(e) { const id = e.currentTarget.dataset.id; this.persist(this.data.records.map(record => record.id === id ? { ...record, pinned: !record.pinned } : record)); },
  remove(e) { const id = e.currentTarget.dataset.id; wx.showModal({ title: '删除记录？', content: '删除后无法恢复。', success: result => result.confirm && this.persist(this.data.records.filter(record => record.id !== id)) }); },
  save() {
    const hasText = this.data.title.trim() || this.data.content.trim();
    const hasAttachments = this.data.images.length || this.data.files.length;
    if (!hasText && !hasAttachments) return wx.showToast({ title: '写内容或添加附件', icon: 'none' });
    const makeRecord = (images = [], files = []) => ({ id: Date.now(), subject: this.data.subject, source: normalizeMaterialSource(this.data.source), title: this.data.title.trim(), content: this.data.content, images, files: files.map((file, index) => ({ ...file, status: file.status || 'saved', attachmentId: file.attachmentId || file.cloudFileID || file.localFilePath || file.path || String(index) })), date: new Date().toLocaleString('zh-CN'), pinned: false });
    const finish = (record, message = '资料卡已保存') => {
      this.persist([record, ...this.data.records]);
      this.setData({ title: '', content: '', images: [], files: [], importHint: '' });
      wx.showToast({ title: message, icon: 'success' });
    };
    if (!hasAttachments) return finish(makeRecord());
    const confirmKeepSourceOnly = (images, files, placeholders, missingImages = 0) => {
      const unavailable = placeholders.map(file => `${file.name}：${file.reason}`);
      if (missingImages) unavailable.push(`${missingImages} 张图片未保存到小程序`);
      wx.showModal({
        title: '部分附件未保存',
        content: `${unavailable.join('\n')}\n\n可保留资料卡正文与原件提示；请继续保留 Goodnotes/WPS 中的原文件。`,
        cancelText: '不保存', confirmText: '保留正文',
        success: result => { if (result.confirm) finish(makeRecord(images, [...files, ...placeholders]), '资料卡已保存，原件未保存'); }
      });
    };
    Promise.all([cloudStore.uploadImages(this.data.images), cloudStore.uploadFiles(this.data.files)])
      .then(([images, files]) => finish(makeRecord(images, files)))
      .catch(cloudError => {
        console.warn('[attachment] cloud save failed; trying local storage', cloudError);
        return Promise.all([
          Promise.allSettled(this.data.images.map(image => saveLocalImages([image]))),
          saveLocalFilesWithStatus(this.data.files)
        ]).then(([imageResults, fileResult]) => {
          const images = imageResults.filter(result => result.status === 'fulfilled').map(result => result.value[0]);
          const missingImages = imageResults.length - images.length;
          imageResults.filter(result => result.status === 'rejected').forEach(result => console.warn('[attachment] local image save failed', result.reason));
          fileResult.placeholders.forEach(file => console.warn('[attachment] local file save failed', file.name, file.reason));
          if (fileResult.placeholders.length || missingImages) return confirmKeepSourceOnly(images, fileResult.files, fileResult.placeholders, missingImages);
          finish(makeRecord(images, fileResult.files), '附件已保存到本机');
        });
      });
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
    const recordId = e.currentTarget.dataset.recordId;
    const needsSource = file.status === 'needs_source';
    wx.showActionSheet({ itemList: needsSource ? ['重新选择原件并保存', '复制文件名', '删除这份附件'] : ['打开、转发或用其他应用', '复制文件名', '删除这份附件'], success: result => {
      if (result.tapIndex === 0 && needsSource) this.replaceSourceAttachment(recordId, file.attachmentId);
      if (result.tapIndex === 0 && !needsSource) this.openFile(file);
      if (result.tapIndex === 1) wx.setClipboardData({ data: file.name || '', success: () => wx.showToast({ title: '文件名已复制', icon: 'success' }) });
      if (result.tapIndex === 2) wx.showModal({
        title: '删除这份附件？', content: '只删除附件，不删除资料卡正文。', confirmColor: '#e65050',
        success: confirm => { if (confirm.confirm) this.persist(removeAttachment(this.data.records, recordId, file.attachmentId)); }
      });
    }});
  },
  replaceSourceAttachment(recordId, attachmentId) {
    wx.chooseMessageFile({ count: 1, type: 'file', success: result => {
      const [selected] = result.tempFiles || [];
      if (!selected) return;
      cloudStore.uploadFiles([selected]).then(([file]) => {
        this.persist(replaceAttachment(this.data.records, recordId, attachmentId, { ...file, status: 'saved', attachmentId: file.cloudFileID }));
        wx.showToast({ title: '附件已保存', icon: 'success' });
      }).catch(cloudError => {
        console.warn('[attachment] cloud replacement failed; trying local storage', cloudError);
        saveLocalFilesWithStatus([selected]).then(result => {
          const [file] = result.files;
          if (!file) return wx.showModal({ title: '原件仍未保存', content: result.placeholders[0] ? result.placeholders[0].reason : '无法保存该文件，请保留原件后重试。', showCancel: false });
          this.persist(replaceAttachment(this.data.records, recordId, attachmentId, file));
          wx.showToast({ title: '附件已保存到本机', icon: 'success' });
        });
      });
    }});
  },
  openFile(eventOrFile) {
    const file = eventOrFile && (eventOrFile.cloudFileID || eventOrFile.localFilePath) ? eventOrFile : eventOrFile.currentTarget.dataset.f;
    if (file.localFilePath) return wx.openDocument({ filePath: file.localFilePath, showMenu: true, fail: () => wx.showToast({ title: '本机附件暂时无法打开', icon: 'none' }) });
    wx.cloud.downloadFile({ fileID: file.cloudFileID, success: result => wx.openDocument({ filePath: result.tempFilePath, showMenu: true }), fail: () => wx.showToast({ title: '文件暂时无法打开', icon: 'none' }) });
  }
});
