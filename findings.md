# 調査知見

- デプロイでは `scripts/build-docs.py` がGit履歴から各ページの更新日時を生成してからZensicalをstrictビルドする。浅いcheckoutでは日時が壊れるため、`.github/workflows/deploy.yml` の `fetch-depth: 0` を維持する（失敗例は [verification.md](verification.md)）。
