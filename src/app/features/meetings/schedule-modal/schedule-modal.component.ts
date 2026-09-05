import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../../core/services/meeting.service';
import { ChatService } from '../../../core/services/chat.service';
import { MeetingType } from '../../../core/models/models';

@Component({
  selector: 'app-schedule-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-modal.component.html',
  styleUrls: ['./schedule-modal.component.scss']
})
export class ScheduleModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  meeting = inject(MeetingService);
  chat = inject(ChatService);

  title = '';
  description = '';
  agenda = '';
  durationMinutes = 30;
  scheduledDate = new Date().toISOString().substring(0, 10);
  scheduledTime = '16:00';
  selectedParticipantIds = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  toggleParticipant(id: string) {
    this.selectedParticipantIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  scheduleMeeting() {
    if (!this.title.trim()) return;

    const startDateTime = new Date(`${this.scheduledDate}T${this.scheduledTime}:00`);

    const payload = {
      title: this.title.trim(),
      description: this.description,
      agenda: this.agenda,
      durationMinutes: this.durationMinutes,
      type: MeetingType.SCHEDULED,
      scheduledStartTime: startDateTime.toISOString(),
      participantUserIds: this.selectedParticipantIds()
    };

    this.isLoading.set(true);
    this.meeting.createScheduledMeeting(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeModal.emit();
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
