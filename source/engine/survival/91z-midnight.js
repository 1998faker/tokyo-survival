/* ==== engine/survival/91z-midnight.js ==== */
/* ===================================================================
   【v22.6 入境之夜：午夜死亡倒计时】
   第一天（入境之夜）00:00 是生存截止时间：还在酒店外（没有走进港屋酒店、也没有办完入住）就会死。
   - 时间只通过 PRO 的 advance() → TimeManager 的 TM.advance() 往前走，这里用 TM.onAdvance 监听每一次推进，调用 tick(之前, 之后)；
     提醒和死亡判断都只在 tick 里做一次，不分散在各个事件里。
   - 数值：config/game.json 的 prologue.midnight（截止时间、提醒时刻、安全场景、答错的时间损失、演出速度）
   - 文字：story/chapter1/prologue/prologue.json 的 midnight（提醒、答错原因、死亡演出、GAME OVER）
   - 成功入住以后（flags.checkedIn）或人在酒店里（hotel / room）都不会触发；第一章的三夜调查不使用这个机制。
   =================================================================== */
/* Midnight: the last light in the street, then the empty pavement. */
const MIDNIGHT_ART=(()=>{
 function draw(g,shot,elapsed){
  const r=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const dark=shot==='black',drag=shot==='drag',empty=shot==='empty';
  r(0,0,320,180,'#080a10');
  if(dark)return;
  r(0,12,123,93,'#171b23');r(123,0,76,99,'#111620');r(200,28,120,73,'#101219');
  r(12,26,100,57,'#303837');r(15,30,94,4,'#738477');r(17,39,88,39,'#414843');
  for(let x=20;x<107;x+=16)r(x,40,2,38,'#272d2c');
  for(let y=47;y<75;y+=8)r(20,y,81,1,'#5b645b');
  r(0,100,320,80,'#222632');r(0,117,320,3,'#484751');
  for(let i=0;i<12;i++){
   const x=(i*59)%320,y=125+(i*23)%49;
   r(x,y,7+i%7*4,1,i%3?'#343a47':'#4d504c');
  }
  for(let i=0;i<8;i++)r(29-i*2,101+i*7,64+i*4,1,'#393e3d');
  const clock=shot==='clock';
  const slide=drag?Math.min(elapsed/1200,1)*38:0;
  if(!empty){
   const x=drag?176+slide:146,y=drag?123+slide*.4:82;
   r(x+6,y,13,14,'#292a35');r(x+8,y+4,11,10,'#716b6a');
   if(drag){
    r(x-23,y+12,46,15,'#263943');r(x+20,y+19,28,7,'#242731');r(x+33,y+23,20,6,'#181c25');
    r(x-31,y+14,14,5,'#777471');r(x+41,y+22,31,7,'#0e1016');
    r(137,151,23,16,'#30292c');r(143,146,10,5,'#1e1a20');
   }else{
    r(x+2,y+14,24,29,'#314550');r(x+6,y+43,7,19,'#1a1e29');r(x+16,y+43,7,19,'#1a1e29');
    r(x+31,y+34,23,26,'#342b2e');r(x+36,y+27,11,8,'#232029');
   }
  }
  for(let i=0;i<45;i++){
   const x=(i*47)%320,y=(i*31+Math.floor(elapsed/22)*(i%3+2))%180;
   r(x,y,1,4,'rgba(154,170,187,.22)');
  }
  if(clock){
   r(211,31,71,29,'#10141c');r(215,34,63,23,'#262129');
   g.font='bold 17px monospace';g.textAlign='center';g.fillStyle='#dec0a0';g.fillText('00:00',247,51);
  }
 }
 return {draw};
})();

