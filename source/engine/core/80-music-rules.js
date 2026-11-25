/* ==== engine/core/80-music-rules.js ==== */
/* 【音乐场所入场规则说明页】 */
function musicRules(){
 demoCancelSpeech();activeReview=null;
 app.innerHTML='<h1>听演出前，先懂这些规则</h1><p class="lead">酒吧・音乐・夜间娱乐｜不同场地、不同演出可能有不同要求。</p><button class="btn" id="music-go-top">开始随机练习 · 10题 →</button>'+musicRuleCards.map(function(c){return '<section class="learn-panel"><h2>'+de(c[0])+'</h2><p>'+de(c[1])+'</p><p lang="ja"><b>'+de(c[2])+'</b></p><p class="learn-small">'+de(c[3])+'</p><button class="spkbtn" data-music-say="'+de(c[2])+'">🔊 听这句</button></section>';}).join('')+'<section class="learn-panel"><h2>场地官方说明示例</h2><p><a href="https://shibuya-o.com/faq/" target="_blank" rel="noopener noreferrer">Spotify O：饮品费与拍摄规则</a></p><p><a href="https://www.bluenote.co.jp/jp/sp/faq/" target="_blank" rel="noopener noreferrer">Blue Note Tokyo：演出拍摄规定</a></p><p class="learn-small">这里只作规则示例，请再核对自己所购场次的公告。</p></section><button class="btn" id="music-rules-quiz">只练入场规则 · 8题 →</button><button class="btn ghost" id="music-go-bottom">全部夜间娱乐随机练习 →</button>';
 learnNav();document.getElementById('music-go-top').onclick=document.getElementById('music-go-bottom').onclick=function(){musicStartWithoutGuide('music');};
 document.getElementById('music-rules-quiz').onclick=function(){begin(shuf(Q.filter(q=>q.uid&&q.uid.indexOf('music-rules-v1:')===0)));};
 app.querySelectorAll('[data-music-say]').forEach(function(b){b.onclick=function(){say(b.dataset.musicSay);};});window.scrollTo(0,0);
}
