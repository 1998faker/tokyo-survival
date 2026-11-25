/* ==== engine/survival/30-recovery.js ==== */
/* 【恢复设施：休息、神社、药剂、抵抗组织暗号】 */
/* V7 — Recovery rooms. All costs, rewards and cooldowns live on the campaign save. */
function recoveryDefaults(){if(!campaign)return;campaign.restDay??=0;campaign.shrineDay??=0;campaign.npcDay??=0;campaign.potions??=0;campaign.energyDay??=0;campaign.energyCount??=0;campaign.sweetsDay??=0;campaign.sweetsCount??=0;campaign.incenseDay??=0;campaign.incenseCount??=0;campaign.bathHotelDay??=0;campaign.bathSentoDay??=0;campaign.nightShiftDay??=0;campaign.nightShiftLog??=[];campaign.vendingDay??=0;campaign.vendingStock??={};campaign.vendingAnomaly??={};campaign.vendingAnomalyUsed??={}}
/* V8: recovery requires physically visiting a district facility. */
function recoveryPanel(){return ''}
function mountRecovery(){} // There is no world-map shortcut any more.
const recoveryFacilities={
 haneda:[['hotel','🛏️','空港ホテル','sleep',17,84]],
 narita:[['hotel','🛏️','空港ホテル','sleep',17,84]],
 shibuya:[['hotel','🛏️','ビジネスホテル','sleep',18,84],['drugstore','🧪','ドラッグストア','potion',83,84]],
 shinjuku:[['hotel','🛏️','深夜ホテル','sleep',18,84],['drugstore','🧪','薬局','potion',83,84]],
 asakusa:[['shrine','⛩️','浅草の祈祷所','shrine',18,84],['hotel','🛏️','旅館','sleep',82,84],['sento','♨️','銭湯','sento',50,84]],
 akihabara:[['drugstore','🧪','ドラッグストア','potion',17,84]],
 disney:[['hotel','🛏️','リゾートホテル','sleep',17,84]],
 ikebukuro:[['hotel','🛏️','駅前ホテル','sleep',17,84],['drugstore','🧪','薬局','potion',83,84],['sento','♨️','銭湯','sento',50,84]],
 ueno:[['hotel','🛏️','宿','sleep',17,84],['drugstore','🧪','薬局','potion',83,84],['sento','♨️','銭湯','sento',50,84]]
};
const hiddenAgents={shibuya:['古着屋の裏通り','🕯️'],akihabara:['電気街の情報屋','📻'],shinjuku:['歌舞伎町の影','🕵️'],asakusa:['境内の巫女','🕯️'],ikebukuro:['地下通路の協力者','🕵️'],ueno:['公園の旅人','🕯️']};
function facilitiesFor(id){const list=(recoveryFacilities[id]||[['hotel','🛏️','駅前の宿','sleep',17,84],['drugstore','🧪','薬局','potion',83,84]]).slice();if(!list.some(f=>f[3]==='vending'))list.push(['vending','🥤','自動販売機','vending',34,84]);return list}
function facilityMessage(label){let box=document.getElementById('district-chat');if(box)box.innerHTML='<strong>☾ '+label+'</strong><p>与设施交互，使用理智恢复服务。</p>'}
function recoveryRefresh(message){campaignSave();sanAtmosphere();app.querySelectorAll('.survival-hud').forEach(e=>e.outerHTML=campaignHUD());
 if(district&&document.getElementById('district-world')){renderFacilityControls();let log=document.getElementById('district-chat');if(log&&message)log.innerHTML='<strong>☾ 结界记录</strong><p>'+esc(message)+'</p>';}
}
function recoveryAction(type){if(!campaign||campaign.san<=0||campaign.day>=campaign.days)return;recoveryDefaults();let d=campaign.day,value=0,label='';
 if(type==='sleep'){if(campaign.restDay===d){recoveryRefresh('今天已经休息过。');return}value=0;V51.sleep();label='旅馆的门锁挡住了低语。疲劳点和 SAN 已恢复。'}
 if(type==='shrine'){const sh=GAME_CONFIG.recovery.shrine;if(campaign.shrineDay===d||campaign.cash<sh.cost){recoveryRefresh('今日已净化，或资金不足 '+sh.cost+'円。');return}campaign.shrineDay=d;campaign.cash-=sh.cost;value=sh.san;label='浅草祈祷所的铃声驱散幻觉。'+sh.cost+'円 / SAN +'+sh.san+'。'}
 if(type==='potion'){const po=GAME_CONFIG.recovery.potion;if(campaign.cash<po.cost){recoveryRefresh('资金不足 '+po.cost+'円。');return}campaign.cash-=po.cost;campaign.potions++;value=po.san;label='从药妆店购买并喝下药剂。'+po.cost+'円 / SAN +'+po.san+'。'}
 if(type==='energy'){const en=GAME_CONFIG.recovery.energy;if(campaign.energyDay!==d){campaign.energyDay=d;campaign.energyCount=0}if(campaign.energyCount>=en.maxPerDay){recoveryRefresh('能量饮料今天已达上限（'+en.maxPerDay+' 次）。');return}if(campaign.cash<en.cost){recoveryRefresh('资金不足 '+en.cost+'円。');return}campaign.cash-=en.cost;campaign.energyCount++;campaign.hp=Math.min(GAME_CONFIG.player.maxHP,campaign.hp+en.hp);campaign.stress=Math.min(GAME_CONFIG.player.maxStress,campaign.stress+en.stress);label='喝下能量饮料。'+en.cost+'円 / 疲劳点 +'+en.hp+'，压力 +'+en.stress+'。（今日 '+campaign.energyCount+'/'+en.maxPerDay+')'}
 if(type==='sweets'){const sw=GAME_CONFIG.recovery.sweets;if(campaign.sweetsDay!==d){campaign.sweetsDay=d;campaign.sweetsCount=0}if(campaign.sweetsCount>=sw.maxPerDay){recoveryRefresh('甜食今天已达上限（'+sw.maxPerDay+' 次）。');return}if(campaign.cash<sw.cost){recoveryRefresh('资金不足 '+sw.cost+'円。');return}campaign.cash-=sw.cost;campaign.sweetsCount++;campaign.stress=Math.max(0,campaign.stress+sw.stress);label='吃下甜食。'+sw.cost+'円 / 压力 '+sw.stress+'。（今日 '+campaign.sweetsCount+'/'+sw.maxPerDay+')'}
 if(type==='incense'){const ic=GAME_CONFIG.recovery.incense;if(campaign.incenseDay!==d){campaign.incenseDay=d;campaign.incenseCount=0}if(campaign.incenseCount>=ic.maxPerDay){recoveryRefresh('便携线香今天已达上限（'+ic.maxPerDay+' 次）。');return}if(campaign.cash<ic.cost){recoveryRefresh('资金不足 '+ic.cost+'円。');return}campaign.cash-=ic.cost;campaign.incenseCount++;value=ic.san;label='点上便携线香，青烟让呼吸慢了下来。'+ic.cost+'円 / SAN +'+ic.san+'。（今日 '+campaign.incenseCount+'/'+ic.maxPerDay+')'}
 if(type==='bathHotel'){const bh=GAME_CONFIG.recovery.bathHotel;if(campaign.bathHotelDay===d){recoveryRefresh('今天已经泡过澡了。');return}if(campaign.cash<bh.cost){recoveryRefresh('资金不足 '+bh.cost+'円。');return}campaign.bathHotelDay=d;campaign.cash-=bh.cost;campaign.stress=Math.max(0,campaign.stress+bh.stress);campaign.hp=Math.min(GAME_CONFIG.player.maxHP,campaign.hp+bh.hp);label='在酒店浴室放满热水，加入入浴剂。约 60 分钟。'+bh.cost+'円 / 压力 '+bh.stress+'，疲劳点 +'+bh.hp+'。';if(Math.random()<bh.anomalyChance){value=bh.anomalySan;label+=' 排水口深处传来一声很轻的回响，像有人在管道另一头叹气。SAN '+bh.anomalySan+'。'}}
 if(type==='bathSento'){const bs=GAME_CONFIG.recovery.bathSento;if(campaign.bathSentoDay===d){recoveryRefresh('今天已经去过钱汤了。');return}if(campaign.cash<bs.cost){recoveryRefresh('资金不足 '+bs.cost+'円。');return}campaign.bathSentoDay=d;campaign.cash-=bs.cost;campaign.stress=Math.max(0,campaign.stress+bs.stress);campaign.hp=Math.min(GAME_CONFIG.player.maxHP,campaign.hp+bs.hp);label='在钱汤的大浴池里泡到肩。约 60 分钟。'+bs.cost+'円 / 压力 '+bs.stress+'，疲劳点 +'+bs.hp+'。'}
 campaign.san=sanClamp(campaign.san+value);recoveryRefresh(label)
}
function npcCommission(){if(!campaign||campaign.npcDay===campaign.day)return;
 let host=document.getElementById('district-chat');if(!host)return;
 let items=[{q:'「お気をつけて」是什么意思？',o:['请多保重 / 路上小心','请支付车费','请保持安静'],a:0},{q:'「こちらへどうぞ」是什么意思？',o:['马上离开','请往这边走','不要拍照'],a:1},{q:'「運転を見合わせています」是什么意思？',o:['暂停运行','终点到了','票价上涨'],a:0},{q:'「袋はご利用ですか」是什么意思？',o:['需要购物袋吗','要收据吗','要加热吗'],a:0}];
 const q=items[(campaign.day+campaign.clears)%items.length];
 host.innerHTML='<strong>🕯️ 抵抗组织的暗号</strong><p>'+q.q+'</p>'+q.o.map((v,i)=>'<button class="rpg-action" data-npc-answer="'+i+'">'+String.fromCharCode(65+i)+'. '+v+'</button>').join('');
 host.querySelectorAll('[data-npc-answer]').forEach(btn=>btn.onclick=()=>{if(!campaign||campaign.npcDay===campaign.day)return;
 if(+btn.dataset.npcAnswer===q.a){JLPT.gain(null,'life');const rn=GAME_CONFIG.recovery.resistanceNpc;campaign.npcDay=campaign.day;campaign.cash+=rn.cash;campaign.san=sanClamp(campaign.san+rn.san);recoveryRefresh('暗号正确！获得 '+rn.cash+'円，SAN +'+rn.san+'。明天可再次领取。')}
 else{alterCampaign({hp:GAME_CONFIG.recovery.resistanceNpc.wrongHp});recoveryRefresh('暗号错误：疲劳点 -'+GAME_CONFIG.recovery.resistanceNpc.wrongHp+'，SAN 不变。今天仍可重试。')}})
}
function vendingDefaults(){if(!campaign)return;recoveryDefaults();const d=campaign.day;if(campaign.vendingDay!==d){campaign.vendingDay=d;campaign.vendingStock={};campaign.vendingAnomaly={};campaign.vendingAnomalyUsed={}}}
function vendingStock(mid){vendingDefaults();const V=GAME_CONFIG.recovery.vending;campaign.vendingStock[mid]??={};const s=campaign.vendingStock[mid];for(const k in V.items)if(s[k]==null)s[k]=V.stock;if(campaign.vendingAnomaly[mid]==null)campaign.vendingAnomaly[mid]=Math.random()<V.anomalyChance;return s}
function vendHud(){campaignSave();if(typeof app!=='undefined'&&app)app.querySelectorAll('.survival-hud').forEach(e=>e.outerHTML=campaignHUD())}
function openVending(mid){if(!campaign)return;let box=document.getElementById('district-chat');if(!box)return;const V=GAME_CONFIG.recovery.vending;const s=vendingStock(mid);let html='<strong>🥤 自動販売機</strong><p>投币口旁贴着一张小纸条：「押せば出る」。</p>';if(typeof invasionStage==='function'&&invasionStage()>=2&&mid!=='hotel')html+='<p>被水淹过的街区，机器的灯还亮着。</p>';for(const k in V.items){const it=V.items[k];const left=s[k];html+='<button class="rpg-action" data-vend="'+k+'" '+((left<=0||campaign.cash<it.cost)?'disabled':'')+'>'+esc(it.name)+' '+it.cost+'円'+(left<=0?'（售罄）':'（剩 '+left+'）')+'</button>'}if(campaign.vendingAnomaly[mid]&&!campaign.vendingAnomalyUsed[mid])html+='<button class="rpg-action" data-vend="anomaly" '+(campaign.cash<V.anomalyPrice?'disabled':'')+'>？ 无标签饮料 '+V.anomalyPrice+'円</button>';box.innerHTML=html;box.querySelectorAll('[data-vend]').forEach(b=>b.onclick=()=>buyVending(mid,b.getAttribute('data-vend')))}
function buyVending(mid,k){if(!campaign)return;const V=GAME_CONFIG.recovery.vending;const s=vendingStock(mid);const note=t=>{vendHud();openVending(mid);let b2=document.getElementById('district-chat');if(b2)b2.innerHTML+='<p>'+esc(t)+'</p>'};if(k==='anomaly'){if(campaign.cash<V.anomalyPrice){note('资金不足 '+V.anomalyPrice+'円。');return}campaign.cash-=V.anomalyPrice;campaign.vendingAnomalyUsed[mid]=true;let tot=0;for(const e of V.anomalyEffects)tot+=e.w;let r=Math.random()*tot,pick=V.anomalyEffects[V.anomalyEffects.length-1];for(const e of V.anomalyEffects){r-=e.w;if(r<=0){pick=e;break}}let eff=[];if(pick.hp){campaign.hp=Math.min(GAME_CONFIG.player.maxHP,campaign.hp+pick.hp);eff.push('疲劳点 +'+pick.hp)}if(pick.stress){campaign.stress=Math.max(0,Math.min(GAME_CONFIG.player.maxStress,campaign.stress+pick.stress));eff.push('压力 '+pick.stress)}if(pick.san){campaign.san=sanClamp(campaign.san+pick.san);eff.push('SAN '+(pick.san>0?'+':'')+pick.san)}note('无标签饮料 '+V.anomalyPrice+'円。'+eff.join('，')+'。'+(pick.text||''));return}const it=V.items[k];if(!it||s[k]<=0){openVending(mid);return}if(campaign.cash<it.cost){note('资金不足 '+it.cost+'円。');return}campaign.cash-=it.cost;s[k]--;let eff=[];if(it.hp){campaign.hp=Math.min(GAME_CONFIG.player.maxHP,campaign.hp+it.hp);eff.push('疲劳点 +'+it.hp)}if(it.stress){campaign.stress=Math.max(0,Math.min(GAME_CONFIG.player.maxStress,campaign.stress+it.stress));eff.push('压力 '+it.stress)}if(it.san){campaign.san=sanClamp(campaign.san+it.san);eff.push('SAN +'+it.san)}note(it.name+' '+it.cost+'円。'+eff.join('，')+'。')}
let NS=null;
const NS_GUESTS=[
 {line:'客人：「タオルをもう一枚いただけますか。」（想多要一条毛巾）',opts:['かしこまりました。少々お待ちくださいませ。','タオル？　ああ、はいはい。','それは自分で取ってください。'],ok:0,note:'客人安静地回了房间。'},
 {line:'电话：「モーニングコールをお願いします。六時半に。」（预约 6:30 叫早）',opts:['電話は朝、勝手に鳴ります。','六時半ですね。承知いたしました。','六時？　七時？　どっちですか。'],ok:1,note:'你在本子上记下 6:30 的叫早。'},
 {line:'客人：「チェックアウトは何時ですか。」（退房是几点）',opts:['10時です。早く出てください。','好きな時でいいですよ。','11時でございます。'],ok:2,note:'客人点头致谢，说明天会准时退房。'}];
const NS_PATROL=[
 {at:'206 号室门口',text:'门缝里透出均匀的呼吸声。门牌端正，走廊安静。',btn:'继续巡查'},
 {at:'207 号室门口',text:'门后传来三下敲门声。很轻，像在确认里面有没有人。《夜班守则》第一条：交班前，不要回应 207 方向的敲门声。',event:'rule207'},
 {at:'走廊尽头',text:'你数了数门。……比刚才多了一扇。门把是冷的。《夜班守则》第二条：数到多出一扇门，不要打开，返回前台重新数。',event:'door'},
 {at:'后巷',text:'夜班保安小林靠在墙边抽烟，朝你点点头：「夜里这楼，比白天诚实。」',btn:'返回前台交班'}];
function nightShiftGate(){const C=GAME_CONFIG.work.nightShift;const rs=[];if(!campaign)return['需要先创建角色'];if(campaign.day<C.fromDay)rs.push('DAY '+C.fromDay+' 起开放（当前 DAY '+campaign.day+'）');const tr=campaign.trust||{};if(!((tr.mori||0)>=C.trustGate||(tr.sato||0)>=C.trustGate))rs.push('需要森经理或佐藤的信任 ≥'+C.trustGate+'（熟人介绍）');if(((campaign.jlpt&&campaign.jlpt.xp)||0)<C.xpGate)rs.push('需要日语理解度 xp ≥'+C.xpGate+'（N4）');if(campaign.nightShiftDay===campaign.day)rs.push('今晚已经上过夜勤');return rs}
function nightShiftButton(box){const C=GAME_CONFIG.work.nightShift;const rs=nightShiftGate();let b=document.createElement('button');b.className='rpg-action';b.textContent='🌙 酒店夜勤（基础 '+C.income+'円）';b.disabled=rs.length>0;b.onclick=()=>startNightShift();box.appendChild(b);let p=document.createElement('p');p.textContent=rs.length?('夜勤条件不足：'+rs.join('；')):'夜勤：前台值守＋夜巡＋交班，约到 23:00。压力 +'+C.stress+' / SAN -'+C.san+' / 疲劳点 -'+C.hp+'。森经理交代过：夜里有事，他会来前台找你。';box.appendChild(p)}
function startNightShift(){if(!campaign)return;const rs=nightShiftGate();let box=document.getElementById('district-chat');if(rs.length){if(box)box.innerHTML='<strong>🌙 酒店夜勤</strong><p>条件不足：'+esc(rs.join('；'))+'</p>';return}if(NS){nsRender();return}if(!spendAction('work'))return;NS={stars:5,phase:'guest',gi:0,pi:0,log:['值班日志 · DAY '+campaign.day],kob:false};nsRender()}
function nsRender(){let box=document.getElementById('district-chat');if(!box||!NS)return;const head='<strong>🌙 夜勤</strong><p>星级 ★'+NS.stars+' / 5</p>';if(NS.phase==='guest'){const g=NS_GUESTS[NS.gi];box.innerHTML=head+'<p>【前台值守 '+(NS.gi+1)+'/3】'+esc(g.line)+'</p>'+g.opts.map((o,i)=>'<button class="rpg-action" data-ns="'+i+'">'+esc(o)+'</button>').join('');box.querySelectorAll('[data-ns]').forEach(b=>b.onclick=()=>nsGuest(+b.getAttribute('data-ns')));return}if(NS.phase==='patrol'){const s=NS_PATROL[NS.pi];let html=head+'<p>【夜巡 · '+esc(s.at)+'】'+esc(s.text)+'</p>';if(s.event==='rule207')html+='<button class="rpg-action" data-ns="0">不回应，转身离开（守则）</button><button class="rpg-action" data-ns="1">出声回应，确认情况</button>';else if(s.event==='door')html+='<button class="rpg-action" data-ns="0">返回前台，重新数（守则）</button><button class="rpg-action" data-ns="1">推开这扇门看看</button>';else html+='<button class="rpg-action" data-ns="0">'+esc(s.btn||'继续巡查')+'</button>';box.innerHTML=html;box.querySelectorAll('[data-ns]').forEach(b=>b.onclick=()=>nsPatrol(+b.getAttribute('data-ns')));return}}
function nsGuest(i){const g=NS_GUESTS[NS.gi];if(i===g.ok){NS.log.push('值守：'+g.note)}else{NS.stars=Math.max(0,NS.stars-1);NS.log.push('值守：应对失当，客人的表情僵了一下。（星 -1）')}NS.gi++;if(NS.gi>=NS_GUESTS.length){NS.phase='patrol';NS.log.push('夜巡开始：前台 → 走廊 → 后巷。')}nsRender()}
function nsPatrol(i){const s=NS_PATROL[NS.pi];if(s.event){if(i===0){NS.stars=Math.min(5,NS.stars+1);NS.log.push('夜巡 · '+s.at+'：守住了守则。（星 +1）')}else{campaign.san=sanClamp(campaign.san-8);NS.log.push('夜巡 · '+s.at+'：破了守则。SAN -8。')}}else{NS.log.push('夜巡 · '+s.at+'：无异常。');if(s.at==='后巷'&&!NS.kob){NS.kob=true;campaign.trust=campaign.trust||{};campaign.trust.kobayashi=(campaign.trust.kobayashi||0)+1;NS.log.push('后巷偶遇小林，聊了两句。（小林信任 +1）')}}NS.pi++;if(NS.pi>=NS_PATROL.length){nsSettle();return}nsRender()}
function nsSettle(){const C=GAME_CONFIG.work.nightShift;const V4=GAME_CONFIG.v74||{},tier=(V4.nightTier||{})[NS.stars]||0,starPay=((V4.stars||{}).night||[0,0,0,0])[tier]||0,allow=window.V74?V74.allowance('night'):0,wage=C.income+starPay+allow;campaign.cash+=wage;campaign.stress=Math.min(GAME_CONFIG.player.maxStress,campaign.stress+C.stress);campaign.san=sanClamp(campaign.san-C.san);campaign.hp=Math.max(1,campaign.hp-C.hp);campaign.nightShiftDay=campaign.day;NS.log.push('交班：星级 ★'+NS.stars+' / 5（评定 '+(tier?'★'.repeat(tier):'0 星')+'）。工资条：基础工资 '+C.income+'円 · 星级奖金 '+starPay+'円 · 道具津贴 '+allow+'円'+(allow?'（深夜作业套装）':'')+' · 实发合计 '+wage+'円。压力 +'+C.stress+' / SAN -'+C.san+' / 疲劳点 -'+C.hp+'。约 23:00 交班。');campaign.nightShiftLog.push(NS.log.join(' '));const text=NS.log.join(' / ');NS=null;recoveryRefresh('夜勤结束。'+text)}
/*STREET-BEGIN*/
/* 街区瓦片引擎 P1（2026-11-13）：与酒店 H18 同规格（32px / 16x11 / rows 字符串 / 程序绘制）。
   品川先行：enterDistrict('shinagawa') 时以瓦片街区替换旧 SVG 图；旧图保留可回退（街区内按钮切换）。 */
