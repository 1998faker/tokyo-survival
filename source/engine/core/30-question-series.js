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
