(() => {
  const dialog = document.querySelector('.figure-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('p');
  document.querySelectorAll('.paper-thumbnail').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      image.src = link.href;
      image.alt = link.dataset.figureCaption;
      caption.textContent = link.dataset.figureCaption;
      dialog.showModal();
    });
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
})();

(() => {
  const gallery = document.querySelector('.publication-gallery');
  if (!gallery) return;
  const cards = [...gallery.querySelectorAll('.publication-row, .conference-row')];
  const filters = gallery.querySelector('.publication-filters');
  const status = gallery.querySelector('.publication-count');
  const motion = gallery.querySelector('.gallery-motion');
  const tabs = [...gallery.querySelectorAll('[role="tab"]')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = gallery.querySelector('.publication-field');
  const ctx = null; // Section drawing replaced by the shared full-screen background.
  let paused = preference.matches, visible = false, topic = 'all', kind = 'journal';
  let width = 0, height = 0, frame = 0, last = 0, time = 0;
  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const rows = Math.min(50, Math.ceil(height / 35));
    for (let row = 0; row < rows; row++) {
      const base = row / rows * (height + 100) - 50;
      const path = x => base + Math.sin(x / 135 - time + row * .19) * 22
        + Math.sin(x / 240 + time * .65 + row * .12) * 30;
      const glow = .09 + .06 * (1 + Math.sin(row * .23 + time));
      ctx.beginPath();
      for (let x = -20; x <= width + 20; x += 12) {
        x === -20 ? ctx.moveTo(x, path(x)) : ctx.lineTo(x, path(x));
      }
      ctx.lineWidth = .8;
      ctx.strokeStyle = `rgba(55,128,179,${glow})`;
      ctx.stroke();
      const x = ((time * 37 + row * 83) % (width + 80)) - 40;
      const y = path(x);
      const light = ctx.createRadialGradient(x,y,0,x,y,15);
      light.addColorStop(0,'rgba(66,167,205,.42)');
      light.addColorStop(1,'rgba(66,167,205,0)');
      ctx.fillStyle = light;
      ctx.fillRect(x-15,y-15,30,30);
    }
  }
  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    if (!ctx) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0); render();
  }
  function tick(now) {
    frame = 0;
    if (now-last >= 40) { time += Math.min(now-last,100)*.00055; last=now; render(); }
    if (!paused && visible && !document.hidden) frame=requestAnimationFrame(tick);
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame=0;
    const running = !paused && visible && !document.hidden;
    gallery.classList.toggle('motion-running', running);
    motion.textContent = paused ? 'Play motion' : 'Pause motion';
    motion.setAttribute('aria-pressed', String(!paused));
    if (paused) cards.forEach(c => {c.style.removeProperty('--tilt-x');c.style.removeProperty('--tilt-y');});
    if (running && ctx) {last=performance.now();frame=requestAnimationFrame(tick);}
  }
  function update() {
    document.querySelector('#journal-panel').hidden = kind !== 'journal';
    document.querySelector('#conference-panel').hidden = kind !== 'conference';
    let count=0;
    cards.forEach(card => {
      const matchesKind=card.classList.contains(kind==='journal'?'publication-row':'conference-row');
      card.hidden=topic!=='all' && topic!==card.dataset.topic;
      if(matchesKind && !card.hidden)count++;
    });
    status.textContent = kind === 'journal' ? `${count} journal ${count === 1 ? 'paper' : 'papers'} · Select a figure to explore` : `${count} conference ${count === 1 ? 'contribution' : 'contributions'}`;
    filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===topic)));
    tabs.forEach(tab=>{const selected=tab.dataset.kind===kind;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
  }
  gallery.querySelector('.publication-tabs').hidden=false;
  gallery.querySelector('.conference-fallback').hidden=true;
  filters.hidden=false; motion.hidden=false;
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>{kind=tab.dataset.kind;topic='all';update();});
    tab.addEventListener('keydown',event=>{
      let target;
      if(event.key==='ArrowRight'||event.key==='ArrowLeft')target=tabs[1-i];
      if(event.key==='Home')target=tabs[0];
      if(event.key==='End')target=tabs[1];
      if(target){event.preventDefault();target.click();target.focus();}
    });
  });
  filters.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{topic=button.dataset.topic;update();}));
  motion.addEventListener('click',()=>{paused=!paused;syncMotion();});
  preference.addEventListener('change',()=>{paused=preference.matches;syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();}).observe(gallery);
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  cards.forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(paused||preference.matches||!finePointer.matches)return;
      const box=card.getBoundingClientRect();
      card.style.setProperty('--tilt-x',`${-(event.clientY-box.top-box.height/2)/box.height*3}deg`);
      card.style.setProperty('--tilt-y',`${(event.clientX-box.left-box.width/2)/box.width*3}deg`);
    });
    card.addEventListener('pointerleave',()=>{card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
  });
  new ResizeObserver(resize).observe(canvas);
  update(); resize(); syncMotion();
})();
