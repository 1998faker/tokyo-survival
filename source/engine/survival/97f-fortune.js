/* ==== engine/survival/97f-fortune.js ==== */
/* ===================================================================
   【v34 新桥的街头占卜师：占卜港屋酒店的事】
   - 每次 ¥1000（config 的 fortune.price）；每天一次「清晰」、一次「模糊」（共两次）。
   - 占卜结果只指方向，不给线索本身：
       清晰 = 「你可以去问问〇〇」「你可以再去〇〇看看」这一级；
       模糊 = 同一个方向的隐喻说法。
   - 方向由 H18.fortuneTarget() 按当前进度挑：第二夜该找的人 → 没听懂的日语 → 还有新话可问的人（优先能拿到线索的）
     → 还有东西没看过的地方 → 卡关提示。
   - 入口：新桥白天调查的「街头占卜师」，以及新桥街区地图上的占卜摊（不在白天调查期间时）。
   - 存档：campaign.fortune = {day, used:{clear,vague}, log:[…]}
   =================================================================== */
const FORTUNE=(function(){
 const CFG=()=>Object.assign({price:1000},GAME_CONFIG.fortune||{});
 function st(){campaign.fortune??={};const f=campaign.fortune;if(f.day!==campaign.day){f.day=campaign.day;f.used={}}f.used??={};f.log??=[];return f}
 const CARDS=['月','塔','隐者','星','命运之轮','倒吊人','女祭司','恋人','审判','节制'];
 /* 人物：清晰说法 / 模糊说法 */
 const NPC_VAGUE={
  sato:'柜台后面的人，总在等一通电话。她比你以为的更想说话。',
  mori:'掌管钥匙的人，一直在等你先开口。',
  inoue:'推着车的人，记得每一扇门后面的样子。',
  kobayashi:'守着后门的人，夜里看见的，比他说出口的多。',
  takahashi:'坐在账册后面的人，心里也有一笔对不上的数。',
  tanaka:'总在夜里出现的那个人，比你以为的更想见你。',
  girlA:'在旧招牌下收拾东西的女孩，还没把话说完。'
 };
 const MAP_VAGUE={
  lobby:'灯光发黄的地方，有一张纸在等你。',
  corridor:'门牌排成一列的地方，有一扇门比别的更安静。',
  storage:'被锁起来的东西，有时比人更诚实。',
  alley:'雨水流向的后门，有人留下了什么。',
  guard:'值夜的人留着一盏灯，灯下压着旧东西。',
  office:'关着门的房间里，有被认真整理过的东西。',
  shopping:'卷帘门后面的那条街，还记得一些事。',
  room206:'你每天睡觉的地方，你真的看仔细了吗？'
 };
 function reading(kind){
  const t=window.H18&&H18.fortuneTarget?H18.fortuneTarget():null;
  if(!t)return kind==='clear'?'“牌面很安静。……先回那家旅馆，和前台说说话吧。”':'“牌面很安静。……先回到你住的地方。”';
  if(t.kind==='npc'){
   if(kind==='clear')return t.met?'“你可以去问问'+t.name.replace(/\s+/g,'')+'。'+(t.mapName?'去「'+t.mapName+'」找找看。':'')+'”':'“「'+(t.mapName||'那家旅馆')+'」那边，有一个你还没说过话的人。去看看吧。”';
   return '“'+(NPC_VAGUE[t.id]||'有个人，还在等你去问。')+'”'}
  if(t.kind==='place'){
   if(kind==='clear')return '“你可以再去「'+t.mapName+'」看看。那里还有你没注意到的东西。”';
   return '“'+(MAP_VAGUE[t.id]||'你去过的地方，还藏着没看完的东西。')+'”'}
  if(t.kind==='unread'){
   if(kind==='clear')return '“有一句日语你没听懂。翻开调查手帐，选「回想没听懂的日语」，再听一遍。”';
   return '“有人对你说过一句话。你听见了，却还没有听懂。”'}
  if(kind==='clear')return '“'+t.text+'”';
  return '“路就在你脚下。只是你还没有往那边看。”'}
 function open(){
  if(!campaign){return}
  if(!campaign.hotelCase||!campaign.hotelCase.v18){UI.modal({title:'🔮 街头占卜师',html:'<p>她看了你一眼，把牌收拢。</p><p>“你身上还没有那家旅馆的味道。……等你在那里住过几晚，再来。”</p>',buttons:[{label:'离开'}]});return}
  const f=st(),P=CFG().price,poor=campaign.cash<P;
  const btn=(k,label)=>({label:(f.used[k]?'✓ ':'')+label+(f.used[k]?'（今天已经算过）':'（¥'+P.toLocaleString('ja-JP')+'）'),fn:()=>{if(f.used[k]){UI.toast('今天已经算过这一种了。明天再来。');return}if(campaign.cash<P){UI.toast('钱不够。');return}draw(k)}});
  UI.modal({title:'🔮 街头占卜师',html:'<p>深紫色的小伞下，她把塔罗牌摊在绒布上，铜铃轻轻响了一下。</p><p>“想问那家旅馆的事？……一次一千日元。看得清楚的牌，一天只出一次；看不清的那一次，你得自己去想。”</p>'+(poor?'<p class="survival-tip" style="color:var(--et-danger)">钱不够。</p>':'')+(f.log.length?'<p class="rpg-tiny">最近一次：'+esc(f.log[f.log.length-1].text)+'</p>':''),
   buttons:[btn('clear','🔮 清晰的占卜'),btn('vague','🌫 模糊的占卜'),...(window.PURGE?[{label:'🕯 净化被污染的线索（¥'+((GAME_CONFIG.peril||{}).purify||{teller:{price:800}}).teller.price+' / 最多 3 条）',fn:()=>PURGE.open('teller',open)}]:[]),...(window.PERIL&&PERIL.offer('scissors')?[{label:'✂ 她一直盯着你身后……',fn:()=>PERIL.run('scissors')}]:[]),{label:'不算了'}]});
 }
 function draw(kind){
  const f=st(),P=CFG().price;if(f.used[kind]||campaign.cash<P)return;
  f.used[kind]=true;GS.change({cash:-P});
  const card=CARDS[Math.floor(Math.random()*CARDS.length)],text=reading(kind);
  f.log.push({day:campaign.day,kind,card,text});f.log=f.log.slice(-20);campaignSave();if(window.AUDIO)AUDIO.sfx('clue');
  UI.modal({title:kind==='clear'?'🔮 清晰的占卜':'🌫 模糊的占卜',html:'<p>她翻开一张牌——「'+esc(card)+'」。</p><p style="white-space:pre-line">'+esc(text)+'</p><p class="rpg-tiny">（占卜只指一个方向，不会替你找到答案。）</p>',buttons:[{label:'收下这句话'}]});
 }
 return {open,reading,state:st};
})();
window.FORTUNE=FORTUNE;



