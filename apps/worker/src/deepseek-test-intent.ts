import { acceptancePlanSchema } from '@vibeverify/prompting';
import type { AcceptancePlan } from '@vibeverify/prompting';

type TestIntentInput = { request: string };
type TestIntentDependencies = {
  apiKey: string;
  model: string;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

function conservativeIntent(request: string): AcceptancePlan {
  return {
    criteria: [],
    manualReview: [{
      requirement: request,
      reason: '无法将需求转换为受限浏览器步骤；请补充页面可见文本、控件名称和预期结果。',
    }],
  };
}

export function createDeepSeekTestIntentGenerator(dependencies: TestIntentDependencies) {
  return async (input: TestIntentInput): Promise<AcceptancePlan> => {
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
              content: '只输出一个 AcceptancePlan JSON 对象，不要 Markdown。每项 criterion 必须引用用户需求原文。steps 只能使用 assert_text_visible、assert_text_hidden、fill_input、click_button、check_checkbox。禁止 URL、CSS 选择器、XPath、JavaScript、命令、登录、支付、删除、上传和外部跳转。无法安全映射的需求写入 manualReview。',
            },
            { role: 'user', content: JSON.stringify({ ...input, retry: attempt === 1 }) },
          ],
        }),
        });
        if (!response.ok) continue;
        const body = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
        const content = body.choices?.[0]?.message?.content;
        if (typeof content !== 'string') continue;
        const intent = acceptancePlanSchema.safeParse(JSON.parse(content));
        if (intent.success) return intent.data;
      } catch {
        // The fallback is an allowlisted Worker plan; no model text is retained or executed.
      }
    }
    return conservativeIntent(input.request);
  };
}
