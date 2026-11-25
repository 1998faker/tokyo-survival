/* ==== engine/survival/99-startup.js ==== */
/* 【生存模式启动（必须是 survival 文件夹里最后一个文件）】 */
/* ==== 大地图视口记忆：离开后返回原滚动位置 ==== */
(function(){
  const state={visited:false,y:0,mapX:0,mapY:0};
  let rendering=false;
  function mapHost(){return document.getElementById('map-host')}
  function remember(){
    const host=mapHost();
    if(!host||rendering)return;
    state.visited=true;
    state.y=window.scrollY||document.documentElement.scrollTop||0;
    state.mapX=host.scrollLeft||0;
    state.mapY=host.scrollTop||0;
  }
  // 元素被替换前的点击记录：兼容底部导航、车站和场景入口。
  document.addEventListener('click',function(){if(mapHost())remember()},true);
  window.addEventListener('scroll',function(){if(mapHost()&&!rendering)remember()},{passive:true});
  document.addEventListener('scroll',function(e){if(e.target&&e.target.id==='map-host'&&!rendering)remember()},true);
  const originalHome=tokyoHome;
  tokyoHome=function(){
    const wasOnMap=!!mapHost();
    if(wasOnMap)remember();
    const restore=state.visited;
    const y=state.y,x=state.mapX,mapY=state.mapY;
    rendering=true;
    try{return originalHome.apply(this,arguments)}
    finally{
      // 原首页内部会强制 window.scrollTo(0,0)，因此在它完成绘制后恢复。
      const host=mapHost();
      if(host&&restore){
        host.scrollLeft=x;
        host.scrollTop=mapY;
        window.scrollTo({top:y,left:0,behavior:'instant'});
      }
      requestAnimationFrame(function(){
        const h=mapHost();
        if(h&&restore){
          h.scrollLeft=x;
          h.scrollTop=mapY;
          window.scrollTo({top:y,left:0,behavior:'instant'});
        }
        rendering=false;
        if(h)remember();
      });
    }
  };
})();
UI.mount();
mountRecovery();
window.tokyoHome=tokyoHome;/* Daytime witnesses share the hotel verification records and the investigation notebook. */
const OUTINGS=(()=>{
 const people={
  gotanda:{npc:'sato',name:'佐藤美穂',pos:[68,78],first:'购物袋从佐藤的腕上滑下来。她用肩膀夹住电话。\n「だから、今月はもう送れないって言ってるでしょ……。」\n“我说了，这个月已经没办法再寄钱了……”\n她挂了电话。「……ホテルのお客さんですよね。」\n“……你是酒店的客人吧。”',next:'佐藤折好收据。“要问前台的事，就趁我等车这会儿吧。”',deds:['D02','D18','D16','D17']},
  shimbashi:{npc:'mori',name:'森正彦',pos:[46,70],first:'森从居酒屋侧门出来。跟在他身后的男人指了指文件。\n「約束したじゃないですか。」\n“我们不是说好了吗？”\n等那人走远，森才合上公文包。「……どうして、ここにいるんですか。」\n“……你怎么会在这里？”',next:'森把公文包移到另一只手上。“如果是酒店的事，请说。”',deds:['D19','D17','D02']},
  ueno:{npc:'kobayashi',name:'小林辰夫',pos:[26,72],first:'旧书摊前，小林一直停在杂志的同一页。听见脚步声，他把书合了起来。\n「……何か用ですか。」\n“……找我有什么事吗？”',next:'小林把杂志插回架上。“快到值班时间了。你想问什么？”',deds:['KD01','KD02','KD03','KD04','D16']},
  shibuya:{npc:'tanaka',name:'田中震',first:'一位老人对着展示相机找了半天。田中伸手拨动屈光度转盘，示意他再看看。\n店员说：「お詳しいですね。」“您还真懂啊。”\n「昔、ちょっとね。」“以前稍微接触过。”\n老人走后，他才看见你。「こんなところで会うとはな。」“没想到会在这里碰见你。”\n他看了一眼货架。“以前就在这附近工作。已经很久了。”',next:'田中正把相机背带理顺。“207那边，查得怎么样了？”',deds:['D08','D09','D10','D14','D15','D20','D21']}
 };
 const replies={D02:{sato:'登记簿上的字被改过。佐藤把你指出的那一栏认了下来。',mori:'森承认酒店改动过记录。交接房卡的人不一定有权修改登记。'},D08:'田中认出自己的短信。他说临时夜班让他错过那次见面，两人后来又约了时间。',D09:'田中指着合照，按从左到右的顺序念出五个人的名字。“年轻时说好，还要坐回同一张桌子。”',D10:'田中认得那台相机。他说片山一直舍不得卖掉它。这趟上京，他还想再找找以前的人。',D14:'田中认出了合影中的老朋友，又指出当年桌子靠窗的那一侧。',D15:'“那家店啊，我们说好以后还去。”田中记得约定，记不清是哪一年。',D16:'小林记得后门开过。仅凭救护车到过后巷，还不能确认车上是谁。',D17:'森记不清车子绕行的日期，无法用出租车的记录给退房时间作证。',D18:'佐藤确认当班时有人帮忙交还房卡。交卡和填写登记簿是两件事。',D19:'森说登记由前台负责，经理复核。他承认前员工会协助交接房卡。交接记录不能说明谁动过登记簿。',D20:'“五份。我们以前每次坐下来，就是这个数。”田中把展示机放回架上。',D21:'田中记得片山逐个打听过老朋友，却不知道最后有没有找到所有人。',KD01:'小林认出旧照片的年代，对画面边缘的男人沉默了很久。',KD02:'他承认早年的记录有一段空白，却不肯把旧名字说出口。',KD03:'他说明夜班巡逻的路线和换岗时间，不替别人的去向担保。',KD04:'他建议你对照排班与实际签到，排班表不能证明人在场。'};
 const notes={friends:'田中把两页资料并排看了很久。“那天我站在他左手边。你看，这儿少了一颗扣子。”他认出了北品川合影里的自己。上野记下的站位有了人证，照片仍不能说明片山最后一夜发生了什么。',satoTime:'佐藤说：“我能核对的是那班的交接簿。听见车声，跟亲眼看见谁被接走，是两回事。”外部行车顺序可对照，日期与乘员仍待核实。',moriKeys:'森说经理复核登记，前台负责填写。前员工称自己曾临时帮忙交房卡，但登记簿由前台填写。两种工作不能混为一谈，也不足以确定是谁修改记录。',kobaPast:'小林把杂志封面扣在桌上：“你查过那些旧资料了吧。现在，我只管酒店的夜班。”他没有辨认片山的旧友。'};
 function state(){return campaign.cityVisits??={calls:{},seen:{},notes:{}}}
 const clue=id=>!!campaign.investigation?.clues?.[id],ded=id=>!!campaign.investigation?.deductions?.[id];
 function day(){return campaign&&campaign.day>=2&&campaign.day<=6&&!H18.active()&&!EXPLORE.night()&&!campaign.hotelCase?.ending&&!['submitted','dead','closed'].includes(campaign.case1?.state)}
 function eligible(id){if(!day())return false;const f=campaign.hotelCase?.v18?.flags||{};switch(id){case 'shimbashi':return !!f['met:mori']&&(clue('M01')||clue('M02')||ded('MD01')||clue('DAY-SB-01'));case 'shibuya':return clue('TN01')||!!(f['tn:met']||f.tanakaMet||f['met:tanaka']||campaign.verify?.met);default:return !!f['met:'+people[id]?.npc]}}
 function present(id){if(!eligible(id))return false;const s=state(),key=campaign.day+'-'+id;if(!(key in s.calls)){s.calls[key]=Math.random()<.65||s.calls[(campaign.day-1)+'-'+id]===false;campaignSave()}return s.calls[key]}
 function note(key){state().notes[key]=notes[key];
  const link={satoTime:['sato',['D16','D17']],moriKeys:['mori',['D18','D19']],kobaPast:['kobayashi',['KD01','KD02']],friends:['tanaka',['D14','D15','D20','D21']]}[key];
  if(link){const inv=campaign.investigation;inv.dayVerify??={};for(const did of link[1])if(inv.deductions?.[did]){const rec=inv.dayVerify[did]??={};rec['field-'+link[0]]??={status:'部分支持',detail:notes[key],npc:link[0],at:{day:campaign.day}}}}
  campaignSave();UI.modal({title:'私人调查笔记',html:'<p>'+notes[key]+'</p>',buttons:[{label:'收好笔记'}]})}
 function talk(id){if(!present(id))return;const p=people[id],s=state(),first=!s.seen[id];s.seen[id]=true;campaignSave();const buttons=[];
  if(id==='gotanda'&&(clue('DAY-GD-01')||clue('DAY-GD-02')||ded('D16')||ded('D17')))buttons.push({label:'把行车顺序与交接班对照',fn:()=>note('satoTime')});
  if(id==='shimbashi'&&(clue('DAY-SB-01')||clue('DAY-SB-02')))buttons.push({label:'核对前员工的房卡证词',fn:()=>note('moriKeys')});
  if(id==='shibuya'&&clue('DAY-KS-01')&&clue('DAY-UE-01')&&(ded('D14')||ded('D21')))buttons.push({label:'并排出示北品川合影和上野比对记录',fn:()=>note('friends')});
  if(id==='ueno'&&(clue('K03')||clue('K04')))buttons.push({label:'询问杂志与旧身份资料',fn:()=>note('kobaPast')});
  for(const did of p.deds.filter(ded)){const r=VERIFY.fieldRule(did,p.npc);if(!r)continue;const done=!!campaign.verify?.done?.[r.id],desc=typeof replies[did]==='object'?replies[did][p.npc]:replies[did];
   buttons.push({label:(done?'回看 · ':'出示 · ')+did+' '+(INV.deductions().find(x=>x.id===did)?.name||''),fn:()=>UI.modal({title:p.name,html:'<p>'+esc(desc)+'</p>',buttons:[{label:done?'收好记录':'记入调查记录',fn:()=>{if(present(id)&&VERIFY.fieldConfirm(did,p.npc)){s.notes[r.id]=desc;campaignSave()}}}]})});
  }
  buttons.push({label:'继续逛街'});let text=first?p.first:p.next;let title=p.name;
  if(id==='shibuya'){const f=campaign.hotelCase?.v18?.flags||{},named=!!(f['tn:met']||f.tanakaMet||f['met:tanaka']||campaign.verify?.met),client=!!(f.clientKnown||campaign.tanakaBranch?.events?.clientVerified); // v31
   if(!named){text=text.replace(/田中/g,'那位老人');title='相机柜台前的老人'}if(!first&&!client)text='田中正把相机背带理顺。“有什么事吗？”'.replace('田中',named?'田中':'老人');if(first&&clue('TN01'))text+='\n你认出他是那位买了五份便当的客人。';if(campaign.hotelCase?.v18?.flags?.clientKnown||campaign.tanakaBranch?.events?.clientVerified)text+='\n“我拜托你的那件事，有消息再告诉我。”'}
  UI.modal({title,html:'<p style="white-space:pre-line">'+esc(text)+'</p>',buttons});
 }
 function mount(world,id){if(!people[id]?.pos||!present(id))return;const p=people[id],b=document.createElement('button');b.className='street-hot';b.style.left=p.pos[0]+'%';b.style.top=p.pos[1]+'%';b.innerHTML='<canvas width="32" height="32"></canvas><small>'+p.name+'</small>';b.onclick=e=>{e.stopPropagation();talk(id)};world.appendChild(b);H18.pixelPerson(b.firstChild.getContext('2d'),0,0,GAME_DATA.story.chapter1.npcs[p.npc]?.palette,'down')}
 function availableQuestions(id){const p=people[id];if(!p||!eligible(id))return [];return p.deds.map(d=>VERIFY.fieldRule(d,p.npc)).filter(r=>r&&!campaign.verify?.done?.[r.id])}
 return {present,talk,mount,state,availableQuestions};
})();

const SHIBUYA=(()=>{
 const names={plaza:'八公口站前广场',cross:'涩谷十字路口',shop:'站前电器店',lane:'中心街与后巷'};
 // Spots occupy pavement tiles. Portals open when stepped on, other subjects on interaction.
 const points={
  plaza:[[1,8,'站口','exit'],[14,7,'公园通口','cross'],[5,5,'八公像','hachiko'],[9,4,'等候的人','wait'],[2,4,'自贩机','drink']],
  cross:[[1,7,'八公口','plaza'],[13,4,'电器店入口','shop'],[14,8,'中心街','lane'],[4,8,'街头取景','scramble']],
  shop:[[2,9,'店门','cross'],[9,4,'展示相机','camera'],[4,4,'耳机试听','phones'],[13,4,'收银台','staff'],[10,7,'田中震','tanaka']],
  lane:[[1,8,'站前路口','cross'],[9,4,'游戏厅','claw'],[4,4,'定食屋','menu'],[14,6,'后巷','alley'],[2,5,'自动贩卖机','drink']]
 };
 const boxes={plaza:[[3,2,3,2],[10,2,3,2]],cross:[],shop:[[3,2,3,2],[8,2,3,2],[12,2,2,2],[5,6,3,1]],lane:[[3,2,4,2],[8,2,4,2],[12,2,2,3]]};
 const walls=(r,x,y)=>x<0||x>15||y<2||y>9||boxes[r].some(([a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h);
 let view=null,raf=0,queue=[],target=null,clock=0,last=0;
 const st=()=>campaign.shibuyaWalk??={room:'plaza',x:2,y:8};
 const button=(label,fn)=>({label,fn});
 function tell(title,body,buttons=[]){UI.modal({title,html:'<p style="white-space:pre-line">'+esc(body)+'</p>',buttons:[...buttons,{label:'继续探索'}]})}
 function claw(){const s=st();if(!s.coin){if(campaign.cash<100)return tell('游戏厅','口袋里的零钱不够一百円。');return tell('玻璃柜里的点心盒','一回 100 円。机械爪停在轨道左端。',[button('投入 ¥100',()=>{if(!s.coin&&campaign.cash>=100){campaign.cash-=100;s.coin={x:0,prize:1+Math.floor(Math.random()*4)};campaignSave()}claw()})])}
  const c=s.coin;function shift(d){c.x=Math.max(0,Math.min(5,c.x+d));campaignSave();claw()}
  UI.modal({title:'游戏厅 · 抓物机',html:'<div style="font:24px monospace;white-space:pre;background:#21343d;padding:1em;color:#ffe3af">'+['╥','♧'].map((v,i)=>Array.from({length:6},(_,n)=>n===(i?c.prize:c.x)?v:'·').join(' ')).join('\n')+'</div><p>左右移动机械爪，对准点心盒后下降。</p>',buttons:[button('←',()=>shift(-1)),button('→',()=>shift(1)),button('下降',()=>{if(st().coin!==c)return;const won=c.x===c.prize;delete s.coin;if(won){campaign.items??={};campaign.items['day-snack']=(campaign.items['day-snack']||0)+1}campaignSave();tell('机械爪下降',won?'爪子扣住纸盒，落进取物口。日式点心已放入背包。':'爪子擦过纸盒，空着升回柜顶。')}),{label:'暂时离开'}]})
 }
 function use(k){switch(k){case 'exit':view=null;renderDistrict();return;case 'camera':return CITYPHOTO.shoot('scramble',OUTINGS.present('shibuya')&&OUTINGS.state().seen.shibuya);case 'scramble':return CITYPHOTO.shoot('scramble');case 'hachiko':return CITYPHOTO.shoot('hachiko');case 'tanaka':return OUTINGS.talk('shibuya');case 'claw':return claw();case 'drink':return tell('街边自贩机','取物口上方贴着价格。',[button('罐装咖啡 ¥180',()=>UI.toast(DAYPHASE3.buy('sc-coffee')?'咖啡已放入背包。':'现金不足。'))]);default:const lines={wait:'“我在狗像旁边。”女孩放下电话，朝另一边的狗像指示牌看了一眼。',phones:'戴上试听耳机，外面十字路口的声音一下子远了。',staff:'「何かお探しですか。」\n“您想找什么？”店员把窗边的展示机转向街口，示意你可以试拍。',alley:'排风扇在头顶缓缓转动。后门的箱子上写着下次送货的时间。',menu:'今日定食的木牌已经翻面。店里有人把最后一摞碗放进水槽。'};tell('街角',lines[k]||'行人从身边走过。')}}
 function activePoints(){const r=st().room;return points[r].filter(p=>p[3]!=='tanaka'||OUTINGS.present('shibuya'))}
 function enter(room,from){if((room==='cross'||room==='plaza')&&typeof ST_MAPS!=='undefined'&&ST_MAPS.shibuya){cancelAnimationFrame(raf);view=null;STV8.setRet(...(from==='lane'?[2,1]:[13,3]));renderDistrict();return}const s=st(),door=points[room].find(p=>p[3]===from);Object.assign(s,{room,x:door?door[0]:2,y:door?door[1]:8});V51ADD.onCross(room);campaignSave();open()}
 function atPoint(p){if(names[p[3]])enter(p[3],st().room);else use(p[3])}
 function move(dx,dy){if(!view?.isConnected||document.querySelector('dialog[open],.et-modal-back,.sc-overlay'))return false;const s=st(),x=s.x+dx,y=s.y+dy;if(walls(s.room,x,y))return false;s.x=x;s.y=y;campaignSave();const point=activePoints().find(p=>p[0]===x&&p[1]===y);if(point&&names[point[3]]){enter(point[3],s.room);return true}
  if(s.room!=='shop'&&V51ADD.onCross(s.room)&&STREET_WALK.step('shibuya','shibuya')){V51ADD.crossingEncounter();queue=[];target=null}return true}
 function walk(x,y,hot){const s=st();if(walls(s.room,x,y))return;const work=[[s.x,s.y,[]]],seen=new Set();queue=[];target=null;
  for(let i=0;i<work.length;i++){const [a,b,path]=work[i],key=a+','+b;if(seen.has(key))continue;seen.add(key);if(a===x&&b===y){queue=path;target=hot;return}if(path.length&&activePoints().some(p=>names[p[3]]&&p[0]===a&&p[1]===b))continue;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(!walls(s.room,a+dx,b+dy)&&!seen.has((a+dx)+','+(b+dy)))work.push([a+dx,b+dy,[...path,[dx,dy]]])}}
 function draw(canvas,t){const s=st(),r=s.room,shop=r==='shop',green=Math.floor(t/4500)%2===0,walkers=[]; // v30：改用酒店风格（STATION_ART.shibuya），画布 512×320，每格 32px
  for(let i=0;i<(shop?2:7);i++){let x,y,dir;if(r==='cross'){const cycle=Math.floor(t/9000),p=green?Math.min(1,(t%9000)/(3200+i*150)):1;const reverse=(cycle+i)%2;x=(61+(reverse?1-p:p)*112)*2-16;y=(72+i*7)*2-30;dir=p>=1?'down':reverse?'left':'right'}else{const w=Math.sin(t/1400+i);x=(26+i*25+w*6)*2-16;y=shop?(5.6+(i%2)*1.2)*32:(5.8+(i%3)*0.7)*32;dir=Math.cos(t/1400+i)>0?'right':'left'}walkers.push({x,y,dir,pal:STATION_ART.walkerPal(i),frame:Math.floor(t/380+i)%2})}
  STATION_ART.shibuya(canvas,r,s,t,{boxes:boxes[r],points:activePoints(),green,walkers});
 }
 function open(){if(!campaign)return;cancelAnimationFrame(raf);queue=[];target=null;const s=st();UI.scene('shibuya',open);app.innerHTML='<section class="rpg-panel"><small>渋谷　/　街区散步</small><h2>'+names[s.room]+'</h2><div id="sh-map" style="position:relative;max-width:840px"><canvas width="512" height="320" aria-label="涩谷可移动地图" style="width:100%;display:block;image-rendering:pixelated"></canvas></div><p>点击地面行走，点击招牌走近互动。方向键或 WASD 移动，空格调查身边。</p><div class="day-pad">'+['←','↑','↓','→'].map((v,i)=>'<button data-shmove="'+i+'">'+v+'</button>').join('')+'</div><button class="survival-btn alt" id="sh-exit">返回站区</button></section>';
  view=app.querySelector('#sh-map');const thisView=view,cv=view.firstChild;activePoints().forEach(p=>{const b=document.createElement('button');b.className='photo-pin';b.style.left=(p[0]+.5)*6.25+'%';b.style.top=(p[1]+.2)*10+'%';b.textContent=p[2];b.onclick=()=>walk(p[0],p[1],p);view.appendChild(b)});V51ADD.shibuyaPins(view,'.photo-pin');
  cv.onclick=e=>{const r=cv.getBoundingClientRect();walk(Math.floor((e.clientX-r.left)*16/r.width),Math.floor((e.clientY-r.top)*10/r.height),null)};
  const dirs=[[-1,0],[0,-1],[0,1],[1,0]];app.querySelectorAll('[data-shmove]').forEach(b=>b.onclick=()=>{queue=[];target=null;move(...dirs[+b.dataset.shmove])});app.querySelector('#sh-exit').onclick=()=>use('exit');
  function frame(now){if(thisView!==view||!view?.isConnected)return;if(now-last>95){last=now;if(!document.querySelector('dialog[open],.et-modal-back,.sc-overlay')){clock+=96;if(queue.length)move(...queue.shift());else if(target){const p=target;target=null;atPoint(p)}}if(thisView!==view)return;draw(cv,clock)}raf=requestAnimationFrame(frame)}frame(performance.now())
 }
 window.addEventListener('keydown',e=>{if(!view?.isConnected||document.querySelector('dialog[open],.et-modal-back,.sc-overlay'))return;const d={arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0],arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1]}[e.key.toLowerCase()];if(!d&&e.key!==' ')return;e.preventDefault();e.stopImmediatePropagation();queue=[];target=null;if(d)move(...d);else{const s=st(),p=activePoints().find(p=>Math.abs(p[0]-s.x)+Math.abs(p[1]-s.y)<=1);if(p)atPoint(p)}},true);
 return {open,claw};
})();

/* Developer nodes explicitly seed a disposable save. No normal play entry calls these. */
const FIELDDEV=(()=>{
 const nodes=[['五反田 · 初遇佐藤','gotanda'],['五反田 · 核对登记','gotanda','D02'],['新桥 · 初遇森','shimbashi'],['新桥 · 核对房卡职责','shimbashi','D19'],['上野 · 小林旧身份','ueno','KD02'],['电器店 · 初遇田中','shibuya'],['田中 · 五人约定','shibuya','D09'],['田中 · 摄影往事','shibuya','D10'],['步行穿越十字路口','cross'],['展示机取景','camera'],['中心街抓物机','claw'],['八公像与相册','hachiko']];
 function jump(i){const [label,id,did]=nodes[i];campaign.day=3;campaign.actions=3;campaign.hotelCase??={};H18.state();const f=campaign.hotelCase.v18.flags;campaign.hotelCase.ending='';campaign.case1??={};campaign.case1.state='active';campaign.case1.start=1;
  const p={gotanda:'sato',shimbashi:'mori',ueno:'kobayashi',shibuya:'tanaka'}[id];if(p){f['met:'+p]=true;OUTINGS.state().calls['3-'+id]=true;delete OUTINGS.state().seen[id];if(id==='shimbashi')INV.addClue('M02',true)}
  if(did){const d=INV.deductions().find(d=>d.id===did);for(const k of d.pair)INV.addClue(k,true);INV.state().deductions[did]??={from:d.pair.slice(),at:{day:3}};if(id==='gotanda')INV.addClue('DAY-GD-02',true)}
  district=byId[p?id:'shibuya'];districtPos={x:50,y:51};campaignSave();if(p&&id!=='shibuya'){renderDistrict();OUTINGS.talk(id);return}
  const room={cross:'cross',camera:'shop',claw:'lane',hachiko:'plaza',shibuya:'shop'}[id];campaign.shibuyaWalk={room,x:8,y:7};SHIBUYA.open();if(id==='shibuya')OUTINGS.talk(id);if(id==='camera'||id==='hachiko')CITYPHOTO.shoot(id==='camera'?'scramble':id);if(id==='claw')SHIBUYA.claw()
 }
 const base=UI.settingsPage;UI.settingsPage=function(){base.apply(this,arguments);if(!INV.dev()||!campaign)return;const el=document.createElement('section');el.className='rpg-panel';el.innerHTML='<h3>城市走访 · 开发者节点</h3><p>仅在测试存档使用。跳转会调整当天状态和指定推论。</p>';nodes.forEach(([name],i)=>{const b=document.createElement('button');b.className='rpg-action';b.textContent=name;b.onclick=()=>UI.confirm('进入测试节点？','此操作会修改当前存档的日期和调查状态。',()=>jump(i));el.appendChild(b)});app.appendChild(el)};
 return {jump};
})();

const CASEQUEST=(()=>{
 const titles=['','调查207号室发生过什么。','查明207号室过去的住客身份。','调查片山茂的下落。','查明片山最后的遭遇。','核实酒店事后对这件事的处理。','调查片山死亡背后是否存在人为因素。','重新检查207号室浴室现场。','调查片山上京的原因。'];
 const directions=['','留意房门上的使用痕迹，再听听前台怎么描述这间房。','把住宿资料与工作人员对住客的记忆对照。','询问最后见过住客的人，核对退房时间和遗留物品。','把深夜发生的事按时间排列，区分亲眼所见与转述。','分别核对谁接了报告、谁进入房间，以及登记后来发生了什么变化。','比较人物证言与现场条件，看看哪些说法经得起核对。','回到现场，把设施的位置与开门经过分别画在草图上。','从已经取得的私人物品和相关人物的回忆，核对这趟旅程。'];
 function active(c){return !!c&&!c.chapter1Skipped&&c.birth!=='narita'&&!(c.storyIndex>0||c.hotelCase?.ending||c.hotelEnding||['closed','dead','submitted'].includes(c.case1?.state))&&!!(c.prologue?.finale||c.prologue?.done||c.caseQuest?.opened||c.firstDayComplete&&(c.hotelCase?.v18?.startDay||c.case1?.start!=null||c.investigation?.clues?.C01))}
 function read(c){
  const inv=c.investigation||{},v=c.hotelCase?.v18||{},f=v.flags||{},s=c.case1||{},events=c.satoBranch?.events||{};
  const clue=k=>!!inv.clues?.[k],ded=k=>!!inv.deductions?.[k],ev=k=>!!inv.evidence?.[k],raw=k=>v.clues?.includes(k)||v.testimony?.includes(k),ask=k=>c.verify?.done?.[k]||f['vf:'+k];
  const confession=!!(f.moriConfessed||f['mori:concealment']||ask('mori-concealment')),admission=!!ask('mori-D02');
  const factsKnown=CASE_FACTS.read(c),solved=factsKnown.accident,deathConfirmed=factsKnown.death;
  const named=!!(clue('C03')||raw('register')||raw('t_mori')||deathConfirmed||(raw('name')&&(clue('C13')||raw('report'))));
  const checkout=factsKnown.checkout;
  const presence=!!(events.presence||events.moriPresence||f['sato:presence']||confession);
  const deathSuspected=!!(deathConfirmed||ded('D03')||ded('D04')||(clue('C12')&&(clue('C04')||clue('M11'))));
  const motive=ROOMFILE.motive(c),appointment=!!(motive&&clue('KT05')&&c.roomFile?.appointment);
  const report=DAHLIA.sealed(c)&&ROOMFILE.solved(c);
  let stage=1;
  if(clue('C01')||raw('towel')||raw('towels')||raw('name')||ev('E01')||clue('C13'))stage=2;
  if(named)stage=3;
  if(named&&(deathSuspected||presence||clue('MC08')))stage=4;
  if(deathConfirmed)stage=5;
  if(named&&deathConfirmed&&ded('D04'))stage=6;
  if(ROOMFILE.canInspect(c)&&(deathConfirmed||deathSuspected||clue('BR00')||clue('BR01')))stage=7;
  if(solved)stage=8;
  const facts=['第一夜，207号室出现了无法解释的异状。'];
  if(ev('E01'))facts.push('已有材料记录了207号室的连住情况。');
  if(named)facts.push('207号室曾住着片山茂。');
  if(clue('C13')||raw('report'))facts.push('退房已经登记，住客的行李却仍在酒店。');
  else if(checkout)facts.push('现有推论对酒店的退房说法提出了疑问。');
  if(clue('C04'))facts.push('小林见过一辆救护车从后巷进入，没有看清病患。');
  if(confession||admission)facts.push('森经理确认片山已经死亡。');
  else if(deathConfirmed)facts.push('现有调查材料确认片山已经死亡。');
  if(clue('MC08'))facts.push('森与佐藤对207的说法存在出入。')
  if(presence)facts.push('已有当事人证言确认森与佐藤曾一起到场。');
  if(clue('C03')||raw('register')||admission)facts.push('207号室的登记被改动过。');
  if(confession)facts.push('森承认两人事后移走遗体，并向调查隐瞒经过。');
  else if(factsKnown.suspicion&&!factsKnown.concealment)facts.push('记录与证词仍有疑点，不能确认酒店隐瞒了什么。');
  if(solved)facts.push('经现场重建，浴室的物理痕迹能够解释致命伤。开门和事后处置仍需分别核对。');
  if(clue('C08'))facts.push('毕业照背面写着五个人的姓名。');
  if(appointment)facts.push('遗物与田中的证词印证了片山次日的赴约安排。');
  const title=DAHLIA.objective(c)||(ROOMFILE.solved(c)?'整理207号室最终调查报告。':report?'复核已有材料，提交207号室最终调查报告。':stage===6&&!deathConfirmed?'核实207号室是否发生过人为伤害。':stage===3&&checkout?'查明片山最后一次被人见到的时间和地点。':stage===8&&appointment?'复核片山最后的约定与酒店的事后责任。':titles[stage]);
  return {stage,title,facts,deathSuspected,deathConfirmed,report:report&&DAHLIA.sealed(c),direction:DAHLIA.objective(c)||(ROOMFILE.deathKnown(c)?'复核已经取得的记录。':report?'整理实际取得的材料、推论和求证记录，复查仍有疑问的地方。':stage===4&&!deathConfirmed?'救护车、开门和住客下落之间还有空白。寻找能说明现场经过的亲历者。':directions[stage])}
 }
 let pending=null;
 function sync(c){if(!active(c))return;const x=read(c),key=x.stage+'|'+x.title;let q=c.caseQuest;
  if(!q){q=c.caseQuest={opened:true,shown:{},mornings:{},history:[],stage:x.stage,target:x.title};q.shown[key]=true}
  q.stage=x.stage;q.target=x.title;q.factsSeen??={};q.mornings??={};q.shown??={};q.history??=[];for(const fact of x.facts)q.factsSeen[fact]??=c.day;
  if(!q.history.some(h=>h.key===key))q.history.push({key,day:c.day,title:x.title});
  if(!q.shown[key]&&pending!==c){pending=c;queueMicrotask(()=>{pending=null;if(c!==campaign||!active(c))return;const now=read(c),k=now.stage+'|'+now.title;if(q.shown[k])return;q.shown[k]=true;UI.toast('调查任务已更新 · '+now.title);campaignSave()})}
  return q
 }
 function briefText(c,x){
  if(x.report)return '最终调查报告提交日。复核线索、推论及证言，利用仍开放的入口补查，再整理报告。';
  if(c.day===2)return '白天可走访或打工筹集调查费；回到酒店后，可查询住宿记录，向工作人员询问房间情况。';
  if(c.day===3)return '翻阅调查时间线，对照已有记录；再次询问已经接触过的人。';
  if(ROOMFILE.canInspect(c))return c.day>=5&&c.investigation?.clues?.C08?'可以对照旧照片与人物证言，也可以回207号室复查浴室。':'可以回207号室复查设施与门框痕迹，核对工作人员的说法。';
  return c.day>=5&&c.investigation?.clues?.C08?'从已发现的毕业照入手，核对人物之间的联系。':'回看手帐中尚未核实的记录，继续走访已接触的工作人员。'
 }
 function brief(){const c=campaign;if(!active(c)||c.prologue?.morning||c.hotelCase?.v18?.flags?.morningPending||c.prologue?.finale||GS.dead())return;
  const x=read(c);if(c.day<2)return;const q=sync(c),key=String(c.day);if(q.mornings[key]||q.mornings['report-day']?.day===c.day)return;
  const host=app.querySelector('.et-map-layout,.daily-panel,.h18-panel,[data-review],.rp-notice,#rp-submit,.rpg-hero');if(!host)return;
  const agenda=CASE_NOTES.agenda(c,x),panel=document.createElement('section');panel.className='rpg-panel cq-brief';
  panel.innerHTML='<small>调查局 · DAY '+c.day+' 晨间简报</small><h3>'+esc(x.title)+'</h3>'+CASE_NOTES.agendaHtml(agenda)+
   '<div class="daily-buttons"><button type="button" class="rpg-action" data-case-task>打开任务</button><button type="button" class="rpg-action" data-case-dismiss>收起简报</button></div>';
  panel.querySelector('[data-case-task]').onclick=()=>UI.go('quest');panel.querySelector('[data-case-dismiss]').onclick=()=>panel.remove();
  (host.closest('.rpg-shell')||host.parentElement).prepend(panel);q.mornings[key]={day:c.day,text:briefText(c,x),title:x.title,agenda};campaignSave()
 }
 function mount(){if(!active(campaign))return;const c=campaign,x=read(c),q=sync(c),page=app.querySelector('.et-page'),head=page?.querySelector('.et-page-head');if(!head)return;
  const generic=head.nextElementSibling;generic?.remove();page.querySelector('#et-night-hotel')?.closest('section')?.remove();
  const other=document.createElement('details');other.className='rpg-panel';other.innerHTML='<summary>生存与日常</summary>';for(const node of [...page.children])if(node!==head)other.append(node);page.append(other);
  const panel=document.createElement('section');panel.className='rpg-panel cq-main';panel.innerHTML='<div class="rpg-kicker">调查局 / CASE NO. 001</div><h2>港屋酒店207号室</h2><small>当前主线目标</small><h3>'+esc(x.title)+'</h3>'+CASE_NOTES.agendaHtml(CASE_NOTES.agenda(c,x))+'<details><summary>累计调查记录</summary><ul>'+x.facts.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul><p>'+esc(x.direction)+'</p></details><div class="daily-buttons"></div><details><summary>任务与简报记录</summary>'+q.history.map(h=>'<p>DAY '+esc(h.day)+' · '+esc(!x.deathConfirmed&&h.title==='调查片山死亡背后是否存在人为因素。'?'核对片山的下落与酒店记录。':h.title)+'</p>').join('')+Object.values(q.mornings).map(h=>h.agenda?'<details><summary>DAY '+esc(h.day)+' 晨间 · '+esc(!x.deathConfirmed&&h.title==='调查片山死亡背后是否存在人为因素。'?'核对片山的下落与酒店记录。':h.title)+'</summary>'+CASE_NOTES.agendaHtml(h.agenda)+'</details>':'<p>DAY '+esc(h.day)+' 晨间 · '+esc(h.text)+'</p>').join('')+'</details>';head.after(panel);try{window.SUSP&&SUSP.ping(panel)}catch(e){}
  const add=(label,fn)=>{const b=document.createElement('button');b.className='rpg-action';b.textContent=label;b.onclick=fn;panel.querySelector('.daily-buttons').append(b)};
  if(x.report)add('最终报告复核',()=>['due','report'].includes(c.case1?.state)?CASE5.reportPage():CASE5.reviewPage());
  else if(c.firstDayComplete&&storyReady())add('调查酒店',storyQuest);
  if(c.firstDayComplete){add('查看调查手帐',()=>UI.go('reasoning'));add('查看东京地图',()=>UI.go('map'))}
  campaignSave()
 }
 return {active,read,sync,mount,brief}
})();
window.CASEQUEST=CASEQUEST;


