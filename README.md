# VibeVerify

为 Vibe Coding 项目提供可审计的 Web 功能验收。

用户提交验收需求和项目源码后，VibeVerify 会执行可映射的浏览器步骤，产出包含真实执行摘要、证据状态和修复提示词的私有报告。

当前状态：代码质量门禁与 Vercel Web 构建已验证；Railway Worker 的最新生产部署，以及一次真实的 `queued` → `completed` 验收仍待执行。**本地或 CI 验证不等同于生产验收完成。**

```mermaid
flowchart LR
  A[用户验收需求] --> B[受限 AcceptancePlan]
  B --> C[Railway Worker]
  C --> D[真实浏览器证据]
  D --> E[验收报告与修复提示词]
```

## 可信边界

| 组件           | 允许                                   | 禁止                                          |
| -------------- | -------------------------------------- | --------------------------------------------- |
| Web / Vercel   | 登录、创建任务、展示报告               | 执行用户代码                                  |
| Railway Worker | 构建受支持项目、顺序执行受限浏览器步骤 | 任意 Shell、模型生成代码、登录/支付/删除/上传 |
| 模型           | 生成受限计划、整理报告与修复提示词     | 伪造证据、决定执行权限                        |

Worker 仅在临时 localhost 环境中执行受限的浏览器验收步骤；Web/Vercel 不执行用户代码。不能安全映射到白名单步骤的需求会保留为待人工补充，而不是被伪造为已通过的证据。

## 当前能力与验证状态

### 已在代码与质量门禁覆盖

- ZIP 或 GitHub 项目输入，围绕用户填写的验收需求创建任务。
- 需求驱动的三态验收项：已验证、未验证、待人工补充。
- 私有验收报告可查看，并支持 Markdown / PDF 导出。
- 每个问题可附带可复制的修复提示词；报告结论以 Worker 采集的事实和证据引用为准。
- Web 构建与仓库质量门禁可在本地复现，命令见下方。

### 待生产确认

- Railway Worker 的最新生产部署健康且具备完整运行配置。
- 使用真实受支持项目完成一次从 `queued` 到 `completed` 的端到端验收，并回写真实浏览器证据与报告。

有关产品边界、系统职责、模型约束和上线步骤，请参阅：

- [文档索引](docs/README.md)
- [系统架构](docs/SYSTEM_ARCHITECTURE.md)
- [AI 设计](docs/AI_DESIGN.md)
- [部署与回滚 Runbook](docs/DEPLOYMENT_RUNBOOK.md)

## 本地验证

环境要求：Node.js 22+、pnpm 11.7.0。

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @vibeverify/web build
```

端到端测试已预先配置为 Playwright；应在具备相应环境和真实页面后执行 `pnpm test:e2e`。

## 证据展示原则

仓库不会放置空白图片、占位截图或虚构数据。后续仅在完成真实验收后补充经过脱敏的真实截图，并且会明确其对应的生产验收范围与时间。

## 参与贡献

提交 Issue 或 PR 前，请阅读 [贡献指南](CONTRIBUTING.md)。请勿在公开讨论中粘贴密钥、Cookie、Token、未脱敏日志或用户项目源码。
