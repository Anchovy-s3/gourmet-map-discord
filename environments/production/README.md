# 本番環境

この環境は、Discord食べログマップアプリケーションの本番稼働に最適化されています。

## 特徴

- **Nginxリバースプロキシ**: 高性能なウェブサーバーを使用
- **セキュリティ強化**: 適切なセキュリティヘッダーの設定
- **最適化されたパフォーマンス**: 静的ファイルのキャッシング、圧縮

## セットアップ手順

1. 環境変数ファイルの準備

```bash
cp .env.example .env
# .env ファイルを編集して必要な環境変数を設定
```

2. 実行

```bash
# 本番環境を起動
docker-compose up -d

# ログの確認
docker-compose logs -f
```

## SSL設定（オプション）

本番環境でSSLを有効にするには:

1. SSL証明書を `./nginx/ssl` ディレクトリに配置
2. `./nginx/conf.d/default.conf` を編集してHTTPSを有効化

```conf
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # 以下の設定を続ける
}
```

## 監視とログ

```bash
# Nginxログの確認
docker-compose logs -f nginx

# アプリケーションログの確認
docker-compose logs -f app
```

## 停止方法

```bash
docker-compose down
```

本番環境では、永続化したデータのみがボリュームとしてマウントされます。ソースコードの変更を反映するには再ビルドが必要です。

```bash
docker-compose up -d --build
```
