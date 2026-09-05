import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat-workspace/chat-workspace.component').then(m => m.ChatWorkspaceComponent)
      },
      {
        path: 'meetings',
        loadComponent: () => import('./features/meetings/meeting-dashboard/meeting-dashboard.component').then(m => m.MeetingDashboardComponent)
      },
      {
        path: 'meetings/room/:code',
        loadComponent: () => import('./features/meetings/meeting-room/meeting-room.component').then(m => m.MeetingRoomComponent)
      },
      {
        path: 'agents',
        loadComponent: () => import('./features/agents/agents.component').then(m => m.AgentsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
