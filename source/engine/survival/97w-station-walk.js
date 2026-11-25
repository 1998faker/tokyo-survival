/* ==== engine/survival/97w-station-walk.js ==== */
/* ===================================================================
   【v33 车站街区：和港屋酒店一样按格子走、走到面前按 A】
   只在像素街区（.street-pixel，STREET_VIEW 画的地图）里生效，其他地方保持原样。
   - 地图 16×11 格；第 0 行是店面墙，走不进去；每个调查标记（!、设施、彩票亭、游戏厅…）占一格，也走不进去。
   - WASD / 方向键 / 屏幕方向键：一格一格走。点地面：自动走过去。点标记：先走到它旁边，再触发。
   - A / 空格 / Enter：和面前（或旁边）的人、店、物件交互——触发的就是原来标记的内容。
   - 不再因为「走近」就自动弹出内容；地图下面重复的「街区地点一览」按钮列表隐藏（CSS 在 34-station-art.css）。
   =================================================================== */
const STATION_WALK=(function(){
 const COLS=16,ROWS=11,TW=100/COLS,TH=100/ROWS;
 let dir='down',walking=null,allowClick=null;
 const world=()=>{const w=document.getElementById('district-world');return w&&w.classList.contains('street-pixel')?w:null};
 const tileOf=(x,y)=>[Math.max(0,Math.min(COLS-1,Math.floor(x/TW))),Math.max(0,Math.min(ROWS-1,Math.floor(y/TH)))];
 const center=(tx,ty)=>({x:+((tx+.5)*TW).toFixed(3),y:+((ty+.5)*TH).toFixed(3)});
 function markers(w){return [...w.querySelectorAll('.street-hot,.district-hit,.photo-pin')].filter(b=>b.id!=='district-player'&&b.style.left)}
 function markerAt(w,tx,ty){return markers(w).find(b=>{const [x,y]=tileOf(parseFloat(b.style.left),parseFloat(b.style.top));return x===tx&&y===ty})}
 function blocked(w,tx,ty){if(tx<0||ty<1||tx>=COLS||ty>=ROWS)return true;if(window.STATION_ART&&district&&STATION_ART.decoTiles(district.id).some(([x,y])=>x===tx&&y===ty))return true;return !!markerAt(w,tx,ty)}
 function here(){return tileOf(districtPos.x,districtPos.y)}
 function place(tx,ty){const c=center(tx,ty);districtPos.x=c.x;districtPos.y=c.y;renderDistrictPosition();sprite();hint()}
 function sprite(){const p=document.getElementById('district-player');const c=p&&p.querySelector('canvas');if(c&&window.H18){const g=c.getContext('2d');g.clearRect(0,0,32,32);H18.pixelPerson(g,0,0,null,dir)}}
 /* 起点如果被标记占了，就挪到最近的空格 */
 function snap(w){if(window.STV8&&STV8.active())return;let [tx,ty]=here();if(!blocked(w,tx,ty)){place(tx,ty);return}
  for(let r=1;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;if(!blocked(w,tx+dx,ty+dy)){place(tx+dx,ty+dy);return}}}
 const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 function dirOf(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':dy<0?'up':dir)}
 function step(dx,dy){const w=world();if(!w||(window.STREET_WALK&&STREET_WALK.blocked()))return false;dir=dirOf(dx,dy);const [tx,ty]=here(),nx=tx+Math.sign(dx),ny=ty+Math.sign(dy);
  if(blocked(w,nx,ny)){sprite();hint();return false}if(!V51.walk())return false;place(nx,ny);if(window.AUDIO)AUDIO.sfx('step');if(window.STREET_WALK&&district)STREET_WALK.step(district.id,'district');return true} // 街头随机事件照旧
 /* 面前（优先）或旁边的标记 */
 function facing(w){const [tx,ty]=here(),[fx,fy]=DIRS[dir];const f=markerAt(w,tx+fx,ty+fy);if(f)return f;
  for(const [dx,dy] of Object.values(DIRS)){const m=markerAt(w,tx+dx,ty+dy);if(m)return m}return null}
 function label(b){if(b.dataset.v51Label)return b.dataset.v51Label;const s=b.querySelector('small');return ((s?s.textContent:b.textContent)||'').replace(/\s+/g,' ').trim()}
 function hint(){if(window.STV8&&STV8.active()){STV8.hint();return}const w=world();if(!w)return;let el=w.querySelector('#district-hint');if(!el){el=document.createElement('div');el.id='district-hint';el.className='district-hint';w.appendChild(el)}
  const m=facing(w);el.textContent=m?'A：'+label(m):'WASD / 点击地图移动 · 走到人或店铺旁边按 A';el.classList.toggle('on',!!m)}
 function trigger(b){if(!b)return;const [tx,ty]=tileOf(parseFloat(b.style.left),parseFloat(b.style.top)),[px,py]=here();dir=dirOf(tx-px,ty-py);sprite();allowClick=b;b.click();allowClick=null}
 function interact(){if(document.querySelector('.et-modal-back,dialog[open]'))return;if(window.STV8&&STV8.active()){STV8.interact();return}const w=world();if(!w)return;const m=facing(w);if(m)trigger(m)}
 /* 广度优先找路；goals 是可以停下的格子 */
 function path(w,goals){const [sx,sy]=here(),key=(x,y)=>x+','+y,G=new Set(goals.map(([x,y])=>key(x,y)));if(G.has(key(sx,sy)))return [];
  const prev=new Map([[key(sx,sy),null]]),q=[[sx,sy]];
  while(q.length){const [x,y]=q.shift();for(const [dx,dy] of Object.values(DIRS)){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(prev.has(k)||blocked(w,nx,ny))continue;prev.set(k,[x,y,dx,dy]);if(G.has(k)){const out=[];let c=k;while(prev.get(c)){const [a,b2,ddx,ddy]=prev.get(c);out.unshift([ddx,ddy]);c=key(a,b2)}return out}q.push([nx,ny])}}
  return null}
 function walk(steps,then){clearInterval(walking);if(!steps){if(window.UI&&UI.toast)UI.toast('那里走不过去。');return}if(!steps.length){if(then)then();return}
  walking=setInterval(()=>{if(!world()||document.querySelector('.et-modal-back,dialog[open]')){clearInterval(walking);return}const s=steps.shift();if(!step(s[0],s[1])){clearInterval(walking);return}if(!steps.length){clearInterval(walking);walking=null;if(then)setTimeout(then,120)}},V51.walkingDelay(130))}
 function goToMarker(b){const w=world();const [tx,ty]=tileOf(parseFloat(b.style.left),parseFloat(b.style.top));
  const goals=Object.values(DIRS).map(([dx,dy])=>[tx+dx,ty+dy]).filter(([x,y])=>!blocked(w,x,y));walk(path(w,goals),()=>trigger(b))}
 function setup(){const w=world();if(!w)return;
  /* 点标记：先走过去 */
  w.addEventListener('click',e=>{if(window.STV8&&STV8.active())return;const b=e.target.closest('.street-hot,.district-hit,.photo-pin');if(!b||b===allowClick||b.id==='district-player')return;const [tx,ty]=tileOf(parseFloat(b.style.left),parseFloat(b.style.top)),[px,py]=here();
   if(Math.abs(tx-px)+Math.abs(ty-py)===1)return; // 已经在旁边：照常触发
   e.preventDefault();e.stopImmediatePropagation();goToMarker(b)},true);
  /* 点地面：走过去 */
  w.onclick=e=>{if(e.target.closest('button')||(window.STV8&&STV8.active()))return;const r=w.getBoundingClientRect(),[tx,ty]=tileOf((e.clientX-r.left)*100/r.width,(e.clientY-r.top)*100/r.height);
   const goals=blocked(w,tx,ty)?Object.values(DIRS).map(([dx,dy])=>[tx+dx,ty+dy]).filter(([x,y])=>!blocked(w,x,y)):[[tx,ty]];walk(path(w,goals))};
  /* A 按钮 */
  const pad=document.querySelector('.district-control');if(pad&&!pad.querySelector('#district-a')){pad.insertAdjacentHTML('beforeend','<button type="button" class="a" id="district-a" aria-label="调查/交谈">A</button>');pad.querySelector('#district-a').onclick=interact}
  const chat=document.getElementById('district-chat');if(chat)chat.classList.add('street-dialog');
  setTimeout(()=>{snap(w);hint()},0); // 其他模块的标记（彩票亭、设施等）加完之后再对齐
 }
 /* 原来的 moveDistrict（每次 8%、走近自动弹内容）：在像素街区里改成一格一格走 */
 const oldMove=moveDistrict;
 moveDistrict=function(dx,dy){if(window.STV8&&STV8.active()){if(window.event&&window.event.type==='keydown')return;STV8.move(dx,dy);return}if(!world())return oldMove.apply(this,arguments);clearInterval(walking);if(V51.manualStep())step(dx,dy)};
 document.addEventListener('keydown',e=>{if(!world()||/input|textarea|select/i.test(document.activeElement?.tagName||'')||document.querySelector('.et-modal-back,dialog[open]'))return;
  if([' ','Enter','e','E','z','Z'].includes(e.key)&&!(document.activeElement&&document.activeElement.tagName==='BUTTON')){e.preventDefault();interact()}});
 return {setup,interact,here,blocked:(x,y)=>{const w=world();return w?blocked(w,x,y):true}};
})();
window.STATION_WALK=STATION_WALK;
