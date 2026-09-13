/* ═══════════════════════════════════════════
   灵枢实验室 · 仪器实验室
   屏内实时动画：双通道示波器 / EEG / 笔式绘图仪 / 脉搏
   纯 Canvas 2D + DOM，零第三方依赖
   ═══════════════════════════════════════════ */
(function () {
  'use strict';
  window.addEventListener('error', e => { window.__pageErr = e.message + ' @ line ' + e.lineno; }, { once: false });
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 通用：canvas 高清适配 ── */
  function fit(canvas) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width * dpr));
    const h = Math.max(2, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    return [canvas.width, canvas.height, dpr];
  }

  /* ── 1. 多人超扫描：96×72 真像素屏，数码小人围桌 + 脑间同步脉冲 ── */
  function hyperscanLoop(canvas) {
    const ctx = canvas.getContext('2d');
    const RW = 96, RH = 72;
    const off = document.createElement('canvas');
    off.width = RW; off.height = RH;
    const g = off.getContext('2d');
    const N = 6;

    return function draw() {
      const [w, h] = fit(canvas);
      const t = performance.now() * 0.001;

      // 桌面与六个座位（低分辨率坐标系）
      const tableY = 50, tableW = 76, tableL = (RW - tableW) / 2;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const x = Math.round(tableL + tableW * ((i + 0.5) / N));
        const headY = i % 2 === 0 ? 26 : 40;
        pts.push({ x, headY, ph: i * 1.73 });
      }

      // ---- 后排人物 ----
      const drawPerson = (i, front) => {
        const { x, headY, ph } = pts[i];
        // 头：3×3 像素
        g.fillStyle = '#9fffb3';
        g.fillRect(x - 1, headY - 2, 3, 3);
        // 肩身
        g.fillStyle = 'rgba(125,255,154,0.35)';
        g.fillRect(x - 2, headY + 2, 5, front ? 5 : 3);
        // 头顶量化脑波：每列 1×2 像素小柱
        g.fillStyle = '#7dff9a';
        for (let dx = -5; dx <= 5; dx++) {
          const u = (dx + 5) / 10;
          const amp = Math.abs(Math.sin(u * 4.4 + t * (1.3 + i * 0.27) + ph)) * (2.2 + Math.sin(t * 0.8 + i));
          g.fillRect(x + dx, Math.round(headY - 6 - amp), 1, 2);
        }
      };

      g.fillStyle = '#071007';
      g.fillRect(0, 0, RW, RH);
      for (let i = 0; i < N; i += 2) drawPerson(i, false);

      // 桌板：暗面 + 1px 亮边
      g.fillStyle = '#0d140d';
      g.fillRect(tableL, tableY, tableW, 5);
      g.fillStyle = '#7dff9a';
      g.fillRect(tableL, tableY, tableW, 1);

      // ---- 同步弧线 + 往返脉冲（像素点阵） ----
      for (let i = 0; i < N; i++) {
        for (const j of [i + 1, i + 2]) {
          if (j >= N) continue;
          const a = pts[i], b = pts[j];
          const mx = (a.x + b.x) / 2;
          const my = Math.min(a.headY, b.headY) - 9 - (j - i) * 2;
          const dim = 0.10 + 0.12 * Math.abs(Math.sin(t * 0.9 + i + j));
          g.fillStyle = 'rgba(125,255,154,' + dim.toFixed(3) + ')';
          const STEPS = 18;
          const q = (t * 0.45 + i * 0.31 + j * 0.17) % 2;
          const qq = q < 1 ? q : 2 - q;
          for (let s = 0; s <= STEPS; s++) {
            const u = s / STEPS;
            const px = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x;
            const py = (1 - u) * (1 - u) * a.headY + 2 * (1 - u) * u * my + u * u * b.headY;
            g.fillRect(Math.round(px), Math.round(py), 1, 1);
            if (Math.abs(u - qq) < 0.05) {
              g.fillStyle = '#ffb648';
              g.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
              g.fillStyle = 'rgba(125,255,154,' + dim.toFixed(3) + ')';
            }
          }
        }
      }

      // ---- 前排人物 ----
      for (let i = 1; i < N; i += 2) drawPerson(i, true);

      // ---- 上屏：无平滑放大成真像素颗粒 ----
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#071007';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(off, 0, 0, RW, RH, 0, 0, w, h);
    };
  }

  /* ── 4. 手表脉搏：BPM 数值 + 心电尖波 ── */
  const MONO = '"SF Mono", Menlo, "Courier New", monospace';
  function ecg(p) {
    let v = 0.12 * Math.sin(p);
    if (p > 0.6 && p < 0.75) v -= 0.35;
    if (p >= 0.75 && p < 0.95) v += 1.0;
    if (p >= 0.95 && p < 1.15) v -= 0.45;
    if (p > 1.8 && p < 2.3) v += 0.28;
    return v;
  }
  function pulseLoop(canvas) {
    const ctx = canvas.getContext('2d');
    const buf = [];
    let bpm = 72, lastBpmT = 0, phase = 0;
    return function draw() {
      const [w, h] = fit(canvas);
      const t = performance.now();
      ctx.fillStyle = '#070907';
      ctx.fillRect(0, 0, w, h);
      if (t - lastBpmT > 1400) { lastBpmT = t; bpm = 70 + Math.round(Math.random() * 7); }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7dff9a';
      ctx.shadowColor = 'rgba(125,255,154,0.7)';
      ctx.shadowBlur = 8;
      ctx.font = `700 ${Math.round(w * 0.32)}px ${MONO}`;
      ctx.fillText(String(bpm), w / 2, h * 0.4);
      ctx.font = `600 ${Math.round(w * 0.095)}px ${MONO}`;
      ctx.fillText('BPM', w / 2, h * 0.54);
      ctx.shadowBlur = 0;
      // 心电波形
      phase += 0.085;
      buf.push(ecg(phase % (Math.PI * 2)));
      const maxN = Math.floor(w / 2);
      while (buf.length > maxN) buf.shift();
      ctx.strokeStyle = '#ffb648';
      ctx.lineWidth = Math.max(1.5, w * 0.022);
      ctx.shadowColor = 'rgba(255,182,72,0.6)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      buf.forEach((v, i) => {
        const x = w - (buf.length - i) * 2;
        const y = h * 0.8 - v * h * 0.16;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    };
  }

  /* ── 证件照片噪声 ── */
  function initIdPhotos() {
    document.querySelectorAll('.id-photo canvas, .pi-photo canvas').forEach(cv => {
      const ctx = cv.getContext('2d');
      cv.width = 144; cv.height = 176;
      const g = ctx.createLinearGradient(0, 0, 0, 176);
      g.addColorStop(0, '#2a2f2a'); g.addColorStop(1, '#121512');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 144, 176);
      for (let i = 0; i < 900; i++) {
        const v = (Math.random() * 70) | 0;
        ctx.fillStyle = `rgba(${v},${v + 30},${v},${0.5})`;
        ctx.fillRect(Math.random() * 144, Math.random() * 176, 1.5, 1.5);
      }
      // 扫描线
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let y = 0; y < 176; y += 4) ctx.fillRect(0, y, 144, 1.6);
    });
  }

  /* ── 2. 笔记本：腕上高密度电极贴片（竖臂） + 实时测量曲线 ── */
  function patchLoop(canvas) {
    const ctx = canvas.getContext('2d');
    return function draw() {
      const [w, h] = fit(canvas);
      const t = performance.now() * 0.001;
      const ink = '#1f1e1b';
      const red = '#b05f44';

      // 坐标纸
      ctx.fillStyle = '#f5efdd';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(31,30,27,0.055)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += w / 26) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += h / 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // ---- 竖直前臂（左侧）：上臂在上，腕在手在下 ----
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      // 左缘
      ctx.beginPath();
      ctx.moveTo(w * 0.075, h * 0.04);
      ctx.bezierCurveTo(w * 0.055, h * 0.30, w * 0.065, h * 0.58, w * 0.095, h * 0.80);
      // 右缘
      ctx.moveTo(w * 0.315, h * 0.02);
      ctx.bezierCurveTo(w * 0.30, h * 0.28, w * 0.305, h * 0.55, w * 0.27, h * 0.80);
      // 底部手背圆弧 + 拇指
      ctx.moveTo(w * 0.095, h * 0.80);
      ctx.quadraticCurveTo(w * 0.10, h * 0.95, w * 0.20, h * 0.965);
      ctx.quadraticCurveTo(w * 0.28, h * 0.955, w * 0.27, h * 0.80);
      ctx.stroke();
      // 拇指（右下小凸起）
      ctx.beginPath();
      ctx.moveTo(w * 0.27, h * 0.80);
      ctx.quadraticCurveTo(w * 0.315, h * 0.82, w * 0.325, h * 0.87);
      ctx.stroke();
      // 腕纹
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(31,30,27,0.35)';
      for (const fy of [0.70, 0.755]) {
        ctx.beginPath();
        ctx.moveTo(w * 0.085, h * fy);
        ctx.quadraticCurveTo(w * 0.19, h * (fy + 0.025), w * 0.295, h * fy);
        ctx.stroke();
      }

      // ---- 贴片区域（随臂的虚线圆角框） ----
      const pX = w * 0.085, pW = w * 0.225;
      const pY = h * 0.13, pH = h * 0.50;
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.beginPath();
      ctx.moveTo(pX - 6, pY + 12);
      ctx.quadraticCurveTo(pX + pW * 0.4, pY - 10, pX + pW + 10, pY + 6);
      ctx.quadraticCurveTo(pX + pW + 18, pY + pH * 0.5, pX + pW + 4, pY + pH - 6);
      ctx.quadraticCurveTo(pX + pW * 0.5, pY + pH + 12, pX - 6, pY + pH - 4);
      ctx.quadraticCurveTo(pX - 14, pY + pH * 0.5, pX - 6, pY + 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(31,30,27,0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ---- 高密度电极阵列 5×7 = 35 通道 ----
      const cols = 6, rows = 9;
      const gridX = pX + pW * 0.08, gridY = pY + pH * 0.05;
      const gridW = pW * 0.60, gridH = pH * 0.84;
      const stepX = gridW / (cols - 1), stepY = gridH / (rows - 1);
      const s = Math.min(stepX, stepY) * 0.58;
      const spineX = pX + pW * 0.94;           // 右缘焊盘条
      const padTop = pY + pH * 0.08;
      const padGap = (pH * 0.86) / (cols * rows);

      // 走线（先画，垫在电极下方）：每电极一条精巧弧线 → 右缘焊盘，互不交叉
      ctx.strokeStyle = 'rgba(31,30,27,0.5)';
      ctx.lineWidth = 1;
      let k = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ex = gridX + c * stepX;
          const ey = gridY + r * stepY;
          const padY = padTop + k * padGap;
          ctx.beginPath();
          ctx.moveTo(ex, ey + s / 2);
          ctx.bezierCurveTo(ex, ey + stepY * 0.6, spineX - stepX * 0.7, padY - padGap * 1.5, spineX - 2, padY);
          ctx.stroke();
          k++;
        }
      }

      // 电极本体：方块 + 内部 3×3 触点阵（画在走线上层）
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k2 = r * cols + c;
          const ex = gridX + c * stepX;
          const ey = gridY + r * stepY;
          const spike = Math.pow(Math.max(0, Math.sin(t * 0.85 + k2 * 1.31)), 24);
          const act = Math.min(1, 0.32 + 0.22 * Math.sin(t * 1.15 + k2 * 2.05) + spike);
          ctx.fillStyle = 'rgba(31,30,27,' + (0.12 + act * 0.42).toFixed(3) + ')';
          ctx.fillRect(ex - s / 2, ey - s / 2, s, s);
          ctx.strokeStyle = ink;
          ctx.strokeRect(ex - s / 2, ey - s / 2, s, s);
          ctx.fillStyle = 'rgba(246,243,234,0.92)';
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              ctx.fillRect(ex + dx * s * 0.26 - 0.8, ey + dy * s * 0.26 - 0.8, 1.6, 1.6);
            }
          }
          if (spike > 0.5) {
            ctx.fillStyle = red;
            ctx.beginPath(); ctx.arc(ex + s * 0.75, ey - s * 0.75, 2, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      // 焊盘条（走线在此“到一起”）
      ctx.fillStyle = ink;
      for (let k3 = 0; k3 < cols * rows; k3++) {
        ctx.fillRect(spineX - 2, padTop + k3 * padGap - 1, 4, 2);
      }
      // 汇成一条缆 → 引到右边
      const cblY = padTop + (cols * rows) * padGap * 0.5;
      const midY = h * 0.50;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(spineX + 2, cblY);
      ctx.bezierCurveTo(w * 0.38, cblY, w * 0.40, midY, w * 0.455, midY);
      ctx.stroke();
      ctx.strokeStyle = '#f5efdd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(spineX + 2, cblY);
      ctx.bezierCurveTo(w * 0.38, cblY, w * 0.40, midY, w * 0.455, midY);
      ctx.stroke();
      // 插头
      ctx.fillStyle = ink;
      ctx.fillRect(spineX + 1, cblY - 5, 5, 10);

      // ---- 右侧三路实时测量曲线 ----
      const px0 = w * 0.44, px1 = w * 0.97;
      const panels = [
        { y0: h * 0.08, hh: h * 0.22, kind: 0 },
        { y0: h * 0.39, hh: h * 0.22, kind: 1 },
        { y0: h * 0.70, hh: h * 0.22, kind: 2 },
      ];
      panels.forEach((pn, pi) => {
        ctx.strokeStyle = 'rgba(31,30,27,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px0, pn.y0, px1 - px0, pn.hh);
        // 虚线 leader：排线尾 → 中间面板
        if (pi === 1) {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(176,95,68,0.5)';
          ctx.beginPath();
          ctx.moveTo(spineX + 6, pY + pH * 0.55);
          ctx.lineTo(px0, pn.y0 + pn.hh / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const base = pn.y0 + pn.hh / 2;
        ctx.strokeStyle = pi === 1 ? red : ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let x = px0; x <= px1; x += 2) {
          const u = x - px0 + t * (30 + pi * 22);
          let v = Math.sin(u * 0.09 + pi) * 0.32 + Math.sin(u * 0.045 - pi * 1.7) * 0.22;
          if (pi === 1) v += Math.pow(Math.max(0, Math.sin(u * 0.05)), 18) * 1.5;
          const y = base - v * pn.hh * 0.42;
          x === px0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    };
  }

  /* ── 背景：点阵大脑（突触连接 + 柔光电流 + 鼠标视差 + 飘散） ── */
  function initBrainBg() {
    const canvas = document.getElementById('bgBrain');
    if (!canvas) return () => {};
    const ctx = canvas.getContext('2d');
    const RW = 120, RH = 96;
    const off = document.createElement('canvas');
    off.width = RW; off.height = RH;
    const o = off.getContext('2d');
    o.fillStyle = '#fdfaf1';
    o.beginPath();
    o.moveTo(16, 50);
    o.bezierCurveTo(10, 28, 30, 10, 56, 10);
    o.bezierCurveTo(80, 10, 97, 24, 98, 44);
    o.bezierCurveTo(99, 55, 90, 61, 80, 61);
    o.bezierCurveTo(64, 66, 34, 64, 16, 50);
    o.fill();
    o.beginPath();
    o.ellipse(78, 66, 13, 7.5, -0.18, 0, Math.PI * 2);
    o.fill();
    o.fillRect(58, 58, 8, 16);
    const img = o.getImageData(0, 0, RW, RH).data;
    const dots = [];
    for (let y = 1; y < RH - 1; y += 2) {
      for (let x = 1; x < RW - 1; x += 2) {
        if (img[(y * RW + x) * 4 + 3] > 128 && Math.random() > 0.10) {
          dots.push({
            x, y,
            tw: Math.random() * 6.28,
            rank: (x / RW) * 0.6 + Math.random() * 0.4,
            sz: 0.5 + Math.random() * 1.1,
            depth: 0.3 + Math.random() * 0.9,
            fx: 0.35 + Math.random() * 0.7,
            fy: 0.35 + Math.random() * 0.7,
            fp: Math.random() * 6.28,
            radial: Math.min(1.35, Math.hypot(x - 60, y - 48) / 42),
            sx: 0, sy: 0
          });
        }
      }
    }
    // 近邻突触连接：每点连最近 2 个邻居
    const adj = dots.map(() => []);
    const seen = new Set();
    for (let i = 0; i < dots.length; i++) {
      const cand = [];
      for (let j = 0; j < dots.length; j++) {
        if (i === j) continue;
        const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 46) cand.push([d2, j]);
      }
      cand.sort((a, b) => a[0] - b[0]);
      let links = 0;
      for (const [, j] of cand) {
        const key = i < j ? i * 4096 + j : j * 4096 + i;
        if (seen.has(key)) { links++; continue; }
        if (links >= 1) break;
        seen.add(key);
        adj[i].push(j); adj[j].push(i);
        links++;
      }
    }
    // 电流脉冲
    const pulses = [];
    let nextSpawn = 0.4;
    function spawnPulse(reveal, bcx, bcy) {
      const fromBulge = Math.random() < 0.62;      // 六成电流从拽起处发生
      for (let tries = 0; tries < 8; tries++) {
        let s0;
        if (fromBulge && tries < 5) {
          const cands = [];
          for (let i = 0; i < dots.length; i++) {
            if (dots[i].rank > reveal) continue;
            if (Math.hypot(dots[i].x - bcx, dots[i].y - bcy) < 20) cands.push(i);
          }
          if (!cands.length) { s0 = (Math.random() * dots.length) | 0; }
          else { s0 = cands[(Math.random() * cands.length) | 0]; }
        } else {
          s0 = (Math.random() * dots.length) | 0;
        }
        if (dots[s0].rank > reveal) continue;
        const path = [s0];
        let cur = s0, prev = -1;
        const hops = 4 + ((Math.random() * 5) | 0);
        for (let h = 0; h < hops; h++) {
          const nbrs = adj[cur].filter(j => j !== prev && dots[j].rank <= reveal);
          const pool = nbrs.length ? nbrs : adj[cur].slice();
          if (!pool.length) break;
          const nxt = pool[(Math.random() * pool.length) | 0];
          path.push(nxt); prev = cur; cur = nxt;
        }
        if (path.length >= 3) {
          const lv = Math.random();
          pulses.push({ path, prog: 0, spd: 1.8 + lv * 2.0, lv, dying: 0, fade: 1, flash: 0 });
          window.__spawned = (window.__spawned || 0) + 1;
          return;
        }
      }
    }
    const sstep = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
    let smooth = 0;
    let bcx = 60, bcy = 48;
    let mx = 0, my = 0;
    let mouseCX = innerWidth / 2, mouseCY = innerHeight / 2;
    if (!reduceMotion) {
      window.addEventListener('mousemove', e => {
        mouseCX = e.clientX;
        mouseCY = e.clientY;
      }, { passive: true });
    }
    let bgTick = 0;
    const bgDbg = {};
    window.__brainDebug = () => ({ ...bgDbg });
    // ── 神经粒子流：大脑上对应位置的点阵被四台设备吸引流走 ──
    const flowDevs = ['.desktop', '.phone', '.watch', '.laptop'].map(s => document.querySelector(s));
    const flows = flowDevs.filter(Boolean).map(el => ({
      el, hasA: false, ax: 0, ay: 0, lax: 0, lay: 0,
      phase: Math.random() * 6.28,
      face: [],
      parts: Array.from({ length: 10 }, () => ({
        p: Math.random(), spd: 0.28 + Math.random() * 0.3,
        seed: Math.random() * 6.28, sz: 2.6 + Math.random() * 2.4,
        bow: (Math.random() - 0.5) * 130,
        sx0: 0, sy0: 0, born: false,
        hue: (() => {
          if (Math.random() < 0.3) {
            const lv = Math.random();
            return [Math.round(230 - lv * 13), Math.round(160 - lv * 100), Math.round(70 - lv * 26)];
          }
          const lit = 0.35 + Math.random() * 0.65;
          return [Math.round(31 + 175 * lit), Math.round(30 + 92 * lit), Math.round(27 + 45 * lit)];
        })()
      }))
    }));
    return function draw(dt) {
      if ((++bgTick & 1) !== 0) return;  // 隔帧渲染，背景层省一半开销
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const w = innerWidth, h = innerHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const docH = Math.max(1, document.documentElement.scrollHeight - h);
      const target = (window.__deckProgress != null)
        ? Math.min(1, Math.max(0, window.__deckProgress))
        : Math.min(1, Math.max(0, (window.scrollY || 0) / docH));
      smooth += (target - smooth) * 0.08;
      const reveal = Math.min(1, smooth * 2.4 + 0.55);
      const drift = Math.sin(smooth * Math.PI);
      const sc = (w * 0.64) / RW;
      const cx = w * 0.50 - drift * w * 0.34 + mx * w * 0.10;
      const cy = h * 0.47 + smooth * h * 0.08 + my * h * 0.02;
      const rot = -0.05 + smooth * 0.22 + mx * 0.10;
      const base = 0.30 - 0.12 * sstep(0.30, 0.75, smooth);
      const t = performance.now() * 0.001;
      const dtc = Math.min(dt || 0.016, 0.05);
      // 鼠标追踪相对大脑当前屏幕中心，而非页面中心
      const relMX = (mouseCX - cx) / w;
      const relMY = (mouseCY - cy) / h;
      mx += (relMX - mx) * 0.14;
      my += (relMY - my) * 0.14;
      Object.assign(bgDbg, { mx: +mx.toFixed(3), my: +my.toFixed(3), cx: Math.round(cx), cy: Math.round(cy) });

      // 四设备吸引场：锚点每帧精确跟随设备边缘（含开机→散开全程），零延迟
      {
        const flowA = 1 - sstep(0.012, 0.075, smooth);
        const cAr = Math.cos(-rot), sAr = Math.sin(-rot);
        for (const fl of flows) {
          fl.hasA = false;
          if (flowA <= 0.02) continue;
          const r = fl.el.getBoundingClientRect();
          if (!r.width) continue;
          const scx = r.left + r.width / 2, scy = r.top + r.height / 2;
          const adx = scx - cx, ady = scy - cy;
          const klx = adx !== 0 ? (r.width / 2) / Math.abs(adx) : Infinity;
          const kly = ady !== 0 ? (r.height / 2) / Math.abs(ady) : Infinity;
          const k = Math.min(klx, kly) * 0.94;
          fl.ax = scx - adx * k; fl.ay = scy - ady * k;
          fl.lax = (fl.ax - cx) * cAr - (fl.ay - cy) * sAr;
          fl.lay = (fl.ax - cx) * sAr + (fl.ay - cy) * cAr;
          fl.hasA = true;
          // 刷新“朝向该设备”的大脑点区域
          const dl0 = Math.hypot(adx, ady) || 1;
          const uxx = adx / dl0, uyy = ady / dl0;
          let mxp = -9;
          for (const d of dots) {
            if (d.rank > 1) continue;
            const s = (d.x - 60) * uxx + (d.y - 48) * uyy;
            if (s > mxp) mxp = s;
          }
          fl.face.length = 0;
          for (const d of dots) {
            if (d.rank > 1) continue;
            if ((d.x - 60) * uxx + (d.y - 48) * uyy > mxp * 0.35) fl.face.push(d);
          }
        }
      }
      // 1) 布面 + 捏住一点往上拽的小揪揪（凸起中心平滑追踪鼠标）
      const mlen = Math.hypot(mx, my);
      const mdx = mlen > 0.02 ? mx / mlen : 1;
      const mdy = mlen > 0.02 ? my / mlen : 0;
      const tbx = 60 + mx * 100 + mdx * 6, tby = 48 + my * 66 + mdy * 5;
      bcx += (tbx - bcx) * 0.22;
      bcy += (tby - bcy) * 0.22;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (d.rank > reveal) continue;
        const nx = d.x * 0.06, ny = d.y * 0.06;
        const ddx = d.x - bcx, ddy = d.y - bcy;
        const dist = Math.hypot(ddx, ddy) + 0.001;
        const inf = Math.exp(-(dist * dist) / (2 * 12 * 12));  // 紧致小凸起 σ=12
        const ux = ddx / dist, uy = ddy / dist;
        d.inf = inf;
        d.grow = 1 + inf * 1.7;
        d.lit = sstep(0.38, 0.92, inf);                        // 受光核心
        d.ao = sstep(0.04, 0.30, inf) * (1 - d.lit);           // 环肩背光
        d.sx += mx * 40 * d.lit;                               // 受光点向光标轻微抬升
        d.sy += my * 28 * d.lit;
        // 被拽起：向捏点收拢 + 向上顶起的错落
        d.sx = d.x * sc - RW * sc / 2
          - ux * inf * 2.6 * sc * 0.5
          + Math.sin(nx * 2.0 + t * 0.55 + ny * 1.4) * (14 + inf * 10)
          + Math.sin(t * 0.35 + ny) * (6 + inf * 5);
        d.sy = d.y * sc - RH * sc / 2
          - uy * inf * 2.2 * sc * 0.5
          + Math.cos(ny * 2.2 - t * 0.45 + nx * 1.2) * (10 + inf * 8)
          + Math.cos(t * 0.30 + nx) * (5 + inf * 4);
        // 被四台设备扯住：朝向设备的边缘点周期性向外拉伸
        for (const fl of flows) {
          if (!fl.hasA) continue;
          const vx = fl.lax - d.sx, vy = fl.lay - d.sy;
          const vd = Math.hypot(vx, vy) + 0.001;
          const align = (d.sx * vx + d.sy * vy) / ((Math.hypot(d.sx, d.sy) + 0.001) * vd);
          if (align > 0.55) {
            const tug = 0.7 + 0.3 * Math.sin(t * 0.8 + fl.phase);
            const pull = Math.min(5.5, align * align * Math.min(1, Math.hypot(d.sx, d.sy) / 210) * 11 * tug);
            const pxs = vx / vd * pull, pys = vy / vd * pull;
            if (isFinite(pxs) && isFinite(pys)) { d.sx += pxs; d.sy += pys; }
          }
        }
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      // 2) 突触连接（极淡垫底）
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(31,30,27,0.06)';
      ctx.beginPath();
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (d.rank > reveal) continue;
        for (const j of adj[i]) {
          if (j <= i || dots[j].rank > reveal) continue;
          ctx.moveTo(d.sx, d.sy);
          ctx.lineTo(dots[j].sx, dots[j].sy);
        }
      }
      ctx.stroke();

      // 3) 墨点（受光暖色 / 环肩阴影 → 立体感）
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (d.rank > reveal) continue;
        const inf = d.inf || 0;
        const lit = d.lit || 0, ao = d.ao || 0;
        let a = reduceMotion
          ? base * (0.5 + d.sz * 0.4)
          : base * (0.5 + d.sz * 0.4) * (0.6 + 0.4 * Math.sin(t * 0.9 + d.tw));
        a = Math.min(0.92, Math.max(0.02, a * (0.85 + lit * 0.55) * (1 - ao * 0.5) * (0.85 + inf * 0.4)));
        const size = Math.max(1.2, sc * 0.5 * d.sz * (0.8 + inf * 1.6));
        const r = 31 + 175 * lit, g2 = 30 + 92 * lit, b2 = 27 + 45 * lit;
        ctx.fillStyle = 'rgba(' + r.toFixed(0) + ',' + g2.toFixed(0) + ',' + b2.toFixed(0) + ',' + a.toFixed(3) + ')';
        ctx.fillRect(d.sx - size / 2, d.sy - size / 2, size, size);
      }

      // 3.5) 凸起顶点柔光
      const apexX = bcx * sc - RW * sc / 2, apexY = bcy * sc - RH * sc / 2;
      const agr = sc * 15;
      const ag = (isFinite(apexX) && isFinite(apexY))
        ? ctx.createRadialGradient(apexX, apexY, 0, apexX, apexY, agr)
        : null;
      if (ag) {
      ag.addColorStop(0, 'rgba(255,190,140,0.12)');
      ag.addColorStop(1, 'rgba(255,190,140,0)');
        ctx.fillStyle = ag;
        ctx.fillRect(apexX - agr, apexY - agr, agr * 2, agr * 2);
      }

      // 4) 电流传导：活动等级 → 颜色浓度/光晕/速度 分档
      if (!reduceMotion) {
        if (t > nextSpawn && reveal > 0.45 && pulses.length < 9) {
          spawnPulse(reveal, bcx, bcy);
          nextSpawn = t + 0.15 + Math.random() * 0.45;
        }
        const pathPos = (path, tt) => {
          const Lp = path.length - 1;
          const k = Math.min(0.9999, Math.max(0, tt)) * Lp;
          const i = Math.floor(k), f = k - i;
          const e = f * f * (3 - 2 * f);
          const A = dots[path[i]], B = dots[path[Math.min(i + 1, Lp)]];
          return [A.sx + (B.sx - A.sx) * e, A.sy + (B.sy - A.sy) * e];
        };
        for (let p = pulses.length - 1; p >= 0; p--) {
          const P = pulses[p];
          const Lp = P.path.length - 1;
          if (P.dying) {
            P.fade -= dtc / 0.7;
            if (P.fade <= 0) { pulses.splice(p, 1); continue; }
          } else {
            P.prog += (dtc * P.spd) / Lp;
            if (P.prog >= 1) { P.prog = 1; P.dying = 1; P.fade = 1; P.flash = 1; }
          }
          const fade = P.dying ? Math.max(0, P.fade) : 1;
          const head = P.prog;
          const t0 = P.dying ? (1 - P.fade) * 0.85 : 0;
          const lv = P.lv;
          // 活动等级 → 颜色浓度：低=柔和琥珀，高=炽热红
          const col = a => {
            const r = Math.round(230 - lv * 13);
            const g = Math.round(160 - lv * 100);
            const b = Math.round(70 - lv * 26);
            return 'rgba(' + r + ',' + g + ',' + b + ',' + (a * fade * (0.45 + lv * 0.55)).toFixed(3) + ')';
          };
          const STEPS = 12;
          let pv = pathPos(P.path, t0);
          for (let sI = 1; sI <= STEPS; sI++) {
            const tt = t0 + (head - t0) * (sI / STEPS);
            const v = pathPos(P.path, tt);
            const tf = (tt - t0) / Math.max(0.001, head - t0);
            const wdt = 0.5 + (0.9 + lv * 1.8) * tf;
            ctx.strokeStyle = col(Math.pow(tf, 1.5) * 0.85);
            ctx.lineWidth = wdt;
            ctx.beginPath(); ctx.moveTo(pv[0], pv[1]); ctx.lineTo(v[0], v[1]); ctx.stroke();
            pv = v;
          }
          const tv = pathPos(P.path, Math.max(t0, head - 0.10));
          ctx.fillStyle = col(0.3);
          ctx.fillRect(tv[0] - 1.5, tv[1] - 1.5, 3, 3);
          // 柔光头（光晕大小/亮度随等级）
          const hv = pathPos(P.path, head);
          const gr2 = (7 + lv * 7) * (0.4 + 0.6 * fade);
          const rC = Math.round(230 - lv * 13), gC = Math.round(160 - lv * 100), bC = Math.round(70 - lv * 26);
          if (!isFinite(hv[0]) || !isFinite(hv[1])) continue;
          const gr = ctx.createRadialGradient(hv[0], hv[1], 0, hv[0], hv[1], gr2);
          gr.addColorStop(0, 'rgba(' + rC + ',' + gC + ',' + bC + ',0.9)');
          gr.addColorStop(0.4, 'rgba(' + rC + ',' + gC + ',' + bC + ',0.3)');
          gr.addColorStop(1, 'rgba(' + rC + ',' + gC + ',' + bC + ',0)');
          ctx.fillStyle = gr;
          ctx.fillRect(hv[0] - gr2, hv[1] - gr2, gr2 * 2, gr2 * 2);
          ctx.fillStyle = col(0.9 * fade);
          ctx.fillRect(hv[0] - 1.6, hv[1] - 1.6, 3.2, 3.2);
          // 抵达节点闪光
          if (P.flash > 0) {
            P.flash -= dtc * 1.6;
            const endv = pathPos(P.path, 1);
            ctx.fillStyle = col(Math.max(0, P.flash) * 0.9);
            ctx.fillRect(endv[0] - 3, endv[1] - 3, 6, 6);
          }
        }
      }
      // ── 神经粒子流绘制：对应位置的点阵被设备自然吸走，无固定连线 ──
      if (!reduceMotion) {
        const flow = 1 - sstep(0.012, 0.075, smooth);
        if (flow > 0.02) {
          for (const fl of flows) {
            if (!fl.hasA || !fl.face.length) continue;
            const lx = fl.lax, ly = fl.lay;
            for (const c of fl.parts) {
              c.p += dtc * c.spd * (0.8 + 0.2 * Math.sin(t * 0.5 + c.seed));
              if (c.p >= 1) { c.p = 0; c.born = false; }
              if (!c.born) {
                const d = fl.face[(Math.random() * fl.face.length) | 0];
                c.sx0 = d.sx; c.sy0 = d.sy;
                c.bow = (Math.random() - 0.5) * 130;
                c.born = true;
              }
              const e = c.p * c.p * (3 - 2 * c.p);
              const q = e, iq = 1 - q;
              const mxp = (c.sx0 + lx) / 2, myp = (c.sy0 + ly) / 2;
              const dl = Math.hypot(lx - c.sx0, ly - c.sy0) || 1;
              const Cx = mxp - (ly - c.sy0) / dl * c.bow, Cy = myp + (lx - c.sx0) / dl * c.bow;
              for (let tr = 0; tr < 4; tr++) {
                const qq = q - tr * 0.03;
                if (qq <= 0.01) continue;
                const iq = 1 - qq;
                const bx = iq * iq * c.sx0 + 2 * iq * qq * Cx + qq * qq * lx;
                const by = iq * iq * c.sy0 + 2 * iq * qq * Cy + qq * qq * ly;
                const wob = Math.sin(qq * 9 + c.seed) * 3.4 * Math.sin(Math.PI * qq);
                const wxx = -(ly - c.sy0) / dl, wyy = (lx - c.sx0) / dl;
                const al = Math.pow(Math.max(0, Math.sin(Math.PI * qq)), 0.8) * 0.6 * flow * (1 - tr * 0.3);
                const sz = c.sz * (1 - tr * 0.2);
                ctx.fillStyle = 'rgba(' + c.hue[0] + ',' + c.hue[1] + ',' + c.hue[2] + ',' + al.toFixed(3) + ')';
                ctx.fillRect(bx + wxx * wob - sz / 2, by + wyy * wob - sz / 2, sz, sz);
              }
            }
          }
        }
      }
      ctx.restore();
    };
  }

  /* ── FIG.3 实测图表（坐标纸，进入视口徐徐绘制） ── */
  function figDrawer(canvas) {
    const ctx = canvas.getContext('2d');
    let p = 0, started = false;
    function drawFrame() {
      const [w, h] = fit(canvas);
      ctx.fillStyle = '#f7f1df';
      ctx.fillRect(0, 0, w, h);
      const L = w * 0.09, B = h * 0.82, T = h * 0.12, R = w * 0.95;
      ctx.strokeStyle = 'rgba(31,30,27,0.09)';
      ctx.lineWidth = 1;
      for (let x = L; x <= R; x += (R - L) / 12) { ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, B); ctx.stroke(); }
      for (let y = T; y <= B; y += (B - T) / 8) { ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke(); }
      ctx.strokeStyle = '#1f1e1b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = '#8d877a';
      ctx.font = `${Math.max(9, Math.round(w * 0.014))}px "SF Mono", Menlo, monospace`;
      ctx.textAlign = 'left';
      ctx.fillText('ACC %', L * 0.2, T - 8);
      ctx.textAlign = 'right';
      ctx.fillText('EPOCHS →', R, B + 22);
      const y95 = B - (B - T) * 0.86;
      ctx.strokeStyle = 'rgba(217,58,43,0.55)';
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(L, y95); ctx.lineTo(R, y95); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(217,58,43,0.85)';
      ctx.textAlign = 'left';
      ctx.fillText('HUMAN BASELINE', L + 8, y95 - 8);
      const accY = u => B - (0.9 * (1 - Math.exp(-3.1 * u)) + Math.sin(u * 11) * 0.02 * u) * (B - T) * 0.95;
      p = Math.min(1, p + 0.012);
      const endX = L + (R - L) * p;
      ctx.strokeStyle = '#1f1e1b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let x = L; x <= endX; x += 2) {
        const u = (x - L) / (R - L);
        const y = accY(u);
        x === L ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (p >= 0.999) {
        const y = accY(1);
        ctx.fillStyle = '#d93a2b';
        ctx.beginPath(); ctx.arc(R, y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.font = `700 ${Math.max(10, Math.round(w * 0.018))}px "SF Mono", Menlo, monospace`;
        ctx.textAlign = 'right';
        ctx.fillText('96.4%', R - 10, y - 14);
      }
    }
    return {
      canvas,
      start() {
        if (started) return;
        started = true;
        const tick = () => { if (p < 1) { drawFrame(); setTimeout(tick, 40); } };
        tick();
      },
      force() { p = 1; drawFrame(); }
    };
  }

  /* ── 2. 手机情绪解码：颜文字轮换 + 乱码过渡 ── */
  const EMO = [
    '(^_^)', '(T_T)', '(⊙o⊙)', '(>_<)', '(¬_¬)', '(♥‿♥)', '(-_-)',
  ];
  const SCRAMBLE = '#$%&@?!<>*/+=~^';
  function initEmo() {
    const face = document.getElementById('emoFace');
    if (!face) return;
    let i = 0;
    function show() {
      const f = EMO[i % EMO.length];
      i++;
      let frame = 0;
      const total = 9;
      const iv = setInterval(() => {
        frame++;
        if (frame < total) {
          face.textContent = f.split('').map(c =>
            (c === '(' || c === ')') ? c : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0]
          ).join('');
        } else {
          clearInterval(iv);
          face.textContent = f;
          setTimeout(show, 2300);
        }
      }, 45);
    }
    if (reduceMotion) {
      face.textContent = EMO[0];
      return;
    }
    show();
  }

  /* ── 时钟 / 浮现 ── */
  function initDOM() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  }

  /* ── 开机时序：四机堆叠自检 → 四散展开 → 中心标题 ── */
  function bootSeq() {
    const stack = document.getElementById('deviceStack');
    const center = document.getElementById('stageCenter');
    if (!stack || !center) return;
    const phoneUi = window.matchMedia('(max-width: 700px)').matches;
    if (reduceMotion || phoneUi) {
      // 手机不放设备，直接亮出标题
      stack.classList.remove('booting');
      center.classList.add('show');
      document.querySelectorAll('.boot').forEach(b => b.classList.add('done'));
      return;
    }
    if (reduceMotion) {
      stack.classList.remove('booting');
      center.classList.add('show');
      document.querySelectorAll('.boot').forEach(b => b.classList.add('done'));
      return;
    }
    // 开场与第一页合并：标题直接在场，设备四角就位，自检在各屏内原地完成
    stack.classList.remove('booting');
    center.classList.add('show');
    const bios = document.querySelector('.bios');
    const lines = ['POST v2.1', '', 'MEM CHECK ..... 3072K OK', 'CRT WARM-UP ... OK', 'LINK TEST ..... OK', 'BOOT COMPLETE'];
    lines.forEach((ln, i) => {
      setTimeout(() => {
        if (!bios) return;
        const d = document.createElement('div');
        d.textContent = ln;
        bios.appendChild(d);
      }, 500 + i * 380);
    });
    // 各机屏幕错峰点亮（手表 → 手机 → 笔记本 → 台式）
    [['.boot-watch', 900], ['.boot-phone', 1350], ['.boot-laptop', 1800], ['.boot-desktop', 2300]]
      .forEach(([sel, tm]) => setTimeout(() => {
        const el = document.querySelector(sel);
        if (el) el.classList.add('done');
      }, tm));
  }

  /* ── 启动 ── */
  function boot() {
    initDOM();
    initIdPhotos();

    const draws = [];
    const cs = document.getElementById('cvHyper');
    const cp = document.getElementById('cvPulse');
    const cpl = document.getElementById('cvPatch');
    const heroOnly = fn => dt => {
      if ((window.__deckIdx || 0) !== 0) return;   // 离开首页时四台设备不画
      fn(dt);
    };
    if (cs) draws.push(heroOnly(hyperscanLoop(cs)));
    if (cp) draws.push(heroOnly(pulseLoop(cp)));
    if (cpl) draws.push(heroOnly(patchLoop(cpl)));
    draws.push(initBrainBg());
    initEmo();
    bootSeq();


    /* Research 导览手风琴 */
    document.querySelectorAll('.acc-head').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.acc-item.open').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });

    // FIG.3 图表（进入视口后徐徐绘制，完成后静止）
    const figEl = document.getElementById('cvFig');
    if (figEl) {
      const fig = figDrawer(figEl);
      const fio = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { fig.start(); fio.unobserve(en.target); } });
      }, { threshold: 0.25 });
      fio.observe(figEl);
    }

    let last = 0, rafAlive = false;
    const drawErrs = {};
    function frame(now) {
      rafAlive = true;
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (let di = draws.length - 1; di >= 0; di--) {
        try {
          draws[di](dt);
        } catch (e) {
          drawErrs[di] = (drawErrs[di] || 0) + 1;
          window.__frameErrCount = (window.__frameErrCount || 0) + 1;
          // 错误日志封顶，防止无限拼接拖垮主线程
          window.__frameErr = ('' + window.__frameErr).slice(-1200)
            + '\n[draw ' + di + ' x' + drawErrs[di] + '] ' + e.message;
          if (drawErrs[di] >= 40) {              // 连续出错：该绘制下岗隔离
            draws.splice(di, 1);
            window.__frameErr += '\n[draw ' + di + ' quarantined]';
          }
        }
      }
    }
    if (reduceMotion) {
      draws.forEach(d => d(1));
      if (plot) { plot.resume = true; plot.draw(10); }
      if (figEl) { figDrawerForce(figEl); }
      return;
    }
    requestAnimationFrame(frame);
    // rAF 失联看门狗
    setInterval(() => {
      if (!rafAlive) frame(performance.now());
      rafAlive = false;
    }, 40);
  }

  function figDrawerForce(canvas) {
    const ctx = canvas.getContext('2d');
    const drawer = figDrawer(canvas);
    drawer.force();
  }

  function safeBoot() { try { boot(); } catch (e) { window.__bootErr = (e && e.stack) || String(e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeBoot);
  else safeBoot();
})();
