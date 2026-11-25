/* ==== engine/survival/87-hotel-chapter.js ==== */
/* ===================================================================
   【V18 第一章引擎：像素探索 + 文字调查（MapRenderer · InteractionManager ·
     EvidenceManager · RuleManager · QuestManager）】
   内容全部来自 story/chapter1/：
     chapter.json  章节信息、目标、结局、规则、开场
     maps.json     像素地图（大厅、走廊、保管室、后巷）、物件、出入口
     npcs.json     人物与时间表
     evidence.json 证据与证词
     scenes.json   文字调查场景（207号室）的热点
     nodes/*.json  所有对话与剧情节点
   这个文件只负责「怎么运行」：移动、绘制、时间流逝、条件判断、存档。
   存档：campaign.hotelCase.v18（旧版 v15 存档会自动迁移）
   =================================================================== */

/* 第一章：港屋酒店污染与黑色大丽花 */
const DAHLIA=(()=>{
 const state=()=>campaign.dahlia??={stage:'hidden',read:{},slots:[],errors:0};
 const sealed=c=>!!c?.dahlia?.sealed;
 const active=()=>campaign?.case1?.state==='active'&&!sealed(campaign);
 const wake=[
  '你在 206 醒来。天已经亮了，门外传来清扫车滚过走廊的声音。你躺着缓了一会儿，昨晚的遭遇让你深感不安，这间酒店危机四伏，你不由得为接下来的调查担忧。',
  '你强打起精神，总之先调查207里究竟发生了什么吧。'
 ];
 const farewell='你已经知道该回哪儿了。至于那间浴室里究竟发生过什么，接下来，靠你自己成为一名真正的侦探了。';
 const actors={
  mori:{name:'森经理',title:'维修报价',map:'lobby',lines:['森把维修告示按平。手抬起来，又原样按了一遍。','上一家的报价太高，他找了两家才把钱凑出来。「这种地方省一点，那种地方再挪一点。总算还能接着开门。」'],choices:['那这次修理能按时做完吗？','您真是一个会赚钱的人啊。','开一家酒店，每个月都得这么算吗？'],ending:'报价单',steps:['森低头，把两张报价单的边角对齐。拇指在合计数上停了很久。','大厅渐渐安静下来。管道里短促地响了一声。','他收好报价单，绕过茶几。直到他的影子完全盖住你的鞋尖，你才发现自己已经来不及后退。'],safe:'森把报价单叠好。维修还有几处在等确认。'},
  sato:{name:'佐藤 美穂',title:'前台换班前',map:'lobby',lines:['佐藤在便签上算这个月要寄回去的钱。','「以前是大哥算。现在二哥上夜班，手头也紧，我发工资的时候就多给家里留一点。」'],choices:['你们平时会一起商量这个数吗？','你哥哥真会吸你血啊。','您先算，我等一会儿。'],ending:'第三声铃响',steps:['佐藤的笔停在寄款金额最后一位。她合上旧账本，沿着封皮轻轻抚了一下。','柜台后短促地响了一声水。电话响到第三声，她才抬起头。','她慢慢从柜台后走出来。她伸手的那一刻，铃声断了。'],safe:'佐藤把这次的数写好，把便签夹回账本。'},
  takahashi:{name:'高桥 由美',title:'还没下班',map:'office',lines:['高桥看了一眼手机。','「他说今晚不来了。也正常，他最近忙。反正我也没特地等他。」'],choices:['您刚才不是说要下班了吗？','他根本不爱你吧。','那我陪您再坐一会儿？'],ending:'没有新消息',steps:['她看着你，忽然笑了。墙里短促地响了一声水。','手机还没落地，她已经扑了过来。镜头猛地倒下，最后照见亮着的屏幕。没有新消息。'],safe:'高桥扣下手机，把桌上的账册摞在一起。'},
  kobayashi:{name:'小林 辰夫',title:'酒店外，游行经过时',map:'alley',lines:['街上有一队日本人在游行，举着「外国人差別をなくそう」的牌子。有人喊口号，有人下班后还穿着工服，只跟着走。','你和小林在酒店门口站了一会儿。小林说：「都这个点了，还有人肯出来啊。」'],choices:['他们要走到哪儿？','这些人不会以为真的有用吧。','右边那个举牌的人，刚才好像就在便利店见过。'],ending:'街角的口号',steps:['小林还看着街上。','「不知道。」','等队伍走过去，他才转过来。街角还听得见零零落落的口号声。','「是啊，肯定没用的吧。」','他说得很平静，像是终于同意了你。身后的排水管短促地响了一声。路灯还亮着，他脸上的阴影却一点点漫过了眼睛。','小林朝你走过来。你往后退了一步。\n他动手。画面切黑，街角的口号还没喊完。'],safe:'你们站了一会儿，等队伍转过街角。小林把手电收回腰间。'},
  inoue:{name:'井上 和子',title:'清扫车旁',lines:['井上扶了扶清扫车。「有些活明知道费力，最后还是得自己做。」'],choices:['这车要推到哪儿？','您就是太好说话了。','我帮您搭把手吧。'],safe:'「来，帮我扶一下桶。」等你扶稳了，井上接着说起刚才的事。'}
 };
 const ids=Object.keys(actors).filter(id=>id!=='inoue');
 const idFor=id=>'death_dahlia_'+id;
 const endings=GAME_DATA.d['investigation/death-endings'].endings;
 let number=Math.max(...Object.values(endings).map(e=>Number(e.no)||0));
 for(const id of ids){
  const actor=actors[id];
  endings[idFor(id)]={no:String(++number),name:actor.ending,fate:'死亡',finalRemark:'调查员在港屋酒店调查期间遇害。',
   steps:[...actor.steps.map((line,i)=>({text:line,scene:actor.map,fx:i===actor.steps.length-1?(id==='takahashi'?'glitch':'dark'):undefined,sfx:line.includes('短促地响')?'drip':i===actor.steps.length-1?'buzz':undefined})),{text:'',scene:'black',fx:'dark'}]};
 }
 endings[idFor('room')]={no:String(++number),name:'无名之间',fate:'失踪',finalRemark:'B2 多了一位登记不出姓名的住客。',
  steps:[{text:'床上的影子坐了起来。它用你的声音，念出最后一个错音。',scene:'black',fx:'flicker'},{text:'你低头看时，自己已经躺在了那张床上。',scene:'black',fx:'dark'}]};
 const deathIds=[...ids,'room'].map(idFor);
 const modal=(title,lines,buttons)=>UI.modal({title,html:lines.map(line=>'<p>'+esc(line)+'</p>').join(''),buttons});
 function bloom(progress=0){
  if(typeof document==='undefined')return;
  const body=document.querySelector('.et-modal-back .et-modal-body');
  if(!body)return;
  const flower=document.createElement('div');
  flower.className='dahlia-bloom';flower.setAttribute('aria-hidden','true');
  flower.style.setProperty('--bloom-size',1+progress*.075);
  for(let i=0;i<20;i++){
   const petal=document.createElement('i');
   petal.style.setProperty('--petal-angle',i*36+(i>=10?18:0)+'deg');
   petal.style.setProperty('--petal-length',i<10?'34px':'24px');
   flower.appendChild(petal);
  }
  body.prepend(flower);
 }
 function offer(id,flags){
  return !!(actors[id]&&(flags['dahlia:known:'+id]||flags['met:'+id])&&!flags['dahlia:chat:'+id]&&
   (id==='inoue'||active())&&(id!=='mori'||flags['day:notice']||flags['obj:lobby:4,7']||flags['obj:lobby:7,7'])&&
   (id!=='takahashi'||H18.where()==='office'));
 }
 function chat(id,done){
  const actor=actors[id];
  modal(actor.title,actor.lines,actor.choices.map((label,i)=>({label,fn:()=>{
   if(i===1&&id!=='inoue'&&active()){
    PERIL.checkpoint(true);
    PERIL.die(idFor(id));
    return;
   }
   H18.apply({flag:'dahlia:chat:'+id});
   modal(actor.name,[...(id==='inoue'&&i===1?['「你倒是说得轻巧。」']:[]),actor.safe],[{label:'继续',fn:done}]);
  }})));
 }
 const witnessText=['前台有位住客等得不耐烦，随口说：「你怎么老在算钱？」','佐藤慢慢合上账本。柜台后响了一声水。她绕出柜台，走到那位住客面前。','楼上的管子忽然安静了。佐藤停下脚步，低头看了看自己的手。「……您刚才要什么来着？」'];
 function witness(done){
  if(state().witness){done();return}
  if(window.AUDIO)AUDIO.sfx('drip');
  modal('前台',witnessText,[{label:'继续',fn:()=>{state().witness=true;campaignSave();done()}}]);
 }
 function block(back){
  if(!active()||!ROOMFILE.deathKnown(campaign))return false;
  const s=state();
  if(s.stage==='hidden'){s.stage='blocked';campaignSave()}
  const reveal=()=>{
   if(window.AUDIO)AUDIO.sfx('drip');
   modal('207 · 浴室',[s.stage==='blocked'?'你刚蹲下试着看清地砖接缝，排水口便响了一声。你站起来，再蹲下。水声又从同一个地方响起。黑花瓣逆着水，从排水口浮了上来。':'浴室又响起了那声水响。你仍然无法完成勘查。','排水管通往地下。前台那声水响也是从这个方向来的。'],[{label:'沿管道下到 B2',fn:source},{label:'退回走廊',fn:back}]);
  };
  witness(reveal);
  return true;
 }
 function source(){
  const s=state();
  if(s.stage==='blocked'){
   s.stage='found';campaignSave();
   if(window.AUDIO)AUDIO.sfx('drip');
  }
  const items={
   clips:['收藏家的剪报','最早的剪报把受害者写成一个响亮的绰号。后面一页用铅笔补了姓名：「エリ｜ザベス」。'],
   journal:['收藏家的日记','日记最后一页夹着一张译名校样。姓氏写作「ショー｜ト」。旁边有人划掉了两个近音拼法。']
  };
  const ready=['clips','journal','shell'].every(k=>s.read[k]);
  modal('B2 · 无名之间',['遗物柜深处长出了一间不在图纸上的客房。床上躺着一道影子。','黑色大丽花在柜底盛开。水响一次，床上的影子就换一张脸。你认出那是前台那一瞬间的神情。','柜里是一位长住收藏家的遗物。剪报一次次重复花的名号，人的真名却几乎从未被写下。',...(ready?['姓名的两段记录和貝都已备好。']:[])],[
   ...Object.entries(items).map(([key,[label,line]])=>({label:label+(s.read[key]?' · 已查看':''),fn:()=>modal(label,[line],[{label:'记下原文',fn:()=>{s.read[key]=true;campaignSave();source()}}])})),
   ...(!s.read.shell?[{label:'回楼上找井上',fn:()=>{
    modal('B2 · 入库签',['遗物柜旁夹着一张入库签。经手人一栏写的是井上。'],[{label:'回楼上',fn:()=>H18.endDialog()}]);
   }}]:[]),
   ...(ready?[{label:'拼出档案中的姓名',fn:puzzle}]:[]),
   {label:'先回楼上',fn:()=>H18.active()?H18.endDialog():tokyoHome()}
  ]);
  bloom();
 }
 function needsShell(){return active()&&campaign.dahlia?.stage==='found'&&!campaign.dahlia.read.shell}
 function getShell(done){
  modal('井上 和子',['井上认得你从地下带来的入库签。她从清扫车里取出一只用旧毛巾包好的貝。','「花和它是一起入库的。里面的字很小，你拿到灯下看看。」','貝内侧刻着一行字：按档案确认姓名，以同源之貝封核。'],[
   {label:'收好貝',fn:()=>{state().read.shell=true;campaignSave();done()}}
  ]);
 }
 const answer=['エリ','ザベス','ショー','ト'];
 const options=[['エル','エリ','アリ'],['ザベト','ザベラ','ザベス'],['ショー','ショル','ジョー'],['ド','ト','トー']];
 function puzzle(message){
  const s=state();
  if(s.slots.length===answer.length){
   modal('B2 · 封核',['「エリザベス・ショート」。你念完档案上的姓名。','黑花第一次凋谢。井上交给你的貝合拢，把花核封在里面。水声停了。'],[{label:'封存，回 207',fn:()=>{
    s.stage='sealed';s.sealed=true;campaignSave();
    H18.openScene('room207');
   }}]);return;
  }
  const i=s.slots.length;
  modal('无名之间 · 姓名',[s.slots.map((v,j)=>j===2?'・'+v:v).join('')+'　'+Array(answer.length-i).fill('□').join(' '),
   message||'床上的影子还在重复那些近音。',...s.errors?['影子离床沿又近了一点。']:[]],[
   ...options[i].map(label=>({label,fn:()=>{
    if(label===answer[i]){s.slots.push(label);campaignSave();puzzle('花枝朝你近了一寸。');return}
    PERIL.checkpoint(true);
    s.errors++;
    if(s.errors>=3){PERIL.checkpoint(true);PERIL.die(idFor('room'));return}
    campaignSave();puzzle('那是影子的声音。档案上的写法不同。');
   }})),{label:'核对档案',fn:()=>modal('收藏家的记录',['剪报补记：エリ｜ザベス','日记校样：ショー｜ト'],[{label:'继续拼名',fn:()=>puzzle()}])},{label:'退到门外',fn:source}]);
  bloom(i);
 }
 function note(){
  if(!campaign?.hotelCase?.v18||!campaign.firstDayComplete||['closed','dead','submitted'].includes(campaign.case1?.state))return '';
  if(ROOMFILE.deathKnown(campaign))return farewell;
  const f=campaign.hotelCase.v18.flags||{},c=campaign.investigation?.clues||{},d=campaign.investigation?.deductions||{};
  if(c.C12&&c.C13)return '这回或许还得找井上。207 后来是她经手清扫的。拿旧锁给她看看，说不定她记得什么时候换的。';
  if(c.C13)return '退房了，行李却还在。或许该再看看二楼，那间浴室后来动过哪些地方。';
  if(!f.c2){
   if(!f.e1)return '或许先去看看 207 门外。房间还锁着，门口说不定留着东西。';
   if(!f.e2)return '或许我们该去找井上聊聊。她负责这层的清扫，说不定还记得那几天有没有人给 207 换毛巾。';
   if(!f.e3)return '或许我们该回前台看看。客房的钥匙和寄存东西，通常会放在那里。';
   if(!f['pre:mori'])return '或许我们该去找森经理聊聊看。他负责酒店，说不定知道 207 以前是怎么用的。';
   if(!f['pre:koba'])return '或许我们该去找小林聊聊。夜里是他巡楼，二楼有什么动静，他说不定留意过。';
   return '或许我们该再找井上聊聊。大家都提到过二楼，她上次却只叫我们别站在那扇门前。';
  }
  if(!c.C02)return '或许我们该去问问佐藤。她在前台管入住，应该知道 207 是从什么时候起不再接待客人的。';
  if(!c.C03||!d.D02)return '佐藤说现在当杂物间用。或许该把这句话和前台的登记簿对照一下。';
  if(!c.C04||!d.D03)return '或许我们该去找小林聊聊。夜里是他巡楼，后门要是来过车，他说不定记得。再看看那和 207 的交接单有没有关系。';
  return '我们去找森经理聊聊看吧。退房的记录归他管，他说不定知道这页为什么改过。';
 }
 function objective(c){
  if(c.dahlia?.stage==='blocked')return '沿 207 的管道查明地下的异常。';
  if(c.dahlia?.stage==='found')return c.dahlia.read.shell?'回 B2，收容黑色大丽花。':'调查 B2 的遗物，找井上核对入库的物件。';
  if(sealed(c)&&!ROOMFILE.solved(c))return '回 207，继续勘查浴室。';
  return '';
 }
 return {state,sealed,active,wake,farewell,actors,deathIds,offer,chat,witness,block,note,needsShell,getShell,objective,source};
})();

