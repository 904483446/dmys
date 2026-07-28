const statusLabels: Record<string, string> = {
  queued: '等待处理',
  preparing: '正在准备项目',
  building: '正在构建',
  running: '正在启动',
  testing: '正在检查',
  reporting: '正在生成报告',
  completed: '验收完成',
  failed: '验收失败',
  timed_out: '验收超时',
};

export function formatVerificationStatus(status: string): string {
  return statusLabels[status] ?? '状态更新中';
}
