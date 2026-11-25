/* ==== engine/survival/91-prologue.js ==== */
/* ===================================================================
   【V20 第一章前半段《入境之夜》：羽田入境 → 京急线 → 品川街头 → 入住 → 206号室】
   内容全部来自 story/chapter1/prologue/：
     prologue.json  场景、热点、出口、五条线索、提示、路人事件、失败结局、结尾
     nodes/*.json   所有对话（写法与第一章 nodes/ 相同）
   这个文件只负责「怎么运行」：场景切换、时间、必答题、随机路人、检查点、背景绘制、结尾。
   时间、票价、概率等数值：config/game.json 的 prologue；SAN 数值：sanRules。
   存档：campaign.prologue（只在羽田开局的新游戏里使用；旧存档、成田开局不受影响）
   结束后：第一天完成 → 夜间结算 → DAY 2，之后的夜晚继续第一章的酒店调查（87-hotel-chapter.js）。
   =================================================================== */
/* First hotel arrival is the admission boundary; no clock/resource effects. */
const MIDNIGHT_SHADOW=(()=>{
const text=['你拖着行李走进酒店。','身后的玻璃门缓缓合拢。','就在门即将关上的瞬间，你注意到街道上的路灯突然暗了下来。','一个巨大的影子从玻璃门外经过。','它的轮廓高得不可思议。','你还没来得及看清，影子便消失在街道尽头。','前台后面空无一人。只有一盏台灯还亮着，像是什么都没有发生。','柜台上的服务铃，自己轻轻响了一声。','——叮。'];
const eligible=minute=>minute>=1410&&minute<1440;
function capture(p){if(p.hotelArrivalMinute==null){p.hotelArrivalMinute=p.clock;p.midnightShadow={eligible:eligible(p.clock),index:0,done:!eligible(p.clock)}}return p.midnightShadow}
let root=null;
function play(p,done){const s=p.midnightShadow;if(!s||!s.eligible||s.done){done();return}if(root)return;
root=document.createElement('div');root.className='et-modal-back shadow-arrival';root.style.cssText='position:fixed;inset:0;z-index:210000;background:#080c14;display:flex;align-items:center;justify-content:center;padding:16px';
root.innerHTML='<section role="dialog" aria-modal="true" aria-label="港屋酒店 · 大厅" style="width:min(680px,100%);max-height:95vh;overflow:auto;color:#e4dfd4"><h2>港屋酒店 · 大厅</h2><div class="shadow-window" style="height:clamp(150px,35vh,300px);position:relative;overflow:hidden;background:linear-gradient(90deg,#171b21 48%,#8b929955 49%,#171b21 51%);border:8px solid #3d3934"><div class="shadow-lamp" style="position:absolute;right:18%;top:12%;width:12px;height:12px;background:#e6cd90;box-shadow:0 0 70px 30px #b7a27888"></div><div class="shadow-shape" style="position:absolute;width:48%;height:210%;top:-60%;left:100%;background:#020304;border-radius:45%;filter:blur(7px);opacity:0"></div></div><p class="shadow-text" aria-live="polite" style="line-height:1.9;min-height:5em;font-size:clamp(17px,3vw,23px)"></p><button class="survival-btn" style="min-height:48px;width:100%">继续</button></section>';
document.body.appendChild(root);const button=root.querySelector('button'),line=root.querySelector('.shadow-text'),lamp=root.querySelector('.shadow-lamp'),shape=root.querySelector('.shadow-shape');
function render(){line.textContent=text[s.index];lamp.style.opacity=s.index>=2&&s.index<=4?'.08':'1';shape.style.opacity=s.index===3||s.index===4?'1':'0';shape.style.left=s.index===3?'15%':s.index===4?'50%':'100%';if(s.index===3&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&shape.animate)shape.animate([{transform:'translateX(-160%)'},{transform:'translateX(0)'}],{duration:1200,easing:'ease-out'});button.textContent=s.index===text.length-1?'继续入住剧情':'继续';}
button.onclick=()=>{if(s.done)return;if(s.index<text.length-1){s.index++;campaignSave();render();return}s.done=true;campaignSave();root.remove();root=null;done()};render();button.focus();
}
return {capture,eligible,play,text};
})();

