# アプリケーション起動スクリプト
# 使用方法: .\run-app.ps1 [development|local|production]

param (
    [string]$Environment = ""
)

# 環境が指定されていない場合、ユーザーに選択させる
if (-not $Environment) {
    Write-Host "環境を選択してください:" -ForegroundColor Cyan
    Write-Host "1: 開発環境 (development)" -ForegroundColor Yellow
    Write-Host "2: ローカル環境 (local)" -ForegroundColor Yellow
    Write-Host "3: 本番環境 (production)" -ForegroundColor Yellow
    
    $selection = Read-Host "環境を選択 (1-3)"
    
    switch ($selection) {
        "1" { $Environment = "development" }
        "2" { $Environment = "local" }
        "3" { $Environment = "production" }
        default {
            Write-Host "無効な選択です。ローカル環境を使用します。" -ForegroundColor Red
            $Environment = "local"
        }
    }
}

# 環境を切り替える
Write-Host "環境を[$Environment]に切り替えています..." -ForegroundColor Cyan
& .\switch-env.ps1 $Environment

# docker-compose.current.ymlが存在することを確認
if (-not (Test-Path ".\docker-compose.current.yml")) {
    Write-Host "エラー: docker-compose.current.ymlが見つかりません。環境切替に失敗した可能性があります。" -ForegroundColor Red
    exit 1
}

# 既存のコンテナを停止
Write-Host "既存のコンテナを停止中..." -ForegroundColor Yellow
docker-compose -f docker-compose.current.yml down

# コンテナを起動
Write-Host "[$Environment]環境のコンテナを起動中..." -ForegroundColor Green
docker-compose -f docker-compose.current.yml down --remove-orphans
docker-compose -f docker-compose.current.yml up -d --build --remove-orphans

# 起動状態を確認
Write-Host "`nコンテナの状態:" -ForegroundColor Cyan
docker-compose -f docker-compose.current.yml ps

# アクセス方法を表示
Write-Host "`nアプリケーションへのアクセス:" -ForegroundColor Cyan
if ($Environment -eq "production") {
    Write-Host "ブラウザで http://localhost にアクセスしてください。" -ForegroundColor Green
} else {
    Write-Host "ブラウザで http://localhost:3000 にアクセスしてください。" -ForegroundColor Green
}

# ログ表示の選択
$showLogs = Read-Host "アプリケーションのログを表示しますか？ (y/n)"
if ($showLogs -eq "y") {
    Write-Host "`nログを表示しています... (Ctrl+C で終了)" -ForegroundColor Yellow
    docker-compose -f docker-compose.current.yml logs -f
}
