FROM node:18-alpine

WORKDIR /app

# パッケージ依存関係をコピーしてインストール
COPY package*.json ./
RUN npm install

# アプリケーションのソースをコピー
COPY . .

# アプリケーションのポートを公開
EXPOSE 3000

# アプリケーションを起動
CMD ["node", "src/index.js"]
