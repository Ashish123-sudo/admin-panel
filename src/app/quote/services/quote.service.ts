import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuoteHeader } from '../models/quote.model';

export interface TermsTemplate {
  id: number;
  name: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = 'https://quote-backend-production-c1be.up.railway.app/api/quotes';
  private termsUrl = 'https://quote-backend-production-c1be.up.railway.app/api/terms-templates';

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

  // ================= TERMS TEMPLATES =================
  getTermsTemplates(): Observable<TermsTemplate[]> {
    return this.http.get<TermsTemplate[]>(this.termsUrl);
  }
}