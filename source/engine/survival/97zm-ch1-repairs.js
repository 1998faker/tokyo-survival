/* ==== engine/survival/97zm-ch1-repairs.js ==== */
const CH1FIX=(()=>{
 const CFG=GAME_CONFIG.ch1Repairs;
 const resources=['cash','hp','san','stress'];
 let installed=false,changing=0,ledgerOwner=null,previous=null,modalOpen=false;
 let modalQueue=[],painting=false;
 const values=()=>Object.fromEntries(resources.map(k=>[k,Number(campaign?.[k])||0]));
 function state(){
  if(!campaign)return null;
  campaign.ch1Repairs??={};
  const s=campaign.ch1Repairs;s.days??={};s.version??=1;
  return s;
 }
 function recordDay(row){
  const raw=row?.at?.day??row?.day??row?.at?.date;
  if(Number.isFinite(raw))return raw;
  const match=/DAY\s*(\d+)/i.exec(String(row?.at||''));
  return match?Number(match[1]):null;
 }
 function dayLedger(day=campaign.day){
  const s=state();if(!s)return null;
  s.days[day]??={opening:values(),entries:[]};
  return s.days[day];
 }
 function entry(delta,reason,day=campaign.day){
  if(!Object.values(delta).some(Boolean))return;
  dayLedger(day).entries.push({time:TM.fmt(TM.now()??0),reason:reason||'其他行动',delta});
 }
 function delta(a,b){return Object.fromEntries(resources.map(k=>[k,(b[k]||0)-(a[k]||0)]))}
 function noteDirect(){
  if(!campaign){previous=null;ledgerOwner=null;return}
  const current=values();
  if(ledgerOwner!==campaign){ledgerOwner=campaign;previous=current;dayLedger();return}
  if(previous&&!changing)entry(delta(previous,current),'其他行动或旧模块结算');
  previous=current;
 }
 function recoverUI(keepDialogueHistory=false){
  try{H18.stop();DM.close();if(!keepDialogueHistory)DM.clearHistory();ENDTACHIE.detach()}catch(e){}
  modalQueue=[];modalOpen=false;
  for(const selector of ['.et-modal-back','.sc-overlay','#san-ending','#v51-collapse-room','.dx-stage','.mg-dark']){
   document.querySelectorAll(selector).forEach(el=>el.remove());
  }
  document.body.classList.remove('mid-dead','san-critical','v51-white');
  deathShown=false;
 }
 function pollution(){
  const ids=TAINT.ids(),p=GAME_CONFIG.peril.purify;
  const stations=(campaign.eyes?.day===campaign.day?campaign.eyes.stations:[]).filter(V51.swallowed);
  UI.modal({title:'污染状态',
   html:V52.eroHtml()+
    (ids.length?'<p>有 '+ids.length+' 条线索被污染，会影响合成：</p><ul>'+ids.map(id=>'<li>'+esc(TAINT.name(id))+'</li>').join('')+'</ul>'+
     '<p><b>去哪里净化</b></p><ul><li>浅草寺护摩 ¥'+p.temple.price+'（最多 '+p.temple.n+' 条）</li><li>街头占卜师 ¥'+p.teller.price+'（最多 '+p.teller.n+' 条）</li><li>街头驱魔人 ¥'+p.exorcist.price+'（最多 '+p.exorcist.n+' 条）</li><li>明治神宫手水舍 免费（每天 1 条）</li></ul>'
     :'<p>目前没有被污染的线索。</p><p class="rpg-tiny">在外面调查时，调查手帐有可能会渗进墨迹一样的黑色——这就是污染。理智（SAN）越低，越容易被污染。被污染的那一页字迹认不清，线索不能拿去合成，且有可能会爬到相邻的线索上。听说明治神宫的御守能降低被污染的几率。</p>')+
    (stations.length?'<p>今天被吞没、无法使用的车站：'+stations.map(id=>esc(byId[id]?.jp||id)).join('、')+'</p>':''),
   buttons:[{label:'关闭',primary:true,fn:()=>document.getElementById('v51-pollution')?.focus({preventScroll:true})}]});
 }
 function rest(){
  if(!campaign||GS.dead())return;
  const used=campaign.restDay===campaign.day;
  UI.modal({title:'206 号室 · 你的房间',text:'可以回到自己的房间休息。每日休息沿用原有的行动消耗与恢复数值，每天一次；睡到天亮会结束本晚调查。',
   buttons:[
    {label:used?'今天已经休息过':'回房间休息（沿用每日恢复）',fn:()=>{
     if(used){rest();return}
     if(H18.active())H18.teleport('room206',7,8);
     recoveryAction('sleep');
     campaignSave();rest();
    }},
    {label:'睡到天亮',fn:()=>{if(H18.active())H18.play('r206-bed');else{V51.sleep();nightlyClose()}}},
    {label:'继续调查',primary:true}
   ]});
 }
 function patience(order){
  const host=app.querySelector('.kb-layout,.kb-work,.kb-panel,.kb-scene')||app.querySelector('[class*="kb-"]');
  if(!host||!KONBINI.active())return;
  let meter=app.querySelector('#ch1-patience');
  if(!meter){meter=document.createElement('div');meter.id='ch1-patience';meter.innerHTML='<span></span><progress max="100"></progress>';host.prepend(meter)}
  const percent=order?Math.max(0,Math.min(100,100*order.patience/order.patienceMax)):100;
  meter.hidden=!order;
  meter.firstElementChild.textContent='顾客耐心 '+Math.ceil(percent)+'%'+(percent<25?' · 即将离开':percent<50?' · 开始着急':'');
  meter.lastElementChild.value=percent;
  meter.lastElementChild.setAttribute('aria-label','顾客剩余耐心');
 }
 function nightlyDetails(day,after){
  const ledger=dayLedger(day),ending=ledger.close||values();
  const names={cash:'现金',hp:'疲劳点',san:'SAN',stress:'压力'};
  const sign=n=>(n>0?'+':'')+(Number.isInteger(n)?n:Number(n.toFixed(2)));
  const net=delta(ledger.opening,ending);
  UI.modal({title:'DAY '+day+' · 夜间结算明细',
   html:'<p>'+resources.map(k=>names[k]+' '+sign(net[k])+'（'+ledger.opening[k]+' → '+ending[k]+'）').join(' · ')+'</p>'+
    '<div class="ch1-ledger"><table><thead><tr><th>来源</th><th>变化</th></tr></thead><tbody>'+
    (()=>{const G=[],M={};for(const row of ledger.entries){let g=M[row.reason];if(!g){g={reason:row.reason,delta:{}};M[row.reason]=g;G.push(g)}for(const k of resources)if(row.delta[k])g.delta[k]=(g.delta[k]||0)+row.delta[k]}return G.map(g=>'<tr><td>'+esc(g.reason)+'</td><td>'+resources.filter(k=>g.delta[k]).map(k=>names[k]+' '+sign(g.delta[k])).join(' · ')+'</td></tr>').join('')})()+
    '</tbody></table></div><p class="survival-tip">生活费包含餐饮等支出，案件期间住宿仍由委托方承担。</p>',
   buttons:[{label:'继续',primary:true,fn:after}]});
 }
 function beginNight(){dayLedger()}
 function closeNight(day){
  const row=dayLedger(day);row.close=values();state().pendingNight=day;
 }
 function showNight(){
  const s=state(),day=s?.pendingNight;
  if(day==null)return;
  delete s.pendingNight;
  campaignSave();
  if(GS.dead())return;
  nightlyDetails(day);
 }
 function floodSignals(){
  if(!campaign?.flood?.warned||!['active','due','report'].includes(campaign.case1?.state))return;
  if(!app.querySelector('.m46,#map-host,.rp-notice')&&UI.current()!=='quest')return;
  const host=app.querySelector('.rpg-shell');if(!host||app.querySelector('#ch1-flood-signals'))return;
  const mail=MAIL.list().find(m=>m.id==='flood-warn');if(!mail)return;
  const card=document.createElement('aside');card.id='ch1-flood-signals';card.className='ch1-flood-signals';
  card.innerHTML='<div><b>东京湾 · 沿岸观测</b><p>报纸角落的小新闻和现场水痕仍在更新。</p></div><nav aria-label="沿岸观测资料">'+
   '<button type="button" data-signal="mail">调查局紧急邮件'+(MAIL.isRead(mail)?' · 重看':' · 未读')+'</button>'+
   '<button type="button" data-signal="news">报纸上的小新闻</button>'+
   '<button type="button" data-signal="sites">现场观察位置</button></nav>';
  card.querySelector('[data-signal="mail"]').onclick=()=>MAIL.page('flood-warn');
  card.querySelector('[data-signal="news"]').onclick=()=>window.KSHOP?KSHOP.floodClip():FLOOD.news();
  card.querySelector('[data-signal="sites"]').onclick=()=>UI.modal({title:'沿岸观测 · 可以留意的地方',
   text:'港屋酒店：大厅玻璃门外的水痕。\n品川街区：路边排水口的水流。\n浅草寺本堂：廊下水钵的倒影。\n\n这些地方可以再次观察；留意今天与上次有什么变化。',buttons:[{label:'记下位置，继续调查',primary:true}]});
  host.prepend(card);
 }
 function attach(){
  if(painting||!campaign)return;painting=true;
  try{
   floodSignals();
   const firstNight=!campaign.firstDayComplete||campaign.day<2;
   const map= document.querySelector('#et-nav [data-nav="map"]');
   if(map){map.disabled=firstNight;map.title=firstNight?'DAY 2 早晨解锁东京地图':'';map.setAttribute('aria-label',firstNight?'东京地图 · DAY 2 解锁':'东京地图')}
   const stage=app.querySelector('#h18-stage');
   if(stage&&!app.querySelector('#ch1-room-rest')){
    const bar=app.querySelector('.h18-topbtns');
    if(bar){const button=document.createElement('button');button.type='button';button.id='ch1-room-rest';button.className='rpg-inline-back';button.textContent='206 号室 · 休息';button.onclick=rest;bar.appendChild(button)}
   }
   const labels=app.querySelectorAll('.v51-status span');
   for(const label of labels){
    if(label.textContent.includes('感知异常'))label.title='低 SAN 时，文字和感知可能异常。可在污染状态中查看影响及净化地点。';
    if(label.textContent.includes('车站吞没'))label.title='部分车站今日不可用。打开污染状态查看名单。';
   }
   const report=app.querySelector('#rp-return');
   if(report&&report.textContent!=='暂存报告，返回地图')report.textContent='暂存报告，返回地图';
   if(stage&&H18.active()){
    const map=H18.state().v.map,labels=map==='alley'?[[3,1,'港屋后门'],[11,1,'警卫室']]:map==='corridor'?[[2,7,'206 · 休息'],[5,7,'207 · 调查']]:[];
    const signature=map+':'+labels.length;
    if(stage.dataset.repairLabels!==signature){
     stage.dataset.repairLabels=signature;
     stage.querySelectorAll('.ch1-door-label').forEach(el=>el.remove());
     for(const [x,y,text] of labels){
      const label=document.createElement('span');label.className='ch1-door-label';label.textContent=text;
      label.style.left=((x+.5)/16*100)+'%';label.style.top=((y+.93)/11*100)+'%';stage.append(label);
     }
    }
   }
   const old=app.querySelector('#ch1-rest-ledger');
   const closed=Object.entries(state().days).filter(([day,row])=>row.close).sort((a,b)=>Number(b[0])-Number(a[0]))[0];
   if(closed&&UI.current()==='saves'&&!old){
    const button=document.createElement('button');button.type='button';button.id='ch1-rest-ledger';button.className='survival-btn alt';button.textContent='查看最近夜间结算明细';
    button.onclick=()=>nightlyDetails(Number(closed[0]));app.querySelector('.rpg-shell')?.appendChild(button);
   }
  }finally{painting=false}
 }
 function install(){
  if(installed)return;installed=true;
  const extendMail=MAIL.extend;
  MAIL.extend=function(){const result=extendMail.apply(this,arguments);queueMicrotask(attach);return result};
  const save=campaignSave;
  campaignSave=function(){noteDirect();return save.apply(this,arguments)};
  const change=GS.change;
  GS.change=function(d,reason){
   const owner=campaign,before=values();changing++;
   let result;
   try{result=change.apply(this,arguments)}
   finally{
    changing--;
    if(campaign===owner){const current=values();entry(delta(before,current),reason||'行动或答题');previous=current;ledgerOwner=campaign}
   }
   return result;
  };
  const rewind=DM.rewind;
  DM.rewind=function(){
   const prev={rewinds:campaign?.rewinds||0,failedReports:campaign?.failedReports};
   const result=rewind.apply(this,arguments);
   if(result&&campaign?.firstDayComplete)REWIND.pay(prev);
   return result;
  };
  const day=H18.startDay;
  H18.startDay=function(place){
   const clock=TM.dayClock();
   if(clock!=null&&clock>=18*60)return H18.start();
   return day.apply(this,arguments);
  };
  const objectives=H18.objectives;
  H18.objectives=function(){
   const entered=campaign?.hotelCase?.v18?.flags?.['repair:entered207']||
    campaign?.hotelCase?.v18?.visited?.some(id=>id==='room207'||id==='room207c');
   return objectives().map(o=>/进入\s*207/.test(o.text)?{...o,done:!!entered||o.done}:o);
  };
  const details=V51.showDetails;
  if(details)V51.showDetails=pollution;
  const originalModal=UI.modal;
  UI.modal=function(opts){
   const recovery=/GAME OVER|理智崩溃|你没能抵达酒店/.test(opts.title||'');
   if(recovery&&campaign){
    const cp=REWIND.cps().find(x=>x.id===campaign.rwId);
    if(cp&&!opts.buttons?.some(b=>/早上/.test(b.label))){
     opts={...opts,buttons:[{label:'回到 DAY '+cp.day+' 早上（SAN −'+REWIND.cost()+'，最低保留 1）',primary:true,fn:()=>REWIND.restoreDay(cp.day)},...(opts.buttons||[])]};
    }
   }
   if(recovery){document.querySelectorAll('#et-modal .et-modal-back').forEach(el=>el.remove());modalOpen=false;modalQueue=[]}
   const request={opts,owner:campaign};
   const dialog=document.querySelector('#et-modal .et-modal-back');
   if(modalOpen&&dialog){modalQueue.push(request);return}
   show(request);
  };
  function show(request){
   if(request.owner!==campaign)return next();
   modalOpen=true;
   const opts=request.opts,buttons=opts.buttons?.length?opts.buttons:[{label:'知道了',primary:true}];
   originalModal({...opts,buttons:buttons.map(b=>({...b,fn:()=>{
    modalOpen=false;try{b.fn?.()}finally{queueMicrotask(next)}
   }}))});
  }
  function next(){
   if(modalOpen)return;
   while(modalQueue.length){
    const request=modalQueue.shift();
    if(request.owner===campaign){show(request);return}
   }
  }
  const toast=UI.toast;const notifications=[];
  let toastAt=0;
  UI.toast=function(message){
   if(/眼前一阵发白|你会倒下|需要休息/.test(message)){
    const s=state();
    if(!s||campaign.hp>CFG.fatigueWarning||s.fatigueWarnedDay===campaign.day)return;
    s.fatigueWarnedDay=campaign.day;
   }
   if(DM.isOpen()||document.querySelector('.et-modal-back')){notifications.push({message,owner:campaign});return}
   toastAt=Date.now();return toast.apply(this,arguments);
  };
  setInterval(()=>{
   if(notifications.length&&!DM.isOpen()&&!document.querySelector('.et-modal-back')&&Date.now()-toastAt>3200){
    const row=notifications.shift();if(row.owner===campaign)UI.toast(row.message);
   }
   if(H18.active()&&!DM.isOpen())VERIFY.sync();
   if(KONBINI.active())patience(KONBINI.state()?.cur);
  },500);
  let queued=false;
  new MutationObserver(()=>{
   if(queued)return;queued=true;
   queueMicrotask(()=>{queued=false;attach()});
  }).observe(app,{childList:true,subtree:true});
  document.addEventListener('pointerup',()=>{document.querySelectorAll('.h18-pad button').forEach(b=>b.blur())});
  noteDirect();attach();
 }
 return {install,pollution,patience,rest,recoverUI,recordDay,nightlyDetails,state,beginNight,closeNight,showNight};
})();
window.CH1FIX=CH1FIX;

