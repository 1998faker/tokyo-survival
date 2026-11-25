/* ==== engine/survival/96h-shinagawa-hotel.js ==== */
/* ===================================================================
   【v23.3 品川站街区里的港屋酒店】
   从东京大地图点进品川站时，街区地图上多一栋「🏨 ミナトヤホテル」。
   点它和「任务」页的「▶ 追踪当前主线」一样（storyQuest → 第一章酒店调查）。
   文字在 config/game.json 的 chapter1.shinagawaHotel。
   =================================================================== */
(function(){
 const CF=()=>Object.assign({station:'shinagawa',x:50,y:84},(GAME_CONFIG.chapter1||{}).shinagawaHotel||{});
 const SPOT='minatoya';
 const here=s=>!!(s&&s.id===CF().station&&campaign&&campaign.firstDayComplete);
 const open=()=>campaign&&(campaign.storyIndex||0)===0&&typeof storyReady==='function'&&storyReady();
 const basePlan=makeDistrictPlan;
 makeDistrictPlan=function(s){const p=basePlan(s);if(!here(s))return p;const c=CF();
  return Object.assign({},p,{spots:p.spots.concat([[SPOT,'🏨',c.label||'ミナトヤホテル',c.desc||'港屋酒店','hotel',c.x,c.y]])})};
 const baseSelect=selectSpot;
 selectSpot=function(id){
  if(id!==SPOT||!district)return baseSelect(id);
  const c=CF(),chat=document.getElementById('district-chat');if(!chat)return;
  districtTarget=makeDistrictPlan(district).spots.find(sp=>sp[0]===SPOT);districtDialog=0;
  const can=open();
  chat.innerHTML=`<strong>▶ 🏨 ${esc(c.label||'ミナトヤホテル')}</strong><p>${esc(can?(c.text||''):(campaign.storyIndex>0?(c.closedText||''):(c.waitText||'')))}</p>${can?`<button class="rpg-action primary" id="district-hotel" style="width:100%">🏨 ${esc(c.button||'进入酒店')}</button>`:''}`;
  const b=document.getElementById('district-hotel');if(b)b.onclick=()=>storyQuest();
 };
})();
