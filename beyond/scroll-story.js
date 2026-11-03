(() => {
  'use strict';
  const story = document.querySelector('.feature-story');
  if (!story) return;
  const rail = story.querySelector('.feature-rail');
  const holder = story.querySelector('.phone-holder');
  const frame = document.querySelector('#story-app');
  const beats = [...story.querySelectorAll('[data-app-beat]')];
  const homeDemo = document.querySelector('.home-demo');
  const homeVideo = document.querySelector('#home-sofa-video');
  const homeStart = document.querySelector('.home-start');
  const caption = document.querySelector('#home-demo-caption');
  const channel = 'pmsg-scroll-story';
  const targetOrigin = location.protocol === 'file:' ? '*' : location.origin;
  let ready = false, activeBeat = null, visible = false, homeInView = false;
  let lastY = scrollY, direction = 'forward', pending = false, blocked = false, holdProgressUntil = 0;
  let momentState = { index: 0, time: 0, playing: false, visible: false };
  const pageStarts = ['focus', 'rest', 'moments', 'path'].map(id => beats.find(beat => beat.dataset.appBeat === id));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function post(type, detail = {}) {
    if (ready) frame.contentWindow.postMessage({ channel, type, ...detail }, targetOrigin);
  }
  function sizePhone() {
    const mobile = innerWidth <= 700;
    const availableHeight = mobile ? Math.max(320, innerHeight * .59) : Math.max(300, innerHeight - 95);
    const availableWidth = mobile ? innerWidth - 50 : rail.clientWidth - 12;
    const scale = Math.min(1, availableWidth / 390, availableHeight / 844);
    holder.style.setProperty('--phone-scale', scale.toFixed(4));
  }
  function syncBeat(force = false) {
    if (!activeBeat) return;
    const data = activeBeat.dataset;
    post('scene', { beat: data.appBeat, tab: data.appTab, signal: data.appSignal, memoryView: data.memoryView, direction });
    if (force) post('visibility', { visible });
  }
  function syncVideo() {
    const time = homeVideo.currentTime;
    let phase, label;
    if (time < 1) { phase = 'arrival'; label = '回家'; }
    else if (time < 7.8) { phase = 'home'; label = '已回家 · 接近沙发'; }
    else if (time < 10.5) { phase = 'recline'; label = '已躺下 · 确认当前状态'; }
    else if (time < 13.2) { phase = 'triggered'; label = '疲劳度 76 > 70 · 灯光调整中'; }
    else { phase = 'settled'; label = '灯光已调整 · 舒缓音乐播放中'; }
    homeDemo.dataset.phase = phase;
    caption.textContent = label;
    post('video', { time, phase, active: visible && activeBeat?.dataset.appBeat === 'rest' && !document.hidden });
  }
  async function playHome() {
    if (!homeInView || activeBeat?.dataset.appBeat !== 'rest' || document.hidden || homeVideo.ended) return;
    try {
      await homeVideo.play();
      blocked = false;
      homeStart.hidden = true;
    } catch (error) {
      if (error.name === 'NotAllowedError') { blocked = true; homeStart.hidden = false; }
    }
  }
  function update() {
    pending = false;
    if (Math.abs(scrollY - lastY) > 1) direction = scrollY >= lastY ? 'forward' : 'back';
    lastY = scrollY;
    const bounds = story.getBoundingClientRect();
    const nextVisible = bounds.top < innerHeight * .42 && bounds.bottom > innerHeight * .5;
    if (nextVisible !== visible) {
      visible = nextVisible;
      story.classList.toggle('phone-visible', visible);
      holder.inert = !visible;
      holder.setAttribute('aria-hidden', String(!visible));
      post('visibility', { visible });
    }
    const threshold = innerHeight * (innerWidth <= 700 ? .18 : .25);
    let next = beats[0];
    for (const beat of beats) if (beat.getBoundingClientRect().top <= threshold) next = beat;
    if (activeBeat !== next) {
      activeBeat = next;
      story.dataset.activeBeat = next.dataset.appBeat;
      story.dataset.activeTab = next.dataset.appTab;
      syncBeat();
      syncVideo();
      if (next.dataset.appBeat === 'rest') { blocked = false; playHome(); }
      else homeVideo.pause();
    }
    let position = 0;
    const travel = innerHeight * .5;
    const anchor = innerHeight * .35;
    for (let i = 1; i < pageStarts.length; i++) {
      const center = pageStarts[i].getBoundingClientRect().top + scrollY - anchor;
      const progress = (scrollY - (center - travel / 2)) / travel;
      if (progress <= 0) break;
      position = i - 1 + Math.min(1, progress);
      if (progress < 1) break;
    }
    if (performance.now() >= holdProgressUntil) post('progress', { position: reduced.matches ? Math.round(position) : position, direction });
    story.style.setProperty('--app-progress', position.toFixed(4));
    story.dataset.appProgress = position.toFixed(4);
    const tracesTop = beats.find(beat => beat.dataset.appBeat === 'traces').getBoundingClientRect().top;
    const memoryProgress = Math.max(0, Math.min(1, (innerHeight * .6 - tracesTop) / (innerHeight * .5)));
    post('memory-progress', { position: reduced.matches ? Math.round(memoryProgress) : memoryProgress });
    if (!visible) homeVideo.pause();
  }
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { sizePhone(); schedule(); });
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || (location.protocol !== 'file:' && event.origin !== location.origin)) return;
    const data = event.data;
    if (!data || data.channel !== channel) return;
    if (data.type === 'ready') { ready = true; update(); syncBeat(true); syncVideo(); post('moment', momentState); }
    if (data.type === 'wheel' && visible && Number.isFinite(data.delta)) window.scrollBy({ top: data.delta, behavior: 'instant' });
    if (data.type === 'navigate' && ready) {
      const index = ['status', 'home', 'memory', 'agent'].indexOf(data.tab);
      if (index < 0) return;
      const top = pageStarts[index].getBoundingClientRect().top + scrollY;
      const anchor = innerHeight * .35;
      const destination = index === 0 ? top + 35 : top - anchor + innerHeight * .25 + 5;
      holdProgressUntil = data.settledSwipe ? performance.now() + 1000 : 0;
      window.scrollTo({ top: destination, behavior: reduced.matches ? 'instant' : 'smooth' });
      if (data.settledSwipe) setTimeout(schedule, 1050);
    }
    if (data.type === 'scene-applied') holder.dataset.screen = data.tab;
    if (data.type === 'tab') holder.dataset.screen = data.tab;
    if (data.type === 'highlight-open') {
      homeVideo.pause();
      window.dispatchEvent(new CustomEvent('pmsg:moment-control', { detail: { action: 'pause-for-app' } }));
    }
    if (data.type === 'highlight-close') window.dispatchEvent(new CustomEvent('pmsg:moment-control', { detail: { action: 'resume-after-app' } }));
  });
  window.addEventListener('pmsg:moment', event => { momentState = event.detail; post('moment', momentState); });
  new IntersectionObserver(entries => {
    homeInView = entries[0].intersectionRatio > .38;
    if (homeInView && !blocked) playHome();
    else if (!homeInView) homeVideo.pause();
  }, { threshold: [0, .38, .7] }).observe(homeVideo);
  ['timeupdate', 'seeked', 'loadedmetadata'].forEach(type => homeVideo.addEventListener(type, syncVideo));
  homeVideo.addEventListener('play', () => { blocked = false; homeStart.hidden = true; });
  homeVideo.addEventListener('ended', () => {
    homeStart.querySelector('span').textContent = '↻';
    homeStart.setAttribute('aria-label', '重播回家场景');
    homeStart.hidden = false;
  });
  homeStart.addEventListener('click', () => {
    if (homeVideo.ended) homeVideo.currentTime = 0;
    blocked = false;
    playHome();
  });
  document.querySelector('#home-replay').addEventListener('click', () => { homeVideo.currentTime = 0; blocked = false; syncVideo(); playHome(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) homeVideo.pause(); else if (homeInView && !blocked) playHome(); syncVideo(); });
  sizePhone();
  update();
})();
