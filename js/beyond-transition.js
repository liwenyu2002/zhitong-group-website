(() => {
  'use strict';

  const entry = document.querySelector('.teaser-entry');
  if (!entry) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let leaving = false;
  let timer;
  let prefetched = false;
  let stopParticles;

  function prefetch() {
    if (prefetched) return;
    prefetched = true;
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = entry.href;
    document.head.append(hint);
  }

  entry.addEventListener('pointerenter', prefetch, { once: true, passive: true });
  entry.addEventListener('focus', prefetch, { once: true });

  entry.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || entry.hasAttribute('download') ||
        (entry.target && entry.target !== '_self')) return;

    const destination = new URL(entry.href, location.href);
    if (destination.origin !== location.origin || reducedMotion.matches) return;

    event.preventDefault();
    if (leaving) return;
    leaving = true;
    prefetch();

    const veil = document.createElement('div');
    veil.className = 'beyond-handoff';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = '<i class="beyond-handoff__scan"></i><i class="beyond-handoff__tear"></i><i class="beyond-handoff__line"></i><i class="beyond-handoff__black"></i>';
    document.body.append(veil);
    document.documentElement.classList.add('beyond-is-leaving');
    const portal = window.beyondPortal;
    const brain = window.labBrainSnapshot?.() ?? [];
    stopParticles = portal?.fly(veil, { brain });
    const brainCount = stopParticles ? brain.length : 0;
    if (brainCount) document.documentElement.classList.add('beyond-has-brain');

    timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem('zhitong-beyond-arrival', JSON.stringify({ at: Date.now(), brainCount }));
      } catch {}
      location.assign(destination.href);
    }, portal?.handoff ?? 1120);
  });

  // A restored page must not keep the black transition over its content.
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !leaving) return;
    clearTimeout(timer);
    stopParticles?.();
    document.documentElement.classList.remove('beyond-is-leaving', 'beyond-has-brain');
    document.querySelector('.beyond-handoff')?.remove();
    leaving = false;
  });
})();
