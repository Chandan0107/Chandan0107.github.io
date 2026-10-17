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
    // Illustrative height field of two damped waves, projected into 3D.
    // This is a visualisation of superposition, not a measured reconstruction.
    const time = phase * .7;
    const yaw = -.5 + Math.sin(time * .13) * .14;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const scale = Math.min(width * .125, height * .19);
    const count = width < 600 ? 28 : 40;
    function point(i, j) {
      const x = (i / count - .5) * 7;
      const z = (j / count - .5) * 7;
      const d1 = Math.hypot(x + 1.25, z);
      const d2 = Math.hypot(x - 1.25, z);
      const h = .42 * (Math.cos(d1 * 3.1 - time) / (1 + d1 * .28)
        + Math.cos(d2 * 3.1 - time) / (1 + d2 * .28));
      const rx = x * cy - z * sy;
      const rz = x * sy + z * cy;
      const depth = rz * .83 - h * .55;
      const perspective = 10 / (11 + depth);
      return { x: width * .73 + rx * scale * perspective,
        y: height * .53 + (rz * .40 - h * .92) * scale * perspective,
        h, depth };
    }
    const grid = Array.from({length: count + 1}, (_, j) =>
      Array.from({length: count + 1}, (_, i) => point(i, j)));
    const faces = [];
    for (let j = 0; j < count; j++) {
      for (let i = 0; i < count; i++) {
        const points = [grid[j][i], grid[j][i+1], grid[j+1][i+1], grid[j+1][i]];
        faces.push({points, depth: points.reduce((v,p) => v+p.depth,0)/4,
          height: points.reduce((v,p) => v+p.h,0)/4});
      }
    }
    faces.sort((a,b) => b.depth-a.depth);
    for (const face of faces) {
      const light = Math.max(0, Math.min(1, (face.height + .8) / 1.6));
      ctx.beginPath();
      face.points.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
      ctx.closePath();
      ctx.fillStyle = `rgba(${Math.round(110+light*45)},${Math.round(155+light*35)},210,${.07+light*.14})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(57,112,161,${.16+light*.22})`;
      ctx.lineWidth = .55;
      ctx.stroke();
    }
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
    button.textContent = paused ? 'Play background' : 'Pause background';
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
