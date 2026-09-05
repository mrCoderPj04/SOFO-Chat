import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notif = inject(NotificationService);
  router = inject(Router);

  ngOnInit() {
    this.notif.fetchNotifications().subscribe();
  }

  handleNotificationClick(n: Notification) {
    this.notif.markAsRead(n.id).subscribe();
    if (n.actionUrl) {
      this.router.navigate([n.actionUrl]);
    }
  }
}
