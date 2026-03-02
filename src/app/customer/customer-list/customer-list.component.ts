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
    'name',
    'emailId',
    'contactNumber',
    'city'
  ];

  dataSource = new MatTableDataSource<Customer>([]);
  selection = new SelectionModel<Customer>(true, []);
  isDeleting = false;
  selectedCustomer: Customer | null = null;

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
        if (this.table) this.table.renderRows();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load customers:', err);
        this.snackBar.open('Failed to load customers', 'Close', { duration: 3000 });
      }
    });
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
  }

  closeDetail(): void {
    this.selectedCustomer = null;
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.data.length;
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

    const confirmDelete = confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`);
    if (!confirmDelete) return;

    this.isDeleting = true;

    const deleteRequests = selectedCustomers.map(customer =>
      this.customerService.deleteCustomer(customer.customerId!).pipe(
        catchError(err => of({
          error: true,
          customerId: customer.customerId,
          customerName: customer.name,
          errorType: err.type || 'UNKNOWN',
          message: err.message || 'Unknown error'
        }))
      )
    );

    forkJoin(deleteRequests).pipe(
      finalize(() => {
        this.isDeleting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (results) => {
        const errors = results.filter((r: any) => r?.error);
        const successCount = results.length - errors.length;

        if (errors.length === 0) {
          this.snackBar.open(`Successfully deleted ${successCount} customer(s)`, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(`Deleted ${successCount}, ${errors.length} failed.`, 'Close', { duration: 5000 });
        }

        this.selection.clear();
        this.selectedCustomer = null;
        setTimeout(() => this.loadCustomers(), 500);
      },
      error: (err: any) => {
        console.error('Delete failed:', err);
        this.snackBar.open('Delete operation failed', 'Close', { duration: 3000 });
      }
    });
  }
}