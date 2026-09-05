import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserProfile, UserStatus } from '../models/models';
import { tap, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

export const CONNECT_BACKEND_URL = 'http://localhost:8080/api';
export const EMS_REMOTE_URL = 'https://erp-backend-1-02lc.onrender.com';

export interface AuthLoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: any;
  employee?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<UserProfile | null>(null);
  token = signal<string | null>(localStorage.getItem('connect_token') || localStorage.getItem('pj_token'));
  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  constructor() {
    const savedUser = localStorage.getItem('employee_profile') || localStorage.getItem('pj_user');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {}
    }
    if (this.token()) {
      this.fetchCurrentProfile().subscribe({
        error: () => {}
      });
    }
  }

  // Direct Live Employee ID Login
  loginWithEmployeeId(employeeId: string, password: string): Observable<AuthLoginResponse> {
    const cleanId = employeeId.trim();
    const cleanPwd = password.trim();

    return this.http.post<AuthLoginResponse>(`${CONNECT_BACKEND_URL}/auth/login`, {
      employeeId: cleanId,
      password: cleanPwd
    }).pipe(
      tap(res => {
        const emp = res.employee || res.user;
        const jwtToken = res.accessToken || res.token;
        if (emp && jwtToken) {
          this.applyVerifiedEmployee(emp, jwtToken);
        }
      }),
      catchError(err => {
        const errorDetail = err.error?.detail || err.error?.error || err.error?.message || (typeof err.error === 'string' ? err.error : 'Invalid credentials. Employee not found or incorrect password.');
        return throwError(() => new Error(errorDetail));
      })
    );
  }

  private applyVerifiedEmployee(emp: any, token: string) {
    const userProfile: UserProfile = {
      id: emp.id || `emp-${emp.employeeId}`,
      employeeId: emp.employeeId,
      email: emp.email || `${emp.employeeId}@pjsofonic.com`,
      firstName: emp.name ? emp.name.split(' ')[0] : (emp.firstName || emp.username || 'Employee'),
      lastName: emp.name ? emp.name.split(' ').slice(1).join(' ') : (emp.lastName || ''),
      fullName: emp.name || emp.fullName || emp.username || `Employee ${emp.employeeId}`,
      designation: emp.designation || 'Specialist',
      avatarUrl: emp.photoUrl || emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || emp.fullName || emp.employeeId)}&background=00f0ff&color=090d16`,
      status: UserStatus.ONLINE,
      role: emp.role as any,
      departmentName: emp.department || (emp.department && typeof emp.department === 'object' ? emp.department.name : 'Technology'),
      phone: emp.phone,
      isEmsAuthorized: true,
      isEmsSynced: true
    };

    this.token.set(token);
    this.currentUser.set(userProfile);

    localStorage.setItem('connect_token', token);
    localStorage.setItem('pj_token', token);
    localStorage.setItem('employee_profile', JSON.stringify(userProfile));
    localStorage.setItem('pj_user', JSON.stringify(userProfile));
  }

  // Fetch Current Profile
  fetchCurrentProfile(): Observable<any> {
    const token = this.token();
    if (!token) return of(null);

    return this.http.get<{ success: boolean; employee: any }>(`${CONNECT_BACKEND_URL}/connect/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(res => {
        if (res && res.success && res.employee) {
          this.applyVerifiedEmployee(res.employee, token);
        }
      }),
      catchError(() => of(null))
    );
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('connect_token');
    localStorage.removeItem('pj_token');
    localStorage.removeItem('employee_profile');
    localStorage.removeItem('pj_user');
    this.router.navigate(['/login']);
  }

  updateProfile(fullName?: string, avatarUrl?: string, customStatusMessage?: string, status?: UserStatus): Observable<any> {
    const token = this.token();
    return this.http.put<{ success: boolean; employee: any }>(`${CONNECT_BACKEND_URL}/connect/profile`, {
      fullName,
      avatarUrl,
      customStatusMessage,
      status
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(res => {
        if (res && res.success && res.employee) {
          this.applyVerifiedEmployee(res.employee, token || '');
        }
      })
    );
  }

  updateStatus(status: UserStatus, customMessage?: string): Observable<any> {
    return this.updateProfile(undefined, undefined, customMessage, status);
  }
}
