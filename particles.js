(() => {
  'use strict';
  const canvas = document.querySelector('#particle-background');
  const button = document.querySelector('#particle-toggle');
  if (!canvas || !button) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, width = 0, height = 0, frame = 0, last = 0, time = 4;
  // Charged-particle-style trajectories in a magnetic field: decorative, not detector data.
  const colors = ['56,121,173', '47,153,159', '147,114,173', '183,144,66'];
  function track(origin, angle, curvature, length, progress, color, depth) {
    const points = 75, distance = Math.min(width,height) * length;
    function position(f) {
      const a = angle + curvature * f;
      const radius = distance / curvature;
      const x = radius * (Math.sin(a)-Math.sin(angle));
      const y = radius * (Math.cos(angle)-Math.cos(a));
      return [origin[0]+x,origin[1]+y*.78+depth*f*22];
    }
    ctx.beginPath();
    for (let i=0;i<=points;i++) {
      const f=i/points*progress, [x,y]=position(f);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=`rgba(${color},${.16+depth*.06})`;
    ctx.lineWidth=.7+depth*.35;
    ctx.stroke();
    if(progress>0 && progress<1) {
      const [x,y]=position(progress);
      const glow=ctx.createRadialGradient(x,y,0,x,y,7);
      glow.addColorStop(0,`rgba(${color},.65)`);glow.addColorStop(1,`rgba(${color},0)`);
      ctx.fillStyle=glow;ctx.fillRect(x-7,y-7,14,14);
      ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fillStyle=`rgba(${color},.8)`;ctx.fill();
    }
  }
  function draw() {
    ctx.clearRect(0,0,width,height);
    for(let event=0;event<4;event++) {
      const cycle=(time+event*4.5)%18;
      const fade=Math.min(1,cycle/2,Math.max(0,(18-cycle)/4));
      const origin=[width*(event%2?.88:.12),height*(.19+event*.21)];
      ctx.save();ctx.globalAlpha=fade;
      // Faint detector rings give spatial context without a dark sci-fi backdrop.
      for(let ring=1;ring<4;ring++) {
        ctx.beginPath();ctx.ellipse(origin[0],origin[1],ring*52,ring*39,-.35,0,Math.PI*2);
        ctx.strokeStyle='rgba(86,123,157,.07)';ctx.lineWidth=.7;ctx.stroke();
      }
      for(let i=0;i<9;i++) {
        const angle=i*Math.PI*2/9+event*.7;
        const charge=i%2?1:-1;
        const progress=Math.max(0,Math.min(1,(cycle-i*.08)/8));
        track(origin,angle,charge*(.6+(i%4)*.8),.28+(i%3)*.13,progress,colors[i%4],.4+(i%3)*.3);
      }
      ctx.beginPath();ctx.arc(origin[0],origin[1],2,0,Math.PI*2);ctx.fillStyle='rgba(68,134,172,.4)';ctx.fill();
      ctx.restore();
    }
  }
  function resize() {
    width=innerWidth;height=innerHeight;
    const ratio=Math.min(devicePixelRatio||1,1.75);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);draw();
  }
  function tick(now) {
    frame=0;
    if(now-last>=33){time+=Math.min(now-last,100)*.00065;last=now;draw();}
    if(!paused&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;
    button.hidden=false;button.textContent=paused?'Play background':'Pause background';
    button.setAttribute('aria-pressed',String(!paused));
    if(!paused&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}
  }
  button.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('resize',resize);
  resize();sync();
})();