const PRO=(function(){
const D=(GAME_DATA.story.chapter1||{}).prologue||{};
const SC=D.scenes||{},CL=D.clues||{},ENC=D.encounters||[],NODES={};(D.nodes||[]).forEach(n=>NODES[n.id]=n);
const CFG=GAME_CONFIG.prologue||{};
const MUSTS=[...new Set((D.nodes||[]).filter(n=>n.must).map(n=>n.must))];
const T=32,MW=16,MH=11,CW=T*MW,CHh=T*MH;
const L=v=>v==null?[]:Array.isArray(v)?v:[v];

/* ---------- 数值与时间 ---------- */
function hm(v){if(typeof v==='number')return v;if(typeof v!=='string')return null;if(CFG[v]!=null&&CFG[v]!==v)return hm(CFG[v]);const m=/^(\d{1,2}):(\d{2})$/.exec(v);return m?(+m[1])*60+(+m[2]):null}
function price(v){if(typeof v==='number')return v;const p=CFG.prices||{};return p[v]!=null?p[v]:0}
const clockStr=m=>TM.fmt(m);
const deadline=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); // 截止时间：过了半夜写成 24:00、24:30

/* ---------- 状态与存档 ---------- */
let rendered=false,queue=[],deathShown=false,anim=0;
function P(){
 if(!campaign.prologue)campaign.prologue={};
 const p=campaign.prologue;
 p.scene??=D.startScene||'immigration';p.clock??=hm(CFG.startClock)??1230;
 p.flags??={};p.clues??=[];p.visited??=[];p.musts??=[];p.unread??=[];p.enc??=[];p.encCount??=0;p.log??=[];
 return p;
}
function F(){return P().flags}
function save(){campaignSave()}
function applies(){return !!campaign&&!campaign.firstDayComplete&&campaign.route20===true&&campaign.birth!=='narita'&&!(campaign.prologue&&campaign.prologue.done)}
function item(id){return (campaign.items&&campaign.items[id])||0}
function addItem(id,n){campaign.items??={};campaign.items[id]=Math.max(0,(campaign.items[id]||0)+n);if(!campaign.items[id])delete campaign.items[id]}
function originJp(){return (D.originJp||{})[campaign.origin]||'海外'}
function fill(t){if(typeof t!=='string')return t;return t.replace(/\{(\w+)\}/g,(m,k)=>({time:clockStr(P().clock),origin:campaign.origin,originZh:campaign.origin==='其他 / 自定义'||!campaign.origin?'海外':campaign.origin,originJp:originJp(),day:campaign.day,mustTotal:mustTotal(),mustDone:P().musts.length,dest:destSt().kanji,destKana:destSt().kana,address:G.address||'',taxiFare:price('taxiFare').toLocaleString('ja-JP'),busFare:price('busFare').toLocaleString('ja-JP'),lastTrain:deadline(hm('lastTrain')),frontClose:deadline(hm('frontClose')),cash:campaign.cash,living:nightlyCost().toLocaleString('ja-JP')})[k]??m)}
/* ---------- 酒店地址与「猜车站」 ---------- */
const G=D.guess||{},STN=G.stations||[];
const CORRECT=STN.find(x=>x.correct)||{id:'shinagawa',kanji:'品川',kana:'しながわ',pos:0,fromAirport:7};
function destSt(){const p=P();return STN.find(x=>x.id===p.dest)||CORRECT}
function stopsBetween(at,s){if(!at||at==='airport')return s.fromAirport;const a=STN.find(x=>x.id===at);return Math.max(1,Math.abs((a?a.pos:0)-s.pos))}
function fare(at,s){const TV=GAME_CONFIG.travel||{};return Math.min(TV.maxFare??400,(TV.baseFare??220)+(TV.farePerStop??10)*stopsBetween(at,s))}
function guess(){
 const p=P(),at=p.at||'airport',late=at!=='airport'&&p.clock>=hm('lastTrain');p.tried??=[];
 const list=STN.filter(x=>x.id!==at&&!p.tried.includes(x.id)).map(x=>{const f=fare(at,x);return {t:x.kanji+'（¥'+f+'）',disabled:late||campaign.cash<=f,note:late?'末班车已经开走了':campaign.cash<=f?'钱不够':'',fn:()=>ride(x,f)}});
 const tx=price(at==='airport'?'taxiFare':'taxiLocal');
 list.push({t:'🚕 不猜了，花钱打车直接去酒店（¥'+tx.toLocaleString('ja-JP')+'）',disabled:campaign.cash<=tx,note:campaign.cash<=tx?'钱不够':'',fn:()=>taxi(tx,at)});
 if(at==='airport')list.push({t:'再想想',fn:endDialog});
 DM.show(host(),{who:at==='airport'?'券売機 · 行き先':'📧 '+(G.address||''),jp:G.address||'',text:fill(at==='airport'?G.prompt:G.promptAgain),choices:list});
}
function ride(x,f){
 const p=P(),at=p.at||'airport';if(at!=='airport'&&!V51.action('travel',true))return;GS.change({cash:-f});p.dest=x.id;
 if(at==='airport'){p.flags.ticket=true;addItem('ticket',1);log('买票：'+x.kanji);save();hud();DM.show(host(),{who:'🎫 车票',text:'车票吐了出来：「'+x.kanji+'　¥'+f+'」。\n下一步：问问站台上的人，这趟车停不停'+x.kanji+'。',choices:[{t:'▶ 继续',fn:endDialog}]});return}
 advance(stopsBetween(at,x)*((GAME_CONFIG.travel||{}).minutesPerStop||3)+8);log('坐车去：'+x.kanji);if(window.AUDIO)AUDIO.sfx('train');
 DM.show(host(),{who:'🚃 京急線',text:'你回到车站，坐上了去'+x.kanji+'的电车。\n现在是 '+clockStr(p.clock)+'。',choices:[{t:'▶ 继续',fn:()=>{DM.close();arrive()}}]});
}
function taxi(tx,at){if(!V51.action('travel',true))return;const p=P();GS.change({cash:-tx});skipMusts();advance(at==='airport'?25:12);p.flags.byTaxi=true;p.dest=CORRECT.id;log('打车去酒店');save();if(window.AUDIO)AUDIO.sfx('coin');
 DM.show(host(),{who:'🚕 出租车',text:'你把邮件给司机看。他扫了一眼：「ああ、品川のミナトヤさんね」（啊，品川的港屋酒店啊）。\n二十分钟后，车停在了一栋旧楼前。',choices:[{t:'▶ 继续',fn:()=>{DM.close();queue=[];enterScene('hotel')}}]})}
/* 到站：猜对了 → 品川街头；猜错了 → 那一站的站前（到酒店才会知道走错了） */
function arrive(){const p=P(),d=destSt();p.at=d.id;queue=[];if(d.correct){enterScene('street');return}p.tried??=[];if(!p.tried.includes(d.id))p.tried.push(d.id);delete p.flags['seen:wrongstation'];enterScene('wrongstation')}
/* 必答题：打车直接去酒店时，错过的必答题算「跳过」，不计入总数 */
function mustTotal(){return MUSTS.length-(P().mustSkipped||[]).length}
function mustLabel(){const p=P(),sk=(p.mustSkipped||[]).length;return p.musts.length+'/'+mustTotal()+(sk?'（打车跳过 '+sk+' 道）':'')}
function skipMusts(){const p=P();p.mustSkipped=MUSTS.filter(m=>!p.musts.includes(m)&&m!=='checkin')}
function pick(t){if(t&&typeof t==='object'&&!Array.isArray(t))return fill(t.default||'');return fill(t)}
function log(t){const p=P();p.log.push(clockStr(p.clock)+' '+t);p.log=p.log.slice(-40)}

/* ---------- 条件与效果（剧情 JSON 使用的「语言」） ---------- */
function cond(w){
 if(!w)return true;const p=P();
 if(w.any&&!w.any.some(cond))return false;
 if(w.all&&!w.all.every(cond))return false;
 if(w.not&&cond(w.not))return false;
 if(L(w.flag).some(f=>!p.flags[f]))return false;
 if(L(w.notFlag).some(f=>p.flags[f]))return false;
 if(L(w.clue).some(c=>!p.clues.includes(c)))return false;
 if(L(w.notClue).some(c=>p.clues.includes(c)))return false;
 if(w.clueCount!=null&&p.clues.length<w.clueCount)return false;
 for(const [id,n] of Object.entries(w.item||{}))if(item(id)<n)return false;
 if(L(w.notItem).some(id=>item(id)>0))return false;
 if(w.cashMin!=null&&campaign.cash<=price(w.cashMin))return false;
 if(w.after!=null&&p.clock<hm(w.after))return false;
 if(w.before!=null&&p.clock>=hm(w.before))return false;
 if(L(w.visited).some(s=>!p.visited.includes(s)))return false;
 if(L(w.notVisited).some(s=>p.visited.includes(s)))return false;
 if(w.mustCount!=null&&p.musts.length<w.mustCount)return false;
 return true;
}
/* 入境之夜的时间只从这里往前走：经过 TimeManager（TM.advance），由 91z-midnight.js 监听，检查提醒与午夜截止 */
const CLOCK={get:()=>P().clock,set:v=>{P().clock=v}};
function advance(min){if(!min||min<0)return;TM.advance((min+(V51.tier()?.minutes||0))*(CFG.timeScale||1),CLOCK);if(!P().dead)save();hud()}
/* 日语答错的额外时间：节点写 failTime / failWhy，否则按场景（config 的 prologue.midnight.wrongTime，文字在 prologue.json 的 midnight.wrongWhy） */
function wrongTime(node){
 const sc=P().scene,M=CFG.midnight||{},m=node&&node.failTime!=null?node.failTime:((M.wrongTime||{})[sc]||0);if(!m)return '';
 if(window.LANGAID&&!LANGAID.timeAllowed(node))return '⏱ 这一次没有再耽误时间'; // v23.4：剧情体验模式下同一道必答题最多算 languageAssist.timeFailsMax 次时间
 const why=(node&&node.failWhy)||((D.midnight||{}).wrongWhy||{})[sc]||'';advance(m);return '⏱ +'+m+' 分钟'+(why?'：'+why:'');
}
/* 午夜：在酒店外到了 00:00（判断只在 91z-midnight.js 的 tick 里做一次） */
function inSafe(){const p=P();return !!(p.flags.checkedIn||((CFG.midnight||{}).safeScenes||['hotel','room']).includes(p.scene))}
function midnightDeath(){
 const p=P();if(p.dead)return;p.dead='midnight';queue=[];log('午夜 · 死亡原因：不明');save();
 setTimeout(()=>{DM.close();if(window.MIDNIGHT)MIDNIGHT.show({place:(SC[p.scene]?fill(SC[p.scene].zh).split(' · ')[0].replace('（雨夜）',''):''),buttons:retryButtons()})},0);
}
function gainClue(k,out){const p=P();if(!CL[k]||p.clues.includes(k))return;p.clues.push(k);if(window.FILES)FILES.addAnomaly('pro-'+k,CL[k].name,CL[k].place);log('线索 '+CL[k].no+'：'+CL[k].name);if(out)out.push('🔎 线索 '+clueList().length+'/5：'+CL[k].name);toast('🔎 线索 '+clueList().length+'/5：'+CL[k].name);if(window.AUDIO)AUDIO.sfx('clue')}
function apply(e,node,silent){
 if(!e)return '';const p=P(),out=[];
 if(e.time)advance(e.time);
 if(p.dead)return '';
 L(e.flag).forEach(f=>p.flags[f]=true);L(e.clearFlag).forEach(f=>delete p.flags[f]);
 for(const [id,d] of Object.entries(e.item||{})){addItem(id,d);const it=ITEMS.find(x=>x.id===id);if(!silent&&it)out.push((d>0?'获得 ':'失去 ')+it.icon+it.name)}
 L(e.clue).forEach(k=>gainClue(k,out));
 let cash=e.cash||0;if(e.pay)cash-=price(e.pay);
 const sanRule=e.sanRule?-Math.abs((GAME_CONFIG.sanRules||{})[e.sanRule]||0):0;
 save();
 const res=GS.change({hp:e.hp,san:(e.san||0)+sanRule,cash,stress:e.stress},sanRule?'接触了不该接触的东西':'');if(res)out.push(res);
 if(e.glitch)L(e.glitch).forEach(g=>UI.glitch(g));
 if(e.toast)toast(fill(e.toast));
 if(e.encounter)L(e.encounter).forEach(x=>queue.push({enc:x}));
 if(e.unlockRule&&window.FILES)L(e.unlockRule).forEach(r=>FILES.unlock(r));
 if(e.dest){p.dest=e.dest;p.at=e.dest}
 if(e.arrive)queue.push({arrive:true});
 if(e.goto)queue.push({goto:e.goto});
 if(e.fatal)queue.push({fatal:e.fatal});
 hud();
 return out.join(' · ');
}

/* ---------- 对话 ---------- */
function host(){return document.getElementById('pro-dlg')}
const PORTRAITS=Object.values(D.portraits||{});
function portraitFor(node,who){
 if(!who||!window.ART)return '';
 const named=Object.values(GAME_DATA.story.chapter1.npcs||{}).find(n=>n.portrait&&String(who).includes(n.name));if(named)return ART.portrait(named.portrait,named.palette||{},{});
 for(const d of PORTRAITS)if((d.match||[]).some(m=>who.includes(m)))return ART.portrait(d.portrait,d.palette||{},{});
 const npcs=(GAME_DATA.story.chapter1||{}).npcs||{};
 for(const d of Object.values(npcs)){if(d.ghost)continue;if((d.portraitMatch||[d.name]).some(m=>who.includes(m)))return ART.portrait(d.portrait,d.palette||{},{})}
 return '';
}
function tauntScene(){return ({immigration:'airport',arrivals:'airport',station:'station',train:'station',street:'street',hotel:'hotel',room:'hotel'})[P().scene]||'street'}
function ctx(){return {prologueLocalization:true,nodes:NODES,host,cond,apply,pick,portraitFor,jpPenalty:GAME_CONFIG.wrongAnswer.firstDayHp,tauntScene:tauntScene(),
 evidence:()=>[],call:builtin,onEnd:endDialog,
 onListen:(n,ok)=>{const p=P();if(ok){p.unread=p.unread.filter(x=>x!==n.id);if(n.must&&!p.musts.includes(n.must)){p.musts.push(n.must);toast('📝 必答题 '+mustLabel())}}else{p.fails??={};p.fails[n.id]=(p.fails[n.id]||0)+1;if(!n.must&&!/^rm-mirror/.test(n.id)&&!p.unread.includes(n.id))p.unread.push(n.id)}save();hud()},
 showHint:n=>!n.must||((P().fails||{})[n.id]||0)>=2,
 listenFailNote:n=>n.must?(((P().fails||{})[n.id]||0)>=2?'（📝 必答题：答对才能继续往前走。）':'（📝 必答题：答对才能继续往前走。再答错一次，会给出关键词提示。）'):'（没听懂，这条线索没有记下来。之后可以在 📓 手帐里「回想」再试一次。）',
 onHurt:(hp,node)=>{const t=wrongTime(node);toast((hp?'❤️ 疲劳点 -'+hp:'❤️ 疲劳点 不变')+(t?' · '+t.split('：')[0]:'')+'（日语理解错误，SAN 不变）');return t}}}
function play(id){if(id==='ht-front'&&!P().flags.checkedIn&&!P().flags.lateArrival&&P().clock>=hm('23:30'))id='ht-late-checkin';if(!NODES[id]){endDialog();return}SR.run(id,ctx())}
function endDialog(){DM.close();if(!applies()&&!(campaign&&campaign.prologue&&(campaign.prologue.finale||campaign.prologue.morning)))return;next()}
/* 对话结束后依次处理：失败结局 → 路人事件 → 播放下一段 → 切换场景 */
function next(){
 if(!rendered||P().dead)return; // 午夜死亡后不再继续处理
 const f=queue.find(q=>q.fatal);if(f){queue=[];fatal(f.fatal);return}
 if(GS.dead()){queue=[];deathCheck();return}
 if(P().scene==='station'&&P().flags.ticket&&window.PGIRL&&PGIRL.pending()){PGIRL.run('haneda',()=>next());return}
 const q=queue.shift();
 if(!q){renderScene();return}
 if(q.enc){if(!encounter(q.enc))next();return}
 if(q.node){play(q.node);return}
 if(q.goto){queue=[];enterScene(q.goto);return}
 if(q.arrive){arrive();return}
 if(q.call){builtin(q.call);return}
 next();
}
function builtin(name){({notebook,sleep,finale,guess,toTokyo,toHotel,tutorial:()=>V52PRO.tutorial(),kshop:()=>{if(window.KSHOP&&KSHOP.enterPrologue())return;next()}}[name]||(()=>next()))()}
function toast(t){const el=document.getElementById('pro-toast');if(el){el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{el.hidden=true},3000)}else UI.toast(t)}

