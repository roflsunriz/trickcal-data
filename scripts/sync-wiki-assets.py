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
}

CARD_NAME_ALIASES = {
    "ルシ ‐ イードドリーム": "ルシ・イードドリーム",
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


def validate_unique(entries: list[dict[str, str]], kind: str) -> None:
    names = [entry["name"] for entry in entries]
    files = [entry["file"] for entry in entries]
    if len(names) != len(set(names)):
        raise RuntimeError(f"{kind}の名前が重複しています")
    if len(files) != len(set(files)):
        raise RuntimeError(f"{kind}の保存先が重複しています")


def main() -> None:
    pages = {name: fetch_text(url) for name, url in SOURCES.items()}
    apostles = parse_apostles(pages["apostles"])
    artifact_cards = parse_cards(pages["artifact_cards"], "artifacts")
    spell_cards = parse_cards(pages["spell_cards"], "spells")

    expected_counts = {
        "apostles": 82,
        "artifact_cards": 52,
        "spell_cards": 36,
    }
    actual_counts = {
        "apostles": len(apostles),
        "artifact_cards": len(artifact_cards),
        "spell_cards": len(spell_cards),
    }
    if actual_counts != expected_counts:
        raise RuntimeError(
            "攻略Wikiの件数が変わりました。DOMと追加データを確認してください: "
            f"expected={expected_counts}, actual={actual_counts}"
        )

    validate_unique(apostles, "使徒")
    validate_unique(artifact_cards, "遺物カード")
    validate_unique(spell_cards, "スペルカード")

    groups = {
        "apostles": apostles,
        "artifact_cards": artifact_cards,
        "spell_cards": spell_cards,
    }
    for entries in groups.values():
        for entry in entries:
            save_webp(entry["file"], entry["source_url"])

    manifest = {
        "retrieved_at": RETRIEVED_AT,
        "sources": SOURCES,
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
        f"スペル {len(spell_cards)}枚"
    )


if __name__ == "__main__":
    main()
