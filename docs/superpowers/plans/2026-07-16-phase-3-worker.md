# Phase 3 Worker 与 AI 报告 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 由 Railway Worker 安全领取、受控执行单个验收任务并生成脱敏的确定性或 AI 报告。

**Architecture:** Supabase RPC 原子领取和更新持租约的任务；Worker 使用依赖注入封装临时目录、命令执行、浏览器和存储。每次任务在 `finally` 清理临时目录，Web 不参与代码执行。

**Tech Stack:** Node.js、TypeScript strict、Supabase RPC、Playwright、Zod、Vitest。

---

### Task 1: Worker 任务租约 RPC

**Files:**
- Create: `supabase/migrations/202607160001_worker_job_lease.sql`
- Create: `supabase/tests/database/phase3_worker_lease.sql`

- [ ] **Step 1: 写失败数据库测试**

验证 `claim_verification_job` 只能领取一条 `queued` 任务，写入 `preparing`、租约与 `started_at`；另一个 Worker 不能更新该任务。

- [ ] **Step 2: 运行失败测试**

Run: `pnpm exec supabase test db --local supabase/tests/database/phase3_worker_lease.sql`
Expected: FAIL，因为当前没有租约持有者校验更新 RPC。

- [ ] **Step 3: 实现最小迁移**

创建 `update_verification_job_for_worker(p_job_id uuid, p_worker_id text, p_status text, p_error_code text, p_error_message text)`，仅当租约未过期且 worker_id 匹配时更新状态；完成状态写入 `finished_at`。

- [ ] **Step 4: 运行数据库测试**

Run: `pnpm exec supabase test db --local supabase/tests/database/phase3_worker_lease.sql`
Expected: PASS。

### Task 2: Worker 运行循环与临时目录清理

**Files:**
- Create: `apps/worker/src/run-worker.ts`
- Create: `apps/worker/src/run-worker.test.ts`
- Create: `apps/worker/src/temporary-workspace.ts`
- Create: `apps/worker/src/temporary-workspace.test.ts`
- Create: `apps/worker/src/index.ts`

- [ ] **Step 1: 写失败单元测试**

测试 `runWorkerOnce` 在没有任务时返回 `idle`；有任务时依次请求 `preparing`、执行处理器、写入最终状态；处理器抛错时写 `failed`。测试 `withTemporaryWorkspace` 在成功和抛错时均调用清理函数。

- [ ] **Step 2: 运行失败测试**

Run: `pnpm --filter @vibeverify/worker test -- src/run-worker.test.ts src/temporary-workspace.test.ts`
Expected: FAIL，因为模块不存在。

- [ ] **Step 3: 实现最小 Worker 核心**

使用接口注入 `claim`、`update`、`process` 与临时目录依赖；入口只循环调用 `runWorkerOnce`，不接收 HTTP 用户请求或浏览器 `user_id`。

- [ ] **Step 4: 运行 Worker 测试**

Run: `pnpm --filter @vibeverify/worker test`
Expected: PASS。

### Task 3: 受控项目识别与执行

**Files:**
- Create: `apps/worker/src/project-plan.ts`
- Create: `apps/worker/src/project-plan.test.ts`
- Create: `apps/worker/src/run-command.ts`
- Create: `apps/worker/src/run-command.test.ts`

- [ ] **Step 1: 写失败测试**

测试只有 Vite/Next.js 且脚本在白名单中的项目可生成计划；`.env`、`.git`、`node_modules` 不进入清单；命令硬超时并截断输出。

- [ ] **Step 2: 运行失败测试**

Run: `pnpm --filter @vibeverify/worker test -- src/project-plan.test.ts src/run-command.test.ts`
Expected: FAIL，因为识别和受控执行模块不存在。

- [ ] **Step 3: 实现最小白名单与限制**

仅允许 `npm ci`、`npm run build` 与识别后的启动脚本；实现 10 分钟超时、输出大小限制和非零退出码归类，不写入源码或环境变量内容。

- [ ] **Step 4: 运行 Worker 测试**

Run: `pnpm --filter @vibeverify/worker test`
Expected: PASS。

### Task 4: 浏览器证据与确定性报告

**Files:**
- Create: `apps/worker/src/collect-evidence.ts`
- Create: `apps/worker/src/collect-evidence.test.ts`
- Create: `packages/prompting/src/report-schema.ts`
- Create: `packages/prompting/src/report-schema.test.ts`

- [ ] **Step 1: 写失败测试**

测试证据只包含首页状态、受限截图元数据和脱敏控制台摘要；报告 schema 拒绝无证据的“已验证”结论，并在模型不可用时生成 `at_risk` 或 `failed` 的确定性报告。

- [ ] **Step 2: 运行失败测试**

Run: `pnpm --filter @vibeverify/worker test -- src/collect-evidence.test.ts; pnpm --filter @vibeverify/prompting test`
Expected: FAIL，因为模块不存在。

- [ ] **Step 3: 实现最小证据与报告 schema**

仅使用 Playwright 打开本地 Worker 启动的 URL；Zod 校验 verdict、分数、置信度和 evidence id，任何模型失败回退为确定性报告。

- [ ] **Step 4: 运行测试**

Run: `pnpm --filter @vibeverify/worker test; pnpm --filter @vibeverify/prompting test`
Expected: PASS。

### Task 5: 集成与最终验证

**Files:**
- Modify: `apps/worker/src/index.ts`
- Test: `apps/worker/src/run-worker.test.ts`

- [ ] **Step 1: 写失败集成测试**

测试固定 Vite/Next 样本经模拟来源处理后，Worker 写入 `completed` 或带可读摘要的 `failed`，且临时目录清理。

- [ ] **Step 2: 实现最小集成编排**

将领取、来源准备、项目计划、执行、证据和报告按状态串联；所有失败路径在 `finally` 清理并写回摘要。

- [ ] **Step 3: 运行最终验证**

Run: `pnpm exec supabase test db --local supabase/tests/database; pnpm lint; pnpm typecheck; pnpm test; git diff --check`
Expected: PASS。
