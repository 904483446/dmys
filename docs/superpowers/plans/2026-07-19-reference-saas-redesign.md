# VibeVerify 参考驱动 SaaS 视觉重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 VibeVerify 重构为 Cliento 风格的转化首页和 Vendor Dashboard 风格的登录后工作台，同时保留所有既有功能与权限边界。

**Architecture:** 继续使用 Next.js App Router、React 组件和单一 `styles.css`，不引入组件库。新增只负责表现层的共享站点导航与应用壳；页面容器和现有业务表单、任务、报告组件保持数据与事件边界不变。

**Tech Stack:** Next.js 16、React、TypeScript、Vitest、原生 CSS。

---

## 文件结构

- Create: `apps/web/src/components/site-header.tsx`：Landing、登录、激活页共享的轻量导航，仅暴露既有可用链接。
- Create: `apps/web/src/components/app-shell.tsx`：登录后页面的侧栏、顶栏和内容区容器，不处理鉴权。
- Modify: `apps/web/src/app/styles.css`：替换米白/衬线/偏移投影样式，定义 Landing 与应用壳的响应式规则。
- Modify: `apps/web/src/app/page.tsx` 与 `page.test.tsx`：Cliento 式首页结构及其静态断言。
- Modify: `apps/web/src/app/login/page.tsx`、`apps/web/src/features/access/access-page-content.tsx` 与对应测试：接入共享站点导航与认证页外壳。
- Modify: `apps/web/src/app/new/new-page-content.tsx`、`apps/web/src/features/reports/jobs-list.tsx`、`apps/web/src/features/reports/reports-empty-state.tsx`、`apps/web/src/features/reports/report-detail.tsx` 与对应测试：接入应用壳、状态与数据展示层级。

### Task 1: 建立视觉令牌与共享外壳

