/**
 * BlenderRobotControl.tsx
 * ============================================================
 * Blender 3D Character Modeling Robot Control.
 */

import React, { useState } from 'react';
import { Play, Loader2, CheckCircle, AlertCircle, FileText, Eye } from 'lucide-react';
import { createBlenderPlan, previewBlenderScript, executeRobotPlan, type BlenderSpec, type RobotExecutionPlan } from '../../../utils/robotFreeToolApi';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[9px] font-bold text-text-tertiary uppercase">{label}</label>
      {children}
    </div>
  );
}

interface BlenderRobotControlProps {
  onExecutionResult?: (entry: { toolType: string; planSummary: string; result: { success: boolean; output: string; error?: string } }) => void;
}

export default function BlenderRobotControl({ onExecutionResult }: BlenderRobotControlProps) {
  const [spec, setSpec] = useState<BlenderSpec>({
    characterName: 'HeroCharacter',
    archetype: 'humanoid',
    height: 1.7,
    headScale: 0.25,
    primaryColor: '#2196F3',
    secondaryColor: '#FF5722',
    metallic: 0.1,
    roughness: 0.6,
    exportFormat: 'glb',
    includeRig: true,
  });
  const [plan, setPlan] = useState<RobotExecutionPlan | null>(null);
  const [scriptPreview, setScriptPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; output: string; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlan = async () => {
    setLoading(true); setError(null); setPlan(null); setScriptPreview(null); setResult(null);
    try { const p = await createBlenderPlan(spec); if (p) setPlan(p); else setError('Failed to create Blender plan');
    } catch (e: any) { setError(e.message || 'Error creating plan'); }
    setLoading(false);
  };

  const handlePreviewScript = async () => {
    setLoading(true); setError(null); setScriptPreview(null);
    try { const script = await previewBlenderScript(spec); if (script) setScriptPreview(script); else setError('Failed to preview script');
    } catch (e: any) { setError(e.message || 'Error previewing script'); }
    setLoading(false);
  };

  const handleExecute = async () => {
    if (!plan) return;
    setExecuting(true); setError(null); setResult(null);
    try {
      const r = await executeRobotPlan(plan);
      if (r) {
        setResult(r);
        onExecutionResult?.({ toolType: 'blender', planSummary: `Blender: ${spec.characterName}`, result: r });
      } else {
        setError('Failed to execute robot');
      }
    } catch (e: any) { setError(e.message || 'Error executing robot'); }
    setExecuting(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Character Name">
          <input type="text" value={spec.characterName} onChange={e => setSpec(s => ({ ...s, characterName: e.target.value }))}
            className="w-full mt-0.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white" />
        </FormField>
        <FormField label="Archetype">
          <select value={spec.archetype} onChange={e => setSpec(s => ({ ...s, archetype: e.target.value as any }))}
            className="w-full mt-0.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white">
            <option value="humanoid">Humanoid</option>
            <option value="chibi_mascot">Chibi Mascot</option>
            <option value="cyber_robot">Cyber Robot</option>
            <option value="stylized_avatar">Stylized Avatar</option>
          </select>
        </FormField>
        <FormField label="Height">
          <input type="number" step="0.1" value={spec.height} onChange={e => setSpec(s => ({ ...s, height: Number(e.target.value) }))}
            className="w-full mt-0.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white" />
        </FormField>
        <FormField label="Head Scale">
          <input type="number" step="0.05" value={spec.headScale} onChange={e => setSpec(s => ({ ...s, headScale: Number(e.target.value) }))}
            className="w-full mt-0.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white" />
        </FormField>
        <FormField label="Primary Color">
          <input type="color" value={spec.primaryColor} onChange={e => setSpec(s => ({ ...s, primaryColor: e.target.value }))}
            className="w-full mt-0.5 h-7 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer" />
        </FormField>
        <FormField label="Secondary Color">
          <input type="color" value={spec.secondaryColor} onChange={e => setSpec(s => ({ ...s, secondaryColor: e.target.value }))}
            className="w-full mt-0.5 h-7 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer" />
        </FormField>
        <FormField label="Metallic">
          <input type="range" min="0" max="1" step="0.1" value={spec.metallic}
            onChange={e => setSpec(s => ({ ...s, metallic: Number(e.target.value) }))} className="w-full mt-0.5" />
        </FormField>
        <FormField label="Roughness">
          <input type="range" min="0" max="1" step="0.1" value={spec.roughness}
            onChange={e => setSpec(s => ({ ...s, roughness: Number(e.target.value) }))} className="w-full mt-0.5" />
        </FormField>
        <FormField label="Export Format">
          <select value={spec.exportFormat} onChange={e => setSpec(s => ({ ...s, exportFormat: e.target.value as any }))}
            className="w-full mt-0.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white">
            <option value="glb">GLB</option>
            <option value="gltf">GLTF</option>
            <option value="obj">OBJ</option>
            <option value="fbx">FBX</option>
          </select>
        </FormField>
        <div className="flex items-end">
          <label className="flex items-center gap-1.5 text-[10px] text-text-tertiary cursor-pointer">
            <input type="checkbox" checked={spec.includeRig} onChange={e => setSpec(s => ({ ...s, includeRig: e.target.checked }))} className="rounded" />
            Include Armature Rig
          </label>
        </div>
      </div>

    setExecuting(false);

      <div className="flex gap-2">
        <button type="button" onClick={handleCreatePlan} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition disabled:opacity-50 cursor-pointer">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Create Plan
        </button>
        <button type="button" onClick={handlePreviewScript} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 hover:border-indigo-500 text-text-secondary text-[10px] font-bold transition disabled:opacity-50 cursor-pointer">
          <Eye className="h-3 w-3" />
          Preview Script
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-rose-400 bg-rose-950/20 border border-rose-800/30 rounded-lg px-3 py-2">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      {plan && (
        <div className="rounded-lg border border-indigo-800/30 bg-indigo-950/15 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300">
            <CheckCircle className="h-3 w-3" />
            Plan Created: {plan.id}
          </div>
          <div className="text-[9px] text-text-tertiary space-y-0.5">
            <p>Output: {plan.outputPath}</p>
            <p>Estimated Duration: {plan.estimatedDurationSec}s</p>
            <p>Script File: {plan.scriptFile}</p>
          </div>
          <button type="button" onClick={handleExecute} disabled={executing}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition disabled:opacity-50 cursor-pointer">
            {executing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Execute Robot
          </button>
        </div>
      )}

      {scriptPreview && (
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary mb-2">
            <FileText className="h-3 w-3" />
            Python Script Preview
          </div>
          <pre className="text-[8px] text-slate-400 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
            {scriptPreview.slice(0, 2000)}
          </pre>
          {scriptPreview.length > 2000 && (
            <p className="text-[8px] text-slate-600 mt-1">... ({scriptPreview.length - 2000} more chars)</p>
          )}
        </div>
      )}

      {result && (
        <div className={`rounded-lg border p-3 ${result.success ? 'border-emerald-800/30 bg-emerald-950/15' : 'border-rose-800/30 bg-rose-950/15'}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold mb-1">
            {result.success ? (
              <><CheckCircle className="h-3 w-3 text-emerald-400" /><span className="text-emerald-300">Execution Successful</span></>
            ) : (
              <><AlertCircle className="h-3 w-3 text-rose-400" /><span className="text-rose-300">Execution Failed</span></>
            )}
          </div>
          <pre className="text-[9px] text-text-tertiary whitespace-pre-wrap font-mono max-h-32 overflow-auto">
            {result.output || result.error || 'No output'}
          </pre>
        </div>
      )}
    </div>
  );
}
