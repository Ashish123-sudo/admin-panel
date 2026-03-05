import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) {}

  login(email: string, password: string): boolean {
    // 🔹 Replace with API later
    if (email === 'admin@test.com' && password === '123456') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);
      // Derive a display name from email (before the @)
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      localStorage.setItem('userName', name);
      // Generate a stable user ID from email
      const userId = 'USR-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
      localStorage.setItem('userId', userId);
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  getUserEmail(): string {
    return localStorage.getItem('userEmail') ?? '';
  }

  getUserName(): string {
    return localStorage.getItem('userName') ?? 'User';
  }

  getUserId(): string {
    return localStorage.getItem('userId') ?? '—';
  }

  /** Returns initials for the avatar circle, e.g. "Admin Test" → "AT" */
  getUserInitials(): string {
    const name = this.getUserName();
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}