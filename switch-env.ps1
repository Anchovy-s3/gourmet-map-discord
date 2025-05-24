# 環境切り替えスクリプト
# 使用方法: .\switch-env.ps1 [development|local|production]

param (
    [string]$Environment = "local"
)

# 許可された環境値
$validEnvironments = @("development", "local", "production")

# 環境値のバリデーション
if (-not $validEnvironments.Contains($Environment)) {
    Write-Host "エラー: 無効な環境名です。development, local, productionのいずれかを指定してください。" -ForegroundColor Red
    exit 1
}

# 現在のディレクトリがプロジェクトのルートディレクトリであることを確認
if (-not (Test-Path ".\environments")) {
    Write-Host "エラー: このスクリプトはプロジェクトのルートディレクトリから実行してください。" -ForegroundColor Red
    exit 1
}

# 環境切り替え処理
function Switch-Environment {
    param (
        [string]$TargetEnv
    )

    Write-Host "環境を切り替えています: $TargetEnv" -ForegroundColor Cyan

    # 現在の環境をクリーンアップ
    if (Test-Path ".\docker-compose.current.yml") {
        Remove-Item ".\docker-compose.current.yml" -Force
    }

    # 対象の環境用のdocker-compose.ymlをコピー
    Copy-Item ".\environments\$TargetEnv\docker-compose.yml" ".\docker-compose.current.yml"
    Write-Host "docker-compose.ymlを$TargetEnv環境用に設定しました" -ForegroundColor Green

    # 環境変数を更新
    if (Test-Path ".\environments\$TargetEnv\.env") {
        if (Test-Path ".\.env") {
            $overwrite = Read-Host "現在の.envファイルを上書きしますか？ (y/n)"
            if ($overwrite -eq "y") {
                Copy-Item ".\environments\$TargetEnv\.env" ".\.env" -Force
                Write-Host ".envファイルを$TargetEnv環境用に更新しました" -ForegroundColor Green
            }
        } else {
            Copy-Item ".\environments\$TargetEnv\.env" ".\.env" -Force
            Write-Host ".envファイルを$TargetEnv環境用に作成しました" -ForegroundColor Green
        }
    } elseif (Test-Path ".\environments\$TargetEnv\.env.example") {
        if (-not (Test-Path ".\.env")) {
            Write-Host "環境変数ファイル(.env)が見つかりません。サンプルファイルからコピーします。" -ForegroundColor Yellow
            Copy-Item ".\environments\$TargetEnv\.env.example" ".\.env"
            Write-Host ".envファイルをサンプルから作成しました。必要に応じて編集してください。" -ForegroundColor Yellow
        }
    }

    # 環境タイプを記録
    Set-Content -Path ".\.env.current" -Value $TargetEnv

    Write-Host "環境を[$TargetEnv]に切り替えました。" -ForegroundColor Green
    Write-Host "アプリケーションを起動するには次のコマンドを実行してください:" -ForegroundColor Cyan
    Write-Host "docker-compose -f docker-compose.current.yml up -d" -ForegroundColor White
}

# 実際の環境切り替え処理を実行
Switch-Environment -TargetEnv $Environment
