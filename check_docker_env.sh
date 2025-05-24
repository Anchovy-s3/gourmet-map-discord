#!/bin/bash

# Docker環境の状態を確認するためのヘルパースクリプト
echo "===== Discord食べログマップ Docker環境チェック ====="

# Dockerがインストールされているか確認
if command -v docker &> /dev/null; then
    echo "✅ Docker: インストール済み $(docker --version)"
else
    echo "❌ Docker: インストールされていません"
    echo "   Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Docker Composeがインストールされているか確認
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose: インストール済み $(docker-compose --version)"
else
    echo "❌ Docker Compose: インストールされていません"
    echo "   通常はDocker Desktopに含まれています"
    exit 1
fi

# 環境変数の設定を確認
if [ -f .env ]; then
    echo "✅ .envファイル: 存在しています"
    
    # APIキーの設定を確認
    if grep -q "DISCORD_TOKEN=" .env && ! grep -q "DISCORD_TOKEN=$" .env; then
        echo "✅ Discord Token: 設定されています"
    else
        echo "❌ Discord Token: 設定されていないか無効です"
        echo "   .envファイルを編集して有効なトークンを設定してください"
    fi
    
    if grep -q "GOOGLE_MAPS_API_KEY=" .env && ! grep -q "GOOGLE_MAPS_API_KEY=$" .env; then
        echo "✅ Google Maps API Key: 設定されています"
    else
        echo "❌ Google Maps API Key: 設定されていないか無効です"
        echo "   .envファイルを編集して有効なAPIキーを設定してください"
    fi
else
    echo "❌ .envファイル: 存在しません"
    echo "   .env.exampleをコピーして.envを作成し、必要な環境変数を設定してください"
fi

# データディレクトリの確認
if [ -d data ]; then
    echo "✅ dataディレクトリ: 存在しています"
    # 書き込み権限の確認
    if [ -w data ]; then
        echo "✅ dataディレクトリ: 書き込み権限があります"
    else
        echo "❌ dataディレクトリ: 書き込み権限がありません"
        echo "   権限を修正してください: chmod 755 data"
    fi
else
    echo "❌ dataディレクトリ: 存在しません"
    echo "   ディレクトリを作成します..."
    mkdir -p data
    echo "✅ dataディレクトリ: 作成しました"
fi

# Dockerコンテナの実行
echo -e "\n===== 利用可能なDocker環境 ====="
echo "1. 開発環境 (docker-compose -f docker-compose.dev.yml up -d)"
echo "2. 標準環境 (docker-compose up -d)"
echo "3. 本番環境 (docker-compose -f docker-compose.prod.yml up -d)"

# ポートのチェック
echo -e "\n===== ポート使用状況チェック ====="
if command -v netstat &> /dev/null; then
    echo "ポート3000の使用状況:"
    netstat -tulpn 2>/dev/null | grep :3000 || echo "✅ ポート3000: 利用可能"
    
    echo "ポート80の使用状況 (本番環境用):"
    netstat -tulpn 2>/dev/null | grep :80 || echo "✅ ポート80: 利用可能"
else
    echo "netstatコマンドが利用できないため、ポートの使用状況を確認できません"
fi

echo -e "\n===== 環境のセットアップは完了です ====="
echo "以下のコマンドでアプリケーションを起動できます:"
echo "開発環境: docker-compose -f docker-compose.dev.yml up -d"
echo "標準環境: docker-compose up -d"
echo "本番環境: docker-compose -f docker-compose.prod.yml up -d"
