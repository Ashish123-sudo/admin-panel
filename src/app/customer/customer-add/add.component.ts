import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../models/customer.model';

@Component({
  selector: 'app-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss']
})
export class AddComponent implements OnInit {
  customerForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      address1: ['', Validators.maxLength(255)],
      address2: ['', Validators.maxLength(255)],
      city: ['', Validators.maxLength(255)],
      stateProvince: ['', Validators.maxLength(255)],
      country: ['', Validators.maxLength(255)],
      contactNumber: ['', Validators.maxLength(255)],
      emailId: ['', [Validators.email, Validators.maxLength(255)]],
      webUrl: ['', Validators.maxLength(255)]
    });
  }

  onSubmit(): void {
    if (this.customerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const customerData: Customer = this.customerForm.value;
      
      console.log('Submitting customer data:', customerData);

      this.customerService.createCustomer(customerData).subscribe({
        next: (response) => {
          console.log('Customer created successfully:', response);
          // Navigate back to customer list
          this.router.navigate(['/customers']);
        },
        error: (error: any) => {
          console.error('Error creating customer:', error);
          alert('Failed to add customer. Please try again.');
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else if (!this.customerForm.valid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.customerForm.controls).forEach(key => {
        this.customerForm.get(key)?.markAsTouched();
      });
      alert('Please fill in all required fields correctly.');
    }
  }

  onCancel(): void {
    // Navigate back to customer list
    this.router.navigate(['/customers']);
  }
}