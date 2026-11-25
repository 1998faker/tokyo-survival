/* ==== engine/survival/97t-inv-tutorial.js ==== */
/* ===================================================================
   【推理教学】v36：透明雨伞共享计划（可操控的像素场景）
   - v36.2：不再是随时可玩的练习，改成 DAY 2 起第一次出门（第一次打开东京地图）时发生一次的剧情事件。
     完成后山田会隔天出现在品川一带的某个车站街区（cameoAt / cameo）。
   - 下雨的早上，品川站前的街角：左边便利店、右边投币洗衣房。玩家走到人或东西面前按 A 调查，
     在「🧩 推理」面板合成推论，再走到人物面前「出示调查推论」，换到报告材料，最后写结论。
   - 画法沿用港屋酒店（32px 格子、16×16 人物放大两倍、深色夜景）。
   - 存档 campaign.invTutorial，不碰 campaign.investigation，不扣真钱（合成费用是山田给的调查经费）。
   - 依赖：app、UI.page、campaign、campaignSave、esc、INV.page（游戏和试玩版都有）。
   =================================================================== */
const INV_TUT=(function(){
 const T=32,W=16,HH=11;
 const CLUES={
  T1:{name:'伞架上的陌生雨伞',desc:'山田贴着名字胶带的透明伞不见了，伞架上多出一把灰色折叠伞，伞柄贴着一张写着「3号机」的小贴纸。',source:'便利店门口的伞架',useful:true},
  T2:{name:'洗衣房的维修告示',desc:'洗衣房门边贴着：「3号烘干机维修中，今晚21:00师傅上门」。',source:'洗衣房门边的告示',useful:true},
  T3:{name:'店员的回忆',desc:'店员グエン说，晚上十点左右进来一个穿工作服的男人，只买了一罐咖啡，走的时候从伞架拿了一把伞。',source:'便利店店员グエン',useful:true},
  T4:{name:'门口睡觉的猫',desc:'一只橘猫蜷在杂志架旁边睡觉，偶尔甩一下尾巴。',source:'便利店门口',useful:false},
  T5:{name:'今晚的天气预报',desc:'公交站的电子屏：今夜降雨概率80%，后半夜转小。',source:'公交站',useful:false}
 };
 const DEDS=[
  {id:'TD1',pair:['T1','T2'],name:'折叠伞来自洗衣房',desc:'折叠伞上的「3号机」贴纸和洗衣房的维修告示对得上。留下这把伞的人，很可能是来修烘干机的人。',verify:'aunt'},
  {id:'TD2',pair:['T2','T3'],name:'穿工作服的男人',desc:'维修时间是21:00，店员在十点左右看到穿工作服的男人拿走了伞，时间上说得通。',verify:'aunt'}
 ];
 const PRICE=0,NAMES={yamada:'山田',clerk:'グエン',aunt:'等烘干的夜班客人'};
 const PAL={
  player:{h:'#3b2f4a',s:'#f0c9a0',b:'#6fc2a6',a:'#f4d38d',p:'#3e5388',k:'#222'},
  yamada:{h:'#26262c',s:'#eac39c',b:'#4a5b7a',a:'#b84a4a',p:'#2e3446',k:'#1a1a1a'},
  clerk:{h:'#5a3a2a',s:'#f0c9a0',b:'#3d9a6a',a:'#eef4ee',p:'#3a3a48',k:'#222'},
  aunt:{h:'#8a7f86',s:'#e9c5a6',b:'#b66a8a',a:'#f0e0e8',p:'#5a4a6a',k:'#2a2228'}
 };
 /* 场景里的东西：x,y 是格子；clue = 调查得到的线索 */
 const OBJ={
  stand:{x:2,y:3,name:'伞架',clue:'T1'},
  rack:{x:0,y:3,name:'杂志架'},
  cat:{x:1,y:4,name:'橘猫',clue:'T4'},
  vend:{x:7,y:3,name:'自动贩卖机'},
  notice:{x:9,y:2,name:'维修告示',clue:'T2',wall:true},
  bus:{x:14,y:6,name:'公交站',clue:'T5'},
  bench:{x:15,y:4,name:'长椅'}
 };
 const NPC={yamada:{x:3,y:5,dir:'up'},clerk:{x:6,y:4,dir:'down'},aunt:{x:12,y:4,dir:'down'}};
 const SPR={down:['................','.....hhhhhh.....','....hhhhhhhh....','....hssssssh....','....sesssses....','....ssssssss....','.....ssmmss.....','......ssss......','....bbbbbbbb....','...bbbbaabbbb...','...sbbbbbbbbs...','...sbbbbbbbbs...','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....kkk..kkk....'],
  up:['................','.....hhhhhh.....','....hhhhhhhh....','....hhhhhhhh....','....hhhhhhhh....','....shhhhhhs....','.....ssssss.....','......ssss......','....bbbbbbbb....','...bbbbbbbbbb...','...sbbbbbbbbs...','...sbbbbbbbbs...','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....kkk..kkk....'],
  right:['................','.....hhhhhh.....','....hhhhhhhh....','....hhhhssss....','....hhhssses....','....hhssssss....','.....ssssmm.....','......ssss......','....bbbbbbbb....','....bbbbbabb....','....bbsbbbbb....','....bbsbbbbb....','....pppppppp....','.....pp..pp.....','.....pp..pp.....','.....kk..kk.....']};
 const key=(a,b)=>[a,b].sort().join('+');
 function st(){campaign.invTutorial??={};const s=campaign.invTutorial;s.clues??={};s.attempts??={};s.deds??={};s.cash??=1500;s.verified??={};s.pos??={x:8,y:6,dir:'up'};return s}
 const save=()=>{try{campaignSave()}catch(e){}};
 /* ---------- 画面状态 ---------- */
 let cv=null,g=null,raf=0,frame=0,walking=0,route=[],busy=null,panel=null,pick=[null,null],msg=null,ansMsg=null,toastText='',toastUntil=0;
 const P=()=>st().pos;
 function step(){const s=st();if(s.done)return 5;if(s.ev)return 4;if(Object.keys(s.deds).length)return 3;if(Object.keys(s.clues).length>=4)return 2;return 1}
 const STEPS=['','① 调查现场：走到人或东西面前，按 A / 空格（或直接点它）','② 合成推论：打开「🧩 推理」，选两条线索点「分析」','③ 求证：走到推论里写的「可询问」的人面前，选「🧩 出示调查推论」','④ 写结论：打开「📁 报告」，回答「伞去哪了」'];
 /* ---------- 地形 ---------- */
 function blocked(x,y){if(x<0||y<0||x>=W||y>=HH)return true;if(y<=2||y>=8)return true;
  if(Object.values(OBJ).some(o=>!o.wall&&o.x===x&&o.y===y))return true;if(Object.values(NPC).some(n=>n.x===x&&n.y===y))return true;return false}
 function thingAt(x,y){for(const [id,n] of Object.entries(NPC))if(n.x===x&&n.y===y)return {kind:'npc',id};for(const [id,o] of Object.entries(OBJ))if(o.x===x&&o.y===y)return {kind:'obj',id};return null}
 const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 /* ---------- 绘制 ---------- */
 const px=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=(n>>16)+amt,gg=(n>>8&255)+amt,b=(n&255)+amt;r=Math.max(0,Math.min(255,r));gg=Math.max(0,Math.min(255,gg));b=Math.max(0,Math.min(255,b));return '#'+((1<<24)|(r<<16)|(gg<<8)|b).toString(16).slice(1)}
 function drawChar(x,y,pal,dir,fr){const rows=SPR[dir==='left'?'right':dir],flip=dir==='left';px(x+8,y+29,16,3,'rgba(0,0,0,.3)');const bob=fr?-1:0;
  for(let r=0;r<16;r++){const row=rows[r];for(let i=0;i<16;i++){const k=row[i];if(k==='.')continue;if(fr&&r===15&&(flip?i>8:i<8))continue;const col=k==='e'?'#1b1b24':k==='m'?'#b0605a':pal[k];if(!col)continue;px(x+(flip?15-i:i)*2,y+r*2+bob,2,2,col)}}}
 function text(t,x,y,col,size,align){g.fillStyle=col;g.font='bold '+(size||10)+'px "Noto Sans JP","Hiragino Sans","Noto Sans SC",sans-serif';g.textAlign=align||'center';g.textBaseline='middle';g.fillText(t,x,y)}
 function drawStatic(now){
  /* 人行道 */
  for(let y=3;y<=7;y++)for(let x=0;x<W;x++){const X=x*T,Y=y*T,base=(x+y)%2?'#4b4955':'#504e5a';px(X,Y,T,T,base);px(X,Y,T,1,'#3e3c47');px(X,Y,1,T,'#3e3c47');if((x*7+y*3)%5===0)px(X+8,Y+18,14,4,'rgba(140,170,210,.18)')}
  px(0,7*T+24,W*T,8,'#6e6a76');px(0,7*T+24,W*T,2,'#8a8692');
  /* 马路 */
  px(0,8*T,W*T,3*T,'#24242c');for(let x=0;x<W;x+=2)px(x*T+6,9*T+14,24,4,'#c8c8c0');
  for(let i=0;i<5;i++)px(4*T+4+i*14,8*T+6,8,3*T-12,'rgba(220,220,210,.75)');
  /* 便利店 x0..7 */
  px(0,0,8*T,3*T,'#d6d2c6');px(0,0,8*T,18,'#f4f4f0');{const _b=window.KSHOP?KSHOP.sign():null;px(0,18,8*T,6,_b?_b.color:'#2d6fb5');px(0,24,8*T,6,_b?_b.dark:'#3d9a5a')}
  text((window.KSHOP?KSHOP.sign().short:'コンビニ')+' · 24H',4*T,10,window.KSHOP?KSHOP.sign().color:'#2d6fb5',12);
  px(T,T+4,4*T,2*T-10,'#3a3a40');px(T+3,T+7,4*T-6,2*T-16,'#fff1c2');
  for(let i=0;i<4;i++){px(T+8,T+14+i*12,4*T-16,3,'#b9a77a');for(let k=0;k<9;k++)px(T+10+k*13,T+8+i*12,8,6,['#e06a5a','#5aa0e0','#f0c040','#70c080','#c070c0'][(k+i)%5])}
  px(5*T,T,2*T,2*T,'#4a4a52');px(5*T+3,T+3,T-4,2*T-3,'#cfe6f5');px(6*T+1,T+3,T-4,2*T-3,'#cfe6f5');px(6*T-1,T+3,2,2*T-3,'#4a4a52');
  /* 小巷 */
  px(8*T,0,T,3*T,'#1b1a22');px(8*T+4,2*T,T-8,T,'#141319');
  /* 洗衣房 x9..15 */
  px(9*T,0,7*T,3*T,'#7d97a6');px(9*T,0,7*T,24,'#f2f2ee');text('コインランドリー',12.5*T,12,'#2a5f8a',13);px(9*T,24,7*T,4,'#2a5f8a');
  px(10*T,T,2*T,2*T,'#3e4a52');px(10*T+3,T+3,2*T-6,2*T-3,'#d8ecf2');px(11*T-1,T+3,2,2*T-3,'#3e4a52');
  px(12*T+4,T+2,4*T-8,2*T-10,'#3e4a52');px(12*T+7,T+5,4*T-14,2*T-16,'#c6dde6');
  for(let i=0;i<4;i++){const cx=12*T+22+i*28,cy=T+28;g.fillStyle='#eef3f5';g.fillRect(cx-11,cy-13,22,26);g.beginPath();g.arc(cx,cy,8,0,7);g.fillStyle=i===2?'#55606a':'#7fb2c8';g.fill();if(i===2){text('×',cx,cy,'#e07a6f',11)}}
  /* 告示（墙上） */
  px(9*T+5,2*T+2,22,26,'#f5efd8');px(9*T+5,2*T+2,22,5,'#c0504d');for(let i=0;i<4;i++)px(9*T+8,2*T+11+i*4,16,1,'#8a8270');
  /* 物件 */
  // 杂志架
  px(2,3*T+2,T-4,T-4,'#2f4f7f');for(let i=0;i<3;i++)px(5,3*T+5+i*9,T-10,7,['#e0b040','#e06a8a','#70c0e0'][i]);
  // 伞架
  px(2*T+8,3*T+12,16,18,'#8a8e96');px(2*T+8,3*T+12,16,3,'#a9adb5');px(2*T+10,3*T+1,3,13,'rgba(225,238,245,.85)');px(2*T+19,3*T+3,3,11,'rgba(225,238,245,.85)');px(2*T+22,3*T+5,2,9,'rgba(225,238,245,.7)');px(2*T+15,3*T+7,3,8,'#8a8a92');px(2*T+14,3*T+5,5,3,'#f5efd8');
  // 贩卖机
  px(7*T+3,3*T-14,T-6,T+12,'#b53a3a');px(7*T+6,3*T-10,T-12,14,'#f0f4ff');for(let i=0;i<5;i++)px(7*T+8+i*4,3*T-8,3,8,['#5aa0e0','#e0b040','#70c080','#e06a5a','#a070e0'][i]);px(7*T+8,3*T+12,T-16,5,'#1a1a1a');
  // 公交站
  px(14*T+14,5*T+10,4,T+18,'#9aa0aa');px(14*T+2,5*T-6,28,18,'#2a5f8a');text('BUS',14*T+16,5*T+3,'#fff',9);px(14*T+4,6*T+4,24,12,'#111');text('雨 80%',14*T+16,6*T+10,'#f0a040',8);
  // 长椅
  px(15*T+2,4*T+12,T-4,6,'#8a6a4a');px(15*T+4,4*T+18,3,10,'#555');px(15*T+T-7,4*T+18,3,10,'#555');
  // 猫
  const tail=Math.sin(now/500)*3;px(T+6,4*T+18,18,10,'#e09a4a');px(T+20,4*T+14,8,8,'#e09a4a');px(T+21,4*T+12,2,3,'#e09a4a');px(T+25,4*T+12,2,3,'#e09a4a');px(T+2,4*T+20+tail,6,3,'#d0883a');px(T+10,4*T+20,10,2,'#c07a30');
 }
 function marks(now){const s=st(),b=Math.sin(now/250)*2;
  const need=[];for(const o of Object.values(OBJ))if(o.clue&&!s.clues[o.clue])need.push([o.x,o.y-(o.wall?0:0)]);
  if(!s.talkedYamada)need.push([NPC.yamada.x,NPC.yamada.y]);if(!s.clues.T3)need.push([NPC.clerk.x,NPC.clerk.y]);if(Object.keys(s.deds).length&&!s.ev)need.push([NPC.aunt.x,NPC.aunt.y]);
  for(const [x,y] of need){px(x*T+12,y*T-12+b,8,10,'#f4d38d');px(x*T+12,y*T-12+b,8,2,'#fff3c4');text('!',x*T+16,y*T-7+b,'#3b2f4a',10)}}
 function draw(now){if(!g)return;drawStatic(now);
  const p=P(),list=[...Object.entries(NPC).map(([id,n])=>({y:n.y,f:()=>drawChar(n.x*T,n.y*T-4,PAL[id],n.dir,0)})),{y:p.y+.1,f:()=>drawChar(p.x*T,p.y*T-4,PAL.player,p.dir,walking?frame%2:0)}];
  list.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  marks(now);
  /* 阴雨的早上、店里的灯光、雨 */
  px(0,0,W*T,HH*T,'rgba(14,20,40,.52)');
  const lg=g.createRadialGradient(3*T,3*T,10,3*T,3*T,4*T);lg.addColorStop(0,'rgba(255,236,170,.28)');lg.addColorStop(1,'rgba(255,236,170,0)');g.fillStyle=lg;g.fillRect(0,0,8*T,7*T);
  const lg2=g.createRadialGradient(12.5*T,3*T,10,12.5*T,3*T,3.5*T);lg2.addColorStop(0,'rgba(190,230,255,.18)');lg2.addColorStop(1,'rgba(190,230,255,0)');g.fillStyle=lg2;g.fillRect(8*T,0,8*T,7*T);
  g.strokeStyle='rgba(170,200,230,.35)';g.lineWidth=1;g.beginPath();for(let i=0;i<70;i++){const x=((i*73+now/6)%(W*T+40))-20,y=((i*131+now/2.2)%(HH*T+20))-10;g.moveTo(x,y);g.lineTo(x-3,y+9)}g.stroke();
  /* 前方提示 */
  const [dx,dy]=DIRS[p.dir],th=thingAt(p.x+dx,p.y+dy);if(th&&!busy&&!panel){const n=th.kind==='npc'?NAMES[th.id]:OBJ[th.id].name;g.font='bold 12px sans-serif';const w=g.measureText('A：'+n).width+16;px(6,HH*T-26,w,20,'rgba(10,12,20,.8)');text('A：'+n,6+w/2,HH*T-16,'#f4d38d',12)}
  if(toastText&&now<toastUntil){g.font='bold 13px sans-serif';const w=g.measureText(toastText).width+24;px((W*T-w)/2,8,w,24,'rgba(20,24,36,.9)');px((W*T-w)/2,8,w,2,'#f4d38d');text(toastText,W*T/2,20,'#f4d38d',13)}
 }
 function loop(now){if(!cv||!cv.isConnected){cancelAnimationFrame(raf);raf=0;return}draw(now);raf=requestAnimationFrame(loop)}
 function toast(t){toastText=t;toastUntil=performance.now()+2200}
 /* ---------- 移动 ---------- */
 function move(dir){if(busy||panel)return;const p=P(),[dx,dy]=DIRS[dir];p.dir=dir;if(!blocked(p.x+dx,p.y+dy)){p.x+=dx;p.y+=dy;frame++;walking=1;clearTimeout(move.t);move.t=setTimeout(()=>walking=0,180)}save()}
 function pathTo(tx,ty){const p=P(),prev={},q=[[p.x,p.y]],k=(x,y)=>x+','+y;prev[k(p.x,p.y)]=null;
  while(q.length){const [x,y]=q.shift();if(x===tx&&y===ty){const r=[];let c=k(x,y);while(prev[c]){r.unshift(c.split(',').map(Number));c=prev[c]}return r}
   for(const [dx,dy] of Object.values(DIRS)){const nx=x+dx,ny=y+dy,nk=k(nx,ny);if(nk in prev||blocked(nx,ny))continue;prev[nk]=k(x,y);q.push([nx,ny])}}return null}
 function walkRoute(r,then){route=r;clearInterval(walkRoute.t);if(!r.length){then&&then();return}walkRoute.t=setInterval(()=>{if(!route.length||busy||panel){clearInterval(walkRoute.t);if(!route.length&&then)then();return}const p=P(),[nx,ny]=route.shift();const d=nx>p.x?'right':nx<p.x?'left':ny>p.y?'down':'up';move(d);if(!route.length){clearInterval(walkRoute.t);then&&then()}},130)}
 function clickTile(tx,ty){if(busy||panel)return;const th=thingAt(tx,ty);
  if(!th){const r=pathTo(tx,ty);if(r)walkRoute(r);return}
  const cands=[[0,1,'up'],[-1,0,'right'],[1,0,'left'],[0,-1,'down']].map(([dx,dy,d])=>({x:tx+dx,y:ty+dy,d})).filter(c=>!blocked(c.x,c.y)||(c.x===P().x&&c.y===P().y));
  let best=null;for(const c of cands){const r=(c.x===P().x&&c.y===P().y)?[]:pathTo(c.x,c.y);if(r&&(!best||r.length<best.r.length))best={...c,r}}
  if(best)walkRoute(best.r,()=>{P().dir=best.d;interact()})}
 /* ---------- 对话框 ---------- */
 function box(){return app.querySelector('#tut-dialog')}
 function show(who,lines,opts){busy=true;const b=box();if(!b)return;lines=[].concat(lines);let i=0;
  const render=()=>{const last=i>=lines.length-1;b.hidden=false;const ln=lines[i],wh=Array.isArray(ln)?ln[0]:who,tx=Array.isArray(ln)?ln[1]:ln;if(wh==='山田'&&!st().talkedYamada){st().talkedYamada=true;save()}b.innerHTML='<div class="tut-who">'+esc(wh||'')+'</div><p class="tut-line">'+esc(tx)+'</p><div class="tut-opts">'+(last&&opts&&opts.length?opts.map((o,k)=>'<button type="button" class="rpg-action" data-op="'+k+'">'+esc(o[0])+'</button>').join(''):'<button type="button" class="rpg-action" data-next>'+(last?'关闭':'▶ 继续')+'</button>')+'</div>';
   const n=b.querySelector('[data-next]');if(n){n.onclick=()=>{if(last)close();else{i++;render()}};n.focus({preventScroll:true})}
   b.querySelectorAll('[data-op]').forEach(x=>x.onclick=()=>{const fn=opts[+x.dataset.op][1];close();fn&&fn()});const f=b.querySelector('[data-op]');if(f)f.focus({preventScroll:true})};
  render()}
 function close(){busy=null;const b=box();if(b){b.hidden=true;b.innerHTML=''}hud();cv&&cv.focus({preventScroll:true})}
 function getClue(id){const s=st();if(s.clues[id])return false;s.clues[id]=true;save();toast('📝 获得线索：'+CLUES[id].name);hud();return true}
 /* ---------- 调查 ---------- */
 function interact(){if(busy||panel)return;const p=P(),[dx,dy]=DIRS[p.dir],th=thingAt(p.x+dx,p.y+dy);if(!th)return;
  if(th.kind==='npc'){const n=NPC[th.id];n.dir={up:'down',down:'up',left:'right',right:'left'}[p.dir];return talk(th.id)}
  const s=st(),o=OBJ[th.id];
  const T_={stand:['伞架里插着几把透明塑料伞，还有一把灰色折叠伞。','折叠伞的伞柄上贴着一张小贴纸，手写着「3号机」。'],
   notice:['洗衣房门边贴着一张告示。','「3号烘干机维修中。今晚21:00，维修师傅上门。」'],
   cat:['一只橘猫蜷在杂志架旁边睡觉。你蹲下来，它甩了一下尾巴，没理你。'],
   bus:['公交站的电子屏一闪一闪：「今夜降雨概率80%，后半夜转小。」'],
   vend:['自动贩卖机。罐装咖啡 ¥130。和案子没什么关系。'],
   rack:['杂志架上是周刊和漫画。被雨打湿了一角。'],
   bench:['长椅湿透了，没人坐。']}[th.id];
  show(o.name,T_,null);if(o.clue)getClue(o.clue)}
 function presentMenu(npc){const s=st(),ds=DEDS.filter(d=>s.deds[d.id]);
  if(!ds.length)return show('🧩 出示调查推论','你还没有可以出示的推论。\n先打开「🧩 推理」，把两条线索合成一条推论。',null);
  show('🧩 出示调查推论','要向'+NAMES[npc]+'出示哪一条推论？',[...ds.map(d=>['出示：'+d.name+(s.verified[d.id]?'（已求证）':''),()=>present(npc,d)]),['暂时不出示',()=>talk(npc)]])}
 function present(npc,d){const s=st();
  if(npc==='yamada')return show('山田','“这个……我也说不清啊。我一直在店里看杂志。”\n“伞上贴着洗衣房的贴纸的话，是不是该去问洗衣房的人？”',null);
  if(npc==='clerk')return show('グエン','“我只看到他拿了伞往右边走了。后来去了哪，我就不知道了。”\n“隔壁洗衣房有个客人一直在等衣服，你去问问她？”',null);
  if(s.verified[d.id])return show('等烘干的夜班客人','“刚才说过啦，就是那位修3号机的师傅。”\n（同一条推论只需要求证一次。）',null);
  s.verified[d.id]=true;const first=!s.ev;s.ev=true;save();
  show('等烘干的夜班客人',[d.id==='TD1'?'“贴着「3号机」？那是这家洗衣房的贴纸。今晚只有修3号机的师傅来过——他把工具和自己的伞都放在机器旁边，大概是顺手贴上的。”':'“穿工作服、十点左右？那就是修3号机的师傅。他修完说下雨了，去隔壁便利店买罐咖啡。”',
   '“他回来时手里拿着一把透明伞，柄上还贴着别人的名字。他自己的折叠伞倒是没拿回来。”','“他明天早上还会来收尾。”'].concat(first?['📁 获得报告材料：洗衣房证言\n「维修师傅带回了一把贴着别人名字的透明伞，自己的折叠伞留在了别处；他明天早上还会来。」\n→ 打开「📁 报告」写结论。']:[]),null);
  if(first)toast('📁 报告材料已确认：洗衣房证言')}
 function talk(npc){const s=st();
  if(npc==='yamada'){s.talkedYamada=true;save();return show('山田',s.done?'“太好了，明天早上就能换回来了。……下次我买把带颜色的。”':'“我进店买点东西，顺便看了会儿杂志，大概二十分钟。出来伞就没了。”\n“就是柄上贴着我名字胶带的那把。第37把。”',s.done?null:[['🧩 出示调查推论',()=>presentMenu('yamada')],['离开',null]])}
  if(npc==='clerk')return show('グエン','“欢迎光临……啊，你是在问那把伞的事吗？”',[
   ['问问刚才谁拿了伞',()=>{show('グエン',['“晚上十点左右进来一个穿工作服的男人，只买了一罐咖啡。”','“走的时候他从伞架上拿了一把透明伞——我还以为是他自己的。”'],null);getClue('T3')}],
   ['闲聊几句',()=>show('グエン','“今天雨好大，透明伞傍晚就卖完了。”\n（闲聊不一定有线索，但人物可能会给你方向。）',null)],
   ['🧩 出示调查推论',()=>presentMenu('clerk')],['离开',null]]);
  return show('等烘干的夜班客人','一个穿夜班制服的女人坐在洗衣房的长椅上，等衣服烘干。“……这么晚还在外面？”',[
   ['问问今晚有谁来过',()=>show('等烘干的夜班客人','“来来往往的人可多了，你问的是哪一个？”\n（没有具体的推论，很难问出关键证言。）',null)],
   ['🧩 出示调查推论',()=>presentMenu('aunt')],['离开',null]])}
 /* ---------- 推理面板 ---------- */
 function combine(){
  const s=st(),[a,b]=pick;if(!a||!b)return;const k=key(a,b),d=DEDS.find(x=>key(...x.pair)===k);
  if(s.attempts[k]){msg=d?{ok:true,d,again:true}:{fail:true,again:true,paid:0};return}
  if(s.cash<PRICE){msg={cash:true};return}
  s.cash-=PRICE;s.attempts[k]={paid:PRICE,ok:!!d};if(d){s.deds[d.id]=true;msg={ok:true,d}}else msg={fail:true,paid:PRICE};save();
 }
 function resultHtml(){if(!msg)return '';const m=msg;
  if(m.cash)return '<div class="inv-result inv-fail"><b>❌ 余额不足 · 未扣费</b><p>钱不够时不会扣费，也不算尝试过。</p><button type="button" class="survival-btn alt" id="tut-refill">💴 跟山田再要一点经费（+¥1500）</button></div>';
  if(m.ok)return '<div class="inv-result"><small>'+(m.again?'该推论已记录（重复分析免费）':'✅ 合成成功 · 新推论')+'</small><b>'+esc(m.d.name)+'</b><p>'+esc(m.d.desc)+'</p><p class="survival-tip">推论还只是猜测。看推论下方的「可询问」，走到那个人面前出示它。</p></div>';
  return '<div class="inv-result inv-fail"><b>未能建立有效推论'+(m.again?'（已经试过，重复免费）':' · 已扣 ¥'+m.paid)+'</b><p>目前无法从这两份记录中得出可靠结论。分析结果已记录在调查手帐中。</p></div>';
 }
 function dedCards(){const s=st();const ds=DEDS.filter(d=>s.deds[d.id]);return ds.length?'<h3>已形成的推论</h3>'+ds.map(d=>'<article class="inv-ded"><b>'+esc(d.name)+'</b><p>'+esc(d.desc)+'</p><small>可询问：'+NAMES[d.verify]+' · '+(s.verified[d.id]?'已求证':'尚待求证')+'</small></article>').join(''):''}
 function infer(){const s=st(),got=Object.keys(s.clues);
  const slot=i=>{const c=pick[i]&&CLUES[pick[i]];return '<button type="button" class="inv-slot'+(c?' on':'')+'" data-tslot="'+i+'">'+(c?esc(c.name)+'<small>（点一下取消）</small>':(i?'第二条线索':'第一条线索'))+'</button>'};
  return '<h3>线索合成</h3>'+(got.length<2?'<p class="survival-tip">至少要有两条线索才能合成。先去现场调查。</p>':'')+
   '<div class="inv-slots">'+slot(0)+'<span>＋</span>'+slot(1)+'</div><button type="button" class="survival-btn" id="tut-go" '+(pick[0]&&pick[1]?'':'disabled')+'>🧩 分析线索（教学不收费）</button><p class="survival-tip">正式调查里，每组首次分析要付 ¥500，失败也收费，同一组重复分析免费。</p>'+resultHtml()+dedCards()+
   '<h3>已获得的线索 <small>'+got.length+'/5</small></h3><div class="inv-pickers">'+got.map(id=>{const c=CLUES[id],used=pick.includes(id);return '<div class="inv-choice-card"><button type="button" class="rpg-action inv-pick'+(used?' used':'')+'" data-tpick="'+id+'" '+(used?'disabled':'')+'>'+esc(c.name)+'</button><details><summary>查看原文</summary><p>'+esc(c.desc)+'</p><small>'+esc(c.source)+'</small></details></div>'}).join('')+'</div>';
 }
 function report(){const s=st();
  if(!s.ev)return '<h3>报告材料 0/1</h3><p class="survival-tip">还没有报告材料。线索和推论都不能直接写进报告——要先拿推论去向知情人求证。</p>'+dedCards();
  const opts=[['a','山田自己记错了，伞根本没带来'],['b','维修师傅拿错了伞，明天能换回来'],['c','店员把伞藏起来了'],['d','透明伞本来就是共享的，根本没有案件']];
  return '<h3>报告材料 1/1</h3><article class="inv-ded"><b>洗衣房证言</b><p>修3号烘干机的师傅从便利店回来时拿着一把贴着别人名字的透明伞，他自己的折叠伞没有拿回来。他明天早上还会来。</p><small>来源：推论求证（等烘干的夜班客人）</small></article><h3>结论：山田的伞去哪了？</h3>'+
   (s.done?'<div class="inv-result"><b>✅ 结论成立</b><p>你把证言告诉山田。第二天早上，师傅拿着那把贴着「山田」的透明伞来换回了自己的折叠伞，嘴里还嘀咕：“透明伞不是共享的吗……”</p><p>山田的第37把透明伞，成功从「透明雨伞共享计划」中退出。</p><p>至少两条线索相互印证后，才能形成推论。向相关人物核实推论，获得确认后即可作为材料用于案件报告。</p></div>':
   '<div class="inv-pickers">'+opts.map(([k,t])=>'<button type="button" class="rpg-action" data-tans="'+k+'">'+esc(t)+'</button>').join('')+'</div>'+(ansMsg?'<div class="inv-result inv-fail"><b>❌ 和材料对不上</b><p>'+esc(ansMsg)+'</p></div>':''));
 }
 function openPanel(kind){panel=kind;renderPanel()}
 function renderPanel(){const el=app.querySelector('#tut-panel');if(!el)return;if(!panel){el.hidden=true;el.innerHTML='';hud();return}
  el.hidden=false;el.innerHTML='<div class="tut-panel-card"><div class="tut-panel-head"><b>'+(panel==='infer'?'🧩 推理':'📁 报告')+'</b><button type="button" class="rpg-inline-back" id="tut-close">✕ 回到现场</button></div>'+(panel==='infer'?infer():report())+'</div>';
  const q=s=>el.querySelectorAll(s);
  el.querySelector('#tut-close').onclick=()=>{panel=null;msg=null;renderPanel();cv&&cv.focus({preventScroll:true})};
  q('[data-tpick]').forEach(b=>b.onclick=()=>{const id=b.dataset.tpick;if(!pick[0])pick[0]=id;else if(!pick[1])pick[1]=id;else pick=[pick[0],id];msg=null;renderPanel()});
  q('[data-tslot]').forEach(b=>b.onclick=()=>{pick[+b.dataset.tslot]=null;msg=null;renderPanel()});
  const go=el.querySelector('#tut-go');if(go)go.onclick=()=>{combine();renderPanel()};
  const rf=el.querySelector('#tut-refill');if(rf)rf.onclick=()=>{st().cash+=1500;msg=null;save();renderPanel();toast('山田叹了口气，又掏出 ¥1500。')};
  q('[data-tans]').forEach(b=>b.onclick=()=>{const k=b.dataset.tans;if(k==='b'){st().done=true;st().doneDay=campaign.day||1;ansMsg=null;save();toast('✅ 案件解决：透明雨伞共享计划')}else ansMsg=k==='a'?'山田说他进店前还撑着伞，伞架上又多出一把别人的伞，“记错了”解释不了这把折叠伞。':k==='d'?'伞柄上贴着山田的名字，拿走它的人还留下了自己的折叠伞——这不是“共享”，是拿错。就算在日本，贴了名字的伞也不归大家所有。':'店员自己说看到穿工作服的男人拿走了伞，洗衣房的证言也说维修师傅带回了一把贴着别人名字的透明伞——没有任何材料指向店员。';renderPanel()});
  hud();
 }
 /* ---------- 上方的进度与按钮 ---------- */
 function hud(){const el=app.querySelector('#tut-hud');if(!el)return;const s=st(),cur=step();
  el.innerHTML='<ol class="tut-steps">'+STEPS.slice(1).map((t,i)=>'<li class="'+(i+1<cur?'done':i+1===cur?'now':'')+'">'+(i+1<cur?'☑ ':'')+esc(t)+(i===0?'（'+Object.keys(s.clues).length+'/5）':'')+'</li>').join('')+'</ol>'+(cur===5?'<p class="tut-done">✅ 案件解决。</p>':'')+
   '<div class="tut-bar"><button type="button" class="survival-btn" data-panel="infer">🧩 推理 <small>线索'+Object.keys(s.clues).length+' · 推论'+Object.keys(s.deds).length+'</small></button><button type="button" class="survival-btn" data-panel="report">📁 报告 <small>'+(s.ev?'1':'0')+'/1</small></button><button type="button" class="survival-btn alt" id="tut-exit">'+(s.done?(s.prologue&&window.PRO&&PRO.applies()?'回到雨里 →':'继续出门 → 东京地图'):'先离开（山田会在原地等你）')+'</button></div>';
  el.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{if(busy)return;openPanel(b.dataset.panel)});
  el.querySelector('#tut-exit').onclick=leave;
 }
 /* ---------- 打开 ---------- */
 function open(){if(!campaign)return;const s=st();s.seen=true;save();panel=null;busy=null;msg=null;
  UI.page('inv-tutorial','透明雨伞共享计划','CASE 000 · 品川站前',
   '<section class="rpg-panel" id="tut-hud"></section>'+
   '<section class="rpg-panel tut-stage"><div class="tut-wrap"><canvas id="tut-canvas" width="'+W*T+'" height="'+HH*T+'" tabindex="0" aria-label="品川站前的便利店门口"></canvas><div id="tut-dialog" class="tut-dialog" hidden></div><div id="tut-panel" class="tut-panel" hidden></div></div>'+
   '<div class="tut-pad"><button type="button" data-mv="up" aria-label="上">▲</button><button type="button" data-mv="left" aria-label="左">◀</button><button type="button" data-mv="down" aria-label="下">▼</button><button type="button" data-mv="right" aria-label="右">▶</button><button type="button" class="tut-a" id="tut-a" aria-label="调查">A</button></div>'+
   '<p class="survival-tip">方向键 / WASD 移动，A / 空格 / Enter 调查或对话；也可以直接点地图上的地面、人和东西。头上有「!」的地方还有东西可查。</p></section>');
  const bk=app.querySelector('#et-back');if(bk)bk.onclick=leave;
  cv=app.querySelector('#tut-canvas');g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  cv.onclick=e=>{const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*W),y=Math.floor((e.clientY-r.top)/r.height*HH);clickTile(x,y)};
  app.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>move(b.dataset.mv));app.querySelector('#tut-a').onclick=interact;
  hud();if(!raf)raf=requestAnimationFrame(loop);
  if(!s.introDone){s.introDone=true;save();P().dir='up';show('山田',V52TUT.intro(st()),null)}
  cv.focus({preventScroll:true});
 }
 function leave(){cv=null;panel=null;busy=null;if(window.V52PRO&&st().prologue){V52PRO.back();return}if(typeof tokyoHome==='function')tokyoHome();else INV.page()}
 /* ---------- 剧情触发：DAY 2 起第一次出门（第一次打开东京地图） ---------- */
 function eligible(){if(!campaign||!campaign.firstDayComplete||(campaign.day||1)<2)return false;const s=campaign.invTutorial||{};if(s.done||s.introDone||s.skipped)return false;
  if(Object.keys((campaign.investigation&&campaign.investigation.deductions)||{}).length){st().skipped=true;save();return false} /* 旧存档已经会合成推论：不再插入这段 */
  return true}
 function maybeStart(){return false;if(!eligible())return false;if(window.H18&&H18.active&&H18.active())return false;if(document.querySelector('.et-modal-back'))return false;open();return true}
 /* 地图上：事件做到一半离开时，提示可以回去 */
 function mapBox(){const s=campaign&&campaign.invTutorial;if(!s||!s.introDone||s.done)return;const r=app.querySelector('.rpg-shell');if(!r||r.querySelector('#tut-resume'))return;
  r.insertAdjacentHTML('afterbegin','<section class="survival-box" id="tut-resume"><b>☂ '+(s.talkedYamada?'山田还在品川站前的便利店门口等你':'品川站前 · 便利店门口')+'</b><p class="survival-tip">透明雨伞的事还没查完。</p><button type="button" class="survival-btn">▶ 回去继续</button></section>');r.querySelector('#tut-resume button').onclick=open}
 /* ---------- 完成后：山田偶尔出现在街上 ---------- */
 const CAMEO_AT=['shinagawa','gotanda','shimbashi','kitashinagawa','ueno'];
 const CAMEO=['山田看见你，把夹在腋下的透明伞举起来晃了晃。\n“第37把，还在。我现在出门都把它夹着走。”',
  '山田撑着一把亮黄色的伞。\n“带颜色的。这次总不会被‘共享’了吧。”',
  '山田两手空空地站在屋檐下。\n“……黄色那把，被人拿走了。看来颜色不是问题。”',
  '山田把伞柄伸到你面前，上面有歪歪扭扭的刀痕。\n“刻的。名字。刻上去的。”',
  '山田正在便利店门口的伞架前犹豫。\n“第38把。别问。”'];
 function cameoAt(id){const s=campaign&&campaign.invTutorial;if(!s||!s.done)return false;const d=campaign.day||1;if(s.doneDay&&d<=s.doneDay)return false;if(d%2)return false;
  const ok=CAMEO_AT.filter(x=>!(d>=2&&d<=6&&window.DAYINV&&DAYINV.scenes&&DAYINV.scenes[x])); /* 白天调查模式的街区布局不同，那几天不放山田 */
  return ok.length>0&&ok[(d/2)%ok.length|0]===id}
 function cameo(){const s=st(),d=campaign.day||1;s.cameo??={n:0,day:0};if(s.cameo.day!==d){s.cameo.day=d;s.cameo.n++;save()}
  const i=s.cameo.n-1,text=i<CAMEO.length?CAMEO[i]:CAMEO[(i+d)%CAMEO.length];
  UI.modal({title:'山田',html:'<p style="white-space:pre-line">'+esc(text)+'</p>',buttons:[{label:'点点头，继续赶路',primary:true}]})}
 if(!window.__tutKeys){window.__tutKeys=true;document.addEventListener('keydown',e=>{if(!cv||!cv.isConnected||panel)return;if(/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;
  if(busy){return}
  const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'}[e.key];
  if(m){e.preventDefault();route=[];move(m);return}
  if(e.key===' '||e.key==='Enter'||e.key==='e'||e.key==='E'){e.preventDefault();interact()}})}
 /* 推理页「线索合成」上方的说明 */
 function guideHtml(){const s=campaign&&campaign.invTutorial||{};
  return '<details class="inv-guide"'+(s.done?'':' open')+'><summary>📘 推理怎么玩'+''+'</summary>'+
   '<ol><li><b>线索</b>：和人对话、调查场景得到。单条线索只是事实，<b>不会直接写进报告</b>。</li>'+
   '<li><b>合成</b>：在下面选两条线索放进两个槽，点「分析」。两条线索能对上，就形成一条<b>推论</b>（推论记录里能看到）。'+
   '每组首次分析 ¥500，失败也收费；同一组重复分析免费。</li>'+
   '<li><b>求证</b>：推论下方写着「可询问：某某」。去找那个人，在对话里选「🧩 出示调查推论」，再选这条推论。问错人是问不出东西的。</li>'+
   '<li><b>报告材料</b>：求证成立后会提示「📁 报告材料已确认」，材料出现在「报告材料」页。最终报告只看这些材料。</li></ol>'+
   '<p>小技巧：先想清楚两条线索<b>说的是不是同一件事、同一个人或同一段时间</b>，再花钱分析。</p>'+
   (s.done?'<p class="survival-tip">（帮山田找伞时用的就是这套流程。）</p>':'<button type="button" class="survival-btn alt" id="tut-practice">☂ 用一个小案子练一练：透明雨伞</button>')+'</details>';
 }
 function firstPrompt(){return false} /* v36.2：不再在推理页询问练习，改为 DAY 2 出门时的剧情事件 */
 return {open,guideHtml,firstPrompt,maybeStart,mapBox,cameoAt,cameo,eligible,state:()=>campaign&&campaign.invTutorial,_t:{move,interact,talk,present,clickTile,openPanel,pick:(a,b)=>{pick=[a,b];combine();return msg},close,busy:()=>busy,panel:()=>panel}};
})();
window.INV_TUT=INV_TUT;

