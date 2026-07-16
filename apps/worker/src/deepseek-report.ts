import { verificationReportSchema } from '@vibeverify/prompting';
import type { createDeterministicReport } from '@vibeverify/prompting';

type DeepSeekInput = { request: string; evidenceIds: string[]; homepageReachable: boolean };
type DeepSeekDependencies = {
  apiKey: string;
  model: string;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

export function createDeepSeekReportGenerator(dependencies: DeepSeekDependencies) {
  return async (input: DeepSeekInput) => {
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
              content:
                '仅输出中文 JSON 验收报告。只能引用提供的 evidenceIds；未提供的证据不得描述为已验证；不得输出源码、密钥或令牌。',
            },
            { role: 'user', content: JSON.stringify(input) },
          ],
        }),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== 'string') return null;
      const parsed = verificationReportSchema.safeParse(JSON.parse(content));
      if (!parsed.success) return null;
      const knownEvidence = new Set(input.evidenceIds);
      if (
        parsed.data.verifiedItems.some((item) =>
          item.evidenceIds.some((id) => !knownEvidence.has(id)),
        )
      )
        return null;
      return parsed.data as unknown as ReturnType<typeof createDeterministicReport>;
    } catch {
      return null;
    }
  };
}
