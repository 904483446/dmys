# Phase 3 Worker 与 AI 报告设计

## 目标

在不让 Next.js/Vercel 执行用户代码的前提下，由 Railway Worker 将一个 `queued` 验收任务推进至 `completed` 或 `failed`，并写入可读、可追溯且不含源码或凭据的报告。

## 架构

Worker 仅通过 Supabase 的受限 RPC 原子领取任务，持有租约时更新状态与心跳。每个任务使用随机临时目录处理 ZIP 或 GitHub 来源；执行进程使用白名单脚本、非特权用户、10 分钟超时、输出与磁盘上限，并始终在 `finally` 中删除目录。

Worker 只识别独立的 Vite/Next.js 单体项目。Playwright 仅采集首页可访问性、浏览器错误摘要和受控截图。AI 只接收需求、PRD 摘要、项目清单与已脱敏证据，返回经 Zod 校验的 JSON；模型或结构校验失败时写入确定性降级报告。

## 边界

- Next.js/Vercel 不克隆、解压、安装、构建、启动或执行用户代码。
- 不引入 Redis、BullMQ、LangChain、LangGraph、RAG、向量数据库、Cloud Run 或 OpenHands。
- 不向数据库、日志、报告或模型输入写入 token、cookie、私有仓库 URL、`.env` 内容或源码全文。
- Worker 仍是邀请制、并发 1 的 MVP 组件，不声明强多租户隔离。

## 数据流与错误处理

`queued` 任务由原子 claim RPC 领取，依次进入 `preparing`、`building`、`running`、`testing`、`reporting`；每次状态变更验证租约持有者。构建、启动、超时或浏览器失败均生成 `failed` 报告摘要。任务结束后清理临时目录；只保留经过筛选的摘要、截图元数据与报告。

## 测试策略

每项行为按 TDD 进行：先为 claim/租约、状态更新、清理、脚本白名单、超时、证据脱敏和 AI JSON 降级写失败测试，再实现最小代码。Phase 完成时执行数据库测试、lint、typecheck、全量测试、相关 Prettier 检查与 `git diff --check`。
