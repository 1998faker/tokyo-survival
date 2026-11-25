/* ==== engine/survival/96r-verify.js ==== */
/* ===================================================================
   【第一章线索调查系统 · 第二阶段】NPC 求证 + 田中震的邮件预约（v27）
   - 求证规则：data/investigation/verify.json（推论 × 人物 → 求证对话 → 报告材料）。通用：以后接入佐藤、井上、森经理只加数据。
   - 对话：story/chapter1/nodes/09-verify.json；小林的对话菜单里有「🧩 出示调查推论」「能帮我联系田中震先生吗？」
   - 田中：小林给邮箱（标记 tanakaContact）→ 邮件里「✉ 联系田中震」→ 回信写明约定时间 → 只在约定时间段站在后巷的后门旁（标记 tanakaWaiting）
           → 会面菜单：普通交谈 / 出示调查推论 / 结束会面（同一次会面可以问很多条）。错过了可以再写信。
   - 时间：config/game.json 的 verify.tanaka（酒店夜间时钟：0 = 18:00，720 = 次日 6:00）
   - 存档：campaign.verify = {done:{规则id:{at}}, contacts:{tanaka:{at}}, appts:[{n, sent, reply, meet, state}], met}
           报告材料写进 campaign.investigation.evidence（INV.grantEvidence，不重复）。
   - 剧情标记（每次存档时按上面的状态重新计算，写在 hotelCase.v18.flags）：inv:ded 有推论；vf:<规则id> 这条求证做过了；
           tanakaWaiting 田中正在后门等；vf:apptSoon 约好了还没到时间；vf:apptMissed 错过了约定。
   - 不改最终结局判定、六天期限；原来「请小林叫田中来」的剧情保留（田中在后门等你时不能再叫一次）。
   =================================================================== */
