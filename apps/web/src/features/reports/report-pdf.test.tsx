import { renderToString } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';

import { ReportPdfDocument } from './report-pdf.js';

describe('ReportPdfDocument', () => {
  it('仅以安全报告 DTO 渲染 PDF 内容', async () => {
    const output = await renderToString(
      <ReportPdfDocument
        report={{
          verdict: 'passed',
          score: 90,
          confidence: 80,
          summary: '通过',
          verifiedItems: [],
          issues: [],
        }}
      />,
    );

    expect(output.startsWith('%PDF-')).toBe(true);
    expect(output).not.toContain('artifacts/');
  });
});
