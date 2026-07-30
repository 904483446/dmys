import { verificationReportSchema } from '@vibeverify/prompting';
import type { createDeterministicReport } from '@vibeverify/prompting';

type DeepSeekInput = { request: string; evidenceIds: string[]; homepageReachable: boolean };
type DeepSeekDependencies = {
  apiKey: string;
  model: string;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

function normalizeModelReport(content: string): unknown {
  const json = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const report = JSON.parse(json);
  if (report === null || typeof report !== 'object' || Array.isArray(report)) return report;

  const value = report as Record<string, unknown>;
  const normalizeItem = (item: unknown) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return item;
    const record = item as Record<string, unknown>;
    return { ...record, evidenceIds: record.evidenceIds ?? record.evidence_ids };
  };

  return {
    ...value,
    verifiedItems: Array.isArray(value.verifiedItems ?? value.verified_items)
      ? (value.verifiedItems ?? value.verified_items as unknown[]).map(normalizeItem)
      : value.verifiedItems ?? value.verified_items,
    issues: Array.isArray(value.issues)
      ? value.issues.map((issue) => {
          if (issue === null || typeof issue !== 'object' || Array.isArray(issue)) return issue;
          const record = issue as Record<string, unknown>;
          return {
            ...record,
            evidenceIds: record.evidenceIds ?? record.evidence_ids,
            repairPrompt: record.repairPrompt ?? record.repair_prompt,
          };
        })
      : value.issues,
  };
}

export function createDeepSeekReportGenerator(dependencies: DeepSeekDependencies) {
  return async (input: DeepSeekInput) => {
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
              content:
                '仅输出一个中文 JSON 对象，不要 Markdown 代码块。必须使用 camelCase 并包含 verdict、score（0-100 整数）、confidence（0-100 整数）、summary、verifiedItems、issues。verifiedItems 的每项必须含 title、status（verified 或 not_verified）、evidenceIds；issues 的每项必须含 severity（critical、major 或 minor）、title、description、evidenceIds、repairPrompt。只能引用提供的 evidenceIds；未提供的证据不得描述为已验证；每个问题都必须给出可直接复制的 repairPrompt；不得输出源码、密钥或令牌。',
            },
            { role: 'user', content: JSON.stringify(input) },
          ],
        }),
      });
    } catch {
      throw new Error('REPORT_MODEL_FAILED:NETWORK');
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('REPORT_MODEL_FAILED:AUTH');
      if (response.status === 429) throw new Error('REPORT_MODEL_FAILED:RATE_LIMITED');
      throw new Error('REPORT_MODEL_FAILED:PROVIDER');
    }
    try {
      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('REPORT_MODEL_FAILED:RESPONSE_INVALID');
      const parsed = verificationReportSchema.safeParse(normalizeModelReport(content));
      if (!parsed.success) throw new Error('REPORT_MODEL_FAILED:RESPONSE_INVALID');
      const knownEvidence = new Set(input.evidenceIds);
      if (
        parsed.data.verifiedItems.some((item) =>
          item.evidenceIds.some((id) => !knownEvidence.has(id)),
        )
        || parsed.data.issues.some((issue) => issue.evidenceIds.some((id) => !knownEvidence.has(id)))
      )
        throw new Error('REPORT_MODEL_FAILED:RESPONSE_INVALID');
      return parsed.data as unknown as ReturnType<typeof createDeterministicReport>;
    } catch (error) {
      if (error instanceof Error && error.message === 'REPORT_MODEL_FAILED:RESPONSE_INVALID') throw error;
      throw new Error('REPORT_MODEL_FAILED:RESPONSE_INVALID');
    }
  };
}
