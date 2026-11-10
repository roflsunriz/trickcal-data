# トリッカルデータ

トリッカルの攻略資料、台詞やカードの文字起こしをまとめています。

## 公開ページ

https://roflsunriz.github.io/trickcal-data/

関連する周回計画・クレヨンボード・食べ物の好みは、[トリッカルツール集](https://roflsunriz.github.io/trickcal-tools-clone/)で利用できます。

## 内容

- `docs/` に各カテゴリの台詞データを配置しています。
- `docs/assets/` に使徒・カード・生産ラボ素材のローカル画像と取得元マニフェストを配置しています。
- 生産ラボ第10～12段階では、各レベルの所持数からレベル1～3加工素材の生産数と不足する原材料を求める計算機を利用できます。原材料ごとの主な採集使徒も確認でき、所持数と入力欄の開閉状態は同じブラウザに自動保存されます。
- `mkdocs.yml` を Zensical で読み込み、Material と同じ classic 外観で閲覧できます。

## 閲覧方法

ローカルで確認する場合は、依存関係を入れて Zensical を起動してください。

```bash
python -m pip install -r requirements.txt
zensical serve
```

Zensicalが表示した URL をブラウザで開くと、各ページを確認できます。

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

このリポジトリのコードと独自ドキュメントは MIT License の下で公開しています。詳細は [LICENSE](LICENSE) を参照してください。`docs/assets/apostles/`、`docs/assets/cards/`、`docs/assets/research/` のゲーム画像は MIT License の対象外で、各権利者に帰属します。

## 貢献

誤記修正、データ追加、分類修正の提案は歓迎します。変更を送る前に [CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。

## 依存更新の自動処理

更新PRの取り込みは、必要なCIチェックにすべて成功したものだけを対象に、毎月28日18:00（Asia/Tokyo）の月末処理で行います。

Dependabot は対象の依存関係を毎月28日00:00（Asia/Tokyo）に確認します。patch／minor 更新は PR のチェック（CI）が成功した後に自動で squash merge されます。CI の失敗ジョブは 1 回だけ再実行します。再失敗した PR は残して手動で修正します。major 更新も互換性を確認し、同じ月末処理で取り込みます。マージ後はデプロイ workflow を明示起動します。
