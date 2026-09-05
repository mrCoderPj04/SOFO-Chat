import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { UserSummary } from '../../../core/models/models';

@Component({
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-group-modal.component.html',
  styleUrls: ['./create-group-modal.component.scss']
})
export class CreateGroupModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  chat = inject(ChatService);

  groupName = '';
  groupDescription = '';
  selectedMemberIds = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  toggleMember(user: UserSummary) {
    this.selectedMemberIds.update(ids => {
      if (ids.includes(user.id)) {
        return ids.filter(id => id !== user.id);
      } else {
        return [...ids, user.id];
      }
    });
  }

  isMemberSelected(userId: string): boolean {
    return this.selectedMemberIds().includes(userId);
  }

  createGroup() {
    if (!this.groupName.trim()) return;

    this.isLoading.set(true);
    this.chat.createGroup(this.groupName.trim(), this.groupDescription, this.selectedMemberIds()).subscribe({
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
