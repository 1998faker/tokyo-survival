/* ==== engine/survival/92-case-commission.js ==== */
/* ===================================================================
   【v22.4 CASE NO. 001：港屋酒店的委托（住宿费用由委托方承担）】
   - 序章 SCENE 03 收到委托邮件（羽田开局、播放序章或跳过序章时）→ campaign.caseCover=true。
     成田开局跳过第一章，不发这份委托（opening.json 里 "route": "haneda" 的页面不播放）。
   - 委托人（田中震）在第一章中段才揭晓（chapter1 节点 mori-case → case-reply，flag clientKnown）。
   - 住宿豁免：本案进行期间，每晚的生活费里免掉「房费」那一部分（config 的 day.nightlyLodgingCost），
     餐饮等其余部分照付。第一章结局确定（任何结局，包括超时）后恢复全额。
   =================================================================== */
function caseLodgingActive(c){c=c||campaign;return !!(c&&c.caseCover&&!c.hotelEnding&&!c.chapter1Skipped)}
function nightlyCost(){const d=GAME_CONFIG.day;return Math.max(0,(d.nightlyLivingCost||0)-(caseLodgingActive()?(d.nightlyLodgingCost||0):0))}
function caseClientKnown(){const v=campaign&&campaign.hotelCase&&campaign.hotelCase.v18;return !!(campaign&&(campaign.hotelClientKnown||(v&&v.flags&&v.flags.clientKnown)))}
/* 档案页：CASE NO. 001（委托摘要；揭晓之后补上委托人） */
function caseFile(){
 if(!campaign||!campaign.caseCover)return '';
 const K=(GAME_DATA.story.opening||{}).caseFile||{},rows=(K.rows||[]).slice();
 if(caseClientKnown())(K.revealed||[]).forEach(r=>rows.push(r));
 rows.push([K.lodgingLabel||'住宿费用',caseLodgingActive()?(K.lodgingOn||''):(K.lodgingOff||'')]);
 return `<section class="rpg-panel et-file" id="file-case"><div class="et-file-no">${esc(K.no||'CASE NO. 001')}</div><h2>📨 ${esc(K.title||'')}</h2><div class="et-grid">${rows.map(r=>`<div><small>${esc(r[0])}</small><b>${esc(r[1])}</b></div>`).join('')}</div>${K.note?`<p class="survival-tip">${esc(K.note)}</p>`:''}</section>`;
}
/* 旧存档：后续章节线索里的旧名字 */
if(campaign&&Array.isArray(campaign.storyClues)&&campaign.storyClues.some(t=>/田中正雄/.test(t))){campaign.storyClues=campaign.storyClues.map(t=>String(t).replace(/田中正雄/g,'田中震'));campaignSave()}
window.CASE={cost:nightlyCost,active:caseLodgingActive,clientKnown:caseClientKnown};
