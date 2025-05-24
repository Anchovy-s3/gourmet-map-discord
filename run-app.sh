#!/bin/bash
# Ubuntu/Linux用の環境切替・実行スクリプト

# エラー発生時に停止
set -e

# 引数が指定されていない場合の環境
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

# 環境の切り替え
echo "環境を[$ENV]に切り替えています..."

# 現在の環境をクリーンアップ
if [ -f ./docker-compose.current.yml ]; then
  rm ./docker-compose.current.yml
fi

# 対象の環境用のdocker-compose.ymlをコピー
cp ./environments/$ENV/docker-compose.yml ./docker-compose.current.yml
echo "docker-compose.ymlを$ENV環境用に設定しました"

# 環境変数を更新
if [ -f ./environments/$ENV/.env ]; then
  if [ -f ./.env ]; then
    read -p "現在の.envファイルを上書きしますか？ (y/n) " overwrite
    if [ "$overwrite" == "y" ]; then
      cp ./environments/$ENV/.env ./.env
      echo ".envファイルを$ENV環境用に更新しました"
    fi
  else
    cp ./environments/$ENV/.env ./.env
    echo ".envファイルを$ENV環境用に作成しました"
  fi
elif [ -f ./environments/$ENV/.env.example ]; then
  if [ ! -f ./.env ]; then
    echo "環境変数ファイル(.env)が見つかりません。サンプルファイルからコピーします。"
    cp ./environments/$ENV/.env.example ./.env
    echo ".envファイルをサンプルから作成しました。必要に応じて編集してください。"
  fi
fi

# 環境タイプを記録
echo $ENV > ./.env.current

# 既存のコンテナを停止・削除
echo "既存のコンテナを停止中..."
sudo docker-compose -f docker-compose.current.yml down --remove-orphans 2>/dev/null || true

# コンテナを起動
echo "[$ENV]環境のコンテナを起動中..."
sudo docker-compose -f docker-compose.current.yml up -d --build --remove-orphans

# 起動状態を確認
echo -e "\nコンテナの状態:"
sudo docker-compose -f docker-compose.current.yml ps

# アクセス方法を表示
echo -e "\nアプリケーションへのアクセス:"
if [ "$ENV" == "production" ]; then
  echo "ブラウザで http://localhost にアクセスしてください。"
else
  echo "ブラウザで http://localhost:3000 にアクセスしてください。"
fi

# ログ表示の選択
read -p "アプリケーションのログを表示しますか？ (y/n) " show_logs
if [ "$show_logs" == "y" ]; then
  echo -e "\nログを表示しています... (Ctrl+C で終了)"
  sudo docker-compose -f docker-compose.current.yml logs -f
fi
