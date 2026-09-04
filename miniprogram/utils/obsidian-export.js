const { monthKey } = require('./archive-folders');

function countImages(record) {
  return Array.isArray(record.images) ? record.images.length : 0;
}

function listFiles(record) {
  return Array.isArray(record.files) ? record.files : [];
}

function groupBy(items, field, fallback = '未分类') {
  return items.reduce((groups, item) => {
    const key = item[field] || fallback;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

function taskLine(task) {
  return `- [${task.done ? 'x' : ' '}] ${task.title || '未命名任务'}（${task.subject || '未分类'}）`;
}

function textLines(items, field, formatter) {
  const groups = groupBy(items, field);
  const names = Object.keys(groups);
  if (!names.length) return ['- 无'];
  return names.flatMap(name => [`### ${name}`, ...groups[name].map(formatter), '']).slice(0, -1);
}

function buildMonthlyMarkdown(folder, exportedOn = new Date().toISOString().slice(0, 10)) {
  const records = folder.records || [];
  const reviews = folder.reviews || [];
  const tasks = folder.tasks || [];
  const createdTasks = tasks.filter(task => monthKey(task.createdAt) === folder.key);
  const completedTasks = tasks.filter(task => monthKey(task.completedAt) === folder.key);
  const attachmentRecords = records.filter(record => countImages(record) || listFiles(record).length);
  const taskCount = tasks.length;

  const lines = [
    '---',
    `title: "学习归档-${folder.key}"`,
    `tags: [学习归档, ${folder.key.replace('-', '年')}月]`,
    `exported: ${exportedOn}`,
    '---',
    '',
    `# ${folder.label} 学习归档`,
    '',
    '## 本月概览',
    `- 学习记录：${records.length} 条`,
    `- 复盘条目：${reviews.length} 条`,
    `- 任务：${taskCount} 项`,
    '',
    '## 本月任务',
    '### 本月新增',
    ...(createdTasks.length ? createdTasks.map(taskLine) : ['- 无']),
    '',
    '### 本月完成',
    ...(completedTasks.length ? completedTasks.map(taskLine) : ['- 无']),
    '',
    '## 学习记录',
    ...textLines(records, 'subject', record => `- ${record.content || '图片或文件附件记录'}`),
    '',
    '## 复盘条目',
    ...textLines(reviews, 'type', review => `- [${review.mastered ? 'x' : ' '}] ${review.content || '未填写复盘内容'}`),
    '',
    '## 附件索引',
    ...(attachmentRecords.length ? textLines(attachmentRecords, 'subject', record => {
      const details = [];
      if (countImages(record)) details.push(`图片 ${countImages(record)} 张`);
      const files = listFiles(record).map(file => file.name || '未命名文件');
      if (files.length) details.push(`文件：${files.join('、')}`);
      return `- ${record.content || '附件记录'}：${details.join('；')}`;
    }) : ['- 本月没有附件。']),
    '',
    '> 说明：附件索引保留名称与数量；图片、PDF、Word 等原文件仍在小程序记录中。'
  ];
  return lines.join('\n');
}

module.exports = { buildMonthlyMarkdown };
