import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  setTerm(term: string): void {
    this.searchTermSubject.next(term.toLowerCase().trim());
  }

  clear(): void {
    this.searchTermSubject.next('');
  }
}