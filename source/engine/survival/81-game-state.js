/* ==== engine/survival/81-game-state.js ==== */
/* ===================================================================
   【V18 基础模块：GameState 游戏状态 · TimeManager 时间 · SaveManager 存档】
   - GameState：所有资源增减都经过这里，自动限制上下限，并通知界面刷新
   - TimeManager：根据「今天已用掉的行动次数」推算现在几点（与实际状态一致）；
                  在酒店调查时改用酒店的夜间时钟
   - SaveManager：导出/导入存档、开新游戏、旧存档迁移
   时间参数在 config/game.json 的 time 部分。
   =================================================================== */
const GS=(function(){
 const listeners=[];
 function emit(){listeners.forEach(fn=>{try{fn()}catch(e){console.error(e)}})}
 function on(fn){listeners.push(fn)}
 /* 资源变化：正数增加、负数减少。SAN 走 sanAdjust（会处理理智归零结局）。返回给玩家看的说明 */
 function change(d,reason){
  if(!campaign||!d)return '';const P=GAME_CONFIG.player,out=[];
  if(d.hp){campaign.hp=Math.max(0,Math.min(P.maxHP,campaign.hp+d.hp));out.push('疲劳点 '+(d.hp>0?'+':'')+d.hp)}
  if(d.cash){campaign.cash=Math.max(0,campaign.cash+d.cash);out.push('¥'+(d.cash>0?'+':'')+d.cash.toLocaleString('ja-JP'))}
  if(d.stress){campaign.stress=Math.max(0,Math.min(P.maxStress,campaign.stress+d.stress));out.push('压力 '+(d.stress>0?'+':'')+d.stress)}
  V51ADD.addFavor(d,out);campaignSave();
  if(d.san){sanAdjust(d.san,reason||'');out.push('SAN '+(d.san>0?'+':'')+d.san)}
  return out.join(' · ');
 }
 function dead(){return !!campaign&&(campaign.hp<=0||campaign.san<=0||campaign.cash<=0||(campaign.stress>=GAME_CONFIG.player.maxStress&&!!campaign.v52?.stressOut))}
 return {on,emit,change,dead};
})();
/* 任何一次存档都会刷新状态栏，保证显示的数值与实际一致 */
const gsSaveBase=campaignSave;
campaignSave=function(){gsSaveBase();GS.emit()};

const TM=(function(){
 const pad=n=>String(n).padStart(2,'0');
 function fmt(min){min=((Math.round(min)%1440)+1440)%1440;return pad(Math.floor(min/60))+':'+pad(min%60)}
 /* 白天时钟：起床时间 + 已用行动 × 每次行动的小时数 */
 function dayClock(){
  if(!campaign)return null;
  const hotel=campaign.hotelCase?.v18;
  if(hotel?.clockDay===campaign.day&&hotel.flags?.['tonight:entered'])return 18*60+hotel.clock;dayDefaults();const T=GAME_CONFIG.time,used=Math.max(0,GAME_CONFIG.day.actionsPerDay-campaign.actions);
  if(campaign.day===1&&!campaign.firstDayComplete)return T.day1ArrivalHour*60+(campaign.firstDayStep||0)*T.day1StepMinutes; // 第一天：落地 → 买票 → 乘车 → 入住
  return T.dayStartHour*60+used*T.hoursPerAction*60+(campaign.v51?.timeDay===campaign.day?campaign.v51.minutes:0);
 }
 let override=null,overrideLabel=null; // 酒店等场景提供自己的时钟（分钟，从 0:00 起算，可超过 24:00）和时段名称
 function setOverride(fn,labelFn){override=fn;overrideLabel=fn?labelFn||null:null}
 function now(){if(override){const v=override();if(v!=null)return v}return dayClock()}
 function label(min){if(override&&overrideLabel){const t=overrideLabel();if(t)return t}if(min==null)return '';const h=Math.floor((min%1440)/60);return h<5?'凌晨':h<11?'早晨':h<16?'白天':h<19?'傍晚':h<22?'夜晚':'深夜'}
 /* v22.6 剧情时钟统一从这里往前走：clock={get,set}（场景自己的时钟，分钟）；onAdvance 的监听者收到 (之前, 之后)，
    例如 91z-midnight.js 用它判断第一天的午夜截止。 */
 const advSubs=[];
 function advance(min,clock){if(!clock||!(min>0))return null;const prev=clock.get(),next=prev+Math.round(min);clock.set(next);advSubs.forEach(f=>{try{f(prev,next)}catch(e){console.error(e)}});return next}
 function onAdvance(f){advSubs.push(f)}
 return {fmt,dayClock,now,label,setOverride,advance,onAdvance};
})();

