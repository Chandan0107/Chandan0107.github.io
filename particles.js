(() => {
  'use strict';
  const canvas = document.querySelector('#particle-background');
  const button = document.querySelector('#particle-toggle');
  if (!canvas || !button) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, width = 0, height = 0, frame = 0, last = 0, time = 8;
  // Artistic accretion flow and polar jets; not a relativistic ray-tracing simulation.
  const particles = Array.from({length: 950}, (_, i) => {
    const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    const seed = n - Math.floor(n);
    return {angle: i * 2.399963, radius: .45 + seed * 1.65,
      seed, size: .6 + (i % 4) * .3, jet: i % 4 === 0};
  });
  function draw() {
    ctx.clearRect(0,0,width,height);
    // Balance two accretion flows across the screen margins.
    for (const side of [0,1]) {
    const radius = Math.min(180,Math.max(95,width*.12));
    const cx = width * (side ? .93 : .07);
    const cy = height * (side ? .65 : .32);
    const tilt = -.48, c = Math.cos(tilt), s = Math.sin(tilt);
    function project(x,y,z=0) {
      const px = x, py = y*.32-z;
      return [cx+(px*c-py*s)*radius, cy+(px*s+py*c)*radius];
    }
    // A broad, cool halo and a warm ring provide depth on the white page.
    const halo = ctx.createRadialGradient(cx,cy,radius*.1,cx,cy,radius*2.4);
    halo.addColorStop(0,'rgba(81,111,162,.12)');
    halo.addColorStop(.5,'rgba(106,141,184,.09)');
    halo.addColorStop(1,'rgba(106,141,184,0)');
    ctx.fillStyle=halo;ctx.fillRect(cx-radius*2.4,cy-radius*2.4,radius*4.8,radius*4.8);
    // Disc streamlines turn at different rates as particles approach the centre.
    for(let ring=0;ring<18;ring++) {
      const r=.46+ring*.085;
      ctx.beginPath();
      for(let i=0;i<=100;i++) {
        const a=i/100*Math.PI*2;
        const [x,y]=project(Math.cos(a)*r,Math.sin(a)*r);
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.strokeStyle=`rgba(181,130,79,${.04+(1-ring/18)*.09})`;
      ctx.lineWidth=1;ctx.stroke();
    }
    const points=[];
    for(const p of particles) {
      if(p.jet)continue;
      const r=.45+((p.radius-.45-time*.008)%1.65+1.65)%1.65;
      const a=p.angle+time*.32/Math.pow(r,1.5);
      const [x,y]=project(Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*3+time*.2)*.025);
      const warm=Math.max(0,1-(r-.45)/1.65);
      points.push({x,y,r,p,a,warm,depth:Math.sin(a)});
    }
    points.sort((a,b)=>a.depth-b.depth);
    function paint(p) {
      const color=p.warm>.55?'202,141,70':'91,145,182';
      const length=.04+.065*p.warm;
      const [tx,ty]=project(Math.cos(p.a-length)*p.r,Math.sin(p.a-length)*p.r);
      ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(p.x,p.y);
      ctx.strokeStyle=`rgba(${color},${.18+p.warm*.30})`;ctx.lineWidth=p.p.size;ctx.stroke();
    }
    points.filter(p=>p.depth<0).forEach(paint);
    // Soft lensed-disc-inspired arch, drawn behind the central silhouette.
    for(let layer=0;layer<7;layer++) {
      ctx.beginPath();
      ctx.ellipse(cx,cy-radius*.035,radius*(.34+layer*.012),radius*(.43+layer*.009),tilt,Math.PI,Math.PI*2);
      ctx.strokeStyle=`rgba(220,165,94,${.11-layer*.012})`;
      ctx.lineWidth=2;ctx.stroke();
    }
    // Dark central silhouette, with a soft photon-ring-inspired rim.
    const rim=ctx.createRadialGradient(cx,cy,radius*.21,cx,cy,radius*.33);
    rim.addColorStop(0,'rgba(23,36,57,.85)');rim.addColorStop(.7,'rgba(36,50,74,.87)');
    rim.addColorStop(.82,'rgba(226,167,88,.65)');rim.addColorStop(1,'rgba(226,167,88,0)');
    ctx.fillStyle=rim;ctx.beginPath();ctx.arc(cx,cy,radius*.33,0,Math.PI*2);ctx.fill();
    points.filter(p=>p.depth>=0).forEach(paint);
    // Opposing jets spread gradually away from the rotation axis.
    for(const sign of [-1,1]) {
      const [ex,ey]=project(0,0,sign*2.5);
      const beam=ctx.createLinearGradient(cx,cy,ex,ey);
      beam.addColorStop(0,'rgba(75,157,199,.12)');
      beam.addColorStop(.45,'rgba(75,157,199,.055)');
      beam.addColorStop(1,'rgba(75,157,199,0)');
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);
      ctx.strokeStyle=beam;ctx.lineWidth=radius*.065;ctx.stroke();

      for(let i=0;i<100;i++) {
        const seed=(i*.61803398875)%1;
        const travel=(seed+time*.045)%1;
        const z=sign*(.18+travel*2.8);
        const spread=.025+travel*.12;
        const a=i*2.39996+time*.25;
        const [x,y]=project(Math.cos(a)*spread,Math.sin(a)*spread,z);
        const alpha=(1-travel)*.45;
        const glow=ctx.createRadialGradient(x,y,0,x,y,4);
        glow.addColorStop(0,`rgba(73,151,194,${alpha})`);
        glow.addColorStop(1,'rgba(73,151,194,0)');
        ctx.fillStyle=glow;ctx.fillRect(x-4,y-4,8,8);
      }
    }
    }
    // Distant points connect both sides of the composition.
    for(let i=0;i<28;i++) {
      const x=(Math.sin(i*71.3)*.5+.5)*width*.22;
      const y=((i/28+time*.003)%1)*height;
      ctx.beginPath();ctx.arc(x,y,.6+(i%3)*.3,0,Math.PI*2);
      ctx.fillStyle='rgba(83,128,166,.22)';ctx.fill();
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
    if(now-last>=33){time+=Math.min(now-last,100)*.001;last=now;draw();}
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
