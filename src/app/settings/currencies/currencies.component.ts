import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyService } from '../services/currency.service';
import { Currency } from '../models/currency.model';

@Component({
  selector: 'app-currencies',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './currencies.component.html',
  styleUrls: ['./currencies.component.scss']
})
export class CurrenciesComponent implements OnInit {

  currencies: Currency[] = [];
  isLoading = true;

  showAddForm = false;
  newCode = '';
  newName = '';

  editingId: string | null = null;    // string
  editingCode = '';
  editingName = '';

  constructor(
    private currencyService: CurrencyService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadCurrencies(); }

  loadCurrencies(): void {
    this.isLoading = true;
    this.currencyService.getAll().subscribe({
      next: (data) => { this.currencies = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; }
    });
  }

  addCurrency(): void {
    const code = this.newCode.trim().toUpperCase();
    if (!code) return;
    this.currencyService.create({ currencyCode: code, currencyName: this.newName.trim() }).subscribe({
      next: (c) => {
        this.currencies.push(c);
        this.newCode = ''; this.newName = ''; this.showAddForm = false;
        this.snackBar.open('Currency added', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: (err) => this.snackBar.open(err?.error?.error || 'Failed to add currency', 'Close', { duration: 3000 })
    });
  }

  startEdit(c: Currency): void {
    this.editingId = c.currencyId!;   // string
    this.editingCode = c.currencyCode;
    this.editingName = c.currencyName || '';
  }

  saveEdit(c: Currency): void {
    if (!this.editingCode.trim()) return;
    this.currencyService.update(c.currencyId!, {
      currencyCode: this.editingCode.trim().toUpperCase(),
      currencyName: this.editingName.trim()
    }).subscribe({
      next: (updated) => {
        const idx = this.currencies.findIndex(x => x.currencyId === c.currencyId);
        if (idx !== -1) this.currencies[idx] = updated;
        this.editingId = null;
        this.snackBar.open('Currency updated', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to update', 'Close', { duration: 3000 })
    });
  }

  cancelEdit(): void { this.editingId = null; }

  setDefault(c: Currency): void {
    this.currencyService.setDefault(c.currencyId!).subscribe({
      next: () => {
        this.currencies.forEach(x => x.isDefault = false);
        c.isDefault = true;
        this.snackBar.open(`${c.currencyCode} set as default`, 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to set default', 'Close', { duration: 3000 })
    });
  }

  deleteCurrency(c: Currency): void {
    if (!confirm(`Delete ${c.currencyCode}?`)) return;
    this.currencyService.delete(c.currencyId!).subscribe({
      next: () => {
        this.currencies = this.currencies.filter(x => x.currencyId !== c.currencyId);
        this.snackBar.open('Currency deleted', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: (err) => this.snackBar.open(err?.error?.error || 'Failed to delete', 'Close', { duration: 3000 })
    });
  }
}