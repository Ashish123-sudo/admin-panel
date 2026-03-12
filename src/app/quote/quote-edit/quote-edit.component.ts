import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuoteService } from '../services/quote.service';
import { TcTemplateService } from '../../settings/services/tc-template.service';
import { CurrencyService } from '../../settings/services/currency.service';

@Component({
  selector: 'app-quote-edit',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatSnackBarModule,
    MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './quote-edit.component.html',
  styleUrls: ['./quote-edit.component.scss']
})
export class QuoteEditComponent implements OnInit {
  selectedTerms: any[] = [];
  showTcModal = false;
  termsTemplates: any[] = [];
  isLoading = true;
  currentQuoteId: number | null = null;
  currentCurrency: string = 'INR';
  currencies: any[] = [];
  quoteRef: string = '';
  customerId: number | null = null;
  quoteDate: string = '';
  templateInputValue = '';
  showTemplateSuggestions = false;
  templateSuggestions: any[] = [];

  // ── Currency autocomplete ─────────────────────────
  currencyInputValue = '';
  showCurrencySuggestions = false;
  currencySuggestions: any[] = [];
  isAddingCurrency = false;
  pendingNewCurrencies: { currencyCode: string; currencyName: string }[] = [];

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['itemDesc', 'itemUnitRate', 'itemQuantity', 'itemValue', 'actions'];

