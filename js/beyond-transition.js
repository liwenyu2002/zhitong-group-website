(() => {
  'use strict';

  const entry = document.querySelector('.teaser-entry');
  if (!entry) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let leaving = false;
  let timer;
  let prefetched = false;
  let flight, arrival;

  function rememberArrival() {
    if (!arrival) return;
    if (arrival.field) arrival.field.time = flight.time;
    try { sessionStorage.setItem('zhitong-beyond-arrival', JSON.stringify(arrival)); } catch {}
  }

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
    const reference = document.createElement('link');
    reference.rel = 'preload';
    reference.as = 'image';
    reference.href = '/_entry/eye-sculpture-v2.png';
    document.head.append(reference);

    const veil = document.createElement('div');
    veil.className = 'beyond-handoff';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = '<i class="beyond-handoff__scan"></i><i class="beyond-handoff__tear"></i><i class="beyond-handoff__line"></i>';
    const shade = document.createElement('div');
    shade.className = 'beyond-handoff__black';
    shade.setAttribute('aria-hidden', 'true');
    document.body.prepend(shade);
    document.body.append(veil);
    document.documentElement.classList.add('beyond-is-leaving');
    const portal = window.beyondPortal;
    const brain = window.labBrainSnapshot?.();
    if (brain?.points.length && portal) {
      document.documentElement.classList.add('beyond-has-brain');
      flight = portal.fly(brain);
    }

    timer = window.setTimeout(() => {
      const field = flight ? { points: brain.points, x: brain.x, y: brain.y } : null;
      arrival = { at: Date.now(), field };
      rememberArrival();
      location.assign(destination.href);
    }, portal?.handoff ?? 1270);
  });

  // Use the last drawn frame even if navigation takes a moment to commit.
  window.addEventListener('pagehide', rememberArrival);

  // A restored page must not keep the black transition over its content.
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !leaving) return;
    clearTimeout(timer);
    flight?.stop();
    document.documentElement.classList.remove('beyond-is-leaving', 'beyond-has-brain');
    document.querySelector('.beyond-handoff')?.remove();
    document.querySelector('.beyond-handoff__black')?.remove();
    flight = arrival = null;
    leaving = false;
  });
})();
