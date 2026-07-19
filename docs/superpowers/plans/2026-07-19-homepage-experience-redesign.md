# 首页体验重构实施计划

> **供 Agent 执行：** 必须使用任务分解方式逐步实施；每一步都用复选框追踪。

**目标：** 在不改变首页路由和“新建验收”跳转逻辑的前提下，将 VibeVerify 首页重构为响应式、证据优先的 SaaS Landing Page。

**实现方式：** `app/page.tsx` 保持 Server Component，保留 `/new` 链接。仅增加语义化首页区块和对应 CSS，不改 API、状态或依赖。

**技术栈：** Next.js App Router、React、TypeScript、Vitest、原生 CSS。

---

### 任务 1：锁定首页内容结构

**文件：**

- 修改：`apps/web/src/app/page.test.tsx`
- 修改：`apps/web/src/app/page.tsx`

- [ ] 先在测试中断言页面包含“验收结论”“证据链”“开始验收”。
- [ ] 运行 `pnpm --filter @vibeverify/web test -- page.test.tsx`，确认因这些内容尚不存在而失败。
- [ ] 将当前单一 Hero/演示卡改为三个语义区块：价值说明、产品预览、证据说明；现有 CTA 仍跳转 `/new`。
- [ ] 再次运行同一测试，确认通过。
- [ ] 提交：`feat(web): restructure homepage content`。

### 任务 2：实现响应式视觉系统

**文件：**

- 修改：`apps/web/src/app/page.test.tsx`
- 修改：`apps/web/src/app/styles.css`

- [ ] 先在测试中断言页面含有 `home-hero`、`home-preview`、`home-evidence` 类名。
- [ ] 运行页面测试，确认因类名尚不存在而失败。
- [ ] 桌面端使用内容最大宽度与双栏网格；760px 以下自动单栏。标题采用稳定两行布局，避免中文逐字断行；补充 CTA 状态和 `prefers-reduced-motion` 降级。
- [ ] 不修改通用报告样式，首页样式均以 `home-` 前缀隔离。
- [ ] 运行：

```powershell
pnpm --filter @vibeverify/web test -- page.test.tsx
pnpm --filter @vibeverify/web typecheck
pnpm --filter @vibeverify/web build
```

- [ ] 检查桌面与 390px 宽屏截图：标题没有单字行、没有横向滚动、“开始验收”始终可见。
- [ ] 提交：`feat(web): polish responsive homepage experience`。
