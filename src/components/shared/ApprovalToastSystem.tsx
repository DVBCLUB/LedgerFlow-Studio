import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Bell, ArrowRight } from 'lucide-react';

interface PendingApproval {
  id: string;
  roleId: string;
  actionType: string;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

function playNotificationChime(isCritical: boolean = false) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCritical ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isCritical ? 880 : 587.33, ctx.currentTime); // A5 or D5
    osc.frequency.exponentialRampToValueAtTime(isCritical ? 440 : 880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Non-critical audio feedback fallback
  }
}

export default function ApprovalToastSystem() {
  const [activeAlert, setActiveAlert] = useState<PendingApproval | null>(null);
  const [responded, setResponded] = useState(false);

  useEffect(() => {
    // Listen for custom approval event or poll pending approvals
    const handleApprovalTrigger = (e: CustomEvent<PendingApproval>) => {
      if (e.detail) {
        setActiveAlert(e.detail);
        setResponded(false);
        playNotificationChime(e.detail.riskLevel === 'CRITICAL' || e.detail.riskLevel === 'HIGH');
      }
    };

    window.addEventListener('ai-approval-required' as any, handleApprovalTrigger as any);

    return () => {
      window.removeEventListener('ai-approval-required' as any, handleApprovalTrigger as any);
    };
  }, []);

  if (!activeAlert || responded) return null;

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch('/api/delegation/approval/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: activeAlert.id,
          status,
          reviewerNote: `Quick decision from Toast HUD (${status})`,
        }),
      });
    } catch {
      // Ignored
    } finally {
      setResponded(true);
      setTimeout(() => setActiveAlert(null), 1000);
    }
  };

  const isHighRisk = activeAlert.riskLevel === 'CRITICAL' || activeAlert.riskLevel === 'HIGH';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slide-up">
      <div
        className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl bg-slate-900/95 text-slate-100 ${
          isHighRisk
            ? 'border-rose-500/50 shadow-rose-500/20'
            : 'border-amber-500/50 shadow-amber-500/20'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isHighRisk
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isHighRisk
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {activeAlert.riskLevel} Risk Approval
              </span>
              <span className="text-[11px] text-slate-400">{activeAlert.roleId}</span>
            </div>

            <h4 className="text-xs font-bold text-slate-100 mt-1 truncate">{activeAlert.actionType}</h4>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{activeAlert.summary}</p>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleAction('REJECTED')}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Từ chối
              </button>
              <button
                onClick={() => handleAction('APPROVED')}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Phê duyệt ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
