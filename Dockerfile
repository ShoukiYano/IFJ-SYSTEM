FROM node:18-slim

# Prismaに必要なライブラリをインストール（Debianベース）
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# npm install のキャッシュを有効にするため先にコピー
COPY package*.json ./
COPY prisma ./prisma/

# 依存関係をインストール
RUN npm install

# Prisma Client を生成
RUN npx prisma generate

# ソースコードをコピー
COPY . .

# 開発サーバーのポート
EXPOSE 3000

# 開発モードで起動
CMD ["npm", "run", "dev"]
