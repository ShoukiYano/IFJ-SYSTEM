# SES業界特化型 請求書管理システム (Invoice Flow Japan)

SES業界の商習慣に最適化した、高機能な請求書・見積書管理システムです。
超過・控除の自動計算、契約更新アラート、電帳法準拠の検索機能などを備えています。

## 🚀 技術スタック
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS / Shadcn UI
- **PDF**: @react-pdf/renderer

---

## 🛠️ 事前準備
セットアップ前に以下のツールがインストールされていることを確認してください。

- **Node.js**: v18.x 以上
- **Docker & Docker Compose**: データベース（PostgreSQL）の起動に使用
- **Git**: リポジトリのクローンに使用

---

## 📥 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/ShoukiYano/IFJ-SYSTEM.git
cd IFJ-SYSTEM
```

### 2. 環境変数の設定
`.env.example` をコピーして `.env` ファイルを作成し、パスワードを設定します。

```bash
cp .env.example .env
```

`.env` を開いて `POSTGRES_PASSWORD` と `DATABASE_URL` の **2箇所のパスワードを同じ値** に設定してください。

```env
# 例: 好きなパスワードを設定する
POSTGRES_PASSWORD=あなたのパスワード

# ↓ DATABASE_URLの中のパスワードも同じ値に変更する
DATABASE_URL="postgresql://postgres:あなたのパスワード@db:5432/invoice_db?schema=public"
```

> ⚠️ **注意**: `.env` ファイルは Git にコミットされません（`.gitignore` で除外済み）。
> パスワードを他人に共有しないようにしてください。

### 3. アプリケーションの起動 (Docker)
以下のコマンドを実行するだけで、データベースとアプリケーションの両方が起動します。
初回起動時はビルドと依存関係のインストールが行われます。
#### ※場所、処理速度によって時間がかかる場合があります。
#### 実行完了時間　平均15分程度

```bash
docker-compose up --build
```

---

## 🌐 動作確認
起動が完了したら、ブラウザで以下のURLにアクセスしてください。

**[http://localhost:3000](http://localhost:3000)**

---

### 4. データベースの初期化 (初回のみ)
コンテナが起動している状態で、別のターミナルから以下のコマンドを実行してテーブルの作成と初期データの投入（管理者登録）を行います。

```bash
docker-compose exec app npx prisma migrate dev --name init
docker-compose exec app npx prisma db seed
```

---

## 🛠️ ローカル開発（Dockerを使わない場合）

1. `npm install`
2. データベースのみ Docker で起動: `docker-compose up -d db`
3. `npx prisma migrate dev`
4. `npm run dev`

---

## 🖥️ OS別の補足情報

### 🪟 Windows
- **Terminal**: PowerShell または Git Bash を推奨します。
- **Docker**: Docker Desktop for Windows をインストールし、WSL2 バックエンドを有効にしてください。
- **実行ポリシー**: PowerShellでスクリプトが実行できない場合は、管理者権限で `Set-ExecutionPolicy RemoteSigned` を実行してください。

### 🐧 Linux (Ubuntu/Debian)
- **Docker**: `sudo` なしで Docker を実行できるように、ユーザーを `docker` グループに追加することを推奨します。
  ```bash
  sudo usermod -aG docker $USER
  ```
- **Port**: 3000番ポートが他のサービスで使用されていないか確認してください（`sudo lsof -i :3000`）。

### 🍎 Mac (Intel/Apple Silicon)
- **Docker**: Docker Desktop for Mac を使用してください。
- **Node.js**: `nvm` を使用したインストールを推奨します。
- **Apple Silicon (M1/M2/M3)**: Dockerイメージは `postgres:15-alpine` を使用しているため、マルチプラットフォーム対応で問題なく動作します。

---

## 📖 主な機能
- **SES精算機能**: 超過・控除の自動計算（テンプレート切り替え可能）
- **契約管理**: 契約終了2ヶ月前のアラート通知
- **一括操作**: 請求書のバルク作成、一括ZIPダウンロード
- **検索機能**: 電帳法準拠（取引先・日付・金額範囲での検索）
- **ドキュメント作成**: 請求書・見積書・注文書・注文請書のPDF出力

---

## 📝 ライセンス
商用利用・改変についてはプロジェクト管理者にお問い合わせください。
