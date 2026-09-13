/* ============================================================
   Zhang Lab · 换页引擎（导航栏驱动）
   点导航栏 → 页面左右滑动切换；页内为正常竖向滚动
   辅助：移动端横滑、← → 键、底部圆点、hash 同步
   大脑画布进度通过 window.__deckProgress 暴露给 app.js
   ============================================================ */
(() => {
  "use strict";

  const deck = document.getElementById("deck");
  if (!deck) return;
  const slides = Array.from(deck.querySelectorAll(".slide"));
  const N = slides.length;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dotsBox = document.getElementById("deckDots");
  const dots = [];
  if (dotsBox) {
    slides.forEach((s, i) => {
      const d = document.createElement("i");
      d.title = s.id || "";
      d.addEventListener("click", () => go(i));
      dotsBox.appendChild(d);
      dots.push(d);
    });
  }

  let idx = 0, pos = 0, target = 0, gen = 0;

  const indexOfId = id => slides.findIndex(s => s.id === id);

  function paint() {
    deck.style.transform = `translate3d(${(-pos * 100).toFixed(3)}vw, 0, 0)`;
    window.__deckProgress = N > 1 ? clamp(pos / (N - 1), 0, 1) : 0;
  }

  function render() {
    dots.forEach((d, i) => d.classList.toggle("on", i === idx));
    document.querySelectorAll(".topnav a[data-goto]").forEach(a => {
      a.classList.toggle("nav-on", a.dataset.goto === slides[idx].id);
    });
    // 手机横滑导航条：当前页自动滚到可视中间
    const on = document.querySelector(".topnav a.nav-on");
    if (on && on.scrollIntoView) {
      try { on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch (e) {}
    }
    const id = slides[idx].id;
    if (id) history.replaceState(null, "", "#" + id);
  }

  /* 逐帧飞向目标（代数令牌：每次 go 都生成新链，旧链自动失效，绝不卡死）
     rAF 被抑制（后台标签 / 节流）时由 50ms 定时器兜底推进 */
  function animTo(g) {
    const t0 = performance.now();
    const step = () => {
      if (g !== gen) return;
      try {
        pos = lerp(pos, target, 0.17);
        paint();
        paintGrain();
      } catch (e) { /* 下帧重试 */ }
      if (Math.abs(target - pos) < 0.0015) {
        pos = target; paint();
        window.__deckProgress = N > 1 ? clamp(pos / (N - 1), 0, 1) : 0;
        return;
      }
      requestAnimationFrame(() => step(g));
    };
    requestAnimationFrame(() => step(g));
    const fb = setInterval(() => {
      if (g !== gen) { clearInterval(fb); return; }
      const settled = Math.abs(target - pos) < 0.0015;
      const timedOut = performance.now() - t0 > 1200;   // 节流环境下直接落位
      if (settled || timedOut) {
        pos = target; paint(); paintGrain();
        window.__deckProgress = N > 1 ? clamp(pos / (N - 1), 0, 1) : 0;
        clearInterval(fb);
        return;
      }
      pos = lerp(pos, target, 0.17);
      paint(); paintGrain();
    }, 50);
  }

  /* 纸张蒙版：横向随轨道、纵向随页内滚动（512 取模保持图案连续） */
  const grain = document.getElementById("grain");
  function paintGrain() {
    if (!grain) return;
    const act = slides[idx];
    const sy = act ? act.scrollTop : 0;
    const hx = pos * innerWidth % 512;
    grain.style.transform = "translate3d(" + (-hx) + "px," + (-(sy % 512)) + "px,0)";
  }
  slides.forEach(s => s.addEventListener("scroll", paintGrain, { passive: true }));

  /* 锚点原生滚动会顶偏 html.scrollLeft，统一归零 */
  function resetNativeScroll() {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }

  function go(i) {
    i = clamp(i, 0, N - 1);
    idx = i;
    window.__deckIdx = i;
    target = i;
    resetNativeScroll();
    paintGrain();
    if (reduced) { pos = target; paint(); render(); return; }
    gen++;
    animTo(gen);
    render();
  }

  /* 导航栏与页内跳转链接（核心换页方式） */
  document.querySelectorAll("a[data-goto]").forEach(a => {
    a.addEventListener("click", e => {
      if (a.classList.contains("amp-btn")) return;   // 放大器：先翻面发射，再由 amp.js 换页
      e.preventDefault();
      const i = indexOfId(a.dataset.goto);
      if (i >= 0) go(i);
    });
  });

  /* 圆点 */
  dots.forEach((d, i) => d.addEventListener("click", () => go(i)));

  /* ← → 键（辅助） */
  window.addEventListener("keydown", e => {
    if (["ArrowRight", "PageDown"].includes(e.key)) go(idx + 1);
    else if (["ArrowLeft", "PageUp"].includes(e.key)) go(idx - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(N - 1);
  });

  /* 移动端横滑（辅助） */
  let tx = 0, ty = 0;
  window.addEventListener("touchstart", e => {
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(idx + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  /* 前进后退 */
  window.addEventListener("hashchange", () => {
    resetNativeScroll();
    const i = indexOfId(location.hash.slice(1));
    if (i >= 0 && i !== idx) go(i);
    resetNativeScroll();
  });

  window.__deckGo = go;
  window.__deckIdxGet = () => idx;
  window.__deckIndexOfId = indexOfId;

  /* 蒙版跟踪兜底巡检 */
  setInterval(() => { try { paintGrain(); } catch (e) {} }, 400);

  /* 启动 */
  const start = indexOfId(location.hash.slice(1));
  idx = start >= 0 ? start : 0;
  window.__deckIdx = idx;
  pos = target = idx;
  resetNativeScroll();
  paint();
  render();
})();
