import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  get baseUrl(): string {
    if (typeof window !== 'undefined') {
      const customApi = localStorage.getItem('SOFO_API_URL');
      if (customApi) return customApi;
    }
    return environment.apiUrl || 'http://localhost:8080/api';
  }

  get<T>(path: string, params: any = {}): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: httpParams });
  }

  post<T>(path: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, body);
  }

  put<T>(path: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${path}`, body);
  }

  delete<T>(path: string, params: any = {}): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: httpParams });
  }

  upload<T>(path: string, file: File): Observable<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, formData);
  }
}
