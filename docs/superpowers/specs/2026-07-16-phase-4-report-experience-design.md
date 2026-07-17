# Phase 4 报告体验与质量门禁设计

## 目标

将 Phase 3 已写入的私有验收结果交付为非技术用户可理解、可行动且可安全导出的报告。报告详情采用“结论与证据优先”的阅读顺序：先说明自动验收结论，再展示已验证功能与证据，最后提供问题及可复制的修复提示词。

## 范围与边界

- 完成报告详情、Markdown/PDF 私有导出、重跑对比、错误与空状态、基础可访问性和移动端布局。
- 不改变 Worker 的执行、租约、报告写入或 DeepSeek 行为；不执行用户代码。
- 不新增 Redis、BullMQ、LangChain、LangGraph、RAG、向量数据库、Cloud Run 或 OpenHands。
- 导出和详情均不得包含源码、Token、Cookie、私有仓库 URL、`.env` 内容或原始控制台日志。
- 所有读取与导出均依赖当前 Supabase session 与 RLS；不存在或不属于当前用户的任务统一按既有中文 `JOB_NOT_FOUND` 响应，避免泄露资源存在性。

## 方案选择

采用服务端私有导出。Next.js Route Handler 在当前会话下读取同一份受 RLS 约束的 job、report 与经过筛选的 artifact 元数据，并生成 Markdown 或 PDF 下载响应。浏览器不拼装报告，也不接触 service role 或 Storage 私有路径。

该方案比浏览器打印更能保证权限、脱敏和导出内容一致性；比只提供 Markdown 更完整地满足 Phase 4 交付要求。

## 报告详情与数据流

1. 已登录、`active` 用户访问 `/reports/[id]`。
2. 服务端以当前 session 查询该 job；RLS 负责用户归属，找不到则返回列表页的安全回退。
3. job 已有报告时，详情依次显示：
   - verdict、score、confidence、创建时间和“自动验收建议，最终由用户判断”说明；
   - request text、verified items 及其已知 evidence IDs；
   - issues 的严重级别、标题、描述、evidence IDs 和复制修复提示词；
   - 导出动作、重新验收动作与同项目上一次完成报告的对比摘要。
4. 宽屏把证据区和问题区置于并列的阅读区域；窄屏按同一阅读顺序单列展示，不改变内容或权限。
5. `queued` 至 `reporting` 显示处理中状态；`failed` 或 `timed_out` 显示 Worker 写入的可行动中文说明；无 report 时不显示导出或对比操作。

详情 API 的 report payload 扩展为已验证项与问题结构化字段，并仅提供 artifact 的安全展示元数据。它不返回 artifact 私有路径、原始日志或来源详情。

## 导出与对比

`POST /api/v1/verification-jobs/[jobId]/exports` 接受严格校验的 `markdown` 或 `pdf` 格式。接口必须验证会话、任务归属及完成状态；失败均使用统一中文错误结构。Markdown 和 PDF 共享一个只接受已脱敏 report DTO 的渲染模型，确保两种格式不会因为各自独立模板而产生字段泄露。

重跑对比只查询同一 `project_id`、当前用户拥有、且早于当前 job 的最近一份 completed/failed 报告。对比只输出 verdict、score、issues 数量，以及按 issue 标题得到的新增与已解决项；不复制来源、需求全文、artifact 路径或原始报告内容。没有旧报告时显示明确的首次验收空状态。

## 可访问性与错误处理

- 使用语义化标题、列表和 `aria-live` 状态说明；结论与严重等级以文字呈现，不只依赖颜色。
- 复制、重跑和导出均为原生 button，具备可见名称、键盘可达性和成功/失败反馈。
- API、页面和导出使用中文可行动错误信息；所有公开 API 保持 `{ error: { code, message, details? } }`。
- 重跑成功后跳转到新任务；旧任务和旧报告保持不可变。

## 测试策略

所有新增行为遵循 TDD：先写失败测试并确认失败，再写最小实现并确认通过。

- 单元测试：DTO 脱敏、Markdown/PDF 渲染模型、比较摘要和状态/空状态映射。
- API 测试：未登录、跨用户、未完成任务、非法格式、导出成功与 rerun 跳转。
- RLS 数据库测试：用户不能读取或导出其他用户报告，导出查询不暴露 artifact 路径。
- UI 测试：证据优先顺序、修复提示词复制、失败/处理中/首次对比空状态及窄屏语义结构。
- Playwright 冒烟：用户进入已完成报告、导出入口可用、失败任务显示可行动说明。
- 阶段门禁：依赖扫描、Supabase 数据库测试、`pnpm lint`、`pnpm typecheck`、`pnpm test`、本次 TS/TSX 的 Prettier 检查、`git diff --check` 以及 `CI=true pnpm install --frozen-lockfile`。
