import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { fileURLToPath } from 'node:url';

import type { ReportDetail } from './report-types.js';

const fontSource = fileURLToPath(new URL('../../assets/fonts/NotoSansSC-VF.ttf', import.meta.url));

Font.register({ family: 'NotoSansSC', src: fontSource });

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'NotoSansSC', fontSize: 11, color: '#17211e' },
  title: { fontSize: 20, marginBottom: 14 },
  heading: { fontSize: 14, marginTop: 16, marginBottom: 8 },
  item: { marginBottom: 7 },
  muted: { marginTop: 18, fontSize: 9 },
});

export function ReportPdfDocument({ report }: { report: ReportDetail }) {
  return (
    <Document title="VibeVerify 验收报告">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>VibeVerify 验收报告</Text>
        <Text>结论：{report.verdict}</Text>
        <Text>评分：{report.score}</Text>
        <Text>置信度：{report.confidence}</Text>
        <Text style={styles.heading}>已验证功能</Text>
        <View>
          {report.verifiedItems.map((item) => (
            <Text key={item.title} style={styles.item}>
              {item.title}（{item.status}）
            </Text>
          ))}
        </View>
        <Text style={styles.heading}>问题与修复提示词</Text>
        <View>
          {report.issues.map((issue) => (
            <View key={issue.title} style={styles.item}>
              <Text>{issue.title}</Text>
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
