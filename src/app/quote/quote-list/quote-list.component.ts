import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { QuoteService } from '../services/quote.service';
import { CustomerService } from '../../customer/services/customer.service';
import { QuoteHeader } from '../models/quote.model';
import { forkJoin } from 'rxjs';

// Material Imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './quote-list.component.html',
  styleUrls: ['./quote-list.component.scss']
})
export class QuoteListComponent implements OnInit {
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [
    'quoteId',
    'quoteRef',
    'customerId',
    'customerName',
    'quoteDate',
    'totalQuantity',
    'totalValue',
    'actions'
  ];
  isLoading = false;

  constructor(
    private quoteService: QuoteService,
    private customerService: CustomerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadQuotes();
  }

  loadQuotes(): void {
    this.isLoading = true;
    
    // Fetch both quotes and customers
    forkJoin({
      quotes: this.quoteService.getAllQuotes(),
      customers: this.customerService.getCustomers()
    }).subscribe({
      next: (result) => {
        // Create a customer map for quick lookup
        const customerMap = new Map(
          result.customers.map(c => [c.customerId, c.name])
        );
        
        // Add customer name to each quote
        const quotesWithNames = result.quotes.map(quote => ({
          ...quote,
          customerName: quote.customerId ? (customerMap.get(quote.customerId) || 'Unknown') : 'Unknown'
        }));
        
        this.dataSource.data = quotesWithNames;
        this.isLoading = false;
        console.log('Quotes loaded successfully:', quotesWithNames);
      },
      error: (error: any) => {
        console.error('Error loading quotes:', error);
        this.isLoading = false;
        alert('Failed to load quotes. Check console for details.');
      }
    });
  }

  onEdit(quote: QuoteHeader): void {
    if (!quote.quoteId) {
      alert('Invalid quote ID');
      return;
    }
    
    console.log('Edit quote:', quote);
    // Navigate to edit page with quote reference
    this.router.navigate(['/quotes/edit', quote.quoteId], { 
      queryParams: { ref: quote.quoteRef } 
    });
  }

  onDelete(quote: QuoteHeader): void {
    if (!quote.quoteId) {
      alert('Invalid quote ID');
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete Quote ${quote.quoteRef}?`);
    
    if (confirmDelete) {
      this.quoteService.deleteQuote(quote.quoteId).subscribe({
        next: () => {
          console.log('Quote deleted successfully');
          // Update the dataSource with filtered data
          this.dataSource.data = this.dataSource.data.filter(q => q.quoteId !== quote.quoteId);
          alert('Quote deleted successfully!');
        },
        error: (error: any) => {
          console.error('Error deleting quote:', error);
          alert('Failed to delete quote. Check console for details.');
        }
      });
    }
  }
}