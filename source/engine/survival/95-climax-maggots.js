/* ==== engine/survival/95-climax-maggots.js ==== */
/* ===================================================================
   【v22 第一章 · 第二次高潮：白色的蛆虫】
   207 门底下爬出一条白色的蛆虫 → 越来越多 → 爬满走廊和画面边框 →
   越过画面，盖住对话框和按钮 → 铺满整个屏幕、蠕动 → 突然切黑。
   不解释、不加字幕；结束后没有奖励、扣血或任务提示。
   时长等数值：config/game.json 的 chapter1.climax2。
   「设置 → 异常效果：关闭」的玩家看到减弱版（速度慢、不抖动）。
   结束后的「第三天早上」（安静的过渡）也在这里：剧情节点写在 story/chapter1/nodes/06-day2-evening.json。
   =================================================================== */
const MAGGOT=(function(){
 const CFG=()=>(GAME_CONFIG.chapter1||{}).climax2||{};
 let floor=null,root=null,cv=null,g=null,raf=0,worms=[],t0=0,last=0,stageNo=0,onDone=null,crawlT=0,reduced=false,box=null,src=null,cover=0;
 const PX=3; // 画面按 3 倍像素放大（像素风）
 function stages(){const s=CFG().stagesMs||[1500,3500,4000,4000,4000,4000];const k=reduced?(CFG().reducedSlow||1.6):1;let acc=0;return s.map(x=>acc+=x*k)}
 function active(){return !!root}
 /* 一条蛆虫：白色、分节、头部略暗，身体像波一样蠕动 */
 function spawn(x,y,ang){worms.push({x,y,a:ang==null?Math.random()*6.28:ang,v:(CFG().speed||0.016)*(reduced?0.6:1)*(0.6+Math.random()*0.8),len:3+Math.floor(Math.random()*3),ph:Math.random()*6.28,turn:(Math.random()-.5)*0.004})}
 function drawWorm(w,now){
  const ca=Math.cos(w.a),sa=Math.sin(w.a);
  for(let i=w.len-1;i>=0;i--){const wig=Math.sin(now/(reduced?260:170)+w.ph+i*0.9)*(i/ w.len)*1.3;const x=w.x-ca*i*1.1-sa*wig*.6,y=w.y-sa*i*1.1+ca*wig*.6;
   g.fillStyle=i===0?'#b9ad94':i%2?'#efe7d4':'#e2d8c2';g.fillRect(x|0,y|0,2,2)}
 }
 function frame(ts){
  if(!root)return;raf=requestAnimationFrame(frame);
  const now=ts,el=now-t0,dt=Math.min(50,now-(last||now));last=now;const S=stages();
  stageNo=el<S[0]?1:el<S[1]?2:el<S[2]?3:el<S[3]?4:el<S[4]?5:6;
  if(el>=S[5]){black();return}
  const W=cv.width,Hh=cv.height,b=stageNo<=3&&floor?floor:box; // 第 2～3 阶段：只在走廊的地毯上爬
  /* 生成 */
  if(stageNo===2&&worms.length<1)spawn(src.x,src.y,-Math.PI/2+(Math.random()-.5));
  if(stageNo===3&&Math.random()<dt/(reduced?520:330))spawn(src.x+(Math.random()-.5)*6,src.y,-Math.PI/2+(Math.random()-.5)*1.6);
  if(stageNo===4){for(let i=0;i<dt/(reduced?40:22);i++){const o=worms[Math.floor(Math.random()*worms.length)]||src;spawn(o.x+(Math.random()-.5)*8,o.y+(Math.random()-.5)*8)}}
  if(stageNo===5){for(let i=0;i<dt/(reduced?14:7);i++){const edge=Math.random();const x=edge<.5?b.x+Math.random()*b.w:(edge<.75?b.x:b.x+b.w),y=edge<.25?b.y:edge<.5?b.y+b.h:b.y+Math.random()*b.h;spawn(x,y)}for(let i=0;i<dt/(reduced?30:15);i++)spawn(Math.random()*W,Math.random()*Hh)}
  if(stageNo===6){for(let i=0;i<dt/(reduced?5:2.5);i++)spawn(Math.random()*W,Math.random()*Hh);cover=Math.min(1,cover+dt/((S[5]-S[4])*0.8))}
  if(worms.length>(CFG().maxWorms||2600))worms.splice(0,worms.length-(CFG().maxWorms||2600));
  /* 移动：第 2～4 阶段关在画面（走廊）里，第 5 阶段起越过画面 */
  const clip=stageNo<=4,mult=[0,0,.35,.6,1,1,1][stageNo]; // 一开始爬得很慢
  for(const w of worms){w.a+=w.turn*dt+Math.sin(now/600+w.ph)*0.002*dt;w.x+=Math.cos(w.a)*w.v*mult*dt;w.y+=Math.sin(w.a)*w.v*mult*dt;
   if(clip){if(w.x<b.x||w.x>b.x+b.w){w.a=Math.PI-w.a;w.x=Math.max(b.x,Math.min(b.x+b.w,w.x))}if(w.y<b.y||w.y>b.y+b.h){w.a=-w.a;w.y=Math.max(b.y,Math.min(b.y+b.h,w.y))}}
   else{if(w.x<0||w.x>W)w.a=Math.PI-w.a;if(w.y<0||w.y>Hh)w.a=-w.a}}
  /* 绘制 */
  g.clearRect(0,0,W,Hh);
  if(clip){g.save();g.beginPath();g.rect(b.x,b.y,b.w,b.h);g.clip()}
  if(cover>0){g.fillStyle='rgba(214,204,182,'+(cover*0.92).toFixed(3)+')';g.fillRect(0,0,W,Hh)}
  for(const w of worms)drawWorm(w,now);
  if(clip)g.restore();
  if(!reduced&&stageNo===6){root.style.transform='translate('+((Math.random()-.5)*2).toFixed(1)+'px,'+((Math.random()-.5)*2).toFixed(1)+'px)'}
  /* 声音：越来越密的、湿的窸窣声 */
  crawlT-=dt;if(stageNo>=2&&crawlT<=0){if(window.AUDIO)AUDIO.sfx('crawl');crawlT=[0,0,900,520,300,170,110][stageNo]*(reduced?1.4:1)}
 }
 function black(){
  cancelAnimationFrame(raf);root.style.transform='';g.fillStyle='#000';g.fillRect(0,0,cv.width,cv.height);root.classList.add('mg-black');
  if(window.AUDIO)AUDIO.ambience('none');
  const C1=(GAME_DATA.story.chapter1||{}).chapter||{};
  /* 切黑 → 虫群的声音停止 → 短暂安静 → 黑暗中出现标题（首次揭题） */
  setTimeout(()=>{if(!root)return;const f=onDone;if(!C1.titleCard){close();if(f)f();return}
   titleIn(root,C1.titleCard,false,()=>{close();if(f)f()});
   if(campaign){campaign.ch1TitleSeen=true;campaignSave()}},CFG().blackMs||2200);
 }
 /* 黑底上的一行字。点一下（或按空格）继续；calm=结尾那一次，没有任何失真 */
 function titleIn(host,text,calm,done){
  const t=document.createElement('div');t.className='mg-title'+(calm?' calm':'');t.innerHTML='<p>'+esc(text)+'</p><small hidden>▶</small>';host.appendChild(t);host.style.pointerEvents='auto';
  requestAnimationFrame(()=>t.classList.add('on'));
  let ready=false,gone=false;const go=()=>{if(!ready||gone)return;gone=true;document.removeEventListener('keydown',key,true);t.remove();done()};
  const key=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();go()}};
  setTimeout(()=>{ready=true;const sm=t.querySelector('small');if(sm)sm.hidden=false},CFG().titleHoldMs||3500);
  t.onclick=go;document.addEventListener('keydown',key,true);
 }
 function titleCard(text,calm,done){
  const h=document.createElement('div');h.className='mg-root mg-black'+(calm?' mg-calm':'');document.body.appendChild(h);document.body.classList.add('mg-on');
  titleIn(h,text,calm,()=>{h.remove();document.body.classList.remove('mg-on');done&&done()});
 }
 /* 第三次高潮：切黑，黑幕上只剩对话框（电话） */
 function dark(on){
  let d=document.getElementById('mg-dark');
  DM.clearHistory(); // 黑暗前后不能「返回」（对话框换了位置）
  if(on){if(!d){d=document.createElement('div');d.id='mg-dark';d.className='mg-dark';d.innerHTML='<div id="mg-dark-dlg" class="adv-box" hidden aria-live="polite"></div>';document.body.appendChild(d);document.body.classList.add('mg-on')}if(window.AUDIO)AUDIO.ambience('none')}
  else if(d){DM.close();d.remove();document.body.classList.remove('mg-on');if(window.AUDIO)AUDIO.ambience('scene')}
 }
 /* 少量蛆虫：画在调查场景的画布上面（不盖住界面，不铺满） */
 function few(base,o){
  const host=base&&base.parentNode;if(!host||host.querySelector('.mg-few'))return;const c=document.createElement('canvas');c.className='mg-few';c.width=256;c.height=176;host.appendChild(c);
  const x=c.getContext('2d'),sx=(o.src||[5,3])[0]*16+8,sy=(o.src||[5,3])[1]*16+14,W=[];let lt=0;
  for(let i=0;i<(o.n||5);i++)W.push({x:sx+(Math.random()-.5)*8,y:sy,a:Math.PI/2+(Math.random()-.5)*1.4,v:0.004+Math.random()*0.004,len:3+(i%3),ph:Math.random()*6,d:i*700});
  const loop=ts=>{if(!document.body.contains(c))return;const dt=Math.min(50,ts-(lt||ts));lt=ts;x.clearRect(0,0,256,176);
   for(const w of W){if((w.d-=dt)>0)continue;w.a+=Math.sin(ts/700+w.ph)*0.0015*dt;w.x+=Math.cos(w.a)*w.v*dt;w.y+=Math.sin(w.a)*w.v*dt;
    for(let i=w.len-1;i>=0;i--){const wig=Math.sin(ts/260+w.ph+i)*.5;x.fillStyle=i===0?'#b9ad94':'#efe7d4';x.fillRect((w.x-Math.cos(w.a)*i*1.1-Math.sin(w.a)*wig)|0,(w.y-Math.sin(w.a)*i*1.1+Math.cos(w.a)*wig)|0,2,2)}}
   requestAnimationFrame(loop)};requestAnimationFrame(loop);
 }
 /* 结尾：一件普通的东西（地图画面 + 一句话）→ 标题再出现一次 */
 function closing(def,done){
  const C1=(GAME_DATA.story.chapter1||{}).chapter||{};UI.scene('story',()=>closing(def,done));if(window.AUDIO)AUDIO.ambience(def.ambience||'lobby');
  app.innerHTML=`<div class="rpg-shell h18-shell"><section class="rpg-panel h18-panel mg-closing"><div class="h18-stage"><canvas id="mg-closing" width="512" height="352" aria-hidden="true" style="width:100%;height:auto;display:block;image-rendering:pixelated"></canvas></div><p class="mg-closing-text">${esc(def.text||'')}</p><button type="button" class="story-btn" id="mg-closing-next">▶</button></section></div>`;
  window.scrollTo(0,0);const c=document.getElementById('mg-closing');if(window.H18)H18.drawMap(c,def.map||'lobby');
  const x=c.getContext('2d');x.fillStyle='rgba(255,236,200,.08)';x.fillRect(0,0,c.width,c.height);
  app.querySelector('#mg-closing-next').onclick=()=>{if(window.AUDIO)AUDIO.ambience('none');titleCard(C1.titleCard||'',true,done)};
 }
 function close(){cancelAnimationFrame(raf);if(root)root.remove();root=null;worms=[];document.body.classList.remove('mg-on')}
 /* opts.stage：像素地图的画布（用来找 207 的门底）；opts.door：门所在的格子 [x,y] */
 function play(opts,done){
  close();onDone=done;reduced=!SETTINGS.get('anomalies');
  root=document.createElement('div');root.id='mg-root';root.className='mg-root';root.setAttribute('aria-hidden','true');
  root.innerHTML='<canvas id="mg-canvas"></canvas>';document.body.appendChild(root);document.body.classList.add('mg-on');
  cv=root.querySelector('canvas');cv.width=Math.ceil(innerWidth/PX);cv.height=Math.ceil(innerHeight/PX);g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const st=opts&&opts.stage,r=st&&st.getBoundingClientRect();
  floor=null;
  if(r&&r.width){box={x:r.left/PX,y:r.top/PX,w:r.width/PX,h:r.height/PX};const d=(opts.door||[5,7]),fl=opts.floor||[1,4,14,3],tx=box.w/16,ty=box.h/11;src={x:box.x+(d[0]+.5)*tx,y:box.y+d[1]*ty};floor={x:box.x+fl[0]*tx,y:box.y+fl[1]*ty,w:fl[2]*tx,h:fl[3]*ty+1}}
  else{box={x:0,y:0,w:cv.width,h:cv.height};src={x:cv.width/2,y:cv.height*0.6}}
  worms=[];cover=0;crawlT=0;stageNo=1;t0=performance.now();last=0;
  if(window.AUDIO)AUDIO.ambience('none'); // 第 1 阶段：音乐慢慢消失
  raf=requestAnimationFrame(frame);
 }
 /* ---------- 第二天（高潮之后）早上：安静的过渡 ---------- */
 function morning(){
  const C=(GAME_DATA.story.chapter1||{}).chapter||{},k=C.climax2||{};
  if(!window.H18||!campaign){tokyoHome();return}
  UI.scene('story',morning);if(window.AUDIO)AUDIO.ambience('corridor');
  app.innerHTML=`<div class="rpg-shell h18-shell"><section class="rpg-panel h18-panel"><div class="h18-top"><div><div class="rpg-kicker">CHAPTER 01 · DAY ${String(campaign.day).padStart(2,'0')} · 朝</div><h1 class="h18-title" lang="ja">ミナトヤホテル品川・2F</h1><small class="pro-zh">港屋酒店品川 · 二楼走廊 · 早上</small></div></div>
   <div class="h18-stage"><canvas id="mg-morning" width="512" height="352" aria-hidden="true" style="width:100%;height:auto;display:block;image-rendering:pixelated"></canvas></div>
   <div id="h18-dlg" class="adv-box" hidden aria-live="polite"></div></section></div>`;
  window.scrollTo(0,0);
  const c=document.getElementById('mg-morning');H18.drawMap(c,'corridor');
  const x=c.getContext('2d'),T=H18.tile,P=k.carpet||[4,6,3];x.fillStyle='#94704d';x.fillRect(P[0]*T,P[1]*T,P[2]*T,T);x.fillStyle='#7b5a3d';for(let i=0;i<4;i++)x.fillRect(P[0]*T,P[1]*T+i*8,P[2]*T,1);x.fillStyle='rgba(255,236,200,.10)';x.fillRect(0,0,c.width,c.height); // 207 门前颜色更新的那一段地板
  H18.play(k.morningNode,()=>{DM.show(document.getElementById('h18-dlg'),{who:'第三天 · 早晨',text:'昨夜那些白色的虫子，直到现在想起来仍让人反胃。酒店里发生的怪事越来越多了。不能只凭几句话就算了——我得再查查这里到底怎么回事。',choices:[{t:'🏨 先留在酒店，与工作人员交谈和查看现场',fn:()=>finish('day')},{t:'🗺 先出门，去东京街区',fn:()=>finish('out')},{t:'☾ 直接等到傍晚，继续夜间调查',fn:()=>finish('night')}]})});
 }
 function finish(mode){const v=H18.state().v;delete v.flags.morningPending;campaignSave();DM.close();if(mode==='day'){if(window.HOTEL_DAY2)HOTEL_DAY2.open();else tokyoHome()}else if(mode==='night'){H18.start()}else{if(window.AUDIO)AUDIO.ambience('map');tokyoHome()}}
 function pending(){const h=campaign&&campaign.hotelCase;return !!(h&&h.v18&&h.v18.flags&&h.v18.flags.morningPending&&!h.ending)}
 return {play,active,morning,pending,stage:()=>stageNo,count:()=>worms.length,close,dark,few,closing,titleCard};
})();
window.MAGGOT=MAGGOT;
/* 读档或刷新时停在「高潮之后的早上」：先把早上的场景放完 */
const mgHome=tokyoHome;
tokyoHome=function(){if(MAGGOT.pending()&&!(campaign.prologue&&campaign.prologue.morning)){MAGGOT.morning();return}mgHome()};
