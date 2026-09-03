const { sortTasks, updateTask, removeTask } = require('../../utils/task-actions');
const cloudStore = require('../../utils/cloud-store');

Page({
  data:{tasks:[],completed:0,total:0,completedMinutes:0,focusMinutes:0,progress:0,streak:0,newTask:'',date:'',activeTaskId:'',touchStartX:0,categories:['考研数学','专业基础','硬件电路','英语','AI 学习','自定义'],durationOptions:[15,20,25,30,40,45,50,60,75,90,120,150,180,240]},
  onShow(){this.setData({date:new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'})});this.load();cloudStore.loadSnapshot('tasks').then(items=>{if(items){wx.setStorageSync('studyTasks',items);this.load()}}).catch(()=>{})},
  load(){const tasks=sortTasks(wx.getStorageSync('studyTasks')||[]);const completedMinutes=tasks.filter(x=>x.done).reduce((n,x)=>n+(x.minutes||0),0);const focusMinutes=wx.getStorageSync('focusMinutes')||0;const dates=wx.getStorageSync('studyActiveDates')||[];let streak=0;let d=new Date();while(dates.includes(d.toLocaleDateString('zh-CN'))){streak++;d.setDate(d.getDate()-1)}this.setData({tasks,total:tasks.length,completed:tasks.filter(x=>x.done).length,completedMinutes,focusMinutes,streak,progress:Math.min(100,Math.round((focusMinutes/360)*100))})},
  persist(tasks){const sorted=sortTasks(tasks);wx.setStorageSync('studyTasks',sorted);cloudStore.saveSnapshot('tasks',sorted).catch(()=>{});this.setData({activeTaskId:''});this.load()},
  toggle(e){const id=e.currentTarget.dataset.id;const task=this.data.tasks.find(x=>x.id===id);if(!task.done){const today=new Date().toLocaleDateString('zh-CN');const dates=wx.getStorageSync('studyActiveDates')||[];if(!dates.includes(today))wx.setStorageSync('studyActiveDates',[...dates,today])}this.persist(updateTask(this.data.tasks,id,{done:!task.done}))},
  changeDuration(e){const id=e.currentTarget.dataset.id;this.persist(updateTask(this.data.tasks,id,{minutes:this.data.durationOptions[Number(e.detail.value)]}))},
  onTaskTouchStart(e){this.setData({touchStartX:e.touches[0].clientX})},
  onTaskTouchEnd(e){const delta=e.changedTouches[0].clientX-this.data.touchStartX;const id=e.currentTarget.dataset.id;if(delta<-50)this.setData({activeTaskId:id});if(delta>50)this.setData({activeTaskId:''})},
  togglePin(e){const id=e.currentTarget.dataset.id;const task=this.data.tasks.find(x=>x.id===id);this.persist(updateTask(this.data.tasks,id,{pinned:!task.pinned}))},
  chooseCategory(e){const id=e.currentTarget.dataset.id;wx.showActionSheet({itemList:this.data.categories,success:r=>this.persist(updateTask(this.data.tasks,id,{subject:this.data.categories[r.tapIndex]}))})},
  confirmDelete(e){const id=e.currentTarget.dataset.id;wx.showModal({title:'删除任务？',content:'删除后无法恢复。',confirmColor:'#e65050',success:r=>{if(r.confirm)this.persist(removeTask(this.data.tasks,id))}})},
  setNewTask(e){this.setData({newTask:e.detail.value})},
  addTask(){const title=this.data.newTask.trim();if(!title)return wx.showToast({title:'先写下任务内容',icon:'none'});this.persist([...this.data.tasks,{id:String(Date.now()),title,subject:'自定义',minutes:null,done:false,pinned:false}]);this.setData({newTask:''})},
  goFocus(){wx.switchTab({url:'/pages/focus/focus'})}
})
