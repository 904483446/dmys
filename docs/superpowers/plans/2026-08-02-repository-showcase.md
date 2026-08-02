# Repository Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 VibeVerify GitHub 仓库升级为面向产品/作品集读者的可信展示页，同时保留清晰的开发与贡献入口。

**Architecture:** 根目录 README 承担产品定位、可信边界、真实状态、架构和快速启动；GitHub 表单把外部反馈收敛到可复现且脱敏的信息；贡献文档把质量门禁和 Worker-only 边界明确给协作者。所有状态只引用已知证据，不修改产品代码或部署配置。

**Tech Stack:** Markdown、Mermaid、GitHub Issue Forms、GitHub Pull Request 模板、pnpm workspace。

---

### Task 1: 重写产品优先的 README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 写入定位和价值主张**

将旧的“仅完成 Phase 0”段落替换为以下首屏内容：

```md
# VibeVerify

> 为 Vibe Coding 项目提供可审计的 Web 功能验收。

VibeVerify 面向非技术 Vibe Coding 用户：提交验收需求和项目源码后，系统在受限环境中执行可映射的浏览器步骤，交付带有真实执行摘要、证据状态和可复制修复提示词的私有报告。

> 当前状态：代码质量门禁和 Vercel Web 构建已验证；Railway Worker 的最新生产部署与一次真实 `queued → completed` 验收仍待执行。不要将本仓库的本地/CI 结果理解为生产验收已完成。
```

- [ ] **Step 2: 增加产品流程图和可信边界**

在 README 添加 Mermaid 图和边界表，明确 Web 不运行用户代码、Worker 才能执行 localhost 浏览器步骤、模型不能决定执行权限、无法安全转换的需求进入人工补充：

````md
## 它如何工作

```mermaid
flowchart LR
  A[用户验收需求] --> B[受限 AcceptancePlan]
  B --> C[Railway Worker]
  C --> D[真实浏览器证据]
  D --> E[验收报告与修复提示词]
```

| 组件 | 允许的职责 | 不允许的职责 |
| --- | --- | --- |
| Web / Vercel | 登录、创建任务、展示报告 | 执行用户项目代码 |
| Railway Worker | 构建受支持项目、顺序执行受限浏览器步骤 | 任意 Shell、模型生成的代码、登录/支付/删除/上传 |
| AI 模型 | 把需求转为受限计划、整理报告和修复提示词 | 伪造证据或决定执行权限 |
````

- [ ] **Step 3: 增加能力、验证状态、结构和文档导航**

创建“当前能力与验证状态”表格，使用“已在代码/质量门禁覆盖”“待生产确认”两种明确表述；列出 ZIP/GitHub 输入、需求驱动的三态验收项、Markdown/PDF、复制修复提示词。保留模块树和链接到 `docs/README.md`、`docs/SYSTEM_ARCHITECTURE.md`、`docs/AI_DESIGN.md`、部署 Runbook。

- [ ] **Step 4: 增加快速启动与真实素材说明**

