# 環境別設定ガイド

本プロジェクトは3つの異なる環境で実行できるように設定されています。このドキュメントでは、各環境の特徴と使い分け方について説明します。

## 環境の概要

### 1. 開発環境 (Development)

**場所**: `/environments/development/`

**目的**: 
- アクティブな開発作業
- リアルタイムなコード変更の反映
- デバッグ情報の詳細表示

**特徴**:
- ホットリロード機能（nodemon）
- 詳細なログ出力
- ソースコードの変更がリアルタイムで反映

### 2. ローカル環境 (Local)

**場所**: `/environments/local/`

**目的**:
- ローカルでのテスト実行
- 本番環境に近い状態での検証
- 最小限の設定でのシンプルな実行

**特徴**:
- 標準的なDocker構成
- 適度なログ出力
- ソースコードの変更が反映される（再起動が必要な場合あり）

### 3. 本番環境 (Production)

**場所**: `/environments/production/`

**目的**:
- 実際のサービス提供
- パフォーマンスとセキュリティの最適化
- 安定した運用

**特徴**:
- Nginxリバースプロキシ
- 最小限のログ出力（警告とエラーのみ）
- キャッシュとパフォーマンス最適化
- セキュリティヘッダーの設定

## 環境の切り替え方法

プロジェクトルートディレクトリで以下のコマンドを実行します：

```powershell
# 開発環境に切り替え
.\switch-env.ps1 development

# ローカル環境に切り替え
.\switch-env.ps1 local

# 本番環境に切り替え
.\switch-env.ps1 production
```

環境を切り替えると、その環境用の設定が `docker-compose.current.yml` にコピーされ、以下のコマンドで起動できます：

```powershell
docker-compose -f docker-compose.current.yml up -d
```

または、簡易起動スクリプトを使用することもできます：

```powershell
.\run-app.ps1 [development|local|production]
```

## 環境変数設定

各環境には独自の `.env.example` ファイルがあり、その環境特有の設定が含まれています。実際に使用する場合は、このファイルをコピーして `.env` ファイルを作成し、必要な値を設定してください。

### 共通の環境変数

すべての環境で必要な環境変数：

- `DISCORD_TOKEN`: Discord Botのトークン
- `GOOGLE_MAPS_API_KEY`: Google Maps APIのキー
- `PORT`: アプリケーションのポート（デフォルト: 3000）

### 環境固有の環境変数

各環境には特有の環境変数が設定されています：

**開発環境**:
- `NODE_ENV=development`
- `LOG_LEVEL=debug`

**ローカル環境**:
- `NODE_ENV=local`
- `LOG_LEVEL=info`

**本番環境**:
- `NODE_ENV=production` 
- `LOG_LEVEL=warn`
- `ENABLE_COMPRESSION=true`
- `CACHE_DURATION=86400`

## プロジェクト構造

各環境ディレクトリの構造は以下のとおりです：

```
environments/
│
├── development/        # 開発環境
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── .env.example
│   └── README.md
│
├── local/              # ローカル環境
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── .env.example
│   └── README.md
│
└── production/         # 本番環境
    ├── docker-compose.yml
    ├── Dockerfile
    ├── .env.example
    ├── README.md
    └── nginx/          # Nginx設定
        ├── nginx.conf
        └── conf.d/
            └── default.conf
```

共通のソースコードは環境ディレクトリの外に配置され、各環境から参照されます：

```
src/            # バックエンドのソースコード
public/         # フロントエンドの静的ファイル
data/           # データ保存用ディレクトリ
```

## 環境選択のガイドライン

- **新機能の開発**: 開発環境を使用（ホットリロードで効率的）
- **テストと検証**: ローカル環境を使用（本番に近い環境でテスト）
- **本番デプロイ**: 本番環境を使用（Nginx、最適化設定）

## トラブルシューティング

### 共通の問題

1. **環境変数が反映されない**
   - `.env` ファイルが正しく配置されているか確認
   - コンテナを再起動 (`docker-compose down && docker-compose up -d`)

2. **コンテナが起動しない**
   - ログを確認 (`docker-compose logs`)
   - ポートの競合がないか確認

3. **環境の切り替えに失敗**
   - 環境ディレクトリが存在するか確認
   - `switch-env.ps1` をプロジェクトルートから実行しているか確認

### 環境別の問題

**開発環境**:
- ホットリロードが機能しない → nodemonが正しく動作しているか確認

**本番環境**:
- Nginxエラー → nginx/conf.d/default.confの設定を確認
- SSLエラー → 証明書ファイルの配置を確認
