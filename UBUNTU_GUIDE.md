# Ubuntu環境での実行ガイド

Ubuntu環境でDiscord食べログマップアプリを実行する際の手順を説明します。

## 事前準備

1. Docker と Docker Compose がインストールされていることを確認します：

```bash
# Dockerのインストール（未インストールの場合）
sudo apt update
sudo apt install -y docker.io

# Docker Composeのインストール（未インストールの場合）
sudo apt install -y docker-compose

# Dockerサービスの開始
sudo systemctl start docker
sudo systemctl enable docker

# 現在のユーザーをdockerグループに追加（sudo不要でdockerコマンドを実行するため）
sudo usermod -aG docker $USER
```

2. 変更を有効にするため、一度ログアウトして再ログインします。

## 環境変数の設定

1. `.env.example` から `.env` ファイルを作成します：

```bash
cp .env.example .env
```

2. テキストエディタで `.env` ファイルを編集し、必要なAPIキーを設定します：

```bash
nano .env
```

## スクリプトの実行権限設定

1. スクリプトに実行権限を付与します：

```bash
chmod +x switch-env.sh
chmod +x run-app.sh
```

## アプリケーションの実行

### 方法1：環境の切り替えと個別実行

1. 環境を切り替えます：

```bash
# 開発環境に切り替える場合
./switch-env.sh development

# ローカル環境に切り替える場合
./switch-env.sh local

# 本番環境に切り替える場合
./switch-env.sh production
```

2. アプリケーションを起動します：

```bash
sudo docker-compose -f docker-compose.current.yml up -d
```

3. ログを確認します：

```bash
sudo docker-compose -f docker-compose.current.yml logs -f
```

### 方法2：ワンステップ実行（推奨）

1. `run-app.sh` スクリプトを使用して環境の切り替えと起動を一度に行います：

```bash
# 開発環境で実行
./run-app.sh development

# ローカル環境で実行
./run-app.sh local

# 本番環境で実行
./run-app.sh production
```

## コンテナの確認と管理

1. 実行中のコンテナを確認します：

```bash
sudo docker ps
```

2. コンテナのログを確認します：

```bash
# アプリケーションのログ
sudo docker-compose -f docker-compose.current.yml logs -f app

# Nginx（本番環境）のログ
sudo docker-compose -f docker-compose.current.yml logs -f nginx
```

3. コンテナを停止します：

```bash
sudo docker-compose -f docker-compose.current.yml down
```

## トラブルシューティング

### エラー: 'ContainerConfig'

このエラーが発生した場合は、既存のコンテナとの競合が原因の可能性があります。以下の手順を試してください：

```bash
# 全てのコンテナを停止・削除
sudo docker-compose -f docker-compose.current.yml down --remove-orphans
sudo docker rm $(sudo docker ps -a -q) -f

# 再度起動
./run-app.sh production
```

### パーミッションエラー

ボリュームマウントに関するパーミッションエラーが発生する場合は：

```bash
# データディレクトリの権限を修正
sudo chown -R $USER:$USER ./data
sudo chmod -R 755 ./data
```

### Nginxの設定に関するエラー

Nginx設定に問題がある場合（本番環境）：

```bash
# Nginx設定のテスト
sudo docker-compose -f docker-compose.current.yml exec nginx nginx -t

# Nginxを再起動
sudo docker-compose -f docker-compose.current.yml restart nginx
```
