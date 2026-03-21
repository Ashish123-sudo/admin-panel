import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TcTemplate } from '../models/tc-template.model';

@Injectable({ providedIn: 'root' })
export class TcTemplateService {
  private base = `${environment.apiUrl}/api/tc/templates`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TcTemplate[]> {
    return this.http.get<TcTemplate[]>(this.base);
  }

  getById(id: string): Observable<TcTemplate> {  // Changed from number to string
    return this.http.get<TcTemplate>(`${this.base}/${id}`);
  }

  create(payload: { templateName: string; termIds: string[] }): Observable<TcTemplate> {  // Changed termIds from number[] to string[]
    return this.http.post<TcTemplate>(this.base, payload);
  }

  update(id: string, payload: { templateName: string; termIds: string[] }): Observable<TcTemplate> {  // Changed id and termIds
    return this.http.put<TcTemplate>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {  // Changed from number to string
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}