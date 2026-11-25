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
