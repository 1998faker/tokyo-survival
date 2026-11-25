
/* BOOT-GAME-FIRST: 有存档时，开机在所有 load 处理之后回到游戏地图（游戏自身的开机引导负责无存档时的序章） */
window.addEventListener('load',function(){try{var has=false;try{has=!!localStorage.getItem('tokyo-survival-campaign-v1')}catch(e){}var dlgOpen=false;try{dlgOpen=typeof DM!=='undefined'&&DM.isOpen()}catch(e){}if(has&&!dlgOpen&&typeof window.tokyoHome==='function'){window.__etBooting=true;try{window.tokyoHome()}finally{window.__etBooting=false}if(typeof window.__etResume==='function')window.__etResume()}}catch(e){}});
