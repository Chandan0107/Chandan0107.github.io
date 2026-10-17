(() => {
  'use strict';
  const section = document.querySelector('.intro');
  const canvas = document.querySelector('.wave-background');
  const button = document.querySelector('.wave-toggle');
  if (!section || !canvas || !button) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, frame = 0, last = 0, phase = 0;
  let visible = false, paused = preference.matches;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!width || !height) return;
    // An extended wire surface avoids the visible edges of filled polygon tiles.
    const time = phase * .7;
    const yaw = -.5 + Math.sin(time * .13) * .10;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const scale = Math.min(width * .125, height * .19);
    function point(x,z) {
      const d1 = Math.hypot(x + 1.25,z), d2 = Math.hypot(x - 1.25,z);
      const h = .42 * (Math.cos(d1*3.1-time)/(1+d1*.28)
        + Math.cos(d2*3.1-time)/(1+d2*.28));
      const rx=x*cy-z*sy, rz=x*sy+z*cy;
      return [width*.73+rx*scale, height*.5+(rz*.4-h*.92)*scale];
    }
    ctx.lineWidth=.65;
    // Draw continuous lines in both directions; extend past the viewport.
    for (let axis=0;axis<2;axis++) {
      for(let row=-28;row<=28;row++) {
        const fixed=row*.25;
        const alpha=.24*Math.exp(-Math.pow(fixed/5.8,4));
        ctx.strokeStyle=`rgba(57,112,161,${alpha})`;
        ctx.beginPath();
        for(let j=0;j<=110;j++) {
          const variable=-9+j*18/110;
          const [x,y]=axis?point(fixed,variable):point(variable,fixed);
          j?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        ctx.stroke();
      }
    }
    // Multiply the actual drawing by smooth masks at all four canvas edges.
    // End pixels are transparent even when the surface extends beyond the canvas.
    ctx.save();
    ctx.globalCompositeOperation='destination-in';
    const horizontal=ctx.createLinearGradient(0,0,width,0);
    horizontal.addColorStop(0,'rgba(0,0,0,0)');
    horizontal.addColorStop(.30,'rgba(0,0,0,0)');
    horizontal.addColorStop(.60,'rgba(0,0,0,.7)');
    horizontal.addColorStop(.78,'rgba(0,0,0,1)');
    horizontal.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=horizontal;ctx.fillRect(0,0,width,height);
    const vertical=ctx.createLinearGradient(0,0,0,height);
    vertical.addColorStop(0,'rgba(0,0,0,0)');
    vertical.addColorStop(.22,'rgba(0,0,0,1)');
    vertical.addColorStop(.65,'rgba(0,0,0,1)');
    vertical.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=vertical;ctx.fillRect(0,0,width,height);
    ctx.restore();
  }
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }
  function tick(now) {
    frame = 0;
    if (now - last >= 33) {
      phase += Math.min(now - last, 100) * .005;
      last = now;
      draw();
    }
    if (visible && !paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    button.hidden = false;
    button.textContent = paused ? 'Play waves' : 'Pause waves';
    button.setAttribute('aria-pressed', String(!paused));
    if (visible && !paused && !document.hidden) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  button.addEventListener('click', () => { paused = !paused; sync(); });
  preference.addEventListener('change', () => { paused = preference.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(section);
  new ResizeObserver(resize).observe(canvas);
  resize();
})();
