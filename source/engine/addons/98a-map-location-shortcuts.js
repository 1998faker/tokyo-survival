/* ==== engine/addons/98a-map-location-shortcuts.js ==== */
/* World map shortcuts: go home via existing train rules; reopen current district without teleport. */
(function(){
 const homeId='shinagawa';
 const prevHome=tokyoHome;
 tokyoHome=function(){
  prevHome.apply(this,arguments);
  if(!campaign||!campaign.firstDayComplete)return;
  const map=app&&app.querySelector('#map-host');
  if(!map||app.querySelector('#et-map-shortcuts'))return;
  const here=TRAVEL.where();
  if(!here||!byId[here])return;
  const home=byId[homeId],current=byId[here];
  const panel=document.createElement('div');
  panel.id='et-map-shortcuts';
  panel.setAttribute('aria-label','大地图快捷位置');
  panel.innerHTML='<div class="et-loc-shortcut-heading">📍 目前所在：<strong></strong>　·　🏠 居住地：品川港屋酒店</div>'+
   '<div class="et-loc-shortcut-buttons">'+
   '<button type="button" class="rpg-action" id="et-map-home-shortcut">🏠 回居住地（品川）</button>'+
   '<button type="button" class="rpg-action" id="et-map-here-shortcut">📍 返回当前位置</button></div>'+
   '<p class="et-loc-shortcut-note">回居住地使用正常乘车流程；当前位置返回当前街区，不另收车费。</p>';
  panel.querySelector('strong').textContent=current.jp;
  map.insertAdjacentElement('beforebegin',panel);
  // This is a real return to the station/area, not a free teleport across districts.
  function atCurrent(id){
   if(id!==TRAVEL.where()){TRAVEL.plan(id);return}
   dayDefaults();
   // New day resets visitedToday, but re-entering the district where the player
   // already stands must not charge an extra action or repeat a first-visit fare.
   if(!campaign.visitedToday.includes(id)){
    campaign.visitedToday.push(id);
    campaignSave();
   }
   enterDistrict(id);
  }
  panel.querySelector('#et-map-home-shortcut').onclick=function(){
   if(TRAVEL.where()===homeId){atCurrent(homeId);return}
   TRAVEL.plan(homeId);
  };
  panel.querySelector('#et-map-here-shortcut').onclick=function(){atCurrent(here)};
  // Location markers follow saved station state; never modify the selected station.
  const svg=app.querySelector('.tokyo-svg');
  if(svg){
   const ns='http://www.w3.org/2000/svg';
   function ring(id,cls,colour,radius){const st=byId[id];if(!st)return;
    const circle=document.createElementNS(ns,'circle');
    circle.setAttribute('cx',st.x);circle.setAttribute('cy',st.y);circle.setAttribute('r',radius);
    circle.setAttribute('fill','none');circle.setAttribute('stroke',colour);
    circle.setAttribute('stroke-width','2.5');circle.setAttribute('pointer-events','none');
    circle.setAttribute('class',cls);svg.appendChild(circle);
   }
   ring(homeId,'et-location-home','#dfbd77',12);
   ring(here,'et-location-current','#92e6d4',17);
  }
 };
 const css=document.createElement('style');css.textContent=`
  #et-map-shortcuts{border:1px solid #7798af;background:rgba(9,23,42,.75);border-radius:5px;padding:12px;margin:10px 0 14px;display:grid;gap:9px;color:#f0e9d7}
  .et-loc-shortcut-heading{font-size:13px;line-height:1.5}
  .et-loc-shortcut-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  #et-map-shortcuts button{min-width:0;min-height:45px;white-space:normal;padding:10px 6px;font-size:13px}
  .et-loc-shortcut-note{font-size:11px;color:#c1cedc;margin:0;line-height:1.5}
  @media(max-width:380px){.et-loc-shortcut-buttons{grid-template-columns:1fr}}
 `;document.head.appendChild(css);
})();
