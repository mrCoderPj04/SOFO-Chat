import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-meeting-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-dashboard.component.html',
  styleUrls: ['./meeting-dashboard.component.scss']
})
export class MeetingDashboardComponent implements OnInit {
  meetingService = inject(MeetingService);
  auth = inject(AuthService);
  router = inject(Router);

  activeTab = signal<'CREATE' | 'JOIN' | 'RECENT'>('CREATE');
  isCreating = signal<boolean>(false);
  joinInput = '';
  copiedToast = signal<string>('');
  createdMeetingData = signal<any>(null);

  newMeeting = {
    title: '',
    agenda: '',
    durationMinutes: 30,
    passCode: ''
  };

  ngOnInit() {
    this.meetingService.fetchUpcomingMeetings().subscribe();
    this.meetingService.fetchMeetingHistory().subscribe();
  }

  submitCreateMeeting() {
    if (!this.newMeeting.title.trim()) return;
    this.isCreating.set(true);

    this.meetingService.createScheduledMeeting({
      title: this.newMeeting.title.trim(),
      agenda: this.newMeeting.agenda.trim(),
      durationMinutes: Number(this.newMeeting.durationMinutes),
      passCode: this.newMeeting.passCode.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        if (res.success && res.data) {
          this.createdMeetingData.set(res.data);
        } else {
          const code = 'pj-' + Math.random().toString(36).substring(2, 8);
          this.createdMeetingData.set({
            meetingCode: code,
            title: this.newMeeting.title
          });
        }
      },
      error: () => {
        this.isCreating.set(false);
        const code = 'pj-' + Math.random().toString(36).substring(2, 8);
        this.createdMeetingData.set({
          meetingCode: code,
          title: this.newMeeting.title
        });
      }
    });
  }

  submitJoin() {
    let raw = this.joinInput.trim();
    if (!raw) return;

    // Handle full URL paste or code
    if (raw.includes('/meetings/room/')) {
      const parts = raw.split('/meetings/room/');
      raw = parts[1].split('?')[0].split('#')[0];
    }

    this.joinMeeting(raw);
  }

  joinMeeting(code: string) {
    if (code) {
      this.router.navigate(['/meetings/room', code]);
    }
  }

  getMeetingUrl(code: string): string {
    const origin = window.location.origin;
    return `${origin}/meetings/room/${code}`;
  }

  copyToClipboard(text: string, type: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.copiedToast.set(`✅ Copied Meeting ${type} to clipboard!`);
      setTimeout(() => this.copiedToast.set(''), 3000);
    }
  }
}

