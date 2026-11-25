
/* ==== engine/core/10-quiz-engine.js ==== */
/* 【原版答题引擎：场景列表 S、基础题库、出题/判题/结算界面、首页】 */
var S=[
{id:"food",n:"饮食词库",e:"🍣",c:"#e0a100",d:"寿司、烤肉、面饭、小吃、甜点、调味(222题,随机出)"},
{id:"ramenv",n:"拉面专题",e:"🍥",c:"#a8541f",d:"汤底、配料、点单要求、券売機(82题,随机出)"},
{id:"washoku",n:"日料专题",e:"🍱",c:"#3d6b5e",d:"怀石流程、烹饪方式、清酒与器皿(60题,随机出)"},
{id:"izakaya",n:"居酒屋",e:"🍶",c:"#d9822b",d:"点酒、烤串、下酒菜、结账、常用对话(132题)"},
{id:"ramen",n:"拉面店・餐厅",e:"🍜",c:"#c0392b",d:"买餐券、加面、点餐要求"},
{id:"conv",n:"便利店・超市",e:"🏪",c:"#0d9c6b",d:"加热、袋子、打折"},
{id:"train",n:"电车・车站",e:"🚃",c:"#2b6fd9",d:"快速、换乘、延误广播"},
{id:"drug",n:"药妆店・免税",e:"💊",c:"#8e44ad",d:"免税手续、药品用法"},
{id:"hotel",n:"酒店",e:"🏨",c:"#1b8fa6",d:"入住、寄存行李、早餐"},
{id:"shop",n:"逛街购物",e:"🛍️",c:"#d6457c",d:"试穿、库存、含税价"},
{id:"help",n:"问路・应急",e:"🆘",c:"#6b7a1f",d:"厕所、丢东西、封路"}
];
/* t:r=看懂日语选中文  t:s=会说,选正确的日语 */
var Q=[
{s:"izakaya",t:"r",q:"菜单上这道是什么?",j:"〆のお茶漬け",o:["最后收尾吃的茶泡饭","今日推荐的生鱼片","招牌甜点","配啤酒的炸物"],a:0,e:"〆(しめ)是“收尾”的意思,居酒屋喝完酒最后来一碗茶泡饭(お茶漬け)是经典吃法。"},
{s:"izakaya",t:"r",q:"我们没点菜,店员却端来一小碟菜,小票上写着这个。这是什么?",j:"お通し 450円(税別)",o:["店员送的免费小菜","入座后提供、通常收费的小菜，即使没单点也可能上桌","必须加点的套餐","儿童餐"],a:1,e:"お通し是居酒屋的入座小菜,基本等于座位费,几乎所有居酒屋都有,不是被坑。有些店可以事先问“お通しはありますか”。"},
{s:"izakaya",t:"s",q:"我想再来一杯生啤,怎么跟店员说?",o:["すみません、生ビールをもう一杯ください。","すみません、生ビールをもう一回食べたいです。","生ビールはどこにありますか。","生ビールを返してください。"],a:0,e:"もう一杯(再来一杯)+ください是最自然的点单说法。"},
{s:"izakaya",t:"r",q:"这个畅饮套餐是怎么算的?",j:"飲み放題 90分(L.O. 60分)",o:["能喝90分钟,最后点单在60分钟时","要喝满90分钟才能走","只能喝60分钟","90分钟后自动续杯"],a:0,e:"飲み放題=畅饮;L.O.(ラストオーダー)=最后点单时间。到点后不能再点,但可以喝到90分钟结束。"},

{s:"ramen",t:"r",q:"店门口有台机器,旁边贴着这句话,什么意思?",j:"先に券売機で食券をお買い求めください。",o:["请先坐下再点餐","请先在售票机上买餐券","请先付现金给店员","请先排队领号码牌"],a:1,e:"券売機(けんばいき)是餐券机,买好把食券交给店员即可。很多拉面店只收现金,要备好零钱。"},
{s:"ramen",t:"r",q:"店员问我这句话,他想问什么?",j:"麺の硬さはどうされますか?(かため/ふつう/やわらかめ)",o:["要不要加面","面要多硬:偏硬、普通还是偏软","要不要加辣","要大碗还是小碗"],a:1,e:"かため=偏硬,ふつう=普通,やわらかめ=偏软。同类的还有“味の濃さ(咸淡)”“脂の量(油量)”。"},
{s:"ramen",t:"s",q:"我对葱过敏,想让厨房不要放葱,怎么说比较好?",o:["ねぎ抜きでお願いできますか。","ねぎを全部食べたいです。","ねぎはいくらですか。","ねぎをもっと入れてください。"],a:0,e:"〜抜き=去掉某样东西。严重过敏时可以补一句“アレルギーがあります”。"},
{s:"ramen",t:"r",q:"菜单上这个是什么?",j:"替え玉 150円",o:["多一份叉烧","加一份面(汤喝剩了续面)","换一个碗","外带汤底"],a:1,e:"替え玉(かえだま)是九州豚骨拉面常见的续面,面吃完汤还有就加。"},

{s:"conv",t:"r",q:"收银员问我这句话,要回答什么?",j:"温めますか?",o:["要打包吗","要加热吗(微波炉)","要加筷子吗","要会员卡吗"],a:1,e:"便当、饭团、炸鸡都会问。要说“お願いします”,不要说“大丈夫です”(会被理解成不用)。"},
{s:"conv",t:"r",q:"收银员说这句话,什么意思?",j:"袋はご利用ですか?",o:["要不要袋子(需另收费)","请出示购物袋","要不要收据","要不要免税"],a:0,e:"日本购物袋要收费(约3~5日元)。不要的话说“袋は大丈夫です”。"},
{s:"conv",t:"r",q:"晚上超市熟食上贴了这个,是什么意思?",j:"20%引きシール",o:["20%的折扣贴纸","新品标识","限量款","即将过期不能吃"],a:0,e:"值引き/割引き都是打折。傍晚(约19点后)超市会给便当、熟食贴折扣贴纸。"},
{s:"conv",t:"s",q:"我已经自带了购物袋,想告诉收银员不需要袋子,怎么说?",o:["袋は大丈夫です。","袋をください、全部。","袋はどこですか。","袋を捨ててもいいですか。"],a:0,e:"大丈夫です在这里是“不用了,没问题”的意思,是店里最常用的拒绝方式。"},

{s:"train",t:"r",q:"站台电子屏上写着这两个词,有什么区别?",j:"快速 / 各駅停車",o:["快速跳过部分站,各驿停车每站都停","快速是新干线,各驿是地铁","快速要另外买票","没有区别"],a:0,e:"如果目的地是小站,要坐“各駅停車”,或者在大站换乘。快速不需要额外车票(特急才要)。"},
{s:"train",t:"r",q:"站内广播说了这句话,发生了什么?",j:"人身事故の影響で、運転を見合わせております。",o:["因为有人身事故,电车暂停运行","因为大雪,电车减速","因为检修,电车改道","电车正点出发"],a:0,e:"人身事故指有人员伤亡的事故(多为跳轨),会长时间停运。运転見合わせ=暂停运行,可考虑改乘其他线路。"},
{s:"train",t:"s",q:"我不确定这趟车是不是去新宿,怎么问车站工作人员?",o:["この電車は新宿に行きますか。","この電車を新宿にしてください。","新宿は何時に食べますか。","電車を新宿から買いたいです。"],a:0,e:"〜に行きますか是最基础的问法;也可以问“新宿に止まりますか”(会停新宿吗)。"},
{s:"train",t:"r",q:"检票口旁边的人让我看这个牌子,什么意思?",j:"乗り換えはこちら",o:["出口在这边","换乘请走这边","寄存柜在这边","厕所在这边"],a:1,e:"乗り換え=换乘,出口是“出口”,改札=检票口。"},

{s:"drug",t:"r",q:"免税柜台的店员这样说,我要做什么?",j:"パスポートをご提示ください。",o:["请出示护照","请出示信用卡","请填写住址","请把商品放回去"],a:0,e:"免税必须出示护照原件。一般要求同一天同一家店购买满5,000日元以上(税前)。"},
{s:"drug",t:"r",q:"价格牌上有这个标记,说明了什么?",j:"税込 1,100円",o:["含税价1,100日元","未含税价1,100日元","会员价1,100日元","每个1,100日元"],a:0,e:"税込(ぜいこみ)=含税;税別/税抜(ぜいぬき)=未含税,还要再加10%。"},
{s:"drug",t:"s",q:"我想买防晒霜,问店员在哪里,怎么说?",o:["日焼け止めはどこにありますか。","日焼け止めを食べてもいいですか。","日焼け止めは何時ですか。","日焼け止めをお願いして来ました。"],a:0,e:"〜はどこにありますか是找商品最通用的问法。"},
{s:"drug",t:"r",q:"药盒上写着这个,怎么吃?",j:"1日3回 食後に1錠",o:["每天3次,饭后各1片","每天1次,饭前3片","每3天吃1片","睡前一次吃3片"],a:0,e:"食前=饭前,食後=饭后,食間=两餐之间。錠=片,包=包(粉剂)。"},

{s:"hotel",t:"r",q:"我们到早了,前台这样说,意思是?",j:"チェックインは15時からとなっております。",o:["15点开始才能办理入住","15点前必须退房","15点开始供应早餐","15点前必须付款"],a:0,e:"早到可以问“荷物を預かってもらえますか”,先寄存行李再去逛。"},
{s:"hotel",t:"s",q:"我们还没到入住时间,想先把行李寄存在前台,怎么说?",o:["荷物を預かってもらえますか。","荷物を食べてもいいですか。","荷物をどこで買えますか。","荷物は何時ですか。"],a:0,e:"預かってもらえますか=能帮我保管吗,礼貌又自然。"},
{s:"hotel",t:"r",q:"早餐券上写着这个,最晚几点能进场?",j:"朝食 6:30〜10:00(最終入場 9:30)",o:["6:30","9:30","10:00","10:30"],a:1,e:"最終入場=最晚入场时间,10:00是结束时间,所以9:30之后进不去。"},
{s:"hotel",t:"s",q:"房间里没有吹风机,想跟前台要一个,怎么说?",o:["ドライヤーを貸していただけますか。","ドライヤーを食べてください。","ドライヤーはいくらで売りますか、今。","ドライヤーを終わらせてください。"],a:0,e:"貸していただけますか=能借我吗,是比较礼貌的说法;也可以说“ドライヤーはありますか”。"},

{s:"shop",t:"s",q:"我想试穿这件衣服,怎么问店员?",o:["試着してもいいですか。","試着を買ってもいいですか。","着物を食べてもいいですか。","試着はどこの国ですか。"],a:0,e:"〜てもいいですか=可以……吗,是征求许可的万能句型。"},
{s:"shop",t:"r",q:"我想要M码,店员说了这句话,什么意思?",j:"在庫を確認いたしますので、少々お待ちください。",o:["我去确认一下库存,请稍等","这款已经卖完了","这款不能试穿","请到收银台付款"],a:0,e:"在庫=库存,少々お待ちください=请稍等。店员去后面找货时常说。"},
{s:"shop",t:"s",q:"我喜欢这个款式,想问有没有别的颜色,怎么说?",o:["色違いはありますか。","色を違反してください。","違うお金はありますか。","この色を食べますか。"],a:0,e:"色違い=同款不同色;サイズ違い=同款不同码。"},
{s:"shop",t:"r",q:"收银员递来一张小票和一个东西,说了这句话。他想说什么?",j:"こちら、免税のお手続きはあちらのカウンターです。",o:["免税手续请到那边的柜台办理","这里不能退货","请扫描二维码","请排队等号码"],a:0,e:"免税の手続き=办理免税手续。很多商场的免税柜台在特定楼层,拿着护照和小票去办理。"},

{s:"help",t:"s",q:"我想找厕所,怎么问路人?",o:["すみません、お手洗いはどこですか。","すみません、手を洗ってください。","お手洗いを食べますか。","お手洗いに行きました、いくらですか。"],a:0,e:"お手洗い/トイレ都是厕所,在店里用“お手洗い”更礼貌。"},
{s:"help",t:"s",q:"我的钱包丢了,想问警察局在哪里,怎么说?",o:["財布をなくしました。交番はどこですか。","財布を食べました。交番はいくらですか。","財布を買いました。交番は何時ですか。","財布が好きです。交番に行きたくないです。"],a:0,e:"なくす=丢失。交番(こうばん)是街边的小派出所,丢东西先去那里报失。"},
{s:"help",t:"r",q:"路口立着这个牌子,是什么意思?",j:"通行止め(工事中)",o:["此路禁止通行(施工中)","前方有商店","可通行,请小心","单行道"],a:0,e:"通行止め=禁止通行,工事中=施工中。看到要绕路。"},
{s:"help",t:"r",q:"便利店门口有人走过来问我这句话,他想问什么?",j:"日本語は大丈夫ですか?",o:["你会说日语吗?","你有地址吗?","你需要帮助吗?","你饿了吗?"],a:0,e:"大丈夫ですか=你可以吗/没问题吗。这里问的是“日语能沟通吗”。可以回答“少しだけ”(一点点)。"}
];

var app=document.getElementById("app");
var st={list:[],i:0,score:0,wrong:[],ans:false};
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function sc(id){return S.filter(function(x){return x.id===id})[0]}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")}
var HD=[
['生鱼片是「刺身」,今日推荐是「本日のおすすめ」','甜点是「デザート」','炸物是「揚げ物」'],
['お通し不是免费的,会算进账单','套餐是「セットメニュー」','儿童餐是「お子様ランチ」'],
['意思是“想再吃一次生啤”,啤酒不能用「食べる」','意思是“生啤在哪里”,只是在问位置','意思是“请把生啤还给我”,语义不对'],
['没有“喝满才能走”的规定','畅饮是90分钟,60分钟是最后点单时间','畅饮不会自动续杯,要自己点'],
['先坐下点餐是「座ってから注文」','付现金给店员是「店員に現金を渡す」','领号码牌是「番号札を取る」'],
['加面是「替え玉」','加辣是「辛さ」','大碗小碗是「大盛り/並盛り」'],
['意思是“想把葱全吃掉”','意思是“葱多少钱”','意思是“请多放点葱”,与需求相反'],
['叉烧加量是「チャーシュー増し」','换碗是「器を替える」,不是替え玉','带走汤底是「スープ持ち帰り」'],
['打包是「お持ち帰りですか」','要筷子是「お箸はご利用ですか」','会员卡是「ポイントカードはお持ちですか」'],
['出示购物袋是「エコバッグを見せて」','收据是「レシートはご利用ですか」','免税是「免税ですか」'],
['新品是「新商品」','限量是「数量限定」','过期是「賞味期限切れ」,折扣贴纸不是这个意思'],
['意思是“请把袋子全给我”','意思是“袋子在哪里”','意思是“能把袋子扔掉吗”'],
['新干线是「新幹線」,各驿停车是普通电车的停站方式','要另外收费的是「特急」「ライナー」','两者停站数量不同'],
['大雪是「大雪の影響」','改道是「迂回運転」','正点是「定刻通り」'],
['意思是“请把这趟电车变成新宿”','意思是“新宿几点吃”','意思是“想从新宿买电车”'],
['出口是「出口」','寄存柜是「コインロッカー」','厕所是「お手洗い」'],
['信用卡是「クレジットカード」','填住址是「住所をご記入ください」','放回商品是「商品を戻す」'],
['未含税是「税別/税抜」','会员价是「会員価格」','每个是「1個」'],
['意思是“能吃防晒霜吗”','意思是“防晒霜几点”','语法不通'],
['饭前是「食前」,每天1次是「1日1回」','每3天是「3日に1錠」','睡前是「就寝前」'],
['退房是「チェックアウト」','早餐是「朝食」','付款是「お支払い」'],
['意思是“可以吃行李吗”','意思是“行李在哪里买”','意思是“行李几点”'],
['6:30是早餐开始时间','10:00是结束时间,不是最晚入场','10:30没有出现在早餐券上'],
['意思是“请吃吹风机”','意思是“现在吹风机卖多少钱”','意思是“请让吹风机结束”'],
['意思是“可以买试穿吗”','着物是和服,意思是“可以吃和服吗”','意思是“试穿是哪国的”'],
['卖完是「売り切れ」','不能试穿是「試着できません」','收银台付款是「レジでお支払い」'],
['意思是“请违反颜色”','意思是“有不同的钱吗”','意思是“吃这个颜色吗”'],
['不能退货是「返品できません」','二维码是「QRコード」','排队是「並んでください」'],
['意思是“请洗手”','意思是“吃厕所吗”','意思是“我去过厕所了,多少钱”'],
['意思是“我吃了钱包”','意思是“我买了钱包,交番几点”','意思是“我喜欢钱包,不想去交番”'],
['商店是「店」','可通行是「通行可」','单行道是「一方通行」'],
['地址是「住所」','需要帮助是「お手伝いしましょうか」','饿了是「お腹すきましたか」']];
var HU=['收尾可点「〆の一品」,有些店有〆ラーメン(收尾拉面)','店员会说「お通しになります」;也有不收お通し的店','「もう一杯」可用于任何饮料:「もう一杯、ウーロン茶で」','也见「2時間飲み放題」;追加料金写作「プラス500円」','回转寿司、牛丼店也有类似机器,可切换日语、英语、中文','拉面常见三档:かため/ふつう/やわらかめ','「〜抜き」可用于任何食材:「わさび抜き」「氷抜き」','续面一般150~200日元,趁汤热时说「替え玉ください」','「温めなしで」是不用加热;「お箸つけますか」是要筷子吗','「レジ袋有料」是收费塑料袋;「エコバッグ」是自带环保袋','「半額」是半价;折扣贴纸多在19点后出现','「大丈夫です」也可用于婉拒推销、试吃和传单','其他类型:「急行」「特急」「準急」,不同公司叫法和停站不同','类似词:「遅延」「運転見合わせ」「振替輸送」(用别的线路无需另买票)','也可问「何番線ですか」(几号站台)、「次は何駅ですか」','「乗り換えます」是“我要换乘”;「乗り換え案内」是换乘指南','护照复印件不被接受;免税要在店内指定柜台办','「税別」要另外加10%(餐饮外带为8%)','同类句型「〇〇はどこで買えますか」;药妆店常说「〇〇コーナー」','「頓服」是不舒服时再吃;「就寝前」是睡前','早到可说「荷物を預かってもらえますか」;退房一般11点前','「お預かり」是寄存凭证;「手荷物」是随身行李','「朝食付き」是含早餐的房价;「朝食なし」是不含','可借的常见物品:「充電器」「加湿器」「ズボンプレッサー」','也可问「サイズはありますか」「大きいサイズはありますか」','「少々お待ちください」可用于任何等一下的场合;「在庫切れ」是缺货','同类:「サイズ違い」「柄違い」(不同花纹)','食品、药妆等消耗品和衣物的免税规定不同,购买前可确认','「トイレ」也通用;「多目的トイレ」是无障碍卫生间','也可说「落とし物をしました」,找东西可问「届いていますか」','同类告示:「立入禁止」「関係者以外立入禁止」「迂回してください」','回答「少しだけ」或「英語は大丈夫です」都可以'];
Q.forEach(function(q,i){q.d=HD[i];q.u=HU[i]});
var U={'鮪':'赤身(瘦肉)、中トロ、大トロ越来越肥,点单可说「赤身をください」','大トロ':'价格通常最贵,回转寿司按贯(かん)计价','鮭':'也写サーモン;鮭おにぎり是便利店最常见的饭团口味','鰻':'鰻重、うな丼、ひつまぶし都是鳗鱼饭,夏季土用丑日最应季','穴子':'常吃的是煮穴子,淋甜酱汁,口感比鳗鱼轻','雲丹':'北海道产的最有名;军舰卷写作「うに軍艦」','いくら':'常见吃法是いくら丼、军舰卷;鳕鱼子是「たらこ」,别搞混','玉子':'寿司里的玉子是甜蛋烧;拉面里说「味玉」','海老':'天ぷら里常见「海老天」;甜虾是「甘えび」','牛タン':'仙台的牛タン定食最出名,配麦饭和尾汤','カルビ':'烤肉店必点,偏肥嫩;瘦一点的是「ロース」','ハラミ':'口感软嫩多汁,是烤肉店人气款','ホルモン':'指内脏类,也写「もつ」;不确定时可问「何の部位ですか」','和牛':'A5是最高等级,菜单上会直接标出','手羽先':'名古屋的手羽先唐揚げ很出名','ねぎま':'焼き鳥的经典款,鸡肉和大葱交替串','醤油':'拉面口味之一,清澈偏咸鲜;也指酱油本身','味噌':'札幌的味噌拉面最出名;也指味噌汤的味噌','豚骨':'九州博多拉面是代表,汤色乳白','つけ麺':'面和汤分开上,蘸着吃;吃完可说「スープ割りをお願いします」加汤','うどん':'关西偏淡汤,关东偏浓汤;冷吃是「ざるうどん」','そば':'冷吃叫「ざるそば」,热吃叫「かけそば」','大盛り':'点单说「大盛りにしてください」,多数店免费或只加一点钱','牛丼':'吉野家、松屋、すき家都有;「つゆだく」是汤汁多','定食':'通常包含主菜、米饭、味噌汤、小菜;不少店米饭可免费续','おにぎり':'便利店有鮭、梅、昆布、ツナマヨ等口味','天ぷら':'蘸天つゆ或盐吃;「天ぷら盛り合わせ」是拼盘','唐揚げ':'居酒屋常配柠檬;「唐揚げ定食」是炸鸡套餐','餃子':'日本以煎饺为主;「水餃子」是水饺','枝豆':'居酒屋最常见的下酒小菜,多半是最先上桌的','焼き鳥':'点单分「塩」(盐味)和「タレ」(甜酱味)','もつ鍋':'福冈名物,最后可加面或煮杂炊','しゃぶしゃぶ':'薄肉片在高汤里涮,蘸ごまだれ或ポン酢','すき焼き':'牛肉用甜咸酱汁煮,蘸生鸡蛋吃','抹茶':'抹茶ラテ、抹茶アイス、抹茶パフェ都是常见搭配','かき氷':'夏季居多,糖浆口味有イチゴ(草莓)、レモン等','日本酒':'点单可说「冷やで」(常温/冰)或「熱燗で」(热)','ハイボール':'居酒屋常见饮品,加柠檬的叫「レモンハイ」','生ビール':'点单常说「とりあえず生」(先来杯生啤)','わさび':'回转寿司要少放可说「さび抜き」','七味':'撒在乌冬、牛丼、烤串上;辣度比一味(いちみ)温和','納豆':'外国游客可事先问「納豆は入っていますか」','お会計':'「お会計は一緒ですか」是问是否合并结账;分开付说「別々でお願いします」','食べ放題':'限时用餐,常见90分钟;「飲み放題」是畅饮','持ち帰り':'也说「テイクアウト」;店内吃是「イートイン」','予約':'打电话说「予約をお願いしたいのですが」;网上常见「予約必須」','アレルギー':'点单前说「〇〇アレルギーがあります」,例如「そばアレルギー」','家系':'横浜发源,常用「麺かため・味濃いめ・油多め」点法','二郎系':'常有“咒语”点法,店员问「ニンニク入れますか」,可答「ニンニクなし」','背脂':'点单可选「背脂多め/少なめ」','麺かため':'完整说法「麺かため、味濃いめ、油少なめ」','食券':'先买后交给店员,有时会再问面的硬度','券売機':'现金居多,很多店不能刷卡;有「おつり」按钮取零钱','現金のみ':'支持刷卡的店会写「カード可」','先付':'相当于开胃小菜,有时包含在座位费里','会席':'和「懐石」读音相同,懐石偏茶道,会席更像宴席','熱燗':'也说「お燗」;偏温的叫「ぬる燗」','純米':'没添加酿造酒精的清酒;「純米大吟醸」更高级','辛口':'在清酒里指偏干(不甜),在咖喱里指偏辣','徳利':'点酒常用单位是「一合」,约180ml'};
function cat(q){return q.t==='r'?q.q.split('词(')[1].split(')')[0]:q.q.slice(q.q.lastIndexOf('(')+1,-1)}
var LW={},LZ={};
function lk(){if(lk.d)return;lk.d=1;[GF,GR,GW,GI,GA].concat(GSH).forEach(function(A){A.forEach(function(q){var m=q.e.split(' = ');if(q.t==='r')LW[cat(q)+'|'+q.o[0]]=m[0];else LZ[cat(q)+'|'+q.o[0]]=m[1]})})}
function xo(q,k){if(q.d)return q.d[k<q.a?k:k-1]||'';var key=cat(q)+'|'+q.o[k];var v=q.t==='r'?LW[key]:LZ[key];return v?(q.t==='r'?'对应的日语是「'+v+'」':'意思是「'+v+'」'):''}
function gen(V,sid){var out=[];Object.keys(V).forEach(function(c){
  var L=V[c].map(function(r){var p=r.split("|");return{j:p[0],k:p[1],z:p[2],w:p[0]+(p[0]!==p[1]?"("+p[1]+")":"")}});
  L.forEach(function(x){var ds=shuf(L.filter(function(y){return y!==x})).slice(0,3);
    out.push({s:sid,t:"r",q:"菜单或招牌上看到这个词("+c+"),是什么意思?",j:x.w,o:[x.z].concat(ds.map(function(y){return y.z})),a:0,e:x.w+" = "+x.z});
    out.push({s:sid,t:"s",q:"我想点或问“"+x.z+"”,日语怎么说?("+c+")",o:[x.w].concat(ds.map(function(y){return y.w})),a:0,e:x.w+" = "+x.z});
  });});return out}
