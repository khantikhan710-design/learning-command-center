const templates = {
  '错题': [
    '如果题目的关键条件改变，原来的解法在哪一步会失效？',
    '不用原来的方法，还能用哪一种方法验证这个结论？',
    '把这道题缩成最小例子后，最容易犯错的点是什么？'
  ],
  '概念': [
    '这个概念成立必须满足哪些前提？',
    '它和一个相近概念最容易混淆的边界在哪里？',
    '请用自己的话和一个实际例子重新解释它。'
  ],
  '硬件设计': [
    '如果电源、温度或负载变化，设计中哪一部分最先需要验证？',
    '怎样用示波器、万用表或仿真给这个判断找证据？',
    '把核心模块替换成另一种器件后，参数和风险如何变化？'
  ],
  'AI想法': [
    '这个想法的输入、输出和可验证指标分别是什么？',
    '最小可行实验要删掉哪些非必要部分？',
    '如果结果不符合预期，先检查哪一个假设？'
  ]
};

function buildPrompts(type, content) {
  const topic = String(content || '').trim() || '这条复盘内容';
  const list = templates[type] || templates['概念'];
  return list.map((template, index) => `「${topic}」· ${index + 1}. ${template}`);
}

module.exports = { buildPrompts };
