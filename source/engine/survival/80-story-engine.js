/* ==== engine/survival/80-story-engine.js ==== */
/* ===================================================================
   数据驱动剧情引擎（V17）
   负责播放 story/ 文件夹里的 JSON 剧情：
     story/npcs/*.json       剧情 NPC（什么章节、白天/夜晚出现在哪里、说哪几段对话）
     story/dialogues/*.json  对话节点（台词、选项、资源变化、线索、跳转）
     story/chapters/*.json   新增章节（标题、出现条件、从哪段对话开始）
   新增剧情只需要加 JSON 文件，不需要改这个文件。
   存档里新增的字段：campaign.storyFlags（剧情标记）、campaign.npcTalks（每个 NPC 说到第几段）
   旧存档没有这两个字段时会自动补上，不影响旧进度。
   =================================================================== */
const STORY_DB=(function(){
 const raw=(window.GAME_DATA&&GAME_DATA.story)||{};
 const bgKeys=Object.keys((window.GAME_DATA&&GAME_DATA.backgrounds)||{});
 const result=window.StoryCheck?StoryCheck.check({npcs:raw.npcs||[],dialogues:raw.dialogues||[],chapters:raw.chapters||[],chapterCount:STORY.length,backgrounds:bgKeys}):{errors:['剧情检查器没有加载'],warnings:[],nodes:{},npcs:[],chapters:[]};
 if(result.errors.length){
  (window.__GAME_LOAD_ERRORS=window.__GAME_LOAD_ERRORS||[]).push.apply(window.__GAME_LOAD_ERRORS,result.errors.map(e=>'剧情数据错误：'+e));
  // 有错误的 NPC / 章节不会出现，避免卡关；其余剧情照常运行
 }
 const badFiles=new Set(result.errors.map(e=>(e.match(/^【(.+?)】/)||[])[1]).filter(Boolean));
 return {
  nodes:result.nodes,
  npcs:result.npcs.filter(p=>!badFiles.has(findFile(raw.npcs,p))),
  chapters:result.chapters.filter(c=>!badFiles.has(findFile(raw.chapters,c))),
  errors:result.errors,warnings:result.warnings
 };
 function findFile(list,obj){const f=(list||[]).find(x=>x.data===obj);return f?f.file:''}
})();

function storyStateInit(){if(!campaign)return;campaign.storyFlags??={};campaign.npcTalks??={}}
function currentChapterNo(){return campaign?Math.min((campaign.storyIndex||0)+1,STORY.length):1}
function currentPhase(){if(!campaign)return 'day';dayDefaults();return campaign.actions>=GAME_CONFIG.storyNpc.dayActionsMin?'day':'night'}
const PHASE_NAME={day:'白天',night:'夜晚'};

/* 判断出现条件 */
function storyWhen(w){
 if(!w)return true;if(!campaign)return false;storyStateInit();
 const ch=currentChapterNo(),flags=campaign.storyFlags,L=StoryCheck.asList;
 if(w.chapter!=null&&ch!==w.chapter)return false;
 if(w.chapterMin!=null&&ch<w.chapterMin)return false;
 if(w.chapterMax!=null&&ch>w.chapterMax)return false;
 if(w.dayMin!=null&&campaign.day<w.dayMin)return false;
 if(w.dayMax!=null&&campaign.day>w.dayMax)return false;
 if(w.phase!=null&&StoryCheck.phaseId(w.phase)!==currentPhase())return false;
 if(L(w.flag).some(f=>!flags[f]))return false;
 if(L(w.notFlag).some(f=>flags[f]))return false;
 if(w.sanMin!=null&&campaign.san<w.sanMin)return false;
 if(w.sanMax!=null&&campaign.san>w.sanMax)return false;
 if(w.hpMin!=null&&campaign.hp<w.hpMin)return false;
 if(w.cashMin!=null&&campaign.cash<w.cashMin)return false;
 if(w.hotelEnding!=null&&!L(w.hotelEnding).includes(campaign.hotelEnding))return false;
 return true;
}

/* 执行资源变化，返回给玩家看的说明文字 */
function storyApply(e){
 if(!e||!campaign)return '';storyStateInit();const out=[],L=StoryCheck.asList,P=GAME_CONFIG.player;
 if(e.hp){campaign.hp=Math.max(0,Math.min(P.maxHP,campaign.hp+e.hp));out.push('❤️ 疲劳点 '+(e.hp>0?'+':'')+e.hp)}
 if(e.cash){campaign.cash=Math.max(0,campaign.cash+e.cash);out.push('💴 '+(e.cash>0?'+':'')+e.cash+'円')}
 if(e.stress){campaign.stress=Math.max(0,Math.min(P.maxStress,campaign.stress+e.stress));out.push('🧠 压力 '+(e.stress>0?'+':'')+e.stress)}
 if(e.action){dayDefaults();campaign.actions=Math.max(0,Math.min(GAME_CONFIG.day.actionsPerDay,campaign.actions+e.action));out.push('⏳ 行动点 '+(e.action>0?'+':'')+e.action)}
 L(e.setFlag).forEach(f=>campaign.storyFlags[f]=true);
 L(e.clearFlag).forEach(f=>delete campaign.storyFlags[f]);
 L(e.clue).forEach(c=>{campaign.storyClues??=[];if(!campaign.storyClues.includes(c)){campaign.storyClues.push(c);out.push('🔎 获得线索：'+c)}});
 campaignSave();
 if(e.san){sanAdjust(e.san,'剧情');out.push('◉ SAN '+(e.san>0?'+':'')+e.san)}
 return out.join(' · ');
}

