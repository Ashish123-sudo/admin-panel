import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Currency } from '../models/currency.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private base = `${environment.apiUrl}/api/currencies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Currency[]> { 
    return this.http.get<Currency[]>(this.base); 
  }
  
  create(c: Currency): Observable<Currency> { 
    return this.http.post<Currency>(this.base, c); 
  }
  
  update(id: string, c: Currency): Observable<Currency> {  // Changed from number to string
    return this.http.put<Currency>(`${this.base}/${id}`, c); 
  }
  
  delete(id: string): Observable<void> {  // Changed from number to string
    return this.http.delete<void>(`${this.base}/${id}`); 
  }
  
  setDefault(id: string): Observable<Currency> {  // Changed from number to string
    return this.http.put<Currency>(`${this.base}/${id}/set-default`, {}); 
  }
}