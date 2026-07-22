# Railway Worker 部署设计

## 目标

让现有 Worker 能稳定部署到 Railway，具备可被平台探测的健康检查、Playwright Chromium 运行依赖，以及收到停止信号后停止领取新任务的能力；不改变任务领取、执行、报告或权限契约。

## 已确认的方案

采用 Docker 部署，而不依赖 Railway 自动识别构建包：仓库是 pnpm workspace，Worker 又依赖 Playwright 的 Chromium 与系统库。Dockerfile 从仓库根目录安装依赖和浏览器，最终以现有 Worker 启动脚本运行。这样 Railway 配置不需要把 Root Directory 错设为 `apps/worker`。

健康检查采用进程内最小 HTTP 服务：监听 Railway 提供的 `PORT` 和容器网络接口，`GET /health` 返回 JSON 成功响应；其他路径返回 404。它不读取数据库、不暴露任务数据，也不提供管理接口。Worker 主循环继续独立运行。Railway 将健康检查路径设为 `/health`。

## 组件与数据流

1. 新增独立的 `health-server` 模块，接收端口和可选运行状态函数，创建 HTTP server。
2. `main.ts` 在配置校验成功后启动健康服务，再启动既有轮询循环；收到 `SIGTERM` 或 `SIGINT` 时，将运行状态设为停止，等待循环退出并关闭 HTTP server。
3. Dockerfile 在仓库根目录执行锁文件安装、安装 Worker 所需 Chromium 和 Linux 依赖，最终运行 `pnpm --filter @vibeverify/worker start`。
4. Railway 只需通过 Dockerfile 构建、填入 Worker 环境变量、固定一个副本，并配置 `/health`；不会接触浏览器端 Supabase anon key。

## 错误处理与边界

- 缺少 Worker 配置时，进程仍按当前行为立即失败，不伪装为健康。
- 健康接口只代表进程已经启动且仍接受运行；不能替代 ZIP、数据库、DeepSeek 或 Playwright 的端到端成功验证。
- 不新增对外任务执行接口；Web 与 Vercel 仍不得执行用户 ZIP 或仓库代码。
- Docker 构建不写入任何密钥；Railway 环境变量由部署者在平台界面填写。

## 测试与验收

- 先写 `health-server` 测试，验证 `/health` 的 200 JSON 响应和未知路径的 404。
- 先运行测试确认由于模块不存在而失败，再实现最小 HTTP 服务并重跑通过。
- 对 Dockerfile 做静态契约测试，确认使用 Node 22、锁文件安装、安装 Playwright Chromium、从仓库根目录启动 Worker，避免无法在 Railway 构建 workspace。
- 最终运行 Worker 全量测试、lint、typecheck，以及根目录 Dockerfile 相关静态检查。实际 Railway 启动与 ZIP 全链路验证留到用户完成平台配置后执行。

## 不在范围内

- 不创建 Railway 项目、不填写任何平台密钥、不修改 Supabase 或 Vercel 设置。
- 不配置 GitHub App 或恢复受限的 Supabase 测试邮件。
- 不开放多副本、公开注册或多租户隔离执行环境。
