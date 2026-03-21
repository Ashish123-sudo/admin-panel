import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TcType, TcLibraryItem } from '../models/tc-library.model';

@Injectable({ providedIn: 'root' })
export class TcLibraryService {
  private base = `${environment.apiUrl}/api/tc`;

  constructor(private http: HttpClient) {}

  getTypes(): Observable<TcType[]> {
    return this.http.get<TcType[]>(`${this.base}/types`);
  }

  createType(type: TcType): Observable<TcType> {
    return this.http.post<TcType>(`${this.base}/types`, type);
  }

  deleteType(id: string): Observable<void> {  // Changed from number to string
    return this.http.delete<void>(`${this.base}/types/${id}`);
  }

  getTerms(): Observable<TcLibraryItem[]> {
    return this.http.get<TcLibraryItem[]>(`${this.base}/terms`);
  }

  createTerm(term: TcLibraryItem): Observable<TcLibraryItem> {
    return this.http.post<TcLibraryItem>(`${this.base}/terms`, term);
  }

  updateTerm(id: string, term: TcLibraryItem): Observable<TcLibraryItem> {  // Changed from number to string
    return this.http.put<TcLibraryItem>(`${this.base}/terms/${id}`, term);
  }

  deleteTerm(id: string): Observable<void> {  // Changed from number to string
    return this.http.delete<void>(`${this.base}/terms/${id}`);
  }

  reorderTerms(items: { termId: string; sortOrder: number }[]): Observable<void> {  // Changed termId from number to string
    return this.http.put<void>(`${this.base}/terms/reorder`, items);
  }
}