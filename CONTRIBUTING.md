# 贡献指南

感谢你为 VibeVerify 做出贡献。提交前请遵循以下约定，确保变更可审查、可验证且不扩大安全边界。

## 开始工作

请从最新的 `master` 创建以 `codex/` 为前缀的分支，例如：

```bash
git checkout master
git pull --ff-only
git checkout -b codex/short-description
```

请保持一次变更聚焦一个目标，并在提交前检查工作区，避免混入无关文件。

## 安全与隐私

- 不读取、输出或提交 `.env`、Token、Cookie、密钥及其他敏感信息。
- Issue 和 PR 中仅使用脱敏日志；不得粘贴用户项目源码。
- 不提交用户私有源码、真实凭据或可还原个人信息的附件。

## 本地验证与提交

提交前请运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

请在 PR 中填写仓库提供的模板，说明变更范围、验证证据、部署影响及尚未验证的事项。

## 部署与执行边界

部署和真实生产验收只能在健康检查通过后单次执行。若失败，请保留脱敏证据并停止重复执行，避免消耗配额或掩盖问题。

只有 Railway Worker 可以执行用户项目代码。Web/Vercel 不可新增此能力；其职责限于登录、创建任务和展示报告。
