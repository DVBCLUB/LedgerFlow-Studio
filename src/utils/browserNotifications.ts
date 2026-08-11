/**
 * browserNotifications.ts
 * ============================================================
 * Utility to request permission and send native desktop/browser notifications
 * when autonomous background agent tasks complete.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendDesktopNotification(title: string, options?: { body?: string; icon?: string; tag?: string }): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body || 'Tác vụ AI nền đã hoàn tất thành công.',
        icon: options?.icon || '/icon.png',
        tag: options?.tag || 'ledgerflow_agent_notify',
      });
    } catch {
      // Fallback if browser blocks notification constructor
    }
  }
}