  constructor(
    private quoteService: QuoteService,
    private tcTemplateService: TcTemplateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.snackBar.open('Invalid quote ID', 'Close', { duration: 3000 });
      this.router.navigate(['/quotes']);
      return;
    }
    this.loadQuote(Number(id));
    this.loadTermsTemplates();
  }

  loadTermsTemplates(): void {
    this.tcTemplateService.getAll().subscribe({
      next: (data) => { this.termsTemplates = data; this.cdr.detectChanges(); },
      error: () => console.error('Failed to load templates')
    });
  }

  loadQuote(id: number): void {
    this.isLoading = true;
    this.quoteService.getQuoteById(id).subscribe({
      next: (response: any) => {
        this.currentQuoteId = response.quoteId;
        this.currentCurrency = response.currency || 'INR';
        this.quoteRef = response.quoteRef;
        this.customerId = response.customerId;
        this.quoteDate = response.quoteDate;
        this.dataSource.data = response.quoteDetails || [];
        if (response.quoteTermsConditions?.length > 0) {
          this.selectedTerms = this.groupTerms(response.quoteTermsConditions);
        }
        this.isLoading = false;
        this.loadCurrencies();
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Failed to load quote', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/quotes']);
      }
    });
  }

  // ── Currency ──────────────────────────────────────

  loadCurrencies(): void {
    this.currencyService.getAll().subscribe({
      next: (data) => {
        this.currencies = data;
        const match = data.find((c: any) => c.currencyCode === this.currentCurrency);
        if (match) {
          this.currencyInputValue = `${match.currencyCode} — ${match.currencyName}`;
        } else {
          const def = data.find((c: any) => c.isDefault);
          if (def) this.currencyInputValue = `${def.currencyCode} — ${def.currencyName}`;
        }
        this.cdr.detectChanges();
      },
      error: () => console.error('Failed to load currencies')
    });
  }

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

  onCurrencyFocus(): void {
    const val = this.currencyInputValue.trim().toLowerCase();
    const isDisplayString = this.currencies.some((c: any) =>
      `${c.currencyCode} — ${c.currencyName}`.toLowerCase() === val
    );
    this.currencySuggestions = isDisplayString || !val
      ? [...this.currencies]
      : this.currencies.filter((c: any) =>
          c.currencyCode.toLowerCase().includes(val) ||
          c.currencyName?.toLowerCase().includes(val));
    this.showCurrencySuggestions = true;
  }

  onCurrencyInput(): void {
    const val = this.currencyInputValue.trim().toLowerCase();
    this.currencySuggestions = !val
      ? [...this.currencies]
      : this.currencies.filter((c: any) =>
          c.currencyCode.toLowerCase().includes(val) ||
          c.currencyName?.toLowerCase().includes(val));
    this.showCurrencySuggestions = true;
    if (!val) this.currentCurrency = '';
  }

  onCurrencyBlur(): void {
    setTimeout(() => {
      this.showCurrencySuggestions = false;
      // Restore display value if a valid currency is selected
      if (this.currentCurrency) {
        const match = this.currencies.find((c: any) => c.currencyCode === this.currentCurrency);
        if (match) this.currencyInputValue = `${match.currencyCode} — ${match.currencyName}`;
      } else {
        this.currencyInputValue = '';
      }
    }, 200);
  }

  selectCurrency(c: any): void {
    this.currencyInputValue = `${c.currencyCode} — ${c.currencyName}`;
    this.currentCurrency = c.currencyCode;
    this.showCurrencySuggestions = false;
    this.cdr.detectChanges();
  }

  clearCurrency(): void {
    this.currencyInputValue = '';
    this.currentCurrency = '';
    this.currencySuggestions = [...this.currencies];
    this.showCurrencySuggestions = true;
  }

  addCurrencyOnTheFly(): void {
    const code = this.newCurrencyCode;
    const name = this.newCurrencyName;
    if (!code) return;
    const temp = { currencyCode: code, currencyName: name, isPending: true };
    this.currencies.push(temp);
    this.pendingNewCurrencies.push({ currencyCode: code, currencyName: name });
    this.selectCurrency(temp);
    this.cdr.detectChanges();
  }

  // ── Terms ─────────────────────────────────────────

  groupTerms(terms: any[]): any[] {
    const grouped: Record<string, any> = {};
    terms.forEach(t => {
      if (!grouped[t.groupName]) {
        grouped[t.groupName] = { groupName: t.groupName, termsDetails: [] };
      }
      grouped[t.groupName].termsDetails.push({ termText: t.termText });
    });
    return Object.values(grouped);
  }

  openTcModal(): void  { this.showTcModal = true; }
  closeTcModal(): void { this.showTcModal = false; }
  confirmTc(): void    { this.showTcModal = false; }
  addGroup(): void { this.selectedTerms.push({ groupName: 'New Term Type', termsDetails: [] }); }
  removeGroup(gi: number): void { this.selectedTerms.splice(gi, 1); }
  addTerm(gi: number): void { this.selectedTerms[gi].termsDetails.push({ termText: '' }); }
  removeTerm(gi: number, di: number): void { this.selectedTerms[gi].termsDetails.splice(di, 1); }

  onTemplateInput(): void {
    const val = this.templateInputValue.trim().toLowerCase();
    if (!val) { this.templateSuggestions = []; this.showTemplateSuggestions = false; return; }
    this.templateSuggestions = this.termsTemplates.filter(t =>
      t.templateName.toLowerCase().includes(val)
    );
    this.showTemplateSuggestions = true;
  }
  onTemplateBlur(): void { setTimeout(() => { this.showTemplateSuggestions = false; }, 200); }
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

  // ── Items ─────────────────────────────────────────

  calculateItemValue(item: any): void {
    item.itemValue = (parseFloat(item.itemUnitRate) || 0) * (parseFloat(item.itemQuantity) || 0);
    this.cdr.detectChanges();
  }

  updateItem(item: any): void {
    this.calculateItemValue(item);
    this.quoteService.updateQuoteDetail(item).subscribe({
      next: () => { this.dataSource.data = [...this.dataSource.data]; this.cdr.detectChanges(); },
      error: () => this.snackBar.open('Failed to update item', 'Close', { duration: 3000 })
    });
  }

  deleteDetail(slNo: number): void {
    if (!confirm('Delete this item?')) return;
    this.quoteService.deleteQuoteDetail(slNo).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(i => i.slNo !== slNo);
        this.snackBar.open('Item deleted', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3000 })
    });
  }

  addNewItem(): void {
    if (!this.currentQuoteId) return;
    const newItem = { quoteId: this.currentQuoteId, itemDesc: '', itemUnitRate: 0, itemQuantity: 1, itemValue: 0 };
    this.quoteService.addQuoteDetail(newItem).subscribe({
      next: (saved: any) => {
        this.dataSource.data = [...this.dataSource.data, saved];
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to add item', 'Close', { duration: 3000 })
    });
  }

  getTotalQuantity(): number {
    return this.dataSource.data.reduce((s, i) => s + (parseFloat(i.itemQuantity) || 0), 0);
  }
  getTotalValue(): number {
    return this.dataSource.data.reduce((s, i) => s + (parseFloat(i.itemValue) || 0), 0);
  }

  // ── Save ──────────────────────────────────────────

  saveChanges(): void {
    if (!this.currentQuoteId) return;

    // Save pending currencies first, then save quote
    if (this.pendingNewCurrencies.length > 0) {
      const saves = this.pendingNewCurrencies.map(c =>
        this.currencyService.create(c).toPromise().catch(() => null)
      );
      Promise.all(saves).then(() => {
        this.pendingNewCurrencies = [];
        this.doSaveChanges();
      });
      return;
    }
    this.doSaveChanges();
  }

  private doSaveChanges(): void {
    // Update currency on the quote header
    this.quoteService.updateQuote(this.currentQuoteId!, {
      quoteId: this.currentQuoteId!,
      quoteRef: this.quoteRef,
      customerId: this.customerId!,
      quoteDate: this.quoteDate,
      currency: this.currentCurrency,
      totalQuantity: this.getTotalQuantity(),
      totalValue: this.getTotalValue()
    }).subscribe({
      next: () => {
        const termsPayload = this.selectedTerms.flatMap((g: any, gi: number) =>
          g.termsDetails.map((d: any, di: number) => ({
            groupName: g.groupName, termText: d.termText,
            groupOrder: gi + 1, termOrder: di + 1
          }))
        );
        this.quoteService.updateQuoteTerms(this.currentQuoteId!, termsPayload).subscribe({
          next: () => {
            this.snackBar.open('All changes saved', 'Close', { duration: 2000 });
            this.router.navigate(['/quotes']);
          },
          error: () => this.snackBar.open('Failed to save terms', 'Close', { duration: 3000 })
        });
      },
      error: () => this.snackBar.open('Failed to save quote', 'Close', { duration: 3000 })
    });
  }

  cancelEdit(): void { this.router.navigate(['/quotes']); }
}