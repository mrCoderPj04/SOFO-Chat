import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private authService = inject(AuthService);
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: any = null;

  private messageSubject = new Subject<any>();
  private typingSubject = new Subject<any>();
  private presenceSubject = new Subject<any>();
  private notificationSubject = new Subject<any>();
  private meetingEventSubject = new Subject<any>();
  private meetingChatSubject = new Subject<any>();
  private webrtcSignalSubject = new Subject<any>();

  public messages$ = this.messageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public presence$ = this.presenceSubject.asObservable();
  public notifications$ = this.notificationSubject.asObservable();
  public meetingEvents$ = this.meetingEventSubject.asObservable();
  public meetingChat$ = this.meetingChatSubject.asObservable();
  public webrtcSignal$ = this.webrtcSignalSubject.asObservable();

  connect() {
    if (this.isConnected && this.socket) return;

    const token = this.authService.token();
    const user = this.authService.currentUser();
    if (!user) return;

    let baseWs = environment.wsUrl || 'ws://localhost:8080/ws';
    if (typeof window !== 'undefined') {
      const customWs = localStorage.getItem('SOFO_WS_URL');
      if (customWs) {
        baseWs = customWs;
      }
    }
    if (baseWs.startsWith('http://')) baseWs = baseWs.replace('http://', 'ws://');
    if (baseWs.startsWith('https://')) baseWs = baseWs.replace('https://', 'wss://');

    const wsUrl = `${baseWs}?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(token || '')}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type || data.action;

          if (type === 'NEW_MESSAGE') {
            this.messageSubject.next(data);
          } else if (type === 'NEW_NOTIFICATION') {
            this.notificationSubject.next(data.notification || data);
          } else if (type === 'USER_TYPING') {
            this.typingSubject.next(data);
          } else if (type === 'PRESENCE_UPDATE') {
            this.presenceSubject.next(data);
          } else if (type === 'MEETING_SIGNAL') {
            this.webrtcSignalSubject.next(data);
          } else if (type === 'MEETING_EVENT') {
            this.meetingEventSubject.next(data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnected = false;
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.authService.currentUser()) {
        this.connect();
      }
    }, 4000);
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  sendTyping(conversationId: string, memberIds: string[], isTyping: boolean) {
    this.send({
      action: 'TYPING',
      conversationId,
      memberIds,
      isTyping
    });
  }

  sendSignal(signalOrRoom: any, signalData?: any) {
    if (typeof signalOrRoom === 'string') {
      this.send({
        action: 'MEETING_SIGNAL',
        roomId: signalOrRoom,
        ...signalData
      });
    } else {
      this.send({
        action: 'MEETING_SIGNAL',
        ...signalOrRoom
      });
    }
  }

  joinMeeting(roomId: string) {
    this.send({
      action: 'JOIN_MEETING',
      roomId
    });
  }

  subscribeToConversation(conversationId: string) {
    // Native WebSocket handles routing automatically via memberIds / rooms
  }

  subscribeToMeeting(roomId: string, currentUserId: string) {
    this.joinMeeting(roomId);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