const questMap=tokyoHome;
tokyoHome=function(){const r=questMap.apply(this,arguments);queueMicrotask(()=>{if(UI.current()==='map'||app.querySelector('[data-review],.rp-notice,#rp-submit'))CASEQUEST.brief()});return r};
/* 【车站彩票亭｜游戏内虚拟日元，刮刮乐即时揭晓、普通彩票次日开奖】 */
const STATION_LOTTERY=(()=>{
 const allowed=new Set(['ueno','tokyo','shinjuku','shibuya','ikebukuro','shinagawa','akihabara']);
 const RULES={scratch:{name:'駅前スクラッチ · 刮刮乐',price:200,max:10000,limit:5,weights:[[0,7400],[200,1600],[500,700],[1000,250],[3000,40],[10000,10]]},draw:{name:'東京ミニロト · 普通彩票',price:500,max:20000,limit:2,weights:[[0,8500],[500,800],[1000,450],[3000,180],[5000,60],[20000,10]]}};
 const escTxt=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const yen=n=>'¥'+Math.max(0,Number(n)||0).toLocaleString('ja-JP');
 function active(){return !!(campaign&&campaign.hp>0&&campaign.san>0&&campaign.cash>0)}
 function state(){if(!campaign)return null;const x=campaign.stationLottery??={version:1,nextId:1,tickets:[]};if(!Array.isArray(x.tickets))x.tickets=[];if(!Number.isSafeInteger(x.nextId)||x.nextId<1)x.nextId=1;return x}
 function random10000(){if(typeof crypto!=='undefined'&&crypto.getRandomValues){const a=new Uint32Array(1);const limit=4294967296-(4294967296%10000);do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%10000}return Math.floor(Math.random()*10000)}
 function drawPrize(type){let n=random10000();for(const [prize,weight] of RULES[type].weights){if(n<weight)return prize;n-=weight}return 0}
 function todayCount(kind){return state().tickets.filter(t=>t.kind===kind&&t.boughtDay===campaign.day).length}
 function canBuy(kind){const r=RULES[kind];if(!active()||!allowed.has(district?.id))return '请在开放的彩票亭购买。';if(todayCount(kind)>=r.limit)return '今天该种彩票已达到购买上限。';if(campaign.cash<=r.price)return '现金不足，或购票后将无法维持生存；本次不出售。';if(kind==='draw'&&campaign.day>=campaign.days)return '已经来到生存期限最后一天，无法购买次日开奖的彩票。';return ''}
 function buy(kind){const err=canBuy(kind);if(err){UI.modal({title:'无法购票',text:err});return}const r=RULES[kind],st=state();const ticket={id:st.nextId++,kind,price:r.price,prize:drawPrize(kind),boughtDay:campaign.day,drawDay:kind==='draw'?campaign.day+1:campaign.day,revealed:false,claimed:false,station:district.id};st.tickets.push(ticket);campaign.cash-=r.price;campaignSave();if(UI.update)UI.update();page();}
 function ready(t){return t.kind==='scratch'?t.revealed:campaign.day>=t.drawDay}
 function reveal(id){const t=state().tickets.find(t=>t.id===id);if(!t||t.kind!=='scratch'||t.revealed)return;t.revealed=true;delete t.scratchStrokes;campaignSave();page()}
 function claim(id){const t=state().tickets.find(t=>t.id===id);if(!t||t.claimed||!ready(t))return; t.claimed=true;if(t.prize>0)campaign.cash+=t.prize;campaignSave();if(UI.update)UI.update();page()}
 function ticketHtml(t){
  const revealReady=ready(t),pending=t.kind==='draw'&&!revealReady;
  const result=revealReady?(t.prize>0?'🎉 中奖 '+yen(t.prize):'未中奖'):(pending?'🔒 DAY '+t.drawDay+' 开奖':'🎟 奖金尚在银色涂层下');
  const scratch=t.kind==='scratch'&&!t.revealed;
  const act=t.claimed?'<span>已结算</span>':pending?'<span>等待次日开奖</span>':scratch?'':`<button class="rpg-action" data-lottery-claim="${t.id}">${t.prize>0?'💴 领取奖金':'确认开奖结果'}</button>`;
  const cells=(t.prize>0?[t.prize,t.prize,t.prize]:[200,500,1000]).map(n=>`<div class="lottery-scratch-cell"><small>LUCKY</small><strong>${yen(n)}</strong></div>`).join('');
  const scratching=scratch?`<div class="lottery-card-scratch"><div class="lottery-scratch-caption">🎫 刮出三个相同的金额即可中奖 · 手指 / 鼠标擦除涂层</div><div class="lottery-scratch-stage"><div class="lottery-scratch-under">${cells}</div><canvas class="lottery-scratch-canvas" data-scratch-id="${t.id}" width="520" height="180" aria-label="用鼠标或触屏刮开彩票银色涂层"></canvas></div><div class="lottery-scratch-status" id="scratch-status-${t.id}" role="status">按住并来回刮擦，刮开约一半后揭晓。进度会保存。</div></div>`:'';
  const reward=revealReady&&t.kind==='scratch'&&!t.claimed?`<div class="lottery-win">${t.prize>0?'<div>🎉 三个金额相同！</div><strong>'+yen(t.prize)+'</strong><div>请点击领取奖金，奖金才会加入钱包。</div>':'<div>三个金额不同，本张未中奖。</div>'}</div>`:'';
  return `<div class="rpg-panel" style="margin:.5rem 0;padding:12px"><b>#${t.id}　${t.kind==='scratch'?'🎫 刮刮乐':'🎟 普通彩票'}</b><p>DAY ${t.boughtDay} 购入 · ${escTxt(byId[t.station]?.jp||'车站')} · ${yen(t.price)}</p>${scratching}${reward}${!scratch?`<p><strong>${result}</strong></p>`:''}${act}</div>`
 }
 function mountScratchers(){
  app.querySelectorAll('canvas[data-scratch-id]').forEach(canvas=>{
   const id=Number(canvas.dataset.scratchId),t=state().tickets.find(x=>x.id===id);
   if(!t||t.revealed)return;
   const ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height;
   const coating=()=>{
    ctx.globalCompositeOperation='source-over';
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#8c949c');bg.addColorStop(.24,'#dbe0df');bg.addColorStop(.49,'#979da9');bg.addColorStop(.75,'#e0e4e4');bg.addColorStop(1,'#78808b');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgba(255,255,255,.20)';for(let x=-h;x<w+h;x+=23){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.lineWidth=2;ctx.strokeStyle='rgba(255,255,255,.16)';ctx.stroke()}
    ctx.textAlign='center';ctx.fillStyle='#2f3745';ctx.font='bold 28px sans-serif';ctx.fillText('SCRATCH  ✦  刮开涂层',w/2,80);
    ctx.font='bold 16px sans-serif';ctx.fillText('✦  ¥  ✦  幸运金额  ✦  ¥  ✦',w/2,115)
   };
   const erase=(pts)=>{
    if(!pts.length)return;ctx.save();ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='rgba(0,0,0,1)';ctx.fillStyle='rgba(0,0,0,1)';ctx.lineWidth=44;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);if(pts.length===1){ctx.arc(pts[0][0],pts[0][1],22,0,Math.PI*2);ctx.fill()}else{for(const [x,y] of pts.slice(1))ctx.lineTo(x,y);ctx.stroke()}ctx.restore()
   };
   coating();if(Array.isArray(t.scratchStrokes))t.scratchStrokes.forEach(erase);
   let current=[],pointer=null,done=false;
   const location=(ev)=>{const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(w,(ev.clientX-r.left)*w/r.width)),Math.max(0,Math.min(h,(ev.clientY-r.top)*h/r.height))]};
   const fraction=()=>{const data=ctx.getImageData(0,0,w,h).data;let erased=0,total=0;for(let y=4;y<h;y+=8)for(let x=4;x<w;x+=8){total++;if(data[(y*w+x)*4+3]<100)erased++}return erased/total};
   const status=app.querySelector('#scratch-status-'+id);
   const check=()=>{if(done)return;const pct=fraction();if(status)status.textContent=`已刮开 ${Math.round(pct*100)}% · ${pct>=.53?'正在核对金额……':'继续刮擦，奖金仍在下面'}`;if(pct>=.53){done=true;reveal(id)}};
   if(fraction()>=.53){reveal(id);return}
   canvas.addEventListener('pointerdown',ev=>{if(done)return;ev.preventDefault();pointer=ev.pointerId;canvas.setPointerCapture(pointer);current=[location(ev)];erase(current)});
   canvas.addEventListener('pointermove',ev=>{if(pointer!==ev.pointerId||done)return;ev.preventDefault();const pt=location(ev),last=current[current.length-1];if(Math.hypot(pt[0]-last[0],pt[1]-last[1])<2)return;erase([last,pt]);if(current.length<1300)current.push(pt)});
   const finish=ev=>{if(pointer!==ev.pointerId||done)return;ev.preventDefault();pointer=null;if(current.length){t.scratchStrokes??=[];t.scratchStrokes.push(current);if(t.scratchStrokes.length>50)t.scratchStrokes=t.scratchStrokes.slice(-50);campaignSave();current=[]}check()};
   canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);canvas.addEventListener('lostpointercapture',()=>{if(pointer!==null){pointer=null;if(current.length){t.scratchStrokes??=[];t.scratchStrokes.push(current);campaignSave();current=[]}check()}})
  });
 }

 function page(){if(!campaign||!district||!allowed.has(district.id))return;const st=state(),list=[...st.tickets].reverse();const scratchCount=todayCount('scratch'),drawCount=todayCount('draw');UI.page('station-lottery','🎟 駅前宝くじ売場','STATION LOTTERY / 游戏内虚拟货币',`<section class="rpg-panel"><h2>🚉 ${escTxt(district.jp)}站前彩票亭</h2><p>钱包 ${yen(campaign.cash)}　·　DAY ${campaign.day}/${campaign.days}</p><p>可以用游戏内日元碰碰运气。彩票与调查没有必然关系，也没有现实现金兑换。</p><div class="rpg-list"><button class="rpg-action primary" id="lottery-buy-scratch" ${canBuy('scratch')?'disabled':''}>🪙 刮刮乐 ${yen(200)} / 张 · 今日 ${scratchCount}/5</button><button class="rpg-action primary" id="lottery-buy-draw" ${canBuy('draw')?'disabled':''}>🎟 普通彩票 ${yen(500)} / 注 · 今日 ${drawCount}/2</button></div><p class="survival-tip">刮刮乐最高奖金 ¥10,000，购买后按住鼠标或用手指刮开银色涂层，刮出三个相同金额即可中奖；普通彩票最高奖金 ¥20,000，在下一游戏日开奖，需到任意开放的彩票亭核对并领取。购买不消耗额外行动点，但跨站移动仍遵守原有规则。</p><details><summary>查看中奖概率与购买规则</summary><p>刮刮乐：未中奖 74%；¥200 16%；¥500 7%；¥1,000 2.5%；¥3,000 0.4%；¥10,000 0.1%。</p><p>普通彩票：未中奖 85%；¥500 8%；¥1,000 4.5%；¥3,000 1.8%；¥5,000 0.6%；¥20,000 0.1%。</p><p>每游戏日最多购买刮刮乐 5 张、普通彩票 2 注；奖金由购买时生成并保存，刷新页面不会改变开奖结果。彩票总体期望回报低于购票成本。</p></details></section><section class="rpg-panel"><h2>我的彩票（${list.length}）</h2>${list.length?list.map(ticketHtml).join(''):'<p>还没有购买彩票。</p>'}</section>`);
  const back=app.querySelector('#et-back');if(back)back.onclick=()=>renderDistrict();const b1=app.querySelector('#lottery-buy-scratch'),b2=app.querySelector('#lottery-buy-draw');if(b1)b1.onclick=()=>buy('scratch');if(b2)b2.onclick=()=>buy('draw');mountScratchers();app.querySelectorAll('[data-lottery-claim]').forEach(b=>b.onclick=()=>claim(Number(b.dataset.lotteryClaim)));
 }
 function mount(){if(!district||!allowed.has(district.id))return;const world=document.getElementById('district-world');if(!world)return;const booth=document.createElement('button');booth.type='button';booth.className='street-hot station-lottery-pin';const lp=window.STATION_ART?STATION_ART.lotteryAt(district.id):[82,84];booth.style.cssText='left:'+lp[0]+'%;top:'+lp[1]+'%;z-index:6';booth.setAttribute('aria-label','进入站前彩票亭');booth.innerHTML='<b aria-hidden="true">🎟</b><small>宝くじ売場<br>彩票亭</small>';booth.onclick=page;world.appendChild(booth);
  const chat=document.getElementById('district-chat');if(chat){const b=document.createElement('button');b.type='button';b.className='rpg-action';b.textContent='🎟 站前彩票亭 · 刮刮乐 / 彩票';b.onclick=page;chat.appendChild(b)}
  const list=app.querySelector('.district-spots');if(list){const b=document.createElement('button');b.type='button';b.className='rpg-action';b.textContent='🎟 宝くじ売場 · 站前彩票亭';b.onclick=page;list.appendChild(b)}
 }
 return {mount,open:page,allowed,RULES};
})();
const lotteryBaseRenderDistrict=renderDistrict;
renderDistrict=function(){lotteryBaseRenderDistrict.apply(this,arguments);STATION_LOTTERY.mount()};
window.STATION_LOTTERY=STATION_LOTTERY;
window.enterDistrict=enterDistrict;

 /* ==== 便捷打工入口：恢复大地图与街区可见的工作台入口 ==== */
 function mountWorkAccess(){ /* v38：只留一个入口，浮在地图左下角（东京地图包一层 .et-map-wrap；街区直接放进 #district-world，排在「A：…」提示上面） */
   if(!campaign||!campaign.firstDayComplete||campaign.day<2)return;
   const shell=app&&app.querySelector('.rpg-shell');if(!shell)return;
   const host=shell.querySelector('#map-host'),world=shell.querySelector('#district-world');
   let box=null;
   if(host){box=host.parentElement&&host.parentElement.classList.contains('et-map-wrap')?host.parentElement:null;if(!box){box=document.createElement('div');box.className='et-map-wrap';host.parentNode.insertBefore(box,host);box.appendChild(host)}}
   else if(world)box=world;
   if(!box||box.querySelector('#et-work-access'))return;
   const panel=document.createElement('div');
   panel.id='et-work-access';panel.className='et-work-float'+(host?'':' on-street');
   panel.innerHTML='<button type="button" class="survival-btn" id="et-work-go" title="便利店收银、快速打工与仓库分拣">'+(host?'🏪 便利店打工':'🏪 打工')+'</button>';
   panel.addEventListener('click',e=>e.stopPropagation()); /* 不让街区把这次点击当成「走过去」 */
   box.appendChild(panel);
   panel.querySelector('#et-work-go').onclick=()=>{
     if(!campaign||!campaign.firstDayComplete||campaign.day<2)return;
     if((campaign.actions||0)<=0){
       if(typeof UI!=='undefined'&&UI.modal)UI.modal({title:'今天的行动已用完',text:'明天可以再来打工。'});
       else alert('今天的行动已用完，明天可以再来打工。');
       return;
     }
     workShift();
   };
 }
 const etWorkMap=tokyoHome;
 tokyoHome=function(){const result=etWorkMap.apply(this,arguments);mountWorkAccess();return result};
 const etWorkDistrict=renderDistrict;
 renderDistrict=function(){const result=etWorkDistrict.apply(this,arguments);mountWorkAccess();return result};
 const etWorkStatus=survivalStatus;
 survivalStatus=function(){const result=etWorkStatus.apply(this,arguments);mountWorkAccess();return result};
 const etWorkCSS=document.createElement('style');
 etWorkCSS.textContent='#et-work-access{border:1px solid rgba(224,186,96,.42);margin:10px 0;position:relative;z-index:2} .et-work-row{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap} .et-work-row p{margin:3px 0 0;font-size:12px;opacity:.82} .et-work-row button{white-space:normal;min-height:44px}';
 document.head.appendChild(etWorkCSS);
/* v36.2：透明雨伞共享计划 —— DAY 2 起第一次出门时发生一次（其他早上的剧情、期限检查先走；只有真的停在地图上才触发） */
const tutHome=tokyoHome;tokyoHome=function(){const r=tutHome.apply(this,arguments);if(window.INV_TUT&&UI.current()==='map'){if(!INV_TUT.maybeStart())INV_TUT.mapBox()}if(window.FLOOD&&UI.current()==='map')FLOOD.onMap();return r};
/* ===================================================================
   v42：线索污染（TAINT）· 净化（PURGE）· 驱魔人（EXO）· 即死事件（PERIL）
   数值在 config/game.json 的 peril 部分。
   =================================================================== */
const PCFG=()=>Object.assign({taint:{tiers:[[70,.15],[50,.3],[30,.5],[15,.75]],spreadEvery:2},
 purify:{temple:{n:5,price:1000},teller:{n:3,price:800},exorcist:{n:3,price:800}},
 exorcist:{rotation:[['shinjuku','tokyo'],['ikebukuro','ueno']]},event:{chance:.5,minDay:2}},GAME_CONFIG.peril||{});
const pjz=(jp,zh)=>(typeof langMode==='function'&&langMode()==='learning')?'<p lang="ja" class="pl-jp">「'+esc(jp)+'」</p>':'<p lang="ja" class="pl-jp">「'+esc(jp)+'」</p><p class="pl-zh">（'+esc(zh)+'）</p>';

/* ---------- 线索污染 ---------- */
const TAINT=(function(){
 const inv=()=>campaign&&campaign.investigation;
 const name=id=>{try{return (INV.clues().find(c=>c.id===id)||{}).name||id}catch(e){return id}};
 function list(){const s=inv();if(!s||!s.clues)return [];return Object.entries(s.clues).sort((a,b)=>(a[1].n||0)-(b[1].n||0))}
 const is=id=>{const s=inv();return !!(s&&s.clues&&s.clues[id]&&s.clues[id].taint)};
 const ids=()=>list().filter(([,r])=>r.taint).map(([k])=>k);
 function chance(){return V51.chance().total}
 function mark(id){const s=inv();const r=s&&s.clues[id];if(!r||r.taint||r.v51Protected||V51.sanctuary())return false;if(!ids().length){campaign.taint??={};campaign.taint.last=campaign.day}r.taint=campaign.day;return true}
 function neighbor(id){const L=list(),i=L.findIndex(([k])=>k===id);const c=[L[i-1],L[i+1]].filter(x=>x&&!x[1].taint&&!x[1].v51Protected);return c.length?c[Math.floor(Math.random()*c.length)][0]:null}
 function onNew(id){if(!campaign||!inv())return;if(V51.sanctuary()){inv().clues[id].v51Protected=true;return}if(Math.random()>=chance())return;
  const out=[];if(mark(id))out.push(id);const nb=neighbor(id);if(nb&&mark(nb))out.push(nb);
  if(out.length)setTimeout(()=>{try{UI.toast('🩸 线索「'+out.map(name).join('」「')+'」被污染了。污染的线索无法合成。')}catch(e){}},2600)}
 /* 每隔 spreadEvery 天：每条污染线索随机污染一条相邻的线索 */
 function tick(){if(!campaign||!inv()||V51.sanctuary())return;const cur=ids();if(!cur.length)return;campaign.taint??={last:campaign.day};const t=campaign.taint;
  if(campaign.day-(t.last||campaign.day)<(PCFG().taint.spreadEvery||2))return;t.last=campaign.day;
  const out=[];for(const id of cur){const nb=neighbor(id);if(nb&&mark(nb))out.push(nb)}
  try{campaignSave()}catch(e){}
  if(out.length)UI.modal({title:'🩸 手帐里的黑色在扩散',html:'<p>翻开调查手帐，你发现墨迹一样的黑色从被污染的那几页渗了出来。</p><p>新被污染：「'+out.map(id=>esc(name(id))).join('」「')+'」</p><p class="rpg-tiny">污染的线索无法合成，而且每隔两天会继续污染相邻的线索。浅草寺（一次 5 条）、街头占卜师和驱魔人（一次 3 条）可以净化。</p>',buttons:[{label:'合上手帐'}]})}
 function clean(list){const s=inv();let n=0;for(const id of list){const r=s&&s.clues[id];if(r&&r.taint){delete r.taint;n++}}return n}
 /* 被污染的文字：一部分字变成墨块 */
 function garble(text,id){let h=7;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))|0;const G='█▓■水眼█▒';
  return [...String(text||'')].map((ch,i)=>{if(/[\s，。、「」：；！？（）…—\-·,.!?]/.test(ch))return ch;h=(h*1103515245+12345)|0;return ((h>>>8)%100)<46?G[(h>>>4)%G.length]:ch}).join('')}
 return {is,ids,count:()=>ids().length,chance,onNew,tick,clean,garble,mark,name};
})();
window.TAINT=TAINT;

/* ---------- 净化 ---------- */
const PURGE=(function(){
 const SRC={
  temple:{title:'🔥 浅草寺 · 护摩净化',intro:'本堂旁边的护摩堂里，僧侣把你的手帐页一张张举到火前。',done:'火焰「啪」地响了一声。纸上的黑色像水一样退了下去，字迹重新露了出来。',jp:['お預かりします。','我替你收下了。']},
  teller:{title:'🔮 街头占卜师 · 净化',intro:'她把手帐摊在绒布上，摇了三下铜铃，用一根红线在页边绕了一圈。',done:'红线收紧，黑色被一点点抽了出来，缠在线上。她把线剪下来，丢进了水沟。',jp:['少しだけなら、ほどけるよ。','一点点的话，我能解开。']},
  exorcist:{title:'🧿 驱魔人 · 祓除',intro:'他往手帐上撒了一把粗盐，低声念了一段你听不懂的经文。',done:'盐粒变成了灰黑色。他把盐扫进一个小纸袋里，封好口，塞进怀里。',jp:['三つまでだ。それ以上は、あんたが持たない。','最多三条。再多，你自己撑不住。']}};
 function open(kind,back){if(!campaign)return;const S=SRC[kind],C=PCFG().purify[kind],list=TAINT.ids();
  if(!list.length){UI.modal({title:S.title,html:'<p>'+(kind==='temple'?'僧侣翻了翻你的手帐，摇摇头：':'对方翻了翻你的手帐：')+'</p>'+pjz('きれいなもんだ。','很干净。')+'<p class="rpg-tiny">现在没有被污染的线索。</p>',buttons:[{label:'离开',fn:back}]});return}
  const sel=new Set(list.slice(0,C.n));
  const row=id=>'<label class="pg-row"><input type="checkbox" data-pg="'+esc(id)+'" '+(sel.has(id)?'checked':'')+'> <span>'+esc(TAINT.name(id))+'</span></label>';
  UI.modal({title:S.title,html:'<p>'+S.intro+'</p>'+pjz(S.jp[0],S.jp[1])+'<p>一次最多净化 <b>'+C.n+'</b> 条 · <b>¥'+C.price.toLocaleString('ja-JP')+'</b>（少选也收这个价）。你现在有 '+list.length+' 条被污染的线索。</p><div class="pg-list">'+list.map(row).join('')+'</div><p class="rpg-tiny" id="pg-n">已选 '+sel.size+' / '+C.n+'</p>',
   buttons:[{label:'🕯 净化选中的线索（¥'+C.price.toLocaleString('ja-JP')+'）',primary:true,fn:()=>pay(kind,[...sel],back)},{label:'算了',fn:back}]});
  document.querySelectorAll('.et-modal-card [data-pg]').forEach(b=>b.onchange=()=>{const id=b.dataset.pg;if(b.checked){if(sel.size>=C.n){b.checked=false;UI.toast('一次最多 '+C.n+' 条。');return}sel.add(id)}else sel.delete(id);const n=document.getElementById('pg-n');if(n)n.textContent='已选 '+sel.size+' / '+C.n})}
 function pay(kind,list,back){const S=SRC[kind],C=PCFG().purify[kind];
  if(!list.length){UI.toast('没有选择线索。');return open(kind,back)}
  if(campaign.cash<C.price){UI.modal({title:S.title,html:'<p>钱不够。需要 ¥'+C.price.toLocaleString('ja-JP')+'。</p>',buttons:[{label:'离开',fn:back}]});return}
  GS.change({cash:-C.price});const n=TAINT.clean(list);try{campaignSave()}catch(e){}try{if(window.AUDIO)AUDIO.sfx('clue')}catch(e){}
  UI.modal({title:S.title,html:'<p>'+S.done+'</p><p>净化了 <b>'+n+'</b> 条线索：「'+list.map(id=>esc(TAINT.name(id))).join('」「')+'」</p>'+(TAINT.count()?'<p class="rpg-tiny">还剩 '+TAINT.count()+' 条被污染。</p>':'<p class="rpg-tiny">手帐干净了。</p>'),buttons:[{label:'收好手帐',fn:back}]})}
 return {open};
})();
window.PURGE=PURGE;

/* ---------- 驱魔人（新宿 · 东京 / 池袋 · 上野 轮流） ---------- */
const EXO=(function(){
 const at=id=>{if(!campaign)return false;const R=PCFG().exorcist.rotation;return (R[campaign.day%R.length]||[]).includes(id)};
 const where=()=>{const R=PCFG().exorcist.rotation;const n={shinjuku:'新宿',tokyo:'东京',ikebukuro:'池袋',ueno:'上野'};return (R[campaign.day%R.length]||[]).map(x=>n[x]||x).join(' · ')};
 function open(){if(!campaign)return;const met=campaign.exoMet;campaign.exoMet=true;try{campaignSave()}catch(e){}
  const offer=window.PERIL&&PERIL.offer('hollow');
  UI.modal({title:'🧿 街头驱魔人',html:(met?'<p>穿旧袈裟、戴墨镜的男人还坐在折叠凳上。脚边摆着一碟盐和一串念珠。</p>':'<p>车站出口的柱子旁，一个穿着褪色袈裟、戴墨镜的男人坐在折叠凳上。纸牌上用毛笔写着：「祓い　承ります」（承接驱邪）。</p><p>他没抬头，就先开口了。</p>')+
   pjz('あんた、手帳が濁ってるな。','你的手帐，浑了。')+'<p class="rpg-tiny">被污染的线索：'+TAINT.count()+' 条 · 他每天出现在两个大站（今天：'+where()+'）。</p>',
   buttons:[{label:'🧿 祓除污染（¥'+PCFG().purify.exorcist.price+' / 最多 '+PCFG().purify.exorcist.n+' 条）',primary:true,fn:()=>PURGE.open('exorcist',open)},
    {label:'问问「污染」是什么',fn:()=>UI.modal({title:'🧿 街头驱魔人',html:pjz('見すぎたんだよ。見たものは、こっちを見返す。','你看得太多了。被你看过的东西，也会回头看你。')+'<p>“理智掉下去的时候，你记下来的东西就会被它们碰到。碰过的那一页，跟旁边的页也会慢慢染上。”</p><p>“染了的线索，你拿去拼也拼不出东西。两天不管，它就往旁边爬。”</p><p class="rpg-tiny">SAN 越低，新线索越容易被污染。</p>',buttons:[{label:'回去',fn:open}]})},
    ...(offer?[{label:'🖐 “……要不要，一次全部祓掉？”',fn:()=>PERIL.run('hollow')}]:[]),
    {label:'离开'}]})}
 return {at,open,where};
})();
window.EXO=EXO;

