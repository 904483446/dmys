# 需求驱动的语义验收计划 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将用户验收需求编译为可审计的白名单语义步骤，由 Railway Worker 顺序执行并在报告中呈现真实步骤证据。

**Architecture:** `packages/prompting` 定义验收计划和步骤合同；DeepSeek 仅生成该合同，失败时产出待人工补充项。Worker 将每个语义步骤映射为固定的 Playwright role/text 操作并按项顺序执行。Worker 的执行结果覆盖报告模型的验收状态；Web、Markdown、PDF 展示已验证、未验证和待人工补充三组及步骤摘要。

**Tech Stack:** TypeScript strict、Zod、Vitest、Playwright、Next.js、React PDF。

---

## 文件结构

- `packages/prompting/src/acceptance-plan-schema.ts`：计划、标准、语义步骤、人工补充项的唯一合同。
- `apps/worker/src/deepseek-test-intent.ts`：将需求转换为合同并处理模型无效输出。
- `apps/worker/src/playwright-browser-evidence.ts`：顺序执行语义步骤并生成事实证据。
- `apps/worker/src/process-verification-job.ts`：把计划、执行证据和人工补充项传给报告生成器。
- `packages/prompting/src/report-schema.ts`：允许报告保存步骤摘要及 `manual_review` 状态。
- `apps/worker/src/deepseek-report.ts`：保留模型结论/修复提示词，但以 Worker 事实结果覆盖验收条目。
- `apps/web/src/features/reports/*`：按三种状态展示、导出步骤摘要。

### Task 1: 建立需求驱动验收计划合同

**Files:**
- Create: `packages/prompting/src/acceptance-plan-schema.ts`
- Create: `packages/prompting/src/acceptance-plan-schema.test.ts`
- Modify: `packages/prompting/src/index.ts`
- Modify: `packages/prompting/src/test-intent-schema.ts`
- Modify: `packages/prompting/src/test-intent-schema.test.ts`

- [ ] **Step 1: 写失败测试，证明计划使用用户提供的变量而非示例任务名。**

```ts
expect(acceptancePlanSchema.safeParse({
  criteria: [{
    id: 'add-book', title: '添加《三体》', sourceRequirement: '输入《三体》后点击新增',
    steps: [
      { kind: 'fill_input', placeholder: '书名', value: '三体' },
      { kind: 'click_button', name: '新增' },
      { kind: 'assert_text_visible', text: '三体' },
    ],
  }],
  manualReview: [],
}).success).toBe(true);
```

- [ ] **Step 2: 运行失败测试。**

Run: `pnpm.cmd --filter @vibeverify/prompting test -- src/acceptance-plan-schema.test.ts`

Expected: FAIL，因为合同尚不存在。

- [ ] **Step 3: 实现最小合同。**

```ts
const semanticStepSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('assert_text_visible'), text: z.string().trim().min(1).max(160) }),
  z.object({ kind: z.literal('assert_text_hidden'), text: z.string().trim().min(1).max(160) }),
  z.object({ kind: z.literal('fill_input'), placeholder: z.string().trim().min(1).max(160), value: z.string().trim().min(1).max(160) }),
  z.object({ kind: z.literal('click_button'), name: z.string().trim().min(1).max(160) }),
  z.object({ kind: z.literal('check_checkbox'), name: z.string().trim().min(1).max(160) }),
]);

export const acceptancePlanSchema = z.object({
  criteria: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,64}$/),
    title: z.string().trim().min(1).max(160),
    sourceRequirement: z.string().trim().min(1).max(500),
    steps: z.array(semanticStepSchema).min(1).max(8),
  })).max(12),
  manualReview: z.array(z.object({ requirement: z.string().trim().min(1).max(500), reason: z.string().trim().min(1).max(300) })).max(12),
});
```

- [ ] **Step 4: 替换旧的任务清单专用 `TestIntent` 导出。**

```ts
export { acceptancePlanSchema } from './acceptance-plan-schema.js';
export type { AcceptancePlan, AcceptanceCriterion, SemanticStep } from './acceptance-plan-schema.js';
```

