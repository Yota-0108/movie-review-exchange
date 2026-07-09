# 映画感想ランダム交換システム

ランダムマッチングによる非同期の映画感想共有システム。感想を投稿するとDBに蓄積され、受け取り手は区分・年代・タグ等の条件を指定して、条件に合う感想を1件ランダムに受け取る。

Movie DB(PostgreSQL/Supabase, Node.js, Render)の拡張プロジェクト。今回はAWSへ完全移行して構築する。

詳細な設計・判断根拠は [docs/DESIGN.md](docs/DESIGN.md) を、AWSデプロイに関する人間/AIの作業分担は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照。

## 技術スタック

- **フロントエンド**: React
- **バックエンド**: AWS Lambda(REST API)
- **API**: API Gateway(HTTP API + JWT Authorizer)
- **DB**: Aurora Serverless v2(PostgreSQL, RDS Data API経由)
- **認証**: Amazon Cognito
- **ストレージ**: S3(プロフィール画像)
- **配信**: CloudFront(S3 + API Gatewayのマルチオリジン構成)
- **IaC**: AWS CDK(TypeScript)

## 構成図(概要)

```
                 ┌────────────┐
Browser ───────▶ │ CloudFront │
                 └─────┬──────┘
              /* ───────┼─────── /api/*
              ▼                    ▼
        ┌──────────┐      ┌───────────────┐
        │    S3    │      │  API Gateway  │
        │ (React)  │      │  (HTTP API)   │
        └──────────┘      └───────┬───────┘
                                   │ JWT Authorizer(Cognito検証)
                                   ▼
                            ┌────────────┐
                            │   Lambda   │
                            └─────┬──────┘
                                  │ RDS Data API
                                  ▼
                       ┌────────────────────┐
                       │ Aurora Serverless v2 │
                       └────────────────────┘
```

## セットアップ

> AWSアカウント作成、認証情報設定、`cdk bootstrap`/`cdk deploy`の実行など、課金や契約が絡む操作は人間が行う。詳細は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照。

(実装が進み次第、具体的なコマンドをここに追記する)

## ディレクトリ構成(予定)

```
.
├── cdk/        -- AWS CDK(インフラ定義)
├── backend/    -- Lambda関数のコード
├── frontend/   -- Reactアプリ
└── docs/       -- 設計ドキュメント
```
