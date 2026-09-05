import { Component, ElementRef, OnInit, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WebRtcService } from '../../../core/services/webrtc.service';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-meeting-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-room.component.html',
  styleUrls: ['./meeting-room.component.scss']
})
export class MeetingRoomComponent implements OnInit, OnDestroy {
  @ViewChild('localVideoRef') localVideoRef!: ElementRef<HTMLVideoElement>;

  route = inject(ActivatedRoute);
  router = inject(Router);
  rtc = inject(WebRtcService);
  meeting = inject(MeetingService);
  auth = inject(AuthService);

  meetingCode = signal<string>('');
  isChatOpen = signal<boolean>(false);
  isParticipantsOpen = signal<boolean>(false);
  chatInput = signal<string>('');

  ngOnInit() {
    const code = this.route.snapshot.paramMap.get('code') || 'default-room';
    this.meetingCode.set(code);

    this.meeting.getMeeting(code).subscribe();

    this.rtc.initializeMedia().then(stream => {
      if (this.localVideoRef?.nativeElement) {
        this.localVideoRef.nativeElement.srcObject = stream;
      }
      this.rtc.joinRoom(code);
    });
  }

  ngOnDestroy() {
    this.rtc.leave();
  }

  sendChat() {
    const msg = this.chatInput().trim();
    if (!msg) return;

    const current = this.meeting.currentMeeting();
    if (current) {
      this.meeting.sendMeetingMessage(current.id, msg).subscribe();
    }
    this.chatInput.set('');
  }

  toggleChat() {
    this.isChatOpen.update(v => !v);
    this.isParticipantsOpen.set(false);
  }

  toggleParticipants() {
    this.isParticipantsOpen.update(v => !v);
    this.isChatOpen.set(false);
  }

  copyMeetingLink() {
    const origin = window.location.origin;
    const url = `${origin}/meetings/room/${this.meetingCode()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  }

  leaveMeeting() {
    this.rtc.leave();
    this.router.navigate(['/meetings']);
  }
}
