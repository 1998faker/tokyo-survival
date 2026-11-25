/* ==== engine/survival/97zu-v74-items-work.js ==== */
/* v74 道具系统与打工收益（数值在 GAME_CONFIG.v74，见 97zs0-v74-config.js）
   - 背包「随身用品」：带走的饭团 / 饮料、旅人赠送的饭团 / 饮料、湿巾、创可贴、暖贴、怪谈小册、录音带、随身听 —— 主动使用才生效，用一次消耗一份
   - 异常遭遇加成：同时只能有一种（换别的会先问）；只在夜里街区真的掷出「异常遭遇」判定时用掉（成功失败都算一次）；到第二天作废；概率最高 100%
     （判定位置：STREET_WALK 的 step，原有的开放条件、冷却、每站每日次数都不变）
   - 药妆店提神剂：今天 +1 次行动（只能用于调查 / 走访 / 休整），压力 +，每日一次，午夜作废
   - 打工道具：接客研修套装 / 仓库作业腰包 / 深夜作业套装 —— 正常完成对应手动班次时发道具津贴；快速打工、提前离班、重复进结算页都不发
   - 首次完整便利店收银班、首次完整仓库班之后的前辈对话（每个存档一次）
   存档：campaign.v74 = { used:{物品:{day,n}}, boost:{day,pct,src,label}, boostLog:[], stim:{day,left}, senpai:{konbini,warehouse} } */
