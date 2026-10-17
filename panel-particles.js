(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.panel-particles').forEach(canvas=>{
    const ctx=canvas.getContext('2d');
    if(!ctx)return;
    const section=canvas.parentElement,button=section.querySelector('.panel-particle-toggle');
    let paused=reduced.matches,visible=false,frame=0,last=0,time=0,w=0,h=0;
    const seeds=Array.from({length:60},(_,i)=>({x:(i*.61803398875)%1,y:(i*.41421356)%1,r:.6+(i%3)*.4}));
    function draw(){
      ctx.clearRect(0,0,w,h);
      const points=seeds.map((p,i)=>({x:(p.x*w+Math.sin(time*.2+i)*20+w)%w,y:(p.y*h-time*(3+i%4)+h*10)%h,r:p.r}));
      for(let i=0;i<points.length;i++){
        const p=points[i];
        for(let j=i+1;j<points.length;j++){
          const q=points[j],d=Math.hypot(p.x-q.x,p.y-q.y);
          if(d<100){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`rgba(68,127,156,${(1-d/100)*.13})`;ctx.lineWidth=.6;ctx.stroke();}
        }
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(65,130,155,.42)';ctx.fill();
      }
    }
    function resize(){w=canvas.clientWidth;h=canvas.clientHeight;if(!w||!h)return;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);draw();}
    function tick(now){frame=0;if(now-last>45){time+=Math.min(now-last,100)/1000;last=now;if(w&&h)draw();}if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
    function sync(){cancelAnimationFrame(frame);frame=0;button.hidden=false;button.textContent=paused?'Play particles':'Pause particles';button.setAttribute('aria-pressed',String(!paused));if(!paused&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}}
    button.addEventListener('click',()=>{paused=!paused;sync();});
    reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
    document.addEventListener('visibilitychange',sync);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(section);
    new ResizeObserver(resize).observe(canvas);resize();sync();
  });
})();
