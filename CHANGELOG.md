# 変更履歴

このプロジェクトの主な変更はこのファイルに記録します。

書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づきます。

## [Unreleased]

### Fixed

- CI と Dependabot の分類の実行順が前後しても更新を取りこぼさないよう、同じ PR 番号と head SHA を再照合する経路を追加した。
- Git の取得履歴が浅いと MkDocs の更新日時プラグインが警告し、strict デプロイが停止するため、Pages の checkout で全履歴を取得するようにした。

### Changed

- Pages デプロイの保守性を保つため、利用アクションを最新メジャーへ更新した（checkout v4→v7、setup-python v5→v7、upload-pages-artifact v3→v5、deploy-pages v4→v5）。
- 依存更新を安全に省力化するため、Dependabot の patch／minor PR を既存 CI の全チェック成功後に自動取り込みし、失敗ジョブを一度再実行する設定を追加した。
- 作業開始時の共通指針見落としを防ぐため、調査やコマンド実行より前に `COMMON-AGENTS.md` を先頭から末尾まで読み、EOFを確認する必須ゲートを追加した。
