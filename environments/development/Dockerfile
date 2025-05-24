FROM node:18-alpine

WORKDIR /app

# 依存関係のファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install
RUN npm install -g nodemon

# アプリケーションのポートを公開
EXPOSE 3000

# データディレクトリの作成
RUN mkdir -p /app/data

# アプリケーションの起動（開発モード）
CMD ["npm", "run", "dev"]
