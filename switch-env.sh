#!/bin/bash
# Ubuntu/Linux用の環境切替スクリプト
# 使用方法: ./switch-env.sh [development|local|production]

# デフォルトの環境
DEFAULT_ENV="local"
ENV=${1:-$DEFAULT_ENV}

# 許可された環境値
VALID_ENVS=("development" "local" "production")

# 環境値のバリデーション
is_valid=0
for valid_env in "${VALID_ENVS[@]}"; do
  if [ "$ENV" == "$valid_env" ]; then
    is_valid=1
    break
  fi
done

if [ $is_valid -eq 0 ]; then
  echo "エラー: 無効な環境名です。development, local, productionのいずれかを指定してください。"
  exit 1
fi

# 現在のディレクトリがプロジェクトのルートディレクトリであることを確認
if [ ! -d "./environments" ]; then
  echo "エラー: このスクリプトはプロジェクトのルートディレクトリから実行してください。"
  exit 1
fi

# 環境切り替え処理
echo "環境を切り替えています: $ENV"

# 現在の環境をクリーンアップ
if [ -f "./docker-compose.current.yml" ]; then
  rm "./docker-compose.current.yml"
fi

# 対象の環境用のdocker-compose.ymlをコピー
cp "./environments/$ENV/docker-compose.yml" "./docker-compose.current.yml"
echo "docker-compose.ymlを$ENV環境用に設定しました"

# 環境変数を更新
if [ -f "./environments/$ENV/.env" ]; then
  if [ -f "./.env" ]; then
    read -p "現在の.envファイルを上書きしますか？ (y/n) " overwrite
    if [ "$overwrite" == "y" ]; then
      cp "./environments/$ENV/.env" "./.env"
      echo ".envファイルを$ENV環境用に更新しました"
    fi
  else
    cp "./environments/$ENV/.env" "./.env"
    echo ".envファイルを$ENV環境用に作成しました"
  fi
elif [ -f "./environments/$ENV/.env.example" ]; then
  if [ ! -f "./.env" ]; then
    echo "環境変数ファイル(.env)が見つかりません。サンプルファイルからコピーします。"
    cp "./environments/$ENV/.env.example" "./.env"
    echo ".envファイルをサンプルから作成しました。必要に応じて編集してください。"
  fi
fi

# 環境タイプを記録
echo $ENV > "./.env.current"

echo "環境を[$ENV]に切り替えました。"
echo "アプリケーションを起動するには次のコマンドを実行してください:"
echo "docker-compose -f docker-compose.current.yml up -d"
