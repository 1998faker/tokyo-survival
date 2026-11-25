/* ==== engine/survival/89-travel.js ==== */
/* ===================================================================
   【V18 东京区域地图：区域开放 + 乘电车移动】
   - 区域按剧情进度开放：data/world/regions.json
   - 在地图上选好车站后「乘车前往」：按真实线路计算路线、换乘、车费、时间
   - 乘车途中可能遇到车内事件（日语广播题 / 规则怪谈 / 生活小事）：data/events/train-events.json
   - 车费参数：config/game.json 的 travel
   只在生存模式中生效；纯学习（没有生存存档）时地图照旧。
   =================================================================== */
const TRAVEL=(function(){
 const REG=(GAME_DATA.d["world/regions"]||{}).groups||[];
 const EVT=GAME_DATA.d["events/train-events"]||{events:[],nodes:[]};
 const NODES={};(EVT.nodes||[]).forEach(n=>NODES[n.id]=n);
 function where(){return campaign&&(campaign.location||(campaign.firstDayComplete?'shinagawa':campaign.birth))}
 function groupOf(id){return REG.find(g=>g.stations.includes(id))}
 function open(id){
  if(campaign&&V51.swallowed(id))return false;
  if(id==='meijijingumae')return true;
  if(!campaign||!campaign.firstDayComplete)return true;
  // 山手线为日常交通：DAY 2 起可抵达全线车站；不再继承章节区域的隐藏锁。
  if(lines.some(l=>l.id==='y'&&l.st.includes(id)))return true;
  const g=groupOf(id);if(!g||!g.when)return true;const w=g.when;
  if(w.dayMin!=null&&campaign.day<w.dayMin)return false;
  if(w.chapterMin!=null&&currentChapterNo()<w.chapterMin)return false;
  if(w.flag&&!(campaign.storyFlags||{})[w.flag])return false;
  return true;
 }
 function hint(id){if(V51.swallowed(id))return (byId[id]?.jp||id)+' · 今日吞没，无法下车';const g=groupOf(id);return g&&g.hint||'暂未开放'}
 /* 路线：按「站数 + 换乘」最少计算 */
 function route(from,to){
  if(from===to)return {segs:[],stops:0,transfers:0};
  const adj={};
  lines.forEach(l=>{for(let i=0;i<l.st.length-1;i++){const a=l.st[i],b=l.st[i+1];(adj[a]=adj[a]||[]).push([b,l.id]);(adj[b]=adj[b]||[]).push([a,l.id])}});
  if(lines.find(l=>l.id==='y')){const y=lines.find(l=>l.id==='y').st;(adj[y[0]]=adj[y[0]]||[]).push([y[y.length-1],'y']);(adj[y[y.length-1]]=adj[y[y.length-1]]||[]).push([y[0],'y'])} // 山手线是环线
  const key=(s,l)=>s+'|'+l,dist={},prev={},Q=[];
  (adj[from]||[]).forEach(()=>{});dist[key(from,'')]=0;Q.push([0,from,'']);
  while(Q.length){Q.sort((a,b)=>a[0]-b[0]);const [d,s,l]=Q.shift();if(d>dist[key(s,l)])continue;if(s===to){return build(prev,key(s,l),from,d)}
   for(const [n,nl] of (adj[s]||[])){const nd=d+1+(l&&l!==nl?2:0),k=key(n,nl);if(dist[k]==null||nd<dist[k]){dist[k]=nd;prev[k]=key(s,l);Q.push([nd,n,nl])}}}
  return null;
 }
 function build(prev,k,from){const path=[];while(k){const [s,l]=k.split('|');path.unshift([s,l]);k=prev[k]}
  const segs=[];for(let i=1;i<path.length;i++){const [s,l]=path[i],last=segs[segs.length-1];if(last&&last.line===l){last.to=s;last.stops++}else segs.push({line:l,from:path[i-1][0],to:s,stops:1})}
  return {segs,stops:segs.reduce((a,x)=>a+x.stops,0),transfers:Math.max(0,segs.length-1)}}
 function cost(r){const T=GAME_CONFIG.travel,sur=T.lineSurcharge||{};let fare=r.stops?Math.min(T.maxFare,T.baseFare+T.farePerStop*r.stops):0;r.segs.forEach(s=>{fare+=sur[s.line]||0});return {fare,minutes:Math.ceil((r.stops*T.minutesPerStop+r.transfers*T.transferMinutes)/V51.speed())}}
 /* 乘车画面 */
 function plan(dest){
  const from=where(),s=byId[dest];if(!s)return;
  if(!open(dest)){UI.toast('🔒 '+s.jp+'：'+hint(dest));return}
  if(!from||from===dest){enterDistrict(dest);return}
  const r=route(from,dest);if(!r){enterDistrict(dest);return}
  const c=cost(r);dayDefaults();
  const needAction=!campaign.visitedToday.includes(dest),noAction=needAction&&campaign.actions<=0,noCash=campaign.cash<c.fare;
  UI.scene('travel',()=>plan(dest));
  const L=id=>lines.find(l=>l.id===id)||{name:id,color:'#888'};
  app.innerHTML=`<div class="rpg-shell"><section class="rpg-panel"><div class="rpg-kicker">TRAIN // 乘车</div><h1>🚃 ${esc(byId[from].jp)} → ${esc(s.jp)}</h1>
   <div class="et-route"><span>${esc(byId[from].jp)}</span>${r.segs.map(g=>`<span class="arrow">→</span><span class="line" style="--c:${L(g.line).color}">${esc(L(g.line).name)} · ${g.stops} 站</span><span class="arrow">→</span><span>${esc(byId[g.to].jp)}</span>`).join('')}</div>
   <div class="et-travel-meta"><span>⏱ 约 <b>${c.minutes}</b> 分钟</span><span>🔁 换乘 <b>${r.transfers}</b> 次</span><span>💴 车费 <b>¥${c.fare.toLocaleString('ja-JP')}</b></span><span>${needAction?'⏳ 今天第一次去：消耗 1 次行动':'今天去过：不消耗行动'}</span></div>
   ${noAction?'<p class="survival-tip" style="color:var(--et-danger)">今天的行动已经用完。请在「任务」里进行夜间结算。</p>':''}${noCash?'<p class="survival-tip" style="color:var(--et-danger)">钱不够买车票。</p>':''}
   <div class="daily-buttons"><button type="button" class="survival-btn" id="tv-go"${noAction||noCash?' disabled':''}>🚃 乘车出发</button><button type="button" class="survival-btn alt" id="tv-cancel">取消</button></div>
   <div class="et-train-window" aria-hidden="true"></div><div id="tv-dlg" class="adv-box" hidden></div></section></div>`;
  app.querySelector('#tv-cancel').onclick=tokyoHome;
  app.querySelector('#tv-go').onclick=()=>depart(dest,r,c);window.scrollTo(0,0);
 }
 function depart(dest,r,c){
  if(!open(dest)||campaign.cash<c.fare||!V51.action('travel',true))return;
  V51.dayTime(c.minutes);if(c.fare)GS.change({cash:-c.fare},'电车票价');if(window.AUDIO)AUDIO.sfx('train');
  campaign.location=dest;campaign.visitedToday??=[];if(!campaign.visitedToday.includes(dest))campaign.visitedToday.push(dest);campaignSave();
  app.querySelectorAll('#tv-go,#tv-cancel').forEach(b=>b.disabled=true);
  const ev=pickEvent();
  const arrive=()=>{DM.close();if(GS.dead()){survivalStatus();return}enterDistrict(dest)};
  if(!ev){const button=app.querySelector('#tv-go');setTimeout(()=>{if(button?.isConnected)arrive()},V51.walkingDelay(GAME_CONFIG.v51.fatigue.rideMs));return}
  if(ev.id==='kisaragi'){PGIRL.kisaragi(arrive,NODES[ev.node]);return}
  const next=r.segs.length?byId[r.segs[r.segs.length-1].to].jp:byId[dest].jp;
  const stage=invasionStage(),sanTrain=GAME_CONFIG.sanRules.ruleViolationBase+stage*GAME_CONFIG.sanRules.ruleViolationPerStage;
  SR.run(ev.node,{nodes:NODES,host:()=>document.getElementById('tv-dlg'),cond:()=>true,pick:t=>String(typeof t==='object'&&t?t.default||'':t||'').split('{next}').join(next),
   apply:e=>{if(!e)return '';if(e.rule){campaign.ruleViolations=(campaign.ruleViolations||0)+1}const san=(e.san||0)-(e.sanRule?sanTrain:0);return GS.change({hp:e.hp,san,cash:e.cash,stress:e.stress},'违反了电车里的规则')},
   jpPenalty:GAME_CONFIG.wrongAnswer.quizHpPerWrong,tauntScene:'station',evidence:()=>[],call:()=>{},onEnd:arrive});
 }
 function pickEvent(){
  if(!campaign||campaign.day<2||Math.random()>=GAME_CONFIG.travel.eventChance)return null;
  const st=invasionStage(),list=(EVT.events||[]).filter(e=>!e.when||((e.when.stageMin==null||st>=e.when.stageMin)));
  const total=list.reduce((a,e)=>a+(e.weight||1),0);let x=Math.random()*total;
  for(const e of list){x-=(e.weight||1);if(x<=0)return e}return list[0]||null;
 }
 return {open,hint,route,cost,plan,where,events:EVT};
})();

