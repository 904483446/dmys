import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { fileURLToPath } from 'node:url';

import {
  formatIssueSeverity,
  formatReportVerdict,
  formatVerificationItemStatus,
  type ReportDetail,
} from './report-types';

const fontSource = fileURLToPath(new URL('../../assets/fonts/NotoSansSC-VF.ttf', import.meta.url));

Font.register({ family: 'NotoSansSC', src: fontSource });

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'NotoSansSC', fontSize: 11, color: '#17211e' },
  title: { fontSize: 20, marginBottom: 14 },
  heading: { fontSize: 14, marginTop: 16, marginBottom: 8 },
  item: { marginBottom: 7 },
  muted: { marginTop: 18, fontSize: 9 },
});

export function reportPdfLines(report: ReportDetail): string[] {
  const verifiedItems = report.verifiedItems.filter((item) => item.status === 'verified');
  const unverifiedItems = report.verifiedItems.filter((item) => item.status === 'not_verified');
  return [
    `结论：${formatReportVerdict(report.verdict)}`,
    `评分：${report.score} / 100`,
    `置信度：${report.confidence} / 100`,
    '功能验收明细',
    `已验证（${verifiedItems.length}）`,
    ...(verifiedItems.length === 0 ? ['无'] : verifiedItems.map((item) => `${item.title}：${formatVerificationItemStatus(item.status)}`)),
    `未验证（${unverifiedItems.length}）`,
    ...(unverifiedItems.length === 0 ? ['无'] : unverifiedItems.map((item) => `${item.title}：${formatVerificationItemStatus(item.status)}`)),
    ...report.issues.flatMap((issue) => [
      `${issue.title}（${formatIssueSeverity(issue.severity)}）`,
      issue.description,
      `修复提示词：${issue.repairPrompt}`,
    ]),
  ];
}

export function ReportPdfDocument({ report }: { report: ReportDetail }) {
  const [verdict, score, confidence] = reportPdfLines(report);
  const verifiedItems = report.verifiedItems.filter((item) => item.status === 'verified');
  const unverifiedItems = report.verifiedItems.filter((item) => item.status === 'not_verified');

  return (
    <Document title="VibeVerify 验收报告">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>VibeVerify 验收报告</Text>
        <Text>{verdict}</Text>
        <Text>{score}</Text>
        <Text>{confidence}</Text>
        <Text style={styles.heading}>功能验收明细</Text>
        <View>
          <Text style={styles.item}>已验证（{verifiedItems.length}）</Text>
          {verifiedItems.length === 0 ? <Text style={styles.item}>无</Text> : verifiedItems.map((item) => (
            <Text key={item.title} style={styles.item}>
              {item.title}：{formatVerificationItemStatus(item.status)}
            </Text>
          ))}
          <Text style={styles.item}>未验证（{unverifiedItems.length}）</Text>
          {unverifiedItems.length === 0 ? <Text style={styles.item}>无</Text> : unverifiedItems.map((item) => (
            <Text key={item.title} style={styles.item}>
              {item.title}：{formatVerificationItemStatus(item.status)}
            </Text>
          ))}
        </View>
        <Text style={styles.heading}>问题与修复提示词</Text>
        <View>
          {report.issues.map((issue) => (
            <View key={issue.title} style={styles.item}>
              <Text>{issue.title}（{formatIssueSeverity(issue.severity)}）</Text>
              <Text>{issue.description}</Text>
              <Text>修复提示词：{issue.repairPrompt}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.muted}>自动验收建议，最终由用户判断。</Text>
      </Page>
    </Document>
  );
}
