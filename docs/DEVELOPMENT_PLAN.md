# VibeVerify 分阶段开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可部署的邀请制 Vibe Coding 功能验收 MVP。

**Architecture:** Next.js 负责 Web/BFF，Supabase 负责身份/数据/存储，Railway Worker 用 PostgreSQL 任务租约领取任务、运行受控 Web 项目并产出报告。

**Tech Stack:** pnpm、Next.js、TypeScript、Supabase、Railway、Playwright、Zod。

---

## Phase 0：项目初始化

**目标**：建立可重复本地开发、测试与部署的 monorepo 骨架。

- [ ] 初始化 Git、pnpm workspace、`apps/web`、`apps/worker`、`packages/contracts`、`packages/prompting`。
- [ ] 配置 TypeScript strict、ESLint、Prettier、Vitest、Playwright；添加 `.env.example`，不得提交真实密钥。
- [ ] 建立 GitHub Actions：`pnpm lint`、`pnpm typecheck`、`pnpm test`。
- [ ] 验收：新机器按 README 安装后，四个命令均成功；CI 对故意的 type error 失败。

## Phase 1：基础 SaaS 框架

**目标**：可登录的中文 Web、RLS 数据层、我的报告空状态与固定首页演示。

- [ ] 创建 Supabase migrations：profiles、projects、jobs、reports、artifacts、RLS、用户归属索引、任务 claim RPC。
- [ ] 接入邮箱 OTP、Google、GitHub 登录和统一内测码 access-status gate。
- [ ] 实现首页、`/reports`、`/reports/[id]` 的视觉框架及私有路由保护。
- [ ] 写 RLS 集成测试：用户 A 不能读用户 B 的 job/report/artifact。
- [ ] 验收：登录后只看见自身空列表；未邀请用户不能创建任务；首页有固定演示报告。

## Phase 2：来源接入与任务管理

**目标**：安全创建、追踪与重新发起验收任务。

- [ ] 实现私有 Storage 签名上传、ZIP 预校验、需求/PRD 表单与每日 3 次额度检查。
- [ ] 实现 GitHub App 安装回调、安装记录加密、仓库/分支选择（私有仓库可用）。
- [ ] 实现 jobs API、状态轮询、列表概览、详情访问校验和 rerun。
- [ ] 编写 API 测试：无效 ZIP、越权 job id、超额度、撤销 GitHub 安装、rerun 保留旧报告。
- [ ] 验收：用户可用 ZIP 或私有仓库创建 queued job，刷新后状态正确，其他用户无法访问。

## Phase 3：Worker 与 AI 报告

**目标**：端到端运行一个受支持项目并生成可读报告。

- [ ] 实现 worker claim/heartbeat/lease recovery、每任务临时目录与 finally 清理。
- [ ] 实现 package.json 识别、允许脚本白名单、10 分钟超时、输出/磁盘限制、构建与启动错误归类。
- [ ] 加入 Playwright：首页访问、运行状态检查、截图、控制台与网络错误摘要；为固定示例项目写端到端测试。
- [ ] 实现 DeepSeek Provider Adapter、Zod 约束的测试意图/报告 JSON、证据引用校验和模型失败降级报告。
- [ ] 验收：示例 Vite 和 Next.js 项目可完成 `queued → completed/failed`；源码目录在任务结束后不存在；报告不含密钥或 Token。

## Phase 4：报告体验与质量门禁

**目标**：完成用户可用的私有交付物。

- [ ] 完善报告详情：结论、分数、置信度、已验证功能、问题证据、复制修复提示词。
- [ ] 实现 Markdown/PDF 导出，并测试导出内容权限与脱敏。
- [ ] 增加报告重跑对比摘要、错误空状态、可访问性和移动端基础布局。
- [ ] 建立单元、API、RLS、Worker 集成、Playwright E2E 分层测试；执行依赖扫描。
- [ ] 验收：所有关键流程 E2E 通过；导出的报告没有源代码、Token、私有仓库 URL；失败任务仍有可行动说明。

## Phase 5：部署上线与小范围试用

**目标**：以邀请制、可观测、可回滚方式部署。

- [ ] 配置 Vercel、Supabase、Railway 环境变量（包括可轮换的 `BETA_ACCESS_CODE`）与归属 `904483446` 的 GitHub App 回调 URL。
- [ ] 配置 Railway 健康检查、Worker 并发=1、日志告警与每日成本上限。
- [ ] 运行生产迁移、部署前冒烟测试、邀请测试用户；记录任务成功率、平均时长、失败原因和模型成本。
- [ ] 编写部署/回滚 Runbook；公开 README、架构图与不含真实数据的演示截图。
- [ ] 验收：生产环境可完成一次私有仓库或 ZIP 验收；撤销授权有效；异常可在 10 分钟内定位。

## 后续拆分计划

强隔离 Runner 迁移、更多框架、公共注册、团队协作、计费、OpenHands 自动修复各自建立独立 spec/plan，不能混入 MVP Phase 0–5。