/* 地图：锁住还没开放的车站，「探索」按钮改为「乘车前往」 */
const tvPaint=paintMap;
paintMap=function(){
 tvPaint();if(!campaign||!campaign.firstDayComplete)return;
 app.querySelectorAll('.station').forEach(g=>g.classList.toggle('locked',!TRAVEL.open(g.dataset.station)));
 const btn=document.getElementById('station-start');if(!btn)return;const id=selected,s=byId[id];
 if(!TRAVEL.open(id)){btn.disabled=true;btn.textContent='🔒 '+TRAVEL.hint(id);return}
 const here=TRAVEL.where();
 if(here===id){btn.textContent='▶ 在 '+s.jp+' 探索街区（你现在就在这里）';btn.onclick=()=>enterDistrict(id);return}
 const r=TRAVEL.route(here,id);if(!r)return;const c=TRAVEL.cost(r);
 btn.textContent='🚃 乘车前往 '+s.jp+'（¥'+c.fare+' · 约'+c.minutes+'分）';btn.onclick=()=>TRAVEL.plan(id);
};
const tvHome=tokyoHome;
tokyoHome=function(){tvHome();if(!campaign||!campaign.firstDayComplete)return;
 app.querySelectorAll('[data-gate]').forEach(b=>{const id=b.dataset.gate;if(!TRAVEL.open(id)){b.disabled=true;b.insertAdjacentHTML('beforeend','<small>🔒 '+esc(TRAVEL.hint(id))+'</small>')}else b.onclick=()=>TRAVEL.plan(id)});
};
/* 进入街区即视为到达该地点 */
const tvEnter=enterDistrict;
enterDistrict=function(id){tvEnter(id);if(campaign&&district&&district.id===id&&campaign.location!==id){campaign.location=id;campaignSave()}};
