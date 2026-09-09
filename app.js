'use strict';
(function(){
  function loadScript(src, done){
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    if(done)s.onload=done;
    s.onerror=function(){console.error('RVU failed to load:',src);};
    document.head.appendChild(s);
  }
  loadScript('./application-submit.js',function(){
    loadScript('./app-core.js',function(){
      if(window.RVUApplicationPatch&&typeof window.RVUApplicationPatch.afterCore==='function'){
        window.RVUApplicationPatch.afterCore();
      }
    });
  });
})();
