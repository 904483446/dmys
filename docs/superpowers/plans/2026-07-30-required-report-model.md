# 强制报告模型与修复提示词保留 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 报告模型不可用时任务明确失败且不保存降级报告；模型成功生成的项目问题继续保留修复提示词与导出功能。

**Architecture:** DeepSeek 适配器将配置、网络、HTTP 和响应校验失败映射为不包含原始内容的安全错误码。任务处理器不再构造确定性报告，错误交给 Worker 写回 failed 状态。报告页面只对真实模型问题显示复制修复提示词和导出操作，并补齐这些操作的产品样式。

**Tech Stack:** TypeScript、React、Vitest、Next.js、Railway Worker。

---

### Task 1: 报告模型成为必需依赖

**Files:**
- Modify: `apps/worker/src/deepseek-report.ts`
- Modify: `apps/worker/src/deepseek-report.test.ts`
- Modify: `apps/worker/src/process-verification-job.ts`
- Modify: `apps/worker/src/process-verification-job.test.ts`
- Modify: `apps/worker/src/run-worker.ts`
- Modify: `apps/worker/src/run-worker.test.ts`

- [ ] **Step 1: 写失败测试**

测试未配置 `generateReport` 时处理器拒绝 `REPORT_MODEL_FAILED:CONFIG` 且不调用 `saveReport`；测试模型 HTTP 429 拒绝 `REPORT_MODEL_FAILED:RATE_LIMITED`；测试 Worker 写回该安全码而非通用失败码。

- [ ] **Step 2: 运行 RED**

Run: `pnpm.cmd --filter @vibeverify/worker test -- deepseek-report.test.ts process-verification-job.test.ts run-worker.test.ts`

Expected: FAIL，因为当前实现仍返回 `null` 并保存确定性降级报告。

- [ ] **Step 3: 最小实现**

模型适配器只抛出 `REPORT_MODEL_FAILED:CONFIG`、`REPORT_MODEL_FAILED:AUTH`、`REPORT_MODEL_FAILED:RATE_LIMITED`、`REPORT_MODEL_FAILED:PROVIDER`、`REPORT_MODEL_FAILED:RESPONSE_INVALID` 或 `REPORT_MODEL_FAILED:NETWORK`；处理器不再调用 `createDeterministicReport`；Worker 保留这些安全码。

- [ ] **Step 4: 运行 GREEN**

Run: `pnpm.cmd --filter @vibeverify/worker test -- deepseek-report.test.ts process-verification-job.test.ts run-worker.test.ts`

Expected: PASS。

### Task 2: 保留真实问题的修复提示词并修复操作样式

**Files:**
- Modify: `apps/web/src/features/reports/report-actions.tsx`
- Modify: `apps/web/src/features/reports/report-actions.test.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: 写失败测试**

渲染 `ReportActions` 时断言操作容器与三个按钮使用稳定的报告操作 class，确保真实模型问题的“复制修复提示词”、Markdown、PDF 操作仍存在。

- [ ] **Step 2: 运行 RED**

Run: `pnpm.cmd --filter @vibeverify/web test -- report-actions.test.tsx`

Expected: FAIL，因为当前按钮没有报告操作 class。

- [ ] **Step 3: 最小实现**

为操作容器、主要复制按钮和次级导出按钮添加 class，并在 `styles.css` 提供一致的间距、边框、背景、悬停和窄屏换行规则；不删除任何修复提示词功能。

- [ ] **Step 4: 运行 GREEN**

Run: `pnpm.cmd --filter @vibeverify/web test -- report-actions.test.tsx`

Expected: PASS。

### Task 3: 回归验证

- [ ] **Step 1: 运行全量门禁**

Run: `pnpm.cmd test`, `pnpm.cmd lint`, `pnpm.cmd typecheck`, `pnpm.cmd --filter @vibeverify/web build`, `git diff --check`

Expected: 全部退出码为 0。

- [ ] **Step 2: 推送与生产验收边界**

提交并推送当前 PR 分支。合并到 `master`、Railway 部署完成且由用户确认 `DEEPSEEK_API_KEY` 已设置后，才允许创建一次新的受控任务验证真实模型报告；不得重跑旧任务。
