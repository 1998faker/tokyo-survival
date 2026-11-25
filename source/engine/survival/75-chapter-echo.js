/* ==== engine/survival/75-chapter-echo.js ==== */
/* ---------- 第一章选择对后续章节的影响 ---------- */
const h15StoryQuest=storyQuest;
storyQuest=function(){
 if(campaign&&campaign.storyIndex===3&&campaign.firstDayComplete&&storyReady()&&campaign.hotelEnding&&!campaign.hotelTanaka&&!campaign.ch4Found){
  app.innerHTML=`<div class="rpg-shell">${campaignHUD()}<section class="story-panel"><div class="story-meta">CHAPTER 04 · 第一章的回响</div><h1>找不到田中震</h1><p>${campaign.hotelClientKnown?'你知道委托人就是田中震，可调查局只肯代为转达，没有给你他的联系方式。第一章里你也没有找到那条「また今度な」的短信。':'第一章里你没有找到那条「また今度な」的短信，也就没有田中的联系方式。'}你只知道他在品川一带做夜班保安。</p><button class="story-btn" id="ch4-search">在品川的保安公司门口打听（消耗 1 次行动）</button><button class="story-btn" id="ch4-back">← 返回东京地图</button></section></div>`;
  app.querySelector('#ch4-back').onclick=tokyoHome;
  app.querySelector('#ch4-search').onclick=()=>{if(!spendAction('ch4'))return;campaign.ch4Found=true;campaign.storyClues.push('你在保安公司门口打听到了田中震的排班。');campaignSave();h15StoryQuest();h15Echo()};
  return;
 }
 h15StoryQuest();h15Echo();
};
function h15Echo(){
 if(!campaign||!campaign.hotelEnding)return;const panel=app.querySelector('.story-panel');if(!panel)return;
 const i=campaign.storyIndex;let t='';
 if(i===3){const tt=campaign.tanakaTrust??1;t=['田中在网上看到了老友的死讯和那些照片。他看你的眼神很冷：「你就是那个发帖的人？」','田中还不知道片山茂已经去世。由你来告诉他。','田中听说你帮过片山家，对你还算客气。','田中收到了调查局转来的信，见到你就鞠了一躬：「谢谢你替他把信寄出去。」','田中握着那张没寄出的明信片：「他到最后还在等我……这次，我不想再说下次了。」'][tt]||'';}
 if(i===4)t=campaign.hotelHometown?'你带着从酒店杂志架里找到的那封乡公所来信。信上的停运日期，就是下个月底。':'你只记得笔记本上一个模糊的地名。在车站问了好几个人，才找到去那个小镇的公交站牌。';
 if(i===5)t='第一章的选择：「'+(((GAME_DATA.story.chapter1.chapter.endings||{})[campaign.hotelEndingVariant||campaign.hotelEnding]||{}).title||'')+'」。片山茂的名字'+(campaign.hotelEndingVariant==='silence'?'仍然印在「空室」下面。':campaign.hotelEnding==='leave'?'只留在你的信封里。':'已经被人记住了。');
 if(t)panel.insertAdjacentHTML('afterbegin','<div class="story-clue">☾ 第一章的回响：'+esc(t)+'</div>');
}
const h15Night=nightlyClose;
nightlyClose=function(){h15Night();const meta=app.querySelector('.story-panel .story-meta');if(campaign&&campaign.hotelEnding&&meta&&/COMPLETE/.test(meta.textContent)){meta.parentNode.insertAdjacentHTML('beforeend','<div class="story-clue">片山茂的五个约定：'+(campaign.hotelEnding==='publish'?'他的名字曾在网上被转发了几万次，然后被遗忘。':campaign.hotelEnding==='leave'?'那只信封至今仍在你的行李箱底层。':'田中震最终去了他的故乡，在停运前的最后一班公交上坐了一程。')+'</div>')}};
