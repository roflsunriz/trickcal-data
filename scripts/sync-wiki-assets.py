from __future__ import annotations

import html
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = ROOT / "docs" / "assets"
USER_AGENT = "trickcal-data asset sync/1.0"
RETRIEVED_AT = datetime.now(ZoneInfo("Asia/Tokyo")).date().isoformat()

SOURCES = {
    "apostles": "https://wikiwiki.jp/thetrickal/%E4%BD%BF%E5%BE%92%E4%B8%80%E8%A6%A7",
    "artifact_cards": (
        "https://wikiwiki.jp/thetrickal/"
        "%E3%82%AB%E3%83%BC%E3%83%89/"
        "%E9%81%BA%E7%89%A9%E3%82%AB%E3%83%BC%E3%83%89"
    ),
    "spell_cards": (
        "https://wikiwiki.jp/thetrickal/"
        "%E3%82%AB%E3%83%BC%E3%83%89/"
        "%E3%82%B9%E3%83%9A%E3%83%AB%E3%82%AB%E3%83%BC%E3%83%89"
    ),
    "research_lab": (
        "https://wikiwiki.jp/thetrickal/"
        "%E7%94%9F%E7%94%A3%E3%83%A9%E3%83%9C"
    ),
}
REFERENCE_SOURCES = {
    "adventure_association": (
        "https://wikiwiki.jp/thetrickal/"
        "%E5%86%92%E9%99%BA%E5%8D%94%E4%BC%9A"
    ),
}

CARD_NAME_ALIASES = {
    "ルシ ‐ イードドリーム": "ルシ・イードドリーム",
}

RESEARCH_ITEM_ALIASES = {
    "地球から来た鉛": (),
    "サラサラの鉄粉": ("サラサラな鉄粉",),
    "バラバラの基板": ("基板",),
    "パリパリの金箔": (),
    "柔らか金属": (),
    "再生プラスチック": (),
    "曲がった針金": (),
    "銅の匙": (),
    "S電子半導体": ("S字半導体",),
    "睡眠アイマスク": (),
    "バッテリーパック": (),
    "LED電球": (),
    "MUSIMチップ": (),
    "徹夜アイマスク": (),
    "感性コア": (),
    "金の匙": (),
    "キャラのハンコ": (),
    "こねこね粘土": (),
    "EGOブロック": (),
    "やわらか粘土": (),
    "曲がったもの": (),
    "手形": (),
    "固い石": (),
}

TAG_RE = re.compile(r"<[^>]+>")
ROW_RE = re.compile(r"<tr(?:\s[^>]*)?>(.*?)</tr>", re.DOTALL | re.IGNORECASE)
CELL_RE = re.compile(r"<td(?:\s[^>]*)?>(.*?)</td>", re.DOTALL | re.IGNORECASE)
IMG_RE = re.compile(r"<img\s[^>]*>", re.IGNORECASE)
ATTR_RE = re.compile(r"([:\w-]+)\s*=\s*(?:\"([^\"]*)\"|'([^']*)')")


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}: {url}")
        return response.read()


def fetch_text(url: str) -> str:
    return fetch(url).decode("utf-8")


def attrs(tag: str) -> dict[str, str]:
    return {
        key.lower(): html.unescape(double or single)
        for key, double, single in ATTR_RE.findall(tag)
    }


def plain_text(fragment: str) -> str:
    text = TAG_RE.sub(" ", fragment)
    return " ".join(html.unescape(text).split())


def apostle_filename(image_alt: str) -> str:
    stem = Path(image_alt).stem.casefold().replace("_", "-")
    slug = re.sub(r"[^a-z0-9-]+", "-", stem).strip("-")
    if not slug:
        raise RuntimeError(f"使徒画像名を正規化できません: {image_alt}")
    return f"{slug}.webp"


def parse_apostles(page: str) -> list[dict[str, str]]:
    apostles: list[dict[str, str]] = []
    for row in ROW_RE.findall(page):
        cells = CELL_RE.findall(row)
        if len(cells) < 5:
            continue
        image_match = IMG_RE.search(cells[0])
        if image_match is None:
            continue
        image = attrs(image_match.group(0))
        if image.get("width") != "48" or image.get("height") != "48":
            continue
        name = plain_text(cells[2])
        personality = plain_text(cells[4])
        source_url = image.get("src", "")
        image_alt = image.get("alt", "")
        if not name or not personality or not source_url or not image_alt:
            continue
        apostles.append(
            {
                "name": name,
                "personality": personality,
                "file": f"apostles/{apostle_filename(image_alt)}",
                "source_url": source_url,
            }
        )
    return apostles


