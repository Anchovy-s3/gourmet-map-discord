# Discord食べログマップアプリのDocker実行ガイド

このガイドでは、Discord食べログマップアプリをDocker環境で実行する方法を説明します。

## 前提条件

- [Docker](https://www.docker.com/get-started) がインストールされていること
- [Docker Compose](https://docs.docker.com/compose/install/) がインストールされていること

## 環境変数の設定

1. プロジェクトのルートディレクトリに `.env` ファイルを作成します（すでに存在する場合は編集します）
2. 以下の環境変数を設定します：

```
DISCORD_TOKEN=your_discord_bot_token_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Dockerでの実行方法

このプロジェクトでは3つの実行環境が用意されています：

1. **開発環境** - ホットリロード対応の開発用環境
2. **標準環境** - 標準的な実行環境（シンプルなDocker設定）
3. **本番環境** - Nginxを使用した高パフォーマンス環境

### 1. 開発環境（ホットリロード対応）

開発環境では、コードの変更が自動的に反映されるホットリロード機能が有効化されています。

```bash
# 開発環境を起動
docker-compose -f docker-compose.dev.yml up --build

# バックグラウンドで実行する場合
docker-compose -f docker-compose.dev.yml up -d

# コンテナを停止する場合
docker-compose -f docker-compose.dev.yml down
```

### 2. 標準環境

標準環境は一般的な利用に最適化されています。

```bash
# 標準環境を起動
docker-compose up --build

# バックグラウンドで実行する場合
docker-compose up -d

# コンテナを停止する場合
docker-compose down
```

### 3. 本番環境（Nginx使用）

本番環境では、Nginxをリバースプロキシとして使用し、高パフォーマンスと安全性を確保します。

```bash
# 本番環境を起動
docker-compose -f docker-compose.prod.yml up --build

# バックグラウンドで実行する場合
docker-compose -f docker-compose.prod.yml up -d

# コンテナを停止する場合
docker-compose -f docker-compose.prod.yml down
```

いずれの環境でも、アプリケーションには http://localhost:3000 または http://localhost（本番環境の場合）からアクセスできます。

## データの永続化

アプリケーションのデータは `./data` ディレクトリにマウントされ、コンテナを再起動してもデータは保持されます。

## ログの確認

実行中のコンテナのログを確認するには、以下のコマンドを実行します：

```bash
docker-compose logs -f
```

## トラブルシューティング

### 共通の問題

#### コンテナが起動しない場合

1. 環境変数が正しく設定されているか確認します
2. ポート3000（標準/開発環境）または80/443（本番環境）が他のアプリケーションで使用されていないか確認します

```bash
# Windowsの場合、使用中のポートを確認
netstat -ano | findstr :3000
netstat -ano | findstr :80
```

#### APIキーの問題

1. Google Maps APIキーが有効であることを確認します
2. Discord Botトークンが有効であることを確認します

```bash
# 環境変数が正しく設定されているか確認
docker-compose exec app printenv | grep DISCORD_TOKEN
docker-compose exec app printenv | grep GOOGLE_MAPS_API_KEY
```

#### データが保存されない場合

1. `./data` ディレクトリに書き込み権限があることを確認します
2. コンテナ内の `/app/data` ディレクトリにデータが正しく保存されているか確認します：

```bash
docker-compose exec app ls -la /app/data
```

### 開発環境特有の問題

#### ホットリロードが機能しない

1. ボリュームマウントが正しく設定されているか確認します
2. nodemonが正しく動作しているか確認します

```bash
docker-compose -f docker-compose.dev.yml logs app
```

### 本番環境特有の問題

#### Nginxエラー

1. Nginxの設定ファイルが正しいか確認します
2. Nginxのログを確認します

```bash
docker-compose -f docker-compose.prod.yml logs nginx
```

#### ヘルスチェックの失敗

1. アプリが正常に起動しているか確認します
2. ヘルスチェックエンドポイントにアクセスできるか確認します

```bash
docker-compose -f docker-compose.prod.yml exec app wget -q -O - http://localhost:3000/health
```

## パフォーマンス最適化

本番環境では、アプリケーションのパフォーマンスを最適化するために以下の設定を検討してください：

1. Node.jsのメモリ制限を設定する（docker-compose.ymlのenvironmentセクションに追加）：
```
NODE_OPTIONS=--max-old-space-size=512
```

2. コンテナのリソース制限を設定する（docker-compose.ymlのservicesセクションに追加）：
```
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```
