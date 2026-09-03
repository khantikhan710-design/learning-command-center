const ENV_ID = 'study-command-doc-d4ddzc7244fd32';
const collections = { tasks: 'study_tasks', records: 'study_records', reviews: 'study_reviews', focus: 'study_focus_sessions' };

function collectionFor(name) { return collections[name]; }
function database() { return wx.cloud.database({ env: ENV_ID }); }

function loadSnapshot(name) {
  return new Promise((resolve, reject) => {
    database().collection(collectionFor(name)).where({ key: 'current' }).get({
      success: res => resolve(res.data.length ? res.data[0].items || [] : null), fail: reject
    });
  });
}

function saveSnapshot(name, items) {
  return new Promise((resolve, reject) => {
    const collection = database().collection(collectionFor(name));
    collection.where({ key: 'current' }).get({
      success: res => {
        const data = { items, updatedAt: database().serverDate() };
        if (res.data.length) collection.doc(res.data[0]._id).update({ data, success: resolve, fail: reject });
        else collection.add({ data: { key: 'current', ...data }, success: resolve, fail: reject });
      }, fail: reject
    });
  });
}

function addFocusSession(data) {
  return new Promise((resolve, reject) => database().collection(collectionFor('focus')).add({ data, success: resolve, fail: reject }));
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

module.exports = { ENV_ID, collectionFor, loadSnapshot, saveSnapshot, addFocusSession, uploadImages, uploadFiles };
