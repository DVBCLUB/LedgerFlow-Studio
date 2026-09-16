import React from 'react';
import type { PanelTab } from './tabConfig';
import type { ChatMessage } from './ChatTab';

import ChatTab from './ChatTab';
import EditTab from './EditTab';
import ProfilesTab from './ProfilesTab';
import SearchCodebaseTab from './SearchCodebaseTab';
import DiffPreviewTab from './DiffPreviewTab';
import BackupsTab from './BackupsTab';
import StatusDashboardTab from './StatusDashboardTab';

import type { AssistantHealth, EditResult, WebAIProfile } from '../../../utils/assistantApi';

// ── Lazy-loaded tab components ───────────────────────────────────────────────
const AIOperationsSandbox = React.lazy(() => import('./AIOperationsSandbox'));
const UnifiedDashboard = React.lazy(() => import('./UnifiedDashboard'));
const ControlPlaneTab = React.lazy(() => import('./ControlPlaneTab'));
const BrowserRunbookTab = React.lazy(() => import('./BrowserRunbookTab'));
const AgentLoopMonitor = React.lazy(() => import('./AgentLoopMonitor'));
const MultiAgentMonitor = React.lazy(() => import('./MultiAgentMonitor'));
const CostDashboard = React.lazy(() => import('./CostDashboard'));
const ABTestPanel = React.lazy(() => import('./ABTestPanel'));
const AnalyticsDashboard = React.lazy(() => import('./AnalyticsDashboard'));
const AiPipelineViz = React.lazy(() => import('./AiPipelineViz'));
const AgentLiveTerminal = React.lazy(() => import('./AgentLiveTerminal'));

// ── Props interface ──────────────────────────────────────────────────────────
export interface TabRendererProps {
  tab: PanelTab;
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  chatLoading: boolean;
  sendChat: () => void;
  engineMode: 'api' | 'web_automation' | 'fabric';
  setEngineMode: (v: 'api' | 'web_automation' | 'fabric') => void;
  webPlatform: string;
  setWebPlatform: (v: string) => void;
  selectedProfileId: string;
  setSelectedProfileId: (v: string) => void;
  webAIProfiles: WebAIProfile[];
  headlessEnabled: boolean;
  setHeadlessEnabled: (v: boolean) => void;
  debateModeEnabled: boolean;
  setDebateModeEnabled: (v: boolean) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  handleAutoApplyCode: (file: string, code: string) => Promise<boolean>;
  selectedRole: string;
  setSelectedRole: (v: string) => void;
  roles: { id: string; emoji: string; group: string }[];
  rolesLoading: boolean;
  loadRoles: (silent?: boolean) => void;
  selectedRolePrompt: string;
  rolePromptLoading: boolean;
  setRolePromptTick: React.Dispatch<React.SetStateAction<number>>;
  editFile_path: string;
  setEditFilePath: (v: string) => void;
  editInstruction: string;
  setEditInstruction: (v: string) => void;
  autoRepairEnabled: boolean;
  setAutoRepairEnabled: (v: boolean) => void;
  captureScreenshot: boolean;
  setCaptureScreenshot: (v: boolean) => void;
  editLoading: boolean;
  runEdit: () => void;
  editResult: EditResult | null;
  runApply: () => void;
  applyLoading: boolean;
  applyProgress: any;
  setEditResult: (v: any) => void;
  setApplyResult: (v: any) => void;
  runRollback: () => void;
  rollbackLoading: boolean;
  applyResult: any;
  rolePromptNotifyRef: React.MutableRefObject<boolean>;
  webAIProfilesLoading: boolean;
  newProfileName: string;
  setNewProfileName: (v: string) => void;
  newProfilePlatform: string;
  setNewProfilePlatform: (v: string) => void;
  handleCreateProfile: (e: React.FormEvent) => void;
  handleDeleteProfile: (id: string) => void;
  loadWebAIProfiles: (silent?: boolean) => Promise<void>;
  pushNotice: (kind: 'success' | 'error', text: string) => void;
  diffContent: string;
  diffLoading: boolean;
  health: AssistantHealth | null;
  pingDaemon: () => void;
}

type TabComponent = React.ReactElement | null;

