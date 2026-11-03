(() => {
  'use strict';
  const entry = document.querySelector('#entry');
  const eye = document.querySelector('.eye');
  const form = document.querySelector('#passphrase-form');
  const input = document.querySelector('#passphrase');
  const status = document.querySelector('#entry-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let busy = false, composing = false, compositionEndedAt = -Infinity, errorTimer;

  function resetGaze() {
    for (const key of ['--look-x', '--look-y', '--tilt-x', '--tilt-y', '--iris-x', '--iris-y']) entry.style.removeProperty(key);
  }
  window.addEventListener('pointermove', event => {
    if (busy || reduced.matches || event.pointerType === 'touch') return;
    const x = Math.max(-1, Math.min(1, (event.clientX / innerWidth - .5) * 2));
    const y = Math.max(-1, Math.min(1, (event.clientY / innerHeight - .44) * 2));
    entry.style.setProperty('--look-x', (x * 2).toFixed(2) + 'px');
    entry.style.setProperty('--look-y', (y * 1.2).toFixed(2) + 'px');
    entry.style.setProperty('--tilt-x', (-y * .8).toFixed(2) + 'deg');
    entry.style.setProperty('--tilt-y', (x * 1.1).toFixed(2) + 'deg');
    entry.style.setProperty('--iris-x', (x * 7).toFixed(2) + 'px');
    entry.style.setProperty('--iris-y', (y * 3).toFixed(2) + 'px');
  }, { passive: true });
  document.addEventListener('pointerleave', resetGaze);
  input.addEventListener('focus', () => entry.classList.add('is-focused'));
  input.addEventListener('blur', () => entry.classList.remove('is-focused'));
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; compositionEndedAt = performance.now(); });

  function refuse(message) {
    clearTimeout(errorTimer);
    entry.classList.remove('is-error');
    void entry.offsetWidth;
    entry.classList.add('is-error');
    entry.dispatchEvent(new Event('entry:deny'));
    status.textContent = message;
    errorTimer = setTimeout(() => entry.classList.remove('is-error'), 1250);
    input.readOnly = false;
    input.focus({ preventScroll: true });
    input.select();
  }

  async function enter() {
    clearTimeout(errorTimer);
    entry.classList.remove('is-error', 'is-checking');
    entry.classList.add('is-unlocking');
    resetGaze();
    input.value = '';
    input.blur();
    status.textContent = '验证通过，正在进入。';
    const frame = document.createElement('iframe');
    frame.className = 'destination';
    frame.title = '看见之外';
    frame.allow = 'autoplay; fullscreen';
    const loaded = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('load_timeout')), 18000);
      frame.addEventListener('load', async () => {
        try {
          if (!frame.contentDocument.querySelector('#opening')) throw new Error('not_authorized');
          await frame.contentDocument.fonts.ready;
          clearTimeout(timeout);
          frame.classList.add('is-ready');
          resolve();
        } catch (error) { clearTimeout(timeout); reject(error); }
      }, { once: true });
    });
    frame.src = '/beyond/';
    document.body.append(frame);
    try {
      // Prepare the destination under the eye before releasing the particles.
      // Its first frame then emerges through the gaps in the scattering cloud.
      await loaded;
      entry.classList.add('is-dispersing');
      entry.dispatchEvent(new Event('entry:scatter'));
      const motion = window.entryEye?.ready ? window.entryEye.unlock(1650) : reduced.matches ? Promise.resolve() : eye.animate([
        { opacity: 1 }, { opacity: 0 }
      ], { duration: 700, easing: 'ease-out', fill: 'forwards' }).finished;
      await motion;
      entry.classList.add('is-revealing');
      entry.inert = true;
      frame.focus();
      setTimeout(() => { entry.remove(); frame.contentWindow.focus(); }, reduced.matches ? 0 : 750);
    } catch {
      location.replace('/beyond/');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    // Let the IME commit its Chinese candidate normally; only a subsequent
    // Enter should submit the completed phrase.
    if (busy || composing || performance.now() - compositionEndedAt < 80 || !input.value) return;
    busy = true;
    input.readOnly = true;
    form.setAttribute('aria-busy', 'true');
    entry.classList.add('is-checking');
    try {
      const response = await fetch('/_entry/unlock', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: input.value }),
        signal: AbortSignal.timeout(12000)
      });
      if (response.ok) { await enter(); return; }
      refuse(response.status === 429 ? '尝试次数较多，请稍后重试。' : '密令有误，请重试。');
    } catch {
      refuse('暂时无法连接，请重试。');
    } finally {
      entry.classList.remove('is-checking');
      form.removeAttribute('aria-busy');
      if (!entry.classList.contains('is-unlocking')) { busy = false; input.readOnly = false; }
    }
  });
  if (matchMedia('(pointer:fine)').matches) input.focus({ preventScroll: true });
})();

