import React, { Suspense } from "react";
import { Bot, Loader2, RefreshCw, CircleDot } from "lucide-react";
import { type PanelTab, type EngineMode, DEV_TABS, CORE_CATEGORIES, ADVANCED_CATEGORY, ALL_CATEGORIES } from "./ai-assistant/tabConfig";
import GlassmorphicModal from "./ai-assistant/GlassmorphicModal";
import TabRenderer from "./ai-assistant/TabRenderer";
import { useAssistantPanel } from "./ai-assistant/useAssistantPanel";

export default function AIAssistantPanel() {
  const {
    tab, setTab, showDevTabs, setShowDevTabs,
    health, checking, daemonError,
    engineMode, setEngineMode, webPlatform, setWebPlatform,
    syncNotice,
    messages, chatInput, setChatInput, chatLoading, chatEndRef,
    editFile_path, setEditFilePath, editInstruction, setEditInstruction,
    editLoading, editResult, runEdit,
    applyLoading, applyResult, applyProgress, runApply, setEditResult, setApplyResult,
    runRollback, rollbackLoading,
    autoRepairEnabled, setAutoRepairEnabled, captureScreenshot, setCaptureScreenshot,
    roles, rolesLoading, selectedRole, setSelectedRole,
    selectedRolePrompt, rolePromptLoading, rolePromptTick, setRolePromptTick,
    rolePromptNotifyRef,
    diffContent, diffLoading,
    webAIProfiles, webAIProfilesLoading, selectedProfileId, setSelectedProfileId,
    newProfileName, setNewProfileName, newProfilePlatform, setNewProfilePlatform,
    headlessEnabled, setHeadlessEnabled, debateModeEnabled, setDebateModeEnabled,
    activeModal,
    pushNotice, pingDaemon, loadRoles, loadWebAIProfiles,
    handleCreateProfile, handleDeleteProfile,
    sendChat, handleAutoApplyCode,
  } = useAssistantPanel();

  // Daemon offline state
  if (daemonError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center">
          <Bot className="h-8 w-8 text-rose-400" />
        </div>
        <div>
          <h3 className="text-lg font-black text-text-primary mb-2">Daemon chýa ch?y</h3>
          <p className="text-text-secondary text-sm mb-4 max-w-sm">{daemonError}</p>
          <div className="bg-bg-primary border border-border-primary rounded-xl p-4 text-left mb-4">
            <p className="text-xs text-text-tertiary font-mono mb-2"># M? terminal và ch?y:</p>
            <p className="text-sm text-emerald-400 font-mono font-bold">npm run assistant:start</p>
          </div>
        </div>
        <button
          onClick={pingDaemon}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-text-primary text-sm font-black rounded-xl transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Th? k?t n?i l?i
        </button>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
        <p className="text-text-secondary text-sm font-semibold">Ðang k?t n?i AI Coding Assistant...</p>
      </div>
    );
  }

  // Tab configuration
  const activeCategory = ALL_CATEGORIES.find(cat => cat.subTabs.some(st => st.id === tab)) || CORE_CATEGORIES[0];
  const visibleCategories = showDevTabs || CORE_CATEGORIES.some(cat => cat.id === activeCategory.id)
    ? [...CORE_CATEGORIES, ...(showDevTabs ? [ADVANCED_CATEGORY] : [])]
    : [...CORE_CATEGORIES, activeCategory];

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] min-h-[650px] bg-slate-950/80 rounded-2xl border border-border-primary/60 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-gradient-to-r from-violet-950/40 to-slate-950/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Bot className="h-4 w-4 text-text-primary" />
          </div>
          <div>
            <div className="text-sm font-black text-text-primary leading-none">AI Workforce Command Center</div>
            <div className="text-[10px] text-text-tertiary mt-0.5 font-semibold">
              {health ? `Daemon v${health.version} · ${health.workspaceRoot.split("\\").pop()}` : "Connecting..."}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDevTabs(prev => !prev)}
            className="px-3.5 py-1.5 rounded-full border border-indigo-500/35 text-xs font-black text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 transition cursor-pointer shadow-sm"
          >
            {showDevTabs ? "?? Ch? ð? Khoang lái Ðõn gi?n" : "?? Ch? ð? K? thu?t (Dev Tools)"}
          </button>
          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm" title="AI Gateway Router • DOM Vision Self-Healer • Swarm Relay Bus • Audit Log">
            <CircleDot className="h-2.5 w-2.5 animate-pulse text-emerald-400" /> ?? 4/4 Daemons Ng?m Online
          </span>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="shrink-0 border-b border-border-primary/50 bg-slate-950/90 backdrop-blur">
        {/* Master Categories Row */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5 pb-1.5 border-b border-border-primary/40">
          {visibleCategories.map(cat => {
            const isCatActive = cat.id === activeCategory.id;
            return (
              <button
                key={cat.id}
                onClick={() => setTab(cat.subTabs[0].id)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                  isCatActive
                    ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/30 text-violet-200 border border-violet-500/40 shadow-lg shadow-violet-500/10"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-tabs Pills Row */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-slate-900/40">
          <span className="text-[9px] font-black uppercase tracking-widest text-text-tertiary mr-1 shrink-0">
            Ch?c nãng:
          </span>
          {activeCategory.subTabs.map(st => {
            const isSubActive = tab === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setTab(st.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isSubActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "bg-slate-950/80 text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-border-primary/60"
                }`}
              >
                {st.icon}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {syncNotice && (
          <div className={`mx-4 mt-3 rounded-xl border px-3 py-2 text-[11px] font-bold ${
            syncNotice.kind === "success"
              ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/30 text-rose-300"
          }`}>
            {syncNotice.text}
          </div>
        )}

        <Suspense fallback={<div className="m-4 h-48 animate-pulse rounded-2xl border border-border-primary bg-slate-900/60" />}>
          <TabRenderer
            tab={tab}
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatLoading={chatLoading}
            sendChat={sendChat}
            engineMode={engineMode}
            setEngineMode={setEngineMode}
            webPlatform={webPlatform}
            setWebPlatform={setWebPlatform}
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            webAIProfiles={webAIProfiles}
            headlessEnabled={headlessEnabled}
            setHeadlessEnabled={setHeadlessEnabled}
            debateModeEnabled={debateModeEnabled}
            setDebateModeEnabled={setDebateModeEnabled}
            chatEndRef={chatEndRef}
            handleAutoApplyCode={handleAutoApplyCode}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            roles={roles}
            rolesLoading={rolesLoading}
            loadRoles={loadRoles}
            selectedRolePrompt={selectedRolePrompt}
            rolePromptLoading={rolePromptLoading}
            setRolePromptTick={setRolePromptTick}
            editFile_path={editFile_path}
            setEditFilePath={setEditFilePath}
            editInstruction={editInstruction}
            setEditInstruction={setEditInstruction}
            autoRepairEnabled={autoRepairEnabled}
            setAutoRepairEnabled={setAutoRepairEnabled}
            captureScreenshot={captureScreenshot}
            setCaptureScreenshot={setCaptureScreenshot}
            editLoading={editLoading}
            runEdit={runEdit}
            editResult={editResult}
            runApply={runApply}
            applyLoading={applyLoading}
            applyProgress={applyProgress}
            setEditResult={setEditResult}
            setApplyResult={setApplyResult}
            runRollback={runRollback}
            rollbackLoading={rollbackLoading}
            applyResult={applyResult}
            rolePromptNotifyRef={rolePromptNotifyRef}
            webAIProfilesLoading={webAIProfilesLoading}
            newProfileName={newProfileName}
            setNewProfileName={setNewProfileName}
            newProfilePlatform={newProfilePlatform}
            setNewProfilePlatform={setNewProfilePlatform}
            handleCreateProfile={handleCreateProfile}
            handleDeleteProfile={handleDeleteProfile}
            loadWebAIProfiles={loadWebAIProfiles}
            pushNotice={pushNotice}
            diffContent={diffContent}
            diffLoading={diffLoading}
            health={health}
            pingDaemon={pingDaemon}
          />
        </Suspense>

        {activeModal && <GlassmorphicModal modal={activeModal} />}
      </div>
    </div>
  );
}
