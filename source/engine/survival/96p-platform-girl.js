/* ==== engine/survival/96p-platform-girl.js ==== */
/* ===================================================================
   【INCIDENT-000《站台上的少女》】机场铁路站台的异常事件（羽田、成田两条开局都有）
   - 触发：两个出生点都会遇到（第一次来到机场铁路站时）。如月车站的提前入口只给「成田 + 及时救回」的玩家。
       羽田：入境之夜第一次来到京急的机场站时（91-prologue.js 第一次进入「station」场景前调用 PGIRL.run）——之后坐电车、打车、坐巴士都一样，每个羽田玩家都会遇到。
       成田：第一天任务第 3 步「成田エクスプレス・ホーム」之前（包装 firstDayQuest）。
   - 10 秒现实时间倒计时（文字和选项全部出现后才开始；切到后台 / 窗口失焦会暂停）。四个选项一直可见。
       A：开选后 3 秒内 → 救回；迟救 → 死亡幻象。B / 超时 → 自身死亡与 BAD END。
       C → 自身死亡幻象；D → 原有急停演出。
   - 存档：campaign.platformGirl = {airport, triggered, done, choice, remainMs, rescued, rescueAttempted, trust,
       kisaragiEarly, feedbackShown, archived, kisaragiOffered, kisaragiVisited}
   - 文字：data/events/platform-girl.json；时间：config/game.json 的 platformGirl；强烈画面：设置里的「强烈画面」。
   - 开发者：PGIRL.dev('narita','A',7000)（直接跑完整个事件，剩余时间按给定的值判定）、PGIRL.simulate('A',6999)（倒计时中直接按给定剩余时间选择）。
   =================================================================== */
/* Pixel shots for the prologue scuffle and Kisaragi encounters. */
const INCIDENT_ART=(()=>{
 const shots=new Set(['kisaragi-platform','kisaragi-grasp','kisaragi-vision','scuffle-grab','scuffle-hit','scuffle-break']);

 function draw(ctx,shot){
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
  const figure=(x,y,coat,skin='#a79284')=>{
   rect(x+4,y,16,15,'#19181d');rect(x+6,y+5,14,14,skin);
   rect(x,y+19,26,30,coat);rect(x+4,y+49,8,18,'#171921');rect(x+15,y+49,8,18,'#171921');
  };

  if(shot.startsWith('scuffle')){
   rect(0,0,320,200,'#272931');rect(0,80,320,120,'#484148');
   for(let x=0;x<320;x+=48)rect(x,0,3,200,'#343138');
   rect(0,13,320,4,'#a59270');rect(0,172,320,4,'#57505a');
   if(shot==='scuffle-grab'){
    figure(88,65,'#666170');figure(193,70,'#3e505c');
    rect(110,88,79,10,'#666170');rect(187,88,15,10,'#b79c80');
    rect(218,131,35,30,'#563e31');rect(230,125,14,6,'#37251c');
   }else if(shot==='scuffle-hit'){
    ctx.beginPath();ctx.moveTo(0,104);ctx.lineTo(320,23);ctx.lineTo(320,158);ctx.lineTo(0,191);ctx.closePath();ctx.fillStyle='#794342';ctx.fill();
    figure(102,57,'#666170');rect(124,83,63,13,'#777081');rect(181,83,17,13,'#ba997d');
    ctx.save();ctx.translate(203,78);ctx.rotate(.32);figure(0,0,'#405763');ctx.restore();
    rect(250,143,36,19,'#664b3b');rect(256,162,5,4,'#1b1a20');
   }else{
    figure(64,73,'#666170');figure(232,73,'#405763');figure(146,60,'#2d5051');
    rect(117,83,30,9,'#2d5051');rect(171,83,31,9,'#2d5051');
    rect(220,141,29,25,'#624434');
   }
  }else if(shot==='kisaragi-platform'||shot==='kisaragi-grasp'){
   rect(0,0,320,200,'#090e16');rect(0,107,320,93,'#272934');rect(0,151,320,3,'#84704a');
   rect(0,155,320,45,'#101018');rect(0,174,320,2,'#534d58');rect(0,194,320,2,'#534d58');
   for(let x=3;x<320;x+=22)rect(x,178,12,10,'#25212a');
   rect(34,40,103,23,'#44473e');rect(36,42,99,19,'#252f29');
   ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#b8c4a4';ctx.fillText('きさらぎ駅',85,55);
   rect(207,29,113,120,'#2e333a');rect(222,38,85,106,'#101118');
   if(shot==='kisaragi-platform'){
    rect(234,49,29,82,'#546b61');rect(270,49,23,82,'#625c54');figure(177,88,'#40525d');
   }else{
    rect(230,46,38,99,'#4a5559');rect(271,46,27,99,'#4a5559');figure(165,104,'#24242b','#6d676e');
    rect(112,107,57,7,'#41424b');rect(102,104,16,12,'#9c9496');
   }
  }else{
   rect(0,0,320,200,'#101018');rect(0,145,320,55,'#343039');
   rect(37,25,246,124,'#353239');rect(48,32,224,111,'#171923');
   rect(58,120,203,18,'#4a3d4b');rect(70,32,2,86,'#746a73');rect(247,32,2,86,'#746a73');
   rect(105,117,111,22,'#373947');rect(201,111,19,14,'#a28b84');
   rect(151,46,22,17,'#242630');rect(148,64,28,43,'#252631');
   rect(127,82,22,6,'#514952');rect(175,82,22,6,'#514952');
   rect(156,57,2,2,'#c5ac93');rect(169,57,2,2,'#c5ac93');
  }
  rect(0,0,320,10,'#09090c');rect(0,190,320,10,'#09090c');
 }

 return {has:shot=>shots.has(shot),draw};
})();

