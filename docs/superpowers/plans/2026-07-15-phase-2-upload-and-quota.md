# Phase 2 上传与每日配额 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** active 用户通过私有 ZIP/PRD 上传创建每日最多 3 个 `queued` 验收任务。

**Architecture:** 浏览器向 BFF 请求服务端固定路径的 Storage 短期签名，再直传私有 bucket。BFF 只读取 ZIP central directory，不解压或执行代码；数据库 RPC 以 `auth.uid()` 完成原子配额检查和创建。

**Tech Stack:** Next.js、React、TypeScript strict、Zod、Supabase、Vitest、pgTAP。

---

### Task 1: 输入与 ZIP 安全校验

**Files:**
- Modify: `packages/contracts/src/index.ts`, `apps/web/package.json`, `pnpm-lock.yaml`
- Create: `apps/web/src/features/uploads/upload-request-policy.ts`, `apps/web/src/features/jobs/inspect-zip-archive.ts`
- Test: `apps/web/src/features/uploads/upload-request-policy.test.ts`, `apps/web/src/features/jobs/inspect-zip-archive.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('拒绝超过 50MB 的 ZIP', () => {
  expect(validateUploadRequest({
    kind: 'source_zip', fileName: 'site.zip',
    contentType: 'application/zip', sizeBytes: 50 * 1024 * 1024 + 1,
  })).toMatchObject({ ok: false, code: 'UPLOAD_TOO_LARGE' });
});

it('拒绝带回退路径的 ZIP', async () => {
  await expect(inspectZipArchive(zipWith('../escape.txt')))
    .resolves.toMatchObject({ ok: false, code: 'INVALID_ZIP' });
});
```

- [ ] **Step 2: 确认失败**

Run: `pnpm --filter @vibeverify/web test -- upload-request-policy.test.ts inspect-zip-archive.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 最小实现**

追加稳定错误码。上传策略限制 ZIP 为 `.zip`/50MB，PRD 为 PDF、DOCX、Markdown，非法大小返回 `INVALID_REQUEST`。添加 `yauzl` 和类型；检查器仅以 `yauzl.fromBuffer(buffer, { lazyEntries: true, validateFileName: true })` 枚举 central directory，拒绝非 ZIP、绝对/回退路径、`.env`、`.git`、`node_modules`、超过 10,000 文件、100MB 单文件或 500MB 总声明解压大小；不得调用解压、流读取、子进程或执行 API。

- [ ] **Step 4: 确认通过**

Run: `pnpm --filter @vibeverify/web test -- upload-request-policy.test.ts inspect-zip-archive.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/contracts/src/index.ts apps/web/package.json pnpm-lock.yaml apps/web/src/features/uploads/upload-request-policy.* apps/web/src/features/jobs/inspect-zip-archive.*
git commit -m "feat(uploads): validate private zip uploads"
```

### Task 2: 私有 Storage 与原子额度 RPC

**Files:**
- Create: `supabase/migrations/202607150001_phase2_uploads_and_job_creation.sql`
- Test: `supabase/tests/database/phase2_uploads_and_quota.sql`

- [ ] **Step 1: 写失败数据库测试**

使用两个 auth 用户，断言 `uploads` 为非公开 bucket；第二用户不能读写第一用户 UUID 首段下的 object；同一 JWT sub 调用四次 `create_zip_verification_job` 时前三次为 `queued`、第四次抛 `DAILY_JOB_LIMIT_EXCEEDED`；第二用户不能读到该 job。

- [ ] **Step 2: 确认失败**

Run: `pnpm exec supabase test db --file supabase/tests/database/phase2_uploads_and_quota.sql`

Expected: FAIL，bucket、策略、RPC 不存在。

- [ ] **Step 3: 最小迁移**

插入私有 `storage.buckets('uploads')`，并为 `storage.objects` 添加 `bucket_id = 'uploads'`、`storage.foldername(name)[1] = auth.uid()::text` 的 select/insert/delete 策略。实现 `security invoker public.create_zip_verification_job(display_name, request_text, prd_storage_path, source_storage_path, source_snapshot)`：拒绝空 uid/非 active profile；用 `Asia/Shanghai` 当日统计当前 uid jobs，达到 3 条时抛稳定异常；否则插入 zip project 与 queued job。函数不接收 userId，仅授权 authenticated。

- [ ] **Step 4: 确认通过**

Run: `pnpm exec supabase test db --file supabase/tests/database/phase2_uploads_and_quota.sql`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add supabase/migrations/202607150001_phase2_uploads_and_job_creation.sql supabase/tests/database/phase2_uploads_and_quota.sql
git commit -m "feat(database): add private uploads and job quota"
```

