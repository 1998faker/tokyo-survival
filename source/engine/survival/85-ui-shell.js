/* ==== engine/survival/85-ui-shell.js ==== */
/* ===================================================================
   【V18 统一界面：顶部状态栏 · 底部导航 · 任务/背包/档案/设置 · 弹窗 · 场景管理】
   顶部：極悪東京 | DAY 01 22:43  ·  疲劳点 / SAN / ¥（数值直接读取存档，任何变化自动刷新）
   底部：地图 | 任务 | 背包 | 档案 | 设置
   SceneManager：记录当前在哪个画面，打开功能页后可以「返回」原来的画面。
   物品资料在 data/items.json。
   =================================================================== */
const ITEMS=(GAME_DATA.d["items"]||{}).items||[];
const UI=(function(){
 let top=null,nav=null,modalHost=null,current={name:'',resume:null},anomaly={clock:null,until:0};
 const NAV=[['map','🗺','地图'],['quest','📜','任务'],['bag','🎒','背包'],['reasoning','🔍','推理'],['archive','📁','档案'],['mail','✉','邮件'],['settings','⚙','设置']];
 function mount(){
  if(top)return;document.body.classList.add('et');
  top=document.createElement('header');top.id='et-top';top.className='et-top';top.setAttribute('aria-live','polite');
  nav=document.createElement('nav');nav.id='et-nav';nav.className='et-nav';nav.setAttribute('aria-label','功能导航');
  nav.innerHTML=NAV.map(([id,ic,t])=>`<button type="button" data-nav="${id}"${id==='reasoning'?' class="et-nav-reasoning" aria-label="推理系统"':''}><span aria-hidden="true">${ic}</span><b>${t}</b></button>`).join('');
  modalHost=document.createElement('div');modalHost.id='et-modal';
  const appEl=document.getElementById('app');appEl.parentNode.insertBefore(top,appEl);appEl.parentNode.insertBefore(nav,appEl.nextSibling);document.body.appendChild(modalHost);
  nav.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>go(b.dataset.nav));
  update();
 }
 /* ---------- 状态栏 ---------- */
 let pending=false;
 function update(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;paint()})}
 function locName(){
  if(!campaign)return '';
  if(current.name==='pixel'||current.name==='investigate')return '品川 · '+(window.H18&&H18.placeName?H18.placeName():'酒店');
  if(window.PRO&&PRO.applies()&&PRO.placeName)return PRO.placeName();
  if(current.name==='district'&&district)return district.jp;
  const id=campaign.location||(campaign.firstDayComplete?'shinagawa':campaign.birth);return (byId[id]&&byId[id].jp)||'';
 }
 function paint(){
  if(nav){const q=nav.querySelector('[data-nav="quest"]');if(q)q.classList.toggle('et-badge',!!campaign&&!!campaign.firstDayComplete&&typeof storyReady==='function'&&storyReady()&&!(window.H18&&H18.active()))}if(window.MAIL)MAIL.badge();
  if(!top)return;
  document.body.classList.toggle('v51-live',!!campaign);
  if(!campaign){top.innerHTML=`<div class="et-row"><span class="et-brand">極悪東京</span><span class="et-sep">|</span><span class="et-day">新的旅程</span></div>`;return}
  dayDefaults();const P=GAME_CONFIG.player,now=TM.now(),fake=anomaly.until>Date.now()?anomaly.clock:null;
  const day=String(Math.min(campaign.day,campaign.days)).padStart(2,'0');
  const pct=(v,m)=>Math.max(0,Math.min(100,Math.round(v/m*100)));
  top.innerHTML=`<div class="et-row"><span class="et-brand">極悪東京</span><span class="et-sep">|</span><span class="et-day">DAY ${day}</span><span class="et-time${fake?' et-glitch':''}">${fake||TM.fmt(now)}${fake?'（感知偏移）':''}</span><span class="et-phase">${fake?'——':TM.label(now)}</span><span class="et-loc">📍 ${esc(locName())}</span></div>
  <div class="et-row et-res"><span class="et-hp" title="疲劳点">疲劳点 <b>${campaign.hp}</b>/${P.maxHP}<i style="--w:${pct(campaign.hp,P.maxHP)}%"></i></span><span class="et-sep">|</span>${window.V52U&&!V52U.has('san')?'':`<span class="et-san" title="理智值">SAN <b>${campaign.san}</b>/${P.maxSAN}<i style="--w:${pct(campaign.san,P.maxSAN)}%"></i></span><span class="et-sep">|</span>`}<span class="et-cash" title="金钱">¥${campaign.cash.toLocaleString('ja-JP')}</span>
  <span class="et-mini">${[window.PRO&&PRO.applies()?'':'行动 '+campaign.actions+'/'+GAME_CONFIG.day.actionsPerDay+(window.V74&&V74.extraLeft()?' +'+V74.extraLeft()+'（提神）':''),window.V52U&&!V52U.has('stress')?'':'压力 '+campaign.stress].filter(Boolean).join(' · ')}</span></div>${V51.details()}`;
  window.OMI?.badge();window.ARCHIVEUX?.badge();document.body.classList.toggle('et-low-hp',campaign.hp<=P.maxHP*.25);
 }
 /* ---------- 场景管理 ---------- */
 function scene(name,resume){current={name,resume:resume||current.resume};document.body.dataset.scene=name;if(nav)nav.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav===({map:'map',district:'map',investigation:'reasoning'}[name]||name)));update()}
 let backTo=null;
 function go(id){
  if(DM.current()?.choices[0]?.whisper||campaign?.v51?.death)return;
  if(V51ADD.inLife()){V51ADD.exitLife();return}
  V51ADD.leaveNotes();
  if(current.name==='quiz'&&id==='map'&&typeof st!=='undefined'&&st.list&&st.i<st.list.length&&!st.ans){confirmBox('退出当前日语挑战？','已经回答的题目会保留记录，本次挑战不会结算。',()=>{leaveScene();tokyoHome()});return}
  if(id==='map'){leaveScene();if(campaign&&!campaign.firstDayComplete){firstDayQuest();return}tokyoHome();return}
  if(!campaign){setupCampaign();return}
  if(!['quest','bag','archive','reasoning','investigation','mail','settings'].includes(current.name))backTo={name:current.name,resume:current.resume};
  leaveScene();
  ({quest:questPage,bag:bagPage,archive:archivePage,reasoning:()=>{if(window.INV){INV._reset();INV.page()}else UI.toast('推理系统尚未载入')},mail:()=>window.MAIL&&MAIL.page(),settings:()=>UI.settingsPage()})[id]();
 }
 function leaveScene(){if(window.H18&&H18.active())H18.pause();DM.close()}
 function back(){const b=backTo;backTo=null;if(!campaign){setupCampaign();return}if(b&&b.resume){try{b.resume();return}catch(e){console.error(e)}}tokyoHome()}
 function page(name,title,kicker,body){
  scene(name,null);
  app.innerHTML=`<div class="rpg-shell et-page"><section class="rpg-panel et-page-head"><div><div class="rpg-kicker">${kicker}</div><h1>${title}</h1></div><button type="button" class="rpg-inline-back" id="et-back">← 返回</button></section>${body}</div>`;
  app.querySelector('#et-back').onclick=back;window.scrollTo(0,0);
 }
 /* ---------- 任务 ---------- */
 function questPage(){
  storyInit();const i=campaign.storyIndex;
  const main=STORY.map((c,n)=>{const done=n<i,now=n===i,unlockDay=storyUnlockDay(n);return `<div class="et-quest ${done?'done':now?'now':'lock'}"><b>${done?'✓':now?'▶':'🔒'} ${esc(storyTitleShown(n))}</b><small>${(done||now)&&!(n===0&&window.PRO&&PRO.applies())?esc(c.placeName):'？？？'}${!done&&!now?' · 先完成前面的章节':now&&campaign.day<unlockDay?' · 第 '+unlockDay+' 天解锁调查':''}</small></div>`}).join('');
  let objectives='';
  if(i===0&&window.H18){objectives=H18.objectives().map(o=>`<li class="${o.done?'done':''}">${o.done?'☑':'☐'} ${esc(o.text)}</li>`).join('')}
  else if(STORY[i]){objectives=`<li>☐ ${esc(STORY[i].placeName)}：线索调查 ${campaign.storyStep||0}/${STORY[i].steps.length}</li>`}
  const extra=(window.__STORY?__STORY.chaptersAvailable('map'):[]);
  page('quest','任务','QUEST LOG',`
   <section class="rpg-panel"><h2>当前目标</h2>${campaign.firstDayComplete?`${STORY[i]?`<div class="et-main-now"><div class="rpg-kicker">MAIN QUEST // ${i+1} / ${STORY.length}</div><b>📜 ${esc(STORY[i].title)}</b><small>${storyReady()?esc(STORY[i].placeName)+' · 现在可以调查':'将在第 '+storyUnlockDay(i)+' 天解锁新的调查'} · 已取得线索 ${(campaign.storyClues||[]).length} 条 · DAY ${campaign.day}/${campaign.days}</small></div>`:''}<ul class="et-objectives">${objectives||'<li>主线已全部完成。</li>'}</ul><button type="button" class="survival-btn" id="et-q-go"${i>=STORY.length||!storyReady()?' disabled':''}>${storyReady()?'▶ 追踪当前主线':'🔒 等待线索出现'}</button>${(campaign.storyClues||[]).length?`<details class="et-main-log"><summary>调查日志 / 已取得的线索（${campaign.storyClues.length}）</summary>${campaign.storyClues.map(t=>`<div class="story-entry done">${esc(t)}</div>`).join('')}</details>`:''}`:(window.PRO&&PRO.applies()?`<ul class="et-objectives">${PRO.objectives().map(o=>`<li class="${o.done?'done':''}">${o.done?'☑':'☐'} ${esc(o.text)}</li>`).join('')}</ul><button type="button" class="survival-btn" id="et-q-day1">▶ 继续第一章</button>`:`<ul class="et-objectives"><li>☐ 第一天：从机场乘车到品川，并在酒店办理入住（${campaign.firstDayStep||0}/4）</li></ul><button type="button" class="survival-btn" id="et-q-day1">▶ 继续第一天</button>`)}</section>
   ${campaign.firstDayComplete&&campaign.storyIndex===0&&!(campaign.hotelCase&&campaign.hotelCase.ending)&&!(campaign.case1&&['closed','submitted','due','report'].includes(campaign.case1.state))?`<section class="rpg-panel" style="border:1px solid #c49b55"><div class="rpg-kicker">CASE NO. 001 / 夜间调查</div><h2>🌙 今晚记得回港屋酒店</h2><p>白天可以打工和探索；每天傍晚回到酒店，继续调查207号室。调查夜数有限，直接结束一天可能错过当晚的线索与证言。</p><p class="survival-tip">入口：点击上方「▶ 追踪当前主线」，或前往「品川 → 港屋酒店」。进入酒店会结束当天剩余的白天行动。</p><button type="button" class="survival-btn" id="et-night-hotel">🏨 回酒店调查</button></section>`:''}
   <section class="rpg-panel"><h2>主线章节</h2>${main}</section>
   ${extra.length?`<section class="rpg-panel"><h2>支线 / 新的剧情</h2>${extra.map(c=>`<button type="button" class="story-btn" data-extra-chapter="${esc(c.id)}">📖 ${esc(c.title)}</button>`).join('')}</section>`:''}
   ${window.PRO&&PRO.applies()?`<section class="rpg-panel"><h2>今天 · DAY ${campaign.day}/${campaign.days} · 第一夜</h2><p>现在 ${TM.fmt(TM.now())} · 入境之夜：今晚之内到港屋酒店办理入住（前台 ${esc((GAME_CONFIG.prologue||{}).frontClose||'24:00')} 截止）</p><p class="survival-tip">第一夜的时间按剧情里的行动计算（调查、走路、坐车都会花时间）。今晚不能打工，也不能提前结束这一天。</p></section>`:`<section class="rpg-panel"><h2>今天 · DAY ${campaign.day}/${campaign.days}</h2><p>剩余行动 ${campaign.actions}/${GAME_CONFIG.day.actionsPerDay} · 现在 ${TM.fmt(TM.now())}${V52.eroShown()?' · 浸蚀 '+['','Ⅰ','Ⅱ','Ⅲ','Ⅳ'][V52.eroStage()]:''}</p><p class="survival-tip">打工、日语挑战、首次探索街区、休息各消耗 1 次行动（约 ${GAME_CONFIG.time.hoursPerAction} 小时）。回酒店进行夜间调查会用掉今天剩余的时间。每晚支付生活费 ${nightlyCost()} 円。</p><div class="daily-buttons"><button type="button" class="survival-btn" id="et-q-work">💴 打工</button><button type="button" class="survival-btn alt" id="et-q-night">☾ 夜间结算 / 下一天</button></div></section>`}`);
  const nh=app.querySelector('#et-night-hotel');if(nh)nh.onclick=storyQuest;
  const g=app.querySelector('#et-q-go');if(g)g.onclick=storyQuest;const d1=app.querySelector('#et-q-day1');if(d1)d1.onclick=firstDayQuest;
  const qw=app.querySelector('#et-q-work');if(qw)qw.onclick=workShift;const qn=app.querySelector('#et-q-night');if(qn)qn.onclick=()=>confirmBox('结束今天？','将支付生活费并进入下一天。剩余行动越多，压力增加越少。',nightlyClose);
  app.querySelectorAll('[data-extra-chapter]').forEach(b=>b.onclick=()=>__STORY.chapterPlay(b.dataset.extraChapter));
  /* v24.1：日语学习入口从档案移到这里 */
  const shell=app.querySelector('.et-page')||app.querySelector('.rpg-shell');if(shell&&!PRO_ACTIVE()){shell.insertAdjacentHTML('beforeend',`<section class="rpg-panel" id="et-learn"><h2>📚 日语学习</h2><div class="rpg-list"><button type="button" class="rpg-action" data-learn="catalog">📖 原版题库</button><button type="button" class="rpg-action" data-learn="review">📜 学习记录 / 错题</button><button type="button" class="rpg-action" data-learn="status">⚔️ 冒险者等级</button></div></section>`);
   app.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>{const a=b.dataset.learn;scene('learn',null);if(a==='catalog')originalHome();else if(a==='review'){if(typeof learnProgress==='function')learnProgress();else originalHome()}else statusPage()})}
  window.CASEQUEST?.mount();
 }
 function PRO_ACTIVE(){return !!(window.PRO&&PRO.applies())}
 /* ---------- 背包 ---------- */
 function inventory(){
  const inv=Object.assign({},campaign.items||{});
  return ITEMS.filter(it=>inv[it.id]>0).map(it=>Object.assign({count:inv[it.id]},it));
 }
 function bagPage(){
  const list=inventory();const ev=window.H18?H18.evidenceList():[];
  page('bag','背包','INVENTORY',`
   <section class="rpg-panel"><h2>💴 金钱</h2><p class="et-big">¥${campaign.cash.toLocaleString('ja-JP')}</p><p class="survival-tip">每晚生活费 ${nightlyCost()} 円${caseLodgingActive()?'（房费由委托方承担，餐饮等自付）':''}；乘电车需要车费。钱归零时游戏结束。</p></section>
   <section class="rpg-panel"><h2>🎒 随身物品</h2>${list.length?`<div class="et-items">${list.map(it=>`<div class="et-item"><span class="et-item-ic">${it.icon}</span><div><b>${esc(it.name)}${it.count>1?' ×'+it.count:''}</b><small>${esc(it.desc)}</small></div></div>`).join('')}</div>`:'<p class="survival-tip">背包里还没有特别的东西。</p>'}</section>
   <section class="rpg-panel"><h2>🔎 证据</h2><p>${ev.length?'已收集 '+ev.length+' 件证据，详情在「推理」。':'还没有收集到证据。'}</p><button type="button" class="survival-btn alt" id="et-to-archive">🧩 打开推理</button></section>`);
  app.querySelector('#et-to-archive').onclick=()=>UI.go('reasoning'); if(window.STREET)app.querySelector('.et-page').insertAdjacentHTML('beforeend',STREET.bag());if(window.DAYPHASE3)DAYPHASE3.attachBag();if(window.OMI)OMI.attachBag();if(window.V74)V74.attachBag();const albumButton=document.createElement('button');albumButton.className='survival-btn';albumButton.textContent='城市相册';albumButton.onclick=()=>CITYPHOTO.gallery();app.querySelector('.et-page').appendChild(albumButton);
 }
 /* ---------- 档案 ---------- */
 function archivePage(){
  /* v24.1 档案整理：FILE 01 调查员 → 02 人物 → 03 证据 → 04 异常事件 → 05 东京都异闻录 → 06 调查日志。
     《东京生存守则》和 CASE NO. 001 移到邮件；日语学习入口移到「任务」页。 */
  const rel=window.H18?H18.relations():[],log=window.H18?H18.diary():[];
  const FL=window.FILES;
  const logBody=log.length?`<h3>📓 第一章的调查日志</h3>${log.slice(-10).reverse().map(t=>`<div class="story-entry">${esc(t)}</div>`).join('')}`:'';
  page('archive','档案','ARCHIVE',`
   ${FL?FL.tabs()+FL.investigator()+FL.people(rel):''}
   ${FL?FL.anomalies():''}
   ${window.EXPLORE?EXPLORE.archive():''}
   <section class="rpg-panel et-file" id="file-6"><div class="et-file-no">FILE 06</div><h2>📓 调查日志</h2>${logBody||'<p class="survival-tip">（尚无记录）</p>'}${ROOMFILE.filmButtons()}</section>
   <p class="survival-tip">《东京生存守则》和委托资料在 ✉ 邮件里；日语题库和错题在「任务」页。</p>`);

  if(window.FILES)FILES.bindTabs();
  if(window.DAYPHASE3){const a=app.querySelector("#file-6");if(a){const b=document.createElement("button");b.className="survival-btn alt";b.textContent="📓 私人调查笔记";b.onclick=()=>DAYPHASE3.notesPage();a.appendChild(b)}}
  ROOMFILE.bindFilms();window.ARCHIVEUX?.mount();
 }
 /* 仅展示既有记录；不修改获得条件或存档。线索、证词、证物统一放入推理页面。 */
 function reasoningRecords(){
  if(!campaign)return '<p class="survival-tip">尚未开始调查。</p>';
  const ev=window.H18?H18.evidenceList(true):[],tes=window.H18?H18.testimonies():[];
  const pro=window.PRO?PRO.clueList():[],kb=window.KNPC?KNPC.archive():'';
  const clues=(campaign.storyClues||[]).filter(t=>!/^第一章/.test(t)).slice(-12);
  const text=(pro.length?`<h3>🌧 入境之夜的线索（${pro.length}/5）</h3>${pro.map(c=>`<div class="et-evidence"><b>${c.no}. ${esc(c.name)}</b>${c.jp?`<small class="et-jp" lang="ja">📖「${esc(c.jp)}」</small>`:''}<small>${esc(c.place)} · ${esc(c.desc)}</small></div>`).join('')}`:'')
   +(ev.length?`<h3>🔎 第一章的原始证物</h3>${ev.map(e=>`<div class="et-evidence"><b>${e.icon||'▪'} ${esc(e.name)}</b>${e.jp?`<small class="et-jp" lang="ja">📖「${esc(e.jp)}」</small>`:''}<small>${esc(e.desc)}</small></div>`).join('')}`:'')
   +(tes.length?`<h3>🗣 已取得证词</h3>${tes.map(t=>`<div class="story-entry">${esc(t)}</div>`).join('')}`:'')
   +(clues.length?`<h3>📜 其他主线线索</h3>${clues.map(t=>`<div class="story-entry">${esc(t)}</div>`).join('')}`:'')+kb;
  return `<div class="reasoning-raw-intro">来自调查现场、证人、入境过程和便利店的原始记录，集中归档于此；重复出现在「线索库」中的条目不会重复计为可组合线索。</div>${text||'<p class="survival-tip">尚无原始记录。探索并与人物交谈后会自动更新。</p>'}`;
 }
 /* ---------- 设置 ---------- */
 function settingsPage(){
  const sp=SETTINGS.get('textSpeed'),an=SETTINGS.get('anomalies'),fs=SETTINGS.get('fontSize');
  const aopt=(k,v,label)=>`<button type="button" class="line-chip" data-audio="${k}" data-val="${v}" aria-pressed="${String(window.AUDIO&&AUDIO.get(k))===String(v)}">${label}</button>`;
  const opt=(name,val,cur,label)=>`<button type="button" class="line-chip" data-set="${name}" data-val="${val}" aria-pressed="${String(cur)===String(val)}">${label}</button>`;
  page('settings','设置','SETTINGS',`
   <section class="rpg-panel"><h2>文字显示速度</h2><div class="map-legend">${opt('textSpeed','slow',sp,'慢')}${opt('textSpeed','normal',sp,'普通')}${opt('textSpeed','fast',sp,'快')}${opt('textSpeed','instant',sp,'立即显示')}</div><p class="survival-tip">对话逐字显示时，点一下文字或按空格可以立即显示全文。</p></section>
   <section class="rpg-panel"><h2>画面模式</h2><div class="map-legend">${opt('theme','auto',SETTINGS.get('theme')||'auto','自动')}${opt('theme','day',SETTINGS.get('theme')||'auto','日间 · 白昼浓雾')}${opt('theme','night',SETTINGS.get('theme')||'auto','夜间')}</div><p class="survival-tip">自动：游戏时间 05:00–17:59 用日间，其余时间用夜间；状态较差时，地图也可能呈现夜间色调。日间更亮、字更清楚，适合长时间阅读。现在：${window.MAP46&&MAP46.night()?'夜间':'日间'}。</p></section>
   <section class="rpg-panel"><h2>字号</h2><div class="map-legend">${opt('fontSize','normal',fs,'标准')}${opt('fontSize','large',fs,'大')}</div></section>
   <section class="rpg-panel"><h2>📚 日语学习</h2><p class="survival-tip">原日语学习 App（游客模式／留学生模式、题库、收藏与错题本）已收进设置，需要时从这里进入。</p><button type="button" class="rpg-action" onclick="home()">打开日语学习 →</button></section> <section class="rpg-panel"><h2>开幕序章</h2><div class="map-legend">${opt('opening','true',SETTINGS.get('opening')!==false,'新游戏时播放')}${opt('opening','false',SETTINGS.get('opening')!==false,'不播放')}</div><p class="survival-tip">开始新游戏时播放《TOKYO: THE UNSEEN》序章。播放时也可以随时「跳过序章」。</p></section>
   ${campaign?`<section class="rpg-panel"><h2>语言辅助协议</h2><div class="map-legend"><button type="button" class="line-chip" data-lang-mode="story" aria-pressed="${langMode()==='story'}">剧情体验模式</button><button type="button" class="line-chip" data-lang-mode="learning" aria-pressed="${langMode()==='learning'}">日语学习模式</button></div><p class="survival-tip">剧情体验：日语原文 + 自动显示中文翻译。日语学习：默认只显示日语，非答题的地方可以点「查看中文翻译」。不影响日语答题、疲劳点、SAN、剧情和结局。</p></section>`:''}
   <section class="rpg-panel"><h2>异常效果</h2><div class="map-legend">${opt('anomalies','true',an,'开启')}${opt('anomalies','false',an,'关闭')}</div><p class="survival-tip">开启时，SAN 偏低或在特定地点，状态栏、时间和界面会出现异常。容易头晕可以关闭。</p></section>
   <section class="rpg-panel"><h2>压力画面效果</h2><div class="map-legend">${opt('stressFx','full',SETTINGS.get('stressFx')||'full','完整')}${opt('stressFx','soft',SETTINGS.get('stressFx')||'full','减弱')}</div><p class="survival-tip">压力高时画面会短暂模糊、摇晃。选「减弱」时，摇晃改为四周变暗，模糊减半。容易头晕请选「减弱」。</p></section>
   <section class="rpg-panel"><h2>强烈画面</h2><div class="map-legend">${opt('gore','full',SETTINGS.get('gore')||'full','完整')}${opt('gore','soft',SETTINGS.get('gore')||'full','减弱')}</div><p class="survival-tip">选「减弱」时，事故等场面的血迹颜色更暗、不画出细节。剧情和结果不变。</p></section>
   <section class="rpg-panel"><h2>声音</h2>${window.AUDIO?`<div class="et-sound-row"><span>音效</span><div class="map-legend">${aopt('sfx',true,'开')}${aopt('sfx',false,'关')}</div></div><div class="et-sound-row"><span>环境音</span><div class="map-legend">${aopt('music',true,'开')}${aopt('music',false,'关')}</div></div><div class="et-sound-row"><span>音量</span><div class="map-legend">${aopt('volume',0.3,'小')}${aopt('volume',0.6,'中')}${aopt('volume',1,'大')}</div></div><p class="survival-tip">声音全部由浏览器实时合成。手机静音模式下可能听不到。第一次点击画面后才会开始播放。</p>`:''}</section>
   <section class="rpg-panel"><h2>存档</h2><p class="survival-tip">进度会自动保存。想留一个可以随时回去的进度，用「存档 / 读档」；想换手机或换浏览器，先「导出存档」，再到新设备「导入存档」。</p><div class="rpg-list"><button type="button" class="rpg-action primary" id="et-slots">💾 存档 / 读档 / 重新开始</button><button type="button" class="rpg-action" id="et-export">📤 导出存档</button><button type="button" class="rpg-action" id="et-import">📥 导入存档</button></div><div id="et-save-area"></div></section>
   <section class="rpg-panel"><h2>关于</h2><p class="survival-tip">${esc(GAME_CONFIG.meta.title)} ${esc(GAME_CONFIG.meta.version)} · 日语答错只扣 疲劳点；只有违反超自然规则或遭受特定精神冲击才扣 SAN。</p></section>`);
  app.querySelectorAll('[data-audio]').forEach(b=>b.onclick=()=>{const v=b.dataset.val,val=v==='true'?true:v==='false'?false:Number(v);AUDIO.set(b.dataset.audio,val);AUDIO.unlock();settingsPage();AUDIO.sfx('ok')});
  app.querySelectorAll('[data-lang-mode]').forEach(b=>b.onclick=()=>{if(!campaign)return;campaign.languageMode=b.dataset.langMode;campaignSave();settingsPage();toast('语言辅助协议：'+langLabel())});
  app.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{const v=b.dataset.val;SETTINGS.set(b.dataset.set,v==='true'?true:v==='false'?false:v);settingsPage()});
  const area=app.querySelector('#et-save-area');
  app.querySelector('#et-export').onclick=()=>{const t=SM.exportText();area.innerHTML=`<textarea class="et-save-text" readonly>${esc(t)}</textarea><div class="rpg-list"><button type="button" class="rpg-action" id="et-copy">复制</button>${window.self===window.top?'<button type="button" class="rpg-action" id="et-dl">下载文件</button>':''}</div>`;
   area.querySelector('#et-copy').onclick=()=>{const ta=area.querySelector('textarea');ta.select();try{navigator.clipboard.writeText(t).then(()=>toast('已复制'),()=>{document.execCommand('copy');toast('已复制')})}catch(e){document.execCommand('copy');toast('已复制')}};
   const dl=area.querySelector('#et-dl');if(dl)dl.onclick=()=>{try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'application/json'}));a.download='极恶东京存档-DAY'+campaign.day+'.json';document.body.appendChild(a);a.click();a.remove()}catch(e){toast('当前环境不能下载，请使用「复制」')}}};
  app.querySelector('#et-import').onclick=()=>{area.innerHTML=`<textarea class="et-save-text" placeholder="把导出的存档文字粘贴到这里"></textarea><button type="button" class="survival-btn" id="et-do-import">读取这个存档</button>`;
   area.querySelector('#et-do-import').onclick=()=>{const err=SM.importText(area.querySelector('textarea').value.trim());if(err){toast(err);return}confirmBox('存档已读取','页面将重新载入。',()=>location.reload(),true)}};
  app.querySelector('#et-slots').onclick=savePage;
 }
 /* ---------- 存档 / 读档 / 重新开始 ---------- */
 function fmtTime(iso){try{const d=new Date(iso),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'/'+p(d.getMonth()+1)+'/'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())}catch(e){return ''}}
 function sumLine(m){return `DAY ${m.day}/${m.days} · ${esc(m.mode)} · ${esc(m.chapter)}<br><span class="et-hp">疲劳点 ${m.hp}</span> · <span class="et-san">SAN ${m.san}</span> · <span class="et-cash">¥${Number(m.cash).toLocaleString('ja-JP')}</span>${m.place?' · 📍'+esc(m.place):''}`}
 function savePage(){
  if(current.name!=='saves'&&!['quest','bag','archive','settings'].includes(current.name))backTo={name:current.name,resume:current.resume};
  leaveScene();
  const list=SM.slots(),cur=campaign?SM.summary(campaign):null;
  page('saves','存档 / 读档','SAVE & LOAD',`
   <section class="rpg-panel"><h2>▶ 当前进度（自动保存）</h2>${cur?`<div class="et-slot now"><div><b>${esc(cur.who)}</b><small>${sumLine(cur)}</small></div></div><p class="survival-tip">每一步都会自动保存。下面的栏位是你自己选择保存的「存档点」，读取后可以回到那个时刻。</p>`:'<p class="survival-tip">现在没有进行中的游戏。可以读取下面的存档，或者开始新游戏。</p>'}</section>
   <section class="rpg-panel"><h2>💾 存档栏位</h2>${list.map((r,i)=>`<div class="et-slot${r?'':' empty'}"><div><b>栏位 ${i+1}${r?' · '+fmtTime(r.saved):' · 空'}</b>${r?`<small>${esc(r.summary.who)}<br>${sumLine(r.summary)}</small>`:'<small>还没有存档</small>'}</div>
    <div class="et-slot-btns"><button type="button" class="survival-btn" data-slot-save="${i+1}"${campaign?'':' disabled'}>保存</button><button type="button" class="survival-btn alt" data-slot-load="${i+1}"${r?'':' disabled'}>读取</button><button type="button" class="survival-btn alt" data-slot-del="${i+1}"${r?'':' disabled'}>删除</button></div></div>`).join('')}</section>
   <section class="rpg-panel"><h2>🔁 重新开始</h2><div class="rpg-list"><button type="button" class="rpg-action" id="et-restart-same"${campaign?'':' disabled'}>同一个角色，从第一天重新开始</button><button type="button" class="rpg-action" id="et-restart-new">重新创建角色（新游戏）</button></div><p class="survival-tip">重新开始只清除当前的生存进度；存档栏位和日语学习记录都会保留。建议先把当前进度存到一个栏位。</p></section>`);
  app.querySelectorAll('[data-slot-save]').forEach(b=>b.onclick=()=>{const n=+b.dataset.slotSave,doIt=()=>{if(SM.saveSlot(n)){toast('已保存到栏位 '+n);savePage()}else toast('保存失败：浏览器存储空间不足')};if(SM.readSlot(n))confirmBox('覆盖栏位 '+n+'？','这个栏位里原来的存档会被替换。',doIt);else doIt()});
  app.querySelectorAll('[data-slot-load]').forEach(b=>b.onclick=()=>{const n=+b.dataset.slotLoad;confirmBox('读取栏位 '+n+'？',campaign?'当前进度会被这个存档替换。如果想保留现在的进度，请先把它存到另一个栏位。':'将从这个存档继续游戏。',()=>{backTo=null;if(SM.loadSlot(n))toast('已读取栏位 '+n)})});
  app.querySelectorAll('[data-slot-del]').forEach(b=>b.onclick=()=>{const n=+b.dataset.slotDel;confirmBox('删除栏位 '+n+'？','删除后不能恢复。',()=>{SM.deleteSlot(n);savePage()})});
  const rs=app.querySelector('#et-restart-same');if(rs)rs.onclick=()=>confirmBox('从第一天重新开始？','保留现在的角色设定（期限、性别、出身、入境机场），疲劳点、SAN、金钱和剧情全部回到第一天。当前进度会被清除。',()=>{backTo=null;SM.restartSame()});
  app.querySelector('#et-restart-new').onclick=()=>confirmBox('重新创建角色？','当前生存进度会被清除，回到角色创建画面。',()=>{backTo=null;SM.newGame()});
 }
 /* ---------- 弹窗 ---------- */
 function modal(opts){
  if(!modalHost)mount();
  const btns=opts.buttons&&opts.buttons.length?opts.buttons:[{label:'知道了',primary:true}];
  modalHost.innerHTML=`<div class="et-modal-back" role="dialog" aria-modal="true"><div class="et-modal-card"><h2>${esc(opts.title||'提示')}</h2><div class="et-modal-body">${opts.html!=null?opts.html:esc(opts.text||'')}</div><div class="et-modal-btns">${btns.map((b,i)=>`<button type="button" class="${b.primary?'survival-btn':'survival-btn alt'}" data-mb="${i}">${esc(b.label)}</button>`).join('')}</div></div></div>`;
  modalHost.querySelectorAll('[data-mb]').forEach(b=>b.onclick=()=>{const fn=btns[+b.dataset.mb].fn;modalHost.innerHTML='';if(fn)fn()});
  const f=modalHost.querySelector('[data-mb]');if(f)f.focus();
 }
 function confirmBox(title,text,ok,noCancel){modal({title,text,buttons:noCancel?[{label:'确定',primary:true,fn:ok}]:[{label:'确定',primary:true,fn:ok},{label:'取消'}]})}
 let toastT=0;
 function toast(t){let el=document.getElementById('et-toast');if(!el){el=document.createElement('div');el.id='et-toast';el.className='et-toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{el.hidden=true},2600)}
 /* ---------- 界面异常 ---------- */
 function glitch(kind,ms){
  if(!SETTINGS.get('anomalies'))return;ms=ms||2600;
  if(kind==='clock'){anomaly={clock:'02:13',until:Date.now()+ms};update();setTimeout(update,ms+30)}
  if(kind==='static'){document.body.classList.add('et-static');setTimeout(()=>document.body.classList.remove('et-static'),ms)}
  if(kind==='nav'&&nav){const b=nav.querySelector('[data-nav="archive"] b');if(b){b.textContent='遺品';setTimeout(()=>{b.textContent='档案'},ms)}}
 }
 return {resumeFn:()=>current.resume,page,mount,update,scene,modal,confirm:confirmBox,toast,glitch,go,back,current:()=>current.name,questPage,bagPage,archivePage,reasoningRecords,settingsPage,savePage};
})();
window.alert=function(msg){UI.modal({title:'提示',text:String(msg)})};
GS.on(UI.update);

