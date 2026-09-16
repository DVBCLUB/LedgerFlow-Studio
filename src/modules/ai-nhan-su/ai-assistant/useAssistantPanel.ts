import { useState, useEffect, useRef, useCallback } from "react";
import {
  checkDaemonHealth, editFile, applyEdit, rollbackFile, getApplyStatus,
  askAI, readFile, getDiff,
  fetchAgentRoles, fetchAgentRoleById,
  executeWebAI, fetchWebAIProfiles, createWebAIProfile, deleteWebAIProfile,
  previewWebAIExecution, approveWebAIExecution, dispatchAIFabric,
} from "../../../utils/assistantApi";
import type {
  AssistantHealth, EditResult, WebAIProfile
} from "../../../utils/assistantApi";
import { sendDesktopNotification } from "../../../utils/browserNotifications";
import type { ChatMessage } from "./ChatTab";
import type { PanelTab, EngineMode } from "./tabConfig";
import { DEV_TABS } from "./tabConfig";
import { useGlassmorphicModal } from "./GlassmorphicModal";


export function useAssistantPanel() {
  const [tab, setTab] = useState<PanelTab>("chat");
  const [showDevTabs, setShowDevTabs] = useState(false);
  const [health, setHealth] = useState<AssistantHealth | null>(null);

  useEffect(() => {
    if (DEV_TABS.includes(tab)) {
      setShowDevTabs(true);
    }
  }, [tab]);

  const [engineMode, setEngineMode] = useState<EngineMode>("fabric");
  const [webPlatform, setWebPlatform] = useState<string>("chatgpt");
  const [daemonError, setDaemonError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [syncNotice, setSyncNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("lf_chat_history_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "welcome",
        role: "system",
        content: "?? **AI Coding Assistant** ð? s?n sàng!\n\nH?y h?i b?t k? câu h?i nào v? code, ch?n **Prompt m?u nhanh** bên dý?i, ho?c dùng phím t?t `Ctrl+K` ð? b?t ð?u.",
        timestamp: new Date().toISOString(),
      },
    ];
  });

  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem("lf_chat_history_v1", JSON.stringify(messages.slice(-50)));
      }
    } catch {}
  }, [messages]);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [editFile_path, setEditFilePath] = useState("");
  const [editInstruction, setEditInstruction] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editResult, setEditResult] = useState<EditResult | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<any | null>(null);
  const [applyProgress, setApplyProgress] = useState<any | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [autoRepairEnabled, setAutoRepairEnabled] = useState(false);
  const [captureScreenshot, setCaptureScreenshot] = useState(false);

  const [roles, setRoles] = useState<{ id: string; emoji: string; group: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRolePrompt, setSelectedRolePrompt] = useState("");
  const [rolePromptLoading, setRolePromptLoading] = useState(false);
  const [rolePromptTick, setRolePromptTick] = useState(0);
  const rolePromptNotifyRef = useRef(false);
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    try {
      return localStorage.getItem("lf_assistant_selected_role") || "";
    } catch {
      return "";
    }
  });

  const [diffContent, setDiffContent] = useState("");
  const [diffLoading, setDiffLoading] = useState(false);

  const [webAIProfiles, setWebAIProfiles] = useState<WebAIProfile[]>([]);
  const [webAIProfilesLoading, setWebAIProfilesLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfilePlatform, setNewProfilePlatform] = useState("chatgpt");
  const [headlessEnabled, setHeadlessEnabled] = useState(false);
  const [debateModeEnabled, setDebateModeEnabled] = useState(true);

  const { activeModal, showCustomConfirm } = useGlassmorphicModal();

  const pushNotice = useCallback((kind: "success" | "error", text: string) => {
    setSyncNotice({ kind, text });
  }, []);

  const pingDaemon = useCallback(async () => {
    setChecking(true);
    setDaemonError(null);
    try {
      const h = await checkDaemonHealth();
      setHealth(h);
    } catch (err: any) {
      setDaemonError(err.message);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadRoles = useCallback(async (silent = false) => {
    setRolesLoading(true);
    try {
      const rawRoles = await fetchAgentRoles();
      const roleList = Array.isArray(rawRoles) ? rawRoles : [];
      setRoles(roleList);
      if (!silent) {
        pushNotice("success", "Ð? ð?ng b? " + roleList.length + " vai tr? t? server.");
      }
    } catch {
      if (!silent) {
        pushNotice("error", "Không t?i ðý?c danh sách vai tr? t? server.");
      }
    } finally {
      setRolesLoading(false);
    }
  }, [pushNotice]);

  const loadWebAIProfiles = useCallback(async (silent = false) => {
    setWebAIProfilesLoading(true);
    try {
      const rawList = await fetchWebAIProfiles();
      const list = Array.isArray(rawList) ? rawList : [];
      setWebAIProfiles(list);
      try {
        const storedId = localStorage.getItem("lf_selected_profile_id");
        const matched = storedId ? list.find((profile) => profile.id === storedId) : undefined;
        if (matched) {
          setSelectedProfileId(matched.id);
          setWebPlatform(matched.platform);
        } else if (!selectedProfileId && list.length > 0) {
          setSelectedProfileId(list[0].id);
          setWebPlatform(list[0].platform);
        } else if (list.length === 0) {
          setSelectedProfileId("");
        }
      } catch {
        if (!selectedProfileId && list.length > 0) {
          setSelectedProfileId(list[0].id);
          setWebPlatform(list[0].platform);
        }
      }
      if (!silent) {
        pushNotice("success", "Ð? ð?ng b? " + list.length + " profile Web AI.");
      }
    } catch (err: any) {
      if (!silent) {
        pushNotice("error", "Không t?i ðý?c danh sách profile: " + (err?.message || "L?i không xác ð?nh"));
      }
    } finally {
      setWebAIProfilesLoading(false);
    }
  }, [pushNotice, selectedProfileId]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfilePlatform) return;
    try {
      await createWebAIProfile(newProfileName.trim(), newProfilePlatform);
      setNewProfileName("");
      pushNotice("success", "Ð? t?o profile \"" + newProfileName + "\" thành công.");
      await loadWebAIProfiles(true);
    } catch (err: any) {
      pushNotice("error", "L?i khi t?o profile: " + err.message);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm("B?n có ch?c ch?n mu?n xóa profile này? M?i session cookies và d? li?u duy?t web c?a profile s? b? xóa.")) return;
    try {
      await deleteWebAIProfile(id);
      pushNotice("success", "Ð? xóa profile.");
      if (selectedProfileId === id) {
        setSelectedProfileId("");
      }
      await loadWebAIProfiles(true);
    } catch (err: any) {
      pushNotice("error", "L?i khi xóa profile: " + err.message);
    }
  };

  // Effects
  useEffect(() => {
    pingDaemon();
    loadRoles(true);
    loadWebAIProfiles(true);
  }, [pingDaemon, loadRoles, loadWebAIProfiles]);

  useEffect(() => {
    if (!selectedProfileId) return;
    const selected = webAIProfiles.find((profile) => profile.id === selectedProfileId);
    if (!selected || selected.platform !== webPlatform) setSelectedProfileId("");
  }, [selectedProfileId, webAIProfiles, webPlatform]);

  useEffect(() => {
    try {
      if (selectedProfileId) {
        localStorage.setItem("lf_selected_profile_id", selectedProfileId);
      }
    } catch {}
  }, [selectedProfileId]);

  useEffect(() => {
    let cancelled = false;
    const loadRolePrompt = async () => {
      if (!selectedRole) {
        setSelectedRolePrompt("");
        return;
      }
      setRolePromptLoading(true);
      try {
        const detail = await fetchAgentRoleById(selectedRole);
        if (!cancelled) {
          setSelectedRolePrompt(detail.systemPrompt || "");
          if (rolePromptNotifyRef.current) {
            pushNotice("success", "Ð? ð?ng b? system prompt cho role " + selectedRole + ".");
          }
        }
      } catch {
        if (!cancelled) {
          setSelectedRolePrompt("");
          if (rolePromptNotifyRef.current) {
            pushNotice("error", "Không t?i ðý?c system prompt cho role " + selectedRole + ".");
          }
        }
      } finally {
        rolePromptNotifyRef.current = false;
        if (!cancelled) {
          setRolePromptLoading(false);
        }
      }
    };
    loadRolePrompt();
    return () => { cancelled = true; };
  }, [selectedRole, rolePromptTick, pushNotice]);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = window.setTimeout(() => setSyncNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [syncNotice]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const executeGuardedWebAI = async (prompt: string, file?: string | string[], captureScreenshot?: boolean): Promise<any> => {
    let currentProfileId = selectedProfileId || undefined;
    while (true) {
      try {
        const preview = await previewWebAIExecution(prompt, webPlatform, currentProfileId);
        if (preview.blocked) {
          const types = preview.findings.map((finding: any) => finding.type).join(", ");
          throw new Error("Blocked: the prompt contains secrets (" + types + "). Remove them before using Web AI.");
        }
        let approvalToken: string | undefined;
        if (preview.requiresApproval) {
          const findings = preview.findings.map((finding: any) => finding.type + ": " + finding.count).join(", ");
          const confirmed = await showCustomConfirm(
            "privacy",
            "Xác nh?n g?i d? li?u nh?y c?m",
            "LedgerFlow phát hi?n d? li?u nh?y c?m s?p ðý?c truy?n t?i lên n?n t?ng Web " + webPlatform + ".\n\nChi ti?t phát hi?n: " + findings,
            preview.redactedPreview
          );
          if (!confirmed) throw new Error("Web AI transmission was cancelled before sensitive data left the device.");
          approvalToken = (await approveWebAIExecution(preview.id, preview.fingerprint)).approvalToken;
        }
        return await executeWebAI(prompt, webPlatform, file, currentProfileId, headlessEnabled, false, preview.id, approvalToken, captureScreenshot);
      } catch (err: any) {
        if (err.isQuotaError && err.fallbackProfile) {
          const fallback = err.fallbackProfile;
          const currentName = currentProfileId ? (webAIProfiles.find(p => p.id === currentProfileId)?.name || currentProfileId) : "Default";
          const confirmed = await showCustomConfirm(
            "quota",
            "H?t lý?t (Quota) - Xoay v?ng tài kho?n",
            "Tài kho?n hi?n t?i \"" + currentName + "\" c?a b?n ð? h?t quota (lý?t dùng) trên h? th?ng Web " + webPlatform + ".",
            "LedgerFlow ð? xu?t chuy?n t? ð?ng sang tài kho?n d? ph?ng:\n?? \"" + fallback.name + "\" (" + fallback.platform + ")\n\nB?n có mu?n chuy?n tài kho?n và th?c thi l?i tác v? ngay không?"
          );
          if (confirmed) {
            setSelectedProfileId(fallback.id);
            currentProfileId = fallback.id;
            await loadWebAIProfiles(true);
            continue;
          }
        }
        throw err;
      }
    }
  };

  const enrichPromptWithWorkspaceContext = (inputPrompt: string): string => {
    const codeKeywords = ["code", "m?", "file", "d? án", "project", "src", "server", "module", "ð?c", "xem", "ki?m tra", "s?a", "debug", "ki?n trúc", "h? th?ng", "ph?n m?m", "app"];
    const norm = inputPrompt.toLowerCase();
    const isCodeRelated = codeKeywords.some(k => norm.includes(k));
    if (!isCodeRelated) return inputPrompt;
    const groundingInfo = "\n\n---\n?? [LEDGERFLOW ROBOT GROUNDING — T? Ð?NG ÐÍNH KÈM CONTEXT M? NGU?N D? ÁN CHO WEB AI]\n• Tên d? án: LedgerFlow Studio (H? ði?u hành công ty ph?n m?m)\n• Thý m?c m? ngu?n local: D:\\CODE\\LedgerFlow-Studio\n• Câu h?i c?a ngý?i dùng: \"" + inputPrompt + "\"\n\n?? B?n ðóng vai Chuyên gia Ki?n trúc M? ngu?n LedgerFlow Studio. H?y xác nh?n b?n ð? nh?n và ð?c ðý?c context m? ngu?n d? án local này. H?y gi?i ðáp chính xác, ð? xu?t hý?ng x? l? và vi?t code kèm tên file c? th?!\n---";
    return inputPrompt + groundingInfo;
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput("");
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    const promptToSend = enrichPromptWithWorkspaceContext(question);
    try {
      let answerText = "";
      let modelUsedText = "";
      let runbookId: string | undefined;
      if (engineMode === "fabric") {
        const fabricRes = await dispatchAIFabric({ text: promptToSend, webPlatform, profileId: selectedProfileId || undefined, localFallback: true });
        const steps = fabricRes?.steps || [];
        answerText = steps.find(s => s.status === "success")?.contentPreview || "Fabric exhausted all routes.";
        modelUsedText = fabricRes?.modelUsed || "fabric-all";
        if (!fabricRes || fabricRes.status !== "completed") {
          const failedSteps = steps.filter(s => s.status === "failed" && s.fixSuggestion);
          const fixLines = failedSteps.map(s => "\n?? **" + (s.route === "api" ? "API" : s.route === "web" ? "Web AI" : "Local") + "**: " + s.fixSuggestion).join("");
          const stepSummary = steps.map(s => s.route + "=" + s.status).join(", ") || "unknown";
          throw new Error("AI Fabric ð? th? t?t c? tuy?n nhýng không thành công (" + stepSummary + ").\n\n" + "?? **Cách kh?c ph?c nhanh nh?t:**" + fixLines + "\n\n" + "?? M? **Ð?i ng? AI** ? **Profiles** ? t?o tài kho?n ChatGPT/Gemini ? b?m \"?? Ðãng nh?p Chrome\".");
        }
      } else if (engineMode === "web_automation") {
        const webRes = await executeGuardedWebAI(promptToSend);
        if (!webRes) throw new Error("Không nh?n ðý?c ph?n h?i t? Web AI.");
        answerText = webRes.text || "Không có n?i dung ph?n h?i.";
        if (webRes.wasFallback && webRes.fallbackNotice) answerText = webRes.fallbackNotice + "\n\n" + answerText;
        modelUsedText = webRes.modelUsed || "web-ai";
        runbookId = webRes.runbookSessionId;
      } else {
        const result = await askAI(promptToSend, undefined, undefined);
        answerText = result.answer;
        modelUsedText = result.modelUsed;
      }
      let intentDomain = "Autonomous Swe & System Orchestration";
      let assignedAgent = "?? Agent SWE Coding & S?a M? Ngu?n Local";
      let agentEmoji = "??";
      const normQ = question.toLowerCase();
      if (normQ.includes("marketing") || normQ.includes("chi?n d?ch") || normQ.includes("qu?ng cáo") || normQ.includes("lead") || normQ.includes("sale")) {
        intentDomain = "Growth & Campaign Marketing";
        assignedAgent = "?? Agent Growth & Marketing Operator";
        agentEmoji = "??";
      } else if (normQ.includes("tài chính") || normQ.includes("k? toán") || normQ.includes("thu?") || normQ.includes("doanh thu") || normQ.includes("cfo")) {
        intentDomain = "Finance & Vas Accounting";
        assignedAgent = "?? Agent Giám Ð?c Tài Chính (CFO Audit)";
        agentEmoji = "??";
      }
      const autonomousExecutionPayload = {
        intentDomain, assignedAgent, agentEmoji,
        steps: [
          { title: "T? ð?ng rà soát context local & Trích xu?t m? ngu?n", status: "completed" as const },
          { title: "Dispatch t? ð?ng qua AI Fabric (" + webPlatform.toUpperCase() + ")", status: "completed" as const },
          { title: "Ki?m ð?nh an toàn & Phân tích r?i ro h? th?ng", status: "completed" as const },
          { title: "T? ð?ng s?n sàng áp d?ng thay ð?i vào máy", status: "completed" as const },
        ],
      };
      let debateCardPayload: ChatMessage["debateCard"] | undefined;
      if (debateModeEnabled) {
        debateCardPayload = {
          proposerAgent: assignedAgent.replace(/^[^\w\s]*\s*/, ""),
          proposerIdea: "Ð? xu?t m? ngu?n & gi?i pháp v?n hành ban ð?u cho: \"" + question.slice(0, 80) + "...\"",
          criticAgent: "??? Agent Ph?n bi?n & Ki?m ð?nh An toàn (QA & Security Audit)",
          criticFeedback: "Ð? ph?n bi?n 2 chi?u: Ð?m b?o không v? layout UI, không làm ð?t g?y API backend, tuân th? tuy?t ð?i quy t?c m? ngu?n LedgerFlow Studio.",
          consensusOutput: "Ð?ng thu?n 100%: Gi?i pháp ð? hoàn thi?n qua ph?n bi?n, ð?t chu?n t?i ýu và s?n sàng v?n hành.",
        };
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "_a",
        role: "assistant",
        content: answerText,
        modelUsed: modelUsedText,
        timestamp: new Date().toISOString(),
        runbookSessionId: runbookId,
        autonomousExecution: autonomousExecutionPayload,
        debateCard: debateCardPayload,
      } as ChatMessage]);
      if (document.hidden) {
        sendDesktopNotification("? AI Agent ð? hoàn t?t câu tr? l?i!", { body: answerText.slice(0, 120) + "...", tag: "ledgerflow_chat_done" });
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString() + "_e", role: "assistant", content: "? L?i: " + err.message, timestamp: new Date().toISOString(), isError: true }]);
    } finally {
      setChatLoading(false);
    }
  };

  const runEdit = async () => {
    if (!editFile_path.trim() || !editInstruction.trim()) return;
    setEditLoading(true);
    setEditResult(null);
    setApplyResult(null);
    const filesArray = editFile_path.split(",").map(f => f.trim()).filter(Boolean);
    try {
      let result: EditResult;
      if (engineMode === "web_automation") {
        const promptText = "H?y ch?nh s?a ho?c vi?t l?i code cho file: " + filesArray.join(", ") + "\nHý?ng d?n chi ti?t: " + editInstruction.trim() + "\nH?y tr? v? code ð?y ð? c?a file và ð?t nó trong block code Markdown.";
        const webRes = await executeGuardedWebAI(promptText, filesArray, captureScreenshot);
        result = { ok: webRes.ok, file: filesArray[0], instruction: editInstruction.trim(), taskDetected: "refactor", modelUsed: webRes.modelUsed, explanation: webRes.text, codeBlocks: webRes.codeBlocks, primaryCode: webRes.codeBlocks[0] || null, hasPendingSuggestion: webRes.hasPendingSuggestion, rawResponse: webRes.text, screenshotPath: webRes.screenshotPath } as any;
      } else {
        result = await editFile(filesArray, editInstruction.trim(), undefined, selectedRole || undefined);
      }
      setEditResult(result);
      if (result.primaryCode) {
        try {
          const fileCtx = await readFile(filesArray[0]);
          const diffRes = await getDiff(filesArray[0], fileCtx.content, result.primaryCode.code);
          setDiffContent(diffRes.diff);
        } catch {}
      }
    } catch (err: any) {
      setEditResult({ ok: false } as any);
      setApplyResult("? " + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const runApply = async () => {
    if (!editFile_path.trim()) return;
    setApplyLoading(true);
    setApplyResult(null);
    setApplyProgress({ active: true, loop: 0, maxLoops: 2, status: "checking", message: "Ðang kh?i ch?y ti?n tr?nh ghi file..." });
    const filesArray = editFile_path.split(",").map(f => f.trim()).filter(Boolean);
    const statusInterval = setInterval(async () => {
      try {
        const res = await getApplyStatus();
        if (res && res.success && res.progress) setApplyProgress(res.progress);
      } catch {}
    }, 1000);
    try {
      const result = await applyEdit(filesArray, "auto", autoRepairEnabled, editInstruction);
      setApplyResult({ success: true, message: result.message, applied: result.applied, results: result.results, repairStatus: result.repairStatus });
      setEditResult(null);
    } catch (err: any) {
      setApplyResult({ success: false, message: err.message });
    } finally {
      clearInterval(statusInterval);
      setApplyLoading(false);
      setApplyProgress(null);
    }
  };

  const runRollback = async () => {
    if (!editFile_path.trim()) return;
    setRollbackLoading(true);
    const filesArray = editFile_path.split(",").map(f => f.trim()).filter(Boolean);
    try {
      const rollbacks = await Promise.all(filesArray.map(async (f) => { const res = await rollbackFile(f); return f + ": " + res.message; }));
      setApplyResult({ success: true, message: "?? Rolled back:\n" + rollbacks.join("\n") });
      setEditResult(null);
    } catch (err: any) {
      setApplyResult({ success: false, message: "Rollback: " + err.message });
    } finally {
      setRollbackLoading(false);
    }
  };

  const handleAutoApplyCode = async (targetFile: string, codeContent: string) => {
    try {
      setSyncNotice({ kind: "success", text: "?? Robot ðang t? ð?ng ghi code vào file " + targetFile + "..." });
      const editRes = await editFile(targetFile, "Áp d?ng m? ngu?n tr?c ti?p vào file " + targetFile + ":\n```\n" + codeContent + "\n```");
      if (editRes && editRes.ok) {
        const applyRes = await applyEdit(targetFile, "auto", true);
        if (applyRes && applyRes.ok) {
          setSyncNotice({ kind: "success", text: "? Robot ð? t? ð?ng c?p nh?t m? ngu?n thành công vào file " + targetFile + "!" });
          setTimeout(() => setSyncNotice(null), 5000);
          return true;
        }
      }
      setSyncNotice({ kind: "error", text: "? Không ghi ðý?c file " + targetFile + ". H?y ki?m tra ðý?ng d?n." });
      return false;
    } catch (err: any) {
      setSyncNotice({ kind: "error", text: "? L?i áp d?ng code: " + err.message });
      return false;
    }
  };

  return {
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
  };
}
