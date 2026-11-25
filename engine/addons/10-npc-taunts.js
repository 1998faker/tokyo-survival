
/* ==== engine/addons/10-npc-taunts.js ==== */
/* ===================================================================
   V16 — 随机路人 NPC 嘲讽系统（NPC Taunt System）
   本区块独立于剧情、题库、存档：只在「答错」时显示一张小型暗色对话卡。
   不扣 疲劳点、不扣 SAN、不写入任何存档。
   结构：① 配置常量 ② NPC 数据 ③ 事件逻辑 ④ UI 渲染 ⑤ 答题接入
   =================================================================== */
window.NpcTaunts=(function(){
'use strict';

/* ===== ① 配置常量（调整概率改这里） ===== */
const CFG=(window.GAME_CONFIG&&GAME_CONFIG.npcTaunts)||{};
const CONFIG={
 chanceByStreak:CFG.chanceByStreak||{1:0.20,2:0.35,3:0.50},
 maxMaliceByStreak:CFG.maxMaliceByStreak||{1:2,2:3,3:3},
 noRepeatWindow:CFG.noRepeatWindow!=null?CFG.noRepeatWindow:5,
 ambientChance:CFG.ambientChance!=null?CFG.ambientChance:0.45,
 // 当前启用的台词类别；以后可加入 friendly（友善）、eldritch（克苏鲁异变）
 enabledTones:CFG.enabledTones||["hostile"],
 disclaimer:""
};
const MALICE_LABEL={1:'普通',2:'阴阳怪气',3:'恶意'};

/* ===== ② NPC 数据 =====
   type   ：NPC 类型（显示在卡片抬头）
   scenes ：可出现的场景（station / airport / izakaya / restaurant / shop / hotel / street）
   jp / zh：日语台词与中文翻译
   malice ：恶意程度 1~3
   tone   ：台词类别，默认 'hostile'；以后可新增 'friendly' / 'eldritch'          */
/* 台词数据在 story/npc-taunts.json，概率在 config/game.json 的 npcTaunts 部分 */
const TAUNT_DATA=(window.GAME_DATA&&GAME_DATA.story&&GAME_DATA.story.taunts)||{taunts:[],ambient:{}};
const npcTaunts=TAUNT_DATA.taunts;
const npcAmbient=TAUNT_DATA.ambient;

/* ===== ③ 事件逻辑（与 UI、数据分离） ===== */
let streak=0;          // 当前连续答错次数（只存在内存中，不写存档）
const recent=[];       // 最近出现过的台词 id

function chanceFor(n){let c=0;for(const k of Object.keys(CONFIG.chanceByStreak).map(Number).sort((a,b)=>a-b))if(n>=k)c=CONFIG.chanceByStreak[k];return c}
function maxMaliceFor(n){let m=1;for(const k of Object.keys(CONFIG.maxMaliceByStreak).map(Number).sort((a,b)=>a-b))if(n>=k)m=CONFIG.maxMaliceByStreak[k];return m}
function pickLine(scene){
 const maxM=maxMaliceFor(streak);
 let pool=npcTaunts.filter(t=>CONFIG.enabledTones.includes(t.tone)&&t.malice<=maxM&&t.scenes.includes(scene));
 if(!pool.length)pool=npcTaunts.filter(t=>CONFIG.enabledTones.includes(t.tone)&&t.malice<=maxM&&t.scenes.includes('street'));
 const bias=t=>/外国|日本人|日本だ|国へ|中国|国籍|日本語|観光客/.test(t.jp);const wantBias=Math.random()<.7;const tonePool=pool.filter(t=>bias(t)===wantBias);if(tonePool.length)pool=tonePool;
 // 优先选最近没出现过的；都出现过时，选「最久没出现」的那条，保证不会连续重复
 const fresh=pool.filter(t=>!recent.includes(t.id));
 const lastSeen=t=>recent.lastIndexOf(t.id);
 const list=fresh.length?fresh:pool.filter(t=>lastSeen(t)===Math.min(...pool.map(lastSeen)));
 const line=list[Math.floor(Math.random()*list.length)];
 if(!line)return null;
 recent.push(line.id);while(recent.length>CONFIG.noRepeatWindow)recent.shift();
 return line;
}
/** 答题结果入口：correct=true 重置连错；false 时按概率返回一个事件对象或 null */
function onAnswer(correct,scene){
 if(correct){streak=0;return null}
 streak++;
 if(scene==='hotel'||scene==='room'||scene==='room206')return null;
 if(Math.random()>=(window.OMI?OMI.prob(chanceFor(streak),'hostile'):chanceFor(streak)))return null;
 const sc=scene||'street';
 const line=pickLine(sc);if(!line)return null;
 const amb=Math.random()<CONFIG.ambientChance&&npcAmbient[sc]?npcAmbient[sc][Math.floor(Math.random()*npcAmbient[sc].length)]:'';
 return {line,ambient:amb,scene:sc,streak};
}

/* 场景判定：题库分类 / 文本关键词 → NPC 场景 */
const CATEGORY_SCENE={train:'station',airport:'airport',izakaya:'izakaya',music:'izakaya',food:'restaurant',ramenv:'restaurant',washoku:'restaurant',ramen:'restaurant',conv:'shop',drug:'shop',shop:'shop',anime:'shop',hotel:'hotel',help:'street',disney:'street'};
function sceneFromCategory(id){if(!id)return 'street';if(CATEGORY_SCENE[id])return CATEGORY_SCENE[id];if(/^shop/.test(id))return 'shop';return 'street'}
function sceneFromText(t){t=t||'';
 if(/ホテル|酒店|フロント|旅館/.test(t))return 'hotel';
 if(/空港|机场|Airport/i.test(t))return 'airport';
 if(/居酒屋|歌舞伎町|新宿|バー|酒吧/.test(t))return 'izakaya';
 if(/駅|ホーム|電車|券売機|站|エクスプレス|線/.test(t))return 'station';
 if(/ラーメン|食堂|餐|拉面/.test(t))return 'restaurant';
 return 'street'}

/* ===== ④ UI 渲染：复用原有 .npc-taunt 卡片样式，加 mini 修饰 ===== */
function render(ev,container,after){
 if(!ev||!container)return null;
 const old=container.querySelector('.npc-taunt--mini');if(old)old.remove();
 const el=document.createElement('div');
 el.className='npc-taunt npc-taunt--mini npc-malice-'+ev.line.malice;
 el.setAttribute('role','status');
 el.innerHTML='<div class="npc-taunt-head">💬 '+esc(ev.line.type)+' · '+MALICE_LABEL[ev.line.malice]+(ev.streak>=2?' · 连错 '+ev.streak:'')+'</div>'+
  '<div class="npc-taunt-line" lang="ja">「'+esc(ev.line.jp)+'」</div>'+
  '<div class="npc-taunt-zh">'+esc(ev.line.zh)+'</div>'+
  (ev.ambient?'<div class="npc-taunt-amb">'+esc(ev.ambient)+'</div>':'')+
  '';
 if(after&&after.parentNode===container)after.insertAdjacentElement('afterend',el);else container.appendChild(el);
 return el;
}
/** 便捷函数：结算一次答题并在 container 中（after 节点之后）显示卡片 */
function handle(correct,scene,container,after){const ev=onAnswer(correct,scene);if(ev)render(ev,container,after);return ev}

return {CONFIG,npcTaunts,npcAmbient,onAnswer,render,handle,sceneFromCategory,sceneFromText,
 get streak(){return streak},reset(){streak=0;recent.length=0}};
})();

