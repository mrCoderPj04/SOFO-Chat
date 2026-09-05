import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { MeetingService } from '../../core/services/meeting.service';
import { NotificationService } from '../../core/services/notification.service';
import { ScheduleModalComponent } from '../meetings/schedule-modal/schedule-modal.component';
import { Meeting } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ScheduleModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  chat = inject(ChatService);
  meeting = inject(MeetingService);
  notif = inject(NotificationService);
  router = inject(Router);

  isScheduleModalOpen = signal<boolean>(false);
  nextMeeting = computed<Meeting | null>(() => this.meeting.upcomingMeetings()[0] || null);

  ngOnInit() {
    this.chat.fetchConversations().subscribe();
    this.chat.fetchContacts().subscribe();
    this.meeting.fetchUpcomingMeetings().subscribe();
    this.notif.fetchNotifications().subscribe();
  }

  startInstantMeeting() {
    this.meeting.startInstantMeeting().subscribe(res => {
      if (res.success && res.data) {
        this.router.navigate(['/meetings/room', res.data.meetingCode]);
      }
    });
  }

  joinMeeting(code: string) {
    this.router.navigate(['/meetings/room', code]);
  }

  openChat(conv: any) {
    this.chat.selectConversation(conv);
    this.router.navigate(['/chat']);
  }
}
