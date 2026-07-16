# Phase 4 Report Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver evidence-first private reports with server-side Markdown/PDF exports, rerun comparison, accessible UI states, and Phase 4 quality gates.

**Architecture:** Authenticated Next.js Server Components and Route Handlers use the current Supabase session and RLS. Pure modules map database rows to a redacted report DTO, render from that DTO, and compare summaries, so no UI or export path handles Storage paths, source details, or service-role data.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Supabase SSR/RLS, Zod, Vitest, Playwright, `@react-pdf/renderer`.

---

## File structure

- `apps/web/src/features/reports/report-types.ts`: validated safe report DTO.
- `apps/web/src/features/reports/report-export.ts`, `report-pdf.tsx`: common Markdown/PDF renderer input.
- `apps/web/src/features/reports/report-comparison.ts`: prior/current report summary comparison.
- `apps/web/src/features/reports/report-detail.tsx`, `report-actions.tsx`: semantic UI and client actions.
- `apps/web/src/app/api/v1/verification-jobs/[jobId]/exports/route.ts`: authenticated download endpoint.
- `supabase/tests/database/phase4_report_access.sql`: RLS regression.

### Task 1: Add redacted DTO and comparison functions

**Files:**
- Create: `apps/web/src/features/reports/report-types.ts`
- Create: `apps/web/src/features/reports/report-types.test.ts`
- Create: `apps/web/src/features/reports/report-comparison.ts`
- Create: `apps/web/src/features/reports/report-comparison.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('drops source-only fields', () => {
  expect(toReportDetail({ verdict: 'passed', score: 90, confidence: 80, summary: '通过', verified_items: [], issues: [], storage_path: 'artifacts/a' }))
    .toEqual({ verdict: 'passed', score: 90, confidence: 80, summary: '通过', verifiedItems: [], issues: [] });
});
it('reports new and resolved issue titles', () => {
  expect(compareReports({ score: 60, issues: [{ title: '保存失败' }] }, { score: 80, issues: [{ title: '搜索失败' }] }))
    .toEqual({ scoreDelta: 20, issueCountDelta: 0, newlyFound: ['搜索失败'], resolved: ['保存失败'] });
});
```

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @vibeverify/web test -- report-types.test.ts report-comparison.test.ts`  
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the minimum model**

```ts
import { z } from 'zod';

