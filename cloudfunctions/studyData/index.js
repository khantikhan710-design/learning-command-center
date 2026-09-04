const cloud = require('wx-server-sdk');
const { collectionFor, snapshotFilter, focusRecord } = require('./access');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) throw new Error('Unable to identify the current user');
  const db = cloud.database();
  const collection = db.collection(collectionFor(event.name));

  if (event.action === 'load') {
    const result = await collection.where(snapshotFilter(OPENID)).limit(1).get();
    return { items: result.data.length ? result.data[0].items || [] : null };
  }

  if (event.action === 'save') {
    const validItems = Array.isArray(event.items) || (
      event.name === 'tasks' && event.items && Array.isArray(event.items.tasks) && Array.isArray(event.items.categories)
    );
    if (!validItems) throw new Error('Invalid snapshot data');
    const filter = snapshotFilter(OPENID);
    const current = await collection.where(filter).limit(1).get();
    const data = { ...filter, items: event.items, updatedAt: db.serverDate() };
    if (current.data.length) await collection.doc(current.data[0]._id).update({ data });
    else await collection.add({ data });
    return { ok: true };
  }

  if (event.action === 'addFocus') {
    const data = focusRecord(event.data || {}, OPENID);
    await collection.add({ data: { ...data, createdAt: db.serverDate() } });
    return { ok: true };
  }

  throw new Error('Unsupported action');
};
