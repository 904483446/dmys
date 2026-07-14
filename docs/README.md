# 【需要确认名称】VibeVerify 文档中心

`VibeVerify` 是当前工作名称（需用户最终确认）；中文副标题暂定为“让 AI 生成的项目，可被真实验证”。它是面向非技术 Vibe Coding 用户的代码功能验收平台。用户提交自然语言目标，按需补充 PRD，并导入 GitHub 仓库或上传 ZIP；系统实际运行受支持的 Web 项目、执行浏览器验收，并交付私有报告。

## 项目目标

MVP 解决“我用 AI 做出了一个网站，但它是否真的符合我的要求”的问题。报告提供通过/有风险/不通过、完成度分数、问题证据、截图与可复制的修复提示词。用户最终自行决定是否达到预期。

## 核心功能

- Google、GitHub、邮箱验证码登录。
- GitHub App 按仓库只读授权私有/公开仓库，或 ZIP 上传本地项目。
- 自然语言需求必填、PRD 可选（PDF、DOCX、Markdown）。
- 自动识别并运行 React/Vite、Next.js 单体项目；Playwright 执行浏览器验收。
- “我的报告”统一显示进行中与历史任务；独立报告详情页展示证据并支持重新验收。
- 私有报告导出 PDF/Markdown；原始代码与临时工作目录在任务结束后删除。

## 技术栈

- Web/API：Next.js（TypeScript）部署到 Vercel。
- 身份、PostgreSQL、对象存储：Supabase。
- 执行 Worker：Railway 上的 Node.js/Playwright 服务（低频、邀请制 MVP）。
- LLM：DeepSeek，封装为服务端单一 Provider Adapter。

## 推荐仓库结构

```text
apps/web/                 Next.js Web 与 BFF API
apps/worker/              Railway Worker 与 Playwright 执行器
packages/contracts/       Zod DTO、共享枚举和错误码
packages/prompting/       Prompt 模板与报告 JSON Schema
docs/                     本文档体系
```

## 开发与部署

本地使用 pnpm workspace，Web 与 Worker 分别启动；Supabase 本地 CLI 用于迁移与 RLS 测试。生产环境将 `apps/web` 部署至 Vercel、`apps/worker` 部署至 Railway，二者连接同一个 Supabase 项目。详细过程见 [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) 和 [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)。

## 文档索引

- [PRD.md](PRD.md)：产品边界与验收标准
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)：职责、数据流与部署
- [TECH_STACK.md](TECH_STACK.md)：技术选型与替代方案
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md)：数据模型与 RLS
- [API_DESIGN.md](API_DESIGN.md)：接口契约
- [AI_DESIGN.md](AI_DESIGN.md)：AI 输出边界和 Prompt
- [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)：分阶段开发计划
- [CODEX_GUIDE.md](CODEX_GUIDE.md)：Codex 执行规则
- [RISK_ANALYSIS.md](RISK_ANALYSIS.md)：风险与缓解措施
