/* ==== engine/survival/97s-station-art.js ==== */
/* ===================================================================
   【v30 车站街区美术：统一成港屋酒店内部的像素风格】
   只负责「画」，不改任何玩法、坐标、存档：
     STATION_ART.street(canvas,id,objects,pos)   车站「像素街区」与白天调查地图（STREET_VIEW.draw 调用）
     STATION_ART.shibuya(g,room,state,t)          涩谷街区散步（SHIBUYA 的 draw 调用，画布 512×320）
   画法全部沿用酒店：32px 地砖、H18.pixelTile 的墙面/地板/家具、H18.pixelPerson 的 16×16 小人、
   夜晚蓝色压暗 + 路灯/售货机光晕 + 暗角；人物名字和「!」标记的样式在 ui/styles/34-station-art.css。
   重点车站各有一张手绘地图（STATIONS），其他车站用通用的站前广场（generic）。
   物件（objects 里的 key）→ 道具（PROP）；人物 key → 小人配色（PEOPLE）。新增物件只要在 KIND 里登记。
   =================================================================== */
const STATION_ART=(function(){
 const T=32,MW=16;
 const shade=(hex,a)=>ART.shade(hex,a);
 let g=null;const px=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 const hash=(x,y)=>((x*73856093)^(y*19349663))>>>0;
 const shadow=(x,y,w)=>px(x+16-(w||24)/2,y+28,w||24,3,'rgba(0,0,0,.25)');
 function text(s,x,y,col,size,align){g.fillStyle=col;g.font='bold '+(size||10)+'px "Hiragino Sans","Noto Sans JP","Microsoft YaHei",monospace';g.textAlign=align||'center';g.fillText(s,x,y);g.textAlign='left'}

 /* ---------- 地砖：酒店没有的户外地砖在这里画，其余交给 H18.pixelTile ---------- */
 const ASPH='#3a3c42';
 function paving(x,y,tx,ty,base,line){px(x,y,T,T,base);for(let r=0;r<4;r++){px(x,y+r*8,T,1,line);for(let k=0;k<3;k++)px(x+((r+ty)%2?0:8)+k*16,y+r*8,1,8,line)}const h=hash(tx,ty);if(h%3===0)px(x+(h%26)+2,y+(h%5)*6+3,2,1,shade(base,10))}
 function asphalt(x,y,tx,ty){px(x,y,T,T,ASPH);const h=hash(tx,ty);for(let i=0;i<3;i++)px(x+((h>>(i*4))%29),y+((h>>(i*5+2))%29),2,1,'#4a4c52')}
 function face(x,y,m){const [wl,wd]=m.wall;px(x,y,T,T,wl);px(x,y,T,6,wd);px(x,y+T-8,T,8,shade(wd,-10))}
 const CUSTOM={
  p:(x,y,tx,ty)=>paving(x,y,tx,ty,'#a39d92','#8e887e'),                       // 站前广场的步道砖
  w:(x,y,tx,ty)=>paving(x,y,tx,ty,'#a8927a','#8f7a64'),                       // 老街的暖色石板
  q:(x,y,tx,ty)=>{px(x,y,T,T,'#b6b0a4');px(x,y,T,1,'#a39d92');px(x,y,1,T,'#a39d92');px(x+15,y,1,T,'#aaa498');px(x,y+15,T,1,'#aaa498');if((tx+ty)%2)px(x+6,y+6,4,4,'#bfb9ad')}, // 广场中央的大块石砖
  y:(x,y,tx,ty)=>{CUSTOM.p(x,y,tx,ty);px(x+10,y,12,T,'#c9a63a');for(let i=0;i<4;i++)px(x+12+(i%2)*4,y+3+i*8,4,2,'#e0bf52')},   // 竖向导盲砖
  u:(x,y,tx,ty)=>{CUSTOM.p(x,y,tx,ty);px(x,y+10,T,12,'#c9a63a');for(let i=0;i<4;i++)px(x+3+i*8,y+12+(i%2)*4,2,4,'#e0bf52')},   // 横向导盲砖
  a:(x,y,tx,ty)=>asphalt(x,y,tx,ty),
  L:(x,y,tx,ty)=>{asphalt(x,y,tx,ty);px(x+4,y+15,14,2,'#d8d6cc')},          // 车道虚线
  z:(x,y,tx,ty)=>{asphalt(x,y,tx,ty);for(let i=0;i<4;i++)px(x+3,y+2+i*8,26,5,'#d8d6cc')},     // 斑马线（横向车道）
  Z:(x,y,tx,ty)=>{asphalt(x,y,tx,ty);for(let i=0;i<4;i++)px(x+2+i*8,y+3,5,26,'#d8d6cc')},     // 斑马线（纵向车道）
  k:(x,y,tx,ty)=>{asphalt(x,y,tx,ty);px(x,y,T,4,'#c4bfb4');px(x,y+4,T,2,'#6e6a64')},           // 路缘（上）
  j:(x,y,tx,ty)=>{asphalt(x,y,tx,ty);px(x,y+T-6,T,2,'#6e6a64');px(x,y+T-4,T,4,'#c4bfb4')},     // 路缘（下）
  T:(x,y,tx,ty)=>{asphalt(x,y,tx,ty);px(x+3,y+3,26,26,'#d6b23a');px(x+5,y+5,22,22,ASPH);text('TAXI',x+16,y+20,'#d6b23a',7)}, // 出租车候车位
  g:(x,y,tx,ty)=>{px(x,y,T,T,'#3e6a3a');const h=hash(tx,ty);for(let i=0;i<4;i++)px(x+((h>>i*3)%28),y+((h>>i*4)%26),2,3,'#4f7f48')},
  v:(x,y,tx,ty)=>{px(x,y,T,T,'#a8a294');const h=hash(tx,ty);for(let i=0;i<6;i++)px(x+((h>>i*3)%30),y+((h>>i*4)%30),2,2,i%2?'#bdb7a8':'#8f8a7d')}, // 神社的碎石
  '~':(x,y,tx,ty,N)=>{px(x,y,T,T,N?'#0f2234':'#1f4a66');const h=hash(tx,ty);for(let i=0;i<3;i++)px(x+((h>>i*5)%24),y+6+i*9,6,1,N?'#1e3a52':'#3a6a88')},
  h:(x,y,tx,ty)=>{CUSTOM.p(x,y,tx,ty);px(x,y+10,T,3,'#9aa0a6');px(x,y+20,T,2,'#9aa0a6');for(let i=2;i<T;i+=10)px(x+i,y+8,3,18,'#7a8086')}, // 栏杆
  /* 墙面（第 0 行的店面）：先画酒店墙面，再画店里的东西 */
  J:(x,y,tx,ty,N,m)=>{px(x,y,T,T,'#1f232b');px(x,y+2,T,2,N?'#f4f0d8':'#e8ebf0');px(x,y+18,T,14,'#7f878b');for(const d of [3,19]){px(x+d,y+13,7,17,'#c9ccd2');px(x+d,y+13,7,3,'#eef0f2');px(x+d+1,y+17,5,2,(tx+d)%3?'#3fae5a':'#e85a5a')}},     // 检票口
  M:(x,y,tx,ty,N,m)=>{face(x,y,m);px(x+3,y+6,26,18,'#8a8f96');for(let i=0;i<6;i++)px(x+3,y+7+i*3,26,1,'#6c7178');px(x+12,y+10,8,6,'#e8e2cc')}, // 拉下的卷帘门
  n:(x,y,tx,ty,N,m)=>{face(x,y,m);px(x+3,y+7,26,15,N?'#f2e2b0':'#cfe0e6');px(x+3,y+7,26,2,shade(m.wall[1],-20));const c=['#c86a5a','#5a8ac8','#e8c46a','#7aa86a'];for(let i=0;i<3;i++)px(x+6+i*8,y+13,5,8,c[(tx+i)%4])}, // 橱窗
  b:(x,y,tx,ty,N,m)=>{face(x,y,m);px(x+1,y+3,30,20,'#141a26');const c=['#3a7ac8','#c84a7a','#e8c46a','#4ac8a0'];px(x+3,y+5,26,16,c[tx%4]);px(x+6,y+8,10,6,shade(c[tx%4],50));px(x+18,y+14,8,4,'#f2f2f2')}, // 大屏幕（涩谷）
  l:(x,y,tx,ty,N,m)=>{face(x,y,m);px(x+4,y+6,24,18,'#3a2a24');for(let i=0;i<4;i++)px(x+5+i*6,y+7,4,14,['#2a3a5a','#2a3a5a','#f2efe6','#2a3a5a'][i]);px(x+6,y+22,20,2,'#1a1210')}, // 暖帘（居酒屋/拉面店）
 };
 const WALLY='#rNWFAJMnbl';
 function tile(m,tx,ty,N){const ch=m.rows[ty][tx],x=tx*T,y=ty*T;
  if(CUSTOM[ch]){CUSTOM[ch](x,y,tx,ty,N,m);return}
  if(ch==='#'&&ty+1<m.rows.length&&WALLY.includes(m.rows[ty+1][tx])){const wt=m.wall[2];px(x,y,T,T,wt);px(x,y+T-2,T,2,shade(wt,10));px(x+((tx+ty)%2?4:20),y+((tx*3+ty)%4)*7+3,6,1,shade(wt,8));return} // 墙顶（下面是店面）
  H18.pixelTile(g,m,tx,ty,N?'night':'evening');
  if(ch==='W'&&N&&ty<=1&&hash(tx,7)%3!==0){px(x+5,y+8,22,14,'#e8c46a');px(x+15,y+8,2,14,m.wall[1]);px(x+5,y+14,22,2,m.wall[1])} // 夜里亮着的窗
 }

 /* ---------- 道具（透明背景，左上角 x,y，和酒店的家具同一套画法） ---------- */
 const PROP={
  board(x,y,o){o=o||{};shadow(x,y,26);px(x+6,y+22,3,9,'#4a3020');px(x+23,y+22,3,9,'#4a3020');px(x+3,y+4,26,20,'#7a5636');px(x+5,y+6,22,16,'#b48a5a');
   const p=o.papers||['#f2ead5','#f5d3d3','#e8e8f5'];px(x+7,y+8,7,9,p[0]);px(x+16,y+7,8,6,p[1]);px(x+16,y+15,8,5,p[2]);px(x+8,y+10,5,1,'#8a7a6a');px(x+8,y+12,4,1,'#8a7a6a');
   if(o.red){px(x+7,y+8,10,12,'#f2ead5');px(x+9,y+10,6,6,'#c23a2a');px(x+18,y+8,7,12,'#c23a2a');px(x+19,y+10,5,1,'#f2ead5');px(x+19,y+13,5,1,'#f2ead5')}
   if(o.pin)px(x+22,y+5,3,3,'#e85a5a')},
  sign(x,y,o){o=o||{};shadow(x,y,10);px(x+15,y+10,3,20,'#5a5e64');px(x+4,y+3,24,11,o.bg||'#1f5aa8');px(x+4,y+3,24,2,shade(o.bg||'#1f5aa8',25));text(o.t||'→',x+16,y+12,o.fg||'#f2f2f2',8)},
  table(x,y,o){o=o||{};shadow(x,y,26);px(x+4,y+24,3,6,'#3a281c');px(x+25,y+24,3,6,'#3a281c');px(x+3,y+10,26,15,'#5c4029');px(x+3,y+10,26,4,'#765535');
   (o.items||['paper']).forEach((it,i)=>{const ix=x+6+i*9;if(it==='paper'){px(ix,y+14,7,8,'#e8e2cc');px(ix+1,y+16,5,1,'#9a8a7a')}if(it==='photo'){px(ix,y+13,8,9,'#f2efe6');px(ix+1,y+14,6,5,'#6a8a9a');px(ix+1,y+17,6,2,'#4a5a4a')}if(it==='book'){px(ix,y+14,8,7,'#8a3a3a');px(ix,y+14,1,7,'#5a2020')}if(it==='cup'){px(ix+1,y+14,5,6,'#f2f2ea');px(ix+2,y+13,3,1,'#6a4a2a')}})},
  shelf(x,y){shadow(x,y,26);px(x+4,y+3,24,27,'#5c4029');for(let i=0;i<3;i++){px(x+6,y+5+i*8,20,6,'#3a281c');for(let k=0;k<4;k++)px(x+7+k*5,y+6+i*8,4,5,['#c86','#68a','#8a6','#a66'][(i+k)%4])}},
  vend(x,y,o){o=o||{};const c=o.c||'#a3303a';shadow(x,y,26);px(x+3,y+1,26,30,c);px(x+6,y+4,20,12,'#e8f0f5');for(let i=0;i<4;i++)px(x+7+i*5,y+7,3,7,['#d94','#4a8','#58c','#c55'][i]);px(x+18,y+20,6,6,'#222');px(x+7,y+19,8,2,'#fd3')},
  locker(x,y){shadow(x,y,28);for(const d of [2,16]){px(x+d,y+1,14,30,'#6c7a86');px(x+d,y+1,1,30,'#8a98a4');for(let i=0;i<3;i++){px(x+d+2,y+3+i*9,10,8,'#7c8a96');px(x+d+9,y+6+i*9,2,2,'#e8c46a')}}},
  stall(x,y,o){o=o||{};const aw=o.aw||'#a55746';shadow(x,y,28);px(x+2,y+14,28,15,'#6d4c33');px(x+2,y+14,28,4,'#8a6640');px(x+2,y+27,28,2,'#4a3020');
   (o.goods||['#d9a05a','#e8c890','#c86a3a']).forEach((c,i)=>{px(x+5+i*8,y+15,6,3,c);px(x+6+i*8,y+14,4,1,shade(c,20))});
   px(x+2,y+11,2,5,'#4a3020');px(x+28,y+11,2,5,'#4a3020');px(x+1,y+3,30,9,aw);for(let i=0;i<4;i++)px(x+1+i*8,y+3,4,9,shade(aw,28));px(x+1,y+11,30,2,shade(aw,-30));
   if(o.lantern){for(const d of [4,24]){px(x+d,y+12,5,7,'#c23a2a');px(x+d,y+13,5,1,'#f0d080');px(x+d,y+17,5,1,'#f0d080')}}},
  noren(x,y,o){o=o||{};shadow(x,y,28);px(x+2,y+3,28,26,'#4a3428');px(x+2,y+3,28,3,'#6a4a38');const c=o.c||'#2a3a5a';for(let i=0;i<4;i++)px(x+4+i*7,y+7,5,13,c);px(x+11,y+10,10,6,'#f2efe6');px(x+4,y+21,24,7,'#2a1d18');if(o.lantern){px(x+25,y+6,5,8,'#c23a2a');px(x+25,y+8,5,1,'#f0d080')}},
  shutter(x,y){shadow(x,y,28);px(x+2,y+3,28,27,'#8a8f96');for(let i=0;i<8;i++)px(x+2,y+4+i*3,28,1,'#6c7178');px(x+2,y+3,28,3,'#5a5e64');px(x+10,y+10,10,8,'#e8e2cc');px(x+11,y+12,8,1,'#8a7a6a');px(x+11,y+14,6,1,'#8a7a6a')},
  washer(x,y){shadow(x,y,26);px(x+4,y+3,24,27,'#e8e8e4');px(x+4,y+3,24,5,'#c9ccd2');px(x+7,y+4,6,2,'#3fae5a');px(x+10,y+11,12,14,'#9fb4c0');px(x+8,y+13,16,10,'#9fb4c0');px(x+12,y+13,6,4,'#cfe0e6')},
  postbox(x,y){shadow(x,y,14);px(x+10,y+6,12,22,'#c0302a');px(x+9,y+3,14,4,'#d84a3a');px(x+12,y+10,8,2,'#2a1a1a');px(x+13,y+15,6,5,'#f2f2f2');px(x+14,y+17,4,1,'#c0302a');px(x+11,y+28,10,2,'#3a2a2a')},
  cat(x,y){shadow(x,y,16);px(x+9,y+18,13,9,'#d9a05a');px(x+11,y+20,2,6,'#b8803a');px(x+15,y+20,2,6,'#b8803a');px(x+19,y+12,9,8,'#d9a05a');px(x+19,y+10,2,3,'#d9a05a');px(x+26,y+10,2,3,'#d9a05a');px(x+21,y+15,1,1,'#1b1b24');px(x+25,y+15,1,1,'#1b1b24');px(x+4,y+24,6,2,'#d9a05a')},
  pigeons(x,y){for(const [dx,dy] of [[2,18],[13,24],[20,14]]){px(x+dx+1,y+dy+5,7,2,'rgba(0,0,0,.2)');px(x+dx,y+dy,8,5,'#8a8f9a');px(x+dx+6,y+dy-3,3,3,'#6a7180');px(x+dx+6,y+dy+1,2,1,'#5a8a6a');px(x+dx+9,y+dy-2,1,1,'#e8a040')}},
  torii(x,y){shadow(x,y,28);px(x+7,y+9,3,21,'#c23a2a');px(x+22,y+9,3,21,'#c23a2a');px(x+2,y+3,28,3,'#2a2020');px(x+3,y+6,26,3,'#c23a2a');px(x+5,y+12,22,2,'#c23a2a');px(x+14,y+8,4,4,'#2a2020');px(x+6,y+28,5,2,'#8a8578');px(x+21,y+28,5,2,'#8a8578')},
  entrance(x,y,o){o=o||{};for(let i=0;i<4;i++)px(x+2,y+10+i*5,28,4,shade('#7a7a72',-i*14));px(x+1,y+9,2,22,'#9a9a92');px(x+29,y+9,2,22,'#9a9a92');px(x+3,y+1,26,8,o.bg||'#1d7a4a');text(o.t||'駅',x+16,y+8,'#f2f2f2',7)},
  kiosk(x,y,o){o=o||{};shadow(x,y,28);px(x+3,y+5,26,24,'#c9ccd2');px(x+3,y+5,26,3,'#e8ebf0');px(x+6,y+10,20,9,'#7ab8e8');px(x+6,y+19,20,2,'#8d9bb0');if(o.i){px(x+12,y+21,8,7,'#3a5a8c');text('i',x+16,y+27,'#f2f2f2',7)}else{px(x+9,y+22,14,6,'#8d9bb0')}},
  bench(x,y){shadow(x,y,28);px(x+4,y+22,3,7,'#3a3a3a');px(x+25,y+22,3,7,'#3a3a3a');px(x+2,y+14,28,9,'#8a6640');for(let i=0;i<3;i++)px(x+2,y+15+i*3,28,1,'#6d4c33');px(x+2,y+11,28,3,'#a07850')},
  newsrack(x,y){shadow(x,y,24);px(x+5,y+6,22,23,'#5a5e64');for(let i=0;i<3;i++){px(x+7,y+8+i*7,18,5,'#e8e4dc');px(x+8,y+9+i*7,10,1,'#555');px(x+8,y+11+i*7,7,1,'#999')}},
  tripod(x,y){shadow(x,y,16);px(x+15,y+12,2,12,'#2a2c30');px(x+10,y+22,2,8,'#2a2c30');px(x+20,y+22,2,8,'#2a2c30');px(x+9,y+5,14,8,'#272b30');px(x+12,y+3,4,2,'#bec1ae');px(x+17,y+7,5,5,'#39434b')},
  hotelsign(x,y){shadow(x,y,20);px(x+8,y+4,16,24,'#2a2a30');px(x+9,y+5,14,22,'#3a3036');px(x+11,y+8,10,5,'#d7a879');text('港屋',x+16,y+22,'#d7a879',7);px(x+8,y+28,3,2,'#1a1a1a');px(x+21,y+28,3,2,'#1a1a1a')},
  statue(x,y){shadow(x,y,26);px(x+5,y+18,22,12,'#7a7a72');px(x+5,y+18,22,2,'#9a9a92');px(x+9,y+9,13,9,'#6a5a3a');px(x+18,y+4,7,8,'#6a5a3a');px(x+18,y+3,2,3,'#5a4a2a');px(x+23,y+3,2,3,'#5a4a2a');px(x+9,y+16,3,3,'#5a4a2a');px(x+18,y+16,3,3,'#5a4a2a');px(x+20,y+7,1,1,'#2a2a2a')},
  flowers(x,y){shadow(x,y,28);for(let i=0;i<3;i++){const bx=x+3+i*9;px(bx,y+18,8,11,'#5a6a7a');px(bx,y+18,8,2,'#7a8a9a');for(let k=0;k<3;k++)px(bx+1+k*2,y+9+(k%2)*3,3,4,['#e85a7a','#f2e24a','#e8e8f5','#c86ae8'][(i+k)%4]);px(bx+3,y+14,2,4,'#3e6a3a')}},
  crystal(x,y){shadow(x,y,22);px(x+6,y+16,20,8,'#4b3558');px(x+6,y+16,20,2,'#69507c');px(x+8,y+24,2,6,'#2a2a2a');px(x+22,y+24,2,6,'#2a2a2a');px(x+12,y+9,8,8,'#9fd0f0');px(x+13,y+10,3,3,'#e8f6ff');px(x+11,y+16,10,2,'#c9a050')},
  claw(x,y){shadow(x,y,28);px(x+3,y+2,26,28,'#e85a9a');px(x+5,y+4,22,15,'#cfe6f0');px(x+14,y+4,2,6,'#888');px(x+12,y+10,6,3,'#b8b8b8');for(let i=0;i<3;i++)px(x+7+i*7,y+15,5,4,['#f2e24a','#7ac8e8','#f2a05a'][i]);px(x+12,y+22,8,6,'#2a2a2a')},
  menu(x,y){shadow(x,y,20);px(x+8,y+4,16,24,'#6d4c33');px(x+10,y+6,12,18,'#2a3a2a');for(let i=0;i<4;i++)px(x+12,y+9+i*4,8,1,'#e8e2cc');px(x+9,y+26,3,4,'#4a3020');px(x+20,y+26,3,4,'#4a3020')},
  signal(x,y,o){shadow(x,y,8);px(x+15,y+6,3,24,'#4a4c52');px(x+9,y+2,14,7,'#262b36');const on=o&&o.green;px(x+11,y+4,4,3,on?'#72d792':'#474c4b');px(x+17,y+4,4,3,on?'#494242':'#f58c76')},
  quest(x,y){PROP.board(x,y,{papers:['#f5d3d3','#f2ead5','#f2ead5'],pin:true});px(x+7,y+8,7,9,'#c23a2a');px(x+9,y+10,3,5,'#f2ead5')},
  stairs(x,y,o){o=o||{};for(let i=0;i<4;i++)px(x+2,y+8+i*6,28,5,shade('#7a6a5a',-i*12));px(x+3,y,26,8,'#1d7a4a');text(o.t||'B1',x+16,y+7,'#e8ffe8',7)},
  /* 装饰（没有调查点，只让画面像个地方） */
  tree(x,y){px(x+6,y+28,20,4,'rgba(0,0,0,.25)');px(x+13,y+18,6,13,'#5a3e28');px(x+3,y-2,26,22,'#2c5230');px(x+6,y,18,12,'#36663a');px(x+9,y+2,8,5,'#43834c');px(x+1,y+8,4,8,'#2c5230');px(x+27,y+6,4,9,'#2c5230')},
  lamp(x,y){px(x+12,y+29,8,3,'rgba(0,0,0,.25)');px(x+14,y+4,4,27,'#444');px(x+9,y+1,14,5,'#888');px(x+11,y+5,10,2,'#f3e3a0')},
  planter(x,y){px(x+4,y+28,24,3,'rgba(0,0,0,.25)');px(x+3,y+18,26,11,'#7a7066');px(x+3,y+18,26,2,'#9a9086');px(x+5,y+8,22,11,'#35683f');px(x+8,y+5,8,6,'#43834c');px(x+18,y+6,7,5,'#43834c');px(x+9,y+12,3,3,'#e85a7a');px(x+20,y+13,3,3,'#f2e24a')},
  trash(x,y){shadow(x,y,18);px(x+8,y+12,16,17,'#355e41');px(x+7,y+10,18,4,'#437a51');px(x+11,y+17,10,2,'#264630')},
  bikes(x,y){for(let i=0;i<3;i++){const bx=x+2+i*10;px(bx+1,y+8,2,20,'#2a2c30');px(bx,y+6,4,3,'#555');px(bx+3,y+14,4,2,['#c23a2a','#3a5a8c','#e8e8e8'][i]);px(bx,y+26,4,3,'#555')}px(x,y+16,32,2,'#9aa0a6')},
  taxi(x,y){px(x+2,y+29,44,3,'rgba(0,0,0,.25)');px(x+2,y+8,44,21,'#e8c440');px(x+2,y+8,44,3,'#f4d860');px(x+10,y+11,26,15,'#3a4a5a');px(x+12,y+12,10,6,'#6a8aa8');px(x+19,y+4,10,5,'#f2f2f2');text('TAXI',x+24,y+8,'#2a2a2a',5);px(x+4,y+27,8,3,'#1a1a1a');px(x+36,y+27,8,3,'#1a1a1a');px(x+44,y+12,2,4,'#fff7c8');px(x+44,y+22,2,4,'#fff7c8')},
  clock(x,y){px(x+12,y+29,8,3,'rgba(0,0,0,.25)');px(x+14,y+8,4,23,'#4a4c52');px(x+8,y-2,16,12,'#e8ebf0');px(x+9,y-1,14,10,'#f8f8f2');px(x+15,y+1,2,4,'#222');px(x+15,y+4,4,1,'#222')},
  cone(x,y){px(x+11,y+26,10,3,'#c86a2a');px(x+13,y+14,6,12,'#e87a2a');px(x+13,y+18,6,2,'#f2f2f2')},
  inn(x,y){shadow(x,y,22);px(x+7,y+6,18,22,'#6d4c33');px(x+9,y+8,14,18,'#f2ead5');text('宿',x+16,y+21,'#8a1a1a',10);px(x+6,y+27,4,3,'#4a3020');px(x+22,y+27,4,3,'#4a3020')},
  pharmacy(x,y){PROP.kiosk(x,y);px(x+11,y+1,10,8,'#f2f2f2');px(x+14,y+2,4,6,'#3fae5a');px(x+12,y+4,8,2,'#3fae5a')},
  lottery(x,y){shadow(x,y,28);px(x+3,y+6,26,23,'#f2efe6');px(x+3,y+2,26,6,'#c23a2a');for(let i=0;i<4;i++)px(x+3+i*7,y+2,3,6,'#e85a4a');px(x+6,y+11,20,8,'#7ab8e8');px(x+3,y+20,26,2,'#c23a2a');text('宝くじ',x+16,y+28,'#c23a2a',6)},
  pachinko(x,y){shadow(x,y,30);px(x+1,y+2,30,28,'#2a1a2e');for(let i=0;i<8;i++){px(x+2+i*4,y+2,2,2,['#f8d583','#e85a9a','#7ac8e8'][i%3]);px(x+2+i*4,y+28,2,2,['#7ac8e8','#f8d583','#e85a9a'][i%3])}px(x+3,y+5,26,9,'#c23a5a');px(x+3,y+5,26,2,'#e85a7a');text('パチンコ',x+16,y+12,'#fff0bb',6);px(x+6,y+16,20,12,'#cfe0e6');px(x+15,y+16,2,12,'#4a3a5a');px(x+8,y+18,4,3,'#f8d583');px(x+20,y+18,4,3,'#e85a9a')},
  arcade(x,y){shadow(x,y,22);px(x+7,y+2,18,28,'#8a2b43');px(x+7,y+2,18,5,'#f8d583');text('GAME',x+16,y+6,'#8a2b43',5);px(x+9,y+8,14,10,'#191322');px(x+11,y+11,3,3,'#e8405a');px(x+12,y+9,1,2,'#3fae5a');px(x+17,y+11,4,3,'#f8d583');px(x+7,y+19,18,4,'#47172d');px(x+10,y+20,2,2,'#e85a5a');px(x+14,y+20,2,2,'#7ac8e8');px(x+18,y+20,2,2,'#f8d583');px(x+9,y+24,14,6,'#5a1d32')},
  bus(x,y){PROP.sign(x,y,{bg:'#3a7a4a',t:'BUS'});px(x+4,y+20,10,2,'#9aa0a6')}
 };
 /* 物件 key → 道具（找不到的 key 画成告示板） */
 const KIND={
  board:['board'],dispatch:['board',{papers:['#f2ead5','#e8e8f5','#f2ead5']}],festival:['board',{red:true}],poster:['board',{papers:['#f5d3d3','#f2ead5','#cfe0e6']}],camera:['board',{papers:['#f2efe6','#cfe0e6','#f2ead5'],pin:true}],
  'yk-program':['board',{papers:['#e8e8f5','#f2ead5','#f2ead5']}],main:['quest'],
  archive:['table',{items:['paper','book','paper']}],log:['table',{items:['book','paper']}],back:['table',{items:['photo','paper']}],photoA:['table',{items:['photo','photo']}],photoB:['table',{items:['photo','book']}],'yk-print':['table',{items:['photo','paper','photo']}],
  receipt:['papers'],album:['shelf'],bookshop:['shelf'],vintage:['rack'],fashion:['rack'],mall:['window'],record:['shelf'],
  vending:['vend'],drink:['vend',{c:'#2a6aa8'}],locker:['locker'],
  cafe:['stall',{aw:'#6d4c33',goods:['#f2f2ea','#c89a6a','#f2f2ea']}],coffee:['stall',{aw:'#407b8c',goods:['#f2f2ea','#6a4a2a','#f2f2ea']}],bakery:['stall',{aw:'#d8b070',goods:['#d9a05a','#c8803a','#e8c890']}],
  snack:['stall',{aw:'#d87a9a',goods:['#f2e8d0','#e8a0b0','#9ac87a']}],yakitori:['stall',{aw:'#a55746',lantern:true,goods:['#8a4a2a','#a85a3a','#8a4a2a']}],market:['stall',{aw:'#a58b4a',goods:['#e85a5a','#7ac85a','#e8c46a']}],
  store:['stall',{aw:'#3fae5a',goods:['#f2f2f2','#5a8ac8','#e8c46a']}],izakaya:['noren',{c:'#8a2a2a',lantern:true}],bar:['noren',{c:'#2a3a5a',lantern:true}],ramen:['noren',{c:'#c23a2a'}],
  laundry:['washer'],closed:['shutter'],postbox:['postbox'],cat:['cat'],pigeon:['pigeons'],shrine:['torii'],
  station:['entrance',{t:'改札'}],crosswalk:['entrance',{t:'西口'}],complaint:['kiosk'],help:['kiosk',{i:true}],info:['kiosk',{i:true}],rest:['bench'],bench:['bench'],
  news:['newsrack'],photo:['tripod'],minatoya:['hotelsign'],flower:['flowers'],cross:['clock'],crossing:['signal',{green:true}],nightbus:['bus'],
  pond:['sign',{bg:'#2a5a7a',t:'不忍池'}],museum:['sign',{bg:'#5a4a3a',t:'美術館'}],
  'local-path':['sign',{bg:'#5a4a3a',t:'→'}],
  arrival:['kiosk',{i:true}],train:['entrance',{t:'京急'}],customs:['kiosk'],temple:['torii'],fortune:['board',{red:true}],souvenir:['stall',{aw:'#c23a2a',goods:['#e8c46a','#c86a5a','#7aa86a']}],sweets:['stall',{aw:'#d87a9a',goods:['#f2e8d0','#9ac87a','#e8a0b0']}],
  washoku:['noren',{c:'#2a3a5a'}],rickshaw:['sign',{bg:'#8a2a2a',t:'人力車'}],alley:['sign',{bg:'#5a4a3a',t:'→'}],
  pachinko:['pachinko'],arcade:['arcade'],
  'fac:🛏':['inn'],'fac:🧪':['pharmacy'],'fac:⛩':['torii'],lottery:['lottery']
 };
 /* 人物 key → 小人配色（与酒店 NPC 同一套：h 头发 s 皮肤 b 衣服 a 点缀 p 裤子 k 鞋） */
 const P=(h,s,b,a,p,k)=>({h,s,b,a,p:p||'#3c4659',k:k||'#222'});
 const PEOPLE={
  elder:P('#d8d8d8','#e2bf9c','#7d6f58','#5d5040','#4a463e'),neighbor:P('#3b302d','#e4c19b','#8a604c','#c9ad76','#46546a'),
  driver1:P('#20283a','#e0b890','#2f3f5f','#e8e8e8','#1e2638'),driver2:P('#20283a','#d9b38d','#2f3f5f','#e8e8e8','#1e2638'),'tn-driver':P('#20283a','#e4b48f','#3a4f7a','#e8c46a','#26334f'),
  witness:P('#2b2b33','#dfb18d','#566774','#c5b99b','#31394b'),'ueno:witness':P('#c9c9c9','#eac39e','#8a6a7a','#e8e2cc','#4b4554'),
  worker:P('#1d1d22','#e2bc98','#3a3f4a','#d0d0d0','#222a38'),office:P('#25262c','#e8bf98','#25262c','#b33a3a','#25262c'),printer:P('#3b302d','#e4c19b','#5a6a7a','#2f6f9a','#3a4250'),
  seller:P('#1b1b24','#e9bf9c','#4b3558','#c9a050','#2a2230'),'tn-worker':P('#3b302d','#e4c19b','#8a604c','#f2f2ea','#46546a'),'tn-witness':P('#39303a','#dfb18d','#566774','#c5b99b','#31394b'),
  busker:P('#4a3528','#e4c19b','#6a4a8a','#e8c46a','#2a2c3a'),'fac:🕯':P('#1a1a22','#d8c0a8','#2a2a33','#5a4a6a','#1a1a22','#111'),guide:P('#2a2a3a','#ecc19b','#554365','#e8c46a','#2a2c3a'),
  yamada:P('#26262c','#eac39c','#4a5b7a','#b84a4a','#2e3446','#1a1a1a') /* v36.2：透明雨伞共享计划的山田 */
 };
 const CAP=new Set(['driver1','driver2','tn-driver']);
 function person(key,cx,cy,id,dir){const pal=PEOPLE[id+':'+key]||PEOPLE[key]||PEOPLE.neighbor,x=Math.round(cx-16),y=Math.round(cy-16);
  H18.pixelPerson(g,x,y,pal,dir||'down');
  if(CAP.has(key)){px(x+8,y+2,16,3,pal.h);px(x+6,y+5,20,2,shade(pal.h,-15));px(x+14,y+3,4,2,'#e8c46a')} // 司机的帽子
  if(key==='busker'){px(x+20,y+16,8,9,'#a0603a');px(x+22,y+18,4,4,'#4a2a1a');px(x+24,y+8,2,10,'#6a4a2a')} // 吉他
  if(key==='seller')PROP.crystal(x+22,y+4);
  if(key==='yamada'){px(x+25,y+6,2,22,'rgba(225,238,245,.9)');px(x+18,y+2,16,5,'rgba(220,235,245,.55)');px(x+24,y+26,4,2,'#f5efd8')} // 透明伞（柄上的名字胶带）
 }
 const PEOPLE_KEYS=new Set(Object.keys(PEOPLE).filter(k=>!k.includes(':')||k.startsWith('fac:')));
 function propAt(key,cx,cy,id){
  if(PEOPLE_KEYS.has(key)){person(key,cx,cy,id);return}
  const x=Math.round(cx-16),y=Math.round(cy-16);let [kind,opt]=KIND[key]||['board'];
  if(key==='local-path'&&id==='shinjuku')kind='stairs',opt={t:'B1'};
  if(key==='local-path'&&id==='ueno')opt={bg:'#2a5a7a',t:'池→'};
  if(key==='local-path'&&id==='shinagawa')opt={bg:'#2a5a7a',t:'運河→'};
  if(kind==='papers'){for(const [dx,dy,r] of [[6,16,0],[15,20,1],[20,12,0],[10,24,1]]){px(x+dx,y+dy,r?6:5,r?4:6,'#e8e2cc');px(x+dx+1,y+dy+1,3,1,'#9a8a7a')}return}
  if(kind==='rack'){shadow(x,y,28);px(x+3,y+6,26,2,'#9aa0a6');px(x+4,y+6,2,24,'#9aa0a6');px(x+26,y+6,2,24,'#9aa0a6');for(let i=0;i<5;i++)px(x+6+i*4,y+8,4,14,['#c86a5a','#5a8ac8','#e8e2cc','#7aa86a','#c8a05a'][(i+(key==='vintage'?2:0))%5]);return}
  if(kind==='window'){shadow(x,y,28);px(x+2,y+4,28,26,'#c9ccd2');px(x+4,y+6,24,16,'#cfe0e6');px(x+8,y+10,5,10,'#e8c46a');px(x+18,y+9,6,11,'#c86a8a');px(x+2,y+22,28,8,'#8d9bb0');px(x+12,y+23,8,7,'#3a4a5a');return}
  PROP[kind](x,y,opt);
 }

 /* ---------- 重点车站的地图（16×11；第 0 行是店面墙，其余是地面） ---------- */
 /* deco：[道具, 格子 x, 格子 y]（格子中心）。awn：店面上的遮阳篷 [起始列, 结束列, 颜色]。sign：站名牌 [起始列, 结束列]。 */
 const STATIONS={
  shinagawa:{wall:['#b1a08b','#746453','#302a30'],sign:[5,10,'#f2f2f2','#1d4a7a'],rows:[
   'WAWnn#JJJJJJ#WWW',
   'pppppppyyppppppp',
   'pppppppyyppppppp',
   'ppqqqqqyyqqqqqpp',
   'ppqqqqqyyqqqqqpp',
   'ppqqqqqyyqqqqkkk',
   'ppqqqqqyyqqqqjjj',
   'pppppppyyppppppp',
   'pppppppyyppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp'],
   deco:[['lamp',1,2],['lamp',14,2],['planter',5,5],['planter',10,5],['tree',1,6],['tree',14,9],['clock',7.5,6],['bikes',1,9],['trash',10,3]]},
  kitashinagawa:{wall:['#b09b80','#79654e','#30292b'],awn:[[0,1,'#d8b070'],[5,7,'#6d4c33'],[10,12,'#407b8c']],rows:[
   'rnW#rnW#WrnW#rWW',
   'wwwwwwwwwwwwwwww',
   'wwwwwwwwwwwwwwww',
   'wwwwwwwwwwwwwwww',
   'wwwwwwwwwwwwwwww',
   'wwwwwwwwwwwwwwww',
   'wwwwwwwwwwwwwwww',
   'wwwwwwwwwwwwwwww',
   'wwwwwwwwwwwwwgvv',
   'wwwwwwwwwwwwggvv',
   'wwwwwwwwwwwwggvv'],
   deco:[['lamp',4,3],['lamp',10,6],['planter',4,1],['planter',9,1],['tree',15,7.6],['bench',5,9.5],['planter',12,8]]},
  gotanda:{wall:['#8d9aa0','#596675','#282e38'],sign:[8,12,'#f2f2f2','#2a6a3a'],rows:[
   'WWnW#WWWJJJJJ#nW',
   'pppppppppppppppp',
   'kkkkkkkkkkkkkkkk',
   'aTaaTaaaaTaaaaaa',
   'jjjjjjjjjjjjjjjj',
   'pppppppppppppppp',
   'ppqqqqqqqqqqqqpp',
   'ppqqqqqqqqqqqqpp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp'],
   deco:[['taxi',4.7,3],['taxi',9.6,3],['lamp',0.8,8],['lamp',15,6],['planter',6,9.6],['planter',10,9.6],['trash',4,5]]},
  shimbashi:{wall:['#a99b9e','#71616d','#302936'],awn:[[0,1,'#407b8c'],[13,15,'#a55746']],rows:[
   'nl#WlW#l#WllW#nl',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'kkkkkkkkkkkkkkpp',
   'LaLaLzzaLaLaLapp',
   'jjjjjjjjjjjjjjpp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp'],
   deco:[['lamp',5,3],['lamp',10.5,3],['lamp',5.5,7.5],['trash',15,7],['cone',2,3.5],['bikes',10.5,9.5]]},
  ueno:{wall:['#9ca38b','#65715e','#29352e'],sign:[5,10,'#f2f2f2','#3a5a3a'],rows:[
   'W#nWW#JJJJJJ#WnW',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'ppppppqqqqpppppp',
   'pppppqqqqqqppppp',
   'pppppqqqqqqppppp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'gppppppppppppppg',
   'ggpppppppppppggg',
   'gggpppppppppgggg'],
   deco:[['tree',15.2,7.9],['tree',0.2,8],['lamp',4,3],['lamp',11.5,3],['planter',7.5,6.4],['bench',3.3,6],['tree',10,9.8]]},
  shibuya:{wall:['#b39a91','#7c626b','#322b40'],sign:[6,9,'#f2f2f2','#2a6a5a'],rows:[
   'bnbn#WJJJJ#Wnbnb',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'kkkkkkzzzzkkkkkk',
   'LaLaLaZZZZaLaLaL',
   'aaaaaaZZZZaaaaaa',
   'jjjjjjzzzzjjjjjj',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp'],
   deco:[['signal',5.6,2.4],['signal',10.4,7.3,{green:true}],['lamp',9,2],['tree',15,8.6],['planter',8,9.6]]},
  shinjuku:{wall:['#9794aa','#5f5b78','#272637'],sign:[6,9,'#f2f2f2','#3a3a7a'],rows:[
   'WbnW#nJJJJn#WbnW',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'kkkkkkkkkkkkkkpp',
   'LaLaaZZZZaLaLapp',
   'jjjjjjjjjjjjjjpp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp',
   'pppppppppppppppp'],
   deco:[['lamp',7,2.6],['lamp',10,7.6],['planter',6.5,9.6],['trash',9,9.6],['bikes',5,8],['signal',4.6,3.5]]}
 };
 function generic(id){const s=typeof byId!=='undefined'&&byId[id];const tone=hash(id.length,id.charCodeAt(0))%4;
  const walls=[['#a3a3a0','#696c74','#2d303b'],['#b1a08b','#746453','#302a30'],['#9ca38b','#65715e','#29352e'],['#9794aa','#5f5b78','#272637']];
  return {wall:walls[tone],sign:[5,10,'#f2f2f2',['#1d4a7a','#2a6a3a','#3a5a3a','#3a3a7a'][tone]],rows:[
   'WnW#WJJJJJJ#WWnW',
   'pppppppyyppppppp','pppppppyyppppppp','pppppppyyppppppp','ppqqqqqyyqqqqqpp','ppqqqqqyyqqqqqpp','ppqqqqqyyqqqqqpp','pppppppyyppppppp','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp'],
   deco:[['lamp',1,4.5],['lamp',14,4.5],['planter',7.5,8],['tree',0.5,9.4],['tree',15,9.4]],name:s?(s.jp+(['haneda','narita','disney'].includes(id)?'':'駅')):''}}
 const NAMES={shinagawa:'品川駅',kitashinagawa:'北品川',gotanda:'五反田駅',shimbashi:'新橋',ueno:'上野駅 不忍口',shibuya:'渋谷駅',shinjuku:'新宿駅 西口'};

 /* ---------- 车站街区（STREET_VIEW.draw） ---------- */
 function street(canvas,id,objects,pos){if(canvas&&window.DAY_ART&&DAY_ART[id]&&DAY_ART[id](canvas,objects,pos))return;
  if(!canvas)return;g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
  const N=!!(window.EXPLORE&&EXPLORE.night()),def=STATIONS[id]||generic(id),m={rows:def.rows,floor:'p',wall:def.wall,doors:{}};
  for(let y=0;y<11;y++)for(let x=0;x<MW;x++)tile(m,x,y,N);
  if(id==='shinagawa')FLOOD.paintWater(g);
  for(const [a,b,c] of def.awn||[]){const x=a*T,w=(b-a+1)*T;px(x,24,w,7,c);for(let i=0;i<w;i+=8)px(x+i,24,4,7,shade(c,28));px(x,31,w,2,shade(c,-30))}
  if(def.sign){const [a,b,fg,bg]=def.sign,x=a*T+4,w=(b-a+1)*T-8;px(x,1,w,12,bg);px(x,1,w,2,shade(bg,30));px(x,12,w,1,shade(bg,-30));text(NAMES[id]||def.name||'',x+w/2,11,fg,9)}
  const list=[];
  for(const d of def.deco||[]){const [k,cx,cy,o]=d;list.push({y:cy*T+16,draw:()=>PROP[k](Math.round(cx*T),Math.round(cy*T),o)})}
  for(const o of objects||[]){
   const cx=o[2]*5.12,cy=o[3]*3.52;list.push({y:cy,draw:()=>propAt(o[0],cx,cy,id)})}
  if(pos)list.push({y:pos.y*3.52,draw:()=>v51PlayerSprite(g,Math.round(pos.x*5.12-16),Math.round(pos.y*3.52-16),GAME_CONFIG.v51View.walk.district,(x,y)=>H18.pixelPerson(g,x,y))});
  list.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
  light(N,(def.deco||[]).filter(d=>d[0]==='lamp').map(d=>[d[1]*T+16,d[2]*T+6]),objects,id);
 }
 /* 夜：整体压暗 + 路灯、售货机、红灯笼的光；最后加暗角（与酒店 render() 相同的参数） */
 function light(N,lamps,objects,id){
  if(N){px(0,0,512,352,'rgba(8,12,34,.42)');
   const glow=(x,y,r,c)=>{const gr=g.createRadialGradient(x,y,4,x,y,r);gr.addColorStop(0,c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)};
   lamps.forEach(([x,y])=>glow(x,y,70,'rgba(255,230,150,.30)'));
   (objects||[]).forEach(o=>{const k=(KIND[o[0]]||[])[0],op=(KIND[o[0]]||[])[1]||{};if(k==='pachinko'||k==='arcade')glow(o[2]*5.12,o[3]*3.52,58,'rgba(255,110,190,.26)');if(k==='vend')glow(o[2]*5.12,o[3]*3.52,56,'rgba(255,90,90,.22)');if(op.lantern)glow(o[2]*5.12,o[3]*3.52,50,'rgba(255,120,80,.26)')});
   (STATIONS[id]||{rows:[]}).rows.slice(0,1).forEach(r=>[...r].forEach((c,i)=>{if(c==='J'||c==='b'||c==='n')glow(i*T+16,20,40,c==='b'?'rgba(140,180,255,.22)':'rgba(255,240,200,.20)')}))}
  const v=g.createRadialGradient(256,176,176*.45,256,176,512*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=v;g.fillRect(0,0,512,352);
 }

 /* ---------- 涩谷街区散步（16×10 格，每格 32px，前两行是墙） ---------- */
 const SHIBUYA_ROOMS={
  plaza:{wall:['#b39a91','#7c626b','#322b40'],floor:'p',sign:[5,10,'JR 渋谷駅  ハチ公口','#2a6a5a'],rows:['################','WnWb#JJJJJJ#bWnW','pppppppppppppppp','pppppppppppppppp','ppppqqqqqqqqpppp','ppppqqqqqqqqpppp','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp']},
  cross:{wall:['#9794aa','#5f5b78','#272637'],floor:'a',sign:[4,11,'SCRAMBLE  渋谷駅前','#3a3a7a'],rows:['################','bnbnbWr#Wnbnbnbn','pppppppppppppppp','kkkkkkkkkkkkkppp','aazzzzzzzzzzappp','aZZZZZZZZZZZappp','aazzzzzzzzzzappp','jjjjjjjjjjjjjppp','pppppppppppppppp','pppppppppppppppp']},
  lane:{wall:['#b39a91','#7c626b','#322b40'],floor:'p',sign:[5,10,'センター街','#8a2a3a'],rows:['################','nWnlWnnW#nlWnWnW','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp','pppppppppppppppp']},
  shop:{wall:['#e3d7c3','#a8977a','#3a3030'],floor:'_',sign:[5,10,'CAMERA  AUDIO','#2a2a3a'],rows:['################','WnnnWnnnnWnnnWWW','________________','________________','________________','________________','________________','________________','________________','________________']}
 };
 /* 障碍物（boxes）在每个房间里画成什么：花坛、展示台、收银台、店铺 */
 function shibuya(canvas,room,s,t,o){
  g=canvas.getContext('2d');g.imageSmoothingEnabled=false;const R=SHIBUYA_ROOMS[room]||SHIBUYA_ROOMS.plaza,N=!!(window.EXPLORE&&EXPLORE.night());
  const m={rows:R.rows,floor:R.floor,wall:R.wall,doors:{}};
  for(let y=0;y<10;y++)for(let x=0;x<MW;x++)tile(m,x,y,N);
  {const [a,b,txt,bg]=R.sign,x=a*T+4,w=(b-a+1)*T-8;px(x,34,w,12,bg);px(x,34,w,2,shade(bg,30));text(txt,x+w/2,44,'#f6eacb',9)}
  const list=[];const add=(y,fn)=>list.push({y,draw:fn});
  for(const [bx,by,bw,bh] of o.boxes){
   if(room==='plaza'){for(let i=0;i<bw;i++)for(let k=0;k<bh;k++){const x=(bx+i)*T,y=(by+k)*T;px(x,y,T,T,'#7a7066');px(x+2,y+2,T-4,T-4,'#35683f');px(x+6+(i*7)%12,y+5,8,6,'#43834c');if((i+k)%2)px(x+20,y+18,3,3,'#e85a7a')}px(bx*T,(by+bh)*T-3,bw*T,3,'#5a5248');add((by+1)*T,()=>PROP.tree(bx*T+(bw*T-32)/2,by*T-8))}
   else if(room==='shop'){for(let i=0;i<bw;i++)for(let k=0;k<bh;k++){const x=(bx+i)*T,y=(by+k)*T;px(x,y+2,T,T-2,'#5c4029');px(x,y+2,T,4,'#765535');if(k===0)px(x+4,y+8,10,7,(i%2)?'#2a2c30':'#e8e8e4');if(k===0)px(x+18,y+10,8,5,'#39434b')}px(bx*T,(by+bh)*T-3,bw*T,3,'#3a281c')}
   else{const top=by,bot=by+bh-1;for(let i=0;i<bw;i++)for(let k=top;k<=bot;k++){const x=(bx+i)*T,y=k*T;if(k<bot){px(x,y,T,T,R.wall[2]);px(x,y+T-2,T,2,shade(R.wall[2],10))}else{face(x,y,m);if(i%2===0)px(x+4,y+7,24,16,N?'#e8c46a':'#3a5a8a');else{px(x+6,y+4,20,26,'#5c3f29');px(x+8,y+6,16,22,'#6d4c33')}}}}
  }
  const POINT={exit:['entrance',{t:'JR'}],cross:['sign',{bg:'#3a3a7a',t:'→'}],plaza:['sign',{bg:'#2a6a5a',t:'←'}],lane:['sign',{bg:'#8a2a3a',t:'→'}],shop:['kiosk'],hachiko:['statue'],drink:['vend',{c:'#2a6aa8'}],scramble:['tripod'],camera:['table',{items:['photo','cup']}],phones:['table',{items:['cup','book']}],claw:['claw'],menu:['menu'],alley:['sign',{bg:'#5a4a3a',t:'→'}]};
  for(const p of o.points){const [x,y,,k]=p;const cx=x*T,cy=y*T;
   if(k==='wait'){add(cy+16,()=>H18.pixelPerson(g,cx,cy,{h:'#302227',s:'#e9bf9c',b:'#887176',a:'#c7b8a0',p:'#373344',k:'#222'},'down'));continue}
   if(k==='staff'){add(cy+16,()=>{H18.pixelPerson(g,cx,cy-30,{h:'#2a1d18',s:'#f0c9a0',b:'#c23a2a',a:'#f2f2f2',p:'#2d3f6e',k:'#111'},'down')});continue}
   if(k==='tanaka'){const pal=(GAME_DATA.story.chapter1.npcs.tanaka||{}).palette;add(cy+16,()=>H18.pixelPerson(g,cx,cy,pal,'down'));continue}
   if(k==='shop'&&room==='cross'){add(cy,()=>{px(cx+3,cy+1,26,30,'#c9ccd2');px(cx+5,cy+9,10,21,'#8fb6c8');px(cx+17,cy+9,10,21,'#8fb6c8');px(cx+15,cy+9,2,21,'#4a5a68');px(cx+3,cy-6,26,9,'#2a2a3a');text('DENKI',cx+16,cy+1,'#e8c46a',7)});continue}
   const [kind,opt]=POINT[k]||['sign'];add(cy+16,()=>PROP[kind](cx,cy,opt))}
  if(room==='cross'){const green=o.green;add(3*T,()=>PROP.signal(1*T,2*T,{green}));add(7*T,()=>PROP.signal(14*T,7*T+4,{green:!green}));
   if(!green){const car=(t/8)%(10*T)-T;add(5*T,()=>{px(car,4*T+6,44,20,'#b86561');px(car+10,4*T+8,22,16,'#879aa2');px(car+40,4*T+8,3,4,'#fff7c8');px(car+40,4*T+20,3,4,'#fff7c8')})}}
  if(room==='plaza')add(2*T,()=>PROP.lamp(13*T,2*T));
  for(const w of o.walkers)add(w.y+16,()=>H18.pixelPerson(g,Math.round(w.x),Math.round(w.y),w.pal,w.dir||'down',w.frame));
  add(s.y*T+16,()=>v51PlayerSprite(g,s.x*T,s.y*T-6,GAME_CONFIG.v51View.walk.plaza,(x,y)=>H18.pixelPerson(g,x,y,null,s.dir||'down')));
  list.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
  if(N){px(0,0,512,320,'rgba(8,12,34,.38)')}
  const v=g.createRadialGradient(256,160,160*.45,256,160,512*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=v;g.fillRect(0,0,512,320);
 }
 const WALKER_PALS=[P('#2a2a33','#e2bc98','#39495c','#aab4c8','#222a38'),P('#4a3544','#dfb494','#84616b','#c9ad76','#46546a'),P('#3b302d','#e4c19b','#687364','#c9ad76','#3a4250'),P('#c9a060','#efcfae','#5a4a6a','#e8e2cc','#2a2c3a')];
 /* ---------- 大车站里的游戏厅：柏青哥（小钢珠）与水果机 ---------- */
 /* [种类, 标记文字, x%, y%]；位置避开了各站已有的调查点。打开的是原来的两个小游戏（tokyo-pachinko-entry-script / tokyo-fruit-script） */
 const ARCADES={
  shinjuku:[['pachinko','パチンコ · 小钢珠',50,30],['arcade','ゲームセンター · 水果机',50,70]],
  shibuya:[['pachinko','パチンコ · 小钢珠',37,73],['arcade','ゲームセンター · 水果机',63,88]],
  ikebukuro:[['pachinko','パチンコ · 小钢珠',40,50],['arcade','ゲームセンター · 水果机',60,50]],
  akihabara:[['arcade','ゲームセンター · 水果机',40,50],['pachinko','パチンコ · 小钢珠',60,50]],
  ueno:[['pachinko','パチンコ · 小钢珠',52,38]],
  shimbashi:[['pachinko','パチンコ · 小钢珠',40,88]]
 };
 function arcades(id){return ARCADES[id]||[]}
 /* v33：彩票亭不再固定在 82%,84%（和药局重叠）。在候选位置里挑第一个离其他标记足够远的 */
 const LOT_CANDS=[[66,93],[34,93],[50,93],[66,58],[34,58],[8,60],[92,68],[20,40],[80,40],[92,28]];const lotPos={};
 /* v36.2：只找一个空位，不改彩票亭的记录（给山田等临时人物用） */
 function freePos(used){const far=([x,y])=>(used||[]).every(u=>((u[0]-x)/11)**2+((u[1]-y)/10)**2>=1);return LOT_CANDS.find(far)||null}
 function lotteryPos(id,used){const far=([x,y])=>(used||[]).every(u=>((u[0]-x)/11)**2+((u[1]-y)/10)**2>=1);const p=LOT_CANDS.find(far)||LOT_CANDS[0];lotPos[id]=p;return p}
 const lotteryAt=id=>lotPos[id]||[82,84];
 function openArcade(kind){const m=kind==='pachinko'?window.TOKYO_PACHINKO:window.TOKYO_FRUIT;if(m&&m.open)m.open();else if(window.UI)UI.toast('游戏厅今天没有开门。')}
 /* v33：装饰（路灯、树、花坛…）占的格子，走路时绕开 */
 function decoTiles(id){const def=STATIONS[id]||generic(id);return (def.deco||[]).map(([k,cx,cy])=>[Math.round(cx),Math.round(cy)])}
 return {decoTiles,street,shibuya,arcades,openArcade,lotteryPos,freePos,lotteryAt,walkerPal:i=>(window.SPRITE2&&SPRITE2.V2&&SPRITE2.V2.length)?{look:SPRITE2.V2[(i*5+3)%SPRITE2.V2.length]}:WALKER_PALS[i%WALKER_PALS.length],stations:STATIONS,kinds:KIND,people:PEOPLE};
})();
window.STATION_ART=STATION_ART;

/* Street exploration v1 — shared hotel pixel assets, no replacement clue store. */
const STREET_VIEW=(()=>{
 const walls={kitashinagawa:['#b09b80','#79654e','#30292b'],gotanda:['#8d9aa0','#596675','#282e38'],shimbashi:['#a99b9e','#71616d','#302936'],ueno:['#9ca38b','#65715e','#29352e'],shinagawa:['#b1a08b','#746453','#302a30'],shibuya:['#b39a91','#7c626b','#322b40'],shinjuku:['#9794aa','#5f5b78','#272637']};
 const people=new Set(['elder','neighbor','driver1','driver2','witness','worker','office','printer','seller']);
 const tiles={archive:'T',cafe:'e',laundry:'U',closed:'d',board:'N',festival:'N',dispatch:'N',log:'T',receipt:'T',complaint:'W',rest:'S',bar:'d',poster:'N',album:'R',photoA:'T',photoB:'T',back:'T',pond:'N',camera:'N'};
 function model(id,objects=[]){
  const rows=Array.from({length:11},(_,y)=>Array.from({length:16},(_,x)=>y<2?'#':y===2?(x%4===1?'W':x%4===3?'A':'#'):y===5||y===6?':':'_'));
  if(id==='ueno'){for(let y=3;y<11;y++)for(let x=11;x<16;x++)rows[y][x]=':';for(const [x,y]of [[11,3],[14,4],[12,8],[14,9]])rows[y][x]='P'}
  if(id==='kitashinagawa'){for(let x=0;x<16;x++)rows[1][x]=x%3?'#':'r';rows[8][1]='G';rows[8][14]='V'}
  if(id==='shinjuku'||id==='shimbashi'){for(let x=1;x<16;x+=3){rows[2][x]='N';rows[3][x]='V'}}
  if(id==='shibuya'){for(let x=5;x<11;x++)for(let y=5;y<8;y++)rows[y][x]=(x+y)%2?'_':':'}
  rows[4][1]='O';rows[4][14]='O';
  return {rows:rows.map(r=>r.join('')),floor:'_',wall:walls[id]||['#a3a3a0','#696c74','#2d303b'],doors:{}};
 }
 function draw(canvas,id,objects=[],pos){
  if(canvas&&window.STATION_ART){STATION_ART.street(canvas,id,objects,pos);return} // v30：车站街区改用酒店风格（97s-station-art.js），下面是旧画法
  if(!canvas)return;const g=canvas.getContext('2d'),m=model(id,objects),night=window.EXPLORE?.night()||false;
  g.imageSmoothingEnabled=false;
  for(let y=0;y<11;y++)for(let x=0;x<16;x++)H18.pixelTile(g,m,x,y,night?'night':'evening');
  const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  if(id==='gotanda')for(let x=32;x<480;x+=112){rect(x,118,68,26,'#c3ae78');rect(x+10,112,40,15,'#657d87');rect(x+6,140,12,5,'#202329');rect(x+50,140,12,5,'#202329');rect(x+26,108,14,4,'#e9dec1')}
  if(id==='ueno'){rect(382,172,130,180,night?'#162a3b':'#354f5b');for(let y=180;y<350;y+=14)rect(390+(y%23),y,62,2,'#547079')}
  if(id==='shinagawa')FLOOD.paintWater(g);
  for(const o of objects){const x=Math.round(o[2]*5.12-16),y=Math.round(o[3]*3.52-16);if(people.has(o[0])){H18.pixelPerson(g,x,y,{h:'#4a3937',s:'#dbb590',b:'#7f6e79',a:'#b4a185',p:'#3c4659',k:'#222'},'down');continue}
   const cell=tiles[o[0]]||'N',obj={rows:Array(11).fill(cell.repeat(16)),floor:'_',wall:m.wall,doors:{}};
   g.save();g.translate(x,y);H18.pixelTile(g,obj,0,0,night?'night':'evening');g.restore();
  }
  if(pos)v51PlayerSprite(g,Math.round(pos.x*5.12-16),Math.round(pos.y*3.52-16),GAME_CONFIG.v51View.walk.district,(x,y)=>H18.pixelPerson(g,x,y));
  if(night){rect(0,0,512,352,'rgba(10,16,48,.30)');for(const x of [48,464]){const light=g.createRadialGradient(x,144,4,x,144,76);light.addColorStop(0,'rgba(255,230,140,.28)');light.addColorStop(1,'rgba(255,230,140,0)');g.fillStyle=light;g.fillRect(x-76,68,152,152)}}
  const shade=g.createRadialGradient(256,176,110,256,176,340);shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=shade;g.fillRect(0,0,512,352);
 }
 function drawDay(id){draw(document.getElementById('day-canvas'),id,DAYINV.scenes[id]?.objects,campaign?.dayInvestigation?.stations?.[id]?.pos)}
 function marker(world,label,x,y,fn,key,id){const b=document.createElement('button');b.className='street-hot';b.dataset.streetObject=key;b.style.left=x+'%';b.style.top=y+'%';const m=id?DAYINV.objectMark(id,key):'·';b.setAttribute('aria-label',(m==='✓'?'重访':m?'调查':'访问')+label);b.innerHTML='<b aria-hidden="true">'+esc(m)+'</b><small>'+esc(label)+'</small>';if(m==='✓')b.classList.add('done');b.onclick=fn;world.appendChild(b);return b}
 const enter=enterDistrict;
 enterDistrict=function(id){const before=campaign?.actions;enter.apply(this,arguments);if(campaign&&district?.id===id&&DAYINV.scenes[id]&&before>campaign.actions){const all=DAYINV.state();const record=all.stations[id]??={started:false,seen:[],relation:'正常交谈',repairs:0,order:[]};record.dayPaid??={};record.dayPaid[campaign.day]=true;record.started=true;record.lastInvestigationDay=campaign.day;campaignSave()}};
 const base=renderDistrict;
 renderDistrict=function(){base.apply(this,arguments);const world=document.getElementById('district-world');if(!world)return;
  const id=district.id,day=campaign&&campaign.day>=2&&campaign.day<=6?DAYINV.scenes[id]:null;
  app.querySelector('#random-event')?.closest('.survival-box')?.remove();
  const shell=world.closest('.rpg-shell'),scenePanel=world.closest('section');if(shell&&scenePanel)shell.prepend(scenePanel);
  world.classList.add('street-pixel');world.querySelector(':scope > svg')?.remove();
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=352;canvas.id='street-canvas';canvas.setAttribute('aria-label',district.jp+'街区');world.prepend(canvas);
  let objects=day?.objects||makeDistrictPlan(district).spots.map(sp=>[sp[0],sp[2],sp[5],sp[6]]);
  if(day){world.querySelectorAll('[data-spot],#district-npc').forEach(b=>b.remove());for(const o of objects)marker(world,o[1],o[2],o[3],()=>DAYINV.page(id,o[0]),o[0],id)}
  const extras=(typeof facilitiesFor==='function'?facilitiesFor(id).filter(f=>f[3]!=='npc'):[]).map(f=>['fac:'+String(f[1]).replace(/\uFE0F/g,''),f[2],f[4],f[5]]);if(typeof hiddenAgents!=='undefined'&&hiddenAgents[id])extras.push(['fac:🕯',hiddenAgents[id][0],50,82]);extras.push(...STATION_ART.arcades(id));if(id==='shimbashi'&&!day)extras.push(['seller','街头占卜师',70,76]); /* v34：白天调查之外，新桥也有占卜摊 */if(window.STATION_LOTTERY?.allowed?.has(id)){const lp=STATION_ART.lotteryPos(id,[...objects,...extras,[50,13],[50,51],[94,51]].map(o=>Array.isArray(o)&&o.length>3?[o[2],o[3]]:o));extras.push(['lottery','宝くじ売場',lp[0],lp[1]])}if(!day&&window.INV_TUT&&INV_TUT.cameoAt(id)){const yp=STATION_ART.freePos([...objects,...extras,[50,13],[50,51],[94,51]].map(o=>Array.isArray(o)&&o.length>3?[o[2],o[3]]:o));if(yp)extras.push(['yamada','山田',yp[0],yp[1]])} /* v36.2 山田 */if(window.EXO&&EXO.at(id)){const xp=STATION_ART.freePos([...objects,...extras,[50,13],[50,51],[94,51]].map(o=>Array.isArray(o)&&o.length>3?[o[2],o[3]]:o));if(xp)extras.push(['exorcist','驱魔人',xp[0],xp[1]])} /* v42 驱魔人 */ // v31：柏青哥与水果机；设施直接读 facilitiesFor（标记上的图标可能已被换成「!」） // v30：设施和彩票亭也画出来
  world.querySelectorAll('.district-hit').forEach(b=>{const label=b.textContent.trim().replace(/^[^\p{L}\p{N}]+/u,'');b.innerHTML='<b aria-hidden="true">·</b><small>'+esc(label)+'</small>'});
  const entry=app.querySelector('.ex-entry'),enter=entry?.querySelector('#ex-enter'),area=EXPLORE.areaFor(id);
  if(enter&&area){const x=94,y=51;marker(world,area.name,x,y,()=>EXPLORE.open(area.id),'local-path');objects=[...objects,['local-path',area.name,x,y]];entry.remove()}
  draw(canvas,id,world.querySelector('#district-npc')?[...objects,...extras,['guide',makeDistrictPlan(district).npc[0],50,13]]:[...objects,...extras]);
  if(id==='shimbashi'&&!day){const b=document.createElement('button');b.type='button';b.className='street-hot fortune-pin';b.style.left='70%';b.style.top='76%';b.setAttribute('aria-label','街头占卜师');b.innerHTML='<b aria-hidden="true">🔮</b><small>街头占卜师</small>';b.onclick=()=>FORTUNE.open();world.appendChild(b)}
  {const ym=extras.find(e=>e[0]==='yamada');if(ym){const b=document.createElement('button');b.type='button';b.className='street-hot yamada-pin';b.style.left=ym[2]+'%';b.style.top=ym[3]+'%';b.setAttribute('aria-label','山田');b.innerHTML='<b aria-hidden="true">☂</b><small>山田</small>';b.onclick=()=>INV_TUT.cameo();world.appendChild(b)}}
  {const xo=extras.find(e=>e[0]==='exorcist');if(xo){const b=document.createElement('button');b.type='button';b.className='street-hot exo-pin';b.style.left=xo[2]+'%';b.style.top=xo[3]+'%';b.setAttribute('aria-label','街头驱魔人');b.innerHTML='<b aria-hidden="true">🧿</b><small>驱魔人</small>';b.onclick=()=>EXO.open();world.appendChild(b)}}
  for(const [kind,label,ax,ay] of STATION_ART.arcades(id)){const b=document.createElement('button');b.type='button';b.className='street-hot arcade-pin';b.style.left=ax+'%';b.style.top=ay+'%';b.setAttribute('aria-label','进入'+label);b.innerHTML='<b aria-hidden="true">'+(kind==='pachinko'?'🎰':'🍒')+'</b><small>'+esc(label)+'</small>';b.onclick=()=>STATION_ART.openArcade(kind);world.appendChild(b)}const p=document.getElementById('district-player');if(p){p.style.setProperty('--v51-player-scale',GAME_CONFIG.v51View.walk.district);p.replaceChildren();const c=document.createElement('canvas');c.width=32;c.height=32;H18.pixelPerson(c.getContext('2d'),0,0);p.appendChild(c)}
  CITYPHOTO.mount(world,id,([x,y])=>{districtPos={x,y};renderDistrictPosition()});OUTINGS.mount(world,id);if(window.STATION_WALK)STATION_WALK.setup(); // v33：按格子走、按 A 交互
  if(id==='shibuya'&&campaign){const door=document.createElement('button');door.className='photo-pin';door.style.cssText='left:51%;top:51%';door.textContent='八公口 → 站前广场';door.onclick=SHIBUYA.open;world.appendChild(door);V51ADD.shibuyaPins(world,'.district-hit,.street-hot,.photo-pin')}
  if(id==='shinagawa')FLOOD.mountObservation(world.closest('section'),'drain');
  const chat=document.getElementById('district-chat');if(chat)chat.innerHTML='<strong>'+esc(district.jp)+' · 街区调查</strong><p>走到人或店铺旁边按 A（也可以直接点它，会自动走过去）。进入场景不消耗行动。</p>';
 };
 return {draw,drawDay,model};
})();
window.STREET_VIEW=STREET_VIEW;
/* City photography. The album stores exposures, the offline plates live in the HTML. */
const CITYPHOTO=(()=>{
 const spots=[
  {id:'hachiko',region:'shibuya',area:'涩谷',name:'忠犬八公像',title:'约定的地方',note:'等人的人换了一拨。铜像一直朝着站口。',position:[35,75],scene:'sh-map',plate:'hachiko',kind:'city'},
  {id:'scramble',region:'shibuya',area:'涩谷',name:'涩谷十字路口',title:'灯变之前',note:'鞋底带起的水光，比绿灯多留了一会儿。',position:[43,80],scene:'street-canvas',plate:'shibuya',kind:'city'},
  {id:'kaminarimon',region:'asakusa',area:'浅草',name:'雷门',title:'灯笼下面',note:'檐下有人收了伞。灯笼上的字，半边还在阴影里。',position:[54,81],scene:'street-canvas',plate:'asakusa',kind:'city'},
  {id:'shinobazu',region:'ueno',area:'上野',name:'不忍池',title:'池面留白',note:'岸上的人走过去了。水里那排树还在原处。',position:[44,79],scene:'street-canvas',plate:'ueno',kind:'city'}
 ];
 const plates={hachiko:'./assets/97s-station-art/2cb9a320c9e86405.jpg',"shibuya":"./assets/97s-station-art/3cf7d4398d8703b7.jpg","asakusa":"./assets/97s-station-art/c78708b4382956eb.jpg","ueno":"./assets/97s-station-art/43448d85012cb9b8.jpg"};
 // Develop each original plate on a fixed pixel grid, shared by the finder and album.
 const developed=new Map();
 function developImages(root){
  for(const img of root.querySelectorAll('img[data-plate]')){
   const id=img.dataset.plate;
   if(!developed.has(id)){
    const original=new Image();original.src=plates[id];
    const ready=original.decode().then(()=>{
     const canvas=document.createElement('canvas');canvas.width=288;canvas.height=Math.round(288*original.height/original.width);
     const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(original,0,0,canvas.width,canvas.height);
     const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
     for(let i=0;i<pixels.data.length;i+=4){
      for(let channel=0;channel<3;channel++)pixels.data[i+channel]=Math.round(pixels.data[i+channel]/12)*12;
     }
     ctx.putImageData(pixels,0,0);return canvas.toDataURL('image/png');
    }).catch(()=>plates[id]);
    developed.set(id,ready);
   }
   developed.get(id).then(url=>{if(img.isConnected)img.src=url});
  }
 }
 const find=id=>spots.find(s=>s.id===id);
 function albumState(){return campaign.photography??={version:1,photos:[]}}
 function record(s,x,y,phase){
  const album=albumState(),photo={id:1+(album.photos.at(-1)?.id||0),spot:s.id,region:s.region,day:campaign.day,viewed:false,kind:s.kind,event:null,x,y,phase};
  album.photos.push(photo);campaignSave();return photo;
 }
 function mount(host,region,approach){
  if(!campaign||!host)return;
  for(const s of spots.filter(s=>s.region===region&&s.scene!=='sh-map')){
   const b=document.createElement('button');b.type='button';b.className='photo-pin';b.textContent='⌗ '+s.name;b.ariaLabel='走近'+s.name+'取景';
   b.style.left=s.position[0]+'%';b.style.top=s.position[1]+'%';host.appendChild(b);
   b.onclick=e=>{e.stopPropagation();if(document.querySelector('.sc-overlay,.et-modal-back,#day-read button')||DM.isOpen())return;approach?.(s.position);camera(s)};
  }
 }
 let dialog=null,animation=0;
 function shell(title){
  if(!dialog){dialog=document.createElement('dialog');dialog.className='photo-room';document.body.appendChild(dialog);dialog.addEventListener('close',()=>{cancelAnimationFrame(animation);dialog.remove();dialog=null},{once:true});dialog.showModal()}
  cancelAnimationFrame(animation);dialog.onkeydown=null;dialog.setAttribute('aria-label',title);dialog.innerHTML='<header><small>東京採集帖　/　CITY NEGATIVES</small><button data-close aria-label="返回游戏">×</button></header><main></main>';
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();return dialog.querySelector('main');
 }
 function print(s,x,y,phase){
  const gleam=s.id==='scramble'?'<svg aria-hidden=true class=street-subject viewBox="0 0 14 23" style="position:absolute;top:69%;width:4%;left:'+(20+phase*55)+'%;shape-rendering:crispEdges"><path fill="#29384a" d="M0 6h2V4h2V2h3V1h1v1h3v2h2v2h1v1H0z"/><path fill="#bb9280" d="M5 7h4v4H5z"/><path fill="#49505b" d="M4 11h6l1 8H3z"/><path fill="#263547" d="M4 19h2v4H4zm4 0h2v3H8z"/></svg>':s.region==='ueno'?'<i class="pond-glint" style="left:'+(20+phase*55)+'%;opacity:'+(.12+.3*Math.sin(Math.PI*phase))+'"></i>':'';
  return '<div class="photo-paper"><img alt="'+s.name+'" data-plate="'+s.plate+'" style="object-position:'+x+'% '+y+'%;transform-origin:'+x+'% '+y+'%">'+gleam+'</div>';
 }
 function sound(){
  try{const ctx=new AudioContext(),buf=ctx.createBuffer(1,ctx.sampleRate*.095,ctx.sampleRate),v=buf.getChannelData(0);
   for(let i=0;i<v.length;i++){const t=i/ctx.sampleRate;v[i]=(Math.random()-.5)*(.62*Math.exp(-85*t)+(t>.045?.4*Math.exp(-100*(t-.045)):0))}
   const source=ctx.createBufferSource();source.buffer=buf;source.connect(ctx.destination);source.onended=()=>ctx.close();source.start();
  }catch{}
 }
 function camera(s,coach=false){
  const main=shell(s.name+' · 取景');let x=50,y=50,phase=0;
  main.innerHTML='<small>取景　/　'+s.area+'</small><h2>'+s.name+'</h2><div class="photo-frame">'+print(s,x,y,phase)+'<i class="photo-grid"></i></div><p>用方向键或下方按钮微调构图，按快门留下这一刻。</p><footer><div class="photo-pad">'+['←','↑','↓','→'].map((v,i)=>'<button data-pan="'+i+'" aria-label="向'+['左','上','下','右'][i]+'取景">'+v+'</button>').join('')+'</div><button data-shoot disabled>按下快门</button></footer>';
  developImages(main);const img=main.querySelector('img'),shutter=main.querySelector('[data-shoot]'),glint=main.querySelector('.pond-glint,.street-subject');
  function pan(i){const [dx,dy]=[[-10,0],[0,-10],[0,10],[10,0]][i];x=Math.max(0,Math.min(100,x+dx));y=Math.max(0,Math.min(100,y+dy));img.style.objectPosition=img.style.transformOrigin=x+'% '+y+'%'}
  main.querySelectorAll('[data-pan]').forEach(b=>b.onclick=()=>pan(+b.dataset.pan));
  dialog.onkeydown=e=>{const i=['ArrowLeft','ArrowUp','ArrowDown','ArrowRight'].indexOf(e.key);if(i>=0){e.preventDefault();pan(i)}};
  img.onload=()=>shutter.disabled=false;if(img.complete&&img.naturalWidth)shutter.disabled=false;
  if(glint){const start=performance.now();function tick(now){phase=((now-start)%6500)/6500;glint.style.left=(20+phase*55)+'%';if(s.region==='ueno')glint.style.opacity=.12+.3*Math.sin(Math.PI*phase);animation=requestAnimationFrame(tick)}animation=requestAnimationFrame(tick)}
  shutter.onclick=()=>{if(shutter.disabled)return;shutter.disabled=true;sound();const photo=record(s,x,y,phase);detail(photo,true);if(coach){const p=document.createElement('p');p.textContent=x===50&&y===50?'田中看了一眼取景窗。“别急着收。等过街的人进了画面，还可以再试一张。”':'田中轻轻点头。“对。挪一点，招牌就不会压在人的头顶了。”';dialog.querySelector('main').appendChild(p)}};
 }
 function detail(p,fresh=false,filter='all'){
  const s=find(p.spot),main=shell(s.name);if(!fresh&&!p.viewed){p.viewed=true;campaignSave()}
  main.innerHTML='<small>'+s.area+'　/　DAY '+p.day+'</small><h2>'+s.title+'</h2><figure class="'+(fresh?'photo-developed':'')+'">'+print(s,p.x,p.y,p.phase)+'<figcaption>'+s.name+'　·　'+s.note+'</figcaption></figure><footer><span role="status">'+(fresh?'已保存到相册':'底片 № '+String(p.id).padStart(3,'0'))+'</span><button data-gallery>打开相册</button>'+(fresh?'<button data-retake>再拍一张</button>':'')+'</footer>';
  developImages(main);main.querySelector('[data-gallery]').onclick=()=>gallery(filter);const b=main.querySelector('[data-retake]');if(b)b.onclick=()=>camera(s);
 }
 function gallery(filter='all'){
  const main=shell('城市相册'),photos=albumState().photos.filter(p=>find(p.spot)&&(filter==='all'||filter===p.region)).slice().reverse();
  main.innerHTML='<small>CONTACT SHEET　/　私人底片</small><h2>城市相册</h2><nav>'+[['all','全部'],...Array.from(new Map(spots.map(s=>[s.region,s.area])))].map(([id,name])=>'<button data-region="'+id+'" aria-pressed="'+(id===filter)+'">'+name+'</button>').join('')+'</nav><section class="photo-contacts">'+photos.map(p=>{const s=find(p.spot);return '<button data-print="'+p.id+'">'+print(s,p.x,p.y,p.phase)+'<b>'+s.title+'</b><small>'+s.name+' · DAY '+p.day+'</small></button>'}).join('')+'</section>'+(photos.length?'':'<p>这页还空着。下次在街上遇见想留下的画面，再把它放进来。</p>');
  developImages(main);main.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>gallery(b.dataset.region));main.querySelectorAll('[data-print]').forEach(b=>b.onclick=()=>detail(photos.find(p=>p.id===+b.dataset.print),false,filter));
 }
 // Keep game movement shortcuts out of a mounted viewfinder; native modal handles focus.
 for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{if(!dialog?.open)return;if(type==='keydown'&&dialog.onkeydown&&e.key.startsWith('Arrow'))dialog.onkeydown(e);if(e.key!=='Tab')e.stopImmediatePropagation()},true);
 return {mount,gallery,shoot:(id,coach=false)=>{const s=find(id);if(s)camera(s,coach)}};
})();



const STREET_WALK=(()=>{
 for(const station of stations){
  for(const [kind,day,jp,zh] of [
   ['ordinary',2,'すみません、通ります。','身后的路人轻声借过。你侧身让开，他赶向车站，很快消失在人群里。'],
   ['anomaly',3,'……今、誰と話していたんですか。','路灯下的人问你刚才在和谁说话。你转头看向空荡的街道，再回头时，他已经走远了。']]){
   STREET.data.push({id:'SW-'+station.id+'-'+kind,district:station.id,day,ambient:kind,npc:kind==='ordinary'?'赶路的人':'路灯下的人',opening:{jp,zh},choices:[{tone:'继续',jp:'……。',zh:'留意四周，继续调查。',next:'leave'}],branches:{leave:{lines:[{jp:'',zh:'你回到刚才的位置。街道上的声音又清晰起来。'}]}}});
  }
 }

 // Persistent daily per-station cap prevents re-entry/reload farming. No timers roll events.
 function state(){campaign.streetWalk??={version:1,day:campaign.day,stations:{},seen:[],pending:null};const s=campaign.streetWalk;if(s.day!==campaign.day){s.day=campaign.day;s.stations={};s.seen=[];s.pending=null}return s}
 function blocked(){return !campaign||campaign.hp<=0||campaign.san<=0||!!campaign.streetConflict?.active||!!document.querySelector('.sc-overlay,.et-modal-back')||DM.isOpen()||H18.active()}
 function step(id,view,random=Math.random){
  if(!id||blocked()||campaign.day<2||campaign.day>5)return false;
  if(view==='day'&&document.querySelector('#day-read button'))return false;
  const s=state(),r=s.stations[id]??={steps:0,count:0,since:0};r.steps++;r.since++;
  if(r.count>=2||r.since<6){campaignSave();return false}
  const baseChance=Math.min(.32,.10+(r.steps-6)*.025),chanceRoll=random(),kindRoll=random();
  if(kindRoll>=.8){if(chanceRoll<baseChance)r.since=0;campaignSave();return false}const kind=kindRoll<.5?'ordinary':'anomaly';
  const candidates=STREET.data.filter(d=>d.district===id&&d.day<=campaign.day&&!s.seen.includes(d.id)&&!campaign.streetConflict?.events?.[d.id]&&d.id!=='SC-KON-01'&&(kind==='anomaly'?d.ambient==='anomaly'&&EXPLORE.night():d.ambient!=='anomaly'));
  if(!candidates.length){campaignSave();return false}
  const d=candidates[Math.floor(random()*candidates.length)];
  let chance=!d.ambient&&window.OMI?OMI.prob(baseChance,'hostile'):baseChance;
  if(kind==='anomaly'&&window.V74)chance=V74.anomalyRoll(chance); // v74：异常遭遇加成（实际掷判定时才用掉）
  if(chanceRoll>=chance){campaignSave();return false}
  const pos=view==='day'?campaign.dayInvestigation?.stations?.[id]?.pos:view==='explore'?EXPLORE.state():districtPos;
  s.pending={id,view,pos:pos?JSON.parse(JSON.stringify(pos)):null,scroll:window.scrollY,focus:document.activeElement?.dataset?.streetObject||null};
  s.seen.push(d.id);r.count++;r.since=0;campaignSave();STREET.show(d.id);return true;
 }
 function restoreView(){const p=campaign?.streetWalk?.pending;if(!p)return;district=byId[p.id]||district;
  if(p.view==='shibuya'){SHIBUYA.open()}else if(p.view==='day'){DAYINV.page(p.id)}else if(p.view==='explore'){const a=EXPLORE.areaFor(p.id);if(a)EXPLORE.open(a.id,{pos:p.pos})}else{if(p.pos)districtPos={...p.pos};renderDistrict()}}
 function restore(){const s=campaign?.streetWalk,p=s?.pending;if(!p)return;
  // The underlying scene stays mounted during the encounter. Rebuild only after loading.
  if(!(p.view==='shibuya'?document.getElementById('sh-map'):p.view==='day'?document.getElementById('day-map'):p.view==='explore'?document.getElementById('ex-canvas'):document.getElementById('district-world')))restoreView();
  window.scrollTo(0,p.scroll||0);if(p.focus)document.querySelector('[data-street-object="'+p.focus+'"]')?.focus({preventScroll:true});s.pending=null;campaignSave();
 }
 const move=moveDistrict;moveDistrict=function(dx,dy){if(blocked())return;move(dx,dy);if(!districtTarget)step(district?.id,'district')};
 return {state,blocked,step,restore,restoreView};
})();
window.STREET_WALK=STREET_WALK;
