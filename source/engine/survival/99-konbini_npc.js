/* ==== engine/survival/99-konbini_npc.js ==== */
/* ===================================================================
   【v22.9 便利店的主线线索顾客（第一阶段）】
   五位和港屋酒店、片山茂和他的老朋友有关的人，作为真正的顾客进入收银队列：
   出现 → 把商品放上柜台 → 扫描 / 加热 / 装袋 / 收款 → 对话、可以点的东西 → 离开 → 线索记进档案。
   - 内容：data/work/konbini-npcs.json；数值：config/game.json 的 work.konbini.npc
   - 存档：campaign.konbini.npc[人物] = { stage 相遇阶段, last 上次见面是第几天, miss 满足条件却没出现的班次数, choices 关键选择, met 见面次数 }
           campaign.konbini.npcClues = [{ id, day, clock }]（同一条线索只记一次）
   - 每一班最多一位；时段要和班次重叠；冷却按天；条件满足却一直没出现，会在 guaranteeShifts 班以后保底出现。
   - 只给第一章（羽田开局、没有跳过第一章）的玩家；全部是可选的补充线索，第一章主线不需要它们。
   - 田中震的委托人身份不出现在任何称呼、档案标题、结算、存档摘要里。
   =================================================================== */
const KNPC=(function(){
 const ND=()=>GAME_DATA.d["work/konbini-npcs"]||{npcs:[],clues:{}};
 const NC=()=>(((GAME_CONFIG.work||{}).konbini||{}).npc)||{};
 const NPCS=()=>(ND().npcs||[]).filter(n=>n.kind!=='urban'); // 第二阶段的都市怪谈顾客以后单独处理
 const byId=id=>(ND().npcs||[]).find(n=>n.id===id);
 function K(){campaign.konbini??={shifts:0,memory:{},auto:{},lore:{}};const k=campaign.konbini;k.npc??={};k.npcClues??=[];return k}
 function R(id){const k=K();k.npc[id]??={stage:0,last:null,miss:0,choices:{},met:0};const r=k.npc[id];r.choices??={};r.miss??=0;r.met??=0;return r}
 function has(cid){return K().npcClues.some(c=>c.id===cid)}
 function V18(){const h=campaign&&campaign.hotelCase;return (h&&h.v18)||null}
 function ev(id){const v=V18();return !!(v&&((v.clues||[]).includes(id)||(v.testimony||[]).includes(id)))}
 function ch1(f){const v=V18();return !!(v&&v.flags&&v.flags[f])}
 function pro(){return (campaign&&campaign.prologue)||{}}
 function knowsName(){return ['name','register','notebook','lastdays','flowers','client'].some(ev)||(pro().clues||[]).includes('noCheckout')}
 /* 条件 */
 function cond(w){
  if(!w)return true;
  if(w.any&&!w.any.some(cond))return false;
  if(w.all&&!w.all.every(cond))return false;
  if(w.not&&cond(w.not))return false;
  if(w.ch1&&![].concat(w.ch1).every(ch1))return false;
  if(w.ev&&![].concat(w.ev).some(ev))return false;
  if(w.pclue&&![].concat(w.pclue).some(c=>(pro().clues||[]).includes(c)))return false;
  if(w.pflag&&![].concat(w.pflag).some(f=>(pro().flags||{})[f]))return false;
  if(w.knowsName&&!knowsName())return false;
  if(w.clue&&![].concat(w.clue).every(has))return false;
  if(w.choice){const [id,key,val]=w.choice;if((R(id).choices[key]??null)!==val)return false}
  if(w.day!=null&&campaign.day<w.day)return false;
  return true;
 }
 function forThisGame(){return !!(campaign&&campaign.firstDayComplete&&!campaign.chapter1Skipped&&campaign.birth!=='narita')}
 function stageOf(n){return (n.stages||[])[R(n.id).stage]||null}
 function cooldown(n){return (n.cooldownDays??NC().cooldownDays??1)+(R(n.id).extraCool||0)}
 function eligible(n,s){
  const r=R(n.id),stg=stageOf(n);if(!stg)return false;
  if(r.last!=null&&campaign.day<r.last+cooldown(n))return false;
  if(!cond(n.when)||!cond(stg.when))return false;
  // 剧情条件与冷却仍有效，任何可上班时段均可排队。
  return true;
 }
 function metToday(){return NPCS().filter(n=>R(n.id).last===campaign.day).length}
 /* 称呼：按条件取最后一个符合的（不会出现「委托人」） */
 function label(n){let l=null;(n.labels||[]).forEach(x=>{if(cond(x.when))l=x});return l||{jp:'お客様',zh:'客人'}}
 function view(n){const l=label(n);return {name:l.jp+'（'+l.zh+'）',portrait:n.portrait,palette:n.palette}}
 function fill(t){const d=campaign?campaign.day:1;return String(t??'').replace(/\{rideAgo\}/g,21+d-1).replace(/\{ambAgo\}/g,8+d-1)}
 function L(l){return l?Object.assign({},l,{jp:l.jp!=null?fill(l.jp):l.jp,zh:l.zh!=null?fill(l.zh):l.zh,sys:l.sys!=null?fill(l.sys):l.sys}):l}
 function first(list){return (list||[]).find(x=>cond(x.when))||null}
 function lang(l){if(!l)return '';if(l.sys)return `<p class="kb-npc-sys">${esc(l.sys)}</p>`;const zh=l.zh?(typeof langMode==='function'&&langMode()==='learning'?trToggle(l.zh):`<small>${esc(l.zh)}</small>`):'';return `<div class="kb-say"><span lang="ja" translate="no">${esc(l.jp)}</span>${zh}</div>`}
 function gain(cid){
  const C=ND().clues||{};if(!C[cid]||has(cid))return false;
  K().npcClues.push({id:cid,day:campaign.day,clock:TM.fmt(window.KONBINI&&KONBINI.clock()!=null?KONBINI.clock():TM.now())});
  if(window.KONBINI)KONBINI.sfx('clue');
  return true;
 }
 function setChoices(id,set){if(!set)return;Object.assign(R(id).choices,set)}

 /* ---------- 接入收银台 ---------- */
 const hooks={
  /* 开班时决定这一班会不会来一位线索顾客（每班最多一位） */
  shiftStart(s){
   if(!forThisGame()||s.n<(NC().minShift??2))return;
   if(metToday()>=(NC().perDay??2))return;
   const c=NPCS().filter(n=>(n.id!=='tanaka'||K().introDone)&&eligible(n,s));if(!c.length)return;
   const forced=c.filter(n=>R(n.id).miss>=(NC().guaranteeShifts??2)).sort((a,b)=>R(b.id).miss-R(a.id).miss);
   const pick=forced[0]||(Math.random()<(NC().chance??0.5)?c[Math.floor(Math.random()*c.length)]:null);
   c.forEach(n=>{if(n!==pick)R(n.id).miss++});
   if(pick)s.npcPlan={id:pick.id,stage:R(pick.id).stage,at:NC().atCustomer??2,done:false};
  },
  /* 轮到他的时候，作为一位真正的顾客进入队列 */
  order(s){
   const p=s.npcPlan;if(!p||p.done||p.id==='tanaka'&&s.introAppeared)return null;
   if((s.arrivals||1)<(p.at||2))return null;
   const n=byId(p.id),stg=n&&(n.stages||[])[p.stage];if(!stg){p.done=true;return null}
   p.done=true;p.appeared=true;R(n.id).appeared=(R(n.id).appeared||0)+1;
   const g=first(stg.greet);
   return KONBINI.buildOrder({tpl:'npc',cust:'npc:'+n.id,npc:{id:n.id,stage:p.stage,seen:{},tok:{}},view:view(n),items:stg.items,want:stg.want,said:g?[{l:L(g)}]:[],patience:n.patience});
  },
  /* 没出现（提前下班 / 时间到了还没轮到）或中途离开：保底计数 +1 */
  shiftEnd(s){const p=s.npcPlan;if(!p)return;if(!p.appeared||!p.completed)R(p.id).miss++},
  left(o){if(!o.npc)return;const s=KONBINI.state();if(s&&s.npcPlan)s.npcPlan.completed=false},
  scan(o,it){
   if(!o.npc)return;const stg=(byId(o.npc.id).stages||[])[o.npc.stage];const ls=(stg.onScan||{})[it.id];
   if(ls&&!o.npc.seen['scan:'+it.id]){o.npc.seen['scan:'+it.id]=true;ls.forEach(l=>o.said.push({l:L(l)}))}
  },
  subtotal(o){if(!o.npc)return;const stg=(byId(o.npc.id).stages||[])[o.npc.stage];if(stg.onSubtotal&&!o.npc.seen.sub){o.npc.seen.sub=true;stg.onSubtotal.forEach(l=>o.said.push({l:L(l)}))}},
  paid(o){if(!o.npc)return;const stg=(byId(o.npc.id).stages||[])[o.npc.stage];if(stg.onPaid&&!o.npc.seen.paid){o.npc.seen.paid=true;stg.onPaid.forEach(l=>o.said.push({l:L(l)}))}},
  /* 可以点的东西（工作证、员工卡、剪报……） */
  tokens(o){
   if(!o||!o.npc)return '';const stg=(byId(o.npc.id).stages||[])[o.npc.stage];
   return (stg.tokens||[]).filter(t=>t.show==='always'||(t.show==='subtotal'&&o.phase!=='items')||(t.show==='paid'&&o.pay.status==='ok')||o.npc.tok[t.id]).map(t=>`<button type="button" class="kb-token kb-npc-tok${o.npc.tok[t.id]?' seen':''}" data-npc="tok:${esc(t.id)}">${esc(t.label)}</button>`).join('');
  },
  custExtra(o){
   if(!o||!o.npc)return '';
   const stg=(byId(o.npc.id).stages||[])[o.npc.stage],out=[];
   (stg.tokens||[]).forEach(t=>{if(o.npc.tok[t.id])out.push(`<div class="kb-npc-look">${t.lines.map(l=>lang(L(l))).join('')}</div>`)});
   const T=o.talk;
   if(o.phase==='talk'&&T){
    out.push(`<div class="kb-npc-talk">${T.log.map(l=>l.me?`<div class="kb-said">你：「<span lang="ja">${esc(l.jp)}</span>」</div>`:lang(L(l))).join('')}${T.done?`<button type="button" class="survival-btn kb-npc-leave" data-npc="leave">▶ 目送顾客离开</button>`:T.choices.map((c,i)=>`<button type="button" class="kb-opt" data-npc="ch:${i}" lang="ja">${esc(c.jp)}${c.zh&&!(typeof langMode==='function'&&langMode()==='learning')?`<small>${esc(c.zh)}</small>`:''}</button>`).join('')}</div>`);
   }
   return out.join('');
  },
  /* 结完账：有对话就先停下来说话（返回 true = 先不离开） */
  finish(o){
   const n=byId(o.npc.id),stg=(n.stages||[])[o.npc.stage];const tk=stg.talk;
   o.talk={log:(tk&&tk.lines||[]).filter(l=>cond(l.when)).slice(),choices:(tk&&tk.choices||[]).filter(c=>cond(c.when)),done:!(tk&&(tk.choices||[]).length)};
   if(!tk){complete(o);return false}
   return true;
  },
  click(v,o){
   if(!o||!o.npc)return true;const n=byId(o.npc.id),stg=(n.stages||[])[o.npc.stage];
   if(v.startsWith('tok:')){const t=(stg.tokens||[]).find(x=>x.id===v.slice(4));if(!t||o.npc.tok[t.id])return true;
    o.npc.tok[t.id]=true;setChoices(n.id,t.set);if(t.clue&&gain(t.clue))KONBINI.note('🔎 记进档案：'+((ND().clues||{})[t.clue]||{}).title,false);
    o.npcView=view(n);
    if(o.talk&&!o.talk.done){const tk=stg.talk;o.talk.choices=(tk&&tk.choices||[]).filter(c=>cond(c.when))}
    campaignSave();KONBINI.render();return true}
   if(v.startsWith('ch:')){const T=o.talk;if(!T||T.done)return true;const c=T.choices[+v.slice(3)];if(!c)return true;
    T.log.push({jp:c.jp,zh:c.zh,me:true});(c.reply||[]).forEach(l=>T.log.push(l));T.done=true;T.pick=+v.slice(3);
    setChoices(n.id,c.set);if(c.extraCooldown)o.npc.addCool=c.extraCooldown;
    if(c.clue&&gain(c.clue))KONBINI.note('🔎 记进档案：'+((ND().clues||{})[c.clue]||{}).title,false);
    o.npcView=view(n);campaignSave();KONBINI.render();return true}
   if(v==='leave'){complete(o);KONBINI.release();return true}
   return true;
  }
 };
 /* 这一阶段结束：达成条件才进入下一阶段（没拿到关键线索就下次再来） */
 function complete(o){
  const n=byId(o.npc.id),r=R(n.id),stg=(n.stages||[])[o.npc.stage],need=stg.complete;
  const ok=!need||(need.clue?has(need.clue):need.any?need.any.some(has):true);
  r.last=campaign.day;r.met++;r.miss=ok?0:r.miss+1;r.extraCool=o.npc.addCool||0; // 例如：逼问之后，她要多隔几天才会再来
  if(r.stage===o.npc.stage&&ok)r.stage++;
  const s=KONBINI.state();if(s&&s.npcPlan)s.npcPlan.completed=true;
  campaignSave();
 }

 /* ---------- 档案：FILE 03 证据里的「便利店里听到的话」 ---------- */
 function linkName(id){
  const E=((GAME_DATA.story.chapter1||{}).evidence)||{},P=(((GAME_DATA.story.chapter1||{}).prologue||{}).clues)||{},C=ND().clues||{};
  if(E[id]&&ev(id))return E[id].name;
  if(P[id]&&(pro().clues||[]).includes(id))return P[id].name;
  if(C[id]&&has(id))return C[id].title;
  return null;
 }
 function archive(){
  if(!campaign||!campaign.konbini)return '';
  const list=K().npcClues;if(!list.length)return '';
  const C=ND().clues||{};
  return `<div class="kb-archive" id="file-konbini"><h3>🏪 便利店里听到的话（${list.length}）</h3><p class="survival-tip">打工时从顾客那里听到、看到的。证言之间可能有出入；凭记忆的说法不一定准。</p>${list.map(x=>{const c=C[x.id];if(!c)return '';const n=byId(c.npc),lb=n?label(n):{jp:'',zh:''};const links=(c.links||[]).map(linkName).filter(Boolean);
   return `<div class="et-evidence kb-clue"><b>${esc(c.title)}</b><small>${esc(lb.zh)} · 便利店收银台 · DAY ${x.day} ${esc(x.clock||'')}</small>${c.jp?`<small class="et-jp" lang="ja">📖「${esc(fill(c.jp))}」</small>`:''}<small>${esc(c.desc)}</small>${links.length?`<small class="kb-links">🔗 可以对照：${links.map(esc).join('、')}</small>`:''}${c.unlocks?`<small class="kb-links">→ ${esc(c.unlocks)}</small>`:''}</div>`}).join('')}</div>`;
 }
 return {hooks,archive,cond,state:R,clues:()=>K().npcClues.slice(),eligible,label,knowsName};
})();
window.KNPC=KNPC;
const firstVisitor={
 order(s){
  if(campaign.konbini.introDone||s.introAppeared||s.arrivals<2)return;
  s.introAppeared=true;
  const visitor=GAME_DATA.d['work/konbini-npcs'].npcs.find(n=>n.id==='tanaka');
  const o=KONBINI.buildOrder({npc:{id:'firstVisitor'},view:{name:'神秘男子',portrait:{...visitor.portrait,age:'middle',acc:[]},palette:visitor.palette},items:['coffee'],said:[{l:{jp:'いらっしゃいませ。',zh:'自动门响了。穿深色夹克的中年男人在货架旁看了你一会儿，才拿着一罐咖啡走到柜台。'}}]});
  o.firstVisit=true;return o
 },
 scan(o){if(!o.firstVisit)return;if(!o.question){o.question=true;o.said.push({l:{jp:'……あんた、こんなところで何やってんだ？',zh:'……你在这种地方干什么？'}},{l:{jp:'……あの件、どうなったんだよ。',zh:'……那件事，查得怎么样了？'}},{l:{jp:'こんなところでバイトしてる場合か？',zh:'他压低声音。你还有闲心在这种地方打工？'}})}return true},
 tokens(o){if(o?.firstVisit)return ' '},
 subtotal(o){if(o.firstVisit)return true},paid(o){if(o.firstVisit)return true},
 custExtra(o){if(!o?.firstVisit)return;if(o.phase==='talk')return '<div class="kb-say">……ちゃんと調べてくれよ。<small>他拿起咖啡，走到门前又回头看你。“……可得好好查啊。”你完全不记得见过他。</small></div><button class="kb-opt" data-npc="depart">目送他离开</button>';
  if(!o.question||o.firstAnswer)return ' ';
  return this.choices.map(([jp,zh],i)=>`<button class="kb-opt" data-npc="first${i}">${jp}<small>${zh}</small></button>`).join('')
 },
 choices:[['……どちら様ですか？','……请问您是哪位？'],['何の話ですか？','您在说什么？'],['仕事の邪魔をしないでください。','请不要妨碍我工作。']],
 click(v,o){if(!o?.firstVisit)return;if(v==='depart'&&o.phase==='talk'&&o.firstAnswer&&o.pay.status==='ok'){campaign.konbini.introDone=true;KONBINI.release()}else if(o.question&&!o.firstAnswer&&/^first[0-2]$/.test(v)){const [jp,zh]=this.choices[Number(v.slice(-1))];o.firstAnswer=v;o.said.push({l:{jp,zh}},{l:{jp:'……いや。人違いだったかもしれない。',zh:'他沉默片刻。“……没什么。可能认错人了。”'}});campaignSave();KONBINI.render()}return true},
 finish(o){if(o.firstVisit)return true},
 left(o){if(o.firstVisit)return true}
};
KONBINI.use(firstVisitor);
KONBINI.use(KNPC.hooks);
/* v24.1：「便利店里听到的话」放进档案 FILE 03 证据（85-ui-shell.js 的 archivePage 调用 KNPC.archive()） */
