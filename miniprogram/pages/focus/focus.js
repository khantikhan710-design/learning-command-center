const { toSeconds, fromSeconds } = require('../../utils/timer');
const { beginExit, returnFromBreak, formatElapsed } = require('../../utils/focus-guard');
const cloudStore = require('../../utils/cloud-store');
const { buildFocusAttribution } = require('../../utils/focus-attribution');
const { startSession, remainingSeconds, pauseSession, resumeSession, resetSession, shouldFinish } = require('../../utils/focus-session');
const pad = n => String(n).padStart(2, '0');
Page({
  data:{minutes:25,seconds:0,running:false,label:'设置你的专注时长',today:0,timer:null,minuteOptions:[],secondOptions:[],pickerValue:[25,0],initialSeconds:1500,strict:false,breaksLeft:3,onBreak:false,breakSeconds:0,breakTimer:null,lastUnexpectedLeave:0,breakStartAt:0,lastBreakText:'',subjectOptions:['未分类'],taskOptions:[{id:'',title:'不关联具体任务',subject:''}],subjectIndex:0,taskIndex:0,selectedSubject:'未分类',selectedTaskId:'',selectedTaskTitle:''},
  onLoad(){this.setData({minuteOptions:Array.from({length:91},(_,i)=>pad(i)),secondOptions:Array.from({length:60},(_,i)=>pad(i))})},
  onUnload(){this.stopTicker();this.stopBreak()},
  onHide(){if(this.data.strict&&this.data.running&&!this.data.onBreak){const result=beginExit(this.data.running,this.data.breaksLeft);if(result.allowed){const now=Date.now();this.setData({breaksLeft:result.remaining,onBreak:true,breakSeconds:result.seconds,breakStartAt:now,breakEndsAt:now+result.seconds*1000,lastBreakText:'',label:'临时离开中（倒计时继续）'})}else this.setData({lastUnexpectedLeave:Date.now()})}this.stopTicker()},
  onShow(){
    const attribution=buildFocusAttribution(wx.getStorageSync('studyTasks')||[],wx.getStorageSync('studyTaskCategories')||[]);
    this.setData({today:wx.getStorageSync('focusMinutes')||0,...attribution});
    const prefillTaskId=wx.getStorageSync('focusPrefillTaskId');
    const prefillIndex=attribution.taskOptions.findIndex(task=>String(task.id)===String(prefillTaskId));
    if(prefillTaskId&&prefillIndex>0){
      const task=attribution.taskOptions[prefillIndex];
      this.setData({taskIndex:prefillIndex,selectedTaskId:task.id,selectedTaskTitle:task.title,selectedSubject:task.subject,subjectIndex:Math.max(0,attribution.subjectOptions.indexOf(task.subject))});
      wx.removeStorageSync('focusPrefillTaskId');
    }
    if(this.data.lastUnexpectedLeave){this.setData({lastUnexpectedLeave:0});wx.showToast({title:'3 次离开机会已用完',icon:'none'})}if(this.data.onBreak)this.endBreak('returned');
    const session=wx.getStorageSync('focusTimerState');
    if(session&&session.running){this.setData({sessionState:session,running:true});this.refreshTimer();if(this.data.running)this.startTicker()}
  },
  pickerChange(e){if(this.data.running)return;const [m,s]=e.detail.value.map(Number);this.setData({minutes:m,seconds:s,pickerValue:[m,s],initialSeconds:toSeconds(m,s),label:'准备开始'})},
  pickSubject(e){if(this.data.running)return;const subjectIndex=Number(e.detail.value);this.setData({subjectIndex,selectedSubject:this.data.subjectOptions[subjectIndex],taskIndex:0,selectedTaskId:'',selectedTaskTitle:''})},
  pickTask(e){if(this.data.running)return;const taskIndex=Number(e.detail.value);const task=this.data.taskOptions[taskIndex];const subjectIndex=Math.max(0,this.data.subjectOptions.indexOf(task.subject||this.data.selectedSubject));this.setData({taskIndex,selectedTaskId:task.id,selectedTaskTitle:task.id?task.title:'',selectedSubject:task.subject||this.data.selectedSubject,subjectIndex})},
  toggleStrict(e){this.setData({strict:e.detail.value});if(e.detail.value)wx.showToast({title:'严格专注已开启',icon:'success'})},
  toggle(){this.data.running?this.stop():this.start()},
  start(){
    if(this.data.sessionState&&!this.data.sessionState.running){
      const session=resumeSession(this.data.sessionState);
      this.persistSession(session);this.setData({running:true,label:'专注中'});this.refreshTimer();this.startTicker();return;
    }
    const duration=toSeconds(this.data.minutes,this.data.seconds);
    if(duration===0)return wx.showToast({title:'请先设置一个时长',icon:'none'});
    const session=startSession(duration,Date.now(),{subject:this.data.selectedSubject,taskId:this.data.selectedTaskId,taskTitle:this.data.selectedTaskTitle,strict:this.data.strict});
    this.persistSession(session);this.setData({running:true,label:'专注中'});this.startTicker();
  },
  persistSession(session){wx.setStorageSync('focusTimerState',session);this.setData({sessionState:session})},
  startTicker(){this.stopTicker();this.data.timer=setInterval(()=>this.refreshTimer(),1000)},
  stopTicker(){if(this.data.timer){clearInterval(this.data.timer);this.data.timer=null}},
  refreshTimer(){
    const session=this.data.sessionState||wx.getStorageSync('focusTimerState');
    if(!session||!session.running)return;
    const remaining=remainingSeconds(session);
    this.setData(fromSeconds(remaining));
    if(shouldFinish(session)){this.finish();return}
  },
  stop(){
    const session=this.data.sessionState||wx.getStorageSync('focusTimerState');
    this.stopTicker();
    if(session&&session.running)this.persistSession(pauseSession(session));
    this.setData({running:false,label:'已暂停'});
  },
  reset(){
    const session=this.data.sessionState||wx.getStorageSync('focusTimerState');
    if(!session)return;
    wx.showModal({title:'重置本轮专注？',content:'本轮不会计入专注时长，将恢复为开始前设定的时间。',confirmText:'重置',confirmColor:'#e65050',success:result=>{
      if(!result.confirm)return;
      this.stopTicker();wx.removeStorageSync('focusTimerState');
      this.setData({...resetSession(session),sessionState:null,running:false,label:'已重置，可重新开始'});
    }});
  },
  tickBreak(){const remain=Math.max(0,Math.ceil((this.data.breakEndsAt-Date.now())/1000));this.setData({breakSeconds:remain});if(remain===0)this.endBreak()},
  stopBreak(){if(this.data.breakTimer){clearInterval(this.data.breakTimer);this.data.breakTimer=null}},
  endBreak(reason){if(!this.data.onBreak)return;this.stopBreak();const elapsed=Math.min(300,Math.floor((Date.now()-this.data.breakStartAt)/1000));this.setData({...returnFromBreak(),lastBreakText:formatElapsed(elapsed),label:this.data.running?'专注中':'已暂停'});wx.showToast({title:reason==='returned'?'已返回，临时离开结束':'临时离开结束，请回来专注',icon:'none'})},
  finish(){
    const timerState=this.data.sessionState||wx.getStorageSync('focusTimerState');
    if(!timerState||timerState.finished)return;
    this.stopTicker();
    const minutes=Math.round(timerState.initialSeconds/60);
    const endedAt=Date.now();
    const total=(wx.getStorageSync('focusMinutes')||0)+minutes;
    const session={id:endedAt,minutes,endedAt,strict:timerState.strict,subject:timerState.subject||this.data.selectedSubject,taskId:timerState.taskId||this.data.selectedTaskId,taskTitle:timerState.taskTitle||this.data.selectedTaskTitle};
    wx.setStorageSync('focusMinutes',total);wx.setStorageSync('focusSessions',[...(wx.getStorageSync('focusSessions')||[]),session]);wx.removeStorageSync('focusTimerState');cloudStore.addFocusSession(session).catch(()=>{});
    this.setData({...fromSeconds(0),sessionState:null,running:false,today:total,label:'本轮完成'});wx.showToast({title:'完成一次专注！',icon:'success'})
  }
})
