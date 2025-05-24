# Discord食べログマップアプリ

Discord上で共有された食べログURLから店舗情報を自動的に抽出し、Google Map上にマッピングするWebアプリケーション

## 特徴

- Discord Bot統合による食べログリンクの自動監視
- 店舗情報（名前、住所、位置情報）の自動抽出
- Google Maps上への店舗ピン表示
- レスポンシブデザイン対応（PC/タブレット/スマートフォン）
- マルチ環境デプロイ（開発/ローカル/本番）

## 前提条件

- [Node.js](https://nodejs.org/) (v14以上)
- [Docker](https://www.docker.com/) と [Docker Compose](https://docs.docker.com/compose/)
- [Discord Bot](https://discord.com/developers/applications) のトークン
- [Google Maps API](https://developers.google.com/maps/documentation/javascript/get-api-key) キー

## 環境構成

このプロジェクトは3つの環境設定をサポートしています：

1. **開発環境** (`/environments/development/`) - 開発作業向け、ホットリロード対応
2. **ローカル環境** (`/environments/local/`) - ローカル実行向け、標準設定
3. **本番環境** (`/environments/production/`) - 本番デプロイ向け、Nginx使用

## セットアップと実行

### 環境の切り替え

プロジェクトルートディレクトリで以下のコマンドを実行します：

```powershell
# 開発環境に切り替え
.\switch-env.ps1 development

# ローカル環境に切り替え
.\switch-env.ps1 local

# 本番環境に切り替え
.\switch-env.ps1 production
```

### アプリケーションの起動

環境を切り替えた後、以下のコマンドでアプリケーションを起動します：

```powershell
docker-compose -f docker-compose.current.yml up -d
```

ログを確認するには：

```powershell
docker-compose -f docker-compose.current.yml logs -f
```

### 環境変数の設定

各環境の`.env.example`ファイルをコピーして`.env`ファイルを作成し、必要な環境変数を設定します：

```
DISCORD_TOKEN=your_discord_bot_token_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Discord Botの設定

1. [Discordデベロッパーポータル](https://discord.com/developers/applications)にアクセス
2. 「New Application」をクリックして新しいアプリケーションを作成
3. 「Bot」タブに移動し、「Add Bot」をクリック
4. 以下の権限を有効にする：
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
   - PRESENCE INTENT
5. トークンをコピーして`.env`ファイルにセット
6. OAuth2タブからBotを招待するURLを生成し、あなたのサーバーにBotを招待

## 使い方

1. Botを招待したDiscordサーバーのテキストチャンネルに食べログのURL（例：https://tabelog.com/kanagawa/A1401/A140105/14003509/）を投稿します。
2. Botが自動的に情報を抽出し、確認メッセージを返信します。
3. ブラウザで http://localhost:3000 にアクセスすると、Google Map上にピンが表示されています。
4. ピンをクリックすると、店舗の詳細情報と食べログリンク、Discord投稿へのリンクが表示されます。
5. 画面右側の店舗リストから直接店舗を選択することもできます。

## レスポンシブ対応

このアプリケーションは、PC・タブレット・スマートフォンなど、さまざまな画面サイズに対応しています：

- メディアクエリを使用した画面サイズに応じたレイアウト調整
- モバイルデバイス向けのタッチ操作最適化
- スマートフォン表示時の地図・リスト表示切替機能
- 店舗情報の適切なフォントサイズと表示調整

## Docker コンテナ化

このアプリケーションはDocker環境で実行できるように設計されています：

- 環境別のDockerfile設定
- 開発/ローカル/本番環境の分離
- データの永続化（`volumes`設定）
- 環境変数の適切な管理

詳細な各環境の設定や使用方法については、各環境ディレクトリ内の個別のREADMEファイルを参照してください：

- 開発環境: [environments/development/README.md](environments/development/README.md)
- ローカル環境: [environments/local/README.md](environments/local/README.md)
- 本番環境: [environments/production/README.md](environments/production/README.md)

## 注意事項

- .envファイルに含まれるAPIキーを公開リポジトリにコミットしないよう注意してください。
- このアプリケーションは個人利用を目的としています。大量のリクエストを送信すると、各サービスのレート制限に達する可能性があります。
- 食べログのサイト構造が変更された場合、情報抽出機能が正常に動作しなくなる可能性があります。
