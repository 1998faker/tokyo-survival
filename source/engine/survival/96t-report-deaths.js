/* ==== engine/survival/96t-report-deaths.js ==== */
/* ===================================================================
   【第一章 · 第四阶段 V3.0】最终报告导致的 13 种调查死亡结局（v30）
   - 文字与画面：data/investigation/death-endings.json（steps：邮件 / 旁白 / 台词 + 背景地图 + 画面异变 + 音效）
   - 只由 96s-case-report.js 的判定器在提交报告后调用：DEATHS.play(id, done) → 演出 → DEATHS.endScreen(id)（BAD END 结算）
   - 背景用酒店现有的像素地图（H18.drawMap）；不新增动画系统。
   - 结算画面：「↩ 回到提交报告之前」（死亡回溯）/「重新开始游戏」。
   =================================================================== */
const DEATHS=(function(){
 const D=()=>((GAME_DATA.d['investigation/death-endings']||{}).endings)||{};
 const has=id=>!!D()[id];
 /* {name} = 调查员的姓名（和邮件、开场一样：没有设定时用「调查员」） */
 const fill=t=>String(t??'').replace(/\{name\}/g,(campaign&&campaign.name)||'调查员');
 const FX=['dark','flicker','stretch','red','glitch','door','white','static'];
 function sfx(n){try{if(n&&window.AUDIO)AUDIO.sfx(n)}catch(e){}}
 function lineHtml(l){if(typeof l==='string')return `<p>${esc(l)}</p>`;if(l&&l.red)return `<p class="mail-red">${esc(l.red)}</p>`;return ''}
 function play(id,done){
  const E=D()[id];if(!E){if(done)done();return}
  let i=0;
  UI.scene('story',()=>play(id,done));
  try{if(window.AUDIO)AUDIO.ambience('late')}catch(e){}
  app.innerHTML=`<div class="dx-root" id="dx-root" data-ending="${esc(id)}"><canvas class="dx-bg" id="dx-bg" width="512" height="352" aria-hidden="true"></canvas><div class="dx-fx" aria-hidden="true"></div>
   <div class="dx-stage"><div class="dx-card" id="dx-card" aria-live="polite"></div>
   <div class="dx-btns"><button type="button" class="story-btn" id="dx-next">▶ 继续</button><button type="button" class="story-btn alt" id="dx-skip">跳过演出</button></div></div></div>`;
  const root=app.querySelector('#dx-root'),card=app.querySelector('#dx-card'),bg=app.querySelector('#dx-bg');
  let lastScene=null;
  const show=()=>{
   const s=E.steps[i];if(!s){finish();return}
   const actorId=id.startsWith('death_dahlia_')?id.slice('death_dahlia_'.length):'';
   const actor=DAHLIA.actors[actorId];
   if(actor){
    let portrait=root.querySelector('.dahlia-portrait');
    const art=window.TACHIE_DATA?.[actorId]?.base;
    if(!portrait&&art){
     portrait=document.createElement('img');portrait.src=art;portrait.alt='';portrait.className='dahlia-portrait';
     card.parentElement.before(portrait);
    }
    if(portrait){
     portrait.hidden=s.scene==='black';
     portrait.classList.toggle('dahlia-approach',i===actor.steps.length-1);
     portrait.classList.toggle('dahlia-shadow',actorId==='kobayashi'&&i>=4);
    }
    root.style.setProperty('--dahlia-dim',actorId==='mori'||actorId==='sato'?Math.max(.24,1-i*.25):1);
   }
   const scene=s.scene||(s.mail?lastScene:'black')||'black';
   if(scene!==lastScene){lastScene=scene;const g=bg.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,bg.width,bg.height);if(scene!=='black'&&window.H18&&H18.maps&&H18.maps[scene])try{H18.drawMap(bg,scene)}catch(e){}}
   FX.forEach(f=>root.classList.remove('fx-'+f));if(s.fx)root.classList.add('fx-'+s.fx);
   root.classList.toggle('dx-black',scene==='black');
   if(s.card){const c=s.card;card.className='dx-card dx-doc';card.innerHTML=`<div class="dx-doc-title">${esc(fill(c.title))}</div><dl>${(c.rows||[]).map(r=>`<div><dt>${esc(fill(r[0]))}</dt><dd>${esc(fill(r[1]))||'&nbsp;'}</dd></div>`).join('')}</dl>`;sfx(s.sfx||'page')}
   else if(s.mail){const m=s.mail;card.className='dx-card dx-mail'+(m.strange?' strange':'');card.innerHTML=`<div class="dx-phone">📱 新邮件</div><div class="mail-head"><p><small>发件人</small><b>${esc(fill(m.from))}</b></p><p><small>主题</small><b>${esc(fill(m.subject))}</b></p></div><div class="mail-body">${(m.lines||[]).map(l=>lineHtml(typeof l==='string'?fill(l):l)).join('')}</div>`;sfx(s.sfx||'ding')}
   else if(s.who){card.className='dx-card dx-line';card.innerHTML=`<b class="dx-who">${esc(s.who)}</b>${s.jp?`<p class="dx-jp" lang="ja">「${esc(s.jp)}」</p>`:''}<p>${esc(fill(s.text||'')).replace(/\n/g,'<br>')}</p>`;sfx(s.sfx)}
   else{card.className='dx-card dx-text';card.innerHTML=`<p>${esc(fill(s.text||'')).replace(/\n/g,'<br>')}</p>`;sfx(s.sfx)}
   card.classList.remove('in');void card.offsetWidth;card.classList.add('in');
  };
  const finish=()=>{root.classList.add('fx-end');setTimeout(()=>{if(done)done()},600)};
  app.querySelector('#dx-next').onclick=()=>{i++;show()};
  app.querySelector('#dx-skip').onclick=()=>{i=E.steps.length;show()};
  show();window.scrollTo(0,0);
 }
 /* BAD END 结算画面（V3.0）：调查局 · 案件终审 → BAD END 编号 → 结局名称 → 调查局最终评语 → 调查员状态 → 回溯 / 重新开始（依次浮现） */
 function endScreen(id,opts){
  const E=D()[id]||(window.CH1CLOSE&&CH1CLOSE.meta(id))||{no:'??',name:'',finalRemark:''};opts=opts||{};
  UI.scene('story',()=>endScreen(id,opts));
  app.innerHTML=`<div class="rpg-shell"><section class="story-panel dx-end"><div class="story-meta dx-s1">调查局 · 案件终审 // FILE NO. 001</div>
   <div class="dx-badno dx-s2">${E.badge?esc(E.badge):'BAD END '+esc(E.no)}</div><h1 class="dx-s3">${esc(E.name)}</h1>
   <blockquote class="dx-remark dx-s4"><p>「${esc(E.finalRemark)}」</p><cite>—— 调查局 · 最终评语</cite></blockquote>
   <p class="dx-fate dx-s5">调查员 ${esc(fill('{name}'))}：${esc(E.fate||'失踪')}</p>
   ${opts.explanation?'<section class="flood-recap"><h2>水没之后</h2><p>'+esc(opts.explanation)+'</p>'+(opts.recap?.length?'<ul>'+opts.recap.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'')+'</section>':''}
   ${campaign.case1?.report?.materials?'<details><summary>查看已提交报告</summary>'+campaign.case1.report.materials.map(ROOMFILE.archived).map(e=>'<p>'+esc(e.id+' · '+e.name)+'</p>'+CASE_NOTES.sourceSummary(e)+CASE_NOTES.sourceRows(e)+'<p>我的判断：'+esc(e.interpretation)+'</p>').join('')+'</details>':''}<div class="ch1-retry dx-s6">${opts.canRewind?'<button class="story-btn" id="dx-rewind">↩ '+esc(opts.rewindLabel||'回到提交报告之前')+'</button>':''}<button class="story-btn alt" id="dx-new">重新开始游戏</button></div></section></div>`;
  const rw=app.querySelector('#dx-rewind');if(rw)rw.onclick=()=>UI.confirm(opts.rewindTitle||'回到提交报告之前？',opts.rewindText||'回到你确认提交最终调查报告之前的那一刻。可以重新选择案件结论和报告材料。',()=>{if(opts.onRewind)opts.onRewind()});
  app.querySelector('#dx-new').onclick=()=>UI.confirm('重新开始游戏？','当前的进度会被清除（手动存档栏位不受影响）。',()=>SM.newGame());
  window.scrollTo(0,0);
 }
 return {has,play,endScreen,list:()=>Object.keys(D())};
})();
window.DEATHS=DEATHS;
