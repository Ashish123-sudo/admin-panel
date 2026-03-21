import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppUserService {
  private base = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { 
    return this.http.get<any[]>(this.base); 
  }
  
  create(payload: any): Observable<any> { 
    return this.http.post<any>(this.base, payload); 
  }
  
  update(id: string, payload: any): Observable<any> {  // Changed from number to string
    return this.http.put<any>(`${this.base}/${id}`, payload); 
  }
  
  delete(id: string): Observable<void> {  // Changed from number to string
    return this.http.delete<void>(`${this.base}/${id}`); 
  }
}