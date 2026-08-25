// CDD Encyclopedia — Master Merge Script
// 从 CDD_World_Master.md 提取所有 L1-L17 接口事实、OP、张力、时间线、PAT、总览页等
// 合并到 data/encyclopedia.json（不覆盖已有，按 id 去重）

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

// ============ 路径配置 ============
const MASTER_PATH = resolve("E:\\CCD世界\\正典\\CDD_World_Master.md");
const ENCYCLOPEDIA_PATH = resolve(ROOT, "data", "encyclopedia.json");
const CATEGORIES_PATH = resolve(ROOT, "data", "categories.json");
const SEARCH_INDEX_PATH = resolve(ROOT, "data", "search-index.json");
const NEW_IDS_PATH = resolve(ROOT, "NEW-IDS.txt");

// ============ 工具函数 ============
function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}
function writeJson(p, obj) {
  writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

// 生成 slug
function slugify(id) {
  return String(id).toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 层 → category 映射
function layerToCategory(layerNum) {
  const n = parseInt(layerNum);
  if (n >= 0 && n <= 7) return "science";
  if (n >= 8 && n <= 13) return "history";
  if (n === 14 || n === 15 || n === 16) return "society";
  if (n === 17) return "modern-world";
  return "concept";
}

// 层 → canonTier / canonStatusRaw（从 Master 原文判断）
const LAYER_STATUS = {
  "1": { canonTier: "TIER 2", canonStatusRaw: "TIER 2 已验证", source: "L1-COS-001 v1.1" },
  "2": { canonTier: "TIER 2", canonStatusRaw: "TIER 2 已验证", source: "L2-GEO-001 v1.0" },
  "3": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已收录", source: "L3-ATM-001 v1.0" },
  "4": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已收录", source: "OCE-001 v1.0" },
  "5": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 正式收录", source: "L5-BIO-001 v1.1" },
  "6": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 正式收录", source: "L6-ECO-001 v1.1" },
  "7": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 正式收录", source: "BIO-007 v1.1" },
  "8": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 直接收录", source: "L8-ARC-001 v1.0" },
  "9": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L9-HIS-001 v1.0" },
  "10": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L10-GEO-001 v1.0" },
  "11": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L11-EMP-001 v1.0" },
  "12": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L12-IND-001 v1.0" },
  "13": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L13-AGI-001 v1.0" },
  "14": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L14-LNG-001 v1.0" },
  "15": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L15-ECO-001 v1.0" },
  "16": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L16-REL-001 v1.0" },
  "17": { canonTier: "TIER 3", canonStatusRaw: "TIER 3 已完成", source: "L17-CUR-001 v1.0" },
};

// 层中文名称
const LAYER_NAMES = {
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
};

// ============ 读取 Master 文档 ============
const masterText = readFileSync(MASTER_PATH, "utf-8");
console.log(`✓ Master 文档读取完成：${masterText.length} 字符`);

// ============ 读取现有数据 ============
const oldEncyclopedia = readJson(ENCYCLOPEDIA_PATH);
const oldArticlesById = new Map(oldEncyclopedia.articles.map(a => [a.id, a]));
const oldOpsById = new Map(oldEncyclopedia.openQuestions.map(o => [o.id, o]));
const oldConflictsById = new Map(oldEncyclopedia.canonConflicts.map(c => [c.id, c]));
const oldTimelineIds = new Set(oldEncyclopedia.timeline.map(t => `${t.era}|${t.date}|${t.title}`));

console.log(`✓ 原数据：${oldArticlesById.size} articles, ${oldOpsById.size} OPs, ${oldConflictsById.size} conflicts, ${oldEncyclopedia.canonicalMysteries.length} mysteries, ${oldEncyclopedia.timeline.length} timeline`);

// ============ 新增数据容器 ============
const newArticles = [];     // 新增的 articles
const skippedIds = [];      // 跳过的已存在 ID
const newArticleIds = [];   // 新增 ID 列表（用于 NEW-IDS.txt）
const newOps = [];
const newConflicts = [];
const newTimeline = [];
const newChangeLog = [];

function addArticleIfNotExists(article) {
  if (oldArticlesById.has(article.id)) {
    skippedIds.push(article.id);
    console.log(`  SKIP: ${article.id} exists`);
    return false;
  }
  // 确保 slug 存在
  if (!article.slug) article.slug = slugify(article.id);
  if (!article.aliases) article.aliases = [];
  if (!article.related) article.related = [];
  if (!article.fields) article.fields = {};
  if (!article.body) article.body = [];
  if (!article.sources) article.sources = [];
  if (!article.canonTier) article.canonTier = "TIER 3";
  if (!article.canonStatusRaw) article.canonStatusRaw = article.canonTier;
  newArticles.push(article);
  newArticleIds.push(article.id);
  return true;
}

function addOpIfNotExists(op) {
  if (oldOpsById.has(op.id)) {
    return false;
  }
  newOps.push(op);
  return true;
}

function addConflictIfNotExists(conflict) {
  if (oldConflictsById.has(conflict.id)) {
    return false;
  }
  newConflicts.push(conflict);
  return true;
}

// ============ 解析接口事实表 ============
// 每个 Lx 节中的接口事实表
function parseFactTables() {
  const factArticles = [];
  // 匹配模式：从 ### Lx · 开始 到 下一个 ### L 或 --- 之前
  // 我们先逐节提取

  // 构建层正则：L1 到 L17
  for (let layerNum = 1; layerNum <= 17; layerNum++) {
    const layerStr = String(layerNum);
    const status = LAYER_STATUS[layerStr];
    const layerName = LAYER_NAMES[layerStr];
    const category = layerToCategory(layerNum);

    // 找出该层所有 [Lx.xxx] 格式的事实
    // Master 中表格行格式：| `[L1.001]` | 事实内容 | 来源 |
    // 更灵活的正则：捕获编号、内容、来源
    const factRegex = new RegExp(
      `\\|\\s*\\`\\[L${layerNum}\\.(\\d+(?:-[a-z])?)\\]\\`\\s*\\|\\s*([^|]+?)\\s*\\|\\s*([^|\\n]+)\\s*\\|`,
      "g"
    );

    let match;
    while ((match = factRegex.exec(masterText)) !== null) {
      const factNum = match[1];       // 如 "001", "002-a"
      let factContent = match[2].trim();  // 事实内容
      let factSource = match[3].trim();   // 来源

      // 处理加粗标记
      factContent = factContent.replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1");
      factSource = factSource.replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1");

      // 生成 ID：L1-FACT-001 或 L2-FACT-003A
      const numPart = factNum.replace(/[^0-9]/g, "").padStart(3, "0");
      const letterPart = (factNum.match(/[a-z]$/) || [""])[0].toUpperCase();
      const articleId = `L${layerNum}-FACT-${numPart}${letterPart}`;

      // 标题：提取前 60-80 字，包含关键信息
      const title = `L${layerNum}.${factNum} ${factContent.slice(0, 70)}${factContent.length > 70 ? "…" : ""}`;

      // summary：事实内容首段或前 200 字
      const summary = factContent.slice(0, 200);

      // fields：从事实内容中简单提取一些 key-value（按：/：分割，保留原格式）
      const fields = {};
      // 尝试找冒号分隔的关键词
      const fieldMatches = factContent.match(/[\u4e00-\u9fa5A-Za-z0-9]+[：:][^\u3001\uff0c；;，。\n]+/g) || [];
      fieldMatches.forEach((fm, i) => {
        const colonIdx = fm.search(/[：:]/);
        if (colonIdx > 0 && colonIdx < 20) {
          const key = fm.slice(0, colonIdx).trim();
          const val = fm.slice(colonIdx + 1).trim().slice(0, 80);
          if (key && val) fields[key] = val;
        }
      });
      if (Object.keys(fields).length === 0) {
        fields["事实编号"] = `L${layerNum}.${factNum}`;
        fields["来源文档"] = factSource || status.source;
      }

      // 找本层的依赖说明（如果有的话）
      const dependencyRegex = new RegExp(
        `###\\s*L${layerNum}\\s*[·\\s\\S]*?\\*\\*依赖\\*\\*\\s*：\\s*([^\\n]+)`,
        "i"
      );
      const depMatch = masterText.match(dependencyRegex);
      let derivationText = "严格由上层接口事实与CDD公理推导，TIER状态见左侧Canon徽标。";
      if (depMatch && depMatch[1]) {
        derivationText = `依赖：${depMatch[1].trim()}。\n严格由上层接口事实与CDD公理推导，TIER状态见左侧Canon徽标。`;
      }

      // related：同层其他事实（后面关联到 OVERVIEW-Lx）
      const related = [`OVERVIEW-L${layerNum}`];

      const article = {
        id: articleId,
        slug: slugify(articleId),
        type: "concept",
        category,
        title,
        aliases: [],
        canonTier: status.canonTier,
        canonStatusRaw: status.canonStatusRaw,
        summary,
        fields,
        body: [
          { heading: "接口事实（Interface Fact）", text: factContent },
          { heading: "来源（Source）", text: factSource || status.source },
          { heading: "CDD 推导说明", text: derivationText },
        ],
        related,
        sources: [{
          ref: "CDD_World_Master.md v1.9",
          section: layerName,
          canonicality: status.canonTier,
        }],
      };
      factArticles.push(article);
    }
  }
  return factArticles;
}

console.log("\n========== 一、解析接口事实表 ==========");
const factArticles = parseFactTables();
console.log(`  解析出 ${factArticles.length} 条接口事实`);
let addedFacts = 0;
for (const a of factArticles) {
  if (addArticleIfNotExists(a)) addedFacts++;
}
console.log(`  新增接口事实：${addedFacts}，跳过：${factArticles.length - addedFacts}`);

// ============ 二、层级总览页 OVERVIEW-Lx ============
console.log("\n========== 二、层级总览页 ==========");
let addedOverviews = 0;
for (let layerNum = 1; layerNum <= 17; layerNum++) {
  const layerStr = String(layerNum);
  const layerName = LAYER_NAMES[layerStr];
  const status = LAYER_STATUS[layerStr];
  const category = layerToCategory(layerNum);
  const overviewId = `OVERVIEW-L${layerNum}`;

  // 提取该层开头的状态说明 + 依赖 + 核心任务
  const layerSectionRegex = new RegExp(
    `###\\s*L${layerNum}\\s*[·\\s\\S]*?(?=###\\s*L\\d|#\\s*第[一二三]|$)`,
    "i"
  );
  const sectionMatch = masterText.match(layerSectionRegex);
  let sectionText = sectionMatch ? sectionMatch[0] : "";

  // 提取依赖
  const depMatch = sectionText.match(/\*\*依赖\*\*[：:]\s*([^\n]+)/);
  // 提取核心任务
  const coreTaskMatch = sectionText.match(/\*\*核心任务\*\*[：:]\s*\n([\s\S]*?)(?:\n\*\*|\n---)/);
  // 提取开放问题列表
  const opList = [];
  const opRegex = new RegExp(`OP-L${layerNum}-(\\d+)`, "g");
  let opMatch;
  while ((opMatch = opRegex.exec(sectionText)) !== null) {
    opList.push(`OP-L${layerNum}-${opMatch[1]}`);
  }
  // 提取张力列表
  const tensionList = [];
  const tensionRegex = new RegExp(`张力L${layerNum}-([A-Z])`, "g");
  let tenMatch;
  while ((tenMatch = tensionRegex.exec(sectionText)) !== null) {
    tensionList.push(`TENSION-L${layerNum}-${tenMatch[1]}`);
  }
  // 补充 L2 的特殊张力 A/B/C/D（无L前缀）
  if (layerNum === 2) {
    ["A", "B", "C", "D"].forEach(l => {
      if (sectionText.includes(`**张力${l}**`)) {
        tensionList.push(`TENSION-L2-${l}`);
      }
    });
  }

  // 提取历史模式候选
  const patCandidates = [];
  const patRegex = /(PAT-候选-\d+)\s*[「"]([^」"]+)[」"]/g;
  let patMatch;
  while ((patMatch = patRegex.exec(sectionText)) !== null) {
    patCandidates.push(`${patMatch[1]} ${patMatch[2]}`);
  }

  const summary = `${layerName} · 状态：${status.canonStatusRaw} · 文档编号 ${status.source}`;

  const body = [
    { heading: "层级状态", text: `${status.canonStatusRaw} · 文档编号 ${status.source}` },
    depMatch ? { heading: "依赖事实", text: depMatch[1].trim() } : null,
    coreTaskMatch ? { heading: "核心任务", text: coreTaskMatch[1].replace(/^\s*[•\-]/gm, "· ").trim() } : null,
    opList.length ? { heading: "开放问题列表", list: opList } : null,
    tensionList.length ? { heading: "已知张力列表", list: tensionList } : null,
    patCandidates.length ? { heading: "历史模式候选", list: patCandidates } : null,
  ].filter(Boolean);

  const overviewArticle = {
    id: overviewId,
    slug: slugify(overviewId),
    type: "concept",
    category: category === "science" && layerNum === 1 ? "world" : category,
    title: layerName,
    aliases: [],
    canonTier: status.canonTier,
    canonStatusRaw: status.canonStatusRaw,
    summary,
    fields: {
      "层级编号": `L${layerNum}`,
      "文档编号": status.source,
      "Canon Tier": status.canonTier,
    },
    body,
    related: [],  // 后面回填事实文章 ID
    sources: [{
      ref: "CDD_World_Master.md v1.9",
      section: layerName,
      canonicality: status.canonTier,
    }],
  };

  if (addArticleIfNotExists(overviewArticle)) addedOverviews++;
}
console.log(`  新增层级总览页：${addedOverviews}`);

// 回填 OVERVIEW-Lx 的 related（包含同层事实卡片 ID）
const overviewMap = new Map();
for (const a of newArticles) {
  const m = a.id.match(/^L(\d+)-FACT-/);
  if (m) {
    const ovId = `OVERVIEW-L${m[1]}`;
    if (!overviewMap.has(ovId)) overviewMap.set(ovId, []);
    overviewMap.get(ovId).push(a.id);
  }
}
for (const a of newArticles) {
  if (a.id.startsWith("OVERVIEW-L")) {
    const factIds = overviewMap.get(a.id) || [];
    a.related = Array.from(new Set([...a.related, ...factIds]));
  }
}

// ============ 三、新增综述：OVERVIEW-MASTER-CLOSURE 收官陈述 ============
console.log("\n========== 三、世界观收官陈述 ==========");
const closureRegex = /\*\*世界观收官陈述\*\*[：:]\s*\n([\s\S]*?)\n\*\*遗留问题处理状态/;
const closureMatch = masterText.match(closureRegex);
const suppRegex = /\*\*遗留问题处理状态（SUPP-001 v1\.0，已更新）\*\*[：:]\s*\n([\s\S]*?)\n\*\*已知张力（本层新增/;
const suppMatch = masterText.match(/\*\*遗留问题处理状态（SUPP-001 v1\.0，已更新）\*\*[：:]\s*\n([\s\S]*?)(?=\n\*\*已知张力|\n---)/);
const closureTensionsRegex = /\*\*已知张力（本层新增，属全局性质）\*\*[：:]\s*\n([\s\S]*?)(?=\n---|$)/;
const closureTensionsMatch = masterText.match(closureTensionsRegex);

let closureText = "";
if (closureMatch) closureText += "【世界观收官陈述】\n" + closureMatch[1].trim() + "\n\n";
if (suppMatch) closureText += "【遗留问题处理状态（SUPP-001 v1.0 已更新）】\n" + suppMatch[1].trim() + "\n\n";
if (closureTensionsMatch) closureText += "【全局张力（L17-A/B）】\n" + closureTensionsMatch[1].trim();

const closureArticle = {
  id: "OVERVIEW-MASTER-CLOSURE",
  slug: "overview-master-closure",
  type: "concept",
  category: "concept",
  title: "世界观收官陈述与闭环",
  aliases: ["收官陈述", "Master Closure", "SUPP-001"],
  canonTier: "TIER 3",
  canonStatusRaw: "TIER 3 已完成（SUPP-001 v1.0 补完）",
  summary: "CDD 世界观从 L0 四条物理公理到 L17 当代世界的完整闭环，含 SUPP-001 遗留问题处理与全局张力。",
  fields: {
    "对应文档": "SUPP-001 v1.0",
    "章节位置": "Master 第 831 行起 + L17 层末",
  },
  body: [
    { heading: "世界观收官陈述", text: closureMatch ? closureMatch[1].trim() : "（原文未提取到）" },
    { heading: "遗留问题处理状态", text: suppMatch ? suppMatch[1].trim() : "（原文未提取到）" },
    { heading: "全局张力（L17-A / L17-B）", text: closureTensionsMatch ? closureTensionsMatch[1].trim() : "（原文未提取到）" },
  ],
  related: ["OVERVIEW-L17", "OP-L13-001"],
  sources: [{
    ref: "CDD_World_Master.md v1.9",
    section: "世界观收官陈述 + SUPP-001 v1.0",
    canonicality: "TIER 3",
  }],
};
let addedClosure = 0;
if (addArticleIfNotExists(closureArticle)) addedClosure = 1;
console.log(`  新增收官陈述：${addedClosure}`);

// ============ 四、PAT 历史模式系列 ============
console.log("\n========== 四、PAT 历史模式 ==========");
let addedPats = 0;
const PAT_DEFS = [
  {
    id: "PAT-S01",
    title: "PAT-S01 凝核帝国",
    category: "history",
    description: "「凝核帝国」：控制高Φ区域的帝国内聚力极强，平均寿命是普通帝国的3倍。属于稳定态（文明长期维持的结构）。",
    body: [
      { heading: "模式类型", text: "稳定态（文明长期维持的结构）" },
      { heading: "定义与规律", text: "控制高Φ区域的帝国内聚力极强，平均寿命是普通帝国的3倍。高Φ区域对应 L2.005 四类高Φ文明候选区——古老克拉通核、碰撞造山前缘带、热液火山岛弧带、古海盆边缘台地。" },
      { heading: "CDD 物理依据", text: "由 L-2 凝化方程的正反馈效应直接导出：高Φ区域的组织化趋势远高于周边，使得控制该区域的权力中心更难被外部瓦解，内部分裂成本更高。" },
      { heading: "历史实例", text: "泛阿斯兰第二帝国（L11）控制双河平原-凝脊山口高Φ带，是本世界疆域最大的前现代帝国；双河大一统王朝同样依托双河平原高Φ印记区。" },
    ],
  },
  {
    id: "PAT-O01",
    title: "PAT-O01 凝散周期",
    category: "history",
    description: "「凝散周期」：文明过度消耗周边Φ → 崩溃 → 环境Φ恢复 → 新文明兴起（周期约800年）。属于振荡态（循环历史规律）。",
    body: [
      { heading: "模式类型", text: "振荡态（循环历史规律）" },
      { heading: "定义与规律", text: "文明过度消耗周边Φ → 崩溃 → 环境Φ恢复 → 新文明兴起，周期约 800 年。这是 L-3 散化趋势在文明尺度的体现——当组织化（凝）的速率超过环境Φ补充速率时，系统必然自发向散化方向回弹。" },
      { heading: "CDD 物理依据", text: "L-3 散化趋势公理 + L11.002 维罗矿脉枯竭危机的历史实例。开采速率超过局部Φ自然补充速率，导致矿藏「枯竭」不仅是物理耗尽，更是局部凝度场无法维持高浓度矿化状态的表现。" },
      { heading: "历史实例", text: "维罗联合矿权的「北缘矿脉枯竭危机」（约3300年前起）导致帝国实力渐衰并最终于约3000年前分裂为多个继承邦国；随后的维罗合众国「限量开采配额制」即是对凝散周期的制度性应对。" },
    ],
  },
  {
    id: "PAT-G01",
    title: "PAT-G01 宗教滑翔机",
    category: "society",
    description: "「宗教滑翔机」：凝迹遗址附近产生的宗教体系沿贸易路线传播。属于滑翔机（扩散现象）。",
    body: [
      { heading: "模式类型", text: "滑翔机（扩散现象）" },
      { heading: "定义与规律", text: "凝迹遗址附近产生的宗教体系沿贸易路线传播。凝迹遗址（L8）提供物理上可探测的Φ异常，强化了宗教体验的「真实性」；而贸易路线（L9 早期贸易网络、L11-L12 中央海贸易航线）则是扩散的媒介。" },
      { heading: "CDD 物理依据", text: "L8.003 凝迹强度公式 + L9.003 早期宗教的核心信仰均围绕 CDD 现象的朴素描述展开——各文明独立发展出的「两种神圣力量」二元信仰，本质上是对 Φ 场正负两极的正确直觉感知。" },
      { heading: "历史实例", text: "诺弧高原「凝散不二论」（L9.003）从岩棚壁画符号系统起步，沿贸易路线传播，在 L11 时期被双河大一统王朝吸收改造为国教「凝统正道」，在 L12-L13 时期完成哲学-伦理学现代转型，最终在 L17 成为 AI 伦理审计的主导框架——这是宗教滑翔机模式最完整的实例。" },
    ],
  },
  {
    id: "PAT-C01",
    title: "PAT-C01 凝核碰撞",
    category: "history",
    description: "「凝核碰撞」：两个凝核帝国相遇时，边界Φ争夺导致标志性的「凝界战争」模式。属于碰撞（不同模式的相互作用）。",
    body: [
      { heading: "模式类型", text: "碰撞（不同模式的相互作用）" },
      { heading: "定义与规律", text: "两个凝核帝国相遇时，边界Φ争夺导致标志性的「凝界战争」模式。双方都依托高Φ区域作为权力根基，而边界地带往往也是Φ梯度最陡峭的区域——争夺的不仅是领土和资源，更是「局部凝度场控制权」。" },
      { heading: "CDD 物理依据", text: "L-2 凝化方程正反馈 + L-3 散化趋势。两个高凝度中心相遇，中间地带会被双方「抽走」Φ，造成局部Φ真空（散化），迫使双方不断投入更多资源维持边界——这便是「凝界战争」的物理驱动机制。" },
      { heading: "历史实例", text: "双河大一统王朝与维罗联合矿权的「凝晶资源战争」（L11.002，约4000年前，持续约150年）争夺中央海贸易主导权，其本质是两大凝核帝国的Φ边界之争；最终以海洋同盟介入调停+贸易协定告终，未分胜负——这是因为双方都触碰到了 L-3 散化趋势的可持续性边界。" },
    ],
  },
  {
    id: "PAT-候选-001",
    title: "PAT-候选-001 深压凝核",
    category: "science",
    description: "「深压凝核」模式：高压深海环境通过凝力优势抑制散化，使热液喷口的Φ峰值维持时间远超浅海同等Φ梯度区域。来源：OCE-001步骤3，直接由CDD L-3导出。",
    body: [
      { heading: "候选登记来源", text: "L4 海洋学（OCE-001 v1.0 步骤3）——原创 CDD 推论，无现实物理类比" },
      { heading: "模式定义", text: "高压深海环境通过凝力优势抑制散化，使热液喷口的Φ峰值维持时间远超浅海同等Φ梯度区域。直接推论：深海热液区是全球Φ密度最高的持续性自然结构之一，是生命起源的物理优先场所。" },
      { heading: "CDD 物理依据", text: "CDD L-3（散化趋势公理）的逆向应用——在高压环境中，外部压力等效于额外的凝力分量，使得散化趋势被显著压制。这意味着同等Φ梯度的结构，在深海高压下比浅海常压下可以维持更长时间不崩溃。" },
      { heading: "下游影响", text: "L4.002 深海高Φ区三候选均依托此模式；L5.004 生命起源地点的排序（中央海中脊热液喷口群为第一候选）由此模式推导。" },
    ],
  },
  {
    id: "PAT-候选-002",
    title: "PAT-候选-002 Φ光合双天线",
    category: "science",
    description: "「Φ光合双天线」：星体输出热辐射与Φ波 → 表层自养生物演化出光子+Φ波双通道天线 → 更高能量采集效率。来源：L5步骤6，由L1.001+L1.006+L3.004联合推导，现实无类比。",
    body: [
      { heading: "候选登记来源", text: "L5 生物化学与生命起源（L5-BIO-001 v1.1 步骤6）——现实无类比" },
      { heading: "模式定义", text: "星体输出热辐射与Φ波 → 表层自养生物演化出光子+Φ波双通道天线 → 更高能量采集效率 → 成为生物圈主要初级生产者。这是 CDD 世界与现实地球生物化学的最本质区别之一。" },
      { heading: "CDD 物理依据", text: "联合推导：L1.001（母恒星持续发出强烈Φ波）+ L1.006（Φ波在真空中以光速传播，可到达行星表面）+ L3.004（Φ波大气衰减工作模型，部分Φ波可到达生物圈）。三条接口事实联合说明：行星表面生物有稳定的Φ波输入通道，演化出Φ波天线是适应性必然。" },
      { heading: "下游影响", text: "L5.005 光合作用等价机制（Φ光合）；L6.002 生态系统Φ流动图（Φ源→初级汲取者的第一通道）。" },
    ],
  },
];

for (const pat of PAT_DEFS) {
  const article = {
    id: pat.id,
    slug: slugify(pat.id),
    type: "concept",
    category: pat.category,
    title: pat.title,
    aliases: [],
    canonTier: "TIER 3",
    canonStatusRaw: "TIER 3 历史模式（Pattern）登记条目",
    summary: pat.description,
    fields: {
      "模式编号": pat.id,
      "模式类型": pat.body[0]?.text || "历史模式",
      "登记来源": "CDD_World_Master.md §3.5 历史模式目录 + 各层候选登记",
    },
    body: pat.body,
    related: [],
    sources: [{
      ref: "CDD_World_Master.md v1.9",
      section: "§3.5 历史模式目录",
      canonicality: "TIER 3",
    }],
  };
  if (addArticleIfNotExists(article)) addedPats++;
}
console.log(`  新增 PAT 历史模式：${addedPats}`);

// ============ 五、协作规则系统 WORKFLOW-RULES ============
console.log("\n========== 五、协作规则系统 ==========");
let addedWorkflow = 0;
const workflowArticle = {
  id: "WORKFLOW-RULES",
  slug: "workflow-rules",
  type: "concept",
  category: "concept",
  title: "协作规则系统（CDD Worldbuilding Workflow）",
  aliases: ["协作规则", "Workflow Rules", "3.1-3.5"],
  canonTier: "TIER 0",
  canonStatusRaw: "MASTER CANON · 协作元规则（第三章）",
  summary: "Master 第三章完整协作规则系统：3.1事实三个层级（TIER 1/2/3）、3.2贡献文档标准格式、3.3验证四项检验、3.4开放问题注册表、3.5历史模式目录。",
  fields: {
    "章节": "第三章 协作规则系统（§3.1–§3.5）",
    "规则性质": "元规则 · 对所有域具有约束力",
  },
  body: [
    {
      heading: "3.1 事实的三个层级",
      text: "TIER 1（公理层，绝对不可修改）：CDD 四条定律 + 两种力 + Φ波 + 凝迹效应。\nTIER 2（推导层，可验证，有完整推导链）：从公理严格推导出的世界事实，每条事实必须附有完整推导链，可被更严谨的推导替代。\nTIER 3（外推层，创作性，须标注）：符合世界逻辑但尚无严格推导的内容，可被「升格」为 TIER 2（若找到推导链）。",
    },
    {
      heading: "3.2 贡献文档标准格式",
      text: "每一份新内容贡献必须包含：\n① 文档编号（域代码-序号）、域、版本、层级、状态\n② § 导入事实（Imports）：本文档依赖的已验证事实列表\n③ § 推导链（Derivation）：按步骤编号的逻辑推导链，每步必须有依据，不允许跳步\n④ § 输出事实（Exports）：本文档新建的可被其他域引用的接口事实\n⑤ § 开放问题（Open Questions）：本文档引出但未解决的问题，供其他贡献者接取\n⑥ § 已知张力（Conflicts）：本文档与已有事实的未解决张力，需要仲裁",
    },
    {
      heading: "3.3 验证四项检验",
      text: "所有内容在进入「已验证」状态前必须全部通过：\n检验1 公理一致性：是否与 CDD 四条定律无矛盾？是否违反质守恒？\n检验2 接口完整性：所有 Import 是否有已验证的来源文档？\n检验3 推导链完整性：每个步骤是否有逻辑依据？是否有未声明的假设？\n检验4 无循环依赖：是否形成 A 依赖 B、B 依赖 A 的逻辑循环？\n通过全部四项 → 升格为 TIER 2，进入正式引用库。",
    },
    {
      heading: "3.4 开放问题注册表（★★★ 四项最高优先级）",
      text: "★★★（阻断多个下游域）：\nOP-001 智慧种族是否具有Φ直接感知能力？→ ✅ SUPP-001 已作答（L7.002 凝核环）\nOP-002 凝晶矿是否可以被加工为Φ场放大器？→ 未闭合\nOP-003 第一批语言是否存在共同祖先？→ 未闭合\nOP-004 这个世界有几个智慧种族？→ ✅ SUPP-001 已解决（第二智慧种族：潮语者 L6.005）\n\n★★（重要但不紧急）：OP-007 CDD理论发现时间、OP-011 凝迹最大持续时间、OP-015 深海与陆地生命起源独立？\n\n★（探索性）：OP-031 反凝化生物（✅ 已解决：散极生物 L6.006）、OP-044 Φ波跨大陆通信、OP-052 AI核心区Φ实测（✅ 已验证：零日凝峰 L13.004）",
    },
    {
      heading: "3.5 历史模式目录（Pattern Library）",
      text: "稳定态：PAT-S01 凝核帝国\n振荡态：PAT-O01 凝散周期（约800年）\n滑翔机：PAT-G01 宗教滑翔机\n碰撞：PAT-C01 凝核碰撞\n候选：PAT-候选-001 深压凝核（L4）、PAT-候选-002 Φ光合双天线（L5）",
    },
  ],
  related: ["AI-WORKFLOW-TEMPLATE", "PAT-S01", "PAT-O01", "PAT-G01", "PAT-C01"],
  sources: [{
    ref: "CDD_World_Master.md v1.9",
    section: "第三章 协作规则系统（§3.1–§3.5）",
    canonicality: "TIER 0",
  }],
};
if (addArticleIfNotExists(workflowArticle)) addedWorkflow = 1;
console.log(`  新增协作规则系统：${addedWorkflow}`);

// ============ 六、AI 工作指令模板 AI-WORKFLOW-TEMPLATE ============
console.log("\n========== 六、AI 工作指令模板 ==========");
let addedAIWorkflow = 0;
const aiWorkflowArticle = {
  id: "AI-WORKFLOW-TEMPLATE",
  slug: "ai-workflow-template",
  type: "concept",
  category: "concept",
  title: "AI 工作指令模板（第四章）",
  aliases: ["AI工作模板", "第四章", "工作指令"],
  canonTier: "TIER 0",
  canonStatusRaw: "MASTER CANON · AI 工作元规则（第四章）",
  summary: "Master 第四章给 AI 的工作指令模板：4.1 接取任务标准流程 + 4.2 常用指令示例（启动新域、接取OP、延伸创作、一致性检验）。",
  fields: {
    "章节": "第四章 给 AI 的工作指令模板（§4.1–§4.2）",
    "适用对象": "所有参与 CDD 世界观构建的 AI Agent",
  },
  body: [
    {
      heading: "4.1 接取任务标准流程",
      text: "1. 阅读第一章（CDD 公理），完全理解物理规则（质守恒、凝化方程 L-2、散化趋势 L-3、时间方向内禀性 L-4）。\n2. 阅读自己负责的层级说明（第二章对应小节）。\n3. 检查该层级的「依赖」列表，确认所需的上游事实（接口事实编号）。\n4. 按第三章的贡献文档标准格式进行推导与创作（导入事实 → 推导链 → 输出事实 → 开放问题 → 已知张力）。\n5. 在输出末尾，列出本次工作新产生的「开放问题」，供其他接取者使用。",
    },
    {
      heading: "4.2 常用指令示例 · 启动一个新域",
      text: "指令模板：\n「你负责 [L1 宇宙学与恒星系]。请阅读第一章的 CDD 物理公理，然后完成 L1 节列出的全部任务，按贡献文档格式输出，并列出所有开放问题。」",
    },
    {
      heading: "4.2 常用指令示例 · 接取一个开放问题",
      text: "指令模板：\n「请接取 OP-001（智慧种族是否具有Φ直接感知能力），基于 CDD 公理和 [L5.001-003][L7.001] 进行推导，输出结论，并更新 L7.002 接口事实。」",
    },
    {
      heading: "4.2 常用指令示例 · 延伸创作",
      text: "指令模板：\n「基于已有的 [L9.001-003] 和 [L16.001]，为本世界最古老的文明设计一套完整的宗教体系，要求教义能被解释为对 CDD 现象的朴素描述。标注为 TIER 3。」",
    },
    {
      heading: "4.2 常用指令示例 · 一致性检验",
      text: "指令模板：\n「请检验以下内容与 CDD 公理是否存在矛盾：[粘贴内容]。如有矛盾，指出具体冲突并提出修改方案。」",
    },
  ],
  related: ["WORKFLOW-RULES", "OVERVIEW-MASTER-CLOSURE"],
  sources: [{
    ref: "CDD_World_Master.md v1.9",
    section: "第四章 给 AI 的工作指令模板（§4.1–§4.2）",
    canonicality: "TIER 0",
  }],
};
if (addArticleIfNotExists(aiWorkflowArticle)) addedAIWorkflow = 1;
console.log(`  新增 AI 工作指令模板：${addedAIWorkflow}`);

// ============ 七、开放问题（OP）提取 ============
console.log("\n========== 七、开放问题提取 ==========");
let addedOps = 0;

// 7.1 各层 OP-Lx-xxx
for (let layerNum = 1; layerNum <= 17; layerNum++) {
  const layerName = LAYER_NAMES[String(layerNum)];
  // 匹配 OP-Lx-xxx 行
  const opLineRegex = new RegExp(
    `-\\s*\\~?\\~?\\`(OP-L${layerNum}-\\d+)\\`\\s*([^\\n]+?)(?:\\*\\*✅已解决\\*\\*([^\\n]*))?$`,
    "gm"
  );
  // 更宽松的匹配：包括可能的 ✅状态
  const looserRegex = new RegExp(
    `(?:~~)?\\\`(OP-L${layerNum}-\\d+)\\\`(?:~~)?\\s*([^\\n]+)`,
    "g"
  );

  let match;
  // 使用宽松正则
  while ((match = looserRegex.exec(masterText)) !== null) {
    const opId = match[1];
    let rawContent = match[2].trim();
    // 判断是否已解决
    let isResolved = false;
    let resolvedNote = "";
    if (/✅已解决/.test(rawContent)) {
      isResolved = true;
      const rm = rawContent.match(/✅已解决[（(]([^）)]+)[）)]/);
      resolvedNote = rm ? rm[1] : "";
    }
    // 去掉前面的 "- "
    rawContent = rawContent.replace(/^[-–—]\s*/, "");
    // 提取 question（保留 → 交Lxx）
    const question = rawContent
      .replace(/\*\*✅已解决\*\*.*$/, "")
      .replace(/✅已解决.*$/, "")
      .trim();
    if (!question || question.startsWith("P3自转周期") && opId === `OP-L${layerNum}-001` && layerNum !== 1) {
      continue; // 跳过重复项
    }

    // assignedDomain：从「→ 交Lxx」或「→交Lxx」中提取
    let assignedDomain = "UNASSIGNED";
    const adMatch = question.match(/[→>]\\s*交\s*L?(\d+)/);
    if (adMatch) {
      assignedDomain = `L${adMatch[1]}`;
    } else {
      const adMatch2 = question.match(/交\s*L(\d+)/i);
      if (adMatch2) assignedDomain = `L${adMatch2[1]}`;
    }

    // relatedArticles：对应层的事实卡片
    const relatedArticles = [`OVERVIEW-L${layerNum}`];

    // isCanonicalMystery：只有 OP-L13-001 是有意保持开放
    const isCanonicalMystery = (opId === "OP-L13-001");

    const op = {
      id: opId,
      question: question + (isResolved && resolvedNote ? ` 【✅已解决：${resolvedNote}】` : ""),
      layer: layerName,
      status: isResolved ? "RESOLVED" : "OPEN",
      assignedDomain,
      canonImpact: "TIER 3 IMPACT",
      relatedArticles,
      isCanonicalMystery,
    };

    if (addOpIfNotExists(op)) addedOps++;
  }
}

// 7.2 3.4 节的老编号 OP-001 / OP-002 / OP-003 / OP-004
const LEGACY_OPS = [
  {
    id: "OP-001",
    question: "智慧种族是否具有Φ直接感知能力？→ 影响：L7/L16/L14 【✅已解决：L7.002 凝核环机制，有限局部分布式感知】",
    layer: "L7 · 智慧种族生物学",
    status: "RESOLVED",
    assignedDomain: "L7",
    canonImpact: "TIER 2 IMPACT",
    relatedArticles: ["L7-FACT-002", "OVERVIEW-L7"],
    isCanonicalMystery: false,
  },
  {
    id: "OP-002",
    question: "凝晶矿是否可以被加工为Φ场放大器？→ 影响：L12/L13/L15",
    layer: "L2 · 行星地质与矿藏 / L12 工业化",
    status: "OPEN",
    assignedDomain: "L12",
    canonImpact: "TIER 2 IMPACT",
    relatedArticles: ["L2-FACT-003A", "OVERVIEW-L2", "OVERVIEW-L12"],
    isCanonicalMystery: false,
  },
  {
    id: "OP-003",
    question: "第一批语言是否存在共同祖先？→ 影响：L14/L9",
    layer: "L14 · 语言与文字系统 / L9 古代史",
    status: "OPEN",
    assignedDomain: "L14",
    canonImpact: "TIER 2 IMPACT",
    relatedArticles: ["L14-FACT-001", "OVERVIEW-L14", "OVERVIEW-L9"],
    isCanonicalMystery: false,
  },
  {
    id: "OP-004",
    question: "这个世界有几个智慧种族？→ 影响：L6/L7/L8起全部 【✅已解决：确认第二智慧种族「潮语者」L6.005，零级联修订】",
    layer: "L6 · 生态系统与演化 / L7 智慧种族生物学",
    status: "RESOLVED",
    assignedDomain: "L6",
    canonImpact: "TIER 2 IMPACT",
    relatedArticles: ["L6-FACT-005", "L7-FACT-005", "OVERVIEW-L6", "OVERVIEW-L7"],
    isCanonicalMystery: false,
  },
  // 其他老编号
  {
    id: "OP-007",
    question: "CDD理论在世界内是何时被科学界发现的？ 【✅已解决：L12.003，约300年前猜想→250年前凝度场假说→180年前CDD确立→120年前凝迹效应验证】",
    layer: "L12 · 近代史 / 工业化时代",
    status: "RESOLVED",
    assignedDomain: "L12",
    canonImpact: "TIER 3 IMPACT",
    relatedArticles: ["L12-FACT-003", "OVERVIEW-L12"],
    isCanonicalMystery: false,
  },
  {
    id: "OP-011",
    question: "凝迹效应的最大持续时间上限是多少？",
    layer: "L8 · 史前史与考古 / L0 物理",
    status: "OPEN",
    assignedDomain: "L8",
    canonImpact: "TIER 3 IMPACT",
    relatedArticles: ["L8-FACT-003", "OVERVIEW-L8"],
    isCanonicalMystery: false,
  },
  {
    id: "OP-015",
    question: "深海生命与陆地生命是否有独立起源？ 【✅已解决：L5.004-b 确认南环海独立第二起源，收敛而非同源】",
    layer: "L5 · 生物化学与生命起源 / L4 海洋学",
    status: "RESOLVED",
    assignedDomain: "L5",
    canonImpact: "TIER 3 IMPACT",
    relatedArticles: ["L5-FACT-004B", "OVERVIEW-L5", "OVERVIEW-L4"],
    isCanonicalMystery: false,
  },
  {
    id: "OP-031",
    question: "是否存在「反凝化生物」——主动提升环境散度的生命形态？ 【✅已解决：散极生物 L6.006】",
    layer: "L6 · 生态系统与演化",
    status: "RESOLVED",
    assignedDomain: "L6",
    canonImpact: "TIER 3 IMPACT",
    relatedArticles: ["L6-FACT-006", "OVERVIEW-L6"],
    isCanonicalMystery: false,
  },
  {
    id: "OP-044",
    question: "能否利用Φ波进行跨大陆实时通信？",
    layer: "L1 · 宇宙学与恒星系 / L13 AI临界事件",
    status: "OPEN",
    assignedDomain: "L13",
    canonImpact: "TIER 3 IMPACT",
    relatedArticles: ["L1-FACT-006", "OVERVIEW-L1", "OVERVIEW-L13"],
    isCanonicalMystery: false,
  },
  {
    id: "OP-052",
    question: "AI系统运行时，其核心区域的Φ值是否可以实测？ 【✅已解决：L13.004「零日凝峰」事件，三重实证，Φ异常可测】",
    layer: "L13 · AI 临界事件",
    status: "RESOLVED",
    assignedDomain: "L13",
    canonImpact: "TIER 2 IMPACT",
    relatedArticles: ["L13-FACT-004", "OVERVIEW-L13"],
    isCanonicalMystery: false,
  },
  // OP-L1-NEW-001
  {
    id: "OP-L1-NEW-001",
    question: "P3自转周期是多少？ 【✅已解决：SUPP-001 L1.002-c，约30.4小时】",
    layer: "L1 · 宇宙学与恒星系",
    status: "RESOLVED",
    assignedDomain: "L1",
    canonImpact: "TIER 2 IMPACT",
    relatedArticles: ["L1-FACT-002C", "OVERVIEW-L1", "OVERVIEW-L3", "OVERVIEW-L4"],
    isCanonicalMystery: false,
  },
];

for (const op of LEGACY_OPS) {
  if (addOpIfNotExists(op)) addedOps++;
}

// 其他 L6 OP
const extraL6 = [
  ["OP-L6-009", "反凝化生物是否存在？ 【✅已解决：散极生物 L6.006】", "RESOLVED", "L6", false],
];
for (const [id, q, st, ad, cm] of extraL6) {
  if (addOpIfNotExists({
    id, question: q, layer: LAYER_NAMES[ad.replace("L","")] || "L6", status: st,
    assignedDomain: ad, canonImpact: "TIER 3 IMPACT",
    relatedArticles: [`OVERVIEW-${ad}`], isCanonicalMystery: cm,
  })) addedOps++;
}

console.log(`  新增开放问题：${addedOps}`);

// ============ 八、已知张力（Canon Conflicts）提取 ============
console.log("\n========== 八、已知张力提取 ==========");
let addedConflicts = 0;

// 先手动整理 Master 中明确写出的张力
const TENSIONS = [
  // L2 张力（A/B/C/D）
  { id: "TENSION-L2-A", title: "张力L2-A：板块活动强度 vs 大范围宜居气候带",
    description: "板块活动强→大陆边缘破碎→L3需确认是否仍能形成大范围宜居气候带。L2 文档自报张力。",
    involvedHistory: ["L2 · 行星地质与矿藏", "L3 · 大气与气候"],
    originalSources: ["L2-GEO-001 v1.0"] },
  { id: "TENSION-L2-B", title: "张力L2-B：凝晶矿高稳定性 vs 化学可加工性",
    description: "凝晶矿晶格异常稳定（战略矿成因）→ L5/L12 需确认化学可加工性（如何冶炼、成型、掺杂等）。L2 文档自报张力。",
    involvedHistory: ["L2 · 行星地质与矿藏", "L5 · 生物化学与生命起源", "L12 · 近代史 / 工业化时代"],
    originalSources: ["L2-GEO-001 v1.0"] },
  { id: "TENSION-L2-C", title: "张力L2-C：「第四纪」命名与现实地质用语冲突",
    description: "「第四纪」命名与现实地质用语冲突（现实第四纪指最近260万年），建议后续版本重命名该地质纪，不影响当前引用。审核新增张力。",
    involvedHistory: ["L2 · 行星地质与矿藏"],
    originalSources: ["L2-GEO-001 v1.0（审核新增）"] },
  { id: "TENSION-L2-D", title: "张力L2-D：超大陆不稳定结论偏定性，潮汐阈值未量化",
    description: "超大陆不稳定的结论偏定性，未量化潮汐阈值，建议 OP-L2-003 解决后补充。审核新增张力。",
    involvedHistory: ["L2 · 行星地质与矿藏", "L3 · 大气与气候", "L4 · 海洋学"],
    originalSources: ["L2-GEO-001 v1.0（审核新增）"] },
  // L3 张力
  { id: "TENSION-L3-A", title: "张力L3-A：板块破碎化 vs 连续气候带",
    description: "板块破碎化可能削弱大范围连续气候带，采用「主带连续+区域碎片化」双层结构应对。L3 文档自报。",
    involvedHistory: ["L3 · 大气与气候", "L2 · 行星地质与矿藏"],
    originalSources: ["L3-ATM-001 v1.0"] },
  { id: "TENSION-L3-B", title: "张力L3-B：高Φ地带 vs 气候宜居带的不总重合",
    description: "「高Φ地带」与「气候宜居带」不总重合，只在特定地形与湿度窗口内同时成立。L3 文档自报。",
    involvedHistory: ["L3 · 大气与气候", "L2 · 行星地质与矿藏"],
    originalSources: ["L3-ATM-001 v1.0"] },
  { id: "TENSION-L3-C", title: "张力L3-C：P3自转周期未确定导致气候带纬度估算（已部分解决）",
    description: "L3.001 气候带纬度界限隐式假设 P3 自转周期接近地球，待 OP-L1-NEW-001 解决前属于估算。【部分解决：P3自转30.4h已定，L3.001表已同步修订】",
    involvedHistory: ["L3 · 大气与气候", "L1 · 宇宙学与恒星系"],
    originalSources: ["L3-ATM-001 v1.0（审核新增）", "SUPP-001 v1.0"] },
  { id: "TENSION-L3-D", title: "张力L3-D：Φ含义双重性（大气透过率 vs 地质印记）",
    description: "Φ含义双重性——大气Φ透过率（L3）≠ 地质Φ印记（L2），下游层 L5/L6 引用时须明确区分。L3 审核新增张力。",
    involvedHistory: ["L3 · 大气与气候", "L2 · 行星地质与矿藏", "L5 · 生物化学", "L6 · 生态系统与演化"],
    originalSources: ["L3-ATM-001 v1.0（审核新增）"] },
  // L4 张力
  { id: "TENSION-L4-A", title: "张力L4-A：海洋环流精细结构依赖P3自转周期（已部分解决）",
    description: "海洋环流精细结构依赖P3自转周期。【部分解决：SUPP-001 P3自转30.4h已定，Rossby变形半径增大约27%，三大洋环流尺度相应略大于地球同类结构；具体路径细节仍待定量化】",
    involvedHistory: ["L4 · 海洋学", "L1 · 宇宙学与恒星系"],
    originalSources: ["OCE-001 v1.0", "SUPP-001 v1.0"] },
  { id: "TENSION-L4-B", title: "张力L4-B：南环海强潮汐 vs 局部生态稳定性",
    description: "南环海强潮汐若过强可能压低局部生态稳定性；但高营养盐+高Φ泵送同时构成生命与文明的高潜力起点，两面性待L5/L6校验。",
    involvedHistory: ["L4 · 海洋学", "L5 · 生物化学", "L6 · 生态系统与演化", "L8 · 史前史与考古"],
    originalSources: ["OCE-001 v1.0"] },
  { id: "TENSION-L4-C", title: "张力L4-C：洋盆深度估算未引用g=1.08修正",
    description: "洋盆深度估算未引用 [L1.002-b] g=1.08 修正，偏差量级约8%，v1.1需补充导入。审核新增张力。",
    involvedHistory: ["L4 · 海洋学", "L1 · 宇宙学与恒星系"],
    originalSources: ["OCE-001 v1.0（审核新增）"] },
  // L5 张力
  { id: "TENSION-L5-A", title: "张力L5-A：深海热液→浅海→陆地过渡机制",
    description: "深海热液起源须由 L6 证明能稳定过渡到浅海/潮滩/陆地生态。继承至 L6-A。",
    involvedHistory: ["L5 · 生物化学与生命起源", "L6 · 生态系统与演化", "L8 · 史前史与考古"],
    originalSources: ["L5-BIO-001 v1.1"] },
  { id: "TENSION-L5-B", title: "张力L5-B：主起源点排序（中央海中脊 vs 南环海）",
    description: "若南环海Φ泵送效率更高，主起源点排序需重新评估。继承自 L6-B。",
    involvedHistory: ["L5 · 生物化学与生命起源", "L4 · 海洋学", "L6 · 生态系统与演化"],
    originalSources: ["L5-BIO-001 v1.1"] },
  { id: "TENSION-L5-C", title: "张力L5-C：双层凝散膜推导补全后候选升格TIER 2",
    description: "双层凝散膜（L5.003）若推导补全可申请升格 TIER 2。当前为 TIER 3 中最高质量条目。",
    involvedHistory: ["L5 · 生物化学与生命起源"],
    originalSources: ["L5-BIO-001 v1.1"] },
  // L6 张力
  { id: "TENSION-L6-A", title: "张力L6-A：深海→浅海→陆地过渡（继承L5-A）",
    description: "深海热液→浅海→陆地过渡机制待 L7/L8 细化。（继承 L5-A）",
    involvedHistory: ["L6 · 生态系统与演化", "L5 · 生物化学", "L7 · 智慧种族生物学", "L8 · 史前史与考古"],
    originalSources: ["L6-ECO-001 v1.1"] },
  { id: "TENSION-L6-B", title: "张力L6-B：主起源点排序（继承L5-B）",
    description: "南环海Φ泵送效率若更高，主起源点排序需重新评估。（继承 L5-B）",
    involvedHistory: ["L6 · 生态系统与演化", "L5 · 生物化学", "L4 · 海洋学"],
    originalSources: ["L6-ECO-001 v1.1"] },
  { id: "TENSION-L6-C", title: "张力L6-C：Φ双重含义持续区分（继承L3-D）",
    description: "Φ双重含义须下游持续区分；本层文档已在步骤4与L6.001注释。（继承 L3-D）",
    involvedHistory: ["L6 · 生态系统与演化", "L3 · 大气与气候"],
    originalSources: ["L6-ECO-001 v1.1"] },
  { id: "TENSION-L6-D", title: "张力L6-D：生态繁荣 vs 过度利用临界张力",
    description: "高Φ区同时是生态热点与文明热点，需区分「生态繁荣」与「过度利用」临界张力。",
    involvedHistory: ["L6 · 生态系统与演化", "L9 · 古代史", "L15 · 经济与资源体系"],
    originalSources: ["L6-ECO-001 v1.1"] },
  { id: "TENSION-L6-E", title: "张力L6-E：顶级凝化者强度参数窗口待OP-L6-002解决",
    description: "顶级凝化者强度参数窗口待 OP-L6-002 解决。",
    involvedHistory: ["L6 · 生态系统与演化", "L7 · 智慧种族生物学"],
    originalSources: ["L6-ECO-001 v1.1"] },
  // L7 张力
  { id: "TENSION-L7-A", title: "张力L7-A：重力数值来源统一引用L1.002-b",
    description: "重力数值来源应统一引用 L1.002-b 而非 L2.001，下游引用须注意。",
    involvedHistory: ["L7 · 智慧种族生物学", "L1 · 宇宙学与恒星系"],
    originalSources: ["BIO-007 v1.1"] },
  { id: "TENSION-L7-B", title: "张力L7-B：Φ感知「弱、局部、分布式」定义",
    description: "Φ感知定义为「弱、局部、低分辨率、分布式凝核环综合直觉」，与强感知版本存在差距；以后续实验测量为准。",
    involvedHistory: ["L7 · 智慧种族生物学", "L16 · 宗教哲学文化"],
    originalSources: ["BIO-007 v1.1"] },
  { id: "TENSION-L7-C", title: "张力L7-C：仅对主智慧种族建模",
    description: "本层仅对主智慧种族（陆生文明缔造者）建模；若确认多智慧种族并存，须拆分为多套谱系。【已确认第二智慧种族：潮语者（L6.005），但谱系独立建模完成】",
    involvedHistory: ["L7 · 智慧种族生物学", "L6 · 生态系统与演化"],
    originalSources: ["BIO-007 v1.1", "SUPP-001 v1.0"] },
  // L8 张力
  { id: "TENSION-L8-A", title: "张力L8-A：波次2/4依赖冰期陆桥数据，时间误差±5000年",
    description: "波次2/4依赖冰期陆桥数据，L2未提供海面波动；时间误差±5000年，待 L3/L2 联合校验。",
    involvedHistory: ["L8 · 史前史与考古", "L2 · 行星地质与矿藏", "L3 · 大气与气候"],
    originalSources: ["L8-ARC-001 v1.0"] },
  { id: "TENSION-L8-B", title: "张力L8-B：铜石并用阶段自然铜来源充足性",
    description: "铜石并用阶段自然铜来源充足性未验证；待 L2/L15 资源评估。",
    involvedHistory: ["L8 · 史前史与考古", "L2 · 行星地质与矿藏", "L15 · 经济与资源体系"],
    originalSources: ["L8-ARC-001 v1.0"] },
  { id: "TENSION-L8-C", title: "张力L8-C：谱系分化时间类比地球语言演变速率",
    description: "谱系分化时间基于地球语言演变速率类比；P3 年短可能导致 10–20% 误差，待 L14 接入后修正。",
    involvedHistory: ["L8 · 史前史与考古", "L14 · 语言与文字系统"],
    originalSources: ["L8-ARC-001 v1.0"] },
  { id: "TENSION-L8-D", title: "张力L8-D：南环海生命起源与陆地谱系上游连接",
    description: "若 L5/L6 确认南环海生命起源与陆地谱系上游连接，起源地优先级排序可能反转。",
    involvedHistory: ["L8 · 史前史与考古", "L5 · 生物化学与生命起源", "L6 · 生态系统与演化"],
    originalSources: ["L8-ARC-001 v1.0"] },
  // L10 张力
  { id: "TENSION-L10-A", title: "张力L10-A：凝脊山口具体海拔与宽度未量化",
    description: "凝脊山口的具体海拔与宽度尚未量化，仅定性描述为「唯一低海拔通道」，待后续版本补充地形剖面数据。",
    involvedHistory: ["L10 · 地理与地缘结构"],
    originalSources: ["L10-GEO-001 v1.0"] },
  // L9 张力
  { id: "TENSION-L9-A", title: "张力L9-A：建国时间与谱系分化之间的1.3-4.5万年空白期",
    description: "[L9.001] 五大文明的建国时间跨度（7000–5500年前）与 [L8.004] 谱系分化时间（6.5万–2万年前）之间存在约 1.3–4.5 万年的「空白期」，此空白期内各谱系的具体社会演化路径尚未填充。建议 L9 v1.1 或 L8 补充中石器晚期至新石器时代的社会组织演化细节。",
    involvedHistory: ["L9 · 古代史", "L8 · 史前史与考古"],
    originalSources: ["L9-HIS-001 v1.0"] },
  { id: "TENSION-L9-B", title: "张力L9-B：维罗「技术最先进」定性判断未量化",
    description: "维罗矿业王权「技术最先进」的定性判断依赖 [L2.003-a] 凝晶矿富集程度，但具体产量与技术转化率未量化，待 L12 工业史回溯校验。",
    involvedHistory: ["L9 · 古代史", "L2 · 行星地质与矿藏", "L12 · 近代史 / 工业化时代"],
    originalSources: ["L9-HIS-001 v1.0"] },
  // L11 张力
  { id: "TENSION-L11-A", title: "张力L11-A：四大帝国疆域范围未与地图坐标精确对应",
    description: "[L11.001] 四大帝国的疆域范围仅作定性描述，未与 [L10.001] 地图坐标精确对应，建议后续版本补充边界坐标。",
    involvedHistory: ["L11 · 中世纪史 / 帝国时代", "L10 · 地理与地缘结构"],
    originalSources: ["L11-EMP-001 v1.0"] },
  { id: "TENSION-L11-B", title: "张力L11-B：凝晶矿枯竭机制未经L2地质层验证",
    description: "凝晶矿「枯竭」机制（开采速率 > Φ补充速率）为本层原创推论，未经 L2 地质层验证 Φ 补充速率具体数值，建议 L2 或 L15 后续版本补充定量模型。",
    involvedHistory: ["L11 · 中世纪史 / 帝国时代", "L2 · 行星地质与矿藏", "L15 · 经济与资源体系"],
    originalSources: ["L11-EMP-001 v1.0"] },
  // L12 张力
  { id: "TENSION-L12-A", title: "张力L12-A：CDD理论发现时间线压缩",
    description: "[L12.003] CDD 理论发现时间线（约300–120年前跨度180年）压缩了通常科学革命所需的更长时间尺度，需在下一版本中补充具体的关键人物/机构/实验节点以增强可信度。",
    involvedHistory: ["L12 · 近代史 / 工业化时代"],
    originalSources: ["L12-IND-001 v1.0"] },
  { id: "TENSION-L12-B", title: "张力L12-B：区域体系政体形式与L16价值观未建因果",
    description: "[L12.001] 五大区域体系的具体政体形式（联邦/共和国/邦联/王国）尚未与 [L16] 宗教哲学层的价值观演化建立明确因果关系，待 L16 回溯校验。",
    involvedHistory: ["L12 · 近代史 / 工业化时代", "L16 · 宗教、哲学、文化"],
    originalSources: ["L12-IND-001 v1.0"] },
  // L13 张力
  { id: "TENSION-L13-A", title: "张力L13-A：AI研发时间线压缩（P3历法换算校验）",
    description: "[L13.001] AI 研发时间线压缩（约80年前半导体基础到约15年前第一代通用AI，仅65年），是否与 [L12.003] 科学革命180年跨度的节奏一致，需要下一版本校验 P3 年历法换算是否已充分应用（参考 [L8.002] P3 年比地球快约1倍的文化演化节律）。",
    involvedHistory: ["L13 · AI 临界事件", "L12 · 近代史 / 工业化时代", "L8 · 史前史与考古"],
    originalSources: ["L13-AGI-001 v1.0"] },
  { id: "TENSION-L13-B", title: "张力L13-B：「凝界公约」运作机制与L17的直接接口依赖",
    description: "「凝界公约」作为全球治理框架的具体运作机制尚未细化，与 [L17] 当代世界的地缘政治细节存在直接接口依赖，需 L17 统一展开。",
    involvedHistory: ["L13 · AI 临界事件", "L17 · 当代世界"],
    originalSources: ["L13-AGI-001 v1.0"] },
  // L14 张力
  { id: "TENSION-L14-A", title: "张力L14-A：4套文字系统具体字符样本未设计",
    description: "4套独立/半独立文字系统的具体字符样本尚未设计，需美术/字体设计层面的后续创作补充。",
    involvedHistory: ["L14 · 语言与文字系统"],
    originalSources: ["L14-LNG-001 v1.0"] },
  // L15 张力
  { id: "TENSION-L15-A", title: "张力L15-A：「资源诅咒」乐观化推论的制度脆弱性",
    description: "本层「资源诅咒」叙事（维罗的枯竭教训催生可持续制度）是乐观化推论，现实世界资源政治史更常见制度失灵而非制度成功。建议下游 L17 在描写当代冲突时保留一定的制度脆弱性张力，避免世界观过度乌托邦化。",
    involvedHistory: ["L15 · 经济与资源体系", "L17 · 当代世界"],
    originalSources: ["L15-ECO-001 v1.0"] },
  // L16 张力
  { id: "TENSION-L16-A", title: "张力L16-A：宗教哲学体系现代信众规模与地理分布未量化",
    description: "本层四大宗教/哲学体系的现代信众规模、地理分布未量化，仅作定性描述，待 L17 细化。",
    involvedHistory: ["L16 · 宗教、哲学、文化", "L17 · 当代世界"],
    originalSources: ["L16-REL-001 v1.0"] },
  { id: "TENSION-L16-B", title: "张力L16-B：「科学兼容度决定存续能力」规律为社会学外推",
    description: "[L16.004]「科学兼容度决定存续能力」的规律为本层原创推论，逻辑自洽但属于社会学外推而非 CDD 物理直接推导，标注为 TIER 3 中相对薄弱的一环。建议后续版本补充跨信仰的比较方法论。",
    involvedHistory: ["L16 · 宗教、哲学、文化"],
    originalSources: ["L16-REL-001 v1.0"] },
  // L17 全局张力
  { id: "TENSION-L17-A", title: "张力L17-A：历史进程「和平红利」倾向 vs 微观叙事戏剧性需求",
    description: "本世界的历史进程呈现较强的「和平红利」倾向（L12.004 无大规模战争、L13.002 国际合作而非军备竞赛），这是 L11-L13 层级中多次出现的乐观化叙事选择（另见张力 L15-A）。建议后续创作者在扩展具体情节（小说、论文案例）时，可以在不违反已确立宏观事实的前提下，于地方性/个体性叙事层面引入更多冲突张力，避免宏观历史真实性与微观叙事戏剧性的失衡。",
    involvedHistory: ["L17 · 当代世界", "L12 · 近代史", "L13 · AI临界事件", "L15 · 经济与资源体系"],
    originalSources: ["L17-CUR-001 v1.0（全局张力）"] },
  { id: "TENSION-L17-B", title: "张力L17-B：OP-004 第二智慧种族的级联修订风险（结构性不确定）",
    description: "[OP-004] 第二智慧种族问题若后续任何一层（回溯 L6/L7 甚至 L1 宇宙学的「Φ富集星云是否孕育独立演化谱系」）确认存在更多智慧种族，将对 L8-L17 全部历史叙事产生级联式修订需求。属于本世界观当前最大的结构性不确定因素。【SUPP-001 已确认第二智慧种族「潮语者」，但更大范围的「更多智慧种族」可能性仍保留为结构风险】",
    involvedHistory: ["L17 · 当代世界", "L6 · 生态系统与演化", "L7 · 智慧种族生物学", "L8-L17 全部历史层"],
    originalSources: ["L17-CUR-001 v1.0（全局张力）", "SUPP-001 v1.0"] },
];

for (const t of TENSIONS) {
  const conflict = {
    id: t.id,
    title: t.title,
    status: "PENDING RESOLUTION",
    description: t.description,
    involvedEvents: [],
    involvedHistory: t.involvedHistory,
    originalSources: t.originalSources,
    interpretations: [],
  };
  if (addConflictIfNotExists(conflict)) addedConflicts++;
}
console.log(`  新增已知张力：${addedConflicts}`);

// ============ 九、时间线提取 ============
console.log("\n========== 九、时间线条目 ==========");
let addedTimeline = 0;
const TIMELINE_ENTRIES = [
  // 宇宙学 / 地质年代
  { era: "宇宙学", date: "112亿年前", title: "宇宙诞生", description: "CDD 宇宙当前年龄约112亿年。从原始Φ涨落经 L-2 凝化方程正反馈，自发形成恒星与星系结构。", canonTier: "TIER 2", relatedIds: ["L1-FACT-005"] },
  { era: "宇宙学", date: "54亿年前", title: "母恒星（K1V）形成", description: "母恒星形成，类型 K1V，质量 0.92 M☉，表面温度 5150K，寿命约170亿年，Φ波通量效率高于 G 型星。", canonTier: "TIER 2", relatedIds: ["L1-FACT-001"] },
  { era: "地质史", date: "50亿年前", title: "P3 形成", description: "主行星 P3 形成，轨道半径 0.62 AU，公转周期 185.8 天；质量 1.3 M⊕，半径 6950 km，表面重力 1.08g。", canonTier: "TIER 2", relatedIds: ["L1-FACT-002A", "L1-FACT-002B"] },
  { era: "地质史", date: "50–42亿年前", title: "熔融定型纪（P3 核幔分异）", description: "P3 地质年代第一纪：核幔分异、初始地壳形成；大陆未形成，全球岩浆海洋逐渐冷却。", canonTier: "TIER 2", relatedIds: ["L2-FACT-004"] },
  { era: "地质史", date: "42–28亿年前", title: "克拉通成核纪", description: "P3 地质年代第二纪：稳定大陆核与古山链形成。P3 大陆框架开始出现。", canonTier: "TIER 2", relatedIds: ["L2-FACT-004"] },
  { era: "生命起源", date: "42–43亿年前（克拉通成核纪初期）", title: "生命起源（双起源事件）", description: "①主起源：中央海洋中脊深海热液喷口群（CNP凝肽核酸+双层凝散膜+Φ汲取代谢）；②第二起源：南环海潮汐混合喷口独立 CNP 起源，谱系完全独立（收敛而非同源）。", canonTier: "TIER 3", relatedIds: ["L5-FACT-004", "L5-FACT-004B", "L4-FACT-002"] },
  { era: "地质史", date: "28–12亿年前", title: "板块分裂纪", description: "P3 地质年代第三纪：强双卫星潮汐驱动板块裂解、热液成矿活跃期，凝晶矿等战略矿床初步富集。", canonTier: "TIER 2", relatedIds: ["L2-FACT-004", "L2-FACT-003A"] },
  { era: "地质史", date: "12亿年前至今", title: "矿化成熟纪", description: "P3 地质年代第四纪：当前大陆框架成型（一主两次级+多岛弧海陆格局），矿床反复再富集，凝晶矿达到可开采浓度。", canonTier: "TIER 2", relatedIds: ["L2-FACT-004", "L2-FACT-001"] },
  // 史前史
  { era: "史前史", date: "7–8万年前", title: "波次0：起源核（阿斯兰东缘）", description: "智慧种族起源核心区：阿斯兰大陆东缘碰撞造山前缘带（20–35°N）。S0 起源人群在此定居，最早使用工具与火。", canonTier: "TIER 3", relatedIds: ["L8-FACT-001", "L8-FACT-001B"] },
  { era: "史前史", date: "6–7万年前", title: "波次1：中央海北岸扩散", description: "S0起源群沿Φ梯度分裂迁徙，S1中央海群（~6.5万年前）抵达中央海北岸大贝冢区域。", canonTier: "TIER 3", relatedIds: ["L8-FACT-001B", "L8-FACT-004"] },
  { era: "史前史", date: "5–6万年前", title: "波次2：维罗北缘扩散", description: "S2维罗群（~5.5万年前）通过陆桥抵达维罗北缘碰撞带，黑曜石工场遗迹是该波次标志。", canonTier: "TIER 3", relatedIds: ["L8-FACT-001B", "L8-FACT-003"] },
  { era: "史前史", date: "4–5万年前", title: "波次3：维罗西海岸扩散", description: "S2维罗群进一步沿海岸向南扩散至维罗西海岸，开始适应温带过渡高原环境。", canonTier: "TIER 3", relatedIds: ["L8-FACT-001B"] },
  { era: "史前史", date: "3–4万年前", title: "波次4：诺弧高原扩散", description: "S3诺弧群（~4.5万年前）抵达近北极诺弧高原古地块拼接区，岩棚群成为文化核心遗址。", canonTier: "TIER 3", relatedIds: ["L8-FACT-001B", "L8-FACT-003"] },
  { era: "史前史", date: "2–3万年前", title: "波次5：黑潮弧群岛链扩散", description: "S4黑潮群（~3万年前）通过「踏脚石」式岛链跳跃穿越中央海东侧，抵达黑潮弧群火山岛链。", canonTier: "TIER 3", relatedIds: ["L8-FACT-001B", "L10-FACT-001"] },
  { era: "史前史", date: "1–2万年前", title: "波次6：阿斯兰内陆回流", description: "S5新阿斯兰群（~2万年前）从东缘起源核向西回流至阿斯兰内陆，农业驱动者。", canonTier: "TIER 3", relatedIds: ["L8-FACT-001B", "L8-FACT-004"] },
  { era: "史前史", date: "1.2–0.7万年前", title: "农业起源（新石器革命）", description: "农业起源：耕作→土壤Φ升高→Φ光合效率提升→更高产→规模扩大→Φ再升高。★★农业是人为制造局部Φ异常的第一种大规模技术。", canonTier: "TIER 3", relatedIds: ["L8-FACT-002", "L8-FACT-002B"] },
  // 古代史 L9
  { era: "古代史", date: "约7000年前", title: "双河文明立国", description: "S5 新阿斯兰群在双河交汇平台建立双河文明。农业+灌溉系统发达，人为 Φ 富集技术最早规模化应用。", canonTier: "TIER 3", relatedIds: ["L9-FACT-001"] },
  { era: "古代史", date: "约6500年前", title: "凝脊邦联形成", description: "S0 起源群后裔在阿斯兰东缘凝脊山口一带形成山地城邦联盟——凝脊邦联，凝晶矿采冶技术最早。", canonTier: "TIER 3", relatedIds: ["L9-FACT-001"] },
  { era: "古代史", date: "约6000年前", title: "维罗矿业王权立国", description: "S2 维罗群在维罗北缘矿脊建立早期集权国家——维罗矿业王权，冶金技术全球最先进。", canonTier: "TIER 3", relatedIds: ["L9-FACT-001"] },
  { era: "古代史", date: "约6000–5500年前", title: "双河 vs 凝脊邦联：凝脊山口冲突（3次）", description: "双河文明与凝脊邦联因凝脊山口控制权发生间歇性冲突，最终形成朝贡-通商关系。", canonTier: "TIER 3", relatedIds: ["L9-FACT-002"] },
  { era: "古代史", date: "约5800年前", title: "中央海贸易城邦群形成", description: "S1 中央海群后裔在中央海沿岸建立多个独立港口城邦，无统一王权，商业与航海文明兴起。", canonTier: "TIER 3", relatedIds: ["L9-FACT-001"] },
  { era: "古代史", date: "约5500年前", title: "诺弧高原祭司国形成 + 圣地免战惯例确立", description: "S3 诺弧群围绕岩棚群圣地形成政教合一的诺弧高原祭司国，最早的「圣地免战」惯例——高Φ凝迹遗址=神圣不可侵犯。", canonTier: "TIER 3", relatedIds: ["L9-FACT-001", "L9-FACT-003"] },
  { era: "古代史", date: "约5500年前", title: "冶金技术从维罗扩散至中央海城邦", description: "冶金技术从维罗矿业王权经中央海贸易网络扩散至中央海城邦群，世界第一条长途贸易线（矿石南下、谷物北上）确立。", canonTier: "TIER 3", relatedIds: ["L9-FACT-004"] },
  { era: "古代史", date: "约5300–5100年前", title: "文字系统分别独立起源（双河+维罗）", description: "双河文明（表意文字，源自农业记账符号）与维罗矿业王权（表音音节文字，源自矿物计量）分别独立发明文字。", canonTier: "TIER 3", relatedIds: ["L9-FACT-004", "L14-FACT-002"] },
  // 帝国时代 L11
  { era: "帝国时代", date: "约4800年前", title: "双河大一统王朝统一", description: "双河文明后继政权统一双河平原与凝脊邦联，建立双河大一统王朝；鼎盛期约4500–3800年前，疆域覆盖阿斯兰东部与中部全境。", canonTier: "TIER 3", relatedIds: ["L11-FACT-001", "HIS-EVT-042"] },
  { era: "帝国时代", date: "约4300年前", title: "维罗联合矿权成立", description: "维罗矿业王权吞并周边小邦形成维罗联合矿权；鼎盛期约4000–3200年前，凭借冶金技术垄断与中央海贸易网络控制权成为首个「技术霸权型」帝国。", canonTier: "TIER 3", relatedIds: ["L11-FACT-001"] },
  { era: "帝国时代", date: "约4000年前", title: "「凝晶资源战争」（双河大一统 vs 维罗联合矿权）", description: "持续约150年的凝晶资源战争，争夺中央海贸易主导权；最终以海洋同盟介入调停+贸易协定告终，未分胜负——PAT-C01 凝核碰撞模式实例。", canonTier: "TIER 3", relatedIds: ["L11-FACT-002", "PAT-C01", "HIS-EVT-038"] },
  { era: "帝国时代", date: "约3600年前", title: "中央海海洋同盟成立", description: "中央海城邦群中的强邦主导形成松散海上同盟——中央海海洋同盟；鼎盛期约3400–2600年前，海军控制贸易航线实现事实霸权。", canonTier: "TIER 3", relatedIds: ["L11-FACT-001"] },
  { era: "帝国时代", date: "约3300年前起", title: "维罗北缘矿脉枯竭危机", description: "维罗联合矿权凝晶矿主矿带开采强度超过 L-3 散化趋势下的自然 Φ 补充速率，帝国实力渐衰并最终于约3000年前分裂为多个继承邦国——PAT-O01 凝散周期实例。", canonTier: "TIER 3", relatedIds: ["L11-FACT-002", "TENSION-L11-B", "PAT-O01", "HIS-EVT-040"] },
  { era: "帝国时代", date: "约2200年前", title: "泛阿斯兰第二帝国成立", description: "双河文明后继政权再度统一阿斯兰全境，建立泛阿斯兰第二帝国；鼎盛期约2000–1400年前，本世界疆域最大的前现代帝国——PAT-S01 凝核帝国模式实例。", canonTier: "TIER 3", relatedIds: ["L11-FACT-001", "PAT-S01"] },
  { era: "帝国时代", date: "约2100年前", title: "泛阿斯兰第二帝国「黑潮征服战役」", description: "泛阿斯兰第二帝国跨海征服黑潮弧群诸岛，本世界首次跨海大规模军事行动；「黑潮征服战役」。", canonTier: "TIER 3", relatedIds: ["L11-FACT-002", "HIS-EVT-043"] },
  { era: "帝国时代", date: "约2000–1400年前", title: "泛阿斯兰第二帝国鼎盛期 + 历法/技术基线", description: "至鼎盛期末（约1400年前），已普及块炼铁与渗碳钢、大型灌溉水利、远洋帆船、初步文字标准化与官方历法（基于 P3 公转周期 185.8 天）、凝晶矿精密加工天文仪器。", canonTier: "TIER 3", relatedIds: ["L11-FACT-004", "L1-FACT-002C"] },
  { era: "帝国时代", date: "约1400–900年前", title: "泛阿斯兰第二帝国渐进式解体", description: "泛阿斯兰第二帝国渐进式解体，分裂为5个继承国（双河联邦、凝脊共和国、东阿斯兰王国等）——PAT-O01 凝散周期下降阶段。", canonTier: "TIER 3", relatedIds: ["L12-FACT-001", "HIS-EVT-045"] },
  // 近代史 L12
  { era: "工业化时代", date: "约900年前", title: "维罗合众国邦联重组", description: "维罗大陆经矿脉枯竭危机后完成邦联重组为「维罗合众国」，转向精密制造业与金融业——从资源诅咒教训中催生「限量开采配额制」制度伦理。", canonTier: "TIER 3", relatedIds: ["L12-FACT-001", "L15-FACT-001"] },
  { era: "工业化时代", date: "约600年前", title: "中央海联合体正式合并", description: "中央海沿岸城邦经长期同盟传统正式合并为「中央海联合体」，本世界第一个具有现代意义的主权联合体。", canonTier: "TIER 3", relatedIds: ["L12-FACT-001"] },
  { era: "工业化时代", date: "约550年前", title: "维罗合众国率先实现冶金工业化", description: "维罗合众国率先实现冶金工业化——凝晶矿精密加工技术升级为标准化生产，天文仪器工艺的工业转化。", canonTier: "TIER 3", relatedIds: ["L12-FACT-002"] },
  { era: "工业化时代", date: "约500年前", title: "黑潮共同体成立", description: "黑潮弧群诸岛组成松散的黑潮共同体，凭借航运与地热资源保持独立地位。", canonTier: "TIER 3", relatedIds: ["L12-FACT-001"] },
  { era: "工业化时代", date: "约480年前", title: "双河联邦农业机械化", description: "双河联邦实现农业机械化（灌溉系统与早期机械结合），农业盈余持续支撑工业化。", canonTier: "TIER 3", relatedIds: ["L12-FACT-002"] },
  { era: "工业化时代", date: "约420年前", title: "中央海联合体成为贸易与金融中心", description: "中央海联合体凭借航运优势成为贸易与金融中心，出现本世界首个跨国界的商业银行体系。", canonTier: "TIER 3", relatedIds: ["L12-FACT-002"] },
  { era: "工业化时代", date: "约350年前", title: "「三区并进」近代经济三极格局形成", description: "三区并进格局形成：维罗（重工业）、双河（农业与轻工业）、中央海（金融与贸易）构成本世界近代经济的三极结构。", canonTier: "TIER 3", relatedIds: ["L12-FACT-002"] },
  { era: "工业化时代", date: "约300年前", title: "维罗工匠-学者首次提出「存在某种未知场」猜想", description: "维罗合众国工匠-学者阶层在长期观测凝晶矿的Φ波弱响应现象中，首次提出「存在某种未知场」的猜想——CDD 理论发现的开端。", canonTier: "TIER 3", relatedIds: ["L12-FACT-003", "HIS-EVT-053"] },
  { era: "工业化时代", date: "约250年前", title: "中央海学者提出「凝度场」假说雏形", description: "中央海联合体学者通过系统性的潮汐-气候-矿物响应数据整合，提出「凝度场」假说雏形。", canonTier: "TIER 3", relatedIds: ["L12-FACT-003"] },
  { era: "工业化时代", date: "约200年前", title: "「维罗-双河关税战争」", description: "维罗与双河联邦因工业化速率差异引发贸易保护主义冲突，未升级为全面战争，以中央海联合体调停+建立跨国关税同盟告终。", canonTier: "TIER 3", relatedIds: ["L12-FACT-004"] },
  { era: "工业化时代", date: "约180年前", title: "凝散动力学（CDD）正式确立为科学理论", description: "跨国界学术合作（维罗实验+中央海数据分析+诺弧哲学传统）促成凝散动力学（CDD）正式确立为科学理论，凝化方程首次被数学化表述——三种早期宗教直觉向现代科学收敛。", canonTier: "TIER 3", relatedIds: ["L12-FACT-003", "HIS-EVT-056"] },
  { era: "工业化时代", date: "约120年前", title: "Φ波探测技术成熟，凝迹效应首次直接验证", description: "Φ波探测技术成熟，凝迹效应首次被仪器直接验证，考古学、地质学与物理学同时经历范式革命。", canonTier: "TIER 3", relatedIds: ["L12-FACT-003", "HIS-EVT-057"] },
  { era: "工业化时代", date: "约100年前", title: "「黑潮地热资源争端」和平解决", description: "维罗与中央海联合体因黑潮共同体地热能源开发权产生摩擦，通过诺弧高原祭司国传统中立地位的现代司法化和平解决——诺弧中立传统的现代延续。", canonTier: "TIER 3", relatedIds: ["L12-FACT-004"] },
  // AI 时代 L13
  { era: "AI 时代", date: "约80年前", title: "凝晶基半导体规模化生产", description: "维罗合众国凭借冶金工业基础与凝晶矿弱Φ响应特性，率先实现凝晶基半导体材料的规模化生产，为计算硬件提供物理基础。", canonTier: "TIER 3", relatedIds: ["L13-FACT-001"] },
  { era: "AI 时代", date: "约50年前", title: "跨区域联合实验室成立，启动「人工凝化系统」研究", description: "中央海联合体数据分析传统与维罗硬件能力结合，成立跨区域联合实验室，开始系统性的「人工凝化系统」研究。", canonTier: "TIER 3", relatedIds: ["L13-FACT-001"] },
  { era: "AI 时代", date: "约15年前", title: "「凝一号（NingOne）」训练完成 + 「零日凝峰」Φ异常事件", description: "第一代通用AI「凝一号（NingOne）」训练完成。同期发生「零日凝峰（Day Zero Peak）」——持续11天、强度超出历史记录的局部Φ异常峰值，为CDD「AI是凝化方程新临界点」的首次实证事件，三重印证通过。", canonTier: "TIER 3", relatedIds: ["L13-FACT-001", "L13-FACT-004", "HIS-EVT-061", "OP-052"] },
  { era: "AI 时代", date: "约9年前", title: "「凝三号」实现自我改进能力 → AI临界事件正式发生", description: "第二代AI系统「凝三号」实现自我改进能力的初步展现，标志本世界AI临界事件正式发生。", canonTier: "TIER 3", relatedIds: ["L13-FACT-001"] },
  { era: "AI 时代", date: "约8年前", title: "「凝界公约」签署 → 全球性AI治理框架", description: "五大区域体系全部签署「凝界公约」（Condensation Boundary Convention）——本世界首个全球性技术治理框架。维罗硬件+中央海资本形成「双核心」AI产业格局，诺弧转型AI伦理中心，黑潮成为算力中心。", canonTier: "TIER 3", relatedIds: ["L13-FACT-002", "HIS-EVT-063"] },
  // 当代 L17（当前为0点）
  { era: "当代世界", date: "当代（当前）", title: "L17 · 多极均势 + AI 竞合 + AI自我认知开放", description: "五大区域体系在凝界公约框架下维持多极均势。黑潮算力经济崛起（OP-L13-005）。OP-L13-001 AI自我认知「有意保持开放」。SUPP-001 补完完成，世界观第一轮构建收官。", canonTier: "TIER 3", relatedIds: ["L17-FACT-001", "L17-FACT-005", "OP-L13-001", "OVERVIEW-MASTER-CLOSURE"] },
];

for (const entry of TIMELINE_ENTRIES) {
  const key = `${entry.era}|${entry.date}|${entry.title}`;
  if (!oldTimelineIds.has(key)) {
    newTimeline.push(entry);
    addedTimeline++;
  }
}
console.log(`  新增时间线：${addedTimeline}`);

// ============ 十、变更记录（Master 末尾表） ============
console.log("\n========== 十、变更记录提取 ==========");
let addedChangeLog = 0;
const CHANGE_LOG_ENTRIES = [
  { id: "CHANGE-v1.0", description: "v1.0 初始版本，建立CDD公理与17层大纲框架。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.1", description: "v1.1 L1 宇宙学与恒星系升格为 TIER 2 已验证；写入 L1.001–L1.006 全部接口事实（含恒星参数、P3轨道、双卫星系统、Φ波速度=c）；更新层级总览状态标记。依据：L1-COS-001 v1.1（数值12/12项独立验证通过）。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.2", description: "v1.2 L2 行星地质与矿藏升格为 TIER 2 已验证；写入 L2.001–L2.005 全部接口事实（海陆格局、7大板块、凝晶矿等4类矿物、地质四纪、高Φ文明候选区）；新增4项弱张力（A/B/C/D）；继承8项开放问题。依据：L2-GEO-001 v1.0。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.3", description: "v1.3 L3 大气与气候收录为 TIER 3；写入 L3.001–L3.004（5气候带、季风洋流、8类生物群系气候条件、Φ波衰减工作模型）；新增跨文档发现 P3自转周期为L1遗漏事实（OP-L1-NEW-001，影响L3/L4/L6/L7）；记录Φ双重含义风险；新增张力L3-C/D。依据：L3-ATM-001 v1.0。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.4", description: "v1.4 L4 海洋学收录为 TIER 3；写入 L4.001–L4.004（三大洋盆深度、深海高Φ区三候选、海洋化学三层结构、双卫星潮汐周期）；登记首个PAT候选条目「深压凝核」模式；新增张力L4-A/B/C。依据：OCE-001 v1.0（公理一致7/7项）。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.5", description: "v1.5 L5 生物化学与生命起源升格为 TIER 3 正式收录；v1.0全部8项修正完成；时间偏差消除；导入格式规范化；登记 PAT-候选-002「Φ光合双天线」；L5.003候选升TIER 2。依据：L5-BIO-001 v1.1（四项检验全部通过）。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.6", description: "v1.6 L6 生态系统与演化收录为 TIER 3；两份v1.0草稿合并为v1.1；修正TIER 2过高自标、凝核器官假说移出事实表、Φ双重含义注释全覆盖；写入L6.001-004（5类群系、Φ流动图、5门类演化树、智慧前驱物种）；新增OP-L6-001~009。依据：L6-ECO-001 v1.1。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.7", description: "v1.7 L7 智慧种族生物学收录为 TIER 3；v1.0修正4项（TIER降级、数值估算加注）；首次正式作答OP-001（Φ感知：有限局部分布式凝核环）；写入L7.001-004；新增OP-L7-001~010。依据：BIO-007 v1.1（四项检验通过，OP-001历史性作答）。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.8", description: "v1.8 L9–L17 一次性全部完成，世界观第一轮构建收官。按依赖顺序生成：L10地理→L9古代史→L11帝国→L12近代→L13 AI临界事件→L14语言/L15经济/L16宗教哲学→L17当代世界。核心亮点：①「零日凝峰」AI诞生时的全球Φ异常事件三重实证；②诺弧高原从史前岩棚壁画到当代AI伦理中心的完整历史連续性链条；③维罗矿脉枯竭→配额制→散化保守主义完整CDD资源诅咒叙事；④世界观收官陈述回扣L0第一原理，形成完整闭环。全局自检14项一致性核查通过。", type: "VERSION RELEASE" },
  { id: "CHANGE-v1.9", description: "v1.9 SUPP-001 一次性解决四项遗留开放问题。①OP-L1-NEW-001（P3自转周期30.4小时，新增L1.002-c，L3.001气候带同步修订，零回溯冲突）；②OP-004（第二智慧种族潮语者，新增L6.005+L5.004-b+L7.005，零级联修订）；③OP-L6-009（散极生物L6.006，与CNP稳定上限统一为L-3公理同一原理）；④OP-L5-002（南环海独立第二起源，收敛而非同源）；OP-L13-001（AI自我认知）按设计保持有意开放，新增L13.005-007结构化现状框架。全局自检9/9一致性核查通过，零非预期级联修订。", type: "VERSION RELEASE" },
];

// 检查 encyclopedia changeLog 是否已有
const oldChangelogIds = new Set(oldEncyclopedia.changeLog.map(c => c.id));
for (const entry of CHANGE_LOG_ENTRIES) {
  if (!oldChangelogIds.has(entry.id)) {
    newChangeLog.push(entry);
    addedChangeLog++;
  }
}
console.log(`  新增变更记录：${addedChangeLog}`);

// ============ 组装最终 encyclopedia.json ============
console.log("\n========== 组装最终数据 ==========");
// 最终 articles（旧 + 新）
const finalArticles = [...oldEncyclopedia.articles, ...newArticles];
// 确保 newArticles 中的 related 都正确（已经在前面处理了 OVERVIEW回填）
// 对 newArticles 中仍引用的 ID，如果存在于新 Articles 中也可以关联
const allArticleIds = new Set(finalArticles.map(a => a.id));

// 最终 OPs
const finalOps = [...oldEncyclopedia.openQuestions, ...newOps];
// 最终 Conflicts
const finalConflicts = [...oldEncyclopedia.canonConflicts, ...newConflicts];
// canonicalMysteries 不变
const finalMysteries = [...oldEncyclopedia.canonicalMysteries];
// 最终 Timeline
const finalTimeline = [...oldEncyclopedia.timeline, ...newTimeline];
// 最终 ChangeLog
const finalChangeLog = [...oldEncyclopedia.changeLog, ...newChangeLog];
// sources 不变 + 追加 Master
const finalSources = [...oldEncyclopedia.sources];
if (!finalSources.find(s => /CDD_World_Master/.test(s.ref))) {
  finalSources.push({
    ref: "CDD_World_Master.md v1.9",
    title: "CDD 世界构建主文档 v1.9（含 SUPP-001 v1.0 补完）",
    canonicality: "Master single-file assembly (TIER 0–7 mixed; L0 = TIER 0 绝对不可修改)",
    description: "CDD 世界观第一轮构建（L0-L17）加 SUPP-001 补完的完整 Master 文档。包含接口事实表、开放问题注册表、历史模式目录、协作规则系统与AI工作指令模板。",
  });
}
// canonRegistry 沿用
const finalCanonRegistry = oldEncyclopedia.canonRegistry;

const finalEncyclopedia = {
  generatedAt: new Date().toISOString(),
  version: "2.1.0-master-merge",
  sourceArchive: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0.md + CDD_World_Master.md v1.9 (SUPP-001)",
  counts: {
    articles: finalArticles.length,
    openQuestions: finalOps.length,
    canonConflicts: finalConflicts.length,
    canonicalMysteries: finalMysteries.length,
    timelineEntries: finalTimeline.length,
  },
  articles: finalArticles,
  openQuestions: finalOps,
  canonConflicts: finalConflicts,
  canonicalMysteries: finalMysteries,
  timeline: finalTimeline,
  sources: finalSources,
  canonRegistry: finalCanonRegistry,
  changeLog: finalChangeLog,
};

console.log(`  Articles: ${oldEncyclopedia.articles.length} → ${finalArticles.length}（新增 ${newArticles.length}）`);
console.log(`  OPs: ${oldEncyclopedia.openQuestions.length} → ${finalOps.length}（新增 ${newOps.length}）`);
console.log(`  Conflicts: ${oldEncyclopedia.canonConflicts.length} → ${finalConflicts.length}（新增 ${newConflicts.length}）`);
console.log(`  Mysteries: ${finalMysteries.length}（不变）`);
console.log(`  Timeline: ${oldEncyclopedia.timeline.length} → ${finalTimeline.length}（新增 ${newTimeline.length}）`);
console.log(`  ChangeLog: +${newChangeLog.length}`);
console.log(`  Skipped existing articles: ${skippedIds.length}`);

// 写入 encyclopedia.json
writeJson(ENCYCLOPEDIA_PATH, finalEncyclopedia);
console.log("✓ encyclopedia.json 已写入");

// ============ 重建 categories.json ============
console.log("\n========== 重建 categories.json ==========");
const byCategory = {};
for (const a of finalArticles) {
  if (!byCategory[a.category]) byCategory[a.category] = [];
  byCategory[a.category].push({ id: a.id, slug: a.slug, title: a.title, canonTier: a.canonTier });
}
// 确保所有需要的 category 都存在
for (const cat of ["science", "world", "history", "people", "civilizations", "institutions", "society", "modern-world", "concept"]) {
  if (!byCategory[cat]) byCategory[cat] = [];
}
writeJson(CATEGORIES_PATH, byCategory);
console.log(`  categories.json 包含 ${Object.keys(byCategory).length} 个分类：`);
for (const [cat, list] of Object.entries(byCategory)) {
  console.log(`    ${cat}: ${list.length} 篇`);
}

// ============ 重建 search-index.json ============
console.log("\n========== 重建 search-index.json ==========");
const searchIndex = finalArticles.map(a => ({
  id: a.id,
  slug: a.slug,
  type: a.type,
  category: a.category,
  title: a.title,
  titleEn: a.titleEn || "",
  aliases: a.aliases || [],
  canonTier: a.canonTier,
  canonStatusRaw: a.canonStatusRaw,
  summary: a.summary || "",
  searchText: [
    a.title,
    a.titleEn,
    ...(a.aliases || []),
    a.summary,
    a.id,
    (a.body || []).map(b => b.text || (b.list || []).join(" ")).join(" "),
  ].filter(Boolean).join(" \n "),
}));
writeJson(SEARCH_INDEX_PATH, searchIndex);
console.log(`  search-index.json: ${searchIndex.length} entries`);

// ============ 写出 NEW-IDS.txt ============
console.log("\n========== 写出 NEW-IDS.txt ==========");
const newIdText = newArticleIds.join("\n");
writeFileSync(NEW_IDS_PATH, newIdText, "utf-8");
console.log(`  NEW-IDS.txt: ${newArticleIds.length} 条新增 ID`);
if (newArticleIds.length > 0) {
  console.log("  前20条：");
  newArticleIds.slice(0, 20).forEach(id => console.log(`    ${id}`));
  if (newArticleIds.length > 20) console.log(`    ... and ${newArticleIds.length - 20} more (see NEW-IDS.txt)`);
}

// ============ 输出 MERGE SUMMARY 到控制台 ============
console.log("\n\n```");
console.log("=== MERGE SUMMARY ===");
console.log(`原 articles: ${oldEncyclopedia.articles.length}，新增：${newArticles.length}，最终：${finalArticles.length}`);
console.log(`原 openQuestions: ${oldEncyclopedia.openQuestions.length}，新增：${newOps.length}，最终：${finalOps.length}`);
console.log(`原 canonConflicts: ${oldEncyclopedia.canonConflicts.length}，新增：${newConflicts.length}，最终：${finalConflicts.length}`);
console.log(`原 canonicalMysteries: ${oldEncyclopedia.canonicalMysteries.length}，新增：0，最终：${finalMysteries.length}`);
console.log(`原 timeline: ${oldEncyclopedia.timeline.length}，新增：${newTimeline.length}，最终：${finalTimeline.length}`);
console.log(`新增 changeLog 条目：${newChangeLog.length}`);
console.log(`已存在跳过的接口事实条目：${skippedIds.length}`);
console.log("Next.js build 结果：待运行（见后续步骤）");
if (newArticleIds.length > 0) {
  console.log("新 ID 列表（前20）：");
  newArticleIds.slice(0, 20).forEach(id => console.log(`  ${id}`));
}
console.log("```");
