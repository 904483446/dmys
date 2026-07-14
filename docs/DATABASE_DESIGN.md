# 数据库设计

所有业务表位于 `public` schema，主键使用 UUID；时间使用 `timestamptz`；枚举以 PostgreSQL enum 或受控 text check 实现。每张用户数据表启用 RLS。

## 核心表

### `profiles`

| 字段 | 类型 | 约束/说明 |
|---|---|---|
| `id` | uuid | PK，FK → `auth.users.id` |
| `display_name` | text | 可空 |
| `access_status` | text | `invited`/`active`/`blocked` |
| `created_at` | timestamptz | 默认 `now()` |

### `github_installations`

| 字段 | 类型 | 约束/说明 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles，索引 |
| `installation_id` | bigint | GitHub installation id，唯一 |
| `account_login` | text | 展示名 |
| `encrypted_token` | bytea | 仅服务端可读取 |
| `revoked_at` | timestamptz | 可空 |

### `projects`

| 字段 | 类型 | 约束/说明 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles，索引 |
| `source_type` | text | `github`/`zip` |
| `display_name` | text | 非空 |
| `github_installation_id` | uuid | 可空 FK |
| `github_repository_id` | bigint | GitHub 来源时非空 |
| `github_repository_full_name` | text | 不在公开响应输出 |
| `created_at` | timestamptz | 默认 `now()` |

### `verification_jobs`

| 字段 | 类型 | 约束/说明 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` / `project_id` | uuid | FK，均索引 |
| `status` | text | `queued`/`preparing`/`building`/`running`/`testing`/`reporting`/`completed`/`failed`/`timed_out` |
| `request_text` | text | 用户必填需求 |
| `prd_storage_path` | text | 可空私有对象路径 |
| `source_snapshot` | jsonb | ref、commit 或 ZIP 元数据，不能含 Token |
| `lease_expires_at` | timestamptz | Worker 任务租约 |
| `started_at` / `finished_at` | timestamptz | 可空 |
| `error_code` / `error_message` | text | 可空、面向用户摘要 |

索引：`(user_id, created_at desc)`、`(status, created_at)`、`(lease_expires_at)`。

### `verification_reports`

| 字段 | 类型 | 约束/说明 |
|---|---|---|
| `id` | uuid | PK |
| `job_id` | uuid | FK，唯一 |
| `user_id` | uuid | FK，索引 |
| `verdict` | text | `passed`/`at_risk`/`failed` |
| `score` | smallint | 0–100 |
| `confidence` | smallint | 0–100 |
| `summary` | text | 非空 |
| `verified_items` | jsonb | 可验证功能数组 |
| `issues` | jsonb | 问题、等级、证据、修复提示词 |
| `created_at` | timestamptz | 默认 `now()` |

### `job_artifacts`

保存经过筛选的截图/文本摘要，不保存源码。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid | PK |
| `job_id` / `user_id` | uuid | FK、索引 |
| `kind` | text | `screenshot`/`console_summary`/`network_summary` |
| `storage_path` | text | 私有 Storage 路径，可空 |
| `metadata` | jsonb | 脱敏元数据 |

## 关系与权限

一个用户有多个项目、任务与报告；一个任务至多一个不可变报告；重新验收创建新任务而非更新旧报告。RLS 策略以 `auth.uid() = user_id` 限制 `select/insert/update/delete`。Worker 使用 service role，仅通过安全 RPC 领取任务，不能依赖浏览器传入的 `user_id`。

## 存储桶

`uploads`（短期 ZIP/PRD）、`artifacts`（私有截图）。上传对象为私有；Worker 完成后删除 ZIP 与临时源对象，PRD 和截图按用户删除报告时级联删除。所有对象路径以 `user_id/job_id` 命名，禁止公开 bucket。
