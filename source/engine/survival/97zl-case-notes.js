/* ==== engine/survival/97zl-case-notes.js ==== */
/* Player-facing case notes. Never used to evaluate a report. */
const CASE_NOTES=(()=>{
 const types={
  direct:'本人证言',relay:'转述',record:'原始记录',object:'现场物证',lead:'个人印象',visit:'走访记录',other:'来源记录'
 };
 const records=new Set(['C01','C03','C05','C13','ST02','MT02','clientKnown']);
 const objects=new Set(['C08','C09','C10','C11','C12','M12','BR01','BR02','BR03','BR04','BR05','KT05','MT01']);
 const direct=new Set(['C02','C04','ST10','TN10','mori-concealment','inoue-D11','tanaka-D07','tanaka-D08','tanaka-D09','tanaka-D10','mori-D02','fightVerified','pushVerified','jobVerified','clientVerified']);
 const relay=new Set(['koba-D08']);
 const impressions=new Set(['sato-D04','koba-D06','inoue-D12','sato-D13']);
 const e05Acquisition=new Map(VERIFY.rules().filter(r=>['koba-D08','tanaka-D08'].includes(r.id)).map(r=>[r.source,r.id]));
 function sourceType(id){
  if(direct.has(id))return 'direct';
  if(relay.has(id))return 'relay';
  if(records.has(id))return 'record';
  if(objects.has(id))return 'object';
  if(impressions.has(id))return 'lead';
  if(typeof id==='string'&&id.startsWith('field-'))return 'visit';
  return 'other';
 }
 function sources(material){
  const list=Array.isArray(material.sources)?material.sources:[];
  if(material.id!=='E05')return list;
  // Older saves can contain only the acquisition note, without a separate verification row.
  return list.map(row=>row.id==='record'&&e05Acquisition.has(row.text)?{...row,id:e05Acquisition.get(row.text)}:row);
 }
 function sourceNote(material){
  if(material.id!=='E05')return '';
  const ids=new Set(sources(material).map(v=>v.id)),tanaka=ids.has('tanaka-D08')||ids.has('tanaka-D07');
  if(!ids.has('koba-D08'))return '';
  return tanaka?'同一段经过记有小林的转述，也记有田中本人对这件事的陈述。':'这段经过来自小林转述。手帐里还没有田中本人对这件事的陈述。';
 }
 function sourceTags(material){
  const kinds=new Set(sources(material).map(v=>sourceType(v.id)));
  return [...kinds].map(k=>'<span class="case-source-chip">'+esc(types[k])+'</span>').join('');
 }
 function sourceSummary(material){
  const tags=sourceTags(material),note=sourceNote(material);
  return tags||note?'<div class="case-source-summary">'+(tags?'<div class="case-source-tags" aria-label="来源类型">'+tags+'</div>':'')+(note?'<p class="case-source-note">'+esc(note)+'</p>':'')+'</div>':'';
 }
 function sourceRows(material){
  return sources(material).map(v=>'<p class="case-source-row"><span class="case-source-chip">'+esc(types[sourceType(v.id)])+'</span> <b>'+esc(v.name)+'</b> · '+esc(v.text)+'</p>').join('');
 }
 function agenda(c,x){
  const inv=c.investigation||{},flags=c.hotelCase?.v18?.flags||{},done=c.verify?.done||{};
  const has=id=>!!inv.clues?.[id]&&!inv.clues[id].taint,asked=id=>!!(done[id]||flags['vf:'+id]);
  const factsSeen=c.caseQuest?.factsSeen||{};
  const yesterday=x.facts.filter(t=>factsSeen[t]===c.day-1).slice(-3);
  for(const [id,row] of Object.entries(inv.clues||{})){if(CH1FIX.recordDay(row)===c.day-1)yesterday.push('新获线索：'+(INV.clues().find(x=>x.id===id)?.name||id))}
  for(const [id,row] of Object.entries(inv.evidence||{})){if(CH1FIX.recordDay(row)===c.day-1)yesterday.push('新获报告材料：'+(INV.evidence().find(x=>x.id===id)?.name||id))}
  const note=ROOMFILE.deathKnown(c)?'':DAHLIA.note();
  const objective=DAHLIA.objective(c);
  return {yesterday,questions:note?[note]:[],today:objective?[objective]:[]};
 }
 function agendaHtml(a){
  const rows=(title,items,empty)=>'<div><h4>'+title+'</h4>'+(items.length?'<ul>'+items.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'<p class="survival-tip">'+empty+'</p>')+'</div>';
  return '<div class="case-agenda">'+rows('昨天确认了什么',a.yesterday,'尚无可追溯到昨日的确认记录或新获证据；早期存档可能未记录取得日期。')+
   rows('还有什么没对上',a.questions,'当前手帐里暂无可并排核对的说法。')+rows('今天可以去哪里问',a.today,'查看现有调查记录。')+'</div>';
 }
 return {agenda,agendaHtml,sourceSummary,sourceRows};
})();

