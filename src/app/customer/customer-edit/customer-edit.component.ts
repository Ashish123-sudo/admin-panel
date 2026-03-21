import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../models/customer.model';

@Component({
  selector: 'app-customer-edit',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatFormFieldModule
  ],
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss']
})
export class CustomerEditComponent implements OnInit {
  customerForm!: FormGroup;
  customerId!: string;        // string
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.snackBar.open('Invalid customer ID', 'Close', { duration: 3000 });
      this.router.navigate(['/customers']);
      return;
    }
    this.customerId = id;     // no Number() conversion
    this.buildForm();
    this.loadCustomer();
  }

  buildForm(): void {
    this.customerForm = this.fb.group({
      name:          ['', Validators.required],
      address1:      [''],
      address2:      [''],
      city:          [''],
      stateProvince: [''],
      country:       [''],
      contactNumber: [''],
      emailId:       ['', Validators.email],
      webUrl:        ['']
    });
  }

  loadCustomer(): void {
    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (customer: Customer) => { this.customerForm.patchValue(customer); },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load customer', err);
        this.snackBar.open('Failed to load customer details', 'Close', { duration: 3000 });
        this.router.navigate(['/customers']);
      }
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000 });
      return;
    }
    this.isSubmitting = true;
    this.customerService.updateCustomer(this.customerId, this.customerForm.value).subscribe({
      next: () => {
        this.snackBar.open('Customer updated successfully', 'Close', { duration: 3000 });
        this.isSubmitting = false;
        this.router.navigate(['/customers']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Update failed', err);
        this.snackBar.open('Failed to update customer', 'Close', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void { this.router.navigate(['/customers']); }
}