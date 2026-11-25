/* ==== engine/core/65-custom-questions.js ==== */
/* ===================================================================
   新增日语题接入口
   题目数据放在：data/quiz/新增题目/*.json（构建时自动收集到 GAME_DATA.customQuestions）
   这里只负责：检查题目所属场景是否存在、补全解析字段、把题目并入题库。
   不需要为新增题目修改这个文件。
   =================================================================== */
var CUSTOM_Q=(function(){
 var list=(window.GAME_DATA&&GAME_DATA.customQuestions)||[],ok=[],bad=[];
 var cats=S.map(function(x){return x.id});
 var seen={};
 list.forEach(function(q,n){
  var name='新增题目第'+(n+1)+'题'+(q&&q.uid?'（'+q.uid+'）':'');
  if(!q||typeof q.q!=='string'||!Array.isArray(q.o)||q.o.length<2||typeof q.a!=='number'||!q.o[q.a]){bad.push(name+'：缺少题目 q / 选项 o / 正确答案序号 a，已跳过');return}
  if(cats.indexOf(q.s)<0){bad.push(name+'：场景「'+q.s+'」不存在，已跳过');return}
  if(!q.uid)q.uid=q.s+':'+q.q;
  if(String(q.uid).indexOf('custom:')!==0)q.uid='custom:'+q.uid; // 加前缀，避免与原题库编号冲突
  if(seen[q.uid]){bad.push(name+'：编号 uid 重复，已跳过');return}
  seen[q.uid]=1;
  if(!q.t)q.t=q.j?'r':'s';
  if(!q.e)q.e='';
  if(!q.d)q.d=[]; // 其他选项说明（可省略）
  if(!q.explain){var ex=q.t==='r'?[q.j||'',q.o[q.a],'题目中的日语']:[q.o[q.a],q.q,'可以这样说'];q.explain={text:q.e,examples:[ex]}}
  ok.push(q);
 });
 if(bad.length)(window.__GAME_LOAD_ERRORS=window.__GAME_LOAD_ERRORS||[]).push.apply(window.__GAME_LOAD_ERRORS,bad);
 return ok;
})();
var _fullBeforeCustom=full;
full=function(id){var b=_fullBeforeCustom(id);var ex=CUSTOM_Q.filter(function(q){return id==='all'||q.s===id});return ex.length?b.concat(ex):b};
