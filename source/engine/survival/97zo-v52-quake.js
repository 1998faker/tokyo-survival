/* ==== engine/survival/97zo-v52-quake.js ==== */
/* v52：DAY 3 早上第一次走出港屋酒店 · 北品川的余震（城市层第一次露出东西）
   七个像素画面；不解释、不弹提示；只扣 SAN（GAME_CONFIG.v52.quake.san）。
   档案「04 异常事件」记一笔。同一天不再出现即死事件（No.18 不会同日出现）。
   存档：campaign.v52.quakeDay = 发生的天数 */
const QUAKE=(function(){
 const W=320,H=180;
 const Q=()=>GAME_CONFIG.v52.quake;
 const fill=t=>String(t||'').replace(/\{name\}/g,(campaign&&campaign.name)||'调查员');
 let ctx=null,cv=null,raf=0,idx=0,t0=0,done=null,root=null,ac=null,timers=[];
 const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||SETTINGS.get('stressFx')==='soft';
 /* ---------- 声音 ---------- */
 function A(){if(window.AUDIO&&AUDIO.get('sfx')===false)return null;try{ac??=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}catch(e){return null}}
 const V=()=>window.AUDIO?(Number(AUDIO.get('volume'))||0.6):0.6;
 function noise(dur,freq,gain,type='lowpass',at=0){const a=A();if(!a)return;const t=a.currentTime+at,b=a.createBuffer(1,Math.max(1,a.sampleRate*dur|0),a.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){l=(l+0.02*(Math.random()*2-1))/1.02;d[i]=type==='lowpass'?l*3.5:Math.random()*2-1}
  const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type=type;f.frequency.value=freq;const g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*V(),t+Math.min(.4,dur/4));g.gain.linearRampToValueAtTime(0,t+dur);s.connect(f).connect(g).connect(a.destination);s.start(t)}
 function tone(f0,f1,dur,gain,type='sine',at=0){const a=A();if(!a)return;const t=a.currentTime+at,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(gain*V(),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.05)}
 const SFX={
  rumble:()=>{noise(3.6,90,.9);for(let i=0;i<10;i++)tone(900+Math.random()*400,700,.05,.05,'square',.2+i*.3)},
  street:()=>{noise(4,1800,.05,'bandpass')},
  water:()=>{noise(5.5,400,.35);noise(5.5,1200,.06,'bandpass')},
  rise:()=>{noise(6,160,.6);tone(55,38,5,.25)},
  bubbles:()=>{for(let i=0;i<14;i++)tone(300+Math.random()*500,900+Math.random()*600,.08,.12,'sine',i*.28+Math.random()*.1);tone(80,60,3.5,.18,'triangle')},
  blink:()=>{tone(2200,1800,.08,.05)},
  tv:()=>{tone(880,880,.18,.08,'square');tone(660,660,.25,.08,'square',.2);noise(4.5,2400,.03,'bandpass',.4)}
 };
 /* ---------- 画面零件 ---------- */
 const R=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 function sky(sun){const g=ctx.createLinearGradient(0,0,0,110);if(sun){g.addColorStop(0,'#9fc3d8');g.addColorStop(1,'#e6dcc4')}else{g.addColorStop(0,'#6f7f8c');g.addColorStop(1,'#a7aaa4')}ctx.fillStyle=g;ctx.fillRect(0,0,W,110)}
 function hotel(){
  R(14,26,120,92,'#b9ae96');R(14,26,120,6,'#8f8470');
  for(let r=0;r<3;r++)for(let c=0;c<4;c++)R(24+c*27,40+r*24,16,14,r===2?'#44505a':'#5d6d78');
  R(56,92,36,26,'#3a3438');R(60,96,12,22,'#6e8a96');R(76,96,12,22,'#6e8a96');
  R(40,82,68,9,'#2c3a46');ctx.fillStyle='#f2e6c4';ctx.font='7px monospace';ctx.fillText('ミナトヤホテル',46,89);
 }
 function canal(level,sun){
  /* 右边：运河、栏杆、屋形船 */
  R(170,70,150,48,sun?'#7c96a6':'#55707c');
  for(let i=0;i<6;i++)R(176+i*24,74+((i*7)%11),14,1,sun?'#a9c1cc':'#7d98a2');
  R(156,66,164,3,'#8a8c8a');for(let i=0;i<9;i++)R(160+i*18,58,2,10,'#8a8c8a');R(158,58,162,2,'#8a8c8a');
  R(220,78,60,10,'#6b3a2e');R(226,68,48,10,'#d8c39a');R(224,66,52,3,'#4a2a22');for(let i=0;i<5;i++)R(230+i*9,71,5,4,'#f2d27a');
 }
 function road(){R(0,118,W,62,'#55585c');for(let i=0;i<8;i++)R(10+i*42,148,22,2,'#c9c7b8');R(0,116,W,3,'#77797a')}
 function wires(sw){ctx.strokeStyle='#2a2a2e';ctx.lineWidth=1;ctx.beginPath();R(146,8,3,110,'#4a4038');for(let k=0;k<3;k++){ctx.moveTo(0,14+k*5);ctx.quadraticCurveTo(74,26+k*5+sw*(4+k),147,12+k*5);ctx.moveTo(147,12+k*5);ctx.quadraticCurveTo(232,24+k*5-sw*(3+k),320,16+k*5)}ctx.stroke()}
 function vend(dx){R(126+dx,90,18,28,'#c8402e');R(129+dx,94,12,10,'#e8e2cc');for(let i=0;i<3;i++)R(129+dx+i*4,106,3,5,['#3d7ac7','#e8b64a','#58a86b'][i]);R(129+dx,113,12,3,'#222')}
 function person(x,y,o={}){const sub=o.sub||0;
  if(o.umb){R(x-9,y-28,20,3,o.umb);R(x-6,y-31,14,3,o.umb);R(x,y-28,1,8,'#333')}
  R(x-2,y-24,6,6,o.skin||'#e2b89a');R(x-2,y-25,6,2,o.hair||'#2a2220');R(x-3,y-18,8,10,o.body||'#3b4252');R(x-3,y-8,3,8,o.leg||'#2a2e36');R(x+2,y-8,3,8,o.leg||'#2a2e36');
  if(o.broom){R(x+6,y-16,1,16,'#8a6a3a');R(x+3,y,8,2,'#c9a95a')}
  if(sub>0){ctx.fillStyle='rgba(70,110,128,.78)';ctx.fillRect(x-6,y-Math.min(sub,26),14,Math.min(sub,26))}
 }
 function rain(t,a){ctx.strokeStyle='rgba(220,230,240,'+a+')';ctx.beginPath();for(let i=0;i<70;i++){const x=(i*47+t*0.25)%W,y=(i*29+t*0.6)%H;ctx.moveTo(x,y);ctx.lineTo(x-2,y+6)}ctx.stroke()}
 function tentacle(pts,w,col){
  ctx.lineCap='round';ctx.lineJoin='round';
  for(let i=0;i<pts.length-1;i++){const k=i/(pts.length-1);ctx.strokeStyle=col;ctx.lineWidth=Math.max(2,w*(1-k*.8));ctx.beginPath();ctx.moveTo(pts[i][0],pts[i][1]);ctx.lineTo(pts[i+1][0],pts[i+1][1]);ctx.stroke()}
  ctx.fillStyle='#c7a0a8';for(let i=1;i<pts.length-2;i+=2){const k=i/(pts.length-1);ctx.beginPath();ctx.arc(pts[i][0],pts[i][1]+w*(1-k*.8)*.3,Math.max(1,w*(1-k*.8)*.22),0,7);ctx.fill()}
 }
 function curve(x0,y0,cx,cy,x1,y1,n=22){const p=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;p.push([u*u*x0+2*u*t*cx+t*t*x1,u*u*y0+2*u*t*cy+t*t*y1])}return p}
 function street(o){sky(o.sun);hotel();canal(0,o.sun);road();wires(o.sw||0);vend(o.vd||0)}
 /* ---------- 七个画面 ---------- */
 const SHOTS=[
  {dur:5200,sfx:'rumble',cap:()=>Q().text[0],draw:t=>{const k=Math.max(0,1-t/4200),sw=Math.sin(t/60)*k;street({sw,vd:Math.round(Math.sin(t/35)*k*2)});person(200,150,{body:'#30343c'});rain(t,.25);return reduce()?0:sw*2.4}},
  {dur:6200,sfx:'street',cap:()=>Q().text[1],draw:t=>{street({});const x=110+t/40;person(x,152,{body:'#2f3640',umb:'#2c3e50'});person(250,156,{body:'#7a6a8a',hair:'#bbb',broom:true});rain(t,.25);
   if(t>600){ctx.fillStyle='#f4f1e6';ctx.fillRect(x-30,108,64,16);ctx.fillStyle='#222';ctx.font='7px monospace';ctx.fillText('あ、揺れてる。',x-26,119)}return 0}},
  {dur:6400,sfx:'rise',cap:()=>Q().text[2],draw:t=>{street({});const lvl=Math.min(1,t/5200);
   const top=118-lvl*68;ctx.fillStyle='rgba(78,118,134,.82)';ctx.fillRect(0,top,W,H-top);for(let i=0;i<10;i++)R((i*37+t/30)%W,top+2+(i%3)*5,14,1,'#a8c6d0');
   const sub=Math.max(0,(lvl*68-2));person(90+t/60,152,{umb:'#3b4a5c',sub});person(210-t/80,156,{umb:'#5a3b3b',body:'#46404a',sub});person(260,154,{umb:'#2f5a4a',sub});rain(t,.25);return 0}},
  {dur:7600,sfx:'water',cap:()=>t1()>4200?Q().text[4]:Q().text[3],draw:t=>{street({});ctx.fillStyle='rgba(78,118,134,.82)';ctx.fillRect(0,50,W,130);
   ctx.fillStyle='rgba(10,14,20,.55)';ctx.beginPath();ctx.ellipse(250,120,70+Math.sin(t/300)*6,22,0,0,7);ctx.fill();
   person(110,152,{umb:'#3b4a5c',sub:66});person(150,156,{umb:'#5a3b3b',sub:66});person(70,154,{umb:'#2f5a4a',sub:66});
   const g=Math.min(1,t/3000),bend=t>4200?Math.min(1,(t-4200)/2400):0;
   const pts=curve(260,150,240-g*40,20-g*10,120-g*20+bend*90,40+bend*70);tentacle(pts,18,'#2e2430');
   if(bend>.6){ctx.fillStyle='rgba(0,0,0,'+((bend-.6)*1.2)+')';ctx.fillRect(0,0,W,H)}rain(t,.2);return 0}},
  {dur:4800,sfx:'bubbles',cap:()=>'……'+fill('{name}')+'……',jitter:true,draw:t=>{R(0,0,W,H,'#0c1a20');for(let i=0;i<26;i++){const x=(i*53)%W,y=H-((t/8+i*41)%H);ctx.strokeStyle='rgba(160,200,210,.6)';ctx.beginPath();ctx.arc(x+Math.sin(t/200+i)*3,y,1+(i%4),0,7);ctx.stroke()}
   ctx.fillStyle='rgba(30,60,70,.5)';ctx.fillRect(0,0,W,40);return 0}},
  {dur:6600,sfx:'blink',cap:()=>Q().text[5],draw:t=>{if(t<420){R(0,0,W,H,'#000');return 0}street({sun:true});const dry=Math.min(1,(t-420)/6000);
   ctx.fillStyle='rgba(40,52,58,'+(.75*(1-dry))+')';ctx.beginPath();ctx.moveTo(200,118);ctx.bezierCurveTo(190,140,170,150,160,180);ctx.lineTo(180,180);ctx.bezierCurveTo(186,152,206,140,216,118);ctx.fill();
   const x=60+(t-420)/22;person(x,166,{body:'#3a3440'});return 0}},
  {dur:5600,sfx:'tv',cap:()=>Q().text[6],draw:t=>{R(0,0,W,H,'#e9e4d6');R(0,120,W,60,'#c9c2ae');for(let i=0;i<6;i++)R(10+i*52,128,40,30,['#d9534f','#5bc0de','#f0ad4e','#5cb85c','#e9e4d6','#d9534f'][i]);
   R(96,18,128,84,'#222');R(102,24,116,66,'#2d4f7a');R(102,74,116,16,'#c0392b');ctx.fillStyle='#fff';ctx.font='7px monospace';ctx.fillText('地震情報',108,36);ctx.fillText('津波の心配はありません',108,84);
   for(let i=0;i<3;i++)R(110+i*30,44,22,16,'#466e9e');return 0}}
 ];
 let cur=0;const t1=()=>performance.now()-t0;
 function caption(){const s=SHOTS[idx],c=s.cap(),el=root.querySelector('.v52q-cap');
  if(typeof c==='string'){el.innerHTML='<p'+(s.jitter?' class="v52q-jit"':'')+'>'+esc(c)+'</p>';return}
  el.innerHTML=(c.text?'<p>'+esc(c.text)+'</p>':'')+(c.jp?'<p lang="ja" class="v52q-jp">'+esc(c.jp)+'</p>':'')+(c.zh?'<p class="v52q-zh">（'+esc(c.zh)+'）</p>':'');
 }
 let lastCap='';
 function frame(){
  const s=SHOTS[idx],t=t1();ctx.save();const shake=s.draw(Math.min(t,s.dur));ctx.restore();
  if(shake)cv.style.transform='translate('+(shake*(Math.random()-.5)*2).toFixed(1)+'px,'+(shake*(Math.random()-.5)).toFixed(1)+'px)';else cv.style.transform='';
  const c=JSON.stringify(s.cap());if(c!==lastCap){lastCap=c;caption()}
  if(t>=s.dur){next();return}
  raf=requestAnimationFrame(frame);
 }
 function next(){cancelAnimationFrame(raf);idx++;if(idx>=SHOTS.length){finish();return}start()}
 function start(){t0=performance.now();lastCap='';try{SFX[SHOTS[idx].sfx]?.()}catch(e){}raf=requestAnimationFrame(frame)}
 function finish(){
  cancelAnimationFrame(raf);root?.remove();root=null;document.body.classList.remove('v52q-on');
  const v=campaign.v52??={};v.quakeDay=campaign.day;
  try{FILES.addAnomaly('v52-quake','地震时的目击','北品川')}catch(e){}
  GS.change({san:-Q().san},'北品川 · 地震时的目击');campaignSave();
  const cb=done;done=null;cb&&cb();
 }
 function play(cb){
  done=cb;idx=0;
  root=document.createElement('div');root.className='v52-overlay v52q';root.setAttribute('role','dialog');root.setAttribute('aria-label','北品川 · 余震');
  root.innerHTML='<div class="v52q-frame"><canvas width="'+W+'" height="'+H+'"></canvas><div class="v52q-cap" aria-live="polite"></div><button type="button" class="v52q-skip">跳过 ⏭</button></div>';
  document.body.appendChild(root);document.body.classList.add('v52q-on');
  cv=root.querySelector('canvas');ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  root.querySelector('.v52q-skip').onclick=e=>{e.stopPropagation();idx=SHOTS.length-1;next()};
  root.onclick=()=>{if(t1()>900)next()};
  start();
 }
 /* DAY 3（浸蚀 Ⅰ 开始的那天）第一次走出酒店：打开地图之前 */
 function due(){
  if(!campaign||!campaign.firstDayComplete||campaign.v51?.death)return false;
  const v=campaign.v52||{};if(v.quakeDay)return false;
  return campaign.day===GAME_CONFIG.v52.erosion.stages[0].fromDay&&!(window.H18&&H18.active());
 }
 function install(){
  const base=tokyoHome;
  tokyoHome=function(){if(due()&&!root){const self=this,args=arguments;play(()=>base.apply(self,args));return}return base.apply(this,arguments)};
  if(window.PERIL){const m=PERIL.maybe;PERIL.maybe=function(){if(campaign?.v52?.quakeDay===campaign?.day)return false;return m.apply(this,arguments)}}
 }
 return {install,play,due};
})();
window.QUAKE=QUAKE;

