export type FounderControlReportKind = 'nightly-sweeper' | 'revenue-leak' | 'customer-churn' | 'code-quality';

const routeByKind: Record<FounderControlReportKind, string> = {
  'nightly-sweeper': '/api/autonomous-robots/nightly-sweeper',
  'revenue-leak': '/api/autonomous-robots/revenue-leak',
  'customer-churn': '/api/autonomous-robots/customer-churn',
  'code-quality': '/api/autonomous-robots/code-quality',
};

export async function runFounderControlReport(kind: FounderControlReportKind): Promise<any> {
  const response = await fetch(routeByKind[kind], { method: 'POST' });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Không thể tạo báo cáo điều hành.');
  return data.report;
}
