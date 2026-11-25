/* ==== engine/survival/88-audio.js ==== */
/* ===================================================================
   【V19 音效与环境音（全部在浏览器里实时合成，不需要任何音频文件）】
   AUDIO.sfx('名字')   播放音效：click type step door ding knock phone clue ok ng glitch coin train page drag scan chin
   AUDIO.ambience('名字') 切换环境音：title map district quiz lobby corridor late scene train story none
   剧情 JSON 里任何一段对话写 "sfx": "knock" 就会在播放时发出声音。
   开关与音量在「设置」页；浏览器规定必须先点一下画面才能出声，所以第一次点击后才开始播放。
   =================================================================== */
const AUDIO=(function(){
 const KEY='tokyo-audio-v1';
 /* v23.6：音量相关的数值在 config/game.json 的 audio（默认音量、BGM/音效的比例、整体放大、压缩器、给手机扬声器加的泛音） */
 const AC_CFG=()=>Object.assign({defaultVolume:0.6,boost:1.0,musicGain:0.9,sfxGain:1.6,overtones:[2,3],overtoneGain:0.8,droneCutoff:1800,noiseScale:1.6,compressor:{threshold:-20,knee:12,ratio:4,attack:0.01,release:0.25}},GAME_CONFIG.audio||{});
 let pref={sfx:true,music:true,volume:AC_CFG().defaultVolume};try{Object.assign(pref,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
 let analyser=null,ctx=null,master=null,sfxBus=null,musicBus=null,noiseBuf=null,amb=null,wantAmb='none',lastType=0;
 function savePref(){try{localStorage.setItem(KEY,JSON.stringify(pref))}catch(e){}}
 function init(){
  if(ctx)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  try{ctx=new AC()}catch(e){return false}
  const K=AC_CFG(),cp=K.compressor||{};
  /* 音量 → 压缩器（防止放大后破音）→ 整体放大 → 扬声器 */
  master=ctx.createGain();master.gain.value=pref.volume;
  const comp=ctx.createDynamicsCompressor();try{comp.threshold.value=cp.threshold;comp.knee.value=cp.knee;comp.ratio.value=cp.ratio;comp.attack.value=cp.attack;comp.release.value=cp.release}catch(e){}
  const boost=ctx.createGain();boost.gain.value=K.boost;analyser=ctx.createAnalyser();analyser.fftSize=2048;
  master.connect(comp);comp.connect(boost);boost.connect(ctx.destination);boost.connect(analyser);
  sfxBus=ctx.createGain();sfxBus.gain.value=pref.sfx?K.sfxGain:0;sfxBus.connect(master);
  musicBus=ctx.createGain();musicBus.gain.value=pref.music?K.musicGain:0;musicBus.connect(master);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return true;
 }
 /* v23.5 手机上没有 BGM 的修正：
    - 手机浏览器只把「touchend / click / 触屏的 pointerup / keydown」算作“用户点了一下”，touchstart 和触屏的 pointerdown 不算，
      原来只监听 pointerdown / touchstart，所以在手机上声音一直处于暂停状态（电脑用鼠标的 pointerdown 算，所以电脑上有声音）。
    - iPhone 切换应用 / 来电后状态会变成 interrupted，也要重新 resume。
    - iPhone 的静音开关会让网页合成的声音（Web Audio）没有声音：把音频会话设为 playback，并在第一次点击时播放一段无声的音频。 */
 let silentEl=null;
 function iosSession(){
  try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback'}catch(e){}
  if(silentEl||navigator.audioSession)return;
  try{silentEl=new Audio('./assets/88-audio/c726d333dd159a31.wav');silentEl.setAttribute('playsinline','');silentEl.loop=false;const pr=silentEl.play();if(pr&&pr.catch)pr.catch(()=>{silentEl=null})}catch(e){silentEl=null}
 }
 function unlock(){if(!init())return;iosSession();if(ctx.state!=='running'&&ctx.state!=='closed')ctx.resume().then(()=>{if(wantAmb&&!amb)ambience(wantAmb,true)}).catch(()=>{});if(wantAmb&&!amb)ambience(wantAmb,true)}
 ['pointerdown','pointerup','keydown','touchstart','touchend','click'].forEach(ev=>document.addEventListener(ev,unlock,{passive:true,capture:true}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ctx&&ctx.state!=='running')ctx.resume().catch(()=>{})});
 const ready=()=>ctx&&ctx.state==='running';
 /* ---------- 小工具 ---------- */
 function env(g,t,a,peak,d,end){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(Math.max(0.0001,end||0.0001),t+a+d)}
 function tone(type,freq,t,dur,vol,opts){opts=opts||{};const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(opts.to)o.frequency.exponentialRampToValueAtTime(opts.to,t+dur);env(g,t,opts.a||0.005,vol,dur);o.connect(g);let out=g;if(opts.lp){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=opts.lp;g.connect(f);out=f}out.connect(opts.bus||sfxBus);o.start(t);o.stop(t+dur+0.05)}
 function noise(t,dur,vol,type,freq,q,bus){const s=ctx.createBufferSource();s.buffer=noiseBuf;const f=ctx.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq||1000;f.Q.value=q||0.7;const g=ctx.createGain();env(g,t,0.004,vol,dur);s.connect(f);f.connect(g);g.connect(bus||sfxBus);s.start(t,Math.random()*1.5);s.stop(t+dur+0.05)}
 /* ---------- 音效 ---------- */
 const SFX={
  click:t=>tone('square',880,t,0.04,0.05,{lp:2400}),
  page:t=>noise(t,0.07,0.05,'bandpass',2600,1.2),
  type:t=>tone('square',1300+Math.random()*250,t,0.018,0.018,{lp:3000}),
  step:t=>noise(t,0.05,0.06,'lowpass',420),
  door:t=>{noise(t,0.25,0.12,'lowpass',300);tone('triangle',110,t+0.02,0.25,0.12,{to:70})},
  ding:t=>{tone('sine',1320,t,0.9,0.12);tone('sine',1047,t+0.18,1.1,0.1)},
  knock:t=>{[0,0.32,0.64].forEach(d=>{noise(t+d,0.09,0.4,'lowpass',260);tone('sine',90,t+d,0.12,0.35,{to:60})})},
  phone:t=>{for(let r=0;r<2;r++)for(let i=0;i<14;i++){const s=t+r*1.2+i*0.05;tone('square',i%2?1600:2000,s,0.045,0.04,{lp:3500})}},
  clue:t=>{[659,880,1175].forEach((f,i)=>tone('triangle',f,t+i*0.08,0.35,0.09))},
  ok:t=>{tone('triangle',784,t,0.12,0.1);tone('triangle',1175,t+0.09,0.25,0.1)},
  ng:t=>{tone('sawtooth',140,t,0.28,0.09,{to:90,lp:900});tone('sawtooth',147,t,0.28,0.06,{to:95,lp:900})},
  glitch:t=>{for(let i=0;i<6;i++)noise(t+i*0.045,0.04,0.12,'bandpass',800+Math.random()*4000,4);tone('square',60,t,0.25,0.05,{to:30})},
  coin:t=>{tone('square',988,t,0.06,0.05,{lp:4000});tone('square',1319,t+0.06,0.18,0.05,{lp:4000})},
  schoolroom:t=>{for(let i=0;i<6;i++)noise(t+i*.14,.24,.034,"bandpass",370+i%3*180)},
  filmShutter:t=>{noise(t,.05,.15,"highpass",1400);noise(t+.08,.04,.12,"bandpass",800)},
  train:t=>{noise(t,2.2,0.18,'lowpass',180);for(let i=0;i<6;i++){noise(t+0.2+i*0.32,0.08,0.18,'lowpass',500)}},
  heartbeat:t=>{tone('sine',55,t,0.14,0.35);tone('sine',50,t+0.22,0.16,0.28)},
  buzz:t=>{for(let i=0;i<2;i++){tone('sawtooth',62,t+i*0.32,0.22,0.12,{lp:240});noise(t+i*0.32,0.2,0.05,'lowpass',180)}},
  water:t=>{for(let i=0;i<5;i++)noise(t+i*0.5,0.7,0.16,'bandpass',900+Math.random()*900,0.8);noise(t,2.6,0.08,'lowpass',500)},
  drip:t=>{tone('sine',1900,t,0.09,0.12,{to:900});noise(t,0.05,0.04,'highpass',3000)},
  bump:t=>{noise(t,0.14,0.32,'lowpass',180);tone('sine',70,t,0.18,0.3,{to:45})},
  keys:t=>{for(let i=0;i<5;i++)tone('triangle',3200+Math.random()*1800,t+i*0.05+Math.random()*0.03,0.06,0.03)},
  scan:t=>tone('square',1760,t,0.07,0.06,{lp:5000}), // 便利店：扫描「ピッ」
  chin:t=>{tone('sine',2093,t,0.6,0.1);tone('sine',2637,t+0.02,0.5,0.06)}, // 便利店：微波炉「チン」
  drag:t=>{noise(t,1.6,0.16,'lowpass',140);for(let i=0;i<4;i++)noise(t+0.15+i*0.38,0.3,0.12,'bandpass',260+Math.random()*120,2);tone('sine',38,t,1.8,0.22,{to:28})}, // 入境之夜·午夜：某种很重的东西被拖过地面
  impact:t=>{noise(t,0.6,0.9,'lowpass',900);tone('sine',55,t,0.5,0.8,{to:30});noise(t,0.12,0.6,'highpass',2000)}, // 站台事件：撞击
  alarm:t=>{for(let i=0;i<4;i++){tone('square',i%2?740:988,t+i*0.5,0.48,0.07,{lp:2600})}}, // 站台事件：列车警报（约 2 秒）
  brake:t=>{tone('sawtooth',2400,t,1.4,0.05,{to:1800,lp:4000});noise(t,1.4,0.08,'bandpass',3200,6)}, // 站台事件：紧急制动的刺耳声
  crawl:t=>{for(let i=0;i<3;i++)noise(t+i*0.06+Math.random()*0.04,0.09,0.035,'bandpass',1400+Math.random()*1600,3)} // 第一章第二次高潮：湿的窸窣声
 };
 function sfx(name){if(!pref.sfx)return;if(!init()||!ready())return;const f=SFX[name];if(!f)return;if(name==='type'){const n=performance.now();if(n-lastType<45)return;lastType=n}try{f(ctx.currentTime+0.005)}catch(e){}}
 /* ---------- 环境音（持续的低音 + 过滤噪声 + 偶发声响） ---------- */
 const AMB={
  title:{drone:[55,82.4],noise:[500,0.05],lfo:0.07,events:['heartbeat'],every:9},
  map:{drone:[73.4,110],noise:[700,0.05],lfo:0.05,events:['train'],every:24},
  district:{drone:[82.4,123.5],noise:[1200,0.06],lfo:0.08},
  quiz:{drone:[98,146.8],noise:[900,0.025],lfo:0.1},
  lobby:{drone:[60,120],noise:[350,0.05],lfo:0.03,hum:true},
  corridor:{drone:[49,73.4],noise:[260,0.06],lfo:0.04,hum:true},
  late:{drone:[41.2,43.6,61.7],noise:[220,0.08],lfo:0.02,events:['heartbeat'],every:7},
  scene:{drone:[46.2,69.3],noise:[300,0.05],lfo:0.03},
  story:{drone:[55,65.4],noise:[400,0.04],lfo:0.05},
  train:{drone:[40,80],noise:[160,0.14],lfo:0.6},
  void:{drone:[50,100.5],noise:[3200,0.025],lfo:0.06,hum:true,events:['train'],every:20},
  plane:{drone:[68,102],noise:[420,0.15],lfo:0.25},
  rain:{drone:[55,73.4],noise:[2600,0.07],lfo:0.15}
 };
 function stopAmb(fade){if(!amb)return;const a=amb;amb=null;const t=ctx.currentTime;a.g.gain.cancelScheduledValues(t);a.g.gain.setValueAtTime(a.g.gain.value,t);a.g.gain.linearRampToValueAtTime(0.0001,t+(fade||1.2));clearInterval(a.timer);setTimeout(()=>{a.nodes.forEach(n=>{try{n.stop()}catch(e){}});try{a.g.disconnect()}catch(e){}},((fade||1.2)+0.2)*1000)}
 function ambience(name,force){
  if(!force&&name===wantAmb&&amb)return;wantAmb=name;
  if(!init()||!ready())return;
  stopAmb(1.2);if(name==='none'||!AMB[name])return;
  const def=AMB[name],t=ctx.currentTime,g=ctx.createGain(),nodes=[];g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(1,t+2);g.connect(musicBus);
  const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=def.lfo;lg.gain.value=0.35;lfo.connect(lg);lfo.start();nodes.push(lfo);
  const K=AC_CFG();
  def.drone.forEach((f,i)=>{const o=ctx.createOscillator(),og=ctx.createGain(),flt=ctx.createBiquadFilter();o.type=i?'triangle':'sine';o.frequency.value=f;o.detune.value=(i-1)*6;flt.type='lowpass';flt.frequency.value=600;og.gain.value=0.16/def.drone.length+0.04;lg.connect(og.gain);o.connect(flt);flt.connect(og);og.connect(g);o.start();nodes.push(o);
   /* 手机扬声器放不出 150Hz 以下的低音：给每个低音加上高一两个八度的泛音，在手机上也听得见 */
   (K.overtones||[]).forEach((m,j)=>{const h=ctx.createOscillator(),hg=ctx.createGain(),hf=ctx.createBiquadFilter();h.type='triangle';h.frequency.value=f*m;h.detune.value=(i-1)*6+(j?4:-4);hf.type='lowpass';hf.frequency.value=K.droneCutoff;hg.gain.value=(0.16/def.drone.length+0.04)*K.overtoneGain/(j+1);lg.connect(hg.gain);h.connect(hf);hf.connect(hg);hg.connect(g);h.start();nodes.push(h)})});
  const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;const nf=ctx.createBiquadFilter();nf.type='lowpass';nf.frequency.value=def.noise[0];const ng=ctx.createGain();ng.gain.value=def.noise[1]*K.noiseScale;s.connect(nf);nf.connect(ng);ng.connect(g);s.start();nodes.push(s);
  if(def.hum){const h=ctx.createOscillator(),hg=ctx.createGain();h.type='sawtooth';h.frequency.value=50;hg.gain.value=0.012;const hf=ctx.createBiquadFilter();hf.type='lowpass';hf.frequency.value=180;h.connect(hf);hf.connect(hg);hg.connect(g);h.start();nodes.push(h)}
  let timer=0;if(def.events)timer=setInterval(()=>{if(!pref.music||!ready())return;if(Math.random()<0.6){const ev=def.events[Math.floor(Math.random()*def.events.length)];try{SFX[ev](ctx.currentTime+0.01)}catch(e){}}},(def.every||15)*1000);
  amb={name,g,nodes,timer};
 }
 function set(k,v){pref[k]=v;savePref();if(!ctx)return;const K=AC_CFG();if(k==='volume')master.gain.value=v;if(k==='sfx')sfxBus.gain.value=v?K.sfxGain:0;if(k==='music')musicBus.gain.value=v?K.musicGain:0}
 /* 测试用：现在输出的响度（整体 RMS、手机扬声器能放出来的 300Hz 以上部分） */
 function level(){if(!analyser)return null;const n=analyser.fftSize,t=new Float32Array(n);analyser.getFloatTimeDomainData(t);let r=0;for(const x of t)r+=x*x;const fd=new Float32Array(analyser.frequencyBinCount);analyser.getFloatFrequencyData(fd);const bin=ctx.sampleRate/n;let hi=0;fd.forEach((db,i)=>{if(i*bin>=300&&i*bin<=4000)hi+=Math.pow(10,db/10)});return {rms:Math.sqrt(r/n),hi,peak:Math.max(...t.map(Math.abs))}}
 return {sfx,ambience,set,get:k=>pref[k],unlock,state:()=>ctx?ctx.state:'none',current:()=>wantAmb,playing:()=>!!amb&&ready(),level,
  _suspendForTest:()=>ctx&&ctx.suspend()};
})();
window.AUDIO=AUDIO;

/* ---------- 接入：场景切换 → 环境音；常见动作 → 音效 ---------- */
const audioScene=UI.scene;
UI.scene=function(name,resume){audioScene(name,resume);
 let a={map:'map',district:'district',quiz:'quiz',setup:'title',story:'story',dialogue:'story',travel:'train',investigate:'scene'}[name];
 if(name==='pixel'&&window.H18&&H18.active())a=H18.ambienceName();
 if(a)AUDIO.ambience(a);
};
const audioGlitch=UI.glitch;UI.glitch=function(kind,ms){audioGlitch(kind,ms);if(SETTINGS.get('anomalies'))AUDIO.sfx('glitch')};
const audioToast=UI.toast;UI.toast=function(t){audioToast(t);if(/🔎|新证据/.test(t))AUDIO.sfx('clue')};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b||b.disabled)return;if(b.classList.contains('adv-choice'))AUDIO.sfx('page');else AUDIO.sfx('click')},true);
const audioChange=GS.change;GS.change=function(d,reason){const out=audioChange(d,reason);if(d&&d.cash<0)AUDIO.sfx('coin');return out};
