/* ==== engine/shared/prologue-check.js ==== */
/* ===================================================================
   第一章前半段《入境之夜》数据检查器（构建时运行）。
   检查：剧情 ID 重复/缺失、跳转是否存在、条件与效果是否写错、
         引用的场景/线索/物品/路人事件/失败结局是否存在、时间格式、价格名、SAN 规则名。
   =================================================================== */
(function(root){
'use strict';
var COND=['any','all','not','flag','notFlag','clue','notClue','clueCount','item','notItem','cashMin','after','before','visited','notVisited','mustCount'];
var EFF=['time','flag','clearFlag','clue','item','hp','san','sanRule','cash','pay','stress','glitch','toast','goto','fatal','encounter','dest','arrive','unlockRule'];
var NODE=['ctxHint','noAssist','tr','id','type','who','speaker','sub','jp','text','question','lines','choices','effects','next','end','endText','nextText','gate','goto','else','when','options','answer','explain','zh','hint','failText','failNext','call','callText','backText','sfx','must','onceFlag','after','lockTranslate','failTime','failWhy'];
var CHOICE=['text','when','need','needText','once','effects','next','end','call','id'];
var CALLS=['notebook','sleep','finale','guess','toTokyo','toHotel','tutorial','kshop'];
var BGS=['immigration','arrivals','station','train','street','hotel','room','wrong'];
var KINDS=['good','rude','wrong'];
function L(v){return v==null?[]:Array.isArray(v)?v:[v]}
function isTime(v){return typeof v==='string'&&/^\d{1,2}:\d{2}$/.test(v)}

function check(P,items,config){
 var errors=[],warnings=[],nodes={},SC=P.scenes||{},CL=P.clues||{},ENC=P.encounters||[],FATAL=P.fatal||{};
 var cfg=(config&&config.prologue)||{},prices=cfg.prices||{},san=(config&&config.sanRules)||{};
 var itemIds={};(items||[]).forEach(function(i){itemIds[i.id]=1});
 var encIds={};ENC.forEach(function(e){if(e&&e.id)encIds[e.id]=1});
 function err(w,m){errors.push('【'+w+'】'+m)}
 function warn(w,m){warnings.push('【'+w+'】'+m)}
 function timeRef(w,v,k){if(typeof v==='number')return;if(isTime(v))return;if(typeof v==='string'&&isTime(cfg[v]))return;err(w,k+' 要写成 "23:30" 这样的时间，或 config 里的时间名（lastTrain / frontClose / waterAt）')}
 function money(w,v,k){if(typeof v==='number')return;if(typeof v==='string'&&typeof prices[v]==='number')return;err(w,k+'「'+v+'」不是数字，也不是 config 的 prologue.prices 里的价格名（可用：'+Object.keys(prices).join('、')+'）')}
 function cond(w,c){
  if(c==null)return;if(typeof c!=='object'||Array.isArray(c)){err(w,'条件必须写成 { } 形式');return}
  Object.keys(c).forEach(function(k){
   if(k.charAt(0)==='_')return;
   if(COND.indexOf(k)<0){err(w,'条件「'+k+'」无法识别。可用：'+COND.join('、'));return}
   var v=c[k];
   if(k==='any'||k==='all'){if(!Array.isArray(v))err(w,k+' 必须是条件列表 [ ]');else v.forEach(function(x){cond(w,x)})}
   if(k==='not')cond(w,v);
   if(k==='clue'||k==='notClue')L(v).forEach(function(x){if(!CL[x])err(w,'线索「'+x+'」不存在（可用：'+Object.keys(CL).join('、')+'）')});
   if(k==='item'){if(typeof v!=='object')err(w,'item 要写成 {"物品编号": 数量}');else Object.keys(v).forEach(function(id){if(!itemIds[id])err(w,'物品「'+id+'」不存在，请先在 data/items.json 里添加')})}
   if(k==='notItem')L(v).forEach(function(id){if(!itemIds[id])err(w,'物品「'+id+'」不存在')});
   if(k==='visited'||k==='notVisited')L(v).forEach(function(s){if(!SC[s])err(w,'场景「'+s+'」不存在')});
   if(k==='after'||k==='before')timeRef(w,v,k);
   if(k==='cashMin')money(w,v,k);
   if((k==='clueCount'||k==='mustCount')&&typeof v!=='number')err(w,k+' 必须是数字');
  });
 }
 function eff(w,e){
  if(e==null)return;if(typeof e!=='object'||Array.isArray(e)){err(w,'效果 effects 必须写成 { } 形式');return}
  Object.keys(e).forEach(function(k){
   if(k.charAt(0)==='_')return;
   if(EFF.indexOf(k)<0){err(w,'效果「'+k+'」无法识别。可用：'+EFF.join('、'));return}
   var v=e[k];
   if(['time','hp','san','cash','stress'].indexOf(k)>=0&&typeof v!=='number')err(w,k+' 必须是数字（例如 -5 或 10）');
   if(k==='clue')L(v).forEach(function(x){if(!CL[x])err(w,'线索「'+x+'」不存在')});
   if(k==='item'){if(typeof v!=='object')err(w,'item 要写成 {"物品编号": 数量}');else Object.keys(v).forEach(function(id){if(!itemIds[id])err(w,'物品「'+id+'」不存在，请先在 data/items.json 里添加')})}
   if(k==='sanRule'&&typeof san[v]!=='number')err(w,'sanRule「'+v+'」在 config/game.json 的 sanRules 里找不到');
   if(k==='pay')money(w,v,'pay');
   if(k==='goto'&&!SC[v])err(w,'goto 的场景「'+v+'」不存在');
   if(k==='dest'&&!((P.guess||{}).stations||[]).some(function(x){return x.id===v}))err(w,'dest「'+v+'」不是 guess.stations 里的车站');
   if(k==='fatal'&&!FATAL[v])err(w,'失败结局「'+v+'」不存在（prologue.json 的 fatal）');
   if(k==='encounter')L(v).forEach(function(x){if(typeof x!=='string'){err(w,'encounter 要写成场景名（如 "train"、"train!"）或 "#事件编号"');return}if(x.charAt(0)==='#'){if(!encIds[x.slice(1)])err(w,'路人事件「'+x.slice(1)+'」不存在')}});
  });
 }
 /* 节点 */
 (P.nodeFiles||[]).forEach(function(f){
  var list=f.data&&f.data.nodes;if(!Array.isArray(list)){err(f.file,'找不到 "nodes": [ ... ]');return}
  list.forEach(function(n,i){
   if(!n||!n.id){err(f.file,'第'+(i+1)+'段缺少剧情 ID（"id"）');return}
   if(nodes[n.id])err(f.file,'剧情 ID「'+n.id+'」重复（另一处在 '+nodes[n.id].file+'）');
   nodes[n.id]={n:n,file:f.file};
  });
 });
 var mustIds={};
 Object.keys(nodes).forEach(function(id){
  var n=nodes[id].n,w=nodes[id].file+' → '+id;
  Object.keys(n).forEach(function(k){if(k.charAt(0)!=='_'&&NODE.indexOf(k)<0)warn(w,'不认识的字段「'+k+'」（会被忽略）')});
  ['next','failNext','else','goto'].forEach(function(k){if(n[k]&&!nodes[n[k]])err(w,k+' 指向的剧情「'+n[k]+'」不存在')});
  if(n.gate){if(!n.gate.node||!nodes[n.gate.node])err(w,'gate 的 node「'+(n.gate&&n.gate.node)+'」不存在');cond(w,n.gate.when)}
  cond(w,n.when);eff(w,n.effects);
  if(n.call&&CALLS.indexOf(n.call)<0)err(w,'call「'+n.call+'」无法识别（可用：'+CALLS.join('、')+'）');
  if(n.type&&['listen','jp','hub'].indexOf(n.type)<0)err(w,'type 只能是 listen / jp / hub');
  if(n.type==='listen'||n.type==='jp'){
   if(!n.jp)err(w,'日语题缺少日语原文 "jp"');
   if(!Array.isArray(n.options)||n.options.length<2)err(w,'日语题至少需要 2 个选项 "options"');
   else if(typeof n.answer!=='number'||n.answer<0||n.answer>=n.options.length)err(w,'answer 要写正确选项的序号（从 0 开始）');
  }
  if(n.must){if(n.type!=='listen')err(w,'必答题（must）必须是 "type": "listen"');if(!n.failNext)err(w,'必答题需要 failNext（答错后回到哪里重新回答）');if(Array.isArray(n.options)&&n.options.length<4)err(w,'必答题至少要有 4 个选项（避免靠乱猜通过）');mustIds[n.must]=1}
  if(Array.isArray(n.lines))n.lines.forEach(function(l,j){if(typeof l!=='string'&&(!l||typeof l!=='object'))err(w,'lines 第 '+(j+1)+' 行格式不对')});
  (n.choices||[]).forEach(function(c,j){var cw=w+' 选项'+(j+1);
   if(!c.text)err(cw,'缺少选项文字 text');
   Object.keys(c).forEach(function(k){if(k.charAt(0)!=='_'&&CHOICE.indexOf(k)<0)warn(cw,'不认识的字段「'+k+'」')});
   if(c.next&&!nodes[c.next])err(cw,'next 指向的剧情「'+c.next+'」不存在');
   if(c.call&&CALLS.indexOf(c.call)<0)err(cw,'call「'+c.call+'」无法识别');
   cond(cw,c.when);cond(cw,c.need);eff(cw,c.effects);
  });
 });
 if(Object.keys(mustIds).length<1)warn('prologue','没有任何必答题（"must"）');
 /* 场景 */
 if(!SC[P.startScene])err('prologue.json','startScene「'+P.startScene+'」不是一个场景');
 Object.keys(SC).forEach(function(id){
  var s=SC[id],w='prologue.json → 场景 '+id;
  if(!s.name)err(w,'缺少日文地名 name');
  if(s.bg&&BGS.indexOf(s.bg)<0)warn(w,'背景「'+s.bg+'」没有对应的绘制（可用：'+BGS.join('、')+'），会显示成黑色');
  if(s.enterNode&&!nodes[s.enterNode])err(w,'enterNode「'+s.enterNode+'」不存在');
  var hs={};(s.hotspots||[]).forEach(function(h,i){var hw=w+' 热点'+(i+1);
   if(!h.id)err(hw,'缺少 id');else if(hs[h.id]&&!h.when)warn(hw,'id「'+h.id+'」重复');hs[h.id]=1;
   if(!h.node||!nodes[h.node])err(hw,'node「'+h.node+'」不存在');
   if(!Array.isArray(h.rect)||h.rect.length!==4)err(hw,'rect 要写成 [左, 上, 宽, 高]（画面宽 16、高 11）');
   else if(h.rect[0]<0||h.rect[1]<0||h.rect[0]+h.rect[2]>16.01||h.rect[1]+h.rect[3]>11.01)err(hw,'rect 超出画面（宽 16、高 11）');
   cond(hw,h.when);
   ['time','walk'].forEach(function(k){if(h[k]!=null&&typeof h[k]!=='number')err(hw,k+' 必须是数字（分钟）')});
  });
  (s.exits||[]).forEach(function(x,i){var xw=w+' 出口'+(i+1);
   if(!x.label)err(xw,'缺少按钮文字 label');
   if(!x.to&&!x.node)err(xw,'出口要写 to（去哪个场景）或 node（先播放哪段剧情）');
   if(x.to&&!SC[x.to])err(xw,'to 的场景「'+x.to+'」不存在');
   if(x.node&&!nodes[x.node])err(xw,'node「'+x.node+'」不存在');
   if(x.encounter&&typeof x.encounter!=='string')err(xw,'encounter 要写场景名');
   cond(xw,x.when);cond(xw,x.need);
  });
 });
 /* 线索、路人、提示、立绘 */
 var nos={};Object.keys(CL).forEach(function(k){var c=CL[k];if(!c.name||!c.desc)err('prologue.json → 线索 '+k,'缺少 name 或 desc');if(nos[c.no])err('prologue.json → 线索 '+k,'编号 no '+c.no+' 重复');nos[c.no]=1});
 var seen={};ENC.forEach(function(e,i){var w='prologue.json → 路人事件 '+(e&&e.id||i+1);
  if(!e.id)err(w,'缺少 id');else if(seen[e.id])err(w,'id 重复');seen[e.id]=1;
  if(['prejudice','cold'].indexOf(e.kind)<0)err(w,'kind 只能是 prejudice（偏见）或 cold（冷漠）');
  if(!e.who||!e.jp||!e.zh)err(w,'缺少 who / jp / zh');
  if(!Array.isArray(e.scenes)||!e.scenes.length)err(w,'缺少出现场景 scenes');
  if(!Array.isArray(e.fight)||e.fight.length<2)err(w,'fight 至少要有 2 句可以选的日语');
  else e.fight.forEach(function(f,j){if(!f.jp||!f.zh)err(w,'fight 第 '+(j+1)+' 句缺少 jp 或 zh');if(KINDS.indexOf(f.kind)<0)err(w,'fight 第 '+(j+1)+' 句的 kind 只能是 good / rude / wrong')});
  ['good','rude','wrong','ignore','help'].forEach(function(k){if(e[k])eff(w+' '+k,e[k].effects)});
 });
 Object.keys(P.encounterDefaults||{}).forEach(function(k){eff('prologue.json → encounterDefaults '+k,(P.encounterDefaults[k]||{}).effects)});
 (P.hints||[]).forEach(function(h,i){cond('prologue.json → 提示'+(i+1),h.when);if(!h.text)err('prologue.json → 提示'+(i+1),'缺少 text')});
 /* 猜车站 */
 var G=P.guess||{},gs=G.stations||[];
 if(!G.address)err('prologue.json → guess','缺少酒店地址 address');
 if(gs.filter(function(x){return x.correct}).length!==1)err('prologue.json → guess','stations 里必须有且只有一个 "correct": true');
 gs.forEach(function(x,i){var w='prologue.json → guess 车站'+(i+1);if(!x.id||!x.kanji||!x.kana)err(w,'缺少 id / kanji / kana');if(typeof x.fromAirport!=='number'||typeof x.pos!=='number')err(w,'fromAirport 和 pos 必须是数字')});
 /* config */
 ['startClock','lastTrain','frontClose','waterAt'].forEach(function(k){if(!isTime(cfg[k]))err('config/game.json → prologue','「'+k+'」要写成 "23:30" 这样的时间')});
 return {errors:errors,warnings:warnings,musts:Object.keys(mustIds).length};
}
var api={check:check};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PrologueCheck=api;
})(this);