- [ ] **Step 5: 运行通过测试并提交。**

Run: `pnpm.cmd --filter @vibeverify/prompting test -- src/acceptance-plan-schema.test.ts src/test-intent-schema.test.ts`

Expected: PASS。

Commit:

```powershell
git add packages/prompting/src
git commit -m "feat(prompting): define semantic acceptance plans"
```

### Task 2: 生成需求驱动计划与人工补充项

**Files:**
- Modify: `apps/worker/src/deepseek-test-intent.ts`
- Modify: `apps/worker/src/deepseek-test-intent.test.ts`

- [ ] **Step 1: 写失败测试，验证模型输出保留用户的按钮、输入框和值。**

```ts
await expect(generate({ request: '在“书名”输入框填写“三体”，点击“新增”，列表显示“三体”' })).resolves.toMatchObject({
  criteria: [{ steps: [
    { kind: 'fill_input', placeholder: '书名', value: '三体' },
    { kind: 'click_button', name: '新增' },
    { kind: 'assert_text_visible', text: '三体' },
  ] }],
});
```

- [ ] **Step 2: 运行失败测试。**

Run: `pnpm.cmd --filter @vibeverify/worker test -- src/deepseek-test-intent.test.ts`

Expected: FAIL，因为生成器仍返回任务清单模板。

- [ ] **Step 3: 改为接受 `AcceptancePlan`，并在提示词中固定边界。**

```ts
content: '只输出 AcceptancePlan JSON。每项必须引用用户需求原文。仅允许 assert_text_visible、assert_text_hidden、fill_input、click_button、check_checkbox。禁止 URL、选择器、XPath、JavaScript、命令、登录、支付、删除、上传和外部跳转。无法安全映射时写入 manualReview。'
```

- [ ] **Step 4: 处理两次模型无效输出。**

```ts
return {
  criteria: [],
  manualReview: [{
    requirement: input.request,
    reason: '无法将需求转换为受限浏览器步骤；请补充页面可见文本、控件名称和预期结果。',
  }],
};
```

- [ ] **Step 5: 运行通过测试并提交。**

Run: `pnpm.cmd --filter @vibeverify/worker test -- src/deepseek-test-intent.test.ts`

Expected: PASS，且断言生成结果不包含“整理需求文档”“验收新增任务”等示例词。

Commit:

```powershell
git add apps/worker/src/deepseek-test-intent.*
git commit -m "feat(worker): generate requirement-driven acceptance plans"
```

### Task 3: 顺序执行语义步骤并保留动作摘要

**Files:**
- Modify: `apps/worker/src/playwright-browser-evidence.ts`
- Modify: `apps/worker/src/playwright-browser-evidence.test.ts`
- Modify: `apps/worker/src/process-verification-job.ts`
- Modify: `apps/worker/src/process-verification-job.test.ts`

- [ ] **Step 1: 写失败测试，验证一项标准的每个步骤按顺序运行并使用用户变量。**

```ts
await expect(collect(url, {
  criteria: [{ id: 'add-book', title: '添加《三体》', sourceRequirement: '...', steps: [
    { kind: 'fill_input', placeholder: '书名', value: '三体' },
    { kind: 'click_button', name: '新增' },
    { kind: 'assert_text_visible', text: '三体' },
  ] }], manualReview: [],
})).resolves.toMatchObject({
  checks: [{ title: '添加《三体》', status: 'verified', detail: '填写“书名”：三体；点击“新增”；确认“三体”可见' }],
});
```

- [ ] **Step 2: 运行失败测试。**

Run: `pnpm.cmd --filter @vibeverify/worker test -- src/playwright-browser-evidence.test.ts src/process-verification-job.test.ts`

Expected: FAIL，因为执行器仍识别 `task_list_*` 模板。

- [ ] **Step 3: 编译每种语义步骤为固定 Playwright 操作。**

