/* ==== engine/survival/97y-flood-prayer.js ==== */
/* ===================================================================
   【v40 品川浸水 · 浅草寺祈福 · 水没死亡】
   - DAY 4（config flood.warnDay）起第一次打开东京地图：临时新闻 + 调查局邮件，预警海水将漫到品川。
   - 浅草寺本堂（PRAYER）：手水舍净手 → 常香炉上香 → 赛钱箱奉纳 → 合掌参拜 → 用日语说出心愿。
     「品川を、守ってください。」→ 过场：香烟升空、向南飘、在品川结成看不见的界线。
   - 品川被淹的日子：没有祈福 = 第 8 天（flood.unblessedDay），祈福后 = 第 10 天（flood.blessedDay）。
     只在「申请了延迟结案、报告还没交」时才会发生（不延期的话第 7 天就结案了）。
     那一天结束（或到了下一天）还没结案 → 品川水没 → 演出 → BAD END 14「品川水没」。
   - 品川被淹那天的早上自动存一个检查点（localStorage），死亡画面可以「回到第 N 天早上」。
   - 存档：campaign.flood = {warned, warnDay, prayed, prayDay, offering, ritual:{day,purify,incense}, cpDay, told:{}}
   =================================================================== */
const FLOOD=(function(){
 const CFG=()=>Object.assign({warnDay:4,blessedDay:10,unblessedDay:8},GAME_CONFIG.flood||{});
 const CPKEY='et-flood-checkpoint-v1';
 let playingFor=null;
 function st(){if(!campaign)return null;campaign.flood??={};const f=campaign.flood;f.told??={};return f}
 const prayed=()=>!!(campaign&&campaign.flood&&campaign.flood.prayed);
 const floodDay=()=>prayed()?CFG().blessedDay:CFG().unblessedDay;
 const cs=()=>window.CASE5&&CASE5.state();
 function caseOpen(){const s=cs();return !!(s&&s.start!=null&&['active','due','report'].includes(s.state))}
 const save=()=>{try{campaignSave()}catch(e){}};
 function jz(jp,zh){return '<p class="pr-jp" lang="ja">'+esc(jp)+'</p>'+(typeof langMode==='function'&&langMode()==='learning'&&typeof trToggle==='function'?trToggle(zh):'<p class="pr-zh">'+esc(zh)+'</p>')}
 /* ---------- 预警 ---------- */
 function warnable(){const f=st();return !!(f&&!f.warned&&!f.prayed&&campaign.firstDayComplete&&campaign.day>=CFG().warnDay&&caseOpen())}
 function warn(){const f=st();if(f.warned)return;f.warned=true;f.warnDay=campaign.day;save();if(window.KSHOP)KSHOP.floodNotice();else news(true)}
 function news(fresh=false){if(fresh&&window.AUDIO)AUDIO.sfx('ding');
  UI.modal({title:'📺 臨時ニュース · 紧急新闻',html:'<div class="flood-news">'+jz('東京湾の潮位が、観測史上ない速さで上がっています。','东京湾的潮位，正以观测史上从未有过的速度上涨。')+jz('品川区と港区の沿岸部に、浸水注意報が出されました。','品川区和港区沿岸，发布了浸水注意报。')+'<p>画面角落的潮位图上，品川的位置被标成了红色。主播说完这句话，停顿了很久，像是在听耳机里的什么声音。</p></div>'+(fresh?'<p class="survival-tip">📧 调查局发来了一封邮件。</p>':''),
   buttons:[{label:'打开邮件',primary:true,fn:()=>{try{if(window.MAIL&&MAIL.page)MAIL.page()}catch(e){}}},{label:'稍后再看'}]});
 }
 function mails(){const f=campaign?.flood;if(!f?.warned)return [];
  const out=[{id:'flood-warn',from:'INVESTIGATION BUREAU',subject:'【紧急】品川区域异常浸水 / 处置建议',date:'DAY '+f.warnDay,tag:'紧急',lines:[
   '调查员 {name}：',
   '东京湾的潮位出现了无法解释的异常。近期品川区域的水位持续上涨，部分监测设备已经无法正常工作。',
   '目前尚无法确定异常现象将持续多久。',
   {gap:true},
   '调查局旧档案中存在一条相关记录：此前出现类似异常时，浅草寺本堂的祈祷曾使水位暂时下降。',
   '浅草寺供奉的观音，相传是很久以前，隅田川的渔夫用网捞上来的。',
   '建议你在调查期间关注品川沿岸的异常情况。如有必要，可以前往浅草寺本堂调查。',
   {sys:'📍 东京地图 → 浅草站 → 街区里的浅草寺本堂'}]}];
  if(f.prayed)out.push({id:'flood-blessed',from:'INVESTIGATION BUREAU',subject:'品川区域 / 潮位观测更新',date:'DAY '+f.prayDay,tag:'观测',lines:[
   '品川站周围出现了一圈无法解释的稳定区。监控画面里，海水在那里停住了。',
   '界线内侧已经出现退水，外侧的潮位计仍然时有失灵。我们会继续观测。']});
  return out}
 setTimeout(()=>{try{if(window.MAIL&&MAIL.extend)MAIL.extend({mails})}catch(e){}},0);
 /* ---------- 地图 ---------- */
 function onMap(){if(!campaign||check(false))return;if(warnable())warn();box()}
 function box(){const f=campaign?.flood;if(!f?.warned||!caseOpen())return;
  const r=app.querySelector('.rpg-shell');if(!r||r.querySelector('#flood-box'))return;
  const card=document.createElement('section');card.className='survival-box flood-box';card.id='flood-box';
  card.innerHTML='<b>📰 首都新報 · 地方版</b><p class="survival-tip">'+(f.prayed?'沿岸监控拍到一段没有波纹的水面。':'品川和港区沿岸的积水情况仍在观测中。')+'</p><button type="button" class="survival-btn alt">看那则小新闻</button>';
  card.querySelector('button').onclick=()=>window.KSHOP?KSHOP.floodClip():news();r.prepend(card);
 }
 /* Optional local observations. These never enter the case evidence ledger. */
 const observations={
  glass:{title:'港屋酒店 · 玻璃门外',text:{
   early:'前台把门口的吸水垫换了一次。她说附近几条街的排水管这两天一直堵着。',
   rising:'街道上的雨水沿着路缘缓缓流动。水似乎不是流向排水沟，而是从排水沟里慢慢涌出来。',
   danger:'酒店门外响着一阵阵拍岸声。玻璃上的倒影摇晃，路缘只剩一条细线。',
   calm:'门前的水退了，玻璃门下留了一道盐白色的水痕。隔着一条街，积水的边缘平得像用尺画过。',
   returning:'退水后留下的白线又湿了。水面静了一阵，随后一小片波纹越过了原先平直的边缘。',
  }},
  drain:{title:'品川 · 排水口',text:{
   early:'排水篦子边留着几摊水，浮着一点细白的泡沫。附近的道路广播刚提到沿岸积水。',
   rising:'排水口里传来低沉的声音，像远处不断拍打岸边的海浪。这里距离海边，应该还有一段距离。',
   danger:'一股墨黑色的水从篦子里冒出来，没过鞋尖前又缩了回去。路面上留下一圈细盐。',
   calm:'露出的排水篦子上挂着一小截海草。几步外的水面没有一点波纹。',
   returning:'排水篦子底下又传来了响声。积水先向外退了一指，随后又慢慢涨回来。',
  }},
  temple:{title:'浅草寺 · 本堂',text:{
   calm:'本堂里很安静。香烟还在往南飘。廊下水钵里的倒影平平整整。',
   returning:'香烟仍朝南去，到了廊角却打了个转。水钵里的倒影从边缘开始晃动。',
  }},
 };
 function stage(){
  const f=campaign?.flood;
  const c=campaign?.case1;
  if(!f?.warned||campaign.day<CFG().warnDay||c?.start==null||!['active','due','report'].includes(c.state))return '';
  const remaining=floodDay()-campaign.day;
  if(f.prayed)return campaign.day!==f.prayDay&&remaining<=1?'returning':'calm';
  return remaining<=1?'danger':remaining<=2?'rising':'early';
 }
 function observation(kind,night=false){
  const phase=stage(),item=observations[kind],text=item?.text[phase];
  if(!text)return null;
  const seen=st().observed??={};
  const key=kind+':'+phase;
  const broadcast=kind==='glass'&&night&&(phase==='danger'||phase==='returning')&&!seen['glass:broadcast'];
  if(!seen[key]||broadcast){seen[key]=true;if(broadcast)seen['glass:broadcast']=true;save()}
  return {title:item.title,text:text+(broadcast?'\n\n大厅的喇叭没亮。你却听见很轻的一句：「品川駅です。……どこへ、帰りますか？」':'')};
 }
 function observe(kind,night,after){
  const line=observation(kind,night);
  if(!line)return false;
  UI.modal({...line,buttons:after?[{label:'继续调查排水口',primary:true,fn:after},{label:'离开'}]:[{label:'收回视线',primary:true}]});
  return true;
 }
 function mountObservation(host,kind,night=false){
  if(!host||!stage()||host.querySelector('[data-flood-observe]'))return;
  const button=document.createElement('button');button.type='button';button.className='survival-btn alt';
  button.dataset.floodObserve=kind;button.textContent={glass:'看看玻璃门外',drain:'看看路边排水口',temple:'看看廊下的水钵'}[kind];
  button.onclick=()=>{if(!DM.isOpen())observe(kind,night)};host.append(button);
 }
 function paintWater(g,hotel=false){
  const phase=stage();if(!phase)return;
  const rows=hotel?[[.22,.82,.11],[.60,.86,.08]]:[[.15,.60,.19],[.53,.76,.23],[.70,.54,.11]];
  const size={early:.55,rising:.87,danger:1.24,calm:.5,returning:1.02}[phase];
  const dark=phase==='danger'||phase==='returning';
  g.save();
  for(const [x,y,width] of rows){
   const w=Math.round(g.canvas.width*width*size),h=Math.round(w*.16),px=Math.round(g.canvas.width*x),py=Math.round(g.canvas.height*y);
   g.fillStyle=dark?'rgba(7,16,32,.77)':'rgba(34,61,77,.54)';
   g.fillRect(px+5,py,w-10,h);g.fillRect(px,py+3,w,h-5);
   g.fillStyle='rgba(122,169,182,.42)';g.fillRect(px+7,py+2,w*.47,1);
   if(phase!=='calm')g.fillRect(px+w*.56,py+h-2,w*.32,1);
  }
  g.restore();
 }
 function recap(){
  const f=campaign.flood||{},seen=Object.keys(f.observed||{}),read=campaign.mailRead||{},lines=[];
  if(f.warned)lines.push('临时新闻报道东京湾潮位急涨，潮位图上的品川亮起了红色。');
  if(read['flood-warn'])lines.push('调查局的邮件提过浅草寺，以及曾经暂时退去的海水。');
  if(read['flood-blessed'])lines.push('后续观测邮件记录了品川外围那圈静止的水。');
  if(seen.includes('drain:danger')||seen.includes('drain:returning'))lines.push('你在品川看见水从排水口向外冒。');
  else if(seen.includes('drain:rising'))lines.push('你听见品川排水口里传来像海浪一样的声音。');
  else if(seen.some(k=>k.startsWith('drain:')))lines.push('你留意过品川排水口旁的积水和水痕。');
  if(seen.some(k=>/^glass:(rising|danger|returning)$/.test(k)))lines.push('你在酒店的玻璃门外见过倒灌或重新上涨的积水。');
  else if(seen.some(k=>k.startsWith('glass:')))lines.push('你留意过酒店门外的积水和水痕。');
  if(seen.includes('glass:broadcast'))lines.push('你听过港屋大厅里那句没有来处的品川站广播。');
  if(prayed())lines.push('你在浅草寺祈过福。海水退去过一阵，后来又涌了回来。');
  return lines;
 }

 /* ---------- 判定（地图 + 酒店的 CASE5.gate） ---------- */
 function check(night){const s=cs();if(!s)return false;
  if(s.state==='dead'&&s.endingId==='death_flood'){if(playingFor!==campaign)endScreen();return true}
  if(!s.extended||s.report||!caseOpen()||!DAHLIA.sealed(campaign))return false;
  const fd=floodDay();
  if(campaign.day>fd||(campaign.day===fd&&night)){die();return true}
  if(campaign.day===fd)checkpoint();
  return false}
 function checkpoint(){const f=st();if(f.cpDay===campaign.day&&matchingCheckpoint(campaign.day))return;
  f.cpDay=campaign.day;save();try{localStorage.setItem(CPKEY,JSON.stringify({day:campaign.day,data:campaign}))}catch(e){}}
 function cp(){try{return JSON.parse(localStorage.getItem(CPKEY)||'null')}catch(e){return null}}
 function matchingCheckpoint(day){const c=cp(),data=c?.data;
  return c?.day===day&&data?.v51?.run===campaign.v51?.run&&data?.case1?.start===cs()?.start&&data?.case1?.extended&&
   !data.case1.report&&!!data.flood?.prayed===prayed()&&['active','due','report'].includes(data.case1.state)?c:null}
 function die(){const s=cs();if(!s||s.state==='dead')return;
  const current=campaign,fd=floodDay();playingFor=current;
  s.state='dead';s.endingId='death_flood';s.floodDeath={day:fd,prayed:prayed()};save();
  try{if(window.H18&&H18.active())H18.stop()}catch(e){}try{if(window.DM)DM.close()}catch(e){}
  CINE.play('flood',{day:fd,prayed:prayed(),readMail:!!current.mailRead?.['flood-warn']},()=>{
   if(playingFor===current)playingFor=null;if(campaign===current&&cs()?.endingId==='death_flood')endScreen();
  })}
 function endScreen(){const death=cs()?.floodDeath,day=death?.day??floodDay(),c=matchingCheckpoint(day);
  const explanation='你已申请延期，品川浸水时案件仍未结案。'+(death?.prayed??prayed()?'浅草寺的祈福让海水暂退，品川在第 '+day+' 天结束时仍被淹没。':'海水在第 '+day+' 天结束时淹没品川。');
  DEATHS.endScreen('death_flood',{recap:recap(),explanation,canRewind:!!c,
   rewindLabel:'回到品川被淹那天的早上',rewindTitle:'回到品川被淹那天的早上？',
   rewindText:'恢复当日早上的行动和调查材料。你可以继续调查，也可以提前提交报告。',onRewind:restore})}
 function restore(){const c=matchingCheckpoint(cs()?.floodDeath?.day??floodDay());if(!c)return;
  try{if(window.H18&&H18.active())H18.stop()}catch(e){}try{if(window.DM)DM.close()}catch(e){}
  playingFor=null;campaign=JSON.parse(JSON.stringify(c.data));campaignSave();tokyoHome()}
 return {news,onMap,check,gate:night=>check(night),floodDay,prayed,state:st,warn,cp,observe,observation,mountObservation,paintWater,
  questActive:()=>{const f=campaign&&campaign.flood;return !!(f&&f.warned&&!f.prayed&&caseOpen())},
  bless:()=>{const f=st();f.prayed=true;f.prayDay=campaign.day;save()},_die:die,_cfg:CFG};
})();
window.FLOOD=FLOOD;

