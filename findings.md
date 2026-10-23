# 調査知見

- デプロイでは `scripts/build-docs.py` がGit履歴から各ページの更新日時を生成してからZensicalをstrictビルドする。浅いcheckoutでは日時が壊れるため、`.github/workflows/deploy.yml` の `fetch-depth: 0` を維持する（失敗例は [verification.md](verification.md)）。
- 使徒画像は攻略Wikiの使徒一覧にある48px画像、カード画像は遺物・スペル一覧にある100px画像を正本とし、`scripts/sync-wiki-assets.py` でWebP本体と `docs/assets/game-assets.json` を同期する。2026-10-23時点の実装済み件数は使徒82名、遺物52枚、スペル36枚。表示上の「スノーキー」はWiki上の「スノキー」画像へ対応させる。
- 生産ラボ第11・12段階は2026-10-23時点で解放済み。研究内容と最終素材合計は攻略Wiki「生産ラボ」の第11～第12段階および段階別総数表を正本とし、旧予想の購入パック試算は正式値と素材系統が異なるため使用しない。
