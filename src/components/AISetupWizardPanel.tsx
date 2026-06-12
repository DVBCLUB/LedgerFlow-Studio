import React, { useEffect, useState } from "react";
import AISetupWizard from "./AISetupWizard";
import { AIKeySummary, AIProviderDefinition, fetchAIKeys, fetchAIProviders } from "../utils/aiSettingsApi";

export default function AISetupWizardPanel() {
  const [providers, setProviders] = useState<AIProviderDefinition[]>([]);
  const [keys, setKeys] = useState<AIKeySummary[]>([]);
  const [message, setMessage] = useState("");

  async function reload() {
    const [nextProviders, nextKeys] = await Promise.all([fetchAIProviders(), fetchAIKeys()]);
    setProviders(nextProviders);
    setKeys(nextKeys);
  }

  useEffect(() => {
    reload().catch((err) => setMessage(`Không tải được Setup Wizard: ${err.message || err}`));
  }, []);

  if (!providers.length && !message) {
    return null;
  }

  return (
    <div className="mb-6">
      {message && (
        <div className="mb-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-xs font-bold text-amber-200">
          {message}
        </div>
      )}
      <AISetupWizard providers={providers} keys={keys} onChanged={reload} onMessage={setMessage} />
    </div>
  );
}
