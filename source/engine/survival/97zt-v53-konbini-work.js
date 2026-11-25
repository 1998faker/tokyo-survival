/* ==== engine/survival/97zt-v53-konbini-work.js ==== */
/* v53：便利店打工 · 全店视角 ↔ 柜台特写（改动 8 · 只改呈现层）
   - 顶部班次 HUD（店名、剩余、排队、已接待、SHIFT、全店 / 柜台页签、工作手册、提前下班）两个视角共用
   - 全店视角（柜台没有顾客时）：本店整张布局图，你在收银台后，顾客沿脚印排队，货架会亮「欠品」
   - 柜台特写（顾客走到收银台时自动切过来）：画面下半是台面；热柜、顾客放下的商品、扫描器、微波炉、袋子 A/B、
     收银机小票都在画面里；顾客的话与回答在底部对话框；收款弹窗只盖画面中部
   - 柜台特写里的每个物件，都是原来 KONBINI 工作台上的同一个按钮 / 拖放区（只是被摆到画面里的位置），
     所以拖拽、点选、加热、装袋、收款、找零的判定全部还是原来的代码。
   - FamilyMark 的柜台在店的右边：特写左右镜像。Seven Twelve 的柜台靠门口：背景带入口。
   - 窄屏（竖着的手机）退回原来的上下排布。 */
