const { sortTasks, ensureTaskOrder, nextTopOrder, updateTask, removeTask, createTask, toggleTaskDone, splitTasks } = require('../../utils/task-actions');
const cloudStore = require('../../utils/cloud-store');
const { buildCategoryMenu } = require('../../utils/category-menu');
const { formatGoalMinutes, goalMinutesFromPicker, goalPickerValue } = require('../../utils/goal-time');
const { dueReviews, buildDailySummary } = require('../../utils/review-status');
const { buildReviewCoach } = require('../../utils/review-coach');
const {
  DEFAULT_TASK_CATEGORIES, UNCATEGORIZED, normalizeTaskCategories,
  normalizeTaskSubjects, createCategory, renameCategory, deleteCategory
} = require('../../utils/task-categories');

Page({
  data: {
    tasks: [], pendingTasks: [], completedTasks: [], completed: 0, total: 0, completedMinutes: 0, focusMinutes: 0, goalMinutes: 360, goalLabel: '6 小时', goalPickerOpen: false, goalHourOptions: [], goalMinuteOptions: ['00', '15', '30', '45'], goalPickerValue: [6, 0], progress: 0, streak: 0, dueItems: [], dueReviewCount: 0, reviewCoach: {},
    newTask: '', date: '', activeTaskId: '', touchStartX: 0, categories: DEFAULT_TASK_CATEGORIES,
    durationOptions: [15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 120, 150, 180, 240]
  },

  onLoad() {
    this.setData({ goalHourOptions: Array.from({ length: 25 }, (_, index) => String(index).padStart(2, '0')) });
  },

  onShow() {
    this.setData({ date: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }) });
    this.load();
    cloudStore.loadTaskState().then(snapshot => {
      if (!snapshot) return;
      const state = Array.isArray(snapshot) ? { tasks: snapshot, categories: wx.getStorageSync('studyTaskCategories') } : snapshot;
      if (!Array.isArray(state.tasks)) return;
      wx.setStorageSync('studyTasks', normalizeTaskSubjects(state.tasks));
      wx.setStorageSync('studyTaskCategories', normalizeTaskCategories(state.categories));
      this.load();
    }).catch(() => {});
  },

  loadLocalState() {
    const tasks = normalizeTaskSubjects(wx.getStorageSync('studyTasks') || []);
    const categories = normalizeTaskCategories(wx.getStorageSync('studyTaskCategories'));
    wx.setStorageSync('studyTasks', tasks);
    wx.setStorageSync('studyTaskCategories', categories);
    return { tasks, categories };
  },

  load() {
    const { tasks: storedTasks, categories } = this.loadLocalState();
    const tasks = sortTasks(ensureTaskOrder(storedTasks));
    const { pending, completed } = splitTasks(tasks);
    wx.setStorageSync('studyTasks', tasks);
    const completedMinutes = tasks.filter(x => x.done).reduce((n, x) => n + (x.minutes || 0), 0);
    const focusMinutes = wx.getStorageSync('focusMinutes') || 0;
    const reviewItems = wx.getStorageSync('reviewItems') || [];
    const dueItems = dueReviews(reviewItems);
    const reviewCoach = buildReviewCoach({ activityDates: wx.getStorageSync('reviewActiveDates') || [], dueCount: dueItems.length, reviewCount: reviewItems.length });
    const storedGoal = wx.getStorageSync('dailyGoalMinutes');
    const goalMinutes = Number.isFinite(storedGoal) && storedGoal > 0 ? storedGoal : 360;
    const dates = wx.getStorageSync('studyActiveDates') || [];
    let streak = 0;
    const day = new Date();
    while (dates.includes(day.toLocaleDateString('zh-CN'))) {
      streak++;
      day.setDate(day.getDate() - 1);
    }
    this.setData({
      tasks, pendingTasks: pending, completedTasks: completed, categories, total: tasks.length, completed: completed.length,
      completedMinutes, focusMinutes, goalMinutes, goalLabel: formatGoalMinutes(goalMinutes), goalPickerValue: goalPickerValue(goalMinutes), streak,
      progress: Math.min(100, Math.round((focusMinutes / goalMinutes) * 100)), dueItems, dueReviewCount: dueItems.length, reviewCoach
    });
  },

  persist(tasks, categories = this.data.categories) {
    const sorted = sortTasks(ensureTaskOrder(normalizeTaskSubjects(tasks)));
    const cleanCategories = normalizeTaskCategories(categories);
    wx.setStorageSync('studyTasks', sorted);
    wx.setStorageSync('studyTaskCategories', cleanCategories);
    cloudStore.saveTaskState({ tasks: sorted, categories: cleanCategories }).catch(() => {});
    this.setData({ activeTaskId: '' });
    this.load();
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(x => x.id === id);
    if (!task) return;
    if (!task.done) {
      const today = new Date().toLocaleDateString('zh-CN');
      const dates = wx.getStorageSync('studyActiveDates') || [];
      if (!dates.includes(today)) wx.setStorageSync('studyActiveDates', [...dates, today]);
    }
    this.persist(toggleTaskDone(this.data.tasks, id));
  },

  changeDuration(e) {
    const id = e.currentTarget.dataset.id;
    this.persist(updateTask(this.data.tasks, id, { minutes: this.data.durationOptions[Number(e.detail.value)] }));
  },

  onTaskTouchStart(e) {
    this.setData({ touchStartX: e.touches[0].clientX });
  },

  onTaskTouchEnd(e) {
    const delta = e.changedTouches[0].clientX - this.data.touchStartX;
    const id = e.currentTarget.dataset.id;
    if (delta < -50) this.setData({ activeTaskId: id });
    if (delta > 50) this.setData({ activeTaskId: '' });
  },

  togglePin(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(x => x.id === id);
    if (task) this.persist(updateTask(this.data.tasks, id, { pinned: !task.pinned }));
  },

  chooseCategory(e) {
    const id = e.currentTarget.dataset.id;
    this.showCategoryMenu(id);
  },

  showCategoryMenu(id, offset = 0) {
    const entries = buildCategoryMenu(this.data.categories, offset, [
      { type: 'create', label: '＋ 新建分类' },
      { type: 'manage', label: '管理分类' }
    ]);
    wx.showActionSheet({
      itemList: entries.map(entry => entry.label),
      success: ({ tapIndex }) => {
        const entry = entries[tapIndex];
        if (entry.type === 'category') return this.persist(updateTask(this.data.tasks, id, { subject: entry.name }));
        if (entry.type === 'more') return this.showCategoryMenu(id, entry.offset);
        if (entry.type === 'create') return this.promptCreateCategory(id);
        if (entry.type === 'manage') return this.manageCategories();
        this.showCategoryMenu(id);
      }
    });
  },

  showCategoryError(error) {
    wx.showToast({ title: error === 'empty' ? '分类名称不能为空' : '已有同名分类', icon: 'none' });
  },

  promptCreateCategory(taskId) {
    wx.showModal({
      title: '新建分类', editable: true, placeholderText: '例如：通信原理',
      success: result => {
        if (!result.confirm) return;
        const outcome = createCategory(this.data.categories, result.content);
        if (outcome.error) return this.showCategoryError(outcome.error);
        const tasks = taskId ? updateTask(this.data.tasks, taskId, { subject: outcome.categories[outcome.categories.length - 1] }) : this.data.tasks;
        this.persist(tasks, outcome.categories);
      }
    });
  },

  manageCategories(offset = 0) {
    if (!this.data.categories.length) {
      wx.showModal({ title: '管理分类', content: '还没有分类，可先新建分类。', showCancel: false });
      return;
    }
    const entries = buildCategoryMenu(this.data.categories, offset);
    wx.showActionSheet({
      itemList: entries.map(entry => entry.label),
      success: ({ tapIndex }) => {
        const entry = entries[tapIndex];
        if (entry.type === 'category') return this.manageCategory(entry.name);
        if (entry.type === 'more') return this.manageCategories(entry.offset);
        this.manageCategories();
      }
    });
  },

  manageCategory(name) {
    wx.showActionSheet({
      itemList: ['重命名', '删除'],
      success: ({ tapIndex }) => {
        if (tapIndex === 0) this.promptRenameCategory(name);
        if (tapIndex === 1) this.confirmDeleteCategory(name);
      }
    });
  },

  promptRenameCategory(name) {
    wx.showModal({
      title: '重命名分类', content: `当前名称：${name}`, editable: true, placeholderText: '输入新的分类名称',
      success: result => {
        if (!result.confirm) return;
        const outcome = renameCategory(this.data.categories, this.data.tasks, name, result.content);
        if (outcome.error) return this.showCategoryError(outcome.error);
        this.persist(outcome.tasks, outcome.categories);
      }
    });
  },

  confirmDeleteCategory(name) {
    wx.showModal({
      title: `删除“${name}”？`, content: '分类下的任务将变为未分类，任务内容不会删除。', confirmColor: '#e65050',
      success: result => {
        if (!result.confirm) return;
        const outcome = deleteCategory(this.data.categories, this.data.tasks, name);
        this.persist(outcome.tasks, outcome.categories);
      }
    });
  },

  confirmDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除任务？', content: '删除后无法恢复。', confirmColor: '#e65050',
      success: result => { if (result.confirm) this.persist(removeTask(this.data.tasks, id)); }
    });
  },

  setNewTask(e) {
    this.setData({ newTask: e.detail.value });
  },

  addTask() {
    const title = this.data.newTask.trim();
    if (!title) return wx.showToast({ title: '先写下任务内容', icon: 'none' });
    this.persist(createTask(this.data.tasks, {
      id: String(Date.now()), title, subject: UNCATEGORIZED, minutes: null, done: false, pinned: false,
      order: nextTopOrder(this.data.tasks)
    }));
    this.setData({ newTask: '' });
  },

  editGoal() {
    this.setData({ goalPickerOpen: !this.data.goalPickerOpen });
  },

  goalPickerChange(e) {
    const [hourIndex, minuteIndex] = e.detail.value;
    const minutes = goalMinutesFromPicker(this.data.goalHourOptions[hourIndex], this.data.goalMinuteOptions[minuteIndex]);
    if (!minutes) return wx.showToast({ title: '每日目标至少 30 分钟', icon: 'none' });
    wx.setStorageSync('dailyGoalMinutes', minutes);
    this.setData({ goalMinutes: minutes, goalLabel: formatGoalMinutes(minutes), goalPickerValue: [hourIndex, minuteIndex] });
    this.load();
  },

  goReview() {
    wx.switchTab({ url: '/pages/review/review' });
  },

  copyDailySummary() {
    wx.setClipboardData({
      data: buildDailySummary({
        date: new Date(), completed: this.data.completed, total: this.data.total,
        focusMinutes: this.data.focusMinutes, goalMinutes: this.data.goalMinutes,
        dueItems: this.data.dueItems
      }),
      success: () => wx.showToast({ title: '今日总结已复制', icon: 'success' })
    });
  },

  goFocus() {
    wx.switchTab({ url: '/pages/focus/focus' });
  }
});
