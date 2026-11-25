/* ==== engine/survival/10-tokyo-map.js ==== */
/* 【东京地图、车站街区探索（建筑、移动、向导 NPC）】 */
const storeKey='tokyo-quest-rpg-v1';
let progress;try{progress=JSON.parse(localStorage.getItem(storeKey))||{exp:0,correct:0,wrong:0,visits:{}}}catch(e){progress={exp:0,correct:0,wrong:0,visits:{}}}
function save(){try{localStorage.setItem(storeKey,JSON.stringify(progress))}catch(e){}}
const lines=[
 {id:'y',name:'JR 山手線',color:'#82b955',st:['shinjuku','yoyogi','harajuku','shibuya','ebisu','meguro','gotanda','osaki','shinagawa','takanawa-gateway','tamachi','hamamatsucho','shimbashi','yurakucho','tokyo','kanda','akihabara','okachimachi','ueno','uguisudani','nippori','nishi-nippori','tabata','komagome','sugamo','otsuka','ikebukuro','mejiro','takadanobaba','shin-okubo']},
 {id:'c',name:'JR 中央線快速',color:'#ef933c',st:['nakano','shinjuku','ochanomizu','tokyo']},
 {id:'s',name:'JR 総武線各停',color:'#e9d36e',st:['nakano','shinjuku','yoyogi','ochanomizu','akihabara','asakusabashi']},
 {id:'g',name:'銀座線',color:'#efac48',st:['shibuya','omotesando','akasakamitsuke','shimbashi','ginza','nihombashi','ueno','asakusa']},
 {id:'m',name:'丸ノ内線',color:'#d85e67',st:['ikebukuro','ochanomizu','tokyo','ginza','akasakamitsuke','shinjuku']},
 {id:'f',name:'副都心線',color:'#a98a6c',st:['ikebukuro','shinjukusanchome','meijijingumae','shibuya']},
 {id:'a',name:'都営浅草線',color:'#e7839a',st:['asakusa','asakusabashi','nihombashi','shimbashi','gotanda']},
 {id:'r',name:'りんかい線',color:'#60a6e8',st:['osaki','oimachi','tokyoteleport','kokusaitenjijo']},
 {id:'k',name:'京葉線（舞浜）',color:'#cf506d',st:['tokyo','disney']},
 {id:'n',name:'成田エクスプレス（略図）',color:'#a45ab3',st:['tokyo','narita']},
 {id:'h',name:'京急空港線（略図）',color:'#4ea5bc',st:['shinagawa','haneda']}
];
const stations=[
 ['ikebukuro','池袋',160,80,'购物·娱乐','shop'],['tabata','田端',301,52,'车站·交通','train'],['nippori','日暮里',370,67,'车站·问路','train'],['ueno','上野',415,113,'饮食·旅游','food'],['akihabara','秋葉原',433,174,'数码·购物','shop'],['tokyo','東京',398,239,'交通·换乘','train'],['yurakucho','有楽町',363,264,'购物·日料','washoku'],['shimbashi','新橋',333,302,'居酒屋·职场','izakaya'],['tamachi','田町',308,338,'日常生活','conv'],['shinagawa','品川',255,384,'酒店·交通','hotel'],['gotanda','五反田',189,351,'商店·生活','conv'],['meguro','目黒',150,317,'药妆·购物','drug'],['ebisu','恵比寿',120,277,'餐馆·居酒屋','izakaya'],['shibuya','渋谷',99,239,'时尚·古着','shop'],['harajuku','原宿',87,197,'服饰·古着','shop'],['yoyogi','代々木',91,157,'交通·问路','train'],['shinjuku','新宿',108,123,'餐饮·夜生活','izakaya'],['takadanobaba','高田馬場',121,92,'便利店·生活','conv'],['nakano','中野',44,112,'古着·购物','shop'],['ochanomizu','御茶ノ水',352,171,'音乐·文化','shop'],['asakusabashi','浅草橋',476,157,'生活·购物','shop'],['asakusa','浅草',510,102,'文化·旅游','help'],['ginza','銀座',370,282,'购物·品牌','shop'],['nihombashi','日本橋',432,260,'购物·商务','shop'],['omotesando','表参道',153,225,'时尚·服饰','shop'],['akasakamitsuke','赤坂見附',233,231,'餐馆·餐饮','food'],['shinjukusanchome','新宿三丁目',134,138,'购物·日常','shop'],['meijijingumae','明治神宮前',111,211,'古着·潮流','shop'],['osaki','大崎',210,385,'交通·换乘','train'],['oimachi','大井町',241,429,'生活·交通','train'],['tokyoteleport','東京テレポート',359,415,'台场·购物','shop'],['kokusaitenjijo','国際展示場',433,434,'展会·活动','help']
].map(x=>({id:x[0],jp:x[1],x:x[2],y:x[3],desc:x[4],sid:x[5]}));
// Bay-area / airport destinations are displayed separately so the rail sketch stays legible.
stations.push({id:'haneda',jp:'羽田空港',x:523,y:463,desc:'国际航站楼·入境·机场交通',sid:'airport'});
stations.push({id:'narita',jp:'成田空港',x:530,y:33,desc:'入境·行李·机场特急',sid:'airport'});
stations.push({id:'disney',jp:'舞浜・ディズニー',x:497,y:392,desc:'东京迪士尼度假区·游乐园',sid:'disney'});
stations.push({id:'kitashinagawa',jp:'北品川',x:300,y:410,desc:'旧商店街',sid:'conv'});
// 山手线全30站开放；新站可直接进入基础街区，不设剧情解锁。
const yamanoteAddedStations=[
 ['takanawa-gateway','高輪ゲートウェイ',282,363,'站前广场·新街区','train'],
 ['hamamatsucho','浜松町',325,319,'滨松町·通勤与交通','train'],
 ['kanda','神田',419,207,'书店街·老店','shop'],
 ['okachimachi','御徒町',425,142,'商店街·小吃','food'],
 ['uguisudani','鶯谷',397,87,'旧街道·车站','conv'],
 ['nishi-nippori','西日暮里',335,56,'住宅街·换乘','train'],
 ['komagome','駒込',272,52,'庭园·商店街','help'],
 ['sugamo','巣鴨',238,54,'地藏通商店街','food'],
 ['otsuka','大塚',198,64,'都电·街角商店','conv'],
 ['mejiro','目白',142,86,'书店·住宅街','shop'],
 ['shin-okubo','新大久保',111,110,'餐馆·多文化街区','food']
];
for(const [id,jp,x,y,desc,sid] of yamanoteAddedStations)stations.push({id,jp,x,y,desc,sid});
lines.push({id:'kk',name:'京急本线',color:'#4ea5bc',st:['shinagawa','kitashinagawa']});
const byId=Object.fromEntries(stations.map(x=>[x.id,x]));
let currentLine='all',selected='shibuya',activeStation=null;
function mapSvg(){
 const el=document.createElementNS('http://www.w3.org/2000/svg','svg'); el.setAttribute('viewBox','0 0 570 480');el.classList.add('tokyo-svg');el.setAttribute('role','img');el.setAttribute('aria-label','东京主要铁路线路与车站示意地图，可选择车站');
 let out='<defs><pattern id="pxgrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" stroke="#50718a" stroke-width=".5" fill="none" opacity=".28"/></pattern></defs><rect width="570" height="480" fill="#304c60"/><rect width="570" height="480" fill="url(#pxgrid)"/><path class="water" d="M550 170 L526 250 L560 317 L525 346 L570 366 L570 480 L300 480 L314 410 L350 385 L371 352 L390 308 L439 289 L478 218 Z"/><path class="water" d="M445 0 L456 105 L448 159 L465 214 L459 295" fill="none" stroke="#214e70" stroke-width="16"/><path class="park" d="M60 178h60v35H60zM170 188h55v37h-55zM270 100h55v45h-55zM260 270h51v35h-51z"/>';
 for(let i=0;i<44;i++){let x=(i*79+37)%560,y=(i*53+17)%460;out+=`<rect class="block" x="${x}" y="${y}" width="${12+i%3*6}" height="${8+i%4*5}"/>`}
 lines.forEach(l=>{let p=l.st.map(id=>byId[id]).filter(Boolean);let points=p.map(s=>`${s.x},${s.y}`).join(' ');out+=`<polyline class="rail" data-line="${l.id}" points="${points}" stroke="${l.color}"/>`;});
 const HIDDEN=new Set(((typeof GAME_CONFIG!=='undefined'&&GAME_CONFIG.map)||{}).hiddenStations||[]); // v34：地图上不显示的小站（config 的 map.hiddenStations），线路照旧经过
 stations.filter(s=>!HIDDEN.has(s.id)).forEach(s=>{const airport=s.id==='haneda'||s.id==='narita';const edge=s.x>=490;out+=`<g class="station${airport?' airport-station':''}" data-station="${s.id}" role="button" tabindex="0" aria-label="${s.jp}站"><circle cx="${s.x}" cy="${s.y}" r="${airport?8:['shibuya','shinjuku','tokyo','ikebukuro','shinagawa','ueno','akihabara'].includes(s.id)?7:4.4}"/><text x="${edge?s.x-12:s.x+8}" y="${s.y-9}"${edge?' text-anchor="end"':''}>${airport?'✈ ':''}${s.jp}</text></g>`});
 el.innerHTML=out;return el;
}

