import DevOpsReleaseHubPanel from './DevOpsReleaseHubPanel';
import DeveloperIntelligenceHubPanel from './DeveloperIntelligenceHubPanel';

export default function ReleaseArtifactCenter() {
  return (
    <div className="space-y-6">
      <DevOpsReleaseHubPanel />
      <DeveloperIntelligenceHubPanel />
    </div>
  );
}