### Task 3: BFF 签名与创建 queued job

**Files:**
- Create: `apps/web/src/features/uploads/create-upload-signature.ts`
- Create: `apps/web/src/app/api/v1/uploads/sign/route.ts`
- Create: `apps/web/src/features/jobs/create-zip-job.ts`
- Create: `apps/web/src/app/api/v1/verification-jobs/route.ts`
- Test: 同目录 `*.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('拒绝当前用户命名空间外的上传对象', async () => {
  await expect(createZipJob({
    userId: ownerId, sourceStoragePath: otherId + '/source.zip',
  })).resolves.toMatchObject({ ok: false, code: 'SOURCE_NOT_FOUND' });
});

it('将超配额映射为中文 429 错误', async () => {
  expect(await postJobWithRpcError('DAILY_JOB_LIMIT_EXCEEDED'))
    .toMatchObject({ status: 429, body: { error: { code: 'DAILY_JOB_LIMIT_EXCEEDED', message: '今日验收次数已达上限' } } });
});
```

- [ ] **Step 2: 确认失败**

Run: `pnpm --filter @vibeverify/web test -- create-upload-signature.test.ts create-zip-job.test.ts route.test.ts`

Expected: FAIL，服务和路由不存在。

- [ ] **Step 3: 最小实现**

签名 Route 用 Zod 解析 `{ kind, fileName, contentType, sizeBytes }`，通过 server session/profile 强制 active；由服务端用当前 UUID、随机 UUID 和安全文件名确定对象路径，调用 `createSignedUploadUrl`。Job Route 用 Zod 限制 trim 后需求为 1..10,000 字符且 source 仅为 zip；验证 ZIP/PRD 路径首段、下载 ZIP、调用 Task 1 检查器、调用 RPC。所有错误均为统一中文对象；响应不含 userId、对象路径、源码、Token 或私有 URL；绝不创建 service-role client。

- [ ] **Step 4: 确认通过**

Run: `pnpm --filter @vibeverify/web test -- create-upload-signature.test.ts create-zip-job.test.ts route.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/web/src/features/uploads apps/web/src/features/jobs/create-zip-job.* apps/web/src/app/api/v1/uploads/sign/route.ts apps/web/src/app/api/v1/verification-jobs/route.ts
git commit -m "feat(jobs): create private queued zip jobs"
```

### Task 4: 新建验收表单

**Files:**
- Create: `apps/web/src/app/new/page.tsx`, `apps/web/src/app/new/page.test.tsx`
- Create: `apps/web/src/features/jobs/new-verification-form.tsx`, `apps/web/src/features/jobs/new-verification-form.test.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: 写失败测试**

渲染断言“验收需求”“项目 ZIP”“补充 PRD（可选）”与提交按钮；注入 API 失败时显示中文消息；成功时导航 `/reports`。

- [ ] **Step 2: 确认失败**

Run: `pnpm --filter @vibeverify/web test -- new-verification-form.test.tsx page.test.tsx`

Expected: FAIL，页面/组件不存在。

- [ ] **Step 3: 最小实现**

页面复用 reports 的 session/profile gate。Client form 顺序请求签名、调用 browser Supabase client 的 `uploadToSignedUrl` 上传 ZIP/可选 PRD、调用 job API；请求时禁用按钮、成功 `router.push('/reports')`。不预览、解压或执行上传文件；CSS 只增加表单类。

- [ ] **Step 4: 确认通过**

Run: `pnpm --filter @vibeverify/web test -- new-verification-form.test.tsx page.test.tsx`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/web/src/app/new apps/web/src/features/jobs/new-verification-form.* apps/web/src/app/styles.css
git commit -m "feat(jobs): add zip verification form"
```

### Task 5: 阶段验证

- [ ] **Step 1: 数据库测试**

Run: `pnpm exec supabase test db`

Expected: Phase 1 和新增 Phase 2 SQL 测试通过。

- [ ] **Step 2: 质量与 CI 等价验证**

Run: `pnpm lint`
Run: `pnpm typecheck`
Run: `pnpm test`
Run: `pnpm format:check`
Run: `git diff --check`
Run: `CI=true pnpm install --frozen-lockfile`

Expected: 除已记录的全仓 Prettier 既有基线外均通过；新增/修改文件的单独 Prettier 检查通过，锁文件无变动。

