type DeterministicReportInput = {
  homepageReachable: boolean;
  evidenceIds: string[];
};

export function createDeterministicReport(input: DeterministicReportInput) {
  if (!input.homepageReachable) {
    return {
      verdict: 'failed' as const,
      score: 0,
      confidence: 90,
      summary: '首页无法访问，无法完成自动验收。',
      verifiedItems: [],
      issues: [
        {
          severity: 'critical',
          title: '首页不可访问',
          description: '受控运行环境未能访问项目首页。',
          evidenceIds: input.evidenceIds,
          repairPrompt: '请检查项目启动配置，并确保首页可在本地访问。',
        },
      ],
    };
  }

  return {
    verdict: 'at_risk' as const,
    score: 50,
    confidence: 40,
    summary: '首页可访问，但报告模型不可用，未完成完整需求验收。',
    verifiedItems: [
      {
        title: '首页可访问',
        status: 'verified' as const,
        evidenceIds: input.evidenceIds,
      },
    ],
    issues: [
      {
        severity: 'major',
        title: '报告模型不可用',
        description: '已生成确定性降级报告，建议稍后重新验收。',
        evidenceIds: input.evidenceIds,
        repairPrompt: '请稍后重新提交验收任务，以生成完整报告。',
      },
    ],
  };
}
