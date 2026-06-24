import SystemOverviewDaemonPanel from './SystemOverviewDaemonPanel';
import PlatformServicesHubPanel from './PlatformServicesHubPanel';

export default function ConfigHealthMonitor() {
  return (
    <div className="space-y-6">
      <SystemOverviewDaemonPanel />
      <PlatformServicesHubPanel />
    </div>
  );
}