(() => {
  'use strict';
  const entry = document.querySelector('#entry');
  const input = document.querySelector('#passphrase');
  const line = document.querySelector('.input-line');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.id = 'input-flow';
  canvas.setAttribute('aria-hidden', 'true');
  line.append(canvas);
  const context = canvas.getContext('2d', { alpha:true });
  if (!context) { canvas.remove(); return; }

  const abort = new AbortController();
  const particles = [];
  let width = 1, height = 1, dpr = 1, span = 214;
  let time = 0, previous = performance.now(), focus = 0, activity = 0, errorAt = -10000;
  let releasedAt = null, frame, disposed = false;
  let seed = 8161;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t*t*(3-2*t); };
  for (let index = 0; index < 280; index++) {
    particles.push({
      phase:random(), lane:random(), speed:18 + random()*22,
      radius:.27 + Math.pow(random(),2)*.48,
      brightness:.28 + random()*.64, seed:random(),
      x:0, y:0, alpha:0
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    if (releasedAt === null) span = line.getBoundingClientRect().width;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function place(particle) {
    // Points travel through soft ends at steady brightness; they do not blink.
    const along = (particle.phase + time*particle.speed/span) % 1;
    const envelope = Math.pow(Math.sin(Math.PI*along), .65);
    const laneAngle = particle.lane*Math.PI*2;
    const curl = along*Math.PI*2 + time*.65 + laneAngle;
    const spread = 1.6 + (1-focus)*.9 + activity*.8;
    particle.x = width*.5 + (along-.5)*span*1.08;
    particle.y = height*.5 + Math.sin(curl)*spread*(.3+particle.lane)
      + Math.sin(curl*1.7 + laneAngle)*.55;
    particle.alpha = particle.brightness*envelope*(.50+focus*.32+activity*.14);
  }
  function release() {
    if (releasedAt !== null) return;
    errorAt = -10000;
    const rect = canvas.getBoundingClientRect();
    const eye = document.querySelector('.eye-position').getBoundingClientRect();
    const eyeX = eye.left + eye.width*.5, eyeY = eye.top + eye.height*.53;
    for (const particle of particles) {
      place(particle);
      particle.startX = rect.left + particle.x;
      particle.startY = rect.top + particle.y;
      particle.startAlpha = particle.alpha;
      const angle = Math.atan2(particle.startY-eyeY, particle.startX-eyeX) + (particle.seed-.5)*1.8;
      const speed = Math.hypot(innerWidth,innerHeight)*(.14+particle.lane*.28);
      particle.vx = Math.cos(angle)*speed;
      particle.vy = Math.sin(angle)*speed;
    }
    releasedAt = performance.now();
    canvas.classList.add('is-released');
    entry.append(canvas);
    resize();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame); observer.disconnect(); abort.abort();
    window.entryInputFlow = null;
  }
  function draw(now) {
    if (!entry.isConnected) { dispose(); return; }
    const dt = Math.min(.05, Math.max(0,(now-previous)/1000));
    previous = now;
    time += reduced.matches ? 0 : dt;
    focus += ((document.activeElement===input?1:0)-focus)*(1-Math.exp(-dt*7));
    activity *= Math.exp(-dt*2.4);
    const errorAge = (now-errorAt)/1000;
    const red = errorAge<.14 ? smooth(errorAge/.14) : errorAge<.52 ? 1 : 1-smooth((errorAge-.52)/.68);
    context.clearRect(0,0,width,height);
    for (const particle of particles) {
      let x, y, alpha, radius = particle.radius;
      if (releasedAt === null) {
        place(particle);
        x = particle.x; y = particle.y; alpha = particle.alpha;
        if (!reduced.matches && red>0) x += Math.sin(errorAge*37)*red*3;
      } else {
        const age = Math.max(0,(now-releasedAt)/1000-particle.seed*.12);
        const travel = age-.055*(1-Math.exp(-age/.055));
        const bend = (particle.seed-.5)*travel*travel*.5;
        x = particle.startX + particle.vx*travel - particle.vy*bend;
        y = particle.startY + particle.vy*travel + particle.vx*bend;
        alpha = particle.startAlpha*(1-smooth((age-.1)/.9));
        if (reduced.matches) alpha = 0;
        radius *= 1-smooth(age/1.4)*.5;
      }
      if (alpha<.002) continue;
      const green = Math.round(225-red*190), blue = Math.round(225-red*180);
      context.fillStyle = `rgba(${Math.round(225+red*25)},${green},${blue},${alpha})`;
      context.beginPath();
      context.ellipse(x,y,radius*1.28,radius,0,0,Math.PI*2);
      context.fill();
    }
    frame = requestAnimationFrame(draw);
  }
  input.addEventListener('input', () => { activity = Math.min(1,activity+.45); }, { signal:abort.signal });
  entry.addEventListener('entry:deny', () => { errorAt = performance.now(); }, { signal:abort.signal });
  entry.addEventListener('entry:scatter', release, { signal:abort.signal });
  window.entryInputFlow = { getState:() => ({ count:particles.length, time, released:releasedAt!==null, renderer:'particle-stream' }) };
  draw(performance.now());
})();
