from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
MANIFEST = DOCS / "assets" / "game-assets.json"

BIO_PAGES = (
    "yuuutsu.md",
    "kappatsu.md",
    "kyouki.md",
    "reisei.md",
    "junsui.md",
    "other.md",
)
PERSONALITY_CLASSES = {
    "純粋": "pure",
    "冷静": "cool",
    "狂気": "madness",
    "活発": "lively",
    "憂鬱": "gloomy",
    "裏面": "reverse",
}
APOSTLE_ALIASES = {
    "スノーキー": "スノキー",
}
CARD_NAME_FIXES = {
    "性格カ一ド【狂気】": "性格カード【狂気】",
    "癒しのペンダント": "癒やしのペンダント",
}


def read_manifest() -> dict[str, object]:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def apostle_label(
    display_name: str,
    apostles: dict[str, dict[str, str]],
) -> str:
    lookup_name = APOSTLE_ALIASES.get(display_name, display_name)
    entry = apostles.get(lookup_name)
    if entry is None:
        raise RuntimeError(f"使徒マニフェストに名前がありません: {display_name}")
    personality = entry["personality"]
    personality_class = PERSONALITY_CLASSES.get(personality)
    if personality_class is None:
        raise RuntimeError(f"未対応の性格です: {personality}")
    source = f"assets/{entry['file']}"
    return (
        f'<span class="apostle-label personality-{personality_class}">'
        f'<img src="{source}" alt="" loading="lazy">{display_name}</span>'
    )


def enrich_bio_page(
    path: Path,
    apostles: dict[str, dict[str, str]],
) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    output: list[str] = []
    for line in lines:
        cells = line.split("|")
        if (
            line.startswith("|")
            and len(cells) >= 4
            and cells[1].strip()
            and cells[1].strip() != "キャラクター"
            and set(cells[1].strip()) != {"-"}
            and "apostle-label" not in cells[1]
        ):
            name = cells[1].strip()
            cells[1] = f" {apostle_label(name, apostles)} "
            line = "|".join(cells)
        output.append(line.rstrip())
    path.write_text("\n".join(output) + "\n", encoding="utf-8")


def enrich_formation_page(
    path: Path,
    apostles: dict[str, dict[str, str]],
) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    output: list[str] = []
    for line in lines:
        cells = line.split("|")
        if line.startswith("|"):
            for index in range(1, len(cells) - 1):
                name = cells[index].strip()
                lookup_name = APOSTLE_ALIASES.get(name, name)
                if lookup_name in apostles:
                    cells[index] = f" {apostle_label(name, apostles)} "
            line = "|".join(cells)
        output.append(line.rstrip())
    path.write_text("\n".join(output) + "\n", encoding="utf-8")


def enrich_card_page(
    path: Path,
    directory: str,
    cards: dict[str, dict[str, str]],
) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    output: list[str] = []
    in_table = False
    has_image_column = False
    for line in lines:
        cells = line.split("|")
        if line.startswith("| 画像 "):
            in_table = True
            has_image_column = True
        elif line.startswith("| アイテム名"):
            in_table = True
            has_image_column = False
            cells.insert(1, " 画像 ")
            line = "|".join(cells)
        elif in_table and line.startswith("|") and len(cells) >= 4:
            first = cells[1].strip()
            if first and set(first) == {"-"}:
                if not has_image_column:
                    cells.insert(1, " :---: ")
                    line = "|".join(cells)
            elif first.startswith(":---:"):
                pass
            elif first.startswith('<img class="card-thumbnail"'):
                pass
            elif first:
                name = CARD_NAME_FIXES.get(first, first)
                entry = cards.get(name)
                if entry is None:
                    raise RuntimeError(
                        f"{directory}カードのマニフェストに名前がありません: {name}"
                    )
                cells[1] = f" {name} "
                image = (
                    f'<img class="card-thumbnail" '
                    f'src="assets/{entry["file"]}" alt="" loading="lazy">'
                )
                cells.insert(1, f" {image} ")
                line = "|".join(cells)
        output.append(line.rstrip())
    path.write_text("\n".join(output) + "\n", encoding="utf-8")


def main() -> None:
    manifest = read_manifest()
    apostles = {
        entry["name"]: entry
        for entry in manifest["apostles"]
    }
    artifact_cards = {
        entry["name"]: entry
        for entry in manifest["artifact_cards"]
    }
    spell_cards = {
        entry["name"]: entry
        for entry in manifest["spell_cards"]
    }

    for filename in BIO_PAGES:
        enrich_bio_page(DOCS / filename, apostles)
    enrich_formation_page(DOCS / "apostle-formation-table.md", apostles)
    enrich_card_page(
        DOCS / "artifact-cards.md",
        "遺物",
        artifact_cards,
    )
    enrich_card_page(
        DOCS / "spell-cards.md",
        "スペル",
        spell_cards,
    )
    print("攻略表の使徒ラベルとカード画像列を更新しました")


if __name__ == "__main__":
    main()
