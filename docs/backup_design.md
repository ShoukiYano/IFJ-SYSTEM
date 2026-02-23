# データベース自動バックアップ設計 (Phase 9)

データの安全性と電子帳簿保存法の要件（長期保存）を満たすため、以下のバックアップ運用を推奨・設計します。

## 1. バックアップ戦略概要

| 項目 | 内容 |
|:---|:---|
| **方式** | `pg_dump` による論理バックアップ |
| **頻度** | 毎日 1回 (深夜 03:00) |
| **世代管理** | 直近 7日間 ＋ 毎月 1回分を1年間保持 |
| **保存先** | クラウドストレージ (S3 / Google Cloud Storage) または 外部マウントボリューム |

## 2. 自動バックアップスクリプト (`scripts/backup-db.sh`)

```bash
#!/bin/bash
# 設定
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
DATABASE_URL="postgresql://user:password@localhost:5432/invoice_db"

# ディレクトリ作成
mkdir -p $BACKUP_DIR

# バックアップ実行
docker exec invoice-db pg_dump -U user invoice_db > $BACKUP_FILE

# 古いバックアップの削除 (7日経過分)
find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

## 3. 自動実行の設定 (Cron)

Linux環境で運用する場合、以下のCrontab設定を追加します。

```cron
0 3 * * * /path/to/project/scripts/backup-db.sh >> /var/log/db_backup.log 2>&1
```

## 4. 復元手順 (Restoration)

障害発生時は以下のコマンドで復元を行います。

```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i invoice-db psql -U user invoice_db
```

## 5. 今後の拡張
- **暗号化**: バックアップファイルを GPG 等で暗号化して保存。
- **外部転送**: `rclone` や `aws s3 cp` を使用して、バックアップファイルを外部ストレージに転送。
- **監視**: バックアップの成否を Discord や Slack に通知。
