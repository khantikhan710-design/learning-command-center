const ENV_ID = 'study-command-doc-d4ddzc7244fd32';
const collections = { tasks: 'study_tasks', records: 'study_records', reviews: 'study_reviews', focus: 'study_focus_sessions' };

function collectionFor(name) { return collections[name]; }
function callData(action, name, data = {}) {
  return wx.cloud.callFunction({ name: 'studyData', data: { action, name, ...data } }).then(result => result.result);
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

module.exports = { ENV_ID, collectionFor, loadSnapshot, saveSnapshot, loadTaskState, saveTaskState, addFocusSession, uploadImages, uploadFiles };
