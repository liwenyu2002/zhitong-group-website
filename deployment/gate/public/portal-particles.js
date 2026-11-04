(() => {
  'use strict';

  const handoff = 1270;
  const arrivalEnd = 1940;
  const scatterEnd = 820;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  const mix = (from, to, amount) => from + (to - from) * amount;

  function seededRandom(seed) {
    return () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
  }

  function makeParticles(origins, count) {
    const random = seededRandom(16481);
    return Array.from({ length: count }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const radius = .13 + .28 * Math.sqrt(random());
      const along = random() * 2 - 1;
      const iris = random() < .31;
      const irisAngle = random() * Math.PI * 2;
      const irisRadius = .078 + .082 * random();
      const lid = index % 2 ? .135 : -.158;
      const origin = origins[index];
      return {
        origin,
        targetX: iris ? Math.cos(irisAngle) * irisRadius : along * .37,
        targetY: .021 + (iris ? Math.sin(irisAngle) * irisRadius : lid * (1 - along * along) + (random() - .5) * .038),
        spreadX: Math.cos(angle) * radius,
        spreadY: Math.sin(angle) * radius * .83,
        phase: angle,
        launch: 348 + (1 - clamp(origin?.radial ?? 0)) * 172 + random() * 78,
        delay: random() * 102,
        duration: 378 + random() * 310,
        curl: (random() - .5) * .23,
        size: .86 + random() * 1.13,
        light: .38 + random() * .53
      };
    });
  }

  function fly(field, arriving = false) {
    const count = Math.min(1500, Math.max(0, Math.trunc(field?.count ?? field?.points?.length) || 0));
    if (!count) return null;

    const canvas = field.canvas ?? document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    if (arriving) {
      canvas.className = 'portal-particles';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.append(canvas);
    }

    const particles = makeParticles(field.points ?? [], count);
    const links = field.links ?? [];
    const from = arriving ? handoff : 0;
    const until = arriving ? arrivalEnd : handoff;
    const started = performance.now();
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    let width, height, frame;

    function draw(time) {
      if (width !== innerWidth || height !== innerHeight) {
        width = innerWidth;
        height = innerHeight;
        const pixelWidth = Math.round(width * scale), pixelHeight = Math.round(height * scale);
        if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
        if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      }
      context.save();
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);

      const eyeWidth = width <= 600 ? width * 1.16 : Math.min(840, width * .86);
      const span = Math.min(width, height);
      const cx = mix(field.x, .5, .36), cy = mix(field.y, .44, .36);
      const light = ease(clamp((time - 605) / 410));
      const tone = Math.round(50 + light * 174);
      const silver = 'rgb(' + tone + ' ' + (tone + 4) + ' ' + (tone + 3) + ')';
      const warm = 1 - ease(clamp((time - 462) / 383));
      const wake = ease(clamp((time - 30) / 300));
      const fade = 1 - ease(clamp((time - 1490) / 432));

      for (const particle of particles) {
        let x = Math.max(.13 * width, Math.min(.87 * width, cx * width + particle.spreadX * span));
        let y = Math.max(.14 * height, Math.min(.85 * height, cy * height + particle.spreadY * span));
        let size = particle.size;
        let alpha = particle.light * fade;
        let roundness = 1;
        let color = silver;
        particle.attached = false;

        if (time < scatterEnd && particle.origin) {
          const origin = particle.origin;
          const release = clamp((time - particle.launch) / (scatterEnd - particle.launch));
          const spread = 1 - Math.pow(1 - release, 1.9);
          const tremor = wake * (1 - release) * (2.5 + 5 * wake);
          const drift = Math.sin(Math.PI * spread) * span * .037;
          x = mix(origin.x * width, x, spread) + Math.sin(time * .068 + particle.phase) * tremor - Math.sin(particle.phase) * drift;
          y = mix(origin.y * height, y, spread) + Math.cos(time * .077 + particle.phase * 2) * tremor * .68 + Math.cos(particle.phase) * drift;
          size = mix(origin.size * (1 + .12 * wake), size, ease(release));
          alpha = mix(origin.alpha, alpha, wake);
          roundness = ease(clamp((release - .06) / .67));
          particle.attached = release < .035;
          const red = Math.round(mix(tone, 31 + 175 * origin.light, warm));
          const green = Math.round(mix(tone + 4, 30 + 92 * origin.light, warm));
          const blue = Math.round(mix(tone + 3, 27 + 45 * origin.light, warm));
          color = 'rgb(' + red + ' ' + green + ' ' + blue + ')';
        } else {
          const gather = ease(clamp((time - scatterEnd - particle.delay) / particle.duration));
          const dx = width / 2 + particle.targetX * eyeWidth - x;
          const dy = height * .42 + particle.targetY * eyeWidth - y;
          const turn = Math.sin(Math.PI * gather) * particle.curl;
          x += dx * gather - dy * turn;
          y += dy * gather + dx * turn;
        }
        particle.x = x;
        particle.y = y;
        particle.sizeNow = size;
        particle.alpha = alpha;
        particle.roundness = roundness;
        particle.color = color;
      }

      // Keep the original connections visible until their endpoints lift off.
      if (time < scatterEnd && links.length) {
        context.globalAlpha = .06 + wake * .12;
        context.strokeStyle = '#1f1e1b';
        context.lineWidth = 1;
        context.beginPath();
        for (const [i, j] of links) {
          const a = particles[i], b = particles[j];
          if (!a?.attached || !b?.attached) continue;
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
        }
        context.stroke();
      }

      for (const { x, y, sizeNow, alpha, roundness, color } of particles) {
        const half = sizeNow / 2;
        context.globalAlpha = alpha;
        context.fillStyle = color;
        if (roundness <= 0) {
          context.fillRect(x - half, y - half, sizeNow, sizeNow);
        } else {
          context.beginPath();
          if (roundness < .995 && typeof context.roundRect === 'function') {
            context.roundRect(x - half, y - half, sizeNow, sizeNow, half * roundness);
          } else {
            context.arc(x, y, half, 0, Math.PI * 2);
          }
          context.fill();
        }
      }
      context.restore();
    }

    function stop() {
      cancelAnimationFrame(frame);
      if (arriving) canvas.remove();
    }

    function tick(now) {
      const time = Math.min(until, from + Math.max(0, now - started));
      draw(time);
      if (time < until) frame = requestAnimationFrame(tick);
      else if (arriving) stop();
    }

    draw(from);
    frame = requestAnimationFrame(tick);
    return stop;
  }

  window.beyondPortal = { handoff, fly };
  if (document.currentScript.hasAttribute('data-portal-arrival')) {
    let arrival;
    try {
      const saved = sessionStorage.getItem('zhitong-beyond-arrival');
      sessionStorage.removeItem('zhitong-beyond-arrival');
      arrival = JSON.parse(saved);
    } catch {}
    if (arrival?.at && Date.now() - arrival.at < 15000 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('from-group-portal');
      fly(arrival.field, true);
    }
  }
})();
