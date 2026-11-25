/* ==== engine/survival/99-konbini.js ==== */
/* ===================================================================
   【v22.8 打工：便利店收银小游戏】
   「打工」按钮 → 便利店工作台（第一人称）：顾客 → 扫描 → 加热 → 收款（现金 / 交通IC / 二维码）→ 装袋 → 下一位。
   - 内容：data/work/konbini.json（商品、订单模板、顾客、日语、工作手册、异常）
   - 数值：config/game.json 的 work.konbini（时长、工资、扣分、概率）；异常扣 SAN 在 sanRules.konbiniAnomaly
   - 商品的规则由属性组合决定（heat / frozen / hot / discount / reserve），不为每件商品单独写流程。
   - 存档：campaign.konbini = { shifts 已打工次数, memory 肌肉记忆计数, auto 自动完成, lore 异常记录, shift 进行中的班次 }
     班次进行中会自动存档（刷新、离开画面后可以继续）；结算只做一次（shift 结算后立刻删除）。
   - 暂停：离开工作台画面、打开工作手册、弹出对话框 / 确认框、浏览器切到后台时，倒计时和设备计时都停止。
   - 操作：拖拽（鼠标 / 触控板 / 触屏），或者「先点商品，再点目的地」。
   - 原来的打工（直接拿钱）保留为「快速打工」。
   =================================================================== */
