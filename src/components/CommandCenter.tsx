import React from 'react';
import CommandCenterV2DailyBriefPanel from './CommandCenterV2DailyBriefPanel';
import AiAgentControlCenter from './command-center/AiAgentControlCenter';
import OnboardingGuide from './command-center/OnboardingGuide';
import CEOOverviewPanel from '../modules/command-center/CEOOverviewPanel';

export default function CommandCenter() {
  return (
    <div className="space-y-6 text-slate-100">
      <CEOOverviewPanel />

      <AiAgentControlCenter />

      <OnboardingGuide />

      <CommandCenterV2DailyBriefPanel />
    </div>
  );
}
