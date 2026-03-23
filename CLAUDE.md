# CLAUDE.md — GitHub Pages + JSON Demo 自律開発ガイド

## プロジェクト概要

GitHub の `data/` フォルダに置いた JSON ファイルをデータソースとし、
`docs/` フォルダの静的サイトを GitHub Pages で公開するデモアプリケーション。

```
repo/
├── data/           # JSON データソース（変更・追加可）
│   └── *.json
├── docs/           # GitHub Pages 配信ルート
│   ├── index.html
│   ├── assets/
│   │   ├── main.js
│   │   └── style.css
│   └── ...
├── CLAUDE.md       # このファイル
├── .devcontainer/
│   └── devcontainer.json
├── docker-compose.yml
└── Dockerfile
```

---

## 開発サーバーの起動

```bash
# コンテナ起動（初回はビルドあり）
docker compose up --build

# バックグラウンド起動
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

ブラウザで http://localhost:3000 にアクセスするとプレビューできる。
ファイルを変更すると自動リロードされる（watchファイルサーバー使用）。

---

## Claude Code が自律実行するタスク

### 基本フロー

1. `data/` フォルダの JSON を読み込みスキーマを把握する
2. スキーマに合った UI を `docs/` に生成する
3. `http://localhost:3000` で動作確認する
4. Issues が存在する場合はリストを確認し、順に対応する

### 判断ルール

| 状況 | 対応 |
|------|------|
| `data/*.json` が存在しない | サンプルデータ（後述）を `data/sample.json` に生成してから UI を作成する |
| `docs/index.html` が存在しない | 新規作成する |
| `docs/index.html` が存在する | 既存コードを読んで機能を拡張・修正する |
| JSON スキーマが変わっている | UI 側のデータマッピングを修正する |

### データ取得パターン（GitHub Pages 対応）

```js
// docs/assets/main.js 内での JSON 読み込み
// 相対パスで data/ を参照する（ローカルでも GitHub Pages でも動く）
async function loadData(filename) {
  const res = await fetch(`../data/${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  return res.json();
}

// 複数ファイルを一括取得
async function loadAllData() {
  // index.json に読み込むファイル一覧を記載しておく
  const index = await loadData('index.json');
  const datasets = await Promise.all(
    index.files.map(f => loadData(f))
  );
  return datasets;
}
```

### `data/index.json` の形式（必須）

```json
{
  "title": "デモタイトル",
  "description": "データセットの説明",
  "files": ["sample.json", "other.json"],
  "updatedAt": "2025-01-01"
}
```

---

## UI 実装ガイドライン

### 技術スタック

- HTML5 / CSS3 / Vanilla JS（外部ライブラリ最小限）
- CDN 利用可：Chart.js, Alpine.js, TailwindCSS (Play CDN)
- **フレームワーク不要**（ビルドステップなし、静的ファイルのみ）

### `docs/index.html` の必須要素

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- data/index.json の title を入れる --></title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header>
    <h1 id="app-title">Loading...</h1>
    <p id="app-description"></p>
  </header>

  <main id="app">
    <!-- データ読み込み前はローディング表示 -->
    <div id="loading">データを読み込み中...</div>
    <!-- JS でコンテンツを描画するターゲット -->
    <div id="content" hidden></div>
  </main>

  <footer>
    <p>データ更新: <span id="updated-at"></span></p>
  </footer>

  <script src="assets/main.js"></script>
</body>
</html>
```

### エラーハンドリング

```js
// fetch 失敗時は分かりやすいメッセージを表示する
async function safeLoad(filename) {
  try {
    return await loadData(filename);
  } catch (err) {
    document.getElementById('loading').innerHTML =
      `<p style="color:red">⚠️ ${filename} の読み込みに失敗しました: ${err.message}</p>`;
    return null;
  }
}
```

---

## サンプル JSON 形式（`data/sample.json`）

JSON が存在しない場合、以下の形式でサンプルを作成する。

```json
{
  "meta": {
    "source": "sample",
    "generatedAt": "2025-01-01T00:00:00Z"
  },
  "items": [
    { "id": 1, "label": "Item A", "value": 42, "category": "alpha" },
    { "id": 2, "label": "Item B", "value": 17, "category": "beta" },
    { "id": 3, "label": "Item C", "value": 88, "category": "alpha" }
  ]
}
```

---

## GitHub Pages 設定

リポジトリの Settings → Pages で以下を設定する（Claude Code では手動設定が必要）：

- **Source**: `Deploy from a branch`
- **Branch**: `main` / `docs`
- **Folder**: `/docs`

---

## 開発フロー（Claude Code 自律ループ）

```
1. git pull                         # 最新を取得
2. cat data/index.json              # データ構造を確認
3. ls data/                         # ファイル一覧を確認
4. [UI 実装 / 修正]
5. curl http://localhost:3000       # 動作確認
6. git add docs/ data/
7. git commit -m "feat: ..."
8. git push
```

---

## 命名規則・コーディング規約

- ファイル名：`kebab-case.json`, `kebab-case.js`
- 関数名：camelCase
- CSS クラス：BEM 風（`.card`, `.card__title`, `.card--active`）
- コミットメッセージ：`feat:`, `fix:`, `data:`, `docs:` プレフィックス
- JSON は必ず UTF-8、インデント 2 スペース

---

## よくある問題と対処

| 問題 | 対処 |
|------|------|
| CORS エラー（ローカルで fetch 失敗） | `docker compose up` で開発サーバーを使う（`file://` では動かない） |
| GitHub Pages で 404 | `docs/` フォルダが push されているか確認、Pages 設定を確認 |
| JSON パースエラー | `jq . data/xxx.json` で整形確認 |
| ポート 3000 が使用中 | `docker compose down` 後に再起動 |
