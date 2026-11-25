/* ==== engine/survival/97zp-v52-prologue.js ==== */
/* v52：状态指标逐步出现 · 序章线索进入第一章线索库 · 推理教学《透明雨伞》移入序章
   存档：campaign.v52u = {legacy, stress, san, lang, taint}（解锁永久有效）
         campaign.prologue.flags：tutSeen / tutChased / tutTime / tutDone
         campaign.invTutorial.prologue / umbrella（教学是从序章开始的、开始时是否有伞） */
const V52U=(function(){
 const KEYS=['stress','san','lang','taint'];
 function st(){
  if(!campaign)return null;
  if(!campaign.v52u){
   const legacy=!!(campaign.firstDayComplete||campaign.day>1);
   campaign.v52u={legacy};if(legacy)KEYS.forEach(k=>campaign.v52u[k]=true);
  }
  return campaign.v52u;
 }
 function has(k){const s=st();return !s||!!s[k]}
 function unlock(k){const s=st();if(!s||s[k])return;s[k]=true;campaignSave();const t=GAME_CONFIG.v52.unlock[k];if(t)setTimeout(()=>UI.toast(t),400)}
 let busy=false;
 function check(){
  if(!campaign||busy)return;busy=true;
  try{
   const s=st();
   if(!s.stress&&(campaign.stress||0)>0)unlock('stress');
   if(!s.san&&(campaign.san??100)<GAME_CONFIG.player.maxSAN)unlock('san');
   if(!s.lang&&(campaign.jlpt?.xp||0)>0)unlock('lang');
  }finally{busy=false}
 }
 function outside(){if(campaign&&campaign.firstDayComplete&&campaign.day>=2)unlock('taint')}
 /* 状态栏第二行：语言等级、污染状态未解锁时不显示 */
 function details(base){
  return function(){
   let h=base.apply(this,arguments);if(!campaign)return h;
   if(!has('lang'))h=h.replace(/<span class="v51-language">[\s\S]*?<\/span><\/span>/,'');
   if(!has('taint'))h=h.replace(/<button type="button" id="v51-pollution"[\s\S]*?<\/button>/,'');
   return h;
  };
 }
 return {has,unlock,check,outside,details,st};
})();
window.V52U=V52U;

const V52PRO=(function(){
 const PM={oldNote:'P01',oldStreet:'P02',overheard:'P03',noCheckout:'P04',waterSound:'P05'};
 const p=()=>campaign&&campaign.prologue;
 /* ---------- 序章线索 → 线索库（来源「入境之夜」，不会被污染） ---------- */
 function syncClues(){
  if(!campaign||!window.INV)return;const pr=p();if(!pr||!pr.clues)return;
  const s=INV.state&&INV.state();
  for(const k of pr.clues){const id=PM[k];if(!id)continue;
   if(!campaign.investigation?.clues?.[id]){protecting=true;try{INV.addClue(id,true)}finally{protecting=false}}
   const r=campaign.investigation?.clues?.[id];if(r){r.v51Protected=true;delete r.taint}
  }
 }
 let protecting=false;
 /* ---------- 教学《透明雨伞》 ---------- */
 const tutState=()=>campaign.invTutorial;
 function tutorial(){
  const pr=p();if(!pr)return;
  campaign.invTutorial??={};const s=campaign.invTutorial;
  s.prologue=true;if(s.umbrella==null)s.umbrella=!!(campaign.items&&campaign.items.umbrella>0)||!!(pr.items&&pr.items.umbrella>0);
  if(!pr.flags.tutTime){pr.flags.tutTime=true;try{PRO.advance(GAME_CONFIG.v52.tutorial.minutes)}catch(e){}}
  campaignSave();
  if(window.__TUTV)__TUTV.start();else INV_TUT.open();
 }
 /* 从教学回到雨夜的品川站前 */
 function back(){
  const s=tutState()||{},pr=p();
  if(!pr||!(window.PRO&&PRO.applies())){if(typeof tokyoHome==='function')tokyoHome();return}
  PRO.resume();
  if(s.done&&!pr.flags.tutDone)setTimeout(()=>{try{PRO.playNode('sx-tut-end')}catch(e){console.error(e)}},200);
 }
 /* 先去了交番、电线杆、暗巷、案内板：做完那一处后，山田追上来 */
 function afterHot(id,queue){
  const pr=p();if(!pr||pr.scene!=='street')return;
  if(!['koban','pole','alley','plaque'].includes(id))return;
  const s=campaign.invTutorial||{};if(pr.flags.tutDone||pr.flags.tutChased||s.introDone||s.done||s.skipped)return;
  if(pr.clock>=PRO_hm(GAME_CONFIG.v52.tutorial.until))return;
  pr.flags.tutChased=true;queue.push({node:'sx-yamada-chase'});
 }
 function PRO_hm(v){const m=/^(\d{1,2}):(\d{2})$/.exec(v||'');return m?(+m[1])*60+(+m[2]):1e9}
 /* 旧存档：已经做完或跳过教学的，不再在序章里触发 */
 function markOld(){
  const pr=p(),s=campaign&&campaign.invTutorial;if(!pr||!s)return;
  if((s.done||s.skipped)&&!s.prologue){pr.flags.tutDone=true}
 }
 function install(){
  V51.details=V52U.details(V51.details);
  GS.on(()=>{V52U.check();if(!protecting&&campaign?.prologue?.clues?.length&&window.INV)syncClues()});
  if(window.TAINT){const o=TAINT.onNew;TAINT.onNew=function(id){if(protecting||/^P0\d$/.test(id)){const r=campaign?.investigation?.clues?.[id];if(r)r.v51Protected=true;return}return o.apply(this,arguments)}}
  const baseHome=tokyoHome;tokyoHome=function(){const r=baseHome.apply(this,arguments);try{V52U.outside();syncClues()}catch(e){}return r};
  const baseEnter=enterDistrict;enterDistrict=function(){const r=baseEnter.apply(this,arguments);V52U.outside();return r};
  if(window.PRO){const st=PRO.start;PRO.start=function(){try{markOld()}catch(e){}return st.apply(this,arguments)}}
  /* 推理页的「推理怎么玩」：没做过教学的人可以练一练 */
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#tut-practice')){e.preventDefault();INV_TUT.open()}});
 }
 return {install,tutorial,back,afterHot,syncClues};
})();
window.V52PRO=V52PRO;