var GR=gen({
"拉面汤底与种类":["家系|いえけい|家系拉面(浓厚猪骨酱油)","二郎系|じろうけい|二郎系(大分量、蒜味重)","煮干し|にぼし|小鱼干汤底","鶏白湯|とりぱいたん|白浓鸡汤","魚介|ぎょかい|鱼介(海鲜)汤底","背脂|せあぶら|猪背脂","台湾まぜそば|たいわんまぜそば|台湾拌面(无汤)","油そば|あぶらそば|油拌面","汁なし担々麺|しるなしたんたんめん|无汤担担面","辛味噌|からみそ|辣味噌","白湯|ぱいたん|白汤(乳白浓汤)","清湯|ちんたん|清汤"],
"拉面配料":["煮卵|にたまご|卤蛋","海苔増し|のりまし|加量海苔","青ねぎ|あおねぎ|青葱","白ねぎ|しろねぎ|大葱白","もやし|もやし|豆芽","コーン|こーん|玉米","バター|ばたー|黄油","ニンニク|にんにく|蒜","刻みニンニク|きざみにんにく|蒜末","辛子高菜|からしたかな|辣腌芥菜","紅生姜|べにしょうが|红姜丝","白ごま|しろごま|白芝麻","豚バラチャーシュー|ぶたばらちゃーしゅー|五花叉烧","肩ロース|かたろーす|肩里脊(叉烧部位)","トッピング|とっぴんぐ|加料","追加|ついか|追加(加点)"],
"拉面点单":["麺かため|めんかため|面硬一点","薄め|うすめ|味道淡一点","濃いめ|こいめ|味道浓一点","油少なめ|あぶらすくなめ|少油","油多め|あぶらおおめ|多油","替え玉無料|かえだまむりょう|续面免费","小ライス|こらいす|小碗米饭","半チャーハン|はんちゃーはん|半份炒饭","餃子セット|ぎょうざせっと|饺子套餐","食券|しょくけん|餐券","券売機|けんばいき|售票式点餐机","現金のみ|げんきんのみ|只收现金","カウンター席|かうんたーせき|吧台座位"]
},"ramenv");
var GW=gen({
"日料烹饪方式":["焼き物|やきもの|烤物","揚げ物|あげもの|炸物","煮物|にもの|炖煮物","蒸し物|むしもの|蒸物","和え物|あえもの|凉拌菜","酢の物|すのもの|醋拌菜","刺身|さしみ|生鱼片","汁物|しるもの|汤类","鍋物|なべもの|火锅类","茶碗蒸し|ちゃわんむし|蒸蛋羹"],
"怀石与套餐流程":["先付|さきづけ|前菜(开胃小菜)","八寸|はっすん|季节小菜拼盘","お椀|おわん|清汤","造り|つくり|刺身拼盘","強肴|しいざかな|套餐中另添的一道菜","止め椀|とめわん|收尾味噌汤","水菓子|みずがし|餐后水果","懐石|かいせき|怀石料理","会席|かいせき|会席料理(宴席)","御膳|ごぜん|御膳(托盘套餐)"],
"清酒与器皿":["徳利|とっくり|酒壶","お猪口|おちょこ|小酒杯","熱燗|あつかん|加热的日本酒","冷酒|れいしゅ|冰镇日本酒","純米|じゅんまい|纯米酒","吟醸|ぎんじょう|吟酿酒","辛口|からくち|偏干(不甜)","甘口|あまくち|偏甜","箸置き|はしおき|筷架","湯呑み|ゆのみ|茶杯"]
},"washoku");
var V={
"寿司刺身":["鮪|まぐろ|金枪鱼","大トロ|おおとろ|金枪鱼大腹","中トロ|ちゅうとろ|金枪鱼中腹","鮭|さけ|三文鱼","鯛|たい|鲷鱼","鰤|ぶり|鰤鱼","鯵|あじ|竹荚鱼","鯖|さば|青花鱼","鰹|かつお|鲣鱼","鰻|うなぎ|鳗鱼","穴子|あなご|海鳗","海老|えび|虾","甘海老|あまえび|甜虾","帆立|ほたて|扇贝","雲丹|うに|海胆","いくら|いくら|鲑鱼子","蛸|たこ|章鱼","烏賊|いか|乌贼","蟹|かに|螃蟹","納豆巻き|なっとうまき|纳豆卷"],
"肉类烤肉":["牛タン|ぎゅうたん|牛舌","カルビ|かるび|牛五花","ロース|ろーす|里脊肉","ハラミ|はらみ|横膈膜肉","ホルモン|ほるもん|内脏","豚バラ|ぶたばら|猪五花","鶏もも|とりもも|鸡腿肉","鶏むね|とりむね|鸡胸肉","手羽先|てばさき|鸡翅","つくね|つくね|鸡肉丸串","ねぎま|ねぎま|葱段鸡肉串","砂肝|すなぎも|鸡胗","霜降り|しもふり|雪花(肥瘦相间)","和牛|わぎゅう|和牛"],
"面饭主食":["醤油|しょうゆ|酱油口味","味噌|みそ|味噌口味","塩|しお|盐味","豚骨|とんこつ|猪骨浓汤","つけ麺|つけめん|蘸面","担々麺|たんたんめん|担担面","うどん|うどん|乌冬面","そば|そば|荞麦面","焼きそば|やきそば|炒面","チャーシュー|ちゃーしゅー|叉烧","味玉|あじたま|入味溏心蛋","メンマ|めんま|笋干","大盛り|おおもり|加量","牛丼|ぎゅうどん|牛肉盖饭","親子丼|おやこどん|鸡肉鸡蛋盖饭","カツ丼|かつどん|炸猪排盖饭","天丼|てんどん|天妇罗盖饭","海鮮丼|かいせんどん|海鲜盖饭","うな重|うなじゅう|鳗鱼饭","オムライス|おむらいす|蛋包饭","定食|ていしょく|套餐","おにぎり|おにぎり|饭团"],
"居酒屋小吃":["唐揚げ|からあげ|炸鸡块","天ぷら|てんぷら|天妇罗","とんかつ|とんかつ|炸猪排","串カツ|くしかつ|炸串","たこ焼き|たこやき|章鱼烧","お好み焼き|おこのみやき|大阪烧","餃子|ぎょうざ|煎饺","枝豆|えだまめ|毛豆","冷奴|ひややっこ|冷豆腐","焼き鳥|やきとり|烤鸡肉串","出汁巻き玉子|だしまきたまご|高汤蛋卷","揚げ出し豆腐|あげだしどうふ|炸豆腐","もつ鍋|もつなべ|内脏锅","しゃぶしゃぶ|しゃぶしゃぶ|涮涮锅","すき焼き|すきやき|寿喜烧","刺身盛り合わせ|さしみもりあわせ|刺身拼盘"],
"甜点饮品":["抹茶|まっちゃ|抹茶","ほうじ茶|ほうじちゃ|焙茶","ウーロン茶|うーろんちゃ|乌龙茶","大福|だいふく|大福","どら焼き|どらやき|铜锣烧","たい焼き|たいやき|鲷鱼烧","みたらし団子|みたらしだんご|御手洗团子","かき氷|かきごおり|刨冰","ソフトクリーム|そふとくりーむ|软冰淇淋","プリン|ぷりん|布丁","日本酒|にほんしゅ|日本清酒","焼酎|しょうちゅう|烧酒","ハイボール|はいぼーる|威士忌苏打","梅酒|うめしゅ|梅酒","生ビール|なまびーる|生啤"],
"调味食材":["大根おろし|だいこんおろし|萝卜泥","わさび|わさび|芥末","生姜|しょうが|姜","山椒|さんしょう|山椒","ポン酢|ぽんず|柑橘酱油","柚子|ゆず|柚子","七味|しちみ|七味辣椒粉","梅干し|うめぼし|腌梅子","納豆|なっとう|纳豆","豆腐|とうふ|豆腐","昆布|こんぶ|海带","海苔|のり|海苔","味噌汁|みそしる|味噌汤","漬物|つけもの|腌菜"],
"点餐用语":["食べ放題|たべほうだい|自助畅吃","お会計|おかいけい|结账","相席|あいせき|拼桌","持ち帰り|もちかえり|外带","取り皿|とりざら|分餐小碟","おしぼり|おしぼり|湿毛巾","割り箸|わりばし|一次性筷子","予約|よやく|预约","禁煙席|きんえんせき|禁烟座位","アレルギー|あれるぎー|过敏"]
};
var GF=[];
Object.keys(V).forEach(function(c){
  var L=V[c].map(function(r){var p=r.split("|");return{j:p[0],k:p[1],z:p[2],w:p[0]+(p[0]!==p[1]?"("+p[1]+")":"")}});
  L.forEach(function(x){
    var ds=shuf(L.filter(function(y){return y!==x})).slice(0,3);
    GF.push({s:"food",t:"r",q:"菜单或招牌上看到这个词("+c+"),是什么意思?",j:x.w,o:[x.z].concat(ds.map(function(y){return y.z})),a:0,e:x.w+" = "+x.z});
    GF.push({s:"food",t:"s",q:"我想点或问“"+x.z+"”,日语怎么说?("+c+")",o:[x.w].concat(ds.map(function(y){return y.w})),a:0,e:x.w+" = "+x.z});
  });
});
function home(){
  var h='<h1>日本旅行日语闯关</h1><p class="lead">你是第一次来日本的游客,在居酒屋、车站、药妆店遇到日语,选出正确的意思或说法。每次10题。</p>';
  h+='<div class="grid"><button class="scene all" data-s="all">全部场景随机挑战</button>';
  S.forEach(function(x){h+='<button class="scene" data-s="'+x.id+'" style="--c:'+x.c+'"><span class="badge">'+x.e+'</span><span><b>'+x.n+'</b><small>'+x.d+'</small></span></button>'});
  h+='</div>';
  app.innerHTML=h;
  app.querySelectorAll(".scene").forEach(function(b){b.onclick=function(){start(b.dataset.s)}});
  window.scrollTo(0,0);
}
var seen=new Set();
function begin(l){st={list:l,i:0,score:0,wrong:[],ans:false};show()}
function full(id){return id==="all"?Q.concat(GF,GR,GW,GI,GH):id==="food"?GF:id==="ramenv"?GR:id==="washoku"?GW:id==="izakaya"?Q.filter(function(q){return q.s===id}).concat(GI,GH):Q.filter(function(q){return q.s===id})}
function pickNew(id,n){
  var un=full(id).filter(function(q){return !seen.has(q)});
  if(id==="all"){
    var a=shuf(un.filter(function(q){return q.d})),b=shuf(un.filter(function(q){return !q.d}));
    var l=a.slice(0,4).concat(b.slice(0,n-Math.min(4,a.length)));
    if(l.length<n)l=l.concat(a.slice(4)).slice(0,n);
    return shuf(l);
  }
  return shuf(un).slice(0,n);
}
function start(id){
  var count=(typeof window.survivalQuestionCount==="function"?window.survivalQuestionCount():10);
  var l=pickNew(id,count);
  if(l.length<count){var rest=shuf(full(id).filter(function(q){return seen.has(q)}));l=l.concat(rest.slice(0,count-l.length))}
  begin(shuf(l));
}
function show(){
  var q=st.list[st.i],s=sc(q.s),n=st.list.length;
  var idx=shuf(q.o.map(function(_,k){return k}));
  var h='<button class="spkbtn quiz-home" onclick="quizHome()">⌂ 回到主页</button><div class="top"><span>第 '+(st.i+1)+' / '+n+' 题</span><span>得分 '+st.score+'</span></div><div class="bar"><i style="width:'+(st.i/n*100)+'%"></i></div>';
  h+='<div class="tag" style="--c:'+s.c+'">'+s.e+' '+s.n+'</div><div class="q" style="--c:'+s.c+'"><p>'+esc(q.q)+'</p>';
  if(q.t==="r")h+='<div class="jp" lang="ja">'+esc(q.j)+'</div>'+(q.reading?'<p class="ramen-reading" lang="ja">'+esc(q.reading)+'</p>':'')+'<button class="spkbtn" data-a="1">🔊 听读音</button>';
  h+='<p style="color:var(--sub);font-size:14px;margin:12px 0 0">'+(q.t==="r"?"这是什么意思?":"选出最自然、最正确的日语说法")+'</p></div><div class="opts">';
  idx.forEach(function(k){h+='<button class="opt" data-k="'+k+'"'+(q.t==="s"?' lang="ja"':'')+'>'+esc(q.o[k])+'</button>'});
  h+='</div><div id="fb"></div>';
  app.innerHTML=h;st.ans=false;
  app.querySelectorAll(".opt").forEach(function(b){b.onclick=function(){pick(+b.dataset.k)}});
  window.scrollTo(0,0);
}
function pick(k){
  if(st.ans)return;st.ans=true;
  var q=st.list[st.i],good=k===q.a;seen.add(q);
  if(good)st.score++;else st.wrong.push(q);
  app.querySelectorAll(".opt").forEach(function(b){
    b.disabled=true;var v=+b.dataset.k;
    if(v===q.a)b.classList.add("ok");else if(v===k)b.classList.add("ng");
  });
  var last=st.i===st.list.length-1;
  var h='<div class="fb '+(good?"ok":"ng")+'"><b>'+(good?"答对了":"答错了")+'</b><p>'+esc(q.t==='r'?q.j:q.o[q.a])+'</p><button class="spkbtn" data-a="1">🔊 听读音</button></div>'+extra(q)+'<button class="btn" id="nx">'+(last?"查看结果":"下一题")+'</button>';
  var f=document.getElementById("fb");f.innerHTML=h;
  document.getElementById("nx").onclick=function(){st.i++;last?end():show()};
  document.getElementById("nx").focus();
  f.scrollIntoView({block:"nearest",behavior:"smooth"});
}
function end(){
  var n=st.list.length,r=st.score/n;
  var msg=r===1?"满分!可以直接当向导了。":r>=.7?"很不错,出发没问题。":r>=.4?"基础有了,再练几个场景吧。":"别担心,把下面的错题看一遍再来。";
  var h='<h1>挑战结束</h1><div class="score">'+st.score+' / '+n+'</div><p class="lead">'+msg+'</p>';
  if(st.wrong.length){
    h+='<h2 style="font-size:18px">错题回顾</h2><ul class="wrong">';
    st.wrong.forEach(function(q){
      h+='<li>'+(q.t==="r"?'<span class="j" lang="ja">'+esc(q.j)+'</span><br>':'<span>'+esc(q.q)+'</span><br><span class="j" lang="ja">'+esc(q.o[q.a])+'</span><br>')+'<details><summary>查看完整解析</summary>'+fullExplanation(q)+'</details></li>';
    });
    h+='</ul>';
  }
  var left=full(window._cur||"all").filter(function(q){return !seen.has(q)}).length,rl=st.list.slice();
  h+=(left?'<button class="btn" id="cont">继续挑战(本场景还剩 '+left+' 题没做过)</button>':'<p class="lead">本场景的题目已经全部答过了,可以复习或换个场景。</p>')+'<button class="btn ghost" id="rv">复习本轮</button><button class="btn ghost" id="hm">回到场景列表</button>';
  app.innerHTML=h;
  var last=st.list.map(function(q){return q.s});
  document.getElementById("rv").onclick=function(){begin(shuf(rl))};
  var cb=document.getElementById("cont");if(cb)cb.onclick=function(){begin(pickNew(window._cur||"all",10))};
  document.getElementById("hm").onclick=home;
  window.scrollTo(0,0);
}
var _start=start;
start=function(id){window._cur=id;_start(id)};
function sp(s){var p=esc(s).split('「'),o=p[0];for(var i=1;i<p.length;i++){var j=p[i].indexOf('」');if(j<0){o+='「'+p[i]}else{var x=p[i].slice(0,j);o+='<button class="spk" data-t="'+x+'">「'+x+'」🔊</button>'+p[i].slice(j+1)}}return o}
var SC={
'銀杏':'銀杏を一本お願いします。|麻烦来一串烤银杏（在串烧菜单下点单）;銀杏って、どんな食べ物ですか？|银杏是什么食物？;これは銀杏の串焼きですか？|这是烤银杏串吗？',
'わさび':'わさび抜きでお願いします|请不要放芥末;わさびは少なめでお願いします|请少放一点芥末;わさびは別にしてください|芥末请分开放',
'鮪':'赤身をください|请给我瘦的金枪鱼;中トロを二貫お願いします|请来两贯中腹',
'大トロ':'大トロを一貫ください|请来一贯大腹;大トロは時価ですか|大腹是时价吗',
'鮭':'サーモンをください|请给我三文鱼;鮭は焼いたものですか|三文鱼是烤过的吗',
'鰻':'うな重をお願いします|请来一份鳗鱼饭;山椒をかけてください|请撒点山椒',
'穴子':'穴子を一貫お願いします|请来一贯海鳗;タレですか、塩ですか|是蘸酱还是蘸盐(店员常问)',
'雲丹':'うにを軍艦でください|请做成军舰卷的海胆;うには苦手です|我不太能吃海胆',
'いくら':'いくらをお願いします|请来鲑鱼子;いくら丼はありますか|有鲑鱼子盖饭吗',
'生姜':'生姜は入っていますか|里面有姜吗;生姜抜きでお願いします|请不要放姜',
'ポン酢':'ポン酢をください|请给我柑橘酱油',
'七味':'七味をかけてください|请撒点七味粉',
'納豆':'納豆は苦手です|我不太能吃纳豆;納豆抜きでお願いします|请不要放纳豆',
'大根おろし':'大根おろしを多めにください|请多给点萝卜泥',
'梅干し':'梅干し抜きでお願いします|请不要放腌梅子',
'海苔':'海苔増しでお願いします|请多加点海苔',
'味噌汁':'味噌汁はおかわりできますか|味噌汤可以续吗',
'漬物':'漬物はついていますか|附带腌菜吗',
'牛タン':'牛タンを二人前ください|请来两人份牛舌;レモンで食べますか|是蘸柠檬吃吗',
'カルビ':'カルビを一人前お願いします|请来一份牛五花',
'ロース':'ロースは塩でお願いします|里脊请用盐味',
'ハラミ':'ハラミをタレでください|横膈膜请用酱汁味',
'ホルモン':'ホルモンは何の部位ですか|内脏是什么部位',
'和牛':'和牛はどこ産ですか|和牛是哪里产的',
'霜降り':'霜降りの部位はありますか|有雪花肉的部位吗',
'手羽先':'手羽先を五本ください|请来五个鸡翅',
'ねぎま':'ねぎまを塩でお願いします|葱鸡肉串请用盐味',
'焼き鳥':'焼き鳥盛り合わせをお願いします|请来一份烤串拼盘;塩とタレ、どちらにしますか|盐味还是酱味(店员常问)',
'醤油':'醤油ラーメンをお願いします|请来酱油拉面',
'味噌':'味噌ラーメンをお願いします|请来味噌拉面',
'豚骨':'豚骨ラーメンの麺かために|猪骨拉面面硬一点',
'つけ麺':'つけ麺の大盛りをお願いします|请来大份蘸面;スープ割りをお願いします|请帮我加汤',
'うどん':'かけうどんをください|请来清汤乌冬;冷たいうどんはありますか|有冷乌冬吗',
'そば':'ざるそばをお願いします|请来冷荞麦面',
'大盛り':'大盛りでお願いします|请给我大份;大盛り無料ですか|加大份免费吗',
'牛丼':'牛丼の並をください|请来中份牛丼;つゆだくでお願いします|请多放汤汁',
'定食':'唐揚げ定食をお願いします|请来炸鸡套餐;ご飯は大盛りにできますか|米饭可以加大吗',
'おにぎり':'この鮭おにぎりをください|请给我这个三文鱼饭团',
'唐揚げ':'レモンをかけますか|要挤柠檬吗(店员常问);レモンなしでお願いします|请不要柠檬',
'天ぷら':'天ぷらは塩で食べますか|天妇罗用盐吃吗',
'餃子':'焼き餃子を一人前ください|请来一份煎饺;ラー油をください|请给我辣油',
'枝豆':'枝豆を一つお願いします|请来一份毛豆',
'もつ鍋':'もつ鍋を二人前お願いします|请来两人份内脏锅;〆の雑炊をお願いします|最后请做杂炊',
'しゃぶしゃぶ':'しゃぶしゃぶ食べ放題はありますか|有涮涮锅畅吃吗',
'すき焼き':'生卵をください|请给我生鸡蛋;お肉の追加をお願いします|请加点肉',
'抹茶':'抹茶ラテをください|请来一杯抹茶拿铁;甘さ控えめでお願いします|请少糖',
'日本酒':'おすすめの日本酒はありますか|有推荐的日本酒吗;辛口でお願いします|请给我偏干的',
'焼酎':'焼酎をお湯割りでお願いします|烧酒请兑热水;ロックでください|请加冰',
'ハイボール':'ハイボールを濃いめでお願いします|请把高球做得浓一点',
'生ビール':'とりあえず生を二つください|先来两杯生啤',
'かき氷':'いちごのかき氷をください|请来草莓刨冰',
'ソフトクリーム':'ソフトクリームをバニラでお願いします|请来香草软冰淇淋',
'ウーロン茶':'ウーロン茶をください|请给我乌龙茶;氷なしでお願いします|请不要冰',
'お会計':'お会計をお願いします|请结账;別々でお願いします|请分开付',
'食べ放題':'食べ放題は何分ですか|畅吃限时多久',
'持ち帰り':'持ち帰りでお願いします|请外带',
'予約':'今夜二名で予約したいのですが|想订今晚两位',
'アレルギー':'そばアレルギーがあります|我对荞麦过敏;卵は入っていますか|里面有鸡蛋吗',
'取り皿':'取り皿をください|请给我分餐碟',
'おしぼり':'おしぼりをください|请给我湿毛巾',
'割り箸':'割り箸をください|请给我一次性筷子',
'相席':'相席でもいいですか|可以拼桌吗',
'禁煙席':'禁煙席でお願いします|请给我禁烟座位',
'麺かため':'麺かために、味濃いめで|面硬一点,味道浓一点',
'薄め':'スープは薄めでお願いします|汤请淡一点',
'濃いめ':'味は濃いめでお願いします|味道请浓一点',
'油少なめ':'油少なめでお願いします|请少油',
'煮卵':'煮卵をトッピングしてください|请加一个卤蛋',
'ニンニク':'ニンニクなしでお願いします|请不要蒜;ニンニク入れますか|要加蒜吗(店员常问)',
'券売機':'券売機はどこですか|点餐机在哪里',
'現金のみ':'カードは使えますか|可以刷卡吗',
'カウンター席':'カウンター席でいいです|吧台座位就可以',
'トッピング':'トッピングは何がありますか|有哪些配料',
'追加':'チャーシューを追加してください|请追加叉烧',
'半チャーハン':'半チャーハンのセットをお願いします|请来配半份炒饭的套餐',
'小ライス':'小ライスをください|请给我小碗米饭',
'熱燗':'熱燗をお願いします|请来热清酒',
'冷酒':'冷酒をください|请来冰镇清酒',
'徳利':'徳利で一合お願いします|请来一壶(一合)',
'純米':'純米酒はありますか|有纯米酒吗',
'辛口':'辛口でお願いします|请给我偏干的',
'甘口':'甘口でお願いします|请给我偏甜的',
'懐石':'懐石コースを予約したいです|想预约怀石套餐',
'先付':'この先付は何ですか|这道前菜是什么',
'茶碗蒸し':'茶碗蒸しを追加できますか|能加一份蒸蛋吗',
'刺身':'刺身の盛り合わせをお願いします|请来刺身拼盘'};
function scn(q){if(q.d)return '';var s=SC[q.e.split(' = ')[0].split('(')[0]];if(!s)return '';return '<div class="fb"><b>使用场景</b><ul style="margin:6px 0 0;padding-left:20px">'+s.split(';').map(function(x){var p=x.split('|');return '<li><button class="spk" data-t="'+esc(p[0])+'">'+esc(p[0])+'🔊</button><br><span style="color:var(--sub)">'+esc(p[1])+'</span></li>'}).join('')+'</ul></div>'}
var GI=gen({
'入座与座位':['個室|こしつ|包间','座敷|ざしき|榻榻米座位','掘りごたつ|ほりごたつ|地炉式座位(可放脚)','テーブル席|てーぶるせき|桌席','席料|せきりょう|使用座位收取的费用','お通し|おとおし|入座后提供、通常收费的小菜','予約席|よやくせき|预约席'],
'点单与结账':['注文|ちゅうもん|点单','おすすめ|おすすめ|推荐菜','人気メニュー|にんきめにゅー|人气菜品','季節限定|きせつげんてい|季节限定','ラストオーダー|らすとおーだー|最后点单','コース|こーす|套餐(含多道菜)','宴会|えんかい|宴会聚餐','飲み放題|のみほうだい|畅饮','サービス料|さーびすりょう|服务费','一人前|いちにんまえ|一人份','追加注文|ついかちゅうもん|加点','キャンセル|きゃんせる|取消'],
'酒类点法':['乾杯|かんぱい|干杯','とりあえず生|とりあえずなま|先来杯生啤','中ジョッキ|ちゅうじょっき|中杯生啤','大ジョッキ|だいじょっき|大杯生啤','レモンサワー|れもんさわー|柠檬沙瓦','ウーロンハイ|うーろんはい|乌龙茶烧酒','カシスオレンジ|かしすおれんじ|黑加仑橙汁鸡尾酒','ノンアルコール|のんあるこーる|无酒精饮料','ロック|ろっく|加冰块纯饮','水割り|みずわり|兑水','お湯割り|おゆわり|兑热水','ソーダ割り|そーだわり|兑苏打水','ボトルキープ|ぼとるきーぷ|寄存酒瓶'],
'下酒小菜':['たこわさ|たこわさ|芥末章鱼','塩辛|しおから|鱼贝类盐渍熟成小菜','ししゃも|ししゃも|柳叶鱼','ホッケ|ほっけ|花鲫鱼','牛すじ煮込み|ぎゅうすじにこみ|炖牛筋','厚揚げ|あつあげ|厚炸豆腐','肉じゃが|にくじゃが|土豆炖肉','軟骨唐揚げ|なんこつからあげ|炸软骨','フライドポテト|ふらいどぽてと|炸薯条','シーザーサラダ|しーざーさらだ|凯撒沙拉','きゅうりの浅漬け|きゅうりのあさづけ|浅渍黄瓜','ピリ辛|ぴりから|微辣','焼きおにぎり|やきおにぎり|烤饭团'],
'烤串部位与口味':['タレ|たれ|甜酱味','塩|しお|盐味','皮|かわ|鸡皮串','レバー|ればー|鸡肝','ハツ|はつ|心脏','ぼんじり|ぼんじり|鸡屁股肉','せせり|せせり|鸡颈肉','ささみ|ささみ|鸡里脊','ししとう|ししとう|烤青椒','銀杏|ぎんなん|白果（银杏种仁）','アスパラ巻き|あすぱらまき|肉卷芦笋'],
'收尾':['〆|しめ|收尾(最后吃的)','お茶漬け|おちゃづけ|茶泡饭','雑炊|ぞうすい|杂炊(米粥)','締めのラーメン|しめのらーめん|收尾拉面','アイス|あいす|冰淇淋']
},'izakaya');
// 明确区分小菜名称与费用名称，同时保留分类供解析查找。
GI.forEach(function(q){
  if(q.t!=='s')return;
  var term=q.e.split(' = ')[0].split('(')[0];
  if(term==='お通し')q.q='入座后，店员端来一小碟你没点的菜，通常会收费。想问“这份入座小菜叫什么”，日语用哪个词？(入座与座位)';
  if(term==='席料')q.q='账单上写着一项“使用座位收取的费用”。这里问的是费用名称，不是小菜名称，日语用哪个词？(入座与座位)';
});
var GH=[
{s:'izakaya',t:'s',q:'店员问“几位?”,我们一共三个人,怎么回答?',o:['三人です。','三階です。','三つ食べます。','三回です。'],a:0,e:'人数用「〜人です」,店员会问「何名様ですか」。',d:['「三階」是三楼','「三つ食べます」是“我要吃三个”','「三回」是三次'],u:'一人、二人(ふたり)、三人、四人;不确定时也可以直接竖起手指'},
{s:'izakaya',t:'s',q:'想叫店员过来点菜,怎么说?',o:['すみません、注文お願いします。','すみません、会計お願いします。','すみません、予約お願いします。','すみません、メニューを返します。'],a:0,e:'注文=点单,招手并说“すみません”是叫店员的标准方式。',d:['会計是结账','予約是预约','意思是“我把菜单还给你”'],u:'很多居酒屋没有呼叫铃,有的桌上有「呼び出しボタン」按钮'},
{s:'izakaya',t:'r',q:'店员说了这句话,是什么意思?',j:'ラストオーダーは23時になります。',o:['最后点单时间是23点','23点开始营业','23点之后开始收座位费','23点之后全部半价'],a:0,e:'ラストオーダー(L.O.)是最后点单,通常比打烊早30分钟到1小时。',d:['开始营业是「営業開始」','座位费是「席料」','半价是「半額」'],u:'想提前确认可以问「ラストオーダーは何時ですか」'},
{s:'izakaya',t:'r',q:'小票上有这一项,是什么?',j:'サービス料 10%',o:['服务费10%','消费税10%','会员折扣10%','小费10%'],a:0,e:'有些店会另收服务费,和消费税是两回事。',d:['消费税是「消費税」','会员折扣是「会員割引」','日本没有给小费的习惯,账单上一般不会写小费'],u:'日本餐厅一般不需要另给小费;居酒屋常见的额外费用是「席料」或「お通し」'},
{s:'izakaya',t:'s',q:'我想问能不能不要入座小菜,哪句话比较自然?',o:['お通しはなしにできますか。','お通しをもう一つください。','お通しはどこですか。','お通しを買いたいです。'],a:0,e:'〜なしにできますか=能不要……吗。',d:['意思是“再来一份小菜”','意思是“小菜在哪里”','意思是“我想买小菜”'],u:'多数店不能取消お通し,点单前可先问「お通しはありますか」'},
{s:'izakaya',t:'r',q:'入座后店员问了这句话,他想问什么?',j:'お飲み物は何になさいますか。',o:['您想喝点什么','您想吃什么','您要结账吗','您要加点吗'],a:0,e:'お飲み物=饮品,何になさいますか是“您要点什么”的礼貌说法。',d:['吃什么是「お食事は何になさいますか」','结账是「お会計はよろしいですか」','加点是「追加はよろしいですか」'],u:'入座后第一句多半是这个,可以回答「とりあえず生で」'}
];
Object.assign(SC,{
'個室':'個室はありますか|有包间吗',
'座敷':'座敷でもいいですか|坐榻榻米座位可以吗',
'掘りごたつ':'掘りごたつの席がいいです|想要地炉式座位',
'お通し':'お通しはいくらですか|入座小菜多少钱;お通しは何ですか|入座小菜是什么',
'席料':'席料はかかりますか|要收座位费吗',
'ラストオーダー':'ラストオーダーは何時ですか|最后点单是几点',
'コース':'コースはありますか|有套餐吗;飲み放題付きのコースがいいです|想要含畅饮的套餐',
'飲み放題':'飲み放題をつけられますか|可以加畅饮吗;飲み放題のメニューを見せてください|请给我看畅饮菜单',
'サービス料':'サービス料はかかりますか|要收服务费吗',
'一人前':'一人前でお願いします|请来一人份',
'追加注文':'追加注文をお願いします|想加点',
'キャンセル':'これをキャンセルできますか|这个能取消吗',
'乾杯':'乾杯!|干杯',
'とりあえず生':'とりあえず生を三つお願いします|先来三杯生啤',
'中ジョッキ':'中ジョッキをお願いします|请来中杯生啤',
'レモンサワー':'レモンサワーをください|请来一杯柠檬沙瓦',
'ウーロンハイ':'ウーロンハイをお願いします|请来乌龙烧酒',
'ノンアルコール':'ノンアルコールはありますか|有无酒精饮料吗',
'ロック':'ロックでお願いします|请加冰块纯饮',
'水割り':'水割りでお願いします|请兑水',
'お湯割り':'お湯割りでお願いします|请兑热水',
'ソーダ割り':'ソーダ割りでお願いします|请兑苏打水',
'ボトルキープ':'ボトルキープはできますか|可以寄存酒瓶吗',
'たこわさ':'たこわさをください|请来芥末章鱼;わさび少なめにできますか|能少放点芥末吗',
'塩辛':'塩辛は苦手です|我不太能吃盐渍内脏',
'ししゃも':'ししゃもを二本ください|请来两条柳叶鱼',
'ホッケ':'ホッケの開きをください|请来烤花鲫鱼',
'牛すじ煮込み':'牛すじ煮込みをお願いします|请来炖牛筋',
'厚揚げ':'厚揚げを一つください|请来一份厚炸豆腐',
'ピリ辛':'ピリ辛にできますか|能做成微辣吗',
'タレ':'タレでお願いします|请用酱汁味',
'塩':'塩でお願いします|请用盐味',
'レバー':'レバーは苦手です|我不太能吃肝',
'〆':'〆に何かおすすめはありますか|收尾有什么推荐吗',
'お茶漬け':'お茶漬けをお願いします|请来茶泡饭',
'雑炊':'雑炊をお願いします|请来杂炊(粥)'
});
function ans(q){if(q.d)return q.t==='r'?q.j:q.o[q.a];return q.e.split(' = ')[0]}
function say(t){
  t=t.replace(/[\u3400-\u9fff々]+[（(]([\u3040-\u30ffー]+)[）)]/g,'$1');
  if(!window.speechSynthesis){alert('当前浏览器不支持朗读,请换用 Safari、Chrome 或 Edge');return}
  var i=t.lastIndexOf('(');
  if(i>0&&t.slice(-1)===')'){var r=t.slice(i+1,-1),ok=r.length>0;for(var c=0;c<r.length;c++){var n=r.charCodeAt(c);if(n<0x3040||n>0x30FF)ok=false}if(ok)t=r}
  t=t.split('〜').join('').split('〇〇').join('なになに');
  try{
    var u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=0.85;
    var vs=speechSynthesis.getVoices(),ja=vs.filter(function(v){return v.lang&&v.lang.toLowerCase().replace('_','-').indexOf('ja')===0});
    if(vs.length&&!ja.length&&!say.w){say.w=1;alert('这台设备没有日语语音,请在系统设置里下载日语语音后再试')}
    if(ja.length)u.voice=ja[0];
    speechSynthesis.cancel();speechSynthesis.speak(u);
  }catch(e){}
}
app.addEventListener('click',function(e){
  var el=e.target.closest?e.target.closest('[data-t],[data-a]'):null;if(!el)return;
  if(el.hasAttribute('data-t'))say(el.getAttribute('data-t'));
  else{var q=st.list&&st.list[st.i];if(q)say(ans(q))}
});

