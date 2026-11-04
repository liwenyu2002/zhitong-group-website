(() => {
  'use strict';

  const handoff = 1270;
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
      const targetX = iris ? Math.cos(irisAngle) * irisRadius : along * .37;
      const targetY = iris ? Math.sin(irisAngle) * irisRadius : lid * (1 - along * along) + (random() - .5) * .038;
      return {
        origin, iris, targetX, targetY,
        spreadX: Math.cos(angle) * radius,
        spreadY: Math.sin(angle) * radius * .83,
        phase: angle,
        launch: 348 + (1 - clamp(origin?.radial ?? 0)) * 172 + random() * 78,
        delay: random() * 102,
        duration: 1130 + random() * 300,
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
    const entry = arriving ? document.querySelector('#entry') : null;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const listeners = new AbortController();
    if (arriving) {
      canvas.className = 'portal-particles';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.append(canvas);
    }

    const particles = makeParticles(field.points ?? [], count);
    const links = field.links ?? [];
    const from = arriving ? Math.max(handoff - 65, Math.min(handoff + 360, field.time ?? handoff)) : 0;
    const started = performance.now();
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    let width, height, frame;
    let lastTime = from;
    let burst, controller, bridge;
    let errorAt = -Infinity;
    let gazeX = 0, gazeY = 0, targetX = 0, targetY = 0;

    function draw(time, now) {
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
      const errorAge = now - errorAt;
      const error = errorAge < 160 ? ease(clamp(errorAge / 160)) : 1 - ease(clamp((errorAge - 410) / 790));
      const shake = !reduced.matches && errorAge < 640 ? Math.sin(errorAge * .047) * 15 * (1 - errorAge / 640) : 0;
      const silver = 'rgb(' + Math.round(mix(tone, 247, error)) + ' ' +
        Math.round(mix(tone + 4, 55, error)) + ' ' + Math.round(mix(tone + 3, 67, error)) + ')';
      const warm = 1 - ease(clamp((time - 462) / 383));
      const wake = ease(clamp((time - 30) / 300));
      const drift = reduced.matches ? 0 : ease(clamp((time - 1660) / 450));
      const idle = Math.max(0, time - 1660);
      const orbit = idle * .00016 * drift;
      const irisCos = Math.cos(orbit), irisSin = Math.sin(orbit);
      const burstProgress = burst ? clamp((now - burst.at) / burst.duration) : 0;
      gazeX = mix(gazeX, targetX, .055);
      gazeY = mix(gazeY, targetY, .055);

      for (const particle of particles) {
        let x = Math.max(.13 * width, Math.min(.87 * width, cx * width + particle.spreadX * span));
        let y = Math.max(.14 * height, Math.min(.85 * height, cy * height + particle.spreadY * span));
        let size = particle.size;
        let alpha = particle.light;
        let roundness = 1;
        let color = silver;
        let velocityX = 0, velocityY = 0;
        particle.attached = false;

        if (burst) {
          const flight = clamp((burstProgress - particle.delay / 850) / .88);
          const distance = span * particle.speed * Math.pow(flight, 1.17);
          const turn = distance * flight * particle.curl * 1.8;
          x = particle.burstX * width + particle.vx * distance - particle.vy * turn;
          y = particle.burstY * height + particle.vy * distance + particle.vx * turn;
          size = particle.burstSize * (1 + .18 * Math.sin(flight * Math.PI));
          alpha = particle.burstAlpha * (1 - ease(clamp((flight - .15) / .83)));
        } else {
          const origin = particle.origin;
          const launch = origin ? particle.launch : 830 + particle.delay;
          const duration = origin ? particle.duration : 800;
          const elapsed = time - launch;
          const clock = clamp(elapsed / duration);
          const t = ease(clock), q = 1 - t;
          let eyeX = particle.targetX, eyeY = particle.targetY;
          if (particle.iris && drift) {
            eyeX = particle.targetX * irisCos - particle.targetY * irisSin;
            eyeY = particle.targetX * irisSin + particle.targetY * irisCos;
          }
          const movement = Math.sin(idle * .002 + particle.phase) * drift;
          const endX = width / 2 + eyeX * eyeWidth + drift * gazeX * (particle.iris ? 7 : 2) + shake;
          const endY = height * .42 + (.021 + eyeY) * eyeWidth + drift * gazeY * (particle.iris ? 4 : 1.2) + movement * 1.4;
          const startX = origin ? origin.x * width : x;
          const startY = origin ? origin.y * height : y;
          // The scatter position steers the curve. The dot never stops there.
          const bend = span * (.035 + particle.curl * .19);
          const arcX = -Math.sin(particle.phase) * bend;
          const arcY = Math.cos(particle.phase) * bend;
          const firstX = mix(startX, x, 1.13) + arcX;
          const firstY = mix(startY, y, 1.13) + arcY;
          const secondX = mix(endX, x, 1.02) - arcX;
          const secondY = mix(endY, y, 1.02) - arcY;
          x = q*q*q*startX + 3*q*q*t*firstX + 3*q*t*t*secondX + t*t*t*endX;
          y = q*q*q*startY + 3*q*q*t*firstY + 3*q*t*t*secondY + t*t*t*endY;
          const rate = 18 * clock * (1 - clock) / duration;
          velocityX = (q*q*(firstX-startX) + 2*q*t*(secondX-firstX) + t*t*(endX-secondX)) * rate;
          velocityY = (q*q*(firstY-startY) + 2*q*t*(secondY-firstY) + t*t*(endY-secondY)) * rate;
          size *= 1 + t * (.32 + .055 * movement);
          alpha = Math.min(1, alpha * (1 + t * .15));
          if (origin && (elapsed < 440 || warm > 0)) {
            const lift = ease(clamp(elapsed / 440));
            const tremor = wake * (1 - lift) * (2.5 + 5 * wake);
            x += Math.sin(time * .068 + particle.phase) * tremor;
            y += Math.cos(time * .077 + particle.phase * 2) * tremor * .68;
            size = mix(origin.size * (1 + .12 * wake), size, lift);
            alpha = mix(origin.alpha, alpha, wake);
            roundness = lift;
            particle.attached = elapsed < 65;
            const red = Math.round(mix(tone, 31 + 175 * origin.light, warm));
            const green = Math.round(mix(tone + 4, 30 + 92 * origin.light, warm));
            const blue = Math.round(mix(tone + 3, 27 + 45 * origin.light, warm));
            color = 'rgb(' + red + ' ' + green + ' ' + blue + ')';
          }
        }
        particle.x = x;
        particle.y = y;
        particle.sizeNow = size;
        particle.alpha = alpha;
        particle.roundness = roundness;
        particle.color = color;
        particle.velocityX = velocityX;
        particle.velocityY = velocityY;
      }

      // Keep the original connections visible until their endpoints lift off.
      if (time < 680 && links.length) {
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
      listeners.abort();
      if (arriving) canvas.remove();
      if (controller && window.entryEye === controller) window.entryEye = null;
      if (bridge && window.beyondEyeBridge === bridge) window.beyondEyeBridge = null;
    }

    function tick(now) {
      if (entry && !entry.isConnected) { stop(); return; }
      const elapsed = from + Math.max(0, now - started);
      const time = arriving ? elapsed : Math.min(elapsed, handoff + 360);
      lastTime = time;
      draw(time, now);
      if (burst && now - burst.at >= burst.duration) {
        burst.resolve();
        stop();
      } else if (arriving || time < handoff + 360) {
        frame = requestAnimationFrame(tick);
      }
    }

    if (entry) {
      entry.classList.add('has-brain-eye');
      entry.dataset.renderer = 'brain-particles';
      entry.dataset.points = String(count);
      const options = { passive: true, signal: listeners.signal };
      window.addEventListener('pointermove', event => {
        if (burst || reduced.matches || event.pointerType === 'touch') return;
        targetX = clamp(event.clientX / innerWidth) * 2 - 1;
        targetY = clamp(event.clientY / innerHeight) * 2 - 1;
      }, options);
      document.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; }, options);
      entry.addEventListener('entry:deny', () => { errorAt = performance.now(); }, options);
      controller = {
        ready: true,
        unlock(duration = 1650) {
          if (burst) return burst.finished;
          errorAt = -Infinity;
          for (const particle of particles) {
            const heading = Math.atan2(particle.y - height * .44, particle.x - width / 2) + Math.sin(particle.phase) * 1.05;
            particle.vx = Math.cos(heading);
            particle.vy = Math.sin(heading);
            particle.speed = .22 + particle.light * .72;
            particle.burstX = particle.x / width;
            particle.burstY = particle.y / height;
            particle.burstSize = particle.sizeNow;
            particle.burstAlpha = particle.alpha;
          }
          burst = { at: performance.now(), duration: reduced.matches ? 1 : duration };
          burst.finished = new Promise(resolve => { burst.resolve = resolve; });
          return burst.finished;
        }
      };
      window.entryEye = controller;
      bridge = {
        get active() { return !burst && canvas.isConnected; },
        capture() {
          return particles.map(particle => ({
            x: particle.x / width,
            y: particle.y / height,
            velocityX: particle.velocityX / width,
            velocityY: particle.velocityY / height,
            size: particle.sizeNow,
            alpha: particle.alpha,
            targetX: .5 + particle.targetX,
            targetY: .5 + (.021 + particle.targetY) * 1.5
          }));
        },
        finish: stop
      };
      window.beyondEyeBridge = bridge;
    }
    draw(from, started);
    frame = requestAnimationFrame(tick);
    return { stop, get time() { return lastTime; } };
  }

  window.beyondPortal = { handoff, fly };
  if (document.currentScript.hasAttribute('data-portal-arrival')) {
    let arrival;
    try {
      const saved = sessionStorage.getItem('zhitong-beyond-arrival');
      sessionStorage.removeItem('zhitong-beyond-arrival');
      arrival = JSON.parse(saved);
    } catch {}
    if (arrival?.at && Date.now() - arrival.at < 15000 && !matchMedia('(prefers-reduced-motion: reduce)').matches &&
        fly(arrival.field, true)) {
      document.documentElement.classList.add('from-group-portal');
    }
  }
})();
