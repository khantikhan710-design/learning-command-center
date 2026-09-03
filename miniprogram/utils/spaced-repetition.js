const intervals = [1, 2, 4, 7, 15, 30];
function nextReview(stage, now = new Date()) { const days = intervals[Math.min(Number(stage) || 0, intervals.length - 1)]; const date = new Date(now); date.setDate(date.getDate() + days); return { stage: Math.min((Number(stage) || 0) + 1, intervals.length), next: date.toLocaleDateString('zh-CN') }; }
module.exports = { intervals, nextReview };
