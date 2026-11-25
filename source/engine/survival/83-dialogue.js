/* ==== engine/survival/83-dialogue.js ==== */
/* ===================================================================
   【V18 DialogueManager 对话框 + 剧情脚本播放器】
   DM（对话框）：人物姓名、日语台词（🔊）、逐字显示、选项、键盘 1-9 选择、空格跳过逐字。
   SR（脚本播放器）：读取 JSON 剧情节点，处理出现条件、资源变化、选项、日语题、出示证据、
                    NPC 话题菜单（hub）与返回。具体的条件/效果由调用方（章节）提供。
   剧情内容都在 story/ 文件夹的 JSON 里，这个文件只负责「怎么播放」。
   =================================================================== */
const SETTINGS=(function(){
 const KEY='tokyo-settings-v1',DEF={textSpeed:'normal',anomalies:true,fontSize:'normal',opening:true,gore:'full'}; // gore：强烈画面（full 完整 / soft 减弱）
 let s=Object.assign({},DEF);try{Object.assign(s,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
 function set(k,v){s[k]=v;try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}apply()}
 function apply(){document.body.dataset.fontsize=s.fontSize}
 apply();
 return {get:k=>s[k],set,apply};
})();
const TEXT_SPEED={slow:42,normal:20,fast:7,instant:0};

const DM=(function(){
 let cur=null; // 当前打开的对话 {host,box,timer,full,choices,done}
 /* 跳过 / 快进：auto='skip' 一口气翻完整段；auto='ff' 文字立刻出现、每隔一会儿自动翻页。
    遇到要做选择（不止一个选项）、日语题、出示证据时自动停下；对话结束也会停下。速度在 config 的 dialogue */
 let auto=null,autoEnd=0,autoT=0;
 const DCFG=GAME_CONFIG.dialogue||{};
 function setAuto(m){auto=m;clearTimeout(autoT);if(cur)paintTools();if(m)autoStep()}
 function stopAuto(){auto=null;clearTimeout(autoT);if(cur)paintTools()}
 function paintTools(){const t=cur&&cur.box.querySelector('.adv-tools');if(!t)return;
  const single=cur.choices.length===1,back=cur.done&&!cur.choices[0]?.whisper&&canUndo(); // 「↩ 返回」和「继续 / 选项」同时出现
  t.innerHTML=(back&&!auto?`<button type="button" class="adv-tool" data-tool="back" title="回到上一步（可以重新选择）">↩ 返回</button>`:'')+(!single?'':auto?`<button type="button" class="adv-tool on" data-tool="stop">■ 停止${auto==='ff'?'快进':'跳过'}</button>`:`<button type="button" class="adv-tool" data-tool="skip" title="跳过这一整段，直到需要你做选择">⏭ 跳过</button><button type="button" class="adv-tool" data-tool="ff" title="文字立刻显示并自动翻页，遇到选择会停下">⏩ 快进</button>`);
  t.hidden=!t.innerHTML;
  t.querySelectorAll('[data-tool]').forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.tool;if(k==='stop')stopAuto();else if(k==='back')undo();else setAuto(k)})}
 /* ↩ 返回：回到上一页对话；回到做选择的那一页就可以重新选（撤销选择）。
    每次显示对话时记下当时的存档；返回时恢复那时的状态。日语答错扣掉的 疲劳点 不会还回来（日语题页面本身也不能「返回重答」）。
    换到别的画面（地图 / 酒店 / 序章 …）后，之前的记录清空。最多记 config 的 dialogue.undoMax 步 */
 let hist=[],restoring=false;const undoHooks=[];
 function ctxKey(){const n=UI.current();return n==='pixel'||n==='investigate'?'hotel':n}
 function record(host,opts){
  if(restoring||!campaign||opts.noUndo)return;const key=ctxKey();
  if(hist.length&&hist[hist.length-1].key!==key)hist=[];
  hist.push({snap:JSON.stringify(campaign),host,hostId:host.id||'',opts,key,resume:UI.resumeFn?UI.resumeFn():null});
  if(hist.length>(DCFG.undoMax??30))hist.shift();
 }
 function canUndo(){if(!hist.length||!campaign||hist[hist.length-1].key!==ctxKey())return false;const top=hist[hist.length-1];return cur&&top.opts===cur.opts?hist.length>1:true}
 function undo(){
  if(!canUndo())return;stopAuto();
  if(cur&&hist[hist.length-1].opts===cur.opts)hist.pop();
  const top=hist[hist.length-1];
  const old=JSON.parse(top.snap),lostNow=campaign.jpLost||0,lostThen=old.jpLost||0;
  if(lostNow>lostThen)old.hp=Math.max(0,old.hp-(lostNow-lostThen)); // 日语答错扣的 疲劳点 不还
  old.jpLost=lostNow;
  const sanNow=campaign.sanLost||0,sanThen=old.sanLost||0;if(sanNow>sanThen)old.san=Math.max(0,old.san-(sanNow-sanThen));old.sanLost=sanNow; // 第一章回应超自然存在扣的 SAN 也不还（有代价的选择）
  close();campaign=old;campaignSave();if(typeof sanAtmosphere==='function')sanAtmosphere();
  restoring=true;
  try{undoHooks.forEach(f=>{try{f()}catch(e){console.error(e)}});
   let host=top.host;if(!document.body.contains(host)){if(top.resume)try{top.resume()}catch(e){console.error(e)}host=top.hostId&&document.getElementById(top.hostId)}
   if(host){close();show(host,top.opts)}
  }finally{restoring=false}
  if(window.AUDIO)AUDIO.sfx('page');UI.toast('↩ 回到上一步');
 }
 function clearHistory(){hist=[]}
 /* 死亡后「回到最后一个选择」：找到最近一页有两个以上选项的对话，连同当时的状态（包括 疲劳点、SAN）一起恢复。
    和「↩ 返回」不同，这里是死亡后的重试，所以那之后扣掉的 疲劳点 / SAN 都恢复到当时。 */
 function lastChoice(){for(let i=hist.length-1;i>=0;i--){const c=(hist[i].opts&&hist[i].opts.choices)||[];if(c.filter(x=>!x.disabled).length>1)return i}return -1}
 function canRewind(anyScreen){return !!campaign&&lastChoice()>=0&&(anyScreen||hist[hist.length-1].key===ctxKey())} // 只在刚才还在对话的画面里死亡时才提供
 function rewind(){
  const i=lastChoice();if(i<0)return false;const top=hist[i];hist=hist.slice(0,i+1);stopAuto();close();
  campaign=JSON.parse(top.snap);V51.afterRewind();campaignSave();if(typeof sanAtmosphere==='function')sanAtmosphere();
  const mb=document.querySelector('.et-modal-back');if(mb)mb.remove();
  restoring=true;
  try{undoHooks.forEach(f=>{try{f()}catch(e){console.error(e)}});
   let host=top.host;if(!document.body.contains(host)){if(top.resume)try{top.resume()}catch(e){console.error(e)}host=top.hostId&&document.getElementById(top.hostId)}
   if(host){close();show(host,top.opts)}
  }finally{restoring=false}
  if(window.AUDIO)AUDIO.sfx('page');UI.toast('↩ 回到了死亡之前的最后一个选择');return true;
 }
 function autoStep(){
  clearTimeout(autoT);if(!auto||!cur)return;
  const c=cur,ch=c.choices;
  if(ch.length!==1||ch[0].disabled||ch[0].noAuto||c.stopAuto){stopAuto();return}
  if(!c.done)finishTyping();
  autoT=setTimeout(()=>{if(!auto||cur!==c)return;const b=c.choicesEl.querySelector('.adv-choice');if(b)b.click()},auto==='skip'?(DCFG.skipMs??40):(DCFG.fastMs??450));
 }
 function close(){if(cur){clearInterval(cur.timer);if(cur.box&&cur.box.parentNode)cur.box.hidden=true}cur=null;queueMicrotask(V51.onScene);clearTimeout(autoT);clearTimeout(autoEnd);if(auto)autoEnd=setTimeout(()=>{if(!cur)auto=null},200)}
 /* 画面重渲染（读档时 start 连换两次 DOM 等）会把对话框节点摘掉：DM 还以为开着，画面上却没有，热点与手帐又都先查 isOpen，于是软锁。
   按宿主 id 在新 DOM 里找回对话框、按原参数重挂；找不到宿主就当作已关闭。看门狗每 400ms 查一次，玩家不操作也会自愈。 */
 function reattach(){
  if(!cur||document.body.contains(cur.box))return;
  const id=cur.host&&cur.host.id,opts=cur.opts,host=id?document.getElementById(id):null;
  if(!host||!opts){close();return}
  restoring=true;try{show(host,opts)}finally{restoring=false}
 }
 setInterval(()=>{if(cur&&!document.body.contains(cur.box))reattach()},400);
 function finishTyping(){if(!cur||cur.done)return;clearInterval(cur.timer);cur.textEl.innerHTML=DISTORT.html(cur.full);cur.done=true;cur.box.classList.remove('typing');cur.choicesEl.hidden=false;paintTools();focusFirst()}
 function focusFirst(){const b=cur&&cur.choicesEl.querySelector('button:not([disabled])');if(b)b.focus({preventScroll:true})}
 /* opts: {who, sub, jp, text, choices:[{t,fn,disabled,note}], tone:'ok'|'ng'|'rule'|'', result} */
 function show(host,opts){
  if(!host)return;close();record(host,opts);
  (window.__advLog=window.__advLog||[]).push([opts.who||'',opts.jp||'',opts.text||''].join(' '));if(window.__advLog.length>400)window.__advLog.shift(); // 测试用：记录显示过的对话
  const box=host;box.hidden=false;box.classList.add('adv-box');
  const original=(opts.choices&&opts.choices.length)?opts.choices:[{t:'▶ 继续',fn:opts.next||close}];
  const swallowed=V51.whisper(original),ch=swallowed||original;
  /* 语言辅助协议（98-language-protocol.js）：日语台词的中文翻译 = opts.tr，或正文开头的「……」。
     题目页面（noUndo）不处理；lockTranslate 的台词两种模式都不显示翻译 */
  let tr='',rest=String(opts.text||'');
  if(opts.jp&&!opts.noUndo){if(opts.tr)tr=opts.tr;else{const m=rest.match(/^(「[^」]*」)\n?/);if(m){tr=m[1];rest=rest.slice(m[0].length)}}}
  if(opts.lockTr)tr='';
  if(tr)tr=DISTORT.text(tr);
  if(!opts.noUndo)rest=DISTORT.text(rest);
  const learn=!!tr&&langMode()==='learning';
  box.className='adv-box v51-screen-dialog'+(opts.tone?' adv-'+opts.tone:'');
  box.classList.toggle('has-portrait',!!opts.portrait);box.classList.toggle('has-tachie',!!(window.TACHIE&&TACHIE.is(opts.portrait)));
  box.innerHTML=`<div class="adv-tools" hidden></div>`+(opts.portrait?`<div class="adv-top"><img class="adv-portrait" src="${opts.portrait}" alt=""><div class="adv-main">`:'')+(opts.who?`<div class="adv-name"><b>${esc(opts.who)}</b>${opts.sub?`<small>${esc(opts.sub)}</small>`:''}</div>`:'')+
   (opts.jp?`<div class="adv-jp" lang="ja" translate="no">「${DISTORT.html(DISTORT.text(opts.jp))}」<button class="spkbtn adv-say" type="button" aria-label="听读音">🔊</button></div>`:'')+(tr&&learn?`<div class="adv-tr">${trToggle(tr)}</div>`:'')+
   `<p class="adv-text"></p>`+(opts.result?`<div class="adv-result">${esc(opts.result)}</div>`:'')+(opts.portrait?'</div></div>':'')+
   `<div class="adv-choices" hidden>${ch.map((c,i)=>`<button type="button" class="adv-choice${c.primary?' primary':''}" data-i="${i}"${c.disabled?' disabled':''}><span class="adv-key">${ch.length>1?i+1:'▶'}</span><span>${DISTORT.html(c.whisper||ch.length>1?DISTORT.text(c.t.replace(/^▶\s*/,''),true):c.t.replace(/^▶\s*/,''))}${c.note?`<small>${esc(c.note)}</small>`:''}</span></button>`).join('')}</div>`;
  const textEl=box.querySelector('.adv-text'),choicesEl=box.querySelector('.adv-choices');
  const full=tr&&!learn?(tr+(rest?'\n'+rest:'')):rest;
  cur={host,box,textEl,choicesEl,full,done:false,timer:0,choices:ch,opts,stopAuto:!!opts.stopAuto};clearTimeout(autoEnd);paintTools();
  const say=box.querySelector('.adv-say');if(say)say.onclick=e=>{e.stopPropagation();if(typeof window.say==='function')window.say(opts.jp)};
  choicesEl.querySelectorAll('.adv-choice').forEach(b=>b.onclick=e=>{e.stopPropagation();const c=ch[+b.dataset.i];if(!c||c.disabled)return;close();if(c.fn)c.fn();});
  textEl.onclick=()=>finishTyping();box.onclick=e=>{if(!cur||cur.done)return;if(e.target.closest('.adv-choice'))return;finishTyping()};
  box.scrollTop=0; // 对话框不在视野里时滚动过去
  const ms=auto?0:TEXT_SPEED[SETTINGS.get('textSpeed')]??20;
  if(!ms||!full){textEl.innerHTML=DISTORT.html(full);cur.done=true;choicesEl.hidden=false;paintTools();focusFirst();if(auto)autoStep();return}
  box.classList.add('typing');let i=0;
  cur.timer=setInterval(()=>{if(!cur||cur.textEl!==textEl){return}i+=Math.max(1,Math.round(16/ms));if(window.AUDIO&&full[i]&&full[i].trim())AUDIO.sfx('type');textEl.innerHTML=DISTORT.html(full.slice(0,i));if(i>=full.length)finishTyping()},ms);
 }
 function isOpen(){if(cur&&!document.body.contains(cur.box))reattach();return !!cur}
 /* 键盘：数字选项、空格/Enter 跳过逐字或选择唯一选项 */
 document.addEventListener('keydown',e=>{
  if(!cur||!document.body.contains(cur.box)||cur.box.hidden)return;
  if(/input|textarea|select/i.test((e.target&&e.target.tagName)||''))return;
  if(e.key===' '||e.key==='Enter'){
   if(!cur.done){e.preventDefault();e.stopImmediatePropagation();finishTyping();return}
   if(document.activeElement&&document.activeElement.classList.contains('adv-choice'))return;
   const btns=cur.choicesEl.querySelectorAll('.adv-choice:not([disabled])');if(btns.length===1){e.preventDefault();e.stopImmediatePropagation();btns[0].click()}return;
  }
  const n=+e.key;if(n>=1&&n<=9){const b=cur.choicesEl.querySelectorAll('.adv-choice')[n-1];if(b&&!b.disabled){e.preventDefault();e.stopImmediatePropagation();if(!cur.done)finishTyping();b.click()}}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}
  if(['w','a','s','d','W','A','S','D'].includes(e.key))e.stopImmediatePropagation();
 },true);
 return {undo,canUndo,canRewind,rewind,clearHistory,onUndo:f=>undoHooks.push(f),history:()=>hist.length,show,close,isOpen,finishTyping,current:()=>cur,skip:()=>setAuto('skip'),fast:()=>setAuto('ff'),stopAuto,auto:()=>auto};
})();
window.DM=DM; // 测试用

