# Phase 2 GitHub App 接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 active 用户安全安装 GitHub App、选择自己的私有仓库和分支，并能撤销安装。

**Architecture:** BFF 以短时、一次性 state 关联 session 用户和 GitHub App 安装回调。数据库以 RLS 保存安装状态；GitHub API token 仅由服务端按需签发并留在内存中，浏览器只得到经脱敏的仓库/分支 DTO。

**Tech Stack:** Next.js Route Handlers、TypeScript strict、Zod、Supabase PostgreSQL/RLS、Vitest、pgTAP。

---

### Task 1: 安装记录与 RLS

**Files:**
- Create: `supabase/migrations/202607150002_github_installations.sql`
- Test: `supabase/tests/database/phase2_github_installations.sql`

- [ ] **Step 1: 写失败 pgTAP 测试**

断言 `github_installations` 存在、启用 RLS、包含唯一 `installation_id`、`encrypted_token bytea` 与 `revoked_at`；以两个 authenticated 用户断言第二用户不能读取或更新第一用户安装记录。

- [ ] **Step 2: 确认失败**

Run: `pnpm exec supabase test db --local supabase/tests/database/phase2_github_installations.sql`

Expected: FAIL，表和策略不存在。

- [ ] **Step 3: 最小迁移**

创建表与 `user_id` 索引，启用 RLS。添加 `auth.uid() = user_id` select/insert/update/delete 策略；客户端 select policy 不包含加密字段的公开 DTO，BFF 也不得选择该字段。

- [ ] **Step 4: 确认通过**

Run: `pnpm exec supabase test db --local supabase/tests/database/phase2_github_installations.sql`

Expected: PASS。

### Task 2: 安装 state 与回调服务

**Files:**
- Modify: `.env.example`
- Create: `apps/web/src/features/github/install-state.ts`
- Create: `apps/web/src/features/github/complete-installation.ts`
- Test: 同目录 `*.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('拒绝过期或不属于当前用户的安装 state', () => {
  expect(consumeInstallState({ state: 'expired', userId: 'user-a' }))
    .toMatchObject({ ok: false, code: 'INVALID_GITHUB_INSTALLATION_STATE' });
});
```

- [ ] **Step 2: 确认失败**

Run: `pnpm --filter @vibeverify/web test -- install-state.test.ts complete-installation.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 最小实现**

环境只新增变量名 `GITHUB_APP_SLUG`、`GITHUB_STATE_ENCRYPTION_KEY`，不写真实值。state 使用 Web Crypto 加密/认证并包含 userId、随机 nonce、10 分钟 expiry；回调服务验证 state、安装 ID 和 active 用户后 upsert 安装摘要。短期 token 如产生仅通过注入的加密器写入 `encrypted_token`，绝不回显。

- [ ] **Step 4: 确认通过**

Run: `pnpm --filter @vibeverify/web test -- install-state.test.ts complete-installation.test.ts`

Expected: PASS。

### Task 3: 安装、回调与撤销 API

**Files:**
- Create: `apps/web/src/app/api/v1/github/installations/connect/route.ts`
- Create: `apps/web/src/app/api/v1/github/installations/callback/route.ts`
- Create: `apps/web/src/app/api/v1/github/installations/[installationId]/revoke/route.ts`
- Test: 相邻 `route.test.ts`

- [ ] **Step 1: 写失败测试**

覆盖未登录/未激活、无效 state、跨用户 installationId、成功 connect 地址不包含 userId/token，以及撤销后返回安装摘要。

- [ ] **Step 2: 确认失败**

Run: `pnpm --filter @vibeverify/web test -- route.test.ts`

Expected: FAIL，对应路由不存在。

- [ ] **Step 3: 最小实现**

connect 返回基于 slug 与 state 的 GitHub 安装 URL。callback 仅处理验证后的 query，成功 redirect `/settings`。revoke 以当前 userId 更新自己的 `revoked_at`；所有错误为中文统一对象。

- [ ] **Step 4: 确认通过**

Run: `pnpm --filter @vibeverify/web test -- route.test.ts`

Expected: PASS。

### Task 4: 私有仓库与分支选择 API

**Files:**
- Create: `apps/web/src/features/github/list-repositories.ts`, `list-branches.ts`
- Create: `apps/web/src/app/api/v1/github/repositories/route.ts`
- Create: `apps/web/src/app/api/v1/github/repositories/[repositoryId]/branches/route.ts`
- Test: 同目录服务及路由测试

- [ ] **Step 1: 写失败测试**

覆盖撤销安装、跨用户 installationId、私有仓库成功返回、分支列表成功返回；断言响应没有 token、私有 clone URL 或 encrypted token。

- [ ] **Step 2: 确认失败**

Run: `pnpm --filter @vibeverify/web test -- list-repositories.test.ts list-branches.test.ts route.test.ts`

Expected: FAIL，服务与路由不存在。

- [ ] **Step 3: 最小实现**

按需创建短时 token 的 GitHub client 通过依赖注入供测试替换。仅映射 API 设计规定字段，先验证 installation 所有权和 `revoked_at is null`，再访问 GitHub API。GitHub 权限/网络错误映射中文稳定错误。

- [ ] **Step 4: 确认通过**

Run: `pnpm --filter @vibeverify/web test -- list-repositories.test.ts list-branches.test.ts route.test.ts`

Expected: PASS。

### Task 5: 完整验证

- [ ] **Step 1: 数据库与应用验证**

Run: `pnpm exec supabase test db --local supabase/tests/database`
Run: `pnpm lint`
Run: `pnpm typecheck`
Run: `pnpm test`
Run: `git diff --check`

Expected: 全部通过。

- [ ] **Step 2: CI 等价安装**

Run: `CI=true pnpm install --frozen-lockfile`

Expected: 退出码 0，锁文件无变动。

