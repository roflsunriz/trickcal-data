# 更新手順

作業前に [findings.md](findings.md) を全文読み、固有の環境・ツール・例外条件を確認する。以下は更新と復旧の手順の正本とする。


## 文書サイトの更新

`docs/` を編集したら、`python -m pip install -r requirements.txt` と `python scripts/build-docs.py` を実行し、`site/` のページと最終更新日を確認する。公開に問題が出た場合は変更コミットを revert し、Pages ワークフローを再実行する。

## ゲーム画像とカード一覧の更新

使徒・遺物カード・スペルカード・生産ラボ素材の画像は、`python scripts/sync-wiki-assets.py` で攻略Wikiから `docs/assets/` へ保存する。取得元URLと取得日は `docs/assets/game-assets.json` に記録される。スクリプトが件数差で停止した場合は、攻略Wikiで追加・削除・DOM変更を確認し、期待件数とカード文字起こしを同時に更新する。

画像を同期した後、`python scripts/enrich-doc-tables.py` で攻略表の使徒ラベル、空欄アコーディオン、カード表の画像列を更新する。続けて `python scripts/enrich-research-tables.py` を実行し、生産ラボ第10～15段階の材料・中間素材・加工成果物へ画像を付ける。

生産ラボ第13～15段階の予想値を変更した場合は、`python scripts/validate-research-forecasts.py` を実行する。第11・12段階の実測増加則、最終素材・中間素材の換算、旧第10段階ベースの購入パック試算が残っていないことを検査する。

同期後は、全画像がWebP本体であること、Markdownの `src` がローカル画像を指すこと、使徒名・性格・カード名・研究素材名の対応に欠落がないことを検査し、`python scripts/build-docs.py` で表示を確認する。問題があれば変更コミットをrevertする。攻略Wikiから削除された画像はスクリプトが自動削除しないため、マニフェストとの差分を確認してから個別に整理する。

## Dependabot PR の更新



Dependabot version update は毎月28日00:00、検証済み PR の自動マージは同日18:00（いずれも `Asia/Tokyo`）にまとめます。28日より前に自動マージせず、現在の head SHA と全 PR チェックを月末処理で再確認します。
前提は `.github/dependabot.yml` と PR 用 CI（CI）です。更新 PR の head SHA と `gh pr checks <PR番号>` の結果を確認してください。patch／minor は全チェック成功後に自動取り込みされます。初回 CI 失敗は failed jobs のみを 1 回再実行し、再失敗した PR は残して手動で修正します。

設定を変えたときは `actionlint .github/workflows/dependabot-automation.yml` と実際の PR の Actions 結果を確認します。問題があれば呼び出し先の共通 workflow SHA を直前の検証済み値へ戻すコミットを push します。取り込まれた依存更新に問題があれば通常の revert コミットで復旧します。

Pages デプロイでは各ページの更新日時を Git 履歴から算出します。`.github/workflows/deploy.yml` の checkout は `fetch-depth: 0` を維持し、`python scripts/build-docs.py` と Pages 実行結果を確認してください。

CI 完了より Dependabot の分類が遅れる場合は、`callback_workflow_file` が指す呼び出し側 workflow を `workflow_dispatch` し、同じ PR 番号・head SHA・全チェックを再確認する。呼び出し側のファイル名を変える際はこの入力も一緒に更新する。