/* ---------- 即死事件 ---------- */
const PERIL=(function(){
 const CPKEY='et-peril-checkpoint-v1';
 const st=()=>{campaign.peril??={seen:{},day:0};campaign.peril.seen??={};return campaign.peril};
 const cs=()=>campaign&&campaign.case1;
 const open=()=>{const s=cs();return !!(s&&s.state==='active')};
 const save=()=>{try{campaignSave()}catch(e){}};
 const D=(t,o)=>Object.assign({text:t},o||{});
 /* 每个事件：where（场所）、cond、标题、正文、选项（death=死亡结局 id，否则 san/hp 与结果文字） */
 const EV={
  roomservice:{where:'hotel',place:'room206',min:2,title:'🚪 深夜的敲门声',html:()=>'<p>有人敲门。三下，停一下，又三下。</p>'+pjz('ルームサービスです。ご注文のお品を、お持ちしました。','客房服务。您点的东西，送来了。')+'<p>你没有点任何东西。</p>',
   choices:[['开门看看',{death:'death_p_roomservice'}],['隔着门说「頼んでいません」（我没有点）',D('门外安静了很久。然后，推车的轮子声慢慢往 207 的方向远去了。',{san:-5})],['凑到猫眼上看一眼',D('走廊里站着一排穿酒店制服的人。他们没有脸，全都朝着你的门。',{san:-18})]]},
  b2:{where:'hotel',place:'corridor',min:3,title:'🛗 电梯',html:()=>'<p>你按了 1 楼。电梯却一直往下走。显示屏跳过了 1，变成 B1……B2。</p><p>门开了。外面是黑的，能听见水声。</p>'+pjz('地下二階です。お降りの方は、どうぞ。','地下二层到了。要下的客人，请。'),
   choices:[['走出去看看',{death:'death_p_b2'}],['一直按「閉」',D('门停了一下，慢慢合上。电梯晃了晃，回到了 1 楼。门外是前台熟悉的灯光。',{san:-10})],['按紧急呼叫按钮',D('对讲机里沙沙响了很久，有人小声说：「……当館に、地下はございません。」（本馆没有地下层。）',{san:-14})]]},
  mirror:{where:'hotel',place:'room206',min:2,cond:()=>campaign.san<=40,title:'🪞 洗手间的镜子',html:()=>'<p>你洗了把脸，抬起头。</p><p>镜子里的你，比你慢了半拍才眨眼。它的手搭在洗手台边，好像在等你先伸手。</p>',
   choices:[['伸手碰碰镜面',{death:'death_p_mirror'}],['用毛巾把镜子盖住',D('毛巾底下，传来指甲轻轻刮玻璃的声音。过了一会儿，停了。',{san:-5})],['盯着它，等它先动',D('你们对视了很久。最后，它先笑了。你没有笑。',{san:-20})]]},
  canal:{where:['shinagawa','kitashinagawa'],min:3,title:'🌊 运河边',html:()=>'<p>天快黑了。运河的水比平时高。</p><p>水里有人在喊你的名字——用的是你护照上的那种写法。</p>'+pjz('……さん。こっちです。','……先生／女士。这边。'),
   choices:[['走到栏杆边，应一声「はい」',{death:'death_p_name'}],['捂住耳朵，快步往车站走',D('喊声跟了你两个路口，在车站的灯光下停住了。',{san:-10})],['回头看喊你的方向',D('水面上浮着一张脸。是你的脸。它张着嘴，还在喊。',{san:-16,hp:-10})]]},
  pond:{where:['ueno'],min:3,title:'🌙 不忍池',html:()=>'<p>池边的路灯下，你的影子有两道。</p><p>另一道影子慢慢站了起来，朝池子中间招手。</p>',
   choices:[['跟着影子往池边走',{death:'death_p_shadow'}],['站到路灯正下面',D('灯光从头顶直直照下来，两道影子都缩成了一小团。等你再走出来，只剩下一道了。',{san:-6})],['用脚踩住第二道影子',D('你踩到了什么软的东西。它叫了一声，从你脚下钻进了池子里。你的脚踝上留下一圈湿冷的指印。',{san:-15,hp:-15})]]},
  crossing:{where:['shibuya'],min:2,title:'🚦 涩谷十字路口',html:()=>'<p>绿灯亮了。</p><p>几千个人同时停下脚步，同时转过头来看你。整个路口安静得只剩下行人信号的提示音。</p>',
   choices:[['逆着人群，跑回车站',{death:'death_p_crossing'}],['也停下来，低头等信号灯再变一次',D('信号灯变红，又变绿。人群像什么都没发生一样，重新走了起来。',{san:-10})],['照常往前走过去',D('你从他们中间穿过去。每经过一个人，那个人就在你耳边说一句「おかえり」（欢迎回来）。',{san:-18})]]},
  train:{where:['shinjuku'],min:2,title:'🚃 没有站名的电车',html:()=>'<p>站台上停着一列电车。车厢全空，车头的行先表示是一片空白。</p><p>车门在你面前打开了。</p>'+pjz('この電車は、終点まで止まりません。','本次列车，中途不停，直达终点。'),
   choices:[['上车，坐一站看看',{death:'death_p_train'}],['退后一步，等下一班',D('车门关上，电车无声地开走了。你看了一眼时刻表，那个时间没有车。',{san:-8})],['举起手机拍一张',D('照片里，车厢坐满了人。每个人都朝着镜头。',{san:-16})]]},
  exit:{where:['ikebukuro'],min:2,title:'🚇 池袋 · 地下通道',html:()=>'<p>出口指示牌上写着：「13番出口 →」。</p><p>你记得池袋站没有 13 号出口。通道很长，墙上的瓷砖越往里越旧。</p>',
   choices:[['顺着指示走到底',{death:'death_p_exit'}],['原路返回，找有人的地方',D('你走了很久才回到检票口。手机上的时间，比你进去的时候早了十分钟。',{san:-10})],['在墙上画个记号再往前走',D('走了一分钟，你看见了自己画的记号。又走了一分钟，又看见一个。第三个记号，不是你画的。你掉头跑了回来。',{san:-15,hp:-8})]]},
  sumida:{where:'temple',min:3,title:'⛩ 本堂背后',html:()=>'<p>本堂背后的阴影里，一个僧人朝你招手。他的袈裟下摆是湿的。</p>'+pjz('本当の観音さまを、お見せしましょう。川の底に、おられます。','让我带你去看真正的观音吧。她在河底。'),
   choices:[['跟他去隅田川边',{death:'death_p_sumida'}],['双手合十，说「結構です」（不用了）',D('他保持着招手的姿势，一动不动。等你走到香炉前再回头，那里只剩下一摊水。',{san:-4})],['去告诉本堂里的僧侣',D('僧侣听完，沉默了一下：「……当寺に、そのような者はおりません。」（本寺没有这样的人。）',{san:-10})]]},
  scissors:{where:'teller',cond:()=>campaign.san<35,title:'✂ 红线剪刀',html:()=>'<p>她从桌下拿出一把缠满红线的剪刀，眼睛没有看你，看的是你身后。</p>'+pjz('あなたの運に、何か絡みついてる。……切ってあげようか。五千円。','你的运里，缠着别的东西。……我帮你剪掉吧。五千日元。'),
   choices:[['付钱，让她剪（¥5000）',{death:'death_p_scissors',cash:5000}],['不用了',D('她把剪刀收回桌下。“下次再来，可能就剪不干净了。”')]]},
  hollow:{where:'exorcist',cond:()=>TAINT.count()>=4||campaign.san<30,title:'🧿 全部祓掉',html:()=>pjz('全部、祓ってやろうか。お代はいらない。……ただし、残るものは保証しない。','要不要一次全部祓掉？不收钱。……不过，剩下什么，我可不保证。'),
   choices:[['好，全部祓掉',{death:'death_p_hollow'}],['不用了，一次三条就好',D('他点点头，像是早就知道你会这么说。')]]}
 };
 const place=w=>w;
 function eligible(where,id){if(!campaign||!open())return [];const p=st();if(p.dead)return [];
  return Object.entries(EV).filter(([k,e])=>!p.seen[k]&&(Array.isArray(e.where)?e.where.includes(id||where):e.where===where)&&(!e.place||e.place===id)&&campaign.day>=(e.min||0)&&(!e.cond||e.cond()))}
 /* 随机遭遇：酒店夜里 / 车站街区 / 浅草寺，每天最多一次 */
 function maybe(where,id,force){if(!campaign||!open())return false;const p=st();if(p.day===campaign.day)return false;if(campaign.day<(PCFG().event.minDay||2))return false;
  const L=eligible(where,id);if(!L.length||(!force&&Math.random()>=PCFG().event.chance))return false;
  const [k]=L[Math.floor(Math.random()*L.length)];p.day=campaign.day;save();setTimeout(()=>run(k),900);return true}
 const offer=k=>{const e=EV[k];return !!(campaign&&open()&&!st().seen[k]&&(!e.cond||e.cond()))};
 /* v66：即死选项不再排在第一个——弹窗默认聚焦第一个按钮，玩家在走廊里连按 A / 回车、读档后的快速点击，都会误选到它。安全选项在前，并且弹出时不聚焦任何按钮 */
 function run(k){const e=EV[k];if(!e||!campaign)return;
  const ordered=[...e.choices.filter(c=>!c[1].death),...e.choices.filter(c=>c[1].death)];
  const options=ordered.map(([t,o])=>({t,fn:()=>choose(k,o)})),altered=V51.whisper(options);UI.modal({title:e.title,html:e.html()+(altered?.[0]?.note?'<p>'+esc(altered[0].note)+'</p>':''),buttons:(altered||options).map(c=>({label:DISTORT.text(c.t,true),fn:c.fn}))});
  try{const a=document.activeElement;if(a&&a.closest&&a.closest('.et-modal-back'))a.blur()}catch(_){}}
 function choose(k,o){const p=st();p.seen[k]=campaign.day;save();
  if(o.death){if(o.cash&&campaign.cash<o.cash){UI.toast('钱不够。');p.seen[k]=0;return}if(o.cash)GS.change({cash:-o.cash});return die(o.death)}
  const fx=GS.change({san:o.san||0,hp:o.hp||0},'怪异事件');if(GS.dead())return;
  UI.modal({title:EV[k].title,html:'<p>'+esc(o.text)+'</p>'+(fx?'<p class="rpg-tiny">'+esc(fx)+'</p>':''),buttons:[{label:'继续'}]})}
 /* —— 存档点：每天第一次打开地图或进酒店 —— */
 function checkpoint(force=false){if(!campaign||(!force&&!open()))return;const p=st();if(p.cpDay===campaign.day&&cp()?.data?.v51?.run===campaign.v51?.run)return;p.cpDay=campaign.day;save();try{localStorage.setItem(CPKEY,JSON.stringify({day:campaign.day,data:campaign}))}catch(e){}}
 function cp(){try{return JSON.parse(localStorage.getItem(CPKEY)||'null')}catch(e){return null}}
 const IDS=()=>Object.values(EV).flatMap(e=>e.choices.map(c=>c[1].death).filter(Boolean)).concat(DAHLIA.deathIds);
 function die(id){const s=cs();s.state='dead';s.endingId=id;campaign.perilDeath={id,day:campaign.day};st().dead=id;save();
  try{if(window.H18&&H18.active())H18.stop()}catch(e){}try{if(window.DM)DM.close()}catch(e){}try{UI.modal&&document.querySelector('.et-modal-back')?.remove()}catch(e){}
  (DAHLIA.deathIds.includes(id)?DEATHS.play:play)(id,()=>endScreen())}
 function endScreen(){const s=cs(),c=cp();DEATHS.endScreen(s.endingId,{canRewind:!!c,rewindLabel:c?'回到第 '+c.day+' 天早上':'',rewindTitle:c?'回到第 '+c.day+' 天早上？':'',rewindText:'回到这一天的早上。这一次，别再做同样的选择。',onRewind:restore})}
 function restore(){const c=cp();if(!c)return;const day=campaign.day;try{if(window.H18&&H18.active())H18.stop()}catch(e){}campaign=JSON.parse(JSON.stringify(c.data));V51.migrate();campaign.v51.whisperDay=day;campaignSave();tokyoHome()}
 function deadCheck(){const s=cs();if(s&&s.state==='dead'&&IDS().includes(s.endingId)){endScreen();return true}return false}

 /* ---------- 死亡过场（像素画布 + 字幕） ---------- */
 let raf=0;
 const P=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
 const C=()=>CINE._draw;
 function eyes(g,list,o){list.forEach(([x,y,s])=>{const h=s*o;if(h<.6)return;P(g,x-s,y-h/2,s*2,h,'#e6dfc4');P(g,x-s*.3,y-h*.35,s*.6,h*.7,'#b3262a');P(g,x-s*.12,y-h*.2,s*.24,h*.4,'#020403')})}
 function figure(g,x,y,s,c,face){P(g,x-5*s,y-26*s,10*s,10*s,c);P(g,x-8*s,y-16*s,16*s,22*s,c);P(g,x-7*s,y+6*s,5*s,14*s,c);P(g,x+2*s,y+6*s,5*s,14*s,c);if(face)P(g,x-3*s,y-22*s,6*s,2*s,face)}
 function door(g,t,o){P(g,0,0,512,352,'#241f2a');P(g,0,250,512,102,'#3a2e28');const op=o.open||0;
  P(g,176,50,160,250,'#120e12');if(op>0){P(g,176,50,160,250,'#0b0d12');for(let i=0;i<5;i++){const x=200+i*28,sc=.9+i*.05;figure(g,x,268,sc*1.6,'#2a3442','#0b0d12')}if(o.eyes)eyes(g,[[214,215,5],[256,212,5],[298,215,5]],o.eyes)}
  P(g,176+op*150,50,160-op*150,250,'#5a4636');P(g,180+op*150,54,152-op*150,242,'#6a5442');if(op<.9){P(g,310,170,8,8,'#c9a45e');P(g,252,110,10,10,'#1a1a1a');P(g,254,112,6,6,o.peep?'#b3262a':'#3a3a3a')}
  const lamp=o.flicker&&Math.sin(t/37)<.2?.2:1;P(g,0,0,512,352,'rgba(0,0,0,'+(.4-lamp*.2)+')')}
 function lift(g,t,o){P(g,0,0,512,352,'#6d6f73');P(g,20,20,472,312,'#8a8c90');const op=ease(o.open||0);
  P(g,96,40,320,280,'#000');if(op>0){for(let i=0;i<20;i++)P(g,96+((i*67)%320),280+Math.sin(t/300+i)*3,12,2,'rgba(80,120,130,.5)');if(o.eyes)eyes(g,[[180,170,8],[260,140,10],[340,190,7]],o.eyes)}
  P(g,96,40,160-op*150,280,'#a7a9ad');P(g,256+op*150,40,160-op*150,280,'#a7a9ad');P(g,255,40,2,280,'#6d6f73');
  P(g,212,4,88,30,'#111');g.fillStyle='#e04838';g.font='bold 22px DotGothic16, monospace';g.fillText(o.floor||'B2',236,28);
  for(let i=0;i<5;i++)P(g,440,120+i*28,22,18,i===4?'#e0b040':'#c8c8c8')}
 function mirror(g,t,o){P(g,0,0,512,352,'#d8dad6');for(let y=0;y<352;y+=24)for(let x=0;x<512;x+=24)P(g,x,y,23,23,'#e6e8e4');
  P(g,126,30,260,230,'#8a8c88');P(g,134,38,244,214,o.dark?'#0c1014':'#9fb0b6');
  const lag=o.lag||0,sx=256+Math.sin(t/900)*4*lag;figure(g,sx,240,3.2,o.dark?'#2c3236':'#3c4a50',o.smile?'#b3262a':null);
  if(o.hand){const k=ease(o.hand);P(g,240,150,30,40+k*120,'#c8a890');P(g,236,150+40+k*120,38,22,'#c8a890')}
  P(g,90,270,332,30,'#f2f2ee');P(g,90,300,332,52,'#c8cac6');if(o.crack)for(let i=0;i<12;i++){P(g,256+Math.cos(i)*i*12,140+Math.sin(i*2)*i*9,3,3,'#111')}}
 function water(g,t,o){const gr=g.createLinearGradient(0,0,0,352);gr.addColorStop(0,o.sky||'#0b1018');gr.addColorStop(1,'#03070b');g.fillStyle=gr;g.fillRect(0,0,512,352);
  const lv=o.level==null?190:o.level;if(o.rail)for(let x=0;x<512;x+=22){P(g,x,lv-46,4,40,'#5a5a56')}if(o.rail)P(g,0,lv-48,512,4,'#7a7a72');
  P(g,0,lv,512,352-lv,'rgba(6,18,26,.95)');for(let x=0;x<512;x+=6)P(g,x,lv+Math.sin(x/18+t/320)*2,4,1,'#4b7774');
  if(o.lamp){P(g,o.lamp,40,6,lv-40,'#222');P(g,o.lamp-14,34,34,10,'#333');const gl=g.createRadialGradient(o.lamp+3,60,4,o.lamp+3,60,160);gl.addColorStop(0,'rgba(240,220,160,.4)');gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.fillRect(0,0,512,352)}
  if(o.shadow){const k=ease(o.shadow);g.fillStyle='rgba(0,0,0,.75)';g.beginPath();g.ellipse(250+k*60,lv-6,26+k*10,6,0,0,7);g.fill();figure(g,250+k*80,lv-4,2.2,'rgba(5,5,8,.9)')}
  if(o.face){P(g,232,lv+18,48,56,'rgba(200,190,170,.55)');P(g,242,lv+36,8,4,'#111');P(g,262,lv+36,8,4,'#111');P(g,248,lv+54,16,8+Math.abs(Math.sin(t/200))*8,'#220')}
  if(o.hands)for(let i=0;i<o.hands;i++){const x=60+i*70,h=20+Math.sin(t/400+i)*10;P(g,x,lv-h,10,h+8,'rgba(200,190,170,.7)')}
  if(o.under){P(g,0,0,512,352,'rgba(3,12,20,.85)');for(let i=0;i<24;i++){const x=(i*71)%512,y=352-((t/6+i*40)%400);P(g,x,y,4,4,'rgba(160,200,200,.5)')}}
  if(o.eyes)eyes(g,[[80,lv+60,9],[200,lv+100,12],[330,lv+70,9],[440,lv+110,13]],o.eyes)}
 function crowd(g,t,o){P(g,0,0,512,352,'#1b1e26');P(g,0,0,512,90,'#262a36');for(let i=0;i<14;i++)P(g,i*40,10,30,70,i%3?'#3a3050':'#4a2a3a');
  P(g,0,90,512,262,'#2a2a2e');for(let i=0;i<10;i++)P(g,30+i*48,180,30,120,'rgba(220,220,220,.18)');
  P(g,30,96,14,24,'#111');P(g,32,100,10,8,o.red?'#e04838':'#3a3a3a');P(g,32,110,10,8,o.red?'#3a3a3a':'#40c070');
  const n=o.n||40;for(let i=0;i<n;i++){const x=(i*61)%500+6,y=130+((i*37)%200),s=.8+((i*13)%5)/10;figure(g,x,y,s*1.4,'#0e1014',o.eyes?'#e6dfc4':null)}
  if(o.car){const k=ease(o.car);P(g,-200+k*560,250,180,60,'#c8c8c0');P(g,-190+k*560,240,120,20,'#9aa');P(g,-200+k*560+160,262,20,14,'#ffe080')}
  if(o.white)P(g,0,0,512,352,'rgba(255,255,255,'+o.white+')')}
 function train(g,t,o){P(g,0,0,512,352,'#c9ccc6');P(g,0,0,512,40,'#9a9c98');for(let x=0;x<512;x+=128){P(g,x+10,60,108,90,o.dark?'#05070a':'#1c2a36');for(let i=0;i<5;i++)P(g,x+10+((t/3+i*40)%108),70+i*14,20,2,'rgba(255,255,255,.2)')}
  P(g,0,200,512,50,'#3a6a8a');P(g,0,190,512,12,'#2a4a6a');for(let x=20;x<512;x+=34)P(g,x,40,2,40,'#ddd');
  if(o.full)for(let i=0;i<9;i++)figure(g,40+i*54,226,1.7,'#1a1c20',o.eyes?'#e6dfc4':null);
  P(g,170,6,172,28,'#111');g.fillStyle='#ffb040';g.font='bold 16px DotGothic16, monospace';g.fillText(o.sign||'　　　　',186,26);
  if(o.dark)P(g,0,0,512,352,'rgba(0,0,0,'+o.dark+')')}
 function tunnel(g,t,o){P(g,0,0,512,352,'#1a1a18');const k=o.depth||0;
  for(let i=8;i>=0;i--){const s=1-i*.1,w=512*s,h=352*s,x=(512-w)/2,y=(352-h)/2;P(g,x,y,w,h,i%2?'#cfcab8':'#bdb7a2');P(g,x+w*.08,y+h*.08,w*.84,h*.84,i%2?'#bdb7a2':'#aaa48e')}
  P(g,236,156,40,40,'#050505');P(g,190,40,132,30,'#e8c040');g.fillStyle='#111';g.font='bold 15px DotGothic16, monospace';g.fillText('13番出口 →',204,61);
  if(k)P(g,0,0,512,352,'rgba(0,0,0,'+(.2+k*.6)+')');if(o.figure)figure(g,256,200,1.2+o.figure*2.5,'#050505',o.figure>.6?'#e6dfc4':null)}
 function shears(g,t,o){P(g,0,0,512,352,'#1a0f1a');P(g,60,220,392,132,'#2a1a3a');for(let i=0;i<8;i++){g.strokeStyle='#c02828';g.lineWidth=2;g.beginPath();g.moveTo(0,120+i*14);g.bezierCurveTo(160,80+i*20,340,180-i*10,512,130+i*12);g.stroke()}
  const k=ease(o.cut||0);g.save();g.translate(256,150);g.rotate(-.4);P(g,-80,-6,120,8,'#c8c8c8');g.rotate(.8*(1-k)+.05);P(g,-80,-2,120,8,'#a8a8a8');g.restore();P(g,250,144,12,12,'#8a6a2a');
  if(o.fade)P(g,0,0,512,352,'rgba(240,240,240,'+o.fade+')')}
 function hollow(g,t,o){P(g,0,0,512,352,'#0a0a0c');for(let i=0;i<60;i++)P(g,(i*83)%512,(i*47+t/10)%352,2,2,'rgba(220,220,220,.4)');
  const a=1-(o.fade||0);g.globalAlpha=Math.max(.05,a);figure(g,256,250,5,'#d8d4c8');g.globalAlpha=1;P(g,240,128,32,10,'#0a0a0c')}
 const L=(d,draw,cap)=>Object.assign({d,draw},cap);
 const SCRIPT={
  death_p_roomservice:[L(3000,(g,t)=>door(g,t,{}),{text:'你拧开了门锁。'}),L(3400,(g,t,k)=>door(g,t,{open:ease(k),flicker:true}),{jp:'お待たせいたしました。',zh:'让您久等了。',glitch:true}),L(3200,(g,t,k)=>door(g,t,{open:1,eyes:ease(k)}),{text:'推车上盖着银色的罩子。罩子下面，是你的行李箱。\n——还有你。'})],
  death_p_b2:[L(3000,(g,t,k)=>lift(g,t,{open:k}),{text:'你走出了电梯。脚下是水。'}),L(3400,(g,t,k)=>lift(g,t,{open:1,eyes:ease(k)}),{jp:'ご宿泊、ありがとうございます。',zh:'感谢您的入住。',glitch:true}),L(3000,(g,t,k)=>lift(g,t,{open:1-k,eyes:1,floor:'B2'}),{text:'电梯门在你身后关上了。\n显示屏上的数字，再也没有变过。'})],
  death_p_mirror:[L(3000,(g,t,k)=>mirror(g,t,{hand:k,lag:1}),{text:'指尖碰到了镜面。是温的。'}),L(3400,(g,t,k)=>mirror(g,t,{hand:1,lag:1,smile:true,crack:k>.5}),{text:'镜子里的你，握住了你的手。',glitch:true}),L(3200,(g,t)=>mirror(g,t,{dark:true,smile:true}),{text:'第二天，你照常走出了 206 号室。\n只是从那以后，你一直用左手吃饭。'})],
  death_p_name:[L(3000,(g,t)=>water(g,t,{rail:true,lamp:400}),{jp:'はい。',zh:'在。'}),L(3400,(g,t,k)=>water(g,t,{rail:true,face:true,hands:Math.ceil(k*6)}),{text:'水面上浮起来的，是你的脸。它也说了一声「はい」。',glitch:true}),L(3400,(g,t,k)=>water(g,t,{level:20,under:true,eyes:ease(k)}),{text:'栏杆很低。水很冷。\n喊你名字的那个声音，现在换成了你的声音。'})],
  death_p_shadow:[L(3000,(g,t,k)=>water(g,t,{lamp:120,shadow:k,sky:'#0b1410'}),{text:'影子走在前面，你跟在后面。'}),L(3400,(g,t,k)=>water(g,t,{lamp:120,shadow:1,hands:Math.ceil(k*5),sky:'#0b1410'}),{text:'池水漫过了脚踝。影子回过头来。它没有脸，但你知道它在笑。'}),L(3200,(g,t,k)=>water(g,t,{level:40,under:true,eyes:k}),{text:'第二天早上，不忍池边的路灯下，又多了一道影子。'})],
  death_p_crossing:[L(2800,(g,t)=>crowd(g,t,{eyes:true,n:60}),{text:'你转身就跑。几千双眼睛跟着你转。'}),L(3000,(g,t,k)=>crowd(g,t,{eyes:true,n:60,red:true,car:k}),{jp:'信号が、赤ですよ。',zh:'是红灯哦。',glitch:true}),L(2400,(g,t,k)=>crowd(g,t,{n:60,red:true,car:1,white:ease(k)}),{text:'刹车声。然后，什么也听不见了。\n人群重新走了起来，像什么都没发生过。'})],
  death_p_train:[L(3000,(g,t)=>train(g,t,{}),{text:'你在空车厢里坐下。车门关上了。'}),L(3400,(g,t,k)=>train(g,t,{full:k>.3,eyes:k>.6}),{jp:'次は、終点。終点です。',zh:'下一站，终点。终点站。',glitch:true}),L(3200,(g,t,k)=>train(g,t,{full:true,eyes:true,dark:ease(k)*.9,sign:'終　点'}),{text:'窗外一直是黑的。\n你看了一眼手机：信号格是空的，时间停在了 23:59。'})],
  death_p_exit:[L(3000,(g,t,k)=>tunnel(g,t,{depth:k*.3}),{text:'你一直往前走。瓷砖越来越旧，灯越来越少。'}),L(3400,(g,t,k)=>tunnel(g,t,{depth:.4+k*.3,figure:k}),{text:'尽头站着一个人。他穿着和你一样的衣服。',glitch:true}),L(3200,(g,t,k)=>tunnel(g,t,{depth:1,figure:1}),{jp:'13番出口へ、ようこそ。',zh:'欢迎来到 13 号出口。'})],
  death_p_sumida:[L(3000,(g,t)=>C().hall(g,t,false),{text:'僧人走在前面。他的脚印都是湿的。'}),L(3400,(g,t,k)=>water(g,t,{lamp:80,hands:Math.ceil(k*7),sky:'#141018'}),{text:'隅田川边，河面下有一点金色的光。\n“就在那里。”他说。',glitch:true}),L(3400,(g,t,k)=>water(g,t,{level:10,under:true,eyes:ease(k)}),{text:'你伸手去够那点光。\n抓住你的手，冰凉，滑腻，不止一只。'})],
  death_p_scissors:[L(3000,(g,t,k)=>shears(g,t,{cut:k*.6}),{text:'她把剪刀伸到你身后，剪了一下。'}),L(3200,(g,t,k)=>shears(g,t,{cut:.6+k*.4}),{jp:'はい、きれいに切れた。',zh:'好了，剪干净了。',glitch:true}),L(3200,(g,t,k)=>shears(g,t,{cut:1,fade:ease(k)}),{text:'你站起来，想说谢谢，却想不起自己的名字。\n路过的人，没有一个看得见你。'})],
  death_p_hollow:[L(3000,(g,t)=>hollow(g,t,{}),{text:'盐撒在你头上。念珠一颗一颗地数过去。'}),L(3400,(g,t,k)=>hollow(g,t,{fade:k*.6}),{jp:'ほら、きれいになった。',zh:'你看，干净了。',glitch:true}),L(3200,(g,t,k)=>hollow(g,t,{fade:.6+k*.4}),{text:'污染全部被祓掉了。\n连同你记得的一切。'})]
 };
 function play(id,done){const steps=(SCRIPT[id]||[]).concat([L(3200,(g,t,k)=>C().bigEye(g,t,k),{card:'BAD END'})]);let i=0,t0=performance.now();cancelAnimationFrame(raf);
  UI.scene('story',()=>play(id,done));
  app.innerHTML='<div class="pr-cine pr-flood" id="pr-cine"><canvas id="pr-cv" width="512" height="352" aria-hidden="true"></canvas><div class="pr-cap" id="pr-cap" aria-live="polite"></div><div class="dx-btns"><button type="button" class="story-btn" id="pr-next">▶ 继续</button><button type="button" class="story-btn alt" id="pr-skip">跳过演出</button></div></div>';
  const cv=app.querySelector('#pr-cv'),g=cv.getContext('2d'),cap=app.querySelector('#pr-cap');g.imageSmoothingEnabled=false;
  const show=()=>{const s=steps[i];if(!s){cancelAnimationFrame(raf);if(done)done();return}t0=performance.now();
   cap.className='pr-cap'+(s.glitch?' glitch':'')+(s.card?' card':'');
   cap.innerHTML=(s.card?'<h2>'+esc(s.card)+'</h2>':'')+(s.jp?'<p class="pr-jp" lang="ja">「'+esc(s.jp)+'」</p>'+(typeof langMode==='function'&&langMode()==='learning'&&typeof trToggle==='function'?trToggle(s.zh):'<p class="pr-zh">'+esc(s.zh)+'</p>'):'')+(s.text?'<p>'+esc(s.text).replace(/\n/g,'<br>')+'</p>':'');
   try{if(window.AUDIO)AUDIO.sfx(i===1?'buzz':'step')}catch(e){}};
  const loop=t=>{if(!cv.isConnected)return;const s=steps[i];if(s){const k=Math.min(1,(t-t0)/s.d);try{s.draw(g,t,k)}catch(e){}}raf=requestAnimationFrame(loop)};
  app.querySelector('#pr-next').onclick=()=>{i++;show()};app.querySelector('#pr-skip').onclick=()=>{i=steps.length;show()};
  show();raf=requestAnimationFrame(loop);window.scrollTo(0,0)}
 return {maybe,run,offer,die,endScreen,deadCheck,checkpoint,cp,gate:()=>{if(deadCheck())return true;checkpoint();return false},events:EV,ids:IDS,_play:play};
})();
window.PERIL=PERIL;

/* ---------- 接入 ---------- */
{const baseHome=tokyoHome;tokyoHome=function(){if(window.PERIL&&PERIL.deadCheck())return;const r=baseHome.apply(this,arguments);
  try{if(UI.current()==='map'){PERIL.checkpoint();TAINT.tick()}}catch(e){}return r}}
{const baseEnter=enterDistrict;enterDistrict=function(id){const r=baseEnter.apply(this,arguments);try{PERIL.maybe('street',id)}catch(e){}return r}}
{const baseSel=selectSpot;selectSpot=function(id){if(id==='exorcist'){EXO.open();return}return baseSel.apply(this,arguments)}}
if(window.H18){const baseStart=H18.start;H18.start=function(){const r=baseStart.apply(this,arguments);let n=0;const tm=setInterval(()=>{n++;try{if(H18.active()&&!(H18.isDay&&H18.isDay())){clearInterval(tm);PERIL.checkpoint();/* v57：即死事件改由上面的定时检查触发 */}}catch(e){}if(n>40)clearInterval(tm)},500);return r}}
if(window.PRAYER){const baseOpen=PRAYER.open;PRAYER.open=function(){const r=baseOpen.apply(this,arguments);try{PERIL.maybe('temple')}catch(e){}return r}}
/* v57：刷新 / 重开页面后回到原处。进入港屋酒店（白天或夜间）时记下「在酒店」，并把所在位置改成品川；回到东京地图或进入其他街区时清掉。
   开机时（BOOT-GAME-FIRST）如果记录是今天的，就回到酒店，而不是东京地图。 */
{const RKEY='et-resume-v57';
 const mark=()=>{try{if(!campaign)return;localStorage.setItem(RKEY,JSON.stringify({view:'hotel',day:campaign.day}));if(campaign.location!=='shinagawa'){campaign.location='shinagawa';campaignSave()}}catch(e){}};
 const clear=()=>{try{localStorage.removeItem(RKEY)}catch(e){}};
 if(window.H18){for(const fn of ['start','startDay']){const base=H18[fn];if(typeof base!=='function')continue;H18[fn]=function(){const r=base.apply(this,arguments);mark();return r}}}
 let acted=false;for(const ev of ['pointerdown','keydown','touchstart'])document.addEventListener(ev,()=>{acted=true},{capture:true,passive:true}); /* 开机时游戏自己也会回地图：玩家还没操作过之前不清记录 */
 {const baseHome=tokyoHome;tokyoHome=function(){if(acted)clear();return baseHome.apply(this,arguments)};}
 {const baseEnter=enterDistrict;enterDistrict=function(){if(acted)clear();return baseEnter.apply(this,arguments)};}
 window.__etResume=function(){try{const r=JSON.parse(localStorage.getItem(RKEY)||'null');if(!r||!campaign||r.day!==campaign.day||r.view!=='hotel')return false;if(window.GS&&GS.dead&&GS.dead())return false;if(!window.HOTEL_DAY2)return false;HOTEL_DAY2.open();return true}catch(e){return false}};
}
/* v58：最终报告没交时，东京地图上一直有入口（原来点「暂存报告」回到地图后就再也找不到报告页） */
{const addCard=()=>{try{
  const s=campaign&&campaign.case1;if(!s||!window.CASE5||!['report','due'].includes(s.state)||!CASE5.due())return;
  const shell=app&&app.querySelector('.rpg-shell');if(!shell||!shell.querySelector('.daily-panel')||shell.querySelector('#ch1-report-card'))return;
  const panel=document.createElement('section');panel.className='survival-box';panel.id='ch1-report-card';panel.style.border='1px solid #c49b55';
  panel.innerHTML='<div class="rpg-kicker">CASE NO. 001 · 调查期限已到</div><h2>📝 最终调查报告还没有提交</h2><p>报告提交后，第一章才会结案。'+(!s.extended&&!s.report?'还没整理好的话，也可以申请延迟结案。':'')+'</p><button type="button" class="survival-btn" id="ch1-report-go">📝 继续整理最终报告 →</button>';
  shell.querySelector('.daily-panel').insertAdjacentElement('beforebegin',panel);
  panel.querySelector('#ch1-report-go').onclick=()=>{if(s.state==='due')CASE5.notice();else CASE5.reportPage()};
 }catch(e){console.error(e)}};
 let q=0;new MutationObserver(()=>{if(!q)q=requestAnimationFrame(()=>{q=0;addCard()})}).observe(app,{childList:true,subtree:true});
 const baseHome=tokyoHome;tokyoHome=function(){const r=baseHome.apply(this,arguments);addCard();return r}}
/* v58：序章场景、酒店地图的面板一屏化——画面按剩余高度缩小，底部的出口按钮、方向键不再落到导航栏后面（宽屏；手机仍可滚动） */
{let raf=0;const fit=()=>{raf=0;try{
  const nav=document.querySelector('nav.et-nav,.et-nav');const navTop=nav?nav.getBoundingClientRect().top:innerHeight;
  document.querySelectorAll('.h18-panel').forEach(panel=>{
   const st=panel.querySelector('.h18-stage');if(!st)return;
   if(innerWidth<=600){panel.classList.remove('v58-fit');panel.style.removeProperty('--v58w');return}
   panel.classList.remove('v58-fit');panel.style.removeProperty('--v58w');
   const sc=panel.closest('main')||document.scrollingElement;const top=sc?sc.scrollTop:0;
   /* 只保证「主要操作」（出口按钮、方向键）露出来；下面的调查点列表可以滚动查看 */
   const pick=()=>{const c=panel.querySelector('.h18-controls');if(c)return c;const bs=[...panel.querySelectorAll('button')].filter(b=>/→|前往|上车|继续乘车|离开/.test(b.textContent)&&b.getBoundingClientRect().width);return bs.sort((a,b)=>b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom)[0]||panel};
   const w0=st.getBoundingClientRect().width;let w=w0;
   for(let i=0;i<3;i++){const over=pick().getBoundingClientRect().bottom+top-navTop+8;if(over<=0)break;
    const h=w*11/16,nh=Math.max(300,h-over);if(nh>=h-1)break;w=Math.round(nh*16/11);
    panel.style.setProperty('--v58w',w+'px');panel.classList.add('v58-fit')}
  })}catch(e){}};
 const go=()=>{if(!raf)raf=requestAnimationFrame(fit)};
 window.addEventListener('resize',go);new MutationObserver(go).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(go,500)}
/* v57：酒店即死事件（敲门、镜子、电梯）。原来进酒店 3 秒就随机弹出，不看时间和地点。
   现在：每晚只掷一次（概率仍是 config 的 peril.event.chance）；中了以后，等到 21:00 以后、玩家走到事件对应的地点（206 房间 / 二楼走廊）、
   并且没有对话和弹窗时才出现。 */
if(window.H18&&window.PERIL){const rolled={};setInterval(()=>{try{
  if(!campaign||!H18.active()||(H18.isDay&&H18.isDay()))return;
  const m=TM.now();if(m>=6*60&&m<21*60)return;
  if(DM.isOpen()||document.querySelector('.et-modal-back,dialog[open],.pg-root,.sc-overlay'))return;
  const d=campaign.day;if(rolled[d]===undefined)rolled[d]=Math.random()<((GAME_CONFIG.peril&&GAME_CONFIG.peril.event&&GAME_CONFIG.peril.event.chance)??.5);
  if(!rolled[d])return;
  if(PERIL.maybe('hotel',H18.where(),true))rolled[d]=false;
 }catch(e){}},2000)}

/* ===================================================================
   v43：侧视布景的像素画（PXART）+ 正篇关键时刻的侧视布景（SIDE）
   - 逻辑分辨率 256×176（16×11 格，每格 16px），输出到 512×352 画布时放大 2 倍
   - 人物用正篇同一套 H18.pixelPerson；序章里的陌生人没有五官
   - 静态部分按「场景 + 状态」缓存，每帧只画动的东西（雨、灯、屏幕）
   规则见项目文档「画面表现规则-俯视地图与侧视布景」
   =================================================================== */
