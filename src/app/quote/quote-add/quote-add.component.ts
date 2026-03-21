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
import { CurrencyService } from '../../settings/services/currency.service';
import { Router } from '@angular/router';
import { MatTable } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QuoteService } from '../services/quote.service';
import { CustomerService } from '../../customer/services/customer.service';
import { QuoteHeader } from '../models/quote.model';
import { Customer } from '../../customer/models/customer.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { TcTemplateService } from '../../settings/services/tc-template.service';

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
  templateInputValue = '';
  showTemplateSuggestions = false;
  templateSuggestions: any[] = [];
  quoteForm!: FormGroup;
  customers: Customer[] = [];
  isSubmitting = false;
  selectedTerms: any[] = [];
  showTcModal = false;
  newGroupName = '';
  customerInputValue = '';
  showCustomerSuggestions = false;
  customerSuggestions: Customer[] = [];
  currencies: any[] = [];
  currencyInputValue = '';
  showCurrencySuggestions = false;
  currencySuggestions: any[] = [];
  isAddingCurrency = false;
  pendingNewCurrencies: { currencyCode: string; currencyName: string }[] = [];

  // Valid format: "USD - US Dollar" or "USD — US Dollar"
  get currencyInputMatchesFormat(): boolean {
    return /^[A-Za-z]{2,10}\s*[-—]\s*.{2,}$/.test(this.currencyInputValue.trim());
  }

  get canAddNewCurrency(): boolean {
    if (!this.currencyInputMatchesFormat) return false;
    const code = this.newCurrencyCode;
    return !this.currencies.some((c: any) =>
      c.currencyCode.toLowerCase() === code.toLowerCase()
    );
  }

  get showCurrencyFormatHint(): boolean {
    const val = this.currencyInputValue.trim();
    if (!val) return false;
    // Show hint if user has typed something but it doesn't match the format
    // and doesn't match an existing currency
    const matchesExisting = this.currencies.some((c: any) =>
      c.currencyCode.toLowerCase().includes(val.toLowerCase()) ||
      c.currencyName?.toLowerCase().includes(val.toLowerCase()) ||
      `${c.currencyCode} — ${c.currencyName}`.toLowerCase().includes(val.toLowerCase())
    );
    return !this.currencyInputMatchesFormat && !matchesExisting && val.length > 2;
  }

  get newCurrencyCode(): string {
    return this.currencyInputValue.trim().split(/\s*[-—]\s*/)[0].toUpperCase().trim();
  }

  get newCurrencyName(): string {
    const parts = this.currencyInputValue.trim().split(/\s*[-—]\s*/);
    return parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';
  }

  displayedColumns: string[] = [
    'itemDesc', 'itemUnitRate', 'itemQuantity',
    'itemDiscount', 'itemValue', 'actions'
  ];

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private quoteService: QuoteService,
    private customerService: CustomerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private tcTemplateService: TcTemplateService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCustomers();
    this.loadTermsTemplates();
    this.loadCurrencies();
  }

  // ── Customer ──────────────────────────────────────
  onCustomerInput(): void {
    const val = this.customerInputValue.trim().toLowerCase();
    if (!val) {
      this.customerSuggestions = [];
      this.showCustomerSuggestions = false;
      this.quoteForm.patchValue({ customerId: '' });
      return;
    }
    this.customerSuggestions = this.customers.filter(c =>
      c.name.toLowerCase().includes(val)
    );
    this.showCustomerSuggestions = true;
  }

  onCustomerBlur(): void {
    setTimeout(() => { this.showCustomerSuggestions = false; }, 200);
  }

  selectCustomer(customer: Customer): void {
    this.customerInputValue = customer.name;
    this.quoteForm.patchValue({ customerId: customer.customerId });
    this.showCustomerSuggestions = false;
  }

  // ── Currency ──────────────────────────────────────
  loadCurrencies(): void {
    this.currencyService.getAll().subscribe({
      next: (data) => {
        this.currencies = data;
        const def = data.find((c: any) => c.isDefault);
        if (def) {
          this.quoteForm.patchValue({ currency: def.currencyCode });
          this.currencyInputValue = `${def.currencyCode} — ${def.currencyName}`;
        }
        this.cdr.detectChanges();
      },
      error: () => console.error('Failed to load currencies')
    });
  }

  onCurrencyFocus(): void {
    // On focus: if nothing typed yet, show all; if already typed, filter
    const val = this.currencyInputValue.trim().toLowerCase();
    // Check if the current value matches a selected currency display string
    // If so, clear it so user can type fresh
    const isDisplayString = this.currencies.some(c =>
      `${c.currencyCode} — ${c.currencyName}`.toLowerCase() === val
    );
    if (isDisplayString) {
      this.currencySuggestions = [...this.currencies];
    } else {
      this.currencySuggestions = val
        ? this.currencies.filter(c =>
            c.currencyCode.toLowerCase().includes(val) ||
            c.currencyName?.toLowerCase().includes(val))
        : [...this.currencies];
    }
    this.showCurrencySuggestions = true;
  }

  onCurrencyInput(): void {
    const val = this.currencyInputValue.trim().toLowerCase();
    if (!val) {
      this.currencySuggestions = [...this.currencies];
      this.showCurrencySuggestions = true;
      // Clear the form value since nothing selected
      this.quoteForm.patchValue({ currency: '' });
      return;
    }
    this.currencySuggestions = this.currencies.filter(c =>
      c.currencyCode.toLowerCase().includes(val) ||
      c.currencyName?.toLowerCase().includes(val)
    );
    this.showCurrencySuggestions = true;
  }

  onCurrencyBlur(): void {
    setTimeout(() => {
      this.showCurrencySuggestions = false;
      // If user typed something but didn't select, restore previous valid value
      const currentCode = this.quoteForm.get('currency')?.value;
      if (currentCode) {
        const match = this.currencies.find(c => c.currencyCode === currentCode);
        if (match) {
          this.currencyInputValue = `${match.currencyCode} — ${match.currencyName}`;
        }
      } else {
        this.currencyInputValue = '';
      }
    }, 200);
  }

  selectCurrency(c: any): void {
    this.currencyInputValue = `${c.currencyCode} — ${c.currencyName}`;
    this.quoteForm.patchValue({ currency: c.currencyCode });
    this.showCurrencySuggestions = false;
    this.cdr.detectChanges();
  }

  clearCurrency(): void {
    this.currencyInputValue = '';
    this.quoteForm.patchValue({ currency: '' });
    this.currencySuggestions = [...this.currencies];
    this.showCurrencySuggestions = true;
  }

  addCurrencyOnTheFly(): void {
    const code = this.newCurrencyCode;
    const name = this.newCurrencyName;
    if (!code) return;
    // Don't save to DB yet — hold in memory until quote is saved
    const temp = { currencyCode: code, currencyName: name, isPending: true };
    this.currencies.push(temp);
    this.pendingNewCurrencies.push({ currencyCode: code, currencyName: name });
    this.selectCurrency(temp);
    this.cdr.detectChanges();
  }

  // ── Form ──────────────────────────────────────────
  initializeForm(): void {
    this.quoteForm = this.fb.group({
      quoteRef:     [{ value: '', disabled: true }],
      customerId:   ['', Validators.required],
      quoteDate:    [new Date(), Validators.required],
      currency:     ['INR', Validators.required],
      quoteDetails: this.fb.array([])
    });
      this.addRow();
      // ✅ Add this
      setTimeout(() => this.cdr.detectChanges());
  }

  get quoteDetails(): FormArray {
    return this.quoteForm.get('quoteDetails') as FormArray;
  }

  get selectedCurrency(): string {
    return this.quoteForm.get('currency')?.value || 'INR';
  }

  addRow(): void {
    const row = this.fb.group({
      itemDesc:     ['', Validators.required],
      itemUnitRate: [0, [Validators.required, Validators.min(0)]],
      itemQuantity: [1, [Validators.required, Validators.min(1)]],
      itemDiscount: [0, [Validators.min(0), Validators.max(100)]],
      itemValue:    [0]
    });
    this.quoteDetails.push(row);
    setTimeout(() => { if (this.table) this.table.renderRows(); });
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
    row.patchValue({ itemValue: qty * rate * (1 - discount / 100) }, { emitEvent: false });
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

  // ── Templates ─────────────────────────────────────
  termsTemplates: any[] = [];

  loadTermsTemplates(): void {
    this.tcTemplateService.getAll().subscribe({
      next: (data) => { this.termsTemplates = data; this.cdr.detectChanges(); },
      error: () => console.error('Failed to load templates')
    });
  }

  onTemplateInput(): void {
    const val = this.templateInputValue.trim().toLowerCase();
    if (!val) { this.templateSuggestions = []; this.showTemplateSuggestions = false; return; }
    this.templateSuggestions = this.termsTemplates.filter(t =>
      t.templateName.toLowerCase().includes(val)
    );
    this.showTemplateSuggestions = true;
  }

  onTemplateBlur(): void {
    setTimeout(() => { this.showTemplateSuggestions = false; }, 200);
  }

  selectTemplate(template: any): void {
    this.templateInputValue = template.templateName;
    this.showTemplateSuggestions = false;
    this.applyTemplate(template);
  }

  applyTemplate(template: any): void {
    if (!template?.terms) return;
    const grouped: Record<string, any> = {};
    template.terms.forEach((term: any) => {
      const typeName = term.tcType?.typeName || 'General';
      if (!grouped[typeName]) grouped[typeName] = { groupName: typeName, termsDetails: [] };
      grouped[typeName].termsDetails.push({ termText: term.termText });
    });
    this.selectedTerms = Object.values(grouped);
    this.cdr.detectChanges();
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

  // ── T&C ──────────────────────────────────────────
  openTcModal(): void  { this.showTcModal = true; }
  closeTcModal(): void { this.showTcModal = false; }
  confirmTc(): void    { this.showTcModal = false; }

  addGroup(): void {
    this.selectedTerms.push({ groupName: 'New Term Type', termsDetails: [], currentTerm: '' });
  }
  removeGroup(gi: number): void { this.selectedTerms.splice(gi, 1); }
  addTerm(gi: number): void { this.selectedTerms[gi].termsDetails.push({ termText: '' }); }
  removeTerm(gi: number, di: number): void { this.selectedTerms[gi].termsDetails.splice(di, 1); }

  onTermsTemplateChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (!id) { this.selectedTerms = []; return; }
    const template = this.termsTemplates.find((t: any) => t.templateId === id);
    this.applyTemplate(template);
  }

  // ── Submit ────────────────────────────────────────
  onSubmit(): void {
    if (this.quoteForm.invalid || this.quoteDetails.length === 0) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }
    this.isSubmitting = true;

    // If there are pending currencies, save them first, then submit the quote
    if (this.pendingNewCurrencies.length > 0) {
      const saves = this.pendingNewCurrencies.map(c =>
        this.currencyService.create(c).toPromise().catch(() => null)
      );
      Promise.all(saves).then(() => {
        this.pendingNewCurrencies = [];
        this.submitQuote();
      });
      return;
    }

    this.submitQuote();
  }

  private submitQuote(): void {
    const formValue = this.quoteForm.getRawValue();
    const formattedDate = new Date(formValue.quoteDate).toISOString().split('T')[0];

    const quoteData: any = {
      customer: { customerId: formValue.customerId },  // ✅ nested
      quoteDate: formattedDate,
      currency: formValue.currency,
      totalQuantity: this.getTotalQuantity(),
      totalValue: this.getTotalValue(),
      quoteDetails: formValue.quoteDetails.map((d: any) => ({
        itemDesc:     d.itemDesc,
        itemUnitRate: d.itemUnitRate,
        itemQuantity: d.itemQuantity,
        itemDiscount: d.itemDiscount ?? 0,
        itemValue:    d.itemQuantity * d.itemUnitRate * (1 - (d.itemDiscount ?? 0) / 100)
      })),
      incomingTerms: this.selectedTerms.flatMap((g: any, gi: number) =>
        g.termsDetails.map((d: any, di: number) => ({
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
        this.router.navigate(['/quotes']);
      },
      error: (err) => {
        console.error('Save error:', err);
        this.snackBar.open('Failed to save quote', 'Close', { duration: 4000 });
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.quoteForm = this.fb.group({
      quoteRef:     [{ value: '', disabled: true }],
      customerId:   ['', Validators.required],
      quoteDate:    [new Date(), Validators.required],
      currency:     ['INR', Validators.required],
      quoteDetails: this.fb.array([])
    });
    this.selectedTerms = [];
    this.currencyInputValue = '';
    this.customerInputValue = '';
    this.pendingNewCurrencies = [];
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