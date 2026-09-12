/* ============================================================
   Zhang Lab · 中 / EN 切换
   词典按「规范化 innerHTML」匹配；切换时中文原稿记忆在内存里
   偏好存 localStorage，刷新保持
   ============================================================ */
(() => {
  "use strict";

  const DICT = {
    /* 导航 */
    "首页": "Home",
    "课题组": "Group",
    "研究": "Research",
    "论文": "Publications",
    "加入我们": "Join Us",

    /* 首页 */
    "北京中关村学院 · 张致同课题组": "Beijing Zhongguancun Academy · Zhang Zhitong Lab",
    "NeuroDiagAI —— 神经精神疾病 EEG 辅助诊断：<br>128 通道超高密度无线脑电 · 自建 1.6w 条运动想象数据集 · 脑基础模型。人体的一切，都是信号。":
      "NeuroDiagAI — EEG-aided diagnosis of neuropsychiatric disorders:<br>128-ch ultra-high-density wireless EEG · a 16k-trial motor-imagery dataset · brain foundation models. Everything human is signal.",
    "查看研究方向 →": "Explore Research →",
    "点击顶部导航换页": "Switch pages from the top navigation",

    /* 课题组 */
    "GROUP · 课题组": "GROUP · THE LAB",
    "从材料到智能，<br>做<mark>全链条</mark>的脑机接口研究。":
      "From materials to intelligence —<br><mark>full-stack</mark> brain–computer interface research.",
    "Zhang Lab 是一支年轻的脑机接口研究团队，研究贯穿「材料 — 器件 — 系统 — 智能」全链条：高性能导电聚合物神经电极、可变刚度柔性植入电极、可穿戴传感系统，到脑电信号解码与脑机大模型。我们相信，精巧的工程能让思想被聆听。":
      "Zhang Lab is a young BCI research group spanning the full chain of materials — devices — systems — intelligence: high-performance conducting-polymer neural electrodes, variable-stiffness flexible implantable electrodes, wearable sensing, EEG decoding and brain foundation models. We believe fine engineering lets thoughts be heard.",
    "NEWS<em>动态</em>": "NEWS",
    "课题组网站上线，长期招收博士后 / 研究生 / 科研助理":
      "Lab website launched — long-term openings for postdocs, PhD/MSc students and research assistants",
    "NeuroDiagAI 2026Q3：IEDM 2026 录取实现学院首次；自研 128 通道超高密度无线脑电系统搭建完成":
      "NeuroDiagAI 2026Q3: paper accepted at IEDM 2026 — a first for the Academy; our 128-ch ultra-high-density wireless EEG system is complete",
    "双通道眼电实时交互：6 分类 · 跨佩戴 81.7% · CPU 1.2ms/跳（ICLR 2027 在投）":
      "Real-time EOG interaction on two channels: 6 classes · 81.7% across re-wears · 1.2 ms CPU/step (under review at ICLR 2027)",
    "第四届中国脑机接口大赛获 2 项二等奖；自建 1.6w 条运动想象 EEG 数据集（42 名被试 · 7 种运动）":
      "Two second prizes at the 4th China BCI Competition; in-house 16k-trial motor-imagery EEG dataset (42 subjects · 7 motions)",
    "与宣武医院合作开展基于高密度脑机接口的脑卒中辅助诊疗；横向合作到账约 200 万":
      "Stroke-aided diagnosis with high-density BCI, in collaboration with Xuanwu Hospital; ~¥2M industry funding received",
    "TransFlex 入选 TRANSDUCERS 2025（美国·佛罗里达），柔性多臂可变刚度植入电极":
      "TransFlex accepted at TRANSDUCERS 2025 (Florida, USA) — flexible multi-shank variable-stiffness implantable electrode",
    "VariDepth (VD-NEA) 发表于 IEEE MEMS 2025，获最佳论文提名奖":
      "VariDepth (VD-NEA) published at IEEE MEMS 2025 — Best Paper Award nominee",
    "All-Polymer 神经电极工作投稿 <i>Nature</i>；定制化 3D 植入电极投稿 <i>Science Advances</i>":
      "All-polymer neural electrode work submitted to <i>Nature</i>; customized 3D implantable electrodes submitted to <i>Science Advances</i>",
    "FlexConnect 通用引出方案发表于 MicroTAS 2024（加拿大·蒙特利尔）":
      "FlexConnect universal leadout published at MicroTAS 2024 (Montréal, Canada)",

    /* PI */
    "PI · 导师": "PI",
    "张致同<br><span class=\"pi-en\">ZHANG ZHITONG</span>":
      "Zhitong Zhang<br><span class=\"pi-en\">张致同</span>",
    "研究覆盖脑机接口系统、先进神经电子界面、可穿戴传感器及系统、脑电信号解码及脑机大模型。工作发表于 <i>Nature</i>、<i>Science Advances</i> 投稿及 IEEE MEMS、TRANSDUCERS、MicroTAS 等会议，两获 IEEE MEMS 最佳论文提名。":
      "Research spans BCI systems, advanced neural electronic interfaces, wearable sensors and systems, EEG decoding and brain foundation models. Work submitted to <i>Nature</i> and <i>Science Advances</i>, and published at IEEE MEMS, TRANSDUCERS and MicroTAS — twice an IEEE MEMS Best Paper nominee.",
    "IEEE MEMS 最佳论文提名奖": "IEEE MEMS Best Paper Award nominee",
    "北京市优秀毕业生 · 五四奖章（北京航空航天大学）": "Beijing Outstanding Graduate · May Fourth Medal (BUAA)",
    "国家奖学金": "National Scholarship",

    /* 研究 */
    "RESEARCH · 研究方向与项目负责人": "RESEARCH · DIRECTIONS & LEADS",
    "从一个电极，<br>延伸到每一项<mark>具体工作</mark>":
      "From one electrode,<br>to every <mark>concrete piece of work</mark>",
    "脑机接口系统": "BCI Systems",
    "构建植入式与穿戴式脑机接口系统：从高通量柔性电极阵列、低噪声前端，到在体长期稳定记录与实时解码闭环。":
      "Building implantable and wearable BCI systems: high-throughput flexible electrode arrays, low-noise front-ends, long-term stable in-vivo recording and real-time closed-loop decoding.",
    "张致同 <span class=\"m-role\">PI</span>": "Zhitong Zhang <span class=\"m-role\">PI</span>",
    "方向负责人 · 电极与系统集成": "Direction lead · Electrodes & system integration",
    "All-Polymer 神经电极 · 慢性在体记录 <i>Nature (submitted)</i>":
      "All-polymer neural electrode · chronic in-vivo recording <i>Nature (submitted)</i>",
    "定制化 3D 植入电极 · 匹配神经组织解剖 <i>Sci. Adv. (submitted)</i>":
      "Customized 3D implantable electrodes · matched to neural tissue anatomy <i>Sci. Adv. (submitted)</i>",
    "TransFlex 多臂可变刚度植入电极 <i>TRANSDUCERS 2025</i>":
      "TransFlex multi-shank variable-stiffness implantable electrode <i>TRANSDUCERS 2025</i>",
    "先进神经电子界面": "Neural Electronic Interfaces",
    "electrode 与组织的界面工程：材料、结构与文化。": "Interface engineering between electrode and tissue: materials, structures, culture.",
    "方向负责人 · 界面材料与结构": "Direction lead · Interface materials & structures",
    "VariDepth (VD-NEA) · 立体掩膜实现任意电极深度 <i>IEEE MEMS 2025 · 提名</i>":
      "VariDepth (VD-NEA) · arbitrary electrode depth via stereo mask <i>IEEE MEMS 2025 · nominee</i>",
    "FlexConnect · 柔性通用引出与键合界面 <i>MicroTAS 2024 / JCK 2024</i>":
      "FlexConnect · flexible universal leadout and bonding interface <i>MicroTAS 2024 / JCK 2024</i>",
    "环形微针阵列 · 发上 EEG 干电极 <i>IEEE MEMS 2021</i>":
      "Annular microneedle array · on-hair EEG dry electrode <i>IEEE MEMS 2021</i>",
    "干式 · 免导电膏": "Dry · no conductive gel",
    "128 · 世界最高密度": "128 · world's highest density",
    "可穿戴传感器及系统": "Wearable Sensors & Systems",
    "贴着皮肤的柔性传感：把测量穿戴在身上。": "Soft sensing on skin: wearing the measurement.",
    "方向负责人 · 柔性传感": "Direction lead · Flexible sensing",
    "FAICS 环形叉指电容传感 · 接近/压力 <i>IEEE MEMS 2022</i>":
      "FAICS annular interdigital capacitive sensor · proximity / pressure <i>IEEE MEMS 2022</i>",
    "铂基穿孔呼吸传感器 · 连续监测 <i>Micromachines 2022</i>":
      "Platinum perforated respiratory sensor · continuous monitoring <i>Micromachines 2022</i>",
    "脑电解码及脑机大模型": "EEG Decoding & Foundation Models",
    "从头皮到皮层内：解码算法、脑基础模型与疾病辅助诊断。":
      "From scalp to cortex: decoding algorithms, brain foundation models and disease-aided diagnosis.",
    "DECODING ACCURACY · 解码准确率": "DECODING ACCURACY",
    "刘鼎坤": "Dingkun Liu",
    "脑机接口多模态大模型 · 竞赛主力": "BCI multimodal foundation models · competition lead",
    "EEG 辅助诊断与脑基础模型": "EEG-Aided Diagnosis & Brain Foundation Models",
    "面向神经精神疾病的 EEG 辅助诊断：跨被试小样本适配、情绪解码基础模型、脑卒中辅助诊疗（宣武医院合作）。":
      "EEG-aided diagnosis of neuropsychiatric disorders: cross-subject few-shot adaptation, emotion-decoding foundation models, stroke-aided diagnosis (with Xuanwu Hospital).",
    "王君逸": "Junyi Wang",
    "EEG 基础模型 · 跨被试适配 / 持续学习": "EEG foundation models · cross-subject adaptation / continual learning",
    "EEG 基础模型跨被试小样本提示微调 · Training-free <i>AAAI 2027 (under review)</i>":
      "Few-shot prompt tuning of EEG foundation models across subjects · Training-free <i>AAAI 2027 (under review)</i>",
    "刘丽华": "Lihua Liu",
    "情绪脑机接口 · GNN-Mamba 基础模型": "Emotion BCI · GNN-Mamba foundation model",
    "脑机接口情绪解码基础模型 · GNN-Mamba 时空联合":
      "Emotion-decoding foundation model · GNN-Mamba spatio-temporal fusion",
    "孙钰晓": "Yuxiao Sun",
    "神经退行性疾病 · 多智能体辅助诊疗": "Neurodegenerative diseases · multi-agent-aided diagnosis",
    "基于高密度脑机接口的脑卒中辅助诊疗 · 宣武医院合作":
      "High-density-BCI stroke-aided diagnosis · with Xuanwu Hospital",
    "类脑智能与在线学习": "Brain-Inspired Intelligence & Online Learning",
    "脉冲神经网络的在线学习与表征漂移；AI 自主科研共生平台。":
      "Online learning and representational drift in spiking neural networks; an AI-autonomous-research symbiotic platform.",
    "沈思成": "Sicheng Shen",
    "类脑在线学习 · Spiking Transformer": "Brain-inspired online learning · Spiking Transformer",
    "Spiking Transformer · 在线学习算法集成与新一代架构":
      "Spiking Transformer · integrated online learning and a next-generation architecture",
    "马晓猛": "Xiaomeng Ma",
    "AI 自主科研 · Meta Research 平台": "AI-autonomous research · Meta Research platform",
    "Meta Research · AI 自主科研循环平台": "Meta Research · an AI self-driving research loop",
    "眼电交互与可穿戴神经接口": "EOG Interaction & Wearable Neural Interfaces",
    "仅双通道眼电(EOG)的实时交互：6 分类手势指令、跨佩戴 81.7%、CPU 1.2ms/跳——把先验逻辑交给模型学习。":
      "Real-time interaction on two EOG channels only: 6 gesture classes, 81.7% across re-wears, 1.2 ms CPU per step — priors learned by the model.",
    "李文宇": "Wenyu Li",
    "眼电交互 ACED · 可穿戴神经接口": "EOG interaction ACED · wearable neural interfaces",
    "ACED · 自适应因果检测架构，Re-wear-Robust": "ACED · adaptive causal detection architecture, re-wear-robust",
    "自然场景基线漂移建模 · 先验逻辑信号化": "Baseline-drift modeling in natural scenes · turning priors into signals",
    "延迟 668–940 ms · 200ms 节拍 160 倍算力余量": "Latency 668–940 ms · 200 ms cadence · 160× compute headroom",

    /* 论文 */
    "PUBLICATIONS · 论文": "PUBLICATIONS",
    "代表性论文与会议": "Selected Publications & Conferences",
    "<i>IEDM 2026</i> · ACCEPTED · 北京中关村学院首次": "<i>IEDM 2026</i> · ACCEPTED · a first for BZA",
    "<i>IEEE MEMS 2027</i> · UNDER REVIEW · 通讯作者": "<i>IEEE MEMS 2027</i> · UNDER REVIEW · corresponding author",
    "基于新被试小样本支持集的参数高效提示微调 —— EEG 基础模型跨被试适配":
      "Parameter-efficient prompt tuning with few-shot support sets — cross-subject adaptation of EEG foundation models",
    "<i>ICLR 2027</i> · PREPARATION · 双通道眼电 · 跨佩戴 81.7%": "<i>ICLR 2027</i> · PREPARATION · two-channel EOG · 81.7% across re-wears",
    "提名": "NOMINEE",

    /* 加入 */
    "JOIN US · 加入我们": "JOIN US",
    "如果你也相信，<br>思想可以被聆听。": "If you believe that thoughts<br>can be heard —",
    "长期招收博士后、博士 / 硕士研究生与科研助理。<br>神经科学 / 材料与器件 / EEG 解码与基础模型 / 多智能体系统——皆是同路人。":
      "Long-term openings for postdocs, PhD / MSc students and research assistants.<br>Neuroscience / materials & devices / EEG decoding & foundation models / multi-agent systems — all fellow travelers.",
    "北京中关村学院 · 脑机接口课题组": "Beijing Zhongguancun Academy · BCI Group",
    "Zhang Lab · NeuroDiagAI 项目组 © 2026 · 北京中关村学院": "Zhang Lab · NeuroDiagAI Group © 2026 · Beijing Zhongguancun Academy",

    /* 姓名印章 */
    "张": "Z", "刘": "L", "王": "W", "孙": "S", "沈": "S", "马": "M", "李": "L",
    "张致同": "Zhitong Zhang"
  };

  const norm = s => s.replace(/\s+/g, " ").trim();
  const hasCJK = s => /[\u4e00-\u9fff]/.test(s);
  const SEL = "#deck h1, #deck h2, #deck h3, #deck p, #deck li, #deck span, #deck dt, #deck dd, #deck a, #deck figcaption, .topnav a";
  const memo = new Map();     // el -> 中文原稿
  let lang = localStorage.getItem("zlab-lang") || "zh";

  function apply(cur) {
    document.querySelectorAll(SEL).forEach(el => {
      if (cur === "zh") {
        if (memo.has(el)) el.innerHTML = memo.get(el);   // 恢复中文原稿
        return;
      }
      const key = norm(el.innerHTML);
      if (!hasCJK(key)) return;
      if (!memo.has(el)) memo.set(el, el.innerHTML);
      const en = DICT[key];
      if (en !== undefined) el.innerHTML = en;
    });
    document.documentElement.lang = cur === "en" ? "en" : "zh-CN";
    const btn = document.querySelector(".lang-toggle");
    if (btn) {
      // 按钮显示的是「将要切换到」的语言
      btn.textContent = cur === "zh" ? "EN" : "中";
      btn.title = cur === "zh" ? "Switch to English" : "切换到中文";
    }
  }

  function setLang(cur) {
    lang = cur;
    localStorage.setItem("zlab-lang", cur);
    apply(cur);
  }

  function boot() {
    // 导航加通用风格切换按钮：点击在中 / EN 间切换
    const nav = document.querySelector(".topnav");
    if (nav && !nav.querySelector(".lang-toggle")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-toggle";
      btn.addEventListener("click", () => setLang(lang === "zh" ? "en" : "zh"));
      nav.insertBefore(btn, nav.querySelector(".nav-cta"));
    }
    apply(lang);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