const PXART=(function(){
 const LW=256,LH=176,U=16;
 const cache={};
 const mk=()=>{const c=document.createElement('canvas');c.width=LW;c.height=LH;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g]};
 const r=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const t=(g,x,y,w,h,c)=>r(g,x*U,y*U,w*U,h*U,c);
 const dith=(g,x,y,w,h,c,s)=>{s=s||2;g.fillStyle=c;for(let j=0;j<h;j+=s)for(let i=(j/s)%2?s:0;i<w;i+=s*2)g.fillRect(Math.round(x+i),Math.round(y+j),1,1)};
 const txt=(g,s,x,y,c,sz,b)=>{g.fillStyle=c;g.font=(b===false?'':'bold ')+(sz||8)+'px "DotGothic16","Hiragino Sans","Noto Sans JP","Microsoft YaHei",monospace';g.textBaseline='top';g.fillText(s,Math.round(x),Math.round(y))};
 const glow=(g,x,y,rad,c)=>{const gr=g.createRadialGradient(x,y,1,x,y,rad);gr.addColorStop(0,c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2)};
 const hex=c=>{const n=parseInt(String(c).slice(1),16);return [n>>16&255,n>>8&255,n&255]};
 const NP=()=>(GAME_DATA.story.chapter1||{}).npcs||{};
 const PL={h:'#2a2a3a',s:'#ecc19b',b:'#3f8f8a',a:'#e8e2cc',p:'#2e3446',k:'#1a1a1a'};
 /* 人物：faceless = 抹掉五官（脸变成一块灰白的平涂） */
 function person(g,x,y,pal,dir,sc,o){o=o||{};const s=document.createElement('canvas');s.width=32;s.height=32;const sg=s.getContext('2d');sg.imageSmoothingEnabled=false;
  try{H18.pixelPerson(sg,0,0,pal||PL,dir||'down')}catch(e){r(sg,10,4,12,12,(pal||PL).s);r(sg,8,16,16,14,(pal||PL).b)}
  if(o.faceless&&pal&&dir!=='up'){const im=sg.getImageData(0,0,32,32),d=im.data,sk=hex(pal.s),hr=hex(pal.h);let top=99,bot=-1,l=99,rr=-1;
   for(let yy=0;yy<20;yy++)for(let xx=0;xx<32;xx++){const i=(yy*32+xx)*4;if(d[i+3]&&Math.abs(d[i]-sk[0])<6&&Math.abs(d[i+1]-sk[1])<6&&Math.abs(d[i+2]-sk[2])<6){top=Math.min(top,yy);bot=Math.max(bot,yy);l=Math.min(l,xx);rr=Math.max(rr,xx)}}
   const fc=[Math.round(sk[0]*.62+40),Math.round(sk[1]*.62+44),Math.round(sk[2]*.62+52)];
   for(let yy=top;yy<=bot;yy++)for(let xx=l;xx<=rr;xx++){const i=(yy*32+xx)*4;if(!d[i+3])continue;if(Math.abs(d[i]-hr[0])<8&&Math.abs(d[i+1]-hr[1])<8&&Math.abs(d[i+2]-hr[2])<8)continue;d[i]=fc[0];d[i+1]=fc[1];d[i+2]=fc[2]}
   sg.putImageData(im,0,0)}
  if(o.rim){const m=document.createElement('canvas');m.width=32;m.height=32;const mg=m.getContext('2d');mg.drawImage(s,0,0);mg.globalCompositeOperation='source-in';mg.fillStyle=o.rim;mg.fillRect(0,0,32,32);
   g.save();g.imageSmoothingEnabled=false;for(const [dx,dy] of [[-1,0],[1,0],[0,-1]])g.drawImage(m,0,0,32,32,Math.round(x)+dx,Math.round(y)+dy,Math.round(32*sc),Math.round(32*sc));g.restore()}
  g.save();g.globalAlpha=o.alpha??1;g.drawImage(s,0,0,32,32,Math.round(x),Math.round(y),Math.round(32*sc),Math.round(32*sc));g.restore()}
 /* 主角背影：画在调色之后，带一圈冷色描边，在暗处也看得清 */
 function hero(g,scene,x,y,original=1.75){
  const scale=GAME_CONFIG.v51View.hero[scene],inset=(original-scale)*32;
  person(g,x+inset/2,y+inset,{h:'#3a3f52',s:'#d8b898',b:'#3f8f8a',a:'#e8e2cc',p:'#2e3446',k:'#1a1a1a'},'up',scale,{rim:'rgba(150,175,215,.55)'});
 }
 const stranger=(h,b,a,p)=>({h,s:'#dcb898',b,a:a||'#c8c8c0',p:p||'#2e3446',k:'#1a1a1a'});
 /* 冷色调：去饱和 + 深蓝 + 暗角 + 颗粒 + 扫描线 */
 function grade(g,o){o=o||{};g.save();g.globalCompositeOperation='saturation';g.fillStyle='hsla(0,0%,50%,'+(o.desat??.35)+')';g.fillRect(0,0,LW,LH);
  g.globalCompositeOperation='multiply';g.globalAlpha=o.tintA??.55;g.fillStyle=o.tint||'#6f86ad';g.fillRect(0,0,LW,LH);g.restore();
  const vg=g.createRadialGradient(LW/2,LH*.45,LH*.32,LW/2,LH*.5,LH*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(2,4,10,'+(o.vig??.6)+')');g.fillStyle=vg;g.fillRect(0,0,LW,LH);
  for(let i=0;i<700;i++){const x=(i*7919)%LW,y=(i*104729)%LH;r(g,x,y,1,1,i%3?'rgba(200,220,255,.05)':'rgba(0,0,0,.18)')}
  for(let y=0;y<LH;y+=2)r(g,0,y,LW,1,'rgba(0,0,0,.05)')}
 /* 动态：雨（输出分辨率） */
 function rain(c,tm,x,y,w,h,n,col){const S=c.canvas.width/LW;c.strokeStyle=col||'rgba(170,195,230,.38)';c.lineWidth=1;c.beginPath();for(let i=0;i<n;i++){const rx=(x+((i*37.3+tm*30*(1+i%3))%w))*S,ry=(y+((i*21.7+tm*150*(1+(i%4)*.2))%h))*S;c.moveTo(rx,ry);c.lineTo(rx-2,ry+8)}c.stroke()}
 const pr=(c,x,y,w,h,col)=>{const S=c.canvas.width/LW;c.fillStyle=col;c.fillRect(Math.round(x*S),Math.round(y*S),Math.round(w*S),Math.round(h*S))};
 const ptxt=(c,s,x,y,col,sz)=>{const S=c.canvas.width/LW;c.fillStyle=col;c.font='bold '+Math.round((sz||8)*S)+'px "DotGothic16","Hiragino Sans","Noto Sans JP",monospace';c.textBaseline='top';c.fillText(s,Math.round(x*S),Math.round(y*S))};
 function blit(c,key,build){let b=cache[key];if(!b){const [cv,g]=mk();build(g);b=cache[key]=cv}c.imageSmoothingEnabled=false;c.drawImage(b,0,0,LW,LH,0,0,c.canvas.width,c.canvas.height)}
 /* 共用的小物件 */
 function floorTiles(g,y,c1,c2,step){r(g,0,y,LW,LH-y,c1);for(let yy=y+step;yy<LH;yy+=step)r(g,0,yy,LW,1,c2);for(let x=0;x<LW;x+=step*2)r(g,x,y,1,LH-y,c2)}
 function planks(g,y,c1,c2){r(g,0,y,LW,LH-y,c1);for(let yy=y+7;yy<LH;yy+=7)r(g,0,yy,LW,1,c2);for(let i=0;i<40;i++)r(g,(i*53)%LW,y+((i*7)%(LH-y)),1,7,c2)}
 const F=p=>(p&&p.flags)||{};

 const S={
 /* ---------- 序章：入境审查 ---------- */
 immigration:{key:()=> 'imm',base(g){
   r(g,0,0,LW,LH,'#1b2434');r(g,0,0,LW,40,'#121a27');for(let y=44;y<122;y+=10)r(g,0,y,LW,1,'#1f2939');
   floorTiles(g,122,'#262e3b','#222936',9);dith(g,0,122,LW,54,'rgba(255,255,255,.03)');
   t(g,1,0.5,5,1.6,'#d9bf7d');t(g,1,2,5,.12,'#a48a48');txt(g,'外国人',20,11,'#141a24',13);txt(g,'FOREIGN PASSPORTS',20,26,'#2a2414',6);
   t(g,11.5,0.8,4,1.2,'#9aa6b8');t(g,11.5,1.9,4,.1,'#6a7484');txt(g,'日本人  JAPANESE',188,17,'#1a2030',7);
   [1.2,6,10.6].forEach((bx,i)=>{t(g,bx,3.4,4,4.2,'#2c3a52');t(g,bx+.2,3.6,3.6,2.2,i===1?'#3e5576':'#26344c');dith(g,(bx+.2)*U,3.6*U,3.6*U,2.2*U,'rgba(255,255,255,.08)',3);t(g,bx+1.6,3.2,.8,.3,i===1?'#d9bf7d':'#3a4a60')});
   txt(g,'2',125,51,'#141a24',5);
   person(g,104,58,{h:'#1b2a4a',s:'#e4b48f',b:'#2d3f6e',a:'#d9bf7d',p:'#26334f'},'down',1.5,{faceless:true});
   [1.2,6,10.6].forEach(bx=>{t(g,bx,5.8,4,.3,'#8d9bb0');t(g,bx,6.1,4,1.5,'#202a3a')});
   for(let x=6;x<76;x+=22){r(g,x,138,3,24,'#b8954a');r(g,x-1,136,5,3,'#d9bf7d')}r(g,6,142,72,2,'#2f4f8a');
   const Q=[['#2a1d18','#5a4a6a'],['#c9a060','#3a5a4a'],['#111','#6a4a3a'],['#3b302d','#4a5a7a'],['#2a2a33','#5a5a4a'],['#6a5040','#3a3a5a']];
   for(let i=5;i>=0;i--){const q=Q[i];person(g,4+(i%3)*22,96+Math.floor(i/3)*20,stranger(q[0],q[1]),'up',1.0)}
   person(g,188,68,stranger('#18181c','#34363e','#ccc','#25262c'),'left',2,{faceless:true});
   t(g,11,7.8,5,.12,'#d9bf7d');t(g,14.75,7.9,.95,1.75,'#0c1018');
   grade(g,{desat:.3,tintA:.55});hero(g,'immigration',112,120)},
  anim(c,tm){pr(c,8,6,36,3,'#dfe8f0');pr(c,72,6,36,3,(Math.floor(tm*7)%11)?'#dfe8f0':'#3a4656');pr(c,136,6,36,3,'#3a4656');pr(c,200,6,36,3,'#dfe8f0');
   pr(c,236.8,128,12.6,25,(Math.floor(tm*2)%2)?'#4a6a9a':'#3a5a8a');pr(c,163,86.4,14,8,'#1f8a5a');if(Math.sin(tm*3)>0)pr(c,165,88,3,3,'#7af0b0')}},
 /* ---------- 序章：到达大厅 ---------- */
 arrivals:{key:p=>'arr'+(F(p).noteRead?1:0),base(g,p){
   r(g,0,0,LW,LH,'#1a2232');r(g,0,0,LW,6,'#0f141d');for(let y=10;y<118;y+=12)r(g,0,y,LW,1,'#1e2738');
   t(g,10.6,.4,5.4,2,'#0b111c');for(let x=10.6;x<16;x+=1.35)t(g,x,.4,.08,2,'#334158');
   floorTiles(g,118,'#262c36','#2c333e',12);
   t(g,1,.4,4.4,1.5,'#d9bf7d');txt(g,'京急線 ↓',20,9,'#141a24',9);txt(g,'モノレール →',20,20,'#141a24',7);t(g,2.5,.6,1.1,.7,'rgba(196,90,90,.9)');txt(g,'×',45,10,'#141a24',11);
   t(g,.6,4,4.4,3.2,'#2c3a52');t(g,2.4,3.1,.9,.9,'#3a5a8c');txt(g,'i',42,51,'#e8ebf0',12);
   person(g,22,64,stranger('#2b1d17','#3a5a8c','#e49a9a'),'down',1.35,{faceless:true});t(g,.6,5.6,4.4,.3,'#8d9bb0');t(g,.6,5.9,4.4,1.3,'#26324a');
   t(g,6,1.9,3.6,2.9,'#e8ebf0');t(g,6.15,2.05,3.3,.6,'#c45a5a');txt(g,'東京生活の心得',100,34,'#fff',6);for(let i=0;i<4;i++)t(g,6.3,2.9+i*.42,i===3?2.2:3,.12,i===3?'#7a2a2a':'#8d9bb0');
   t(g,5.6,7.4,4.8,.6,'#3a4558');t(g,5.6,8,4.8,.5,'#4a5568');t(g,5.6,8.5,.3,1,'#334158');t(g,10.1,8.5,.3,1,'#334158');if(!F(p).noteRead)t(g,7.6,7.85,.7,.25,'#d7c27a');
   t(g,11,2.6,4.4,4.6,'#1e3a2e');t(g,11,2.6,4.4,.8,'#2f9a5e');txt(g,'コンビニ',190,43,'#f2f2f2',9);t(g,11.3,3.6,3.8,3.2,'rgba(220,240,225,.14)');for(let i=0;i<3;i++)t(g,11.5,4+i*.9,3.4,.15,'#7aa08a');
   person(g,146,74,stranger('#26262c','#54545e'),'left',1.3,{faceless:true});
   grade(g,{desat:.32,tintA:.55});hero(g,'arrivals',20,120)},
  anim(c,tm){rain(c,tm,170,6,86,32,26)}},
 /* ---------- 序章：车站站台 ---------- */
 station:{key:()=> 'sta',base(g){
   r(g,0,0,LW,LH,'#141b28');r(g,0,0,LW,8,'#1c2634');for(let x=0;x<LW;x+=32)r(g,x,8,1,132,'#18202e');
   for(let i=0;i<3;i++){const x=(.8+i*1.65)*U;r(g,x,34,23,67,'#c9ccd2');r(g,x,34,23,2,'#eef0f2');r(g,x+2,38,19,19,'#1f6fae');r(g,x+3,39,17,3,'#7ab8e8');r(g,x+6,67,11,3,'#333');r(g,x+2,77,19,6,'#d88a92')}
   txt(g,'きっぷ',26,24,'#e8ebf0',8);
   t(g,6.6,.7,5.6,2.2,'#05070a');t(g,6.6,.7,5.6,.08,'#3a4250');
   t(g,0,6.4,16,2.5,'#3e434c');dith(g,0,6.4*U,LW,2.5*U,'rgba(0,0,0,.2)');for(let x=0;x<LW;x+=4)r(g,x,142,2,4,(x/4)%2?'#d9b440':'#b99a40');t(g,0,9.15,16,1.9,'#05070a');r(g,0,158,LW,2,'#6a6a6a');r(g,0,168,LW,2,'#6a6a6a');
   person(g,204,58,{h:'#1b2a4a',s:'#e7bd96',b:'#24365e',a:'#c94040',p:'#1e2638'},'left',2,{faceless:true});r(g,214,58,30,5,'#1b2a4a');r(g,212,62,34,2,'#141e34');r(g,226,59,6,2,'#d9bf7d');
   person(g,120,86,{h:'#d8d8d8',s:'#e2bf9c',b:'#7a5a7a',a:'#b69ce8',p:'#3a3040'},'down',1.75,{faceless:true});t(g,9.1,8,.6,.5,'#8a6a3a');
   grade(g,{desat:.28,tintA:.55});hero(g,'station',48,88)},
  anim(c,tm){const b=Math.floor(tm*2)%2;ptxt(c,'快特　品川',109,14,'#f5a142',10);if(b)ptxt(c,'まもなく',168,15,'#f5a142',8);ptxt(c,'急行　品川方面',109,30,'#6ad898',10);}},
 /* ---------- 序章：电车车厢 ---------- */
 train:{key:p=>'tr'+(F(p).oldmanGone?1:0),base(g,p){
   r(g,0,0,LW,LH,'#c9c8bd');r(g,0,0,LW,6,'#a8a69a');
   t(g,1.4,.5,6.4,1.6,'#efece0');t(g,1.5,.6,3,1.4,'#d88a8a');txt(g,'外国人スタッフ募集',26,13,'#141a24',6);txt(g,'時給1,050円〜',27,23,'#141a24',6);t(g,4.7,.6,3,1.4,'#c8c8c0');t(g,5.6,.75,1.1,.8,'#8a8a80');txt(g,'探しています',77,25,'#333',5);
   t(g,9,.8,3.4,1.9,'#05070a');
   t(g,0,3,16,3.2,'#0a0d14');for(let i=0;i<16;i+=4)t(g,i,3,.25,3.2,'#b8b6aa');
   t(g,0,7.4,16,.25,'#2c4470');t(g,0,7.6,16,1.5,'#3a5a8c');dith(g,0,7.6*U,LW,1.5*U,'rgba(0,0,0,.15)');t(g,0,9.1,16,1.9,'#8d8a80');
   for(let i=0;i<4;i++)person(g,(5.4+i*1.4)*U,74+(i%2)*3,stranger('#111',['#334','#433','#343','#444'][i],'#999'),'down',1.35,{faceless:true});
   person(g,26,62,stranger('#18181c','#34363e','#5a6a8a','#25262c'),'down',2.3,{faceless:true});
   if(!F(p).oldmanGone)person(g,180,62,{h:'#e8e8e8',s:'#d8d0c4',b:'#8a7f6a',a:'#6b5d48',p:'#5a5348',k:'#333'},'down',2.3,{faceless:true,alpha:.85});else{t(g,11.6,7.2,1.6,.35,'rgba(30,40,50,.28)');t(g,12,7.5,.8,.2,'rgba(30,40,60,.35)')}
   grade(g,{desat:.4,tintA:.5,vig:.55})},
  anim(c,tm,p){const off=(tm*9*U)%(4*U);for(let i=-1;i<5;i++)pr(c,i*64-off+16,70,2,10,'#3a4558');const gl=Math.floor(tm*6)%5===0;ptxt(c,'天空橋',148,16,'#6ad898',8);ptxt(c,gl?'▒▒▒▒':'品川',148,28,gl?'#e8ebf0':'#f5a142',10);
   const sw=Math.sin(tm*2)*1.5;for(let i=0;i<16;i+=1.2){pr(c,i*U+8,6,1,16,'rgba(110,110,110,.7)');pr(c,i*U+6+sw,22,4,4,'rgba(170,175,180,.75)')}if(Math.floor(tm*3)%17===0)pr(c,0,0,256,176,'rgba(0,0,0,.35)')}},
 /* ---------- 序章：品川站高轮口 → 北品川（俯视的雨夜地图） ---------- */
 street:{key:p=>'st'+(F(p).knowsHotel?1:0)+(F(p).prologueHecklerDone?1:0),base(g,p){
   r(g,0,0,LW,LH,'#0e131c');
   t(g,0,5,16,1.2,'#232a36');t(g,6.2,0,1.1,11,'#232a36');t(g,11.4,0,1,11,'#232a36');for(let x=0;x<LW;x+=10)r(g,x,88,5,1,'#d9bf7d');
   [[.4,.4,5.4,4.2],[7.7,.4,3.3,4.2],[.4,6.6,5.4,4],[7.7,6.6,3.3,4],[12.8,6.6,3,4],[12.8,.4,3,4.2]].forEach(b=>{t(g,b[0],b[1],b[2],b[3],'#161c27');dith(g,b[0]*U,b[1]*U,b[2]*U,b[3]*U,'rgba(255,255,255,.04)',3);t(g,b[0],b[1],b[2],.15,'#202836')});
   for(let i=0;i<14;i++){const x=((i*1.13)%15+.5)*U,y=((i*2.37)%10+.3)*U;r(g,x,y,3,2,'rgba(217,191,125,.45)')}
   t(g,.6,8.4,2.4,1.4,'#334158');txt(g,'品川駅',13,138,'#e8ebf0',9);txt(g,'高輪口',13,150,'#8d9bb0',7);
   t(g,3.8,1.8,2.4,2.2,'#2a3446');t(g,3.8,1.8,2.4,.3,'#3a4658');txt(g,'交番',70,48,'#e8ebf0',9);
   t(g,6.8,7,2.6,2,window.KSHOP?KSHOP.sign().body:'#1e3a2e');t(g,6.8,7,2.6,.5,window.KSHOP?KSHOP.sign().color:'#2f9a5e');txt(g,window.KSHOP?KSHOP.sign().short:'コンビニ',112,130,'#f2f2f2',window.KSHOP&&KSHOP.sign().short.length>9?5:KSHOP.sign().short.length>7?6:7);glow(g,130,130,30,'rgba(160,240,190,.12)');
   t(g,9.4,1.8,2.4,2.2,'#3a2f22');t(g,9.6,2,2,1.4,'#8a7a5a');txt(g,'旧東海道',154,58,'#d9bf7d',7);
   t(g,7.9,3.5,.3,2,'#5a5a5a');t(g,7.6,3.7,.9,.5,'#2a4a8a');
   t(g,12.2,6.2,2.4,3,'#05070a');t(g,12.4,6.2,.12,3,'#222');
   if(F(p).knowsHotel){t(g,13.2,1.2,2.4,3,'#2c3a52');t(g,13.3,1.3,2.2,.6,'#d9bf7d');for(let i=0;i<3;i++)for(let j=0;j<2;j++)t(g,13.5+j,2.2+i*.6,.5,.35,(i+j)%2?'#4a5a72':'#c8b070')}
   if(!F(p).prologueHecklerDone)person(g,14,72,stranger('#2a2a33','#4a3a3a'),'right',1.4,{faceless:true});
   for(let i=0;i<8;i++)r(g,(i*61)%LW,92+(i*13)%60,10,2,'rgba(120,150,190,.18)');
   grade(g,{desat:.3,tintA:.5,vig:.65});hero(g,'street',34,104,1.15)},
  anim(c,tm,p){pr(c,75,24,10,6,Math.floor(tm*2)%2?'#e04040':'#6a2020');ptxt(c,'？',208,120,'rgba(182,156,232,'+(0.3+0.3*Math.sin(tm))+')',13);
   if(F(p).knowsHotel)ptxt(c,Math.floor(tm*1.5)%5?'ミナトヤ':'ミナト　',214,22,'#141a24',7);rain(c,tm,0,0,256,176,110)}},
 /* ---------- 序章：坐错的车站 ---------- */
 wrong:{key:(p,x)=>'wr'+x.dest().kanji,base(g,p,x){const d=x.dest();
   r(g,0,0,LW,LH,'#0e131c');r(g,0,106,LW,70,'#1f2531');r(g,0,113,LW,1,'#d9bf7d');for(let i=0;i<6;i++)r(g,(i*47)%LW,128+(i*11)%40,22,3,'rgba(120,150,190,.18)');
   t(g,.6,1.8,6.6,4.8,'#2a3446');t(g,.6,1.8,6.6,.9,'#e8ebf0');txt(g,d.kanji+'駅',16,32,'#141a24',13);t(g,2.6,4,2.6,2.6,'#05070a');t(g,2.7,4.1,2.4,2.4,'rgba(200,190,150,.18)');
   t(g,9,1.4,4.6,5.2,'#2c3a52');t(g,9.2,1.6,4.2,.8,'#8d9bb0');txt(g,'ホテル'+d.kanji,150,28,'#141a24',8);t(g,10.6,5.6,1.4,1,'#d8dce0');
   grade(g,{desat:.32,tintA:.55,vig:.65});hero(g,'wrong',112,120)},
  anim(c,tm){for(let i=0;i<3;i++)for(let j=0;j<3;j++)pr(c,(9.5+j*1.3)*U,(2.8+i*1.1)*U,.8*U,.6*U,(i+j+Math.floor(tm/3))%3?'#3a4a62':'#b8a46a');rain(c,tm,0,0,256,176,100)}},
 /* ---------- 序章：港屋酒店前台（第二天早上也用） ---------- */
 hotel:{key:p=>'ht'+(F(p).deskAway?1:0)+(F(p).registerRead?1:0)+(F(p).lateArrival?1:0),base(g,p){const f=F(p);
   r(g,0,0,LW,LH,'#2a2420');r(g,0,0,LW,16,'#1e1a17');for(let x=0;x<LW;x+=12)r(g,x,16,1,96,'#332c26');r(g,0,108,LW,4,'#4a3a2c');
   planks(g,112,'#3a3028','#30281f');t(g,4.6,7,6.8,4,'#4a1e22');dith(g,4.6*U,7*U,6.8*U,4*U,'rgba(0,0,0,.25)');
   t(g,5.4,1.2,4.2,1.7,'#3a2a1e');for(let j=0;j<2;j++)for(let i=0;i<6;i++){const x=(5.6+i*.65)*U,y=(1.35+j*.75)*U;r(g,x,y,8,9,'#1c120c');if(!(i===4&&j===1))r(g,x+3,y+2,2,5,'#a8884a')}txt(g,'207',(5.6+4*.65)*U-1,(1.35+.75)*U+10,'rgba(200,80,70,.7)',5);
   if(!f.deskAway&&!f.lateArrival)person(g,96,34,NP().sato?NP().sato.palette:stranger('#2a1d18','#2d3f6e','#f2f2f2'),'down',1.8,{faceless:true});
   t(g,3,4.5,8,.25,'#8a6440');t(g,3,4.75,8,2.25,'#6b4a2a');for(let x=3.3;x<11;x+=.6)t(g,x,4.9,.4,2,'#5a3e24');t(g,5.4,5.7,3.2,.7,'#2a1a14');txt(g,'FRONT フロント',90,93,'#d9bf7d',7);
   t(g,11,1.2,2,4.6,'#4a3a2a');t(g,11.1,1.3,1.8,4.4,'#5a4632');txt(g,'STAFF',180,30,'#c9a45e',5);if(f.deskAway)t(g,11,1.2,.25,4.6,'rgba(220,200,150,.4)');
   if(f.deskAway&&!f.registerRead){t(g,3.3,4.7,1.5,.6,'#e8e2d0');t(g,4.02,4.7,.06,.6,'#8a6440')}
   t(g,.6,7.2,3.8,.7,'#5a2a2e');t(g,.6,7.6,3.8,1.8,'#4a2226');t(g,.4,7.4,.3,2,'#3a1a1e');t(g,4.3,7.4,.3,2,'#3a1a1e');t(g,4.6,8.4,1.4,.9,'#4a3a2a');t(g,4.7,8.3,1.1,.25,'#d8d0c0');
   t(g,13.4,2,2.2,5,'#8d9bb0');t(g,13.5,2.1,2,4.8,'#a8b0bc');t(g,14.47,2,.06,5,'#556');t(g,14.2,1.4,.6,.4,'#10141c');
   grade(g,{desat:.42,tintA:.58,tint:'#7488b0',vig:.6});hero(g,'hotel',108,120)},
  anim(c,tm){const fl=Math.floor(tm*4)%23===0;pr(c,72,5,112,2,fl?'#3a3830':'#8a948e');ptxt(c,Math.floor(tm)%9===0?'7':'1',229,22,'#e49a9a',7)}},
 /* ---------- 序章：206 号室 ---------- */
 room:{key:(p,x)=>'rm'+(x.late()?1:0),base(g,p,x){const late=x.late();
   r(g,0,0,LW,LH,late?'#151a24':'#2e2c36');for(let xx=0;xx<LW;xx+=13)r(g,xx,0,1,112,late?'#1a202b':'#35323e');
   planks(g,112,late?'#1c1a1e':'#3a322e','#2a2420');
   t(g,5,1,5,3.2,'#05070a');t(g,5,1,5,.15,'#8d9bb0');t(g,7.45,1,.1,3.2,'#8d9bb0');
   t(g,11.6,1,4,3.8,late?'#1c222e':'#3e3846');for(let i=11.6;i<15.6;i+=.5)t(g,i,1,.05,3.8,late?'#232a37':'#46404e');txt(g,'207',234,68,'rgba(141,155,176,.45)',6);
   t(g,1,5.6,6,1.2,'#5a3e28');t(g,1,6.6,6,3,late?'#2a2f3c':'#c8c4bc');t(g,1.3,6.7,1.8,.8,late?'#3a4050':'#e2e0da');t(g,1,8.6,6,1,late?'#232838':'#8a94a8');
   t(g,7.6,5.4,3.4,.4,'#6b4a2a');t(g,7.8,5.8,.25,1.8,'#5a3e24');t(g,10.6,5.8,.25,1.8,'#5a3e24');t(g,8.4,5.05,1,.4,'#e8e2d0');t(g,9.9,4.9,.7,.5,'#222');
   t(g,12.4,5,3.2,5.4,'#6a5a4a');t(g,12.55,5.15,2.9,5.1,'#7a6a5a');t(g,15,7.6,.25,.25,'#c9a45e');
   grade(g,{desat:.35,tintA:late?.7:.55,vig:late?.75:.6})},
  anim(c,tm,p){rain(c,tm,80,16,80,51,30);pr(c,138,24,19,26,'rgba(200,210,190,'+(0.08+0.06*Math.sin(tm*.7))+')');
   if(F(p).heardWater&&!F(p).mirror)pr(c,198.4,164,51,2.4,'rgba(200,220,255,'+(0.4+0.4*Math.sin(tm*5))+')')}},
 /* ---------- 正篇：2F 走廊 · 207 号室门口 ---------- */
 door207:{key:(p,x)=>'d207'+(x.flag('e1')||x.flag('c2')?1:0),base(g,p,x){const bag=!(x.flag('e1')||x.flag('c2'));
   r(g,0,0,LW,LH,'#3a2f2a');for(let xx=0;xx<LW;xx+=8)r(g,xx,0,3,124,'#41352e');r(g,0,0,LW,10,'#241c18');r(g,0,118,LW,6,'#2a1e18');
   r(g,0,124,LW,52,'#4e1c20');dith(g,0,124,LW,52,'rgba(0,0,0,.22)');r(g,172,124,58,52,'#5a2428');for(let i=0;i<6;i++)r(g,172+i*10,124,1,52,'rgba(0,0,0,.25)');
   [[1.2,'205'],[6.2,'206'],[11.2,'207']].forEach(([dx,n])=>{t(g,dx,2.1,3.2,5.5,'#241a14');t(g,dx+.15,2.25,2.9,5.35,n==='207'?'#56402f':'#634634');t(g,dx+1.1,2.6,1,.45,'#b89a5a');txt(g,n,(dx+1.15)*U,2.62*U,'#3a2a14',6);t(g,dx+2.5,5,.25,.4,'#c9a45e');t(g,dx+1.3,.9,.4,.25,'#6a5a4a')});
   r(g,180,62,6,10,'#9aa0a6');r(g,181,64,8,7,'#ece6d4');
   if(bag){r(g,222,76,9,3,'#d8dee0');r(g,219,78,15,22,'rgba(232,238,240,.85)');r(g,221,86,11,8,'#c8d4da');r(g,221,80,11,3,'#f2f2f2')}
   r(g,40,98,30,26,'#8a9aa0');r(g,42,100,26,9,'#e8e8e0');r(g,42,111,26,9,'#c8d8e0');r(g,42,124,3,3,'#222');r(g,64,124,3,3,'#222');
   r(g,226,4,24,9,'#2a8a4a');txt(g,'非常口',228,5,'#e8f8e8',6);
   grade(g,{desat:.3,tintA:.55,vig:.68});hero(g,'door207',118,120)},
  anim(c,tm){const on=Math.floor(tm*5)%29!==0;pr(c,124,14,8,4,on?'#e8dcb8':'#4a4234');pr(c,204,14,8,4,'#5a4a3a');pr(c,44,14,8,4,'#e8dcb8')}},
 /* ---------- 正篇：206 号室浴室 · 镜子 ---------- */
 bath206:{key:()=> 'b206',base(g){
   r(g,0,0,LW,LH,'#a9b5b8');for(let y=0;y<LH;y+=11)for(let xx=(y/11)%2?5:0;xx<LW;xx+=11)r(g,xx,y,10,10,'#b6c1c4');
   t(g,5.3,1,5.4,4,'#6e7880');t(g,5.5,1.2,5,3.6,'#8e9ca2');
   person(g,110,30,{h:'#3a3f52',s:'#d8b898',b:'#3f8f8a',a:'#e8e2cc',p:'#2e3446'},'down',1.3);r(g,88,19,80,58,'rgba(170,190,200,.18)');r(g,92,22,20,3,'rgba(255,255,255,.35)');
   t(g,4.6,5,6.8,.6,'#e2e6e6');t(g,4.6,5.6,6.8,1.6,'#c4ccce');t(g,7.2,5.05,1.6,.35,'#9aa6aa');t(g,7.9,4.6,.2,.5,'#b8c0c4');
   t(g,11.2,5.8,4.4,2.8,'#e2e6e6');t(g,11.45,6.05,3.9,1.4,'#253440');t(g,13.2,5.2,.2,.7,'#b8c0c4');
   r(g,0,0,LW,LH,'rgba(40,80,70,.16)');grade(g,{desat:.25,tintA:.45,tint:'#7a9aa6',vig:.7});hero(g,'bath206',92,118)},
  anim(c,tm){if(Math.floor(tm*4)%37===0)pr(c,0,0,256,176,'rgba(0,0,0,.4)')}},
 /* ---------- 开场：到达大厅（ARRIVALS）—— 旅客和工作人员都没有五官 ---------- */
 op_airport:{key:()=> 'opair',base(g){
   r(g,0,0,LW,LH,'#18202e');r(g,0,0,LW,22,'#10161f');
   r(g,16,26,78,18,'#d9bf7d');r(g,16,42,78,2,'#a48a48');txt(g,'到着',21,29,'#141a24',10);txt(g,'ARRIVALS',47,32,'#141a24',7);
   r(g,152,30,90,64,'#0d141e');for(let x=152;x<242;x+=18)r(g,x,30,2,64,'#3a4658');r(g,196,30,2,64,'#5a6a7a');txt(g,'EXIT ⇒',208,21,'#9aa6b8',6);
   r(g,0,96,LW,80,'#252c38');for(let y=104;y<LH;y+=9)r(g,0,y,LW,1,'#212833');
   const tr=[['#2a1d18','#5a4a6a',18],['#c9a060','#3a5a4a',52],['#111','#6a4a3a',86],['#3b302d','#4a5a7a',118],['#6a5040','#3a3a5a',186],['#2a2a33','#5a5a4a',218]];
   tr.forEach(([h,b,x],i)=>{person(g,x,80+(i%2)*5,stranger(h,b),i%3?'down':'left',1.4,{faceless:true});r(g,x+31,112+(i%2)*5,12,16,['#4a5568','#6a3a3a','#3a5a6a'][i%3]);r(g,x+34,108+(i%2)*5,6,4,'#222')});
   person(g,148,74,{h:'#1d1d22',s:'#e8bf98',b:'#2d3f6e',a:'#f2f2f2',p:'#25262c'},'down',1.6,{faceless:true});
   grade(g,{desat:.35,tintA:.55,vig:.6})},
  anim(c,tm){for(let i=0;i<5;i++)pr(c,8+i*52,8,32,3,(Math.floor(tm*7)+i)%13?'#dfe8f0':'#3a4656');rain(c,tm,154,32,86,60,24,'rgba(150,180,210,.35)')}}
 };
 function draw(id,c,tm,p,x){const s=S[id];if(!s)return false;x=x||{};const key=id+':'+s.key(p,x);blit(c,key,g=>s.base(g,p,x));try{s.anim&&s.anim(c,tm,p,x)}catch(e){}return true}
 return {draw,has:id=>!!S[id],clear:()=>{for(const k in cache)delete cache[k]},_S:S};
})();
window.PXART=PXART;