const H18=(function(){
const C1=GAME_DATA.story.chapter1||{};
const CH=C1.chapter||{},MAPS=C1.maps||{},NPCS=C1.npcs||{},EVID=C1.evidence||{},SCENES=C1.scenes||{};
const NODES={};(C1.nodes||[]).forEach(n=>NODES[n.id]=n);
const T=32,MW=16,MH=11,CW=T*MW,CHh=T*MH;
const END_CLOCK=720,START_HOUR=18;
const C1CFG=GAME_CONFIG.chapter1||{nights:3,timeScale:1,stuckMinutes:120};
const cost=min=>Math.round((min||0)*(C1CFG.timeScale||1)); // 调查、交谈、移动花费的时间（config 的 chapter1.timeScale 倍）
let DAY=false,nightStash=null; // v32：白天模式（startDay）。白天不走时钟、不触发夜间规则，人物按 schedule.day 站位
const PHASES=[{id:'day',name:'白天',from:-1},{id:'evening',name:'傍晚',from:0},{id:'night',name:'深夜',from:180},{id:'late',name:'凌晨',from:360}];
const SOLID=new Set('#CSTPVNRBDULKXGOWQrEFAHY'.split(''));
const PLAYER_PAL={h:'#3b2f4a',s:'#f0c9a0',b:'#6fc2a6',a:'#f4d38d',p:'#3e5388',k:'#222'};

/* ---------- 状态与存档 ---------- */
let busy=false,S=null,cv=null,ctx=null,raf=0,last=0,keys=new Set(),player=null,npcState={},tileCache={},ruleTimer=0,mode='pixel',sceneId=null,paused=false;
function H(){
 if(!campaign.hotelCase)campaign.hotelCase={visited:[],evidence:[],talks:{},trust:0,pressure:0,stance:'',ending:'',diary:[],scene:'lobby'};
 const h=campaign.hotelCase;h.visited??=[];h.evidence??=[];h.diary??=[];
 if(!h.v18){h.v18=migrateV15(h.v15);}
 const v=h.v18;
 v.map??='lobby';v.x??=8;v.y??=8;v.dir??='up';v.clock??=0;v.clockDay??=campaign.day;
 v.clues??=[];v.testimony??=[];v.flags??={};v.npc??={};v.intro??=false;v.visited??=[];if(v.intro&&!v.startDay)v.startDay=campaign.day; // 旧存档：从现在开始计算期限
 if(!v.ver){if(v.intro&&CH.seal)L(CH.seal.legacyFlag).forEach(f=>v.flags[f]=true);v.ver=22} // v22 以前已经开始调查的存档：不再封锁后面的内容
 if(campaign.caseCover)v.flags.commission=true; // 港屋酒店的委托（92-case-commission.js）
 for(const id of Object.keys(NPCS)){v.npc[id]??={trust:0,stress:0,mem:{}};v.npc[id].mem??={}}
 for(const [k,c] of Object.entries(EVID))if(c.old&&h.evidence.includes(c.old)&&!v.clues.includes(k))v.clues.push(k);
 if(v.clockDay!==campaign.day){v.clockDay=campaign.day;v.clock=0;Object.keys(v.flags).filter(k=>k.startsWith('tonight:')).forEach(k=>delete v.flags[k])}
 if(!MAPS[v.map])v.map='lobby';
 campaign.items??={};
 return h;
}
/* 旧版（v15「最后一位东京访客」）存档迁移：线索、证词、人物关系、钥匙与物品全部保留 */
function migrateV15(o){
 const v={clues:[],testimony:[],flags:{},npc:{},visited:[]};if(!o)return v;
 v.map=MAPS[o.map]?o.map:'lobby';v.x=o.x;v.y=o.y;v.dir=o.dir;v.clock=o.clock;v.clockDay=o.clockDay;v.intro=!!o.intro;
 v.clues=(o.clues||[]).filter(k=>EVID[k]);
 v.testimony=(o.versions||[]).map(id=>'t_'+id).filter(t=>EVID[t]);
 const f=o.flags||{};
 ['storageOpen','tookOriginal','returned','threatened','phoneHanded','tookPhone','copied','knockAnswered'].forEach(k=>{if(f[k])v.flags[k]=true});
 if(f.readRules)v.flags.readRules=true;
 campaign.items??={};
 if(f.room207Key)campaign.items.key207=1;if(f.storageKey)campaign.items.storageKey=1;if(f.coffee>0)campaign.items.coffee=(campaign.items.coffee||0)+f.coffee;
 if(f.tookOriginal&&!f.returned)campaign.items.notebookOriginal=1;if(f.tookPhone)campaign.items.oldPhone=1;
 for(const [id,n] of Object.entries(o.npc||{}))if(NPCS[id])v.npc[id]={trust:n.trust||0,stress:n.stress||0,mem:Object.assign({},n.mem||{})};
 if(v.npc.kobayashi&&v.npc.kobayashi.mem.readRules)v.flags.readRules=true;
 if(o.map==='room207'){v.map='corridor';v.x=5;v.y=6;v.dir='down'} // 207 现在是文字调查场景，旧位置移到门口
 return v;
}
const V=()=>H().v18,F=()=>V().flags,N=id=>V().npc[id];
function clueCount(){return V().clues.length}
function phase(){if(DAY)return 'day';const c=V().clock;return c>=360?'late':c>=180?'night':'evening'}
function phaseName(){return PHASES.find(p=>p.id===phase()).name}
function clockStr(){return TM.fmt(DAY?TM.dayClock():START_HOUR*60+V().clock)}
function save(){campaignSave()}
function log(t){const h=H();h.diary.push('DAY'+campaign.day+' '+clockStr()+' '+t);h.diary=h.diary.slice(-60);save()}
function item(id){return (campaign.items&&campaign.items[id])||0}
function addItem(id,n){campaign.items??={};campaign.items[id]=Math.max(0,(campaign.items[id]||0)+n);if(!campaign.items[id])delete campaign.items[id]}
function advance(min){if(DAY){if(min>0)V51.dayTime(min);refreshHUD();return}if(!min||min<0)return;const v=V();const before=phase();v.clock=Math.min(END_CLOCK,v.clock+min+(V51.tier()?.minutes||0));save();stuckCheck();if(v.clock>=600&&!F()['tonight:dawnWarn']&&v.clock<END_CLOCK){F()['tonight:dawnWarn']=true;toast('🌅 '+clockStr()+' · 天快亮了。'+(isLastNight()?'这是最后一夜——天亮后 207 就会重新开放。':''))}if(phase()!==before){placeNPCs(true);tileCache={};if(window.AUDIO)AUDIO.ambience(ambienceName());toast('⏰ '+clockStr()+' · 进入'+phaseName()+'，人们换了位置。')}if(v.clock>=END_CLOCK)setTimeout(dawn,60);else checkRules('clock');VERIFY.sync();refreshHUD()}
function npcAt(id){const st=npcState[id];if(st&&st.on)return st.map;const def=NPCS[id];if(!def)return null;const sc=schedFor(id);return sc?sc.map:null}
function schedFor(id){if(id==='tanaka'&&campaign.day>=2&&!F().tanakaWaiting)return {map:'shopping',x:6,y:3};const def=NPCS[id];let sc=def&&def.schedule&&def.schedule[phase()];if(Array.isArray(sc))sc=sc.find(x=>x&&(!x.when||cond(x.when)))||null;else if(sc&&sc.when&&!cond(sc.when))sc=null;return sc||null} // v32.3：同一时段可以写多个位置（按顺序取第一个条件满足的）
function npcName(id){if(id==='tanaka'&&!F()['tn:met']&&!F().tanakaMet&&!F().tanakaWaiting)return '拿着便当的男性';const d=NPCS[id];if(!d)return id;for(const n of (d.names||[]))if(cond(n.when))return n.name;return d.name}
function rel(id){const n=N(id);return '信任 '+'♥'.repeat(n.trust)+'♡'.repeat(5-n.trust)+(n.stress?'　压力 '+'⚡'.repeat(n.stress):'')}

/* ---------- 条件与效果（剧情 JSON 使用的「语言」） ---------- */
const L=v=>v==null?[]:Array.isArray(v)?v:[v];
function cond(w){
 if(!w)return true;const v=V();
 if(w.kbranch&&!(window.KBRANCH&&KBRANCH.check(w.kbranch)))return false;
 if(w.mori&&!MORI.check(w.mori))return false;
 if(w.sato&&!SATO.check(w.sato))return false;
 if(w.yk&&!YUMI.check(w.yk))return false;
 if(w.tn&&!TANAKA.check(w.tn))return false;
 if(w.any&&!w.any.some(cond))return false;
 if(w.all&&!w.all.every(cond))return false;
 if(w.not&&cond(w.not))return false;
 if(w.phase&&!L(w.phase).includes(phase()))return false;
 if(w.clockMin!=null&&v.clock<w.clockMin)return false;
 if(w.clockMax!=null&&v.clock>w.clockMax)return false;
 const known=f=>CASE_FACTS.flag(f)??v.flags[f];
 if(L(w.flag).some(f=>!known(f)))return false;
 if(L(w.notFlag).some(f=>known(f)))return false;
 if(L(w.clue).some(c=>!v.clues.includes(c)))return false;
 if(L(w.notClue).some(c=>v.clues.includes(c)))return false;
 if(w.anyClue&&!L(w.anyClue).some(c=>v.clues.includes(c)))return false;
 if(w.clueCount!=null&&v.clues.length<w.clueCount)return false;
 if(w.clueCountMax!=null&&v.clues.length>w.clueCountMax)return false;
 if(L(w.testimony).some(t=>!v.testimony.includes(t)))return false;
 if(L(w.notTestimony).some(t=>v.testimony.includes(t)))return false;
 if(w.testimonyCount!=null&&v.testimony.length<w.testimonyCount)return false;
 for(const [id,n] of Object.entries(w.trust||{}))if(N(id).trust<n)return false;
 for(const [id,n] of Object.entries(w.trustMax||{}))if(N(id).trust>n)return false;
 for(const [id,n] of Object.entries(w.npcStress||{}))if(N(id).stress<n)return false;
 for(const [id,n] of Object.entries(w.npcStressMax||{}))if(N(id).stress>n)return false;
 for(const [id,k] of Object.entries(w.mem||{}))if(L(k).some(x=>!N(id).mem[x]))return false;
 for(const [id,k] of Object.entries(w.notMem||{}))if(L(k).some(x=>N(id).mem[x]))return false;
 for(const [id,n] of Object.entries(w.item||{}))if(item(id)<n)return false;
 if(L(w.notItem).some(id=>item(id)>0))return false;
 for(const [id,m] of Object.entries(w.npcAt||{}))if(!L(m).includes(npcAt(id)))return false;
 for(const [id,m] of Object.entries(w.notNpcAt||{}))if(L(m).includes(npcAt(id)))return false;
 if(L(w.visited).some(m=>!v.visited.includes(m)))return false;
 if(L(w.notVisited).some(m=>v.visited.includes(m)))return false;
 if(w.cashMin!=null&&campaign.cash<w.cashMin)return false;
 if(w.prologue!=null){const pr=campaign.prologue;if(!pr)return false;if(L(w.prologue).some(k=>!(k==='done'?pr.done:(pr.clues||[]).includes(k)||(pr.flags||{})[k])))return false}
 if(w.sanMin!=null&&campaign.san<w.sanMin)return false;
 if(w.sanMax!=null&&campaign.san>w.sanMax)return false;
 return true;
}
function apply(e,node,silent){
 if(!e)return '';const v=V(),out=[];
 if(e.kbranch&&window.KBRANCH)KBRANCH.event(e.kbranch);
 if(e.moriEvent)MORI.event(e.moriEvent);
 if(e.tnEvent)TANAKA.event(e.tnEvent);
 if(e.satoEvent){SATO.event(e.satoEvent);v.flags["sato:"+e.satoEvent]=true;}
 if(e.time)advance(cost(e.time));
 for(const [id,d] of Object.entries(e.trust||{})){const n=N(id);n.trust=Math.max(0,Math.min(5,n.trust+d));if(!silent&&d)out.push(npcName(id)+' 信任'+(d>0?'↑':'↓'))}
 for(const [id,d] of Object.entries(e.npcStress||{})){const n=N(id);n.stress=Math.max(0,Math.min(5,n.stress+d))}
 for(const [id,k] of Object.entries(e.mem||{}))L(k).forEach(x=>N(id).mem[x]=true);
 L(e.flag).forEach(f=>v.flags[f]=true);L(e.clearFlag).forEach(f=>delete v.flags[f]);
 for(const [id,d] of Object.entries(e.item||{})){addItem(id,d);const it=ITEMS.find(x=>x.id===id);if(!silent&&it)out.push((d>0?'获得 ':'失去 ')+it.icon+it.name)}
 L(e.testimony).forEach(t=>{if(!v.testimony.includes(t)&&EVID[t]){v.testimony.push(t);progress();log('证词：'+EVID[t].desc);out.push('🗣 记下证词');if(EVID.versions&&v.testimony.length>=3)gainClue('versions',out)}});
 L(e.clue).forEach(k=>gainClue(k,out));
 if(e.log)log(e.log);
 if(e.rule){campaign.ruleViolations=(campaign.ruleViolations||0)+1}
 const sanRule=e.sanRule?-Math.abs(GAME_CONFIG.sanRules[e.sanRule]||0):0;
 if(sanRule)campaign.sanLost=(campaign.sanLost||0)-sanRule; // 「↩ 返回」不会退还这部分 SAN
 save();
 const res=GS.change({hp:e.hp,san:(e.san||0)+sanRule,cash:e.cash,stress:e.stress},e.rule?'违反了酒店的规则':'');if(res)out.push(res);
 if(e.glitch)L(e.glitch).forEach(g=>UI.glitch(g));
 if(e.toast)toast(e.toast);
 if(e.goto){changeMap(e.goto.map,e.goto.x,e.goto.y,e.goto.dir||'down')}
 if(mode==='scene'&&sceneId&&SCENES[sceneId]&&(SCENES[sceneId].marks||SCENES[sceneId].worms))drawSceneBg(SCENES[sceneId]); // 对话进行中，画面上的小变化也要马上出现
 refreshHUD();
 if(GS.dead())setTimeout(()=>{if(!GS.dead())return;stop();survivalStatus();offerRewind()},900); // 死亡：可以回到最后一个选择（97-death-rewind.js）
 return out.join(' · ');
}
function progress(){const v=V();v.lastProgress={day:campaign.day,clock:v.clock}}
function gainClue(k,out){const v=V(),h=H();if(!EVID[k]||EVID[k].kind==='testimony'||v.clues.includes(k))return;v.clues.push(k);progress();if(EVID[k].old&&!h.evidence.includes(EVID[k].old))h.evidence.push(EVID[k].old);log('🔎 获得证据：'+EVID[k].name);if(out)out.push('🔎 新证据：'+EVID[k].name);toast('🔎 新证据：'+EVID[k].name);save()}
function fill(t){if(typeof t!=='string')return t;return t.replace(/\{(\w+)\}/g,(m,k)=>({caseDay:caseLabel(),deadline:window.CASE5?CASE5.deadlineText():'',nightNo:nightNo(),nightsTotal:nightsTotal(),nightsLeft:Math.max(0,nightsTotal()-nightNo()),reopenDay:reopenDay(),clueCount:clueCount(),testimonyCount:V().testimony.length,eveDone:L(CH.eveningEvents).filter(f=>V().flags[f]).length,eveTotal:L(CH.eveningEvents).length,time:clockStr(),day:campaign.day,phase:phaseName(),cash:campaign.cash})[k]??m)}
function pick(t){if(t&&t.moriStage)return MORI.dialogue();if(t&&typeof t==='object'&&!Array.isArray(t)){if(t.truth!=null&&CASE_FACTS.read().death)return fill(t.truth);return fill(t[phase()]??(DAY?t.evening:undefined)??t.default??'')}return fill(t)}

/* ---------- 对话（使用通用剧情播放器） ---------- */
function host(){return document.getElementById('mg-dark-dlg')||document.getElementById(mode==='scene'?'h18-scene-dlg':'h18-dlg')} // 黑暗中（第三次高潮的电话）用黑幕上的对话框
function portraitFor(node,who,line){if(who&&window.TACHIE){const tid=TACHIE.idOf(who);if(tid){let st=0;try{st=NPCS[tid]?N(tid).stress||0:0}catch(e){}const u=TACHIE.forHotel(who,node,line,st);if(u)return u}}if(!who||!window.ART)return '';for(const [id,d] of Object.entries(NPCS)){const pats=d.portraitMatch||[d.name];if(pats.some(p=>who.includes(p))){const n=N(id);return ART.portrait(d.portrait,d.palette,{ghost:!!d.ghost,worried:n.stress>=3,sweat:n.stress>=4})}}return ''}
/* v32.2：选项是否通往关键线索（证据 / 证词）。关键线索的选项可以重复问，其余问过就消失 */
function keyNode(id,d){const n=NODES[id];if(!n||d>5)return false;const e=n.effects||{};if(e.clue||e.testimony)return true;
 if(n.gate&&keyNode(n.gate.node,d+1))return true;if(n.goto&&keyNode(n.goto,d+1))return true;if(n.type==='hub')return false;
 if(n.next&&keyNode(n.next,d+1))return true;for(const c of n.choices||[]){const ce=c.effects||{};if(ce.clue||ce.testimony)return true;if(c.next&&keyNode(c.next,d+1))return true}return false}
/* v66：自我收尾的话题（when 里写了 notFlag / notItem，而它自己的后续——包括 call 进去的场景、第三次高潮的黑暗与回归——会置上这个旗标 / 给出这个道具）
   在完成之前一直保留：点开后选「算了」、场景中途关游戏、黑暗中断线，回来都还能再点。完成后由 when 自然隐藏。旧存档里已被「消费」的这类话题也会自动回来。 */
const L66=x=>x==null?[]:Array.isArray(x)?x:[x];
function gateKeys66(w,acc){if(Array.isArray(w))w.forEach(e=>gateKeys66(e,acc));else if(w&&typeof w==='object')for(const k in w){if(k==='notFlag')L66(w[k]).forEach(f=>acc.add('f:'+f));else if(k==='notItem')L66(w[k]).forEach(f=>acc.add('i:'+f));else if(k==='all'||k==='any')gateKeys66(w[k],acc)}return acc}
function outKeys66(c){const out=new Set(),seen=new Set();
 const eff=e=>{if(!e)return;L66(e.flag).forEach(f=>out.add('f:'+f));if(e.item&&typeof e.item==='object')Object.keys(e.item).forEach(i=>out.add('i:'+i));else L66(e.item).forEach(i=>out.add('i:'+i))};
 const call=(cl,d)=>{if(typeof cl!=='string'||!cl.startsWith('scene:'))return;const id=cl.slice(6),sc=SCENES[id]||{};eff(sc.enterEffects);node(sc.enterNode,d);const ex=sc.exitNode;node(ex&&typeof ex==='object'?ex.node:ex,d);(sc.hotspots||[]).forEach(h=>node(h.node,d));
  const c3=CH.climax3;if(c3&&c3.scene===id){node(c3.phoneNode,d);node(c3.returnNode,d)}};
 const node=(id,d)=>{if(typeof id!=='string'||seen.has(id)||d>14)return;seen.add(id);const n=NODES[id];if(!n)return;eff(n.effects);
  if(n.gate)node(n.gate.node,d+1);if(typeof n.goto==='string')node(n.goto,d+1);if(n.next)node(n.next,d+1);if(n.call)call(n.call,d+1);if(n.type==='hub')return;
  for(const ch of n.choices||[]){eff(ch.effects);if(ch.next)node(ch.next,d+1);if(ch.call)call(ch.call,d+1)}};
 eff(c.effects);if(c.next)node(c.next,1);if(c.call)call(c.call,1);return out}
const RETIRE66=new WeakMap();
function selfRetiring(c){if(RETIRE66.has(c))return RETIRE66.get(c);const g=gateKeys66(c.when,new Set());let r=false;if(g.size){const o=outKeys66(c);for(const k of g)if(o.has(k)){r=true;break}}RETIRE66.set(c,r);return r}
function isKeyChoice(c){const e=c.effects||{};return !!(c.repeat||e.clue||e.testimony||(c.next&&keyNode(c.next,0))||selfRetiring(c))}
const chosenKey=(n,c)=>'已选:'+n.id+':'+(c.id||c.text);
function freshChoices(n){return (n.choices||[]).filter(c=>(!c.when||cond(c.when))&&!c.call&&(c.next||c.effects)&&(!F()[chosenKey(n,c)]||selfRetiring(c)))}
function hubOf(id){let n=NODES[id],g=0;while(n&&g++<6){if(n.gate&&cond(n.gate.when)){n=NODES[n.gate.node];continue}if(n.goto){n=NODES[n.goto];continue}break}return n}
function npcDone(id){const n=hubOf(NPCS[id].talk);if(!n)return true;if(n.type!=='hub')return !!F()['talked:'+id];return freshChoices(n).length===0}
function hubTip(n){if(!S||freshChoices(n).length)return;const k='tip:npc:'+n.id+':'+(n.choices||[]).filter(c=>!c.when||cond(c.when)).length;if(F()[k])return;F()[k]=true;save();toast('💭 或许我应该再问问别人。')}
function sceneTip(){if(!S||busy||mode!=='pixel'||DM.isOpen())return;const map=V().map,m=MAPS[map];
 const npcs=Object.entries(npcState).filter(([id,st])=>st.on&&st.map===map&&!NPCS[id].ghost).map(([id])=>id);
 const objs=Object.entries(m.objects||{}).filter(([k,v])=>L(v).some(o=>cond(o.when))).map(([k])=>k);
 if(!npcs.length&&!objs.length)return;if(!npcs.every(npcDone)||!objs.every(k=>F()['obj:'+map+':'+k]))return;
 const k='tip:scene:'+map+':'+phase()+':'+npcs.length+':'+objs.length;if(F()[k])return;F()[k]=true;save();setTimeout(()=>toast('💭 或许我应该去别处转转。'),400)}
/* v37：白天的酒店 —— 在场的人都问完、白天才有的调查点都看过之后，提示「出去转转」（每天一次，排在本场景提示之后） */
function dayTip(){if(!DAY||!S||busy||mode!=='pixel'||DM.isOpen())return;const f=F(),k='tip:dayout:'+campaign.day;if(f[k])return;
 const npcs=Object.entries(npcState).filter(([id,st])=>st.on&&MAPS[st.map]&&!NPCS[id].ghost).map(([id])=>id);if(!npcs.length||!npcs.every(npcDone))return;
 for(const [mid,m] of Object.entries(MAPS))for(const [ok,v] of Object.entries(m.objects||{}))if(L(v).some(o=>o.when&&JSON.stringify(o.when).includes('"day"')&&cond(o.when))&&!f['obj:'+mid+':'+ok])return;
 f[k]=true;save();setTimeout(()=>toast('💭 酒店里能问的都问过了。或许我应该出去转转。'),3600)}
function markOldChosen(){const f=F();if(f['v322:marked'])return;f['v322:marked']=true;const v=V();
 const memOk=m=>Object.entries(m||{}).every(([id,k])=>L(k).every(x=>v.npc[id]&&v.npc[id].mem[x]));
 const effDone=e=>{if(!e)return false;const keys=Object.keys(e).filter(k=>['mem','flag','clue','testimony'].includes(k));if(!keys.length)return false;
  return keys.every(k=>k==='mem'?memOk(e.mem):k==='flag'?L(e.flag).every(x=>f[x]):k==='clue'?L(e.clue).every(x=>v.clues.includes(x)):L(e.testimony).every(x=>v.testimony.includes(x)))};
 for(const n of Object.values(NODES)){if(n.type!=='hub')continue;for(const c of n.choices||[]){if(c.call)continue;const k=chosenKey(n,c);if(f[k])continue;
  const t=c.next&&NODES[c.next];if(effDone(c.effects)||(t&&effDone(t.effects)))f[k]=true}}}
/* v34：占卜师用的「下一步方向」（只给人或地点，不给线索） */
function scheduleMapOf(id){const sc=(NPCS[id]||{}).schedule||{};for(const ph of ['evening','night','late','day']){let e=sc[ph];if(Array.isArray(e))e=e.find(x=>x&&(!x.when||cond(x.when)));else if(e&&e.when&&!cond(e.when))e=null;if(e&&MAPS[e.map])return e.map}return null}
function fortuneTarget(){if(!campaign||!campaign.hotelCase)return null;H();const f=F(),v=V(),mn=m=>(MAPS[m]||{}).name||'';
 if(!f.c2&&['e1','e2','e3','pre:mori','pre:koba'].every(k=>f[k])&&!f['c2:inoue'])return {kind:'npc',id:'inoue',name:npcName('inoue'),met:true,mapName:mn('corridor')};
 if(unreadList().length)return {kind:'unread'};
 const c=[];for(const id of ['sato','mori','inoue','kobayashi','takahashi','tanaka','girlA']){const d=NPCS[id];if(!d||!d.talk)continue;if(id==='tanaka'&&!(f['tn:met']||f.tanakaMet))continue;
  const n=hubOf(sealed(d.talk));if(!n||n.type!=='hub')continue;const fr=freshChoices(n);if(!fr.length)continue;c.push({id,key:fr.some(isKeyChoice),met:!!f['met:'+id],map:scheduleMapOf(id)})}
 c.sort((a,b)=>(b.key-a.key)||(b.met-a.met));if(c.length){const t=c[0];return {kind:'npc',id:t.id,name:npcName(t.id),met:t.met,mapName:mn(t.map)}}
 const order=['lobby','corridor','alley','shopping','office','guard','room206','storage'].filter(m=>MAPS[m]&&(m==='lobby'||v.visited.includes(m)));
 for(const m of order){const left=Object.entries(MAPS[m].objects||{}).filter(([k,o])=>L(o).some(x=>cond(x.when))&&!f['obj:'+m+':'+k]);if(left.length)return {kind:'place',id:m,mapName:mn(m)}}
 const h=currentHint();return h?{kind:'hint',text:h}:null}
function scriptCtx(onEnd){markOldChosen();return {nodes:NODES,host,cond,apply,pick,portraitFor,jpPenalty:GAME_CONFIG.wrongAnswer.chapter1Hp,tauntScene:'hotel',
 subFor:n=>n.npc?rel(n.npc):'',evidence:()=>V().clues.map(k=>({id:k,name:EVID[k].name})),call:builtin,autoOnce:true,isKey:isKeyChoice,onHub:hubTip,onEnd:onEnd||endDialog,onListen:(n,ok)=>{if(ok){delete F()['unread:'+n.id];progress()}else F()['unread:'+n.id]=true;save()},onHurt:hp=>toast('❤️ 疲劳点 -'+hp+'（日语理解错误）')}}
function sealed(id){const sl=CH.seal;return !DAY&&sl&&sl.nodes&&sl.nodes[id]&&cond(sl.when)?sl.nodes[id]:id} // v32.3：白天不换成第二夜的事件 // 第二次高潮之前，部分内容换成「还没开放」的版本（chapter.json 的 seal）
function play(id,onEnd){if(window.SATO&&SATO.active())return;keys.clear();SR.run(sealed(id),scriptCtx(onEnd))}
function endDialog(){DM.close();if(window.TACHIE)TACHIE.meet(null);refreshHUD();if(mode==='scene')renderScene();else if(cv)cv.focus({preventScroll:true});if(S&&!DAY&&V().clock>=END_CLOCK&&!H().ending)setTimeout(dawn,60);else{recheck();sceneTip();dayTip()}}
function recheck(){if(!S||busy)return;if(mode==='scene'){checkRules('scene:'+sceneId,'retire');return}if(mode!=='pixel')return;checkRules('clock');checkRules('enter:'+V().map,true)} // 对话结束后：再看一次「时间到了」和「标了 recheck 的规则」
function builtin(name){
 if(arguments[0]==='kbranch:photo'){KBRANCH.photo();return;}
 if(name.startsWith('yk:')){YUMI.play(name.slice(3),()=>H18.endDialog());return;}
 if(name.startsWith('tn:')){TANAKA.call(name.slice(3));return;}
 if(name.startsWith('sato:')){SATO.call(name.slice(5));return;}
 if(name.startsWith('mori:')){MORI.inspect(name.slice(5));return;}
 if(typeof name==='string'&&name.startsWith('verify:')&&window.VERIFY){VERIFY.call(name.slice(7));return} // v27 第二阶段：出示推论 / 和田中会面（96r-verify.js）
 if(typeof name==='string'&&name.startsWith('scene:')){openScene(name.slice(6));return} // 剧情里写 "call": "scene:room207c" 直接进入调查场景
 if(typeof name==='string'&&name.startsWith('ending:')){DM.close();ending(name.slice(7));return} // v23：剧情里写 "call": "ending:answer" 直接进入结局（最后一次见面）
 const k3=CH.climax3||{};
 if(name==='darkOn'){if(window.MAGGOT)MAGGOT.dark(true);play(k3.phoneNode);return}  // 切黑 → 黑暗中的电话
 if(name==='darkOff'){if(window.MAGGOT)MAGGOT.dark(false);if(mode==='scene')renderScene();play(k3.returnNode);return} // 回到现在
 ({journal,decide,leave:leaveHotel,wait:()=>{advance(30);journal()},sleep:sleepUntilDawn,deduce,dawn:()=>dawn(true),climax}[name]||endDialog)()}
function toast(t){const el=document.getElementById('h18-toast');if(el){el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{el.hidden=true},3200)}else UI.toast(t)}

/* ---------- NPC 放置与巡逻 ---------- */
function placeNPCs(force){
 for(const id of Object.keys(NPCS)){
  const sc=schedFor(id),prev=npcState[id],ph=phase();
  if(!force&&prev&&prev.phase===ph&&prev.on===!!(sc&&MAPS[sc.map])&&prev.scheduleKey===JSON.stringify(sc))continue;
  npcState[id]=sc&&MAPS[sc.map]?{on:true,scheduleKey:JSON.stringify(sc),phase:ph,map:sc.map,x:sc.x,y:sc.y,px:sc.x*T,py:sc.y*T,dir:'down',patrol:sc.patrol||null,pi:0,wait:0,moving:false,fx:sc.x,fy:sc.y,t:0}:{on:false,phase:ph,map:sc?sc.map:null};
 }
}
function blockedFor(map,x,y,ignore){
 const m=MAPS[map];if(x<0||y<0||x>=MW||y>=MH)return true;
 if(SOLID.has(m.rows[y][x]))return true;
 for(const [id,st] of Object.entries(npcState))if(id!==ignore&&st.on&&st.map===map&&((st.x===x&&st.y===y)||(st.moving&&st.fx===x&&st.fy===y)))return true;
 return false;
}
function faceToward(a,b){const dx=b.x-a.x,dy=b.y-a.y;return Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')}
function stepNPCs(dt){
 if(DM.isOpen())return;
 for(const [id,st] of Object.entries(npcState)){
  if(!st.on)continue;
  if(st.moving){st.t+=dt/260;const k=Math.min(1,st.t);st.px=(st.fx+(st.x-st.fx)*k)*T;st.py=(st.fy+(st.y-st.fy)*k)*T;if(k>=1){st.moving=false;st.fx=st.x;st.fy=st.y}continue}
  if(!st.patrol)continue;
  if(V().map===st.map&&Math.abs(player.x-st.x)+Math.abs(player.y-st.y)<=1){st.dir=faceToward(st,player);st.wait=Math.max(st.wait,600);continue}
  st.wait-=dt;if(st.wait>0)continue;
  const [tx,ty]=st.patrol[st.pi];
  if(st.x===tx&&st.y===ty){st.pi=(st.pi+1)%st.patrol.length;st.wait=900+Math.random()*900;continue}
  const dx=Math.sign(tx-st.x),dy=dx?0:Math.sign(ty-st.y),nx=st.x+dx,ny=st.y+dy;
  const pBlock=V().map===st.map&&((player.x===nx&&player.y===ny)||(player.moving&&player.tx===nx&&player.ty===ny));
  if(pBlock||blockedFor(st.map,nx,ny,id)){st.wait=500;continue}
  st.dir=dx>0?'right':dx<0?'left':dy>0?'down':'up';st.fx=st.x;st.fy=st.y;st.x=nx;st.y=ny;st.moving=true;st.t=0;st.wait=350;
 }
}
/* ---------- 物件与交互 ---------- */
function objectAt(map,x,y){
 const m=MAPS[map],O=m.objects||{};
 for(const o of L(O[x+','+y]))if(cond(o.when))return o;
 const ch=m.rows[y]&&m.rows[y][x],gen=(m.generic||{})[ch];
 if(gen){const no=m.doors&&m.doors[x+','+y]||'',rep=t=>typeof t==='string'?t.split('{door}').join(no):t&&typeof t==='object'?Object.fromEntries(Object.entries(t).map(([k,x])=>[k,rep(x)])):t;return Object.assign({},gen,{label:rep(gen.label||''),text:rep(gen.text),door:no})}
 return null;
}
function anomalyTile(map,x,y){for(const a of (MAPS[map].anomalies||[]))if(a.x===x&&a.y===y&&cond(a.when))return a.tile;return null}
function useObject(o){
 if(o.node==='obj-elevator2'&&DAHLIA.active()&&F().e1&&!F()['dahlia:petal']){
  F()['dahlia:petal']=true;save();
  return DM.show(host(),{who:'二楼电梯',text:'电梯门缝里夹着一片黑色的花瓣。你刚蹲下，它就掉进了缝里。',choices:[{t:'继续',fn:()=>useObject(o)}]});
 }
 if(o.node==='obj-elevator2'&&DAHLIA.active()&&campaign.dahlia?.stage==='found'){
  return DM.show(host(),{who:'二楼电梯',text:'电梯门边的管线井向下延伸到 B2。',choices:[
   {t:'沿管线井去 B2',fn:()=>{DM.close();DAHLIA.source()}},
   {t:'回走廊',fn:endDialog}
  ]});
 }
 if(o.time)advance(cost(o.time));
 if(o.node){play(o.node);return}
 if(o.text){DM.show(host(),{who:o.label,text:pick(o.text),choices:[{t:'▶ 继续',fn:endDialog}]});return}
}
const DV={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function target(){const [dx,dy]=DV[player.dir];return [player.x+dx,player.y+dy]}
function findInteractable(){
 const map=V().map,cands=[target()];for(const d of ['up','down','left','right']){const [dx,dy]=DV[d];cands.push([player.x+dx,player.y+dy])}
 for(const [x,y] of cands){
  for(const [id,st] of Object.entries(npcState))if(st.on&&st.map===map&&st.x===x&&st.y===y)return {kind:'npc',id,label:'与'+npcName(id)+'交谈',x,y};
 }
 const door=(MAPS[map].exits||[]).find(e=>e.scene&&Math.abs(e.x-player.x)+Math.abs(e.y-player.y)<=GAME_CONFIG.ch1Repairs.doorInteractTiles);if(door)return {kind:'exit',ex:door,label:'进入：'+door.label,x:door.x,y:door.y};
 for(const [x,y] of cands){const o=objectAt(map,x,y);if(o)return {kind:'obj',o,label:'调查：'+fill(o.label),x,y}}
 return null;
}
function interact(){if(paused||DM.isOpen()||!player||player.moving||mode!=='pixel')return;const it=findInteractable();if(!it)return;keys.clear();
 if(it.kind==='npc')talk(it.id);else if(it.kind==='exit')openScene(it.ex.scene);else{F()['obj:'+V().map+':'+it.x+','+it.y]=true;if(window.SIDE&&SIDE.trigger('obj:'+V().map+':'+it.x+','+it.y,()=>useObject(it.o)))return;useObject(it.o)}}
function talk(id){
 const f=F(),actor=DAHLIA.actors[id];
 if(id==='inoue'&&DAHLIA.needsShell()){
  return DM.show(host(),{who:actor.name,text:'',choices:[
   {t:'问问 B2 遗物的入库签',fn:()=>{DM.close();DAHLIA.getShell(endDialog)}},
   {t:'继续调查',fn:()=>regularTalk(id)},{t:'离开',fn:endDialog}
  ]});
 }
 if(actor&&id!=='kobayashi'&&DAHLIA.offer(id,f)){
  return DM.show(host(),{who:actor.name,text:'',choices:[{t:actor.title,fn:()=>{DM.close();DAHLIA.chat(id,endDialog)}},{t:'继续调查',fn:()=>regularTalk(id)},{t:'离开',fn:endDialog}]});
 }
 regularTalk(id);
}
function regularTalk(id){
 if(DAHLIA.actors[id])F()['dahlia:known:'+id]=true;
 if(id==='sato'&&DAHLIA.active()&&(V().clues.includes('phonelog')||ROOMFILE.deathKnown(campaign))&&!DAHLIA.state().witness){
  DM.close();DAHLIA.witness(()=>openTalk(id));return;
 }
 openTalk(id);
}
function openTalk(id){if(window.TACHIE)TACHIE.meet(id,!F()['met:'+id]);F()['met:'+id]=true;F()['talked:'+id]=true; // v28：最终报告的「已发现人物」
 const st=npcState[id];if(st&&player){st.dir=faceToward(st,player);player.dir=faceToward(player,st)}advance(cost(NPCS[id].talkTime??10));play(NPCS[id].talk)}

/* ---------- 地图切换、出入口与规则 ---------- */
function exitAt(map,x,y){return (MAPS[map].exits||[]).find(e=>e.x===x&&e.y===y)}
function arrive(){const v=V(),ex=exitAt(v.map,player.x,player.y);if(!ex)return;pointerRoute=[];
 if(DAY&&ex.scene&&ex.scene!=='room207'&&ex.scene!=='room207c'){stepBack(ex);toast('白天走廊里人来人往，现在不方便进去。');return}
 if(ex.leave&&DAHLIA.offer('kobayashi',F())){
  keys.clear();
  DM.show(host(),{who:'酒店外',text:'街上传来口号声。小林站在门外，望着经过的人群。',choices:[
   {t:'过去和小林一起看看',fn:()=>{DM.close();stepBack(ex);DAHLIA.chat('kobayashi',endDialog)}},
   {t:'离开，回到东京地图',fn:leaveHotel},
   {t:'留下继续调查',fn:()=>{stepBack(ex);endDialog()}}
  ]});return;
 }
 if(ex.leave){keys.clear();DM.show(host(),{who:'离开酒店？',text:'调查进度会自动保存。之后可以从「任务」或东京地图的主线入口回来继续。',choices:[{t:'离开，回到东京地图',fn:leaveHotel},{t:'留下继续调查',fn:()=>{stepBack(ex);endDialog()}}]});return}
 if(ex.scene){stepBack(ex);openScene(ex.scene);return}
 changeMap(ex.to,ex.sx,ex.sy,ex.dir);
}
function stepBack(ex){const b=DV[ex.back||'up'];player.x+=b[0];player.y+=b[1];player.px=player.x*T;player.py=player.y*T;player.tx=player.x;player.ty=player.y;const v=V();v.x=player.x;v.y=player.y;save()}
function changeMap(to,x,y,dir){if(!MAPS[to])return;const v=V(),h=H();v.map=to;v.x=x;v.y=y;v.dir=dir||'down';if(!v.visited.includes(to))v.visited.push(to);if(!h.visited.includes(to))h.visited.push(to);h.scene=to;
 if(player){player.x=x;player.y=y;player.px=x*T;player.py=y*T;player.tx=x;player.ty=y;player.dir=v.dir;player.moving=false}keys.clear();
 advance(cost(5));save();refreshHUD();toast('📍 '+MAPS[to].name);if(window.AUDIO){AUDIO.sfx('door');AUDIO.ambience(ambienceName())}checkRules('enter:'+to);
}
/* v66：会自我收尾的规则（when 里的 notFlag 由它自己的剧情置上，例如最终回访 fv → visitDone）不在触发瞬间记「今晚已发生」，
   中途关游戏、断线，再进门还会发生；在场景里对话结束后也会再检查一次（例如待在 207 里等到凌晨）。 */
const RULE66=new Map();
function ruleRetires(r){if(RULE66.has(r))return RULE66.get(r);const g=gateKeys66(r.when,new Set());let ok=false;if(g.size){const o=outKeys66({next:r.node});for(const k of g)if(o.has(k)){ok=true;break}}RULE66.set(r,ok);return ok}
function checkRules(evt,onlyRecheck){
 if(DAY)return; // 白天不发生夜间的规则事件
 for(const r of (CH.rules||[])){
  if(r.trigger!==evt)continue;if(onlyRecheck&&!r.recheck&&!(onlyRecheck==='retire'&&ruleRetires(r)))continue;if(F()['tonight:'+r.id])continue;if(!cond(r.when))continue;
  clearTimeout(ruleTimer);let tries=0;
  const fire=()=>{if(!S||busy||F()['tonight:'+r.id]||!cond(r.when))return;
   if(r.trigger.startsWith('enter:')&&(mode!=='pixel'||V().map!==r.trigger.slice(6)))return;
   if(r.trigger.startsWith('scene:')&&(mode!=='scene'||sceneId!==r.trigger.slice(6)))return;
   if(DM.isOpen()||document.querySelector('.et-modal-back')){if(++tries<40)ruleTimer=setTimeout(fire,900);return} // 正在对话时，等对话结束再发生
   if(!r.repeat&&!ruleRetires(r))F()['tonight:'+r.id]=true;save();if(r.clearNpcs)for(const st of Object.values(npcState))if(st.on&&st.map===V().map)st.on=false; // 例如：第二次高潮时走廊里没有别人
  if(r.glitch)UI.glitch(r.glitch);play(r.node)};
  ruleTimer=setTimeout(fire,r.delay||1200);
 }
}
/* ---------- 文字调查场景（例如 207号室） ---------- */
function openScene(id){
 const sc=SCENES[id];if(!sc)return;
 if(sc.lock&&!cond(sc.lock.open)){if(window.SIDE&&SIDE.trigger('exit:'+id,()=>play(sc.lock.node)))return;play(sc.lock.node);return}
 if(id==='room207'&&DAHLIA.block(endDialog))return;
 mode='scene';sceneId=id;if(id==='room207'||id==='room207c')F()['repair:entered207']=true;const v=V();if(!v.visited.includes(id)){v.visited.push(id)}
 if(sc.enterTime)advance(cost(sc.enterTime));save();
 UI.scene('investigate',()=>{start();openScene(id)});
 renderScene();
 if(sc.enterNode&&!F()['seen:'+id]){F()['seen:'+id]=true;save();play(sc.enterNode)}
 checkRules('scene:'+id);
}
function renderScene(){
 const sc=SCENES[sceneId];if(!sc)return;const stage=document.getElementById('h18-stage');if(!stage)return;
 stage.classList.add('h18-scene-mode');
 const hs=sc.hotspots.filter(h=>cond(h.when));
 document.getElementById('h18-scene').innerHTML=`<div class="h18-scene-bg"><canvas id="h18-scene-canvas" width="${CW}" height="${CHh}" aria-hidden="true"></canvas>${hs.map(h=>{const [x,y,w,hh]=h.rect;return `<button type="button" class="h18-hot${h.npc?' npc':''}" data-hot="${esc(h.id)}" style="left:${x/MW*100}%;top:${y/MH*100}%;width:${w/MW*100}%;height:${hh/MH*100}%"><span>${esc(pick(h.label))}</span></button>`}).join('')}</div>
  <div class="h18-scene-bar"><b>🔎 ${esc(sc.name)}</b><small>点画面上的物品调查 · 每次调查都会花时间</small><button type="button" class="survival-btn alt" id="h18-scene-exit">← ${esc(sc.exitLabel||'离开')}</button></div>
  <div class="h18-hot-list">${hs.map(h=>`<button type="button" class="rpg-action" data-hot="${esc(h.id)}">${esc(pick(h.label))}</button>`).join('')}</div>
${sceneId==='room207'?ROOMFILE.controls():''}<div id="h18-scene-dlg" class="adv-box" hidden></div>`;
 drawSceneBg(sc);ROOMFILE.bind();
 document.querySelectorAll('[data-hot]').forEach(b=>b.onclick=()=>{if(DM.isOpen())return;const h=sc.hotspots.find(x=>x.id===b.dataset.hot);if(!h)return;if(h.npc){advance(cost(NPCS[h.npc].talkTime??10));play(NPCS[h.npc].talk);return}if(h.time)advance(cost(h.time));play(h.node)});
 document.getElementById('h18-scene-exit').onclick=()=>{if(DM.isOpen())return;if(sc.exitNode&&cond(sc.exitNode.when)){play(sc.exitNode.node);return}closeScene()}; // exitNode：某些时候离不开
 refreshHUD();
}
function closeScene(){if(DM.isOpen())DM.close();const sc=SCENES[sceneId];mode='pixel';sceneId=null;const stage=document.getElementById('h18-stage');if(stage)stage.classList.remove('h18-scene-mode');const el=document.getElementById('h18-scene');if(el)el.innerHTML='';UI.scene('pixel',start);if(sc&&sc.exitTo)changeMap(sc.exitTo.map,sc.exitTo.x,sc.exitTo.y,sc.exitTo.dir);refreshHUD();if(cv)cv.focus({preventScroll:true})}
function drawSceneBg(sc){
 const c=document.getElementById('h18-scene-canvas');if(!c)return;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const m={rows:sc.rows,floor:sc.floor||',',wall:sc.wall||['#e3d7c3','#a8977a','#3a3030'],doors:{}};
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)drawTile(g,m,x,y);
 if(sc===SCENES.room207){g.fillStyle='#c2cec5';g.fillRect(T+2,T+4,T*1.85,T*1.7);g.fillStyle='#728c94';g.fillRect(T+6,T+9,T*1.5,T*1.32);g.fillStyle='#89999a';g.fillRect(T*4,T*1.5,4,T*.65)}
 const ph=phase();if(ph==='night'){g.fillStyle='rgba(10,16,48,.3)';g.fillRect(0,0,CW,CHh)}if(ph==='late'){g.fillStyle='rgba(4,6,26,.55)';g.fillRect(0,0,CW,CHh)}
 if(sc.ghost&&cond(sc.ghost.when)){drawChar(g,sc.ghost.x*T,sc.ghost.y*T,NPCS.oldman.palette,'down',0,true)}
 for(const h of sc.hotspots)if(h.npc&&cond(h.when)&&NPCS[h.npc]){drawChar(g,h.rect[0]*T,h.rect[1]*T,NPCS[h.npc].palette,'down',0,!!NPCS[h.npc].ghost)}
 for(const mk of (sc.marks||[]))if(cond(mk.when)){g.fillStyle=mk.color||'#000';g.fillRect(mk.rect[0]*T,mk.rect[1]*T,mk.rect[2]*T,mk.rect[3]*T)} // marks：按条件画上的小变化（水渍、关上的门…）
 if(campaign.san<=40){const gr=g.createRadialGradient(CW/2,CHh/2,CHh*.35,CW/2,CHh/2,CW*.65);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(90,20,70,.35)');g.fillStyle=gr;g.fillRect(0,0,CW,CHh)}
 if(sc.worms&&cond(sc.worms.when)&&window.MAGGOT)MAGGOT.few(c,sc.worms); // 少量白色蛆虫（第三次高潮）
}

/* ---------- 调查手帐、推理、决定、天亮 ---------- */
/* ---------- 卡关提示（chapter.json 的 hints，按顺序取第一条满足条件的） ---------- */
function currentHint(){return DAHLIA.objective(campaign)||DAHLIA.note()}
function unreadList(){return Object.keys(F()).filter(k=>k.startsWith('unread:')).map(k=>k.slice(7)).filter(id=>NODES[id])}
function stuckCheck(){const v=V(),lp=v.lastProgress||{day:campaign.day,clock:0};const since=lp.day===campaign.day?v.clock-lp.clock:v.clock;
 if(since>=(C1CFG.stuckMinutes||120)&&!H().ending){const t=currentHint();v.lastProgress={day:campaign.day,clock:v.clock};if(t)setTimeout(()=>toast('💡 '+t),300)}}
/* ---------- 期限：207 在第 N 夜之后的上午重新开放 ---------- */
/* v28：调查期限由 96s-case-report.js（CASE5）统一计算：6 天、独立于生存模式的总天数 */
function nightNo(){if(window.CASE5)return CASE5.dayNo();const v=V();return v.startDay?campaign.day-v.startDay+1:1}
function nightsTotal(){if(window.CASE5)return CASE5.days();return C1CFG.nights||3}
function isLastNight(){if(window.CASE5)return CASE5.isLastDay();return nightNo()>=nightsTotal()}
function reopenDay(){if(window.CASE5)return CASE5.lastDay()+1;const v=V();return (v.startDay||campaign.day)+nightsTotal()}
const caseLabel=()=>window.CASE5?CASE5.label():'第 '+nightNo()+'/'+nightsTotal()+' 夜';
function journal(){
 const v=V();keys.clear();
 const obj=objectives().filter(o=>!o.done).slice(0,3).map(o=>'☐ '+o.text).join('\n')||'☑ 当前目标都完成了';
 DM.show(host(),{who:'📓 调查手帐 · '+clockStr()+' '+phaseName(),text:'【'+caseLabel()+' · '+(window.CASE5?CASE5.deadlineText():'207 将在第 '+reopenDay()+' 天上午重新开放')+'】\n【证据 '+v.clues.length+'】【证词 '+v.testimony.length+'】\n'+obj+'\n\n（证据详情、证词和人物关系在底部「档案」。）',
  choices:[{t:'💡 现在该做什么？',fn:()=>DM.show(host(),{who:'💡 想一想',text:currentHint()||'手帐里有已经取得的证词和记录。',choices:[{t:'▶ 继续',fn:journal}]})},
   ...(unreadList().length?[{t:'🔁 回想没听懂的日语（'+unreadList().length+'）',fn:()=>{advance(cost(5));play(unreadList()[0])}}]:[]),
   ...(DAY?[]:[{t:'⏳ 等待 30 分钟（让大家换位置）',fn:()=>{advance(30);endDialog()}}]),
   ...(canDeduce()?[{t:'🧩 整理证据，推理真相',fn:deduce}]:[]),
   {t:'⚖ 做出最终决定'+(!cond(CH.decideWhen)?'（'+(CH.decideWhenText||'还不是时候')+'）':v.clues.length<CH.decideMinClues?'（需要 '+CH.decideMinClues+' 件证据）':''),disabled:!canDecide(),fn:decide},
   ...(window.CASE5&&CASE5.canCloseEarly()?[{t:'📝 提前结案：提交最终调查报告',fn:()=>{endDialog();CASE5.closeEarly()}}]:[]),
   {t:'📁 查看档案',fn:()=>UI.go('archive')},{t:'🚪 暂时离开酒店（自动存档）',fn:leaveHotel},{t:'关闭',fn:endDialog}]});
}
function canDeduce(){return !F().selfDeduced&&!CASE_FACTS.read().concealment&&CH.deduce&&cond(CH.deduce.when)}
function deduce(){if(!canDeduce()){endDialog();return}play(CH.deduce.node)}
function canDecide(){return clueCount()>=CH.decideMinClues&&cond(CH.decideWhen)&&!(window.CASE5&&CASE5.decided())} // v28：决定只做一次，结局等最终报告
function decide(){
 if(window.CASE5&&CASE5.decided()){DM.show(host(),{who:'⚖ 最终决定',text:CASE5.decidedText(),choices:[{t:'▶ 继续',fn:endDialog}]});return}
 if(!canDecide()){DM.show(host(),{who:'调查手帐',text:'证据还不够（至少需要 '+CH.decideMinClues+' 件）。',choices:[{t:'▶ 继续',fn:endDialog}]});return}
 const list=(CH.decisions||[]).filter(d=>!d.when||cond(d.when)).map(d=>{const ok=!d.need||cond(d.need);return {t:pick(d.text),disabled:!ok,note:ok?'':(d.needText||''),fn:()=>{if(d.confirmNode){play(d.confirmNode)}else ending(d.ending)}}});
 list.push({t:'再想想',fn:endDialog});
 DM.show(host(),{who:'⚖ 最终决定',text:fill(CH.decideText||'')+'\n\n这些决定会写入报告记录，不会改变品川水没时点。最终结案以提交调查报告为准。',choices:list});
}
function dawn(force){
 if(!S||H().ending)return;if(DM.isOpen()&&!force)return;
 const choices=[];
 if(canDecide())choices.push({t:'⚖ 做出最终决定',fn:decide});
 if(isLastNight()&&window.CASE5){choices.push({t:'▶ 调查期限结束',fn:()=>{save();stop();CASE5.expire()}});DM.show(host(),{who:'06:00 · 调查期限结束',text:CASE5.dawnText(),choices});return} // v28：最后一夜结束 → 最终调查报告（原来的 late 结局只作为资源保留）
 if(isLastNight()){choices.push({t:'……什么也没能做成',fn:()=>ending(CH.lateEnding||'late')});DM.show(host(),{who:'06:00 · 最后一夜结束了',text:fill(CH.dawnText.last||''),choices});return}
 choices.push({t:'☾ 结束这一夜（夜间结算 → 下一天）',fn:()=>{save();stop();nightlyClose()}});
 DM.show(host(),{who:'06:00 · 天亮了',text:canDecide()?fill(CH.dawnText.ready):fill(CH.dawnText.notReady),choices});
}
/* ---------- 第二次高潮（演出在 95-climax-maggots.js）：结束后直接进入下一天的早上 ---------- */
function climax(){
 if(busy||!window.MAGGOT){endDialog();return}
 busy=true;keys.clear();DM.close();clearTimeout(ruleTimer);
 const k=CH.climax2||{};
 DM.show(host(),{who:'',text:'……',choices:[{t:'……',fn:()=>{},disabled:true}],noUndo:true,stopAuto:true}); // 对话框留在原处，之后被盖住
 MAGGOT.play({stage:document.getElementById('h18-canvas'),door:k.door,floor:k.floor,map:V().map},()=>{
  busy=false;const v=V();L(k.flag).forEach(f=>v.flags[f]=true);if(k.morningNode)v.flags.morningPending=true;
  if(k.log)log(k.log);v.clock=END_CLOCK;save();
  const fin=()=>{DM.clearHistory();stop();nightlyClose()}; // 夜间结算后回到 tokyoHome → 先放「早上」（95-climax-maggots.js）
  const lines=k.afterLines||[];let li=0;const nextLine=()=>{if(li>=lines.length||!document.getElementById('h18-dlg')){fin();return}const t=lines[li++];DM.show(host(),{who:'',text:fill(t),noUndo:true,choices:[{t:li>=lines.length?'▶ 回到206':'▶ 继续',fn:nextLine}]})};nextLine(); // v32.3：高潮之后的独白（chapter.json 的 climax2.afterLines）
 });
}
function sleepUntilDawn(){V51.sleep();DAY=false;F()['tonight:entered']=true;V().clockDay=campaign.day;V().clock=END_CLOCK;save();refreshHUD();dawn(true)}
function ending(kind,opts){
 const v=V(),h=H(),f=F(),E=CH.endings[kind];if(!E||h.ending)return; // 不会重复结算
 if(!(opts&&opts.report)&&window.CASE5&&CASE5.intercept(kind))return; // v28：常规结局一律等第 6 天的最终调查报告（96s-case-report.js）
 if(opts&&opts.report)retryClear();else retrySave('decision'); // 报告提交后不能「回到做决定之前」
 let variant=kind;
 if(E.upgrade&&cond(E.upgrade.when))variant=E.upgrade.to;
 const def=CH.endings[variant];
 apply(def.effects||{},null,true);
 h.ending=def.hotelEnding;h.stance=def.hotelEnding;
 campaign.hotelEnding=def.hotelEnding;campaign.hotelEndingVariant=variant;
 campaign.hotelEvidence=h.evidence.slice();
 campaign.hotelTanaka=v.clues.includes('tanaka');campaign.hotelHometown=v.clues.includes('hometown');
 campaign.tanakaTrust=def.tanakaTrust;
 campaign.hotelNPC=Object.fromEntries(Object.entries(v.npc).map(([k,n])=>[k,{trust:n.trust,stress:n.stress}]));
 campaign.hotelClientKnown=!!f.clientKnown; // 是否知道委托人是田中震（和有没有他的联系方式 hotelTanaka 分开记）
 campaign.hotelKnockAnswered=!!f.knockAnswered;campaign.hotelTruth=CASE_FACTS.read().death;
 campaign.storyClues=campaign.storyClues||[];
 for(const k of v.clues){const t=EVID[k].name+'：'+EVID[k].desc;if(!campaign.storyClues.includes(t))campaign.storyClues.push(t)}
 campaign.storyClues.push('第一章结局：'+def.title);
 campaign.storyIndex=Math.max(1,campaign.storyIndex||0);campaign.storyStep=0;
 log('结局：'+def.title);save();stop();endingScreen();
}
function epilogue(){const n=campaign.hotelNPC||{},e=(x=>x==='juri'?'protect':x)(campaign.hotelEndingVariant||campaign.hotelEnding),g=(id,k)=>(n[id]||{})[k]||0;
 return (CH.epilogue||[]).map(row=>{for(const c of row.cases){const w=c.when||{};if(w.ending&&!L(w.ending).includes(e))continue;if(w.trust&&Object.entries(w.trust).some(([id,x])=>g(id,'trust')<x))continue;if(w.flag&&!(campaign.hotelCase&&campaign.hotelCase.v18&&campaign.hotelCase.v18.flags[w.flag]))continue;if(w.tanaka!=null&&!!campaign.hotelTanaka!==w.tanaka)continue;return row.name+'：'+c.text}return ''}).filter(Boolean)}
/* v23：结局画面上的片山——普通结局只有模糊的背影，特殊结局（C/D）才看得清他的脸 */
function kface(E){const d=NPCS.katayama;if(!d||!window.ART)return '';let src='';try{src=(window.TACHIE_DATA&&TACHIE_DATA.katayama)?TACHIE_DATA.katayama.base:ART.portrait(d.portrait,d.palette,{})}catch(e){return ''}
 return `<figure class="ch1-kface ${E.special?'clear':'blur'}" aria-hidden="true"><img src="${src}" alt=""><figcaption>${E.special?'片山 茂':'……'}</figcaption></figure>`}
/* v29：经由最终报告播放时，兜底结局按关键人物换文字（byPerson），late 用报告版文字（reportText） */
function endText(E){const r=campaign.case1&&campaign.case1.report;if(r){if(E.byPerson&&E.byPerson[r.person])return E.byPerson[r.person];if(E.reportText)return E.reportText}return E.text}
function endingScreen(){
 const variant=campaign.hotelEndingVariant||campaign.hotelEnding||'leave',E=CH.endings[variant]||CH.endings.leave,v=V();
 UI.scene('story',endingScreen);
 app.innerHTML=`<div class="rpg-shell"><section class="story-panel adv-ending"><div class="story-meta">CHAPTER 01 // ${esc(ch1Title())} // CASE CLOSED</div><h1>${esc(E.title)}</h1>${kface(E)}<p>${esc(endText(E))}</p><h2>人们的后来</h2>${epilogue().map(t=>`<div class="story-entry">${esc(t)}</div>`).join('')}<h2>带往后续章节</h2><div class="story-clue">田中震：${campaign.hotelTanaka?'你保存了田中震的短信。':'你没有田中震的联系方式，到时需要额外打听。'}田中对你的初始态度：${['敌视','冷淡','普通','信任','托付'][campaign.tanakaTrust??1]}<br>鸣泽町：${campaign.hotelHometown?'你知道老人故乡的公交停运通知。':'你只知道一个模糊的地名。'}</div><p>证据 ${v.clues.length} · 证词 ${v.testimony.length}</p>${(E.hint||[]).map(t=>`<p class="ch1-hint">${esc(t)}</p>`).join('')}${!E.special&&!E.noFooter&&CH.endingFooter?`<p class="ch1-footer">${esc(CH.endingFooter)}</p>`:''}${!E.special&&retryGet()&&(retryGet().decision||retryGet().night&&retryGet().night.data)?`<div class="ch1-retry">${retryGet().decision?'<button class="story-btn alt" id="h18-retry-d">↩ 回到做决定之前（第 '+retryGet().decision.night+' 夜 '+esc(retryGet().decision.clock)+'）</button>':''}${retryGet().night&&retryGet().night.data?'<button class="story-btn alt" id="h18-retry-n">↩ 回到这一夜的开始（第 '+retryGet().night.night+' 夜）</button>':''}</div>`:''}<button class="story-btn" id="h18-done">结束调查，返回东京</button></section></div>`;
 const rd=app.querySelector('#h18-retry-d'),rn=app.querySelector('#h18-retry-n');
 if(rd)rd.onclick=()=>UI.confirm('回到做决定之前？','结局不会被记录，回到你打开「最终决定」之前的那一刻。',()=>retryRestore('decision'));
 if(rn)rn.onclick=()=>UI.confirm('回到这一夜的开始？','回到你今晚走进酒店的时候。今晚得到的证据和做过的事都会还原。',()=>retryRestore('night'));
 app.querySelector('#h18-done').onclick=()=>{retryClear();const fin=()=>{const go=()=>{if(window.ECHO)ECHO.after(variant,tokyoHome);else tokyoHome()};if(window.CH1CLOSE&&CH1CLOSE.continues(variant))CH1CLOSE.handover(variant,()=>PROPHECY.play(variant,go));else go()};if(window.MAGGOT&&E.closing)MAGGOT.closing(E.closing,fin);else fin()}; /* v23.1：完美结局之后是「残響知覚」的觉醒演出（96m-echo-perception.js），只有第一次 */ // 结尾：普通的物品 → 再次出现标题window.scrollTo(0,0);
}
function leaveHotel(){save();stop();tokyoHome()}

/* ---------- 目标（任务页面使用） ---------- */
function objectives(){if(!campaign||!campaign.hotelCase&&!campaign.firstDayComplete)return [];H();return (CH.objectives||[]).filter(o=>!o.when||cond(o.when)).map(o=>({text:fill(o.text),done:!!(o.done&&cond(o.done))}))}

/* ---------- 输入 ---------- */
const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};
let pointerRoute=[];
function routeHotel(tx,ty){
 if(!S||paused||busy||mode!=='pixel'||DM.isOpen()||!player)return;
 const map=V().map, start=[player.tx,player.ty],q=[start],seen=new Set([start.join(',')]),prev=new Map(),D=Object.entries(DV);let goal=null;
 const destinations=[[tx,ty]];if(blockedFor(map,tx,ty))for(const [,d] of D)destinations.push([tx+d[0],ty+d[1]]);
 const valid=new Set(destinations.filter(([x,y])=>!blockedFor(map,x,y)).map(p=>p.join(',')));
 for(let i=0;i<q.length;i++){const p=q[i],k=p.join(',');if(valid.has(k)){goal=k;break}for(const [dir,d] of D){const nx=p[0]+d[0],ny=p[1]+d[1],nk=nx+','+ny;if(seen.has(nk)||blockedFor(map,nx,ny))continue;seen.add(nk);prev.set(nk,[k,dir]);q.push([nx,ny])}}
 if(!goal){pointerRoute=[];toast('这里无法直接到达，请选择其他位置。');return}
 const path=[];while(goal!==start.join(',')){const v=prev.get(goal);if(!v)break;path.unshift(v[1]);goal=v[0]}pointerRoute=path;keys.clear();
}
function hotelPointer(e){if(!S||!player||mode!=='pixel'||busy||DM.isOpen())return;const r=cv.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)*CW/r.width/T),y=Math.floor((e.clientY-r.top)*CHh/r.height/T);if(x>=0&&y>=0&&x<MW&&y<MH){const door=(MAPS[V().map].exits||[]).filter(e=>e.scene).find(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<=GAME_CONFIG.ch1Repairs.doorSnapTiles);routeHotel(door?door.x:x,door?door.y:y)}}
function onKey(e){
 if(document.querySelector('.et-modal-back'))return;
 if(!S||paused||busy)return;if(/input|textarea|select/i.test((e.target&&e.target.tagName)||''))return;
 if(DM.isOpen()||document.querySelector('.et-modal-back'))return;
 if(mode==='scene'){if(e.key==='Escape')closeScene();return}
 if(KEYMAP[e.key]){e.preventDefault();pointerRoute=[];keys.add(KEYMAP[e.key]);return}
 if([' ','Enter','e','E','z','Z'].includes(e.key)){e.preventDefault();interact()}
 if(e.key==='j'||e.key==='J'||e.key==='Tab'){e.preventDefault();journal()}
}
function onKeyUp(e){if(KEYMAP[e.key])keys.delete(KEYMAP[e.key])}
function heldDir(){return [...keys].pop()}
function updatePlayer(dt){
 if(player.moving){player.t+=dt/150*V51.speed();const k=Math.min(1,player.t);player.px=(player.x+(player.tx-player.x)*k)*T;player.py=(player.y+(player.ty-player.y)*k)*T;if(k>=1){player.moving=false;player.x=player.tx;player.y=player.ty;const v=V();v.x=player.x;v.y=player.y;arrive()}return}
 if(DM.isOpen()||mode!=='pixel')return;const d=heldDir()||pointerRoute.shift();if(!d)return;
 player.dir=d;V().dir=d;const [dx,dy]=DV[d],nx=player.x+dx,ny=player.y+dy,map=V().map;
 const ex=exitAt(map,nx,ny);
 if(ex&&ex.lock&&!cond(ex.lock.open)){keys.clear();play(ex.lock.node);return}
 if(blockedFor(map,nx,ny)){pointerRoute=[];return}
 player.tx=nx;player.ty=ny;player.moving=true;player.t=0;player.frame^=1;if(window.AUDIO)AUDIO.sfx('step');
}