function nav(){if(typeof campaign!=='undefined'&&campaign)return '<div class="rpg-nav"><button data-rpg="home">🏠 大地图</button></div>';return '<div class="rpg-nav"><button data-rpg="home">🏠 大地图</button><button data-rpg="catalog">📖 原版题库</button><button data-rpg="review">📜 学习记录</button><button data-rpg="status">⚔️ 角色档案</button></div>'}
function bindNav(){app.querySelectorAll('[data-rpg]').forEach(b=>b.onclick=()=>{let a=b.dataset.rpg;if(a==='home')tokyoHome();else if(a==='catalog')originalHome();else if(a==='status')statusPage();else if(a==='review'){if(typeof learnProgress==='function')learnProgress();else originalHome();}})}
function tokyoHome(){V51.eyes();selected=V51.mapSelection();activeStation=null;app.innerHTML=`<div class="rpg-shell"><section class="rpg-panel rpg-hero"><div class="rpg-kicker">TOKYO // 16-BIT LANGUAGE ADVENTURE</div><h1 class="rpg-title">日本語<br>TOKYO QUEST</h1><p class="rpg-tiny">在东京地图上选择车站，开启你的日语冒险。</p><div class="rpg-stat"><span class="rpg-pill">${V51.languageLabel()}</span><span class="rpg-pill">理解度 ${V51.language().xp}</span><span class="rpg-pill">✓ ${progress.correct} 次胜利</span></div></section>${nav()}<section class="rpg-panel"><div class="rpg-section-head"><h2>🗺 TOKYO WORLD MAP</h2><small>选择车站开始任务</small></div><div class="map-legend"><button class="line-chip" data-line="all" aria-pressed="true">全部线路</button>${lines.map(l=>`<button class="line-chip" data-line="${l.id}" aria-pressed="false"><span style="color:${l.color}">●</span> ${l.name}</button>`).join('')}</div><div class="map-scroller" id="map-host"></div><p class="map-help">地图为学习用示意图，位置及线路经过简化；不用于实际导航或换乘。</p><div id="station-info" class="station-detail"></div></section></div>`;
 const host=document.getElementById('map-host');host.appendChild((window.MAP25&&MAP25.build())||mapSvg()); // v45：2.5D 地图（原来的示意图作为后备）
 app.querySelectorAll('[data-line]').forEach(b=>b.onclick=()=>{currentLine=b.dataset.line;paintMap();});
 app.querySelectorAll('[data-station]').forEach(g=>{g.onclick=()=>{selected=g.dataset.station;paintMap()};g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=g.dataset.station;paintMap()}}});
 app.querySelectorAll('[data-quest]').forEach(b=>b.onclick=()=>{activeStation='综合挑战';start(b.dataset.quest)});bindNav();paintMap();window.scrollTo(0,0);
}
function paintMap(){app.querySelectorAll('.line-chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.line===currentLine)));app.querySelectorAll('.rail').forEach(p=>p.classList.toggle('dim',currentLine!=='all'&&p.dataset.line!==currentLine));const active=lines.find(l=>l.id===currentLine);app.querySelectorAll('.station').forEach(g=>{g.classList.toggle('selected',g.dataset.station===selected);g.classList.toggle('dim',!!active&&!active.st.includes(g.dataset.station)&&!['haneda','narita'].includes(g.dataset.station))});let s=byId[selected];if(active&&!active.st.includes(s.id)){selected=active.st.find(id=>!V51.swallowed(id))||V51.mapSelection();s=byId[selected];app.querySelectorAll('.station').forEach(g=>{g.classList.toggle('selected',g.dataset.station===selected);g.classList.toggle('dim',!active.st.includes(g.dataset.station)&&!['haneda','narita'].includes(g.dataset.station))})}
 const service=lines.filter(l=>l.st.includes(s.id));document.getElementById('station-info').innerHTML=`<div class="rpg-kicker">STATION QUEST // SELECTED</div><h3>${['haneda','narita','disney'].includes(s.id)?'📍':'🚉'} ${s.jp}${['haneda','narita','disney'].includes(s.id)?'':'駅'}</h3><p>${s.desc} · 可以探索街区，在店里用日语办事。</p><div class="station-meta">${service.map(l=>`<span style="border-color:${l.color}">${l.name}</span>`).join('')}</div><button id="station-start" class="rpg-action primary">▶ 探索 ${s.jp} 像素街区</button>`;const stationStart=document.getElementById('station-start');const naritaLocked=s.id==='narita'&&typeof GAME_CONFIG!=='undefined'&&!((GAME_CONFIG.start||{}).portChoice);if(naritaLocked){stationStart.disabled=true;stationStart.textContent='🔒 成田空港 · '+(((GAME_CONFIG.start||{}).naritaLockedText)||'暂未开放');}else{stationStart.onclick=()=>enterDistrict(s.id);}
}
function statusPage(){app.innerHTML=`<div class="rpg-shell">${nav()}<section class="rpg-panel rpg-hero"><div class="rpg-kicker">ADVENTURER STATUS</div><h1 class="rpg-title">勇者の記録</h1><h2>${V51.languageLabel()}</h2><p>累积理解度 ${V51.language().xp}</p>${V51.bar()}<div class="rpg-icon-grid"><p>✅ 答对次数<br><strong>${progress.correct}</strong></p><p>🩹 答错次数<br><strong>${progress.wrong}</strong></p><p>🚉 已访问站点<br><strong>${Object.keys(progress.visits).length}</strong></p><p>🏙 地图进度<br><strong>${Math.round(Object.keys(progress.visits).length/stations.length*100)}%</strong></p></div></section><section class="rpg-panel"><h2>已探索车站</h2><p>${Object.keys(progress.visits).length?Object.keys(progress.visits).map(k=>byId[k]?.jp||k).join('・'):'暂未探索。去东京地图选择一个车站吧！'}</p><p class="rpg-footnote">理解度由答题累积；原版的收藏、掌握度、错题仍保存在原有学习记录里。</p></section></div>`;bindNav();window.scrollTo(0,0)}

// Supplemental airport and theme-park vocabulary. Existing questions are untouched.
S.push({id:'airport',n:'机场・入境',e:'✈️',c:'#6ba9d3',d:'入境、托运、取行李、机场交通'});
S.push({id:'disney',n:'主题乐园',e:'🎠',c:'#c783b6',d:'门票、排队、游乐设施、纪念品'});
Q.push(
 {s:'airport',t:'r',q:'机场广播中的这句话是什么意思？',j:'手荷物受取所はこちらです。',o:['行李领取处在这边','免税店在这边','登机口关闭','安检结束'],a:0,e:'手荷物受取所（てにもつうけとりじょ）= 行李领取处。'},
 {s:'airport',t:'r',q:'机场指示牌上写着：',j:'税関 / Customs',o:['海关','检票口','外币兑换处','巴士总站'],a:0,e:'税関（ぜいかん）是海关；入国審査（にゅうこくしんさ）是入境审查。'},
 {s:'airport',t:'s',q:'在机场想问去市区的电车在哪里，怎么说？',o:['都内へ行く電車はどこですか。','飛行機は何円ですか。','ここは食堂ですか。','電車を食べます。'],a:0,e:'都内（とない）指东京都内；～はどこですか用于询问地点。'},
 {s:'airport',t:'r',q:'在出发大厅看到：',j:'保安検査場',o:['安检区','海关税务柜台','行李转盘','机场酒店'],a:0,e:'保安検査場（ほあんけんさじょう）= 安全检查区。'},
 {s:'airport',t:'s',q:'托运行李没有出现，应该怎么问？',o:['預けた荷物が出てきません。','荷物を食べました。','飛行機をください。','改札を飲みます。'],a:0,e:'預けた荷物（あずけたにもつ）是托运行李；出てきません表示没有出来。'},
 {s:'airport',t:'r',q:'购买机场列车车票时看到：',j:'指定席',o:['对号入座的指定座席','仅站票','自由乘坐任何班次','候机座椅'],a:0,e:'指定席（していせき）是指定座位。部分机场特急需要另外购买特急券。'},
 {s:'disney',t:'r',q:'在游乐设施入口看到：',j:'待ち時間 60分',o:['预计排队60分钟','设施运行60分钟','营业时间60分钟','门票60日元'],a:0,e:'待ち時間（まちじかん）= 等待时间。'},
 {s:'disney',t:'r',q:'工作人员指向这个标识：',j:'アトラクション入口',o:['游乐设施入口','出口','寄存柜','急救站'],a:0,e:'アトラクション=游乐项目；入口（いりぐち）= 入口。'},
 {s:'disney',t:'s',q:'想问游乐设施是否开放，怎么说？',o:['このアトラクションは運行していますか。','このアトラクションを食べられますか。','ここは空港ですか。','お土産を運転してください。'],a:0,e:'運行（うんこう）している指设施正在运营，也可问「今、乗れますか」。'},
 {s:'disney',t:'r',q:'商店里的「お土産」是指什么？',j:'お土産',o:['纪念品或伴手礼','饮水台','游乐项目','储物柜'],a:0,e:'お土産（おみやげ）= 伴手礼、纪念品。'},
 {s:'disney',t:'s',q:'你想问附近有没有洗手间，怎么说？',o:['近くにトイレはありますか。','トイレを注文します。','近くに空港があります。','トイレを予約しました。'],a:0,e:'近くに～はありますか：附近有没有……？'},
 {s:'disney',t:'r',q:'园内标注「再入園」指：',j:'再入園',o:['再次入园','闭园时间','免排队','园区地图'],a:0,e:'再入園（さいにゅうえん）是重新入园，具体规则以园区当日指引为准。'}
);
const districtPlans={
 haneda:{name:'羽田空港・旅のはじまり',sky:'#7899bd',ground:'#5c7789',spots:[['arrival','🛬','到着ロビー','入境与领取行李','airport',25,29],['train','🚃','京急のりば','前往品川・都内','train',74,29],['customs','🧳','税関・手荷物','海关与行李','airport',25,70],['info','🗺️','案内カウンター','机场问路','help',74,70]],npc:['机场工作人员','羽田空港へようこそ！','从羽田可乘京急线往品川方向，也可搭东京单轨电车往浜松町方向。']},
 narita:{name:'成田空港・旅のはじまり',sky:'#90a8c1',ground:'#697b88',spots:[['arrival','🛬','到着ロビー','入境审查与取行李','airport',25,29],['skyliner','🚄','スカイライナー','往日暮里・上野方向','train',74,29],['express','🚆','成田エクスプレス','往东京・新宿等方向','train',25,70],['info','🧳','案内・税関','机场问路与入境','airport',74,70]],npc:['机场向导','成田空港へようこそ！','前往市区可了解京成 Skyliner 或 JR 成田特快；两座机场并不位于同一个地方。']},
 disney:{name:'東京ディズニーリゾート',sky:'#9b85b9',ground:'#6a8a80',spots:[['land','🏰','ディズニーランド','园内日语与游乐设施','disney',25,29],['sea','🌋','ディズニーシー','排队·设施介绍','disney',74,29],['shop','🎁','お土産ショップ','礼品与购物','shop',25,70],['ride','🎡','アトラクション','入园·排队·问路','disney',74,70]],npc:['乐园工作人员','夢と冒険の世界へようこそ！','东京迪士尼度假区靠近 JR 舞浜站，迪士尼乐园和迪士尼海洋是不同园区。']},
 shibuya:{name:'潮流都市',sky:'#73899d',ground:'#5d7768',spots:[['fashion','👕','セレクトショップ','服饰·尺码·品牌','shop',25,31],['vintage','🧥','古着屋','古着·材质·试穿','shop',73,28],['mall','🛍','百貨店','购物·结账·免税','shop',24,69],['cafe','☕','カフェ','点餐·饮食','food',73,69]],npc:['铃木（服装店员）','いらっしゃいませ！何かお探しですか？','想在涩谷购物吗？先掌握试穿、尺寸和结账的表达吧。']},
 akihabara:{name:'電気街',sky:'#7a789b',ground:'#55676b',spots:[['tech','💻','電気店','电子产品购物','shop',24,30],['game','🎮','ゲーム店','游戏与问路','shop',74,29],['anime','📚','ホビーショップ','模型·动漫周边','shop',23,70],['conv','🏪','コンビニ','便利店日语','conv',74,69]],npc:['电器店店员','いらっしゃいませ。在庫を確認いたします。','要找电器的话，先和店员确认型号和库存。']},
 shinjuku:{name:'眠らない街',sky:'#66627d',ground:'#596776',spots:[['izakaya','🍶','居酒屋','居酒屋点单','izakaya',25,30],['ramen','🍜','ラーメン屋','拉面与餐券','ramen',75,29],['cross','🚉','駅前広場','问路·换乘','train',23,69],['store','🏪','コンビニ','便利店会话','conv',75,70]],npc:['街头向导','新宿へようこそ！どこに行きたいですか？','新宿拥有很多练习场景，先去居酒屋或者拉面店挑战吧。']},
 asakusa:{name:'下町文化',sky:'#8a927b',ground:'#6b8064',spots:[['temple','⛩','浅草寺','传统文化·旅游','help',25,29],['souvenir','🎁','お土産屋','伴手礼·购物','shop',74,30],['sweets','🍡','甘味処','日式甜点','food',24,69],['washoku','🍱','和食屋','日本料理','washoku',74,69]],npc:['旅游向导','浅草へようこそ！写真を撮ってもいいですか？','进寺前先看看告示。想拍照的话，可以先问工作人员。']}
};

// 普通车站生活：这些地点与207案件无关；不使用调查感叹号，也不会凭空生成证据。
const stationDaily={
 shinjuku:[['locker','🧳','投币寄存柜','一名游客正研究寄存柜使用说明',15,9],['busker','🎸','街头乐手','吉他声混在站前人流里',85,11],['bookshop','📚','二手书店','书架上摆着旧杂志和推理小说',14,90],['nightbus','🚌','夜行巴士站','乘客在站牌前核对目的地',86,90]],
 shibuya:[['crossing','🚦','十字路口','过街提示灯亮起，人流向四面散开',12,11],['record','💿','唱片店','店内正播放一张旧专辑',87,11],['photo','📷','街头拍照点','游客轮流站在路口边拍照',12,89],['drink','🥤','饮料售卖机','自动贩卖机的灯光映在地面',87,89]],
 ikebukuro:[['arcade','🕹️','街机厅','几个学生围着格斗游戏机',13,12],['bakery','🥐','面包店','面包店门口排着短队',87,12],['east','🚉','东口广场','有人在广场等朋友',13,88],['petshop','🐈','宠物用品店','门口的促销牌被风吹得轻晃',87,88]],
 tokyo:[['bento','🍱','站内便当店','旅客挑选列车便当',12,12],['guide','🗺️','换乘导览牌','乘客停在导览图前确认出口',88,12],['souvenir','🎁','伴手礼柜台','柜台摆满小盒装点心',12,88],['waiting','🪑','候车长椅','有人坐着整理车票和行李',88,88]],
 shinagawa:[['coffee','☕','站前咖啡店','店里坐着几名拖着行李的旅客',12,12],['taxi','🚕','出租车候车区','司机正依次接客',88,12],['vending','🥤','饮料售卖机','机器旁的回收桶装着空瓶',12,88],['convenience','🏪','便利商店','店员忙着补充饭团和瓶装水',88,88]],
 akihabara:[['capsule','🎲','扭蛋店','整面墙都是新款扭蛋机',12,12],['retro','🕹️','复古游戏角','一台老街机还在运行',88,12],['parts','🔌','电子零件摊','老板正在整理电线和接头',12,88],['poster','🖼️','街头海报栏','新活动的海报贴在旧海报上',88,88]],
 ginza:[['window','👜','橱窗街角','行人停下看新一季的橱窗陈列',12,12],['gallery','🖼️','小型画廊','门口写着今日免费开放',88,12],['pastry','🍰','洋菓子店','玻璃柜里摆着精致的甜点',12,88],['cross','🚦','银座路口','信号灯变绿，购物的人群开始过街',88,88]],
 asakusa:[['fortune','⛩️','神社附近','游客轻声讨论签文',12,12],['rickshaw','🛺','人力车停靠点','车夫向游客介绍路线',88,12],['snack','🍘','煎饼摊','新烤的煎饼飘来酱油香',12,88],['alley','🏮','旧街巷口','灯笼下有老人慢慢走过',88,88]]
};
const stationDailyLines={
 shinjuku:{locker:'柜门上贴着投币和取件步骤。一个旅客按了两次密码，终于打开柜门。',busker:'乐手弹完一段旋律，几个人停下听完又匆匆走开。',bookshop:'店主正给一本旧书贴价格签。翻开的书页带着纸张的气味。',nightbus:'电子屏滚动显示各班夜行巴士的方向。旁边的旅客正在打电话。'},
 shibuya:{crossing:'绿灯亮起，人群从各个方向穿过路口。你跟着人流走到另一边。',record:'试听机旁摆着几张老唱片，店员正给顾客推荐耳机。',photo:'两名游客互相帮忙拍照，之后向彼此道谢。',drink:'售卖机上有季节限定饮料。你看了看价格，没有立即购买。'},
 ikebukuro:{arcade:'街机厅里传来连击提示音，有人输掉一局后笑着让位。',bakery:'柜台里剩下最后几只奶油面包。前面的人正在犹豫买哪一种。',east:'东口广场有人约好在站牌下碰头，抬头四处张望。',petshop:'货架上摆着猫玩具和牵引绳。店员在整理促销贴纸。'},
 tokyo:{bento:'你看见不同地区的车站便当，旁边旅客讨论哪一款比较适合带上新干线。',guide:'导览牌分列不同线路和出口。周围的人只是确认自己的换乘方向。',souvenir:'柜台摆着饼干和点心礼盒，旅客把小票折好放进口袋。',waiting:'长椅旁有人整理行李箱。广播提醒旅客看好随身物品。'},
 shinagawa:{coffee:'咖啡店里有拖着行李的客人。店员给纸杯套上隔热杯套。',taxi:'出租车依次驶入候车区。工作人员请乘客排队上车。',vending:'自动售卖机的冷饮标记闪了一下，几个人顺路买水。',convenience:'店员正在补货，便当架上的标签写着当日价格。'},
 akihabara:{capsule:'一名顾客摇了摇刚拿到的扭蛋，和同伴比较款式。',retro:'复古街机传来熟悉的电子音，一名顾客专心盯着屏幕。',parts:'零件摊上按型号放着接头、转接线和小螺丝。',poster:'海报栏写着几场店内活动的日期，与酒店调查无关。'},
 ginza:{window:'你站在橱窗前看了一会儿，有人匆匆经过，玻璃上掠过街灯的反光。',gallery:'画廊里有人静静看展，工作人员正在摆放展览介绍。',pastry:'甜点柜前排着两个人，店员耐心介绍今天的口味。',cross:'路口人来人往，几名上班族边走边聊周末安排。'},
 asakusa:{fortune:'游客拿着签文讨论运势。旁边有提示牌提醒大家保持安静。',rickshaw:'车夫与游客确认路线和费用，然后推车准备出发。',snack:'老板熟练地把热煎饼装进纸袋，递给等候的顾客。',alley:'巷口的灯笼随风轻摆，远处传来小店收拾桌椅的声音。'}
};
// 新开放山手线车站：每站基本城市生活交互，独立于207号室调查。
const yamanoteEveryday={
 'takanawa-gateway':[['square','🌿','站前广场','有人坐在树荫下等朋友',10,12],['cafe2','☕','咖啡窗口','店员擦拭着收银台',88,89]],
 hamamatsucho:[['monorail','🚝','单轨电车导览','乘客正在核对机场方向',10,12],['lunch','🍱','午餐店','附近职员排队买便当',88,89]],
 kanda:[['book','📚','旧书摊','摊主给旧书贴价格签',10,12],['soba','🍜','荞麦面店','门帘后传来碗筷声',88,89]],
 okachimachi:[['market2','🛍','商店街','店员正在摆放商品',10,12],['tea','🍵','茶叶铺','门外飘出焙茶香',88,89]],
 uguisudani:[['alley','🚶','站前小路','居民拎着购物袋经过',10,12],['flower2','🌷','花店','门口摆着当天的切花',88,89]],
 'nishi-nippori':[['bakery2','🥖','街角面包店','烤面包的香气飘到街边',10,12],['bus','🚌','巴士站','乘客在看线路表',88,89]],
 komagome:[['garden','🍃','庭园入口','告示牌写着参观时间',10,12],['snack2','🍡','点心铺','店主在整理柜台',88,89]],
 sugamo:[['jizo','⛩','地藏通入口','路人缓步经过商店',10,12],['senbei','🍘','仙贝店','店里传出烘烤香味',88,89]],
 otsuka:[['tram','🚋','都电站牌','一辆都电缓缓驶过',10,12],['cafe3','☕','街角咖啡店','学生在窗边看书',88,89]],
 mejiro:[['books2','📖','小书店','书架上摆着旅行杂志',10,12],['park','🌳','小公园','有人在长椅上休息',88,89]],
 'shin-okubo':[['groceries','🥬','食材店','各种调味料摆在门前',10,12],['streetfood','🥟','街头小吃','店员正翻动烤盘',88,89]]
};
Object.assign(stationDaily,yamanoteEveryday);
for(const [id,points] of Object.entries(yamanoteEveryday)){
  stationDailyLines[id]=Object.fromEntries(points.map(p=>[p[0],p[3]+'。附近的人各忙各的，没有特别留意你。']));
  // 保留每站原有的交通、购物、语言练习入口，同时添加普通生活点。
  const st=stations.find(x=>x.id===id);
  if(st)districtPlans[id]={name:st.jp+'站前街区',sky:'#728a9e',ground:'#617769',spots:[
    ['station','🚉','駅の改札','乘车与换乘','train',25,29],
    ['main','🏬','駅前の店','本地店铺与日语练习',st.sid,74,29],
    ['market','🏪','商店街','便利店与日常购物','conv',25,70],
    ['help','🗺','案内板','问路与车站服务','help',74,70]
  ],npc:['街区行人',st.jp+'へようこそ。','附近有商店，也有人在赶电车。']};
}
for(const [station,points] of Object.entries(stationDaily)){
 const plan=districtPlans[station];if(!plan)continue;
 plan.spots.push(...points.map(p=>[p[0],p[1],p[2],p[3],'__life__',p[4],p[5]]));
}
const isDistrictLife=(station,key)=>!!stationDailyLines[station]?.[key];
function makeDistrictPlan(s){if(districtPlans[s.id])return districtPlans[s.id];return {name:s.desc,sky:'#728aa0',ground:'#5b7767',spots:[['station','🚉','駅の改札','车站·交通','train',25,29],['main','🏬',sc(s.sid)?.n||'駅前の店',s.desc,s.sid,74,29],['market','🏪','商店街','购物·便利店','conv',25,70],['help','🗺','案内所','问路·应急','help',74,70]],npc:['街区向导',s.jp+'駅へようこそ！','车站、商店和问路处都在附近。']}}
let district=null,districtPos={x:50,y:51},districtTarget=null,districtDialog=0;
function districtBackdrop(plan,station){let accent=station.id==='shibuya'?'#e4a77d':station.id==='akihabara'?'#bd91d6':station.id==='shinjuku'?'#d3a19a':'#d2bb8a';
let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 288" preserveAspectRatio="none" aria-label="${station.jp}像素街区地图" role="img"><defs><pattern id="districtTiles" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${plan.ground}"/><path d="M0 15H16M15 0V16" stroke="#2e5147" stroke-width="1" opacity=".25"/><rect x="3" y="5" width="3" height="3" fill="#86a77c" opacity=".5"/></pattern></defs><rect width="320" height="288" fill="url(#districtTiles)"/><path d="M128 0H193V288H128Z" fill="#a89c8c"/><path d="M0 120H320V165H0Z" fill="#b3a799"/><path d="M153 0V288M168 0V288M0 141H320" stroke="#eee1b6" stroke-width="2" stroke-dasharray="8 9" opacity=".6"/>`;
for(const [i,sp] of plan.spots.entries()){if(sp[4]==='__life__')continue;let x=sp[5]*3.2,y=sp[6]*2.88;let w=80,h=65;let left=x-w/2,top=y-h/2;out+=`<rect x="${left+4}" y="${top+9}" width="${w}" height="${h}" fill="#203746"/><rect x="${left}" y="${top}" width="${w}" height="${h-9}" fill="${accent}"/><rect x="${left-3}" y="${top}" width="${w+6}" height="11" fill="${i%2?'#593f60':'#604c4a'}"/><rect x="${left+8}" y="${top+21}" width="18" height="17" fill="#344e66"/><rect x="${left+54}" y="${top+21}" width="18" height="17" fill="#344e66"/><rect x="${left+32}" y="${top+27}" width="17" height="${h-36}" fill="#4b5364"/>`;}
for(let k=0;k<14;k++){let x=8+(k*67)%305,y=12+(k*43)%275;if(x>130&&x<192)continue;out+=`<rect x="${x}" y="${y}" width="5" height="7" fill="#315649" opacity=".7"/>`}
return out+'<rect x="120" y="132" width="79" height="25" fill="#d0c2aa" opacity=".2"/></svg>'}
function enterDistrict(id){const s=byId[id];if(!s)return;district=s;districtPos={x:50,y:51};districtTarget=null;districtDialog=0;activeStation=s.jp;progress.visits[id]=(progress.visits[id]||0)+1;save();renderDistrict();}
function moveDistrict(dx,dy){if(!district)return;districtPos.x=Math.max(10,Math.min(90,districtPos.x+dx));districtPos.y=Math.max(12,Math.min(88,districtPos.y+dy));renderDistrictPosition();const plan=makeDistrictPlan(district);const near=plan.spots.find(sp=>Math.abs(sp[5]-districtPos.x)<12&&Math.abs(sp[6]-districtPos.y)<12);if(near&&(!districtTarget||districtTarget[0]!==near[0]))selectSpot(near[0]);}
function renderDistrictPosition(){let p=document.getElementById('district-player');if(p){p.style.left=districtPos.x+'%';p.style.top=districtPos.y+'%'}}
function selectSpot(id){const plan=makeDistrictPlan(district),spot=plan.spots.find(sp=>sp[0]===id);if(!spot)return;districtTarget=spot;districtDialog=0;
 if(isDistrictLife(district.id,id)){
   progress.cityLife??={};progress.cityLife[district.id]??={};progress.cityLife[district.id][id]=(progress.cityLife[district.id][id]||0)+1;save();
   const box=document.getElementById('district-chat');box.replaceChildren();
   const title=document.createElement('strong');title.textContent=spot[1]+' '+spot[2];box.appendChild(title);
   const p=document.createElement('p');p.textContent=stationDailyLines[district.id][id];box.appendChild(p);
   const b=document.createElement('button');b.className='rpg-action';b.textContent='继续逛街';b.onclick=()=>{box.replaceChildren();const msg=document.createElement('p');msg.textContent='你继续沿街走去。';box.appendChild(msg)};box.appendChild(b);return;
 }
 document.getElementById('district-chat').innerHTML=`<strong>▶ ${spot[2]}</strong><p>${spot[3]}。办事前需要与这里的人交谈。</p><button class="rpg-action primary" id="district-start" style="width:100%">进入 ${spot[2]} · 开始交谈</button>`;document.getElementById('district-start').onclick=()=>{activeStation=district.jp+' / '+spot[2];start(spot[4]);};}
function talkToNPC(){let plan=makeDistrictPlan(district);districtTarget=null;let lines=[plan.npc[1],plan.npc[2],'走到地图上的建筑旁，可以进店办事。也可以用 WASD 移动角色，靠近建筑触发任务。'];let i=districtDialog%lines.length;document.getElementById('district-chat').innerHTML=`<strong>💬 ${plan.npc[0]}</strong><p>${esc(DISTORT.text(lines[i]))}</p><button class="rpg-action" id="district-next" style="width:100%">${i===lines.length-1?'再次对话':'继续对话 ▶'}</button>`;document.getElementById('district-next').onclick=()=>{districtDialog++;talkToNPC()};}
function renderDistrict(){const s=district,plan=makeDistrictPlan(s);app.innerHTML=`<div class="rpg-shell"><section class="rpg-panel"><div class="district-top"><div><div class="rpg-kicker">TOKYO / STATION EXPLORATION</div><h1>${['haneda','narita','disney'].includes(s.id)?'🗺':'🚉'} ${s.jp}${['haneda','narita','disney'].includes(s.id)?'':'駅'}</h1><div class="rpg-tiny">${plan.name} · 像素街区</div></div><button class="rpg-inline-back" id="district-back">← 东京地图</button></div><div class="district-hud"><span>🧭 ${s.jp} · EXPLORING</span><span>${V51.languageLabel()} · 理解度 ${V51.language().xp}</span></div><div class="district-world" id="district-world">${districtBackdrop(plan,s)}${plan.spots.map(sp=>`<button class="district-hit" data-spot="${sp[0]}" style="left:${sp[5]}%;top:${sp[6]}%" aria-label="进入${sp[2]}"><b>${sp[1]}</b>${sp[2]}</button>`).join('')}<button class="district-hit" id="district-npc" style="left:50%;top:13%;background:#554365" aria-label="和${esc(plan.npc[0])}交谈"><b>🧑</b>${esc(plan.npc[0])}</button><div class="district-player" id="district-player" style="left:${districtPos.x}%;top:${districtPos.y}%"><svg viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="0" width="12" height="6" fill="#45394f"/><rect x="4" y="6" width="16" height="11" fill="#ecc19b"/><rect x="6" y="10" width="3" height="3" fill="#26334a"/><rect x="15" y="10" width="3" height="3" fill="#26334a"/><rect x="3" y="17" width="18" height="10" fill="#7cc2a6"/><rect x="3" y="27" width="7" height="7" fill="#3e5388"/><rect x="14" y="27" width="7" height="7" fill="#3e5388"/></svg></div></div><div class="district-dialogue" id="district-chat" aria-live="polite"><strong>📜 ${s.jp} 街区探索</strong><p>点击建筑探索，也可以找街区居民交谈。也可以用 WASD、点击或触摸地图移动。</p></div><div class="district-utility"><div class="district-info">WASD、鼠标点击或触屏均可移动。可以进入店铺、与街上的人交谈。地图为游戏化示意，非真实导航。</div><div class="district-control"><button class="up" data-move="0,-8" aria-label="向上移动">▲</button><button class="left" data-move="-8,0" aria-label="向左移动">◀</button><button class="down" data-move="0,8" aria-label="向下移动">▼</button><button class="right" data-move="8,0" aria-label="向右移动">▶</button></div></div></section><section class="rpg-panel"><div class="rpg-section-head"><h2>🏘 街区地点一览</h2><small>普通生活与日语交谈</small></div><div class="district-spots">${plan.spots.map(sp=>`<button class="rpg-action" data-spot="${sp[0]}"><strong>${sp[1]} ${sp[2]}</strong>${sp[3]}</button>`).join('')}</div><p class="district-quest-note">进店办事消耗一次日常行动。浏览街区和查看店铺不消耗案件调查行动。</p></section></div>`;
 document.getElementById('district-back').onclick=tokyoHome;app.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>selectSpot(b.dataset.spot));document.getElementById('district-npc').onclick=()=>{districtDialog=0;talkToNPC()};app.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{let [dx,dy]=b.dataset.move.split(',').map(Number);moveDistrict(dx,dy)});const dw=document.getElementById('district-world');dw.onclick=e=>{if(e.target.closest('button'))return;const r=dw.getBoundingClientRect();districtPos.x=Math.max(10,Math.min(90,(e.clientX-r.left)*100/r.width));districtPos.y=Math.max(12,Math.min(88,(e.clientY-r.top)*100/r.height));renderDistrictPosition();const near=plan.spots.find(sp=>Math.abs(sp[5]-districtPos.x)<12&&Math.abs(sp[6]-districtPos.y)<12);if(near)selectSpot(near[0])};window.scrollTo(0,0);
}
document.addEventListener('keydown',e=>{if(!district||!document.getElementById('district-world')||/input|textarea|select/i.test(document.activeElement?.tagName||''))return;let dir={ArrowUp:[0,-8],ArrowDown:[0,8],ArrowLeft:[-8,0],ArrowRight:[8,0],w:[0,-8],s:[0,8],a:[-8,0],d:[8,0],W:[0,-8],S:[0,8],A:[-8,0],D:[8,0]}[e.key];if(dir){e.preventDefault();moveDistrict(...dir)}});

const originalHome=home;
home=tokyoHome;
const oldStart=start;
start=function(id){if(!activeStation)activeStation=id==='all'?'综合挑战':(typeof sc==='function'&&sc(id)?sc(id).n:'街区挑战');oldStart(id)};
const oldShow=show;
show=function(){oldShow();let q=st.list[st.i];if(!q)return;let hud=document.createElement('div');hud.className='rpg-battle-hud';let life=100*Math.max(.1,1-(st.i/Math.max(1,st.list.length)));hud.innerHTML=`<div class="rpg-kicker">BATTLE // ${activeStation||'TOKYO'}</div><div class="rpg-battle-grid"><strong>🟦 ことばモンスター</strong><b>QUEST ${st.i+1}/${st.list.length}</b></div><div class="rpg-life"><i style="width:${life}%"></i></div><div class="rpg-monster" aria-hidden="true">👾</div><div class="rpg-battle-grid"><span>⚔️ ${V51.languageLabel()}</span><span>理解度 ${V51.language().xp}</span></div>`;app.insertBefore(hud,app.firstChild);let back=app.querySelector('.quiz-home');if(back)back.textContent='← 东京地图';};
const oldPick=pick;
pick=function(k){if(st.ans)return;let q=st.list[st.i],isCorrect=k===q.a;oldPick(k);if(V51ADD.reviewing())return;if(isCorrect){JLPT.gain(null,'district');progress.correct++}else{progress.wrong++}save();const hud=app.querySelector('.rpg-battle-hud');if(hud){let el=document.createElement('div');el.className='rpg-tiny';el.style.color=isCorrect?'#a9e5b7':'#f9b1ac';el.textContent=isCorrect?'✨ 攻撃成功！ 理解度 +'+GAME_CONFIG.jlpt.gains.district+'':'🩹 怪物的攻击！这道题已记录';hud.appendChild(el)}};
const oldEnd=end;
end=function(){oldEnd();let el=document.createElement('div');el.className='rpg-victory';el.innerHTML=`<h2>🏆 QUEST CLEAR</h2><p>本次答对 ${st.score} / ${st.list.length} 题 · 理解度 ${V51.language().xp}</p><button class="rpg-action primary" id="rpg-go-map" style="width:100%">🗺 返回东京冒险地图</button>`;app.insertBefore(el,app.firstChild);document.getElementById('rpg-go-map').onclick=tokyoHome;if(district){let ret=document.createElement('button');ret.className='rpg-action';ret.style.width='100%';ret.style.marginTop='9px';ret.textContent='🏘 返回 '+district.jp+' 像素街区';ret.onclick=()=>renderDistrict();el.appendChild(ret)};};
// First-time spawn selection and selectable regional portals.
const spawnKey='tokyo-quest-birthplace-v1';
let birth='';try{birth=localStorage.getItem(spawnKey)||''}catch(e){}
function spawnScreen(change){app.innerHTML=`<div class="rpg-shell"><section class="rpg-panel rpg-hero"><div class="rpg-kicker">NEW GAME // ARRIVAL IN JAPAN</div><h1 class="rpg-title">日本へようこそ！</h1><p>选择你的冒险出生点。选择开始冒险的机场；已获得的理解度和学习记录不会清空。</p><div class="spawn-grid"><button class="spawn-card" data-birth="haneda"><span class="spawn-icon">🛬</span><strong>羽田空港 / HND</strong><span>距东京市区较近 · 机场交通与入境任务</span><em>▶ 在羽田开始冒险</em></button><button class="spawn-card" data-birth="narita"><span class="spawn-icon">✈️</span><strong>成田空港 / NRT</strong><span>千叶县 · 机场特急与行李任务</span><em>▶ 在成田开始冒险</em></button></div>${change?'<button class="rpg-inline-back" id="spawn-cancel" style="margin-top:12px">← 返回东京地图</button>':''}</section></div>`;
 app.querySelectorAll('[data-birth]').forEach(b=>b.onclick=()=>{birth=b.dataset.birth;try{localStorage.setItem(spawnKey,birth)}catch(e){}enterDistrict(birth)});
 let cancel=app.querySelector('#spawn-cancel');if(cancel)cancel.onclick=tokyoHome;window.scrollTo(0,0);
}
