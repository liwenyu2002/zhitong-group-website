(() => {
  'use strict';
  const channel = 'pmsg-scroll-story';
  const hostOrigin = location.protocol === 'file:' ? '*' : location.origin;
  const send = (type, detail = {}) => parent.postMessage({ channel, type, ...detail }, hostOrigin);
  let currentBeat = '', overrides = null, lastTime = -1, toastDismissed = false, homeActive = false;
  let position = 0, followingScroll = false, connected = false;
  const tabs = ['status', 'home', 'memory', 'agent'];
  const pages = [...document.querySelectorAll('[data-page]')];
  const track = document.createElement('div');
  track.className = 'story-pages';
  nxScroll.append(track);
  pages.forEach(page => { page.hidden = false; track.append(page); });
  document.querySelector('#page-agent').append(nxEl('nx-chat-composer'));

  const memoryPage = nxEl('page-memory');
  const memoryDetails = document.createElement('div');
  memoryDetails.className = 'story-memory-details';
  while (memoryPage.firstChild) memoryDetails.append(memoryPage.firstChild);
  const memoryTrack = document.createElement('div');
  memoryTrack.className = 'story-memory-track';
  const capture = document.createElement('div');
  capture.className = 'story-memory-capture';
  capture.innerHTML = '<div class="nx-page-head"><div><h1>记忆</h1><p>高光时刻</p></div></div>';
  memoryTrack.append(capture, memoryDetails);
  memoryPage.append(memoryTrack);
  const highlights = [
    { name: '表白时刻', file: 'confession' },
    { name: '宠物迎接', file: 'homecoming' },
    { name: '登顶云海', file: 'summit' }
  ];
  const gallery = document.createElement('section');
  gallery.className = 'story-highlight-gallery';
  gallery.setAttribute('aria-label', '高光时刻视频');
  gallery.innerHTML = '<div class="story-gallery-head"><h2>高光时刻</h2><span>3 段</span></div><div class="story-highlight-list">' + highlights.map((clip, index) => '<button type="button" data-highlight="' + index + '" aria-label="播放' + clip.name + '"><span class="story-highlight-thumb"><img src="../assets/moments/' + clip.file + '-poster.jpg" alt="" width="320" height="180"><i aria-hidden="true">▷</i><small>00:15</small></span><span>' + clip.name + '</span></button>').join('') + '</div>';
  memoryDetails.append(gallery);
  const highlightDialog = document.createElement('dialog');
  highlightDialog.className = 'story-highlight-dialog';
  highlightDialog.innerHTML = '<header><h2 id="story-player-title">高光时刻</h2><button type="button" aria-label="关闭视频">×</button></header><video playsinline controls preload="none" aria-label="回看高光时刻"></video>';
  document.body.append(highlightDialog);
  const highlightPlayer = highlightDialog.querySelector('video');
  gallery.addEventListener('click', event => {
    const button = event.target.closest('[data-highlight]');
    if (!button) return;
    const clip = highlights[Number(button.dataset.highlight)];
    nxEl('story-player-title').textContent = clip.name;
    highlightPlayer.src = '../assets/moments/' + clip.file + '.mp4';
    highlightPlayer.muted = false;
    highlightDialog.showModal();
    send('highlight-open');
    highlightPlayer.play().catch(() => {});
  });
  highlightDialog.querySelector('button').addEventListener('click', () => highlightDialog.close());
  highlightDialog.addEventListener('close', () => {
    highlightPlayer.pause();
    highlightPlayer.removeAttribute('src');
    highlightPlayer.load();
    send('highlight-close');
  });
  const highlightTrigger = 3;
  let memoryPosition = 0, momentIndex = -1, momentTime = 0, momentDismissed = false;
  let phoneVisible = false, momentVisible = false, momentSwitching = false;
  const captureNotice = document.createElement('aside');
  captureNotice.className = 'story-capture-notice';
  captureNotice.setAttribute('role', 'status');
  captureNotice.setAttribute('aria-live', 'polite');
  captureNotice.setAttribute('aria-hidden', 'true');
  captureNotice.inert = true;
  captureNotice.innerHTML = '<div class="story-capture-heading"><span class="story-record-light" aria-hidden="true"></span><strong id="story-capture-title">高光时刻</strong><button type="button" aria-label="关闭高光录制提示">×</button></div><p id="story-capture-message">识别到心率升高，高光时刻已录制。</p><small id="story-capture-scene"></small>';
  document.body.append(captureNotice);
  function updateCaptureNotice() {
    const show = phoneVisible && momentVisible && !momentSwitching && !momentDismissed && momentTime >= highlightTrigger && Math.abs(position - 2) <= .035 && memoryPosition <= .035;
    captureNotice.classList.toggle('is-visible', show);
    captureNotice.setAttribute('aria-hidden', String(!show));
    captureNotice.inert = !show;
  }
  captureNotice.querySelector('button').addEventListener('click', () => { momentDismissed = true; updateCaptureNotice(); });
  function setMemoryPosition(value) {
    memoryPosition = Math.max(0, Math.min(1, value));
    memoryTrack.style.setProperty('--memory-position', memoryPosition.toFixed(5));
    memoryDetails.inert = memoryPosition < .5;
    capture.inert = memoryPosition >= .5;
    document.body.dataset.memoryPosition = memoryPosition.toFixed(4);
    updateCaptureNotice();
  }
  function setMoment(data) {
    const index = Math.max(0, Math.min(2, Number(data.index) || 0));
    const clip = highlights[index], time = Number(data.time) || 0;
    if (index !== momentIndex || (time < highlightTrigger && momentTime >= highlightTrigger)) momentDismissed = false;
    momentIndex = index;
    momentTime = time;
    momentVisible = Boolean(data.visible);
    momentSwitching = Boolean(data.transitioning);
    const recorded = time >= highlightTrigger;
    const noticeText = index === 0 ? '识别到心率升高，高光时刻已录制。' : '识别到特殊状态，高光时刻已录制。';
    if (nxEl('story-capture-message').textContent !== noticeText) nxEl('story-capture-message').textContent = noticeText;
    const sceneLabel = clip.name + ' · 场景演示';
    if (nxEl('story-capture-scene').textContent !== sceneLabel) nxEl('story-capture-scene').textContent = sceneLabel;
    capture.dataset.clip = clip.file;
    capture.dataset.state = recorded ? 'recorded' : 'idle';
    updateCaptureNotice();
  }
  const originalSelect = selectAppTab;
  selectAppTab = function (value, options = {}) {
    if (!followingScroll && connected && tabs.includes(value)) { send('navigate', { tab: value }); return; }
    originalSelect(value, { ...options, remember: false });
    pages.forEach(page => {
      page.hidden = false;
      page.inert = page.dataset.page !== activeAppTab;
      page.setAttribute('aria-hidden', String(page.inert));
    });
    nxEl('nx-chat-composer').hidden = false;
  };

  function setPosition(value, linked = true) {
    position = Math.max(0, Math.min(3, value));
    track.classList.toggle('is-settling', !linked);
    track.style.setProperty('--story-position', position.toFixed(5));
    document.body.dataset.storyPosition = position.toFixed(4);
    const selected = tabs[Math.round(position)];
    if (activeAppTab !== selected) {
      followingScroll = true;
      selectAppTab(selected, { remember: false });
      followingScroll = false;
    }
    updateHomeNotice();
    updateCaptureNotice();
  }
  const originalSetMetrics = nxSetMetrics;
  nxSetMetrics = function (payload = {}) {
    originalSetMetrics(overrides ? { ...payload, ...overrides, simulated: true } : payload);
  };

  const automation = document.createElement('div');
  automation.className = 'story-automation';
  automation.innerHTML = '<div>疲劳度 <b id="story-fatigue">62</b> / 100<small>联动阈值 70 · 场景演示</small></div><span class="story-action" id="story-action">未到家</span>';
  document.querySelector('#page-home .nx-page-head').after(automation);
  const music = document.createElement('div');
  music.className = 'story-music';
  music.innerHTML = '<i aria-hidden="true">♫</i><div>舒缓音乐<small id="story-music-state">未播放</small></div>';
  document.querySelector('#page-home .nx-home-actions').before(music);
  const toast = document.createElement('aside');
  toast.className = 'story-toast';
  toast.inert = true;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-hidden', 'true');
  toast.innerHTML = '<div class="story-toast-head"><strong>家居联动已执行</strong><button type="button" aria-label="关闭联动提示">×</button></div><p>识别到下班回家躺下，疲倦值超过阈值，已自动调到合适的灯光并播放舒缓音乐。</p><small>疲劳度 76 / 100 · 动作：躺下 · 演示</small>';
  document.body.append(toast);
  function updateHomeNotice() {
    const show = phoneVisible && homeActive && currentBeat === 'rest' && lastTime >= 10.5 && !toastDismissed && Math.abs(position - 1) <= .035 && activeAppTab === 'home';
    toast.classList.toggle('is-visible', show);
    toast.setAttribute('aria-hidden', String(!show));
    toast.inert = !show;
  }
  toast.querySelector('button').addEventListener('click', () => { toastDismissed = true; updateHomeNotice(); });

  function setScene(data) {
    if (currentBeat === data.beat) return;
    currentBeat = data.beat;
    document.body.dataset.storyDirection = data.direction || 'forward';
    document.body.classList.toggle('story-records', data.memoryView === 'records');
    if (document.querySelector('dialog[open]')) document.querySelectorAll('dialog[open]').forEach(d => d.close());
    if (data.signal) nxSelectSignal(data.signal);
    if (data.tab === 'memory') {
      nxMemory.query = '';
      nxEl('nx-memory-search').value = '';
      nxSetMemoryView(data.memoryView || 'people');
    }
    nxScroll.scrollTop = 0;
    updateHomeNotice();
    send('scene-applied', { beat: currentBeat, tab: document.body.dataset.appTab });
  }

  function setVideoState(data) {
    const time = Number(data.time) || 0;
    homeActive = Boolean(data.active);
    if (time < 10.5 && lastTime >= 10.5) toastDismissed = false;
    lastTime = time;
    const triggered = time >= 10.5;
    const fatigue = triggered ? 76 : time >= 7.8 ? 68 : 62;
    const brightness = triggered ? Math.round(72 - Math.min(1, (time - 10.5) / 2.7) * 48) : 72;
    overrides = homeActive ? { fatigue, focus: 35, calm: triggered ? 72 : 46 } : null;
    document.querySelector('#story-fatigue').textContent = fatigue;
    document.querySelector('#story-action').textContent = time >= 7.8 ? '躺下' : time >= 1 ? '已回家' : '未到家';
    document.querySelector('#story-music-state').textContent = triggered ? '正在播放' : '未播放';
    music.dataset.playing = String(triggered);
    homePanelState.lamp = true;
    homePanelState.brightness = brightness;
    homePanelState.fan = false;
    homePanelState.fireplace = false;
    nxState.homeMessage = triggered ? '灯光已调整 · 舒缓音乐播放中' : '等待联动条件';
    nxRenderHome();
    updateHomeNotice();
    document.body.dataset.homeDemoPhase = data.phase || 'arrival';
  }

  window.addEventListener('message', event => {
    if (event.source !== parent || (location.protocol !== 'file:' && event.origin !== location.origin)) return;
    const data = event.data;
    if (!data || data.channel !== channel) return;
    if (data.type === 'scene') setScene(data);
    if (data.type === 'progress' && Number.isFinite(data.position)) setPosition(data.position);
    if (data.type === 'memory-progress' && Number.isFinite(data.position)) setMemoryPosition(data.position);
    if (data.type === 'moment') setMoment(data);
    if (data.type === 'video') setVideoState(data);
    if (data.type === 'visibility') {
      phoneVisible = Boolean(data.visible);
      updateCaptureNotice();
      updateHomeNotice();
      if (!phoneVisible) {
        overrides = null;
        if (highlightDialog.open) highlightDialog.close();
        highlightPlayer.pause();
      }
    }
  });

  // A trackpad gesture over the phone continues the page narrative. Dialogs
  // retain their own scrolling, and touch / keyboard interactions stay native.
  window.addEventListener('wheel', event => {
    if (document.querySelector('dialog[open]') || event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    send('wheel', { delta: Math.max(-1200, Math.min(1200, event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1))) });
  }, { passive: false });
  window.addEventListener('eye-x:tab', () => {
    document.body.classList.toggle('story-records', nxMemory.view === 'records');
    updateHomeNotice();
    send('tab', { tab: activeAppTab });
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-memory-view]')) document.body.classList.toggle('story-records', nxMemory.view === 'records');
  });
  document.querySelector('#nx-graph-lines').setAttribute('preserveAspectRatio', 'none');
  // Horizontal swipes move the same four real pages, then bring the outer
  // story to the matching section. Vertical trackpad gestures remain linked.
  let gesture = null;
  nxScroll.addEventListener('pointerdown', event => {
    if (event.target.closest('button,input,textarea,a') || document.querySelector('dialog[open]')) return;
    gesture = { x: event.clientX, y: event.clientY, start: position, dragging: false, id: event.pointerId };
  });
  nxScroll.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.dragging && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      gesture.dragging = true;
      nxScroll.setPointerCapture(event.pointerId);
    }
    if (gesture.dragging) { event.preventDefault(); setPosition(gesture.start - dx / nxScroll.clientWidth); }
  });
  const finishGesture = () => {
    if (gesture?.dragging) {
      const target = Math.round(position);
      setPosition(target, false);
      send('navigate', { tab: tabs[target], settledSwipe: true });
    }
    gesture = null;
  };
  nxScroll.addEventListener('pointerup', finishGesture);
  nxScroll.addEventListener('pointercancel', finishGesture);
  pages.forEach(page => { page.inert = page.dataset.page !== activeAppTab; page.setAttribute('aria-hidden', String(page.inert)); });
  nxEl('nx-chat-composer').hidden = false;
  setTimeout(() => {
    if (!nxChat.messages.length) {
      nxChat.messages.push(
        { role: 'user', text: '我周五有什么安排？' },
        { role: 'assistant', text: '周五有三件事：\n和小满在汇报后吃饭，地点还没定；\n和阿远确认周六徒步的路线与天气；\n晚上给妈妈打个电话。', sourceIds: ['noon', 'hike', 'family'] }
      );
      nxRenderChat({ scroll: false });
    }
    connected = true;
    send('ready');
  }, 320);
})();
