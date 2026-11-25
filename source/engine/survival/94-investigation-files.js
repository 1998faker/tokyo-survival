/* ==== engine/survival/94-investigation-files.js ==== */
/* ===================================================================
   【V21 调查档案 / INVESTIGATION FILES】
   底部导航「档案」页最上面的五个栏目：
     1 调查员档案（姓名、调查模式、剩余天数、所在地、调查进度、已发现异常）—— 全部读取现有游戏状态
     2 东京生存守则（data/files/rules.json；序章里获得；RULE 06 一开始锁着，剧情效果 "unlockRule" 解锁）
     3 异常事件记录（第一章前半段的五条线索会自动记录）
     4 人物档案（第一章的人物关系）
     5 收集到的证据（第一章的线索、证据、证词）
   存档：campaign.files = { got: {档案编号:true}, unlocked: {规则编号:true}, anomalies: [...] }
         跟着存档走：刷新、读档都不会丢；旧存档会自动补上默认值。
   =================================================================== */
const FILES=(function(){
const R=GAME_DATA.d['files/rules']||{id:'RULE-001',rules:[]};
const OP=GAME_DATA.story.opening||{};
function F(){
 if(!campaign)return null;
 campaign.files??={got:{},unlocked:{},anomalies:[]};const f=campaign.files;f.got??={};f.unlocked??={};f.anomalies??=[];
 /* 没有经过序章的存档（旧存档、关闭了序章）直接拥有守则；序章进行中要到 SCENE 04 才获得 */
 if(!f.got[R.id]&&!(campaign.opening&&!campaign.opening.done))f.got[R.id]=true;
 return f;
}
function has(id){const f=F();return !!(f&&f.got[id||R.id])}
function grant(id){const f=F();if(!f)return;f.got[id||R.id]=true;campaignSave()}
function unlocked(rid){const f=F();return !!(f&&f.unlocked[rid])}
/* 解锁一条规则：乱码 → 守则更新提示（v24.1 起《东京生存守则》在邮件里，邮件会重新变成未读）→ 电流音效 */
function unlock(rid){
 const f=F();if(!f||f.unlocked[rid])return false;f.unlocked[rid]=true;campaignSave();
 const r=(R.rules||[]).find(x=>x.id===rid);const no=rid.replace(/^R/,'RULE ');
 if(window.AUDIO)AUDIO.sfx('glitch');UI.glitch('static',900);
 UI.toast('✉ 守则更新：《'+(R.name||'')+'》'+no+' ▓▒░█▒▓░');if(window.MAIL)MAIL.badge();
 setTimeout(()=>UI.toast('📁 '+no+'：'+(r?r.text:'')),1300);
 return true;
}
function addAnomaly(id,title,place){const f=F();if(!f||f.anomalies.some(a=>a.id===id))return;f.anomalies.push({id,title,place:place||'',day:campaign.day});campaignSave()}
function modeInfo(days){return (OP.modes||{})[String(days)]||{}}
function progress(){if(!campaign)return 0;const n=(typeof STORY!=='undefined'&&STORY.length)||1;return Math.max(0,Math.min(100,Math.round((campaign.storyIndex||0)/n*100)))}
function place(){if(!campaign)return '';if(window.PRO&&PRO.applies())return '东京 · '+PRO.placeName();const id=campaign.location||(campaign.firstDayComplete?'shinagawa':campaign.birth);return (byId[id]&&byId[id].jp)||''}
function name(){return (campaign&&campaign.name)||'（未登记）'}

/* ---------- 档案页（85-ui-shell.js 的 archivePage 调用） ---------- */
function investigator(){
 const m=modeInfo(campaign.days),left=Math.max(0,campaign.days-campaign.day+1);
 return `<section class="rpg-panel et-file" id="file-1"><div class="et-file-no">FILE 01</div><h2>🪪 调查员档案</h2><div class="et-grid">
  <div><small>调查员</small><b>${esc(name())}</b></div>
  <div><small>调查模式</small><b>${esc(m.name||campaign.mode)} · ${campaign.days} 天</b></div>
  <div><small>剩余调查天数</small><b>${left} 天</b></div>
  <div><small>当前所在地</small><b>${esc(place())}</b></div>
  <div><small>调查进度</small><b>${progress()}%</b></div>
  <div><small>已发现异常</small><b>${F().anomalies.filter(x=>!/^kaidan-/.test(x.id)).length+Object.keys(campaign.kaidan||{}).length}</b></div>
  <div><small>身份</small><b>${esc(campaign.gender)} · ${esc(campaign.origin)}</b></div>
  <div><small>语言协议</small><b>${esc(langLabel())}</b></div>
  <div><small>违反规则</small><b>${campaign.ruleViolations||0} 次</b></div>
  <div><small>东京侵染</small><b>${esc(invasionNames[invasionStage()])}</b></div></div>
  ${m.task?`<p class="survival-tip">调查任务：${esc(m.task)}</p>`:''}</section>`;
}
function rulesSection(){
 if(!has(R.id))return `<section class="rpg-panel et-file" id="file-2"><div class="et-file-no">FILE 02</div><h2>📕 东京生存守则</h2><p class="survival-tip">尚未获得。</p></section>`;
 return `<section class="rpg-panel et-file et-rules" id="file-rules"><div class="et-file-no">${esc(R.id)} · ${esc(R.category||'')}</div><h2>📕 ${esc(R.name||'')}</h2><p class="et-jp" lang="ja">${esc(R.jp||'')}</p>
  ${(R.rules||[]).map(r=>{const lock=r.locked&&!unlocked(r.id);return `<div class="et-rule${lock?' locked':''}${r.locked&&!lock?' fresh':''}"><b>${esc(r.id.replace(/^R/,'RULE '))}</b><span>${esc(lock?r.lockedText:r.text)}${lock?'<em class="et-garble">［以下内容尚未解锁］ ▓▒░█▒▓░</em>':''}</span></div>`}).join('')}</section>`;
}
function anomalies(){const a=F().anomalies.filter(x=>!/^kaidan-/.test(x.id)); // v24.1：车站怪谈只记在「东京都异闻录」
 return `<section class="rpg-panel et-file" id="file-4"><div class="et-file-no">FILE 04</div><h2>⚠ 异常事件记录（${a.length}）</h2>${a.length?a.map((x,i)=>`<div class="story-entry"><b>#${String(i+1).padStart(3,'0')}</b> ${esc(x.title)}<small>　DAY ${x.day}${x.place?' · '+esc(x.place):''}</small></div>`).join(''):'<p class="survival-tip">（尚无记录）</p>'}</section>`}
function people(rel){
 const k=(typeof KFILE!=='undefined'?KFILE.inner():'')+(window.VERIFY?VERIFY.peopleCard():'')+(window.SATO?SATO.profileHtml():''); // 207号室的住客（片山茂）放在人物档案最上面；v27：联系人田中震
 return `<section class="rpg-panel et-file" id="file-2"><div class="et-file-no">FILE 02</div><h2>👥 人物档案</h2>${k}${rel&&rel.length?rel.map(r=>`<div class="et-rel"><b>${esc(r.name)}</b><small>${esc(r.role)}</small><span>信任 ${'♥'.repeat(r.trust)}${'♡'.repeat(5-r.trust)}</span><span>压力 ${'⚡'.repeat(r.stress)||'—'}</span></div>`).join(''):(k?'':'<p class="survival-tip">（尚无记录）</p>')}</section>`}
function tabs(){return `<section class="rpg-panel et-files-head"><div class="rpg-kicker">INVESTIGATION FILES</div><h2>📁 调查档案</h2><nav class="et-files-tabs">${[[1,'调查员档案'],[2,'人物档案'],[4,'异常事件记录'],[5,'东京都异闻录'],[6,'调查日志']].map(([i,t])=>`<a href="#file-${i}" data-file="${i}">${String(i).padStart(2,'0')} ${t}</a>`).join('')}</nav></section>`}
function bindTabs(){app.querySelectorAll('[data-file]').forEach(a=>a.onclick=e=>{e.preventDefault();const el=document.getElementById('file-'+a.dataset.file);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})})}
return {F,has,grant,unlock,unlocked,addAnomaly,modeInfo,progress,place,name,investigator,rulesSection,anomalies,people,tabs,bindTabs,rules:R};
})();
window.FILES=FILES;
