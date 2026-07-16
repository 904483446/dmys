type Evidence = {
  id: string;
  kind: 'homepage_status' | 'screenshot' | 'console_summary';
  metadata: Record<string, boolean | number | string>;
};

type EvidenceInput = {
  homepage: { reachable: boolean; statusCode?: number };
  screenshots: Array<{
    artifactId: string;
    contentType: string;
    byteSize: number;
    storagePath: string;
  }>;
  consoleMessages: Array<{ level: 'error' | 'warning' | 'info'; message: string }>;
};

export function collectEvidence(input: EvidenceInput): Evidence[] {
  const errorCount = input.consoleMessages.filter((message) => message.level === 'error').length;
  const warningCount = input.consoleMessages.filter(
    (message) => message.level === 'warning',
  ).length;

  return [
    {
      id: 'homepage-status',
      kind: 'homepage_status',
      metadata: {
        reachable: input.homepage.reachable,
        ...(input.homepage.statusCode === undefined
          ? {}
          : { statusCode: input.homepage.statusCode }),
      },
    },
    ...input.screenshots.map(({ artifactId, contentType, byteSize }) => ({
      id: artifactId,
      kind: 'screenshot' as const,
      metadata: { contentType, byteSize },
    })),
    {
      id: 'console-summary',
      kind: 'console_summary',
      metadata: { errorCount, warningCount },
    },
  ];
}
