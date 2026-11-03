(() => {
  const carousel = document.querySelector('.moments-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.moments-track');
  const originals = [...carousel.querySelectorAll('.moments-slide')];
  const videos = originals.map(slide => slide.querySelector('video'));
  const controls = carousel.querySelector('.moments-controls');
  const playButton = carousel.querySelector('.moments-play');
  const startButton = carousel.querySelector('.moments-start');
  const soundButton = carousel.querySelector('.moments-sound');
  const dots = [...carousel.querySelectorAll('.moments-dots button')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const firstClone = originals[0].cloneNode(true);
  const cloneVideo = firstClone.querySelector('video');
  firstClone.setAttribute('aria-hidden', 'true');
  cloneVideo.removeAttribute('controls');
  cloneVideo.preload = 'none';
  track.appendChild(firstClone);

  let current = 0;
  let visible = false;
  let userPaused = false;
  let switching = false;
  let transitionTimer = 0;
  let muted = false;
  let resumeAfterApp = false;
  let pausedBeforeApp = false;

  function notifyMoment(transitioning = false, index = current) {
    window.dispatchEvent(new CustomEvent('pmsg:moment', { detail: {
      index, time: transitioning ? 0 : videos[current].currentTime,
      playing: !transitioning && !videos[current].paused, visible, transitioning
    } }));
  }

  function updateControls() {
    const playing = !videos[current].paused && !videos[current].ended;
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.setAttribute('aria-label', playing ? '暂停视频' : '播放视频');
    soundButton.setAttribute('aria-pressed', String(!muted));
    soundButton.setAttribute('aria-label', muted ? '开启声音' : '关闭声音');
    dots.forEach((dot, index) => {
      if (index === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    originals.forEach((slide, index) => slide.setAttribute('aria-hidden', String(index !== current)));
    notifyMoment();
  }

  function playCurrent() {
    if (!visible || document.hidden || userPaused || switching) return;
    const video = videos[current];
    video.muted = muted;
    const playResult = video.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(error => {
        // Browsers can require a click before permitting audible playback.
        if (error.name !== 'AbortError' && video === videos[current] && visible && !document.hidden && !userPaused && video.paused) {
          startButton.hidden = false;
        }
        updateControls();
      });
    }
  }

  function goTo(target) {
    if (switching || target === current) return;
    const wrapForward = target === videos.length;
    const next = wrapForward ? 0 : target;
    if (next < 0 || next >= videos.length) return;
    switching = true;
    notifyMoment(true, next);
    videos[current].pause();
    track.style.transition = '';
    track.style.transform = `translate3d(-${target * 100}%, 0, 0)`;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(transitionTimer);
      track.removeEventListener('transitionend', onTransitionEnd);
      current = next;
      if (wrapForward) {
        track.style.transition = 'none';
        track.style.transform = 'translate3d(0, 0, 0)';
        void track.offsetWidth;
        track.style.transition = '';
      }
      videos[current].currentTime = 0;
      switching = false;
      updateControls();
      playCurrent();
    };
    const onTransitionEnd = event => {
      if (event.target === track && event.propertyName === 'transform') finish();
    };
    if (reducedMotion.matches) finish();
    else {
      track.addEventListener('transitionend', onTransitionEnd);
      transitionTimer = window.setTimeout(finish, 1000);
    }
  }

  videos.forEach((video, index) => {
    video.removeAttribute('controls');
    video.addEventListener('ended', () => {
      if (index === current && visible && !userPaused) goTo(current + 1);
      else updateControls();
    });
    video.addEventListener('playing', () => { startButton.hidden = true; updateControls(); });
    video.addEventListener('play', updateControls);
    video.addEventListener('pause', updateControls);
    ['timeupdate', 'seeked'].forEach(type => video.addEventListener(type, () => { if (index === current && !switching) notifyMoment(); }));
  });
  window.addEventListener('pmsg:moment-control', event => {
    if (event.detail?.action === 'pause-for-app') {
      pausedBeforeApp = userPaused;
      resumeAfterApp = !videos[current].paused;
      videos[current].pause();
      userPaused = true;
      updateControls();
    }
    if (event.detail?.action === 'resume-after-app') {
      userPaused = pausedBeforeApp;
      const shouldResume = resumeAfterApp || !userPaused;
      resumeAfterApp = false;
      if (shouldResume) playCurrent();
      updateControls();
    }
  });
  dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));
  startButton.addEventListener('click', () => {
    userPaused = false;
    playCurrent();
  });
  playButton.addEventListener('click', () => {
    if (!videos[current].paused && !videos[current].ended) {
      userPaused = true;
      videos[current].pause();
    } else {
      userPaused = false;
      if (videos[current].ended) videos[current].currentTime = 0;
      playCurrent();
    }
    updateControls();
  });
  soundButton.addEventListener('click', () => {
    muted = !muted;
    videos.forEach(video => { video.muted = muted; });
    playCurrent();
    updateControls();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos[current].pause();
    else playCurrent();
  });

  controls.hidden = false;
  updateControls();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) playCurrent();
      else videos[current].pause();
      notifyMoment();
    }, { threshold: 0.3 });
    observer.observe(carousel.querySelector('.moments-window'));
  } else {
    visible = true;
    playCurrent();
  }
})();
