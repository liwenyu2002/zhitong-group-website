(() => {
  "use strict";

  const cv = document.getElementById("mapCanvas");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const deck = document.getElementById("deck");
  const section = document.getElementById("members");
  const membersIdx = Array.from(deck.querySelectorAll(":scope > .slide")).indexOf(section);

  const M = [
    { id: "zhang",  label: "张致同 PI", dirs: ["d1", "d2", "d3"], pi: true,  seal: "张" },
    { id: "liwy",   label: "李文宇", dirs: ["d7"], seal: "李" },
    { id: "wangjy", label: "王君逸", dirs: ["d5"], seal: "王" },
    { id: "liulh",  label: "刘丽华", dirs: ["d5"], seal: "刘" },
    { id: "sunyx",  label: "孙钰晓", dirs: ["d5"], seal: "孙" },
    { id: "liudk",  label: "刘鼎坤", dirs: ["d4"], seal: "刘" },
    { id: "shensc", label: "沈思成", dirs: ["d6"], seal: "沈" },
    { id: "maxm",   label: "马晓猛", dirs: ["d6"], seal: "马" }
  ];
  const T = [
    { id: "d1", label: "Ⅰ 脑机接口系统", rom: "Ⅰ" },
    { id: "d2", label: "Ⅱ 神经电子界面", rom: "Ⅱ" },
    { id: "d3", label: "Ⅲ 可穿戴传感", rom: "Ⅲ" },
    { id: "d4", label: "Ⅳ 脑电解码与大模型", rom: "Ⅳ" },
    { id: "d5", label: "Ⅴ EEG 辅助诊断", rom: "Ⅴ" },
    { id: "d6", label: "Ⅵ 类脑智能", rom: "Ⅵ" },
    { id: "d7", label: "Ⅶ 眼电交互", rom: "Ⅶ" }
  ];

  const INK = "23,23,23", RED = "217,58,43", SOFT = "139,130,113";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, CX = 0, CY = 0, dpr = 1;
  let R_OUT = 0, R_IN = 0;
  let nodes = [];
  let hover = null;
  let phase = 0, lastT = 0, rafOn = false;

  /* 方向（内环居中）+ 成员（外环，按方向方位聚集） */
  function layout() {
    const rect = cv.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.round(Math.min(W * 0.7, 820));
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2; CY = H / 2;
    R_IN  = Math.min(W, H) * 0.16;
    R_OUT = Math.min(W, H) * 0.40;

    const old = new Map(nodes.map(n => [n.id, n]));
    nodes = [];
    // 内环：7 个方向节点
    T.forEach((t, i) => {
      const ang = -Math.PI / 2 + i * (Math.PI * 2 / 7);
      const prev = old.get(t.id);
      nodes.push({
        id: t.id, label: t.label, rom: t.rom, kind: "t",
        x: prev ? prev.x : CX + Math.cos(ang) * R_IN,
        y: prev ? prev.y : CY + Math.sin(ang) * R_IN,
        ang
      });
    });
    // 外环：成员，聚集在自己方向的外侧方位
    const groupSpread = { d5: [-0.42, 0, 0.42], d6: [-0.3, 0.3] };
    M.forEach((m, mi) => {
      const ang = -Math.PI / 2 + Math.PI / 8 + mi * (Math.PI * 2 / M.length);
      const prev = old.get(m.id);
      nodes.push({
        id: m.id, label: m.label, seal: m.seal, kind: "m",
        x: prev ? prev.x : CX + Math.cos(ang) * R_OUT,
        y: prev ? prev.y : CY + Math.sin(ang) * R_OUT,
        ang
      });
    });
  }
  layout();
  window.addEventListener("load", layout);
  new ResizeObserver(layout).observe(cv);

  const EDGES = (() => {
    const e = [];
    M.forEach(m => m.dirs.forEach(d => e.push([m.id, d])));
    return e;
  })();
  const byId = id => nodes.find(n => n.id === id);

  function activeSet(focusId) {
    if (!focusId) return null;
    const set = new Set([focusId]);
    EDGES.forEach(([a, b]) => {
      if (a === focusId || b === focusId) { set.add(a); set.add(b); }
    });
    return set;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const act = activeSet(hover);
    window.__mapDraws = (window.__mapDraws || 0) + 1;
    if (window.__mapDraws % 30 === 0) updateHud();

    // 双导引虚线圆
    ctx.setLineDash([2, 6]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(" + SOFT + ",0.4)";
    ctx.beginPath(); ctx.arc(CX, CY, R_IN, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(CX, CY, R_OUT, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // 连线：成员(外) → 方向(内)；悬停的关系触发电流
    EDGES.forEach(([a, b], i) => {
      const A = byId(a), B = byId(b);
      const hot = act && (act.has(a) && act.has(b));
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const dx = CX - mx, dy = CY - my;
      const dl = Math.hypot(dx, dy) || 1;
      const bx = mx + dx * 0.12, by = my + dy * 0.12;
      if (hot) {
        drawElectric(A.x, A.y, bx, by, B.x, B.y);
      } else {
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.quadraticCurveTo(bx, by, B.x, B.y);
        ctx.strokeStyle = "rgba(" + SOFT + ",0.5)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    });

    // 内环方向节点：小圆 + 罗马数字 + 外侧标签
    T.forEach((t) => {
      const n = nodes.find(nn => nn.id === t.id);
      if (!n) return;
      const hot = act && act.has(n.id);
      ctx.save();
      ctx.fillStyle = hot ? "#fdfaf1" : "rgba(234, 226, 204, 1)";
      ctx.strokeStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.8)";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(n.x, n.y, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",1)";
      ctx.font = "600 13px 'Songti SC', serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n.rom, n.x, n.y + 1);
      const la = n.ang;
      const lx = CX + Math.cos(la) * (R_IN + 66);
      const ly = CY + Math.sin(la) * (R_IN + 66);
      ctx.font = "12.5px 'Songti SC', serif";
      ctx.strokeStyle = "rgba(234, 226, 204, 0.9)";
      ctx.lineWidth = 3.5;
      ctx.strokeText(n.label, lx, ly);
      ctx.fillStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.88)";
      ctx.textAlign = "center";
      ctx.fillText(n.label, lx, ly);
      ctx.restore();
    });

    // 外圈成员印章
    M.forEach((m, mi) => {
      const n = nodes.find(n => n.id === m.id);
      if (!n) return;
      const hot = act && act.has(n.id);
      ctx.save();
      ctx.fillStyle = "#fdfaf1";
      ctx.strokeStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.9)";
      ctx.lineWidth = hot ? 2 : 1.4;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(n.x - 16, n.y - 16, 32, 32, 6); else ctx.rect(n.x - 16, n.y - 16, 32, 32);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",1)";
      ctx.font = "600 15px 'Songti SC', serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n.seal, n.x, n.y + 1);
      // 成员名：印章朝外一侧
      const c = Math.cos(n.ang);
      const lx = n.x + Math.cos(n.ang) * 32, ly = n.y + Math.sin(n.ang) * 32;
      ctx.font = "14px 'Songti SC', serif";
      ctx.fillStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.9)";
      ctx.textAlign = c > 0.3 ? "left" : (c < -0.3 ? "right" : "center");
      ctx.fillText(m.label.replace(" PI", ""), lx, ly);
      ctx.restore();
    });
  }

  function updateHud() {
    const hud = document.getElementById("mapHud");
    if (hud) hud.textContent = "hover: " + (hover || "—") + " | draws: " + (window.__mapDraws || 0) + (window.__mapErr ? " | ERR: " + window.__mapErr : "");
  }

  function loop(now) {
    if (!rafOn) return;
    const dt = Math.min((now - lastT) / 1000, 0.05) || 0.016;
    lastT = now;
    phase += dt;
    try { draw(now); } catch (e) { window.__mapErr = String(e && e.message || e); }
    requestAnimationFrame(loop);
  }

  /* 电流：沿曲线上下文抖动的电弧（减弱版） */
  function drawElectric(x1, y1, cx, cy, x2, y2) {
    const N = 26;
    const pts = [];
    const hyp = Math.hypot(x2 - x1, y2 - y1) || 1;
    for (let s = 0; s <= N; s++) {
      const u = s / N;
      const px = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2;
      const py = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2;
      if (s === 0 || s === N) { pts.push([px, py]); continue; }
      const j = (Math.random() - 0.5) * 7;
      const nx = -(y2 - y1) / hyp, ny = (x2 - x1) / hyp;
      pts.push([px + nx * j, py + ny * j]);
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const pt of pts.slice(1)) ctx.lineTo(pt[0], pt[1]);
    ctx.strokeStyle = "rgba(255,190,140,0.2)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const pt of pts.slice(1)) ctx.lineTo(pt[0], pt[1]);
    ctx.strokeStyle = "rgba(" + RED + ",0.85)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    const ex = pts[pts.length - 1][0], ey = pts[pts.length - 1][1];
    ctx.fillStyle = "rgba(" + RED + ",0.9)";
    ctx.beginPath(); ctx.arc(ex, ey, 2.4, 0, Math.PI * 2); ctx.fill();
  }

  function ensureLoop() {
    if (!rafOn) {
      rafOn = true;
      lastT = performance.now();
      requestAnimationFrame(loop);
    }
  }

  setInterval(() => {
    const on = window.__deckIdx === membersIdx && !document.hidden;
    if (on && !rafOn) ensureLoop();
    if (rafOn && (!on || document.hidden)) rafOn = false;
  }, 300);

  /* 仅悬停高亮 */
  cv.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bestD = 1e9;
    nodes.forEach(n => {
      const d = Math.hypot(x - n.x, y - n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    hover = bestD < 130 ? best.id : null;
    window.__mapDebug = { hover, bestD: Math.round(bestD), rafOn, deckIdx: window.__deckIdx, membersIdx };
    updateHud();
    cv.style.cursor = hover ? "pointer" : "default";
    try { draw(performance.now()); } catch (e) { window.__mapDrawErr = String(e); updateHud(); }   // 同步重绘
  });
  cv.addEventListener("pointerleave", () => {
    hover = null;
    updateHud();
    try { draw(performance.now()); } catch (e) {}
  });

  new ResizeObserver(layout).observe(cv);
  window.addEventListener("load", layout);
})();
