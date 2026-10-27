(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reveals = [...document.querySelectorAll('.reveal')];
  const motionTargets = [];

  if ('IntersectionObserver' in window) {
    root.classList.add('js');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px 20px 0px' });
    reveals.forEach(element => revealObserver.observe(element));
  }

  function addMotion(surface, image, distance) {
    if (!surface || !image) return;
    let pending = 0;
    let position = null;

    function reset() {
      if (pending) window.cancelAnimationFrame(pending);
      pending = 0;
      position = null;
      image.style.removeProperty('--drift-x');
      image.style.removeProperty('--drift-y');
    }

    function move(event) {
      if (reduced.matches) return;
      const rect = surface.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      position = {
        x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
        y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2))
      };
      if (pending) return;
      pending = window.requestAnimationFrame(() => {
        image.style.setProperty('--drift-x', `${(position.x * distance).toFixed(2)}px`);
        image.style.setProperty('--drift-y', `${(position.y * distance * 0.6).toFixed(2)}px`);
        pending = 0;
      });
    }

    surface.addEventListener('pointermove', event => {
      if (event.pointerType !== 'touch') move(event);
    }, { passive: true });
    surface.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') move(event);
    }, { passive: true });
    surface.addEventListener('pointerleave', reset, { passive: true });
    surface.addEventListener('pointerup', reset, { passive: true });
    surface.addEventListener('pointercancel', reset, { passive: true });
    motionTargets.push(reset);
  }

  addMotion(document.querySelector('.hero'), document.querySelector('.hero-art img'), 7);
  document.querySelectorAll('.detail-art').forEach(surface => addMotion(surface, surface.querySelector('img'), 4));

  reduced.addEventListener?.('change', () => {
    reveals.forEach(element => element.classList.add('visible'));
    if (reduced.matches) motionTargets.forEach(reset => reset());
  });
})();
