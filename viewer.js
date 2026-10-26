'use strict';
(function(){
  var params=new URLSearchParams(window.location.search);
  var index=Number(params.get('image'));
  var valid=Number.isInteger(index)&&index>=1&&index<=6;
  var ar=params.get('lang')!=='en';
  var names=['Account Takeover','Information Disclosure','API Authorization','Access Control','Stored XSS','Report Accepted'];
  var stage=document.getElementById('image-surface');
  var img=document.getElementById('full-image');
  var out=document.getElementById('zoom-level');
  var error=document.getElementById('viewer-error');
  var close=document.getElementById('close-viewer');
  var label=document.getElementById('viewer-heading');
  var hint=document.getElementById('viewer-hint');
  var scale=1,x=0,y=0,drag=null,pinch=null,lastTap=0;
  var clamp=function(n,a,b){return Math.min(b,Math.max(a,n));};
  document.documentElement.lang=ar?'ar':'en';
  document.documentElement.dir=ar?'rtl':'ltr';
  document.title=(ar?'عرض تقرير: ':'Report: ')+(valid?names[index-1]:'RVU Camp')+' | RVU Camp';
  label.textContent=valid?names[index-1]:'RVU Camp';
  hint.textContent=ar?'كبّر بإصبعين، وحرّك الصورة بإصبع واحد':'Pinch to zoom, then drag to pan';
  close.setAttribute('aria-label',ar?'إغلاق والعودة للتقارير':'Close and return to reports');
  close.title=ar?'إغلاق':'Close';
  error.textContent=ar?'تعذّر تحميل الصورة. ارجع للتقارير وحاول مرة تانية.':'The image could not load. Return to reports and try again.';
  [['zoom-in',ar?'تكبير':'Zoom in'],['zoom-out',ar?'تصغير':'Zoom out'],['zoom-reset',ar?'إعادة الحجم':'Reset zoom']].forEach(function(row){
    var b=document.getElementById(row[0]);b.setAttribute('aria-label',row[1]);b.title=row[1];
  });
  if(!valid){window.location.replace('/#research');return;}
  img.alt=names[index-1];
  img.src='/poc-0'+index+'-full.webp';
  img.addEventListener('error',function(){error.hidden=false;img.hidden=true;});
  close.addEventListener('click',function(e){
    var ref;
    try{ref=new URL(document.referrer);}catch(_){ref=null;}
    if(ref&&ref.origin===location.origin&&(ref.pathname==='/'||ref.pathname==='/index.html')&&history.length>1){
      e.preventDefault();history.back();
    }
  });
  function render(){
    var w=img.offsetWidth,h=img.offsetHeight,vw=stage.clientWidth,vh=stage.clientHeight;
    var maxX=Math.max(0,(w*scale-vw)/2)+Math.max(0,(w*scale-vw)/2)>0?Math.max(0,(w*scale-vw)/2):0;
    var maxY=Math.max(0,(h*scale-vh)/2);
    x=clamp(x,-maxX,maxX);y=clamp(y,-maxY,maxY);
    img.style.transform='translate(-50%,-50%) translate('+x+'px,'+y+'px) scale('+scale+')';
    out.textContent=Math.round(scale*100)+'%';
    document.getElementById('zoom-out').disabled=scale<=1;
  }
  function zoom(next,cx,cy){
    var before=scale;
    scale=clamp(next,1,8);
    var dx=cx-stage.clientWidth/2,dy=cy-stage.clientHeight/2;
    x=dx-(dx-x)*(scale/before);y=dy-(dy-y)*(scale/before);
    if(scale===1){x=0;y=0;}
    render();
  }
  function midpoint(a,b){return {x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};}
  function distance(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}
  stage.addEventListener('touchstart',function(e){
    if(e.touches.length>=2){
      var c=midpoint(e.touches[0],e.touches[1]);
      pinch={dist:Math.max(1,distance(e.touches[0],e.touches[1])),scale:scale,x:x,y:y,cx:c.x,cy:c.y};
      drag=null;e.preventDefault();
    }else if(e.touches.length===1){
      pinch=null;drag={x:e.touches[0].clientX,y:e.touches[0].clientY,tx:x,ty:y};e.preventDefault();
    }
  },{passive:false});
  stage.addEventListener('touchmove',function(e){
    if(e.touches.length>=2){
      if(!pinch){var c0=midpoint(e.touches[0],e.touches[1]);pinch={dist:Math.max(1,distance(e.touches[0],e.touches[1])),scale:scale,x:x,y:y,cx:c0.x,cy:c0.y};}
      var c=midpoint(e.touches[0],e.touches[1]),ratio=clamp(pinch.scale*distance(e.touches[0],e.touches[1])/pinch.dist,1,8)/pinch.scale;
      scale=clamp(pinch.scale*ratio,1,8);
      x=c.x-stage.clientWidth/2-(pinch.cx-stage.clientWidth/2-pinch.x)*ratio;
      y=c.y-stage.clientHeight/2-(pinch.cy-stage.clientHeight/2-pinch.y)*ratio;
      render();e.preventDefault();
    }else if(e.touches.length===1&&drag&&scale>1){
      x=drag.tx+e.touches[0].clientX-drag.x;
      y=drag.ty+e.touches[0].clientY-drag.y;
      render();e.preventDefault();
    }
  },{passive:false});
  stage.addEventListener('touchend',function(e){
    if(e.touches.length===1){pinch=null;drag={x:e.touches[0].clientX,y:e.touches[0].clientY,tx:x,ty:y};}
    else if(!e.touches.length){
      drag=null;pinch=null;
      var now=Date.now();
      if(e.changedTouches.length===1&&now-lastTap<310){zoom(scale>1?1:2.5,e.changedTouches[0].clientX,e.changedTouches[0].clientY);lastTap=0;}
      else lastTap=now;
    }
  });
  stage.addEventListener('touchcancel',function(){drag=null;pinch=null;});
  stage.addEventListener('pointerdown',function(e){
    if(e.pointerType!=='mouse'||e.button!==0)return;
    drag={x:e.clientX,y:e.clientY,tx:x,ty:y,id:e.pointerId};
    stage.classList.add('is-grabbing');stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse'||!drag||drag.id!==e.pointerId||scale<=1)return;
    x=drag.tx+e.clientX-drag.x;y=drag.ty+e.clientY-drag.y;render();
  });
  function stopDrag(){drag=null;stage.classList.remove('is-grabbing');}
  stage.addEventListener('pointerup',stopDrag);stage.addEventListener('pointercancel',stopDrag);
  stage.addEventListener('dblclick',function(e){zoom(scale>1?1:2.5,e.clientX,e.clientY);});
  stage.addEventListener('wheel',function(e){
    e.preventDefault();zoom(scale*Math.exp(-e.deltaY*.002),e.clientX,e.clientY);
  },{passive:false});
  document.getElementById('zoom-in').addEventListener('click',function(){zoom(scale*1.5,stage.clientWidth/2,stage.clientHeight/2);});
  document.getElementById('zoom-out').addEventListener('click',function(){zoom(scale/1.5,stage.clientWidth/2,stage.clientHeight/2);});
  document.getElementById('zoom-reset').addEventListener('click',function(){scale=1;x=0;y=0;render();});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){close.click();return;}
    if(e.target&&e.target.tagName==='BUTTON')return;
    if(e.key==='+'||e.key==='=')zoom(scale*1.5,stage.clientWidth/2,stage.clientHeight/2);
    else if(e.key==='-')zoom(scale/1.5,stage.clientWidth/2,stage.clientHeight/2);
    else if(e.key==='0'){scale=1;x=0;y=0;render();}
    else if(scale>1&&e.key==='ArrowLeft'){x-=60;render();}
    else if(scale>1&&e.key==='ArrowRight'){x+=60;render();}
    else if(scale>1&&e.key==='ArrowUp'){y-=60;render();}
    else if(scale>1&&e.key==='ArrowDown'){y+=60;render();}
    else return;
    e.preventDefault();
  });
  img.addEventListener('load',render);
  window.addEventListener('resize',render);
  render();
})();
