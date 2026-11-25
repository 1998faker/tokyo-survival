/* ==== engine/survival/98-language-protocol.js ==== */
/* ===================================================================
   【v22.3 语言辅助协议（LAP-01）】
   campaign.languageMode：'story' 剧情体验模式（日语原文 + 自动显示中文翻译，默认，旧存档也是它）
                          'learning' 日语学习模式（默认只显示日语原文，非答题的地方可以点「查看中文翻译」）
   在序章 SCENE 02 的身份认证里选择（93-opening.js），之后在「设置」里随时可以改。
   不影响：日语答题 / 听懂判定（题目页面不处理）、疲劳点、SAN、奖励、剧情分支、期限。
   剧情节点写 "lockTranslate": true 的地方（暗号、故意写错的日语、文字异常）两种模式都不显示翻译。
   不使用浏览器自动翻译（页面标了 translate="no" 的地方不会被翻）。
   =================================================================== */
function langMode(){return (campaign&&campaign.languageMode)||'story'}
function langLabel(m){const o=(((GAME_DATA.story.opening||{}).auth||{}).language||{}).options||[];const x=o.find(v=>v.id===(m||langMode()));return x?x.name+' / '+x.code:''}
/* 学习模式：一个「查看中文翻译」按钮，点开才显示 */
function trToggle(zh){return `<span class="tr-wrap"><button type="button" class="tr-btn">查看中文翻译</button><span class="tr-text" hidden>${esc(zh)}</span></span>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.tr-btn');if(!b)return;e.stopPropagation();e.preventDefault();const t=b.parentNode.querySelector('.tr-text');if(t){t.hidden=!t.hidden;b.textContent=t.hidden?'查看中文翻译':'隐藏翻译'}},true);
try{document.documentElement.setAttribute('translate','no')}catch(e){}
window.LANG={mode:langMode,label:langLabel};
