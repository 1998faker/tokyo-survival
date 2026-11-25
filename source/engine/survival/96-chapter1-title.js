/* ==== engine/survival/96-chapter1-title.js ==== */
/* ===================================================================
   【v22.1 第一章标题《请跟我说说话好吗》的保护】
   这句话第一次完整出现，是第二次高潮（白色蛆虫）切黑之后的黑幕上。
   在那之前，所有界面（任务、存档摘要、酒店画面标题、入住按钮…）只显示「第一章」或「？？？」。
   标题文字：story/chapter1/chapter.json 的 title / titleHidden；main-chapters.json 第一章的 title 也会被这里遮住。
   =================================================================== */
function ch1Revealed(c){
 c=c||campaign;if(!c)return false;if(c.ch1TitleSeen||c.hotelEnding)return true;
 const v=c.hotelCase&&c.hotelCase.v18;if(!v)return false;
 if(v.flags&&v.flags.c2)return true;                             // 第二次高潮已经过去（旧存档迁移后也是这样）
 return !!(v.intro&&!v.ver);                                     // v22 以前的旧存档
}
function ch1Title(){const C=(GAME_DATA.story.chapter1||{}).chapter||{};return ch1Revealed()?(C.title||''):(C.titleHidden||'？？？')}
/* 主线列表里第一章的名字：揭题前显示「第一章｜？？？」 */
(function(){
 const ch=STORY&&STORY[0];if(!ch)return;const full=String(ch.title||'');
 try{Object.defineProperty(ch,'title',{configurable:true,enumerable:true,get(){return ch1Revealed()?full:(full.split('｜')[0]+'｜'+(((GAME_DATA.story.chapter1||{}).chapter||{}).titleHidden||'？？？'))}})}catch(e){}
})();
