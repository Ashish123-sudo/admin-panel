import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource, MatTable } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SearchService } from '../../shared/search.service';
import { QuoteService } from '../services/quote.service';
import { CustomerService } from '../../customer/services/customer.service';
import { QuoteHeader } from '../models/quote.model';
import { Customer } from '../../customer/models/customer.model';

import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './quote-list.component.html',
  styleUrls: ['./quote-list.component.scss']
})
export class QuoteListComponent implements OnInit {

  displayedColumns: string[] = [
    'quoteRef',
    'customerId',
    'customerName',
    'quoteDate',
    'totalQuantity',
    'totalValue'
  ];

  dataSource = new MatTableDataSource<QuoteHeader>([]);
  isLoading = true;
  isLoadingDetail = false;
  selectedQuote: QuoteHeader | null = null;

  private customerMap = new Map<number, string>();

  @ViewChild(MatTable) table!: MatTable<QuoteHeader>;

  constructor(
    private quoteService: QuoteService,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.loadQuotes();
    this.router.events
    .pipe(filter(e => e instanceof NavigationEnd))
    .subscribe((e: NavigationEnd) => {
      if (e.urlAfterRedirects === '/quotes') {
        this.loadQuotes();
      }
    });
    this.searchService.searchTerm$.subscribe(term => {
      this.dataSource.filter = term;
    });
  }

  loadQuotes(): void {
    this.isLoading = true;

    forkJoin({
      quotes: this.quoteService.getAllQuotes(),
      customers: this.customerService.getCustomers()
    }).subscribe({
      next: ({ quotes, customers }) => {
        // Build id → name lookup map
        this.customerMap.clear();
        customers.forEach((c: Customer) => {
          if (c.customerId != null) this.customerMap.set(c.customerId, c.name);
        });

        // Enrich quotes with customerName
        this.dataSource.data = (quotes || []).map(q => ({
          ...q,
          customerName: this.customerMap.get(q.customerId!) ?? `ID: ${q.customerId}`
        }));

        if (this.table) this.table.renderRows();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.snackBar.open('Failed to load quotes', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  selectQuote(quote: QuoteHeader): void {
    if (this.selectedQuote?.quoteId === quote.quoteId) return;

    this.isLoadingDetail = true;
    this.selectedQuote = quote;

    this.quoteService.getQuoteById(quote.quoteId!).subscribe({
      next: (full: QuoteHeader) => {
        // Re-attach customerName since backend doesn't return it
        this.selectedQuote = {
          ...full,
          customerName: this.customerMap.get(full.customerId!) ?? `ID: ${full.customerId}`
        };
        this.isLoadingDetail = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load quote details:', err);
        this.snackBar.open('Failed to load quote details', 'Close', { duration: 3000 });
        this.isLoadingDetail = false;
      }
    });
  }

  closeDetail(): void {
    this.selectedQuote = null;
  }

  onEdit(quote: QuoteHeader): void {
    this.router.navigate(['/quotes/edit', quote.quoteId]);
  }

  onDelete(quote: QuoteHeader): void {
    const confirmed = window.confirm(`Delete quote ${quote.quoteRef}?`);
    if (!confirmed) return;

    this.quoteService.deleteQuote(quote.quoteId!).subscribe({
      next: () => {
        this.snackBar.open('Quote deleted', 'Close', { duration: 3000 });
        this.selectedQuote = null;
        this.loadQuotes();
      },
      error: (err: any) => {
        console.error('Delete failed:', err);
        this.snackBar.open('Failed to delete quote', 'Close', { duration: 3000 });
      }
    });
  }
}