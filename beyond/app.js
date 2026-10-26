(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const reveals = [...document.querySelectorAll('.reveal')];
  const navLinks = [...document.querySelectorAll('[data-chapter]')];
  const chapterSections = [...document.querySelectorAll('[data-section]')];
  let frame = 0;

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

  function update() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 45);
    let current = '';
    chapterSections.forEach(section => {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.5) current = section.dataset.section;
    });
    navLinks.forEach(link => {
      if (link.dataset.chapter === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    frame = 0;
  }
  function schedule() { if (!frame) frame = window.requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  reduced.addEventListener?.('change', () => reveals.forEach(element => element.classList.add('visible')));
  update();
})();
