import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatTable } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { QuoteService } from '../services/quote.service';
import { CustomerService } from '../../customer/services/customer.service';
import { QuoteHeader } from '../models/quote.model';
import { Customer } from '../../customer/models/customer.model';

// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-quote-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatTableModule,
    MatSelectModule
  ],
  templateUrl: './quote-add.component.html',
  styleUrls: ['./quote-add.component.scss']
})
export class QuoteAddComponent implements OnInit {
  quoteForm!: FormGroup;
  customers: Customer[] = [];
  isSubmitting = false;

  displayedColumns: string[] = [
    'itemDesc',
    'itemUnitRate',
    'itemQuantity',
    'itemValue',
    'actions'
  ];

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private quoteService: QuoteService,
    private customerService: CustomerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  // ================= INIT =================

  ngOnInit(): void {
    this.initializeForm();
    this.loadCustomers();
  }

  // ================= FORM =================

  initializeForm(): void {
    this.quoteForm = this.fb.group({
      quoteRef: [{ value: '', disabled: true }], // 👈 ADD THIS
      customerId: ['', Validators.required],
      quoteDate: [new Date(), Validators.required],
      quoteDetails: this.fb.array([])
    });

    this.addRow();
  }

  get quoteDetails(): FormArray {
    return this.quoteForm.get('quoteDetails') as FormArray;
  }

  // ================= TABLE ROWS =================

  addRow(): void {
    const row = this.fb.group({
      itemDesc: ['', Validators.required],
      itemUnitRate: [0, [Validators.required, Validators.min(0)]],
      itemQuantity: [1, [Validators.required, Validators.min(1)]],
      itemValue: [0]
    });

    this.quoteDetails.push(row);

    if (this.table) {
      this.table.renderRows();
    }
  }

  removeLineItem(index: number): void {
    if (this.quoteDetails.length === 1) {
      return;
    }

    this.quoteDetails.removeAt(index);

    if (this.table) {
      this.table.renderRows();
    }
  }

  updateItemValue(index: number): void {
    const row = this.quoteDetails.at(index);

    const qty = row.get('itemQuantity')?.value || 0;
    const rate = row.get('itemUnitRate')?.value || 0;

    row.patchValue(
      {
        itemValue: qty * rate
      },
      { emitEvent: false }
    );
  }

  // ================= TOTALS =================

  getTotalQuantity(): number {
    return this.quoteDetails.controls.reduce(
      (sum, row) => sum + (row.get('itemQuantity')?.value || 0),
      0
    );
  }

  getTotalValue(): number {
    return this.quoteDetails.controls.reduce(
      (sum, row) =>
        sum +
        (row.get('itemQuantity')?.value || 0) *
          (row.get('itemUnitRate')?.value || 0),
      0
    );
  }

  // ================= SAVE =================

  onSubmit(): void {
    if (this.quoteForm.invalid || this.quoteDetails.length === 0) {
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000
      });
      return;
    }

    this.isSubmitting = true;

    const formValue = this.quoteForm.value;
    const formattedDate = new Date(formValue.quoteDate)
      .toISOString()
      .split('T')[0];

    const quoteData: QuoteHeader = {
      customerId: formValue.customerId,
      quoteDate: formattedDate,
      totalQuantity: this.getTotalQuantity(),
      totalValue: this.getTotalValue(),
      quoteDetails: formValue.quoteDetails.map((d: any) => ({
        itemDesc: d.itemDesc,
        itemUnitRate: d.itemUnitRate,
        itemQuantity: d.itemQuantity,
        itemValue: d.itemQuantity * d.itemUnitRate
      }))
    };

    this.quoteService.createQuote(quoteData).subscribe({
      next: (savedQuote) => {
        this.snackBar.open(
          `Quote ${savedQuote.quoteRef} created successfully`,
          'Close',
          { duration: 3000 }
        );

        // 👇 THIS IS THE STEP YOU WERE MISSING
        this.quoteForm.get('quoteRef')?.setValue(savedQuote.quoteRef);

        this.isSubmitting = false;
        this.resetForm();
      },
      error: () => {
        this.snackBar.open('Failed to save quote', 'Close', {
          duration: 4000
        });
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    // Tear down the form completely
    this.quoteForm = this.fb.group({
      quoteRef: [{ value: '', disabled: true }],
      customerId: ['', Validators.required],
      quoteDate: [new Date(), Validators.required],
      quoteDetails: this.fb.array([])
    });

    // Add one empty row
    this.addRow();

    // Reset flags
    this.isSubmitting = false;

    // Force Material table refresh
    this.cdr.detectChanges();
  }
  // ================= DATA =================

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.cdr.detectChanges();
      },
      error: () =>
        this.snackBar.open('Failed to load customers', 'Close', {
          duration: 3000
        })
    });
  }

  onCancel(): void {
    this.router.navigate(['/quotes']);
  }

  get lastRow(): FormGroup | null {
    if (this.quoteDetails.length === 0) return null;
    return this.quoteDetails.at(this.quoteDetails.length - 1) as FormGroup;
  }

  canAddRow(): boolean {
  const last = this.lastRow;
  if (!last) return true; // no rows yet, allow adding

  return !!last.get('itemDesc')?.valid && !!last.get('itemUnitRate')?.valid;
}



}