/* ---------- 绘制（MapRenderer） ---------- */
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=(n>>16)+amt,g=(n>>8&255)+amt,b=(n&255)+amt;r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
function drawFloor(c,ch,x,y,tx,ty){
 if(ch==='.'){px(c,x,y,T,T,'#7a5c40');for(let i=0;i<4;i++){px(c,x,y+i*8,T,1,'#614732');px(c,x+((i+ty)%2?10:22),y+i*8,1,8,'#614732')}px(c,x+4,y+3,2,1,'#8a6a4c')}
 else if(ch===','){px(c,x,y,T,T,'#5e2a33');for(let i=0;i<T;i+=8)for(let j=0;j<T;j+=8)if(((i+j)/8)%2===0)px(c,x+i+3,y+j+3,2,2,'#733641');}
 else if(ch==='_'){px(c,x,y,T,T,'#8a9296');px(c,x,y,T,1,'#6f777a');px(c,x,y,1,T,'#6f777a');px(c,x+15,y,1,T,'#7a8285');px(c,x,y+15,T,1,'#7a8285')}
 else if(ch===':'){px(c,x,y,T,T,'#33363d');for(let i=0;i<6;i++)px(c,x+((tx*7+ty*13+i*11)%30),y+((tx*5+i*9+ty*3)%30),2,2,'#40444d')}
 else px(c,x,y,T,T,'#444');
}
function drawTile(c,m,tx,ty,mapId,visualPhase){
 const lightPhase=visualPhase||phase();let ch=m.rows[ty][tx];const an=mapId&&anomalyTile(mapId,tx,ty);if(an)ch=an;
 const x=tx*T,y=ty*T,[wl,wd,wt]=m.wall,WALLISH='#rNWFA';
 if(WALLISH.includes(ch)){
  const below=ty+1<MH?m.rows[ty+1][tx]:'#';
  if(WALLISH.includes(below)||ty+1>=MH){px(c,x,y,T,T,wt);px(c,x,y+T-2,T,2,shade(wt,10));px(c,x+((tx+ty)%2?4:20),y+((tx*3+ty)%4)*7+3,6,1,shade(wt,8));const above=ty>0?m.rows[ty-1][tx]:'#';if(!WALLISH.includes(above)){px(c,x,y,T,5,shade(wd,-20));px(c,x,y,T,2,wd)}if(ch==='r')door(c,m,tx,ty,x,y,-4);if(ch==='W'){px(c,x+6,y+8,20,14,lightPhase==='late'?'#101830':lightPhase==='day'?'#8ec6ee':'#3a5a8a');px(c,x+15,y+8,2,14,wd)}return}
  px(c,x,y,T,T,wl);px(c,x,y,T,6,wd);px(c,x,y+T-8,T,8,shade(wd,-10));
  if(mapId==='alley'){for(let r=0;r<4;r++)for(let k=0;k<4;k++)px(c,x+k*8+(r%2?4:0),y+6+r*5,7,4,shade(wl,(k+r)%2?-12:6))}
  if(ch==='r')door(c,m,tx,ty,x,y,0);
  if(mapId==='shopping'&&ty===1&&ch==='r'){
   const aw=tx<=3?'#a55746':tx<=9?'#407b8c':'#a58b4a';
   px(c,x,y+1,T,5,aw);px(c,x,y+6,T,2,shade(aw,-25));
   for(let q=0;q<4;q++)px(c,x+q*8,y+1,3,5,shade(aw,18));
  }

  if(ch==='A'){px(c,x+6,y+4,20,26,'#2a2228');px(c,x+8,y+6,16,22,'#3a3036');px(c,x+21,y+18,2,2,'#7a6a5a')}
  if(ch==='N'){px(c,x+3,y+6,26,18,'#b48a5a');px(c,x+6,y+9,8,10,'#f2ead5');px(c,x+17,y+8,9,7,'#f5d3d3');px(c,x+17,y+17,9,5,'#e8e8f5')}
  if(ch==='W'){px(c,x+4,y+7,24,16,lightPhase==='late'?'#101830':lightPhase==='day'?'#8ec6ee':'#3a5a8a');px(c,x+15,y+7,2,16,wd);px(c,x+4,y+14,24,2,wd)}
  if(ch==='F'){px(c,x+4,y+4,24,28,'#5a6a5a');px(c,x+6,y+6,20,24,lightPhase==='late'?'#2c3a2c':'#6a7a6a');px(c,x+8,y+8,16,6,'#3fae5a');px(c,x+11,y+9,10,4,'#e8f5e8');if(lightPhase==='late')px(c,x+24,y+6,3,24,'#0b0f0b')}
  return;
 }
 const FLOORISH=['C','S','T','P','V','R','B','D','U','L','K','X','G','O','Q','d','e','>','i','E','H','Y'];
 drawFloor(c,FLOORISH.includes(ch)?m.floor:ch,x,y,tx,ty);
 switch(ch){
  case 'C':px(c,x,y+4,T,28,'#4f3424');px(c,x,y+2,T,6,'#7a5438');px(c,x,y+28,T,4,'#33221a');if(tx%2)px(c,x+12,y+8,8,3,'#d7a879');break;
  case 'S':px(c,x+2,y+6,28,22,'#4b3558');px(c,x+2,y+6,28,6,'#5e4470');px(c,x+4,y+14,24,10,'#69507c');break;
  case 'T':px(c,x+4,y+8,24,18,'#5c4029');px(c,x+4,y+8,24,4,'#765535');px(c,x+12,y+14,8,6,'#e8e2cc');break;
  case 'P':px(c,x+10,y+20,12,10,'#7a4224');px(c,x+8,y+6,16,14,'#35683f');px(c,x+12,y+2,8,8,'#43834c');px(c,x+6,y+12,4,4,'#43834c');break;
  case 'V':px(c,x+3,y+1,26,30,'#a3303a');px(c,x+6,y+4,20,12,'#e8f0f5');for(let i=0;i<4;i++)px(c,x+7+i*5,y+7,3,7,['#d94','#4a8','#58c','#c55'][i]);px(c,x+18,y+20,6,6,'#222');px(c,x+7,y+19,8,2,'#fd3');break;
  case 'R':px(c,x+4,y+4,24,26,'#5c4029');for(let i=0;i<3;i++){px(c,x+6,y+6+i*8,20,6,['#c86','#68a','#8a6'][i])};break;
  case 'B':{const top=!(ty>0&&m.rows[ty-1][tx]==='B'),bot=!(ty+1<MH&&m.rows[ty+1][tx]==='B'),lft=!(tx>0&&m.rows[ty][tx-1]==='B'),rgt=!(m.rows[ty][tx+1]==='B');px(c,x+(lft?2:0),y+(top?2:0),T-(lft?2:0)-(rgt?2:0),T-(top?2:0)-(bot?2:0),'#e8e4dc');if(top)px(c,x+(lft?6:2),y+5,22,8,'#ffffff');else px(c,x+(lft?2:0),y,T-(lft?2:0)-(rgt?2:0),T-(bot?2:0),'#55638f');if(top)px(c,x+(lft?2:0),y+18,T-(lft?2:0)-(rgt?2:0),14,'#55638f');break}
  case 'D':px(c,x+2,y+8,28,20,'#5c4029');px(c,x+2,y+8,28,4,'#7a5636');px(c,x+20,y+2,6,8,'#f3d47a');px(c,x+22,y+9,2,4,'#333');break;
  case 'U':px(c,x+2,y+4,28,26,'#f0f0f0');px(c,x+5,y+8,22,18,'#cfe3ea');px(c,x+24,y+5,4,4,'#bbb');break;
  case 'L':px(c,x+2,y+2,28,28,'#523c2a');for(let i=0;i<3;i++){px(c,x+4,y+4+i*9,24,1,'#33261a');px(c,x+6+i*6,y+6+i*9,6,6,'#a87e4a')};break;
  case 'K':px(c,x+3,y+1,26,30,'#6c7a86');px(c,x+15,y+1,2,30,'#4c5862');for(let i=0;i<3;i++)px(c,x+6,y+5+i*4,7,1,'#3c4852');break;
  case 'X':px(c,x+3,y+6,26,22,'#a87e4a');px(c,x+3,y+6,26,3,'#c2965e');px(c,x+14,y+6,4,22,'#d2b87a');break;
  case 'G':px(c,x+3,y+4,26,26,'#355e41');px(c,x+2,y+3,28,5,'#437a51');px(c,x+8,y+14,16,2,'#264630');break;
  case 'O':px(c,x+14,y+4,4,28,'#444');px(c,x+8,y+1,16,6,'#888');if(lightPhase!=='evening'){c.fillStyle='rgba(255,230,140,.35)';c.beginPath();c.arc(x+16,y+8,10,0,7);c.fill()}break;
  case 'Q':px(c,x+3,y+10,26,18,'#6a4a2a');px(c,x+3,y+10,26,3,'#86603a');px(c,x+13,y+6,6,5,'#3a2a1a');px(c,x+6,y+16,20,1,'#4a3220');break;
  case 'H':px(c,x+9,y+12,14,16,'#6c7480');px(c,x+8,y+10,16,3,'#8a929e');break;
  case 'Y':px(c,x+4,y+10,24,18,'#5c4029');px(c,x+8,y+6,12,7,'#2b2b2b');px(c,x+10,y+4,8,3,'#3a3a3a');px(c,x+22,y+8,3,3,lightPhase==='late'?'#e85a5a':'#5a2a2a');break;
  case 'E':px(c,x+2,y,28,T,'#8f9aa6');px(c,x+4,y+4,11,26,'#b9c2cc');px(c,x+17,y+4,11,26,'#b9c2cc');px(c,x+15,y+4,2,26,'#6c7682');px(c,x+12,y+0,8,3,lightPhase==='late'?'#e85a5a':'#f3d47a');break;
  case 'd':px(c,x+2,y,28,T,'#4a3020');px(c,x+5,y+3,22,T-3,'#6d4c33');px(c,x+22,y+16,3,3,'#e8c46a');if(m.doorLabel&&m.doorLabel[tx+','+ty]){px(c,x+11,y+5,10,5,'#e9d9a8');c.fillStyle='#8a1a1a';c.font='bold 6px monospace';c.fillText(m.doorLabel[tx+','+ty],x+11,y+9)}break;
  case 'e':px(c,x+1,y,30,T,'#8fb6c8');px(c,x+1,y,30,3,'#4a5a68');px(c,x+15,y,2,T,'#4a5a68');break;
  case '>':for(let i=0;i<4;i++)px(c,x+2,y+2+i*7,28,5,shade('#7a6a5a',i*-12));break;
  case 'i':px(c,x,y,4,T,'#bdb0a0');px(c,x+28,y,4,T,'#bdb0a0');break;
 }
}
function door(c,m,tx,ty,x,y,dy){const no=m.doors&&m.doors[tx+','+ty];px(c,x+6,y+4+dy,20,26,'#5c3f29');px(c,x+8,y+6+dy,16,22,'#6d4c33');if(no){px(c,x+11,y+9+dy,10,5,'#e9d9a8');c.fillStyle='#3a2a1a';c.font='bold 6px monospace';c.fillText(no,x+11,y+13+dy)}px(c,x+21,y+18+dy,2,2,'#e8c46a');if(no==='207'){px(c,x+19,y+20+dy,6,8,'#f5f0e0');px(c,x+20,y+22+dy,4,1,'#a33')}}
const SPR={down:['................','.....hhhhhh.....','....hhhhhhhh....','....hssssssh....','....sesssses....','....ssssssss....','.....ssmmss.....','......ssss......','....bbbbbbbb....','...bbbbaabbbb...','...sbbbbbbbbs...','...sbbbbbbbbs...','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....kkk..kkk....'],
 up:['................','.....hhhhhh.....','....hhhhhhhh....','....hhhhhhhh....','....hhhhhhhh....','....shhhhhhs....','.....ssssss.....','......ssss......','....bbbbbbbb....','...bbbbbbbbbb...','...sbbbbbbbbs...','...sbbbbbbbbs...','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....kkk..kkk....'],
 right:['................','.....hhhhhh.....','....hhhhhhhh....','....hhhhssss....','....hhhssses....','....hhssssss....','.....ssssmm.....','......ssss......','....bbbbbbbb....','....bbbbbabb....','....bbsbbbbb....','....bbsbbbbb....','....pppppppp....','.....pp..pp.....','.....pp..pp.....','.....kk..kk.....']};
