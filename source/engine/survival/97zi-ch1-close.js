/* ==== engine/survival/97zi-ch1-close.js ==== */
/* ===================================================================
   【v49 第一章结局重构】见项目文档「第一章结局重构方案」「世界观总纲」
   - 只有「受理済」(juri) 与「五个人的约定」(promise) 进入下一章；其余全部是「重来」类，走 BAD END 结算。
   - 5 个人物专属结局：演出后进入统一结算画面（ENDING 徽章 + 调查局评语 + 回到提交报告之前 / 重新开始）。
   - 继续类结局之后：井上交接收容物 No.0■■「潮騒の貝」→ 调查局邮件 → 港屋安全区失效 → (promise) 残響知覚觉醒 → 东京。
   - 受理済：残響知覚只有「残片」（听得见，听不清）。
   存档：campaign.shell = {received, day, variant, host:'both'}；campaign.hotelSafe = false；
         campaign.abilities.echo.fragment = true（受理済）。
   =================================================================== */
const CH1CLOSE=(function(){
 const CONTINUE=['juri','promise'];
 const CHAR={
  mori_open:'本日も営業中',sato_family:'兄とこの家のためなら',kobayashi_name:'本名で死にたい',
  tanaka_accused:'お前、何を調べてたんだ',yumi_weekly:'週刊誌の読みすぎ'};
 function meta(id){
  if(!CHAR[id])return null;
  return {badge:'ENDING',no:'',name:CHAR[id],finalRemark:'你查到了一个人的秘密，却没有查到片山茂身上发生了什么。',fate:'调查终止（报告被驳回）'};
 }
 function continues(variant){return CONTINUE.includes(variant)}

 /* ---------- 井上交接 ---------- */
 function steps(variant){
  const S=[
   {text:DAHLIA.sealed(campaign)?'调查结束的那天早上，井上在走廊叫住你。你手里用旧毛巾包着的貝，已经封住了花核。':'调查结束的那天早上，井上在走廊叫住你。\n她手里拿着一个用旧毛巾包着的东西。毛巾边上沾着铁锈，像是从哪个配管间里取出来的。',scene:'corridor'},
   DAHLIA.sealed(campaign)?{who:'井上 和子',text:'「仓库总算安静了。那只貝，就交给你们调查局吧。」',scene:'corridor'}:{who:'井上 和子',jp:'206のお客さんに頼まれてたの。207のことが片づいたら、次に206に泊まる人に渡してって。',text:'“那位住 206 的客人拜托过我。等 207 的事处理完了，就交给下一个住进 206 的人。”',scene:'corridor'},
   DAHLIA.sealed(campaign)?{who:'井上 和子',text:'「从前把它放在手边，偶尔会听见海浪声。现在，你还听得见吗？」',scene:'corridor'}:{who:'井上 和子',jp:'中身は見てないよ。……でも、ときどき、波の音がした。',text:'“里面是什么我没看。……不过，有时候会听见海浪声。”',scene:'corridor'},
   {text:'毛巾里是一只手掌大的旧海螺，里面塞着一团发黄的棉花。\n表面用油性笔写着很小的字：「聞かないで」。',scene:'corridor',sfx:'page'},
   {who:'海螺',jp:'おかえりなさい。',text:'贝壳里传来一个很轻的声音：“欢迎回来。”',scene:'corridor',fx:'flicker'},
   {text:'你想起入住第一晚，电梯里那条来自陌生号码的短信。同样的一句话。\n你没有回答。',scene:'corridor'},
   variant==='promise'
    ?{text:'你还没把它贴近耳边，就已经听见了——\n很远的海浪声。还有一个已经把话说完的人，安静的呼吸。',scene:'corridor'}
    :{text:'贝壳里有声音。断断续续的，像隔着很厚的墙。\n你听得见，却听不清。',scene:'corridor',fx:'flicker'},
   {mail:{from:'INVESTIGATION BUREAU',subject:'収容物 No.0■■ 異常',lines:[
    '未登録の宿主を検出しました。',
    '直ちに片耳を塞ぎ、中の声に返事をしないでください。',
    '担当調査員に連絡を試みています。',
    {red:'（检测到未登记的宿主。请立即塞住一只耳朵，不要回应里面的声音。我们正在尝试联系负责的调查员。）'}]},sfx:'ding'},
   {text:'那天夜里，港屋酒店的走廊上，第一次听见了街上的声音。',scene:'corridor',fx:'dark',sfx:'buzz'}
  ];
  return S;
 }
 function receive(variant){
  if(!campaign)return;
  campaign.shell={received:true,day:campaign.day,variant,host:'both'};
  campaign.hotelSafe=false;
  if(variant==='juri'&&window.ECHO){const s=ECHO.state();if(s&&!s.unlocked){s.unlocked=true;s.fragment=true;s.awakened=false;s.day=campaign.day;s.uses=s.uses||0}}
  if(typeof campaignSave==='function')campaignSave();
 }
 function lineHtml(l){if(typeof l==='string')return `<p>${esc(l)}</p>`;if(l&&l.red)return `<p class="mail-red">${esc(l.red)}</p>`;return ''}
 function handover(variant,done){
  if(!campaign||(campaign.shell&&campaign.shell.received)){done&&done();return}
  const E=steps(variant);let i=0,last=null;
  UI.scene('story',()=>handover(variant,done));
  app.innerHTML=`<div class="dx-root" id="dx-root" data-ending="handover"><canvas class="dx-bg" id="dx-bg" width="512" height="352" aria-hidden="true"></canvas><div class="dx-fx" aria-hidden="true"></div>
   <div class="dx-stage"><div class="dx-card" id="dx-card" aria-live="polite"></div>
   <div class="dx-btns"><button type="button" class="story-btn" id="dx-next">▶ 继续</button></div></div></div>`;
  const root=app.querySelector('#dx-root'),card=app.querySelector('#dx-card'),bg=app.querySelector('#dx-bg');
  const FX=['dark','flicker','stretch','red','glitch','door','white','static'];
  const sfx=n=>{try{if(n&&window.AUDIO)AUDIO.sfx(n)}catch(e){}};
  const show=()=>{
   const s=E[i];if(!s){receive(variant);root.classList.add('fx-end');setTimeout(()=>done&&done(),600);return}
   const scene=s.scene||(s.mail?last:'black')||'black';
   if(scene!==last){last=scene;const g=bg.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,bg.width,bg.height);if(scene!=='black'&&window.H18&&H18.maps&&H18.maps[scene])try{H18.drawMap(bg,scene)}catch(e){}}
   FX.forEach(f=>root.classList.remove('fx-'+f));if(s.fx)root.classList.add('fx-'+s.fx);
   root.classList.toggle('dx-black',scene==='black');
   if(s.mail){const m=s.mail;card.className='dx-card dx-mail';card.innerHTML=`<div class="dx-phone">📱 新邮件</div><div class="mail-head"><p><small>发件人</small><b>${esc(m.from)}</b></p><p><small>主题</small><b>${esc(m.subject)}</b></p></div><div class="mail-body">${m.lines.map(lineHtml).join('')}</div>`}
   else if(s.who){card.className='dx-card dx-line';card.innerHTML=`<b class="dx-who">${esc(s.who)}</b><p class="dx-jp" lang="ja">「${esc(s.jp)}」</p><p>${esc(s.text).replace(/\n/g,'<br>')}</p>`}
   else{card.className='dx-card dx-text';card.innerHTML=`<p>${esc(s.text).replace(/\n/g,'<br>')}</p>`}
   sfx(s.sfx);card.classList.remove('in');void card.offsetWidth;card.classList.add('in');
  };
  app.querySelector('#dx-next').onclick=()=>{i++;show()};
  show();window.scrollTo(0,0);
 }

 /* ---------- 残響知覚「残片」（受理済） ---------- */
 function fragment(){try{const s=campaign&&campaign.abilities&&campaign.abilities.echo;return !!(s&&s.unlocked&&s.fragment)}catch(e){return false}}
 function mask(t){return String(t||'').split(/(?<=[。！？!?\n])/).map(seg=>{const s=seg.trim();if(s.length<=6)return seg;return seg.slice(0,Math.ceil(seg.length*0.4))+'……'}).join('')}
 const FRAG_LINE='你静下来听。声音很远，断断续续的，像隔着很厚的墙——你听得见，却听不清。';
 if(window.ECHO){
  const baseUse=ECHO.use,baseArchive=ECHO.archive;
  ECHO.fragment=fragment;ECHO.fragmentLine=()=>FRAG_LINE;
  ECHO.use=function(k){
   if(!fragment())return baseUse.apply(this,arguments);
   const list=ECHO.traces(k),A=((GAME_DATA.d['abilities/echo']||{}).ability)||{},s=ECHO.state();s.uses=(s.uses||0)+1;
   if(typeof campaignSave==='function')campaignSave();
   const html=list.length?'<p class="survival-tip">'+esc(FRAG_LINE)+'</p>'+list.map(x=>`<div class="story-entry echo-trace ${esc(x.kind||'memory')}"><b>${esc(x.title||'')}</b><p>${esc(mask(x.text))}</p></div>`).join(''):`<p class="survival-tip">${esc(A.none||'')}</p>`;
   UI.modal({title:'🎧 '+(A.name||'残響知覚')+'（残片）',html});
   return list;
  };
  ECHO.archive=function(){
   const h=baseArchive.apply(this,arguments);if(!h||!fragment())return h;
   return h.replace(/<h2>🎧 ([^<]*)<\/h2>/,'<h2>🎧 $1（残片）</h2>').replace(/<p class="survival-tip">[^<]*<\/p>/,'<p class="survival-tip">'+esc('你把一个人的死因写进了报告，却没有把他的话听完。贝壳里的声音，你只听得见一半。')+'</p>').replace('<small>觉醒</small>','<small>取得</small>');
  };
 }
 return {meta,continues,handover,receive,fragment,mask};
})();
window.CH1CLOSE=CH1CLOSE;

