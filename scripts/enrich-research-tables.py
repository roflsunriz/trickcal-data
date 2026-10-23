from __future__ import annotations

import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
MANIFEST = DOCS / "assets" / "game-assets.json"
RESEARCH_PAGES = tuple(
    DOCS / f"research-stage-{stage}.md"
    for stage in range(10, 16)
)

LAB_ITEM_RE = re.compile(
    r'<span class="lab-item" data-lab-item="[^"]+">'
    r'<span class="lab-icon"><img [^>]+></span>'
    r'([^<]+)</span>'
)


def item_label(display_name: str, entry: dict[str, object]) -> str:
    escaped_name = html.escape(display_name, quote=True)
    source = html.escape(f"assets/{entry['file']}", quote=True)
    x = int(entry["x"])
    y = int(entry["y"])
    return (
        f'<span class="lab-item" data-lab-item="{escaped_name}">'
        f'<span class="lab-icon"><img src="{source}" alt="" loading="lazy" '
        f'style="--lab-icon-x:{x}px;--lab-icon-y:{y}px"></span>'
        f"{escaped_name}</span>"
    )


def enrich_page(
    path: Path,
    lookup: dict[str, dict[str, object]],
    item_pattern: re.Pattern[str],
) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    output: list[str] = []
    for line in lines:
        line = LAB_ITEM_RE.sub(r"\1", line)
        if line.startswith("|"):
            line = item_pattern.sub(
                lambda match: item_label(match.group(0), lookup[match.group(0)]),
                line,
            )
        output.append(line.rstrip())
    path.write_text("\n".join(output) + "\n", encoding="utf-8")


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    lookup: dict[str, dict[str, object]] = {}
    for entry in manifest["research_items"]:
        names = [entry["name"], *entry["aliases"]]
        for name in names:
            if name in lookup:
                raise RuntimeError(f"研究素材名が重複しています: {name}")
            lookup[name] = entry

    item_pattern = re.compile(
        "|".join(
            re.escape(name)
            for name in sorted(lookup, key=len, reverse=True)
        )
    )
    for path in RESEARCH_PAGES:
        enrich_page(path, lookup, item_pattern)
    print("生産ラボ第10～15段階の材料・成果物画像を更新しました")


if __name__ == "__main__":
    main()
