import React from 'react';
import AIWorkforceCommandCenter from './AIWorkforceCommandCenter';
import AIWorkforceRuntimePanel from './AIWorkforceRuntimePanel';
import AICommandCenterHubPanel from './AICommandCenterHubPanel';
import AIGovernanceQualityHubPanel from './AIGovernanceQualityHubPanel';
import AIWorkforceMissionControl from './AIWorkforceMissionControl';
import AIWorkforcePatchReviewSessions from './AIWorkforcePatchReviewSessions';
import AIWorkforcePatchSafetyRunbook from './AIWorkforcePatchSafetyRunbook';
import AIWorkforcePluginSecurityGuard from './AIWorkforcePluginSecurityGuard';
import AIWorkforceSkillDirectory from './AIWorkforceSkillDirectory';
import AIWorkforceSkillInvocationPlanner from './AIWorkforceSkillInvocationPlanner';
import AIWorkforceRobotAutomationBridge from './AIWorkforceRobotAutomationBridge';

export default function AIOperationsCenter() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-left">
        <h2 className="text-sm font-black text-white">AI Factory Runtime Console</h2>
        <p className="mt-1 text-xs text-slate-400">
          Giao diện điều phối trực tiếp luồng thực thi nhiệm vụ AI, kiểm chứng tính toàn vẹn của mô hình cục bộ và giám sát kết nối Daemon.
        </p>
      </div>
      <AIWorkforceRuntimePanel />
      <AIWorkforceCommandCenter />

      <details className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4 text-left">
        <summary className="cursor-pointer select-none text-xs font-black text-slate-400 hover:text-slate-200">
          Advanced Diagnostics Hubs
        </summary>
        <div className="mt-4 space-y-6">
          <AICommandCenterHubPanel />
          <AIGovernanceQualityHubPanel />
          <div className="hidden">
            <AIWorkforceMissionControl />
            <AIWorkforcePatchReviewSessions />
      <AIWorkforcePatchSafetyRunbook />
            <AIWorkforcePluginSecurityGuard />

      <AIWorkforceRobotAutomationBridge />

      <AIWorkforceSkillDirectory />

      <AIWorkforceSkillInvocationPlanner />
          </div>
        </div>
      </details>
    </div>
  );
}


