/* Fetches and marks clinic staff notifications as read.
 * Feeds the header bell and the notifications page. */
import { cgs_api } from '../api/client';
import { Notification } from '../types';

let unreadInflight: Promise<number> | null = null;
let unreadCache: { value: number; at: number } | null = null;
const UNREAD_TTL_MS = 4000;

export class NotificationService {
  static async getNotifications(): Promise<Notification[]> {
    const list = await cgs_api.get<Notification[]>('/notifications');
    if (Array.isArray(list)) {
      return list;
    }
    return [];
  }

  static async markAsRead(id: string): Promise<Notification> {
    const updated = await cgs_api.patch<Notification>(`/notifications/${id}/read`);
    if (!updated || !updated.id) {
      throw new Error('Failed to mark notification as read.');
    }
    return updated;
  }

  static async markAllAsRead(): Promise<void> {
    await cgs_api.post('/notifications/read-all');
  }

  static async getUnreadCount(): Promise<number> {
    if (unreadCache && Date.now() - unreadCache.at < UNREAD_TTL_MS) {
      return unreadCache.value;
    }
    if (unreadInflight) return unreadInflight;
    unreadInflight = cgs_api
      .get<{ unreadCount: number }>('/notifications/unread-count')
      .then((res) => {
        const value = res && typeof res.unreadCount === 'number' ? res.unreadCount : 0;
        unreadCache = { value, at: Date.now() };
        return value;
      })
      .finally(() => {
        unreadInflight = null;
      });
    return unreadInflight;
  }
}