const MIDNIGHT=(function(){
 const CFG=()=>((GAME_CONFIG.prologue||{}).midnight)||{};
 const TXT=()=>(((GAME_DATA.story.chapter1||{}).prologue||{}).midnight)||{};
 function hm(v){const m=/^(\d{1,2}):(\d{2})$/.exec(String(v||''));return m?(+m[1])*60+(+m[2]):null}
 const deadline=()=>hm(CFG().deadline||'24:00');
 let root=null,timers=[],frame=0;
 function live(){return !!(window.PRO&&PRO.applies()&&campaign&&campaign.prologue&&!campaign.prologue.dead)}
 /* 时间往前走了一步：先放提醒，再看是否到了截止时间 */
 function tick(prev,now){
  if(!live()||PRO.inSafe())return refresh();
  const W=TXT().warnings||{};
  (CFG().warn||[]).forEach(t=>{const m=hm(t);if(m!=null&&prev<m&&now>=m&&now<deadline())warn(t,W[t]||{})});
  refresh();
  if(now>=deadline())PRO.midnightDeath();
 }
 function warn(t,w){
  if(w.toast)UI.toast(w.toast);
  if(w.glitch&&SETTINGS.get('anomalies'))UI.glitch(w.glitch,1200);
  if(w.sfx&&window.AUDIO)AUDIO.sfx(w.sfx);
 }
 /* 越接近午夜，界面越不安（23:30 起任务强调、23:50 起画面变暗、行人变少） */
 function level(){if(!live()||PRO.inSafe())return 0;const c=campaign.prologue.clock,W=(CFG().warn||[]).map(hm);return W.filter(m=>m!=null&&c>=m).length}
 function refresh(){const n=level();document.body.classList.toggle('mid-late',n>=1);document.body.classList.toggle('mid-urgent',n>=2);document.body.classList.toggle('mid-quiet',n>=3)}
 function urgentPrefix(){return level()>=2?(TXT().urgentTask||''):''}
 /* ---------- 死亡演出（不展示怪物的样子） ---------- */
 function close(){cancelAnimationFrame(frame);timers.forEach(clearTimeout);timers=[];if(root)root.remove();root=null;document.body.classList.remove('mid-dead','mid-late','mid-urgent','mid-quiet')}
 function show(info){
  close();const T=TXT().death||{},ms=CFG().lineMs||1800,place=(info&&info.place)||'';
  document.body.classList.add('mid-dead');if(window.AUDIO)AUDIO.ambience('none');
  root=document.createElement('div');root.id='mid-root';root.className='mid-root mid-cinema';root.setAttribute('role','dialog');root.setAttribute('aria-label','午夜 · 第一夜');
  root.innerHTML='<canvas width="320" height="180" aria-hidden="true"></canvas><div class="mid-lines" aria-live="polite"></div><button type="button" class="survival-btn mid-next">继续</button>';document.body.appendChild(root);
  const g=root.querySelector('canvas').getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shot='clock',at=performance.now();
  const draw=now=>{MIDNIGHT_ART.draw(g,shot,reduced?(shot==='drag'?1200:0):now-at);frame=requestAnimationFrame(draw)};
  frame=requestAnimationFrame(draw);
  const box=root.querySelector('.mid-lines'),lines=(T.lines||[]).map(l=>typeof l==='string'?{text:l}:l);let i=0;
  const step=()=>{
   if(!root)return;
   if(i>=lines.length){gameOver(info);return}
   const l=lines[i++],p=document.createElement('p');p.className='mid-line'+(l.cls?' '+l.cls:'');p.textContent=String(l.text||'').replace(/\{place\}/g,place||(T.placeFallback||''));box.replaceChildren(p);
   if(l.shot&&l.shot!==shot){shot=l.shot;at=performance.now()}root.dataset.shot=shot;
   requestAnimationFrame(()=>p.classList.add('on'));
   if(l.sfx&&window.AUDIO)AUDIO.sfx(l.sfx);
   if(l.dark)root.classList.add('mid-dark-'+l.dark);
   timers.push(setTimeout(step,ms*(l.hold||1)));
  };
  root.querySelector('.mid-next').onclick=()=>{timers.forEach(clearTimeout);timers=[];step()};
  step();
 }
 function gameOver(info){
  if(!root)return;cancelAnimationFrame(frame);timers.forEach(clearTimeout);timers=[];const T=TXT().death||{};
  root.className='mid-root mid-black';root.onclick=null;
  if(window.AUDIO)AUDIO.sfx('bump');
  root.innerHTML=`<div class="mid-over"><h1>${esc(T.title||'GAME OVER')}</h1><p>${esc(T.cause||'')}</p><p>${esc(T.body||'')}</p><div class="mid-btns"></div></div>`;
  const b=root.querySelector('.mid-btns');((info&&info.buttons)||[]).forEach(x=>{const el=document.createElement('button');el.type='button';el.className=x.primary?'survival-btn':'survival-btn alt';el.textContent=x.label;el.onclick=()=>{close();x.fn()};b.appendChild(el)});
 }
 return {tick,refresh,urgentPrefix,show,close,active:()=>!!root,level};
})();
window.MIDNIGHT=MIDNIGHT;
TM.onAdvance((prev,now)=>{if(window.PRO&&PRO.applies())MIDNIGHT.tick(prev,now)});
