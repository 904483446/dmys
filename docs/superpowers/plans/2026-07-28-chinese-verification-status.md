# 中文验收状态展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将报告列表和报告详情中的验收任务状态统一显示为中文。

**Architecture:** 在 jobs 功能目录新增一个无副作用的状态格式化函数，集中维护内部状态码到中文文案的映射。报告列表和报告详情仅调用该函数展示文案，仍保留原始状态用于轮询与重新验收逻辑。

**Tech Stack:** TypeScript、React、Vitest、Next.js。

---

### Task 1: 集中状态映射

**Files:**
- Create: `apps/web/src/features/jobs/format-verification-status.ts`
- Test: `apps/web/src/features/jobs/format-verification-status.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { formatVerificationStatus } from './format-verification-status.js';

describe('formatVerificationStatus', () => {
  it.each([
    ['queued', '等待处理'], ['preparing', '正在准备项目'], ['building', '正在构建'],
    ['running', '正在启动'], ['testing', '正在检查'], ['reporting', '正在生成报告'],
    ['completed', '验收完成'], ['failed', '验收失败'], ['timed_out', '验收超时'],
    ['unknown', '状态更新中'],
  ])('将 %s 显示为 %s', (status, expected) => {
    expect(formatVerificationStatus(status)).toBe(expected);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm.cmd --filter @vibeverify/web test -- format-verification-status.test.ts`
Expected: FAIL because `format-verification-status` does not exist.

- [x] **Step 3: Write minimal implementation**

```ts
const statusLabels: Record<string, string> = {
  queued: '等待处理', preparing: '正在准备项目', building: '正在构建',
  running: '正在启动', testing: '正在检查', reporting: '正在生成报告',
  completed: '验收完成', failed: '验收失败', timed_out: '验收超时',
};

export function formatVerificationStatus(status: string): string {
  return statusLabels[status] ?? '状态更新中';
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm.cmd --filter @vibeverify/web test -- format-verification-status.test.ts`
Expected: PASS.

### Task 2: 在报告页面复用映射

**Files:**
- Modify: `apps/web/src/features/reports/jobs-list.tsx`
- Modify: `apps/web/src/features/reports/jobs-list.test.tsx`
- Modify: `apps/web/src/features/reports/report-detail.tsx`
- Modify: `apps/web/src/features/reports/report-detail.test.tsx`

- [x] **Step 1: Write failing component assertions**

```ts
expect(html).toContain('验收完成');
expect(html).not.toContain('>completed<');
```

Add the equivalent assertions for a pending report with `status="building"`, expecting `正在构建` and not `>building<`.

- [x] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd --filter @vibeverify/web test -- jobs-list.test.tsx report-detail.test.tsx`
Expected: FAIL because the components still render raw status codes.

- [x] **Step 3: Use the formatter for displayed status values**

```ts
import { formatVerificationStatus } from '../jobs/format-verification-status';

<span className="report-status">{formatVerificationStatus(job.status)}</span>
<strong>当前状态：{formatVerificationStatus(status)}</strong>
```

Keep the raw `status` variable for `ReportAutoRefresh` and rerun eligibility checks.

- [x] **Step 4: Run focused tests and quality gates**

Run: `pnpm.cmd --filter @vibeverify/web test -- format-verification-status.test.ts jobs-list.test.tsx report-detail.test.tsx`
Run: `pnpm.cmd --filter @vibeverify/web test`
Run: `pnpm.cmd --filter @vibeverify/web typecheck`
Run: `pnpm.cmd --filter @vibeverify/web lint`
Run: `git diff --check`
Expected: all commands exit 0.