var WORD_EXPLANATIONS=GAME_DATA.d["quiz/word-explanations"];
var DIALOGUE_EXPLANATIONS=GAME_DATA.d["quiz/dialogue-explanations"];

function explanationFor(q){
 if(q.explain)return q.explain;
 var key=q.e.split(' = ')[0].split('(')[0];
 if(q.e.indexOf(' = ')>=0&&WORD_EXPLANATIONS[key])return WORD_EXPLANATIONS[key];
 return DIALOGUE_EXPLANATIONS[[q.s,q.t,q.q,q.j||''].join('|')];
}
function explanationSections(e){
 var text=e.text||[e.what,e.why].filter(Boolean).join('');
 return '<div class="explain-story"><p>'+de(text)+'</p></div>'+
 '<div class="explain-phrases">'+e.examples.map(function(x){return '<div class="explain-example">'+(x[2]?'<div class="example-situation">'+de(x[2])+'</div>':'')+'<p lang="ja">'+de(x[0])+'</p><p class="explain-zh">'+de(x[1])+'</p><button class="spkbtn" data-t="'+de(x[0])+'" aria-label="朗读：'+de(x[0])+'">🔊 听这句</button></div>';}).join('')+'</div>'+
 (e.source?'<details class="explain-source"><summary>参考资料</summary><a href="'+de(e.source[1])+'" target="_blank" rel="noopener noreferrer">'+de(e.source[0])+'</a></details>':'');
}
function fullExplanation(q){var e=explanationFor(q);if(!e)throw new Error('Missing explanation: '+q.q);return '<section class="full-explanation" aria-label="答案解析">'+explanationSections(e)+(q.reading?'<p class="ramen-reading" lang="ja">读音：'+de(q.reading)+'</p>':'')+'</section>';}
function extra(q){
 lk();var li=q.o.map(function(t,k){var d=k===q.a?'':xo(q,k);return d?'<li><span style="font-weight:700">'+esc(t)+'</span>：'+sp(d)+'</li>':''}).join('');
 return fullExplanation(q)+(li?'<details class="fb"><summary>其他选项的意思</summary><ul style="margin:6px 0 0;padding-left:20px">'+li+'</ul></details>':'');
}

