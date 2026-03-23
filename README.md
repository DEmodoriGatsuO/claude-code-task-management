# GitHub Pages JSON Demo

`data/` フォルダに置いた JSON ファイルをデータソースとし、`docs/` の静的サイトを GitHub Pages で公開するデモアプリケーションです。

## デモ

> GitHub Pages の URL はリポジトリの Settings → Pages で確認できます。

## 機能

- JSON データの自動読み込み・可視化
- サマリーカード（件数・合計・平均・最大値）
- Chart.js による棒グラフ（カテゴリ別色分け）
- カテゴリフィルター
- ダークモード対応
- 外部ライブラリ最小限（ビルドステップなし）

## ディレクトリ構成

```
repo/
├── data/                   # JSON データソース
│   ├── index.json          # データセット一覧（必須）
│   └── *.json              # 各データファイル
├── docs/                   # GitHub Pages 公開ルート
│   ├── index.html
│   └── assets/
│       ├── main.js
│       └── style.css
├── .devcontainer/
│   └── devcontainer.json
├── docker-compose.yml
├── Dockerfile
└── CLAUDE.md
```

## ローカル開発

### 前提条件

- Docker / Docker Compose

### 起動

```bash
# 初回（イメージのビルドあり）
docker compose up --build

# 2 回目以降
docker compose up
```

ブラウザで <http://localhost:3000/docs/> を開くとプレビューできます。
ファイルを変更すると自動リロードされます。

```bash
# バックグラウンド起動
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

## データの追加・変更

1. `data/` に JSON ファイルを追加する
2. `data/index.json` の `files` 配列にファイル名を追加する

```json
{
  "title": "デモタイトル",
  "description": "データセットの説明",
  "files": ["sample.json", "new-data.json"],
  "updatedAt": "2025-01-01"
}
```

各データ JSON の形式：

```json
{
  "meta": {
    "source": "出典",
    "generatedAt": "2025-01-01T00:00:00Z"
  },
  "items": [
    { "id": 1, "label": "Item A", "value": 42, "category": "alpha" }
  ]
}
```

## GitHub Pages の設定

リポジトリの **Settings → Pages** で以下を設定します：

| 項目 | 値 |
|------|----|
| Source | `Deploy from a branch` |
| Branch | `main` |
| Folder | `/docs` |

設定後、数分で公開されます。

## 技術スタック

- HTML5 / CSS3 / Vanilla JS（ビルドステップなし）
- [Chart.js](https://www.chartjs.org/) v4（CDN）
- [serve](https://github.com/vercel/serve)（開発サーバー）
- Docker / Node.js 22

## ライセンス

MIT
