# Codex 开发指南

## 开发原则

- 先读全部 `docs/`，以 PRD 与 DEVELOPMENT_PLAN 为需求真相源；冲突时停下报告，不自行扩展范围。
- 仅实现当前 Phase；不要提前引入队列、向量库、LangChain、强隔离云服务或自动修复 Agent。
- 所有用户数据查询必须以当前 session 的 `user_id` 限制；所有新表必须有 RLS 与跨用户测试。
- 浏览器、Vercel API 和 Worker 永不接触 service role、模型密钥、GitHub token。
- 执行用户代码的逻辑只能在 Worker，必须有超时、大小限制、状态写回和 finally 清理。
- 先写失败测试，再写最小实现；不得以“看起来正确”替代测试。

## 工程规范

- TypeScript strict；文件使用 kebab-case，React 组件 PascalCase，变量/函数 camelCase。
- 按领域组织：`features/reports`、`features/jobs`、`features/github`，不创建万能 `utils`。
- Route Handler 只做鉴权、Zod 校验、调用 service；业务逻辑放服务层；数据库访问封装在 repository/RPC 层。
- 注释解释安全/业务原因，不复述代码。错误信息为中文，错误码为稳定英文大写 snake case。
- 提交采用 Conventional Commits，例如 `feat(reports): add private report detail`；一个提交只包含一个可验证目的。

## Codex 执行流程

1. 读取 `docs/README.md` 及全部链接文档，执行 `git status --short --branch`，检查当前变更。
2. 检查 Node、pnpm、Supabase CLI、Docker（如 Phase 3 需要）和环境变量；缺失时报告精确安装命令与预期结果。
3. 按 DEVELOPMENT_PLAN 的当前 Phase 创建或修改最小文件集；先添加测试，运行并确认失败，再实现，确认通过。
4. 每完成一个任务，执行相关测试；每完成一个 Phase，依次执行 lint、typecheck、unit/API tests、必要 E2E。
5. 向用户报告：完成内容、修改文件、实际命令与结果、未验证项/风险。等待用户确认后才进入下一 Phase。

## 禁止事项

- 不硬编码或输出密钥、Cookie、GitHub token、私有仓库 URL。
- 不用浏览器传入的 `user_id` 做授权；不绕过 RLS。
- 不在 Vercel serverless function 执行 ZIP/仓库代码。
- 不记录源码全文、`.env` 或未经脱敏的日志到数据库、模型请求或导出文件。
- 不声称 Railway Worker 已具备公开多租户强隔离；上线范围必须保持邀请制。

## Phase 0 启动检查单

- [ ] 当前目录仍为空或仅有 docs；未覆盖用户既有文件。
- [ ] Git 初始化前确认用户允许创建仓库（若尚未初始化）。
- [ ] 创建 workspace 后，`pnpm lint`、`pnpm typecheck`、`pnpm test` 可运行。
- [ ] 生成 `.env.example`，只包含变量名和注释。