def parse_cards(page: str, directory: str) -> list[dict[str, str]]:
    cards: list[dict[str, str]] = []
    seen: set[str] = set()
    for tag in IMG_RE.findall(page):
        image = attrs(tag)
        if image.get("width") != "100" or image.get("height") != "100":
            continue
        name = image.get("alt", "")
        source_url = image.get("src", "")
        if not name or not source_url:
            continue
        if name.endswith(".webp"):
            name = name[:-5]
        name = CARD_NAME_ALIASES.get(name, name)
        if name in seen:
            continue
        seen.add(name)
        cards.append(
            {
                "name": name,
                "file": f"cards/{directory}/{name}.webp",
                "source_url": source_url,
            }
        )
    return cards


def parse_research_items(page: str) -> list[dict[str, object]]:
    items: dict[str, dict[str, object]] = {}
    for tag in IMG_RE.findall(page):
        image = attrs(tag)
        name = image.get("alt", "")
        source_url = image.get("src", "")
        style = image.get("style", "")
        if name not in RESEARCH_ITEM_ALIASES or "::icon/24:" not in source_url:
            continue
        sheet_match = re.search(r"::icon/24:(\d+)", source_url)
        position_match = re.search(
            r"left:\s*(-?\d+)px;\s*top:\s*(-?\d+)px",
            style,
        )
        if sheet_match is None or position_match is None:
            raise RuntimeError(f"研究素材アイコンの位置を取得できません: {name}")
        sheet = sheet_match.group(1)
        entry = {
            "name": name,
            "aliases": list(RESEARCH_ITEM_ALIASES[name]),
            "file": f"research/icon-sheet-{sheet}.webp",
            "x": int(position_match.group(1)),
            "y": int(position_match.group(2)),
            "source_url": source_url,
        }
        previous = items.get(name)
        if previous is not None and previous != entry:
            raise RuntimeError(f"研究素材アイコンの定義が重複しています: {name}")
        items[name] = entry

    missing = set(RESEARCH_ITEM_ALIASES) - set(items)
    if missing:
        raise RuntimeError(f"研究素材アイコンが見つかりません: {sorted(missing)}")
    return [items[name] for name in RESEARCH_ITEM_ALIASES]


def save_webp(relative_path: str, source_url: str) -> None:
    target = ASSETS_DIR / Path(relative_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    data = fetch(source_url)
    if len(data) < 12 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        content_type = "unknown"
        suffix = urllib.parse.urlsplit(source_url).path.rsplit(".", 1)[-1]
        raise RuntimeError(
            f"WebPではない応答です: {relative_path} "
            f"(拡張子={suffix}, 種別={content_type})"
        )
    target.write_bytes(data)


def validate_unique(
    entries: list[dict[str, object]],
    kind: str,
    *,
    allow_shared_files: bool = False,
) -> None:
    names = [entry["name"] for entry in entries]
    files = [entry["file"] for entry in entries]
    if len(names) != len(set(names)):
        raise RuntimeError(f"{kind}の名前が重複しています")
    if not allow_shared_files and len(files) != len(set(files)):
        raise RuntimeError(f"{kind}の保存先が重複しています")


def main() -> None:
    pages = {name: fetch_text(url) for name, url in SOURCES.items()}
    apostles = parse_apostles(pages["apostles"])
    artifact_cards = parse_cards(pages["artifact_cards"], "artifacts")
    spell_cards = parse_cards(pages["spell_cards"], "spells")
    research_items = parse_research_items(pages["research_lab"])

    expected_counts = {
        "apostles": 82,
        "artifact_cards": 52,
        "spell_cards": 36,
        "research_items": 23,
    }
    actual_counts = {
        "apostles": len(apostles),
        "artifact_cards": len(artifact_cards),
        "spell_cards": len(spell_cards),
        "research_items": len(research_items),
    }
    if actual_counts != expected_counts:
        raise RuntimeError(
            "攻略Wikiの件数が変わりました。DOMと追加データを確認してください: "
            f"expected={expected_counts}, actual={actual_counts}"
        )

    validate_unique(apostles, "使徒")
    validate_unique(artifact_cards, "遺物カード")
    validate_unique(spell_cards, "スペルカード")
    validate_unique(research_items, "研究素材", allow_shared_files=True)

    groups = {
        "apostles": apostles,
        "artifact_cards": artifact_cards,
        "spell_cards": spell_cards,
        "research_items": research_items,
    }
    for group_name in ("apostles", "artifact_cards", "spell_cards"):
        entries = groups[group_name]
        for entry in entries:
            save_webp(entry["file"], entry["source_url"])

    research_sheets = {
        entry["file"]: entry["source_url"]
        for entry in research_items
    }
    for relative_path, source_url in research_sheets.items():
        save_webp(relative_path, source_url)

    manifest = {
        "retrieved_at": RETRIEVED_AT,
        "sources": {**SOURCES, **REFERENCE_SOURCES},
        **groups,
    }
    manifest_path = ASSETS_DIR / "game-assets.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        "同期完了: "
        f"使徒 {len(apostles)}名、遺物 {len(artifact_cards)}枚、"
        f"スペル {len(spell_cards)}枚、研究素材 {len(research_items)}種"
    )


if __name__ == "__main__":
    main()
