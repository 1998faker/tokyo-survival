/* ==== tut-bridge.js ==== */
/* 雨伞教学案接入第一章真推理系统（INV）：序章流程改道 + 旗标桥 + FAB。
   数据注册在 GAME_DATA 内：线索 U01–U05、推论 UD01/UD02、材料 UE01、verify npcs.aunt。
   V52PRO.tutorial() 已改道至 __TUTV.start()；INV_TUT 仅保留给跳过序章事件的 DAY 2 兜底。 */
const TUTV = (function(){
  const CLUE_BY_FLAG = { u1:"U01", u2:"U02", u3:"U03", u4:"U04", u5:"U05" };
  let hintShown = false, toastTimer = 0;

  function P(){ try { return (typeof campaign!=="undefined" && campaign && campaign.prologue) || null; } catch(e){ return null; } }
  function st(){ campaign.tutUmbrella ??= {}; return campaign.tutUmbrella; }
  function save(){ try { campaignSave(); } catch(e){} }
  function incidentActive(){
    const p = P();
    return !!(p && p.flags && p.flags.tutSeen && !p.flags.tutDone);
  }
  function toast(msg){
    let el = document.getElementById("tutv-toast");
    if(!el){
      el = document.createElement("div");
      el.id = "tutv-toast";
      el.style.cssText = "position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:9600;background:#101c30;border:2px solid #c9a86a;color:#f0dfae;border-radius:10px;padding:9px 16px;font-size:13.5px;font-weight:700;box-shadow:0 4px 14px #000a;max-width:86vw;text-align:center;pointer-events:none;opacity:0;transition:opacity .25s";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ el.style.opacity = "0"; }, 3400);
  }

  function start(){
    const p = P(); if(!p) return;
    const s = st();
    const first = !s.started;
    s.started = true;
    if(first && !p.flags.tutTime){
      p.flags.tutTime = true;
      try { PRO.advance(GAME_CONFIG.v52.tutorial.minutes); } catch(e){}
    }
    save();
    try { PRO.playNode("sx-konbini"); } catch(e){ console.error(e); }
  }

  function handlePresent(p, s){
    delete p.flags.uPresent;
    const deds = (window.INV && INV.state()) ? Object.keys(INV.state().deductions || {}) : [];
    const has = !s.verified && (deds.includes("UD01") || deds.includes("UD02"));
    if(has){
      s.verified = true;
      try { INV.grantEvidence("UE01", "推论求证（等烘干的夜班客人）"); } catch(e){}
      p.flags.uEv = true;
      save();
      toast("📁 报告材料已确认：洗衣房证言");
      try { PRO.playNode("sx-tut-witness"); } catch(e){ console.error(e); }
    } else {
      try { PRO.playNode("sx-tut-aunt-none"); } catch(e){ console.error(e); }
    }
  }

  function poll(){
    const p = P(); if(!p || !p.flags) return;
    const s = st();
    /* 线索旗标 → 真推理系统 */
    for(const f in CLUE_BY_FLAG){
      if(p.flags[f] && !s["g_" + f]){
        s["g_" + f] = true;
        const id = CLUE_BY_FLAG[f];
        let name = id;
        try {
          if(window.INV && INV.addClue(id)){
            const c = (INV.clues() || []).find(x => x.id === id);
            if(c) name = c.name;
            toast("📋 新线索已记录到调查手帐：" + name);
            if(!hintShown){
              hintShown = true;
              setTimeout(()=>toast("🧩 点右下角「推理」打开推理页，选两条线索点「分析」（每组首次分析 ¥500）"), 700);
            }
          }
        } catch(e){}
        save();
      }
    }
    /* 出示推论 */
    if(p.flags.uPresent) handlePresent(p, s);
    /* 完成回桥 */
    if(p.flags.tutDone && !s.done){
      s.done = true;
      campaign.invTutorial ??= {};
      campaign.invTutorial.done = true;
      save();
    }
    /* FAB 显隐 */
    const fab = document.getElementById("tutv-fab");
    if(fab) fab.style.display = incidentActive() ? "block" : "none";
    const back = document.getElementById("tutv-back");
    if(back){
      const onInvPage = !!document.querySelector("#et-back") && !!document.querySelector("[data-tab], .inv-slots, #inv-go");
      back.style.display = (onInvPage && !p.flags.tutDone && window.PRO && PRO.applies && PRO.applies()) ? "block" : "none";
    }
    /* 教学进行中藏起旧练习按钮，避免两套教学打架 */
    if(incidentActive()){
      for(const sel of ["#inv-tutorial", "#tut-practice"]){
        const b = document.querySelector(sel);
        if(b) b.style.display = "none";
      }
    }
  }

  function mount(){
    if(document.getElementById("tutv-fab")) return;
    const fab = document.createElement("button");
    fab.id = "tutv-fab"; fab.type = "button"; fab.textContent = "🧩 推理";
    fab.style.cssText = "position:fixed;right:14px;bottom:88px;z-index:9000;background:#101c30;border:2px solid #c9a86a;color:#f0dfae;border-radius:10px;padding:8px 13px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px #000a;display:none";
    fab.onclick = ()=>{ try { INV.page(); } catch(e){ console.error(e); } };
    document.body.appendChild(fab);
    const back = document.createElement("button");
    back.id = "tutv-back"; back.type = "button"; back.textContent = "← 回到雨夜";
    back.style.cssText = "position:fixed;right:14px;bottom:134px;z-index:9500;background:#101c30;border:2px solid #c9a86a;color:#f0dfae;border-radius:10px;padding:8px 13px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px #000a;display:none";
    back.onclick = ()=>{ try { PRO.resume(); } catch(e){ console.error(e); } };
    document.body.appendChild(back);
  }

  setInterval(()=>{ try { mount(); poll(); } catch(e){} }, 1100);
  return { start, _poll: poll, _state: st };
})();
window.__TUTV = TUTV;