/* ---------- 正篇：地图 ⇄ 侧视布景 ---------- */
const SIDE=(function(){
 let cur=null,raf=0,resume=null,orig=null;
 const DATA=()=>((GAME_DATA.story.chapter1||{}).sideviews)||{};
 const flags=()=>{try{return campaign.hotelCase.v18.flags}catch(e){return {}}};
 const seen=()=>{campaign.sideview??={};return campaign.sideview};
 function find(trig){for(const [id,d] of Object.entries(DATA()))if((d.triggers||[]).includes(trig)&&(!d.when||H18.cond(d.when)))return [id,d];return null}
 function trigger(trig,fn){if(!window.H18||!H18.active()||cur)return false;const f=find(trig);if(!f)return false;open(f[0],fn);return true}
 function open(id,fn){const d=DATA()[id],stage=document.getElementById('h18-stage');if(!d||!stage)return false;cur=id;orig=fn||null;
  try{resume=H18.freeze()}catch(e){resume=null}
  const el=document.createElement('div');el.className='sv-wrap';el.id='sv-wrap';
  el.innerHTML='<div class="sv-bar top"></div><div class="sv-bar bot"></div><div class="sv-view"><canvas id="sv-cv" width="512" height="352" aria-hidden="true"></canvas><div class="sv-hots"></div><div class="sv-name"><b lang="ja">'+esc(d.name||'')+'</b><small>'+esc(d.zh||'')+'</small></div><button type="button" class="sv-exit">← '+esc(d.exitLabel||'离开')+'</button></div>';
  stage.appendChild(el);try{if(window.AUDIO)AUDIO.sfx('page')}catch(e){}
  requestAnimationFrame(()=>el.classList.add('in'));setTimeout(()=>el.classList.add('show'),400);
  el.querySelector('.sv-exit').onclick=close;
  hots();loop();return true}
 function hots(){const d=DATA()[cur],el=document.querySelector('#sv-wrap .sv-hots');if(!d||!el)return;const s=seen();
  el.innerHTML=(d.hotspots||[]).filter(h=>!h.when||H18.cond(h.when)).map(h=>{const [x,y,w,hh]=h.rect;const done=s[cur+':'+h.id];return '<button type="button" class="sv-hot'+(done?' done':'')+'" data-sv="'+esc(h.id)+'" style="left:'+(x/16*100)+'%;top:'+(y/11*100)+'%;width:'+(w/16*100)+'%;height:'+(hh/11*100)+'%"><span>'+(!done&&h.action==='orig'?'<i aria-hidden="true">!</i>':'')+esc(h.label)+'</span></button>'}).join('');
  el.querySelectorAll('[data-sv]').forEach(b=>b.onclick=()=>hit(b.dataset.sv))}
 function hit(hid){if(window.DM&&DM.isOpen())return;const d=DATA()[cur],h=(d.hotspots||[]).find(x=>x.id===hid);if(!h)return;seen()[cur+':'+hid]=true;try{campaignSave()}catch(e){}hots();
  if(h.action==='orig'){const fn=orig;if(h.closeFirst){close(()=>fn&&fn());return}if(fn)fn();return}
  if(h.node){H18.play(h.node);return}
  if(h.text)DM.show(H18.host(),{who:h.label,text:h.text,choices:[{t:'▶ 继续',fn:()=>DM.close()}]})}
 function loop(){const cv=document.getElementById('sv-cv');if(!cv)return;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const d=DATA()[cur];let t0=0;cancelAnimationFrame(raf);
  const x={flag:k=>!!flags()[k]};
  const step=ts=>{if(!cv.isConnected)return;if(ts-t0>66){t0=ts;PXART.draw(d.art,c,ts/1000,{flags:flags()},x)}raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)}
 function close(after){const el=document.getElementById('sv-wrap');if(window.DM&&DM.isOpen())DM.close();cur=null;
  if(!el){if(resume)resume();resume=null;if(typeof after==='function')after();return}
  el.classList.remove('show');setTimeout(()=>{el.classList.remove('in');setTimeout(()=>{el.remove();cancelAnimationFrame(raf);const r=resume;resume=null;if(r)r();if(typeof after==='function')after()},350)},200)}
 return {trigger,open,close,active:()=>!!cur,data:DATA};
})();
window.SIDE=SIDE;

/* v45：2.5D 东京地图的底图与车站位置（tools/mapgen.py 生成，不要手改） */
const MAP25_DATA={"phases":[{"stage":0,"inf":3,"name":"序章","desc":"平静。只有东京湾偶尔泛起奇怪的涟漪。","img":"./assets/99-startup/c32cbd5c413bff79.webp","flooded":["kokusaitenjijo","haneda","disney"]},{"stage":2,"inf":8,"name":"DAY 1","desc":"外海出现第一条触手的影子。调查点的眼睛半睁着。","img":"./assets/99-startup/f8d5561e76e81617.webp","flooded":["kokusaitenjijo","haneda","disney"]},{"stage":4,"inf":15,"name":"DAY 2","desc":"触手增加到三条，几片街区停电。海面上涨，岸边出现泡沫。","img":"./assets/99-startup/be0ee37b7f188bcf.webp","flooded":["kokusaitenjijo","haneda","disney"]},{"stage":6,"inf":24,"name":"沿岸潮位","desc":"北品川和银座沿岸出现积水。品川站外的路缘留着一道白线。","img":"./assets/99-startup/2bcb10a057cbedae.webp","flooded":["ginza","nihombashi","tokyoteleport","kokusaitenjijo","haneda","disney","kitashinagawa"]},{"stage":8,"inf":36,"name":"异常潮位","desc":"品川外围的水面平得异常。远处东京站和新桥一带的街灯映在水里。","img":"./assets/99-startup/43eb89f5ae08662b.webp","flooded":["tokyo","shimbashi","ginza","nihombashi","tokyoteleport","kokusaitenjijo","haneda","disney"]},{"stage":8,"inf":40,"name":"沿岸积水","desc":"品川站和港屋一带能看见路面积水。部分监测点没有回传读数。","img":"./assets/99-startup/ace66aadb0069abf.webp","flooded":["tokyo","shimbashi","shinagawa","ginza","nihombashi","tokyoteleport","kokusaitenjijo","haneda","disney","kitashinagawa"]},{"stage":11,"inf":60,"name":"水面波动","desc":"品川外围原本平直的水面起了波纹。远处天空有一层暗红色。","img":"./assets/99-startup/1b5eb9a421a30346.webp","flooded":["akihabara","tokyo","shimbashi","gotanda","asakusabashi","ginza","nihombashi","akasakamitsuke","osaki","oimachi","tokyoteleport","kokusaitenjijo","haneda","disney","kitashinagawa"]},{"stage":11,"inf":66,"name":"沿岸水位","desc":"品川、大崎和五反田的低处有积水，沿岸道路的反光比平时更亮。","img":"./assets/99-startup/57e7281ed15286f0.webp","flooded":["akihabara","tokyo","shimbashi","shinagawa","gotanda","asakusabashi","ginza","nihombashi","akasakamitsuke","osaki","oimachi","tokyoteleport","kokusaitenjijo","haneda","disney","kitashinagawa"]},{"stage":14,"inf":92,"name":"湾岸异象","desc":"湾岸大片水域失去照明。远处天际线上方有一道难辨的轮廓。","img":"./assets/99-startup/9e05ffcf6be481d3.webp","flooded":["akihabara","tokyo","shimbashi","shinagawa","gotanda","meguro","ebisu","shibuya","ochanomizu","asakusabashi","ginza","nihombashi","omotesando","akasakamitsuke","osaki","oimachi","tokyoteleport","kokusaitenjijo","haneda","disney","kitashinagawa"]}],"pos":{"ikebukuro":[38.7,21.37,0.66,330,110],"nippori":[51.31,20.77,0.66,520,100],"ueno":[56.1,25.27,0.72,585,170],"akihabara":[57.94,31.6,0.79,600,255],"tokyo":[56.09,38.87,0.87,570,340],"shimbashi":[52.36,47.08,0.95,525,425],"shinagawa":[44.21,60.28,1.05,445,545],"gotanda":[32.55,56.81,1.03,330,515],"meguro":[29.69,52.35,0.99,295,475],"ebisu":[27.77,47.08,0.95,265,425],"shibuya":[27.13,41.66,0.9,245,370],"harajuku":[27.47,35.33,0.83,230,300],"shinjuku":[30.28,28.5,0.76,240,215],"nakano":[21.69,27.39,0.74,120,200],"ochanomizu":[48.41,31.6,0.79,480,255],"asakusabashi":[63.93,29.24,0.77,682,225],"asakusa":[63.65,25.27,0.72,690,170],"ginza":[55.06,44.07,0.92,555,395],"nihombashi":[61.91,41.32,0.89,633,366],"omotesando":[33.12,38.41,0.87,305,335],"akasakamitsuke":[40.52,39.07,0.87,391,342],"osaki":[36.25,60.87,1.06,370,550],"oimachi":[38.98,66.96,1.1,400,600],"tokyoteleport":[55.7,64.5,1.08,553,580],"kokusaitenjijo":[65.76,66.99,1.1,643,600],"haneda":[79.0,68.85,1.12,760,615],"narita":[71.08,18.48,0.62,840,60],"disney":[72.88,59.58,1.05,718,539],"kitashinagawa":[50.55,65.72,1.09,505,590],"meijijingumae":[29.25,36.55,0.86,252,314]}};

/* ===================================================================
   v45：2.5D 东京地图（侵染随天数推进）
   底图与车站位置在 MAP25_DATA（tools/mapgen.py 生成）。
   阶段：序章 / DAY 1 / DAY 2 / DAY 3 / DAY 4–5（祈福·未祈福）/ DAY 6–8（祈福·未祈福）/ DAY 9–12
   车站标记沿用原来的 class="station" + data-station，选站、线路筛选、乘车面板都不变。
   =================================================================== */
const MAP25=(function(){
 const D=()=>typeof MAP25_DATA!=='undefined'?MAP25_DATA:null;
 const BIG=new Set(['shibuya','shinjuku','tokyo','ikebukuro','shinagawa','ueno','akihabara']);
 const GL={shinagawa:'品̷川',kitashinagawa:'北品̸川',shimbashi:'新̶橋',haneda:'羽田̷空港',osaki:'大̸崎',oimachi:'大̶井町',gotanda:'五̷反田',meguro:'目̸黒',tokyo:'東̷京',ginza:'銀̸座',akasakamitsuke:'赤̷坂見附',ebisu:'恵̸比寿',shibuya:'渋̷谷'};
 const prayed=()=>{try{return !!(window.FLOOD&&FLOOD.prayed())}catch(e){return false}};
 function phase(){if(!campaign||!campaign.firstDayComplete)return 0;const c=campaign.case1;let d=campaign.day;
  if(c&&c.state&&!['active','report','due'].includes(c.state)){campaign.map25Freeze??=d;d=campaign.map25Freeze}
  return V52.mapPhase()}
 function here(){try{return TRAVEL.where()}catch(e){return null}}
 function build(){const data=D();if(!data)return null;const i=phase(),P=V52.phaseData(data.phases[i],i),fl=new Set(P.flooded),cur=here();
  const HIDDEN=new Set(((typeof GAME_CONFIG!=='undefined'&&GAME_CONFIG.map)||{}).hiddenStations||[]);
  const wrap=document.createElement('div');wrap.className='m25 m25-p'+i;wrap.setAttribute('role','group');wrap.setAttribute('aria-label','东京倾斜俯瞰地图（'+P.name+'），可选择车站');
  let h='<img class="m25-img" src="'+P.img+'" alt="" draggable="false">';
  const left=new Set(['shinjuku','harajuku','shibuya','ebisu','meguro','nakano','yoyogi','takadanobaba','omotesando','meijijingumae','shinjukusanchome']);
  const quest=(()=>{try{return FLOOD.questActive()}catch(e){return false}})(),blessed=prayed()&&campaign.day>=4;
  for(const s of stations){if(HIDDEN.has(s.id))continue;const p=data.pos[s.id];if(!p)continue;const f=fl.has(s.id)&&s.id!=='shinagawa',air=s.id==='haneda'||s.id==='narita';
   const swallowed=V51.swallowed(s.id),name=(air?'✈ ':'')+s.jp+(swallowed?' · 今日吞没':'');
   const tag=s.id==='asakusa'&&(quest||blessed)?'<em class="m25-tag'+(quest?' q':'')+'">'+(quest?'祈福 !':'已祈福')+'</em>':'';
   h+='<button type="button" class="station m25-st'+(BIG.has(s.id)||air?' big':'')+(f?' flooded':'')+(swallowed?' v51-eye':'')+(s.id===cur?' here':'')+(left.has(s.id)?' l':'')+(s.id==='asakusa'&&quest?' quest':'')+'" data-station="'+s.id+'" style="left:'+p[0]+'%;top:'+p[1]+'%"'+(swallowed?' disabled':'')+' aria-label="'+esc(s.jp+(swallowed?' · 今日吞没':''))+'站'+(f?'（已被淹）':'')+'"><i></i><span>'+esc(name)+'</span>'+tag+'</button>'}
  h+='<div class="m25-hud"><b>'+esc(P.name)+'</b>'+V52.eroChip('')+'<p>'+esc(P.desc)+'</p></div>';
  wrap.innerHTML=h;
  /* 手机：地图可以横向拖动，打开时滚到当前站附近 */
  setTimeout(()=>{const sc=wrap.closest('.map-scroller');const t=wrap.querySelector('.station.here')||wrap.querySelector('.station.selected');if(sc&&t&&sc.scrollWidth>sc.clientWidth){sc.scrollLeft=Math.max(0,t.offsetLeft-sc.clientWidth/2)}},60);
  return wrap}
 return {build,phase,data:D};
})();
window.MAP25=MAP25;
{const baseHome=tokyoHome;tokyoHome=function(){const r=baseHome.apply(this,arguments);
  /* 画面优先：地图移到页面最上面 */
  try{const host=document.getElementById('map-host'),sec=host&&host.closest('section'),shell=sec&&sec.closest('.rpg-shell');if(shell&&sec&&shell.firstElementChild!==sec){shell.insertBefore(sec,shell.firstElementChild);sec.classList.add('m25-sec')}}catch(e){}
  return r}}

/* ===================================================================
   v46：东京地图页改版（C 像素 RPG 窗 + A 地图边缘淡出）＋ 日间 / 夜间模式
   - 布局：左边 STATUS（一行状态 + 线路下拉）和地图；右边 COMMAND（选中车站 + 指令）和 MESSAGE（简报、预警、任务提示）。
     原来各模块生成的按钮和面板整块搬进窗口，不重写，所以点击逻辑不变。
   - 手机：地图下面是 MESSAGE，导航栏上方固定 4 个按钮（乘车前往 / 回酒店 / 结算 / 更多）；
     地图左上角一行「DAY 4–5 · 浸蚀 40% ▾」，点开看说明，拖地图时它不动。
   - 画面模式：设置里「自动 / 日间 / 夜间」（SETTINGS.theme）。自动：游戏时间 05:00–17:59 日间，其余夜间；
     疲劳点 ≤ 30% 或 SAN ≤ 30 时不管几点都用夜间。目前只作用在地图页和上下两条栏。
   =================================================================== */
const MAP46=(function(){
 const $=(s,r)=>(r||document).querySelector(s);
 /* ---------- 画面模式 ---------- */
 function mode(){const m=SETTINGS.get('theme');return m==='day'||m==='night'?m:'auto'}
 function autoNight(){
  if(!campaign)return true;const P=GAME_CONFIG.player||{};
  if(campaign.hp<=(P.maxHP||100)*0.3||campaign.san<=(P.maxSAN||100)*0.3)return true;
  let t=null;try{t=TM.now()}catch(e){}if(t==null)return true;const h=Math.floor((((t%1440)+1440)%1440)/60);return !(h>=5&&h<18)}
 function night(){const m=mode();return m==='night'?true:m==='day'?false:autoNight()}
 function applyTheme(){const n=night();document.body.classList.toggle('m46-night',n);document.body.classList.toggle('m46-day',!n)}
 /* ---------- 布局 ---------- */
 function onMap(){return !!(app&&$('.rpg-shell #map-host',app))}
 function win(cls,title){const s=document.createElement('section');s.className='m46-win '+cls;s.innerHTML='<span class="m46-wt">'+title+'</span>';return s}
 function dots(){const per=(GAME_CONFIG.day||{}).actionsPerDay||3,a=Math.max(0,campaign.actions|0);return '<b class="m46-dots" aria-label="剩余行动 '+a+'/'+per+'">'+'●'.repeat(Math.min(a,per))+'○'.repeat(Math.max(0,per-a))+'</b>'}
 function statusHtml(){
  const here=(()=>{try{const id=TRAVEL.where();return (byId[id]&&byId[id].jp)||id}catch(e){return ''}})();
  const home=(()=>{const t=$('.et-loc-shortcut-heading',app);const m=t&&t.textContent.match(/居住地[:：]\s*(.+)$/);return m?m[1].trim():''})();
  return '<span class="m46-st-day px">DAY '+campaign.day+' / '+campaign.days+'</span>'
   +'<span>行动 '+dots()+'</span>'
   +(here?'<span>📍 当前 <b>'+esc(here)+'</b></span>':'')
   +(home?'<span class="m46-st-home">🏨 居住 <b>'+esc(home)+'</b></span>':'')
   +'<button type="button" class="m46-linebtn" aria-haspopup="true" aria-expanded="false">线路：全部 ▾</button>'}
 function lineLabel(root){const on=$('.map-legend .line-chip[aria-pressed="true"]',root);const t=on?on.textContent.replace('●','').trim():'全部线路';return '线路：'+(t==='全部线路'?'全部':t)+' ▾'}
 function startLabel(){const b=$('#station-start',app);if(!b)return ['乘车前往',''];const t=b.textContent.replace(/^[^一-鿿A-Za-z]+/,'').trim();
  const m=t.match(/^(乘车前往|前往|探索)\s*(.+?)(?:（(.+?)）)?$/);if(!m)return [t.slice(0,8),''];
  return [m[1],m[2].replace(/\s*像素街区$/,'')+(m[3]?' · '+m[3].split('·')[0].trim():'')]}
 function phaseChip(){const P=window.MAP25&&MAP25.data()&&V52.phaseData(MAP25.data().phases[MAP25.phase()],MAP25.phase());if(!P)return null;
  const c=document.createElement('button');c.type='button';c.className='m46-phase';c.setAttribute('aria-expanded','false');
  c.innerHTML='<b class="px">'+esc(P.name)+'</b>'+V52.eroChip(' · ')+' <em>▾</em><p>'+esc(P.desc)+'</p>';
  c.onclick=()=>{const o=c.classList.toggle('open');c.setAttribute('aria-expanded',String(o));c.querySelector('em').textContent=o?'▴':'▾'};return c}
 function layout(){
  if(!campaign||!onMap())return;const shell=$('.rpg-shell',app);if(!shell)return;
  document.body.classList.add('m46-page','px-page');applyTheme();navH();
  let root=$('.m46',shell);
  if(!root){
   root=document.createElement('div');root.className='m46';
   root.innerHTML='<div class="m46-left"><div class="m46-map"></div></div><div class="m46-right"></div><div class="m46-dock" role="group" aria-label="常用指令"></div><div class="m46-rest" hidden></div>';
   const left=$('.m46-left',root),right=$('.m46-right',root),mapBox=$('.m46-map',root),rest=$('.m46-rest',root);
   const st=win('m46-status','STATUS');const row=document.createElement('div');row.className='m46-st-row';row.innerHTML=statusHtml();st.appendChild(row);left.insertBefore(st,mapBox);
   const cmd=win('m46-cmd','COMMAND'),msg=win('m46-msg','MESSAGE');const mi=document.createElement('div');mi.className='m46-msgin';msg.appendChild(mi);right.append(cmd,msg);
   const close=document.createElement('button');close.type='button';close.className='m46-close';close.textContent='× 关闭';close.onclick=()=>root.classList.remove('more');cmd.appendChild(close);
   /* 地图 */
   const wrap=$('.et-map-wrap',shell)||$('#map-host',shell);mapBox.appendChild(wrap);
   const pc=phaseChip();if(pc)mapBox.appendChild(pc);
   const lb2=document.createElement('button');lb2.type='button';lb2.className='m46-linebtn m46-linechip';lb2.textContent='线路 ▾';mapBox.appendChild(lb2);
   const legend=$('.map-legend',shell);const pop=document.createElement('div');pop.className='m46-lines m46-win';pop.hidden=true;pop.innerHTML='<span class="m46-wt">LINE</span>';if(legend)pop.appendChild(legend);mapBox.appendChild(pop);
   const toggle=on=>{pop.hidden=!on;root.querySelectorAll('.m46-linebtn').forEach(b=>b.setAttribute('aria-expanded',String(on)))};
   root.querySelectorAll('.m46-linebtn').forEach(b=>b.onclick=e=>{e.stopPropagation();toggle(pop.hidden)});
   pop.addEventListener('click',e=>{if(e.target.closest('.line-chip'))setTimeout(()=>{$('.m46-status .m46-linebtn',root).textContent=lineLabel(root);toggle(false)},0)});
   document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target))toggle(false)});
   /* 指令：选中车站 + 原有按钮 */
   const info=$('#station-info',shell);if(info)cmd.appendChild(info);
   const ul=document.createElement('div');ul.className='m46-list';cmd.appendChild(ul);
   /* 放在 shell 末尾，下面 route() 会把剩下的东西分到窗口里 */
   shell.appendChild(root);
   /* 手机：底部 4 个按钮 */
   const dock=$('.m46-dock',root);
   dock.innerHTML='<button type="button" class="m46-go p"><b>🚃 乘车前往</b><small></small></button><button type="button" class="m46-d-hotel"><b>🏨 回酒店</b><small>白天</small></button><button type="button" class="m46-d-night"><b>🌙 结算</b><small>下一天</small></button><button type="button" class="m46-more"><b>☰</b><small>更多</small></button>';
   $('.m46-go',dock).onclick=()=>{const b=$('#station-start',app);if(b&&!b.disabled)b.click();else root.classList.add('more')};
   $('.m46-d-hotel',dock).onclick=()=>{const b=$('#daily-hotel',app);if(b)b.click();else UI.toast&&UI.toast('今天还不能回酒店')};
   $('.m46-d-night',dock).onclick=()=>{const b=$('#daily-night',app);if(b)b.click()};
   $('.m46-more',dock).onclick=()=>root.classList.toggle('more');
   if(info)new MutationObserver(syncDock).observe(info,{childList:true,subtree:true,characterData:true});
  }
  route(root);syncDock();
 }
 /* 把 shell 里其余的东西分进窗口（其他模块常在 tokyoHome 之后才插入，所以会再跑几次） */
 const CMD_BTNS=['#et-map-here-shortcut','#et-map-home-shortcut','#daily-hotel','#daily-night','#et-work-go','#story-quest-btn'];
 function route(root){
  root=root||$('.m46',app);if(!root)return;const shell=root.parentNode,msg=$('.m46-msgin',root),ul=$('.m46-list',root),rest=$('.m46-rest',root);
  for(const sel of CMD_BTNS){const b=$(sel,shell);if(b&&!ul.contains(b)){b.classList.add('m46-cmdbtn');ul.appendChild(b)}}
  if(!$('.m46-nb',ul)){const nb=document.createElement('button');nb.type='button';nb.className='m46-cmdbtn m46-nb';nb.textContent='🔍 推理 · 调查手帐';nb.onclick=()=>{const n=$('#et-nav [data-nav="reasoning"]');if(n)n.click()};ul.appendChild(nb)}
  /* 浮在地图左下角的打工入口、位置快捷栏：按钮已经搬走，外壳收起来 */
  for(const sel of ['#et-work-access','#et-map-shortcuts','.map-help','.m25-sec > .rpg-section-head'])shell.querySelectorAll(sel).forEach(e=>{if(!rest.contains(e))rest.appendChild(e)});
  for(const el of [...shell.children]){
   if(el===root||el.id==='ch1-flood-signals')continue;
   if(el.matches('.rpg-hero,.survival-hud,.rpg-nav'))rest.appendChild(el);
   else if(el.matches('.m25-sec')){if(!$('.m25,.station',el))rest.appendChild(el);else rest.appendChild(el)}
   else if(el.matches('.daily-panel')){const box=document.createElement('div');box.className='m46-item m46-rules';const k=$('.rpg-kicker',el);box.innerHTML='<b>'+esc(k?k.textContent:'生存日程')+'</b>';el.querySelectorAll('.survival-tip').forEach(p=>box.appendChild(p));msg.appendChild(box);rest.appendChild(el)}
   else{const it=document.createElement('div');it.className='m46-item';if(el.matches('.flood-box,#flood-box'))it.classList.add('warn');it.appendChild(el);
    /* 预警、提醒放最前，简报其次，规则说明最后 */
    const rules=$('.m46-rules',msg);if(it.classList.contains('warn'))msg.insertBefore(it,$('.m46-item',msg));else msg.insertBefore(it,rules||null)}
  }
  /* 换行：简报的「收起简报」按钮保留 */
  msg.parentNode.classList.toggle('empty',!$('.m46-item',msg));
 }
 function navH(){const nv=$('#et-nav');document.body.style.setProperty('--m46-nav',((nv&&nv.offsetHeight)||0)+'px')}
 function syncDock(){navH();const root=$('.m46',app);if(!root)return;const [a,b]=startLabel();const g=$('.m46-go',root);if(!g)return;g.querySelector('b').textContent='🚃 '+a;g.querySelector('small').textContent=b;
  const sb=$('#station-start',app);g.classList.toggle('off',!sb||sb.disabled);
  const h=$('.m46-d-hotel',root);if(h){h.classList.toggle('off',!$('#daily-hotel',app));const dh=$('#daily-hotel',app),sm=h.querySelector('small');if(dh&&sm)sm.textContent=/夜间/.test(dh.textContent)?'夜间调查':'白天'}
  const lb=$('.m46-status .m46-linebtn',root);if(lb)lb.textContent=lineLabel(root)}
 function after(){layout();queueMicrotask(()=>route());setTimeout(()=>route(),0);setTimeout(()=>{route();schedule()},150);setTimeout(()=>{route();placeLabels()},600)}
 /* 其他页面（任务、背包、档案、邮件、设置、存档、街区）也套用像素窗和日间 / 夜间 */
 const PX_PAGES=new Set(['quest','bag','archive','mail','settings','saves','district']);
 let pq=false;
 function pageTheme(){pq=false;if(typeof app==='undefined'||!app)return;let cur='';try{cur=UI.current()}catch(e){}
  const map=!!$('.m46',app),sh=$(':scope > .rpg-shell',app),px=!!campaign&&!!sh&&(map||PX_PAGES.has(cur));
  if(!map)document.body.classList.remove('m46-page');
  document.body.classList.toggle('px-page',px);
  if(sh)sh.classList.toggle('px-ui',px&&!map);
  if(px){applyTheme();navH()}
  if(map)placeLabels()}
 function schedule(){if(pq)return;pq=true;queueMicrotask(pageTheme)}
 if(window.MutationObserver&&typeof app!=='undefined'&&app)new MutationObserver(schedule).observe(app,{childList:true});
 /* ---------- 车站名自动避让：每个站名在右 / 左 / 上 / 下四个位置里挑和别的站名、圆点重叠最少的 ---------- */
 const CAND=['lp-r','lp-l','lp-t','lp-b'];
 function ov(a,b){const x=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)),y=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));return x*y}
 function placeLabels(){const m=$('.m46 .m25',app);if(!m||!m.offsetWidth)return;const mr=m.getBoundingClientRect();
  const sts=[...m.querySelectorAll('.station')].filter(b=>b.querySelector('span'));if(!sts.length)return;
  const dots=sts.map(b=>{const r=b.querySelector('i').getBoundingClientRect();return {left:r.left-3,right:r.right+3,top:r.top-3,bottom:r.bottom+3}});
  const tags=[...m.querySelectorAll('.m25-tag,.m25-hud')].map(e=>e.getBoundingClientRect());
  const order=sts.map((b,i)=>i).sort((a,b)=>(sts[b].classList.contains('big')-sts[a].classList.contains('big'))||(dots[a].top-dots[b].top));
  const placed=[];
  for(const i of order){const b=sts[i],sp=b.querySelector('span');const pref=b.classList.contains('l')?['lp-l','lp-r','lp-t','lp-b']:CAND;
   if(b.querySelector('.m25-tag'))pref.splice(pref.indexOf('lp-t'),1);
   let best=null,bs=1e9;
   for(const c of pref){b.classList.remove(...CAND);b.classList.add(c);const r=sp.getBoundingClientRect();
    let sc=0;for(const p of placed)sc+=ov(r,p)*3;dots.forEach((d,j)=>{if(j!==i)sc+=ov(r,d)*4});for(const t of tags)sc+=ov(r,t)*2;
    const out=Math.max(0,mr.left-r.left)+Math.max(0,r.right-mr.right)+Math.max(0,mr.top-r.top)+Math.max(0,r.bottom-mr.bottom);sc+=out*r.height*2;
    sc+=pref.indexOf(c)*6; // 同分时按原来的偏好
    if(sc<bs){bs=sc;best=c}if(sc===0)break}
   b.classList.remove(...CAND);b.classList.add(best);placed.push(sp.getBoundingClientRect())}
 }
 let rt=0;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if($('.m46',app))placeLabels()},150)});
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(typeof app!=='undefined'&&app&&$('.m46',app))placeLabels()});
 window.addEventListener('resize',()=>{if($('.m46',app))navH()});
 return {layout,route,applyTheme,mode,night,after,placeLabels,pageTheme};
})();
window.MAP46=MAP46;
{const baseHome=tokyoHome;tokyoHome=function(){const r=baseHome.apply(this,arguments);try{if(UI.current()==='map')MAP46.after()}catch(e){console.error(e)}return r}}
{const baseSet=SETTINGS.set;SETTINGS.set=function(k,v){baseSet(k,v);if(k==='theme')MAP46.applyTheme()}}
try{GS.on(()=>MAP46.applyTheme())}catch(e){}
MAP46.applyTheme();