const itemSchema = z.object({ title: z.string(), evidenceIds: z.array(z.string()), status: z.enum(['verified', 'not_verified']) });
const issueSchema = z.object({ severity: z.enum(['critical', 'major', 'minor']), title: z.string(), description: z.string(), evidenceIds: z.array(z.string()), repairPrompt: z.string() });
export function toReportDetail(input: unknown) {
  const raw = z.object({ verdict: z.enum(['passed', 'at_risk', 'failed']), score: z.number().int().min(0).max(100), confidence: z.number().int().min(0).max(100), summary: z.string(), verified_items: z.unknown(), issues: z.unknown() }).passthrough().parse(input);
  return { verdict: raw.verdict, score: raw.score, confidence: raw.confidence, summary: raw.summary, verifiedItems: z.array(itemSchema).parse(raw.verified_items), issues: z.array(issueSchema).parse(raw.issues) };
}
export function compareReports(previous: { score: number; issues: { title: string }[] }, current: { score: number; issues: { title: string }[] }) {
  const before = new Set(previous.issues.map((x) => x.title)); const after = new Set(current.issues.map((x) => x.title));
  return { scoreDelta: current.score - previous.score, issueCountDelta: current.issues.length - previous.issues.length, newlyFound: [...after].filter((x) => !before.has(x)), resolved: [...before].filter((x) => !after.has(x)) };
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `pnpm --filter @vibeverify/web test -- report-types.test.ts report-comparison.test.ts`  
Expected: PASS.

Commit: `git add apps/web/src/features/reports/report-types* apps/web/src/features/reports/report-comparison*; git commit -m "feat(reports): add safe report presentation model"`

### Task 2: Add deterministic Markdown and PDF rendering

**Files:**
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/web/src/features/reports/report-export.ts`
- Create: `apps/web/src/features/reports/report-export.test.ts`
- Create: `apps/web/src/features/reports/report-pdf.tsx`

- [ ] **Step 1: Write the failing renderer test**

```ts
it('includes repair prompts but no private data', () => {
  const output = renderReportMarkdown(report);
  expect(output).toContain('修复保存逻辑');
  expect(output).not.toContain('artifacts/');
  expect(output).not.toContain('private/repo');
});
```

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @vibeverify/web test -- report-export.test.ts`  
Expected: FAIL because `renderReportMarkdown` is absent.

- [ ] **Step 3: Add the dependency and renderer**

Run: `pnpm --filter @vibeverify/web add @react-pdf/renderer`  
Expected: only `apps/web/package.json` and `pnpm-lock.yaml` change; do not alter `allowBuilds`.

```ts
export function renderReportMarkdown(report: ReportDetail) {
  return ['# VibeVerify 验收报告', '', `结论：${report.verdict}`, `评分：${report.score}`, `置信度：${report.confidence}`, '', '## 已验证功能', ...report.verifiedItems.map((x) => `- ${x.title}（${x.status}）`), '', '## 问题与修复提示词', ...report.issues.flatMap((x) => [`### ${x.title}`, x.description, `修复提示词：${x.repairPrompt}`, '']), '自动验收建议，最终由用户判断。'].join('\n');
}
```

Implement `ReportPdfDocument({ report }: { report: ReportDetail })` with `Document`, `Page`, `Text`, and `View` from `@react-pdf/renderer`. Its only data prop is `ReportDetail`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `pnpm --filter @vibeverify/web test -- report-export.test.ts`  
Expected: PASS.

Commit: `git add apps/web/package.json pnpm-lock.yaml apps/web/src/features/reports/report-export* apps/web/src/features/reports/report-pdf.tsx; git commit -m "feat(reports): add private markdown and pdf renderers"`

### Task 3: Extend private retrieval and add the export API

**Files:**
- Modify: `apps/web/src/app/api/v1/verification-jobs/[jobId]/route.ts`
- Modify: `apps/web/src/app/api/v1/verification-jobs/[jobId]/route.test.ts`
- Create: `apps/web/src/app/api/v1/verification-jobs/[jobId]/exports/route.ts`
- Create: `apps/web/src/app/api/v1/verification-jobs/[jobId]/exports/route.test.ts`

- [ ] **Step 1: Write failing route tests**

```ts
it('returns structured report fields without source paths', async () => {
  const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ jobId: 'job-id' }) });
  await expect(response.json()).resolves.toEqual(expect.objectContaining({ report: expect.objectContaining({ verifiedItems: [], issues: [] }) }));
});
it('rejects exporting an unfinished job', async () => {
  const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ format: 'markdown' }) }), { params: Promise.resolve({ jobId: 'job-id' }) });
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toEqual({ error: { code: 'JOB_NOT_COMPLETED', message: '验收尚未完成，暂不能导出' } });
});
```

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @vibeverify/web test -- "[jobId]/route.test.ts" "[jobId]/exports/route.test.ts"`  
Expected: FAIL because the extended payload and exports route are absent.

- [ ] **Step 3: Implement authenticated handlers**

Select only `id, status, verification_reports(verdict, score, confidence, summary, verified_items, issues)` from the current session client, map by `toReportDetail`, and return the existing Chinese `404 JOB_NOT_FOUND` on null. Parse `z.object({ format: z.enum(['markdown', 'pdf']) })`; permit only completed/failed jobs; otherwise return `409 { error: { code: 'JOB_NOT_COMPLETED', message: '验收尚未完成，暂不能导出' } }`. Return Markdown as `text/markdown; charset=utf-8`, PDF as `application/pdf` from `renderToBuffer(<ReportPdfDocument report={report} />)`, and both with `Content-Disposition: attachment; filename="vibeverify-report-${jobId}.${format}"`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `pnpm --filter @vibeverify/web test -- "[jobId]/route.test.ts" "[jobId]/exports/route.test.ts"`  
Expected: PASS for `401`, cross-user `404`, invalid format `400`, unfinished `409`, and successful Markdown.

Commit: `git add apps/web/src/app/api/v1/verification-jobs/[jobId]/route* apps/web/src/app/api/v1/verification-jobs/[jobId]/exports; git commit -m "feat(reports): add private report exports api"`

### Task 4: Build the evidence-first report detail UI

