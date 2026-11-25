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
