FROM node:18-alpine

WORKDIR /app

# パッケージ依存関係をコピーしてインストール
COPY package*.json ./
RUN npm install

# アプリケーションのソースをコピー
COPY . .

# データディレクトリを作成し権限を設定
RUN mkdir -p /app/data && chown -R node:node /app/data

# アプリケーションのポートを公開
EXPOSE 3000

# 非root ユーザーに切り替える
USER node

# アプリケーションを起動
CMD ["node", "src/index.js"]
