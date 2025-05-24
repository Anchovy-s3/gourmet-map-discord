# Discord 食べログマップ

Discord上で共有された食べログのURLから店舗情報を抽出し、Google Map上に表示するWebアプリケーションです。

## 機能

- Discordのテキストチャンネルに投稿された食べログのURLから店舗の位置情報を自動取得
- 取得した店舗情報をGoogle Map上にピンとして表示
- ピンをクリックすると、店舗名、住所、食べログリンク、Discord投稿へのリンクを表示
- 店舗情報をローカルに保存して、継続的に蓄積
- 店舗リストの検索機能

## セットアップ方法

### 必要条件

- Node.js (v14以上)
- npm (Node.jsに同梱)
- Discord Bot トークン
- Google Maps JavaScript API キー

### インストール手順

1. リポジトリをクローンまたはダウンロードします

```
git clone https://github.com/yourusername/gourmet-map-discord.git
cd gourmet-map-discord
```

2. 必要なパッケージをインストールします

```bash
npm install
```

3. `.env`ファイルを作成し、必要な環境変数を設定します

```bash
cp .env.example .env
```

`.env`ファイルを編集して、Discord BotトークンとGoogle Maps API Keyを設定してください：

```
DISCORD_TOKEN=your_discord_bot_token_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Dockerを使用したセットアップ（推奨）

1. Docker と Docker Compose がインストールされていることを確認してください

2. `.env`ファイルを設定します（上記の手順3と同様）

3. Docker Composeを使用してアプリケーションを起動します

```bash
docker-compose up -d
```

詳細な手順については `DOCKER_GUIDE.md` を参照してください。

### Discord Botの設定

※ Discordトークンの取得方法は[Discordデベロッパーポータル](https://discord.com/developers/applications)を参照してください。
※ Google Maps APIキーの取得方法は[Google Cloud Platform](https://console.cloud.google.com/)を参照してください。

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

## 起動方法

### 通常の起動方法

アプリケーションを起動するには、以下のコマンドを実行します：

```bash
npm start
```

開発モードで起動（ファイル変更を監視して自動再起動）：

```bash
npm run dev
```

### Dockerでの起動方法

**本番環境向け**：

```bash
docker-compose up -d
```

**開発環境向け**（ホットリロード対応）：

```bash
docker-compose -f docker-compose.dev.yml up -d
```

コンテナのログを確認：

```bash
docker-compose logs -f
```

アプリケーションは http://localhost:3000 でアクセス可能です。

開発モードで実行する場合は：

```
npm run dev
```

## 使い方

1. Botを招待したDiscordサーバーのテキストチャンネルに食べログのURL（例：https://tabelog.com/kanagawa/A1401/A140105/14003509/）を投稿します。
2. Botが自動的に情報を抽出し、確認メッセージを返信します。
3. ブラウザで http://localhost:3000 にアクセスすると、Google Map上にピンが表示されています。
4. ピンをクリックすると、店舗の詳細情報と食べログリンク、Discord投稿へのリンクが表示されます。
5. 画面右側の店舗リストから直接店舗を選択することもできます。

## 注意事項

- .envファイルに含まれるAPIキーを公開リポジトリにコミットしないよう注意してください。
- このアプリケーションは個人利用を目的としています。大量のリクエストを送信すると、各サービスのレート制限に達する可能性があります。
- 食べログのサイト構造が変更された場合、情報抽出機能が正常に動作しなくなる可能性があります。

## レスポンシブ対応

このアプリケーションは、PC・タブレット・スマートフォンなど、さまざまな画面サイズに対応しています：

- メディアクエリを使用した画面サイズに応じたレイアウト調整
- モバイルデバイス向けのタッチ操作最適化
- スマートフォン表示時の地図・リスト表示切替機能
- 店舗情報の適切なフォントサイズと表示調整

## Docker コンテナ化

このアプリケーションはDocker環境で実行できるように設計されています：

- マルチステージビルドによる効率的なイメージ構築
- 開発環境と本番環境の分離
- データの永続化（`docker-compose.yml`の`volumes`設定）
- 環境変数の適切な管理

詳細なDocker環境のセットアップと使用方法については、プロジェクトルートの`DOCKER_GUIDE.md`を参照してください。