/* v47 酒店人物立绘（work/design/portraits.py 生成，96×144，显示时放大）：每人 7 种表情 + 初见无五官（_x） */
const TACHIE_DATA={"sato":{"base":"./assets/99-startup/ce225381478dda20.png","shock":"./assets/99-startup/e5fe7780368d97e1.png","guilt":"./assets/99-startup/8ebabbdefef2b546.png","tears":"./assets/99-startup/19243e455abc6b24.png","determined":"./assets/99-startup/790cfc7f606f63eb.png","hollow":"./assets/99-startup/370cfa8556851ead.png","relief":"./assets/99-startup/f670519972e03cba.png","_x":"./assets/99-startup/e86dafe0a9291e81.png"},"mori":{"base":"./assets/99-startup/329be795c8d71d6c.png","annoyed":"./assets/99-startup/991f260c7cfa01e7.png","shaken":"./assets/99-startup/b0bf935925f4e9f8.png","sneer":"./assets/99-startup/6ccf8f3280e7604a.png","bow":"./assets/99-startup/4758866256ad790b.png","fear":"./assets/99-startup/5015332eaa876fb9.png","glint":"./assets/99-startup/5195e568ed6ad25e.png","_x":"./assets/99-startup/44c8197da0694173.png"},"inoue":{"base":"./assets/99-startup/7ad52934d906679f.png","worry":"./assets/99-startup/647ec9b1dcd51ff3.png","fear":"./assets/99-startup/246170d40e03459d.png","sad":"./assets/99-startup/dd92d66450c5bb4b.png","laugh":"./assets/99-startup/863c0ab8be1d8f46.png","tears":"./assets/99-startup/d11ec8b76c49a673.png","surprise":"./assets/99-startup/bdef6a74f77b891b.png","_x":"./assets/99-startup/d1b7589a9b027b48.png"},"kobayashi":{"base":"./assets/99-startup/9e165b817c61a6b1.png","alert":"./assets/99-startup/60784b3fe03c1a5e.png","tired":"./assets/99-startup/560723c337086767.png","remorse":"./assets/99-startup/c8dc815d7e323292.png","smile":"./assets/99-startup/85ddbc9a08401568.png","anger":"./assets/99-startup/b355ac994dd38fda.png","peace":"./assets/99-startup/516b460d6f0a210e.png","_x":"./assets/99-startup/4065199c9e0b9192.png"},"takahashi":{"base":"./assets/99-startup/e1e448ba60c3aeaf.png","wary":"./assets/99-startup/5fdc745e96c594c6.png","flustered":"./assets/99-startup/bb5395040ab98a51.png","sigh":"./assets/99-startup/c97e3c145b396a6f.png","smirk":"./assets/99-startup/92d076bc2b7cac5b.png","laugh":"./assets/99-startup/1319366ebef2e518.png","cold":"./assets/99-startup/4f3b506565b97050.png","_x":"./assets/99-startup/b44663f08fc5ae27.png"},"oldman":{"base":"./assets/99-startup/f82890d1c2303155.png","smile":"./assets/99-startup/f7d0850b434e45b2.png","lonely":"./assets/99-startup/b55c9715524d883f.png","gaze":"./assets/99-startup/6afad5c152fd7f10.png","blank":"./assets/99-startup/b777b11bbf68e44d.png","tears":"./assets/99-startup/487e5ac41b44a5f3.png","whisper":"./assets/99-startup/24508c1b512a7793.png","_x":"./assets/99-startup/3ced1f785bc81237.png"},"katayama":{"base":"./assets/99-startup/2a386d8597f03db1.png","laugh":"./assets/99-startup/a1be4452f2215860.png","lonely":"./assets/99-startup/552b0bccd2a171a9.png","remember":"./assets/99-startup/3bda971ea0e98624.png","surprise":"./assets/99-startup/9ea84d94ddc0ce78.png","shy":"./assets/99-startup/62925f248f332848.png","tears":"./assets/99-startup/b96e249cc35f5c35.png","_x":"./assets/99-startup/531689d5b28261a3.png"},"tanaka":{"base":"./assets/99-startup/e335e0f658929588.png","wry":"./assets/99-startup/1a9eaf91d1ca78fc.png","worry":"./assets/99-startup/63a6c56cf4575016.png","angry":"./assets/99-startup/10cb49defd1e4b86.png","tears":"./assets/99-startup/33a5b08aa9db4a51.png","laugh":"./assets/99-startup/13d5baa12b082f94.png","cold":"./assets/99-startup/c31e165ced80b0fa.png","_x":"./assets/99-startup/03d92d0b97bfe996.png"}};
const TACHIE_LABELS={"sato":{"base":"职业微笑","shock":"惊慌","guilt":"愧疚","tears":"含泪","determined":"决意","hollow":"空洞","relief":"安心"},"mori":{"base":"冷静","annoyed":"不悦","shaken":"动摇","sneer":"冷笑","bow":"致歉","fear":"恐惧","glint":"镜片反光"},"inoue":{"base":"和蔼","worry":"担心","fear":"害怕","sad":"难过","laugh":"开怀","tears":"落泪","surprise":"吃惊"},"kobayashi":{"base":"坚毅","alert":"警惕","tired":"疲惫","remorse":"愧疚","smile":"浅笑","anger":"发怒","peace":"释然"},"takahashi":{"base":"冷淡","wary":"警惕","flustered":"慌乱","sigh":"叹气","smirk":"嘲笑","laugh":"大笑","cold":"冷视"},"oldman":{"base":"平静","smile":"微笑","lonely":"寂寞","gaze":"望向你","blank":"空洞","tears":"含泪","whisper":"低语"},"katayama":{"base":"温和","laugh":"笑","lonely":"寂寞","remember":"怀念","surprise":"惊讶","shy":"害羞","tears":"含泪"},"tanaka":{"base":"严肃","wry":"苦笑","worry":"担心","angry":"激动","tears":"含泪","laugh":"大笑","cold":"冷眼"}};
window.TACHIE_DATA=TACHIE_DATA;window.TACHIE_LABELS=TACHIE_LABELS;

/* ===================================================================
   v47：酒店人物立绘（对话框左侧的半身像）＋ 按台词自动选表情
   - 数据：TACHIE_DATA（97zf-tachie-data.js），每人 4 种表情 + 初见无五官（_x）
   - 初见：第一次和这个人说话（met 之前）的那一整段对话，用无五官的版本
   - 表情：按这句台词的日语 / 中文、对方的压力值（stress）自动判断情绪，再映射到这个人的 4 种表情
   =================================================================== */
