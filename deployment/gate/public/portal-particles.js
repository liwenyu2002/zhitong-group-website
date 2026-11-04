(() => {
  'use strict';

  const handoff = 1120;
  const arrivalEnd = 1780;
  const scatterEnd = 590;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);

  function seededRandom(seed) {
    return () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
  }

  function eyeTarget(random, index) {
    const along = random() * 2 - 1;
    const iris = random() < .31;
    const angle = random() * Math.PI * 2;
    const radius = .078 + .082 * random();
    const lid = index % 2 ? .135 : -.158;
    return {
      targetX: iris ? Math.cos(angle) * radius : along * .37,
      targetY: .021 + (iris ? Math.sin(angle) * radius : lid * (1 - along * along) + (random() - .5) * .038)
    };
  }

  // Both documents draw the same flight, so the last frame on the lab
  // page and the first frame at the gate use the same particle positions.
  function makeParticles() {
    const random = seededRandom(48271);
    return Array.from({ length: 320 }, (_, index) => {
      const side = index % 4;
      const lane = .08 + .84 * random();
      const edge = .015 + .065 * random();
      const x = side === 0 ? -edge : side === 1 ? 1 + edge : lane;
      const y = side === 2 ? -edge : side === 3 ? 1 + edge : lane;
      return {
        x, y,
        ...eyeTarget(random, index),
        bend: (random() - .5) * .42,
        start: 20 + Math.pow(random(), 1.55) * 440,
        duration: 710 + random() * 610,
        light: .32 + random() * .62,
        size: .64 + random() * 1.12,
        trail: .012 + random() * .027
      };
    });
  }

  function makeBrainParticles(origins, count) {
    const random = seededRandom(16481);
    return Array.from({ length: count }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const radius = .08 + .47 * Math.sqrt(random());
      return {
        origin: origins[index],
        ...eyeTarget(random, index),
        scatterX: .5 + Math.cos(angle) * radius,
        scatterY: .43 + Math.sin(angle) * radius * .96,
        phase: angle,
        launch: 285 + random() * 120,
        delay: random() * 120,
        duration: 435 + random() * 360,
        curl: (random() - .5) * .20,
        size: .68 + random() * 1.18,
        light: .33 + random() * .52
      };
    });
  }

  function fly(container, { arriving = false, brain = [], brainCount = brain.length } = {}) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    canvas.className = 'portal-particles';
    canvas.setAttribute('aria-hidden', 'true');
    container.append(canvas);

    const particles = makeParticles();
    const brainParticles = makeBrainParticles(brain, Math.min(1500, Math.max(0, Math.trunc(brainCount) || 0)));
    const from = arriving ? handoff : 0;
    const until = arriving ? arrivalEnd : handoff;
    const started = performance.now();
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    let width, height, frame;

    function draw(time) {
      if (width !== innerWidth || height !== innerHeight) {
        width = innerWidth;
        height = innerHeight;
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        context.setTransform(scale, 0, 0, scale, 0, 0);
        context.lineCap = 'round';
      }
      context.clearRect(0, 0, width, height);
      const compact = width <= 600;
      const eyeWidth = compact ? width * 1.16 : Math.min(840, width * .86);
      const convergence = Math.min(width, height);
      const light = clamp((time - 520) / 420);
      const tone = Math.round(62 + light * 151);
      const silver = 'rgb(' + tone + ' ' + (tone + 5) + ' ' + (tone + 4) + ')';
      context.strokeStyle = context.fillStyle = silver;

      for (let index = 0; index < (compact ? 208 : particles.length); index++) {
        const particle = particles[index];
        const progress = (time - particle.start) / particle.duration;
        if (progress <= 0 || progress >= 1) continue;

        const sx = particle.x * width;
        const sy = particle.y * height;
        const dx = width / 2 + particle.targetX * eyeWidth - sx;
        const dy = height * .42 + particle.targetY * eyeWidth - sy;
        const length = Math.hypot(dx, dy) || 1;
        const bend = particle.bend * convergence / length;
        const ahead = Math.pow(progress, 1.17);
        const behind = Math.pow(Math.max(0, progress - particle.trail), 1.17);
        const arc = Math.sin(Math.PI * ahead) * bend;
        const tailArc = Math.sin(Math.PI * behind) * bend;
        const x = sx + dx * ahead - dy * arc;
        const y = sy + dy * ahead + dx * arc;
        const alpha = particle.light * clamp(progress * 8) * clamp((1 - progress) * 5);

        context.globalAlpha = alpha * .56;
        context.lineWidth = particle.size * .64;
        context.beginPath();
        context.moveTo(sx + dx * behind - dy * tailArc, sy + dy * behind + dx * tailArc);
        context.lineTo(x, y);
        context.stroke();
        context.globalAlpha = alpha;
        context.fillRect(x, y, particle.size, particle.size);
      }

      // Each real brain dot trembles, breaks from its original position and
      // reaches a seeded scatter point. From there the two pages agree
      // on its position without storing or copying the original snapshot.
      const warm = 1 - ease(clamp((time - 305) / 420));
      const reveal = ease(clamp(time / 360));
      const dissolve = 1 - ease(clamp((time - 1270) / 480));
      for (const particle of brainParticles) {
        let x = particle.scatterX * width;
        let y = particle.scatterY * height;
        let size = particle.size;
        let alpha = particle.light * dissolve;

        if (time < scatterEnd && particle.origin) {
          const origin = particle.origin;
          const launch = clamp((time - particle.launch) / (scatterEnd - particle.launch));
          const spread = 1 - Math.pow(1 - launch, 2.4);
          const tremor = reveal * (1 - launch) * (4 + 9 * reveal);
          x = origin.x * width * (1 - spread) + x * spread + Math.sin(time * .066 + particle.phase) * tremor;
          y = origin.y * height * (1 - spread) + y * spread + Math.cos(time * .082 + particle.phase * 2) * tremor * .66;
          size += (origin.size - size) * (1 - spread);
          alpha += (origin.alpha - alpha) * (1 - reveal);
          const red = Math.round(tone + (31 + 175 * origin.light - tone) * warm);
          const green = Math.round(tone + 5 + (30 + 92 * origin.light - tone - 5) * warm);
          const blue = Math.round(tone + 4 + (27 + 45 * origin.light - tone - 4) * warm);
          context.fillStyle = 'rgb(' + red + ' ' + green + ' ' + blue + ')';
        } else {
          const gather = ease(clamp((time - scatterEnd - particle.delay) / particle.duration));
          const dx = width / 2 + particle.targetX * eyeWidth - x;
          const dy = height * .42 + particle.targetY * eyeWidth - y;
          const turn = Math.sin(Math.PI * gather) * particle.curl;
          x += dx * gather - dy * turn;
          y += dy * gather + dx * turn;
          context.fillStyle = silver;
        }
        context.globalAlpha = alpha;
        context.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }

    function stop() {
      cancelAnimationFrame(frame);
      canvas.remove();
    }

    function tick(now) {
      const time = Math.min(until, from + now - started);
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
      arrival = JSON.parse(sessionStorage.getItem('zhitong-beyond-arrival'));
      sessionStorage.removeItem('zhitong-beyond-arrival');
    } catch {}
    if (arrival?.at && Date.now() - arrival.at < 15000 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('from-group-portal');
      fly(document.body, { arriving: true, brainCount: arrival.brainCount });
    }
  }
})();
