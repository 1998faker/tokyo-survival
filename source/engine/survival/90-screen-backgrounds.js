/* ==== engine/survival/90-screen-backgrounds.js ==== */
/* ===================================================================
   画面背景图（V17）
   背景图登记在 config/assets.json，图片放在 assets/backgrounds/。
   构建时图片会被直接打包进 dist/index.html，所以上传 GitHub Pages 时不需要另外上传图片。
   这里只负责：根据当前画面，给 <body> 标上 data-bg="背景名"，样式由构建时自动生成。
   =================================================================== */
function setScreenBackground(keys){
 const have=(window.GAME_DATA&&GAME_DATA.backgrounds)||{};
 const key=(keys||[]).find(k=>k&&have[k]);
 if(key)document.body.dataset.bg=key;else delete document.body.dataset.bg;
}
window.setScreenBackground=setScreenBackground;
const bgMap=tokyoHome;
tokyoHome=function(){bgMap();setScreenBackground(['map'])};
const bgDistrict=renderDistrict;
renderDistrict=function(){bgDistrict();if(district)setScreenBackground(['district-'+district.id,'district'])};
const bgStory=storyQuest;
storyQuest=function(){bgStory();if(!campaign)return;if(document.querySelector('.h18-shell'))setScreenBackground(['chapter1','story-ch1','story']);else setScreenBackground(['story-ch'+((campaign.storyIndex||0)+1),'story'])};
const bgSetup=setupCampaign;
setupCampaign=function(){bgSetup();setScreenBackground(['title'])};
