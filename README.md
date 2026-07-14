# VibeVerify

面向非技术 Vibe Coding 用户的私有代码功能验收平台。当前仅完成 Phase 0 工程骨架；不包含认证、数据访问、用户代码执行或 AI 调用。

## 环境要求

- Node.js 22 或更高版本
- pnpm 11.7.0

## 本地验证

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
```

端到端测试已预先配置为 Playwright；后续阶段添加真实页面后再执行 `pnpm test:e2e`。

部署、数据模型和业务边界以 [docs/README.md](docs/README.md) 中索引的文档为准。
