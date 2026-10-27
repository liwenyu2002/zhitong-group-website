(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reveals = [...document.querySelectorAll('.reveal')];
  const motionTargets = [];
  const scrollImages = [];

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
    image.classList.add('motion-image');
    scrollImages.push({ surface, image });
    let pending = 0;
    let position = null;

    function reset() {
      if (pending) window.cancelAnimationFrame(pending);
      pending = 0;
      position = null;
      surface.classList.remove('motion-active');
      image.style.removeProperty('--drift-x');
      image.style.removeProperty('--drift-y');
    }

    function move(event) {
      if (reduced.matches) return;
      surface.classList.add('motion-active');
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

  addMotion(document.querySelector('.hero'), document.querySelector('.hero-art img'), 12);
  addMotion(document.querySelector('.afterglow'), document.querySelector('.afterglow-art img'), 9);
  document.querySelectorAll('.scene').forEach(surface => addMotion(surface, surface.querySelector('.scene-art img'), 10));
  document.querySelectorAll('.paired-scene').forEach(surface => addMotion(surface, surface.querySelector('.paired-art img'), 8));
  document.querySelectorAll('.detail').forEach(surface => addMotion(surface, surface.querySelector('.detail-art img'), 9));
  addMotion(document.querySelector('.closing'), document.querySelector('.closing-art img'), 8);

  // Scroll provides the same quiet sense of depth on touch screens, without intercepting gestures.
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    if (reduced.matches) return;
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    scrollImages.forEach(({ surface, image }) => {
      const rect = surface.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport) return;
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - viewport / 2) / (viewport / 2 + rect.height / 2)));
      image.style.setProperty('--scroll-y', `${(progress * 14).toFixed(2)}px`);
    });
  }
  function scheduleScroll() {
    if (!scrollFrame && !reduced.matches) scrollFrame = window.requestAnimationFrame(updateScroll);
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });
  scheduleScroll();

  reduced.addEventListener?.('change', () => {
    reveals.forEach(element => element.classList.add('visible'));
    if (reduced.matches) {
      motionTargets.forEach(reset => reset());
      scrollImages.forEach(({ image }) => image.style.removeProperty('--scroll-y'));
    } else {
      scheduleScroll();
    }
  });
})();
