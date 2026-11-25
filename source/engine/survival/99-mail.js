/* ==== engine/survival/99-mail.js ==== */
/* ===================================================================
   【v22.7 邮件】底部导航「✉ 邮件」：随时重看收到的邮件。
   - 邮件列表与收件条件：story/mail.json（开幕序章里的邮件用 source 直接引用 story/opening.json，文字只写一遍）
   - 是否收到由当前进度决定（不额外记录），所以旧存档打开也能看到已经收到的邮件。
   - 已读记录：存档 campaign.mailRead = { 邮件id: true }（旧存档自动补上）。没读的邮件在导航上显示红点。
   =================================================================== */
const MAIL=(function(){
 const D=()=>GAME_DATA.story.mail||{mails:[]};
 const OP=()=>GAME_DATA.story.opening||{};
 function fill(t){return String(t??'').replace(/\{name\}/g,(campaign&&campaign.name)||'调查员')}
 function opIdx(id){return (OP().scenes||[]).findIndex(s=>s.id===id)}
 /* 序章里是否已经过了「抵达东京」（没播放序章的存档视为已经抵达） */
 function arrived(){const o=campaign&&campaign.opening;if(!o)return true;return !!o.done||o.scene>opIdx('arrival')}
 function prologueSeen(scene){const p=campaign&&campaign.prologue;return !!(p&&(p.done||(p.flags&&p.flags['seen:'+scene])))}
 function cond(w){
  if(!campaign)return false;w=w||{};
  if(w.arrived&&!arrived())return false;
  if(w.caseCover&&!campaign.caseCover)return false;
  if(w.prologueSeen&&!prologueSeen(w.prologueSeen))return false;
  if(w.clientKnown&&!(window.CASE&&CASE.clientKnown()))return false;
  if(w.flag&&!(window.H18&&H18.flag(w.flag)))return false;
  if(w.rulesGot&&!(window.FILES&&FILES.has()))return false; // v24.1：拿到《东京生存守则》以后
  return true;
 }
 /* v27：其他模块提供的邮件（例如 96r-verify.js 给田中震写的信和他的回信）：MAIL.extend({mails:()=>[…], top:()=>'收件箱上方的按钮', bind:()=>{}}) */
 const EXT=[];function extend(o){EXT.push(o)}
 function list(){return (D().mails||[]).filter(m=>cond(m.when)).concat(...EXT.map(e=>{try{return e.mails?e.mails():[]}catch(x){return []}}))}
 function read(){campaign.mailRead??={};return campaign.mailRead}
 /* v24.1：附件（attach）——邮件里显示随进度变化的内容。rules=《东京生存守则》（解锁新规则后这封邮件重新变成未读）；caseFile=CASE NO. 001 委托档案（委托人、住宿费用的最新状态） */
 const ATTACH={rules:()=>window.FILES?FILES.rulesSection():'',caseFile:()=>typeof caseFile==='function'?caseFile():''};
 function version(m){if(m.attach==='rules'&&window.FILES){const f=FILES.F();return 'r'+Object.keys((f&&f.unlocked)||{}).length}return true}
 function isRead(m){const r=read();return r[m.id]===version(m)||(version(m)===true&&!!r[m.id])}
 function deleted(m){const t=campaign?.mailTrash?.[m.id];return !!t&&t.version===version(m)}
 function remove(id){const m=list().find(m=>m.id===id);if(!m)return false;campaign.mailTrash??={};campaign.mailTrash[id]={version:version(m),day:campaign.day};campaignSave();badge();return true}
 function restore(id){if(!campaign?.mailTrash?.[id])return false;delete campaign.mailTrash[id];campaignSave();badge();return true}
 function unread(){if(!campaign)return 0;return list().filter(m=>!deleted(m)&&!isRead(m)).length}
 /* 正文：lines + 引用序章页面 + 委托人资料 */
 function lines(m){
  const out=[];
  if(m.source&&m.source.opening){
   const sc=(OP().scenes||[]).find(s=>s.id===m.source.opening);
   ((sc&&sc.pages)||[]).forEach((pg,i)=>{
    if(m.source.skipFirst&&i===0)return;
    if(pg.type)return;
    if(m.source.style&&(pg.style||sc.style)!==m.source.style)return;
    if(pg.route&&campaign&&campaign.birth!==pg.route)return;
    if(out.length&&!(pg.lines||[]).every(l=>l&&l.msg))out.push({gap:true});
    (pg.lines||[]).forEach(l=>{if(l&&l.sys&&/^▶/.test(l.sys))return;out.push(l)});
   });
  }
  (m.lines||[]).forEach(l=>out.push(l));
  return out;
 }
 function lineHtml(l){
  if(typeof l==='string')return `<p>${esc(fill(l))}</p>`;
  if(!l)return '';
  if(l.gap)return '<div class="mail-gap"></div>';
  if(l.red)return `<p class="mail-red">${esc(fill(l.red))}</p>`;
  if(l.sys)return `<p class="mail-sys">${esc(fill(l.sys))}</p>`;
  if(l.msg)return `<div class="mail-msg"><span>${esc(fill(l.msg))}</span></div>`;
  if(l.jp){const zh=l.zh&&!l.lockTranslate?(typeof langMode==='function'&&langMode()==='learning'?trToggle(fill(l.zh)):esc(fill(l.zh))):'';return `<p class="mail-jp"><span lang="ja" translate="no">${esc(fill(l.jp))}</span>${zh?`<small>${zh}</small>`:''}</p>`}
  return '';
 }
 function rowsHtml(m){
  if(m.rows!=='caseRevealed')return '';
  const R=(OP().caseFile||{}).revealed||[];
  return `<div class="et-grid mail-rows">${R.map(r=>`<div><small>${esc(r[0])}</small><b>${esc(r[1])}</b></div>`).join('')}</div>`;
 }
 function page(open,folder='inbox'){
  if(!campaign)return;const all=list().slice().reverse(),r=read();const cur=open&&all.find(m=>m.id===open);
  if(cur&&deleted(cur))folder='trash';const trashed=folder==='trash',ms=all.filter(m=>deleted(m)===trashed);
  if(cur&&!isRead(cur)){r[cur.id]=version(cur);campaignSave()}
  const folders=`<nav class="mail-folders" aria-label="邮件文件夹"><button type="button" data-mail-folder="inbox" aria-pressed="${!trashed}">收件箱 ${all.filter(m=>!deleted(m)).length}</button><button type="button" data-mail-folder="trash" aria-pressed="${trashed}">已删除 ${all.filter(deleted).length}</button></nav>`;
  const body=folders+(cur?`<section class="rpg-panel mail-view"><div class="mail-tools"><button type="button" class="survival-btn alt mail-back" id="mail-list">← 返回列表</button><button type="button" class="${trashed?'mail-restore':'mail-delete'}" data-mail-action="${trashed?'restore':'delete'}" data-id="${esc(cur.id)}">${trashed?'恢复邮件':'删除邮件'}</button></div>
   <div class="mail-head"><div class="rpg-kicker">${esc(cur.tag||'MAIL')}</div><h2>${esc(fill(cur.subject))}</h2><p><small>发件人</small><b>${esc(cur.from)}</b></p><p><small>收件时间</small><b>${esc(cur.date||'')}</b></p></div>
   <div class="mail-body">${lines(cur).map(lineHtml).join('')}${rowsHtml(cur)}</div>${cur.attach&&ATTACH[cur.attach]?`<div class="mail-attach"><div class="rpg-kicker">📎 附件</div>${ATTACH[cur.attach]()}</div>`:''}</section>`
   :(!trashed?EXT.map(e=>e.top?e.top():'').join(''):'')+`<section class="rpg-panel"><h2>${trashed?'已删除':'收件箱'}</h2>${ms.length?`<ul class="mail-list">${ms.map(m=>`<li class="mail-row"><button type="button" class="mail-item${isRead(m)?'':' unread'}" data-mail="${esc(m.id)}"><span class="mail-dot" aria-hidden="true"></span><span class="mail-meta"><b>${esc(m.from)}</b><small>${esc(m.date||'')}</small></span><span class="mail-subj">${esc(fill(m.subject))}</span>${m.tag?`<em>${esc(m.tag)}</em>`:''}</button><button type="button" class="${trashed?'mail-restore':'mail-delete'}" data-mail-action="${trashed?'restore':'delete'}" data-id="${esc(m.id)}" aria-label="${trashed?'恢复':'删除'}：${esc(fill(m.subject))}">${trashed?'恢复':'删除'}</button></li>`).join('')}</ul>`:'<p class="survival-tip">这里没有邮件。</p>'}<p class="mail-trash-note">删除后可在「已删除」中恢复，不影响任务或联系人。资料有新版本时会重新进入收件箱。</p></section>`);
  UI.page('mail','邮件','MAIL',body);
  app.querySelectorAll('[data-mail-folder]').forEach(b=>b.onclick=()=>page(null,b.dataset.mailFolder));
  app.querySelectorAll('[data-mail]').forEach(b=>b.onclick=()=>page(b.dataset.mail,folder));
  app.querySelectorAll('[data-mail-action]').forEach(b=>b.onclick=()=>{if(b.dataset.mailAction==='restore')restore(b.dataset.id);else remove(b.dataset.id);page(null,folder)});
  const l=app.querySelector('#mail-list');if(l)l.onclick=()=>page(null,folder);
  if(!trashed)EXT.forEach(e=>{if(e.bind)e.bind(cur)});badge();
 }

 function badge(){const b=document.querySelector('#et-nav [data-nav="mail"]');if(b)b.classList.toggle('et-badge',unread()>0)}
 return {list,unread,page,badge,lines,cond,isRead,extend,deleted,remove,restore};
})();
window.MAIL=MAIL;
MAIL.badge();
/* Shared-scope extensions: must precede startup. */
/* Day investigation extension: isolated data, persisted interactions, shared INV. */
(()=>{
const defs=[
['kitashinagawa','KS','北品川',250,['五人的聚会照片','老板的年轻往事','商店街寻猫启事','地区祭典旧海报','关门店铺的电话号码','邻居传闻'],['照片里五个人围坐在狭长柜台前，窗边有一根斜梁。','老人记得片山常把最后一份菜留给迟到的朋友。','三花猫走失，主人留下了附近诊所的联系方式。','祭典海报的年份比老人记忆中的年份早一年。','停业店铺门上留着号码；拨打后只有持续的水声。','老人将祭典后的争执说成了前一天，海报无法支持这个日期。']],
['gotanda','GD','五反田',300,['品川乘客的间接说法','行车记录摘要','遗忘的收据','空载出租车传闻','乘客投诉记录','日期记错的目击'],['司机提到一名曾送往品川的乘客说起急救车辆；司机本人没有到酒店后巷，日期未核实。','行车记录保留了出车、绕行和返场顺序；具体日期仍需向酒店核对。','收据记载的是普通洗车费用。','一辆空车每夜都显示后座有人系安全带。','乘客投诉司机绕路，调度记录显示道路施工。','另一位司机核对排班后承认，自己可能把乘客传闻误当作亲眼经历。']],
['shimbashi','SB','新桥',0,['207号室交班口述','前员工的工作范围','加班见闻','居酒屋失踪传闻','印刷店普通名片','街头占卜摊'],['前员工在核对酒店资料时，承认曾协助207号室房卡交接。','一名曾在旅馆工作的人谈到前台与客房岗位的日常分工。','上班族提到加班和赶末班车。','居酒屋店主转述一位熟客消失于镜中的传闻，身份无法核实。','普通印刷店提供的业务名片，没有明显酒店关联。','街角有位占卜师，桌上摆着塔罗牌与一只小铃。']],
['ueno','UE','上野',350,['共同经历的回忆','片山人生补充证词','不忍池的道路指示','旧相机寻主启事','另一张旧合影','来源不明符号'],['知情人记得片山与田中一起等候失约的朋友。','片山多年后仍回来打听昔日朋友的消息。','路牌上印着通往不忍池的步行路线，附近还有一张社区活动海报。','摄影师在长椅上捡到一台没有胶卷的旧相机。','合影拍摄于另一家公司的郊游，与酒店住客无关。','相框背面的符号没有署名，无法确定来源。']]];
// 白天调查：精确配方，不按 case 标签推断，保留既有 D01-D13 / E01-E12。
const dayRecipes=[
 ['D14','DAY-KS-01','C08','五人的旧照片','两处旧照片可能指向同一批朋友，但需要辨认人物与背景细节。',['tanaka'],null],
 ['D15','DAY-KS-02','C09','居酒屋老板的回忆','片山保留着昔日朋友的记忆；这次来东京或许与过去有关。',['tanaka'],null],
 ['D16','DAY-GD-01','C04','救护车说法的来源差异','小林对酒店附近车辆的回忆与出租车乘客的转述是否谈及同一晚，需要核对日期与来源。',['kobayashi'],null],
 ['D17','DAY-GD-02','C13','跨区行车与酒店时间线','出租车营业所的出车、绕行和返场顺序只有在日期对应后，才能与酒店记录进行比较。',['mori'],null],
 ['D18','DAY-SB-01','C03','207号室交班记录','前员工核对酒店资料时承认参与过207号室房卡交接；他实际负责的范围仍需核实。',['sato'],null],
 ['D19','DAY-SB-02','C13','登记与房卡交接的分工','前员工提到登记簿填写和房卡交接属于不同工作；实际分工需比对酒店资料。',['mori'],null],
 ['D20','DAY-UE-01','C05','片山与田中的共同回忆','五份便当或许与昔日五人一同吃饭的记忆有关，而不是犯罪证据。',['tanaka'],null],
 ['D21','DAY-UE-02','C07','片山再次寻找旧友','片山确实尝试寻找昔日朋友；未完成的重逢或许解释了他的最后行程。',['tanaka'],null]
];
const dayDeds=GAME_DATA.d['investigation/deductions'].deductions;
for(const [id,a,b,name,desc,verify,evidence] of dayRecipes){if(!dayDeds.some(x=>x.id===id))dayDeds.push({id,pair:[a,b],name,desc,verify,evidence,truth:null})}
// 酒店NPC复用原来的对话入口；提供保守的求证记录，不直接发放报告材料。
const dayHotelRules=[
 ['tanaka','D14','vf-tanaka-e07'],['tanaka','D15','vf-tanaka-e07'],
 ['kobayashi','D16','vf-koba-d03'],['mori','D17','vf-mori-deny'],
 ['sato','D18','vf-sato-d02'],['mori','D19','vf-mori-d02'],
 ['tanaka','D20','vf-tanaka-e05'],['tanaka','D21','vf-tanaka-e07']
];
const vData=GAME_DATA.d['investigation/verify'];
for(const [npc,deduction,node] of dayHotelRules){const id='day-'+npc+'-'+deduction;if(!vData.rules.some(r=>r.id===id))vData.rules.push({id,deduction,npc,node,source:'白天调查的交叉求证',dayReview:true})}
const tags=['case','case','life','life','mystery','mislead'];
for(const [sid,p,name,price,names,desc] of defs)names.forEach((n,i)=>GAME_DATA.d['investigation/clues'].clues.push({id:`DAY-${p}-0${i+1}`,name:n,desc:desc[i],source:name,method:i<2?'现场调查':'环境观察',internalTag:p==='UE'?['case','case','mystery','life','life','mystery'][i]:p==='GD'||p==='SB'?['case','case','life','mystery','life','mislead'][i]:tags[i]}));
const state=()=>{campaign.dayInvestigation??={stations:{},gifts:{},warehouse:null};return campaign.dayInvestigation};
const st=id=>state().stations[id]??={started:false,seen:[],relation:'正常交谈',repairs:0,order:[]};
const save=()=>campaignSave();
const btn=(label,fn,root)=>{let b=document.createElement('button');b.className='rpg-action';b.textContent=label;b.onclick=fn;root.appendChild(b);return b};
// DAY INVESTIGATION PHASE II: four explorable districts, explicit action settlement.
const scenes={
 kitashinagawa:{title:'北品川商店街',note:'老街与店铺 · 街角仍有几家老铺营业',theme:'#554a43',objects:[['archive','旧街景资料',19,21,'📰'],['cafe','改装咖啡店',44,19,'☕'],['laundry','老洗衣店',75,19,'🧺'],['closed','停业商铺',76,70,'🏚'],['elder','街角老人',28,72,'👴'],['board','公告栏',12,48,'📋'],['festival','祭典海报',49,51,'🎏'],['neighbor','邻居',51,83,'🧑']]},
 gotanda:{title:'五反田营业所',note:'车站西口 · 出租车营业所与临街店铺',theme:'#384c56',objects:[['driver1','一号司机',18,26,'🚕'],['driver2','二号司机',48,26,'🚖'],['witness','跨区夜班司机',78,26,'👨'],['dispatch','调度告示',22,66,'📋'],['log','行车记录',52,66,'📒'],['receipt','地上的纸片',77,64,'🧾'],['complaint','投诉窗口',31,88,'🪟'],['rest','休息区',74,88,'🚕']]},
 shimbashi:{title:'新桥办公街',note:'办公街 · 居酒屋与下班的人流',theme:'#4c485b',objects:[['worker','路边的男人',23,31,'👤'],['bar','居酒屋',56,20,'🏮'],['office','加班上班族',81,29,'💼'],['poster','街边告示',22,70,'📋'],['printer','印刷店职员',57,67,'🖨'],['seller','街头占卜师',79,80,'🔮']]},
 ueno:{title:'旧相册陈列区',note:'陈列区与不忍池入口',theme:'#3e4e46',objects:[['album','旧相册柜',21,22,'🖼'],['photoA','站牌前的合影',51,21,'📷'],['photoB','另一张合影',78,22,'🖼'],['back','照片背面',21,68,'✉'],['witness','展架旁的老人',55,70,'👵'],['pond','不忍池路牌',83,77,'🌙'],['camera','张贴的启事',40,89,'📸']]}
};
scenes.ueno.objects.push(['yk-print','街景のプリント',35,46,'📷'],['yk-program','行事案内',70,47,'📒']);
scenes.kitashinagawa.objects.push(['tn-worker','收摊的店员',64,44,'🏮'],['tn-witness','路灯下的行人',88,48,'👤']);scenes.gotanda.objects.push(['tn-driver','整理行车资料的司机',12,88,'🚕']);

// 街区生活点：不生成案件证据，不消耗调查行动；生活记录只记玩家到访过哪些地方。
const cityLife={
 gotanda:[['vending','自动贩卖机',8,50,'🥤'],['ramen','拉面店',91,46,'🍜'],['crosswalk','车站西口',61,9,'🚉'],['flower','街角花店',91,91,'💐']],
 kitashinagawa:[['bakery','面包店',8,13,'🥐'],['postbox','邮筒',92,34,'📮'],['cat','晒太阳的猫',11,86,'🐈'],['shrine','小神社入口',91,90,'⛩']],
 shimbashi:[['coffee','外带咖啡窗口',8,13,'☕'],['yakitori','烤串摊',91,46,'🍢'],['station','新桥站入口',8,89,'🚉'],['news','报纸架',92,90,'📰']],
 ueno:[['bench','公园长椅',8,12,'🪑'],['snack','团子小摊',92,13,'🍡'],['pigeon','鸽群',10,91,'🕊'],['museum','美术馆导览牌',92,92,'🏛']]
};
for(const [id,pts] of Object.entries(cityLife))scenes[id].objects.push(...pts);
// v72：北品川、五反田换成定稿图，调查点和生活点按新图的位置摆放
for(const sid in (window.DAY_POS||{}))if(scenes[sid])scenes[sid].objects.forEach(o=>{const p=DAY_POS[sid][o[0]];if(p){o[2]=+(p[0]/16*100).toFixed(3);o[3]=+(p[1]/11*100).toFixed(3)}});
const cityLifeText={
 gotanda:{vending:'机身上贴着新的饮料海报。你站在这里听了一阵电车驶过的声音。',ramen:'店员掀开布帘招呼你。几个人正在讨论汤底的咸淡和今天的天气。',crosswalk:'西口广场有人排队等出租车。电子屏轮播普通的乘车注意事项。',flower:'花店老板正给一束白色洋桔梗修剪花茎。你没有打扰。'},
 kitashinagawa:{bakery:'面包刚出炉。门口的小黑板写着今天的限量奶油面包。',postbox:'红色邮筒立在路口。清扫员正在擦拭附近的标识牌。',cat:'一只花猫伸懒腰，听见你的脚步就钻到自行车后面。',shrine:'小神社的石阶干净得发亮。有人安静地放下一枚硬币。'},
 shimbashi:{coffee:'咖啡窗口前排着几个上班族，店员不停地喊取餐号。',yakitori:'铁网上的鸡肉滋滋作响。两个人在争论哪个球队昨晚输了比赛。',station:'站口反复播报乘车安全提示。拎公文包的人流从你身旁经过。',news:'报纸架上摆着当天的财经新闻和体育版，头条谈的是股市与比赛。'},
 ueno:{bench:'长椅旁的树叶落了一地。背包客摊开地图研究附近的美术馆。',snack:'团子摊老板把热茶递给等候的客人，空气里有淡淡的酱油甜香。',pigeon:'鸽子突然扑棱着翅膀飞起来，落在更远的草坪上。',museum:'导览牌写着今天的特展和参观注意事项。你可以改天再来慢慢看。'}
};
const isCityLife=(id,k)=>!!cityLifeText[id]?.[k];
const codes={kitashinagawa:'KS',gotanda:'GD',shimbashi:'SB',ueno:'UE'};
const has=id=>!!campaign.investigation?.clues?.[id];
const hasOld=id=>!!campaign.investigation?.clues?.[id];
const flag=(s,k)=>!!s.flags[k];
const mark=(s,k)=>{s.flags[k]=true;save()};
const clueId=(id,i)=>'DAY-'+codes[id]+'-0'+i;
function ensure(id){const s=st(id);s.flags??={};s.known??={};s.dayPaid??={};s.pos??={x:50,y:50};s.dialogue??=[];
 // Older saves with collected clues do not lose their existing progress.
 const pair=[1,2];for(const i of pair)if(has(clueId(id,i)))s.flags['legacy'+i]=true;
 if(id==='gotanda'){
  if(has(clueId(id,1)))s.flags.witnessAmbulanceAsked=true;
  if(has(clueId(id,6)))s.flags.driver2AmbulanceAsked=true;
 }

 return s}
function core(id){return has(clueId(id,1))&&has(clueId(id,2))}
function symbol(id){const s=ensure(id);return core(id)?'✓':Object.keys(s.flags).length||has(clueId(id,1))?'…':'!'}
const evidenceFor={
 gotanda:{driver2:6,witness:1,receipt:3,complaint:5},
 kitashinagawa:{closed:1,elder:2,board:3,festival:4,neighbor:6},
 shimbashi:{worker:1,office:3,bar:4,printer:5},
 ueno:{album:1,photoA:1,photoB:5,back:6,witness:2,camera:4}
};
const repeatedLeads={shimbashi:{seller:'look_seller'},gotanda:{driver1:'look_driver1',dispatch:'dispatch',log:'clue2',rest:'look_rest'},kitashinagawa:{archive:'beam',cafe:'look_cafe',laundry:'look_laundry'},shimbashi:{poster:'look_poster'},ueno:{pond:'look_pond'}};
function objectMark(id,k){const s=ensure(id);
 if(isCityLife(id,k))return '';
 if(k.startsWith('tn-')){const proof={'tn-worker':'TN03','tn-witness':'TN05','tn-driver':'TN06'}[k];return proof&&has(proof)?'✓':'!';}
 if(k.startsWith('yk-'))return has('YK03')?'✓':'!';
 const e=evidenceFor[id]?.[k];if(e&&has(clueId(id,e)))return '✓';
 const f=repeatedLeads[id]?.[k];if(f&&flag(s,f))return '✓';
 if(flag(s,'look_'+k))return '✓';
 if(id==='gotanda'&&(k==='witness'||k==='driver2'||k==='log')){
  const lead=hasOld('C04')&&(hasOld('C03')||hasOld('C13')||hasOld('DAY-KS-02')||hasOld('DAY-GD-02'));
  return lead?'!':'';
 }
 return e||f?'!':'';
}

function action(id){const s=ensure(id);dayDefaults();if(s.dayPaid[campaign.day])return true;
 const x74=campaign.actions<=0&&window.V74&&V74.extraFor('explore');
 if(campaign.actions<=0&&!x74){show('今天的调查行动已用尽。可以查看已有资料，或改天回来。');return false}
 if(!confirm('本次调查将消耗1次行动。\n当天返回这里，可以继续此前的调查。\n\n确定开始调查吗？'))return false;
 if(!V51.action('explore'))return false;if(x74)V74.useExtra();else campaign.actions--;s.dayPaid[campaign.day]=true;s.lastInvestigationDay=campaign.day;s.started=true;save();return true}
let current=null,active='',choices=[];
function show(t,opts=[]){const box=document.getElementById('day-read');if(!box)return;box.replaceChildren();
 const p=document.createElement('p');p.style.whiteSpace='pre-line';p.textContent=DISTORT.text(t);box.appendChild(p);
 const altered=V51.whisper(opts.map(([t,fn])=>({t,fn})));
 for(const c of altered||opts.map(([t,fn])=>({t,fn})))btn(DISTORT.text(c.t,true),c.fn,box);
 if(altered?.[0]?.note){const note=document.createElement('small');note.textContent=altered[0].note;box.appendChild(note)}if(!opts.length)btn('继续探索',()=>{box.replaceChildren();window.STREET_WALK?.step(current,'day')},box);}
function award(id,i,text){const s=ensure(id);if(!action(id))return;INV.addClue(clueId(id,i));mark(s,'clue'+i);show(text+'\n\n你把这页资料收进了调查夹。');update(id)}
function inspect(id,k){if(isCityLife(id,k)){const ds=ensure(id);ds.life??={};ds.life[k]=true;save();return show(cityLifeText[id][k],[[(['ramen','snack','yakitori','bakery','coffee','vending'].includes(k)?'看看菜单和价格':'再看看周围'),()=>show((['ramen','snack','yakitori','bakery','coffee','vending'].includes(k)?'你看了看价目表，决定先不买东西。':'行人从身边经过，街上的店铺仍在营业。'))],['继续逛街',()=>show('你继续沿街走去。')]]);}if(k==='yk-print'||k==='yk-program'){if(!action(id))return;YUMI.play(k==='yk-print'?'YK03':'program');return;}if(k.startsWith('tn-')){if(!action(id))return;return TANAKA.street(k)}const s=ensure(id);const free={kitashinagawa:['archive','cafe','laundry','closed','board','festival'],gotanda:['dispatch','log','receipt','complaint'],shimbashi:['poster','bar','printer','worker','office','seller'],ueno:['album','photoA','photoB','back','pond','camera']};if(!(free[id]||[]).includes(k)&&!action(id))return;mark(s,'look_'+k);
 const ask=(text,opts)=>show(text,opts);
 const done=(i,text)=>award(id,i,text);
 if(id==='kitashinagawa'){
  if(k==='archive')return ask('公告架上夹着一张这条街多年前的街景照。照片里有间狭窄的小店，门口斜伸出一根木梁，旧招牌已经看不清了。\n照片右下角印着拍摄年份，画面里能看到几间早已换了招牌的店铺。', [['记下街景照中的门框和窗户',()=>{mark(s,'beam');show('照片里，斜梁从门框右侧向上伸出，窗户紧贴门左边。你把这些细节记在了本子上。')}]]);
  if(['cafe','laundry','closed'].includes(k)){
   const content={cafe:'咖啡店经过大规模改装。门框是金属的，旧木结构只留下一小段。',laundry:'洗衣店左侧是两扇并排的窗。门口没有承重斜梁。',closed:'停业商铺的招牌早已拆下。门框右侧露出一截斜向上的旧木梁，窗户位于门左边。'}[k];
   const options=[];
   if(k==='closed'&&flag(s,'site')&&!has(clueId(id,5)))options.push(['记录旧电话号码',()=>done(5,'旧店门上残留的电话号码接通后只有水声。')]);
   if(flag(s,'beam'))options.push(['对照刚才看到的旧街景照',()=>{
     if(k!=='closed')return show('门框和窗户的位置与街景照对不上。再看看街上别的店。');
     mark(s,'site');
     if(has(clueId(id,1)))return show('这里就是你找到的旧店址。那页旧相册已经被你收好。');
     show('斜梁和窗户的位置都对得上。旧店很可能就在这里。店门旁还留着一页褪色的相册。',[["翻看相册，记录五人合影",()=>done(1,'你在旧店址旁找到一张褪色的五人合影。照片边缘有一块被水浸过的痕迹。')]]);
   }]);
   else options.push(['观察店面的门框和窗户',()=>show('你记下门框和窗户的位置。风吹得旧招牌轻轻摇晃。')]);
   return ask(content,options)
  }
  if(k==='elder'){
    const gotSite=flag(s,'site'),gotPhoto=has(clueId(id,1));
    const knowsName=!!(flag(s,'nameHeard')||campaign.hotelCase?.v18?.flags?.knowName||hasOld('C03')||hasOld('C08')||hasOld('C09')||hasOld('C10'));
    const intro=gotPhoto?'街角老人正坐在门口休息，你带着刚找到的合影走近。':gotSite?'街角老人坐在门边，听你说起那家旧居酒屋，便抬起头来。':'街角老人坐在门边，一边喝茶，一边看着街上的行人。';
    const opts=[
      ['打听以前常来这条街的客人',()=>{
        mark(s,'elderTrust');
        const knownPerson=hasOld('C03')||hasOld('C08')||hasOld('C09')||hasOld('C10')||flag(s,'nameHeard');
        show(knownPerson?'老人说，那家店从前有几位熟客常结伴来。\n“有个姓片山的，总给迟到的人留吃的。名字？片山茂。”':'老人说，那家店从前有几位熟客常结伴来。\n“有个男的总给迟到的人留吃的，挺热心。我都记不得他们叫什么了。”', [['记下旧店熟客的回忆',()=>done(2,knownPerson?'老人回忆一名叫片山茂的熟客常与朋友在旧店聚会。':'老人回忆旧店曾有几位熟客结伴来，其中一人常替迟到的朋友留饭。')]]);
      }],
      ...(knowsName?[[ '问他认不认识片山茂',()=>{
        mark(s,'nameHeard');
        mark(s,'elderTrust');
        show('老人点头：“以前确实有这么位客人，和朋友常来那家居酒屋。”',[['记录老人的回忆',()=>done(2,'老人回忆片山曾与朋友在旧居酒屋聚会，具体关系尚待核对。')]]);
      } ]]:[])
    ];
    if(gotPhoto)opts.push(['拿照片请他辨认',()=>{
      mark(s,'elderTrust');
      show('老人仔细看了看合影：“有几个脸熟……这个男人好像姓片山。他来得挺勤，常给晚到的朋友留菜。我不敢保证其他人是谁。”',[['记下老人辨认的名字',()=>{mark(s,'nameHeard');done(2,'老人看过合影后，认出其中一人可能姓片山；其他人的身份未能确认。')}]]);
    }]);
    // 普通街区问询不预设老人隐瞒了案件事实。
    return ask(intro,opts);
  }
  if(k==='closed'&&flag(s,'site')&&!has(clueId(id,5)))return ask('停业商铺的门上还留着旧电话号码。', [['记录电话号码',()=>done(5,'电话接通了。听筒里只有含混的水声，随后就断了线。')]]);
  if(k==='board')return ask('寻猫启事：三花猫走失，附有附近诊所号码。',[['抄下启事',()=>done(3,'你记录了商店街寻猫启事。')]]);
  if(k==='festival')return ask(flag(s,'look_neighbor')?'褪色的地区祭典海报印着旧年份，日期与邻居提到的时间不太一致。':'褪色的地区祭典海报印着旧年份，下面写着演出时间和摊位安排。',[['记录海报',()=>done(4,'你取得地区祭典旧海报的记载。')]]);
  if(k==='neighbor')return ask('邻居说，祭典后有人吵过架，但他记不清是哪一天。',[['记录传闻',()=>done(6,'邻居的记忆尚无可靠日期佐证。')]]);
 }
 if(id==='gotanda'){
  // 五反田与品川酒店并不相邻。这里调查的是跨区营运司机的送客记录，
  // 不是让司机隔着几站地铁“看见酒店后门”。关键问题需要先取得酒店相关线索。
  const lead=hasOld('C04')&& (hasOld('C03')||hasOld('C13')||hasOld('DAY-KS-02')||hasOld('DAY-GD-02'));
  if(k==='driver1')return ask('一号司机在候车位旁喝咖啡，见你过来，问要不要搭车。',[
    ['问到品川一带怎么走',()=>show('“走山手线就行。真要打车，夜里看路况，价钱可不一样。”')],
    ['聊聊夜班遇过的怪事',()=>show('“空车的时候报警器还响过。跑一天车，什么小毛病都有。”') ],
    ['道谢离开',()=>show('司机把咖啡罐放回车里。')]
  ]);
  if(k==='driver2'){
   const asked=flag(s,'driver2Talk'),askedAmbulance=flag(s,'driver2AmbulanceAsked');
   const opts=[['了解夜班排班和交车地点',()=>{mark(s,'driver2Talk');show('“我们从五反田的营业所出车，接到去品川的单也不奇怪。班表在手机里，没法凭印象记所有日子。”')}],
     ['问这一带是否经常绕行',()=>show('“施工时得绕路。调度告示写了哪个路段封了，别只听人讲。”')]];
   if(lead&&asked)opts.push(['询问能否核对一趟品川方向的夜班',()=>{mark(s,'driver2AmbulanceAsked');show('司机翻了翻手机：“有过那边的单。也听人说起过急救车辆经过，不过不是在这儿看见的；我当时是否当班，还得核对。”',[['对照他那晚的排班',()=>{mark(s,'driver2DateChecked');done(6,'司机按班表核对后发现，传闻中的那一天可能是自己的休息日。他无法证明自己目击过酒店附近的救护车。')} ]])}]);
   if(askedAmbulance)opts.push(['继续核对先前的日期',()=>show('“我想过了，那天我可能根本没出车。不能把别人的说法算成我的目击。”',[['记下证词修正',()=>done(6,'二号司机复核排班后撤回对现场目击的确定说法。')]])]);
   opts.push(['先不打扰',()=>show('司机低头继续整理票据。')]);
   return ask(asked?'二号司机在驾驶座上核对手机排班。':'二号司机正在整理零钱。车窗开着一道缝。',opts)
  }
  if(k==='witness'){
   const started=flag(s,'witnessTalk'),asked=flag(s,'witnessAmbulanceAsked');
   const opts=[['问司机主要跑哪些区域',()=>{mark(s,'witnessTalk');show('“五反田是交班点，有时会送客去品川、大崎。跑哪条路看客人的目的地。”')}],
     ['询问跨区夜班的行车资料',()=>show('“有些单子有行程摘要，但乘客信息不随便给人看。想核对哪一天，你得先说清楚。”')]];
   if(lead&&started)opts.push(['提起品川酒店附近的异常，问是否有相关行程',()=>{mark(s,'witnessAmbulanceAsked');show('司机想了想：“我记得有一趟送客到品川，乘客说附近小巷有急救车经过。我没开进酒店后巷，只听客人说，不能当成亲眼看见。”',[['核对那趟送客的落客区域',()=>{mark(s,'witnessPlace');show('他在行程摘要上指向品川站周边。地点距离港屋酒店仍有一段路；乘客所说的车辆具体在哪里，他没有目击。',[['将这段间接说法记入调查',()=>done(1,'五反田司机曾送客到品川，乘客提到附近有急救车辆经过。司机未目击港屋酒店后巷，日期与具体位置均未核实。')]])}]])}]);
   if(asked)opts.push(['追问信息是司机亲眼看到的吗',()=>show('“不是，我没有进那条巷子。这是当时乘客说的，连日期我也得重新查。”',[['记录证词来源限制',()=>done(1,'司机明确指出急救车信息来自乘客口述，而非本人目击；尚无日期或地点交叉印证。')]])]);
   opts.push(['谢谢，先不打扰',()=>show('司机点了点头。')]);
   return ask(started?'夜班司机整理好票据，抬头看向你。':'夜班司机刚结束一趟营运，正在清点票据。',opts)
  }
  if(k==='dispatch')return show('五反田营业所的调度公告列出一般交班时间、交通注意事项和施工绕行信息。', [['了解营业所交班规则',()=>show('司机们按值班表出车、返场。公告上列着交接班的时间段和营业所联系电话。')],['查看施工路段',()=>show('公告列着几条夜间施工路段及临时绕行路线。')],...(lead?[['核对你已掌握日期的营运安排',()=>{mark(s,'dispatch');show('你记下与手中日期相近的交班时间，但还没有完整车辆轨迹。')}]]:[])]);
  if(k==='log')return show('营业所张贴着一般安全行车说明，详细行程摘要需要说明具体核对日期。', [['看看普通行车规范',()=>show('安全行车说明列着轮胎、计价器和后排安全带的检查项目。')],...(lead?[['说明待核实日期，查看脱敏行车摘要',()=>{mark(s,'log');show('调度员只允许查看去除乘客姓名的摘要。你记下出车、绕行和返场的顺序；具体地点尚需交叉核对。',[['将行车摘要记入线索',()=>done(2,'营业所的脱敏行车摘要显示当晚出车、绕行和返场的大致顺序；司机与酒店事件之间尚未确认联系。')]])}],['使用时间线核对',()=>timeline(id)]]:[])]);
  if(k==='receipt')return ask('休息区边有一张普通洗车收据。',[['查看收据',()=>show('付款项目是车身清洗，没写车牌和乘客信息。',[['记录普通收据',()=>done(3,'五反田营业所附近拾到一张洗车收据，上面记着车辆清洗项目和日期。')]])],['不理会',()=>show('你没有动它。')]]);
  if(k==='complaint')return ask('窗口贴着一份绕路投诉的处理结果。',[['核对投诉',()=>show('调度员注明施工绕行，乘客对费用有疑问。',[['摘录记录',()=>done(5,'窗口贴着一份出租车绕行投诉的处理摘要，调度员给出的理由是施工。')]])]]);
  if(k==='rest')return ask('营业所休息区的司机们聊着天气与今晚的排班。',[['聊聊车载设备的小毛病',()=>show('有人说后排安全带报警器坏过几回，空车也会响。',[['记下传闻',()=>done(4,'五反田司机之间流传着后排安全带报警器失灵的事。')]])],['问问有没有营业所电话',()=>show('值班电话号码贴在自动贩卖机旁。')]]);
 }
 if(id==='shimbashi'){
  if(k==='worker')return worker(id);
  if(k==='office')return show('便利店门口，一个上班族正在看手机上的末班车时间。\n他抬头看了你一眼：“怎么了？”',[
    ['随便聊聊这附近的工作',()=>show('“这里啊，加班是家常便饭。”他苦笑了一下，把手机屏幕摁灭。',[["问问他为什么还没回去",()=>show('“刚忙完，电车都快没了。明天还得来。”',[['记下街区见闻',()=>done(3,'新桥办公区的上班族谈到加班和末班车。')]])]])],
    ['问附近哪里能坐车',()=>show('他指了指车站的方向：“往那边走，过路口就到了。”')]]);
  if(k==='bar')return show('居酒屋里还没坐满。老板正擦杯子，听到开门声抬起头。\n“いらっしゃい。一个人？”',[
    ['问问附近有什么老店',()=>show('“这片换过不少店。你想找哪一家？”他放下杯子，想了想。',[
      ['聊聊这里的老客人',()=>show('“有些人来喝了十几年，突然就不来了。”老板看了看角落里的镜子。',[['问问是不是发生过什么事',()=>show('“有个人说在镜子里看见熟客走进去，转眼不见了。”他耸耸肩，“我也只是听说。”',[['记下居酒屋的怪谈传闻',()=>done(4,'居酒屋老板转述过一个客人消失在镜中的传闻，未提供可核实的姓名。')]])]])]
    ])],
    ['只想打听附近的路',()=>show('老板给你指了方向，随后又去招呼其他客人。')]]);
  if(k==='printer')return show('印刷店里机器正响。店员等打印机停下来才注意到你。\n“您好，需要印什么吗？”',[
    ['询问店里主要接什么生意',()=>show('“附近公司要的名片、传单、票据都做。”他指向柜台上的样品。',[['看看名片样品',()=>show('一张普通业务名片印着店名和联系电话，没有酒店信息。',[['留下一张名片备查',()=>done(5,'印刷店柜台上摆放着业务名片样品和价目表。')]])]])],
    ['谢谢，不打扰了',()=>show('店员点点头，继续处理机器上的纸张。')]]);
  if(k==='seller')return show('路边撑着一把深紫色小伞。小桌上排着塔罗牌和一只铜制小铃。摊主抬头看你。\n“手相还是塔罗？不算也可以随便看看。”',[['🔮 占卜那家旅馆的事（¥1000）',()=>window.FORTUNE&&FORTUNE.open()],
    ['问问怎么收费',()=>show('“简单问一个问题五百日元。你也可以先看看牌面，想好了再决定。”',[['问能算哪些事',()=>show('“感情、工作、考试都有人问。我只负责解牌，事情还得你自己决定。”')],['先不算',()=>show('摊主笑着收好牌，继续等下一位客人。')]])],
    ['看看桌上的牌',()=>show('几张牌背整齐地铺在深色绒布上，铃铛被风吹得轻轻碰响。',[['听占卜师介绍牌阵',()=>show('“一张看眼前的烦恼，三张能讲讲过去、现在和之后的选择。”')]])],
    ['随口聊聊这一带',()=>show('“下班的人来得最多。”她朝车站方向点点头，“有些人只是想找个地方坐几分钟。”')],
    ['离开占卜摊',()=>show('占卜师向你摆摆手，重新低头理牌。')]]);
  if(k==='poster')return show('写字楼外的公告栏贴着防灾演练通知、消防路线图和物业联系电话。',[['读一读防灾安排',()=>show('演练日期和疏散路线都写得清楚。看起来只是办公楼的日常通知。')]]);
 }
 if(id==='ueno'){
  // 先浏览展柜，再观察照片；北品川的五人合影是额外参照，不是上野调查的前置条件。
  const seenAlbum=flag(s,'album')||flag(s,'photoDetail')||flag(s,'photoMatch')||has(clueId(id,1))||has(clueId(id,2));
  if(k==='album')return show('旧相册柜里陈列着几张年代相近的照片。隔着玻璃，你能看出有聚会照，也有集体出游照；人脸还看不清。',[
    ['仔细查看展柜里的照片',()=>{mark(s,'album');show('你记下了展柜的照片编号与位置。第一张拍的是站牌附近的聚会，第二张背后贴着公司郊游的标签；你凑近玻璃看了看。')}]]);
  if(k==='photoA'){
    if(!seenAlbum)return show('玻璃上反光很重，细节看不清。旁边有一块展品说明牌。');
    return show('第一张照片里，有几个人站在旧站牌前。其中一人的袖口缝着一块方形补丁。你还无法确认他们是谁。',[
      ['放大查看袖口和站牌',()=>{mark(s,'photoDetail');show('你记下了袖口补丁、站牌边缘以及人物站位。这些特征或许能与其他资料对照。', [['继续核对照片细节',()=>compare(id)]])}],
      ...(flag(s,'photoDetail')||flag(s,'photoMatch')||has(clueId(id,1))?[[ '核对这张照片的细节',()=>compare(id) ]]:[])
    ]);
  }
  if(k==='photoB'){
    if(!seenAlbum)return show('相框被固定在展柜中，旁边贴着一块小小的说明牌。');
    return show('第二张集体照的背面贴着某公司的郊游日期。人数与第一张相近，但人物、地点看起来不一样。',[
      ['记录这张普通合影',()=>done(5,'你记录了公司郊游合影的日期与背景；这张照片是否与其他资料有关，还需要继续比对。')]]);
  }
  if(k==='back'){
    if(!seenAlbum)return show('相框挂在展柜里。玻璃展柜把相框的背面挡得严严实实。');
    return show('第一张照片的相框背面留着一行手写日期，旁边画着一个模糊的符号。',[
      ['记下背面的日期',()=>{mark(s,'backDate');show('你抄下了背面的日期。相框木板边缘有几道细小划痕。')}],
      ['抄录不明符号',()=>done(6,'你记录了相框背面的符号，目前看不出署名或所属组织。')]]);
  }
  if(k==='witness'){
    const canAsk=flag(s,'photoDetail')||flag(s,'photoMatch');
    const opts=[['问她以前这附近是什么样子',()=>{
      mark(s,'memory');
      show('老人指着车站的方向：“以前常有人在那边等朋友。有两个人等到天快黑了，还在等。我问过他们要不要先找地方坐。”',[
        ['记下她讲的往事',()=>done(1,'老人回忆从前有两个人在旧站牌旁等候朋友，没说出名字。')],
        ['问她后来还见过这几个人吗',()=>show('“后来其中一个人又来过，问我还有没有那些朋友的联系方式。其他的，我就不清楚了。”',[
          ['记录后来的见闻',()=>done(2,'老人记得曾有人回来打听旧友的联系方式，但说不出确切姓名。')]])]
      ]);
    }]];
    if(canAsk)opts.push(['拿展柜里的照片请她辨认',()=>{
      mark(s,'memory');show('知情人对照你指出的照片细节，想起片山与田中曾一起等待另外几位朋友。',[["记录共同经历的回忆",()=>done(1,'知情人回忆片山与田中曾共同等待旧友。照片上的几个人没有标出姓名。')]]);
    }]);
    if(flag(s,'memory')||has(clueId(id,1))||has(clueId(id,2)))opts.push(['问她后来还见过那些人吗',()=>{
      show('她记得其中一人多年后曾回来打听旧友的联系方式，但并不知道其他人后来的去向。',[["整理补充证词",()=>done(2,'知情人记得有人回来寻找旧友的联系方式，但不能确认其姓名和其他人的去向。')]]);
    }]);
    return show(canAsk?'知情人坐在展架旁。你已有一些照片细节，可以请她回忆。':'老人坐在展架旁，看着来往参观的人。',opts);
  }
  if(k==='pond')return show('路牌指向不忍池。步道旁有人停下来看地图，树枝在风里轻轻晃动。', [['沿路走到池边',()=>show('水面被风吹皱了。远处有人收起相机，路灯还没有亮。')],['跟长椅上的老人聊聊',()=>show('老人把最后一点面包屑撒在地上。\n“天黑后这边人少，别走到没有灯的地方。”',[['谢谢提醒',()=>show('老人笑了一下，又看向池面。')]])],['回到街区',()=>{district=byId[id];renderDistrict()}]]);
  if(k==='camera')return show('摄影师贴着一张寻主启事：旧相机没有胶卷。',[['记录寻相机启事',()=>done(4,'旧相机寻主启事已记录。')]]);

 }
}
function worker(id){
 const s=ensure(id);
 if(s.relation==='拒绝交谈')return show('男人认出了你，脸色沉了下来：“还有事？”',[["拿出可靠的酒店记录，说明只是想核实",()=>{if(!hasOld('C03')&&!hasOld('C13'))return show('你手上还没有能让他愿意核对的酒店资料。');s.relation='戒备';save();show('他看了看你拿出的资料，迟疑片刻：“……那你问吧。”')}],['离开',()=>show('你没有继续纠缠。')]]);
 const knowsWork=flag(s,'workAsked');
 const seen207=flag(s,'noRoomAsked');
 const options=[
  ['先打声招呼，问他是不是在等人',()=>show('“等朋友。怎么，你也在找人？”他把手机收进口袋。',[['问问他以前在哪儿做事',()=>{mark(s,'workAsked');show('“品川那边，一家叫港屋的小旅馆。接待、搬行李、换床单、夜班，忙起来什么都得做。”\n他晃了晃咖啡罐。\n“老楼了。夜班交接本上写满了规矩——几点以后别去哪层、听见什么别应声。刚去的时候我还以为是前辈在吓新人。”')}]])]
 ]; /* v35：原「聊聊他以前做什么工作」与上一条内容重复，已合并 */
 if(knowsWork){
   options.push(['问问他为什么从港屋辞职',()=>show('他沉默了一会儿：“说不上为什么。就是……那地方让人不舒服。”',[['问他具体是哪里不舒服',()=>show('“二楼有位长住的老先生，每天背着相机出门，早上在大堂喝咖啡，跟谁都客客气气的。\n后来有几天没见他下楼。我问经理，经理说他已经退房了。可我那几天都在前台，没见他结过账。”\n他把空罐子捏扁。“那周我就不干了。”',[['问还有谁知道这件事',()=>show('“前台的佐藤小姐应该记得。登记簿都是她管的。……别说是我讲的。”')],['暂时不追问',()=>show('他点点头，没有再说下去。')]])],['问当时主要做什么',()=>show('“主要帮客人搬行李、送备品。前台忙不过来时，我也搭过手。”')]] )]);
   if(hasOld('C03')||hasOld('C13'))options.push(['拿出酒店资料，请他核对一处登记',()=>{
      mark(s,'noRoomAsked');
      show('你把酒店资料翻到写着207号室的那一页，请他核对当年做过哪些工作。\n他看了一会儿：“登记簿一般是前台负责，我有时帮忙递房卡。这个房号，我好像也接触过。”',[['请他说说记得什么',()=>show('“有次当班要核对207的房卡去向，我跟着做过交接。后来怎么处理的，我就不知道了。”',[['记录他曾接触207交班事项',()=>{mark(s,'slip');award(id,1,'前员工在查看资料后回忆，曾临时协助递交207号室房卡；是否有书面交接记录尚需核对。')} ]])],['先收起资料',()=>show('你暂时没有追问，他也没继续解释。')]]);
   }]);
   if(seen207&&has(clueId(id,1))&&(hasOld('C03')||hasOld('C13')))options.push(['对照酒店记录，追问他的工作范围',()=>show('你请他再区分登记簿填写与房卡交接。\n他想了想：“登记簿是前台填的。交房卡这种事，谁手上空了谁就帮一下。”',[['把两次说法一并记录',()=>doneWorker(id)]])]);
 }
 // 没有可靠记录，不显示无条件的命案指控；有记录后通过上方207交班资料逐步核对。
 return show(knowsWork?'男人倚在路边，看见你走来，抬了抬下巴。\n“又见面了。想问什么？”':'路边一个男人正在等红灯，手里拿着罐装咖啡。\n你走近时，他只是礼貌地让出半步。',options);
}
function doneWorker(id){award(id,2,'前员工区分了登记簿填写与临时房卡交接；其是否实际接触207号室仍需与交接记录核对。')}
function timeline(id){const s=ensure(id);if(!flag(s,'dispatch')||!flag(s,'log'))return show('先分别查看调度告示与行车记录，再开始重建。');let seq=[];const options=['返场','出车','绕行'];
 function turn(){show('时间线重建 · 根据工作记录选择下一项。\n已排：'+(seq.join(' → ')||'（尚未开始）'),options.filter(x=>!seq.includes(x)).map(x=>[x,()=>{seq.push(x);s.order=seq.slice();save();if(seq.length===3){if(seq.join('|')==='出车|绕行|返场')award(id,2,'行车记录的先后顺序已重建。行车记录的日期还没有与酒店的记录逐一对上。');else{seq=[];s.order=[];save();show('排列与工作记录的顺序存在冲突。可重新查阅资料，再进行整理。', [['重新排序',turn]])}}else turn()}]));}turn()}
function compare(id){const s=ensure(id);if(!flag(s,'photoDetail')&&!flag(s,'photoMatch')&&!has(clueId(id,1)))return show('先仔细观察展柜第一张照片的袖口与站牌。');
 const hasKs=has('DAY-KS-01');
 return show(hasKs?'你拿出了北品川取得的五人合影，准备与上野展柜的照片核对。哪种做法更有意义？':'目前只有上野展柜的照片可供观察。你应该怎样整理细节，才能请知情人辨认？',[
 ['只看人数相近，就认为照片拍的是同一批人',()=>show('仅凭人数相近，暂时无法确认人物身份。')],
 [hasKs?'结合两张照片的站牌、袖口与人物站位，记录可核对之处':'记下袖口补丁、旧站牌和人物站位，交给知情人核实',()=>{mark(s,'photoMatch');show('你把可以供别人核对的细节记下来了。接下来可以向展架旁的知情人询问。'+(hasKs?'\n北品川合影也可作为额外参照，但两张照片是否属于同一批人仍需核验。':''))}],
 ['只凭衣服颜色就判断人物身份',()=>show('照片中的衣服颜色相近，几个人的面容却没有拍清。')]]);
}
function localVerify(id){const s=ensure(id), inv=campaign.investigation||{};const localNpc={kitashinagawa:'居酒屋老人',gotanda:'跨区夜班司机',shimbashi:'前酒店员工',ueno:'上野知情人'}[id];const localDeds={kitashinagawa:['D14','D15'],gotanda:['D16','D17'],shimbashi:['D18','D19'],ueno:['D20','D21']}[id];const known=localDeds.filter(k=>inv.deductions?.[k]);
 if(!known.length)return show('你目前没有准备好要向对方出示的资料。');
 show('向 '+localNpc+' 出示哪一条已有推论？',known.map(did=>[dayDeds.find(x=>x.id===did)?.name||did,()=>{
 if(s.relation==='拒绝交谈')return show('对方拒绝交谈。请先依据可靠记录恢复接触。');
 if(!action(id))return;
 const answers={D14:['尚未证实','老人记得旧店斜梁，但无法确认照片里所有人的身份。'],D15:['已证实','老人记得片山和朋友曾在旧店聚餐，之后各人的去向他不清楚。'],D16:['尚未证实','司机说的是送往品川的乘客转述，不是本人在港屋酒店后巷的目击；日期、位置都未核实。'],D17:['已证实','行车记录上的出车、绕行和返场顺序对上了。记录的日期尚未与酒店事件对应。'],D18:['已证实','前员工承认参与过207号室房卡交接，他没有提登记簿的事。'],D19:['尚未证实','前员工和酒店对他当时负责的工作，说法对不上。'],D20:['尚未证实','知情人确认旧友交往，五份便当动机需要田中亲述。'],D21:['已证实','知情人确认片山曾寻找旧友，但不知道各人的最终去向。']};const [status,detail]=answers[did];inv.dayVerify??={};inv.dayVerify[did]??={};inv.dayVerify[did][id]={status,detail,at:{day:campaign.day},npc:localNpc};save();show(localNpc+'：'+detail+'\n调查状态：'+status);
 }]));}
function update(id){const s=ensure(id);const stat=document.getElementById('day-status');if(stat)stat.textContent='DAY '+campaign.day+' · 剩余行动 '+campaign.actions+' · '+(s.dayPaid[campaign.day]?'今日调查已开始':'可自由观察；正式调查另需行动');
 for(const b of document.querySelectorAll('[data-dayobj]')){const o=b.dataset.dayobj,m=objectMark(id,o);b.classList.toggle('done',m==='✓');const em=b.querySelector('[data-day-mark]');if(em)em.textContent=m;b.setAttribute('aria-label',(m==='✓'?'重新交谈／查看':m?'调查':'访问')+b.dataset.label);}
 window.STREET_VIEW?.drawDay(id);const target=document.getElementById('day-char');if(target){target.style.left=s.pos.x+'%';target.style.top=s.pos.y+'%'}
}
function interact(id,key){if(window.STREET_WALK?.blocked())return;const s=ensure(id),o=scenes[id].objects.find(x=>x[0]===key);if(!o)return;
 s.pos=(window.DAY_SNAP&&DAY_SNAP[id])?DAY_SNAP[id](null,o[2],Math.min(94,o[3]+9)):{x:o[2],y:Math.min(94,o[3]+9)};save();update(id);
 active=key;inspect(id,key)}
function move(id,dx,dy){if(window.STREET_WALK?.blocked()||document.querySelector('#day-read button'))return;const s=ensure(id);let x=Math.max(5,Math.min(95,s.pos.x+dx)),y=Math.max(5,Math.min(95,s.pos.y+dy));if(window.DAY_SNAP&&DAY_SNAP[id])({x,y}=DAY_SNAP[id](s.pos,x,y));s.pos={x,y};save();update(id);window.STREET_WALK?.step(id,'day')}
function page(id,objectKey){if(!campaign||campaign.day<2||campaign.day>6)return;const sc=scenes[id];if(!sc)return;current=id;const s=ensure(id);UI.scene('day-investigation',()=>page(id));
 app.innerHTML=`<div class="rpg-shell"><section class="rpg-panel"><div class="rpg-kicker">DAY INVESTIGATION // ${codes[id]}</div><h1>${defs.find(x=>x[0]===id)[2]} · ${sc.title}</h1><p class="rpg-tiny">${sc.note}</p><p id="day-status" class="day-status"></p><div id="day-map" class="day-map" style="--day-tone:${sc.theme}"><canvas id="day-canvas" width="512" height="352" aria-label="街区像素场景"></canvas></div><p class="rpg-tiny">点击人物、店铺或物品探索。! 表示尚有可调查的内容，✓ 表示已取得该处的主要资料；没有标记的是普通城市生活点。WASD 或点击/触摸地图移动。</p><div class="day-pad"><button data-walk="0,-9">▲</button><button data-walk="-9,0">◀</button><button data-walk="0,9">▼</button><button data-walk="9,0">▶</button></div><article id="day-read" class="day-dialogue" aria-live="polite"><p>街道上人来人往。你决定先往哪里走？</p></article><div id="day-tools" class="day-tools"></div></section></div>`;
 const map=document.getElementById('day-map');const dc=document.getElementById('day-canvas');dc.onclick=e=>{if(window.STREET_WALK?.blocked()||document.querySelector('#day-read button'))return;const r=dc.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100;const p=ensure(id).pos;move(id,Math.max(5,Math.min(95,x))-p.x,Math.max(5,Math.min(95,y))-p.y)};sc.objects.forEach(o=>{const b=document.createElement('button');b.className='day-object';b.dataset.dayobj=o[0];b.style.left=o[2]+'%';b.style.top=o[3]+'%';b.dataset.label=o[1];b.innerHTML='<span aria-hidden="true" data-day-mark></span><small>'+o[1]+'</small>';b.setAttribute('aria-label','查看'+o[1]);b.onclick=()=>interact(id,o[0]);map.appendChild(b)});
 document.querySelectorAll('[data-walk]').forEach(b=>{b.onclick=()=>{const [x,y]=b.dataset.walk.split(',').map(Number);move(id,x,y)}});
 const tools=document.getElementById('day-tools');btn('🧩 向现场人物出示推论',()=>localVerify(id),tools);btn('📁 打开原有线索档案',()=>INV.page(),tools);btn('📓 私人调查笔记',()=>window.DAYPHASE3?.notesPage(),tools);
 btn('← 返回原车站街区 / 怪谈',()=>{district=byId[id];renderDistrict()},tools);btn('🗺 返回铁路地图',()=>tokyoHome(),tools);
 OUTINGS.mount(map,id);CITYPHOTO.mount(map,id,([x,y])=>{s.pos={x,y};update(id)});update(id);if(objectKey)interact(id,objectKey);}
// Day objects are mounted directly in the station scene by STREET_VIEW.
// Phase III: map markers render inside railway SVG via the common event registry, not a quest list.
// Other exploration actions retain the original action settlement behavior.
window.addEventListener('keydown',e=>{if(!current||!document.getElementById('day-map'))return;if(/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;const dirs={ArrowUp:[0,-9],ArrowDown:[0,9],ArrowLeft:[-9,0],ArrowRight:[9,0],w:[0,-9],s:[0,9],a:[-9,0],d:[9,0],W:[0,-9],S:[0,9],A:[-9,0],D:[9,0]};if(dirs[e.key]){e.preventDefault();move(current,...dirs[e.key])}});
window.DAYINV={defs,page,state,core,symbol,scenes,objectMark};

})();


/* Street conflicts: data-driven, bilingual, once-only settlement. */
(()=>{'use strict';
const L=(jp,zh)=>({jp,zh});
const choice=(tone,jp,zh,next)=>({tone,jp,zh,next});
const calm=choice('A · 克制','ここで争うつもりはありません。失礼します。','我不想在这里争吵。告辞。','calm');
const firm=choice('B · 正面反击','国籍で決めつけるのはやめてください。','请别凭国籍给人下定论。','firm');
const end=(jp,zh,extra={})=>({lines:[L(jp,zh)],...extra});
const data=[
{id:'SC-KON-01',district:'konbini',day:2,npc:'找茬的中年顾客',opening:L('ったく、また外国人かよ。日本語もろくにできねえなら、レジに立つなよ。','搞什么，又是外国人啊。连日语都说不利索，就别站在收银台前面啊。'),choices:[choice('A · 克制','申し訳ありません。すぐに確認します。','非常抱歉，我马上确认。','calm'),choice('B · 正面反击','ミスは謝ります。でも、外国人かどうかは関係ないでしょう。','操作失误我会道歉，但这跟我是不是外国人有什么关系？','firm'),choice('C · 强硬辱骂','うるせえな。レジのミスにいちいち国籍持ち出してんじゃねえよ。何様だよ、クソジジイ。','吵死了。收银出了点错，你他妈还非得扯上国籍。你算老几啊，死老头。','harsh')],branches:{calm:end('……早くしてくれ。','……快一点。你核对了账单，顾客离开，工作继续。'),firm:end('言い過ぎたよ。悪かった。','是我说过头了。抱歉。顾客收起零钱离开；店长点头示意你继续。'),harsh:{lines:[L('はあ！？ 客に向かって何だその口の利き方は！','哈？！你怎么跟客人说话的！'),L('いや、おっさんが先に喧嘩売ったんだろ。','不是，大叔，明明是你先找茬的吧。'),L('これ、あんたに。さっきの、ちょっとスッキリしたわ。','这个给你。刚才那一下，看得我还挺爽的。')],text:'顾客涨红了脸，骂骂咧咧地离开。排队的年轻人付款时，把一罐咖啡留给你。',item:'sc-coffee'},warn:end('気持ちは分かる。でも店では言葉を選んでくれ。','我能理解。但在店里还是注意措辞。店长介入，顾客离开。这次只有警告，没有礼物，也不扣工资。')}},
{id:'SC-GD-01',district:'gotanda',day:2,npc:'候车区司机',opening:L('外国人はトラブルばっかりだからな。面倒くさい客は乗せたくねえんだよ。','外国人净是惹麻烦。我可不想载这种麻烦乘客。'),choices:[calm,firm,choice('C · 强硬辱骂','こっちはまだ乗せろとも言ってねえよ。勝手に決めつけんな、ボケ。','我他妈还没说要坐你的车呢。少自作主张给人扣帽子，蠢货。','threat')],branches:{calm:end('……そうかよ。','……是吗。你走向另一侧候车区。'),firm:end('話なら向こうの運転手に聞いてくれ。','要打听事情，去问那边的司机吧。另一位司机示意你到休息区聊聊。',{lead:true}),threat:{lines:[L('……口の悪い外国人だな。もう行けよ。','……嘴真臭的外国人。快走吧。'),L('お互い様だろ。','彼此彼此。')],choices:[choice('A · 结束','もういい。','到此为止。','leave'),choice('B · 继续挑衅 · 可能受伤','降りてこいよ、ボケ。','下来啊，蠢货。','hurt'),choice('C · 保持距离','近づくな。ここで待つ。','别靠近。我在这边等。','leave')]},leave:end('あの人は放っておきなよ。話なら聞くよ。','别理他。想问什么，可以跟我说。另一名司机主动搭话。',{lead:true,relation:'拒绝交谈'}),hurt:end('しつこいんだよ！','你有完没完！司机下车推了你一把。你撞上栏杆，手肘擦破了皮。另一位司机拦住了他。',{hp:5,relation:'拒绝交谈'})}},
{id:'SC-SB-01',district:'shimbashi',day:3,npc:'醉酒上班族',opening:L('おい、どこ見て歩いてんだよ。ここは日本だぞ。','喂，你走路看不看路啊？这里可是日本。一个醉汉从居酒屋出来，撞上你的肩膀。'),choices:[calm,choice('B · 要求道歉','ぶつかったのはそっちでしょう。謝ってください。','撞人的是你吧。请道歉。','firm'),choice('C · 强硬辱骂','だから何だよ。日本なら人にぶつかっても謝らなくていいのか？ 寝ぼけたこと言ってんじゃねえぞ。','所以呢？在日本撞了别人就不用道歉了？少他妈说这种梦话。','threat')],branches:{calm:end('……ふん。','……哼。你绕开醉汉，走进有灯光的街道。'),firm:end('悪かったよ。もういいだろ。','对不起，行了吧。店员站到门口，男人不情愿地离开。'),threat:{lines:[L('てめえ……もう一回言ってみろ。','你小子……有种再说一遍。')],text:'男人脸色一变，朝你靠近一步。',choices:[choice('A · 到此为止','謝れよ。それで終わりだ。','道歉，这事就完了。','leave'),choice('B · 继续辱骂 · 疲劳点−15','耳まで悪いのかよ、このクソ酔っ払い。','你他妈连耳朵都不好使了？臭酒鬼。','hurt'),choice('C · 后退','近づくな。触んじゃねえ。','别靠过来。少碰我。','distance')]},leave:end('うるせえ。帰るぞ。','烦死了。我走了。男人骂骂咧咧地离开，你没有受伤。'),distance:end('ちっ……。','啧……。你退到店员身旁，拉开距离。男人没有追上来。'),hurt:{lines:[L('調子に乗ってんじゃねえ！','别他妈得寸进尺！')],text:'一记拳头砸在你的脸上。你踉跄后退，撞到自动贩卖机。罐装饮料在机器里晃动。男人还在骂。你尝到血腥味。周围有人看了一眼，没有停下。',hp:15,relation:'拒绝交谈'}}},
{id:'SC-KS-01',district:'kitashinagawa',day:2,npc:'街角居民（非居酒屋证人）',opening:L('最近は外国人ばっかりだな。この辺も変わっちまったよ。','最近到处都是外国人啊。这一带也变了。'),choices:[calm,firm,choice('C · 尖锐反击','街が変わったんじゃなくて、あんたが時代についていけてねえだけだろ。','不是街道变了，是你自己跟不上时代了吧。','harsh')],branches:{calm:end('昔はもっと静かだったんだ。','以前这里安静多了。老人望向早已关门的商铺，你继续走。'),firm:end('……ひとくくりにするのはよくないか。','……也不能一概而论啊。老人挪开椅子，给你让路。'),harsh:end('……生意気な若造だ。昔はここも夜まで店が開いてたんだよ。','……狂妄的小鬼。以前这里的店可都开到晚上。老人念叨着往事，没有拦你。')}},
{id:'SC-UE-01',district:'ueno',day:2,npc:'说教的陌生人',opening:L('外国人観光客はマナーが悪いからね。ちゃんと日本のルールを守ってくださいよ。','外国游客素质就是差。麻烦你们好好遵守日本的规矩。你正在路边看手机地图。'),choices:[calm,firm,choice('C · 强硬辱骂','人が地図見てるだけで説教かよ。てめえの偏見を日本のルールみたいに語ってんじゃねえよ、クソ野郎。','别人只是看个地图，你就跑来教育人？少他妈把自己的偏见包装成日本的规矩，混蛋。','harsh')],branches:{calm:end('分かればいいんですよ。','知道就好。你挪开一步，继续查看地图。'),firm:end('……通行の邪魔かと思っただけです。','……我只是以为你挡路了。你指了指空旷的人行道，他低头走开。'),harsh:end('誰か、そう思いませんか。','难道没人这么觉得吗？他转头寻找支持，没有人回应。他只好离开。你继续查看地图。')}}
];
const achievements={'firm':'日本語上手ですね','calm3':'礼貌的极限','harsh':'入乡随俗？','areas':'东京不是你家开的','five':'嘴上功夫 N1','hurt':'入乡随俗（物理）'};
const state=()=>campaign.streetConflict??={events:{},achievements:{},calm:0,areas:[],phrases:[],active:null};
const event=id=>data.find(x=>x.id===id)||campaign?.streetConflict?.events[id]?.definition;
function begin(id,context={}){const d=event(id);if(!d||!campaign||campaign.hp<=0||campaign.day<d.day||campaign.day>5)return false;const s=state();if(s.active&&s.active!==id)return false;s.events[id]??={definition:d,node:'opening',choices:[],completed:false,claimedReward:false,hpSettled:false,relation:'正常交谈',context,day:campaign.day};if(!s.events[id].completed)s.active=id;campaignSave();return true}
function choose(id,index){const d=event(id),s=state(),r=s.events[id];if(!r||r.completed||s.active!==id)return false;const choices=r.node==='opening'?d.choices:d.branches[r.node].choices;const c=choices?.[index];if(!c)return false;r.choices.push({node:r.node,index,jp:c.jp,zh:c.zh});if(r.node==='opening'){s.calm=index===0?s.calm+1:0;if(s.calm>=3)s.achievements.calm3=true;if(index>0){s.achievements.firm=true;if(!s.areas.includes(d.district))s.areas.push(d.district);if(s.areas.length>=3)s.achievements.areas=true}if(index===2){s.achievements.harsh=true;if(!s.phrases.includes(c.jp))s.phrases.push(c.jp);if(s.phrases.length>=5)s.achievements.five=true}}
r.node=c.next;if(id==='SC-KON-01'&&r.node==='harsh'&&r.context.managerPresent)r.node='warn';const b=d.branches[r.node];if(!b.choices){r.completed=true;s.active=null;r.relation=b.relation||'正常交谈';r.outcome=r.node;r.hpSettled=true;if(d.ambient==='ordinary'&&window.OMI)OMI.gift('street:'+campaign.day+':'+id);const bhp=Math.ceil((b.hp||0)*((GAME_CONFIG.peril||{}).damageScale||1));r.damage=Math.min(campaign.hp,bhp);campaign.hp=Math.max(0,campaign.hp-bhp);if(b.hp)s.achievements.hurt=true;if(b.item&&!r.claimedReward){campaign.items??={};campaign.items[b.item]=(campaign.items[b.item]||0)+1;r.claimedReward=true}if(b.lead)r.lead='五反田休息区：另一位司机愿意交谈。';if(campaign.hp===0){campaign.streetDeath={id:'street-mouth',name:'嘴上功夫',district:d.district,day:campaign.day};r.death=true}}campaignSave();return true}
let overlay=null;
function show(id){if(!begin(id))return;draw(id)}
function close(){overlay?.remove();overlay=null;if(campaign.hp<=0)checkDeath();else window.STREET_WALK?.restore()}
function draw(id){overlay?.remove();const d=event(id),r=state().events[id],b=r.node==='opening'?{lines:[d.opening],choices:d.choices}:d.branches[r.node];overlay=document.createElement('div');overlay.className='et-modal-back sc-overlay';overlay.innerHTML='<section class="rpg-panel" role="dialog" aria-modal="true" aria-label="街头冲突" style="max-width:680px;width:94%;max-height:90vh;overflow:auto;margin:auto"><h2></h2><div class="sc-content"></div></section>';overlay.style.cssText='position:fixed;inset:0;z-index:200000;background:#080912e8;display:flex;padding:10px';document.body.appendChild(overlay);overlay.querySelector('h2').textContent=d.npc;const host=overlay.querySelector('.sc-content');const text=t=>{let p=document.createElement('p');p.textContent=DISTORT.text(t);host.appendChild(p)};for(const l of b.lines||[]){text(l.jp);text(l.zh)}if(b.text)text(b.text);if(r.damage)text('疲劳点 −'+r.damage);if(r.claimedReward)text('罐装咖啡 ×1 已放入背包');if(r.lead)text(r.lead);const button=(label,fn)=>{const x=document.createElement('button');x.className='rpg-action';x.style.cssText='display:block;width:100%;white-space:pre-wrap;margin:10px 0;text-align:left';x.textContent=label;x.onclick=fn;host.appendChild(x)};
if(r.death){text('死亡结局：嘴上功夫。死因：街头斗殴。调查状态：中断。207号室的秘密依旧无人知晓。');button('读取存档 / 重新开始',close)}else if(b.choices){const options=b.choices.map((c,i)=>({t:c.tone+'\n'+c.jp+'\n'+c.zh,fn:()=>{if(choose(id,i)){draw(id);if(state().events[id].damage)injury()}}}));const altered=V51.whisper(options);for(const c of altered||options)button(DISTORT.text(c.t,true),c.fn);if(altered?.[0]?.note)text(altered[0].note)}else button('继续',close);overlay.querySelector('button')?.focus()}
function injury(){if(window.AUDIO)AUDIO.sfx('ng');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){overlay.animate([{background:'#8b1825e8',transform:'translateX(-3px)'},{background:'#080912e8',transform:'translateX(0)'}],{duration:220})}}
function gift(id,target){if(id!=='sc-coffee'||target!=='gotanda'||!(campaign.items?.[id]>0))return false;const r=campaign.dayInvestigation?.stations?.[target];if(!r||r.relation!=='拒绝交谈')return false;campaign.items[id]--;r.relation='可重新交谈';r.repairs=(r.repairs||0)+1;campaignSave();return true}
ITEMS.push({id:'sc-coffee',icon:'☕',name:'罐装咖啡',desc:'旁观者赠送。可向拒绝交谈的五反田调查司机表示歉意；只恢复交谈机会。'});
window.STREET={data,state,begin,choose,show,gift,achievements,resume(){if(campaign?.streetConflict?.active){window.STREET_WALK?.restoreView();draw(campaign.streetConflict.active)}},bag(){const c=campaign.items?.['sc-coffee']||0;return c?'<button class="rpg-action" onclick="if(STREET.gift(\'sc-coffee\',\'gotanda\')){UI.toast(\'恢复一次交谈机会\');UI.go(\'bag\')}else UI.toast(\'需要五反田调查司机已拒绝交谈\')">赠送罐装咖啡给五反田调查司机</button>':''}};
// Street encounters are scheduled by STREET_WALK at safe movement boundaries.

})();
/* Restore unfinished encounters after loading; no timers advance the encounter. */
(()=>{
let observed=null;
setInterval(()=>{if(typeof campaign==='undefined'||!campaign)return;if(observed!==campaign){observed=campaign;document.querySelector('.sc-overlay')?.remove();if(campaign.streetConflict?.active&&campaign.hp>0)STREET.resume();else if(campaign.streetWalk?.pending&&campaign.hp>0)STREET_WALK.restore()}},500);
const base=UI.settingsPage;UI.settingsPage=function(){base.apply(this,arguments);if(INV.dev()){const box=document.createElement('section');box.className='rpg-panel';box.innerHTML='<h2>街头冲突 · 隔离测试</h2><p>使用临时角色运行分支，不保存、不发放正式奖励。</p>';for(const d of STREET.data){const b=document.createElement('button');b.className='rpg-action';b.textContent=d.npc+'：所有分支测试';b.onclick=()=>{const original=campaign,save=campaignSave;const results=[];try{campaignSave=()=>{};for(let i=0;i<3;i++){for(const second of [0,1,2]){campaign={day:3,hp:10,san:100,cash:9000,actions:3,items:{}};STREET.begin(d.id);STREET.choose(d.id,i);if(STREET.state().active)STREET.choose(d.id,second);results.push({first:i,second,hp:campaign.hp,san:campaign.san,items:campaign.items,result:STREET.state().events[d.id].node,death:campaign.streetDeath||null})}}}finally{campaign=original;campaignSave=save}let pre=box.querySelector('pre');if(!pre){pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';box.appendChild(pre)}pre.textContent=JSON.stringify(results,null,2)};box.appendChild(b)}app.appendChild(box)}};
})();

/* Third-phase supplement: one read-only station event hint layer. */
(()=>{'use strict';
 const C=()=>typeof campaign!=='undefined'?campaign:null;
 const readExplore=()=>C()?.explore||{};
 const list=v=>v==null?[]:Array.isArray(v)?v:[v];
 const timeMinutes=()=>{try{return TM.now()%1440}catch(_){return 720}};
 const isNight=()=>{const n=timeMinutes();return n>=1080||n<300};
 // A pure reflection of the existing exploration condition vocabulary; do not call EXPLORE.cond
 // because its implementation initializes saved state while evaluating conditions.
 function allowed(w){if(!w)return true;const s=readExplore(),f=s.flags||{},t=s.today||{},k=C()?.kaidan||{};
  if(w.all&&!w.all.every(allowed))return false;if(w.any&&!w.any.some(allowed))return false;
  if(w.not&&allowed(w.not))return false;
  if(w.night!=null&&isNight()!==w.night)return false;
  if(w.echo!=null&&!!(window.ECHO&&ECHO.unlocked())!==w.echo)return false;
  if(w.flag&&!list(w.flag).every(x=>f[x]))return false;
  if(w.notFlag&&list(w.notFlag).some(x=>f[x]))return false;
  if(w.today&&!list(w.today).every(x=>t[x]===C()?.day))return false;
  if(w.notToday&&list(w.notToday).some(x=>t[x]===C()?.day))return false;
  if(w.kaidan&&!list(w.kaidan).every(x=>k[x]))return false;
  const has=(v,key)=>{const [id,x]=String(v).split(':');return !!k[id]&&(k[id][key]||[]).includes(x)};
  for(const [field,key] of [['seen','seen'],['evidence','evidence'],['rule','rules'],['outcome','outcomes']])if(w[field]&&!list(w[field]).every(x=>has(x,key)))return false;
  if(w.notRule&&list(w.notRule).some(x=>has(x,'rules')))return false;
  return true;
 }
 const registry=[];
 function register(e){if(!e||typeof e.id!=='string'||typeof e.station!=='string'||typeof e.available!=='function')throw Error('Invalid station event');if(!registry.some(x=>x.id===e.id))registry.push(e)}
 // Existing daytime scene engine supplies the original 24-clue state, never a second clue store.
 const days=['kitashinagawa','gotanda','shimbashi','ueno'];
 for(const id of days)register({id:'day:'+id,station:id,available:()=>{
  const c=C();if(!c||c.day<2||c.day>5||c.firstDayComplete===false)return false;
  const d=c.dayInvestigation?.stations?.[id]||{},flags=d.flags||{},scene=window.DAYINV?.scenes?.[id];if(!scene)return false;
  return scene.objects.some(o=>{const key=o[0];if(flags['look_'+key])return false;
   if(key==='elder'&&c.investigation?.clues?.['DAY-KS-02'])return false;
   if(key==='witness'&&c.investigation?.clues?.['DAY-GD-01'])return false;
   if(key==='worker'&&d.relation==='拒绝交谈'&&!c.investigation?.clues?.C03&&!c.investigation?.clues?.C13)return false;
   return true});
 }});
 // Use actual flags, daily encounter and kaidan outcomes; repeating generic NPC dialogue does not count.
 register({id:'kaidan:saru:rumor',station:'shinagawa',available:()=>!readExplore().flags?.sgRumor&&allowed({night:false})});
 register({id:'kaidan:saru:night',station:'shinagawa',available:()=>{
  const c=C(),r=c?.kaidan?.saru||{},s=readExplore();return !!s.flags?.sgRumor&&isNight()&&s.today?.saru!==c.day&&!s.flags?.sgReturned&&!r.outcome;
 }});
 register({id:'kaidan:saru:return',station:'shinagawa',available:()=>isNight()&&!!C()?.kaidan?.saru?.evidence?.includes('ticket')&&!readExplore().flags?.sgReturned&&readExplore().today?.saru!==C()?.day});
 register({id:'kaidan:kage:rumor',station:'ueno',available:()=>!isNight()&&!C()?.kaidan?.kage?.seen?.includes('rumor')});
 register({id:'kaidan:kage:night',station:'ueno',available:()=>isNight()&&!readExplore().flags?.ueShadowGone&&allowed({night:true})});
 register({id:'kaidan:exit:night',station:'shinjuku',available:()=>isNight()&&!C()?.kaidan?.exit?.outcome&&allowed({night:true})});
 // Other departments can register stable, currently reachable events without exposing categories.
 function sources(station){if(!C()||!station)return[];return registry.filter(e=>e.station===station).filter(e=>{try{return !!e.available()}catch(_){return false}}).map(e=>e.id)}
 function hasNewExploration(station){return sources(station).length>0}
 function draw(){const svg=app?.querySelector('.tokyo-svg');if(!svg)return;
  // Remove older marker sources first. One SVG group per station no matter how many sources.
  svg.querySelectorAll('.event-mark,.unified-event-mark').forEach(e=>e.remove());
  if(!C())return;
  const ns='http://www.w3.org/2000/svg';for(const st of stations){if(!hasNewExploration(st.id))continue;
   const g=document.createElementNS(ns,'g');g.classList.add('unified-event-mark');g.setAttribute('aria-hidden','true');g.setAttribute('pointer-events','none');
   const c=document.createElementNS(ns,'circle');c.setAttribute('cx',st.x+3);c.setAttribute('cy',st.y-19);c.setAttribute('r','7.4');c.setAttribute('fill','#282b31');c.setAttribute('stroke','#b69b62');c.setAttribute('stroke-width','1.2');
   const t=document.createElementNS(ns,'text');t.setAttribute('x',st.x+3);t.setAttribute('y',st.y-15);t.setAttribute('text-anchor','middle');t.setAttribute('stroke','none');t.setAttribute('fill','#e0c17c');t.setAttribute('font-size','12');t.setAttribute('font-weight','bold');t.textContent='!';g.append(c,t);svg.appendChild(g);
  }
 }
 const previousPaint=paintMap;paintMap=function(){previousPaint.apply(this,arguments);const note=app?.querySelector('#station-info .ex-mapnote');if(note)note.remove();draw()};
 const previousHome=tokyoHome;tokyoHome=function(){previousHome.apply(this,arguments);const note=app?.querySelector('#station-info .ex-mapnote');if(note)note.remove();draw()};
 const previousDistrict=renderDistrict;renderDistrict=function(){previousDistrict.apply(this,arguments);
  const entry=app?.querySelector('.ex-entry');if(entry){const heading=entry.querySelector('h2');if(heading)heading.textContent='街区探索';entry.querySelectorAll('p').forEach(p=>p.remove());const b=entry.querySelector('#ex-enter');if(b)b.textContent='进入街区';}
  // The investigation and the kaidan remain separately accessible inside the station.
 };
 // Developer-only diagnostics: do not mutate game state when checking source availability.
 const previousSettings=UI.settingsPage;UI.settingsPage=function(){previousSettings.apply(this,arguments);
  if(!INV.dev())return;
  const box=document.createElement('section');box.className='rpg-panel';box.innerHTML='<h2>统一地图标记 · 只读检查</h2><p>仅开发者可见；不会触发事件或修改存档。</p><button class="rpg-action" id="unified-hint-check">查看标记来源</button><pre style="white-space:pre-wrap"></pre>';app.appendChild(box);
  box.querySelector('#unified-hint-check').onclick=()=>{const result={day:C()?.day,time:timeMinutes(),stations:stations.filter(s=>sources(s.id).length).map(s=>({id:s.id,events:sources(s.id)}))};box.querySelector('pre').textContent=JSON.stringify(result,null,2)};
 };
 window.EXPLORATION_HINTS={register,sources,hasNewExploration,draw,allowed,events:registry};
})();

/* Existing taunts retain their original selection, probabilities and penalties. */
window.installStreetTaunts=()=>{if(!window.NpcTaunts)return;const base=NpcTaunts.handle;NpcTaunts.handle=function(correct,scene,container,after){const ev=base.apply(this,arguments);if(!ev||!container||!campaign||campaign.day<2||campaign.day>5)return ev;const hash=Array.from(ev.line.jp).reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))|0,0);const id='SC-LEGACY-'+(hash>>>0);if(!STREET.data.some(d=>d.id===id)){const src=STREET.data.find(d=>d.district==='ueno');STREET.data.push({id,district:scene,day:2,npc:ev.line.type||'路人',opening:{jp:ev.line.jp,zh:ev.line.zh},choices:src.choices,branches:{calm:{lines:[{jp:'……。',zh:'对方没有继续说话。你结束争执，继续手头的事。'}]},firm:{lines:[{jp:'……言い過ぎたよ。',zh:'……是我说过头了。对方移开视线，不再纠缠。'}]},harsh:{lines:[{jp:'口の悪いやつだな。もういい。',zh:'嘴真臭。算了。对方嘟囔着转过身，没有发生肢体冲突。'}]}}});const d=STREET.data.at(-1);d.choices=d.choices.map((x,i)=>({...x,...(i===2?{jp:'偉そうにすんな。何様だよ。',zh:'少摆架子。你算老几啊。'}:{})}))}const b=document.createElement('button');b.className='rpg-action';b.textContent='回应这句话（中日双语）';b.onclick=()=>STREET.show(id);container.appendChild(b);return ev}};
/* Phase III — event hints, reusable notebook, unified gifts and save-safe daily entry */
(()=>{'use strict';
const regionIds=['kitashinagawa','gotanda','shimbashi','ueno'];
const eventRegistry=[];
function addEvent(e){if(!e||!e.id||!e.station||typeof e.available!=='function')throw Error('Bad exploration event');if(eventRegistry.some(x=>x.id===e.id))return;eventRegistry.push(e)}
function stationRecord(id){const d=campaign?.dayInvestigation;return d?.stations?.[id]||{flags:{},dayPaid:{}}}
function got(id,n){return !!campaign?.investigation?.clues?.['DAY-'+({kitashinagawa:'KS',gotanda:'GD',shimbashi:'SB',ueno:'UE'}[id])+'-0'+n]}
function eventDay(){return campaign&&campaign.day>=2&&campaign.day<=5&&campaign.firstDayComplete!==false}
// Availability is computed from saved state, never randomized during map render.
for(const id of regionIds){const sc=DAYINV.scenes[id];for(const [key] of sc.objects){addEvent({id:'day:'+id+':'+key,station:id,available:()=>{if(!eventDay())return false;const s=stationRecord(id);const f=s.flags||{};if(key==='worker'&&s.relation==='拒绝交谈'&&!(campaign.investigation?.clues?.C03||campaign.investigation?.clues?.C13))return false;if(key==='elder'&&got(id,2))return false;if(key==='witness'&&got(id,1))return false;if(key==='photoA'&&f.photoMatch)return false;if(key==='log'&&got(id,2))return false;if(key==='closed'&&got(id,1))return false;return !f['look_'+key]}})}}
// Unrelated, independent investigations may also set markers without being converted to hotel evidence.
addEvent({id:'independent:ueno:shadow',station:'ueno',available:()=>!!(campaign&&campaign.day>=2&&campaign.day<=5&&campaign.kaidan?.kage?.status==='rumor')});
function visible(station){return eventRegistry.some(e=>e.station===station&&e.available())}
function paintMarkers(){const svg=app.querySelector('.tokyo-svg');if(!svg||!campaign)return;svg.querySelectorAll('.event-mark').forEach(n=>n.remove());for(const s of stations){if(!visible(s.id))continue;const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g'),c=document.createElementNS(ns,'circle'),t=document.createElementNS(ns,'text');g.classList.add('event-mark');g.setAttribute('aria-hidden','true');c.setAttribute('cx',s.x+3);c.setAttribute('cy',s.y-20);c.setAttribute('r','7.5');t.setAttribute('x',s.x+3);t.setAttribute('y',s.y-16.4);t.textContent='!';g.append(c,t);svg.append(g)}}
// top-level map wraps are already composed at startup; append markers *after* rendering.
const oldMap=tokyoHome;tokyoHome=function(){oldMap.apply(this,arguments);paintMarkers()};
const oldPaint=paintMap;paintMap=function(){oldPaint.apply(this,arguments);paintMarkers()};
// Actual player observations, not prefilled quest solutions. Legacy discovered clues are also readable.
const notebook={
kitashinagawa:[['beam','旧街景资料中的老店门前有一道倾斜的木梁。'],['site','停业商铺的门框和窗户与旧街景照相符。'],['elderTrust','街角老人谈起片山年轻时与几名朋友聚会的往事。']],
gotanda:[['witnessPlace','一位夜班司机说曾在酒店后门小巷转角见到救护车，但记不清日期。'],['dispatch','调度告示提到出车、绕行、返场。'],['log','已获许可查阅部分行车资料；尚不能独立确定案发日期。']],
shimbashi:[['noRoomAsked','你曾拿着酒店记录向前员工核对207号室。'],['slip','前员工承认协助过207号室房卡交接。'],['workAsked','你已了解他曾在品川旅馆工作及他对自身职责的描述。']],
ueno:[['album','旧相册中有几张年代相近的合影，人数相近不能代表人物相同。'],['photoDetail','旧友照片里可辨认出袖口补丁与旧站牌。'],['photoMatch','你选择将补丁、站牌和人物站位交叉比对。'],['backDate','相框背后留有一行旧日期。']]};
const titles={kitashinagawa:'北品川',gotanda:'五反田',shimbashi:'新桥',ueno:'上野'};
function notesPage(){const entries=Object.values(campaign.cityVisits?.notes||{});const blocks=entries.length?['<section class="phase3-notes"><h3>白天走访 · 交叉核对</h3>'+entries.map(t=>'<p>'+esc(t)+'</p>').join('')+'</section>']:[];for(const id of regionIds){const s=stationRecord(id),f=s.flags||{};const texts=notebook[id].filter(([k])=>f[k]).map(([,v])=>v);const sources=GAME_DATA.d['investigation/clues'].clues.filter(c=>c.id.startsWith('DAY-'+({kitashinagawa:'KS',gotanda:'GD',shimbashi:'SB',ueno:'UE'}[id])+'-')&&campaign?.investigation?.clues?.[c.id]);for(const c of sources){if(!texts.some(v=>v===c.desc)&&c.desc)texts.push(c.desc)}if(texts.length)blocks.push(`<section class="phase3-notes"><h3>${titles[id]}</h3><ul>${texts.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></section>`)}
UI.scene('notes',notesPage);app.innerHTML='<section class="rpg-panel"><div class="rpg-kicker">PERSONAL NOTES</div><h1>私人调查笔记</h1><p class="rpg-tiny">仅记录已经看到、听到或取得的资料。记忆和目击不等于已证实的案件事实。</p>'+(blocks.join('')||'<p>还没有值得记录的现场观察。</p>')+'<button class="survival-btn alt" id="notes-back">返回地图</button></section>';app.querySelector('#notes-back').onclick=()=>tokyoHome()}
// Archive is the natural entry point; do not replace the evidence or inference UI.
const oldArchive=UI.archivePage;UI.archivePage=function(){oldArchive.apply(this,arguments);const section=app.querySelector('#file-6');if(section){let b=document.createElement('button');b.className='survival-btn alt';b.textContent='📓 打开私人调查笔记';b.onclick=notesPage;section.appendChild(b)}};
const gifts=[{id:'sc-coffee',name:'罐装咖啡',price:180,icon:'☕',targets:['gotanda']},{id:'day-snack',name:'日式点心',price:360,icon:'🍡',targets:['kitashinagawa']},{id:'day-tea',name:'慰问茶点',price:520,icon:'🍵',targets:['kitashinagawa','ueno']}];
for(const x of gifts)if(!ITEMS.some(y=>y.id===x.id))ITEMS.push({id:x.id,name:x.name,icon:x.icon,desc:'普通礼物；赠送只能缓和关系，不能购买证言。'});
function buy(id){const x=gifts.find(g=>g.id===id);if(!x||!campaign||campaign.cash<x.price)return false;campaign.items??={};campaign.cash-=x.price;campaign.items[id]=(campaign.items[id]||0)+1;campaignSave();return true}
function give(id,station){const x=gifts.find(g=>g.id===id),s=campaign?.dayInvestigation?.stations?.[station];if(!x||!s||!x.targets.includes(station)||!campaign.items?.[id])return {ok:false,msg:'对方没有接受这份礼物，物品仍在背包里。'};if(station==='shimbashi'||s.relation==='拒绝交谈'&&station!=='gotanda')return {ok:false,msg:'严重的关系破裂需要可靠证据，而不只是礼物。'};if(s.relation!=='戒备'&&s.relation!=='拒绝交谈')return {ok:false,msg:'目前没有需要借礼物恢复的交谈机会。'};campaign.items[id]--;s.relation='可重新交谈';s.repairs=(s.repairs||0)+1;campaignSave();return {ok:true,msg:'对方接受了礼物，愿意重新交谈。尚未提供新的证词。'}}
// Keep old street rewards in campaign.items; idempotency is already enforced by claimedReward.
const oldDistrict=renderDistrict;renderDistrict=function(){oldDistrict.apply(this,arguments);if(!campaign||campaign.day<2||campaign.day>5)return;const spot=app.querySelector('.district-top');if(!spot)return;const b=document.createElement('button');b.className='rpg-action';b.textContent='杂货店 · 礼品';b.onclick=shopPage;spot.appendChild(b)};
function shopPage(){UI.scene('giftShop',shopPage);app.innerHTML='<section class="rpg-panel phase3-shop"><h1>街角杂货店</h1><p>当前现金 ¥'+campaign.cash+'。购买物品将真实扣款并放入原有背包。</p><div id="gift-list"></div><button class="survival-btn alt" id="gift-exit">返回地图</button></section>';const host=app.querySelector('#gift-list');gifts.forEach(g=>{const b=document.createElement('button');b.className='rpg-action';b.textContent=g.name+' ¥'+g.price;b.onclick=()=>{UI.toast(buy(g.id)?'已购买 '+g.name:'现金不足');shopPage()};host.appendChild(b)});app.querySelector('#gift-exit').onclick=()=>tokyoHome()}
const oldBag=UI.bagPage;UI.bagPage=function(){oldBag.apply(this,arguments);const root=app.querySelector('.et-page');if(!root)return;const panel=document.createElement('section');panel.className='rpg-panel';panel.innerHTML='<h2>礼物与人物关系</h2><p class="rpg-tiny">仅在适当的关系状态下才有赠礼选项；物证不能赠送。</p>';for(const x of gifts){if(!campaign.items?.[x.id])continue;for(const station of x.targets){const b=document.createElement('button');b.className='rpg-action';b.textContent=x.name+' → '+titles[station];b.onclick=()=>{const r=give(x.id,station);UI.toast(r.msg);UI.bagPage()};panel.appendChild(b)}}root.appendChild(panel)};
// Isolated tests operate on a temporary campaign, never save player data.
const prevSettings=UI.settingsPage;UI.settingsPage=function(){prevSettings.apply(this,arguments);if(!INV.dev())return;const panel=document.createElement('section');panel.className='rpg-panel';panel.innerHTML='<h2>第三阶段 · 隔离检查</h2><button class="rpg-action" id="phase3-check">检查四站事件、每日行动和礼品库存</button><pre style="white-space:pre-wrap"></pre>';app.appendChild(panel);panel.querySelector('#phase3-check').onclick=()=>{const rows=regionIds.map(id=>({station:id,events:eventRegistry.filter(x=>x.station===id).length,visible:visible(id),lastInvestigation:stationRecord(id).lastInvestigationDay||null,paidToday:!!stationRecord(id).dayPaid?.[campaign.day]}));panel.querySelector('pre').textContent=JSON.stringify({day:campaign.day,actions:campaign.actions,regions:rows,bag:gifts.map(x=>[x.name,campaign.items?.[x.id]||0])},null,2)}};
function attachBag(){const root=app.querySelector('.et-page');if(!root)return;const panel=document.createElement('section');panel.className='rpg-panel';panel.innerHTML='<h2>礼物与人物关系</h2><p class="rpg-tiny">仅修复合适的交谈关系，不自动产生证词。</p>';for(const x of gifts){if(!campaign.items?.[x.id])continue;for(const target of x.targets){const b=document.createElement('button');b.className='rpg-action';b.textContent=x.name+' → '+titles[target];b.onclick=()=>{const r=give(x.id,target);UI.toast(r.msg);UI.go('bag')};panel.appendChild(b)}}root.appendChild(panel)}
window.DAYPHASE3={addEvent,visible,paintMarkers,notesPage,shopPage,buy,give,attachBag,gifts,events:eventRegistry};
})();

