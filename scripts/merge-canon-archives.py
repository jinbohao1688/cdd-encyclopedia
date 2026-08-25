#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CDD Encyclopedia — Canon Archives Merge Script
将 E:\\CCD世界\\canon 下的 5 个详细档案合并到百科数据中。
"""

import json
import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(r"E:\CCD世界\正典\cdd-encyclopedia")
CANON = Path(r"E:\CCD世界\canon")
DATA = ROOT / "data"

# ============================================================
# Helpers
# ============================================================

def read_json(p):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def write_json(p, obj):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")

def read_text(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

def slugify(iden):
    s = str(iden).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"^-+|-+$", "", s)

# ============================================================
# Markdown parsing
# ============================================================

# Entry header patterns per file type
FILE_CONFIGS = [
    {
        "path": CANON / "characters" / "CDD_Historical_Character_Archive_v1.1.md",
        "prefix": "CHAR",
        "ref": "CDD_Historical_Character_Archive_v1.1.md",
        "type": "person",
        "category": "people",
        "entry_re": re.compile(r"^#\s+(CHAR-\d+[A-Z-]*)\s*[:：]\s*(.+)$"),
        "section_re": re.compile(r"^##\s+.+|^#\s+\d+\.\s+.+"),
    },
    {
        "path": CANON / "civilizations" / "CDD_Civilization_Archive_v1.0.md",
        "prefix": "CIV",
        "ref": "CDD_Civilization_Archive_v1.0.md",
        "type": "civilization",
        "category": "civilizations",
        "entry_re": re.compile(r"^#\s+(CIV-\d+[A-Z-]*)\s*[:：]\s*(.+)$"),
        "section_re": re.compile(r"^##\s+.+|^#\s+\d+\.\s+.+"),
    },
    {
        "path": CANON / "history" / "CDD_Historical_Event_Archive_Core_v1.0.md",
        "prefix": "HIS-EVT",
        "ref": "CDD_Historical_Event_Archive_Core_v1.0.md",
        "type": "event",
        "category": "history",
        "entry_re": re.compile(r"^#\s+(HIS-EVT-\d+[A-Z-]*)\s*[:：]\s*(.+)$"),
        "section_re": re.compile(r"^##\s+.+|^#\s+\d+\.\s+.+"),
    },
    {
        "path": CANON / "institutions" / "CDD_Institutional_Archive_v1.0.md",
        "prefix": "INS",
        "ref": "CDD_Institutional_Archive_v1.0.md",
        "type": "institution",
        "category": "institutions",
        "entry_re": re.compile(r"^##\s+(INS-\d+[A-Z-]*)\s*[:：]\s*(.+)$"),
        "section_re": re.compile(r"^###\s+.+"),
    },
    {
        "path": CANON / "society" / "CDD_Social_Life_Archive_v1.0.md",
        "prefix": "SOC",
        "ref": "CDD_Social_Life_Archive_v1.0.md",
        "type": "civilization",
        "category": "society",
        "entry_re": re.compile(r"^#\s+(SOC-\d+[A-Z-]*)\s*[:：]\s*(.+)$"),
        "section_re": re.compile(r"^##\s+.+|^#\s+\d+\.\s+.+"),
    },
]


def split_entries(text, entry_re):
    """Split markdown text into (header_line, content_lines) tuples by entry header."""
    lines = text.split("\n")
    entries = []
    current_header = None
    current_lines = []
    for line in lines:
        if entry_re.match(line):
            if current_header is not None:
                entries.append((current_header, current_lines))
            current_header = line
            current_lines = []
        elif current_header is not None:
            current_lines.append(line)
    if current_header is not None:
        entries.append((current_header, current_lines))
    return entries


def clean_heading(header_line):
    """Remove # prefix and number prefix from a section heading."""
    h = re.sub(r"^#+\s+", "", header_line).strip()
    h = re.sub(r"^\d+\.\s+", "", h)
    return h.strip()


