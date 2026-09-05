const ENV_ID = 'study-command-doc-d4ddzc7244fd32';
const CLOUD_STATUS_KEY = 'studyCloudStatus';
const collections = { tasks: 'study_tasks', records: 'study_records', reviews: 'study_reviews', focus: 'study_focus_sessions' };

function collectionFor(name) { return collections[name]; }
function normalizeCloudStatus(status) {
  if (status && status.state === 'available') return { state: 'available', title: '云同步可用', message: '云同步可用；本机仍保留一份副本。' };
  if (status && status.state === 'offline') return { state: 'offline', title: '本机模式', message: '云开发暂不可用，学习数据只保存在当前设备。', error: status.error || '' };
  return { state: 'unknown', title: '云同步尚未检测', message: '当前以本机数据为准；可手动检测云连接。' };
}
function getCloudStatus(api = wx) { return normalizeCloudStatus(api.getStorageSync(CLOUD_STATUS_KEY)); }
function saveCloudStatus(status, api = wx) { api.setStorageSync(CLOUD_STATUS_KEY, status); return normalizeCloudStatus(status); }
function markCloudAvailable(api = wx) { return saveCloudStatus({ state: 'available', checkedAt: Date.now() }, api); }
function markCloudUnavailable(error, api = wx) { return saveCloudStatus({ state: 'offline', checkedAt: Date.now(), error: String(error && (error.errMsg || error.message) || error || '') }, api); }
function callData(action, name, data = {}) {
  return wx.cloud.callFunction({ name: 'studyData', data: { action, name, ...data } })
    .then(result => { markCloudAvailable(); return result.result; })
    .catch(error => { markCloudUnavailable(error); throw error; });
}

function loadSnapshot(name) {
  return callData('load', name).then(result => result.items);
}

function saveSnapshot(name, items) {
  return callData('save', name, { items });
}

function loadTaskState() {
  return callData('load', 'tasks').then(result => result.items);
}

function saveTaskState(state) {
  return callData('save', 'tasks', { items: state });
}

function addFocusSession(data) {
  return callData('addFocus', 'focus', { data });
}
function checkConnection() { return callData('load', 'tasks').then(() => getCloudStatus()); }

function uploadImages(paths) {
  return Promise.all(paths.map((path, index) => {
    if (path.startsWith('cloud://')) return Promise.resolve(path);
    return new Promise((resolve, reject) => wx.cloud.uploadFile({ cloudPath: `study-records/${Date.now()}-${index}.jpg`, filePath: path, success: res => resolve(res.fileID), fail: reject }));
  }));
}

function uploadFiles(files) {
  return Promise.all(files.map((file, index) => new Promise((resolve, reject) => {
    if (file.cloudFileID) return resolve(file);
    const suffix = (file.name || file.path || '').split('.').pop() || 'file';
    wx.cloud.uploadFile({ cloudPath: `study-files/${Date.now()}-${index}.${suffix}`, filePath: file.path, success: res => resolve({ name: file.name || `附件.${suffix}`, cloudFileID: res.fileID, type: suffix }), fail: reject });
  })));
}

module.exports = { ENV_ID, collectionFor, normalizeCloudStatus, getCloudStatus, markCloudAvailable, markCloudUnavailable, loadSnapshot, saveSnapshot, loadTaskState, saveTaskState, addFocusSession, checkConnection, uploadImages, uploadFiles };
