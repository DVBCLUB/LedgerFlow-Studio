export type CompanyOSLaneId =
  | 'command-center'
  | 'product-studio'
  | 'marketing-growth'
  | 'sales-crm'
  | 'finance-accounting'
  | 'projects-delivery'
  | 'ai-workforce'
  | 'documents-approval'
  | 'analytics-sandbox'
  | 'integration-hub'
  | 'system-settings'
  | 'industry-templates';

export type CompanyOSLaneStatus = 'core' | 'next' | 'template';

export type CompanyOSLane = {
  id: CompanyOSLaneId;
  label: string;
  group: 'Operate' | 'Build' | 'Sell' | 'Control' | 'Extend';
  status: CompanyOSLaneStatus;
  owner: string;
  routeHint: string;
};

export const companyOSLanes: CompanyOSLane[] = [
  { id: 'command-center', label: 'Command Center', group: 'Operate', status: 'core', owner: 'Founder', routeHint: '/command' },
  { id: 'product-studio', label: 'Product Studio', group: 'Build', status: 'core', owner: 'Product', routeHint: '/product' },
  { id: 'marketing-growth', label: 'Marketing & Growth', group: 'Sell', status: 'core', owner: 'Growth', routeHint: '/growth' },
  { id: 'sales-crm', label: 'Sales & CRM', group: 'Sell', status: 'core', owner: 'Sales', routeHint: '/sales' },
  { id: 'finance-accounting', label: 'Finance & Accounting', group: 'Control', status: 'core', owner: 'Finance', routeHint: '/finance' },
  { id: 'projects-delivery', label: 'Projects & Delivery', group: 'Operate', status: 'core', owner: 'Ops', routeHint: '/projects' },
  { id: 'ai-workforce', label: 'AI Workforce / AgentOps', group: 'Build', status: 'core', owner: 'AgentOps', routeHint: '/agentops' },
  { id: 'documents-approval', label: 'Documents & Approval', group: 'Control', status: 'core', owner: 'Governance', routeHint: '/documents' },
  { id: 'analytics-sandbox', label: 'Analytics & Sandbox', group: 'Build', status: 'core', owner: 'Data', routeHint: '/analytics' },
  { id: 'integration-hub', label: 'Integration Hub', group: 'Extend', status: 'next', owner: 'Integrations', routeHint: '/integrations' },
  { id: 'system-settings', label: 'System Settings', group: 'Control', status: 'next', owner: 'Admin', routeHint: '/settings' },
  { id: 'industry-templates', label: 'Industry Templates', group: 'Extend', status: 'template', owner: 'Templates', routeHint: '/templates' },
];

export function getCompanyOSLane(id: CompanyOSLaneId) {
  return companyOSLanes.find((lane) => lane.id === id);
}
