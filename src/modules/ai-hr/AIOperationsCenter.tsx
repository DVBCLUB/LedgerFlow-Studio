import AICommandCenterHubPanel from './AICommandCenterHubPanel';
import AIGovernanceQualityHubPanel from './AIGovernanceQualityHubPanel';

export default function AIOperationsCenter() {
  return (
    <div className="space-y-6">
      <AICommandCenterHubPanel />
      <AIGovernanceQualityHubPanel />
    </div>
  );
}
