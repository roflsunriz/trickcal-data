# トリッカルデータ

トリッカルの攻略資料、台詞やカードの文字起こしをまとめています。

## 公開ページ

https://roflsunriz.github.io/trickcal-data/

## 内容

- `docs/` に各カテゴリの台詞データを配置しています。
- `docs/assets/` に使徒・遺物カード・スペルカードのローカル画像と取得元マニフェストを配置しています。
- `mkdocs.yml` を Zensical で読み込み、Material と同じ classic 外観で閲覧できます。

## 閲覧方法

ローカルで確認する場合は、依存関係を入れて Zensical を起動してください。

```bash
python -m pip install -r requirements.txt
zensical serve
```

Zensicalが表示した URL をブラウザで開くと、各ページを確認できます。

公開用の厳格ビルドと各ページの Git 最終更新日の確認には `python scripts/build-docs.py` を実行します。

## ライセンス

このリポジトリのコードと独自ドキュメントは MIT License の下で公開しています。詳細は [LICENSE](LICENSE) を参照してください。`docs/assets/apostles/` と `docs/assets/cards/` のゲーム画像は MIT License の対象外で、各権利者に帰属します。

## 貢献

誤記修正、データ追加、分類修正の提案は歓迎します。変更を送る前に [CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。


## 開発・運用の知見

開発環境、内部構成、検証コマンドと運用上の注意は [findings.md](findings.md) を参照してください。更新・復旧の手順と検証記録は、同ファイルから案内しています。
