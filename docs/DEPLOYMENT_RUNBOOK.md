# VibeVerify 部署与回滚 Runbook

## 上线范围

仅邀请制 MVP：Worker 并发固定为 1，禁止公开注册；Web 部署到 Vercel，Worker 部署到 Railway，认证、数据库和私有 Storage 使用 Supabase。

## 环境变量清单

不要把任何值提交到仓库。Vercel（Web）配置：

| 变量 | 必填 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | 浏览器公开 anon key |
| `BETA_ACCESS_CODE` | 是 | 可轮换内测码 |
| `GITHUB_APP_ID` | GitHub 来源启用时 | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | GitHub 来源启用时 | GitHub App PEM 私钥 |
| `GITHUB_APP_SLUG` | GitHub 来源启用时 | GitHub App slug |
| `GITHUB_STATE_ENCRYPTION_KEY` | GitHub 来源启用时 | 随机高熵 state 加密密钥 |

Railway（Worker）配置：

| 变量 | 必填 | 用途 |
| --- | --- | --- |
| `SUPABASE_URL` | 是 | 服务端 Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | 仅 Worker 使用的 service role key |
| `WORKER_ID` | 是 | 实例唯一标识 |
| `DEEPSEEK_API_KEY` | 是 | 报告模型密钥 |
| `DEEPSEEK_MODEL` | 是 | 默认 `deepseek-chat` |
| `GITHUB_APP_ID`、`GITHUB_APP_PRIVATE_KEY` | GitHub 来源启用时 | 下载私有仓库源码 |

## 上线步骤

1. 在 Supabase 生产项目执行迁移：`supabase db push --linked`；确认 RLS 已启用且 Storage bucket 为私有。
2. 在 Vercel 导入仓库，Root Directory 设为 `apps/web`，填入 Web 变量并部署。
3. 在 Railway 创建 Worker 服务：从仓库根目录使用 `Dockerfile` 构建（不要将 Root Directory 设为 `apps/worker`，它依赖 workspace 内的 `packages/prompting`）；填入 Worker 变量；副本数固定为 1；Healthcheck Path 设为 `/health`。首次部署在日志中确认没有 `WORKER_CONFIGURATION_MISSING`，且 Railway 健康状态为通过后，才创建 ZIP 验收任务。
4. 将 GitHub App 的 Homepage URL 与 Callback URL 指向 Vercel 生产域名；最小权限只授予 Contents: Read。
5. 使用内测账户完成一次 ZIP 验收；再完成一次 GitHub 授权、撤销授权和报告导出验证。

## 冒烟检查与观测

记录每次试用的 job id、结果、总耗时、失败分类和模型成本。出现失败时，先用 job id 检查 Vercel 请求日志、Railway Worker 日志和 Supabase job/report 记录；目标是在 10 分钟内确定责任层。

## 回滚

1. 停止 Railway Worker 或将副本数设为 0，阻止领取新任务。
2. 在 Vercel 回滚至上一个健康部署。
3. 如发现密钥泄漏，立刻轮换 `BETA_ACCESS_CODE`、GitHub App 私钥、`GITHUB_STATE_ENCRYPTION_KEY`、DeepSeek key 和 Supabase service role key。
4. 撤销受影响 GitHub App 安装；保留审计所需的 job 元数据，不保留源码临时目录。

