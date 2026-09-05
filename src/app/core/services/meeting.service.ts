import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Meeting, MeetingMessage, MeetingParticipant } from '../models/models';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private api = inject(ApiService);

  upcomingMeetings = signal<Meeting[]>([]);
  meetingHistory = signal<Meeting[]>([]);
  currentMeeting = signal<Meeting | null>(null);
  meetingMessages = signal<MeetingMessage[]>([]);

  fetchUpcomingMeetings(): Observable<any> {
    return this.api.get<Meeting[]>('meetings/upcoming').pipe(
      tap(res => {
        if (res.success && res.data) {
          this.upcomingMeetings.set(res.data);
        }
      })
    );
  }

  fetchMeetingHistory(): Observable<any> {
    return this.api.get<Meeting[]>('meetings/history').pipe(
      tap(res => {
        if (res.success && res.data) {
          this.meetingHistory.set(res.data);
        }
      })
    );
  }

  getMeeting(idOrCode: string): Observable<any> {
    return this.api.get<Meeting>(`meetings/${idOrCode}`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentMeeting.set(res.data);
        }
      })
    );
  }

  startInstantMeeting(): Observable<any> {
    return this.api.post<Meeting>('meetings/instant', {}).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentMeeting.set(res.data);
        }
      })
    );
  }

  createScheduledMeeting(meetingData: any): Observable<any> {
    return this.api.post<Meeting>('meetings', meetingData).pipe(
      tap(res => {
        if (res.success) {
          this.fetchUpcomingMeetings().subscribe();
        }
      })
    );
  }

  joinMeeting(meetingId: string): Observable<any> {
    return this.api.post<MeetingParticipant>(`meetings/${meetingId}/join`, {});
  }

  leaveMeeting(meetingId: string): Observable<any> {
    return this.api.post(`meetings/${meetingId}/leave`, {});
  }

  fetchMeetingMessages(meetingId: string): Observable<any> {
    return this.api.get<MeetingMessage[]>(`meetings/${meetingId}/messages`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.meetingMessages.set(res.data);
        }
      })
    );
  }

  sendMeetingMessage(meetingId: string, message: string): Observable<any> {
    return this.api.post<MeetingMessage>(`meetings/${meetingId}/messages`, { message }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.meetingMessages.update(msgs => [...msgs, res.data]);
        }
      })
    );
  }
}