/* Original game fiction; not a reproduction of Senso-ji's historical hundred slips. */
const OMI_DATA=(()=>{
 const grades=[
 {id:'daikichi',name:'大吉',weight:17,work:.20,gift:2,hostile:.5},
 {id:'kichi',name:'吉',weight:35,work:.10,gift:1.5,hostile:.7},
 {id:'hankichi',name:'半吉',weight:5,work:.05,gift:1.2,hostile:.9},
 {id:'shokichi',name:'小吉',weight:4,work:.03,gift:1.1,hostile:1},
 {id:'sueshokichi',name:'末小吉',weight:3,work:0,gift:1,hostile:1},
 {id:'suekichi',name:'末吉',weight:6,work:0,gift:.9,hostile:1.2},
 {id:'kyo',name:'凶',weight:30,work:0,gift:.5,hostile:2}];
 const poems=[
 [['雲ひらき 遠き山にも 朝日さす','云层散开，远山也迎来了朝阳。'],['春の水 石をめぐりて 海に着く','春水绕过顽石，终将抵达大海。'],['道の果て 灯を分け合える 人と会う','在道路尽头，遇见愿与你分享灯火的人。']],
 [['窓をあけ 風の便りを 静かに待つ','打开窗，静候风带来的消息。'],['一歩ずつ 橋の向こうに 花ひらく','一步一步走过去，桥的另一端有花开放。'],['種をまく 今日の小さな 手を信じ','播下种子，相信今天微小的努力。']],
 [['半ば晴れ 半ば雨なる 空を行く','在半晴半雨的天空下继续前行。'],['迷う道 足もと照らす 灯を守れ','道路迷茫时，先护住照亮脚边的灯。'],['行く水に 急がぬ舟の 影ひとつ','流水之上，一叶不急行的小舟。']],
 [['軒先に 小さき芽ひとつ 風を待つ','檐下一株新芽，静候微风。'],['古き道 拾った石に 陽があたる','旧路上拾起的石头，也照到了阳光。'],['帰り道 小さな灯り 胸に置く','归途之中，把一盏小灯留在心里。']],
 [['まだ見えぬ 花の色まで 土は知る','花还未开，泥土已知道它的颜色。'],['遠き鐘 聞こえるまでを 急ぐなよ','远处的钟声传来之前，不必急躁。'],['夕暮れの 雨やみしあと 空を見る','暮雨停歇之后，再抬头看看天空。']],
 [['冬の枝 明日の芽吹きを 内に抱く','冬日的枝条，怀抱着明天的新芽。'],['回り道 足あとだけが 道となる','绕行的脚印，终会成为新的道路。'],['月はまだ 水の底から 出でぬとも','即使月亮还未从水底升起，也请耐心等待。']],
 [['霧深し 知らぬ呼び声 追うなかれ','浓雾深处，不要追随陌生的呼唤。'],['細き橋 重き荷おろし 足を見よ','过窄桥前放下重担，注意脚下。'],['閉じた戸を 夜更けにひとり 叩くなよ','深夜独行时，不要敲打已经关闭的门。']]];
 const advice=[
 [['願望','願いは実る。人への礼を忘れずに。','愿望有望实现，别忘记感谢帮助你的人。'],['待人','良き便りとともに来る。','所等之人会带着好消息出现。'],['失物','明るい場所を探せ。','在明亮的地方寻找。'],['商売','誠を守れば利あり。','诚实经营，会有收益。'],['旅行','同行の人を大切に。','旅途顺遂，请珍惜同行之人。']],
 [['願望','焦らず進めば叶う。','不急于求成，循序渐进可成。'],['待人','少し遅れて来る。','所等之人会稍晚到来。'],['失物','身近をもう一度見よ。','再检查一次身边的地方。'],['商売','小さな信用が実を結ぶ。','日积月累的信用将带来成果。'],['旅行','道を確かめて出よ。','确认路线再出发。']],
 [['願望','迷いを一つずつ解け。','逐一解决犹豫，事情才能向前。'],['待人','便りを先に受ける。','会先收到消息。'],['失物','人に尋ねてみよ。','试着向他人询问。'],['商売','急な取引は控えよ。','避免仓促交易。'],['旅行','日程に余裕を持て。','行程中多留些余地。']],
 [['願望','小さな願いから叶う。','先从小小的愿望实现起。'],['待人','近くにいるが気づかず。','所等之人就在附近，只是尚未察觉。'],['失物','帰り道に目を配れ。','留意回去时的道路。'],['商売','地道な仕事によし。','适合踏实完成手头的工作。'],['旅行','慣れた道を選べ。','选择熟悉的路线。']],
 [['願望','今は支度の時。','现在适合做好准备。'],['待人','待つ間を大切にせよ。','珍惜等待的时间。'],['失物','忘れた頃に見つかる。','可能在不再挂心时找到。'],['商売','現状を丁寧に守れ。','认真维持现状。'],['旅行','天候を確かめよ。','先确认天气。']],
 [['願望','遅くとも道は開く。','即使晚一些，道路也会打开。'],['待人','遠回りして来る。','所等之人会绕路而来。'],['失物','今は見つからず。','眼下暂时找不到。'],['商売','蓄えを大切に。','重视积累，量入为出。'],['旅行','無理をせず休め。','不必勉强，适时休息。']],
 [['願望','今は立ち止まり見直せ。','现在应当停下来，重新审视。'],['待人','約束を確かめ直せ。','再次确认约定。'],['失物','追いすぎて新たに失うな。','不要因执着寻找而再失去别的东西。'],['商売','うまい話に近づくな。','远离听起来过分美好的交易。'],['旅行','独りの夜道は避けよ。','避免独自走夜路。']]];
 // Stable number -> grade -> authored verse. Expansion does not change existing IDs.
 const slips=[];let n=0;grades.forEach((g,i)=>{for(let k=0;k<g.weight;k++){const verse=poems[i][k%3];slips.push({id:'asakusa-'+(++n),number:n,grade:g.id,jp:verse[0],zh:verse[1],fields:advice[i]})}});
 const events=[
 {id:'witness',name:'有人看见了',grades:['kyo'],steps:[['签纸上出现五个针眼般的小洞。','身后传来敲木头的声音：コン……コン……コン……'],['你回过头，身后没有人。','纸的背面却慢慢浮现出：「見たな。」——“你看到了吧。”']]},
 {id:'fox',name:'狐火引路',grades:['daikichi','kichi'],steps:[['淡蓝色火光从签纸边缘升起。','人群中，一位戴狐狸面具的女人朝你招手。'],['火光停在寺院出口。','周围的游客像是完全没有看见她。']]},
 {id:'substitute',name:'替你去的人',grades:['suekichi','kyo'],steps:[['签纸旁躺着一张人形白纸，上面写着「{name}」。','背面写着：「代わりに行きます。」——“我替你去。”'],['纸人的腿忽然弯曲了一下。','它没有再动，仿佛正在等你作决定。']]},
 {id:'wish',name:'别人的愿望',grades:['daikichi','kichi'],steps:[['旁边的绘马上写着：この人が、明日もここへ来ますように。','“希望这个人明天也能来到这里。”'],['下面是你的名字「{name}」，日期却是游戏第{tomorrow}天。','再看时，名字被涂掉了。墨迹仍未干。']]},
 {id:'hundred',name:'第一百次参拜',grades:[],steps:[['白衣老妇人反复经过求签台。脚步声一直没有停。','「……九十八。」'],['「……九十九。」','你的身后，忽然又落下一步。'],['「……百。これで、やっと帰れますね。」','“这样，终于可以回去了呢。”她消失在人群中，签纸却沾上了泥土。']]},
 {id:'heavy',name:'拿不起来的签纸',grades:['hankichi','shokichi','sueshokichi'],steps:[['抽屉里的签纸纹丝不动。','试着拖动或点击纸张，把它拿起来。'],['薄纸缓缓陷入木板，柜子深处传来沉重的落地声。','再次拿起时轻得像什么也没有。底板上留下了手掌形状的凹陷。']]},
 {id:'umi',name:'海在数名字',grades:['kyo','suekichi'],steps:[['签纸背面渗出一圈水痕，闻起来有海的味道。','水痕慢慢聚成一行字：「海が、名前を数えている。」'],['“海在数名字。”','你再看时，背面只剩一圈干掉的盐。']]},
 {id:'water',name:'水里的签',grades:[],steps:[['经过手水舍，你看见自己和签纸的倒影。','水里的签运，和手里这张不同。'],['你重新检查，现实中的签运没有变化。','水里的你却独自折起签纸，放进口袋。'],['倒影缓缓抬头，直视你的眼睛。','水面没有波纹。']]}];
 return {grades,slips,events};
})();