const ST_ART={asakusa:{day:'./assets/30-recovery/0f8aec461f86ac87.webp',morning:'./assets/30-recovery/3e9b21e798649016.webp',dusk:'./assets/30-recovery/6936d39d7155abc6.webp'},shinagawa:{day:'./assets/30-recovery/9231a628c21443be.webp',dusk:'./assets/30-recovery/0d11c1391464cdc9.webp'},sensoji:{day:'./assets/30-recovery/800fc27cda2d43ad.webp',morning:'./assets/30-recovery/2b4936f786b3bded.webp',dusk:'./assets/30-recovery/2c09f1035af20196.webp'}};
const ST_MAPS={
 shinagawa:{name:'品川駅 · 港南口',rows:[
  'SSSSSSSSSSSSSSSS',
  'SSSSD##GG#D####U',
  '####,,,,,,,##.FU',
  '####D#,,,,V##.FU',
  '######,,,####.FU',
  'RRRRRRRRRRRRRRFU',
  '#############.FU',
  '#############.FU',
  '#############.FU',
  '#D#DDD,,##D#D.FU',
  '..............FU'],
  /* v54 按手绘底图重新对格：可走的只有站前广场、大马路、运河边的小路、下方的街和停车场；
     下方一排店门朝南开在街上；建筑和屋顶都不可走 */
  spawn:{x:7,y:2},
  shiftX:{13:6},
  fg:[{p:[[3.302,4.917],[3.302,3.125],[3.958,2.375],[4.896,2.375],[5.417,3.125],[6.375,3.875],[6.375,4.917]],z:4.92},{p:[[9.167,4.938],[9.427,3.802],[10.052,2.656],[11.042,1.875],[13.021,1.875],[13.021,5.0]],z:5.0}],
  doors:{
   '4,1':{label:'コンビニ',act:'konbini'},'7,1':{label:'改札',act:'gate'},'8,1':{label:'改札',act:'gate'},'10,1':{label:'薬局',act:'drug'},
   '4,3':{label:'案内所',act:'info'},'10,3':{label:'自販機',act:'vending'},
   '1,9':{label:'ラーメン',act:'flavor',text:'拉面店。汤头是豚骨，门口排着两个上班族。'},'5,9':{label:'雑貨屋',act:'flavor',text:'杂货屋。雨伞、电池、日用品都齐。'},
   '10,9':{label:'ミナトヤホテル',act:'hotel'},'12,9':{label:'旅館',act:'flavor',text:'小旅馆。瓦顶压得很低，玄关亮着一盏黄灯。'},
   '3,9':{label:'本屋',act:'flavor',text:'旧书店。店主在柜台后面打盹。'},'4,9':{label:'宝くじ',act:'flavor',text:'彩票站。橱窗里贴着上期的中奖号码。'}},
  zones:{'13,8':{label:'港南口',text:'港南口 · 运河沿岸的小路。水面比路面低很多，风里有潮味。'}},
  npcs:[{x:8,y:3,name:'街区向导',pal:{h:'#2a2a3a',s:'#ecc19b',b:'#554365',a:'#e8c46a',p:'#2a2c3a',k:'#222'},cycle:true,i:0,lines:['品川駅へようこそ！','车站、商店和问路处都在附近。','走到地图上的建筑旁，可以进店办事。也可以用 WASD 移动角色，靠近建筑触发任务。']},
        {x:7,y:9,name:'路人',look:'v2_youngman',lines:['这条小巷的书店，雨天会早关门。']},
        {x:13,y:3,name:'路人',look:'v2_oldman',lines:['运河的水位，今年涨得比往年早。']},
        {x:6,y:3,name:'路人',look:'v2_salaryman',lines:['すみません、急いでいるので……（他看了一眼手表，快步走向改札。）']},
        {x:6,y:4,name:'路人',look:'v2_officewoman',lines:['药局八点就关门了，要买东西趁早。']},
        {x:0,y:5,name:'路人',look:'v2_glasses',lines:['今天好像会下雨。这把伞我一直带着，没打开过。']},
        {x:6,y:9,name:'路人',look:'v2_housewife',lines:['商店街傍晚有打折，蔬菜比超市便宜。']}]},
 asakusa:{name:'浅草駅 · 浅草寺界隈',rows:[
  '#.P#HHHHP#####.U',
  '#.P#HHHHPG####.U',
  '#.##,,,,,,,,,#.U',
  '#.#####,,,####.U',
  '#.#####..#####.U',
  '#.#####..#####.U',
  '#.#####..#####.U',
  '#.#####..#####.U',
  '#.#####..#SSS#.U',
  '#.####G..#SSS#.U',
  '#RRRR,,,,,RRRR.U'],
  /* v54 定版手绘图（斜俯视）重新对格：店门按招牌位置；寺前广场在第 2 行，宝蔵門下第 3 行是仲見世入口；
     左边第 1 列是土产街，第 14 列是河岸步道；一格里有两块招牌的地方合成一个门。nochip：底图已画招牌，不再叠标签 */
  spawn:{x:10,y:10},
  shiftX:{1:-7,7:5,8:-6,14:-12},
  fg:[{p:[[6.508,3.173],[6.772,2.274],[7.407,2.168],[8.466,2.168],[9.048,2.274],[9.333,3.173]],z:4.0},{p:[[6.476,3.173],[7.407,3.173],[7.407,4.04],[6.476,4.04]],z:4.0},{p:[[8.36,3.173],[9.333,3.173],[9.333,4.04],[8.36,4.04]],z:4.0},{p:[[3.175,3.543],[3.175,2.644],[3.492,2.168],[3.968,2.115],[4.254,2.538],[4.212,3.543]],z:3.5},{p:[[4.317,3.543],[4.36,2.644],[4.762,2.348],[5.101,2.644],[5.143,3.543]],z:3.5},{p:[[5.079,4.072],[5.132,2.856],[5.608,2.454],[6.243,2.591],[6.508,3.173],[6.37,4.072]],z:4.05},{p:[[9.524,4.231],[9.577,2.962],[10.159,2.623],[10.794,2.771],[10.952,3.49],[10.899,4.231]],z:4.2},{p:[[11.27,4.442],[11.27,2.697],[12.063,2.697],[12.116,3.173],[13.757,3.173],[13.757,4.442]],z:4.45},{p:[[5.873,9.117],[6.085,8.144],[6.772,7.954],[8.783,7.954],[9.365,8.144],[9.524,9.117]],z:10.2},{p:[[6.243,9.117],[7.037,9.117],[7.037,10.239],[6.243,10.239]],z:10.2},{p:[[8.804,9.117],[9.418,9.117],[9.418,10.239],[8.804,10.239]],z:10.2},{p:[[12.931,9.572],[12.931,8.906],[14.18,8.039],[16.0,7.298],[16.0,8.462],[14.656,9.572]],z:99}],
  doors:{
   '11,9':{label:'改札',act:'gate'},
   '9,9':{label:'自販機',act:'vending',nochip:true},
   '5,1':{label:'浅草寺',act:'enter',to:'sensoji',q:'help',text:'浅草寺本堂。线香的烟越过宝蔵門，一直飘到仲見世那边。',nochip:true},
   '9,1':{label:'求签处',act:'facility',f:'fortune',nochip:true},
   '10,1':{label:'せんべい · 喫茶',act:'flavor',text:'现烤的仙贝从铁板上揭下来，还带着酱油的焦香。隔壁是老式喫茶店，菜单上只有咖啡、红茶和一份很固执的布丁。',nochip:true},
   '11,1':{label:'記念品攤',act:'facility',f:'conch',nochip:true},
   '12,1':{label:'食堂',act:'flavor',text:'大众食堂。今日定食是炸猪排，写在门口的小黑板上。',nochip:true},
   '13,1':{label:'喫茶',act:'flavor',text:'靠河的喫茶店，窗边能看见隅田川和对岸的墨田区。',nochip:true},
   '2,2':{label:'お土産',act:'flavor',text:'寺前的土产店，雷おこし堆得像小山。',nochip:true},
   '13,2':{label:'そば',act:'flavor',text:'荞麦面店。打面的声音从帘子后面一下一下传出来。',nochip:true},
   '6,4':{label:'お土産屋',act:'quiz',q:'shop',text:'仲見世的老铺，游客在这里挑伴手礼。',nochip:true},
   '9,4':{label:'人形焼',act:'flavor',text:'人形烧的模具滋滋作响，红豆馅的甜香飘出半条街。',nochip:true},
   '6,6':{label:'甘味処',act:'quiz',q:'food',text:'甘味処。蜜豆冰和葛饼是招牌，店里的阿姨会多给你一勺糖水。',nochip:true},
   '9,6':{label:'雷おこし',act:'flavor',text:'现做的雷おこし，咬下去咔嚓一声。',nochip:true},
   '13,5':{label:'和食屋',act:'quiz',q:'washoku',text:'靠近河岸的和食屋，午间定食很受欢迎。'},
   '5,9':{label:'風鈴店',act:'facility',f:'furin'},
   '4,3':{label:'祈祷所',act:'facility',f:'shrine'},
   '2,9':{label:'旅館',act:'facility',f:'sleep',nochip:true},
   '3,9':{label:'銭湯',act:'facility',f:'sento',nochip:true},
   '4,9':{label:'土産 · 喫茶',act:'flavor',text:'站前的土产店，卖东京限定的点心礼盒。旁边的喫茶店里，赶车的人在喝最后一杯咖啡。',nochip:true}},
  zones:{'7,3':{label:'宝蔵門',enter:'sensoji',text:'宝蔵門。门上挂着深青绿底、金字的匾额——「宝蔵門」。穿过去就是仲見世。',nochip:true},
   '7,9':{label:'雷門',text:'雷門。大灯笼底下永远有人在拍照，本地人从灯笼侧面绕过去。',nochip:true},
   '14,5':{label:'隅田川河岸',text:'隅田川河岸。水面很宽，风里有潮味。东武线的铁桥就在南边。',nochip:true}},
  npcs:[{x:9,y:3,name:'旅游向导',pal:{h:'#3a2a24',s:'#ecc19b',b:'#2f6a7a',a:'#e8c46a',p:'#2a2c3a',k:'#222'},cycle:true,i:0,lines:['浅草へようこそ！写真を撮ってもいいですか？','进寺前先看看告示。想拍照的话，可以先问工作人员。']},
        {x:8,y:3,name:'境内の巫女',pal:{h:'#1a1a22',s:'#f0c9a0',b:'#f2f0ea',a:'#c23a2a',p:'#b8323a',k:'#2a2020'},act:'agent',lines:['……风，没有风呢。今天的风铃，一声都没有响过。']},
        {x:14,y:0,name:'钓鱼人',pal:{h:'#d8d8d8',s:'#e2bf9c',b:'#7d6f58',a:'#5d5040',p:'#4a463e',k:'#222'},act:'facility',f:'river',fLabel:'向钓鱼人搭话',lines:['（一个老人坐在河岸边钓鱼，浮漂一动不动。）']},
        {x:7,y:5,name:'路人',look:'v2_kimono',lines:['雷門的大灯笼，听说是松下电器的创始人捐的。']},
        /* v54 新路人：仲見世两格宽，留一格通行；土产街尽头 */
        {x:8,y:7,name:'路人',look:'v2_sunhat',lines:['写真、撮りましょうか？（她举了举胸前的相机。）']},
        {x:1,y:1,name:'路人',look:'v2_backpacker',lines:['Excuse me — 隅田川的游船码头，是往这边走吗？（他摊开手里的地图。）']}]},
 sensoji:{name:'浅草寺 · 境内',short:'浅草寺境内',intro:'穿过宝蔵門，线香的烟扑面而来。正面是本堂，右手边是おみくじ和護摩堂，左手边是手水舎和五重塔。从宝蔵門原路出去就回到仲見世。',rows:[
  '################',
  '################',
  '################',
  '###########.####',
  '####.#....#.####',
  '###.........####',
  '###....#....####',
  '#...........#...',
  '#..###..###....#',
  '######..########',
  '######..########'],
  /* 浅草寺境内（2026-11-17 手绘三时段图）：从街区的「浅草寺」门或宝蔵門进入；第 10 行宝蔵門下是出口，回到仲見世。
     本堂→本堂参拜(PRAYER)＋原浅草寺答题；おみくじ→御神签(OMI，含御守/祈愿)；護摩堂→护摩净化(PURGE temple)；手水舎、常香炉只给描写 */
  spawn:{x:7,y:7},
  exitTo:{x:7,y:4,text:'穿过宝蔵門，回到了仲見世。'},
  shiftX:{6:4},
  fg:[{p:[[3.06,9.55],[3.06,8.55],[3.9,7.8],[10.45,7.8],[11.25,8.55],[11.25,9.55]],z:9.6},
      {p:[[4.62,5.2],[4.62,3.65],[5.42,3.65],[5.42,5.2]],z:5.2},
      {p:[[9.98,5.2],[9.98,3.65],[10.65,3.65],[10.65,5.2]],z:5.2},
      {p:[[6.8,7.2],[6.8,6.2],[7.0,5.6],[7.6,5.05],[8.0,5.05],[8.6,5.6],[8.6,6.2],[8.35,7.2]],z:7.2},
      {p:[[11.65,5.55],[11.65,5.2],[12.3,4.4],[12.6,4.0],[16,4.0],[16,5.55]],z:7.0}],
  doors:{
   '6,3':{label:'本堂',act:'call',icon:'🏯',text:'浅草寺本堂。大提灯底下，香客排着队往赛钱箱里投硬币，合掌，再鞠一躬。',btns:[['🏯 本堂参拜','prayer'],['📚 答题：浅草寺','quiz:help']],nochip:true},
   '7,3':{label:'本堂',act:'call',icon:'🏯',text:'浅草寺本堂。大提灯底下，香客排着队往赛钱箱里投硬币，合掌，再鞠一躬。',btns:[['🏯 本堂参拜','prayer'],['📚 答题：浅草寺','quiz:help']]},
   '8,3':{label:'本堂',act:'call',icon:'🏯',text:'浅草寺本堂。大提灯底下，香客排着队往赛钱箱里投硬币，合掌，再鞠一躬。',btns:[['🏯 本堂参拜','prayer'],['📚 答题：浅草寺','quiz:help']],nochip:true},
   '12,3':{label:'おみくじ',act:'call',icon:'🎋',text:'求签处。签筒摇得哗哗响，旁边的架子上系满了白色的签纸。',btns:[['🎋 求签 · 御守 · 祈愿','omikuji']],nochip:true},
   '14,6':{label:'護摩堂',act:'call',icon:'🔥',text:'護摩堂。火坛里的火一直没有灭过，僧侣坐在火前念经。',btns:[['🔥 护摩净化','goma']],nochip:true},
   '1,6':{label:'手水舎',act:'flavor',text:'手水舎。石盆里的水很凉。你照着旁边的告示，先洗左手，再洗右手，最后漱了漱口。',nochip:true},
   '2,6':{label:'手水舎',act:'flavor',text:'手水舎。石盆里的水很凉。你照着旁边的告示，先洗左手，再洗右手，最后漱了漱口。'},
   '7,6':{label:'常香炉',act:'flavor',text:'常香炉。线香的烟一团一团往上冒，旁边的人用手把烟往自己身上扇——据说烟碰到哪里，哪里就会好起来。'}},
  zones:{'6,10':{label:'返回仲見世',exit:true,nochip:true},'7,10':{label:'返回仲見世',exit:true}},
  npcs:[{x:13,y:7,name:'護摩堂の僧侶',pal:{h:'#d8b48e',s:'#d8b48e',b:'#2f2b29',a:'#a8732e',p:'#2f2b29',k:'#1a1a1a'},cycle:true,i:0,lines:['護摩は毎朝やっています。（护摩每天早上都做。）','手帐上要是有认不清的黑色，就拿进来吧。火会认得它。']},
        {x:4,y:6,name:'参拜的老人',look:'v2_oldman',lines:['（老人对着本堂合掌，嘴唇动着，没有出声。）']},
        {x:8,y:6,name:'路人',look:'v2_housewife',lines:['頭が良くなるようにね。（她把香炉的烟往孩子头上扇。）']},
        {x:10,y:7,name:'路人',look:'v2_backpacker',lines:['Five-storied pagoda……五重塔，对吧？（他把相机举得很高。）']}]}};
/* v70 手绘定稿地图：北品川（駅前＋商店街）、五反田、明治神宮前（街区＋境内四张）。
   每格 32px（16×11）；行走格按「脚落在哪」判定；人物 = 原调查标记（npcs[].mk）。 */
