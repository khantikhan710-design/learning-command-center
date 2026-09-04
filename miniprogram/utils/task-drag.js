function getTaskDragState({ startY, currentY, rectangles, tasks }) {
  const rawOffset = currentY - startY;
  const offsetY = Math.max(-120, Math.min(120, rawOffset));
  const targetIndex = (rectangles || []).findIndex(rect => currentY >= rect.top && currentY <= rect.bottom);
  return { offsetY, targetId: targetIndex >= 0 && tasks[targetIndex] ? tasks[targetIndex].id : '' };
}

module.exports = { getTaskDragState };
