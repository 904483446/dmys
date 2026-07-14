# 技术选型

## 最终推荐

| 层 | 选择 | 原因 |
|---|---|---|
| Web/BFF | Next.js + TypeScript + App Router | Vercel 部署直接、全栈同仓、适合 SaaS 控制台。 |
| UI | Tailwind CSS + shadcn/ui | 快速建立可信、统一、可访问的界面。 |
| 数据与认证 | Supabase（PostgreSQL/Auth/Storage） | 减少后端基础设施，RLS 适合私有报告。 |
| Worker | Node.js + TypeScript + Playwright，Railway | 与 Web 同语言，低成本运行浏览器自动化。 |
| 契约 | Zod | API、任务载荷、AI JSON 的运行时校验。 |
| GitHub | GitHub App | 按仓库最小只读授权，支持私有仓库。 |
| AI | DeepSeek API + Provider Adapter | 中文能力与成本更适合国内 MVP；适配层避免业务代码绑定供应商。 |

## 前端与后端评估

**方案 A：Next.js BFF（推荐）**。优点是 Vercel 原生、类型共享、部署简单；缺点是长任务不能放入 Serverless，因此必须配 Worker。

**方案 B：Next.js + FastAPI**。适合复杂 Python 数据处理，但增加两套运行时、部署和契约维护。当前 Worker 已需要 Node/Playwright，不推荐 MVP 引入。

## 执行器评估

**方案 A：Railway 常驻 Worker（MVP 推荐）**：低配置、成本可控、适合邀请制；缺点是隔离强度有限。

**方案 B：Cloud Run Jobs/Fly Machines/E2B**：每任务隔离、安全与弹性更好；缺点是云账号、镜像、调度和成本治理复杂。公开开放前必须迁移到 B。

## 明确不采用

- LangChain/LangGraph：MVP 只是确定性的“生成测试意图 → 运行 → 汇总”管线，引入 Agent 图会降低可控性。
- 向量数据库/RAG：PRD 和运行证据单任务内即可放入受限上下文；不存在跨项目知识检索需求。
- Redis/BullMQ：先用 PostgreSQL 原子 claim 与租约，避免额外服务；吞吐提升后再引入。

## DeepSeek 接入约束

DeepSeek 是 MVP 的唯一模型供应商，默认模型为 `deepseek-chat`。工程实现必须以 Provider Adapter 隔离供应商；不能把 `DEEPSEEK_API_KEY`、模型名硬编码到客户端或 Prompt 中。初始月度 API 预算为人民币 50 元；部署前核验 DeepSeek 当期模型价格、可用区域、限流策略及数据使用政策，并将 Key 仅配置在 Railway Worker 环境变量中。
