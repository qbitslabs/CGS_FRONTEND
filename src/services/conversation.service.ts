/* WhatsApp thread list, messages, send, and sidebar unread badge.
 * Badge payload is unseen / critical / handoff counts only. */
import { cgs_api } from '../api/client';
import { Conversation, ConversationState, Message } from '../types';

export class ConversationService {
  static async getConversations(
    filterState: ConversationState | 'All' = 'All',
    search: string = '',
    doctorId?: string
  ): Promise<Conversation[]> {
    const data = await cgs_api.get<Conversation[]>('/conversations', {
      state: filterState !== 'All' ? filterState : undefined,
      search: search || undefined,
      doctorId: doctorId && doctorId !== 'All' ? doctorId : undefined,
    });

    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }

  static async getSidebarBadge(): Promise<{ count: number; tone: 'normal' | 'handoff' | 'critical' }> {
    const data = await cgs_api.get<{ count?: number; tone?: 'normal' | 'handoff' | 'critical' }>(
      '/conversations/badge'
    );
    const count = typeof data?.count === 'number' ? data.count : 0;
    const tone = data?.tone === 'critical' || data?.tone === 'handoff' ? data.tone : 'normal';
    return { count, tone };
  }

  static async getConversationById(id: string): Promise<Conversation> {
    const conv = await cgs_api.get<Conversation>(`/conversations/${id}`);
    if (!conv || !conv.id) {
      throw new Error(`Conversation with ID ${id} not found.`);
    }
    return conv;
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    const msgs = await cgs_api.get<Message[]>(`/conversations/${conversationId}/messages`);
    if (Array.isArray(msgs)) {
      return msgs;
    }
    return [];
  }

  static async sendMessage(
    conversationId: string,
    text: string,
    senderName: string
  ): Promise<Message> {
    const msg = await cgs_api.post<Message>(`/conversations/${conversationId}/messages`, {
      content: text,
      senderType: 'USER',
      senderName,
    });

    if (!msg || !msg.id) {
      throw new Error('Failed to send message.');
    }
    return msg;
  }

  static async simulatePatientMessage(
    conversationId: string,
    text: string
  ): Promise<{ patientMessage: Message; aiMessage: Message | null; toolCalls: unknown[] }> {
    const data = await cgs_api.post<{
      patientMessage: Message;
      aiMessage: Message | null;
      toolCalls: unknown[];
    }>(`/conversations/${conversationId}/simulate-inbound`, {
      content: text,
    });

    if (!data?.patientMessage?.id) {
      throw new Error('Failed to send patient message.');
    }
    return data;
  }

  static async takeOver(id: string, _staffName?: string): Promise<Conversation> {
    const updated = await cgs_api.patch<Conversation>(`/conversations/${id}/state`, {
      state: 'HUMAN_ACTIVE',
    });
    if (!updated || !updated.id) {
      throw new Error('Failed to take over conversation.');
    }
    return updated;
  }

  static async takeoverConversation(id: string): Promise<Conversation> {
    return this.takeOver(id);
  }

  static async returnToAi(id: string): Promise<Conversation> {
    const updated = await cgs_api.patch<Conversation>(`/conversations/${id}/state`, {
      state: 'AI_ACTIVE',
    });
    if (!updated || !updated.id) {
      throw new Error('Failed to return conversation to AI.');
    }
    return updated;
  }

  static async closeConversation(id: string): Promise<Conversation> {
    const updated = await cgs_api.patch<Conversation>(`/conversations/${id}/state`, {
      state: 'CLOSED',
    });
    if (!updated || !updated.id) {
      throw new Error('Failed to close conversation.');
    }
    return updated;
  }

  static async markAsRead(id: string): Promise<void> {
    await cgs_api.patch(`/conversations/${id}/read`);
  }

  static async addNote(id: string, note: string): Promise<Conversation> {
    const updated = await cgs_api.patch<Conversation>(`/conversations/${id}`, {
      internalNotes: note,
    });
    if (!updated || !updated.id) {
      throw new Error('Failed to update internal notes.');
    }
    return updated;
  }
}
