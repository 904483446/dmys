import { renderToBuffer, renderToString } from '@react-pdf/renderer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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

  it.runIf(process.env.WRITE_PDF_FIXTURE === 'true')('生成无敏感 PDF fixture', async () => {
    const output = await renderToBuffer(
      <ReportPdfDocument report={{ verdict: 'passed', score: 90, confidence: 80, summary: '通过', verifiedItems: [{ title: '首页可访问', evidenceIds: ['homepage-ok'], status: 'verified' }], issues: [] }} />,
    );
    const directory = join(process.cwd(), '../../tmp/pdfs');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'phase4-report-fixture.pdf'), output);
  });
});
