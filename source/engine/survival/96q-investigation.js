/* ==== engine/survival/96q-investigation.js ==== */
/* ===================================================================
   【第一章线索调查系统 · 第一阶段】线索库 / 线索组合 / 推论记录 / 报告材料（固定 12 项）
   - 数据：data/investigation/clues.json（线索，from=从第一章原有证物 / 证词 / 邮件自动获得）
           data/investigation/deductions.json（两条线索的组合表；truth 是内部数据，界面绝不显示）
           data/investigation/evidence.json（报告材料 E01～E12）
   - 存档：campaign.investigation = {clues:{id:{at,seen,n}}, deductions:{id:{at,from}}, evidence:{id:{at,source}}, n}
     旧存档：第一次打开时按原有证物 / 证词 / 邮件自动补上（不提示、不重玩）。
   - 入口：底部导航「🧩 推理」。不改原有证物、证词、剧情和结局。
   - 第二阶段接口：INV.grantEvidence(id, source) 写入报告材料；INV.deductions() / INV.verifyTargets(npc) 给「向 NPC 求证」用。
   - 开发者工具：地址后面加 #dev=1 打开（#dev=0 关闭），线索调查页面最下面出现。
   =================================================================== */
const CHAPTER_DEV_BUILD=false;
const INV=(function(){
 const CL=()=>(GAME_DATA.d['investigation/clues']||{}).clues||[];
 const DD=()=>((GAME_DATA.d['investigation/deductions']||{}).deductions||[]).filter(d=>d.id!=='MD07'||!!campaign?.roomFile?.reconstruction).map(d=>d.id==='YK-D2'&&campaign?.investigation?.deductions?.['YK-D1']?{...d,name:'议员的婚外情',desc:'酒店笔记与次日同一人的街景影像相接。他与高桥可能有婚外情。'}:d);
 const EV=()=>(GAME_DATA.d['investigation/evidence']||{}).evidence||[];
 const clue=id=>CL().find(c=>c.id===id),ded=id=>DD().find(d=>d.id===id);
 const key=(a,b)=>[a,b].sort().join('+');
 function st(){campaign.investigation??={};const s=campaign.investigation;s.clues??={};s.deductions??={};s.evidence??={};s.n??=0;s.dn??=0;return s}
 const now=()=>({day:campaign.day,time:TM.fmt(TM.now()??0)});
 let baseSave=null;const save=()=>campaignSave(); // 完整存档（之后的模块——例如 96r-verify.js——也会跟着更新）
 /* 线索是否已经由原有剧情获得（不改原有字段，只读取） */
 function legacyHas(f){if(!f||!campaign)return false;const v=campaign.hotelCase&&campaign.hotelCase.v18;
  if(f.evidence)return !!(v&&(v.clues||[]).includes(f.evidence));
  if(f.testimony)return !!(v&&(v.testimony||[]).includes(f.testimony));
  if(f.mail)return !!(window.MAIL&&MAIL.list().some(m=>m.id===f.mail));
  return false}
 function addClue(id,silent){const c=clue(id);if(!c||!campaign)return false;const s=st();if(s.clues[id])return false;s.n++;s.clues[id]={at:now(),seen:false,n:s.n};if(!testingGuide&&window.TAINT)TAINT.onNew(id);
  if(!silent&&typeof UI!=='undefined'){const msg='📋 新线索已记录：'+c.name+'。可在调查板按主题整理。',t=document.getElementById('et-toast');if(t&&!t.hidden)setTimeout(()=>UI.toast(msg),1400);else UI.toast(msg)}return true}
 /* 每次存档时检查一次：原有剧情里拿到的证物 / 证词 → 线索库 */
 function sync(){if(!campaign)return;const first=!campaign.investigation;const s=st();let any=false;if(s.deductions.MD07&&!campaign.roomFile?.reconstruction){campaign.roomFile??={};campaign.roomFile.legacyMD07??=s.deductions.MD07;s.deductions.MD12??={...s.deductions.MD07,from:['M12','C07']};delete s.deductions.MD07;const a=s.attempts?.['C07+M12'];if(a?.result?.d)a.result.d=DD().find(d=>d.id==='MD12');any=true}if(s.devCleared)return false; // 开发者「清空」之后不再自动补线索（「获得全部测试线索」恢复）
  CL().forEach(c=>{if(!s.clues[c.id]&&legacyHas(c.from)){addClue(c.id,first);any=true}});
  // 历史已付费组合重新比对配方：只更正推论，不触发 combine，不重扣费用。
  s.attempts??={};
  for(const [k,a] of Object.entries(s.attempts)){
   if(a.first!=null)continue;
   a.first=a.revalidated?'unknown':a.success?'success':'failed';a.deduction=a.success?(a.result?.d?.id||null):null;
   if(!a.deduction&&a.success)a.deduction=Object.keys(s.deductions).find(id=>(s.deductions[id]?.from||[]).slice().sort().join('+')===k)||null;
   any=true;
  }
  return any}
 /* ---------- 组合 ---------- */
 function combine(a,b){
  const s=st();if(!a||!b)return {kind:'need'};if(a===b)return {kind:'same'};
  if(!s.clues[a]||!s.clues[b])return {kind:'locked'};
  if(window.TAINT&&(TAINT.is(a)||TAINT.is(b)))return {kind:'tainted',ids:[a,b].filter(TAINT.is)}; // v42：污染的线索不能合成，不收费
  const k=key(a,b);s.attempts??={};
  const d=DD().find(x=>key(x.pair[0],x.pair[1])===k);
  const old=s.attempts[k];
  if(old){if(!d)return old.deduction&&ded(old.deduction)?{kind:'known',d:ded(old.deduction)}:{kind:'none',again:true};
   if(!old.success||!s.deductions[d.id]){old.first??=old.success?'success':'failed';old.success=true;old.deduction=d.id;old.result={kind:'known',d};old.revalidated=true;
    if(!s.deductions[d.id]){s.deductions[d.id]={at:now(),from:[a,b].sort(),n:++s.dn};window.SATO?.onDeduction(d.id);window.TANAKA?.onDeduction(d.id)}save()}
   return {kind:'known',d};
  }
  const fee=GAME_CONFIG.investigation.combineFee;
  if(campaign.cash<fee)return {kind:'cash'};
  // Synchronous reservation precedes every callback/save: double clicks cannot debit twice.
  s.attempts[k]={at:now(),success:!!d,first:d?'success':'failed',deduction:d?.id||null,paid:fee,result:{kind:d?'known':'none'}};
  GS.change({cash:-fee},'推论分析费（首次组合，未建立推论也收费）');
  let result={kind:'none'};
  if(d){const known=!!s.deductions[d.id];if(!known)s.deductions[d.id]={at:now(),from:[a,b].sort(),n:++s.dn};result={kind:known?'known':'new',d};if(window.SATO)SATO.onDeduction(d.id);if(window.TANAKA)TANAKA.onDeduction(d.id)}
  save();UI.update();return result;
 }
 /* ---------- 第二阶段接口 ---------- */
 function grantEvidence(id,source){const e=EV().find(x=>x.id===id);if(!e||!campaign)return false;const s=st();if(s.evidence[id])return false;s.evidence[id]={at:now(),source:source||''};save();return true}
 function verifyTargets(npc){const s=st();return DD().filter(d=>s.deductions[d.id]&&(d.verify||[]).includes(npc)).map(d=>d.id)}
 /* ---------- 画面 ---------- */
 let tab='lib',pick=[null,null],result=null,open=null;
 const BOARDS=[['all','全部线索'],['room','207号室'],['people','人物关系'],['money','金钱纠纷'],['clock','时间与行踪'],['other','其他资料']];
 const TAGS={
 'C01':['room'],'C02':['room','people'],'C03':['room','clock'],'C04':['room','clock'],'C05':['people','clock'],'C06':['room','clock'],'C07':['clock','room'],'C08':['people'],'C09':['people'],'C10':['people','clock'],'C11':['people'],'C12':['room'],'C13':['room','clock','people'],'C14':['room'],'C15':['people','clock'],
 'K01':['people','clock'],'K02':['people'],'K03':['people','other'],'K04':['people','other'],'K05-A':['room','people','clock'],'K05-B':['people','clock'],'K06':['people'],'K07':['people','clock'],
 'M01':['money','people'],'M02':['money','people'],'M03':['money','people'],'M04':['money'],'M05':['money','room'],'M06':['money','people','clock'],'M09':['clock','people'],'M10':['money'],'M11':['room','people','clock'],'M12':['room'],'MC08':['people','clock'],'MT01':['money','people'],'MT02':['money','clock']};
 function tags(id){if(/^P0\d$/.test(id))return {P01:['people'],P02:['people','clock'],P03:['room','people'],P04:['room','clock'],P05:['room','clock']}[id];if(id.startsWith('TN'))return ['people','clock'];return id.startsWith('ST')?(id==='ST02'||id==='ST10'?['room','people','clock']:['people','money']):TAGS[id]||['other']}
 let topic='all',query='',onlyUnread=false,clueSort='found',selectedTimeline=null;
 function matched(id,r){const c=clue(id);if(!c)return false;return (!area||sourceArea(c)===area)&&(shelf==='all'||shelf==='star'&&r.star||shelf==='done'&&guide().reviews[id]||shelf==='todo'&&!guide().reviews[id])&&(topic==='all'||tags(id).includes(topic))&&(!onlyUnread||!r.seen)&&(!query||[c.name,c.desc,c.source,aboutOf(c),id].join(' ').toLowerCase().includes(query.toLowerCase()))}
 function orderedClues(){const s=st();return Object.entries(s.clues).filter(([id,r])=>matched(id,r)).sort((a,b)=>clueSort==='newest'?b[1].n-a[1].n:a[1].n-b[1].n)}
 function filtersHtml(){const s=st();return `<div class="inv-filter-panel" aria-label="线索分类与筛选"><div class="inv-category-row">${BOARDS.map(([k,label])=>`<button type="button" class="line-chip" data-topic="${k}" aria-pressed="${topic===k}">${label} <small>${Object.keys(s.clues).filter(id=>k==='all'||tags(id).includes(k)).length}</small></button>`).join('')}</div><div class="inv-filter-controls">${toolsHtml()}<label>查找线索<input id="inv-search" class="inv-search" type="search" placeholder="输入人物、房间、日期或关键词" value="${esc(query)}"></label><label>排序<select id="inv-sort"><option value="found" ${clueSort==='found'?'selected':''}>发现顺序</option><option value="newest" ${clueSort==='newest'?'selected':''}>最近获得</option></select></label><label class="inv-unread-check"><input id="inv-unread" type="checkbox" ${onlyUnread?'checked':''}> 只看未读</label></div><p class="survival-tip">主题可交叉归类；同一条线索可能出现在多个栏目。分类只是整理方式，不暗示哪两条一定能合成。</p></div>`}
 function guideAudit(){
  const original=campaign,persist=campaignSave,lines=[];
  function check(name,value){lines.push((value?'通过　':'失败　')+name)}
  try{
   testingGuide=true;campaignSave=()=>{};campaign={day:2,actionDay:2,days:10,firstDayComplete:true,actions:3,cash:10000,hp:90,san:90,location:'gotanda',visitedToday:['gotanda'],case1:{start:1,state:'active'},hotelCase:{v18:{flags:{},clues:[]}},investigation:{clues:{},deductions:{},evidence:{},attempts:{}},verify:{done:{}},omikuji:{records:[]}};
   for(const id of ['C01','C02','C08','M12','C07','DAY-UE-03'])addClue(id,true);
   check('旧档首次打开初始化、不改已有线索',daily().length===0&&Object.keys(st().clues).length===6);
   check('第一级免费',!purchase(2,0)&&campaign.cash===10000&&daily().length===1);
   campaign.cash=599;check('余额不足不记次数',purchase(2,1).includes('余额不足')&&daily().length===1&&campaign.cash===599);campaign.cash=10000;
   campaign.case1.state='closed';check('没有地点时不扣费',!!purchase(2,1)&&campaign.cash===10000&&daily().length===1);campaign.case1.state='active';
   for(const grade of ['daikichi','kichi','kyo']){campaign.omikuji.records=[{day:2,grade}];const choices=optionsFor(1);check(grade+' 仅在可达候选中选择',choices.length&&choices.includes(choose(choices,grade,Math.random)))}
   check('第二级固定 ¥600',!purchase(2,1)&&campaign.cash===9400&&daily().length===2);
   const tmp=st().clues;st().clues={C08:tmp.C08};check('不足两条不收费',purchase(2,2).includes('没有足够')&&campaign.cash===9400);st().clues=tmp;
   check('第三级固定 ¥1,200，一次两条',!purchase(2,2)&&campaign.cash===8200&&daily()[2].items.length===2);
   purchase(2,2);check('同日用尽及防止重复扣款',daily().length===3&&campaign.cash===8200&&campaign.actions===3);
   check('独立怪谈／酒店事件／人物与案件多重关联',reviewText('DAY-UE-03').includes('第二道影子')&&reviewText('C01').includes('207')&&reviewText('C08').includes('经历'));
   const ids=daily()[2].items.map(r=>r.id);campaign=JSON.parse(JSON.stringify(campaign));campaign.day=3;check('跨日刷新、旧结果可读、排查不重抽',!daily().length&&!!guide().days[2]&&ids.every(id=>guide().reviews[id]&&!optionsFor(2).some(r=>r.id===id)));
   const funds=campaign.cash;combine('C01','C02');combine('C02','C01');check('无序组合仅收一次 ¥500',campaign.cash===funds-500);
   const result=combine('M12','C07');check('早期不会形成事故推论',result.d?.id==='MD12'&&!REPORT6.state(campaign).available.accident);
   campaign.day=4;check('未确认死亡前不能复查浴室',!ROOMFILE.canInspect(campaign));campaign.hotelCase.v18.flags['mori:concealment']=true;check('DAY 3 起可复查，仍需现场重建',ROOMFILE.canInspect(campaign)&&!ROOMFILE.solved(campaign));check('DAY 4 起人物动机另需求证',!ROOMFILE.motive({...campaign,day:5}));
   for(const id of ['BR03','BR04'])addClue(id,true);combine('BR03','BR04');const before=campaign.cash;
   campaign.roomFile={reconstruction:{day:4}};for(const id of ['BR01','BR02','BR05'])addClue(id,true);combine('BR04','BR03');
   check('旧失败组合免费复查，保留首次结果',campaign.cash===before&&st().attempts['BR03+BR04'].first==='failed'&&st().attempts['BR03+BR04'].revalidated);
   for(const [did,npc] of [['D14','tanaka'],['D15','tanaka'],['D16','kobayashi'],['D17','mori'],['D18','sato'],['D19','mori'],['D20','tanaka'],['D21','tanaka']]){
    const d=ded(did);for(const id of d.pair)addClue(id,true);addClue('C09',true);combine(...d.pair);const r=VERIFY.fieldRule(did,npc);
    check(did+' 外出与酒店共用求证记录',r&&VERIFY.fieldConfirm(did,npc)&&campaign.verify.done[r.id]&&!VERIFY.fieldConfirm(did,npc));
   }
   check('材料及对应推论同步',verification('D14').eids.includes('E07')&&EV().length===12);
   campaign.day=6;check('最终报告读取重建状态',REPORT6.state(campaign).available.accident&&CASE5.dayNo()===6);
  }catch(e){lines.push('测试中断　'+e.message)}finally{testingGuide=false;campaign=original;campaignSave=persist}
  return lines.join('\n')
 }

 const rates=[0,600,1200],levels=['方向提醒','地点提醒','线索排查'];
 const districts={KS:['kitashinagawa','北品川'],GD:['gotanda','五反田'],SB:['shimbashi','新桥'],UE:['ueno','上野']};
 let shelf='all',area='',pairMode='all',message='';
 const guide=()=>st().guide??={days:{},reviews:{}};
 const daily=()=>guide().days[campaign.day]||[];
 const sourceArea=c=>districts[c.id.split('-')[1]]?.[1]||c.source||'来源未详';
 function reviewText(id){
  const room='这份记录涉及207号室的住客或酒店调查，仍须结合取得经过核对。',person='这条记录也涉及一个人的经历。它与客房事件的关系仍待核对。';
  if(id==='DAY-UE-03')return '这条传闻涉及上野不忍池的第二道影子。目前没有资料把它与207号室直接联系起来。';
  if(['DAY-GD-04','DAY-SB-04','DAY-KS-05'].includes(id))return '这是一条当地流传的异闻。现有记录不足以把它和酒店事件联系起来。';
  if(/^DAY-(KS|GD|SB|UE)-0[12]$/.test(id))return ['DAY-KS-01','DAY-KS-02','DAY-UE-01','DAY-UE-02'].includes(id)?room+' '+person:room;
  if(/^DAY-(KS|GD|SB|UE)-0[3-6]$/.test(id))return '目前尚未发现这项街区记录与正在调查的客房事件存在明确联系。';
  if(['C08','C09','C10','C11','C15','TN10','KT05'].includes(id))return room+' '+person;
  if(/^C(0[1-7]|1[2-4])$/.test(id)||['M12','M11','MC08','ST02','ST10','K05-A','K05-B'].includes(id))return room;
  if(/^BR0[0-5]$/.test(id))return CASE5.dayNo()>=4?room:null;
  if(/^(TN|YK|ST|M|K)/.test(id)&&clue(id)?.about)return '这条记录涉及人物的生活、工作或交往。仅凭这一点，还不能判断其与207号室的联系。';
  return null;
 }
 function optionsFor(level){
  const s=st(),known=id=>!!s.clues[id],g=guide(),past=Object.values(g.days).flat();
  if(level===2)return Object.keys(s.clues).filter(id=>clue(id)&&!g.reviews[id]&&reviewText(id)).map(id=>({id,text:reviewText(id)}));
  if(level===0){const items=[];
   if(['C01','C02','C03','C13'].some(known)&&!s.evidence.E02)items.push('客房的使用情况与登记说法，还有需要核实之处。');
   if(Object.keys(s.deductions).some(id=>!verification(id).records.length))items.push('手帐里有些判断还只有你自己的解释。可以听听当事人怎样说。');
   if(['C04','C05','C07','C13'].some(known))items.push('记录写下的时间，与事情真正发生的时间，可以分开整理。');
   if(['C08','C09','DAY-KS-01','DAY-UE-01'].some(known))items.push('关于旧友的回忆，有哪些是当事人亲自见过的？');
   if(['M01','M02','M04','M05'].some(known))items.push('私人财物的去向和酒店业务上的经手记录，值得分开梳理。');
   if(Object.values(s.clues).some(r=>r.star))items.push('回到你亲自标过的记录，看看哪些说法仍然只有一个来源。');
   if(Object.keys(s.clues).length)items.push('把亲眼见过的事与转述的消息分开，再看看手帐里还有哪些疑问。');
   const rows=items.map(text=>({id:text,text})),fresh=rows.filter(x=>!past.some(p=>p.text===x.text));return fresh;
  }
  const loc=[],add=(id,name)=>{if(!past.some(p=>p.level===1&&p.id===id))loc.push({id,text:'可以去'+name+'再看看。'})};
  if(['closed','submitted','dead'].includes(campaign.case1?.state))return loc;
  const v=campaign.hotelCase?.v18,night=H18.active()||EXPLORE.night()||(v?.clockDay===campaign.day&&v?.flags?.['tonight:entered']);
  if(night||campaign.case1?.state==='report'||campaign.case1?.state==='due'){
   const inReport=['report','due'].includes(campaign.case1?.state);
   if((inReport||H18.cond(GAME_DATA.story.chapter1.scenes.room207.lock.open))&&((ROOMFILE.canInspect(campaign)&&!ROOMFILE.solved(campaign))||(ROOMFILE.motive(campaign)&&!known('KT05'))||(!inReport&&H18.active()&&!known('M12'))))add('room207','207号室');
   return loc;
  }
  if(campaign.hp<=0||campaign.san<=0||!campaign.firstDayComplete||campaign.day<2||campaign.day>6)return loc;
  for(const [code,[id,name]] of Object.entries(districts)){
   if(!TRAVEL.open(id))continue;
   const seen=campaign.visitedToday?.includes(id),fareRoute=TRAVEL.route(TRAVEL.where(),id);
   if(TRAVEL.where()!==id&&!fareRoute)continue;
   const fare=(fareRoute?TRAVEL.cost(fareRoute).fare:0)+(seen?0:GAME_CONFIG.travel.districtFirstVisitFare||0);
   if(campaign.cash<600+fare||(!seen&&campaign.actions<1))continue;
   const record=campaign.dayInvestigation?.stations?.[id],paid=record?.dayPaid?.[campaign.day],missing=n=>!known('DAY-'+code+'-0'+n);
   const canAskWorker=id!=='shimbashi'||known('C03')||known('C13');
   const unfinished=[3,4,5,6].some(missing)||canAskWorker&&(missing(1)||missing(2));
   const viable=unfinished&&(paid||campaign.actions>0)&&(!record||record.relation!=='拒绝交谈'||[3,4,5,6].some(missing));
   const npc={gotanda:'sato',shimbashi:'mori',ueno:'kobayashi'}[id],at=witnessOpportunity(id,npc);
   if(at||viable){const pending=[1,2].some(n=>!missing(n))&&(missing(1)||missing(2));loc.push({id,text:'可以去'+name+'再看看。',priority:at?3:pending?2:missing(1)||missing(2)?1:0})}
  }
  const sh='shibuya',route=TRAVEL.route(TRAVEL.where(),sh);
  if(TRAVEL.open(sh)&&route&&witnessOpportunity(sh,'tanaka')&&campaign.cash>=600+TRAVEL.cost(route).fare+(campaign.visitedToday?.includes(sh)?0:GAME_CONFIG.travel.districtFirstVisitFare||0)&&(campaign.actions>0||campaign.visitedToday?.includes(sh)))loc.push({id:sh,text:'可以去涩谷再看看。',priority:3});
  return loc.filter(x=>!past.some(p=>p.level===1&&p.id===x.id)).sort((a,b)=>b.priority-a.priority);
 }
 function witnessOpportunity(id,npc){return npc&&campaign.cityVisits?.calls?.[campaign.day+'-'+id]===true&&OUTINGS.availableQuestions(id).length>0}
 function choose(rows,grade,random){if(grade==='daikichi')return rows[0];if(grade==='kyo')return rows.at(-1);return rows[Math.floor(random()*rows.length)]}
 let testingGuide=false;
 function purchase(day,level){
  if(campaign.day!==day||level!==daily().length||level>=3)return '';
  const price=rates[level];if(campaign.cash<price)return '余额不足。本次未收取费用，也未消耗提醒次数。';
  const rows=optionsFor(level);if(rows.length<(level===2?2:1))return (level===2?'目前没有足够的线索可供排查。':'目前没有可提供的新'+levels[level]+'。')+'本次未收取费用，也未消耗提醒次数。';
  const g=guide(),entry={day,level,price,at:now()};if(level===2){
   const selected=[];while(selected.length<2){const r=rows.splice(Math.floor(Math.random()*rows.length),1)[0];selected.push({...r,name:clue(r.id).name})}
   entry.items=selected;for(const r of selected)g.reviews[r.id]={day,text:r.text};
  }else Object.assign(entry,choose(rows,window.OMI?.today()?.grade,Math.random));
  (g.days[day]??=[]).push(entry);campaign.cash-=price;save();
  if(!testingGuide){try{const written=JSON.parse(localStorage.getItem(campaignKey));if(written?.investigation?.guide?.days?.[day]?.[level]?.at?.day!==day||written.cash!==campaign.cash)throw Error()}catch{g.days[day].pop();for(const r of entry.items||[])delete g.reviews[r.id];campaign.cash+=price;return '未能保存本次提醒。已退回费用并保留次数。'}}return '';
 }
 function hintHtml(){const level=daily().length,history=Object.values(guide().days).flat().reverse();
  return '<section class="inv-hint"><h3>调查提醒 · DAY '+campaign.day+'</h3><p>方向提醒免费，地点提醒 ¥600，两条线索排查 ¥1,200。每天依次使用，不占行动。</p>'+(level<3?'<button class="survival-btn" data-request="'+level+'" data-day="'+campaign.day+'">'+levels[level]+' · '+(level?'¥'+rates[level]:'免费')+'</button>':'<p>今日三次提醒已用完。</p>')+'<p role="status">'+esc(message)+'</p><h3>提醒留档</h3>'+history.map(e=>'<article class="inv-ded"><small>DAY '+e.day+' · '+levels[e.level]+' · ¥'+e.price+'</small><p>'+esc(e.text||'')+'</p>'+(e.items||[]).map(x=>'<p><b>'+esc(x.name)+'</b> '+esc(x.text)+'</p>').join('')+'</article>').join('')+'</section>'
 }
 function verification(id){
  const s=st(),records=[],eids=new Set(),rules=GAME_DATA.d['investigation/verify'].rules.filter(r=>r.deduction===id);
  for(const r of rules)if(campaign.verify?.done?.[r.id]||campaign.hotelCase?.v18?.flags?.['vf:'+r.id]){records.push(r.source||'已完成当面求证');if(r.evidence&&s.evidence[r.evidence])eids.add(r.evidence)}
  for(const row of Object.values(s.dayVerify?.[id]||{}))records.push([row.status,row.detail].filter(Boolean).join(' · '));
  for(const [e,r] of Object.entries(s.evidence))if(r.confirmedBy?.includes(id))eids.add(e);
  if(id==='MD07'&&ROOMFILE.solved(campaign)&&s.evidence.E04)eids.add('E04');
  return {records:[...new Set(records)],eids:[...eids]}
 }
 const labels={sato:'佐藤美穂',mori:'森经理',inoue:'井上',tanaka:'田中震',kobayashi:'小林辰夫',takahashi:'高桥由美'};
 function met(n){const f=campaign.hotelCase?.v18?.flags||{};return f['met:'+n]||Object.values(campaign.verify?.done||{}).some(r=>r.npc===n)||(n==='tanaka'&&(f.tanakaMet||f['tn:met']||campaign.verify?.met))}
 function progressHtml(id,d){const {records,eids}=verification(id),people=(d.verify||[]).filter(met).map(n=>labels[n]).filter(Boolean);
  return '<small>已形成推论 · '+(eids.length?'已形成报告材料 '+eids.join('、'):records.length?'已经求证 · '+(Object.values(st().dayVerify?.[id]||{}).some(x=>x.status==='已证实')?'已有支持记录':'目前仍缺乏充分验证'):'尚待求证')+'</small>'+records.map(t=>'<small>'+esc(t)+'</small>').join('')+(people.length?'<small>可询问：'+esc(people.join('、'))+'</small>':'')}
 function reviewOf(id){const r=guide().reviews[id];return r?'<small>已排查 · DAY '+r.day+'：'+esc(r.text)+'</small>':''}
 function comboHistory(){return '<details><summary>组合历史 · 免费查看</summary>'+Object.entries(st().attempts||{}).reverse().filter(([k,a])=>pairMode==='all'||(pairMode==='ok'?a.success:pairMode==='no'?!a.success:false)).map(([k,a])=>'<article class="inv-ded"><b>'+k.split('+').map(id=>esc(clue(id)?.name||id)).join(' ＋ ')+'</b><small>'+tm(a.at)+' · '+'已分析，复查免费'+' · 首次'+(a.first==='unknown'?'结果未留存':a.first==='success'?'成功':'未建立推论')+'</small><small>'+esc(a.deduction&&ded(a.deduction)?.name||'')+(a.revalidated?' · 后续复查已更新':'')+(a.deduction&&verification(a.deduction).records.length?' · 已有求证记录':'')+'</small></article>').join('')+'</details>'}
 function selects(id,items,value){return '<select id="'+id+'">'+items.map(([k,v])=>'<option value="'+esc(k)+'" '+(value===k?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>'}
 function toolsHtml(){const places=[...new Set(Object.keys(st().clues).map(id=>clue(id)).filter(Boolean).map(sourceArea))];return '<label>线索范围 '+selects('inv-shelf',[['all','全部'],['star','已关注'],['todo','未排查'],['done','已排查']],shelf)+'</label> <label>来源地点 '+selects('inv-area',[['','全部来源'],...places.map(x=>[x,x])],area)+'</label>'}

 function lineItems(){const s=st();s.timeline??=[];return s.timeline.filter(p=>!!s.clues[p.id]&&!!clue(p.id))}
 function timelineHtml(){const items=lineItems(),s=st();const usable=Object.keys(s.clues).filter(id=>!!clue(id)&&!items.some(it=>it.id===id));return `<section class="inv-time-info"><p>这里是玩家自己构建的案件时间线，<b>不是系统公布的客观真相</b>。加入线索后可以调整顺序、填写事件时间、标记可靠程度。首次获取时间只在详情中展示，不能冒充事件发生时间。</p></section><div class="inv-timeline-add"><label>添加已发现线索<select id="inv-time-select"><option value="">选择一条线索</option>${usable.map(id=>`<option value="${id}">${esc(id+' · '+clue(id).name)}</option>`).join('')}</select></label><button class="survival-btn" type="button" id="inv-time-add" ${usable.length?'':'disabled'}>加入时间线</button></div>${items.length?`<ol class="inv-timeline-list">${items.map((p,i)=>`<li class="inv-time-card"><div class="inv-time-title"><small>${i+1} / ${p.id}</small><b>${esc(clue(p.id).name)}</b></div><p>${esc(clue(p.id).desc)}</p><div class="inv-time-fields"><label>事件时间（玩家填写）<input data-time-label="${p.id}" value="${esc(p.when||'')}" placeholder="例如：第3夜 02:13 / 日期待核"></label><label>当前判断<select data-time-trust="${p.id}"><option value="unknown" ${p.trust==='unknown'?'selected':''}>待核对</option><option value="record" ${p.trust==='record'?'selected':''}>记录可支持</option><option value="testimony" ${p.trust==='testimony'?'selected':''}>人物口述</option><option value="theory" ${p.trust==='theory'?'selected':''}>玩家假说</option></select></label></div><div class="inv-time-actions"><button class="line-chip" type="button" data-time-up="${p.id}" ${i===0?'disabled':''}>↑ 上移</button><button class="line-chip" type="button" data-time-down="${p.id}" ${i===items.length-1?'disabled':''}>↓ 下移</button><button class="line-chip" type="button" data-time-remove="${p.id}">移出</button></div></li>`).join('')}</ol>`:'<p class="survival-tip">还没有加入线索。建议先收集与时间有关的证言或记录，再自行排列。</p>'}`}
 function timeModify(id,kind,value){const arr=st().timeline??[];const i=arr.findIndex(p=>p.id===id);if(i<0)return;if(kind==='up'&&i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]];if(kind==='down'&&i<arr.length-1)[arr[i+1],arr[i]]=[arr[i],arr[i+1]];if(kind==='remove')arr.splice(i,1);if(kind==='when')arr[i].when=value.slice(0,90);if(kind==='trust')arr[i].trust=value;save()}

 const dev=()=>CHAPTER_DEV_BUILD&&new URLSearchParams(location.hash.slice(1)).get('dev')==='1';
 function unread(){if(!campaign)return 0;sync();const s=st();return Object.values(s.clues).filter(x=>!x.seen).length}
 const tm=a=>a?`DAY ${a.day} / ${esc(a.time||'')}`:'';
 /* v31：线索的「关联」人物，在最终报告的发现条件满足之前不显示真名（report.json 的 persons.discover） */
 const ABOUT_ID={'田中震':'tanaka','田中 震':'tanaka','片山 茂':'katayama','片山茂':'katayama','森正彦':'mori','森经理':'mori','小林 辰夫':'kobayashi','小林辰夫':'kobayashi','佐藤美穂':'sato','佐藤 美穂':'sato','高桥由美':'takahashi'};
 function aboutOf(c){if(!c||!c.about)return '';const pid=ABOUT_ID[c.about];if(!pid)return c.about;const p=((GAME_DATA.d['investigation/report']||{}).persons||[]).find(x=>x.id===pid);if(!p)return c.about;let ok=false;try{ok=!!(window.H18&&H18.cond(p.discover))}catch(e){}return ok?c.about:(p.unknownName||'尚未查明的人物')}
 function libHtml(){const s=st(),list=orderedClues();
  if(!list.length)return '<p class="survival-tip">当前筛选没有匹配的线索。可以切换主题、清空搜索或继续调查。</p>';
  return list.map(([id,r])=>{const c=clue(id);if(!c)return '';const op=open===id;
   return `<div class="inv-choice-card"><button type="button" class="inv-card${r.seen?'':' unread'}${op?' open':''}" data-search="${esc(c.name+' '+c.desc+' '+c.source)}" data-clue="${id}"><b>${r.seen?'':'<i class="inv-dot" aria-label="未读"></i>'}${esc(c.name)}</b>${op?`<p>${esc(c.desc)}</p><small>来源：${esc(c.source)}${aboutOf(c)?' · 关联：'+esc(aboutOf(c)):''}</small><small>获得：${tm(r.at)}</small>`:'<small>点一下查看</small>'}</button><button class="line-chip" data-star="${id}" aria-pressed="${!!r.star}">${r.star?'★ 已关注':'☆ 关注'}</button>${op?reviewOf(id):''}</div>`}).join('')}
 function ready(){const s=campaign&&campaign.investigation;return s?DD().filter(d=>!s.deductions?.[d.id]&&d.pair.every(id=>!!s.clues?.[id])):[]}
 function readyHtml(){return ''}
 function prepare(id){const d=st().deductions[id]&&ded(id);if(!d)return false;pick=d.pair.slice();tab='combo';result=null;page();app.querySelector('.inv-slots')?.scrollIntoView({block:'center'});app.querySelector('#inv-go')?.focus({preventScroll:true});return true}
 function comboHtml(){return (window.INV_TUT?INV_TUT.guideHtml():'')+comboHtml0()}
 function comboHtml0(){const s=st(),anchor=pick[0]||pick[1],list=orderedClues().filter(([id])=>{if(!anchor||pairMode==='all'||id===anchor)return true;const a=s.attempts?.[key(anchor,id)];return pairMode==='new'?!a:pairMode==='ok'?a?.success:a&&!a.success});
  const slot=i=>{const c=pick[i]&&clue(pick[i]);return `<button type="button" class="inv-slot${c?' on':''}" data-slot="${i}">${c?esc(c.name):(i?'第二条线索':'第一条线索')}${c?'<small>（点一下取消）</small>':''}</button>`};
  let res='';
  if(result){const R=result;
   if(R.kind==='new'||R.kind==='known')res=`<div class="inv-result"><small>${R.kind==='new'?'新推论':'该推论已记录'}</small><b>${esc(R.d.name)}</b><p>${esc(R.d.desc)}</p></div>`;
   else if(R.kind==='none')res=`<div class="inv-result inv-fail"><b>未能建立有效推论${R.again?'（这组已经试过，重复分析免费）':' · 已扣 ¥500'}</b><p>目前无法从这两份记录中得出可靠结论。分析结果已记录在调查手帐中。</p></div>`;
   else if(R.kind==='cash')res='<div class="inv-result"><p>首次分析需要¥500，当前余额不足。未扣费，未记录尝试。</p></div>';
   else if(R.kind==='same')res=`<div class="inv-result"><p>请选择两条不同的线索。</p></div>`;}
  return `<div class="inv-slots">${slot(0)}<span>＋</span>${slot(1)}</div><button type="button" class="survival-btn" id="inv-go" ${pick[0]&&pick[1]?'':'disabled'}>🧩 分析线索（每组首次¥500 · 失败也收费 · 重复免费）</button>${res}
   <label>组合范围 ${selects('inv-pairs',[['all','显示全部'],['new','尚未尝试'],['ok','已成功'],['no','已失败']],pairMode)}</label>${comboHistory()}<h3>已获得的线索</h3>${Object.keys(s.clues).length<2?'<p class="survival-tip">至少需要两条线索才能组合。</p>':''}<div class="inv-pickers">${list.map(([id])=>{const c=clue(id);const used=pick.includes(id);return c?`<div class="inv-choice-card"><button type="button" class="rpg-action inv-pick${used?' used':''}" data-pick="${id}" ${used?'disabled':''}>${esc(c.name)}</button><details><summary>查看原文</summary><p>${esc(c.desc)}</p><small>${esc(c.source||'')}</small>${reviewOf(id)}</details></div>`:''}).join('')}</div>`}
 function dedHtml(){const s=st(),rows=Object.entries(s.deductions).sort((a,b)=>(a[1].n||0)-(b[1].n||0));
  return rows.map(([id,r])=>{const d=ded(id);if(!d)return '';return '<article class="inv-ded"><b>'+esc(d.name)+'</b><p>'+esc(d.desc)+'</p>'+progressHtml(id,d)+'<details><summary>形成记录 · '+tm(r.at)+'</summary>'+(r.from||[]).filter(k=>s.clues[k]&&clue(k)).map(k=>'<p><b>'+esc(clue(k).name)+'</b>　'+esc(clue(k).desc)+'</p>').join('')+'</details>'+Object.entries(REPORT6.grounds).filter(([p,ids])=>ids.includes(id)&&met(p)).map(([p])=>'<button type="button" class="line-chip" data-hypothesis="'+p+'" '+(s.reportHypotheses?.[p]?'disabled':'')+'>'+(s.reportHypotheses?.[p]?'已记入手帐':'将此推论列为对'+REPORT6.names[p]+'的杀人嫌疑')+'</button>').join('')+'</article>'}).join('')||'<p>尚未形成推论。</p>'}
 function evHtml(){const s=st();return `<p class="survival-tip">展开材料可核对来源、保留或修改判断。</p><div class="inv-ev">${EV().map(e=>{const r=s.evidence[e.id];
  return r?`<div class="inv-evs on"><small>${e.id}</small><b>${esc(REPORT6.material(e).name)}</b><p>${esc(e.desc)}</p>${REPORT6.editor(REPORT6.material(e))}</div>`:''}).join('')}</div>`}
 function devHtml(){if(!dev())return '';return `<section class="rpg-panel inv-dev"><h3>🛠 开发者工具（只在 #dev=1 时显示）</h3><div class="inv-pickers">
   <button type="button" class="rpg-action" id="inv-guide-test">每日提醒与调查链隔离测试</button><pre id="inv-guide-log"></pre><button type="button" class="rpg-action" data-dev="all">获得全部测试线索</button><button type="button" class="rpg-action" data-dev="clear">清空线索 / 推论 / 证据</button>
   ${CL().map(c=>`<button type="button" class="rpg-action" data-dev="clue:${c.id}">线索 ${c.id}</button>`).join('')}${DD().map(d=>`<button type="button" class="rpg-action" data-dev="ded:${d.id}">推论 ${d.id}</button>`).join('')}${EV().map(e=>`<button type="button" class="rpg-action" data-dev="ev:${e.id}">报告材料 ${e.id}</button>`).join('')}
   <button type="button" class="rpg-action" data-dev="reload">保存并重新载入（检查存档）</button></div>${window.VERIFY?VERIFY.devHtml():''}${window.CASE5?CASE5.devHtml():''}</section>`}
  /* ---------- v41：调查手帐风格（电脑：左页线索 / 右页合成；手机：单页翻页） ---------- */
  let nbMore=false,nbNew=null,nbTop=false,nbLastTab=null;
  const NBC={room:'#b23a2e',people:'#2f5e8c',money:'#9a7a3a',clock:'#5f7d4f',other:'#6b5843'};
  const NBT={all:'全部',room:'207号室',people:'人物',money:'金钱',clock:'时间',other:'其他'};
  const NBTAB={lib:['线索','#3a3a4a'],combo:['合成','#b23a2e'],hint:['提醒','#5f7d4f'],time:['时间线','#4f6f6a'],rel:['关系网','#8a2a22'],ded:['推论','#2f5e8c'],ev:['报告','#c9831f'],raw:['原始','#7a5a8a']};
  const nbMobile=()=>{try{return matchMedia('(max-width:720px)').matches}catch(e){return false}};
  function nbHash(id){let h=7;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h)}
  const nbRot=id=>((nbHash(id)%29)-14)/10;
  function nbKind(c){const t=(c.name||'')+' '+(c.source||'');
   if(/照片|相片|毕业照|合影|写真|剪报/.test(t))return 'photo';
   if(/笔记|手帐|手帳|日记|信件|便笺|字条/.test(t))return 'book';
   if(/证词|说法|传闻|口述|回忆|电话|短信|说：/.test(t))return 'note';
   if(/登记|簿|记录|单|表|账|名单|收据|票|确认|邮件/.test(t))return 'lined';
   return 'plain'}
  const NUM=['①','②'];
  function nbTags(id){return '<span class="nb-tags">'+tags(id).map(t=>'<em style="color:'+NBC[t]+'">'+NBT[t]+'</em>').join('')+'</span>'}
  const nbT=id=>!!(window.TAINT&&TAINT.is(id));
  const nbDesc=(c)=>nbT(c.id)?TAINT.garble(c.desc,c.id):c.desc;
  function nbScrap(id,r,mode){const c=clue(id);if(!c)return '';const k=nbKind(c);const tn=nbT(id);
   if(tn&&mode==='pick'&&!pick.includes(id))return '<div class="nb-scrap k-'+k+' tainted" style="--r:'+nbRot(id)+'deg"><i class="nb-tape" aria-hidden="true"></i><button type="button" class="nb-scrap-btn" disabled aria-disabled="true"><small class="nb-src">'+esc(c.source||'')+'</small><b>'+esc(c.name)+'</b><span class="nb-taint-tag">🩸 被污染 · 无法合成</span></button></div>';
   const n=mode==='pick'?pick.indexOf(id)+1:0,sel=mode==='lib'&&open===id;
   const act=mode==='pick'?(n?'data-slot="'+(n-1)+'" aria-pressed="true" title="点一下取下"':'data-pick="'+id+'" class="inv-pick"'):'data-clue="'+id+'" aria-expanded="'+sel+'"';
   return '<div class="nb-scrap k-'+k+(n||sel?' on':'')+(r.seen?'':' unread')+(tn?' tainted':'')+(window.SUSP&&id===SUSP.mark()?' nb-susp-mark':'')+'" style="--r:'+nbRot(id)+'deg">'+(r.seen?'<i class="nb-tape" aria-hidden="true"></i>':'<i class="nb-pin" aria-label="未读"></i>')+
    '<button type="button" class="nb-scrap-btn'+(mode==='pick'&&!n?' inv-pick':'')+'" '+act.replace(' class="inv-pick"','')+'>'+(k==='photo'?'<span class="nb-photo" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>':'')+
    '<small class="nb-src">'+esc(c.source||'')+'</small><b>'+esc(c.name)+'</b>'+(tn?'<span class="nb-taint-tag">🩸 被污染</span>':nbTags(id))+'</button>'+
    (n?'<span class="nb-num" aria-hidden="true">'+NUM[n-1]+'</span>':'')+
    (mode==='lib'?'<button type="button" class="nb-star" data-star="'+id+'" aria-pressed="'+!!r.star+'" aria-label="'+(r.star?'取消关注':'关注')+'">'+(r.star?'★':'☆')+'</button>':
     '<details class="nb-raw"><summary>原文</summary><p>'+esc(nbDesc(c))+'</p>'+reviewOf(id)+'</details>')+'</div>'}
  function nbFilters(mode){const s=st();
   return '<nav class="nb-flags" aria-label="主题">'+BOARDS.map(([k])=>{const n=Object.keys(s.clues).filter(id=>k==='all'||tags(id).includes(k)).length;return '<button type="button" data-topic="'+k+'" aria-pressed="'+(topic===k)+'" style="--c:'+(k==='all'?'#2b2118':NBC[k])+'">'+NBT[k]+' <small>'+n+'</small></button>'}).join('')+'</nav>'+
    '<div class="nb-tools"><label class="nb-search"><span aria-hidden="true">✎</span><input id="inv-search" type="search" placeholder="找人物、地点、关键词……" value="'+esc(query)+'" aria-label="查找线索"></label>'+
    '<label class="nb-check"><input id="inv-unread" type="checkbox" '+(onlyUnread?'checked':'')+'> 只看未读</label></div>'+
    '<details class="nb-more-filter"><summary>更多筛选</summary><div class="nb-tools2">'+toolsHtml()+'<label>排序<select id="inv-sort"><option value="found" '+(clueSort==='found'?'selected':'')+'>发现顺序</option><option value="newest" '+(clueSort==='newest'?'selected':'')+'>最近获得</option></select></label>'+
    (mode==='combo'?'<label>组合范围 '+selects('inv-pairs',[['all','显示全部'],['new','尚未尝试'],['ok','已成功'],['no','已失败']],pairMode)+'</label>':'')+
    '</div><p class="nb-note">主题可交叉归类，同一条线索可能出现在几个栏目里。分类只是整理方式，不暗示哪两条一定能合成。</p></details>'}
  function nbPickList(){const s=st(),anchor=pick[0]||pick[1];return orderedClues().filter(([id])=>{if(!anchor||pairMode==='all'||id===anchor)return true;const a=s.attempts?.[key(anchor,id)];return pairMode==='new'?!a:pairMode==='ok'?a?.success:a&&!a.success})}
  function nbGrid(rows,mode){if(!rows.length)return '<p class="nb-empty nb-hand">'+(Object.keys(st().clues).length?'这一栏没有对得上的线索。换个主题，或者清空搜索。':'手帐还是空的。去和人聊聊、到处看看吧。')+'</p>';
   return '<div class="nb-grid">'+rows.map(([id,r])=>nbScrap(id,r,mode)).join('')+'</div>'}
  function nbStatus(id){const v=verification(id);return v.eids.length?['已证实','green']:v.records.length?['已求证','blue']:['待求证','blue']}
  function nbAsk(d){const ppl=(d.verify||[]).filter(met).map(n=>labels[n]).filter(Boolean);
   return '<p class="nb-hand nb-ask">→ '+(ppl.length?'拿去问 <u>'+esc(ppl.join('、'))+'</u>':'想想谁能证实这件事')+'</p>'}
  function nbRecent(n){const s=st(),rows=Object.entries(s.deductions).sort((a,b)=>(b[1].n||0)-(a[1].n||0)).slice(0,n);
   if(!rows.length)return '<p class="nb-empty nb-hand">还没有想通的事。</p>';
   return '<ul class="nb-list">'+rows.map(([id])=>{const d=ded(id);if(!d)return '';const [t,c]=nbStatus(id);return '<li><span>'+esc(d.name)+'</span><span class="nb-stamp '+c+'">'+t+'</span></li>'}).join('')+'</ul><button type="button" class="nb-link" data-tab="ded">全部推论 →</button>'}
  function nbTally(n){const g=['','一','丅','下','止','正'];let out='';for(let i=0;i<Math.floor(n/5);i++)out+='正';return out+(g[n%5]||'')||'·'}
  function nbProgress(){const n=Object.keys(st().evidence).length;return '<div class="nb-progress"><span class="nb-hand">报告材料</span><span class="nb-hand nb-tally" aria-hidden="true">'+nbTally(n)+'</span><span class="nb-mono">'+n+' / 12</span></div>'}
  function nbResult(){const R=result;if(!R)return '';
   if(R.kind==='new'||R.kind==='known')return '<article class="nb-card nb-result"><span class="nb-stamp '+(R.kind==='new'?'blue':'gray')+'">'+(R.kind==='new'?'新推论':'已记过')+'</span><small class="nb-src">'+(R.d.pair||[]).map(id=>esc(clue(id)?.name||id)).join(' ＋ ')+'</small><b>'+esc(R.d.name)+'</b><p>'+esc(R.d.desc)+'</p>'+nbAsk(R.d)+'<button type="button" class="nb-link" data-tab="ded">📖 翻到推论页</button></article>';
   if(R.kind==='none')return '<article class="nb-card nb-fail"><span class="nb-stamp red">想不通</span><b>未能建立有效推论'+(R.again?'（这组已经试过，重复分析免费）':' · 已扣 ¥500')+'</b><p>目前无法从这两份记录中得出可靠结论。分析结果已记录在调查手帐中。</p></article>';
   if(R.kind==='tainted')return '<article class="nb-card nb-fail"><span class="nb-stamp red">污染</span><b>🩸 无法合成</b><p>「'+(R.ids||[]).map(id=>esc(clue(id)?.name||id)).join('」「')+'」被污染了，字迹认不清，拼不出任何东西。先去净化。本次不收费。</p></article>';
   if(R.kind==='cash')return '<p class="nb-warn">首次分析需要 ¥500，当前余额不足。未扣费，未记录尝试。</p>';
   if(R.kind==='same')return '<p class="nb-warn">请选择两条不同的线索。</p>';return ''}
  function nbSlots(){const sl=i=>{const c=pick[i]&&clue(pick[i]);return c?
    '<button type="button" class="inv-slot nb-slot on" data-slot="'+i+'" style="--r:'+(i?2:-2)+'deg"><span class="nb-hand nb-red">'+NUM[i]+'</span><b>'+esc(c.name)+'</b><small class="nb-src">'+esc(c.source||'')+'</small><i class="nb-x" aria-label="取下">×</i></button>':
    '<button type="button" class="inv-slot nb-slot" data-slot="'+i+'" style="--r:'+(i?2:-2)+'deg"><span class="nb-hand nb-red">'+NUM[i]+'</span><span class="nb-hand nb-dim">'+(pick[1-i]?'再挑一张贴上来':'从线索里挑一张')+'</span></button>'};
   return '<div class="inv-slots nb-slots">'+sl(0)+'<div class="nb-mid" aria-hidden="true">'+(pick[0]&&pick[1]?'<svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 22 C 30 0, 70 42, 100 18"/></svg><span class="nb-hand">？</span>':'<span class="nb-hand">＋</span>')+'</div>'+sl(1)+'</div>'}
  function nbDetail(id){const s=st(),r=s.clues[id],c=clue(id);if(!r||!c)return '';
   return '<article class="nb-card nb-detail k-'+nbKind(c)+(nbT(id)?' tainted':'')+'"><small class="nb-src">'+esc(c.source||'')+'</small><h2>'+esc(c.name)+'</h2>'+nbTags(id)+'<p>'+esc(nbDesc(c))+'</p>'+(nbT(id)?'<p class="nb-warn">🩸 这一页被污染了，字迹认不清，也无法拿去合成。每隔一天，污染还会爬到相邻的线索上。<br>去浅草寺（一次 5 条 · ¥1000）、新桥的街头占卜师或街头驱魔人（一次 3 条 · ¥800）净化。</p>':'')+'<p class="nb-meta">'+(aboutOf(c)?'关联：'+esc(aboutOf(c))+' · ':'')+'获得：'+tm(r.at)+'</p>'+reviewOf(id)+
    '<div class="nb-row"><button type="button" class="nb-link" data-star="'+id+'" aria-pressed="'+!!r.star+'">'+(r.star?'★ 已关注':'☆ 关注')+'</button><button type="button" class="nb-link" data-nbuse="'+id+'">🧩 拿去合成</button><button type="button" class="nb-link" data-clue="'+id+'">收起</button></div></article>'}
  function nbWhisper(){if(!campaign||campaign.san>=70)return '';const w=['207に、まだ誰かいる','水の音がする','このページ、さっきもめくった？'];return '<div class="nb-ink" aria-hidden="true"><svg viewBox="0 0 150 120"><path d="M30 70 C 10 40, 50 18, 80 30 C 110 10, 140 40, 122 66 C 146 84, 120 112, 92 98 C 70 118, 30 108, 36 88 C 10 92, 8 76, 30 70 Z"/><path d="M40 96 C 30 110, 18 112, 10 118" fill="none" stroke-width="2.5"/><ellipse class="w" cx="78" cy="64" rx="14" ry="8"/><ellipse class="p" cx="78" cy="64" rx="4" ry="7"/></svg><span class="nb-hand">'+w[campaign.day%w.length]+'</span></div>'}
  function nbIndex(tabs,un){const btn=([k,n,c])=>'<button type="button" data-tab="'+k+'" aria-pressed="'+(tab===k)+'" style="--c:'+NBTAB[k][1]+'">'+NBTAB[k][0]+(k==='combo'?'<small>¥500/组</small>':c!==''?'<small>'+c+'</small>':'<small>&nbsp;</small>')+(k==='lib'&&un?'<i class="inv-dot" aria-label="有未读线索"></i>':'')+'</button>';
   const main=['lib','combo','ded','ev'],more=tabs.filter(t=>!main.includes(t[0]));
   return '<nav class="nb-idx" aria-label="手帐索引">'+tabs.map(btn).join('')+'</nav>'+
    '<nav class="nb-bottom'+(nbMore?' more':'')+'" aria-label="手帐索引">'+tabs.filter(t=>main.includes(t[0])).map(btn).join('')+'<button type="button" data-nbmore aria-expanded="'+nbMore+'" style="--c:#6b5843"'+(more.some(t=>t[0]===tab)?' aria-pressed="true"':'')+'>更多<small>···</small></button>'+
    (nbMore?'<div class="nb-pop">'+more.map(btn).join('')+'</div>':'')+'</nav>'}
  function nbHead(left,title,sub,pg){return '<div class="nb-kicker nb-mono"><span>'+left+'</span><span>p.'+pg+'</span></div><h2 class="nb-title nb-hand">'+title+(sub?' <small>'+sub+'</small>':'')+'</h2>'}
  function nbBody(tabs,un,frozen){const s=st(),day='DAY '+campaign.day+' · ¥'+(campaign.cash||0).toLocaleString(),pg=7+Object.keys(s.deductions).length%9;
   let L='',R='',wide='';
   if(tab==='lib'){
    const tc=window.TAINT?TAINT.count():0,tb=tc?'<p class="nb-taint-bar">🩸 '+tc+' 条线索被污染 · 浅草寺 5 条 ¥1000 · 占卜师 / 驱魔人 3 条 ¥800</p>':'';
    L=nbHead('CASE FILE 001 · 线索','我找到的东西',Object.values(s.clues).some(r=>!r.seen)?'<span class="nb-red">● = 还没细看</span>':'',pg)+(window.SUSP?SUSP.noteHtml('m'):'')+tb+nbFilters('lib')+nbGrid(orderedClues(),'lib')+V51ADD.prologueNotes();
    R=nbHead(day,open&&s.clues[open]?'细看':'怎么用这本手帐','',pg+1)+(open&&s.clues[open]?nbDetail(open):(window.SUSP?SUSP.noteHtml('d'):'')+(window.INV_TUT?INV_TUT.guideHtml():'')+'<p class="nb-hand nb-dim">← 点左页的纸片，在这里细看。</p><h3 class="nb-h nb-hand">最近想通的事</h3>'+nbRecent(3))+nbProgress()+nbWhisper();
   }else if(tab==='combo'){
    L=nbHead('CASE FILE 001 · 线索','挑两张放在一起',Object.keys(s.clues).length<2?'<span class="nb-red">至少需要两条线索</span>':'',pg)+(window.TAINT&&TAINT.count()?'<p class="nb-taint-bar">🩸 '+TAINT.count()+' 条线索被污染，无法合成 · 浅草寺 5 条 ¥1000 · 占卜师 / 驱魔人 3 条 ¥800</p>':'')+nbFilters('combo')+nbGrid(nbPickList(),'pick');
    R=nbHead(day,'把两件事放在一起想','',pg+1)+(window.INV_TUT?INV_TUT.guideHtml():'')+nbSlots()+
     '<div class="nb-go-row"><button type="button" class="nb-stamp-btn" id="inv-go" '+(pick[0]&&pick[1]?'':'disabled')+'>分析 ¥'+GAME_CONFIG.investigation.combineFee+'／组</button><p class="nb-fee">每组第一次 <b>¥500</b>，失败也收<br>合过的组免费重看</p></div>'+nbResult()+
     '<h3 class="nb-h nb-hand">推论</h3>'+nbRecent(3)+comboHistory()+nbProgress()+nbWhisper();
   }else{
    const T={hint:'今天该查什么',time:'我排的时间线',rel:'人物关系网',ded:'想通了的事',ev:'报告材料',raw:'原始记录'}[tab]||'';
    let inner=tab==='rel'&&window.RELNET?RELNET.html({met,clues:Object.keys(s.clues).map(id=>[id,clue(id)?.name]).filter(x=>x[1])}):tab==='hint'?(window.SUSP?SUSP.panelHtml():'')+hintHtml():tab==='time'?timelineHtml():tab==='ded'?dedHtml():tab==='ev'?evHtml()+(frozen?'<h3>已提交报告留底</h3>'+frozen.map(e=>'<article><b>'+esc(e.id+' '+e.name)+'</b>'+CASE_NOTES.sourceSummary(e)+CASE_NOTES.sourceRows(e)+'<p>我的判断：'+esc(e.interpretation)+'</p></article>').join(''):''):UI.reasoningRecords();
    if(tab==='ded'&&nbNew&&ded(nbNew)){const d=ded(nbNew);inner='<article class="nb-card nb-result"><span class="nb-stamp blue">新推论</span><small class="nb-src">'+(d.pair||[]).map(id=>esc(clue(id)?.name||id)).join(' ＋ ')+'</small><b>'+esc(d.name)+'</b><p>'+esc(d.desc)+'</p>'+nbAsk(d)+'</article><h3 class="nb-h nb-hand">之前的</h3>'+inner}
    wide=nbHead(day+' · CASE FILE 001',T,tab==='ded'?'推论要拿去问对的人，才会变成报告材料。':tab==='rel'?'给自己整理思路用：连错没有代价，这里也不判断对错。':'',pg)+'<div class="nb-wide-body">'+inner+'</div>'+(tab==='ded'?nbProgress():'');
   }
   return '<div class="nb nb-t-'+tab+'">'+nbIndex(tabs,un)+(wide?'<div class="nb-spread nb-one"><section class="nb-page nb-wide">'+wide+'</section></div>':
    '<div class="nb-spread"><section class="nb-page nb-left">'+L+'</section><section class="nb-page nb-right'+(tab==='lib'&&!(open&&s.clues[open])?' nb-r-empty':'')+'">'+R+'</section></div>')+(wide?nbWhisper():'')+'<p><button type="button" class="rpg-action" id="v51-language-notes">语言笔记</button></p></div>'}
  function nbFont(){if(document.getElementById('nb-font'))return;try{const l=document.createElement('link');l.id='nb-font';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;700&display=swap';document.head.appendChild(l)}catch(e){}}
  function nbBind(){
   app.querySelectorAll('[data-nbmore]').forEach(b=>b.onclick=()=>{nbMore=!nbMore;page()});
   app.querySelectorAll('[data-nbuse]').forEach(b=>b.onclick=()=>{const id=b.dataset.nbuse;tab='combo';result=null;if(!pick.includes(id)){if(!pick[0])pick[0]=id;else if(!pick[1])pick[1]=id;else pick=[id,null]}nbTop=true;page()});
  }
 function page(){
  if(!campaign)return;sync();const s=st();
  if(tab==='lib'&&open&&s.clues[open]&&!s.clues[open].seen){s.clues[open].seen=true}
  save();
  const frozen=campaign.case1?.report?.materials?.map(ROOMFILE.archived);
  const tabs=[['lib','线索库',Object.keys(s.clues).filter(id=>CL().some(c=>c.id===id)).length],['combo','线索合成',''],['hint','每日调查提醒',''],['time','时间线板',lineItems().length],['rel','人物关系网',window.RELNET?RELNET.count():0],['ded','推论记录',Object.keys(s.deductions).length],['ev','报告材料',Object.keys(s.evidence).length+'/12'],['raw','原始记录','']];
  const un=Object.values(s.clues).filter(x=>!x.seen).length;
   nbFont();const keepY=(!nbTop&&nbLastTab===tab)?window.scrollY:0;nbLastTab=tab;nbTop=false;
   UI.page('investigation','推理','DEDUCTION · CASE 001',nbBody(tabs,un,frozen)+(window.CASE5&&CASE5.dayNo()===6&&CASE5.state()&&CASE5.state().state==='active'?'<section class="rpg-panel"><button type="button" class="survival-btn" id="reasoning-final-review">DAY 6 · 最终复核 / 提交报告</button></section>':'')+devHtml());
   if(keepY)window.scrollTo(0,keepY);
  const bk=app.querySelector('#et-back');if(bk)bk.onclick=()=>UI.back();const fr=app.querySelector('#reasoning-final-review');if(fr&&window.CASE5)fr.onclick=()=>CASE5.reviewPage();
  REPORT6.bindMaterials(page);
  app.querySelector('#v51-language-notes').onclick=()=>V51ADD.openNotes();
  app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;result=null;nbMore=false;nbNew=null;page()});
  app.querySelectorAll('[data-clue]').forEach(b=>b.onclick=()=>{open=open===b.dataset.clue?null:b.dataset.clue;if(open&&nbMobile())nbTop=true;page()});
  app.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const id=b.dataset.pick;if(pick.includes(id))return;if(!pick[0])pick[0]=id;else if(!pick[1])pick[1]=id;else pick=[pick[0],id];result=null;if(pick[0]&&pick[1]&&nbMobile())nbTop=true;page()});
  app.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{pick[+b.dataset.slot]=null;result=null;page()});
  
  app.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{topic=b.dataset.topic;open=null;page()});
  const search=app.querySelector('#inv-search');if(search)search.oninput=()=>{query=search.value;const at=search.selectionStart;page();const next=app.querySelector('#inv-search');next?.focus();try{next?.setSelectionRange(at,at)}catch(e){}};
  const sort=app.querySelector('#inv-sort');if(sort)sort.onchange=()=>{clueSort=sort.value;page()};
  const unreadOnly=app.querySelector('#inv-unread');if(unreadOnly)unreadOnly.onchange=()=>{onlyUnread=unreadOnly.checked;page()};
  const buy=app.querySelector('[data-request]');if(buy)buy.onclick=()=>{const level=+buy.dataset.request,day=+buy.dataset.day;const finish=()=>{message=purchase(day,level);page()};if(level)UI.confirm('使用'+levels[level]+'？','费用 ¥'+rates[level]+'。只有取得有效结果才会扣费。',finish);else finish()};
  app.querySelectorAll('[data-star]').forEach(b=>b.onclick=()=>{const r=s.clues[b.dataset.star];if(r){r.star=!r.star;save();page()}});
  for(const [id,change] of [['inv-shelf',v=>shelf=v],['inv-area',v=>area=v],['inv-pairs',v=>pairMode=v]]){const el=app.querySelector('#'+id);if(el)el.onchange=()=>{change(el.value);page()}}
  const probe=app.querySelector('#inv-guide-test');if(probe)probe.onclick=()=>{app.querySelector('#inv-guide-log').textContent=guideAudit()};
  const addTime=app.querySelector('#inv-time-add');if(addTime)addTime.onclick=()=>{const id=app.querySelector('#inv-time-select')?.value;if(id&&st().clues[id]&&!lineItems().some(x=>x.id===id)){st().timeline??=[];st().timeline.push({id,when:'',trust:'unknown'});save();page()}};
  for(const kind of ['up','down','remove'])app.querySelectorAll('[data-time-'+kind+']').forEach(b=>b.onclick=()=>{timeModify(b.dataset['time'+kind[0].toUpperCase()+kind.slice(1)],kind);page()});
  app.querySelectorAll('[data-time-label]').forEach(b=>b.onchange=()=>{timeModify(b.dataset.timeLabel,'when',b.value)});
  app.querySelectorAll('[data-time-trust]').forEach(b=>b.onchange=()=>{timeModify(b.dataset.timeTrust,'trust',b.value)});

  nbBind();if(tab==='rel'&&window.RELNET)RELNET.bind(app);
  const tut=app.querySelector('#inv-tutorial');if(tut&&window.INV_TUT)tut.onclick=()=>INV_TUT.open();
  if(window.INV_TUT&&tab==='combo')INV_TUT.firstPrompt();
  const go=app.querySelector('#inv-go');if(go)go.onclick=()=>{result=combine(pick[0],pick[1]);if(result&&result.kind==='new'&&nbMobile()){nbNew=result.d.id;tab='ded';nbTop=true}page();if(window.SATO)SATO.maybeScene();if(window.TANAKA)TANAKA.maybeScene()};
  app.querySelectorAll('[data-hypothesis]').forEach(b=>b.onclick=()=>{const p=b.dataset.hypothesis;if(!REPORT6.state(campaign).possible.includes(p))return;s.reportHypotheses??={};s.reportHypotheses[p]=true;save();page()});
  if(window.VERIFY)VERIFY.devBind();if(window.CASE5)CASE5.devBind();
  app.querySelectorAll('[data-dev]').forEach(b=>b.onclick=()=>{const [a,id]=b.dataset.dev.split(':');const s=st();
   if(a==='all'){delete s.devCleared;CL().forEach(c=>addClue(c.id,true))}
   if(a==='clear'){s.clues={};s.deductions={};s.evidence={};s.n=0;s.dn=0;pick=[null,null];result=null;s.devCleared=true}
   if(a==='clue')addClue(id,true);
   if(a==='ded'){const d=ded(id);if(d&&!s.deductions[id]){d.pair.forEach(c=>addClue(c,true));s.deductions[id]={at:now(),from:d.pair.slice().sort(),n:++s.dn}}}
   if(a==='ev')grantEvidence(id,'开发者测试');
   save();if(a==='reload'){location.reload();return}page()});
 }
 /* 开发者模式：#dev=1 打开、#dev=0 关闭 */
 /* 档案 FILE 03 里的入口（85-ui-shell.js 的 archivePage 调用） */
 function entry(){if(!campaign)return '';const had=!!campaign.investigation;if(sync()||!had)save();const n=unread();const s=st();
  return `<div class="inv-entry"><button type="button" class="survival-btn" id="inv-open">🧩 推理${n?` <i class="inv-dot" aria-label="有未读线索"></i>`:''}</button><small>线索 ${Object.keys(s.clues).filter(id=>CL().some(c=>c.id===id)).length} · 推论 ${Object.keys(s.deductions).length} · 报告材料 ${Object.keys(s.evidence).length}/12</small></div>`}
 function bindEntry(){const b=app.querySelector('#inv-open');if(b)b.onclick=()=>{_reset();page()}}
 function _reset(){if(window.RELNET)RELNET.reset();nbMore=false;nbNew=null;nbTop=true;tab='lib';pick=[null,null];result=null;open=null;topic='all';query='';onlyUnread=false;clueSort='found';shelf='all';area='';pairMode='all';message=''}
 function hookSave(){if(typeof campaignSave!=='function'||baseSave)return;baseSave=campaignSave;campaignSave=function(){const r=baseSave.apply(this,arguments);try{if(campaign&&(campaign.investigation||campaign.hotelCase||campaign.prologue)){if(sync())baseSave()}}catch(e){}return r}}
 hookSave();
 return {ready,readyHtml,prepare,sync,combine,addClue,grantEvidence,verifyTargets,page,unread,state:()=>campaign&&campaign.investigation,
  clues:()=>CL(),deductions:()=>DD(),evidence:()=>EV(),dev,entry,bindEntry,_reset,_t:{camp:()=>campaign,save:()=>campaignSave()},tab:t=>{tab=t}};
})();
window.INV=INV;
