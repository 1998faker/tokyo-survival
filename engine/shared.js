
/* ==== engine/shared/chapter-check.js ==== */
/* ===================================================================
   第一章（以及以后同类章节）数据检查器：构建时和游戏加载时运行。
   检查：剧情 ID 是否重复/缺失、跳转是否存在、条件与效果是否写错、
         引用的证据/人物/物品/地图是否存在、地图尺寸是否正确。
   =================================================================== */
(function(root){
'use strict';
var COND=['tn','sato','mori','kbranch','yk','any','all','not','phase','clockMin','clockMax','flag','notFlag','clue','notClue','anyClue','clueCount','clueCountMax','testimony','notTestimony','testimonyCount','trust','trustMax','npcStress','npcStressMax','mem','notMem','item','notItem','npcAt','notNpcAt','visited','notVisited','cashMin','sanMin','sanMax','prologue'];
var EFF=['tnEvent','satoEvent','moriEvent','kbranch','time','trust','npcStress','mem','flag','clearFlag','item','testimony','clue','log','rule','sanRule','hp','san','cash','stress','glitch','toast','goto'];
var NODE=['sfx','zh','hint','ctxHint','noAssist','tr','failText','failNext','id','type','who','speaker','sub','npc','jp','text','question','lines','choices','effects','next','end','endText','nextText','gate','goto','else','when','options','answer','explain','accept','wrong','cancel','cancelText','backText','call','callText','onceFlag','after','lockTranslate'];
var CHOICE=['text','when','need','needText','once','effects','next','end','call','id'];
var PHASES=['day','evening','night','late']; // v32：白天（day）也是合法时段
var SOLID='#CSTPVNRBDULKXGOWQrEFAHY';
function L(v){return v==null?[]:Array.isArray(v)?v:[v]}

function check(ch,items,sanRules){
 var errors=[],warnings=[],nodes={},C=ch.chapter||{},MAPS=ch.maps||{},NPCS=ch.npcs||{},EV=ch.evidence||{},SC=ch.scenes||{};
 var itemIds={};(items||[]).forEach(function(i){itemIds[i.id]=1});
 function err(where,msg){errors.push('【'+where+'】'+msg)}
 function warn(where,msg){warnings.push('【'+where+'】'+msg)}
 function npc(where,id){if(!NPCS[id])err(where,'人物「'+id+'」不存在（可用：'+Object.keys(NPCS).join('、')+'）')}
 function evid(where,id,kind){var e=EV[id];if(!e)err(where,'证据/证词「'+id+'」不存在，请检查 evidence.json');else if(kind&&e.kind!==kind&&!(kind==='evidence'&&(!e.kind||e.kind==='clue')))err(where,'「'+id+'」不是'+(kind==='testimony'?'证词':'证据'))}
 function item(where,id){if(!itemIds[id])err(where,'物品「'+id+'」不存在，请先在 data/items.json 里添加')}
 function cond(where,w){
  if(w==null)return;if(typeof w!=='object'||Array.isArray(w)){err(where,'条件必须写成 { } 形式');return}
  Object.keys(w).forEach(function(k){
   if(k.charAt(0)==='_')return;
   if(COND.indexOf(k)<0){err(where,'条件「'+k+'」无法识别。可用：'+COND.join('、'));return}
   var v=w[k];
   if(k==='any'||k==='all'){if(!Array.isArray(v))err(where,k+' 必须是条件列表 [ ]');else v.forEach(function(x){cond(where,x)})}
   if(k==='not')cond(where,v);
   if(k==='phase')L(v).forEach(function(p){if(PHASES.indexOf(p)<0)err(where,'phase 只能是 day / evening / night / late')});
   if(['clue','notClue','anyClue'].indexOf(k)>=0)L(v).forEach(function(x){evid(where,x,'evidence')});
   if(['testimony','notTestimony'].indexOf(k)>=0)L(v).forEach(function(x){evid(where,x,'testimony')});
   if(['trust','trustMax','npcStress','npcStressMax','mem','notMem','npcAt','notNpcAt'].indexOf(k)>=0){if(typeof v!=='object'||Array.isArray(v))err(where,k+' 要写成 {"人物编号": 值}');else Object.keys(v).forEach(function(id){npc(where,id)})}
   if(k==='item'){if(typeof v!=='object')err(where,'item 要写成 {"物品编号": 数量}');else Object.keys(v).forEach(function(id){item(where,id)})}
   if(k==='notItem')L(v).forEach(function(id){item(where,id)});
   if(['clockMin','clockMax','clueCount','clueCountMax','testimonyCount','cashMin','sanMin','sanMax'].indexOf(k)>=0&&typeof v!=='number')err(where,k+' 必须是数字');
  });
 }
 function eff(where,e){
  if(e==null)return;if(typeof e!=='object'||Array.isArray(e)){err(where,'效果 effects 必须写成 { } 形式');return}
  Object.keys(e).forEach(function(k){
   if(k.charAt(0)==='_')return;
   if(EFF.indexOf(k)<0){err(where,'效果「'+k+'」无法识别。可用：'+EFF.join('、'));return}
   var v=e[k];
   if(['time','hp','san','cash','stress'].indexOf(k)>=0&&typeof v!=='number')err(where,k+' 必须是数字（例如 -5 或 10）');
   if(k==='clue')L(v).forEach(function(x){evid(where,x,'evidence')});
   if(k==='testimony')L(v).forEach(function(x){evid(where,x,'testimony')});
   if(['trust','npcStress','mem'].indexOf(k)>=0){if(typeof v!=='object'||Array.isArray(v))err(where,k+' 要写成 {"人物编号": 值}');else Object.keys(v).forEach(function(id){npc(where,id)})}
   if(k==='item'){if(typeof v!=='object')err(where,'item 要写成 {"物品编号": 数量}');else Object.keys(v).forEach(function(id){item(where,id)})}
   if(k==='sanRule'&&sanRules&&typeof sanRules[v]!=='number')err(where,'sanRule「'+v+'」在 config/game.json 的 sanRules 里找不到');
   if(k==='goto'&&(!v||!MAPS[v.map]))err(where,'goto 的地图「'+(v&&v.map)+'」不存在');
  });
 }
 /* 节点 */
 (ch.nodeFiles||[]).forEach(function(f){
  var list=f.data&&f.data.nodes;if(!Array.isArray(list)){err(f.file,'找不到 "nodes": [ ... ]');return}
  list.forEach(function(n,i){
   if(!n||!n.id){err(f.file,'第'+(i+1)+'段缺少剧情 ID（"id"）');return}
   if(nodes[n.id]){err(f.file,'剧情 ID「'+n.id+'」重复（另一个在 '+nodes[n.id].f+'）');return}
   nodes[n.id]={n:n,f:f.file};
  });
 });
 function ref(where,id,label){if(id&&!nodes[id])err(where,(label||'跳转')+'目标「'+id+'」找不到，请检查剧情 ID')}
 Object.keys(nodes).forEach(function(id){
  var n=nodes[id].n,w=nodes[id].f+' · '+id;
  Object.keys(n).forEach(function(k){if(k.charAt(0)!=='_'&&NODE.indexOf(k)<0)warn(w,'不认识的字段「'+k+'」，会被忽略')});
  ref(w,n.next);ref(w,n.else);ref(w,n.goto);ref(w,n.wrong,'出示错误时的');ref(w,n.cancel);ref(w,n.after);
  if(n.gate){cond(w,n.gate.when);ref(w,n.gate.node,'gate ')}
  cond(w,n.when);eff(w,n.effects);
  if(n.npc)npc(w,n.npc);
  if(n.type&&['hub','jp','present','listen'].indexOf(n.type)<0)err(w,'type 只能是 hub / jp / present / listen');
  ref(w,n.failNext,'没听懂时的');
  if(n.type==='jp'||n.type==='listen'){if(!n.jp)err(w,'日语题 / 听懂判定需要日语原文 jp');if(!Array.isArray(n.options)||n.options.length<2)err(w,'日语题需要至少 2 个选项 options');else if(typeof n.answer!=='number'||!n.options[n.answer])err(w,'日语题的正确答案 answer 必须是选项序号（第一个是 0）')}
  if(n.type==='present'){if(!Array.isArray(n.accept)||!n.accept.length)err(w,'出示证据需要写 accept（哪些证据算对）');else n.accept.forEach(function(x){evid(w,x,'evidence')})}
  var hasText=n.text!=null||n.jp||n.question||(Array.isArray(n.lines)&&n.lines.length);
  if(!hasText&&!n.gate&&!n.goto)err(w,'没有任何台词（text / lines）');
  if(n.choices!=null){if(!Array.isArray(n.choices))err(w,'choices 必须是列表');else n.choices.forEach(function(c,j){var cw=w+' 选项'+(j+1);if(!c||!c.text){err(cw,'缺少文字 text');return}Object.keys(c).forEach(function(k){if(k.charAt(0)!=='_'&&CHOICE.indexOf(k)<0)warn(cw,'不认识的字段「'+k+'」')});cond(cw,c.when);cond(cw,c.need);eff(cw,c.effects);ref(cw,c.next)})}
 });
 /* 地图 */
 Object.keys(MAPS).forEach(function(id){
  var m=MAPS[id],w='maps.json · '+id;
  if(!Array.isArray(m.rows)||m.rows.length!==11)err(w,'地图必须正好 11 行');
  else m.rows.forEach(function(r,y){if(typeof r!=='string'||r.length!==16)err(w,'第 '+(y+1)+' 行必须正好 16 个字符（现在 '+(r&&r.length)+' 个）')});
  (m.exits||[]).forEach(function(e,i){var ew=w+' 出口'+(i+1);if(e.to&&!MAPS[e.to])err(ew,'目标地图「'+e.to+'」不存在');if(e.scene&&!SC[e.scene])err(ew,'调查场景「'+e.scene+'」不存在');if(!e.to&&!e.scene&&!e.leave)err(ew,'需要 to / scene / leave 之一');if(e.lock){cond(ew,e.lock.open);ref(ew,e.lock.node)}});
  Object.keys(m.objects||{}).forEach(function(k){L(m.objects[k]).forEach(function(o){var ow=w+' 物件 '+k;if(!o.node&&o.text==null)err(ow,'物件需要 node 或 text');ref(ow,o.node);cond(ow,o.when)})});
  (m.anomalies||[]).forEach(function(a){cond(w+' 异常',a.when)});
 });
 /* 人物 */
 Object.keys(NPCS).forEach(function(id){
  var p=NPCS[id],w='npcs.json · '+id;if(!p.name)err(w,'缺少名字 name');ref(w,p.talk,'交谈');
  (p.names||[]).forEach(function(x){cond(w,x.when)});
  Object.keys(p.schedule||{}).forEach(function(ph){if(ph.charAt(0)==='_')return;if(PHASES.indexOf(ph)<0){err(w,'schedule 的时段只能是 day / evening / night / late');return}(Array.isArray(p.schedule[ph])?p.schedule[ph]:[p.schedule[ph]]).forEach(function(s){if(!s)return;cond(w,s.when); // v32.3：允许同一时段写多个位置
   if(MAPS[s.map]){var row=MAPS[s.map].rows[s.y];if(!row||SOLID.indexOf(row[s.x])>=0)warn(w,ph+' 的位置 '+s.x+','+s.y+' 在墙或家具上')}
   else if(!SC[s.map])err(w,ph+' 的地图「'+s.map+'」不存在')})});
 });
 /* 调查场景 */
 Object.keys(SC).forEach(function(id){var s=SC[id],w='scenes.json · '+id;
  if(!Array.isArray(s.rows)||s.rows.length!==11)err(w,'背景必须正好 11 行');
  ref(w,s.enterNode);if(s.lock){cond(w,s.lock.open);ref(w,s.lock.node)}
  if(s.exitNode){cond(w,s.exitNode.when);ref(w,s.exitNode.node,'离开时改播的')}(s.marks||[]).forEach(function(m){cond(w+' marks',m.when);if(!Array.isArray(m.rect)||m.rect.length!==4)err(w+' marks','rect 要写成 [左, 上, 宽, 高]')});if(s.worms)cond(w+' worms',s.worms.when);
  (s.hotspots||[]).forEach(function(h,i){var hw=w+' 热点 '+(h.id||i+1);if(!Array.isArray(h.rect)||h.rect.length!==4)err(hw,'rect 要写成 [左, 上, 宽, 高]');if(h.npc)npc(hw,h.npc);else ref(hw,h.node);if(!h.node&&!h.npc)err(hw,'需要 node 或 npc');cond(hw,h.when)});
 });
 /* 章节设置 */
 var cw='chapter.json';
 ref(cw,C.introNode,'开场');
 (C.rules||[]).forEach(function(r){ref(cw+' 规则 '+r.id,r.node);cond(cw+' 规则 '+r.id,r.when);if(r.trigger!=='clock'&&!/^(enter|scene):/.test(r.trigger||''))err(cw+' 规则 '+r.id,'trigger 要写成 enter:地图、scene:场景 或 clock（时间到了就发生，配合 when 的 clockMin）')});
 if(C.seal){cond(cw+' seal',C.seal.when);Object.keys(C.seal.nodes||{}).forEach(function(k){ref(cw+' seal',k,'被封锁的');ref(cw+' seal',C.seal.nodes[k],'封锁时改用的')})}
 if(C.climax2)ref(cw+' climax2',C.climax2.morningNode,'第二天早上');
 if(C.climax3){ref(cw+' climax3',C.climax3.phoneNode,'黑暗中的电话');ref(cw+' climax3',C.climax3.returnNode,'回到现在');if(!SC[C.climax3.scene])err(cw+' climax3','调查场景「'+C.climax3.scene+'」不存在')}
 Object.keys(C.endings||{}).forEach(function(k){var c=(C.endings[k]||{}).closing;if(c&&c.map&&!MAPS[c.map])err(cw+' 结局 '+k+' closing','地图「'+c.map+'」不存在')});
 cond(cw+' decideWhen',C.decideWhen);
 if(C.deduce){cond(cw+' 推理',C.deduce.when);ref(cw+' 推理',C.deduce.node)}
 (C.hints||[]).forEach(function(h,i){cond(cw+' 提示'+(i+1),h.when);if(!h.text)err(cw+' 提示'+(i+1),'缺少提示文字 text')});
 if(C.lateEnding&&!(C.endings||{})[C.lateEnding])err(cw,'lateEnding「'+C.lateEnding+'」在 endings 里找不到');
 (C.objectives||[]).forEach(function(o,i){cond(cw+' 目标'+(i+1),o.when);cond(cw+' 目标'+(i+1),o.done)});
 var E=C.endings||{};
 (C.decisions||[]).forEach(function(d,i){var dw=cw+' 决定'+(i+1);if(!E[d.ending])err(dw,'结局「'+d.ending+'」不存在');cond(dw,d.when);cond(dw,d.need)});
 Object.keys(E).forEach(function(k){var e=E[k],ew=cw+' 结局 '+k;if(!e.noFooter){if(['protect','publish','leave'].indexOf(e.hotelEnding)<0)err(ew,'hotelEnding 只能是 protect / publish / leave');if(typeof e.tanakaTrust!=='number')err(ew,'tanakaTrust 必须是 0~4 的数字')} /* noFooter：人物专属结局（森/小林/田中/高桥），由各自的程序播放 */eff(ew,e.effects);if(e.upgrade){cond(ew,e.upgrade.when);if(!E[e.upgrade.to])err(ew,'upgrade 的目标结局不存在')}});
 return {errors:errors,warnings:warnings};
}
var api={check:check};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ChapterCheck=api;
})(typeof window!=='undefined'?window:this);
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
/* ==== engine/shared/story-check.js ==== */
/* ===================================================================
   剧情数据检查器（构建时和游戏加载时都会运行同一份检查）
   检查内容：ID 是否缺失或重复、跳转目标是否存在、条件/效果是否写错、
            NPC 出现地点是否认识、章节编号是否在范围内。
   这个文件不包含任何剧情内容，新增剧情不需要改这里。
   =================================================================== */
