/* ==== engine/survival/93-opening.js ==== */
/* ===================================================================
   【V21 开幕序章《TOKYO: THE UNSEEN》】
   内容全部来自 story/opening.json；这个文件只负责「怎么播放」：
     黑底文字 / 复古终端 / 叙事+背景 / 手机通知 / 系统启动 五种画面，逐字显示（点一下立即显示全文）、
     「下一段」、「跳过序章」、调查员登记（姓名 + 调查期限 + 原有的角色设定）、一闪而过的档案、标题画面。
   流程：新游戏 → SCENE 01 → SCENE 02 档案 → 调查员登记（沿用原来的角色创建画面）→ 加密邮件 →
         SCENE 03 → SCENE 04（获得《东京生存守则》）→ SCENE 05 → 「开始调查」→ 原有的 DAY 01。
   存档：campaign.name（调查员姓名）、campaign.opening = {scene, page, done}。
         只在新游戏时播放；继续游戏、读档、旧存档都不会重复播放。设置里可以关闭。
   =================================================================== */
const OPEN=(function(){
const D=GAME_DATA.story.opening||{};
const SC=D.scenes||[];
const idx=id=>Math.max(0,SC.findIndex(s=>s.id===id));
let pre={scene:0,page:0};       // 还没有存档（登记之前）时的进度
let typing=null,timers=[],anim=0,keyBound=false;
let regActive=false,skipFlag=false,draft='',pendingName=null,pendingOpening=false,pendingLang=null,auth=null;
let ff=false; // ⏩ 快进：文字立刻显示，自动翻页（登记页、标题画面会停下）
const FAST=()=>((GAME_CONFIG.dialogue||{}).openingFastMs??700);

function enabled(){return SETTINGS.get('opening')!==false}
function st(){return campaign&&campaign.opening&&!campaign.opening.done?campaign.opening:pre}
function save(){if(campaign&&campaign.opening)campaignSave()}
function fill(t){if(typeof t!=='string')return t;const m=campaign?FILES.modeInfo(campaign.days):{};return t.replace(/\{(\w+)\}/g,(x,k)=>({name:campaign&&campaign.name||'调查员',days:campaign?campaign.days:'？',modeName:m.name||'',modeTask:m.task||'',cash:campaign?campaign.cash.toLocaleString('ja-JP'):''})[k]??x)}
function clear(){timers.forEach(clearTimeout);timers=[];typing=null}
function black(on){document.body.classList.toggle('op-mode',!!on)}

/* ---------- 画面 ---------- */
function pgBg(sc,pg){return pg&&('bg' in pg)?pg.bg:sc.bg} // 页面写 "bg": null 时不要背景图
/* 页面写 "route": "haneda" / "narita"：只在对应的入境口岸播放（成田开局跳过第一章，不收港屋酒店的委托） */
function offRoute(pg){return !!(pg&&pg.route&&campaign&&campaign.birth!==pg.route)}
function shell(sc,pg){
 const style=(pg&&pg.style)||sc.style||'void';
 UI.scene('opening',resume);black(true);
 if(window.AUDIO)AUDIO.ambience((pg&&pg.ambience)||sc.ambience||'void');
 app.innerHTML=`<div class="op-root op-${style}${pg&&pg.fx==='black'?' op-black':''}" id="op-root">
  <div class="op-bar"><span class="op-label">${esc((pg&&pg.label)||sc.label||'')}</span><span class="op-tools"><button type="button" class="op-skip${ff?' on':''}" id="op-ff">${ff?'■ 停止快进':'⏩ 快进'}</button><button type="button" class="op-skip" id="op-scene">⏭ 跳过本幕</button><button type="button" class="op-skip" id="op-skip">⏏ 跳过序章</button></span></div>
  <div class="op-stage${pgBg(sc,pg)==='tokyoEvening'?' op-evening':''}" id="op-stage">${pgBg(sc,pg)?'<canvas class="op-bg" id="op-bg" '+(pgBg(sc,pg)==='airport'&&window.PXART?'width="512" height="352"':'width="480" height="300"')+' aria-hidden="true"></canvas>':''}<div class="op-body" id="op-body" aria-live="polite"></div></div>
  <div class="op-ctl"><button type="button" class="survival-btn alt op-prev" id="op-prev" hidden>◀ 上一页</button><button type="button" class="survival-btn op-next" id="op-next" hidden>▶ 下一段</button></div></div>`;
 app.querySelector('#op-skip').onclick=skip;
 app.querySelector('#op-scene').onclick=skipScene;
 app.querySelector('#op-ff').onclick=toggleFF;
 app.querySelector('#op-next').onclick=next;
 app.querySelector('#op-prev').onclick=prev;
 app.querySelector('#op-stage').onclick=()=>{if(typing)finishTyping()};
 drawBg(pgBg(sc,pg));window.scrollTo(0,0);
}
function speed(){const s=SETTINGS.get('textSpeed');return s==='instant'?0:s==='fast'?12:s==='slow'?55:30}
function lineEl(l){
 const d=document.createElement('div');
 if(typeof l==='string'){d.className='op-line';d.dataset.type=fill(l);return d}
 if(l.gap){d.className='op-gap';return d}
 if(l.red){d.className='op-line op-red';d.dataset.type=fill(l.red);return d}
 if(l.sys){d.className='op-line op-sys';d.dataset.type=fill(l.sys);return d}
 if(l.jp){d.className='op-line op-jpline op-fade';d.innerHTML=`<span lang="ja" translate="no">「${esc(fill(l.jp))}」</span>${l.zh&&!l.lockTranslate?(langMode()==='learning'?`<small>${trToggle(fill(l.zh))}</small>`:`<small>${esc(fill(l.zh))}</small>`):''}`;return d} // 语言辅助协议：学习模式下翻译要点开
 if(l.msg){d.className='op-msg op-fade';d.innerHTML=`<b>${esc(l.who||'')}</b><span>${esc(fill(l.msg))}</span>`;return d}
 d.className='op-line';d.textContent='';return d;
}
/* 一行一行出现：普通文字逐字显示，日语句子和手机消息淡入 */
function typeLines(lines,done){
 const body=document.getElementById('op-body');if(!body)return;
 const els=lines.map(lineEl);let i=0;const ms=speed();
 (window.__opLog=window.__opLog||[]).push(...lines.map(l=>typeof l==='string'?l:(l&&(l.sys||l.red||l.jp||l.msg))||'')); // 测试用：记录显示过的文字
 typing={els,done};
 if(ff){finishTyping();return}
 const step=()=>{
  if(!typing)return;if(i>=els.length){typing=null;done();return}
  const el=els[i++];body.appendChild(el);
  if(el.classList.contains('op-msg')&&window.AUDIO)AUDIO.sfx('buzz');
  const full=el.dataset.type;
  if(full==null||!ms){if(full!=null)el.textContent=full;timers.push(setTimeout(step,ms?260:0));return}
  let k=0;const tick=()=>{if(!typing)return;k+=1;el.textContent=full.slice(0,k);if(window.AUDIO&&full[k-1]&&full[k-1].trim()&&k%2)AUDIO.sfx('type');if(k<full.length)timers.push(setTimeout(tick,ms));else timers.push(setTimeout(step,ms*8))};tick();
 };
 step();
}
function finishTyping(){
 if(!typing)return;const {els,done}=typing;clear();const body=document.getElementById('op-body');
 els.forEach(el=>{if(!el.parentNode&&body)body.appendChild(el);if(el.dataset.type!=null)el.textContent=el.dataset.type;el.classList.remove('op-fade')});
 done();
}
function showPrev(){const p=document.getElementById('op-prev');if(p)p.hidden=!canPrev()} // 「上一页」和「下一段」同时出现（文字显示完以后）
function showNext(label){const b=document.getElementById('op-next');if(!b)return;b.hidden=false;showPrev();b.textContent=label||'▶ 下一段';b.focus({preventScroll:true});if(ff)timers.push(setTimeout(()=>{if(ff&&document.getElementById('op-next')===b&&!b.hidden)b.click()},FAST()))}
/* ⏩ 快进：切换开关。打开后当前页文字立刻显示，然后自动翻页 */
function toggleFF(){ff=!ff;const t=document.getElementById('op-ff');if(t){t.textContent=ff?'■ 停止快进':'⏩ 快进';t.classList.toggle('on',ff)}if(ff){if(typing)finishTyping();else{const b=document.getElementById('op-next');if(b&&!b.hidden)timers.push(setTimeout(()=>{if(ff&&!b.hidden)b.click()},FAST()))}}}
/* ⏭ 跳过本幕：直接到下一幕。本幕里要拿的东西照样拿到；还没登记时会停在调查员登记（不能跳过） */
function skipScene(){
 clear();const s=st(),sc=SC[s.scene];if(!sc){finish();return}
 const rest=sc.pages.slice(s.page);
 const ri=rest.findIndex(p=>p.type==='register'||p.type==='auth');
 if(ri>=0&&!campaign){s.page+=ri;play();return}
 if(rest.some(p=>p.type==='grantRules')&&campaign)FILES.grant();
 if(rest.some(p=>p.type==='title')){finish();return}
 s.scene++;s.page=0;save();play();
}

/* ---------- 播放 ---------- */
function play(){
 clear();const s=st(),sc=SC[s.scene];if(!sc){finish();return}
 const pg=sc.pages[s.page];if(!pg){s.scene++;s.page=0;save();play();return}
 if(offRoute(pg)){s.page++;save();play();return}
 shell(sc,pg);
 if(pg.sfx&&window.AUDIO)AUDIO.sfx(pg.sfx);
 if(pg.fx==='flicker'){const r=document.getElementById('op-root');r.classList.add('op-flicker');timers.push(setTimeout(()=>r.classList.remove('op-flicker'),700))}
 if(pg.fx==='static')UI.glitch('static',1400);
 if(pg.type==='file'){renderFile();return}
 if(pg.type==='register'){if(campaign&&s===campaign.opening){s.page++;save();play();return}register();return}
 if(pg.type==='auth'){if(campaign){s.page++;save();play();return}authStart();return}
 if(pg.type==='grantRules'){FILES.grant();}
 if(pg.type==='flash'){flash();return}
 if(pg.type==='title'){title();return}
 typeLines(pg.lines||[],()=>showNext());
}
function next(){clear();const s=st();s.page++;save();play()}
/* ◀ 上一页：回到上一页文字。已经登记过的「调查员登记」和一闪而过的档案会自动跳过 */
function backPos(sc0,pg0){let a=sc0,b=pg0;for(let guard=0;guard<200;guard++){b--;if(b<0){a--;if(a<0)return null;b=SC[a].pages.length-1}const pg=SC[a].pages[b];if(!pg)continue;if(pg.type==='flash')continue;if(pg.type==='register'||pg.type==='auth'||offRoute(pg))continue;return [a,b]}return null}
function canPrev(){const s=st();return !!backPos(s.scene,s.page)}
function prev(){ff=false;const s=st(),pos=backPos(s.scene,s.page);if(!pos)return;clear();s.scene=pos[0];s.page=pos[1];save();play();if(window.AUDIO)AUDIO.sfx('page')}
function resume(){play()}

/* SCENE 02：调查档案 */
function renderFile(){
 const body=document.getElementById('op-body');const reg=!!campaign;
 const rows=[['调查区域','日本国·东京都'],['事件代号','TOKYO ANOMALY'],['前任调查员','No.0■■ · 失联'],['异常指数','■■■■■ 超警戒线'],['调查状态',reg?'已启动':'待启动'],['调查员姓名',reg?fill('{name}'):'（玩家输入）'],['调查期限',reg?fill('{days} 天'):'（玩家选择）'],['调查目标','查明异常来源 · 确认前任状况']];
 body.innerHTML=`<div class="op-file"><div class="op-sys">CONFIDENTIAL INVESTIGATION FILE</div><div class="op-sys">调查档案 / FILE NO. 000</div><table>${rows.map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</table></div>`;
 if(window.AUDIO)AUDIO.sfx('type');
 showNext('▶ 登记调查员');
}
/* ---------- SCENE 02：调查员身份认证与任务授权（文字在 opening.json 的 auth） ----------
   STEP 01 身份认证（姓名、性别、出身）→ STEP 02 期限授权（期限、入境口岸）→ STEP 03 语言协议 → STEP 04 档案完成 →「接收加密委托」
   这时才建立存档（和原来的「开始东京生存」一样），然后播放加密邮件。 */
const A=D.auth||{};
function toAuth(){clear();const s=st();s.scene=idx('file');s.page=0;play()}
function authStart(){
 ff=false;regActive=true;const t0=document.getElementById('op-ff');if(t0){t0.textContent='⏩ 快进';t0.classList.remove('on')}
 const O=(GAME_CONFIG.character||{}).origins||['中国'];
 auth=auth||{step:1,form:{name:draft||'',gender:((A.identity||{}).genders||['男性'])[0],origin:O.includes('中国')?'中国':O[0],days:(durations.find(x=>x.days===30)||durations[0]).days,birth:'haneda',lang:'story'}};
 renderAuth();
}
function modeLabel(days){const m=FILES.modeInfo(days);return String(days).padStart(2,'0')+' DAYS — '+(m.name||'')}
const OP_PHOTO='<svg viewBox="0 0 26 32" shape-rendering="crispEdges" aria-hidden="true"><rect width="26" height="32" fill="#1a2230"/><rect x="7" y="7" width="12" height="10" fill="#7d8494"/><rect x="7" y="5" width="12" height="4" fill="#2a2f3e"/><rect x="11" y="17" width="4" height="2" fill="#6a7080"/><rect x="4" y="19" width="18" height="13" fill="#2e3a4e"/><rect x="11" y="19" width="4" height="5" fill="#c8c8c0"/></svg>'; // v44：没有五官的证件照
function authTable(){
 const f=auth.form,st=auth.step,R=A.rows||{},E=A.empty||{},S=A.status||{},head=A.fileHead||[];
 const rows=[[R.area,''],[R.code,''],[R.prev,'amb'],[R.level,'lvl'],[[R.status,st>=4?S.granted:st>=2?S.auth:S.verify],st>=4?'ok':'amb'],[[R.name,st>=2?f.name:E.name],st>=2?'ok':'dim'],[[R.days,st>=3?modeLabel(f.days):E.days],st>=3?'ok':'dim'],[[R.lang,st>=4?langLabel(f.lang):E.lang],st>=4?'ok':'dim'],[R.goal,'']].filter(r=>r[0]&&r[0][0]);
 const steps=['01 IDENTITY','02 MISSION','03 LANGUAGE','04 ACCESS'];
 return `<div class="op-file op-dos"><div class="op-dos-h"><b>${esc(head[0]||'')}</b><span>${esc(head[1]||'')}</span></div><div class="op-stamp${st>=2?' ok':''}">${st>=4?'GRANTED':st>=2?'VERIFIED':'極秘'}</div><div class="op-dos-b"><div class="op-photo${st>=2?' ok':''}">${OP_PHOTO}<small>PHOTO · ${esc(st>=2?f.name:(E.name||''))}</small></div><table>${rows.map(([r,c])=>`<tr class="${c}"><th>${esc(r[0])}</th><td>${c==='lvl'?'<span class="op-lvl">'+esc(r[1]||'')+'</span>':(c==='amb'?'● ':'')+esc(r[1]||'')}</td></tr>`).join('')}</table></div><div class="op-steps">${steps.map((t,i)=>(i?'<i></i>':'')+`<span class="${i+1<st?'done':i+1===st?'on':''}">${t}${i+1<st?' ✓':''}</span>`).join('')}</div></div>`;
}
function renderAuth(){
 const body=document.getElementById('op-body');if(!body||!auth)return;clear();
 ['op-next','op-prev'].forEach(id=>{const b=document.getElementById(id);if(b)b.hidden=true});const rt=document.getElementById('op-root');if(rt)rt.classList.add('op-authmode');
 const k=['','identity','mission','language','granted'][auth.step],C=A[k]||{};
 body.innerHTML=authTable();if(window.AUDIO)AUDIO.sfx('type');
 typeLines([{gap:true},{sys:C.head||''},...(C.sub?[{sys:C.sub}]:[]),...(C.lines||[]).map(t=>'> '+t)],()=>authControls(C));
}
function opt(attr,val,on,html){return `<button type="button" class="op-auth-opt${on?' on':''}" ${attr}="${esc(String(val))}" aria-pressed="${on}">${html}</button>`}
function authControls(C){
 const body=document.getElementById('op-body');if(!body)return;const f=auth.form,box=document.createElement('div');box.className='op-auth';
 const back=auth.step>1?`<button type="button" class="survival-btn alt" id="op-auth-back">${esc(A.back||'◀')}</button>`:'';
 if(auth.step===1){const O=(GAME_CONFIG.character||{}).origins||[];
  box.innerHTML=`<label class="op-auth-label">${esc(C.nameLabel)}<input id="op-name" class="op-auth-input" maxlength="16" autocomplete="off" placeholder="${esc(C.namePlaceholder||'')}" value="${esc(f.name)}"></label>
   <div class="op-auth-label">${esc(C.genderLabel)}</div><div class="op-auth-row">${(C.genders||[]).map(g=>opt('data-g',g,f.gender===g,esc(g))).join('')}</div>
   <label class="op-auth-label">${esc(C.originLabel)}<select id="op-origin" class="op-auth-input">${O.map(o=>`<option ${o===f.origin?'selected':''}>${esc(o)}</option>`).join('')}</select></label><p class="op-auth-note">${esc(C.originNote||'')}</p>`;
 }
 if(auth.step===2){
  box.innerHTML=`<div class="op-auth-list">${durations.map(x=>opt('data-days',x.days,f.days===x.days,`<b>${esc(modeLabel(x.days))}</b><small>${esc(FILES.modeInfo(x.days).task||'')}</small><small>${esc(C.fundsLabel||'')} ¥${x.cash.toLocaleString('ja-JP')}</small>`)).join('')}</div>
   <div class="op-auth-label">${esc(C.portLabel)}</div><div class="op-auth-row">${(C.ports||[]).filter(p=>portChoice()||p.id==='haneda').map(p=>opt('data-port',p.id,f.birth===p.id,`<b>${esc(p.name)}</b><small>${esc(p.note||'')}</small>`)).join('')}</div>`;
 }
 if(auth.step===3){const ex=C.example||{};
  box.innerHTML=`<div class="op-auth-list">${(C.options||[]).map(o=>opt('data-lang',o.id,f.lang===o.id,`<b>${esc(o.code)}</b><b class="op-auth-name">${esc(o.name)}</b><small>${esc(o.note||'')}</small><ul>${(o.points||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul><span class="op-auth-ex"><small>${esc(ex.who||'')}：</small><span lang="ja" translate="no">「${esc(ex.jp||'')}」</span>${o.id==='learning'?'<small class="op-auth-fake">[查看中文翻译]</small>':`<small>${esc(ex.zh||'')}</small>`}</span>`)).join('')}</div>
   <div class="op-auth-common"><div class="op-sys">${esc(C.commonHead||'')}</div><ol>${(C.common||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>`;
 }
 const okLabel=C.button||'▶';
 box.insertAdjacentHTML('beforeend',`<div class="op-auth-btns">${back}<button type="button" class="survival-btn" id="op-auth-ok">▶ ${esc(okLabel)}</button></div>`);
 body.appendChild(box);
 box.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{f.gender=b.dataset.g;pick(box,'data-g',b)});
 box.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>{f.days=+b.dataset.days;pick(box,'data-days',b)});
 box.querySelectorAll('[data-port]').forEach(b=>b.onclick=()=>{f.birth=b.dataset.port;pick(box,'data-port',b)});
 box.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{f.lang=b.dataset.lang;pick(box,'data-lang',b)});
 const inp=box.querySelector('#op-name');if(inp){inp.oninput=()=>{f.name=draft=inp.value};inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();ok()}}}
 const og=box.querySelector('#op-origin');if(og)og.onchange=()=>{f.origin=og.value};
 const bb=box.querySelector('#op-auth-back');if(bb)bb.onclick=()=>{auth.step--;renderAuth();if(window.AUDIO)AUDIO.sfx('page')};
 const ok=()=>{
  if(auth.step===1){f.name=((inp&&inp.value)||'').trim();if(!f.name){UI.toast(C.needName||'');if(inp)inp.focus();return}}
  if(auth.step===4){createCampaign();return}
  const done=C.done;box.remove();
  const go=()=>{auth.step++;renderAuth()};
  if(done)typeLines([{gap:true},{sys:done.head},...(done.lines||[]).map(t=>'> '+t)],()=>timers.push(setTimeout(go,ff?0:700)));else go();
 };
 box.querySelector('#op-auth-ok').onclick=ok;
 if(inp)inp.focus({preventScroll:true});else box.querySelector('#op-auth-ok').focus({preventScroll:true});
}
function portChoice(){return !!((GAME_CONFIG.start||{}).portChoice)} // config 的 start.portChoice=false：暂时只能从羽田入境
function pick(box,attr,b){box.querySelectorAll('['+attr+']').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});if(window.AUDIO)AUDIO.sfx('click')}
/* 建立存档：和原来角色创建画面的「开始东京生存」相同，然后由 onCreated 写入姓名和语言协议，接着播放加密邮件 */
function createCampaign(){
 const f=auth.form,mode=durations.find(x=>x.days===f.days)||durations[0];
 if(!portChoice())f.birth='haneda';
 pendingName=f.name;pendingLang=f.lang;pendingOpening=!skipFlag;regActive=false;auth=null;draft='';
 campaign={days:mode.days,jlpt:{level:5,xp:0},gender:f.gender,origin:f.origin,birth:f.birth,mode:mode.difficulty,day:1,hp:GAME_CONFIG.player.maxHP,cash:mode.cash,stress:GAME_CONFIG.player.startStress,san:GAME_CONFIG.player.maxSAN,clears:0};
 campaignSave();sanAtmosphere();birth=f.birth;try{localStorage.setItem(spawnKey,birth)}catch(e){}
 if(window.AUDIO)AUDIO.sfx('ok');enterDistrict(birth);
}
/* 调查员登记（旧）：沿用原有的角色创建画面（期限 / 性别 / 出身 / 机场），加上姓名 */
function register(){ff=false;regActive=true;black(false);clear();setupBase()}
let setupBase=null;
function decorate(){
 const box=app.querySelector('#survival-setup');if(!box||box.querySelector('#op-name'))return;
 const op=regActive&&!skipFlag;box.classList.toggle('op-register',op);
 box.insertAdjacentHTML('afterbegin',`<section class="survival-box op-reg-head">${op?'<div class="op-file-no">CONFIDENTIAL INVESTIGATION FILE · FILE NO. 000</div>':''}<h2>${op?'调查员登记':'00 / 调查员姓名'}</h2><label class="op-name-label">调查员姓名<input id="op-name" class="survival-select" maxlength="16" autocomplete="off" placeholder="请输入你的名字" value="${esc(draft)}"></label>${op?'<p class="survival-tip">填写姓名、选择调查期限后，调查委托将正式生效。</p>':''}</section>`);
 const inp=box.querySelector('#op-name');inp.oninput=()=>{draft=inp.value};
 box.querySelectorAll('[data-days]').forEach(b=>{const m=FILES.modeInfo(b.dataset.days);if(m.name&&!b.querySelector('.op-mode-name'))b.insertAdjacentHTML('beforeend',`<em class="op-mode-name">${esc(m.name)}</em><small>${esc(m.task||'')}</small>`)});
 const h=[...box.querySelectorAll('h2')].find(x=>/生存期限/.test(x.textContent));if(h)h.textContent='01 / 调查期限';
 if(!portChoice()){const n=box.querySelector('[data-birth-choice="narita"]');if(n)n.hidden=true} // 成田暂不开放（旧的角色创建画面）
}
new MutationObserver(()=>{if(UI.current()==='setup')decorate()}).observe(app,{childList:true});
/* 点「开始」：姓名必填（序章中）；记下姓名，等存档建立后写进去 */
app.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('#survival-start');if(!b)return;
 const inp=app.querySelector('#op-name');const n=((inp&&inp.value)||draft||'').trim();
 if(!n&&regActive){e.stopImmediatePropagation();e.preventDefault();UI.toast('请先填写调查员姓名');if(inp)inp.focus();return}
 pendingName=n||'调查员';pendingOpening=regActive&&!skipFlag;regActive=false;
},true);
/* 存档刚建立：写入姓名，接着播放邮件之后的剧情 */
function onCreated(){
 if(pendingName==null||!campaign)return;
 campaign.name=pendingName;if(campaign.birth!=='narita')campaign.caseCover=true; // 港屋酒店的委托：住宿费用由委托方承担（92-case-commission.js）
campaign.languageMode=pendingLang||campaign.languageMode||'story';pendingLang=null;
 if(pendingOpening){campaign.opening={scene:idx('mail'),page:0,done:false};campaign.files={got:{},unlocked:{},anomalies:[]}}
 else if(skipFlag){campaign.opening={done:true,skipped:true};campaign.files={got:{},unlocked:{},anomalies:[]};FILES.grant()}
 else{FILES.F()}
 pendingName=null;pendingOpening=false;skipFlag=false;campaignSave();
}

