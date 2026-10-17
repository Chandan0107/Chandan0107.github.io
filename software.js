(() => {
  'use strict';
  const section = document.querySelector('#software');
  if (!section) return;
  let started = false;
  async function load() {
    if (started) return;
    started = true;
    await Promise.all([...section.querySelectorAll('[data-repository]')].map(async card => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`https://api.github.com/repos/Chandan0107/${encodeURIComponent(card.dataset.repository)}`, {signal:controller.signal, credentials:'omit'});
        if (!response.ok) return;
        const repo = await response.json();
        if (![repo.stargazers_count,repo.forks_count,repo.open_issues_count].every(Number.isInteger)) return;
        const stats = card.querySelector('.repository-stats');
        stats.replaceChildren();
        function badge(label,value,extra='') {
          const badge=document.createElement('span');badge.className=`repo-stat ${extra}`;
          const key=document.createElement('span');key.textContent=label;
          const number=document.createElement('strong');number.textContent=String(value);
          badge.append(key,number);stats.append(badge);
        }
        badge('Stars',repo.stargazers_count);badge('Forks',repo.forks_count);
        // GitHub's open_issues_count includes pull requests, so label it accurately.
        badge('Issues + PRs',repo.open_issues_count);
        const date=new Date(repo.pushed_at);
        if (Number.isFinite(date.getTime())) {
          badge('Updated',date.toLocaleDateString('en-GB',{month:'short',year:'numeric'}),'updated');
        }
        stats.title='Live GitHub data, checked '+new Date().toLocaleString('en-GB');
        stats.hidden=false;
      } catch (_) {
        // Keep the repository usable when offline, blocked, or rate limited.
      } finally {clearTimeout(timeout);}
    }));
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}
    },{rootMargin:'200px'});
    observer.observe(section);
  } else load();
})();
