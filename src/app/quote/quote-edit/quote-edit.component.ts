import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { QuoteService } from '../services/quote.service';
import { CustomerService } from '../../customer/services/customer.service';

@Component({
  selector: 'app-quote-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './quote-edit.component.html',
  styleUrls: ['./quote-edit.component.scss']
})
export class QuoteEditComponent implements OnInit {

  searchType: string = 'ref';
  searchValue: string = '';
  searchAttempted: boolean = false;
  currentQuoteId: number | null = null;
  customerQuotes: any[] = [];
  selectedQuote: any = null;

  // Use MatTableDataSource for table
  dataSource = new MatTableDataSource<any>([]);

  displayedColumns: string[] = [
    'itemDesc',
    'itemUnitRate',
    'itemQuantity',
    'itemValue',
    'actions'
  ];

  constructor(
    private quoteService: QuoteService,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Check if quote reference is passed via query params
    this.route.queryParams.subscribe(params => {
      if (params['ref']) {
        this.searchType = 'ref';
        this.searchValue = params['ref'];
        this.search();
      }
    });
  }

  // ================= UNIFIED SEARCH =================
  search(): void {
    if (!this.searchValue.trim()) {
      this.snackBar.open('Please enter a search value', 'Close', {
        duration: 3000
      });
      return;
    }

    this.searchAttempted = true;

    if (this.searchType === 'ref') {
      this.searchByReference();
    } else {
      this.searchByCustomerName();
    }
  }

  // ================= SEARCH BY REFERENCE =================
  searchByReference(): void {
    this.quoteService.getQuoteByRef(this.searchValue).subscribe({
      next: (response: any) => {
        if (!response || !response.quoteDetails || response.quoteDetails.length === 0) {
          this.dataSource.data = [];
          this.currentQuoteId = null;
          this.snackBar.open('No quote found for this reference', 'Close', {
            duration: 3000
          });
          return;
        }

        this.currentQuoteId = response.quoteId;
        this.dataSource.data = response.quoteDetails;
        this.customerQuotes = [];
        this.cdr.detectChanges();

        this.snackBar.open('Quote loaded successfully', 'Close', {
          duration: 2000
        });
      },
      error: () => {
        this.dataSource.data = [];
        this.currentQuoteId = null;
        this.snackBar.open('Quote not found', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // ================= SEARCH BY CUSTOMER NAME =================
  searchByCustomerName(): void {
    // First, find customer by name
    this.customerService.getCustomers().subscribe({
      next: (customers: any[]) => {
        console.log('All customers:', customers);

        const matchingCustomer = customers.find(c =>
          c.name.toLowerCase().includes(this.searchValue.toLowerCase())
        );

        console.log('Matching customer:', matchingCustomer);

        if (!matchingCustomer) {
          this.customerQuotes = [];
          this.dataSource.data = [];
          this.cdr.detectChanges();
          this.snackBar.open('No customer found with that name', 'Close', {
            duration: 3000
          });
          return;
        }

        // Get all quotes for this customer
        this.quoteService.getQuotesByCustomerId(matchingCustomer.customerId).subscribe({
          next: (quotes: any[]) => {
            console.log('Found quotes for customer:', quotes);

            if (quotes.length === 0) {
              this.customerQuotes = [];
              this.dataSource.data = [];
              this.cdr.detectChanges();
              this.snackBar.open('No quotes found for this customer', 'Close', {
                duration: 3000
              });
              return;
            }

            // Set the data and force change detection
            this.customerQuotes = [...quotes]; // Create new array reference
            this.dataSource.data = [];
            this.cdr.detectChanges(); // Force Angular to detect changes
            console.log('Customer quotes set to:', this.customerQuotes);

            this.snackBar.open(`Found ${quotes.length} quote(s). Select one to edit.`, 'Close', {
              duration: 3000
            });
          },
          error: (err) => {
            console.error('Error fetching quotes:', err);
            this.customerQuotes = [];
            this.dataSource.data = [];
            this.cdr.detectChanges();
            this.snackBar.open('Error fetching quotes', 'Close', {
              duration: 3000
            });
          }
        });
      },
      error: (err) => {
        console.error('Error searching customers:', err);
        this.customerQuotes = [];
        this.dataSource.data = [];
        this.cdr.detectChanges();
        this.snackBar.open('Error searching customers', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // ================= SELECT QUOTE FROM CUSTOMER SEARCH =================
  selectQuote(quote: any): void {
    this.selectedQuote = quote;

    this.quoteService.getQuoteByRef(quote.quoteRef).subscribe({
      next: (response: any) => {
        this.currentQuoteId = response.quoteId;
        this.dataSource.data = response.quoteDetails;
        this.cdr.detectChanges();

        this.snackBar.open('Quote loaded successfully', 'Close', {
          duration: 2000
        });
      },
      error: () => {
        this.snackBar.open('Error loading quote details', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // ================= CALCULATE ITEM VALUE =================
  calculateItemValue(item: any): void {
    const rate = parseFloat(item.itemUnitRate) || 0;
    const qty = parseFloat(item.itemQuantity) || 0;
    item.itemValue = rate * qty;

    // Trigger change detection
    this.cdr.detectChanges();
  }

  // ================= UPDATE ITEM =================
  updateItem(item: any): void {
    this.calculateItemValue(item);

    this.quoteService.updateQuoteDetail(item).subscribe({
      next: () => {
        console.log('Item updated successfully', item);
        // Force table refresh by creating new array reference
        this.dataSource.data = [...this.dataSource.data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Update failed:', err);
        this.snackBar.open('Failed to update item', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // ================= DELETE DETAIL =================
  deleteDetail(slNo: number): void {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    this.quoteService.deleteQuoteDetail(slNo).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(item => item.slNo !== slNo);

        this.snackBar.open('Item deleted successfully', 'Close', {
          duration: 2000
        });
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Delete failed', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // ================= ADD NEW ITEM =================
  addNewItem(): void {
    if (!this.currentQuoteId) {
      this.snackBar.open('Please load a quote first', 'Close', {
        duration: 3000
      });
      return;
    }

    // Create a new quote detail object
    const newItem = {
      quoteId: this.currentQuoteId,
      itemDesc: '',
      itemUnitRate: 0,
      itemQuantity: 1,
      itemValue: 0
    };

    // Call the service to add the new item
    this.quoteService.addQuoteDetail(newItem).subscribe({
      next: (savedItem: any) => {
        console.log('New item added successfully', savedItem);
        
        // Add the new item to the table
        this.dataSource.data = [...this.dataSource.data, savedItem];
        this.cdr.detectChanges();

        this.snackBar.open('New item added successfully', 'Close', {
          duration: 2000
        });
      },
      error: (err: any) => {
        console.error('Failed to add new item:', err);
        this.snackBar.open('Failed to add new item', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // ================= GET TOTAL QUANTITY =================
  getTotalQuantity(): number {
    return this.dataSource.data.reduce((sum, item) => sum + (parseFloat(item.itemQuantity) || 0), 0);
  }

  // ================= GET TOTAL VALUE =================
  getTotalValue(): number {
    return this.dataSource.data.reduce((sum, item) => sum + (parseFloat(item.itemValue) || 0), 0);
  }

  // ================= SAVE CHANGES =================
  saveChanges(): void {
    this.snackBar.open('All changes have been saved automatically', 'Close', {
      duration: 2000
    });
  }

  // ================= CANCEL EDIT =================
  cancelEdit(): void {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      this.router.navigate(['/quotes']);
    }
  }
}