# 测试意图与逐条浏览器证据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 VibeVerify 将用户需求转为不具执行权限的测试意图，由 Railway Worker 用固定 Playwright 模板执行，并让报告按每条真实证据显示已验证或未验证。

**Architecture:** DeepSeek 只返回受 Zod 约束的任务列表测试意图，不能输出选择器、JavaScript 或命令。Worker 将枚举模板映射为本地页面上的 Playwright 语义定位与断言，并保存脱敏结果；报告模型只读取这些结果。Web、Markdown 与 PDF 都将“已验证功能”替换为按状态分组的“功能验收明细”。

**Tech Stack:** TypeScript strict、Zod、Playwright、Vitest、Next.js、React PDF。

---

### Task 1: 测试意图合同

**Files:**
- Create: `packages/prompting/src/test-intent-schema.ts`
- Create: `packages/prompting/src/test-intent-schema.test.ts`
- Modify: `packages/prompting/src/index.ts`

- [ ] **Step 1: 写失败测试**

```ts
expect(testIntentSchema.safeParse({
  checks: [{ template: 'task_list_add', title: '添加任务', expectedText: '买牛奶' }],
}).success).toBe(true);
expect(testIntentSchema.safeParse({
  checks: [{ template: 'arbitrary_javascript', title: 'x', expectedText: 'x' }],
}).success).toBe(false);
```

- [ ] **Step 2: 运行失败测试**

Run: `pnpm --filter @vibeverify/prompting test -- src/test-intent-schema.test.ts`

Expected: FAIL because `testIntentSchema` is not exported.

- [ ] **Step 3: 实现最小合同**

```ts
export const testIntentSchema = z.object({
  checks: z.array(z.object({
    template: z.enum(['homepage', 'task_list_add', 'task_list_blank', 'task_list_toggle', 'task_list_filter']),
    title: z.string().min(1).max(160),
    expectedText: z.string().min(1).max(160),
  })).min(1).max(8),
});
```

- [ ] **Step 4: 运行通过测试**

Run: `pnpm --filter @vibeverify/prompting test -- src/test-intent-schema.test.ts`

Expected: PASS.

### Task 2: 模型测试意图与 Worker 执行模板

**Files:**
- Create: `apps/worker/src/deepseek-test-intent.ts`
- Create: `apps/worker/src/deepseek-test-intent.test.ts`
- Modify: `apps/worker/src/playwright-browser-evidence.ts`
- Modify: `apps/worker/src/playwright-browser-evidence.test.ts`
- Modify: `apps/worker/src/process-verification-job.ts`
- Modify: `apps/worker/src/default-worker-processor.ts`

- [ ] **Step 1: 写失败测试**

```ts
await expect(generate({ request: '添加任务后显示买牛奶' })).resolves.toEqual({
  checks: [{ template: 'task_list_add', title: '添加任务', expectedText: '买牛奶' }],
});
await expect(collect(url, intent)).resolves.toMatchObject({
  evidenceIds: expect.arrayContaining(['task_list_add']),
  checks: [{ title: '添加任务', status: 'verified', evidenceIds: ['task_list_add'] }],
});
```

- [ ] **Step 2: 运行失败测试**

Run: `pnpm --filter @vibeverify/worker test -- src/deepseek-test-intent.test.ts src/playwright-browser-evidence.test.ts`

Expected: FAIL because the generator and per-check evidence do not exist.

- [ ] **Step 3: 实现最小安全执行链**

`deepseek-test-intent.ts` 只调用 Provider 一次并以 `testIntentSchema` 校验返回值；提示词仅允许五个模板枚举，禁止返回选择器、代码或命令。`playwright-browser-evidence.ts` 只使用 `getByRole`、`getByPlaceholder`、`fill`、`click`、`check` 与文本断言，所有 URL 继续限制为 localhost。任一模板定位或断言失败只生成该条 `not_verified` 证据，不中断其余检查。

- [ ] **Step 4: 运行通过测试**

Run: `pnpm --filter @vibeverify/worker test -- src/deepseek-test-intent.test.ts src/playwright-browser-evidence.test.ts src/process-verification-job.test.ts`

Expected: PASS.

### Task 3: 报告仅基于逐条证据

**Files:**
- Modify: `apps/worker/src/deepseek-report.ts`
- Modify: `apps/worker/src/deepseek-report.test.ts`
- Modify: `apps/worker/src/process-verification-job.ts`
- Modify: `apps/worker/src/process-verification-job.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
await expect(generateReport({
  request: '验证任务列表',
  evidenceIds: ['task_list_add'],
  checks: [{ title: '添加任务', status: 'verified', evidenceIds: ['task_list_add'] }],
})).resolves.toMatchObject({ verifiedItems: [{ title: '添加任务', status: 'verified' }] });
```

- [ ] **Step 2: 运行失败测试**

Run: `pnpm --filter @vibeverify/worker test -- src/deepseek-report.test.ts src/process-verification-job.test.ts`

Expected: FAIL because report input does not contain the executed checks.

- [ ] **Step 3: 实现最小证据传递**

将固定结构 `{ title, status, evidenceIds }` 传入报告模型，提示词明确“逐条状态是 Worker 执行事实，不得反转或新增”。Worker 在保存报告前拒绝与执行结果同名但状态不同的条目，防止模型把失败动作写成已验证。

- [ ] **Step 4: 运行通过测试**

Run: `pnpm --filter @vibeverify/worker test -- src/deepseek-report.test.ts src/process-verification-job.test.ts`

Expected: PASS.

### Task 4: 报告、Markdown 与 PDF 的真实分组

**Files:**
- Modify: `apps/web/src/features/reports/report-detail.tsx`
- Modify: `apps/web/src/features/reports/report-detail.test.tsx`
- Modify: `apps/web/src/features/reports/report-export.ts`
- Modify: `apps/web/src/features/reports/report-export.test.ts`
- Modify: `apps/web/src/features/reports/report-pdf.tsx`
- Modify: `apps/web/src/features/reports/report-pdf.test.tsx`

- [ ] **Step 1: 写失败测试**

```ts
expect(html).toContain('功能验收明细');
expect(html).toContain('已验证（1）');
expect(html).toContain('未验证（1）');
expect(html).not.toContain('<h2 id="verified-items">已验证功能</h2>');
```

- [ ] **Step 2: 运行失败测试**

Run: `pnpm --filter @vibeverify/web test -- src/features/reports/report-detail.test.tsx src/features/reports/report-export.test.ts src/features/reports/report-pdf.test.tsx`

Expected: FAIL because the current single list has the misleading heading.

- [ ] **Step 3: 实现最小分组显示**

按 `status` 将 `verifiedItems` 分成两个列表，标题为“功能验收明细”“已验证（n）”“未验证（n）”。若某组为空则显示“无”。Markdown/PDF 使用相同标题与顺序，保留现有修复提示词、复制与导出能力。

- [ ] **Step 4: 完整验证**

Run: `pnpm test; pnpm typecheck; pnpm lint; pnpm --filter @vibeverify/web build; git diff --check`

Expected: 全部通过；不执行真实 ZIP、外部模型或生产任务。
