import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuoteHeader } from '../models/quote.model';
import { environment } from '../../../environments/environment';

export interface TermsTemplate {
  id: number;
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

  getQuoteById(id: number): Observable<QuoteHeader> {
    return this.http.get<QuoteHeader>(`${this.apiUrl}/${id}`);
  }

  getQuoteByRef(quoteRef: string): Observable<QuoteHeader> {
    return this.http.get<QuoteHeader>(`${this.apiUrl}/ref/${quoteRef}`);
  }

  getQuotesByCustomerId(customerId: number): Observable<QuoteHeader[]> {
    return this.http.get<QuoteHeader[]>(`${this.apiUrl}/customer/${customerId}`);
  }
  updateQuoteTerms(quoteId: number, terms: any[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${quoteId}/terms`, terms);
  }

  createQuote(quote: QuoteHeader): Observable<QuoteHeader> {
    return this.http.post<QuoteHeader>(this.apiUrl, quote);
  }

  updateQuote(id: number, quote: QuoteHeader): Observable<QuoteHeader> {
    return this.http.put<QuoteHeader>(`${this.apiUrl}/${id}`, quote);
  }

  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addQuoteDetail(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/detail`, item);
  }

  updateQuoteDetail(item: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/detail/${item.slNo}`, item);
  }

  deleteQuoteDetail(slNo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/detail/${slNo}`);
  }

  getTermsTemplates(): Observable<TermsTemplate[]> {
    return this.http.get<TermsTemplate[]>(this.termsUrl);
  }
}