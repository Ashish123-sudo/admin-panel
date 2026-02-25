import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  // Use the Railway backend URL
  private apiUrl = 'https://quote-backend-production-c1be.up.railway.app/api/customers';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getCustomerById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer).pipe(
      catchError(this.handleError)
    );
  }

  updateCustomer(id: number, customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer).pipe(
      catchError(this.handleError)
    );
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    let errorType = 'UNKNOWN';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
      errorType = 'CLIENT_ERROR';
    } else {
      // Backend error
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