const KONBINI=(function(){
 const KD=()=>GAME_DATA.d["work/konbini"]||{};
 const KC=()=>(GAME_CONFIG.work||{}).konbini||{};
 const ITEM=id=>(KD().items||[]).find(x=>x.id===id)||null;
 const PH=k=>(KD().phrases||{})[k];
 let root=null,raf=0,last=0,saveAcc=0,sel=null,manualOpen=false,drag=null,flash='',flashT=0,info=null,quickWork=null,result=null;
 function K(){if(!campaign)return null;campaign.konbini??={shifts:0,memory:{},auto:{},lore:{}};const k=campaign.konbini;k.memory??={};k.auto??={};k.lore??={};k.shifts??=0;if(!k.moves){const replies=KD().replies||[];k.moves={reply:replies.reduce((count,r)=>count+(Number(k.memory[r.id])||0),0)}}
  if(!k.wages){k.wages={};const r=k.last;if(r&&r.early===false&&r.served>0&&Number.isFinite(r.base)&&Number.isFinite(r.bonus))k.wages[r.base]=r.base+r.bonus}
  return k}
 function S(){const k=K();return k&&k.shift}
 function rnd(a){return a[Math.floor(Math.random()*a.length)]}
 function wpick(w){const e=Object.entries(w||{cash:1});let t=e.reduce((s,x)=>s+x[1],0),r=Math.random()*t;for(const [k,v] of e){if((r-=v)<0)return k}return e[0][0]}
 function yen(n){return '¥'+Math.round(n).toLocaleString('ja-JP')}
 function stage(){return typeof invasionStage==='function'?invasionStage():0}
 /* v23.4：剧情体验模式下，店员的回答选项也显示中文意思（optionsZh）；学习模式不显示 */
 function optZh(R,i){const z=(R.optionsZh||[])[i];return z&&!(typeof langMode==='function'&&langMode()==='learning')?`<small>${esc(z)}</small>`:''}
 function lang(l){if(!l)return '';const zh=l.zh?(typeof langMode==='function'&&langMode()==='learning'?trToggle(l.zh):`<small>${esc(l.zh)}</small>`):'';return `<span lang="ja" translate="no">${esc(l.jp)}</span>${zh}`}
 function fillP(p,o){if(!p)return null;const r=s=>String(s||'').replace(/\{owner\}/g,o&&o.owner?o.owner.jp:'').replace(/\{ownerZh\}/g,o&&o.owner?o.owner.zh:'').replace(/\{method\}/g,o&&o.methodJp||'').replace(/\{methodZh\}/g,o&&o.methodZh||'');return {jp:r(p.jp),zh:r(p.zh),memo:r(p.memo)}}
 function sfx(n){if(window.AUDIO)AUDIO.sfx(n)}
 function shiftNo(){const k=K();return (S()?S().n:(k?k.shifts:0)+1)}
 function wageFull(){const WK=GAME_CONFIG.work;return Math.max(WK.minIncome,WK.baseIncome-WK.incomeDropPerStage*stage())}
 const skills={scan:['商品扫描','点托盘上的普通商品即可扫描'],heat:['微波加热','普通订单加热到点自动取出'],bag:['商品装袋','可一键装好已扫描的普通商品'],pay:['收款找零','普通现金付款可一键备齐找零'],reply:['日语应答','熟悉的普通问句可自动应答']};
 function ordinary(o){return o&&!o.ruleEvent&&!o.npc&&!o.wet&&!o.ghost&&!o.items.some(i=>i.anomaly||i.specialOrder)}
 function plain(it){return !it.fetched&&!it.anomaly&&!Object.values(attrs(it)).some(Boolean)}
 function trained(id){return (K().moves[id]||0)>=(KC().memoryCount||3)}
 function credit(o,id,it){const itemKey=it?.fetched?it.id+':'+o.items.filter(x=>x.fetched&&x.id===it.id).indexOf(it):it?.uid;const key=id+':'+(itemKey||'order');o.practiced??={};if(o.practiced[key])return;
  o.practiced[key]=true;const m=K().moves;m[id]=(m[id]||0)+1;
  if(m[id]===(KC().memoryCount||3)) {if(window.KWORK&&KWORK.memToast)KWORK.memToast(skills[id][0])}}
 function record(){return K().wages[wageFull()]||0}
 function rulesFor(n){return (KD().rules||[]).filter(r=>r.anomaly||r.shift<=n)}
 /* 扩展接口（v22.9）：主线线索顾客等模块用 KONBINI.use({order, shiftStart, shiftEnd, scan, subtotal, paid, finish, left, custExtra, click}) 接进来 */
 const HOOKS=[];
 function hook(name,...a){for(const h of HOOKS){if(typeof h[name]==='function'){let r;try{r=h[name](...a)}catch(e){console.error(e)}if(r!=null&&r!==false)return r}}return null}

 /* ---------- 订单 ---------- */
 function patienceMs(c,nItems,impatient){const C=KC(),d=(C.difficultyPatience||{})[campaign.mode]||1;return Math.round(((C.patienceSeconds||45)+(C.patiencePerItem||7)*nItems)*(c.patience||1)*d*(impatient?0.75:1)*1000)}
 function newOrder(){
  const s=S(),n=s.n,C=KC(),D=KD();
  s.arrivals=(s.arrivals||0)+1;const special=hook('order',s);if(special)return special; // 线索顾客

  const ok=it=>it&&it.unlock<=n;
  const anomalyOn=n>=(C.anomalyFromShift??1)&&!s.anomalyUsed;
  /* 异常顾客 */
  if(anomalyOn&&Math.random()<(C.anomalyCustomerChance||0)){
   s.anomalyUsed=true;const A=D.anomalies.customer;
   const o={id:++s.seq,tpl:'anomaly',cust:A.id,wet:true,items:[mk('onigiri')],need:[],want:{heat:null,bag:false,pay:'cash'},lines:[],bagFee:false,phase:'items',pay:{method:null,status:'none',recv:0,entered:null,tray:[]},pen:{},said:[{k:'greet',l:A.greet}],patience:1,patienceMax:1,hurried:0,memo:[]};
   return o;
  }
  const tpls=(D.templates||[]).filter(t=>t.pick.filter(g=>g.some(id=>ok(ITEM(id)))).length>=t.min);
  const t=rnd(tpls);const ids=[];
  t.pick.map(g=>g.filter(id=>ok(ITEM(id)))).filter(av=>av.length).forEach((av,i)=>{if(i>=t.min&&Math.random()<0.45)return;ids.push(rnd(av))}); // 前 min 组一定有，其余随机
  const cust=rnd((D.customers||[]).filter(c=>t.impatient?c.patience<=1:true));
  const o={id:++s.seq,tpl:t.id,cust:cust.id,items:[],need:[],want:{heat:null,bag:false,pay:wpick(t.pay)},lines:[],bagFee:false,phase:'items',pay:{method:null,status:'none',recv:0,entered:null,tray:[]},pen:{},said:[],memo:[],hurried:0};
  o.said.push({k:'greet',l:rnd(PH('greet'))});
  ids.forEach(id=>{const it=ITEM(id);if(it.from==='hotcase')o.need.push({id,kind:'hot'});else if(it.from==='shelf'){const owner=rnd(D.owners);o.need.push({id,kind:'reserve',owner});o.owner=owner}else o.items.push(mk(id))});
  if(o.items.some(x=>ITEM(x.id).attrs&&ITEM(x.id).attrs.heat)){o.want.heat=Math.random()<0.65;o.said.push({k:o.want.heat?'heat_yes':'heat_no'})}
  o.need.forEach(x=>o.said.push(x.kind==='hot'?{k:'hot_'+x.id}:{k:'reserve'}));
  if(n>=2){o.want.bag=Math.random()<0.55;o.said.push({k:o.want.bag?'bag_yes':'bag_no'})}
  if(anomalyOn&&Math.random()<(C.anomalyItemChance||0)){s.anomalyUsed=true;o.items.push(Object.assign(mk('noname'),{anomaly:true}));o.ruleEvent=true}
  const cues=(o.want.heat!==null?1:0)+(n>=2?1:0)+1;if(cues<(C.replyMaxCues||99)&&Math.random()<(C.replyChance||0)){const r=rnd(D.replies||[]);if(r)o.reply={id:r.id,done:false,at:2500}}
  o.patienceMax=o.patience=patienceMs(cust,o.items.length+o.need.length,t.impatient);
  if(ordinary(o)&&o.want.bag&&K().auto.bag_yes)o.bagFee=true; // 肌肉记忆：自动完成
  return o;
 }
 function mk(id){const s=S();return {uid:'i'+(++s.seq),id,state:'tray',bag:null,heated:false,over:false,frozenHeated:false}}
 function cur(){const s=S();return s&&s.cur}
 function itemDef(it){return it.anomaly?Object.assign({attrs:{}},KD().anomalies.item,{price:0}):ITEM(it.id)}
 function attrs(it){return (itemDef(it)||{}).attrs||{}}
 function custDef(o){if(o.npcView)return o.npcView;if(o.wet)return KD().anomalies.customer;return (KD().customers||[]).find(c=>c.id===o.cust)||{}}
 function phrase(s,o){if(s.l)return s.l;const p=fillP(PH(s.k),{owner:o.owner});return p}
 function priceOf(line,o){const it=o.items.find(x=>x.uid===line.uid);const d=it?itemDef(it):null;if(!d)return 0;const disc=line.disc&&(d.attrs||{}).discount?(d.attrs.discount):line.disc?0.1:0;return Math.round(d.price*(1-disc))}
 function total(o){return o.lines.reduce((s,l)=>s+priceOf(l,o),0)+(o.bagFee?(KC().bagFee||3):0)}
 function expected(o){let t=0;o.items.filter(x=>!x.extra&&!x.anomaly).forEach(x=>{const d=itemDef(x);t+=Math.round(d.price*(1-((d.attrs||{}).discount||0)))});return t+(o.want.bag?(KC().bagFee||3):0)}

 /* ---------- 班次 ---------- */
 function startShift(){
  if(!campaign)return;if(S()){open();return}
  if(typeof spendAction==='function'&&!spendAction('work'))return;
  const k=K(),C=KC();
  k.shift={v:1,n:k.shifts+1,seq:0,startClock:TM.dayClock?TM.dayClock()-((GAME_CONFIG.time||{}).hoursPerAction||4)*60:0,activeMs:0,shiftMs:(C.shiftSeconds||240)*1000,served:[],cur:null,queue:[{wait:0}],spawn:rand(C.spawnMin,C.spawnMax),mic:null,settled:false,seen:{}};
  hook('shiftStart',k.shift);
  campaignSave();result=null;
  const nr=rulesFor(k.shift.n).filter(r=>r.shift===k.shift.n);
  manualOpen=k.shift.n===1||nr.length>0; // 第一次（以及解锁新规则时）先看工作手册，看手册时倒计时暂停
  open();
 }
 function rand(a,b){return Math.round(((a||14)+Math.random()*((b||24)-(a||14)))*1000)}
 function open(){
  if(!campaign||!S())return;
  if(window.DM)DM.close();
  UI.scene('konbini',open);if(window.AUDIO)AUDIO.ambience('lobby');
  app.innerHTML='<div class="rpg-shell kb-shell"><section class="rpg-panel kb-panel" id="kb-root"></section></div>';
  root=document.getElementById('kb-root');
  bind();render();
  cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(loop);
 }
 function paused(){return !root||!root.isConnected||document.hidden||manualOpen||(S()&&S().cur&&S().cur.phase==='talk')||!!document.querySelector('.et-modal-back')||(window.DM&&DM.isOpen())||!S()||S().settled}
 function loop(ts){
  if(!root||!root.isConnected||!S()){raf=0;return}
  const dt=Math.min(250,ts-last);last=ts;
  if(!paused())step(dt);
  raf=requestAnimationFrame(loop);
 }
 /* 每一帧：班次时间、顾客耐心、排队、微波炉 */
 function step(dt){
  const s=S(),C=KC();s.activeMs+=dt;
  const o=s.cur;
  if(o&&!o.firstVisit&&!o.wet&&o.phase!=='done'&&o.phase!=='talk'){if(!(o.reply&&o.reply.at<=0&&!o.reply.done))o.patience-=dt;
   const r=o.patience/o.patienceMax;CH1FIX.patience(o);
   if((r<0.5&&o.hurried<1)||(r<0.25&&o.hurried<2)){o.hurried++;o.said.push({k:'hurry',l:rnd(PH('hurry'))});sfx('buzz');render()}
   if(o.reply&&!o.reply.done&&o.reply.at>0){o.reply.at-=dt;if(o.reply.at<=0){const R=(KD().replies||[]).find(x=>x.id===o.reply.id);if(R&&ordinary(o)&&trained("reply")&&K().auto[R.id]){o.reply.done=true;o.reply.ok=true;o.reply.auto=true}render()}}
   if(o.patience<=0){custLeaves();return}
  }
  s.queue.forEach(q=>q.wait+=dt);
  const qi=s.queue.findIndex((q,i)=>q.wait>=(C.queueLeaveSeconds||70)*1000&&!(i===0&&!s.cur));
  if(qi>=0){s.queue.splice(qi,1);s.served.push({fail:true,why:'queue',score:0});say(PH('queue_leave'));render()}
  if(!s.cur&&!s.queue.length&&s.spawn>3000)s.spawn=3000; // 店里没人时，下一位很快就来
  if(s.activeMs<s.shiftMs){s.spawn-=dt;if(s.spawn<=0){s.spawn=rand(C.spawnMin,C.spawnMax);if(s.queue.length<(C.maxQueue||3)){s.queue.push({wait:0});render()}}}
  if(!s.cur&&s.queue.length&&s.activeMs<s.shiftMs&&!s.nextWait){s.queue.shift();s.cur=newOrder();sfx('ding');render()}
  if(s.nextWait){s.nextWait-=dt;if(s.nextWait<=0)s.nextWait=0}
  /* 微波炉独立计时 */
  const m=s.mic;
  if(m){if(m.ms>0){m.ms-=dt;if(m.ms<=0){m.ms=0;sfx('chin');if(ordinary(o)&&trained('heat')&&oHeatOK(o,findItem(m.uid),m))takeOut();render()}}else{m.over+=dt;if(m.over>(C.overheatSeconds||6)*1000&&!m.overFlag){m.overFlag=true;const it=findItem(m.uid);if(it)it.over=true;render()}}}
  if(s.activeMs>=s.shiftMs&&!s.timeUp){s.timeUp=true;render()}
  if(s.timeUp&&!s.cur){if(!K().introDone&&!s.introAppeared){s.arrivals=Math.max(1,s.arrivals||0);s.cur=newOrder();sfx('ding');render()}else settle(false);return}
  saveAcc+=dt;if(saveAcc>=(C.saveEverySeconds||2)*1000){saveAcc=0;campaignSave()}
  tickUI();
 }
 function findItem(uid){const o=cur();return o&&o.items.find(x=>x.uid===uid)}
 function say(l){flash=l?l.jp+(l.zh?'｜'+l.zh:''):'';flashT=Date.now()}
 function custLeaves(){
  const s=S(),o=s.cur;if(!o)return;
  if(s.mic&&o.items.some(x=>x.uid===s.mic.uid))s.mic=null;
  hook('left',o);
  s.served.push({fail:true,why:'angry',score:0});s.cur=null;s.nextWait=1200;sel=null;
  say(PH('angry_leave'));sfx('ng');campaignSave();render();
 }

 /* ---------- 操作 ---------- */
 function note(t,bad){flash=t;flashT=Date.now();if(bad)sfx('ng');render()}
 function drop(uid,zone){
  const s=S(),o=s&&s.cur;if(!o||o.phase==='done'||o.phase==='talk'||s.settled)return;
  if(uid==='card'||uid==='phone'){payTouch(uid==='card'?'reader':'qr',zone);return}
  const it=o.items.find(x=>x.uid===uid);if(!it)return;
  const a=attrs(it);sel=null;
  if(zone==='scan'){
   if(o.phase!=='items'){note('POS 已经进入收款。要改商品，先按「戻る」。',true);return}
   if(it.state==='mic'){note('商品还在微波炉里。',true);return}
   if(it.anomaly){anomalyScan(it);return}
   const dup=o.lines.some(l=>l.uid===it.uid);
   o.lines.push({lid:'l'+(++s.seq),uid:it.uid,disc:false});if(it.state==='tray')it.state='scan';
   if(!dup){if(!isExtra(o,it))credit(o,'scan',it);hook('scan',o,it)}
   sfx(dup?'ng':'scan');note(dup?'⚠ ピッ……同じ商品をもう一度スキャンした（POS 上多了一行）':'ピッ ✓ '+itemDef(it).jp+' '+yen(itemDef(it).price),false);
   campaignSave();return;
  }
  if(zone==='mic'){
   if(it.anomaly){note('……还是不要把它放进微波炉。',true);return}
   if(s.mic){note('微波炉里已经有东西了。',true);return}
   if(it.state==='bag'){it.bag=null}
   it.prev=it.state==='bag'?'scan':it.state;it.state='mic';
   const sec=a.heat||4;s.mic={uid:it.uid,ms:sec*1000,over:0,total:sec*1000};
   if(a.frozen){it.frozenHeated=true;note('⚠ 冷冻品放进了微波炉！（工作手册：冷冻品不加热）',true)}else{sfx('click');note('微波炉启动（'+sec+' 秒）',false)}
   campaignSave();return;
  }
  if(zone==='bagA'||zone==='bagB'){
   if(it.anomaly){note('它不在 POS 上……也不该装进顾客的袋子。',true);return}
   if(it.state==='mic'){note('先从微波炉里取出来。',true);return}
   if(!o.lines.some(l=>l.uid===it.uid)){note('先扫描，再装袋。',true);return}
   it.state='bag';it.bag=zone==='bagA'?'A':'B';if(!isExtra(o,it)&&(!a.frozen||it.bag==='B')&&(!(a.hot||it.heated)||it.bag==='A'))credit(o,'bag',it);sfx('page');render();campaignSave();return;
  }
  if(zone==='counter'){if(it.state==='bag'){it.state='scan';it.bag=null;render();campaignSave()}return}
  if(zone==='bin'){
   if(!it.anomaly){note('不能把顾客的商品扔掉。',true);return}
   const A=KD().anomalies.item;o.items=o.items.filter(x=>x!==it);K().lore.noname='binned';
   if(window.FILES)FILES.addAnomaly('konbini-noname',A.anomalyTitle,A.place);
   note(A.binText,false);sfx('drip');campaignSave();return;
  }
  if(zone==='hotcase'||zone==='shelf'){
   if(!it.fetched||ITEM(it.id).from!==(zone==='hotcase'?'hotcase':'shelf')){note('这个不能放回那里。',true);return}
   if(o.lines.some(l=>l.uid===it.uid)){note('已经扫描过了：先在 POS 上取消这一行。',true);return}
   o.items=o.items.filter(x=>x!==it);note('放回去了。',false);campaignSave();return;
  }
 }
 function anomalyScan(it){
  const s=S(),o=s.cur,A=KD().anomalies.item;
  o.items=o.items.filter(x=>x!==it);o.lines.push({lid:'l'+(++s.seq),uid:it.uid,disc:false,ghost:true});o.ghost=it;
  K().lore.noname='scanned';if(window.FILES)FILES.addAnomaly('konbini-noname',A.anomalyTitle,A.place);
  const v=(GAME_CONFIG.sanRules||{}).konbiniAnomaly||6;GS.change({san:-v},'便利店：扫描了没有条形码的商品');
  if(SETTINGS.get('anomalies'))UI.glitch('static',1400);
  note(A.scanText+'（SAN -'+v+'）',true);campaignSave();
 }
 function zoneClick(z){
  const s=S(),o=s&&s.cur;
  if(sel){const u=sel;drop(u,z);return}
  if(!o)return;
  if(z==='mic'){takeOut();return}
  if(z==='hotcase'){picker='hotcase';render();return}
  if(z==='shelf'){picker='shelf';render();return}
  if(z==='reader'||z==='qr'){payTouch(z,z);return}
 }
 let picker=null;
 function oHeatOK(o,it,m){return m.ms<=0&&o.want.heat===true&&attrs(it).heat&&!it.over&&!it.frozenHeated&&!isExtra(o,it)}
 function takeOut(){
  const s=S(),m=s.mic;if(!m)return;const it=findItem(m.uid);
  if(it){it.state=it.prev||'tray';if(m.ms<=0)it.heated=true;delete it.prev}
  note(m.ms>0?'中途取出来了（还没热）。':'取出来了'+(it&&it.over?'……有点烫过头了。':'。'),false);
  if(it&&oHeatOK(cur(),it,m))credit(cur(),'heat',it);s.mic=null;campaignSave();render();
 }
 function fetch(kind,id,owner){
  const s=S(),o=s.cur;if(!o)return;picker=null;
  const it=mk(id);it.fetched=true;if(owner)it.owner=owner;
  o.items.push(it);sfx('page');note((kind==='shelf'?'从预订架拿出：':'从热柜拿出：')+ITEM(id).jp+(owner?'（'+owner.jp+' 様）':''),false);campaignSave();
 }
 function voidLine(lid){
  const o=cur();if(!o||o.phase!=='items')return;const l=o.lines.find(x=>x.lid===lid);if(!l)return;
  o.lines=o.lines.filter(x=>x!==l);
  if(l.ghost){o.ghost=null}
  else if(!o.lines.some(x=>x.uid===l.uid)){const it=findItem(l.uid);if(it&&it.state!=='mic'){it.state='tray';it.bag=null}}
  sfx('click');render();campaignSave();
 }
 function toggleDisc(lid){const o=cur();if(!o||o.phase!=='items')return;const l=o.lines.find(x=>x.lid===lid);if(l){l.disc=!l.disc;render();campaignSave()}}
 function toggleBag(){const o=cur();if(!o||o.phase!=='items')return;o.bagFee=!o.bagFee;render();campaignSave()}
 function subtotal(){
  const o=cur();if(!o)return;
  if(o.firstVisit&&!o.firstAnswer){note('他在等你的回答。',false);return}if(o.phase==='items'){if(!o.lines.length){note('POS 上还没有商品。',true);return}
   o.phase='pay';o.said.push({k:'pay_'+o.want.pay});hook('subtotal',o);
   if(ordinary(o)&&K().auto['pay_'+o.want.pay])choose(o.want.pay,true);
   sfx('page');render();campaignSave();return}
  if(o.phase==='pay'&&o.pay.status!=='ok'){o.phase='items';o.pay={method:null,status:'none',recv:0,entered:null,tray:[]};render();campaignSave()}
 }
 const MJP={cash:['現金','现金'],ic:['ICカード','IC卡'],qr:['QRコード','二维码']};
 function choose(m,auto){
  const o=cur();if(!o||o.phase!=='pay'||o.pay.status==='ok')return;
  if(m!==o.want.pay){o.pen.wrongMethod=1;const p=fillP(PH('complain_method'),{methodJp:MJP[o.want.pay][0],methodZh:MJP[o.want.pay][1]});o.said.push({l:p});sfx('ng');render();campaignSave();return}
  o.pay.method=m;o.pay.status=m==='cash'?'cash':'wait';o.pay.tray=[];o.pay.entered=null;
  if(m==='cash'){const t=total(o);o.pay.recv=o.wet?-1:(Math.random()<0.3?t:[1000,2000,5000,10000].find(x=>x>=t)||Math.ceil(t/1000)*1000)}
  if(!auto)sfx('click');render();campaignSave();
 }
 function payTouch(dev,zone){
  const o=cur();if(!o||o.phase!=='pay')return;
  const need=o.pay.method==='ic'?'reader':o.pay.method==='qr'?'qr':null;
  if(!need||o.pay.status!=='wait'&&o.pay.status!=='fail'){note('现在不需要刷卡 / 扫码。',true);return}
  if(dev!==need||zone!==need){note(need==='reader'?'IC 卡要放到读卡器上。':'二维码要用扫码器扫。',true);return}
  const C=KC();
  if(o.pay.method==='ic'&&!o.icTried&&Math.random()<(C.icFailChance||0)){o.icTried=true;o.want.pay='cash';o.pay={method:null,status:'none',recv:0,entered:null,tray:[]};o.said.push({k:'ic_short'});note('ピピッ　残高不足（余额不足）',true);campaignSave();return}
  if(o.pay.method==='qr'&&!o.qrTried&&Math.random()<(C.qrFailChance||0)){o.qrTried=true;o.pay.status='fail';note('通信エラー（通信错误）——请再扫一次。',true);campaignSave();return}
  o.pay.status='ok';if(total(o)===expected(o))credit(o,'pay');hook('paid',o);sfx('coin');note(o.pay.method==='ic'?'シャリーン ✓ IC 支付完成':'✓ 二维码支付完成',false);campaignSave();
 }
 function enter(v){const o=cur();if(!o||o.pay.status!=='cash')return;o.pay.entered=v==='exact'?total(o):v;o.pay.tray=[];sfx('click');render();campaignSave()}
 function coin(v){const o=cur();if(!o||o.pay.status!=='cash'||o.pay.entered==null)return;o.pay.tray.push(v);sfx('coin');render()}
 function clearTray(){const o=cur();if(o){o.pay.tray=[];render()}}
 function giveChange(){
  const o=cur();if(!o||o.pay.status!=='cash'||o.pay.entered==null)return;
  const given=o.pay.tray.reduce((a,b)=>a+b,0);
  if(o.wet){acceptOldCoin();return}
  const right=o.pay.recv-total(o);
  if(given!==right||o.pay.entered!==o.pay.recv){o.pen.wrongChange=(o.pen.wrongChange||0)+1;o.said.push({k:'complain_change'});o.pay.tray=[];sfx('ng');note('顾客数了数找零：不对。重新核对「お預かり」和找零。',true);campaignSave();return}
  o.pay.status='ok';if(total(o)===expected(o))credit(o,'pay');hook('paid',o);sfx('coin');note('✓ 现金收款完成',false);campaignSave();
 }
 function refuse(){
  const o=cur();if(!o||o.pay.status!=='cash')return;const s=S();
  if(o.wet){const A=KD().anomalies.customer;K().lore.wet='refused';if(window.FILES)FILES.addAnomaly('konbini-wet',A.anomalyTitle,A.place);
   s.served.push({anomaly:true,score:null});s.cur=null;s.nextWait=1500;sel=null;note(A.refuseText,false);sfx('drip');campaignSave();return}
  o.pen.refuseNormal=1;o.said.push({k:'complain_refuse'});sfx('ng');render();campaignSave();
 }
 function acceptOldCoin(){
  const s=S(),o=s.cur,A=KD().anomalies.customer;K().lore.wet='accepted';
  if(window.FILES)FILES.addAnomaly('konbini-wet',A.anomalyTitle,A.place);
  const v=(GAME_CONFIG.sanRules||{}).konbiniAnomaly||6;GS.change({san:-v},'便利店：收下了湿透的客人的旧钱');
  if(SETTINGS.get('anomalies'))UI.glitch('static',1600);
  s.served.push({anomaly:true,score:null});s.cur=null;s.nextWait=1500;sel=null;note(A.acceptText+'（SAN -'+v+'）',true);campaignSave();
 }
 function answer(i){
  const o=cur();if(!o||!o.reply||o.reply.done)return;const R=(KD().replies||[]).find(x=>x.id===o.reply.id);if(!R)return;
  o.reply.done=true;o.reply.ok=i===R.answer;o.reply.pick=i;
  if(o.reply.ok){JLPT.gain(null,'life');credit(o,'reply');const k=K(),id=o.reply.id;k.memory[id]=(k.memory[id]||0)+1;if(k.memory[id]===(KC().phraseMemoryCount||KC().memoryCount||3))k.auto[id]=true;sfx('ok')}else{o.pen.jpWrong=1;const hp=KC().jpWrongHp||0;if(hp)GS.change({hp:-hp});sfx('ng');note('✕ 回答得不对'+(hp?'（疲劳点 -'+hp+'）':'（评分扣分）')+'。正确：「'+R.options[R.answer]+'」'+((R.optionsZh||[])[R.answer]&&!(typeof langMode==='function'&&langMode()==='learning')?'（'+R.optionsZh[R.answer]+'）':''),true)}
  render();campaignSave();
 }
 /* 会计完了：必须完成的项目（不满足就不能结束）→ 其余失误扣分 */
 /* v25.1 操作引导：根据当前进度提示「下一步」，并让该去的地方闪一下。不替玩家判断顾客的要求（加热 / 袋子 / 付款方式要自己听）。
    文字在 data/work/konbini.json 的 guide；关闭：config 的 work.konbini.guide = false */
 function guide(o){
  if(!o||KC().guide===false)return null;const G=KD().guide||{},s=S();
  if(o.phase==='talk')return null;
  const need=o.need.find(n=>!o.items.some(x=>x.fetched&&x.id===n.id));
  if(need&&o.phase==='items')return typeof langMode==='function'&&langMode()==='learning'?{text:G.fetchLearn||'',zones:[]}:{text:G.fetch||'',zones:[need.kind==='hot'?'hotcase':'shelf']}; // 学习模式：不替玩家听懂顾客要什么
  if(o.items.some(x=>!x.anomaly&&x.state==='tray'))return {text:G.scan||'',zones:['scan']};
  if(s.mic&&s.mic.ms>0)return {text:G.micWait||'',zones:['mic']};
  if(s.mic&&s.mic.ms<=0&&o.items.some(x=>x.uid===s.mic.uid))return {text:G.micTake||'',zones:['mic']};
  if(o.items.some(x=>!x.anomaly&&x.state==='scan'&&!isExtra(o,x)))return {text:G.bag||'',zones:['bagA','bagB']};
  if(o.phase==='items')return {text:G.subtotal||'',ids:['kb-sub']};
  if(o.pay.status!=='ok')return {text:G.pay||'',ids:[]};
  return {text:G.finish||'',ids:['kb-fin']};
 }
 function blockers(o){
  const s=S(),out=[];
  if(o.phase!=='pay'||o.pay.status!=='ok')out.push('收款还没完成');
  if(o.items.some(x=>x.anomaly))out.push('柜台上有一件没见过的商品');
  if(o.items.some(x=>x.state==='mic')||(s.mic&&o.items.some(x=>x.uid===s.mic.uid)))out.push('微波炉里还有顾客的商品');
  const loose=o.items.filter(x=>!x.anomaly&&isExtra(o,x)&&!o.lines.some(l=>l.uid===x.uid)&&x.state!=='bag');
  if(o.items.some(x=>!x.anomaly&&!loose.includes(x)&&x.state!=='bag'))out.push('还有商品没装袋');
  o.need.forEach(n=>{if(!o.items.some(x=>x.fetched&&x.id===n.id))out.push('顾客要的「'+ITEM(n.id).jp+'」还没拿')});
  if(loose.length)out.push('多拿的「'+loose.map(x=>ITEM(x.id).jp).join('、')+'」要放回去');
  return out;
 }
 function isExtra(o,x){if(!x.fetched)return false;const same=o.items.filter(y=>y.fetched&&y.id===x.id);const need=o.need.filter(n=>n.id===x.id).length;return same.indexOf(x)>=need}
 function finish(){
  const s=S(),o=s&&s.cur;if(!o||o.phase==='talk')return;const b=blockers(o);if(b.length){note('还不能结束：'+b.join('；'),true);return}
  const C=KC(),P=C.penalties||{},pen=Object.assign({},o.pen),cps=[];
  const add=(k,n)=>{pen[k]=(pen[k]||0)+(n||1)};
  /* 重复扫描 / 多拿的商品 / 割引 / 袋子 */
  const seen={};o.lines.forEach(l=>{if(l.ghost)return;if(seen[l.uid]){add('duplicate');cps.push('complain_over')}seen[l.uid]=1});
  o.items.forEach(x=>{const d=itemDef(x),a=d.attrs||{};const ls=o.lines.filter(l=>l.uid===x.uid);
   if(isExtra(o,x)&&ls.length){add('extraItem');cps.push('complain_extra')}
   if(ls.length){if(a.discount&&!ls[0].disc){add('discountMissed');cps.push('complain_over')}if(!a.discount&&ls.some(l=>l.disc))add('discountWrong')}
   if(x.state==='bag'){if(a.frozen&&x.bag!=='B'){add('wrongBag');cps.push('complain_bag')}if((a.hot||x.heated)&&x.bag!=='A'){add('wrongBag');cps.push('complain_bag')}}
   if(a.heat&&o.want.heat===true&&!x.heated){add('notHeated');cps.push('complain_heat')}
   if(a.heat&&o.want.heat===false&&x.heated)add('heatedUnwanted');
   if(x.over)add('overheat');if(x.frozenHeated)add('frozenHeated');
   if(a.reserve&&x.owner&&o.owner&&x.owner.jp!==o.owner.jp&&!isExtra(o,x)){add('wrongReserve');cps.push('complain_reserve')}
  });
  if(o.bagFee!==o.want.bag)add('bagFee');
  if(o.reply&&!o.reply.done&&o.reply.at<=0)add('jpWrong'); // 顾客问了却没回答
  if(!o.wet&&o.patience/o.patienceMax<0.25)add('slow');
  let lost=0;Object.entries(pen).forEach(([k,n])=>lost+=(P[k]||0)*n);
  const score=Math.max(0,100-lost),st=(C.starAt||[40,70,90]).filter(x=>score>=x).length;
  /* 肌肉记忆：这一单里理解正确的日语 */
  const k=K(),okP=[];
  o.said.forEach(x=>{const id=x.k;if(!id||!PH(id)||!/^(heat_|bag_|pay_|hot_|reserve)/.test(id))return;
   const bad=(/^heat_/.test(id)&&(pen.notHeated||pen.heatedUnwanted))||(/^bag_/.test(id)&&pen.bagFee)||(/^pay_/.test(id)&&pen.wrongMethod)||(/^hot_/.test(id)&&(pen.extraItem))||(id==='reserve'&&pen.wrongReserve);
   if(!bad&&!okP.includes(id))okP.push(id)});
  
  const unlocked=[];okP.forEach(id=>{const before=k.memory[id]||0;k.memory[id]=before+1;if(before<(KC().phraseMemoryCount||KC().memoryCount||3)&&k.memory[id]>=(KC().phraseMemoryCount||KC().memoryCount||3))unlocked.push(id)});
  s.served.push({score,stars:st,pen,total:total(o),expected:expected(o)});if(window.OMI&&!o.npc&&!o.wet)OMI.gift('work:'+campaign.day+':'+s.n+':'+o.id);
if(window.STREET && campaign.day>=2 && campaign.day<=5 && !o.npc && !o.wet && lost>0 && Math.random()<(window.OMI?OMI.prob(.25,'hostile'):.25) && !campaign.streetConflict?.events['SC-KON-01']){STREET.begin('SC-KON-01',{managerPresent:!!o.managerPresent});setTimeout(()=>STREET.resume(),0)}
  const line=cps.length?PH(cps[0]):rnd(PH('thanks'));
  if(s.mic&&o.items.some(x=>x.uid===s.mic.uid))s.mic=null;
  /* 线索顾客：结完账先说几句话（这时班次时间暂停），说完由 KONBINI.release() 送走 */
  if(o.npc&&hook('finish',o)){o.phase='talk';sel=null;picker=null;flash='★'.repeat(st)+'☆'.repeat(3-st)+' '+score+' 分'+(unlocked.length?'　🧠 肌肉记忆解锁：'+unlocked.map(memName).join('、'):'');flashT=Date.now();sfx('ok');campaignSave();render();return}
  s.cur=null;s.nextWait=1400;sel=null;picker=null;
  say(line);flash=(line?line.jp+'｜'+line.zh+'　':'')+'★'.repeat(st)+'☆'.repeat(3-st)+' '+score+' 分'+(unlocked.length?'　🧠 肌肉记忆解锁：'+unlocked.map(memName).join('、'):'');flashT=Date.now();
  sfx(cps.length?'ng':'ok');campaignSave();render();
 }
 function memName(id){const p=PH(id);if(p&&p.jp)return '「'+fillP(p,{owner:{jp:'〇〇',zh:'〇〇'}}).jp+'」';const r=(KD().replies||[]).find(x=>x.id===id);return r?'「'+r.jp+'」':id}

 /* ---------- 结算（只做一次） ---------- */
 function settle(early,silent){
  const k=K(),s=S();if(!s||s.settled)return;s.settled=true;hook('shiftEnd',s);
  const C=KC(),WK=GAME_CONFIG.work,frac=early?Math.min(1,s.activeMs/s.shiftMs):1;
  const base=Math.round(wageFull()*frac);
  const done=s.served.filter(x=>!x.fail&&!x.anomaly),stars=done.reduce((a,x)=>a+(x.stars||0),0);
  const counted=s.served.filter(x=>!x.anomaly);const perf=counted.length?Math.round(counted.reduce((a,x)=>a+(x.score||0),0)/counted.length):0;
  /* v74：整班评星（全班平均分对照 starAt），奖金见 GAME_CONFIG.v74.stars.konbini；提前下班按工作比例；道具津贴只给正常完成的手动班 */
  const V4=GAME_CONFIG.v74||{},tier=done.length?(C.starAt||[40,70,90]).filter(x=>perf>=x).length:0;
  const bonus=Math.round((((V4.stars||{}).konbini||[0,0,0,0])[tier]||0)*frac);
  const allowance=!early&&!silent&&done.length&&window.V74?V74.allowance('konbini'):0;
  const stress=Math.round((WK.stressBase+stage()*WK.stressPerStage)*Math.max(0.5,frac))+(perf<50&&counted.length?(C.lowPerfStress||0):0);
  result={n:s.n,early,frac,base,bonus,stars,tier,allowance,perf,served:done.length,failed:s.served.filter(x=>x.fail).length,anomalies:s.served.filter(x=>x.anomaly).length,stress,customers:counted.length};
  if(!early&&done.length)k.wages[base]=Math.max(k.wages[base]||0,base+bonus);k.shift=null;if(s.served.length||!early||frac>=0.5)k.shifts=s.n;k.last=result;campaign.workedToday=(campaign.workedToday||0)+1;
  result.luck=window.OMI?OMI.wage(base+bonus):0;result.fortune=window.OMI?OMI.data.grades.find(g=>g.id===OMI.today()?.grade)?.name:null;const r=GS.change({cash:base+bonus+allowance+result.luck,stress},'便利店工资、奖金、道具津贴与当班压力');result.change=r;
  manualOpen=false;sel=null;picker=null;cancelAnimationFrame(raf);raf=0;
  if(!silent)showResult();
 }
 function showResult(){
  const R=result;if(!R){if(typeof tokyoHome==='function')tokyoHome();return}
  UI.scene('konbini',showResult);
  app.innerHTML=`<div class="rpg-shell kb-shell"><section class="rpg-panel kb-result"><div class="rpg-kicker">SHIFT ${R.n} · ${R.early?'提前下班':'下班'}</div><h1>打工结算</h1>
   <div class="et-grid"><div><small>基础工资</small><b>${yen(R.base)}${R.early?'（'+Math.round(R.frac*100)+'%）':''}</b></div><div><small>星级奖金</small><b>${yen(R.bonus)}（${R.tier==null?'★'+R.stars:R.tier?'★'.repeat(R.tier):'0 星'}${R.early&&R.tier?' · 按 '+Math.round(R.frac*100)+'%':''}）</b></div><div><small>道具津贴</small><b>${yen(R.allowance||0)}${R.allowance?'（接客研修套装）':''}</b></div><div><small>接待顾客</small><b>${R.served} 位${R.failed?' · 流失 '+R.failed+' 位':''}</b></div><div><small>绩效</small><b>${R.perf} 分</b></div>${R.anomalies?`<div><small>异常</small><b>${R.anomalies} 次</b></div>`:''}</div>
   <p class="kb-res-line">${R.luck?esc(R.fortune)+'运势奖金：+'+yen(R.luck)+'　·　':''}实发合计 <b>${yen(R.base+R.bonus+(R.allowance||0)+(R.luck||0))}</b>　·　压力 +${R.stress}　·　SAN 不变</p>
   <button type="button" class="survival-btn" id="kb-home">返回地图</button></section></div>`;
  app.querySelector('#kb-home').onclick=()=>{result=null;if(typeof tokyoHome==='function')tokyoHome()};
  window.scrollTo(0,0);
  if(!R.early&&R.served&&R.tier!=null&&window.V74)V74.senpai('konbini'); // v74：第一次完整收银班
 }
 function quitEarly(){
  const s=S();if(!s)return;const pct=Math.round(Math.min(1,s.activeMs/s.shiftMs)*100);
  UI.confirm('提前下班？','按已经工作的时间（'+pct+'%）结算基础工资和星级奖金；提前下班不发道具津贴。正在接待的顾客交给下一班。',()=>settle(true));
 }

 /* ---------- 画面 ---------- */
 function clockMin(){const s=S();if(!s)return null;return s.startClock+Math.min(1,s.activeMs/s.shiftMs)*(KC().gameMinutes||120)}
 function tokenItem(it,o){
  const d=itemDef(it),a=d.attrs||{};const cls=['kb-item'];if(sel===it.uid)cls.push('sel');if(o.lines.some(l=>l.uid===it.uid))cls.push('scanned');if(it.anomaly)cls.push('anom');
  return `<button type="button" class="${cls.join(' ')}" data-item="${it.uid}" aria-label="${esc(d.jp)}"><span class="kb-ic">${d.icon}</span><span class="kb-nm" lang="ja">${esc(d.jp)}</span>${V52KB.temp(it)}${a.discount?'<i class="kb-disc">割</i>':''}${it.heated?'<i class="kb-hot">♨</i>':''}${it.owner?'<i class="kb-own">'+esc(it.owner.jp)+'</i>':''}${o.lines.some(l=>l.uid===it.uid)?'<i class="kb-ok">✓</i>':''}</button>`;
 }
 function render(){
  if(!root||!root.isConnected)return;const s=S();if(!s){return}
  const o=s.cur,k=K(),C=KC(),n=s.n;
  queueMicrotask(()=>CH1FIX.patience(o));
  const pf=o?(window.ART?ART.portrait(custDef(o).portrait,custDef(o).palette,{worried:!o.wet&&o.patience/o.patienceMax<0.35,ghost:!!o.wet}):''):'';
  const speech=o?o.said.map(x=>{const p=phrase(x,o);if(!p)return '';const memo=x.k&&k.auto[x.k]&&p.memo?`<em class="kb-memo">🧠 ${esc(p.memo)}</em>`:'';return `<div class="kb-say">${lang(p)}${memo}</div>`}).join(''):'';
  const R=o&&o.reply&&o.reply.at<=0?(KD().replies||[]).find(x=>x.id===o.reply.id):null;
  const reply=R?`<div class="kb-reply"><div class="kb-say q">${lang(R)}</div>${o.reply.done?`<div class="kb-said">店员：「${esc(R.options[o.reply.auto?R.answer:o.reply.pick])}」${optZh(R,o.reply.auto?R.answer:o.reply.pick)}${o.reply.ok?' ✓':' ✕'}</div>`:R.options.map((t,i)=>`<button type="button" class="kb-opt" data-reply="${i}" lang="ja">${esc(t)}</button>`).join('')}</div>`:'';
  const pay=o&&o.phase==='pay'?o.pay:null;
  const tokens=o&&pay?(pay.method==='ic'&&pay.status!=='ok'?'<button type="button" class="kb-token" data-item="card">💳 IC</button>':pay.method==='qr'&&pay.status!=='ok'?'<button type="button" class="kb-token" data-item="phone">📱 QR</button>':pay.status==='cash'?`<span class="kb-cash">${o.wet?'🪙 '+esc(KD().anomalies.customer.coin):'💴 '+yen(pay.recv)}</span>`:''):'';
  const counter=o?o.items.filter(x=>x.state==='tray'||x.state==='scan'):[];
  const bagged=b=>o?o.items.filter(x=>x.state==='bag'&&x.bag===b):[];
  const m=s.mic,mi=m&&findItem(m.uid);
  const left=Math.max(0,s.shiftMs-s.activeMs);
  const linesHtml=o?o.lines.map(l=>{const it=o.items.find(x=>x.uid===l.uid);const d=l.ghost?KD().anomalies.item:it?itemDef(it):{jp:'—'};const p=l.ghost?0:priceOf(l,o);const base=l.ghost?0:(d.price||0);
   return `<li class="${l.ghost?'ghost':''}"><span lang="ja">${esc(l.ghost?d.posLine:d.jp)}</span><b>${p!==base?'<s>'+yen(base)+'</s> ':''}${yen(p)}</b>${o.phase==='items'&&!l.ghost&&n>=3?`<button type="button" class="kb-mini${l.disc?' on':''}" data-disc="${l.lid}">割</button>`:''}${o.phase==='items'?`<button type="button" class="kb-mini x" data-void="${l.lid}" aria-label="取消">✕</button>`:''}</li>`}).join(''):'';
  const t=o?total(o):0;
  const blocked=o&&o.phase==='pay'&&pay.status==='ok'?blockers(o):['x'];
  const chg=pay&&pay.status==='cash'&&pay.entered!=null&&!o.wet?pay.entered-t:null;
  const flashOn=flash&&Date.now()-flashT<6000;
  const gd=guide(o),nz=z=>gd&&(gd.zones||[]).includes(z)?' kb-next':'',ni=id=>gd&&(gd.ids||[]).includes(id)?' kb-next':'';
  root.innerHTML=`
  <div class="kb-top">
   <div class="kb-cust">${o?`<span class="kb-pfring${o.wet?' wet':''}" id="kb-ring" role="img" aria-label="顾客耐心" data-lv="${V52KB.lv(o.patience/o.patienceMax)}" style="--p:${Math.max(0,o.patience/o.patienceMax*100)}%"><img class="kb-pf" src="${pf}" alt=""></span><div class="kb-cust-main"><div class="kb-cust-name">${esc(custDef(o).name||'')}${o.wet?'':` <span class="kb-pat"><i id="kb-pat" style="width:${Math.max(0,o.patience/o.patienceMax*100)}%"></i></span>`}</div>${speech}${reply}<div class="kb-tokens">${tokens}${hook('tokens',o)||''}</div>${hook('custExtra',o)||''}</div>`:`<div class="kb-cust-main"><div class="kb-say"><small>${s.timeUp?'下班时间到了。':s.queue.length?'下一位顾客……':'现在没有顾客。'}</small></div></div>`}</div>
   <div class="kb-stat"><div>⏱ <b id="kb-left">${fmtLeft(left)}</b></div><div>🧍 排队 <b>${s.queue.length}</b></div><div>✓ <b>${s.served.filter(x=>!x.fail&&!x.anomaly).length}</b></div><div><small>SHIFT ${n}</small></div></div>
  </div>
  <p class="kb-flash" id="kb-flash" ${flashOn?'':'hidden'}>${esc(flashOn?flash:'')}</p>
  ${V52KB.steps(o,gd,n)}
  <div class="kb-bench"><i class="kb-arrow a1" aria-hidden="true">→</i><i class="kb-arrow a2" aria-hidden="true">→</i>
   <div class="kb-dev">
    <button type="button" class="kb-zone kb-mic${nz('mic')}${m?(m.ms>0?' run':' done'):''}${m&&m.overFlag?' over':''}" data-zone="mic"><span>📟 電子レンジ</span><b id="kb-mic">${m?(m.ms>0?Math.ceil(m.ms/1000)+'s':'チン！'):'空'}</b>${mi?`<small>${itemDef(mi).icon} ${esc(itemDef(mi).jp)}</small>`:''}</button>
    ${n>=2?`<button type="button" class="kb-zone${nz('hotcase')}" data-zone="hotcase"><span>🔥 ホットケース</span><small>热柜</small></button>`:''}
    ${n>=4?`<button type="button" class="kb-zone${nz('shelf')}" data-zone="shelf"><span>🎁 予約棚</span><small>预订架</small></button>`:''}
    ${n>=(C.anomalyFromShift??1)?`<button type="button" class="kb-zone kb-bin" data-zone="bin"><span>🗑 廃棄箱</span></button>`:''}
   </div>
   <div class="kb-center">
    <button type="button" class="kb-zone kb-scan${nz('scan')}" data-zone="scan"><span>▣ スキャナー</span><small>拖到这里扫描</small></button>
    <div class="kb-zone kb-counter" data-zone="counter"><span class="kb-zlabel">🧺 托盘 · 顾客的商品</span><div class="kb-tray">${counter.map(x=>tokenItem(x,o)).join('')||'<small class="kb-empty">（空）</small>'}</div></div>
   </div>
   <div class="kb-pos">
    <div class="kb-pos-head">POS<span>${o?(o.phase==='pay'?'お会計':'登録中'):'—'}</span></div>
    <ul class="kb-lines">${linesHtml||'<li class="empty">—</li>'}</ul>
    ${o&&n>=2?`<button type="button" class="kb-mini wide${o.bagFee?' on':''}" id="kb-bag" ${o.phase!=='items'?'disabled':''}>レジ袋 ${yen(C.bagFee||3)}</button>`:''}
    ${ordinary(o)&&trained('bag')&&o.items.some(i=>plain(i)&&i.state==='scan')?'<button class="kb-mini" id="kb-bag-fast">装好普通商品</button>':''}
    ${ordinary(o)&&trained('pay')&&pay&&pay.status==='cash'?'<button class="kb-mini" id="kb-change-fast">按实收备齐找零</button>':''}<div class="kb-total">合計 <b>${yen(t)}</b></div>
    ${o&&o.phase!=='talk'?`<button type="button" class="survival-btn alt kb-sub${ni('kb-sub')}" id="kb-sub" ${o.phase==='pay'&&pay.status==='ok'?'disabled':''}>${o.phase==='items'?'小計（收款）':'戻る（修改商品）'}</button>`:''}
    ${o&&o.phase==='pay'?`<div class="kb-paybtns">${['cash','ic','qr'].map(x=>`<button type="button" class="kb-mini${pay.method===x?' on':''}" data-pay="${x}" ${pay.status==='ok'?'disabled':''}>${{cash:'💴 現金',ic:'💳 IC',qr:'📱 QR'}[x]}</button>`).join('')}</div>
     <div class="kb-devices"><button type="button" class="kb-zone kb-reader${pay.method==='ic'&&pay.status==='wait'?' wait':''}" data-zone="reader">IC リーダー</button><button type="button" class="kb-zone kb-qr${pay.method==='qr'&&(pay.status==='wait'||pay.status==='fail')?' wait':''}" data-zone="qr">QR スキャナー${pay.status==='fail'?'<small>再試行</small>':''}</button></div>
     ${pay.status==='cash'?`<div class="kb-cashbox"><div class="kb-row"><small>お預かり</small>${[1000,2000,5000,10000].map(v=>`<button type="button" class="kb-mini${pay.entered===v?' on':''}" data-enter="${v}">${yen(v)}</button>`).join('')}<button type="button" class="kb-mini${pay.entered===t&&pay.entered!=null?' on':''}" data-enter="exact">ちょうど</button></div>
      ${pay.entered!=null?`<div class="kb-row"><small>お釣り</small><b id="kb-chg">${o.wet?'？？？':yen(chg)}</b></div><div class="kb-row kb-drawer">${[1,5,10,50,100,500,1000,5000].map(v=>`<button type="button" class="kb-coin" data-coin="${v}">${v>=1000?yen(v):v}</button>`).join('')}</div><div class="kb-row"><small>找零托盘</small><b>${yen(pay.tray.reduce((a,b)=>a+b,0))}</b><button type="button" class="kb-mini" id="kb-clr">クリア</button><button type="button" class="kb-mini on" id="kb-give">お釣りを渡す</button></div>`:''}
      <button type="button" class="kb-mini wide kb-refuse" id="kb-refuse" lang="ja">${esc(KD().anomalies.customer.refuseLine.jp)}</button></div>`:''}`:''}
    ${o&&o.phase!=='talk'?`<button type="button" class="survival-btn kb-fin${ni('kb-fin')}" id="kb-fin" ${blocked.length?'aria-disabled="true"':''}>会計完了</button>`:''}
   </div>
  <div class="kb-bags">
   <div class="kb-bags-head">📦 装袋（❄ 冷的放 B）</div>
   <div class="kb-zone kb-bag${nz('bagA')}" data-zone="bagA"><span>🛍 A · 常温・温かい物</span><small class="kb-bagzh">常温 / 热的</small><div>${bagged('A').map(x=>tokenItem(x,o)).join('')||'<small class="kb-drop">放到这里</small>'}</div></div>
   <div class="kb-zone kb-bag cold${nz('bagB')}" data-zone="bagB"><span>🧊 B · 冷たい物</span><small class="kb-bagzh">冷的 / 冷冻</small><div>${bagged('B').map(x=>tokenItem(x,o)).join('')||'<small class="kb-drop">放到这里</small>'}</div></div>
  </div>
  </div>
  <div class="kb-info" id="kb-info">${infoHtml()}</div>
  <div class="kb-foot"><button type="button" class="survival-btn alt" id="kb-manual">📘 工作手册</button><button type="button" class="survival-btn alt" id="kb-quit">${s.timeUp?'下班结算':'提前下班'}</button><small>拖动商品，或者先点商品再点目的地。</small></div>
  ${picker?pickerHtml():''}
  ${manualOpen?manualHtml():''}`;
 }
 function fmtLeft(ms){const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
 function infoHtml(){
  const o=cur();if(!o||!sel)return '<small>点一下商品可以看标签。</small>';
  const it=o.items.find(x=>x.uid===sel);if(!it)return '';const d=itemDef(it),a=d.attrs||{};
  const tags=[];if(a.heat)tags.push('要加热 '+a.heat+' 秒（600W）');if(a.frozen)tags.push('冷冻品');if(a.hot)tags.push('热食');if(a.discount)tags.push('割引シール −'+Math.round(a.discount*100)+'%');if(it.owner)tags.push('予約：'+it.owner.jp+' 様');if(it.anomaly)tags.push(d.label);if(it.heated)tags.push('已加热');if(it.over)tags.push('加热过头');
  return `<b>${d.icon} <span lang="ja">${esc(d.jp)}</span></b> ${typeof langMode==='function'&&langMode()==='learning'?trToggle(d.zh):'<small>'+esc(d.zh)+'</small>'} <b>${it.anomaly?'¥？':yen(d.price)}</b>${tags.length?'<br><small>'+tags.map(esc).join(' · ')+'</small>':''}`;
 }
 function pickerHtml(){
  const o=cur();if(!o)return '';
  if(picker==='hotcase')return `<div class="kb-pop" role="dialog"><b>🔥 ホットケース（热柜）</b>${['karaage','nikuman'].map(id=>`<button type="button" class="kb-mini wide" data-fetch="hot:${id}">${ITEM(id).icon} ${esc(ITEM(id).jp)} ${yen(ITEM(id).price)}</button>`).join('')}<button type="button" class="kb-mini" data-fetch="close">关闭</button></div>`;
  const D=KD(),correct=o.owner,others=D.owners.filter(x=>!correct||x.jp!==correct.jp).slice(0,2),list=(correct?[correct,...others]:D.owners.slice(0,3)).sort((a,b)=>a.jp.localeCompare(b.jp));
  return `<div class="kb-pop" role="dialog"><b>🎁 予約棚（预订架）</b>${list.map((w,i)=>`<button type="button" class="kb-mini wide" data-fetch="shelf:${i}" lang="ja">🎂 No.${i+1}　${esc(w.jp)} 様</button>`).join('')}<button type="button" class="kb-mini" data-fetch="close">关闭</button></div>`;
 }
 function manualHtml(){
  const k=K(),n=shiftNo(),C=KC(),rs=rulesFor(n);
  const mem=Object.entries(k.memory).filter(([id,c])=>c>=(KC().phraseMemoryCount||KC().memoryCount||3));
  return `<div class="kb-manual" role="dialog" aria-label="工作手册"><div class="kb-manual-in"><div class="rpg-kicker">WORK MANUAL · SHIFT ${n}（看手册时时间暂停）</div><h2>📘 工作手册</h2>
   <ol>${rs.map(r=>`<li class="${r.shift===n?'new':''}${r.anomaly?' anom':''}"><span lang="ja">${esc(r.jp)}</span>${typeof langMode==='function'&&langMode()==='learning'?trToggle(r.zh):'<small>'+esc(r.zh)+'</small>'}${r.shift===n&&n>1?' <em>NEW</em>':''}</li>`).join('')}</ol>
   <p class="survival-tip">操作：把商品拖到扫描器 → 需要的话放进微波炉 → POS「小計」→ 按顾客说的方式收款 → 装袋 →「会計完了」。拖不动的时候：先点商品，再点目的地。</p>
   <h3>🧠 肌肉记忆</h3>${Object.entries(skills).map(([id,[label,help]])=>`<p>${label} · ${k.moves[id]||0} 次　${trained(id)?'已掌握':'达到 '+(C.memoryCount||3)+' 次'}：${help}</p>`).join('')}${mem.length?mem.map(([id])=>`<label class="kb-memrow"><input type="checkbox" data-auto="${esc(id)}" ${k.auto[id]?'checked':''}> <span lang="ja">${esc(memName(id))}</span> <small>自动完成</small></label>`).join(''):`<p class="survival-tip">同一句日语理解正确 ${(KC().phraseMemoryCount||KC().memoryCount||3)} 次，就会记住它；之后可以选择让它自动完成。</p>`}
   <button type="button" class="survival-btn" id="kb-manual-close">回到工作台</button></div></div>`;
 }
 function tickUI(){
  if(!root)return;const s=S();if(!s)return;const o=s.cur;
  const l=root.querySelector('#kb-left');if(l)l.textContent=fmtLeft(Math.max(0,s.shiftMs-s.activeMs));
  const p=root.querySelector('#kb-pat');if(p&&o)p.style.width=Math.max(0,o.patience/o.patienceMax*100)+'%';const rg=root.querySelector('#kb-ring');if(rg&&o){const r=Math.max(0,o.patience/o.patienceMax);rg.style.setProperty('--p',(r*100)+'%');rg.dataset.lv=V52KB.lv(r);rg.setAttribute('aria-label','顾客耐心 '+Math.ceil(r*100)+'%')}
  const m=root.querySelector('#kb-mic');if(m&&s.mic&&s.mic.ms>0)m.textContent=Math.ceil(s.mic.ms/1000)+'s';
  const f=root.querySelector('#kb-flash');if(f&&!f.hidden&&Date.now()-flashT>6000)f.hidden=true;
  if(Date.now()-topT>500){topT=Date.now();UI.update()}
 }
 let topT=0;

 /* ---------- 输入：拖拽 + 点击 ---------- */
 let bound=false;
 function bind(){
  if(!bound){bound=true;winBind()}
  root.addEventListener('pointerdown',e=>{
   const t=e.target.closest('[data-item]');if(!t||e.button>0)return;
   drag={uid:t.dataset.item,x:e.clientX,y:e.clientY,el:t,ghost:null,moved:false,id:e.pointerId};
  });
  root.addEventListener('click',onClick);
 }
 function winBind(){
  window.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.id)return;
   if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
   if(!drag.moved){drag.moved=true;const g=drag.el.cloneNode(true);g.classList.add('kb-ghost');document.body.appendChild(g);drag.ghost=g;drag.el.classList.add('dragging')}
   drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
   const z=zoneAt(e.clientX,e.clientY);root.querySelectorAll('.kb-zone.hover').forEach(x=>x.classList.remove('hover'));if(z)z.classList.add('hover');
   e.preventDefault();
  },{passive:false});
  window.addEventListener('pointerup',e=>{
   if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;
   if(d.ghost)d.ghost.remove();if(root)root.querySelectorAll('.kb-zone.hover').forEach(x=>x.classList.remove('hover'));
   if(d.moved){const z=zoneAt(e.clientX,e.clientY);suppress=Date.now();if(z)drop(d.uid,z.dataset.zone);else render()}
  });
  window.addEventListener('pointercancel',()=>{if(drag&&drag.ghost)drag.ghost.remove();drag=null});
 }
 function onClick(e){{
   if(Date.now()-suppress<300)return;
   const b=e.target.closest('button,[data-zone],input');if(!b)return;
   if(b.matches('.tr-btn'))return;
   if(b.dataset.npc!=null){hook('click',b.dataset.npc,cur());return}
   if(b.id==='kb-bag-fast'){const o=cur();if(ordinary(o)&&trained('bag'))for(const it of o.items)if(plain(it)&&it.state==='scan')drop(it.uid,'bagA');return}
   if(b.id==='kb-change-fast'){const o=cur();if(ordinary(o)&&trained('pay')&&o.pay.status==='cash'){o.pay.entered=o.pay.recv;o.pay.tray=[o.pay.recv-total(o)];render()}return}
   if(b.dataset.item){const u=b.dataset.item;const o=cur(),it=o&&findItem(u);if(ordinary(o)&&trained('scan')&&it&&plain(it)&&it.state==='tray'&&o.phase==='items'){drop(u,'scan');return}if(u==='card'||u==='phone'){sel=sel===u?null:u;render();return}sel=sel===u?null:u;render();return}
   if(b.dataset.zone){zoneClick(b.dataset.zone);return}
   if(b.dataset.reply!=null){answer(+b.dataset.reply);return}
   if(b.dataset.void){voidLine(b.dataset.void);return}
   if(b.dataset.disc){toggleDisc(b.dataset.disc);return}
   if(b.dataset.pay){choose(b.dataset.pay);return}
   if(b.dataset.enter){enter(b.dataset.enter==='exact'?'exact':+b.dataset.enter);return}
   if(b.dataset.coin){coin(+b.dataset.coin);return}
   if(b.dataset.fetch){const v=b.dataset.fetch;if(v==='close'){picker=null;render();return}const [kind,x]=v.split(':');if(kind==='hot')fetch('hot',x);else{const o=cur(),D=KD(),correct=o.owner,others=D.owners.filter(w=>!correct||w.jp!==correct.jp).slice(0,2),list=(correct?[correct,...others]:D.owners.slice(0,3)).sort((a,b)=>a.jp.localeCompare(b.jp));fetch('shelf','cake',list[+x])}return}
   if(b.dataset.auto){K().auto[b.dataset.auto]=b.checked;campaignSave();return}
   ({'kb-bag':toggleBag,'kb-sub':subtotal,'kb-clr':clearTray,'kb-give':giveChange,'kb-refuse':refuse,'kb-fin':finish,'kb-manual':()=>{manualOpen=true;render()},'kb-manual-close':()=>{manualOpen=false;render()},'kb-quit':()=>{if(S().timeUp&&!S().cur&&(K().introDone||S().introAppeared))settle(false);else quitEarly()}}[b.id]||(()=>{}))();
 }}
 let suppress=0;
 function zoneAt(x,y){const el=document.elementFromPoint(x,y);const z=el&&el.closest&&el.closest('[data-zone]');return z&&root&&root.contains(z)?z:null}

 /* ---------- 入口 ---------- */
 function intro(){
  if(!campaign)return;if(S()){open();return}
  const k=K(),n=k.shifts+1,nr=rulesFor(n).filter(r=>r.shift===n);
  UI.scene('konbini',intro);
  app.innerHTML=`<div class="rpg-shell kb-shell"><section class="rpg-panel kb-intro"><div class="rpg-kicker">PART-TIME JOB · SHIFT ${n}</div><h1 lang="ja">${esc((KD().store||{}).jp||'')}</h1><p class="pro-zh">${esc((KD().store||{}).zh||'')}</p>
   <p>便利店收银：扫描、加热、收款、装袋。一次打工约 ${Math.round((KC().shiftSeconds||240)/60)} 分钟（游戏内 ${Math.round((KC().gameMinutes||120)/60)} 小时）。手动班次可练习操作、遇见特殊顾客并刷新工资纪录。快速班次按当前基础工资档的手动最高纪录结算。基础工资 ${yen(wageFull())}。整班评星（全班平均 ${(KC().starAt||[40,70,90]).join(' / ')} 分）另发星级奖金：${window.V74?V74.starText('konbini'):''}。</p>
   ${nr.length&&n>1?`<p class="survival-tip">这次会学到新的工作规则（${nr.length} 条）。</p>`:''}
   <div class="kb-intro-btns"><button type="button" class="survival-btn" id="kb-start">▶ 手动打工（消耗 1 次行动）</button><button type="button" class="survival-btn alt" id="kb-quick" ${record()?'':'disabled'}>⏩ 快速打工 · ${record()?yen(record()):Object.keys(k.wages).length?'请先完成当前工资档的手动班次':'请先完成一次手动打工，解锁快速打工。'}</button>${window.V74?V74.kitButton('konbini'):''}<button type="button" class="survival-btn alt" id="wh-job">湾岸物流仓库 · 分拣岗位</button><button type="button" class="survival-btn alt" id="kb-back">返回</button></div></section></div>`;
  app.querySelector('#kb-start').onclick=startShift;
  app.querySelector('#kb-quick').onclick=()=>{if(quickWork)quickWork()};
  app.querySelector('#wh-job').onclick=WAREHOUSE.intro;if(window.V74)V74.bindKit(app,'konbini');app.querySelector('#kb-back').onclick=()=>{if(typeof tokyoHome==='function')tokyoHome()};
  window.scrollTo(0,0);
 }
 function setQuick(f){quickWork=f}
 function release(){const s=S();if(!s||!s.cur)return;s.cur=null;s.nextWait=1400;sel=null;picker=null;campaignSave();render()}
 /* 给扩展模块用：按指定的商品和要求生成一位顾客 */
 function buildOrder(sp){
  const s=S(),o={id:++s.seq,tpl:sp.tpl||'npc',cust:sp.cust||'npc',npc:sp.npc||null,npcView:sp.view||null,items:(sp.items||[]).map(id=>mk(id)),need:[],want:Object.assign({heat:null,bag:false,pay:'cash'},sp.want||{}),lines:[],bagFee:false,phase:'items',pay:{method:null,status:'none',recv:0,entered:null,tray:[]},pen:{},said:(sp.said||[]).slice(),memo:[],hurried:0};
  if(!o.items.some(x=>(attrs(x)||{}).heat))o.want.heat=null;
  if(S().n<2)o.want.bag=false;
  o.patienceMax=o.patience=patienceMs({patience:sp.patience||1.5},o.items.length,false);
  if(ordinary(o)&&o.want.bag&&K().auto.bag_yes)o.bagFee=true;
  return o;
 }
 return {use:h=>HOOKS.push(h),release,buildOrder,itemDef:id=>ITEM(id),note,sfx,say:l=>{say(l);render()},intro,start:startShift,open,settle,active:()=>!!S(),state:S,clock:clockMin,setQuick,drop,zoneClick,finish,blockers:()=>cur()?blockers(cur()):[],expected:()=>cur()?expected(cur()):0,total:()=>cur()?total(cur()):0,step:ms=>{if(!paused())step(ms)},paused,render};
})();
window.KONBINI=KONBINI;
const WAREHOUSE=(()=>{
/* ==== warehouse scene presentation (wh2) ==== */
 const WH_ART_DAY='./assets/99-konbini/b7cc47e4fbeaf9d9.webp',WH_ART_NIGHT='./assets/99-konbini/0a6d824215762a92.webp';
 const WHZ_DAY={beltY:.505,spawnX:.105,gateX:.302,gate:[.252,.355,.105,.305],plat:[.668,.52],
  chutes:[{rect:[.63,.145,.245,.305],tgt:[.678,.368],col:'#57a7e8'},{rect:[.712,.415,.243,.18],tgt:[.895,.5],col:'#63c96b'},{rect:[.662,.53,.285,.36],tgt:[.882,.782],col:'#f0a13e'}],
  packs:[{rect:[.205,.79,.18,.2],col:'#ffd166'},{rect:[.105,.085,.27,.205],col:'#9fd8ef'},{rect:[.54,.81,.095,.095],col:'#e8e3d5'}],
  anchors:{door:{rect:[.004,.325,.088,.27],c:[.048,.46]},truck:{rect:[.004,.615,.117,.335],c:[.062,.782]},room:{rect:[.643,.082,.048,.118],c:[.667,.141]},box:{rect:[.75,.878,.246,.117],c:[.873,.937]}}};
 const WHZ_NIGHT={beltY:.478,spawnX:.125,gateX:.262,gate:[.212,.345,.105,.285],plat:[.683,.48],
  chutes:[{rect:[.728,.14,.23,.305],tgt:[.92,.215],col:'#57a7e8'},{rect:[.742,.4,.218,.15],tgt:[.92,.475],col:'#63c96b'},{rect:[.728,.495,.238,.295],tgt:[.922,.728],col:'#f0a13e'}],
  packs:[{rect:[.242,.652,.12,.18],col:'#ffd166'},{rect:[.148,.058,.218,.163],col:'#9fd8ef'},{rect:[.393,.638,.068,.195],col:'#e8e3d5'}],
  anchors:{door:{rect:[.024,.372,.128,.218],c:[.088,.48]},truck:{rect:[.038,.582,.082,.268],c:[.079,.716]},room:{rect:[.72,.058,.042,.078],c:[.741,.097]},box:{rect:[.713,.692,.262,.283],c:[.844,.833]}}};
 let curZ=WHZ_DAY;
 function whIsNight(){try{const n=TM.now()%1440;return n>=1080||n<300}catch(_){return false}}
 function whPick(){return whIsNight()?WHZ_NIGHT:WHZ_DAY}
 if(!document.getElementById('wh2-style')){const st=document.createElement('style');st.id='wh2-style';st.textContent=`
.wh-panel .wh-scene{position:relative;border:2px solid #778781;margin:.5rem 0;overflow:hidden;background:#0d141b;line-height:0}
.wh-panel .wh-scene-in{position:relative;transition:transform .45s ease}
.wh-panel .wh-art{display:block;width:100%;height:auto}
.wh-panel .wh-scene canvas{position:absolute;inset:0;width:100%;height:100%;border:0;margin:0;pointer-events:none}
.wh-panel .wh-hots{position:absolute;inset:0}
.wh-panel button.wh-hot{position:absolute;min-height:0;padding:0;margin:0;background:transparent;border:2px solid transparent;border-radius:10px;opacity:0;pointer-events:none;cursor:pointer}
.wh-panel button.wh-hot.on{opacity:1;pointer-events:auto;border-color:var(--hc,#ffd166);box-shadow:inset 0 0 22px rgba(255,209,102,.25);animation:whPulse 1.15s ease-in-out infinite}
.wh-panel button.wh-hot.sel{animation:none;box-shadow:inset 0 0 26px rgba(255,209,102,.45)}
@keyframes whPulse{50%{box-shadow:inset 0 0 34px rgba(255,209,102,.5)}}
.wh-panel section.wh-slip{position:absolute;top:8px;left:8px;z-index:3;max-width:64%;background:#f3ecd9;color:#2b2118;border-left:4px solid #b23a2e;box-shadow:0 4px 14px rgba(0,0,0,.55);padding:.35rem .6rem;line-height:1.45}
.wh-panel section.wh-slip p{margin:.1rem 0}
.wh-panel [data-skills]{display:inline-flex;gap:4px}
.wh-panel .wh-sk{font-size:.72rem;border:1px solid #5b6a72;border-radius:20px;padding:1px 8px;color:#9fb0b8}
.wh-panel .wh-sk.on{color:#ffe1a0;border-color:#c9a86a;background:#3a2f16}
.wh-panel.wh-bg{background-image:linear-gradient(rgba(15,21,27,.9),rgba(15,21,27,.95)),var(--whbg);background-size:cover;background-position:center}`;document.head.appendChild(st)}
 function shellBg(c){shell(c);root.classList.add('wh-bg');root.style.setProperty('--whbg','url("'+(whIsNight()?WH_ART_NIGHT:WH_ART_DAY)+'")')}
 function setupScene(){curZ=whPick();const img=root.querySelector('.wh-art');if(img)img.src=whIsNight()?WH_ART_NIGHT:WH_ART_DAY;const box=root.querySelector('.wh-hots');if(!box)return;
  const mk=(k,w,rect,col)=>{const b=document.createElement('button');b.type='button';b.className='wh-hot';b.dataset.w=w;b.dataset.k=k;b.style.left=rect[0]*100+'%';b.style.top=rect[1]*100+'%';b.style.width=rect[2]*100+'%';b.style.height=rect[3]*100+'%';if(col)b.style.setProperty('--hc',col);box.appendChild(b)};
  mk('gate','scan',curZ.gate,'#ffe9a8');curZ.chutes.forEach((c,i)=>mk('zone'+i,'zone'+i,c.rect,c.col));curZ.packs.forEach((c,i)=>mk('pack'+i,'pack'+i,c.rect,c.col));
  mk('door','look',curZ.anchors.door.rect,'#ffd166');mk('truck','look',curZ.anchors.truck.rect,'#ffd166');mk('box','look',curZ.anchors.box.rect,'#ffb35c');mk('room','hold',curZ.anchors.room.rect,'#ff9a8a');
  root.querySelector('.wh-scene').addEventListener('click',sceneTap)}
 function sceneTap(e){if(e.target.closest('[data-w]'))return;const s=shift();if(!s||blocked()||s.closing)return;const sc=root.querySelector('.wh-scene');if(!sc)return;const r=sc.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height,ev=s.event;
  if(ev&&['door','truck'].includes(ev.id)){const a=curZ.anchors[ev.id].rect;if(fx>=a[0]&&fx<=a[0]+a[2]&&fy>=a[1]&&fy<=a[1]+a[3])action('look');return}
  if(!ev)action('scan')}
 function syncScene(s){if(!root||!curZ)return;const sk=root.querySelector('[data-skills]');if(sk){const mm=data().skill;sk.innerHTML=[['scan','扫描'],['sort','分拣'],['pack','包装']].map(([k,l])=>'<span class="wh-sk'+(mm[k]>=level?' on':'')+'">'+l+' '+mm[k]+'</span>').join('')}
  const inEl=root.querySelector('.wh-scene-in'),e=s.event,p=s.item;
  if(inEl){if(e&&e.look&&['door','truck'].includes(e.id)){const a=curZ.anchors[e.id];inEl.style.transformOrigin=((a.rect[0]+a.rect[2]/2)*100)+'% '+((a.rect[1]+a.rect[3]/2)*100)+'%';inEl.style.transform='scale(1.55)'}else inEl.style.transform=''}
  const act=new Set();
  if(!blocked()&&!s.closing){if(e){if(e.id==='room'){act.add('room');act.add('zone0');act.add('zone1');act.add('zone2')}else act.add(e.id)}else if(p.phase==='scan')act.add('gate');else if(p.phase==='sort'){act.add('zone0');act.add('zone1');act.add('zone2')}else if(p.phase==='confirm')act.add('zone'+p.z);else if(p.phase==='pack'){act.add('pack0');act.add('pack1');act.add('pack2')}}
  root.querySelectorAll('.wh-hot').forEach(b=>{const k=b.dataset.k;b.classList.toggle('on',act.has(k));b.classList.toggle('sel',!!(p&&p.phase==='confirm'&&k==='zone'+p.z))})}
 const duration=90000,level=8,zones=['A','B','C'],routes=['城東 · 城东','都心 · 市中心','城西 · 城西'];
 const areas=[['江東区','墨田区'],['港区','中央区'],['杉並区','中野区']];
 const packs=[['取扱注意','小心轻放','加缓冲垫'],['冷蔵','冷藏','送入冷藏台'],['天地無用','禁止倒置','直立固定']];
 const names={door:'无人开启的卷帘门',room:'没有地址的502号室',truck:'货厢中的敲击声',box:'不明木箱'};
 let root,raf,last,saveAt,paused=false,unfocused=false;
 const data=()=>campaign.warehouse??={shifts:0,best:0,skill:{scan:0,sort:0,pack:0},seen:{},records:{}};
 const shift=()=>campaign?.warehouse?.active;
 const sound=n=>window.AUDIO?.sfx(n);
 const base=()=>Math.max(GAME_CONFIG.work.minIncome,GAME_CONFIG.work.baseIncome-GAME_CONFIG.work.incomeDropPerStage*invasionStage());
 const btn=(id,text,disabled=false)=>'<button type="button" class="story-btn" data-w="'+id+'" '+(disabled?'disabled':'')+'>'+text+'</button>';
 function shell(content){app.innerHTML='<div class="rpg-shell wh-shell"><section class="rpg-panel wh-panel">'+content+'</section></div>';root=app.querySelector('.wh-panel');root.onclick=click}
 function intro(){if(shift()){open();return}UI.scene('warehouse',intro);const w=data();shellBg('<small>湾岸配送センター　夜間・日中受付</small><h1>湾岸物流仓库</h1><p>每班 90 秒。扫条码，按配送代码送往 A、B、C 区。有运输标签时，再按要求包装。切到后台或翻手册会暂停计时。</p><p>每班消耗 1 次行动。基础工资 ¥'+base()+'，每件 ¥15（最多 ¥300），准确率奖励最多 ¥120，每次失误扣 ¥8（最多 ¥120）。提前离岗放弃本班工资。</p>'+manual()+btn('start','手动仓库打工')+btn('quick',w.shifts?'快速打工 · ¥'+w.best:'请先完成一次手动仓库打工。',!w.shifts)+(window.V74?V74.kitButton('warehouse'):'')+btn('home','返回地图'));if(window.V74)V74.bindKit(root,'warehouse')}
 function manual(){const m=data().skill;return '<details><summary>工作手册 · 肌肉记忆</summary><p>A / 城东　B / 市中心　C / 城西。条码开头对应分拣区。取扱注意用缓冲垫，冷蔵走冷藏台，天地無用须直立。</p>'+[['scan','扫描','普通单到位即读码'],['sort','分拣','普通单直送，省去放行确认'],['pack','包装','提供符合标签的一键包装']].map(([k,label,h])=>'<p>'+label+' '+m[k]+' 次 · '+(m[k]>=level?'已掌握':'满 '+level+' 次解锁')+'　'+h+'</p>').join('')+'</details>'}
 function start(){if(shift())return open();if(window.KONBINI?.active()||!spendAction('work'))return;const w=data(),r=Math.random();w.active={day:campaign.day,elapsed:0,base:base(),done:0,errors:0,correct:0,serial:0,message:'第一件包裹正送往扫码台。',plan:r<.13?'door':r<.25?'room':r<.35?'truck':r<.38?'box':null,at:2+Math.floor(Math.random()*3)};parcel();campaignSave();open()}
 function parcel(){const s=shift(),w=data(),id=++s.serial,z=Math.floor(Math.random()*3),special=Math.random()<(w.shifts>0 ? .34 : .18)?Math.floor(Math.random()*3):-1;
  const due=s.plan&&!s.used&&(s.plan==='truck'?s.elapsed>=duration*.55&&s.done>0:id>=s.at);
  const anomaly=due?s.plan:null;if(due)s.used=true;
  s.item={id,z,address:areas[z][Math.floor(Math.random()*2)],code:zones[z]+'-'+String(10+Math.floor(Math.random()*89)),special,anomaly,phase:'in',since:s.elapsed};
  if(anomaly==='truck'){encounter('truck');s.event={id:'truck',since:s.elapsed};sound('knock')}
 }
 function encounter(id){const w=data();w.seen[id]=(w.seen[id]||0)+1}
 function record(id){const w=data();if(w.records[id])return;w.records[id]={day:campaign.day};window.FILES?.addAnomaly('warehouse-'+id,names[id],'湾岸物流仓库')}
 function accuracy(s){return s.correct+s.errors?Math.round(100*s.correct/(s.correct+s.errors)):0}
 function stress(){return GAME_CONFIG.work.stressBase+invasionStage()*GAME_CONFIG.work.stressPerStage}
 function settle(){const s=shift();if(!s||s.elapsed<duration)return;const w=data(),rate=accuracy(s),piece=Math.min(300,s.done*15),bonus=s.done?Math.round(120*rate/100):0,loss=Math.min(120,s.errors*8),total=s.base+piece+bonus-loss,allowance=s.done&&window.V74?V74.allowance('warehouse'):0;
  w.last={base:s.base,done:s.done,rate,piece,bonus,loss,total,allowance};if(s.done){w.shifts++;w.best=Math.max(w.best,total)}
  delete w.active;campaign.cash+=total+allowance;campaign.workedToday=(campaign.workedToday||0)+1;campaign.stress=Math.min(GAME_CONFIG.player.maxStress,(campaign.stress||0)+stress());campaignSave();result()
 }
 function result(){UI.scene('warehouse',result);const r=data().last;shellBg('<small>湾岸配送センター　勤務終了</small><h2>交班工资单</h2><p>传送带停下，下一班点亮了装卸口的灯。</p><p>基础 ¥'+r.base+'　完成 '+r.done+' 件　准确率 '+r.rate+'%</p><p>处理绩效 +¥'+r.piece+'　准确率奖励 +¥'+r.bonus+'　失误扣款 −¥'+r.loss+'</p><p>工资条：基础工资 ¥'+r.base+'　表现奖金 ¥'+(r.piece+r.bonus-r.loss)+'　道具津贴 ¥'+(r.allowance||0)+(r.allowance?'（仓库作业腰包）':'')+'</p><h3>实发合计 ¥'+(r.total+(r.allowance||0))+'</h3>'+(!r.done?'<p>本班没有处理完包裹，未记入快速工资纪录。</p>':'')+manual()+btn('home','返回地图'));if(r.done&&window.V74)V74.senpai('warehouse')}
 function quick(){const w=data();if(!w.shifts||shift()||window.KONBINI?.active()||!spendAction('work'))return;campaign.cash+=w.best;campaign.workedToday=(campaign.workedToday||0)+1;campaign.stress=Math.min(GAME_CONFIG.player.maxStress,(campaign.stress||0)+stress());campaignSave();shellBg('<h2>快速班次已结算</h2><p>本班工资 ¥'+w.best+' 已到账。</p>'+btn('home','返回地图'))}
 function leave(){if(!shift())return;delete data().active;campaignSave();cancelAnimationFrame(raf);tokyoHome()}
 function open(){if(!shift())return intro();if(shift().day!==campaign.day){delete data().active;campaignSave();return intro()}UI.scene('warehouse',open);paused=false;unfocused=false;cancelAnimationFrame(raf);
  shell('<header><b>湾岸配送センター</b><span data-status></span><span data-skills></span>'+btn('pause','暂停')+'</header><div class="wh-scene"><div class="wh-scene-in"><img class="wh-art" alt="湾岸配送センター"><canvas width="960" height="640" aria-label="湾岸配送センター分拣场景"></canvas><div class="wh-hots"></div></div><section data-label class="wh-slip"></section></div><nav data-controls></nav><small role="status" data-message></small>');setupScene();last=performance.now();saveAt=0;render();raf=requestAnimationFrame(tick)
 }
 function blocked(){return paused||unfocused||document.hidden}
 function tick(t){const s=shift();if(!s||!root?.isConnected)return;const dt=Math.min(160,Math.max(0,t-last));last=t;
  if(!blocked()){if(!s.event&&!s.closing)s.elapsed=Math.min(duration,s.elapsed+dt);
   if(s.elapsed>=duration&&!s.closing){s.closing=true;s.finishMs=0;s.message='交班铃响，传送带正在停机。';sound('ding');render()}
   if(s.closing){s.finishMs+=dt;if(s.finishMs>=850){settle();return}}
   else if(!s.event){const p=s.item;if(p.phase==='in'&&s.elapsed-p.since>=400){p.phase='scan';if(data().skill.scan>=level&&!p.anomaly&&p.special<0)scan(true);else render()}
    if(p.phase==='out'&&s.elapsed-p.since>=450){parcel();render()}}
   if(s.event)s.event.motion=(s.event.motion||0)+dt;
   saveAt+=dt;if(saveAt>2200){campaignSave();saveAt=0}
  }
  if(!blocked())paint(s);status(s);raf=requestAnimationFrame(tick)
 }
 function status(s){root.querySelector('[data-status]').textContent=Math.ceil((duration-s.elapsed)/1000)+' 秒　'+s.done+' 件　'+accuracy(s)+'%'}
 function error(msg){const s=shift();s.errors++;s.errorAt=s.elapsed;s.message=msg;sound('ng')}
 function scan(automatic=false){const s=shift(),p=s.item;if(s.event||p.phase!=='scan')return;p.phase='sort';if(!automatic&&!['room','box'].includes(p.anomaly))data().skill.scan++;s.correct++;s.scanAt=s.elapsed;sound('scan');s.message='读码完成。请核对配送标签。';
  if(p.anomaly==='door'){encounter('door');s.event={id:'door'};sound('drag')}
  if(['room','box'].includes(p.anomaly)){encounter(p.anomaly);s.event={id:p.anomaly};if(p.anomaly==='box')sound('buzz')}
  render();campaignSave()}
 function dispatch(zone,count=true){const s=shift(),p=s.item;p.phase='out';p.to=zone;p.since=s.elapsed;if(count)s.done++;sound('page')}
 function sorted(){const s=shift(),p=s.item;data().skill.sort++;s.correct++;if(p.special>=0){p.phase='pack';s.message='放行前，请完成标签指定的包装。'}else{dispatch(p.z);s.message='包裹已放行。'}}
 function action(id){const s=shift(),p=s.item;if(id==='scan')return scan();if(s.event){const e=s.event;
   if(['door','truck'].includes(e.id)){if(id==='look'&&!e.look){e.look=true;e.motion=0;record(e.id);s.message=e.id==='door'?'开关旁边没有人。':'封条还在，货厢里再没有动静。'}
    else if(id==='back'){if(e.id==='door')s.doorClose=s.elapsed;delete s.event;s.message='回到工作台，继续处理这一件。'}else return}
   else if(e.id==='room'){if(id!=='hold'&&!/^zone[012]$/.test(id))return;const hold=id==='hold';record('room');delete s.event;if(!hold)error('普通区拒收，系统却打印了签收回执。');else s.message='异常件已隔离，终端留下了502的地址。';data().last502=hold?'隔离':'签收';dispatch(hold?3:+id.slice(-1),false)}
   else if(e.id==='box'){if(id==='look'&&!e.look){e.look=true;record('box');s.message='纸皮裂口里是交错咬合的木条。箱盖没有打开。'}else if(id==='hold'){delete s.event;dispatch(3,false);s.message='重件已隔离，交给下一班核查。'}else return}
  }else if(p.phase==='sort'&&/^zone[012]$/.test(id)){if(+id.slice(-1)!==p.z)error('分区不符。请重读条码首字母。');else if(data().skill.sort>=level&&!p.anomaly)sorted();else{p.phase='confirm';s.message='分区灯已亮，请按放行。'}}
  else if(p.phase==='confirm'&&id==='confirm')sorted();
  else if(p.phase==='pack'&&(/^pack[012]$/.test(id)||id==='assist'&&data().skill.pack>=level&&!p.anomaly)){if(id!=='assist'&&+id.slice(-1)!==p.special)error('处理方式与运输标签不符。');else{data().skill.pack++;s.correct++;dispatch(p.z);s.message='包装完成，已送入分区。'}}
  else return;campaignSave();render()
 }
 function click(e){const b=e.target.closest('[data-w]');let id=b?.dataset.w;
  
  if(!id)return;if(id==='home'){tokyoHome();return}if(id==='quick')return quick();if(id==='start')return start();if(!shift())return;
  if(id==='pause'){paused=true;campaignSave();render();return}if(id==='resume'){paused=false;unfocused=false;last=performance.now();render();return}
  if(id==='exit'&&paused){UI.confirm('提前离岗？','放弃本班工资。已经练习过的操作会保留。',leave);return}
  if(!blocked()&&!shift().closing)action(id)
 }
 function render(){const s=shift();if(!s||!root?.querySelector('canvas'))return;const p=s.item,e=s.event,read=!['in','scan'].includes(p.phase),label=root.querySelector('[data-label]'),nav=root.querySelector('[data-controls]');
  label.innerHTML='<small>配送伝票　／　荷物 '+String(p.id).padStart(3,'0')+'</small><p>'+(read?(p.anomaly==='room'?'お届け先：502号室　／　該当住所なし':p.anomaly==='box'?'重量超出读数范围　／　配送标签残缺':p.address+'　▥ '+p.code+'　'+(packs[p.special]?.slice(0,2).join(' · ')||'通常便 · 普通件')):'▥ ▏▎▏▌▎▏▌　等待扫码')+'</p>';
  const bays=zones.map((z,i)=>btn('zone'+i,z+' 区 · '+routes[i])).join('');
  nav.innerHTML=blocked()?manual()+btn('resume','继续班次')+btn('exit','提前离岗'):s.closing?'交班中……':e?(['door','truck'].includes(e.id)?(e.look?'':btn('look',e.id==='door'?'观察装卸口':'查看货厢'))+btn('back',e.look?'回工作台':'继续工作'):e.id==='room'?btn('hold','送往异常件区')+bays:(e.look?'':btn('look','查看破损包装'))+btn('hold','按异常重件隔离')):p.phase==='scan'?btn('scan','扫码　▥'):p.phase==='sort'?bays:p.phase==='confirm'?btn('confirm','放行至 '+zones[p.z]+' 区'):p.phase==='pack'?packs.map((x,i)=>btn('pack'+i,x[2])).join('')+(data().skill.pack>=level&&!p.anomaly?btn('assist','按熟练流程包装'):''):'输送中……';
  root.querySelector('[data-message]').textContent=e&&!e.look?({door:'卷帘门升起来了，开关旁空着。',truck:'封闭的货厢传来三声敲击。',room:'没有对应的配送地址。'+(data().last502==='签收'?'历史状态：已成功签收。':''),box:'小纸箱压低了秤台。扫描器又响了一次。'}[e.id]):s.message;syncScene(s);status(s);paint(s)
 }
 function paint(s){const cv=root.querySelector('canvas');if(!cv||!curZ)return;const g=cv.getContext('2d'),p=s.item,e=s.event,t=s.elapsed,m=e?.motion||0,Z=curZ;
  const W=960,H=640,X=f=>f*W,Y=f=>f*H;
  const rr=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(X(x)),Math.round(Y(y)),Math.round(w*W),Math.round(h*H))};
  g.clearRect(0,0,W,H);
  const pulse=.5+.5*Math.sin(t/260);
  function glow(rect,col,strong){const a=strong?.55:.30+.25*pulse;g.save();g.strokeStyle=col;g.globalAlpha=a;g.lineWidth=3;g.strokeRect(X(rect[0])+1.5,Y(rect[1])+1.5,rect[2]*W-3,rect[3]*H-3);g.globalAlpha=a*.28;g.fillStyle=col;g.fillRect(X(rect[0]),Y(rect[1]),rect[2]*W,rect[3]*H);g.restore()}
  if(e?.id==='door'||s.doorClose){const a=Z.anchors.door.rect;let raise=0;
   if(e?.id==='door')raise=Math.min(.8,.12+m/1250);else raise=Math.max(0,.8-(t-s.doorClose)/1050);
   const oh=a[3]*raise;if(oh>0.005){const grd=g.createLinearGradient(0,Y(a[1]+a[3]-oh),0,Y(a[1]+a[3]));grd.addColorStop(0,'#05080c');grd.addColorStop(1,'#131c26');g.fillStyle=grd;g.fillRect(X(a[0]),Y(a[1]+a[3]-oh),a[2]*W,oh*H);rr(a[0],a[1]+a[3]-oh,a[2],.006,'#ffd166')}}
  if(e?.id==='truck'&&m<1500){const c=Z.anchors.truck;for(let i=0;i<3;i++){const ph=((m/450)+i/3)%1;g.save();g.globalAlpha=.5*(1-ph);g.strokeStyle='#ffd166';g.lineWidth=2;g.beginPath();g.arc(X(c.c[0]),Y(c.c[1]),8+ph*34,0,7);g.stroke();g.restore()}}
  if(!e&&!s.closing){if(p.phase==='sort')Z.chutes.forEach(c=>glow(c.rect,c.col));else if(p.phase==='confirm')glow(Z.chutes[p.z].rect,Z.chutes[p.z].col,true);else if(p.phase==='pack')Z.packs.forEach(c=>glow(c.rect,c.col))}
  if(e?.id==='room')glow(Z.anchors.room.rect,'#ff7a6b');
  if(e?.id==='box')glow(Z.anchors.box.rect,'#ffb35c');
  if(e?.id==='door')glow(Z.anchors.door.rect,'#ffd166');
  if(e?.id==='truck')glow(Z.anchors.truck.rect,'#ffd166');
  if(!s.closing){let x=Z.gateX,y=Z.beltY,alpha=1;
   if(p.phase==='in'){const d=Math.min(1,(t-p.since)/400);x=Z.spawnX+(Z.gateX-Z.spawnX)*d}
   else if(p.phase==='out'){const dOut=Math.min(1,(t-p.since)/450),tgt=p.to===3?null:Z.chutes[p.to].tgt;
    if(dOut<.45){const k=dOut/.45;x=Z.gateX+(Z.plat[0]-Z.gateX)*k;y=Z.beltY+(Z.plat[1]-Z.beltY)*k}
    else{const k=(dOut-.45)/.55;if(tgt){x=Z.plat[0]+(tgt[0]-Z.plat[0])*k;y=Z.plat[1]+(tgt[1]-Z.plat[1])*k}else{x=Z.plat[0];y=Z.plat[1]-.09*k;alpha=1-k}}}
   const w=.052,h=.056,cx=X(x)-w*W/2,cy=Y(y)-h*H/2,wood=e?.id==='box'&&e.look,cold=p.special===1;
   g.save();g.globalAlpha=alpha;
   g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(X(x),Y(y)+h*H*.52,w*W*.5,5,0,0,7);g.fill();
   g.fillStyle=wood?'#6e4f36':cold?'#cfe0e8':'#b99367';g.fillRect(cx,cy,w*W,h*H);
   g.fillStyle=wood?'#54382a':cold?'#a9c4d4':'#977851';g.fillRect(cx,cy,w*W,h*H*.3);
   g.fillStyle=wood?'#3f2a1e':cold?'#7fa6ba':'#d3b68d';g.fillRect(cx+w*W*.44,cy,w*W*.12,h*H);
   if(wood){g.fillStyle='#503c31';for(let i=0;i<3;i++)g.fillRect(cx+3,cy+5+i*9,w*W-6,2)}
   if(!['in','scan'].includes(p.phase)){g.fillStyle='#19232b';g.fillRect(cx+w*W*.6,cy+4,15,13);g.fillStyle='#f3ecd9';g.font='bold 10px monospace';g.fillText(zones[p.z],cx+w*W*.6+4,cy+14)}
   if(p.phase==='scan'){g.save();g.strokeStyle='#ffe9a8';g.globalAlpha=.45+.4*pulse;g.setLineDash([5,4]);g.lineWidth=2;g.strokeRect(cx-4,cy-4,w*W+8,h*H+8);g.restore()}
   g.restore()}
  if(t-(s.scanAt??-1000)<260){g.save();g.globalAlpha=.5*(1-(t-s.scanAt)/260);g.fillStyle='#bfe8ff';g.fillRect(X(Z.gateX)-16,Y(Z.beltY)-52,32,104);g.restore()}
  if(t-(s.errorAt??-1000)<240)rr(0,0,1,.008,'#df7468');
  if(s.closing)rr(0,0,1,1,'rgba(12,18,23,'+(.65*Math.min(1,s.finishMs/850)).toFixed(3)+')');
 }
 function suspend(){if(shift()&&root?.isConnected&&root.querySelector('canvas')){unfocused=true;campaignSave();render()}}
 window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend()});
 return {intro,open,active:()=>!!shift(),overnight:()=>{if(shift()){delete data().active;campaignSave()}}}
})();



