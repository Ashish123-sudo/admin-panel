import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatTable } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TermsService } from '../../settings/services/terms.service';
import { QuoteService } from '../services/quote.service';
import { CustomerService } from '../../customer/services/customer.service';
import { QuoteHeader } from '../models/quote.model';
import { Customer } from '../../customer/models/customer.model';
import { TermsTemplate, TermsGroup } from '../../settings/models/terms.model';
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
    FormsModule,
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
  termsTemplates: TermsTemplate[] = [];
  selectedTerms: (TermsGroup & { currentTerm?: string })[] = [];
  showTcModal = false;
  newGroupName = '';

  currencies = ['INR', 'USD', 'EUR', 'GBP'];
  currencySymbols: Record<string, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£'
  };

  displayedColumns: string[] = [
    'itemDesc',
    'itemUnitRate',
    'itemQuantity',
    'itemDiscount',
    'itemValue',
    'actions'
  ];

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private quoteService: QuoteService,
    private customerService: CustomerService,
    private termsService: TermsService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCustomers();
    this.loadTermsTemplates();
  }

  initializeForm(): void {
    this.quoteForm = this.fb.group({
      quoteRef:        [{ value: '', disabled: true }],
      customerId:      ['', Validators.required],
      quoteDate:       [new Date(), Validators.required],
      currency:        ['INR', Validators.required],
      termsTemplateId: ['', Validators.required],
      quoteDetails:    this.fb.array([])
    });
    this.addRow();
  }

  get quoteDetails(): FormArray {
    return this.quoteForm.get('quoteDetails') as FormArray;
  }

  get selectedCurrency(): string {
    return this.quoteForm.get('currency')?.value || 'INR';
  }

  // =========================
  // QUOTE ITEMS
  // =========================

  addRow(): void {
    const row = this.fb.group({
      itemDesc:     ['', Validators.required],
      itemUnitRate: [0, [Validators.required, Validators.min(0)]],
      itemQuantity: [1, [Validators.required, Validators.min(1)]],
      itemDiscount: [0, [Validators.min(0), Validators.max(100)]],
      itemValue:    [0]
    });
    this.quoteDetails.push(row);
    if (this.table) this.table.renderRows();
  }

  removeLineItem(index: number): void {
    if (this.quoteDetails.length === 1) return;
    this.quoteDetails.removeAt(index);
    if (this.table) this.table.renderRows();
  }

  updateItemValue(index: number): void {
    const row = this.quoteDetails.at(index);
    const qty      = row.get('itemQuantity')?.value || 0;
    const rate     = row.get('itemUnitRate')?.value || 0;
    const discount = row.get('itemDiscount')?.value || 0;
    const value    = qty * rate * (1 - discount / 100);
    row.patchValue({ itemValue: value }, { emitEvent: false });
  }

  getTotalQuantity(): number {
    return this.quoteDetails.controls.reduce(
      (sum, row) => sum + (row.get('itemQuantity')?.value || 0), 0
    );
  }

  getTotalValue(): number {
    return this.quoteDetails.controls.reduce((sum, row) => {
      const qty      = row.get('itemQuantity')?.value || 0;
      const rate     = row.get('itemUnitRate')?.value || 0;
      const discount = row.get('itemDiscount')?.value || 0;
      return sum + qty * rate * (1 - discount / 100);
    }, 0);
  }

  get lastRow(): FormGroup | null {
    if (this.quoteDetails.length === 0) return null;
    return this.quoteDetails.at(this.quoteDetails.length - 1) as FormGroup;
  }

  canAddRow(): boolean {
    const last = this.lastRow;
    if (!last) return true;
    return !!last.get('itemDesc')?.valid && !!last.get('itemUnitRate')?.valid;
  }

  // =========================
  // TERMS & CONDITIONS
  // =========================

  loadTermsTemplates(): void {
    this.termsService.getAllTemplates().subscribe({
      next: (data: TermsTemplate[]) => {
        this.termsTemplates = data;
        this.cdr.detectChanges();
      },
      error: (err: { message: string }) => {
        console.error('Failed to load terms templates:', err);
      }
    });
  }

  onTermsTemplateChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    const template = this.termsTemplates.find(t => t.templateId === id);
    if (template) {
      this.selectedTerms = template.termsGroups.map(g => ({
        ...g,
        termsDetails: g.termsDetails.map(d => ({ ...d })),
        currentTerm: ''
      }));
      this.openTcModal();
    } else {
      this.selectedTerms = [];
    }
  }

  openTcModal(): void { 
  console.log('Opening modal, selectedTerms:', this.selectedTerms);
  this.showTcModal = true; 
}
  closeTcModal(): void { this.showTcModal = false; }
  confirmTc(): void { this.showTcModal = false; }

  addGroup(): void {
    this.selectedTerms.push({ groupName: 'New Term Type', termsDetails: [], currentTerm: '' });
  }

  removeGroup(gi: number): void {
    this.selectedTerms.splice(gi, 1);
  }

  addTerm(gi: number): void {
    this.selectedTerms[gi].termsDetails.push({ termText: '' });
  }

  removeTerm(gi: number, di: number): void {
    this.selectedTerms[gi].termsDetails.splice(di, 1);
  }

  // =========================
  // SUBMIT / RESET
  // =========================

  onSubmit(): void {
    if (this.quoteForm.invalid || this.quoteDetails.length === 0) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    if (this.selectedTerms.length === 0) {
      this.snackBar.open('Please select and confirm terms & conditions', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.quoteForm.value;
    const formattedDate = new Date(formValue.quoteDate).toISOString().split('T')[0];

    const quoteData: QuoteHeader = {
      customerId:    formValue.customerId,
      quoteDate:     formattedDate,
      currency:      formValue.currency,
      totalQuantity: this.getTotalQuantity(),
      totalValue:    this.getTotalValue(),
      quoteDetails:  formValue.quoteDetails.map((d: any) => ({
        itemDesc:     d.itemDesc,
        itemUnitRate: d.itemUnitRate,
        itemQuantity: d.itemQuantity,
        itemDiscount: d.itemDiscount,
        itemValue:    d.itemQuantity * d.itemUnitRate * (1 - d.itemDiscount / 100)
      })),
      incomingTerms: this.selectedTerms.flatMap((g, gi) =>
        g.termsDetails.map((d, di) => ({
          groupName:  g.groupName,
          termText:   d.termText,
          groupOrder: gi + 1,
          termOrder:  di + 1
        }))
      )
    };
    this.quoteService.createQuote(quoteData).subscribe({
      next: (savedQuote) => {
        this.snackBar.open(`Quote ${savedQuote.quoteRef} created successfully`, 'Close', { duration: 3000 });
        this.isSubmitting = false;
        this.resetForm();
      },
      error: () => {
        this.snackBar.open('Failed to save quote', 'Close', { duration: 4000 });
        this.isSubmitting = false;
      }
    });
    console.log('Quote payload:', JSON.stringify(quoteData));
  }

  resetForm(): void {
    this.quoteForm = this.fb.group({
      quoteRef:        [{ value: '', disabled: true }],
      customerId:      ['', Validators.required],
      quoteDate:       [new Date(), Validators.required],
      currency:        ['INR', Validators.required],
      termsTemplateId: ['', Validators.required],
      quoteDetails:    this.fb.array([])
    });
    this.selectedTerms = [];
    this.addRow();
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (data) => { this.customers = data; this.cdr.detectChanges(); },
      error: () => this.snackBar.open('Failed to load customers', 'Close', { duration: 3000 })
    });
  }

  onCancel(): void { this.router.navigate(['/quotes']); }
}