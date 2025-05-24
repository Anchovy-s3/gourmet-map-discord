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

```
npm install
```

3. 環境変数を設定します

`.env`ファイルをプロジェクトのルートディレクトリに作成し、以下の内容を記載します：

```
DISCORD_TOKEN=あなたのDiscord Botトークン
GOOGLE_MAPS_API_KEY=あなたのGoogle Maps APIキー
```

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

アプリケーションを起動するには、以下のコマンドを実行します：

```
npm start
```

デフォルトでは、アプリケーションは http://localhost:3000 でアクセス可能です。

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

