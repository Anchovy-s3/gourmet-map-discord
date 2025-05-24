# Docker環境の状態を確認するためのPowerShellヘルパースクリプト
Write-Host "===== Discord食べログマップ Docker環境チェック =====" -ForegroundColor Cyan

# Dockerがインストールされているか確認
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: インストール済み $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker: インストールされていません" -ForegroundColor Red
    Write-Host "   Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Docker Composeがインストールされているか確認
try {
    $dockerComposeVersion = docker-compose --version
    Write-Host "✅ Docker Compose: インストール済み $dockerComposeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker Compose: インストールされていません" -ForegroundColor Red
    Write-Host "   通常はDocker Desktopに含まれています" -ForegroundColor Yellow
    exit 1
}

# 環境変数の設定を確認
if (Test-Path .env) {
    Write-Host "✅ .envファイル: 存在しています" -ForegroundColor Green
    
    # APIキーの設定を確認
    $envContent = Get-Content .env -Raw
    if ($envContent -match "DISCORD_TOKEN=.+") {
        Write-Host "✅ Discord Token: 設定されています" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Discord Token: 設定されていないか無効です" -ForegroundColor Red
        Write-Host "   .envファイルを編集して有効なトークンを設定してください" -ForegroundColor Yellow
    }
    
    if ($envContent -match "GOOGLE_MAPS_API_KEY=.+") {
        Write-Host "✅ Google Maps API Key: 設定されています" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Google Maps API Key: 設定されていないか無効です" -ForegroundColor Red
        Write-Host "   .envファイルを編集して有効なAPIキーを設定してください" -ForegroundColor Yellow
    }
}
else {
    Write-Host "❌ .envファイル: 存在しません" -ForegroundColor Red
    Write-Host "   .env.exampleをコピーして.envを作成し、必要な環境変数を設定してください" -ForegroundColor Yellow
    
    if (Test-Path .env.example) {
        Write-Host "   .env.exampleを.envにコピーしますか？ (Y/N)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -eq "Y" -or $response -eq "y") {
            Copy-Item .env.example .env
            Write-Host "   .env.exampleを.envにコピーしました。編集してAPIキーを設定してください。" -ForegroundColor Green
        }
    }
}

# データディレクトリの確認
if (Test-Path data) {
    Write-Host "✅ dataディレクトリ: 存在しています" -ForegroundColor Green
    # 書き込み権限の確認 (PowerShellでの簡易チェック)
    try {
        $testFile = "data\test.tmp"
        Set-Content -Path $testFile -Value "test" -ErrorAction Stop
        Remove-Item -Path $testFile -ErrorAction Stop
        Write-Host "✅ dataディレクトリ: 書き込み権限があります" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ dataディレクトリ: 書き込み権限がありません" -ForegroundColor Red
    }
}
else {
    Write-Host "❌ dataディレクトリ: 存在しません" -ForegroundColor Red
    Write-Host "   ディレクトリを作成します..." -ForegroundColor Yellow
    New-Item -Path "data" -ItemType Directory | Out-Null
    Write-Host "✅ dataディレクトリ: 作成しました" -ForegroundColor Green
}

# Dockerコンテナの実行
Write-Host "`n===== 利用可能なDocker環境 =====" -ForegroundColor Cyan
Write-Host "1. 開発環境 (docker-compose -f docker-compose.dev.yml up -d)" -ForegroundColor White
Write-Host "2. 標準環境 (docker-compose up -d)" -ForegroundColor White
Write-Host "3. 本番環境 (docker-compose -f docker-compose.prod.yml up -d)" -ForegroundColor White

# ポートのチェック
Write-Host "`n===== ポート使用状況チェック =====" -ForegroundColor Cyan
try {
    $port3000 = netstat -ano | Select-String ":3000"
    if ($port3000) {
        Write-Host "❌ ポート3000: 既に使用されています" -ForegroundColor Red
        Write-Host $port3000 -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ ポート3000: 利用可能" -ForegroundColor Green
    }

    $port80 = netstat -ano | Select-String ":80 "
    if ($port80) {
        Write-Host "❌ ポート80 (本番環境用): 既に使用されています" -ForegroundColor Red
        Write-Host $port80 -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ ポート80 (本番環境用): 利用可能" -ForegroundColor Green
    }
}
catch {
    Write-Host "ポートの使用状況を確認できませんでした" -ForegroundColor Yellow
}

Write-Host "`n===== 環境のセットアップは完了です =====" -ForegroundColor Cyan
Write-Host "以下のコマンドでアプリケーションを起動できます:" -ForegroundColor White
Write-Host "開発環境: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Green
Write-Host "標準環境: docker-compose up -d" -ForegroundColor Green
Write-Host "本番環境: docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Green

# 環境を選択して起動する
Write-Host "`n起動する環境を選択しますか？ (1: 開発, 2: 標準, 3: 本番, N: 起動しない): " -ForegroundColor Cyan -NoNewline
$choice = Read-Host

switch ($choice) {
    "1" {
        Write-Host "開発環境を起動しています..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml up -d
    }
    "2" {
        Write-Host "標準環境を起動しています..." -ForegroundColor Yellow
        docker-compose up -d
    }
    "3" {
        Write-Host "本番環境を起動しています..." -ForegroundColor Yellow
        docker-compose -f docker-compose.prod.yml up -d
    }
    default {
        Write-Host "環境は起動されていません。必要に応じて手動で起動してください。" -ForegroundColor Yellow
    }
}
