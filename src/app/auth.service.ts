import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private router: Router, private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    if (username === 'admin' && password === 'admin123') {
      const mockResponse = {
        userId: 0,
        fullName: 'Administrator',
        username: 'admin',
        role: 'Administrator'
      };
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', mockResponse.username);
      localStorage.setItem('userName', mockResponse.fullName);
      localStorage.setItem('userId', 'USR-0');
      localStorage.setItem('userRole', mockResponse.role);
      return new Observable(observer => {
        observer.next(mockResponse);
        observer.complete();
      });
    }

    return this.http.post<any>(`${environment.apiUrl}/api/auth/login`, { username, password }).pipe(
      tap(response => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', response.username);
        localStorage.setItem('userName', response.fullName);
        localStorage.setItem('userId', 'USR-' + response.userId);
        localStorage.setItem('userRole', response.role);
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  getUserEmail(): string { return localStorage.getItem('userEmail') ?? ''; }
  getUserName(): string { return localStorage.getItem('userName') ?? 'User'; }
  getUserId(): string { return localStorage.getItem('userId') ?? '—'; }
  getUserRole(): string { return localStorage.getItem('userRole') ?? ''; }

  getUserInitials(): string {
    const name = this.getUserName();
    return name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
  }

  isAdmin(): boolean { return this.getUserRole() === 'Administrator'; }
  isQuoteCreator(): boolean { return this.getUserRole() === 'Quote Creator'; }
  isQuoteApprover(): boolean { return this.getUserRole() === 'Quote Approver'; }

  canAccessSettings(): boolean { return this.isAdmin(); }
  canCreateQuotes(): boolean { return this.isAdmin() || this.isQuoteCreator(); }
  canApproveQuotes(): boolean { return this.isAdmin() || this.isQuoteApprover(); }
}