const KWORK=(function(){
 const SPR={down:['.....hhhhhh.....','....hhhhhhhh....','....hhhhhhhh....','....hssssssh....','....sesssses....','....ssssssss....','.....ssmmss.....','......ssss......','....bbbbbbbb....','...bbbaaaabbb...','...sbbaaaabbs...','...sbbaaaabbs...','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....kkk..kkk....'],
  right:['.....hhhhhh.....','....hhhhhhhh....','....hhhhssss....','....hhhhssss....','....hhhssses....','....hhssssss....','.....ssssmm.....','......ssss......','....bbbbbbbb....','....bbbbbabb....','....bbsbbbbb....','....bbsbbbbb....','....pppppppp....','.....pp..pp.....','.....pp..pp.....','.....kk..kk.....'],
  up:['.....hhhhhh.....','....hhhhhhhh....','....hhhhhhhh....','....hhhhhhhh....','....hhhhhhhh....','....shhhhhhs....','.....ssssss.....','......ssss......','....bbbbbbbb....','...bbbbbbbbbb...','...sbbbbbbbbs...','...sbbbbbbbbs...','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....kkk..kkk....']};
 const PAL=[{h:'#3a3a3a',s:'#d8c6b4',b:'#35404e',p:'#22262e',k:'#111'},{h:'#8a6a4a',s:'#d8c6b4',b:'#c26a3a',p:'#4a4a5a',k:'#222'},{h:'#bdbdbd',s:'#d8c6b4',b:'#3a5a8a',p:'#2a2e36',k:'#111'},{h:'#1e1a18',s:'#e2c2a6',b:'#6a8a5a',p:'#3a3a44',k:'#111'},{h:'#5a3a2a',s:'#d8b89a',b:'#8a3a5a',p:'#2a2a30',k:'#111'}];
 const SHELF={moson:['bento','bread','snack','daily'],familymark:['bento','daily','bread','snack'],seventwelve:['daily','snack','sale','bento']};
 /* 柜台特写的取景（每家店的布局图里，柜台背后那一段货架 / 入口） */
 const CTR={
  moson:{mirror:false,top:'#eef2f8',wall:[640,330,500,300],door:null},
  familymark:{mirror:true,top:'#f3f5ef',wall:[330,345,520,310],door:null},
  seventwelve:{mirror:false,top:'#f3d6a6',wall:[380,80,520,300],door:[30,1065,385,195]}
 };
 /* 柜台特写里每个物件的位置（占画面的比例：左、上、宽、高）——以 MŌSON 为准，FamilyMark 左右镜像 */
 const R={hot:[.02,.215,.17,.235],shelf:[.205,.265,.065,.185],mic:[.545,.255,.16,.19],tray:[.025,.47,.39,.27],scan:[.43,.48,.085,.15],bin:[.43,.655,.085,.04],bagA:[.535,.5,.085,.19],bagB:[.63,.5,.085,.19],pos:[.76,.235,.215,.555],dlg:[.015,.865,.97,.125],pay:[.33,.06,.37,0],flash:[.27,.37,.42,0],info:[.025,.745,.39,0],steps:[.57,.872,.4,0],guide:[.25,.02,.5,0],pop:[.02,.05,.22,0]};
 /* 商品图标（三品牌通用 v2）：按商品类型固定对应 */
 const ICON={onigiri:'meal/onigiri',bento:'meal/bento',sakeben:'meal/bento',noriben:'meal/bento',karaben:'meal/bento',hamben:'meal/bento',shogaben:'meal/bento',pasta:'meal/curry_rice',salad:'meal/bento',
  tea:'drink/tea',coffee:'drink/coffee',melonpan:'bakery/melon_pan',sandwich:'bakery/sandwich',icecream:'frozen/ice_cream',gyoza:'frozen/frozen_dumplings',karaage:'hot_food/fried_chicken',nikuman:'hot_food/steamed_bun',cake:'chilled_dessert/cake',paper:'daily/newspaper'};
 const icon=id=>{const k=ICON[id];return k&&(window.KONBINI_ICONS||{})[k]||null};
 function decorate(root){const o=KONBINI.state()&&KONBINI.state().cur;if(!o)return;root.querySelectorAll('.kb-item[data-item]').forEach(el=>{if(el.querySelector('.kbs-ico'))return;const it=o.items.find(x=>x.uid===el.dataset.item);if(it&&it.anomaly){const ic=el.querySelector('.kb-ic');if(ic)ic.innerHTML='<span class="kbs-noname"></span>';return}const src=it&&!it.anomaly&&icon(it.id);const ic=el.querySelector('.kb-ic');if(!src||!ic)return;ic.innerHTML='<img class="kbs-ico" alt="" draggable="false" src="'+src+'">'})}
 const FIX=new Set([R.dlg,R.steps,R.pay,R.flash,R.guide]);
 let shell=null,stage=null,hud=null,cv=null,g=null,timer=0,flags={},dragUid=null,store=null,view=null,lastBub='',mode='store',forced=null,forcedFor=null,mo=null,lcd=null,drawnKey='';
 const art=k=>(window.KONBINI_ART||{})[k]||'';
 const imgs={};function img(k){if(!imgs[k]){const i=new Image();i.onload=()=>{drawnKey='';tick()};i.src=art(k);imgs[k]=i}return imgs[k]}
 function storeId(){
  const P=KSHOP.pool();const k=campaign&&campaign.konbini;
  const cand=[k&&k.store,(typeof district!=='undefined'&&district&&district.id),campaign&&campaign.location,'shinagawa'];
  for(const c of cand)if(c&&P.includes(c))return c;return P[0]||null;
 }
 function setStore(id){if(!campaign)return;campaign.konbini??={};campaign.konbini.store=id;campaignSave()}
 const bk=()=>KSHOP.brandOf(store)||'moson';
 const B=()=>KSHOP.BR[bk()];
 const wide=()=>window.innerWidth>=820;
 const fmt=ms=>{const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
 /* ---------- 挂载 ---------- */
 function mount(){
  const root=document.getElementById('kb-root');if(!root||document.getElementById('kbs-stage'))return;
  store=storeId();if(!store)return;const br=B();
  shell=root.parentNode;shell.classList.add('kbs-shell');shell.style.setProperty('--brand',br.color);
  const st=(typeof byId!=='undefined'&&byId[store])||{jp:''};
  hud=document.createElement('div');hud.className='kbs-hud';
  hud.innerHTML=`<span class="kbs-nm">${br.name} · ${br.en}　${esc(st.jp||'')}店</span><span>⏱ <b id="kbs-left">—</b><small>班次剩余</small></span><span>🧍 <b id="kbs-q">0</b><small>排队</small></span><span>✓ <b id="kbs-ok">0</b><small>已接待</small></span><span id="kbs-n">SHIFT 1</span><span class="kbs-sp"></span><span class="kbs-tabs"><button type="button" data-kbs-view="store">🏪 全店</button><button type="button" data-kbs-view="counter">🧾 柜台</button></span><button type="button" data-kbs-proxy="kb-manual">📘 工作手册</button><button type="button" data-kbs-proxy="kb-quit" id="kbs-quit">提前下班</button>`;
  stage=document.createElement('div');stage.id='kbs-stage';stage.className='kbs-stage';
  stage.innerHTML=`<canvas></canvas><div class="kbs-flags"></div><div class="kbs-ring" hidden><span></span></div><div class="kbs-bub" hidden></div><div class="kbs-lcd" hidden></div><div class="kbs-tags"></div>`;
  shell.insertBefore(hud,root);shell.insertBefore(stage,root);
  cv=stage.querySelector('canvas');g=cv.getContext('2d');lcd=stage.querySelector('.kbs-lcd');
  stage.addEventListener('click',onStage);
  hud.addEventListener('click',e=>{const b=e.target.closest('[data-kbs-proxy]');if(b){const t=document.getElementById(b.dataset.kbsProxy);if(t)t.click();return}const v=e.target.closest('[data-kbs-view]');if(v){const s=KONBINI.state();forced=v.dataset.kbsView;forcedFor=s&&s.cur?s.cur.id:null;drawnKey='';tick()}});
  if(mo)mo.disconnect();mo=new MutationObserver(()=>placeRoot());mo.observe(root,{childList:true});
  for(const k of ['moson','familymark','seventwelve'])img(k);
  drawnKey='';clearInterval(timer);timer=setInterval(tick,200);tick();
  if(!wide()&&window.innerHeight>window.innerWidth&&!mount.hinted){mount.hinted=true;UI.toast('📱 把手机横过来，打工会更顺手。')}
 }
 /* ---------- 视角 ---------- */
 function wantMode(){
  const s=KONBINI.state();if(!wide())return 'narrow';
  const o=s&&s.cur;if(forced&&forcedFor!==(o?o.id:null)){forced=null}
  if(forced)return forced;return o?'counter':'store';
 }
 /* ---------- 柜台特写：把原来工作台上的按钮摆进画面 ---------- */

 /* 柜台素材包（v1）：每个品牌 1 张背景 + 7 件设备；按比例缩放，底边落在台面上 */
 const CA=()=>(window.KONBINI_COUNTER||{})[bk()]||null;
 const cimg={};function cim(k){const a=CA();if(!a||!a[k])return null;const id=bk()+k;if(!cimg[id]){const i=new Image();i.onload=()=>{drawnKey='';tick()};i.src=a[k];cimg[id]=i}return cimg[id]}
 let layCache=null;
 function LAY(){
  const W=stage.clientWidth,H=stage.clientHeight,key=bk()+W+'x'+H;if(layCache&&layCache.k===key)return layCache;
  const a=CA(),M=(a&&a.meta)||{},ar=n=>(M[n]||{}).ar||1,c=CTR[bk()];
  const T=H*.43,back=T+H*.03,keys={};
  const put=(k,x,bottom,h,maxW)=>{let w=h*H*ar(k==='hot'?'hot_cabinet':k==='shelf'?'counter_rack':k==='mic'?'microwave':k==='scan'?'scanner':k==='bagA'?'bag_ambient':k==='bagB'?'bag_cold':'pos')/W;if(maxW&&w>maxW){h=h*maxW/w;w=maxW}keys[k]={x:x*W,y:(typeof bottom==='number'?bottom:0)-h*H,w:w*W,h:h*H};return keys[k]};
  const hot=put('hot',.015,back,.27);
  put('shelf',(hot.x+hot.w)/W+.012,back,.25);
  put('mic',.53,back,.2);
  const pos=put('pos',0,H*.86,ar('pos')>.8?.64:.72,.3);pos.x=W*.985-pos.w;
  const sc=put('scan',.405,H*.80,.23);
  const A=put('bagA',.51,H*.82,.2);put('bagB',(A.x+A.w)/W+.01,H*.82,.2);
  keys.tray={x:W*.02,y:T+H*.05,w:W*.36,h:H*.2};
  keys.bin={x:sc.x-W*.058,y:H*.80-H*.115,w:W*.048,h:H*.115};
  keys.info={x:W*.02,y:T+H*.012,w:W*.38,h:0};
  if(c.mirror)for(const k in keys)keys[k].x=W-keys[k].x-keys[k].w;
  const scr=(M.pos||{}).screen||[.06,.12,.88,.68];
  keys.screen={x:pos.x+scr[0]*pos.w,y:pos.y+scr[1]*pos.h,w:scr[2]*pos.w,h:scr[3]*pos.h};
  return layCache={k:key,T,keys};
 }
 function box(r){const L=LAY();for(const k in L.keys)if(R[k]===r)return L.keys[k];const c=CTR[bk()],W=stage.clientWidth,H=stage.clientHeight;let [l,t,w,h]=r;if(c.mirror&&!FIX.has(r))l=1-l-w;return {x:l*W,y:t*H,w:w*W,h:h*H}}
 function put(el,r,auto){if(!el)return;const b=box(r);el.style.left=b.x+'px';el.style.top=b.y+'px';el.style.width=b.w+'px';if(!auto)el.style.height=b.h+'px'}
 function placeRoot(){
  const root=document.getElementById('kb-root');if(!root||!stage)return;
  if(mode!=='counter'){root.querySelectorAll('[style]').forEach(el=>{if(el.dataset.kbsPlaced){el.removeAttribute('style');delete el.dataset.kbsPlaced}});return}
  {const a=root.querySelector('[data-zone=bagA]>span'),b=root.querySelector('[data-zone=bagB]>span'),sc=root.querySelector('.kb-scan>span');if(a)a.textContent='A 常温・热的';if(b)b.textContent='B 冷的 ❄';if(sc)sc.textContent='▣ スキャナー（扫码）'}
  decorate(root);const q=s=>root.querySelector(s),mark=el=>{if(el)el.dataset.kbsPlaced=1;return el};
  put(mark(q('.kb-counter')),R.tray);put(mark(q('.kb-scan')),R.scan);put(mark(q('.kb-mic')),R.mic);
  put(mark(q('[data-zone=hotcase]')),R.hot);put(mark(q('[data-zone=shelf]')),R.shelf);put(mark(q('.kb-bin')),R.bin);
  put(mark(q('[data-zone=bagA]')),R.bagA);put(mark(q('[data-zone=bagB]')),R.bagB);
  const pos=mark(q('.kb-pos'));if(pos){const b=LAY().keys.screen;pos.style.left=b.x+'px';pos.style.top=b.y+'px';pos.style.width=b.w+'px';pos.style.height=b.h+'px'}
  put(mark(q('.kb-top')),R.dlg);{const says=root.querySelectorAll('.kb-cust-main > .kb-say');says.forEach((e,i)=>e.classList.toggle('kbs-last',i===says.length-1))}put(mark(q('.kb-flash')),R.flash,1);put(mark(q('.kb-info')),R.info,1);put(mark(q('.kb-steps')),R.steps,1);put(mark(q('.kb-guide')),R.guide,1);put(mark(q('.kb-pop')),R.pop,1);
  /* 收款弹窗：三块叠成一个面板，位置相对收银机算 */
  if(pos){const pb=LAY().keys.screen,pp=box(R.pay);let y=pp.y;for(const sel of ['.kb-paybtns','.kb-devices','.kb-cashbox']){const el=mark(pos.querySelector(sel));if(!el)continue;el.style.left=(pp.x-pb.x)+'px';el.style.top=(y-pb.y)+'px';el.style.width=pp.w+'px';y+=el.offsetHeight}}
 }
 /* ---------- 画面 ---------- */
 function px(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
 function shade(hex,a){let n=parseInt(hex.slice(1),16),r=(n>>16)+a,gg=(n>>8&255)+a,b=(n&255)+a;r=Math.max(0,Math.min(255,r));gg=Math.max(0,Math.min(255,gg));b=Math.max(0,Math.min(255,b));return '#'+((1<<24)+(r<<16)+(gg<<8)+b).toString(16).slice(1)}
 function person(x,y,pal,dir,S,o){const rows=SPR[dir==='left'?'right':dir],flip=dir==='left';g.globalAlpha=o&&o.ghost?0.45:1;g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+3*S,y+15.5*S,10*S,S);
  for(let r=0;r<16;r++)for(let i=0;i<16;i++){let k=rows[r][i];if(k==='.')continue;if(o&&o.faceless&&(k==='e'||k==='m'))k='s';const col=k==='e'?'#1b1b24':k==='m'?'#b0605a':pal[k];if(!col)continue;g.fillStyle=col;g.fillRect(Math.round(x+(flip?15-i:i)*S),Math.round(y+r*S),Math.ceil(S),Math.ceil(S))}g.globalAlpha=1}
 function seeded(n){let h=(n*2654435761)>>>0||1;return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return ((h>>>0)%10000)/10000}}
 function drawCounter(running){
  const W=cv.width,H=cv.height,L=LAY(),K=L.keys,a=CA(),M=(a&&a.meta)||{};
  g.imageSmoothingEnabled=false;g.clearRect(0,0,W,H);
  /* 背景：台面以上等比缩放（台面线对齐 T），台面往下拉伸到对话框 */
  const bg=cim('bg');
  if(bg&&bg.complete&&bg.naturalWidth){const iw=bg.naturalWidth,ih=bg.naturalHeight,sx=W/iw,ct=M.ctop*ih,st=M.stripe*ih,top=Math.max(0,ct-L.T/sx),dh=(ct-top)*sx;
   g.drawImage(bg,0,top,iw,ct-top,0,L.T-dh,W,dh);const bot=H*.855;g.drawImage(bg,0,ct,iw,st-ct,0,L.T,W,bot-L.T);g.drawImage(bg,0,st,iw,ih-st,0,bot,W,(ih-st)*sx);
   const SG={moson:[[754,18,1172,92,'スナック · SNACKS']],familymark:[[754,10,1082,60,'お菓子 · SNACKS'],[754,280,1082,326,'お弁当 · BENTO']],seventwelve:[[150,292,730,322,'スナック','r'],[1154,66,1228,110,'入口']]}[bk()]||[];
   const k=iw/1915;for(const [x0,y0,x1,y1,txt,al] of SG){const X=x0*k*sx,Y=L.T-(ct-y0*k)*sx,w=(x1-x0)*k*sx,h=(y1-y0)*k*sx;if(Y<0)continue;let f=Math.floor(h*(al==='r'?.85:.72));g.font='900 '+f+'px "Noto Sans CJK JP",sans-serif';while(f>8&&g.measureText(txt).width>w*.9){f--;g.font='900 '+f+'px "Noto Sans CJK JP",sans-serif'}const tx=al==='r'?X+w-g.measureText(txt).width/2-h*.6:X+w/2;g.fillStyle='rgba(0,0,0,.35)';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,tx+1,Y+h/2+2);g.fillStyle='#fff';g.fillText(txt,tx,Y+h/2+1);g.textAlign='left';g.textBaseline='alphabetic'}
   if(L.T-dh>0){g.fillStyle='#2a2f3a';g.fillRect(0,0,W,L.T-dh)}g.fillStyle='#232a36';g.fillRect(0,bot+(ih-st)*sx,W,H)}
  const draw=(k,n)=>{const i=cim(n),b=K[k];if(!i||!i.complete||!i.naturalWidth||!b)return;g.fillStyle='rgba(0,0,0,.22)';g.fillRect(b.x+b.w*.08,b.y+b.h-4,b.w*.84,8);g.imageSmoothingEnabled=true;g.drawImage(i,b.x,b.y,b.w,b.h);g.imageSmoothingEnabled=false};
  draw('shelf','counter_rack');draw('hot','hot_cabinet');draw('mic','microwave');draw('scan','scanner');draw('bagA','bag_ambient');draw('bagB','bag_cold');draw('pos','pos');
  /* 热柜价签（动态） */
  const hb=K.hot,pl=(M.hot_cabinet||{}).plates||[];
  ['karaage','nikuman'].forEach((id,i)=>{const p=pl[i];if(!p||!hb)return;const d=KONBINI.itemDef(id)||{};const x=hb.x+p[0]*hb.w,y=hb.y+p[1]*hb.h,w=p[2]*hb.w,h=p[3]*hb.h;g.fillStyle='#ffd77a';g.font='bold '+Math.max(10,Math.round(h*.8))+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('¥'+(d.price||''),x+w/2,y+h/2+1);g.textAlign='left';g.textBaseline='alphabetic'});
  /* 微波炉运行中：门窗亮暖光 */
  if(running&&K.mic){const m=K.mic;g.fillStyle='rgba(255,190,80,.38)';g.fillRect(m.x+m.w*.07,m.y+m.h*.2,m.w*.56,m.h*.6)}
  /* 废弃箱：扫码器旁的小垃圾桶；没有条码的商品出现时微微发亮 */
  const bn=K.bin;if(bn){const st=KONBINI.state(),glow=!!(st&&st.cur&&st.cur.items.some(x=>x.anomaly&&x.state!=='void'&&x.state!=='bin'));
   g.fillStyle='rgba(0,0,0,.22)';g.fillRect(bn.x+bn.w*.05,bn.y+bn.h-3,bn.w*.9,7);
   if(glow){g.fillStyle='rgba(120,200,255,.22)';g.fillRect(bn.x-6,bn.y-6,bn.w+12,bn.h+10)}
   px(bn.x+bn.w*.1,bn.y+bn.h*.22,bn.w*.8,bn.h*.78,'#59616e');px(bn.x+bn.w*.1,bn.y+bn.h*.22,bn.w*.8,4,'#7d8594');
   for(let i=1;i<4;i++)px(bn.x+bn.w*(.1+.2*i),bn.y+bn.h*.32,2,bn.h*.6,'#4a515c');
   px(bn.x,bn.y+bn.h*.12,bn.w,bn.h*.12,glow?'#8fd0ff':'#3a3f48');px(bn.x+bn.w*.38,bn.y+bn.h*.04,bn.w*.24,bn.h*.08,'#3a3f48');
   g.fillStyle='#e8ecf2';g.font='bold '+Math.max(9,Math.round(bn.w*.22))+'px sans-serif';g.textAlign='center';g.fillText('廃棄',bn.x+bn.w/2,bn.y+bn.h*.62);g.textAlign='left'}
  /* 异常客人：台面前沿慢慢渗出水渍 */
  const cu=KONBINI.state()&&KONBINI.state().cur;if(cu&&cu.wet){const t0=cu.wetAt||(cu.wetAt=performance.now()),k=Math.min(1,(performance.now()-t0)/6000),top=L.T,R2=seeded(cu.id);
   for(let i=0;i<9;i++){const x=R2()*W,w=W*(.04+R2()*.08)*(.4+.6*k),h=H*(.02+R2()*.05)*k;g.fillStyle='rgba(40,70,100,'+(.18+.12*k)+')';g.beginPath();g.ellipse(x,top+H*.02+R2()*H*.08,w,h,0,0,Math.PI*2);g.fill();
    if(R2()<.5){g.fillStyle='rgba(40,70,100,.22)';g.fillRect(x-1,top+H*.02,3,H*(.05+.15*k)*R2())}}}
  /* POS 屏幕底色（素材屏幕区有半透明像素） */
  const s=K.screen;g.fillStyle='#071c14';g.fillRect(s.x,s.y,s.w,s.h);
 }
 function drawStore(s){
  const W=cv.width,H=cv.height,br=B(),A=img(bk());g.imageSmoothingEnabled=false;g.clearRect(0,0,W,H);
  const sc=W/1920,vis=H/sc;let top=Math.max(0,Math.min(1280-vis,br.me[1]-vis*.45));view={x0:0,y0:top,sc,W,H};
  if(A.complete&&A.naturalWidth)g.drawImage(A,0,top,1920,vis,0,0,W,H);
  const P=(x,y)=>[(x-view.x0)*sc,(y-view.y0)*sc],S=6*sc;
  const [mx,my]=P(br.me[0],br.me[1]);person(mx,my,{h:'#2a2220',s:'#e2b89a',b:br.color,a:'#f5f5f5',p:'#2a2e36',k:'#111'},br.me[2],S);px(mx+4*S,my,8*S,2*S,br.color);
  const o=s.cur,n=(o?1:0)+Math.min(3,s.queue.length);
  for(let i=0;i<n;i++){const qq=br.queue[i];if(!qq)break;const [x,y]=P(qq[0],qq[1]);const cur=i===0&&o?o:null;person(x,y,PAL[((cur?cur.id:s.served.length+i)||i)%PAL.length],qq[2],S,{faceless:true,ghost:!!(cur&&(cur.wet||cur.ghost))})}
  return P;
 }
 function tick(){
  if(!stage||!stage.isConnected){clearInterval(timer);timer=0;stage=null;if(mo)mo.disconnect();return}
  const s=KONBINI.state();if(!s)return;const br=B();
  const want=wantMode();if(want!==mode){mode=want;drawnKey='';}
  shell.classList.toggle('kbs-c',mode==='counter');shell.classList.toggle('kbs-s',mode==='store');shell.classList.toggle('kbs-n',mode==='narrow');
  hud.querySelectorAll('[data-kbs-view]').forEach(b=>b.classList.toggle('on',b.dataset.kbsView===mode));
  const q=id=>document.getElementById(id);
  q('kbs-left').textContent=fmt(Math.max(0,s.shiftMs-s.activeMs));q('kbs-q').textContent=s.queue.length;q('kbs-ok').textContent=s.served.filter(x=>!x.fail&&!x.anomaly).length;q('kbs-n').textContent='SHIFT '+s.n;
  const kq=q('kb-quit');if(kq)q('kbs-quit').textContent=kq.textContent;
  const rt=q('kb-root');if(rt){if(mode==='counter'){rt.style.position='absolute';rt.style.left=stage.offsetLeft+'px';rt.style.top=stage.offsetTop+'px';rt.style.width=stage.clientWidth+'px';rt.style.height=stage.clientHeight+'px'}else if(rt.style.position)rt.removeAttribute('style')}
  const o=s.cur;shell.classList.toggle('kbs-pay',!!(o&&o.phase==='pay'&&o.pay&&o.pay.status!=='ok'));shell.classList.toggle('kbs-talk',!!(o&&o.phase==='talk'));shell.classList.toggle('kbs-wet',!!(o&&o.wet));
  const W=stage.clientWidth,H=stage.clientHeight;if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;drawnKey=''}
  const bub=stage.querySelector('.kbs-bub'),ring=stage.querySelector('.kbs-ring'),fl=stage.querySelector('.kbs-flags');
  const m=s.mic,running=!!(m&&m.ms>0);
  if(mode==='counter'){
   const cu=s.cur,wk=cu&&cu.wet?Math.floor(Math.min(6000,performance.now()-(cu.wetAt||performance.now()))/400):-1,an=!!(cu&&cu.items.some(x=>x.anomaly&&x.state!=='void'&&x.state!=='bin'));const key='c'+W+'x'+H+running+bk()+wk+an+(cu?cu.id:'')+Object.values(cimg).filter(i=>i.complete).length;if(key!==drawnKey){drawnKey=key;drawCounter(running);placeRoot()}
   bub.hidden=true;ring.hidden=true;fl.innerHTML='';fl.dataset.k='';
   const mb=LAY().keys.mic;lcd.hidden=false;lcd.style.left=(mb.x+mb.w*.74)+'px';lcd.style.top=(mb.y+mb.h*.12)+'px';lcd.style.width=(mb.w*.2)+'px';lcd.style.height=(mb.h*.17)+'px';
   lcd.textContent=m?(m.ms>0?fmt(m.ms):'チン'):'--:--';lcd.classList.toggle('done',!!(m&&m.ms<=0));
   return;
  }
  lcd.hidden=true;
  const P=drawStore(s);drawnKey='';
  /* 全店视角：顾客头上的话、耐心圆环 */
  if(o&&o.phase!=='talk'){
   const els=[...document.querySelectorAll('#kb-root .kb-cust-main > .kb-say, #kb-root .kb-reply .kb-say.q')];
   const lines=els.map(el=>{const jp=(el.querySelector('[lang="ja"]')||el).textContent.trim();const zh=el.querySelector(':scope > small');return {jp,zh:zh?zh.textContent.trim():''}}).filter(l=>l.jp);
   const html=lines.slice(-2).map((l,i,a)=>`<p class="${i===a.length-1?'last':''}"><span lang="ja">${esc(l.jp)}</span>${l.zh?`<small>${esc(l.zh)}</small>`:''}</p>`).join('');
   if(html!==lastBub){lastBub=html;bub.innerHTML=html}
   const qq=br.queue[0],[bx,by]=P(qq[0],qq[1]);
   bub.hidden=!lines.length;bub.style.left=Math.max(4,Math.min(W-280,bx-6))+'px';bub.style.top=Math.max(6,by-bub.offsetHeight-10)+'px';
   const r=o.wet?1:Math.max(0,o.patience/o.patienceMax);ring.hidden=!!o.wet;ring.style.left=Math.max(2,bx-48)+'px';ring.style.top=Math.max(2,by)+'px';
   ring.style.setProperty('--p',(r*100)+'%');ring.dataset.lv=r<.25?'low':r<.5?'mid':'ok';ring.firstElementChild.textContent=Math.ceil(r*100)+'%';
  }else{bub.hidden=true;ring.hidden=true;lastBub=''}
  /* 空档补货（只是表现） */
  const idle=!o&&!s.queue.length&&!s.timeUp;
  if(idle&&!Object.keys(flags).length&&Math.random()<0.02){const list=(SHELF[bk()]||[]).filter(z=>br.hs[z]);if(list.length)flags[list[Math.floor(Math.random()*list.length)]]=true}
  const key=Object.keys(flags).join(',')+'|'+view.y0+'|'+W;
  if(fl.dataset.k!==key){fl.dataset.k=key;fl.innerHTML=Object.keys(flags).map(z=>{const r=br.hs[z],[a,b]=P(r[0],r[1]),[c,d]=P(r[2],r[3]);return `<button type="button" class="kbs-flag" data-kbs-restock="${z}" style="left:${a}px;top:${Math.max(0,b)}px;width:${c-a}px;height:${Math.min(H,d)-Math.max(0,b)}px"><b>⚠ 欠品 · 缺货</b><small>点一下补货</small></button>`}).join('')}
 }
 function onStage(e){
  const b=e.target.closest('[data-kbs-restock]');if(!b)return;
  delete flags[b.dataset.kbsRestock];if(KONBINI.sfx)KONBINI.sfx('page');KONBINI.note('补好了货架 ✓',false);tick();
 }
 function install(){
  new MutationObserver(()=>{if(document.getElementById('kb-root')&&!document.getElementById('kbs-stage'))mount()}).observe(app,{childList:true});
  window.addEventListener('resize',()=>{if(stage&&stage.isConnected){drawnKey='';requestAnimationFrame(()=>{tick();placeRoot()})}});
  /* 打工介绍页：写上是哪家店 */
  new MutationObserver(()=>{const i=app.querySelector('.kb-intro h1');if(i&&!i.dataset.kbs){i.dataset.kbs=1;const id=storeId();if(!id)return;const br=KSHOP.BR[KSHOP.brandOf(id)];const st=byId[id]||{jp:''};i.insertAdjacentHTML('afterend',`<p class="kbs-intro-brand" style="--brand:${br.color}">${br.name} · ${br.en}　${esc(st.jp)}店</p>`)}}).observe(app,{childList:true,subtree:true});
 }
 /* 肌肉记忆掌握通知：独立系统横幅，约 2.5 秒淡出；不进对话队列、不暂停耐心。文案定稿，不经过翻译层 */
 function memToast(name){
  const host=(stage&&stage.isConnected)?stage:document.body;let box=host.querySelector(':scope > .kbs-mem');if(!box){box=document.createElement('div');box.className='kbs-mem'+(host===document.body?' fixed':'');host.appendChild(box)}
  const el=document.createElement('div');el.className='kbs-mem-row notranslate';el.setAttribute('translate','no');
  const jp=document.createElement('b');jp.lang='ja';jp.textContent='🧠 筋肉の記憶：「'+name+'」を習得';const zh=document.createElement('span');zh.lang='zh';zh.textContent='🧠 肌肉记忆：已掌握「'+name+'」';
  el.append(jp,zh);box.appendChild(el);setTimeout(()=>el.classList.add('out'),2500);setTimeout(()=>el.remove(),3000);
 }
 return {install,setStore,storeId,mount,memToast,mode:()=>mode,_flags:()=>flags,_tick:()=>tick(),_place:()=>placeRoot(),_R:R};
})();
window.KWORK=KWORK;

KSHOP.install();KWORK.install();
