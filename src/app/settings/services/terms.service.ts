import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TermsTemplate } from '../models/terms.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TermsService {
  private apiUrl = `${environment.apiUrl}/api/terms`;

  constructor(private http: HttpClient) { }

  getAllTemplates(): Observable<TermsTemplate[]> {
    return this.http.get<TermsTemplate[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getTemplateById(id: number): Observable<TermsTemplate> {
    return this.http.get<TermsTemplate>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createTemplate(template: TermsTemplate): Observable<TermsTemplate> {
    return this.http.post<TermsTemplate>(this.apiUrl, template).pipe(
      catchError(this.handleError)
    );
  }

  updateTemplate(id: number, template: TermsTemplate): Observable<TermsTemplate> {
    return this.http.put<TermsTemplate>(`${this.apiUrl}/${id}`, template).pipe(
      catchError(this.handleError)
    );
  }

  deleteTemplate(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    let errorType = 'UNKNOWN';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
      errorType = 'CLIENT_ERROR';
    } else {
      if (error.error && typeof error.error === 'object') {
        errorMessage = error.error.message || errorMessage;
        errorType = error.error.error || errorType;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
        errorType = 'SERVER_ERROR';
      }
    }

    console.error('HTTP Error:', { type: errorType, message: errorMessage, fullError: error });

    return throwError(() => ({
      type: errorType,
      message: errorMessage,
      status: error.status
    }));
  }
}