/* ---------- 剧情脚本播放器 ----------
   ctx 由使用方提供：
   nodes        剧情节点表 {id:node}
   host()       对话框所在的元素
   cond(when)   判断条件
   apply(eff)   执行资源变化，返回说明文字
   pick(v)      处理「按时间段不同」的文字 {evening:..,night:..}
   onEnd()      对话结束
   jpPenalty    日语答错扣多少 疲劳点
   evidence()   可出示的证据 [{id,name}]
   call(name)   执行内置动作（例如 decide / journal）
   tauntScene   路人吐槽使用的场景
   listenFailNote(node)  「听懂判定」没听懂时显示的说明（可选）
   showHint(node)        没听懂时是否显示关键词提示（可选，不写就总是显示）
*/
const SR=(function(){
 function run(id,ctx,hub){
  const node=ctx.nodes[id];
  if(!node){finish(ctx,hub);return}
  if(node.gate&&ctx.cond(node.gate.when)){run(node.gate.node,ctx,hub);return}
  if(node.when&&!ctx.cond(node.when)){if(node.else)run(node.else,ctx,hub);else finish(ctx,hub);return}
  if(node.goto){run(node.goto,ctx,hub);return}
  if(ctx.onNode)ctx.onNode(node);
  if(node.sfx&&window.AUDIO)AUDIO.sfx(node.sfx); // 剧情里写 "sfx" 就播放音效
  if(node.type==='hub')hub=node.id;
  if(node.onceFlag&&ctx.cond({flag:node.onceFlag})&&node.after){run(node.after,ctx,hub);return}
  const carry=ctx.carry||'';ctx.carry='';
  const eff=node.effects&&node.type!=='listen'?ctx.apply(node.effects,node):''; // listen 类型只有听懂了才生效
  const result=[carry,eff].filter(Boolean).join(' · ');
  const pages=toPages(node,ctx);
  const showPage=i=>{
   const p=pages[i],last=i===pages.length-1;
   if(!last){DM.show(ctx.host(),Object.assign({},p,{result:i===0?result:'',choices:[{t:'▶ 继续',fn:()=>showPage(i+1)}]}));return}
   if(node.type==='jp'){jp(node,ctx,hub,Object.assign({},p,{result:pages.length===1?result:''}));return}
   if(node.type==='present'){present(node,ctx,hub,p);return}
   if(node.type==='listen'){listen(node,ctx,hub,Object.assign({},p,{result:pages.length===1?result:''}));return}
   DM.show(ctx.host(),Object.assign({},p,{result:pages.length===1?result:'',choices:choicesFor(node,ctx,hub)}));
  };
  showPage(0);
 }
 function optionLabel(node,i,ctx){return ctx.pick((node.options||[])[i])}
 function toPages(node,ctx){
  const who=ctx.pick(node.who||node.speaker||''),sub=node.sub?ctx.pick(node.sub):(ctx.subFor?ctx.subFor(node):'');
  const pf=(w,l)=>ctx.portraitFor?ctx.portraitFor(node,w,l):'';
  if(node.type==='listen'){const pre=Array.isArray(node.lines)?node.lines.map(l=>typeof l==='string'?{who:'',text:ctx.pick(l)}:{who:ctx.pick(l.who||who),sub:l.who?'':sub,jp:ctx.pick(l.jp||''),text:ctx.pick(l.zh||l.text||''),portrait:pf(ctx.pick(l.who||who),l)}):[];return pre.concat([{who,sub,jp:ctx.pick(node.jp||''),text:ctx.pick(node.question||'对方说的是什么意思？'),portrait:pf(who)}])}
  const lk=!!node.lockTranslate;
  if(Array.isArray(node.lines)&&node.lines.length)return node.lines.map(l=>typeof l==='string'?{who:'',text:ctx.pick(l)}:{who:ctx.pick(l.who||who),sub:l.who?'':sub,jp:ctx.pick(l.jp||''),tr:l.tr?ctx.pick(l.tr):(l.jp&&l.zh&&l.text?ctx.pick(l.zh):''),text:ctx.pick(l.jp&&l.zh&&l.text?l.text:(l.zh||l.text||'')),lockTr:lk||!!l.lockTranslate,portrait:pf(ctx.pick(l.who||who),l)});
  return [{who,sub,jp:ctx.pick(node.jp||''),tr:node.tr?ctx.pick(node.tr):'',text:ctx.pick(node.text||node.question||''),lockTr:lk,portrait:pf(who)}]; // v23.4：tr = 这句日语的中文意思（明确写出来，不靠从正文里猜）
 }
 function onceKey(node,c){return '已选:'+node.id+':'+(c.id||c.text)}
 function choicesFor(node,ctx,hub){
  const list=[],auto=ctx.autoOnce&&node.type==='hub',nav=c=>!c.next&&!c.call&&!c.effects; // v32.2 autoOnce：人物菜单（hub）里问过的选项自动消失；通往关键线索（ctx.isKey）和离开类选项保留
  (node.choices||[]).forEach(c=>{
   if(c.when&&!ctx.cond(c.when))return;
   if((c.once||(auto&&!nav(c)&&!c.call&&!(ctx.isKey&&ctx.isKey(c))))&&ctx.cond({flag:onceKey(node,c)}))return;
   const ok=(!c.need||ctx.cond(c.need))&&(!ctx.canChoose||ctx.canChoose(c));
   list.push({t:ctx.pick(c.text),disabled:!ok,note:!ok?(c.needText||'条件不足'):'',fn:()=>choose(node,c,ctx,hub)});
  });
  if(node.type==='hub'&&ctx.onHub)ctx.onHub(node);
  if(node.type==='hub')list.push({t:node.backText||'（结束对话）',fn:()=>finish(ctx,null)});
  if(!list.length){
   if(node.next)list.push({t:node.nextText||'▶ 继续',fn:()=>run(node.next,ctx,hub)});
   else if(node.call)list.push({t:node.callText||'▶ 继续',fn:()=>{finish(ctx,null,true);ctx.call(node.call)}});
   else list.push({t:hub&&!node.end?'▶ 继续':(node.endText||ctx.endText||'▶ 继续'),fn:()=>node.end?finish(ctx,null):finish(ctx,hub)});
  }
  return list;
 }
 function choose(node,c,ctx,hub){
  const toPresent=!!(c.next&&ctx.nodes&&ctx.nodes[c.next]&&ctx.nodes[c.next].type==='present'); /* v58：出示前可以反悔，取消不算问过 */
  if(c.once||(ctx.autoOnce&&node.type==='hub'&&!c.call&&!toPresent))ctx.apply({flag:onceKey(node,c)},node,true); // 记下「问过了」（关键线索的选项也记，用来判断是否问完）
  const t=c.effects?ctx.apply(c.effects,node):'';
  const go=()=>{
   if(c.call){finish(ctx,null,true);ctx.call(c.call);return}
   if(c.next){run(c.next,ctx,hub);return}
   if(c.end){finish(ctx,null);return}
   finish(ctx,hub);
  };
  if(t&&!c.next){DM.show(ctx.host(),{who:'',text:t,tone:'result',choices:[{t:'▶ 继续',fn:go}]});return}
  if(t&&c.next)ctx.carry=t;
  go();
 }
 function finish(ctx,hub,silent){
  if(hub&&ctx.nodes[hub]){run(hub,ctx,hub);return}
  DM.close();if(!silent&&ctx.onEnd)ctx.onEnd();
 }
 /* 选项顺序每次打乱（正确答案不会总在第一个） */
 function order(n){const a=[...Array(n).keys()];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 function jp(node,ctx,hub,page){
  const opts=node.options||[];
  DM.show(ctx.host(),Object.assign({},page,{noUndo:true,choices:order(opts.length).map(i=>({t:optionLabel(node,i,ctx),fn:()=>{
   const ok=i===node.answer;
   if(ok)V51.award(node,ctx,false);
   if(ok&&window.NpcTaunts)NpcTaunts.onAnswer(true);if(window.AUDIO)AUDIO.sfx(ok?'ok':'ng');
   let tone='ok',who='✓ 听懂了',text=ctx.pick(node.explain||'');
   if(!ok){if(window.LANGAID)LANGAID.fail(node);const hp=ctx.jpPenalty||GAME_CONFIG.wrongAnswer.chapter1Hp;GS.change({hp:-hp});if(campaign)campaign.jpLost=(campaign.jpLost||0)+hp;const ex=ctx.onHurt?ctx.onHurt(hp,node):'';tone='ng';who='✕ 理解有误（疲劳点 -'+hp+'，SAN 不变）';text=(typeof ex==='string'&&ex?ex+'\n':'')+'正确意思：'+ctx.pick(opts[node.answer])+'\n'+text} // onHurt 可以返回一句额外说明（例如入境之夜的「⏱ +6 分钟」）
   const after=()=>{if(GS.dead()){finish(ctx,null);return}if(node.next)run(node.next,ctx,hub);else finish(ctx,hub)};
   text+=V51ADD.answerTranslation(node,i,ctx);
   DM.show(ctx.host(),{who,text,tone,choices:[{t:'▶ 继续',fn:after}]});
   if(!ok&&window.NpcTaunts){const box=ctx.host();NpcTaunts.handle(false,ctx.tauntScene||'hotel',box,box.querySelector('.adv-text'))}
  }}))}));
 }
 /* 听懂才算数：只显示日语原文，选对意思才记下线索；没听懂扣 疲劳点、线索不记下，之后可以「回想」重来 */
 function listen(node,ctx,hub,page){
  const opts=node.options||[];
  /* 听懂了（或者由调查局语言辅助帮你理解了）：线索生效，显示中文意思，继续剧情 */
  const pass=(assisted,i=node.answer)=>{
   if(!assisted)V51.award(node,ctx,true);
   if(!assisted&&window.NpcTaunts)NpcTaunts.onAnswer(true);
   if(assisted&&window.LANGAID)LANGAID.assisted(node);
   const lookupCost=assisted?ctx.apply({time:3},node):'';
   const t=node.effects?ctx.apply(node.effects,node):'';if(ctx.onListen)ctx.onListen(node,true);if(window.AUDIO)AUDIO.sfx(assisted?'clue':'ok');
   // 镜面题是序章恐怖演出的一部分：答对后不出现学习反馈，直接进入剧情。
   if(node.id==='rm-mirror'&&!assisted){finish(ctx,null,true);ctx.call('finale');return;}
   const zh=node.horrorFatal?'':(node.zh?ctx.pick(node.zh):(assisted?'意思：'+ctx.pick(opts[node.answer]):''));
   const text=assisted?['「'+ctx.pick(node.jp||'')+'」',zh,(!node.horrorFatal&&node.explain)?'📖 '+ctx.pick(node.explain):'',(assisted?'你打开手机翻译软件，核对了这句话的意思。':'')].filter(Boolean).join('\n\n'):[zh,(!node.horrorFatal&&node.explain)?'📖 '+ctx.pick(node.explain):''].filter(Boolean).join('\n\n');
   DM.show(ctx.host(),{who:assisted?'📱 手机翻译':'✓ 听懂了',text:text+V51ADD.answerTranslation(node,i,ctx),tone:'ok',result:[t,lookupCost].filter(Boolean).join(' · '),choices:[{t:'▶ 继续',fn:()=>{if(node.next)run(node.next,ctx,hub);else finish(ctx,hub)}}]});
  };
  DM.show(ctx.host(),Object.assign({},page,{tone:node.horrorFatal?'horror-choice':'listen',noUndo:true,choices:order(opts.length).map(i=>({t:optionLabel(node,i,ctx),fn:()=>{
   const ok=i===node.answer;
   if(ok)pass(false,i);
   else{
    if(node.horrorFatal){
     // This is a deliberate narrative death, not an ordinary Japanese-learning penalty.
     // Snapshot before the lethal choice so players can replay without losing their save.
     const checkpoint=JSON.stringify(campaign);
     V51.die('death_v51_room206',()=>new Promise(done=>{
     if(window.AUDIO)AUDIO.sfx('glitch');
     DM.show(ctx.host(),{who:'☠ BAD END · 206号室',tone:'horror-death',noUndo:true,
      text:'你选择了纸条上没有写出的那句话。\n\n身后，浴室里的水声突然停了。\n\n有人贴着你的耳朵，轻轻说了一句：「……開けて。」\n\n你还没有回头，视野已经黑了。\n\n【调查员死亡】',
      choices:[{t:'↻ 从这道警告前重试',fn:()=>{
       campaign=JSON.parse(checkpoint);V51.afterRewind();campaignSave();
       run(node.id,ctx,hub);done();
      }},{t:'结束本次调查',fn:done}]});
     }));
     return;
    }
    const LA=window.LANGAID?LANGAID.fail(node):null; // v23.4 剧情体验模式的分级提示与「调查局语言辅助」（98b-language-assist.js）
    const hp=LA&&LA.noHp?0:(ctx.jpPenalty||GAME_CONFIG.wrongAnswer.chapter1Hp);if(hp){GS.change({hp:-hp});if(campaign)campaign.jpLost=(campaign.jpLost||0)+hp}const ex=ctx.onHurt?ctx.onHurt(hp,node):'';if(ctx.onListen)ctx.onListen(node,false);if(window.AUDIO)AUDIO.sfx('ng');
    const text=(typeof ex==='string'&&ex?ex+'\n':'')+(node.failText?ctx.pick(node.failText)+'\n\n':'')+(LA&&LA.before?LA.before+'\n':'')+(LA&&LA.after?LA.after+'\n':'')+(ctx.listenFailNote?ctx.listenFailNote(node):'（你没听懂，这条线索没有记下来。之后可以在调查手帐里「回想」这句话再试一次。）');
    const cont={t:'▶ 继续',fn:()=>{if(GS.dead()){finish(ctx,null);return}if(node.failNext)run(node.failNext,ctx,hub);else finish(ctx,hub)}};
    const help=LA&&LA.offer&&!GS.dead()?{t:'📱 用手机翻译软件查一下',fn:()=>pass(true)}:null;
    DM.show(ctx.host(),{who:'✕ 没听懂（'+(hp?'疲劳点 -'+hp:'疲劳点 不变：同一道题只扣一次')+'，SAN 不变）',text:text+V51ADD.answerTranslation(node,i,ctx),tone:'ng',choices:help?[cont,help]:[cont]});
    if(window.NpcTaunts){const box=ctx.host();NpcTaunts.handle(false,ctx.tauntScene||'hotel',box,box.querySelector('.adv-text'))}
   }
  }}))}));
 }
 function present(node,ctx,hub,page){
  const ev=ctx.evidence();
  const choices=ev.map(e=>({t:'出示：'+e.name,fn:()=>{const ok=(node.accept||[]).includes(e.id);if(ok&&node.next)run(node.next,ctx,hub);else if(!ok&&node.wrong)run(node.wrong,ctx,hub);else finish(ctx,hub)}}));
  choices.push({t:node.cancelText||'暂时不出示',fn:()=>{if(node.cancel)run(node.cancel,ctx,hub);else finish(ctx,hub)}});
  DM.show(ctx.host(),Object.assign({},page,{text:page.text+(ev.length?'':'\n（你手上还没有可以出示的证据。）'),choices,tone:'present'}));
 }
 return {run};
})();
