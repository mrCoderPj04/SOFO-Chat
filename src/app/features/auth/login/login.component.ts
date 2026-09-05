import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  auth = inject(AuthService);
  ws = inject(WebSocketService);
  router = inject(Router);

  employeeId = '';
  password = '';
  showPassword = false;

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  submitLogin() {
    this.errorMessage.set('');
    const cleanId = this.employeeId.trim();
    const cleanPwd = this.password.trim();

    if (!cleanId) {
      this.errorMessage.set('Please enter your official EMS Employee ID.');
      return;
    }

    if (!cleanPwd) {
      this.errorMessage.set('Please enter your official EMS Password.');
      return;
    }

    this.isLoading.set(true);

    this.auth.loginWithEmployeeId(cleanId, cleanPwd).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.ws.connect();
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Invalid credentials. Employee not found in EMS.');
      }
    });
  }
}