/* 播放一段剧情（V18 起使用统一的文字 ADV 对话框：逐字显示、选项、🔊）。
   opts.title / opts.meta 显示在顶部；opts.onEnd 在剧情结束时调用；opts.backLabel 结束按钮文字 */
let storyRun=null;
function storyPlay(nodeId,opts){
 storyStateInit();storyRun={opts:opts||{}};const o=storyRun.opts;
 UI.scene('dialogue',null);
 app.innerHTML=`<div class="rpg-shell"><section class="story-panel story-node" data-story-node="${esc(nodeId)}">
  <div class="story-meta">${esc(o.meta||('CHAPTER '+currentChapterNo()+' · DAY '+campaign.day+' · '+PHASE_NAME[currentPhase()]))}</div>
  ${o.title?`<h1>${esc(o.title)}</h1>`:''}<p class="sn-scene" id="sn-scene" hidden></p>
  <div id="sn-dlg" class="adv-box" hidden></div></section></div>`;
 window.scrollTo(0,0);
 SR.run(nodeId,{nodes:STORY_DB.nodes,host:()=>document.getElementById('sn-dlg'),cond:storyWhen,
  apply:e=>storyApply(e),pick:t=>t&&typeof t==='object'?(t.default||''):(t||''),
  canChoose:c=>!(c.effects&&c.effects.action<0&&(campaign.actions||0)<-c.effects.action)&&!(c.effects&&c.effects.cash<0&&campaign.cash<-c.effects.cash),
  onNode:n=>{const box=app.querySelector('.story-node');if(box)box.dataset.storyNode=n.id;const sc=document.getElementById('sn-scene');if(sc){sc.hidden=!n.scene;sc.textContent=n.scene||''}if(window.setScreenBackground)setScreenBackground([n.background,o.background,'story'])},
  jpPenalty:GAME_CONFIG.wrongAnswer.mainStoryHp,tauntScene:'street',evidence:()=>[],call:()=>{},
  endText:o.backLabel,onEnd:storyFinish});
}
function storyFinish(){const run=storyRun;storyRun=null;DM.close();campaignSave();if(GS.dead()){survivalStatus();return}if(run&&run.opts.onEnd)run.opts.onEnd();else tokyoHome()}

/* ---------- 剧情 NPC：出现在街区建筑里 ---------- */
function npcTalkNode(p){
 storyStateInit();const n=campaign.npcTalks[p.id]||0,list=p.dialogues;
 if(n<list.length)return list[n];
 if(p.repeat==='none')return null;
 if(p.repeat==='loop')return list[n%list.length];
 return list[list.length-1];
}
function npcsHere(){
 if(!campaign||!district)return [];storyStateInit();
 const plan=makeDistrictPlan(district),places=plan.spots.map(sp=>sp[4]),ph=currentPhase(),ch=currentChapterNo(),L=StoryCheck.asList;
 return STORY_DB.npcs.filter(p=>{
  if(p.chapter!=null&&ch!==p.chapter)return false;
  if(p.chapterMin!=null&&ch<p.chapterMin)return false;
  if(p.chapterMax!=null&&ch>p.chapterMax)return false;
  if(p.districts&&!L(p.districts).includes(district.id))return false;
  if(!storyWhen(p.when))return false;
  if(!npcTalkNode(p))return false;
  const key=Object.keys(p.schedule).find(k=>StoryCheck.phaseId(k)===ph);
  if(!key)return false;
  return L(p.schedule[key]).some(pl=>places.includes(StoryCheck.placeId(pl)));
 }).map(p=>{const key=Object.keys(p.schedule).find(k=>StoryCheck.phaseId(k)===ph);const pl=StoryCheck.asList(p.schedule[key]).map(StoryCheck.placeId).find(x=>places.includes(x));const sp=plan.spots.find(s=>s[4]===pl);return {npc:p,spot:sp?sp[2]:''}});
}
function npcTalk(id){
 const p=STORY_DB.npcs.find(x=>x.id===id);if(!p)return;const nodeId=npcTalkNode(p);if(!nodeId)return;
 const node=STORY_DB.nodes[nodeId];
 if(!storyWhen(node.when)){const box=document.getElementById('district-chat');if(box)box.innerHTML=`<strong>${esc((p.icon||'🧑')+' '+p.name)}</strong><p>${esc(p.busy||'对方现在似乎不想说话。')}</p>`;return}
 const back=district;
 storyPlay(nodeId,{title:(p.icon||'🧑')+' '+p.name,meta:(p.role?p.role+' · ':'')+'CHAPTER '+currentChapterNo()+' · '+PHASE_NAME[currentPhase()],background:'npc-'+p.id,backLabel:'← 返回街区',
  onEnd:()=>{campaign.npcTalks[p.id]=(campaign.npcTalks[p.id]||0)+1;campaignSave();if(back){district=back;renderDistrict()}else tokyoHome()}});
}
function attachStoryNpcs(){
 if(!campaign||!district)return;const box=app.querySelector('.district-utility');if(!box)return;
 const here=npcsHere();if(!here.length)return;
 box.insertAdjacentHTML('beforeend',`<div class="survival-box story-npc-box"><strong>👥 这里的人 · ${PHASE_NAME[currentPhase()]}</strong>${here.map(h=>`<button class="survival-btn alt" data-story-npc="${esc(h.npc.id)}">${esc((h.npc.icon||'🧑')+' '+h.npc.name)}${h.spot?' · '+esc(h.spot):''}</button>`).join('')}</div>`);
 box.querySelectorAll('[data-story-npc]').forEach(b=>b.onclick=()=>npcTalk(b.dataset.storyNpc));
}

