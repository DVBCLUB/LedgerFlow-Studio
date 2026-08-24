export interface VoiceCommand { id: string; transcript: string; intent: string; confidence: number; action: string; status: 'executed' | 'pending_confirm' | 'rejected'; executedAt: string | null; delegatedTo: string | null; }
export interface VoiceCommandHistory { commands: VoiceCommand[]; accuracyPercent: number; totalCommandsToday: number; topIntents: { intent: string; count: number }[]; }
export interface VoiceCommandResult { success: boolean; commandId: string; transcript: string; intent: string; confidence: number; actionTaken: string; delegatedTo: string; responseText: string; completedAt: string; }

export function getVoiceCommandHistory(): VoiceCommandHistory {
  return {
    commands: [
      { id: 'vc_001', transcript: 'Xuat bao cao doanh thu tuan nay', intent: 'export_revenue_report', confidence: 0.97, action: 'EXPORT_WEEKLY_REVENUE', status: 'executed', executedAt: new Date(Date.now() - 30 * 60000).toISOString(), delegatedTo: 'ReportAgentSwarm' },
      { id: 'vc_002', transcript: 'Duyet chi 50 trieu cho nhom marketing', intent: 'approve_expense', confidence: 0.94, action: 'APPROVE_EXPENSE_50M', status: 'executed', executedAt: new Date(Date.now() - 120 * 60000).toISOString(), delegatedTo: 'FinanceAgent' },
      { id: 'vc_003', transcript: 'Lich hop voi Vingroup chieu nay luc 3 gio', intent: 'schedule_meeting', confidence: 0.91, action: 'CREATE_CALENDAR_EVENT', status: 'executed', executedAt: new Date(Date.now() - 180 * 60000).toISOString(), delegatedTo: 'CalendarAgent' },
      { id: 'vc_004', transcript: 'Chot deal voi cong ty Delta', intent: 'close_deal', confidence: 0.88, action: 'CLOSE_DEAL_DELTA', status: 'pending_confirm', executedAt: null, delegatedTo: 'SalesAgent' },
    ],
    accuracyPercent: 96.4,
    totalCommandsToday: 23,
    topIntents: [
      { intent: 'export_report', count: 8 },
      { intent: 'approve_expense', count: 6 },
      { intent: 'schedule_meeting', count: 5 },
      { intent: 'close_deal', count: 4 },
    ],
  };
}

export function processVoiceCommand(transcript: string, lang: string): VoiceCommandResult {
  const intents: Record<string, string> = {
    'bao cao': 'export_revenue_report',
    'duyet chi': 'approve_expense',
    'lich hop': 'schedule_meeting',
    'chot deal': 'close_deal',
  };
  const matchedKey = Object.keys(intents).find(k => transcript.toLowerCase().includes(k));
  const intent = matchedKey ? intents[matchedKey] : 'unknown_intent';
  const commandId = 'VC-' + Date.now().toString(36).toUpperCase();
  return {
    success: true,
    commandId,
    transcript,
    intent,
    confidence: 0.92,
    actionTaken: intent.toUpperCase().replace(/_/g, ' '),
    delegatedTo: intent.includes('report') ? 'ReportAgentSwarm' : intent.includes('expense') ? 'FinanceAgent' : 'GeneralAgent',
    responseText: 'Da thuc hien: "' + transcript + '". Ket qua se co trong 30 giay.',
    completedAt: new Date().toISOString(),
  };
}
