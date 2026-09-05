import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Conversation, Message, UserSummary, Group } from '../models/models';
import { Observable, tap, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private api = inject(ApiService);

  conversations = signal<Conversation[]>([]);
  activeConversation = signal<Conversation | null>(null);
  activeMessages = signal<Message[]>([]);
  contacts = signal<UserSummary[]>([]);
  groups = signal<Group[]>([]);
  isLoadingMessages = signal<boolean>(false);
  activeTypingUser = signal<string | null>(null);

  totalUnreadCount = computed(() => 
    this.conversations().reduce((acc, c) => acc + (c.unreadCount || 0), 0)
  );

  fetchConversations(): Observable<any> {
    return this.api.get<Conversation[]>('conversations').pipe(
      tap(res => {
        if (res.success && res.data) {
          this.conversations.set(res.data);
        }
      })
    );
  }

  fetchContacts(search?: string): Observable<any> {
    return this.api.get<UserSummary[]>('contacts', { search }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.contacts.set(res.data);
        }
      })
    );
  }

  fetchGroups(): Observable<any> {
    return this.api.get<Group[]>('groups').pipe(
      tap(res => {
        if (res.success && res.data) {
          this.groups.set(res.data);
        }
      })
    );
  }

  selectConversation(conv: Conversation) {
    this.activeConversation.set(conv);
    this.fetchMessages(conv.id);
    this.markAsRead(conv.id);
  }

  startDirectChat(recipientUserId: string): Observable<any> {
    return this.api.post<Conversation>('conversations', { recipientUserId }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.selectConversation(res.data);
          this.fetchConversations().subscribe();
        }
      })
    );
  }

  fetchMessages(conversationId: string): Observable<any> {
    this.isLoadingMessages.set(true);
    return this.api.get<Message[]>(`conversations/${conversationId}/messages`).pipe(
      tap(res => {
        this.isLoadingMessages.set(false);
        if (res.success && res.data) {
          this.activeMessages.set(res.data);
        }
      })
    );
  }

  sendMessage(content: string, type: any = 'TEXT', replyToId?: string, attachmentIds: string[] = []): Observable<any> {
    const active = this.activeConversation();
    if (!active) return of(null);

    return this.api.post<Message>('messages', {
      conversationId: active.id,
      content,
      type,
      replyToMessageId: replyToId,
      attachmentIds
    }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.activeMessages.update(msgs => [...msgs, res.data]);
        }
      })
    );
  }

  addReaction(messageId: string, emoji: string): Observable<any> {
    return this.api.post<Message>(`messages/${messageId}/react`, { emoji }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.activeMessages.update(msgs =>
            msgs.map(m => m.id === messageId ? res.data : m)
          );
        }
      })
    );
  }

  markAsRead(conversationId: string) {
    this.api.put(`conversations/${conversationId}/read`, {}).subscribe();
  }

  addContact(contactData: Partial<UserSummary>): Observable<any> {
    return this.api.post<UserSummary>('contacts', contactData).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.contacts.update(list => [res.data, ...list]);
        }
      })
    );
  }

  deleteContact(contactId: string): Observable<any> {
    return this.api.delete<any>(`contacts/${contactId}`).pipe(
      tap(res => {
        if (res.success) {
          this.contacts.update(list => list.filter(c => c.id !== contactId && c.employeeId !== contactId));
        }
      })
    );
  }

  fetchGroupMembers(groupId: string): Observable<any> {
    return this.api.get<any[]>(`groups/${groupId}/members`);
  }

  addGroupMembers(groupId: string, memberIds: string[]): Observable<any> {
    return this.api.post<any>(`groups/${groupId}/members`, { memberIds }).pipe(
      tap(res => {
        if (res.success) {
          const active = this.activeConversation();
          if (active) {
            this.fetchMessages(active.id).subscribe();
          }
          this.fetchConversations().subscribe();
        }
      })
    );
  }

  removeGroupMember(groupId: string, memberUserId: string): Observable<any> {
    return this.api.delete<any>(`groups/${groupId}/members/${memberUserId}`).pipe(
      tap(res => {
        if (res.success) {
          const active = this.activeConversation();
          if (active) {
            this.fetchMessages(active.id).subscribe();
          }
          this.fetchConversations().subscribe();
        }
      })
    );
  }

  deleteConversation(conversationId: string): Observable<any> {
    return this.api.delete<any>(`conversations/${conversationId}`).pipe(
      tap(res => {
        if (res.success) {
          this.conversations.update(list => list.filter(c => c.id !== conversationId));
          const active = this.activeConversation();
          if (active && active.id === conversationId) {
            this.activeConversation.set(null);
          }
        }
      })
    );
  }

  deleteGroup(groupId: string): Observable<any> {
    return this.api.delete<any>(`groups/${groupId}`).pipe(
      tap(res => {
        if (res.success) {
          this.groups.update(grps => grps.filter(g => g.id !== groupId));
          const active = this.activeConversation();
          if (active && (active.groupId === groupId || active.id === groupId)) {
            this.activeConversation.set(null);
          }
          this.fetchConversations().subscribe();
        }
      })
    );
  }

  createGroup(name: string, description?: string, memberIds: string[] = []): Observable<any> {
    return this.api.post<any>('groups', { name, description, memberIds }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.fetchGroups().subscribe();
          this.fetchConversations().subscribe(convRes => {
            if (convRes?.data && res.data.conversationId) {
              const createdConv = convRes.data.find((c: any) => c.id === res.data.conversationId);
              if (createdConv) {
                this.selectConversation(createdConv);
              }
            }
          });
        }
      })
    );
  }
}
