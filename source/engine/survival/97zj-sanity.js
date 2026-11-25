/* ==== engine/survival/97zj-sanity.js ==== */
/* v51: shared language, fatigue, contamination and recovery mechanics. */
const V51=(()=>{
 const C=GAME_CONFIG.v51,J=GAME_CONFIG.jlpt;
 let ready=false,deathQueued=false,lastScene='',lastStep=0,lastVenue='',venueCampaign=null;
 const utilityPages=new Set(['quest','bag','archive','reasoning','investigation','mail','settings','saves']);
 const levelFor=xp=>5-J.thresholds.filter(n=>xp>=n).length;
 const legacyXp=()=>Math.floor(Math.max(0,Number(progress.exp)||0)/J.legacyExpPerPoint);
 function migrate(legacy=true){
  if(!campaign)return;
  campaign.jlpt??={level:5,xp:legacy?legacyXp():0};
  const j=campaign.jlpt;j.xp=Math.max(0,Math.min(J.thresholds.at(-1),Number(j.xp)||0));j.level=levelFor(j.xp);
  campaign.eyes??={day:0,stations:[]};
  if(!campaign.v51&&campaign.investigation?.clues){
   const stored=campaign.investigation.clues;
   for(const clue of GAME_DATA.d['investigation/clues'].clues){
    if(/^C\d{2}$/.test(clue.id)&&(clue.from?.evidence||clue.from?.testimony)&&stored[clue.id]){
     stored[clue.id].v51Protected=true;delete stored[clue.id].taint;
    }
   }
  }
  campaign.v51??={};
  const v=campaign.v51;
  v.visits??=[...(campaign.visitedToday||[])].reverse();v.daily??={};v.pendingLevels??=0;
  v.run??=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  if(v.charmUntil<campaign.day&&campaign.items)delete campaign.items['v51-omamori'];
 }
 function language(){if(campaign)migrate();return campaign?.jlpt||{level:levelFor(legacyXp()),xp:legacyXp()}}
 function languageLabel(){return '日本語 N'+language().level}
 function bar(){const {level,xp}=language(),i=5-level,lo=J.thresholds[i-1]||0,hi=J.thresholds[i];
  const percent=hi?100*(xp-lo)/(hi-lo):100;
  return '<span class="v51-progress-value">'+Math.round(percent)+'%</span><span class="v51-progress" role="progressbar" aria-label="语言理解度" aria-valuenow="'+Math.round(percent)+'" title="语言理解度 '+Math.round(percent)+'%"><i style="width:'+percent+'%"></i></span>'}
 function venue(){
  if(!campaign)return '';
  if(venueCampaign!==campaign){venueCampaign=campaign;lastVenue=''}
  if(app.querySelector('#v51-shrine'))return 'shrine';
  if(window.H18?.active()||app.querySelector('#h18-stage,#v51-collapse-room')||
   (app.querySelector('#pro-stage')&&(['hotel','room'].includes(campaign.prologue?.scene)||campaign.prologue?.morning)))return 'hotel';
  if(utilityPages.has(UI.current()))return lastVenue;
  return '';
 }
 const hotel=()=>venue()==='hotel';
 const sanctuary=()=>!!campaign&&(venue()==='shrine'||
  (hotel()&&campaign.hotelSafe!==false&&campaign.shell?.received!==true));
 const charm=()=>!!campaign&&campaign.v51?.charmUntil>=campaign.day;
 function tier(){return !campaign?null:C.fatigue.tiers.find(t=>campaign.hp<=t.max)||null}
 function speed(){return tier()?.speed||1}
 function chance(){
  if(!campaign)return {total:0};
  const base=C.taint.san.find(([max])=>campaign.san<=max)?.[1]||0;
  const lang=C.taint.language[language().level],fat=tier()?.collapse?C.taint.fatigue:1;
  const item=charm()?C.taint.charm:1,safe=sanctuary();
  const hotelFactor=hotel()&&!safe&&(campaign.hotelSafe===false||campaign.shell?.received===true)?C.taint.hotelUnsafeFactor:1;
  return {base,lang,fat,item,safe,hotelFactor,total:safe?0:Math.min(C.taint.cap,base*lang*fat*item*hotelFactor)};
 }
 function gain(n,source){
  if(!campaign||GS.dead()||campaign.v51?.death)return;
  const j=language(),before=j.level;
  j.xp=Math.min(J.thresholds.at(-1),j.xp+(n??J.gains[source]??0));j.level=levelFor(j.xp);
  if(before>j.level){
   campaign.v51.pendingLevels+=before-j.level;
   if(window.TAINT)TAINT.clean(TAINT.ids().slice(0,J.purify*(before-j.level)));
   queueMicrotask(onScene);
  }
  campaignSave();
 }
 function award(node,ctx,listen){
  if(!campaign)return;
  migrate();
  const key=(ctx.prologueLocalization?'prologue':ctx.tauntScene||'story')+':'+node.id;
  const seen=campaign.v51.answers??={};
  if(seen[key])return;
  seen[key]=true;
  gain(null,listen?(window.LANGAID?.count(node)>0?'recall':'main'):(ctx.prologueLocalization||ctx.tauntScene==='hotel'?'main':'life'));
 }
 function hasDeathEnding(c=campaign){
  return !!(c&&(c.v51?.death||c.v51?.narrativeDeath||c.prologue?.dead||c.prologue?.fatal||
   c.perilDeath||c.case1?.state==='dead'||(c===campaign&&(PRO.fatalPending()||PGIRL.deathPending()))));
 }
 function saveNotice(){
  if(!ready||!campaign)return;
  UI.update();
  if(campaign.hp>0||hasDeathEnding()||deathQueued)return;
  const pending=campaign;deathQueued=true;
  queueMicrotask(()=>{deathQueued=false;if(campaign===pending&&campaign.hp<=0&&!hasDeathEnding())die('death_v51_fatigue')});
 }
 function dayTime(min){
  if(!campaign||!min)return;
  const hotel=campaign.hotelCase?.v18;if(hotel?.clockDay===campaign.day&&hotel.flags?.['tonight:entered']){hotel.clock=Math.min(720,hotel.clock+min);VERIFY.sync();return}
  const v=campaign.v51;
  if(v.timeDay!==campaign.day){v.timeDay=campaign.day;v.minutes=0}
  v.minutes+=min;
 }
 function action(type,localClock=false){
  migrate();
  const v=campaign.v51,F=C.fatigue,t=tier();
  if(v.collapseDay===campaign.day&&type!=='rest'){UI.toast('你今天已经累倒了。先休息，等到明天。');return false}
  PERIL.checkpoint(true);
  const drain=window.V52?V52.fatigueCost(type,F.cost[type]||0):(F.cost[type]||0);
  if(drain)GS.change({hp:-drain});
  if(campaign.hp===0){campaignSave();return false}
  if(type!=='rest'&&t?.collapse&&Math.random()<t.collapse){
   if(window.H18?.active())H18.stop();
   DM.close();
   v.collapseDay=campaign.day;campaign.actions=0;campaign.location='shinagawa';
   GS.change({cash:-F.collapseFee,hp:F.collapseHp-campaign.hp});
   UI.scene('story',collapseRoom);collapseRoom();
   return false;
  }
  if(type!=='hotel'&&!localClock)dayTime(t?.minutes||0);
  return true;
 }
 function collapseRoom(){
  app.innerHTML='<div class="rpg-shell"><section class="rpg-panel" id="v51-collapse-room"><h2>港屋酒店 · 你醒了</h2><p>路人把你送回了酒店。今天剩余行动已取消，支付了 ¥'+C.fatigue.collapseFee+'。</p><button class="story-btn" id="v51-collapse-next">☾ 夜间结算</button></section></div>';
  app.querySelector('#v51-collapse-next').onclick=()=>{sleep();nightlyClose()};
 }
 function afterRewind(){migrate();campaign.v51.whisperDay=campaign.day}
 function die(id,play){
  if(!campaign||campaign.v51?.death)return;
  migrate();
  if(window.H18?.active())H18.stop();
  DM.close();document.querySelector('.et-modal-back,.sc-overlay')?.remove();
  const current=campaign,death=campaign.v51.death={id,day:campaign.day};campaignSave();
  if(play)return play().then(()=>{if(campaign===current&&campaign.v51?.death===death)deathScreen()});
  DEATHS.play(id,deathScreen);
 }
 function deathScreen(){
  const death=campaign.v51?.death;if(!death)return false;
  if(death.id==='death_v51_kisaragi'){
   DEATHS.endScreen(death.id,{canRewind:true,rewindLabel:'回到如月车站的选择',
    rewindTitle:'回到如月车站的选择？',rewindText:'从这次异常遭遇重新选择。',
    onRewind:()=>{delete campaign.v51.death;campaignSave();PGIRL.resumeKisaragi()}});
   return true;
  }
  const cp=PERIL.cp(),valid=cp&&cp.day===death.day&&cp.data?.v51?.run===campaign.v51.run;
  DEATHS.endScreen(death.id,{canRewind:!!valid,rewindLabel:'回到第 '+death.day+' 天早上',
   rewindTitle:'回到第 '+death.day+' 天早上？',rewindText:death.id==='death_v51_whisper'?'今日进度将重置，当天不会再次发生低语吞没。':'今日进度将重置。',
   onRewind:()=>{campaign=JSON.parse(JSON.stringify(cp.data));migrate();campaign.v51.whisperDay=death.day;campaignSave();resumeGame()}});
  return true;
 }
 function resumeGame(){if(!campaign.firstDayComplete&&window.PRO?.applies())PRO.start();else tokyoHome()}
 const pairs=Object.fromEntries('聞間 海悔 待持 日目 未末 土士 人入 大犬 木本 水氷 青清 白百 口回 田由 今令 歩渉 住往 鳥烏 左右 貝見 車軍 言音 場湯 駅訳 開閉 按安 銀眼 明朋 问间 时旷 江汪 休体 夜液 话诂 走起 路洛 来米'.split(' ').map(x=>[x[0],x[1]]));
 function distort(value,option=false){
  const s=String(value??'');if(!campaign||sanctuary()||!s)return s;
  const [light,heavy]=C.distort[language().level];if(campaign.san>light)return s;
  const chars=Array.from(s),eligible=[];
  for(let i=0;i<chars.length;i++){
   if(chars.slice(i,i+4).join('')==='フタグン'){i+=3;continue}
   if(/[\p{L}\p{N}]/u.test(chars[i])&&!/[A-Za-z0-9]/.test(chars[i])&&!/\p{M}/u.test(chars[i+1]||''))eligible.push(i);
  }
  if(eligible.length<3)return s;
  const severe=campaign.san<=heavy;
  const count=Math.min(eligible.length-2,option?(severe?2:1):severe?Math.max(1,Math.round(eligible.length*.35)):eligible.length>20?2:1);
  let seed=0;for(const ch of s)seed=(Math.imul(seed,31)+ch.codePointAt(0))>>>0;
  const offset=1+seed%Math.max(1,eligible.length-count-1);
  const targets=eligible.slice(offset,offset+count);
  if(severe&&!option){
   const chunk=targets.slice(0,Math.ceil(targets.length*.7));
   const original=chunk.map(i=>chars[i]).join('');
   chars[chunk[0]]=new TextDecoder('shift_jis').decode(new TextEncoder().encode(original));
   chunk.slice(1).forEach(i=>chars[i]='');
   targets.slice(chunk.length).forEach((i,k)=>chars[i]=k%2?(pairs[chars[i]]||'▓'):'█');
  }else targets.forEach((i,k)=>chars[i]=(seed+k)%2===0?(pairs[chars[i]]||'▓'):'█');
  return chars.join('');
 }
 function whisper(choices){
  if(!campaign||campaign.day<1||campaign.san>C.whisper.maxSan||sanctuary()||charm()||choices.filter(c=>!c.disabled).length<2)return null;
  migrate();
  if(campaign.v51.whisperDay===campaign.day||Math.random()>=C.whisper.rates[language().level])return null;
  PERIL.checkpoint(true);
  campaign.v51.whisperDay=campaign.day;campaignSave();
  const pool=GAME_DATA.d['data/whispers'],line=pool[Math.floor(Math.random()*pool.length)];
  return choices.map(()=>({t:line.text,note:line.note,whisper:true,fn:()=>die('death_v51_whisper')}));
 }
 function recordStation(id){
  migrate();const v=campaign.v51;
  v.visits=[id,...v.visits.filter(s=>s!==id)].slice(0,stations.length);campaignSave();
 }
 function eyes(){
  if(!campaign?.firstDayComplete)return;
  migrate();if(campaign.eyes.day===campaign.day)return;
  const range=C.eyes.tiers.find(([max])=>campaign.san<=max),list=[];
  if(range){
   const [,lo,hi]=range,count=Math.max(0,lo+Math.floor(Math.random()*(hi-lo+1))+(C.eyes.language[language().level]||0));
   const hidden=new Set(GAME_CONFIG.map.hiddenStations);
   const valid=id=>!protectedStation(id)&&!hidden.has(id)&&byId[id]&&MAP25.data()?.pos[id]&&TRAVEL.open(id);
   const other=stations.map(s=>s.id).filter(valid);
   for(let i=other.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[other[i],other[j]]=[other[j],other[i]]}
   list.push(...[...new Set([...campaign.v51.visits.filter(valid),...other])].slice(0,count));
  }
  campaign.eyes={day:campaign.day,stations:list};campaignSave();
  if(list.length)queueMicrotask(()=>UI.toast('你再也想不起那个车站的名字了。'));
 }
 function protectedStation(id){
  const main=STORY[campaign.storyIndex||0]?.place;
  return id===main||id===TRAVEL.where()||C.eyes.protected.includes(id);
 }
 const swallowed=id=>campaign?.eyes?.day===campaign?.day&&!!campaign?.eyes?.stations.includes(id)&&!protectedStation(id);
 const pollutionLabel=total=>'污染 '+Number((total*100).toFixed(2))+'%';

 function showDetails(){CH1FIX.pollution()}
 function details(){
  const {safe,total}=chance();
  return '<div class="v51-status"><span class="v51-language">'+languageLabel()+bar()+'</span>'+
   '<button type="button" id="v51-pollution" aria-haspopup="dialog" aria-label="查看污染状态">'+(INV.dev()?pollutionLabel(total):'污染状态')+'</button>'+
   (safe?'<span>⛩ 圣域</span>':'')+(charm()?'<span>🧿 御守り</span>':'')+(tier()?'<span>⚡ '+(tier().collapse?'重度疲劳':'疲劳')+'</span>':'')+
   (!safe&&campaign.san<=C.distort[language().level][0]?'<span>◉ 感知异常</span>':'')+
   (campaign.eyes?.day===campaign.day&&campaign.eyes.stations.some(swallowed)?'<span>◈ 车站吞没</span>':'')+'</div>';
 }
 function onScene(){
  if(!campaign)return;
  lastVenue=venue();
  document.body.style.setProperty('--v51-train-speed',1/speed());
  const scene=UI.current()+':'+(H18.active()?H18.placeName():(app.querySelector('#pro-stage')?campaign.prologue?.scene:TRAVEL.where()))+':'+sanctuary();
  if(scene!==lastScene){
   lastScene=scene;UI.update();const t=tier();
   if(t&&campaign.hp<=GAME_CONFIG.ch1Repairs.fatigueWarning&&Math.random()<t.flash){
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.body.classList.add('v51-white');setTimeout(()=>document.body.classList.remove('v51-white'),230)}
    UI.toast('眼前一阵发白……你需要休息了。');
   }
  }
  const v=campaign.v51;
  if(v?.pendingLevels&&!hotel()&&!DM.isOpen()&&!document.querySelector('.et-modal-back')&&!v.death){
   v.pendingLevels=0;campaignSave();UI.toast('你突然读懂了当时那句话。');
  }
 }
 function walkingDelay(ms){return ms/speed()}
 function hotelEntry(){
  migrate();const v=campaign.v51;
  if(v.collapseDay===campaign.day)return false;
  if(v.hotelDay===campaign.day)return true;
  if(!action('hotel'))return false;
  v.hotelDay=campaign.day;campaignSave();return true;
 }
 function walk(){
  if(!campaign)return true;
  migrate();const v=campaign.v51;
  if(v.collapseDay===campaign.day)return false;
  v.walkSteps=(v.walkSteps||0)+1;
  if(v.walkSteps%C.fatigue.walkEvery!==0)return true;
  const ok=action('walk');campaignSave();return ok;
 }
 function sleep(){
  if(campaign.restDay===campaign.day)return;
  campaign.restDay=campaign.day;GS.change(window.V52?V52.sleepGain(GAME_CONFIG.recovery.sleep):GAME_CONFIG.recovery.sleep,'睡眠恢复');
 }
 function manualStep(){
  if(!tier())return true;
  const now=performance.now();if(now-lastStep<walkingDelay(130))return false;
  lastStep=now;return true;
 }
 const used=key=>campaign.v51.daily[key]===campaign.day;
 function once(key,fn){
  if(used(key)){UI.toast('今天已经用过这项服务。');return}
  if(fn()===false)return;
  campaign.v51.daily[key]=campaign.day;campaignSave();
 }
 function buy(item){
  const r=C.recovery[item];
  if(campaign.cash<=r.price){UI.toast('余额不足。');return false}
  GS.change({cash:-r.price,hp:r.hp,san:r.san});return true;
 }
 function shrine(){
  const R=C.recovery;
  UI.scene('sanctuary',shrine);
  app.innerHTML='<div class="rpg-shell"><section class="rpg-panel v51-facility" id="v51-shrine"><div class="rpg-kicker">MEIJI JINGŪ // 圣域</div><h1>明治神宮</h1><p>鸟居后是一条潮湿的林荫道。穿过树林，东京的声音渐渐远了。</p><div class="daily-buttons"></div></section></div>';
  addButtons(app.querySelector('#v51-shrine .daily-buttons'),[
   ['森林参道 · 一次行动',()=>once('forest',()=>{if(!spendAction('shrine'))return false;GS.change({san:R.forestSan});UI.toast('在林中走了一会儿。SAN +'+R.forestSan+'。')})],
   ['手水舍 · 免费净化一条',()=>once('wash',()=>{const id=TAINT.ids()[0];if(!id){UI.toast('手帐没有需要净化的线索。');return false}TAINT.clean([id]);UI.toast('净化了「'+TAINT.name(id)+'」。')})],
   ['授与所 · 御守り ¥'+R.charmPrice,()=>{if(charm()){UI.toast('你已经持有生效中的御守り。');return}if(campaign.cash<=R.charmPrice){UI.toast('余额不足。');return}
    campaign.v51.charmUntil=campaign.day+R.charmDays-1;campaign.items??={};campaign.items['v51-omamori']=1;
    GS.change({cash:-R.charmPrice});UI.toast('御守り有效至第 '+campaign.v51.charmUntil+' 天。')}],
   ['返回明治神宮前街区',()=>enterDistrict('meijijingumae')],
  ]);
 }
 window.MJ_FN={
  forest:()=>{const R=C.recovery;once('forest',()=>{if(!spendAction('shrine'))return false;GS.change({san:R.forestSan});UI.toast('在林中走了一会儿。SAN +'+R.forestSan+'。')})},
  wash:()=>once('wash',()=>{const id=TAINT.ids()[0];if(!id){UI.toast('手帐没有需要净化的线索。');return false}TAINT.clean([id]);UI.toast('净化了「'+TAINT.name(id)+'」。')}),
  charm:()=>{const R=C.recovery;if(charm()){UI.toast('你已经持有生效中的御守り。');return}if(campaign.cash<=R.charmPrice){UI.toast('余额不足。');return}
   campaign.v51.charmUntil=campaign.day+R.charmDays-1;campaign.items??={};campaign.items['v51-omamori']=1;GS.change({cash:-R.charmPrice});UI.toast('御守り有效至第 '+campaign.v51.charmUntil+' 天。')}};
 function addButtons(parent,buttons){
  for(const [label,fn] of buttons){
   const b=document.createElement('button');b.type='button';b.className='story-btn alt';b.textContent=label;b.onclick=fn;parent.appendChild(b);
  }
 }
 function friendly(id,name,jp,zh){
  const welcome=()=>{
   once('friend:'+id,()=>{GS.change({san:C.recovery.friendlySan});UI.toast('聊了几句。SAN +'+C.recovery.friendlySan+'。')});
  };
  UI.modal({title:name,html:'<p lang="ja">'+esc(DISTORT.text(jp))+'</p><p>'+esc(DISTORT.text(zh))+'</p>',buttons:[{label:'道别',fn:welcome}]});
 }
 function districtFacilities(){
  const shell=app.querySelector('.rpg-shell');
  if(!campaign||!district||!shell||!app.querySelector('#district-world')||app.querySelector('#v51-facilities'))return;
  const R=C.recovery,id=district.id,buttons=[];
  if(id==='meijijingumae')buttons.push(['⛩ 走进明治神宮',shrine]);
  if(['ueno','kitashinagawa'].includes(id))buttons.push(['♨ 钱汤 ¥'+R.bath.price,()=>{
   if(buy('bath'))UI.modal({title:'钱汤',text:'老板递给你一条毛巾。「お疲れさまです。」\n热水缓解了疲劳，浴室里只听得到水声。'});
  }]);
  if(['shimbashi','jinbocho'].includes(id))buttons.push(['☕ 纯喫茶 ¥'+R.cafe.price,()=>{
   if(!buy('cafe'))return;
   UI.modal({title:'纯喫茶',text:'咖啡端上来。靠窗的桌上放着今天的报纸。',buttons:[
    {label:'读报纸',fn:()=>once('newspaper',()=>{JLPT.gain(null,'newspaper');UI.toast('读懂了一行标题。理解度 +'+J.gains.newspaper+'。')})},{label:'离开'}]});
  }]);
  if(id==='ueno')buttons.push(['🐦 和喂鸽子的老奶奶聊天',()=>friendly('ueno','喂鸽子的老奶奶','今日は暖かいね。鳩もよく来るよ。','今天挺暖和的。鸽子也常来呢。')]);
  if(['shinagawa','shimbashi'].includes(id)&&campaign.hotelTanaka)buttons.push(['和田中聊天',()=>friendly('tanaka','田中震','久しぶり。ちゃんとご飯、食べてるか。','好久不见。你有好好吃饭吗？')]);
  if(['shinagawa','shibuya','ueno','shimbashi'].includes(id))buttons.push(['🥤 自动贩卖机',()=>UI.modal({title:'自动贩卖机',buttons:[
   {label:'温かいお茶 ¥'+R.tea.price,fn:()=>{if(buy('tea'))UI.toast('喝了热茶。疲劳点 +'+R.tea.hp+'。')}},
   {label:'缶コーヒー ¥'+R.coffee.price,fn:()=>{if(buy('coffee'))UI.toast('喝了罐装咖啡。疲劳点 +'+R.coffee.hp+'。')}},{label:'离开'}]})]);
  if(id==='shinagawa')buttons.push(['🏪 和便利店山田聊天',()=>friendly('yamada','山田','お疲れさま。今日は少し早く帰れるといいね。','辛苦了。希望你今天能早点回去。')]);
  if(!buttons.length)return;
  const panel=document.createElement('section');panel.id='v51-facilities';panel.className='rpg-panel v51-facility';
  panel.innerHTML='<h2>街区设施与闲聊</h2><div class="daily-buttons"></div>';
  addButtons(panel.lastElementChild,buttons);shell.appendChild(panel);
 }
 function mapSelection(){
  if(!V51.swallowed(selected))return selected;
  return TRAVEL.where()||'shinagawa';
 }
 function install(){
  migrate();
  ready=true;
  const baseSave=campaignSave;
  campaignSave=function(){migrate();baseSave();saveNotice()};
  const baseHome=tokyoHome;
  tokyoHome=function(){
   if(campaign?.v51?.death){deathScreen();return}
   if(campaign?.v51?.narrativeDeath&&campaign.hp<=0){die('death_v51_room206',()=>Promise.resolve());return}
   if(campaign&&campaign.hp<=0&&!hasDeathEnding()){saveNotice();return}
   if(campaign)PERIL.checkpoint(true);
   return baseHome.apply(this,arguments);
  };
  const baseEnter=enterDistrict;
  enterDistrict=function(id){
   if(campaign&&(swallowed(id)||campaign.v51?.collapseDay===campaign.day))return;
   const previous=app.firstElementChild,r=baseEnter.apply(this,arguments);
   if(campaign&&district?.id===id&&app.firstElementChild!==previous&&app.querySelector('#district-world')){
    recordStation(id);districtFacilities();
   }
   return r;
  };
  const baseDistrict=renderDistrict;
  renderDistrict=function(){const r=baseDistrict.apply(this,arguments);districtFacilities();return r};
  document.addEventListener('click',event=>{if(event.target.id==='v51-pollution')showDetails()});
  const header=document.getElementById('et-top');
  if(header){
   let height=0,frame=0;
   new ResizeObserver(()=>{
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
     if(height===header.offsetHeight)return;
     height=header.offsetHeight;
     document.documentElement.style.setProperty('--v51-top',height+'px');
    });
   }).observe(header);
  }
  new MutationObserver(onScene).observe(app,{childList:true,subtree:true});
 }
 return {migrate,language,languageLabel,bar,hotel,sanctuary,charm,tier,speed,chance,gain,award,saveNotice,dayTime,action,afterRewind,die,deathScreen,hasDeathEnding,distort,whisper,recordStation,eyes,swallowed,details,walkingDelay,manualStep,hotelEntry,walk,sleep,mapSelection,onScene,install};
})();
const JLPT={gain:V51.gain};
const DISTORT={
 text:V51.distort,
 html:value=>esc(value).replace(/[█▓]/g,ch=>'<span class="v51-ink">'+ch+'</span>'),
};