function drawChar(c,x,y,pal,dir,frame,ghost){
 if(window.SPRITE2&&SPRITE2.drawPal(c,x,y,pal,dir,frame,ghost,PLAYER_PAL))return;
 const rows=SPR[dir==='left'?'right':dir],flip=dir==='left';
 c.save();if(ghost)c.globalAlpha=.45+.15*Math.sin(performance.now()/400);
 c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x+8,y+29,16,3);const bob=frame?-1:0;
 for(let r=0;r<16;r++){const row=rows[r];for(let i=0;i<16;i++){const k=row[i];if(k==='.')continue;if(frame&&r===15&&(flip?i>8:i<8))continue;const col=k==='e'?'#1b1b24':k==='m'?'#b0605a':pal[k];if(!col)continue;c.fillStyle=ghost?shade(col,30):col;c.fillRect(x+(flip?15-i:i)*2,y+r*2+bob,2,2)}}
 c.restore();
}
/* ---------- 氛围：窗外的雨、售货机的光、灰尘、凌晨灯光闪烁、暗角 ---------- */
let dust=[],flickerUntil=0;
function atmosphere(map,m,ph){
 const now=performance.now();
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const ch=m.rows[y][x];
  if(ch==='W'&&ph!=='day'){const wx=x*T+5,wy=y*T+8;ctx.save();ctx.beginPath();ctx.rect(wx,wy,22,14);ctx.clip();ctx.strokeStyle='rgba(170,200,230,.45)';for(let i=0;i<5;i++){const ox=((now/40+i*9+x*7)%26)-2,oy=((now/18+i*13)%20)-4;ctx.beginPath();ctx.moveTo(wx+ox,wy+oy);ctx.lineTo(wx+ox-2,wy+oy+5);ctx.stroke()}ctx.restore()}
  if(ch==='V'&&ph!=='evening'&&ph!=='day'){const g=ctx.createRadialGradient(x*T+16,y*T+16,4,x*T+16,y*T+16,60);g.addColorStop(0,'rgba(255,90,90,.20)');g.addColorStop(1,'rgba(255,90,90,0)');ctx.fillStyle=g;ctx.fillRect(x*T-48,y*T-48,128,128)}
  if(ch==='E'&&ph==='late'){ctx.fillStyle='rgba(232,90,90,'+(0.25+0.2*Math.sin(now/300))+')';ctx.fillRect(x*T+12,y*T,8,3)}
 }
 if(map==='lobby'&&ph!=='late'){if(!dust.length)dust=[...Array(14)].map(()=>({x:Math.random()*CW,y:Math.random()*CHh,v:0.05+Math.random()*0.1}));
  ctx.fillStyle='rgba(255,240,210,.35)';dust.forEach(d=>{d.y-=d.v;d.x+=Math.sin(now/900+d.v*40)*0.15;if(d.y<0){d.y=CHh;d.x=Math.random()*CW}ctx.fillRect(d.x|0,d.y|0,1,1)})}
 if(ph==='late'&&Math.random()<0.012)flickerUntil=now+90+Math.random()*120;
 if(now<flickerUntil){ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,0,CW,CHh)}
 const v=ctx.createRadialGradient(CW/2,CHh/2,CHh*.45,CW/2,CHh/2,CW*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=v;ctx.fillRect(0,0,CW,CHh);
}
function render(){
 if(!ctx||mode!=='pixel')return;const v=V(),map=v.map,m=MAPS[map],key=map+'|'+phase()+'|'+(MAPS[map].anomalies||[]).map(a=>cond(a.when)?1:0).join('');
 if(!tileCache[key]){const off=document.createElement('canvas');off.width=CW;off.height=CHh;const oc=off.getContext('2d');for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)drawTile(oc,m,x,y,map);tileCache[key]=off}
 ctx.drawImage(tileCache[key],0,0);
 if(map==='lobby')FLOOD.paintWater(ctx,true);
 const list=[];
 for(const [id,st] of Object.entries(npcState))if(st.on&&st.map===map)list.push({y:st.py,draw:()=>drawChar(ctx,st.px,st.py,NPCS[id].palette,st.dir,st.moving?Math.floor(performance.now()/160)%2:0,NPCS[id].ghost)});
 list.push({y:player.py,draw:()=>v51PlayerSprite(ctx,player.px,player.py,GAME_CONFIG.v51View.walk.hotel,(x,y)=>drawChar(ctx,x,y,PLAYER_PAL,player.dir,player.moving?player.frame:0))});
 list.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 const ph=phase();
 if(ph==='day'){ctx.fillStyle='rgba(255,236,200,.07)';ctx.fillRect(0,0,CW,CHh)}
 if(ph==='night'){ctx.fillStyle='rgba(10,16,48,.28)';ctx.fillRect(0,0,CW,CHh)}
 if(ph==='late'){ctx.fillStyle='rgba(4,6,26,.5)';ctx.fillRect(0,0,CW,CHh);const g=ctx.createRadialGradient(player.px+16,player.py+16,10,player.px+16,player.py+16,150);g.addColorStop(0,'rgba(255,230,170,.18)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,CW,CHh)}
 atmosphere(map,m,ph);
 if(campaign.san<=40){const g=ctx.createRadialGradient(CW/2,CHh/2,CHh*.35,CW/2,CHh/2,CW*.65);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(90,20,70,'+(campaign.san<=15?.55:.3)+')');ctx.fillStyle=g;ctx.fillRect(0,0,CW,CHh)}
 ctx.font='bold 11px system-ui,sans-serif';ctx.textAlign='center';
 for(const [id,st] of Object.entries(npcState))if(st.on&&st.map===map){const t=npcName(id);const w=ctx.measureText(t).width+8;ctx.fillStyle='rgba(16,20,28,.78)';ctx.fillRect(st.px+16-w/2,st.py-13,w,13);ctx.fillStyle=NPCS[id].ghost?'#cfd8ff':'#d7a879';ctx.fillText(t,st.px+16,st.py-3)}
 const it=!DM.isOpen()&&!player.moving?findInteractable():null;
 if(it){const bx=it.x*T+16,by=it.y*T-4+Math.sin(performance.now()/180)*2;ctx.fillStyle='#d7a879';ctx.fillRect(bx-9,by-26,18,16);ctx.fillStyle='#10141c';ctx.fillText('A',bx,by-14)}
 ctx.textAlign='left';
 const hint=document.getElementById('h18-hint');if(hint){const t=it?'A / 空格：'+it.label:'WASD / 点击或触摸地图移动 · J 调查手帐';if(hint.textContent!==t)hint.textContent=t}
}
function loop(ts){
 if(!S)return;if(!document.getElementById('h18-stage')){stop();return}
 const dt=Math.min(60,ts-(last||ts));last=ts;
 if(!paused&&!document.querySelector('.et-modal-back')){if(mode==='pixel'){updatePlayer(dt);stepNPCs(dt);render()}}
 raf=requestAnimationFrame(loop);
}
function stop(){if(DAY&&campaign&&campaign.hotelCase){const v=V();v.dayPos={map:v.map,x:v.x,y:v.y,dir:v.dir};if(nightStash)Object.assign(v,nightStash);campaignSave()}DAY=false;nightStash=null; // 白天的位置单独记，夜里回到原来的地方
 pointerRoute=[];S=null;paused=false;cancelAnimationFrame(raf);clearTimeout(ruleTimer);keys.clear();DM.close();TM.setOverride(null);document.removeEventListener('keydown',onKey);document.removeEventListener('keyup',onKeyUp);UI.update()}
function pause(){if(S){save();stop()}}
function refreshHUD(){const el=document.getElementById('h18-hud');if(!el||!campaign)return;const v=V();el.innerHTML=`<span>${DAY?'☀ <b>白天</b> · 不花行动点':'⏰ <b>'+clockStr()+'</b> '+phaseName()}</span><span>📍 ${esc(placeName())}</span><span class="${isLastNight()?'h18-last':''}">🌙 ${esc(caseLabel())}</span><span>🔎 证据 ${v.clues.length}</span><span>🗣 证词 ${v.testimony.length}</span>`;if(v.map==='lobby'&&mode==='pixel')FLOOD.mountObservation(el,'glass',!DAY);UI.update()}
function ambienceName(){if(mode==='scene')return phase()==='late'?'late':'scene';if(phase()==='late')return 'late';return V().map==='lobby'?'lobby':'corridor'}
function placeName(){return mode==='scene'&&SCENES[sceneId]?SCENES[sceneId].name:(MAPS[V().map]||{}).name||''}

/* ---------- 进入酒店（与每日时间联动） ---------- */
function enterNight(useDayClock){const v=V();F()['tonight:entered']=true;if(!v.startDay)v.startDay=campaign.day;
 if(useDayClock){const dc=TM.dayClock()-START_HOUR*60;if(dc>v.clock)v.clock=Math.min(END_CLOCK-60,dc)}v.lastProgress={day:campaign.day,clock:v.clock};if(window.CASE5)CASE5.begin(v.clock);save();retrySave('night')}
/* v23：普通结局之后可以「回到做决定之前 / 回到这一夜的开始」（存在 localStorage 的 tokyo-ch1-retry，回到东京时清除） */
const RETRY_KEY='tokyo-ch1-retry';
function retryGet(){try{return JSON.parse(localStorage.getItem(RETRY_KEY)||'null')}catch(e){return null}}
function retrySave(kind){try{const r=retryGet()||{};r[kind]={data:JSON.parse(JSON.stringify(campaign)),day:campaign.day,night:nightNo(),clock:clockStr()};if(kind==='night')delete r.decision;localStorage.setItem(RETRY_KEY,JSON.stringify(r))}catch(e){}}
function retryClear(){try{localStorage.removeItem(RETRY_KEY)}catch(e){}}
function retryRestore(kind){const r=retryGet();if(!r||!r[kind])return;campaign=JSON.parse(JSON.stringify(r[kind].data));if(kind==='night'){delete r.decision;try{localStorage.setItem(RETRY_KEY,JSON.stringify(r))}catch(e){}}campaignSave();if(typeof sanAtmosphere==='function')sanAtmosphere();DM.clearHistory();start()}
/* 错过期限：207 已经重新开放 */
function tooLate(){if(window.CASE5){stop();CASE5.expire();return}stop();UI.scene('story',start);app.innerHTML=`<div class="rpg-shell"><section class="story-panel"><div class="story-meta">CHAPTER 01 // DAY ${campaign.day}</div><h1>207号室已经重新开放</h1><p>${esc(fill(CH.lateText||''))}</p><button class="story-btn" id="h18-late">▶ 继续</button></section></div>`;app.querySelector('#h18-late').onclick=()=>{S={};ending(CH.lateEnding||'late')}}
function build(){ // 白天/夜里共用的酒店画面（v32 从 start() 抽出）
 const v=V();
 S={};tileCache={};mode='pixel';sceneId=null;
 UI.scene('pixel',DAY?()=>startDay():start);if(!DAY)TM.setOverride(()=>S?START_HOUR*60+V().clock:null,()=>S?phaseName():null);
 app.innerHTML=`<div class="rpg-shell h18-shell"><section class="rpg-panel h18-panel"><div class="h18-top"><div><div class="rpg-kicker">${DAY?'CHAPTER 01 // DAY '+campaign.day+' · 白天':'CHAPTER 01 // '+esc(ch1Title())}</div><h1 class="h18-title">${esc(DAY?'白天的港屋酒店':CH.subtitle||'')}</h1></div><div class="h18-topbtns">${DAY?'<button class="rpg-inline-back" id="h18-tonight" type="button">'+(caseDue()?'📝 整理最终报告':'☾ 开始夜间调查')+'</button>':''}<button class="rpg-inline-back" id="h18-exit" type="button">← 离开酒店</button></div></div><div id="h18-hud" class="h18-hud"></div>
 <div class="h18-stage" id="h18-stage"><canvas id="h18-canvas" width="${CW}" height="${CHh}" tabindex="0" aria-label="酒店地图，使用WASD 或点击/触摸地图移动，空格调查"></canvas><div id="h18-scene" class="h18-scene"></div><div id="h18-toast" class="h18-toast" hidden></div></div>
 <div id="h18-hint" class="h18-hint" aria-live="polite"></div><div id="h18-dlg" class="adv-box" hidden aria-live="polite"></div>
 <div class="h18-controls"><div class="h18-pad"><button type="button" data-d="up" aria-label="上">▲</button><button type="button" data-d="left" aria-label="左">◀</button><button type="button" data-d="down" aria-label="下">▼</button><button type="button" data-d="right" aria-label="右">▶</button></div><div class="h18-btns"><button type="button" class="h18-a" id="h18-a" aria-label="调查/交谈">A<small>调查</small></button><button type="button" class="h18-b" id="h18-j" aria-label="调查手帐">📓<small>手帐</small></button></div></div>
 <p class="rpg-footnote">${esc(DAY?'白天：和当班的人聊聊，看看周围。白天在酒店里不花行动点；夜里的怪事不会在白天发生。':CH.footnote||'')}</p></section></div>`;
 cv=document.getElementById('h18-canvas');ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;cv.addEventListener('click',hotelPointer);
 player={x:v.x,y:v.y,px:v.x*T,py:v.y*T,dir:v.dir,moving:false,t:0,tx:v.x,ty:v.y,frame:0};
 if(blockedFor(v.map,v.x,v.y)){v.map='lobby';v.x=8;v.y=8;Object.assign(player,{x:8,y:8,px:8*T,py:8*T,tx:8,ty:8})}
 placeNPCs(true);
 document.addEventListener('keydown',onKey);document.addEventListener('keyup',onKeyUp);
 app.querySelector('#h18-exit').onclick=()=>{if(DM.isOpen())return;UI.confirm('暂时离开酒店？',DAY?'白天在酒店里不花行动点。今晚还可以回来。':'进度会自动保存，今晚还可以回来。',leaveHotel)};const tn=app.querySelector('#h18-tonight');if(tn)tn.onclick=()=>{if(DM.isOpen())return;if(caseDue()){dueModal();return}stop();start()};
 app.querySelector('#h18-a').onclick=()=>interact();
 app.querySelector('#h18-j').onclick=()=>{if(!DM.isOpen()&&mode==='pixel')journal()};
 app.querySelectorAll('[data-d]').forEach(b=>{const d=b.dataset.d;const on=e=>{e.preventDefault();keys.clear();keys.add(d);b.setPointerCapture?.(e.pointerId)},off=e=>{e.preventDefault();keys.delete(d)};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);b.addEventListener('contextmenu',e=>e.preventDefault())});
 refreshHUD();last=0;raf=requestAnimationFrame(loop);cv.focus({preventScroll:true});window.scrollTo(0,0);
}
/* v32：白天的港屋酒店。人物按 schedule.day 站位，台词没有 day 的用傍晚那一句；不走时钟、不触发夜间规则、不能进 207 等调查场景 */
/* v32.1：旧版按钮式白天（campaign.hotelCase.dayVisit）的进度换成人物记忆 / 标记，只做一次；信任度旧版已经加过 */
function migrateOldDay(){const h=H(),v=V(),od=h.dayVisit;if(!od||v.flags['day:migrated'])return;v.flags['day:migrated']=true;const t=od.talk||{},sn=od.seen||{};const mem=(id,k)=>{if(v.npc[id])v.npc[id].mem[k]=true};
 const map={'sato:social':['sato:dayGreet','sato:greet'],'sato:room':['sato:dayRoom'],'sato:207':['sato:dayVacant'],'sato:handoff':['sato:dayHandoff'],'mori:social':['mori:dayGreet'],'mori:sound':['mori:daySound'],'mori:repair':['mori:dayNotice'],'mori:handoff':['mori:dayRecords'],'inoue:help':['inoue:dayHelp'],'inoue:routine':['inoue:dayRoutine'],'inoue:form':['inoue:dayTerm'],'kobayashi:social':['kobayashi:dayGreet'],'kobayashi:routine':['kobayashi:dayRoutine'],'kobayashi:sound':['kobayashi:daySound'],'maid:routine':['day_maid:routine']};
 for(const [k,list] of Object.entries(map))if(t[k])list.forEach(x=>{const [a,b]=x.split(':');mem(a,b)});
 if(t['sato:schedule']||sn.thing_schedule)v.flags['day:schedule']=true;if(sn.thing_notice||sn.thing_repair)v.flags['day:notice']=true;if(t['clerk:records'])v.flags['day:recordsMori']=true;
 save()}
function startDay(place){
 if(!campaign||!campaign.firstDayComplete||campaign.day<2){tokyoHome();return}
 const h=H();if(h.ending){endingScreen();return}
 if(window.CASE5&&CASE5.gate())return;
 migrateOldDay();stop();DAY=true;const v=V();nightStash={map:v.map,x:v.x,y:v.y,dir:v.dir};
 const spots={lobby:['lobby',8,8,'up'],front:['lobby',11,4,'up'],hall:['corridor',1,5,'right'],office:['office',1,4,'right']},sp=spots[place];
 const p=sp?{map:sp[0],x:sp[1],y:sp[2],dir:sp[3]}:(v.dayPos&&MAPS[v.dayPos.map]?v.dayPos:{map:'lobby',x:8,y:8,dir:'up'});
 Object.assign(v,{map:p.map,x:p.x,y:p.y,dir:p.dir});
 build();
 if(F()['day:intro']!==campaign.day){F()['day:intro']=campaign.day;save();setTimeout(()=>toast('☀ 白天的港屋酒店 · 和当班的人聊聊，看看周围'),300)}
}
function start(){
 if(!campaign||!campaign.firstDayComplete){tokyoHome();return}
 const h=H();if(h.ending){endingScreen();return}
 if(window.CASE5&&CASE5.gate())return; // v28：调查期限已到 → 最终调查报告
 if(caseDue()){dueModal(()=>tokyoHome());return} // v58：期限已到，不再进入夜间调查（原来会先扣掉今天的行动再跳到报告页）
 const v=V();
 dayDefaults();
 if(!F()['tonight:entered']&&campaign.actions>0){
  UI.confirm('回酒店进行夜间调查？','回到酒店后，今天剩下的 '+campaign.actions+' 次行动将用于夜间调查（时间来到傍晚 18:00 以后），不能再出去打工或探索。'+(v.startDay&&window.CASE5?'\n\n调查期限：'+CASE5.deadlineText()+'。':''),()=>{if(!V51.hotelEntry())return;campaign.actions=0;enterNight(false);start()});
  return;
 }
 if(!V51.hotelEntry())return;
 if(!F()['tonight:entered'])enterNight(true);
 if(v.startDay&&campaign.day>=reopenDay()){tooLate();return}
 stop();build();
 if(!v.intro){v.intro=true;save();play(CH.introNode)}
 else if(v.clock>=END_CLOCK)setTimeout(()=>dawn(true),200);
 else {checkRules('enter:'+v.map);checkRules('clock')}
}
/* v58：第一章调查期限已到（报告还没交） */
function caseDue(){try{const c=campaign&&campaign.case1;return !!(window.CASE5&&c&&['report','due'].includes(c.state)&&CASE5.due())}catch(e){return false}}
function dueModal(onCancel){const c=campaign.case1;const ext=!c.extended&&!c.report;
 UI.modal({title:'调查期限已到',html:'<p>港屋酒店207号室的调查期限已经结束，不能再进行夜间调查。</p><p>请整理并提交最终调查报告'+(ext?'；还没整理好的话，也可以在报告页申请延迟结案':'')+'。</p>',
  buttons:[{label:'📝 整理最终报告',primary:true,fn:()=>{stop();if(c.state==='due')CASE5.notice();else CASE5.reportPage()}},{label:'取消',fn:()=>{if(onCancel)onCancel()}}]})}
/* 测试与调试接口 */
return {where:()=>mode==='scene'?'scene:'+sceneId:V().map,pos:()=>player?{x:player.x,y:player.y}:{x:V().x,y:V().y},_talk:id=>talk(id),_dayTip:()=>{dayTip();return !!F()['tip:dayout:'+campaign.day]},fortuneTarget,startDay,isDay:()=>DAY,apply,pick,freeze:()=>{const was=paused;paused=true;keys.clear();clearTimeout(ruleTimer);return ()=>{paused=was;last=0;keys.clear();if(S&&!paused){checkRules(mode==="scene"?"scene:"+sceneId:"enter:"+V().map);checkRules("clock")}if(cv)cv.focus({preventScroll:true})}},resync:()=>{if(!S||!player)return;const v=V();Object.assign(player,{x:v.x,y:v.y,px:v.x*T,py:v.y*T,tx:v.x,ty:v.y,dir:v.dir,moving:false});tileCache={};placeNPCs(true);if(mode==='scene')renderScene();refreshHUD()},start,stop,pause,active:()=>!!S,placeName,ambienceName,objectives:()=>{try{return objectives()}catch(e){return []}},
 evidenceList:(withDesc)=>campaign&&campaign.hotelCase?V().clues.map(k=>Object.assign({id:k},EVID[k])):[],
 testimonies:()=>campaign&&campaign.hotelCase?V().testimony.map(t=>((EVID[t]||{}).desc||t)+((EVID[t]||{}).jp?'\n「'+EVID[t].jp+'」':'')):[],
 relations:()=>campaign&&campaign.hotelCase?Object.keys(NPCS).filter(id=>!NPCS[id].ghost&&!NPCS[id].hidden&&F()['met:'+id]).map(id=>({name:npcName(id),role:NPCS[id].role,trust:N(id).trust,stress:N(id).stress})):[],
 diary:()=>campaign&&campaign.hotelCase?H().diary:[],flag:k=>!!(campaign&&campaign.hotelCase&&campaign.hotelCase.v18&&campaign.hotelCase.v18.flags[k]),
 state:()=>({v:V(),npc:npcState,player,mode,scene:sceneId,dlg:DM.isOpen()}),maps:MAPS,teleport:(m,x,y)=>changeMap(m,x,y,'down'),interact,journal,decide,ending,advance,clueCount,endingScreen,retry:retryGet,retryRestore,openScene,closeScene,play,cond,talk,host,placeNPCs,endDialog,dawn,nodes:NODES,nightNo,isLastNight,reopenDay,currentHint,unreadList,busy:()=>busy,climax,
 drawMap:(c,map)=>{const m=MAPS[map];if(!m||!c)return;const g=c.getContext('2d');g.imageSmoothingEnabled=false;for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)drawTile(g,m,x,y,map)},pixelTile:(g,m,x,y,ph)=>drawTile(g,m,x,y,null,ph||'evening'),pixelPerson:(g,x,y,pal,dir,frame)=>drawChar(g,x,y,pal||PLAYER_PAL,dir||'down',frame||0,false),tile:T};
})();
function hotelQuest(){H18.start()};
/* 第一天入住后，可以直接开始第一章的第一夜 */
const h18Day1Success=firstDaySuccess;
firstDaySuccess=function(){h18Day1Success();const btn=app.querySelector('#day1-sleep');if(!btn||!campaign||(campaign.hotelCase&&campaign.hotelCase.ending))return;
 btn.insertAdjacentHTML('beforebegin','<button class="survival-btn" id="day1-ch1">🏨 上楼回房间（'+esc(ch1Revealed()?'第一章《'+ch1Title()+'》':'第一章')+'）</button>');
 btn.classList.add('alt');btn.textContent='☾ 直接睡觉 → DAY 2';app.querySelector('#day1-ch1').onclick=()=>H18.start()};