(function(root){
'use strict';

/* 地点别名：剧情文件里可以直接写中文地点 */
var PLACE_ALIASES={
 '便利店':'conv','便利商店':'conv','コンビニ':'conv',
 '车站':'train','電車':'train','电车':'train','车站检票口':'train',
 '居酒屋':'izakaya','拉面店':'ramen','拉面':'ramen','餐厅':'food','饭店':'food','和食':'washoku',
 '商店':'shop','商场':'shop','购物':'shop','药妆店':'shop',
 '问路处':'help','案内所':'help','派出所':'help',
 '机场':'airport','迪士尼':'disney'
};
var PLACE_IDS=['conv','train','izakaya','ramen','food','washoku','shop','help','airport','disney'];
var PHASES={'白天':'day','day':'day','夜晚':'night','晚上':'night','night':'night'};
var WHEN_KEYS=['chapter','chapterMin','chapterMax','dayMin','dayMax','phase','flag','notFlag','sanMin','sanMax','hpMin','cashMin','hotelEnding'];
var EFFECT_KEYS=['hp','san','cash','stress','setFlag','clearFlag','clue','action'];
var NODE_KEYS=['id','chapter','when','scene','background','speaker','lines','choices','effects','next','end','_说明','_备注'];

function placeId(p){p=String(p||'').trim();return PLACE_ALIASES[p]||p}
function phaseId(p){return PHASES[String(p||'').trim()]||null}
function asList(v){return v==null?[]:Array.isArray(v)?v:[v]}

/* data = { npcs:[{file,data}], dialogues:[{file,data}], chapters:[{file,data}], chapterCount, backgrounds:[keys] }
   返回 { errors:[...], warnings:[...], nodes:{id:node}, npcs:[...], chapters:[...] } */
function check(data){
 var errors=[],warnings=[],nodes={},npcs=[],chapters=[],ids={};
 var maxCh=data.chapterCount||6;
 var bgs=data.backgrounds||null;
 function err(file,msg){errors.push('【'+file+'】'+msg)}
 function warn(file,msg){warnings.push('【'+file+'】'+msg)}

 function checkWhen(file,where,w){
  if(w==null)return;
  if(typeof w!=='object'||Array.isArray(w)){err(file,where+' 的出现条件 when 必须写成 { } 形式');return}
  Object.keys(w).forEach(function(k){
   if(k.charAt(0)==='_')return;
   if(WHEN_KEYS.indexOf(k)<0)err(file,where+' 的条件「'+k+'」无法识别。可用的条件：'+WHEN_KEYS.join('、'));
  });
  ['chapter','chapterMin','chapterMax'].forEach(function(k){if(w[k]!=null&&(typeof w[k]!=='number'||w[k]<1||w[k]>maxCh))err(file,where+' 的 '+k+' 必须是 1~'+maxCh+' 之间的数字')});
  ['dayMin','dayMax','sanMin','sanMax','hpMin','cashMin'].forEach(function(k){if(w[k]!=null&&typeof w[k]!=='number')err(file,where+' 的 '+k+' 必须是数字')});
  if(w.phase!=null&&!phaseId(w.phase))err(file,where+' 的 phase 只能写「白天」或「夜晚」');
 }
 function checkEffects(file,where,e){
  if(e==null)return;
  if(typeof e!=='object'||Array.isArray(e)){err(file,where+' 的资源变化 effects 必须写成 { } 形式');return}
  Object.keys(e).forEach(function(k){
   if(k.charAt(0)==='_')return;
   if(EFFECT_KEYS.indexOf(k)<0)err(file,where+' 的资源变化「'+k+'」无法识别。可用的：'+EFFECT_KEYS.join('、'));
  });
  ['hp','san','cash','stress','action'].forEach(function(k){if(e[k]!=null&&typeof e[k]!=='number')err(file,where+' 的 '+k+' 必须是数字（例如 -5 或 10）')});
 }

 /* 1. 收集所有剧情节点 */
 (data.dialogues||[]).concat(data.chapters||[]).forEach(function(f){
  var d=f.data,list=Array.isArray(d)?d:(d&&d.nodes);
  if(!Array.isArray(list)){err(f.file,'找不到对话列表（应为 "nodes": [ ... ]）');return}
  list.forEach(function(n,i){
   var where='第'+(i+1)+'段对话';
   if(!n||typeof n!=='object'){err(f.file,where+' 格式不正确');return}
   if(!n.id||typeof n.id!=='string'){err(f.file,where+' 缺少剧情 ID（"id"）');return}
   where='剧情「'+n.id+'」';
   if(nodes[n.id]){err(f.file,where+' 的 ID 与 '+nodes[n.id].__file+' 重复');return}
   n.__file=f.file;nodes[n.id]=n;
   Object.keys(n).forEach(function(k){if(k.indexOf('__')!==0&&NODE_KEYS.indexOf(k)<0)warn(f.file,where+' 有一个不认识的字段「'+k+'」，会被忽略')});
   if(n.chapter!=null&&(typeof n.chapter!=='number'||n.chapter<1||n.chapter>maxCh))err(f.file,where+' 的 chapter 必须是 1~'+maxCh+' 之间的数字');
   if(!Array.isArray(n.lines)||!n.lines.length)err(f.file,where+' 没有任何台词（"lines"）');
   else n.lines.forEach(function(l,j){if(!l||(typeof l!=='string'&&!l.zh&&!l.jp&&!l.text))err(f.file,where+' 的第'+(j+1)+'句台词是空的')});
   checkWhen(f.file,where,n.when);
   checkEffects(f.file,where,n.effects);
   if(n.background&&bgs&&bgs.indexOf(n.background)<0)warn(f.file,where+' 的背景图「'+n.background+'」没有在 config/assets.json 中登记，将使用默认背景');
   if(n.choices!=null){
    if(!Array.isArray(n.choices)||!n.choices.length)err(f.file,where+' 的选项 choices 必须是至少一个选项的列表');
    else n.choices.forEach(function(c,j){
     if(!c||!c.text)err(f.file,where+' 的第'+(j+1)+'个选项缺少文字（"text"）');
     if(c){checkEffects(f.file,where+' 第'+(j+1)+'个选项',c.effects);checkWhen(f.file,where+' 第'+(j+1)+'个选项',c.when)}
    });
   }
  });
 });
 /* 2. 检查跳转 */
 Object.keys(nodes).forEach(function(id){
  var n=nodes[id];
  if(n.next&&!nodes[n.next])err(n.__file,'剧情「'+id+'」要跳转到「'+n.next+'」，但找不到这个剧情 ID');
  (Array.isArray(n.choices)?n.choices:[]).forEach(function(c,j){if(c&&c.next&&!nodes[c.next])err(n.__file,'剧情「'+id+'」第'+(j+1)+'个选项要跳转到「'+c.next+'」，但找不到这个剧情 ID')});
 });
 /* 3. NPC */
 (data.npcs||[]).forEach(function(f){
  var p=f.data,file=f.file;
  if(!p||typeof p!=='object'){err(file,'NPC 文件格式不正确');return}
  if(!p.id){err(file,'NPC 缺少 ID（"id"）');return}
  if(ids['npc:'+p.id]){err(file,'NPC ID「'+p.id+'」与 '+ids['npc:'+p.id]+' 重复');return}
  ids['npc:'+p.id]=file;
  if(!p.name)err(file,'NPC「'+p.id+'」缺少名字（"name"）');
  ['chapter','chapterMin','chapterMax'].forEach(function(k){if(p[k]!=null&&(typeof p[k]!=='number'||p[k]<1||p[k]>maxCh))err(file,'NPC「'+p.id+'」的 '+k+' 必须是 1~'+maxCh+' 之间的数字')});
  var sch=p.schedule;
  if(!sch||typeof sch!=='object')err(file,'NPC「'+p.id+'」缺少出现时间地点（"schedule"），例如 {"白天":["便利店"],"夜晚":["车站"]}');
  else Object.keys(sch).forEach(function(ph){
   if(ph.charAt(0)==='_')return;
   if(!phaseId(ph))err(file,'NPC「'+p.id+'」的 schedule 里「'+ph+'」不是有效时间，只能写「白天」或「夜晚」');
   asList(sch[ph]).forEach(function(pl){if(PLACE_IDS.indexOf(placeId(pl))<0)err(file,'NPC「'+p.id+'」的地点「'+pl+'」无法识别。可用地点：'+Object.keys(PLACE_ALIASES).join('、'))});
  });
  if(!Array.isArray(p.dialogues)||!p.dialogues.length)err(file,'NPC「'+p.id+'」没有对话列表（"dialogues"）');
  else p.dialogues.forEach(function(d){if(!nodes[d])err(file,'NPC「'+p.id+'」的对话「'+d+'」找不到，请检查 story/dialogues/ 里的剧情 ID')});
  if(p.repeat!=null&&['last','loop','none'].indexOf(p.repeat)<0)err(file,'NPC「'+p.id+'」的 repeat 只能写 last（重复最后一段）/ loop（从头循环）/ none（说完就不再出现）');
  npcs.push(p);
 });
 /* 4. 新章节 */
 (data.chapters||[]).forEach(function(f){
  var c=f.data,file=f.file;
  if(!c||Array.isArray(c)){err(file,'章节文件应写成 { "id":..., "title":..., "start":..., "nodes":[...] }');return}
  if(!c.id)err(file,'章节缺少 ID（"id"）');
  else if(ids['chapter:'+c.id])err(file,'章节 ID「'+c.id+'」重复');
  else ids['chapter:'+c.id]=file;
  if(!c.title)err(file,'章节缺少标题（"title"）');
  if(!c.start||!nodes[c.start])err(file,'章节「'+(c.id||'?')+'」的开始剧情 start「'+(c.start||'')+'」找不到');
  checkWhen(file,'章节「'+(c.id||'?')+'」',c.when);
  chapters.push(c);
 });
 return {errors:errors,warnings:warnings,nodes:nodes,npcs:npcs,chapters:chapters};
}

var api={check:check,placeId:placeId,phaseId:phaseId,asList:asList,PLACE_ALIASES:PLACE_ALIASES};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.StoryCheck=api;
})(typeof window!=='undefined'?window:this);