const minatoyaData = {"floors":[{"name":"大堂与寄存处","grid":["###########","#F.N.E....#","#.a.......#","###.###T###","#W..#Peb.##","#8#.#..Ntf#","##..#e..ea#","#...#######","#Wa.#######","#uN......S#","###########"]},{"name":"206 客房层","grid":["###########","#oa..E....#","#N........#","##Y#####Y##","#..A###a1w#","#e.a###peO#","#.c.###.#i#","#####e#####","#.......NN#","#D......cS#","###########"]},{"name":"旧清洁库","grid":["###########","#.t2#..u#f#","#..C#e..eP#","##T###t####","##B##.....#","#PN.......#","#..a...Pp.#","#.j...NO9##","#......e#.#","#D.......S#","###########"]},{"name":"洗衣房","grid":["###########","#a...E...p#","#.........#","##Y#####.##","#e.V#O.cpq#","#W.e#..d.d#","#p..#.c.O.#","#####...###","#.......eY#","#D......PS#","###########"]},{"name":"员工休息室","grid":["###########","#...yOwc..#","#c.......K#","##P#####B##","#e.O#t=...#","#W.N#.c.tO#","#..W#P...W#","##.#####.##","#....+....#","#D.......S#","###########"]},{"name":"送餐回收区与客房镜廊","grid":["###########","#.a..E.y..#","#K.s....~t#","##W#####I##","#..W#pc3ut#","#cMO#..L..#","#f#O#t..tW#","##c########","#..s......#","#D.......S#","###########"]},{"name":"旧客房区","grid":["###########","#..r#...5W#","#O~M#m.w.O#","##H###tY###","##..#O...t#","#f#.#..mcq#","#p..#P...P#","##e###c.###","#........W#","#D......WS#","###########"]},{"name":"布草回收层","grid":["###########","#....E...p#","#W......t.#","##M###Y#.##","#e.g##i#tf#","#WWw#l#lOL#","#c.t#l##.W#","########l##","#....xq...#","#D.......S#","###########"]},{"name":"工程值班层","grid":["###########","#O.r#...X.#","#O~.#O.c.l#","##h#####.##","#p.c#t.c.p#","##B#####.##","#p.W#d9#..#","#e..#t###R#","#.........#","#D........#","###########"]},{"name":"封闭楼层交界","grid":["###########","#....U.S..#","#.........#","#####+#####","#.........#","#=...w....#","#.........#","##.#####.##","#.........#","#....D....#","###########"]},{"name":"早餐厅与后侧客房","grid":["###########","#..r#w#6t9#","#O~t#i#xnO#","##J##t#B###","#...#...=O#","#cp.#M..O=#","#c..#Oc..m#","##.###..tc#","#.........#","#D.......S#","###########"]},{"name":"旧自助洗衣层","grid":["###########","#....U...m#","#W........#","##M##m##Y##","#..b#.#eOu#","#.pl#t#cWi#","#O.W#.#tcq#","#####W#####","#.........#","#D.......S#","###########"]},{"name":"退房物品暂存层","grid":["###########","#.tr#...zt#","#l..#.~.#7#","##L###Z####","#l.d#d..td#","##B###.####","#l.c#t.c.d#","#i#.##.####","##......w##","#D.......S#","###########"]},{"name":"顶楼设备走廊","grid":["###########","#....U....#","#.........#","#####R#####","#O...S.vd9#","###########","#ttl4ut.lc#","#####G#####","#..p.~.tOd#","#D...d....#","###########"]},{"name":"停用客房区与顶层公共洗手间","grid":["###########","#..#..#k.##","#..#..#~~##","#!##!##Q~##","#.........#","#....=....#","#....=....#","##...=...##","##.......##","##...D...##","###########"]}],"monsters":{"1,3,1":{"name":"拖鞋团","kind":"N","stats":[16,11,1],"xp":3,"cash":500,"heal":0,"cells":[[1,3,1]]},"1,2,2":{"name":"蜷缩糖纸","kind":"a","stats":[12,9,0],"xp":2,"cash":0,"heal":0,"cells":[[1,2,2]]},"1,7,3":{"name":"空罐串","kind":"T","stats":[35,18,7],"xp":6,"cash":400,"heal":0,"cells":[[1,7,3]]},"1,1,4":{"name":"塑料袋团","kind":"W","stats":[52,15,1],"xp":4,"cash":0,"heal":0,"cells":[[1,1,4]]},"1,5,4":{"name":"湿纸被","kind":"P","stats":[47,18,2],"xp":5,"cash":0,"heal":0,"cells":[[1,5,4]]},"1,6,4":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":0,"heal":0,"cells":[[1,6,4]]},"1,7,5":{"name":"拖鞋团","kind":"N","stats":[16,11,1],"xp":3,"cash":0,"heal":0,"cells":[[1,7,5]]},"1,8,5":{"name":"易拉罐甲虫","kind":"t","stats":[42,23,8],"xp":8,"cash":0,"heal":6,"cells":[[1,8,5]]},"1,5,6":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":0,"heal":0,"cells":[[1,5,6]]},"1,8,6":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":0,"heal":0,"cells":[[1,8,6]]},"1,9,6":{"name":"蜷缩糖纸","kind":"a","stats":[12,9,0],"xp":2,"cash":0,"heal":0,"cells":[[1,9,6]]},"1,1,8":{"name":"塑料袋团","kind":"W","stats":[52,15,1],"xp":4,"cash":0,"heal":0,"cells":[[1,1,8]]},"1,2,8":{"name":"蜷缩糖纸","kind":"a","stats":[12,9,0],"xp":2,"cash":0,"heal":0,"cells":[[1,2,8]]},"1,2,9":{"name":"拖鞋团","kind":"N","stats":[16,11,1],"xp":3,"cash":0,"heal":0,"cells":[[1,2,9]]},"2,2,1":{"name":"蜷缩糖纸","kind":"a","stats":[12,9,0],"xp":2,"cash":0,"heal":0,"cells":[[2,2,1]]},"2,1,2":{"name":"拖鞋团","kind":"N","stats":[16,11,1],"xp":3,"cash":0,"heal":0,"cells":[[2,1,2]]},"2,7,4":{"name":"蜷缩糖纸","kind":"a","stats":[12,9,0],"xp":2,"cash":0,"heal":0,"cells":[[2,7,4]]},"2,1,5":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":120,"heal":0,"cells":[[2,1,5]]},"2,3,5":{"name":"蜷缩糖纸","kind":"a","stats":[12,9,0],"xp":2,"cash":0,"heal":0,"cells":[[2,3,5]]},"2,7,5":{"name":"纸尿布团","kind":"p","stats":[57,18,3],"xp":6,"cash":90,"heal":0,"cells":[[2,7,5]]},"2,8,5":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":0,"heal":0,"cells":[[2,8,5]]},"2,9,5":{"name":"牙刷壳刺球","kind":"O","stats":[21,26,4],"xp":5,"cash":0,"heal":6,"cells":[[2,9,5]]},"2,2,6":{"name":"外卖盒虫","kind":"c","stats":[31,21,5],"xp":5,"cash":0,"heal":0,"cells":[[2,2,6]]},"2,5,7":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":0,"heal":0,"cells":[[2,5,7]]},"2,8,8":{"name":"拖鞋团","kind":"N","stats":[16,11,1],"xp":3,"cash":0,"heal":0,"cells":[[2,8,8]]},"2,9,8":{"name":"拖鞋团","kind":"N","stats":[16,11,1],"xp":3,"cash":0,"heal":0,"cells":[[2,9,8]]},"2,8,9":{"name":"外卖盒虫","kind":"c","stats":[31,21,5],"xp":5,"cash":0,"heal":0,"cells":[[2,8,9]]},"3,2,1":{"name":"易拉罐甲虫","kind":"t","stats":[42,23,8],"xp":8,"cash":0,"heal":0,"cells":[[3,2,1]]},"3,5,2":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":0,"heal":0,"cells":[[3,5,2]]},"3,8,2":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":0,"heal":0,"cells":[[3,8,2]]},"3,9,2":{"name":"湿纸被","kind":"P","stats":[47,18,2],"xp":5,"cash":0,"heal":0,"cells":[[3,9,2]]},"3,2,3":{"name":"空罐串","kind":"T","stats":[35,18,7],"xp":6,"cash":400,"heal":0,"cells":[[3,2,3]]},"3,6,3":{"name":"易拉罐甲虫","kind":"t","stats":[42,23,8],"xp":8,"cash":0,"heal":0,"cells":[[3,6,3]]},"3,1,5":{"name":"湿纸被","kind":"P","stats":[47,18,2],"xp":5,"cash":0,"heal":0,"cells":[[3,1,5]]},"3,2,5":{"name":"拖鞋团","kind":"N","stats":[16,11,1],"xp":3,"cash":0,"heal":0,"cells":[[3,2,5]]},"3,3,6":{"name":"蜷缩糖纸","kind":"a","stats":[12,9,0],"xp":2,"cash":0,"heal":0,"cells":[[3,3,6]]},"3,7,6":{"name":"湿纸被","kind":"P","stats":[47,18,2],"xp":5,"cash":250,"heal":0,"cells":[[3,7,6]]},"3,8,6":{"name":"纸尿布团","kind":"p","stats":[57,18,3],"xp":6,"cash":90,"heal":0,"cells":[[3,8,6]]},"3,6,7":{"name":"拖鞋团","kind":"N","stats":[16,11,1],"xp":3,"cash":0,"heal":0,"cells":[[3,6,7]]},"3,7,7":{"name":"牙刷壳刺球","kind":"O","stats":[21,26,4],"xp":5,"cash":0,"heal":8,"cells":[[3,7,7]]},"3,7,8":{"name":"湿纸巾团","kind":"e","stats":[18,11,0],"xp":3,"cash":0,"heal":0,"cells":[[3,7,8]]},"4,1,1":{"name":"蜷缩糖纸","kind":"a","stats":[12,10,0],"xp":2,"cash":0,"heal":0,"cells":[[4,1,1]]},"4,9,1":{"name":"纸尿布团","kind":"p","stats":[57,20,3],"xp":6,"cash":0,"heal":0,"cells":[[4,9,1]]},"4,1,4":{"name":"湿纸巾团","kind":"e","stats":[18,12,0],"xp":3,"cash":0,"heal":0,"cells":[[4,1,4]]},"4,5,4":{"name":"牙刷壳刺球","kind":"O","stats":[21,29,4],"xp":5,"cash":0,"heal":0,"cells":[[4,5,4]]},"4,7,4":{"name":"外卖盒虫","kind":"c","stats":[31,24,5],"xp":5,"cash":0,"heal":0,"cells":[[4,7,4]]},"4,8,4":{"name":"纸尿布团","kind":"p","stats":[57,20,3],"xp":6,"cash":90,"heal":0,"cells":[[4,8,4]]},"4,1,5":{"name":"塑料袋团","kind":"W","stats":[52,17,1],"xp":4,"cash":0,"heal":6,"cells":[[4,1,5]]},"4,3,5":{"name":"湿纸巾团","kind":"e","stats":[18,12,0],"xp":3,"cash":0,"heal":0,"cells":[[4,3,5]]},"4,7,5":{"name":"厚叠湿纸被","kind":"d","stats":[75,24,3],"xp":8,"cash":280,"heal":0,"cells":[[4,7,5]]},"4,9,5":{"name":"厚叠湿纸被","kind":"d","stats":[75,24,3],"xp":8,"cash":0,"heal":0,"cells":[[4,9,5]]},"4,1,6":{"name":"纸尿布团","kind":"p","stats":[57,20,3],"xp":6,"cash":0,"heal":0,"cells":[[4,1,6]]},"4,6,6":{"name":"外卖盒虫","kind":"c","stats":[31,24,5],"xp":5,"cash":0,"heal":0,"cells":[[4,6,6]]},"4,8,6":{"name":"牙刷壳刺球","kind":"O","stats":[21,29,4],"xp":5,"cash":120,"heal":0,"cells":[[4,8,6]]},"4,8,8":{"name":"湿纸巾团","kind":"e","stats":[18,12,0],"xp":3,"cash":0,"heal":0,"cells":[[4,8,8]]},"4,8,9":{"name":"湿纸被","kind":"P","stats":[47,20,2],"xp":5,"cash":0,"heal":0,"cells":[[4,8,9]]},"5,5,1":{"name":"牙刷壳刺球","kind":"O","stats":[21,29,4],"xp":5,"cash":0,"heal":0,"cells":[[5,5,1]]},"5,7,1":{"name":"外卖盒虫","kind":"c","stats":[31,24,5],"xp":5,"cash":0,"heal":0,"cells":[[5,7,1]]},"5,1,2":{"name":"外卖盒虫","kind":"c","stats":[31,24,5],"xp":5,"cash":0,"heal":0,"cells":[[5,1,2]]},"5,2,3":{"name":"湿纸被","kind":"P","stats":[47,20,2],"xp":5,"cash":250,"heal":0,"cells":[[5,2,3]]},"5,1,4":{"name":"湿纸巾团","kind":"e","stats":[18,12,0],"xp":3,"cash":0,"heal":0,"cells":[[5,1,4]]},"5,3,4":{"name":"牙刷壳刺球","kind":"O","stats":[21,29,4],"xp":5,"cash":0,"heal":0,"cells":[[5,3,4]]},"5,5,4":{"name":"易拉罐甲虫","kind":"t","stats":[42,26,8],"xp":8,"cash":0,"heal":0,"cells":[[5,5,4]]},"5,1,5":{"name":"塑料袋团","kind":"W","stats":[52,17,1],"xp":4,"cash":0,"heal":6,"cells":[[5,1,5]]},"5,3,5":{"name":"拖鞋团","kind":"N","stats":[16,12,1],"xp":3,"cash":0,"heal":0,"cells":[[5,3,5]]},"5,6,5":{"name":"外卖盒虫","kind":"c","stats":[31,24,5],"xp":5,"cash":0,"heal":0,"cells":[[5,6,5]]},"5,8,5":{"name":"易拉罐甲虫","kind":"t","stats":[42,26,8],"xp":8,"cash":0,"heal":8,"cells":[[5,8,5]]},"5,9,5":{"name":"牙刷壳刺球","kind":"O","stats":[21,29,4],"xp":5,"cash":120,"heal":0,"cells":[[5,9,5]]},"5,3,6":{"name":"塑料袋团","kind":"W","stats":[52,17,1],"xp":4,"cash":0,"heal":0,"cells":[[5,3,6]]},"5,5,6":{"name":"湿纸被","kind":"P","stats":[47,20,2],"xp":5,"cash":0,"heal":0,"cells":[[5,5,6]]},"5,9,6":{"name":"塑料袋团","kind":"W","stats":[52,17,1],"xp":4,"cash":0,"heal":0,"cells":[[5,9,6]]},"6,2,1":{"name":"蜷缩糖纸","kind":"a","stats":[12,10,0],"xp":2,"cash":0,"heal":0,"cells":[[6,2,1]]},"6,9,2":{"name":"易拉罐甲虫","kind":"t","stats":[42,26,8],"xp":8,"cash":0,"heal":0,"cells":[[6,9,2]]},"6,2,3":{"name":"塑料袋团","kind":"W","stats":[52,17,1],"xp":4,"cash":0,"heal":0,"cells":[[6,2,3]]},"6,8,3":{"name":"镜人","kind":"I","stats":null,"xp":10,"cash":0,"heal":0,"cells":[[6,8,3],[6,8,2]]},"6,3,4":{"name":"塑料袋团","kind":"W","stats":[52,17,1],"xp":4,"cash":0,"heal":0,"cells":[[6,3,4]]},"6,5,4":{"name":"纸尿布团","kind":"p","stats":[57,20,3],"xp":6,"cash":0,"heal":0,"cells":[[6,5,4]]},"6,6,4":{"name":"外卖盒虫","kind":"c","stats":[31,24,5],"xp":5,"cash":0,"heal":0,"cells":[[6,6,4]]},"6,9,4":{"name":"易拉罐甲虫","kind":"t","stats":[42,26,8],"xp":8,"cash":0,"heal":0,"cells":[[6,9,4]]},"6,1,5":{"name":"外卖盒虫","kind":"c","stats":[31,24,5],"xp":5,"cash":100,"heal":0,"cells":[[6,1,5]]},"6,2,5":{"name":"杯面虫","kind":"M","stats":[23,22,3],"xp":5,"cash":220,"heal":0,"cells":[[6,2,5]]},"6,3,5":{"name":"牙刷壳刺球","kind":"O","stats":[21,29,4],"xp":5,"cash":0,"heal":0,"cells":[[6,3,5]]},"6,7,5":{"name":"碎瓶架","kind":"L","stats":[42,26,3],"xp":7,"cash":380,"heal":0,"cells":[[6,7,5]]},"6,3,6":{"name":"牙刷壳刺球","kind":"O","stats":[21,29,4],"xp":5,"cash":0,"heal":8,"cells":[[6,3,6]]},"6,5,6":{"name":"易拉罐甲虫","kind":"t","stats":[42,26,8],"xp":8,"cash":0,"heal":0,"cells":[[6,5,6]]},"6,8,6":{"name":"易拉罐甲虫","kind":"t","stats":[42,26,8],"xp":8,"cash":0,"heal":0,"cells":[[6,8,6]]},"6,9,6":{"name":"塑料袋团","kind":"W","stats":[52,17,1],"xp":4,"cash":0,"heal":0,"cells":[[6,9,6]]},"6,2,7":{"name":"外卖盒虫","kind":"c","stats":[31,24,5],"xp":5,"cash":0,"heal":0,"cells":[[6,2,7]]},"7,9,1":{"name":"塑料袋团","kind":"W","stats":[52,18,1],"xp":4,"cash":0,"heal":6,"cells":[[7,9,1]]},"7,1,2":{"name":"牙刷壳刺球","kind":"O","stats":[21,31,4],"xp":5,"cash":0,"heal":0,"cells":[[7,1,2]]},"7,3,2":{"name":"杯面虫","kind":"M","stats":[23,23,3],"xp":5,"cash":0,"heal":0,"cells":[[7,3,2]]},"7,5,2":{"name":"辣汤杯面虫","kind":"m","stats":[35,32,5],"xp":8,"cash":0,"heal":0,"cells":[[7,5,2]]},"7,9,2":{"name":"牙刷壳刺球","kind":"O","stats":[21,31,4],"xp":5,"cash":0,"heal":0,"cells":[[7,9,2]]},"7,2,3":{"name":"醉酒大叔","kind":"H","stats":[36,27,6],"xp":12,"cash":600,"heal":0,"cells":[[7,2,3],[7,2,2]]},"7,6,3":{"name":"易拉罐甲虫","kind":"t","stats":[42,27,8],"xp":8,"cash":0,"heal":0,"cells":[[7,6,3]]},"7,5,4":{"name":"牙刷壳刺球","kind":"O","stats":[21,31,4],"xp":5,"cash":0,"heal":0,"cells":[[7,5,4]]},"7,9,4":{"name":"易拉罐甲虫","kind":"t","stats":[42,27,8],"xp":8,"cash":0,"heal":0,"cells":[[7,9,4]]},"7,7,5":{"name":"辣汤杯面虫","kind":"m","stats":[35,32,5],"xp":8,"cash":260,"heal":0,"cells":[[7,7,5]]},"7,8,5":{"name":"外卖盒虫","kind":"c","stats":[31,25,5],"xp":5,"cash":100,"heal":0,"cells":[[7,8,5]]},"7,1,6":{"name":"纸尿布团","kind":"p","stats":[57,22,3],"xp":6,"cash":0,"heal":0,"cells":[[7,1,6]]},"7,5,6":{"name":"湿纸被","kind":"P","stats":[47,22,2],"xp":5,"cash":0,"heal":0,"cells":[[7,5,6]]},"7,9,6":{"name":"湿纸被","kind":"P","stats":[47,22,2],"xp":5,"cash":0,"heal":0,"cells":[[7,9,6]]},"7,2,7":{"name":"湿纸巾团","kind":"e","stats":[18,13,0],"xp":3,"cash":0,"heal":0,"cells":[[7,2,7]]},"7,6,7":{"name":"外卖盒虫","kind":"c","stats":[31,25,5],"xp":5,"cash":0,"heal":0,"cells":[[7,6,7]]},"7,9,8":{"name":"塑料袋团","kind":"W","stats":[52,18,1],"xp":4,"cash":0,"heal":0,"cells":[[7,9,8]]},"7,8,9":{"name":"塑料袋团","kind":"W","stats":[52,18,1],"xp":4,"cash":0,"heal":0,"cells":[[7,8,9]]},"8,9,1":{"name":"纸尿布团","kind":"p","stats":[57,22,3],"xp":6,"cash":0,"heal":0,"cells":[[8,9,1]]},"8,1,2":{"name":"塑料袋团","kind":"W","stats":[52,18,1],"xp":4,"cash":0,"heal":0,"cells":[[8,1,2]]},"8,8,2":{"name":"易拉罐甲虫","kind":"t","stats":[42,27,8],"xp":8,"cash":0,"heal":0,"cells":[[8,8,2]]},"8,2,3":{"name":"杯面虫","kind":"M","stats":[23,23,3],"xp":5,"cash":220,"heal":0,"cells":[[8,2,3]]},"8,1,4":{"name":"湿纸巾团","kind":"e","stats":[18,13,0],"xp":3,"cash":0,"heal":0,"cells":[[8,1,4]]},"8,8,4":{"name":"易拉罐甲虫","kind":"t","stats":[42,27,8],"xp":8,"cash":0,"heal":0,"cells":[[8,8,4]]},"8,1,5":{"name":"塑料袋团","kind":"W","stats":[52,18,1],"xp":4,"cash":0,"heal":6,"cells":[[8,1,5]]},"8,2,5":{"name":"塑料袋团","kind":"W","stats":[52,18,1],"xp":4,"cash":0,"heal":0,"cells":[[8,2,5]]},"8,5,5":{"name":"铝框碎瓶架","kind":"l","stats":[56,36,6],"xp":9,"cash":0,"heal":0,"cells":[[8,5,5]]},"8,7,5":{"name":"铝框碎瓶架","kind":"l","stats":[56,36,6],"xp":9,"cash":420,"heal":0,"cells":[[8,7,5]]},"8,8,5":{"name":"牙刷壳刺球","kind":"O","stats":[21,31,4],"xp":5,"cash":120,"heal":0,"cells":[[8,8,5]]},"8,9,5":{"name":"碎瓶架","kind":"L","stats":[42,27,3],"xp":7,"cash":0,"heal":0,"cells":[[8,9,5]]},"8,1,6":{"name":"外卖盒虫","kind":"c","stats":[31,25,5],"xp":5,"cash":0,"heal":0,"cells":[[8,1,6]]},"8,3,6":{"name":"易拉罐甲虫","kind":"t","stats":[42,27,8],"xp":8,"cash":0,"heal":0,"cells":[[8,3,6]]},"8,5,6":{"name":"铝框碎瓶架","kind":"l","stats":[56,36,6],"xp":9,"cash":0,"heal":0,"cells":[[8,5,6]]},"8,9,6":{"name":"塑料袋团","kind":"W","stats":[52,18,1],"xp":4,"cash":0,"heal":0,"cells":[[8,9,6]]},"8,8,7":{"name":"铝框碎瓶架","kind":"l","stats":[56,36,6],"xp":9,"cash":0,"heal":0,"cells":[[8,8,7]]},"9,1,1":{"name":"牙刷壳刺球","kind":"O","stats":[21,31,4],"xp":5,"cash":0,"heal":8,"cells":[[9,1,1]]},"9,1,2":{"name":"牙刷壳刺球","kind":"O","stats":[21,31,4],"xp":5,"cash":0,"heal":0,"cells":[[9,1,2]]},"9,5,2":{"name":"牙刷壳刺球","kind":"O","stats":[21,31,4],"xp":5,"cash":0,"heal":0,"cells":[[9,5,2]]},"9,7,2":{"name":"外卖盒虫","kind":"c","stats":[31,25,5],"xp":5,"cash":0,"heal":8,"cells":[[9,7,2]]},"9,9,2":{"name":"铝框碎瓶架","kind":"l","stats":[56,36,6],"xp":9,"cash":0,"heal":0,"cells":[[9,9,2]]},"9,2,3":{"name":"床底长手","kind":"h","stats":[42,31,6],"xp":7,"cash":380,"heal":0,"cells":[[9,2,3],[9,2,2]]},"9,1,4":{"name":"纸尿布团","kind":"p","stats":[57,22,3],"xp":6,"cash":0,"heal":0,"cells":[[9,1,4]]},"9,3,4":{"name":"外卖盒虫","kind":"c","stats":[31,25,5],"xp":5,"cash":0,"heal":0,"cells":[[9,3,4]]},"9,5,4":{"name":"易拉罐甲虫","kind":"t","stats":[42,27,8],"xp":8,"cash":0,"heal":0,"cells":[[9,5,4]]},"9,7,4":{"name":"外卖盒虫","kind":"c","stats":[31,25,5],"xp":5,"cash":0,"heal":0,"cells":[[9,7,4]]},"9,9,4":{"name":"纸尿布团","kind":"p","stats":[57,22,3],"xp":6,"cash":0,"heal":0,"cells":[[9,9,4]]},"9,1,6":{"name":"纸尿布团","kind":"p","stats":[57,22,3],"xp":6,"cash":0,"heal":8,"cells":[[9,1,6]]},"9,3,6":{"name":"塑料袋团","kind":"W","stats":[52,18,1],"xp":4,"cash":80,"heal":0,"cells":[[9,3,6]]},"9,5,6":{"name":"厚叠湿纸被","kind":"d","stats":[75,25,3],"xp":8,"cash":0,"heal":0,"cells":[[9,5,6]]},"9,1,7":{"name":"湿纸巾团","kind":"e","stats":[18,13,0],"xp":3,"cash":0,"heal":0,"cells":[[9,1,7]]},"9,5,7":{"name":"易拉罐甲虫","kind":"t","stats":[42,27,8],"xp":8,"cash":0,"heal":0,"cells":[[9,5,7]]},"11,8,1":{"name":"易拉罐甲虫","kind":"t","stats":[42,29,8],"xp":8,"cash":0,"heal":0,"cells":[[11,8,1]]},"11,1,2":{"name":"牙刷壳刺球","kind":"O","stats":[21,32,4],"xp":5,"cash":0,"heal":0,"cells":[[11,1,2]]},"11,3,2":{"name":"易拉罐甲虫","kind":"t","stats":[42,29,8],"xp":8,"cash":0,"heal":0,"cells":[[11,3,2]]},"11,9,2":{"name":"牙刷壳刺球","kind":"O","stats":[21,32,4],"xp":5,"cash":0,"heal":0,"cells":[[11,9,2]]},"11,2,3":{"name":"禁烟房里的小伙","kind":"J","stats":[26,40,9],"xp":12,"cash":450,"heal":0,"cells":[[11,2,3],[11,2,2]]},"11,5,3":{"name":"易拉罐甲虫","kind":"t","stats":[42,29,8],"xp":8,"cash":0,"heal":0,"cells":[[11,5,3]]},"11,9,4":{"name":"牙刷壳刺球","kind":"O","stats":[21,32,4],"xp":5,"cash":0,"heal":0,"cells":[[11,9,4]]},"11,1,5":{"name":"外卖盒虫","kind":"c","stats":[31,27,5],"xp":5,"cash":0,"heal":0,"cells":[[11,1,5]]},"11,2,5":{"name":"纸尿布团","kind":"p","stats":[57,23,3],"xp":6,"cash":90,"heal":0,"cells":[[11,2,5]]},"11,5,5":{"name":"杯面虫","kind":"M","stats":[23,25,3],"xp":5,"cash":220,"heal":0,"cells":[[11,5,5]]},"11,8,5":{"name":"牙刷壳刺球","kind":"O","stats":[21,32,4],"xp":5,"cash":0,"heal":0,"cells":[[11,8,5]]},"11,1,6":{"name":"外卖盒虫","kind":"c","stats":[31,27,5],"xp":5,"cash":0,"heal":0,"cells":[[11,1,6]]},"11,5,6":{"name":"牙刷壳刺球","kind":"O","stats":[21,32,4],"xp":5,"cash":0,"heal":0,"cells":[[11,5,6]]},"11,6,6":{"name":"外卖盒虫","kind":"c","stats":[31,27,5],"xp":5,"cash":0,"heal":0,"cells":[[11,6,6]]},"11,9,6":{"name":"辣汤杯面虫","kind":"m","stats":[35,34,5],"xp":8,"cash":0,"heal":0,"cells":[[11,9,6]]},"11,8,7":{"name":"易拉罐甲虫","kind":"t","stats":[42,29,8],"xp":8,"cash":0,"heal":0,"cells":[[11,8,7]]},"11,9,7":{"name":"外卖盒虫","kind":"c","stats":[31,27,5],"xp":5,"cash":0,"heal":0,"cells":[[11,9,7]]},"12,9,1":{"name":"辣汤杯面虫","kind":"m","stats":[35,34,5],"xp":8,"cash":0,"heal":0,"cells":[[12,9,1]]},"12,1,2":{"name":"塑料袋团","kind":"W","stats":[52,19,1],"xp":4,"cash":0,"heal":0,"cells":[[12,1,2]]},"12,2,3":{"name":"杯面虫","kind":"M","stats":[23,25,3],"xp":5,"cash":220,"heal":0,"cells":[[12,2,3]]},"12,5,3":{"name":"辣汤杯面虫","kind":"m","stats":[35,34,5],"xp":8,"cash":0,"heal":0,"cells":[[12,5,3]]},"12,7,4":{"name":"湿纸巾团","kind":"e","stats":[18,13,0],"xp":3,"cash":0,"heal":0,"cells":[[12,7,4]]},"12,8,4":{"name":"牙刷壳刺球","kind":"O","stats":[21,32,4],"xp":5,"cash":0,"heal":0,"cells":[[12,8,4]]},"12,2,5":{"name":"纸尿布团","kind":"p","stats":[57,23,3],"xp":6,"cash":90,"heal":0,"cells":[[12,2,5]]},"12,3,5":{"name":"铝框碎瓶架","kind":"l","stats":[56,38,6],"xp":9,"cash":0,"heal":0,"cells":[[12,3,5]]},"12,5,5":{"name":"易拉罐甲虫","kind":"t","stats":[42,29,8],"xp":8,"cash":0,"heal":0,"cells":[[12,5,5]]},"12,7,5":{"name":"外卖盒虫","kind":"c","stats":[31,27,5],"xp":5,"cash":0,"heal":8,"cells":[[12,7,5]]},"12,8,5":{"name":"塑料袋团","kind":"W","stats":[52,19,1],"xp":4,"cash":0,"heal":0,"cells":[[12,8,5]]},"12,1,6":{"name":"牙刷壳刺球","kind":"O","stats":[21,32,4],"xp":5,"cash":0,"heal":0,"cells":[[12,1,6]]},"12,3,6":{"name":"塑料袋团","kind":"W","stats":[52,19,1],"xp":4,"cash":0,"heal":8,"cells":[[12,3,6]]},"12,7,6":{"name":"易拉罐甲虫","kind":"t","stats":[42,29,8],"xp":8,"cash":0,"heal":0,"cells":[[12,7,6]]},"12,8,6":{"name":"外卖盒虫","kind":"c","stats":[31,27,5],"xp":5,"cash":0,"heal":0,"cells":[[12,8,6]]},"12,5,7":{"name":"塑料袋团","kind":"W","stats":[52,19,1],"xp":4,"cash":0,"heal":0,"cells":[[12,5,7]]},"13,2,1":{"name":"易拉罐甲虫","kind":"t","stats":[42,30,8],"xp":8,"cash":0,"heal":0,"cells":[[13,2,1]]},"13,9,1":{"name":"易拉罐甲虫","kind":"t","stats":[42,30,8],"xp":8,"cash":0,"heal":0,"cells":[[13,9,1]]},"13,1,2":{"name":"铝框碎瓶架","kind":"l","stats":[56,40,6],"xp":9,"cash":0,"heal":0,"cells":[[13,1,2]]},"13,2,3":{"name":"碎瓶架","kind":"L","stats":[42,30,3],"xp":7,"cash":380,"heal":0,"cells":[[13,2,3]]},"13,6,3":{"name":"异变的住客","kind":"Z","stats":[55,46,6],"xp":14,"cash":500,"heal":0,"cells":[[13,6,3],[13,6,2]]},"13,1,4":{"name":"铝框碎瓶架","kind":"l","stats":[56,40,6],"xp":9,"cash":0,"heal":0,"cells":[[13,1,4]]},"13,3,4":{"name":"厚叠湿纸被","kind":"d","stats":[75,28,3],"xp":8,"cash":0,"heal":0,"cells":[[13,3,4]]},"13,5,4":{"name":"厚叠湿纸被","kind":"d","stats":[75,28,3],"xp":8,"cash":0,"heal":0,"cells":[[13,5,4]]},"13,8,4":{"name":"易拉罐甲虫","kind":"t","stats":[42,30,8],"xp":8,"cash":0,"heal":8,"cells":[[13,8,4]]},"13,9,4":{"name":"厚叠湿纸被","kind":"d","stats":[75,28,3],"xp":8,"cash":0,"heal":0,"cells":[[13,9,4]]},"13,1,6":{"name":"铝框碎瓶架","kind":"l","stats":[56,40,6],"xp":9,"cash":0,"heal":0,"cells":[[13,1,6]]},"13,3,6":{"name":"外卖盒虫","kind":"c","stats":[31,28,5],"xp":5,"cash":0,"heal":0,"cells":[[13,3,6]]},"13,5,6":{"name":"易拉罐甲虫","kind":"t","stats":[42,30,8],"xp":8,"cash":0,"heal":0,"cells":[[13,5,6]]},"13,7,6":{"name":"外卖盒虫","kind":"c","stats":[31,28,5],"xp":5,"cash":100,"heal":0,"cells":[[13,7,6]]},"13,9,6":{"name":"厚叠湿纸被","kind":"d","stats":[75,28,3],"xp":8,"cash":0,"heal":0,"cells":[[13,9,6]]},"14,1,4":{"name":"牙刷壳刺球","kind":"O","stats":[21,34,4],"xp":5,"cash":0,"heal":0,"cells":[[14,1,4]]},"14,8,4":{"name":"厚叠湿纸被","kind":"d","stats":[75,28,3],"xp":8,"cash":0,"heal":0,"cells":[[14,8,4]]},"14,1,6":{"name":"易拉罐甲虫","kind":"t","stats":[42,30,8],"xp":8,"cash":0,"heal":0,"cells":[[14,1,6]]},"14,2,6":{"name":"易拉罐甲虫","kind":"t","stats":[42,30,8],"xp":8,"cash":0,"heal":0,"cells":[[14,2,6]]},"14,3,6":{"name":"铝框碎瓶架","kind":"l","stats":[56,40,6],"xp":9,"cash":0,"heal":0,"cells":[[14,3,6]]},"14,6,6":{"name":"易拉罐甲虫","kind":"t","stats":[42,30,8],"xp":8,"cash":0,"heal":0,"cells":[[14,6,6]]},"14,8,6":{"name":"铝框碎瓶架","kind":"l","stats":[56,40,6],"xp":9,"cash":0,"heal":0,"cells":[[14,8,6]]},"14,9,6":{"name":"外卖盒虫","kind":"c","stats":[31,28,5],"xp":5,"cash":0,"heal":0,"cells":[[14,9,6]]},"14,5,7":{"name":"满载清扫车","kind":"G","stats":[78,46,7],"xp":18,"cash":600,"heal":0,"cells":[[14,5,7],[14,5,8]]},"14,3,8":{"name":"纸尿布团","kind":"p","stats":[57,24,3],"xp":6,"cash":0,"heal":0,"cells":[[14,3,8]]},"14,7,8":{"name":"易拉罐甲虫","kind":"t","stats":[42,30,8],"xp":8,"cash":0,"heal":8,"cells":[[14,7,8]]},"14,8,8":{"name":"牙刷壳刺球","kind":"O","stats":[21,34,4],"xp":5,"cash":120,"heal":0,"cells":[[14,8,8]]},"14,9,8":{"name":"厚叠湿纸被","kind":"d","stats":[75,28,3],"xp":8,"cash":0,"heal":0,"cells":[[14,9,8]]},"14,5,9":{"name":"厚叠湿纸被","kind":"d","stats":[75,28,3],"xp":8,"cash":0,"heal":0,"cells":[[14,5,9]]},"15,7,3":{"name":"花子","kind":"Q","stats":[140,60,10],"xp":25,"cash":800,"heal":0,"cells":[[15,7,3],[15,8,3],[15,7,2],[15,8,2]]}},"groups":[{"name":"寄存处抽屉","cells":["1,6,4","1,9,6"],"reward":"¥110","value":110},{"name":"客房备用手套","cells":["2,5,7","2,1,2"],"reward":"防护力 +1","value":1},{"name":"旧库房零钱","cells":["3,9,2","3,2,1"],"reward":"¥120","value":120},{"name":"洗衣房备用饮料","cells":["4,3,5","4,1,1"],"reward":"体力 +8","value":8},{"name":"员工柜零钱","cells":["5,5,1","5,5,4"],"reward":"¥90","value":90},{"name":"送餐架退币","cells":["6,9,4","6,9,2"],"reward":"¥110","value":110},{"name":"旧客房床头抽屉","cells":["7,1,2","7,3,2"],"reward":"¥120","value":120},{"name":"布草间工具盒","cells":["8,9,6","8,8,7"],"reward":"清扫力 +1","value":1},{"name":"工程走廊回收款","cells":["9,1,4","9,3,4"],"reward":"¥150","value":150},{"name":"早餐间退币","cells":["11,1,2","11,3,2"],"reward":"¥120","value":120},{"name":"自助洗衣机退币","cells":["12,1,2","12,5,5"],"reward":"¥120","value":120},{"name":"暂存处抽屉","cells":["13,1,4","13,3,4"],"reward":"¥150","value":150},{"name":"设备走廊应急水","cells":["14,3,6","14,1,6"],"reward":"体力 +8","value":8}],"assets":{"item/key_blue":"./assets/tut-bridge/c460a4d6e91498e4.png","item/bonus_envelope":"./assets/tut-bridge/edf2187da92d379d.png","item/wallet":"./assets/tut-bridge/26af094b483a6362.png","item/apron":"./assets/tut-bridge/1ca4f82b643c7649.png","item/floor_brush":"./assets/tut-bridge/32764b9c9d1d20aa.png","item/makeup_pen":"./assets/tut-bridge/15431357da6e4529.png","item/brush_strip":"./assets/tut-bridge/7252342d62029785.png","item/splash_gear":"./assets/tut-bridge/09df31f42417091a.png","item/water":"./assets/tut-bridge/6980952b94787489.png","item/key_yellow":"./assets/tut-bridge/1298a2618d8b7cd6.png","item/coin_purse":"./assets/tut-bridge/416c37f1108862e3.png","item/food":"./assets/tut-bridge/b82b702dc72f7695.png","item/gloves":"./assets/tut-bridge/6f5c2f03a669f2c3.png","item/snack":"./assets/tut-bridge/bc9b377cba2211e6.png","item/anniversary_coin":"./assets/tut-bridge/d0884b780471883b.png","item/key_red":"./assets/tut-bridge/d989fdccc2bb5143.png","item/breakfast_ticket":"./assets/tut-bridge/1c3b88e9612b826d.png","item/brush_head":"./assets/tut-bridge/4da58c6c691085a5.png","item/wrist_guard":"./assets/tut-bridge/8add627772aa06b5.png","item/vacuum":"./assets/tut-bridge/66b90da32fd1cf82.png","item/linen_note":"./assets/tut-bridge/8c6237b678b4511f.png","map/01F":"./assets/tut-bridge/812d2b7046234fcd.png","map/02F":"./assets/tut-bridge/f4b41bf6c52cd56f.png","map/03F":"./assets/tut-bridge/d44a5232128125d0.png","map/04F":"./assets/tut-bridge/e7f54080776b4b5f.png","map/05F":"./assets/tut-bridge/59c6b6716583efa3.png","map/06F":"./assets/tut-bridge/c150980c631d962f.png","map/07F":"./assets/tut-bridge/2e039b8e9079643b.png","map/08F":"./assets/tut-bridge/b3174bc9c543b66e.png","map/09F":"./assets/tut-bridge/0ad572ef7153e565.png","map/10F":"./assets/tut-bridge/b9f9915d39321c48.png","map/11F":"./assets/tut-bridge/938955449997d6c2.png","map/12F":"./assets/tut-bridge/b82e355efcc55eb5.png","map/13F":"./assets/tut-bridge/0645cc6664ee23e2.png","map/14F":"./assets/tut-bridge/13269fd950ac11b3.png","map/15F":"./assets/tut-bridge/51f308cb2bd420bc.png","monster/a":"./assets/tut-bridge/6a22a4f67b5df11f.png","monster/G":"./assets/tut-bridge/18672f5758e1c22e.png","monster/t":"./assets/tut-bridge/21abc51a7f4be60f.png","monster/m":"./assets/tut-bridge/01757ef2a496d3ff.png","monster/J":"./assets/tut-bridge/2816f5fd2aecf174.png","monster/cat-hide":"./assets/tut-bridge/52b2ffed0da12a7d.png","monster/L":"./assets/tut-bridge/bdde034fc378ee4a.png","monster/Z":"./assets/tut-bridge/cdeb81a0ecc4a785.png","monster/N":"./assets/tut-bridge/af84e6ba32ff3578.png","monster/d":"./assets/tut-bridge/b7c15f061f7342dc.png","monster/T":"./assets/tut-bridge/9e37e1bfd145e84f.png","monster/P":"./assets/tut-bridge/193be714b2f609db.png","monster/H":"./assets/tut-bridge/f133ed844a07c98d.png","monster/W":"./assets/tut-bridge/05d78d87ea6a61f9.png","monster/cat-sit":"./assets/tut-bridge/4a725e79270a3110.png","monster/M":"./assets/tut-bridge/211a7bd083135e9f.png","monster/p":"./assets/tut-bridge/89fb9601c34014a7.png","monster/l":"./assets/tut-bridge/a6a0cdb7b81a466b.png","monster/h":"./assets/tut-bridge/906c94893cfd44dd.png","monster/Q":"./assets/tut-bridge/0aef9967eafceb2f.png","monster/c":"./assets/tut-bridge/0f65288c16681a4c.png","monster/e":"./assets/tut-bridge/c5d17c067a6a421d.png","monster/O":"./assets/tut-bridge/3d1aefeb855eba0e.png","player/sprite":"./assets/tut-bridge/3d4cf166e25b0771.png","player/portrait":"./assets/tut-bridge/8beb0d7e29c920b2.png"}};
(() => {
  const D = minatoyaData;
  const gate = nightShiftGate;
  const overlay = document.createElement('dialog');
  overlay.id = 'minatoya-night';
  document.body.append(overlay);
  const style = document.createElement('style');
  style.textContent = `
    #minatoya-night{box-sizing:border-box;width:min(94vw,840px);max-height:96dvh;overflow:auto;background:#181c24;color:#edf0f6;border:1px solid #828898;border-radius:12px;padding:14px;font:15px system-ui;z-index:10000}
    #minatoya-night::backdrop{background:#000b}
    #minatoya-night header,#minatoya-night .mn-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
    #minatoya-night header strong{margin-right:auto}
    #minatoya-night button{font:inherit;color:inherit;background:#323c50;border:1px solid #67738b;border-radius:5px;padding:5px 8px;cursor:pointer}
    #minatoya-night button:disabled{opacity:.48;cursor:default}
    #minatoya-night .mn-body{display:grid;grid-template-columns:minmax(0,528px) minmax(155px,1fr);gap:14px;align-items:start}
    #minatoya-night .mn-map{width:100%;aspect-ratio:1;position:relative;background-size:100% 100%;image-rendering:pixelated}
    #minatoya-night .mn-map img,#minatoya-night .mn-player{position:absolute;pointer-events:none;object-fit:contain}
    #minatoya-night .mn-player{z-index:2;color:#eaffff;filter:drop-shadow(0 1px 2px #000)}
    #minatoya-night .mn-map .mn-player{image-rendering:auto;object-position:center bottom}
    #minatoya-night .mn-map .mn-mirror{opacity:.72;filter:drop-shadow(0 0 5px #a4d6f3) saturate(.55)}
    #minatoya-night .mn-map .mn-boss{transform:scale(1.42);transform-origin:center bottom;object-position:center bottom;filter:drop-shadow(0 2px 2px #18131a70)}
    #minatoya-night .mn-portrait{display:block;width:100%;height:clamp(175px,36vh,330px);margin:12px auto 0;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 7px 13px #0008)}
    @media(max-width:610px){#minatoya-night .mn-portrait{height:140px}}
    #minatoya-night .mn-map button{position:absolute;width:9.0909%;height:9.0909%;padding:0;background:transparent;border:0;border-radius:0;z-index:3}
    #minatoya-night .mn-map button:focus-visible{outline:2px solid #f8d779;outline-offset:-2px}
    #minatoya-night .mn-hint{min-height:2.8em;margin:8px 0}
    #minatoya-night .mn-body p{margin:7px 0}
    @media(max-width:610px){#minatoya-night .mn-body{grid-template-columns:minmax(0,1fr)}}
  `;
  document.head.append(style);
  const monstersByCell = new Map();
  for (const [id,monster] of Object.entries(D.monsters)) for (const cell of monster.cells) monstersByCell.set(cell.join(), id);
  const levels = [0,8,22,42,70,110,165,235,320,425,550,700,875,1075,1300];
  const tileArt = {A:'floor_brush',C:'vacuum',V:'apron',g:'gloves',i:'wrist_guard',f:'brush_strip',z:'brush_head',j:'makeup_pen',w:'water',u:'food',q:'snack',y:'key_yellow',b:'key_blue',r:'key_red',1:'coin_purse',2:'bonus_envelope',3:'wallet',4:'anniversary_coin',5:'coin_purse',6:'breakfast_ticket',7:'coin_purse',8:'wrist_guard',9:'coin_purse',n:'linen_note'};
  const tileNames = {A:'硬毛地板刷',C:'湿干两用吸尘器',V:'防水围裙',g:'厚橡胶手套',i:'防护配件',f:'清扫配件',z:'替换刷头',j:'化妆笔',w:'瓶装水',u:'应急食品',q:'小补给',y:'黄卡',b:'蓝卡',r:'红卡',1:'零钱包',2:'津贴红包',3:'皮夹',4:'纪念金币',5:'客房零钱',6:'早餐券',7:'暂存零钱',8:'员工备用箱',9:'侧室零钱',n:'布草交接单',k:'小猫',F:'前台',E:'客梯',U:'员工梯',S:'上楼',D:'下楼',X:'上楼',K:'后勤通道',s:'服务门',v:'返程开关',x:'后勤梯','+':'强化商店','=':'固定设施'};
  const arrivals = {
    6:'镜廊尽头挂着一面全身镜。你已经走过去了，镜里的人还站在原地。',
    7:'一位醉酒住客堵在走廊里，对着关上的房门大叫。',
    9:'工程间的床架下面有东西在动。几根手指探到了床沿外。',
    11:'禁烟房的报警器响个不停。门缝里还在往外冒烟。',
    13:'房门的门闩坏了。有人半夜带朋友上楼，最后留在房里的住客已经认不出人了。',
    14:'满载的清扫车停在设备间门口。车轮自己转了起来。',
    15:'第三间隔间里传来一声很轻的猫叫。'
  };
  let message = '', selection = null, busy = false;
  const run = () => campaign?.minatoyaRun;
  const coord = (f,x,y) => [f,x,y].join(',');
  const tile = (f,x,y) => D.floors[f-1]?.grid[y]?.[x] || '#';
  const idAt = (r,x,y) => monstersByCell.get(coord(r.f,x,y));
  const live = (r,x,y) => {
    const id = idAt(r,x,y);
    return id && !r.dead[id] ? D.monsters[id] : null;
  };
  const currentDay = () => run()?.day === campaign?.day;
  function fresh(day) {
    return {day,f:1,x:1,y:1,hp:100,max:100,a:10,d:4,level:1,xp:0,money:0,income:0,keys:{Y:0,B:0,R:0},
      dead:{},taken:{},open:{},seen:{'1,1,1':true},groups:{},buys:{5:0,10:0},guard:0,speed:1,cat:false};
  }
  function persist(text) {
    message = text;
    campaignSave();
    render();
  }
  function moveTo(f,x,y) {
    const r = run();
    Object.assign(r,{f,x,y});
    r.seen[coord(f,x,y)] = true;
    if (f === 6 && !r.mirror) r.mirror = [r.hp,r.a,r.d];
  }
  function find(f,c) {
    const rows = D.floors[f-1].grid;
    const y = rows.findIndex(row => row.includes(c));
    return [f,rows[y].indexOf(c),y];
  }
  function warping(f,c,text) {
    moveTo(...find(f,c));
    selection = null;
    const r = run();
    r.arrived ??= {};
    const arrival = !r.arrived[f] && arrivals[f];
    r.arrived[f] = true;
    persist(arrival || text || '到达 '+f+'F。');
  }
  function gain(r,amount) {
    r.income += amount;
    r.money += amount;
  }
  function heal(r,value) { r.hp = Math.min(r.max,r.hp+value); }
  function equip(r,guard) {
    if (guard <= r.guard) return;
    r.d += guard-r.guard;
    r.guard = guard;
  }
  function pickup(r,c,id) {
    if (r.taken[id]) return '';
    if (c === 'k' && !r.dead['15,7,3']) return '小猫还困在第三间隔间里。';
    if (c === '8') {
      if (!r.dead['1,2,2'] || !r.dead['1,1,4']) return '先清掉备用箱的两只守卫。';
      r.d++;
      if (!r.starter) { gain(r,500); r.starter = true; }
    } else if (c === 'q' && r.f === 8) {
      if (!r.note) return '凭早餐厅的布草交接单领取。';
      equip(r,4);
    } else if (c === 'g') equip(r,2);
    else if (c === 'j') r.pen = true;
    else if (c === 'n') r.note = true;
    else if (c === 'k') r.cat = true;
    else if ('ybr'.includes(c)) r.keys[c.toUpperCase()]++;
    else {
      const value = {1:400,2:600,3:800,4:1200,5:150,6:180,7:200,9:{3:60,9:90,11:80,14:110}[r.f]}[c];
      if (value) gain(r,value);
      r.a += {A:4,C:8,f:1,z:2}[c] || 0;
      r.d += {V:4,i:1}[c] || 0;
      heal(r,{w:18,u:30,q:8}[c] || 0);
    }
    r.taken[id] = true;
    return c === 'k' ? '找到小猫了。回 1F 前台交班。' : '取得 '+(c==='q'&&r.f===8?'加强防溅护具':tileNames[c])+'。';
  }
  function estimate(r,monster) {
    const [hp,a,d] = monster.kind === 'I' ? (r.disguise ? [12,7,1] : [r.hp,r.a,r.d]) : monster.stats; // v76：镜人永远复制你当前的状态
    const hit = r.a-d;
    const loss = hit > 0 ? (Math.ceil(hp/hit)-1)*Math.max(0,a-r.d) : Infinity;
    return {hp,a,d,loss};
  }
  function inspect(monster) {
    const e = estimate(run(),monster);
    return monster.name+' · 体力 '+e.hp+' / 清扫 '+e.a+' / 防护 '+e.d+' · '+(Number.isFinite(e.loss)?'预计损失 '+e.loss+' 体力':'当前无法破防');
  }
  function fight(r,x,y,monster) {
    const {loss} = estimate(r,monster);
    if (loss >= r.hp) { message = inspect(monster)+'。当前无法安全通过。'; render(); return; }
    const id = idAt(r,x,y);
    busy = true;
    message = (monster.kind === 'Q' ? '第三间隔间里传来敲门声。' : '')+'与'+monster.name+'交战…';
    render();
    setTimeout(() => {
      busy = false;
      if (run() !== r || !currentDay()) return;
      r.hp -= loss;
      r.xp += monster.xp;
      r.dead[id] = true;
      let earned = monster.cash;
      if (id === '1,3,1') {
        if (r.starter) earned = 0;
        r.starter = true;
      }
      gain(r,earned);
      heal(r,monster.heal);
      moveTo(r.f,x,y);
      persist(monster.name+'已击败。体力 -'+loss+'，经验 +'+monster.xp+(earned?'，收入 ¥'+earned:'')+'。');
    }, (monster.kind === 'Q' ? 850 : 420)/r.speed);
  }
  function move(x,y) {
    const r = run();
    if (!r || !currentDay() || busy || Math.abs(x-r.x)+Math.abs(y-r.y)!==1) return;
    const c = tile(r.f,x,y), id = coord(r.f,x,y);
    if ('#!'.includes(c) || (c === '=' && !(r.f === 10 && x===1 && y===5))) return;
    const monster = live(r,x,y);
    if (monster) { selection = [x,y]; fight(r,x,y,monster); return; }
    if ('YBR'.includes(c) && !r.open[id]) {
      if (!r.keys[c]) { message = '缺少对应的门卡。'; render(); return; }
      r.keys[c]--;
      r.open[id] = true;
    }
    moveTo(r.f,x,y);
    if (id === '6,3,8') r.service = true;
    selection = null;
    persist((tileArt[c] || c==='k') ? pickup(r,c,id) : '');
  }
  function quick(targetX,targetY) {
    const r = run();
    const queue = [[r.x,r.y]];
    const visited = new Set([queue[0].join()]);
    const safe = (x,y) => {
      const id = coord(r.f,x,y), c = tile(r.f,x,y);
      return r.seen[id] && !live(r,x,y) && (c === '.' || c === 'o' || r.dead[idAt(r,x,y)] || r.open[id] || r.taken[id]);
    };
    for (const [x,y] of queue) {
      if (x===targetX && y===targetY) {
        moveTo(r.f,x,y);
        persist('');
        return;
      }
      for (const p of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
        if (visited.has(p.join()) || !safe(...p)) continue;
        visited.add(p.join());
        queue.push(p);
      }
    }
    message = '这段路还没走通。';
    render();
  }
  function settle(success) {
    const r = run(), C = GAME_CONFIG.work.nightShift;
    if (!r || busy || !currentDay() || campaign.nightShiftDay===campaign.day) return;
    if (success && !(r.cat && r.f===1 && tile(r.f,r.x,r.y)==='F')) return;
    const rate = r.income ? r.money/r.income : 0;
    const tier = !success ? 0 : rate>=.65 ? 3 : rate>=.35 ? 2 : 1;
    const bonus = [0,1000,2000,5000][tier];
    const allowance = success ? (window.V74?.allowance('night') || 0) : 0;
    const base = success ? C.income : 0;
    const wage = base+bonus+allowance+(success?r.money:0);
    campaign.cash += wage;
    campaign.stress = Math.min(GAME_CONFIG.player.maxStress,campaign.stress+C.stress);
    campaign.san = sanClamp(campaign.san-C.san);
    campaign.hp = Math.max(1,campaign.hp-C.hp);
    campaign.nightShiftDay = campaign.day;
    delete campaign.minatoyaRun;
    const receipt = success ? '酒店夜勤 · '+ '★'.repeat(tier)+' · 基础 ¥'+base+' · 塔内收入 ¥'+r.income+' · 强化支出 ¥'+(r.income-r.money)+' · 带出 ¥'+r.money+' · 星级奖金 ¥'+bonus+' · 道具津贴 ¥'+allowance+' · 实发 ¥'+wage : '提前离班。本班塔内收入未结算。';
    (campaign.nightShiftLog ??= []).push(receipt);
    recoveryRefresh(receipt);
    overlay.replaceChildren();
    const title = document.createElement('h2');
    title.textContent = success?'夜班工资单':'夜班结束';
    const line = document.createElement('p');
    line.textContent = receipt;
    const close = document.createElement('button');
    close.textContent = '返回酒店';
    close.onclick = () => overlay.close();
    overlay.append(title,line,close);
  }
  const pos = (x,y,w=1,h=1) => 'left:'+100*x/11+'%;top:'+100*y/11+'%;width:'+100*w/11+'%;height:'+100*h/11+'%';
  const avatar = (x,y,mirror=false) => '<img class="mn-player'+(mirror?' mn-mirror':'')+'" alt="" src="'+D.assets['player/sprite']+'" style="'+pos(x-.03,y+.05,1.06,1.02)+'">';
  const button = (label,callback,disabled=false) => {
    const node = document.createElement('button');
    node.textContent = label;
    node.disabled = busy || disabled;
    node.onclick = callback;
    return node;
  };
  const image = (url,x,y,w,h,boss=false) => url ? '<img'+(boss?' class="mn-boss"':'')+' alt="" src="'+url+'" style="'+pos(x,y,w,h)+'">' : '';
  function render() {
    const r = run();
    if (!r || !overlay.open) return;
    const focus = document.activeElement?.dataset?.mnCell;
    const floor = D.floors[r.f-1];
    const c = tile(r.f,r.x,r.y);
    overlay.innerHTML = '<header><strong>港屋酒店 · '+r.f+'F '+esc(floor.name)+'</strong><span>LV '+r.level+' · XP '+r.xp+(levels[r.level]?' / '+levels[r.level]:'')+'</span></header><div class="mn-body"><div class="mn-map"></div><div class="mn-side"></div></div><p class="mn-hint" role="status"></p><div class="mn-actions"></div>';
    const board = overlay.querySelector('.mn-map'), side = overlay.querySelector('.mn-side'), actions = overlay.querySelector('.mn-actions');
    board.style.backgroundImage = 'url("'+D.assets['map/'+String(r.f).padStart(2,'0')+'F']+'")';
    let sprites = '';
    for (const [id,m] of Object.entries(D.monsters)) {
      if (r.dead[id] || m.cells[0][0]!==r.f) continue;
      const xs = m.cells.map(p=>p[1]), ys = m.cells.map(p=>p[2]);
      const x=Math.min(...xs), y=Math.min(...ys), w=Math.max(...xs)-x+1,h=Math.max(...ys)-y+1;
      sprites += m.kind==='I'&&!r.disguise ? avatar(m.cells[0][1],m.cells[0][2],true) : image(D.assets['monster/'+(m.kind==='I'?'N':m.kind)],x,y,w,h,m.kind==='Q');
    }
    for (let y=0;y<11;y++) for(let x=0;x<11;x++) {
      const g=tile(r.f,x,y), id=coord(r.f,x,y);
      if (r.taken[id]) continue;
      if (g==='k' && r.dead['15,7,3']) sprites+=image(D.assets['monster/cat-hide'],x,y,1,1);
      else if (tileArt[g] && !(g==='q'&&r.f===8)) sprites+=image(D.assets['item/'+tileArt[g]],x,y,1,1);
      if (r.open[id]) sprites+='<span style="position:absolute;pointer-events:none;display:grid;place-items:center;background:#32392c;color:#ecf2d5;'+pos(x,y)+'">✓</span>';
      else if (id==='4,9,8') sprites+='<span aria-hidden="true" style="position:absolute;pointer-events:none;display:grid;place-items:center;background:#554322;color:#ffe6a2;border:2px solid #c1a15a;box-sizing:border-box;'+pos(x,y)+'">黄门</span>';
    }
    board.innerHTML = sprites+avatar(r.x,r.y);
    for (let y=0;y<11;y++) for(let x=0;x<11;x++) {
      const g=tile(r.f,x,y);
      if (g==='#') continue;
      const monster=live(r,x,y), node=button('',()=>{
        if (monster) { selection=[x,y]; message=inspect(monster); render(); return; }
        if (x===r.x&&y===r.y) return;
        if (Math.abs(x-r.x)+Math.abs(y-r.y)===1) move(x,y);
        else if (r.fast) quick(x,y);
      });
      node.style.cssText=pos(x,y);
      node.dataset.mnCell=x+','+y;
      node.setAttribute('aria-label', monster?.name || tileNames[g] || '格子 '+x+'，'+y);
      board.append(node);
      if(node.dataset.mnCell===focus&&!node.disabled) node.focus({preventScroll:true});
    }
    const rate = r.income ? ' · 留存 '+Math.floor(100*r.money/r.income)+'%' : '';
    side.innerHTML = '<p>体力 <b>'+r.hp+'/'+r.max+'</b> · 清扫 '+r.a+' · 防护 '+r.d+'</p><p>余额 ¥'+r.money+' / 收入 ¥'+r.income+rate+'</p><p>黄卡 '+r.keys.Y+' · 蓝卡 '+r.keys.B+' · 红卡 '+r.keys.R+'</p><p>'+(r.cat?'已找到小猫，回前台交班。':'寻找被困在顶层的小猫。')+'</p>';
    side.append(button('主动升级',()=>{
      r.level++; r.max+=8; r.hp=r.max; r.a++; r.d++;
      persist('升到 LV '+r.level+'，体力已回满。');
    },!levels[r.level]||r.xp<levels[r.level]));
    const portrait = document.createElement('img');
    portrait.className = 'mn-portrait';
    portrait.alt = '夜勤主角立绘';
    portrait.src = D.assets['player/portrait'];
    side.append(portrait);
    for (const [dx,dy,label] of [[0,-1,'↑'],[-1,0,'←'],[0,1,'↓'],[1,0,'→']]) actions.append(button(label,()=>move(r.x+dx,r.y+dy)));
    actions.append(button('战斗 ×'+r.speed,()=>{r.speed={1:2,2:4,4:1}[r.speed];persist(message);}),button('快移 '+(r.fast?'开':'关'),()=>{r.fast=!r.fast;persist(message);}));
    if (selection && live(r,...selection)?.kind==='I' && Math.abs(r.x-selection[0])+Math.abs(r.y-selection[1])===1 && r.pen && !r.disguise) {
      actions.append(button('用化妆笔画成拖鞋团',()=>{r.pen=false;r.disguise=true;persist('镜人变成了拖鞋团。');}));
    }
    if ('SDX'.includes(c)) {
      const down=c==='D', dest=r.f+(down?-1:1);
      if(dest>=1&&dest<=15) actions.append(button(down?'下楼':'上楼',()=>warping(dest,down?(dest===9?'X':'S'):'D')));
    }
    if ('EU'.includes(c)) for (const f of (c==='E'?[1,2,4,6,8]:[10,12,14])) {
      if(f!==r.f) actions.append(button('去 '+f+'F',()=>warping(f,c)));
    }
    if(c==='K'&&r.open['5,8,3']) actions.append(button('走后勤通道',()=>warping(r.f===5?6:5,'K')));
    if(c==='s'&&r.service) actions.append(button('走服务门',()=>{moveTo(6,3,r.y===8?2:8);persist('已穿过服务门。');}));
    if(c==='x'&&r.f===11&&r.note) actions.append(button('后勤梯下到 8F',()=>warping(8,'x')));
    if(c==='v'&&r.cat) actions.append(button('直达 1F 前台',()=>warping(1,'F')));
    if(r.f===10&&r.x===1&&r.y===5) actions.append(button('读工程公告板',()=>{message='7F、9F、11F 和 13F 有红卡。布草备用护具在 11F 早餐厅储物室登记，凭交接单走后勤梯下 8F 领取。';render();}));
    if(c==='+'&&r.f in r.buys) {
      const late=r.f===10, cost=(late?1000:500)+(late?500:250)*r.buys[r.f];
      for (const [name,a,d] of [['均衡整备',late?4:3,late?4:3],['清扫优先',late?6:5,late?2:1],['防护优先',late?2:1,late?6:5]]) {
        actions.append(button(name+' ¥'+cost+'（清扫 +'+a+' / 防护 +'+d+'）',()=>{
          if (!confirm('花 ¥'+cost+' 购买'+name+'？')) return;
          r.money-=cost;r.buys[r.f]++;r.a+=a;r.d+=d;heal(r,late?25:15);persist('已购买'+name+'。');
        },r.money<cost));
      }
    }
    for (const g of D.groups) if (+g.cells[0].split(',')[0]===r.f&&!r.groups[g.name]&&g.cells.every(id=>r.dead[id])) {
      actions.append(button(g.name+' · '+g.reward,()=>{
        r.groups[g.name]=true;
        if(g.reward.includes('¥')) gain(r,g.value);
        else if(g.reward.startsWith('体力')) heal(r,g.value);
        else if(g.reward.startsWith('防护')) r.d+=g.value;
        else r.a+=g.value;
        persist('已领取'+g.name+'。');
      }));
    }
    if(c==='F'&&r.cat) actions.append(button('救猫交班',()=>settle(true)));
    actions.append(button('暂停并返回',()=>overlay.close()),button('提前离班',()=>{if(confirm('结束本班？塔内收入不会结算。'))settle(false);}));
    overlay.querySelector('.mn-hint').textContent = message || '点击怪物查看战损，方向键或屏幕箭头踏入开战。';
  }
  overlay.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  window.addEventListener('keydown',e=>{
    if(!overlay.open||!run()) return;
    const moves={ArrowUp:[0,-1],ArrowLeft:[-1,0],ArrowDown:[0,1],ArrowRight:[1,0],w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]};
    const delta=moves[e.key];
    if(!delta) return;
    e.preventDefault();e.stopImmediatePropagation();
    const r=run();move(r.x+delta[0],r.y+delta[1]);
  },true);
  nightShiftGate = function(){ return currentDay() && run() ? [] : gate(); };
  startNightShift = function(){
    if(!campaign || nightShiftGate().length) return;
    if(!currentDay()){
      if(!spendAction('work')) return;
      campaign.minatoyaRun=fresh(campaign.day);
      campaignSave();
      message='有住客避开前台，把小猫带进酒店。现在猫不见了。';
    } else message='继续本班夜勤。';
    selection=null;
    if(!overlay.open) overlay.showModal();
    render();
  };
  const oldButton=nightShiftButton;
  nightShiftButton=function(box){
    const first=box.children.length;
    oldButton.apply(this,arguments);
    const entry=box.children[first], note=box.children[first+1];
    if(entry&&currentDay()) entry.textContent='继续港屋酒店夜勤';
    if(note&&!nightShiftGate().length) note.textContent='酒店夜勤 · 进入 15 层酒店，找到走失的小猫，回前台交班。';
  };
})();

if(!campaign)setupCampaign();else{storyStateInit();tokyoHome();}
showLoadErrors();
})();
