import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { Notification as AppNotification } from '../models/models';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private api = inject(ApiService);

  notifications = signal<AppNotification[]>([]);
  unreadCount = signal<number>(0);

  fetchNotifications(): Observable<any> {
    return this.api.get<AppNotification[]>('notifications').pipe(
      tap(res => {
        if (res.success && res.data) {
          this.notifications.set(res.data);
          this.unreadCount.set(res.data.filter(n => !n.isRead).length);
        }
      })
    );
  }

  markAsRead(id: string): Observable<any> {
    return this.api.put<AppNotification>(`notifications/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.api.put<any>('notifications/read-all', {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      })
    );
  }

  addIncomingNotification(notif: any) {
    const newN: AppNotification = {
      id: notif.id || `notif-${Date.now()}`,
      type: notif.type || 'MESSAGE',
      title: notif.title || 'New Message',
      body: notif.body || '',
      actionUrl: notif.actionUrl || '/chat',
      referenceId: notif.conversationId,
      isRead: false,
      createdAt: notif.createdAt || new Date().toISOString(),
      sender: notif.sender
    };
    this.notifications.update(list => [newN, ...list]);
    this.unreadCount.update(c => c + 1);

    // Browser Notification if supported and granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newN.title, {
          body: newN.body,
          icon: notif.sender?.avatarUrl || 'https://ui-avatars.com/api/?name=EMS'
        });
      } catch (e) {}
    }
  }

  requestPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
