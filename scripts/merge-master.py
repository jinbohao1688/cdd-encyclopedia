#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CDD Encyclopedia — Master Merge Script (Python Version)
从 CDD_World_Master.md 提取所有 L1-L17 接口事实、OP、张力、时间线、PAT、总览页等，
合并到 data/encyclopedia.json（不覆盖已有，按 id 去重）。
"""

import json
import re
import os
from pathlib import Path

ROOT = Path(r"E:\CCD世界\正典\cdd-encyclopedia")
MASTER_PATH = Path(r"E:\CCD世界\正典\CDD_World_Master.md")
ENCYCLOPEDIA_PATH = ROOT / "data" / "encyclopedia.json"
CATEGORIES_PATH = ROOT / "data" / "categories.json"
SEARCH_INDEX_PATH = ROOT / "data" / "search-index.json"
NEW_IDS_PATH = ROOT / "NEW-IDS.txt"


def read_json(p: Path) -> dict:
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(p: Path, obj) -> None:
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def slugify(iden: str) -> str:
    s = str(iden).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"^-+|-+$", "", s)


def layer_to_category(layer_num: int) -> str:
    if 0 <= layer_num <= 7:
        return "science"
    if 8 <= layer_num <= 13:
        return "history"
    if layer_num in (14, 15, 16):
        return "society"
    if layer_num == 17:
        return "modern-world"
    return "concept"


LAYER_STATUS = {
    "1":  {"canonTier": "TIER 2", "canonStatusRaw": "TIER 2 已验证", "source": "L1-COS-001 v1.1"},
    "2":  {"canonTier": "TIER 2", "canonStatusRaw": "TIER 2 已验证", "source": "L2-GEO-001 v1.0"},
    "3":  {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已收录", "source": "L3-ATM-001 v1.0"},
    "4":  {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已收录", "source": "OCE-001 v1.0"},
    "5":  {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 正式收录", "source": "L5-BIO-001 v1.1"},
    "6":  {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 正式收录", "source": "L6-ECO-001 v1.1"},
    "7":  {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 正式收录", "source": "BIO-007 v1.1"},
    "8":  {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 直接收录", "source": "L8-ARC-001 v1.0"},
    "9":  {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L9-HIS-001 v1.0"},
    "10": {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L10-GEO-001 v1.0"},
    "11": {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L11-EMP-001 v1.0"},
    "12": {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L12-IND-001 v1.0"},
    "13": {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L13-AGI-001 v1.0"},
    "14": {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L14-LNG-001 v1.0"},
    "15": {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L15-ECO-001 v1.0"},
    "16": {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L16-REL-001 v1.0"},
    "17": {"canonTier": "TIER 3", "canonStatusRaw": "TIER 3 已完成", "source": "L17-CUR-001 v1.0"},
}

LAYER_NAMES = {
    "1": "L1 · 宇宙学与恒星系",
    "2": "L2 · 行星地质与矿藏",
    "3": "L3 · 大气与气候",
    "4": "L4 · 海洋学",
    "5": "L5 · 生物化学与生命起源",
    "6": "L6 · 生态系统与演化",
    "7": "L7 · 智慧种族生物学",
    "8": "L8 · 史前史与考古",
    "9": "L9 · 古代史",
    "10": "L10 · 地理与地缘结构",
    "11": "L11 · 中世纪史 / 帝国时代",
    "12": "L12 · 近代史 / 工业化时代",
    "13": "L13 · AI 临界事件",
    "14": "L14 · 语言与文字系统",
    "15": "L15 · 经济与资源体系",
    "16": "L16 · 宗教、哲学、文化",
    "17": "L17 · 当代世界",
}


# ============ 读入 Master ============
with open(MASTER_PATH, "r", encoding="utf-8") as f:
    master_text = f.read()
print(f"✓ Master 文档读取完成：{len(master_text)} 字符")

# ============ 读入旧数据 ============
old_encyclopedia = read_json(ENCYCLOPEDIA_PATH)
old_articles_by_id = {a["id"]: a for a in old_encyclopedia["articles"]}
old_ops_by_id = {o["id"]: o for o in old_encyclopedia["openQuestions"]}
old_conflicts_by_id = {c["id"]: c for c in old_encyclopedia["canonConflicts"]}
old_timeline_keys = {f"{t['era']}|{t['date']}|{t['title']}" for t in old_encyclopedia["timeline"]}
old_changelog_ids = {c["id"] for c in old_encyclopedia.get("changeLog", [])}

print(f"✓ 原数据：{len(old_articles_by_id)} articles, {len(old_ops_by_id)} OPs, "
      f"{len(old_conflicts_by_id)} conflicts, {len(old_encyclopedia['canonicalMysteries'])} mysteries, "
      f"{len(old_encyclopedia['timeline'])} timeline")

# ============ 容器 ============
new_articles = []
new_article_ids = []
skipped_ids = []
new_ops = []
new_conflicts = []
new_timeline = []
new_changelog = []


def add_article_if_not_exists(article: dict) -> bool:
    if article["id"] in old_articles_by_id:
        skipped_ids.append(article["id"])
        print(f"  SKIP: {article['id']} exists")
        return False
    article.setdefault("slug", slugify(article["id"]))
    article.setdefault("aliases", [])
    article.setdefault("related", [])
    article.setdefault("fields", {})
    article.setdefault("body", [])
    article.setdefault("sources", [])
    article.setdefault("canonTier", "TIER 3")
    article.setdefault("canonStatusRaw", article["canonTier"])
    new_articles.append(article)
    new_article_ids.append(article["id"])
    return True


def add_op_if_not_exists(op: dict) -> bool:
    if op["id"] in old_ops_by_id:
        return False
    new_ops.append(op)
    return True


def add_conflict_if_not_exists(c: dict) -> bool:
    if c["id"] in old_conflicts_by_id:
        return False
    new_conflicts.append(c)
    return True


# ============ 一、解析接口事实表 ============
print("\n========== 一、解析接口事实表 ==========")
fact_articles = []
for layer_num in range(1, 18):
    layer_s = str(layer_num)
    status = LAYER_STATUS[layer_s]
    layer_name = LAYER_NAMES[layer_s]
    category = layer_to_category(layer_num)

    # 匹配表格行：| `[Lx.NNN(-a)?]` | 内容 | 来源 |
    pattern = re.compile(
        r"\|\s*`\[L" + str(layer_num) + r"\.(\d+(?:-[a-z])?)\]`\s*\|\s*([^|]+?)\s*\|\s*([^|\n]*)\s*\|",
        re.MULTILINE,
    )

    for m in pattern.finditer(master_text):
        fact_num = m.group(1)
        content = m.group(2).strip()
        source = m.group(3).strip()

        # 去掉 markdown 格式
        content = re.sub(r"\*\*", "", content)
        content = re.sub(r"`([^`]+)`", r"\1", content)
        source = re.sub(r"\*\*", "", source)
        source = re.sub(r"`([^`]+)`", r"\1", source)

        # 生成唯一 id
        num_m = re.match(r"(\d+)(?:-([a-z]))?", fact_num)
        num_part = num_m.group(1).zfill(3)
        letter_part = (num_m.group(2) or "").upper()
        article_id = f"L{layer_num}-FACT-{num_part}{letter_part}"

        title = f"L{layer_num}.{fact_num} {content[:70]}{'…' if len(content) > 70 else ''}"
        summary = content[:200]

        # 提取 fields
        fields = {}
        field_pattern = re.compile(r"[\u4e00-\u9fa5A-Za-z0-9/() ]+[：:][^\u3001\uff0c；;，。\n]+")
        for fm in field_pattern.findall(content):
            colon_pos = -1
            for i, ch in enumerate(fm):
                if ch in "：:":
                    colon_pos = i
                    break
            if 0 < colon_pos < 20:
                key = fm[:colon_pos].strip()
                val = fm[colon_pos + 1:].strip()[:80]
                if key and val:
                    fields[key] = val
        if not fields:
            fields["事实编号"] = f"L{layer_num}.{fact_num}"
            fields["来源文档"] = source or status["source"]

        # 找依赖说明
        dep_pat = re.compile(
            r"###\s*L" + str(layer_num) + r"\s*[·\s\S]*?\*\*依赖\*\*\s*[：:]\s*([^\n]+)",
            re.IGNORECASE,
        )
        dep_m = dep_pat.search(master_text)
        if dep_m:
            derivation = f"依赖：{dep_m.group(1).strip()}。\n严格由上层接口事实与CDD公理推导，TIER状态见左侧Canon徽标。"
        else:
            derivation = "严格由上层接口事实与CDD公理推导，TIER状态见左侧Canon徽标。"

        article = {
            "id": article_id,
            "slug": slugify(article_id),
            "type": "concept",
            "category": category,
            "title": title,
            "aliases": [],
            "canonTier": status["canonTier"],
            "canonStatusRaw": status["canonStatusRaw"],
            "summary": summary,
            "fields": fields,
            "body": [
                {"heading": "接口事实（Interface Fact）", "text": content},
                {"heading": "来源（Source）", "text": source or status["source"]},
                {"heading": "CDD 推导说明", "text": derivation},
            ],
            "related": [f"OVERVIEW-L{layer_num}"],
            "sources": [{
                "ref": "CDD_World_Master.md v1.9",
                "section": layer_name,
                "canonicality": status["canonTier"],
            }],
        }
        fact_articles.append(article)

print(f"  解析出 {len(fact_articles)} 条接口事实")
added_facts = sum(1 for a in fact_articles if add_article_if_not_exists(a))
print(f"  新增接口事实：{added_facts}，跳过：{len(fact_articles) - added_facts}")

# ============ 二、层级总览页 OVERVIEW-Lx ============
print("\n========== 二、层级总览页 ==========")
added_overviews = 0
overview_related_map = {}
for layer_num in range(1, 18):
    layer_s = str(layer_num)
    layer_name = LAYER_NAMES[layer_s]
    status = LAYER_STATUS[layer_s]
    category = layer_to_category(layer_num)
    ov_id = f"OVERVIEW-L{layer_num}"

    # 提取节
    section_pat = re.compile(
        r"###\s*L" + str(layer_num) + r"\s*[·\s\S]*?(?=###\s*L\d|#\s*第[一二三]章|$)",
        re.IGNORECASE,
    )
    sec_m = section_pat.search(master_text)
    section_text = sec_m.group(0) if sec_m else ""

    dep_m = re.search(r"\*\*依赖\*\*[：:]\s*([^\n]+)", section_text)
    core_m = re.search(r"\*\*核心任务\*\*[：:]\s*\n([\s\S]*?)(?:\n\*\*|\n---)", section_text)

    op_list = sorted(set(re.findall(r"OP-L" + str(layer_num) + r"-\d+", section_text)))
    # 张力
    tension_list = []
    ten_pat = re.compile(r"张力L" + str(layer_num) + r"-([A-Z])")
    for tm in ten_pat.finditer(section_text):
        tension_list.append(f"TENSION-L{layer_num}-{tm.group(1)}")
    if layer_num == 2:
        for letter in ["A", "B", "C", "D"]:
            if re.search(r"\*\*张力" + letter + r"\*\*", section_text) and f"TENSION-L2-{letter}" not in tension_list:
                tension_list.append(f"TENSION-L2-{letter}")

    # PAT 候选
    pat_list = []
    pat_pat = re.compile(r"(PAT-候选-\d+)\s*[「\"]([^」\"]+)[」\"]")
    for pm in pat_pat.finditer(section_text):
        pat_list.append(f"{pm.group(1)} {pm.group(2)}")

    summary = f"{layer_name} · 状态：{status['canonStatusRaw']} · 文档编号 {status['source']}"

    body = []
    body.append({"heading": "层级状态", "text": f"{status['canonStatusRaw']} · 文档编号 {status['source']}"})
    if dep_m:
        body.append({"heading": "依赖事实", "text": dep_m.group(1).strip()})
    if core_m:
        txt = re.sub(r"^\s*[•\-]\s*", "· ", core_m.group(1), flags=re.MULTILINE).strip()
        body.append({"heading": "核心任务", "text": txt})
    if op_list:
        body.append({"heading": "开放问题列表", "list": op_list})
    if tension_list:
        body.append({"heading": "已知张力列表", "list": tension_list})
    if pat_list:
        body.append({"heading": "历史模式候选", "list": pat_list})

    cat_ov = category
    if layer_num == 1 and category == "science":
        cat_ov = "world"
    overview_article = {
        "id": ov_id,
        "slug": slugify(ov_id),
        "type": "concept",
        "category": cat_ov,
        "title": layer_name,
        "aliases": [],
        "canonTier": status["canonTier"],
        "canonStatusRaw": status["canonStatusRaw"],
        "summary": summary,
        "fields": {
            "层级编号": f"L{layer_num}",
            "文档编号": status["source"],
            "Canon Tier": status["canonTier"],
        },
        "body": body,
        "related": [],
        "sources": [{
            "ref": "CDD_World_Master.md v1.9",
            "section": layer_name,
            "canonicality": status["canonTier"],
        }],
    }

    if add_article_if_not_exists(overview_article):
        added_overviews += 1

# 回填 OVERVIEW 的 related（同层事实卡片）
for a in new_articles:
    m = re.match(r"^L(\d+)-FACT-", a["id"])
    if m:
        ov_id = f"OVERVIEW-L{m.group(1)}"
        overview_related_map.setdefault(ov_id, []).append(a["id"])
for a in new_articles:
    if a["id"].startswith("OVERVIEW-L"):
        fact_ids = overview_related_map.get(a["id"], [])
        a["related"] = sorted(set(a["related"] + fact_ids))

print(f"  新增层级总览页：{added_overviews}")

# ============ 三、收官陈述 OVERVIEW-MASTER-CLOSURE ============
print("\n========== 三、世界观收官陈述 ==========")
closure_m = re.search(r"\*\*世界观收官陈述\*\*[：:]\s*\n([\s\S]*?)\n\*\*遗留问题处理状态", master_text)
supp_m = re.search(r"\*\*遗留问题处理状态（SUPP-001 v1\.0，已更新）\*\*[：:]\s*\n([\s\S]*?)(?=\n\*\*已知张力|\n---)", master_text)
closure_ten_m = re.search(r"\*\*已知张力（本层新增，属全局性质）\*\*[：:]\s*\n([\s\S]*?)(?=\n---|$)", master_text)

closure_text_parts = []
if closure_m:
    closure_text_parts.append("【世界观收官陈述】\n" + closure_m.group(1).strip())
if supp_m:
    closure_text_parts.append("【遗留问题处理状态（SUPP-001 v1.0 已更新）】\n" + supp_m.group(1).strip())
if closure_ten_m:
    closure_text_parts.append("【全局张力（L17-A/B）】\n" + closure_ten_m.group(1).strip())
closure_text_full = "\n\n".join(closure_text_parts)

closure_article = {
    "id": "OVERVIEW-MASTER-CLOSURE",
    "slug": "overview-master-closure",
    "type": "concept",
    "category": "concept",
    "title": "世界观收官陈述与闭环",
    "aliases": ["收官陈述", "Master Closure", "SUPP-001"],
    "canonTier": "TIER 3",
    "canonStatusRaw": "TIER 3 已完成（SUPP-001 v1.0 补完）",
    "summary": "CDD 世界观从 L0 四条物理公理到 L17 当代世界的完整闭环，含 SUPP-001 遗留问题处理与全局张力。",
    "fields": {
        "对应文档": "SUPP-001 v1.0",
        "章节位置": "Master 第 831 行起 + L17 层末",
    },
    "body": [
        {"heading": "世界观收官陈述", "text": closure_m.group(1).strip() if closure_m else "（原文未提取到）"},
        {"heading": "遗留问题处理状态", "text": supp_m.group(1).strip() if supp_m else "（原文未提取到）"},
        {"heading": "全局张力（L17-A / L17-B）", "text": closure_ten_m.group(1).strip() if closure_ten_m else "（原文未提取到）"},
    ],
    "related": ["OVERVIEW-L17", "OP-L13-001"],
    "sources": [{
        "ref": "CDD_World_Master.md v1.9",
        "section": "世界观收官陈述 + SUPP-001 v1.0",
        "canonicality": "TIER 3",
    }],
}
added_closure = 1 if add_article_if_not_exists(closure_article) else 0
print(f"  新增收官陈述：{added_closure}")

# ============ 四、PAT 历史模式 ============
print("\n========== 四、PAT 历史模式 ==========")
added_pats = 0
PAT_DEFS = [
    {
        "id": "PAT-S01",
        "title": "PAT-S01 凝核帝国",
        "category": "history",
        "description": "「凝核帝国」：控制高Φ区域的帝国内聚力极强，平均寿命是普通帝国的3倍。稳定态。",
        "body": [
            {"heading": "模式类型", "text": "稳定态（文明长期维持的结构）"},
            {"heading": "定义与规律", "text": "控制高Φ区域的帝国内聚力极强，平均寿命是普通帝国的3倍。高Φ区域对应 L2.005 四类高Φ文明候选区——古老克拉通核、碰撞造山前缘带、热液火山岛弧带、古海盆边缘台地。"},
            {"heading": "CDD 物理依据", "text": "由 L-2 凝化方程正反馈导出：高Φ区域的组织化趋势远高于周边，使得控制该区域的权力中心更难被外部瓦解，内部分裂成本更高。"},
            {"heading": "历史实例", "text": "泛阿斯兰第二帝国（L11）控制双河平原-凝脊山口高Φ带，是疆域最大的前现代帝国；双河大一统王朝同样依托双河平原高Φ印记区。"},
        ],
    },
    {
        "id": "PAT-O01",
        "title": "PAT-O01 凝散周期",
        "category": "history",
        "description": "「凝散周期」：文明过度消耗周边Φ → 崩溃 → 环境Φ恢复 → 新文明兴起（周期约800年）。振荡态。",
        "body": [
            {"heading": "模式类型", "text": "振荡态（循环历史规律）"},
            {"heading": "定义与规律", "text": "文明过度消耗周边Φ → 崩溃 → 环境Φ恢复 → 新文明兴起，周期约 800 年。这是 L-3 散化趋势在文明尺度的体现。"},
            {"heading": "CDD 物理依据", "text": "L-3 散化趋势公理 + L11.002 维罗矿脉枯竭危机。开采速率超过局部Φ自然补充速率，矿藏“枯竭”不仅是物理耗尽，更是局部凝度场无法维持高浓度矿化状态的表现。"},
            {"heading": "历史实例", "text": "维罗联合矿权的「北缘矿脉枯竭危机」（约3300年前起）导致帝国最终于约3000年前分裂；随后的维罗合众国「限量开采配额制」是对凝散周期的制度性应对。"},
        ],
    },
    {
        "id": "PAT-G01",
        "title": "PAT-G01 宗教滑翔机",
        "category": "society",
        "description": "「宗教滑翔机」：凝迹遗址附近产生的宗教体系沿贸易路线传播。滑翔机（扩散现象）。",
        "body": [
            {"heading": "模式类型", "text": "滑翔机（扩散现象）"},
            {"heading": "定义与规律", "text": "凝迹遗址附近产生的宗教体系沿贸易路线传播。凝迹遗址（L8）提供物理上可探测的Φ异常，强化了宗教体验的“真实性”；贸易路线（L9 早期贸易网络、L11-L12 中央海贸易航线）则是扩散媒介。"},
            {"heading": "CDD 物理依据", "text": "L8.003 凝迹强度公式 + L9.003 早期宗教的核心信仰均围绕 CDD 现象的朴素描述展开。"},
            {"heading": "历史实例", "text": "诺弧高原「凝散不二论」（L9.003）从岩棚壁画符号系统起步，在 L11 被双河大一统王朝吸收为国教「凝统正道」，在 L12-L13 完成哲学-伦理学现代转型，最终在 L17 成为 AI 伦理审计的主导框架。"},
        ],
    },
    {
        "id": "PAT-C01",
        "title": "PAT-C01 凝核碰撞",
        "category": "history",
        "description": "「凝核碰撞」：两个凝核帝国相遇时，边界Φ争夺导致标志性的「凝界战争」模式。碰撞类。",
        "body": [
            {"heading": "模式类型", "text": "碰撞（不同模式的相互作用）"},
            {"heading": "定义与规律", "text": "两个凝核帝国相遇时，边界Φ争夺导致标志性的「凝界战争」模式。双方都依托高Φ区域作为权力根基，而边界地带往往也是Φ梯度最陡峭的区域。"},
            {"heading": "CDD 物理依据", "text": "L-2 凝化方程正反馈 + L-3 散化趋势。两个高凝度中心相遇，中间地带被双方「抽走」Φ，造成局部Φ真空（散化），迫使双方不断投入更多资源。"},
            {"heading": "历史实例", "text": "双河大一统王朝与维罗联合矿权的「凝晶资源战争」（L11.002，约4000年前）——两大凝核帝国的Φ边界之争，最终以调停+贸易协定告终。"},
        ],
    },
    {
        "id": "PAT-候选-001",
        "title": "PAT-候选-001 深压凝核",
        "category": "science",
        "description": "「深压凝核」模式：高压深海环境通过凝力优势抑制散化，使热液喷口Φ峰值维持时间远超浅海。OCE-001步骤3，直接由CDD L-3导出。",
        "body": [
            {"heading": "候选登记来源", "text": "L4 海洋学（OCE-001 v1.0 步骤3）——原创 CDD 推论，无现实物理类比"},
            {"heading": "模式定义", "text": "高压深海环境通过凝力优势抑制散化，使热液喷口的Φ峰值维持时间远超浅海同等Φ梯度区域。深海热液区是全球Φ密度最高的持续性自然结构之一，是生命起源的物理优先场所。"},
            {"heading": "CDD 物理依据", "text": "CDD L-3（散化趋势公理）逆向应用——高压环境中，外部压力等效于额外的凝力分量，散化趋势被显著压制。"},
            {"heading": "下游影响", "text": "L4.002 深海高Φ区三候选均依托此模式；L5.004 生命起源地点排序（中央海中脊热液喷口群为第一候选）由此模式推导。"},
        ],
    },
    {
        "id": "PAT-候选-002",
        "title": "PAT-候选-002 Φ光合双天线",
        "category": "science",
        "description": "「Φ光合双天线」：表层自养生物演化出光子+Φ波双通道天线，更高能量采集效率。来源：L5步骤6，无现实类比。",
        "body": [
            {"heading": "候选登记来源", "text": "L5 生物化学与生命起源（L5-BIO-001 v1.1 步骤6）——现实无类比"},
            {"heading": "模式定义", "text": "星体输出热辐射与Φ波 → 表层自养生物演化出光子+Φ波双通道天线 → 更高能量采集效率 → 成为生物圈主要初级生产者。"},
            {"heading": "CDD 物理依据", "text": "联合推导：L1.001（母恒星持续发出强烈Φ波）+ L1.006（Φ波在真空中以光速传播）+ L3.004（Φ波大气衰减工作模型，部分Φ波可到达生物圈）。"},
            {"heading": "下游影响", "text": "L5.005 光合作用等价机制（Φ光合）；L6.002 生态系统Φ流动图（Φ源→初级汲取者的第一通道）。"},
        ],
    },
]

for pat in PAT_DEFS:
    article = {
        "id": pat["id"],
        "slug": slugify(pat["id"]),
        "type": "concept",
        "category": pat["category"],
        "title": pat["title"],
        "aliases": [],
        "canonTier": "TIER 3",
        "canonStatusRaw": "TIER 3 历史模式（Pattern）登记条目",
        "summary": pat["description"],
        "fields": {
            "模式编号": pat["id"],
            "模式类型": pat["body"][0]["text"] if pat["body"] else "历史模式",
            "登记来源": "CDD_World_Master.md §3.5 历史模式目录 + 各层候选登记",
        },
        "body": pat["body"],
        "related": [],
        "sources": [{
            "ref": "CDD_World_Master.md v1.9",
            "section": "§3.5 历史模式目录",
            "canonicality": "TIER 3",
        }],
    }
    if add_article_if_not_exists(article):
        added_pats += 1
print(f"  新增 PAT 历史模式：{added_pats}")

# ============ 五、协作规则系统 WORKFLOW-RULES ============
print("\n========== 五、协作规则系统 ==========")
workflow_article = {
    "id": "WORKFLOW-RULES",
    "slug": "workflow-rules",
    "type": "concept",
    "category": "concept",
    "title": "协作规则系统（CDD Worldbuilding Workflow）",
    "aliases": ["协作规则", "Workflow Rules", "3.1-3.5"],
    "canonTier": "TIER 0",
    "canonStatusRaw": "MASTER CANON · 协作元规则（第三章）",
    "summary": "Master 第三章完整协作规则系统：3.1事实三个层级（TIER 1/2/3）、3.2贡献文档标准格式、3.3验证四项检验、3.4开放问题注册表、3.5历史模式目录。",
    "fields": {
        "章节": "第三章 协作规则系统（§3.1–§3.5）",
        "规则性质": "元规则 · 对所有域具有约束力",
    },
    "body": [
        {"heading": "3.1 事实的三个层级", "text": "TIER 1（公理层，绝对不可修改）：CDD 四条定律 + 两种力 + Φ波 + 凝迹效应。\nTIER 2（推导层，可验证，有完整推导链）：从公理严格推导出的世界事实，每条事实必须附有完整推导链。\nTIER 3（外推层，创作性，须标注）：符合世界逻辑但尚无严格推导的内容，可被升格为 TIER 2。"},
        {"heading": "3.2 贡献文档标准格式", "text": "每一份新内容贡献必须包含：\n① 文档编号（域代码-序号）、域、版本、层级、状态\n② § 导入事实（Imports）\n③ § 推导链（Derivation），按步骤编号逻辑推导\n④ § 输出事实（Exports）\n⑤ § 开放问题（Open Questions）\n⑥ § 已知张力（Conflicts）"},
        {"heading": "3.3 验证四项检验", "text": "检验1 公理一致性：与 CDD 四条定律无矛盾，不违反质守恒。\n检验2 接口完整性：所有 Import 是否有已验证的来源文档。\n检验3 推导链完整性：每个步骤是否有逻辑依据。\n检验4 无循环依赖：不得形成 A 依赖 B、B 依赖 A。\n通过全部四项 → 升格为 TIER 2。"},
        {"heading": "3.4 开放问题注册表（★★★ 四项最高优先级）", "text": "★★★（阻断多个下游域）：\nOP-001 智慧种族Φ感知 → ✅ 已作答（L7.002 凝核环）\nOP-002 凝晶矿加工为Φ场放大器 → 未闭合\nOP-003 第一批语言共同祖先 → 未闭合\nOP-004 智慧种族数量 → ✅ 已解决（潮语者 L6.005）\n\n★★：OP-007 CDD发现时间（✅已解决 L12.003）、OP-011 凝迹最大持续时间、OP-015 深海/陆地独立起源（✅已解决 L5.004-b）\n★：OP-031 反凝化生物（✅已解决 L6.006）、OP-044 Φ波通信、OP-052 AI核心区Φ实测（✅零日凝峰 L13.004）"},
        {"heading": "3.5 历史模式目录（Pattern Library）", "text": "稳定态：PAT-S01 凝核帝国\n振荡态：PAT-O01 凝散周期（约800年）\n滑翔机：PAT-G01 宗教滑翔机\n碰撞：PAT-C01 凝核碰撞\n候选：PAT-候选-001 深压凝核（L4）、PAT-候选-002 Φ光合双天线（L5）"},
    ],
    "related": ["AI-WORKFLOW-TEMPLATE", "PAT-S01", "PAT-O01", "PAT-G01", "PAT-C01"],
    "sources": [{
        "ref": "CDD_World_Master.md v1.9",
        "section": "第三章 协作规则系统（§3.1–§3.5）",
        "canonicality": "TIER 0",
    }],
}
added_workflow = 1 if add_article_if_not_exists(workflow_article) else 0
print(f"  新增协作规则系统：{added_workflow}")

# ============ 六、AI 工作指令模板 AI-WORKFLOW-TEMPLATE ============
print("\n========== 六、AI 工作指令模板 ==========")
ai_workflow_article = {
    "id": "AI-WORKFLOW-TEMPLATE",
    "slug": "ai-workflow-template",
    "type": "concept",
    "category": "concept",
    "title": "AI 工作指令模板（第四章）",
    "aliases": ["AI工作模板", "第四章", "工作指令"],
    "canonTier": "TIER 0",
    "canonStatusRaw": "MASTER CANON · AI 工作元规则（第四章）",
    "summary": "Master 第四章给 AI 的工作指令模板：4.1 接取任务标准流程 + 4.2 常用指令示例（启动新域、接取OP、延伸创作、一致性检验）。",
    "fields": {
        "章节": "第四章 给 AI 的工作指令模板（§4.1–§4.2）",
        "适用对象": "所有参与 CDD 世界观构建的 AI Agent",
    },
    "body": [
        {"heading": "4.1 接取任务标准流程", "text": "1. 阅读第一章（CDD 四条公理），完全理解物理规则。\n2. 阅读自己负责的层级说明（第二章对应小节）。\n3. 检查该层级的「依赖」列表，确认所需的上游事实。\n4. 按第三章贡献文档标准格式进行推导与创作。\n5. 在输出末尾，列出本次工作新产生的「开放问题」。"},
        {"heading": "4.2 常用指令示例 · 启动新域", "text": "「你负责 [L1 宇宙学与恒星系]。请阅读第一章的 CDD 物理公理，然后完成 L1 节列出的全部任务，按贡献文档格式输出，并列出所有开放问题。」"},
        {"heading": "4.2 常用指令示例 · 接取一个开放问题", "text": "「请接取 OP-001（智慧种族是否具有Φ直接感知能力），基于 CDD 公理和 [L5.001-003][L7.001] 进行推导，输出结论，并更新 L7.002 接口事实。」"},
        {"heading": "4.2 常用指令示例 · 延伸创作", "text": "「基于已有的 [L9.001-003] 和 [L16.001]，为本世界最古老的文明设计一套完整的宗教体系，要求教义能被解释为对 CDD 现象的朴素描述。标注为 TIER 3。」"},
        {"heading": "4.2 常用指令示例 · 一致性检验", "text": "「请检验以下内容与 CDD 公理是否存在矛盾：[粘贴内容]。如有矛盾，指出具体冲突并提出修改方案。」"},
    ],
    "related": ["WORKFLOW-RULES", "OVERVIEW-MASTER-CLOSURE"],
    "sources": [{
        "ref": "CDD_World_Master.md v1.9",
        "section": "第四章 给 AI 的工作指令模板（§4.1–§4.2）",
        "canonicality": "TIER 0",
    }],
}
added_ai_workflow = 1 if add_article_if_not_exists(ai_workflow_article) else 0
print(f"  新增 AI 工作指令模板：{added_ai_workflow}")

# ============ 七、开放问题提取 ============
print("\n========== 七、开放问题提取 ==========")
added_ops = 0

def clean_question(raw: str) -> str:
    """去掉 markdown 格式，清理前缀"""
    q = raw.strip()
    q = re.sub(r"^[-–—]\s*", "", q)
    q = re.sub(r"^~~|~~$", "", q)
    q = re.sub(r"`([^`]+)`", r"\1", q)
    q = re.sub(r"\*\*✅已解决\*\*.*$", "", q)
    q = re.sub(r"✅已解决.*$", "", q)
    return q.strip()

for layer_num in range(1, 18):
    layer_name = LAYER_NAMES[str(layer_num)]
    # 更宽松正则，匹配 - `OP-Lx-xxx` 或 - OP-Lx-xxx 或 ~~删除线~~
    line_pat = re.compile(
        r"-?\s*(?:~~)?`?(OP-L" + str(layer_num) + r"-\d+)`?(?:~~)?\s*([^\n]+)",
        re.MULTILINE,
    )
    seen_in_layer = set()
    for m in line_pat.finditer(master_text):
        op_id = m.group(1)
        if op_id in seen_in_layer:
            continue
        seen_in_layer.add(op_id)
        raw_content = m.group(2).strip()

        # 判断是否解决（✅）
        is_resolved = "✅已解决" in raw_content or "【已解决" in raw_content
        rm = re.search(r"✅已解决[（(]([^）)]+)[）)]", raw_content)
        resolved_note = rm.group(1) if rm else ""

        question = clean_question(raw_content)
        # 提取 assignedDomain
        assigned_domain = "UNASSIGNED"
        ad_m = re.search(r"[→>]\s*交\s*L?(\d+)", question)
        if ad_m:
            assigned_domain = f"L{ad_m.group(1)}"
        else:
            ad_m2 = re.search(r"交\s*L(\d+)", question, re.IGNORECASE)
            if ad_m2:
                assigned_domain = f"L{ad_m2.group(1)}"

        if is_resolved and resolved_note:
            question = f"{question} 【✅已解决：{resolved_note}】"

        op = {
            "id": op_id,
            "question": question,
            "layer": layer_name,
            "status": "RESOLVED" if is_resolved else "OPEN",
            "assignedDomain": assigned_domain,
            "canonImpact": "TIER 3 IMPACT",
            "relatedArticles": [f"OVERVIEW-L{layer_num}"],
            "isCanonicalMystery": (op_id == "OP-L13-001"),
        }
        if add_op_if_not_exists(op):
            added_ops += 1

# 老编号 OP-001 ~ OP-004 及 3.4 节其他老编号
LEGACY_OPS = [
    {"id": "OP-001", "question": "智慧种族是否具有Φ直接感知能力？→ 影响：L7/L16/L14 【✅已解决：L7.002 凝核环机制，有限局部分布式感知】",
     "layer": "L7 · 智慧种族生物学", "status": "RESOLVED", "assignedDomain": "L7", "canonImpact": "TIER 2 IMPACT",
     "relatedArticles": ["L7-FACT-002", "OVERVIEW-L7"], "isCanonicalMystery": False},
    {"id": "OP-002", "question": "凝晶矿是否可以被加工为Φ场放大器？→ 影响：L12/L13/L15",
     "layer": "L2 · 行星地质与矿藏 / L12 工业化", "status": "OPEN", "assignedDomain": "L12", "canonImpact": "TIER 2 IMPACT",
     "relatedArticles": ["L2-FACT-003A", "OVERVIEW-L2", "OVERVIEW-L12"], "isCanonicalMystery": False},
    {"id": "OP-003", "question": "第一批语言是否存在共同祖先？→ 影响：L14/L9",
     "layer": "L14 · 语言与文字系统 / L9 古代史", "status": "OPEN", "assignedDomain": "L14", "canonImpact": "TIER 2 IMPACT",
     "relatedArticles": ["L14-FACT-001", "OVERVIEW-L14", "OVERVIEW-L9"], "isCanonicalMystery": False},
    {"id": "OP-004", "question": "这个世界有几个智慧种族？→ 影响：L6/L7/L8起全部 【✅已解决：确认第二智慧种族「潮语者」L6.005，零级联修订】",
     "layer": "L6 · 生态系统与演化 / L7 智慧种族生物学", "status": "RESOLVED", "assignedDomain": "L6", "canonImpact": "TIER 2 IMPACT",
     "relatedArticles": ["L6-FACT-005", "L7-FACT-005", "OVERVIEW-L6", "OVERVIEW-L7"], "isCanonicalMystery": False},
    {"id": "OP-007", "question": "CDD理论在世界内是何时被科学界发现的？ 【✅已解决：L12.003，约300年前猜想→250年前凝度场假说→180年前CDD确立→120年前凝迹效应验证】",
     "layer": "L12 · 近代史 / 工业化时代", "status": "RESOLVED", "assignedDomain": "L12", "canonImpact": "TIER 3 IMPACT",
     "relatedArticles": ["L12-FACT-003", "OVERVIEW-L12"], "isCanonicalMystery": False},
    {"id": "OP-011", "question": "凝迹效应的最大持续时间上限是多少？",
     "layer": "L8 · 史前史与考古 / L0 物理", "status": "OPEN", "assignedDomain": "L8", "canonImpact": "TIER 3 IMPACT",
     "relatedArticles": ["L8-FACT-003", "OVERVIEW-L8"], "isCanonicalMystery": False},
    {"id": "OP-015", "question": "深海生命与陆地生命是否有独立起源？ 【✅已解决：L5.004-b 确认南环海独立第二起源，收敛而非同源】",
     "layer": "L5 · 生物化学与生命起源 / L4 海洋学", "status": "RESOLVED", "assignedDomain": "L5", "canonImpact": "TIER 3 IMPACT",
     "relatedArticles": ["L5-FACT-004B", "OVERVIEW-L5", "OVERVIEW-L4"], "isCanonicalMystery": False},
    {"id": "OP-031", "question": "是否存在「反凝化生物」——主动提升环境散度的生命形态？ 【✅已解决：散极生物 L6.006】",
     "layer": "L6 · 生态系统与演化", "status": "RESOLVED", "assignedDomain": "L6", "canonImpact": "TIER 3 IMPACT",
     "relatedArticles": ["L6-FACT-006", "OVERVIEW-L6"], "isCanonicalMystery": False},
    {"id": "OP-044", "question": "能否利用Φ波进行跨大陆实时通信？",
     "layer": "L1 · 宇宙学与恒星系 / L13 AI临界事件", "status": "OPEN", "assignedDomain": "L13", "canonImpact": "TIER 3 IMPACT",
     "relatedArticles": ["L1-FACT-006", "OVERVIEW-L1", "OVERVIEW-L13"], "isCanonicalMystery": False},
    {"id": "OP-052", "question": "AI系统运行时，其核心区域的Φ值是否可以实测？ 【✅已解决：L13.004「零日凝峰」事件，三重实证，Φ异常可测】",
     "layer": "L13 · AI 临界事件", "status": "RESOLVED", "assignedDomain": "L13", "canonImpact": "TIER 2 IMPACT",
     "relatedArticles": ["L13-FACT-004", "OVERVIEW-L13"], "isCanonicalMystery": False},
    {"id": "OP-L1-NEW-001", "question": "P3自转周期是多少？ 【✅已解决：SUPP-001 L1.002-c，约30.4小时】",
     "layer": "L1 · 宇宙学与恒星系", "status": "RESOLVED", "assignedDomain": "L1", "canonImpact": "TIER 2 IMPACT",
     "relatedArticles": ["L1-FACT-002C", "OVERVIEW-L1", "OVERVIEW-L3", "OVERVIEW-L4"], "isCanonicalMystery": False},
]
for op in LEGACY_OPS:
    if add_op_if_not_exists(op):
        added_ops += 1

print(f"  新增开放问题：{added_ops}")

# ============ 八、已知张力 ============
print("\n========== 八、已知张力提取 ==========")
added_conflicts = 0
TENSIONS = [
    {"id": "TENSION-L2-A", "title": "张力L2-A：板块活动强 vs 大范围宜居气候带",
     "description": "板块活动强→大陆边缘破碎→L3需确认是否仍能形成大范围宜居气候带。L2 文档自报张力。",
     "involvedHistory": ["L2 · 行星地质与矿藏", "L3 · 大气与气候"],
     "originalSources": ["L2-GEO-001 v1.0"]},
    {"id": "TENSION-L2-B", "title": "张力L2-B：凝晶矿高稳定性 vs 化学可加工性",
     "description": "凝晶矿晶格异常稳定→L5/L12需确认化学可加工性。",
     "involvedHistory": ["L2 · 行星地质与矿藏", "L5 · 生物化学", "L12 · 近代史"],
     "originalSources": ["L2-GEO-001 v1.0"]},
    {"id": "TENSION-L2-C", "title": "张力L2-C：「第四纪」命名与现实地质用语冲突",
     "description": "「第四纪」命名与现实地质用语冲突（现实指最近260万年），建议后续版本重命名。",
     "involvedHistory": ["L2 · 行星地质与矿藏"],
     "originalSources": ["L2-GEO-001 v1.0（审核新增）"]},
    {"id": "TENSION-L2-D", "title": "张力L2-D：超大陆不稳定结论偏定性，潮汐阈值未量化",
     "description": "超大陆不稳定的结论偏定性，未量化潮汐阈值，建议 OP-L2-003 解决后补充。",
     "involvedHistory": ["L2 · 行星地质与矿藏", "L3 · 大气与气候", "L4 · 海洋学"],
     "originalSources": ["L2-GEO-001 v1.0（审核新增）"]},
    {"id": "TENSION-L3-A", "title": "张力L3-A：板块破碎化 vs 连续气候带",
     "description": "板块破碎化可能削弱大范围连续气候带，采用「主带连续+区域碎片化」双层结构应对。",
     "involvedHistory": ["L3 · 大气与气候", "L2 · 行星地质与矿藏"],
     "originalSources": ["L3-ATM-001 v1.0"]},
    {"id": "TENSION-L3-B", "title": "张力L3-B：高Φ地带 vs 气候宜居带的不总重合",
     "description": "「高Φ地带」与「气候宜居带」不总重合，只在特定地形与湿度窗口内同时成立。",
     "involvedHistory": ["L3 · 大气与气候", "L2 · 行星地质与矿藏"],
     "originalSources": ["L3-ATM-001 v1.0"]},
    {"id": "TENSION-L3-C", "title": "张力L3-C：P3自转周期未确定导致气候带纬度估算（已部分解决）",
     "description": "L3.001气候带纬度界限隐式假设P3自转接近地球。【部分解决：P3自转30.4h已定，L3.001表已同步修订】",
     "involvedHistory": ["L3 · 大气与气候", "L1 · 宇宙学与恒星系"],
     "originalSources": ["L3-ATM-001 v1.0（审核新增）", "SUPP-001 v1.0"]},
    {"id": "TENSION-L3-D", "title": "张力L3-D：Φ含义双重性（大气透过率 vs 地质印记）",
     "description": "Φ含义双重性——大气Φ透过率（L3）≠ 地质Φ印记（L2），下游层须明确区分。",
     "involvedHistory": ["L3 · 大气与气候", "L2", "L5", "L6"],
     "originalSources": ["L3-ATM-001 v1.0（审核新增）"]},
    {"id": "TENSION-L4-A", "title": "张力L4-A：海洋环流精细结构依赖P3自转周期（已部分解决）",
     "description": "【部分解决：P3自转30.4h已定，Rossby变形半径增大约27%，三大洋环流尺度略大于地球；具体路径仍待定量化】",
     "involvedHistory": ["L4 · 海洋学", "L1 · 宇宙学与恒星系"],
     "originalSources": ["OCE-001 v1.0", "SUPP-001 v1.0"]},
    {"id": "TENSION-L4-B", "title": "张力L4-B：南环海强潮汐 vs 局部生态稳定性",
     "description": "南环海强潮汐若过强可能压低局部生态稳定性；但高营养盐+高Φ泵送同时构成生命与文明的高潜力起点。",
     "involvedHistory": ["L4 · 海洋学", "L5 · 生物化学", "L6 · 生态系统与演化", "L8 · 史前史与考古"],
     "originalSources": ["OCE-001 v1.0"]},
    {"id": "TENSION-L4-C", "title": "张力L4-C：洋盆深度估算未引用g=1.08修正",
     "description": "洋盆深度估算未引用[L1.002-b] g=1.08修正，偏差量级约8%。",
     "involvedHistory": ["L4 · 海洋学", "L1 · 宇宙学与恒星系"],
     "originalSources": ["OCE-001 v1.0（审核新增）"]},
    {"id": "TENSION-L5-A", "title": "张力L5-A：深海热液→浅海→陆地过渡机制",
     "description": "深海热液起源须由 L6 证明能稳定过渡到浅海/潮滩/陆地生态。",
     "involvedHistory": ["L5", "L6", "L8"],
     "originalSources": ["L5-BIO-001 v1.1"]},
    {"id": "TENSION-L5-B", "title": "张力L5-B：主起源点排序（中央海中脊 vs 南环海）",
     "description": "若南环海Φ泵送效率更高，主起源点排序需重新评估。",
     "involvedHistory": ["L5", "L4", "L6"],
     "originalSources": ["L5-BIO-001 v1.1"]},
    {"id": "TENSION-L5-C", "title": "张力L5-C：双层凝散膜推导补全后候选升格TIER 2",
     "description": "双层凝散膜（L5.003）若推导补全可申请升格 TIER 2。",
     "involvedHistory": ["L5"],
     "originalSources": ["L5-BIO-001 v1.1"]},
    {"id": "TENSION-L6-A", "title": "张力L6-A：深海→浅海→陆地过渡（继承L5-A）",
     "description": "深海热液→浅海→陆地过渡机制待 L7/L8 细化。",
     "involvedHistory": ["L6", "L5", "L7", "L8"],
     "originalSources": ["L6-ECO-001 v1.1"]},
    {"id": "TENSION-L6-B", "title": "张力L6-B：主起源点排序（继承L5-B）",
     "description": "南环海Φ泵送效率若更高，主起源点排序需重新评估。",
     "involvedHistory": ["L6", "L5", "L4"],
     "originalSources": ["L6-ECO-001 v1.1"]},
    {"id": "TENSION-L6-C", "title": "张力L6-C：Φ双重含义持续区分（继承L3-D）",
     "description": "Φ双重含义须下游持续区分。",
     "involvedHistory": ["L6", "L3"],
     "originalSources": ["L6-ECO-001 v1.1"]},
    {"id": "TENSION-L6-D", "title": "张力L6-D：生态繁荣 vs 过度利用临界张力",
     "description": "高Φ区同时是生态热点与文明热点，需区分「生态繁荣」与「过度利用」临界张力。",
     "involvedHistory": ["L6", "L9", "L15"],
     "originalSources": ["L6-ECO-001 v1.1"]},
    {"id": "TENSION-L6-E", "title": "张力L6-E：顶级凝化者强度参数窗口待OP-L6-002解决",
     "description": "顶级凝化者强度参数窗口待 OP-L6-002 解决。",
     "involvedHistory": ["L6", "L7"],
     "originalSources": ["L6-ECO-001 v1.1"]},
    {"id": "TENSION-L7-A", "title": "张力L7-A：重力数值来源统一引用L1.002-b",
     "description": "重力数值来源应统一引用 L1.002-b 而非 L2.001。",
     "involvedHistory": ["L7", "L1"],
     "originalSources": ["BIO-007 v1.1"]},
    {"id": "TENSION-L7-B", "title": "张力L7-B：Φ感知「弱、局部、分布式」定义",
     "description": "Φ感知定义为「弱、局部、低分辨率、分布式凝核环综合直觉」，与强感知版本存在差距。",
     "involvedHistory": ["L7", "L16"],
     "originalSources": ["BIO-007 v1.1"]},
    {"id": "TENSION-L7-C", "title": "张力L7-C：仅对主智慧种族建模（第二种族已确认）",
     "description": "本层仅对主智慧种族建模；【已确认第二智慧种族：潮语者（L6.005），谱系独立建模完成】",
     "involvedHistory": ["L7", "L6"],
     "originalSources": ["BIO-007 v1.1", "SUPP-001 v1.0"]},
    {"id": "TENSION-L8-A", "title": "张力L8-A：波次2/4依赖冰期陆桥数据，时间误差±5000年",
     "description": "波次2/4依赖冰期陆桥数据，L2未提供海面波动；时间误差±5000年。",
     "involvedHistory": ["L8", "L2", "L3"],
     "originalSources": ["L8-ARC-001 v1.0"]},
    {"id": "TENSION-L8-B", "title": "张力L8-B：铜石并用阶段自然铜来源充足性未验证",
     "description": "铜石并用阶段自然铜来源充足性未验证。",
     "involvedHistory": ["L8", "L2", "L15"],
     "originalSources": ["L8-ARC-001 v1.0"]},
    {"id": "TENSION-L8-C", "title": "张力L8-C：谱系分化时间类比地球语言演变速率",
     "description": "谱系分化时间基于地球语言演变速率类比；P3 年短可能导致 10–20% 误差。",
     "involvedHistory": ["L8", "L14"],
     "originalSources": ["L8-ARC-001 v1.0"]},
    {"id": "TENSION-L8-D", "title": "张力L8-D：南环海生命起源与陆地谱系上游连接",
     "description": "若 L5/L6 确认南环海生命起源与陆地谱系上游连接，起源地优先级排序可能反转。",
     "involvedHistory": ["L8", "L5", "L6"],
     "originalSources": ["L8-ARC-001 v1.0"]},
    {"id": "TENSION-L10-A", "title": "张力L10-A：凝脊山口具体海拔与宽度未量化",
     "description": "凝脊山口的具体海拔与宽度尚未量化，仅定性描述为「唯一低海拔通道」。",
     "involvedHistory": ["L10"],
     "originalSources": ["L10-GEO-001 v1.0"]},
    {"id": "TENSION-L9-A", "title": "张力L9-A：建国时间与谱系分化之间的1.3-4.5万年空白期",
     "description": "[L9.001] 五大文明建国（7000–5500年前）与 [L8.004] 谱系分化（6.5万–2万年前）之间存在 1.3–4.5 万年空白期。",
     "involvedHistory": ["L9", "L8"],
     "originalSources": ["L9-HIS-001 v1.0"]},
    {"id": "TENSION-L9-B", "title": "张力L9-B：维罗「技术最先进」定性判断未量化",
     "description": "维罗矿业王权「技术最先进」的定性判断依赖 [L2.003-a]，但具体产量与技术转化率未量化。",
     "involvedHistory": ["L9", "L2", "L12"],
     "originalSources": ["L9-HIS-001 v1.0"]},
    {"id": "TENSION-L11-A", "title": "张力L11-A：四大帝国疆域范围未与地图坐标精确对应",
     "description": "[L11.001] 四大帝国的疆域范围仅作定性描述，未与 [L10.001] 地图坐标精确对应。",
     "involvedHistory": ["L11", "L10"],
     "originalSources": ["L11-EMP-001 v1.0"]},
    {"id": "TENSION-L11-B", "title": "张力L11-B：凝晶矿枯竭机制未经L2地质层验证",
     "description": "凝晶矿「枯竭」机制（开采速率 > Φ补充速率）为原创推论，未经 L2 地质层验证 Φ 补充速率。",
     "involvedHistory": ["L11", "L2", "L15"],
     "originalSources": ["L11-EMP-001 v1.0"]},
    {"id": "TENSION-L12-A", "title": "张力L12-A：CDD理论发现时间线压缩",
     "description": "[L12.003] CDD 理论发现时间线（约300–120年前跨度180年）压缩了通常科学革命所需的更长时间尺度。",
     "involvedHistory": ["L12"],
     "originalSources": ["L12-IND-001 v1.0"]},
    {"id": "TENSION-L12-B", "title": "张力L12-B：区域政体形式与L16价值观未建因果",
     "description": "[L12.001] 五大区域体系的具体政体形式尚未与 [L16] 宗教哲学层的价值观演化建立明确因果关系。",
     "involvedHistory": ["L12", "L16"],
     "originalSources": ["L12-IND-001 v1.0"]},
    {"id": "TENSION-L13-A", "title": "张力L13-A：AI研发时间线压缩（P3历法换算校验）",
     "description": "[L13.001] AI 研发时间线压缩（约80年前半导体→约15年前通用AI，仅65年），需校验 P3 年历法换算是否充分应用。",
     "involvedHistory": ["L13", "L12", "L8"],
     "originalSources": ["L13-AGI-001 v1.0"]},
    {"id": "TENSION-L13-B", "title": "张力L13-B：「凝界公约」运作机制与L17的直接接口依赖",
     "description": "「凝界公约」作为全球治理框架的具体运作机制尚未细化，与 [L17] 当代世界有直接接口依赖。",
     "involvedHistory": ["L13", "L17"],
     "originalSources": ["L13-AGI-001 v1.0"]},
    {"id": "TENSION-L14-A", "title": "张力L14-A：4套文字系统具体字符样本未设计",
     "description": "4套独立/半独立文字系统的具体字符样本尚未设计，需美术/字体层面后续补充。",
     "involvedHistory": ["L14"],
     "originalSources": ["L14-LNG-001 v1.0"]},
    {"id": "TENSION-L15-A", "title": "张力L15-A：「资源诅咒」乐观化推论的制度脆弱性",
     "description": "本层「资源诅咒」叙事（维罗枯竭教训催生可持续制度）为乐观化推论，建议 L17 保留制度脆弱性张力，避免过度乌托邦化。",
     "involvedHistory": ["L15", "L17"],
     "originalSources": ["L15-ECO-001 v1.0"]},
    {"id": "TENSION-L16-A", "title": "张力L16-A：宗教哲学体系现代信众规模与地理分布未量化",
     "description": "四大宗教/哲学体系的现代信众规模、地理分布未量化，待 L17 细化。",
     "involvedHistory": ["L16", "L17"],
     "originalSources": ["L16-REL-001 v1.0"]},
    {"id": "TENSION-L16-B", "title": "张力L16-B：「科学兼容度决定存续能力」为社会学外推",
     "description": "[L16.004]「科学兼容度决定存续能力」为原创推论，属于社会学外推而非 CDD 物理直接推导。",
     "involvedHistory": ["L16"],
     "originalSources": ["L16-REL-001 v1.0"]},
    {"id": "TENSION-L17-A", "title": "张力L17-A：和平红利倾向 vs 微观叙事戏剧性需求",
     "description": "本世界历史进程呈现较强的「和平红利」倾向。建议后续创作者在地方性/个体性叙事层面引入更多冲突张力，避免宏观与微观的失衡。",
     "involvedHistory": ["L17", "L12", "L13", "L15"],
     "originalSources": ["L17-CUR-001 v1.0（全局张力）"]},
    {"id": "TENSION-L17-B", "title": "张力L17-B：第二智慧种族的级联修订风险（结构性不确定）",
     "description": "若后续确认存在更多智慧种族，将对 L8-L17 全部历史叙事产生级联式修订需求。【SUPP-001 已确认「潮语者」第二智慧种族，更多种族可能性仍保留】",
     "involvedHistory": ["L17", "L6", "L7", "L8-L17 全部历史层"],
     "originalSources": ["L17-CUR-001 v1.0（全局张力）", "SUPP-001 v1.0"]},
]

for t in TENSIONS:
    conflict = {
        "id": t["id"],
        "title": t["title"],
        "status": "PENDING RESOLUTION",
        "description": t["description"],
        "involvedEvents": [],
        "involvedHistory": t["involvedHistory"],
        "originalSources": t["originalSources"],
        "interpretations": [],
    }
    if add_conflict_if_not_exists(conflict):
        added_conflicts += 1
print(f"  新增已知张力：{added_conflicts}")

# ============ 九、时间线 ============
print("\n========== 九、时间线条目 ==========")
added_timeline = 0
TIMELINE = [
    {"era": "宇宙学", "date": "112亿年前", "title": "宇宙诞生",
     "description": "CDD 宇宙当前年龄约112亿年。从原始Φ涨落经 L-2 凝化方程正反馈，自发形成恒星与星系结构。",
     "canonTier": "TIER 2", "relatedIds": ["L1-FACT-005"]},
    {"era": "宇宙学", "date": "54亿年前", "title": "母恒星（K1V）形成",
     "description": "母恒星类型 K1V，质量 0.92 M☉，表面温度 5150K，寿命约170亿年，Φ波通量效率高于 G 型星。",
     "canonTier": "TIER 2", "relatedIds": ["L1-FACT-001"]},
    {"era": "地质史", "date": "50亿年前", "title": "P3 形成",
     "description": "主行星 P3 形成，轨道半径 0.62 AU，公转周期 185.8 天；质量 1.3 M⊕，半径 6950 km，重力 1.08g。",
     "canonTier": "TIER 2", "relatedIds": ["L1-FACT-002A", "L1-FACT-002B"]},
    {"era": "地质史", "date": "50–42亿年前", "title": "熔融定型纪（P3 核幔分异）",
     "description": "P3 地质年代第一纪：核幔分异、初始地壳形成。",
     "canonTier": "TIER 2", "relatedIds": ["L2-FACT-004"]},
    {"era": "生命起源", "date": "42–43亿年前（克拉通成核纪初期）", "title": "生命起源（双起源事件）",
     "description": "①主起源：中央海洋中脊深海热液喷口群（CNP凝肽核酸+双层凝散膜+Φ汲取代谢）；②第二起源：南环海潮汐混合喷口独立 CNP 起源，谱系完全独立。",
     "canonTier": "TIER 3", "relatedIds": ["L5-FACT-004", "L5-FACT-004B", "L4-FACT-002"]},
    {"era": "地质史", "date": "42–28亿年前", "title": "克拉通成核纪",
     "description": "P3 地质年代第二纪：稳定大陆核与古山链形成。",
     "canonTier": "TIER 2", "relatedIds": ["L2-FACT-004"]},
    {"era": "地质史", "date": "28–12亿年前", "title": "板块分裂纪",
     "description": "P3 地质年代第三纪：强双卫星潮汐驱动板块裂解、热液成矿活跃期，凝晶矿等战略矿床初步富集。",
     "canonTier": "TIER 2", "relatedIds": ["L2-FACT-004", "L2-FACT-003A"]},
    {"era": "地质史", "date": "12亿年前至今", "title": "矿化成熟纪",
     "description": "P3 地质年代第四纪：当前大陆框架成型（一主两次级+多岛弧），矿床反复再富集。",
     "canonTier": "TIER 2", "relatedIds": ["L2-FACT-004", "L2-FACT-001"]},
    {"era": "史前史", "date": "7–8万年前", "title": "波次0：起源核（阿斯兰东缘）",
     "description": "智慧种族起源核心区：阿斯兰大陆东缘碰撞造山前缘带（20–35°N）。S0 起源人群。",
     "canonTier": "TIER 3", "relatedIds": ["L8-FACT-001", "L8-FACT-001B"]},
    {"era": "史前史", "date": "6–7万年前", "title": "波次1：中央海北岸扩散",
     "description": "S1中央海群（~6.5万年前）抵达中央海北岸大贝冢区域。",
     "canonTier": "TIER 3", "relatedIds": ["L8-FACT-001B", "L8-FACT-004"]},
    {"era": "史前史", "date": "5–6万年前", "title": "波次2：维罗北缘扩散",
     "description": "S2维罗群（~5.5万年前）通过陆桥抵达维罗北缘碰撞带，黑曜石工场遗迹为标志。",
     "canonTier": "TIER 3", "relatedIds": ["L8-FACT-001B", "L8-FACT-003"]},
    {"era": "史前史", "date": "4–5万年前", "title": "波次3：维罗西海岸扩散",
     "description": "S2维罗群向南扩散至维罗西海岸。",
     "canonTier": "TIER 3", "relatedIds": ["L8-FACT-001B"]},
    {"era": "史前史", "date": "3–4万年前", "title": "波次4：诺弧高原扩散",
     "description": "S3诺弧群（~4.5万年前）抵达近北极诺弧高原古地块拼接区。",
     "canonTier": "TIER 3", "relatedIds": ["L8-FACT-001B", "L8-FACT-003"]},
    {"era": "史前史", "date": "2–3万年前", "title": "波次5：黑潮弧群岛链扩散",
     "description": "S4黑潮群（~3万年前）通过「踏脚石」式岛链跳跃抵达黑潮弧群。",
     "canonTier": "TIER 3", "relatedIds": ["L8-FACT-001B", "L10-FACT-001"]},
    {"era": "史前史", "date": "1–2万年前", "title": "波次6：阿斯兰内陆回流（S5新阿斯兰群）",
     "description": "S5新阿斯兰群（~2万年前）从东缘起源核向西回流至阿斯兰内陆，农业驱动者。",
     "canonTier": "TIER 3", "relatedIds": ["L8-FACT-001B", "L8-FACT-004"]},
    {"era": "史前史", "date": "1.2–0.7万年前", "title": "农业起源（新石器革命 · CDD正反馈）",
     "description": "农业起源：耕作→土壤Φ升高→Φ光合效率提升→更高产→规模扩大→Φ再升高。农业是人为制造局部Φ异常的第一种大规模技术。",
     "canonTier": "TIER 3", "relatedIds": ["L8-FACT-002", "L8-FACT-002B"]},
    {"era": "古代史", "date": "约7000年前", "title": "双河文明立国",
     "description": "S5 新阿斯兰群在双河交汇平台建立双河文明。",
     "canonTier": "TIER 3", "relatedIds": ["L9-FACT-001"]},
    {"era": "古代史", "date": "约6500年前", "title": "凝脊邦联形成",
     "description": "S0 起源群后裔在阿斯兰东缘凝脊山口一带形成山地城邦联盟——凝脊邦联，凝晶矿采冶技术最早。",
     "canonTier": "TIER 3", "relatedIds": ["L9-FACT-001"]},
    {"era": "古代史", "date": "约6000年前", "title": "维罗矿业王权立国",
     "description": "S2 维罗群在维罗北缘矿脊建立早期集权国家——维罗矿业王权，冶金技术全球最先进。",
     "canonTier": "TIER 3", "relatedIds": ["L9-FACT-001"]},
    {"era": "古代史", "date": "约6000–5500年前", "title": "双河 vs 凝脊邦联：凝脊山口冲突（3次）",
     "description": "双河文明与凝脊邦联因凝脊山口控制权发生间歇性冲突，最终形成朝贡-通商关系。",
     "canonTier": "TIER 3", "relatedIds": ["L9-FACT-002"]},
    {"era": "古代史", "date": "约5800年前", "title": "中央海贸易城邦群形成",
     "description": "S1 中央海群后裔在中央海沿岸建立多个独立港口城邦。",
     "canonTier": "TIER 3", "relatedIds": ["L9-FACT-001"]},
    {"era": "古代史", "date": "约5500年前", "title": "诺弧高原祭司国形成 + 圣地免战惯例确立",
     "description": "政教合一的诺弧高原祭司国形成，最早的「圣地免战」惯例。",
     "canonTier": "TIER 3", "relatedIds": ["L9-FACT-001", "L9-FACT-003"]},
    {"era": "古代史", "date": "约5500年前", "title": "冶金技术从维罗扩散至中央海城邦",
     "description": "冶金技术从维罗经中央海贸易网络扩散，世界第一条长途贸易线确立。",
     "canonTier": "TIER 3", "relatedIds": ["L9-FACT-004"]},
    {"era": "古代史", "date": "约5300–5100年前", "title": "文字分别独立起源（双河+维罗）",
     "description": "双河文明（表意文字）与维罗矿业王权（表音音节文字）分别独立发明文字。",
     "canonTier": "TIER 3", "relatedIds": ["L9-FACT-004", "L14-FACT-002"]},
    {"era": "帝国时代", "date": "约4800年前", "title": "双河大一统王朝统一",
     "description": "双河文明后继政权统一双河平原与凝脊邦联，建立双河大一统王朝；鼎盛期约4500–3800年前。",
     "canonTier": "TIER 3", "relatedIds": ["L11-FACT-001"]},
    {"era": "帝国时代", "date": "约4300年前", "title": "维罗联合矿权成立",
     "description": "维罗矿业王权吞并周边小邦形成维罗联合矿权；鼎盛期约4000–3200年前。",
     "canonTier": "TIER 3", "relatedIds": ["L11-FACT-001"]},
    {"era": "帝国时代", "date": "约4000年前", "title": "「凝晶资源战争」（PAT-C01凝核碰撞实例）",
     "description": "双河大一统 vs 维罗联合矿权的凝晶资源战争，持续约150年；最终以海洋同盟调停告终。",
     "canonTier": "TIER 3", "relatedIds": ["L11-FACT-002", "PAT-C01"]},
    {"era": "帝国时代", "date": "约3600年前", "title": "中央海海洋同盟成立",
     "description": "中央海城邦群中的强邦主导形成松散海上同盟。",
     "canonTier": "TIER 3", "relatedIds": ["L11-FACT-001"]},
    {"era": "帝国时代", "date": "约3300年前起", "title": "维罗北缘矿脉枯竭危机（PAT-O01凝散周期实例）",
     "description": "维罗联合矿权凝晶矿主矿带开采超过自然Φ补充速率，帝国实力渐衰并于约3000年前分裂。",
     "canonTier": "TIER 3", "relatedIds": ["L11-FACT-002", "TENSION-L11-B", "PAT-O01"]},
    {"era": "帝国时代", "date": "约2200年前", "title": "泛阿斯兰第二帝国成立（PAT-S01凝核帝国实例）",
     "description": "双河文明后继政权再度统一阿斯兰全境，鼎盛期约2000–1400年前，疆域最大的前现代帝国。",
     "canonTier": "TIER 3", "relatedIds": ["L11-FACT-001", "PAT-S01"]},
    {"era": "帝国时代", "date": "约2100年前", "title": "泛阿斯兰第二帝国「黑潮征服战役」",
     "description": "首次跨海大规模军事行动，征服黑潮弧群诸岛。",
     "canonTier": "TIER 3", "relatedIds": ["L11-FACT-002"]},
    {"era": "帝国时代", "date": "约2000–1400年前", "title": "泛阿斯兰第二帝国鼎盛期 + 历法/技术基线",
     "description": "普及块炼铁与渗碳钢、大型水利、远洋帆船、文字标准化、基于 P3 公转 185.8 天的历法、凝晶矿精密加工。",
     "canonTier": "TIER 3", "relatedIds": ["L11-FACT-004", "L1-FACT-002C"]},
    {"era": "帝国时代", "date": "约1400–900年前", "title": "泛阿斯兰第二帝国渐进式解体",
     "description": "分裂为5个继承国。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-001"]},
    {"era": "工业化时代", "date": "约900年前", "title": "维罗合众国邦联重组 + 限量开采配额制",
     "description": "维罗大陆经矿脉枯竭危机后完成邦联重组，催生「限量开采配额制」制度伦理。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-001", "L15-FACT-001"]},
    {"era": "工业化时代", "date": "约600年前", "title": "中央海联合体正式合并",
     "description": "中央海沿岸城邦正式合并为「中央海联合体」，首个现代意义主权联合体。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-001"]},
    {"era": "工业化时代", "date": "约550年前", "title": "维罗合众国率先实现冶金工业化",
     "description": "维罗率先实现冶金工业化——凝晶矿精密加工技术升级为标准化生产。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-002"]},
    {"era": "工业化时代", "date": "约500年前", "title": "黑潮共同体成立",
     "description": "黑潮弧群诸岛组成松散的黑潮共同体。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-001"]},
    {"era": "工业化时代", "date": "约480年前", "title": "双河联邦农业机械化",
     "description": "双河联邦实现农业机械化（灌溉+早期机械）。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-002"]},
    {"era": "工业化时代", "date": "约420年前", "title": "中央海联合体成为贸易与金融中心",
     "description": "出现本世界首个跨国界商业银行体系。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-002"]},
    {"era": "工业化时代", "date": "约350年前", "title": "「三区并进」近代经济三极格局形成",
     "description": "维罗（重工业）、双河（农业与轻工业）、中央海（金融与贸易）三极结构。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-002"]},
    {"era": "工业化时代", "date": "约300年前", "title": "维罗工匠-学者首次提出「存在某种未知场」猜想",
     "description": "CDD 理论发现的开端。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-003"]},
    {"era": "工业化时代", "date": "约250年前", "title": "中央海学者提出「凝度场」假说雏形",
     "description": "通过潮汐-气候-矿物响应数据整合提出。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-003"]},
    {"era": "工业化时代", "date": "约200年前", "title": "「维罗-双河关税战争」",
     "description": "贸易保护主义冲突，以中央海调停+跨国关税同盟告终。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-004"]},
    {"era": "工业化时代", "date": "约180年前", "title": "凝散动力学（CDD）正式确立为科学理论",
     "description": "跨国界学术合作促成凝散动力学正式确立，凝化方程首次被数学化表述。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-003"]},
    {"era": "工业化时代", "date": "约120年前", "title": "Φ波探测技术成熟，凝迹效应首次直接验证",
     "description": "考古学、地质学与物理学同时经历范式革命。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-003"]},
    {"era": "工业化时代", "date": "约100年前", "title": "「黑潮地热资源争端」和平解决",
     "description": "通过诺弧高原祭司国传统中立地位的现代司法化和平解决。",
     "canonTier": "TIER 3", "relatedIds": ["L12-FACT-004"]},
    {"era": "AI 时代", "date": "约80年前", "title": "凝晶基半导体规模化生产",
     "description": "维罗合众国率先实现凝晶基半导体材料规模化生产。",
     "canonTier": "TIER 3", "relatedIds": ["L13-FACT-001"]},
    {"era": "AI 时代", "date": "约50年前", "title": "跨区域联合实验室成立，启动「人工凝化系统」研究",
     "description": "中央海数据分析传统与维罗硬件能力结合。",
     "canonTier": "TIER 3", "relatedIds": ["L13-FACT-001"]},
    {"era": "AI 时代", "date": "约15年前", "title": "「凝一号」训练完成 + 「零日凝峰」Φ异常事件",
     "description": "第一代通用AI「凝一号」训练完成。同期「零日凝峰」——持续11天Φ异常峰值，CDD「AI是凝化方程新临界点」的首次实证，三重印证。",
     "canonTier": "TIER 3", "relatedIds": ["L13-FACT-001", "L13-FACT-004", "OP-052"]},
    {"era": "AI 时代", "date": "约9年前", "title": "「凝三号」实现自我改进能力 → AI临界事件正式发生",
     "description": "第二代AI实现自我改进能力，本世界AI临界事件正式发生。",
     "canonTier": "TIER 3", "relatedIds": ["L13-FACT-001"]},
    {"era": "AI 时代", "date": "约8年前", "title": "「凝界公约」签署 → 全球性AI治理框架",
     "description": "五大区域体系全部签署「凝界公约」。维罗硬件+中央海资本双核心AI产业格局，诺弧转型AI伦理中心，黑潮成为算力中心。",
     "canonTier": "TIER 3", "relatedIds": ["L13-FACT-002"]},
    {"era": "当代世界", "date": "当代（当前）", "title": "L17 · 多极均势 + AI 竞合 + AI自我认知开放",
     "description": "五大区域体系在凝界公约框架下维持多极均势。黑潮算力经济崛起。OP-L13-001 AI自我认知「有意保持开放」。SUPP-001补完完成，世界观第一轮构建收官。",
     "canonTier": "TIER 3", "relatedIds": ["L17-FACT-001", "L17-FACT-005", "OP-L13-001", "OVERVIEW-MASTER-CLOSURE"]},
]

for entry in TIMELINE:
    key = f"{entry['era']}|{entry['date']}|{entry['title']}"
    if key not in old_timeline_keys:
        new_timeline.append(entry)
        added_timeline += 1
print(f"  新增时间线：{added_timeline}")

# ============ 十、变更记录 ============
print("\n========== 十、变更记录提取 ==========")
added_changelog = 0
CHANGELOG = [
    {"id": "CHANGE-v1.0", "description": "v1.0 初始版本，建立CDD公理与17层大纲框架。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.1", "description": "v1.1 L1 升格 TIER 2 已验证；写入 L1.001–L1.006 全部接口事实。依据：L1-COS-001 v1.1（12/12项独立验证通过）。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.2", "description": "v1.2 L2 升格 TIER 2 已验证；写入 L2.001–L2.005（海陆/7大板块/凝晶矿4类/地质四纪）；新增4张力；继承8项OP。依据：L2-GEO-001 v1.0。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.3", "description": "v1.3 L3 收录 TIER 3；写入 L3.001–L3.004；新增 OP-L1-NEW-001（P3自转）；记录Φ双重含义风险；新增张力L3-C/D。依据：L3-ATM-001 v1.0。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.4", "description": "v1.4 L4 收录 TIER 3；写入 L4.001–L4.004；登记 PAT-候选-001「深压凝核」；新增张力L4-A/B/C。依据：OCE-001 v1.0（公理一致7/7项）。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.5", "description": "v1.5 L5 升格 TIER 3 正式收录；v1.0 8项修正完成；登记 PAT-候选-002「Φ光合双天线」；L5.003 候选升TIER 2。依据：L5-BIO-001 v1.1。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.6", "description": "v1.6 L6 收录 TIER 3；两份v1.0草稿合并v1.1；写入L6.001-004；新增OP-L6-001~009。依据：L6-ECO-001 v1.1。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.7", "description": "v1.7 L7 收录 TIER 3；首次正式作答 OP-001（Φ感知：有限局部分布式凝核环）；写入L7.001-004；新增OP-L7-001~010。依据：BIO-007 v1.1。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.8", "description": "v1.8 L9-L17 一次性全部完成，第一轮构建收官。含 L10地理→L9古代→L11帝国→L12近代→L13 AI→L14语言/L15经济/L16宗教→L17当代。核心：「零日凝峰」三重实证、诺弧高原完整連续性、维罗资源诅咒完整叙事、收官陈述回扣L0第一原理闭环。", "type": "VERSION RELEASE"},
    {"id": "CHANGE-v1.9", "description": "v1.9 SUPP-001 一次性解决四项遗留：①OP-L1-NEW-001 P3自转30.4h（L1.002-c，L3同步修订，零回溯冲突）；②OP-004 潮语者（L6.005+L5.004-b+L7.005，零级联修订）；③OP-L6-009 散极生物（L6.006，L-3同一原理）；④OP-L5-002 南环海独立第二起源；OP-L13-001 AI自我认知按设计保持开放。", "type": "VERSION RELEASE"},
]
for entry in CHANGELOG:
    if entry["id"] not in old_changelog_ids:
        new_changelog.append(entry)
        added_changelog += 1
print(f"  新增变更记录：{added_changelog}")

# ============ 组装最终 encyclopedia.json ============
print("\n========== 组装最终数据 ==========")
final_articles = old_encyclopedia["articles"] + new_articles
final_ops = old_encyclopedia["openQuestions"] + new_ops
final_conflicts = old_encyclopedia["canonConflicts"] + new_conflicts
final_mysteries = list(old_encyclopedia["canonicalMysteries"])  # 不变
final_timeline = old_encyclopedia["timeline"] + new_timeline
final_changelog_entries = old_encyclopedia.get("changeLog", []) + new_changelog

# sources 追加 Master
final_sources = list(old_encyclopedia.get("sources", []))
if not any(re.search(r"CDD_World_Master", s.get("ref", "")) for s in final_sources):
    final_sources.append({
        "ref": "CDD_World_Master.md v1.9",
        "title": "CDD 世界构建主文档 v1.9（含 SUPP-001 v1.0 补完）",
        "canonicality": "Master single-file assembly (TIER 0–7 mixed; L0 = TIER 0 绝对不可修改)",
        "description": "CDD 世界观第一轮构建（L0-L17）加 SUPP-001 补完的完整 Master 文档。包含接口事实表、开放问题注册表、历史模式目录、协作规则系统与AI工作指令模板。",
    })
final_canon_registry = old_encyclopedia.get("canonRegistry", {})

final_encyclopedia = {
    "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
    "version": "2.1.0-master-merge",
    "sourceArchive": "CDD_COMPLETE_WORLD_ARCHIVE_v2.0.md + CDD_World_Master.md v1.9 (SUPP-001)",
    "counts": {
        "articles": len(final_articles),
        "openQuestions": len(final_ops),
        "canonConflicts": len(final_conflicts),
        "canonicalMysteries": len(final_mysteries),
        "timelineEntries": len(final_timeline),
    },
    "articles": final_articles,
    "openQuestions": final_ops,
    "canonConflicts": final_conflicts,
    "canonicalMysteries": final_mysteries,
    "timeline": final_timeline,
    "sources": final_sources,
    "canonRegistry": final_canon_registry,
    "changeLog": final_changelog_entries,
}

print(f"  Articles: {len(old_articles_by_id)} → {len(final_articles)}（新增 {len(new_articles)}）")
print(f"  OPs: {len(old_ops_by_id)} → {len(final_ops)}（新增 {len(new_ops)}）")
print(f"  Conflicts: {len(old_conflicts_by_id)} → {len(final_conflicts)}（新增 {len(new_conflicts)}）")
print(f"  Mysteries: {len(final_mysteries)}（不变）")
print(f"  Timeline: {len(old_encyclopedia['timeline'])} → {len(final_timeline)}（新增 {len(new_timeline)}）")
print(f"  ChangeLog: +{len(new_changelog)}")
print(f"  Skipped existing articles: {len(skipped_ids)}")

write_json(ENCYCLOPEDIA_PATH, final_encyclopedia)
print("✓ encyclopedia.json 已写入")

# ============ 重建 categories.json ============
print("\n========== 重建 categories.json ==========")
by_category = {}
for a in final_articles:
    cat = a["category"]
    if cat not in by_category:
        by_category[cat] = []
    by_category[cat].append({
        "id": a["id"], "slug": a["slug"], "title": a["title"], "canonTier": a["canonTier"],
    })
for cat in ["science", "world", "history", "people", "civilizations", "institutions", "society", "modern-world", "concept"]:
    if cat not in by_category:
        by_category[cat] = []
write_json(CATEGORIES_PATH, by_category)
print(f"  categories.json 包含 {len(by_category)} 个分类：")
for cat, lst in by_category.items():
    print(f"    {cat}: {len(lst)} 篇")

# ============ 重建 search-index.json ============
print("\n========== 重建 search-index.json ==========")
search_index = []
for a in final_articles:
    body_text_parts = []
    for b in a.get("body", []):
        if b.get("text"):
            body_text_parts.append(b["text"])
        if b.get("list"):
            body_text_parts.append(" ".join(b["list"]))
    search_text = " \n ".join(filter(None, [
        a.get("title", ""),
        a.get("titleEn", ""),
        " ".join(a.get("aliases", [])),
        a.get("summary", ""),
        a.get("id", ""),
        " ".join(body_text_parts),
    ]))
    search_index.append({
        "id": a["id"],
        "slug": a.get("slug", slugify(a["id"])),
        "type": a["type"],
        "category": a["category"],
        "title": a["title"],
        "titleEn": a.get("titleEn", ""),
        "aliases": a.get("aliases", []),
        "canonTier": a["canonTier"],
        "canonStatusRaw": a.get("canonStatusRaw", a["canonTier"]),
        "summary": a.get("summary", ""),
        "searchText": search_text,
    })
write_json(SEARCH_INDEX_PATH, search_index)
print(f"  search-index.json: {len(search_index)} entries")

# ============ NEW-IDS.txt ============
print("\n========== 写出 NEW-IDS.txt ==========")
with open(NEW_IDS_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(new_article_ids))
print(f"  NEW-IDS.txt: {len(new_article_ids)} 条新增 ID")
if new_article_ids:
    print("  前20条：")
    for nid in new_article_ids[:20]:
        print(f"    {nid}")
    if len(new_article_ids) > 20:
        print(f"    ... and {len(new_article_ids) - 20} more (see NEW-IDS.txt)")

# ============ MERGE SUMMARY ============
print("\n\n```")
print("=== MERGE SUMMARY ===")
print(f"原 articles: {len(old_articles_by_id)}，新增：{len(new_articles)}，最终：{len(final_articles)}")
print(f"原 openQuestions: {len(old_ops_by_id)}，新增：{len(new_ops)}，最终：{len(final_ops)}")
print(f"原 canonConflicts: {len(old_conflicts_by_id)}，新增：{len(new_conflicts)}，最终：{len(final_conflicts)}")
print(f"原 canonicalMysteries: {len(old_encyclopedia['canonicalMysteries'])}，新增：0，最终：{len(final_mysteries)}")
print(f"原 timeline: {len(old_encyclopedia['timeline'])}，新增：{len(new_timeline)}，最终：{len(final_timeline)}")
print(f"新增 changeLog 条目：{len(new_changelog)}")
print(f"已存在跳过的接口事实条目：{len(skipped_ids)}")
print("Next.js build 结果：待运行（见后续步骤）")
if new_article_ids:
    print("新 ID 列表（前20）：")
    for nid in new_article_ids[:20]:
        print(f"  {nid}")
print("```")