def clean_section_text(lines):
    """Clean section body lines: strip --- separators and leading/trailing blanks."""
    result = []
    for line in lines:
        stripped = line.strip()
        if stripped == "---":
            continue
        result.append(line)
    while result and not result[0].strip():
        result.pop(0)
    while result and not result[-1].strip():
        result.pop()
    return "\n".join(result).strip()


def parse_sections(content_lines, section_re):
    """Parse entry content into list of (heading, text) tuples."""
    sections = []
    current_heading_line = None
    current_lines = []
    for line in content_lines:
        if section_re.match(line):
            if current_heading_line is not None:
                sections.append((current_heading_line, current_lines))
            current_heading_line = line
            current_lines = []
        elif current_heading_line is not None:
            current_lines.append(line)
    if current_heading_line is not None:
        sections.append((current_heading_line, current_lines))
    return sections


def sections_to_body(sections):
    """Convert parsed sections to body format: [{heading, text}]."""
    body = []
    for heading_line, content_lines in sections:
        heading = clean_heading(heading_line)
        text = clean_section_text(content_lines)
        if not text:
            text = "（本节无详细记载）"
        heading_upper = heading.upper()
        if "STORY HOOK" in heading_upper or "FICTION INTERFACE" in heading_upper:
            text = "⚠️ 以下内容仅供创作参考，不构成正典事实：\n\n" + text
        body.append({"heading": heading, "text": text})
    return body


