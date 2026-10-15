# プロジェクト固有の知見

共通指針と [AGENTS.md](AGENTS.md) を読んだ後、作業前にこの文書を全文読む。元の条件・確認日・未検証事項を保ったまま、固有の実現手段と再利用する知見を集約する。

## 共通指針の具体化と適用範囲

- 対象: 共通指針の「設計と実装方針」「検証」「更新手順」「ドキュメント」と、各節に明記した共通ルール。
- 理由・範囲: アプリ本体ではなく攻略資料をZensicalで公開する。共通のビルド・検証義務はrequirements.txt、scripts/build-docs.pyとstrictサイトビルドで具体化し、Git履歴を用いた更新日時も検査する。
- 代替手段・検証: 以下の実効コマンド・根拠を用い、[検証記録](verification.md) で成功・未検証を区別する。共通方針の完了条件やユーザーの明示指示は弱めない。

## AGENTS.mdから移した知見

## 文書デプロイの前提（2026-09-27）

- `.github/workflows/deploy.yml` は `scripts/build-docs.py` で Git 更新日時を各ページのメタデータへ付けてから Zensical の strict ビルドを行う。浅い checkout では正しい更新日時を得られないため、`fetch-depth: 0` を維持する。移行前の失敗の根拠は `verification.md` を参照する。

## READMEなどから移した開発・運用情報

## ディレクトリ構成

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages へのデプロイ設定
├── docs/
│   ├── index.md                    # トップページ
│   ├── yuuutsu.md                  # 緊急！バイオデンジャー1号 攻略: 憂鬱
│   ├── kappatsu.md                 # 緊急！バイオデンジャー1号 攻略: 活発
│   ├── kyouki.md                   # 緊急！バイオデンジャー1号 攻略: 狂気
│   ├── reisei.md                   # 緊急！バイオデンジャー1号 攻略: 冷静
│   ├── junsui.md                   # 緊急！バイオデンジャー1号 攻略: 純粋
│   ├── other.md                    # 緊急！バイオデンジャー1号 攻略: その他
│   ├── artifact-cards.md           # 文字起こし: 遺物カード
│   ├── spell-cards.md              # 文字起こし: スペルカード
│   ├── apostle-formation-table.md  # 使徒編成表
│   ├── research-stage-10.md        # 研究室: 生産ラボ 第10段階
│   ├── research-stage-11.md        # 研究室: 生産ラボ 第11段階（予想）
│   ├── research-stage-12.md        # 研究室: 生産ラボ 第12段階（予想）
│   ├── research-stage-13.md        # 研究室: 生産ラボ 第13段階（予想）
│   ├── research-stage-14.md        # 研究室: 生産ラボ 第14段階（予想）
│   ├── research-stage-15.md        # 研究室: 生産ラボ 第15段階（予想）
│   ├── assets/                     # サイト用ロゴ・ファビコン
│   └── stylesheets/                # 追加 CSS
├── overrides/
│   └── partials/                   # Zensical のテンプレート上書き
├── mkdocs.yml                      # Zensical 設定
├── requirements.txt                # サイトの依存関係
├── CONTRIBUTING.md                 # 貢献ガイド
├── LICENSE                         # ライセンス
└── README.md                       # このファイル
```

## 依存更新の自動処理

Dependabot は対象の依存関係を毎週確認します。patch／minor 更新は PR のチェック（CI）が成功した後に自動で squash merge されます。CI の失敗ジョブは 1 回だけ再実行します。再失敗した PR は残して手動で修正します。major 更新は手動で確認します。マージ後はデプロイ workflow を明示起動します。

## 文書の役割

- [README.md](README.md): 利用開始と操作、利用者が知る必要のある制限。
- この文書: 固有の配置・ツール・実行手段・例外・再利用する調査知見。
- [verification.md](verification.md): 検証手順、実測結果、証拠、未検証事項。
- [how-to-update.md](how-to-update.md): 更新と復旧の手順。