export default function TabRenderer(props: TabRendererProps): TabComponent {
  switch (props.tab) {
    case 'chat':
      return (
        <ChatTab
          messages={props.messages}
          chatInput={props.chatInput}
          setChatInput={props.setChatInput}
          chatLoading={props.chatLoading}
          sendChat={props.sendChat}
          engineMode={props.engineMode}
          setEngineMode={props.setEngineMode}
          webPlatform={props.webPlatform}
          setWebPlatform={props.setWebPlatform}
          selectedProfileId={props.selectedProfileId}
          setSelectedProfileId={props.setSelectedProfileId}
          webAIProfiles={props.webAIProfiles}
          headlessEnabled={props.headlessEnabled}
          setHeadlessEnabled={props.setHeadlessEnabled}
          debateModeEnabled={props.debateModeEnabled}
          setDebateModeEnabled={props.setDebateModeEnabled}
          chatEndRef={props.chatEndRef}
          onApplyCode={props.handleAutoApplyCode}
        />
      );
    case 'edit':
      return (
        <EditTab
          engineMode={props.engineMode}
          setEngineMode={props.setEngineMode}
          webPlatform={props.webPlatform}
          setWebPlatform={props.setWebPlatform}
          selectedProfileId={props.selectedProfileId}
          setSelectedProfileId={props.setSelectedProfileId}
          webAIProfiles={props.webAIProfiles}
          headlessEnabled={props.headlessEnabled}
          setHeadlessEnabled={props.setHeadlessEnabled}
          selectedRole={props.selectedRole}
          setSelectedRole={props.setSelectedRole}
          roles={props.roles}
          rolesLoading={props.rolesLoading}
          loadRoles={props.loadRoles}
          selectedRolePrompt={props.selectedRolePrompt}
          rolePromptLoading={props.rolePromptLoading}
          setRolePromptTick={props.setRolePromptTick}
          editFile_path={props.editFile_path}
          setEditFilePath={props.setEditFilePath}
          editInstruction={props.editInstruction}
          setEditInstruction={props.setEditInstruction}
          autoRepairEnabled={props.autoRepairEnabled}
          setAutoRepairEnabled={props.setAutoRepairEnabled}
          captureScreenshot={props.captureScreenshot}
          setCaptureScreenshot={props.setCaptureScreenshot}
          editLoading={props.editLoading}
          runEdit={props.runEdit}
          editResult={props.editResult}
          runApply={props.runApply}
          applyLoading={props.applyLoading}
          applyProgress={props.applyProgress}
          setEditResult={props.setEditResult}
          setApplyResult={props.setApplyResult}
          runRollback={props.runRollback}
          rollbackLoading={props.rollbackLoading}
          applyResult={props.applyResult}
          rolePromptNotifyRef={props.rolePromptNotifyRef}
        />
      );
    case 'sandbox':
      return <AIOperationsSandbox />;
    case 'overview':
      return <UnifiedDashboard />;
    case 'control':
      return (
        <ControlPlaneTab
          selectedProfileId={props.selectedProfileId}
          setSelectedProfileId={props.setSelectedProfileId}
          setWebPlatform={props.setWebPlatform}
          loadWebAIProfiles={props.loadWebAIProfiles}
          pushNotice={props.pushNotice}
        />
      );
    case 'runbook':
      return <BrowserRunbookTab />;
    case 'agent_loop':
      return <AgentLoopMonitor />;
    case 'multi_agent':
      return <MultiAgentMonitor />;
    case 'cost':
      return <CostDashboard />;
    case 'ab_test':
      return <ABTestPanel />;
    case 'analytics':
      return <AnalyticsDashboard />;
    case 'pipeline':
      return <AiPipelineViz />;
    case 'terminal':
      return <AgentLiveTerminal />;
    case 'profiles':
      return (
        <ProfilesTab
          webAIProfiles={props.webAIProfiles}
          webAIProfilesLoading={props.webAIProfilesLoading}
          selectedProfileId={props.selectedProfileId}
          setSelectedProfileId={props.setSelectedProfileId}
          newProfileName={props.newProfileName}
          setNewProfileName={props.setNewProfileName}
          newProfilePlatform={props.newProfilePlatform}
          setNewProfilePlatform={props.setNewProfilePlatform}
          handleCreateProfile={props.handleCreateProfile}
          handleDeleteProfile={props.handleDeleteProfile}
          loadWebAIProfiles={props.loadWebAIProfiles}
          pushNotice={props.pushNotice}
        />
      );
    case 'search':
      return <SearchCodebaseTab onEditFile={props.setEditFilePath} pushNotice={props.pushNotice} />;
    case 'diff':
      return <DiffPreviewTab diffContent={props.diffContent} diffLoading={props.diffLoading} />;
    case 'backups':
      return <BackupsTab />;
    case 'status':
      return <StatusDashboardTab health={props.health} onRefresh={props.pingDaemon} />;
    default:
      return null;
  }
}


