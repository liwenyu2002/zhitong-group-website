#!/usr/bin/env python3
"""i18n 词典审计：检查 index.html 里的中文是否都有英文翻译。
用法：python3 i18n-audit.py
输出「缺失」条目 —— 补进 js/i18n.js 的 DICT 即可。"""
import re

html = open('index.html').read()
ijs  = open('js/i18n.js').read()

def norm(s): return re.sub(r'\s+', ' ', s).strip()

# 词典键（干净列表，反转义 \" 并剥标签）
dict_keys = [norm(re.sub(r'<[^>]+>', '', k.replace('\\"', '"')))
             for k in re.findall(r'"((?:[^"\\]|\\.)*)":\s*"', ijs)]

# 只取 <main id="deck"> 到 </main> 的页面主体
seg = html[html.find('<main'):html.rfind('</main>')]

# 叶子提取：候选标签的内容（含简单内联标签）
frags = {}
for m in re.finditer(r'<(h1|h2|h3|p|li|span|dt|dd|b)([^>]*)>(.*?)</\1>', seg, re.S):
    key = norm(m.group(3))
    if not re.search(r'[\u4e00-\u9fff]', key): continue
    if '<div' in key or '<span class="n-date"' in key or '<span class="p-no"' in key or '<span class="pi-en"' in key:
        # 容器：由内部元素各自翻译，跳过整包
        continue
    frags[key] = frags.get(key, 0) + 1

missing = []
for key in frags:
    plain = norm(re.sub(r'<[^>]+>', '', key))     # 剥标签后的纯文本
    if not any(plain in dk or dk in plain for dk in dict_keys):
        missing.append(key)

print(f"页面中文文本 {len(frags)} 条 | 缺失翻译 {len(missing)} 条")
for k in missing:
    print("  ✗", k)
