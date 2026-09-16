/**
 * GraphicRobotControl.tsx
 * ============================================================
 * Canva/Photopea Graphic Design Robot Control.
 */

import React, { useState } from 'react';
import { Play, Loader2, CheckCircle, AlertCircle, FileText, Eye } from 'lucide-react';
import { createGraphicPlan, previewGraphicPlan, executeRobotPlan, type GraphicSpec, type RobotExecutionPlan } from '../../../utils/robotFreeToolApi';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[9px] font-bold text-text-tertiary uppercase">{label}</label>
      {children}
    </div>
  );
}

interface GraphicRobotControlProps {
  onExecutionResult?: (entry: { toolType: string; planSummary: string; result: { success: boolean; output: string; error?: string } }) => void;
}

export default function GraphicRobotControl({ onExecutionResult }: GraphicRobotControlProps) {
  const [spec, setSpec] = useState<GraphicSpec>({ title: 'LedgerFlow Banner', bgColor: '#0f172a', textColor: '#38bdf8' });
  const [plan, setPlan] = useState<RobotExecutionPlan | null>(null);
  const [planPreview, setPlanPreview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; output: string; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlan = async () => {
    setLoading(true); setError(null); setPlan(null); setPlanPreview(null); setResult(null);
    try { const p = await createGraphicPlan(spec); if (p) setPlan(p); else setError('Failed to create graphic plan');
    } catch (e: any) { setError(e.message || 'Error creating plan'); }
    setLoading(false);
  };

  const handlePreviewPlan = async () => {
    setLoading(true); setError(null); setPlanPreview(null);
    try { const s = await previewGraphicPlan(spec); if (s) setPlanPreview(s); else setError('Failed to preview plan');
    } catch (e: any) { setError(e.message || 'Error previewing plan'); }
    setLoading(false);
  };

  const handleExecute = async () => {
    if (!plan) return;
    setExecuting(true); setError(null); setResult(null);
    try {
      const r = await executeRobotPlan(plan);
      if (r) {
        setResult(r);
        onExecutionResult?.({ toolType: 'graphic', planSummary: `Graphic: ${spec.title}`, result: r });
      } else {
        setError('Failed to execute robot');
      }
    } catch (e: any) { setError(e.message || 'Error executing robot'); }
    setExecuting(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Title">
          <input type="text" value={spec.title} onChange={e => setSpec(s => ({ ...s, title: e.target.value }))}
            className="w-full mt-0.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white" />
        </FormField>
        <FormField label="Background Color">
          <input type="color" value={spec.bgColor} onChange={e => setSpec(s => ({ ...s, bgColor: e.target.value }))}
            className="w-full mt-0.5 h-7 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer" />
        </FormField>
        <FormField label="Text Color">
          <input type="color" value={spec.textColor} onChange={e => setSpec(s => ({ ...s, textColor: e.target.value }))}
            className="w-full mt-0.5 h-7 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer" />
        </FormField>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={handleCreatePlan} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition disabled:opacity-50 cursor-pointer">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Create Plan
        </button>
        <button type="button" onClick={handlePreviewPlan} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 hover:border-indigo-500 text-text-secondary text-[10px] font-bold transition disabled:opacity-50 cursor-pointer">
          <Eye className="h-3 w-3" />
          Preview Plan
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
            <p>Tool: {plan.toolType}</p>
            <p>Output: {plan.outputPath}</p>
            <p>Estimated Duration: {plan.estimatedDurationSec}s</p>
          </div>
          <button type="button" onClick={handleExecute} disabled={executing}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition disabled:opacity-50 cursor-pointer">
            {executing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Execute Robot
          </button>
        </div>
      )}

      {planPreview && (
        <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary mb-2">
            <FileText className="h-3 w-3" />
            Graphic Design Plan Preview
          </div>
          <pre className="text-[8px] text-slate-400 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
            {JSON.stringify(planPreview, null, 2).slice(0, 2000)}
          </pre>
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

