import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppRole } from '../models/app-role.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppRoleService {
  private base = `${environment.apiUrl}/api/roles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AppRole[]> { return this.http.get<AppRole[]>(this.base); }
  create(role: AppRole): Observable<AppRole> { return this.http.post<AppRole>(this.base, role); }
  update(id: number, role: AppRole): Observable<AppRole> { return this.http.put<AppRole>(`${this.base}/${id}`, role); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}