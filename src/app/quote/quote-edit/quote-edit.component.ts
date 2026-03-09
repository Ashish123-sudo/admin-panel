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
import { TermsService } from '../../settings/services/terms.service';
import { TermsTemplate, TermsGroup } from '../../settings/models/terms.model';
import { ReactiveFormsModule } from '@angular/forms';
import { QuoteService } from '../services/quote.service';

@Component({
  selector: 'app-quote-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
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
  currencies = ['INR', 'USD', 'EUR', 'GBP'];  // ✅ ADD
  quoteRef: string = '';
  customerId: number | null = null;
  quoteDate: string = '';

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
    private termsService: TermsService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
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

        // Load terms
        if (response.quoteTermsConditions && response.quoteTermsConditions.length > 0) {
          this.selectedTerms = this.groupTerms(response.quoteTermsConditions);
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Failed to load quote', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/quotes']);
      }
    });
  }

  updateCurrency(): void {
    if (!this.currentQuoteId) return;
    this.quoteService.updateQuote(this.currentQuoteId, {
      quoteId: this.currentQuoteId,
      quoteRef: this.quoteRef,
      customerId: this.customerId!,
      quoteDate: this.quoteDate,
      currency: this.currentCurrency,
      totalQuantity: this.getTotalQuantity(),
      totalValue: this.getTotalValue()
    }).subscribe({
      next: () => this.snackBar.open('Currency updated', 'Close', { duration: 2000 }),
      error: () => this.snackBar.open('Failed to update currency', 'Close', { duration: 3000 })
    });
  }

  groupTerms(terms: any[]): any[] {
    const grouped: Record<string, any> = {};
    terms.forEach(t => {
      if (!grouped[t.groupName]) {
        grouped[t.groupName] = { groupName: t.groupName, termsDetails: [], currentTerm: '' };
      }
      grouped[t.groupName].termsDetails.push({ termText: t.termText });
    });
    return Object.values(grouped);
  }

  loadTermsTemplates(): void {
    this.termsService.getAllTemplates().subscribe({
      next: (templates) => { this.termsTemplates = templates; },
      error: () => {}
    });
  }

  onTermsTemplateChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (!id) return;
    const template = this.termsTemplates.find((t: any) => t.templateId === id);
    if (!template) return;
    this.selectedTerms = (template.termsGroups || []).map((g: any) => ({
      groupName: g.groupName,
      termsDetails: (g.termsDetails || []).map((d: any) => ({ termText: d.termText })),
      currentTerm: ''
    }));
    this.cdr.detectChanges();
  }

  openTcModal(): void { this.showTcModal = true; }
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

  calculateItemValue(item: any): void {
    const rate = parseFloat(item.itemUnitRate) || 0;
    const qty = parseFloat(item.itemQuantity) || 0;
    item.itemValue = rate * qty;
    this.cdr.detectChanges();
  }

  updateItem(item: any): void {
    this.calculateItemValue(item);
    this.quoteService.updateQuoteDetail(item).subscribe({
      next: () => {
        this.dataSource.data = [...this.dataSource.data];
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Failed to update item', 'Close', { duration: 3000 });
      }
    });
  }

  deleteDetail(slNo: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;
    this.quoteService.deleteQuoteDetail(slNo).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(item => item.slNo !== slNo);
        this.snackBar.open('Item deleted', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Delete failed', 'Close', { duration: 3000 });
      }
    });
  }

  addNewItem(): void {
    if (!this.currentQuoteId) return;
    const newItem = {
      quoteId: this.currentQuoteId,
      itemDesc: '',
      itemUnitRate: 0,
      itemQuantity: 1,
      itemValue: 0
    };
    this.quoteService.addQuoteDetail(newItem).subscribe({
      next: (savedItem: any) => {
        this.dataSource.data = [...this.dataSource.data, savedItem];
        this.cdr.detectChanges();
        this.snackBar.open('Item added', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to add item', 'Close', { duration: 3000 });
      }
    });
  }

  getTotalQuantity(): number {
    return this.dataSource.data.reduce((sum, item) => sum + (parseFloat(item.itemQuantity) || 0), 0);
  }

  getTotalValue(): number {
    return this.dataSource.data.reduce((sum, item) => sum + (parseFloat(item.itemValue) || 0), 0);
  }

  saveChanges(): void {
    if (!this.currentQuoteId) return;

    // Flatten selectedTerms groups into flat list for backend
    const termsPayload = this.selectedTerms.flatMap((g, gi) =>
      g.termsDetails.map((d: any, di: number) => ({
        groupName:  g.groupName,
        termText:   d.termText,
        groupOrder: gi + 1,
        termOrder:  di + 1
      }))
    );

    this.quoteService.updateQuoteTerms(this.currentQuoteId, termsPayload).subscribe({
      next: () => {
        this.snackBar.open('All changes saved', 'Close', { duration: 2000 });
        this.router.navigate(['/quotes']);
      },
      error: () => {
        this.snackBar.open('Failed to save terms', 'Close', { duration: 3000 });
      }
    });
  }

  cancelEdit(): void {
    this.router.navigate(['/quotes']);
  }
}