var DEMO=GAME_DATA.d["scenes/scene-dialogues"];
var DEMO_SCENES=[{id:'restaurant',name:'餐厅里的日常',icon:'🍜',description:'要水 · 点餐 · 外带 · 结账'},{id:'izakaya',name:'居酒屋的一晚',icon:'🏮',description:'入座 · 点酒 · 烤串 · 加点'},{id:'ramen',name:'去拉面店吃一碗',icon:'🍥',description:'买券 · 听懂店员 · 调整口味 · 续面'}];
var demoState=null;
var demoLabels={reply:'场景接话',listen:'听力理解',dialogue:'对话补全',speak:'开口练习'};
var demoIcons={reply:'💬',listen:'🎧',dialogue:'↔',speak:'🗣'};
function de(s){return esc(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
var originalHome=home;
home=function(){originalHome();var box=document.createElement('section');box.className='demo-entry';box.innerHTML='<span class="demo-eyebrow">场景对话 · 40 个生活片段</span><h2>这次，真的说一句。</h2><p>从买餐券、选面条硬度到点酒加菜，把日语放进真实对话里。</p><div class="demo-types">💬 接话 · 🎧 听懂 · ↔ 补全 · 🗣 开口</div><button class="btn" onclick="demoMenu()">试试场景对话 →</button><small>原题库继续保留在下方</small>';app.insertBefore(box,app.querySelector('.grid'));};
/* ==== engine/core/20-scene-dialogues.js ==== */
/* 【场景对话练习（DEMO）菜单与播放】 */
function demoMenu(){
 app.innerHTML='<div class="demo-top"><button class="spkbtn" onclick="home()">← 原题库</button><span>场景练习</span></div><h1>把日语用起来</h1><p class="lead">接话、听力、对话补全和开口练习交替出现。选择题计分，开口题自己判断。</p><div class="grid">'+DEMO_SCENES.map(function(scene){var count=DEMO.filter(q=>q.scene===scene.id).length;return '<button class="scene demo-scene" onclick="demoStart(\''+scene.id+'\')"><span class="demo-emoji">'+scene.icon+'</span><span><b>'+scene.name+'</b><small>'+scene.description+'<br>'+count+' 题 · 四种练法</small></span></button>';}).join('')+'</div><div class="demo-note">🎧 听力题先播放日语，听不清时可以看原文。<br>🗣 开口题请先自己说，再展开参考表达；页面不会录音，也不会自动评判发音。</div>';
 window.scrollTo(0,0);
}
function demoStart(scene){var groups=Object.keys(demoLabels).map(k=>shuf(DEMO.filter(q=>q.scene===scene&&q.kind===k)));var list=[];var max=Math.max.apply(null,groups.map(g=>g.length));for(var i=0;i<max;i++)groups.forEach(g=>{if(g[i])list.push(g[i]);});if(list.length)demoBegin(list,scene);}
function demoBegin(list,scene){demoState={list:list,i:0,scene:scene,correct:0,objective:0,spoken:0,confident:0,answered:false,revealed:false,retry:[],supported:0,usedText:false};demoShow();}
function quizHome(){demoCancelSpeech();home();}
function demoCancelSpeech(){if(window.speechSynthesis)try{speechSynthesis.cancel()}catch(e){}}
function demoExit(){if(demoState&&!confirm('返回场景选择？本轮练习进度不会保存。'))return;demoCancelSpeech();demoMenu();}

var RAMEN_READINGS={'食券':'しょっけん','買':'か','先':'さき','席':'せき','座':'すわ','返':'かえ','辛':'から','大盛':'おおも','冷':'つめ','追加':'ついか','抜':'ぬ','別皿':'べつざら','紙エプロン':'かみエプロン','紙袋':'かみぶくろ','普通':'ふつう','願':'ねが','麺':'めん','少':'すく','多':'おお','大丈夫':'だいじょうぶ','隣同士':'となりどうし','一緒':'いっしょ','待':'ま','替え玉':'かえだま','使い方':'つかいかた','教':'おし','豚肉':'ぶたにく','入':'はい','割':'わ'};
function ramenReadingMarkup(text){var html='',rest=text;var keys=Object.keys(RAMEN_READINGS).sort((a,b)=>b.length-a.length);while(rest.length){var key=keys.find(k=>rest.startsWith(k));if(key){html+='<ruby>'+de(key)+'<rt>'+RAMEN_READINGS[key]+'</rt></ruby>';rest=rest.slice(key.length);}else{html+=de(rest[0]);rest=rest.slice(1);}}return html;}
function demoShow(){demoCancelSpeech();var d=demoState,q=d.list[d.i];d.answered=false;d.revealed=false;d.usedText=false;d.options=q.kind==='speak'?[]:shuf(q.options.map((text,i)=>({text:text,correct:i===0})));
 app.innerHTML='<div class="demo-top"><div class="quiz-nav"><button class="spkbtn" onclick="demoExit()">← 场景</button><button class="spkbtn" onclick="quizHome()">⌂ 回到主页</button></div><span>'+(d.i+1)+' / '+d.list.length+'</span></div><div class="bar"><i style="width:'+d.i/d.list.length*100+'%"></i></div><div class="demo-kind">'+demoIcons[q.kind]+' '+demoLabels[q.kind]+'</div><h1 class="demo-title">'+({reply:'这一刻，你会怎么说？',listen:'听听对方在说什么',dialogue:'把这段对话接下去',speak:'轮到你开口了'}[q.kind])+'</h1><div class="demo-context">'+de(q.context).replace(/\n/g,'<br>')+'</div>'+(q.kind==='listen'?'<div class="demo-audio"><button class="btn" onclick="demoPlay()">▶ 播放日语</button><p>可以重复播放，准备好再选。</p><details id="demo-transcript"><summary>听不清？查看日语原文</summary><p lang="ja">'+de(q.jp)+'</p>'+(q.reading?'<p class="ramen-reading" lang="ja">'+de(q.reading)+'</p>':'')+'</details><small>若没有声音，请查看原文，或换到支持日语语音的浏览器。</small></div>':'')+(q.kind==='speak'?'<div class="demo-speak"><div class="demo-voice" aria-hidden="true">〰</div><p>先试着完整说一句。<br>不必和参考答案一字不差。</p><button class="btn" id="demo-reveal" onclick="demoReveal()">我说好了，看看参考表达</button><button class="btn ghost" id="demo-help" onclick="demoReveal(true)">还不会，先学一句</button></div>':'<div class="opts">'+d.options.map((o,i)=>'<button class="opt" data-demo-option="'+i+'" onclick="demoAnswer('+i+')"'+(q.kind!=='listen'?' lang="ja"':'')+'>'+(q.scene==='ramen'&&q.kind!=='listen'?ramenReadingMarkup(o.text):de(o.text))+'</button>').join('')+'</div>')+'<section id="demo-feedback" aria-live="polite"></section>';
 var details=document.getElementById('demo-transcript');if(details)details.addEventListener('toggle',function(){if(details.open&&!d.answered)d.usedText=true;});window.scrollTo(0,0);
}
function demoPlay(){say(demoState.list[demoState.i].jp);}
function demoExplanation(q){
 var examples=[[q.jp,q.zh]];
 var e={what:'「'+q.jp+'」的意思是“'+q.zh+'”。'+q.note,why:q.why,examples:examples};
 return '<section class="full-explanation" aria-label="答案解析">'+explanationSections(e)+
 (q.variants.length?'<details><summary>还可以这样说</summary>'+q.variants.map(function(v){return '<p lang="ja">'+de(v)+' <button class="spkbtn" data-t="'+de(v)+'" aria-label="朗读另一种说法">🔊</button></p>';}).join('')+'</details>':'')+'</section>';
}
function DEMO_VARIANT(i){return demoState.list[demoState.i].variants[i];}
function demoAnswer(i){var d=demoState;if(d.answered||!d.options[i])return;d.answered=true;d.objective++;var good=d.options[i].correct,q=d.list[d.i];if(good)d.correct++;else d.retry.push(q);if(d.usedText)d.supported++;
 app.querySelectorAll('[data-demo-option]').forEach(function(b){b.disabled=true;var n=+b.dataset.demoOption;if(d.options[n].correct)b.classList.add('ok');else if(n===i)b.classList.add('ng');});
 document.getElementById('demo-feedback').innerHTML='<div class="fb '+(good?'ok':'ng')+'"><b>'+(good?'✓ 接住了！':'再看一遍这句表达')+'</b>'+(d.usedText?'<small>本题使用了原文辅助</small>':'')+'</div>'+demoExplanation(q)+'<button class="btn" id="demo-next" onclick="demoNext()">'+(d.i+1===d.list.length?'看看本轮收获':'下一段对话 →')+'</button>';document.getElementById('demo-next').focus({preventScroll:true});}
function demoReveal(help){var d=demoState;if(d.revealed)return;d.revealed=true;d.neededHelp=!!help;document.getElementById('demo-reveal').disabled=true;document.getElementById('demo-help').disabled=true;document.getElementById('demo-feedback').innerHTML=demoExplanation(d.list[d.i])+'<p class="lead demo-self-label">对照参考表达，再说一次。现在感觉怎么样？</p><div class="demo-self"><button class="btn" onclick="demoSelf(true)">能自己说出来</button><button class="btn ghost" onclick="demoSelf(false)">还想再练一遍</button></div>';document.getElementById('demo-feedback').scrollIntoView({block:'start',behavior:'smooth'});}
function demoSelf(confident){var d=demoState;if(d.answered||!d.revealed)return;d.answered=true;d.spoken++;if(confident)d.confident++;else d.retry.push(d.list[d.i]);document.querySelector('.demo-self').innerHTML='<div class="fb"><b>'+ (confident?'已记为：能说出来':'已加入本轮再练清单')+'</b><small>这是你的自我评价，不是自动评分。</small></div><button class="btn" onclick="demoNext()">'+(d.i+1===d.list.length?'看看本轮收获':'下一段对话 →')+'</button>';}
function demoNext(){var d=demoState;if(!d.answered)return;if(++d.i<d.list.length)demoShow();else demoEnd();}
function demoEnd(){demoCancelSpeech();var d=demoState;app.innerHTML='<div class="demo-kind">✓ 本轮完成</div><h1>多会说了几句话</h1><p class="lead">把今天的表达带到下一顿饭里。</p><div class="demo-metrics"><div><strong>'+d.correct+' / '+d.objective+'</strong><span>选择题答对</span></div><div><strong>'+d.confident+' / '+d.spoken+'</strong><span>开口题自评能说</span></div></div>'+(d.supported?'<p class="lead">其中 '+d.supported+' 道听力题查看了原文。</p>':'')+'<h2 class="demo-summary-title">本轮用到的句子</h2><div class="demo-review">'+d.list.map((q,i)=>'<div><span class="demo-review-kind">'+demoLabels[q.kind]+'</span><p lang="ja">'+de(q.jp)+'</p><small>'+de(q.zh)+'</small><button class="spkbtn" onclick="say(demoState.list['+i+'].jp)">🔊 朗读</button><details><summary>查看完整解析</summary>'+demoExplanation(q)+'</details></div>').join('')+'</div>'+(d.retry.length?'<button class="btn" onclick="demoRetry()">再练不熟悉的 '+d.retry.length+' 题</button>':'')+'<button class="btn ghost" onclick="demoStart(demoState.scene)">换个顺序再来一轮</button><button class="btn ghost" onclick="demoMenu()">换一个场景</button><button class="btn ghost" onclick="home()">返回原题库</button><p class="demo-note">本轮作答已计入学习进度，记录保存在当前浏览器。开口练习不采集录音。</p>';window.scrollTo(0,0);}
function demoRetry(){demoBegin(demoState.retry.slice(),demoState.scene);}

/* 后续题库维护约定：新题保留自然连贯的词义/场景说明，常用词提供多个带场景提示的例句。
   所有原题通过 full('all')、新场景题通过 DEMO 自动登记；题目收藏与记录共用稳定标识。
   选择题正确率只计算客观答题，开口自评另记。不要用随机选项序号作为题目标识。 */
var RAMEN_NEW=GAME_DATA.d["quiz/ramen-extra"];
Q.push.apply(Q,RAMEN_NEW);
DEMO.push.apply(DEMO,GAME_DATA.d["scenes/scene-dialogues-more"]);
S.find(function(x){return x.id==='ramen'}).d='买券、等位、口味、续面、结账（28题）';
/* ==== engine/core/30-question-series.js ==== */
/* 【连续情景题（拉面、便利店、电车等系列题）接入题库】 */
/* SAVED SERIES ramen */
Q.push.apply(Q,GAME_DATA.d["quiz/series-ramen"]);
S.find(x=>x.id==="ramen").d="排队买券、选面、加料、用餐与结账（48题）";
/* SAVED SERIES conv */
Q.push.apply(Q,GAME_DATA.d["quiz/series-conv"]);
S.find(x=>x.id==="conv").d="便当、袋子、付款、优惠与超市购物（40题）";
/* SAVED SERIES train */
Q.push.apply(Q,GAME_DATA.d["quiz/series-train"]);
S.find(x=>x.id==="train").d="找站台、换乘、买票、出站与延误（40题）";
/* SAVED SERIES drug */
Q.push.apply(Q,GAME_DATA.d["quiz/series-drug"]);
S.find(x=>x.id==="drug").d="找商品、问药师、标签、护照与免税手续（40题）";
/* SAVED SERIES hotel */
Q.push.apply(Q,GAME_DATA.d["quiz/series-hotel"]);
S.find(x=>x.id==="hotel").d="入住、寄存、设施、房间问题与退房（40题）";
/* SAVED SERIES shop */
Q.push.apply(Q,GAME_DATA.d["quiz/series-shop"]);
S.find(x=>x.id==="shop").d="试穿、尺码、库存、付款、退换与包装（40题）";
/* SAVED SERIES help */
Q.push.apply(Q,GAME_DATA.d["quiz/series-help"]);
S.find(x=>x.id==="help").d="问路、找设施、遗失物品与求助（40题）";
/* ==== engine/core/40-anime-and-taxfree.js ==== */
/* 【二次元场景、免税题更新、解析修正】 */
/* ===== v2 patch: 二次元场景 + 免税更新 + 解析错位修复 ===== */
var _full0=full;
var V_A={
'热门作品与读音':['鬼滅の刃|きめつのやいば|鬼灭之刃','呪術廻戦|じゅじゅつかいせん|咒术回战','葬送のフリーレン|そうそうのフリーレン|葬送的芙莉莲','進撃の巨人|しんげきのきょじん|进击的巨人','僕のヒーローアカデミア|ぼくのヒーローアカデミア|我的英雄学院','薬屋のひとりごと|くすりやのひとりごと|药屋少女的呢喃','推しの子|おしのこ|我推的孩子','SPY×FAMILY|スパイファミリー|间谍过家家','チェンソーマン|チェンソーマン|链锯人','ぼっち・ざ・ろっく!|ぼっちざろっく|孤独摇滚!','ブルーロック|ブルーロック|蓝色监狱','名探偵コナン|めいたんていコナン|名侦探柯南','ワンピース|ワンピース|海贼王','ドラゴンボール|ドラゴンボール|七龙珠','ハイキュー!!|ハイキュー|排球少年!!','鋼の錬金術師|はがねのれんきんじゅつし|钢之炼金术师','ダンダダン|ダンダダン|胆大党','すずめの戸締まり|すずめのとじまり|铃芽之旅','君の名は。|きみのなは|你的名字。','千と千尋の神隠し|せんとちひろのかみかくし|千与千寻','ドラえもん|ドラえもん|哆啦A梦','ちいかわ|ちいかわ|吉伊卡哇','ポケットモンスター|ポケットモンスター|宝可梦'],
'谷子与周边':['缶バッジ|かんバッジ|徽章(爱好者常叫“吧唧”)','アクリルスタンド|アクリルスタンド|亚克力立牌','アクリルキーホルダー|アクリルキーホルダー|亚克力钥匙扣','ぬいぐるみ|ぬいぐるみ|毛绒玩偶','フィギュア|フィギュア|手办','色紙|しきし|色纸','タペストリー|タペストリー|挂布','クリアファイル|クリアファイル|透明文件夹','トレーディングカード|トレーディングカード|收藏卡牌','ブロマイド|ブロマイド|角色小照片卡','ペンライト|ペンライト|应援荧光棒','痛バッグ|いたバッグ|痛包','一番くじ|いちばんくじ|一番赏(抽奖周边)','ガチャガチャ|ガチャガチャ|扭蛋','同人誌|どうじんし|同人志'],
'购买、状态与圈内用语':['ランダム|ランダム|随机(盲抽)','コンプリート|コンプリート|集齐全套','重複|ちょうふく|重复(抽到相同的)','予約特典|よやくとくてん|预约特典(预订赠品)','数量限定|すうりょうげんてい|数量限定','受注生産|じゅちゅうせいさん|接单后生产(订购制)','新品未開封|しんぴんみかいふう|全新未拆封','中古|ちゅうこ|二手','美品|びひん|品相很好','開封済み|かいふうずみ|已拆封','推し|おし|本命(最喜欢的角色/成员)','聖地巡礼|せいちじゅんれい|圣地巡礼(去取景地参观)','免税対応|めんぜいたいおう|支持免税办理']};
var GA=gen(V_A,'anime');
S.push({id:'anime',n:'二次元・谷子',e:'🎌',c:'#7b4bd6',d:'热门作品读音、周边谷子、扭蛋、购买用语('+GA.length+'题,随机出)'});
Object.assign(SC,{
'缶バッジ':'缶バッジはランダムですか、選べますか|徽章是随机的还是可以挑选的;ダブったら交換できますか|抽到重复的可以交换吗',
'アクリルスタンド':'アクリルスタンドの在庫はありますか|有亚克力立牌的库存吗',
'ぬいぐるみ':'ぬいぐるみを袋に入れてもらえますか|能帮我把毛绒玩偶装进袋子吗',
'フィギュア':'箱の状態を見てもいいですか|可以看一下盒子的状态吗',
'一番くじ':'一番くじを一回お願いします|请抽一次一番赏',
'ガチャガチャ':'両替機はありますか|有换零钱的机器吗',
'ランダム':'これはランダムですか|这个是随机款吗',
'コンプリート':'コンプリートしたいんですが|我想集齐全套',
'予約特典':'予約特典は何ですか|预约特典是什么',
'数量限定':'これは数量限定ですか|这个是数量限定吗',
'新品未開封':'これは新品未開封ですか|这个是全新未拆封的吗',
'美品':'傷はありますか|有划痕或损伤吗',
'免税対応':'免税対応していますか|支持免税办理吗',
'受注生産':'受注生産の締め切りはいつですか|订购截止是什么时候'});
var WA={'缶バッジ':'圆形金属别针徽章,中文爱好者常叫“吧唧”。','アクリルスタンド':'亚克力立牌,常简称「アクスタ」。','アクリルキーホルダー':'亚克力钥匙扣,常简称「アクキー」。','痛バッグ':'在透明窗包里陈列徽章等周边的“痛包”,常简称「痛バ」。','一番くじ':'按奖项等级(A賞、B賞……)领取奖品的抽奖式周边,一般按次收费。','ガチャガチャ':'投币扭蛋机,常简称「ガチャ」。','推し':'自己最喜欢的角色或成员,也可以做动词用,如「推している」。','聖地巡礼':'前往作品取景地或相关地点参观。','受注生産':'收到订单后才开始生产,通常有预订截止日期。','ランダム':'无法自选款式,抽到哪个算哪个。'};
Object.keys(V_A).forEach(function(c){V_A[c].forEach(function(r){var p=r.split('|'),j=p[0],z=p[2];if(WORD_EXPLANATIONS[j])return;
 var why=c==='热门作品与读音'?'周边店、书店和扭蛋机常直接写日文原名,知道读音就能向店员询问。':c==='谷子与周边'?'周边店的货架牌和扭蛋机上常用这个叫法。':'购买、交换和预约周边时,告示牌和店员常用这个词。';
 var ex=SC[j]?SC[j].split(';').map(function(x){var a=x.split('|');return [a[0],a[1]]}):(c==='热门作品与读音'?[[j+'のグッズはありますか？','有'+z+'的周边吗?','问周边']]:c==='谷子与周边'?[[j+'はありますか？','有'+z+'吗?','找商品']]:[]);
 WORD_EXPLANATIONS[j]={what:WA[j]||('「'+j+'」是“'+z+'”。'),why:why,examples:ex}})});
/* 免税新题 */
var GT=[
{s:'drug',t:'r',uid:'drug|r|taxfree-refund',q:'结账时店员这样说明免税流程,是什么意思?',j:'お支払いは税込の金額です。免税の手続きは、出国のときに空港でお願いします。',o:['现在付含税全价,免税手续在离境时到机场办理','现在按免税价付款,之后不用再办手续','免税手续要在这家店的柜台办完才能出店','免税商品不能带出日本'],a:0,e:'2026年11月1日起免税改为退税方式。',d:['这是2026年10月底以前的当场免税做法','新制度下店里只登记购买记录,最终手续在离境时办','恰好相反,商品要带出日本才能退税'],explain:{text:'2026年11月1日起,免税购物改为退税方式:在店里出示护照并付含税全价,离境前在机场通过海关终端办理后才能退税。税前5,000日元的门槛不变,商品需在购买后90天内带出日本。',examples:[['免税のお手続きは出国のときにするんですか？','免税手续是离境时办理吗?','确认流程'],['パスポートです。','这是我的护照。','结账时出示']]}},
{s:'drug',t:'s',uid:'drug|s|taxfree-airport',q:'你想确认是不是先付含税全价、到机场再办退税,怎么问?',o:['いったん税込の金額を払って、空港で手続きするんですか？','税込の金額を払ったら、もう手続きは全部終わりですか？','免税の商品を、日本で使ってもいいですか？','空港でパスポートをなくしてしまいました。'],a:0,e:'先付全价再在机场办理。',d:['意思是“付完全价就全部结束了”,漏掉了离境时的手续','意思是“免税商品可以在日本使用吗”,与流程无关;消耗品在日本用掉后会失去退税资格','意思是“我在机场弄丢了护照”'],explain:{text:'「いったん」是“先、暂且”,「〜んですか」用来向对方确认流程。',examples:[['免税の対象ですか？','这个属于免税对象吗?','确认商品']]}},
{s:'drug',t:'s',uid:'drug|s|taxfree-airport-show',q:'你想问买的东西离境时要不要拿给海关看,怎么问?',o:['買ったものは、空港で見せる必要がありますか？','買ったものは、すぐ使ってもいいですか？','買ったものを、日本で食べてもいいですか？','買ったものを、送ってもらえますか？'],a:0,e:'退税需要把商品带到机场接受检查。',d:['意思是“买的东西可以马上用吗”,用掉后可能无法退税','意思是“买的东西可以在日本吃吗”,消耗品在日本用掉就不能退税','意思是“能帮我寄吗”,从店里直接寄往海外属于另一种办理方式'],explain:{text:'退税需要把商品带出日本并在离境时接受检查,所以买后不要先拆封使用或食用。「見せる必要がありますか」就是“需要给人看吗”。',examples:[['空港のどこで手続きしますか？','在机场的哪里办理?','问地点']]}}];

var TRn=0;function TRq(t,q,j,o,d,text,ex){var x={s:'train',t:t,uid:'train|'+t+'|n'+(++TRn),q:q,o:o,a:0,e:text,d:d,explain:{text:text,examples:[ex]}};if(j)x.j=j;return x}
var GTR=[
TRq('r','站台广播响起,是什么意思?','まもなく電車が参ります。白線の内側までお下がりください。',['电车马上进站,请退到白线内侧','电车已经出发,请到下一站等候','请越过白线到前面排队','白线内侧是候车专用区'],['已出发是「発車しました」','「内側」是靠里的一侧,不是越过白线','这句话是安全提醒,不是区域说明'],'「参ります」是“来、到”的谦让语,车站广播常用;「お下がりください」是请往后退。候车时请一直站在白线后面。',['白線の内側にお下がりください。','请退到白线内侧。','听到广播时']),
TRq('r','你走进车厢,看到车门旁贴着粉色标识,上面写着这句话,是什么意思?','この車両は女性専用車両です。',['这节车厢是女性专用车厢','这节车厢是儿童专用车厢','这节车厢是静音车厢','这节车厢是优先座位车厢'],['儿童专用不是这个词','静音车厢不是这个说法','优先座位叫「優先席」,只是个别座位'],'「女性専用車両」多数只在早晚高峰等特定时段实行,具体以车厢贴纸和告示为准。男性乘客误入时,请换到相邻车厢。',['この電車に女性専用車両はありますか？','这趟车有女性专用车厢吗?','上车前确认']),
TRq('r','买票时看到这句话,是什么意思?','自由席は一号車から三号車です。',['自由席(不指定座位)在1到3号车厢','指定席在1到3号车厢','1到3号车厢暂停使用','1到3号车厢是女性专用'],['指定席是座位已预订的车厢,不是自由席','暂停使用是「使用できません」','女性专用是「女性専用車両」'],'「自由席」是不指定座位、先到先坐;「指定席」是提前订好座位;「号車」是第几节车厢。',['自由席の切符をお願いします。','请给我自由席的车票。','买票时']),
TRq('r','站台上看到这句话,是什么意思?','この電車は終点の品川行きです。',['这趟车开往终点站品川','这趟车在品川换乘','品川是下一站','这趟车不到品川'],['换乘是「乗り換え」','下一站是「次は品川」','「行き」是开往,不是不到'],'「〜行き」表示开往哪里,「終点」是终点站。比起线路名,站台牌上的“行き”更可靠。',['この電車は品川に行きますか？','这趟车去品川吗?','上车前确认']),
TRq('r','深夜在车站,站员对你说了这句话,是什么意思?','終電はもう出てしまいました。',['末班车已经开走了','末班车23点到站','首班车快要进站','电车暂停运行'],['末班车时间会说「終電は〇時」','首班车是「始発」','暂停运行是「運転見合わせ」'],'「終電」是末班车,「出てしまいました」带有“已经走了”的遗憾语气。',['終電は何時ですか？','末班车几点?','查时间']),
TRq('r','过闸机时屏幕上显示这句话,是什么意思?','ICカードの残高が足りません。',['IC卡余额不足','IC卡已过期','IC卡还有余额','请换一个闸机'],['过期是「有効期限切れ」','余额充足不会出现这个提示','换闸机是「別の改札」'],'「残高」是余额,「足りません」是不够。闸机拦住你时,多半需要到机器上充值。',['チャージしたいです。','我想充值。','在售票机前']),
TRq('r','电车上响起这句广播,是什么意思?','ドアが閉まります。ご注意ください。',['车门即将关闭,请注意','车门已经打开,请下车','请从另一侧车门下车','车门故障,请换车厢'],['打开是「ドアが開きます」','另一侧是「反対側のドア」','故障是「故障」'],'「閉まります」是即将关闭。听到提示音时不要强行冲进车厢,下一班很快就会来。',['駆け込み乗車はおやめください。','请不要冲进车门。','常见广播']),
TRq('r','买票时看到这句话,是什么意思?','この列車は全車指定席です。',['这趟列车所有车厢都需要订座','这趟列车全部是自由席','这趟列车全车禁烟','这趟列车已经满员'],['自由席与指定席相反','禁烟是「禁煙」','满员是「満席」'],'「全車」是全部车厢,「指定席」是订座。要先买含座位的票才能上车。',['指定席の切符はどこで買えますか？','订座车票在哪里买?','购票时']),
TRq('r','电车上响起这句广播,是什么意思?','次は渋谷、渋谷です。お出口は右側です。',['下一站涩谷,下车的车门在右侧','涩谷已经过了,车门在左侧','下一站不停涩谷','出口在站外右侧'],['过站是「渋谷を過ぎました」','「右側」是右边,不是左边','不停是「止まりません」'],'「お出口」指下车的车门一侧,不是站内出口。「次は〜」是下一站。',['渋谷で降ります。','我在涩谷下车。','下车前']),
TRq('r','站内广播这样说,是什么意思?','到着が五分ほど遅れています。',['预计晚点约五分钟','预计提前五分钟','五分钟后开始检票','五分钟内不会停车'],['提前是「早く着きます」','检票是「改札」','不停车是「通過します」'],'「遅れています」是晚点,「ほど」是大约。晚点时可以向站员确认能否赶上换乘。',['どのくらい遅れていますか？','晚点多久?','询问站员']),
TRq('s','你想问下一班车几点发,怎么说?','',['次の電車は何時に出ますか？','この電車は何時に着きましたか？','前の電車はもう行きましたか？','電車は何分かかりますか？'],['意思是“这趟车几点到的”','意思是“前一班已经走了吗”','意思是“电车要多久”'],'「次の電車」是下一班车,「何時に出ますか」是几点发车。',['次の電車は何分後ですか？','下一班几分钟后?','看不懂时刻表']),
TRq('s','你想给交通IC卡充值,怎么问?','',['チャージしたいんですが、現金でもできますか？','カードを買いたいんですが、どの機械ですか？','残高を確認したいんですが、どうすればいいですか？','払い戻しをお願いします。'],['意思是“我想买卡,是哪台机器”','意思是“我想查余额”','意思是“请退款”'],'「チャージ」是充值,「現金でもできますか」是现金也可以吗。面额以机器提示为准。',['いくらチャージしますか？','要充多少?','机器提示']),
TRq('s','你想买订座的车票,问哪里可以买,怎么说?','',['指定席の切符はどこで買えますか？','自由席の切符はどこで買えますか？','乗車券はどこで買えますか？','特急券はいくらですか？'],['这是问自由席车票','这是问普通乘车券','这是问特急券多少钱,没有问地点'],'「指定席」是订座席,「どこで買えますか」是问去哪里买。',['窓口で買えますか？','在窗口能买吗?','问购票方式']),
TRq('s','你走错站台了,想请站员告诉你怎么办,怎么说?','',['ホームを間違えてしまいました。どうすればいいですか？','電車を間違えてしまいました。いくらですか？','きっぷをなくしてしまいました。','お金が足りません。'],['意思是“我搭错车了,多少钱”','意思是“我把车票弄丢了”','意思是“钱不够”'],'「ホーム」是站台,「間違えてしまいました」是不小心弄错了。',['何番線に行けばいいですか？','该去几号线站台?','问站员']),
TRq('s','你想问有没有放大行李箱的地方,怎么说?','',['スーツケースを置く場所はありますか？','スーツケースを預ける時間はありますか？','スーツケースを買う場所はありますか？','スーツケースを持ってもらえますか？'],['意思是“有寄存行李的时间吗”','意思是“有买行李箱的地方吗”','意思是“能帮我拿行李箱吗”'],'「置く場所」是放东西的地方。新干线等有大型行李存放处,具体规定以列车和车厢指示为准。',['荷物置き場はどこですか？','行李放置处在哪里?','上车后']),
TRq('s','你想确认末班车几点,怎么说?','',['終電は何時ですか？','始発は何時ですか？','最後の駅はどこですか？','次の電車は何時ですか？'],['意思是“首班车几点”','意思是“最后一站在哪里”','意思是“下一班车几点”'],'「終電」是末班车,「始発」是首班车。晚上玩得晚时先查好。',['この駅の終電は何時ですか？','这个车站的末班车几点?','查末班车']),
TRq('s','你想问去东京站要在哪里换乘,怎么说?','',['東京駅へ行くには、どこで乗り換えればいいですか？','東京駅まで、いくらですか？','東京駅はどの出口ですか？','東京駅に行く電車は何時ですか？'],['意思是“到东京站多少钱”','意思是“东京站是哪个出口”','意思是“去东京站的电车几点”'],'「乗り換える」是换乘,「どこで〜ばいいですか」是该在哪里做。',['乗り換え案内を見せてください。','请给我看换乘指南。','求助']),
TRq('s','售票机吐不出车票,想请站员来帮忙,怎么说?','',['きっぷが出てきません。助けてもらえますか？','きっぷを買いたいんですが、どれがいいですか？','きっぷを見せてもいいですか？','きっぷを捨ててもいいですか？'],['意思是“想买票,选哪个好”','意思是“可以给你看车票吗”','意思是“可以把车票扔掉吗”'],'「出てきません」是没有出来。先说清楚问题,再用「助けてもらえますか」请对方帮忙。',['機械の調子が悪いです。','机器好像有问题。','报告故障']),
TRq('s','你想确认这趟车是快速还是每站都停,怎么问?','',['この電車は快速ですか、各駅停車ですか？','この電車は一番線ですか？','この電車は何時に着きますか？','この電車は禁煙ですか？'],['意思是“这趟车是1号线吗”','意思是“这趟车几点到”','意思是“这趟车禁烟吗”'],'「AですかBですか」是二选一的问法。快速会跳过部分车站,目的地是小站时要确认。',['この駅に止まりますか？','这站停吗?','确认停靠']),
TRq('s','你没有零钱,想问能不能换零钱,怎么说?','',['小銭がないんですが、両替してもらえますか？','おつりが多いんですが、返してもらえますか？','お金を貸してもらえますか？','お金をもらってもいいですか？'],['意思是“找零多了,能还吗”','意思是“能借我钱吗”','意思是“我可以收下钱吗”'],'「小銭」是零钱,「両替」是兑换。站内也有换零钱的机器。',['千円札を両替できますか？','能换开千元钞票吗?','换零钱'])];
full=function(id){if(id==='anime')return GA;if(id==='drug')return _full0('drug').concat(GT);if(id==='train')return _full0('train').concat(GTR);if(id==='all')return _full0('all').concat(GT,GA,GTR);return _full0(id)};
S.find(function(s){return s.id==='drug'}).d=S.find(function(s){return s.id==='drug'}).d.replace('40题',(_full0('drug').length+GT.length)+'题');S.find(function(s){return s.id==='train'}).d=S.find(function(s){return s.id==='train'}).d.replace(/\d+题/,(_full0('train').length+GTR.length)+'题');
/* 解析错位修复:成对题共用解析时,若解析里的重点词不在本题句子里,改用本题自己的说明 */
(function(){function sp0(s){return s.replace(/\([^)]*\)/g,'')}
function ent(q){var key=[q.s,q.t,q.q,q.j||''].join('|');if(q.explain)return {o:q.explain,set:function(v){q.explain=v}};if(DIALOGUE_EXPLANATIONS[key])return {o:DIALOGUE_EXPLANATIONS[key],set:function(v){DIALOGUE_EXPLANATIONS[key]=v}};return null}
var all=full('all');
all.forEach(function(q){if((q.uid&&q.uid.indexOf('taxfree')>=0)||!q.e||q.e.indexOf(' = ')>=0)return;var x=ent(q);if(!x)return;var e=x.o;
 var text=e.text||[e.what,e.why].filter(Boolean).join(''),terms=(text.match(/「[^」]+」/g)||[]).map(function(t){return sp0(t.slice(1,-1))});if(!terms.length)return;
 var hay=sp0((q.j||'')+q.o[q.a]);if(terms.some(function(t){return t&&hay.indexOf(t)>=0}))return;
 var an=q.o[q.a].replace(/[。.]$/,'');var nt=q.t==='r'?'「'+q.j+'」的意思是“'+an+'”。':'想表达这个意思,可以说「'+q.o[q.a]+'」。';
 x.set(Object.assign({},e,{text:nt,what:undefined,why:undefined}))});
var note='【注意】2026年11月1日起免税改为退税方式:店里出示护照并先付含税全价,离境时在机场海关终端办理后才退税(税前5,000日元门槛不变,商品需在90天内带出日本)。';
all.forEach(function(q){if(q.uid&&q.uid.indexOf('taxfree')>=0)return;var x=ent(q);if(!x)return;var e=x.o;
 if(JSON.stringify(e).indexOf('免税')<0&&(q.j||'').indexOf('免税')<0&&q.q.indexOf('免税')<0)return;
 var c=Object.assign({},e);if(c.text)c.text+=note;else c.why=(c.why||'')+note;x.set(c)})})();
/* ==== engine/core/50-places-and-products.js ==== */
/* 【地名题、便利店商品题、夜生活与音乐场景题接入题库】 */
/* 旅游站名与出行名词：保留上传版本的题库及学习标识。 */
Q=Q.concat(GAME_DATA.d["quiz/places-main"]);
S.find(s=>s.id==="train").d="热门景点、站名读音、交通名词与乘车对话（"+full("train").length+"题）";


/* 地点扩展：北海道・东北 */
Q=Q.concat(GAME_DATA.d["quiz/places-more-1"]);
S.find(s=>s.id==="train").d="34个旅游地点与站名、交通名词及乘车对话（"+full("train").length+"题）";


/* 地点扩展：东京・关东 */
Q=Q.concat(GAME_DATA.d["quiz/places-more-2"]);
S.find(s=>s.id==="train").d="44个旅游地点与站名、交通名词及乘车对话（"+full("train").length+"题）";


/* 地点扩展：中部・北陆 */
Q=Q.concat(GAME_DATA.d["quiz/places-more-3"]);
S.find(s=>s.id==="train").d="54个旅游地点与站名、交通名词及乘车对话（"+full("train").length+"题）";


/* 地点扩展：关西 */
Q=Q.concat(GAME_DATA.d["quiz/places-more-4"]);
S.find(s=>s.id==="train").d="64个旅游地点与站名、交通名词及乘车对话（"+full("train").length+"题）";


/* 地点扩展：中国・四国 */
Q=Q.concat(GAME_DATA.d["quiz/places-more-5"]);
S.find(s=>s.id==="train").d="74个旅游地点与站名、交通名词及乘车对话（"+full("train").length+"题）";


/* 地点扩展：九州・冲绳 */
Q=Q.concat(GAME_DATA.d["quiz/places-more-6"]);
S.find(s=>s.id==="train").d="84个旅游地点与站名、交通名词及乘车对话（"+full("train").length+"题）";


/* 便利店商品场景：食品 */
Q=Q.concat(GAME_DATA.d["quiz/conv-products-1"]);
S.find(s=>s.id==="conv").d="便当、肉包、炸鸡、咖啡与果茶等购物对话（"+full("conv").length+"题）";


/* 便利店商品场景：饮品 */
Q=Q.concat(GAME_DATA.d["quiz/conv-products-2"]);
S.find(s=>s.id==="conv").d="便当、肉包、炸鸡、咖啡与果茶等购物对话（"+full("conv").length+"题）";


S.push({id:"music",n:"Jazz Bar・Live House",e:"🎷",c:"#7755a6",d:"订位、入场、点饮品与听演出"});


Q=Q.concat(GAME_DATA.d["quiz/music-1"]);
S.find(s=>s.id==="music").d="订位、票务、音乐费、点饮品与演出礼仪（"+full("music").length+"题）";


Q=Q.concat(GAME_DATA.d["quiz/music-2"]);
S.find(s=>s.id==="music").d="订位、票务、音乐费、点饮品与演出礼仪（"+full("music").length+"题）";


Q=Q.concat(GAME_DATA.d["quiz/nightlife-bar"]);
Object.assign(S.find(s=>s.id==="music"),{n:"酒吧・音乐・夜间娱乐",e:"🎶",d:"爵士、Live House、鸡尾酒、精酿、DJ、卡拉OK与音乐节（"+full("music").length+"题）"});


Q=Q.concat(GAME_DATA.d["quiz/nightlife-craft-beer"]);
Object.assign(S.find(s=>s.id==="music"),{n:"酒吧・音乐・夜间娱乐",e:"🎶",d:"爵士、Live House、鸡尾酒、精酿、DJ、卡拉OK与音乐节（"+full("music").length+"题）"});


Q=Q.concat(GAME_DATA.d["quiz/nightlife-club"]);
Object.assign(S.find(s=>s.id==="music"),{n:"酒吧・音乐・夜间娱乐",e:"🎶",d:"爵士、Live House、鸡尾酒、精酿、DJ、卡拉OK与音乐节（"+full("music").length+"题）"});


Q=Q.concat(GAME_DATA.d["quiz/nightlife-karaoke"]);
Object.assign(S.find(s=>s.id==="music"),{n:"酒吧・音乐・夜间娱乐",e:"🎶",d:"爵士、Live House、鸡尾酒、精酿、DJ、卡拉OK与音乐节（"+full("music").length+"题）"});


Q=Q.concat(GAME_DATA.d["quiz/nightlife-festival"]);
Object.assign(S.find(s=>s.id==="music"),{n:"酒吧・音乐・夜间娱乐",e:"🎶",d:"爵士、Live House、鸡尾酒、精酿、DJ、卡拉OK与音乐节（"+full("music").length+"题）"});


Q=Q.concat(GAME_DATA.d["quiz/music-rules"]);
S.find(s=>s.id==="music").d="先看入场规则，再练酒吧、演出与夜间娱乐（"+full("music").length+"题）";
/* ==== engine/core/60-learning-and-shops.js ==== */
/* 【学习记录系统（learnRegister）与购物细分场景】 */
var LEARN_KEY='japan-travel-learning:v1';
var learnItems=[],learnById={};
function learnRegister(q,engine){
 var identity=engine==='legacy'?(q.uid||[q.s,q.t,q.e.indexOf(' = ')>=0?q.e.split(' = ')[0].split('(')[0]:q.t==='r'?q.j:q.o[q.a]].join('|')):[q.scene,q.kind,q.jp].join('|');
 var id=engine+'|'+identity;
 if(learnById[id])throw Error('Duplicate learning identity: '+id);
 var item={id:id,q:q,engine:engine,scene:engine==='legacy'?q.s:'demo-'+q.scene,self:engine==='demo'&&q.kind==='speak'};
 q.learnId=id;learnItems.push(item);learnById[id]=item;
}
/* ===== v5: 逛街购物细分场景 ===== */
var _full1=full;
var SHOPS=[
{id:'shopjp',n:'逛街・日系服饰',e:'👕',c:'#c2476b',d:'优衣库、无印、BEAMS、川久保玲等日系品牌读法',V:{'日系服饰品牌':['ユニクロ|ユニクロ|优衣库(平价基础款)','ジーユー|ジーユー|GU(优衣库姐妹品牌,偏潮流平价)','無印良品|むじるしりょうひん|无印良品(MUJI)','ビームス|ビームス|BEAMS(日本选货店)','ユナイテッドアローズ|ユナイテッドアローズ|UNITED ARROWS(日系精致休闲)','シップス|シップス|SHIPS(日系美式休闲)','ナノ・ユニバース|ナノユニバース|nano・universe(日系都市休闲)','アーバンリサーチ|アーバンリサーチ|URBAN RESEARCH(日系休闲选货店)','ワークマン|ワークマン|Workman(工装风平价功能服饰)','しまむら|しまむら|岛村(平价服饰连锁)','コム デ ギャルソン|コムデギャルソン|川久保玲(COMME des GARÇONS)','イッセイ ミヤケ|イッセイミヤケ|三宅一生(ISSEY MIYAKE)','ヨウジヤマモト|ヨウジヤマモト|山本耀司(Yohji Yamamoto)','ベイプ|ベイプ|BAPE(A BATHING APE潮牌)','ニコアンド|ニコアンド|niko and…(日系生活休闲)']}},
{id:'shoplux',n:'逛街・国际大牌',e:'👜',c:'#8a6d1d',d:'路易威登、香奈儿、爱马仕等大牌的日语读法',V:{'国际大牌':['ルイ・ヴィトン|ルイヴィトン|路易威登(LV)','シャネル|シャネル|香奈儿(CHANEL)','エルメス|エルメス|爱马仕(HERMÈS)','グッチ|グッチ|古驰(GUCCI)','プラダ|プラダ|普拉达(PRADA)','ディオール|ディオール|迪奥(Dior)','カルティエ|カルティエ|卡地亚(Cartier)','ティファニー|ティファニー|蒂芙尼(Tiffany)','バーバリー|バーバリー|博柏利(Burberry)','ロエベ|ロエベ|罗意威(LOEWE)','セリーヌ|セリーヌ|思琳(CELINE)','フェンディ|フェンディ|芬迪(FENDI)','バレンシアガ|バレンシアガ|巴黎世家(Balenciaga)','サンローラン|サンローラン|圣罗兰(Saint Laurent)','ボッテガ・ヴェネタ|ボッテガヴェネタ|宝缇嘉(Bottega Veneta)','コーチ|コーチ|蔻驰(COACH)','モンクレール|モンクレール|盟可睐(Moncler)','ブルガリ|ブルガリ|宝格丽(BVLGARI)','ロレックス|ロレックス|劳力士(Rolex)']}},
{id:'shopshoe',n:'逛街・鞋子',e:'👟',c:'#2b6fd9',d:'亚瑟士、鬼塚虎、新百伦等品牌与鞋类词',V:{'鞋子品牌':['アシックス|アシックス|亚瑟士(ASICS)','オニツカタイガー|オニツカタイガー|鬼塚虎(Onitsuka Tiger)','ミズノ|ミズノ|美津浓(Mizuno)','ニューバランス|ニューバランス|新百伦(New Balance)','ナイキ|ナイキ|耐克(Nike)','アディダス|アディダス|阿迪达斯(adidas)','コンバース|コンバース|匡威(CONVERSE)','ヴァンズ|ヴァンズ|万斯(VANS)','ドクターマーチン|ドクターマーチン|马丁博士(Dr. Martens)','ビルケンシュトック|ビルケンシュトック|勃肯(BIRKENSTOCK)','ホカ|ホカ|HOKA(缓震跑鞋)','サロモン|サロモン|萨洛蒙(Salomon)','リーガル|リーガル|REGAL(日本皮鞋品牌)'],'鞋类词':['スニーカー|スニーカー|运动休闲鞋','ローファー|ローファー|乐福鞋','サンダル|サンダル|凉鞋','ブーツ|ブーツ|靴子','革靴|かわぐつ|皮鞋','中敷き|なかじき|鞋垫']}},
{id:'shopperf',n:'逛街・香水',e:'🌸',c:'#9b59b6',d:'香水术语、香气类型、试香和香氛品牌',V:{'香水术语':['香水|こうすい|香水','オードパルファム|オードパルファム|浓香水(EDP)','オードトワレ|オードトワレ|淡香水(EDT)','オーデコロン|オーデコロン|古龙水(EDC)','フレグランス|フレグランス|香氛(香水类总称)','トップノート|トップノート|前调','ミドルノート|ミドルノート|中调','ラストノート|ラストノート|后调','ムエット|ムエット|试香纸','テスター|テスター|试用装','サンプル|サンプル|小样','ボディミスト|ボディミスト|身体喷雾'],'香气类型':['フローラル|フローラル|花香调','ウッディ|ウッディ|木质调','柑橘系|かんきつけい|柑橘调','甘い香り|あまいかおり|甜香','ムスク|ムスク|麝香调'],'香水品牌':['ジョー マローン ロンドン|ジョーマローンロンドン|祖·玛珑(Jo Malone London)','ディプティック|ディプティック|蒂普提克(diptyque)','バイレード|バイレード|柏芮朵(BYREDO)','ル ラボ|ルラボ|LE LABO(勒拉博)','シロ|シロ|SHIRO(日本香氛护肤品牌)']}},
{id:'shopcos',n:'逛街・化妆品',e:'💄',c:'#d6457c',d:'护肤彩妆品类、资生堂、KATE等品牌',V:{'化妆品品类':['口紅|くちべに|口红','ファンデーション|ファンデーション|粉底','下地|したじ|妆前乳','日焼け止め|ひやけどめ|防晒霜','化粧水|けしょうすい|化妆水','乳液|にゅうえき|乳液','美容液|びようえき|精华液','クレンジング|クレンジング|卸妆','洗顔料|せんがんりょう|洗面奶','アイシャドウ|アイシャドウ|眼影','マスカラ|マスカラ|睫毛膏','チーク|チーク|腮红','パック|パック|面膜','ハンドクリーム|ハンドクリーム|护手霜','リップクリーム|リップクリーム|润唇膏'],'化妆品品牌':['資生堂|しせいどう|资生堂(Shiseido)','SK-II|エスケーツー|SK-II(神仙水品牌)','ケイト|ケイト|KATE(日本彩妆)','キャンメイク|キャンメイク|CANMAKE(平价彩妆)','セザンヌ|セザンヌ|CEZANNE(平价彩妆)','肌ラボ|はだラボ|肌研(Hada Labo)']}},
{id:'shopstore',n:'逛街・店铺与商场',e:'🏬',c:'#1b8fa6',d:'唐吉诃德、百货、电器店、药妆连锁等',V:{'店铺与商场':['ドン・キホーテ|ドンキホーテ|唐吉诃德(折扣百货)','ダイソー|ダイソー|大创(百元店)','ロフト|ロフト|LOFT(生活杂货)','ハンズ|ハンズ|HANDS(原东急手创馆)','ビックカメラ|ビックカメラ|BIC CAMERA(电器连锁)','ヨドバシカメラ|ヨドバシカメラ|友都八喜(电器连锁)','百貨店|ひゃっかてん|百货商场','三越|みつこし|三越(百货)','伊勢丹|いせたん|伊势丹(百货)','高島屋|たかしまや|高岛屋(百货)','アウトレット|アウトレット|奥特莱斯','免税店|めんぜいてん|免税店','ドラッグストア|ドラッグストア|药妆店','マツモトキヨシ|マツモトキヨシ|松本清(药妆连锁)']}}];
/* v6: 日系服饰、古着、尺码、面料及配饰题库扩充 */
SHOPS[0].d="日系品牌、服装款式、材质、尺码、古着、眼镜、手表和包袋";
SHOPS[0].V["日系服饰品牌补充"]=["オーラリー|オーラリー|AURALEE(日本极简服饰品牌)", "コモリ|コモリ|COMOLI(日式宽松简约)", "グラフペーパー|グラフペーパー|Graphpaper(宽松现代服饰)", "キャプテンサンシャイン|キャプテンサンシャイン|KAPTAIN SUNSHINE(复古工装)", "エンジニアドガーメンツ|エンジニアドガーメンツ|Engineered Garments(工装)", "ニードルズ|ニードルズ|NEEDLES(运动复古)", "サカイ|サカイ|sacai(解构设计)", "アンダーカバー|アンダーカバー|UNDERCOVER(高桥盾)", "ジュンヤワタナベ|ジュンヤワタナベ|JUNYA WATANABE(设计师品牌)", "カラー|カラー|kolor(设计师品牌)", "ダブレット|ダブレット|doublet(趣味设计)", "ファセッタズム|ファセッタズム|FACETASM(解构街头)", "ネイバーフッド|ネイバーフッド|NEIGHBORHOOD(机车街头)", "ダブルタップス|ダブルタップス|WTAPS(军事街头)", "ヒューマンメイド|ヒューマンメイド|HUMAN MADE(复古街头)", "キャピタル|キャピタル|KAPITAL(牛仔复古)", "ブルーブルージャパン|ブルーブルージャパン|BLUE BLUE JAPAN(蓝染工装)", "オアスロウ|オアスロウ|orSlow(复刻丹宁)", "フルカウント|フルカウント|FULLCOUNT(复古牛仔)", "エヴィス|エヴィス|EVISU(日本牛仔)", "ビズビム|ビズビム|visvim(复古机能)", "ナナミカ|ナナミカ|nanamica(都市户外)", "ザ・ノース・フェイス パープルレーベル|ザノースフェイスパープルレーベル|THE NORTH FACE PURPLE LABEL(日本支线)", "ホワイトマウンテニアリング|ホワイトマウンテニアリング|White Mountaineering(户外时装)", "スノーピーク|スノーピーク|Snow Peak(户外生活服饰)", "フリークスストア|フリークスストア|FREAK’S STORE(美式休闲选货)", "ジャーナルスタンダード|ジャーナルスタンダード|JOURNAL STANDARD(选货店)", "エディフィス|エディフィス|ÉDIFICE(男装选货)", "ステュディオス|ステュディオス|STUDIOUS(日本设计师选货)", "トゥモローランド|トゥモローランド|TOMORROWLAND(精品选货)", "ドーバーストリートマーケット|ドーバーストリートマーケット|DOVER STREET MARKET(买手店)", "アダム エ ロペ|アダムエロペ|ADAM ET ROPÉ(日系时装)", "ローリーズファーム|ローリーズファーム|LOWRYS FARM(休闲服饰)", "レイジブルー|レイジブルー|RAGEBLUE(平价男装)", "ハレ|ハレ|HARE(日系都市风)", "グローバルワーク|グローバルワーク|GLOBAL WORK(日常休闲)", "ステュディオ・ダルチザン|ステュディオダルチザン|STUDIO D’ARTISAN(复刻牛仔)"];
SHOPS[0].V["服装款式与单品"]=["ニット|ニット|针织衫", "セーター|セーター|毛衣", "カーディガン|カーディガン|开衫", "スウェット|スウェット|卫衣或运动棉衫", "パーカー|パーカー|连帽卫衣", "フーディー|フーディー|连帽衫", "シャツ|シャツ|衬衫", "オックスフォードシャツ|オックスフォードシャツ|牛津纺衬衫", "デニムシャツ|デニムシャツ|牛仔衬衫", "オープンカラーシャツ|オープンカラーシャツ|开领衬衫", "ポロシャツ|ポロシャツ|Polo衫", "カットソー|カットソー|针织上衣统称", "ロンT|ロンティー|长袖T恤", "タンクトップ|タンクトップ|背心", "ジャケット|ジャケット|夹克或西装外套", "テーラードジャケット|テーラードジャケット|西装式外套", "レザージャケット|レザージャケット|皮夹克", "ライダースジャケット|ライダースジャケット|机车夹克", "ブルゾン|ブルゾン|短款夹克", "スタジャン|スタジャン|棒球夹克", "スカジャン|スカジャン|横须贺刺绣夹克", "コーチジャケット|コーチジャケット|教练夹克", "デニムジャケット|デニムジャケット|牛仔夹克", "ミリタリージャケット|ミリタリージャケット|军装夹克", "トレンチコート|トレンチコート|风衣", "チェスターコート|チェスターコート|切斯特大衣", "ステンカラーコート|ステンカラーコート|翻领单排扣大衣", "ダウンジャケット|ダウンジャケット|羽绒夹克", "ダウンベスト|ダウンベスト|羽绒马甲", "フリース|フリース|抓绒衫", "ベスト|ベスト|马甲", "セットアップ|セットアップ|成套穿搭", "スラックス|スラックス|西裤", "チノパン|チノパン|斜纹棉裤", "デニムパンツ|デニムパンツ|牛仔裤", "カーゴパンツ|カーゴパンツ|工装口袋裤", "ワイドパンツ|ワイドパンツ|阔腿裤", "テーパードパンツ|テーパードパンツ|锥形裤", "ストレートパンツ|ストレートパンツ|直筒裤", "スキニーパンツ|スキニーパンツ|紧身裤", "ショートパンツ|ショートパンツ|短裤", "ジョガーパンツ|ジョガーパンツ|束脚裤", "オーバーオール|オーバーオール|背带工装裤", "サロペット|サロペット|背带裤或连体裤", "プリーツスカート|プリーツスカート|百褶裙", "ロングスカート|ロングスカート|长裙", "ワンピース|ワンピース|连衣裙", "タートルネック|タートルネック|高领", "モックネック|モックネック|半高领", "クルーネック|クルーネック|圆领", "Vネック|ブイネック|V领", "ハーフジップ|ハーフジップ|半拉链款"];
SHOPS[0].V["材质与面料"]=["綿|めん|棉", "コットン|コットン|棉质", "毛|け|毛纤维", "ウール|ウール|羊毛", "メリノウール|メリノウール|美利奴羊毛", "カシミヤ|カシミヤ|羊绒", "モヘア|モヘア|马海毛", "アルパカ|アルパカ|羊驼毛", "シルク|シルク|真丝", "麻|あさ|麻", "リネン|リネン|亚麻", "レーヨン|レーヨン|人造丝", "キュプラ|キュプラ|铜氨纤维", "ポリエステル|ポリエステル|聚酯纤维", "ナイロン|ナイロン|尼龙", "アクリル|アクリル|腈纶", "ポリウレタン|ポリウレタン|聚氨酯弹性纤维", "ポリウレタン混紡|ポリウレタンこんぼう|混纺弹性纤维", "本革|ほんがわ|真皮", "合成皮革|ごうせいひかく|人造革", "スエード|スエード|麂皮", "デニム|デニム|牛仔布", "コーデュロイ|コーデュロイ|灯芯绒", "ツイード|ツイード|粗花呢", "フランネル|フランネル|法兰绒", "シアサッカー|シアサッカー|泡泡纱", "サテン|サテン|缎面", "ジャージー|ジャージー|针织平纹布", "メッシュ|メッシュ|网眼布", "ゴアテックス|ゴアテックス|GORE-TEX防水透湿面料", "中綿|なかわた|填充棉", "羽毛|うもう|羽毛", "ダウン|ダウン|羽绒", "フェザー|フェザー|羽毛填充物", "裏地|うらじ|里料", "表地|おもてじ|面料外层", "混紡|こんぼう|混纺", "羊毛100％|ウールひゃくパーセント|百分之百羊毛"];
SHOPS[0].V["尺码版型与试穿"]=["Sサイズ|エスサイズ|S码", "Mサイズ|エムサイズ|M码", "Lサイズ|エルサイズ|L码", "XLサイズ|エックスエルサイズ|XL码", "フリーサイズ|フリーサイズ|均码", "ワンサイズ|ワンサイズ|单一尺码", "ユニセックス|ユニセックス|男女通用款", "メンズ|メンズ|男装", "レディース|レディース|女装", "オーバーサイズ|オーバーサイズ|宽松大廓形", "ジャストサイズ|ジャストサイズ|正好合身的尺码", "タイトフィット|タイトフィット|修身紧贴", "リラックスフィット|リラックスフィット|舒适宽松版型", "ボックスシルエット|ボックスシルエット|方形廓形", "ドロップショルダー|ドロップショルダー|落肩", "クロップド丈|クロップドたけ|短款长度", "着丈|きたけ|衣长", "身幅|みはば|胸围平铺宽度", "肩幅|かたはば|肩宽", "袖丈|そでたけ|袖长", "裄丈|ゆきたけ|从后领中到袖口长度", "ウエスト|ウエスト|腰围", "股下|またした|裤内长", "股上|またがみ|裤裆高度", "裾幅|すそはば|裤脚宽", "わたり幅|わたりはば|大腿位置宽", "試着室|しちゃくしつ|试衣间", "サイズ表|サイズひょう|尺码表", "採寸|さいすん|测量尺寸", "裾上げ|すそあげ|裤脚改短", "お直し|おなおし|衣服修改", "在庫あり|ざいこあり|有库存", "在庫切れ|ざいこぎれ|缺货", "売り切れ|うりきれ|售罄", "色違い|いろちがい|其他颜色款", "サイズ違い|サイズちがい|其他尺码款"];
SHOPS[0].V["古着与复古穿搭"]=["古着|ふるぎ|古着或二手旧衣", "古着屋|ふるぎや|古着店", "ヴィンテージ|ヴィンテージ|Vintage年代古着", "ビンテージ加工|ビンテージかこう|仿旧加工", "ユーズド|ユーズド|Used二手商品", "中古品|ちゅうこひん|二手货", "デッドストック|デッドストック|未使用旧库存", "新品同様|しんぴんどうよう|近乎全新", "一点物|いってんもの|独一件", "レギュラー古着|レギュラーふるぎ|普通日常古着", "アーカイブ|アーカイブ|Archive品牌历史旧款", "年代物|ねんだいもの|有年份的旧物", "90年代|きゅうじゅうねんだい|九十年代", "80年代|はちじゅうねんだい|八十年代", "00年代|ゼロゼロねんだい|二千年代", "アメカジ|アメカジ|美式休闲风", "モード系|モードけい|先锋设计时装风", "裏原系|うらはらけい|原宿里街街头风", "ストリート系|ストリートけい|街头风", "ミリタリー|ミリタリー|军事服饰风", "ワークウェア|ワークウェア|工装", "グランジ|グランジ|Grunge邋遢摇滚风", "パンク|パンク|朋克风", "リメイク|リメイク|旧衣改造", "リペア|リペア|修补", "ダメージ加工|ダメージかこう|破损仿旧加工", "色落ち|いろおち|褪色", "経年変化|けいねんへんか|随年份产生的质感变化", "アタリ|アタリ|牛仔磨白的穿着痕迹", "ヒゲ|ヒゲ|牛仔裤裆部猫须纹", "ハチノス|ハチノス|牛仔裤膝后蜂窝纹", "セルビッジ|セルビッジ|赤耳布边牛仔", "赤耳|あかみみ|赤耳牛仔布边", "シングルステッチ|シングルステッチ|单针缝线", "チェーンステッチ|チェーンステッチ|锁链车线", "タグ|タグ|衣服标牌", "紙タグ|かみタグ|纸吊牌", "洗濯タグ|せんたくタグ|洗标", "毛玉|けだま|起球", "ほつれ|ほつれ|脱线", "シミ|シミ|污渍", "穴あき|あなあき|破洞", "日焼け|ひやけ|日晒褪色", "使用感|しようかん|使用痕迹", "コンディション|コンディション|品相状态", "買取|かいとり|店铺收购", "委託販売|いたくはんばい|寄售", "試着可|しちゃくか|可以试穿", "返品不可|へんぴんふか|不接受退货", "下北沢|しもきたざわ|下北泽古着街区", "高円寺|こうえんじ|高圆寺古着街区", "原宿|はらじゅく|原宿时装街区", "ベルベルジン|ベルベルジン|BerBerJin古着店", "フラミンゴ|フラミンゴ|FLAMINGO古着店", "キンジ|キンジ|KINJI古着店", "セカンドストリート|セカンドストリート|2nd STREET二手连锁", "トレファクスタイル|トレファクスタイル|TreFacStyle二手服饰连锁", "ラグタグ|ラグタグ|RAGTAG设计师二手服饰", "カインドオル|カインドオル|Kindal设计师二手服饰"];
SHOPS[0].V["眼镜与太阳镜"]=["眼鏡|めがね|眼镜", "伊達メガネ|だてめがね|无度数装饰眼镜", "サングラス|サングラス|太阳镜", "フレーム|フレーム|镜框", "レンズ|レンズ|镜片", "度付き|どつき|带度数", "度なし|どなし|无度数", "近視|きんし|近视", "乱視|らんし|散光", "遠視|えんし|远视", "度数|どすう|镜片度数", "ブルーライトカット|ブルーライトカット|防蓝光", "調光レンズ|ちょうこうレンズ|变色镜片", "偏光レンズ|へんこうレンズ|偏光镜片", "クリアフレーム|クリアフレーム|透明镜框", "黒縁メガネ|くろぶちめがね|黑框眼镜", "メタルフレーム|メタルフレーム|金属镜框", "セルフレーム|セルフレーム|塑料板材镜框", "ボストン型|ボストンがた|波士顿圆框", "ウェリントン型|ウェリントンがた|威灵顿方框", "ラウンド型|ラウンドがた|圆框", "オーバル型|オーバルがた|椭圆框", "鼻パッド|はなパッド|鼻托", "テンプル|テンプル|眼镜镜腿", "フィッティング|フィッティング|镜架适配调整", "視力検査|しりょくけんさ|视力检查", "レンズ交換|レンズこうかん|更换镜片", "ジンズ|ジンズ|JINS眼镜连锁", "ゾフ|ゾフ|Zoff眼镜连锁", "金子眼鏡|かねこがんきょう|金子眼镜", "白山眼鏡店|はくさんがんきょうてん|白山眼镜店", "アイヴァン|アイヴァン|EYEVAN眼镜品牌", "オリバーピープルズ|オリバーピープルズ|Oliver Peoples眼镜品牌"];
SHOPS[0].V["手表与配饰"]=["腕時計|うでどけい|手表", "機械式時計|きかいしきどけい|机械表", "自動巻き|じどうまき|自动机械表", "手巻き|てまき|手动上链", "クォーツ|クォーツ|石英表", "ソーラー時計|ソーラーどけい|太阳能手表", "文字盤|もじばん|表盘", "時計の針|とけいのはり|指针", "リューズ|リューズ|表冠", "ベゼル|ベゼル|表圈", "ベルト|ベルト|表带", "革ベルト|かわベルト|皮表带", "メタルバンド|メタルバンド|金属表带", "防水性能|ぼうすいせいのう|防水性能", "電池交換|でんちこうかん|更换电池", "オーバーホール|オーバーホール|机芯保养", "保証書|ほしょうしょ|保修证明", "箱付き|はこつき|带原装盒", "付属品|ふぞくひん|附属配件", "セイコー|セイコー|SEIKO精工", "グランドセイコー|グランドセイコー|Grand Seiko冠蓝狮", "シチズン|シチズン|CITIZEN西铁城", "カシオ|カシオ|CASIO卡西欧", "ジーショック|ジーショック|G-SHOCK卡西欧系列", "オリエント|オリエント|ORIENT东方双狮", "ネックレス|ネックレス|项链", "ブレスレット|ブレスレット|手链", "リング|リング|戒指", "ピアス|ピアス|耳饰或耳洞", "イヤーカフ|イヤーカフ|耳骨夹", "シルバー925|シルバーきゅうにご|925银"];
SHOPS[0].V["包袋与皮具"]=["バッグ|バッグ|包", "ショルダーバッグ|ショルダーバッグ|单肩包", "トートバッグ|トートバッグ|托特包", "リュック|リュック|双肩背包", "バックパック|バックパック|户外背包", "ボディバッグ|ボディバッグ|斜挎胸包", "ウエストポーチ|ウエストポーチ|腰包", "サコッシュ|サコッシュ|轻薄斜挎包", "メッセンジャーバッグ|メッセンジャーバッグ|邮差包", "ボストンバッグ|ボストンバッグ|旅行手提包", "ブリーフケース|ブリーフケース|公文包", "クラッチバッグ|クラッチバッグ|手拿包", "ハンドバッグ|ハンドバッグ|手提包", "ミニバッグ|ミニバッグ|迷你包", "エコバッグ|エコバッグ|环保购物袋", "キャンバス地|キャンバスじ|帆布面料", "レザーバッグ|レザーバッグ|皮包", "ナイロンバッグ|ナイロンバッグ|尼龙包", "ファスナー|ファスナー|拉链", "内ポケット|うちポケット|内袋", "外ポケット|そとポケット|外袋", "マチ|マチ|包底侧宽", "持ち手|もちて|包的手柄", "ストラップ|ストラップ|肩带或挂绳", "長さ調節|ながさちょうせつ|长度调节", "収納力|しゅうのうりょく|收纳能力", "財布|さいふ|钱包", "長財布|ながざいふ|长钱包", "二つ折り財布|ふたつおりさいふ|对折钱包", "カードケース|カードケース|卡包", "キーケース|キーケース|钥匙包", "ポーター|ポーター|PORTER吉田包", "吉田カバン|よしだカバン|吉田包品牌", "マスターピース|マスターピース|master-piece日本包袋", "アニアリ|アニアリ|aniary日本皮包", "土屋鞄|つちやかばん|土屋鞄皮具品牌"];
/* v6 end */
var GSH=[],_ns=[];
SHOPS.forEach(function(x){var g=gen(x.V,x.id);GSH.push(g);_ns.push({id:x.id,n:x.n,e:x.e,c:x.c,d:x.d+'('+g.length+'题,随机出)'})});
S.splice.apply(S,[S.findIndex(function(s){return s.id==='shop'})+1,0].concat(_ns));
Object.assign(SC,{
'ユニクロ':'ユニクロの店舗はどこですか|优衣库的店在哪里;免税対応していますか|支持免税办理吗',
'無印良品':'無印良品は近くにありますか|附近有无印良品吗',
'ビームス':'ビームスの新作はありますか|有BEAMS的新品吗',
'ワークマン':'ワークマンはどこにありますか|Workman在哪里',
'ルイ・ヴィトン':'予約は必要ですか|需要预约吗;並ぶ必要はありますか|需要排队吗',
'シャネル':'パスポートの提示は必要ですか|需要出示护照吗',
'エルメス':'在庫はありますか|有库存吗',
'スニーカー':'二十五センチはありますか|有25厘米的吗;もう少し大きいサイズはありますか|有大一点的尺码吗',
'サンダル':'試着してもいいですか|可以试穿吗',
'ニューバランス':'限定モデルはありますか|有限定款吗',
'オニツカタイガー':'オニツカタイガーの店舗はどこですか|鬼塚虎的店在哪里',
'香水':'試してもいいですか|可以试香吗;ムエットをください|请给我试香纸',
'オードパルファム':'オードパルファムとオードトワレの違いは何ですか|浓香水和淡香水有什么区别',
'オードトワレ':'軽めの香りはありますか|有清淡一点的香味吗',
'ムエット':'ムエットをいただけますか|能给我一张试香纸吗',
'フローラル':'甘すぎない香りがいいです|想要不太甜的香味',
'サンプル':'サンプルはありますか|有小样吗',
'日焼け止め':'SPFはいくつですか|SPF是多少',
'口紅':'試してもいいですか|可以试色吗',
'ファンデーション':'私の肌に合う色はどれですか|哪个色号适合我的肤色',
'化粧水':'敏感肌でも使えますか|敏感肌能用吗',
'クレンジング':'オイルタイプはありますか|有卸妆油吗',
'パック':'何枚入りですか|一盒几片',
'リップクリーム':'無香料のものはありますか|有无香料的吗',
'アウトレット':'アウトレットまでどうやって行きますか|去奥特莱斯怎么走',
'免税店':'免税店はどこですか|免税店在哪里',
'百貨店':'百貨店は何時から開きますか|百货商场几点开门',
'ドン・キホーテ':'ドン・キホーテは何時まで開いていますか|唐吉诃德开到几点'});
(function(){var BR={'日系服饰品牌':1,'国际大牌':1,'鞋子品牌':1,'香水品牌':1,'化妆品品牌':1};
 SHOPS.forEach(function(x){Object.keys(x.V).forEach(function(c){x.V[c].forEach(function(r){var p=r.split('|'),j=p[0],z=p[2];if(WORD_EXPLANATIONS[j])return;
  var b=!!BR[c],st=c==='店铺与商场';
  var ex=SC[j]?SC[j].split(';').map(function(t){var a=t.split('|');return [a[0],a[1]]}):(b||st?[[j+'はどこですか？','“'+z.split('(')[0]+'”在哪里?','找店铺']].concat(b?[[j+'の新作(しんさく)はありますか？','有'+z.split('(')[0]+'的新品吗?','问新品']]:[]):[[j+'はありますか？','有'+z.split('(')[0]+'吗?','找商品']]);
  WORD_EXPLANATIONS[j]={what:'「'+j+'」是“'+z+'”。',why:(b||st)?'店名、招牌和购物小票上多用片假名或日文原名,认得读音就能问路、找店。':'货架标签、店员询问和商品包装上会用到这个词。',examples:ex}})})})})();
full=function(id){for(var i=0;i<SHOPS.length;i++)if(id===SHOPS[i].id)return GSH[i];if(id==='all')return _full1('all').concat.apply(_full1('all'),GSH);return _full1(id)};
/* ==== engine/core/65-custom-questions.js ==== */
/* ===================================================================
   新增日语题接入口
   题目数据放在：data/quiz/新增题目/*.json（构建时自动收集到 GAME_DATA.customQuestions）
   这里只负责：检查题目所属场景是否存在、补全解析字段、把题目并入题库。
   不需要为新增题目修改这个文件。
   =================================================================== */
var CUSTOM_Q=(function(){
 var list=(window.GAME_DATA&&GAME_DATA.customQuestions)||[],ok=[],bad=[];
 var cats=S.map(function(x){return x.id});
 var seen={};
 list.forEach(function(q,n){
  var name='新增题目第'+(n+1)+'题'+(q&&q.uid?'（'+q.uid+'）':'');
  if(!q||typeof q.q!=='string'||!Array.isArray(q.o)||q.o.length<2||typeof q.a!=='number'||!q.o[q.a]){bad.push(name+'：缺少题目 q / 选项 o / 正确答案序号 a，已跳过');return}
  if(cats.indexOf(q.s)<0){bad.push(name+'：场景「'+q.s+'」不存在，已跳过');return}
  if(!q.uid)q.uid=q.s+':'+q.q;
  if(String(q.uid).indexOf('custom:')!==0)q.uid='custom:'+q.uid; // 加前缀，避免与原题库编号冲突
  if(seen[q.uid]){bad.push(name+'：编号 uid 重复，已跳过');return}
  seen[q.uid]=1;
  if(!q.t)q.t=q.j?'r':'s';
  if(!q.e)q.e='';
  if(!q.d)q.d=[]; // 其他选项说明（可省略）
  if(!q.explain){var ex=q.t==='r'?[q.j||'',q.o[q.a],'题目中的日语']:[q.o[q.a],q.q,'可以这样说'];q.explain={text:q.e,examples:[ex]}}
  ok.push(q);
 });
 if(bad.length)(window.__GAME_LOAD_ERRORS=window.__GAME_LOAD_ERRORS||[]).push.apply(window.__GAME_LOAD_ERRORS,bad);
 return ok;
})();
var _fullBeforeCustom=full;
full=function(id){var b=_fullBeforeCustom(id);var ex=CUSTOM_Q.filter(function(q){return id==='all'||q.s===id});return ex.length?b.concat(ex):b};
/* ==== engine/core/70-learning-tools.js ==== */
/* 【注册所有题目到学习记录；错题本、复习等学习工具】 */
full('all').forEach(q=>learnRegister(q,'legacy'));DEMO.forEach(q=>learnRegister(q,'demo'));
var learnWarning='';
function learnBlank(){return {version:1,favorites:[],records:{},days:{}};}
function learnRead(){
 var empty=learnBlank();try{
  var raw=localStorage.getItem(LEARN_KEY);if(!raw)return empty;
  var value=JSON.parse(raw);if(!value||value.version!==1||!Array.isArray(value.favorites)||!value.records||typeof value.records!=='object')throw Error('Invalid data');
  empty.favorites=[...new Set(value.favorites.filter(id=>typeof id==='string'&&learnById[id]))];
  Object.keys(value.records).forEach(function(id){var r=value.records[id];if(!learnById[id]||!r||!Number.isInteger(r.attempts)||r.attempts<1||!Number.isInteger(r.correct)||r.correct<0||r.correct>r.attempts||typeof r.lastOk!=='boolean'||!Number.isInteger(r.errors)||r.errors<0||r.errors>r.attempts)return;empty.records[id]={attempts:r.attempts,correct:r.correct,errors:r.errors,lastOk:r.lastOk,lastAt:typeof r.lastAt==='string'?r.lastAt:'',assisted:Number.isInteger(r.assisted)&&r.assisted>=0&&r.assisted<=r.attempts?r.assisted:0};});
  if(value.days&&typeof value.days==='object')Object.keys(value.days).forEach(function(day){var n=value.days[day];if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isInteger(n)&&n>0)empty.days[day]=n;});
  return empty;
 }catch(e){learnWarning='暂时无法读取浏览器记录，本次仍可练习。';return empty;}
}
var learning=learnRead(),activeReview=null,libraryView=null;
Object.keys(learning.records).forEach(function(id){var item=learnById[id];if(item&&item.engine==='legacy')seen.add(item.q);});
function learnSave(){try{localStorage.setItem(LEARN_KEY,JSON.stringify(learning));learnWarning='';}catch(e){learnWarning='浏览器未能保存记录。当前页面内仍可使用，关闭或刷新后可能丢失。';}learnRefreshNavigation();}
function learnDay(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function learnRecord(q,ok,assisted){var id=q.learnId;if(!learnById[id])return;var r=learning.records[id]||{attempts:0,correct:0,errors:0,lastOk:false,lastAt:'',assisted:0};r.attempts++;r.correct+=ok?1:0;r.errors+=ok?0:1;r.lastOk=!!ok;r.lastAt=new Date().toISOString();r.assisted+=assisted?1:0;learning.records[id]=r;var day=learnDay();learning.days[day]=(learning.days[day]||0)+1;if(activeReview){if(learnById[id].self){activeReview.spoken++;activeReview.confident+=ok?1:0;}else{activeReview.answered++;activeReview.correct+=ok?1:0;}}learnSave();}
function learnPending(self){return learnItems.filter(function(item){var r=learning.records[item.id];return item.self===!!self&&r&&!r.lastOk;}).map(item=>item.id);}
function learnStats(items){var t={seen:0,attempts:0,correct:0,self:0,confident:0,assisted:0};(items||learnItems).forEach(function(item){var r=learning.records[item.id];if(!r)return;t.seen++;if(item.self){t.self+=r.attempts;t.confident+=r.correct;}else{t.attempts+=r.attempts;t.correct+=r.correct;t.assisted+=r.assisted;}});t.rate=t.attempts?Math.round(t.correct/t.attempts*100)+'%':'—';return t;}
function learnNavHtml(){return '<nav class="learn-nav" aria-label="学习导航"><button onclick="home()">首页</button><button onclick="tokyoHome()">🎮 游戏</button><button onclick="learnLibrary(\'favorites\')">☆ 收藏 <small>'+learning.favorites.length+'</small></button><button onclick="learnLibrary(\'wrong\')">错题本 <small>'+learnPending(false).length+'</small></button><button onclick="learnProgress()">学习进度</button></nav><p id="learn-storage" class="learn-warning"'+(learnWarning?'':' hidden')+'>'+de(learnWarning)+'</p>';}
function learnRefreshNavigation(){var nav=document.getElementById('learn-navigation');if(nav)nav.innerHTML=learnNavHtml();}
function learnNav(){var old=document.getElementById('learn-navigation');if(old)old.remove();var node=document.createElement('div');node.id='learn-navigation';node.innerHTML=learnNavHtml();app.insertBefore(node,app.firstChild);}
function learnFavoriteLabel(id){return learning.favorites.includes(id)?'★ 已记进手帐':'☆ 记进手帐';}
function learnFavoriteHtml(q){return '<button class="spkbtn learn-favorite '+(learning.favorites.includes(q.learnId)?'is-saved':'')+'" aria-pressed="'+learning.favorites.includes(q.learnId)+'">'+learnFavoriteLabel(q.learnId)+'</button>';}
function learnDecorate(q){learnNav();var bar=document.createElement('div');bar.className='learn-question-tools';bar.innerHTML=learnFavoriteHtml(q)+(activeReview?'<span>'+de(activeReview.title)+' · '+(activeReview.index+1)+' / '+activeReview.ids.length+'</span>':'');bar.querySelector('button').onclick=function(){learnToggle(q.learnId);};var anchor=app.querySelector('.tag,.demo-kind');if(anchor)anchor.before(bar);else app.appendChild(bar);}
function learnToggle(id){if(!learnById[id])return;var at=learning.favorites.indexOf(id);if(at<0)learning.favorites.push(id);else learning.favorites.splice(at,1);learnSave();var b=app.querySelector('.learn-question-tools .learn-favorite');if(b){b.textContent=learnFavoriteLabel(id);b.setAttribute('aria-pressed',learning.favorites.includes(id));b.classList.toggle('is-saved',learning.favorites.includes(id));}}
function learnTiles(){var t=learnStats();return '<div class="learn-metrics"><div><strong>'+t.seen+'<small> / '+learnItems.length+'</small></strong><span>已练题目</span></div><div><strong>'+t.attempts+'</strong><span>选择题作答次数</span></div><div><strong>'+t.rate+'</strong><span>选择题正确率</span></div><div><strong>'+learnPending(false).length+'</strong><span>待订正错题</span></div></div>';}
function learnSummary(){return '<section class="learn-panel"><div class="learn-heading"><h2>我的学习</h2><button class="spkbtn" onclick="learnProgress()">查看进度 →</button></div>'+learnTiles()+'<p class="learn-small">记录自动保存在当前浏览器。换设备、换浏览器不会同步，清除网站数据会丢失记录。</p></section>';}
function learnTitle(item){var q=item.q;return item.engine==='demo'?q.jp:q.t==='r'?q.j:q.o[q.a];}
function learnMeaning(item){var q=item.q;return item.engine==='demo'?q.zh:q.e.indexOf(' = ')>=0?q.e.split(' = ')[1]:q.t==='r'?q.o[q.a]:q.q;}
function learnSceneName(item){return item.engine==='legacy'?sc(item.q.s).n:(DEMO_SCENES.find(s=>s.id===item.q.scene)||{name:'场景练习'}).name;}
function learnType(item){return item.engine==='legacy'?(item.q.t==='r'?'理解日语':'表达日语'):demoLabels[item.q.kind];}
function learnListIds(type,filter){if(type==='favorites')return learning.favorites.slice().reverse();return learnItems.filter(function(item){var r=learning.records[item.id];if(!r)return false;if(filter==='speaking')return item.self&&!r.lastOk;if(item.self)return false;return filter==='resolved'?r.errors>0&&r.lastOk:!r.lastOk;}).map(item=>item.id);}
function learnLibrary(type,filter,page){demoCancelSpeech();activeReview=null;libraryView={type:type,filter:filter||'pending',page:page||0};var ids=learnListIds(type,libraryView.filter),favorite=type==='favorites',size=12,max=Math.max(0,Math.ceil(ids.length/size)-1);libraryView.page=Math.min(libraryView.page,max);var slice=ids.slice(libraryView.page*size,(libraryView.page+1)*size);
 app.innerHTML='<h1>'+(favorite?'我的收藏':'错题本')+'</h1><p class="lead">'+(favorite?'把想记住的题收在这里。复习时保留原来的题型和解析。':'答错会自动收录，之后答对就移到“已订正”。开口自评单独放在“开口待练”。')+'</p>'+(favorite?'':'<div class="learn-tabs"><button aria-pressed="'+(libraryView.filter==='pending')+'" onclick="learnLibrary(\'wrong\',\'pending\')">待订正</button><button aria-pressed="'+(libraryView.filter==='resolved')+'" onclick="learnLibrary(\'wrong\',\'resolved\')">已订正</button><button aria-pressed="'+(libraryView.filter==='speaking')+'" onclick="learnLibrary(\'wrong\',\'speaking\')">开口待练</button></div>')+'<div class="learn-heading"><span>'+ids.length+' 道题</span>'+(ids.length?'<button class="spkbtn" onclick="learnReviewLibrary()">开始复习 →</button>':'')+'</div>'+(ids.length?'<div id="learn-list">'+slice.map(function(id,n){var item=learnById[id],r=learning.records[id];return '<article class="learn-list-card"><div class="learn-small">'+de(learnSceneName(item))+' · '+de(learnType(item))+'</div><h2 lang="ja">'+de(learnTitle(item))+'</h2><p>'+de(learnMeaning(item))+'</p>'+(r?'<p class="learn-small">'+(item.self?'自评练习 '+r.attempts+' 次':'作答 '+r.attempts+' 次 · 答对 '+r.correct+' 次')+'</p>':'')+'<div class="learn-list-actions"><button class="spkbtn" data-list-practice="'+n+'">练这题</button><button class="spkbtn" data-list-save="'+n+'" aria-pressed="'+learning.favorites.includes(id)+'">'+(learning.favorites.includes(id)?'★ 取消收藏':'☆ 收藏')+'</button></div><details><summary>看例句和解析</summary><div id="learn-detail-'+n+'"></div></details></article>';}).join('')+'</div><div class="learn-pagination">'+(libraryView.page>0?'<button class="spkbtn" onclick="learnLibrary(libraryView.type,libraryView.filter,libraryView.page-1)">← 上一页</button>':'')+'<span>'+(libraryView.page+1)+' / '+(max+1)+'</span>'+(libraryView.page<max?'<button class="spkbtn" onclick="learnLibrary(libraryView.type,libraryView.filter,libraryView.page+1)">下一页 →</button>':'')+'</div>':'<div class="learn-empty">'+(favorite?'还没有收藏。在答题页点击“☆ 记进手帐”就能保存。':libraryView.filter==='resolved'?'答错的题重新答对后，会出现在这里。':libraryView.filter==='speaking'?'开口题自评“还想再练一遍”后，会出现在这里。':'现在没有待订正的错题。去选个场景继续练吧。')+'</div>');
 learnNav();slice.forEach(function(id,n){var item=learnById[id];app.querySelector('[data-list-practice="'+n+'"]').onclick=function(){learnBeginReview([id],'单题复习');};app.querySelector('[data-list-save="'+n+'"]').onclick=function(){learnToggle(id);learnLibrary(type,libraryView.filter,libraryView.page);};var details=document.getElementById('learn-detail-'+n).parentElement;details.addEventListener('toggle',function(){var body=document.getElementById('learn-detail-'+n);if(details.open&&!body.innerHTML)body.innerHTML=item.engine==='legacy'?fullExplanation(item.q):demoExplanation(item.q);});});window.scrollTo(0,0);
}
function learnReviewLibrary(){var ids=learnListIds(libraryView.type,libraryView.filter);learnBeginReview(ids,libraryView.type==='favorites'?'收藏复习':libraryView.filter==='speaking'?'开口复习':'错题复习');}
function learnBeginReview(ids,title){ids=ids.filter(id=>learnById[id]);if(!ids.length)return;activeReview={ids:shuf(ids),title:title,index:0,answered:0,correct:0,spoken:0,confident:0};learnReviewShow();}
function learnReviewShow(){var item=learnById[activeReview.ids[activeReview.index]];if(item.engine==='legacy')begin([item.q]);else demoBegin([item.q],item.q.scene);}
function learnReviewNext(){if(!activeReview)return;var item=learnById[activeReview.ids[activeReview.index]];if(item.engine==='legacy'?!st.ans:!demoState.answered)return;activeReview.index++;if(activeReview.index<activeReview.ids.length){learnReviewShow();return;}var d=activeReview;activeReview=null;demoCancelSpeech();app.innerHTML='<h1>这一轮复习完成了</h1><p class="lead">'+de(d.title)+' · '+d.ids.length+' 题</p><div class="learn-panel">'+(d.answered?'<p>选择题答对 <b>'+d.correct+' / '+d.answered+'</b></p>':'')+(d.spoken?'<p>开口自评能说 <b>'+d.confident+' / '+d.spoken+'</b></p>':'')+'<p class="learn-small">记录已计入学习进度。未订正的题会继续保留，收藏不会因答对而取消。</p></div><button class="btn" onclick="learnLibrary(\'wrong\')">看看还有哪些错题</button><button class="btn ghost" onclick="learnLibrary(\'favorites\')">回到收藏</button><button class="btn ghost" onclick="home()">回到主页</button>';learnNav();window.scrollTo(0,0);}
function learnFeedback(q,ok,self){var el=document.createElement('p');el.className='learn-record-note';el.setAttribute('role','status');el.textContent=self?(ok?'已记录本次自评：能自己说出来。':'已加入“开口待练”，可以稍后再练。'):(ok?(learning.records[q.learnId].errors?'这次答对了，手帐「语言笔记」里这条已订正。':'这个说法记进了手帐「语言笔记」。'):'记进了手帐「语言笔记」的错题页，下次答对就算记住了。');var target=document.getElementById(q.kind?'demo-feedback':'fb');if(target)target.prepend(el);}
function learnProgress(){demoCancelSpeech();activeReview=null;var t=learnStats(),days=Object.keys(learning.days).length;
 app.innerHTML='<h1>学习进度</h1><p class="lead">每次答题都会留下记录，回头看看已经走了多远。</p>'+learnTiles()+'<section class="learn-panel"><h2>今天与开口练习</h2><p>今天完成 <b>'+(learning.days[learnDay()]||0)+'</b> 次练习 · 累计练习 <b>'+days+'</b> 天</p><p>开口练习共 <b>'+t.self+'</b> 次，自评能说 <b>'+t.confident+'</b> 次</p><button class="spkbtn" onclick="learnLibrary(\'wrong\',\'speaking\')">开口待练 '+learnPending(true).length+' 题 →</button><p class="learn-small">开口自评不计入选择题正确率。听力题查看原文后作答也会计入，其中使用原文辅助 '+t.assisted+' 次。</p></section><section class="learn-panel"><h2>各场景进度</h2>'+[...S.map(x=>({id:x.id,name:x.n})),...DEMO_SCENES.map(x=>({id:'demo-'+x.id,name:x.name}))].map(function(scene){var items=learnItems.filter(x=>x.scene===scene.id),a=learnStats(items);return '<div class="learn-scene-progress"><div class="learn-heading"><b>'+de(scene.name)+'</b><span>'+a.seen+' / '+items.length+'</span></div><div class="bar"><i style="width:'+(items.length?a.seen/items.length*100:0)+'%"></i></div><small>选择题作答 '+a.attempts+' 次 · 正确率 '+a.rate+(a.self?' · 开口练习 '+a.self+' 次':'')+'</small></div>';}).join('')+'</section><p class="learn-small">“已练题目”按题目去重；同一个词的理解题和表达题分别计数。正确率包含重复练习。记录从此版本开始累计，不会补算之前未保存的作答。</p><p class="learn-small">记录只保存在当前浏览器。更换设备、微信与其他浏览器之间不会同步；清除网站数据会丢失记录。</p>';learnNav();window.scrollTo(0,0);
}
// Integrate with both existing engines without replacing their questions or explanations.
var learnOriginalHome=home;home=function(){demoCancelSpeech();activeReview=null;learnOriginalHome();var node=document.createElement('div');node.innerHTML=learnSummary();var entry=app.querySelector('.demo-entry');app.insertBefore(node,entry||app.firstChild);learnNav();};
var learnOriginalShow=show;show=function(){learnOriginalShow();learnDecorate(st.list[st.i]);};
var learnOriginalPick=pick;pick=function(k){if(st.ans)return;var q=st.list[st.i];if(!Number.isInteger(k)||k<0||k>=q.o.length)return;learnOriginalPick(k);var ok=k===q.a;learnRecord(q,ok,false);learnFeedback(q,ok,false);var score=app.querySelector('.top span:last-child');if(score)score.textContent='得分 '+st.score;if(activeReview){var nx=document.getElementById('nx');nx.textContent=activeReview.index+1<activeReview.ids.length?'下一道复习题 →':'查看复习结果';nx.onclick=learnReviewNext;}};
var learnOriginalEnd=end;end=function(){learnOriginalEnd();learnNav();};
var learnOriginalDemoMenu=demoMenu;demoMenu=function(){activeReview=null;learnOriginalDemoMenu();learnNav();};
var learnOriginalDemoShow=demoShow;demoShow=function(){learnOriginalDemoShow();learnDecorate(demoState.list[demoState.i]);};
var learnOriginalDemoAnswer=demoAnswer;demoAnswer=function(i){var d=demoState;if(d.answered||!d.options[i])return;var q=d.list[d.i],ok=d.options[i].correct;learnOriginalDemoAnswer(i);learnRecord(q,ok,d.usedText);learnFeedback(q,ok,false);if(activeReview)document.getElementById('demo-next').textContent=activeReview.index+1<activeReview.ids.length?'下一道复习题 →':'查看复习结果';};
var learnOriginalDemoSelf=demoSelf;demoSelf=function(ok){var d=demoState;if(d.answered||!d.revealed)return;var q=d.list[d.i];learnOriginalDemoSelf(ok);learnRecord(q,ok,d.neededHelp);learnFeedback(q,ok,true);};
var learnOriginalDemoNext=demoNext;demoNext=function(){if(activeReview)learnReviewNext();else learnOriginalDemoNext();};
var learnOriginalDemoEnd=demoEnd;demoEnd=function(){learnOriginalDemoEnd();learnNav();};

var musicRuleCards=[["拍照之前，先看本场许可", "日本不少演出会限制拍照、录像或录音，但并非全部禁止。看到「撮影・録音禁止（さつえい・ろくおんきんし）」就不要拍录；手机不自动例外。只允许某首歌拍照时，也不代表整场可录像。", "演奏中(えんそうちゅう)に写真(しゃしん)を撮って(とって)もいいですか？", "演奏时可以拍照吗？"], ["门票之外，可能还要付一杯饮品费", "正确写法是「ドリンク代（だい）」。Live House 常见「1D別」「ドリンク代別途」：表示门票之外另付饮品费，通常不能因为不喝就省掉。具体金额与支付方式看该场公告，并非日本所有演唱会都有这项收费。", "ドリンク代(だい)はいくらですか？", "饮品费多少钱？"], ["一杯饮品，不等于必须喝酒", "付费后可能拿到饮品券或代币，再去吧台换可选饮品。可询问无酒精饮料，不必选酒；兑换范围、截止时间和差价需确认。「1ドリンク付き」表示含一杯；「1ドリンクオーダー制」则是要求点一杯，不一定包含在门票里。", "ソフトドリンクにも交換(こうかん)できますか？", "也可以换无酒精饮料吗？"], ["号码、站席和开演时间要分清", "「整理番号（せいりばんごう）」通常是入场顺序号，不是座位号。「オールスタンディング」是全站席；「自由席（じゆうせき）」不是免费。「開場（かいじょう）」是开放入场，「開演（かいえん）」才是演出开始。", "何時(なんじ)から入れます(はいれます)か？", "几点可以入场？"], ["离开之前，确认能不能再进来", "看到「再入場不可（さいにゅうじょうふか）」表示出去后不能再次入场。允许再入场的活动也可能要求腕带、印章或票根。大型行李、外带饮食等要求也应看本场说明。", "一度(いちど)外(そと)に出ても(でても)、再入場(さいにゅうじょう)できますか？", "出去一次之后还能再进来吗？"], ["酒吧、卡拉OK与音乐节各有规则", "音乐费、座位费、服务费可能分别计收。卡拉OK「フリータイム」是限定时间套餐，不是免费。音乐节不同舞台也可能有各自的拍摄或入场限制；购票页、官方公告和现场工作人员的说明最直接。", "追加料金(ついかりょうきん)はかかりますか？", "还会有额外费用吗？"]];
var musicStartWithoutGuide=start;
start=function(id){if(id==='music'){musicRules();return;}return musicStartWithoutGuide(id);};
/* ==== engine/core/80-music-rules.js ==== */
/* 【音乐场所入场规则说明页】 */
function musicRules(){
 demoCancelSpeech();activeReview=null;
 app.innerHTML='<h1>听演出前，先懂这些规则</h1><p class="lead">酒吧・音乐・夜间娱乐｜不同场地、不同演出可能有不同要求。</p><button class="btn" id="music-go-top">开始随机练习 · 10题 →</button>'+musicRuleCards.map(function(c){return '<section class="learn-panel"><h2>'+de(c[0])+'</h2><p>'+de(c[1])+'</p><p lang="ja"><b>'+de(c[2])+'</b></p><p class="learn-small">'+de(c[3])+'</p><button class="spkbtn" data-music-say="'+de(c[2])+'">🔊 听这句</button></section>';}).join('')+'<section class="learn-panel"><h2>场地官方说明示例</h2><p><a href="https://shibuya-o.com/faq/" target="_blank" rel="noopener noreferrer">Spotify O：饮品费与拍摄规则</a></p><p><a href="https://www.bluenote.co.jp/jp/sp/faq/" target="_blank" rel="noopener noreferrer">Blue Note Tokyo：演出拍摄规定</a></p><p class="learn-small">这里只作规则示例，请再核对自己所购场次的公告。</p></section><button class="btn" id="music-rules-quiz">只练入场规则 · 8题 →</button><button class="btn ghost" id="music-go-bottom">全部夜间娱乐随机练习 →</button>';
 learnNav();document.getElementById('music-go-top').onclick=document.getElementById('music-go-bottom').onclick=function(){musicStartWithoutGuide('music');};
 document.getElementById('music-rules-quiz').onclick=function(){begin(shuf(Q.filter(q=>q.uid&&q.uid.indexOf('music-rules-v1:')===0)));};
 app.querySelectorAll('[data-music-say]').forEach(function(b){b.onclick=function(){say(b.dataset.musicSay);};});window.scrollTo(0,0);
}
/* ==== engine/core/85-life-guide-and-visitor.js ==== */
/* 【生活指南与访客模式（生活卡片、实用问答、旅游词汇）】 */
/* 阅读指南独立于题库，不计答题分数。 */
var lifeCards=GAME_DATA.d["visitor/life-cards"];
var lifeKey='japan-travel-life-guide:v1',lifeRead=[],lifeFilter='全部',lifeQuery='',lifeStorageWarning='';
try{var lr=JSON.parse(localStorage.getItem(lifeKey)||'[]');if(Array.isArray(lr))lifeRead=lr.filter(x=>lifeCards.some(c=>c.id===x));}catch(e){lifeStorageWarning='暂时无法读取阅读标记，本页仍可正常浏览。';}
function lifeGuide(){
 demoCancelSpeech();activeReview=null;lifeFilter='全部';lifeQuery='';
 app.innerHTML='<h1>日本生活规则与习惯</h1><p class="lead">了解就好，不用背单词，也不考试。这里区分现场规定、常见礼仪与习惯，帮助你少一点不确定。</p><section class="learn-panel"><p><b>先记三件事：</b>看现场标识、别影响别人、不确定就问工作人员。习惯并非全国统一，也不是每条都属于法律。</p><p>可选标记“已了解”，仅用于下次翻阅，不计入答题成绩。</p><p id="life-count" class="learn-small"></p><p id="life-storage-warning" class="learn-small" role="status"></p></section><label for="life-search">找一条实用提醒</label><input id="life-search" type="search" placeholder="例如：冰水、厕所、现金、扶梯" style="box-sizing:border-box;width:100%;padding:12px;border:1px solid var(--line,#ccd3df);border-radius:12px;margin:8px 0 14px;background:var(--card,#fff);color:inherit"><div id="life-filters" class="learn-tabs">'+['全部',...new Set(lifeCards.map(c=>c.cat))].map(c=>'<button type="button" data-life-filter="'+de(c)+'" aria-pressed="'+(c==='全部')+'">'+de(c)+'</button>').join('')+'</div><div id="life-list"></div>';
 learnNav();document.getElementById('life-search').oninput=function(){lifeQuery=this.value.trim();lifeRender();};
 app.querySelectorAll('[data-life-filter]').forEach(b=>{b.onclick=function(){lifeFilter=this.dataset.lifeFilter;app.querySelectorAll('[data-life-filter]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.lifeFilter===lifeFilter));lifeRender();};});lifeRender();window.scrollTo(0,0);
}

var lifePhrases={"escalator": [["エレベーターはどこですか？", "电梯在哪里？"], ["階段(かいだん)はどちらですか？", "楼梯在哪边？"]], "boarding": [["ここに並べば(ならべば)いいですか？", "在这里排队就可以吗？"], ["すみません、降ります(おります)。", "不好意思，我要下车。"]], "calls": [["今(いま)、電車(でんしゃ)なので、あとでかけ直します(なおします)。", "我现在在电车上，稍后回拨。"], ["電話(でんわ)してもいい場所(ばしょ)はありますか？", "有可以打电话的地方吗？"]], "eating": [["ここで食べて(たべて)もいいですか？", "可以在这里吃东西吗？"], ["食事(しょくじ)ができる場所(ばしょ)はありますか？", "有可以吃饭的地方吗？"]], "seats": [["よかったら、どうぞ。", "您不介意的话，请坐。"], ["荷物(にもつ)はどこに置けば(おけば)いいですか？", "行李应该放在哪里？"]], "walking": [["こちらから行けば(いけば)いいですか？", "从这边走就可以吗？"], ["すみません、通して(とおして)もらえますか？", "不好意思，可以让我过去吗？"]], "smoking": [["喫煙所(きつえんじょ)はどこですか？", "吸烟区在哪里？"], ["ここは禁煙(きんえん)ですか？", "这里禁烟吗？"]], "trash": [["このごみは、どこに捨てれば(すてれば)いいですか？", "这个垃圾应该扔在哪里？"], ["ここに捨てて(すてて)もいいですか？", "可以扔在这里吗？"]], "toilets": [["すみません、トイレはどこですか？", "不好意思，厕所在哪里？"], ["車いす(くるまいす)で使える(つかえる)トイレはありますか？", "有轮椅可以使用的厕所吗？"], ["おむつを替えられる(かえられる)場所(ばしょ)はありますか？", "有可以给宝宝换尿布的地方吗？"], ["授乳室(じゅにゅうしつ)はありますか？", "有哺乳室吗？"]], "flush": [["すみません、水(みず)の流し方(ながしかた)がわからないんですが。", "不好意思，我不知道怎么冲水。"], ["トイレットペーパーがなくなっています。", "厕纸用完了。"]], "queue": [["最後尾(さいこうび)はどこですか？", "队尾在哪里？"], ["先(さき)に名前(なまえ)を書けば(かけば)いいですか？", "要先登记姓名吗？"]], "photos": [["ここで写真(しゃしん)を撮って(とって)もいいですか？", "可以在这里拍照吗？"], ["写真(しゃしん)を撮らせて(とらせて)もらってもいいですか？", "可以让我为您拍张照片吗？"]], "water": [["氷(こおり)なしのお水(みず)をお願いします。", "请给我不加冰的水。"], ["お湯(ゆ)はいただけますか？", "可以给我热水吗？"]], "seat": [["二人(ふたり)です。", "我们两个人。"], ["ここに座って(すわって)もいいですか？", "可以坐在这里吗？"]], "bill": [["お会計(かいけい)をお願いします。", "请帮我结账。"], ["お会計(かいけい)はレジですか？", "是在收银台结账吗？"]], "tip": [["ありがとうございました。", "谢谢您。"], ["とてもおいしかったです。ごちそうさまでした。", "很好吃，谢谢款待。"]], "otoshi": [["お通し代(おとおしだい)はいくらですか？", "入座小菜收费多少？"], ["席料(せきりょう)もかかりますか？", "还要收座位费吗？"]], "takeaway": [["持ち帰り(もちかえり)でお願いします。", "请帮我打包外带。"], ["店内(てんない)で食べます(たべます)。", "我在店里吃。"]], "payment": [["現金(げんきん)だけですか？", "只收现金吗？"], ["クレジットカードは使えます(つかえます)か？", "可以用信用卡吗？"]], "mobile": [["この支払い方法(しはらいほうほう)は使えます(つかえます)か？", "可以用这种付款方式吗？"], ["アリペイは使えます(つかえます)か？", "可以用支付宝吗？"], ["ウィーチャットペイは使えます(つかえます)か？", "可以用微信支付吗？"]], "tax": [["これは税込み(ぜいこみ)ですか？", "这个是含税价吗？"], ["全部(ぜんぶ)でいくらになりますか？", "合计多少钱？"]], "bags": [["袋(ふくろ)は大丈夫(だいじょうぶ)です。", "不用袋子。"], ["お箸(はし)を一膳(いちぜん)お願いします。", "请给我一双筷子。"], ["袋(ふくろ)を一枚(いちまい)お願いします。", "请给我一个袋子。"]], "shoes": [["ここで靴(くつ)を脱げば(ぬげば)いいですか？", "在这里脱鞋就可以吗？"], ["スリッパはどこですか？", "拖鞋在哪里？"]], "bath": [["大浴場(だいよくじょう)の利用時間(りようじかん)を教えて(おしえて)ください。", "请告诉我大浴场的使用时间。"], ["タオルは持って(もって)いく必要(ひつよう)がありますか？", "需要自己带毛巾过去吗？"]]};
function lifePhraseHtml(c){return '<div class="explain-phrases" aria-label="现场可用的日语">'+lifePhrases[c.id].map(function(p){return '<div class="explain-example"><p lang="ja">'+de(p[0])+'</p><p class="explain-zh">'+de(p[1])+'</p><button class="spkbtn" data-life-say="'+de(p[0])+'" aria-label="朗读：'+de(p[0])+'">🔊 听这句</button></div>';}).join('')+'</div>';}

function lifeRender(){
 var list=lifeCards.filter(c=>(lifeFilter==='全部'||c.cat===lifeFilter)&&(!lifeQuery||[c.title,c.body,c.tip,c.cat,JSON.stringify(lifePhrases[c.id])].join(' ').includes(lifeQuery)));
 document.getElementById('life-count').textContent='已了解 '+lifeRead.length+' / '+lifeCards.length+' 条 · 标记保存在当前浏览器';
 document.getElementById('life-storage-warning').textContent=lifeStorageWarning;
 document.getElementById('life-list').innerHTML=list.length?list.map(c=>'<article class="learn-panel"><p class="learn-small">'+de(c.cat)+' · '+de(c.label)+'</p><h2>'+de(c.title)+'</h2><p>'+de(c.body)+'</p><p><b>你可以这样做：</b>'+de(c.tip)+'</p>'+lifePhraseHtml(c)+'<details><summary>查看参考说明</summary><p><a href="'+de(c.source[1])+'" target="_blank" rel="noopener noreferrer">'+de(c.source[0])+'</a></p><p class="learn-small">参考资料用于说明背景；当地及现场最新要求优先。</p></details><button style="margin-top:14px" class="spkbtn" data-life-read="'+c.id+'" aria-pressed="'+lifeRead.includes(c.id)+'">'+(lifeRead.includes(c.id)?'✓ 已了解':'标记为已了解')+'</button></article>').join(''):'<p class="learn-empty">没有找到相关条目，试试其他词，或切换到“全部”。</p>';
 app.querySelectorAll('[data-life-say]').forEach(b=>{b.onclick=function(){say(this.dataset.lifeSay);};});
 app.querySelectorAll('[data-life-read]').forEach(b=>{b.onclick=function(){var id=this.dataset.lifeRead,n=lifeRead.indexOf(id);if(n<0)lifeRead.push(id);else lifeRead.splice(n,1);try{localStorage.setItem(lifeKey,JSON.stringify(lifeRead));lifeStorageWarning='';}catch(e){lifeStorageWarning='浏览器未能保存阅读标记；关闭或刷新后可能丢失。';}this.textContent=lifeRead.includes(id)?'✓ 已了解':'标记为已了解';this.setAttribute('aria-pressed',lifeRead.includes(id));document.getElementById('life-count').textContent='已了解 '+lifeRead.length+' / '+lifeCards.length+' 条 · 标记保存在当前浏览器';document.getElementById('life-storage-warning').textContent=lifeStorageWarning;};});
}
var lifeOriginalHome=home;home=function(){lifeOriginalHome();var entry=document.createElement('section');entry.className='learn-panel';entry.innerHTML='<h2>🧭 日本生活规则与习惯</h2><p>扶梯与乘车、吸烟与垃圾、厕所、冰水、付款和住宿习惯。60条中文提醒，了解即可，不用考试。</p><button class="btn" id="life-open">看看出行前要知道的事 →</button>';var grid=app.querySelector('.grid');if(grid)grid.before(entry);else app.appendChild(entry);entry.querySelector('button').onclick=lifeGuide;};

var visitorQuestions=[{"id": "escalator", "prompt": "在大阪搭扶梯时，必须把另一侧让给赶路的人，自己也可以沿空侧走上去。", "answer": 1, "why": "左右站位是常见习惯，不是行走许可。应站稳扶好，按现场安全提示使用扶梯。"}, {"id": "boarding", "prompt": "电车到站后，应先让下车的人通过，再依次上车。", "answer": 0, "why": "先下后上，并从车门两侧排队等候，避免挡住下车通道。"}, {"id": "calls", "prompt": "只要小声说话，就可以在市内电车里一直打电话。", "answer": 1, "why": "市内电车一般要求避免通话；视频通话也一样。可以先发消息，方便时再回拨。"}, {"id": "eating", "prompt": "日本所有列车都一律禁止吃东西，包括长途列车上的便当。", "answer": 1, "why": "要区分拥挤的通勤电车与长途列车。留意车内标识，避免气味、洒漏和占用空间影响别人。"}, {"id": "seats", "prompt": "看起来年轻的人坐在优先席上，就一定没有需要，可以要求他离开。", "answer": 1, "why": "有些需求从外表看不出来，不要仅凭外表判断或质问他人。"}, {"id": "walking", "prompt": "日本所有车站楼梯、扶梯和街道，都统一要求靠左。", "answer": 1, "why": "不同通道可能有不同的箭头和分流方式，现场标识优先。"}, {"id": "smoking", "prompt": "在室外又随身带着烟灰缸，就可以边走边抽烟。", "answer": 1, "why": "室外不等于允许吸烟，携带烟灰缸也不能改变禁烟规定。应寻找指定吸烟区。"}, {"id": "trash", "prompt": "街上找不到垃圾桶时，先把垃圾收好带走，是合适的做法。", "answer": 0, "why": "公共垃圾桶可能较少，之后找到合适的垃圾桶再按分类处理。"}, {"id": "toilets", "prompt": "每一家便利店都必须免费向路人开放厕所。", "answer": 1, "why": "便利店不保证提供或开放厕所。可以先询问，也可查车站、商场或公厕地图。"}, {"id": "flush", "prompt": "日本厕所提供的厕纸通常可冲走，但湿巾和卫生用品不能照样冲进马桶。", "answer": 0, "why": "按照现场标识处理；冲水按钮与智能坐便器的清洗按钮也要分清。"}, {"id": "queue", "prompt": "看到收银柜台暂时没人，就可以绕过统一排队队伍直接付款。", "answer": 1, "why": "先看排队线，可能需要在同一队伍等候空闲柜台。"}, {"id": "photos", "prompt": "只要用的是手机，就不用遵守店铺或场馆的禁止拍摄标识。", "answer": 1, "why": "禁拍要求不会因为使用手机就失效；拍人物也应注意征求同意。"}, {"id": "water", "prompt": "餐厅默认给冰水时，可以礼貌地询问能否提供不加冰的水或热水。", "answer": 0, "why": "说明需求即可，能否提供由店铺实际情况决定。"}, {"id": "seat", "prompt": "餐厅里有一张空桌，就一定可以直接坐过去。", "answer": 1, "why": "空桌可能是预约席或尚未整理好，先等接待安排或确认能否入座。"}, {"id": "bill", "prompt": "日本餐厅的结账流程不同，有些在收银台结账，也有先付款的店。", "answer": 0, "why": "看入口和收银标识，不清楚时直接询问结账方式。"}, {"id": "tip", "prompt": "在一般餐厅或出租车，通常不用在账单之外额外付小费。", "answer": 0, "why": "没有必须付小费的惯例，不代表账单上列明的服务费可以不付。"}, {"id": "otoshi", "prompt": "没主动点的入座小菜，一定是免费赠送的。", "answer": 1, "why": "部分居酒屋的お通し通常收费。可在入座或点单前确认金额和能否不接受。"}, {"id": "takeaway", "prompt": "买了外带食品，就可以在任何商店的座位上吃。", "answer": 1, "why": "外带不代表可使用其他店铺座位。是否能在店内吃，应先确认。"}, {"id": "payment", "prompt": "去日本旅行，只带一种手机支付工具就能保证到处付款。", "answer": 1, "why": "不同店铺的支付范围不同，适量现金与可用银行卡能作为备选。"}, {"id": "mobile", "prompt": "店里有二维码，就表示一定支持微信支付和支付宝。", "answer": 1, "why": "不同支付工具互不等同，看具体标识并在消费前确认。"}, {"id": "tax", "prompt": "看到“税込”表示含税，但仍需要留意是否另有服务费或座位费说明。", "answer": 0, "why": "税与其他收费项目不同，确认最终金额最清楚。"}, {"id": "bags", "prompt": "需要购物袋或餐具时，可以主动向店员说明数量。", "answer": 0, "why": "袋子可能收费，餐具提供方式也因店铺而异，主动确认即可。"}, {"id": "shoes", "prompt": "进入日本任何室内场所，都必须脱鞋。", "answer": 1, "why": "住宅、部分旅馆或榻榻米场所常需要脱鞋，普通商场等并非如此。看门口提示。"}, {"id": "bath", "prompt": "进入公共浴池前，通常应先清洗身体并冲净泡沫。", "answer": 0, "why": "浴池主要用来泡浴，不是洗头搓澡的地方；具体使用规则看设施说明。"}];
var appMode=null,visitorState=null,visitorWarning='',visitorRecords={};
try{var vr=JSON.parse(localStorage.getItem('japan-visitor-progress:v1')||'{}');if(vr&&typeof vr==='object'&&!Array.isArray(vr))visitorRecords=vr;}catch(e){visitorWarning='阅读与练习仍可使用，但暂时无法读取游客进度。';}
function visitorSave(){try{localStorage.setItem('japan-visitor-progress:v1',JSON.stringify(visitorRecords));visitorWarning='';}catch(e){visitorWarning='浏览器未能保存本次游客进度，刷新后可能丢失。';}}
function modeNav(){return '<div class="learn-tabs"><button onclick="home()">本模式首页</button><button onclick="modeChoose()">切换模式</button></div>';}
var modeOriginalNav=learnNav;learnNav=function(){if(appMode==='visitor'){var old=document.getElementById('learn-navigation');if(old)old.remove();var n=document.createElement('div');n.id='learn-navigation';n.innerHTML=modeNav();app.insertBefore(n,app.firstChild);}else{modeOriginalNav();var nav=document.getElementById('learn-navigation');var b=document.createElement('button');b.className='spkbtn';b.textContent='切换模式';b.onclick=modeChoose;nav.appendChild(b);}};
var residentHome=home;
home=function(){if(appMode==='resident'){residentHome();var h=app.querySelector('h1');if(h)h.textContent='留学生・长期居住者模式';}else if(appMode==='visitor'){visitorHome();}else modeChoose();};
function modeChoose(){demoCancelSpeech();activeReview=null;visitorState=null;appMode=null;app.innerHTML='<h1>选择你的学习方式</h1><p class="lead">来日本短期旅行，或准备在这里生活？两种模式可以随时切换。</p><p><button class="btn ghost" onclick="tokyoHome()">🎮 返回游戏</button></p><section class="learn-panel"><h2>🧳 游客模式</h2><p>旅行常识判断＋基础会话。练习吃饭、坐车、入住和购物时怎么应对，答完看解释，不背孤立单词。</p><p class="learn-small">62道常识＋120道实用会话 · 每轮10题 · 常用句随时查</p><button class="btn" id="enter-visitor">进入游客模式 →</button></section><section class="learn-panel"><h2>🎓 留学生・长期居住者模式</h2><p>继续使用完整日语题库，练习看懂、听懂与实际表达。原来的收藏、错题本和学习进度都保留。</p><button class="btn" id="enter-resident">进入日语学习 →</button></section>';document.getElementById('enter-visitor').onclick=function(){appMode='visitor';home();};document.getElementById('enter-resident').onclick=function(){appMode='resident';home();};window.scrollTo(0,0);}
function visitorHome(){demoCancelSpeech();activeReview=null;visitorState=null;var done=visitorQuestions.filter(q=>visitorRecords[q.id]),wrong=visitorQuestions.filter(q=>visitorRecords[q.id]&&visitorRecords[q.id].ok===false);app.innerHTML='<h1>游客模式</h1><p class="lead">了解日本旅行中的规则和习惯。这里只练中文情境判断，日语例句可按需查阅，不要求背诵。</p><section class="learn-panel"><h2>旅行常识练习</h2><p>已练 '+done.length+' / '+visitorQuestions.length+' 题 · 待复习 '+wrong.length+' 题</p><p class="learn-small">每轮10题，优先选还没做过的。答错也没关系，重点是理解解释。</p><button class="btn" id="visitor-start">开始10题练习 →</button><button class="btn ghost" id="visitor-wrong" '+(!wrong.length?'disabled':'')+'>复习没理解的题（'+wrong.length+'）</button></section><section class="learn-panel"><h2>🧭 不做题，先看知识</h2><p>交通、厕所、吸烟、垃圾、餐饮、付款与住宿习惯；附现场可以使用的日语。</p><button class="btn ghost" id="visitor-guide">阅读生活指南 →</button></section><p class="learn-small">游客练习单独保存在当前浏览器，不影响日语学习成绩。换设备或浏览器不会同步。</p><p role="status">'+de(visitorWarning)+'</p>';learnNav();document.getElementById('visitor-start').onclick=function(){var fresh=shuf(visitorQuestions.filter(q=>!visitorRecords[q.id])),rest=shuf(visitorQuestions.filter(q=>visitorRecords[q.id]));visitorBegin(fresh.concat(rest).slice(0,10));};document.getElementById('visitor-wrong').onclick=function(){visitorBegin(shuf(wrong));};document.getElementById('visitor-guide').onclick=lifeGuide;window.scrollTo(0,0);}
function visitorBegin(list){if(!list.length)return;visitorState={list:list,index:0,correct:0,answered:false};visitorShow();}
function visitorShow(){var s=visitorState,q=s.list[s.index],c=lifeCards.find(c=>c.id===q.id);s.answered=false;app.innerHTML='<p class="lead">游客常识 · '+de(c.cat)+' · '+(s.index+1)+' / '+s.list.length+'</p><section class="learn-panel"><h2>'+de(q.prompt)+'</h2><p class="learn-small">判断这句话是否正确，不需要翻译日语。</p></section><div id="visitor-options"><button class="btn ghost" data-visitor-answer="0">正确</button><button class="btn ghost" data-visitor-answer="1">错误</button></div><div id="visitor-feedback" aria-live="polite"></div>';learnNav();app.querySelectorAll('[data-visitor-answer]').forEach(b=>b.onclick=function(){visitorAnswer(Number(this.dataset.visitorAnswer));});window.scrollTo(0,0);}
function visitorAnswer(a){var s=visitorState;if(!s||s.answered)return;s.answered=true;var q=s.list[s.index],c=lifeCards.find(c=>c.id===q.id),ok=a===q.answer;if(ok)s.correct++;var prev=visitorRecords[q.id];visitorRecords[q.id]={attempts:((prev&&Number(prev.attempts))||0)+1,ok:ok};visitorSave();app.querySelectorAll('[data-visitor-answer]').forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',Number(b.dataset.visitorAnswer)===a);});document.getElementById('visitor-feedback').innerHTML='<section class="learn-panel"><h2>'+(ok?'理解正确':'这条需要再留意')+'</h2><p><b>正确判断：'+(q.answer===0?'正确':'错误')+'</b></p><p>'+de(q.why)+'</p><p><b>实际怎么做：</b>'+de(c.tip)+'</p><details><summary>需要时查看日语说法</summary>'+lifePhraseHtml(c)+'</details><p class="learn-small">'+de(visitorWarning)+'</p></section><button class="btn" id="visitor-next">'+(s.index+1<s.list.length?'下一题 →':'查看本轮结果')+'</button>';app.querySelectorAll('[data-life-say]').forEach(b=>b.onclick=function(){say(this.dataset.lifeSay);});document.getElementById('visitor-next').onclick=function(){if(++s.index<s.list.length)visitorShow();else visitorEnd();};}
function visitorEnd(){var s=visitorState;app.innerHTML='<h1>这一轮了解完了</h1><section class="learn-panel"><h2>判断正确 '+s.correct+' / '+s.list.length+'</h2><p>这不是资格考试，不设通过线。没理解的内容已留在游客模式的复习列表，之后答对即可移出。</p><p class="learn-small">'+de(visitorWarning)+'</p></section><button class="btn" onclick="visitorHome()">回游客首页 →</button><button class="btn ghost" onclick="lifeGuide()">阅读完整知识指南</button>';learnNav();window.scrollTo(0,0);}

var visitorPractical=GAME_DATA.d["visitor/visitor-practical"];
visitorQuestions=visitorQuestions.concat(visitorPractical);
function visitorCategory(q){return q.cat||'旅行常识';}
function visitorRound(cat){var pool=visitorQuestions.filter(q=>cat==='全部'||visitorCategory(q)===cat),fresh=shuf(pool.filter(q=>!visitorRecords[q.id])),rest=shuf(pool.filter(q=>visitorRecords[q.id]));visitorBegin(fresh.concat(rest).slice(0,10));}
visitorHome=function(){demoCancelSpeech();activeReview=null;visitorState=null;var done=visitorQuestions.filter(q=>visitorRecords[q.id]),wrong=visitorQuestions.filter(q=>visitorRecords[q.id]&&visitorRecords[q.id].ok===false),cats=['旅行常识','基础开口','餐厅点餐','便利店购物','交通出行','酒店入住','逛街付款','问路求助','音乐与夜间娱乐'];app.innerHTML='<h1>游客模式</h1><p class="lead">懂规则，也会应对日常场景。先练最需要的内容，常用句可以直接查看和听读。</p><section class="learn-panel"><h2>旅行常识＋实用会话</h2><p>62道常识判断＋120道实用会话，共182题</p><p>已练 '+done.length+' / '+visitorQuestions.length+' 题 · 待复习 '+wrong.length+' 题</p><button class="btn" id="visitor-start">全部内容混合练习 · 10题 →</button><button class="btn ghost" id="visitor-wrong" '+(!wrong.length?'disabled':'')+'>复习没理解的题（'+wrong.length+'）</button></section><h2>按场景练习</h2><div class="grid">'+cats.map(cat=>'<button class="scene" data-vcat="'+de(cat)+'"><span><b>'+de(cat)+'</b><small>'+visitorQuestions.filter(q=>visitorCategory(q)===cat).length+'题 · '+(cat==='旅行常识'?'中文判断':'基础场景会话')+'</small></span></button>').join('')+'</div><section class="learn-panel"><h2>不做题，也能随时查</h2><button class="btn ghost" id="visitor-phrases">常用日语速查与朗读 →</button><button class="btn ghost" id="visitor-guide">日本生活规则与习惯 →</button></section><p class="learn-small">每轮最多10题，优先选没做过的。游客记录独立保存，不影响留学生模式；换浏览器或设备不会同步。</p><p role="status">'+de(visitorWarning)+'</p>';learnNav();document.getElementById('visitor-start').onclick=()=>visitorRound('全部');document.getElementById('visitor-wrong').onclick=()=>visitorBegin(shuf(wrong));document.getElementById('visitor-guide').onclick=lifeGuide;document.getElementById('visitor-phrases').onclick=()=>visitorPhrasebook('全部');app.querySelectorAll('[data-vcat]').forEach(b=>b.onclick=()=>visitorRound(b.dataset.vcat));window.scrollTo(0,0);};
function visitorPhrasebook(cat){var cats=['全部',...new Set(visitorPractical.map(q=>q.cat))],list=visitorPractical.filter(q=>cat==='全部'||q.cat===cat);app.innerHTML='<h1>游客常用句速查</h1><p class="lead">按场景找到一句就能用。日语附读音，点击按钮听读，不需要先答题。</p><label for="visitor-phrase-category">选择场景</label><select id="visitor-phrase-category" style="width:100%;padding:12px;margin:12px 0">'+cats.map(x=>'<option '+(cat===x?'selected':'')+'>'+de(x)+'</option>').join('')+'</select>'+list.map(q=>'<section class="learn-panel"><p class="learn-small">'+de(q.cat)+'</p><h2>'+de(q.prompt)+'</h2>'+explanationSections({text:q.why,examples:q.examples,source:q.source})+'</section>').join('');learnNav();document.getElementById('visitor-phrase-category').onchange=function(){visitorPhrasebook(this.value);};app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>say(b.dataset.t));window.scrollTo(0,0);}
visitorShow=function(){var s=visitorState,q=s.list[s.index];s.answered=false;s.options=q.options?shuf(q.options.map((t,i)=>({text:t,index:i}))):[{text:'正确',index:0},{text:'错误',index:1}];app.innerHTML='<p class="lead">游客模式 · '+de(visitorCategory(q))+' · '+(s.index+1)+' / '+s.list.length+'</p><section class="learn-panel"><h2>'+de(q.prompt)+'</h2>'+(q.jp?'<p lang="ja" style="font-size:1.2em;font-weight:bold">'+de(q.jp)+'</p><button class="spkbtn" id="visitor-listen">🔊 听这句话</button>':'')+'<p class="learn-small">'+(q.kind==='s'?'选择这种情况下可以说的句子。':q.kind==='r'?'听懂对方的意思，知道接下来怎么应对。':'判断这句话是否正确。')+'</p></section><div id="visitor-options">'+s.options.map(o=>'<button class="btn ghost" data-visitor-answer="'+o.index+'">'+de(o.text)+'</button>').join('')+'</div><div id="visitor-feedback" aria-live="polite"></div>';learnNav();app.querySelectorAll('[data-visitor-answer]').forEach(b=>b.onclick=()=>visitorAnswer(Number(b.dataset.visitorAnswer)));var listen=document.getElementById('visitor-listen');if(listen)listen.onclick=()=>say(q.jp);window.scrollTo(0,0);};
visitorAnswer=function(a){var s=visitorState;if(!s||s.answered||!s.options.some(o=>o.index===a))return;s.answered=true;var q=s.list[s.index],c=lifeCards.find(c=>c.id===q.id),ok=a===q.answer;if(ok)s.correct++;var prev=visitorRecords[q.id];visitorRecords[q.id]={attempts:((prev&&Number(prev.attempts))||0)+1,ok:ok};visitorSave();app.querySelectorAll('[data-visitor-answer]').forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',Number(b.dataset.visitorAnswer)===a);});document.getElementById('visitor-feedback').innerHTML='<section class="learn-panel"><h2>'+(ok?'理解正确':'这题再了解一下')+'</h2><p><b>正确答案：'+de(q.options?q.options[q.answer]:(q.answer===0?'正确':'错误'))+'</b></p>'+(q.options?explanationSections({text:q.why,examples:q.examples,source:q.source}):'<p>'+de(q.why)+'</p><p><b>实际怎么做：</b>'+de(c.tip)+'</p><details><summary>需要时查看日语说法</summary>'+lifePhraseHtml(c)+'</details>')+'<p class="learn-small">'+de(visitorWarning)+'</p></section><button class="btn" id="visitor-next">'+(s.index+1<s.list.length?'下一题 →':'查看本轮结果')+'</button>';app.querySelectorAll('[data-life-say],[data-t]').forEach(b=>b.onclick=()=>say(b.dataset.lifeSay||b.dataset.t));document.getElementById('visitor-next').onclick=function(){if(++s.index<s.list.length)visitorShow();else visitorEnd();};};

var touristWords=GAME_DATA.d["visitor/tourist-words"];
var wordFilter='全部',wordQuery='';
function visitorWords(){demoCancelSpeech();activeReview=null;wordFilter='全部';wordQuery='';app.innerHTML='<h1>游客常用单词</h1><p class="lead">'+touristWords.length+'个常用词，按场景查找。先认识，再看一句实际用法，不要求背诵。</p><label for="word-search">搜索日语、假名或中文</label><input type="search" id="word-search" placeholder="例如：便当、にくまん、车站" style="box-sizing:border-box;width:100%;padding:12px;border-radius:12px;margin:8px 0 16px"><label for="word-category">选择场景</label><select id="word-category" style="width:100%;padding:12px;margin:8px 0 16px">'+['全部',...new Set(touristWords.map(w=>w.cat))].map(c=>'<option>'+de(c)+'</option>').join('')+'</select><p id="word-count" class="learn-small"></p><div id="word-results"></div>';learnNav();document.getElementById('word-search').oninput=function(){wordQuery=this.value.trim();visitorWordsRender();};document.getElementById('word-category').onchange=function(){wordFilter=this.value;visitorWordsRender();};visitorWordsRender();window.scrollTo(0,0);}
function visitorWordsRender(){var list=touristWords.filter(w=>(wordFilter==='全部'||w.cat===wordFilter)&&(!wordQuery||[w.jp,w.kana,w.zh,w.ex,w.tr].join(' ').includes(wordQuery)));document.getElementById('word-count').textContent='找到 '+list.length+' / '+touristWords.length+' 个词';document.getElementById('word-results').innerHTML=list.length?list.map(w=>'<article class="learn-panel"><p class="learn-small">'+de(w.cat)+'</p><h2 lang="ja">'+de(w.jp)+'</h2><p lang="ja">'+de(w.kana)+'</p><p><b>'+de(w.zh)+'</b></p><button class="spkbtn" data-word-say="'+de(w.kana)+'">🔊 听单词</button><div class="explain-example" style="margin-top:16px"><p lang="ja">'+de(w.ex)+'</p><p class="explain-zh">'+de(w.tr)+'</p><button class="spkbtn" data-word-say="'+de(w.ex)+'">🔊 听例句</button></div></article>').join(''):'<p class="learn-empty">没有找到，试试其他关键词，或切换到“全部”。</p>';app.querySelectorAll('[data-word-say]').forEach(b=>b.onclick=()=>say(b.dataset.wordSay));}
var wordOriginalVisitorHome=visitorHome;visitorHome=function(){wordOriginalVisitorHome();var b=document.createElement('button');b.className='btn ghost';b.id='visitor-words';b.textContent='常用单词速查 · '+touristWords.length+'词 →';b.onclick=visitorWords;document.getElementById('visitor-phrases').before(b);};

visitorQuestions=visitorQuestions.concat(GAME_DATA.d["visitor/visitor-questions-more"]);
lifeCards=lifeCards.concat(GAME_DATA.d["visitor/life-phrases-more"]);
Object.assign(lifePhrases,{"visitor-rule-extra-0": [["この電車(でんしゃ)はこの駅(えき)に止まります(とまります)か？", "这趟电车在这个站停吗？"]], "visitor-rule-extra-1": [["私(わたし)の席(せき)はどこですか？", "我的座位在哪里？"]], "visitor-rule-extra-2": [["自由席(じゆうせき)は何号車(なんごうしゃ)ですか？", "自由席在几号车厢？"]], "visitor-rule-extra-3": [["このパスで乗れます(のれます)か？", "这张通票可以乘坐吗？"]], "visitor-rule-extra-4": [["乗り過ごして(のりすごして)しまいました。", "我坐过站了。"]], "visitor-rule-extra-5": [["乗り換え(のりかえ)で改札(かいさつ)を出ます(でます)か？", "换乘要出检票口吗？"]], "visitor-rule-extra-6": [["この時間(じかん)で乗り換え(のりかえ)に間に合います(まにあいます)か？", "这个时间还来得及换乘吗？"]], "visitor-rule-extra-7": [["新大阪駅(しんおおさかえき)へ行きたい(いきたい)です。", "我想去新大阪站。"]], "visitor-rule-extra-8": [["先(さき)に食券(しょっけん)を買えば(かえば)いいですか？", "要先买餐券吗？"]], "visitor-rule-extra-9": [["ラストオーダーは何時(なんじ)ですか？", "最后点单几点？"]], "visitor-rule-extra-10": [["替え玉(かえだま)をお願いします。", "请加一份面。"]], "visitor-rule-extra-11": [["おかわりは有料(ゆうりょう)ですか？", "续杯收费吗？"]], "visitor-rule-extra-12": [["これだけ温めて(あたためて)ください。", "请只加热这一份。"]], "visitor-rule-extra-13": [["どのボタンを押せば(おせば)いいですか？", "应该按哪个按钮？"]], "visitor-rule-extra-14": [["甘さ(あまさ)は変えられます(かえられます)か？", "可以调整甜度吗？"]], "visitor-rule-extra-15": [["別(べつ)の席(せき)を待って(まって)もいいですか？", "可以等别的座位吗？"]], "visitor-rule-extra-16": [["先(さき)に荷物(にもつ)を預けられます(あずけられます)か？", "可以先寄存行李吗？"]], "visitor-rule-extra-17": [["チェックアウトを延ばせます(のばせます)か？", "可以延迟退房吗？"]], "visitor-rule-extra-18": [["朝食(ちょうしょく)は含まれて(ふくまれて)いますか？", "包含早餐吗？"]], "visitor-rule-extra-19": [["タオルだけ交換(こうかん)してもらえますか？", "可以只更换毛巾吗？"]], "visitor-rule-extra-20": [["夕方(ゆうがた)まで預かって(あずかって)もらえますか？", "可以帮我保管到傍晚吗？"]], "visitor-rule-extra-21": [["スマホは持ち込めます(もちこめます)か？", "可以带手机进去吗？"]], "visitor-rule-extra-22": [["試着室(しちゃくしつ)はどこですか？", "试衣间在哪里？"]], "visitor-rule-extra-23": [["返品(へんぴん)の条件(じょうけん)を教えて(おしえて)ください。", "请告诉我退货条件。"]], "visitor-rule-extra-24": [["これも割引対象(わりびきたいしょう)ですか？", "这个也参加折扣吗？"]], "visitor-rule-extra-25": [["別々(べつべつ)の袋(ふくろ)に入れて(いれて)もらえますか？", "可以分别装进不同袋子吗？"]], "visitor-rule-extra-26": [["大きい(おおきい)ロッカーはありますか？", "有大寄存柜吗？"]], "visitor-rule-extra-27": [["おむつを替えられる(かえられる)場所(ばしょ)はありますか？", "有换尿布的地方吗？"]], "visitor-rule-extra-28": [["青い(あおい)かばんをなくしました。", "我丢了一个蓝色包。"]], "visitor-rule-extra-29": [["ここで止まって(とまって)も大丈夫(だいじょうぶ)ですか？", "可以在这里停一下吗？"]], "visitor-rule-extra-30": [["動画(どうが)も撮れます(とれます)か？", "也可以录像吗？"]], "visitor-rule-extra-31": [["ソフトドリンクでも大丈夫(だいじょうぶ)ですか？", "无酒精饮料也可以吗？"]], "visitor-rule-extra-32": [["開演(かいえん)は何時(なんじ)ですか？", "几点开始演出？"]], "visitor-rule-extra-33": [["再入場(さいにゅうじょう)はできますか？", "可以再次入场吗？"]], "visitor-rule-extra-34": [["何時(なんじ)まで使えます(つかえます)か？", "可以使用到几点？"]], "visitor-rule-extra-35": [["三十分(さんじゅっぷん)延長(えんちょう)できますか？", "可以延长三十分钟吗？"]]});
var visitorMorePractical=GAME_DATA.d["visitor/visitor-practical-more"];
visitorPractical=visitorPractical.concat(visitorMorePractical);visitorQuestions=visitorQuestions.concat(visitorMorePractical);
touristWords=touristWords.concat(GAME_DATA.d["visitor/tourist-words-more"]);
/* ==== engine/core/95-start.js ==== */
/* 【原版答题应用启动】 */
home();

/* ===== v4: 免税新规(2026-11-01)更新 ===== */
(function(){
 lifePhrases['taxfree-refund']=[['パスポートです。免税(めんぜい)をお願い(おねがい)します。','这是我的护照，请帮我办理免税。'],['免税(めんぜい)の手続き(てつづき)は、空港(くうこう)でするんですか？','免税手续是在机场办理吗？'],['これは免税(めんぜい)の対象(たいしょう)ですか？','这个属于免税对象吗？']];
 lifeCards.push({cat:'付款购物',id:'taxfree-refund',title:'免税：11月1日起改为“先付全价，离境退税”',label:'制度更新',
  body:'2026年11月1日起，游客免税购物改为退税方式：在店里出示护照并支付含税全价，离境时在机场通过海关终端办理后才退税。最低购买额门槛（税前5,000日元）不变，商品需在购买后90天内带出日本。',
  tip:'结账时说明要办理免税并出示护照。食品、化妆品等消耗品如果在日本境内用掉，就不能退税。具体操作以店铺和官方说明为准。',
  source:['日本政府观光局：免税购物新制度','https://www.japan.travel/en/ca/news/changes-are-coming-to-japans-tax-free-shopping/']});
 visitorQuestions.push(
  {id:'taxfree-refund',prompt:'2026年11月1日起，在日本购买免税商品时，仍然是在店里直接按不含税价格结账，不需要在机场再办手续。',answer:1,why:'自2026年11月1日起改为退税方式：在店里出示护照并先付含税全价，离境时在机场办理后才退税。'},
  {id:'taxfree-consumable',prompt:'打算办理免税的食品或化妆品等消耗品，如果在日本境内用掉了，就不能再办退税。',answer:0,why:'消耗品需要带出日本才符合免税条件。想办理的话，买来的东西先不要在日本吃掉或用掉。'});
 [{id:'tw-taxfree',cat:'购物用品',jp:'免税',kana:'めんぜい',zh:'免税（退税）',ex:'免税の手続きをお願いします。',tr:'请帮我办理免税手续。'},
  {id:'tw-passport',cat:'购物用品',jp:'パスポート',kana:'パスポート',zh:'护照',ex:'パスポートです。',tr:'这是我的护照。'}].forEach(function(w){if(!touristWords.some(function(x){return x.jp===w.jp}))touristWords.push(w)});
})();
