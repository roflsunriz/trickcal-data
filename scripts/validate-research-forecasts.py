from __future__ import annotations

import html
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
TAG_RE = re.compile(r"<[^>]+>")

BASE_COUNTS = {
    13: 18,
    14: 21,
    15: 24,
}
RESEARCH_MULTIPLIERS = {
    "感性コア": 11,
    "金の匙": 10,
    "徹夜アイマスク": 10,
    "キャラのハンコ": 16,
}
RAW_MULTIPLIERS = {
    "サラサラの鉄粉": 171,
    "パリパリの金箔": 66,
    "再生プラスチック": 159,
    "銅の匙": 90,
    "睡眠アイマスク": 10,
    "固い石": 0,
    "やわらか粘土": 160,
    "曲がったもの": 96,
}
PROCESSING_MULTIPLIERS = {
    "MUSIMチップ": 11,
    "バラバラの基板": 22,
    "柔らか金属": 53,
    "バッテリーパック": 10,
    "曲がった針金": 30,
    "S字半導体": 10,
    "地球から来た鉛": 50,
    "こねこね粘土": 16,
    "LED電球": 0,
    "EGOブロック": 32,
    "手形": 48,
}


def plain_text(value: str) -> str:
    return " ".join(html.unescape(TAG_RE.sub("", value)).split())


def table_rows(section: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in section.splitlines():
        if not line.startswith("|"):
            continue
        cells = [plain_text(cell) for cell in line.strip("|").split("|")]
        if cells and not set(cells[0]) <= {"-", ":"}:
            rows.append(cells)
    return rows


def number(value: str) -> int:
    match = re.search(r"[\d,]+", value)
    if match is None:
        raise RuntimeError(f"数値を読み取れません: {value}")
    return int(match.group(0).replace(",", ""))


def section(text: str, start: str, end: str | None) -> str:
    body = text.split(start, 1)[1]
    return body if end is None else body.split(end, 1)[0]


def validate_stage(stage: int, base: int) -> list[str]:
    errors: list[str] = []
    path = DOCS / f"research-stage-{stage}.md"
    text = path.read_text(encoding="utf-8")

    method_rows = table_rows(section(text, "## 予想方法", "## 1個あたり"))
    method_map = {row[0]: row for row in method_rows if row[0] in RESEARCH_MULTIPLIERS}
    for material, multiplier in RESEARCH_MULTIPLIERS.items():
        row = method_map.get(material)
        expected = base * multiplier
        if row is None or number(row[3]) != expected:
            errors.append(f"第{stage}段階 {material}: 予想研究材料は{expected}個")

    raw_rows = table_rows(
        section(text, f"## 第{stage}段階の原材料予想", "## レベル1・2加工素材")
    )
    raw_map = {row[0]: row for row in raw_rows if row[0] in RAW_MULTIPLIERS}
    for material, multiplier in RAW_MULTIPLIERS.items():
        row = raw_map.get(material)
        expected = base * multiplier
        if row is None or number(row[1]) != expected:
            errors.append(f"第{stage}段階 {material}: 原材料は{expected}個")

    processing_rows = table_rows(section(text, "## レベル1・2加工素材の必要数予想", None))
    processing_map = {
        row[0]: row
        for row in processing_rows
        if row[0] in PROCESSING_MULTIPLIERS
    }
    for material, multiplier in PROCESSING_MULTIPLIERS.items():
        row = processing_map.get(material)
        expected = base * multiplier
        if row is None or number(row[1]) != expected:
            errors.append(f"第{stage}段階 {material}: 加工素材は{expected}個")

    for stale_text in ("月間教団素材パック", "想定金額"):
        if stale_text in text:
            errors.append(f"第{stage}段階に旧予想が残っています: {stale_text}")
    return errors


def main() -> None:
    errors: list[str] = []
    for stage, base in BASE_COUNTS.items():
        errors.extend(validate_stage(stage, base))
    if errors:
        raise RuntimeError("\n".join(errors))
    print("第13～15段階の予想値は第11・12段階の実測増加則と一致します")


if __name__ == "__main__":
    main()
