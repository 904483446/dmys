# Phase 2 上传与每日配额设计

**范围：** 本设计仅覆盖 Phase 2 的第一项：私有 Storage 签名上传、ZIP 预校验、需求/PRD 表单，以及每位用户每日 3 次创建配额。不实现 GitHub App、Worker、状态轮询、报告、导出或重新验收。

## 目标与验收

已登录且 `access_status = active` 的用户可以在 `/new` 提交非空需求、一个 ZIP 来源和可选 PRD。系统创建归属当前 session 用户的 `queued` job；同一用户在同一上海自然日第四次创建会被拒绝。上传对象和数据库记录均不能被其他用户访问。

## 方案与边界

浏览器不接触 service role，也不提交 `userId`。它先向 BFF 请求上传签名，再直接上传至私有 `uploads` bucket。服务端生成对象路径，客户端不能指定路径。

签名接口在上传前校验文件用途、文件名、MIME 类型和大小：来源仅接受 `.zip`，最大 50MB；PRD 仅接受 PDF、DOCX、Markdown。创建 job 时，BFF 从私有 Storage 读取 ZIP 的归档目录元数据，拒绝不是 ZIP、含绝对路径或 `..` 路径段、含 `.env`、`.git`、`node_modules`，或超过文件数、单文件解压大小、总解压大小限制的归档。此步骤只检查归档元数据，不解压、更不执行用户代码；真正的解压与执行继续只属于后续 Railway Worker。

## 数据与权限

新增私有 `uploads` Storage bucket 和基于 `storage.foldername(name)[1] = auth.uid()::text` 的对象策略。每个签名对象均位于 `user_id` 命名空间下，并使用服务端生成的随机文件名。

新增一个 `security invoker` 数据库 RPC，用 `auth.uid()` 作为唯一归属来源。在事务中检查 `profiles.access_status = 'active'`，统计 Asia/Shanghai 当天已创建的 `verification_jobs`，达到 3 条时抛出稳定错误码；否则创建 `projects`（`source_type = 'zip'`）和 `verification_jobs`（`status = 'queued'`）。`source_snapshot` 仅保存 ZIP 对象路径、原始文件名和已校验的非敏感元数据，不能保存源码、Token 或 URL。

## 接口与错误

`POST /api/v1/uploads/sign` 接受 `{ kind, fileName, contentType, sizeBytes }`，要求 active session，并返回私有短期签名上传信息和由服务端确定的 `storagePath`。

`POST /api/v1/verification-jobs` 接受需求文本、`source: { type: 'zip', sourceStoragePath }` 与可选 `prdStoragePath`。它验证所有对象都归当前用户所有，执行 ZIP 目录预校验，再调用配额/创建 RPC，成功返回 `{ job }`。

所有失败均返回 `{ error: { code, message, details? } }`，其中 `message` 为中文。无效 ZIP 返回 `INVALID_ZIP`，越权或未知上传对象返回 `SOURCE_NOT_FOUND`，超额返回 `DAILY_JOB_LIMIT_EXCEEDED`，未登录或未激活沿用稳定认证/访问错误码。

## 前端

`/new` 使用一个 Client Component 处理文件选择、签名上传与提交。表单包含必填需求文本、必选 ZIP 和可选 PRD；在请求失败时显示服务端的中文消息。页面不读取 service role，不显示私有对象路径，不运行或预览上传源码。

## 测试与验证

实现采用测试先行。先写并观察失败的单元/API 测试，覆盖 ZIP 目录拒绝规则、未激活访问、超出每日额度、跨用户对象/任务访问，以及成功创建 `queued` job。数据库迁移附加 Supabase SQL 测试，验证 Storage 策略、RPC 的 `auth.uid()` 归属和配额并发安全语义。

每个小阶段执行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、变更文件的 Prettier 检查和 `git diff --check`；涉及迁移时执行 `supabase test db`。全仓 `pnpm format:check` 目前有既有格式基线失败，不能把它误报为本阶段回归。

## 非目标

本小阶段不接入 GitHub App，不保存或加密 GitHub Token，不启动 Railway Worker，不执行 ZIP 中的任何代码，不生成 AI 报告，也不实现任务轮询、列表、详情、rerun 或导出。