/* ===== ⑤ 答题接入（最小改动：包装现有判定函数，不改原逻辑） ===== */
(function(){
 const NT=window.NpcTaunts;
 // (a) 主题库答题 pick(k)：判定 k===q.a，反馈写入 #fb
 const basePick=pick;
 pick=function(k){
  if(st.ans)return basePick(k);
  const q=st.list&&st.list[st.i];
  if(!q||!Number.isInteger(k)||k<0||k>=q.o.length)return basePick(k);
  basePick(k);
  const fb=document.getElementById('fb');
  NT.handle(k===q.a,NT.sceneFromCategory(q.s),fb,fb&&fb.querySelector('.fb'));
 };
 // (b) 场景对话练习 demoAnswer(i)：反馈写入 #demo-feedback
 if(typeof demoAnswer==='function'){
  const baseDemo=demoAnswer;
  demoAnswer=function(i){
   const d=demoState;if(!d||d.answered||!d.options||!d.options[i])return baseDemo(i);
   const correct=!!d.options[i].correct,scene=d.list[d.i].scene;
   baseDemo(i);
   const box=document.getElementById('demo-feedback');
   NT.handle(correct,scene==='izakaya'?'izakaya':'restaurant',box,box&&box.querySelector('.fb'));
  };
 }
 // (c) 第一天机场主线、主线章节选择题：按钮由原代码绑定 onclick，这里在冒泡阶段读取结果
 document.addEventListener('click',function(e){
  const b=e.target.closest&&e.target.closest('[data-day1-answer],[data-story-answer]');if(!b)return;
  const isDay1=b.hasAttribute('data-day1-answer');
  const box=document.getElementById(isDay1?'day1-feedback':'story-feedback');if(!box)return;
  const wrong=box.querySelector('.fb.ng');
  const ctxText=isDay1?((document.querySelector('.day1-quest .survival-box .rpg-kicker')||{}).textContent||''):((document.querySelector('.story-panel .story-meta')||{}).textContent||'');
  if(!wrong&&!box.querySelector('.fb.ok,.story-clue'))return;
  NT.handle(!wrong,NT.sceneFromText(ctxText),box,wrong);
 });
})();
