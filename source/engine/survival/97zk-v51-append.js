/* ==== engine/survival/97zk-v51-append.js ==== */
/* v51 supplement: district services, language notes and presentation fixes. */
const V51ADD=(()=>{
 const C=GAME_CONFIG.v51Append;
 let life=null,notes=false;
 const inLife=()=>!!life&&life.owner===campaign;
 function addFavor(d,out){
  if(!d.favor)return;
  const x=campaign.v51Life??={};x.favor??={};
  x.favor[d.favor.key]=(x.favor[d.favor.key]??0)+d.favor.amount;
  out.push('好感 +'+d.favor.amount);
 }
 function useService(id,title,station=district,returnTo){
  if(!campaign||!station||inLife())return;
  const pool=full(id);
  if(!pool.length)return;
  const offer=C.services[id]||C.services.default;
  if(offer.cash<0&&campaign.cash<=-offer.cash){UI.toast('现金不足。');return}
  if(!spendAction('study'))return;
  const count=C.questions.min+Math.floor(Math.random()*(C.questions.max-C.questions.min+1));
  const fresh=pool.filter(q=>!seen.has(q)),rest=pool.filter(q=>seen.has(q));
  const list=shuf(fresh).concat(shuf(rest)).slice(0,count);
  activeReview=null;notes=false;
  life={owner:campaign,station,title,id,offer,returnTo,position:{...districtPos}};
  st={list,i:0,score:0,wrong:[],ans:false};
  UI.scene('district-life',renderLife);renderLife();
 }
 function leaveLife(){
  if(!inLife())return;
  const {station,position,returnTo}=life;life=null;
  if(returnTo){returnTo();return}
  district=station;districtPos=position;districtTarget=null;renderDistrict();
 }
 function exitLife(){
  if(inLife())UI.confirm('离开这处店铺？','已经作答的记录和疲劳点变化会保留。',leaveLife);
 }
 function renderLife(){
  if(!inLife())return;
  learnOriginalShow();
  app.querySelector('.quiz-home')?.remove();
  const top=app.querySelector('.top');if(top?.lastElementChild)top.lastElementChild.textContent=life.station.jp;
  const title=document.createElement('h1');title.className='v51-life-title';title.textContent=life.title;app.prepend(title);
  const back=document.createElement('button');back.className='rpg-inline-back';back.textContent='← 返回街区';back.onclick=exitLife;title.after(back);
  const options=[...app.querySelectorAll('.opt')];
  const swallowed=V51.whisper(options.map(b=>({t:b.textContent})));
  for(const [i,b] of options.entries()){
   if(swallowed){b.textContent=DISTORT.text(swallowed[i].t,true);b.onclick=()=>{life=null;swallowed[i].fn()}}
   else b.onclick=()=>answerLife(+b.dataset.k);
  }
  if(!swallowed){
   const tools=document.createElement('div');tools.className='learn-question-tools';tools.innerHTML=learnFavoriteHtml(st.list[st.i]);
   tools.firstElementChild.onclick=()=>learnToggle(st.list[st.i].learnId);app.querySelector('.opts').before(tools);
  }else if(swallowed[0].note){
   const note=document.createElement('small');note.textContent=swallowed[0].note;app.querySelector('.opts').after(note);
  }
 }
 function answerLife(k){
  if(!inLife()||st.ans)return;
  const q=st.list[st.i],ok=k===q.a;
  learnOriginalPick(k);
  learnRecord(q,ok,false);learnFeedback(q,ok,false);
  if(ok){JLPT.gain(null,'district');progress.correct++}
  else{progress.wrong++;GS.change({hp:-C.questions.wrongHp})}
  save();
  const next=app.querySelector('#nx');
  next.onclick=()=>{if(!inLife()||!st.ans||GS.dead())return;st.i++;if(st.i===st.list.length)finishLife();else renderLife()};
 }
 function finishLife(){
  if(!inLife())return;
  const r=life;
  const success=!st.wrong.length&&(r.offer.cash>=0||campaign.cash>-r.offer.cash);
  const delta=success?GS.change({...r.offer,favor:{key:r.station.id+':'+r.id,amount:r.offer.favor}}):'';
  campaign.clears++;campaignSave();
  app.innerHTML='<section class="rpg-panel"><h1>'+esc(r.title)+'</h1><p>'+esc(success?'交谈顺利，事情办妥了。':'这次没有办成，你先离开了。')+'</p>'+
   (delta?'<p>'+esc(delta)+'</p>':'')+'<button class="survival-btn" id="v51-life-back">返回 '+esc(r.station.jp)+' 街区</button></section>';
  app.querySelector('#v51-life-back').onclick=leaveLife;
 }
 function notesHeader(){
  app.querySelector('#learn-navigation')?.remove();
  app.querySelector('#v51-notes-nav')?.remove();
  const nav=document.createElement('nav');nav.id='v51-notes-nav';nav.className='rpg-nav';
  nav.innerHTML='<b>语言笔记</b><button type="button">收藏</button><button type="button">错题本</button><button type="button">返回调查手帐</button>';
  const [fav,wrong,back]=nav.querySelectorAll('button');
  fav.onclick=()=>openNotes('favorites');wrong.onclick=()=>openNotes('wrong');
  back.onclick=()=>{leaveNotes();INV.page()};
  app.prepend(nav);
  const oldBack=app.querySelector('.quiz-home,[onclick="home()"]');
  if(oldBack){oldBack.removeAttribute('onclick');oldBack.textContent='返回语言笔记';oldBack.onclick=()=>openNotes(libraryView?.type||'favorites')}
 }
 function openNotes(type='favorites'){
  notes=true;UI.scene('language-notes',()=>openNotes(type));learnLibrary(type);
 }
 function leaveNotes(){
  if(!notes)return;
  notes=false;activeReview=null;demoCancelSpeech();
 }
 function prologueNotes(){return '';
  const list=PRO.clueList();
  if(!list.length)return '';
  return '<section class="v51-prologue-notes"><h3>入境之夜 · '+list.length+' 条线索</h3>'+list.map(c=>
   '<details class="nb-card" data-v51-pro-clue="'+esc(c.id)+'"><summary>'+esc(c.name)+'</summary><small>'+esc(c.place)+'</small><p>'+esc(c.desc)+'</p>'+(c.jp?'<p lang="ja">'+esc(c.jp)+'</p>':'')+'</details>'
  ).join('')+'</section>';
 }
 function answerTranslation(node,i,ctx){
  const t=ctx.pick(node.optionTranslations?.[i]||'');
  return t&&t!==ctx.pick(node.options[i])&&langMode()==='story'?'\n所选内容：'+t:'';
 }
 function shibuyaPins(world,selectors){
  const points=[...world.querySelectorAll(selectors)].filter(b=>b.style.left&&b.style.top);
  if(!points.length)return;
  world.nextElementSibling?.matches('.v51-map-key')&&world.nextElementSibling.remove();
  const legend=document.createElement('div');legend.className='v51-map-key';legend.setAttribute('aria-label','地图地点');
  points.forEach((b,i)=>{
   const name=b.dataset.v51Label||b.querySelector('small')?.textContent||b.textContent.trim();
   b.dataset.v51Label=name;b.setAttribute('aria-label',name);b.classList.add('v51-map-pin');
   const number=i+1,mark=document.createElement('span');mark.textContent=number;mark.setAttribute('aria-hidden','true');
   b.replaceChildren(mark);
   const item=document.createElement('button');item.type='button';item.className='rpg-action';item.textContent=number+' · '+name;
   item.onclick=()=>b.click();legend.appendChild(item);
  });
  world.after(legend);
 }
 function onCross(room){
  const s=campaign.shibuyaWalk;
  if(room!=='cross'){s.v51CrossPass=null;return true}
  s.v51CrossPass??={triggered:false};
  const before=s.v51CrossAt??0;
  return !s.v51CrossPass.triggered&&Date.now()-before>=C.crosswalkCooldownMs;
 }
 function crossingEncounter(){
  const s=campaign.shibuyaWalk;
  if(s.room==='cross'){s.v51CrossPass.triggered=true;s.v51CrossAt=Date.now();campaignSave()}
 }
 function satoFixture(){
  if(!campaign||!INV.dev()||!SATO.endingReady())return false;
  CASE5.dev('reset');
  const inv=INV.state()??(INV.sync(),INV.state());
  INV.addClue('ST04',true);INV.grantEvidence('E02','佐藤报告测试档案');
  const deduction=GAME_DATA.d['investigation/deductions'].deductions.find(d=>d.id==='ST-D01');
  if(!inv.deductions[deduction.id]){
   deduction.pair.forEach(id=>INV.addClue(id,true));
   inv.deductions[deduction.id]={at:{day:campaign.day},from:deduction.pair.slice(),n:++inv.dn};
  }
  (inv.reportHypotheses??={}).sato=true;
  const c=CASE5.state();c.start??=campaign.day;campaign.day=Math.max(campaign.day,CASE5.lastDay());c.state='report';
  c.draft={schema:2,person:'sato',evidence:['E02'],conclusion:'murder',suspect:'sato',disposal:'submit'};
  campaignSave();CASE5.reportPage();return true;
 }
 function install(){
  const baseStart=start;
  start=function(id){if(campaign&&district&&UI.current()==='district'&&app.querySelector('#district-world')&&full(id).length){
   return useService(id,districtTarget?.[2]||sc(id)?.n||district.jp);
  }return baseStart.apply(this,arguments)};
  const baseLibrary=learnLibrary;
  learnLibrary=function(){const r=baseLibrary.apply(this,arguments);if(notes)notesHeader();return r};
  const baseShow=show;
  show=function(){if(notes&&activeReview){learnOriginalShow();learnDecorate(st.list[st.i]);notesHeader();return}return baseShow.apply(this,arguments)};
  const baseDemo=demoShow;
  demoShow=function(){const r=baseDemo.apply(this,arguments);if(notes&&activeReview)notesHeader();return r};
  const baseReview=learnReviewNext;
  learnReviewNext=function(){const r=baseReview.apply(this,arguments);if(notes&&!activeReview)notesHeader();return r};
  const scene=UI.scene;
  UI.scene=function(name){if(name!=='language-notes')notes=false;if(name!=='district-life'&&inLife())life=null;return scene.apply(this,arguments)};
 }
 return {addFavor,inLife,useService,exitLife,openNotes,leaveNotes,prologueNotes,answerTranslation,shibuyaPins,onCross,crossingEncounter,satoFixture,reviewing:()=>notes&&!!activeReview,install};
})();

