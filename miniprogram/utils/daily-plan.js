function buildDailyPlan({ tasks, dueItems, focusMinutes, goalMinutes }) {
  const pending = (tasks || []).filter(task => !task.done);
  const plannedMinutes = pending.reduce((total, task) => total + Number(task.minutes || 0), 0);
  const focus = Math.max(0, Number(focusMinutes) || 0);
  const goal = Math.max(0, Number(goalMinutes) || 0);
  const remainingMinutes = Math.max(0, goal - focus);
  const due = (dueItems || [])[0];
  if (due) return {
    plannedMinutes, remainingMinutes,
    action: { kind: 'review', title: `先复习：${String(due.content || '一条到期复盘').split('\n')[0]}`, subject: due.type || '复盘' }
  };
  const task = pending[0];
  if (task) return {
    plannedMinutes, remainingMinutes,
    action: { kind: 'task', taskId: task.id, title: task.title || '未命名任务', subject: task.subject || '未分类', minutes: Number(task.minutes || 0) }
  };
  return {
    plannedMinutes, remainingMinutes,
    action: { kind: 'empty', title: remainingMinutes ? '补充一项今天要做的任务' : '今天的目标已完成，可以整理资料或休息', subject: '' }
  };
}

module.exports = { buildDailyPlan };
