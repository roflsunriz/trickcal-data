# トリッカルデータ

トリッカルの攻略アセットなど。

## 公開ページ

https://roflsunriz.github.io/trickcal-data/

## 内容

- `docs/` に各カテゴリの台詞データを配置しています。
- `mkdocs.yml` で MkDocs Material のサイトとして閲覧できます。

## 閲覧方法

ローカルで確認する場合は、MkDocs を起動してください。

```bash
mkdocs serve
```

ブラウザで表示された URL を開くと、各ページを確認できます。

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
│   ├── research.md                 # 研究室: 生産ラボ
│   ├── assets/                     # サイト用ロゴ・ファビコン
│   └── stylesheets/                # 追加 CSS
├── overrides/
│   └── partials/                   # MkDocs Material のテンプレート上書き
├── mkdocs.yml                      # MkDocs 設定
├── CONTRIBUTING.md                 # 貢献ガイド
├── LICENSE                         # ライセンス
└── README.md                       # このファイル
```

## ライセンス

このリポジトリのコードとドキュメントは MIT License の下で公開しています。詳細は [LICENSE](LICENSE) を参照してください。

## 貢献

誤記修正、データ追加、分類修正の提案は歓迎します。変更を送る前に [CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。