/* ---------- 随机路人事件（70% 偏见 / 30% 冷漠；反击 / 无视 / 求助） ---------- */
function encounter(spec){
 const p=P();let e=null;
 if(spec[0]==='#'){e=ENC.find(x=>x.id===spec.slice(1));if(e&&p.enc.includes(e.id))e=null}
 else{
  const force=spec.endsWith('!'),scene=spec.replace('!','');
  if(!force&&(Math.random()>=(CFG.encounterChance??0.35)||p.encCount>=(CFG.maxEncounters??4)))return false;
  const spaced=p.clock-(p.v51PrejudiceAt??-Infinity)>=GAME_CONFIG.v51Append.prejudiceIntervalMinutes;
  const pool=ENC.filter(x=>(x.scenes||[]).includes(scene)&&!p.enc.includes(x.id)&&(spaced||x.kind!=='prejudice'));if(!pool.length)return false;
  const want=Math.random()<(CFG.prejudiceRatio??0.7)?'prejudice':'cold';let c=pool.filter(x=>x.kind===want);if(!c.length)c=pool;
  e=c[Math.floor(Math.random()*c.length)];
 }
 if(!e)return false;
 if(e.kind==='prejudice')p.v51PrejudiceAt=p.clock;
 p.enc.push(e.id);p.encCount++;save();
 const pf=portraitFor(null,e.who);
 DM.show(host(),{who:e.who,sub:e.kind==='prejudice'?'路人 · 偏见':'路人 · 冷漠',jp:e.jp,text:fill([e.text,e.zh].filter(Boolean).join('\n')),portrait:pf,tone:'rule',choices:[
  {t:'🗣 反击（用日语回应）',fn:()=>fight(e,spec[0]!=='#')},
  {t:'🙈 无视',fn:()=>outcome(e,'ignore')},
  {t:'🙋 求助',fn:()=>outcome(e,'help')}]});
 return true;
}
function order(n){const a=[...Array(n).keys()];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fight(e,randomEncounter){const f=e.fight||[];DM.show(host(),{noUndo:true,who:'你想说……',text:'对方正在等你的回应。你打算怎么说？',choices:order(f.length).map(i=>({t:'「'+f[i].jp+'」'+(typeof langMode==='function'&&langMode()==='story'&&f[i].zh?'  ·  '+f[i].zh:''),fn:()=>outcome(e,f[i].kind,f[i],randomEncounter)}))})}
function pickPushbackReward(weights){
 const entries=Object.entries(weights);
 let roll=Math.random()*entries.reduce((sum,[,weight])=>sum+weight,0);
 for(const [reward,weight] of entries){roll-=weight;if(roll<0)return reward}
 return entries.at(-1)[0];
}
async function outcome(e,kind,line,randomEncounter){
 const def=(D.encounterDefaults||{})[kind]||{},o=Object.assign({},def,e[kind]||{});
 const bonus=GAME_CONFIG.v51Append.prejudicePushback;
 const chance=randomEncounter&&e.kind==='prejudice'?bonus.response[kind]:null;
 let scuffle=false;
 if(chance){
  const roll=Math.random();
  if(roll<chance.reward){
   const reward=pickPushbackReward(bonus.weights),effects=o.effects||{},gain=bonus.rewards[reward];
   o.text=D.pushbackRewards[reward];
   o.effects={...effects,...gain,stress:Math.min(effects.stress??0,gain.stress),time:Math.min(effects.time??0,bonus.maxRewardMinutes)};
  }else if(roll<chance.reward+chance.fight){
   scuffle=true;
   o.text='争执已经散了。你提起行李，试着活动了一下被撞到的手臂。';
   o.effects={...bonus.fight,hp:-Math.min(-bonus.fight.hp,Math.max(0,campaign.hp-1)),
    stress:Math.min(bonus.fight.stress,Math.max(0,GAME_CONFIG.player.maxStress-1-campaign.stress))};
  }
 }
 const r=apply(o.effects||{},null);
 if(P().dead)return;
 if(scuffle){
  const activeCampaign=campaign;
  await PGIRL.scuffle();
  if(campaign!==activeCampaign)return;
 }
 if(kind==='wrong'&&o.effects&&o.effects.hp<0)campaign.jpLost=(campaign.jpLost||0)-o.effects.hp; // 日语说错扣的 疲劳点：「返回」时不还
 const wt=kind==='wrong'?wrongTime(null):''; // 日语说错：同样多花时间
 const head={good:'你选择回应',firm:'你正面反击',harsh:'你强硬回击',rude:'你激烈回应',wrong:'你说出了另一句话',ignore:'你选择无视',help:'你选择求助'}[kind]||'对话继续';
 if(window.AUDIO)AUDIO.sfx(kind==='wrong'?'ng':'page');
 log('路人：'+e.who+' → '+(scuffle?'发生肢体冲突':head));
 DM.show(host(),{who:scuffle?'发生肢体冲突':head,text:(line?'你说：「'+line.jp+'」\n（'+line.zh+'）\n\n':'')+fill(o.text||''),result:[r,wt].filter(Boolean).join(' · '),tone:kind==='wrong'?'ng':'',choices:[{t:'▶ 继续',fn:endDialog}]});
}

/* ---------- 场景 ---------- */
function enterScene(id){
 const sc=SC[id];if(!sc)return;const p=P();
 if(id==='station'&&p.flags.ticket&&window.PGIRL&&PGIRL.pending()){PGIRL.run('haneda',()=>enterScene(id));return} // INCIDENT-000：购票后恢复车站时触发；未购票不触发（96p-platform-girl.js）
 if(id==='hotel'&&!p.visited.includes('hotel')&&!p.dead)MIDNIGHT_SHADOW.capture(p);
 p.scene=id;if(!p.visited.includes(id))p.visited.push(id);
 if(sc.checkpoint){const snap=JSON.parse(JSON.stringify(campaign));delete snap.prologue.checkpoint;delete snap.prologue.first;p.checkpoint={scene:id,data:snap}}
 save();renderScene();
 const continueEntry=()=>{if(sc.enterNode&&!p.flags['seen:'+id]){p.flags['seen:'+id]=true;save();play(sc.enterNode)}};
 if(id==='hotel'&&p.midnightShadow?.eligible&&!p.midnightShadow.done){MIDNIGHT_SHADOW.play(p,continueEntry);return}continueEntry();
}
function hud(){
 const el=document.getElementById('pro-hud');if(!el||!campaign)return;const p=P();
 const lt=hm('lastTrain'),fc=hm('frontClose');
 el.innerHTML=`<span>⏰ <b>${clockStr(p.clock)}</b></span>`+
  (p.visited.includes('station')&&!p.flags.trainDone&&!p.flags.byTaxi&&!p.flags.byBus?`<span class="${p.clock>=lt-30?'pro-warn':''}">🚃 末班 ${deadline(lt)}</span>`:'')+
  (!inSafe()?`<span class="${p.clock>=fc-30?'pro-warn':''}">🛎 ${deadline(fc)}前进入酒店大厅</span>`:'')+
  (p.musts.length?`<span>📝 必答 ${mustLabel()}</span>`:'')+(p.clues.length?`<span>🔎 线索 ${p.clues.length}</span>`:'')+
  (SC[p.scene]&&SC[p.scene].rain?`<span>${item('umbrella')?'☂ 有伞':'🌧 没伞'}</span>`:'');
 UI.update();if(window.MIDNIGHT)MIDNIGHT.refresh();
}
function renderScene(){
 const p=P(),sc=SC[p.scene];if(!sc)return;
 if(!document.getElementById('pro-stage')){shell();}
 const hs=(sc.hotspots||[]).filter(h=>cond(h.when));
 const ex=(sc.exits||[]).filter(x=>cond(x.when));
 document.getElementById('pro-head').innerHTML=`<div class="rpg-kicker">${esc(fill(sc.chapter||''))} · DAY 01</div><h1 class="h18-title" lang="ja">${esc(fill(sc.name))}</h1><small class="pro-zh">${esc(fill(sc.zh||''))}</small>`;
 document.getElementById('pro-scene').innerHTML=`<div class="h18-scene-bg"><canvas id="pro-canvas" width="${CW}" height="${CHh}" aria-hidden="true"></canvas>${hs.map(h=>{const [x,y,w,hh]=h.rect;return `<button type="button" class="h18-hot${h.npc?' npc':''}${h._hintUnless&&!p.hotSeen?.[p.scene+':'+h.id]&&!h._hintUnless.some(flag=>p.flags[flag])?' route-hint':''}" data-hot="${esc(h.id)}" style="left:${x/MW*100}%;top:${y/MH*100}%;width:${w/MW*100}%;height:${hh/MH*100}%"><span>${esc(h.label)}</span></button>`}).join('')}<div id="pro-toast" class="h18-toast" hidden></div></div>
  <div class="h18-scene-bar"><button type="button" class="survival-btn alt" id="pro-note">📓 手帐</button><small>${sc.rain?'点地图上的地方前往（会花时间）':'点画面上的人和物品调查（会花时间）'}</small>${ex.map((x,i)=>{const ok=!x.need||cond(x.need);return `<span class="pro-exit-wrap"><button type="button" class="survival-btn pro-exit" data-exit="${i}"${ok?'':' disabled'}>${ok?'':'🔒 '}${esc(fill(x.label))}</button>${ok?'':'<small class="pro-need">'+esc(x.needText||'')+'</small>'}</span>`}).join('')}</div>
  <div class="h18-hot-list">${hs.map(h=>`<button type="button" class="rpg-action" data-hot="${esc(h.id)}">${esc(h.label)}${h.zh?'（'+esc(h.zh)+'）':''}${h.walk?' <small>🚶'+h.walk+'分</small>':''}</button>`).join('')}</div>`;
 document.querySelectorAll('#pro-scene [data-hot]').forEach(b=>b.onclick=()=>hot(b.dataset.hot));
 document.querySelectorAll('#pro-scene [data-exit]').forEach(b=>b.onclick=()=>exit(ex[+b.dataset.exit]));
 document.getElementById('pro-note').onclick=()=>{if(!DM.isOpen())notebook()};
 hud();draw();
}
function shell(){
 UI.scene('prologue',resume);if(window.AUDIO)AUDIO.ambience((SC[P().scene]||{}).ambience||'district');
 app.innerHTML=`<div class="rpg-shell h18-shell pro-shell"><section class="rpg-panel h18-panel"><div class="h18-top"><div id="pro-head"></div></div><div id="pro-hud" class="h18-hud"></div>
  <div class="h18-stage h18-scene-mode" id="pro-stage"><div id="pro-scene" class="h18-scene"></div></div>
  <div id="pro-dlg" class="adv-box" hidden aria-live="polite"></div>
  <p class="rpg-footnote">${esc(D.footnote||'日语理解错误只扣 疲劳点；违反超自然规则、接触异常或主动进入危险区域才扣 SAN。')}</p></section></div>`;
 rendered=true;window.scrollTo(0,0);
}
function hot(id){
 if(DM.isOpen()||P().dead)return;const sc=SC[P().scene],h=(sc.hotspots||[]).find(x=>x.id===id);if(!h||!cond(h.when))return;
 if(h.time)advance(h.time);if(P().dead)return;
 if(h.walk){if(!V51.action('walk',true))return;advance(h.walk);if(P().dead)return;if(window.AUDIO)AUDIO.sfx('step');
  if(sc.rain&&!item('umbrella')&&CFG.rainHp){GS.change({hp:-CFG.rainHp});toast('🌧 淋着雨走过去（疲劳点 -'+CFG.rainHp+'）。买把伞吧。')}
  queue.push({enc:'street'})}
 if(h._hintUnless){const p=P();p.hotSeen??={};p.hotSeen[p.scene+':'+id]=true;save()}
 queue.push({node:h.node});if(window.V52PRO)V52PRO.afterHot(id,queue);next();
}
function exit(x){
 if(!x||DM.isOpen()||P().dead)return;if(x.need&&!cond(x.need)){toast(x.needText||'条件不足');return}
 if(x.time)advance(x.time);if(P().dead)return;
 if(x.encounter)queue.push({enc:x.encounter});
 if(x.node)queue.push({node:x.node});else if(x.to)queue.push({goto:x.to});
 next();
}
function resume(){rendered=false;start()}

/* ---------- 手帐 ---------- */
function hint(){for(const h of (D.hints||[]))if(cond(h.when))return fill(h.text);return '继续往前走吧。'}
function notebook(){
 const p=P();
 const clues=Object.entries(CL).sort((a,b)=>a[1].no-b[1].no).filter(([k])=>p.clues.includes(k)).map(([k,c],i)=>(i+1)+'. '+c.name).join('\n')||'（暂无）';
 DM.show(host(),{who:'📓 手帐 · '+clockStr(p.clock),text:`【必答题 ${mustLabel()}】【线索 ${clueList().length}】\n末班车 ${deadline(hm('lastTrain'))} · 酒店前台 ${deadline(hm('frontClose'))} 截止入住\n\n${clues}`,
  choices:[{t:'💡 现在该做什么？',fn:()=>DM.show(host(),{who:'💡 想一想',text:hint(),choices:[{t:'▶ 返回手帐',fn:notebook}]})},
   ...(p.unread.length?[{t:'🔁 回想没听懂的日语（'+p.unread.length+'）',fn:()=>{advance(3);play(p.unread[0])}}]:[]),
   {t:'🔎 已找到的线索',disabled:!p.clues.length,fn:()=>DM.show(host(),{who:'🔎 线索',text:p.clues.map((k,i)=>(i+1)+'. '+CL[k].name+'（'+CL[k].place+'）\n'+CL[k].desc+(CL[k].jp?'\n「'+CL[k].jp+'」':'')).join('\n\n'),choices:[{t:'▶ 返回手帐',fn:notebook}]})},
   {t:'关闭',fn:endDialog}]});
}

/* ---------- 206号室：睡觉 → 深夜水声 ---------- */
function sleep(){V51.sleep();const p=P(),w=hm('waterAt');if(p.clock<w)p.clock=w;save();hud();if(window.AUDIO)AUDIO.ambience('late');play('rm-water')}

/* ---------- 检查点与失败 ---------- */
function restore(which){
 const p=P(),first=p.first,ck=p.checkpoint;const data=which==='first'?first:(ck&&ck.data);if(!data)return;
 queue=[];deathShown=false;DM.close();DM.clearHistory();
 campaign=JSON.parse(JSON.stringify(data));V51.afterRewind();campaign.prologue.first=first;campaign.prologue.checkpoint=which==='first'?null:ck;delete campaign.prologue.fatal;delete campaign.prologue.dead;if(window.MIDNIGHT)MIDNIGHT.close();
 campaignSave();sanAtmosphere();rendered=false;
 if(which==='first'){start();return}
 shell();enterScene(campaign.prologue.scene);
}
function retryButtons(){const p=P(),ck=p.checkpoint,sc=ck&&SC[ck.scene],rw=DM.canRewind(true);return [
 ...(rw?[{label:'↩ 回到最后一个选择（死亡之前）',primary:true,fn:()=>{deathShown=false;DM.rewind()}}]:[]),
 ...(ck?[{label:'↺ 从检查点重试（'+(sc?sc.zh:'')+'）',primary:!rw,fn:()=>restore('checkpoint')}]:[]),
 {label:'✈ 从机场重新开始',primary:!ck&&!rw,fn:()=>restore('first')},
 {label:'💾 读取存档',fn:UI.savePage}]}
function deathCheck(){
 if(!applies()||V51.hasDeathEnding()||!GS.dead()||campaign.hp<=0){deathShown=false;return}
 if(deathShown)return;deathShown=true;DM.close();
 const why=campaign.hp<=0?'疲劳点 归零，你倒在了'+((SC[P().scene]||{}).zh||'路上'):campaign.san<=0?'SAN 归零，理智崩溃':campaign.cash<=0?'钱用光了':'压力达到了上限';
 const pending=campaign;
 setTimeout(()=>{if(campaign!==pending||V51.hasDeathEnding()||campaign.hp<=0||!GS.dead())return;UI.modal({title:'☠ 你没能抵达酒店',text:why+'。\n\n可以回到死亡之前的最后一个选择，或者从最近的检查点（进入这个场景时）重新开始。',buttons:retryButtons()})},300);
}
function fatal(id){
 const f=(D.fatal||{})[id]||{title:'……',text:''};P().fatal=id;campaign.ruleViolations=(campaign.ruleViolations||0)+1;save();DM.close();
 UI.scene('story',resume);if(window.AUDIO){AUDIO.ambience('late');AUDIO.sfx('glitch')}
 app.innerHTML=`<div class="rpg-shell"><section class="story-panel pro-fatal"><div class="story-meta">BAD END · 严重违反规则</div><h1>${esc(f.title)}</h1><p>${esc(f.text).replace(/\n/g,'<br>')}</p><div class="pro-retry"></div></section></div>`;
 const box=app.querySelector('.pro-retry');retryButtons().forEach(b=>{const el=document.createElement('button');el.type='button';el.className=b.primary?'survival-btn':'survival-btn alt';el.textContent=b.label;el.onclick=b.fn;box.appendChild(el)});
 rendered=false;window.scrollTo(0,0);
}

/* ---------- 结尾：镜子 → 黑屏 → 第一夜 終 ---------- */
function clueList(){const ids=new Set(campaign?.prologue?.clues||[]);return Object.entries(CL).filter(([k])=>ids.has(k)).map(([id,c])=>({id,...c}))}
function finale(){
 const p=P(),E=D.finale||{};p.finale=true;save();DM.close();rendered=false;
 UI.scene('story',finale);if(window.AUDIO)AUDIO.ambience('none');document.body.classList.add('pro-black-screen');setTimeout(()=>document.body.classList.remove('pro-black-screen'),5200);
 const acquired=clueList(),ids=new Set(acquired.map(c=>c.id));
 const found=Object.entries(CL).sort((a,b)=>a[1].no-b[1].no).map(([k,c])=>`<li class="${ids.has(k)?'got':''}">${ids.has(k)?'■':'□'} ${c.no}. ${esc(ids.has(k)?c.name:'？？？')}</li>`).join('');
 app.innerHTML=`<div class="pro-finale" role="dialog" aria-label="第一夜 结束"><div class="pro-black">${(E.black||[]).map((t,i)=>`<p class="pro-line pro-l${i}" ${i===0?'lang="ja"':''}>${esc(t)}</p>`).join('')}</div>
  <div class="pro-end"><div class="rpg-kicker">CHAPTER 01</div><h1>${esc(E.title||'')}</h1><h2>${esc(E.sub||'')}</h2><p>${esc(E.text||'').replace(/\n/g,'<br>')}</p>
  <div class="pro-sum"><div>📝 必答题 ${mustLabel()}</div><div>🔎 找到的线索 <span data-v51-clue-count>${acquired.length}</span>/${Object.keys(CL).length}</div><ul>${found}</ul></div>
  <div class="rpg-panel cq-brief"><small>调查局 / CASE NO. 001</small><h2>港屋酒店207号室</h2><b>当前任务：调查207号室发生过什么。</b><p>酒店说隔壁无人入住，浴室里却留下了无法解释的文字。先弄清这间房过去是怎么使用的。</p><p>查看住宿记录，询问工作人员，留意房门和室内的痕迹。</p></div><button type="button" class="survival-btn" id="pro-day2">确认调查任务 → DAY 2</button></div></div>`;
 window.scrollTo(0,0);
 app.querySelector('#pro-day2').onclick=()=>{if(P().done)return;complete()};
}
function complete(){
 document.body.classList.remove('pro-black-screen');const p=P();p.done=true;delete p.finale;delete p.checkpoint;delete p.first;
 campaign.firstDayComplete=true;campaign.firstDayStep=4;campaign.actions=0;campaign.visitedToday=[campaign.birth,'shinagawa'];campaign.location='shinagawa';
 campaignSave();if(window.AUDIO)AUDIO.ambience('map');nightlyClose();
 /* 夜间结算后（没有 GAME OVER）：先看 DAY 2 早上的酒店，再去东京 */
 if(campaign&&campaign.day===2&&!GS.dead()&&(D.finale||{}).morningNode&&NODES[D.finale.morningNode]){p.morning=true;campaignSave();morning()}
}
/* ---------- DAY 2 早上：酒店大厅（尾声） ---------- */
function morning(){
 const p=P();if(!p.morning){tokyoHome();return}
 if(!p.dahliaWakeDone){
  UI.scene('story',morning);
  const index=p.dahliaWakePage||0;
  app.innerHTML='<div class="rpg-shell"><section class="story-panel"><p>'+esc(DAHLIA.wake[index])+'</p><button type="button" class="story-btn" id="dahlia-wake-next">继续</button></section></div>';
  app.querySelector('#dahlia-wake-next').onclick=()=>{
   if(index===0)p.dahliaWakePage=1;else{p.dahliaWakeDone=true;delete p.dahliaWakePage}
   campaignSave();morning();
  };
  window.scrollTo(0,0);return;
 }
 UI.scene('story',morning);if(window.AUDIO)AUDIO.ambience('lobby');queue=[];
 app.innerHTML=`<div class="rpg-shell h18-shell pro-shell"><section class="rpg-panel h18-panel"><div class="h18-top"><div id="pro-head"><div class="rpg-kicker">CHAPTER 01 · DAY 02 · 朝</div><h1 class="h18-title" lang="ja">ミナトヤホテル品川・ロビー</h1><small class="pro-zh">港屋酒店品川 · 第二天早上</small></div></div>
  <div class="h18-stage h18-scene-mode" id="pro-stage"><div id="pro-scene" class="h18-scene"><div class="h18-scene-bg"><canvas id="pro-canvas" width="${CW}" height="${CHh}" aria-hidden="true"></canvas><div id="pro-toast" class="h18-toast" hidden></div></div></div></div>
  <div id="pro-dlg" class="adv-box" hidden aria-live="polite"></div></section></div>`;
 rendered=true;window.scrollTo(0,0);
 const cv=document.getElementById('pro-canvas');if(cv){const c=cv.getContext('2d');c.imageSmoothingEnabled=false;cancelAnimationFrame(anim);let t0=0;const loop=ts=>{if(!document.body.contains(cv))return;if(ts-t0>66){t0=ts;BG.hotel(c,ts/1000,{flags:{},clock:0});c.fillStyle='rgba(242,212,138,.07)';c.fillRect(0,0,CW,CHh)}anim=requestAnimationFrame(loop)};anim=requestAnimationFrame(loop)}
 play(D.finale.morningNode);
}
function endMorning(){const p=P();delete p.morning;rendered=false;campaignSave();DM.close()}
function toTokyo(){endMorning();if(window.AUDIO)AUDIO.ambience('map');tokyoHome()}
function toHotel(){endMorning();if(window.HOTEL_DAY2)HOTEL_DAY2.open();else tokyoHome()}

/* ---------- 入口 ---------- */
function start(){
 if(!campaign)return;const p=P();
 PERIL.checkpoint(true);
 if(p.finale){finale();return}
 if(p.fatal){fatal(p.fatal);return}
 if(p.dead==='midnight'){rendered=false;if(window.MIDNIGHT)MIDNIGHT.show({place:'',buttons:retryButtons()});return}
 if(!p.first){const snap=JSON.parse(JSON.stringify(campaign));delete snap.prologue.first;delete snap.prologue.checkpoint;p.first=snap;save()}
 queue=[];rendered=false;shell();
 if(!p.visited.includes(p.scene)||!p.flags['seen:'+p.scene]||(p.scene==='hotel'&&p.midnightShadow?.eligible&&!p.midnightShadow.done))enterScene(p.scene);else renderScene();
}

/* ---------- 背景（全部用程序绘制，不需要图片） ---------- */
function draw(){
 const cv=document.getElementById('pro-canvas');if(!cv)return;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 cancelAnimationFrame(anim);const id=P().scene,f=BG[(SC[id]||{}).bg];if(!f)return;
 let t0=0;const loop=ts=>{if(!document.body.contains(cv))return;if(ts-t0>66){t0=ts;try{f(c,ts/1000,P())}catch(e){console.error(e);return}}anim=requestAnimationFrame(loop)};anim=requestAnimationFrame(loop);
}
const R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x*T),Math.round(y*T),Math.round(w*T),Math.round(h*T))};
const TX=(c,s,x,y,size,col,align)=>{c.fillStyle=col;c.font='bold '+size+'px "Hiragino Sans","Noto Sans JP","Microsoft YaHei",sans-serif';c.textAlign=align||'left';c.fillText(s,x*T,y*T);c.textAlign='left'};
function person(c,x,y,pal,o){o=o||{};const s=o.s||1;c.globalAlpha=o.alpha??1;
 R(c,x+0.35*s,y,0.9*s,0.9*s,pal.s||'#e8c4a0');R(c,x+0.3*s,y-0.1*s,1*s,0.35*s,pal.h||'#222');if(o.cap)R(c,x+0.2*s,y-0.25*s,1.2*s,0.3*s,pal.b);
 R(c,x,y+0.9*s,1.6*s,2*s,pal.b||'#345');R(c,x+0.65*s,y+0.9*s,0.3*s,0.9*s,pal.a||'#ddd');
 if(!o.half){R(c,x+0.15*s,y+2.9*s,0.55*s,1.4*s,pal.p||'#223');R(c,x+0.9*s,y+2.9*s,0.55*s,1.4*s,pal.p||'#223')}
 c.globalAlpha=1}
