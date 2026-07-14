# API 设计

所有接口前缀为 `/api/v1`，JSON 使用 `camelCase`。错误统一为：

```json
{ "error": { "code": "JOB_NOT_FOUND", "message": "未找到该验收任务", "details": {} } }
```

所有用户接口都必须验证 Supabase session 并在服务端以 `user_id` 过滤；禁止接收可覆盖归属关系的 `userId`。

## 认证与连接

### 获取当前用户

- 方法：`GET`
- URL：`/me`
- 权限：已登录
- 返回：`{ profile: { id, displayName, accessStatus, githubConnected } }`

### 发起 GitHub App 安装

- 方法：`POST`
- URL：`/github/installations/connect`
- 权限：已登录且 `active`
- 返回：`{ installUrl }`
- 逻辑：创建带 state/nonce 的安装跳转地址；回调必须验证 state、安装归属与最小权限。

### 列出可选仓库

- 方法：`GET`
- URL：`/github/repositories?installationId={uuid}`
- 权限：该 installation 的所有者
- 返回：`{ repositories: [{ id, fullName, private, defaultBranch }] }`

## 上传与创建任务

### 获取 ZIP/PRD 上传签名

- 方法：`POST`
- URL：`/uploads/sign`
- 请求：`{ kind: "source_zip" | "prd", fileName, contentType, sizeBytes }`
- 权限：已登录且 active
- 规则：ZIP 最大 50MB；PRD 限 PDF/DOCX/Markdown；返回私有 Storage 的短期上传签名与 `storagePath`。

### 创建验收任务

- 方法：`POST`
- URL：`/verification-jobs`
- 权限：已登录且 active
- 请求：

```json
{
  "requestText": "验证待办应用是否可以新增、搜索和删除任务",
  "source": { "type": "github", "installationId": "uuid", "repositoryId": 123, "ref": "main" },
  "prdStoragePath": "optional/path"
}
```

`source.type = "zip"` 时传入 `sourceStoragePath`。服务端校验每日额度、来源归属与文件；创建项目（如无）和 `queued` 任务，返回 `{ job }`。

### 我的报告与任务

- 方法：`GET`
- URL：`/verification-jobs?status=all|active|completed&cursor=`
- 权限：已登录
- 返回：进行中任务与历史概览列表；概览不返回完整截图或原始日志。

### 获取报告详情

- 方法：`GET`
- URL：`/verification-jobs/{jobId}`
- 权限：任务所有者
- 返回：任务状态；完成后包含 `report`、私有 artifact 的短期访问 URL。

### 重新验收

- 方法：`POST`
- URL：`/verification-jobs/{jobId}/rerun`
- 权限：任务所有者
- 请求：可选的新 Git ref 或新的 `sourceStoragePath`
- 逻辑：复用原 `requestText` 和 PRD，复制为新任务；旧任务与报告不变。

### 导出报告

- 方法：`POST`
- URL：`/verification-jobs/{jobId}/exports`
- 请求：`{ format: "markdown" | "pdf" }`
- 权限：任务所有者且任务完成
- 返回：`{ downloadUrl }`；导出内容不得含 GitHub Token、源码、完整私有仓库 URL。

## Worker 专用接口/RPC

Worker 不使用公开 BFF 获取任务。使用 service role 调用受限 RPC：`claim_verification_job(worker_id)`，原子选取一条可领取或租约过期任务并写入租约；随后通过受限更新接口写状态、心跳、失败摘要和最终报告。每次更新验证租约持有者，避免重复 Worker 写入。