window.H18=H18;window.__H18=H18;

/* DAY 02 onward: 白天酒店自由核查，不强制进入夜间，也不消耗全部行动点。 */
window.HOTEL_DAY2=(function(){
 const places={lobby:'一楼大厅',front:'前台附近',hall:'二楼走廊',office:'经理办公室门外'};
 function state(){campaign.hotelCase??={};const h=campaign.hotelCase;h.dayVisit??={seen:{},notes:[],talk:{}};h.dayVisit.seen??={};h.dayVisit.notes??=[];h.dayVisit.talk??={};return h.dayVisit}
 function view(place='lobby'){
  if(!campaign||campaign.day<2){tokyoHome();return}
  if(!places[place])place='lobby';
  const ds=state();ds.seen[place]=true;campaignSave();UI.scene('day-hotel',()=>view(place));
  const people={lobby:[['traveler','退房的旅客','🧳',18,33],['inoue','井上（客房人员）','🧹',70,53],['mori','森经理','👔',78,30]],front:[['sato','佐藤（前台）','👩',35,45],['guest','正在登记的客人','🧳',75,54]],hall:[['kobayashi','小林（巡查）','👮',76,37],['maid','客房工作人员','🧹',22,54]],office:[['mori','森经理','👔',60,43],['clerk','办公室职员','📋',25,54]]};
  const things={lobby:[['exit','大门','🚪'],['notice','维修告示','📋'],['sofa','等候区','🛋']],front:[['schedule','房务排班','📃'],['repair','维修单','🗒']],hall:[['handoff','207门框附近','🚪'],['sound','走廊','👂'],['206','206房门','🗝']],office:[['door','办公室门','🚪'],['cart','文件推车','🗂']]};
  // NPC respond only to information the player has actually encountered.
  const seen=k=>!!ds.seen[k];
  const investigated=k=>!!ds.talk[k];
  const hasClue=id=>{try{return !!(window.INV&&INV.hasClue&&INV.hasClue(id))}catch(e){return false}};
  const hasHotelRecord=()=>seen('thing_handoff')||hasClue('C01');
  const metFront=()=>seen('question_sato')||seen('thing_schedule');
  const hasMaintenance=()=>seen('thing_notice')||seen('thing_repair');
  const hasAbnormalRoom=()=>seen('thing_handoff')||seen('question_sato');
  const acquainted=id=>!!ds.talk[id+':social']||!!(campaign.hotelCase?.v18?.npc?.[id]?.trust>=1);
  const warmly=id=>!!ds.talk[id+':help']||!!(campaign.hotelCase?.v18?.npc?.[id]?.trust>=2);
  function befriend(id,kind='social'){if(!ds.talk[id+':'+kind]){ds.talk[id+':'+kind]=true;const n=campaign.hotelCase?.v18?.npc?.[id];if(n)n.trust=Math.min(5,(n.trust||0)+1);campaignSave();}markTalk(id,kind);}
  const markTalk=(id,topic)=>{ds.talk[id+':'+topic]=true;campaignSave();app.querySelectorAll('[data-dh-npc="'+id+'"]').forEach(el=>{el.innerHTML=el.innerHTML.replace('!', '✓')})};
  const investigatedName=id=>Object.keys(ds.talk).some(k=>k.startsWith(id+':')&&k!==id+':met');
  const doneCount=Object.keys(ds.talk).filter(k=>ds.talk[k]).length;
  app.innerHTML=`<div class="rpg-shell"><section class="rpg-panel"><div class="rpg-kicker">CHAPTER 01 · DAY ${String(campaign.day).padStart(2,'0')} · 午前</div><h1>港屋酒店 · ${places[place]}</h1><p class="rpg-tiny">你可以和当班人员聊聊，也可以看看周围。想出门时再走。</p><div class="day-map" style="position:relative;max-width:560px;margin:auto"><canvas id="day-hotel-canvas" width="512" height="352" aria-label="酒店白天场景"></canvas>${people[place].map(([id,name,emoji,x,y])=>`<button type="button" data-dh-npc="${id}" title="与${name}交谈" style="position:absolute;left:${x}%;top:${y}%;min-width:48px;padding:5px;border:1px solid #887b69;border-radius:8px;background:rgba(23,27,38,.88);color:white;cursor:pointer;transform:translate(-50%,-50%);font-size:12px">${emoji} ${investigatedName(id)?'✓':'!'}<span style="display:block;font-size:10px">${name}</span></button>`).join('')}</div><div class="day-pad" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${Object.entries(places).map(([id,name])=>`<button data-dh-place="${id}" ${id===place?'disabled':''}>${name}</button>`).join('')}</div><h3 style="margin:12px 0 6px">附近可查看</h3><div class="day-pad" style="display:flex;gap:8px;flex-wrap:wrap">${things[place].map(([id,name,icon])=>`<button data-dh-thing="${id}">${ds.seen['thing_'+id]?'✓ ':' '}${icon} ${name}</button>`).join('')}</div><article class="day-dialogue" id="dh-result" aria-live="polite" style="margin-top:12px"><p>你在${places[place]}停下脚步，四周仍有人照常工作。</p></article><div class="day-pad" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button id="dh-out">🗺 离开酒店，前往街区</button><button id="dh-night">☾ 等到傍晚，继续酒店调查</button></div><p class="rpg-tiny">对白及观察进度会保存。普通交谈不耗尽当天行动点；酒店夜间探索仍使用原有系统。</p></section></div>`;
  const canvas=app.querySelector('#day-hotel-canvas');if(canvas&&window.H18)H18.drawMap(canvas,place==='hall'?'corridor':place==='office'?'office':'lobby');
  const panel=app.querySelector('#dh-result');
  function show(t,opts=[]){panel.replaceChildren();const p=document.createElement('p');p.style.whiteSpace='pre-line';p.textContent=t;panel.append(p);if(opts.length){const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';for(const [label,fn] of opts){const b=document.createElement('button');b.className='survival-btn';b.textContent=label;b.onclick=fn;row.append(b)}panel.append(row)}}
  function note(k,t){ds.seen[k]=true;if(t&&!ds.notes.includes(t))ds.notes.push(t);campaignSave()}
  function spoke(id){ds.talk[id+':met']=true;campaignSave();app.querySelectorAll('[data-dh-npc="'+id+'"]').forEach(el=>{el.innerHTML=el.innerHTML.replace('!', '✓')})}
  const ask=(id,opening,opts)=>{spoke(id);show(opening,opts)};
  function person(id){
   if(id==='sato')return ask(id,'佐藤正在核对客人的预约单，见你走近，她把笔放下。\n「何かご用でしょうか。」\n“有什么需要吗？”',[
    ['说声早安，问她今早忙不忙',()=>{befriend('sato');show('「おはようございます。今日は少し立て込んでいまして。」\n“早上好，今天稍微有点忙。”\n她把一张房卡递给排队的客人，又回头朝你笑了笑。')}],
    ['问自己房间的设施',()=>{markTalk('sato','room');show('「お部屋で何かございましたか。」\n“房间里有什么问题吗？”',[['说起昨夜听见的水声',()=>{note('question_sato','佐藤听说你昨夜听见过声音。');show('佐藤略显为难。\n「設備の音かもしれません。確認しておきます。」\n“可能是设备的声音。我会问问。”')}],['没什么',()=>show('她点头，把房卡推回柜台边。')]])}],
    ...(acquainted('sato')?[['问207为什么不接待客人',()=>{markTalk('sato','207');note('question_sato','佐藤说207暂时作为杂物间使用。');show('「古い設備が多くて、今は物置として使っています。」\n“设备太老旧，现在暂时当杂物间使用。”',[['问何时停用',()=>show('「正確な日は、すぐには分かりません。」\n“确切日期，我现在说不准。”')]])}]]:[]),
    ['问柜台旁摆放的房务排班',()=>{markTalk('sato','schedule');show('「これは今週の担当表です。どうぞ。」\n“这是本周的排班表，请看。”')}],
    ...(hasHotelRecord()?[['出示二楼发现的旧交接单',()=>{markTalk('sato','handoff');show('佐藤接过纸看了看。\n「以前の清掃記録かもしれません。今の担当表とは別です。」\n“可能是以前的清扫记录，和现在的排班不是一回事。”',[['请她帮忙确认上面的日期',()=>show('她凑近纸角。\n「この日付なら、事務所で確認が必要ですね。」\n“这个日期得向办公室核实。”')]])}]]:[]),
    ['问附近有什么可逛的',()=>show('「上野や浅草なら電車で行けますよ。」\n“坐电车可以去上野或浅草。”')]]);
   if(id==='mori')return ask(id,'森经理正准备离开，看见你便放慢脚步。\n「お泊まりに何か問題でも？」\n“住宿有什么问题吗？”',[
    ['顺口问候今天的入住情况',()=>{befriend('mori');show('「今日はいつもよりお客様が多いですね。」\n“今天比平时忙一些。”\n他回头招呼了一位刚进门的客人。')}],
    ['询问酒店附近交通',()=>show('「最寄り駅は品川です。案内図はフロントにあります。」\n“最近的车站是品川，前台有交通图。”')],
    ...(acquainted('mori')?[['提到昨晚听见的声音',()=>{markTalk('mori','sound');show('森抬头看了眼楼梯。\n「設備の音かもしれません。確認します。」\n“可能是设备的声音，我会核实。”')}]]:[]),
    ...(hasMaintenance()?[['拿刚看过的维修告示问他',()=>{markTalk('mori','repair');show('森看了看你指的日期。\n「順番に直しています。作業の予定は変わることもあります。」\n“正在逐项维修，计划有时会调整。”')}]]:[]),
    ...(hasHotelRecord()&&investigated('sato:handoff')?[['询问旧单据应由谁核对',()=>{markTalk('mori','handoff');show('森只扫了一眼。\n「事務所で確認してからお答えします。」\n“要在办公室核实后才能答复。”')}]]:[])]);
   if(id==='inoue')return ask(id,'井上推着清洁车，车轮在地砖缝上轻磕了一下。',[
    ['问早餐时间',()=>show('「フロントの案内に書いてありますよ。」\n“前台的说明上有。”')],
    ['帮她扶住快倒的清洁桶',()=>{befriend('inoue','help');note('inoue_help','你帮井上扶住了快要倾倒的清洁桶。');show('桶没有翻。井上松了口气。\n「助かりました。ありがとうございます。」\n“帮大忙了，谢谢。”')}],
    ...(acquainted('inoue')?[['询问客房服务通常如何安排',()=>{markTalk('inoue','routine');show('「交換の記録は毎日つけます。部屋によって違いますよ。」\n“更换记录每天都记，不同房间不一样。”')}]]:[]),
    ...(hasHotelRecord()&&investigated('inoue:routine')?[['请她看看旧客房单上的术语',()=>{markTalk('inoue','form');show('井上看了看。\n「連泊なら、タオルだけ替えることもあります。」\n“连住的客人，有时只换毛巾。”\n她并没有说这张纸是谁写的。')}]]:[])]);
   if(id==='kobayashi')return ask(id,'小林正在检查消防门，见你停下，收起手里的检查表。',[
    ['问他今早的巡查辛不辛苦',()=>{befriend('kobayashi');show('「朝は出入りが多いですからね。」\n“早上进出的人多。”\n他把检查表夹回板子上，点点头。')}],
    ['问哪里能去便利店',()=>show('「駅の手前にありますよ。」\n“车站前就有。”')],
    ...(acquainted('kobayashi')?[['询问巡查通常怎么安排',()=>{markTalk('kobayashi','routine');show('「当番で回っています。」\n“按照值班表轮流巡查。”')}]]:[]),
    ...(investigated('sato:room')?[['说起昨晚的声音',()=>{markTalk('kobayashi','sound');show('「フロントに伝えておきます。」\n“我会转告前台。”\n小林没有再多解释。')}]]:[]),
    ...(investigated('kobayashi:routine')?[['问员工通道在哪边',()=>show('「裏側です。お客様は正面玄関からどうぞ。」\n“在后面，客人请走正门。”')]]:[])]);
   if(id==='maid')return ask(id,'工作人员抱着床单从楼梯口出来，停在走廊边整理衣物。',[
    ['问有没有备用毛巾',()=>show('「フロントにお伝えしますね。」\n“我帮您通知前台。”')],
    ['问今天打扫的时间',()=>{markTalk('maid','routine');show('「客室によって違います。お急ぎならフロントへ。」\n“看房间安排，如果着急可以问前台。”')}],
    ...(hasHotelRecord()?[['问旧单据上的「タオル交換」',()=>show('「タオルを取り替える、という意味です。」\n“意思是更换毛巾。”')]]:[])]);
   if(id==='traveler')return ask(id,'一名旅客拎着行李正要出门。',[
    ['问哪里能买早餐',()=>show('「駅前にパン屋がありましたよ。」\n“车站前有家面包店。”')],
    ['问酒店住起来怎么样',()=>show('「古いけど、駅に近くて便利でした。」\n“虽然旧，但是离车站近，很方便。”')]]);
   if(id==='guest')return ask(id,'一名新客人正在填写入住表格，抬头看了你一眼。',[
    ['问是否需要帮忙搬行李',()=>show('「大丈夫です。ありがとうございます。」\n“不用了，谢谢。”')],
    ['问这家店好不好找',()=>show('「駅から近いですね。」\n“离车站挺近。”')]]);
   if(id==='clerk')return ask(id,'一名职员将文件夹放回推车，似乎正赶着开会。',[
    ['问哪里可以反映房间问题',()=>show('「フロントにお願いします。」\n“请向前台反映。”')],
    ['问办公室能否进入',()=>show('「申し訳ありません。こちらは従業員用です。」\n“抱歉，这是员工区域。”')],
    ...(hasHotelRecord()&&investigated('sato:handoff')?[['问谁负责核对旧房务记录',()=>{markTalk('clerk','records');show('「担当者を確認してから、ご案内します。」\n“得先确认负责人才好答复。”')}]]:[])]);
  }
  const thingsAction={
   exit:()=>{note('thing_exit','大厅有两处可见的出入口。');show('玻璃门外是早晨的街道。楼梯通往客房楼层，边上贴着消防疏散图。')},
   notice:()=>{note('thing_notice','大厅贴着公共区域维修告示。');show('告示列了公共区域水管与照明的维修日期，字迹有些受潮。')},
   sofa:()=>{note('thing_sofa','等候区有住客留下的旅游宣传册。');show('长椅上的旅游册介绍浅草寺和上野公园。旁边还有一份今日天气预报。')},
   schedule:()=>{note('thing_schedule','柜台侧面摆着本周房务排班。');show('几名房务员工的轮班时间印在纸上。部分位置被咖啡杯压住，暂时看不到全部内容。')},
   repair:()=>{note('thing_repair','前台维修单记载公共区域检修。');show('几张单据写着走廊照明与公共水管的维修日期，签字栏里有维修人员的姓氏。')},
   handoff:()=>{show('门框边夹着一张发黄的纸，最上面几行被折进了门缝。',[['取出看一眼',()=>{if(!ds.seen.thing_handoff){note('thing_handoff','207门边夹着一张旧客房服务交接单。');const v=campaign.hotelCase?.v18;if(v){v.clues??=[];if(!v.clues.includes('dnd'))v.clues.push('dnd')}if(window.INV)INV.addClue('C01');campaignSave()}show('纸上写着：\n「207　連泊・タオル交換」\n右上角印着日期，纸边有一道折痕。',[['收好单据',()=>show('你把纸折好，收进随身的资料夹。')]])}],['暂时不碰',()=>show('纸角被走廊里的风吹得轻轻晃动。')]])},
   sound:()=>{note('thing_sound','白天走廊只有远处的车声和脚步声。');show('走廊尽头有人关上了门。随后安静下来，昨晚的水声没有重现。')},
   '206':()=>{note('thing_206','206房门没有明显异样。');show('你的房卡能正常打开206。床上的毯子仍是早晨离开时的样子。')},
   door:()=>{note('thing_door','经理办公室没有对外开放。');show('办公室门虚掩着，但你站在门外只能看见普通的文件柜和桌椅。')},
   cart:()=>{note('thing_cart','办公推车上放着一些空白表格。');show('推车顶层是一叠空白申请表，下面的文件夹扣着，没有向外展示的内容。')}
  };
  app.querySelectorAll('[data-dh-npc]').forEach(b=>b.onclick=()=>person(b.dataset.dhNpc));
  app.querySelectorAll('[data-dh-thing]').forEach(b=>b.onclick=()=>thingsAction[b.dataset.dhThing]?.());
  app.querySelectorAll('[data-dh-place]').forEach(b=>b.onclick=()=>view(b.dataset.dhPlace));
  app.querySelector('#dh-out').onclick=()=>{campaignSave();tokyoHome()};
  app.querySelector('#dh-night').onclick=()=>{campaignSave();if(window.H18)H18.start();else tokyoHome()};
 }
 return {open:place=>window.H18&&H18.startDay?H18.startDay(place):view(place),legacy:view}; // v32：白天也进入像素酒店（H18.startDay），旧的按钮版本保留为 legacy
})();

DM.onUndo(()=>{if(H18.active())H18.resync()});