function rain(c,t,x0,y0,w,h,n,col){c.strokeStyle=col||'rgba(180,200,230,.35)';c.lineWidth=1;c.beginPath();for(let i=0;i<n;i++){const rx=x0*T+((i*73.3+t*40*(1+i%3))%(w*T)),ry=y0*T+((i*41.7+t*260*(1+(i%4)*.2))%(h*T));c.moveTo(rx,ry);c.lineTo(rx-2,ry+7)}c.stroke()}
function vignette(c,a){const g=c.createRadialGradient(CW/2,CHh/2,CHh*.3,CW/2,CHh/2,CHh*.85);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(a||.55)+')');c.fillStyle=g;c.fillRect(0,0,CW,CHh)}
const BG={
 immigration(c,t){
  R(c,0,0,16,11,'#141b28');R(c,0,0,16,3,'#1b2433');for(let i=0;i<16;i+=2)R(c,i,2.9,1.9,0.1,'#2a3446');
  R(c,0,7.6,16,3.4,'#2a2f38');for(let i=0;i<16;i++)R(c,i,7.6,0.05,3.4,'#232830');
  R(c,1,0.5,5,1.6,'#d9bf7d');TX(c,'外国人',1.25,1.35,15,'#10141c');TX(c,'FOREIGN PASSPORTS',1.25,1.9,10,'#10141c');
  R(c,11.5,0.8,4,1.2,'#8d9bb0');TX(c,'日本人 JAPANESE',11.7,1.6,11,'#10141c');
  [1.2,6,10.6].forEach((bx,i)=>{R(c,bx,3.4,4,4.2,'#2c3a52');R(c,bx+0.2,3.6,3.6,2.2,i===1?'#3a4d6e':'#25324a');R(c,bx,5.8,4,0.3,'#8d9bb0')});
  person(c,7.2,3.9,{s:'#e9c39c',h:'#1d1d22',b:'#2c3a5c',a:'#d9bf7d'},{half:true});R(c,6.3,5.6,3.4,0.6,'#3a4d6e');
  R(c,10.2,5.4,0.9,0.5,'#1f8a5a');if(Math.sin(t*3)>0)R(c,10.35,5.5,0.2,0.2,'#7af0b0');
  for(let i=0;i<6;i++)person(c,0.4+(i%3)*1.4,6.2+Math.floor(i/3)*1.3,{s:'#d8b896',h:['#2a1d18','#c9a060','#111'][i%3],b:['#5a4a6a','#3a5a4a','#6a4a3a'][i%3],a:'#ccc',p:'#2a2a33'},{s:0.75});
  person(c,13,5.6,{s:'#e2b994',h:'#18181c',b:'#34363e',a:'#ccc'},{s:0.8});
  R(c,11,7.8,5,0.12,'#d9bf7d');R(c,14.75,7.9,0.95,1.75,'#0c1018');R(c,14.83,8.08,0.79,1.38,(Math.floor(t*2)%2)?'#4a6a9a':'#3a5a8a');R(c,15.05,7.96,0.35,0.06,'#334158');R(c,15.05,9.52,0.35,0.05,'#8d9bb0');R(c,14.92,8.2,0.55,0.08,'#e8ebf0');R(c,14.92,8.36,0.4,0.06,'#c8d0dc');
  vignette(c,.45);
 },
 arrivals(c,t){
  R(c,0,0,16,11,'#18202e');R(c,0,0,16,0.3,'#0f141d');
  R(c,10.6,0.4,5.4,2,'#0c1220');rain(c,t,10.6,0.4,5.4,2,26);for(let i=10.6;i<16;i+=1.35)R(c,i,0.4,0.08,2,'#334158');
  R(c,1,0.4,4.4,1.5,'#d9bf7d');TX(c,'京急線 ↓',1.2,1.1,12,'#10141c');TX(c,'モノレール →',1.2,1.7,10,'#10141c');R(c,2.5,0.6,1.1,0.7,'rgba(228,154,154,.9)');TX(c,'×',2.85,1.18,14,'#10141c');
  R(c,0,7.4,16,3.6,'#262c36');for(let i=0;i<16;i+=2)R(c,i,7.4,1,3.6,'#2a313c');
  R(c,0.6,4,4.4,3.2,'#2c3a52');R(c,0.6,5.6,4.4,0.3,'#8d9bb0');R(c,2.4,3.1,0.9,0.9,'#3a5a8c');TX(c,'i',2.73,3.82,20,'#e8ebf0');
  person(c,2,4.2,{s:'#f1cba6',h:'#2b1d17',b:'#3a5a8c',a:'#e49a9a'},{half:true,s:0.9});
  R(c,6,1.9,3.6,2.9,'#e8ebf0');R(c,6.15,2.05,3.3,0.6,'#e49a9a');TX(c,'東京生活の心得',6.25,2.52,10,'#10141c');for(let i=0;i<4;i++)R(c,6.3,2.9+i*0.42,i===3?2.2:3,0.12,i===3?'#7a2a2a':'#8d9bb0');
  R(c,5.6,8,4.8,0.5,'#4a5568');R(c,5.6,8.5,0.3,1,'#334158');R(c,10.1,8.5,0.3,1,'#334158');R(c,5.6,7.4,4.8,0.6,'#3a4558');
  if(!(P().flags.noteRead)){R(c,7.6,7.85,0.7,0.25,'#d7c27a')}
  R(c,11,2.6,4.4,4.6,'#1e3a2e');R(c,11,2.6,4.4,0.8,'#2f9a5e');TX(c,'コンビニ',11.6,3.2,12,'#f2f2f2');R(c,11.3,3.6,3.8,3.2,'rgba(240,250,230,.18)');for(let i=0;i<3;i++)R(c,11.5,4+i*0.9,3.4,0.15,'#7aa08a');
  vignette(c,.4);
 },
 station(c,t){
  R(c,0,0,16,11,'#10151f');R(c,0,0,16,0.5,'#1c2634');
  for(let i=0;i<3;i++){const x=0.8+i*1.65;R(c,x,2.1,1.45,4.2,'#c9ccd2');R(c,x+0.15,2.4,1.15,1.2,'#1f6fae');R(c,x+0.2,2.5,1.05,1,'#7ab8e8');R(c,x+0.4,4.2,0.65,0.2,'#333');R(c,x+0.15,4.8,1.15,0.4,'#e49a9a')}
  TX(c,'きっぷ',1.6,1.8,11,'#e8ebf0');
  R(c,6.6,0.7,5.6,2.2,'#05070a');R(c,6.6,0.7,5.6,0.08,'#334158');const blink=Math.floor(t*2)%2;
  TX(c,'快特　品川',6.8,1.4,12,'#f5a142');TX(c,blink?'まもなく':'',10.4,1.4,11,'#f5a142');TX(c,'急行　品川方面',6.8,2.3,12,'#7af0b0');
  R(c,12.4,4.2,3.2,0.9,'#8d9bb0');R(c,12.6,5.1,0.2,2,'#556');R(c,15.2,5.1,0.2,2,'#556');
  person(c,13.4,3.6,{s:'#e7bd96',h:'#1b2a4a',b:'#24365e',a:'#c94040'},{cap:true,s:0.9});
  R(c,0,8.9,16,0.25,'#d9bf7d');for(let i=0;i<16;i+=0.6)R(c,i,8.9,0.3,0.25,'#b99a50');R(c,0,9.15,16,1.9,'#05070a');R(c,0,9.9,16,0.12,'#555');R(c,0,10.5,16,0.12,'#555');
  person(c,7.9,5.7,{s:'#ecc5a2',h:'#d8d8d8',b:'#7a5a7a',a:'#b69ce8',p:'#3a3040'},{s:0.8});R(c,9.1,8,0.6,0.5,'#8a6a3a');
  vignette(c,.5);
 },
 train(c,t,p){
  const sh=Math.sin(t*14)*0.02;
  R(c,0,0,16,11,'#d6d4c8');R(c,0,0,16,0.35,'#b8b6aa');
  for(let i=0;i<16;i+=1.2){R(c,i+0.5,0.35,0.05,1.2,'#888');R(c,i+0.38,1.5+sh,0.3,0.3,'#eee')}
  R(c,1.4,0.5,6.4,1.6,'#f2efe2');R(c,1.5,0.6,3,1.4,'#e49a9a');TX(c,'外国人スタッフ募集',1.55,1.2,9,'#10141c');TX(c,'時給1,050円〜',1.6,1.75,9,'#10141c');R(c,4.7,0.6,3,1.4,'#c8c8c0');R(c,5.6,0.75,1.1,0.8,'#8a8a80');TX(c,'探しています',4.8,1.9,8,'#333');
  R(c,9,0.8,3.4,1.9,'#05070a');const g=Math.floor(t*6)%5===0;TX(c,'天空橋',9.2,1.4,9,'#7af0b0');TX(c,g?'▒▒▒▒':'品川',9.2,2.2,11,g?'#e8ebf0':'#f5a142');
  R(c,0,3,16,3.2,'#0a0d14');for(let i=0;i<16;i+=4){R(c,i,3,0.25,3.2,'#b8b6aa')}const off=(t*9)%4;for(let i=-1;i<5;i++)R(c,i*4-off+1,4.2,0.12,0.6,'#3a4558');
  R(c,0,7.6,16,1.5,'#3a5a8c');R(c,0,7.4,16,0.25,'#2c4470');R(c,0,9.1,16,1.9,'#8d8a80');
  person(c,2.6,4.1+sh,{s:'#e2b994',h:'#18181c',b:'#34363e',a:'#5a6a8a'},{s:1});
  if(!p.flags.oldmanGone)person(c,12,4.1,{s:'#d8d0c4',h:'#e8e8e8',b:'#8a7f6a',a:'#6b5d48',p:'#5a5348'},{s:1,alpha:0.88});
  else R(c,12,7.2,1.6,0.35,'rgba(40,40,40,.2)');
  for(let i=0;i<4;i++)person(c,5.4+i*1.4,4.6+(i%2)*0.2,{s:'#d8b896',h:'#111',b:['#334','#433','#343','#444'][i],a:'#999'},{s:0.75,alpha:0.95});
  if(Math.floor(t*3)%17===0)R(c,0,0,16,11,'rgba(0,0,0,.35)');
  vignette(c,.35);
 },
 street(c,t,p){
  R(c,0,0,16,11,'#0e131c');
  R(c,0,5,16,1.2,'#1f2531');R(c,6.2,0,1.1,11,'#1f2531');R(c,11.4,0,1,11,'#1f2531');R(c,0,5.55,16,0.06,'#d9bf7d');
  [[0.4,0.4,5.4,4.2],[7.7,0.4,3.3,4.2],[12.8,4.7,3,0.1],[0.4,6.6,5.4,4],[7.7,6.6,3.3,4],[12.8,6.6,3,4]].forEach(b=>R(c,b[0],b[1],b[2],b[3],'#161c27'));
  for(let i=0;i<14;i++){const x=(i*1.13)%15+0.5,y=(i*2.37)%10+0.3;if(Math.floor(t*0.5+i)%7)R(c,x,y,0.15,0.15,'rgba(217,191,125,.5)')}
  R(c,0.6,8.4,2.4,1.4,'#334158');TX(c,'品川駅',0.75,9.05,11,'#e8ebf0');TX(c,'高輪口',0.75,9.6,9,'#8d9bb0');
  R(c,3.8,1.8,2.4,2.2,'#2a3446');R(c,4.7,1.5,0.6,0.4,Math.floor(t*2)%2?'#e04040':'#7a2020');TX(c,'交番',4.3,3.3,11,'#e8ebf0');
  R(c,6.8,7,2.6,2,window.KSHOP?KSHOP.sign().body:'#1e3a2e');R(c,6.8,7,2.6,0.5,window.KSHOP?KSHOP.sign().color:'#2f9a5e');TX(c,window.KSHOP?KSHOP.sign().short:'コンビニ',6.9,8.3,window.KSHOP&&KSHOP.sign().short.length>7?8:10,'#f2f2f2');
  R(c,9.4,1.8,2.4,2.2,'#3a2f22');R(c,9.6,2,2,1.4,'#8a7a5a');TX(c,'旧東海道',9.6,3.8,9,'#d9bf7d');
  R(c,7.9,3.5,0.3,2,'#5a5a5a');R(c,7.6,3.7,0.9,0.5,'#2a4a8a');
  R(c,12.2,6.2,2.4,3,'#05070a');R(c,12.4,6.2,0.12,3,'#222');TX(c,'？',13,7.9,14,'rgba(182,156,232,'+(0.3+0.3*Math.sin(t))+')');
  if(p.flags.knowsHotel){R(c,13.2,1.2,2.4,3,'#2c3a52');R(c,13.3,1.3,2.2,0.6,'#d9bf7d');TX(c,Math.floor(t*1.5)%5?'ミナトヤ':'ミナト　',13.35,1.8,9,'#10141c');for(let i=0;i<3;i++)for(let j=0;j<2;j++)R(c,13.5+j*1,2.2+i*0.6,0.5,0.35,(i+j)%2?'#4a5a72':'#f2d48a')}
  rain(c,t,0,0,16,11,90);vignette(c,.5);
 },
 wrong(c,t,p){
  const d=destSt();R(c,0,0,16,11,'#0e131c');R(c,0,6.6,16,4.4,'#1f2531');R(c,0,7.1,16,0.06,'#d9bf7d');
  R(c,0.6,1.8,6.6,4.8,'#2a3446');R(c,0.6,1.8,6.6,0.9,'#e8ebf0');TX(c,d.kanji+'駅',1.0,2.55,16,'#10141c');R(c,2.6,4,2.6,2.6,'#05070a');R(c,2.7,4.1,2.4,2.4,'rgba(242,212,138,.25)');
  R(c,9,1.4,4.6,5.2,'#2c3a52');R(c,9.2,1.6,4.2,0.8,'#8d9bb0');TX(c,'ホテル'+d.kanji,9.35,2.2,11,'#10141c');for(let i=0;i<3;i++)for(let j=0;j<3;j++)R(c,9.5+j*1.3,2.8+i*1.1,0.8,0.6,(i+j+Math.floor(t/3))%3?'#4a5a72':'#f2d48a');R(c,10.6,5.6,1.4,1,'#e8ebf0');
  for(let i=0;i<9;i++){const x=(i*1.77)%15+0.4;R(c,x,7.8+(i%3)*0.9,0.15,0.15,'rgba(217,191,125,.4)')}
  rain(c,t,0,0,16,11,90);vignette(c,.5);
 },
 hotel(c,t,p){
  R(c,0,0,16,11,'#2a2420');R(c,0,0,16,1,'#1e1a17');for(let i=0;i<16;i+=1.6)R(c,i,1,0.05,6,'#332c26');
  R(c,0,7,16,4,'#3a3028');for(let i=0;i<16;i+=1)for(let j=7;j<11;j+=1)if((i+j)%2)R(c,i,j,1,1,'#40352c');
  const fl=Math.floor(t*4)%23===0;R(c,4,0.3,8,0.2,fl?'#5a4a2a':'#f2d48a');
  R(c,3,4.6,8,2.4,'#6b4a2a');R(c,3,4.5,8,0.25,'#8a6440');TX(c,'FRONT フロント',5.2,6.2,11,'#d9bf7d');
  if(!p.flags.deskAway)person(c,6.9,2.6,{s:'#f0c9a0',h:'#2a1d18',b:'#2d3f6e',a:'#f2f2f2'},{half:true});
  R(c,11,1.2,2,4.6,'#4a3a2a');R(c,11.1,1.3,1.8,4.4,'#5a4632');if(p.flags.deskAway)R(c,11,1.2,0.25,4.6,'rgba(242,212,138,.55)');TX(c,'STAFF',11.2,2,8,'#d9bf7d');
  if(p.flags.deskAway&&!p.flags.registerRead){R(c,3.3,4.7,1.5,0.6,'#e8e2d0');R(c,4.02,4.7,0.06,0.6,'#8a6440')}
  R(c,0.6,7.6,3.8,1.8,'#5a2e2e');R(c,0.6,7.2,3.8,0.7,'#6a3838');R(c,4.6,8.4,1.4,0.9,'#4a3a2a');R(c,4.7,8.3,1.1,0.25,'#d8d0c0');
  R(c,13.4,2,2.2,5,'#8d9bb0');R(c,14.47,2,0.06,5,'#556');R(c,14.2,1.4,0.6,0.4,'#10141c');TX(c,Math.floor(t)%9===0?'7':'1',14.36,1.72,9,'#e49a9a');
  vignette(c,.45);
 },
 room(c,t,p){
  const late=p.clock>=hm('waterAt');
  R(c,0,0,16,11,late?'#151a24':'#3a3540');for(let i=0;i<16;i+=0.8)R(c,i,0,0.04,7,late?'#1a202b':'#423c48');
  R(c,0,7,16,4,late?'#1c1a1e':'#4a3e3a');
  R(c,5,1,5,3.2,'#05070a');rain(c,t,5,1,5,3.2,30);R(c,5,1,5,0.15,'#8d9bb0');R(c,7.45,1,0.1,3.2,'#8d9bb0');R(c,8.6,1.5,1.2,1.6,'rgba(242,212,138,'+(0.15+0.1*Math.sin(t*0.7))+')');
  R(c,11.6,1,4,3.8,late?'#1c222e':'#47404e');for(let i=11.6;i<15.6;i+=0.5)R(c,i,1,0.05,3.8,late?'#232a37':'#4f4858');TX(c,'207',14.6,4.5,8,'rgba(141,155,176,.5)');
  R(c,1,6.6,6,3,late?'#2a2f3c':'#d8d4cc');R(c,1,5.6,6,1.2,'#6b4a2a');R(c,1.3,6.7,1.8,0.8,late?'#3a4050':'#f2f0ea');R(c,1,8.6,6,1,late?'#232838':'#9aa4b8');
  R(c,7.6,5.4,3.4,0.4,'#6b4a2a');R(c,7.8,5.8,0.25,1.8,'#5a3e24');R(c,10.6,5.8,0.25,1.8,'#5a3e24');R(c,8.4,5.05,1,0.4,'#e8e2d0');R(c,9.9,4.9,0.7,0.5,'#222');
  R(c,12.4,5,3.2,5.4,'#7a6a5a');R(c,12.55,5.15,2.9,5.1,'#8a7a6a');R(c,15,7.6,0.25,0.25,'#d9bf7d');
  if(p.flags.heardWater&&!p.flags.mirror){R(c,12.4,10.25,3.2,0.15,'rgba(200,220,255,'+(0.4+0.4*Math.sin(t*5))+')')}
  if(late)R(c,0,0,16,11,'rgba(5,8,20,.35)');
  vignette(c,late?.7:.45);
 }
};
/* v43：序章的侧视布景改成像素画（PXART），陌生人没有五官 */
for(const k of Object.keys(BG)){const old=BG[k];BG[k]=function(c,t,p){p=p||P();if(window.PXART&&PXART.has(k)){PXART.draw(k,c,t,p,{dest:()=>destSt(),late:()=>(p.clock||0)>=hm('waterAt'),flag:f=>!!(p.flags||{})[f]});return}return old(c,t,p)}}

