/* ==== engine/survival/98b-language-assist.js ==== */
/* ===================================================================
   【v23.4 零日语玩家的语言辅助（剧情体验模式）】
   接在 83-dialogue.js 的「听懂判定」（listen）后面，只在剧情体验模式（languageMode = story）生效；
   日语学习模式完全不变。
   - 同一道题答错第 1 次：追加「情境提示」（节点写 ctxHint；没写就用通用的一句），不告诉答案。
   - 答错第 2 次：追加关键词和关键词解释（节点的 hint、explain）。
   - 答错 assistAfterFails 次以后：失败画面多一个「📱 用手机翻译软件查一下」，选了就显示这句话的中文意思，
     线索照常记下、剧情照常往下走。已经扣的 疲劳点 不返还，不额外花时间。
   - 只用于：必答题（must）和「答错就记不下线索」的题（没有 failNext）。节点写 "noAssist": true 的不提供（超自然、故意的陷阱）。
   - 答错就直接往下走的题（有 failNext、不是必答）：剧情按「没听懂」继续，线索不记下，但失败画面会告诉你这句话的中文意思。
   - 入境之夜：同一道必答题答错，最多 timeFailsMax 次会多花时间（91-prologue.js 的 wrongTime 调用 timeAllowed），最多 hpFailsMax 次扣 疲劳点。
   数值：config/game.json 的 languageAssist；记录：campaign.langAssist = {fails:{题目:次数}, used:{题目:true}}
   =================================================================== */
const LANGAID=(function(){
 const C=()=>Object.assign({enabled:true,assistAfterFails:2,timeFailsMax:1,hpFailsMax:1,genericHint:'',note:''},GAME_CONFIG.languageAssist||{});
 const story=()=>C().enabled&&typeof langMode==='function'&&langMode()==='story';
 function st(){if(!campaign)return {fails:{},used:{}};campaign.langAssist??={};campaign.langAssist.fails??={};campaign.langAssist.used??={};return campaign.langAssist}
 const eligible=n=>!!n&&n.type==='listen'&&!n.noAssist&&(!!n.must||!n.failNext);
 const count=n=>(st().fails[n.id]||0);
 /* 答错一次：记下次数，返回要追加的文字 */
 function fail(n){
  if(!n||!n.id)return null;const s=st();s.fails[n.id]=(s.fails[n.id]||0)+1;const k=s.fails[n.id];
  if(!story()||n.type!=='listen'||n.noAssist)return null;
  const P=v=>typeof v==='string'?v:(v&&(v.default||Object.values(v)[0]))||'';
  const out={before:'',after:'',keywords:false,offer:false,noHp:!!n.must&&!!C().hpFailsMax&&k>C().hpFailsMax};
  // 不再自动显示情境提示；玩家依靠场景自行判断。
  // 不再在剧情答错后自动显示关键词解释。
  out.offer=eligible(n)&&k>=C().assistAfterFails;
  /* 答错就直接往下走的题（failNext，例如告示、电话里的话）：剧情照常按「没听懂」走，线索也不记下，但事后告诉你这句话的意思 */
  if(n.failNext&&!n.must&&n.zh)out.after+=(out.after?'\n':'')+'📱 事后，你用手机翻译软件查出了这句话的意思：'+P(n.zh);
  if(out.offer)out.after+=(out.after?'\n':'')+'📱 也可以打开手机翻译软件，查一查这句话的意思。';
  return out;
 }
 function assisted(n){const s=st();s.used[n.id]=true;s.count=(s.count||0)+1}
 /* 入境之夜：同一道必答题答错，最多算几次时间 */
 function timeAllowed(n){if(!story()||!n||!n.must)return true;const m=C().timeFailsMax;return !m||count(n)<=m}
 function setMode(m){if(!campaign)return;campaign.languageMode=m==='learning'?'learning':'story';if(typeof campaignSave==='function')campaignSave()}
 return {fail,assisted,timeAllowed,eligible,count,story,setMode,note:()=>C().note||'',state:st};
})();
window.LANGAID=LANGAID;
