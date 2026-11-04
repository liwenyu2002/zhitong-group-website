(() => {
  'use strict';

  const storageKey = 'pmsg-language';
  const english = {
    '看见之外 · 序章': 'Beyond Sight · Prologue',
    '看见之外，另有回响。一段尚未完全显形的序章。': 'Beyond sight, something resonates. A prologue yet to unfold.',
    '看见之外': 'Beyond Sight', '口令入口': 'Passphrase entry',
    '输入密令后按回车': 'Enter the passphrase and press Enter', '进入': 'Enter',
    '密令有误，请重试。': 'Incorrect passphrase. Please try again.',
    '暂时无法连接，请重试。': 'Unable to connect. Please try again.',
    '尝试次数较多，请稍后重试。': 'Too many attempts. Please try again later.',
    '验证通过，正在进入。': 'Verified. Opening the page.',
    '黑暗中，柔和光线勾勒出一只黑色雕塑眼睛': 'A sculptural eye outlined by soft light in the dark',
    '进入序章': 'Enter the prologue',
    '黑暗中，圆润的人像以手遮眉，望向前方': 'A rounded figure shades its eyes and looks ahead',
    '极暗之中，一道光掠过柔和的边缘': 'A trace of light passes over a soft edge',
    '不露声色，': 'Quietly,', '已然不同。': 'everything shifts.',
    '一念澄明。': 'A moment of clarity.',
    '暗色人像两侧的细光，缓缓收束成一线': 'Fine threads of light converge around a dark figure',
    '圆润人像的眼际，一圈极淡的纹路向远处散开': 'A faint ripple moves outward from the eye',
    '一瞬之间。': 'In a blink.',
    '微光穿过高低不同的暗色圆润体块': 'A trace of light passes through rounded dark forms',
    '起伏，都有回声。': 'Every rise and fall echoes.',
    '一枚圆润暗石，安稳落在柔和的弧面中': 'A smooth dark stone resting in a gentle curve',
    '片刻，有所安放。': 'A moment to rest.',
    '第一视角回家后躺下，灯光逐渐变暗的场景演示': 'A first-person scene: coming home, resting, and dimming the lights',
    '有声播放回家场景': 'Play the home scene with sound', '重播回家场景': 'Replay the home scene',
    '回家': 'Coming home', '重新播放': 'Replay',
    '已回家 · 接近沙发': 'Home · Approaching the sofa',
    '已躺下 · 确认当前状态': 'Resting · Checking current state',
    '疲劳度 76 > 70 · 灯光调整中': 'Fatigue 76 > 70 · Adjusting lights',
    '灯光已调整 · 舒缓音乐播放中': 'Lights adjusted · Calming music playing',
    '一瞬触动，': 'A moment felt,', '悄然留存。': 'quietly kept.',
    '比心、远望、冲线与挥别的抽象片段，向右侧的黑暗延伸': 'Abstract moments of affection, discovery, achievement and farewell recede into darkness',
    '值得留存的三个瞬间': 'Three moments worth keeping',
    '表白的时刻': 'A moment of affection', '宠物迎接你回家': 'A welcome home',
    '登顶后的云海': 'Clouds from the summit', '播放视频': 'Play video',
    '暂停视频': 'Pause video', '选择视频': 'Choose a video',
    '关闭声音': 'Mute sound', '开启声音': 'Turn sound on',
    '那些小事，': 'The little things,', '还在原处。': 'within reach.',
    '几幅日常暗色片段，杯子后的一串钥匙被轻轻照亮': 'Everyday scenes, with keys softly lit behind a cup',
    '一个抽象人影沿着柔和光路向前，转角隐入黑暗': 'A figure follows a quiet path of light into darkness',
    '路，自会展开。': 'The way unfolds.', '随滚动切换的 App 演示': 'App demo that follows the story',
    '眼镜 App：今日、家居、记忆与 Agent': 'Companion app: Today, Home, Memory and Agent',
    '细节': 'Details', '黑灰色曲面上，一小片细腻织物触面': 'A fine fabric contact on a dark matte surface',
    '柔软，随形。': 'Soft, naturally.', '黑色玻璃深处，一束光停在极小的圆心': 'A trace of light inside dark glass',
    '静观，留影。': 'A quiet gaze.', '被阴影遮住一半的圆润小曲面，覆着细密织纹': 'A rounded woven surface, half hidden in shadow',
    '贴肤，传信。': 'Closer to the signal.', '将近': 'Soon', '。': '.',
    '一道极薄的光，横在尚未显形的轮廓之上': 'A thin line of light crosses a form yet to emerge',

    '设备与采集设置': 'Device and signal settings', '今日': 'Today', '今天': 'Today',
    '未连接': 'Disconnected', '信号已连接': 'Connected', '查看今日摘要': 'View today’s summary',
    '今日摘要': 'Today’s summary', '今天的记录，慢慢整理': 'Today’s activity', '暂无记录': 'No records yet',
    '首页评审确定方向，周末徒步已约定': 'A design review and a weekend hike',
    '明天 12:00 前，向林可同步两版草图': 'Send two sketches to Lin Ke by noon tomorrow',
    '焦虑指数': 'Anxiety', '指数说明': 'About this score', '等待评估数据': 'Waiting for data',
    '当前读数': 'Current reading', '当前指数': 'Current score',
    '焦虑指数最近五分钟趋势': 'Anxiety trend over the last five minutes',
    '5 分钟前': '5 min ago', '暂无趋势': 'No trend yet', '持续更新': 'Live updates', '更新中': 'Updating', '现在': 'Now',
    '脑状态指标': 'State indicators', '专注度': 'Focus', '专注度趋势': 'Focus trend',
    '放松度': 'Calm', '放松度趋势': 'Calm trend', '疲劳度': 'Fatigue', '疲劳度趋势': 'Fatigue trend',
    '实时信号': 'Live signals', '等待数据': 'Waiting for data', '信号类型': 'Signal type',
    '脑电': 'EEG', '眼动': 'Eye movement', '运动': 'Motion', '声音': 'Audio',
    '实时信号曲线': 'Live signal waveform', '等待脑电信号': 'Waiting for EEG',
    '等待眼动信号': 'Waiting for eye movement', '等待运动信号': 'Waiting for motion',
    '等待声音信号': 'Waiting for audio', '运动与身体数据': 'Movement and body data',
    'IMU 实时数据': 'Live IMU data', '等待连接': 'Waiting for connection',
    '线性加速度': 'Linear acceleration', '角速度': 'Angular velocity',
    '步数': 'Steps', '步': 'steps', '心率': 'Heart rate',
    '待办': 'To do', '今日记录': 'Today’s records', '查看全部': 'View all',
    '关联记录': 'Related record', '家居': 'Home', '客厅': 'Living room', '3 台设备': '3 devices',
    '立灯': 'Floor lamp', '状态待同步': 'Awaiting status', '立灯电源': 'Floor lamp power',
    '亮度': 'Brightness', '立灯亮度': 'Floor lamp brightness',
    '电壁炉电源': 'Fireplace power', '电壁炉': 'Fireplace', '风扇电源': 'Fan power', '风扇': 'Fan',
    '全部开启': 'Turn all on', '全部关闭': 'Turn all off', '等待设备连接': 'Waiting for devices',
    '已开启': 'On', '已关闭': 'Off', '设备离线': 'Offline', '正在更新设备…': 'Updating devices…',
    '控制失败，请重试': 'Could not update. Please try again.',
    '记忆': 'Memory', '人物与日常记录': 'People and daily records',
    '向 Agent 询问记忆': 'Ask Agent about memory', '搜索人物、事情或关键词': 'Search people or memories',
    '搜索记忆': 'Search memories', '记忆视图': 'Memory view', '人物': 'People', '记录': 'Records',
    '人物分类': 'People categories', '全部': 'All', '生活': 'Life', '工作': 'Work',
    '人物关系图': 'People map', '我': 'Me', '全部记录': 'All records', '搜索结果': 'Search results',
    '没有找到相关记录，试试其他关键词。': 'No matches. Try another keyword.',
    '还没有记忆记录。': 'No memories yet.', '暂时没有人物记录。': 'No people yet.',
    '还没有关联记录。': 'No related records yet.', '接下来': 'Next',
    '查看相关记录': 'Related records', '问问 Agent': 'Ask Agent', '后续事项': 'Follow-up',
    '就这段记忆问问 Agent': 'Ask Agent about this memory',
    '点击人物，查看与你有关的记录': 'Choose a person to see related records',
    '开始新对话': 'Start a new chat', '想聊点什么？': 'What’s on your mind?',
    '找一段记忆，或聊聊今天的状态。': 'Find a memory or talk about your day.',
    '我周五有什么安排？': 'What’s planned for Friday?',
    '我的钥匙放在哪里？': 'Where did I put my keys?',
    '最近有点累，可以做点什么？': 'I’ve been tired lately. What can I do?',
    '与 Agent 的对话': 'Conversation with Agent', '询问记忆或健康建议…': 'Ask about memories or wellbeing…',
    '发给 Agent 的消息': 'Message to Agent', '发送消息': 'Send message', '主要页面': 'Main pages',
    '本次对话': 'This conversation', '正在回复': 'Replying',
    '高光时刻': 'Highlights', '高光时刻视频': 'Highlight videos', '3 段': '3 clips',
    '表白时刻': 'A moment of affection', '宠物迎接': 'A welcome home', '登顶云海': 'Above the clouds',
    '关闭视频': 'Close video', '回看高光时刻': 'Replay highlight',
    '关闭高光录制提示': 'Dismiss recording notice',
    '识别到心率升高，高光时刻已录制。': 'A rise in heart rate was detected. A highlight was recorded.',
    '识别到特殊状态，高光时刻已录制。': 'An unusual state was detected. A highlight was recorded.',
    '场景演示': 'Demo', '联动阈值 70 · 场景演示': 'Trigger threshold 70 · Demo',
    '未到家': 'Away', '已回家': 'Home', '躺下': 'Resting', '舒缓音乐': 'Calming music',
    '未播放': 'Not playing', '正在播放': 'Playing', '等待联动条件': 'Waiting for conditions',
    '家居联动已执行': 'Home scene activated', '关闭联动提示': 'Dismiss home notice',
    '识别到下班回家躺下，疲倦值超过阈值，已自动调到合适的灯光并播放舒缓音乐。': 'You came home and lay down with fatigue above the threshold. The lights were adjusted and calming music started.',
    '疲劳度 76 / 100 · 动作：躺下 · 演示': 'Fatigue 76 / 100 · Resting · Demo',
    '11月3日 周二': 'Tue, Nov 3',

    '小满': 'Xiaoman', '满': 'X', '伴侣': 'Partner', '午间通话': 'Midday call',
    '周五要做汇报，结束后约了一起吃饭。': 'A presentation on Friday, then dinner together.',
    '周五 · 汇报后一起吃暖锅': 'Friday · Hot pot after the presentation',
    '晚饭偏好：热乎的暖锅，地点待定。': 'Dinner preference: hot pot. The place is undecided.',
    '周五汇报完，陪我去吃顿好吃的吧。': 'Let’s get dinner after my presentation on Friday.',
    '妈妈': 'Mom', '家': 'M', '家人': 'Family', '晚间电话': 'Evening call',
    '提醒降温添衣，约定周五晚上通话。': 'A reminder to dress warmly; a call is planned for Friday night.',
    '周五晚上 · 通话': 'Friday evening · Call',
    '最近提到家里降温，出门需要多带外套。': 'It has been colder at home; bring a jacket when going out.',
    '降温了，出门多带一件外套。周五晚上再聊。': 'It’s getting cold. Bring a jacket. Talk Friday evening.',
    '阿远': 'A Yuan', '远': 'A', '朋友': 'Friend', '咖啡店闲聊': 'Coffee shop chat',
    '周六短线徒步，计划晚饭前回城。路线和天气周五确认。': 'A short hike on Saturday, back before dinner. Check the route and weather on Friday.',
    '周五 · 确认路线与天气': 'Friday · Check route and weather',
    '出行偏好：短线、轻松，晚饭前回城。': 'A relaxed short hike, returning before dinner.',
    '周六先走短线，晚饭前回来。路线周五再挑一下。': 'Let’s take a short hike Saturday and return before dinner. We’ll choose the route Friday.',
    '林可': 'Lin Ke', '可': 'L', '同事': 'Colleague', '产品评审': 'Product review',
    '首页先展示当前事件，简化信息层级。明天中午前同步两版草图。': 'Show current activity first and simplify the layout. Share two sketches by noon tomorrow.',
    '明天 12:00 前 · 同步两版草图': 'Tomorrow by noon · Share two sketches',
    '评审要求：优先展示当前事件，简化信息层级。': 'Review note: show current activity first and simplify the layout.',
    '先把正在发生的事放上来。明天中午前，我们再看两版草图。': 'Show what’s happening first. We’ll review two sketches by noon tomorrow.',
    '周老师': 'Zhou', '周': 'Z', '导师': 'Mentor', '晚间讨论': 'Evening discussion',
    '建议先用两版草图讲清思路，再讨论实现。': 'Use two sketches to clarify the idea before discussing implementation.',
    '明天 · 带两版草图参加讨论': 'Tomorrow · Bring two sketches',
    '关注点：草图的表达是否清楚。': 'Focus: whether the sketches communicate the idea clearly.',
    '明天先用草图把思路画清楚，两版就够。': 'Use sketches to make the idea clear tomorrow; two versions are enough.',
    '未命名': 'Unnamed', '待确认': 'Unconfirmed', '咖啡店短聊': 'Coffee shop conversation',
    '今天 15:10 在咖啡店交谈，推荐了山脚下的步道。姓名与关系未确认。': 'Met at a coffee shop at 15:10. They recommended a trail; their name is unconfirmed.',
    '待补充：姓名与关系': 'To confirm: name and relationship',
    '已知话题：附近步道、短线徒步。': 'Topics: nearby trails and short hikes.',
    '你们要是想走短线，山脚下那条步道就挺舒服。': 'For a short hike, the trail at the foot of the mountain is lovely.',
    '首页评审': 'Homepage review',
    '和林可讨论了首页的信息层级。决定先呈现正在发生的事，明天中午前同步两版草图。': 'Discussed the homepage with Lin Ke. Show current activity first; share two sketches by noon tomorrow.',
    '产品评审 · 09:40—10:16': 'Product review · 09:40–10:16',
    '明天 12:00 前，把两版草图发给林可。': 'Send two sketches to Lin Ke by noon tomorrow.',
    '周五晚饭安排': 'Friday dinner',
    '小满提到周五要做汇报，你答应结束后陪她吃顿好的。她说想吃热乎的暖锅。': 'Xiaoman has a presentation Friday; you planned dinner afterward. She suggested hot pot.',
    '周五汇报完，陪我去吃顿好吃的吧。想吃热乎一点的。': 'Let’s get something warm to eat after my presentation on Friday.',
    '午间通话 · 12:18—12:31': 'Midday call · 12:18–12:31',
    '周五，问问她汇报是否顺利，再一起选晚饭的地方。': 'On Friday, ask how her presentation went and choose a place for dinner.',
    '周六徒步安排': 'Saturday hike',
    '和阿远约定周六短线徒步，晚饭前回城。路线和天气留到周五再确认。': 'A short hike with A Yuan on Saturday, back before dinner. Confirm route and weather Friday.',
    '咖啡店闲聊 · 15:26—15:48': 'Coffee shop chat · 15:26–15:48',
    '周五和阿远确认路线与天气。': 'Confirm the route and weather with A Yuan on Friday.',
    '钥匙位置': 'Keys', '随手记': 'Quick note',
    '回家时随口提到，钥匙放在玄关桌上的杯子后面。': 'The keys were left behind the cup on the entry table.',
    '钥匙我放杯子后面了，就玄关桌上那个杯子。': 'I left the keys behind the cup on the entry table.',
    '回家随手记 · 18:32': 'Quick note at home · 18:32',
    '位置：玄关桌上的杯子后面。': 'Location: behind the cup on the entry table.',
    '与妈妈通话': 'Call with Mom',
    '妈妈提醒降温添衣。你们约好周五晚上再打一通电话。': 'Mom reminded you to dress warmly. You planned another call for Friday evening.',
    '晚间电话 · 19:02—19:17': 'Evening call · 19:02–19:17', '周五晚上给妈妈打电话。': 'Call Mom on Friday evening.',
    '草图讨论': 'Sketch discussion',
    '周老师建议先用两版草图把思路讲清楚。这和上午评审后要同步给林可的材料是同一件事。': 'Teacher Zhou suggested using two sketches to clarify the idea—the same ones to share with Lin Ke.',
    '晚间讨论 · 20:12—20:24': 'Evening discussion · 20:12–20:24',
    '整理上午的三条反馈，带进明天的两版草图。': 'Bring the three review notes into tomorrow’s two sketches.',
    '咖啡店步道推荐': 'Trail recommendation', '一面之缘': 'New acquaintance',
    '一位新认识的人推荐了山脚下的步道。姓名暂时没有确认，先保留这次相遇。': 'A new acquaintance recommended a trail at the foot of the mountain. Their name is unconfirmed.',
    '咖啡店短聊 · 15:10': 'Coffee shop conversation · 15:10', '新认识的人': 'New acquaintance',
    '下次遇见时，可以再问问这条步道。': 'Ask about the trail next time you meet.',
    '明天把两版草图发给林可': 'Send two sketches to Lin Ke tomorrow',
    '12:00 前 · 来自上午的产品评审': 'By noon · From the morning review',
    '周五确认徒步路线和天气': 'Check the hiking route and weather Friday',
    '与阿远 · 周六短线徒步': 'With A Yuan · Short hike Saturday',
    '咖啡店提到的山脚步道，和周六的短线徒步有关，可以在周五确认路线时一起看看。': 'The trail mentioned at the coffee shop may suit Saturday’s hike. Review it when confirming the route.',
    '今天的首页评审确定了信息层级：先呈现正在发生的事。明天 12:00 前向林可同步两版草图，周老师也建议先用草图讲清思路。': 'Today’s review set the direction: show current activity first. Share two sketches with Lin Ke by noon tomorrow; Teacher Zhou also suggested using sketches to clarify the idea.',
    '周五，小满汇报后一起吃晚饭，晚上和妈妈通话。周六与阿远短线徒步，路线和天气留到周五确认。': 'On Friday, have dinner with Xiaoman after her presentation and call Mom. A short hike with A Yuan is planned for Saturday; check the route and weather Friday.',
    '上次记录的位置是玄关桌上的杯子后面。': 'The last recorded location was behind the cup on the entry table.',
    '你在 18:32 回家时提到了这个位置。': 'You mentioned it when you got home at 18:32.',
    '先暂停手上的事，给自己留一小段休息时间。如果感觉紧绷，可以坐得舒服一点，慢慢呼吸，或轻轻活动一下。': 'Pause what you’re doing and take a short break. If you feel tense, get comfortable, breathe slowly, or move gently.',
    '这些是一般的日常建议。你是今天比较累，还是最近一直这样？': 'These are general suggestions. Are you tired today, or has it been ongoing?',
    '现有记录里还没有找到明确的信息。可以补充一个人物、时间或关键词，我再帮你找找。': 'I couldn’t find a clear match. Add a person, time, or keyword and I’ll look again.',
    '周五有三件事：': 'There are three things on Friday:',
    '和小满在汇报后吃饭，地点还没定；': 'Have dinner with Xiaoman after her presentation; the place is undecided.',
    '和阿远确认周六徒步的路线与天气；': 'Confirm Saturday’s hiking route and weather with A Yuan.',
    '晚上给妈妈打个电话。': 'Call Mom in the evening.',
    '· 小满汇报结束后，一起吃暖锅，餐厅还没定。': '· Have hot pot with Xiaoman after her presentation; the restaurant is undecided.',
    '· 和阿远确认周六徒步的路线与天气。': '· Confirm Saturday’s hiking route and weather with A Yuan.',
    '· 晚上给妈妈打电话。': '· Call Mom in the evening.'
  };

  const textOriginals = new WeakMap();
  const attributeOriginals = new WeakMap();
  const translatedAttributes = ['aria-label', 'placeholder', 'alt', 'title'];
  let language = 'zh';
  try { if (localStorage.getItem(storageKey) === 'en') language = 'en'; } catch {}
  const originalTitle = document.title;

  function englishText(value) {
    if (!value) return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    let result = english[trimmed];
    if (result === undefined) {
      const rules = [
        [/^(\d+) 位人物 · (\d+) 条记录$/, (_, a, b) => `${a} people · ${b} records`],
        [/^(\d+) 位人物的姓名或关系待确认$/, (_, n) => `${n} person’s details unconfirmed`],
        [/^(\d+) 台开启 · (\d+) 台设备$/, (_, a, b) => `${a} on · ${b} devices`],
        [/^(\d+) 项待完成$/, (_, n) => `${n} remaining`],
        [/^(\d+) 条$/, (_, n) => `${n} records`],
        [/^(\d{1,2}:\d{2}) 更新$/, (_, time) => `Updated ${time}`],
        [/^播放(表白时刻|宠物迎接|登顶云海)$/, (_, name) => `Play ${english[name] || name}`],
        [/^(.+?)，(伴侣|家人|朋友|同事|导师|待确认)$/, (_, name, relation) => `${english[name] || name}, ${english[relation] || relation}`]
      ];
      for (const [pattern, make] of rules) {
        const match = trimmed.match(pattern);
        if (match) { result = make(...match); break; }
      }
    }
    if (result === undefined && trimmed.includes('\n')) {
      const parts = trimmed.split(/(\n+)/);
      const converted = parts.map(part => part.startsWith('\n') ? part : english[part] || part);
      if (converted.some((part, i) => part !== parts[i])) result = converted.join('');
    }
    if (result === undefined && trimmed.includes(' · ')) {
      const parts = trimmed.split(' · ');
      const converted = parts.map(part => english[part] || part);
      if (converted.some((part, i) => part !== parts[i])) result = converted.join(' · ');
    }
    if (result === undefined) return value;
    return value.replace(trimmed, result);
  }

  function translateNode(node) {
    if (!node.parentElement || node.parentElement.closest('script,style,textarea,[data-language-switch]')) return;
    const current = node.nodeValue;
    const previous = textOriginals.get(node);
    if (language === 'zh') {
      if (previous && current === previous.en) node.nodeValue = previous.zh;
      return;
    }
    if (previous && current === previous.en) return;
    const translated = englishText(current);
    if (translated !== current) {
      textOriginals.set(node, { zh: current, en: translated });
      node.nodeValue = translated;
    }
  }

  function translateAttributes(element) {
    if (element.matches('[data-language-switch]')) return;
    let originals = attributeOriginals.get(element);
    for (const name of translatedAttributes) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      const previous = originals?.[name];
      if (language === 'zh') {
        if (previous && current === previous.en) element.setAttribute(name, previous.zh);
        continue;
      }
      if (previous && current === previous.en) continue;
      const translated = englishText(current);
      if (translated !== current) {
        if (!originals) { originals = {}; attributeOriginals.set(element, originals); }
        originals[name] = { zh: current, en: translated };
        element.setAttribute(name, translated);
      }
    }
  }

  function translateTree(root) {
    if (root.nodeType === Node.TEXT_NODE) { translateNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE || root.matches('script,style,textarea')) return;
    translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) translateNode(node);
      else translateAttributes(node);
    }
  }

  function apply(next, persist = true) {
    language = next === 'en' ? 'en' : 'zh';
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = language === 'en' ? englishText(originalTitle) : originalTitle;
    if (persist) { try { localStorage.setItem(storageKey, language); } catch {} }
    document.querySelectorAll('[data-language-switch]').forEach(button => {
      button.setAttribute('aria-label', language === 'en' ? '切换为中文' : 'Switch to English');
      button.setAttribute('title', language === 'en' ? '切换为中文' : 'Switch to English');
    });
    if (document.body) translateTree(document.body);
    window.dispatchEvent(new CustomEvent('pmsg:languagechange', { detail: { language } }));
    document.querySelectorAll('iframe').forEach(frame => {
      frame.contentWindow?.postMessage({ channel: 'pmsg-language', language }, location.protocol === 'file:' ? '*' : location.origin);
    });
  }

  window.PmsgLanguage = {
    get language() { return language; },
    set: apply,
    english: value => englishText(String(value ?? '')),
    translate: value => language === 'en' ? englishText(String(value ?? '')) : String(value ?? '')
  };
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';

  function init() {
    document.querySelectorAll('[data-language-switch]').forEach(button => {
      button.addEventListener('click', () => apply(language === 'en' ? 'zh' : 'en'));
    });
    apply(language, false);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') translateNode(record.target);
        else if (record.type === 'attributes') translateAttributes(record.target);
        else record.addedNodes.forEach(translateTree);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: translatedAttributes });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  window.addEventListener('storage', event => { if (event.key === storageKey) apply(event.newValue, false); });
  window.addEventListener('message', event => {
    if (location.protocol !== 'file:' && event.origin !== location.origin) return;
    if (event.data?.channel === 'pmsg-language') apply(event.data.language, false);
  });
})();
