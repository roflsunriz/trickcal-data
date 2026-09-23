# 検証手順

## Dependabot 自動処理（2026-09-23）

`.github/workflows/dependabot-automation.yml` を actionlint で検査し、PR 用 workflow 名（CI）と一致することを確認する。Dependabot の patch／minor かつ全 PR チェック成功の場合だけ取り込み、major・古い SHA・再失敗は残す。

実際の Dependabot PR（#1 checkout v4→v7、#2 deploy-pages v4→v5、#3 setup-python v5→v7、#4 upload-pages-artifact v3→v5）は、CI と分類の成功を確認して手動でマージした。マージ後の main でも CI と Pages デプロイが成功し、`mkdocs build --strict` が通ることを確認した。

初回の main push では新しい PR 用 CI は成功したが、既存の Pages デプロイは `mkdocs-git-revision-date-localized-plugin` が浅い履歴を警告し、`mkdocs build --strict` で失敗した。デプロイ側の checkout を `fetch-depth: 0` に修正し、CI と Pages の両方を再確認する。

大量の Dependabot PR により CI 完了より分類が遅れる場合でも、分類後の `workflow_dispatch` が現在の PR 番号と head SHA を照合して再評価する。別の作成者、古い SHA、未完了の CI はマージしない。
