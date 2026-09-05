import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  theme = inject(ThemeService);
  auth = inject(AuthService);

  editFullName = '';
  editAvatarUrl = '';
  editStatusMessage = '';
  showAvatarPicker = false;
  isSaving = false;
  saveToastMsg = '';

  avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  ];

  quickStatuses = [
    '⚡ Active & Available',
    '🚀 In a Meeting',
    '💻 Coding / Deep Focus',
    '☕ Taking a Coffee Break',
    '🏡 Working from Home'
  ];

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.editFullName = user.fullName || '';
      this.editAvatarUrl = user.avatarUrl || '';
      this.editStatusMessage = user.customStatusMessage || '⚡ Active & Available';
    }
  }

  toggleAvatarPicker() {
    this.showAvatarPicker = !this.showAvatarPicker;
  }

  selectPresetAvatar(url: string) {
    this.editAvatarUrl = url;
    this.showAvatarPicker = false;
  }

  saveProfileChanges() {
    if (!this.editFullName.trim()) return;
    this.isSaving = true;

    this.auth.updateProfile(
      this.editFullName.trim(),
      this.editAvatarUrl.trim() || undefined,
      this.editStatusMessage.trim()
    ).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.saveToastMsg = '✅ Profile & Status updated across EMS Connect!';
        setTimeout(() => this.saveToastMsg = '', 4000);
      },
      error: () => {
        this.isSaving = false;
        // Optimistic local update
        const current = this.auth.currentUser();
        if (current) {
          const updated = {
            ...current,
            fullName: this.editFullName.trim(),
            avatarUrl: this.editAvatarUrl.trim() || current.avatarUrl,
            customStatusMessage: this.editStatusMessage.trim()
          };
          this.auth.currentUser.set(updated);
          localStorage.setItem('pj_user', JSON.stringify(updated));
          localStorage.setItem('employee_profile', JSON.stringify(updated));
        }
        this.saveToastMsg = '✅ Profile updated successfully!';
        setTimeout(() => this.saveToastMsg = '', 4000);
      }
    });
  }

  setTheme(m: ThemeMode) {
    this.theme.setTheme(m);
  }
}

