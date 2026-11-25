/* ==== engine/survival/96m-echo-perception.js ==== */
/* ===================================================================
   【残響知覚 ECHO PERCEPTION】
   1) 第一章完美结局（promise）之后的第一次觉醒演出：
      画面一 港屋酒店门外 → 画面二 学生时代的教室 → 画面三 回到现实（安静停顿）→ 觉醒画面。
   2) 演出结束后解锁能力（存档 campaign.abilities.echo），以后在登记过的地点可以主动发动，不消耗 SAN。
   文字：data/abilities/echo.json；时长：config/game.json 的 echo。
   接入：87-hotel-chapter.js 结局画面「回到东京」之后调用 ECHO.after(variant, done)。
   =================================================================== */
const ECHO=(function(){
 const D=()=>GAME_DATA.d['abilities/echo']||{};
 const C=()=>Object.assign({doorMs:1800,overlapMs:1800,runMs:1700,laughMs:1800,pauseMs:2500,fadeMs:1600,cardStepMs:1100},((GAME_CONFIG.echo||{}).awaken)||{});
 const LL=v=>v==null?[]:Array.isArray(v)?v:[v];
 function state(){if(!campaign)return null;campaign.abilities??={};campaign.abilities.echo??={unlocked:false,awakened:false};return campaign.abilities.echo}
 function unlocked(){return !!(campaign&&campaign.abilities&&campaign.abilities.echo&&campaign.abilities.echo.unlocked)}
 function shouldAwaken(variant){return !!campaign&&!unlocked()&&LL((D().awaken||{}).endings).includes(variant)}
 function unlock(){const s=state();if(!s||s.unlocked)return false;s.unlocked=true;s.awakened=true;s.day=campaign.day;s.uses=s.uses||0;if(typeof campaignSave==='function')campaignSave();return true}
 /* 结局之后：完美结局第一次 → 觉醒演出；其他情况直接继续 */
 function after(variant,done){if(shouldAwaken(variant))ROOMFILE.film('street',()=>awaken(done));else done&&done()}

 /* ---------- 像素画 ---------- */
 const W=320,H=200;
 const R=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 function street(g,t,o){ // o.door 0=开着 1=关上；o.people 是否有路人
  const sky=g.createLinearGradient(0,0,0,70);sky.addColorStop(0,'#bcd3e2');sky.addColorStop(1,'#f2e3cc');g.fillStyle=sky;g.fillRect(0,0,W,70);
  R(g,0,40,40,110,'#8f949a');R(g,282,30,38,120,'#9a9590');for(let y=48;y<140;y+=14){R(g,6,y,10,8,'#c9d6dd');R(g,22,y,10,8,'#c9d6dd');R(g,290,y-6,10,8,'#d2d9dc');R(g,304,y-6,10,8,'#d2d9dc')}
  R(g,40,18,242,132,'#c8bfae');for(let y=26;y<92;y+=18)for(let x=52;x<272;x+=26){R(g,x,y,16,11,'#7d8c96');R(g,x+1,y+1,14,4,'#a9bac4')}
  R(g,96,94,130,14,'#2f3a44');g.fillStyle='#f4e7c8';g.font='bold 9px monospace';g.textAlign='center';g.fillText('ミナトヤ  HOTEL',161,104);
  R(g,120,110,82,40,'#5b5048');R(g,124,112,74,38,'#2b2a2c');
  const p=Math.max(0,Math.min(1,o.door)),pw=37,off=(1-p)*pw;
  g.save();g.beginPath();g.rect(124,112,74,38);g.clip();
  [[124-off,1],[161+off,0]].forEach(([x])=>{R(g,x,112,pw,38,'#9fbccb');R(g,x+3,114,2,34,'rgba(255,255,255,.55)');R(g,x+8,114,1,34,'rgba(255,255,255,.35)');R(g,x,112,pw,2,'#6f7f88');R(g,x+pw-1,112,1,38,'#6f7f88')});
  g.restore();
  R(g,0,150,W,26,'#bdb9b0');for(let x=0;x<W;x+=20)R(g,x,150,1,26,'#a7a399');R(g,0,162,W,1,'#a7a399');
  R(g,0,176,W,24,'#55575c');for(let x=(-t/12)%40;x<W;x+=40)R(g,x,187,18,2,'#d8d8d0');
  if(o.people){
   [[(t/40)%380-30,'#2d3340','#e3c3a2'],[W-((t/55+140)%380)+30,'#6b5a4a','#d9b896'],[(t/48+200)%380-30,'#3e4a3c','#e8c8a8']].forEach(([x,c,sk],i)=>{const y=140+(i%2)*6,step=Math.floor(t/180+i)%2;R(g,x,y,6,6,sk);R(g,x,y-1,6,2,'#222');R(g,x-1,y+6,8,10,c);R(g,x+(step?0:4),y+16,2,6,'#222');R(g,x+(step?4:0),y+16,2,5,'#222')});
   const cx=((t/9)%600)-120;R(g,cx,178,44,12,'#e8e6e0');R(g,cx+8,172,26,7,'#cfd6da');R(g,cx+5,189,8,4,'#111');R(g,cx+31,189,8,4,'#111');
  }
  const sun=g.createLinearGradient(0,0,W,0);sun.addColorStop(0,'rgba(255,236,200,.22)');sun.addColorStop(1,'rgba(255,236,200,0)');g.fillStyle=sun;g.fillRect(0,0,W,H);
 }
 /* 坐着的学生（从桌子后面看过去：头 + 上身） */
 function seated(g,x,y,s){
  const b=s.bob?Math.round(s.bob):0;y+=b;
  R(g,x,y,12,11,s.skin||'#efcfae');
  R(g,x-1,y-2,14,5,s.hair||'#1b1a1f');if(s.girl){R(g,x-2,y,3,13,s.hair||'#1b1a1f');R(g,x+11,y,3,13,s.hair||'#1b1a1f')}else R(g,x-1,y,2,4,s.hair||'#1b1a1f');
  R(g,x+3,y+5,2,2,'#2a2228');R(g,x+8,y+5,2,2,'#2a2228');if(s.smile)R(g,x+4,y+8,5,1,'#a0524a');
  if(s.girl){R(g,x-3,y+11,18,12,'#1f2a4a');R(g,x-3,y+11,18,3,'#e9e9ef');R(g,x+4,y+13,4,4,'#c0392b')}
  else{R(g,x-3,y+11,18,12,'#1a1b22');R(g,x+3,y+11,6,2,'#2c2d36');R(g,x+5,y+14,2,2,'#d4b45a');R(g,x+5,y+19,2,2,'#d4b45a')}
 }
 function runner(g,x,y,f){ // 年轻的片山（立绘：黑色学生服，笑着跑）
  R(g,x,y,12,11,'#efcfae');R(g,x-1,y-2,14,5,'#141318');R(g,x-1,y,2,4,'#141318');R(g,x+3,y+5,2,2,'#2a2228');R(g,x+8,y+5,2,2,'#2a2228');R(g,x+3,y+8,6,1,'#a0524a');R(g,x+4,y+9,4,1,'#a0524a');
  R(g,x-2,y+11,16,14,'#1a1b22');R(g,x+5,y+14,2,2,'#d4b45a');R(g,x+5,y+19,2,2,'#d4b45a');
  const a=f%2;R(g,x-4,y+12+(a?0:4),3,8,'#1a1b22');R(g,x+13,y+12+(a?4:0),3,8,'#1a1b22');
  R(g,x+(a?0:6),y+25,4,11,'#1a1b22');R(g,x+(a?7:1),y+25,4,9,'#1a1b22');R(g,x+(a?-1:5),y+35,6,2,'#111');R(g,x+(a?6:0),y+33,6,2,'#111');
 }
 function classroom(g,t,o){ // o.kx 片山的位置，o.laugh 笑
  R(g,0,0,W,118,'#eadfc4');R(g,0,108,W,10,'#cbb894');
  R(g,96,14,150,58,'#2f4a3a');R(g,93,11,156,4,'#8a6a46');R(g,93,72,156,4,'#8a6a46');R(g,110,76,22,2,'#f2f2f2');
  g.fillStyle='rgba(240,240,230,.75)';g.font='8px monospace';g.textAlign='left';g.fillText('六月十二日（木）',108,30);g.fillText('日直　渡辺',108,44);
  R(g,6,8,74,96,'#8a6a46');[[10,12],[44,12],[10,58],[44,58]].forEach(([x,y])=>{R(g,x,y,32,42,'#cfe6f0');R(g,x+3,y+3,4,30,'rgba(255,255,255,.7)')});
  R(g,268,24,40,88,'#9b7a52');R(g,272,30,32,30,'#d9e6ea');R(g,306,64,2,8,'#5d4630');
  R(g,0,118,W,82,'#a77748');for(let y=124;y<H;y+=11)R(g,0,y,W,1,'#8e6338');for(let x=(0);x<W;x+=46)R(g,x,118,1,82,'#93683c');
  g.fillStyle='rgba(255,236,170,.20)';g.beginPath();g.moveTo(10,12);g.lineTo(78,12);g.lineTo(200,200);g.lineTo(40,200);g.closePath();g.fill();
  const L=o.laugh?Math.sin(t/90):0,smile=!!o.laugh;
  seated(g,112,100,{girl:true,hair:'#231c1c',bob:L*1.2,smile});        // 小川
  seated(g,140,98,{hair:'#16151a',bob:L*1.5,smile:true});                // 渡边（喊片山的人）
  seated(g,168,100,{hair:'#1d1b1b',bob:L,smile});                        // 田中
  seated(g,196,100,{girl:true,hair:'#2a2020',bob:-L*1.1,smile});        // 木村
  R(g,100,122,138,16,'#c79a5e');R(g,100,122,138,2,'#e0b97c');for(let x=100;x<238;x+=27.6)R(g,Math.round(x),122,1,16,'#a87d48');
  R(g,104,138,3,22,'#6a6a70');R(g,232,138,3,22,'#6a6a70');R(g,150,138,3,22,'#6a6a70');R(g,190,138,3,22,'#6a6a70');
  const box=(x,open)=>{if(open){R(g,x,123,16,9,'#3a3a3a');R(g,x+1,124,9,7,'#f7f3e8');R(g,x+5,126,2,2,'#c0392b');R(g,x+10,124,5,3,'#e2b13c');R(g,x+10,127,5,4,'#6aa04a')}else{R(g,x,122,16,10,'#5b7fb0');R(g,x+6,119,4,4,'#5b7fb0');R(g,x+3,124,10,1,'#7d9cc7')}};
  box(114,1);box(142,1);box(198,1);
  const untie=o.untie||0;box(170,untie>0.98);if(untie<=0.98){R(g,169+Math.sin(t/120)*1.5,126,3,3,'#efcfae');R(g,184-Math.sin(t/120)*1.5,126,3,3,'#efcfae')}
  R(g,224,104,18,18,'#8a6a46');R(g,224,104,18,3,'#a8875f'); // 空着的椅子
  if(o.kx!=null)runner(g,o.kx,o.ky??84,Math.floor(t/110));
  const v=g.createRadialGradient(W/2,H/2,60,W/2,H/2,200);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(40,22,6,.5)');g.fillStyle=v;g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,214,150,.13)';g.fillRect(0,0,W,H);
 }

 /* ---------- 觉醒演出 ---------- */
 let root=null,raf=0;
 function awaken(done){
  const A=D().awaken||{},T=C(),card=A.card||{};
  if(root)root.remove();cancelAnimationFrame(raf);
  if(window.DM&&DM.isOpen&&DM.isOpen())DM.close();
  root=document.createElement('div');root.className='echo-root';root.setAttribute('role','dialog');root.setAttribute('aria-label','残響知覚');
  root.innerHTML=`<div class="echo-stage"><canvas width="${W}" height="${H}" aria-hidden="true"></canvas><div class="echo-flash"></div></div>
   <div class="echo-box" hidden><b class="echo-who"></b><p class="echo-jp" lang="ja"></p><p class="echo-zh"></p><span class="echo-next">▶</span></div>
   <div class="echo-black"></div>
   <div class="echo-card" hidden><small class="echo-k">${esc(card.kicker||'')}</small><h1 lang="ja">${esc(card.name||'')}</h1><small class="echo-en">${esc(card.en||'')}</small><hr>${LL(card.lines).map(l=>`<p>${esc(l)}</p>`).join('')}<button type="button" class="story-btn echo-go" hidden>▶</button></div>`;
  document.body.appendChild(root);document.body.classList.add('echo-on');
  const cv=root.querySelector('canvas'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const box=root.querySelector('.echo-box'),black=root.querySelector('.echo-black'),flash=root.querySelector('.echo-flash');
  const wait=ms=>new Promise(r=>setTimeout(r,ms));const set=p=>root.dataset.phase=p;
  (async()=>{black.style.opacity='1';window.AUDIO?.ambience('none');set('card');unlock();
   const cd=root.querySelector('.echo-card');cd.hidden=false;const parts=[...cd.children];parts.forEach(p=>p.classList.add('echo-hide'));
   for(const p of parts){if(p.classList.contains('echo-go'))continue;p.classList.remove('echo-hide');await wait(T.cardStepMs)}
   const btn=cd.querySelector('.echo-go');btn.hidden=false;btn.classList.remove('echo-hide');btn.focus();
   btn.onclick=()=>{set('done');root.remove();root=null;document.body.classList.remove('echo-on');done&&done()};
  })();
 }

 /* ---------- 主动发动（以后的调查地点） ---------- */
 function key(){if(window.H18&&H18.active&&H18.active()){const s=H18.state();if(s.scene)return s.scene}return 'place:'+(window.FILES?FILES.place():'')}
 function traces(k){if(!unlocked())return [];return LL((D().scenes||{})[k||key()]).filter(x=>{if(!x.when)return true;try{return window.H18?H18.cond(x.when):false}catch(e){return false}})}
 function use(k){
  if(!unlocked())return null;const list=traces(k),A=D().ability||{},s=state();s.uses=(s.uses||0)+1;
  const cost=(GAME_CONFIG.echo||{}).sanCost||0;if(cost&&typeof GS!=='undefined')GS.change({san:-cost},'残響知覚');
  if(typeof campaignSave==='function')campaignSave();
  const html=list.length?list.map(x=>`<div class="story-entry echo-trace ${esc(x.kind||'memory')}"><b>${esc(x.title||'')}</b>${x.jp?`<p class="et-jp" lang="ja">${esc(x.jp)}</p>`:''}<p>${esc(x.text||'')}</p></div>`).join(''):`<p class="survival-tip">${esc(A.none||'')}</p>`;
  if(typeof UI!=='undefined')UI.modal({title:'🎧 '+(A.name||'残響知覚'),html});
  return list;
 }
 function archive(){
  if(!unlocked())return '';const A=D().ability||{},s=state();
  return `<section class="rpg-panel et-file echo-file" id="file-echo"><div class="et-file-no">ABILITY · ${esc(A.en||'')}</div><h2>🎧 ${esc(A.name||'')}</h2><p class="survival-tip">${esc(A.desc||'')}</p><div class="et-grid"><div><small>觉醒</small><b>DAY ${s.day||'-'}</b></div><div><small>发动次数</small><b>${s.uses||0}</b></div></div><button type="button" class="survival-btn alt" id="echo-use">🎧 在这里静下来听</button></section>`;
 }
 return {classroom,seated,street,state,unlocked,shouldAwaken,after,awaken,unlock,traces,use,archive,key};
})();
window.ECHO=ECHO;
/* 档案页：调查员档案下面显示能力（解锁之后） */
if(window.FILES){const baseInv=FILES.investigator;FILES.investigator=function(){return baseInv.apply(this,arguments)+ECHO.archive()}}
document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('#echo-use');if(b)ECHO.use()});
