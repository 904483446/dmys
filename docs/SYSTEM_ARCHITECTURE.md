# 系统架构

## 总体架构

```text
浏览器
  → Next.js Web / BFF（Vercel）
  → Supabase Auth + PostgreSQL + Storage
  → Railway Worker（领取任务）
  → 临时工作目录：拉取/解压 → npm install/build/start → Playwright
  → LLM（需求理解与报告整理）
  → Supabase（状态、报告、经筛选的截图与摘要）
```

Web 只负责用户交互、鉴权与创建任务，绝不运行用户代码。Worker 是唯一执行构建和浏览器自动化的进程；它用服务端凭证写回任务结果。Supabase 是权威数据源，Web 不依赖内存队列。

## 前端架构

- Next.js App Router + TypeScript；Server Components 读取已鉴权数据，Client Components 仅处理表单、上传进度和状态轮询。
- 页面：`/` 首页与固定演示报告、`/new` 新建验收、`/reports` 我的报告、`/reports/[id]` 报告详情、`/settings` GitHub 连接。
- 数据访问采用同源 BFF Route Handlers；浏览器不接触 Supabase service role、GitHub 安装 Token 或模型密钥。
- UI 使用可访问的基础组件和明确状态色：通过绿色、有风险琥珀色、不通过红色、进行中蓝色。

## 后端与任务架构

- Next.js Route Handlers 提供 REST API，负责输入校验、授权、上传签名和创建任务。
- PostgreSQL `verification_jobs` 为轻量任务队列。Worker 以原子 claim RPC 领取一条 `queued` 任务；通过心跳与租约防止 Worker 崩溃后永久卡住。
- Worker 将每个任务置于随机临时目录，以非特权用户运行，设置硬超时、输出大小和磁盘上限；结束时递归删除目录。
- Worker 先生成运行计划、再运行 Playwright、最后调用报告模型。每一步更新 job 状态并追加受限事件。

## 需求驱动验收执行链路

```text
用户验收需求
  -> DeepSeek 生成受限 AcceptancePlan
  -> Railway Worker 在临时项目 localhost 中顺序执行白名单 Playwright 语义步骤
  -> 每条标准写入原始需求、执行摘要、状态和证据引用
  -> DeepSeek 生成结论、评分、问题与修复提示词
  -> Worker 用真实验收条目覆盖模型返回的验收条目
  -> Web / Markdown / PDF 展示已验证、未验证、待人工补充三组
```

Web/Vercel 只负责鉴权、创建任务和展示报告，绝不执行用户项目代码；Railway Worker 是唯一可以构建项目和运行受限浏览器步骤的组件。所有影响页面状态的步骤必须串行执行，不能以并发交互伪造通过。不能转换为白名单步骤、或涉及登录、支付、删除、上传、外部跳转的需求不进入浏览器执行，必须标记为“待人工补充”。

## AI 架构

AI 不拥有工具执行权限，也不直接读取数据库。Worker 将经过截断和脱敏的需求、PRD 文本、项目清单、浏览器/控制台证据送入模型，要求返回严格 JSON。详见 [AI_DESIGN.md](AI_DESIGN.md)。MVP 不使用 RAG、向量库或多 Agent。

## 部署与 CI/CD

- 本地：pnpm workspace + Supabase CLI；Worker 在 Docker 镜像或本地 Node 进程运行。
- 生产：Vercel 部署 Web；Railway 部署 Worker；Supabase 托管 Auth/DB/Storage；GitHub Actions 运行 lint、typecheck、单元测试、Playwright 冒烟测试。
- 环境变量仅由 Vercel/Railway 管理。部署前执行迁移，迁移不可自动破坏已有数据。

## 安全边界

MVP 的 Railway Worker 不是强隔离多租户沙箱，因此仅邀请制、低并发、受控技术栈。后续公开注册前必须替换为每任务隔离的 Cloud Run Job/Fly Machine/E2B 类执行环境。
