import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuoteHeader } from '../models/quote.model';
import { environment } from '../../../environments/environment';

export interface TermsTemplate {
  id: string;  // Changed from number to string (UUID)
  name: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = `${environment.apiUrl}/api/quotes`;
  private termsUrl = `${environment.apiUrl}/api/terms-templates`;

  constructor(private http: HttpClient) { }

  getAllQuotes(): Observable<QuoteHeader[]> {
    return this.http.get<QuoteHeader[]>(this.apiUrl);
  }

  getQuoteById(id: string): Observable<QuoteHeader> {  // Changed from number to string
    return this.http.get<QuoteHeader>(`${this.apiUrl}/${id}`);
  }

  getQuoteByRef(quoteRef: string): Observable<QuoteHeader> {
    return this.http.get<QuoteHeader>(`${this.apiUrl}/ref/${quoteRef}`);
  }

  getQuotesByCustomerId(customerId: string): Observable<QuoteHeader[]> {  // Changed from number to string
    return this.http.get<QuoteHeader[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  updateQuoteTerms(quoteId: string, terms: any[]): Observable<void> {  // Changed from number to string
    return this.http.put<void>(`${this.apiUrl}/${quoteId}/terms`, terms);
  }

  createQuote(quote: QuoteHeader): Observable<QuoteHeader> {
    return this.http.post<QuoteHeader>(this.apiUrl, quote);
  }

  updateQuote(id: string, quote: QuoteHeader): Observable<QuoteHeader> {  // Changed from number to string
    return this.http.put<QuoteHeader>(`${this.apiUrl}/${id}`, quote);
  }

  deleteQuote(id: string): Observable<void> {  // Changed from number to string
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addQuoteDetail(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/detail`, item);
  }

  updateQuoteDetail(item: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/detail/${item.slNo}`, item);
  }

  deleteQuoteDetail(slNo: string): Observable<void> {  // Changed from number to string
    return this.http.delete<void>(`${this.apiUrl}/detail/${slNo}`);
  }

  getTermsTemplates(): Observable<TermsTemplate[]> {
    return this.http.get<TermsTemplate[]>(this.termsUrl);
  }

  submitForApproval(quoteId: string, submittedBy: string): Observable<any> {  // Changed from number to string
    return this.http.put(`${this.apiUrl}/${quoteId}/submit`, { submittedBy });
  }

  approveQuote(quoteId: string, approvedBy: string): Observable<any> {  // Changed from number to string
    return this.http.put(`${this.apiUrl}/${quoteId}/approve`, { approvedBy });
  }

  rejectQuote(quoteId: string, approvedBy: string, rejectionReason: string): Observable<any> {  // Changed from number to string
    return this.http.put(`${this.apiUrl}/${quoteId}/reject`, { approvedBy, rejectionReason });
  }
}