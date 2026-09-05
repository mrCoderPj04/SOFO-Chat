import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserStatus } from '../../core/models/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() toggleSidebarClick = new EventEmitter<void>();

  auth = inject(AuthService);
  theme = inject(ThemeService);
  notif = inject(NotificationService);
  router = inject(Router);

  isStatusMenuOpen = signal<boolean>(false);
  isProfileMenuOpen = signal<boolean>(false);
  isNotificationDropdownOpen = signal<boolean>(false);

  userStatuses = [
    { status: UserStatus.ONLINE, label: 'Online', class: 'status-online' },
    { status: UserStatus.AWAY, label: 'Away', class: 'status-away' },
    { status: UserStatus.BUSY, label: 'Busy', class: 'status-busy' },
    { status: UserStatus.DND, label: 'Do Not Disturb', class: 'status-dnd' },
    { status: UserStatus.OFFLINE, label: 'Offline', class: 'status-offline' }
  ];

  changeStatus(status: UserStatus) {
    this.auth.updateStatus(status).subscribe();
    this.isStatusMenuOpen.set(false);
  }

  toggleNotificationDropdown() {
    this.isNotificationDropdownOpen.update(v => !v);
    this.isProfileMenuOpen.set(false);
  }

  toggleStatusMenu() {
    this.isStatusMenuOpen.update(v => !v);
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen.update(v => !v);
    this.isNotificationDropdownOpen.set(false);
  }

  logout() {
    this.auth.logout();
  }
}