/* ===================================================================
   过场动画（祈福 / 水没）：512×352 像素画布 + 字幕，点「继续」翻下一段
   =================================================================== */
const CINE=(function(){
 let raf=0;
 const P=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
 function smoke(g,t,x,y,gold,amt){for(let i=0;i<(amt||26);i++){const k=(t/1600+i/26)%1,sx=x+Math.sin(i*1.7+t/700)*(6+k*26)+(gold?k*40:0),sy=y-k*230;const a=(1-k)*.55;g.fillStyle=gold?`rgba(244,211,141,${a})`:`rgba(220,222,214,${a})`;const r=4+k*16;g.fillRect(sx-r/2,sy-r/2,r,r)}}
 function eyes(g,list,open){list.forEach(([x,y,s])=>{const h=s*open;if(h<.6)return;P(g,x-s,y-h/2,s*2,h,'#e6dfc4');P(g,x-s*.3,y-h*.35,s*.6,h*.7,'#b3262a');P(g,x-s*.12,y-h*.2,s*.24,h*.4,'#020403')})}
 /* —— 浅草寺本堂 —— */
 function hall(g,t,gold){
  P(g,0,0,512,352,gold?'#2a2418':'#6f8590');
  P(g,30,8,452,18,'#2f333b');for(let x=30;x<482;x+=12)P(g,x,8,6,18,'#3a3f48');P(g,10,26,492,10,'#a64b3c');P(g,0,36,512,6,'#5a2a24');
  P(g,50,42,412,128,'#2b2226');for(const x of [60,140,352,432])P(g,x,42,16,128,'#ad4936'),P(g,x+4,42,4,128,'#d06643');
  P(g,226,56,60,86,'#c0402e');P(g,230,60,52,78,'#d4553c');P(g,226,56,60,6,'#2b2226');P(g,226,136,60,6,'#2b2226');
  g.fillStyle='#2b1a16';g.font='bold 18px DotGothic16, serif';g.fillText('観',246,94);g.fillText('音',246,120);
  P(g,30,170,452,22,'#9a9890');P(g,30,170,452,3,'#bab8b0');
  P(g,206,190,100,30,'#6d4630');for(let x=212;x<300;x+=8)P(g,x,192,4,24,'#3a261a');P(g,206,188,100,4,'#a6784a');
  P(g,226,250,60,50,'#4f4232');P(g,218,244,76,10,'#6a5a44');P(g,236,236,40,10,'#5a4a38');P(g,222,300,68,8,'#3a3026');
  smoke(g,t,256,240,gold,gold?40:22);
  if(gold){const gr=g.createRadialGradient(256,120,10,256,120,260);gr.addColorStop(0,'rgba(244,211,141,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,512,352)}
 }
 /* —— 夜空：香烟向南飘 —— */
 function sky(g,t,k){
  const gr=g.createLinearGradient(0,0,0,352);gr.addColorStop(0,'#05070d');gr.addColorStop(1,'#1d2a33');g.fillStyle=gr;g.fillRect(0,0,512,352);
  for(let i=0;i<60;i++)P(g,(i*97)%512,(i*53)%200,1,1,'rgba(230,230,210,.6)');
  const off=(t/30)%64;for(let x=-64;x<576;x+=16){const h=30+((x*7919)%37);P(g,x-off,352-h,14,h,'#0b1012');if((x*13)%5===0)P(g,x-off+4,352-h+8,2,2,'#e3c97d')}
  P(g,60,120,10,232,'#121a1c');P(g,63,100,4,20,'#121a1c');P(g,56,190,18,4,'#7fc7d6');P(g,58,230,14,3,'#7fc7d6');
  g.strokeStyle='rgba(244,211,141,.9)';g.lineWidth=6;g.lineCap='round';g.beginPath();const n=Math.floor(80*ease(k));for(let i=0;i<=n;i++){const u=i/80,x=90+u*440,y=300-u*170+Math.sin(u*9+t/400)*18;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
  g.strokeStyle='rgba(244,211,141,.25)';g.lineWidth=16;g.stroke();
 }
 /* —— 品川运河：结界 —— */
 function canal(g,t,k,water0,water1,showEyes){
  P(g,0,0,512,352,'#070b14');
  for(let i=0;i<40;i++)P(g,(i*131)%512,(i*71)%120,1,1,'rgba(230,230,210,.5)');
  const bl=[[0,150,70],[70,110,60],[130,170,50],[180,90,70],[250,140,60],[310,120,80],[390,160,50],[440,100,72]];
  bl.forEach(([x,top,w],i)=>{P(g,x,top,w,352-top,i%2?'#121a1c':'#0e1416');for(let yy=top+10;yy<300;yy+=14)for(let xx=x+6;xx<x+w-6;xx+=12)if(((xx+yy+i)*31)%7<2)P(g,xx,yy,3,4,'#e3c97d')});
  P(g,190,70,62,18,'#5a1a14');g.fillStyle='#ffb08a';g.font='bold 12px DotGothic16, monospace';g.fillText('ミナトヤ',196,84);
  const lv=water0+(water1-water0)*ease(k);
  P(g,0,lv,512,352-lv,'rgba(5,16,26,.92)');for(let x=0;x<512;x+=6)P(g,x,lv+Math.sin(x/18+t/300)*2,4,1,'#4b7774');
  if(showEyes)eyes(g,[[80,lv+40,10],[200,lv+70,12],[330,lv+50,9],[440,lv+80,13]],1-ease(k));
  if(k>0){const ry=228;g.strokeStyle='#d8c08a';g.lineWidth=7;g.beginPath();const n=Math.floor(64*ease(Math.min(1,k*1.4)));for(let i=0;i<=n;i++){const x=i*8,y=ry+Math.sin(i*.9)*3;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
   g.strokeStyle='#8a6a3a';g.lineWidth=2;g.stroke();
   for(let x=24;x<n*8;x+=56){g.strokeStyle='#fff4d6';g.lineWidth=3;g.beginPath();g.moveTo(x,ry+4);g.lineTo(x+6,ry+14);g.lineTo(x,ry+20);g.lineTo(x+6,ry+30);g.stroke()}
   const gr=g.createLinearGradient(0,ry-40,0,ry+10);gr.addColorStop(0,'rgba(244,211,141,0)');gr.addColorStop(1,'rgba(244,211,141,'+(.3*ease(k))+')');g.fillStyle=gr;g.fillRect(0,ry-40,512,50)}
 }
 /* —— 酒店房间：水没 —— */
 function room(g,t,o){
  P(g,0,0,512,352,'#241f2a');for(let x=0;x<512;x+=32)P(g,x,0,1,240,'#2c2633');
  P(g,0,240,512,112,'#3a2e28');for(let y=248;y<352;y+=14)P(g,0,y,512,1,'#2a211c');
  P(g,330,40,140,110,'#141a24');P(g,334,44,132,102,'#0a1018');P(g,398,44,4,102,'#141a24');P(g,334,92,132,4,'#141a24');
  for(let i=0;i<30;i++){const x=334+((i*37+t/4)%132),y=44+((i*53+t/2)%102);P(g,x,y,1,6,'rgba(150,180,210,.5)')}
  if(o.lightning&&Math.sin(t/260)>.97)P(g,334,44,132,102,'rgba(220,230,255,.6)');
  P(g,60,110,90,170,'#4a3a30');P(g,64,114,82,162,'#5a4636');P(g,132,190,6,6,'#c9a45e');
  P(g,190,230,180,60,'#6a5a50');P(g,190,206,180,30,'#e6dccb');P(g,194,210,60,20,'#f4ede0');
  P(g,420,220,60,60,'#4a3a30');P(g,436,190,8,30,'#2a2a2a');P(g,424,176,32,16,'#e3c97d');
  let lamp=1;if(o.flicker){lamp=(Math.sin(t/37)>.2||Math.sin(t/111)>.6)?1:.15}
  const gr=g.createRadialGradient(440,190,6,440,190,240);gr.addColorStop(0,`rgba(227,201,125,${.35*lamp})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,512,352);
  P(g,0,0,512,352,`rgba(0,0,0,${.35+(1-lamp)*.4})`);
  if(o.seep){const w=o.seep;P(g,60,278,90*Math.min(1,w*3),3,'#05101a');P(g,40,281,140*w,4+20*w,'rgba(5,16,26,.9)')}
  if(o.water){const lv=352-o.water*352;P(g,0,lv,512,352-lv,'rgba(5,16,26,.88)');for(let x=0;x<512;x+=6)P(g,x,lv+Math.sin(x/16+t/260)*2,4,1,'#4b7774');if(o.eyes)eyes(g,[[90,lv+60,9],[260,lv+90,12],[400,lv+50,10],[180,lv+130,14]],o.eyes)}
  if(o.under){P(g,0,0,512,352,'rgba(3,12,20,.86)');
   P(g,190,206,180,84,'rgba(40,60,70,.35)');P(g,60,110,90,170,'rgba(40,60,70,.3)');P(g,330,40,140,110,'rgba(20,40,60,.35)');
   for(let k=0;k<3;k++){const fx=200+k*46+Math.sin(t/900+k)*14,fy=120+k*30+Math.sin(t/700+k*2)*10;g.save();g.translate(fx,fy);g.rotate(Math.sin(t/1100+k)*.25);P(g,-22,-28,44,56,'rgba(232,223,188,.75)');for(let l=0;l<6;l++)P(g,-16,-20+l*7,32-(l%3)*6,2,'rgba(60,60,70,.6)');if(k===1){g.fillStyle='rgba(176,40,36,.8)';g.font='bold 8px monospace';g.fillText('FILE 001',-18,22)}g.restore()}
   for(let i=0;i<24;i++){const x=(i*71)%512,y=352-((t/6+i*40)%400);P(g,x,y,4,4,'rgba(160,200,200,.5)')}}
 }
 function bigEye(g,t,k){P(g,0,0,512,352,'#000');const h=60*ease(k);if(h<1)return;g.fillStyle='#3a0d0b';g.beginPath();g.moveTo(96,176);g.quadraticCurveTo(256,176-h*2,416,176);g.quadraticCurveTo(256,176+h*2,96,176);g.fill();
  g.fillStyle='#b3262a';g.beginPath();g.arc(256,176,Math.min(48,h*.9),0,7);g.fill();P(g,251,176-Math.min(44,h*.8),10,Math.min(88,h*1.6),'#020403')}
 const SCRIPTS={
  pray:o=>[
   {d:3200,draw:(g,t,k)=>hall(g,t,k>.4),jp:'煙が、まっすぐに空へ昇っていく。',zh:'香烟笔直地升上天空。'},
   {d:3600,draw:(g,t,k)=>sky(g,t,k),jp:'……そして、南へ流れはじめた。',zh:'……然后，开始向南飘去。',text:'穿过隅田川，越过晴空塔的影子，一直飘向东京湾的方向。'},
   {d:4200,draw:(g,t,k)=>canal(g,t,k,150,262,true),jp:'品川の周りに、見えない境界が結ばれた。',zh:'品川的周围，结起了一道看不见的界线。',text:'运河里的水停住了，然后慢慢往后退。水面下的眼睛，一只一只闭上。'},
   {d:2000,draw:(g,t,k)=>canal(g,t,1,262,262,false),card:'祈福完成',text:'品川区域的侵蚀暂时减缓了。\n海水似乎被某种看不见的力量阻挡在外。'}],
  flood:o=>[
   {d:3000,draw:(g,t)=>room(g,t,{lightning:true}),text:'第 '+o.day+' 天，深夜。\n窗外的浪声，比平时近得多。'},
   {d:3200,draw:(g,t,k)=>room(g,t,{lightning:true,seep:ease(k)}),text:'门缝底下，渗进来一线黑色的水。'},
   {d:3200,draw:(g,t)=>room(g,t,{flicker:true,seep:1}),jp:'品川駅です。……どこへ、帰りますか？',zh:'这里是品川站。……你要，回到哪里？',text:'是车站广播的声音。可是这个房间里，没有喇叭。',glitch:true},
   {d:3600,draw:(g,t,k)=>room(g,t,{flicker:true,water:.06+.46*ease(k),eyes:ease(k)}),text:'水一下子漫过了床脚。\n水里，有什么东西睁开了眼睛。'},
   {d:3400,draw:(g,t)=>room(g,t,{water:1,under:true}),text:o.prayed?'浅草寺的香烟，替你撑到了第 '+o.day+' 天。\n……可是那份报告，还躺在你的包里。':(o.readMail?'你想起那封邮件。\n浅草寺——你终究没有去。':'水越过你的肩膀。窗外的路灯，一盏接一盏熄灭。')},
   {d:3600,draw:(g,t,k)=>bigEye(g,t,k),jp:'東京湾の扉が、開いた。',zh:'东京湾的门，开了。'}]
 };
 function play(kind,o,done){
  const steps=SCRIPTS[kind](o||{});let i=0,t0=performance.now();cancelAnimationFrame(raf);
  UI.scene('story',()=>play(kind,o,done));
  app.innerHTML=`<div class="pr-cine${kind==='flood'?' pr-flood':''}" id="pr-cine"><canvas id="pr-cv" width="512" height="352" aria-hidden="true"></canvas><div class="pr-cap" id="pr-cap" aria-live="polite"></div><div class="dx-btns"><button type="button" class="story-btn" id="pr-next">▶ 继续</button><button type="button" class="story-btn alt" id="pr-skip">跳过演出</button></div></div>`;
  const cv=app.querySelector('#pr-cv'),g=cv.getContext('2d'),cap=app.querySelector('#pr-cap');g.imageSmoothingEnabled=false;
  const show=()=>{const s=steps[i];if(!s){cancelAnimationFrame(raf);if(done)done();return}t0=performance.now();
   cap.className='pr-cap'+(s.glitch?' glitch':'')+(s.card?' card':'');
   cap.innerHTML=(s.card?'<h2>'+esc(s.card)+'</h2>':'')+(s.jp?'<p class="pr-jp" lang="ja">「'+esc(s.jp)+'」</p>'+(typeof langMode==='function'&&langMode()==='learning'&&typeof trToggle==='function'?trToggle(s.zh):'<p class="pr-zh">'+esc(s.zh)+'</p>'):'')+(s.text?'<p>'+esc(s.text).replace(/\n/g,'<br>')+'</p>':'');
   try{if(window.AUDIO)AUDIO.sfx(kind==='flood'?(i===3?'buzz':'step'):'page')}catch(e){}};
  const loop=t=>{if(!cv.isConnected)return;const s=steps[i];if(s){const k=Math.min(1,(t-t0)/s.d);s.draw(g,t,k)}raf=requestAnimationFrame(loop)};
  app.querySelector('#pr-next').onclick=()=>{i++;show()};
  app.querySelector('#pr-skip').onclick=()=>{i=steps.length;show()};
  show();raf=requestAnimationFrame(loop);window.scrollTo(0,0);
 }
 return {play,_draw:{hall,sky,canal,room,bigEye}};
})();
window.CINE=CINE;

/* ===================================================================
   浅草寺 · 本堂（点击物件，和求签处同样的玩法）
   =================================================================== */
const PRAYER=(function(){
 let raf=0,msg='';
 const f=()=>FLOOD.state();
 const save=()=>{try{campaignSave()}catch(e){}};
 function ritual(){const s=f();s.ritual??={};if(s.ritual.day!==campaign.day)s.ritual={day:campaign.day};return s.ritual}
 const jzc=(jp,zh)=>(typeof langMode==='function'&&langMode()==='learning')?'「'+jp+'」':'「'+jp+'」（'+zh+'）';
 const MONK={h:'#d8b48e',s:'#d8b48e',b:'#2f2b29',a:'#a8732e',p:'#2f2b29',k:'#1a1a1a'};
 function paint(cv,t){const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const blessed=FLOOD.prayed();
  CINE._draw.hall(g,t,false);
  // 手水舍
  P(16,224,108,10,'#3a2a22');P(12,218,116,8,'#5a3a2a');P(22,234,6,60,'#5a3a2a');P(112,234,6,60,'#5a3a2a');P(30,268,82,22,'#6a6a64');P(34,270,74,10,'#5f9aa0');P(34,270,74,2,'#9fd0cf');
  P(54,256,30,3,'#c9a45e');P(52,252,4,8,'#c9a45e');
  // 鸽子
  for(const [x,y] of [[150,322],[166,330],[372,318]]){P(x,y,10,6,'#8a8f96');P(x+8,y-3,4,4,'#9aa0a6');P(x+11,y-2,2,1,'#e0a040')}
  // 僧侣 / 玩家
  if(window.H18&&H18.pixelPerson){H18.pixelPerson(g,400,206,MONK);H18.pixelPerson(g,240,304)}
  const r=ritual();
  if(r.purify){P(28,212,12,12,'#f4d38d');g.fillStyle='#1b1206';g.font='bold 10px monospace';g.fillText('✓',31,222)}
  if(r.incense){P(274,232,12,12,'#f4d38d');g.fillStyle='#1b1206';g.font='bold 10px monospace';g.fillText('✓',277,242)}
  if(blessed){const gr=g.createRadialGradient(256,120,10,256,120,260);gr.addColorStop(0,'rgba(244,211,141,.18)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,512,352)}
 }
 function hot(label,x,y,w,h,fn,id){const b=document.createElement('button');b.type='button';b.className='omi-hot'+(id&&need(id)?' pr-need':'');b.style.cssText=`left:${x/512*100}%;top:${y/352*100}%;width:${w/512*100}%;height:${h/352*100}%`;b.setAttribute('aria-label',label);b.innerHTML='<span>'+esc(label)+'</span>';b.onclick=()=>{if(!app.querySelector('#pr-box')?.hidden)return;fn()};document.getElementById('pr-stage').appendChild(b)}
 function need(id){if(FLOOD.prayed()||!FLOOD.questActive())return false;const r=ritual();return id==='water'?!r.purify:id==='incense'?!r.incense:id==='hall'?(r.purify&&r.incense):false}
 /* 对话框：lines = [{who,jp,zh,text}]，choices = [[label,fn]] */
 function say(lines,choices){const box=app.querySelector('#pr-box');if(!box)return;lines=[].concat(lines);let i=0;
  const draw=()=>{const l=lines[i],last=i>=lines.length-1;box.hidden=false;
   box.innerHTML=(l.who?'<b class="pr-who">'+esc(l.who)+'</b>':'')+(l.jp?'<p class="pr-jp" lang="ja">「'+esc(l.jp)+'」</p>'+(langMode()==='learning'?trToggle(l.zh||''):'<p class="pr-zh">'+esc(l.zh||'')+'</p>'):'')+(l.text?'<p>'+esc(l.text).replace(/\n/g,'<br>')+'</p>':'')+
    '<div class="pr-choices">'+(last&&choices&&choices.length?choices.map((c,k)=>'<button type="button" class="rpg-action" data-c="'+k+'"'+(c[2]?' disabled':'')+'>'+esc(c[0])+'</button>').join(''):'<button type="button" class="rpg-action" data-next>'+(last?'关闭':'▶ 继续')+'</button>')+'</div>';
   const n=box.querySelector('[data-next]');if(n)n.onclick=()=>{if(last){box.hidden=true;box.innerHTML='';render()}else{i++;draw()}};
   box.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const fn=choices[+b.dataset.c][1];box.hidden=true;box.innerHTML='';if(fn)fn();else render()});
   const first=box.querySelector('button:not([disabled])');if(first)first.focus({preventScroll:true})};
  draw()}
 /* —— 僧侣 —— */
 function monk(){const s=f(),r=ritual();
  if(FLOOD.prayed())return say([{who:'僧侣',jp:'煙は、ちゃんと届いていますよ。',zh:'香烟，确实送到了。',text:'他望向南边的天空。'},{who:'僧侣',jp:'ですが、観音さまが待ってくださるのにも、限りがあります。',zh:'不过，观音能等待的时间，也是有限的。'}]);
  const lines=[{who:'僧侣',jp:'ようこそ、お参りくださいました。',zh:'欢迎来参拜。'}];
  if(FLOOD.questActive()&&!s.metMonk){s.metMonk=true;save();
   lines.push({who:'僧侣',jp:'……海の匂いが、ここまで届いていますね。',zh:'……海的味道，已经飘到这里来了呢。'},
    {who:'僧侣',jp:'こちらの観音さまは、昔、隅田川の漁師の網にかかって、引き上げられたのです。',zh:'这里供奉的观音，很久以前是被隅田川的渔夫用网捞上来的。'},
    {who:'僧侣',jp:'水のことなら、きっと聞いてくださいます。',zh:'和水有关的事，观音一定会听。'})}
  const todo=[!r.purify&&'在手水舍净手',!r.incense&&'在常香炉上香','到本堂前参拜'].filter(Boolean);
  lines.push({who:'僧侣',text:'他双手合十，朝你点了点头。\n（'+todo.join(' → ')+'）'});
  say(lines)}
 /* —— 手水舍 —— */
 function water(){const r=ritual();
  if(r.purify)return say({who:'手水舍',text:'水很凉。水面映着本堂的红柱子。'});
  const ask=(pre)=>say([...(pre||[]),{who:'手水舍',text:'木牌上写着净手的步骤，可是被雨水冲淡了一半。\n正确的顺序是？'}],[
   ['右手拿柄杓洗左手 → 换手洗右手 → 左手接水漱口 → 立起柄杓冲洗手柄',()=>{r.purify=true;save();say({who:'手水舍',text:'冰凉的水流过指间。\n身上那股海腥味，好像淡了一点。'})}],
   ['直接用柄杓喝水',()=>ask([{who:'旁边的老奶奶',jp:'柄杓に、直接口をつけてはいけませんよ。',zh:'不能直接对着柄杓喝哦。',text:'她轻轻拍了拍你的手臂。'}])],
   ['先漱口，再洗手',()=>ask([{who:'旁边的老奶奶',jp:'手を清めてから、口ですよ。',zh:'先把手洗干净，再漱口哦。'}])]]);
  ask()}
 /* —— 常香炉 —— */
 function incense(){const r=ritual();
  if(r.incense)return say({who:'常香炉',text:'香烟还在往上升。附近的游客也在往身上扇。'});
  say({who:'常香炉',text:'常香炉旁边有一个卖线香的小台子：一束 ¥100。'},[
   ['买一束线香（¥100）',()=>{if(campaign.cash<100){UI.toast('现金不足。');return render()}campaign.cash-=100;save();
     say({who:'常香炉',text:'你点燃线香，插进香炉。\n据说把香烟扇到身上哪里，哪里就会变好。'},[
      ['把烟扇到头上',()=>done('据说会变聪明。脑子里的雾，好像散开了一点。','san')],
      ['把烟扇到肩上',()=>done('据说能消除疲劳。肩膀轻了一些。','hp')],
      ['把烟扇到胸口',()=>done('据说能安定心神。心跳慢了下来。','san')]])},campaign.cash<100],
   ['不用了',null]]);
  function done(text,kind){r.incense=true;if(kind==='hp')campaign.hp=Math.min((GAME_CONFIG.player&&GAME_CONFIG.player.maxHp)||100,campaign.hp+5);else campaign.san=Math.min((GAME_CONFIG.player&&GAME_CONFIG.player.maxSan)||100,campaign.san+5);save();UI.toast(kind==='hp'?'疲劳点 +5':'SAN +5');say({who:'常香炉',text:text})}}
 /* —— 本堂 · 赛钱箱 —— */
 function hall(){const r=ritual();
  if(FLOOD.prayed()&&FLOOD.questActive()===false&&f().prayDay===campaign.day)return say({who:'本堂',text:'本堂里很安静。香烟还在往南飘。'});
  if(!r.purify||!r.incense)return say({who:'僧侣',jp:'お参りの前に、手水と、お線香をどうぞ。',zh:'参拜之前，请先净手、上香。',text:'（还差：'+[!r.purify&&'手水舍净手',!r.incense&&'常香炉上香'].filter(Boolean).join('、')+'）'});
  const amt=[[5,'¥5 ——「ご縁がありますように」（日语里 5 円和「御缘」同音）'],[100,'¥100'],[1000,'¥1000']];
  say({who:'本堂 · 赛钱箱',text:'红色的大灯笼在头顶轻轻晃。\n要投多少香油钱？'},amt.map(([v,l])=>[l,()=>{if(campaign.cash<v){UI.toast('现金不足。');return render()}campaign.cash-=v;r.offering=v;save();bow()},campaign.cash<v]).concat([['先不参拜',null]]))}
 function bow(pre){say([...(pre||[]),{who:'本堂',text:'硬币落进赛钱箱，发出很轻的一声。\n接下来，怎么参拜？'}],[
  ['合掌，静静地行一礼',()=>wish()],
  ['二礼、二拍手、一礼',()=>bow([{who:'僧侣',jp:'お寺では、手は打ちませんよ。それは神社のお参りです。',zh:'在寺院里不拍手哦。那是神社的参拜方式。'}])],
  ['摇响铃铛',()=>bow([{who:'僧侣',text:'他摇了摇头：本堂前没有可以摇的铃铛。\n（摇铃也是神社的做法。）'}])]])}
 function wish(pre){
  const quest=FLOOD.questActive();
  const opts=quest?[
   [jzc('品川を、守ってください。','请守护品川。'),()=>blessed()],
   [jzc('お金持ちになれますように。','希望能变成有钱人。'),()=>wish([{who:'本堂',text:'……香烟一动不动。\n看来现在不是许这个愿的时候。'}])],
   [jzc('日本語が上手になりますように。','希望日语能变好。'),()=>wish([{who:'僧侣',jp:'それは、ご自分で頑張ってくださいね。',zh:'这个，请您自己加油吧。',text:'他笑了一下。'}])]]
  :[[jzc('無事に帰れますように。','希望能平安回去。'),()=>say({who:'本堂',text:'你合着手，在心里把这句话念了一遍。\n香烟慢慢升上屋檐。'})],
    [jzc('日本語が上手になりますように。','希望日语能变好。'),()=>say({who:'僧侣',jp:'それは、ご自分で頑張ってくださいね。',zh:'这个，请您自己加油吧。'})]];
  say([...(pre||[]),{who:'本堂',text:'你合起双手，闭上眼睛。\n在心里，用日语说出你的愿望——'}],opts)}
 function blessed(){FLOOD.bless();cancelAnimationFrame(raf);
  CINE.play('pray',{},render)}
 function render(){cancelAnimationFrame(raf);if(!campaign)return;UI.scene('prayer',render);
  const q=FLOOD.questActive(),r=ritual();
  const steps=[['净手',r.purify],['上香',r.incense],['参拜',FLOOD.prayed()]];
  app.innerHTML=`<div class="rpg-shell h18-shell omi-shell"><section class="rpg-panel h18-panel"><div class="h18-top"><div><div class="rpg-kicker">ASAKUSA // 本堂</div><h1 class="h18-title">浅草寺 · 本堂</h1></div><button class="rpg-inline-back" id="pr-exit">返回街区</button></div>
   <div class="h18-hud"><span>DAY ${campaign.day}</span><span>现金 ¥${campaign.cash}</span>${q||FLOOD.prayed()?steps.map(([n,d])=>'<span>'+(d?'✓ ':'· ')+n+'</span>').join(''):''}</div>
   <div class="h18-stage omi-stage" id="pr-stage"><canvas id="pr-canvas" width="512" height="352" aria-label="浅草寺本堂像素场景"></canvas></div>
   <p class="omi-hint" role="status">${esc(msg||(q?'品川浸水预警：净手、上香，再到本堂前参拜。不懂的地方可以问僧侣。':'点击场景里的物件。'))}</p><div id="pr-box" class="pr-box" hidden></div>
   <div class="omi-tools"><button id="pr-omi" class="rpg-action">🎋 去求签处</button></div></section></div>`;
  msg='';
  if(FLOOD.prayed())FLOOD.mountObservation(app.querySelector('.omi-tools'),'temple');
  const cv=document.getElementById('pr-canvas');const loop=t=>{if(!cv.isConnected)return;paint(cv,t);raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
  document.getElementById('pr-exit').onclick=()=>{cancelAnimationFrame(raf);district=byId.asakusa;renderDistrict()};
  document.getElementById('pr-omi').onclick=()=>{cancelAnimationFrame(raf);OMI.open()};
  hot('手水舍',12,214,120,82,water,'water');hot('常香炉',214,232,84,78,incense,'incense');hot('本堂 · 赛钱箱',190,40,132,184,hall,'hall');hot('僧侣',388,196,60,76,monk,'monk');
  if(q&&!f().metMonk)setTimeout(monk,250);
 }
 function open(){if(!campaign)return;try{DM.close()}catch(e){}try{if(H18.active())H18.pause()}catch(e){}render();window.scrollTo(0,0)}
 return {open,render};
})();
window.PRAYER=PRAYER;
/* 浅草街区：预警之后，浅草寺的标记变成「祈福」，直接进本堂 */
{const base=renderDistrict;renderDistrict=function(){base.apply(this,arguments);if(district?.id!=='asakusa'||!FLOOD.questActive())return;const b=document.querySelector('#district-world [data-spot="temple"]');if(!b)return;b.innerHTML='<b>'+(FLOOD.prayed()?'✓':'!')+'</b><small>浅草寺 · 祈福</small>';b.classList.add('pr-pin');b.setAttribute('aria-label','进入浅草寺本堂祈福');b.onclick=PRAYER.open}}


/* Archive presentation only; source evidence, deductions and story flags stay in their existing stores. */
const ARCHIVEUX=(()=>{
 function badge(){const tag=app.querySelector('.archive-ready-count');tag?.remove();app.querySelectorAll('.has-combination').forEach(b=>{b.classList.remove('has-combination');b.setAttribute('aria-label','档案')})}
  function bindPairs(root=app){root.querySelectorAll('[data-ready-pair]').forEach(b=>b.onclick=()=>INV.prepare(b.dataset.readyPair))}
 function mount(){
  const head=app.querySelector('.et-files-head');if(!head)return;
  const profile=document.getElementById('file-1');
  if(profile){const d=document.createElement('details');d.className='archive-profile';d.open=true;const summary=document.createElement('summary');summary.textContent='调查员资料';d.appendChild(summary);while(profile.firstChild)d.appendChild(profile.firstChild);profile.appendChild(d)}
  const groups={people:['file-2'],lore:['file-4','file-5'],records:['file-6','file-1']};
  const nav=head.querySelector('.et-files-tabs');if(nav)nav.innerHTML='<button type="button" class="rpg-action" id="archive-to-reasoning">🧩 进入推理系统（线索 / 证据 / 时间线）</button>';
  const b=head.querySelector('#archive-to-reasoning');if(b)b.onclick=()=>UI.go('reasoning');
  const toolbar=document.createElement('nav');toolbar.className='archive-categories';toolbar.setAttribute('aria-label','档案分类');
  toolbar.innerHTML=[['people','人物档案'],['lore','异闻'],['records','日志与个人资料']].map(([id,label])=>'<button type="button" data-archive-category="'+id+'" aria-pressed="false">'+label+'</button>').join('');head.appendChild(toolbar);
  const select=id=>{for(const group of Object.values(groups))for(const key of group){const el=document.getElementById(key);if(el)el.hidden=!groups[id].includes(key)}toolbar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.archiveCategory===id)))};
  toolbar.querySelectorAll('[data-archive-category]').forEach(x=>x.onclick=()=>select(x.dataset.archiveCategory));select('people');badge();
 }
 return {mount,badge,bindPairs};
})();
window.ARCHIVEUX=ARCHIVEUX;

/* Chapter-one extension. Persist only additive fields; outstanding story bridges
   must call notify() when authored. Never infer NPC knowledge from player knowledge. */
const KBRANCH=(()=>{
 function state(){campaign.kobayashiBranch??={version:1,events:{}};const s=campaign.kobayashiBranch;s.events??={};return s}
 function check(key){const s=state(),v=campaign.hotelCase?.v18,ds=campaign.investigation?.deductions||{};
  if(key==='identity')return !!(ds.KD01&&ds.KD02);
  if(key==='deathReaction')return !!(CASE_FACTS.read().death&&s.deathKnown&&!s.events.shock);
  if(key==='readyB')return !!(v?.clues?.includes('K02')&&s.events.shock&&CASE_FACTS.read().death&&s.deathKnown&&s.moriKnown&&s.satoKnown&&campaign.day>Math.max(s.deathDay,s.events.shock.day,s.events.photo?.day||0));
  return false;
 }
 function event(key){const s=state();if(s.events[key])return false;if(key==='volunteer'&&!check('readyB'))return false;s.events[key]={day:campaign.day};if(key==='volunteer'){s.volunteering=true;s.overnight=true}if(key==='identity')s.identityKnown=true;return true}
 function notify(fact,source){if(!['death','mori','sato'].includes(fact)||!source)return false;const s=state();const k=fact==='death'?'deathKnown':fact+'Known';if(s[k])return false;s[k]=true;s.events['bridge:'+fact]={day:campaign.day,source};if(fact==='death')s.deathDay=campaign.day;else s.contextDay=campaign.day;campaignSave();return true}
 function photo(){H18.pause(true);const host=document.createElement('div');host.className='et-modal-back';host.style.cssText='position:fixed;inset:0;z-index:200000;background:#080912e8;display:grid;place-items:center';
 const panel=document.createElement('section');panel.className='rpg-panel';panel.style.cssText='width:min(94vw,650px);max-height:90vh;overflow:auto';host.appendChild(panel);
 const title=document.createElement('h2');title.textContent='旧街景照片';panel.appendChild(title);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=144;canvas.style.cssText='width:100%;image-rendering:pixelated;border:8px solid #c6b68e';canvas.setAttribute('aria-label','泛黄街景照片：楼房、电线、街道，右边缘站着一名年轻男子');panel.appendChild(canvas);const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
 g.fillStyle='#b7ad89';g.fillRect(0,0,256,144);g.fillStyle='#8a806b';g.fillRect(0,98,256,46);
 for(let i=0;i<7;i++){g.fillStyle=i%2?'#6d695b':'#918873';g.fillRect(i*37,24+(i%3)*9,33,80);g.fillStyle='#494b44';for(let y=38;y<95;y+=18)for(let x=5;x<32;x+=13)g.fillRect(i*37+x,y,7,10)}
 g.fillStyle='#383e38';g.fillRect(183,8,3,100);g.fillRect(0,19,256,1);g.fillRect(0,23,256,1);H18.pixelPerson(g,228,99,{h:'#33312c',s:'#b9a584',b:'#514e43',a:'#8c8166',p:'#44483e',k:'#302f2b'},'down');
 const detail=document.createElement('p');detail.textContent='1970年代的东京街景。画面边缘，一个年轻男子正望向镜头。';panel.appendChild(detail);
 for(const [label,text] of [['翻到背面','背面写着1970年代的日期和「東京」，另有片山的署名，没有标注人物姓名。'],['观察边缘人物','年轻男子的脸部轮廓可以辨认。照片里那人的五官不够清晰。']]){const b=document.createElement('button');b.className='rpg-action';b.textContent=label;b.onclick=()=>detail.textContent=text;panel.appendChild(b)}
 const b=document.createElement('button');b.className='rpg-action';b.textContent='收好照片，继续调查';b.onclick=()=>{host.remove();H18.start();H18.play('k-photo-edge')};panel.appendChild(b);document.body.appendChild(host);b.focus();
 }
 function ending(done){const s=state();s.endingTriggered=true;campaignSave();const e=GAME_DATA.d['investigation/kobayashi-ending'];const paragraphs=ENDTACHIE.mergeTr(e.text.split(/\r?\n\s*\r?\n/));let i=0;UI.page('ending',e.title,'', '<section class="rpg-panel"><canvas id="kn-scene" width="512" height="352" style="width:100%;image-rendering:pixelated"></canvas><p id="kn-text" style="white-space:pre-wrap"></p><button class="survival-btn" id="kn-next">继续</button></section>');
 const cv=app.querySelector('#kn-scene'),p=app.querySelector('#kn-text'),b=app.querySelector('#kn-next');H18.drawMap(cv,'guard');
 function next(){if(i<paragraphs.length){p.textContent=paragraphs[i++];return}b.disabled=true;const panel=cv.parentElement;panel.style.transition='opacity 1s';panel.style.opacity='0';setTimeout(()=>{done();UI.page('ending',e.title,'END','<section class="rpg-panel"><button class="survival-btn" id="kn-home">返回主页</button></section>');app.querySelector('#kn-home').onclick=()=>tokyoHome()},1000)}b.onclick=next;next();
 }
 return {state,check,event,notify,photo,ending};
})();window.KBRANCH=KBRANCH;

/* Mori branch; appended fields only, no new inventory or evidence-slot system. */
const MORI=(()=>{
 const data=()=>GAME_DATA.d['investigation/mori'];
 function state(){campaign.moriBranch??={version:1,events:{},card:{}};const s=campaign.moriBranch;s.events??={};s.card??={};return s}
 function check(key){const inv=campaign.investigation||{},f=campaign.hotelCase?.v18?.flags||{};if(key==='accident')return !!(ROOMFILE.solved(campaign)&&campaign.roomFile?.appointment&&inv.evidence?.E05&&f['vf:tanaka-D08']);return false}
 function sync(){if(!campaign)return;const s=state(),v=campaign.hotelCase?.v18;if(!v)return;const clues=v.clues||[],flags=v.flags||{};
  s.dialogueStage=flags['mori:concealment']?'truth':clues.includes('MC08')?'records':clues.includes('M02')?'debt':'initial';
  if(flags['mori:girlSeen']&&!clues.includes('M03'))clues.push('M03');
  s.card.exists=clues.includes('M04');s.card.missing=clues.includes('M05');s.card.atTanaka=clues.includes('MT01');s.card.posted=clues.includes('MT02');
  s.events.concealment=!!flags['mori:concealment'];s.events.photo=clues.includes('M09');s.events.inoue=clues.includes('M11');
 }
 function dialogue(){sync();return {initial:'森经理把一张维修单递给员工，又转向你。\n「調査でしたら、なるべく手短にお願いします。」\n“如果是调查，请尽量简短一些。”',debt:'他把手机屏幕扣在桌上，催债通知露出一个角。\n「それはホテルの業務とは関係ないでしょう。」\n“那跟酒店的工作没关系吧。”',records:'森指着核对表，声音突然提高。\n「佐藤さん、また数字が違っています。早く確認してください。」\n“佐藤小姐，数字又不对。请赶快核对。”\n佐藤低头收起表格。',truth:'「……このホテルまでなくなったら、私はどうすればいいんですか。」\n“……如果连这家酒店都没了，我该怎么办？”'}[state().dialogueStage]}
 function event(id){if(id!=='informKoba'||state().events[id])return false;state().events[id]={day:campaign.day};for(const fact of ['death','mori','sato'])KBRANCH.notify(fact,'m-koba-informed');return true}
 function gain(id){const v=H18.state().v;if(!v.clues.includes(id))v.clues.push(id);INV.addClue(id,true);sync();campaignSave()}
 // Reserved Tanaka integration: two distinct authored discoveries, never generated at load.
 function cardDiscovery(which,source){if(!source||!['holder','posted'].includes(which))return false;const s=state();if(which==='posted'&&!s.card.holderEvent)return false;const key=which+'Event';if(s.card[key])return false;s.card[key]={day:campaign.day,source};gain(which==='holder'?'MT01':'MT02');return true}
 function reportHtml(s){if(s.draft.person!=='mori')return '';const value=s.draft.accusation||'review';return `<section class="rpg-panel"><h2>对森经理的结论</h2><p>隐瞒死亡与实施谋杀是不同的判断。</p><div class="rp-persons">${[['review','仅提交调查／隐瞒责任，不指认杀人'],['murder','明确指认森经理杀害片山']].map(([id,label])=>`<button type="button" class="rp-person" data-mori-verdict="${id}" aria-pressed="${value===id}">${label}</button>`).join('')}</div></section>`}
 function bindReport(s,save,render){app.querySelectorAll('[data-mori-verdict]').forEach(b=>b.onclick=()=>{s.draft.accusation=b.dataset.moriVerdict;save();render()})}
 function inspect(kind,external=false){const coast=kind==='coast',id=coast?'M09':kind.split(':')[1];const clue=GAME_DATA.story.chapter1.evidence[id];if(!clue)return;
  if(external)EXPLORE.stop();else H18.pause();gain(id);
  const overlay=document.createElement('div');overlay.className='et-modal-back';overlay.style.cssText='position:fixed;inset:0;z-index:200000;background:#080912e8;display:grid;place-items:center;padding:12px';
  const panel=document.createElement('section');panel.className='rpg-panel';panel.style.cssText='width:min(94vw,720px);max-height:92vh;overflow:auto';overlay.appendChild(panel);const title=document.createElement('h2');title.textContent=clue.name;panel.appendChild(title);
  const cv=document.createElement('canvas');cv.width=384;cv.height=224;cv.style.cssText='width:100%;image-rendering:pixelated';cv.setAttribute('aria-label',coast?'夜间沿岸照片：远处两个模糊人影，不能辨认身份或行为':'文件展示：'+clue.name);panel.appendChild(cv);const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  if(coast){g.fillStyle='#151e30';g.fillRect(0,0,384,224);g.fillStyle='#29333c';g.fillRect(0,105,384,40);g.fillStyle='#0c1824';g.fillRect(0,145,384,79);for(let i=0;i<20;i++){g.fillStyle=i%2?'#2a3c4b':'#1c2d3d';g.fillRect((i*53)%384,157+(i*13)%62,22,2)}g.fillStyle='#5a5a55';g.fillRect(280,87,7,10);g.fillRect(275,98,15,27);g.fillStyle='#55535d';g.fillRect(309,91,6,8);g.fillRect(306,100,12,25);g.fillStyle='#3d4249';g.fillRect(0,130,384,4);for(let x=0;x<384;x+=37)g.fillRect(x,130,3,22)}else{g.fillStyle='#3d3435';g.fillRect(0,0,384,224);g.fillStyle='#d9cdb0';g.fillRect(24,12,336,200);g.fillStyle='#3a3532';g.font='16px sans-serif';g.fillText(clue.name,43,42);g.font='13px sans-serif';const lines=id==='M01'?['共同出資契約','共同投资人：森正彦','经营负责人：合伙人','森：港屋酒店支配人']:id==='M02'?['催告書','連帯保証人：森正彦','借款逾期 · 待清偿','附：经营资料与失联记录']:id==='M04'?['住宿付款资料','持卡人：片山茂','卡种：黑金信用卡','卡号与额度：不展示']:id==='M06'?['接待事务记录','接待：森经理','住客：片山茂','付款资料／用餐地点介绍']:id==='M05'?['遗留物清点','卡套：在','卡片：未见','去向：酒店记录不明']:['营业风险备忘','退订／停业影响','工资收入与偿债计划'];lines.forEach((t,i)=>g.fillText(t,43,78+i*26));}
  const p=document.createElement('p');p.textContent=clue.desc;panel.appendChild(p);
  const close=document.createElement('button');close.className='survival-btn';close.textContent='收好记录，继续调查';close.onclick=()=>{overlay.remove();if(external)EXPLORE.open('shinagawa');else H18.start()};panel.appendChild(close);document.body.appendChild(overlay);close.focus();
 }
 function ending(done){const s=state();s.endingTriggered=true;campaignSave();const e=GAME_DATA.d['investigation/mori-ending'];let text=e.text;
  const have=campaign.investigation?.clues||{};
  if(!['M02','M04','M05','C03'].every(id=>have[id]))text=text.replace('你将居酒屋的债务记录、片山失踪的信用卡资料，以及207号室的异常住宿记录摆在桌上。','你将本次调查中已经取得的报告资料摆在桌上。').replace('森的目光停在那张信用卡资料上。','森的目光停在报告里的谋财指控上。');
  const paragraphs=ENDTACHIE.mergeTr(text.split(/\r?\n\s*\r?\n/));let i=0,finished=false;UI.page('ending',e.title,e.subtitle,'<section class="rpg-panel"><canvas id="mo-scene" width="512" height="352" style="width:100%;image-rendering:pixelated"></canvas><p id="mo-text" style="white-space:pre-wrap"></p><button class="survival-btn" id="mo-next">继续</button></section>');
  const cv=app.querySelector('#mo-scene'),p=app.querySelector('#mo-text'),b=app.querySelector('#mo-next');H18.drawMap(cv,'office');H18.pixelPerson(cv.getContext('2d'),10*32,5*32,GAME_DATA.story.chapter1.npcs.mori.palette,'down');
  function next(){if(finished)return;if(i<paragraphs.length){p.textContent=paragraphs[i++];return}finished=true;b.disabled=true;const panel=cv.parentElement;panel.style.transition='opacity 1s';panel.style.opacity='0';setTimeout(()=>{done();UI.page('ending',e.title,e.subtitle,'<section class="rpg-panel"><button class="survival-btn" id="mo-home">返回主页</button></section>');app.querySelector('#mo-home').onclick=()=>tokyoHome()},1000)}b.onclick=next;next();
 }
 return {state,sync,check,event,dialogue,gain,inspect,reportHtml,bindReport,ending,cardDiscovery};
})();window.MORI=MORI;
const moriSave=campaignSave;campaignSave=function(){MORI.sync();return moriSave.apply(this,arguments)};

/* Sato branch v1: additive save state, shared INV/VERIFY/H18, no second evidence system. */
const SATO=(()=>{
 const JOINT=['ST-D01','ST-D03','ST-J01','ST-JOINT','ST-J03','MD04','MD05'];
 let root=null,frame=0;
 function state(){campaign.satoBranch??={version:1,events:{},scene:{}};const s=campaign.satoBranch;s.events??={};s.scene??={};return s}
 function has(id){return !!campaign.investigation?.clues?.[id]||(campaign.hotelCase?.v18?.clues||[]).includes(id)}
 function joint(){return JOINT.some(id=>!!campaign.investigation?.deductions?.[id])}
 function check(k){if(!campaign||campaign.day<2)return false;const s=state(),v=campaign.hotelCase?.v18||{};
  return {available:true,phoneDue:!s.events.phone&&v.map==='lobby'&&v.clock>=180&&v.clock<660,registration:has('C03')||has('register'),cross:has('ST02')||has('M11'),phone:has('ST03')||!!s.events.concern,donation:has('ST04'),wages:has('ST05'),photo:has('ST06'),family:!!s.events.family,joint:joint(),watched:!!s.scene.watched}[k]||false;
 }
 function event(id){const s=state();s.events[id]??={day:campaign.day,clock:campaign.hotelCase?.v18?.clock||0};
  if(id==='registration'||id==='cross'||id==='presence'){
   const inv=campaign.investigation;if(inv){inv.dayVerify??={};const ids=id==='registration'?['ST-D01']:['ST-JOINT','ST-J01','ST-J03','ST-D03','MD04','MD05'];
    for(const did of ids)if(inv.deductions?.[did]){inv.dayVerify[did]??={};inv.dayVerify[did].sato={status:id==='registration'?'尚未证实':'部分支持',detail:id==='registration'?'佐藤将日期问题解释为录入错误，未说明修改原因；原始登记与证言保留。':id==='cross'?'佐藤修正了最初接报的说法，承认是她叫来森；这只支持共同到场，后续行为仍待核对。':'佐藤承认与森一起在207现场，未说明之后的处理；原始证言保留。',at:{day:campaign.day},npc:'sato'};}
   }
  }
  return true}

 function onDeduction(id){if(!JOINT.includes(id)||campaign.day<2)return;const s=state();s.jointSources??=[];if(!s.jointSources.includes(id))s.jointSources.push(id);s.scene.pending=!s.scene.watched;const inv=campaign.investigation,source=inv.deductions[id];if(source&&!inv.deductions['ST-JOINT'])inv.deductions['ST-JOINT']={at:source.at,from:source.from.slice(),n:++inv.dn,status:'待求证'};if(s.events.presence)event('presence');else if(s.events.cross)event('cross');}
 const TEXT=`森站在浴室门口。

房间里弥漫着令人难以忍受的气味。

佐藤用手捂着嘴，脸色苍白。

「……警察、呼びますか。」
“……要报警吗？”

森没有回答。

「……こんなことになるとは思わなかった。」
“……没想到事情会变成这样。”

佐藤低下头。

「……私もです。」
“……我也没想到。”

森看着浴室里的片山。

「……こんなことが知られたら、予約は全部キャンセルになるかもしれない。」
“……这件事要是传出去，预订可能全都会被取消。”

「……どうすればいいんだ。」
“……到底该怎么办。”

佐藤没有回答。

她想起了哥哥。

那个每天很晚才回家、总是把工资交给母亲的哥哥。

她想起了哥哥坐在餐桌前，一遍又一遍计算生活费的样子。

还有母亲把积蓄再次捐出去的那一天。

哥哥没有发火。

只是很久没有说话。

后来，他再也没有回来。

佐藤低着头。

「……私、仕事を失うわけにはいかないんです。」
“……我不能失去这份工作。”

森看向她。

「佐藤さん……。」
“佐藤小姐……”

她慢慢抬起头。

原本发抖的声音忽然平静下来。

「……ここから、運び出しましょう。」
“……把遗体从这里移出去吧。”

森愣住了。

「……何を言ってるんですか。」
“……你在说什么？”

佐藤看着他。

「このまま見つかったら、何を言っても信じてもらえません。」
“如果就这样被人发现，不管我们说什么，都不会有人相信的。”

森没有回答。

「このままじゃ、全部なくなってしまいます。」
“这样下去，我们会失去一切的。”

很长时间后，他缓缓低下头。`;
 const pages=TEXT.split('\n\n');
 function table(g){
  const m=GAME_DATA.story.chapter1.maps.lobby;
  g.fillStyle='#433735';g.fillRect(0,0,512,352);g.fillStyle='#8b7964';g.fillRect(32,35,448,180);g.fillStyle='#29303c';g.fillRect(340,55,100,105);g.fillStyle='#716958';g.fillRect(390,55,3,105);
  for(let y=220;y<352;y+=16){g.fillStyle=y%32?'#675148':'#725d4f';g.fillRect(0,y,512,15)}
  H18.pixelPerson(g,220,157,{h:'#24212a',s:'#dfb995',b:'#675c56',a:'#b7a78d',p:'#3c414e',k:'#222'},'down');
  H18.pixelPerson(g,310,205,GAME_DATA.story.chapter1.npcs.sato.palette,'left');
  g.fillStyle='#392c28';g.fillRect(167,244,11,48);g.fillRect(322,244,11,48);g.fillStyle='#986b4e';g.fillRect(156,202,188,49);g.fillStyle='#b78760';g.fillRect(156,202,188,5);
  for(let i=0;i<5;i++){g.fillStyle='#d9cdb2';g.fillRect(180+i*25,213+(i%2)*9,21,15);g.fillStyle='#817363';g.fillRect(183+i*25,217+(i%2)*9,14,1);g.fillRect(183+i*25,222+(i%2)*9,12,1)}
 }
 function room(g,index,t){const m=GAME_DATA.story.chapter1.scenes.room207;
  for(let y=0;y<11;y++)for(let x=0;x<16;x++)H18.pixelTile(g,m,x,y,'night');
  // Existing bathroom geometry; keep body outside the camera's view.
  g.fillStyle='#11141de8';g.fillRect(32,32,128,96);
  const pal=GAME_DATA.story.chapter1.npcs,calm=index>=pages.findIndex(p=>p.includes('原本发抖'));
  const shake=!calm&&index>=2?Math.round(Math.sin(t/75)):0;
  H18.pixelPerson(g,6*32,3*32,pal.mori.palette,index===pages.length-1?'down':'left');
  H18.pixelPerson(g,7*32+shake,5*32,pal.sato.palette,calm?'up':'left');
  // Fear: pallor and hand to mouth; decision: steady posture, raised face.
  g.fillStyle=calm?'#efc5a2':'#d7cab6';g.fillRect(7*32+11+shake,5*32+9,9,5);
  if(!calm){g.fillStyle='#efd7bc';g.fillRect(7*32+8+shake,5*32+17,6,4)}
  if(index===pages.length-1){g.fillStyle='#37271f';g.fillRect(6*32+10,3*32+8,12,6)}
  const light=g.createRadialGradient(250,145,30,250,145,290);light.addColorStop(0,'#d8b28210');light.addColorStop(1,'#080a19a0');g.fillStyle=light;g.fillRect(0,0,512,352);
 }
 function mount(title){
  if(root)return null;const thaw=H18.freeze(),focus=document.activeElement;
  root=document.createElement('section');root.className='et-modal-back';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',title);root.style.cssText='position:fixed;inset:0;z-index:210000;background:#080b12f5;display:grid;place-items:center;padding:12px;overflow:auto';
  root.innerHTML='<div class="rpg-panel" style="width:min(96vw,850px);max-height:96vh;overflow:auto"><h2></h2><canvas width="512" height="352" style="width:100%;max-height:55vh;object-fit:contain;image-rendering:pixelated"></canvas><p style="white-space:pre-wrap;min-height:4em" aria-live="polite"></p><button type="button" class="survival-btn">继续</button></div>';
  root.querySelector('h2').textContent=title;document.body.appendChild(root);
  const disabled=[app,document.getElementById('et-nav'),document.getElementById('et-top')].filter(Boolean).map(el=>[el,el.inert]);disabled.forEach(([el])=>el.inert=true);
  const guard=e=>{if(!root)return;if(['w','a','s','d','W','A','S','D','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','j','J','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}if(e.key==='Tab'){const b=root.querySelector('button');e.preventDefault();b.focus()} };
  document.addEventListener('keydown',guard,true);
  return {cv:root.querySelector('canvas'),p:root.querySelector('p'),b:root.querySelector('button'),close:()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',guard,true);root.remove();root=null;disabled.forEach(([el,value])=>el.inert=value);thaw();if(focus?.isConnected)focus.focus({preventScroll:true});}};
 }
 function scene(replay=false){
  if(root||DM.isOpen()||!joint()||campaign.day<2)return false;const st=state().scene;if(st.watched&&!replay)return false;
  const ui=mount('对质经过重构 · 港屋酒店207号室');if(!ui)return false;
  let index=replay?-1:(Number.isInteger(st.cursor)?Math.max(-1,Math.min(st.cursor,pages.length-1)):-1),closing=false;
  const g=ui.cv.getContext('2d');g.imageSmoothingEnabled=false;
  const draw=t=>{if(!root)return;const memory=index>=12&&index<=18;if(memory)table(g);else room(g,index,t);frame=requestAnimationFrame(draw)};frame=requestAnimationFrame(draw);
  function show(){ui.p.textContent=index<0?'《207号室的共同秘密》\n记录与证言已经联系起森经理和佐藤。你试着重构那次到场的经过。':pages[index];ui.b.disabled=true;setTimeout(()=>{if(root&&!closing)ui.b.disabled=false},index===pages.length-1?1400:450);if(!replay){st.cursor=index;campaignSave()}}
  ui.b.onclick=()=>{if(closing||ui.b.disabled)return;if(index<pages.length-1){index++;show();return}closing=true;ui.b.disabled=true;root.firstElementChild.style.transition='opacity 1.2s';root.firstElementChild.style.opacity='0';setTimeout(()=>{if(!replay){st.watched=true;st.pending=false;delete st.cursor;event('reconstruction');campaignSave()}ui.close();UI.toast('已记录《207号室的共同秘密》：可向佐藤、森求证，继续核对酒店记录、海岸与浴室线索。')},1250)};
  show();ui.b.focus();return true;
 }
 function maybeScene(){if(campaign&&state().scene.pending&&!state().scene.watched)scene(false)}
 function photo(){const ui=mount('佐藤自愿展示的旧照片');if(!ui)return;table(ui.cv.getContext('2d'));ui.p.textContent=GAME_DATA.story.chapter1.evidence.ST06.desc;ui.b.textContent='归还照片';ui.b.onclick=()=>{ui.close();H18.endDialog()};ui.b.focus()}
 function call(k){if(k==='photo')return photo();if(k==='replay'){const did=scene(!!state().scene.watched);if(!did)H18.endDialog();return}}
 function profileHtml(){if(!campaign?.hotelCase?.v18?.flags?.['met:sato'])return '';const rows=[['身份','港屋酒店前台 · さとう みほ']];
  if(has('ST04'))rows.push(['家庭开支','母亲反复向灯和会捐款；来源：佐藤展示的收据与口述。']);
  if(has('ST05'))rows.push(['工作','持续用工资承担家庭生活费，担心失去工作。']);
  if(has('ST06'))rows.push(['家人','大哥已去世；佐藤说他长期支撑家庭，后来自杀。另有一名在世的二哥。']);
  if(has('ST10'))rows.push(['接报经过','承认接到井上报告后去办公室叫森。']);
  if(joint())rows.push(['待求证推论','与森共同隐瞒207事件的可能；死亡原因尚需独立调查。']);
  return '<article class="rpg-panel"><h3>佐藤美穂</h3>'+rows.map(([a,b])=>'<p><b>'+esc(a)+'</b> · '+esc(b)+'</p>').join('')+'</article>';
 }
 function endingReady(){return !!GAME_DATA.d['investigation/sato-ending']?.text}
 function reportHtml(s){if(s.draft.person!=='sato'||!endingReady())return '';return `<section class="rpg-panel"><h2>对佐藤的结论</h2>${[['review','提交调查与隐瞒责任，不指认杀人'],['murder','明确指认佐藤杀害片山']].map(([id,t])=>`<button type="button" class="rp-person" data-sato-verdict="${id}" aria-pressed="${(s.draft.accusation||'review')===id}">${t}</button>`).join('')}</section>`}
 function bindReport(s,save,render){app.querySelectorAll('[data-sato-verdict]').forEach(b=>b.onclick=()=>{s.draft.accusation=b.dataset.satoVerdict;save();render()})}
 // Author-approved finale; only the evidence display adapts to acquired records.
 function endingPages(){
  const e=GAME_DATA.d['investigation/sato-ending'];if(!e?.text)return [];
  const materials=[['ST04','她母亲的捐款记录'],['C03','207号室的异常住宿登记'],['M09','北品川海岸的照片']].filter(([id])=>has(id)).map(([,name])=>name);
  return e.text.split(/\r?\n\s*\r?\n/).map(t=>t.startsWith('你将她母亲的捐款记录')?(materials.length===3?t:materials.length?'你将'+materials.join('、')+'摆在她面前。':'你将报告推到她面前。'):t);
 }
 function ending(done){
  if(!endingReady()||root)return false;
  const e=GAME_DATA.d['investigation/sato-ending'],ui=mount(e.title);if(!ui)return false;
  const lines=endingPages(),g=ui.cv.getContext('2d');let i=-1,closing=false,ringing=false,timer=null;
  const saved=state();saved.ending=saved.ending||{};
  const draw=()=>{g.imageSmoothingEnabled=false;H18.drawMap(ui.cv,'lobby');
   H18.pixelPerson(g,10*32,32,GAME_DATA.story.chapter1.npcs.sato.palette,'down');
   g.fillStyle='#e3d8ba';g.fillRect(10*32+4,2*32+8,23,14);g.fillStyle='#716a63';g.fillRect(10*32+7,2*32+12,16,1);g.fillRect(10*32+7,2*32+16,12,1);
   // Desk telephone stays untouched throughout the confrontation.
   g.fillStyle='#252930';g.fillRect(9*32+6,2*32+6,17,11);g.fillStyle=ringing?'#b99c61':'#555c63';g.fillRect(9*32+5,2*32+4,19,4);
   if(lines.slice(0,i+1).some(t=>t.includes('紧紧攥着制服'))){g.fillStyle='#d6b49e';g.fillRect(10*32+9,32+21,4,3);}
  };
  const stopRing=()=>{ringing=false;if(timer!==null){clearTimeout(timer);timer=null}root?.querySelector('.fx-ring')?.classList.remove('fx-ring')};
  const closeEnding=ui.close;ui.close=()=>{stopRing();ENDTACHIE.detach();closeEnding()};
  const ring=()=>{if(!ringing||closing)return;window.AUDIO?.sfx('phone');timer=setTimeout(ring,2600)};
  const finish=()=>{if(closing)return;closing=true;stopRing();ui.b.disabled=true;ui.p.textContent='';root.firstElementChild.style.transition='opacity 1s';root.firstElementChild.style.opacity='0';setTimeout(()=>{saved.ending.watched=true;campaignSave();ui.close();done();UI.page('ending',e.title,'END','<button class="survival-btn" id="st-home">返回主页</button>');app.querySelector('#st-home').onclick=()=>tokyoHome()},1100)};
  ui.b.onclick=()=>{if(closing)return;i++;if(i>=lines.length||lines[i]==='画面渐黑。'){finish();return;}
   const t=lines[i];ui.p.textContent=t;ui.p.style.fontWeight=t.includes('兄とこの家族のためなら')?'700':'400';
   if(t==='大厅里传来电话铃声。'){ringing=true;ring();}
   if(t==='你再次问她是否杀害了片山。')stopRing();
   draw();
  };
  ui.b.click();return true;
 }

 return {mount,profileHtml,state,has,check,event,onDeduction,joint,scene,maybeScene,call,reportHtml,bindReport,endingReady,ending,endingPages,active:()=>!!root,script:()=>pages.slice()};
})();window.SATO=SATO;

/* Tanaka: shared hotel/dialogue/investigation modules; only additive saves. */
const TANAKA=(()=>{
 let running=false,raf=0;
 function state(){campaign.tanakaBranch??={version:1,events:{},shows:{}};const s=campaign.tanakaBranch;s.events??={};s.shows??={};return s}
 const has=id=>!!campaign.investigation?.clues?.[id]||!!campaign.hotelCase?.v18?.clues?.includes(id);
 const deduction=id=>!!campaign.investigation?.deductions?.[id];
 function check(k){if(!campaign||campaign.day<2)return false;const f=campaign.hotelCase?.v18?.flags||{};return {available:true,job:has('TNJOB'),fight:has('TN04'),push:has('TN05')||deduction('TN-D02')||deduction('TN-D02B'),photo:has('photo')||has('C08')||has('DAY-UE-01')||has('DAY-KS-01')||has('TN10'),seven:has('TN10'),cardQuestion:has('M05')||has('TN03')||deduction('TN-D02'),holder:has('MT01'),posting:has('MT01')&&has('TNPOST'),client:has('TNCLIENT')&&(has('TNJOB')||deduction('TN-D08')),reunion:has('TN10')&&has('TN04')&&(has('TN03')||has('TN02')),returnQuestion:has('TN06')||has('TN05')}[k]||false}
 function event(k){state().events[k]??={day:campaign.day};
  if(k==='holder')MORI.cardDiscovery('holder','田中自愿展示');
  if(k==='posted')MORI.cardDiscovery('posted','信封邮戳与片山寄件存根');
  if(k==='clientVerified')INV.grantEvidence('E06','代理预约资料与田中本人承认');
  const ids={jobVerified:['TN-D01'],fightVerified:['TN-D02'],pushVerified:['TN-D02','TN-D02B'],posted:['TN-D05','TN-D06'],sevenVerified:['TN-D07'],clientVerified:['TN-D08']};
  const inv=campaign.investigation;if(inv){inv.dayVerify??={};for(const id of ids[k]||[]){if(!inv.deductions?.[id])continue;inv.dayVerify[id]??={};inv.dayVerify[id].tanaka={status:k==='posted'?'来源已核对':'部分支持',detail:{jobVerified:'承认隐瞒现职。',fightVerified:'承认争执。',pushVerified:'承认推搡，否认杀人；死因需另查。',posted:'信封与存根支持生前主动寄卡；不自动处理其他假说。',sevenVerified:'确认七楼约定。',clientVerified:'承认真实委托身份。'}[k],at:{day:campaign.day}}}}
 }
 function onDeduction(id){if(['TN-D02','TN-D02B'].includes(id)&&!state().shows.road?.watched)state().pending='road';}
 function maybeScene(){if(state().pending&&!running&&!SATO.active()&&!DM.isOpen())cinema(state().pending)}
 function facts(id){const e=state().events;if(id==='E05')return '\n'+[e.fightVerified?'已核对补充：田中承认居酒屋争执。':'',e.pushVerified?'已核对补充：田中承认推搡；此口述未确定死因。':'',e.jobVerified?'已核对补充：田中承认隐瞒现职。':''].filter(Boolean).join('\n');if(id==='E08'&&e.posted)return '\n来源补充：信封、寄件存根与田中展示的卡片对应。';return ''}
 function drawRoom(g,key,index,t,rows=[]){const prior=rows.slice(0,index+1).map(x=>x.text).join('\n');const pal=GAME_DATA.story.chapter1.npcs;
  if(key==='ending'){H18.drawMap({getContext:()=>g},'guard');g.fillStyle='#393b42';g.fillRect(196,202,144,48);g.fillStyle='#8d9a9a';g.fillRect(285,191,10,16);H18.pixelPerson(g,240,prior.includes('猛地站起来')?141:162,pal.tanaka.palette,prior.includes('田中转过身')?'up':'down');if(prior.includes('纸张散落一地')){g.fillStyle='#dfddc8';for(let i=0;i<6;i++)g.fillRect(180+i*29,270+(i%3)*11,17,23)}return}
  if(key==='koba'){H18.drawMap({getContext:()=>g},'lobby');H18.pixelPerson(g,220,170,pal.kobayashi.palette,'right');H18.pixelPerson(g,280,170,(pal.katayama||pal.oldman).palette,'left');return}
  if(key==='road'){H18.drawMap({getContext:()=>g},'alley');g.fillStyle='#192031ae';g.fillRect(0,0,512,352);g.fillStyle='#dfca8755';g.fillRect(205,20,90,300);const push=prior.includes('他用力推了片山一把');H18.pixelPerson(g,235,175,pal.tanaka.palette,'right');H18.pixelPerson(g,push?288:272,push?190:175,(pal.katayama||pal.oldman).palette,'left');if(index===3||index===11){g.fillStyle=Math.sin(t/130)>0?'#c8bd8d22':'#05060b88';g.fillRect(0,0,512,352)}return}
  // Old izakaya: warm lamps, counter, glassware; no modern illustration assets.
  g.fillStyle='#302c2c';g.fillRect(0,0,512,352);g.fillStyle='#886344';g.fillRect(12,24,488,148);for(let x=20;x<510;x+=32){g.fillStyle='#423025';g.fillRect(x,24,3,148)}
  g.fillStyle='#543e31';g.fillRect(0,180,512,172);for(let y=190;y<350;y+=18){g.fillStyle='#6a4b37';g.fillRect(0,y,512,1)}
  g.fillStyle='#dda668';g.fillRect(75,20,30,26);g.fillRect(390,20,30,26);g.fillStyle='#312823';g.fillRect(30,90,450,45);for(let x=50;x<470;x+=27){g.fillStyle=x%2?'#536147':'#6a8158';g.fillRect(x,95,9,30);g.fillRect(x+2,90,5,10)}
  H18.pixelPerson(g,203,166,pal.tanaka.palette,'down');H18.pixelPerson(g,303,166,(pal.katayama||pal.oldman).palette,'down');
  g.fillStyle='#ac7852';g.fillRect(170,198,176,66);g.fillStyle='#d9cba0';g.fillRect(245,222,30,18);
  const drink=Math.max(2,14-(index%15));for(const x of [209,306]){g.fillStyle='#bfd7d599';g.fillRect(x,208,10,18);g.fillStyle='#c79b4f';g.fillRect(x+2,224-drink,6,drink);g.fillStyle='#eee1bb';g.fillRect(x+2,224-drink,6,2)}
  if(index>13){g.fillStyle='#d7d0b4';g.fillRect(240,207,35,25);g.fillStyle='#695c58';g.fillRect(244,211,27,16)}
  if(index>30){g.fillStyle='#15152366';g.fillRect(0,0,512,352)}
 }
 function cinema(key,done){
  if(running||SATO.active()||DM.isOpen())return false;if(key==='reunion'&&!check('reunion'))return false;
  const ss=state().shows[key]??={};if(key==='road'&&ss.watched){if(done)done();return false}
  if(key==='road'&&!check('push'))return false;
  const approved=GAME_DATA.d['investigation/tanaka-scenes'][key];if(!approved)return false;
  let rows=approved.map(x=>({...x}));
  if(key==='ending'&&!['TN04','TN03','TN02','MT01'].every(has)){
   const begin=rows.findIndex(x=>x.text==='你向他说明了调查结论。'),last=rows.findIndex(x=>x.text==='以及那张失踪的黑金信用卡。');
   if(begin>=0&&last>begin)rows.splice(begin,last-begin+1,{text:'你向他说明了报告里的谋杀判断，把现有材料和自己的猜测一并讲给他听。',who:''});
  }
  const title={reunion:'七楼的房间 · 田中口述重构',road:'回家的路上 · 调查推论',ending:'お前、何を調べてたんだ',school:'七楼的约定 · 高中旧事',koba:'小林的回忆 · 酒后归来的那晚'}[key];
  const ui=SATO.mount(title);if(!ui)return false;running=true;let i=key==='ending'?-1:(ss.watched?-1:(Number.isInteger(ss.cursor)?ss.cursor-1:-1)),closing=false;
  const portrait=document.createElement('img');portrait.style.cssText='width:80px;height:80px;image-rendering:pixelated;float:right';ui.p.before(portrait);
  const g=ui.cv.getContext('2d');g.imageSmoothingEnabled=false;let current='';
  function draw(t){if(!running)return;drawRoom(g,key,i,t,rows);raf=requestAnimationFrame(draw)}raf=requestAnimationFrame(draw);
  const stop=()=>{if(closing)return;closing=true;ui.b.disabled=true;cancelAnimationFrame(raf);const panel=ui.cv.parentElement;panel.style.transition=key==='road'?'none':'opacity 1.1s';panel.style.opacity='0';if(key==='road')window.AUDIO?.ambience('none');setTimeout(()=>{ss.watched=true;delete ss.cursor;if(state().pending===key)delete state().pending;campaignSave();running=false;ui.close();if(key==='road'&&window.AUDIO)AUDIO.ambience(H18.active()?H18.ambienceName():'district');if(key==='ending'){done?.();UI.page('ending',title,'END','<button id="tn-home" class="survival-btn">返回主页</button>');app.querySelector('#tn-home').onclick=()=>tokyoHome()}else if(done)done();},key==='road'?180:1150)};
  function next(){if(closing||ui.b.disabled)return;i++;if(i>=rows.length){stop();return}ss.cursor=i;campaignSave();current=rows[i].text;
   if(current.includes('画面骤然切黑')||current==='画面渐黑。'){stop();return}
   ui.p.textContent=current;ui.p.style.color=key==='ending'&&current.includes('人の話、ちゃんと聞いてたか？')?'#a44444':'';ui.p.style.fontFamily=ui.p.style.color?'monospace':'';
   const who=rows[i].who;const id=who==='片山'?'katayama':who==='小林'?'kobayashi':'tanaka';const p=GAME_DATA.story.chapter1.npcs[id];if(who&&who!=='你'&&p&&window.ART){portrait.src=ART.portrait(p.portrait,p.palette,{});portrait.hidden=false}else portrait.hidden=true;
   ui.b.disabled=true;setTimeout(()=>{if(running&&!closing)ui.b.disabled=false},350);
  }
  ui.b.onclick=next;ui.b.disabled=false;next();ui.b.focus();return true;
 }
 function talk(id){if(running||SATO.active())return;const ui=SATO.mount('人物调查');if(!ui)return;const host=document.createElement('div');host.className='adv-box';ui.p.replaceWith(host);ui.b.hidden=true;const g=ui.cv.getContext('2d');drawRoom(g,'reunion',0,0);const end=()=>{DM.close();ui.close()};
  SR.run(id,{nodes:H18.nodes,host:()=>host,cond:H18.cond,apply:H18.apply,pick:H18.pick,evidence:()=>H18.evidenceList(true),onEnd:end,call:k=>{end();if(k.startsWith('tn:'))call(k.slice(3));else if(k.startsWith('verify:'))VERIFY.call(k.slice(7))}});
 }
 function street(key){const id={'tn-worker':'tn-street-worker','tn-witness':'tn-street-witness','tn-driver':'tn-street-driver'}[key];if(id)talk(id)}
 function call(key){if(key==='verify'){VERIFY.present('tanaka');return}if(['road','reunion','school','koba'].includes(key)){const shown=cinema(key,()=>{if(H18.active())H18.endDialog()});if(!shown&&H18.active())H18.endDialog()}}
 function reportHtml(s){if(s.draft.person!=='tanaka')return '';return `<section class="rpg-panel"><h2>对田中的结论</h2>${[['review','提交人物调查，不指认杀人'],['murder','明确指认田中杀害片山']].map(([id,t])=>`<button type="button" class="rp-person" data-tn-verdict="${id}" aria-pressed="${(s.draft.accusation||'review')===id}">${t}</button>`).join('')}</section>`}
 function bindReport(s,save,render){app.querySelectorAll('[data-tn-verdict]').forEach(b=>b.onclick=()=>{s.draft.accusation=b.dataset.tnVerdict;save();render()})}
 return {state,has,check,event,onDeduction,maybeScene,facts,cinema,talk,street,call,reportHtml,bindReport,active:()=>running};
})();window.TANAKA=TANAKA;

const YUMI=(()=>{
 function progress(){return campaign.yumiBranch??={version:1,watched:{}}}
 function check(key){
  const ded=campaign.investigation?.deductions||{};
  if(campaign.day<2)return false;
  if(key.startsWith('early:')){const id=key.slice(6),need={YK01:'YK-D1',YK04:'YK-D2',YK06:'YK-D3',YK05:'YK-D4'}[id];const has=!!(campaign.investigation?.clues?.[id]||campaign.hotelCase?.v18?.clues?.includes(id));return has&&!(need&&ded[need])} // v60：单条线索就能引出的试探，推论合成后让位给正式对质
  if(key==='any')return Object.keys(ded).some(id=>id.startsWith('YK-D')||['XD03','XD04','XD14','XD18'].includes(id)); // v67：交织线里要拿去问高桥的推论（208、借卡、凌晨离开的人、办公室的灯）也能打开「出示」，不再要求先做过 YK 线
  if(key==='contact')return !!ded['YK-D4']&&!!campaign.yumiBranch?.watched?.second;
  if(key==='hotel')return !!ded['YK-D1'];
  if(key==='first')return !!(ded['YK-D1']&&ded['YK-D2']);
  if(key==='second')return !!(ded['YK-D3']&&campaign.investigation?.clues?.YKST);
  return false;
 }
 function reportHtml(s){
  if(s.draft.person!=='takahashi')return '';
  const button=(id,label)=>'<button type="button" class="rp-person" data-tn-verdict="'+id+'" aria-pressed="'+((s.draft.accusation||'review')===id)+'">'+label+'</button>';
  return '<section class="rpg-panel"><h2>对高桥的结论</h2>'+button('review','提交人物调查')+button('murder','明确指认高桥杀害片山')+'</section>';
 }
 function draw(cv,key,seen){
  const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const box=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
  const sprite=(x,y,coat,dir='down')=>H18.pixelPerson(g,x,y,{...GAME_DATA.story.chapter1.npcs.takahashi.palette,b:coat},dir);
  H18.drawMap(cv,'office');box(0,0,512,352,'#16122a55');
  if(['YK03','YK04','YK06','program'].includes(key)){
   const street=key==='YK03';box(92,44,328,253,'#252531');box(88,40,328,253,'#e1d7bf');box(100,52,304,208,street?'#888075':'#74868c');
   if(street){box(115,81,221,96,'#48404a');box(126,94,197,63,'#9caaa4');for(let j=0;j<7;j++)box(104+j*39,61,21,24,'#ad6758')}
   else{box(116,69,264,22,'#d8cdae');for(let j=0;j<6;j++)box(147+j*37,77,24,5,'#6e7067')}
   g.save();g.translate(131,136);g.scale(1.7,1.7);sprite(0,1,'#515462');sprite(50,0,'#987477');if(key==='YK06')sprite(98,1,'#59616f');else{g.translate(94,14);g.scale(.65,.65);sprite(0,0,'#9a8762')}g.restore();
   for(let j=0;j<3;j++)box(113+j*82,274,64,3,'#837d75');return;
  }
  const laugh=seen.includes('突然笑了')&&!seen.includes('止住笑声'),stiff=seen.includes('靠回椅子'),hurt=seen.includes('扶住额头');
  g.save();g.translate(224,142+(laugh?3:0));g.scale(2,2);sprite(0,0,'#59616f',stiff?'left':'down');
  if(hurt)box(7,10,7,4,'#edc8a2');if(laugh)box(14,14,6,2,'#73483f');g.restore();
  box(168,204,186,69,'#594236');box(167,200,188,10,'#977b5c');box(188,194,44,14,'#e7dbb8');box(210,194,2,14,'#8a765d');
  box(285,183,42,19,'#798489');box(290,175,33,9,'#dddbc7');box(292,194,26,3,'#313b41');box(190,209,30,3,seen.includes('红笔')?'#a24545':'#625750');
 }
 function pagesFor(key){
  const d=GAME_DATA.d['investigation/yumi'];
  if(key==='program'&&!campaign.investigation?.clues?.YK03)return ['活动册印着都议会议员汐折弦路的肖像。旁边站着一位女性和一个孩子，看上去像是家人；图片没有说明他们之间的关系。你记下了出版日期。'];
  if(key==='program')key='YK04';
  if(key==='YK03'&&! (campaign.investigation?.clues?.C03||campaign.investigation?.clues?.C04||campaign.investigation?.clues?.YK02||campaign.investigation?.clues?.YK01))return ['一张街景照片里，商店玻璃映出几个人影。光线和反光让脸部看不清。','照片边缘印着日期。你可以记下编号，之后再与其他资料核对；目前还无法判断照片里的人是谁。'];if(key.startsWith('YK'))return [GAME_DATA.story.chapter1.evidence[key].desc];
  if(key!=='ending')return d[key];
  return d.ending.map(line=>{
   if(line.startsWith('你指出，')&&!check('first'))return '你提出一个猜想：片山可能撞见了她的私人约会。';
   if(!progress().watched.first&&line.startsWith('「奥さんがいること'))return '「奥さんのことは、最初から知っていました。」\n“他有妻子的事，我从一开始就知道。”';
   if(!progress().watched.first&&line.startsWith('你提起她曾经隐瞒'))return '你提起她刚刚承认，自己早就知道对方有妻子。';
   if(!progress().watched.first&&line.startsWith('「嘘をついたことも'))return '「隠していたことも認めます。」\n“隐瞒这件事，我也承认。”';
   return line;
  });
 }
 function play(key,done){
  if(SATO.active()||(['first','second'].includes(key)&&!check(key)))return false;
  const photo=key.startsWith('YK')||key==='program';
  const item=key==='program'?'YK04':(photo?key:null);
  const ui=SATO.mount(key==='ending'?'週刊誌の読みすぎ · 八卦周刊看多了吧':photo?'资料特写':'港屋酒店 · 财务办公室');if(!ui)return false;
  const pages=pagesFor(key);let at=0,closing=false,seen='';
  function finish(){
   if(closing)return;closing=true;ui.b.disabled=true;
   if(item&&((item!=='YK03')||!!(campaign.investigation?.clues?.C03||campaign.investigation?.clues?.C04||campaign.investigation?.clues?.YK02||campaign.investigation?.clues?.YK01)))INV.addClue(item);
   if(key==='first')INV.addClue('YKST');
   if(key==='first'||key==='second'){
    const id=key==='first'?'YK-D2':'YK-D3',inv=INV.state();inv.dayVerify??={};inv.dayVerify[id]??={};
    inv.dayVerify[id].takahashi={npc:'takahashi',status:'已求证',detail:key==='first'?'高桥声称以为对方单身。':'高桥承认早知对方已婚，第一次证言失实。',at:{day:campaign.day}};
    UI.toast('调查记录已更新。');
   }
   if(!photo)progress().watched[key]=true;
   campaignSave();
   const leave=()=>{ui.close();done?.();if(key==='ending'){UI.page('ending','週刊誌の読みすぎ','END','<button class="survival-btn" id="yk-home">返回主页</button>');app.querySelector('#yk-home').onclick=()=>tokyoHome()}};
   if(key==='ending'){ui.cv.parentElement.style.transition='opacity 1s';ui.cv.parentElement.style.opacity='0';setTimeout(leave,1050)}else leave();
  }
  function next(){if(closing)return;const line=pages[at++];if(!line||line==='画面渐黑。'){finish();return}seen+=line;draw(ui.cv,key,seen);ui.p.textContent=line}
  ui.b.onclick=next;next();ui.b.focus();return true;
 }
 return {play,check,reportHtml,pagesFor};
})();window.YUMI=YUMI;

/* v67：疑点便签——五人交织线的微弱引导。数据在 story/chapter1 的 chapter.suspicions（items / warns），这里只负责判定和显示。
   当前疑点：主线（lane main）里第一条「已出现、未解开」的；另一条线（lane side）同时最多再显示一条。已解开的留在提醒页，只往回看，不预告后面。 */
const SUSP=(()=>{
 const ok=()=>!!campaign?.hotelCase?.v18;
 const st=()=>campaign.suspicion??={key:'',unseen:false,solved:{}};
 function read(){if(!ok())return null;const line=DAHLIA.note();return {main:line?{it:{id:line},step:{idx:0,text:line}}:null,side:null,solved:[],warn:null}}
 const keyOf=r=>r?[r.main&&r.main.it.id+':'+r.main.step.idx,r.side&&r.side.it.id+':'+r.side.step.idx,r.warn&&r.warn.text].join('|'):'';
 let mk={t:0,v:null};
 function mark(){const now=Date.now();if(now-mk.t>400){const r=read();mk={t:now,v:r&&r.main?r.main.step.mark:null}}return mk.v}
 function noteHtml(variant){const r=read();if(!r||!(r.main||r.side||r.warn))return '';
  const s=st();s.unseen=false;
  const one=(x,cls)=>'<p class="nb-susp-text'+(cls||'')+'">'+esc(x.step.text)+'</p>';
  return '<aside class="nb-susp'+(variant==='m'?' nb-susp-m':variant==='d'?' nb-susp-d':'')+'" aria-label="当前疑点"><h3 class="nb-hand">旧侦探小说里的便签</h3>'+
   (r.main?one(r.main):'')+(r.side?one(r.side,' side'):'')+(r.warn?'<p class="nb-susp-warn">'+esc(r.warn.text)+'</p>':'')+'</aside>'}
 function panelHtml(){const r=read();if(!r||!(r.main||r.side||r.warn||r.solved.length))return '';const s=st();
  return '<section class="inv-hint nb-susp-panel"><h3>💭 疑点</h3>'+noteHtml('p')+
   (r.solved.length?'<h4>已经想通的</h4><ul class="nb-susp-solved">'+r.solved.map(it=>'<li><s>'+esc(it.who)+'</s> '+esc(it.result)+'</li>').join('')+'</ul>':'')+'</section>'}
 function ping(panel){const r=read();if(!r||!st().unseen||!(r.main||r.side||r.warn))return;
  const p=document.createElement('p');p.className='nb-susp-ping';p.innerHTML='侦探小说里的便签多了一行字 ';const b=document.createElement('button');b.type='button';b.className='rpg-action';b.textContent='翻开手帐';
  b.onclick=()=>{try{INV.tab('lib')}catch(e){}UI.go('reasoning')};p.appendChild(b);(panel.querySelector('h3')||panel.firstChild).after(p)}
 let busy=false;
 function check(){if(busy||!ok())return;busy=true;try{const r=read(),k=keyOf(r),s=st();
   for(const it of (r?r.solved:[]))s.solved[it.id]??=campaign.day;
   if(k!==s.key){const fresh=!!(r&&(r.main||r.side||r.warn));s.key=k;if(fresh){s.unseen=true;try{UI.toast('侦探小说里的便签多了一行字')}catch(e){}}}
  }finally{busy=false}}
 return {read,mark,noteHtml,panelHtml,ping,check};
})();
window.SUSP=SUSP;
{const suspSave=campaignSave;campaignSave=function(){try{SUSP.check()}catch(e){}return suspSave.apply(this,arguments)}}