const SM=(function(){
 const KEYS=k=>/^(tokyo-|japan-travel-learning)/.test(k);
 function snapshot(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(KEYS(k))o[k]=localStorage.getItem(k)}return {game:'evil-tokyo',version:GAME_CONFIG.meta.version,saved:new Date().toISOString(),data:o}}
 function exportText(){return JSON.stringify(snapshot())}
 function importText(text){
  let obj;try{obj=JSON.parse(text)}catch(e){return '存档内容不是有效的文字格式，请完整复制。'}
  if(!obj||obj.game!=='evil-tokyo'||!obj.data)return '这不是《极恶东京》的存档。';
  Object.keys(obj.data).forEach(k=>{if(KEYS(k))localStorage.setItem(k,obj.data[k])});
  return '';
 }
 function newGame(){if(window.DM)DM.clearHistory();if(window.H18&&H18.active())H18.stop();try{localStorage.removeItem(campaignKey)}catch(e){}campaign=null;setupCampaign()}

 /* ---------- 存档栏位（手动存档 / 读档） ----------
    每个栏位保存一份完整的生存进度（包括第一章调查、背包、剧情标记）。
    日语学习记录是全局的，不跟着栏位走。栏位数量：config/game.json 的 save.slots */
 const SLOT='tokyo-save-slot-';
 function slotCount(){return (GAME_CONFIG.save&&GAME_CONFIG.save.slots)||3}
 function chapterName(c){const i=c.storyIndex||0;if(c.opening&&!c.opening.done)return '序章';if(!c.firstDayComplete)return c.route20&&c.birth!=='narita'?'第一章 · 入境之夜':'第一天';const ch=STORY[i];return ch?String(ch.title).split('｜')[0]:'主线完成'}
 function summary(c){const loc=c.location||(c.firstDayComplete?'shinagawa':c.birth);return {day:c.day,days:c.days,mode:c.mode,chapter:chapterName(c),hp:c.hp,san:c.san,cash:c.cash,place:(byId[loc]&&byId[loc].jp)||'',who:(c.name?c.name+' · ':'')+c.gender+' · '+c.origin}}
 function readSlot(n){try{const r=JSON.parse(localStorage.getItem(SLOT+n)||'null');return r&&r.campaign?r:null}catch(e){return null}}
 function slots(){const out=[];for(let i=1;i<=slotCount();i++)out.push(readSlot(i));return out}
 function saveSlot(n,label){
  if(!campaign)return false;if(window.H18&&H18.active())campaignSave();
  let view='map';try{const rk=JSON.parse(localStorage.getItem('et-resume-v57')||'null');if((window.H18&&H18.active())||(rk&&rk.view==='hotel'&&rk.day===campaign.day))view='hotel'}catch(e){} // v66：记下存档时是不是在酒店里（从酒店点「设置 → 存档」也算），读档时回到那里
  const rec={saved:new Date().toISOString(),version:GAME_CONFIG.meta.version,label:label||'',view,summary:summary(campaign),campaign:JSON.parse(JSON.stringify(campaign))};
  try{localStorage.setItem(SLOT+n,JSON.stringify(rec));return true}catch(e){return false}
 }
 function loadSlot(n){
  const r=readSlot(n);if(!r)return false;
  if(window.H18&&H18.active())H18.stop();if(window.DM){DM.close();DM.clearHistory()}
  campaign=JSON.parse(JSON.stringify(r.campaign));campaignSave();
  sanAtmosphere();storyStateInit();dayDefaults();
  if(!campaign.firstDayComplete)firstDayQuest();else{tokyoHome();
   /* v66：在酒店里存的档，读档后直接回到酒店（以前总是先落在东京地图，容易以为进不了夜间调查） */
   try{const st=campaign.case1&&campaign.case1.state;if(r.view==='hotel'&&(!st||st==='active')&&window.__etResume){localStorage.setItem('et-resume-v57',JSON.stringify({view:'hotel',day:campaign.day}));window.__etResume()}}catch(e){console.error(e)}}
  return true;
 }
 function deleteSlot(n){try{localStorage.removeItem(SLOT+n)}catch(e){}}
 /* 用同一个角色设定（期限、性别、出身、入境机场）从第一天重新开始 */
 function freshCampaign(form){const mode=durations.find(x=>x.days===form.days)||durations[0];const P=GAME_CONFIG.player;
  return {name:form.name,days:mode.days,gender:form.gender,origin:form.origin,birth:form.birth,mode:mode.difficulty,day:1,hp:P.maxHP,cash:mode.cash,stress:P.startStress,san:P.maxSAN,clears:0,restDay:0,shrineDay:0,npcDay:0,potions:0}}
 function restartSame(){
  if(!campaign){setupCampaign();return}
  if(window.H18&&H18.active())H18.stop();if(window.DM){DM.close();DM.clearHistory()}
  campaign=freshCampaign(campaign);campaignSave();sanAtmosphere();
  firstDayQuest();
 }
 return {exportText,importText,newGame,slots,saveSlot,loadSlot,deleteSlot,readSlot,restartSame,slotCount,summary};
})();