```ts
if (step.kind === 'fill_input') await page.getByPlaceholder(step.placeholder).fill(step.value);
if (step.kind === 'click_button') await page.getByRole('button', { name: step.name }).click();
if (step.kind === 'check_checkbox') await page.getByRole('checkbox', { name: step.name }).check();
if (step.kind === 'assert_text_visible' && !await page.getByText(step.text).isVisible()) throw new Error('TEXT_NOT_VISIBLE');
if (step.kind === 'assert_text_hidden' && await page.getByText(step.text).isVisible()) throw new Error('TEXT_UNEXPECTEDLY_VISIBLE');
```

- [ ] **Step 4: 将每项标准映射为一条 Worker 事实结果。**

```ts
type CheckEvidence = {
  title: string;
  sourceRequirement: string;
  detail: string;
  status: 'verified' | 'not_verified';
  evidenceIds: string[];
};
```

- [ ] **Step 5: 将 `manualReview` 传至报告生成器，不调用浏览器操作。**

```ts
const evidence = await dependencies.collectBrowserEvidence(plan.localUrl, acceptancePlan);
const report = await dependencies.generateReport({ ...evidence, checks: evidence.checks, manualReview: acceptancePlan.manualReview });
```

- [ ] **Step 6: 运行通过测试并提交。**

Run: `pnpm.cmd --filter @vibeverify/worker test -- src/playwright-browser-evidence.test.ts src/process-verification-job.test.ts`

Expected: PASS；测试证明第二项在第一项完成前未启动，且不支持项没有点击调用。

Commit:

```powershell
git add apps/worker/src/playwright-browser-evidence.* apps/worker/src/process-verification-job.*
git commit -m "feat(worker): execute semantic acceptance steps"
```

### Task 4: 让 Worker 证据成为报告唯一的验收事实

**Files:**
- Modify: `packages/prompting/src/report-schema.ts`
- Modify: `packages/prompting/src/report-schema.test.ts`
- Modify: `apps/worker/src/deepseek-report.ts`
- Modify: `apps/worker/src/deepseek-report.test.ts`

- [ ] **Step 1: 写失败测试，验证 `manual_review` 不被视为功能失败且保留原始需求。**

```ts
expect(verificationReportSchema.safeParse({
  verdict: 'at_risk', score: 70, confidence: 65, summary: '需补充一个验收条件',
  verifiedItems: [{ title: '导出报表', sourceRequirement: '点击导出', detail: '未执行', status: 'manual_review', evidenceIds: [] }],
  issues: [],
}).success).toBe(true);
```

- [ ] **Step 2: 运行失败测试。**

Run: `pnpm.cmd --filter @vibeverify/prompting test -- src/report-schema.test.ts; pnpm.cmd --filter @vibeverify/worker test -- src/deepseek-report.test.ts`

Expected: FAIL，因为报告合同尚无 `manual_review` 和步骤摘要。

- [ ] **Step 3: 扩展条目合同。**

```ts
status: z.enum(['verified', 'not_verified', 'manual_review']),
sourceRequirement: z.string().min(1),
detail: z.string().min(1),
```

- [ ] **Step 4: 在报告解析后用 Worker 结果和人工补充项覆盖 `verifiedItems`。**

```ts
const workerItems = [
  ...(input.checks ?? []),
  ...(input.manualReview ?? []).map((item) => ({
    title: '待人工补充验收条件', sourceRequirement: item.requirement,
    detail: item.reason, status: 'manual_review' as const, evidenceIds: [],
  })),
];
const reportWithWorkerChecks = { ...normalizedRecord, verifiedItems: workerItems };
```

- [ ] **Step 5: 运行通过测试并提交。**

Run: `pnpm.cmd --filter @vibeverify/prompting test -- src/report-schema.test.ts; pnpm.cmd --filter @vibeverify/worker test -- src/deepseek-report.test.ts`

Expected: PASS，且模型虚构的验收条目不会保存。

Commit:

```powershell
git add packages/prompting/src/report-schema.* apps/worker/src/deepseek-report.*
git commit -m "fix(reports): bind acceptance items to worker evidence"
```

### Task 5: 显示并导出完整步骤证据

