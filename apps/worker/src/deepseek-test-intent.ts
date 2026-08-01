import { testIntentSchema } from '@vibeverify/prompting';
import type { TestIntent } from '@vibeverify/prompting';

type TestIntentInput = { request: string };
type TestIntentDependencies = {
  apiKey: string;
  model: string;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

function testIntentFailure(reason: string): never {
  throw new Error(`TEST_INTENT_MODEL_FAILED:${reason}`);
}

export function createDeepSeekTestIntentGenerator(dependencies: TestIntentDependencies) {
  return async (input: TestIntentInput): Promise<TestIntent> => {
    let response: Response;
    try {
      response = await dependencies.fetch('https://api.deepseek.com/chat/completions', {
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
            { role: 'user', content: JSON.stringify(input) },
          ],
        }),
      });
    } catch {
      testIntentFailure('NETWORK');
    }
    if (!response.ok) testIntentFailure(`HTTP_${response.status}`);

    try {
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== 'string') testIntentFailure('EMPTY_CONTENT');
      const intent = testIntentSchema.safeParse(JSON.parse(content));
      if (!intent.success) testIntentFailure('SCHEMA');
      return intent.data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('TEST_INTENT_MODEL_FAILED:')) throw error;
      testIntentFailure('PARSE');
    }
  };
}
