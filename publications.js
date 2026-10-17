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
  const cards = [...gallery.querySelectorAll('.publication-row')];
  const filters = gallery.querySelector('.publication-filters');
  const status = gallery.querySelector('.publication-count');
  const motion = gallery.querySelector('.gallery-motion');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches, visible = false;
  function syncMotion() {
    gallery.classList.toggle('motion-running', !paused && visible && !document.hidden);
    motion.textContent = paused ? 'Play motion' : 'Pause motion';
    motion.setAttribute('aria-pressed', String(!paused));
  }
  filters.hidden = false;
  motion.hidden = false;
  filters.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0;
    cards.forEach(card => {
      card.hidden = button.dataset.topic !== 'all' && button.dataset.topic !== card.dataset.topic;
      if (!card.hidden) count++;
    });
    status.textContent = `${count} ${count === 1 ? 'publication' : 'publications'} · Select a figure to explore`;
  }));
  motion.addEventListener('click', () => { paused = !paused; syncMotion(); });
  preference.addEventListener('change', () => { paused = preference.matches; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncMotion(); }).observe(gallery);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  cards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (paused || preference.matches || !finePointer.matches) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty('--tilt-x', `${-(event.clientY-box.top-box.height/2)/box.height*3}deg`);
      card.style.setProperty('--tilt-y', `${(event.clientX-box.left-box.width/2)/box.width*3}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y');
    });
  });
  syncMotion();
})();