const V74=(function(){
 const CF=()=>GAME_CONFIG.v74;
 const yen=n=>'¥'+Math.round(n).toLocaleString('ja-JP');
 const night=()=>{try{return !!(window.EXPLORE&&EXPLORE.night())}catch(e){return false}};
 function S(){if(!campaign)return null;const s=campaign.v74??={};s.used??={};s.senpai??={};s.boostLog??=[];return s}
 const bag=()=>campaign.items??={};
 const has=id=>!!(campaign&&campaign.items&&campaign.items[id]>0);
 const PACKS=[['取扱注意','小心轻放','加缓冲垫'],['冷蔵','冷藏','送入冷藏台'],['天地無用','禁止倒置','直立固定']];

 /* ---------- 背包里显示的名字 / 说明 ---------- */
 function reg(){const C=CF();
  const put=(id,icon,name,desc)=>{const it=ITEMS.find(x=>x.id===id);if(it){if(desc)it.desc=desc;return}ITEMS.push({id,icon,name,desc})};
  for(const r of C.shop){const x=r[8]||{};if(x.item){const u=C.use[x.item];put(x.item,r[7],(u&&u.name)||(r[1]+'（'+r[2]+'）'),(u&&u.desc)||x.desc)}}
  put('wm-battery','🔋','5 号电池（随身听专用 · 剩余次数）','随身听专用的电池。数字是还能开几次随身听。和手电筒的乾電池不通用。');
  for(const id in C.use){const u=C.use[id];put(id,u.icon,u.name,u.desc)}
  for(const k in C.kits){const K=C.kits[k];put(K.id,K.icon,K.name,K.desc)}
 }

 /* ---------- 每日次数 ---------- */
 const today=key=>{const u=S().used[key];return u&&u.day===campaign.day?u.n:0};
 function mark(key){const s=S(),u=s.used[key];if(!u||u.day!==campaign.day)s.used[key]={day:campaign.day,n:1};else u.n++}
 function apply(fx,reason){const out=[],a={};if(fx.hp)a.hp=fx.hp;if(fx.stress)a.stress=fx.stress;if(a.hp||a.stress)out.push(GS.change(a,reason));if(fx.san)out.push(GS.change({san:fx.san},reason));return out.filter(Boolean).join(' · ')}
 function fxText(fx){return [fx.hp?'疲劳点 '+(fx.hp>0?'+':'')+fx.hp:'',fx.stress?'压力 '+(fx.stress>0?'+':'')+fx.stress:'',fx.san?'SAN '+(fx.san>0?'+':'')+fx.san:''].filter(Boolean).join('，')}

 /* ---------- 异常遭遇加成 ---------- */
 function boost(){const s=S();if(!s)return null;const b=s.boost;if(b&&b.day!==campaign.day){delete s.boost;return null}return b||null}
 /* 先确认（已有加成时问要不要替换），确认后才扣物品、扣 SAN */
 function setBoost(src,pct,label,pay){
  const go=()=>{if(pay&&pay()===false)return;S().boost={day:campaign.day,pct,src,label};campaignSave();UI.toast('今晚下一次可能遇见异常时，遭遇概率 +'+pct+'%');if(UI.current&&UI.current()==='bag')UI.go('bag')};
  const cur=boost();
  if(cur){UI.modal({title:'替换异常加成？',html:`<p>你现在已经有一种加成：<b>${esc(cur.label)}</b>（下一次异常遭遇概率 +${cur.pct}%）。</p><p>同时只能有一种。换成「${esc(label)}」（+${pct}%）吗？原来的加成会作废。</p>`,buttons:[{label:'替换',primary:true,fn:go},{label:'先不用'}]});return}
  go()}
 /* STREET_WALK.step 在夜里掷「异常遭遇」判定时调用：有加成就用掉（不论成败），返回加成后的概率 */
 function anomalyRoll(chance){const b=boost();if(!b)return chance;const s=S(),fin=Math.min(1,Math.round((chance+b.pct/100)*1e6)/1e6);delete s.boost;s.boostLog.push({day:campaign.day,src:b.src,base:Math.round(chance*1000)/1000,final:Math.round(fin*1000)/1000});if(s.boostLog.length>30)s.boostLog.shift();campaignSave();return fin}

 /* ---------- 提神剂 ---------- */
 function stim(){const s=S();const t=s&&s.stim;return t&&t.day===campaign.day?t:null}
 const extraLeft=()=>{const t=campaign&&stim();return t?t.left:0};
 const extraFor=type=>extraLeft()>0&&CF().stim.allow.includes(type);
 function useExtra(){const t=stim();if(t&&t.left>0){t.left--;campaignSave();UI.update&&UI.update();return true}return false}
 function buyStim(name){const C=CF().stim;if(stim()){UI.toast('今天已经喝过提神剂了。');return}
  if(campaign.cash-C.cost<=0){UI.modal({title:'现金不够',text:'提神剂要 '+yen(C.cost)+'，付完不能一分不剩。'});return}
  campaign.cash-=C.cost;S().stim={day:campaign.day,left:C.extra};const r=apply({stress:C.stress},'提神剂');campaignSave();UI.update&&UI.update();
  UI.modal({title:'💊 '+C.name,html:`<p>苦得发涩。心跳快了一点，脑子也清醒了。</p><p>今天多 ${C.extra} 次行动（只能用于调查、走访和休整，不能打工）。午夜之前没用掉就没了。</p><p class="rpg-tiny">${esc(yen(C.cost))} · ${esc(r||'')}</p>`,buttons:[{label:'好',primary:true,fn:()=>{try{openFacility('potion',name||'薬局')}catch(e){}}}]})}

 /* ---------- 背包：随身用品 ---------- */
 function canUse(id){const C=CF(),u=C.use[id];if(!has(id))return '没有了';
  if(u&&u.perDay&&today(id)>=u.perDay)return '今天已用 '+u.perDay+' 次';
  if(id==='walkman'){if(!night())return '夜里（18:00 以后）才能开';if(today('walkman')>=1)return '今天已经开过';if(!has('wm-battery'))return '没有随身听电池'}
  return ''}
 function useItem(id){const C=CF(),u=C.use[id];const why=canUse(id);if(why){UI.toast(why);return}
  const A=C.anomaly,it=ITEMS.find(x=>x.id===id)||{name:id};
  if(u){const fx=(u.night&&night())?u.night:u.fx;bag()[id]--;mark(id);const r=apply(fx,'使用 '+(it.name||id));campaignSave();UI.toast((it.icon||'')+' '+(it.name||id)+'：'+(r||fxText(fx)));UI.go('bag');return}
  if(id==='kaidan-map'){setBoost('booklet',A.booklet,'怪谈路线小册',()=>{bag()[id]--;mark(id)});return}
  if(id==='odd-tape'){UI.modal({title:'📼 播放来路不明的录音带？',html:`<p>播放后理智 ${A.tapeSan}。今晚下一次可能遇见异常时，遭遇概率提高 ${A.tape} 个百分点。例如原本是 10%，使用后会变成 ${10+A.tape}%。</p>`,buttons:[{label:'播放',primary:true,fn:()=>setBoost('tape',A.tape,'来路不明的录音带',()=>{bag()[id]--;mark(id);apply({san:A.tapeSan},'来路不明的录音带');UI.modal({title:'📼 ……',html:'<p>磁带转了很久，只有沙沙的底噪。快到结尾时，有人在很远的地方报站名——那个站名你没听过。</p>'})})},{label:'先不听'}]});return}
  if(id==='walkman'){setBoost('walkman',A.walkman,'旧式磁带随身听',()=>{bag()['wm-battery']--;mark('walkman')});return}
 }
 const ORDER=['kf-onigiri','kf-ume','kf-tuna','omi-onigiri','kf-tea','kf-water','kf-cancoffee','kf-energy','kf-sports','omi-drink','wipes','bandage','kairo','kaidan-map','odd-tape','walkman'];
 function attachBag(){const host=app.querySelector('.et-page');if(!host||!campaign)return;
  const list=ORDER.filter(has),b=boost(),t=stim();if(!list.length&&!b&&!t&&!has('wm-battery'))return;
  const verb=id=>id==='kaidan-map'?'阅读':id==='odd-tape'?'播放':id==='walkman'?'开启':/^kf-|omi-/.test(id)?(/onigiri|ume|tuna/.test(id)?'吃':'喝'):'使用';
  const sec=document.createElement('section');sec.className='rpg-panel v74-bag';
  sec.innerHTML='<h2>🍙 随身用品</h2>'+(b?`<p class="v74-st">👁 异常加成：<b>${esc(b.label)}</b>　今晚下一次可能遇见异常时，遭遇概率 +${b.pct}%（第二天作废）</p>`:'')+(t?`<p class="v74-st">💊 提神剂：今天还有 ${t.left} 次额外行动（只用于调查、走访、休整）</p>`:'')
   +list.map(id=>{const it=ITEMS.find(x=>x.id===id)||{},why=canUse(id);return `<div class="et-item"><span class="et-item-ic">${it.icon||'·'}</span><div><b>${esc(it.name||id)}${bag()[id]>1?' ×'+bag()[id]:''}</b><small>${esc(it.desc||'')}</small>${id==='walkman'?`<small>随身听电池：剩 ${bag()['wm-battery']||0} 次</small>`:''}</div><button type="button" class="rpg-action" data-v74use="${id}" ${why?'disabled':''} title="${esc(why)}">${verb(id)}${why?'（'+esc(why)+'）':''}</button></div>`}).join('');
  const secs=host.querySelectorAll('section');if(secs[1])secs[1].after(sec);else host.appendChild(sec);
  sec.querySelectorAll('[data-v74use]').forEach(x=>x.onclick=()=>useItem(x.dataset.v74use))}

 /* ---------- 打工道具 ---------- */
 const owns=k=>has(CF().kits[k].id);
 const allowance=k=>owns(k)?CF().kits[k].allowance:0;
 const starText=k=>(CF().stars[k]||[]).slice(1).map((v,i)=>'★'.repeat(i+1)+' '+yen(v)).join(' / ');
 function kitButton(k){const K=CF().kits[k];return `<button type="button" class="survival-btn alt" data-v74kit="${k}">${K.icon} ${esc(K.name.split('（')[0])} · ${owns(k)?'已持有（每班津贴 +'+yen(K.allowance)+'）':yen(K.price)+'（每班津贴 +'+yen(K.allowance)+'）'}</button>`}
 const REFRESH={konbini:()=>KONBINI.intro(),warehouse:()=>WAREHOUSE.intro(),night:()=>{}};
 function bindKit(rootEl,k){(rootEl||app).querySelectorAll('[data-v74kit="'+k+'"]').forEach(b=>b.onclick=e=>{e.stopPropagation();kitPage(k,REFRESH[k])})}
 function kitPage(k,after){const K=CF().kits[k],own=owns(k);
  UI.modal({title:K.icon+' '+K.name,html:`<p>${esc(K.desc)}</p><div class="et-grid"><div><small>价格</small><b>${yen(K.price)}</b></div><div><small>对应班次</small><b>${esc(K.shift)}</b></div><div><small>正常完成一班的道具津贴</small><b>+${yen(K.allowance)}</b></div></div><p class="rpg-tiny">可重复使用。买入后第一次正常完成对应班次，单靠道具津贴就能回本；第二次起开始赚钱。津贴和星级 / 表现奖金叠加，每班只结算一件道具。快速打工、提前离班不发。</p>${own?'<p>✅ 你已经有这一套了。</p>':''}`,
   buttons:own?[{label:'好',primary:true,fn:after}]:[{label:'买下（'+yen(K.price)+'）',primary:true,fn:()=>{buyKit(k);if(after)after()}},{label:'下次再看',fn:after}]})}
 function buyKit(k){const K=CF().kits[k];if(owns(k))return false;
  if(campaign.cash-K.price<=0){UI.modal({title:'现金不够',text:'买下这一套需要 '+yen(K.price)+'，付完不能一分不剩。'});return false}
  campaign.cash-=K.price;bag()[K.id]=1;campaignSave();UI.update&&UI.update();UI.toast(K.icon+' 已买下：'+K.name);return true}

 /* ---------- 首次完工后的前辈 ---------- */
 const SENPAI={
  konbini:{scene:'工资结算完，前辈在收银台边把一张磨白了边的卡片递过来。',kit:'konbini',lines:[
   ['前辈','お疲れ。次もレジに入るなら、これ、見とくと楽だよ。','辛苦了。下次还排收银的话，可以先看看这个，做起来轻松点。'],
   ['你','……返品と宅配便？','……退货和寄快递？'],
   ['前辈','そう。宅配便なんか、送り状を渡された瞬間に何から聞くんだっけってなるから。私も最初、レジの脇でよく見てたよ。','对。尤其是寄快递，人家把运单一递过来，我就忘了该先问什么。我刚来那阵也老在收银台边偷瞄。'],
   ['你','これ、自分で作ったんですか？','这是你自己做的？'],
   ['前辈','研修セットに入ってたやつ。買うかちょっと迷ったけど、手当がついた一回目のシフトで、ちょうど元が取れたよ。','培训套装里带的。我买的时候也犹豫了一下。后来打一班拿到津贴，刚好把钱赚回来。']]},
  warehouse:{scene:'交班铃响，带班前辈把扫码器放回充电座。',kit:'warehouse',lines:[
   ['前辈','お疲れ。マーカー、そこに置いといて。次の人も使うから。','辛苦了。记号笔放那儿吧，下一班的人还要用。'],
   ['你','はい。箱が増えると、道具がどこにあるか分かんなくなりますね。','好。箱子一多，还真容易找不着工具。'],
   ['前辈','でしょ。私はよく使うやつだけ、こっち。カッターもマーカーも、手探りで取れるから。','是吧。我把常用的几件都搁这儿。开箱刀、记号笔，伸手一摸就能拿到。'],
   ['动作','前辈拍了拍腰侧的工具包。'],
   ['你','それ、みんな自分で買ってるんですか？','这个得自己买吗？'],
   ['前辈','欲しい人だけね。私も最初は迷ったけど、一回分の手当で元は取れたよ。また入るなら、受付で聞いてみな。','想用的人自己买。我一开始也犹豫，后来一班的津贴就回本了。你下次还来，可以去登记处问问。']]}
 };
 function senpai(k){const s=S();if(!s||s.senpai[k])return false;s.senpai[k]=campaign.day;campaignSave();
  const D=SENPAI[k],K=CF().kits[k];let i=0;
  const step=()=>{const L=D.lines[i],last=i===D.lines.length-1;
   const html=(i===0?`<p class="rpg-tiny">${esc(D.scene)}</p>`:'')+(L[0]==='动作'?`<p class="v74-act">（${esc(L[1])}）</p>`:`<p><b>${esc(L[0])}</b>「<span lang="ja" translate="no">${esc(L[1])}</span>」</p><p class="v74-zh">“${esc(L[2])}”</p>`);
   UI.modal({title:'💬 前辈',html,buttons:last?[{label:'查看'+K.name.split('（')[1].replace('）',''),primary:true,fn:()=>kitPage(k)},{label:'下次再看'}]:[{label:'▶ 继续',primary:true,fn:()=>{i++;step()}}]})};
  setTimeout(step,250);return true}

 /* ---------- 上班时的道具提示（每班一次） ---------- */
 const CARD=[['退货','返品ですね。レシートはお持ちですか。','退货是吧。您带小票了吗？'],['退货','恐れ入りますが、開封済みの商品は返品できません。','不好意思，已经拆封的商品不能退。'],
  ['寄快递','宅配便ですね。送り状はご記入済みですか。','寄快递是吧。运单填好了吗？'],['寄快递','中身は何ですか。割れ物は入っていますか。','里面是什么？有易碎品吗？'],['寄快递','お届けのご希望日時はありますか。','有希望送达的日期和时间吗？'],
  ['加热','温めますか。','要加热吗？'],['袋子','袋はご利用ですか。','需要袋子吗？']];
 function konbiniCard(){const s=KONBINI.state();if(!s||s.v74hint)return;s.v74hint=true;campaignSave();
  UI.modal({title:'🧾 接客卡（本班只看这一次）',html:'<p class="rpg-tiny">磨白了边的卡片，正面是退货和寄快递，背面是几句常用的。</p>'+CARD.map(c=>`<p><small>${esc(c[0])}</small>　<span lang="ja" translate="no">「${esc(c[1])}」</span><br><span class="v74-zh">${esc(c[2])}</span></p>`).join(''),buttons:[{label:'收好卡片，继续收银',primary:true}]})}
 function warehouseHint(){const s=campaign&&campaign.warehouse&&campaign.warehouse.active;if(!s||s.v74hint)return;const p=s.item;
  if(!p||p.phase!=='pack'||!(p.special>=0)){UI.toast('👝 这件不用特别包装。等贴着运输标签的包裹到包装台，再摸腰包看提示。');return}
  const P=PACKS[p.special];s.v74hint=true;campaignSave();const t='👝 腰包里的小卡：「'+P[0]+'」（'+P[1]+'）→ '+P[2]+'。';UI.toast(t);const m=document.querySelector('.wh-panel [data-message]');if(m)m.textContent=t}
 setInterval(()=>{try{if(!campaign)return;
  if(window.KONBINI&&KONBINI.active()&&owns('konbini')){const s=KONBINI.state();const host=document.querySelector('.kbs-hud')||document.getElementById('kb-root');
   if(host&&s&&!s.v74hint&&!host.querySelector('.v74-hint')){const b=document.createElement('button');b.type='button';b.className='v74-hint';b.textContent='🧾 接客卡（本班 1 次）';b.onclick=e=>{e.stopPropagation();konbiniCard();b.remove()};host.appendChild(b)}}
  const w=campaign.warehouse&&campaign.warehouse.active;
  if(w&&owns('warehouse')&&!w.v74hint){const host=document.querySelector('.wh-panel header');if(host&&!host.querySelector('.v74-hint')){const b=document.createElement('button');b.type='button';b.className='story-btn v74-hint';b.textContent='👝 腰包提示（本班 1 次）';b.onclick=e=>{e.stopPropagation();warehouseHint();if(campaign.warehouse.active&&campaign.warehouse.active.v74hint)b.remove()};host.appendChild(b)}}
 }catch(e){}},600);

 /* ---------- 接到原有系统 ---------- */
 function install(){reg();
  /* 提神剂的额外行动：普通行动用完以后，调查 / 走访 / 休整可以用它；打工不行 */
  const baseSpend=spendAction;spendAction=function(type){
   if(campaign&&campaign.actions<=0&&extraLeft()>0){
    if(extraFor(type)){dayDefaults();if(campaign.hp<=0||campaign.san<=0||campaign.cash<=0)return false;if(!V51.action(type))return false;useExtra();UI.toast('💊 用掉了提神剂的额外行动');return true}
    if(type==='work'){UI.modal({title:'提神剂的额外行动不能打工',text:'今天的普通行动已经用完。提神剂多出来的行动只能用于调查、走访和休整。'});return false}}
   return baseSpend.apply(this,arguments)};
  /* 药妆店（薬局 / ドラッグストア）：加一行提神剂 */
  const baseFac=openFacility;openFacility=function(type,name){const r=baseFac.apply(this,arguments);
   if(type==='potion'&&campaign){const box=document.getElementById('district-chat');if(box&&!box.querySelector('.v74-stim')){const C=CF().stim,t=stim();
    const b=document.createElement('button');b.className='rpg-action v74-stim';b.textContent='💊 '+C.name+' '+C.cost+'円（今日行动 +'+C.extra+' · 限调查 / 走访 / 休整 · 压力 +'+C.stress+(t?' · 今天已喝过':' · 每日一次')+'）';b.disabled=!!t||campaign.cash<=C.cost;b.onclick=()=>buyStim(name);box.appendChild(b);
    const p=document.createElement('p');p.className='rpg-tiny';p.textContent=C.desc;box.appendChild(p)}}
   return r};
  /* 酒店夜勤入口下面：深夜作业套装 */
  const baseNSB=nightShiftButton;nightShiftButton=function(box){baseNSB.apply(this,arguments);const b=document.createElement('button');b.className='rpg-action';const K=CF().kits.night;b.textContent=K.icon+' '+K.name.split('（')[0]+' · '+(owns('night')?'已持有（夜勤津贴 +'+yen(K.allowance)+'）':yen(K.price)+'（夜勤津贴 +'+yen(K.allowance)+'）');b.onclick=()=>kitPage('night',()=>{try{openFacility('sleep','駅前の宿')}catch(e){}});box.appendChild(b)};
  if(!document.getElementById('v74-css')){const st=document.createElement('style');st.id='v74-css';st.textContent=`
.ks-chip .ks-carry{width:auto!important;min-width:0;padding:0 6px!important;font-size:11px;white-space:nowrap}
.v74-bag .et-item{align-items:center}.v74-bag .et-item>div{flex:1}.v74-bag .rpg-action{width:auto;white-space:nowrap}
.v74-st{margin:.2rem 0;padding:.3rem .5rem;border-left:3px solid #c9a86a;background:rgba(201,168,106,.08)}
.v74-zh{color:var(--sub,#9aa5bf)}.v74-act{color:var(--sub,#9aa5bf);font-style:italic}
.v74-hint{font-size:12px;padding:2px 8px;border-radius:6px;border:1px solid #c9a86a;background:#3a2f16;color:#ffe1a0;cursor:pointer}`;document.head.appendChild(st)}
 }
 return {install,anomalyRoll,boost,extraLeft,extraFor,useExtra,owns,allowance,starText,kitButton,bindKit,kitPage,buyKit,senpai,attachBag,useItem,canUse,_S:S};
})();
window.V74=V74;
V74.install();

