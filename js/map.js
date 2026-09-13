/* ============================================================
   人员课题图谱 v2：协作网络
   方向枢纽(内环) ← 关键词(中环) ← 成员(外环) 直连关键词
   共享关键词 = 合作交汇点；节点自然漂浮、可拖拽、悬停通电
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
    { id: "m-zhang",  label: "张致同 PI", pi: true,  seal: "张",
      kws: ["柔性电极", "植入式", "在体记录", "界面材料", "基础模型"] },
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
    { id: "d1", rom: "Ⅰ", label: "脑机接口系统", kws: ["柔性电极", "植入式", "在体记录"] },
    { id: "d2", rom: "Ⅱ", label: "神经电子界面", kws: ["界面材料", "变刚度", "干电极"] },
    { id: "d3", rom: "Ⅲ", label: "可穿戴传感", kws: ["柔性传感", "呼吸监测"] },
    { id: "d4", rom: "Ⅳ", label: "脑电解码与大模型", kws: ["多模态大模型", "语义解码", "BrainSeg"] },
    { id: "d5", rom: "Ⅴ", label: "EEG 辅助诊断", kws: ["基础模型", "跨被试适配", "情绪解码", "脑卒中诊疗"] },
    { id: "d6", rom: "Ⅵ", label: "类脑智能", kws: ["Spiking", "在线学习", "自主科研"] },
    { id: "d7", rom: "Ⅶ", label: "眼电交互", kws: ["EOG", "ACED"] }
  ];
  /* 中环关键词节点定义（由方向 kws 展开） */
  const K = [];
  T.forEach((t, ti) => t.kws.forEach((label, ki) => {
    K.push({ id: "k-" + t.id + "-" + ki, dir: t.id, label });
  }));

  const INK = "23,23,23", RED = "217,58,43", SOFT = "139,130,113";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, CX = 0, CY = 0, dpr = 1;
  let R_HUB = 0, R_KEY = 0, R_MEM = 0;
  let nodes = [];       // {id,label,kind,x,y,hx,hy,ang,wobA,wobS,ph,seal,rom,dir,kws}
  let hover = null;
  let phase = 0, lastT = 0, rafOn = false;

  function layout() {
    const rect = cv.getBoundingClientRect();
    W = Math.max(340, rect.width);
    H = Math.round(Math.min(W * 0.72, 860));
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2; CY = H / 2;
    R_HUB = Math.min(W, H) * 0.15;
    R_KEY = Math.min(W, H) * 0.29;
    R_MEM = Math.min(W, H) * 0.43;

    const old = new Map(nodes.map(n => [n.id, n]));
    nodes = [];
    // 方向枢纽（内环）
    T.forEach((t, i) => {
      const ang = -Math.PI / 2 + i * (Math.PI * 2 / 7);
      const prev = old.get(t.id);
      nodes.push({
        id: t.id, label: t.label, rom: t.rom, kind: "hub",
        x: prev && prev.x !== undefined ? prev.x : CX + Math.cos(ang) * R_HUB,
        y: prev && prev.y !== undefined ? prev.y : CY + Math.sin(ang) * R_HUB,
        ang
      });
    });
    // 关键词（中环，围绕方向方位散布）
    const hubAngOf = {};
    T.forEach((t, i) => { hubAngOf[t.id] = -Math.PI / 2 + i * (Math.PI * 2 / 7); });
    K.forEach((k, i) => {
      const a = hubAngOf[k.dir] + (i % 3 - 1) * 0.36 + (i % 2 ? 0.12 : -0.06);
      const rr = R_KEY * (0.94 + (i % 3) * 0.1);
      const prev = old.get(k.id);
      nodes.push({
        id: k.id, label: k.label, kind: "key",
        x: prev && prev.x !== undefined ? prev.x : CX + Math.cos(a) * rr,
        y: prev && prev.y !== undefined ? prev.y : CY + Math.sin(a) * rr,
        wobA: 3.4, wobS: 0.55 + (i % 5) * 0.09, ph: i * 1.9
      });
    });
    // 成员（外环均匀）
    M.forEach((m, i) => {
      const ang = -Math.PI / 2 + (i + 0.5) * (Math.PI * 2 / M.length);
      const prev = old.get(m.id);
      nodes.push({
        id: m.id, label: m.label.replace(" PI", ""), seal: m.seal, kind: "mem", pi: !!m.pi, mdef: m,
        x: prev && prev.x !== undefined ? prev.x : CX + Math.cos(ang) * R_MEM,
        y: prev && prev.y !== undefined ? prev.y : CY + Math.sin(ang) * R_MEM,
        ang,
        wobA: 4, wobS: 0.35 + (i % 4) * 0.07, ph: i * 1.4
      });
    });
  }
  layout();
  window.addEventListener("load", layout);
  new ResizeObserver(layout).observe(cv);

  const byId = id => nodes.find(n => n.id === id);

  /* 协作关系：成员 → 关键词 */
  const LINKS = (() => {
    const e = [];
    M.forEach(m => m.kws.forEach(kw => {
      const kn = nodes.find(n => n.label === kw);
      if (kn) e.push({ a: m.id, b: kn.id });
    }));
    return e;
  })();
  /* 关键词 → 方向枢纽（细线） */
  const KEY_HUB = {};
  K.forEach((k, i) => { KEY_HUB["k-" + i] = k.dir; });

  function activeSet(focusId) {
    if (!focusId) return null;
    const set = new Set([focusId]);
    LINKS.forEach(l => {
      if (l.a === focusId) set.add(l.b);
      if (l.b === focusId) set.add(l.a);
    });
    // 关键词 → 其方向枢纽
    nodes.filter(n => n.kind === "key" && set.has(n.id)).forEach(n => {
      const kdef = K.find(k => k.label === n.label);
      if (kdef) set.add(kdef.dir);
    });
    return set;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const act = activeSet(hover);

    // 双导引虚线圆（关键词环 + 成员环）
    ctx.setLineDash([2, 6]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(" + SOFT + ",0.3)";
    ctx.beginPath(); ctx.arc(CX, CY, R_KEY, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(CX, CY, R_MEM, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // 连线：成员 → 关键词（悬停通电：辉光 + 红弧 + 流动信号点）
    LINKS.forEach((l, i) => {
      const A = byId(l.a), B = byId(l.b);
      const hot = act && (act.has(l.a) || act.has(l.b));
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const dx = CX - mx, dy = CY - my;
      const dl = Math.hypot(dx, dy) || 1;
      const bx = mx + dx * 0.1, by = my + dy * 0.1;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.quadraticCurveTo(bx, by, B.x, B.y);
      if (hot) {
        ctx.strokeStyle = "rgba(" + RED + ",0.75)";
        ctx.lineWidth = 1.8;
      } else {
        ctx.strokeStyle = "rgba(" + SOFT + ",0.3)";
        ctx.lineWidth = 1;
      }
      ctx.stroke();
      if (hot && !reduceMotion) {
        for (let k = 0; k < 2; k++) {
          const tt = (phase * (0.4 + k * 0.25) + i * 0.21) % 1;
          const qx = (1 - tt) * (1 - tt) * A.x + 2 * (1 - tt) * tt * bx + tt * tt * B.x;
          const qy = (1 - tt) * (1 - tt) * A.y + 2 * (1 - tt) * tt * by + tt * tt * B.y;
          ctx.fillStyle = "rgba(" + RED + ",0.9)";
          ctx.beginPath(); ctx.arc(qx, qy, 2.4, 0, Math.PI * 2); ctx.fill();
        }
      }
    });

    // 关键词 → 枢纽细线
    nodes.forEach(n => {
      if (n.kind !== "key") return;
      const kdef = K.find(k => k.label === n.label);
      if (!kdef) return;
      const hub = byId(kdef.dir);
      if (!hub) return;
      const hot = act && (act.has(n.id) || act.has(hub.id));
      ctx.beginPath();
      ctx.moveTo(n.x, n.y); ctx.lineTo(hub.x, hub.y);
      ctx.strokeStyle = hot ? "rgba(" + RED + ",0.4)" : "rgba(" + SOFT + ",0.22)";
      ctx.lineWidth = hot ? 1.4 : 1;
      ctx.stroke();
    });

    // 方向枢纽
    T.forEach((t, i) => {
      const n = nodes[i];
      if (!n) return;
      const hot = act && act.has(n.id);
      ctx.save();
      ctx.fillStyle = hot ? "rgba(" + RED + ",1)" : "rgba(234, 226, 204, 1)";
      ctx.strokeStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.8)";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(n.x, n.y, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = hot ? "#fdfaf1" : "rgba(" + INK + ",1)";
      ctx.font = "600 13px 'Songti SC', serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(t.rom, n.x, n.y + 1);
      // 方向名
      const la = n.ang;
      const lx = CX + Math.cos(la) * (R_HUB + 62);
      const ly = CY + Math.sin(la) * (R_HUB + 62);
      ctx.font = "12.5px 'Songti SC', serif";
      ctx.strokeStyle = "rgba(234, 226, 204, 0.9)";
      ctx.lineWidth = 3.5;
      ctx.strokeText(t.label, lx, ly);
      ctx.fillStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.88)";
      ctx.textAlign = "center";
      ctx.fillText(t.label, lx, ly);
      ctx.restore();
    });

    // 成员印章
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
      const c = Math.cos(n.ang);
      const lx = n.x + Math.cos(n.ang) * 30, ly = n.y + Math.sin(n.ang) * 30;
      ctx.font = "13.5px 'Songti SC', serif";
      ctx.fillStyle = hot ? "rgba(" + RED + ",1)" : "rgba(" + INK + ",0.9)";
      ctx.textAlign = c > 0.3 ? "left" : (c < -0.3 ? "right" : "center");
      ctx.fillText(m.label.replace(" PI", ""), lx, ly);
      ctx.restore();
    });
  }

  function loop(now) {
    if (!rafOn) return;
    const dt = Math.min((now - lastT) / 1000, 0.05) || 0.016;
    lastT = now;
    phase += dt;
    try { draw(now); } catch (e) { /* 单帧异常不杀循环 */ }
    requestAnimationFrame(loop);
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

  /* 悬停与拖拽 */
  const pos = e => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let dragNode = null, dragOff = null;
  cv.addEventListener("pointerdown", e => {
    const p = pos(e);
    let best = null, bestD = 1e9;
    nodes.forEach(n => {
      const d = Math.hypot(p.x - n.x, p.y - n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    if (best && bestD < 32) {
      dragNode = best;
      dragOff = { dx: best.x - p.x, dy: best.y - p.y };
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });
  cv.addEventListener("pointermove", e => {
    const p = pos(e);
    if (dragNode) {
      dragNode.x = p.x + dragOff.dx; dragNode.y = p.y + dragOff.dy;
      try { draw(performance.now()); } catch (e) {}
      return;
    }
    let best = null, bestD = 1e9;
    nodes.forEach(n => {
      const d = Math.hypot(p.x - n.x, p.y - n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    hover = bestD < 46 ? best.id : null;
    cv.style.cursor = hover ? "pointer" : "default";
    try { draw(performance.now()); } catch (e) {}
  });
  cv.addEventListener("pointerup", () => { dragNode = null; });
  cv.addEventListener("pointerleave", () => {
    dragNode = null; hover = null;
    try { draw(performance.now()); } catch (e) {}
  });
  cv.addEventListener("dblclick", () => layout());

  new ResizeObserver(layout).observe(cv);
  window.addEventListener("load", layout);
})();
