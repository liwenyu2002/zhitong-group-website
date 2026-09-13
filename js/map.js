/* ============================================================
   人员课题图谱 v6：两层协作网络
   关键词(中环内收) ← 成员落款(外环)，成员直连关键词
   落款 = 朱砂印章 + 横排姓名；悬停级联、漂浮、可拖拽
   ============================================================ */
(() => {
  "use strict";

  const cv = document.getElementById("mapCanvas");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const deck = document.getElementById("deck");
  const section = document.getElementById("members");
  const membersIdx = Array.from(deck.querySelectorAll(":scope > .slide")).indexOf(section);

  const M = [
    { id: "m-liwy",   label: "李文宇", seal: "李",
      kws: ["EOG", "ACED", "跨被试适配", "柔性传感"] },
    { id: "m-wangjy", label: "王君逸", seal: "王",
      kws: ["基础模型", "跨被试适配", "情绪解码"] },
    { id: "m-liulh",  label: "刘丽华", seal: "刘",
      kws: ["情绪解码", "基础模型", "GNN-Mamba"] },
    { id: "m-sunyx",  label: "孙钰晓", seal: "孙",
      kws: ["脑卒中诊疗", "多智能体"] },
    { id: "m-liudk",  label: "刘鼎坤", seal: "刘",
      kws: ["多模态大模型", "语义解码", "BrainSeg"] },
    { id: "m-shensc", label: "沈思成", seal: "沈",
      kws: ["Spiking", "在线学习"] },
    { id: "m-maxm",   label: "马晓猛", seal: "马",
      kws: ["自主科研", "多模态大模型", "Meta Research"] }
  ];
  const T = [
    { id: "d1", rom: "Ⅰ", label: "脑机接口系统",   kws: ["柔性电极", "植入式", "在体记录"] },
    { id: "d2", rom: "Ⅱ", label: "神经电子界面",   kws: ["界面材料", "变刚度", "干电极"] },
    { id: "d3", rom: "Ⅲ", label: "可穿戴传感",     kws: ["柔性传感", "呼吸监测"] },
    { id: "d4", rom: "Ⅳ", label: "脑电解码与大模型", kws: ["多模态大模型", "语义解码", "BrainSeg", "GNN-Mamba"] },
    { id: "d5", rom: "Ⅴ", label: "EEG 辅助诊断",   kws: ["基础模型", "跨被试适配", "情绪解码", "脑卒中诊疗"] },
    { id: "d6", rom: "Ⅵ", label: "类脑智能",       kws: ["Spiking", "在线学习", "自主科研", "多智能体", "Meta Research"] },
    { id: "d7", rom: "Ⅶ", label: "眼电交互",       kws: ["EOG", "ACED"] }
  ];
  /* 中环关键词节点（由方向 kws 展开） */
  const K = [];
  T.forEach(t => t.kws.forEach((label, ki) => {
    K.push({ id: "k-" + t.id + "-" + ki, dir: t.id, label });
  }));
  /* 只保留至少被一位成员使用的关键词，孤儿关键词不上图 */
  const usedKw = new Set();
  M.forEach(m => m.kws.forEach(kw => usedKw.add(kw)));
  for (let i = K.length - 1; i >= 0; i--) if (!usedKw.has(K[i].label)) K.splice(i, 1);
  /* 仍有关键词留存的方向参与扇区划分 */
  const TD = T.filter(t => K.some(k => k.dir === t.id));

  const INK = "23,23,23", RED = "217,58,43", SOFT = "139,130,113";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, CX = 0, CY = 0, dpr = 1;
  let R_KEY = 0, R_MEM = 0;
  let nodes = [];
  let hover = null;
  let rafOn = false;

  function layout() {
    const rect = cv.getBoundingClientRect();
    W = Math.max(340, rect.width);
    // 画布高度限制在视口内，避免顶部节点钻进固定导航底下
    H = Math.round(Math.min(W * 0.72, 860, Math.max(480, innerHeight * 0.82)));
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2; CY = H / 2;
    const S = Math.min(W, H);
    R_KEY = S * 0.25;
    R_MEM = S * 0.445;

    const old = new Map(nodes.map(n => [n.id, n]));
    nodes = [];

    // 关键词：中环内收，按方向扇区排布，角度 + 半径双层散开
    const NA = TD.length;
    const hubAngOf = {};
    TD.forEach((t, i) => { hubAngOf[t.id] = -Math.PI / 2 + i * (Math.PI * 2 / NA); });
    const dirTotal = {}, dirSeen = {};
    TD.forEach(t => { dirTotal[t.id] = 0; dirSeen[t.id] = 0; });
    K.forEach(k => { dirTotal[k.dir]++; });
    const RADII = [0.84, 1.08, 0.94, 1.18, 0.88];
    K.forEach((k, i) => {
      const n = dirTotal[k.dir];
      const ki = dirSeen[k.dir]++;
      // 扇步长随关键词数量收缩，保证不侵入相邻方向扇区
      const slot = (Math.PI * 2 / NA) * 0.92;
      const step = n > 1 ? Math.min(0.5, slot / (n - 1)) : 0;
      const a = hubAngOf[k.dir] + (ki - (n - 1) / 2) * step + Math.sin(i * 5.3) * 0.05;
      const rr = R_KEY * RADII[ki % RADII.length];
      const prev = old.get(k.id);
      nodes.push({
        id: k.id, label: k.label, kind: "key", dir: k.dir,
        x: prev && prev.x !== undefined ? prev.x : CX + Math.cos(a) * rr,
        y: prev && prev.y !== undefined ? prev.y : CY + Math.sin(a) * rr,
        wobA: 3.4, wobS: 0.9 + (i % 5) * 0.13, ph: i * 1.9
      });
    });

    // 成员：外环均匀，名帖各自带一点手放歪斜
    M.forEach((m, i) => {
      const ang = -Math.PI / 2 + (i + 0.5) * (Math.PI * 2 / M.length);
      const prev = old.get(m.id);
      nodes.push({
        id: m.id, label: m.label, seal: m.seal, kind: "mem",
        tilt: Math.sin((i + 2) * 12.7) * 0.05,
        x: prev && prev.x !== undefined ? prev.x : CX + Math.cos(ang) * R_MEM,
        y: prev && prev.y !== undefined ? prev.y : CY + Math.sin(ang) * R_MEM,
        ang, wobA: 4, wobS: 0.6 + (i % 4) * 0.1, ph: i * 1.4
      });
    });

    window.__mapReady = true;
    window.__mapCount = nodes.length;
  }
  layout();
  window.addEventListener("load", layout);
  new ResizeObserver(layout).observe(cv);

  const byId = id => nodes.find(n => n.id === id);

  /* 关系边：成员 → 关键词 */
  const LINKS = [];
  M.forEach(m => m.kws.forEach(kw => {
    const kn = nodes.find(n => n.kind === "key" && n.label === kw);
    if (kn) LINKS.push({ a: m.id, b: kn.id });
  }));

  /* 悬停级联：沿边一跳点亮 */
  function activeSet(focusId) {
    if (!focusId) return null;
    const set = new Set([focusId]);
    LINKS.forEach(l => {
      if (l.a === focusId) set.add(l.b);
      if (l.b === focusId) set.add(l.a);
    });
    return set;
  }

  /* 手绘微弯矩形路径（名帖边框，抖动由 seed 确定、逐帧稳定） */
  function wobblySlip(w, h, seed) {
    const f = v => v - Math.floor(v);
    const J = k => (f(Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) - 0.5) * 3.2;
    const hw = w / 2, hh = h / 2;
    const c = [
      [-hw + J(9), -hh + J(10)], [hw + J(11), -hh + J(12)],
      [hw + J(13), hh + J(14)], [-hw + J(15), hh + J(16)]
    ];
    const mids = [
      [(c[0][0] + c[1][0]) / 2, -hh + J(1) * 0.8],
      [hw + J(2) * 0.8, (c[1][1] + c[2][1]) / 2],
      [(c[2][0] + c[3][0]) / 2, hh + J(3) * 0.8],
      [-hw + J(4) * 0.8, (c[3][1] + c[0][1]) / 2]
    ];
    ctx.beginPath();
    ctx.moveTo(c[0][0], c[0][1]);
    for (let i = 0; i < 4; i++) {
      const nc = c[(i + 1) % 4];
      ctx.quadraticCurveTo(mids[i][0], mids[i][1], nc[0], nc[1]);
    }
    ctx.closePath();
  }

  function draw(now) {
    const t = (now || performance.now()) * 0.001;
    ctx.clearRect(0, 0, W, H);
    const act = activeSet(hover);

    const wob = n => {
      if (reduceMotion || n.dragging) return [0, 0];
      const s = n.wobS || 0.4, p = n.ph || 0;
      return [Math.sin(t * s + p) * n.wobA, Math.cos(t * s * 0.8 + p * 1.3) * n.wobA * 0.6];
    };
    const P = n => { const w = wob(n); return [n.x + w[0], n.y + w[1]]; };

    // 导引虚线圆（中环 + 外环）
    ctx.setLineDash([2, 6]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(" + SOFT + ",0.28)";
    ctx.beginPath(); ctx.arc(CX, CY, R_KEY, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(CX, CY, R_MEM, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // 主线：成员 → 关键词（贝塞尔，通电时红 + 流动墨点）
    LINKS.forEach((l, i) => {
      const A = byId(l.a), B = byId(l.b);
      if (!A || !B) return;
      const [ax, ay] = P(A), [bx2, by2] = P(B);
      const hot = act && (act.has(l.a) || act.has(l.b));
      const mx = (ax + bx2) / 2, my = (ay + by2) / 2;
      const dx = CX - mx, dy = CY - my;
      const dl = Math.hypot(dx, dy) || 1;
      const cx1 = mx + dx / dl * 14, cy1 = my + dy / dl * 14;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cx1, cy1, bx2, by2);
      if (hot) { ctx.strokeStyle = "rgba(" + RED + ",0.8)"; ctx.lineWidth = 1.8; }
      else { ctx.strokeStyle = "rgba(" + SOFT + ",0.32)"; ctx.lineWidth = 1; }
      ctx.stroke();
      if (hot && !reduceMotion) {
        for (let k = 0; k < 2; k++) {
          const tt = (t * (0.35 + k * 0.22) + i * 0.17) % 1;
          const qx = (1 - tt) * (1 - tt) * ax + 2 * (1 - tt) * tt * cx1 + tt * tt * bx2;
          const qy = (1 - tt) * (1 - tt) * ay + 2 * (1 - tt) * tt * cy1 + tt * tt * by2;
          ctx.fillStyle = "rgba(" + RED + ",0.9)";
          ctx.beginPath(); ctx.arc(qx, qy, 2.3, 0, Math.PI * 2); ctx.fill();
        }
      }
    });

    // 关键词标签（中环）
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    nodes.forEach(n => {
      if (n.kind !== "key") return;
      const [x, y] = P(n);
      const hot = act && act.has(n.id);
      ctx.font = (hot ? "600 " : "") + "12.5px 'Songti SC', serif";
      ctx.fillStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.66)";
      ctx.fillText(n.label, x, y);
    });

    // 成员落款（外环）：朱砂印章（红底白文）+ 横排姓名
    nodes.forEach(n => {
      if (n.kind !== "mem") return;
      const [x, y] = P(n);
      const em = act && act.has(n.id);
      const c = Math.cos(n.ang), s = Math.sin(n.ang);
      ctx.save();
      ctx.translate(x, y);
      // 通电时的朱砂墨晕
      if (em) {
        const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 48);
        g.addColorStop(0, "rgba(" + RED + ",0.16)");
        g.addColorStop(1, "rgba(" + RED + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.fill();
      }
      // 朱砂印：手刻歪斜的红底方章
      const sw = 27;
      ctx.save();
      ctx.rotate(n.tilt || 0);
      if (em) ctx.scale(1.1, 1.1);
      wobblySlip(sw, sw, n.ph);
      ctx.fillStyle = em ? "rgba(" + RED + ",1)" : "rgba(" + RED + ",0.88)";
      ctx.fill();
      // 印章内缘白色雕痕
      ctx.strokeStyle = "rgba(253,250,241,0.55)";
      ctx.lineWidth = 0.8;
      wobblySlip(sw - 6, sw - 6, n.ph + 4.2);
      ctx.stroke();
      ctx.fillStyle = "#fdfaf1";
      ctx.font = "600 15px 'Songti SC', serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n.seal, 0, 1);
      ctx.restore();
      // 名字：沿半径向外横排
      ctx.font = (em ? "600 " : "") + "13.5px 'Songti SC', serif";
      ctx.fillStyle = em ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.9)";
      if (c > 0.35) { ctx.textAlign = "left"; ctx.fillText(n.label, sw / 2 + 7, 1); }
      else if (c < -0.35) { ctx.textAlign = "right"; ctx.fillText(n.label, -sw / 2 - 7, 1); }
      else if (s < 0) { ctx.textAlign = "center"; ctx.fillText(n.label, 0, -sw / 2 - 10); }
      else { ctx.textAlign = "center"; ctx.fillText(n.label, 0, sw / 2 + 14); }
      ctx.restore();
    });
  }

  /* 动画循环：仅成员页激活时运行 */
  function loop(now) {
    if (!rafOn) return;
    draw(now);
    requestAnimationFrame(loop);
  }
  function ensureLoop() {
    if (!rafOn) {
      rafOn = true;
      requestAnimationFrame(loop);
    }
  }
  setInterval(() => {
    const on = window.__deckIdx === membersIdx && !document.hidden;
    if (on && !rafOn) ensureLoop();
    if (rafOn && (!on || document.hidden)) rafOn = false;
  }, 300);

  /* 悬停与拖拽 */
  const evtPos = e => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let dragNode = null, dragOff = null;
  cv.addEventListener("pointerdown", e => {
    const p = evtPos(e);
    let best = null, bestD = 1e9;
    nodes.forEach(n => {
      const d = Math.hypot(p.x - n.x, p.y - n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    if (best && bestD < (best.kind === "mem" ? 34 : 30)) {
      dragNode = best;
      dragNode.dragging = true;
      dragOff = { dx: best.x - p.x, dy: best.y - p.y };
      hover = best.id;
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });
  cv.addEventListener("pointermove", e => {
    const p = evtPos(e);
    if (dragNode) {
      dragNode.x = p.x + dragOff.dx; dragNode.y = p.y + dragOff.dy;
      draw(performance.now());
      return;
    }
    let best = null, bestD = 1e9;
    nodes.forEach(n => {
      const d = Math.hypot(p.x - n.x, p.y - n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    hover = best && bestD < (best.kind === "mem" ? 38 : 36) ? best.id : null;
    cv.style.cursor = hover ? "pointer" : "default";
    draw(performance.now());
  });
  cv.addEventListener("pointerup", () => {
    if (dragNode) dragNode.dragging = false;
    dragNode = null;
  });
  cv.addEventListener("pointerleave", () => {
    if (dragNode) dragNode.dragging = false;
    dragNode = null; hover = null;
    draw(performance.now());
  });
  cv.addEventListener("dblclick", () => layout());
})();