const VERIFY=(function(){
 const VD=()=>GAME_DATA.d['investigation/verify']||{npcs:{},rules:[]};
 const CFG=()=>((GAME_CONFIG.verify||{}).tanaka)||{replyMinutes:30,leadMinutes:60,slots:[240,420],windowMinutes:90,email:'t.tanaka@minato-keibi.example'};
 const END=720;
 function st(){campaign.verify??={};const s=campaign.verify;s.done??={};s.appts??=[];s.contacts??={};s.n??=0;s.met??=false;return s}
 const v18=()=>campaign&&campaign.hotelCase&&campaign.hotelCase.v18;
 function flags(){const v=v18();if(!v)return null;v.flags??={};return v.flags}
 const flag=k=>{const f=flags();return !!(f&&f[k])};
 function setFlag(k,on){const f=flags();if(!f||!!f[k]===!!on)return false;if(on)f[k]=true;else delete f[k];return true}
 function toast(t){const el=document.getElementById('h18-toast');if(el&&window.H18&&H18.active()){el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{el.hidden=true},3200)}else if(typeof UI!=='undefined')UI.toast(t)}
 let baseSave=null;const save=()=>campaignSave(); // 走完整的存档（会重新计算剧情标记）
 /* ---------- 时间：{day, clock}，clock = 酒店夜间时钟（白天 = -1） ---------- */
 function nowPos(){if(!campaign)return {day:0,clock:-1};const v=v18();let c=-1;
  if(v&&v.clockDay===campaign.day&&(v.clock>0||(v.flags&&v.flags['tonight:entered'])||(window.H18&&H18.active())))c=v.clock;
  return {day:campaign.day,clock:c}}
 const key=p=>p.day*10000+(p.clock+1);
 const hhmm=c=>c<0?'白天':TM.fmt(18*60+c);
 const at=p=>'DAY '+p.day+' · '+hhmm(p.clock);
 const span=m=>'DAY '+m.day+' · '+hhmm(m.from)+'～'+hhmm(m.to);
 function lastNight(){try{const v=v18();if(window.H18&&v&&v.startDay)return H18.reopenDay()-1}catch(e){}return Infinity}
 /* 发信时间 → 回信时间、见面时间（不会早于现在，不超过第一章的最后一夜） */
 function plan(sent){
  const C=CFG(),W=C.windowMinutes,LD=C.leadMinutes,slots=(C.slots||[]).slice().sort((a,b)=>a-b),last=lastNight();
  let reply,earliest;
  if(sent.clock<0){reply={day:sent.day,clock:-1};earliest=LD}
  else{const rc=sent.clock+C.replyMinutes;if(rc>=END){reply={day:sent.day+1,clock:-1};earliest=LD}else{reply={day:sent.day,clock:rc};earliest=rc+LD}}
  const fit=(d,from)=>{const s=slots.find(x=>x>=from&&x+W<=END);return s==null?null:{day:d,from:s,to:s+W}};
  let meet=null;
  if(reply.day<=last){meet=fit(reply.day,earliest);
   if(!meet&&reply.day+1<=last)meet=fit(reply.day+1,LD);
   if(!meet){const f=Math.ceil(earliest/10)*10;if(f+W<=END)meet={day:reply.day,from:f,to:f+W}}}
  return {reply,meet};
 }
 function status(a){
  if(!a)return 'none';const now=key(nowPos());
  if(a.state==='done')return 'done';
  if(now<key(a.reply))return 'sent';
  if(!a.meet)return 'nomeet';
  const start=key({day:a.meet.day,clock:a.meet.from}),end=key({day:a.meet.day,clock:a.meet.to});
  if(a.state==='met')return now<=end+1000?'meeting':'done';
  if(now<start)return 'upcoming';if(now<=end)return 'open';return 'missed';
 }
 const ACTIVE=['sent','upcoming','open','meeting'];
 function last(){const a=st().appts;return a[a.length-1]||null}
 function active(){const a=last();return a&&ACTIVE.includes(status(a))?a:null}
 const hasContact=()=>!!(campaign&&(flag('tanakaContact')||st().contacts.tanaka));
 const canSend=()=>hasContact()&&!active();
 /* ---------- 存档时重新计算剧情标记 ---------- */
 function sync(){
  if(!campaign||!v18())return false;const s=st();let ch=false;
  const inv=campaign.investigation;ch=setFlag('inv:ded',!!(inv&&inv.deductions&&Object.keys(inv.deductions).length))||ch;
  Object.keys(s.done).forEach(id=>{ch=setFlag('vf:'+id,true)||ch});
  if(flag('tanakaContact')&&!s.contacts.tanaka){s.contacts.tanaka={at:nowPos()};ch=true;toast('📇 已获得新的联系人：田中震')}
  const a=last();if(a?.meet&&a.state!=='done'&&a.state!=='met')a.meet.to=Math.min(720,Math.max(a.meet.to||0,a.meet.from+GAME_CONFIG.ch1Repairs.tanakaWindowMinutes));const stt=status(a);
  if(a&&stt==='done'&&a.state==='met'){a.state='done';ch=true}
  ch=setFlag('tanakaWaiting',stt==='open'||stt==='meeting')||ch;
  ch=setFlag('vf:apptSoon',stt==='upcoming')||ch;
  ch=setFlag('vf:apptMissed',stt==='missed')||ch;
  if(ch&&window.H18&&H18.active())try{H18.placeNPCs()}catch(e){}
  if(window.MAIL)MAIL.badge();
  return ch;
 }
 /* ---------- 求证 ---------- */
 const dedName=id=>((window.INV&&INV.deductions().find(d=>d.id===id))||{}).name||id;
 function rulesOf(ded,npc){return (VD().rules||[]).filter(r=>r.deduction===ded&&r.npc===npc)}
 function ruleFor(ded,npc){if(ded==='MD07'&&!ROOMFILE.solved(campaign))return null;return rulesOf(ded,npc).find(r=>!r.when||H18.cond(r.when))||null}
 /* v29：这个人知道内情、但条件还没满足（例如真相揭开之前）→ locked 回应，不给证据 */
 function lockedFor(ded,npc){const rs=rulesOf(ded,npc);if(!rs.length||ruleFor(ded,npc))return null;const r=rs.find(x=>x.locked)||rs[0];return r.locked||(VD().npcs[npc]||{}).locked||(VD().npcs[npc]||{}).unknown}
 function myDeductions(){const d=(campaign&&campaign.investigation&&campaign.investigation.deductions)||{};return Object.entries(d).filter(([id])=>id!=='MD07'||ROOMFILE.solved(campaign)).sort((a,b)=>(a[1].n||0)-(b[1].n||0)).map(x=>x[0])}
 function back(npc){const N=VD().npcs[npc]||{};if(N.meet)meet();else if(N.hub)H18.play(N.hub);else H18.endDialog()}
 function present(npc){
  const N=VD().npcs[npc]||{name:npc},ids=myDeductions(),s=st();
  const ACC={XD01:'kobayashi',XD13:'inoue',XD04:'takahashi'};const choices=ids.map(id=>{const r=ruleFor(id,npc),asked=!!(r&&s.done[r.id]),acc=ACC[id]===npc&&!asked;return {t:'出示：'+(acc?'⚠ 当面指控｜':'')+dedName(id)+(asked?'（已询问）':''),fn:acc?()=>DM.show(H18.host(),{who:'⚠ 当面指控',sub:'向'+(N.name||npc)+'提问',text:'这是当面指控。如果你说错了，对方可能会翻脸，今天不再和你说话。',choices:[{t:'确定这样说',fn:()=>choose(npc,id)},{t:'再想想',fn:()=>present(npc)}],tone:'present'}):()=>choose(npc,id)}});
  choices.push({t:'暂时不出示',fn:()=>back(npc)});
  DM.show(H18.host(),{who:'🧩 出示调查推论',sub:'向'+(N.name||npc)+'提问',text:ids.length?'要向'+(N.name||npc)+'出示哪一条推论？（出示推论不花时间，也不会扣 疲劳点 / SAN）':'你还没有可以出示的推论。\n（点击底部「🧩 推理」，在线索合成中关联两条线索。）',choices,tone:'present'});
 }
 function choose(npc,ded){
  if(npc==='takahashi'){
   if(ded==='YK-D3'&&YUMI.check('second'))return YUMI.play('second',()=>back(npc));
   if(['YK-D1','YK-D2'].includes(ded)&&YUMI.check('first'))return YUMI.play('first',()=>back(npc));
   if(ded==='YK-D1')return H18.play('yk-visitor',()=>back(npc));
   if(ded==='YK-D4'&&YUMI.check('contact'))return H18.play('yk-contact',()=>back(npc));
   if(!rulesOf(ded,npc).length)return H18.play('yk-followup',()=>back(npc));
  }
  const N=VD().npcs[npc]||{},r=ruleFor(ded,npc),s=st();
  if(!r){H18.play(lockedFor(ded,npc)||N.unknown,()=>back(npc));return}
  if(s.done[r.id]){H18.play(N.asked,()=>back(npc));return}
  H18.play(r.node,()=>{complete(r);back(npc)});
 }
 function complete(r){
  const s=st();if(s.done[r.id])return;s.done[r.id]={at:nowPos(),deduction:r.deduction,npc:r.npc};setFlag('vf:'+r.id,true);
  if(r.dayReview&&campaign.investigation){const inv=campaign.investigation;inv.dayVerify??={};inv.dayVerify[r.deduction]??={};const notes={D14:'田中确认照片中的旧友身份及共同记忆。',D15:'田中谈起那次约定。至于片山这趟来东京还做了什么，他没有提。',D16:'小林证实救护车曾从后门进入，日期与病患身份仍待核对。',D17:'森经理说不清那辆出租车是哪天来的。',D18:'佐藤提到，207号室的房号并不只有前台人员知道。',D19:'森经理承认两份记录存在出入，随后不再多说。',D20:'田中确认五份便当为了纪念昔日五人一起吃饭的时光。',D21:'田中记得片山曾打听旧友的去向，其他人的消息他也说不上来。'};const status=['D16','D17','D18','D19'].includes(r.deduction)?'尚未证实':'已证实';inv.dayVerify[r.deduction][r.npc]={status,detail:notes[r.deduction]||'已完成求证',at:nowPos(),npc:r.npc};
   // 严格按既有证据定义补强，不能凭孤立白天证词自动发证。
   const has=id=>!!inv.clues?.[id];let ev=null;
   if(r.deduction==='D14'&&has('C09'))ev='E07';
   if(r.deduction==='D15'&&has('C08')&&has('C09'))ev='E07';
   if(r.deduction==='D20'&&has('C07')&&has('C05'))ev='E05';
   if(r.deduction==='D16'&&has('C01')&&has('C03')&&CASE_FACTS.read().concealment)ev='E03';
   if(r.deduction==='D19'&&has('C03')&&has('C13')&&CASE_FACTS.read().access)ev='E02';
   if(ev&&window.INV){INV.grantEvidence(ev,'白天调查、酒店原始记录及'+r.npc+'的交叉求证');const links=inv.evidence[ev].confirmedBy??=[];if(!links.includes(r.deduction))links.push(r.deduction)}
  }

  if(r.evidence&&window.INV&&INV.grantEvidence(r.evidence,r.source||'')){const def=INV.evidence().find(x=>x.id===r.evidence),e=def&&REPORT6.material(def);toast('📁 报告材料已确认：'+r.evidence+'　'+(e?e.name:''))}
  save();if(r.npc==='tanaka'&&['D09','D14','D15','D20'].includes(r.deduction)&&ROOMFILE.available('lunch'))queueMicrotask(()=>ROOMFILE.film('lunch',null,true));
 }
 /* ---------- 和田中会面（后门） ---------- */
 function meet(){
  const a=last();if(a&&['open','meeting'].includes(status(a))&&a.state!=='met'){a.state='met';a.metAt=nowPos()}
  st().met=true;save();
  const c=[{t:'继续人物调查',fn:()=>H18.play('tn-hub',meet)},{t:'💬 普通交谈',fn:()=>H18.play('vf-tanaka-chat',meet)},{t:'🧩 出示调查推论',fn:()=>present('tanaka')}];
  if(H18.cond({flag:['caseDeath','clientKnown'],notFlag:'tanakaTold'}))c.push({t:'把调查结果告诉他（会面会就此结束）',fn:()=>H18.play('tanaka-tell',()=>endMeeting())});
  if(H18.cond({flag:'tanakaTold',notFlag:'tanakaPast',anyClue:['photo','camera','busid']}))c.push({t:'问他：您和片山先生，以前是怎样的朋友？（会面会就此结束）',fn:()=>H18.play('tanaka-past',()=>endMeeting())});
  c.push({t:'结束会面',fn:()=>H18.play('vf-tanaka-bye',()=>endMeeting())});
  DM.show(H18.host(),{who:'田中 震',sub:'港屋酒店后门',text:'田中把帽子拿在手里，等你开口。',choices:c});
 }
 function endMeeting(){const a=last();if(a&&a.state==='met')a.state='done';save();H18.endDialog()}
 function call(name){
  if(name==='meet'){meet();return}
  if(name.startsWith('present:')){present(name.slice(8));return}
  H18.endDialog();
 }
 /* ---------- 邮件 ---------- */
 const BODY=['田中先生：','我是正在调查港屋酒店207号室事件的调查员。','关于片山茂先生，有几件事情希望向您当面确认。','如果方便的话，希望能与您见面。'];
 function mails(){
  if(!campaign||!campaign.verify)return [];const out=[],s=st(),now=key(nowPos());
  s.appts.forEach((a,i)=>{
   out.push({id:'vf-send-'+a.n,from:'你 → 田中震',subject:'关于片山茂先生的调查',date:at(a.sent),tag:'已发送',lines:[{sys:'收件人：田中震 <'+CFG().email+'>'}].concat(BODY)});
   if(now>=key(a.reply)){const prev=s.appts[i-1],missed=prev&&prev.meet&&!prev.metAt;
    out.push({id:'vf-reply-'+a.n,from:'田中震',subject:'回复：关于片山茂先生的调查',date:at(a.reply),tag:'预约',lines:a.meet?
     [missed?'上次你没来。没关系，我知道调查不容易。':'邮件收到了。','关于片山的事，我也有一些话想说。','如果方便，请到港屋酒店后门来。','我会在那里等你。',{gap:true},{sys:'📅 约定：'+span(a.meet)+'　港屋酒店后门'},{sys:'（田中只在这段时间里等你。错过了可以再写一封信。）'}].concat(a.meet.day>=lastNight()?[{sys:'⚠ 这是调查期限的最后一夜（'+(window.CASE5?CASE5.deadlineText():'')+'截止）。'}]:[])
     :['邮件收到了。','这几天的夜班都排满了，实在抽不出时间。','……抱歉。']})}
  });
  return out;
 }
 function apptLine(){const a=active();if(!a)return last()&&status(last())==='missed'?'上一次约定已经错过了。可以再写一封信。':'';
  const t=status(a);if(t==='sent')return '已发送，等待田中的回信。';return a.meet?'约定：'+span(a.meet)+' · 港屋酒店后门'+(t==='open'||t==='meeting'?'（他现在就在后门等你）':''):''}
 function mailTop(){if(!hasContact())return '';const l=apptLine();
  return `<section class="rpg-panel vf-mailtop"><div><b>📇 联系人：田中震</b><small>${esc(CFG().email)}</small>${l?`<small>${esc(l)}</small>`:''}</div><button type="button" class="survival-btn" id="vf-compose">✉ 联系田中震</button></section>`}
 function mailBind(){const b=app.querySelector('#vf-compose');if(b)b.onclick=compose}
 function compose(){
  if(!hasContact())return;const ok=canSend();
  UI.page('mail','写邮件','MAIL · 联系田中震',`<section class="rpg-panel mail-view"><div class="mail-head"><p><small>收件人</small><b>田中震 &lt;${esc(CFG().email)}&gt;</b></p><p><small>主题</small><b>关于片山茂先生的调查</b></p></div>
   <div class="mail-body">${BODY.map(t=>`<p>${esc(t)}</p>`).join('')}</div>
   <button type="button" class="survival-btn" id="vf-send" ${ok?'':'disabled'}>发送邮件</button>
   <p class="survival-tip">${ok?'田中上夜班，回信要等一会儿。回信里会写明见面的时间。':'已经有一个有效的约定：'+esc(apptLine())}</p></section>`);
  const bk=app.querySelector('#et-back');if(bk)bk.onclick=()=>MAIL.page();
  const sb=app.querySelector('#vf-send');if(sb)sb.onclick=()=>{if(send()){toast('✉ 邮件已发送给田中震');MAIL.page()}};
 }
 function send(){
  if(!campaign||!canSend())return false;const s=st();s.n++;const sent=nowPos(),p=plan(sent);
  const a={n:s.n,sent,reply:p.reply,meet:p.meet,state:'sent'};s.appts.push(a);
  campaign.mailRead??={};campaign.mailRead['vf-send-'+a.n]=true;
  save();return true;
 }
 /* ---------- 人物档案（FILE 02）里的联系人 ---------- */
 function peopleCard(){if(!campaign||!hasContact())return '';const a=active(),l=last();
  const place=a&&a.meet?'港屋酒店后门（'+span(a.meet)+'）':(st().met?'港屋酒店后门':'尚未确定');
  return `<div class="et-rel vf-contact"><b>田中 震</b><small>片山茂的老朋友</small><span>联系状态：已获得邮箱</span><span>会面地点：${esc(place)}</span></div>`}
 /* ---------- 开发者工具（线索调查页面最下面，#dev=1） ---------- */
 function devHtml(){
  const s=campaign?st():{},a=campaign?last():null;
  return `<h3>🛠 第二阶段：NPC 求证</h3><div class="inv-pickers">${[['clues','获得田中相关测试线索'],['deds','解锁相关推论 D08 D09 D10'],['koba','解锁小林求证（准备好推论 D08）'],['contact','模拟获得田中邮箱'],['send','模拟发送预约邮件'],['jump','跳转至预约时间'],['door','传送到酒店后门'],['reset','重置预约与求证状态'],['ev','模拟获得 E05 E07 E08']].map(([k,t])=>`<button type="button" class="rpg-action" data-vdev="${k}">${t}</button>`).join('')}</div>
   <p class="survival-tip">联系人：${hasContact()?'有':'无'} · 预约：${a?esc(status(a)+(a.meet?' '+span(a.meet):'')):'无'} · 已完成求证：${esc(Object.keys(s.done||{}).join('、')||'无')} · 现在：${campaign?esc(at(nowPos())):''}</p>`}
 function devBind(){app.querySelectorAll('[data-vdev]').forEach(b=>b.onclick=()=>{dev(b.dataset.vdev);if(window.INV)INV.page()})}
 function ensureHotel(){if(window.H18&&campaign)try{H18.cond({})}catch(e){}}
 function dev(k){
  if(!campaign)return;ensureHotel();const s=st();
  if(k==='clues')['C05','C07','C08','C09','C10','C11'].forEach(id=>INV.addClue(id,true));
  if(k==='deds'||k==='koba'){const want=k==='koba'?['D08']:['D08','D09','D10'];want.forEach(id=>{const d=INV.deductions().find(x=>x.id===id);if(!d)return;d.pair.forEach(c=>INV.addClue(c,true));INV.combine(d.pair[0],d.pair[1])})}
  if(k==='contact')setFlag('tanakaContact',true);
  if(k==='send'){setFlag('tanakaContact',true);send()}
  if(k==='jump'){const a=active();if(a&&a.meet){const v=v18();campaign.day=Math.max(campaign.day,a.meet.day);v.clockDay=campaign.day;v.clock=a.meet.from;v.flags['tonight:entered']=true;if(H18.active())H18.resync()}}
  if(k==='door'){const go=()=>H18.teleport('alley',3,2);if(H18.active())go();else{H18.start();setTimeout(go,400)}}
  if(k==='reset'){s.done={};s.appts=[];s.contacts={};s.met=false;s.n=0;const f=flags();if(f)Object.keys(f).filter(x=>x==='tanakaContact'||x==='tanakaMet'||x.startsWith('vf:')).forEach(x=>delete f[x]);
   const inv=campaign.investigation;if(inv&&inv.evidence)['E05','E07','E08'].forEach(e=>delete inv.evidence[e])}
  if(k==='ev')['E05','E07','E08'].forEach(e=>INV.grantEvidence(e,'开发者测试'));
  save();
 }
 /* ---------- 接入 ---------- */
 function hookSave(){if(typeof campaignSave!=='function'||baseSave)return;baseSave=campaignSave;campaignSave=function(){const r=baseSave.apply(this,arguments);try{if(campaign&&sync())baseSave()}catch(e){console.error(e)}return r}}
 hookSave();
 setTimeout(()=>{if(window.MAIL&&MAIL.extend)MAIL.extend({mails,top:mailTop,bind:mailBind})},0); // 99-mail.js 在后面加载
 function fieldRule(did,npc){return campaign?.investigation?.deductions?.[did]?ruleFor(did,npc):null}
 function fieldConfirm(did,npc){const r=fieldRule(did,npc);if(!r||st().done[r.id])return false;complete(r);return true}
 return {fieldRule,fieldConfirm,call,present,choose,meet,send,compose,plan,status:()=>status(last()),active,last,nowPos,sync,peopleCard,devHtml,devBind,dev,canSend,hasContact,
  state:()=>campaign&&campaign.verify,rules:()=>VD().rules||[],_t:{span,at}};
})();
window.VERIFY=VERIFY;
