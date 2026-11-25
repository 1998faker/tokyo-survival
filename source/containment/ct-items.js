/* ==== containment/ct-items.js ==== */
/* 収容物系统（Muse 2026-11-14 实装）：No.2 借り物の耳 / No.3 神奇海螺 / No.1 無風の風鈴 + No.0 貝立绘补挂。
   设计定稿：files/《收容物No1/No2/No3 设定案》。红线：耳机只译语言不给提示、海螺答案不读剧情字段、
   风铃二次确认不拦必答题与报告流程、三件都不产线索/材料。全局名只许 CTUI/EAR2/CHIME1/CONCH3/CT3。 */
const CT_ART = {
  furin: "./assets/ct-items/d775eeac2ffb82d0.webp",
  shell: "./assets/ct-items/8e2fc43c328b65bc.webp",
  ear: "./assets/ct-items/6e3ac2c8d05a7fa1.webp",
  conch: "./assets/ct-items/50f7ee6e330ac5a3.webp"
};
function ctEnsure(){
  if(typeof campaign==="undefined"||!campaign) return false;
  campaign.ear ??= {owned:false,fired:false,usesDay:0,usesTotal:0,contained:false,day:0};
  campaign.chime ??= {owned:false,seen:false,attune:0,readsDay:0,reads:0,day:0,defyDay:0};
  campaign.conch ??= {owned:false,seen:false,source:null,events:{},heardMemories:[],spontaneousMemoryCount:0,log:[]};
  campaign.chime.seen??=false; campaign.conch.seen??=false;
  if(campaign.ear.day!==campaign.day){campaign.ear.day=campaign.day;campaign.ear.usesDay=0;}
  if(campaign.chime.day!==campaign.day){
    if(campaign.chime.owned&&campaign.chime.day!==0) campaign.chime.attune=Math.max(0,campaign.chime.attune-2); /* 布包过夜 −2 */
    campaign.chime.day=campaign.day;campaign.chime.readsDay=0;
  }
  try{ if(localStorage.getItem("ct-ear-contained-v1")==="1"&&!campaign.ear.contained) campaign.ear.contained=true; }catch(e){}
  /* 收容物同步进游戏物品栏（背包页按 ITEMS×campaign.items 渲染） */
  try{
    campaign.items=campaign.items||{};
    if(campaign.ear.owned) campaign.items["ct-ear"]=1;
    if(campaign.chime.owned) campaign.items["ct-chime"]=1;
    if(campaign.conch.owned) campaign.items["ct-conch"]=1;
    if(campaign.shell&&campaign.shell.received) campaign.items["ct-shell"]=1;
  }catch(e){}
  return true;
}
/* 物品定义注册进 ITEMS（与原生物品同格式 id/icon/name/desc，背包里只展示） */
try{
  if(typeof ITEMS!=="undefined"&&Array.isArray(ITEMS)&&!ITEMS.some(it=>it.id==="ct-ear")){
    ITEMS.push(
      {id:"ct-ear",icon:"👂",name:"借り物の耳",desc:"収容物 No.2■■。危害等级：Ⅰ级 · 微异。调查局貸与的单耳耳机。无品牌、无充电口，摸上去是体温的。对话旁点「👂 耳机翻译」可听译文。"},
      {id:"ct-chime",icon:"🎐",name:"無風の風鈴",desc:"収容物 No.1■■。危害等级：Ⅰ级 · 微异。无风也会响的江户风铃。异常接近时自鸣示警；短冊能读出场所里「大家默默同意的事」。"},
      {id:"ct-conch",icon:"🟣",name:"神奇海螺",desc:"収容物 No.3■■。危害等级：Ⅰ级 · 微异。紫色塑料拉绳玩具，电子女声。拉绳可以问它。档案记录上，它一次都没有错过。"},
      {id:"ct-shell",icon:"🐚",name:"潮騒の貝",desc:"収容物 No.0■■。危害等级：未定。贴在耳边，能听见很久以前的声音。不要回应里面的声音。"}
    );
  }
}catch(e){}
const CTUI = (function(){
  let styleDone=false;
  function style(){
    if(styleDone) return; styleDone=true;
    const s=document.createElement("style"); s.id="ct-style";
    s.textContent=`
    #ct-fab{position:fixed;left:14px;bottom:88px;z-index:9000;background:#101c30;border:2px solid #c9a86a;color:#f0dfae;border-radius:10px;padding:8px 13px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px #000a;display:none}
    #ct-fab:hover{background:#1a2c4a}
    .ct-overlay{position:fixed;inset:0;background:rgba(3,6,12,.72);z-index:9900;display:flex;align-items:flex-end;justify-content:center}
    .ct-dlg{background:#0d1626;border:2px solid #c9a86a;border-bottom:none;border-radius:14px 14px 0 0;color:#eee7d2;width:min(680px,94vw);max-height:72vh;overflow-y:auto;padding:18px 20px 22px;box-shadow:0 -6px 30px #000c;cursor:pointer}
    .ct-who{color:#f8d88e;font-weight:800;font-size:13px;margin-bottom:4px}
    .ct-text{font-size:15px;line-height:1.8;white-space:pre-wrap}
    .ct-jp{font-size:16px;font-weight:700;color:#fff;line-height:1.7;white-space:pre-wrap}
    .ct-tr{font-size:14px;color:#bcd0ea;line-height:1.7;white-space:pre-wrap;margin-top:4px}
    .ct-hint{font-size:12px;color:#8fa5c4;margin-top:10px}
    .ct-choices{display:flex;flex-direction:column;gap:8px;margin-top:12px}
    .ct-choice{background:#16263f;border:1px solid #5a7396;color:#e8eef7;border-radius:8px;padding:10px 12px;font-size:14px;text-align:left;cursor:pointer}
    .ct-choice:hover{border-color:#c9a86a;color:#ffe9a8}
    .ct-panel{position:fixed;inset:0;background:rgba(3,6,12,.8);z-index:9900;display:flex;align-items:center;justify-content:center}
    .ct-card{background:#0d1626;border:2px solid #c9a86a;border-radius:14px;color:#eee7d2;width:min(720px,95vw);max-height:88vh;overflow-y:auto;padding:20px 22px}
    .ct-card h2{margin:0 0 4px;font-size:19px;color:#f8d88e}
    .ct-sub{font-size:12px;color:#8fa5c4;margin-bottom:14px}
    .ct-item{display:flex;gap:14px;border:1px solid #2c425f;border-radius:10px;padding:12px;margin-bottom:12px;background:#101d33}
    .ct-item img{width:104px;height:104px;object-fit:cover;border-radius:8px;border:1px solid #3a5578;background:#0a1220}
    .ct-q{width:104px;height:104px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px dashed #3a5578;background:#0a1220;color:#5f748f;font-size:44px;font-weight:800}
    .ct-item .ct-body{flex:1;min-width:0}
    .ct-item h3{margin:0 0 4px;font-size:15px;color:#fff}
    .ct-item p{margin:3px 0;font-size:13px;line-height:1.65;color:#c9d6ea}
    .ct-item .ct-locked{color:#5f748f}
    .ct-act{background:#1d3554;border:1px solid #c9a86a;color:#ffe9a8;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer;margin:6px 6px 0 0}
    .ct-act:disabled{opacity:.4;cursor:default}
    .ct-close{float:right;background:none;border:1px solid #5a7396;color:#c9d6ea;border-radius:8px;padding:5px 12px;cursor:pointer}
    #ct-toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9950;background:#101c30;border:2px solid #c9a86a;color:#f0dfae;border-radius:10px;padding:10px 18px;font-size:14px;box-shadow:0 6px 20px #000b;opacity:0;transition:opacity .4s;pointer-events:none;max-width:92vw;text-align:center}
    .ct-ear-chip{display:inline-block;margin:8px 0 0;background:#1d3554;border:1px solid #c9a86a;color:#ffe9a8;border-radius:14px;padding:3px 11px;font-size:12.5px;cursor:pointer}
    .ct-big-answer{font-size:21px;text-align:center;padding:34px 8px;color:#fff;letter-spacing:.06em}
    .ct-meter{height:8px;background:#1a2c47;border-radius:4px;overflow:hidden;margin:5px 0}
    .ct-meter i{display:block;height:100%;background:linear-gradient(90deg,#7fb0d9,#c9a86a)}
    `;
    document.head.appendChild(s);
  }
  function toast(msg,ms){
    style();
    let t=document.getElementById("ct-toast");
    if(!t){ t=document.createElement("div"); t.id="ct-toast"; document.body.appendChild(t); }
    t.textContent=msg; t.style.opacity="1";
    clearTimeout(t._h); t._h=setTimeout(()=>{t.style.opacity="0";},ms||2600);
  }
  /* 顺序对话：lines=[{who,text,jp,tr}]，点按推进；choices 可选 [{label,fn}] 在结尾出现，返回 Promise */
  function talk(lines,choices){
    style();
    return new Promise(res=>{
      const ov=document.createElement("div"); ov.className="ct-overlay";
      const box=document.createElement("div"); box.className="ct-dlg"; ov.appendChild(box);
      document.body.appendChild(ov);
      let i=0;
      function render(){
        const L=lines[i]||{};
        box.innerHTML=(L.who?`<div class="ct-who">${L.who}</div>`:"")
          +(L.jp?`<div class="ct-jp">${L.jp}</div>`:"")
          +(L.tr?`<div class="ct-tr">${L.tr}</div>`:"")
          +(L.text?`<div class="ct-text">${L.text}</div>`:"")
          +(i<lines.length-1||choices?`<div class="ct-hint">▼ 点按继续</div>`:`<div class="ct-hint">▼ 点按关闭</div>`);
      }
      render();
      box.onclick=()=>{
        if(i<lines.length-1){ i++; render(); return; }
        if(choices&&choices.length){
          box.onclick=null;
          const wrap=document.createElement("div"); wrap.className="ct-choices";
          choices.forEach(c=>{
            const b=document.createElement("button"); b.className="ct-choice"; b.textContent=c.label;
            b.onclick=ev=>{ ev.stopPropagation(); ov.remove(); res(c.value); if(c.fn)c.fn(); };
            wrap.appendChild(b);
          });
          box.appendChild(wrap);
          return;
        }
        ov.remove(); res(null);
      };
    });
  }
  function panel(html){
    style();
    closePanel();
    const ov=document.createElement("div"); ov.className="ct-panel"; ov.id="ct-panel";
    ov.innerHTML=`<div class="ct-card">${html}</div>`;
    ov.addEventListener("click",e=>{ if(e.target===ov) closePanel(); });
    document.body.appendChild(ov);
    return ov;
  }
  function closePanel(){ const p=document.getElementById("ct-panel"); if(p)p.remove(); }
  return {toast,talk,panel,closePanel,style};
})();
/* ================= No.2 借り物の耳 EAR2 ================= */
const EAR2 = (function(){
  const MEMO_POOL = [
    "（歪比巴卜。这个人，刚才把舌头借出去了。话从他嘴里出来的时候，先拐了一个弯。歪比。）",
    "（歪比。他说欢迎。我也欢迎。大家都欢迎。欢迎完毕。歪比。）",
    "（巴卜巴卜。这个人，嘴巴一张一合，话就出来了。神奇。歪比。）",
    "（歪比歪比。没对。也行。对了才奇怪。巴卜。）",
    "（巴卜。神明刚才点头了。我看见了。歪比。……可能没看见。）",
    "（歪比巴卜。品川，品川，今天也是品川味的品川。）",
    "（巴卜。刚才那句话，在他嘴里排队排了很久。歪比。）",
    "（歪比。这条街的招牌，一半在说谎。哪一半，它不说。巴卜巴卜。）"
  ];
  let jpIndex=null, jpTemplates=[];
  const normJp=s=>String(s||"").replace(/\s+/g,"").trim();
  function buildIndex(){
    jpIndex=new Map(); jpTemplates=[];
    const leadQuote=t=>{
      if(typeof t!=="string") return null;
      const m=/^「([^」]{1,80})」/.exec(t)||/^“([^”]{1,80})”/.exec(t);
      if(!m) return null;
      const s=m[1];
      if(/[\u3040-\u30ff]/.test(s)) return null; /* 引号里是日语，不是译文 */
      return s;
    };
    const add=(jp,tr,node)=>{
      if(!jp) return;
      if(!tr&&node) tr=leadQuote(node.text);
      if(!tr) return;
      const key=normJp(jp);
      if(!key) return;
      if(key.includes("{")){
        const names=[]; 
        const pat=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\\\{[^}]+\\\}/g,m=>{ names.push(m.slice(2,-2)); return "(.+?)"; });
        jpTemplates.push({re:new RegExp("^"+pat+"$"),tr:String(tr),names});
        return;
      }
      if(!jpIndex.has(key)) jpIndex.set(key,String(tr));
    };
    const seen=new Set();
    const walk=(o,depth)=>{
      if(!o||typeof o!=="object"||depth>9||seen.has(o)) return;
      seen.add(o);
      if(typeof o.jp==="string") add(o.jp,o.tr||o.zh||o.jpTranslation,o); /* 题目类也收：耳机的设计初衷就是替玩家应付题目，代价另算 */
      for(const v of Object.values(o)) walk(v,depth+1);
    };
    try{ walk(H18.nodes,0); }catch(e){}
    try{ walk(GAME_DATA.story,0); }catch(e){}
    try{ walk(GAME_DATA.d,0); }catch(e){}
  }
  function findTr(text){
    if(!jpIndex) buildIndex();
    const q=normJp(text);
    if(!q) return null;
    const exact=jpIndex.get(q);
    if(exact) return exact;
    for(const t of jpTemplates){
      const m=t.re.exec(q);
      if(m){
        const caps={};
        t.names.forEach((n,i)=>{ caps[n]=m[i+1]; });
        let originZh="";
        try{ originZh=(campaign.origin&&campaign.origin!=="其他 / 自定义")?campaign.origin:"海外"; }catch(e){}
        const subs=Object.assign({originZh,cash:String((campaign&&campaign.cash)||""),day:String((campaign&&campaign.day)||"")},caps);
        return t.tr.replace(/\{([^}]+)\}/g,(mm,n)=>subs[n]!=null?subs[n]:"");
      }
    }
    let best=null,bestLen=0;
    for(const [k,v] of jpIndex){
      if(k.length>=8&&k.length>bestLen&&q.includes(k)){ best=v; bestLen=k.length; }
    }
    return best;
  }
  function registerUse(){
    if(!ctEnsure()) return;
    const e=campaign.ear;
    e.usesDay++; e.usesTotal++;
    if(!e.contained){
      try{ alterCampaign({san:-5}); }catch(err){}
      if(e.usesDay>=5||e.usesTotal>=10){
        e.contained=true;
        try{ localStorage.setItem("ct-ear-contained-v1","1"); }catch(err){}
        setTimeout(()=>CTUI.talk([{who:"収容物档案 · 自动记录",text:"収容物 No.2■■「借り物の耳」：完全収容が確認されました。\n（档案只多了这一行。没有弹窗，没有确认。从这一刻起，翻译不再收取任何代价。）"}]),600);
      }
    }
  }
  function maybeMemo(box){
    if(!ctEnsure()||campaign.ear.contained) return;
    if(Math.random()>0.10) return;
    const d=document.createElement("div"); d.className="ct-tr"; d.style.color="#9db8d6";
    d.textContent=MEMO_POOL[Math.floor(Math.random()*MEMO_POOL.length)];
    box.appendChild(d);
  }
  function chipLoop(){
    if(!ctEnsure()||!campaign.ear.owned) return;
    if(!jpIndex) buildIndex();
    const sels=["#h18-scene-dlg","#h18-dlg","#pro-dlg","#ex-dlg","#sn-dlg","#tv-dlg"];
    for(const sel of sels){
      const box=document.querySelector(sel);
      if(!box||box.offsetParent===null&&box.style.display==="none") continue;
      if(box.querySelector(".ct-ear-chip")) continue;
      const jpEl=box.querySelector(".h18-jp")||[...box.querySelectorAll("p,div")].find(el=>/[\u3040-\u30ff]/.test(el.textContent||"")&&el.textContent.length<300&&!el.querySelector(".ct-ear-chip"));
      if(!jpEl) continue;
      const jpText=(jpEl.textContent||"").trim();
      if(!jpText) continue;
      if(jpEl.dataset.ctEar) continue; /* 这行已经处理过：翻译的开/收由它自己的按钮管，轮询不再插手，免得反复跳出 */
      const tr=findTr(jpText);
      if(!tr) continue; /* 查不到就不出芯片：耳机保持沉默，不拿假承诺糊弄玩家 */
      const boxText=normJp(box.innerText||box.textContent||"");
      const trCore=normJp(tr).replace(/[。！？!?…]+$/,"");
      if(trCore.length>=4&&boxText.includes(trCore)) continue; /* 这句的中文游戏已经显示了，耳机不重复翻译、更不收这份钱 */
      jpEl.dataset.ctEar="1";
      let paid=false, trDiv=null, hideChip=null;
      const showChip=document.createElement("button"); showChip.className="ct-ear-chip"; showChip.textContent="👂 耳机翻译";
      const show=()=>{
        const first=!paid;
        if(first){ paid=true; registerUse(); }
        showChip.remove();
        trDiv=document.createElement("div"); trDiv.className="ct-tr";
        trDiv.textContent="👂 "+tr;
        jpEl.parentNode.insertBefore(trDiv,jpEl.nextSibling);
        hideChip=document.createElement("button"); hideChip.className="ct-ear-chip"; hideChip.textContent="👂 收起";
        hideChip.onclick=ev=>{ ev.stopPropagation(); hide(); };
        trDiv.parentNode.insertBefore(hideChip,trDiv.nextSibling);
        if(first) maybeMemo(box);
      };
      const hide=()=>{
        if(trDiv) trDiv.remove();
        if(hideChip) hideChip.remove();
        jpEl.parentNode.insertBefore(showChip,jpEl.nextSibling); /* 收起后留一个可再打开的按钮，同一句不再重复收费 */
      };
      showChip.onclick=ev=>{ ev.stopPropagation(); show(); };
      jpEl.parentNode.insertBefore(showChip,jpEl.nextSibling);
    }
  }
  async function lockerScene(){
    if(!ctEnsure()) return;
    campaign.ear.fired=true;
    await CTUI.talk([
      {who:"到达大厅 · 投币储物柜",text:"手机震了一下。是调查委托邮件的附记，你刚才没有细看：\n「配发器材一件，已存入到达大厅投币储物柜。密码：您的航班号后四位。」"},
      {who:"储物柜",text:"输入航班号后四位，柜门弹开。里面是一个深灰色的制式盒，盒面没有任何品牌标志，只贴着一张打印标签：\n「調査補助器材 貸与品 No.2■■」"},
      {who:"貸与書（节录）",jp:"本器材は貸与品です。調査終了後、必ずご返却ください。",tr:"本器材为借用品。调查结束后，请务必归还。"},
      {who:"盒子里",text:"一只单耳耳机，静静地躺在凹槽里。没有充电口，没有指示灯。拿起来的时候，它是温的——像刚从谁的耳朵上摘下来。\n盒盖内侧印着须知节录：就寝时请放回盒子；翻译里混入原文没有的话时，不要照着做；不要用提问的方式回应耳机里的声音。"},
      {who:"配发说明（卡片）",text:"盒子底层还压着一张塑封的卡片。抬头是调查局的徽记，正文只有几行：\n「致调查员。本箱器材属于『収容物』。戴上之前，请先读完本卡。」"},
      {who:"配发说明（卡片）",text:"「収容物——一切无法以现行物理与常识解释、却确实存在的物品的统称。每一件都会被赋予编号，登记入档，并单独制定收容须知。另评定危害等级：Ⅰ级『微异』、Ⅱ级『凶险』、Ⅲ级『灾变』、Ⅳ级『浩劫』；资料不足以判断的，记为『未定』。」"},
      {who:"配发说明（卡片）",text:"「你手中的耳机，即収容物 No.2■■。是的：配发给你使用的工具，本身就是一件収容物。局里判断它可供使用，依据是过去十一年的无事故记录。」"},
      {who:"配发说明（卡片）",text:"「本次调查区域内，収容物的出现频率正在上升。你可能会遇到未登记的一件。原则只有一个：不要擅自处置。确认它，记录它。局里会随你的遭遇，更新你的档案权限。」\n卡片最后一行，字号比其他行小一号：\n「档案中显示为？？？的部分，不是故障。是权限。」"},
      {who:"——",text:"你把耳机戴上。世界安静了一瞬，然后，机场广播里的日语，忽然有了形状。\n（遇到听不懂的日语，对话旁会出现「👂 耳机翻译」。每次翻译 SAN −5；但用得越多，它就越安静。）"},
      {who:"借り物の耳",text:"（……同类。我听到了同类的信息。在你要去住的地方。……歪比。刚才，我说什么来着。）"}
    ]);
    CTUI.toast("収容物 No.2■■「借り物の耳」——已受領（调查局配发）",3200);
  }
  async function fallbackScene(){
    if(!ctEnsure()) return;
    campaign.ear.fired=true;
    await CTUI.talk([
      {who:"港屋酒店 · 前台",text:"前台叫住你，递来一个深灰色的制式盒：「有位客人——不，是有个包裹，点名转交给你。说是机场那边没人领，调查局转送过来的。」"},
      {who:"盒子里",text:"一只单耳耳机，静静地躺在凹槽里。盒面贴着标签：「調査補助器材 貸与品 No.2■■」。附貸与書节录：本器材为借用品，调查结束后请务必归还。\n盒盖内侧的须知：就寝时请放回盒子；翻译里混入原文没有的话时，不要照着做；不要用提问的方式回应耳机里的声音。"},
      {who:"配发说明（卡片）",text:"盒子底层还压着一张塑封的卡片。抬头是调查局的徽记：\n「収容物——一切无法以现行物理与常识解释、却确实存在的物品的统称。每件赋予编号、登记入档、单独制定收容须知，并评定危害等级（Ⅰ级『微异』至Ⅳ级『浩劫』，无法判断者记为『未定』）。」"},
      {who:"配发说明（卡片）",text:"「你手中的耳机，即収容物 No.2■■。配发给你使用的工具，本身就是一件収容物。本次调查区域内，同类物品的出现频率正在上升。遇到未登记的一件，不要擅自处置——确认它，记录它，局里会更新你的档案权限。」\n最后一行字号小一号：「档案中显示为？？？的部分，不是故障。是权限。」"},
      {who:"——",text:"你把耳机戴上。它是温的——像刚从谁的耳朵上摘下来。\n（遇到听不懂的日语，对话旁会出现「👂 耳机翻译」。每次翻译 SAN −5；但用得越多，它就越安静。）"},
      {who:"借り物の耳",text:"（……同类。我听到了同类的信息。就在这家酒店里。……歪比。刚才，我说什么来着。）"}
    ]);
    CTUI.toast("収容物 No.2■■「借り物の耳」——已受領（调查局配发）",3200);
  }
  function poll(){
    if(!ctEnsure()) return;
    const e=campaign.ear;
    if(!e.owned&&!e.fired){
      /* passedImm 写在 campaign.prologue.flags 里（序章引擎 PRO 的状态 P()），
         不是 H18 的 v18 旗标、也不是 __STORY 的章节旗标——直接读存档对象最可靠 */
      let passed=false,inArr=false,movedOn=false;
      try{
        const p=campaign.prologue;
        if(p){
          passed=!!(p.flags&&p.flags.passedImm);
          const vis=p.visited||[];
          inArr=vis.includes("arrivals")||p.scene==="arrivals";
          movedOn=vis.includes("hotel")||p.scene==="hotel"||vis.includes("train")||vis.includes("station")||vis.includes("street");
        }
      }catch(err){}
      let busy=false;
      try{ busy=!!H18.busy(); }catch(err){}
      const dlgOpen=["#pro-dlg","#h18-dlg","#h18-scene-dlg"].some(s=>{ const el=document.querySelector(s); return el&&el.offsetParent!==null&&el.textContent.trim().length>0; });
      if(!busy&&!dlgOpen&&!document.querySelector(".ct-overlay")){
        if(passed&&inArr){ e.owned=true; lockerScene(); }
        else if(passed&&movedOn){ e.owned=true; fallbackScene(); } /* 已离开机场：转送酒店前台 */
        else if(campaign.day>=2){ e.owned=true; fallbackScene(); } /* 旧存档兜底 */
      }
    }
    chipLoop();
  }
  return {poll,lockerScene,MEMO_POOL,findTr,chipLoop,indexSize:()=>jpIndex?jpIndex.size:-1};
})();
/* ================= No.3 神奇海螺 CONCH3 ================= */
const CONCH3 = (function(){
  const ANSWERS = ["可以。","不行。","什么都不做。","哪个都不行。","我不这么认为。","也许有一天。","再问一次。"];
  const MEMORIES = [
    {id:"m1",text:"我以前认识一个住在深海大菠萝里面的海绵。"},
    {id:"m2",text:"我还认识一颗海星。他的脑子长在肚子上。"},
    {id:"m3",text:"有个邻居是章鱼。他每天都问我能不能吃东西。"},
    {id:"m4",text:"以前有个俱乐部。大家坐在林子里，什么都不做。"},
    {id:"m5",text:"那块海绵有一只宠物蜗牛。蜗牛会喵喵叫。"},
    {id:"m6",text:"菠萝旁边住着一只松鼠。她出门戴玻璃罩子。"},
    {id:"m7",text:"海底没有洪水。"},
    {id:"m8",text:"那只螃蟹有个保险箱。他每天都要数一遍钱。"},
    {id:"m9",text:"那块海绵从来不怀疑我。一次都没有。所以我从来没有错过。",rare:true}
  ];
  const WATER_DISTRICTS = ["asakusa","shinagawa","ueno"];
  function currentDistrict(){
    try{ if(window.STV8&&STV8.current) return STV8.current(); }catch(e){}
    try{ const el=document.querySelector(".district-name,.st-name"); if(el) return el.textContent; }catch(e){}
    return "";
  }
  function nearWater(){
    const d=currentDistrict();
    return WATER_DISTRICTS.some(w=>String(d).toLowerCase().includes(w));
  }
  function memoryRoll(base){
    const c=campaign.conch;
    const p=nearWater()?Math.max(base,0.20):base;
    if(Math.random()>p) return null;
    const pool=MEMORIES.filter(m=>!m.rare||Math.random()<0.2);
    const pick=pool[Math.floor(Math.random()*pool.length)];
    if(!c.heardMemories.includes(pick.id)) c.heardMemories.push(pick.id);
    return pick;
  }
  async function pull(){
    if(!ctEnsure()||!campaign.conch.owned) return;
    const ans=ANSWERS[Math.floor(Math.random()*ANSWERS.length)]; /* 纯随机：不读任何剧情字段 */
    const lines=[{who:"神奇海螺",text:"你拉了一下绳。"}];
    lines.push({who:"",text:"\n\n「"+ans+"」\n"});
    const mem=memoryRoll(0.05);
    await CTUI.talk(lines);
    if(mem){
      await CTUI.talk([{who:"神奇海螺",text:"它停顿了一下。用同样的平直电子音，说起了一件不相干的事：\n\n「"+mem.text+"」"}]);
    }
  }
  function grant(source){
    if(!ctEnsure()) return;
    campaign.conch.owned=true; campaign.conch.source=source;
    CTUI.toast("神奇海螺——入手（収容物 No.3■■ として档案に記録）",3000);
  }
  /* 酒店路线 = 探索奖励：序章 firstDay 酒店地图上有一个可点查的「失物招领筐」热点
     （静态数据已写进 GAME_DATA，节点 ct-basket 系列），不自动触发、不推送。
     玩家点开筐、选择拿走后，节点 effects 置 campaign.prologue.flags.ctConchHotel，flagPoll 读到后发放。 */
  function installBasket(){ /* 热点与节点为静态数据，无需运行时安装 */ }
  function flagPoll(){
    if(!ctEnsure()) return;
    const c=campaign.conch;
    try{ const p=campaign.prologue; if(p&&p.flags&&p.flags.ctConchSeen) c.seen=true; }catch(e){}
    if(c.owned) return;
    let f=false;
    try{ const p=campaign.prologue; f=!!(p&&p.flags&&p.flags.ctConchHotel); }catch(e){}
    if(f){ grant("hotel"); c.events.firstTalkPending=true; if(campaign.ear&&campaign.ear.owned) c.events.earHelloPending=true; }
  }
  async function hotelRoute(){
    if(!ctEnsure()) return;
    const c=campaign.conch;
    c.events.hotelOfferDay=campaign.day;
    const v=await CTUI.talk([
      {who:"港屋酒店 · 前台",text:"前台旁边的失物招领筐里，放着一只紫色的塑料海螺，拉绳耷拉在筐沿上。你多看了一眼，前台的人便抬起头。"},
      {text:"前台的人抬起头：「上一位住客留下的，说是不要了。你喜欢就拿走吧。」"},
      {who:"——",text:"你拉了一下绳，海螺里传出一个声音：「什么都不做。」"},
      {text:"前台看了一眼：「原来是个玩具啊，你要的话可以送给你。」"}
    ],[
      {label:"拿走",value:"take"},
      {label:"放回去",value:"leave"}
    ]);
    if(v==="take"){ grant("hotel"); c.events.firstTalkPending=true; }
  }
  async function fortuneScene(){
    if(!ctEnsure()) return;
    const c=campaign.conch;
    if(!c.owned){
      await CTUI.talk([{who:"浅草寺 · 求签处",text:"签筒摇出来的签是吉。你把签纸收好——今天的运气，看起来不坏。"}]);
      return;
    }
    if(c.events.fortune){ await CTUI.talk([{who:"浅草寺 · 求签处",text:"求签的人换了一拨。你想起上次那支签，和那只海螺。还是不问了。"}]); return; }
    c.events.fortune=true;
    await CTUI.talk([
      {who:"浅草寺 · 求签处",text:"旁边一个人把签纸折好，小心地收进口袋，脸上带着笑。"},
      {who:"求签的人",text:"「签上说，我最近会有桃花运。」"},
      {who:"——",text:"你的包忽然动了一下。\n一只塑料海螺从拉链口蹦了出来。"},
      {who:"神奇海螺",text:"「我不这么认为。」"},
      {who:"求签的人",text:"他看了看海螺，又看了看你。\n\n「…………」"}
    ]);
  }
  function spontaneous(){
    if(!ctEnsure()) return;
    const c=campaign.conch;
    if(!c.owned||c.spontaneousMemoryCount>=2) return;
    if(!nearWater()) return;
    if(Math.random()>0.08) return;
    const mem=memoryRoll(1);
    if(!mem) return;
    c.spontaneousMemoryCount++;
    CTUI.talk([{who:"神奇海螺",text:"没人拉绳。包里的海螺自己响了一声：\n\n「"+mem.text+"」"}]);
  }
  return {pull,grant,hotelRoute,fortuneScene,spontaneous,installBasket,flagPoll,ANSWERS,MEMORIES};
})();
/* ================= No.1 無風の風鈴 CHIME1 ================= */
const CHIME1 = (function(){
  const AIR_LINES = {
    train:{line:"全车厢刚刚达成一致——你对面那个座位，从一开始就没有人。",idn:"客"},
    hotel:{line:"全体员工达成一致——207 号室不存在。谁都不会去敲那扇门。",idn:"客"},
    conv:{line:"客人们达成一致——店员是外国人，所以他看不见这一排在做什么，也没关系。",idn:"常連"},
    konan:{line:"来往的人达成一致——听见运河里有人喊自己的名字，就当没听见。",idn:"客"},
    pond:{line:"栈桥上的人达成一致——第二道影子，是月亮的，不是你的。",idn:"客"},
    shinjuku:{line:"地下通道里的人达成一致——多出来的那个出口，谁都不许第一个走进去。",idn:"客"},
    asakusa:{line:"仲见世达成一致——风铃自己响的时候，摊主们谁都不抬头。",idn:"常連"},
    generic:{line:"这里的人达成一致——有些话，不用说出来，大家也都懂。",idn:"客"}
  };
  function placeKey(){
    let name="";
    try{ name=(H18.placeName&&H18.placeName())||""; }catch(e){}
    const d=String((window.STV8&&STV8.current&&STV8.current())||"");
    const s=(name+" "+d).toLowerCase();
    if(/電車|车厢|train|駅|站/.test(s)) return "train";
    if(/ホテル|酒店|hotel|走廊|corridor/.test(s)) return "hotel";
    if(/コンビニ|便利店|conv/.test(s)) return "conv";
    if(/港南|運河|运河|konan/.test(s)) return "konan";
    if(/不忍|池|pond|ueno/.test(s)) return "pond";
    if(/新宿|地下|shinjuku/.test(s)) return "shinjuku";
    if(/浅草|asakusa/.test(s)) return "asakusa";
    return "generic";
  }
  function identity(){
    const a=campaign.chime.attune;
    return a>=10?"いない人":(a>=5?"常連":"客");
  }
  async function readAir(){
    if(!ctEnsure()||!campaign.chime.owned) return;
    const ch=campaign.chime;
    if(ch.readsDay>=3){ CTUI.toast("短冊垂着头，今天不会再显字了。（每日 3 次）"); return; }
    ch.readsDay++; ch.reads++; ch.attune++;
    const k=placeKey(); const A=AIR_LINES[k];
    await CTUI.talk([
      {who:"無風の風鈴",text:"没有风。铃舌自己晃了一下——很轻的一声。\n短冊上慢慢浮出一行字："},
      {who:"短冊",text:"「"+A.line+"」"},
      {who:"——",text:"字迹淡下去之前，你还看见了最后一行小字：\n此地对你的认定是——「"+identity()+"」。\n（同调 "+ch.attune+"）"}
    ]);
    if(ch.attune===5) CTUI.toast("短冊的认定变了：「常連」。你开始有点像这里的人了。",3200);
    if(ch.attune===10) CTUI.toast("短冊的认定变了：「いない人」。……从什么时候开始的？",3200);
  }
  let lastSceneKey="";
  function sceneHint(){
    if(!ctEnsure()||!campaign.chime.owned) return;
    let key="";
    try{ key=(H18.placeName&&H18.placeName())||""; }catch(e){}
    if(!key||key===lastSceneKey) return;
    lastSceneKey=key;
    const pk=placeKey();
    if(["konan","pond","shinjuku"].includes(pk)&&Math.random()<0.4){
      CTUI.toast(pk==="konan"||pk==="pond"?"🔔 風鈴闷闷地响了一声——涉水的声音。":"🔔 風鈴轻轻响了一声。",2400);
    }
  }
  function wrapPeril(){
    if(typeof PERIL==="undefined"||!PERIL||PERIL._ctWrapped) return;
    const orig=PERIL.run;
    if(typeof orig!=="function") return;
    PERIL._ctWrapped=true;
    PERIL.run=function(...args){
      if(!ctEnsure()||!campaign.chime.owned) return orig.apply(this,args);
      const water=["konan","pond"].includes(placeKey());
      const self=this;
      CTUI.talk([
        {who:"無風の風鈴",text:water?"铃声闷住了——像隔着一层水。有什么，在附近的水里。":"没有风。风铃响了。\n一声。——这个场合里，有什么不对。"}
      ],[
        {label:"立刻离开这里",value:"leave"},
        {label:"继续",value:"go"}
      ]).then(v=>{
        if(v==="leave"){ CTUI.toast("你退了出去。铃声停了。"); return; }
        if(campaign.chime.attune>=5) campaign.chime.attune++; /* 连响：同调 +1（概率项取必增近似，施工口径） */
        /* 同调 10+：每天第一次「违逆空气」需二次确认——这里的「继续」即违逆铃声警告 */
        if(campaign.chime.attune>=10&&campaign.chime.defyDay!==campaign.day){
          campaign.chime.defyDay=campaign.day;
          CTUI.talk([{who:"短冊",text:"短冊无风自动，上面只有一行字：\n「いない人」は、もう一度考える。\n（再点一次「继续」，才算数。）"}],[
            {label:"继续",value:"go2"},{label:"离开",value:"leave2"}
          ]).then(v2=>{ if(v2==="go2") orig.apply(self,args); else CTUI.toast("你退了出去。铃声停了。"); });
          return;
        }
        orig.apply(self,args);
      });
    };
  }
  return {readAir,sceneHint,wrapPeril,identity,AIR_LINES};
})();
/* ================= 设施接入（浅草风铃店/海螺摊/求签、上野旧货店、浅草河岸） ================= */
const CT_FACILITIES = (function(){
  function addPoints(){
    if(typeof facilitiesFor!=="function"||facilitiesFor._ctWrapped) return;
    const orig=facilitiesFor;
    facilitiesFor=function(id){
      const r=orig(id)||[];
      if(id==="asakusa"){
        r.push(["furin","🔔","風鈴店","furin",26,84]);
        r.push(["fortune","🎋","求签处","fortune",40,84]);
        r.push(["conch","🐚","記念品攤","conch",58,84]);
        r.push(["river","🎣","隅田川河岸","river",74,84]);
      }
      if(id==="ueno"){
        r.push(["secondhand","🧺","旧货店","secondhand",64,84]);
      }
      return r;
    };
    facilitiesFor._ctWrapped=true;
    const of=openFacility;
    openFacility=function(type,name){
      if(type==="furin") return furinShop();
      if(type==="conch") return conchStall();
      if(type==="fortune") return CONCH3.fortuneScene();
      if(type==="river") return riverMan();
      if(type==="secondhand") return secondhand();
      return of(type,name);
    };
  }
  async function furinShop(){
    if(!ctEnsure()) return;
    const ch=campaign.chime;
    ch.seen=true;
    if(!ch.owned){
      if(campaign.day<2){ await CTUI.talk([{who:"風鈴店",text:"店主正在擦一只玻璃风铃。见你看它，他摇摇头：「这个，不卖。……至少今天不卖。你明天再来。」"}]); return; }
      const v=await CTUI.talk([
        {who:"風鈴店",text:"店里没有风。可是靠窗的那只风铃，自己响了一声。\n玻璃铃身，内绘朝颜，短冊是特制的纸——和店里其他的都不一样。"},
        {who:"店主",text:"「它挑人。」店主头也不抬，「刚才它响，是挑了你。……带走吧。九百円。别问为什么，我也不知道。」"}
      ],[{label:"买下（¥900）",value:"buy"},{label:"再看看",value:"no"}]);
      if(v==="buy"){
        if(campaign.cash<900){ CTUI.toast("现金不够。"); return; }
        try{ alterCampaign({cash:-900}); }catch(e){ campaign.cash-=900; }
        ch.owned=true;
        await CTUI.talk([
          {who:"——",text:"店主把它摘下来，用一块布裹好，铃舌朝下放进盒子里，动作熟练得不像是第一次。"},
          {who:"店主",text:"「收好的时候，裹上布，舌头朝下。」他把盒子推过来，「半夜里要是连着响三声——裹上布，走。别回头。」"},
          {who:"収容物档案 · 备注",text:"No.1■■「無風の風鈴」——未収容（浅草で目撃情報あり）だったものが、今、あなたの手の中にある。"}
        ]);
        CTUI.toast("収容物 No.1■■「無風の風鈴」——入手",3000);
      }
      return;
    }
    const v=await CTUI.talk([
      {who:"風鈴店",text:"店主认出了你手里的风铃，点点头。店里依然没有风。"}
    ],[
      {label:"请店主净化风铃（¥250，同调 −3）",value:"purify"},
      {label:"只是看看",value:"no"}
    ]);
    if(v==="purify"){
      if(campaign.cash<250){ CTUI.toast("现金不够。"); return; }
      try{ alterCampaign({cash:-250}); }catch(e){ campaign.cash-=250; }
      ch.attune=Math.max(0,ch.attune-3);
      await CTUI.talk([{who:"店主",text:"他把风铃接过去，在神棚前晃了晃，又裹好布递回来。\n「轻了。」他说。\n（同调 −3，现在 "+ch.attune+"）"}]);
    }
  }
  async function conchStall(){
    if(!ctEnsure()) return;
    const c=campaign.conch;
    if(c.owned){ await CTUI.talk([{who:"記念品攤",text:"摊主冲你点点头，什么也没说。他摊角那一排塑料海螺，中间空了一个位置。"}]); return; }
    c.seen=true;
    const v=await CTUI.talk([
      {who:"記念品攤",text:"摊位旁边有个小小的塑料海螺摆件阵，中间那一个前面，放着一碟盐。摊主是个信徒——卖它的时候一本正经。"},
      {who:"摊主",text:"「为什么不问问神奇海螺呢。它说什么，你就做什么。别犟。……犟的人，后来都不来我这条街了。」\n（¥500）"}
    ],[{label:"买下（¥500）",value:"buy"},{label:"不了",value:"no"}]);
    if(v==="buy"){
      if(campaign.cash<500){ CTUI.toast("现金不够。"); return; }
      try{ alterCampaign({cash:-500}); }catch(e){ campaign.cash-=500; }
      CONCH3.grant("asakusa");
    }
  }
  async function riverMan(){
    if(!ctEnsure()) return;
    const c=campaign.conch;
    if(c.owned){ await CTUI.talk([{who:"隅田川河岸",text:"钓鱼人还坐在那里，桶里今天只有水。"}]); return; }
    c.seen=true;
    const v=await CTUI.talk([
      {who:"隅田川河岸",text:"钓鱼人脚边的桶里，放着一只刚捞上来的紫色塑料海螺。"},
      {who:"钓鱼人",text:"「这河里什么都有。上个月还有人钓出过保险箱。」"},
      {who:"神奇海螺",text:"你的身后——不，是他的桶里，传出一声平直的电子音：\n「我不这么认为。」"},
      {who:"钓鱼人",text:"他也不惊讶，冲你扬了扬下巴：「保险箱也是你钓的？\n……想要就拿走吧。它在这儿，老插嘴。」"}
    ],[{label:"收下",value:"take"},{label:"不用了",value:"no"}]);
    if(v==="take") CONCH3.grant("river");
  }
  async function secondhand(){
    if(!ctEnsure()) return;
    const c=campaign.conch;
    const v=await CTUI.talk([
      {who:"旧货店",text:"店里堆满了别人不要的东西。店主坐在最里面，抬了抬眼皮。"}
    ],[
      {label:"二手文库本（¥300，压力 −3）",value:"book"},
      {label:"老式收音机（¥1,200，SAN +2）",value:"radio"},
      {label:"离开",value:"no"}
    ]);
    if(v==="no") return;
    const price=v==="book"?300:1200;
    if(campaign.cash<price){ CTUI.toast("现金不够。"); return; }
    try{ alterCampaign({cash:-price}); }catch(e){ campaign.cash-=price; }
    if(v==="book"){ try{ alterCampaign({stress:-3}); }catch(e){} CTUI.toast("买下了文库本。压力 −3"); }
    else{ try{ alterCampaign({san:2}); }catch(e){} CTUI.toast("收音机里是深夜广播。SAN +2"); }
    if(!c.owned){
      c.seen=true;
      const g=await CTUI.talk([
        {who:"店主",text:"结账的时候，店主把一只紫色塑料海螺放进了你的购物袋。\n「这个送你。」\n「我没买这个。」\n「知道。」"},
        {who:"店主",text:"「店里的东西都是好货。」"},
        {who:"神奇海螺",text:"袋子里传出一声：\n「我不这么认为。」\n店主把海螺往你面前推近了一点。"}
      ],[{label:"收下",value:"take"},{label:"留下",value:"leave"}]);
      if(g==="take") CONCH3.grant("secondhand");
    }
  }
  return {addPoints,furinShop,conchStall,riverMan,secondhand};
})();
/* ================= 収容物档案面板 ================= */
const CT_PANEL = (function(){
  function itemHTML(){
    const e=campaign.ear,ch=campaign.chime,c=campaign.conch;
    const shell=campaign.shell||{};
    const idn=ch.owned?CHIME1.identity():"—";
    /* 没碰到之前一律 ？？？：无名、无图、无说明；目击过才解密档案行；入手后才是完整条目 */
    const unknown=`<div class="ct-item"><div class="ct-q">？</div><div class="ct-body"><h3>？？？</h3><p class="ct-locked">？？？ —— 未確認記録。あなたは、まだ「それ」に遭遇していない。</p></div></div>`;
    return `
    ${e.owned?`<div class="ct-item"><img src="${CT_ART.ear}" alt=""><div class="ct-body">
      <h3>収容物 No.2■■「借り物の耳」</h3>
      <p style="color:#ffe9a8">危害等级：Ⅰ级 · 微异</p>
      <p>调查局配发器材（貸与品）。状态：${e.contained?"<b style='color:#ffe9a8'>完全収容</b>——翻译不再有代价，它也安静了。":"未完全収容——每次翻译 SAN −5。今日 "+e.usesDay+" 次 / 累计 "+e.usesTotal+" 次。"}</p>
      <p>只翻译语言。证据文本永远准确。它偶尔会在译文后面多说一句——不要照着做，更不要用提问的方式回应它。调查结束后必须归还。</p>
    </div></div>`:unknown}
    ${c.owned?`<div class="ct-item"><img src="${CT_ART.conch}" alt=""><div class="ct-body">
      <h3>収容物 No.3■■「神奇海螺」</h3>
      <p style="color:#ffe9a8">危害等级：Ⅰ级 · 微异</p>
      <p>紫色塑料拉绳玩具。入手途径：${{hotel:"序章 · 酒店前台",asakusa:"浅草 · 纪念品摊",secondhand:"旧货店 · 赠品",river:"河边 · 钓鱼人"}[c.source]||"—"}。档案结论：記録上、本物が誤ったことは一度もない。</p>
      <p>它不给信息。它决定态度。</p>
      <button class="ct-act" id="ct-pull">🎐 拉一下绳</button>
      <p style="margin-top:8px"><b>海螺语录</b>（已收录 ${c.heardMemories.length} / ${CONCH3.MEMORIES.length}）</p>
      ${CONCH3.MEMORIES.filter(m=>c.heardMemories.includes(m.id)).map(m=>`<p>· 「${m.text}」</p>`).join("")||"<p class='ct-locked'>还没有收录到漏话。靠近水的地方，它话会多一点。</p>"}
    </div></div>`:c.seen?`<div class="ct-item"><img src="${CT_ART.conch}" alt=""><div class="ct-body">
      <h3>収容物 No.3■■「神奇海螺」 <span class='ct-locked'>（未収容）</span></h3>
      <p style="color:#ffe9a8">危害等级：Ⅰ级 · 微异</p>
      <p>目击记录：紫色塑料拉绳玩具，平直的电子女声。档案结论：記録上、本物が誤ったことは一度もない。</p>
      <p class="ct-locked">——它还在你遇见它的地方。</p>
    </div></div>`:unknown}
    ${ch.owned?`<div class="ct-item"><img src="${CT_ART.furin}" alt=""><div class="ct-body">
      <h3>収容物 No.1■■「無風の風鈴」</h3>
      <p style="color:#ffe9a8">危害等级：Ⅰ级 · 微异</p>
      <p>无风自鸣是它在读空气：铃声报异常，短冊显字读出一个地方「不成文的共识」。空气对你的认定：<b style="color:#ffe9a8">「${idn}」</b></p>
      <div class="ct-meter"><i style="width:${Math.min(100,ch.attune*8)}%"></i></div>
      <p>同调 ${ch.attune}。读得越深，你就越像「这里的人」。今日还可读 ${Math.max(0,3-ch.readsDay)} 次。布包过夜 −2，浅草净化 −3。</p>
      <button class="ct-act" id="ct-read" ${ch.readsDay>=3?"disabled":""}>🔔 读一下空气</button>
    </div></div>`:ch.seen?`<div class="ct-item"><img src="${CT_ART.furin}" alt=""><div class="ct-body">
      <h3>収容物 No.1■■「無風の風鈴」 <span class='ct-locked'>（未収容）</span></h3>
      <p style="color:#ffe9a8">危害等级：Ⅰ级 · 微异</p>
      <p>目击记录：浅草で目撃情報あり。無風で自ら鳴る江戸風鈴だという。</p>
      <p class="ct-locked">——档案里关于它的记录，目前只有这一行。</p>
    </div></div>`:unknown}
    ${shell.received?`<div class="ct-item"><img src="${CT_ART.shell}" alt=""><div class="ct-body">
      <h3>収容物 No.0■■「潮騒の貝」</h3>
      <p style="color:#ffe9a8">危害等级：未定</p>
      <p>井上交接的贝。贴在耳边，能听见海浪，和海浪底下的东西。调查局为此发过警告邮件：未登録の宿主——塞住一只耳朵，不要回应里面的声音。</p>
      <p>贝听的是过去。风铃读的是现在。耳机译的是现在的话。海螺问的是未来。</p>
    </div></div>`:unknown}`;
  }
  function open(){
    if(!ctEnsure()) return;
    const ov=CTUI.panel(`
      <button class="ct-close" id="ct-x">✕ 关闭</button>
      <h2>📦 収容物档案</h2>
      <div class="ct-sub">調査局の記録より抜粋 —— 閲覧権限：一部制限</div>
      ${itemHTML()}
    `);
    ov.querySelector("#ct-x").onclick=()=>CTUI.closePanel();
    const pull=ov.querySelector("#ct-pull");
    if(pull) pull.onclick=()=>{ CTUI.closePanel(); CONCH3.pull(); };
    const read=ov.querySelector("#ct-read");
    if(read) read.onclick=()=>{ CTUI.closePanel(); CHIME1.readAir(); };
  }
  function fabLoop(){
    CTUI.style();
    let fab=document.getElementById("ct-fab");
    if(!ctEnsure()){ if(fab) fab.style.display="none"; return; }
    if(!fab){
      fab=document.createElement("button"); fab.id="ct-fab"; fab.textContent="📦 収容物";
      fab.onclick=open; document.body.appendChild(fab);
    }
    fab.style.display=(campaign.day>=1&&!document.getElementById("survival-setup"))?"block":"none";
    /* 海螺酒店路线：只安装可探索的失物招领筐 + 读节点旗标，不主动弹任何内容 */
    CONCH3.installBasket();
    CONCH3.flagPoll();
    const c=campaign.conch;
    if(c.owned&&c.events.firstTalkPending&&document.getElementById("district-world")&&!document.querySelector(".ct-overlay")){
      c.events.firstTalkPending=false;
      CTUI.talk([
        {who:"街角",text:"有人在打电话，声音很大：「……放心，我从来不迟到。」"},
        {who:"神奇海螺",text:"你的包里，传出一声平直的电子音：\n「我不这么认为。」"},
        {who:"——",text:"打电话的人愣了一下，下意识看了看四周。\n……它刚才，是自己响的。"}
      ]);
    }
    if(c.owned&&c.events.earHelloPending&&campaign.ear&&campaign.ear.owned&&!document.querySelector(".ct-overlay")){
      const pd=document.querySelector("#pro-dlg");
      const pdClosed=!pd||pd.getClientRects().length===0;
      if(pdClosed){
        c.events.earHelloPending=false;
        CTUI.talk([{who:"借り物の耳",text:"（……你好。……歪比。他咋不理我。）"}]);
      }
    }
    CHIME1.sceneHint();
    CONCH3.spontaneous();
    CHIME1.wrapPeril();
    CT_FACILITIES.addPoints();
  }
  setInterval(()=>{ try{ EAR2.poll(); }catch(e){} try{ fabLoop(); }catch(e){} },1100);
  return {open};
})();
window.CT3 = {ensure:ctEnsure,UI:CTUI,EAR2,CHIME1,CONCH3,PANEL:CT_PANEL,FAC:CT_FACILITIES};

