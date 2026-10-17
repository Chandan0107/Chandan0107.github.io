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
    // Two coherent sources: intersecting circular wavefronts, purely illustrative.
    const spacing = 43;
    const sources = [[width * .77, height * .2], [width * 1.05, height * .72]];
    const reach = Math.hypot(width, height) * 1.4;
    for (const [x, y] of sources) {
      for (let r = phase % spacing + 1; r < reach; r += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(76, 112, 145, 0.13)';
        ctx.lineWidth = .8;
        ctx.stroke();
      }
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
    if (now - last >= 50) {
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
