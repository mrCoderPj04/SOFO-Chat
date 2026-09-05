import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isCollapsed = false;

  navItems = [
    { icon: 'home', label: 'Home', route: '/dashboard' },
    { icon: 'chat', label: 'Chat', route: '/chat' },
    { icon: 'videocam', label: 'Meeting', route: '/meetings' },
    { icon: 'notifications', label: 'Notifications', route: '/notifications' },
    { icon: 'group', label: 'Agents', route: '/agents' },
    { icon: 'settings', label: 'Settings', route: '/settings' }
  ];
}