/* 教学开场：有伞 / 没伞两种（山田不知道你是调查员） */
const V52TUT={
 intro(s){
  const way=[
   ['你','「すみません、ミナトヤホテルはどこですか。」（不好意思，港屋酒店在哪里？）'],
   ['山田','“ミナトヤ……ああ、北品川の。すみません、今ちょっとそれどころじゃなくて……傘が見つかったら、道、教えますよ。”\n（港屋……啊，北品川那家。不好意思，我现在顾不上……等找到伞，我告诉你怎么走。）'],
   ['山田','“那是我买的第37把透明伞。前36把都被‘共享’走了，所以这把我特地在伞柄上贴了名字胶带……结果还是没了。”'],
   ['山田','“伞架上还多了一把不认识的折叠伞。”'],
   ['','（走到人或东西面前按 A 调查。头上有「!」的地方还有东西可查。）']];
  if(!s.prologue)return [['','雨夜。品川站前的便利店门口，一个穿西装的男人正对着伞架发愁。'],['','众所周知，在日本，所有的透明雨伞都是共享的。'],...way];
  if(s.umbrella)return [
   ['','品川站前的便利店。一个穿西装的男人站在伞架前，回头看见了你手里的透明伞。'],
   ['山田','“それ……僕のじゃないですよね？”（那个……不是我的吧？）'],
   ['','你把伞柄转给他看。上面没有贴名字胶带。'],
   ['山田','“あ……すみません。失礼しました。”（啊……对不起，失礼了。）'],...way];
  return [
   ['','便利店里，一个穿西装的男人正对着店员说话。'],
   ['山田','“だから、ここに置いたんですよ。名前のテープも貼ってあるのに……”\n（我就是放在这里的啊。还贴着名字胶带……）'],
   ['グエン','“すみません、見てないです……”（对不起，我没看到……）'],
   ['','你浑身湿透地走进来。'],
   ['グエン','“いらっしゃいませ……あ、すみません。ビニール傘、今日はもう売り切れなんです。”\n（欢迎光临……啊，对不起。透明伞今天已经卖完了。）'],
   ['山田','“……あなたも、傘ないんですか。お互い、ついてないですね。”\n（……你也没有伞吗。我们俩都挺倒霉的。）'],...way];
 }
};
window.V52TUT=V52TUT;