/* Optional Senso-ji omikuji. All economic transitions are synchronous and persisted. */
const OMI=(()=>{'use strict';
 const D=OMI_DATA,defaultMods={work:0,gift:1,hostile:1};
 let screen='temple',recordId=null,pageNo=0,mode='traditional',message='',raf=0,shakeAt=0,openedAt=0,pointer=null,draggedAt=0,readBack=null;
 const save=()=>campaignSave();
 function state(){campaign.omikuji??={version:1,records:[],seen:[],last:null,giftRolls:{},gifts:[],session:null};const s=campaign.omikuji;s.giftRolls??={};s.gifts??=[];s.charms??=[];s.prayers??=[];return s}
 const today=()=>campaign?.omikuji?.records?.find(r=>r.day===campaign.day)||null;
 const current=()=>campaign?.omikuji?.records?.find(r=>r.id===recordId)||today();
 const grade=r=>D.grades.find(g=>g.id===r?.grade);
 const slip=r=>D.slips.find(s=>s.id===r?.slipId);
 const event=r=>D.events.find(e=>e.id===r?.anomaly);
 function mods(){return grade(today())||defaultMods}
 const prob=(p,type)=>Math.min(1,Math.max(0,p*(mods()[type]??1)));
 const wage=n=>Math.round(Math.max(0,n)*mods().work);
 function roll(rng=Math.random,seen=[],last=null){
  let v=rng()*100,g=D.grades.at(-1);for(const x of D.grades){if(v<x.weight){g=x;break}v-=x.weight}
  const choices=D.slips.filter(s=>s.grade===g.id),s=choices[Math.min(choices.length-1,Math.floor(rng()*choices.length))];
  let anomaly=null;if(rng()<.30){const pool=D.events.filter(e=>!e.grades.length||e.grades.includes(g.id));const fresh=pool.filter(e=>!seen.includes(e.id));const nonRepeat=pool.filter(e=>e.id!==last);const eligible=fresh.length?fresh:nonRepeat.length?nonRepeat:pool;anomaly=eligible[Math.min(eligible.length-1,Math.floor(rng()*eligible.length))].id}
  return {grade:g.id,number:s.number,slipId:s.id,anomaly};
 }
 function pay(selectedMode,rng=Math.random){
  if(!campaign||!['direct','traditional'].includes(selectedMode))return null;
  if(today()){recordId=today().id;return today()}
  if(campaign.cash<100){message='现金不足 ¥100。投币口没有收到硬币。';return null}
  const s=state(),result=roll(rng,s.seen,s.last);
  const r={...result,id:'omi-day-'+campaign.day,day:campaign.day,mode:selectedMode,paid:100,phase:selectedMode==='direct'?'paper':'shake',shakes:0,eventDone:false,eventStep:0,eventAttempts:0,eventStarted:false,disposition:null,special:{},rewards:{}};
  campaign.cash-=100;s.records.push(r);s.session=null;recordId=r.id;
  save();sound('coin');UI.update();return r;
 }
 function setPhase(r,p){r.phase=p;save()}
 function sound(kind){if(!window.AUDIO)return;AUDIO.sfx(({coin:'ding',wood:'step',paper:'page',knock:'step'})[kind]||kind)}
 function chooseMode(m){if(today()){resume(today());return}mode=m;recordId=null;if(m==='direct'){UI.confirm('直接抽签 · ¥100','每天只能求签一次。支付时确定签运，今天立即生效。',()=>{const r=pay(m);if(r)reveal(r);else render()})}else{state().session={day:campaign.day,mode:m,phase:'coin'};save();screen='table';message='点击投币口投入100日元，再摇动六角签筒。';render()}}
 function entry(){if(today()){message='本日はすでにおみくじを引いています。今天已经求过签了。';render();DM.show(document.getElementById('omi-dialogue'),{who:'御神籤',text:message,choices:[{t:'查看 / 继续今天的签',fn:()=>{DM.close();resume(today())}},{t:'取消',fn:()=>DM.close()}]});return}
  DM.show(document.getElementById('omi-dialogue'),{who:'御神籤',text:'御神籤を引きますか？\n要抽一支御神签吗？ 每次 ¥100，不额外消耗调查行动。',choices:[{t:'直接抽签',fn:()=>{DM.close();chooseMode('direct')}},{t:'传统求签体验',fn:()=>{DM.close();chooseMode('traditional')}},{t:'取消',fn:()=>DM.close()}]})}
 function resume(r){recordId=r.id;pageNo=r.drawerPage||0;
  if(r.phase==='done'){paper(r,true);return}
  if(r.phase==='event'){screen='event';render();return}
  if(r.phase==='paper'){reveal(r);return}
  screen=r.phase==='shake'||r.phase==='stick'?'table':r.phase==='cabinet'?'cabinet':r.phase==='drawer'?'drawer':'temple';render();
 }
 function open(){if(!campaign)return;DM.close();if(H18.active())H18.pause();if(EXPLORE.active())EXPLORE.stop();
  recordId=today()?.id||null;screen='temple';message='浅草寺 · 原创民俗异闻。点击求签台开始；本区域不关联港屋酒店调查。';UI.scene('omikuji',open);render();
 }
 function coin(){if(today()){resume(today());return}const r=pay('traditional');if(r){screen='table';message='硬币落入箱中。点击、左右拖动或滑动签筒。';render()}else render()}
 function shake(){const r=current();if(!r||r.day!==campaign.day||r.phase!=='shake'){message='请先在投币口支付 ¥100。';render();return}
  r.shakes=Math.min(4,r.shakes+1);shakeAt=performance.now();sound('wood');if(r.shakes===4){r.phase='stick';message='一根签棒落了下来。点击签棒，查看编号。'}else message='木签轻轻碰撞。再摇动 '+(4-r.shakes)+' 次。';save();render();
 }
 function stick(){const r=current();if(!r||r.phase!=='stick')return;r.phase='cabinet';r.drawerPage=0;pageNo=0;save();screen='cabinet';message='签棒：第 '+r.number+' 番。寻找相同号码的木抽屉。';render()}
 function drawer(n){const r=current();if(!r||r.phase!=='cabinet')return false;if(n!==r.number){message='这是第 '+n+' 番。签棒写的是第 '+r.number+' 番，请再找找。';sound('wood');render();return false}r.phase='drawer';openedAt=performance.now();save();sound('wood');screen='drawer';message='木抽屉缓缓滑开。点击里面的折叠签纸。';render();return true}
 function take(){const r=current();if(!r||r.phase!=='drawer')return;reveal(r)}
 function reveal(r){recordId=r.id;if(r.anomaly&&!r.eventDone){r.phase='event';r.eventStarted=true;const s=state();if(!s.seen.includes(r.anomaly))s.seen.push(r.anomaly);s.last=r.anomaly;save();screen='event';render();return}setPhase(r,'paper');paper(r,false)}
 function skip(){const r=current();if(!r){message='尚未投币。可返回求签台选择直接抽签。';render();return}if(r.phase==='event'){finishEvent();return}if(r.phase==='done'){paper(r,true);return}reveal(r)}
 function advanceEvent(){const r=current(),e=event(r);if(!e||r.eventDone)return;
  if(e.id==='heavy'&&r.eventStep===0){r.eventAttempts++;sound('wood');if(r.eventAttempts<2){message='纸张动也不动，仿佛压着整座木柜。';save();render();return}}
  if(r.eventStep<e.steps.length-1){r.eventStep++;message='';sound(e.id==='witness'?'knock':e.id==='hundred'?'wood':'paper');save();render()}else finishEvent();
 }
 function finishEvent(choice){const r=current();if(!r||r.eventDone)return;
  if(r.anomaly==='fox'&&choice==='follow'&&!r.rewards.fox){campaign.cash+=5;r.rewards.fox=true;r.special.foxCoin=true}
  if(r.anomaly==='substitute')r.special.doll=choice==='take';
  if(r.anomaly==='witness')r.special.holes=true;
  if(r.anomaly==='hundred')r.special.mud=true;
  if(r.anomaly==='heavy')r.special.handprint=true;
  if(r.anomaly==='wish'){r.special.ema=true;r.special.emaDate=r.day+1}
  if(r.anomaly==='water')r.special.reflection= r.grade==='kyo'?'大吉':'凶';
  r.eventDone=true;r.phase='paper';save();sound('paper');paper(r,false);
 }
 function keep(){const r=current();if(!r||!r.eventDone&&r.anomaly||r.disposition)return false;r.disposition='kept';r.phase='done';save();screen='temple';message='御神签已收入背包。今天的运势不会因收下或系签改变。';render();return true}
 function prepareTie(){const r=current();if(!r||r.disposition)return;setPhase(r,'tie');screen='temple';message='拿着签纸，点击或拖动到右侧系签架。';render()}
 function tie(){const r=current();if(!r||r.phase!=='tie'){message='这里是系签架。阅读签纸后可选择系在这里。';render();return false}r.disposition='tied';r.phase='done';r.tiedAt=campaign.day;save();sound('paper');shakeAt=performance.now();screen='temple';message='纸结在绳上轻轻晃动。运势仍然有效，记录保存在求签历史中。';render();return true}
 const specialText=r=>[r.special.holes?'纸面上有五个细小的破洞；背面的字已消失。':'',r.special.mud?'纸张边缘沾着一些干燥的泥土。':'',r.special.doll?'带回的人形白纸上写着你的名字，双腿已经消失。':'',r.special.handprint?'你记得抽屉底板上那道手掌形的凹陷。':'',r.special.ema?'绘马上的名字已被划掉。':'',r.special.reflection?'水中倒影曾显示「'+r.special.reflection+'」，现实签运没有变化。':'',r.rewards.fox?'你跟随狐火，拾到了五日元。':''].filter(Boolean).join('\n');
 function paper(r,history=false){recordId=r.id;screen='paper';cancelAnimationFrame(raf);const s=slip(r),g=grade(r);if(!s||!g)return;
  UI.scene('omikuji',()=>paper(r,history));
  app.innerHTML=`<div class="rpg-shell omi-shell"><section class="rpg-panel"><div class="h18-top"><h1 class="h18-title">御神籤 · DAY ${r.day}</h1><button id="omi-paper-close" class="rpg-inline-back">返回${history?'记录':'寺院'}</button></div>
  <div class="omi-paper ${r.special.mud?'mud':''} ${r.special.holes?'holes':''}" id="omi-paper"><div class="omi-paper-seal">浅草 · 御神籤<small>游戏原创签文</small></div><div class="omi-number">第 ${s.number} 番</div><h2>${g.name}</h2><p class="omi-verse" lang="ja">${esc(s.jp)}</p><p class="omi-translation">${esc(s.zh)}</p><dl>${s.fields.map(f=>`<div><dt>${f[0]}</dt><dd lang="ja">${f[1]}</dd><dd class="omi-translation">${f[2]}</dd></div>`).join('')}</dl>${specialText(r)?'<p class="omi-special">'+esc(specialText(r)).replace(/\n/g,'<br>')+'</p>':''}</div>
  <div class="omi-reading"><button class="rpg-action" id="omi-translate">中文译文：显示 / 隐藏</button><button class="rpg-action" id="omi-zoom">放大签纸</button></div>
  <p>此签在游戏第 ${r.day} 天生效。${r.day===campaign.day?'今日运势：'+g.name:'该日运势已结束。'}${r.disposition==='tied'?' 签纸已系在寺内。':r.disposition==='kept'?' 签纸保存在背包中。':''}</p>
  ${!history&&!r.disposition?'<div class="daily-buttons"><button class="survival-btn" id="omi-keep">收下御神签</button><button class="survival-btn alt" id="omi-tie-prepare">系在指定位置</button></div>':''}</section></div>`;
  document.getElementById('omi-translate').onclick=()=>document.getElementById('omi-paper').classList.toggle('no-translation');
  document.getElementById('omi-zoom').onclick=()=>document.getElementById('omi-paper').classList.toggle('zoomed');
  document.getElementById('omi-paper-close').onclick=()=>{if(history)historyPage();else{screen='temple';render()}};
  if(!history&&!r.disposition){document.getElementById('omi-keep').onclick=keep;document.getElementById('omi-tie-prepare').onclick=prepareTie}sound('paper');window.scrollTo(0,0);
 }
 function historyPage(){cancelAnimationFrame(raf);UI.scene('omikuji-history',historyPage);const rows=state().records.slice().reverse();app.innerHTML='<div class="rpg-shell"><section class="rpg-panel"><h1>御神签记录</h1><p>签纸是旅途中的私人记录，不进入报告材料库。</p><div id="omi-records"></div><button id="omi-history-exit" class="survival-btn alt">返回寺院</button></section></div>';const host=document.getElementById('omi-records');for(const r of rows){const b=document.createElement('button');b.className='rpg-action';b.textContent='DAY '+r.day+' · 第'+r.number+'番 · '+grade(r).name+' · '+({kept:'已收纳',tied:'已系签'}[r.disposition]||'尚未收纳');b.onclick=()=>paper(r,true);host.appendChild(b)}if(!rows.length)host.textContent='尚未求签。';document.getElementById('omi-history-exit').onclick=()=>{recordId=today()?.id||null;screen='temple';message='回到寺院全景。';render()}}
 function attachBag(){const host=app.querySelector('.et-page');if(!host||!campaign?.omikuji)return;const box=document.createElement('section');box.className='rpg-panel';box.innerHTML='<h2>御神签与民俗物品</h2>';for(const r of state().records.filter(r=>r.disposition==='kept'||r.special.doll)){const b=document.createElement('button');b.className='rpg-action';b.textContent=(r.disposition==='kept'?'第'+r.number+'番 · '+grade(r).name:'人形白纸')+' · DAY '+r.day;b.onclick=()=>paper(r,true);box.appendChild(b)}for(const ch of state().charms){const line=document.createElement('p');line.textContent='⛩ '+ch.name+' · DAY '+ch.day+' 购买';box.appendChild(line)}for(const w of state().prayers.slice(-9)){const line=document.createElement('p');line.textContent='🙏 DAY '+w.day+' · '+w.name+'祈愿';box.appendChild(line)}const b=document.createElement('button');b.className='rpg-action';b.textContent='查看全部求签历史（含已系签）';b.onclick=historyPage;box.appendChild(b);host.appendChild(box)}
 function gift(key,rng=Math.random){if(!campaign)return null;const s=state();if(s.giftRolls[key])return null;s.giftRolls[key]=true;let reward=null;if(rng()<prob(.12,'gift')){const pool=['sc-coffee','day-snack','omi-onigiri','omi-drink','cash'];reward=pool[Math.min(4,Math.floor(rng()*pool.length))];if(reward==='cash')campaign.cash+=50;else{campaign.items??={};campaign.items[reward]=(campaign.items[reward]||0)+1}s.gifts.push({day:campaign.day,key,reward});UI.toast('路人赠礼：'+(reward==='cash'?'¥50':ITEMS.find(x=>x.id===reward)?.name||reward))}save();return reward}
 function badge(){const top=document.querySelector('#et-top .et-res')||document.querySelector('.et-res');if(!top||!campaign)return;top.querySelector('.omi-badge')?.remove();const b=document.createElement('button');b.className='omi-badge';b.textContent='今日运势：'+(grade(today())?.name||'？');b.onclick=()=>{if(DM.isOpen()||document.querySelector('.sc-overlay,.et-modal-back'))return;if(today())paper(today(),true);else UI.toast('前往浅草寺的求签台，每天可求签一次。')};top.appendChild(b)}
 // Rendering uses the exact hotel tile and person functions; custom objects are drawn on the same pixel grid.
 function paint(canvas,t=0){const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const txt=(s,x,y,size=12,c='#e9d7ad')=>{g.fillStyle=c;g.font='bold '+size+'px monospace';g.fillText(s,x,y)};
  const wood=(x,y,w,h)=>{R(x,y,w,h,'#71472e');R(x,y,w,4,'#b0814d');R(x,y+h-5,w,5,'#392a25');for(let j=10;j<h;j+=9)R(x+4,y+j,w-8,1,'#845537')};
  const sheet=(x,y,w,h,fold=false)=>{R(x+3,y+3,w,h,'#332b28');R(x,y,w,h,'#e8dfbc');R(x+2,y+2,w-4,h-4,'#f2e9cf');if(fold)R(x+w/2,y,1,h,'#bdaf8d');else for(let k=8;k<w-5;k+=8)R(x+k,y+7,2,h-14,'#4d4338')};
  const cylinder=(x,y,large=false)=>{const sc=large?2:1;g.save();g.translate(x,y);const shake=Math.max(0,1-(performance.now()-shakeAt)/650);g.rotate(Math.sin(t/30)*.12*shake);g.scale(sc,sc);R(-17,-35,34,60,'#7b5030');R(-21,-28,42,46,'#96683e');R(-17,-35,34,7,'#c49a5e');R(-10,-31,20,3,'#272229');R(-17,17,34,8,'#503627');R(-14,-25,3,40,'#b68a50');R(8,-25,3,40,'#65462e');txt('籤',-8,5,16,'#f1dba9');g.restore()};
  const cabinet=(x,y,w,h)=>{wood(x,y,w,h);for(let j=0;j<4;j++)for(let i=0;i<5;i++){const xx=x+5+i*(w-10)/5,yy=y+6+j*(h-12)/4;R(xx,yy,(w-16)/5,(h-20)/4,'#a77b49');R(xx+5,yy+6,8,5,'#e0c594');R(xx+8,yy+15,5,2,'#3b2c24')}};
  const rack=()=>{R(407,104,5,171,'#6f4d38');R(494,104,5,171,'#6f4d38');for(const y of [129,170,211]){R(405,y,95,3,'#c5ad82');for(let x=413;x<490;x+=16){const yy=y+3+Math.round(Math.sin(t/800+x)*2);sheet(x,yy,11,18,true)}}};
  const person=(x,y,white=false)=>H18.pixelPerson(g,x,y,white?{h:'#aba9a4',s:'#d8c2a3',b:'#e0ddcb',a:'#ddd8bf',p:'#d0ccbf',k:'#302b2c'}:{h:'#372c2e',s:'#ecc7a3',b:'#687b7a',a:'#b9a384',p:'#3d4b65',k:'#222'});
  const scene=()=>{const m={rows:Array.from({length:11},(_,y)=>y<3?'#'.repeat(16):'_'.repeat(16)),floor:'_',wall:['#a05a43','#703a30','#302b32'],doors:{}};for(let y=0;y<11;y++)for(let x=0;x<16;x++)H18.pixelTile(g,m,x,y,'evening');R(0,0,512,30,'#667a7a');for(let y=30;y<76;y+=6)R(22-(y-30)/2,y,468+(y-30),5,y%12?'#393b41':'#56575c');R(24,78,465,8,'#a64b3c');for(const x of [32,116,385,473]){R(x,85,10,105,'#ad4936');R(x+3,85,2,105,'#d06643')}R(42,97,86,79,'#514038');R(48,104,74,64,'#302b30');R(64,90,43,51,'#b84c35');R(69,94,33,43,'#d16b45');txt('雷',77,115,15,'#302329');txt('門',77,132,15,'#302329');wood(148,172,109,56);cylinder(192,161);R(225,180,19,9,'#302b2b');R(229,183,11,2,'#080a0c');cabinet(282,102,108,135);rack();person(70,221);person(128,263);R(18,277,94,46,'#777b78');R(24,283,82,24,'#6e9c9e');R(28,287,74,15,'#adc6bf');wood(323,260,58,43);R(330,266,42,27,'#cfac73');txt('絵馬',335,282,12,'#514033');const wish=state().records.slice().reverse().find(r=>r.special.ema);if(wish){R(332,287,37,3,'#2c252a');txt('D'+(wish.special.emaDate||wish.day+1),335,299,9,'#30262a')}const tied=state().records.filter(r=>r.disposition==='tied').length;if(tied){sheet(451,127,15,28,true);txt(String(tied),480,259,10)} };
  if(['temple','event'].includes(screen)){scene();if(screen==='temple'&&current()?.phase==='tie'){sheet(220,281,46,49,true);txt('拿着的签纸',200,345,11)}}
  if(screen==='table'){R(0,0,512,352,'#302b2c');wood(18,42,476,278);cylinder(206,192,true);wood(365,145,97,76);R(379,167,68,18,'#211e23');R(388,172,49,4,'#090b11');txt('百円',387,208,16);txt('御神籤',44,78,18);const r=current();if(r?.phase==='stick'){wood(50,272,280,23);txt('第 '+r.number+' 番',124,289,17,'#211f25')}else txt(r?'摇动 '+r.shakes+' / 4':'先投币 · ¥100',44,296,14);}
  if(screen==='cabinet'){wood(0,0,512,352);for(let i=0;i<12;i++){const n=pageNo*12+i+1;if(n>100)break;const x=12+i%4*124,y=55+Math.floor(i/4)*90;wood(x,y,116,80);R(x+7,y+8,102,59,'#ae8050');R(x+38,y+16,42,23,'#e7d3a9');txt(String(n).padStart(2,'0'),x+46,y+34,18,'#352b27');R(x+45,y+55,28,5,'#40302a')}txt('木引出 '+(pageNo*12+1)+'—'+Math.min(100,pageNo*12+12),150,27,16)}
  if(screen==='drawer'){R(0,0,512,352,'#302c2d');g.save();g.translate(0,-14*Math.max(0,1-(performance.now()-openedAt)/350));wood(32,40,448,270);R(52,62,408,218,'#3c2c29');wood(64,82,384,185);sheet(157,117,193,98,true);txt('第 '+current()?.number+' 番',196,169,20,'#3c332c');txt('点击取出签纸',170,300,15);g.restore()}
  if(screen==='event'){const r=current(),e=event(r),step=r.eventStep;R(0,0,512,352,'rgba(12,17,31,.24)');
   if(e.id==='witness'){sheet(167,61,176,244);for(let i=0;i<5;i++)R(196+i*25,99+(i%2)*15,5,5,'#1d1c21');if(step)txt('見たな。',192,214,24,'#322630')}
   if(e.id==='fox'){for(let i=0;i<5;i++){const x=230+i*28,y=230-i*20+Math.round(Math.sin(t/260+i)*5);R(x,y,8,12,'#507dba');R(x+2,y+2,4,6,'#c2f4ee')}person(365,153,true);R(370,158,20,12,'#efe4cf');R(369,152,5,9,'#efe4cf');R(386,152,5,9,'#efe4cf');R(374,163,3,2,'#af4b3b');R(383,163,3,2,'#af4b3b');if(step)R(428,286,8,7,'#c6a35e')}
   if(e.id==='substitute'){wood(104,56,300,245);sheet(128,96,96,145,true);R(280,105,34,32,'#ebe5cf');R(270,142,54,63,'#ebe5cf');R(244,145,104,16,'#ebe5cf');R(270,203,16,40,'#ebe5cf');R(309,201+(step?Math.round(Math.sin(t/400)*6):0),16,40,'#ebe5cf');txt('代わりに',250,275,15);txt('行きます',250,296,15)}
   if(e.id==='wish'){wood(120,56,272,248);R(135,72,242,212,'#d0b186');txt('明日も、ここへ。',152,114,19,'#302629');txt('DAY '+(r.day+1),168,158,20,'#302629');txt(playerName(),154,199,15,'#302629');if(step)for(let i=0;i<5;i++)R(147,185+i*6,210,3,'#252329')}
   if(e.id==='hundred'){if(step<2){person(230+step*38,175,true);txt(step?'九十九':'九十八',215,164,19)}else{sheet(219,215,65,92);for(let i=0;i<7;i++)R(221+i*8,288+i%3*4,6,8,'#69563e')}}
   if(e.id==='heavy'){wood(74,53,364,250);R(94,75,324,188,'#50392d');if(step){R(236,142,43,69,'#302722');for(let i=0;i<5;i++)R(229+i*13,121+i%2*4,8,54,'#302722');sheet(120,209,94,40,true)}else{sheet(155,119+r.eventAttempts*13,200,90,true);txt('拖动签纸',212,172+r.eventAttempts*13,14,'#41372e')}}
   if(e.id==='water'){R(61,53,390,254,'#777e7e');R(77,68,358,222,'#548184');R(88,80,335,196,'#9cb5ab');person(240,step===2?141:121);sheet(step>=1?285:287,step>=1?205:130,step>=1?25:72,step>=1?25:98,step>=1);if(step===0)txt(r.grade==='kyo'?'大吉':'凶',292,188,20,'#343b36');if(step===2){R(249,149,3,3,'#10181c');R(257,149,3,3,'#10181c')}}
  }
 }
 function playerName(){return String(campaign?.name||campaign?.playerName||'旅人').slice(0,16)}
 function hot(label,x,y,w,h,fn,kind){const b=document.createElement('button');b.type='button';b.className='omi-hot';b.dataset.omi=kind||'';b.style.cssText=`left:${x/512*100}%;top:${y/352*100}%;width:${w/512*100}%;height:${h/352*100}%`;b.setAttribute('aria-label',label);b.innerHTML='<span>'+esc(label)+'</span>';b.onclick=e=>{if(DM.isOpen())return;if(kind==='shake'&&performance.now()-draggedAt<400)return;fn()};b.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();e.stopPropagation();if(!DM.isOpen())fn()}};document.getElementById('omi-stage').appendChild(b);return b}
 const CHARMS=[{id:'love',name:'縁結び守 · 姻缘御守',price:700,desc:'祈求与人的缘分顺遂。'},{id:'work',name:'仕事守 · 事业御守',price:600,desc:'祈求工作顺利，愿付出有所收获。'},{id:'study',name:'学業守 · 学业御守',price:500,desc:'祈求学习时沉得下心。'},{id:'health',name:'健康守 · 健康御守',price:500,desc:'祈求日常平安健康。'}];
 const WISHES=[{id:'love',name:'姻缘',jp:'良いご縁がありますように。',text:'你把关于相遇与缘分的愿望默念一遍。'},{id:'work',name:'事业',jp:'仕事がうまくいきますように。',text:'你想着接下来要做的事，慢慢合上双手。'},{id:'study',name:'学业',jp:'勉強が身につきますように。',text:'你在心里念着想掌握的知识。'}];
 function templeMenu(type){
  const box=app.querySelector('#omi-extra-panel');if(!box)return;box.style.display='block';box.replaceChildren();
  const heading=document.createElement('h3');heading.textContent=type==='charms'?'御守授与所':'本堂前 · 奉纳与祈愿';box.append(heading);
  const lead=document.createElement('p');lead.textContent=type==='charms'?'柜台摆着不同种类的御守。购买后会保存在随身物品记录里，不会影响207号室的真相。':'先投入¥100香油钱，再选择自己想祈求的事。祈愿不会改变案件结果。';box.append(lead);
  const items=type==='charms'?CHARMS:WISHES;
  for(const item of items){
   const row=document.createElement('div');row.style.cssText='margin:9px 0;padding:9px;border:1px solid #8a7d65;border-radius:8px';
   const title=document.createElement('p');title.textContent=type==='charms'?`${item.name} · ¥${item.price}`:`${item.name} · ¥100`;row.append(title);
   const details=document.createElement('p');details.textContent=type==='charms'?item.desc:`「${item.jp}」`;row.append(details);
   const b=document.createElement('button');b.className='survival-btn';
   const owned=type==='charms'&&state().charms.some(x=>x.id===item.id);
   const prayed=type==='wishes'&&state().prayers.some(x=>x.day===campaign.day&&x.id===item.id);
   b.disabled=owned||prayed;b.textContent=owned?'已购买':prayed?'今日已祈愿':type==='charms'?'购买御守':'奉纳祈愿';
   b.onclick=()=>{
    if(campaign.cash<(type==='charms'?item.price:100)){UI.toast('现金不足。');return}
    if(type==='charms'&&state().charms.some(x=>x.id===item.id))return;
    if(type==='wishes'&&state().prayers.some(x=>x.day===campaign.day&&x.id===item.id))return;
    campaign.cash-=type==='charms'?item.price:100;
    if(type==='charms'){state().charms.push({id:item.id,name:item.name,day:campaign.day,price:item.price});message='御守放进了随身袋中。'}
    else{state().prayers.push({id:item.id,name:item.name,day:campaign.day});message=item.text}
    save();UI.toast(type==='charms'?'已购买 '+item.name:'已为'+item.name+'祈愿');templeMenu(type);
    const note=document.createElement('p');note.textContent=message;box.prepend(note);
    const hud=app.querySelector('.h18-hud');if(hud){const spans=hud.querySelectorAll('span');if(spans[1])spans[1].textContent='现金 ¥'+campaign.cash}
   };row.append(b);box.append(row)
  }
  if(type==='charms'&&state().charms.length){const own=document.createElement('p');own.textContent='已持有：'+state().charms.map(x=>x.name).join('、');box.append(own)}
  const close=document.createElement('button');close.className='rpg-action';close.textContent='返回寺院全景';close.onclick=()=>{box.style.display='none';box.replaceChildren();screen='temple';message='回到寺院全景。'};box.append(close)
 }
 function render(){cancelAnimationFrame(raf);if(!campaign)return;UI.scene('omikuji',()=>{const r=current();if(r)resume(r);else open()});const r=current();
  app.innerHTML=`<div class="rpg-shell h18-shell omi-shell"><section class="rpg-panel h18-panel"><div class="h18-top"><div><div class="rpg-kicker">ASAKUSA // 御神籤</div><h1 class="h18-title">浅草寺 · 求签处</h1></div><button class="rpg-inline-back" id="omi-exit">返回街区</button></div><div class="h18-hud"><span>DAY ${campaign.day}</span><span>现金 ¥${campaign.cash}</span><span>今日运势：${grade(today())?.name||'？'}</span>${r&&screen==='cabinet'?'<span>签棒：第 '+r.number+' 番</span>':''}</div>
   <div class="h18-stage omi-stage" id="omi-stage"><canvas id="omi-canvas" width="512" height="352" aria-label="浅草寺像素场景"></canvas></div><p class="omi-hint" role="status">${esc(message||hint())}</p><div id="omi-dialogue" class="adv-box" hidden></div><div id="omi-event-text"></div><div id="omi-extra-panel" style="display:none" class="day-dialogue"></div><div class="omi-tools"><button id="omi-history" class="rpg-action">求签历史</button><button id="omi-charm-shop" class="rpg-action">⛩ 御守授与所</button><button id="omi-hondo" class="rpg-action">🏯 本堂参拜</button><button id="omi-goma" class="rpg-action">🔥 护摩净化（¥1000 / 5 条）</button><button id="omi-wish-pray" class="rpg-action">🙏 祈愿：姻缘／事业／学业</button>${r&&r.phase!=='done'&&r.phase!=='tie'?'<button id="omi-skip" class="rpg-action">跳过互动演出（保留原签）</button>':''}<button id="omi-return" class="rpg-action">回到寺院全景</button></div><p class="rpg-tiny">点击物体调查 · Tab 选择物体，Enter 操作 · 签筒可点击或左右拖动。民俗事件均为原创虚构。</p></section></div>`;
  const canvas=document.getElementById('omi-canvas');const loop=t=>{if(!canvas.isConnected)return;paint(canvas,t);raf=requestAnimationFrame(loop)};paint(canvas,performance.now());raf=requestAnimationFrame(loop);
  document.getElementById('omi-exit').onclick=()=>{cancelAnimationFrame(raf);DM.close();district=byId.asakusa;renderDistrict()};
  document.getElementById('omi-history').onclick=historyPage;document.getElementById('omi-return').onclick=()=>{recordId=today()?.id||null;screen='temple';message='已回到寺院全景。';render()};document.getElementById('omi-charm-shop').onclick=()=>templeMenu('charms');document.getElementById('omi-wish-pray').onclick=()=>templeMenu('wishes');{const hd=document.getElementById('omi-hondo');if(hd)hd.onclick=()=>{cancelAnimationFrame(raf);PRAYER.open()}}{const gm=document.getElementById('omi-goma');if(gm)gm.onclick=()=>PURGE.open('temple')}const sk=document.getElementById('omi-skip');if(sk)sk.onclick=skip;
  if(screen==='temple'){
   hot('求签台',143,133,115,102,entry,'table');hot('编号抽屉',279,100,112,140,()=>{if(r&&!r.disposition)resume(r);else{message='请先在求签台取得签棒。';render()}},'cabinet');
   const tieHot=hot('系签架',405,103,96,176,tie,'tie');tieHot.onpointerup=e=>{if(pointer?.paper){pointer=null;tie()}};
   if(r?.phase==='tie'){const held=hot('拿着的签纸',213,273,65,67,()=>{message='将签纸拖到右侧的系签架，或直接点击架子。';render()},'held-paper');held.onpointerdown=e=>{e.preventDefault();pointer={paper:true};held.setPointerCapture(e.pointerId)};held.onpointerup=e=>{const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-omi="tie"]');pointer=null;if(target)tie()};}
   hot('手水舍',16,272,98,62,()=>{message='清水映着屋檐。';if(r?.anomaly==='water'&&!r.eventDone)reveal(r);else render()},'water');
   hot('绘马',320,255,64,61,()=>{const old=state().records.slice().reverse().find(x=>x.special.ema);if(old){old.special.emaDate=campaign.day+1;save();message='绘马上被划掉的名字仍像是你的。日期：游戏第 '+old.special.emaDate+' 天。墨迹没有干。'}else message='绘马上留着陌生人的愿望。';render()},'ema');
   if(r&&!r.disposition&&r.phase!=='tie')hot('继续这支签',211,275,90,54,()=>resume(r),'resume');
  }
  if(screen==='table'){
   hot('投币口 · ¥100',365,145,98,83,coin,'coin');const b=hot('摇动签筒',144,94,128,155,shake,'shake');
   b.onpointerdown=e=>{e.preventDefault();pointer={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId)};
   b.onpointermove=e=>{if(!pointer||pointer.paper)return;if(Math.abs(e.clientX-pointer.x)>22||Math.abs(e.clientY-pointer.y)>22){draggedAt=performance.now();pointer=null;shake()}};
   b.onpointerup=()=>{pointer=null};b.onpointercancel=()=>{pointer=null};if(r?.phase==='stick')hot('签棒 · 第 '+r.number+' 番',48,266,290,45,stick,'stick');
  }
  if(screen==='cabinet'){
   for(let i=0;i<12;i++){const n=pageNo*12+i+1;if(n<=100)hot(String(n).padStart(2,'0')+'号',12+i%4*124,55+Math.floor(i/4)*90,116,80,()=>drawer(n),'drawer-'+n)}
   hot('上一组',6,1,90,42,()=>{pageNo=Math.max(0,pageNo-1);r.drawerPage=pageNo;save();render()},'prev');hot('下一组',415,1,90,42,()=>{pageNo=Math.min(8,pageNo+1);r.drawerPage=pageNo;save();render()},'next');
  }
  if(screen==='drawer')hot('取出签纸',155,112,200,110,take,'paper');
  if(screen==='event'){
   const e=event(r),lines=e.steps[r.eventStep]||e.steps[0],last=r.eventStep===e.steps.length-1;document.getElementById('omi-event-text').innerHTML='<div class="omi-narrative"><h2>'+e.name+'</h2>'+lines.map(l=>'<p>'+esc(l.replaceAll('{name}',playerName()).replaceAll('{tomorrow}',r.day+1))+'</p>').join('')+'</div>';
   if(last&&e.id==='fox'){hot('跟随狐火',344,138,115,166,()=>finishEvent('follow'),'follow');hot('留在求签台',120,167,130,80,()=>finishEvent('ignore'),'ignore')}
   else if(last&&e.id==='substitute'){hot('带走纸人',239,95,120,163,()=>finishEvent('take'),'doll');hot('放回抽屉',111,252,293,68,()=>finishEvent('return'),'return-doll')}
   else {const b=hot(e.id==='heavy'&&r.eventStep===0?'试着拿起签纸':'继续观察',e.id==='heavy'?150:90,e.id==='heavy'?110:65,e.id==='heavy'?210:330,e.id==='heavy'?110:230,advanceEvent,'event');if(e.id==='heavy'&&r.eventStep===0){b.onpointerdown=e=>{pointer={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId)};b.onpointerup=e=>{if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>15){pointer=null;advanceEvent()}}}}
  }
 }
 function hint(){return screen==='temple'?'点击求签台，开始今天的求签。':screen==='cabinet'?'翻看编号抽屉，寻找签棒上的数字。':screen==='event'?'留意画面中正在变化的物体。':'点击场景中的物体继续。'}
 return {open,state,today,current,mods,prob,wage,roll,pay,chooseMode,coin,shake,stick,drawer,take,skip,resume,advanceEvent,finishEvent,keep,prepareTie,tie,historyPage,attachBag,gift,badge,paper,specialText,data:D};
})();
window.OMI=OMI;
for(const item of [{id:'omi-onigiri',name:'旅人赠送的饭团',icon:'🍙',desc:'普通便携食物，不是调查证据。'},{id:'omi-drink',name:'旅人赠送的饮料',icon:'🥤',desc:'普通饮料，不是调查证据。'}])if(!ITEMS.some(x=>x.id===item.id))ITEMS.push(item);
// Integrate into the existing asakusa temple hotspot, not a new map.
{const base=renderDistrict;renderDistrict=function(){base.apply(this,arguments);if(district?.id!=='asakusa')return;const world=document.getElementById('district-world');if(!world)return;let b=world.querySelector('[data-spot="temple"]');if(!b){b=document.createElement('button');b.className='street-hot';b.style.cssText='left:25%;top:29%';world.appendChild(b)}b.innerHTML='<b>◇</b><small>浅草寺 · 御神签</small>';b.setAttribute('aria-label','进入浅草寺御神签');b.onclick=OMI.open;app.querySelectorAll('.district-spots [data-spot="temple"]').forEach(x=>x.onclick=OMI.open)}}
{const base=selectSpot;selectSpot=function(id){if(district?.id==='asakusa'&&id==='temple'){OMI.open();return}return base.apply(this,arguments)}}
