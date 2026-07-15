# Phase 2 GitHub App 接入设计

**范围：** 本设计仅覆盖 GitHub App 安装回调、安装记录、私有仓库与分支选择。不会执行仓库代码，不实现 Worker、任务轮询、报告、导出或 rerun。

## 安全模型

浏览器只通过同源 BFF 发起安装与读取用户自己的安装/仓库列表，永不获得 GitHub App 私钥、JWT 或 installation access token。发起安装时，服务端生成一次性、短时效 `state`，绑定当前 session 用户并保存其摘要；回调必须验证 state、登录 session、安装归属和最小权限后才能记录安装。

GitHub installation access token 是短期令牌，不能作为长期凭据使用。数据库以 `github_installations` 保存 `installation_id`、用户归属、账号展示名、授权状态与可选的加密短期令牌缓存；后续需要访问私有仓库时，服务端使用环境中的 GitHub App 私钥按需签发新 token。`encrypted_token` 不得进入浏览器响应、日志、报告或 source snapshot。

## 数据与撤销

新增 `github_installations` 表：每行属于一个 user，`installation_id` 全局唯一，`encrypted_token` 为 `bytea`，`revoked_at` 表示不可再用。表启用 RLS，用户仅能读取自己的安装摘要；加密字段不授予客户端读取。撤销或 GitHub 回调表明卸载后，服务端写入 `revoked_at`，仓库/分支接口立即拒绝该安装。

## 接口

- `POST /api/v1/github/installations/connect`：active 用户获得 App 安装地址。地址只带服务端 state，不含 userId、token 或私有仓库信息。
- `GET /api/v1/github/installations/callback`：验证 state 与安装信息后记录安装，并跳回 `/settings`。
- `GET /api/v1/github/repositories?installationId=`：仅安装所有者可调用；仅返回 `{ id, fullName, private, defaultBranch }`。
- `GET /api/v1/github/repositories/{repositoryId}/branches?installationId=`：仅安装所有者可调用；仅返回分支名和 SHA，不返回 token。
- `POST /api/v1/github/installations/{installationId}/revoke`：仅所有者可撤销，写入 `revoked_at`。

## GitHub API 边界

App 仅要求 Contents read-only 权限。服务端在调用 GitHub API 前构建短时 App JWT、交换 installation access token，并在内存中使用；请求失败或权限不足映射为统一中文错误。真实 App ID、私钥、slug 和 webhook secret 只来自环境变量；本阶段的自动化测试全部用依赖注入的假 GitHub 客户端，不需要真实凭据或第三方授权。

## 测试与验收

测试先行覆盖：无效/过期 state、跨用户 installationId、已撤销安装、私有仓库列表、分支列表和令牌不泄露。数据库 pgTAP 覆盖表、RLS 和撤销字段；API 测试覆盖中文统一错误结构。验收时，active 用户能连接自己的 GitHub App 安装并选择私有仓库/分支，其他用户无法访问或撤销该安装。

## 非目标

不在 Next.js/Vercel 执行仓库代码；不存储长期 installation token；不接入 webhook worker、GitHub OAuth、Redis/BullMQ、LangChain、RAG 或 AI 报告。
