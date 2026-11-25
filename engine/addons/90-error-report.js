
/* ==== engine/addons/90-error-report.js ==== */
/* 【页面出现 JavaScript 错误时，在屏幕底部显示红色提示（方便发现问题）】 */
(function(){
  function report(message, source, line, column){
    try{
      let el=document.getElementById('actual-js-error');
      if(!el){el=document.createElement('div');el.id='actual-js-error';el.setAttribute('role','alert');el.style.cssText='position:fixed;z-index:2147483647;bottom:12px;left:12px;right:12px;max-height:30vh;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;padding:12px;border:3px solid #ffb3a3;background:#311b29;color:#fff;font:13px/1.6 monospace;box-shadow:0 5px 20px #0009';document.body.appendChild(el)}
      el.textContent='⚠ 网页 JavaScript 错误：'+String(message)+' @ '+(String(source||'unknown').replace(/%[0-9A-F]{2}(?:%[0-9A-F]{2})*/gi,s=>{try{return decodeURIComponent(s)}catch(_){return s}}))+':'+(line||'?')+':'+(column||'?');
    }catch(_){}
  }
  window.addEventListener('error',function(e){if(e.error||e.message)report(e.message,e.filename,e.lineno,e.colno)});
  window.addEventListener('unhandledrejection',function(e){report(e.reason&&e.reason.stack||String(e.reason),'Promise',0,0)});
})();