let ST_PHASE='day';
ST_ART.kitashinagawa={day:'./assets/30-recovery/5b723d169a48c898.webp',dusk:'./assets/30-recovery/5f14e4e89a1171b5.webp'};
ST_ART.ks_eki={day:'./assets/30-recovery/62dd0f5a11fc5013.webp',dusk:'./assets/30-recovery/ded4f60b5e029411.webp'};
ST_ART.gotanda={day:'./assets/30-recovery/42898e4dbc6ad2ac.webp',dusk:'./assets/30-recovery/4df160753019df42.webp'};
ST_ART.meijijingumae={day:'./assets/30-recovery/a2e340dd6137c30b.webp',dusk:'./assets/30-recovery/68d8d1e9f716ff14.webp'};
ST_ART.mj1={day:'./assets/30-recovery/b2ea6932acbf6965.webp',dusk:'./assets/30-recovery/91bebd09059ded69.webp'};
ST_ART.mj2={day:'./assets/30-recovery/1e7bbd0aeafc8903.webp',dusk:'./assets/30-recovery/112e3ce8ba10c729.webp'};
ST_ART.mj3={day:'./assets/30-recovery/0d6c881cf66d207d.webp',dusk:'./assets/30-recovery/3a478f2ea007458b.webp'};
ST_ART.mj4={day:'./assets/30-recovery/44c3ec766a4a2637.webp',dusk:'./assets/30-recovery/724414647e9084dc.webp'};
ST_ART.shibuya={day:'./assets/30-recovery/254e6eb6bb4d6a1e.webp',dusk:'./assets/30-recovery/0b23727386090986.webp'};
ST_ART.ueno={day:'./assets/30-recovery/0b72db23775210b7.webp',dusk:'./assets/30-recovery/4d95556a45a4c9bb.webp'};
ST_ART.shimbashi={day:'./assets/30-recovery/c99b331ec5511548.webp',dusk:'./assets/30-recovery/7e8e25cd1f09ceb7.webp'};
/* v73 通用车站六种（A 住宅街小站 / B 大站公交环岛 / C 高架下横丁 / D 拱廊商店街 / E 写字楼地铁口 / F 河边车站）：每种一套白天 + 夜间图，多个车站共用 */
ST_ART.gen_A={day:'./assets/30-recovery/f2ac7cfe0dab65a7.webp',dusk:'./assets/30-recovery/cbb8a138486cecbc.webp'};
ST_ART.gen_B={day:'./assets/30-recovery/4a9fc08795cdd69f.webp',dusk:'./assets/30-recovery/580abf54f2db50c0.webp'};
ST_ART.gen_C={day:'./assets/30-recovery/e7b772ad6861b3fa.webp',dusk:'./assets/30-recovery/2ebb9a323397a4ab.webp'};
ST_ART.gen_D={day:'./assets/30-recovery/177487b41a397a95.webp',dusk:'./assets/30-recovery/74d4013fd1845523.webp'};
ST_ART.gen_E={day:'./assets/30-recovery/61cba326bb710402.webp',dusk:'./assets/30-recovery/037dab7ba1a64e24.webp'};
ST_ART.gen_F={day:'./assets/30-recovery/5b83a342ad478590.webp',dusk:'./assets/30-recovery/90d2c5944bd7820d.webp'};
/* v75 六站专用地图（東京 / 新宿 / 池袋 / 秋葉原 / 高田馬場 / 銀座）：每站一套白天 + 夜间 */
ST_ART.gen_tokyo={day:'./assets/30-recovery/4cf5ffc0c44959fb.webp',dusk:'./assets/30-recovery/8cc525a026c1f86d.webp'};
ST_ART.gen_shinjuku={day:'./assets/30-recovery/0619c54da3f96163.webp',dusk:'./assets/30-recovery/a2ad71d2e90c1eaa.webp'};
ST_ART.gen_ikebukuro={day:'./assets/30-recovery/c02e7403a4c059a2.webp',dusk:'./assets/30-recovery/f6374ca5162c9090.webp'};
ST_ART.gen_akihabara={day:'./assets/30-recovery/dec4f2649f6b14e2.webp',dusk:'./assets/30-recovery/dc886b6b16f5e526.webp'};
ST_ART.gen_takadanobaba={day:'./assets/30-recovery/69fab0ef307881c3.webp',dusk:'./assets/30-recovery/f789da6844f52886.webp'};
ST_ART.gen_ginza={day:'./assets/30-recovery/3d25c41400ad7581.webp',dusk:'./assets/30-recovery/4705ac8c4a005dca.webp'};
{
 const NIGHT=()=>ST_PHASE==='dusk';
 const D=(label,day,night,o)=>Object.assign({label,act:'flavor',nochip:true,get text(){return NIGHT()&&night?night:day}},o||{});
 const Z=(label,day,night,o)=>Object.assign({label,nochip:true,get text(){return NIGHT()&&night?night:day}},o||{});
 const C=(label,day,night,btns)=>({label,act:'call',nochip:true,btns,get text(){return NIGHT()&&night?night:day}});
 /* rows 用「可走的 x 列表」写，避免手数字符 */
 const R=(...lines)=>lines.map(xs=>{const a=Array(16).fill('#');(xs||[]).forEach(x=>a[x]='.');return a.join('')});
 const span=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
 const mkEl=k=>document.querySelector('#district-world [data-street-object="'+k+'"]');
 /* 调查点 / 生活点在新图上的位置；人物站在格子上 */
 const DAYMAP={
  kitashinagawa:{pos:{archive:[10.5,9.5],cafe:[13.5,5.5],laundry:[13.5,2.4],closed:[10.5,6.6],board:[10.5,5.9],festival:[10.5,1.5],
    elder:[12.5,6.2],neighbor:[6.5,3.2],'tn-worker':[12.5,10.2],'tn-witness':[12.5,8.2],bakery:[10.5,2.4],postbox:[12.8,5.1],cat:[5.5,3.5],shrine:[13.6,9.5]},
   npcs:[{x:12,y:6,name:'街角老人',look:'v2_oldman',mk:'elder'},{x:6,y:3,name:'邻居',look:'v2_housewife',mk:'neighbor'},
    {x:12,y:10,name:'收摊的店员',look:'v2_youngman',mk:'tn-worker'},{x:12,y:8,name:'路灯下的行人',look:'v2_salaryman',mk:'tn-witness'}],
   spare:[[7.5,3.5],[2.5,3.5],[7.5,7.5],[5.5,8.5],[3.5,3.5],[2.5,8.5],[11.5,5.5],[11.5,2.5]]},
  gotanda:{pos:{complaint:[8.3,7.4],dispatch:[2.7,7.3],log:[5.3,7.3],receipt:[6.5,8.5],rest:[13.3,9.5],
    driver1:[10.5,7.2],driver2:[13.5,7.2],witness:[15.5,8.2],'tn-driver':[12.5,8.2],
    vending:[6.5,3.3],ramen:[13.5,1.8],crosswalk:[8.5,4.4],flower:[7.5,9.4]},
   npcs:[{x:10,y:7,name:'一号司机',look:'v2_salaryman',mk:'driver1'},{x:13,y:7,name:'二号司机',look:'v2_glasses',mk:'driver2'},
    {x:15,y:8,name:'跨区夜班司机',look:'v2_youngman',mk:'witness'},{x:12,y:8,name:'整理行车资料的司机',look:'v2_oldman',mk:'tn-driver'}],
   spare:[[3.5,2.5],[9.5,2.5],[1.5,8.5],[4.5,8.5],[12.5,8.5],[8.5,3.5]]},
  ueno:{pos:{album:[9.5,8.5],photoA:[8.7,8.4],photoB:[10.4,8.4],back:[9.5,7.6],pond:[2.5,8.4],camera:[5.6,7.7],'yk-print':[6.5,8.4],'yk-program':[7.5,8.6],
    witness:[10.5,9.2],bench:[5.5,6.4],snack:[4.6,8.4],pigeon:[8.4,9.4],museum:[9.5,2.5],'local-path':[3.4,4.4]},
   npcs:[{x:10,y:9,name:'展架旁的老人',look:'v2_oldwoman',mk:'witness'}],
   hide:['宿','薬局','銭湯','自動販売機'],
   spare:[[5.5,5.5],[3.5,3.5],[2.5,7.5],[10.5,2.5],[9.5,6.5],[12.5,9.5],[2.5,9.5]]},
  shimbashi:{pos:{worker:[12.5,7.2],office:[11.5,5.2],bar:[14.5,8.6],poster:[8.3,4.6],printer:[5.8,4.6],seller:[9.5,5.0],
    coffee:[3.6,4.6],yakitori:[11.5,8.6],station:[9.5,8.4],news:[10.5,7.3]},
   npcs:[{x:12,y:7,name:'路边的男人',look:'v2_salaryman',mk:'worker'},{x:11,y:5,name:'加班上班族',look:'v2_glasses',mk:'office'}],
   spare:[[6.5,8.6],[0.5,4.6],[12.5,2.6],[7.5,4.6]]},
  shibuya:{pos:{},npcs:[],
   lab:{'セレクトショップ':[4.5,8.6],'古着屋':[4.5,9.6],'百貨店':[4.5,2.6],'カフェ':[3.5,2.6],'十字路口':[5.6,2.6],'唱片店':[11.5,2.6],
    '街头拍照点':[12.5,6.6],'饮料售卖机':[13.6,10.4],'铃木（服装店员）':[2.5,2.6],'ビジネスホテル':[0.5,1.6],'ドラッグストア':[14.5,2.6],
    '古着屋の裏通り':[0.5,2.6],'パチンコ · 小钢珠':[0.5,0.6],'ゲームセンター · 水果机':[3.1,0.6],'⌗ 涩谷十字路口':[7.5,6.5],'站前彩票亭':[11.5,10.4]},
   hide:['八公口','自動販売機'],
   spare:[[3.5,1.5],[0.5,8.6],[11.5,2.6]]}};
 const HIDE=new Set(['自動販売機','駅前の宿','薬局']); // 这些设施改成地图上的门（按 A 打开）
 function layoutFor(id){const L=DAYMAP[id];return world=>{const used=new Set(L.npcs.map(n=>n.x+','+n.y));let sp=0;
  const put=(b,[x,y])=>{b.style.left=(x/16*100).toFixed(3)+'%';b.style.top=(y/11*100).toFixed(3)+'%';used.add(Math.floor(x)+','+Math.floor(y))};
  const later=[];
  world.querySelectorAll('.street-hot,.district-hit,.photo-pin').forEach(b=>{if(b.id==='district-player')return;
   const k=b.dataset.streetObject,lab=(b.getAttribute('aria-label')||'').replace(/^(进入|调查|访问|重访)/,'');
   if(k&&L.pos[k]){put(b,L.pos[k]);return}
   if(L.lab&&L.lab[lab]){put(b,L.lab[lab]);return}
   if(HIDE.has(lab)||(L.hide&&L.hide.some(h=>lab.includes(h)))){b.style.display='none';return}
   if(b.dataset.v70Placed)return;later.push(b)});
  later.forEach(b=>{while(sp<L.spare.length&&used.has(L.spare[sp].map(Math.floor).join(',')))sp++;if(sp<L.spare.length){put(b,L.spare[sp]);b.dataset.v70Placed=1;sp++}})}}
 const npcsFor=id=>DAYMAP[id].npcs.filter(n=>{const b=mkEl(n.mk);return b&&b.style.display!=='none'});

 /* ================= 北品川 ================= */
 ST_MAPS.kitashinagawa={name:'北品川 · 旧东海道商店街',short:'北品川商店街',arrive:'ks_eki',
  intro:'旧东海道品川宿的老商店街。路西边是善福寺和法禅寺，路东边的店后面就是从前的海岸线。往上走回北品川駅前。',
  rows:R([11,12],[11,12],[11,12],span(1,12),[11,12],[11,12],[11,12],[7,8,11,12],span(2,12),[11,12],[11,12]),
  spawn:{x:11,y:1},
  fg:[{p:[[7.3,4.0],[7.3,2.9],[9.75,2.9],[9.75,4.0]],z:4.0},{p:[[7.3,9.25],[7.3,7.95],[9.75,7.95],[9.75,9.25]],z:9.25}],
  get npcs(){return npcsFor('kitashinagawa')},layout:layoutFor('kitashinagawa'),
  doors:{
   '3,2':D('善福寺 本堂','很老的寺。屋檐下的灰泥浮雕已经剥落了一些，看得出是龙和云。','浮雕里的龙，好像比白天更低了一点，像要从屋檐下探出来。'),
   '4,2':D('善福寺 本堂','很老的寺。屋檐下的灰泥浮雕已经剥落了一些，看得出是龙和云。','浮雕里的龙，好像比白天更低了一点，像要从屋檐下探出来。'),
   '3,7':D('法禅寺 本堂','法禅寺的本堂。香炉里插着几支快烧完的线香，烟往海那边飘。','本堂的门关着。门缝底下压着一张湿透的纸条，字已经化开了。'),
   '4,7':D('法禅寺 本堂','法禅寺的本堂。香炉里插着几支快烧完的线香，烟往海那边飘。','本堂的门关着。门缝底下压着一张湿透的纸条，字已经化开了。'),
   '9,7':D('手水舎','石钵上刻着「水漱」两个字。','水面上浮着几片不知从哪里来的海藻。'),
   '1,8':D('流民叢塚碑','供养天保大饥荒时死去的人。碑前有人放了一颗糖。','碑前那颗糖不见了，地上留着一圈湿印子。'),
   '10,7':D('鱼店','冰上摆着竹荚鱼和蛤蜊，店里有很重的海水味。','卷帘门拉下了，可海水味比白天还重。'),
   '10,4':D('蔬果店','箱子里堆着白萝卜和橘子，老板娘在算零钱。','卷帘门拉下了，门缝下面渗出一点水。'),
   '13,3':D('石碑三番 · 土蔵相模旧址','石碑上写着这里曾是一家叫「相模屋」的旅笼，外墙是海鼠墙，所以叫土蔵相模。现在是一栋普通的楼。','石碑前放着一小束花，花茎泡在水里。附近没有水龙头。'),
   '13,7':{label:'駅前の宿',act:'facility',f:'sleep',nochip:true},
   '13,1':{label:'薬局',act:'facility',f:'potion',nochip:true},
   '13,4':D('新建小公寓','新盖的小公寓，信箱上的名牌一半是空的。','只有一扇窗亮着，窗帘后面的人影一直没动。')},
  zones:{
   '8,3':Z('善福寺 山门','穿过山门。门柱上的木纹被摸得发亮。','山门底下比外面冷，脚步声在门里回了两下。'),
   '8,8':Z('法禅寺 砖砌山门','砖砌的山门，在寺院里很少见。旁边的石碑写着这里是品川最早的小学。','砖缝里长着一层湿苔。'),
   '11,0':{label:'往北品川駅前',nochip:true,go:'ks_eki',at:[12,9]},
   '12,0':{label:'往北品川駅前',nochip:true,go:'ks_eki',at:[12,9]},
   '11,10':Z('往南：品川宿','旧东海道还在往南延伸。今天先走到这里。','往南的路灯一盏比一盏暗。今天先走到这里。')}};
 ST_MAPS.ks_eki={name:'北品川駅前',short:'北品川駅前',oy:-14,
  intro:'北品川站只有一个改札，出来就是第一京浜。要去旧东海道，得往右走到道口，过了铁路再往下。',
  rows:R([],span(3,13),[12],[12],[12],[12],[12],[12],[11,12],[11,12],[11,12]),
  spawn:{x:4,y:1},exitTo:{x:11,y:1,text:'过了道口，走上旧东海道。两边开始出现老铺的招牌。'},npcs:[],
  doors:{
   '4,2':{label:'改札',act:'gate',nochip:true},'5,2':{label:'改札',act:'gate',nochip:true},
   '9,0':{label:'自動販売機',act:'facility',f:'vending',nochip:true},
   '7,0':D('第一京浜','卡车和出租车一辆接一辆，说话得提高声音。','车道上一辆车也没有，红绿灯照样一格一格地换。'),
   '8,2':D('工程围挡','白色围挡上贴着施工告示：高架化工程。','围挡缝里看进去，工地的积水比白天多。'),
   '11,2':D('道口警报器','红灯一左一右交替闪着。','红灯在闪，可是没有声音。'),
   '11,3':D('站台（隔着围栏）','站台很短，电车停下时车尾几乎压到道口。','站台尽头站着一个人，背对着你。下一班电车开走后，那里空了。'),
   '11,7':D('跨线桥','从这里能看见跨线桥的台阶。桥那头是品川方向的高楼。','桥上的灯一盏一盏亮着，只有中间那一盏是暗的。'),
   '10,8':D('石碑一番','石碑上刻着「旧東海道 品川宿」。从这里往前就是宿场町。','石碑底部是湿的，像刚被水漫过。')},
  zones:{
   '12,4':Z('北品川道口','警报响个不停，栏杆半天抬不起来。等的人排到了人行道上。','警报响了，栏杆放下来，却没有电车经过。过了很久，栏杆才慢慢抬起。'),
   '11,10':{label:'往商店街',exit:true,nochip:true},'12,10':{label:'往商店街',exit:true,nochip:true}}};

 /* ================= 五反田 ================= */
 ST_MAPS.gotanda={name:'五反田駅 · 西口',short:'五反田',oy:-14,
  intro:'五反田站西口。高架下面就是改札，过了斑马线是出租车营业所和停车场。',
  rows:R([],[],span(1,14),[3,4,5,7,8,9,14],[7,8,9,10,11],[11],[11],span(10,15),span(0,15),[],[]),
  spawn:{x:4,y:2},get npcs(){return npcsFor('gotanda')},layout:layoutFor('gotanda'),
  doors:{
   '3,1':{label:'改札',act:'gate',nochip:true},'4,1':{label:'改札',act:'gate',nochip:true},'5,1':{label:'改札',act:'gate',nochip:true},
   '10,1':{label:'便利店',act:'konbini',nochip:true},'11,1':{label:'便利店',act:'konbini',nochip:true},
   '12,1':{label:'薬局',act:'facility',f:'potion',nochip:true},
   '14,1':{label:'自動販売機',act:'facility',f:'vending',nochip:true},
   '4,9':{label:'駅前の宿',act:'facility',f:'sleep',nochip:true},
   '1,3':D('周边地图','站前的周边地图。营业所就在马路对面。','地图上的「現在地」红点，好像往马路对面挪了一点。'),
   '2,3':D('周边地图','站前的周边地图。营业所就在马路对面。','地图上的「現在地」红点，好像往马路对面挪了一点。'),
   '10,3':D('出租车乘车处','乘车处的牌子下面排着两个人。','乘车处没有人排队，一辆空车停了很久，计价器一直亮着「空車」。')},
  zones:{'7,4':Z('斑马线','绿灯一亮，人群一起往对面走。','红绿灯照常变换，马路上一辆车也没有。'),'8,4':Z('斑马线','绿灯一亮，人群一起往对面走。','红绿灯照常变换，马路上一辆车也没有。')}};

 /* ================= 明治神宮前（街区） ================= */
 const WASH=['💧 净化一条线索（每天一次）','fn:wash'],CHARM=['🧿 御守り','fn:charm'],FOREST=['🌳 在林间坐一会儿（一次行动）','fn:forest'];
 ST_MAPS.meijijingumae={name:'明治神宮前 · 原宿口',short:'明治神宮前',
  intro:'地铁出口就在路边。过了斑马线，鸟居后面就是明治神宮的参道。',
  rows:R([7,8],[7,8],span(3,12),[7,8],span(1,11),[7,8],[7,8],[8],[8],[1,2,3,4].concat(span(7,15)),span(0,15)),
  spawn:{x:2,y:9},npcs:[],
  doors:{
   '2,8':{label:'明治神宮前駅',act:'gate',nochip:true},
   '4,8':{label:'自動販売機',act:'facility',f:'vending',nochip:true},
   '5,8':{label:'便利店',act:'konbini',nochip:true},'6,8':{label:'便利店',act:'konbini',nochip:true},
   '10,8':{label:'古着店',act:'quiz',q:'shop',text:'挂满古着的店。店员在折一件旧牛仔外套。',nochip:true},
   '11,8':{label:'古着店',act:'quiz',q:'shop',text:'挂满古着的店。店员在折一件旧牛仔外套。',nochip:true},
   '13,8':{label:'服饰店',act:'quiz',q:'shop',text:'橱窗里是一排颜色很浅的针织衫。',nochip:true},
   '14,8':{label:'服饰店',act:'quiz',q:'shop',text:'橱窗里是一排颜色很浅的针织衫。',nochip:true},
   '12,4':{label:'周边地图',act:'quiz',q:'help',text:'神宮的境内图。参道一直往里走，就是本殿。',nochip:true},
   '13,4':{label:'周边地图',act:'quiz',q:'help',text:'神宮的境内图。参道一直往里走，就是本殿。',nochip:true},
   '5,9':D('可丽饼小摊','粉色遮阳棚下排着几个学生。','小摊收了，玻璃柜里还亮着一盏小灯。'),
   '6,9':D('可丽饼小摊','粉色遮阳棚下排着几个学生。','小摊收了，玻璃柜里还亮着一盏小灯。'),
   '3,1':C('手水舎','柄杓摆成一排，水冰得手指发麻。','水面映出的天空，比头顶真正的天空亮一点。',[WASH]),
   '4,1':C('手水舎','柄杓摆成一排，水冰得手指发麻。','水面映出的天空，比头顶真正的天空亮一点。',[WASH]),
   '11,1':C('授与所','巫女在窗口后面低头整理御守。','窗口还亮着灯。巫女抬起头对你笑了笑：「夜分にご苦労さまです。」（这么晚还来，辛苦了。）',[CHARM]),
   '12,1':C('授与所','巫女在窗口后面低头整理御守。','窗口还亮着灯。巫女抬起头对你笑了笑：「夜分にご苦労さまです。」（这么晚还来，辛苦了。）',[CHARM])},
  zones:{
   '7,3':Z('鸟居','鸟居是没上漆的原木。两边的树一下子把原宿的声音挡在了外面。','参道上没有路灯，只有碎石反着一点微光。身后的霓虹一下子变得很远。'),
   '8,3':Z('鸟居','鸟居是没上漆的原木。两边的树一下子把原宿的声音挡在了外面。','参道上没有路灯，只有碎石反着一点微光。身后的霓虹一下子变得很远。'),
   '7,0':{label:'往南参道',nochip:true,go:'mj1',at:[12,9]},'8,0':{label:'往南参道',nochip:true,go:'mj1',at:[12,9]}}};
 /* 图 1　南参道 */
 ST_MAPS.mj1={name:'明治神宮 · 南参道',short:'南参道',
  intro:'碎石参道在树林里往北延伸，到了尽头向西一拐，就是大鳥居。',
  rows:R([],[],span(0,12),[12],[12],[12],[12],[12],[12],[12],[12]),
  spawn:{x:12,y:9},exitTo:{x:8,y:1,text:'走出参道，回到原宿口的人行道。'},npcs:[],
  fg:[{p:[[4.25,3.25],[4.25,0.4],[5.0,0.4],[5.0,3.25]],z:3.25}],
  doors:{
   '11,5':C('林间长椅','头顶的乌鸦叫了两声。长椅被太阳晒得有点暖。','树叶一动不动，风却在吹。你坐了一会儿，城市的嗡鸣慢慢退到了很远的地方。',[FOREST]),
   '11,6':D('石灯籠','灯笼里没有火，石头上长着一层青苔。','灯笼里积着一小汪雨水，映着一点不知道从哪里来的光。'),
   '11,3':D('奉献酒樽','一整面墙的清酒樽，樽上写着各地酒造的名字。','有一只樽上的墨字被水洇开了，只认得出最后一个字：「町」。'),
   '11,4':D('奉献酒樽','一整面墙的清酒樽，樽上写着各地酒造的名字。','有一只樽上的墨字被水洇开了，只认得出最后一个字：「町」。'),
   '13,3':D('葡萄酒樽','从法国送来的葡萄酒樽，隔着参道和清酒樽相对。','两排酒樽隔着参道对望，像在等谁从中间走过去。'),
   '13,4':D('葡萄酒樽','从法国送来的葡萄酒樽，隔着参道和清酒樽相对。','两排酒樽隔着参道对望，像在等谁从中间走过去。')},
  zones:{
   '12,9':Z('第一鳥居','鸟居是没上漆的原木，树荫一下子把阳光挡在了外面。','参道上没有灯，只有碎石反着一点微光。'),
   '12,7':Z('神橋','桥下的水沟很浅，几片落叶卡在石头之间。','桥下明明没有水，却听得见流水声。走到桥中间，声音停了。'),
   '4,2':Z('大鳥居','日本最大的木造明神鸟居。横梁上停着一只乌鸦。','柱子上有一道新的裂缝，从下往上拧着，像被什么东西用力绞过。'),
   '12,10':{label:'回原宿口',exit:true,nochip:true},
   '0,2':{label:'往本殿',nochip:true,go:'mj2',at:[14,2]}}};
 /* 图 2　南神門 → 内院 */
 const GYOEN={label:'御苑北門',act:'enter',nochip:true,get to(){return NIGHT()?null:'mj3'},
  get text(){return NIGHT()?'门锁着，挂着牌子：「本日の御苑は閉苑いたしました」（今日御苑已闭园）。门缝里飘出一点潮湿的、像海边的气味。':'木门开着，门后是御苑的树林和小路。'}};
 const FENCE={label:'竹篱笆',act:'enter',nochip:true,get to(){return NIGHT()?'mj3':null},
  get text(){return NIGHT()?'门旁的竹篱笆下面有一个刚好能钻过去的缺口，边上的竹子被磨得发亮，像是常常有人从这里进出。':'竹篱笆修得很整齐，叶子挡得严严实实。'}};
 const HAIDEN={label:'外拝殿',act:'enter',nochip:true,get to(){return NIGHT()?'mj4':null},
  get text(){return NIGHT()?'你拍了两下手。回廊里传回来三声。外拝殿中门没有上锁，门闩掉在地上。':'二礼、二拍手、一礼。拍手声在回廊里弹了回来。再往里是内拝殿，只有申请了御祈愿的人才由神职带着进去。'}};
 ST_MAPS.mj2={name:'明治神宮 · 内院',short:'明治神宮 内院',oy:-13,
  intro:'正参道沿着長殿往南，门前广场的北边是南神門，穿过去就是本殿前的内院。',
  rows:R([],span(12,15),span(12,15),[5,6,12],[5,6,12],[5,6,7,12],[5,12],[5,12,13],span(3,9).concat([11,12,13]),span(3,13),[]),
  spawn:{x:14,y:2},npcs:[],
  doors:{
   '5,2':HAIDEN,'6,2':HAIDEN,
   '4,4':D('夫婦楠','两棵楠树并排站着，中间系着注连绳。据说是夫妻和睦的象征。','两棵树的影子在石板上叠在一起。你数了一下，是三道影子。'),
   '7,4':D('絵馬掛け','挂满了绘马：「合格祈願」「家内安全」，还有一块用英文写着「Please let my mom get better」。','风一吹，绘马互相碰撞，咔哒咔哒。有一块翻了过来，背面什么也没写。'),
   '8,5':C('授与所','巫女在窗口后面低头整理御守。','窗口还亮着灯。巫女抬起头对你笑了笑：「夜分にご苦労さまです。」（这么晚还来，辛苦了。）',[CHARM]),
   '4,5':D('石灯籠','灯笼里没有火，石头上长着一层青苔。','灯笼里积着一小汪雨水，映着一点不知道从哪里来的光。'),
   '10,8':C('手水舎','柄杓摆成一排，水冰得手指发麻。','水面映出的天空，比头顶真正的天空亮一点。',[WASH]),
   '2,8':D('祓舎','小小的木屋，门口立着「祓所」的木牌。没有人。','屋里挂着的白色纸垂在动，可外面没有风。'),
   '13,4':D('長殿','长长的木造建筑，檐下堆着几把扫帚。','檐下的扫帚少了一把。'),
   '8,10':GYOEN,'6,10':FENCE},
  zones:{
   '5,6':Z('南神門','门上挂着菊纹，门内的石板扫得很干净。','夜里本该闭门，门扇却开着一条正好一个人宽的缝。'),
   '15,1':{label:'往南参道',nochip:true,go:'mj1',at:[1,2]},'15,2':{label:'往南参道',nochip:true,go:'mj1',at:[1,2]}}};
 /* 图 3　御苑（脚落在格子中间偏上，oy=-16） */
 ST_MAPS.mj3={name:'明治神宮 · 御苑',short:'御苑',oy:-16,shiftX:{3:-12},
  get intro(){return NIGHT()?'你从缺口钻了进去。园路上没有灯，只有池子那边反着一点光。':'御苑的园路绕着清正井、菖蒲田和隔雲亭，一直通到南边的池子。'},
  rows:R([8],span(3,11),[3,8,11],[3,8,11],span(1,13),[5,10],[5,10],span(3,13),[8],[],[]),
  get spawn(){return {x:8,y:1}},npcs:[],
  doors:{
   '2,2':D('清正井','石缝里不停地涌出清水，水底的细沙跟着翻动。排队拍照的人走后，只剩下水声。','水面一动不动，可你听得见下面有什么在往上涌。'),
   '2,5':D('東屋','茅草屋顶的小亭子，前面是菖蒲田。季节不对，只剩一垄一垄的叶子。','亭子的长凳上放着一把没人收的伞，伞尖还在滴水。今晚没有下雨。'),
   '4,5':D('菖蒲田','浅浅的水田，叶子整齐地排着。','水田里的倒影，比岸上的叶子多了一排。'),
   '7,6':D('隔雲亭','门关着，屋檐下很安静。','纸门后面亮着一点灯，却看不到人影。'),
   '8,6':D('隔雲亭','门关着，屋檐下很安静。','纸门后面亮着一点灯，却看不到人影。'),
   '12,8':D('池边東屋','池边的茅草亭，坐着可以看整个南池。','亭子里的木凳还是温的，像刚有人坐过。')},
  zones:{
   '8,8':Z('南池 · 釣台','睡莲的叶子铺满池面，锦鲤偶尔翻上来。','池面平得像镜子。你低头看，水里没有你的倒影，只有一片很远的海。'),
   '8,0':{label:'回内院',nochip:true,go:'mj2',get at(){return NIGHT()?[6,9]:[8,9]}}}};
 /* 图 4　御社殿内部（只在夜里从外拝殿进来） */
 ST_MAPS.mj4={name:'明治神宮 · 御社殿',short:'御社殿',
  intro:'穿过外拝殿的中门，内院里一个人也没有。正面是内拝殿，再往北就是本殿。',
  rows:R([],[],[],[],[],[5,6,9,10],[6,7,8,9],[7,8],[7,8],[7,8],[7,8]),
  spawn:{x:8,y:9},npcs:[],
  doors:{
   '4,5':D('大太鼓','祈祷开始之前，会有人敲响它。','你没有碰它，鼓面却轻轻颤了一下。'),
   '11,5':D('燭台','灯没有点。','灯芯是黑的，可烛台上方有一点热气。'),
   '7,5':D('案','白木的台子，上面摆着玉串——缠着白色纸垂的杨桐枝。','玉串上的纸垂是湿的。滴下来的水，有一点咸。'),
   '8,5':D('案','白木的台子，上面摆着玉串——缠着白色纸垂的杨桐枝。','玉串上的纸垂是湿的。滴下来的水，有一点咸。'),
   '5,6':D('参列者席','一排排椅子朝着北面摆好。','每把椅子都朝着北面，只有一把转过来，对着你。'),
   '10,6':D('参列者席','一排排椅子朝着北面摆好。','每把椅子都朝着北面，只有一把转过来，对着你。'),
   '5,4':D('祝詞殿','再往前是神职念祝词的地方，参拜者到此为止。','祝詞殿里传来很低的念诵声，听不清在念什么。你没有出声。'),
   '6,4':D('祝詞殿','再往前是神职念祝词的地方，参拜者到此为止。','祝詞殿里传来很低的念诵声，听不清在念什么。你没有出声。'),
   '9,4':D('本殿（远看）','远远能看见本殿紧闭的御扉。','御扉的缝里透出一点光，晃来晃去，像水面的反光。'),
   '10,4':D('本殿（远看）','远远能看见本殿紧闭的御扉。','御扉的缝里透出一点光，晃来晃去，像水面的反光。')},
  zones:{
   '7,8':Z('内院','石板上一片落叶都没有。','石板上有一行湿脚印，从内拝殿一直延伸到你脚下，然后停了。'),
   '8,8':Z('内院','石板上一片落叶都没有。','石板上有一行湿脚印，从内拝殿一直延伸到你脚下，然后停了。'),
   '7,10':{label:'回内院',nochip:true,go:'mj2',at:[6,3]},'8,10':{label:'回内院',nochip:true,go:'mj2',at:[6,3]}}};

 /* ================= 渋谷スクランブル交差点（v72） ================= */
 window.SB_FN={
  shop:()=>{campaign.shibuyaWalk={...(campaign.shibuyaWalk||{}),room:'shop',x:2,y:8};SHIBUYA.open()},
  lane:()=>{campaign.shibuyaWalk={...(campaign.shibuyaWalk||{}),room:'lane',x:2,y:8};SHIBUYA.open()},
  hachiko:()=>{if(window.CITYPHOTO)CITYPHOTO.shoot('hachiko')},
  scramble:()=>{if(window.CITYPHOTO)CITYPHOTO.shoot('scramble')}};
 const SB_CROSS=()=>{try{const w=campaign.shibuyaWalk??={room:'plaza',x:2,y:8};w.room='cross';if(V51ADD.onCross('cross')&&STREET_WALK.step('shibuya','shibuya'))V51ADD.crossingEncounter()}catch(e){}};
 const SBZ={label:'斑马线',nochip:true,run:SB_CROSS};
 const sbZones={};
 [[6,3],[7,3],[8,3],[9,3],[5,4],[5,5],[5,6],[6,4],[7,4],[7,5],[8,5],[8,6],[9,6],[10,4],[10,5],[10,6],[6,7],[7,7],[8,7],[9,7]].forEach(([x,y])=>sbZones[x+','+y]=SBZ);
 ST_MAPS.shibuya={name:'渋谷 · スクランブル交差点',short:'渋谷',oy:-12,shiftX:{5:-14},
  intro:'ハチ公口出来就是十字路口。斜着的斑马线通到对角的大屏幕大楼，大楼左边是センター街。',
  rows:R([1,2],[1,2],[1,2],span(0,14),[5,6,7,10],[5,7,8,10],[5,8,9,10],span(5,13),[5,12],[5,10,12,13,14,15],[5,10,11,12,14,15]),
  spawn:{x:14,y:9},npcs:[],layout:layoutFor('shibuya'),
  doors:{
   '14,8':{label:'ハチ公口',act:'gate',nochip:true},'15,8':{label:'ハチ公口',act:'gate',nochip:true},
   '13,10':{label:'自動販売機',act:'facility',f:'vending',nochip:true},
   '4,8':{label:'セレクトショップ',act:'quiz',q:'shop',text:'橱窗里挂着当季的衬衫。店员在叠一摞牛仔裤。',nochip:true},
   '4,9':{label:'古着屋',act:'quiz',q:'shop',text:'一排排旧外套挂得很满，价签是手写的。',nochip:true},
   '4,2':{label:'百貨店',act:'quiz',q:'shop',text:'大屏幕下面的商业大楼，一楼是化妆品和杂货。',nochip:true},
   '3,2':{label:'カフェ',act:'quiz',q:'food',text:'二楼的落地窗前坐满了人，大家都在往下看十字路口。',nochip:true},
   '11,2':{label:'唱片店',act:'quiz',q:'shop',text:'店门口的试听机里放着很老的城市流行乐。',nochip:true},
   '0,2':{label:'铃木（服装店员）',act:'quiz',q:'shop',text:'「いらっしゃいませ！何かお探しですか？」想在涩谷购物，先掌握试穿、尺寸和结账的表达吧。',nochip:true},
   '0,1':{label:'ビジネスホテル',act:'facility',f:'sleep',nochip:true},
   '14,2':{label:'ドラッグストア',act:'facility',f:'potion',nochip:true},
   '3,1':{label:'古着屋の裏通り',act:'facility',f:'npc',nochip:true},
   '13,8':C('忠犬ハチ公像','秋田犬的铜像一直朝着站口。等人的人换了一拨又一拨。','铜像的鼻尖被摸得发亮。灯下，它好像比白天更像在等谁。',[['📷 拍一张','fn:hachiko']]),
   '11,8':D('广场的树','树下围着一圈矮栏，几个人靠着栏杆看手机。「ハチ公の前にいる」——女孩对着电话说。','树下的人都低着头。屏幕的光把每张脸照得一样白。'),
   '11,9':D('广场的树','树下围着一圈矮栏，几个人靠着栏杆看手机。','树下的人都低着头。屏幕的光把每张脸照得一样白。'),
   '12,2':C('站前电器店','店门口摆着一排展示相机。里面有人在柜台前试取景器。','店里还亮着灯，展示相机的屏幕上全是十字路口的画面。',[['🛍 进店','fn:shop']]),
   '13,2':C('站前电器店','店门口摆着一排展示相机。里面有人在柜台前试取景器。','店里还亮着灯，展示相机的屏幕上全是十字路口的画面。',[['🛍 进店','fn:shop']])},
  zones:Object.assign(sbZones,{
   '1,0':{label:'センター街',nochip:true,run:()=>SB_FN.lane()},'2,0':{label:'センター街',nochip:true,run:()=>SB_FN.lane()},
   '0,3':Z('往道玄坂','路往西是道玄坂。今天先走到这里。','道玄坂那边的灯很亮。今天先走到这里。'),
   '14,3':Z('高架下','JR 的高架桥下面很暗，车从桥下钻出去。','桥下的灯一闪一闪，电车从头顶开过，整座桥都在抖。')})};

 /* ================= 上野駅 不忍口（v72） ================= */
 ST_MAPS.ueno={name:'上野駅 不忍口',short:'上野',oy:-10,shiftX:{6:12},
  intro:'不忍口出来是中央通り。过了斑马线，石阶上去是西郷さん；往左下是不忍池和资料馆。',
  rows:R([6,12],[6,12],[6,12],span(4,10).concat([12]),[4,8,9,10,12],[3,4,8,9,10,12],[3,4,8,9,10,11,12,13],[3,4,10,12],[3,12],span(2,10).concat([12]),[6,7,12]),
  spawn:{x:13,y:6},get npcs(){return npcsFor('ueno')},layout:layoutFor('ueno'),
  doors:{
   '14,6':{label:'不忍口',act:'gate',nochip:true},'15,6':{label:'不忍口',act:'gate',nochip:true},
   '13,2':{label:'駅ナカ 薬局',act:'facility',f:'potion',nochip:true},
   '13,4':{label:'自動販売機',act:'facility',f:'vending',nochip:true},
   '13,8':{label:'駅前の宿',act:'facility',f:'sleep',nochip:true},
   '13,9':{label:'銭湯（案内）',act:'facility',f:'sento',nochip:true},
   '4,2':D('清水観音堂','红色的佛堂，舞台伸向不忍池。堂里供着很多人偶。','堂里点着一盏灯。舞台下面的池水黑得看不见底。'),
   '5,2':D('清水観音堂','红色的佛堂，舞台伸向不忍池。堂里供着很多人偶。','堂里点着一盏灯。舞台下面的池水黑得看不见底。'),
   '7,2':D('西郷隆盛像','穿着和服、牵着狗的铜像。有人在台座前约着见面。','铜像的影子被路灯拉得很长，一直伸到石阶下面。'),
   '8,2':D('西郷隆盛像','穿着和服、牵着狗的铜像。有人在台座前约着见面。','铜像的影子被路灯拉得很长，一直伸到石阶下面。'),
   '7,6':D('京成上野駅','往地下的入口，坐京成线可以去成田机场。','入口亮着灯，楼梯下面传来很远的列车声。')},
  zones:{
   '6,0':Z('往公園口','园路往北通到公園口。今天先走到这里。','园路上一盏灯也没有。今天先走到这里。'),
   '6,10':Z('往上野広小路','往南是上野広小路。今天先走到这里。','往南的路灯一盏比一盏暗。今天先走到这里。'),
   '7,10':Z('往上野広小路','往南是上野広小路。今天先走到这里。','往南的路灯一盏比一盏暗。今天先走到这里。'),
   '11,6':Z('斑马线','绿灯亮了，人群从车站涌向公园。','红灯很长，马路上一辆车也没有。')}};

 /* ================= 新橋駅 日比谷口 / 烏森口（v72） ================= */
 ST_MAPS.shimbashi={name:'新橋駅 · SL広場',short:'新橋',oy:-12,
  intro:'日比谷口出来就是 SL 広場。左边是老旧的白色大楼，高架下面一整排居酒屋。',
  rows:R([2,13],[2,13],[2,13],[2,13,14],[2,13,14],span(0,8).concat(span(10,15)),[2].concat(span(9,15)),span(0,15).filter(x=>x!==10),[],[],[]),
  spawn:{x:9,y:7},get npcs(){return npcsFor('shimbashi')},layout:layoutFor('shimbashi'),
  doors:{
   '9,8':{label:'日比谷口',act:'gate',nochip:true},'2,8':{label:'烏森口',act:'gate',nochip:true},
   '4,4':{label:'薬局（ビル内）',act:'facility',f:'potion',nochip:true},
   '15,4':{label:'駅前の宿',act:'facility',f:'sleep',nochip:true},
   '1,8':{label:'自動販売機',act:'facility',f:'vending',nochip:true},
   '10,4':D('SL（C11-292）','黑色的蒸汽机车停在石块台座上。中午、下午三点和傍晚六点，它会鸣一次汽笛。','机车被地灯照着。明明没有到点，汽笛却低低地响了一声。'),
   '11,4':D('SL（C11-292）','黑色的蒸汽机车停在石块台座上。中午、下午三点和傍晚六点，它会鸣一次汽笛。','机车被地灯照着。明明没有到点，汽笛却低低地响了一声。'),
   '1,1':D('烏森神社','夹在楼和楼之间的小神社，朱色鸟居后面是很短的参道。','神社里点着两盏灯笼。鸟居下面积着一小滩水。'),
   '1,2':D('烏森神社','夹在楼和楼之间的小神社，朱色鸟居后面是很短的参道。','神社里点着两盏灯笼。鸟居下面积着一小滩水。'),
   '12,8':D('高架下的居酒屋','啤酒箱当椅子，下班的人挤在拱洞里。头顶电车开过，杯子里的啤酒跟着抖。','拱洞里的笑声很大。电车开过时，所有人都停了一秒，然后接着笑。')},
  zones:{
   '2,0':Z('烏森通り','窄街往里延伸，两边都是小酒馆。今天先走到这里。','窄街里的招牌一盏接一盏。今天先走到这里。'),
   '13,0':Z('新橋仲通り','往北的仲通り。今天先走到这里。','仲通りの呼び込みの声が聞こえる。今天先走到这里。'),
   '2,6':Z('斑马线','过了斑马线就是烏森口。','信号灯照常变换，马路上一辆车也没有。')}};

 /* ================= v73 通用车站六种 ================= */
 /* 通用车站六种：格子数据（16×11，每格 = 原图 120px）。
    walk: {行号:[可走的列]}；feet: {行号:脚落点在格内的高度 0–1}（默认 .5，按画面里那条路 / 人行道的位置定）；
    shiftX: {列:px}（32px 制）让这一列的人站到画面里路的中线上；
    doors: {'x,y':种类}  种类：gate 改札（gate! = 这一格显示站名牌）、konbini、vend、drug、inn、koban、shop（本站主题答题）、
           izakaya / food（饮食店答题）、flavor（只给描写），后面 | 跟店名、白天描写、夜间描写；
    zones: 出口（先不开放）；spare: 原有调查点 / 生活点 / 人物按顺序摆放的格子。 */
 const GEN_SPEC={
  A:{name:'住宅街小站',
   guide:[14,5,'v2_housewife'],
   intro:'小小的木造站舍，出了改札就是站前环岛。对面一排是便利店、居酒屋和药局，拱门后面是住宅区。',
   walk:{3:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],4:[0,13,14,15],5:[0,13,14,15],6:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],7:[9],8:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],9:[9],10:[9]},
   feet:{3:.38,4:.55,5:.5,6:.25,7:.55,8:.92,9:.5,10:.5},
   spawn:[8,3],
   doors:{'4,2':'gate','5,2':'gate','6,2':'gate','7,2':'gate!','8,2':'gate','0,2':'vend',
    '13,2':'koban','14,2':'koban',
    '0,7':'konbini','1,7':'konbini','2,7':'konbini','3,7':'shop|雑貨屋','4,7':'shop|雑貨屋','5,7':'izakaya|居酒屋','6,7':'izakaya|居酒屋',
    '7,7':'food|喫茶店','8,7':'food|喫茶店','11,7':'drug','12,7':'drug','13,7':'inn','14,7':'inn','15,7':'inn',
    '11,4':'flavor|バス停|环岛边的公交站。站牌上的时刻表一小时只有三班。|公交站的灯还亮着，末班车早就开走了。','12,4':'flavor|バス停|环岛边的公交站。站牌上的时刻表一小时只有三班。|公交站的灯还亮着，末班车早就开走了。'},
   zones:{'9,10':'往住宅区'},
   spare:[[3,3],[11,3],[2,6],[5,6],[11,6],[14,6],[4,8],[12,8],[14,4],[0,5],[6,3],[7,8]]},
  B:{name:'大站公交环岛',
   guide:[0,3,'v2_salaryman'],
   intro:'站前是一大片公交环岛。改札正对着交番，过了斑马线，对面一整排是便利店、药局和小吃店。',
   walk:{3:[0,1,2,3,4,5,6,7,8,10,11,12,13,14,15],4:[2,8,9,10,11],5:[2,3,4,5,6,7,8,11],6:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]},
   feet:{3:.2,4:.3,5:.38,6:.78},shiftX:{2:8},
   /* 下排人行道上的三棵树：人走到树后面时，树画在人前面 */
   fg:[{p:[[0.98,7.0],[0.98,6.05],[1.85,6.05],[1.85,7.0]],z:7.0},{p:[[6.95,7.25],[6.95,6.1],[7.8,6.1],[7.8,7.25]],z:7.25},{p:[[14.15,7.0],[14.15,6.05],[15.02,6.05],[15.02,7.0]],z:7.0}],
   spawn:[8,3],
   doors:{'6,2':'gate','7,2':'gate!','8,2':'gate','9,3':'koban','1,2':'shop|駅ビル','2,2':'shop|駅ビル','13,2':'inn','14,2':'inn','15,2':'inn',
    '0,7':'konbini','1,7':'konbini','2,7':'konbini','3,7':'drug','4,7':'drug','5,7':'drug',
    '6,7':'shop|商店','7,7':'food|パン屋','8,7':'shop|商店','9,7':'shop|商店','10,7':'shop|八百屋',
    '11,7':'izakaya|居酒屋','12,7':'izakaya|居酒屋','13,7':'food|喫茶店','14,7':'food|喫茶店','15,7':'vend'},
   zones:{'0,6':'往东口','15,6':'往西口'},
   spare:[[3,3],[10,3],[13,3],[5,5],[7,5],[3,6],[12,6],[13,6],[4,6],[14,3],[2,3]]},
  C:{name:'高架下横丁',
   guide:[8,5,'v2_youngman'],
   intro:'高架桥下的车站。上面两排是居酒屋横丁，从高架下的拱洞穿过去，就到了站口这一侧。',
   walk:{2:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],3:[7],4:[1,2,3,4,5,6,7,8,9,10,11,12,13,14],5:[1,3,4,7,8,11,12],6:[12],7:[12],8:[12],9:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],10:[12]},
   feet:{2:.55,3:.5,4:.58,5:.45,6:.5,7:.55,8:.6,9:.42,10:.5},shiftX:{7:12,12:-4},
   fg:[{p:[[11.55,6.05],[13.15,6.05],[13.15,7.3],[11.55,7.3]],z:7.3}],
   spawn:[4,9],
   doors:{'1,1':'izakaya|居酒屋','2,1':'izakaya|居酒屋','3,1':'izakaya|居酒屋','4,1':'izakaya|居酒屋','5,1':'izakaya|居酒屋','6,1':'izakaya|居酒屋','7,1':'izakaya|居酒屋',
    '8,1':'shop|商店','9,1':'shop|商店','10,1':'inn','11,1':'inn','12,1':'inn','13,1':'konbini','14,1':'konbini','15,1':'konbini',
    '1,3':'izakaya|居酒屋','2,3':'izakaya|居酒屋','3,3':'izakaya|居酒屋','4,3':'izakaya|居酒屋','5,3':'izakaya|居酒屋','6,3':'izakaya|居酒屋',
    '9,3':'izakaya|居酒屋','10,3':'izakaya|居酒屋','11,3':'izakaya|居酒屋','13,3':'drug','14,3':'drug','15,3':'drug',
    '2,5':'koban','13,5':'vend','14,5':'vend',
    '0,8':'izakaya|立ち飲み','1,8':'izakaya|立ち飲み','2,8':'food|そば','3,8':'gate','4,8':'gate!','5,8':'gate',
    '6,8':'izakaya|立ち飲み','7,8':'food|そば','8,8':'food|そば','9,8':'shop|八百屋','10,8':'food|喫茶店','11,8':'food|喫茶店',
    '13,8':'food|そば','14,8':'food|そば','15,8':'izakaya|立ち飲み'},
   zones:{'12,10':'往大马路'},
   spare:[[3,2],[10,2],[5,4],[9,4],[12,4],[1,9],[7,9],[10,9],[14,9],[13,4],[0,2]]},
  D:{name:'拱廊商店街',
   guide:[1,3,'v2_kimono'],
   intro:'站前过了马路，就是带玻璃顶棚的拱廊商店街。药局、便利店和宿都在拱廊口两边。',
   walk:{3:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],4:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],5:[7,8],6:[7,8],7:[7,8],8:[7,8],9:[7,8],10:[7,8]},
   feet:{3:.25,4:.55},
   spawn:[8,3],
   doors:{'0,2':'vend','4,2':'shop|商店','5,2':'shop|商店','6,2':'gate','7,2':'gate!','8,2':'gate','9,2':'gate','10,2':'shop|駅前の店','11,2':'shop|駅前の店',
    '1,5':'flavor|小さな神社|夹在楼和楼之间的小神社，红色鸟居后面是几级石阶。|鸟居下面亮着一盏小灯，石阶上积着一点水。','2,5':'flavor|小さな神社|夹在楼和楼之间的小神社，红色鸟居后面是几级石阶。|鸟居下面亮着一盏小灯，石阶上积着一点水。',
    '3,5':'koban*','4,5':'drug','5,5':'drug','6,5':'drug','9,5':'konbini','10,5':'konbini','11,5':'konbini','12,5':'inn','13,5':'inn',
    '6,6':'izakaya|居酒屋','6,7':'food|パン屋','6,8':'shop|洋服店','6,9':'shop|洋服店','9,6':'shop|雑貨屋','9,7':'shop|八百屋','9,8':'food|食堂','9,9':'food|食堂'},
   zones:{'7,10':'商店街往南','8,10':'商店街往南'},
   spare:[[2,3],[11,3],[14,3],[1,4],[12,4],[15,4],[7,6],[8,8],[7,9],[4,3],[13,4]]},
  E:{name:'写字楼地铁口',
   guide:[10,4,'v2_officewoman'],
   intro:'地铁出口夹在写字楼之间。马路对面是小广场和喷泉，交番、宿和药局都在广场边上。',
   walk:{2:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],3:[2,4,6,9,11],4:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],5:[7,8],6:[7,8],7:[1,2,3,4,5,6,7,8,9,10,11,14],8:[3,4,5,6,9,10,11,12,13,14]},
   feet:{2:.5,3:.5,4:.32,5:.5,6:.5,7:.2,8:.55},
   spawn:[7,4],
   doors:{'1,1':'flavor|オフィスビル|玻璃门后面是电梯厅，保安在登记访客。|大楼只剩几层亮着灯，保安在大厅里来回走。','3,1':'shop|商店','4,1':'shop|商店',
    '5,1':'flavor|オフィスビル|玻璃门后面是电梯厅，保安在登记访客。|大楼只剩几层亮着灯，保安在大厅里来回走。',
    '6,1':'konbini','7,1':'konbini','8,1':'konbini',
    '9,1':'flavor|オフィスビル|一楼是写字楼的大堂，几个上班族边走边看手机。|大堂的灯还亮着，旋转门一动不动。','10,1':'flavor|オフィスビル|一楼是写字楼的大堂，几个上班族边走边看手机。|大堂的灯还亮着，旋转门一动不动。',
    '12,1':'food|珈琲','13,1':'food|珈琲','14,1':'flavor|オフィスビル|写字楼的侧门，门口停着送快递的手推车。|侧门锁着，门禁的小红灯一闪一闪。',
    '7,3':'gate!','8,3':'gate',
    '1,8':'inn','2,8':'inn','12,7':'koban','13,7':'koban','12,9':'drug','13,9':'drug','7,8':'vend','8,8':'vend',
    '4,9':'food|定食屋','5,9':'food|定食屋','10,9':'shop|商店'},
   zones:{'0,4':'往西','15,4':'往东'},
   /* 喷泉：踩到喷泉边的格子时给描写（喷泉本身不可走） */
   looks:{'6,7':['噴水','喷泉一阵高一阵低，午休的上班族坐在边上吃便当。','喷泉关了，水面上漂着几片叶子，映着写字楼的灯。'],'9,7':['噴水','喷泉一阵高一阵低，午休的上班族坐在边上吃便当。','喷泉关了，水面上漂着几片叶子，映着写字楼的灯。']},
   spare:[[1,2],[5,2],[10,2],[14,2],[4,4],[11,4],[13,4],[2,7],[10,7],[4,8],[10,8],[14,8]]},
  F:{name:'河边车站',
   guide:[3,4,'v2_oldman'],
   intro:'车站就在河边。站前是一排樱花树，过了小桥，对岸是居酒屋、药局和宿。',
   walk:{2:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],3:[1,4,7,10,14],4:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],5:[7,8],6:[7,8],7:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],8:[13],9:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],10:[12]},
   feet:{2:.85,3:.5,4:.38,5:.5,6:.5,7:.1,8:.5,9:.35,10:.5},shiftX:{7:8,8:-8},
   spawn:[5,2],
   doors:{'0,1':'vend','3,1':'gate','4,1':'gate','5,1':'gate!','6,1':'gate','10,1':'shop|商店','11,1':'shop|商店','12,1':'konbini','13,1':'konbini','14,1':'koban','15,1':'koban',
    '4,5':'flavor|河|河水很慢，屋形船靠在岸边，船上的灯笼还没点。|屋形船的灯笼全亮了，水面上一晃一晃的。','11,5':'flavor|河|河水很慢，樱花的花瓣漂在水面上。|水面黑得看不见底，花瓣还在往下游漂。',
    '0,8':'izakaya|居酒屋','1,8':'izakaya|居酒屋','2,8':'food|パン屋','3,8':'food|パン屋','4,8':'food|珈琲','5,8':'food|珈琲',
    '6,8':'drug','7,8':'drug','9,8':'inn','10,8':'inn','11,8':'inn'},
   zones:{'12,10':'往下游'},
   spare:[[2,2],[9,2],[1,4],[11,4],[14,4],[2,7],[13,7],[5,9],[10,9],[8,2],[5,4],[15,9]]}
 };
 /* 车站分配（东京、新宿、池袋、秋葉原、高田馬場、銀座有专用方案；品川、浅草、北品川、五反田、明治神宮前、涩谷、上野、新桥已有定稿图；机场和迪士尼不是车站街区，都不分配） */
 const GEN_ASSIGN={
  A:['tabata','nishi-nippori','komagome','mejiro','uguisudani'],
  B:['osaki','oimachi','meguro','takanawa-gateway','nippori','kokusaitenjijo'],
  C:['yurakucho','kanda','ebisu','okachimachi','shin-okubo','hamamatsucho'],
  D:['sugamo','otsuka','nakano','harajuku','shinjukusanchome'],
  E:['nihombashi','akasakamitsuke','tamachi','omotesando','yoyogi'],
  F:['ochanomizu','asakusabashi','tokyoteleport']
 };
 /* v75 六站专用地图（東京、新宿、池袋、秋葉原、高田馬場、銀座）：格式同通用图，每站一张。
    门的新种类：spot|点位id（直接用这一站原来的点位：名字、答题类型都照旧）；quiz|名字|题型。
    hideSpots：被门替代的原点位（不再单独显示标记）。kind 后面带 * = 图里没画，地图上显示名字牌。 */
 Object.assign(GEN_SPEC,{
  tokyo:{name:'丸の内駅前広場',
   intro:'红砖站舍正对着丸の内的站前广场。两边是巴士和出租车的乘车处，广场一直通到行幸通り。',
   walk:{3:[0,1,2,3,4,5,6,7,8,9,10,11,12,13],4:[5,7,8,10],5:[5,10],6:[5,7,8,10],7:[5,7,8,10],8:[5,7,8,10],9:[5,7,8,10],10:[5,6,7,8,9,10]},
   feet:{3:.42,4:.5,5:.55,6:.6,7:.55,8:.55,9:.6,10:.5},
   spawn:[8,3],guide:[10,4,'v2_officewoman'],
   doors:{'1,2':'gate','2,2':'gate','7,2':'gate!','8,2':'gate','13,2':'gate','14,3':'quiz|丸の内のビル|help',
    '12,2':'koban*','3,2':'vend',
    '1,4':'flavor|バスのりば|丸の内南口的巴士乘车处，去东京站周边和羽田的巴士都在这里停。|末班巴士的指示灯还亮着，长椅上一个人也没有。','2,4':'flavor|バスのりば|丸の内南口的巴士乘车处，去东京站周边和羽田的巴士都在这里停。|末班巴士的指示灯还亮着，长椅上一个人也没有。',
    '12,4':'flavor|タクシーのりば|出租车排成一列，司机靠在车门边抽烟。|空车的灯一盏接一盏，排队的人比车少。',
    '4,7':'konbini*','4,8':'shop*|駅ナカ商店街','4,9':'food*|駅弁屋',
    '11,7':'drug*','11,8':'inn*','11,9':'inn*'},
   zones:{'7,10':'往行幸通り','8,10':'往行幸通り'},
   spare:[[1,3],[5,3],[11,3],[13,3],[7,4],[5,6],[10,6],[7,8],[10,8],[5,10],[9,10],[6,10]]},
  shinjuku:{name:'西口駅前',hideSpots:['cross','store'],
   intro:'西口的改札正对着巴士乘车处。左边是思い出横丁，过了斑马线，对面是百货店、家电量贩店和酒店。',
   walk:{3:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],4:[1,2,8],5:[1,2,8],6:[8],7:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],8:[5,8],9:[8],10:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]},
   feet:{3:.75,4:.5,5:.45,6:.5,7:.42,8:.55,9:.5,10:.6},shiftX:{8:-4},
   fg:[{p:[[3.94,4.0],[3.94,3.3],[4.55,3.3],[4.55,4.0]],z:4.0},{p:[[6.3,4.05],[6.3,3.3],[6.95,3.3],[6.95,4.05]],z:4.05},{p:[[10,4.0],[10,3.3],[10.65,3.3],[10.65,4.0]],z:4.0},{p:[[12.4,4.0],[12.4,3.25],[13.1,3.25],[13.1,4.0]],z:4.0}],
   spawn:[8,3],guide:[2,5,'v2_youngman'],
   doors:{'7,2':'gate','8,2':'gate!','9,2':'gate','0,4':'gate',
    '2,2':'spot|izakaya','1,2':'spot|izakaya',
    '4,2':'flavor|工事現場|白色围挡里，挖掘机停着不动。告示上写着「西口再開発工事」。|围挡里只有一盏工作灯亮着，照着一滩积水。','5,2':'flavor|工事現場|白色围挡里，挖掘机停着不动。告示上写着「西口再開発工事」。|围挡里只有一盏工作灯亮着，照着一滩积水。',
    '11,2':'quiz|百貨店|shop','12,2':'quiz|百貨店|shop','13,2':'quiz|百貨店|shop','14,2':'quiz|百貨店|shop','14,4':'koban',
    '1,8':'quiz|百貨店|shop','2,8':'quiz|百貨店|shop','3,8':'quiz|百貨店|shop','1,9':'quiz|百貨店|shop','2,9':'quiz|百貨店|shop','3,9':'quiz|百貨店|shop',
    '5,9':'gate','6,8':'konbini','6,9':'konbini','7,8':'drug*','7,9':'drug*','9,9':'food|喫茶店','10,9':'spot|ramen','10,8':'spot|ramen',
    '12,8':'quiz|家電量販店|shop','13,8':'quiz|家電量販店|shop','12,9':'quiz|家電量販店|shop','13,9':'quiz|家電量販店|shop',
    '14,8':'inn','15,8':'inn','14,9':'inn','15,9':'inn','11,9':'vend*'},
   zones:{'0,7':'往新宿駅南口','15,7':'往都庁方向','0,10':'往大ガード','15,10':'往都庁方向'},
   spare:[[3,3],[5,3],[10,3],[13,3],[15,3],[2,4],[3,7],[10,7],[13,7],[1,10],[4,10],[9,10],[12,10],[15,10]]},
  ikebukuro:{name:'東口駅前',
   intro:'东口出来就是百货店。过了斑马线，对面是家电店、酒店和商店街的拱门，右边的小路通往太阳城。',
   walk:{1:[11],2:[11],3:[11],4:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],5:[7,8,9],6:[7,8,9],7:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],8:[8],9:[8],10:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]},
   feet:{1:.6,2:.6,3:.6,4:.45,5:.5,6:.5,7:.12,8:.5,9:.5,10:.5},shiftX:{11:4},
   fg:[{p:[[0.15,4.75],[0.15,3.9],[0.95,3.9],[0.95,4.75]],z:4.75},{p:[[1.0,4.75],[1.0,3.9],[1.65,3.9],[1.65,4.75]],z:4.75},{p:[[2.6,4.75],[2.6,3.9],[3.15,3.9],[3.15,4.75]],z:4.75},{p:[[4.55,4.75],[4.55,3.85],[5.35,3.85],[5.35,4.75]],z:4.75},{p:[[11.0,4.6],[11.0,3.4],[11.8,3.4],[11.8,4.6]],z:4.6},{p:[[14.2,4.75],[14.2,3.95],[14.8,3.95],[14.8,4.75]],z:4.75},{p:[[15.0,4.75],[15.0,3.9],[15.6,3.9],[15.6,4.75]],z:4.75}],
   spawn:[8,4],guide:[11,1,'v2_glasses'],
   doors:{'7,3':'gate','8,3':'gate!','9,3':'gate','6,3':'koban*','10,3':'vend*',
    '1,3':'shop|百貨店','2,3':'shop|百貨店','3,3':'shop|百貨店','4,3':'shop|百貨店','5,3':'shop|百貨店','13,3':'shop|百貨店','14,3':'shop|百貨店','15,3':'shop|百貨店',
    '0,8':'quiz|家電量販店|shop','1,8':'quiz|家電量販店|shop','2,8':'quiz|家電量販店|shop','1,9':'quiz|家電量販店|shop','2,9':'quiz|家電量販店|shop',
    '4,8':'inn','5,8':'inn','4,9':'inn','5,9':'inn','6,8':'food|食堂','7,8':'food|食堂','6,9':'food|食堂','7,9':'food|食堂',
    '10,8':'izakaya|居酒屋','10,9':'izakaya|居酒屋','11,9':'drug','12,9':'drug','13,9':'drug','11,8':'drug','12,8':'drug',
    '14,9':'konbini*','14,8':'konbini*','15,9':'facility*|銭湯|sento','15,8':'facility*|銭湯|sento'},
   zones:{'11,0':'往太阳城方向','0,4':'往西武口','15,4':'往明治通り','0,10':'往北口','15,10':'往明治通り','8,10':'商店街往里'},
   spare:[[3,4],[6,4],[10,4],[12,4],[14,4],[11,2],[2,7],[5,7],[11,7],[14,7],[3,10],[6,10],[11,10],[13,10]]},
  akihabara:{name:'電気街口',hideSpots:['conv'],
   intro:'电気街口的北口、南口并排着。过了马路是动漫店和便利店，再往下一条街是游戏中心、家电量贩店、药妆店和商务酒店。',
   walk:{3:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],4:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],5:[9],6:[9],7:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],8:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]},
   feet:{3:.55,4:.48,5:.5,6:.5,7:.2,8:.15},shiftX:{9:-5},
   fg:[{p:[[3.25,3.75],[3.25,2.9],[3.95,2.9],[3.95,3.75]],z:3.75},{p:[[5.1,3.75],[5.1,2.4],[6.05,2.4],[6.05,3.75]],z:3.75},{p:[[11.55,3.7],[11.55,2.75],[12.35,2.75],[12.35,3.7]],z:3.7},{p:[[12.35,3.7],[12.35,2.75],[13.1,2.75],[13.1,3.7]],z:3.7},{p:[[13.5,3.7],[13.5,2.85],[14.2,2.85],[14.2,3.7]],z:3.7},{p:[[1.6,3.75],[1.6,2.85],[2.3,2.85],[2.3,3.75]],z:3.75},{p:[[0.0,3.75],[0.0,2.4],[0.65,2.4],[0.65,3.75]],z:3.75}],
   spawn:[7,3],guide:[14,3,'v2_hoodie'],
   doors:{'6,2':'gate','7,2':'gate','9,2':'gate','10,2':'gate','13,2':'koban*','4,2':'vend*',
    '1,6':'spot|game','2,6':'spot|game','3,6':'spot|anime','4,6':'spot|anime','5,6':'spot|anime','6,6':'spot|anime','8,6':'konbini',
    '10,6':'spot|game','11,6':'spot|game','12,6':'spot|game','13,6':'spot|anime',
    '1,9':'flavor|ゲームセンター街|拱廊下面是一整排游戏中心，抓娃娃机的音乐混在一起。|拱廊的灯还亮着，抓娃娃机里的娃娃一个个盯着外面。','2,9':'flavor|ゲームセンター街|拱廊下面是一整排游戏中心，抓娃娃机的音乐混在一起。|拱廊的灯还亮着，抓娃娃机里的娃娃一个个盯着外面。',
    '4,9':'spot|tech','5,9':'spot|tech','6,9':'spot|tech','7,9':'spot|tech','8,9':'drug','9,9':'drug','10,9':'drug','11,9':'inn','12,9':'inn','13,9':'inn','14,9':'inn'},
   zones:{'0,3':'往秋葉原UDX','0,7':'往中央通り','14,7':'往神田川'},
   spare:[[2,3],[4,3],[11,3],[12,4],[1,4],[5,4],[1,7],[3,7],[6,7],[11,7],[2,8],[13,8],[5,8]]},
  takadanobaba:{name:'早稲田口',
   intro:'早稲田口出来是巴士环岛。环岛右边是交番，对面一排是便利店、拉面店和药局，过了马路是早稲田通り。',
   walk:{3:[3,4,5,6,7,8,9,10,11,12,13,14],4:[3,4,13],5:[3,4,13],6:[3,4,5,6,7,8,9,10,11,12,13,14,15],8:[3,4,5,6,7,8,9,10,11,12,13,14,15],7:[4],9:[8],10:[8]},
   feet:{3:.6,4:.5,5:.5,6:.22,7:.5,8:.82,9:.5,10:.5},shiftX:{8:-8},
   fg:[{p:[[5.9,3.45],[5.9,2.25],[6.6,2.25],[6.6,3.45]],z:3.45},{p:[[8.1,3.4],[8.1,2.2],[8.95,2.2],[8.95,3.4]],z:3.4},{p:[[10.9,3.45],[10.9,2.25],[11.7,2.25],[11.7,3.45]],z:3.45},{p:[[13.0,4.6],[13.0,3.3],[13.65,3.3],[13.65,4.6]],z:4.6}],
   spawn:[4,3],guide:[3,5,'v2_gakuran'],
   doors:{'3,2':'gate','4,2':'gate','3,7':'gate',
    '6,2':'shop|スポーツショップ','7,2':'shop|スポーツショップ','9,2':'shop|スポーツショップ','10,2':'shop|スポーツショップ','12,2':'shop|スポーツショップ','13,2':'shop|スポーツショップ','14,2':'inn*',
    '14,5':'koban','15,5':'koban','5,7':'konbini','6,7':'konbini','7,7':'vend','8,7':'food|らーめん','9,7':'food|らーめん','10,7':'food|ラーメン','11,7':'izakaya|らぁめん居酒屋','12,7':'izakaya|らぁめん居酒屋','14,7':'drug','15,7':'drug',
    '6,4':'flavor|バスのりば|环岛边的巴士站，开往早稻田大学的巴士一辆接一辆。|最后一班巴士开走了，站牌下面只剩一张被雨淋湿的时刻表。','7,4':'flavor|バスのりば|环岛边的巴士站，开往早稻田大学的巴士一辆接一辆。|最后一班巴士开走了，站牌下面只剩一张被雨淋湿的时刻表。'},
   zones:{'8,10':'往早稲田通り','15,8':'往明治通り','15,6':'往明治通り'},
   spare:[[5,3],[8,3],[10,3],[12,3],[4,5],[13,4],[5,6],[10,6],[13,6],[4,8],[9,8],[12,8],[15,8]]},
  ginza:{name:'銀座四丁目交差点',
   intro:'银座四丁目的十字路口。四个角上各有一个地铁出口，钟楼和百货店隔着路口相对。',
   walk:{4:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],5:[6,9],6:[6,9],7:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]},
   feet:{4:.42,5:.5,6:.5,7:.22},
   fg:[{p:[[0.15,4.55],[0.15,3.0],[0.85,3.0],[0.85,4.55]],z:4.55},{p:[[2.0,4.55],[2.0,3.0],[2.85,3.0],[2.85,4.55]],z:4.55},{p:[[14.9,4.55],[14.9,3.0],[15.7,3.0],[15.7,4.55]],z:4.55},{p:[[0.05,7.25],[0.05,5.8],[0.85,5.8],[0.85,7.25]],z:7.25},{p:[[2.0,7.25],[2.0,5.8],[2.9,5.8],[2.9,7.25]],z:7.25},{p:[[12.7,7.2],[12.7,5.8],[13.45,5.8],[13.45,7.2]],z:7.2},{p:[[14.9,7.25],[14.9,5.9],[15.65,5.9],[15.65,7.25]],z:7.25}],
   spawn:[6,4],guide:[15,7,'v2_kimono'],
   doors:{'6,3':'gate!','9,3':'gate','6,8':'gate','9,8':'gate',
    '0,3':'food*|喫茶店','1,3':'food*|喫茶店','2,3':'drug*','3,3':'shop|時計店','4,3':'shop|時計店','5,3':'shop|時計店',
    '10,3':'shop|百貨店','11,3':'shop|百貨店','12,3':'shop|百貨店','13,3':'shop|百貨店','14,3':'vend*',
    '0,8':'inn*','1,8':'inn*','2,8':'inn*','3,8':'quiz|ブティック|shop','4,8':'quiz|ブティック|shop','5,8':'quiz|ブティック|shop',
    '10,8':'konbini*','11,8':'quiz|商業ビル|shop','12,8':'quiz|商業ビル|shop','13,8':'quiz|商業ビル|shop','14,8':'koban*'},
   zones:{'0,4':'往有楽町','15,4':'往京橋','0,7':'往新橋'},
   spare:[[1,4],[3,4],[5,4],[10,4],[12,4],[14,4],[1,7],[3,7],[5,7],[13,7],[12,7],[8,4]]}
 });
 Object.assign(GEN_ASSIGN,{tokyo:['tokyo'],shinjuku:['shinjuku'],ikebukuro:['ikebukuro'],akihabara:['akihabara'],takadanobaba:['takadanobaba'],ginza:['ginza']});
 /* 生成：每个分到通用图的车站各一张 ST_MAPS（共用同一套图和格子；站名只在界面上显示，图里不画）。
    改札 → 答题（交通）/ 回东京地图；コンビニ → 原便利店（KSHOP）；自販機 / 薬局 / 宿 → 原设施；交番 → 问路答题；
    商店 → 本站原来的主题答题（makeDistrictPlan 的 main 点位）；居酒屋 / 饮食店 → 饮食答题。出口只给提示，先不开放。
    原来的「駅の改札 / 主题店 / 商店街 / 案内所」点位和设施标记被地图上的门替代（隐藏），其余标记（生活点、街区向导、山田、驱魔人等）按 spare 顺序摆到可走格上。 */
 const GEN_TEXT={
  '雑貨屋':['杂货屋。伞、电池、拖鞋，什么都有一点。','杂货屋的卷帘门拉下了一半，里面还亮着灯。'],
  '商店':['街边的小商店，店员在整理货架。','商店还开着，店员靠在柜台后面打哈欠。'],
  '駅ビル':['车站大楼的商场，一楼是土产和点心。','商场快打烊了，广播在放《萤之光》。'],
  '駅前の店':['站前的小店，门口摆着今天的特价。','站前的店还亮着，门口的特价牌收进去了。'],
  '八百屋':['蔬果店。萝卜和橘子堆得整整齐齐，价格用毛笔写在纸板上。','蔬果店收摊了，门口的纸箱叠在一起。'],
  '洋服店':['挂满衣服的小店，店员在叠毛衣。','橱窗里的人台还穿着白天那件衣服。'],
  'パン屋':['面包店。刚出炉的面包香一直飘到街上。','面包店只剩几个打折的面包，店员在擦烤盘。'],
  '喫茶店':['老式喫茶店，菜单上写着「本日のコーヒー」。','喫茶店里只剩一个客人，在看报纸。'],
  '珈琲':['咖啡店。上班族排着队买外带咖啡。','咖啡店还开着，窗边坐着几个对着电脑的人。'],
  '居酒屋':['居酒屋的红灯笼还没点，门口的黑板写着今天的推荐。','居酒屋里很热闹，「いらっしゃいませ！」的声音一直传到街上。'],
  '立ち飲み':['站着喝的小酒馆，中午就有人在喝啤酒。','站着喝的小酒馆挤满了下班的人。'],
  'そば':['立食荞麦面店，三分钟就能吃完一碗。','荞麦面店的蒸汽从门帘下面冒出来。'],
  '食堂':['大众食堂，今日定食写在门口的小黑板上。','食堂快打烊了，老板在收门口的菜单。'],
  '定食屋':['定食屋。午饭时间，门口排了几个上班族。','定食屋的灯还亮着，里面只剩老板一个人。'],
  /* v75 六站 */
  '百貨店':['百货店的大门开着，一楼是化妆品柜台，香水味飘到门口。','百货店已经打烊，橱窗里的灯还亮着，假人模特一动不动。'],
  '家電量販店':['家电量贩店的门口放着很大声的广告歌，店员举着牌子招呼客人。','家电量贩店快关门了，门口的电视墙还在放同一段广告。'],
  '時計店':['老字号的钟表店，橱窗里的表一排排走着，声音整齐得像在数什么。','钟楼的钟敲了一下。橱窗里的表全停在同一个时刻。'],
  'ブティック':['玻璃圆楼里的精品店，店员戴着白手套整理货架。','玻璃圆楼里只剩一层亮着灯，人台站在窗边看着路口。'],
  '商業ビル':['大型商业楼，入口处挤满了拍照的游客。','商业楼的外墙格子亮着暖光，入口的保安在关侧门。'],
  '駅ナカ商店街':['车站里的商店街，便当、点心、伴手礼一路排到改札口。','车站里的店陆续拉下卷帘，只剩一家点心铺在打折。'],
  '駅弁屋':['驿便当专卖店，全国各地的便当摆了一整面墙。','驿便当卖得只剩几盒，店员在收价签。'],
  'スポーツショップ':['大型体育用品店，一楼是跑鞋和运动服。','体育用品店的大玻璃后面，灯一排一排地关掉了。'],
  '丸の内のビル':['丸の内的办公楼。一楼大厅里有询问处，前台小姐对你点头微笑。','办公楼大厅只剩保安，询问处的牌子翻到了「本日の受付は終了しました」。']};
 const GEN_KOBAN=['交番。门口的警察在给游客指路，墙上贴着周边地图。','交番的灯一直亮着。值班的警察抬头看了你一眼。'];
 const GEN_HIDE=new Set(['station','main','market','help']);
 const genMainQ=id=>{try{const sp=makeDistrictPlan(byId[id]).spots.find(s=>s[0]==='main');if(sp&&sp[4]&&sp[4]!=='__life__')return sp[4]}catch(e){}return (byId[id]&&byId[id].sid)||'shop'};
 function genDoor(spec,st){const [k0,name,day,night]=spec.split('|'),k=k0.replace(/[!*]$/,''),chip=/[!*]$/.test(k0);
  const tx=(o,t,dv)=>Object.defineProperty(o,'text',{enumerable:true,get(){const v=GEN_TEXT[t]||dv;return v?(NIGHT()?v[1]:v[0]):''}}); // 白天 / 夜间描写，点开时再取
  let d;
  if(k==='gate')d={label:chip?st.jp+'駅':'改札',act:'gate'};
  else if(k==='konbini')d={label:'コンビニ',act:'konbini'};
  else if(k==='vend')d={label:'自動販売機',act:'facility',f:'vending'};
  else if(k==='drug')d={label:'薬局',act:'facility',f:'potion'};
  else if(k==='inn')d={label:'駅前の宿',act:'facility',f:'sleep'};
  else if(k==='koban')d=tx({label:'交番',act:'quiz',q:'help'},'',GEN_KOBAN);
  else if(k==='shop')d=tx({label:name||'商店',act:'quiz',get q(){return genMainQ(st.id)}},name);
  else if(k==='izakaya')d=tx({label:name||'居酒屋',act:'quiz',q:'izakaya'},name);
  else if(k==='food')d=tx({label:name||'飲食店',act:'quiz',q:'food'},name);
  /* v75：spot|点位id = 这一站原来的点位（名字、题型照旧）；quiz|名字|题型；facility|名字|设施 */
  else if(k==='spot'){let sp=null;try{sp=makeDistrictPlan(st).spots.find(s=>s[0]===name)}catch(e){}if(!sp)return D(name,'','');d={label:sp[2],act:'quiz',q:sp[4],text:sp[3]?sp[3]+'。':''}}
  else if(k==='quiz')d=tx({label:name,act:'quiz',q:day||'shop'},name);
  else if(k==='facility')d={label:name,act:'facility',f:day};
  else return D(name,day,night);
  if(!chip)d.nochip=true;return d}
 /* STV8.mount 会清空街区里原来的按钮：生活点（__life__）重新做成地图标记；街区向导画成小人，按 A 时走原来的 talkToNPC */
 function genEnsure(world,id){let plan;try{plan=makeDistrictPlan(byId[id])}catch(e){return}const L=DAYMAP[id]||{};
  /* 没有被门替代的原点位（生活点、自定义点位）都做成标记，点了走原来的 selectSpot */
  for(const sp of plan.spots){if(GEN_HIDE.has(sp[0])||(L.hideSpots||[]).includes(sp[0])||world.querySelector('[data-gen-spot="'+sp[0]+'"]'))continue;
   const b=document.createElement('button');b.type='button';b.className='street-hot';b.dataset.genSpot=sp[0];b.setAttribute('aria-label','访问'+sp[2]);b.innerHTML='<b aria-hidden="true">·</b><small>'+esc(sp[2])+'</small>';b.onclick=()=>selectSpot(sp[0]);world.appendChild(b)}
  /* 地图上没有门的原设施（地下联络人、銭湯等）也做成标记，点了走原来的 openFacility */
  try{const fac=facilitiesFor(id).slice();const ag=hiddenAgents[id];if(ag)fac.push(['agent','🕯️',ag[0],'npc']);
   for(const f of fac){if((L.facCovered||[]).includes(f[3])||world.querySelector('[data-gen-fac="'+f[3]+'"]'))continue;
    const b=document.createElement('button');b.type='button';b.className='street-hot';b.dataset.genFac=f[3];b.setAttribute('aria-label','进入'+f[2]);b.innerHTML='<b aria-hidden="true">·</b><small>'+esc(f[2])+'</small>';b.onclick=()=>openFacility(f[3],f[2]);world.appendChild(b)}}catch(e){}
  if(!world.querySelector('[data-street-object="gen-guide"]')){const b=document.createElement('button');b.type='button';b.className='gen-guide';b.dataset.streetObject='gen-guide';b.style.display='none';b.setAttribute('aria-label','和'+plan.npc[0]+'交谈');b.onclick=()=>{districtDialog=0;talkToNPC()};world.appendChild(b)}}
 function genLayout(id){return world=>{genEnsure(world,id);const L=DAYMAP[id],used=new Set(L.block||[]);let sp=0;
  const put=(b,[x,y])=>{b.style.left=(x/16*100).toFixed(3)+'%';b.style.top=(y/11*100).toFixed(3)+'%';used.add(Math.floor(x)+','+Math.floor(y))};
  const later=[];
  world.querySelectorAll('.street-hot,.district-hit,.photo-pin').forEach(b=>{if(b.id==='district-player')return;
   const lab=(b.getAttribute('aria-label')||'').replace(/^(进入|调查|访问|重访)/,'');
   if(GEN_HIDE.has(b.dataset.spot)||(L.hideSpots||[]).includes(b.dataset.spot)||(HIDE.has(lab)&&!b.dataset.genFac)){b.style.display='none';return}
   if(b.dataset.genAt){put(b,b.dataset.genAt.split(',').map(Number));return}
   later.push(b)});
  later.forEach(b=>{while(sp<L.spare.length&&used.has(L.spare[sp].map(Math.floor).join(',')))sp++;if(sp<L.spare.length){const p=L.spare[sp++];put(b,p);b.dataset.genAt=p.join(',')}})}}
 window.GEN_STATIONS={};
 for(const type in GEN_ASSIGN){const S=GEN_SPEC[type];if(!S||!ST_ART['gen_'+type])continue; // 哪种没有图就先跳过
  const SX=S.shiftX||{},F=S.feet||{};
  const rows=Array.from({length:11},(_,y)=>{const a=Array(16).fill('#');(S.walk[y]||[]).forEach(x=>a[x]='.');return a.join('')});
  const shiftY={};for(let y=0;y<11;y++)shiftY[y]=Math.round((F[y]??.5)*32)-29; // 脚（精灵的第 29px）落在格内这个高度
  const spare=(S.spare||[]).filter(([x,y])=>rows[y][x]==='.').map(([x,y])=>[+(x+.5+(SX[x]||0)/32).toFixed(3),+(y+Math.min(.8,Math.max(.3,F[y]??.5))).toFixed(3)]);
  for(const id of GEN_ASSIGN[type]){const st=byId[id];if(!st||ST_MAPS[id])continue;
   ST_ART[id]=ST_ART['gen_'+type];window.GEN_STATIONS[id]=type;
   const gd=S.guide,plan=makeDistrictPlan(st);
   const npcs=gd?[{x:gd[0],y:gd[1],name:(plan.npc&&plan.npc[0])||'街区向导',look:gd[2],mk:'gen-guide'}]:[];
   const doors={},zones={};
   for(const k in S.doors)doors[k]=genDoor(S.doors[k],st);
   {const chipped=new Set();for(const k in doors){const d=doors[k];if(d.nochip)continue;if(chipped.has(d.label))d.nochip=true;else chipped.add(d.label)}} // 同一个名字牌只挂一次
   /* 被门替代的原点位、门已经提供的设施：不再单独做标记 */
   const hideSpots=(S.hideSpots||[]).concat(Object.values(S.doors).filter(v=>/^spot\|/.test(v)).map(v=>v.split('|')[1]));
   const facCovered=[...new Set(Object.values(doors).filter(d=>d.act==='facility').map(d=>d.f))];
   DAYMAP[id]={pos:{},npcs:[],spare,block:npcs.map(n=>n.x+','+n.y),hideSpots,facCovered};
   for(const k in (S.zones||{})){const lab=S.zones[k];zones[k]=Z(lab,lab+'。这边的出口今天先不开放。',lab+'。路灯一直亮到很远，这边的出口今天先不开放。')}
   for(const k in (S.looks||{})){const [lab,dt,nt]=S.looks[k];zones[k]=Z(lab,dt,nt)}
   ST_MAPS[id]={name:st.jp+'駅 · '+S.name,short:st.jp,gen:type,oy:0,shiftX:S.shiftX,shiftY,fg:S.fg,
    intro:st.jp+'駅。'+S.intro,rows,spawn:{x:S.spawn[0],y:S.spawn[1]},npcs,layout:genLayout(id),doors,zones};
  }}

 /* ========== 白天调查画面（DAYINV）：北品川、五反田也画定稿图 ========== */
 window.DAY_POS={};for(const id in DAYMAP)window.DAY_POS[id]=DAYMAP[id].pos;
 const walkT=(id,x,y)=>x>=0&&y>=0&&x<16&&y<11&&ST_MAPS[id].rows[y][x]==='.';
 window.DAY_SNAP={};window.DAY_ART={};
 for(const id in DAYMAP){
  window.DAY_SNAP[id]=function(from,x,y){let tx=Math.floor(x/100*16),ty=Math.floor(y/100*11);
   if(!walkT(id,tx,ty)){let best=null,bd=1e9;for(let yy=0;yy<11;yy++)for(let xx=0;xx<16;xx++)if(walkT(id,xx,yy)&&!DAYMAP[id].npcs.some(n=>n.x===xx&&n.y===yy)){const d=(xx+.5-x/100*16)**2+(yy+.5-y/100*11)**2;if(d<bd){bd=d;best=[xx,yy]}}if(!best)return {x,y};[tx,ty]=best}
   return {x:+((tx+.5)/16*100).toFixed(3),y:+((ty+.5)/11*100).toFixed(3)}};
  const cache={};let last=null;
  const img=src=>{if(!cache[src]){const im=new Image();im.onload=()=>{if(last)window.DAY_ART[id](...last)};im.src=src;cache[src]=im}const im=cache[src];return im.complete&&im.naturalWidth?im:null};
  window.DAY_ART[id]=function(canvas,objects,pos){last=[canvas,objects,pos];const N=!!(window.EXPLORE&&EXPLORE.night());const a=ST_ART[id],im=img(N?a.dusk:a.day);if(!im)return false;
   const g=canvas.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(im,0,0,512,352);
   const sc=(window.GAME_CONFIG&&GAME_CONFIG.v51View&&GAME_CONFIG.v51View.walk&&GAME_CONFIG.v51View.walk.tileDistrict)||.65;
   const fig=(X,Y,pal,d)=>{g.fillStyle='rgba(0,0,0,.32)';g.beginPath();g.ellipse(X+16,Y+29,6,2,0,0,7);g.fill();if(typeof v51PlayerSprite==='function')v51PlayerSprite(g,X,Y,sc,(x,y)=>H18.pixelPerson(g,x,y,pal,d));else H18.pixelPerson(g,X,Y,pal,d)};
   const keys=new Set((objects||[]).map(o=>o[0]));const list=[],OY=ST_MAPS[id].oy||0,SYf=r=>((ST_MAPS[id].shiftY||{})[r]||0);
   if(window.H18&&H18.pixelPerson){
    DAYMAP[id].npcs.filter(n=>keys.has(n.mk)).forEach(n=>list.push({k:n.y,f:()=>fig(n.x*32,n.y*32+OY+SYf(n.y),{look:n.look},'down')}));
    if(pos){const q=window.DAY_SNAP[id](null,pos.x,pos.y);pos.x=q.x;pos.y=q.y;const X=Math.round(pos.x*5.12-16),Y=Math.round(pos.y*3.52-16)+OY+SYf(Math.floor(pos.y/100*11));
     list.push({k:Y/32+.5,f:()=>{g.strokeStyle='rgba(111,194,166,.9)';g.lineWidth=2;g.beginPath();g.ellipse(X+16,Y+29,8,2.6,0,0,7);g.stroke();fig(X,Y,null,'down')}})}
    list.sort((p,q)=>p.k-q.k).forEach(o=>o.f())}
   const v=g.createRadialGradient(256,176,176*.45,256,176,512*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=v;g.fillRect(0,0,512,352);return true};
 }
}

