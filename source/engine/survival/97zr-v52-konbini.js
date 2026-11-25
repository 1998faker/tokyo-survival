/* ==== engine/survival/97zr-v52-konbini.js ==== */
/* v52：便利店打工界面第一轮——柜台按操作顺序排成一行、顾客耐心合并成头像外的色环、
   文字教学改成步骤条（文字说明只在第一次打工时出现）、商品卡显示冷 / 热 / 要加热。玩法和数值不变。 */
const V52KB=(function(){
 const ORDER=[['fetch','取货'],['scan','扫描'],['mic','加热'],['bag','装袋'],['subtotal','小计'],['pay','收款'],['finish','完成']];
 const KEY={fetch:'fetch',fetchLearn:'fetch',scan:'scan',micWait:'mic',micTake:'mic',bag:'bag',subtotal:'subtotal',pay:'pay',finish:'finish'};
 const G=()=>(GAME_DATA.d['work/konbini']||{}).guide||{};
 const def=it=>{try{return KONBINI.itemDef(it.id)||{}}catch(e){return {}}};
 function key(gd){if(!gd)return null;const g=G();for(const k in g)if(g[k]===gd.text)return KEY[k]||null;return null}
 function steps(o,gd,n){
  if(!o)return '';
  const needHeat=o.items.some(x=>(def(x).attrs||{}).heat||x.heated||x.state==='mic');
  const list=ORDER.filter(([k])=>k==='fetch'?(o.need||[]).length>0:k==='mic'?needHeat:true);
  const cur=key(gd),ci=o.phase==='talk'?-1:list.findIndex(([k])=>k===cur);
  const html=list.map(([k,label],i)=>'<li class="'+(i<ci?'done':i===ci?'now':'')+'">'+(i<ci?'✓':String.fromCharCode(0x2460+i))+' '+label+'</li>').join('');
  const tip=n===1&&gd&&gd.text?'<p class="kb-guide" id="kb-guide">'+esc(gd.text.replace(/^[①-⑨]\s*/,''))+'</p>':'';
  return '<ol class="kb-steps" aria-label="收银步骤">'+html+'</ol>'+tip;
 }
 function temp(it){
  const a=def(it).attrs||{};
  if(a.frozen)return '<i class="kb-temp cold" title="冷的：放 B 袋">❄ 冷</i>';
  if(a.hot||it.heated)return '<i class="kb-temp hot" title="热的：放 A 袋">♨ 热</i>';
  if(a.heat)return '<i class="kb-temp heat" title="可以加热">📟 可加热</i>';
  return '';
 }
 function lv(r){return r<.25?'low':r<.5?'mid':'ok'}
 return {steps,temp,lv};
})();
window.V52KB=V52KB;

V51.install();V51ADD.install();
CH1FIX.install();
V52.install();QUAKE.install();V52PRO.install();PROPHECY.install();
