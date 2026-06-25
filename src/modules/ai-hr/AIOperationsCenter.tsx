import AIWorkforceMissionControl from './AIWorkforceMissionControl';
import AIWorkforceOpenClawReadiness from './AIWorkforceOpenClawReadiness';
import AIWorkforceNextBackendActions from './AIWorkforceNextBackendActions';
import AIWorkforceMissionTrace from './AIWorkforceMissionTrace';
import AIWorkforcePatchReviewSessions from './AIWorkforcePatchReviewSessions';
import AIWorkforceMobileCommandCenter from './AIWorkforceMobileCommandCenter';
import AIWorkforceMissionTemplates from './AIWorkforceMissionTemplates';
import AIWorkforceToolCatalog from './AIWorkforceToolCatalog';
import AIWorkforcePluginSecurityGuard from './AIWorkforcePluginSecurityGuard';
import AICommandCenterHubPanel from './AICommandCenterHubPanel';
import AIGovernanceQualityHubPanel from './AIGovernanceQualityHubPanel';

export default function AIOperationsCenter() {
  return (
    <div className="space-y-6">
      <AIWorkforceMissionControl />
      <AIWorkforceOpenClawReadiness />
      <AIWorkforceNextBackendActions />
      <AIWorkforceMissionTrace />
      <AIWorkforcePatchReviewSessions />
      <AIWorkforceMobileCommandCenter />
      <AIWorkforceMissionTemplates />
      <AIWorkforceToolCatalog />
      <AIWorkforcePluginSecurityGuard />

      <details className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
        <summary className="cursor-pointer select-none text-sm font-black text-white">
          Advanced diagnostics, raw runtime and governance panels
        </summary>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Các panel chuyên sâu vẫn được giữ lại, nhưng mặc định chạy dưới dạng khu mở rộng để AI Workforce gọn như một mission-control console.
        </p>
        <div className="mt-5 space-y-6">
          <AICommandCenterHubPanel />
          <AIGovernanceQualityHubPanel />
        </div>
      </details>
    </div>
  );
}
