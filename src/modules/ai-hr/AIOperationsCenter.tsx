import AIWorkforceMissionControl from './AIWorkforceMissionControl';
import AICommandCenterHubPanel from './AICommandCenterHubPanel';
import AIGovernanceQualityHubPanel from './AIGovernanceQualityHubPanel';

export default function AIOperationsCenter() {
  return (
    <div className="space-y-6">
      <AIWorkforceMissionControl />
      <AICommandCenterHubPanel />
      <AIGovernanceQualityHubPanel />
    </div>
  );
}