const PGIRL=(function(){
 const D=()=>GAME_DATA.d['events/platform-girl']||{};
 const C=()=>Object.assign({totalMs:10000,rescueWindowMs:3000,startDelayMs:350,feedbackDelayMs:1200,feedbackMs:3200,alarmMs:2000,whisperMs:2000,autoMs:0},GAME_CONFIG.platformGirl||{});
 const CK='tokyo-platform-checkpoint';
 function st(){campaign.platformGirl??={};return campaign.platformGirl}
 function pending(){return !!campaign&&!(campaign.platformGirl&&campaign.platformGirl.done)}
 const save=()=>{if(typeof campaignSave==='function')campaignSave()};
 const soft=()=>SETTINGS.get('gore')==='soft';
 /* ---------- 画面 ---------- */
 const W=320,H=200;let root=null,cv=null,g=null,raf=0,view={},stn={},doneCb=null,airport='haneda';
 const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 function rng(seed){let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647}}
 function person(x,y,body,hair,bag){R(x,y,8,8,'#e2bf9c');R(x-1,y-2,10,4,hair);R(x-2,y+8,12,18,body);R(x,y+26,3,10,'#222');R(x+5,y+26,3,10,'#222');if(bag){R(x+12,y+20,10,14,bag);R(x+15,y+16,4,4,'#555')}}
 function girl(x,y,pose){ // 普通的外套、小包
  R(x,y,8,8,'#edd0b4');R(x-1,y-2,10,4,'#1d1a1c');R(x-1,y,2,9,'#1d1a1c');R(x+7,y,2,9,'#1d1a1c');
  if(pose==='look'){R(x+2,y+3,1,1,'#111');R(x+5,y+3,1,1,'#111')}
  R(x-2,y+8,12,16,'#7a8a9a');R(x+8,y+14,5,6,'#a06a4a');R(x,y+24,3,10,'#3a3a44');R(x+5,y+24,3,10,'#3a3a44');
  if(pose==='phone'){R(x+2,y+10,4,5,'#cfe6ff')}
 }
 function platform(){
  const T=stn.train||['#c8102e','#f2f2f2','#1a1a1a'];
  R(0,0,W,30,'#1e222a');for(let i=0;i<5;i++)R(14+i*64,10,40,4,'#f4f4ea');
  R(0,30,W,62,'#d6d5cc');for(let x=0;x<W;x+=16)R(x,30,1,62,'#c4c3ba');
  R(92,38,136,28,'#1f3358');g.fillStyle='#ffffff';g.font='bold 10px sans-serif';g.textAlign='center';g.fillText(stn.sign||'',160,52);g.font='7px monospace';g.fillText(stn.sub||'',160,62);
  R(0,92,W,58,'#9c9a92');for(let x=0;x<W;x+=20)R(x,92,1,58,'#8f8d86');R(0,140,W,6,'#e0c040');
  R(0,150,W,50,'#141416');R(0,166,W,3,'#777');R(0,188,W,3,'#777');for(let x=0;x<W;x+=14)R(x,170,8,16,'#2a2422');
  if(view.passengers!==false){person(30,104,'#3a4458','#222','#2a5a8a');person(64,106,'#6a5a48','#3a2a1a',null);person(236,104,'#2c2c34','#111','#8a3a3a');person(270,108,'#5a6a5a','#222',null)}
  if(view.girl==='phone'||view.girl==='look')girl(176,106,view.girl);
  if(view.girl==='track')girl(176,156,'look');
  if(view.girl==='pulled')girl(150,112,'look');
  if(view.light>0){const L=view.light,gr=g.createRadialGradient(0,176,4,0,176,40+L*260);gr.addColorStop(0,'rgba(255,250,220,'+(0.5+L*0.5)+')');gr.addColorStop(1,'rgba(255,250,220,0)');g.fillStyle=gr;g.fillRect(0,100,W,100);R(0,170,6+L*20,4,'#fffbe0');R(0,178,6+L*20,4,'#fffbe0')}
  if(view.train==='stopped'||view.train==='pass'){const ox=view.train==='pass'?((performance.now()/2)%W)-W:0;for(const dx of [0,W]){const x=ox+dx;R(x,98,W,86,T[1]);R(x,98,W,10,T[2]);R(x,150,W,8,T[0]);for(let i=0;i<6;i++)R(x+10+i*52,112,34,26,'#2a3a4a');R(x+140,108,26,62,'#c8c8c8')}}
  R(10,124,26,24,'#5a3a2a');R(16,118,14,6,'#3a2a1a');R(10,134,26,2,'#3a2a1a'); // 你的行李箱（左下）
  if(view.suitBlood)splat(14,126,22,18,9,2);
 }
 function splat(x,y,w,h,n,seed){const r=rng(seed*7919+11),col=soft()?'#3a0c0c':'#b00d14',dk=soft()?'#2a0808':'#7a0a0e';const k=soft()?Math.ceil(n/3):n;for(let i=0;i<k;i++){const px=x+r()*w,py=y+r()*h,s=1+Math.floor(r()*(soft()?2:5));R(px,py,s,s,i%3?col:dk);if(!soft()&&r()<0.4)R(px,py+s,1,2+Math.floor(r()*6),col)}}
 function front(){ // 列车车头特写
  const T=stn.train||['#c8102e','#f2f2f2','#1a1a1a'];R(0,0,W,H,'#0d0d10');
  R(40,20,240,180,T[0]);R(40,20,240,14,T[2]);R(70,46,180,62,'#111820');R(158,46,4,62,T[2]);R(60,130,40,18,'#fff7c8');R(220,130,40,18,'#fff7c8');R(40,160,240,8,T[1]);
  splat(60,40,200,120,90,3);splat(70,48,170,56,40,5);
 }
 function head(){ // 落在脚边
  R(0,0,W,H,'#6e6c66');for(let x=0;x<W;x+=24)R(x,0,1,H,'#62605a');R(0,160,W,8,'#c8a830');
  const x=136,y=88;
  if(soft()){R(x,y,48,40,'#151315');R(x-4,y+6,56,30,'#151315');R(x+10,y+40,30,4,'#2a0808');return}
  R(x+6,y+8,36,32,'#e8cdb2');R(x,y,48,14,'#1d1a1c');R(x-2,y+8,8,30,'#1d1a1c');R(x+42,y+8,8,30,'#1d1a1c');
  R(x+12,y+20,8,5,'#f4f4f4');R(x+28,y+20,8,5,'#f4f4f4');R(x+15,y+21,3,3,'#101010');R(x+31,y+21,3,3,'#101010'); // 睁着的眼睛，看向你
  R(x+20,y+32,8,1,'#8a4a4a');R(x+4,y+40,40,6,'#8a0a10');splat(x-20,y+30,90,30,30,9);
 }
 function closeLook(){R(0,0,W,H,'#0a0a0c');const gr=g.createRadialGradient(0,150,10,0,150,340);gr.addColorStop(0,'rgba(255,250,220,.95)');gr.addColorStop(1,'rgba(255,250,220,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  const x=120,y=50;R(x+8,y+8,64,60,'#edd0b4');R(x,y,80,20,'#1d1a1c');R(x-2,y+12,12,60,'#1d1a1c');R(x+72,y+12,12,60,'#1d1a1c');R(x+22,y+34,10,6,'#f4f4f4');R(x+48,y+34,10,6,'#f4f4f4');R(x+25,y+35,4,4,'#101010');R(x+51,y+35,4,4,'#101010')}
 function interior(){R(0,0,W,H,'#2a2c34');for(let i=0;i<4;i++){R(10+i*78,30,60,44,view.kisaragiDark?'#05060a':'#0d1420')}R(0,120,W,30,'#3a4a6a');R(0,150,W,50,'#5a5a60');
  const n=view.riders??4;for(let i=0;i<n;i++)person(30+i*70,96,'#3a3a44','#222',null);
  if(view.sign){R(70,60,180,60,'#e8e8e0');R(70,60,180,10,'#1d4a2a');g.fillStyle='#111';g.font='bold 22px serif';g.textAlign='center';g.fillText(D().kisaragi&&D().kisaragi.station||'',160,102)}}
 function draw(){if(!g)return;g.clearRect(0,0,W,H);const m=view.mode;
  if(INCIDENT_ART.has(m))INCIDENT_ART.draw(g,m);else if(m==='platform')platform();else if(m==='front')front();else if(m==='head')head();else if(m==='close')closeLook();else if(m==='interior')interior();else R(0,0,W,H,'#000');
  if(view.flash){R(0,0,W,H,'rgba(255,255,255,'+view.flash+')')}
  raf=requestAnimationFrame(draw)}
 /* ---------- 文字 ---------- */
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function lineParts(l){if(typeof l==='string')return {text:l};return l}
 function say(l){return new Promise(res=>{const p=lineParts(l),box=root.querySelector('.pg-box');
  const zh=p.zh?(typeof langMode==='function'&&langMode()==='learning'?trToggle(p.zh):`<small>${esc(p.zh)}</small>`):'';
  box.innerHTML=`${p.who?`<b class="pg-who">${esc(p.who)}</b>`:''}${p.text?`<p>${esc(p.text).replace(/\n/g,'<br>')}</p>`:''}${p.jp?`<p class="pg-jp" lang="ja" translate="no">「${esc(p.jp)}」${zh}</p>`:''}<span class="pg-next">▶</span>`;box.hidden=false;
  if(p.sfx&&window.AUDIO)AUDIO.sfx(p.sfx);
  let ok=false;const go=e=>{if(e&&e.target&&e.target.closest&&e.target.closest('.tr-btn'))return;if(e&&e.type==='keydown'&&!['Enter',' '].includes(e.key))return;if(ok)return;ok=true;box.onclick=null;document.removeEventListener('keydown',go);box.hidden=true;res()};
  const a=C().autoMs;if(a>0)setTimeout(go,a);else setTimeout(()=>{if(!ok){box.onclick=go;document.addEventListener('keydown',go)}},200)})}
 async function act(name){
  if(INCIDENT_ART.has(name)){view.mode=name;root.dataset.shot=name;return}
  switch(name){
   case 'kisaragi-back':view={mode:'interior',riders:0};delete root.dataset.shot;break;
   case 'look':view.girl='look';break;
   case 'jump':view.girl='track';break;
   case 'light':view.light=0.15;break;
   case 'pull':view.girl='pulled';view.light=0.8;break;
   case 'pass':view.girl='none';view.light=0;view.train='pass';break;
   case 'silence':if(window.AUDIO)AUDIO.ambience('none');view.mode='black';delete root.dataset.shot;break;
   case 'black':view.mode='black';break;
   case 'restore':view={mode:'platform',girl:'none',light:0,train:'none'};break;
   case 'restoreTrain':view={mode:'platform',girl:'none',light:0,train:'stopped'};break;
   case 'closeLook':view.mode='close';break;
   case 'arrive':view.light=1;if(window.AUDIO)AUDIO.sfx('train');break;
   case 'impactGirl':case 'impactBoth':if(window.AUDIO)AUDIO.sfx('impact');view.girl='none';view.flash=0.9;await wait(120);view.flash=0;view.mode='front';if(name==='impactBoth'){await wait(250);await alarm()}else setTimeout(()=>{if(root&&window.AUDIO)AUDIO.sfx('alarm')},300);break; // 警报在撞击之后
   case 'front':view.mode='front';break;
   case 'suitcase':view={mode:'platform',girl:'none',light:0,train:'stopped',passengers:false,suitBlood:true};break;
   case 'drop':if(window.AUDIO)AUDIO.sfx('bump');break;
   case 'head':view.mode='head';break;
  }
 }
 async function alarm(){if(window.AUDIO)AUDIO.sfx('alarm');await wait(C().alarmMs)}
 async function lines(list){for(const l of list||[]){const p=lineParts(l);if(p.act)await act(p.act);if(p.text||p.jp)await say(p)}}
 /* ---------- 倒计时 ---------- */
 let timer=null,endingCampaign=null;
 function countdown(){return new Promise(res=>{
  const box=root.querySelector('.pg-timer'),ch=D().choices||[],total=C().totalMs;
  box.innerHTML=`<div class="pg-tlabel">${esc(D().timerLabel||'')} <b class="pg-sec">${(total/1000).toFixed(1)}</b> 秒</div><div class="pg-bar"><i></i></div><p class="pg-paused" hidden>${esc(D().pausedLabel||'')}</p><div class="pg-ch">${ch.map(c=>`<button type="button" class="survival-btn pg-opt" data-pg="${c.id}">${esc(c.text)}</button>`).join('')}</div>`;
  let elapsed=0,last=null,running=false,paused=false,ended=false;
  const rem=now=>Math.max(0,total-(elapsed+(running&&!paused&&last!=null?now-last:0)));
  const end=(choice,ms)=>{if(ended)return;ended=true;running=false;cleanup();box.hidden=true;res({choice,remainMs:ms})};
  const sec=box.querySelector('.pg-sec'),bar=box.querySelector('.pg-bar i'),pz=box.querySelector('.pg-paused');
  let lastBeat=0;
  const tick=now=>{if(ended)return;const r=rem(now);sec.textContent=(Math.ceil(r/100)/10).toFixed(1);bar.style.width=(r/total*100)+'%';view.light=0.15+0.85*(1-r/total);
   if(running&&!paused&&now-lastBeat>1000){lastBeat=now;if(window.AUDIO)AUDIO.sfx('heartbeat')}
   if(r<=0){end('T',0);return}timer=requestAnimationFrame(tick)};
  const pause=()=>{if(!running||paused)return;elapsed+=performance.now()-last;paused=true;pz.hidden=false};
  const resume=()=>{if(!running||!paused||document.hidden)return;paused=false;last=performance.now();pz.hidden=true};
  const onVis=()=>{if(document.hidden)pause();else resume()};
  window.addEventListener('blur',pause);window.addEventListener('focus',resume);document.addEventListener('visibilitychange',onVis);
  function cleanup(){cancelAnimationFrame(timer);window.removeEventListener('blur',pause);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',onVis);PGIRL._sim=null}
  box.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{if(!running||paused)return;const left=rem(performance.now());end(left>0?b.dataset.pg:'T',left)});
  PGIRL._sim=(choice,ms)=>end(choice,ms);
  /* 文字和选项全部出现以后，才开始计时 */
  setTimeout(()=>{if(ended)return;running=true;last=performance.now();box.hidden=false;if(document.hidden)pause();if(window.AUDIO)AUDIO.sfx('train');timer=requestAnimationFrame(tick)},C().startDelayMs);
 })}
 /* ---------- 流程 ---------- */
 function mount(){
  if(root)root.remove();cancelAnimationFrame(raf);if(window.DM&&DM.isOpen&&DM.isOpen())DM.close();
  root=document.createElement('div');root.className='pg-root';root.setAttribute('role','dialog');root.setAttribute('aria-label','站台');
  root.innerHTML=`<div class="pg-stage"><canvas width="${W}" height="${H}" aria-hidden="true"></canvas></div><div class="pg-box" hidden></div><div class="pg-timer" hidden></div><div class="pg-fb" hidden></div><div class="pg-end" hidden></div>`;
  document.body.appendChild(root);document.body.classList.add('pg-on');cv=root.querySelector('canvas');g=cv.getContext('2d');g.imageSmoothingEnabled=false;raf=requestAnimationFrame(draw);
 }
 function unmount(){endingCampaign=null;PGIRL._k=null;cancelAnimationFrame(raf);cancelAnimationFrame(timer);if(root)root.remove();root=null;g=null;document.body.classList.remove('pg-on')}
 function record(choice,rescued){
  const s=st(),obs={A:rescued?'rescued':'lateRescue',C:'staff',D:'brake'}[choice];
  const outcome=rescued?'rescued':choice==='D'?'girlDied':'vision';
  const observations=rescued?[]:[outcome==='vision'?'deathVision':'girlDied'];
  if(window.EXPLORE&&!s.archived){EXPLORE.apply({kaidan:{id:'platform',see:['seen',airport,obs,...observations],status:'seen',outcome,silent:true}});s.archived=true}
 }
 async function run(ap,done){
  if(!campaign){done&&done();return}
  airport=ap==='narita'?'narita':'haneda';doneCb=done;stn=(D().stations||{})[airport]||{};
  try{localStorage.setItem(CK,JSON.stringify(campaign))}catch(e){} // 检查点：事件开始之前（不覆盖存档栏位）
  const s=st();s.airport=airport;s.triggered=true;
  mount();view={mode:'platform',girl:'phone',light:0,train:'none'};if(window.AUDIO)AUDIO.ambience('train');
  await lines(D().intro);
  return decide(await countdown());
 }
 async function decide(r){
  const s=st();
  s.choice=r.choice;s.remainMs=Math.round(r.remainMs);
  if(r.choice==='A')s.rescueAttempted=true;
  if(r.choice==='A'&&r.remainMs>0&&C().totalMs-r.remainMs<=C().rescueWindowMs){
   const first=!s.rescued;s.rescued=true;if(first)s.trust=(s.trust||0)+1; // 只在第一次有效救援时 +1
   if(airport==='narita')s.kisaragiEarly=true;
   await lines(D().rescue);
   s.done=true;record('A',true);save();
   await wait(C().feedbackDelayMs);
   if(!s.feedbackShown){const fb=root.querySelector('.pg-fb'),F=D().feedback||{};fb.innerHTML=`<small>${esc(F.kicker||'')}</small><b>${esc(F.text||'')}</b>`;fb.hidden=false;s.feedbackShown=true;save();await wait(C().feedbackMs);fb.hidden=true}
   return finish();
  }
  const story=D();
  if(r.choice==='B'||r.choice==='T')endingCampaign=campaign;
  await lines(r.choice==='A'?story.late:r.choice==='B'?story.noRescue:story.pre?.[r.choice]);
  if(r.choice==='D')await lines(story.death);
  else if(r.choice!=='A')await lines(story.selfDeath);
  if(r.choice==='B'||r.choice==='T')return badEnd('inaction',story.inactionEnd);
  if(r.choice==='A'||r.choice==='C')await lines(story.visionReturn);
  await lines(story.restore);
  s.done=true;record(r.choice,false);save();
  return finish();
 }
 async function badEnd(reason,E){
  view.mode='black';if(window.AUDIO)AUDIO.ambience('none');
  const end=root.querySelector('.pg-end');
  end.innerHTML=`<p class="pg-whisper">${esc(E.whisper||'')}</p>`;end.hidden=false;await wait(C().whisperMs);
  end.innerHTML=`<h1>${esc(E.title||'')}</h1><p>${esc(E.text||'')}</p><button type="button" class="survival-btn" id="pg-retry">${esc(E.retry||'')}</button>`;
  root.dataset.badEnd=reason;
  end.querySelector('#pg-retry').onclick=retry;
 }
 function finish(){const cb=doneCb;doneCb=null;const end=root&&root.querySelector('.pg-end');
  if(C().autoMs>0||!end){unmount();cb&&cb();return}
  end.innerHTML=`<button type="button" class="survival-btn" id="pg-go">${esc(D().continue||'▶')}</button>`;end.hidden=false;end.classList.add('pg-go');
  end.querySelector('#pg-go').onclick=()=>{unmount();cb&&cb()}}
 /* BAD END 后恢复站台事件前的存档。 */
 function retry(){let snap=null;try{snap=JSON.parse(localStorage.getItem(CK)||'null')}catch(e){}if(snap){campaign=snap;save()}const cb=doneCb;unmount();run(airport,cb)}
 /* ---------- 如月车站与序章冲突 ---------- */
 function kisaragiPick(options){
  return new Promise(resolve=>{
   const box=root.querySelector('.pg-timer');
   box.innerHTML='<div class="pg-ch">'+options.map(([id,label])=>'<button type="button" class="survival-btn pg-opt" data-k="'+id+'">'+label+'</button>').join('')+'</div>';
   const pick=id=>{if(!options.some(([key])=>key===id))return;box.hidden=true;PGIRL._k=null;resolve(id)};
   box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>pick(b.dataset.k));
   PGIRL._k=pick;box.hidden=false;
  });
 }
 function kisaragiPenalty(){
  const penalty=C().kisaragiPenalty;
  return GS.change({hp:-Math.min(-penalty.hp,Math.max(0,campaign.hp-1)),
   stress:Math.min(penalty.stress,Math.max(0,GAME_CONFIG.player.maxStress-1-campaign.stress))});
 }
 async function kisaragi(done,trainEvent){
  const early=!trainEvent,K=D().kisaragi;
  if(early){st().kisaragiOffered=true;save()}
  mount();root.setAttribute('aria-label','如月车站');view={mode:'interior',riders:4};
  if(window.AUDIO)AUDIO.ambience('train');
  if(early){
   await say(K.prompt);
   const stay='<span lang="ja">'+esc(K.stay.jp)+'</span><small>'+esc(K.stay.zh)+'</small>';
   if(await kisaragiPick([['stay',stay],['leave',esc(K.leave)]])==='leave'){unmount();done?.();return}
   for(const [i,line] of K.ride.entries()){
    view.riders=Math.max(0,3-i);view.kisaragiDark=i>=3;await say(line);
   }
   st().kisaragiVisited=true;save();
   view.sign=true;view.riders=1;if(window.AUDIO)AUDIO.sfx('glitch');await say(K.board);
  }else{
   view={mode:'interior',riders:1,kisaragiDark:true};
   await say({who:trainEvent.who,jp:trainEvent.jp,text:trainEvent.text});
  }
  const pick=await kisaragiPick([['get-off',esc(K.getOff)],['ask',esc(K.ask)],['stay-aboard',esc(K.stayAboard)]]);
  if(pick==='get-off'){
   return V51.die('death_v51_kisaragi',async()=>{await lines(K.death);unmount()});
  }
  if(pick==='ask'){
   const result=kisaragiPenalty();
   await lines(K.vision);
   if(result)await say({who:'回过神来',text:result});
  }
  if(early){view.mode='black';await lines(K.placeholder)}
  else await say(TRAVEL.events.nodes.find(node=>node.id==='tr-kisaragi-ok').text);
  unmount();done?.();
 }
 function resumeKisaragi(){
  if(!campaign.firstDayComplete){kisaragi(()=>firstDayQuest());return}
  const node=TRAVEL.events.nodes.find(node=>node.id==='tr-kisaragi');
  kisaragi(()=>enterDistrict(TRAVEL.where()),node);
 }
 async function scuffle(){
  mount();root.setAttribute('aria-label','路人冲突');
  await lines(D().scuffle);unmount();
 }
 /* ---------- 开发者测试 ---------- */
 async function dev(ap,choice,remainMs,done){if(!campaign)return;const s=st();delete s.done;const p=run(ap,done||(()=>{}));
  for(let i=0;i<200&&!PGIRL._sim;i++)await wait(20);if(PGIRL._sim)PGIRL._sim(choice,remainMs==null?C().totalMs:remainMs);return p}
 /* 测试用：其他测试不关心这个事件时，先把它标记为已经发生过 */
 function skipForTest(){if(campaign){st().done=true;st().skipped=true;save()}}
 return {skipForTest,run,pending,state:()=>campaign&&campaign.platformGirl,kisaragi,resumeKisaragi,scuffle,retry,dev,simulate:(c,ms)=>PGIRL._sim&&PGIRL._sim(c,ms),active:()=>!!root,deathPending:()=>!!root&&endingCampaign===campaign,_sim:null,_k:null};
})();
window.PGIRL=PGIRL;
/* ---------- 成田：第一天任务第 3 步（站台）之前触发；坐上 N'EX 以后，救回过她的话出现「再乘一会儿」 ---------- */
(function(){
 const baseFDQ=firstDayQuest;
 firstDayQuest=function(){
  if(campaign&&campaign.birth==='narita'&&campaign.day===1&&!campaign.firstDayComplete){
   const step=campaign.firstDayStep||0,s=campaign.platformGirl||{};
   if(step===2&&PGIRL.pending()){PGIRL.run('narita',()=>firstDayQuest());return}
   if(step===3&&s.kisaragiEarly&&!s.kisaragiOffered){PGIRL.kisaragi(()=>firstDayQuest());return}
  }
  return baseFDQ.apply(this,arguments);
 };
})();
