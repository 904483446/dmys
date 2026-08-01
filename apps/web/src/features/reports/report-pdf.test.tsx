import { renderToBuffer, renderToString } from '@react-pdf/renderer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ReportPdfDocument } from './report-pdf.js';
import * as reportPdf from './report-pdf.js';

const reportPdfLines = (reportPdf as Record<string, unknown>).reportPdfLines as
  | ((report: Parameters<typeof ReportPdfDocument>[0]['report']) => string[])
  | undefined;

describe('ReportPdfDocument', () => {
  it('builds Chinese PDF lines with 100-point metrics', () => {
    const lines = reportPdfLines?.({
      verdict: 'at_risk',
      score: 64,
      confidence: 70,
      summary: '存在风险',
      verifiedItems: [{ title: '首页可访问', evidenceIds: [], status: 'verified' }],
      issues: [{ severity: 'major', title: '保存失败', description: '提交后未更新', evidenceIds: [], repairPrompt: '修复保存逻辑' }],
    });

    expect(reportPdfLines).toBeTypeOf('function');
    expect(lines).toContain('结论：有风险');
    expect(lines).toContain('评分：64 / 100');
    expect(lines).toContain('置信度：70 / 100');
    expect(lines).toContain('首页可访问：已验证');
    expect(lines).not.toContain('结论：at_risk');
  });

  it('includes explicit verified and unverified headings in PDF lines', () => {
    const lines = reportPdfLines?.({
      verdict: 'at_risk', score: 50, confidence: 70, summary: '存在风险', issues: [],
      verifiedItems: [
        { title: '首页可访问', evidenceIds: ['homepage'], status: 'verified' },
        { title: '添加任务', evidenceIds: ['add'], status: 'not_verified' },
      ],
    });

    expect(lines).toContain('功能验收明细');
    expect(lines).toContain('已验证（1）');
    expect(lines).toContain('未验证（1）');
  });

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
