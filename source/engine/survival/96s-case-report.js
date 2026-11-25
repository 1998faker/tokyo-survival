/* ==== engine/survival/96s-case-report.js ==== */
/* ===================================================================
   【第一章 · 第三阶段】六天调查期限 + 最终调查报告 + 统一结局判定入口（v28）
   - 期限：调查 DAY 1～DAY 6（config 的 chapter1.nights），第 6 个调查日的夜间调查结束（06:00）时到期。
           独立于生存模式的总天数：30 / 90 / 365 天模式不会延长；生存模式上限内截止。
           第一次进酒店时已经过了 caseReport.lateStartClock → 这一晚是「接案当晚」，第二天才是 DAY 1。
   - 到期：酒店里天亮时（87 的 dawn）、第二天回到酒店（87 的 tooLate / start）、回到东京地图（包装 tokyoHome）都会检查；
           只在对话、演出结束以后的安全时刻进入。状态存档，读档、换场景都绕不过去。
   - 常规结局：87 的 ending() 先问这里（intercept）——调查中做出的决定、最后一次见面的结果只记录下来，不播放结局。
           生存失败（疲劳点 / SAN / 午夜死亡等）不经过 ending()，照旧立即触发。
   - 报告：关键人物 1 名（data/investigation/report.json 的 persons，按 discover 条件判断是否已发现）+ 最多 4 项已获得的报告材料。
   - 判定：data/investigation/endings.json（人物 + 必要证据 + 禁止证据 + 剧情条件 + 优先级 + 兜底）。只看提交的证据。
           config 的 caseReport.judgeMode：temp=第三阶段临时适配，final=第四阶段正式规则（现在为空 → 兜底 filed）。
   - 存档：campaign.case1 = {start, startClock, state: active|due|report|submitted|closed, story:{decision, visit},
           draft:{person, evidence[]}, report:{…快照}, judge:{input, out}, endingId, played}
   - 旧存档：已经有结局 → closed（不重新开启）；三夜调查途中 → 以原来的 startDay 为 DAY 1，期限改为 6 天（不会倒退、不会是负数）。
   =================================================================== */
// Read existing analysis and verification records without granting evidence.
/* Two independent case-file threads: physical reconstruction and the last appointment. */
/* Player knowledge derived from existing investigation records and completed scenes. */
const CASE_FACTS=(()=>{
 const keys={caseCheckout:'checkout',caseSuspicion:'suspicion',caseDeath:'death',caseConcealment:'concealment',caseAccident:'accident',caseAccess:'access'};
 function read(c=campaign){
  const v=c?.hotelCase?.v18,flags=v?.flags||{},inv=c?.investigation||{};
  const clue=id=>!!inv.clues?.[id];
  const done=id=>!!(c?.verify?.done?.[id]||flags['vf:'+id]);
  const accident=!!c&&ROOMFILE.solved(c);
  const concealment=!!(flags.moriConfessed||flags['mori:concealment']||done('mori-concealment')||done('mori-D02')||
   ['森与佐藤共同隐瞒死亡的当事人证言','森经理的承认、被修改的登记记录'].includes(inv.evidence?.E03?.source)||
   inv.evidence?.E02?.source==='森经理的承认、被修改的登记记录');
  const death=concealment||!!flags['mori:deathAdmitted']||accident||inv.evidence?.E04?.source==='207浴室现场逐点复查及开门时间核对';
  const checkout=!!(flags.selfDeduced||inv.deductions?.D02||inv.deductions?.D11||clue('C13')||v?.clues?.includes('report')||inv.evidence?.E02||concealment);
  const suspicion=!!(concealment||clue('MC08')||inv.evidence?.E03||(checkout&&clue('C03')&&clue('C04')));
  return {checkout,suspicion,death,concealment,accident,access:!!flags.selfDeduced||concealment};
 }
 function flag(id){
  const key=Object.hasOwn(keys,id)?keys[id]:null;
  return key?read()[key]:undefined;
 }
 return {read,flag};
})();

