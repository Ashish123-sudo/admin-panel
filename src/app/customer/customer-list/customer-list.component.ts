import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource, MatTable } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { CustomerService } from '../services/customer.service';
import { Customer } from '../models/customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  displayedColumns: string[] = [
    'select',
    'customerId',
    'name',
    'address1',
    'address2',
    'city',
    'stateProvince',
    'country',
    'contactNumber',
    'emailId',
    'webUrl',
    'actions'
  ];

  dataSource = new MatTableDataSource<Customer>([]);
  selection = new SelectionModel<Customer>(true, []);
  isDeleting = false;

  @ViewChild(MatTable) table!: MatTable<Customer>;

  constructor(
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (data: Customer[]) => {
        this.dataSource.data = data || [];
        
        if (this.table) {
          this.table.renderRows();
        }
        
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load customers:', err);
        this.snackBar.open('Failed to load customers', 'Close', {
          duration: 3000
        });
      }
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource.data);
    }
  }

  deleteSelected(): void {
    const selectedCustomers = this.selection.selected;
    
    if (selectedCustomers.length === 0) {
      this.snackBar.open('No customers selected', 'Close', { duration: 2000 });
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete ${selectedCustomers.length} customer(s)?`
    );

    if (!confirmDelete) {
      return;
    }

    this.isDeleting = true;

    const deleteRequests = selectedCustomers.map(customer => {
      return this.customerService.deleteCustomer(customer.customerId!).pipe(
        catchError(err => {
          // Return structured error info
          return of({ 
            error: true, 
            customerId: customer.customerId,
            customerName: customer.name,
            errorType: err.type || 'UNKNOWN',
            message: err.message || 'Unknown error'
          });
        })
      );
    });

    forkJoin(deleteRequests).pipe(
      finalize(() => {
        this.isDeleting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (results) => {
        const errors = results.filter((r: any) => r?.error);
        const foreignKeyErrors = errors.filter((r: any) => r.errorType === 'FOREIGN_KEY_CONSTRAINT');
        const otherErrors = errors.filter((r: any) => r.errorType !== 'FOREIGN_KEY_CONSTRAINT');
        const successCount = results.length - errors.length;

        // Show appropriate message based on errors
        if (errors.length === 0) {
          // All succeeded
          this.snackBar.open(
            `Successfully deleted ${successCount} customer(s)`,
            'Close',
            { duration: 3000 }
          );
        } else if (foreignKeyErrors.length > 0 && otherErrors.length === 0) {
          // Only foreign key errors
          const customerNames = foreignKeyErrors.map((e: any) => e.customerName).join(', ');
          this.snackBar.open(
            `Cannot delete ${foreignKeyErrors.length} customer(s) (${customerNames}) - they have existing quotes. Delete their quotes first.`,
            'Close',
            { duration: 7000, panelClass: ['warning-snackbar'] }
          );
        } else if (foreignKeyErrors.length > 0) {
          // Mixed errors
          this.snackBar.open(
            `Deleted ${successCount} customer(s). ${foreignKeyErrors.length} cannot be deleted (have quotes), ${otherErrors.length} failed with errors.`,
            'Close',
            { duration: 7000, panelClass: ['warning-snackbar'] }
          );
        } else {
          // Other errors only
          this.snackBar.open(
            `Deleted ${successCount} customer(s), ${errors.length} failed. Check console for details.`,
            'Close',
            { duration: 5000 }
          );
          console.error('Failed deletions:', errors);
        }

        this.selection.clear();
        setTimeout(() => this.loadCustomers(), 500);
      },
      error: (err: any) => {
        console.error('Delete operation failed:', err);
        this.snackBar.open('Delete operation failed', 'Close', {
          duration: 3000
        });
      }
    });
  }
}