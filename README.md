# 张致同课题组 · Zhitong Group

北京中关村学院张致同研究员课题组官网。课题组围绕脑机接口（BCI）与神经精神疾病辅助诊断开展研究，承担 NeuroDiagAI 项目，研究方向涵盖：脑机接口系统、先进神经电子界面、可穿戴传感、脑电解码与脑机大模型、EEG 辅助诊疗、类脑智能、眼电交互。

**网址**：<https://www.zhitong-group.com>

## 网站结构

- **首页** — 课题组定位与入口
- **课题组** — NeuroDiagAI 项目背景
- **PI** — 张致同研究员简介、荣誉与精选论文
- **成员** — 博士成员卡片与人员课题图谱
- **研究** — 七个研究方向简介
- **成果** — 代表性成果列表
- **加入我们** — 招生与联系

课题组主站为静态站点（HTML / CSS / Canvas，无第三方依赖），支持中英双语。站点网关使用 `www.zhitong-group.com`，主站内容来自此仓库。

## 看见之外 · 序章

预热页面位于 [`/beyond/`](https://www.zhitong-group.com/beyond/)，静态文件独立放在 `beyond/`，首页导航提供入口。页面沿用黑白抽象海报、隐喻短句和滚动显现，以一台持续显示的手机串联「今日、家居、记忆、Agent」四个可交互页面。手机随滚动切页，记忆图谱淡入；家居和高光视频与顶部通知同步，高光视频可在记忆页回看。App 内的人物、指标和设备联动均为演示数据，不连接实际设备。

`/beyond/` 暂时使用前端密令入口。入口使用点阵眼睛和粒子输入流；验证成功后，粒子立即散开，页面在后台加载。此方案只用于临时展示：密令可从网页源码中找到，内容也可通过直接地址访问，不能用于保密。

`beyond/` 保留预热内容的源码；`deployment/build-pages.py` 将主站、前端密令入口与预热素材打包发布到 GitHub Pages。此仓库是公开仓库，仓库中的预热素材及历史版本可直接访问。

粒子入口资源位于 `deployment/gate/public/`，临时密令配置位于 `deployment/gate/static-auth.js`。备用服务端网关源码保留在 `deployment/site-worker/`。

腾讯云 EdgeOne Makers 的构建脚本为 `deployment/edgeone/build.py`。执行 `python3 deployment/edgeone/build.py /tmp/zhitong-edgeone /tmp/zhitong-edgeone.zip` 可生成直接上传包；密令和签名密钥仍需在托管服务端配置。

预热字体按当前页面字符做了子集处理，字形轮廓保持不变。修改主页面文案后，可在安装 `fonttools[woff]` 的 Python 环境运行 `deployment/subset-teaser-fonts.py` 重新生成；完整字体源保留在该脚本指定的历史提交中。
