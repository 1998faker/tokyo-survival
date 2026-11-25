/* ==== engine/survival/97zn-v52-systems.js ==== */
/* v52：浸蚀阶段化 · 场景异常指数 · 压力分档与感官表现 · 压力晕倒。
   数值全部在 GAME_CONFIG.v52；台词与场景读数在 GAME_DATA.d['v52/stress-lines']、GAME_DATA.d['v52/anomaly']。
   存档字段：campaign.v52 = {eroShown, eroSeen, meter, meterNote, outDay, faints:{章:次数}, stressOut, face:{类型:天}, nightInputs}
   =================================================================== */
const V52=(function(){
 const C=()=>GAME_CONFIG.v52;
 const ROMAN=['','Ⅰ','Ⅱ','Ⅲ','Ⅳ'];
 function st(){if(!campaign)return null;campaign.v52??={};const v=campaign.v52;v.faints??={};v.face??={};return v}
 const prologue=()=>!!(window.PRO&&PRO.applies&&PRO.applies());
 const live=()=>!!campaign&&campaign.firstDayComplete&&!prologue()&&!campaign.v51?.death;
 const prayed=()=>{try{return !!(window.FLOOD&&FLOOD.prayed())}catch(e){return false}};
 const inHotel=()=>{try{return !!(window.H18&&H18.active())||!!app.querySelector('#h18-stage')||V51.hotel()}catch(e){return false}};
 const sanctuary=()=>{try{return V51.sanctuary()}catch(e){return false}};
 const outside=()=>live()&&!inHotel()&&!sanctuary();
 const busy=()=>(window.DM&&DM.isOpen())||!!document.querySelector('.et-modal-back,.sc-overlay,.v52-overlay');
 const softFx=()=>SETTINGS.get('stressFx')==='soft'||matchMedia('(prefers-reduced-motion: reduce)').matches;

 /* ---------------- 浸蚀阶段 ---------------- */
 function eroDay(){const c=campaign.case1;let d=campaign.day;if(c&&c.state&&!['active','report','due'].includes(c.state))d=campaign.map25Freeze??d;return d}
 function eroStage(){if(!campaign||!campaign.firstDayComplete)return 0;const d=eroDay();let s=0;C().erosion.stages.forEach((x,i)=>{if(d>=x.fromDay)s=i+1});return s}
 /* 祈福有效期间：效果按低一阶计算（阶段名照常显示） */
 function eroEffective(){const s=eroStage();return prayed()?Math.max(0,s-1):s}
 const eroRow=()=>{const s=eroEffective();return s?C().erosion.stages[s-1]:null};
 const eroShown=()=>!!(campaign&&st().eroShown&&eroStage()>0);
 function eroName(i){return ROMAN[i]+' '+C().erosion.stages[i-1].name}
 function eroChip(sep){if(!eroShown())return '';const s=eroStage();return (sep||'')+'<span class="v52-ero'+(s>=3?' hi':'')+'">浸蚀 '+ROMAN[s]+'</span>'}
 function eroTimeline(){
  if(!eroShown())return '';const s=eroStage(),seen=Math.max(s,st().eroSeen||0),n=C().erosion.stages.length;let h='';
  for(let i=1;i<=n;i++){h+=(i>1?'<i>──</i>':'')+(i<=seen?'<b class="'+(i===s?'now':'')+(i===s&&st().eroStamp===s?' v52-stamp':'')+'">'+esc(eroName(i))+'</b>':'<b class="unk">？？？</b>')}
  return '<div class="v52-ero-line" aria-label="浸蚀阶段"><span>浸蚀</span>'+h+'</div>';
 }
 function eroHtml(){return eroTimeline()}
 /* 地图第一次出现触手时（DAY 3 起第一次打开地图）开始显示 */
 function eroOnMap(){
  if(!live())return;const v=st(),s=eroStage();if(s<1)return;
  if(!v.eroShown){v.eroShown=true}
  if((v.eroSeen||0)<s){v.eroSeen=s;v.eroStamp=s;setTimeout(()=>{if(campaign?.v52)campaign.v52.eroStamp=0},2500)}
  campaignSave();
 }
 /* 地图图片顺延：DAY 1–2 平静；DAY 3 起才出现触手 */
 function mapPhase(){
  if(!campaign||!campaign.firstDayComplete)return 0;const d=eroDay(),pr=prayed();
  if(d<=2)return 0;if(d===3)return 2;if(d<=5)return pr?4:3;if(d<=8)return pr?4:5;return pr?6:5;
 }
 function phaseData(P,i){
  if(!campaign||!campaign.firstDayComplete||!P)return P;const d=eroDay(),T=C().mapText;
  if(i===0&&d<=2)return Object.assign({},P,T['day'+d]||{});
  if(i===2&&d===3)return Object.assign({},P,T.day3||{});
  return P;
 }
 /* 每天第一次离开酒店：按阶段加压力 */
 function outing(){
  if(!live())return;const v=st();if(v.outDay===campaign.day)return;v.outDay=campaign.day;
  const r=eroRow();if(r&&r.outStress)GS.change({stress:r.outStress},'外出压力（浸蚀 '+ROMAN[eroEffective()]+'）');else campaignSave();
 }
 /* 外出时的疲劳消耗倍率：浸蚀 × 压力档 */
 function fatigueCost(type,base){
  if(!base||!campaign||type==='rest'||type==='hotel'||!outside())return base;
  const r=eroRow(),t=tier();return Math.max(1,Math.round(base*(r?r.fatigue:1)*(t.fatigueMul||1)));
 }
 /* SAN 损失只放大，不额外扣；酒店内、圣域、回溯代价不放大 */
 function sanScale(amount,reason){
  if(amount>=0||!outside()||/回溯/.test(reason||''))return amount;const r=eroRow();return r&&r.san!==1?Math.round(amount*r.san):amount;
 }

 /* ---------------- 压力分档 ---------------- */
 function tier(){const s=campaign?campaign.stress||0:0,T=C().stress.tiers;let t=T[0];for(const x of T)if(s>=x.min)t=x;return t}
 function sleepGain(base){
  if(!campaign)return base;const t=tier(),out=Object.assign({},base);
  if(out.hp!=null){out.hp=Math.round(out.hp*(t.sleepMul||1))+(t.sleepBonus||0)}
  return out;
 }
 /* 夜间：疲劳、SAN 偏低时压力上升（压力和疲劳、SAN 互相挂钩） */
 function nightInputs(){
  if(!live())return;const v=st();if(v.nightInputs===campaign.day)return;v.nightInputs=campaign.day;
  const N=C().stress.night;let add=0;const why=[];
  if(campaign.hp<=N.lowHp){add+=N.lowHpStress;why.push('疲劳')}
  if(campaign.san<=N.lowSan){add+=N.lowSanStress;why.push('SAN 偏低')}
  if(add)GS.change({stress:add},'夜间压力（'+why.join('、')+'）');
 }

 /* ---------------- 压力 100：晕倒 ---------------- */
 let faintPending=false;
 function checkFaint(){
  if(!campaign||faintPending||st().stressOut)return;
  if((campaign.stress||0)<GAME_CONFIG.player.maxStress)return;
  if(!campaign.firstDayComplete||campaign.v51?.death)return;
  faintPending=campaign;waitFaint();
 }
 function waitFaint(){
  if(!campaign||campaign!==faintPending||(campaign.stress||0)<GAME_CONFIG.player.maxStress){faintPending=false;return}
  if(prologue()||busy()){setTimeout(waitFaint,700);return}
  faintPending=false;faint();
 }
 function faint(){
  const v=st(),F=C().stress.faint,ch=String(campaign.storyIndex||0);
  v.faints[ch]=(v.faints[ch]||0)+1;
  const sway=!softFx();document.body.classList.add(sway?'v52-faint':'v52-faint-soft');
  setTimeout(()=>{
   document.body.classList.remove('v52-faint','v52-faint-soft');
   if(F.secondGameOver&&v.faints[ch]>=2){
    v.stressOut=true;campaign.stress=GAME_CONFIG.player.maxStress;campaignSave();
    if(window.H18?.active())H18.stop();DM.close();survivalStatus();return;
   }
   if(window.H18?.active())H18.stop();DM.close();
   campaign.v51??={};campaign.v51.collapseDay=campaign.day;campaign.actions=0;campaign.location='shinagawa';
   campaign.stress=F.stress;campaignSave();
   UI.scene('story',faintRoom);faintRoom();
  },sway?1600:400);
 }
 function faintRoom(){
  const T=C().stress.faint;
  app.innerHTML='<div class="rpg-shell"><section class="rpg-panel" id="v52-faint-room"><h2>'+esc(T.title)+'</h2>'+T.lines.map(l=>'<p>'+esc(l)+'</p>').join('')+'<button class="story-btn" id="v52-faint-next">☾ 夜间结算</button></section></div>';
  app.querySelector('#v52-faint-next').onclick=()=>{V51.sleep();nightlyClose()};
 }

 /* ---------------- 感官：失焦 · 耳鸣 · 眩晕 ---------------- */
 let ac=null;
 function audio(){
  if(window.AUDIO&&AUDIO.get('sfx')===false)return null;
  try{ac??=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}catch(e){return null}
 }
 const vol=()=>window.AUDIO?(Number(AUDIO.get('volume'))||0.6):0.6;
 function blur(){
  const F=C().stressFx,px=(softFx()?F.blurPx/2:F.blurPx)*(tier().blurScale||1);
  document.body.style.setProperty('--v52-blur',px.toFixed(1)+'px');document.body.classList.add('v52-blur');
  setTimeout(()=>document.body.classList.remove('v52-blur'),F.blurMs);
 }
 function tinnitus(){
  const a=audio();if(!a)return;const F=C().stressFx,t=a.currentTime,o=a.createOscillator(),g=a.createGain();
  o.type='sine';o.frequency.value=F.tinnitusHz;g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(F.tinnitusGain*vol(),t+F.tinnitusFade);g.gain.setValueAtTime(F.tinnitusGain*vol(),t+F.tinnitusHold);g.gain.linearRampToValueAtTime(0,t+F.tinnitusHold+F.tinnitusFade);
  o.connect(g).connect(a.destination);o.start(t);o.stop(t+F.tinnitusHold+F.tinnitusFade+.1);
 }
 function sway(){
  const F=C().stressFx;const cls=softFx()?'v52-vignette':'v52-sway';
  document.body.classList.add(cls);setTimeout(()=>document.body.classList.remove(cls),F.swayMs);
 }
 function fxTick(){
  if(!campaign||!outside()||document.hidden)return;
  if(SETTINGS.get('anomalies')===false)return;
  const t=tier();
  if(t.blur&&Math.random()<t.blur)blur();
  if(t.tinnitus&&!busy()&&Math.random()<t.tinnitus)tinnitus();
  if(t.sway&&Math.random()<t.sway)sway();
 }
 /* 「脸色」：别人先看出来。日语 + 中文翻译，每类 NPC 每天最多一次 */
 function face(kind){
  if(!live())return;const t=tier();if(!t.face)return;const v=st();
  if(v.face[kind]===campaign.day)return;
  const L=(GAME_DATA.d['v52/stress-lines']||{})[kind];if(!L)return;
  const line=L[Math.min(L.length,t.face)-1];if(!line)return;
  v.face[kind]=campaign.day;campaignSave();
  setTimeout(()=>{if(busy())return;UI.modal({title:line.who,html:'<p lang="ja">'+esc(line.jp)+'</p><p>（'+esc(line.zh)+'）</p>',buttons:[{label:'……'}]})},C().stressFx.faceDelayMs);
 }
 function faceOnDistrict(id){
  const v=st();if(!v)return;
  if(id==='shinagawa'){face('nguyen');return}
  face(campaign.day%2?'auntie':'peer');
 }

 /* ---------------- 场景异常指数 ---------------- */
 const M=()=>C().anomalyMeter;
 let meterEl=null,tickN=0,cur=null,ghost={burst:0,pause:0},falseBurst=0,overflowUntil=0,lastKey='';
 function sceneKey(){
  if(!campaign||!live())return null;
  if(window.H18&&(H18.active()||app.querySelector('#h18-stage'))){const w=H18.where?.();return w?'hotel:'+w:'hotel'}
  if(app.querySelector('#v51-shrine'))return 'shrine';
  const id=(typeof district!=='undefined'&&district&&UI.current()==='district')?district.id:(window.TRAVEL&&TRAVEL.where())||campaign.location;
  return 'district:'+id;
 }
 function source(key){
  const D=GAME_DATA.d['v52/anomaly']||{};if(!key)return null;
  if(key==='shrine')return {kind:'none',base:0};
  let s=D[key]||null;
  if(key==='hotel:corridor'&&D['hotel:corridor:207']){const p=H18.pos?.(),n=D['hotel:corridor:207'];if(p&&Math.abs(p.x-n.x)+Math.abs(p.y-n.y)<=n.r)s=n}
  if(key.startsWith('district:')){
   const id=key.slice(9);
   try{if(V51.sanctuary()||['meijijingumae'].includes(id))return {kind:'none',base:0}}catch(e){}
   if(s&&s.kind==='deep'){const e=eroStage();s=Object.assign({},s,{base:s.base+e*(s.perStage||0)})}
  }
  return s||{kind:'none',base:0};
 }
 function value(){
  const s=cur;if(!s)return null;tickN++;
  if(overflowUntil>Date.now())return 'over';
  /* 低 SAN 假读数：像亡者那样乱跳（圣域不出现） */
  if(campaign.san<=M().falseSan[0]&&!sanctuary()){
   if(falseBurst>0){falseBurst--;return Math.round(20+Math.random()*30)}
   const p=campaign.san<=M().falseSan[1]?M().falseChance[1]:M().falseChance[0];
   if(Math.random()<p){falseBurst=1+Math.floor(Math.random()*2);return Math.round(25+Math.random()*25)}
  }
  if(s.kind==='artifact'){return tickN%M().artifactBeat===0?s.peak:s.base}
  if(s.kind==='deep'){const P=M().deepPeriod,a=s.amp||8;return Math.round(s.base+a*(1-Math.cos(2*Math.PI*(tickN%P)/P))/2)}
  if(s.kind==='ghost'){
   if(ghost.pause>0){ghost.pause--;return '--'}
   if(ghost.burst>0){ghost.burst--;const v=Math.round(s.peak*(.75+Math.random()*.35));if(!ghost.burst&&Math.random()<M().ghostPauseChance)ghost.pause=2+Math.floor(Math.random()*5);return v}
   if(Math.random()<M().ghostBurstChance){ghost.burst=1+Math.floor(Math.random()*3);ghost.burst--;return Math.round(s.peak*(.75+Math.random()*.35))}
   return Math.max(0,s.base+Math.round(Math.random()*2-1));
  }
  return 0;
 }
 function meterSound(v,prev){
  const a=audio();if(!a||!cur||v==='--')return;const t=a.currentTime,k=cur.kind,V=vol()*M().gain;
  if(v==='over'){const o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=90;g.gain.setValueAtTime(V*.5,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.32);return}
  if(typeof v!=='number'||v<=0)return;
  if(k==='artifact'){const o=a.createOscillator(),g=a.createGain(),hi=v>=cur.peak&&cur.peak>cur.base;o.type='sine';o.frequency.value=hi?62:55;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(V*(hi?.9:.35)*Math.min(1,.3+v/30),t+.05);g.gain.linearRampToValueAtTime(0,t+.48);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.5)}
  else if(k==='ghost'&&typeof prev==='number'&&v>prev+12){const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(48,t+.18);g.gain.setValueAtTime(V*1.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.27)}
  else if(k==='deep'){const n=a.createBufferSource(),b=a.createBuffer(1,a.sampleRate*.5|0,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=260+v*6;const g=a.createGain();g.gain.setValueAtTime(V*.12*Math.min(1,v/30),t);g.gain.linearRampToValueAtTime(0,t+.5);n.connect(f).connect(g).connect(a.destination);n.start(t)}
 }
 let prevV=null;
 function meterTick(){
  const on=!!(campaign&&live()&&st().meter&&!document.querySelector('.op-stage,#op-body'));
  if(!meterEl){meterEl=document.createElement('div');meterEl.id='v52-meter';meterEl.setAttribute('role','status');meterEl.innerHTML='<small>異常指数</small><b>0%</b>';document.body.appendChild(meterEl)}
  meterEl.hidden=!on;if(!on){cur=null;return}
  const key=sceneKey(),full=key+':'+eroStage()+':'+(campaign.san<=M().falseSan[0]);
  if(full!==lastKey){lastKey=full;cur=source(key);tickN=0;ghost={burst:0,pause:0};prevV=null;
   if(key==='hotel:room206'&&!st().meterNote206){st().meterNote206=campaign.day;campaignSave()}}
  else if(key&&key.startsWith('hotel:corridor')){cur=source(key)}
  const v=value(),b=meterEl.lastElementChild;
  b.textContent=v==='over'?'■■■%':v==='--'?'--%':(v||0)+'%';
  meterEl.classList.toggle('over',v==='over');meterEl.classList.toggle('hi',typeof v==='number'&&v>=60);
  if(!document.hidden)meterSound(v,prevV);prevV=v;
 }
 function meterUnlock(){
  if(!live()||campaign.day<2)return;const v=st();if(v.meter)return;
  v.meter=true;campaignSave();UI.toast(C().anomalyMeter.unlockText);
 }

 /* ---------------- 状态栏 ---------------- */
 function details(base){
  return function(){
   let h=base.apply(this,arguments);if(!eroShown())return h;
   return h.replace(/<\/div>$/,'<span class="v52-ero-chip" title="浸蚀阶段">浸蚀 '+ROMAN[eroStage()]+'</span></div>');
  };
 }

 function install(){
  /* 疲劳 / SAN / 压力的状态栏补充 */
  V51.details=details(V51.details);
  /* 每天第一次出门、「脸色」 */
  const baseEnter=enterDistrict;
  enterDistrict=function(id){const r=baseEnter.apply(this,arguments);if(campaign&&typeof district!=='undefined'&&district?.id===id){outing();faceOnDistrict(id)}return r};
  /* 地图：异常指数解锁、浸蚀显示 */
  const baseHome=tokyoHome;
  tokyoHome=function(){const r=baseHome.apply(this,arguments);if(campaign&&campaign.firstDayComplete&&!campaign.v51?.death){meterUnlock();const before=st().eroShown;eroOnMap();if(!before&&st().eroShown)UI.update()}return r};
  /* 夜间：压力与疲劳、SAN 挂钩 */
  const baseNight=nightlyClose;
  nightlyClose=function(){try{nightInputs()}catch(e){console.error(e)}return baseNight.apply(this,arguments)};
  GS.on(checkFaint);
  setInterval(meterTick,C().anomalyMeter.tickMs);
  setInterval(fxTick,C().stressFx.checkMs);
  /* 酒店大厅：前台的「脸色」 */
  setInterval(()=>{if(campaign&&window.H18?.active()&&H18.where?.()==='lobby')face('front')},4000);
  /* 即死事件出现的场景：读数溢出 */
  if(window.PERIL){const m=PERIL.maybe;PERIL.maybe=function(){const r=m.apply(this,arguments);if(r)overflowUntil=Date.now()+C().anomalyMeter.overflowMs;return r}}
 }
 return {install,eroStage,eroEffective,eroShown,eroChip,eroHtml,eroTimeline,mapPhase,phaseData,fatigueCost,sanScale,sleepGain,tier,checkFaint,faint,face,sceneKey,
  _blur:blur,_tinnitus:tinnitus,_sway:sway,_overflow:ms=>{overflowUntil=Date.now()+(ms||3000)},_source:()=>cur};
})();
window.V52=V52;