const TACHIE=(function(){
 const MATCH={sato:['佐藤','フロント','前台'],mori:['森'],inoue:['井上'],kobayashi:['小林'],takahashi:['高桥','高橋'],oldman:['看报纸的老人','穿旧西装的老人','残影','老人'],tanaka:['田中']};
 /* 片山 茂（生前 / 回忆里）：说话人是「片山」「片山 茂」「片山 茂 · 窗边」；「片山的信」「片山的笔记」这类物品不算；「片山 茂（残影）」仍是看报纸的老人 */
 const KATA=/^片山(?:\s*茂)?(?:\s*[·・(（](?!残影).*)?$/;
 const URLS=new Set();for(const k in TACHIE_DATA)for(const e in TACHIE_DATA[k])URLS.add(TACHIE_DATA[k][e]);
 let first=null;
 /* 情绪 → 每个人的表情 */
 const MAP={
  sato:{shock:'shock',fear:'shock',sad:'guilt',guilt:'guilt',press:'guilt',tears:'tears',angry:'determined',wary:'guilt',quiet:'guilt',tired:'hollow'},
  mori:{angry:'annoyed',wary:'annoyed',press:'shaken',shock:'shaken',fear:'fear',guilt:'bow',sneer:'sneer'},
  inoue:{wary:'worry',quiet:'worry',sad:'sad',guilt:'sad',tears:'tears',fear:'fear',shock:'surprise',press:'worry',smile:'laugh'},
  kobayashi:{wary:'alert',angry:'anger',shock:'alert',fear:'alert',tired:'tired',guilt:'remorse',sad:'remorse',tears:'remorse',press:'remorse',smile:'smile'},
  takahashi:{wary:'wary',angry:'cold',shock:'flustered',fear:'flustered',press:'flustered',sad:'sigh',guilt:'sigh',tired:'sigh',quiet:'sigh',sneer:'smirk'},
  oldman:{smile:'smile',sad:'lonely',guilt:'lonely',tears:'tears',quiet:'lonely',wary:'gaze',fear:'gaze',shock:'gaze'},
  katayama:{smile:'laugh',sad:'lonely',guilt:'lonely',tears:'tears',quiet:'remember',wary:'base',fear:'lonely',shock:'surprise'},
  tanaka:{smile:'wry',sad:'worry',guilt:'worry',quiet:'worry',angry:'angry',shock:'angry',press:'worry',tears:'tears',sneer:'cold'}
 };
 /* 关键词（日语 / 中文）。按顺序判断，先命中的优先 */
 const RULES=[
  ['tears',/泣|涙|哭|眼泪|落泪/],
  ['shock',/まさか|えっ|え？|そんな…|そんなはず|！\?|!\?|？！|……？|吓了一跳|怎么会|什么？|不会吧/],
  ['fear',/怖|こわ|恐ろし|虫|臭い|気味が悪|害怕|可怕|吓|发抖|震え|臭味/],
  ['angry',/いい加減|ふざけ|やめろ|やめて|帰って|出て行|黙れ|何度言|别再|够了|滚|住口|不要再问/],
  ['guilt',/すみません|すいません|ごめん|申し訳|俺が悪|私が悪|悪かったな|私のせい|对不起|抱歉|是我的错|都怪我/],
  ['sneer',/ふん|フン|ふっ|哼|冷笑/],
  ['tired',/疲れ|眠い|眠れな|累了|好累|困了|没睡/],
  ['sad',/寂し|さびし|残念|かわいそう|亡くな|会えない|一人で|孤单|难过|可惜|寂寞|伤心/],
  ['smile',/ありがと|よかった|ふふ|はは|いらっしゃい|おはよう|こんにちは|どうぞ|谢谢|太好了|欢迎|早安|哈哈/],
  ['wary',/なぜ|なんで[？?]|どうして|誰が|誰に|誰だ|どなた|何の用|調べ|为什么|是谁|你想知道|调查|打听/]
 ];
 function idOf(who){if(!who)return null;if(!who.includes('残影')&&KATA.test(who.trim())&&TACHIE_DATA.katayama)return 'katayama';for(const [id,ps] of Object.entries(MATCH))if(TACHIE_DATA[id]&&ps.some(p=>who.includes(p)))return id;return null}
 function textOf(node,line){const o=line||node||{};const v=x=>{if(typeof x==='string')return x;if(!x||typeof x!=='object')return '';try{if(window.H18&&H18.pick){const r=H18.pick(x);if(typeof r==='string')return r}}catch(e){}return Object.values(x).join(' ')};return [v(o.jp),v(o.zh),v(o.text),v(o.tr)].join(' ')}
 function mood(t,stress){
  for(const [m,re] of RULES)if(re.test(t))return m;
  if(stress>=3)return 'press';
  const bare=t.replace(/[\s「」『』…。、.]/g,'');if(t.includes('……')&&bare.length<10)return 'quiet';
  return null}
 function pick(id,node,line,stress){const m=mood(textOf(node,line),stress||0);const e=m&&MAP[id][m];return e&&TACHIE_DATA[id][e]?e:'base'}
 /* H18 的 portraitFor 调用：返回立绘的 dataURL；不是立绘人物时返回 '' 交给原来的头像 */
 function forHotel(who,node,line,stress){const id=idOf(who);if(!id)return '';
  if(first===id)return TACHIE_DATA[id]._x;
  return TACHIE_DATA[id][pick(id,node,line,stress)]}
 return {
  forHotel,idOf,pick,mood,
  meet:(id,isFirst)=>{first=isFirst?id:null},
  is:u=>!!u&&URLS.has(u),
  firstId:()=>first
 };
})();
window.TACHIE=TACHIE;

/* ===================================================================
   v48：人物专属结局（佐藤 / 森 / 田中 / 小林 / 高桥）的立绘演出
   - 结局原来的画面（地图背景 + 下面一行字）不动，在画面左侧叠一张立绘
   - 每翻一页按文字切换表情：先查本结局的关键句表（KEY），查不到再用 TACHIE 的自动判断，旁白里没有情绪时保持上一张
   - 「你」说的话（指认、追问）立绘变暗；“……”中文翻译页沿用上一页
   =================================================================== */
const ENDTACHIE=(function(){
 const PLAYER=/殺したのは|お金に困って|お金が目当て|あの日、二人で|本当に、それだけ/;
 const KEY={
  sato:[[/私、ですか/,'shock'],[/^「……はい。」/,'guilt'],[/お金は、必要/,'guilt'],[/取っていません/,'determined'],[/仕事を失いたくなかった/,'guilt'],[/母は、何度/,'guilt'],[/兄は、ずっと/,'guilt'],[/もう……いない/,'tears'],[/理由にならない/,'tears'],[/私まで仕事を/,'tears'],[/……殺していません/,'hollow'],[/誰にも言えません/,'guilt'],[/兄とこの家族のためなら/,'determined'],
        [/佐藤看了一眼/,'shock'],[/没有否认|低着头|攥着/,'guilt'],[/抬起头/,'determined'],[/电话铃声|没有去接|响了很久/,'hollow'],[/声音很轻/,'hollow']],
  mori:[[/何を根拠に/,'base'],[/……金ですか/,'annoyed'],[/借金があれば/,'sneer'],[/片山さんを殺してはいません/,'annoyed'],[/警察を呼べば/,'bow'],[/ホテルの営業も/,'bow'],[/怖かったんです/,'fear'],[/一度隠して/,'shaken'],[/でも、殺してはいない/,'shaken'],[/それだけは、違います/,'glint'],
        [/没有拿起报告|只是看着你/,'base'],[/目光停在/,'annoyed'],[/停止翻页|安静下来/,'bow'],[/他低下头/,'shaken'],[/推回你的面前/,'glint']],
  kobayashi:[[/……そうです/,'remorse'],[/私が殺しました/,'peace'],[/逃げるのは疲れ/,'tired'],[/他人の名前で/,'tired'],[/よくしてもらいました/,'smile'],[/誰かの役に立ちたかった/,'remorse'],[/本名で死にたい/,'base'],
        [/没有说话|轻轻点头/,'remorse'],[/声音很平静/,'peace'],[/旧照片/,'tired'],[/自己的双手/,'remorse'],[/警察署|值班警员|没有回避/,'base']],
  tanaka:[[/……は？/,'base'],[/……おい/,'cold'],[/何言ってんだ/,'angry'],[/なるほどな/,'wry'],[/妬んで、金目当て/,'cold'],[/ふざけんなよ/,'angry'],[/妬んでたよ/,'worry'],[/昔っから/,'wry'],[/茂ってやつは/,'wry'],[/俺が将来/,'worry'],[/カメラ一つ/,'wry'],[/俺が教えたカメラ/,'wry'],[/結局ずっと/,'worry'],[/田舎でバス/,'worry'],[/余計な欲/,'worry'],[/宝くじ/,'wry'],[/羨ましかったよ/,'tears'],[/嫌になるくらい/,'tears'],[/だから何だよ/,'cold'],[/突き飛ばした/,'worry'],[/^「……ああ。」/,'worry'],[/だからって殺すかよ/,'angry'],[/何十年の付き合い/,'angry'],[/後ろをついて回って/,'angry'],[/何しに東京/,'angry'],[/会いに来たんだよ/,'tears'],[/くだらねえ約束/,'tears'],[/ひでえこと/,'angry'],[/見栄張って/,'angry'],[/悪くねえことくらい/,'angry'],[/でもな/,'angry'],[/死んでほしいなんて/,'tears'],[/^「……で？」/,'cold'],[/六日間の成果/,'cold'],[/借金がある/,'cold'],[/だから俺が殺した/,'cold'],[/お前さ/,'cold'],[/人の話、ちゃんと/,'cold'],[/頼んだんだ/,'angry'],[/お前の出した答え/,'angry'],[/何が調査員/,'angry'],[/筋書き/,'angry'],[/^「……帰れ。」/,'cold'],[/帰れっつってんだろ/,'angry'],[/二度と/,'angry'],[/役立たず/,'angry'],
        [/笑了一声/,'wry'],[/扔回桌上/,'angry'],[/猛地站起来|撞上|砸了一下/,'angry'],[/喘着气/,'worry'],[/转过身|再也没有看你/,'cold']],
  takahashi:[[/……はい？/,'flustered'],[/……私が？/,'flustered'],[/ちょっと待って/,'wary'],[/ああ、なるほど/,'cold'],[/不倫がバレたから/,'cold'],[/ふふっ/,'laugh'],[/すみません、ちょっと/,'laugh'],[/六日間、何を調べ/,'laugh'],[/確認させて/,'base'],[/不倫していました/,'base'],[/見られました/,'base'],[/嘘もつきました/,'base'],[/全部事実/,'base'],[/^「で？」/,'cold'],[/いきなり殺人/,'cold'],[/こういうことですか/,'smirk'],[/可能性が高い』/,'smirk'],[/可能性が高い？/,'cold'],[/根拠は/,'cold'],[/さっき聞きました|それも聞きました/,'base'],[/何も増えてない/,'cold'],[/あのですね/,'base'],[/認めます/,'base'],[/殺した覚えはありません/,'cold'],[/探偵さん/,'smirk'],[/議員が出てきた時点/,'smirk'],[/政治家、不倫/,'smirk'],[/見出しには困りません/,'smirk'],[/ゴシップ/,'cold'],[/週刊誌の読みすぎ/,'smirk'],
        [/打印机|核对这个月/,'base'],[/高桥抬起头/,'flustered'],[/突然笑了|笑得越来越厉害|擦了擦眼角|又笑了一声/,'laugh'],[/止住笑声/,'base'],[/红笔|推回你的面前/,'cold'],[/嘴角微微扬起/,'smirk']]
 };
 /* 画面效果：小林的清晨冷光、田中拍桌时的震动、佐藤那边一直响的电话 */
 const FX={kobayashi:[[/第二天清晨|警察署|值班警员|没有回避|本名で死にたい|真名死去/,'dawn']],tanaka:[[/猛地站起来|撞上身后|砸了一下桌子|狠狠扔向你/,'shake']],sato:[[/电话铃声|响了很久|没有去接/,'ring']]};
 let cur=null;
 function attach(id,cv,p){
  if(!window.TACHIE_DATA||!TACHIE_DATA[id]||!cv||!p)return;detach();
  const wrap=document.createElement('div');wrap.className='et-wrap';cv.parentNode.insertBefore(wrap,cv);wrap.appendChild(cv);
  const img=document.createElement('img');img.className='et-tachie';img.alt='';img.src=TACHIE_DATA[id].base;wrap.appendChild(img);
  // 原来放在文字旁边的小头像（田中那段有）：有立绘以后不再显示
  p.parentNode.querySelectorAll(':scope>img').forEach(im=>{if(im!==img)im.style.display='none'});
  const st={id,img,wrap,cv,p,exp:'base',dim:false};cur=st;
  const upd=()=>{if(cur!==st)return;const t=(p.textContent||'').trim();if(!t)return;
   if(/^[“"]/.test(t))return;                                       // 中文翻译页：沿用上一页
   const mine=PLAYER.test(t);let e=null;
   if(!mine){for(const [re,x] of KEY[id]||[])if(re.test(t)){e=x;break}
    if(!e&&/^「/.test(t)){try{e=TACHIE.pick(id,{jp:t},null,0)}catch(err){}}}
   st.dim=mine;img.classList.toggle('dim',mine);
   if(e&&TACHIE_DATA[id][e]&&e!==st.exp){st.exp=e;img.src=TACHIE_DATA[id][e];img.classList.remove('pop');void img.offsetWidth;img.classList.add('pop')}
   for(const [re,cls] of FX[id]||[]){const on=re.test(t);if(cls==='shake'){if(on){wrap.classList.remove('fx-shake');void wrap.offsetWidth;wrap.classList.add('fx-shake')}}else if(cls==='dawn'){if(on)wrap.classList.add('fx-dawn')}else wrap.classList.toggle('fx-'+cls,on)}
   img.dataset.exp=st.exp};
  st.obs=new MutationObserver(upd);st.obs.observe(p,{childList:true,characterData:true,subtree:true});upd();
 }
 function detach(){if(cur){cur.obs?.disconnect();if(cur.wrap.isConnected){cur.wrap.before(cur.cv);cur.wrap.remove()}cur=null}}
 function find(){
  const m=document.querySelector('.et-modal-back');
  if(m)return [m.querySelector('canvas'),m.querySelector('p')];
  for(const [c,t] of [['#mo-scene','#mo-text'],['#kn-scene','#kn-text']]){const a=document.querySelector(c);if(a)return [a,document.querySelector(t)]}
  return [null,null]}
 function hook(id,obj,fn,onlyKey){
  if(!obj||typeof obj[fn]!=='function')return;const base=obj[fn];
  obj[fn]=function(){const r=base.apply(this,arguments);if(onlyKey&&arguments[0]!==onlyKey)return r;
   try{const [cv,p]=find();if(cv&&p&&!cv.closest('.et-wrap'))attach(id,cv,p)}catch(e){console.error(e)}return r}}
 /* 森、小林两个结局的原文里，日语台词和中文翻译是两段：合成一页显示 */
 function mergeTr(list){const out=[];for(const x of list){const t=String(x).trim();if(out.length&&/^[“"]/.test(t)&&/^「/.test(out[out.length-1].trim())&&!out[out.length-1].includes('\n“')){out[out.length-1]+='\n'+t}else out.push(x)}return out}
 return {attach,detach,hook,mergeTr,state:()=>cur&&{id:cur.id,exp:cur.exp,dim:cur.dim}};
})();
window.ENDTACHIE=ENDTACHIE;
/* 这几个模块在本文件之后才定义：等整段脚本跑完再挂上 */
setTimeout(()=>{
 ENDTACHIE.hook('sato',window.SATO,'ending');
 ENDTACHIE.hook('mori',window.MORI,'ending');
 ENDTACHIE.hook('kobayashi',window.KBRANCH,'ending');
 ENDTACHIE.hook('tanaka',window.TANAKA,'cinema','ending');
 ENDTACHIE.hook('takahashi',window.YUMI,'play','ending');
},0);

/* ===================================================================
   v49（设计中）：新版像素小人 SPRITE2
   - 24×34 逻辑像素，1:1 画在地图上（原来是 16×16 放大 2 倍）；脚底对齐原来的格子
   - 和立绘对应：每个人的发型、衣服、标志物（丝巾、眼镜+红领带、发髻+围裙+毛巾、帽子+胸章、齐肩发+珍珠+账本、报纸、工作证）
   - 四个方向（left = right 镜像）× 3 帧（站立 / 迈左脚 / 迈右脚）；深色描边 + 左上来光
   =================================================================== */
const SPRITE2=(function(){
 const W=24,H=34,OUT='#0b0d14';
 function hex(c){c=c.replace('#','');return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]}
 function sh(c,k){const [r,g,b]=hex(c);const f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}
 /* 人物规格：s 皮肤 h 头发 b 上衣 i 内衬 t 领带/丝巾 p 裤子/裙子 k 鞋 */
 const SPEC={
  player:{s:'#e8c4a0',h:'#2a2f3a',b:'#3f8f86',i:'#2d6f68',p:'#2a3040',k:'#1a1d24',hair:'short',top:'hoodie',bottom:'pants',acc:['bag']},
  sato:{s:'#efc9a6',h:'#2a1d19',b:'#2b3c68',i:'#f0f0f2',t:'#8d2f3c',p:'#2b3c68',k:'#1a1a22',hair:'bob',top:'blazer',bottom:'skirt',acc:['scarf','nametag'],fem:true},
  mori:{s:'#e6bb94',h:'#8a8c90',b:'#24252b',i:'#eceef0',t:'#a33838',p:'#24252b',k:'#121216',hair:'neat',top:'suit',bottom:'pants',acc:['glasses','tie']},
  inoue:{s:'#ebc29c',h:'#bdbdbd',b:'#7f9e8a',i:'#e8ece6',p:'#5e6a64',k:'#2a2a2a',hair:'bun',top:'smock',bottom:'pants',acc:['apron','towels'],fem:true},
  kobayashi:{s:'#e0ad86',h:'#8e8f93',b:'#34476e',i:'#b9c6dc',t:'#1e2a44',p:'#2a3654',k:'#15151b',hair:'cap',cap:'#273657',top:'uniform',bottom:'pants',acc:['badge','radio','mustache']},
  takahashi:{s:'#efc8a3',h:'#33251f',b:'#565e6c',i:'#ece2cc',p:'#4c5361',k:'#1d1d24',hair:'longbob',top:'blazer',bottom:'skirt',acc:['pearls','ledger','nametag'],fem:true},
  oldman:{s:'#e3c2a2',h:'#e4e4e2',b:'#8a7f6a',i:'#e9e6dc',t:'#5f5140',p:'#6e6556',k:'#2a2620',hair:'thin',top:'suit',bottom:'pants',acc:['tie','paper']},
  katayama:{s:'#e3c2a2',h:'#e4e4e2',b:'#8a7f6a',i:'#e9e6dc',t:'#5f5140',p:'#6e6556',k:'#2a2620',hair:'thin',top:'suit',bottom:'pants',acc:['tie','letter']},
  girlA:{s:'#e9bf9c',h:'#302227',b:'#887176',i:'#c7b8a0',p:'#373344',k:'#2a2228',hair:'pony',top:'smock',bottom:'skirt',acc:['box'],fem:true},
  alley_courier:{s:'#d9b38d',h:'#394f57',b:'#6b7f85',i:'#c9ad76',p:'#46546a',k:'#24232a',hair:'cap',cap:'#3e5560',top:'jacket',bottom:'pants',acc:['box']},
  alley_smoker:{s:'#e3bc9d',h:'#292736',b:'#687c64',i:'#c9ad76',p:'#3e4552',k:'#24232a',hair:'messy',top:'jacket',bottom:'pants',acc:['cig','stubble']},
  shop_owner:{s:'#e4c19b',h:'#3b302d',b:'#8a604c',i:'#e6dcc4',p:'#46546a',k:'#24232a',hair:'thin',top:'smock',bottom:'pants',acc:['apron','mustache'],apron:'#5a4636'},
  shop_commuter:{s:'#ddba9a',h:'#253448',b:'#3d4a5c',i:'#e8ecf2',t:'#5d7fa0',p:'#2f3846',k:'#18181e',hair:'neat',top:'suit',bottom:'pants',acc:['tie','case']},
  shop_walker:{s:'#dfb494',h:'#8d8790',b:'#96725b',i:'#e6dcc4',p:'#4c4650',k:'#2a2420',hair:'bun',top:'smock',bottom:'skirt',acc:['bag2'],fem:true},
  shop_bicyclist:{s:'#d5ab89',h:'#30364b',b:'#a17843',i:'#e8d8b0',p:'#3a3f4c',k:'#1a1a20',hair:'cap',cap:'#c9a23a',top:'jacket',bottom:'pants',acc:['bag2']},
  day_traveler:{s:'#e8c4a0',h:'#4a3a2a',b:'#5a7a9a',i:'#e8e2cc',p:'#3a4250',k:'#222',hair:'messy',top:'hoodie',bottom:'pants',acc:['suitcase']},
  day_guest:{s:'#e8c4a0',h:'#2a2a30',b:'#4a4e5a',i:'#eceef0',t:'#6a3a4a',p:'#2e313a',k:'#18181e',hair:'neat',top:'suit',bottom:'pants',acc:['tie','glasses','case']},
  day_maid:{s:'#ecc4a0',h:'#2a1d1a',b:'#6a7d8a',i:'#e8ece6',p:'#4a5560',k:'#222',hair:'bun',top:'smock',bottom:'skirt',acc:['apron'],fem:true},
  day_clerk:{s:'#efc9a6',h:'#3a2a24',b:'#3e4656',i:'#ece2cc',p:'#363c4a',k:'#1a1a20',hair:'bob',top:'blazer',bottom:'skirt',acc:['glasses','nametag'],fem:true},
  tanaka:{s:'#d9a47c',h:'#9a9b9e',b:'#2c3646',i:'#a9bccf',p:'#262d3a',k:'#14161c',hair:'crew',top:'jacket',bottom:'pants',acc:['card','stubble']}
 };
 /* ---------- v54 新路人 v2：通勤族 / 居民 / 学生 / 游客，四类 12 种固定造型 ----------
    extra(o) 在头发之后、描边之前画；under(o) 在腿之前画。街区路人用 {look:'v2_xxx'} 指定造型。 */
 /* ---- 共用的小部件 ---- */
 function shoulderBag(o,col,front){ // 斜挎包：front=包在身前右侧
  const {R,P,side,back}=o,d=o.sh(col,-.3);
  if(back){R(4,20,4,5,col);R(4,24,4,1,d);P(16,16,d);P(15,17,d);P(14,18,d);return}
  if(side){R(8,20,4,5,col);R(8,24,4,1,d);return}
  P(7,16,d);P(8,17,d);P(9,18,d);P(10,19,d);R(15,21,5,5,col);R(15,21,5,1,o.sh(col,.15));R(15,25,5,1,d);P(17,23,'#c9a670');
 }
 function backpackStraps(o,col){const {R,side,back}=o;if(back||side)return;R(6,16,1,6,col);R(17,16,1,6,col)}
 function backpackBack(o,col,big){const {R,P,side,back}=o,d=o.sh(col,-.3),l=o.sh(col,.15);
  if(back){if(big){R(5,13,14,15,col);R(5,13,14,1,l);R(17,14,2,14,d);R(7,20,10,4,d);R(8,24,8,1,'#2a2a2a')}else{R(7,17,10,8,col);R(7,17,10,1,l);R(16,18,1,7,d);R(9,21,6,2,d)}return}
  if(side){if(big){R(4,13,5,15,col);R(4,13,5,1,l);R(4,20,1,6,d)}else{R(6,17,3,8,col);R(6,17,3,1,l)}}
 }
 function socks(o,col){const {R,side}=o;if(side){R(10,30,3,2,col);R(13,30,3,2,col)}else{R(8,30,3,2,col);R(13,30,3,2,col)}}
 function longSkirt(o){const {R,side,back,pt,ptD}=o;
  if(side){R(8,23,9,8,pt);R(15,23,2,8,ptD);R(8,30,9,1,ptD)}else{R(6,23,12,8,pt);R(16,23,2,8,ptD);R(6,30,12,1,ptD);if(!back){R(9,24,1,6,ptD);R(14,24,1,6,ptD)}}}
 function shortsLegs(o){const {R,side,skin,step}=o,sk=o.sh(skin,-.05);
  if(side){R(9,29,3,3-(step>0?1:0),sk);R(12,29,3,3-(step<0?1:0),o.sh(skin,-.15))}
  else{R(7,29,4,3-(step>0?1:0),sk);R(13,29,4,3-(step<0?1:0),sk);R(16,29,1,3-(step<0?1:0),o.sh(skin,-.15))}}

 const V2LIST=[
  /* ============ 01 通勤族 ============ */
  {id:'v2_salaryman',group:0,name:'上班族',note:'深蓝西装 · 红斜纹领带 · 公文包',
   spec:{s:'#e8c4a0',h:'#22252e',b:'#2c3448',i:'#eef0f2',t:'#8a2a32',p:'#2a3142',k:'#15151a',hair:'neat',top:'suit',bottom:'pants',acc:['tie','case'],
    extra(o){const {P,side,back}=o;if(back)return;if(side){P(15,19,'#c9737a')}else{P(11,19,'#c9737a');P(12,21,'#c9737a');P(11,23,'#5a1a20')}}}},
  {id:'v2_officewoman',group:0,name:'职员',note:'灰西装 · 米色衬衫 · 低发髻 · 棕色肩包',
   spec:{s:'#efc9a6',h:'#4a342a',b:'#6a6c72',i:'#e6d6c0',p:'#5e6066',k:'#1a1a20',hair:'bun',top:'blazer',bottom:'pants',acc:[],fem:true,
    extra(o){shoulderBag(o,'#6a4630')}}},
  {id:'v2_glasses',group:0,name:'眼镜青年',note:'卡其夹克 · 白衬衫 · 背包 · 长柄伞',
   spec:{s:'#e6c09c',h:'#2a2420',b:'#a89070',i:'#eeeeea',p:'#5a4434',k:'#3a2418',hair:'messy',top:'jacket',bottom:'pants',acc:['glasses'],
    under(o){const {R,side,back}=o;if(back)R(2,19,2,14,'#3d4c6e')},
    extra(o){const {R,P,side,back,step}=o;backpackBack(o,'#4a4a50');backpackStraps(o,'#3a3a40');
     if(back)return;if(side){R(13+step,21,2,12,'#3d4c6e');P(13+step,20,'#6a4a2a');P(14+step,19,'#6a4a2a')}
     else{R(20,19,2,14,'#3d4c6e');R(21,19,1,14,'#2c3854');P(19,18,'#6a4a2a');P(20,17,'#6a4a2a');P(21,17,'#6a4a2a');P(20,33,'#1a1a20')}}}},

  /* ============ 02 居民 ============ */
  {id:'v2_housewife',group:1,name:'主妇',note:'酒红开衫 · 碎花上衣 · 墨绿长裙 · 菜篮布袋',
   spec:{s:'#ebc29c',h:'#4a3228',b:'#7a3440',i:'#e6d0c8',p:'#4a5640',k:'#4a3020',hair:'bob',top:'smock',bottom:'skirt',acc:[],fem:true,
    extra(o){const {R,P,side,back}=o;longSkirt(o);
     if(!side&&!back){R(9,16,6,6,'#e6d0c8');P(10,17,'#c86a7a');P(13,18,'#a87aa8');P(11,20,'#c86a7a');P(14,21,'#a87aa8');R(9,16,1,7,o.clD);R(14,16,1,7,o.clD)}
     const tote=(x,y)=>{R(x,y+3,6,7,'#e6dcc4');R(x,y+9,6,1,'#c8bea6');P(x+1,y+2,'#c8bea6');P(x+4,y+2,'#c8bea6');R(x+1,y,1,3,'#5fa04a');R(x+3,y-1,2,4,'#4a8a3a');P(x+2,y+1,'#e8d870')};
     if(side)tote(9+o.step,20);else tote(1,19)}}},
  {id:'v2_oldman',group:1,name:'老爷爷',note:'灰夹克 · 格子衬衫 · 银发眼镜 · 购物拉车',
   spec:{s:'#e3c2a2',h:'#c8c8c6',b:'#8a8a86',i:'#6a6a78',p:'#4a4846',k:'#3a2a20',hair:'thin',top:'jacket',bottom:'pants',acc:['glasses'],
    extra(o){const {R,P,side,back}=o,fr='#8a8e96',bag='#4a5670',pl='#7a86a0';
     if(!side&&!back){P(10,16,'#9a9aa8');P(12,17,'#9a9aa8');P(11,18,'#9a9aa8')}
     if(back){R(19,24,1,8,fr);R(18,25,5,6,bag);P(19,32,'#1a1a1a');P(22,32,'#1a1a1a');return}
     if(side){R(17,22,1,10,fr);R(16,22,2,1,fr);R(18,24,5,7,bag);R(18,26,5,1,pl);R(20,24,1,7,pl);R(18,31,2,2,'#1a1a1a');R(21,31,2,2,'#1a1a1a');return}
     R(6,23,12,1,fr);R(7,23,1,10,fr);R(16,23,1,10,fr);R(8,25,8,7,bag);R(8,27,8,1,pl);R(8,30,8,1,pl);R(10,25,1,7,pl);R(13,25,1,7,pl);
     R(6,32,3,2,'#1a1a1a');R(15,32,3,2,'#1a1a1a');P(7,32,'#5a5a5a');P(16,32,'#5a5a5a')}}},
  {id:'v2_youngman',group:1,name:'青年住户',note:'橄榄绿外套 · 米色 T 恤 · 帆布托特包',
   spec:{s:'#e6c09c',h:'#3a2a20',b:'#5a6a3e',i:'#e6dcc4',p:'#3e4232',k:'#e8e6e0',hair:'messy',top:'jacket',bottom:'pants',acc:[],
    extra(o){const {R,P,side,back}=o,t='#e2d8c0',td='#c2b8a0';
     if(back){R(4,20,4,7,t);R(4,26,4,1,td);R(5,16,1,4,td);return}
     if(side){R(7,19,4,7,t);R(7,25,4,1,td);return}
     R(16,15,1,5,td);R(17,20,4,7,t);R(17,26,4,1,td);P(18,22,td)}}},

  /* ============ 03 学生 ============ */
  {id:'v2_gakuran',group:2,name:'男高中生',note:'立领学生服 · 金扣 · 黑背包',
   spec:{s:'#e8c4a0',h:'#1e2028',b:'#222838',i:'#222838',p:'#222838',k:'#141418',hair:'messy',top:'smock',bottom:'pants',acc:[],
    extra(o){const {R,P,side,back}=o;backpackBack(o,'#2a2a30');backpackStraps(o,'#2a2a30');
     if(back)return;const gold='#d8b45a';
     if(side){R(13,15,4,1,o.sh('#222838',-.4));P(16,18,gold);P(16,21,gold);P(16,24,gold);return}
     R(9,15,6,1,o.sh('#222838',-.4));R(11,16,2,10,o.sh('#222838',-.25));P(12,17,gold);P(12,19,gold);P(12,21,gold);P(12,23,gold);P(12,25,gold)}}},
  {id:'v2_sailor',group:2,name:'女高中生',note:'米色开衫 · 红领结 · 百褶裙 · 黑长袜',
   spec:{s:'#efc9a6',h:'#2a2228',b:'#d8c8a8',i:'#f2f0ea',p:'#2e3450',k:'#3a2418',hair:'bob',top:'smock',bottom:'skirt',acc:[],fem:true,
    extra(o){const {R,P,side,back}=o,sk='#2e3450',skd='#1e2238';
     if(side){R(8,24,9,5,sk);R(15,24,2,5,skd);for(let x=9;x<16;x+=2)R(x,25,1,4,skd)}else{R(6,24,12,5,sk);R(6,24,12,1,o.sh(sk,.15));for(let x=7;x<17;x+=2)R(x,25,1,4,skd)}
     backpackBack(o,'#2e3040');backpackStraps(o,'#2e3040');socks(o,'#24242c');
     if(back)return;if(side){R(14,16,2,2,'#9a3040');return}
     R(9,16,6,1,'#f2f0ea');R(10,17,4,2,'#9a3040');P(11,19,'#7a2030');P(12,19,'#7a2030')}}},
  {id:'v2_hoodie',group:2,name:'耳机少女',note:'灰蓝连帽衫 · 颈挂耳机 · 工装裤 · 斜挎包',
   spec:{s:'#efc9a6',h:'#2a2028',b:'#5a6280',i:'#6a7290',p:'#c8c0a8',k:'#e8e6e0',hair:'bun',top:'hoodie',bottom:'pants',acc:[],fem:true,
    extra(o){const {R,P,side,back}=o,hp='#e8e6e0',hd='#a8a6a0';shoulderBag(o,'#5a4030');
     if(back){R(7,14,10,1,hd);return}
     if(side){R(13,13,3,3,hp);P(14,14,hd);R(12,28,3,2,o.ptD);return}
     R(6,13,3,3,hp);R(15,13,3,3,hp);P(7,14,hd);P(16,14,hd);R(9,15,6,1,hd);
     R(7,28,2,2,o.ptD);R(15,28,2,2,o.ptD)}}},

  /* ============ 04 游客 ============ */
  {id:'v2_sunhat',group:3,name:'草帽游客',note:'宽檐草帽 · 条纹衫 · 相机 · 阔腿裤',
   spec:{s:'#efc9a6',h:'#5a3a28',b:'#ece4d4',i:'#ece4d4',p:'#8a7a50',k:'#e8e6e0',hair:'longbob',top:'jacket',bottom:'pants',acc:[],fem:true,
    extra(o){const {R,P,side,back}=o,hat='#d8c49a',hl='#ead8b0',band='#3a4258';
     backpackBack(o,'#3a3a40');
     if(side){R(5,4,16,2,hat);R(5,4,16,1,hl);R(9,0,9,4,hat);R(9,0,9,1,hl);R(9,3,9,1,band)}
     else{R(3,4,18,2,hat);R(3,4,18,1,hl);R(7,0,10,4,hat);R(7,0,10,1,hl);R(7,3,10,1,band)}
     if(back)return;
     if(side){R(13,20,4,3,'#2a2a30');P(16,21,'#7a8aa0');return}
     R(10,16,4,3,'#ece4d4');R(10,17,4,1,'#a86a6a');backpackStraps(o,'#2a2a30');
     P(8,16,'#2a2a30');P(9,17,'#2a2a30');P(15,17,'#2a2a30');R(9,20,6,4,'#2a2a30');R(11,21,2,2,'#8aa0b8');P(10,20,'#5a5a60');
     R(6,26,5,6,o.pt);R(13,26,5,6,o.pt)}}},
  {id:'v2_backpacker',group:3,name:'背包客',note:'卷发络腮胡 · 酒红衬衫 · 工装短裤 · 大背包 · 地图',
   spec:{s:'#9a6a48',h:'#2a1d18',b:'#7a3434',i:'#e6dcc4',p:'#5a5e3e',k:'#4a4440',hair:'messy',top:'jacket',bottom:'pants',acc:[],
    extra(o){const {R,P,side,back,hair}=o;shortsLegs(o);backpackBack(o,'#4a5a3a',true);
     if(side){P(8,1,hair);P(12,0,hair);P(16,1,hair);P(7,4,hair);P(7,7,hair)}else{P(5,3,hair);P(18,3,hair);P(7,1,hair);P(11,0,hair);P(15,1,hair);P(5,6,hair);P(18,6,hair)}
     if(back)return;const bd='#2a1d18';
     if(side){R(14,12,5,2,bd);P(17,14,bd);R(9,26,6,3,o.pt);P(11,27,o.ptD);R(15,19,6,5,'#d8e0c0');R(16,20,2,1,'#6a9ac8');P(19,22,'#c86a5a');return}
     P(7,11,bd);P(16,11,bd);R(7,12,3,3,bd);R(14,12,3,3,bd);R(10,14,4,1,bd);
     R(6,16,1,4,'#3a4a2a');R(17,16,1,4,'#3a4a2a');
     R(4,19,16,6,'#d8e0c0');R(4,19,16,1,'#eef2e0');R(6,20,3,1,'#6a9ac8');R(13,22,4,1,'#c86a5a');R(8,23,3,1,'#7aa86a');R(12,19,1,6,'#b8c0a0');
     R(7,26,4,3,o.pt);R(13,26,4,3,o.pt);P(8,27,o.ptD);P(15,27,o.ptD)}}},
  {id:'v2_kimono',group:3,name:'和服老奶奶',note:'银发发髻 · 蓝底花纹和服 · 酒红腰带 · 竹编手袋',
   spec:{s:'#ebc6a6',h:'#b8b8bc',b:'#4a5478',i:'#f2efe6',p:'#4a5478',k:'#f2efe6',hair:'bun',top:'smock',bottom:'pants',acc:[],fem:true,
    extra(o){const {R,P,side,back,cl,clD}=o,obi='#7a2f3a',fl='#c8cce0',z='#e8e2d4',str='#9a3040';
     P(15,1,'#a83a4a');
     if(side){R(8,16,9,16,cl);R(15,17,2,15,clD);R(8,21,9,3,obi);R(8,22,9,1,'#a8606a');P(10,18,fl);P(13,27,fl);P(10,29,fl);
      if(!back){R(13,16,3,2,'#f2efe6')}R(11+o.step,18,3,7,clD);R(11+o.step,25,3,2,o.skin);
      R(9,32,4,2,z);R(13,32,4,2,z);P(10,32,str);P(14,32,str);return}
     R(5,16,14,16,cl);R(17,16,2,16,clD);R(6,31,12,1,clD);
     if(back){R(5,21,14,3,obi);R(8,20,8,5,obi);R(8,20,8,1,'#a8606a');P(8,17,fl);P(15,27,fl);P(9,28,fl);R(7,32,4,2,z);R(13,32,4,2,z);return}
     P(9,16,'#f2efe6');P(14,16,'#f2efe6');P(10,17,'#f2efe6');P(13,17,'#f2efe6');P(11,18,'#f2efe6');P(12,19,clD);
     R(5,21,14,3,obi);R(5,22,14,1,'#a8606a');P(12,22,'#e8c46a');
     P(7,18,fl);P(16,19,fl);P(8,26,fl);P(15,25,fl);P(11,28,fl);P(7,29,fl);P(14,30,fl);
     R(12,26,1,6,clD);
     R(7,32,4,2,z);R(13,32,4,2,z);P(8,32,str);P(14,32,str);
     R(1,26,5,4,'#a8804a');R(1,28,5,1,'#8a6438');P(2,25,'#6a4a2a');P(4,25,'#6a4a2a');P(3,24,'#6a4a2a')}}},
 ];
 for(const n of V2LIST)SPEC[n.id]=n.spec;
 const V2=V2LIST.map(n=>n.id);
 function make(spec,dir,frame){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const P=(x,y,col)=>{if(!col)return;g.fillStyle=col;g.fillRect(x,y,1,1)};
  const R=(x,y,w,h,col)=>{if(!col)return;g.fillStyle=col;g.fillRect(x,y,w,h)};
  const S=spec,side=dir==='right',back=dir==='up';
  const skin=S.s,skD=sh(S.s,-.16),hair=S.h,hD=sh(S.h,-.28),hL=sh(S.h,.22),cl=S.b,clD=sh(S.b,-.3),clL=sh(S.b,.14),pt=S.p,ptD=sh(S.p,-.3);
  const step=frame===1?1:frame===2?-1:0; // 迈步：左右脚交替
  const O={g,R,P,side,back,step,sh,skin,skD,hair,hD,hL,cl,clD,clL,pt,ptD,S};if(S.under)S.under(O);
  /* ---------- 腿、鞋 ---------- */
  const legY=26;
  if(S.bottom==='skirt'){
   R(side?8:6,23,side?9:12,5,pt);R(side?15:16,23,1,5,ptD);
   const legs=side?[[10,step>0?-1:0],[13,step<0?-1:0]]:[[8,step>0?-1:0],[13,step<0?-1:0]];
   for(const [lx,dy] of legs){R(lx,28+dy,3,4-dy,sh(skin,-.05));R(lx,28+dy,3,1,sh(skin,-.25));R(lx-0,32+dy*0,3,2,S.k)}
  }else{
   if(side){R(9,legY,3,6+(step>0?-1:0),pt);R(12,legY,3,6+(step<0?-1:0),ptD);R(step>0?8:9,32-(step>0?1:0),4,2,S.k);R(step<0?13:12,32-(step<0?1:0),4,2,S.k)}
   else{R(7,legY,4,6-(step>0?1:0),pt);R(13,legY,4,6-(step<0?1:0),pt);R(16,legY,1,6-(step<0?1:0),ptD);R(10,legY,1,5,ptD);R(7,32-(step>0?1:0),4,2,S.k);R(13,32-(step<0?1:0),4,2,S.k)}
  }
  /* ---------- 身体 ---------- */
  if(side){
   R(8,16,9,11,cl);R(15,17,2,10,clD);R(8,16,1,10,clL);
   // 手臂（前面那只，随步伐摆动）
   R(11+step,18,3,7,clD);R(11+step,25,3,2,skin);
  }else{
   R(5,16,14,11,cl);R(6,15,12,1,cl);R(17,16,2,11,clD);R(5,16,1,10,clL);
   // 两只手臂
   R(3,17+(back?0:Math.max(0,-step)),2,8,clD);R(19,17+(back?0:Math.max(0,step)),2,8,clD);
   R(3,25+(back?0:Math.max(0,-step)),2,2,skin);R(19,25+(back?0:Math.max(0,step)),2,2,skD);
  }
  /* ---------- 上衣细节 ---------- */
  if(!back){
   const cx=side?13:11;
   if(S.top==='blazer'||S.top==='suit'){
    if(side){R(14,16,2,4,S.i)}else{R(10,16,4,5,S.i);P(9,16,clL);P(14,16,clD);R(9,17,1,6,clD);R(14,17,1,6,clD);P(11,22,clD);P(12,22,clD)}
   }
   if(S.top==='uniform'){if(!side){R(10,16,4,3,S.i);R(11,17,2,6,S.t);R(5,16,3,1,sh(cl,-.4));R(16,16,3,1,sh(cl,-.4));P(9,24,'#d8b45a');P(14,24,'#d8b45a')}else{R(14,16,2,3,S.i)}}
   if(S.top==='smock'){if(!side){R(9,16,6,2,S.i)}else R(14,16,2,2,S.i)}
   if(S.top==='jacket'){if(!side){R(10,16,4,3,S.i);R(11,17,2,1,S.i);R(11,19,1,8,clD)}else R(14,16,2,3,S.i)}
   if(S.top==='hoodie'){if(!side){R(9,16,6,2,S.i);P(10,18,'#e6e6e6');P(13,18,'#e6e6e6');R(8,22,8,3,clD)}else{R(9,15,4,2,S.i)}}
  }else{
   if(S.top==='hoodie')R(8,15,8,3,S.i);
   if(S.top==='uniform'){R(5,16,3,1,sh(cl,-.4));R(16,16,3,1,sh(cl,-.4))}
  }
  /* ---------- 标志物 ---------- */
  const A=S.acc||[];
  if(!back){
   if(A.includes('tie')){if(side)R(15,17,1,4,S.t);else{R(11,17,2,1,S.t);R(11,18,2,5,S.t);P(11,23,sh(S.t,-.3))}}
   if(A.includes('scarf')){if(side){R(13,16,3,2,S.t);P(15,18,S.t)}else{R(9,16,6,2,S.t);R(12,18,2,3,S.t);P(13,20,sh(S.t,-.3))}}
   if(A.includes('nametag')&&!side){R(6,19,3,1,'#ece6d4')}
   if(A.includes('badge')&&!side){R(6,19,2,2,'#d8b45a');P(6,19,'#fff0b0')}
   if(A.includes('radio')){if(side)R(9,20,2,4,'#202226');else{R(15,19,2,4,'#202226');P(15,18,'#202226');P(16,22,'#e05a4a')}}
   if(A.includes('pearls')&&!side){P(10,16,'#f5f1e6');P(12,17,'#f5f1e6');P(14,16,'#f5f1e6')}
   const ap=S.apron||'#f3f1ea';if(A.includes('apron')){if(side){R(13,18,3,9,ap)}else{R(7,19,10,8,ap);R(16,19,1,8,sh(ap,-.18));R(6,18,1,2,sh(ap,-.08));R(17,18,1,2,sh(ap,-.08))}}
   if(A.includes('box')){if(side){R(14,19,6,5,'#b08a5a');R(14,19,6,1,'#c9a670');P(16,21,'#6a5030')}else{R(6,20,12,5,'#b08a5a');R(6,20,12,1,'#c9a670');R(11,20,2,5,'#d8c8a0')}}
   if(A.includes('case')){if(side)R(10,24,6,4,'#3a2a22');else{R(17,23,5,5,'#3a2a22');R(18,22,3,1,'#3a2a22')}}
   if(A.includes('suitcase')){if(side){R(17,20,1,4,'#888');R(15,24,6,8,'#4a6a8a');R(15,24,6,1,'#6a8aaa')}else{R(19,19,1,5,'#888');R(18,24,5,8,'#4a6a8a');R(18,24,5,1,'#6a8aaa')}}
   if(A.includes('bag2')){if(side){R(8,20,3,5,sh(S.b,-.45))}else{P(7,16,sh(S.b,-.5));P(8,17,sh(S.b,-.5));P(9,18,sh(S.b,-.5));R(15,21,4,4,sh(S.b,-.45))}}
   if(A.includes('towels')){if(side){R(14,20,4,4,'#fbfbf8');P(14,22,'#c9cdd3');P(17,22,'#c9cdd3')}else{R(8,21,8,4,'#fbfbf8');R(8,23,8,1,'#c9cdd3');R(7,22,1,3,skin);R(16,22,1,3,skD)}}
   if(A.includes('ledger')){if(side){R(13,19,4,6,'#4a2f2a');P(13,19,'#c9b26a')}else{R(4,20,4,6,'#4a2f2a');R(4,20,4,1,'#c9b26a')}}
   if(A.includes('paper')){if(side){R(14,20,5,4,'#e6e2d4');P(15,21,'#8a8576');P(17,22,'#8a8576')}else{R(7,21,10,4,'#e6e2d4');R(8,22,4,1,'#4a4842');R(13,23,3,1,'#9a968a')}}
   if(A.includes('letter')){if(side){R(14,21,4,3,'#f2efe6');P(17,21,'#b5463e')}else{R(8,21,7,4,'#f2efe6');R(13,21,2,2,'#b5463e');P(9,22,'#c9c4b4');P(11,23,'#c9c4b4')}}
   if(A.includes('card')){if(side)R(14,19,2,3,'#f1f0ea');else{P(10,16,'#3c6fb8');P(13,16,'#3c6fb8');P(10,17,'#3c6fb8');P(13,17,'#3c6fb8');R(10,18,4,4,'#f1f0ea');R(10,21,4,1,'#c9c9c2')}}
  }
  if(back&&A.includes('apron')){P(11,19,'#f3f1ea');P(12,19,'#f3f1ea');P(10,20,'#f3f1ea');P(13,20,'#f3f1ea')}
  if(back&&A.includes('bag')){R(7,17,10,8,'#7a5a3a');R(7,17,10,1,'#9a7650');R(16,18,1,7,'#5a4028')}
  if(!back&&A.includes('bag')&&!side){P(6,16,'#7a5a3a');P(17,16,'#7a5a3a');R(6,17,1,5,'#7a5a3a');R(17,17,1,5,'#7a5a3a')}
  if(side&&A.includes('bag')){R(7,17,3,7,'#7a5a3a')}
  /* ---------- 头 ---------- */
  R(11,14,3,2,skD); // 脖子
  if(side){R(9,4,10,11,skin);R(18,8,1,4,skin);R(17,5,2,9,skin);R(9,4,2,11,skD)}
  else{R(6,4,12,11,skin);R(7,15,10,1,skin);R(16,5,2,10,skD);R(5,8,1,4,skin);R(18,8,1,4,skD)}
  /* 五官（背面不画） */
  if(!back){
   if(side){
    R(15,9,2,2,'#1b1b24');P(15,9,'#ffffff');P(19,10,skD);R(15,13,2,1,'#a05a55');
    if(A.includes('glasses')){const gl='#3a3d46';R(14,8,4,1,gl);P(17,9,gl);P(14,11,gl);R(11,8,3,1,gl);P(16,10,'#cfe0ff')}
    if(A.includes('mustache'))R(15,12,3,1,'#8e8f93');
    if(A.includes('stubble')){P(14,13,'#7a7e86');P(16,14,'#7a7e86');P(18,13,'#7a7e86')}
   }else{
    R(8,9,2,2,'#1b1b24');R(14,9,2,2,'#1b1b24');P(8,9,'#ffffff');P(14,9,'#ffffff');
    P(12,11,skD);R(11,13,3,1,'#a05a55');
    if(S.fem){P(8,12,'#e8908a');P(15,12,'#e8908a')}
    if(A.includes('glasses')){const gl='#3a3d46';R(7,8,4,1,gl);R(13,8,4,1,gl);P(11,8,gl);P(12,8,gl);P(7,9,gl);P(16,9,gl);P(10,11,gl);P(13,11,gl);P(9,10,'#cfe0ff');P(15,10,'#cfe0ff')}
    if(A.includes('mustache'))R(10,12,4,1,'#8e8f93');
    if(A.includes('stubble')){P(8,13,'#7a7e86');P(15,13,'#7a7e86');P(10,14,'#7a7e86');P(13,14,'#7a7e86')}
    if(A.includes('cig')){R(13,13,3,1,'#f0f0ea');P(16,13,'#ff7a3a');P(17,11,'#c8c8c8');P(18,10,'#a8a8a8')}
   }
  }
  /* ---------- 头发 ---------- */
  const hs=S.hair;
  if(hs==='cap'){
   const cp=S.cap;R(side?9:6,1,side?10:12,5,cp);R(side?9:6,1,side?10:12,1,sh(cp,.18));
   if(back){R(6,4,12,7,cp);R(6,11,12,2,hair)}
   else if(side){R(15,5,6,1,'#151b2b');R(9,6,3,5,hair);P(13,2,'#d8b45a')}
   else{R(5,5,14,1,'#151b2b');R(10,2,4,2,'#d8b45a');P(11,2,'#fff0b0');R(6,6,1,5,hair);R(17,6,1,5,hair)}
  }else if(back){
   R(6,2,12,11,hair);R(6,2,12,1,hL);R(16,3,2,10,hD);
   if(hs==='bob')R(5,6,14,9,hair);
   if(hs==='longbob')R(5,6,14,11,hair);
   if(hs==='bun'){R(9,0,6,4,hair);R(9,0,6,1,hL)}
   if(hs==='thin'){R(6,2,12,3,hair);R(6,5,12,6,skin);R(6,8,1,4,hair);R(17,8,1,4,hair);R(7,11,10,2,hair)}
   if(hs==='crew'){for(let x=7;x<17;x+=2)P(x,3,hD)}
   if(hs==='pony'){R(10,10,4,8,hair);R(10,10,4,1,hL)}
   if(hs==='messy'){P(6,1,hair);P(9,1,hair);P(13,1,hair);P(17,2,hair)}
  }else if(side){
   R(8,2,10,4,hair);R(8,2,10,1,hL);R(8,5,4,6,hair);
   if(hs==='bob'){R(7,4,4,11,hair);R(13,5,4,2,hair)}
   if(hs==='longbob'){R(7,4,4,13,hair);R(13,5,5,2,hair);P(17,7,hair)}
   if(hs==='neat'){R(13,5,4,1,hair);P(12,6,hD)}
   if(hs==='bun'){R(6,2,4,4,hair);R(6,2,4,1,hL)}
   if(hs==='short'){R(13,5,5,2,hair)}
   if(hs==='thin'){R(8,2,10,2,hair);R(11,4,6,1,skin);R(8,5,3,4,hair)}
   if(hs==='crew'){R(8,2,10,2,hair);for(let x=9;x<18;x+=2)P(x,3,hD)}
   if(hs==='pony'){R(13,5,4,2,hair);R(5,6,3,9,hair);P(6,5,'#c9a0a8')}
   if(hs==='messy'){R(13,5,5,2,hair);P(9,1,hair);P(12,1,hair);P(16,2,hair);P(18,4,hair)}
  }else{
   R(6,2,12,4,hair);R(6,2,12,1,hL);R(16,3,2,3,hD);
   if(hs==='bob'){R(5,4,2,11,hair);R(17,4,2,11,hD);R(7,6,6,1,hair);P(13,6,hair);P(8,7,hair)}
   if(hs==='longbob'){R(5,4,2,13,hair);R(17,4,2,13,hD);R(13,6,4,2,hair);R(7,6,2,1,hair);P(16,3,'#c9b26a')}
   if(hs==='neat'){R(6,6,2,3,hair);R(16,6,2,3,hD);R(9,6,5,1,hair);P(10,3,hL);P(14,3,hD)}
   if(hs==='bun'){R(9,0,6,3,hair);R(9,0,6,1,hL);R(6,6,2,3,hair);R(16,6,2,3,hD)}
   if(hs==='short'){R(6,6,3,2,hair);R(9,6,4,1,hair);R(16,6,2,3,hD)}
   if(hs==='thin'){R(6,2,12,2,hair);R(8,4,8,1,skin);R(5,5,2,5,hair);R(17,5,2,5,hD)}
   if(hs==='crew'){R(6,2,12,3,hair);for(let x=7;x<17;x+=2)P(x,3,hD);R(6,5,1,3,hair);R(17,5,1,3,hD)}
   if(hs==='pony'){R(6,6,3,2,hair);R(9,6,4,1,hair);R(16,6,2,3,hD);R(17,3,2,4,hair);P(18,3,'#c9a0a8')}
   if(hs==='messy'){R(6,6,3,3,hair);R(10,6,3,1,hair);R(16,6,2,4,hD);P(6,1,hair);P(9,1,hair);P(13,1,hair);P(17,2,hair)}
  }
  if(S.extra)S.extra(O);
  /* ---------- 描边（透明像素中贴着人物的那一圈） ---------- */
  const im=g.getImageData(0,0,W,H),d=im.data,out=new Uint8ClampedArray(d);
  const a=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&d[(y*W+x)*4+3]>0;
  const [or,og,ob]=hex(OUT);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3])continue;if(a(x-1,y)||a(x+1,y)||a(x,y-1)||a(x,y+1)){out[i]=or;out[i+1]=og;out[i+2]=ob;out[i+3]=235}}
  im.data.set(out);g.putImageData(im,0,0);
  return c;
 }
 const cache={};
 function get(id,dir,frame){const S=SPEC[id];if(!S)return null;const d=dir==='left'?'right':dir;const k=id+d+frame;return cache[k]||(cache[k]=make(S,d,frame))}
 /* 画到地图上：x、y 是原来格子的左上角（32×32）；人物比格子高，向上溢出 */
 function draw(g,id,x,y,dir,frame,opts){const c=get(id,dir||'down',frame||0);if(!c)return false;opts=opts||{};
  g.save();if(opts.alpha!=null)g.globalAlpha=opts.alpha;g.fillStyle='rgba(0,0,0,.28)';g.fillRect(x+9,y+29,14,3);
  if(dir==='left'){g.translate(x+4+W,y-2);g.scale(-1,1);g.drawImage(c,0,0)}else g.drawImage(c,x+4,y-2);g.restore();return true}
 /* ---------- 接到游戏里：按调色板认人 ---------- */
 /* 已知人物（和立绘对应）用 SPEC；其他 NPC 按调色板 + 头像发型生成，同一个人每次都一样 */
 const HAIR={bob:'bob',short:'short',cap:'cap',gray:'thin',neat:'neat',bun:'bun',long:'longbob',bald:'thin'};
 function hash(t){let h=7;for(const ch of String(t))h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h)}
 function generic(pal,npc){
  const n=hash((pal.h||'')+(pal.b||'')+(pal.s||'')+(pal.a||''));
  let hair=npc&&npc.portrait&&npc.portrait.hair!=='short'&&HAIR[npc.portrait.hair];
  if(!hair)hair=['short','neat','crew','bob','longbob','pony','messy','short','thin','cap'][n%10];
  const fem=hair==='bob'||hair==='longbob'||hair==='pony';
  const b=pal.b||'#4a5a70';
  const top=['jacket','suit','hoodie','jacket','smock','suit'][(n>>3)%6];
  const acc=[];if(top==='suit')acc.push('tie');if((n>>6)%4===0&&!fem)acc.push('stubble');const extra=['','bag2','case','','glasses','bag2','',''][(n>>11)%8];if(extra)acc.push(extra);if(npc&&npc.portrait&&(npc.portrait.acc||[]).includes('glasses'))acc.push('glasses');
  return {s:pal.s||'#e8c4a0',h:pal.h||'#2a1d18',b,i:pal.a||'#e8e2cc',t:sh(pal.a||'#7a3a3a',-.45),p:pal.p||sh(b,-.35),k:pal.k||'#1a1a20',cap:sh(b,-.2),
   hair,top,bottom:fem&&(n>>9)%2?'skirt':'pants',acc,fem};
 }
 const pc={},c2={};
 function specFor(pal,isPlayer){
  if(isPlayer)return ['player',SPEC.player];
  if(pal&&pal.look&&SPEC[pal.look])return ['look:'+pal.look,SPEC[pal.look]];
  const key=JSON.stringify(pal);if(pc[key])return pc[key];
  let N={};try{N=GAME_DATA.story.chapter1.npcs||{}}catch(e){}
  let id=null;
  for(const [k,d] of Object.entries(N)){const q=d&&d.palette;if(!q)continue;if(q===pal||(q.h===pal.h&&q.s===pal.s&&q.b===pal.b&&q.a===pal.a&&q.p===pal.p)){id=k;break}}
  let spec;
  const t=N.takahashi&&N.takahashi.palette;
  if(!id&&t&&t.h===pal.h&&t.s===pal.s&&t.a===pal.a&&t.p===pal.p)spec={...SPEC.takahashi,b:pal.b,p:sh(pal.b,-.15)}; // 高桥换了外套颜色
  else if(id&&SPEC[id])spec=SPEC[id];
  else spec=generic(pal,id&&N[id]);
  return pc[key]=[key,spec];
 }
 const SCALE=1.25;
 function drawPal(g,x,y,pal,dir,frame,ghost,PP){
  if(!g||!g.drawImage)return false;
  const isP=!pal||pal===PP;const [key,spec]=specFor(pal||{},isP);
  const d=dir==='left'?'right':(dir==='up'||dir==='right'?dir:'down');
  const fr=frame?((((typeof performance!=='undefined'?performance.now():Date.now())/320)|0)%2?1:2):0;
  const ck=key+'|'+d+'|'+fr;const spr=c2[ck]||(c2[ck]=make(spec,d,fr));
  const cw=g.canvas?g.canvas.width:999,chh=g.canvas?g.canvas.height:999;
  const small=cw<=48&&chh<=48;                          // 32×32 的小画布（图标、侧视布景的取样）：缩进格子里
  const S=small?32/34:SCALE,w=Math.round(W*S),h=Math.round(H*S);
  const px=Math.round(x+16-w/2),py=Math.round(y+32-h);
  g.save();g.imageSmoothingEnabled=false;
  if(ghost)g.globalAlpha=(g.globalAlpha||1)*(.45+.15*Math.sin((typeof performance!=='undefined'?performance.now():0)/400));
  if(!small){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+8,y+29,16,3)}
  if(dir==='left'){g.translate(px+w,py);g.scale(-1,1);g.drawImage(spr,0,0,w,h)}else g.drawImage(spr,px,py,w,h);
  g.restore();return true;
 }
 return {SPEC,get,draw,make,W,H,drawPal,specFor,SCALE,V2,V2LIST};
})();
window.SPRITE2=SPRITE2;

/* v50 人物关系网：推理手帐里的一页。玩家给人物连线、选关系，只用来整理思路——
   连错没有代价、不打分、不判断对错、不生成推论、不影响结局。所有关系一直可选（不按线索上锁）。 */
const RELNET=(function(){
 const W=800,H=620;
 const PEOPLE=[ // id,名字,身份,默认位置x,y,旋转
  ['katayama','片山 茂','207号室的住客',300,200,-2],
  ['sato','佐藤 美穂','前台',50,40,2],
  ['tanaka','田中 震','',560,40,3],
  ['mori','森 正彦','经理',50,300,-2],
  ['kobayashi','小林 辰夫','夜班保安',620,280,-3],
  ['inoue','井上 和子','清扫员',250,440,2],
  ['takahashi','高桥 由美','财务',470,440,-1]];
 function relationCategories(){
  const discovered=[],facts=CASE_FACTS.read();
  if(facts.concealment)discovered.push('篡改记录');
  if(campaign?.kobayashiBranch?.identityKnown)discovered.push('使用化名');
  if(campaign?.tanakaBranch?.events?.pushVerified)discovered.push('推搡');
  return [['关系',['朋友','同事','家人','熟人','经济往来','存在矛盾','隐瞒信息','怀疑','未知关系',...discovered]]];
 }
 const FREE=[[690,470],[700,130],[170,560],[400,40],[420,300],[160,180]];
 let ui={sel:[null,null],edit:null,cat:'关系',rel:null,relCat:null,writing:null,cert:'q',ev:'',adding:false,root:null,opts:null,zoom:'big'};
 const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const mob=()=>{try{return matchMedia('(max-width:720px)').matches}catch(e){return false}};
 function st(){if(typeof campaign==='undefined'||!campaign)return {links:[],pos:{},custom:[],n:0};campaign.relnet??={};const r=campaign.relnet;r.links??=[];r.pos??={};r.custom??=[];r.n??=0;return r}
 function save(){try{campaignSave()}catch(e){}}
 function people(){const r=st(),met=ui.opts?.met||(()=>true),out=[];
  for(const [id,n,role,x,y,rot] of PEOPLE){if(id!=='katayama'&&!met(id))continue;const p=r.pos[id]||[x,y];const unidentified=id==='katayama'&&!H18.cond(GAME_DATA.story.chapter1.chapter.katayamaFile.when);out.push({id,n:unidentified?'姓名待核':n,role,x:p[0],y:p[1],rot,face:!unidentified})}
  r.custom.forEach((c,i)=>{const d=FREE[i%FREE.length],p=r.pos[c.id]||d;out.push({id:c.id,n:c.n,role:c.note||'自己记的人',x:p[0],y:p[1],rot:(i%2?2:-2),face:false})});
  return out}
 function byId(id){return people().find(p=>p.id===id)}
 function faceStyle(id){const d=window.TACHIE_DATA&&TACHIE_DATA[id];const u=d&&(d.base||'');return u?'background-image:url('+u+')':''}
 const CW=104,CH=126;
 function ctr(p){return [p.x+CW/2,p.y+CH/2]}
 function linksSvg(list){const ps={};people().forEach(p=>ps[p.id]=p);let svg='',labs='';const seen={};
  for(const l of st().links){const A=ps[l.a],B=ps[l.b];if(!A||!B)continue;
   const [x1,y1]=ctr(A),[x2,y2]=ctr(B);const k=[l.a,l.b].sort().join('|');const n=seen[k]||0;seen[k]=n+1;
   const off=n===0?18:(n%2?-1:1)*(18+Math.ceil(n/2)*58);const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
   const cx=(x1+x2)/2+nx*off,cy=(y1+y2)/2+ny*off;const s=l.x?'x':l.st;
   const col={ok:'#b23a2e',q:'#8a2a22',x:'#6a6a6a'}[s],dash={ok:'',q:'7 5',x:'2 4'}[s];
   const on=ui.edit===l.id;
   svg+='<path d="M'+x1+','+y1+' Q'+cx+','+cy+' '+x2+','+y2+'" fill="none" stroke="'+col+'" stroke-width="'+(on?4:2.6)+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+' opacity=".92"/>';
   const lx=(x1+2*cx+x2)/4,ly=(y1+2*cy+y2)/4;
   labs+='<button type="button" class="rn-lab rn-'+s+(on?' rn-on':'')+'" data-link="'+l.id+'" style="left:'+lx.toFixed(0)+'px;top:'+ly.toFixed(0)+'px" title="点一下修改">'+esc(l.t)+(s==='q'&&!/[？?]$/.test(l.t)?'？':'')+'</button>'}
  return '<svg class="rn-svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+svg+'<path class="rn-tmp" d="" fill="none" stroke="#b23a2e" stroke-width="3" stroke-dasharray="3 4"/></svg>'+labs}
 function cardHtml(p){const sel=ui.sel.includes(p.id);
  return '<div class="rn-card'+(sel?' sel':'')+(p.face?'':' unk')+'" data-p="'+p.id+'" role="button" tabindex="0" aria-pressed="'+sel+'" style="left:'+p.x+'px;top:'+p.y+'px;transform:rotate('+p.rot+'deg)"><span class="rn-pin" data-pin="'+p.id+'" title="拖到另一个人身上"></span><i class="rn-face" style="'+(p.face?faceStyle(p.id):'')+'"></i><b>'+esc(p.n)+'</b><small>'+esc(p.role||' ')+'</small></div>'}
 function chipsHtml(){const m=mob(),CATS=relationCategories();let h='';
  if(!CATS.some(([key])=>key===ui.cat))ui.cat=CATS[0][0];
  const group=([g,items])=>items.map(it=>'<button type="button" class="rn-chip'+(ui.rel===it?' on':'')+'" data-rel="'+esc(it)+'" data-cat="'+g+'">'+esc(it)+'</button>').join('')+
   (ui.writing===g?'<span class="rn-write"><input type="text" maxlength="12" class="rn-in" data-wcat="'+g+'" placeholder="自己写的关系" value="'+(ui.relCat===g&&ui.rel&&!items.includes(ui.rel)?esc(ui.rel):'')+'"><button type="button" class="rn-chip on" data-wok="'+g+'">好</button></span>':
    (ui.relCat===g&&ui.rel&&!items.includes(ui.rel)?'<button type="button" class="rn-chip on" data-write="'+g+'">'+esc(ui.rel)+' ✎</button>':'<button type="button" class="rn-chip add" data-write="'+g+'">＋ 自己写</button>'));
  if(m){h+='<div class="rn-tabs">'+CATS.map(([g])=>'<button type="button" data-cat-tab="'+g+'" aria-pressed="'+(ui.cat===g)+'">'+g+'</button>').join('')+'</div>'+group(CATS.find(c=>c[0]===ui.cat))}
  else h+=CATS.map(c=>'<div class="rn-grp">'+c[0]+'</div>'+group(c)).join('');
  return h}
 function evSelect(){const cl=ui.opts?.clues||[];
  return '<select class="rn-ev" aria-label="证据"><option value="">— 选一张线索当证据 —</option>'+cl.map(([id,n])=>'<option value="'+esc(id)+'"'+(ui.ev===id?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select>'+(cl.length?'':'<small class="rn-dim">手帐里还没有线索。</small>')}
 function pairHead(a,b){const A=byId(a),B=byId(b);const f=p=>'<i class="rn-mini'+(p&&p.face?'':' unk')+'" style="'+(p&&p.face?faceStyle(p.id):'')+'"></i>';
  return '<div class="rn-pair">'+f(A)+'<span class="rn-dash">——</span>'+f(B)+'<b>'+esc(A?.n||'?')+'<br><small>和</small> '+esc(B?.n||'?')+'</b></div>'}
 function certHtml(){return '<div class="rn-grp">我的判断 · 仅记在关系图</div><button type="button" class="rn-chip'+(ui.cert==='q'?' on':'')+'" data-cert="q">？ 推测</button><button type="button" class="rn-chip'+(ui.cert==='ok'?' on':'')+'" data-cert="ok">✓ 我的判断（附线索）</button>'+(ui.cert==='ok'?evSelect():'')}
 function panelHtml(){const r=st();
  if(ui.edit){const l=r.links.find(x=>x.id===ui.edit);if(!l){ui.edit=null;return panelHtml()}
   return '<div class="rn-kick">改这条线</div>'+pairHead(l.a,l.b)+'<p class="rn-now">现在：<b>'+esc(l.t)+'</b> · '+(l.x?'已推翻':l.st==='ok'?'确认':'推测')+(l.ev&&l.st==='ok'?'<br><small>📎 '+esc((ui.opts?.clues||[]).find(c=>c[0]===l.ev)?.[1]||l.ev)+'</small>':'')+'</p>'+chipsHtml()+certHtml()+
    '<div class="rn-btns"><button type="button" class="rn-go" data-act="upd"'+(ui.rel&&(ui.cert!=='ok'||ui.ev)?'':' disabled')+'>保存修改</button><button type="button" class="rn-btn" data-act="cancel">返回</button></div>'+
    '<div class="rn-btns"><button type="button" class="rn-btn" data-act="flip">'+(l.x?'恢复这条线':'标成「推翻」')+'</button><button type="button" class="rn-btn warn" data-act="del">删掉</button></div>'}
  if(ui.sel[0]&&ui.sel[1])return '<div class="rn-kick">新的红线</div>'+pairHead(ui.sel[0],ui.sel[1])+chipsHtml()+certHtml()+
   '<div class="rn-btns"><button type="button" class="rn-go" data-act="add"'+(ui.rel&&(ui.cert!=='ok'||ui.ev)?'':' disabled')+'>📌 拉上红线</button><button type="button" class="rn-btn" data-act="cancel">取消</button></div>';
  const A=ui.sel[0]&&byId(ui.sel[0]);
  const cnt=k=>r.links.filter(l=>k==='x'?l.x:!l.x&&l.st===k).length;
  let h='<div class="rn-kick">'+(A?'已选：'+esc(A.n):'怎么用')+'</div>'+
   (A?'<p class="rn-hint">再点另一个人，就能给他们拉一条红线。</p><div class="rn-btns"><button type="button" class="rn-btn" data-act="cancel">取消选择</button></div>':
    '<p class="rn-hint">'+(mob()?'先点一个人，再点另一个人':'点一个人再点另一个人，或者把卡片上的红钉拖到另一个人身上')+'，然后选关系。拖动卡片可以挪位置。<br>这一页只是给你整理思路：连错不扣任何东西，也不会告诉你对不对。</p>')+
   '<div class="rn-stamps"><span class="rn-stamp rn-ok">确认 '+cnt('ok')+'</span><span class="rn-stamp rn-q">推测 '+cnt('q')+'</span><span class="rn-stamp rn-x">推翻 '+cnt('x')+'</span></div>';
  if(r.links.length)h+='<div class="rn-grp">已经拉的线</div><ul class="rn-list">'+r.links.map(l=>'<li><button type="button" data-link="'+l.id+'" class="rn-'+(l.x?'x':l.st)+'">'+esc(byId(l.a)?.n||'?')+' — '+esc(byId(l.b)?.n||'?')+'：<b>'+esc(l.t)+'</b></button></li>').join('')+'</ul>';
  h+='<div class="rn-grp">还没出现在板上的人</div>'+(ui.adding?'<div class="rn-add"><input type="text" class="rn-in" id="rn-pn" maxlength="10" placeholder="名字或称呼（例如：那个男人）"><input type="text" class="rn-in" id="rn-pr" maxlength="14" placeholder="备注（可以不写）"><div class="rn-btns"><button type="button" class="rn-go" data-act="padd">放到板上</button><button type="button" class="rn-btn" data-act="pcancel">算了</button></div></div>':
   '<button type="button" class="rn-chip add" data-act="pnew">＋ 记一个人</button>')+
   (r.custom.length?'<ul class="rn-list">'+r.custom.map(c=>'<li><span>'+esc(c.n)+(c.note?' <small>'+esc(c.note)+'</small>':'')+'</span> <button type="button" class="rn-del" data-pdel="'+c.id+'" aria-label="删掉这个人">×</button></li>').join('')+'</ul>':'');
  return h}
 function boardHtml(){const m=mob();return (m?'<div class="rn-zoom"><span>'+(ui.zoom==='big'?'左右滑动查看整块板':'整块板')+'</span><button type="button" data-zoom>'+(ui.zoom==='big'?'看全部':'🔍 放大')+'</button></div>':'')+'<div class="rn-fit'+(m&&ui.zoom==='big'?' rn-scroll':'')+'"><div class="rn-sizer"><div class="rn-board'+(m?' rn-m':'')+'" style="width:'+W+'px;height:'+H+'px">'+linksSvg()+people().map(cardHtml).join('')+'</div></div></div>'}
 function inner(){return '<div class="rn-wrap"><div class="rn-cork">'+boardHtml()+'</div><aside class="rn-panel">'+panelHtml()+'</aside></div>'}
 function html(opts){ui.opts=opts||ui.opts;return '<div id="rn-root">'+inner()+'</div>'}
 function draw(focus){const root=document.getElementById('rn-root');if(!root)return;const f0=root.querySelector('.rn-fit'),sl=f0?f0.scrollLeft:0,stp=f0?f0.scrollTop:0;root.innerHTML=inner();bindRoot(root);const f=root.querySelector('.rn-fit');if(f){f.scrollLeft=sl;f.scrollTop=stp}
  if(focus&&mob()){const pn=root.querySelector('.rn-panel');if(pn)try{pn.scrollIntoView({block:'start',behavior:'smooth'})}catch(e){pn.scrollIntoView()}}}
 function fit(root){const f=root.querySelector('.rn-fit'),z=root.querySelector('.rn-sizer'),b=root.querySelector('.rn-board');if(!f||!b||!z)return;
  const fitSc=Math.min(1.15,(f.clientWidth||W)/W),sc=(mob()&&ui.zoom==='big')?Math.max(fitSc,.82):fitSc;
  b.style.transform='scale('+sc+')';z.style.width=(W*sc)+'px';z.style.height=(H*sc)+'px';f.dataset.sc=sc}
 function pick(id){if(ui.edit){ui.edit=null}
  if(!ui.sel[0]||ui.sel[1])ui.sel=[id,null];else if(ui.sel[0]===id)ui.sel=[null,null];else{ui.sel=[ui.sel[0],id];resetPick();return draw(true)}
  draw()}
 function resetPick(){ui.rel=null;ui.relCat=null;ui.writing=null;ui.cert='q';ui.ev=''}
 function bindRoot(root){fit(root);
  const board=root.querySelector('.rn-board'),f=root.querySelector('.rn-fit'),tmp=root.querySelector('.rn-tmp');
  let drag=null;
  const pt=e=>{const r=board.getBoundingClientRect(),sc=+f.dataset.sc||1;return [(e.clientX-r.left)/sc,(e.clientY-r.top)/sc]};
  board.onpointerdown=e=>{const lab=e.target.closest('.rn-lab');if(lab)return;const card=e.target.closest('.rn-card');if(!card)return;
   const id=card.dataset.p,[x,y]=pt(e),p=byId(id);drag={id,pin:!!e.target.closest('.rn-pin'),x0:x,y0:y,px:p.x,py:p.y,moved:false,card};
   try{board.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()};
  board.onpointermove=e=>{if(!drag)return;const [x,y]=pt(e);
   if(!drag.moved&&Math.hypot(x-drag.x0,y-drag.y0)<6)return;drag.moved=true;
   if(drag.pin){const p=byId(drag.id),[cx,cy]=ctr(p);tmp.setAttribute('d','M'+cx+','+(p.y+4)+' Q'+((cx+x)/2+30)+','+((p.y+y)/2+30)+' '+x+','+y)}
   else{const nx=Math.max(-20,Math.min(W-CW+20,drag.px+x-drag.x0)),ny=Math.max(-10,Math.min(H-CH+10,drag.py+y-drag.y0));drag.card.style.left=nx+'px';drag.card.style.top=ny+'px';drag.nx=nx;drag.ny=ny}};
  board.onpointerup=e=>{if(!drag)return;const d=drag;drag=null;
   if(!d.moved){pick(d.id);return}
   if(d.pin){tmp.setAttribute('d','');const el=document.elementFromPoint(e.clientX,e.clientY),c=el&&el.closest&&el.closest('.rn-card');
    if(c&&c.dataset.p!==d.id){ui.edit=null;ui.sel=[d.id,c.dataset.p];resetPick();draw(true)}return}
   if(d.nx!=null){st().pos[d.id]=[Math.round(d.nx),Math.round(d.ny)];save();draw()}};
  board.onpointercancel=()=>{drag=null;tmp&&tmp.setAttribute('d','')};
  root.querySelectorAll('.rn-card').forEach(c=>c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(c.dataset.p)}});
  root.querySelectorAll('[data-link]').forEach(b=>b.onclick=()=>{const l=st().links.find(x=>x.id===b.dataset.link);if(!l)return;ui.edit=l.id;ui.sel=[null,null];ui.rel=l.t;ui.relCat='关系';ui.writing=null;ui.cert=l.st;ui.ev=l.ev||'';ui.cat='关系';draw(true)});
  const zb=root.querySelector('[data-zoom]');if(zb)zb.onclick=()=>{ui.zoom=ui.zoom==='big'?'fit':'big';draw()};
  root.querySelectorAll('[data-rel]').forEach(b=>b.onclick=()=>{ui.rel=b.dataset.rel;ui.relCat=b.dataset.cat;ui.writing=null;draw()});
  root.querySelectorAll('[data-cat-tab]').forEach(b=>b.onclick=()=>{ui.cat=b.dataset.catTab;ui.writing=null;draw()});
  root.querySelectorAll('[data-write]').forEach(b=>b.onclick=()=>{ui.writing=b.dataset.write;draw();const i=root.querySelector('.rn-in[data-wcat]');if(i)i.focus()});
  const wi=root.querySelector('.rn-in[data-wcat]');
  const wok=()=>{const v=(wi.value||'').trim();if(v){ui.rel=v;ui.relCat=wi.dataset.wcat}ui.writing=null;draw()};
  if(wi){wi.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();wok()}else if(e.key==='Escape'){ui.writing=null;draw()}};}
  root.querySelectorAll('[data-wok]').forEach(b=>b.onclick=wok);
  root.querySelectorAll('[data-cert]').forEach(b=>b.onclick=()=>{ui.cert=b.dataset.cert;draw()});
  const ev=root.querySelector('.rn-ev');if(ev)ev.onchange=()=>{ui.ev=ev.value;draw()};
  root.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=()=>{const r=st(),id=b.dataset.pdel;r.custom=r.custom.filter(c=>c.id!==id);r.links=r.links.filter(l=>l.a!==id&&l.b!==id);delete r.pos[id];if(ui.sel.includes(id))ui.sel=[null,null];save();draw()});
  root.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act,root));
  const pn=root.querySelector('#rn-pn');if(pn){pn.focus();pn.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();act('padd',root)}}}
 }
 function act(a,root){const r=st();
  if(a==='cancel'){ui.sel=[null,null];ui.edit=null;resetPick();return draw()}
  if(a==='add'){if(!ui.rel||!ui.sel[0]||!ui.sel[1]||(ui.cert==='ok'&&!ui.ev))return;r.n++;r.links.push({id:'l'+r.n,a:ui.sel[0],b:ui.sel[1],t:ui.rel,cat:ui.relCat||'',st:ui.cert,ev:ui.cert==='ok'?ui.ev:'',x:false,day:campaign.day||0});ui.sel=[null,null];resetPick();save();return draw()}
  const l=r.links.find(x=>x.id===ui.edit);
  if(a==='upd'&&l){if(!ui.rel||(ui.cert==='ok'&&!ui.ev))return;l.t=ui.rel;l.cat=ui.relCat||l.cat;l.st=ui.cert;l.ev=ui.cert==='ok'?ui.ev:'';ui.edit=null;resetPick();save();return draw()}
  if(a==='flip'&&l){l.x=!l.x;save();return draw()}
  if(a==='del'&&l){r.links=r.links.filter(x=>x!==l);ui.edit=null;resetPick();save();return draw()}
  if(a==='pnew'){ui.adding=true;return draw()}
  if(a==='pcancel'){ui.adding=false;return draw()}
  if(a==='padd'){const n=(root.querySelector('#rn-pn')?.value||'').trim(),note=(root.querySelector('#rn-pr')?.value||'').trim();if(!n)return;r.n++;r.custom.push({id:'c'+r.n,n,note});ui.adding=false;save();return draw()}
 }
 function bind(app){const root=app.querySelector('#rn-root');if(root)bindRoot(root)}
 let rz=0;try{window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{const root=document.getElementById('rn-root');if(root)fit(root)},120)})}catch(e){}
 function count(){return st().links.length}
 function reset(){ui.sel=[null,null];ui.edit=null;ui.adding=false;resetPick()}
 return {html,bind,count,reset,get CATS(){return relationCategories()},PEOPLE,_ui:()=>ui,_st:st};
})();
window.RELNET=RELNET;