**Files:**
- Create: `apps/web/src/features/reports/report-detail.tsx`
- Create: `apps/web/src/features/reports/report-detail.test.tsx`
- Create: `apps/web/src/features/reports/report-actions.tsx`
- Modify: `apps/web/src/app/reports/[id]/page.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: Write failing order and state tests**

```tsx
it('renders conclusion, evidence, then issues', () => {
  const html = renderToStaticMarkup(<ReportDetail job={completedJob} report={report} comparison={null} />);
  expect(html.indexOf('自动验收建议')).toBeLessThan(html.indexOf('已验证功能'));
  expect(html.indexOf('已验证功能')).toBeLessThan(html.indexOf('问题与修复提示词'));
});
it('explains a failed job and offers rerun', () => {
  expect(renderToStaticMarkup(<ReportDetail job={{ ...completedJob, status: 'failed', errorMessage: '构建失败' }} report={null} comparison={null} />)).toContain('重新验收');
});
```

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @vibeverify/web test -- report-detail.test.tsx`  
Expected: FAIL because `ReportDetail` is absent.

- [ ] **Step 3: Implement the server/client split**

`ReportDetail` renders an `h1`, conclusion/score/confidence/disclaimer, then `h2` sections “已验证功能” and “问题与修复提示词”; severity is visible text and evidence IDs are lists. It renders active, failed/timed-out, and first-report comparison states with the exact Chinese text in the tests. `ReportActions` is a `'use client'` component with native copy/export/rerun buttons and an `aria-live="polite"` result; copy uses `navigator.clipboard.writeText`, export downloads a Blob from the new route, rerun POSTs then routes to `/reports/${newJobId}`. The page keeps the active-profile gate, selects `project_id` plus report fields, queries the nearest earlier same-project report through the same session, and calls `compareReports`. CSS maintains single-column order below 900px and makes evidence/issues a two-column grid at 900px or wider.

- [ ] **Step 4: Verify GREEN and commit**

Run: `pnpm --filter @vibeverify/web test -- report-detail.test.tsx`  
Expected: PASS.

Commit: `git add apps/web/src/features/reports/report-detail* apps/web/src/features/reports/report-actions.tsx apps/web/src/app/reports/[id]/page.tsx apps/web/src/app/styles.css; git commit -m "feat(reports): build evidence-first report detail"`

### Task 5: Add privacy regressions and run all gates

**Files:**
- Create: `supabase/tests/database/phase4_report_access.sql`
- Create: `tests/e2e/report-detail.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Write the RLS regression and verify it**

Create an owner project, completed job, and report; authenticate as a different user; assert zero rows for both report and job. Use existing helpers `tests.create_supabase_user`, `tests.get_supabase_uid`, and `tests.authenticate_as` as in Phase 1. Run: `pnpm exec supabase test db --local supabase/tests/database/phase4_report_access.sql`. Expected: PASS, proving an export source cannot be discovered cross-user.

- [ ] **Step 2: Add the authenticated E2E smoke test**

Configure Playwright `webServer` as `pnpm --filter @vibeverify/web dev`. Seed a local test user/session and completed report, visit its detail URL, and assert “已验证功能”, “问题与修复提示词”, and “导出 Markdown”. Add `test.skip(!process.env.E2E_BASE_URL, 'E2E_BASE_URL is required')` so environments without local integration configuration report an explicit skip.

- [ ] **Step 3: Run all gates and inspect PDF visually**

Run: `pnpm lint; pnpm typecheck; pnpm test; pnpm exec supabase test db --local supabase/tests/database; pnpm test:e2e -- report-detail.spec.ts; CI=true pnpm install --frozen-lockfile; pnpm audit --prod; git diff --check`  
Expected: all configured checks PASS; E2E is PASS when configured or explicitly SKIPPED otherwise.

Generate a non-sensitive fixture in `tmp/pdfs/phase4-report-fixture.pdf`, run `pdftoppm -png tmp/pdfs/phase4-report-fixture.pdf tmp/pdfs/phase4-report-fixture`, and inspect the PNG. Expected: readable Chinese text, no clipping/blank pages, no source paths, token, or raw logs.

- [ ] **Step 4: Commit the verification work**

Commit: `git add supabase/tests/database/phase4_report_access.sql tests/e2e/report-detail.spec.ts playwright.config.ts apps/web/src apps/web/package.json pnpm-lock.yaml; git commit -m "test(reports): verify private report delivery"`
