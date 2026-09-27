# トリッカルデータ

トリッカルの攻略アセットなど。

## 公開ページ

https://roflsunriz.github.io/trickcal-data/

## 内容

- `docs/` に各カテゴリの台詞データを配置しています。
- `mkdocs.yml` を Zensical で読み込み、Material と同じ classic 外観で閲覧できます。

## 閲覧方法

ローカルで確認する場合は、依存関係を入れて Zensical を起動してください。

```bash
python -m pip install -r requirements.txt
zensical serve
```

ブラウザで表示された URL を開くと、各ページを確認できます。

公開用の厳格ビルドと各ページの Git 最終更新日の確認には `python scripts/build-docs.py` を実行します。

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

## ライセンス

このリポジトリのコードとドキュメントは MIT License の下で公開しています。詳細は [LICENSE](LICENSE) を参照してください。

## 貢献

誤記修正、データ追加、分類修正の提案は歓迎します。変更を送る前に [CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。

## 依存更新の自動処理

Dependabot は対象の依存関係を毎週確認します。patch／minor 更新は PR のチェック（CI）が成功した後に自動で squash merge されます。CI の失敗ジョブは 1 回だけ再実行します。再失敗した PR は残して手動で修正します。major 更新は手動で確認します。マージ後はデプロイ workflow を明示起動します。