const STV8=(function(){
 const T=32,MW=16,MH=11;
 const WALK=new Set(['.',',','R']);
 const SOLID=new Set(['S','#','H','F','U','D','G','P','V']);
 let on=false,map=null,mapId=null,px=7,py=2,dir='down',phase='day',tick=0,timer=null,path=[],legacy=false,sub=null,retPos=null;
 function rows(){return map.rows}
 function chAt(x,y){if(x<0||y<0||x>=MW||y>=MH)return '#';return rows()[y][x]}
 function npcAt(x,y){return (map.npcs||[]).find(n=>n.x===x&&n.y===y)}
 function say(html){const box=document.getElementById('district-chat');if(box)box.innerHTML=html}
 function panel(title,text){say('<strong>'+title+'</strong><p>'+text+'</p>')}
 function doorAt(x,y){return map.doors[x+','+y]}
 function zoneAt(x,y){return map.zones&&map.zones[x+','+y]}
 function chatBtn(label,fn,primary){const box=document.getElementById('district-chat');if(!box)return;const b=document.createElement('button');b.className='rpg-action'+(primary?' primary':'');b.textContent=label;b.onclick=fn;box.appendChild(b)}
 function quiz(id){if(typeof start==='function'){unmount();start(id)}else panel('📚 日语答题','（试玩版里答题系统未接入）')}
 function exploreKonan(){let ok=false;try{ok=!!(window.EXPLORE&&typeof EXPLORE.open==='function')}catch(e){}if(ok){unmount();let r;try{r=EXPLORE.open('shinagawa')}catch(e){r=false}if(r===false){mount(true);panel('🔦 港南口','探索暂时没有开启——可能与时间或主线进度有关。')}}else panel('🔦 港南口','（试玩版里探索系统未接入）')}
 function actDoor(d){if(!d)return;
  if(d.act==='gate'){panel('🚉 改札','车站・交通——旧街区点位：改札。');chatBtn('📚 车站答题：交通',()=>quiz('train'));chatBtn('回东京地图',()=>{unmount();if(typeof tokyoHome==='function')tokyoHome()},true);return}
  if(d.act==='hotel'){panel('🏨 '+d.label,'港屋酒店——你住的地方。');chatBtn('回到港屋酒店',()=>{unmount();if(typeof toHotel==='function')toHotel()},true);return}
  if(d.act==='drug'){if(typeof openFacility==='function')openFacility('potion','薬局');let sid='conv',sn='駅前の店';try{if(typeof district!=='undefined'&&district&&district.sid)sid=district.sid;if(typeof sc==='function'&&sc(sid)&&sc(sid).n)sn=sc(sid).n}catch(e){}chatBtn('📚 駅前の店・答题：'+sn,()=>quiz(sid));return}
  if(d.act==='vending'){if(typeof openVending==='function')openVending(mapId);return}
  if(d.act==='konbini'){panel('🏪 商店街','购物・便利店——旧街区点位：商店街。');chatBtn('📚 答题：购物・便利店',()=>quiz('conv'));return}
  if(d.act==='info'){panel('ℹ️ 案内所','问路・应急——港南口周边图：出站左手便利店、右手药局；过马路是酒店和商店街；小巷里有书店和彩票站；东边沿运河有步道。');chatBtn('📚 答题：问路・应急',()=>quiz('help'));return}
  if(d.act==='enter'){const m=ST_MAPS[d.to];panel('⛩ '+d.label,d.text||'');if(m)chatBtn('⛩ 进入'+(m.short||m.name),()=>enterSub(d.to),true);if(d.q)chatBtn('📚 答题：'+d.label,()=>quiz(d.q));return}
  if(d.act==='call'){panel((d.icon||'▶')+' '+d.label,d.text||'');(d.btns||[]).forEach((b,i)=>chatBtn(b[0],()=>callAct(b[1]),i===0));return}
  if(d.act==='quiz'){panel('📚 '+d.label,d.text||'');chatBtn('📚 答题：'+d.label,()=>quiz(d.q),true);return}
  if(d.act==='facility'){if(typeof openFacility==='function')openFacility(d.f,d.label);return}
  panel('▶ '+d.label,d.text||'')}
 function tryMove(dx,dy){dir=dx<0?'left':dx>0?'right':dy<0?'up':'down';const nx=px+dx,ny=py+dy;const ch=chAt(nx,ny);const npc=npcAt(nx,ny);if(npc){talk(npc);return}const d=doorAt(nx,ny);if(d){actDoor(d);return}if(WALK.has(ch)){px=nx;py=ny;if(sub){sub.x=px;sub.y=py}const z=zoneAt(px,py);if(z&&z.exit){exitSub();return}if(z&&z.go){enterSub(z.go,z.at);return}if(z&&z.run){render();z.run();return}if(z){panel('📍 '+z.label,z.text);if(z.enter&&ST_MAPS[z.enter])chatBtn('⛩ 进入'+(ST_MAPS[z.enter].short||ST_MAPS[z.enter].name),()=>enterSub(z.enter),true);if(px===13&&py===8)chatBtn('🔦 探索：港南口 · 运河沿岸的小路',exploreKonan,true)}render()}else render()}
 function talk(n){if(n.mk){n.dir={left:'right',right:'left',up:'down',down:'up'}[dir]||'down';render();const b=document.querySelector('#district-world [data-street-object="'+n.mk+'"]');if(b){allowMk=b;try{b.click()}finally{allowMk=null}}return}n.dir={left:'right',right:'left',up:'down',down:'up'}[dir]||'down';render();if(n.act==='agent'){panel('🕯️ '+n.name,(n.lines||['……'])[0]);chatBtn('🕯️ 向她打听消息',()=>{if(typeof openFacility==='function')openFacility('npc',n.name)});return}
  if(n.act==='facility'){panel('💬 '+n.name,(n.lines||['……'])[0]);chatBtn(n.fLabel||'打声招呼',()=>{if(typeof openFacility==='function')openFacility(n.f,n.name)},true);return}
  if(n.cycle){const lines=n.lines;n.i=n.i||0;const idx=n.i%lines.length;panel('💬 '+n.name,lines[idx]);chatBtn(idx===lines.length-1?'再次对话':'继续对话 ▶',()=>{n.i++;talk(n)});return}const lines=n.lines||['……'];panel('🧑 '+n.name,lines[Math.floor(Math.random()*lines.length)])}
 function bfs(tx,ty){if(tx===px&&ty===py)return[];const key=(x,y)=>x+','+y;const prev={[key(px,py)]:null};const q=[[px,py]];while(q.length){const[x,y]=q.shift();if(x===tx&&y===ty)break;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(k in prev)continue;if(!WALK.has(chAt(nx,ny)))continue;if(npcAt(nx,ny))continue;prev[k]=[x,y];q.push([nx,ny])}}if(!(key(tx,ty) in prev))return null;const out=[];let cur=[tx,ty];while(cur){out.unshift(cur);cur=prev[key(cur[0],cur[1])]}out.shift();return out}
 function stepPath(){if(!path.length){timer=null;const f=pathThen;pathThen=null;if(f&&on)f();return}const[x,y]=path.shift();tryMove(x-px,y-py);timer=setTimeout(stepPath,120)}
 /* v56 点击寻路：点到建筑 / 店门 / 人 / 地图标记也会走过去。目标走不进去时，走到它旁边（店门、人：走到后自动触发）；纯建筑：走到能到达的最近一格 */
 let pathThen=null,allowMk=null;
 const NB=[[1,0],[-1,0],[0,1],[0,-1]];
 const free=(x,y)=>WALK.has(chAt(x,y))&&!npcAt(x,y)&&!doorAt(x,y);
 function route(goals){const key=(x,y)=>x+','+y,G=new Set(goals.map(([x,y])=>key(x,y)));if(G.has(key(px,py)))return[];const prev={[key(px,py)]:null},q=[[px,py]];
  while(q.length){const[x,y]=q.shift();for(const[dx,dy]of NB){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(k in prev||!free(nx,ny))continue;prev[k]=[x,y];if(G.has(k)){const out=[];let cur=[nx,ny];while(cur){out.unshift(cur);cur=prev[key(cur[0],cur[1])]}out.shift();return out}q.push([nx,ny])}}return null}
 function nearest(tx,ty){const key=(x,y)=>x+','+y,seen=new Set([key(px,py)]),q=[[px,py]];let best=[px,py],bd=Math.abs(px-tx)+Math.abs(py-ty);
  while(q.length){const[x,y]=q.shift();for(const[dx,dy]of NB){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seen.has(k)||!free(nx,ny))continue;seen.add(k);const d=Math.abs(nx-tx)+Math.abs(ny-ty);if(d<bd){bd=d;best=[nx,ny]}q.push([nx,ny])}}return best}
 function go(p,then){if(timer){clearTimeout(timer);timer=null}if(!p){path=[];pathThen=null;if(window.UI&&UI.toast)UI.toast('那里走不过去。');return}path=p;pathThen=then||null;stepPath()}
 function goTile(tx,ty){if(!on)return;tx=Math.max(0,Math.min(MW-1,tx));ty=Math.max(0,Math.min(MH-1,ty));
  const d=doorAt(tx,ty),n=npcAt(tx,ty);
  if(d||n){if(Math.abs(tx-px)+Math.abs(ty-py)===1){tryMove(tx-px,ty-py);return}
   const adj=NB.map(([dx,dy])=>[tx+dx,ty+dy]).filter(([x,y])=>free(x,y));go(route(adj),()=>{if(Math.abs(tx-px)+Math.abs(ty-py)===1)tryMove(tx-px,ty-py)});return}
  if(WALK.has(chAt(tx,ty))){go(route([[tx,ty]]));return}
  const t=nearest(tx,ty);if(t[0]===px&&t[1]===py){render();return}go(route([t]))}
 function goMarker(b){const tx=Math.max(0,Math.min(MW-1,Math.floor(parseFloat(b.style.left)/100*MW))),ty=Math.max(0,Math.min(MH-1,Math.floor(parseFloat(b.style.top)/100*MH)));
  const fire=()=>{allowMk=b;try{b.click()}finally{allowMk=null}};
  if(Math.abs(tx-px)+Math.abs(ty-py)<=1)return false;
  const goals=[[tx,ty],...NB.map(([dx,dy])=>[tx+dx,ty+dy])].filter(([x,y])=>free(x,y));const p=goals.length?route(goals):null;
  if(p)go(p,fire);else{const t=nearest(tx,ty);go(route([t]),fire)}return true}
 function facingThing(){const f={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[dir]||[0,1];const order=[f,...NB.filter(v=>v[0]!==f[0]||v[1]!==f[1])];
  for(const[dx,dy]of order){const x=px+dx,y=py+dy,d=doorAt(x,y),n=npcAt(x,y);if(n)return{dx,dy,label:n.name};if(d)return{dx,dy,label:d.label};const mk=mkAt(x,y);if(mk)return{dx,dy,label:(mk.getAttribute('aria-label')||mk.textContent||'').replace(/\s+/g,' ').trim(),mk}}return null}
 function mkAt(x,y){const w=document.getElementById('district-world');if(!w)return null;return [...w.querySelectorAll('.street-hot,.district-hit,.photo-pin')].find(b=>b.id!=='district-player'&&b.style.left&&b.offsetParent!==null&&Math.floor(parseFloat(b.style.left)/100*MW)===x&&Math.floor(parseFloat(b.style.top)/100*MH)===y)||null}
 function interact(){if(!on)return;const t=facingThing();if(!t)return;if(t.mk){dir=t.dx<0?'left':t.dx>0?'right':t.dy<0?'up':'down';render();allowMk=t.mk;try{t.mk.click()}finally{allowMk=null}return}tryMove(t.dx,t.dy)}
 function hint(){const w=document.getElementById('district-world');if(!w||!on)return;let el=w.querySelector('#district-hint');if(!el){el=document.createElement('div');el.id='district-hint';el.className='district-hint';w.appendChild(el)}const t=facingThing();el.textContent=t?'A：'+t.label:'WASD / 点击地图移动 · 走到人或店铺旁边按 A';el.classList.toggle('on',!!t)}
 function drawTile(c,ch,x,y){const X=x*T,Y=y*T;const dusk=phase==='dusk';
  const win=(lx,ly,col)=>{c.fillStyle=col;c.fillRect(X+lx,Y+ly,5,4)};
  if(ch==='#'||ch==='H'){c.fillStyle=ch==='H'?'#46586e':'#3d4753';c.fillRect(X,Y,T,T);c.fillStyle=ch==='H'?'#5a7089':'#525f6e';c.fillRect(X,Y,T,7);for(let i=0;i<3;i++)for(let j=0;j<2;j++){const lit=((x*7+y*13+i*3+j)>4);win(4+i*10,12+j*11,dusk?(lit?'#ffb45e':'#202b3a'):(lit?'#7e93a8':'#2c3947'))}if(ch==='H'&&x===10){c.fillStyle=dusk?'#ff8c3a':'#8a97a5';c.font='bold 9px sans-serif';c.fillText('H',X+12,Y+11);c.fillText('O',X+12,Y+20);c.fillText('T',X+12,Y+29)}return}
  if(ch==='S'){c.fillStyle='#2f3947';c.fillRect(X,Y,T,T);c.fillStyle='#4a5866';c.fillRect(X,Y+22,T,10);c.fillStyle=dusk?'#ffd489':'#9fb2c1';c.fillRect(X+3,Y+25,26,3);return}
  if(ch==='R'){c.fillStyle='#39424e';c.fillRect(X,Y,T,T);c.fillStyle='#2e3640';c.fillRect(X,Y,2,T);if(y===5){c.fillStyle='#c8cfd6';for(let i=0;i<2;i++)c.fillRect(X+4+i*16,Y+29,9,2)}if(y===6){c.fillStyle='#8f9aa4';c.fillRect(X,Y,32,2)}return}
  if(ch===','){c.fillStyle='#77868f';c.fillRect(X,Y,T,T);c.fillStyle='#6b7a83';c.fillRect(X,Y,32,1);c.fillRect(X,Y,1,32);c.fillStyle='#7f8f98';c.fillRect(X+2,Y+2,28,28);return}
  if(ch==='.'){c.fillStyle='#5d6a73';c.fillRect(X,Y,T,T);c.fillStyle='#55626b';c.fillRect(X+1,Y+15,30,1);return}
  if(ch==='F'){c.fillStyle='#4c5a63';c.fillRect(X,Y,T,T);c.fillStyle='#232a31';c.fillRect(X+13,Y,6,32);c.fillStyle='#39434b';c.fillRect(X,Y+6,32,3);c.fillRect(X,Y+20,32,3);return}
  if(ch==='U'){c.fillStyle='#141f2b';c.fillRect(X,Y,T,T);c.fillStyle='#22384e';const off=(tick+x+y)%3;c.fillRect(X+3+off*4,Y+8,14,2);c.fillRect(X+12,Y+20,16,2);if(dusk){c.fillStyle='#6e5636';c.fillRect(X+6,Y+14,10,1)}return}
  if(ch==='G'){c.fillStyle='#1d242e';c.fillRect(X,Y,T,T);c.fillStyle=dusk?'#ffd489':'#cfd9e0';c.fillRect(X+2,Y+2,28,4);c.fillStyle='#39434e';for(let i=0;i<3;i++)c.fillRect(X+6+i*9,Y+10,3,22);return}
  if(ch==='D'){c.fillStyle='#3d4753';c.fillRect(X,Y,T,T);c.fillStyle='#6e4f35';c.fillRect(X+9,Y+10,14,22);c.fillStyle=dusk?'#ffc46b':'#aeb9c2';c.fillRect(X+11,Y+13,10,7);c.fillStyle='#222a33';c.fillRect(X+20,Y+22,2,2);return}
  if(ch==='P'){c.fillStyle='#77868f';c.fillRect(X,Y,T,T);c.fillStyle='#7a4b2a';c.fillRect(X+5,Y+6,22,22);c.fillStyle='#e8e2d2';c.fillRect(X+8,Y+9,16,10);c.fillStyle='#28418c';c.fillRect(X+14,Y+10,4,8);return}
  if(ch==='V'){c.fillStyle='#77868f';c.fillRect(X,Y,T,T);c.fillStyle='#b03a34';c.fillRect(X+8,Y+3,16,27);c.fillStyle=dusk?'#ffe9a8':'#dfe7ec';c.fillRect(X+11,Y+6,10,12);c.fillStyle='#5d1712';c.fillRect(X+11,Y+21,10,3);return}
  c.fillStyle='#5d6a73';c.fillRect(X,Y,T,T)}
 function drawChar(c,x,y,shirt,guide){const X=x*T,Y=y*T;if(guide===false){c.strokeStyle='rgba(111,194,166,.9)';c.lineWidth=2;c.beginPath();c.ellipse(X+16,Y+24,9,3.5,0,0,7);c.stroke()}c.fillStyle='rgba(0,0,0,.3)';c.fillRect(X+11,Y+22,10,3);c.fillStyle='#22242c';c.fillRect(X+13,Y+16,2,6);c.fillRect(X+17,Y+16,2,6);c.fillStyle=shirt;c.fillRect(X+12,Y+9,8,7);c.fillStyle='#f0c9a0';c.fillRect(X+13,Y+3,6,6);c.fillStyle=guide?'#7a4b2a':'#2c2c34';c.fillRect(X+13,Y+3,6,2)}
 function chip(c,text,x,y){c.font='bold 10px sans-serif';const w=c.measureText(text).width+8;c.fillStyle='rgba(16,22,34,.88)';c.fillRect(x-w/2,y-9,w,13);c.fillStyle='#f6e7ad';c.textAlign='center';c.fillText(text,x,y+2);c.textAlign='left'}
 let imgCache={};
 function artImg(){const a=(typeof ST_ART!=='undefined')&&ST_ART[mapId];if(!a)return null;const src=phase==='dusk'?(a.dusk||a.day):phase==='morning'?(a.morning||a.day):a.day;if(!imgCache[src]){const im=new Image();im.src=src;im.onload=()=>render();imgCache[src]=im}const im=imgCache[src];return(im.complete&&im.naturalWidth>0)?im:null}
 function stv8Canvas(){const w=document.getElementById('district-world');return (w&&w.querySelector('canvas.stv8-canvas'))||null}
 let stv8Obs=null;
 function adopt(world){if(stv8Obs)stv8Obs.disconnect();const fix=()=>{if(!on)return;const mine=world.querySelector('canvas.stv8-canvas');if(!mine)return;world.querySelectorAll(':scope > canvas#street-canvas').forEach(c=>{if(c!==mine)c.remove()});if(map&&map.layout&&!sub)try{map.layout(world)}catch(e){}if(world.firstElementChild!==mine)world.prepend(mine);render()};stv8Obs=new MutationObserver(fix);stv8Obs.observe(world,{childList:true});fix()}
 function render(){const cv=stv8Canvas();if(!cv)return;ST_PHASE=phase;try{hint()}catch(e){}const c=cv.getContext('2d');tick++;const art=artImg();
  if(art){c.drawImage(art,0,0,MW*T,MH*T)}else{for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)drawTile(c,chAt(x,y),x,y);
  if(mapId==='shinagawa'){c.fillStyle='#1d2733';c.fillRect(6*T,0,3*T,15);c.fillStyle='#7fb0e0';c.fillRect(6*T,0,3*T,15);c.fillStyle='#fff';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('品川駅',7.5*T,12);c.textAlign='left'}}
  for(const k in map.doors){if(map.doors[k].nochip)continue;const[a,b]=k.split(',').map(Number);chip(c,map.doors[k].label,a*T+16,b*T+2)}
  for(const k in (map.zones||{})){if(map.zones[k].nochip)continue;const[a,b]=k.split(',').map(Number);chip(c,map.zones[k].label,a*T+16,b*T+2)}
  const ppl=window.H18&&H18.pixelPerson&&window.SPRITE2;
  if(ppl){
   /* 手绘底图的街区（品川、浅草）比例比车站街区小：主角和路人统一缩到 0.65（可用 v51View.walk.tileDistrict 改），脚下加一圈软阴影贴住地面 */
   const sc=(window.GAME_CONFIG&&GAME_CONFIG.v51View&&GAME_CONFIG.v51View.walk&&GAME_CONFIG.v51View.walk.tileDistrict)||.65;
   const foot=(X,Y)=>{c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(X+16,Y+29,6,2,0,0,7);c.fill()};
   const fig=(X,Y,pal,d)=>{foot(X,Y);if(typeof v51PlayerSprite==='function')v51PlayerSprite(c,X,Y,sc,(x,y)=>H18.pixelPerson(c,x,y,pal,d));else H18.pixelPerson(c,X,Y,pal,d)};
   /* 透视：map.shiftX 让某一列的人站到画面里那条路的中线上；map.fg 是画面里「立在前面」的东西（门、树、楼、桥），
      人站在它后面（脚比它的底边靠上）时，把底图的这一块按轮廓重画一遍盖住人；主角被盖住时再叠一个半透明的身影 */
   const SX=map.shiftX||{},SY=map.shiftY||{},art=artImg(); /* v73 SY：按行调整脚的高度（通用车站图） */
   const pal0={h:'#4a3937',s:'#dbb590',b:'#7f6e79',a:'#b4a185',p:'#3c4659',k:'#222'};
   const list=(map.npcs||[]).map(n=>({k:n.y+.99,f:()=>fig(n.x*T+(SX[n.x]||0),n.y*T+(map.oy||0)+(SY[n.y]||0),n.look?{look:n.look}:(n.pal||pal0),n.dir||'down')}));
   const PX=px*T+(SX[px]||0),PY=py*T+(map.oy||0)+(SY[py]||0),pb=[PX+6,PY+4,PX+26,PY+32];let hid=false;
   list.push({k:py+.99,f:()=>{c.strokeStyle='rgba(111,194,166,.9)';c.lineWidth=2;c.beginPath();c.ellipse(PX+16,PY+29,8,2.6,0,0,7);c.stroke();fig(PX,PY,null,dir)}});
   if(art)for(const o of (map.fg||[]))list.push({k:o.z,f:()=>{const P=o.p.map(([x,y])=>[x*T,y*T]);c.save();c.beginPath();P.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(art,0,0,MW*T,MH*T);c.restore();
    if(o.z>py+.99){const xs=P.map(q=>q[0]),ys=P.map(q=>q[1]);if(Math.min(...xs)<pb[2]&&Math.max(...xs)>pb[0]&&Math.min(...ys)<pb[3]&&Math.max(...ys)>pb[1])hid=true}}});
   list.sort((a,b)=>a.k-b.k).forEach(o=>o.f());
   if(hid){c.save();c.globalAlpha=.42;fig(PX,PY,null,dir);c.restore()}
   for(const k in map.doors){if(map.doors[k].nochip)continue;const[a,b]=k.split(',').map(Number);chip(c,map.doors[k].label,a*T+16,b*T+2)}
   for(const k in (map.zones||{})){if(map.zones[k].nochip)continue;const[a,b]=k.split(',').map(Number);chip(c,map.zones[k].label,a*T+16,b*T+2)} // 标签最后画，不被前景盖住
  }else{for(const n of (map.npcs||[]))drawChar(c,n.x,n.y,'#7d6a4f',true);drawChar(c,px,py,'#6fc2a6',false)}
  if(phase==='dusk'&&!art){c.fillStyle='rgba(24,32,72,.22)';c.fillRect(0,0,MW*T,MH*T)}}
 function bindKeys(){if(STV8._kb)return;STV8._kb=true;document.addEventListener('keydown',e=>{if(!on)return;const tag=(e.target&&e.target.tagName)||'';if(tag==='INPUT'||tag==='TEXTAREA')return;const k=e.key;const mv={'ArrowUp':[0,-1],'ArrowDown':[0,1],'ArrowLeft':[-1,0],'ArrowRight':[1,0],'w':[0,-1],'s':[0,1],'a':[-1,0],'d':[1,0]}[k];if(mv){e.preventDefault();path=[];pathThen=null;tryMove(mv[0],mv[1])}})}
 function mount(force){const world=document.getElementById('district-world');if(!world)return false;if(!force){if(legacy)return false;if(typeof district==='undefined'||!district||!ST_MAPS[district.id]){unmount();return false}}
  if(sub&&!(typeof district!=='undefined'&&district&&sub.parent===district.id&&ST_MAPS[sub.id]))sub=null;
  mapId=sub?sub.id:(ST_MAPS[district.id]?district.id:'shinagawa');map=ST_MAPS[mapId];px=sub?sub.x:retPos?retPos.x:map.spawn.x;py=sub?sub.y:retPos?retPos.y:map.spawn.y;const _ret=retPos;retPos=null;on=true;map.npcs.forEach(n=>{if(n.cycle)n.i=0});
  const _a=(typeof ST_ART!=='undefined')&&ST_ART[mapId];phase='day';try{const _h=TM.now()/60;if(_h>=18||_h<5)phase='dusk';else if(_a&&_a.morning&&_h>=5&&_h<10)phase='morning'}catch(e){}
  world.innerHTML='<canvas id="street-canvas" class="stv8-canvas" width="512" height="352" style="width:100%;height:100%;display:block;image-rendering:pixelated"></canvas>'
   +'<div style="position:absolute;top:6px;left:6px;display:'+(/dev=1/.test(location.hash)?'flex':'none')+';gap:6px;z-index:5"><button class="rpg-action" id="street-phase">🌇 切换时段</button><button class="rpg-action" id="street-legacy">旧版街区图</button></div>'
   +'<div class="stv8-pad" style="position:absolute;bottom:6px;right:6px;display:grid;grid-template-columns:repeat(3,34px);gap:3px;z-index:5"><span></span><button class="rpg-action" data-stmv="0,-1">↑</button><button class="rpg-action stv8-a" data-sta="1" aria-label="调查/交谈">A</button><button class="rpg-action" data-stmv="-1,0">←</button><button class="rpg-action" data-stmv="0,1">↓</button><button class="rpg-action" data-stmv="1,0">→</button></div>';
  const ph=document.getElementById('street-phase');if(ph){const _slots=['day'].concat(_a&&_a.morning?['morning']:[]).concat(['dusk']);const _lbl={day:'☀️ 白天',morning:'🌅 清晨',dusk:'🌙 夜晚'};const _setLbl=()=>{ph.textContent='切到 '+_lbl[_slots[(_slots.indexOf(phase)+1)%_slots.length]]};_setLbl();ph.onclick=()=>{phase=_slots[(_slots.indexOf(phase)+1)%_slots.length];_setLbl();render()}};
  const lg=document.getElementById('street-legacy');if(lg)lg.onclick=()=>{legacy=true;unmount();if(typeof renderDistrict==='function')renderDistrict()};
  {const ab=world.querySelector('[data-sta]');if(ab)ab.onclick=()=>interact()}world.querySelectorAll('[data-stmv]').forEach(b=>b.onclick=()=>{const[a,bb]=b.getAttribute('data-stmv').split(',').map(Number);path=[];pathThen=null;tryMove(a,bb)});
  /* 次级地图里隐藏只属于主街区的浮动按钮（拍照点、御神签标记、打工），只用样式隐藏、不删除 */
  if(!document.getElementById('stv8-sub-css')){const st=document.createElement('style');st.id='stv8-sub-css';st.textContent='.stv8-sub>.photo-pin,.stv8-sub>.street-hot,.stv8-sub>.et-work-float{display:none!important}';document.head.appendChild(st)}
  world.classList.toggle('stv8-sub',!!sub);if(sub||(_ret&&_ret.text))setTimeout(()=>{if(on)panel('📍 '+map.name,sub?(map.intro||''):_ret.text)},0);
  const cv=stv8Canvas();adopt(world);cv.onclick=e=>{e.stopPropagation();const r=cv.getBoundingClientRect();const tx=Math.floor((e.clientX-r.left)/r.width*MW),ty=Math.floor((e.clientY-r.top)/r.height*MH);if(tx===px&&ty===py){interact();return}goTile(tx,ty)};
  /* 地图上的 DOM 标记（浅草寺·御神签、拍照点、设施等）：先让画面里的主角走过去，再触发；旧的格子行走（STATION_WALK）在这里不再接管 */
  world.addEventListener('click',e=>{if(!on)return;const b=e.target.closest('.street-hot,.district-hit,.photo-pin');if(!b||b===allowMk||!b.style.left||b.closest('.stv8-sub'))return;if(goMarker(b)){e.preventDefault();e.stopImmediatePropagation()}},true);
  bindKeys();render();panel('📍 '+map.name,_ret&&_ret.text?_ret.text:map.intro||'出站口就在身后。用方向键 / WASD / 点按移动；走到门口或人旁边就会触发。');return true}
 /* 次级地图（如浅草寺境内）：sub 记住所在子地图和位置；从求签/参拜/净化画面回到街区时 renderDistrict→mount 会回到这里；换街区（enterDistrict）时清掉 */
 function enterSub(id,at){if(!ST_MAPS[id]||typeof district==='undefined'||!district)return;const m=ST_MAPS[id];sub={id,parent:district.id,x:at?at[0]:m.spawn.x,y:at?at[1]:m.spawn.y};path=[];pathThen=null;if(timer){clearTimeout(timer);timer=null}redraw()}
 function exitSub(){const m=map;sub=null;retPos=(m&&m.exitTo)||null;path=[];pathThen=null;if(timer){clearTimeout(timer);timer=null}redraw()}
 function redraw(){if(typeof renderDistrict==='function'){renderDistrict();window.scrollTo(0,0);const cv=stv8Canvas();if(cv&&cv.scrollIntoView)cv.scrollIntoView({block:'nearest'})}else mount(true)}
 function callAct(k){if(String(k).startsWith('fn:')){const f=(window.MJ_FN&&MJ_FN[k.slice(3)])||(window.SB_FN&&SB_FN[k.slice(3)]);if(f)f();return}if(k==='prayer'){if(window.PRAYER)PRAYER.open();return}if(k==='omikuji'){if(window.OMI)OMI.open();return}if(k==='goma'){if(window.PURGE)PURGE.open('temple',()=>{});return}if(String(k).startsWith('quiz:')){quiz(k.slice(5));return}}
 function unmount(){on=false;path=[];pathThen=null;if(timer){clearTimeout(timer);timer=null}if(stv8Obs){stv8Obs.disconnect();stv8Obs=null}}
 return {setRet:(x,y)=>{retPos={x,y}},mount,unmount,active:()=>on&&!!stv8Canvas(),move:(dx,dy)=>{if(!on)return;path=[];pathThen=null;if(timer){clearTimeout(timer);timer=null}tryMove(Math.sign(dx),dx?0:Math.sign(dy))},interact,hint,reset:()=>{legacy=false},enterSub,exitSub,leave:(id)=>{sub=null;retPos=null;const m=id&&ST_MAPS[id];if(m&&m.arrive&&ST_MAPS[m.arrive]){const a=ST_MAPS[m.arrive];sub={id:m.arrive,parent:id,x:a.spawn.x,y:a.spawn.y}}},sub:()=>sub&&sub.id,pos:()=>[px,py,mapId],_kb:false};
})();
window.STV8=STV8;
{const _stvEnter=enterDistrict;enterDistrict=function(id){try{STV8.leave(id)}catch(e){}return _stvEnter.apply(this,arguments)}}
/*STREET-END*/
function openFacility(type,name){if(!campaign){facilityMessage('需要先创建角色');return}
 let box=document.getElementById('district-chat');if(!box)return;recoveryDefaults();let d=campaign.day;if(type==='vending'){openVending((typeof district!=='undefined'&&district&&district.id)||'street');return}
 const RC=GAME_CONFIG.recovery;let info={sleep:['+'+RC.sleep.san+' SAN · 免费 · 每天一次',campaign.restDay===d],shrine:['+'+RC.shrine.san+' SAN · '+RC.shrine.cost+'円 · 每天一次',campaign.shrineDay===d||campaign.cash<RC.shrine.cost],potion:['+'+RC.potion.san+' SAN · '+RC.potion.cost+'円 · 可重复购买',campaign.cash<RC.potion.cost],sento:['♨️ 压力 '+GAME_CONFIG.recovery.bathSento.stress+' · 疲劳点 +'+GAME_CONFIG.recovery.bathSento.hp+' · '+GAME_CONFIG.recovery.bathSento.cost+'円 · 每天一次',campaign.bathSentoDay===d||campaign.cash<GAME_CONFIG.recovery.bathSento.cost],npc:['正确回答暗号：+'+RC.resistanceNpc.san+' SAN / +'+RC.resistanceNpc.cash+'円',campaign.npcDay===d]}[type];
 box.innerHTML='<strong>▶ '+esc(name)+'</strong><p>'+info[0]+'</p><button class="rpg-action primary" id="facility-confirm" '+(info[1]?'disabled':'')+'>'+ (info[1]?'今日不可使用 / 条件不足':'交互 / 使用设施')+'</button>';
 let btn=document.getElementById('facility-confirm');btn.onclick=()=>type==='npc'?npcCommission():recoveryAction(type==='sento'?'bathSento':type)
 if(type==='potion'){const RC2=GAME_CONFIG.recovery;const leftN=(df,cf,m)=>m-((campaign[df]===d)?campaign[cf]:0);const mk=(t,txt)=>{let b=document.createElement('button');b.className='rpg-action';b.textContent=txt;b.onclick=()=>recoveryAction(t);box.appendChild(b)};mk('energy','⚡ 能量饮料 '+RC2.energy.cost+'円（疲劳点 +'+RC2.energy.hp+' · 今日剩 '+leftN('energyDay','energyCount',RC2.energy.maxPerDay)+'）');mk('sweets','🍰 甜食 '+RC2.sweets.cost+'円（压力 '+RC2.sweets.stress+' · 今日剩 '+leftN('sweetsDay','sweetsCount',RC2.sweets.maxPerDay)+'）');mk('incense','🕯️ 便携线香 '+RC2.incense.cost+'円（SAN +'+RC2.incense.san+' · 今日剩 '+leftN('incenseDay','incenseCount',RC2.incense.maxPerDay)+'）')}
 if(type==='sleep'){let bb=document.createElement('button');bb.className='rpg-action';bb.textContent='🛁 泡澡（入浴剂）'+GAME_CONFIG.recovery.bathHotel.cost+'円'+(campaign.bathHotelDay===d?' · 今日已使用':'');bb.disabled=campaign.bathHotelDay===d||campaign.cash<GAME_CONFIG.recovery.bathHotel.cost;bb.onclick=()=>recoveryAction('bathHotel');box.appendChild(bb);let vb=document.createElement('button');vb.className='rpg-action';vb.textContent='🥤 自动贩卖机（2F）';vb.onclick=()=>openVending('hotel');box.appendChild(vb);nightShiftButton(box)}
}
function renderFacilityControls(){if(!district||!campaign)return;
 const world=document.getElementById('district-world');if(!world)return;
 world.querySelectorAll('.v8-facility').forEach(x=>x.remove());const section=document.getElementById('v8-facility-list');if(section)section.remove();
 const list=facilitiesFor(district.id);let npc=hiddenAgents[district.id];
 if(npc)list.push(['agent','🕯️',npc[0],'npc',50,82]);
 const frag=document.createDocumentFragment();
 list.forEach(([id,icon,label,type,x,y])=>{let btn=document.createElement('button');btn.className='district-hit v8-facility';btn.style.cssText='left:'+x+'%;top:'+y+'%;background:#4a365f;border-color:#d2b4e0';btn.innerHTML='<b>'+icon+'</b>'+label;btn.setAttribute('aria-label','进入'+label);btn.onclick=()=>openFacility(type,label);frag.appendChild(btn)});world.appendChild(frag);
 const host=document.querySelector('.district-spots');if(host){let wrap=document.createElement('div');wrap.id='v8-facility-list';wrap.className='v8-facility-list';wrap.innerHTML='<h3>☾ 地图里的理智恢复设施</h3><p class="rpg-tiny">必须进入对应街区才能使用。每天限次的设施在下一天重置。</p>';list.forEach(([id,icon,label,type])=>{let button=document.createElement('button');button.className='rpg-action';button.textContent=icon+' '+label;button.onclick=()=>openFacility(type,label);wrap.appendChild(button)});host.parentNode.appendChild(wrap)}
}
const v7Map=tokyoHome;
tokyoHome=function(){v7Map();mountRecovery()};
const v7District=renderDistrict;
renderDistrict=function(){v7District();renderFacilityControls()};
const v8District=renderDistrict;
renderDistrict=function(){v8District();if(window.STV8)STV8.mount()};
const v7Status=survivalStatus;
survivalStatus=function(){v7Status()};
const v7End=end;
end=function(){v7End()};