/* ---------- 新增章节：出现在东京地图或指定街区 ---------- */
function chaptersAvailable(where){
 if(!campaign||!campaign.firstDayComplete)return [];storyStateInit();
 return STORY_DB.chapters.filter(c=>!campaign.storyFlags['章节完成:'+c.id]&&storyWhen(c.when)&&(where==='map'?!c.district:c.district===where));
}
function chapterPlay(id){
 const c=STORY_DB.chapters.find(x=>x.id===id);if(!c)return;const back=district;
 storyPlay(c.start,{title:c.title,meta:'EXTRA CHAPTER · '+(c.place||'东京')+' · DAY '+campaign.day,background:c.background||('chapter-'+c.id),backLabel:'完成本章',
  onEnd:()=>{campaign.storyFlags['章节完成:'+c.id]=true;campaignSave();if(c.district&&back){district=back;renderDistrict()}else tokyoHome()}});
}
function chapterButtons(list){return list.map(c=>`<button class="story-btn" data-extra-chapter="${esc(c.id)}">📖 ${esc(c.title)}${c.place?' · '+esc(c.place):''}</button>`).join('')}
function bindChapterButtons(){app.querySelectorAll('[data-extra-chapter]').forEach(b=>b.onclick=()=>chapterPlay(b.dataset.extraChapter))}
function attachExtraChapters(where){
 const list=chaptersAvailable(where);if(!list.length)return;
 const html=`<section class="story-panel extra-chapters"><div class="story-meta">EXTRA CHAPTERS</div><h2>📖 新的剧情</h2>${list.map(c=>c.intro?`<p>${esc(c.intro)}</p>`:'').join('')}${chapterButtons(list)}</section>`;
 if(where==='map'){const anchor=app.querySelector('.story-panel')||app.querySelector('.rpg-shell > *:last-child');if(anchor)anchor.insertAdjacentHTML('afterend',html)}
 else{const box=app.querySelector('.district-utility');if(box)box.insertAdjacentHTML('beforeend',html)}
 bindChapterButtons();
}

const storyEngineMap=tokyoHome;
tokyoHome=function(){storyEngineMap();if(!document.querySelector('#first-day-quest'))attachExtraChapters('map')};
const storyEngineDistrict=renderDistrict;
renderDistrict=function(){storyEngineDistrict();attachStoryNpcs();if(district)attachExtraChapters(district.id)};

/* 加载出错时在页面顶部显示一条提示（不会让游戏停止） */
function showLoadErrors(){
 const list=window.__GAME_LOAD_ERRORS||[];if(!list.length||document.getElementById('load-errors'))return;
 document.body.insertAdjacentHTML('afterbegin',`<div id="load-errors" class="load-errors"><b>⚠ 有 ${list.length} 处内容数据有问题，相关内容已暂时跳过：</b><ul>${list.slice(0,8).map(e=>`<li>${esc(e)}</li>`).join('')}</ul><button type="button" onclick="this.parentNode.remove()">知道了</button></div>`);
}

/* 测试用接口 */
window.__STORY={db:STORY_DB,play:storyPlay,talk:npcTalk,here:npcsHere,phase:currentPhase,chapter:currentChapterNo,when:storyWhen,chapterPlay,chaptersAvailable};
