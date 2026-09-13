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
    "成果": "Achievements",
    "加入我们": "Join Us",

    /* 首页 */
    "北京中关村学院 · 张致同课题组": "Beijing Zhongguancun Academy · Zhang Zhitong Lab",
    "NeuroDiagAI —— 神经精神疾病 EEG 辅助诊断：<br>128 通道超高密度无线脑电 · 自建 1.6w 条运动想象数据集 · 脑基础模型。人体的一切，都是信号。":
      "NeuroDiagAI — EEG-aided diagnosis of neuropsychiatric disorders:<br>128-ch ultra-high-density wireless EEG · a 16k-trial motor-imagery dataset · brain foundation models. Everything human is signal.",
    "研究方向": "RESEARCH",

    /* 成员页 */
    "成员": "Members",
    "MEMBERS · 成员": "MEMBERS",
    "同路人，<br>在这里<mark>集合</mark>。": "Fellow travelers —<br><mark>assemble</mark> here.",
    "把信号当语言的，不止一个人。照片、年级、来处与方向——一页看全。":
      "More than one of us speaks in signals. Photos, cohorts, origins and directions — all on one page.",
    "年级": "Cohort",
    "原高校": "Alma mater",
    "待补": "TBD",
    "博士": "PhD",
    /* 成员卡姓名（h3 整键匹配） */
    "李文宇 <span class=\"mc-role\">博士</span>": "Wenyu Li <span class=\"mc-role\">PhD</span>",
    "王君逸 <span class=\"mc-role\">博士</span>": "Junyi Wang <span class=\"mc-role\">PhD</span>",
    "刘丽华 <span class=\"mc-role\">博士</span>": "Lihua Liu <span class=\"mc-role\">PhD</span>",
    "孙钰晓 <span class=\"mc-role\">博士</span>": "Yuxiao Sun <span class=\"mc-role\">PhD</span>",
    "张天赐 <span class=\"mc-role\">博士</span>": "Tianci Zhang <span class=\"mc-role\">PhD</span>",
    "刘鼎坤 <span class=\"mc-role\">博士</span>": "Dingkun Liu <span class=\"mc-role\">PhD</span>",
    "沈思成 <span class=\"mc-role\">博士</span>": "Sicheng Shen <span class=\"mc-role\">PhD</span>",
    "王奕诚 <span class=\"mc-role\">博士</span>": "Yicheng Wang <span class=\"mc-role\">PhD</span>",
    "马晓猛 <span class=\"mc-role\">博士</span>": "Xiaomeng Ma <span class=\"mc-role\">PhD</span>",
    "2024 级": "Class of 2024",
    "2025 级": "Class of 2025",
    "2026 级": "Class of 2026",
    "硕士": "M.Sc.",
    "张致同 PI": "Zhitong Zhang (PI)",
    "李文宇": "Wenyu Li",
    "王君逸": "Junyi Wang",
    "刘丽华": "Lihua Liu",
    "孙钰晓": "Yuxiao Sun",
    "刘鼎坤": "Dingkun Liu",
    "张天赐": "Tianci Zhang",
    "BrainSeg · fMRI 密集语义解码探类别特异性神经表征 <i>ICLR 2027 (preparation)</i>":
      "BrainSeg · probing category-specific neural representations via dense fMRI semantic decoding <i>ICLR 2027 (preparation)</i>",
    "BrainSeg · 类别特异性神经表征语义解码": "BrainSeg · category-specific neural representations via semantic decoding",
    "沈思成": "Sicheng Shen",
    "马晓猛": "Xiaomeng Ma",
    "北京大学": "Peking University",
    "学位": "Degree",
    "高校": "University",
    "北京航空航天大学": "Beihang University",
    "哈尔滨工业大学": "Harbin Institute of Technology",
    "中国科学院自动化研究所": "Institute of Automation, CAS",
    "华东师范大学": "East China Normal University",
    "东南大学": "Southeast University",
    "帮你想出不一样的点子": "Helps you come up with delightfully different ideas",
    "彩蛋": "Easter Eggs",
    "人员课题图谱": "Member\u2013Topic Map",
    "精选论文": "Selected Publications",
    "许海凌 <span class=\"mc-role\">博士</span>": "Hailing Xu <span class=\"mc-role\">PhD</span>",
    "厦门大学": "Xiamen University",
    "下一颗彩蛋": "The next egg",
    "孵化中 INCUBATING": "Incubating",
    "华东科技大学": "East China University of Science and Technology",
    "北京航空航天大学": "Beihang University",
    "王奕诚": "Yicheng Wang",
    "方向待定": "Direction TBD",
    "Ⅰ/Ⅱ/Ⅲ · 全链条脑机接口 · 信号放大器与神经界面":
      "Ⅰ/Ⅱ/Ⅲ · Full-stack BCI · signal amplifiers and neural interfaces",
    "全链条脑机接口 · 信号放大器与神经界面": "Full-stack BCI · signal amplifiers and neural interfaces",
    "眼电交互与可穿戴神经接口": "EOG interaction & wearable neural interfaces",
    "EEG 基础模型与跨被试适配": "EEG foundation models & cross-subject adaptation",
    "情绪脑机接口 · GNN-Mamba": "Emotion BCI · GNN-Mamba",
    "脑卒中辅助诊疗 · 多智能体": "Stroke-aided diagnosis · multi-agent",
    "脑电解码与多模态大模型": "EEG decoding & multimodal foundation models",
    "类脑在线学习 · Spiking Transformer": "Brain-inspired online learning · Spiking Transformer",
    "AI 自主科研 · Meta Research": "AI-autonomous research · Meta Research",
    "Ⅶ · 眼电交互与可穿戴神经接口": "Ⅶ · EOG interaction & wearable neural interfaces",
    "Ⅴ · EEG 基础模型与跨被试适配": "Ⅴ · EEG foundation models & cross-subject adaptation",
    "Ⅴ · 情绪脑机接口 · GNN-Mamba": "Ⅴ · Emotion BCI · GNN-Mamba",
    "Ⅴ · 脑卒中辅助诊疗 · 多智能体": "Ⅴ · Stroke-aided diagnosis · multi-agent",
    "Ⅳ · 脑电解码与多模态大模型": "Ⅳ · EEG decoding & multimodal foundation models",
    "Ⅵ · 类脑在线学习 · Spiking Transformer": "Ⅵ · Brain-inspired online learning · Spiking Transformer",
    "Ⅵ · AI 自主科研 · Meta Research": "Ⅵ · AI-autonomous research · Meta Research",
    "人员课题图谱 <em>MEMBER × TOPIC MAP</em>": "MEMBER × TOPIC MAP",
    "张致同 PI": "Zhitong Zhang (PI)",
    "Ⅰ 脑机接口系统": "Ⅰ BCI Systems",
    "Ⅱ 神经电子界面": "Ⅱ Neural Interfaces",
    "Ⅲ 可穿戴传感": "Ⅲ Wearable Sensing",
    "Ⅳ 脑电解码与大模型": "Ⅳ Decoding & Foundation Models",
    "Ⅴ EEG 辅助诊断": "Ⅴ EEG-Aided Diagnosis",
    "Ⅵ 类脑智能": "Ⅵ Brain-Inspired Intelligence",
    "Ⅶ 眼电交互": "Ⅶ EOG Interaction",
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
    "RESEARCH · 研究方向": "RESEARCH · RESEARCH DIRECTIONS",
    "构建植入式与穿戴式脑机接口的完整链路：从高通量柔性电极阵列、低噪声前端，到在体长期稳定记录与实时解码闭环。全聚合物神经电极正在开展慢性在体记录（<i>Nature</i> 投稿），定制化 3D 植入电极用于匹配神经组织解剖（<i>Sci. Adv.</i> 投稿）。":
      "The full chain of implantable and wearable BCIs: from high-density flexible electrode arrays and low-noise front-ends to chronic in-vivo recording and real-time decoding loops. An all-polymer neural electrode is now in chronic in-vivo recording (<i>Nature</i> submitted); a custom 3D implant electrode matches neural tissue anatomy (<i>Sci. Adv.</i> submitted).",
    "自研 TransFlex 多臂可变刚度植入电极（TRANSDUCERS 2025），术中易植入、在体后柔软；并与合作单位推进多层皮层内探针等器件的工程化验证。":
      "Our TransFlex multi-arm variable-stiffness implant electrode (TRANSDUCERS 2025) inserts easily during surgery yet turns soft in vivo; together with partner labs we are engineering multilayer intracortical probes.",
    "FIG. R1 · 3D 神经电极微制造工艺": "FIG. R1 · 3D microfabrication of neural electrodes",
    "研究电极与神经组织的界面工程——材料、结构与工艺的协同设计。VariDepth（VD-NEA）以立体掩膜实现任意电极深度（IEEE MEMS 2025 · 提名）；FlexConnect 提供柔性通用引出与键合界面（MicroTAS 2024 / JCK 2024）；环形微针阵列实现发上干电 EEG（IEEE MEMS 2021）。":
      "Interface engineering between electrodes and neural tissue — materials, structures and fabrication designed together. VariDepth (VD-NEA) reaches arbitrary electrode depths via stereo masking (IEEE MEMS 2025, nominated); FlexConnect offers a flexible universal interconnect and bonding interface (MicroTAS 2024 / JCK 2024); ring microneedle arrays enable on-hair dry EEG (IEEE MEMS 2021).",
    "最新工作 STAMA 可拉伸全聚合物微针阵列（IEEE MEMS 2027）：拉伸 47% 后电化学性能依然稳定，为低阻抗干式电生理记录提供新的材料路线。":
      "Our latest work, STAMA — a stretchable all-polymer microneedle array (IEEE MEMS 2027) — keeps stable electrochemical performance after 47% stretch, opening a new materials route to low-impedance dry electrophysiology.",
    "FIG. R2 · STAMA 可拉伸全聚合物微针阵列": "FIG. R2 · STAMA stretchable all-polymer microneedle array",
    "贴着皮肤的柔性传感：把测量穿戴在身上。自研 128 通道超高密度无线脑电采集系统——64 通道压缩于 3×3 cm²、干电极、5 分钟内完成佩戴，通道密度为目前世界最高；硬件系统已搭建完毕，正在构建最高密度的 EEG 数据集。":
      "Soft sensing worn on the body. Our self-built 128-channel ultra-high-density wireless EEG system packs 64 channels into 3×3 cm² with dry electrodes and under-5-minute setup — the highest channel density in the world; the hardware is complete and we are building the densest EEG dataset to date.",
    "器件方向延续 FAICS 环形叉指电容传感（接近 / 压力，IEEE MEMS 2022）与铂基穿孔呼吸传感器（连续监测，Micromachines 2022），面向长期、无感的人体信号测量。":
      "On the device side we continue with FAICS ring-interdigitated capacitive sensing (proximity / pressure, IEEE MEMS 2022) and a platinum perforated breathing sensor (continuous monitoring, Micromachines 2022), for long-term, invisible measurement of the body.",
    "FIG. R3 · 128-CH 干电极无线采集系统": "FIG. R3 · 128-ch dry-electrode wireless EEG system",
    "从头皮到皮层内：解码算法、脑基础模型与疾病辅助诊断。BrainSeg 把视觉语义分割引入 fMRI 神经表征研究，以密集语义解码探查类别特异性神经表征（ICLR 2027 筹备中）。":
      "From scalp to intracortical signals: decoding algorithms, brain foundation models and disease-aided diagnosis. BrainSeg brings vision semantic segmentation into fMRI neural representation research, probing category-specific representations through dense semantic decoding (in preparation for ICLR 2027).",
    "在中国脑机接口大赛中，基于感觉肌肉电刺激提示的上肢运动想象分类获两项二等奖；自研脑机接口数据采集平台支撑「挑战杯」参赛工作。":
      "At the China BCI Competition, upper-limb motor-imagery classification cued by sensory muscle electrical stimulation won two second prizes; our self-built BCI data-collection platform supported the Challenge Cup entry.",
    "FIG. R4 · 中国脑机接口大赛 · 二等奖 ×2": "FIG. R4 · China BCI Competition · 2nd Prize ×2",
    "面向神经精神疾病的 EEG 辅助诊疗：EEG 基础模型的跨被试小样本提示微调（Training-free，AAAI 2027 在审）；情绪解码基础模型（GNN-Mamba 时空联合建模）；与宣武医院合作开展的基于高密度脑机接口的脑卒中辅助诊疗。":
      "EEG-aided care for neuropsychiatric disorders: cross-subject few-shot prompt tuning of EEG foundation models (training-free, AAAI 2027 under review); an emotion-decoding foundation model (GNN-Mamba spatio-temporal modeling); and stroke-aided diagnosis on high-density BCIs with Xuanwu Hospital.",
    "方法上强调「基础模型 + 临床约束」：抑制跨被试迁移中的灾难性遗忘，以标签去噪与置信度加权提升数据质量，并以多智能体协作模拟临床会诊流程，覆盖从筛查到鉴别的完整链路。":
      "Method-wise we stress foundation models with clinical constraints: suppressing catastrophic forgetting in cross-subject transfer, improving data quality via label denoising and confidence weighting, and simulating clinical consultations with multi-agent collaboration — from screening to differential diagnosis.",
    "FIG. R5 · 脑卒中辅助诊疗（宣武医院合作）": "FIG. R5 · Stroke-aided diagnosis (Xuanwu Hospital)",
    "脉冲神经网络的在线学习：在 Spiking Transformer 上集成 OTTT、BrainTrace、SLTT 等在线学习算法，刻画跨时间步的梯度相似性，并设计新一代 Attention 架构，消除 spike×spike 算子带来的梯度不稳定。":
      "Online learning for spiking networks: we integrate OTTT, BrainTrace and SLTT into Spiking Transformers, characterize cross-timestep gradient similarity, and design a new attention architecture that removes gradient instability from spike×spike operators.",
    "面向 BCI 长期闭环使用的跨天解码与硬件漂移问题，让网络在稀疏、低功耗约束下持续适应信号变化；同期建设 Meta Research——AI 自主科研共生平台，以元循环与主动人机协同支撑长期研究。":
      "Toward day-across decoding and hardware drift in long-term closed-loop BCI, we keep networks adapting under sparsity and low-power budgets; in parallel we build Meta Research, an AI-autonomous-research platform driven by meta-cycles and proactive human-machine collaboration.",
    "FIG. R6 · 新一代 Spiking Transformer 架构": "FIG. R6 · Next-gen Spiking Transformer architecture",
    "仅双通道眼电（EOG）的实时交互：ACED 自适应因果检测架构实现 6 分类手势指令，跨佩戴准确率 81.7%，延迟 668–940 ms，CPU 1.2 ms/跳（200 ms 节拍下 160 倍算力余量）。":
      "Real-time interaction on just two EOG channels: the ACED adaptive causal-detection architecture delivers 6-class gesture commands with 81.7% cross-wear accuracy, 668–940 ms latency and 1.2 ms of CPU per 200 ms tick — a 160× compute margin.",
    "核心创新是把先验逻辑交给模型学习——将自然场景下的基线漂移建模为信号一并输入网络，佩戴内分类准确率明显提升（ICLR 2027 筹备中）。":
      "The key idea is to hand prior logic to the model: baseline drift in natural scenes is modeled as a signal fed into the network, clearly lifting within-wear accuracy (in preparation for ICLR 2027).",
    "FIG. R7 · 双通道眼电交互：免手控定位": "FIG. R7 · Two-channel EOG interaction, hands-free",
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
    "ACHIEVEMENTS · 成果": "ACHIEVEMENTS",
        "代表性成果": "Representative Achievements",
    
    "通讯作者": "corresponding author",
    "<i>IEDM 2026</i> · 通讯作者": "<i>IEDM 2026</i> · corresponding author",
    "<i>IEEE MEMS 2027</i> · 通讯作者": "<i>IEEE MEMS 2027</i> · corresponding author",
    "<i>Nature</i> · 通讯作者": "<i>Nature</i> · corresponding author",
    "<i>Science Advances</i> · 通讯作者": "<i>Science Advances</i> · corresponding author",
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
  const SEL = "#deck h1, #deck h2, #deck h3, #deck p, #deck li, #deck span, #deck dt, #deck dd, #deck a, #deck b, #deck figcaption, #deck .news-head, .topnav a";
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