/* 一闪而过的调查员档案（不做任何解释） */
function flash(){
 const F=D.flash||{};const div=document.createElement('div');div.className='op-flash';
 div.innerHTML=`<div class="op-sys">${esc(F.title||'')}</div><table><tr><th>编号</th><th>调查员</th><th>状态</th></tr>${(F.rows||[]).map(r=>`<tr class="${/\{name\}/.test(r[1])?'me':''}"><td>${esc(r[0])}</td><td>${esc(fill(r[1]))}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>`;
 document.body.appendChild(div);if(window.AUDIO)AUDIO.sfx('glitch');UI.glitch('static',F.ms||1500);
 timers.push(setTimeout(()=>{div.remove();next()},F.ms||1500));
}
/* 标题画面 →「开始调查」 */
function title(){
 ff=false;const t0=document.getElementById('op-ff');if(t0){t0.textContent='⏩ 快进';t0.classList.remove('on')}
 const body=document.getElementById('op-body');document.getElementById('op-root').classList.add('op-titlemode');
 body.innerHTML=`<div class="op-title"><canvas class="op-title-art" width="480" height="220" aria-hidden="true"></canvas><h1>${esc(D.title||'')}</h1><div class="op-sub">${esc(D.subtitle||'')}</div><div class="op-day" lang="ja">${esc(D.dayTitle||'')}</div><button type="button" class="survival-btn" id="op-go">▶ 开始调查</button></div>`;
 const cv=body.querySelector('canvas');if(window.ART&&ART.title)try{ART.title(cv)}catch(e){}
 const b=body.querySelector('#op-go');b.onclick=finish;showPrev();b.focus({preventScroll:true});
}
function finish(){
 ff=false;clear();black(false);cancelAnimationFrame(anim);
 if(!campaign){toAuth();return}
 campaign.opening=Object.assign(campaign.opening||{},{done:true});FILES.grant();campaignSave();
 if(window.AUDIO)AUDIO.ambience('district');firstDayQuest();
}
/* 跳过序章：还没登记 → 先登记（必要设置不能跳过）；已经登记 → 直接进入 DAY 01 */
function skip(){
 clear();
 if(!campaign){skipFlag=true;toAuth();return} // 必要的设置（身份、期限、语言协议）不能跳过
 finish();
}

/* ---------- 背景（程序绘制） ---------- */
/* 第二页的三个像素镜头与逐行出现的旁白同步。 */
function drawTokyoEvening(cv){
 const c=cv.getContext('2d');
 const body=document.getElementById('op-body');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const descriptions=['下班的人走过斑马线。','店员在收银台扫描便当。','乘客靠着窗睡着，窗外灯光掠过。'];
 cv.width=320;cv.height=146;
 cv.removeAttribute('aria-hidden');
 cv.setAttribute('role','img');
 const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.floor(x),y,w,h)};
 let shot=-1,start=0;
 function frame(now){
  if(!cv.isConnected)return;
  const current=Math.max(0,Math.min(2,body.childElementCount-1));
  if(current!==shot){
   shot=current;start=now;
   cv.setAttribute('aria-label',descriptions[shot]);
  }
  const t=reduced?0:(now-start)/1000;
  rect('#121c2b',0,0,320,146);
  if(shot===0){
   for(let i=0;i<7;i++){
    const x=i*49,y=i%2?12:23;
    rect(i%2?'#263747':'#1e2e40',x,y,43,64);
    for(let j=0;j<3;j++)rect(j===1?'#df9e69':'#607b82',x+5+j*11,y+12,6,12);
   }
   rect('#42505a',0,78,320,11);
   rect('#273542',0,89,320,57);
   for(let x=26;x<300;x+=29)rect('#778991',x,103,15,25);
   rect('#64737c',264,57,3,37);
   rect('#14202c',260,52,11,18);
   rect('#6dc09b',263,62,5,5);
   const coats=['#596a8e','#915d58','#427d78','#a28764'];
   coats.forEach((coat,i)=>{
    const x=25+i*52+(i%2?-1:1)*(t*36%52);
    const y=106+(i%2)*7;
    const stride=Math.floor(t*9+i)%2;
    rect('#14202a',x+1,y+11,3,10-stride*3);
    rect('#14202a',x+6,y+11,3,7+stride*3);
    rect(coat,x-1,y-1,12,14);
    rect('#bc987d',x+1,y-8,8,8);
    rect('#3b3437',x+1,y-9,8,3);
   });
  }else if(shot===1){
   rect('#30434b',0,14,320,67);
   rect('#d0c5a0',0,15,320,5);
   for(let x=16;x<320;x+=22){
    rect('#786950',x,32,13,12);
    rect('#526d68',x+3,53,14,14);
   }
   rect('#202f3a',0,70,320,11);
   rect('#405f5f',83,63,48,35);
   rect('#b98e74',98,45,19,20);
   rect('#2c3239',96,43,23,8);
   rect('#847461',0,94,320,52);
   rect('#aa9170',0,94,320,7);
   rect('#24343f',156,60,56,30);
   rect('#72938b',162,65,43,7);
   rect('#4e605e',139,87,76,7);
   const x=106+Math.min(t*220,88);
   rect('#23282a',x,100,54,23);
   rect('#ded0ad',x+3,103,48,16);
   rect('#a97455',x+6,106,27,10);
   rect('#718564',x+36,106,11,10);
   if(t>.16&&t<.32)rect('#d77a68',164,105,3,16);
   if(t>.4){
    rect('#bda882',198,90,51,36);
    rect('#bda882',203,81,4,15);
    rect('#bda882',240,81,4,15);
    rect('#9c8766',207,110,32,4);
   }
  }else{
   rect('#3d4d59',0,0,320,109);
   rect('#212f3d',35,17,251,69);
   rect('#131e30',41,23,239,57);
   for(let i=0;i<11;i++){
    const x=43+((i*39+240-(t*(30+i*5))%237)%237);
    rect(i%3?'#506779':'#c7a478',x,41+(i*13)%30,4+i%3,2);
   }
   rect('#617782',40,80,241,4);
   rect('#514b65',0,99,320,29);
   rect('#615871',0,99,320,5);
   rect('#2c3945',0,128,320,18);
   rect('#243747',199,86,40,37);
   rect('#243747',218,91,28,26);
   rect('#2b262d',196,65,22,21);
   rect('#af8c76',204,71,17,15);
   rect('#2b262d',198,67,17,5);
   rect('#5f4650',251,108,23,16);
  }
  anim=requestAnimationFrame(frame);
 }
 frame(performance.now());
}

function drawBg(kind){
 cancelAnimationFrame(anim);const cv=document.getElementById('op-bg');if(!cv||!kind)return;if(kind==='tokyoEvening'){drawTokyoEvening(cv);return}const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 const W=cv.width,H=cv.height,lights=[...Array(140)].map((_,i)=>({x:(i*97)%W,y:H*0.45+((i*53)%Math.round(H*0.55)),s:1+(i%3),c:['#f2d48a','#e8ebf0','#d7a879','#b69ce8'][i%4],p:i%7}));
 let t0=0;const loop=ts=>{if(!document.body.contains(cv))return;if(ts-t0>60){t0=ts;const t=ts/1000;
  if(kind==='airport'&&window.PXART&&cv.width===512){PXART.draw('op_airport',c,t,{},{});anim=requestAnimationFrame(loop);return}
  if(kind==='plane'){
   c.fillStyle='#0b0e14';c.fillRect(0,0,W,H);const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0d1424');g.addColorStop(1,'#1c2634');
   c.save();c.beginPath();c.ellipse(W/2,H/2,W*0.26,H*0.42,0,0,Math.PI*2);c.clip();c.fillStyle=g;c.fillRect(0,0,W,H);
   const off=(t*12)%W;lights.forEach(l=>{if(Math.sin(t*2+l.p)>-0.6){c.fillStyle=l.c;c.fillRect((l.x+off)%W,l.y,l.s,l.s)}});c.restore();
   c.strokeStyle='#334158';c.lineWidth=10;c.beginPath();c.ellipse(W/2,H/2,W*0.26,H*0.42,0,0,Math.PI*2);c.stroke();
   c.strokeStyle='#8d9bb0';c.lineWidth=2;c.beginPath();c.ellipse(W/2,H/2,W*0.29,H*0.46,0,0,Math.PI*2);c.stroke();
  }else{
   c.fillStyle='#141b28';c.fillRect(0,0,W,H);c.fillStyle='#1c2634';c.fillRect(0,H*0.62,W,H*0.38);
   for(let i=0;i<8;i++){c.fillStyle=Math.floor(t*3+i)%23?'#e8ebf0':'#8d9bb0';c.fillRect(20+i*60,18,40,4)}
   c.fillStyle='#d9bf7d';c.fillRect(30,40,130,24);c.fillStyle='#10141c';c.font='bold 13px sans-serif';c.fillText('到着 ARRIVALS',38,57);
   for(let i=0;i<6;i++){const x=((i*90+t*(20+i*4))%(W+60))-30,y=H*0.5;c.fillStyle='#2a3446';c.fillRect(x,y,14,40);c.fillStyle='#d8b896';c.fillRect(x+2,y-12,10,10);c.fillStyle='#4a5568';c.fillRect(x+16,y+22,12,18)}
  }
  const v=c.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.8);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');c.fillStyle=v;c.fillRect(0,0,W,H);
 }anim=requestAnimationFrame(loop)};anim=requestAnimationFrame(loop);
}

/* 键盘：空格 / Enter = 立即显示全文或下一段 */
if(!keyBound){keyBound=true;document.addEventListener('keydown',e=>{
 if(!document.getElementById('op-root')||DM.isOpen())return;if(/input|textarea|select/i.test((e.target&&e.target.tagName)||''))return;
 if(e.key===' '||e.key==='Enter'){if(typing){e.preventDefault();finishTyping();return}const b=document.getElementById('op-next');if(b&&!b.hidden&&document.activeElement!==b){e.preventDefault();b.click()}}
})}

function start(base){setupBase=base;pre={scene:0,page:0};regActive=false;skipFlag=false;draft='';play()}
return {authStep:()=>auth&&auth.step,prev,canPrev,enabled,skipScene,toggleFF,ff:()=>ff,registering:()=>regActive,start,resume,play,skip,finish,onCreated,setBase:b=>{setupBase=b},state:()=>st(),scenes:SC,active:()=>!!document.getElementById('op-root')};
})();
window.OPEN=OPEN;

/* ---------- 接入：新游戏 → 序章；存档建立后 → 序章后半段 → DAY 01 ---------- */
const opSetup=setupCampaign;
setupCampaign=function(){OPEN.setBase(opSetup);if(!campaign&&OPEN.enabled()&&!OPEN.active()&&!OPEN.registering()){OPEN.start(opSetup);return}opSetup()};
const opFirstDay=firstDayQuest;
firstDayQuest=function(){OPEN.onCreated();if(campaign&&campaign.opening&&!campaign.opening.done){OPEN.resume();return}opFirstDay()};
/* ---------- v25.2 成田暂不开放（config 的 start.portChoice = false）：东京地图上的「旅の出発点」和「更换出生机场」里也不能选成田 ---------- */
const naritaOpen=()=>!!((GAME_CONFIG.start||{}).portChoice);
const naritaLockNote=()=>((GAME_CONFIG.start||{}).naritaLockedText)||'暂未开放';
function lockNarita(scope){if(naritaOpen()||!scope)return;
 scope.querySelectorAll('[data-gate="narita"],[data-birth="narita"],[data-birth-choice="narita"]').forEach(b=>{b.disabled=true;b.setAttribute('aria-disabled','true');b.classList.add('et-locked');b.onclick=null;if(!b.querySelector('.et-lock-note'))b.insertAdjacentHTML('beforeend',`<small class="et-lock-note">🔒 ${esc(naritaLockNote())}</small>`)})}
const nlHome=tokyoHome;tokyoHome=function(){nlHome.apply(this,arguments);lockNarita(app)};
const nlSpawn=spawnScreen;spawnScreen=function(){nlSpawn.apply(this,arguments);lockNarita(app)};