/* 测试与调试接口 */
return {playNode:id=>{queue.push({node:id});next()},resync:()=>{queue=[];deathShown=false;if(document.getElementById('pro-stage'))renderScene();hud()},applies,morning,placeName:()=>{const s=SC[P().scene];return s?fill(s.zh).split(' · ')[0].replace('（雨夜）',''):''},guess,fare:(at,id)=>fare(at,STN.find(x=>x.id===id)),start,resume,state:()=>P(),cond,advance,notebook,finale,complete,restore,enterScene,musts:MUSTS,nodes:NODES,
 clueList,
 objectives:()=>{if(!applies())return [];const p=P();return [{text:(window.MIDNIGHT?MIDNIGHT.urgentPrefix():'')+'24:00之前进入港屋酒店大厅（进入即视为入住；前台手续可随后办理）。地址：「'+(G.address||'')+'」',done:inSafe()},{text:'必答题 '+mustLabel(),done:p.musts.length>=mustTotal()},{text:'线索 '+p.clues.length+'/5（不必全部找到）',done:p.clues.length>=5},{text:'💡 '+hint(),done:false}]},
 deathCheck,inSafe,midnightDeath,retryButtons,wrongTime,fatalPending:()=>queue.some(q=>q.fatal)};
})();
window.PRO=PRO;
/* ↩ 返回之后：按恢复的存档重新画当前场景 */
DM.onUndo(()=>{if(PRO.applies()&&document.getElementById('pro-stage'))PRO.resync()});

