const INSIGHTS = [
  {
    type: '学习思考',
    title: '把注意力放回今天能完成的一步',
    content: '不把长期目标变成今日焦虑：先完成一轮可验证的练习，再记录卡点。',
    source: '学习方法摘记'
  },
  {
    type: 'AI × 硬件',
    title: '端侧 AI 的关键是系统权衡',
    content: '模型是否落地，不只看精度，也看延迟、内存和能耗；做嵌入式项目时要同时记录这四项。',
    source: 'arXiv:2503.06027'
  },
  {
    type: 'AI × 硬件',
    title: '大模型系统需要软硬件协同',
    content: '算法、硬件与系统软件不是独立优化项；把一个环节做快，仍要看整体吞吐和能耗。',
    source: 'arXiv:2410.07265'
  },
  {
    type: '嵌入式思考',
    title: '实时性来自可测量的约束',
    content: '设计前先写下响应时间、存储、功耗和接口边界；这比先堆功能更接近工程。',
    source: '工程学习提示'
  },
  {
    type: '学习思考',
    title: '先做可复盘的一小步',
    content: '刷题后留下“错在哪里、为什么错、下次怎么认出它”，一次练习才会变成可迁移的能力。',
    source: '复盘方法提示'
  },
  {
    type: 'AI × 硬件',
    title: '能效是边缘智能的一部分',
    content: '做端侧推理时，准确率之外还应观察能耗与延迟；指标一起看，才能判断方案是否适合设备。',
    source: 'MLArchSys / ISCA 2025'
  }
];

function calendarDay(value = new Date()) {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  }
  const date = value instanceof Date ? value : new Date(value);
  return [date.getFullYear(), date.getMonth(), date.getDate()];
}

function getDailyInsight(date) {
  const [year, month, day] = calendarDay(date);
  const dayNumber = Math.floor(Date.UTC(year, month, day) / 86400000);
  return INSIGHTS[((dayNumber % INSIGHTS.length) + INSIGHTS.length) % INSIGHTS.length];
}

function getNextInsight(cursor = 0) {
  const currentIndex = Number.isInteger(cursor) ? ((cursor % INSIGHTS.length) + INSIGHTS.length) % INSIGHTS.length : 0;
  return { insight: INSIGHTS[currentIndex], nextIndex: (currentIndex + 1) % INSIGHTS.length };
}

module.exports = { INSIGHTS, getDailyInsight, getNextInsight };
