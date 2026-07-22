# Railway Worker 部署能力实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Worker 可通过 Docker 稳定部署到 Railway，并提供不暴露任务数据的 `/health` 健康检查。

**Architecture:** 新增一个独立 HTTP 健康服务，主入口启动它并在停止时关闭它；不改变轮询与任务处理。Dockerfile 从 monorepo 根目录安装锁定依赖和 Playwright Chromium，再运行现有 Worker 脚本。

**Tech Stack:** Node.js 22、TypeScript、Vitest、pnpm workspace、Docker、Playwright、Railway。

---

## 文件结构

- 新建 `apps/worker/src/health-server.ts`：最小 HTTP 健康服务与关闭方法。
- 新建 `apps/worker/src/health-server.test.ts`：验证 `/health` 与未知路径。
- 修改 `apps/worker/src/main.ts`：启动、停止健康服务，保留现有 Worker 轮询。
- 新建 `Dockerfile`：Railway Worker 的可复现构建和启动过程。
- 新建 `.dockerignore`：避免将本地依赖、构建产物和环境文件传入 Docker build context。
- 新建 `apps/worker/src/railway-dockerfile.test.ts`：静态校验部署文件的关键契约。

### 任务 1：健康服务

**文件：**
- 新建：`apps/worker/src/health-server.test.ts`
- 新建：`apps/worker/src/health-server.ts`

- [ ] **步骤 1：写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { request } from 'node:http';

import { startHealthServer } from './health-server.js';

function get(port: number, path: string) {
  return new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
    const current = request({ host: '127.0.0.1', port, path }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => (body += chunk));
      response.on('end', () => resolve({ statusCode: response.statusCode ?? 0, body }));
    });
    current.on('error', reject);
    current.end();
  });
}

describe('startHealthServer', () => {
  it('在 health 路径返回运行状态', async () => {
    const health = await startHealthServer({ port: 0 });
    try {
      await expect(get(health.port, '/health')).resolves.toEqual({
        statusCode: 200,
        body: '{"status":"ok"}',
      });
    } finally {
      await health.close();
    }
  });
});
```

- [ ] **步骤 2：运行测试并确认失败**

运行：`pnpm --filter @vibeverify/worker test -- health-server.test.ts`

预期：失败，原因是 `./health-server.js` 尚不存在。

- [ ] **步骤 3：最小实现健康服务**

在 `health-server.ts` 使用 `node:http` 创建监听容器网络接口的 server：`GET /health` 写入 `200`、`content-type: application/json` 和 `{"status":"ok"}`；其余请求写入 `404`。导出 `{ port, close }`，其中 `close` 返回一个在 `server.close` 回调后完成的 Promise。

- [ ] **步骤 4：运行测试并确认通过**

运行：`pnpm --filter @vibeverify/worker test -- health-server.test.ts`

预期：1 项测试通过。

- [ ] **步骤 5：补充未知路径失败测试**

在同一测试文件加入断言：请求 `/not-found` 时响应状态码为 `404`，响应正文为 `Not Found`；先运行并确认失败。

- [ ] **步骤 6：最小扩展实现并验证**

在健康服务的非 `/health` 分支写入 `404` 和 `Not Found`，再运行同一测试文件。

预期：2 项测试通过。

### 任务 2：主入口的启动与优雅停止

**文件：**
- 修改：`apps/worker/src/main.ts`
- 修改：`apps/worker/src/health-server.test.ts`

- [ ] **步骤 1：写失败测试**

在健康服务测试中加入：启动后调用 `close()`，再次请求同一端口必须触发连接错误。该测试锁定关闭行为，不通过导入 `main.ts` 启动真实轮询。

- [ ] **步骤 2：运行测试并确认失败**

运行：`pnpm --filter @vibeverify/worker test -- health-server.test.ts`

预期：若关闭 Promise 没有真正等待 server 停止，测试失败。

- [ ] **步骤 3：接入主入口**

在 `main.ts` 中导入 `startHealthServer`，在读取到有效 Worker 配置后使用 `Number(process.env.PORT ?? 3000)` 启动健康服务。保留 `running` 信号变量；`runWorkerLoop` 结束后，在 `finally` 中等待 `health.close()`。不改变 `runWorkerLoop` 的轮询时间、任务处理器或环境变量契约。

- [ ] **步骤 4：运行测试并确认通过**

运行：`pnpm --filter @vibeverify/worker test -- health-server.test.ts worker-loop.test.ts`

预期：全部通过。

### 任务 3：Docker 构建契约

**文件：**
- 新建：`Dockerfile`
- 新建：`.dockerignore`
- 新建：`apps/worker/src/railway-dockerfile.test.ts`

- [ ] **步骤 1：写失败测试**

```ts
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Railway Dockerfile', () => {
  it('从仓库根目录安装锁定依赖并启动 Worker', async () => {
    const dockerfile = await readFile(new URL('../../../Dockerfile', import.meta.url), 'utf8');
    expect(dockerfile).toContain('node:22');
    expect(dockerfile).toContain('pnpm install --frozen-lockfile');
    expect(dockerfile).toContain('playwright install --with-deps chromium');
    expect(dockerfile).toContain('pnpm --filter @vibeverify/worker start');
  });
});
```

- [ ] **步骤 2：运行测试并确认失败**

运行：`pnpm --filter @vibeverify/worker test -- railway-dockerfile.test.ts`

预期：失败，原因是仓库根目录尚无 Dockerfile。

- [ ] **步骤 3：写最小 Dockerfile 与忽略规则**

Dockerfile 使用 `node:22-bookworm`，以 Corepack 启用 pnpm；先复制 workspace 清单与锁文件后执行 `pnpm install --frozen-lockfile`，再复制源码，执行 `pnpm --filter @vibeverify/worker exec playwright install --with-deps chromium`，最终命令为 `pnpm --filter @vibeverify/worker start`。`.dockerignore` 排除 `.git`、`.next`、`node_modules`、`.env*`、测试结果和本地临时目录，但不得排除 `apps/worker`、`packages/prompting`、锁文件或 workspace 清单。

- [ ] **步骤 4：运行测试并确认通过**

运行：`pnpm --filter @vibeverify/worker test -- railway-dockerfile.test.ts`

预期：1 项测试通过。

### 任务 4：完整质量门禁与交接

**文件：**
- 修改：`docs/DEPLOYMENT_RUNBOOK.md`

- [ ] **步骤 1：更新 Runbook 的部署前提**

在 Railway 步骤前写明：服务从仓库根目录用 Dockerfile 构建；健康检查路径为 `/health`；必须使用一个副本；首次启动确认日志中没有 `WORKER_CONFIGURATION_MISSING`。不写入或展示真实变量值。

- [ ] **步骤 2：运行 Worker 质量门禁**

运行：

```powershell
pnpm --filter @vibeverify/worker test
pnpm --filter @vibeverify/worker lint
pnpm --filter @vibeverify/worker typecheck
pnpm --filter @vibeverify/worker test -- health-server.test.ts railway-dockerfile.test.ts
git diff --check
```

预期：全部通过。Docker 镜像实际构建与 Railway 启动属于后续平台联调，不能由本地单元测试替代。

- [ ] **步骤 3：用户侧 Railway 操作说明**

代码验证通过后，提供按界面点击的 Railway 创建服务、选 GitHub 仓库、使用 Dockerfile、填写变量、设置副本为 1、配置 `/health`、查看日志的中文步骤；要求用户不要发送任何密钥值。