def extract_canon_status(sections, first_section_text):
    """Extract canon status text from sections or first section fields."""
    # Look for a dedicated "Canon Status" section
    for heading_line, content_lines in sections:
        heading = clean_heading(heading_line)
        if heading.strip().upper() == "CANON STATUS":
            text = clean_section_text(content_lines)
            if text:
                return text
    # Fallback: search first section fields for Canon Status / Canon Tier
    for line in first_section_text.split("\n"):
        m = re.match(r"^-\s+(?:\*\*)?(?:Canon\s+Status|Canon\s+Tier)(?:\*\*)?\s*[:：]\s*(.+)$", line, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            val = re.sub(r"`", "", val)
            return val
    return ""


def canon_tier_from_status(status):
    """Map canon status text to a TIER value (for new entries)."""
    if not status:
        return "TIER 3"
    s = status.upper().strip()
    # Direct TIER value
    m = re.match(r"^(TIER\s*\d+)", s)
    if m:
        return m.group(1).upper().replace("  ", " ")
    # Check primary status (prefix) first — the leading word/phrase is the
    # declared canon level; later mentions are secondary context.
    if s.startswith("ESTABLISHED CANON"):
        return "TIER 2"
    if s.startswith("NEW HISTORICAL CANON"):
        return "TIER 1"
    if s.startswith("NEW CANON"):
        return "TIER 3"
    if s.startswith("RECONSTRUCT"):
        return "TIER 3"
    if s.startswith("INFERENCE"):
        return "TIER 4"
    if s.startswith("CANDIDATE"):
        return "TIER 6"
    if s.startswith("UNRESOLVED"):
        return "TIER 7"
    # Fallback: substring contains (lower confidence)
    if "NEW HISTORICAL CANON" in s:
        return "TIER 1"
    if "ESTABLISHED CANON" in s:
        return "TIER 2"
    if "NEW CANON" in s:
        return "TIER 3"
    if "RECONSTRUCT" in s:
        return "TIER 3"
    if "INFERENCE" in s:
        return "TIER 4"
    if "CANDIDATE" in s:
        return "TIER 6"
    if "UNRESOLVED" in s:
        return "TIER 7"
    return "TIER 3"


def extract_fields(first_section_text):
    """Extract key-value fields from the first section's bullet lines."""
    fields = {}
    for line in first_section_text.split("\n"):
        line = line.strip()
        # Match: - Key：Value  /  - Key: Value  /  - **Key**：Value
        m = re.match(r"^-\s+(?:\*\*)?(.+?)(?:\*\*)?\s*[:：]\s*(.+)$", line)
        if m:
            key = m.group(1).strip()
            key = re.sub(r"\*\*", "", key).strip()
            val = m.group(2).strip()
            val = re.sub(r"`", "", val).strip()
            if key and val:
                fields[key] = val
    return fields


def extract_title_and_en(title_raw):
    """Extract title and titleEn from the raw header title."""
    title_raw = title_raw.strip()
    # Check for parenthetical Latin/English name
    m = re.search(r"（([^）]+)）\s*$", title_raw)
    if m:
        inside = m.group(1).strip()
        # If it contains Latin characters, treat as titleEn
        if re.search(r"[A-Za-z]", inside):
            title = title_raw[:m.start()].strip()
            return title, inside
    return title_raw, ""


def extract_related(sections, own_id):
    """Extract related article IDs from relation-related sections."""
    relation_keywords = [
        "RELATION", "ASSOCIATED", "RIVAL", "PARTNER",
        "INTERCIVILIZATIONAL", "KNOWN RELATIONSHIP",
        "HISTORICAL EVENT", "HISTORICAL FIGURE",
        "CIVILIZATION", "EVENT RELATION", "INS RELATION",
        "CROSS-REFERENCE", "EXTERNAL RELATION",
    ]
    id_pattern = re.compile(r"\b(CHAR-\d+[A-Z-]*|CIV-\d+[A-Z-]*|HIS-EVT-\d+[A-Z-]*|INS-\d+[A-Z-]*|SOC-\d+[A-Z-]*|L\d+-FACT-\d+[A-Z-]*)\b")
    related = set()
    for heading_line, content_lines in sections:
        heading = clean_heading(heading_line).upper()
        is_relation = any(kw in heading for kw in relation_keywords)
        if is_relation:
            text = "\n".join(content_lines)
            for m in id_pattern.finditer(text):
                rid = m.group(1)
                if rid != own_id:
                    related.add(rid)
    return sorted(related)


def make_summary(first_section_text, max_len=200):
    """Take first max_len chars of the first section's text as summary."""
    text = first_section_text.strip()
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    # Cut at max_len, try to end at a line boundary
    cut = text[:max_len]
    last_nl = cut.rfind("\n")
    if last_nl > max_len // 2:
        cut = cut[:last_nl]
    return cut.strip() + "…"


# ============================================================
# Issue parsing (from history file)
# ============================================================

def parse_issues(history_text):
    """Parse Issue 001-006 from the history file's 'Canon Issues To Preserve' section."""
    # Find the issues section
    issues_start = history_text.find("# Canon Issues To Preserve")
    if issues_start < 0:
        return []
    # Find the first HIS-EVT entry after the issues section
    entry_match = re.search(r"^#\s+HIS-EVT-\d+", history_text[issues_start:], re.MULTILINE)
    if entry_match:
        issues_section = history_text[issues_start:issues_start + entry_match.start()]
    else:
        issues_section = history_text[issues_start:]

    # Split by ### Issue NNN
    issue_pattern = re.compile(r"^###\s+Issue\s+(\d+).*?[—\-–:：]\s*(.+)$", re.MULTILINE)
    matches = list(issue_pattern.finditer(issues_section))
    issues = []
    for i, m in enumerate(matches):
        issue_num = m.group(1).strip()
        issue_title = m.group(2).strip()
        content_start = m.end()
        content_end = matches[i + 1].start() if i + 1 < len(matches) else len(issues_section)
        content = issues_section[content_start:content_end].strip()
        # Remove leading/trailing dash separator lines
        content_lines = content.split("\n")
        while content_lines and re.match(r"^-{3,}\s*$", content_lines[0]):
            content_lines.pop(0)
        while content_lines and re.match(r"^-{3,}\s*$", content_lines[-1]):
            content_lines.pop()
        content = "\n".join(content_lines).strip()
        issues.append({
            "num": issue_num,
            "title": issue_title,
            "content": content,
        })
    return issues


# ============================================================
# Main merge logic
# ============================================================

def main():
    enc = read_json(DATA / "encyclopedia.json")
    articles = enc["articles"]
    article_map = {a["id"]: a for a in articles}
    existing_ids = set(article_map.keys())

    stats = {
        "updated": {"CHAR": 0, "CIV": 0, "HIS-EVT": 0, "INS": 0, "SOC": 0},
        "created": {"CHAR": 0, "CIV": 0, "HIS-EVT": 0, "INS": 0, "SOC": 0},
        "new_conflicts": 0,
        "conflict_ids_skipped": 0,
    }

    # Process each canon file
    for cfg in FILE_CONFIGS:
        prefix = cfg["prefix"]
        ref = cfg["ref"]
        art_type = cfg["type"]
        category = cfg["category"]
        entry_re = cfg["entry_re"]
        section_re = cfg["section_re"]

        text = read_text(cfg["path"])
        entries = split_entries(text, entry_re)
        print(f"  [{prefix}] 解析到 {len(entries)} 个条目")

        for header_line, content_lines in entries:
            m = entry_re.match(header_line)
            if not m:
                continue
            entry_id = m.group(1).strip()
            title_raw = m.group(2).strip()

            # Parse sections
            sections = parse_sections(content_lines, section_re)
            if not sections:
                continue

            # First section text
            first_heading_line, first_content_lines = sections[0]
            first_section_text = clean_section_text(first_content_lines)

            # Build body
            body = sections_to_body(sections)

            # Extract canon status
            canon_status_raw = extract_canon_status(sections, first_section_text)
            canon_tier = canon_tier_from_status(canon_status_raw)

            # Extract fields from first section
            new_fields = extract_fields(first_section_text)

            # Summary
            summary = make_summary(first_section_text, 200)

            # Related
            related = extract_related(sections, entry_id)

            if entry_id in existing_ids:
                # --- Update existing entry ---
                art = article_map[entry_id]
                old_tier = art.get("canonTier", "TIER 3")
                # Replace body
                art["body"] = body
                # Update summary
                if summary:
                    art["summary"] = summary
                # Merge fields: keep existing, add new keys
                for k, v in new_fields.items():
                    if k not in art.get("fields", {}):
                        art.setdefault("fields", {})[k] = v
                # Append source (avoid duplicates)
                sources = art.setdefault("sources", [])
                source_entry = {
                    "ref": ref,
                    "section": entry_id,
                    "canonicality": old_tier,
                }
                already_has = any(
                    s.get("ref") == source_entry["ref"]
                    and s.get("section") == source_entry["section"]
                    for s in sources
                )
                if not already_has:
                    sources.append(source_entry)
                stats["updated"][prefix] += 1
            else:
                # --- Create new entry ---
                title, title_en = extract_title_and_en(title_raw)
                new_article = {
                    "id": entry_id,
                    "slug": slugify(entry_id),
                    "type": art_type,
                    "category": category,
                    "title": title,
                    "aliases": [],
                    "canonTier": canon_tier,
                    "canonStatusRaw": canon_status_raw or canon_tier,
                    "summary": summary,
                    "fields": new_fields,
                    "body": body,
                    "related": related,
                    "sources": [
                        {
                            "ref": ref,
                            "section": entry_id,
                            "canonicality": canon_tier,
                        }
                    ],
                }
                if title_en:
                    new_article["titleEn"] = title_en
                articles.append(new_article)
                article_map[entry_id] = new_article
                existing_ids.add(entry_id)
                stats["created"][prefix] += 1

    # ============================================================
    # Process Issues 001-006 → canonConflicts
    # ============================================================
    history_text = read_text(CANON / "history" / "CDD_Historical_Event_Archive_Core_v1.0.md")
    issues = parse_issues(history_text)
    print(f"  解析到 {len(issues)} 个 Issue")

    existing_conflict_ids = {c["id"] for c in enc.get("canonConflicts", [])}

    for issue in issues:
        conflict_id = f"TENSION-CANON-{issue['num'].zfill(3)}"
        if conflict_id in existing_conflict_ids:
            stats["conflict_ids_skipped"] += 1
            continue
        new_conflict = {
            "id": conflict_id,
            "title": issue["title"],
            "status": "OPEN",
            "description": issue["content"],
            "involvedEvents": [],
            "involvedHistory": [],
            "originalSources": ["CDD_Historical_Event_Archive_Core_v1.0.md"],
            "interpretations": [],
        }
        enc.setdefault("canonConflicts", []).append(new_conflict)
        existing_conflict_ids.add(conflict_id)
        stats["new_conflicts"] += 1

    # ============================================================
    # Update counts and metadata
    # ============================================================
    enc["counts"]["articles"] = len(enc["articles"])
    enc["counts"]["canonConflicts"] = len(enc.get("canonConflicts", []))
    enc["generatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000000Z")
    enc["version"] = "2.2.0-canon-merge"

    # ============================================================
    # Rebuild search-index.json
    # ============================================================
    search_index = []
    for a in enc["articles"]:
        body_text = " ".join(
            b.get("text", "") or " ".join(b.get("list", []))
            for b in a.get("body", [])
        )
        search_text_parts = [
            a.get("title", ""),
            a.get("titleEn", ""),
            *a.get("aliases", []),
            a.get("summary", ""),
            a.get("id", ""),
            body_text,
        ]
        search_text = " \n ".join(p for p in search_text_parts if p)
        search_index.append({
            "id": a["id"],
            "slug": a.get("slug", ""),
            "type": a.get("type", ""),
            "category": a.get("category", ""),
            "title": a.get("title", ""),
            "titleEn": a.get("titleEn", ""),
            "aliases": a.get("aliases", []),
            "canonTier": a.get("canonTier", "TIER 3"),
            "canonStatusRaw": a.get("canonStatusRaw", ""),
            "summary": a.get("summary", ""),
            "searchText": search_text,
        })

    # ============================================================
    # Rebuild categories.json
    # ============================================================
    by_category = {}
    for a in enc["articles"]:
        cat = a.get("category", "concept")
        by_category.setdefault(cat, []).append({
            "id": a["id"],
            "slug": a.get("slug", slugify(a["id"])),
            "title": a.get("title", ""),
            "canonTier": a.get("canonTier", "TIER 3"),
        })

    # ============================================================
    # Write output files
    # ============================================================
    write_json(DATA / "encyclopedia.json", enc)
    write_json(DATA / "search-index.json", search_index)
    write_json(DATA / "categories.json", by_category)

    # ============================================================
    # Print summary
    # ============================================================
    print("\n" + "=" * 60)
    print("合并摘要")
    print("=" * 60)
    total_updated = sum(stats["updated"].values())
    total_created = sum(stats["created"].values())
    print(f"\n更新已有条目: {total_updated}")
    for prefix in ["CHAR", "CIV", "HIS-EVT", "INS", "SOC"]:
        if stats["updated"][prefix]:
            print(f"  {prefix}: {stats['updated'][prefix]}")
    print(f"\n新增条目: {total_created}")
    for prefix in ["CHAR", "CIV", "HIS-EVT", "INS", "SOC"]:
        if stats["created"][prefix]:
            print(f"  {prefix}: {stats['created'][prefix]}")
    print(f"\n新增 CanonConflict: {stats['new_conflicts']}")
    print(f"跳过(已存在)的 CanonConflict: {stats['conflict_ids_skipped']}")
    print(f"\n最终总数:")
    print(f"  articles: {enc['counts']['articles']}")
    print(f"  canonConflicts: {enc['counts']['canonConflicts']}")
    print(f"  openQuestions: {enc['counts']['openQuestions']}")
    print(f"  canonicalMysteries: {enc['counts']['canonicalMysteries']}")
    print(f"  timelineEntries: {enc['counts']['timelineEntries']}")
    print(f"  search-index entries: {len(search_index)}")
    print(f"  categories: {len(by_category)}")
    for cat, items in sorted(by_category.items()):
        print(f"    {cat}: {len(items)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
