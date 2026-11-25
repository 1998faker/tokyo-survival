/* ==== engine/addons/98-chapter1-night-reminders.js ==== */
/* Chapter 01: guide, never force. Keep all investigation gates, time limits, and saves unchanged. */
(function(){
 function shouldRemind(){
  if(!campaign||campaign.day===1||!campaign.firstDayComplete||campaign.storyIndex!==0)return false;
  if(campaign.hotelCase&&campaign.hotelCase.ending)return false;
  const c=campaign.case1;
  if(c&&['closed','submitted','due','report','dead'].includes(c.state))return false;
  if(window.H18&&H18.active())return false;
  const v=campaign.hotelCase&&campaign.hotelCase.v18;
  return !(v&&v.clockDay===campaign.day&&v.flags&&v.flags['tonight:entered']);
 }
 const mapBeforeReminder=tokyoHome;
 tokyoHome=function(){
  mapBeforeReminder.apply(this,arguments);
  if(!shouldRemind())return;
  const shell=app&&app.querySelector('.rpg-shell');
  if(!shell||shell.querySelector('#ch1-night-reminder'))return;
  const panel=document.createElement('section');
  panel.className='survival-box';
  panel.id='ch1-night-reminder';
  panel.style.border='1px solid #c49b55';
  panel.innerHTML='<div class="rpg-kicker">CASE NO. 001 · 今晚的主线</div><h2>🌙 别忘了回酒店调查</h2><p>白天可以探索东京，傍晚记得回品川港屋酒店继续调查207号室。每晚都有有限的调查时间，直接跳到下一天可能漏掉线索。</p><button type="button" class="survival-btn" id="ch1-night-go">🏨 回酒店调查 →</button><p class="survival-tip">也可点底部「任务」→「追踪当前主线」。回酒店将结束今天剩余的白天行动。</p>';
  const daily=shell.querySelector('.daily-panel');
  if(daily)daily.insertAdjacentElement('afterend',panel);
  else shell.insertAdjacentElement('afterbegin',panel);
  const btn=panel.querySelector('#ch1-night-go');
  if(btn)btn.onclick=()=>storyQuest();
 };
 const originalClose=nightlyClose;
 nightlyClose=function(){
  if(!shouldRemind())return originalClose.apply(this,arguments);
  const args=arguments,that=this;
  UI.modal({
   title:'🌙 今晚还没有回酒店调查',
   text:'207号室的调查每晚都有时间窗口。现在直接结算，可能错过今晚的线索、证言和调查进度。\n\n建议先回港屋酒店调查，再结束这一天。',
   buttons:[
    {label:'🏨 先回酒店调查',primary:true,fn:()=>storyQuest()},
    {label:'仍然跳过今晚',fn:()=>originalClose.apply(that,args)},
    {label:'取消，继续白天行动'}
   ]
  });
 };
})();
