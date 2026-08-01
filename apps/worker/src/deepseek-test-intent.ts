import { testIntentSchema } from '@vibeverify/prompting';
import type { TestIntent } from '@vibeverify/prompting';

type TestIntentInput = { request: string };
type TestIntentDependencies = {
  apiKey: string;
  model: string;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

function conservativeIntent(request: string): TestIntent {
  if (/任务清单|今日任务/.test(request)) {
    return {
      checks: [
        { template: 'task_list_add', title: '添加任务', actionText: '验收新增任务', expectedText: '验收新增任务' },
        { template: 'task_list_blank', title: '空输入不新增任务', expectedText: '请输入任务内容', absentText: '验收空任务' },
        { template: 'task_list_toggle', title: '勾选任务', actionText: '整理需求文档', expectedText: '剩余 2 项待完成任务' },
        { template: 'task_list_filter', title: '筛选已完成任务', actionText: '已完成', expectedText: '整理需求文档', absentText: '检查首页样式' },
      ],
    };
  }
  return { checks: [{ template: 'homepage', title: '首页可访问', expectedText: '首页' }] };
}

export function createDeepSeekTestIntentGenerator(dependencies: TestIntentDependencies) {
  return async (input: TestIntentInput): Promise<TestIntent> => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await dependencies.fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${dependencies.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: dependencies.model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: '只输出一个 JSON 对象，不要 Markdown。将用户需求映射为 checks。每项只能使用 homepage、task_list_add、task_list_blank、task_list_toggle、task_list_filter 之一；必须包含 title 和 expectedText；需要操作文本时使用 actionText。task_list_blank 和 task_list_filter 必须提供操作后不可见的 absentText。禁止输出 CSS 选择器、XPath、JavaScript、命令或任何执行代码。',
            },
            { role: 'user', content: JSON.stringify({ ...input, retry: attempt === 1 }) },
          ],
        }),
        });
        if (!response.ok) continue;
        const body = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
        const content = body.choices?.[0]?.message?.content;
        if (typeof content !== 'string') continue;
        const intent = testIntentSchema.safeParse(JSON.parse(content));
        if (intent.success) return intent.data;
      } catch {
        // The fallback is an allowlisted Worker plan; no model text is retained or executed.
      }
    }
    return conservativeIntent(input.request);
  };
}
