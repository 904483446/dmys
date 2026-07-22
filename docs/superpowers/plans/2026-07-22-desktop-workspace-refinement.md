# 桌面工作台体验收紧实施计划

> **供 Agent 执行：** 必须按任务逐项执行；每项均遵循“先写失败测试、确认失败、最小实现、确认通过”。

**目标：** 收紧 VibeVerify 桌面工作台排版，并让用户能移除尚未提交的 ZIP 文件选择。

**架构：** 仅由 `NewVerificationForm` 的前端状态清空待上传 ZIP。复用现有工作台、报告页和 CSS，不修改任务 API、上传签名、Storage、RLS、Worker 或已完成上传。

**技术栈：** Next.js App Router、React、TypeScript、CSS、Vitest、ESLint。

---

### 任务 1：允许移除待上传 ZIP

**文件：**

- 修改：`apps/web/src/features/jobs/new-verification-form.test.tsx`
- 修改：`apps/web/src/features/jobs/new-verification-form.tsx`

- [ ] 写失败测试：渲染已选 ZIP 展示组件，断言包含 `landing-page.zip`、`2.4 MB`、`aria-label="移除已选 ZIP"` 与 `移除 ×`。
- [ ] 运行 `pnpm --filter @vibeverify/web test -- new-verification-form.test.tsx`，确认旧代码因缺少移除控件而失败。
- [ ] 最小实现：使用 `useRef<HTMLInputElement>` 保存 ZIP 输入框；移除处理函数同时调用 `setSelectedZip(null)` 和 `zipInputRef.current.value = ''`；不得调用网络、Storage 或删除 API。
- [ ] 再次运行同一测试，确认通过。

### 任务 2：建立紧凑的桌面工作台结构

**文件：**

- 修改：`apps/web/src/components/app-shell.test.tsx`
- 修改：`apps/web/src/components/app-shell.tsx`
- 修改：`apps/web/src/app/reports/page.test.tsx`
- 修改：`apps/web/src/app/reports/page.tsx`
- 修改：`apps/web/src/features/reports/jobs-list.test.tsx`
- 修改：`apps/web/src/features/reports/jobs-list.tsx`

- [ ] 写失败测试：当前页导航必须有 `app-navigation-active`；报告页标题区必须有 `workspace-heading-row` 与 `+ 新建验收`。
- [ ] 运行 `pnpm --filter @vibeverify/web test -- app-shell.test.tsx page.test.tsx jobs-list.test.tsx`，确认失败。
- [ ] 最小实现：`AppShell` 根据 `title` 仅高亮当前导航；报告页将眉题、标题、说明放入左侧容器，将 `+ 新建验收` 放在同一标题行右侧；保留 `JobsList` 的轮询职责不变。
- [ ] 再次运行相关测试，确认通过。

### 任务 3：收紧桌面视觉层级

**文件：**

- 修改：`apps/web/src/app/styles.css`
- 验证：`apps/web/src/app/new/page.test.tsx`
- 验证：`apps/web/src/app/reports/page.test.tsx`
- 验证：`apps/web/src/features/jobs/new-verification-form.test.tsx`

- [ ] 仅修改桌面选择器：内容区最大宽度约 1220px、内边距 32–40px；标题约 36–40px；标题行左对齐；报告空状态最小高度约 210px；已选 ZIP 行使用左右对齐布局。
- [ ] 不修改 `max-width: 767px` 媒体查询，不改 ZIP 校验、文件大小限制、上传路径或任务创建契约。
- [ ] 运行 `pnpm --filter @vibeverify/web test -- new-verification-form.test.tsx page.test.tsx`，并在桌面视口检查 `/new`、`/reports`：标题行左对齐、报告入口可见、空卡片紧凑、文件信息和移除按钮可见。

### 任务 4：完成验证

- [ ] 运行 `pnpm --filter @vibeverify/web test`、`pnpm --filter @vibeverify/web lint`、`pnpm --filter @vibeverify/web typecheck`。
- [ ] 运行 `git diff --check` 与 `git status --short`，确认仅包含计划内的页面、表单、样式和测试改动。
- [ ] 在用户明确授权前，不暂存、不提交、不推送。
