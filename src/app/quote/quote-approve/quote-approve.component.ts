import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QuoteService } from '../services/quote.service';
import { AuthService } from '../../auth.service';
import { CustomerService } from '../../customer/services/customer.service';

@Component({
  selector: 'app-quote-approve',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
            MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './quote-approve.component.html',
  styleUrls: ['./quote-approve.component.scss']
})
export class QuoteApproveComponent implements OnInit {

  quotes: any[] = [];
  isLoading = true;
  isLoadingDetail = false;
  selectedQuote: any = null;

  showRejectPanel = false;
  rejectionReason = '';

  private customerMap = new Map<number, any>();

  constructor(
    private quoteService: QuoteService,
    private authService: AuthService,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadPendingQuotes();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        customers.forEach(c => { if (c.customerId) this.customerMap.set(c.customerId, c); });
      }
    });
  }

  loadPendingQuotes(): void {
    this.isLoading = true;
    this.quoteService.getAllQuotes().subscribe({
      next: (data) => {
        this.quotes = data
          .filter(q => (q as any).approvalStatus === 'PENDING')
          .map(q => ({
            ...q,
            customerName: this.customerMap.get(q.customerId!)?.name ?? `ID: ${q.customerId}`
          }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  selectQuote(quote: any): void {
    if (this.selectedQuote?.quoteId === quote.quoteId) return;
    this.isLoadingDetail = true;
    this.selectedQuote = quote;
    this.showRejectPanel = false;
    this.quoteService.getQuoteById(quote.quoteId).subscribe({
      next: (full: any) => {
        const customer = this.customerMap.get(full.customerId);
        this.selectedQuote = {
          ...full,
          customerName: customer?.name ?? `ID: ${full.customerId}`
        };
        this.isLoadingDetail = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingDetail = false; }
    });
  }

  closeDetail(): void {
    this.selectedQuote = null;
    this.showRejectPanel = false;
  }

  approve(quote: any): void {
    const approvedBy = this.authService.getUserEmail();
    this.quoteService.approveQuote(quote.quoteId, approvedBy).subscribe({
      next: () => {
        this.quotes = this.quotes.filter(q => q.quoteId !== quote.quoteId);
        this.selectedQuote = null;
        this.snackBar.open(`Quote ${quote.quoteRef} approved`, 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to approve', 'Close', { duration: 3000 })
    });
  }

  openRejectPanel(): void {
    this.rejectionReason = '';
    this.showRejectPanel = true;
  }

  cancelReject(): void {
    this.showRejectPanel = false;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.rejectionReason.trim()) return;
    const approvedBy = this.authService.getUserEmail();
    this.quoteService.rejectQuote(this.selectedQuote.quoteId, approvedBy, this.rejectionReason).subscribe({
      next: () => {
        this.quotes = this.quotes.filter(q => q.quoteId !== this.selectedQuote.quoteId);
        this.snackBar.open(`Quote ${this.selectedQuote.quoteRef} rejected`, 'Close', { duration: 2000 });
        this.selectedQuote = null;
        this.showRejectPanel = false;
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to reject', 'Close', { duration: 3000 })
    });
  }
}