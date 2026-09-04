const { intervals } = require('./spaced-repetition');
const { parseChineseDate } = require('./review-status');

function reviewStatus(index, stage) {
  if (index < stage) return 'done';
  if (index === stage) return 'current';
  return 'future';
}

function retentionForDay(day) {
  return Math.max(12, Math.round(100 * Math.exp(-day / 11)));
}

function buildReviewCurve(item) {
  const stage = Math.max(0, Math.min(intervals.length, Number(item && item.stage) || 0));
  const content = String(item && item.content || '未命名复盘').split('\n')[0];
  return {
    title: `${item && item.type || '未分类'}｜${content}`,
    next: item && item.next || '待安排',
    stage,
    points: Array.from({ length: 31 }, (_, day) => ({ day, retention: retentionForDay(day) })),
    milestones: intervals.map((day, index) => ({ day, label: `${day} 天`, status: reviewStatus(index, stage) }))
  };
}

function selectCurveItem(items, dueItems) {
  if (dueItems && dueItems.length) return dueItems[0];
  return (items || []).filter(item => !item.mastered).sort((left, right) => {
    const leftTime = parseChineseDate(left.next);
    const rightTime = parseChineseDate(right.next);
    return (leftTime ? leftTime.getTime() : Infinity) - (rightTime ? rightTime.getTime() : Infinity);
  })[0] || null;
}

module.exports = { buildReviewCurve, selectCurveItem };
