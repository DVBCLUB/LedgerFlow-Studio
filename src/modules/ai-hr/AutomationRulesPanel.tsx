import AutomationRobotControlHubPanel from './AutomationRobotControlHubPanel';
import AutomationBridgeHubPanel from './AutomationBridgeHubPanel';

export default function AutomationRulesPanel() {
  return (
    <div className="space-y-6">
      <AutomationRobotControlHubPanel />
      <AutomationBridgeHubPanel />
    </div>
  );
}