const ROOMFILE=(()=>{
 const points=[
 ['BR01','浴缸出口','浴缸在西侧，出口朝东。缸沿与外侧地面约有一膝高的落差。',59,54],
 ['BR02','地砖接缝','出口东侧的两块地砖略低，接缝凹陷，边缘留着水渍。',68,66],
 ['BR03','扶手底座','东墙扶手底座下缘压进了填缝。螺丝没有旋动的划痕。',78,45],
 ['BR04','浴缸硬边','出口西侧的搪瓷棱边上有一道旧磕痕，部分釉面剥落。痕迹形成时间不明。',51,43],
 ['BR05','浴室门框','锁孔边的木刺朝门内翻。门框贴有维修签，编号可与开门记录比对。',92,80]
 ];
 const questions=[ // v63：每题需要组合两处观察；错误选项都是说得通、但与某处观察矛盾的解释；选项长度相近，不靠字数猜
 ['片山是在哪一步失去平衡的？哪两处痕迹能互相印证？',['缸沿落差＋门框木刺：出浴缸时有人撞开了门','缸沿落差＋东侧低洼带水的地砖：跨出那一脚踩空打滑','东侧低洼带水的地砖＋棱边旧磕痕：站稳后才滑倒'],1],
 ['扶手底座的压痕，最能说明什么？',['后来开门的人拆下扶手，又装了回去','有人把他横推向东墙，撞上了扶手','打滑时他抓住扶手往下坠，压进了底座下缘'],2],
 ['抓住扶手之后，他最可能撞到哪里？',['向后朝西倒下，后脑撞上搪瓷棱边','向前朝东扑倒，额头撞上扶手底座','朝南倒向门口，头撞在门框上'],0],
 ['浴室门锁上的撬痕，是什么时候、怎样留下的？',['出事之前，有人从门外撬开锁闯了进去','出事之后，有人从门外撬开从里面锁住的门','出事之时，片山从门内撬锁想出去'],1]];
 const day=c=>c.case1?.start==null?1:c.day-c.case1.start+1;
 const has=(c,id)=>!!c.investigation?.clues?.[id];
 const asked=(c,id)=>!!(c.verify?.done?.[id]||c.hotelCase?.v18?.flags?.['vf:'+id]);
 const door=c=>has(c,'BR00')||asked(c,'inoue-D11')||asked(c,'mori-MD07')||!!c.hotelCase?.v18?.flags?.['mori:accidentConfirmed'];
 function deathKnown(c){const f=c.hotelCase?.v18?.flags||{};return asked(c,'inoue-D11')||asked(c,'mori-concealment')||!!f['mori:concealment']||!!f.moriConfessed} // v62：先确认片山死在207
 function canInspect(c){return DAHLIA.sealed(c)&&(has(c,'M12')||has(c,'C12'))&&(deathKnown(c)||!!c.roomFile?.legacyMD07||!!c.roomFile?.reconstruction)}
 function lockedTonight(c=campaign){return !solved(c)&&c.roomFile?.failDay===c.day}
 function solved(c){return !!c.roomFile?.reconstruction&&points.every(p=>has(c,p[0]))&&!!c.investigation?.deductions?.MD07}
 function friends(c){return asked(c,'tanaka-D09')||(['day-tanaka-D14','day-tanaka-D15'].some(id=>asked(c,id))&&!!c.investigation?.evidence?.E07)}
 function motive(c){return day(c)>=4&&friends(c)&&asked(c,'tanaka-D10')&&(asked(c,'tanaka-D08')||!!c.tanakaBranch?.events?.sevenVerified)&&has(c,'C10')&&has(c,'C08')}
 /* v64：浴室勘查改为独立面板——草图上可点的勘查点、方向标、剖面、逐步画出的推演；答题时可查看已记录的观察 */
 const marks={BR01:[176,72],BR02:[222,104],BR03:[282,63],BR04:[160,84],BR05:[270,127]};
 const pointName=id=>(points.find(p=>p[0]===id)||[])[1]||'门框维修联';
 const pointNo=id=>{const i=points.findIndex(p=>p[0]===id);return i<0?'':'①②③④⑤'[i]};
 // 每题每个错误选项：与之矛盾的勘查点（答错后作为第二天的提示）
 const contra=[['BR05',null,'BR04'],['BR03','BR03',null],[null,'BR03','BR05'],['BR05',null,'BR05']];
 function sketch(c,o={}){
  const st=o.steps||0,hi=o.hi,sel=o.sel;
  const p=[];const r=(x,y,w,h,f,ex='')=>p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${ex}/>`);
  r(0,0,320,152,'#263138');
  p.push('<defs><pattern id="rfTiles" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="#829799"/></pattern></defs>');
  r(12,10,286,128,'url(#rfTiles)');
  // 低洼的地砖（②）
  r(206,97,31,15,'#6c8487');p.push('<path d="M206 104h31M221 97v15" stroke="#4a5d61" stroke-width="2"/>');
  // 水渍
  r(174,87,37,4,'#a7c3c5');r(178,93,44,3,'#a7c3c5');r(214,101,9,2,'#a7c3c5');
  // 浴缸
  r(29,25,137,89,'#d6d7c6');r(38,34,118,72,'#516f79');r(45,42,103,59,'#75959a');r(157,64,8,4,'#594c45');
  // 出口西侧棱边的磕痕（④）
  r(161,80,5,6,'#5e6b6d');r(162,81,2,2,'#f3efe0');
  // 东墙与扶手（③）
  r(298,10,4,128,'#1a2226');r(285,46,4,34,'#2f434b');r(289,49,9,3,'#2f434b');r(289,74,9,3,'#2f434b');
  // 南墙上的门（⑤）：门洞、门扇、开合弧线、撬痕
  r(12,136,250,2,'#1a2226');r(292,136,10,2,'#1a2226');r(262,136,30,3,'#0f1518');
  r(289,107,3,30,'#e0cfaa');p.push('<path d="M262 137A30 30 0 0 1 290 108" fill="none" stroke="#e0cfaa" stroke-width="1" stroke-dasharray="2 2"/>');
  r(262,130,3,6,'#e0cfaa');r(265,131,3,2,'#d98a4a');
  // 剖面：缸沿一膝高的落差（①）
  r(16,117,124,19,'#1b2428','stroke="#56707a" stroke-width="1"');r(20,132,116,1,'#9fb2b4');r(26,121,24,11,'#d6d7c6');
  p.push('<path d="M54 122v8m-2-2l2 3 2-3" stroke="#e2bd75" stroke-width="1.2" fill="none"/>');
  p.push('<text x="59" y="129" font-size="7" fill="#e7e2cf">剖面：缸沿≈膝高</text>');
  // 方向标
  p.push('<text x="2" y="76" font-size="9" fill="#e2bd75">西</text><text x="308" y="76" font-size="9" fill="#e2bd75">东</text><text x="140" y="149" font-size="8" fill="#e2bd75">南</text><text x="140" y="8" font-size="8" fill="#e2bd75">北</text><text x="298" y="149" font-size="8" fill="#e7e2cf">门</text>');
  // 推演逐步画出
  if(st>=1){p.push('<ellipse cx="213" cy="103" rx="4" ry="2.5" fill="#2a2f33"/><path d="M216 103l10-3" stroke="#2a2f33" stroke-width="1.5"/><text x="196" y="118" font-size="7" fill="#fff3c4">踩空</text>')}
  if(st>=2){p.push('<path d="M278 50v22m-3-4l3 5 3-5" stroke="#ffd36b" stroke-width="2" fill="none"/><text x="250" y="45" font-size="7" fill="#fff3c4">往下坠</text>')}
  if(st>=3){p.push('<path d="M214 100Q196 62 168 80" stroke="#ff8d6b" stroke-width="2" stroke-dasharray="4 3" fill="none"/><path d="M164 78l3 2-1 3 3-1 2 3 1-3 3 0-2-2 2-3-3 1-1-3-1 3z" fill="#ff8d6b"/><text x="187" y="64" font-size="7" fill="#fff3c4">向西倒下</text>')}
  if(st>=4){p.push('<path d="M277 151v-15m-3 4l3-5 3 5" stroke="#d98a4a" stroke-width="2" fill="none"/><text x="206" y="131" font-size="7" fill="#fff3c4">事后从门外撬开</text>')}
  // 勘查点
  if(o.markers!==false)for(const pt of points){const id=pt[0],[x,y]=marks[id],got=has(c,id),on=sel===id,warn=hi===id;
   p.push(`<g class="rf-pt" data-rf-pt="${id}" role="button" tabindex="0" aria-label="${pointNo(id)} ${pointName(id)}">${warn?`<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#ff8d6b" stroke-width="2" class="rf-pulse"/>`:''}<circle cx="${x}" cy="${y}" r="${on?7.5:6.5}" fill="${got?'#9fc58a':'#f1d48c'}" stroke="${on?'#fff':'#172239'}" stroke-width="1.5"/><text x="${x}" y="${y+3}" text-anchor="middle" font-size="8" font-weight="700" fill="#172239">${points.indexOf(pt)+1}</text></g>`)}
  return '<svg class="rf-svg" viewBox="0 0 320 152" role="img" aria-label="浴室平面草图：西侧浴缸，出口朝东；东墙扶手；东南角的门开在南墙" style="shape-rendering:crispEdges">'+p.join('')+'</svg>';
 }
 function rfCss(){if(document.getElementById('rf-css'))return;const s=document.createElement('style');s.id='rf-css';s.textContent=`
  .rf-back{position:fixed;inset:0;z-index:1000;background:rgba(5,7,12,.72);display:grid;place-items:center;padding:14px;overflow:auto}
  .rf-card{width:min(560px,100%);max-height:calc(100dvh - 28px);overflow:auto;background:var(--et-card,#1d2633);border:1px solid var(--et-border,#3a4659);border-radius:14px;padding:14px 16px 16px;box-shadow:0 20px 60px rgba(0,0,0,.5);color:#e9e4d4}
  .rf-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.rf-head h2{flex:1;margin:0;font-size:1.05rem}
  .rf-step{font-size:.8rem;color:#172239;background:#e2bd75;border-radius:999px;padding:2px 9px;font-weight:800}
  .rf-x{background:none;border:0;color:#b9b3a3;font:inherit;font-size:.85rem;cursor:pointer;padding:4px 6px}.rf-x:hover{color:#fff}
  .rf-svg{display:block;width:100%;background:#263138;border-radius:6px}
  .rf-pt{cursor:pointer}.rf-pt:hover circle:not(.rf-pulse){stroke:#fff}.rf-pt:focus{outline:none}.rf-pt:focus-visible circle:not(.rf-pulse){stroke:#fff;stroke-width:2.5}
  .rf-pulse{animation:rf-pulse 1.2s ease-in-out infinite}@keyframes rf-pulse{50%{opacity:.25}}
  .rf-info{margin:10px 0 4px;padding:9px 11px;background:#141b24;border-left:3px solid #e2bd75;border-radius:4px;font-size:.92rem;line-height:1.6}
  .rf-info b{color:#f1d48c}.rf-info.rf-warn{border-left-color:#ff8d6b}.rf-info.rf-ok{border-left-color:#9fc58a}
  .rf-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
  .rf-chip{background:#2b3646;color:#e9e4d4;border:1px solid #3a4659;border-radius:999px;padding:5px 11px;font:inherit;font-size:.85rem;cursor:pointer}
  .rf-chip:hover{background:#344257}.rf-chip.got{border-color:#6e8d5f}.rf-chip.on{background:#3d4b60;border-color:#e2bd75}
  .rf-q{font-weight:700;margin:10px 0 6px;line-height:1.5}
  .rf-opt{display:block;width:100%;text-align:left;background:#2b3646;color:#e9e4d4;border:1px solid #3a4659;border-radius:8px;padding:10px 12px;margin:6px 0;font:inherit;line-height:1.5;cursor:pointer}
  .rf-opt:hover{background:#344257}.rf-opt:focus{outline:none}.rf-opt:focus-visible{border-color:#9fb2b4}.rf-opt:disabled{opacity:.55;cursor:default}
  .rf-main{display:block;width:100%;margin-top:10px;background:#e2bd75;color:#172239;border:0;border-radius:8px;padding:11px;font:inherit;font-weight:800;cursor:pointer}
  .rf-main:disabled{background:#5b5a52;color:#2a2a26;cursor:default}
  .rf-notes{margin-top:10px;font-size:.84rem}.rf-notes summary{cursor:pointer;color:#f1d48c}.rf-notes li{margin:5px 0;line-height:1.55}
  .rf-link{background:none;border:0;color:#9fc5d8;text-decoration:underline;font:inherit;font-size:.85rem;cursor:pointer;padding:2px 0}`;document.head.appendChild(s)}
 let RF=null;
 function rfClose(){if(RF?.el)RF.el.remove();document.removeEventListener('keydown',rfKey);RF=null}
 function rfKey(e){if(e.key==='Escape'&&RF&&RF.mode!=='done')rfClose()}
 function noteList(c,open){const rows=points.filter(p=>has(c,p[0])).map(p=>`<li><b>${pointNo(p[0])} ${esc(p[1])}</b>：${esc(p[2])}</li>`);
  if(has(c,'BR00'))rows.push('<li><b>门框维修联</b>：存根写着：接到前台报告后开门，锁舌撬损，另行换锁。内页的工单号与门框上的维修签一致。</li>');
  return `<details class="rf-notes"${open?' open':''}><summary>已记录的观察（${rows.length}）</summary><ul>${rows.join('')||'<li>还没有记录。</li>'}</ul></details>`}
 function pick(id){const c=campaign;RF.sel=id;
  if(id==='BR00'){INV.addClue('BR00',true);campaignSave();RF.info=['门框维修联','存根写着：接到前台报告后开门，锁舌撬损，另行换锁。内页的工单号与门框上的维修签一致。'];return rfRender()}
  const pt=points.find(p=>p[0]===id);if(!pt)return;
  if(RF.mode==='survey'&&id==='BR05'&&!door(c)){RF.info=['⑤ 浴室门框','仅凭木刺看不出时间。先向亲历开门或清扫的人核对，或者找找门框内的维修联。','warn'];return rfRender()}
  if(RF.mode==='survey'&&!has(c,id)){INV.addClue(id,true);campaignSave()}
  if(!has(c,id)){RF.info=[pointNo(id)+' '+pt[1],'这里还没有仔细查看过。'];return rfRender()}
  RF.info=[pointNo(id)+' '+pt[1],pt[2]];rfRender()}
 function rfRender(){const c=campaign,S=RF,all=points.every(p=>has(c,p[0])),locked=lockedTonight(c),done=solved(c);
  let head='',body='';
  if(S.mode==='survey'){
   head='<h2>207 · 浴室勘查草图</h2>';
   const hint=c.roomFile?.failHint&&!done?`<div class="rf-info rf-warn">${locked?'刚才':'昨晚'}的推演在<b>${pointNo(c.roomFile.failHint)} ${esc(pointName(c.roomFile.failHint))}</b>那里对不上。${locked?'今晚先到这里，明晚再来对照。':'再看看那一处。'}</div>`:locked?'<div class="rf-info rf-warn">刚才的推演对不上，脑子里乱成一团。今晚先到这里，明晚再来对照。</div>':'';
   const info=S.info?`<div class="rf-info${S.info[2]?' rf-'+S.info[2]:''}"><b>${esc(S.info[0])}</b><br>${esc(S.info[1])}</div>`:`<div class="rf-info">从门口看进去，浴缸靠西墙，出口朝东，对着东墙的扶手。点草图上的编号查看各处。</div>`;
   body=sketch(c,{steps:done?4:0,sel:S.sel,hi:!done&&c.roomFile?.failHint})+hint+info+
    '<div class="rf-chips">'+points.map(p=>`<button type="button" class="rf-chip${has(c,p[0])?' got':''}${S.sel===p[0]?' on':''}" data-rf-pt="${p[0]}">${pointNo(p[0])} ${esc(p[1])}${has(c,p[0])?' ✓':''}</button>`).join('')+'</div>'+
    (!door(c)?'<button type="button" class="rf-link" data-rf-pt="BR00">核对门框内的维修联</button>':'')+
    noteList(c,false)+
    (done?'<button type="button" class="rf-main" data-rf="film">回放：浴室事故重建</button>':
     `<button type="button" class="rf-main" data-rf="start" ${!all||locked?'disabled':''}>${locked?'今晚不能再推演':all?'开始推演（4 步）':'先把 5 处都查看一遍（'+points.filter(p=>has(c,p[0])).length+'/5）'}</button>`);
  }else if(S.mode==='quiz'){
   const [title,choices]=questions[S.q];
   head=`<h2>推演经过</h2><span class="rf-step">${S.q+1} / ${questions.length}</span>`;
   body=sketch(c,{steps:S.q,sel:S.sel})+(S.info?`<div class="rf-info"><b>${esc(S.info[0])}</b><br>${esc(S.info[1])}</div>`:'')+
    (S.ok?'<div class="rf-info rf-ok"><b>对得上。</b></div>':'')+
    `<div class="rf-q">${esc(title)}</div>`+choices.map((t,j)=>`<button type="button" class="rf-opt" data-rf-opt="${j}" ${S.ok?'disabled':''}>${esc(t)}</button>`).join('')+noteList(c,true);
  }else if(S.mode==='fail'){
   head='<h2>草图对不上</h2>';
   body=sketch(c,{steps:S.q,hi:S.hint,markers:true})+`<div class="rf-info rf-warn">${S.hint?'这个解释和<b>'+pointNo(S.hint)+' '+esc(pointName(S.hint))+'</b>的痕迹对不上。':'这个解释和现场的痕迹对不上。'}<br>推演越想越乱，今晚没法再对照下去了。明晚再来。${S.msg?'<br>'+esc(S.msg):''}</div><button type="button" class="rf-main" data-rf="close">离开浴室</button>`;
  }else{
   head='<h2>推演完成</h2>';
   body=sketch(c,{steps:4,markers:false})+'<div class="rf-info rf-ok">跨出浴缸的那一脚踩在低洼带水的地砖上，他抓住扶手往下坠，没抓稳，向后倒下，后脑撞上缸沿的搪瓷棱边。门上的撬痕，是事后开门的人留下的。</div><button type="button" class="rf-main" data-rf="finish">继续</button>';
  }
  S.el.innerHTML=`<div class="rf-card" role="dialog" aria-modal="true"><div class="rf-head">${head}${S.mode==='done'||S.mode==='fail'?'':'<button type="button" class="rf-x" data-rf="close" aria-label="暂存观察并退出">暂存并退出 ✕</button>'}</div>${body}</div>`;
  S.el.querySelectorAll('[data-rf-pt]').forEach(b=>{b.onclick=()=>pick(b.dataset.rfPt);b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(b.dataset.rfPt)}}});
  S.el.querySelectorAll('[data-rf]').forEach(b=>b.onclick=()=>{const a=b.dataset.rf;
   if(a==='close')return rfClose();
   if(a==='film'){rfClose();return film('bath')}
   if(a==='start'){if(lockedTonight(campaign)||!points.every(p=>has(campaign,p[0])))return;S.mode='quiz';S.q=0;S.sel=null;S.info=null;S.ok=false;return rfRender()}
   if(a==='finish'){rfClose();film('bath',()=>{if(app.querySelector('#rp-submit'))CASE5.reportPage()},true);return}
  });
  S.el.querySelectorAll('[data-rf-opt]').forEach(b=>b.onclick=()=>answer(+b.dataset.rfOpt));
 }
 function answer(j){const S=RF,[,,right]=questions[S.q];
  if(j!==right){campaign.roomFile??={};campaign.roomFile.failDay=campaign.day;campaign.roomFile.fails=(campaign.roomFile.fails||0)+1;
   const hint=contra[S.q]?.[j]||null;campaign.roomFile.failHint=hint;S.msg=GS.change({hp:-3},'浴室重建推演失误');S.hint=hint;S.mode='fail';campaignSave();return rfRender()}
  S.ok=true;S.info=null;rfRender();
  setTimeout(()=>{if(RF!==S)return;S.ok=false;S.sel=null;
   if(S.q<questions.length-1){S.q++;return rfRender()}
   if(!canInspect(campaign)||!points.every(p=>has(campaign,p[0])))return rfClose();
   const inv=INV.state();campaign.roomFile??={};campaign.roomFile.reconstruction??={day:campaign.day};delete campaign.roomFile.failHint;
   inv.deductions.MD07={...(inv.deductions.MD07||{}),from:points.map(p=>p[0]),at:{day:campaign.day},status:'现场重建完成'};INV.grantEvidence('E04','207浴室现场逐点复查及开门时间核对');campaignSave();
   S.mode='done';rfRender()},700)}
 const note=(title,text,fn)=>UI.modal({title,text,buttons:[{label:'记下观察',fn}]});
 function inspect(){if(!canInspect(campaign))return;rfClose();rfCss();
  const el=document.createElement('div');el.className='rf-back';document.body.appendChild(el);
  RF={el,mode:'survey',q:0,sel:null,info:null,ok:false};document.addEventListener('keydown',rfKey);
  el.addEventListener('click',e=>{if(e.target===el&&RF&&(RF.mode==='survey'||RF.mode==='quiz'))rfClose()});
  rfRender()}
 function question(){if(!RF)inspect();if(RF){RF.mode='quiz';RF.q=0;rfRender()}}
 function belongings(){if(!motive(campaign))return;note('207 · 将遗物与证词并排','床上的衬衫折好了，剃须刀和洗漱袋放在一起。桌上最后一张便签另写了集合时间。背面，他把同一个地点又抄了一遍：“忘了，就看这里。”\n田中说，他们后来重新约过。他还记得片山说，近来记名字越来越费劲，想趁自己还记得，跟大家再坐一次。这件衬衫，是为第二天留下的。',()=>{INV.addClue('KT05',true);campaign.roomFile??={};campaign.roomFile.appointment??={day:campaign.day};campaignSave();if(app.querySelector('#rp-submit'))CASE5.reportPage();film('eve',null,true)})}
 function controls(){return (canInspect(campaign)?'<button class="rpg-action" data-roomfile="bath">复查浴室现场</button>':'')+(motive(campaign)?'<button class="rpg-action" data-roomfile="things">对照衬衫、便签和赴约证词</button>':'')+filmButtons()}
 function bind(){bindFilms();app.querySelectorAll('[data-roomfile]').forEach(b=>b.onclick=()=>b.dataset.roomfile==='bath'?inspect():belongings())}
 const reels={
  bath:['浴室事故重建',['207号室 · 根据现场痕迹重建','水龙头关上了。','第一步落在缸外。','扶手的下缘。','……','门框上的撬痕属于后来开门的人。']],
  eve:['赴约前夜',['床边','窗前','桌上的约定','浴室的镜子','灯还亮着。']],
  lunch:['五个人的午餐',['午休铃已经响过了。','田中说到一半，片山也笑了。','等一下。筷子还没放下。','「また五人で集まろう。」']],
  street:['离开港屋酒店',['港屋酒店门外','「おい、片山！早く来いよ！」','「片山くん、何してんだよ。置いてくぞ。」','街角','电车声渐渐远了。']]
 };
 function available(id,c=campaign){if(!c)return false;
  if(id==='bath')return day(c)>=3&&solved(c);
  if(id==='eve')return motive(c)&&has(c,'KT05')&&!!c.roomFile?.appointment;
  if(id==='lunch')return day(c)>=4&&(has(c,'C08')||has(c,'DAY-KS-01')||has(c,'DAY-UE-01'))&&(friends(c)||asked(c,'day-tanaka-D20'));
  return id==='street'&&(c.hotelEndingVariant==='promise'||!!c.abilities?.echo?.awakened)
 }
 function ledger(){campaign.roomFile??={};return campaign.roomFile.films??={}}
 const pen=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 function figure(g,x,y,dir='down'){H18.pixelPerson(g,Math.round(x),Math.round(y),GAME_DATA.story.chapter1.npcs.katayama.palette,dir)}
 function camera(g,x,y){pen(g,x,y,13,8,'#272b30');pen(g,x+2,y-2,4,2,'#bec1ae');pen(g,x+6,y+2,5,5,'#939888');pen(g,x+7,y+3,3,3,'#39434b')}
 function bathShot(g,i,p,t){
  const r=(...a)=>pen(g,...a);if(i===4){r(0,0,320,200,'#0a0c0e');return}
  const z=[1+p*.15,1.4,1.8,2.8,1,1][i];g.scale(z,z);g.translate(-([0,65,113,172,0,0][i])*(z-1)/z,-([0,60,128,65,0,0][i])*(z-1)/z);
  r(0,0,320,200,'#788d91');for(let x=0;x<320;x+=20)r(x,0,1,112,'#61767b');for(let y=9;y<112;y+=18)r(0,y,320,1,'#63787b');
  r(0,112,320,88,'#566b72');for(let y=114;y<200;y+=15){r(0,y,320,1,'#768388');for(let x=(y%2)*12;x<320;x+=28)r(x,y,1,15,'#485a61')}
  r(26,86,130,58,'#a1b3b5');r(31,89,119,28,'#6c8b92');r(34,95,112,18,'#809ea2');r(22,116,139,7,'#e1dcd0');r(25,123,134,20,'#bdc7c1');
  r(50,79,3,11,'#b9c6c7');r(50,78,12,3,'#c2cac5');r(169,77,7,10,'#59666a');r(213,77,7,10,'#536369');r(171,79,47,4,'#c7d0c9');r(213,83,6,2,'#4e575a');
  r(261,48,43,98,'#626061');r(265,52,35,90,'#98918a');r(265,110,5,3,'#d6b894');r(263,115,3,2,'#554c47');
  for(let j=0;j<6;j++)r(154+j*5,146+j%3*3,9,1,'#93aeb0');
  if(i===1){g.save();g.beginPath();g.rect(28,50,123,53);g.clip();figure(g,84,83-p*3,'right');r(60,91,Math.max(0,Math.round(6*(1-p))),2,'#acc8c7');r(74,96,20+7*p,3,'#c9bbab');g.restore();for(let j=0;j<4;j++)r(54+j*20,90-(t/85+j*6)%24,3,6,'rgba(222,233,225,.35)')}
  if(i===2){const x=150+Math.min(1,p*2)*13+Math.max(0,p-.65)*48;r(x,119+p*17,5,12,'#b6afa3');r(x+1,130+p*17,11,4,'#cdc2b0')}
  if(i===3){r(147+20*p,90-7*p,20,4,'#c8bca9');r(166+20*p,88-7*p,7,5,'#d3c8b4');if(p>.5)r(213,84,6,2,'#40494c')}
  if(i<5)r(0,0,320,200,'rgba(24,44,57,'+(i===0?p*.23:.18)+')');
 }
 function roomShot(g,i,p){
  const r=(...a)=>pen(g,...a),v=Math.sin(p*Math.PI*2);
  r(0,0,320,200,'#716052');r(0,115,320,85,'#53443f');for(let x=0;x<320;x+=23)r(x,116,1,84,'#483b38');
  r(25,24,75,64,'#433f43');r(29,28,67,56,'#48525f');r(60,28,3,57,'#847763');r(30,65,66,2,'#7a7167');r(37,70,3,2,'#d2b780');
  r(32,123,100,27,'#433a37');r(29,119,107,7,'#a78663');r(42,150,5,20,'#423735');r(116,149,5,20,'#423735');
  r(170,114,143,49,'#aa947d');r(170,111,143,12,'#d2c2a6');r(181,103,44,11,'#dfd2b7');
  r(222,114,24,16,'#e0dac8');r(215,116,9,8,'#c8c2b2');r(245,116,9,8,'#c8c2b2');r(230,114,5,4,'#8c877e');
  r(108,83,3,35,'#ab936a');r(98,80,23,9,'#ead19b');r(104,76,13,5,'#e1bc83');
  const glow=g.createRadialGradient(110,85,4,110,85,108);glow.addColorStop(0,'rgba(251,206,129,.29)');glow.addColorStop(1,'transparent');g.fillStyle=glow;g.fillRect(0,0,320,200);
  if(i<3){const x=i===0?208-8*Math.sin(Math.PI*p):70;figure(g,x,i===0?89:93,i===0?'right':'up');
   const lift=i===1?Math.sin(Math.PI*p)*21:0;camera(g,77,112-lift);r(51,113-(i===2?Math.abs(v)*11:0),16,8,'#d7caa9');r(54,115-(i===2?Math.abs(v)*11:0),9,1,'#7a7265');if(i===0)r(218+v*5,113+3*p,9,4,'#c9b49d');
  }else{r(50,15,216,151,'#565354');r(57,21,202,137,'#a1a8a1');r(63,27,190,125,'#707c7d');r(69,30,2,100,'#acb6aa');g.save();g.translate(110,40);g.scale(3,3);figure(g,0,0);g.restore();r(145,99+(i===3?16*p:20+19*p),4,12,'#383e43');r(142,96+(i===3?16*p:20+19*p),10,4,'#c4c2b5');r(53,153,207,9,'#c8c2ad');if(i===4)r(0,0,320,200,'rgba(34,36,40,'+p*.45+')')}
 }
 function drawShot(g,id,i,t){const p=Math.min(1,t/1150);g.save();g.imageSmoothingEnabled=false;
  if(id==='bath')bathShot(g,i,p,t);
  if(id==='eve')roomShot(g,i,p);
  if(id==='lunch'){
   const photo=i===3;if(photo){pen(g,0,0,320,200,'#5c514a');g.translate(16,8);g.scale(.9,.86)}
   g.save();if(!i){g.scale(1.1,1.1);g.translate(-24*p,-9)}ECHO.classroom(g,photo?400:t,{laugh:i>0,untie:1});
   {ECHO.seated(g,226,100,{smile:true,hair:'#141318'});pen(g,227,125,13,6,'#f0e7ce');pen(g,235,125,4,4,'#ae7050');if(i===2)camera(g,224,113-p*9)}
   pen(g,176,116,10,1,'#d6b379');pen(g,176,118,10,1,'#d6b379');g.restore();
   if(photo){g.strokeStyle='#d4c9aa';g.lineWidth=7;g.strokeRect(2,2,316,196);pen(g,0,0,320,200,'rgba(143,111,60,.25)');pen(g,0,0,320,200,'rgba(255,252,230,'+(1-p)+')')}
  }
  if(id==='street'){if(i===2)ECHO.classroom(g,t,{kx:290-66*p,ky:84,untie:1,laugh:p>.75});else{ECHO.street(g,t,{door:i===0?p:1,people:true});if(i===1){g.save();g.beginPath();g.rect(0,20,39,17);g.clip();const x=38-(t/20)%135;pen(g,x,23,80,10,'#b7c5c7');pen(g,x,30,80,2,'#668883');for(let j=0;j<10;j++)pen(g,x+8*j,24,5,4,'#5e737e');g.restore()}if(i===3){g.save();g.globalAlpha=.52*(1-p);figure(g,75,134,'left');g.restore()}}}
  g.restore()
 }
 let playing=false;
 function film(id,done,automatic=false){if(playing||!available(id))return false;const records=ledger(),rec=records[id]??={};if(automatic&&rec.started)return false;
  rec.started=true;campaignSave();playing=true;
  const layer=document.createElement('div');layer.className='echo-root';layer.setAttribute('role','dialog');layer.setAttribute('aria-label',reels[id][0]);
  layer.innerHTML='<div class="echo-stage"><canvas width="320" height="200"></canvas></div><div class="echo-box"><b class="echo-who"></b><p class="echo-jp"></p><p class="echo-zh"></p><button class="story-btn" data-film-next>继续 ▶</button> <button class="story-btn alt" data-film-skip>跳过已看片段</button></div>';
  const previous=document.activeElement;document.body.append(layer);document.body.classList.add('echo-on');
  const next=layer.querySelector('[data-film-next]'),skip=layer.querySelector('[data-film-skip]'),g=layer.querySelector('canvas').getContext('2d');
  skip.hidden=!rec.completed;let i=0,start,raf;
  function close(){if(!layer.isConnected)return;cancelAnimationFrame(raf);layer.remove();document.body.classList.remove('echo-on');playing=false;rec.completed=true;campaignSave();if(previous?.isConnected)previous.focus();done?.()}
  function draw(now){drawShot(g,id,i,now-start);raf=requestAnimationFrame(draw)}
  function show(){cancelAnimationFrame(raf);const title=reels[id][0],line=reels[id][1][i],jp=line.startsWith('「');layer.querySelector('.echo-who').textContent=title;layer.querySelector('.echo-jp').textContent=jp?line:'';layer.querySelector('.echo-zh').textContent=!jp?line:id==='lunch'?'以后五个人再聚吧。':i===1?'喂，片山！快点啊！':'片山，你磨蹭什么呢？我们要走了啊。';
   if(jp&&typeof langMode==='function'&&langMode()==='learning'){const zh=layer.querySelector('.echo-zh');zh.innerHTML=trToggle(zh.textContent)}const sound={bath:['','water','','keys','bump','drip'],eve:['page','','page','click',''],lunch:['schoolroom','','','filmShutter'],street:['door','train','','','']}[id][i];if(sound)window.AUDIO?.sfx(sound);
   start=performance.now();draw(start)}
  next.onclick=()=>{if(++i===reels[id][1].length)close();else show()};skip.onclick=close;show();next.focus();return true
 }
 function filmButtons(){return Object.entries(reels).filter(([id])=>available(id)).map(([id,[title]])=>`<button class="rpg-action" data-reel="${id}">${campaign.roomFile?.films?.[id]?.completed?'重看':'观看'} · ${title}</button>`).join('')}
 function bindFilms(){app.querySelectorAll('[data-reel]').forEach(b=>b.onclick=()=>film(b.dataset.reel,()=>{b.textContent='重看 · '+reels[b.dataset.reel][0]}))}


 const oldSource=t=>typeof t==='string'&&/\u5973\u513f|\u7531\u9999/.test(t);function archived(e){return e.id==='E12'&&oldSource(e.name)?{...e,name:'旧档 · 约见与失联记录',sources:e.sources.map(v=>oldSource(v.name)||oldSource(v.text)?{...v,name:'旧档材料',text:'当时提交的失联记录，已归档。'}:v)}:e}
 return {archived,oldSource,points,deathKnown,canInspect,solved,friends,motive,controls,bind,inspect,belongings,available,film,filmButtons,bindFilms};
})();


const REPORT6=(()=>{
 const labels={accident:'浴室意外死亡',murder:'谋杀',supernatural:'异常现象致死',disappearance:'主动失踪'};
 const names={mori:'森正彦',sato:'佐藤美穂',kobayashi:'小林辰夫',tanaka:'田中震',takahashi:'高桥由美',inoue:'井上和子'};
 const endings={mori:'mori_open',sato:'sato_family',kobayashi:'kobayashi_name',tanaka:'tanaka_accused',takahashi:'yumi_weekly',inoue:'death_employee_inoue'};
 const grounds={mori:['MD04','MD02','XD05','XD22'],sato:['ST-D01','ST-D03','ST-J01','ST-J03','ST-JOINT','XD02'],kobayashi:['KD03','KD02','XD01','XD11'],tanaka:['D06','TN-D02','TN-D02B'],takahashi:['YK-D4','XD03'],inoue:['XD13']};
 const materialClues={E01:['C01','C02'],E02:['C03','C13','ST02'],E03:['C03','ST02','ST10','MC08'],E04:['C12','C13','M12','BR01','BR02','BR03','BR04','BR05'],E05:['C05','TN10','KT05'],E06:['C06','TNCLIENT'],E07:['C08','C09','TN10','DAY-KS-01','DAY-UE-01'],E08:['C09','C10','C11','KT05'],E09:['M02','M04','M05','MT01','MT02'],E10:['C14','M11'],E11:['C05','TN01','TNJOB'],E12:['C15','C13']};
 const opinions={E04:['死亡发生在207号室。','现有记录无法确认死亡地点。'],E09:['森为了钱杀人。'],E10:['异常现象造成了死亡。'],E11:['田中参与了酒店隐瞒。'],E12:['片山主动切断联系，不愿被寻找。']};
 const testimony={'sato-D04':'佐藤说经理那晚一直打电话，脸色很难看。她不知道他做过什么。','koba-D06':'小林说田中那几天没来，也不接电话。他不确定田中知道什么。','inoue-D11':'井上说浴室从里面锁住，经理叫人撬门后让她特别清扫。','inoue-D12':'井上觉得房间把客人留下了。','sato-D13':'佐藤说片山很少麻烦别人。她猜他想独处，并不知道那些电话为何没有接通。'};
 function material(e,c=campaign){
  const inv=c.investigation,original=inv.evidence[e.id],record=e.id==='E12'&&ROOMFILE.oldSource(original.source)?{...original,source:'旧档中的约见与失联资料，来源待复核'}:original,sources=[],choices=['暂不下结论',...(opinions[e.id]||['采纳材料所载事实。'])];
  for(const clue of GAME_DATA.d['investigation/clues'].clues)if(materialClues[e.id]?.includes(clue.id)&&inv.clues?.[clue.id])sources.push({id:clue.id,name:clue.name,text:clue.desc});
  for(const rule of GAME_DATA.d['investigation/verify'].rules)if(rule.evidence===e.id&&(c.verify?.done?.[rule.id]||c.hotelCase?.v18?.flags?.['vf:'+rule.id]))sources.push({id:rule.id,name:'求证记录',text:testimony[rule.id]||rule.source});
  if(record.source&&!GAME_DATA.d['investigation/verify'].rules.some(rule=>rule.evidence===e.id&&rule.source===record.source&&sources.some(x=>x.id===rule.id))&&!sources.some(v=>v.text===record.source))sources.push({id:'record',name:'取得记录',text:record.source});
  const has=id=>sources.some(v=>v.id===id);
  let name=e.name;
  if(e.id==='E09')name=has('M02')?(has('M05')?'森的债务与空卡套':'森的债务记录'):has('M04')||has('M05')?'森与黑金卡的相关记录':has('sato-D04')||record.source?.includes('佐藤')?'佐藤谈森经理':name;
  // 增量材料：仅展示玩家已经取得的来源，早期材料的解释可以被后续证据限制。
  const revisions=[];
  if(e.id==='E09'&&has('MT01'))revisions.push('新取得田中持有卡片的记录：遗物里没有卡片，不等于卡片被酒店人员取走。取得方式还需核对。');
  if(e.id==='E09'&&has('MT02'))revisions.push('寄件存根与收件记录提供了新的卡片去向时间线。请重新判断债务、空卡套与所谓死后取卡之间是否真的存在证据联系。');
  if(e.id==='E02'&&has('ST02'))revisions.push('前台交接记录补充了报告异常、联系经理与修改空房状态的先后顺序；登记被改动的事实与改动原因须分开判断。');
  if(e.id==='E03'&&has('ST02'))revisions.push('新增当班交接记录，可以核对相关人员是何时得知异常、何时改动记录；不能直接由隐瞒行为推出死因。');
  if(e.id==='E03'&&has('ST10'))revisions.push('新增人员证词，需与交接记录逐项核对；彼此一致之处与仍无法确认之处应分开记录。');
  if(e.id==='E04'&&has('BR03')&&has('BR04'))revisions.push('扶手受力痕与缸沿位置允许重建一种跌倒路径；这仅是可能的经过，并非已经核实的死亡原因。');
  if(e.id==='E04'&&has('BR05'))revisions.push('撬锁先后记录可以用于核查“死前有人强行进入”的说法；不要只凭撬痕判断闯入时间。');
  if(e.id==='E11'&&has('TN01'))revisions.push('便当购买数量属于行为记录，是否与酒店的异常事件有关还需其他独立来源。');
  const scope=({
    '森为了钱杀人。':'债务与卡片记录不足以独立证明有人实施杀害。',
    '异常现象造成了死亡。':'异常感受与现场所见不能直接确定致死机制。',
    '片山主动切断联系，不愿被寻找。':'未接来电与失联不足以证明本人主动消失。',
    '田中参与了酒店隐瞒。':'现有消息记录无法单独证明田中参与酒店内部处理。',
    '小林身为保安，应对酒店篡改记录负责。':'职业身份不能代替实际接触记录的证明。',
    '田中购买五份便当，说明他参与了酒店秘密行动。':'购买行为不能单独证明参与秘密行动。',
    '田中支付委托报酬，说明他参与了犯罪。':'委托调查的行为不能直接推出犯罪。'
  });
  const oldView=record.interpretation||choices[0];
  const concern=scope[oldView]||'';
  if(e.id==='E09'&&has('MT02'))choices.push('卡片的去向应按寄件记录核对，债务与卡套不足以证明盗卡或杀人。');
  if(e.id==='E02'&&has('ST02'))choices.push('确认登记变更，但尚不能仅凭修改行为确定死亡原因。');
  if(e.id==='E03'&&has('ST02'))choices.push('确认记录与证言存在隐瞒问题，死亡经过仍需独立查证。');
  if(e.id==='E04'&&has('BR05'))choices.push('撬锁先后记录需与浴室现场痕迹一起判断；事故解释尚待核实。');

  if(e.id==='E11'&&has('koba-D06'))choices.push('小林身为保安，应对酒店篡改记录负责。');
  if(e.id==='E11'&&has('TN01'))choices.push('田中购买五份便当，说明他参与了酒店秘密行动。');
  const fieldNotes=c.cityVisits?.notes||{};
  const supplements={E02:['moriKeys','satoTime','day-mori-D19'],E03:['moriKeys','satoTime'],E05:['day-tanaka-D20'],E07:['friends','day-tanaka-D14','day-tanaka-D15','day-tanaka-D21'],E08:['day-tanaka-D21']};
  for(const key of supplements[e.id]||[])if(fieldNotes[key])sources.push({id:'field-'+key,name:'白天走访记录',text:fieldNotes[key]});
  if(e.id==='E05'||e.id==='E08'){const events=c.tanakaBranch?.events||{};for(const [id,text] of Object.entries(e.id==='E05'?{fightVerified:'田中承认居酒屋争执。',pushVerified:'田中承认推搡片山。',jobVerified:'田中承认隐瞒现职。'}:{posted:'信封、寄件存根与田中展示的卡片对应。'}))if(events[id])sources.push({id,name:'田中求证',text})}
  if(e.id==='E06'&&state(c).core.client){const confirmed=c.tanakaBranch?.events?.clientVerified;sources.push({id:confirmed?'clientVerified':'clientKnown',name:'委托身份核对',text:confirmed?'田中本人承认了委托身份。':'调查局委托记录注明委托人为田中震。'});choices.push('田中支付委托报酬，说明他参与了犯罪。')}
  const links=GAME_DATA.d['investigation/deductions'].deductions.filter(d=>d.evidence===e.id&&inv.deductions?.[d.id]).map(d=>d.id);
  return {id:e.id,name,desc:e.desc,sources,deductions:links,choices,interpretation:record.interpretation||choices[0],history:[...(record.interpretationHistory||[])],revisions,concern};
 }
 function editor(e){
  return CASE_NOTES.sourceSummary(e)+'<details class="rp-judge"'+((e.concern||(e.revisions||[]).length)?' open':'')+'><summary>✎ 查看来源 · 修改「我的判断」</summary>'+CASE_NOTES.sourceRows(e)+(e.revisions.length?'<p><b>新增来源／需要复核</b></p>'+e.revisions.map(v=>'<p>'+esc(v)+'</p>').join(''):'')+'<label>我的判断 <select data-opinion="'+e.id+'">'+e.choices.map(v=>'<option '+(v===e.interpretation?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>'+(e.concern?'<p class="survival-tip">证据范围提醒：'+esc(e.concern)+'你可以保留或修改自己的判断。</p>':'')+e.history.map(v=>'<small>此前判断：'+esc(v)+'</small>').join('')+'</details>';
 }
 function bindMaterials(refresh){app.querySelectorAll('[data-opinion]').forEach(el=>el.onchange=()=>{const id=el.dataset.opinion,r=campaign.investigation.evidence[id],e=material(INV.evidence().find(v=>v.id===id));if(!e.choices.includes(el.value)||e.interpretation===el.value)return;(r.interpretationHistory??=[]).push(e.interpretation);r.interpretation=el.value;campaignSave();refresh()})}
 const parked=[];
 function state(c){
  const inv=c.investigation||{},ds=inv.deductions||{},flags=c.hotelCase?.v18?.flags||{},done=c.verify?.done||{};
  const analyzed=id=>!!ds[id];
  const verified=id=>!!(done[id]||flags['vf:'+id]);
  const accidentAnalysis=analyzed('MD07');
  const accidentCheck=ROOMFILE.solved(c);
  const possible=Object.keys(names).filter(p=>grounds[p].some(analyzed));
  const suspects=possible.filter(p=>inv.reportHypotheses?.[p]===true);
  const available={accident:accidentAnalysis&&accidentCheck,murder:analyzed('D04')||suspects.length>0,supernatural:analyzed('D12'),disappearance:analyzed('D13')};
  const clue=(...ids)=>ids.some(id=>!!inv.clues?.[id]),ded=(...ids)=>ids.some(analyzed);
  const client=!!flags.clientKnown||!!c.tanakaBranch?.events?.clientVerified;
  const core={client,mori:clue('M02')||ded('MD01','MD02')||!!flags['mori:concealment']||verified('mori-D04'),sato:clue('ST03','ST04','ST05','ST07')||ded('ST-D02','ST-D04')||!!flags['sato:family']||!!c.satoBranch?.scene?.watched,kobayashi:clue('K04')||(clue('K03')&&clue('K01'))||ded('KD01','KD02')||verified('kobayashi-KD01'),tanaka:client||clue('TN02','TN05','MT02')||!!c.tanakaBranch?.events?.jobVerified||!!c.tanakaBranch?.events?.pushVerified||ded('TN-D02','TN-D02B','TN-D06'),takahashi:ded('YK-D1','YK-D3')||clue('YKST')||!!c.yumiBranch?.watched?.first,inoue:ded('XD13')||clue('XI02')};
  return {core,available,suspects,possible,accidentAnalysis,accidentCheck,
   hotel:!!inv.evidence?.E02&&!!inv.evidence?.E03&&(!!flags['mori:concealment']||verified('mori-concealment'))&&!!(flags['sato:presence']||c.satoBranch?.events?.presence||verified('mori-concealment')),
   promise:!!c.roomFile?.appointment&&!!inv.clues?.KT05&&ROOMFILE.motive(c),
   answer:verified('inoue-D11')&&verified('tanaka-D08'),letters:!!flags.clientKnown&&!!c.hotelCase?.v18?.clues?.includes('notebook')&&!c.items?.notebookOriginal};
 }
 function migrate(s){
  if(s.draft.schema===2)return;
  s.draft={schema:2,evidence:s.draft.evidence||[],disposal:s.draft.disposal||null,conclusion:null,suspect:null};
  if(s.state==='submitted'&&!s.played&&s.report?.schema!==2){s.legacyReport=s.report;s.state='report';s.endingId=null}
 }
 function judge(r,f,min=3){
  const branch=r.conclusion,ev=new Set(r.evidence||[]),has=(...ids)=>ids.every(id=>ev.has(id)),disp=r.disposal;
  const checked=[];
  function verdict(ending,rule){return {ending,rule,branch,matched:[rule],checked}}
  function match(id,ok,reason){checked.push({id,miss:ok?'':reason});return ok}
  if(branch==='reserve'&&ev.size>=min&&r.overdue)return verdict('death_late','deadline-reserved');
  if(branch==='reserve')return verdict('death_insufficient','reserved');
  if(!f.available[branch])return verdict(null,'unavailable');
  const mat=id=>(r.materials||[]).find(e=>ev.has(id)&&e.id===id);
  const opinion=(id,text)=>mat(id)?.interpretation===text;
  const bento=opinion('E11','田中购买五份便当，说明他参与了酒店秘密行动。')&&mat('E11').sources.some(x=>x.id==='TN01');
  if(branch==='murder'){
   if(!ev.size||!f.suspects.includes(r.suspect))return verdict(null,'accusation-incomplete');
   if(f.core?.[r.suspect])return verdict(endings[r.suspect],'explicit-'+r.suspect);
   if(bento)return verdict('death_bento','bento');
   return disp==='publish'?verdict('death_perfect_report','public-accusation'):verdict('death_false_murder','unsupported-accusation');
  }
  if(ev.size<min)return verdict('death_insufficient','minimum');
  if(branch==='accident'){
   if(bento)return verdict('death_bento','bento');
   if(opinion('E06','田中支付委托报酬，说明他参与了犯罪。')&&mat('E06').sources.some(x=>['clientKnown','clientVerified'].includes(x.id)))return verdict('death_promotion','client-as-suspect');
   if(opinion('E11','小林身为保安，应对酒店篡改记录负责。')&&has('E02')&&mat('E11').sources.some(x=>x.id==='koba-D06'))return verdict('death_employee','blame-guard');
   if(opinion('E11','田中参与了酒店隐瞒。')&&mat('E06')?.sources.some(x=>['clientKnown','clientVerified'].includes(x.id)))return verdict('death_false_client','blame-client');
  }
  if(branch==='supernatural'){
   if(match('phone',disp==='nocheck'&&has('E03','E04','E10'),'需停止复核及对应三份材料'))return verdict('death_phone','phone');
   return verdict('death_false_cause','supernatural');
  }
  if(branch==='disappearance')return match('last-bus',has('E05','E08','E12')&&opinion('E12','片山主动切断联系，不愿被寻找。'),'未提交约定、上京动机及失联材料')?verdict('death_last_bus','last-bus'):verdict('death_abandoned','disappearance');
  if(match('no-responsibility',disp==='noblame'&&has('E01','E03','E04'),'需主动认定酒店无责并提交对应材料'))return verdict('death_permanent_guest','no-responsibility');
  if(match('confidential',disp==='private'&&has('E01','E02','E03'),'需接受私下处理并提交对应材料'))return verdict('death_confidential','confidential');
  const sufficient=!opinion('E04','现有记录无法确认死亡地点。')&&has('E04')&&(ev.has('E02')||ev.has('E03'))&&f.accidentCheck;
  const conflicting=(r.materials||[]).filter(e=>['森为了钱杀人。','异常现象造成了死亡。','片山主动切断联系，不愿被寻找。'].includes(e.interpretation));
  if(conflicting.length)checked.push({id:'材料判断与事故结论不一致',materials:conflicting.map(e=>e.id)});
  if(conflicting.length>=2&&!sufficient)return verdict('death_perfect_report','contradictory-report');
  if(match('promise',disp==='submit'&&!opinion('E04','现有记录无法确认死亡地点。')&&f.accidentCheck&&f.hotel&&f.promise&&f.answer&&has('E04','E08')&&(ev.has('E05')||ev.has('E07'))&&!conflicting.length,'需浴室重建、酒店事后责任、赴约遗物、带回田中的话与对应证词'))return verdict('promise','promise');
  if(!match('ordinary-truth',sufficient,'需死亡现场与酒店记录或隐瞒材料'))return verdict('death_insufficient','incomplete-support');
  if(disp==='publish')return verdict('death_publish','publish');
  if(disp==='private')return verdict('death_silence','private');
  if(disp==='leave')return verdict('death_leave','leave');
  if(disp==='noblame')return verdict('death_permanent_guest','disputed-responsibility');
  return verdict('juri','ordinary-truth');
 }
 function simulate(min,id){
  const facts={core:Object.fromEntries(Object.keys(names).map(k=>[k,true])),available:{accident:true,murder:true,supernatural:true,disappearance:true},suspects:Object.keys(names),accidentCheck:true,hotel:true,promise:true,answer:true};
  const rows=[...Object.keys(names),...['accident','supernatural','disappearance']].filter(k=>!id||k===id).map(k=>{
   const input={conclusion:names[k]?'murder':k,suspect:names[k]?k:null,evidence:['E04','E05','E07','E08'],disposal:'submit'};
   return JSON.stringify({input,result:judge(input,facts,min)});
  });
  return [...rows,'旧演出按已提交的归因、处置或期限判定。','跨分支证据重叠不参与竞争。同分支按专属条件优先。'];
 }
 function audit(min=3){
  const facts={core:Object.fromEntries(Object.keys(names).map(k=>[k,true])),available:{accident:true,murder:true,supernatural:true,disappearance:true},suspects:Object.keys(names),accidentCheck:true};
  const allowed={accident:['death_insufficient','juri'],disappearance:['death_insufficient','death_last_bus','death_abandoned'],supernatural:['death_insufficient','death_false_cause'],murder:Object.values(endings)};
  let count=0;const failures=[];
  for(let mask=0;mask<4096;mask++){
   const evidence=Array.from({length:12},(_,i)=>i).filter(i=>mask&(1<<i)).map(i=>'E'+String(i+1).padStart(2,'0'));
   if(evidence.length>4)continue;
   for(const conclusion of Object.keys(allowed)){
    for(const suspect of conclusion==='murder'?facts.suspects:[null]){
     const r={conclusion,evidence,suspect,disposal:'submit'},a=judge(r,facts,min),b=judge(r,facts,min);
     if(conclusion==='murder'&&!evidence.length){count++;if(a.ending!==null)failures.push('空指认');continue}count++;if(!allowed[conclusion].includes(a.ending)||a.ending!==b.ending||(suspect&&a.ending!==endings[suspect]))failures.push(JSON.stringify(r));
    }
   }
  }
  return {ok:!failures.length,lines:['正式提交规则遍历 '+count+' 项，分支或重复判定错误 '+failures.length,...failures.slice(0,5)]};
 }
 return {material,editor,bindMaterials,names,labels,grounds,state,judge,migrate,parked,simulate,audit};
})();

const CASE5=(function(){
 const RD=()=>GAME_DATA.d['investigation/report']||{persons:[],texts:{},notice:{lines:[]}};
 const ED=()=>GAME_DATA.d['investigation/endings']||{rules:{},fallback:'filed'};
 const CC=()=>GAME_CONFIG.caseReport||{};
 const CHE=()=>((GAME_DATA.story.chapter1||{}).chapter||{});
 const extDays=()=>(GAME_CONFIG.caseReport||{}).extendDays??5; // v33：延迟结案可以多调查几天（config 的 caseReport.extendDays）
 const total=()=>((GAME_CONFIG.chapter1||{}).nights||6)+(campaign&&campaign.case1&&campaign.case1.extended?extDays():0);
 const END=720;
 const hc=()=>campaign&&campaign.hotelCase,v18=()=>hc()&&hc().v18;
 const save=()=>campaignSave();
 const dev=()=>!!(window.INV&&INV.dev());
 function st(){if(!campaign)return null;campaign.case1??={};const s=campaign.case1;s.state??='active';s.story??={};s.draft??={person:null,evidence:[]};s.draft.evidence??=[];if(!s.migrated)migrate(s);if(!s.day6Migrated)migrateDay6(s);REPORT6.migrate(s);if(!s.dahliaMigrated){s.dahliaMigrated=true;if(!s.report&&['due','report'].includes(s.state))s.state='active'}return s}
 function migrate(s){
  s.migrated=true;const h=hc(),v=v18();
  if(h&&h.ending){s.state='closed';s.legacy='ended-before-v28';return}         // 已经完成第一章：不重新开启
  if(v&&v.startDay&&s.start==null){s.start=v.startDay;s.legacy='three-nights'} // 三夜调查途中：原来的第一夜 = DAY 1，期限延长到 6 天
 }
 /* 旧五天期限迁移：仅撤销未结案的旧期限强制入口，保留报告、证据与结局。 */
 function migrateDay6(s){
  s.day6Migrated=true;
  if(['submitted','closed','dead'].includes(s.state)||s.report||s.endingId)return;
  if(s.state==='due'||s.state==='report'){
   // 若旧版只因第五夜结束而强制进入整理页，重新开放第六天。
   const oldEnd=s.start==null?null:s.start+4;
   if(oldEnd!=null&&campaign.day<=oldEnd+1){s.state='active';s.legacyFiveDayExtended=true}
  }
 }
 /* ---------- 期限 ---------- */
 function begin(clock){const s=st();if(!s||s.start!=null)return;const d=campaign.day;let start=d;
  if((clock||0)>=(CC().lateStartClock??300)&&d+total()<=(campaign.days||Infinity))start=d+1;
  s.start=start;s.startClock=clock||0}
 const started=()=>{const s=st();return !!(s&&s.start!=null)};
 function lastDay(){return campaign?.days||Infinity}
 function dayNo(){const s=st();if(!s||s.start==null)return 1;return campaign.day-s.start+1}
 const span=()=>{const s=st();return s&&s.start!=null?lastDay()-s.start+1:total()};
 function isLastDay(){return started()&&campaign.day>=lastDay()}
 function label(){if(!started())return '调查 DAY 1/'+total();const n=dayNo();if(n<1)return '接案当晚（不计入期限）';const ext=st()&&st().extended;if(campaign.day>lastDay())return '调查期限已到 · 待提交报告';return '调查 DAY '+n}
 function deadlineText(){return '调查进行中'}
 function nightOver(){const v=v18();return !!(v&&v.clockDay===campaign.day&&v.clock>=END)}
 function due(){const s=st();if(!s||!started())return false;if(s.state==='due'||s.state==='report')return true;if(s.state!=='active')return false;
  return campaign.day>lastDay()||(campaign.day===lastDay()&&nightOver())}
 /* ---------- 常规结局 → 记录，不播放 ---------- */
 function decisionText(kind){const d=(CHE().decisions||[]).find(x=>x.ending===kind);return d?String(d.text):kind}
 function intercept(kind){
  const s=st();if(!s||s.state==='closed')return false;
  if(kind==='late'){expire();return true}
  if(kind==='answer'||kind==='promise')s.story.visit??=kind;else s.story.decision??=kind;
  save();
  const host=H18.host(),visit=kind==='answer'||kind==='promise';
  DM.show(host,{who:visit?'……':'📓 调查手帐',text:visit?'天快亮了。207号室很安静。\n（这一晚发生的事，已经记在调查记录里。调查期限结束后，向调查局提交最终调查报告。）':decidedText(),choices:[{t:'▶ 继续调查',fn:()=>H18.endDialog()}]});
  return true;
 }
 const decided=()=>{const s=st();return !!(s&&s.story.decision)};
 function decidedText(){const s=st();return '此决定不会改变品川水没时点。\n你已经做出了决定：「'+decisionText(s.story.decision)+'」。\n它已经写进调查记录。案件不会马上结束——'+deadlineText()+'，向调查局提交最终调查报告。在那之前，可以继续调查。'}
 function dawnText(){return '天亮了。\n港屋酒店207号室的调查期限，到此结束。'}
 /* ---------- 入口：到期 → 通知 → 报告；已提交 → 结局 ---------- */
 function gate(){
  const s=st();if(!s||s.state==='closed')return false;
  const h=hc();
  if(window.FLOOD&&FLOOD.gate(nightOver())){stopHotel();return true} // v40：延期中品川被淹
  if(window.PERIL&&PERIL.gate()){stopHotel();return true} // v42：即死事件
  if(s.state==='dead'){stopHotel();deathScreen(s.endingId);return true} // v29：调查死亡结局（BAD END）——可以回到提交报告之前
  if(s.state==='submitted'){if(h&&h.ending){s.state='closed';save();return false}stopHotel();playEnding();return true}
  if(h&&h.ending){s.state='closed';save();return false}
  if(due()&&!s.repairReportExit){if(window.MAGGOT&&MAGGOT.pending&&MAGGOT.pending())return false;stopHotel();if(s.state==='report')reportPage();else{s.state='due';save();notice()}return true}
  if(s.state==='active'&&ROOMFILE.solved(campaign)&&DAHLIA.sealed(campaign)&&!s.day6ReviewShown){reviewPage();return true}
  if(isLastDay()&&v18()&&!v18().flags['tonight:lastWarn']){v18().flags['tonight:lastWarn']=true;setTimeout(()=>{const t='⚠ 调查最后一天：'+deadlineText()+'调查期限结束，之后提交最终报告。';const el=document.getElementById('h18-toast');if(el){el.textContent=t;el.hidden=false;setTimeout(()=>{el.hidden=true},4200)}else UI.toast(t)},700)}
  return false;
 }
 function stopHotel(){try{if(window.H18&&H18.active())H18.stop()}catch(e){}}
 function expire(){const s=st();if(!s)return;if(s.state==='active')s.state='due';save();if(s.state==='report')reportPage();else notice()}
 /* DAY 6 一次性复核提示；始终打开既有线索系统，不新建数据库。 */
 function reviewPage(){
  const s=st();if(!s||s.state!=='active')return;
  s.day6ReviewShown=true;save();stopHotel();
  UI.page('investigation','最终复核','INVESTIGATION FILE / 复核',`
   <section class="rpg-panel"><div class="rpg-kicker">INVESTIGATION FILE / 复核</div><h2>浴室事故重建完成。</h2>
   <p>可以继续求证，也可以整理报告。</p>
   <p>你已经收集了不少线索，也留下了许多推论。</p><p>但推论并不等于事实。</p>
   <p>在提交报告之前，或许应该重新检查一遍自己的调查记录。</p></section>
   <section class="rpg-panel"><h2>最终复核</h2>
   <button class="story-btn" data-review="lib">线索库</button>
   <button class="story-btn" data-review="ded">推论记录</button>
   <button class="story-btn" data-review="ev">报告材料</button>
   <button class="story-btn" data-review="return">返回调查</button>
   <button class="story-btn" data-review="report">整理并提交最终报告</button></section>`);
  queueMicrotask(()=>CASEQUEST.brief());app.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{
   const k=b.dataset.review;
   if(['lib','ded','ev'].includes(k)){if(window.INV){INV.tab(k);INV.page()}return}
   if(k==='report'){reportPage();return}
   if(k==='return'){baseHome();return}
  });
 }
 function notice(){
  const N=RD().notice||{};stopHotel();
  UI.scene('story',notice);const s0=st(),canExt=s0&&!s0.extended&&s0.state==='due'&&!s0.report;
  app.innerHTML=`<div class="rpg-shell"><section class="story-panel rp-notice"><div class="story-meta">${esc(N.kicker||'调查局 / FILE NO. 001')}</div>${(N.lines||[]).map(t=>`<p>「${esc(t)}」</p>`).join('')}<button class="story-btn" id="rp-begin">${esc(N.button||'开始整理调查报告')}</button>${canExt?`<button class="story-btn alt" id="rp-extend">申请延迟结案（再调查 ${extDays()} 天，期间可以随时结案）</button>`:''}</section></div>`;
  app.querySelector('#rp-begin').onclick=()=>{const s=st();s.state='report';save();reportPage()};
  const ex=app.querySelector('#rp-extend');if(ex)ex.onclick=()=>UI.modal({title:'申请延迟结案？',
   html:'<p>调查局同意将调查期限延长五天。</p><p>本次延期只能申请一次。</p><p>延期期间可以随时提交最终调查报告，报告一经提交便无法修改。</p>',
   buttons:[{label:'确认延期',primary:true,fn:extend},{label:'取消'}]});
  window.scrollTo(0,0);
 }
 /* v33：延迟结案。只能申请一次；延期后照常调查，随时可以结案（closeEarly） */
 function extend(){const s=st();if(!s||s.extended||s.report)return;const before=lastDay();s.extended=true;s.extendedAt={day:campaign.day,from:before,to:lastDay()};s.state='active';save();
  if(window.UI&&UI.toast)UI.toast('调查局同意延期：期限延长到第 '+lastDay()+' 天。');
  if(campaign.day<=before&&typeof nightlyClose==='function')nightlyClose();else tokyoHome()}
 const canCloseEarly=()=>{const s=st();return !!(s&&s.state==='active'&&!s.report&&DAHLIA.sealed(campaign)&&ROOMFILE.solved(campaign))};
 function closeEarly(){if(canCloseEarly())reportPage()}
 /* ---------- 报告页面 ---------- */
 function cond(w){try{return !!(window.H18&&H18.cond(w))}catch(e){return false}}
 function persons(){if(!hc())return [];return (RD().persons||[]).map(p=>cond(p.discover)?p:p.always?Object.assign({},p,{name:p.unknownName||p.name,role:p.unknownRole||p.role}):null).filter(Boolean)}
 function obtained(){const ev=(campaign.investigation&&campaign.investigation.evidence)||{};return (window.INV?INV.evidence():[]).filter(e=>ev[e.id]).map(e=>REPORT6.material(e))}
 const maxEv=()=>CC().maxEvidence||4;
 function clean(){
  const draft=st().draft, facts=REPORT6.state(campaign), owned=new Set(obtained().map(e=>e.id));
  draft.evidence=[...new Set(draft.evidence)].filter(id=>owned.has(id)).slice(0,maxEv());
  if(draft.conclusion!=='reserve'&&!facts.available[draft.conclusion])draft.conclusion=null;
  if(draft.conclusion!=='murder'||!facts.suspects.includes(draft.suspect))draft.suspect=null;
 }
 const T=k=>String((RD().texts||{})[k]??'').replace(/\{max\}/g,maxEv());
 function keepView66(render){
  const pathOf=el=>{const a=[];while(el&&el!==document.body&&el.parentElement){a.unshift([...el.parentElement.children].indexOf(el));el=el.parentElement}return a.join('/')};
  const byPath=p=>{let el=document.body;for(const i of p.split('/').filter(x=>x!==''))el=el&&el.children[+i];return el};
  const y=window.scrollY,boxes=[...app.querySelectorAll('*')].filter(e=>e.scrollTop>0).map(e=>[pathOf(e),e.scrollTop]);
  const open=[...app.querySelectorAll('details[open] [data-opinion]')].map(e=>e.dataset.opinion);
  const om=app.querySelector('.os-main'),omTop=om?om.scrollTop:0;
  render();
  open.forEach(id=>{const d=app.querySelector('[data-opinion="'+id+'"]');const det=d&&d.closest('details');if(det)det.open=true});
  const restore=()=>{window.scrollTo(0,y);boxes.forEach(([p,t])=>{const e=byPath(p);if(e&&!e.classList.contains('os-main'))e.scrollTop=t});const m=app.querySelector('.os-main');if(m&&omTop)m.scrollTop=omTop};
  restore();setTimeout(restore,0);setTimeout(restore,80);setTimeout(restore,250); // 一屏化布局会在渲染后重新分页，等它排好再恢复一次
 }
 function reportPage(){
  const s=st();if(!s)return;if(['submitted','closed','dead'].includes(s.state)){gate();return}
  s.repairReportExit=false;stopHotel();clean();const facts=REPORT6.state(campaign),draft=s.draft,E=obtained(),sel=s.draft.evidence,full=sel.length>=maxEv();
  UI.page('report','最终调查报告','FILE NO. 001 · FINAL REPORT',`
   <section class="rpg-panel rp-info"><div class="rpg-kicker">案件基本信息</div><div class="et-grid rp-grid">
    <div><small>案件编号</small><b>001</b></div><div><small>案件名称</small><b>港屋酒店207号室</b></div>
    <div><small>调查时间</small><b>${st()&&st().extended?Math.max(1,Math.min(dayNo(),span())):span()} 天</b></div><div><small>调查状态</small><b>待提交</b></div>
    <div><small>已获得报告材料</small><b>${E.length} / 12</b></div></div></section>
   <section class="rpg-panel"><h2>案件结论</h2><div class="rp-persons">
    ${Object.keys(facts.available).filter(id=>facts.available[id]).map(id=>`<button type="button" class="rp-person" data-conclusion="${id}" aria-pressed="${draft.conclusion===id}">${REPORT6.labels[id]}</button>`).join('')||'<p>手帐里还没有可以提交的案件解释。</p>'}
   </div><button type="button" class="line-chip" data-conclusion="reserve" aria-pressed="${draft.conclusion==='reserve'}">保留判断</button></section>
   <section class="rpg-panel"><h2>选择报告材料 <small>已选 ${sel.length} / ${maxEv()}</small></h2><p>${esc(T('evidenceQ'))}</p><p class="survival-tip">材料会随新来源补充或修正其证据范围，但不会自动替你选择结论。请区分已取得的记录、尚待核实的解释和证据不足的指控。</p>
    <div class="rp-evs">${(window.INV?INV.evidence():[]).map(x=>{const e=E.find(y=>y.id===x.id);if(!e)return `<div class="rp-ev rp-locked" aria-disabled="true"><small>${x.id}</small><b>？？？</b><p>未获得</p></div>`;const on=sel.includes(e.id);return `<div><button type="button" class="rp-ev" data-ev="${e.id}" aria-pressed="${on}" ${!on&&full?'disabled':''}><small>${e.id}</small><b>${esc(e.name)}</b><p>${esc(e.desc)}</p><small>我的判断：${esc(e.interpretation)}</small>${e.revisions.length?'<small>有 '+e.revisions.length+' 条新增来源待核对</small>':''}${e.concern?'<small>此项判断的证据仍不足</small>':''}</button>${REPORT6.editor(e)}</div>`}).join('')}</div>${full?`<p class="survival-tip">已经选了 ${maxEv()} 项。要换一项，先取消一项。</p>`:''}${E.length?'':`<p class="survival-tip">${esc(T('noEvidence'))}</p>`}</section>
   ${draft.conclusion==='murder'?`<section class="rpg-panel"><h2>你认为谁杀害了片山茂？</h2>${facts.suspects.map(id=>`<button type="button" class="rp-person" data-accused="${id}" aria-pressed="${draft.suspect===id}">${REPORT6.names[id]}</button>`).join('')||'<p>目前的推论还没有指向具体的人。可以复核推论记录。</p>'}</section>`:''}
   ${ROOMFILE.controls()}
   ${dispHtml()}
   <section class="rpg-panel rp-submit"><h2>最后一步：确认并提交</h2><p class="survival-tip">${ready()?'确认无误后点「确认报告内容」，在弹出的确认框里提交。提交后不能再修改。':'还不能提交：请先在「案件结论」里选一个结论'+(draft.conclusion==='murder'?'，并指认人物、附上报告材料':'')+'。'}<br>也可以先暂存，之后从东京地图上的「📝 继续整理最终报告」回来。</p><button type="button" class="survival-btn" id="rp-submit" ${ready()?'':'disabled'}>确认报告内容</button><button type="button" class="survival-btn alt" id="rp-return">暂存报告，返回地图</button>${(!s.extended&&!s.report)?`<button type="button" class="survival-btn alt" id="rp-extend2">申请延迟结案（再调查 ${extDays()} 天，期间可以随时结案）</button>`:''}</section>
   ${dev()?`<section class="rpg-panel inv-dev"><h3>🛠 开发者</h3><div class="inv-pickers"><button type="button" class="rpg-action" id="rp-dev">打开开发者工具（线索调查页）</button></div><pre class="rp-pre">${esc(JSON.stringify(preview(),null,1))}</pre></section>`:''}`);
  const leaveDraft=()=>{s.repairReportExit=true;save();baseHome()};const bk=app.querySelector('#et-back');if(bk){bk.hidden=false;bk.onclick=leaveDraft} // 截止前可返回调查
  const rr=()=>keepView66(reportPage); // v66：页内操作后保持滚动位置和已展开的「来源与判断」
  app.querySelectorAll('[data-conclusion]').forEach(b=>b.onclick=()=>{draft.conclusion=b.dataset.conclusion;draft.suspect=null;save();rr()});
  app.querySelectorAll('[data-accused]').forEach(b=>b.onclick=()=>{draft.suspect=b.dataset.accused;save();rr()});
  ROOMFILE.bind();REPORT6.bindMaterials(rr);
  app.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const id=b.dataset.ev,i=s.draft.evidence.indexOf(id);if(i>=0)s.draft.evidence.splice(i,1);else if(s.draft.evidence.length<maxEv())s.draft.evidence.push(id);save();rr()});
  app.querySelectorAll('[data-disp]').forEach(b=>b.onclick=()=>{s.draft.disposal=b.dataset.disp;save();rr()});
  const rb=app.querySelector('#rp-return');if(rb)rb.onclick=leaveDraft;const ex2=app.querySelector('#rp-extend2');if(ex2)ex2.onclick=()=>UI.modal({title:'申请延迟结案？',html:'<p>调查局同意将调查期限延长 '+extDays()+' 天。</p><p>本次延期只能申请一次。已经填写的报告草稿会保留。</p><p>延期期间可以随时提交最终调查报告，报告一经提交便无法修改。</p>',buttons:[{label:'确认延期',primary:true,fn:extend},{label:'取消'}]});
  const sb=app.querySelector('#rp-submit');if(sb)sb.onclick=askSubmit;
  const dv=app.querySelector('#rp-dev');if(dv)dv.onclick=()=>{if(window.INV)INV.page()};
  window.scrollTo(0,0);
 }
 /* v30 报告的处理方式（data/investigation/report.json 的 dispositions）：只有剧情里真的发生过才解锁；只有一个可选时不显示 */
 const DISPS=()=>RD().dispositions||[{id:'submit',label:'正式提交调查局'}];
 function unlocked(d,story){const u=d.unlock;if(!u)return true;if(u.decision&&!u.decision.includes((story||{}).decision))return false;if(u.when&&!cond(u.when))return false;return true}
 function dispOptions(){const s=st();return DISPS().filter(d=>unlocked(d,s.story)).map(d=>d.id)}
 const PRE={publish:'publish',silence:'private',leave:'leave'}; // 调查中做过的决定 → 默认的处理方式
 function disposal(){const s=st(),o=dispOptions();if(s.draft.disposal&&o.includes(s.draft.disposal))return s.draft.disposal;const pre=PRE[s.story.decision]||'submit';return o.includes(pre)?pre:'submit'}
 function dispHtml(){const o=dispOptions();const cur=disposal(),L=Object.fromEntries(DISPS().map(d=>[d.id,d.label]));
  return `<section class="rpg-panel"><h2>报告的处理方式</h2><p class="survival-tip">${esc(T('dispQ')||'这份报告，你打算怎么处理？')}</p><div class="rp-persons">${o.map(k=>`<button type="button" class="rp-person" data-disp="${k}" aria-pressed="${cur===k}"><b>${esc(L[k]||k)}</b></button>`).join('')}</div></section>`}
 /* v29：证据少于最低数量也可以提交（不提示后果），只保留一次正常的最终确认 */
 function ready(){
  const s=st();if(!s||!DAHLIA.sealed(campaign)||!ROOMFILE.solved(campaign)||!['report','active','due'].includes(s.state))return false;
  const d=s.draft,f=REPORT6.state(campaign);
  if(d.conclusion==='murder'&&!d.evidence.length)return false;
  return d.conclusion==='reserve'||!!(f.available[d.conclusion]&&(d.conclusion!=='murder'||f.suspects.includes(d.suspect)));
 }
 function askSubmit(){
  if(!ready())return;
  const r=snapshot(),name=REPORT6.labels[r.conclusion]||'保留判断',target=r.suspect?' · 指认'+REPORT6.names[r.suspect]+'杀害片山茂':'';
  const disp=DISPS().find(d=>d.id===r.disposal);
  UI.modal({title:'确认提交最终报告',html:'<p>'+esc(name+target)+'</p><p>'+esc(r.evidence.join('、')||'未附报告材料')+'</p>'+r.materials.map(m=>'<div><p><b>'+esc(m.name)+'</b>｜已取得来源 '+m.sources.length+' 项；新增复核 '+(m.revisions||[]).length+' 项<br><small>当前判断：'+esc(m.interpretation)+'</small>'+(m.concern?'<small>（该指控的证据仍不足）</small>':'')+'</p>'+CASE_NOTES.sourceSummary(m)+'</div>').join('')+'<p>'+esc(disp?.label||'正式提交调查局')+'</p>',buttons:[{label:'返回修改'},{label:'确认提交',primary:true,fn:submit}]});
 }
 /* ---------- 提交与判定 ---------- */
 const FLAGS=['clientKnown','tanakaTold','tanakaPast','photoNamed','visitDone','offerTaken','tanakaMet','tanakaContact','moriConfessed','caseAsked'];
 function snapshot(){const s=st(),v=v18()||{flags:{}};return {schema:2,conclusion:s.draft.conclusion,suspect:s.draft.conclusion==='murder'?s.draft.suspect:null,evidence:s.draft.evidence.slice(),disposal:disposal(),
  materials:obtained().filter(e=>s.draft.evidence.includes(e.id)).map(({choices,...e})=>e),overdue:campaign.day>lastDay()||nightOver(),submittedAt:{day:campaign.day,time:TM.fmt(TM.now()??0),caseDay:dayNo()},case:{start:s.start,lastDay:lastDay(),days:span(),state:s.state},
  story:Object.assign({},s.story),flags:Object.fromEntries(FLAGS.map(k=>[k,!!(v.flags||{})[k]])),verifyDone:Object.keys((campaign.verify&&campaign.verify.done)||{}),
  prevStoryIndex:campaign.storyIndex||0}}
 function mode(){return 'final'}
 const minEv=()=>CC().MIN_REPORT_EVIDENCE||3;
 function judge(report){return REPORT6.judge(report,REPORT6.state(campaign),minEv())}
 function preview(){const input=snapshot();return {input,unlocks:REPORT6.state(campaign),output:judge(input)}}
 function batchCheck(){const f=REPORT6.state(campaign);const a=REPORT6.audit(minEv());return {ok:a.ok,lines:[...a.lines,JSON.stringify(f),...REPORT6.simulate(minEv())]}}
 const RETRY='tokyo-ch1-report-retry',SEEN='tokyo-ch1-endings';
 function submit(){
  if(!ready())return false;const selected=st().draft.evidence;if(selected.length>maxEv()||new Set(selected).size!==selected.length||selected.some(id=>!obtained().some(e=>e.id===id)))return false;clean();if(!ready())return false;
  const s=st(),r=snapshot(),out=judge(r);if(!out.ending)return false;
  try{localStorage.setItem(RETRY,JSON.stringify(campaign))}catch(e){} // 死亡回溯：回到提交报告之前
  s.report=r;s.judge={input:r,output:out};s.endingId=out.ending;s.state='submitted';s.played=false;
  save();playEnding();return true;
 }
 function record(id){const s=st();s.unlocked??=[];if(!s.unlocked.includes(id))s.unlocked.push(id);try{const g=JSON.parse(localStorage.getItem(SEEN)||'{}');g[id]??={at:new Date().toISOString()};localStorage.setItem(SEEN,JSON.stringify(g))}catch(e){}}
 function canRewind(){try{return !!localStorage.getItem(RETRY)}catch(e){return false}}
 function rewind(){let snap=null;try{snap=JSON.parse(localStorage.getItem(RETRY)||'null')}catch(e){}if(!snap)return false;
  campaign=snap;campaign.case1.state='report';campaign.case1.repairReportExit=false;playingReport=null;campaignSave();if(window.DM)DM.clearHistory();reportPage();return true}
 function deathScreen(id){ENDTACHIE.detach();DEATHS.endScreen(id,{canRewind:canRewind(),onRewind:rewind})}
 let playingReport=null;
 function playEnding(){const s=st();if(!s||!s.endingId||!s.report||playingReport===s.report)return;playingReport=s.report;const h=hc();if(h&&h.ending){s.state='closed';save();return}
  const id=s.endingId;
 if(id==='yumi_weekly'){stopHotel();YUMI.play('ending',()=>{s.state='dead';s.played=true;record(id);save();setTimeout(()=>deathScreen(id),0)});return;}
 if(id==='tanaka_accused'){stopHotel();TANAKA.cinema('ending',()=>{s.state='dead';s.played=true;record(id);save();setTimeout(()=>deathScreen(id),0)});return;}
 if(id==='sato_family'){stopHotel();SATO.ending(()=>{s.state='dead';s.played=true;record(id);save();setTimeout(()=>deathScreen(id),0)});return;}
 if(id==='mori_open'){stopHotel();MORI.ending(()=>{s.state='dead';s.played=true;record(id);save();setTimeout(()=>deathScreen(id),0)});return;}
 if(id==='kobayashi_name'){stopHotel();KBRANCH.ending(()=>{s.state='dead';s.played=true;record(id);save();setTimeout(()=>deathScreen(id),0)});return;}
  if(window.DEATHS&&DEATHS.has(id)){stopHotel();DEATHS.play(id,()=>{s.state='dead';s.played=true;record(id);save();deathScreen(id)});return}
  s.played=true;record(id);if(id==='promise')s.ability='echo';
  try{localStorage.removeItem(RETRY)}catch(e){} // 正常结局：报告锁定，不再回溯
  save();H18.ending(id,{report:true})}
 /* ---------- 开发者工具（线索调查页面最下面，#dev=1） ---------- */
 let last='';
 const ALLEND=()=>Object.keys(CHE().endings||{}).filter(k=>!k.startsWith('_')).concat(window.DEATHS?DEATHS.list():[]);
 function selfCheck(){return batchCheck().lines.join('\n')}
 function devHtml(){
  if(!dev())return '';
  const sample=['mori','sato','kobayashi','tanaka','takahashi','accident','supernatural','disappearance'];
  return '<h3>最终报告测试</h3><button class="rpg-action" data-cdev="sato-fixture">一键满足佐藤结局前置</button>'+['open','judge','check','reset','rewind'].map((id,i)=>'<button class="rpg-action" data-cdev="'+id+'">'+['打开报告','当前解锁与判定','规则模拟与资源映射','重置报告','读取提交前快照'][i]+'</button>').join('')+
   sample.map(k=>'<button class="rpg-action" data-cdev="sample:'+k+'">模拟 '+esc(REPORT6.names[k]||REPORT6.labels[k])+'</button>').join('')+
   '<pre>'+esc(last)+'</pre>';
 }
 function details(){return JSON.stringify(preview(),null,2)}
 function devDisp(id){const s=st(),v=v18();if(!v)return;if(id==='publish')s.story.decision='publish';if(id==='leave')s.story.decision='leave';if(id==='private')v.flags.offerTaken=true;if(id==='nocheck'&&!v.clues.includes('phonelog'))v.clues.push('phonelog');if(id==='noblame'&&!v.testimony.includes('t_sato'))v.testimony.push('t_sato');s.draft.disposal=id}
 function autoReport(id){last=REPORT6.simulate(minEv(),id).join('\n');return false}
 function devBind(){app.querySelectorAll('[data-cdev]').forEach(b=>b.onclick=()=>{const stay=devDo(b.dataset.cdev);if(stay!==false&&window.INV)INV.page()})}
 function devDo(k){
  if(!campaign)return;try{H18.cond({})}catch(e){}const s=st(),v=v18();const [a,arg]=k.split(':');
  if(a==='day'){if(s.start==null)s.start=campaign.day;s.state=s.state==='closed'?'closed':'active';campaign.day=s.start+(+arg)-1;if(v){v.clockDay=campaign.day;v.clock=0;v.flags['tonight:entered']=true;delete v.flags['tonight:lastWarn']}}
  if(a==='eve'){if(s.start==null)s.start=campaign.day;campaign.day=lastDay();if(v){v.clockDay=campaign.day;v.clock=END-30;v.flags['tonight:entered']=true}}
  if(a==='expire'){if(s.start==null)s.start=campaign.day;save();expire();return false}
  if(a==='open'){if(s.start==null)s.start=campaign.day;s.state='report';save();reportPage();return false}
  if(a==='persons'&&v){['mori','sato','inoue','kobayashi'].forEach(id=>v.flags['met:'+id]=true);v.flags.tanakaMet=true;v.flags.e3=true}
  if(a==='flags'&&v){Object.assign(v.flags,{clientKnown:true,moriConfessed:true,tanakaTold:true,photoNamed:true,offerTaken:true});if(!v.clues.includes('notebook'))v.clues.push('notebook')}
  if(a==='clear')s.draft={person:null,evidence:[]};
  if(a==='submit'){if(s.start==null)s.start=campaign.day;s.state='report';s.draft.person=s.draft.person||(persons()[0]||{}).id||null;s.draft.evidence=obtained().slice(0,+arg).map(e=>e.id);last=JSON.stringify(preview(),null,1);if(!submit()){save();return}return false}
  if(a==='judge')last=details();
  if(a==='disp')devDisp(arg);
  if(a==='sato-fixture'){V51ADD.satoFixture();return false}
  if(a==='sample'||a==='auto')autoReport(arg);
  if(a==='check')last=selfCheck();
  if(a==='play'){if(s.start==null)s.start=campaign.day;try{localStorage.setItem(RETRY,JSON.stringify(Object.assign({},campaign,{case1:Object.assign({},s,{state:'report'})})))}catch(e){}s.report=snapshot();s.endingId=arg;s.state='submitted';s.played=false;save();playEnding();return false}
  if(a==='reset'){const h=hc();if(['submitted','closed','dead'].includes(s.state)){if(h){h.ending='';h.stance=''}delete campaign.hotelEnding;delete campaign.hotelEndingVariant;if(s.report)campaign.storyIndex=s.report.prevStoryIndex}s.state='report';s.report=null;s.judge=null;s.endingId=null;s.played=false}
  if(a==='reload'){save();location.reload();return false}
  if(a==='rewind'){if(!rewind())last='（没有可以回溯的报告）';else return false}
  if(a==='legacy'){delete campaign.case1;if(v&&!v.startDay)v.startDay=campaign.day;save();location.reload();return false}
  if(a==='mode'){try{localStorage.setItem('tokyo-judge-mode',mode()==='temp'?'final':'temp')}catch(e){}}
  save();
 }
 /* ---------- 接入：回到东京地图时也检查期限 ---------- */
 const baseHome=tokyoHome;
 tokyoHome=function(){if(campaign&&campaign.firstDayComplete&&hc()&&gate())return;return baseHome.apply(this,arguments)};
 return {extend,canCloseEarly,closeEarly,extended:()=>!!(st()&&st().extended),begin,reviewPage,dayNo,days:span,lastDay,isLastDay,label,deadlineText,due,intercept,decided,decidedText,dawnText,gate,expire,notice,reportPage,persons,obtained,judge,preview,submit,rewind,selfCheck,batchCheck,minEv,dispOptions,autoReport,devDisp,
  state:()=>campaign&&st(),devHtml,devBind,dev:devDo,mode};
})();
window.CASE5=CASE5;
