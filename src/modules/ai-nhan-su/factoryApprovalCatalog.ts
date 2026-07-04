export type FactoryApprovalRisk = 'low' | 'medium' | 'high';
export type FactoryApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface FactoryApprovalGate {
  id: string;
  title: string;
  risk: FactoryApprovalRisk;
  status: FactoryApprovalStatus;
  reason: string;
}

export const FACTORY_APPROVAL_GATES: FactoryApprovalGate[] = [
  { id: 'public-release', title: 'Public release', risk: 'high', status: 'pending', reason: 'Affects brand, customers and distribution channels.' },
  { id: 'main-branch-change', title: 'Main branch change', risk: 'high', status: 'pending', reason: 'Can affect production code and release stability.' },
  { id: 'paid-resource', title: 'Paid resource usage', risk: 'high', status: 'pending', reason: 'Creates real cost and needs founder confirmation.' },
  { id: 'customer-message', title: 'Customer message', risk: 'high', status: 'pending', reason: 'External communication should be reviewed before sending.' },
  { id: 'profile-switch', title: 'Runtime profile switch', risk: 'medium', status: 'pending', reason: 'Changes the runtime source for a job and should follow workspace policy.' },
  { id: 'data-removal', title: 'Data removal', risk: 'high', status: 'pending', reason: 'May remove project files, generated assets or job history.' },
];

export function pendingApprovalCount(gates: FactoryApprovalGate[] = FACTORY_APPROVAL_GATES) {
  return gates.filter((gate) => gate.status === 'pending').length;
}
