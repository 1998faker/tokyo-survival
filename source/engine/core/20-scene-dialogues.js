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
