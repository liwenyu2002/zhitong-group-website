/* ============================================================
   信号放大器按钮：点击翻面（露出高密度引脚）→ 引脚向全屏
   四周快速发射信号 → 作为转场滑到目标页
   ============================================================ */
(() => {
  "use strict";

  const btn = document.querySelector(".amp-btn");
  if (!btn) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => matchMedia("(max-width: 700px)").matches;
  let busy = false;

  btn.addEventListener("click", e => {
    e.preventDefault();
    if (busy) return;
    busy = true;

    const targetId = btn.dataset.goto || "research";
    const goNow = () => {
      const i = window.__deckIndexOfId ? window.__deckIndexOfId(targetId) : -1;
      if (window.__deckGo && i >= 0) window.__deckGo(i);
    };

    if (reduceMotion) {                       // 减动效：直接换页
      goNow();
      setTimeout(() => { busy = false; }, 600);
      return;
    }

    btn.classList.add("flipped");             // 1. 3D 翻面露出引脚（提速）
    setTimeout(() => {                        // 2. 引脚停留一拍，WAAPI 旋转缩小（必播）
      btn.animate(
        [{ transform: "scale(1) rotate(0deg)", opacity: 1 },
         { transform: "scale(0.55) rotate(38deg)", opacity: 1, offset: 0.55 },
         { transform: "scale(0) rotate(80deg)", opacity: 0 }],
        { duration: 520, easing: "cubic-bezier(0.55, 0, 0.55, 1)", fill: "forwards" });
    }, 460);
    setTimeout(() => fire(btn), 500);         // 3. 缩小的同时信号线先射出（更长更早）
    setTimeout(goNow, 1280);                  // 4. 墨面扩满后，换页藏在底下完成
    setTimeout(() => {                        // 5. 无感复位：取消 WAAPI 动画并清态
      btn.getAnimations().forEach(a => a.cancel());
      btn.style.transition = "none";
      btn.classList.remove("flipped");
      void btn.offsetWidth;
      btn.style.transition = "";
      busy = false;
    }, 2600);
  });

  /* ── 信号发射：从芯片中心向全屏四周辐射 ── */
  function fire(btn) {
    const r = btn.getBoundingClientRect();
    const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    const W = innerWidth, H = innerHeight;
    const maxR = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) + 120;

    const cv = document.createElement("canvas");
    cv.id = "ampWave";
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);

    const INK = "23,23,23", RED = "217,58,43", AMBER = "255,182,72", CREAM = "242,236,217";
    const RAYS = isMobile() ? 24 : 44;
    const rays = [];
    for (let i = 0; i < RAYS; i++) {
      const a = (i / RAYS) * Math.PI * 2 + (Math.random() - 0.5) * 0.22;
      const kind = Math.random() < 0.34 ? RED : (Math.random() < 0.12 ? AMBER : INK);
      rays.push({
        a, kind,
        speed: 0.88 + Math.random() * 0.55,          // 射出屏幕之外
        w: kind === RED ? 2 : 1.4,
        dots: 3 + (Math.random() * 3 | 0)            // 尾迹上的信号点数
      });
    }

    const T = 1200;                                  // 墨面时间轴：爆发→遮盖→光圈消散
    const RAY_T = 1000;                              // 信号线时间轴（先行）
    const t0 = performance.now();
    // 用 16ms 定时器驱动：前台 ≈60fps；被节流时降速但必完成，1.3s 超时直接落位移除
    const easeInOutCubic = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    const tR0 = performance.now();                    // 信号线：立刻起飞
    const tD0 = tR0 + 300;                            // 墨面：缩小过半即爆发（300ms 后）
    const timer = setInterval(() => {
      const now = performance.now();
      const tR = Math.min((now - tR0) / RAY_T, 1);
      const tD = Math.min(Math.max(0, (now - tD0) / T), 1);
      ctx.clearRect(0, 0, W, H);

      // ── 信号射线：先飞（纸上为墨/红，墨面铺开后转奶白/红）──
      const ease = 1 - Math.pow(1 - tR, 2.2);
      for (const ray of rays) {
        const d = ease * maxR * ray.speed;
        const inner = Math.max(16, d - 170 - Math.random() * 50);
        const x1 = ox + Math.cos(ray.a) * inner, y1 = oy + Math.sin(ray.a) * inner;
        const x2 = ox + Math.cos(ray.a) * d,      y2 = oy + Math.sin(ray.a) * d;
        const overDisk = tD > 0 && d <= (maxR + 80) && now >= tD0;
        const col = overDisk ? (ray.kind === RED ? RED : CREAM) : ray.kind;
        ctx.strokeStyle = `rgba(${col},${overDisk ? 0.85 : 0.55})`;
        ctx.lineWidth = ray.w;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        for (let k = 0; k < ray.dots; k++) {
          const dd = inner + (d - inner) * (k + 0.5) / ray.dots;
          const size = ray.kind === RED ? 3.2 : 2.4;
          const inDisk = overDisk && dd <= (maxR + 80);
          ctx.fillStyle = `rgba(${inDisk ? (ray.kind === RED ? RED : CREAM) : ray.kind},0.9)`;
          ctx.fillRect(ox + Math.cos(ray.a) * dd - size / 2, oy + Math.sin(ray.a) * dd - size / 2, size, size);
        }
      }

      // ── 墨面三幕：扩至满屏 → 短暂遮盖（换页在其下完成）→ 光圈擦除 ──
      if (now >= tD0) {
        const grow = Math.min(1, tD / 0.40);
        const outerR = (1 - Math.pow(1 - grow, 3)) * (maxR + 80);
        let holeR = 0;
        if (tD > 0.52) holeR = easeInOutCubic((tD - 0.52) / 0.48) * (maxR + 260);
        ctx.fillStyle = "rgba(23, 23, 23, 1)";
        ctx.beginPath();
        ctx.arc(ox, oy, outerR, 0, Math.PI * 2);
        if (holeR > 0) ctx.arc(ox, oy, holeR, 0, Math.PI * 2, true);
        ctx.fill("evenodd");
      }

      if (tD >= 1) { clearInterval(timer); fadeOut(cv); }
    }, 16);
    setTimeout(() => {                                // 兜底：超时强制完成
      clearInterval(timer);
      try { fadeOut(cv); } catch (e) {}
    }, 2500);
  }

  function fadeOut(cv) {
    cv.style.opacity = "0";
    setTimeout(() => cv.remove(), 500);
  }
})();
