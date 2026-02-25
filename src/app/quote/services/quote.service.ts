import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuoteHeader } from '../models/quote.model';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  private apiUrl = 'https://quote-backend-production-c1be.up.railway.app/api/quotes';

  constructor(private http: HttpClient) { }

  // ================= GET ALL =================
  getAllQuotes(): Observable<QuoteHeader[]> {
    return this.http.get<QuoteHeader[]>(this.apiUrl);
  }

  // ================= GET BY ID =================
  getQuoteById(id: number): Observable<QuoteHeader> {
    return this.http.get<QuoteHeader>(`${this.apiUrl}/${id}`);
  }

  // ================= GET BY REF =================
  getQuoteByRef(quoteRef: string): Observable<QuoteHeader> {
    return this.http.get<QuoteHeader>(`${this.apiUrl}/ref/${quoteRef}`);
  }

  // ================= GET BY CUSTOMER =================
  getQuotesByCustomerId(customerId: number): Observable<QuoteHeader[]> {
    return this.http.get<QuoteHeader[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  // ================= CREATE =================
  createQuote(quote: QuoteHeader): Observable<QuoteHeader> {
    return this.http.post<QuoteHeader>(this.apiUrl, quote);
  }

  // ================= UPDATE =================
  updateQuote(id: number, quote: QuoteHeader): Observable<QuoteHeader> {
    return this.http.put<QuoteHeader>(`${this.apiUrl}/${id}`, quote);
  }

  // ================= DELETE HEADER =================
  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ================= ADD DETAIL =================
  addQuoteDetail(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/detail`, item);
  }

  // ================= UPDATE DETAIL =================
  updateQuoteDetail(item: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/detail/${item.slNo}`, item);
  }

  // ================= DELETE DETAIL =================
  deleteQuoteDetail(slNo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/detail/${slNo}`);
  }

}