**Files:**
- Create: `apps/web/src/components/site-header.tsx`
- Create: `apps/web/src/components/app-shell.tsx`
- Create: `apps/web/src/components/site-header.test.tsx`
- Create: `apps/web/src/components/app-shell.test.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: 写失败测试，锁定共享外壳的可访问结构**

```tsx
expect(renderToStaticMarkup(<SiteHeader />)).toContain('site-header');
expect(renderToStaticMarkup(<SiteHeader />)).toContain('href="/login"');
expect(renderToStaticMarkup(<AppShell title="我的报告">内容</AppShell>)).toContain('app-sidebar');
expect(renderToStaticMarkup(<AppShell title="我的报告">内容</AppShell>)).toContain('我的报告');
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm --filter @vibeverify/web test -- src/components/site-header.test.tsx src/components/app-shell.test.tsx`

Expected: FAIL，组件尚不存在。

- [ ] **Step 3: 实现最小共享组件**

```tsx
export function SiteHeader() {
  return <header className="site-header"><Link href="/">VibeVerify</Link><nav aria-label="主导航"><Link href="/login">登录</Link><Link className="site-cta" href="/new">开始验收 <span aria-hidden="true">↗</span></Link></nav></header>;
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="app-shell"><aside className="app-sidebar"><Link href="/reports">验收报告</Link><Link href="/new">新建验收</Link></aside><main className="app-main"><header className="app-topbar"><span>工作区 / {title}</span></header>{children}</main></div>;
}
```

- [ ] **Step 4: 在 `styles.css` 定义全局令牌和共享布局**

```css
:root { color: #182033; background: #f8f9fc; font-family: "Noto Sans SC", "Segoe UI", sans-serif; }
.site-header { display:flex; justify-content:space-between; align-items:center; max-width:1200px; margin:auto; padding:18px 24px; }
.site-cta { background:#182033; color:#fff; border-radius:10px; padding:8px 8px 8px 14px; }
.site-cta span { display:inline-grid; place-items:center; width:28px; height:28px; margin-left:8px; border-radius:7px; background:#ff7a2f; }
.app-shell { display:grid; grid-template-columns:220px minmax(0,1fr); min-height:100vh; background:#fff; }
.app-sidebar { padding:24px 14px; border-right:1px solid #edf0f5; }
.app-main { min-width:0; background:#fbfcff; }
.app-topbar { padding:22px 32px; border-bottom:1px solid #edf0f5; }
@media (max-width: 767px) { .app-shell { grid-template-columns:1fr; } .app-sidebar { display:flex; gap:16px; overflow:auto; border-right:0; border-bottom:1px solid #edf0f5; } }
```

- [ ] **Step 5: 运行测试和类型检查**

Run: `pnpm --filter @vibeverify/web test -- src/components/site-header.test.tsx src/components/app-shell.test.tsx && pnpm --filter @vibeverify/web typecheck`

Expected: PASS。

- [ ] **Step 6: 提交共享外壳**

```bash
git add apps/web/src/components apps/web/src/app/styles.css
git commit -m "feat(web): add SaaS visual foundation"
```

### Task 2: 重做 Cliento 风格首页

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/page.test.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: 扩展首页失败测试**

```tsx
expect(html).toContain('site-header');
expect(html).toContain('landing-hero');
expect(html).toContain('landing-product-preview');
expect(html).toContain('开始验收');
expect(html).toContain('href="/new"');
```

- [ ] **Step 2: 运行首页测试，确认新断言失败**

Run: `pnpm --filter @vibeverify/web test -- src/app/page.test.tsx`

Expected: FAIL，尚无 `landing-hero` 与产品预览类。

- [ ] **Step 3: 实现首页，不创建虚假导航链接或客户 Logo**

```tsx
<main className="landing-page">
  <SiteHeader />
  <section className="landing-hero">
    <p className="landing-kicker">私有项目验收</p>
    <h1>让每一次交付，都有真实运行的证据。</h1>
    <p>提交目标与项目文件，获得可复核的浏览器证据、问题和修复建议。</p>
    <Link className="site-cta" href="/new">开始验收 <span aria-hidden="true">↗</span></Link>
    <section className="landing-product-preview" aria-label="验收报告预览"><p>验收结论</p><strong>存在风险 <span>82</span></strong><p>核心流程可访问，但搜索结果为空时缺少明确反馈。</p><dl><div><dt>可信度</dt><dd>高</dd></div><div><dt>已验证</dt><dd>6 / 8</dd></div></dl></section>
  </section>
</main>
```

- [ ] **Step 4: 添加浅色环境背景、居中 Hero、能力捷径与移动单列规则**

```css
.landing-page { min-height:100vh; background:linear-gradient(#dff4fb 0, #f8f9fc 42rem); }
.landing-hero { max-width:960px; margin:auto; padding:clamp(4rem,9vw,8rem) 24px 64px; text-align:center; }
.landing-hero h1 { max-width:12ch; margin:18px auto; font-family:Georgia, "Noto Serif SC", serif; font-size:clamp(3rem,7vw,6.4rem); line-height:.94; }
.landing-product-preview { margin:48px auto 0; text-align:left; border:1px solid #edf0f5; border-radius:18px; background:#fff; box-shadow:0 24px 60px rgb(41 61 102 / .12); }
```

- [ ] **Step 5: 验证并截图**

Run: `pnpm --filter @vibeverify/web test -- src/app/page.test.tsx && pnpm --filter @vibeverify/web build`

Expected: PASS；在 1280px 和 390px 截图中 CTA 可见，标题无溢出。

- [ ] **Step 6: 提交首页**

```bash
git add apps/web/src/app/page.tsx apps/web/src/app/page.test.tsx apps/web/src/app/styles.css
git commit -m "feat(web): redesign landing around product evidence"
```

### Task 3: 认证入口接入 Landing 外壳

**Files:**
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/features/access/access-page-content.tsx`
- Modify: `apps/web/src/app/login/page.test.tsx`
- Modify: `apps/web/src/app/access/page.test.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: 写失败测试，要求认证页出现共享导航和产品化表单容器**

```tsx
expect(html).toContain('site-header');
expect(html).toContain('auth-saas-layout');
expect(html).toContain('邮箱验证码');
```

- [ ] **Step 2: 运行认证测试，确认失败**

Run: `pnpm --filter @vibeverify/web test -- src/app/login/page.test.tsx src/app/access/page.test.tsx`

Expected: FAIL，缺少新类名。

- [ ] **Step 3: 只调整包裹层与文案容器，保留 `EmailOtpForm`、OAuth 按钮、`AccessForm` 的 props 与事件**

```tsx
<main className="auth-saas-layout"><SiteHeader /><section className="auth-saas-content"><div className="auth-copy"><p className="landing-kicker">安全登录</p><h1>登录后开始验收</h1><p>你的项目仅用于本次私有验收；网页不会执行你的代码。</p></div><section className="auth-card">{children}</section></section></main>
```

- [ ] **Step 4: 添加认证页样式与响应式规则**

```css
.auth-saas-layout { min-height:100vh; background:linear-gradient(180deg,#e8f7fc 0,#f8f9fc 46%); }
.auth-saas-content { display:grid; grid-template-columns:1fr minmax(320px,420px); gap:64px; max-width:1100px; margin:auto; padding:80px 24px; }
.auth-card { padding:32px; border:1px solid #e7eaf0; border-radius:16px; background:#fff; box-shadow:0 18px 40px rgb(41 61 102 / .08); }
```

- [ ] **Step 5: 验证与提交**

Run: `pnpm --filter @vibeverify/web test -- src/app/login/page.test.tsx src/app/access/page.test.tsx && pnpm --filter @vibeverify/web typecheck`

```bash
git add apps/web/src/app/login apps/web/src/app/access apps/web/src/features/access apps/web/src/app/styles.css
git commit -m "feat(web): align auth entry with landing system"
```

### Task 4: 改造新建验收与报告列表工作台

**Files:**
- Modify: `apps/web/src/app/new/new-page-content.tsx`
- Modify: `apps/web/src/features/reports/jobs-list.tsx`
- Modify: `apps/web/src/features/reports/reports-empty-state.tsx`
- Modify: `apps/web/src/app/new/page.test.tsx`
- Modify: `apps/web/src/app/reports/page.test.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: 写失败测试，锁定 AppShell 与原流程入口**

```tsx
expect(newHtml).toContain('app-shell');
expect(newHtml).toContain('sourceZip');
expect(reportsHtml).toContain('reports-workspace');
expect(reportsHtml).toContain('href="/new"');
```

- [ ] **Step 2: 运行新建验收与报告测试，确认失败**

Run: `pnpm --filter @vibeverify/web test -- src/app/new/page.test.tsx src/app/reports/page.test.tsx`

Expected: FAIL，尚未使用应用壳与工作台类。

- [ ] **Step 3: 包裹现有表单与列表，不改表单字段、`submitVerification`、轮询或详情 href**

```tsx
<AppShell title="新建验收"><section className="workspace-page"><header className="workspace-heading"><p>验收工作区</p><h1>新建验收</h1><span>提交项目文件后，Worker 会在受控环境中处理并生成报告。</span></header><section className="workspace-card"><NewVerificationForm /></section></section></AppShell>
<section className="reports-workspace"><header className="workspace-heading"><p>验收工作区</p><h1>我的报告</h1></header>{jobs.map((job) => <Link className="report-row" key={job.id} href={`/reports/${job.id}`}><span className="report-status">{job.status}</span><strong>查看验收结果</strong><span>{new Date(job.createdAt).toLocaleString('zh-CN')}</span></Link>)}</section>
```

- [ ] **Step 4: 用指标标题、表格行与空状态替换偏移投影卡片外观**

```css
.workspace-page,.reports-workspace { max-width:1180px; margin:auto; padding:32px; }
.workspace-card,.reports-workspace { border:1px solid #edf0f5; border-radius:14px; background:#fff; }
.report-row { grid-template-columns:120px minmax(0,1fr) auto; padding:18px 20px; border-bottom:1px solid #edf0f5; }
.report-status { color:#3567e9; font-family:inherit; font-weight:600; }
```

- [ ] **Step 5: 验证与提交**

Run: `pnpm --filter @vibeverify/web test -- src/app/new/page.test.tsx src/app/reports/page.test.tsx && pnpm --filter @vibeverify/web typecheck`

```bash
git add apps/web/src/app/new apps/web/src/app/reports apps/web/src/features/reports apps/web/src/app/styles.css
git commit -m "feat(web): build verification workspace layout"
```

### Task 5: 重做报告详情的信息密度和状态层级

**Files:**
- Modify: `apps/web/src/features/reports/report-detail.tsx`
- Modify: `apps/web/src/features/reports/report-detail.test.tsx`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: 写失败测试，锁定指标网格、证据区和问题区的顺序，以及现有操作组件**

```tsx
expect(html).toContain('report-metrics');
expect(html).toContain('report-evidence-panel');
expect(html).toContain('report-issues-panel');
expect(html.indexOf('report-metrics')).toBeLessThan(html.indexOf('report-evidence-panel'));
expect(html).toContain('复制修复提示词');
```

- [ ] **Step 2: 运行报告详情测试，确认失败**

Run: `pnpm --filter @vibeverify/web test -- src/features/reports/report-detail.test.tsx`

Expected: FAIL，缺少新结构类。

- [ ] **Step 3: 在不改 `ReportActions`、comparison 或 DTO 的前提下重组展示结构**

```tsx
<section className="report-summary"><div className="report-metrics"><div><span>验收结论</span><strong>{report.verdict}</strong></div><div><span>评分</span><strong>{report.score}</strong></div><div><span>可信度</span><strong>{report.confidence}</strong></div></div><p>{report.summary}</p></section>
<section className="report-evidence-panel"><h2>已验证功能</h2><ul>{report.verifiedItems.map((item) => <li key={item.title}>{item.title}（{item.status}）</li>)}</ul></section>
<section className="report-issues-panel"><h2>问题与修复提示词</h2>{report.issues.map((issue) => <div className="report-issue" key={issue.title}><h3>{issue.title}</h3><p>严重级别：{issue.severity}</p><p>{issue.description}</p><p>修复提示词：{issue.repairPrompt}</p><ReportActions jobId={jobId} repairPrompt={issue.repairPrompt} /></div>)}</section>
```

- [ ] **Step 4: 添加状态颜色与桌面双栏/移动单列布局**

```css
.report-metrics { display:grid; grid-template-columns:repeat(3,1fr); border:1px solid #edf0f5; border-radius:14px; overflow:hidden; }
.report-metrics > div { padding:20px; border-right:1px solid #edf0f5; }
.report-evidence-panel,.report-issues-panel { padding:24px; border:1px solid #edf0f5; border-radius:14px; background:#fff; }
.report-detail { grid-template-columns:repeat(2,minmax(0,1fr)); }
.report-summary,.report-comparison { grid-column:1 / -1; }
@media (max-width:767px) { .report-detail,.report-metrics { grid-template-columns:1fr; } .report-metrics > div { border-right:0; border-bottom:1px solid #edf0f5; } }
```

- [ ] **Step 5: 验证与提交**

Run: `pnpm --filter @vibeverify/web test -- src/features/reports/report-detail.test.tsx && pnpm --filter @vibeverify/web typecheck`

```bash
git add apps/web/src/features/reports/report-detail.tsx apps/web/src/features/reports/report-detail.test.tsx apps/web/src/app/styles.css
git commit -m "feat(web): redesign report workspace hierarchy"
```

### Task 6: 最终质量门禁与视觉验收

**Files:**
- Modify only if verification exposes a specific visual or accessibility defect.

- [ ] **Step 1: 执行全量质量门禁**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @vibeverify/web build && pnpm audit --prod && git diff --check`

Expected: lint、typecheck、测试、构建、审计和 diff 检查全部通过。

- [ ] **Step 2: 本地视觉核验**

Run: 启动 production build；分别在 1280px 和 390px 检查 `/`、`/login`、`/access`。以现有登录门禁验证 `/new`、`/reports` 未登录跳转；在可用测试数据下检查 `/reports/[id]`。

Expected: 首页 CTA 始终可见；移动端无横向溢出；认证页控件可用；受保护路由不泄露内容。

- [ ] **Step 3: 仅为发现的问题补测试、最小修复并重跑相关门禁**

```bash
git add apps/web/src/app/styles.css apps/web/src/app/page.tsx apps/web/src/app/page.test.tsx apps/web/src/app/login/page.tsx apps/web/src/app/login/page.test.tsx apps/web/src/app/access/page.test.tsx apps/web/src/app/new/new-page-content.tsx apps/web/src/app/new/page.test.tsx apps/web/src/app/reports/page.test.tsx apps/web/src/features/access/access-page-content.tsx apps/web/src/features/reports/jobs-list.tsx apps/web/src/features/reports/reports-empty-state.tsx apps/web/src/features/reports/report-detail.tsx apps/web/src/features/reports/report-detail.test.tsx
git commit -m "fix(web): polish responsive workspace layout"
```

- [ ] **Step 4: 提交最终验证结果并等待用户网页创建 PR**

Run: `git status --short --branch && git log --oneline origin/master..HEAD`

Expected: 工作区干净；每个页面改造均有独立提交和对应验证证据。