保留并校准如下命令，添加 Node 22+、pnpm 11.7.0 要求，并声明截图区域只接受真实脱敏页面截图：

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @vibeverify/web build
```

- [ ] **Step 5: 验证 README 准确性**

Run:

```powershell
rg -n "仅完成 Phase 0|生产验收已完成|test_list|task_list" README.md
git diff --check -- README.md
```

Expected: 第一条命令无输出；第二条命令退出码为 0。

- [ ] **Step 6: 提交 README**

```powershell
git add README.md
git commit -m "docs: present VibeVerify as an evidence-first product"
```

### Task 2: 添加 GitHub 反馈与审阅模板

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: 创建缺陷报告表单**

创建 GitHub Issue Form，包含：问题摘要、用户验收需求、实际结果、预期结果、复现步骤、截图/脱敏日志，以及确认“未包含 Token、Cookie、密钥、用户私有源码”的必选复选框。为每个字段写中文标签和示例；禁止收集 `.env` 内容。

- [ ] **Step 2: 创建功能请求表单**

创建 GitHub Issue Form，依次收集：用户问题、目标用户、验收标准、风险/隐私边界、替代方案。验收标准字段提示使用“当……时，应当……”格式，避免只有功能名称而没有可验证结果。

- [ ] **Step 3: 创建 PR 模板**

创建包含以下固定段落的模板：`用户价值`、`变更范围`、`验证证据`、`部署影响`、`未验证/后续事项`、`安全检查`。安全检查要求确认未提交密钥，且 Web 层没有新增用户代码执行能力。

- [ ] **Step 4: 验证 GitHub 表单语法与脱敏提醒**

Run:

```powershell
rg -n "Token|Cookie|密钥|私有源码|验收标准" .github/ISSUE_TEMPLATE .github/pull_request_template.md
git diff --check -- .github
```

Expected: 第一条命令在两个表单和 PR 模板中均命中所需提醒；第二条命令退出码为 0。

- [ ] **Step 5: 提交 GitHub 模板**

```powershell
git add .github/ISSUE_TEMPLATE .github/pull_request_template.md
git commit -m "docs: add product-focused GitHub templates"
```

### Task 3: 增加贡献说明并完成文档验证

**Files:**
- Create: `CONTRIBUTING.md`
- Modify: `README.md`

- [ ] **Step 1: 编写贡献说明**

创建中文 `CONTRIBUTING.md`，说明：从 `master` 创建 `codex/` 前缀分支；不读取或提交 `.env`/Token/Cookie；在提交前运行 `pnpm lint`、`pnpm typecheck`、`pnpm test`；提交 PR 时使用模板；部署与真实生产验收必须在健康检查后单次执行。明确只有 Railway Worker 可以执行用户项目代码。

- [ ] **Step 2: 在 README 添加贡献入口**

在 README 的末尾添加：

```md
## 参与贡献

提交 Issue 或 PR 前，请阅读 [贡献指南](CONTRIBUTING.md)。请勿在公开讨论中粘贴密钥、Cookie、Token、未脱敏日志或用户项目源码。
```

- [ ] **Step 3: 执行文档质量门禁**

Run:

```powershell
pnpm exec prettier --check README.md CONTRIBUTING.md .github/ISSUE_TEMPLATE/bug_report.yml .github/ISSUE_TEMPLATE/feature_request.yml .github/pull_request_template.md
git diff --check
rg -n "仅完成 Phase 0|生产验收已完成" README.md CONTRIBUTING.md .github
```

Expected: 指定文档与模板的 Prettier 检查和 `git diff --check` 通过；最后一条命令无输出。

- [ ] **Step 4: 提交贡献与最终文档**

```powershell
git add README.md CONTRIBUTING.md
git commit -m "docs: add repository contribution guidance"
```

### Task 4: 复核合并请求材料

**Files:**
- Review: `README.md`
- Review: `CONTRIBUTING.md`
- Review: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Review: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Review: `.github/pull_request_template.md`

- [ ] **Step 1: 审阅陈述边界**

逐段确认 README 未声称 Railway 已更新、未声称真实生产任务成功、未把人工补充误称失败或已验证；确认所有链接为相对仓库路径且目标文件存在。

- [ ] **Step 2: 运行最终命令**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm exec prettier --check README.md CONTRIBUTING.md .github/ISSUE_TEMPLATE/bug_report.yml .github/ISSUE_TEMPLATE/feature_request.yml .github/pull_request_template.md
git diff --check
git status --short --branch
```

Expected: 所有质量命令通过；工作区仅包含本计划列出的文档和 GitHub 模板改动。

- [ ] **Step 3: 准备 PR 信息，不推送**

准备以下 PR 标题，供用户另行授权后使用：

```text
docs: improve VibeVerify repository showcase
```

准备 PR 描述，包含产品价值、可信状态边界、GitHub 模板和验证命令；不得写入生产验收成功或部署完成。
