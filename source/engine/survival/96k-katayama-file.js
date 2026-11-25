/* ==== engine/survival/96k-katayama-file.js ==== */
/* ===================================================================
   【v23 档案页：207号室的住客（片山茂）】
   按调查进度逐条显示片山茂的资料（chapter.json 的 katayamaFile）。没查到的不显示；
   同一个 label 只显示最后一条符合条件的（例如「故乡」拿到更多证据后会被补全）。
   =================================================================== */
const KFILE=(function(){
 function inner(){
  if(!campaign||!campaign.hotelCase||!window.H18)return '';
  const K=((GAME_DATA.story.chapter1||{}).chapter||{}).katayamaFile;if(!K)return '';
  let ok=false;try{ok=H18.cond(K.when)}catch(e){ok=false}if(!ok)return '';
  const pickLast=list=>{let r=null;(list||[]).forEach(x=>{try{if(H18.cond(x.when))r=x}catch(e){}});return r};
  const st=pickLast(K.status);const rows=[],seen={};
  (K.rows||[]).forEach(x=>{let m=false;try{m=H18.cond(x.when)}catch(e){}if(m){if(seen[x.label]!=null)rows[seen[x.label]]=x;else{seen[x.label]=rows.length;rows.push(x)}}});
  const ghost=CASE_FACTS.read().concealment;
  /* v24.1：原来档案里单独的「住客记录 · 品川」并到这里 */
  const reg=ghost?`<p class="survival-tip et-ghost-row">住客登记簿 · 207　片山 茂　68岁　——「已退房」<br>这一行是你自己写上去的。</p>`:'';
  return `<div class="kf-card" id="file-katayama"><div class="et-file-no">207号室的住客</div><h3>🧳 ${esc(K.name||'')}</h3><p class="survival-tip">${esc(st?st.text:'')}</p>${rows.length?`<div class="et-grid kf-grid">${rows.map(r=>`<div><small>${esc(r.label)}</small><b>${esc(r.text)}</b></div>`).join('')}</div>`:'<p class="survival-tip">（还不知道更多。）</p>'}${reg}</div>`;
 }
 return {inner,html:inner};
})();
/* v24.1：由 94-investigation-files.js 的人物档案（FILE 02）直接调用 KFILE.inner() */