/* 打工按钮 → 便利店工作台（原来的直接打工保留为「快速打工」） */
{const quick=workShift;KONBINI.setQuick(quick);workShift=function(){if(WAREHOUSE.active())WAREHOUSE.open();else KONBINI.intro()}}
/* 班次进行中：顶部状态栏显示店里的时间 */
{const baseNow=TM.now;TM.now=function(){if(KONBINI.active()&&UI.current()==='konbini'){const c=KONBINI.clock();if(c!=null)return c}return baseNow()}}
/* 结束这一天之前：先结算进行中的班次（按已工作时间），避免班次跨天或重复结算 */
{const baseClose=nightlyClose;nightlyClose=function(){WAREHOUSE.overnight();if(KONBINI.active())KONBINI.settle(true,true);return baseClose.apply(this,arguments)}}
/* 地图上：有暂停中的班次时，可以回去继续 */
{const baseHome=tokyoHome;tokyoHome=function(){baseHome.apply(this,arguments);if(KONBINI.active()){const r=app.querySelector('.rpg-shell');if(r&&!r.querySelector('#kb-resume')){r.insertAdjacentHTML('afterbegin','<section class="survival-box kb-resume-box"><b>🏪 便利店打工暂停中</b><button type="button" class="survival-btn" id="kb-resume">▶ 回到收银台</button></section>');r.querySelector('#kb-resume').onclick=()=>KONBINI.open()}}}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&KONBINI.active()&&campaign)campaignSave()});