/* v50 报告死亡结局（13 种 BAD END）的立绘演出：在关键句出现对应人物的立绘。
   beats[ending] = {步骤: [人物, 表情, 模式]}；模式 shadow = 只剩轮廓的暗影（门外 / 电话 / 恐怖瞬间）。
   第 0 步没有写死的结局，用报告里指定的关键人物 + 该结局的情绪。 */
const DXTACHIE=(function(){
 const BEATS={
  death_insufficient:{5:['oldman','gaze','shadow']},
  death_false_murder:{0:['mori','shaken'],7:['mori','glint','shadow']},
  death_false_cause:{0:['katayama','lonely']},
  death_false_client:{0:['tanaka','angry'],8:['tanaka','tears','dim']},
  death_abandoned:{0:['katayama','lonely'],5:['sato','base'],6:['sato','hollow']},
  death_employee:{0:['kobayashi','anger']},
  death_employee_inoue:{0:['inoue','sad'],4:['inoue','worry','dim']},
  death_phone:{},
  death_bento:{0:['tanaka','cold']},
  death_last_bus:{0:['katayama','lonely']},
  death_confidential:{0:['mori','bow'],4:['mori','glint']},
  death_perfect_report:{},
  death_promotion:{0:['tanaka','worry']},
  death_permanent_guest:{0:['mori','bow'],3:['sato','relief'],6:['sato','hollow','shadow']},
  // v65：v49 后新增的结局
  death_late:{5:['oldman','gaze','shadow']},
  death_silence:{0:['mori','bow'],4:['mori','glint']},
  death_publish:{2:['sato','hollow','dim'],3:['tanaka','tears','dim']},
  death_leave:{4:['oldman','lonely','shadow']}
 };
 const FAM={
  hurt:{sato:'shock',mori:'shaken',inoue:'sad',kobayashi:'anger',takahashi:'cold',tanaka:'angry',katayama:'lonely'},
  smug:{sato:'relief',mori:'glint',inoue:'worry',kobayashi:'tired',takahashi:'smirk',tanaka:'worry',katayama:'lonely'},
  sad:{sato:'guilt',mori:'shaken',inoue:'tears',kobayashi:'remorse',takahashi:'sigh',tanaka:'tears',katayama:'lonely'}};
 const MOOD={death_insufficient:'sad',death_late:'sad',death_phone:'sad',death_perfect_report:'smug'};
 // v65：报告改为「案件结论」后，没有指认人物时的替代立绘
 const NOBODY={death_insufficient:['katayama','lonely'],death_late:['katayama','lonely'],death_phone:['katayama','lonely'],death_perfect_report:['mori','glint']};
 function person(){try{const c=campaign.case1||{};return (c.report&&(c.report.suspect||c.report.person))||(c.draft&&(c.draft.suspect||c.draft.person))||null}catch(e){return null}}
 function beat(id,i){const b=BEATS[id]||{};if(b[i])return b[i];
  if(i===0&&MOOD[id]){const p=person(),e=p&&FAM[MOOD[id]][p];if(e)return [p,e];if(NOBODY[id])return NOBODY[id]}
  return null}
 function src(p,e){const d=window.TACHIE_DATA&&TACHIE_DATA[p];return d?(d[e]||d.base):null}
 function render(st){const stage=document.querySelector('#dx-root .dx-stage');if(!stage)return;
  let img=stage.querySelector('.dxt');const b=beat(st.id,st.i),u=b&&src(b[0],b[1]);
  if(!u){if(img){img.classList.add('out');setTimeout(()=>{if(img.classList.contains('out'))img.remove()},260)}return}
  if(!img){img=document.createElement('img');img.className='dxt';img.alt='';img.setAttribute('aria-hidden','true');stage.insertBefore(img,stage.firstChild)}
  img.classList.remove('out');
  if(img.dataset.k!==b[0]+':'+b[1]){img.src=u;img.dataset.k=b[0]+':'+b[1];img.classList.remove('pop');void img.offsetWidth;img.classList.add('pop')}
  img.classList.toggle('shadow',b[2]==='shadow');img.classList.toggle('dim',b[2]==='dim');
  stage.classList.add('has-dxt')}
 function hook(){if(!window.DEATHS||DEATHS.__dxt)return;const orig=DEATHS.play;
  DEATHS.play=function(id,done){const r=orig.apply(this,arguments);const st={id,i:0};
   const nx=document.getElementById('dx-next'),sk=document.getElementById('dx-skip');
   if(nx)nx.addEventListener('click',()=>{st.i++;render(st)});
   if(sk)sk.addEventListener('click',()=>{st.i=1e9;render(st)});
   render(st);return r};
  DEATHS.__dxt=true}
 setTimeout(hook,0);
 return {BEATS,beat,hook};
})();
window.DXTACHIE=DXTACHIE;

/* v52 回溯与「被骗的代价」
   1) 冷淡：指控错人后 NPC 当天冷淡（flag cold:<npc>），第二天自动解除（campaign.coldDay 记录是哪一天开始的）。
   2) 每日检查点：每天第一次存档时，把当时的进度存进 localStorage（只留最近两天）；存档页可以「回到第 N 天早上」。
   3) 回溯代价：每一次回溯（死亡结算的回溯按钮、每日检查点）都扣 SAN，越来越多：5、10、15……
      次数记在 campaign.rewinds，回溯后从旧进度带过来，不会被快照抹掉。
   4) 失败的报告：报告导致死亡结局时记下这一份报告（人物 / 证据 / 处理方式 / 结局），存在 localStorage，
      回到提交报告之前时显示在报告页最上面。 */
const REWIND=(function(){
 const CPKEY='tokyo-daycp-v52',FAILKEY='tokyo-ch1-failed-reports';
 const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const cost=()=>GAME_CONFIG.ch1Repairs.rewind.base+GAME_CONFIG.ch1Repairs.rewind.step*((campaign&&campaign.rewinds)||0);
 const v18=()=>campaign&&campaign.hotelCase&&campaign.hotelCase.v18;
 const NM=n=>({inoue:'井上',kobayashi:'小林',takahashi:'高桥'})[n]||n;
 /* ---------- 冷淡一天 ---------- */
 function coldSync(){const v=v18();if(!v||!v.flags)return;campaign.coldDay??={};
  for(const k of Object.keys(v.flags)){if(!k.startsWith('cold:'))continue;const npc=k.slice(5);
   if(campaign.coldDay[npc]==null){campaign.coldDay[npc]=campaign.day;try{UI.toast(NM(npc)+'的信任 −2')}catch(e){}}
   else if(campaign.day>campaign.coldDay[npc]){delete v.flags[k];delete campaign.coldDay[npc];try{UI.toast(NM(npc)+'的气好像消了一些。')}catch(e){}}}
  campaign.apolSeen??={};for(const k of Object.keys(v.flags)){if(!k.startsWith('apol:'))continue;const npc=k.slice(5);if(!campaign.apolSeen[npc]){campaign.apolSeen[npc]=1;try{UI.toast(NM(npc)+'的信任 +2')}catch(e){}}}}
 /* ---------- 每日检查点 ---------- */
 function cps(){try{return JSON.parse(localStorage.getItem(CPKEY)||'[]')}catch(e){return []}}
 function cpSync(){if(!campaign||!campaign.day||!campaign.case1)return;const list=cps();if(list.some(c=>c.day===campaign.day&&c.id===campaign.rwId))return;
  const keep=list.filter(c=>c.id===campaign.rwId&&c.day<campaign.day).sort((a,b)=>b.day-a.day).slice(0,1);
  keep.unshift({day:campaign.day,id:campaign.rwId,at:new Date().toISOString(),data:campaign});
  try{localStorage.setItem(CPKEY,JSON.stringify(keep))}catch(e){}}
 /* ---------- 回溯代价 ---------- */
 function canPay(){return !!campaign}
 function pay(prev){
  if(!campaign)return;
  const n=prev?.rewinds||0,rule=GAME_CONFIG.ch1Repairs.rewind,fee=rule.base+rule.step*n;
  campaign.rewinds=n+1;if(prev?.failedReports)campaign.failedReports=prev.failedReports;
  const restored=Number(campaign.san)||0,target=Math.max(rule.sanFloor,restored-fee);
  GS.change({san:target-restored},'回溯代价');
  campaignSave();UI.toast('回溯第 '+(n+1)+' 次 · SAN '+(target-restored)+'。保底保留 '+rule.sanFloor+' SAN。');
 }
 function restoreDay(day){const c=cps().find(x=>x.day===day&&x.id===campaign.rwId);if(!c)return false;
  if(!canPay()){UI.toast('SAN 不够了，无法再回溯。');return false}
  const prev={rewinds:campaign.rewinds||0,failedReports:campaign.failedReports};
  try{if(window.H18&&H18.active())H18.stop()}catch(e){}try{if(window.DM)DM.close()}catch(e){}
  CH1FIX.recoverUI();campaign=JSON.parse(JSON.stringify(c.data));V51.migrate();campaign.v51.whisperDay=day;pay(prev);
  // 回到早上以后，冷淡记录按那一天重新算
  try{tokyoHome()}catch(e){}return true}
 /* 死亡结算画面的回溯按钮：统一加上 SAN 代价 */
 function hookDeaths(){if(!window.DEATHS||DEATHS.__rw)return;const orig=DEATHS.endScreen;
  DEATHS.endScreen=function(id,opts){opts=Object.assign({},opts||{});
   if(isReportDeath(id))recordFail(id);
   if(id==='death_flood'&&opts.canRewind&&opts.onRewind){
    const restoreFlood=opts.onRewind;
    opts.rewindLabel=(opts.rewindLabel||'回到品川被淹那天的早上')+'（免费，不消耗 SAN）';
    opts.rewindText=(opts.rewindText||'')+'\n水没回溯免费，不增加普通回溯次数。';
    opts.onRewind=function(){
     const prev={rewinds:campaign.rewinds||0,failedReports:campaign.failedReports};
     CH1FIX.recoverUI(true);const result=restoreFlood.apply(this,arguments);
     if(result!==false){campaign.rewinds=Math.max(campaign.rewinds||0,prev.rewinds);if(prev.failedReports)campaign.failedReports=prev.failedReports;campaignSave()}
     return result;
    };
   }
   if(opts.canRewind&&opts.onRewind&&id!=='death_flood'){const c=cost(),ok=canPay(),fn=opts.onRewind;
    opts.rewindLabel=(opts.rewindLabel||'回到提交报告之前')+'（SAN −'+c+'，最低保留 1）';
    opts.rewindText=(opts.rewindText?opts.rewindText+'\n':'')+'回溯代价为 SAN −'+c+'，之后每次再多 '+GAME_CONFIG.ch1Repairs.rewind.step+'。不足时扣至 1 并允许恢复。';
    if(!ok){opts.canRewind=false;opts.rewindText='SAN 不够了，无法再回溯。'}
    opts.onRewind=function(){const prev={rewinds:campaign.rewinds||0,failedReports:campaign.failedReports};CH1FIX.recoverUI(true);const r=fn.apply(this,arguments);if(r!==false&&campaign.rewinds!==prev.rewinds+1)pay(prev);return r}}
   return orig.call(this,id,opts)};
  DEATHS.__rw=true}
 /* ---------- 失败的报告 ---------- */
 function isReportDeath(id){try{const s=campaign&&campaign.case1;return !!(s&&s.report&&s.endingId===id&&GAME_DATA.d['investigation/death-endings'].endings[id])}catch(e){return false}}
 function fails(){try{return JSON.parse(localStorage.getItem(FAILKEY)||'[]')}catch(e){return []}}
 function evName(id){try{const all=JSON.stringify(GAME_DATA.d['investigation/evidence']||{});const m=all.match(new RegExp('"id":"'+id+'","name":"([^"]+)"'));return m?m[1]:id}catch(e){return id}}
 function personName(id){try{const p=(window.CASE5&&CASE5.persons&&CASE5.persons())||[];const x=p.find(x=>x.id===id);return x?(x.name||x.label||id):id}catch(e){return id}}
 function recordFail(id){const s=campaign.case1,r=s.report||{},E=GAME_DATA.d['investigation/death-endings'].endings[id]||{};
  const item={id:campaign.rwId,ending:id,no:E.no,name:E.name,person:r.suspect||r.conclusion||'',evidence:(r.materials||[]).map(m=>m.name||m.id),disposal:(r.disposal&&(r.disposal.label||r.disposal.name||r.disposal.id))||r.disposal||'',day:campaign.day};
  const key=JSON.stringify([item.id,item.ending,item.person,item.evidence,item.disposal]);const list=fails();
  if(!list.some(x=>JSON.stringify([x.id,x.ending,x.person,x.evidence,x.disposal])===key)){list.push(item);try{localStorage.setItem(FAILKEY,JSON.stringify(list.slice(-12)))}catch(e){}}}
 function failHtml(){const list=fails().filter(x=>campaign&&x.id===campaign.rwId);if(!list.length)return '';
  return '<section class="rpg-panel rw-fails"><h2>📕 失败的报告</h2><p class="survival-tip">这些报告都让你走向了死亡。它们说明不了哪里错了——只说明，你曾经这样相信过。</p><ol>'+
   list.map(x=>'<li><b>BAD END '+esc(x.no)+'「'+esc(x.name)+'」</b><br><small>关键人物：'+esc(personName(x.person)||'—')+'　证据：'+(x.evidence.length?x.evidence.map(e=>esc(e)).join('、'):'—')+(x.disposal?'　处理方式：'+esc(x.disposal):'')+'</small></li>').join('')+'</ol></section>'}
 function hookReport(){if(!window.CASE5||CASE5.__rw)return;const orig=CASE5.reportPage;
  CASE5.reportPage=function(){const r=orig.apply(this,arguments);try{const h=failHtml();if(h){const shell=document.querySelector('#app .rpg-shell')||document.querySelector('#app');if(shell&&!shell.querySelector('.rw-fails'))shell.insertAdjacentHTML('afterbegin',h)}}catch(e){}return r};
  CASE5.__rw=true}
 /* ---------- 存档页：回到第 N 天早上 ---------- */
 function cpHtml(){if(!campaign)return '';const list=cps().filter(c=>c.id===campaign.rwId).sort((a,b)=>b.day-a.day);if(!list.length)return '';
  const c=cost(),ok=canPay();
  return '<section class="rpg-panel rw-days"><h2>↩ 回到某一天的早上</h2><p class="survival-tip">每天早上会自动留下一个检查点（只保留最近两天）。回溯代价：SAN −'+c+'；之后每次增加 '+GAME_CONFIG.ch1Repairs.rewind.step+'。SAN 不足时扣至 1，仍可恢复。</p><div class="rpg-list">'+
   list.map(x=>'<button type="button" class="rpg-action" data-rw-day="'+x.day+'"'+(ok?'':' disabled')+'>回到 DAY '+x.day+' 的早上（SAN −'+c+'）</button>').join('')+'</div>'+(ok?'':'<p class="survival-tip">SAN 不够了，无法再回溯。</p>')+'</section>'}
 function injectSaves(){const app=document.getElementById('app');if(!app||!app.querySelector('[data-slot-save]')||app.querySelector('.rw-days'))return;
  const h=cpHtml();if(!h)return;const secs=app.querySelectorAll('section.rpg-panel');const at=secs[1]||secs[0];if(!at)return;at.insertAdjacentHTML('afterend',h);
  app.querySelectorAll('[data-rw-day]').forEach(b=>b.onclick=()=>{const d=+b.dataset.rwDay;
   const go=()=>restoreDay(d);
   try{UI.modal({title:'回到 DAY '+d+' 的早上？',text:'之后发生的一切都会消失。回溯会消耗 SAN（−'+cost()+'）。',buttons:[{label:'回溯',primary:true,fn:go},{label:'取消'}]})}catch(e){go()}})}
 function hookSave(){if(typeof campaignSave!=='function'||campaignSave.__rw)return;const orig=campaignSave;
  campaignSave=function(){try{if(campaign){campaign.rwId??=('rw'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));coldSync();cpSync()}}catch(e){}return orig.apply(this,arguments)};campaignSave.__rw=true}
 setTimeout(()=>{hookSave();hookDeaths();hookReport();
  try{new MutationObserver(()=>injectSaves()).observe(document.getElementById('app'),{childList:true})}catch(e){}},0);
 return {pay,cost,canPay,cps,restoreDay,fails,failHtml,coldSync};
})();
window.REWIND=REWIND;

