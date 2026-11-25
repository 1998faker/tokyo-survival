
/* v55 一屏化：只在页面渲染完成后调整容器结构（移动 / 包裹现有节点，不重建、不改事件），用 MutationObserver 跟上各模块的后续插入 */
(function(){
 if(window.ONE_SCREEN_LAYOUT)return;
 const app=document.getElementById('app');if(!app)return;
 const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
 const mobile=()=>innerWidth<=700;
 let busy=false;
 /* ---------- 可用高度：顶栏与底栏之间 ---------- */
 function measure(){const cs=getComputedStyle(app);const top=parseFloat(cs.paddingTop),bot=parseFloat(cs.paddingBottom),h=app.clientHeight-top-bot;app.style.setProperty('--os-avail',Math.max(240,Math.floor(h))+'px');
  /* 浮动按钮压到内容区多少，就在一屏页面底部预留多少 */
  const ar=app.getBoundingClientRect(),cl=ar.left+parseFloat(cs.paddingLeft),cr=ar.right-parseFloat(cs.paddingRight),cb=ar.top+top+h;let res=0;
  for(const q of ['#ct-fab','#tutv-fab','#tutv-back','.m46-dock']){const e=document.querySelector(q);if(!e)continue;const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||s.position!=='fixed')continue;const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;
   if(r.right<=cl||r.left>=cr||r.bottom<=ar.top+top||r.top>=cb)continue;res=Math.max(res,cb-r.top+6)}
  app.style.setProperty('--os-res',Math.min(140,Math.ceil(res))+'px')}
 /* ---------- 主页 ---------- */
 const homeState={view:'grid'};
 function stationGrid(shell){
  const host=shell.querySelector('#map-host'),grid=shell.querySelector('.os-stgrid');if(!host||!grid)return;
  const src=[...host.querySelectorAll('button.m25-st,button.station')];
  const info=shell.querySelector('#station-info h3'),selName=info?info.textContent.replace(/^[^\p{L}]+/u,'').replace(/駅$/,'').trim():'';
  const sig=src.map(b=>(b.dataset.station||'')+'|'+b.className+'|'+b.getAttribute('aria-label')).join(',')+'#'+selName;
  if(grid.dataset.sig===sig)return;grid.dataset.sig=sig;grid.innerHTML='';
  for(const b of src){const name=(b.querySelector('span')?.textContent||b.textContent).trim();const label=b.getAttribute('aria-label')||name;
   const g=el('button','',`<b>${name}</b><small>${/已被淹/.test(label)?'已被淹':(b.classList.contains('big')?'主要车站':'')}</small>`);g.type='button';g.setAttribute('aria-label',label);
   if(name===selName)g.classList.add('os-sel');if(/已被淹/.test(label))g.classList.add('os-flood');if(b.classList.contains('here')||b.classList.contains('current')||b.classList.contains('cur'))g.classList.add('os-here');
   g.onclick=()=>{b.click();setTimeout(()=>stationGrid(shell),0)};grid.appendChild(g)}
 }
 function scaleMap(shell){const host=shell.querySelector('#map-host'),m=host&&host.querySelector('.m25');if(!m||!shell.classList.contains('os-v-map'))return;m.style.transform='';const w=m.offsetWidth,h=m.offsetHeight;if(!w||!h)return;const s=Math.min(host.clientWidth/w,host.clientHeight/h,1.6);m.style.transform='scale('+s+')';m.style.marginLeft=Math.max(0,(host.clientWidth-w*s)/2)+'px'}
 function strip(shell){
  const s=shell.querySelector('.os-strip');if(!s)return;
  const pick=[['#daily-hotel',1],['#daily-night',0],['#ch1-night-go',1],['.os-left .rpg-nav button',0],['#et-map-shortcuts button',0]];
  const targets=[];for(const [q,pri] of pick)shell.querySelectorAll(q).forEach(b=>{if(b.closest('.os-strip'))return;targets.push([b,pri])});
  const sig=targets.map(([b])=>b.textContent.trim()+(b.disabled?'×':'')).join('|');if(s.dataset.sig===sig)return;s.dataset.sig=sig;s.innerHTML='';
  const info=el('button','os-pri','📋 今日 / 行动');info.type='button';info.onclick=()=>shell.classList.add('os-drawer');s.appendChild(info);
  for(const [b,pri] of targets){const p=el('button',pri?'os-pri':'');p.type='button';p.textContent=b.textContent.trim().replace(/\s+/g,' ');p.disabled=!!b.disabled;p.onclick=()=>b.click();s.appendChild(p)}
 }
 function home(shell){
  if(shell.dataset.os!=='home'){
   shell.dataset.os='home';shell.classList.add('os-home','os-fit','os-v-'+homeState.view);
   const mapPanel=shell.querySelector('#map-host').closest('section')||shell.querySelector('#map-host').parentElement;
   mapPanel.classList.add('os-mappanel','os-scroll');
   const left=el('div','os-left os-scroll');const x=el('button','os-drawer-x survival-btn alt','✕ 收起');x.type='button';x.onclick=()=>shell.classList.remove('os-drawer');left.appendChild(x);
   const stripEl=el('div','os-strip');const notice=el('div','os-notice');
   const bar=el('div','os-viewbar','<span>车站</span><button type="button" data-v="grid">▦ 网格</button><button type="button" data-v="map">🗺 地图</button><span class="os-sp"></span>');
   bar.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{homeState.view=b.dataset.v;shell.classList.remove('os-v-grid','os-v-map');shell.classList.add('os-v-'+homeState.view);sync(shell)});
   const grid=el('div','os-stgrid os-scroll');
   const legend=mapPanel.querySelector('.map-legend'),host=mapPanel.querySelector('#map-host');
   (legend||host).insertAdjacentElement(legend?'afterend':'beforebegin',bar);host.insertAdjacentElement('afterend',grid);
   const sc=mapPanel.querySelector('#et-map-shortcuts');
   shell.prepend(stripEl);stripEl.after(notice);
   shell.insertBefore(left,mapPanel);
   if(sc)left.appendChild(sc);
  }
  routeHome(shell);sync(shell);
 }
 function routeHome(shell){
  const left=shell.querySelector(':scope > .os-left'),notice=shell.querySelector(':scope > .os-notice'),mapPanel=shell.querySelector(':scope > .os-mappanel');if(!left||!mapPanel)return;
  const known=['daily-panel','rpg-hero','rpg-nav','survival-hud'];
  for(const ch of [...shell.children]){
   if(ch===left||ch===mapPanel||ch.classList.contains('os-strip')||ch.classList.contains('os-notice'))continue;
   const k=known.find(c=>ch.classList.contains(c))||(ch.id==='ch1-night-reminder'?'rem':null);
   if(k){const order={'rpg-hero':0,'daily-panel':1,rem:2,'rpg-nav':3,'survival-hud':9};ch.dataset.osOrder=order[k];left.appendChild(ch)}
   else if(mobile()){notice.appendChild(ch)}else{ch.dataset.osOrder=1.5;left.appendChild(ch)}
  }
  if(!mobile())for(const ch of [...notice.children]){ch.dataset.osOrder=1.5;left.appendChild(ch)}
  const items=[...left.children].filter(c=>!c.classList.contains('os-drawer-x'));const want=[...items].sort((a,b)=>(+(a.dataset.osOrder??5))-(+(b.dataset.osOrder??5)));
  if(want.some((c,i)=>c!==items[i]))want.forEach(c=>left.appendChild(c)); // 顺序不对才重排，避免触发无限的 DOM 变动
 }
 function sync(shell){
  shell.querySelectorAll('.os-viewbar [data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===homeState.view)));
  stationGrid(shell);strip(shell);scaleMap(shell);
 }
 /* ---------- 像素窗主页（M46） ---------- */
 const m46State={view:null};
 function m46fit(shell,root){
  root.classList.add('os-fit');const box=root.querySelector('.m46-map');if(!box)return;
  if(!m46State.view)m46State.view=mobile()?'grid':'map';
  root.classList.toggle('os-v-grid',m46State.view==='grid');root.classList.toggle('os-v-map',m46State.view==='map');
  if(!box.querySelector(':scope > .os-stgrid')){const grid=el('div','os-stgrid');box.appendChild(grid);
   const bar=el('div','os-viewbar','<button type="button" data-v="grid">▦ 车站网格</button><button type="button" data-v="map">🗺 地图</button>');box.appendChild(bar);
   bar.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{m46State.view=b.dataset.v;m46fit(shell,root)})}
  box.querySelectorAll('.os-viewbar [data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===m46State.view)));
  stationGrid(shell);
  if(m46State.view==='map')fitMap(box);
 }
 /* 地图视图：电脑整张缩进格子框并居中；手机按框高缩放（站名保持可读），左右可拖，自动对准选中 / 当前车站。
    transform 不改排版尺寸，所以用负 margin 把占位收成缩放后的大小，滚动范围才对 */
 function fitMap(box){
  const host=box.querySelector('#map-host'),m=box.querySelector('.m25');if(!host||!m)return;
  m.style.transform='';m.style.margin='';const w=m.offsetWidth,h=m.offsetHeight,bw=host.clientWidth||box.clientWidth,bh=box.clientHeight;if(!w||!h||!bw||!bh)return;
  const k=mobile()?Math.min(1,bh/h):Math.min(1,bw/w,bh/h),sw=w*k,sh=h*k;
  m.style.transform='scale('+k+')';
  m.style.marginRight=(sw-w)+'px';m.style.marginBottom=(sh-h)+'px';
  m.style.marginLeft=Math.max(0,(bw-sw)/2)+'px';m.style.marginTop=Math.max(0,(bh-sh)/2)+'px';
  if(sw>bw){const name=(box.closest('.m46')?.querySelector('#station-info h3')?.textContent||'').replace(/^[^\p{L}]+/u,'').replace(/駅$/,'').trim();
   const sel=[...m.querySelectorAll('.m25-st')].find(x=>(x.querySelector('span')?.textContent||'').trim()===name);
   host.scrollLeft=sel?Math.max(0,Math.min(sw-bw,(parseFloat(sel.style.left)||50)/100*sw-bw/2)):Math.max(0,(sw-bw)/2)}
  else host.scrollLeft=0
 }
 /* ---------- 标签页 ---------- */
 const tabMem={};
 function tabLabel(s){const h=s.querySelector('h2,h3,h1');let t=(h?h.textContent:s.textContent).replace(/\s+/g,' ').trim();return t.length>16?t.slice(0,15)+'…':t}
 /* v66：记住当前分页时只看标题本身（去掉 <small> 里的计数），否则「已选 0 / 4 → 1 / 4」一变，就会跳回第一页 */
 function tabKey(s){const h=s.querySelector('h2,h3,h1');if(!h)return tabLabel(s);const c=h.cloneNode(true);c.querySelectorAll('small').forEach(x=>x.remove());const t=c.textContent.replace(/\s+/g,' ').trim();return t.length>16?t.slice(0,15)+'…':t}
 function tabs(page,key,withAll){
  let main=page.querySelector(':scope > .os-main'),bar=page.querySelector(':scope > .os-tabbar'),foot=page.querySelector(':scope > .os-foot');
  if(!main){page.classList.add('os-tabs','os-fit');bar=el('div','os-tabbar os-scroll');bar.setAttribute('role','tablist');main=el('div','os-main os-scroll');foot=el('div','os-foot');
   const head=page.querySelector(':scope > .et-page-head');(head||page.firstChild).after?head.after(bar):page.prepend(bar);bar.after(main);main.after(foot)}
  for(const ch of [...page.children]){if(ch===bar||ch===main||ch===foot||ch.classList.contains('et-page-head'))continue;(ch.tagName==='SECTION'?main:foot).appendChild(ch)}
  const secs=[...main.children].filter(s=>s.tagName==='SECTION'&&!s.hidden&&s.style.display!=='none'&&s.textContent.trim());
  const sig=secs.map(tabLabel).join('|')+(withAll?'+all':'');
  if(bar.dataset.sig!==sig){bar.dataset.sig=sig;bar.innerHTML='';
   const mk=(label,idx)=>{const b=el('button');b.type='button';b.setAttribute('role','tab');b.textContent=label;b.dataset.k=idx;b.onclick=()=>{tabMem[key]=idx;show()};bar.appendChild(b)};
   if(withAll)mk('全部','all');secs.forEach((s,i)=>mk(tabLabel(s),tabKey(s)))}
  else [...bar.children].forEach((b,i)=>{const s=secs[i-(withAll?1:0)];if(s)b.textContent=tabLabel(s)});
  function show(){let cur=tabMem[key];const labels=secs.map(tabKey);if(cur!=='all'&&!labels.includes(cur))cur=withAll?'all':labels[0];
   const same=main.dataset.cur===cur;main.dataset.cur=cur;
   page.classList.toggle('os-all',cur==='all');
   [...main.children].forEach(s=>s.classList.toggle('os-off',cur!=='all'&&tabKey(s)!==cur));
   [...bar.children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.k===cur)));if(!same)main.scrollTop=0}
  show();
 }
 function archive(page){
  let main=page.querySelector(':scope > .os-main'),foot=page.querySelector(':scope > .os-foot');
  if(!main){page.classList.add('os-arch','os-fit');main=el('div','os-main os-scroll');foot=el('div','os-foot');page.appendChild(main);page.appendChild(foot);page.querySelector(':scope > .et-files-head')?.classList.add('os-scroll')}
  for(const ch of [...page.children]){if(ch===main||ch===foot||ch.classList.contains('et-page-head')||ch.classList.contains('et-files-head'))continue;(ch.tagName==='SECTION'?main:foot).appendChild(ch)}
 }
 function flexFit(page,growSel,extra){page.classList.add('os-flex','os-fit');if(extra)page.classList.add(extra);const g=page.querySelector(growSel);if(g){g.classList.add('os-grow');if(!g.classList.contains('nb'))g.classList.add('os-scroll')}}
 /* ---------- 分页 ---------- */
 function pager(n,cur,go){const p=el('div','os-pager');const a=el('button','','◀ 上一页'),b=el('button','','下一页 ▶'),t=el('span','',(cur+1)+' / '+n);a.type=b.type='button';a.disabled=cur<=0;b.disabled=cur>=n-1;a.onclick=()=>go(cur-1);b.onclick=()=>go(cur+1);p.append(a,t,b);return p}
 function ledger(){
  const card=document.querySelector('#et-modal .et-modal-card');if(!card)return;const table=card.querySelector('.ch1-ledger table');if(!table||table.dataset.osPaged)return;
  const rows=[...table.querySelectorAll('tbody tr')];const per=mobile()?6:8;if(rows.length<=per)return;table.dataset.osPaged='1';
  const pages=Math.ceil(rows.length/per);let cur=0;const wrap=table.closest('.ch1-ledger');const btn=[...card.querySelectorAll('.et-modal-btns button')].find(b=>/继续/.test(b.textContent));
  const label=btn?btn.textContent:'';
  if(btn)btn.addEventListener('click',e=>{if(cur<pages-1){e.preventDefault();e.stopImmediatePropagation();go(cur+1)}},true);
  function go(i){cur=Math.max(0,Math.min(pages-1,i));rows.forEach((r,k)=>r.classList.toggle('os-pgoff',Math.floor(k/per)!==cur));wrap.querySelector('.os-pager')?.remove();wrap.appendChild(pager(pages,cur,go));if(btn)btn.textContent=cur<pages-1?'继续（第 '+(cur+2)+' / '+pages+' 页）':label}
  go(0);
 }
 function ending(){
  const panel=app.querySelector('.adv-ending');if(!panel||panel.dataset.osPaged)return;panel.dataset.osPaged='1';
  const kids=[...panel.children];const avail=parseFloat(getComputedStyle(app).getPropertyValue('--os-avail'))||600;const limit=avail-90;
  const pages=[];let curH=0,page=[];for(const k of kids){const h=k.offsetHeight+12;if(page.length&&curH+h>limit){pages.push(page);page=[];curH=0}page.push(k);curH+=h}if(page.length)pages.push(page);
  for(let i=0;i<pages.length-1;i++){const pg=pages[i];while(pg.length>1&&/^H[1-4]$/.test(pg[pg.length-1].tagName))pages[i+1].unshift(pg.pop())} // 标题不留在页尾
  if(pages.length<=1){panel.dataset.osPaged='single';return}
  panel.classList.add('os-paged','os-fit');panel.closest('.rpg-shell')?.classList.add('os-fit');
  let cur=0;function go(i){cur=Math.max(0,Math.min(pages.length-1,i));pages.forEach((p,k)=>p.forEach(n=>n.classList.toggle('os-pgoff',k!==cur)));panel.querySelector(':scope > .os-pager')?.remove();const pg=pager(pages.length,cur,go);const nx=pg.lastChild;if(cur<pages.length-1)nx.textContent='继续 ▶';panel.appendChild(pg);panel.scrollTop=0}
  go(0);
 }
 /* ---------- 分派 ---------- */
 function apply(){
  if(busy)return;busy=true;try{
   measure();
   const shell=app.querySelector(':scope > .rpg-shell');
   const m46=shell&&shell.querySelector(':scope > .m46');
   if(shell&&shell.dataset.os==='home'&&m46){shell.classList.remove('os-home','os-fit','os-v-grid','os-v-map');delete shell.dataset.os}
   const isHome=!!(shell&&!m46&&shell.querySelector('#map-host')&&shell.querySelector('.daily-panel,#station-info'));
   if(m46)m46fit(shell,m46);
   document.body.classList.toggle('os-dock',!!(m46&&m46.querySelector('.m46-dock')&&getComputedStyle(m46.querySelector('.m46-dock')).position==='fixed'));
   document.body.classList.toggle('os-wide',isHome);
   if(isHome)home(shell);
   const page=app.querySelector(':scope > .rpg-shell.et-page');
   if(page){
    if(page.querySelector('.nb'))flexFit(page,':scope > .nb','os-nb');
    else if(page.querySelector(':scope > .mail-folders'))flexFit(page,':scope > section:last-of-type');
    else if(page.querySelector(':scope > .et-files-head'))archive(page);
    else{const title=page.querySelector('.et-page-head h1')?.textContent.trim()||'page';tabs(page,title,title==='背包')}
   }
   ending();ledger();
  }catch(e){console.warn('[one-screen]',e)}finally{busy=false}
 }
 let raf=0;const later=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;apply()})};
 new MutationObserver(muts=>{if(busy)return;later()}).observe(app,{childList:true,subtree:true});
 const modal=document.getElementById('et-modal');if(modal)new MutationObserver(()=>later()).observe(modal,{childList:true,subtree:true});
 addEventListener('resize',()=>{const s=app.querySelector('.os-home');if(s){routeHome(s);scaleMap(s)}later()});
 window.ONE_SCREEN_LAYOUT={apply,version:'v55'};
 later();
})();
