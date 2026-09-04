const { toSeconds, fromSeconds } = require('../../utils/timer');
const { beginExit, returnFromBreak, formatElapsed } = require('../../utils/focus-guard');
const cloudStore = require('../../utils/cloud-store');
const pad = n => String(n).padStart(2, '0');
Page({
  data:{minutes:25,seconds:0,running:false,label:'设置你的专注时长',today:0,timer:null,minuteOptions:[],secondOptions:[],pickerValue:[25,0],initialSeconds:1500,strict:false,breaksLeft:3,onBreak:false,breakSeconds:0,breakTimer:null,lastUnexpectedLeave:0,breakStartAt:0,lastBreakText:'',subjectOptions:['未分类'],taskOptions:[{id:'',title:'不关联具体任务',subject:''}],subjectIndex:0,taskIndex:0,selectedSubject:'未分类',selectedTaskId:'',selectedTaskTitle:''},
  onLoad(){this.setData({minuteOptions:Array.from({length:91},(_,i)=>pad(i)),secondOptions:Array.from({length:60},(_,i)=>pad(i))})},
  onUnload(){this.stop();this.stopBreak()},
  onHide(){if(this.data.strict&&this.data.running&&!this.data.onBreak){const result=beginExit(this.data.running,this.data.breaksLeft);if(result.paused)this.stop();if(result.allowed){const now=Date.now();this.setData({breaksLeft:result.remaining,onBreak:true,breakSeconds:result.seconds,breakStartAt:now,breakEndsAt:now+result.seconds*1000,lastBreakText:'',label:'临时离开中（最多 5 分钟）'})}else this.setData({lastUnexpectedLeave:Date.now()})}},
  onShow(){
    const tasks=(wx.getStorageSync('studyTasks')||[]).filter(task=>!task.done);
    const savedCategories=wx.getStorageSync('taskCategories')||[];
    const subjectOptions=['未分类',...savedCategories.filter(name=>name&&name!=='未分类')];
    const taskOptions=[{id:'',title:'不关联具体任务',subject:''},...tasks.map(task=>({id:task.id,title:task.title,subject:task.subject||'未分类'}))];
    this.setData({today:wx.getStorageSync('focusMinutes')||0,subjectOptions,taskOptions});
    if(this.data.lastUnexpectedLeave){this.setData({lastUnexpectedLeave:0});wx.showToast({title:'3 次离开机会已用完',icon:'none'})}if(this.data.onBreak)this.endBreak('returned')
  },
  pickerChange(e){if(this.data.running)return;const [m,s]=e.detail.value.map(Number);this.setData({minutes:m,seconds:s,pickerValue:[m,s],initialSeconds:toSeconds(m,s),label:'准备开始'})},
  pickSubject(e){if(this.data.running)return;const subjectIndex=Number(e.detail.value);this.setData({subjectIndex,selectedSubject:this.data.subjectOptions[subjectIndex],taskIndex:0,selectedTaskId:'',selectedTaskTitle:''})},
  pickTask(e){if(this.data.running)return;const taskIndex=Number(e.detail.value);const task=this.data.taskOptions[taskIndex];const subjectIndex=Math.max(0,this.data.subjectOptions.indexOf(task.subject||this.data.selectedSubject));this.setData({taskIndex,selectedTaskId:task.id,selectedTaskTitle:task.id?task.title:'',selectedSubject:task.subject||this.data.selectedSubject,subjectIndex})},
  toggleStrict(e){this.setData({strict:e.detail.value});if(e.detail.value)wx.showToast({title:'严格专注已开启',icon:'success'})},
  toggle(){this.data.running?this.stop():this.start()},
  start(){if(toSeconds(this.data.minutes,this.data.seconds)===0)return wx.showToast({title:'请先设置一个时长',icon:'none'});this.setData({running:true,label:'专注中'});this.data.timer=setInterval(()=>{const next=fromSeconds(toSeconds(this.data.minutes,this.data.seconds)-1);if(next.minutes===0&&next.seconds===0){this.setData(next);this.finish();return}this.setData(next)},1000)},
  stop(){if(this.data.timer){clearInterval(this.data.timer);this.data.timer=null}this.setData({running:false,label:'已暂停'})},
  tickBreak(){const remain=Math.max(0,Math.ceil((this.data.breakEndsAt-Date.now())/1000));this.setData({breakSeconds:remain});if(remain===0)this.endBreak()},
  stopBreak(){if(this.data.breakTimer){clearInterval(this.data.breakTimer);this.data.breakTimer=null}},
  endBreak(reason){if(!this.data.onBreak)return;this.stopBreak();const elapsed=Math.min(300,Math.floor((Date.now()-this.data.breakStartAt)/1000));this.setData({...returnFromBreak(),lastBreakText:formatElapsed(elapsed),label:this.data.running?'专注中':'已暂停'});wx.showToast({title:reason==='returned'?'已返回，临时离开结束':'临时离开结束，请回来专注',icon:'none'})},
  finish(){this.stop();const minutes=Math.round(this.data.initialSeconds/60);const endedAt=Date.now();const total=(wx.getStorageSync('focusMinutes')||0)+minutes;const session={id:endedAt,minutes,endedAt,strict:this.data.strict,subject:this.data.selectedSubject,taskId:this.data.selectedTaskId,taskTitle:this.data.selectedTaskTitle};wx.setStorageSync('focusMinutes',total);wx.setStorageSync('focusSessions',[...(wx.getStorageSync('focusSessions')||[]),session]);cloudStore.addFocusSession(session).catch(()=>{});this.setData({today:total,label:'本轮完成'});wx.showToast({title:'完成一次专注！',icon:'success'})}
})
