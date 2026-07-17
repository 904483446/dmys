type ReportSummary = {
  score: number;
  issues: Array<{ title: string }>;
};

export type ReportComparison = {
  scoreDelta: number;
  issueCountDelta: number;
  newlyFound: string[];
  resolved: string[];
};

export function compareReports(
  previous: ReportSummary,
  current: ReportSummary,
): ReportComparison {
  const previousTitles = new Set(previous.issues.map((issue) => issue.title));
  const currentTitles = new Set(current.issues.map((issue) => issue.title));

  return {
    scoreDelta: current.score - previous.score,
    issueCountDelta: current.issues.length - previous.issues.length,
    newlyFound: [...currentTitles].filter((title) => !previousTitles.has(title)),
    resolved: [...previousTitles].filter((title) => !currentTitles.has(title)),
  };
}
