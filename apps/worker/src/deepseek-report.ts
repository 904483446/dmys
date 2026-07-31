import { verificationReportSchema } from '@vibeverify/prompting';
import type { createDeterministicReport } from '@vibeverify/prompting';

type DeepSeekInput = { request: string; evidenceIds: string[]; homepageReachable: boolean };
type DeepSeekDependencies = {
  apiKey: string;
  model: string;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
  log?: (entry: {
    event: 'report_model_response_invalid';
    reason: 'EMPTY_CONTENT' | 'JSON_PARSE' | 'SCHEMA' | 'UNKNOWN_EVIDENCE' | 'PROVIDER_PAYLOAD';
    contentType?: string;
    topLevelKeys?: string[];
    invalidPaths?: string[];
  }) => void;
};

function invalidModelResponse(
  dependencies: DeepSeekDependencies,
  reason: 'EMPTY_CONTENT' | 'JSON_PARSE' | 'SCHEMA' | 'UNKNOWN_EVIDENCE' | 'PROVIDER_PAYLOAD',
  details: Omit<Parameters<NonNullable<DeepSeekDependencies['log']>>[0], 'event' | 'reason'> = {},
): never {
  dependencies.log?.({ event: 'report_model_response_invalid', reason, ...details });
  throw new Error(`REPORT_MODEL_FAILED:RESPONSE_INVALID:${reason}`);
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstValue(record: Record<string, unknown>, keys: string[]) {
  return keys.map((key) => record[key]).find((value) => value !== undefined);
}

function jsonObjectFrom(content: string) {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = trimmed.indexOf('{');
  if (start === -1) return trimmed;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < trimmed.length; index += 1) {
    const character = trimmed[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return trimmed.slice(start, index + 1);
    }
  }
  return trimmed;
}

function asEvidenceIds(value: unknown) {
  if (typeof value === 'string') return [value];
  return value;
}

function asScore(value: unknown) {
  if (typeof value !== 'string') return value;
  const match = value.match(/\d+(?:\.\d+)?/);
  return match === null ? value : Number(match[0]);
}

function normalizeModelReport(content: string): unknown {
  const report = JSON.parse(jsonObjectFrom(content));
  const value = recordOf(report);
  if (value === null) return report;

  const normalizeVerdict = (input: unknown) => {
    if (typeof input !== 'string') return input;
    const key = input.trim().toLowerCase().replace(/[\s-]+/g, '_');
    return ({
      passed: 'passed',
      pass: 'passed',
      success: 'passed',
      approved: 'passed',
      '通过': 'passed',
      '已通过': 'passed',
      at_risk: 'at_risk',
      risk: 'at_risk',
      risky: 'at_risk',
      warning: 'at_risk',
      warn: 'at_risk',
      needs_attention: 'at_risk',
      needs_improvement: 'at_risk',
      partial_pass: 'at_risk',
      conditional_pass: 'at_risk',
      '有风险': 'at_risk',
      '风险': 'at_risk',
      '警告': 'at_risk',
      '需修复': 'at_risk',
      failed: 'failed',
      fail: 'failed',
      not_passed: 'failed',
      rejected: 'failed',
      '未通过': 'failed',
      '失败': 'failed',
    }[key] ?? input);
  };
  const normalizeStatus = (input: unknown) =>
    ({ '已验证': 'verified', '未验证': 'not_verified' }[String(input)] ?? input);
  const normalizeSeverity = (input: unknown) =>
    ({ '严重': 'critical', '重要': 'major', '轻微': 'minor' }[String(input)] ?? input);
  const normalizeItem = (item: unknown) => {
    const record = recordOf(item);
    if (record === null) return item;
    return {
      ...record,
      title: firstValue(record, ['title', 'name', '名称']),
      status: normalizeStatus(firstValue(record, ['status', '状态'])),
      evidenceIds: asEvidenceIds(firstValue(record, ['evidenceIds', 'evidence_ids', 'evidenceId', 'evidence_id', '证据'])) ,
    };
  };
  const normalizeIssue = (issue: unknown) => {
    const record = recordOf(issue);
    if (record === null) return issue;
    return {
      ...record,
      severity: normalizeSeverity(firstValue(record, ['severity', '严重程度'])),
      title: firstValue(record, ['title', 'name', '名称']),
      description: firstValue(record, ['description', 'detail', '说明', '描述']),
      evidenceIds: asEvidenceIds(firstValue(record, ['evidenceIds', 'evidence_ids', 'evidenceId', 'evidence_id', '证据'])),
      repairPrompt: firstValue(record, ['repairPrompt', 'repair_prompt', 'fixPrompt', 'fix_prompt', 'repairSuggestion', '修复提示词']),
    };
  };
  const verifiedItems = firstValue(value, ['verifiedItems', 'verified_items', 'verifiedFeatures', 'verified_features', '已验证功能']);
  const issues = firstValue(value, ['issues', 'problems', '问题']);

  return {
    ...value,
    verdict: normalizeVerdict(firstValue(value, ['verdict', '结论'])),
    score: asScore(firstValue(value, ['score', '评分'])),
    confidence: asScore(firstValue(value, ['confidence', '可信度'])),
    summary: firstValue(value, ['summary', '结论摘要', '摘要']),
    verifiedItems: Array.isArray(verifiedItems) ? verifiedItems.map(normalizeItem) : verifiedItems,
    issues: Array.isArray(issues) ? issues.map(normalizeIssue) : issues,
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
      if (typeof content !== 'string')
        invalidModelResponse(dependencies, 'EMPTY_CONTENT', { contentType: typeof content });
      let normalized: unknown;
      try {
        normalized = normalizeModelReport(content);
      } catch {
        invalidModelResponse(dependencies, 'JSON_PARSE');
      }
      const parsed = verificationReportSchema.safeParse(normalized);
      if (!parsed.success) {
        const report = recordOf(normalized);
        invalidModelResponse(dependencies, 'SCHEMA', {
          topLevelKeys: report === null
            ? []
            : Object.keys(report)
              .filter((key) => /^[A-Za-z0-9_]{1,48}$/.test(key))
              .slice(0, 16),
          invalidPaths: parsed.error.issues
            .map((issue) => issue.path.join('.'))
            .filter((path) => path.length > 0)
            .slice(0, 8),
        });
      }
      const knownEvidence = new Set(input.evidenceIds);
      if (
        parsed.data.verifiedItems.some((item) =>
          item.evidenceIds.some((id) => !knownEvidence.has(id)),
        )
        || parsed.data.issues.some((issue) => issue.evidenceIds.some((id) => !knownEvidence.has(id)))
      )
        invalidModelResponse(dependencies, 'UNKNOWN_EVIDENCE');
      return parsed.data as unknown as ReturnType<typeof createDeterministicReport>;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('REPORT_MODEL_FAILED:')) throw error;
      invalidModelResponse(dependencies, 'PROVIDER_PAYLOAD');
    }
  };
}