**Files:**
- Modify: `apps/web/src/features/reports/report-types.ts`
- Modify: `apps/web/src/features/reports/report-types.test.ts`
- Modify: `apps/web/src/features/reports/report-detail.tsx`
- Modify: `apps/web/src/features/reports/report-detail.test.tsx`
- Modify: `apps/web/src/features/reports/report-export.ts`
- Modify: `apps/web/src/features/reports/report-export.test.ts`
- Modify: `apps/web/src/features/reports/report-pdf.tsx`
- Modify: `apps/web/src/features/reports/report-pdf.test.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: 写失败测试，验证三组均展示原始需求、执行摘要和状态。**

```tsx
expect(html).toContain('待人工补充（1）');
expect(html).toContain('原始需求：点击导出');
expect(html).toContain('执行结果：未执行');
expect(html).toContain('待人工补充');
```

- [ ] **Step 2: 运行失败测试。**

Run: `pnpm.cmd --filter @vibeverify/web test -- src/features/reports/report-detail.test.tsx src/features/reports/report-export.test.ts src/features/reports/report-pdf.test.tsx`

Expected: FAIL，因为页面只支持两种状态且没有步骤摘要。

- [ ] **Step 3: 解析并格式化第三种状态。**

```ts
export function formatVerificationItemStatus(status: VerificationItem['status']) {
  return { verified: '已验证', not_verified: '未验证', manual_review: '待人工补充' }[status];
}
```

- [ ] **Step 4: 使用可读证据行渲染每个条目。**

```tsx
<li key={item.title}>
  <strong>{item.title}</strong><span>{formatVerificationItemStatus(item.status)}</span>
  <p>原始需求：{item.sourceRequirement}</p>
  <p>执行结果：{item.detail}</p>
</li>
```

- [ ] **Step 5: 为 Markdown 和 PDF 使用相同三组和两行摘要。**

```ts
`${item.title}：${formatVerificationItemStatus(item.status)}`,
`原始需求：${item.sourceRequirement}`,
`执行结果：${item.detail}`,
```

- [ ] **Step 6: 运行通过测试并提交。**

Run: `pnpm.cmd --filter @vibeverify/web test -- src/features/reports/report-types.test.ts src/features/reports/report-detail.test.tsx src/features/reports/report-export.test.ts src/features/reports/report-pdf.test.tsx`

Expected: PASS，且页面、Markdown、PDF 状态文案一致。

Commit:

```powershell
git add apps/web/src/features/reports apps/web/src/app/styles.css
git commit -m "feat(reports): show requirement-to-evidence traces"
```

### Task 6: 更新边界文档并执行全量验证

**Files:**
- Modify: `docs/AI_DESIGN.md`
- Modify: `docs/SYSTEM_ARCHITECTURE.md`

- [ ] **Step 1: 写失败测试，验证禁用步骤不会进入 Playwright。**

```ts
expect(plan.manualReview).toContainEqual(expect.objectContaining({ requirement: '登录后删除账户' }));
expect(page.getByRole).not.toHaveBeenCalledWith('button', expect.objectContaining({ name: '删除账户' }));
```

- [ ] **Step 2: 运行失败测试。**

Run: `pnpm.cmd --filter @vibeverify/worker test -- src/deepseek-test-intent.test.ts src/playwright-browser-evidence.test.ts`

Expected: PASS only after Tasks 1–3; otherwise investigate before continuing.

- [ ] **Step 3: 更新文档。**

```md
验收计划由用户需求驱动。模型只能生成白名单语义步骤；Worker 只在 localhost 顺序执行。无法转换的需求显示为待人工补充，不伪造验收结果。
```

- [ ] **Step 4: 执行完整质量门禁。**

Run: `pnpm.cmd test; pnpm.cmd typecheck; pnpm.cmd lint; pnpm.cmd --filter @vibeverify/web build; git diff --check`

Expected: 全部通过。

- [ ] **Step 5: 审阅变更并提交。**

```powershell
git status --short --branch
git diff --check
git add docs/AI_DESIGN.md docs/SYSTEM_ARCHITECTURE.md
git commit -m "docs: document semantic acceptance boundaries"
```

不创建生产任务；推送、PR、Railway/Vercel 部署及一次真实验收均需要用户另行授权。