/* 各画面登记到场景管理器（用于状态栏地点、导航高亮、功能页返回） */
const uiMap=tokyoHome;tokyoHome=function(){UI.scene('map',tokyoHome);uiMap()};
const uiDistrict=renderDistrict;renderDistrict=function(){UI.scene('district',renderDistrict);uiDistrict()};
const uiStart=start;start=function(id){UI.scene('quiz',()=>{if(typeof st!=='undefined'&&st.list&&st.i<st.list.length)show();else tokyoHome()});uiStart(id)};
const uiSetup=setupCampaign;setupCampaign=function(){UI.scene('setup',setupCampaign);uiSetup()};
const uiDay1=firstDayQuest;firstDayQuest=function(){UI.scene('story',firstDayQuest);uiDay1()};
const uiStory=storyQuest;storyQuest=function(){UI.scene('story',storyQuest);uiStory()};
const uiStatus=survivalStatus;survivalStatus=function(){UI.scene('archive',survivalStatus);uiStatus()};

/* 角色创建画面：有存档时可以直接读档 */
const uiSetupSave=setupCampaign;setupCampaign=function(){uiSetupSave();if(!SM.slots().some(Boolean))return;const box=app.querySelector('#survival-setup');if(box&&!box.querySelector('#et-setup-load'))box.insertAdjacentHTML('afterbegin','<section class="rpg-panel"><h2>📂 继续以前的游戏？</h2><p class="survival-tip">你有保存过的存档。</p><button type="button" class="survival-btn" id="et-setup-load">💾 读取存档</button></section>');const b=app.querySelector('#et-setup-load');if(b)b.onclick=UI.savePage};
/* GAME OVER / 理智崩溃时：可以读档或重新开始 */
function addGameOverButtons(){const host=app.querySelector('#survival-restart')||app.querySelector('#san-ending');if(!host||app.querySelector('#et-go-load'))return;const where=host.id==='survival-restart'?host:host.querySelector('button')||host;where.insertAdjacentHTML('afterend','<button class="survival-btn alt" id="et-go-load">💾 读取存档</button>');app.querySelector('#et-go-load').onclick=UI.savePage}
/* 任何时候 疲劳点 / SAN / 金钱耗尽或压力爆表：弹出 GAME OVER，可以读档或重新开始（第一天有自己的重试，不弹） */
let deathShown=false;
function checkDeath(){
 if(!campaign||!campaign.firstDayComplete||V51.hasDeathEnding()||campaign.hp<=0){deathShown=false;return}
 if(!GS.dead()){deathShown=false;return}
 if(deathShown)return;deathShown=true;
 const P=GAME_CONFIG.player,why=campaign.hp<=0?(campaign.streetDeath?'嘴上功夫 · 死因：街头斗殴。调查中断，207号室的秘密依旧无人知晓。':'疲劳点 归零'):campaign.san<=0?'SAN 归零，理智崩溃':campaign.cash<=0?'钱用光了':'压力达到上限';
 const rw=DM.canRewind(); // 在剧情对话里死亡：可以回到最后一个选择
 const pending=campaign;
 setTimeout(()=>{if(campaign!==pending||V51.hasDeathEnding()||campaign.hp<=0||!GS.dead())return;document.querySelector('.sc-overlay')?.remove();UI.modal({title:campaign.streetDeath?'☠ 嘴上功夫':'☠ GAME OVER — 东京吞噬了你',text:why+'。\nDAY '+campaign.day+'/'+campaign.days+'。\n'+(rw?'可以回到死亡之前的最后一个选择、':'')+'可以读取之前的存档，或者重新开始。',buttons:[
  ...(rw?[{label:'↩ 回到最后一个选择（死亡之前）',primary:true,fn:()=>{deathShown=false;DM.rewind()}}]:[]),{label:'💾 读取存档',primary:!rw,fn:UI.savePage},{label:'🔁 同一个角色重新开始',fn:()=>SM.restartSame()},{label:'🆕 新游戏',fn:()=>SM.newGame()},{label:'查看生存档案',fn:()=>survivalStatus()}]})},400);
}
GS.on(checkDeath);setTimeout(checkDeath,600);
const uiMadness=showMadnessEnding;showMadnessEnding=function(r){uiMadness(r);addGameOverButtons()};
