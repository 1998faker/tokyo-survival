/* ==== engine/survival/50-first-day.js ==== */
/* 【第一天：机场到酒店的强制任务】 */
/* V10 — mandatory Day 1 airport-to-hotel storyline.  No SAN penalties for vocabulary mistakes. */
const FIRST_DAY=GAME_DATA.story.firstDay;
window.survivalQuestionCount=()=>{const m=campaign&&GAME_CONFIG.modes.find(x=>x.days===campaign.days);return m?m.questionsPerBattle:GAME_CONFIG.defaultQuestionsPerBattle};
function firstDayPending(){return !!campaign&&campaign.day===1&&campaign.firstDayComplete!==true}
function firstDayQuest(){if(!campaign)return;campaign.firstDayStep=Math.max(0,Math.min(4,campaign.firstDayStep||0));campaignSave();
 const airport=campaign.birth==='narita'?'narita':'haneda';const stages=FIRST_DAY[airport];const index=campaign.firstDayStep;
 if(index>=stages.length){firstDaySuccess();return}
 const step=stages[index];const airportName=airport==='haneda'?'羽田 HND':'成田 NRT';
 app.innerHTML=`<div class="rpg-shell day1-quest"><section class="rpg-panel rpg-hero"><div class="rpg-kicker">CHAPTER 01 // DAY 1 // THE FIRST NIGHT</div><h1 class="rpg-title">极恶东京生存之战</h1><p>✈ ${airportName} → 🚆 品川 → 🏨 ホテル</p><p class="rpg-tiny">被侵染的东京，正在等候你的第一次错误。进入每个场景，点击黄色任务标记，跟随主线前进。</p></section>${campaignHUD()}<section class="survival-box"><div class="rpg-kicker">16-BIT STORY EXPLORATION · ${step.scene}</div><div class="day1-chapter-art day1-art-${index}"><div class="day1-sky"><i></i><i></i><i></i></div><div class="day1-backdrop">${index===0?'✈ AIRPORT ARRIVALS':index===1?'▣ TICKET MACHINE':index===2?'🚆 SHINAGAWA BOUND':'🏨 SHINAGAWA HOTEL'}</div><div class="day1-props"><span>${index===0?'🧳':index===1?'🎟️':index===2?'🚉':'🛎️'}</span><span>${index===0?'🛂':index===1?'💴':index===2?'🚆':'🗝️'}</span></div><div class="day1-floor"></div><div class="day1-pixel-hero"><span>▟▙</span><span>▞▚</span></div><button class="day1-hotspot" id="day1-investigate" aria-controls="day1-question">! 调查 / 与 NPC 对话</button></div><div class="day1-scene-caption">${['到达大厅 · 找到交通指示','售票大厅 · 读懂日语机器','站台 / 车厢 · 确认列车','品川夜街 / 酒店前台 · 办理入住'][index]}</div><div class="day1-progress">${stages.map((v,i)=>`<span class="${i<index?'done':i===index?'now':''}">${i+1}. ${['到达','购票','乘车','入住'][i]}</span>`).join('')}</div></section><section class="survival-box day1-question" id="day1-question" hidden><strong>主线进度 ${index+1} / 4</strong><div class="bar"><i style="width:${index*25}%"></i></div><div class="rpg-kicker">${step.scene}</div><h2>${step.title}</h2><p>${step.text}</p><div class="day1-choices">${step.options.map((x,i)=>`<button class="survival-btn ${i?'alt':''}" data-day1-answer="${i}">${String.fromCharCode(65+i)}. ${x}</button>`).join('')}</div><div id="day1-feedback" role="status"></div></section><section class="survival-box"><strong>⚠ 新手守则</strong><p class="survival-tip">答错日语仅 疲劳点 -${GAME_CONFIG.wrongAnswer.firstDayHp}，SAN 不变。5天简单模式的普通学习挑战为每场5题；其他模式每场10题。</p></section></div>`;
 app.querySelector('#day1-investigate').onclick=()=>{const el=app.querySelector('#day1-question');el.hidden=false;app.querySelector('#day1-investigate').disabled=true;el.scrollIntoView({block:'start',behavior:'smooth'})};
 app.querySelectorAll('[data-day1-answer]').forEach(b=>b.onclick=()=>{
  if(app.querySelector('#day1-continue'))return;
  let ok=Number(b.dataset.day1Answer)===step.correct;
  app.querySelectorAll('[data-day1-answer]').forEach(x=>x.disabled=true);
  const fb=app.querySelector('#day1-feedback');
  if(ok){JLPT.gain(null,'main');campaign.firstDayStep=index+1;campaignSave();fb.innerHTML=`<div class="fb ok"><b>✓ 任务成功</b><p>${step.success}</p><p lang="ja">🔊 ${step.jp}</p></div><button class="survival-btn" id="day1-continue">${index===3?'领取房卡 / 完成入住':'继续主线 →'}</button>`;}
  else {campaign.hp=Math.max(0,campaign.hp-GAME_CONFIG.wrongAnswer.firstDayHp);campaignSave();fb.innerHTML=`<div class="fb ng"><b>✕ 选错了 · 疲劳点 -${GAME_CONFIG.wrongAnswer.firstDayHp} / SAN 不变</b><p>正确答案：${step.options[step.correct]}</p><p lang="ja">${step.jp}</p></div><button class="survival-btn" id="day1-continue">重新尝试</button>`;}
  fb.querySelector('#day1-continue').onclick=()=>{if(campaign.hp<=0){firstDayGameOver()}else if(ok&&index===3){campaign.firstDayComplete=true;campaign.actions=0;campaign.visitedToday=[campaign.birth,'shinagawa'];campaignSave();firstDaySuccess()}else firstDayQuest()};
  app.querySelectorAll('.survival-hud').forEach(x=>x.outerHTML=campaignHUD());
 });window.scrollTo(0,0)
}
function firstDayGameOver(){app.innerHTML=`<div class="rpg-shell"><section class="survival-box"><h1>☠ GAME OVER</h1><p>你还没抵达酒店，就已耗尽 疲劳点。SAN 没有受到影响。</p><button class="survival-btn" id="day1-try-again">从机场重新挑战</button></section></div>`;app.querySelector('#day1-try-again').onclick=()=>{campaign.hp=100;campaign.firstDayStep=0;campaignSave();firstDayQuest()}}
function firstDaySuccess(){if(!campaign)return;app.innerHTML=`<div class="rpg-shell"><section class="rpg-panel rpg-hero"><div class="rpg-kicker">QUEST COMPLETE // DAY 1</div><h1 class="rpg-title">🏨 入住成功！</h1><p>你成功从${campaign.birth==='narita'?'成田':'羽田'}机场乘车到品川，找到了预订酒店，并拿到了房卡。</p></section>${campaignHUD()}<section class="survival-box"><h2>第一天主线完成</h2><p>✓ 找到电车线路　✓ 购买车票　✓ 成功搭乘　✓ 酒店入住</p><p>💟 疲劳点 ${campaign.hp}/100 · ◉ SAN ${campaign.san}/100</p><p class="survival-tip">现在可以结束第一天。夜间将扣除生活费 ${nightlyCost()} 円，并进入 DAY 2，解锁自由探索、打工和日语学习。</p><button class="survival-btn" id="day1-sleep">☾ 在酒店过夜 → DAY 2</button></section></div>`;app.querySelector('#day1-sleep').onclick=()=>nightlyClose()}
const day1EnterDistrict=enterDistrict;
enterDistrict=function(id){if(firstDayPending()){firstDayQuest();return}day1EnterDistrict(id)};
const day1TokyoHome=tokyoHome;
tokyoHome=function(){if(firstDayPending()){firstDayQuest();return}day1TokyoHome()};
const day1Night=nightlyClose;
nightlyClose=function(){if(firstDayPending()){firstDayQuest();return}day1Night()};
const day1SurvivalStatus=survivalStatus;
survivalStatus=function(){if(firstDayPending()){firstDayQuest();return}day1SurvivalStatus()};
// newly created campaigns receive defaults on their first map/district rendering
if(campaign)dayDefaults();
