/* ==== engine/survival/98e-explore.js ==== */
/* ===================================================================
   【v24 大地图怪谈探索系统：探索周边 + 东京都异闻录】
   一个通用引擎，所有车站共用；每个车站的场景、人物、调查点、怪谈事件都写在数据里：
     data/explore/<地区>.json   场景（地图、人物 actors、调查点 spots、出口 exits、触发 triggers、残響知覚 echo、对话 nodes）
     data/explore/kaidan.json   东京都异闻录（每条怪谈的编号、地区、可以记录的现象 / 证据 / 规则 / 结果）
   数值：config/game.json 的 explore（几点算夜里、日语答错扣多少 疲劳点）；SAN 在 sanRules.kaidanRule。
   对话用原来的 AVG 播放器（83-dialogue.js 的 SR / DM），像素地图、移动、调查是这里的通用部分。
   存档：campaign.explore = {pos:{地区:{x,y,dir}}, flags:{}, today:{}, fired:{}, visits:{}}，campaign.kaidan = {怪谈:{…}}
   开发者：EXPLORE.open('ueno')、EXPLORE.play('ue-man')、EXPLORE.reset()；网址后面加 #explore=ueno 或 #explore=ueno/ue-man 直接跳转。
   =================================================================== */
const EXPLORE=(function(){
 const T=32,MW=16,MH=11,CW=T*MW,CH=T*MH;
 const CFG=()=>Object.assign({nightFrom:'18:00',nightUntil:'05:00',jpHp:3,stepMs:150},GAME_CONFIG.explore||{});
 const AREAS={};Object.keys(GAME_DATA.d||{}).forEach(k=>{if(k.startsWith('explore/')&&k!=='explore/kaidan'){const a=GAME_DATA.d[k];if(a&&a.id)AREAS[a.id]=a}});
 const KD=()=>(GAME_DATA.d['explore/kaidan']||{}).records||{};
 const NODES={};Object.values(AREAS).forEach(a=>Object.assign(NODES,a.nodes||{}));
 const L=v=>v==null?[]:Array.isArray(v)?v:[v];
 const hm=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(s||''));return m?+m[1]*60+(+m[2]):0};
 let area=null,cv=null,g=null,raf=0,P=null,keys=new Set(),lastStep=0,busy=false,pendingLeave=false;
 /* ---------- 存档 ---------- */
 function S(){campaign.explore??={};const s=campaign.explore;s.pos??={};s.flags??={};s.today??={};s.fired??={};s.visits??={};return s}
 function K(id){campaign.kaidan??={};const r=campaign.kaidan[id]??={seen:[],evidence:[],rules:[],status:'',outcome:'',outcomes:[],first:null,encounters:0,lastDay:0};return r}
 const save=()=>{if(typeof campaignSave==='function')campaignSave()};
 /* ---------- 时间 ---------- */
 function clock(){const c=TM.now();return c==null?hm('12:00'):c}
 function night(){const c=clock()%1440,f=hm(CFG().nightFrom),u=hm(CFG().nightUntil);return c>=f||c<u}
 /* ---------- 条件 ---------- */
 function cond(w){
  if(!w)return true;const s=S();
  if(w.all&&!w.all.every(cond))return false;if(w.any&&!w.any.some(cond))return false;if(w.not&&cond(w.not))return false;
  if(w.night!=null&&night()!==w.night)return false;
  if(w.echo!=null&&!!(window.ECHO&&ECHO.unlocked())!==w.echo)return false;
  if(w.flag&&!L(w.flag).every(f=>s.flags[f]))return false;
  if(w.notFlag&&L(w.notFlag).some(f=>s.flags[f]))return false;
  if(w.today&&!L(w.today).every(k=>s.today[k]===campaign.day))return false;
  if(w.notToday&&L(w.notToday).some(k=>s.today[k]===campaign.day))return false;
  if(w.kaidan&&!L(w.kaidan).every(id=>campaign.kaidan&&campaign.kaidan[id]))return false;
  const kk=(x,f)=>{const [id,v]=String(x).split(':');const r=campaign.kaidan&&campaign.kaidan[id];return !!r&&(r[f]||[]).includes(v)};
  if(w.seen&&!L(w.seen).every(x=>kk(x,'seen')))return false;
  if(w.evidence&&!L(w.evidence).every(x=>kk(x,'evidence')))return false;
  if(w.rule&&!L(w.rule).every(x=>kk(x,'rules')))return false;
  if(w.notRule&&L(w.notRule).some(x=>kk(x,'rules')))return false;
  if(w.outcome&&!L(w.outcome).every(x=>kk(x,'outcomes')))return false;
  if(w.encounters){const [id,n]=String(w.encounters).split(':');if(!campaign.kaidan||!campaign.kaidan[id]||(campaign.kaidan[id].encounters||0)<+n)return false}
  return true;
 }
 /* ---------- 效果（同一条证据 / 现象 / 规则只记一次，不会重复领取） ---------- */
 function kaidan(e,out){
  const def=KD()[e.id];if(!def)return;const isNew=!(campaign.kaidan&&campaign.kaidan[e.id]);const r=K(e.id);
  if(isNew){r.first={day:campaign.day,time:TM.fmt(clock())};if(!e.silent){out.push('📁 东京都异闻录：新的记录 '+def.no);if(window.AUDIO)AUDIO.sfx('clue')}} // silent：不提示（例如序章里的站台事件）
  if(r.lastDay!==campaign.day&&(e.see||e.evidence||e.status)){r.lastDay=campaign.day;r.encounters=(r.encounters||0)+1}
  L(e.see).forEach(x=>{if(!r.seen.includes(x))r.seen.push(x)});
  L(e.evidence).forEach(x=>{if(!r.evidence.includes(x)){r.evidence.push(x);const ev=(def.evidence||{})[x];if(ev&&!e.silent)out.push('🗂 证据：'+ev.name)}});
  L(e.rule).forEach(x=>{if(!r.rules.includes(x)){r.rules.push(x);out.push('⚠ 发现异常规则')}});
  const rank=st=>((def.statusOrder||['rumor','investigating','seen','recorded']).indexOf(st));
  if(e.status&&rank(e.status)>rank(r.status||''))r.status=e.status;
  if(e.outcome){r.outcome=e.outcome;r.outcomes??=[];if(!r.outcomes.includes(e.outcome))r.outcomes.push(e.outcome)}
 }
 function apply(e){
  if(!e)return '';const s=S(),out=[];
  L(e.flag).forEach(f=>s.flags[f]=true);L(e.clearFlag).forEach(f=>delete s.flags[f]);
  L(e.today).forEach(k=>s.today[k]=campaign.day);
  L(e.kaidan).forEach(k=>kaidan(k,out));
  const san=e.sanRule?-Math.abs((GAME_CONFIG.sanRules||{})[e.sanRule]||0):0;
  const res=GS.change({san,stress:e.stress||0,hp:e.hp||0},san?'违反了异常规则':'');if(res)out.push(res);
  if(e.glitch)L(e.glitch).forEach(k=>UI.glitch(k));
  if(e.move&&P){P.x=e.move.x;P.y=e.move.y;if(e.move.dir)P.dir=e.move.dir;keepPos()}
  if(e.leave)pendingLeave=true;
  if(e.toast)UI.toast(e.toast);
  save();return out.join(' · ');
 }
 function pick(v){if(v&&typeof v==='object'&&!Array.isArray(v))return v[night()?'night':'day']??v.default??'';return v}
 function portraitFor(node,who){if(!who||!window.ART||!area)return '';const a=(area.actors||[]).find(x=>x.portrait&&(x.match||[x.name]).some(m=>who.includes(m)));return a?ART.portrait(a.portrait,a.palette||{},{}):''}
 function ctx(){return {nodes:NODES,host:()=>document.getElementById('ex-dlg'),cond,apply,pick,portraitFor,jpPenalty:CFG().jpHp,tauntScene:'street',evidence:()=>[],call:name=>{if(name.startsWith('mori:'))MORI.inspect(name.slice(5),true)},onEnd:endDialog,
  onHurt:hp=>{if(hp)UI.toast('❤️ 疲劳点 -'+hp+'（日语理解错误，SAN 不变）');return ''}}}
 function play(id){if(!NODES[id]||!document.getElementById('ex-dlg'))return false;busy=true;keys.clear();SR.run(id,ctx());return true}
 function endDialog(){DM.close();busy=false;refresh();if(pendingLeave){pendingLeave=false;leave();return}checkTriggers('near')}
 /* ---------- 地图 ---------- */
 const SOLID='#tlbvrwpsm~';
 function tileAt(x,y){if(!area||x<0||y<0||x>=MW||y>=MH)return '#';const o=(area.map.overrides||[]).find(v=>v.x===x&&v.y===y&&cond(v.when));return o?o.tile:(area.map.rows[y][x]||'#')} // overrides：条件满足时某一格换成别的（例如夜里才出现的楼梯）
 function actorsNow(){return (area.actors||[]).filter(a=>cond(a.when))}
 function spotsNow(){return (area.spots||[]).filter(s=>cond(s.when)&&(!s.echo||(window.ECHO&&ECHO.unlocked())))}
 function blocked(x,y){const t=tileAt(x,y);if(SOLID.includes(t))return true;return actorsNow().some(a=>a.x===x&&a.y===y&&!a.ghost)}
 function px(x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h)}
 function hash(x,y){return ((x*73856093)^(y*19349663))>>>0}
 function drawTile(t,tx,ty){
  const shared={'#':'W',w:'#',m:'N',b:'S',v:'V',l:'O',r:'H',s:'F',f:'_',':':'_', '.':':'};
  if(shared[t]){const ch=shared[t],m={rows:Array(11).fill(ch.repeat(16)),floor:'_',wall:['#a39a8b','#71695e','#302d32'],doors:{}};H18.pixelTile(g,m,tx,ty,night()?'night':'evening');return}
  const x=tx*T,y=ty*T,N=night(),h=hash(tx,ty);
  const ground=k=>{if(k==='.'){px(x,y,T,T,'#3a3c42');if(h%5===0)px(x+(h%27),y+(h%23),2,1,'#4a4c52')}
   else if(k===':'){px(x,y,T,T,'#8c8a82');px(x,y,T,1,'#77756e');px(x,y,1,T,'#77756e');px(x+16,y,1,T,'#817f78');px(x,y+16,T,1,'#817f78')}
   else if(k==='g'){px(x,y,T,T,'#3e6a3a');for(let i=0;i<4;i++)px(x+((h>>i*3)%28),y+((h>>i*4)%26),2,3,'#4f7f48')}
   else if(k==='f'){px(x,y,T,T,'#a3a39b');px(x,y,T,1,'#b4b4ac');if((tx+ty)%2)px(x,y,T,T,'rgba(0,0,0,.04)')}
   else px(x,y,T,T,'#555')};
  switch(t){
   case '#':px(x,y,T,T,'#3d414c');px(x,y+T-3,T,3,'#2c2f37');for(let i=0;i<2;i++){const lit=N?((h>>i)%3===0):false;px(x+5+i*14,y+6,8,10,lit?'#e8d27a':'#566070');px(x+5+i*14,y+6,8,2,'#2c2f37')}break;
   case 'w':px(x,y,T,T,'#cfcfc4');for(let i=0;i<T;i+=8){px(x,y+i,T,1,'#b9b9ae');px(x+i,y,1,T,'#b9b9ae')}px(x,y+T-4,T,4,'#8f8f86');break;
   case 's':drawTile('w',tx,ty);px(x+4,y+6,24,12,'#1d7a4a');g.fillStyle='#e8ffe8';g.font='bold 8px monospace';g.fillText('EXIT',x+6,y+15);break;
   case 'm':drawTile('w',tx,ty);px(x+3,y+3,26,24,'#26406a');px(x+5,y+5,22,20,'#d9e2ec');for(let i=0;i<4;i++)px(x+7,y+8+i*4,16,1,'#5a6a80');break;
   case 'p':ground('f');px(x+8,y,16,T,'#c4c4ba');px(x+8,y,3,T,'#d8d8ce');px(x+21,y,3,T,'#a8a89e');break;
   case 'x':px(x,y,T,T,'#2a2c30');for(let i=0;i<5;i++)px(x+2,y+3+i*6,28,3,'#4a4c52');px(x+4,y,24,9,'#1d7a4a');g.fillStyle='#e8ffe8';g.font='bold 8px monospace';g.fillText((area.map.stairLabel||{})[tx+','+ty]||'',x+7,y+8);break;
   case 'E':ground('f');px(x+10,y+12,12,8,'#7a7a72');px(x+20,y+8,4,16,'#7a7a72');break;
   case 't':ground('g');px(x+13,y+18,6,14,'#5a3e28');px(x+3,y+1,26,20,'#2c5230');px(x+7,y+3,16,10,'#36663a');break;
   case 'l':ground(area.map.floor||':');px(x+14,y+4,4,28,'#4a4a4a');px(x+9,y+1,14,5,'#8a8a8a');break;
   case 'b':ground(area.map.floor||':');px(x+3,y+12,26,6,'#7a5632');px(x+3,y+8,26,3,'#8a6640');px(x+5,y+18,3,8,'#333');px(x+24,y+18,3,8,'#333');break;
   case 'v':ground(':');px(x+3,y+1,26,30,'#b3303a');px(x+6,y+4,20,12,'#e8f0f5');for(let i=0;i<4;i++)px(x+7+i*5,y+7,3,7,['#d94','#4a8','#58c','#c55'][i]);px(x+18,y+20,6,6,'#222');break;
   case 'r':ground(':');px(x,y+10,T,3,'#9aa0a6');px(x,y+20,T,2,'#9aa0a6');for(let i=2;i<T;i+=10)px(x+i,y+8,3,18,'#7a8086');break;
   case 'd':ground(':');px(x+4,y+8,24,16,'#1b1d20');for(let i=0;i<6;i++)px(x+6+i*4,y+9,2,14,'#5a5e64');break;
   case '~':px(x,y,T,T,N?'#0f2234':'#1f4a66');for(let i=0;i<3;i++)px(x+((h>>i*5)%24),y+6+i*9,6,1,N?'#1e3a52':'#3a6a88');break;
   default:ground(t);
  }
 }
 /* 人物：16×16 点阵（2 倍） */
 const SPR={person:['................','.....hhhhhh.....','....hhhhhhhh....','....hssssssh....','....sesssses....','....ssssssss....','.....ssmmss.....','......ssss......','....bbbbbbbb....','...bbbbaabbbb...','...sbbbbbbbbs...','...sbbbbbbbbs...','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....kkk..kkk....'],
  monkey:['................','................','................','......ffff......','.....ffffff.....','....fcccccff....','....fceccef.....','....fccmccf.....','.....ffffff.....','....ffffffff....','...ffffffffff...','...ff.ffff.ff...','...ff.ffff.fft..','....f.f..f.ftt..','....kk...kk..t..','................']};
 function sprite(rows,x,y,pal,alpha,flip){g.save();if(alpha!=null)g.globalAlpha=alpha;g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+8,y+29,16,3);
  for(let r=0;r<16;r++)for(let i=0;i<16;i++){const k=rows[r][i];if(k==='.')continue;const col=k==='e'?'#1b1b24':k==='m'?'#b0605a':pal[k];if(!col)continue;g.fillStyle=col;g.fillRect(x+(flip?15-i:i)*2,y+r*2,2,2)}g.restore()}
 /* 影子：躺在地上的人形 */
 function shadowAt(x,y,lag,alpha){g.save();g.globalAlpha=alpha;g.fillStyle='#05060a';const o=Math.sin((performance.now()-(lag||0))/700)*1.5;g.beginPath();g.ellipse(x+16+o,y+26,7,4,0,0,7);g.fill();g.fillRect(x+12+o,y+26,8,18);g.beginPath();g.ellipse(x+16+o,y+46,9,5,0,0,7);g.fill();g.restore()}
 const PAL={player:{h:'#2b2b33',s:'#ecc19b',b:'#7cc2a6',a:'#5a9a82',p:'#3e5388',k:'#222'}};
 const EX_ART={shinagawa:{day:'./assets/98e-explore/f6b4f7aeb702ba84.webp',dusk:'./assets/98e-explore/4ab21542c2292d4e.webp'}};let exImgs={};function exArt(){const a=EX_ART[area.id];if(!a)return null;const src=night()?a.dusk:a.day;if(!exImgs[src]){const im=new Image();im.src=src;im.onload=()=>{try{draw()}catch(e){}};exImgs[src]=im}const im=exImgs[src];return(im.complete&&im.naturalWidth>0)?im:null}
 function draw(){
  if(!g||!area)return;const N=night();
  const _art=(area.id==='shinagawa')?exArt():null;if(_art)g.drawImage(_art,0,0,CW,CH);else for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)drawTile(tileAt(x,y),x,y);
  if(area.id==='shinagawa')FLOOD.paintWater(g);
  const fx=area.fx||{};
  if(fx.moon&&N){g.fillStyle='rgba(240,236,200,.85)';g.beginPath();g.arc(CW-56,40,14,0,7);g.fill();g.fillStyle='rgba(240,236,200,.25)';g.fillRect(CW-64,8*T+6,16,2);g.fillRect(CW-60,8*T+16,10,2)}
  targets().filter(t=>t.hint&&!S().fired['hint:'+area.id+':'+t.id]).forEach(t=>{g.fillStyle='#f4d38d';g.font='bold 14px monospace';g.fillText('!',t.x*T+13,t.y*T+3)});
  actorsNow().forEach(a=>{const x=a.x*T,y=a.y*T;
   if(a.sprite==='shadow'){shadowAt(x,y,0,.55);return}
   if(a.shadows){shadowAt(x,y+4,0,.45);shadowAt(x+10,y+4,600,.35)}
   sprite(SPR[a.sprite==='monkey'?'monkey':'person'],x,y,a.palette||{},a.alpha,a.flip)});
  v51PlayerSprite(g,P.x*T,P.y*T,GAME_CONFIG.v51View.walk[area.outdoor?'outdoor':'exploreIndoor'],(x,y)=>H18.pixelPerson(g,x,y,null,P.dir));
  if(N&&area.outdoor){g.fillStyle='rgba(8,12,34,.42)';g.fillRect(0,0,CW,CH);
   for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=tileAt(x,y);if(t==='l'||t==='v'){const gr=g.createRadialGradient(x*T+16,y*T+12,4,x*T+16,y*T+12,70);gr.addColorStop(0,t==='v'?'rgba(255,120,120,.22)':'rgba(255,230,150,.30)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x*T-60,y*T-60,150,150)}}}
  if(N&&!area.outdoor){g.fillStyle='rgba(6,8,24,.30)';g.fillRect(0,0,CW,CH)}
  if(N&&fx.flicker&&Math.random()<0.01){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,CW,CH)}
 }
 let exploreRoute=[];
 function routeExplore(tx,ty){if(!area||busy||DM.isOpen()||!P)return;const q=[[P.x,P.y]],start=P.x+','+P.y,vis=new Set([start]),prev=new Map(),valid=new Set();const D=[['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]];if(!blocked(tx,ty))valid.add(tx+','+ty);else D.forEach(([,dx,dy])=>{if(!blocked(tx+dx,ty+dy))valid.add((tx+dx)+','+(ty+dy))});let goal=null;for(let i=0;i<q.length;i++){const [x,y]=q[i],k=x+','+y;if(valid.has(k)){goal=k;break}for(const [dir,dx,dy] of D){const nx=x+dx,ny=y+dy,nk=nx+','+ny;if(vis.has(nk)||blocked(nx,ny))continue;vis.add(nk);prev.set(nk,[k,dir]);q.push([nx,ny])}}const path=[];if(goal){while(goal!==start){const p=prev.get(goal);if(!p)break;path.unshift(p[1]);goal=p[0]}}exploreRoute=path;keys.clear();if(!valid.size||(!path.length&&!valid.has(start)))UI.toast('无法到达所选位置。')}
 function loop(ts){if(!area){return}raf=requestAnimationFrame(loop);if(busy&&!DM.isOpen()){busy=false;refresh()} // 对话被别的方式关掉（返回、跳过）时也恢复移动
  if(!busy&&!DM.isOpen()&&(keys.size||exploreRoute.length)&&ts-lastStep>CFG().stepMs){lastStep=ts;const d=keys.size?[...keys].pop():exploreRoute.shift();step(d)}
  draw()}
 const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 function step(d){if(window.STREET_WALK?.blocked())return;const [dx,dy]=DIRS[d];P.dir=d;const nx=P.x+dx,ny=P.y+dy;
  const ex=(area.exits||[]).find(e=>e.x===nx&&e.y===ny);if(ex&&cond(ex.when)){keepPos();if(ex.node){play(ex.node);return}leave();return}
  if(!blocked(nx,ny)){P.x=nx;P.y=ny;keepPos();if(window.AUDIO)AUDIO.sfx('step');hint();checkTriggers('near');if(!busy&&!DM.isOpen())window.STREET_WALK?.step(area.station,'explore')}}
 function keepPos(){S().pos[area.id]={x:P.x,y:P.y,dir:P.dir};save()}
 /* ---------- 调查 ---------- */
 function targets(){return actorsNow().filter(a=>a.node).map(a=>({kind:'actor',id:a.id,x:a.x,y:a.y,label:a.label||a.name,node:a.node,echo:false})).concat(spotsNow().map(s=>({kind:'spot',id:s.id,x:s.x,y:s.y,label:s.label,node:s.node,echo:!!s.echo,hint:!!s._hint})))}
 const near=t=>Math.abs(t.x-P.x)+Math.abs(t.y-P.y)<=1;
 function facing(){const [dx,dy]=DIRS[P.dir];return targets().find(t=>t.x===P.x+dx&&t.y===P.y+dy)||targets().find(t=>t.x===P.x&&t.y===P.y)||targets().find(near)}
 function interact(t){if(busy||DM.isOpen()||window.STREET_WALK?.blocked())return;t=t||facing();if(!t){UI.toast('附近没有可以调查的东西。');return}
  if(!near(t)){const spots=[[0,1],[0,-1],[1,0],[-1,0]].map(([dx,dy])=>[t.x+dx,t.y+dy]).filter(([x,y])=>!blocked(x,y));if(spots.length){const [x,y]=spots.sort((a,b)=>Math.abs(a[0]-P.x)+Math.abs(a[1]-P.y)-(Math.abs(b[0]-P.x)+Math.abs(b[1]-P.y)))[0];P.x=x;P.y=y;P.dir=t.x>x?'right':t.x<x?'left':t.y>y?'down':'up';keepPos()}}
  if(t.hint){S().fired['hint:'+area.id+':'+t.id]=true;save()}
  if(area.id==='shinagawa'&&t.id==='drain'&&FLOOD.observe('drain',night(),()=>play(t.node)))return;
  play(t.node)}
 function hint(){const el=document.getElementById('ex-hint');if(!el)return;const t=facing();el.textContent=t&&near(t)?'A：'+(t.echo?'🎧 ':'')+t.label:''}
 function checkTriggers(on){if(busy||!area)return;const s=S();
  for(const tr of area.triggers||[]){if(tr.on!==on&&!(on==='near'&&tr.on==='enter'))continue;if(tr.on==='near'&&(Math.abs(P.x-tr.x)+Math.abs(P.y-tr.y))>(tr.r||1))continue;
   const f=s.fired[tr.id];if(tr.once==='day'?f===campaign.day:tr.once!==false&&f)continue;if(!cond(tr.when))continue;
   s.fired[tr.id]=tr.once==='day'?campaign.day:true;save();play(tr.node);return}}
 /* ---------- 残響知覚（解锁后才出现） ---------- */
 function echo(){if(busy||!(window.ECHO&&ECHO.unlocked()))return;const e=(area.echo||[]).find(x=>cond(x.when));const st=ECHO.state();st.uses=(st.uses||0)+1;save();
  if(e){if(ECHO.fragment&&ECHO.fragment()){UI.toast('🎧 '+ECHO.fragmentLine());return}play(e.node);return}const A=(GAME_DATA.d['abilities/echo']||{}).ability||{};UI.toast('🎧 '+(A.none||'这里只有平常的声音。'))}
 /* ---------- 画面 ---------- */
 function refresh(){const hud=document.getElementById('ex-hud');if(!hud||!area)return;const N=night();
  hud.innerHTML=`<span>⏰ ${esc(TM.fmt(clock()))} ${N?'🌙 夜':'☀ 白天'}</span><span>📍 ${esc(area.name)}</span>${area.nightHint&&!N?`<span class="ex-tip">${esc(area.nightHint)}</span>`:''}`;
  const w=document.getElementById('ex-wait');if(w)w.hidden=N||!area.nightHint;
  const e=document.getElementById('ex-echo');if(e)e.hidden=!(window.ECHO&&ECHO.unlocked());
  const list=document.getElementById('ex-list');if(list)list.innerHTML=targets().map(t=>`<button type="button" class="rpg-action${near(t)?' near':''}" data-ex="${esc(t.kind+':'+t.id)}">${t.echo?'🎧 ':''}${esc(t.label)}</button>`).join('')||'<small>（附近没有可以调查的东西）</small>';
  hint()}
 function open(id,opt){
  const a=AREAS[id];if(!a||!campaign)return false;opt=opt||{};stop();area=a;busy=false;pendingLeave=false;
  const s=S();s.visits[id]=(s.visits[id]||0)+1;const pos=opt.pos||s.pos[id]||a.start;P={x:pos.x,y:pos.y,dir:pos.dir||'down'};
  UI.scene('explore',()=>open(id));if(window.AUDIO)AUDIO.ambience(a.ambience||(a.outdoor?'district':'scene'));
  app.innerHTML=`<div class="rpg-shell h18-shell ex-shell"><section class="rpg-panel h18-panel"><div class="h18-top"><div><div class="rpg-kicker">TOKYO // ${esc(a.kicker||'EXPLORE')}</div><h1 class="h18-title">🔦 ${esc(a.name)}</h1></div><button class="rpg-inline-back" id="ex-exit" type="button">← 回到车站</button></div>
   <div id="ex-hud" class="h18-hud"></div>
   <div class="h18-stage"><canvas id="ex-canvas" width="${CW}" height="${CH}" tabindex="0" aria-label="${esc(a.name)}：WASD 或点击/触摸地图移动，空格调查"></canvas></div>
   <div id="ex-hint" class="h18-hint" aria-live="polite"></div><div id="ex-dlg" class="adv-box" hidden aria-live="polite"></div>
   <div class="h18-controls"><div class="h18-pad"><button type="button" data-d="up" aria-label="上">▲</button><button type="button" data-d="left" aria-label="左">◀</button><button type="button" data-d="down" aria-label="下">▼</button><button type="button" data-d="right" aria-label="右">▶</button></div><div class="h18-btns"><button type="button" class="h18-a" id="ex-a" aria-label="调查/交谈">A<small>调查</small></button><button type="button" class="h18-b" id="ex-echo" hidden aria-label="残響知覚">🎧<small>残響</small></button></div></div>
   <div class="ex-tools"><button type="button" class="survival-btn alt" id="ex-wait" hidden>🌙 在附近等到天黑</button></div>
   <div class="h18-hot-list ex-list" id="ex-list"></div>
   <p class="rpg-footnote">${esc(a.footnote||'靠近人物或闪光的地方，按 A（或空格）调查。也可以直接点下面的列表。')}</p></section></div>`;
  cv=document.getElementById('ex-canvas');g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  cv.onclick=e=>{if(busy||DM.isOpen())return;const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*CW/r.width,y=(e.clientY-r.top)*CH/r.height;const t=targets().find(t=>Math.abs(t.x*T+16-x)<22&&Math.abs(t.y*T+16-y)<24);if(t){exploreRoute=[];interact(t)}else routeExplore(Math.floor(x/T),Math.floor(y/T))};
  document.getElementById('ex-exit').onclick=()=>{if(!DM.isOpen())leave()};
  document.getElementById('ex-a').onclick=()=>interact();
  document.getElementById('ex-echo').onclick=echo;
  document.getElementById('ex-wait').onclick=waitNight;
  document.getElementById('ex-list').onclick=e=>{const b=e.target.closest('[data-ex]');if(!b)return;const [k,i]=b.dataset.ex.split(':');interact(targets().find(t=>t.kind===k&&t.id===i))};
  app.querySelectorAll('[data-d]').forEach(b=>{const d=b.dataset.d;const on=e=>{e.preventDefault();keys.clear();keys.add(d);b.setPointerCapture?.(e.pointerId)},off=e=>{e.preventDefault();keys.delete(d)};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)});
  refresh();raf=requestAnimationFrame(loop);window.scrollTo(0,0);
  if(opt.node)play(opt.node);else checkTriggers('enter');
  return true;
 }
 /* 白天 → 夜里：和回酒店一样，用掉今天剩下的行动（时间来到傍晚以后） */
 function waitNight(){if(busy||night())return;UI.confirm('在附近等到天黑？','今天剩下的 '+campaign.actions+' 次行动会用掉，时间来到夜里。',()=>{campaign.actions=0;save();if(typeof survivalUpdate==='function')survivalUpdate();UI.update&&UI.update();refresh();checkTriggers('enter')})}
 function stop(){exploreRoute=[];cancelAnimationFrame(raf);area=null;keys.clear();if(window.DM)DM.close()}
 function leave(){const back=district;stop();if(back&&typeof renderDistrict==='function'){district=back;renderDistrict()}else tokyoHome()}
 function onKey(e){if(!area||/input|textarea/i.test((document.activeElement||{}).tagName||''))return;const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'}[e.key];
  if(m&&!DM.isOpen()){e.preventDefault();if(e.type==='keydown'){exploreRoute=[];if(!keys.has(m)){keys.add(m);if(!busy)step(m);lastStep=performance.now()}}else keys.delete(m);return}
  if(e.type==='keydown'&&(e.key===' '||e.key==='Enter')&&!DM.isOpen()&&!busy&&document.activeElement===cv){e.preventDefault();interact()}}
 document.addEventListener('keydown',onKey);document.addEventListener('keyup',onKey);
 /* ---------- 东京都异闻录（档案页 FILE 05，只显示已经发现的内容） ---------- */
 function archive(){
  const R=campaign&&campaign.kaidan||{},D=KD(),ids=Object.keys(D).filter(id=>R[id]);
  const STATUS=(GAME_DATA.d['explore/kaidan']||{}).statusNames||{};
  return `<section class="rpg-panel et-file ex-file" id="file-5"><div class="et-file-no">FILE 05</div><h2>📜 东京都异闻录</h2>${ids.length?ids.map(id=>{const d=D[id],r=R[id];const li=(list,map)=>list.filter(x=>map&&map[x]).map(x=>`<li>${esc(typeof map[x]==='string'?map[x]:map[x].name+(map[x].desc?'：'+map[x].desc:''))}</li>`).join('');
   const done=!!r.outcome;
   return `<article class="ex-rec"><h3><b>${esc(d.no)}</b> ${esc(d.title)}</h3><div class="et-grid"><div><small>发现地区</small><b>${esc(d.region)}</b></div><div><small>首次遭遇</small><b>${r.first?'DAY '+r.first.day+' · '+esc(r.first.time):'—'}</b></div><div><small>调查状态</small><b>${esc(STATUS[r.status]||r.status||'—')}</b></div><div><small>遭遇次数</small><b>${r.encounters||0}</b></div></div>
    ${r.seen.length?`<h4>亲眼观察到的现象</h4><ul>${li(r.seen,d.observations)}</ul>`:''}${r.evidence.length?`<h4>证据</h4><ul>${li(r.evidence,d.evidence)}</ul>`:''}${r.rules.length?`<h4>已发现的异常规则</h4><ul>${li(r.rules,d.rules)}</ul>`:''}
    ${done?`<h4>事件结果</h4><p>${esc((d.outcomes||{})[r.outcome]||'')}</p>${d.epigraph?`<p class="ex-epi">${esc(d.epigraph)}</p>`:''}`:''}</article>`}).join(''):'<p class="survival-tip">（还没有记录。东京的一些车站附近，流传着奇怪的传闻。）</p>'}</section>`;
 }
 function areaFor(stationId){return Object.values(AREAS).find(a=>a.station===stationId)||null}
 function reset(){if(!campaign)return;delete campaign.explore;delete campaign.kaidan;save()}
 return {open,stop,leave,play,cond,apply,archive,areaFor,areas:AREAS,nodes:NODES,night,reset,interact:id=>interact(targets().find(t=>t.id===id)),targets,
  state:()=>({area:area&&area.id,x:P&&P.x,y:P&&P.y,busy,explore:campaign&&campaign.explore,kaidan:campaign&&campaign.kaidan}),active:()=>!!area};
})();
window.EXPLORE=EXPLORE;
/* ---------- 接入：车站街区画面多一块「探索周边」；东京地图选中车站时提示；档案页 FILE 05 ---------- */
(function(){
 const baseRD=renderDistrict;
 renderDistrict=function(){if(window.EXPLORE&&EXPLORE.active())EXPLORE.stop();baseRD.apply(this,arguments);
  const a=campaign&&district&&EXPLORE.areaFor(district.id);if(!a)return;const r=campaign.kaidan&&a.kaidan&&campaign.kaidan[a.kaidan];
  const first=app.querySelector('.rpg-shell > .rpg-panel');if(!first)return;
  first.insertAdjacentHTML('afterend',`<section class="rpg-panel ex-entry"><h2>🔦 探索周边</h2><p>${esc(a.teaser||'')}</p>${r&&r.outcome?`<p class="survival-tip">📜 东京都异闻录已记录。</p>`:`<p class="survival-tip">❓ ${esc(a.rumorLine||'这一带好像有什么传闻。')}</p>`}<button type="button" class="survival-btn" id="ex-enter">🔦 探索周边：${esc(a.name)}</button></section>`);
  app.querySelector('#ex-enter').onclick=()=>EXPLORE.open(a.id)};
 const basePM=paintMap;
 paintMap=function(){basePM.apply(this,arguments);if(!campaign)return;const a=EXPLORE.areaFor(selected);const box=document.getElementById('station-info');if(a&&box&&!box.querySelector('.ex-mapnote'))box.insertAdjacentHTML('beforeend',`<p class="ex-mapnote">🔦 可以「探索周边」${campaign.kaidan&&campaign.kaidan[a.kaidan]&&campaign.kaidan[a.kaidan].outcome?'（已记录）':'：这里好像有什么传闻'}</p>`)};
 /* v24.1：异闻录是档案 FILE 05（85-ui-shell.js 的 archivePage 调用 EXPLORE.archive()） */
 /* 开发者跳转：#explore=ueno 或 #explore=ueno/ue-man */
 function devJump(){const m=/^#explore=([\w-]+)(?:\/([\w-]+))?/.exec(location.hash||'');if(!m||!campaign)return;setTimeout(()=>EXPLORE.open(m[1],{node:m[2]}),300)}
 window.addEventListener('hashchange',devJump);setTimeout(devJump,800);
})();
