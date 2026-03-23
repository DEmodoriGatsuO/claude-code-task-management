# ベースイメージ: Node.js LTS (Alpine で軽量化)
FROM node:22-alpine

# 必要なツールをインストール
RUN apk add --no-cache \
    # 基本ツール
    bash \
    curl \
    git \
    jq \
    # Claude Code が使う可能性のあるツール
    python3 \
    py3-pip \
    # serve の依存
    ca-certificates

# グローバルに便利ツールを入れておく
# - serve: 静的ファイルサーバー（GitHub Pages ローカルプレビュー）
RUN npm install -g \
    serve@14 \
    @anthropic-ai/claude-code
    
# 作業ディレクトリ（devcontainer.json の workspaceFolder と合わせる）
WORKDIR /workspace

# node ユーザーで動かす（セキュリティベストプラクティス）
# ただし /workspace への書き込みができるよう所有者を変更
RUN chown -R node:node /workspace

USER node

# デフォルトで 3000 番ポートを公開
EXPOSE 3000

# デフォルトコマンド（docker-compose.yml の command で上書きされる）
# 直接 docker run した場合の fallback
CMD ["serve", ".", "--listen", "3000"]