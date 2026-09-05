const assert = require('node:assert/strict');
const { monthKey, filterStudyItems, buildFilterOptions } = require('../miniprogram/utils/study-filter');

const records = [
  { id: 1, subject: '高数', source: 'Goodnotes', title: '极限错题', content: '夹逼准则', date: '2026/9/5 09:30' },
  { id: 2, subject: '硬件电路', source: 'WPS 扫描', title: '节点法', content: 'KCL', date: '2026/8/30 12:00' }
];

assert.equal(monthKey(records[0].date), '2026-09');
assert.deepEqual(buildFilterOptions(records, 'subject'), ['全部', '高数', '硬件电路']);
assert.deepEqual(filterStudyItems(records, { keyword: 'KCL', subject: '全部', source: '全部', month: '全部' }).map(item => item.id), [2]);
assert.deepEqual(filterStudyItems(records, { keyword: '', subject: '高数', source: 'Goodnotes', month: '2026-09' }).map(item => item.id), [1]);
assert.deepEqual(filterStudyItems(records, { keyword: 'missing', subject: '全部', source: '全部', month: '全部' }), []);
console.log('study filter tests passed');