/* ---------- 接入：第一天 / 时钟 / 失败 / 成田开局 ---------- */
/* 羽田开局的新游戏：第一天就是第一章前半段。旧存档（已经开始旧版第一天任务的）照旧 */
const proFirstDay=firstDayQuest;
firstDayQuest=function(){
 if(campaign&&!campaign.firstDayComplete){
  if(campaign.route20==null){campaign.route20=(campaign.firstDayStep||0)===0;campaignSave()}
  if(PRO.applies()){PRO.start();return}
 }
 proFirstDay();
};
/* 状态栏时钟：前半段进行中显示这一晚的时间 */
{const baseSet=TM.setOverride;const proClock=()=>PRO.applies()&&campaign.prologue?campaign.prologue.clock:null,proLabel=()=>PRO.applies()?'第一夜':null;
 TM.setOverride=function(fn,lf){if(fn)baseSet(fn,lf);else baseSet(proClock,proLabel)};baseSet(proClock,proLabel);}
GS.on(()=>PRO.deathCheck());
/* 成田开局（新游戏）：跳过第一章，入住后直接衔接第二章 */
const proDay1Success=firstDaySuccess;
firstDaySuccess=function(){
 proDay1Success();
 if(!campaign||campaign.birth!=='narita'||campaign.route20!==true)return;
 if(!campaign.chapter1Skipped){campaign.chapter1Skipped=true;campaign.storyIndex=Math.max(1,campaign.storyIndex||0);campaign.storyStep=0;campaignSave()}
 const b=app.querySelector('#day1-ch1');if(b)b.remove();const s=app.querySelector('#day1-sleep');if(s){s.classList.remove('alt');s.textContent='☾ 在酒店过夜 → DAY 2'}
 const box=s&&s.closest('section');if(box&&!box.querySelector('.pro-narita'))box.insertAdjacentHTML('beforeend','<p class="survival-tip pro-narita">✈ 你从成田入境——你的故事将从<b>第二章</b>开始（DAY 2 起可以在地图上追踪主线）。</p>');
};
/* 读档或刷新时如果停在 DAY 2 早上，先把早上的场景放完 */
const proMorningHome=tokyoHome;
tokyoHome=function(){if(campaign&&campaign.prologue&&campaign.prologue.morning&&campaign.firstDayComplete){PRO.morning();return}proMorningHome()};
const proUnlock=storyUnlockDay;
storyUnlockDay=function(index){if(index===1&&campaign&&campaign.chapter1Skipped)return 2;return proUnlock(index)};
function v51PlayerSprite(g,x,y,scale,draw){
 g.save();g.translate(x+16,y+29);g.scale(scale,scale);draw(-16,-29);g.restore();
}
