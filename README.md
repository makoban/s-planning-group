# S.PLANNING GROUP — Corporate Site Renewal Preview

エス・プランニング株式会社を中心に、同社の自社事業とグループ会社の構造を伝える、静的な企業サイト提案です。

## Information architecture

- Group core: エス・プランニング株式会社
- Own business: stockmart（食品・生活雑貨小売）
- Group companies: 有限会社青竜社塗装店 / 伸晃工業株式会社 / 有限会社アイ・ティー・ネット

stockmartは会社カードに含めず、エス・プランニングの運営事業として別階層にしています。

## Preview locally

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Safety boundary

- `robots.txt` と `noindex, nofollow, noarchive, noimageindex` を設定しています。
- GitHub PagesはURLを知る人が閲覧できる公開面です。検索非表示はアクセス制限ではありません。
- お問い合わせフォームは提案用で、入力内容を保存・送信しません。
- 既存ドメイン `planning-s.co.jp`、DNS、メールには変更を加えません。
- 代表者の携帯電話番号と個人メールアドレスは掲載していません。
- 生成画像は事業コンセプトの演出用で、実在の社員・施設・店舗を示すものではありません。

公開情報の根拠と確認待ち項目は [FACT_CHECK.md](FACT_CHECK.md) を参照してください。

## Assets

- `hero-*`: S.PLANNING GROUPの4領域をつなぐヒーローイメージ（GPT Image生成）
- `materials.*`: 技術・素材・通信・暮らしの連携イメージ（GPT Image生成）
- `stockmart.*`: 食と暮らしの小売体験イメージ（GPT Image生成）
- `assets/logo-mark-card.png`: 支給名刺写真の印刷マークから輪郭を抽出し、背景を透過したサイト用シンボル。形状は生成せず名刺の4パーツをそのまま使用し、表示色のみサイトの赤・黒へ統一しています。正式公開時は支給された正規ロゴ原版に差し替えます。
- `assets/favicon-32.png` / `assets/apple-touch-icon.png`: 同じ名刺由来シンボルから生成したブラウザ・ホーム画面用アイコンです。

## Browser support

最新のChrome / Safari / Firefox / Edgeを対象にしています。`prefers-reduced-motion` ではローダー、パララックス、接続線描画などを停止し、全コンテンツを初期表示します。
