/* ==== engine/survival/86-art.js ==== */
/* ===================================================================
   【V19 美术：程序生成的像素立绘与标题主视觉（不需要图片文件）】
   ART.portrait(spec)  生成 48×48 像素立绘（对话框左侧显示）
     spec 写在 story/chapter1/npcs.json 的 "portrait"：
       hair: short / neat / bob / bun / gray / long / cap（保安帽）/ bald
       acc : glasses / nametag / tie / apron / badge / scarf（可多个）
       bg  : 背景色，例如 "#2a3550"；age: "old" 会画皱纹
     颜色沿用人物的 palette（h 头发 s 皮肤 b 衣服 a 点缀）
   ART.title(canvas)   夜东京主视觉（东京塔、楼群灯光、天空巨眼、雨、电车），会一直播放动画
   =================================================================== */
const ART=(function(){
 const cache={};
 function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=(n>>16)+amt,g=(n>>8&255)+amt,b=(n&255)+amt;r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
 function portrait(spec,pal,extra){
  spec=spec||{};pal=pal||{};extra=extra||{};
  const key=JSON.stringify([spec,pal,extra]);if(cache[key])return cache[key];
  const c=document.createElement('canvas');c.width=48;c.height=48;const g=c.getContext('2d');
  const P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
  const skin=pal.s||'#e8c4a0',hair=pal.h||'#2a1d18',cloth=pal.b||'#2d3f6e',acc=pal.a||'#f2f2f2',bg=spec.bg||'#243046';
  /* 背景：上亮下暗 + 细横纹 */
  for(let y=0;y<48;y++)P(0,y,48,1,shade(bg,Math.round((24-y)*0.9)));
  for(let y=1;y<48;y+=3)P(0,y,48,1,'rgba(0,0,0,.12)');
  /* 肩膀与衣服 */
  P(6,37,36,11,cloth);P(8,35,32,3,cloth);P(6,37,3,11,shade(cloth,-18));P(39,37,3,11,shade(cloth,-25));
  /* 脖子 */
  P(20,29,8,7,shade(skin,-14));
  /* 头：圆角方形 + 右侧阴影 */
  P(15,11,18,19,skin);P(14,13,1,14,skin);P(33,13,1,14,skin);P(16,30,16,1,skin);P(29,12,4,18,shade(skin,-12));P(17,30,12,1,shade(skin,-10));
  /* 耳朵 */
  P(13,19,2,5,skin);P(33,19,2,5,shade(skin,-12));
  /* 眼睛、眉毛、鼻子、嘴 */
  const eye=extra.ghost?'#c9d8ff':'#1b1b24';
  P(18,20,3,2,eye);P(27,20,3,2,eye);P(18,20,1,1,'#ffffff');P(27,20,1,1,'#ffffff');
  const brow=spec.hair==='gray'||spec.hair==='bald'?'#9a9a9a':shade(hair,-10);
  if(extra.worried){P(17,17,4,1,brow);P(17,16,1,1,brow);P(27,17,4,1,brow);P(30,16,1,1,brow)}else{P(17,17,4,1,brow);P(27,17,4,1,brow)}
  P(24,22,2,4,shade(skin,-22));
  P(21,27,6,1,extra.worried?'#8a4a4a':'#a05a55');
  if(spec.age==='old'){P(16,24,2,1,shade(skin,-26));P(30,24,2,1,shade(skin,-30));P(18,23,3,1,shade(skin,-20));P(27,23,3,1,shade(skin,-24));P(20,14,8,1,shade(skin,-16))}
  if(extra.sweat){P(34,15,2,3,'#8fd0ff');P(35,14,1,1,'#cfeaff')}
  /* 头发 */
  const H=hair,Hd=shade(hair,-22),Hl=shade(hair,18);
  switch(spec.hair){
   case 'bob':P(13,8,22,6,H);P(12,11,4,15,H);P(32,11,4,15,Hd);P(16,14,6,2,H);P(26,14,4,2,H);P(14,9,10,1,Hl);break;
   case 'bun':P(14,9,20,5,H);P(13,11,3,9,H);P(32,11,3,8,Hd);P(20,4,8,6,H);P(21,4,4,1,Hl);P(15,10,9,1,Hl);break;
   case 'long':P(13,8,22,6,H);P(11,11,5,24,H);P(32,11,5,24,Hd);P(16,14,16,2,H);P(14,9,10,1,Hl);break;
   case 'gray':P(14,9,20,4,'#c9c9c9');P(13,11,3,8,'#b5b5b5');P(32,11,3,8,'#9a9a9a');P(16,9,8,1,'#e8e8e8');break;
   case 'bald':P(13,15,3,6,'#b5b5b5');P(32,15,3,6,'#9a9a9a');P(17,11,10,1,shade(skin,16));break;
   case 'cap':P(13,7,22,7,shade(cloth,-10));P(11,13,26,2,shade(cloth,-30));P(22,8,4,3,acc);P(13,14,3,6,H);P(32,14,3,6,Hd);break;
   case 'neat':P(14,8,20,6,H);P(13,11,3,8,H);P(32,11,3,7,Hd);P(26,9,6,3,Hl);P(15,9,6,1,Hl);break;
   default:P(14,8,20,6,H);P(13,10,3,9,H);P(32,10,3,8,Hd);P(17,13,10,2,H);P(15,9,8,1,Hl);
  }
  /* 配饰 */
  (spec.acc||[]).forEach(a=>{
   if(a==='glasses'){g.fillStyle='#d8d8e0';g.fillRect(17,19,5,1);g.fillRect(26,19,5,1);g.fillRect(17,22,5,1);g.fillRect(26,22,5,1);g.fillRect(17,19,1,4);g.fillRect(21,19,1,4);g.fillRect(26,19,1,4);g.fillRect(30,19,1,4);g.fillRect(22,20,4,1)}
   if(a==='nametag'){P(28,40,9,4,'#f4f1e6');P(29,41,5,1,'#556');P(29,42,3,1,'#889')}
   if(a==='tie'){P(23,36,3,10,acc);P(22,35,5,2,shade(acc,-20));P(19,35,4,3,'#f2f2f2');P(26,35,4,3,'#f2f2f2')}
   if(a==='apron'){P(16,38,16,10,'#f2f2ea');P(16,35,3,4,'#f2f2ea');P(29,35,3,4,'#f2f2ea');P(21,42,6,3,'#dcdcd2')}
   if(a==='badge'){P(12,40,4,5,acc);P(13,41,2,3,shade(acc,30))}
   if(a==='scarf'){P(16,33,16,4,acc);P(26,36,4,6,shade(acc,-15))}
  });
  if(extra.ghost){const d=g.getImageData(0,0,48,48),px=d.data;for(let i=0;i<px.length;i+=4){const y=(i/4/48)|0;px[i]=px[i]*0.55+70;px[i+1]=px[i+1]*0.6+85;px[i+2]=px[i+2]*0.6+120;if(y%2)px[i+3]=200}g.putImageData(d,0,0)}
  return cache[key]=c.toDataURL();
 }
 /* ---------- 标题主视觉 ---------- */
 function title(cv){
  if(!cv||cv.__art)return;cv.__art=true;const W=cv.width=320,Hh=cv.height=150,g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const stars=[...Array(40)].map(()=>[rnd()*W,rnd()*60,rnd()]);
  const blds=[];let x=0;while(x<W){const w=10+(rnd()*22|0),h=30+(rnd()*55|0);blds.push({x,w,h,win:[...Array(40)].map(()=>rnd()<0.35)});x+=w+1}
  const drops=[...Array(70)].map(()=>[rnd()*W,rnd()*Hh,2+rnd()*2]);
  let t0=performance.now(),train=-120;
  function frame(now){
   if(!document.body.contains(cv)){cv.__art=false;return}
   const t=(now-t0)/1000;
   const sky=g.createLinearGradient(0,0,0,Hh);sky.addColorStop(0,'#0b0d16');sky.addColorStop(0.6,'#1a1630');sky.addColorStop(1,'#2b1b2c');g.fillStyle=sky;g.fillRect(0,0,W,Hh);
   stars.forEach(([sx,sy,b])=>{g.fillStyle=`rgba(232,235,240,${0.25+0.5*Math.abs(Math.sin(t*0.7+b*9))})`;g.fillRect(sx|0,sy|0,1,1)});
   /* 天空巨眼：缓慢睁开 */
   const open=Math.max(0,Math.sin(t*0.25))*0.9+0.1,ex=232,ey=36;
   g.fillStyle='rgba(182,156,232,.10)';g.beginPath();g.ellipse(ex,ey,62,26,0,0,7);g.fill();
   g.fillStyle='#d9cfe9';g.beginPath();g.ellipse(ex,ey,44,14*open,0,0,7);g.fill();
   g.fillStyle='#5b2a4a';g.beginPath();g.arc(ex+Math.sin(t*0.4)*10,ey,10*Math.min(1,open*1.2),0,7);g.fill();
   g.fillStyle='#0b0d16';g.fillRect(ex-2+Math.sin(t*0.4)*10|0,ey-7*open|0,4,14*open|0);
   g.strokeStyle='#3a2a44';g.lineWidth=2;g.beginPath();g.ellipse(ex,ey,44,14*open,0,0,7);g.stroke();
   /* 东京塔 */
   const tx=74,base=Hh-28;g.fillStyle='#c4483a';
   for(let i=0;i<70;i++){const w=Math.max(1,(70-i)*0.22|0);g.fillRect(tx-w,base-i,w*2,1)}
   g.fillStyle='#f2efe6';g.fillRect(tx-4,base-40,8,2);g.fillRect(tx-2,base-62,4,2);
   g.fillStyle=Math.sin(t*3)>0?'#ff5a4a':'#7a2a2a';g.fillRect(tx-1,base-72,2,2);
   /* 楼群 */
   blds.forEach(b=>{const y=Hh-b.h;g.fillStyle='#141a26';g.fillRect(b.x,y,b.w,b.h);let k=0;for(let wy=y+4;wy<Hh-6;wy+=5)for(let wx=b.x+2;wx<b.x+b.w-2;wx+=4){if(b.win[k++%40]&&Math.sin(t*0.3+k)>-0.9){g.fillStyle=k%7?'#d7a879':'#e8ebf0';g.globalAlpha=0.55;g.fillRect(wx,wy,2,2);g.globalAlpha=1}}});
   /* 高架电车 */
   g.fillStyle='#232a38';g.fillRect(0,Hh-22,W,3);train+=1.4;if(train>W+40)train=-200;
   for(let i=0;i<5;i++){const cx=train+i*30;g.fillStyle='#8ea0b4';g.fillRect(cx,Hh-30,28,8);g.fillStyle='#82b955';g.fillRect(cx,Hh-25,28,1);g.fillStyle='#f3e3a0';for(let w=0;w<4;w++)g.fillRect(cx+3+w*6,Hh-28,3,2)}
   /* 雨 */
   g.strokeStyle='rgba(143,182,200,.35)';g.lineWidth=1;drops.forEach(d=>{d[1]+=d[2];d[0]-=d[2]*0.3;if(d[1]>Hh){d[1]=-5;d[0]=Math.random()*W+20}g.beginPath();g.moveTo(d[0],d[1]);g.lineTo(d[0]+1.5,d[1]-5);g.stroke()});
   /* 暗角 + 扫描线 */
   const v=g.createRadialGradient(W/2,Hh/2,40,W/2,Hh/2,W*0.65);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=v;g.fillRect(0,0,W,Hh);
   for(let y=0;y<Hh;y+=2){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,y,W,1)}
   requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
 }
 return {portrait,title,shade};
})();
window.ART=ART;

/* 标题主视觉：角色创建画面、东京地图顶部 */
function mountTitleArt(){
 const hero=app.querySelector('#survival-setup .rpg-hero')||app.querySelector('.rpg-hero');if(!hero||hero.querySelector('.et-title-art'))return;
 hero.insertAdjacentHTML('afterbegin','<canvas class="et-title-art" aria-hidden="true"></canvas>');ART.title(hero.querySelector('.et-title-art'));
}
const artSetup=setupCampaign;setupCampaign=function(){artSetup();mountTitleArt()};
const artMap=tokyoHome;tokyoHome=function(){artMap();mountTitleArt()};
/* 角色创建画面会在点选项时重新绘制，这里自动补回主视觉 */
new MutationObserver(()=>{if(UI.current()==='setup'||UI.current()==='map')mountTitleArt()}).observe(app,{childList:true});
