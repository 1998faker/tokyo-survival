/* ==== engine/survival/97zs-v53-konbini-shop.js ==== */
/* v53：便利店购物系统（改动 1–7）
   - 三个虚构品牌：モーソン MŌSON / ファミリーマーク FamilyMark / セブントゥエルブ Seven Twelve，每家一张定稿布局图（KONBINI_ART）
   - 开局把所有带「商店街 · 便利店」点位的车站洗牌后轮流分给三家（存 campaign.konbiniChains），每店一个价格系数（campaign.konbiniPrice）
   - 店内场景 + 热点 → 货架商品面板 → 购物篮 → 收银台结账（统一扣款、统一生效、结账时扣库存）
   - 21:30 后半价（MŌSON 便当柜 / FamilyMark 热食柜 / Seven Twelve お弁当・パン + 特价墙最下层）
   - Seven Twelve：特价墙（临期食品）、报刊架（报纸 / 杂志，按定价卖，读完记进档案「07 报纸剪报」）
   - 手电筒 + 乾電池（改动 6）：持有且有电时，黑暗中的 SAN 损失减半（向下取整），每过一夜耗 1 夜电量
   红线：这里不产出任何线索 / 证据 / 报告材料。 */
const KSHOP=(function(){
 const BR={
  moson:{name:'モーソン',en:'MŌSON',color:'#2F90D6',ink:'#fff',half:['bento'],
   hs:{atm:[50,50,155,330],drink:[170,110,1145,325],ice:[1170,165,1880,330],snack:[640,345,1125,630],daily:[1150,345,1640,630],bento:[640,620,1125,910],bread:[1150,620,1640,910],hot:[35,340,300,930],register:[355,420,470,850],coffee:[355,855,445,1060],door:[740,1030,1190,1280]},
   cam:[0,300,1150,1000],me:[200,460,'right'],queue:[[490,450,'left'],[490,590,'left'],[560,700,'left'],[630,760,'left']]},
  familymark:{name:'ファミリーマーク',en:'FamilyMark',color:'#4f9a32',ink:'#fff',half:['hot'],
   hs:{ice:[85,130,720,325],drink:[725,90,1715,325],snack:[160,340,1040,505],bento:[160,515,1040,665],daily:[160,680,1040,835],bread:[160,845,1040,1000],basket:[1045,340,1120,1000],register:[1400,330,1850,1010],hot:[1415,605,1540,930],coffee:[1395,1080,1850,1260],atm:[45,1085,165,1260],door:[205,1060,800,1260]},
   cam:[700,300,1920,1060],me:[1600,470,'left'],queue:[[1262,470,'right'],[1262,600,'right'],[1262,730,'right'],[1262,860,'right']]},
  seventwelve:{name:'セブントゥエルブ',en:'Seven Twelve',color:'#D58138',ink:'#fff',half:['bento','bread','saleFood'],dailyOff:0.9,
   hs:{drink:[40,65,1365,265],ice:[1365,90,1860,290],bento:[100,275,320,1050],snack:[410,275,625,1050],daily:[720,275,935,1050],sale:[1075,315,1705,468],saleFood:[1088,466,1698,512],magazine:[420,1065,735,1260],register:[1085,940,1200,1090],hot:[1265,995,1545,1110],coffee:[1730,990,1885,1215],atm:[1800,655,1890,860],door:[30,1065,415,1260]},
   cam:[700,520,1920,1280],me:[1240,850,'down'],queue:[[960,880,'right'],[960,1020,'right'],[1060,1150,'up'],[1180,1150,'up']]}
 };
 const ZT={drink:['飲み物','DRINK · 饮料柜'],ice:['アイスクリーム','ICE · 冰柜'],snack:['スナック','SNACK · 零食'],daily:['日用品','DAILY · 日用品'],bento:['お弁当','BENTO · 便当'],bread:['パン・スイーツ','BREAD · 面包甜点'],hot:['ホットスナック','HOT SNACK · 热食柜'],coffee:['コーヒー','COFFEE · 咖啡机'],sale:['特価','SALE · 日用品特价'],saleFood:['特価 · 見切り品','SALE · 临期食品'],magazine:['新聞・雑誌','NEWS · 报刊架'],register:['レジ','REGISTER · 收银台'],atm:['ATM','ATM'],door:['入口','EXIT · 离开'],basket:['カゴ','BASKET · 购物篮']};
 /* 每个热点卖哪些分区 */
 const ZONES=k=>k==='seventwelve'?{bento:['bento','bread'],sale:['daily']}:{};
 /* 商品目录（基准价）。hp=疲劳点（回复）stress=压力 san=SAN；stock=每店每日库存（null=不限量） */
 const C=[
  ['onigiri','おにぎり','饭团','bento',150,{hp:8},5,'🍙'],
  ['bento','弁当','便当','bento',550,{hp:25,stress:-3},3,'🍱'],
  ['sandwich','サンドイッチ','三明治','bento',320,{hp:14},4,'🥪'],
  ['pan','パン','面包','bread',180,{hp:9},5,'🥐'],
  ['pudding','プリン/ケーキ','布丁 / 蛋糕','bread',280,{stress:-8,hp:4},3,'🍮'],
  ['choco','チョコ','巧克力','snack',150,{stress:-5},5,'🍫'],
  ['snack','スナック','膨化零食','snack',160,{stress:-4,hp:3},5,'🍿'],
  ['ice','アイス','冰淇淋','ice',220,{stress:-7},3,'🍦'],
  ['hcoffee','ホットコーヒー','热咖啡','coffee',180,{stress:-6,hp:3},null,'☕'],
  ['cancoffee','缶コーヒー','罐装咖啡','drink',150,{stress:-5},5,'🥫'],
  ['tea','お茶','茶','drink',140,{stress:-3,san:1},5,'🍵'],
  ['water','ミネラルウォーター','矿泉水','drink',110,{hp:4},5,'💧'],
  ['energy','エナジードリンク','能量饮料','drink',350,{hp:20,stress:2},2,'⚡'],
  ['senko','線香','线香','daily',600,{san:10},2,'🪔'],
  ['umbrella','透明雨傘','透明雨伞','daily',550,{},1,'☂',{item:'umbrella',once:true,desc:'在雨里走路就不会淋湿。已经有一把的话，货架上不会再给你看。'}],
  ['flashlight','懐中電灯','手电筒','daily',900,{},1,'🔦',{item:'flashlight',once:true,desc:'夜里在暗处时，因为黑暗而损失的 SAN 减半。要装乾電池才能用（1 组 = 3 夜）。'}],
  ['battery','乾電池','干电池','daily',400,{},2,'🔋',{battery:3,desc:'手电筒用。1 组可以用 3 个夜晚。'}],
  ['karaage-m','モーソンからあげ','本店炸鸡块','hot',240,{hp:12,stress:-6},3,'🍗',{brand:'moson'}],
  ['chiki-f','マークチキ','本店炸鸡','hot',260,{hp:16,san:4},3,'🍗',{brand:'familymark'}],
  ['chiki-s','トゥエルブチキ','本店炸鸡','hot',250,{stress:-8,san:5},3,'🍗',{brand:'seventwelve'}],
  ['nikuman','肉まん','肉包','hot',180,{hp:10},4,'🥟'],
  ['anman','あんまん','豆沙包','hot',160,{stress:-5,hp:5},4,'🥟'],
  ['pizaman','ピザまん','披萨包','hot',190,{hp:11},4,'🥟'],
  ['oden-daikon','おでん大根','关东煮萝卜','hot',120,{hp:5,san:1},5,'🍢'],
  ['oden-tamago','おでん玉子','关东煮鸡蛋','hot',130,{hp:6},5,'🥚'],
  ['oden-chikuwa','おでんちくわ','关东煮竹轮','hot',140,{hp:7},5,'🍢'],
  ['oden-mori','おでん盛り合わせ','关东煮拼盘','hot',450,{hp:18,stress:-4,san:2},2,'🍲'],
  ['korokke','コロッケ','可乐饼','hot',130,{hp:7,stress:-2},4,'🥔'],
  ['yakitori','焼き鳥串','烤鸡肉串','hot',150,{hp:8},4,'🍢'],
  ['americandog','アメリカンドッグ','美式热狗','hot',220,{hp:12,stress:2},3,'🌭'],
  ...((GAME_CONFIG.v74||{}).shop||[]) // v74 新商品
 ].map(([id,jp,zh,zone,base,fx,stock,icon,x])=>Object.assign({id,jp,zh,zone,base,fx,stock,icon},x||{}));
 const CAT=Object.fromEntries(C.map(x=>[x.id,x]));
 for(const [id,bagId] of Object.entries((GAME_CONFIG.v74||{}).carry||{}))if(CAT[id])CAT[id].carry=bagId; // v74：饭团和饮料可以带走
 /* 报刊（Seven Twelve 报刊架）：定价，不乘系数，不打折 */
 const PAPERS={
  shuto:{jp:'首都新報',zh:'朝刊 · 日报',price:160,stock:8,color:'#1d3d6e',fx:{lang:2},
   days:[['南海トラフ 発生確率を再評価へ　政府調査委','南海海槽地震发生概率将重新评估　政府调查委员会','コメ5キロ、前年の1.4倍に','5 公斤大米涨到去年的 1.4 倍'],
    ['実質賃金 マイナス続く　物価高に追いつかず','实际工资持续负增长　追不上物价上涨','北品川 夜間に潮位上昇　気象台「原因を調査」','北品川夜间潮位上升，气象台：正在调查原因'],
    ['外国人労働者 過去最多に　受け入れ拡大の陰で摩擦も','外国劳动者人数创新高　扩大接收的背后也有摩擦','東京湾 潮位の高い状態続く','东京湾潮位持续偏高'],
    ['北品川で震度3　津波の心配なし','北品川震度 3　无海啸危险','運河沿いで原因不明の冠水　区が調査','运河沿岸不明原因积水，区政府调查中'],
    ['東京湾の異常潮位　専門家「地震との関連は不明」','东京湾异常潮位　专家称"与地震的关联尚不清楚"','卵1パック、初の400円台','一盒鸡蛋首次突破 400 日元']]},
  hagure:{jp:'夕刊ハグレ',zh:'小报',price:170,stock:6,color:'#c8281e',fx:{lang:1,stress:2},
   days:[['南海大地震「今月中」!? 元大学教授が衝撃予言','南海大地震"本月内"!? 前大学教授的惊人预言'],
    ['卵も米も電気も！ 値上げに庶民の悲鳴','鸡蛋、大米、电费全涨！老百姓叫苦连天'],
    ['"マナー違反"外国人に住民激怒　品川・路地裏の夜','居民怒斥"不守规矩"的外国人　品川·小巷之夜'],
    ['やっぱり来た！ 北品川の揺れは"前兆"だ','果然来了！北品川的摇晃是"前兆"'],
    ['東京湾に"黒い影"　釣り人が撮った決定的瞬間','东京湾的"黑影"　钓鱼人拍下的决定性瞬间']]},
  utsutsu:{jp:'週刊ウツツ',zh:'周刊',price:480,stock:3,color:'#e0a020',fx:{lang:3,stress:1},
   issues:[['値上げ地獄2026 ／ 「外国人お断り」の店はなぜ増えるのか','涨价地狱 2026 ／「谢绝外国人」的店为什么越来越多'],
    ['南海トラフ 首都圏は本当に大丈夫か ／ 湾岸タワマンの"水"問題','南海海槽地震，首都圈真的没事吗 ／ 湾岸高层公寓的"水"问题']]},
  abyss:{jp:'月刊アビス',zh:'神秘学月刊',price:980,stock:1,color:'#3a2a55',fx:{san:-3},once:true,
   line:['特集：東京湾の「扉」――江戸の古文書に記された『ナンカイの溝』','特集：东京湾的"门"——江户古文书中记载的"南海之沟"']}
 };
Object.assign(PAPERS,(GAME_CONFIG.v74||{}).papers||{}); // v74：深夜怪谈周刊（报刊架轮换）
 /* 小图：从布局图上截取的商品（任何品牌的图都可以借用，画风一致）[品牌, x, y, w, h] */
 const TH={onigiri:['moson',912,693,36,38],bento:['moson',705,686,52,50],sandwich:['moson',866,801,42,34],pan:['seventwelve',217,480,53,45],
  cancoffee:['seventwelve',550,117,40,43],tea:['seventwelve',55,117,40,43],water:['seventwelve',355,117,40,43],energy:['seventwelve',647,117,40,43],
  'chiki-f':['familymark',1432,662,48,43],'chiki-s':['familymark',1432,662,48,43],'karaage-m':['familymark',1432,715,48,40],korokke:['familymark',1432,762,48,33],
  nikuman:['familymark',1432,802,48,38],pizaman:['familymark',1432,802,48,38],anman:['familymark',1432,847,48,43],
  makunouchi:['seventwelve',145,507,52,33],hamburg:['seventwelve',145,585,52,37]};
 const ICON={onigiri:'meal/onigiri',bento:'meal/bento',sandwich:'bakery/sandwich',pan:'bakery/bread_roll',pudding:'chilled_dessert/pudding',choco:'snack/chocolate',snack:'snack/chips',ice:'frozen/ice_cream',hcoffee:'drink/coffee',cancoffee:'drink/coffee',tea:'drink/tea',water:'drink/water',energy:'drink/water',
  'karaage-m':'hot_food/fried_chicken','chiki-f':'hot_food/fried_chicken','chiki-s':'hot_food/fried_chicken',nikuman:'hot_food/steamed_bun',anman:'hot_food/steamed_bun',pizaman:'hot_food/steamed_bun','oden-daikon':'hot_food/oden','oden-tamago':'hot_food/oden','oden-chikuwa':'hot_food/oden','oden-mori':'hot_food/oden',korokke:'hot_food/fried_chicken',yakitori:'hot_food/fried_chicken',americandog:'hot_food/fried_chicken',senko:'daily/incense',umbrella:'daily/umbrella',flashlight:'daily/flashlight',battery:'daily/batteries'};
Object.assign(ICON,(GAME_CONFIG.v74||{}).shopIcons||{});
 const D=()=>Object.assign({coef:[0.85,1.15],halfFrom:21*60+30,halfUntil:5*60,saleStickers:[30,50,100],readMinutes:10,tabloidDay3Stress:4},(GAME_CONFIG.v53||{}).konbini||{});
 const art=k=>(window.KONBINI_ART||{})[k]||'';
 const yen=n=>'¥'+Math.round(n).toLocaleString('ja-JP');
 const r10=n=>Math.round(n/10)*10;

 /* ---------- 存档 ---------- */
 function S(){if(!campaign)return null;const s=campaign.kshop??={};s.stock??={};s.papers??=[];s.clips??=[];s.flags??={};return s}
 let poolCache=null;
 function pool(){
  if(poolCache)return poolCache;
  try{poolCache=Object.values(byId).filter(s=>{try{return makeDistrictPlan(s).spots.some(sp=>sp[4]==='conv')}catch(e){return false}}).map(s=>s.id)}catch(e){poolCache=[]}
  return poolCache;
 }
 function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 /* 改动 1 / 2：开局分配品牌与价格系数；旧存档缺字段时补生成；新车站补发给当前最少的品牌 */
 function alloc(){
  if(!campaign)return;const P=pool(),keys=['moson','familymark','seventwelve'],[lo,hi]=D().coef;
  const coef=()=>Math.round((lo+Math.random()*(hi-lo))*100)/100;
  let ch=campaign.konbiniChains,pr=campaign.konbiniPrice,changed=false;
  if(!ch||typeof ch!=='object'){ch={};shuffle(P).forEach((id,i)=>ch[id]=keys[i%3]);campaign.konbiniChains=ch;changed=true}
  for(const id of P)if(!keys.includes(ch[id])){const n=keys.map(k=>Object.values(ch).filter(v=>v===k).length);ch[id]=keys[n.indexOf(Math.min(...n))];changed=true}
  if(!pr||typeof pr!=='object'){pr={};campaign.konbiniPrice=pr;changed=true}
  for(const id of P)if(!(pr[id]>=lo&&pr[id]<=hi)){pr[id]=coef();changed=true}
  if(changed)campaignSave();
 }
 const brandOf=id=>{alloc();return (campaign&&campaign.konbiniChains||{})[id]||null};
 const coefOf=id=>{alloc();return (campaign&&campaign.konbiniPrice||{})[id]||1};
 function nowMin(){if(proMode){try{const c=PRO.state().clock;if(c!=null)return ((Math.round(c)%1440)+1440)%1440}catch(e){}}try{const m=TM.now();return m==null?12*60:((Math.round(m)%1440)+1440)%1440}catch(e){return 12*60}}
 function halfTime(){const m=nowMin(),d=D();return m>=d.halfFrom||m<d.halfUntil}
 /* 简单可复现的随机：同一店、同一天结果一样 */
 function seeded(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return ()=>{h=Math.imul(h^(h>>>15),2246822507);h=Math.imul(h^(h>>>13),3266489909);h^=h>>>16;return (h>>>0)/4294967296}}

 /* ---------- 店内状态（不存档：离店清空） ---------- */
 let st=null,stationObj=null,brand=null,openZone=null,selKey=null,basket=[],msg='',menu=null,lastBack=null;
 const isST=()=>brand==='seventwelve';
 function dayKey(){return stationObj.id+':'+campaign.day}
 function stockBook(){const s=S(),k=dayKey();for(const x of Object.keys(s.stock))if(x.startsWith(stationObj.id+':')&&x!==k)delete s.stock[x];return s.stock[k]??={}}
 /* 特价墙最下层：每天随机 3–4 样临期食品，每样 1–2 个 */
 function saleList(){
  const R=seeded('sale:'+dayKey()),pool=['onigiri','bento','sandwich','pan','pudding'],n=3+(R()<.5?1:0),out=[];
  const ex=['今天 23:00','明天 02:00','明天 10:00'];
  const p=pool.slice();for(let i=p.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[p[i],p[j]]=[p[j],p[i]]}
  for(const id of p.slice(0,n))out.push({id,stock:1+(R()<.5?1:0),sticker:D().saleStickers[Math.floor(R()*3)],exp:ex[Math.floor(R()*3)]});
  return out;
 }
 let saleCache=null;
 function sale(){if(!saleCache||saleCache.k!==dayKey())saleCache={k:dayKey(),list:saleList()};return saleCache.list}
 /* 某个热点里的货品行 */
 function rows(zone){
  if(zone==='saleFood')return sale().map(s=>({key:'sale:'+s.id,id:s.id,src:'sale',sale:s}));
  if(zone==='magazine')return Object.keys(PAPERS).filter(id=>!(PAPERS[id].once&&S().flags.abyss)&&!(PAPERS[id].rotate&&seeded('mag:'+id+':'+dayKey())()>=.5)).map(id=>({key:'paper:'+id,id,src:'paper'}));
  const zs=ZONES(brand)[zone]||[zone];
  return C.filter(x=>zs.includes(x.zone)&&(!x.brand||x.brand===brand)&&!(x.item&&x.once&&(campaign.items||{})[x.item]>0)&&!(proMode&&x.item==='umbrella')).map(x=>({key:'n:'+x.id,id:x.id,src:'n',zone:x.zone}));
 }
 function def(row){return row.src==='paper'?PAPERS[row.id]:CAT[row.id]}
 function unit(row){
  if(row.src==='paper')return PAPERS[row.id].price;
  const it=CAT[row.id];if(it.fixed)return it.base;let u=r10(it.base*coefOf(stationObj.id));
  if(isST()&&it.zone==='daily'&&row.src==='n')u=r10(u*(BR.seventwelve.dailyOff||1));
  return u;
 }
 function halfApplies(row){if(!halfTime())return false;if(row.src==='sale')return BR[brand].half.includes('saleFood');return row.src==='n'&&BR[brand].half.includes(CAT[row.id].zone)}
 function price(row){
  const u=unit(row);if(row.src==='paper')return u;
  if(halfApplies(row))return Math.max(10,r10(u/2));
  if(row.src==='sale')return Math.max(10,u-row.sale.sticker);
  return u;
 }
 function cap(row){if(row.src==='paper')return PAPERS[row.id].stock;if(row.src==='sale')return row.sale.stock;return CAT[row.id].stock}
 function left(row){
  const c=cap(row);if(c==null)return Infinity;
  const used=stockBook()[row.key]||0;if(row.src==='paper'&&PAPERS[row.id].once&&S().flags.abyss)return 0;
  return Math.max(0,c-used);
 }
 const inBasket=key=>(basket.find(b=>b.key===key)||{}).qty||0;
 function findRow(key){for(const z of Object.keys(BR[brand].hs)){const r=rows(z).find(x=>x.key===key);if(r)return r}return null}
 function add(key,d){
  const row=findRow(key);if(!row)return;const L=basket.find(b=>b.key===key);const q=(L?L.qty:0)+d;
  if(d>0){
   if(q>left(row)){msg='货架上没有更多了。';render();return}
   const it=def(row);if((it.once||(it.item&&it.once))&&q>1){msg='这个拿一件就够了。';render();return}
  }
  if(L){L.qty=q;if(q<=0)basket=basket.filter(b=>b!==L)}else if(q>0)basket.push({key,qty:q,row});
  if(window.AUDIO)AUDIO.sfx(d>0?'click':'page');msg='';render();
 }
 const total=()=>basket.reduce((s,b)=>s+price(b.row)*b.qty,0);

 /* ---------- 效果文字 ---------- */
 function fxChips(fx){
  const out=[];
  if(fx.hp)out.push(`<span class="ft">⚡ 疲劳 ${fx.hp>0?'+':''}${fx.hp}</span>`);
  if(fx.stress)out.push(`<span class="${fx.stress>0?'bad':'ps'}">💢 压力 ${fx.stress>0?'+':''}${fx.stress}</span>`);
  if(fx.san)out.push(`<span class="${fx.san>0?'sn':'bad'}">👁 SAN ${fx.san>0?'+':''}${fx.san}</span>`);
  if(fx.lang)out.push(`<span class="ps">あ 日本語 +${fx.lang}</span>`);
  return out.join('');
 }
 function rowFx(row){
  if(row.src==='paper'){const p=PAPERS[row.id],fx=Object.assign({},p.fx);if(row.id==='hagure'&&campaign.day===3)fx.stress=D().tabloidDay3Stress;return fxChips(fx)+(row.id==='abyss'?'<span class="ft">📁 档案碎片</span>':'')}
  const it=CAT[row.id];if(it.item==='flashlight')return '<span class="ps">🌙 暗处 SAN 损失减半</span>';if(it.battery)return `<span class="ps">🔋 +${it.battery} 夜</span>`;if(it.item==='umbrella')return '<span class="ps">☔ 雨中不淋湿</span>';
  if(it.use)return `<span class="ps">🎒 ${esc(it.use)}</span>`;if(it.wmBattery)return `<span class="ps">🔋 随身听 +${it.wmBattery} 次</span>`;
  return fxChips(it.fx)+(it.carry?'<span class="ps">🎒 可带走</span>':'');
 }
 function thumb(row){
  if(row.src==='paper'){const p=PAPERS[row.id];return `<div class="ks-np"><b style="background:${p.color}">${esc(p.jp)}</b><i></i><i></i><i></i><u></u><em>${esc(headline(row.id)[0].slice(0,8))}</em></div>`}
  const ic=ICON[row.id]&&(window.KONBINI_ICONS||{})[ICON[row.id]];if(ic)return `<div class="ks-th ks-ico"><img alt="" src="${ic}"></div>`;
  const t=TH[row.id];
  if(!t||!art(t[0]))return `<div class="ks-th ks-emoji">${CAT[row.id].icon}</div>`;
  const [k,x,y,w,h]=t,sc=Math.min(76/w,62/h);
  return `<div class="ks-th" style="background-image:url(${art(k)});background-size:${1920*sc}px ${1280*sc}px;background-position:${-x*sc+(80-w*sc)/2}px ${-y*sc+(66-h*sc)/2}px"></div>`;
 }
 function headline(id){
  const p=PAPERS[id],d=Math.max(1,campaign.day||1);
  if(p.days)return p.days[Math.min(p.days.length,d)-1];
  if(p.issues)return p.issues[d>=5?1:0];
  return p.line;
 }
 function descOf(row){
  if(row.src==='paper'){const h=headline(row.id);return `<b>${esc(PAPERS[row.id].jp)} · 今天的${row.id==='utsutsu'?'封面':row.id==='abyss'?'特集':'头版'}</b><span class="ks-jp" lang="ja">${esc(h[0])}</span>${esc(h[1])}<br><small>按定价卖，三家一个价，不打折 · 买下后可以读，每读一份花 ${D().readMinutes} 分钟 · 读完记进档案「07 报纸剪报」</small>`}
  const it=CAT[row.id];let t=it.desc||'';
  if(row.src==='sale')t=`离过期不远（⏳ ${row.sale.exp}）。白天贴的是「${row.sale.sticker}円引」，21:30 以后整层改贴「半額」。`;
  else if(halfApplies(row))t='已经过了 21:30，这一层贴上了红色的「半額」。'+(t?'<br>'+t:'');
  else if(BR[brand].half.includes(it.zone))t=(t?t+'<br>':'')+'晚上 9 点半以后半价。';
  if(isST()&&it.zone==='daily')t=(t?t+'<br>':'')+'Seven Twelve 的日用品打九折（特価）。';
  if(it.brand)t=(t?t+'<br>':'')+'只有 '+BR[it.brand].en+' 卖。';
  return `<b>${esc(it.jp)}</b>　${t||esc(it.zh)}`;
 }

 /* ---------- 画面 ---------- */
 function pct(r){return `left:${r[0]/19.2}%;top:${r[1]/12.8}%;width:${(r[2]-r[0])/19.2}%;height:${(r[3]-r[1])/12.8}%`}
 function paneHtml(){
  if(!openZone)return '';
  const B=BR[brand],r=B.hs[openZone],right=(r[0]+r[2])/2<960;
  const posX=right?`left:${Math.min(r[2]/19.2+1,52)}%`:`right:${Math.min(100-r[0]/19.2+1,52)}%`,posY=`top:${Math.max(2,Math.min(r[1]/12.8,40))}%`;
  const head=(t,en,extra)=>`<div class="ks-hd"><b>${t}</b><i>${en}</i>${extra?`<span class="ks-cf">${extra}</span>`:''}<button type="button" class="ks-x" data-act="close" aria-label="关闭">✕</button></div>`;
  if(openZone==='register')return `<div class="ks-pane" style="${posX};${posY}">${head('レジ','REGISTER · 收银台')}<div class="ks-menu">
    <button type="button" class="survival-btn" data-act="checkout" ${basket.length?'':'disabled'}>🧾 结账 · 合计 ${yen(total())}</button>
    ${proMode?'<p class="survival-tip">收银台后面是グエン。今晚只有他一个人看店。</p>':`<button type="button" class="survival-btn alt" data-act="work">🏪 打工（便利店收银 · 快速打工）</button>
    <button type="button" class="survival-btn alt" data-act="talk">🗣 和店员聊几句（日语练习 · 不消耗行动）</button>`}
    ${nguyenOk()?'<button type="button" class="survival-btn alt" data-act="nguyen">🗞 把那份小报递给店员グエン</button>':''}
    ${S().papers.length?`<button type="button" class="survival-btn alt" data-act="read">📰 读报（未读 ${S().papers.length} 份）</button>`:''}</div></div>`;
  const list=rows(openZone);
  const extra=openZone==='magazine'?'定价 · 不打折':openZone==='saleFood'?(halfTime()?'21:30 后全部半額':'白天贴减价贴'):(B.half.includes(openZone)||(ZONES(brand)[openZone]||[]).some(z=>B.half.includes(z)))?(halfTime()?'现在半額':'21:30 后半額'):'本店价 ×'+coefOf(stationObj.id).toFixed(2);
  const sel=list.find(x=>x.key===selKey)||list[0];
  return `<div class="ks-pane" style="${posX};${posY}">${head(ZT[openZone][0],ZT[openZone][1],extra)}<div class="ks-list">${list.map(row=>{const d=def(row),p=price(row),u=unit(row),c=cap(row),l=left(row),q=inBasket(row.key);
    const tag=row.src==='paper'?`<div class="ks-tag fix"><small>定価</small>${yen(p)}</div>`:p!==u?`<div class="ks-tag half"><s>${yen(u)}</s>${yen(p)}<span class="ks-stk">${halfApplies(row)?'半額':row.sale.sticker+'円引'}</span></div>`:`<div class="ks-tag"><small>税込</small>${yen(p)}</div>`;
    const pip=c==null?'<div class="ks-pip inf">不限量</div>':`<div class="ks-pip${l-q<=1?' low':''}">${Array.from({length:c},(_,k)=>`<u class="${k<l-q?'':'e'}"></u>`).join('')}</div>`;
    return `<div class="ks-it${row===sel?' sel':''}" data-sel="${row.key}">${thumb(row)}<div class="ks-nm"><div><span lang="ja">${esc(d.jp)}</span>${row.src==='n'&&CAT[row.id].brand?'<span class="ks-lim">本店限定</span>':''}<small>${esc(d.zh)}</small></div><div class="ks-fx">${rowFx(row)}${row.src==='sale'?`<span class="exp">⏳ ${row.sale.exp}</span>`:''}</div></div><div>${tag}${pip}</div><button type="button" class="ks-add" data-add="${row.key}" ${l-q<=0?'disabled':''} aria-label="放进篮子">＋${q?`<em>${q}</em>`:''}</button></div>`}).join('')||'<p class="survival-tip">（今天这里没有货）</p>'}</div>
   ${sel?`<div class="ks-desc">${descOf(sel)}</div>`:''}</div>`;
 }
 function render(){
  if(!st)return;const B=BR[brand],s=S();
  const hs=Object.entries(B.hs).map(([z,r])=>`<button type="button" class="ks-hot${openZone===z?' on':''}${z==='door'?' door':''}" data-zone="${z}" style="${pct(r)}" aria-label="${ZT[z][0]} ${ZT[z][1]}"><span>${ZT[z][0]}</span></button>`).join('');
  const t=total(),cash=campaign.cash;
  app.innerHTML=`<div class="rpg-shell ks-shell" style="--brand:${B.color}"><section class="rpg-panel ks-panel">
   <div class="ks-top"><div class="ks-name">${B.name} · ${B.en}　<b>${esc(stationObj.jp)}店</b></div><div class="ks-meta"><span>🕘 ${TM.fmt(nowMin())}${halfTime()?' · <em>半額タイム</em>':''}</span><span>本店价 ×${coefOf(stationObj.id).toFixed(2)}</span><button type="button" class="rpg-inline-back" data-act="leave">← 离开（${proMode?'回到雨夜的站前':esc(stationObj.jp)+' 街区'}）</button></div></div>
   <div class="ks-stage" style="background-image:url(${art(brand)})">${hs}${paneHtml()}</div>
   <div class="ks-bar"><span class="ks-bk">🧺 购物篮</span><div class="ks-chips">${basket.map(b=>`<span class="ks-chip"><span lang="ja">${esc(def(b.row).jp)}</span><b>×${b.qty}</b>${yen(price(b.row)*b.qty)}${b.row.src==='n'&&CAT[b.row.id].carry?`<button type="button" class="ks-carry" data-carry="${b.key}" aria-label="现在吃或带走">${b.carry?'🎒 带走':'🍴 现在吃'}</button>`:''}<button type="button" data-dec="${b.key}" aria-label="减一件">−</button><button type="button" data-inc="${b.key}" aria-label="加一件">＋</button></span>`).join('')||'<small>点货架挑商品；结账请到收银台。</small>'}</div><span class="ks-cash">现金 ${yen(cash)}</span><span class="ks-tot">合计 ${yen(t)}</span><button type="button" class="ks-pay" data-act="checkout" ${basket.length?'':'disabled'}>到收银台结账</button></div>
   ${msg?`<p class="ks-msg" role="status">${msg}</p>`:''}
   <p class="rpg-tiny ks-foot">便利店 24 小时营业 · 购物不消耗行动 · 离开时没结账的东西会放回货架。${isST()?' · 门口报刊架卖报纸杂志，特价墙最下层是临期食品。':''}</p>
  </section></div>`;
  UI.update&&UI.update();
 }
 function onClick(e){
  if(!st)return;const b=e.target.closest('[data-zone],[data-act],[data-add],[data-dec],[data-inc],[data-sel],[data-carry]');if(!b)return;
  if(b.dataset.carry){const L=basket.find(x=>x.key===b.dataset.carry);if(L){L.carry=!L.carry;msg=L.carry?'这一份带走：放进背包，饿了再从背包拿出来。':'';render()}return}
  if(b.dataset.add){add(b.dataset.add,1);return}
  if(b.dataset.inc){add(b.dataset.inc,1);return}
  if(b.dataset.dec){add(b.dataset.dec,-1);return}
  if(b.dataset.sel){selKey=b.dataset.sel;render();return}
  if(b.dataset.zone){zone(b.dataset.zone);return}
  ({close:()=>{openZone=null;render()},leave,checkout,work,talk,nguyen,read:()=>readMenu()}[b.dataset.act]||(()=>{}))();
 }
 function zone(z){
  msg='';
  if(z==='door'){leave();return}
  if(z==='atm'){UI.toast('ATM 的屏幕亮着：「お取引を選んでください」（请选择业务）。你没有日本的银行卡。');return}
  if(z==='basket'){UI.toast('カゴ——购物篮。你已经拿了一个。');return}
  openZone=openZone===z?null:z;selKey=null;if(window.AUDIO)AUDIO.sfx('page');render();
 }
 function enter(station){
  if(!campaign||!station)return false;alloc();
  const b=brandOf(station.id);if(!b)return false;
  stationObj=station;brand=b;st={};openZone=null;selKey=null;basket=[];msg='';saleCache=null;
  UI.scene('konbini-shop',()=>{if(st)render();else enter(station)});if(window.AUDIO)AUDIO.ambience('lobby');
  render();window.scrollTo(0,0);
  if(window.AUDIO)AUDIO.sfx('ding');
  return true;
 }
 function close(){st=null;basket=[];openZone=null}
 function leave(){
  const go=()=>{const s=stationObj;close();if(proMode){proMode=false;try{PRO.resume()}catch(e){console.error(e);tokyoHome()}return}if(s&&typeof district!=='undefined'&&district&&district.id===s.id){renderDistrict()}else tokyoHome()};
  if(basket.length)UI.confirm('离开便利店？','篮子里没结账的东西会放回货架。',go);else go();
 }
 /* 改动 4：结账 —— 统一扣款、统一生效、结账时扣库存 */
 function checkout(){
  if(!basket.length)return;
  for(const b of basket){if(b.qty>left(b.row)){msg='「'+esc(def(b.row).jp)+'」卖完了，从篮子里拿掉吧。';render();return}}
  const t=total();
  if(campaign.cash<t){msg=`<b>现金不够：</b>还差 ${yen(t-campaign.cash)}。可以点 − 拿掉几件再结账。`;openZone='register';render();return}
  if(campaign.cash-t<=0){msg='<b>付完就一分不剩了</b>——现金归零游戏就结束了。拿掉一件再结账吧。';openZone='register';render();return}
  const fx={hp:0,stress:0,san:0},got=[],lines=[],s=S(),book=stockBook();
  for(const b of basket){
   const d=def(b.row),p=price(b.row);lines.push([d.jp,b.qty,p*b.qty]);
   book[b.row.key]=(book[b.row.key]||0)+b.qty;
   if(b.row.src==='paper'){for(let i=0;i<b.qty;i++)s.papers.push({id:b.row.id,day:campaign.day,h:headline(b.row.id)});if(PAPERS[b.row.id].once)s.flags.abyss=true;continue}
   const it=CAT[b.row.id];
   if(it.carry&&b.carry){campaign.items??={};campaign.items[it.carry]=(campaign.items[it.carry]||0)+b.qty;got.push(it.icon+' '+it.jp+' ×'+b.qty+'（带走）');continue} // v74：带走的进背包
   if(it.wmBattery){campaign.items??={};campaign.items['wm-battery']=(campaign.items['wm-battery']||0)+it.wmBattery*b.qty;got.push('🔋 随身听电池 +'+it.wmBattery*b.qty+' 次');continue}
   if(it.item){campaign.items??={};campaign.items[it.item]=(campaign.items[it.item]||0)+(it.itemN||1)*b.qty;got.push(it.icon+' '+it.jp);continue}
   if(it.battery){campaign.items??={};campaign.items.battery=(campaign.items.battery||0)+it.battery*b.qty;got.push('🔋 乾電池 +'+it.battery*b.qty+' 夜');continue}
   for(const k of ['hp','stress','san'])fx[k]+=(it.fx[k]||0)*b.qty;
  }
  const res=[GS.change({cash:-t,hp:fx.hp,stress:fx.stress},'')];
  if(fx.san)res.push(GS.change({san:fx.san},'便利店'));
  basket=[];msg='';openZone=null;campaignSave();
  if(window.AUDIO)AUDIO.sfx('coin');
  const papers=lines.some(l=>Object.values(PAPERS).some(p=>p.jp===l[0]));
  UI.modal({title:'🧾 レシート · '+BR[brand].en+' '+stationObj.jp+'店',html:`<div class="ks-receipt">${lines.map(([n,q,p])=>`<div><span lang="ja">${esc(n)}</span><b>×${q}</b><em>${yen(p)}</em></div>`).join('')}<div class="sum"><span>合計</span><em>${yen(t)}</em></div></div>${got.length?`<p>获得：${got.map(esc).join('、')}</p>`:''}<p class="rpg-tiny">${esc(res.filter(Boolean).join(' · '))}</p>`,
   buttons:papers?[{label:'📰 现在读报',primary:true,fn:()=>readMenu()},{label:'继续逛'}]:[{label:'继续逛',primary:true}]});
  if(GS.dead()){close();survivalStatus();return}
  render();
 }
 function work(){
  if(!campaign.firstDayComplete||campaign.day<2){UI.toast('第一天还在赶路，明天再来打工吧。');return}
  if((campaign.actions||0)<=0&&!(campaign.konbini&&campaign.konbini.shift)){UI.modal({title:'今天的行动已用完',text:'明天可以再来打工。'});return}
  KWORK.setStore(stationObj.id);const s=stationObj;close();workShift();
 }
 function talk(){const s=stationObj;close();if(typeof district!=='undefined')district=s;renderDistrict();freeTalk=true;try{baseStart('conv')}finally{freeTalk=false}}
 /* DAY 3 的小报：在品川店把它递给グエン */
 function nguyenOk(){const s=S();return stationObj&&stationObj.id==='shinagawa'&&!s.flags.nguyen&&(s.papers.concat(s.clips)).some(p=>p.id==='hagure'&&p.day===3)}
 function nguyen(){S().flags.nguyen=true;campaignSave();UI.modal({title:'グエン',html:'<p>你把那份小报放在柜台上。她低头看了一眼标题，手停了一下。</p><p class="ks-jp" lang="ja">「……あ、それ、知ってます。」</p><p>“……啊，那个，我知道的。”</p><p>她把报纸叠好，推回给你，继续给下一位客人结账。</p>',buttons:[{label:'……',primary:true}]});render()}
 /* 读报：每份 10 分钟；效果；记进档案「07 报纸剪报」 */
 function readMenu(){
  const s=S();if(!s.papers.length){UI.toast('没有没读过的报纸。');return}
  UI.modal({title:'📰 读报',html:'<p>选一份来读（每份花 '+D().readMinutes+' 分钟）。</p>',buttons:s.papers.map((p,i)=>({label:PAPERS[p.id].jp+'（DAY '+p.day+'）',fn:()=>read(i)})).concat([{label:'先不读'}])});
 }
 function read(i){
  const s=S(),p=s.papers[i];if(!p)return;const P=PAPERS[p.id];s.papers.splice(i,1);
  const fx=Object.assign({},P.fx);if(p.id==='hagure'&&p.day===3)fx.stress=D().tabloidDay3Stress;
  try{V51.dayTime(D().readMinutes)}catch(e){}
  if(fx.lang)try{V51.gain(fx.lang)}catch(e){}
  const res=[GS.change({stress:fx.stress||0},'')];if(fx.san)res.push(GS.change({san:fx.san},'读了神秘学月刊'));
  if(!s.clips.some(c=>c.id===p.id&&c.day===p.day))s.clips.push({id:p.id,day:p.day,h:p.h,frag:p.id==='abyss'});
  campaignSave();
  UI.modal({title:'📰 '+P.jp+'（DAY '+p.day+'）',html:`<div class="ks-paper" style="--pc:${P.color}"><b class="mh">${esc(P.jp)}</b><p class="ks-jp" lang="ja">${esc(p.h[0])}</p><p>${esc(p.h[1])}</p>${p.h[2]?`<p class="sub"><span lang="ja">${esc(p.h[2])}</span><small>${esc(p.h[3])}</small></p>`:''}</div>${p.id==='abyss'?'<p>夹页里有一张手抄的古文书影印：「南海の溝に扉あり」。你把它剪下来，夹进了档案。</p>':''}${p.id==='hagure'&&p.day===3?'<p>标题下面配着一张照片：路灯下几个外国人的背影。你把报纸翻过去，过了一会儿才继续往下读。</p>':''}<p class="rpg-tiny">${esc(['阅读 '+D().readMinutes+' 分钟',fx.lang?'日本語理解度 +'+fx.lang:'',...res].filter(Boolean).join(' · '))}</p><p class="rpg-tiny">已记进档案「07 报纸剪报」。</p>`,buttons:[{label:'好',primary:true,fn:()=>{if(st)render()}}]});
 }
 /* 档案 07 */
 function archiveSection(){
  const s=S();if(!s)return '';
  const list=s.clips.slice().sort((a,b)=>a.day-b.day);
  return `<section class="rpg-panel et-file" id="file-7"><div class="et-file-no">FILE 07</div><h2>📰 报纸剪报（${list.length}）</h2>${list.length?list.map(c=>`<div class="story-entry"><b>DAY ${c.day} · ${esc(PAPERS[c.id].jp)}</b> <span lang="ja">${esc(c.h[0])}</span><small>　${esc(c.h[1])}</small>${c.frag?'<small>　📁 档案碎片：江户古文书的抄本「南海の溝に扉あり」</small>':''}</div>`).join(''):'<p class="survival-tip">（尚无记录。Seven Twelve 的报刊架卖报纸和杂志。）</p>'}${s.papers.length?`<button type="button" class="survival-btn alt" id="ks-read">📰 读报（未读 ${s.papers.length} 份）</button>`:''}<p class="rpg-tiny">剪报只是街上的新闻，不是调查证据。</p></section>`;
 }
 /* DAY 4：臨時ニュース 降级为首都新報的小标题（地图提示和调查局邮件不变） */
 function floodNotice(){
  if(window.AUDIO)AUDIO.sfx('ding');
  UI.modal({title:'📧 调查局来信',html:'<p>调查局发来一封邮件：【紧急】品川区域异常浸水 / 处置建议。</p><p class="rpg-tiny">街上一切照常。只有今天早上的报纸，在不起眼的地方登了一小块。</p>',buttons:[{label:'打开邮件',primary:true,fn:()=>{try{if(window.MAIL&&MAIL.page)MAIL.page()}catch(e){}}},{label:'稍后再看'}]});
 }
 function floodClip(){const h=PAPERS.shuto.days[3];UI.modal({title:'📰 首都新報 · 地方版（小さな記事）',html:`<div class="ks-paper" style="--pc:${PAPERS.shuto.color}"><b class="mh">首都新報</b><p class="sub"><span lang="ja">${esc(h[2])}</span><small>${esc(h[3])}</small></p></div><p>只有三行字，登在第二十三版的角落。旁边是一则商店街夏日祭的广告。</p>`,buttons:[{label:'好',primary:true}]})}

 /* ---------- 改动 6：手电筒 ---------- */
 let darkOnce=false,mDark=false;
 const usable=()=>!!(campaign&&(campaign.items||{}).flashlight>0&&(campaign.items||{}).battery>0);
 function darkNow(){if(mDark)return true;try{const v=campaign.hotelCase&&campaign.hotelCase.v18;if(window.H18&&H18.active()&&v&&v.flags&&v.flags['tonight:inDark'])return true}catch(e){}return false}
 function overnight(){
  if(!campaign||!((campaign.items||{}).flashlight>0))return;const it=campaign.items;
  if((it.battery||0)>0){it.battery--;if(!it.battery){delete it.battery;S().flags.flashWarn=campaign.day+1}campaignSave()}
 }
 const DARK_PERIL=['b2','canal','pond','exit','sumida'];

 /* ---------- 序章：品川站前（グエン的店） ---------- */
 let proMode=false,signCache=null;
 function sign(){
  const id='shinagawa';let b=null;try{b=campaign&&(campaign.konbiniChains||{})[id];if(!b){alloc();b=(campaign.konbiniChains||{})[id]}}catch(e){}
  if(!b)return {short:'コンビニ',color:'#2f9a5e',dark:'#1e6b40',body:'#1e3a2e'};
  if(signCache&&signCache.b===b)return signCache.v;const B=BR[b];const v={short:B.en,color:B.color,dark:{moson:'#1d5f92',familymark:'#2f6b1e',seventwelve:'#9a5520'}[b],body:{moson:'#16304a',familymark:'#1e3a2e',seventwelve:'#3a2a1e'}[b]};signCache={b,v};return v;
 }
 function enterPrologue(){
  if(!campaign||!byId||!byId.shinagawa)return false;alloc();if(!brandOf('shinagawa'))return false;
  proMode=true;const ok=enter(byId.shinagawa);if(!ok){proMode=false;return false}
  setTimeout(()=>UI.toast('グエン：「いらっしゃいませ。ゆっくり見てください。」（欢迎光临，慢慢看。）'),200);return true;
 }
 /* ---------- 安装 ---------- */
 let baseStart=null,freeTalk=false;
 function install(){
  for(const x of [{id:'flashlight',icon:'🔦',name:'懐中電灯（手电筒）',desc:'夜里在暗处时，因为黑暗损失的 SAN 减半（向下取整）。要有乾電池才亮。'},{id:'battery',icon:'🔋',name:'乾電池（剩余夜数）',desc:'手电筒的电量：数字是还能用几个夜晚。每过一夜用掉 1 夜。'}])if(!ITEMS.some(y=>y.id===x.id))ITEMS.push(x);
  /* 街区「商店街 / コンビニ」：进店 → 店内场景 */
  /* 收银台「和店员聊几句」不消耗行动 */
  const baseSpend=spendAction;spendAction=function(type){if(freeTalk&&type==='study'){freeTalk=false;return !!campaign&&campaign.hp>0&&campaign.san>0&&campaign.cash>0}return baseSpend.apply(this,arguments)};
  baseStart=start;start=function(id){if(id==='conv'&&campaign&&typeof district!=='undefined'&&district&&UI.current()==='district'&&pool().includes(district.id)&&!KSHOP._bypass){return enter(district)}return baseStart.apply(this,arguments)};
  const baseSel=selectSpot;selectSpot=function(id){const r=baseSel.apply(this,arguments);try{const sp=makeDistrictPlan(district).spots.find(x=>x[0]===id);const b=document.getElementById('district-start');if(sp&&sp[4]==='conv'&&b&&pool().includes(district.id)){b.textContent='🏪 走进 '+BR[brandOf(district.id)].name+'（'+BR[brandOf(district.id)].en+'）';const p=b.previousElementSibling;if(p&&p.tagName==='P')p.textContent='便利店 24 小时营业。购物不消耗行动。'}}catch(e){}return r};
  const baseHome=tokyoHome;tokyoHome=function(){alloc();const r=baseHome.apply(this,arguments);const s=S();if(s&&s.flags.flashWarn&&s.flags.flashWarn<=campaign.day){delete s.flags.flashWarn;campaignSave();setTimeout(()=>UI.toast('🔦 手电筒没电了。去便利店买乾電池吧。'),600)}return r};
  const baseClose=nightlyClose;nightlyClose=function(){overnight();return baseClose.apply(this,arguments)};
  /* 档案 07 */
  new MutationObserver(()=>{const f6=app.querySelector('#file-6');if(!f6||app.querySelector('#file-7')||!campaign)return;
   f6.insertAdjacentHTML('afterend',archiveSection());const b=app.querySelector('#ks-read');if(b)b.onclick=readMenu;
   const nav=app.querySelector('.et-files-tabs');if(nav&&!nav.querySelector('[data-file="7"]')){nav.insertAdjacentHTML('beforeend','<a href="#file-7" data-file="7">07 报纸剪报</a>');nav.lastElementChild.onclick=e=>{e.preventDefault();app.querySelector('#file-7').scrollIntoView({behavior:'smooth',block:'start'})}}}).observe(app,{childList:true});
  /* 改动 6：黑暗中的 SAN 损失减半 */
  if(window.MAGGOT&&MAGGOT.dark){const bd=MAGGOT.dark;MAGGOT.dark=function(on){mDark=!!on;return bd.apply(this,arguments)}}
  try{for(const k of DARK_PERIL){const e=PERIL.events[k];if(!e)continue;for(const c of e.choices){const o=c[1];if(!o||o.death||typeof o.san!=='number')continue;const v=o.san;Object.defineProperty(o,'san',{configurable:true,enumerable:true,get(){if(v<0)darkOnce=true;return v}})}}}catch(e){console.error(e)}
  const baseChange=GS.change;GS.change=function(d,reason){
   const dark=darkOnce||darkNow();darkOnce=false;
   if(d&&d.san<0&&dark&&usable()){const cut=-Math.floor(-d.san/2);d=Object.assign({},d,{san:cut});setTimeout(()=>UI.toast('🔦 手电筒照亮了四周（因黑暗损失的 SAN 减半）'),300)}
   return baseChange.call(this,d,reason)};
  document.addEventListener('click',e=>{if(st&&app.contains(e.target)&&e.target.closest('.ks-shell'))onClick(e)});
 }
 return {install,enter,enterPrologue,sign,isPrologue:()=>proMode,alloc,brandOf,coefOf,pool,leave,floodNotice,floodClip,readMenu,archiveSection,BR,CAT,PAPERS,_state:()=>({st,brand,station:stationObj&&stationObj.id,basket,openZone,msg}),_add:add,_zone:zone,_checkout:checkout,_rows:rows,_price:price,_unit:unit,_left:left,_read:read,_overnight:overnight,_usable:usable,_bypass:false};
})();
window.KSHOP=KSHOP;

