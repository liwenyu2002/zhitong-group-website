(() => {
  'use strict';
  const entry = document.querySelector('#entry');
  const host = document.querySelector('.eye');
  const source = document.querySelector('.eye-main');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.id = 'eye-cloud';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);

  const vertexSource = `
    precision highp float;
    attribute vec4 aOrbit;
    uniform sampler2D uReference;
    uniform float uTime;
    uniform float uMotion;
    uniform float uDpr;
    uniform float uBurst;
    uniform float uGain;
    uniform vec2 uSize;
    uniform vec2 uImageSize;
    uniform vec2 uCamera;
    uniform vec2 uMouse;
    uniform vec2 uScale;
    uniform vec2 uCenter;
    uniform vec2 uOrigin;
    varying float vLight;
    void main() {
      const float TAU = 6.2831853;
      float radius = aOrbit.x;
      float initialAngle = aOrbit.y;
      float flock = aOrbit.z;
      float seed = aOrbit.w;
      float t = uTime;
      float groupPhase = fract(sin(flock * 127.1 + 17.7) * 43758.5453) * TAU;
      float band = clamp((radius - .18) / .25, 0.0, 1.0);
      float shape = band * band * (3.0 - 2.0 * band);
      float flatten = 1.0 - .36 * shape;
      float flattenDerivative = -.36 * 6.0 * band * (1.0 - band) / .25;
      float areaWeight = flatten + .5 * radius * flattenDerivative;
      float flockWeight = smoothstep(.28, .60, seed);
      // All lanes circulate continuously. Local groups follow the same
      // leader and curl around it, while a quieter population fills gaps.
      float speed = .055 + .025 * (1.0 - smoothstep(.068, .43, radius));
      float angle = initialAngle + t * speed;
      angle += flockWeight * sin(t * .23 + groupPhase) * .018;
      float breathingRadius = radius * (1.0 + flockWeight * .008 * sin(t * .31 + groupPhase));
      float aspect = uImageSize.x / uImageSize.y;
      vec2 p = vec2(0.0, -.06) + vec2(cos(angle), sin(angle) * flatten * aspect) * breathingRadius * 2.0;
      vec2 groupCurl = vec2(cos(t * .45 + groupPhase), sin(t * .45 + groupPhase) * .68);
      p += groupCurl * flockWeight * (4.0 + 3.0 * fract(flock * .618)) * 2.0 / uImageSize;
      vec2 uv = p * .5 + .5;
      float light = dot(texture2D(uReference, uv).rgb, vec3(.2126, .7152, .0722));
      if (light < .003 || any(lessThan(uv,vec2(0.0))) || any(greaterThan(uv,vec2(1.0)))) {
        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
        gl_PointSize = 1.0;
        vLight = 0.0;
        return;
      }
      float mound = exp(-pow(p.x / .38, 2.0) - pow((p.y + .06) / .87, 2.0));
      float depth = pow(light, .7) * .75 + mound * .14;
      p += uCamera * depth * vec2(.014, .012);
      vec2 delta = (p - uMouse) * uImageSize * .5;
      float distanceToMouse = length(delta);
      float influence = exp(-dot(delta, delta) / 4800.0);
      p += delta / max(1.0, distanceToMouse) * influence * 1.2 * 2.0 / uImageSize * uMotion;
      vec2 position = (p - uOrigin) * uScale + uCenter;
      float pointSize = (.90 + .14 * sqrt(light)) * (.96 + .08 * seed);
      float energy = 1.0;
      if (uBurst > 0.0) {
        // Keep the sampled material light attached to each bird as it leaves.
        // Independent launch times, speeds and curved paths break up the eye.
        float randomA = fract(sin(seed * 173.3 + initialAngle * 91.7) * 43758.5453);
        float randomB = fract(sin(seed * 327.1 + flock * 17.3) * 21341.171);
        float delay = .025 + seed * .15;
        float flight = max(0.0, (uBurst - delay) / (1.0 - delay));
        float seconds = flight * 1.65;
        float travel = seconds - .055 * (1.0 - exp(-seconds / .055));
        vec2 radial = normalize((p - vec2(0.0, -.06)) * uImageSize);
        float turn = (randomA - .5) * 2.25;
        vec2 direction = vec2(radial.x * cos(turn) - radial.y * sin(turn),
                              radial.x * sin(turn) + radial.y * cos(turn));
        vec2 tangent = vec2(-direction.y, direction.x);
        float speed = length(uSize) * (.16 + .70 * randomB);
        vec2 displacement = direction * speed * travel;
        displacement += tangent * speed * travel * travel * (randomA - .5) * .65;
        position += displacement * 2.0 / uSize;
        float released = smoothstep(0.0, .09, flight);
        float fade = 1.0 - smoothstep(.22 + seed * .20, .68 + seed * .30, flight);
        energy = mix(1.0, 1.85, released) * fade;
        pointSize *= (1.0 + released * (.25 + randomB * .85))
                   * (1.0 - .7 * smoothstep(.4, 1.0, flight));
      }
      gl_Position = vec4(position, 0.0, 1.0);
      gl_PointSize = max(1.0, pointSize * uDpr);
      // Smooth material lighting changes only with the birds' position.
      // Correct the density of elliptical lanes to keep the reference light.
      vLight = (light + .003 * smoothstep(.003,.025,light)) * uGain * areaWeight * 1.447 * energy;
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform float uRed;
    varying float vLight;
    void main() {
      float radius = length(gl_PointCoord - .5);
      float cover = 1.0 - smoothstep(.32, .5, radius);
      if (cover < .005) discard;
      vec3 neutral = vec3(vLight);
      vec3 red = vec3(vLight * 1.85, vLight * .12, vLight * .19);
      vec3 color = mix(neutral, red, uRed);
      float alpha = min(1.0, max(color.r, max(color.g, color.b))) * cover;
      gl_FragColor = vec4(color * cover, alpha);
    }
  `;

  let gl, program, buffer, texture, frameId, observer;
  let disposed = false, fullScreen = false, errorAt = -10000;
  let width = 1, height = 1, dpr = 1, count = 0, imageWidth = 1, imageHeight = 1;
  let burst = 0, baseGain = 2.95, gain = 2.95, red = 0;
  let camera = [0, 0], targetCamera = [0, 0], mouse = [5, 5];
  let scale = [1, 1], center = [0, 0], origin = [0, 0];
  let bounds;
  let unlockState = null;
  let previousFrame = performance.now(), simulationTime = 0, visibleEstimate = 0;
  const abort = new AbortController();
  const uniforms = {};

  function shader(type, text) {
    const value = gl.createShader(type);
    gl.shaderSource(value, text);
    gl.compileShader(value);
    if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error('shader_compile');
    return value;
  }
  function resize() {
    if (disposed || !gl) return;
    bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (!fullScreen) { imageWidth = width; imageHeight = height; }
    // Fixed-size dots overlap more as the same cloud becomes smaller.
    // Compensate their energy to retain the reference lighting on phones.
    baseGain = 2.95 * (190000 / count) * Math.pow(imageWidth / 840, 2) * Math.min(1, Math.pow(.94 * dpr, 2));
  }
  function onPointer(event) {
    if (unlockState || !bounds || reduced.matches) return;
    const x = (event.clientX - bounds.left) / width * 2 - 1;
    const y = 1 - (event.clientY - bounds.top) / height * 2;
    targetCamera = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
    mouse = [x, y];
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    observer?.disconnect();
    abort.abort();
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    if (texture) gl.deleteTexture(texture);
    window.entryEye = null;
  }
  function ease(x) { return x * x * (3 - 2 * x); }
  function draw(now) {
    if (disposed) return;
    if (!entry.isConnected) { dispose(); return; }
    const deltaTime = Math.min(.05, Math.max(0, (now - previousFrame) / 1000));
    previousFrame = now;
    if (!unlockState) {
      camera[0] += (targetCamera[0] - camera[0]) * .045;
      camera[1] += (targetCamera[1] - camera[1]) * .045;
    }
    const elapsed = (now - errorAt) / 1000;
    red = elapsed < .14 ? ease(Math.max(0, elapsed) / .14) : elapsed < .52 ? 1 : 1 - ease(Math.min(1, (elapsed - .52) / .68));
    let motionAmount = reduced.matches ? 0 : 1;
    if (unlockState) {
      burst = Math.min(1, (now - unlockState.at) / unlockState.duration);
      motionAmount = 0;
      if (burst >= 1 && !unlockState.done) { unlockState.done = true; unlockState.resolve(); }
    }
    gain = baseGain;
    simulationTime += deltaTime * motionAmount;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.uTime, simulationTime);
    gl.uniform1f(uniforms.uMotion, motionAmount);
    gl.uniform1f(uniforms.uDpr, dpr);
    gl.uniform1f(uniforms.uBurst, burst);
    gl.uniform1f(uniforms.uGain, gain);
    gl.uniform1f(uniforms.uRed, red);
    gl.uniform2f(uniforms.uSize, width, height);
    gl.uniform2f(uniforms.uImageSize, imageWidth, imageHeight);
    gl.uniform2fv(uniforms.uCamera, camera);
    gl.uniform2fv(uniforms.uMouse, mouse);
    gl.uniform2fv(uniforms.uScale, scale);
    gl.uniform2fv(uniforms.uCenter, center);
    gl.uniform2fv(uniforms.uOrigin, origin);
    gl.drawArrays(gl.POINTS, 0, count);
    frameId = requestAnimationFrame(draw);
  }

  async function init() {
    await source.decode();
    gl = canvas.getContext('webgl', { alpha:true, premultipliedAlpha:true, antialias:false, depth:false, stencil:false, powerPreference:'high-performance' });
    if (!gl) throw new Error('webgl_unavailable');
    if (!gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) throw new Error('vertex_texture_unavailable');
    program = gl.createProgram();
    const vertex = shader(gl.VERTEX_SHADER, vertexSource), fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('shader_link');
    gl.deleteShader(vertex); gl.deleteShader(fragment); gl.useProgram(program);
    for (const name of ['uTime','uMotion','uDpr','uBurst','uGain','uRed','uSize','uImageSize','uCamera','uMouse','uScale','uCenter','uOrigin','uReference']) uniforms[name] = gl.getUniformLocation(program, name);
    const sample = document.createElement('canvas');
    sample.width = source.naturalWidth; sample.height = source.naturalHeight;
    const context = sample.getContext('2d', { willReadFrequently:true });
    context.filter = 'blur(2.5px)';
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sample);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(uniforms.uReference,0);
    const particleCount = matchMedia('(max-width:600px)').matches ? 85000 : 120000;
    const values = new Float32Array(particleCount * 4);
    let seed = 104729;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.sqrt(.068*.068 + random() * (.43*.43 - .068*.068));
      const theta = random() * Math.PI * 2;
      const band = Math.min(1,Math.max(0,(radius-.18)/.25));
      const flatten = 1 - .36 * band * band * (3 - 2*band);
      const px = .5 + Math.cos(theta)*radius;
      const py = .53 - Math.sin(theta)*radius*flatten*(sample.width/sample.height);
      if (px>=0&&px<1&&py>=0&&py<1) {
        const index=(Math.floor(py*sample.height)*sample.width+Math.floor(px*sample.width))*4;
        if(pixels[index]>.011*255)visibleEstimate++;
      }
      const lane = Math.min(7,Math.floor((radius-.068)/(.43-.068)*8));
      const sector = Math.floor(theta/(Math.PI*2)*20);
      values[i*4] = radius; values[i*4+1] = theta;
      values[i*4+2] = lane*20+sector; values[i*4+3] = random();
    }
    count = particleCount;
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program,'aOrbit');
    gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location,4,gl.FLOAT,false,16,0);
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ONE,gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    window.addEventListener('pointermove', onPointer, { passive:true, signal:abort.signal });
    document.addEventListener('pointerleave', () => { targetCamera=[0,0];mouse=[5,5]; }, { signal:abort.signal });
    entry.addEventListener('entry:deny', () => { errorAt=performance.now(); }, { signal:abort.signal });
    entry.dataset.renderer = 'point-cloud';
    entry.dataset.points = String(count);
    window.entryEye = {
      ready:true,
      getState:() => ({ count, visibleEstimate, red, zoom:1, burst, width, height, simulationTime, renderer:'point-cloud', motion:unlockState?'particle-burst':'flocking-orbits' }),
      unlock(duration = 1650) {
        errorAt = -10000;
        const rect = canvas.getBoundingClientRect();
        const pupilX = .5, pupilY = .53;
        imageWidth = rect.width; imageHeight = rect.height;
        fullScreen = true;
        origin = [pupilX * 2 - 1, 1 - pupilY * 2];
        center = [(rect.left + rect.width * pupilX) / innerWidth * 2 - 1, 1 - (rect.top + rect.height * pupilY) / innerHeight * 2];
        scale = [rect.width / innerWidth, rect.height / innerHeight];
        mouse=[5,5];
        canvas.classList.add('is-fullscreen'); entry.append(canvas); resize();
        return new Promise(resolve => { unlockState = { at:performance.now(), duration:reduced.matches?1:duration, resolve, done:false }; });
      }
    };
    draw(performance.now());
    requestAnimationFrame(() => entry.classList.add('is-cloud-ready'));
  }
  init().catch(() => { entry.dataset.renderer='image-fallback';canvas.remove();if(gl)dispose(); });
})();
