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
