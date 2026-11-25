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
