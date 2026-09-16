import React, { useState, useEffect, useCallback } from 'react';
import { Zap, ShieldOff, AlertTriangle, Power, RotateCcw } from 'lucide-react';
import { fetchAgentRuntimeMetrics, setAgentRuntimeEmergencyStop } from '../../utils/assistantApi';

export default function EmergencyKillSwitchPanel() {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const metrics = await fetchAgentRuntimeMetrics();
      setEmergencyActive(metrics?.emergencyStop ?? false);
    } catch { /* daemon offline */ }
  }, []);

  useEffect(() => {
    void checkStatus();
    const id = setInterval(() => void checkStatus(), 10000);
    return () => clearInterval(id);
  }, [checkStatus]);

  const handleToggleEmergencyStop = async () => {
    if (!emergencyActive && !showConfirm) { setShowConfirm(true); return; }
    setLoading(true);
    try {
      const newState = !emergencyActive;
      await setAgentRuntimeEmergencyStop(newState, reason || undefined);
      setEmergencyActive(newState);
      setShowConfirm(false);
      setReason('');
    } catch (err) { console.error('Failed to toggle emergency stop:', err); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await setAgentRuntimeEmergencyStop(false);
      setEmergencyActive(false);
      setShowConfirm(false);
      setReason('');
    } catch (err) { console.error('Failed to reset emergency stop:', err); }
    finally { setLoading(false); }
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
      emergencyActive
        ? 'border-red-500/50 bg-gradient-to-br from-red-950/40 via-slate-900 to-red-950/30'
        : 'border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/80'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${
            emergencyActive
              ? 'bg-red-500/30 border-red-500/50 text-red-400 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}>
            {emergencyActive ? <ShieldOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-xs font-black tracking-tight text-white uppercase flex items-center gap-2">
              <span>🛡️ Emergency Kill-Switch</span>
              {emergencyActive && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 text-[9px] border border-red-500/40 animate-pulse">ACTIVE</span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {emergencyActive ? 'Tất cả Agentic Loops đã bị dừng khẩn cấp' : 'Dừng khẩn cấp toàn bộ AI Agents nếu phát hiện hành vi bất thường'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {emergencyActive ? (
            <button type="button" onClick={handleReset} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer shadow-md transition-all disabled:opacity-50">
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Khôi Phục
            </button>
          ) : (
            <button type="button" onClick={handleToggleEmergencyStop} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-md transition-all hover:shadow-rose-500/30">
              <Power className="h-3.5 w-3.5" /> Dừng Khẩn Cấp
            </button>
          )}
        </div>
      </div>
      {showConfirm && (
        <div className="mt-4 p-4 rounded-2xl border border-red-500/30 bg-red-950/20 space-y-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-300">Xác nhận Dừng Khẩn Cấp</p>
              <p className="text-xs text-slate-400 mt-1">Hành động này sẽ dừng toàn bộ AI Agent đang chạy.</p>
            </div>
          </div>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Lý do dừng khẩn cấp (tùy chọn)..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-red-500/50" />
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer">Hủy</button>
            <button type="button" onClick={handleToggleEmergencyStop} disabled={loading}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
              {loading ? 'Đang xử lý...' : 'Xác nhận Dừng'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
