/* ==== engine/survival/97-death-rewind.js ==== */
/* ===================================================================
   【v22.2 死亡后回到最后一个选择】
   在剧情对话中死亡（疲劳点 / SAN 归零）时，可以直接回到死亡之前最后一个「有两个以上选项」的地方重新选，
   不必从场景开头再来。状态（疲劳点、SAN、时间、线索）恢复到那个选择之前。
   入境之夜（序章）的失败画面在 91-prologue.js 的 retryButtons；第一章酒店调查在这里。
   =================================================================== */
function offerRewind(){
 if(!campaign||!DM.canRewind(true))return;
 const panel=app.querySelector('.rpg-shell .rpg-panel');if(!panel||panel.querySelector('#death-rewind'))return;
 panel.insertAdjacentHTML('afterbegin','<div class="death-rewind"><p>你在调查中倒下了。</p><button type="button" class="survival-btn" id="death-rewind">↩ 回到最后一个选择（死亡之前）</button></div>');
 panel.querySelector('#death-rewind').onclick=()=>DM.rewind();
}
