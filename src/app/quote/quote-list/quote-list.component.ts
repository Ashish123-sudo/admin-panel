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

import { QuoteService } from '../services/quote.service';
import { QuoteHeader } from '../models/quote.model';

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
    'quoteDate',
    'totalQuantity',
    'totalValue'
  ];

  dataSource = new MatTableDataSource<QuoteHeader>([]);
  isLoading = true;
  isLoadingDetail = false;
  selectedQuote: QuoteHeader | null = null;

  @ViewChild(MatTable) table!: MatTable<QuoteHeader>;

  constructor(
    private quoteService: QuoteService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadQuotes();
  }

  loadQuotes(): void {
    this.isLoading = true;
    this.quoteService.getAllQuotes().subscribe({
      next: (data: QuoteHeader[]) => {
        this.dataSource.data = data || [];
        if (this.table) this.table.renderRows();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading quotes:', err);
        this.snackBar.open('Failed to load quotes', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  selectQuote(quote: QuoteHeader): void {
    // If already selected, do nothing
    if (this.selectedQuote?.quoteId === quote.quoteId) return;

    this.isLoadingDetail = true;
    this.selectedQuote = quote; // show panel immediately with basic info

    this.quoteService.getQuoteById(quote.quoteId!).subscribe({
      next: (full: QuoteHeader) => {
        this.selectedQuote = full;
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