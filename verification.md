# 検証手順

## Zensical 文書ビルド（2026-09-27）

`python -m pip install -r requirements.txt` 後、`python scripts/build-docs.py` を実行する。`site/index.html` と代表ページで `最終更新日` が表示され、`docs/` の原本が変更されないことを確認する。Pages の checkout は全履歴を取得し、公開後は Actions と実サイトを確認する。

2026-09-27 のローカル検証では Zensical 0.0.65 の strict ビルドが成功し、Markdown 16 ページに対応する HTML 16 ページと 404 ページを生成した。既存のテンプレート上書きにトップページの更新日が表示されることを確認した。Pages 実配信は未検証。

## Dependabot 自動処理（2026-09-23）

`.github/workflows/dependabot-automation.yml` を actionlint で検査し、PR 用 workflow 名（CI）と一致することを確認する。Dependabot の patch／minor かつ全 PR チェック成功の場合だけ取り込み、major・古い SHA・再失敗は残す。

実際の Dependabot PR（#1 checkout v4→v7、#2 deploy-pages v4→v5、#3 setup-python v5→v7、#4 upload-pages-artifact v3→v5）は、CI と分類の成功を確認して手動でマージした。マージ後の main でも CI と Pages デプロイが成功し、`mkdocs build --strict` が通ることを確認した。

初回の main push では新しい PR 用 CI は成功したが、既存の Pages デプロイは `mkdocs-git-revision-date-localized-plugin` が浅い履歴を警告し、`mkdocs build --strict` で失敗した。デプロイ側の checkout を `fetch-depth: 0` に修正し、CI と Pages の両方を再確認する。

大量の Dependabot PR により CI 完了より分類が遅れる場合でも、分類後の `workflow_dispatch` が現在の PR 番号と head SHA を照合して再評価する。別の作成者、古い SHA、未完了の CI はマージしない。

## 2026-10-05: GitHub受付・READMEの整備（公開前）

- 比較元: `381b24e9b138576acaea62bdd22496c8be0b8393`（`main`）。
- 受付フォーム 2 件のYAML構造、重複キー・ID、入力型、選択肢、予約ファイル名を一括検査し、エラー0件。
- 既存の固有質問・入力例・必須条件を原文と照合。READMEのリンク・画像・コマンド・条件を確認し、裏付けがある誤記だけを訂正した。
- 既存のCI、Dependabot、labeler、ライセンスのファイル内容は比較元から変更していない。
- 製品のビルド・インストール・実機操作、GitHub上のフォーム表示、公開後CIは今回の静的検証に含めない。公開後に実際の受付表示と必要ラベルの適用を確認する。

## 2026-10-16: findings.mdへの知見分離

- AGENTS・READMEなどから移した本文を移行前のGit内容と照合し、条件・確認日・コマンド・未検証事項を保持する。移動先の参照とMarkdownの見出し・コードブロックを確認する。
- 変更範囲は文書の配置と参照。アプリのビルド・実機動作を今回再検証したとは扱わない。

- 実行結果: 移行前本文と移動後の文書を行単位で照合し、本文の欠落0件。変更文書の相対リンク・見出し参照の新規エラー0件、git diff --check成功。共通指針の記録先変更は意味の整合を別途確認した。
- GitHub上の既存Dependabot open alertsは0件。更新PRは0件で、今回の文書移行とは別の状態として確認した。新規の外部監査送信は自動承認レビューの制限により実行せず、GitHub上の既存警告確認で補完した。これはローカル依存監査・最新版照会の成功を意味しない。

## 2026-10-20: Dependabot 月末一括処理

- `.github/dependabot.yml` は毎月28日00:00、`.github/workflows/dependabot-automation.yml` は同日18:00（いずれも `Asia/Tokyo`）に設定した。呼び出し先は検証済み共通 workflow の固定 SHA とし、現在の head SHA、Dependabot の資格状態、全 PR チェック成功を merge 前に再確認する。
- YAML 構文、変更差分、空白エラーをローカルで検査した。実際の月末 schedule と Dependabot PR の merge 経路は、次回の毎月28日実行で確認する。

## 2026-10-23: 使徒・カード画像と生産ラボ正式値

- 攻略Wikiの実装済み使徒一覧、遺物カード一覧、スペルカード一覧を取得し、使徒82名・遺物52枚・スペル36枚をマニフェストと照合した。全170ファイルについてRIFF/WebPヘッダー、ローカルファイルの存在、Markdownの参照先を検査し、欠落・WebP以外・外部画像URLはいずれも0件だった。
- バイオデンジャー攻略6ページの全キャラクター行と使徒編成表を検査し、文字ラベルを残したまま使徒画像と性格クラスが付くことを確認した。カード表は遺物52行・スペル36行の全行がマニフェストのカード名と一致した。
- `python -m compileall -q scripts` と `python scripts/build-docs.py` を実行し、同期・表更新スクリプトの構文検査とZensical strictビルドが成功した。`scripts/enrich-doc-tables.py` を再実行し、対象4ファイルのハッシュが変わらないことから再実行可能性も確認した。
- 実ブラウザのデスクトップ表示では、使徒画像が40px、カード画像が90pxで表示され、性格背景色と文字ラベルを目視確認した。カード表は幅1,800px、表示領域720px、横スクロール領域1,832pxで、表内スクロールが有効だった。
- 390×844のモバイル表示では、文書全体の幅とスクロール幅がともに390pxで、ページ全体の意図しない横スクロールはなかった。カード表は390pxの表示領域内で横スクロールでき、使徒ラベルは画像40px・高さ約47pxで表示された。
- 生産ラボ第11・12段階は攻略Wikiの研究表・最終素材総数表・加工経路を相互照合した。公開済みGitHub Pages上の表示とゲーム実機画面は今回の検証に含めない。
