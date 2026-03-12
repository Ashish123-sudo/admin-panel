import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TcLibraryService } from '../services/tc-library.service';
import { TcType, TcLibraryItem } from '../models/tc-library.model';

@Component({
  selector: 'app-tc-library',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, DragDropModule],
  templateUrl: './tc-library.component.html',
  styleUrls: ['./tc-library.component.scss']
})
export class TcLibraryComponent implements OnInit {

  types: TcType[] = [];
  terms: TcLibraryItem[] = [];
  editingTypeInput = '';
  showEditTypeSuggestions = false;
  editTypeSuggestions: TcType[] = [];

  // Add term
  newTermText = '';
  selectedTypeId: number | null = null;

  // Type autocomplete
  typeInputValue = '';
  showTypeSuggestions = false;
  typeSuggestions: TcType[] = [];

  // Edit term
  editingTermId: number | null = null;
  editingTermText = '';
  editingTypeId: number | null = null;

  // Filter
  filterTypeId: number | null = null;

  isLoading = true;

  constructor(
    private tcLibraryService: TcLibraryService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  onEditTypeInput(): void {
    const val = this.editingTypeInput.trim().toLowerCase();
    if (!val) {
      this.editTypeSuggestions = [];
      this.showEditTypeSuggestions = false;
      return;
    }
    this.editTypeSuggestions = this.types.filter(t =>
      t.typeName.toLowerCase().includes(val)
    );
    this.showEditTypeSuggestions = true;
  }

  onEditTypeBlur(): void {
    setTimeout(() => { this.showEditTypeSuggestions = false; }, 200);
  }

  selectEditTypeSuggestion(type: TcType): void {
    this.editingTypeInput = type.typeName;
    this.editingTypeId = type.typeId!;
    this.showEditTypeSuggestions = false;
  }

  loadAll(): void {
    this.isLoading = true;
    this.tcLibraryService.getTypes().subscribe({
      next: (types) => {
        this.types = types;
        this.tcLibraryService.getTerms().subscribe({
          next: (terms) => {
            // Sort by sortOrder on load
            this.terms = terms.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.isLoading = false; }
        });
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ── DRAG & DROP ────────────────────────────────────

  onDrop(event: CdkDragDrop<TcLibraryItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    // Reorder the local array
    moveItemInArray(this.terms, event.previousIndex, event.currentIndex);

    // Assign new sortOrder values (1-based)
    this.terms.forEach((term, index) => {
      term.sortOrder = index + 1;
    });

    this.cdr.detectChanges();

    // Save new order to backend
    const orderPayload = this.terms
      .filter(term => term.termId != null)
      .map((term, index) => ({
        termId: term.termId as number,
        sortOrder: index + 1
      }));

    this.tcLibraryService.reorderTerms(orderPayload).subscribe({
      next: () => {
        this.snackBar.open('Order saved', 'Close', { duration: 1500 });
      },
      error: () => {
        this.snackBar.open('Failed to save order', 'Close', { duration: 3000 });
        // Reload to restore correct order
        this.loadAll();
      }
    });
  }

  // ── TYPES ──────────────────────────────────────────

  deleteType(typeId: number): void {
    if (!confirm('Delete this type? Terms under it will lose their type tag.')) return;
    this.tcLibraryService.deleteType(typeId).subscribe({
      next: () => {
        this.types = this.types.filter(t => t.typeId !== typeId);
        if (this.filterTypeId === typeId) this.filterTypeId = null;
        this.snackBar.open('Type deleted', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to delete type', 'Close', { duration: 3000 })
    });
  }

  // ── TYPE AUTOCOMPLETE ──────────────────────────────

  onTypeInput(): void {
    const val = this.typeInputValue.trim().toLowerCase();
    if (!val) {
      this.typeSuggestions = [];
      this.showTypeSuggestions = false;
      return;
    }
    this.typeSuggestions = this.types.filter(t =>
      t.typeName.toLowerCase().includes(val)
    );
    this.showTypeSuggestions = true;
  }

  onTypeBlur(): void {
    setTimeout(() => { this.showTypeSuggestions = false; }, 200);
  }

  selectTypeSuggestion(type: TcType): void {
    this.typeInputValue = type.typeName;
    this.selectedTypeId = type.typeId!;
    this.showTypeSuggestions = false;
  }

  // ── TERMS ──────────────────────────────────────────

  get filteredTerms(): TcLibraryItem[] {
    if (this.filterTypeId === null) return this.terms;
    return this.terms.filter(t => t.tcType?.typeId === this.filterTypeId);
  }

  addTerm(): void {
    const text = this.newTermText.trim();
    if (!text) return;

    const typeName = this.typeInputValue.trim();
    const existingType = this.types.find(
      t => t.typeName.toLowerCase() === typeName.toLowerCase()
    );

    if (typeName && !existingType) {
      this.tcLibraryService.createType({ typeName }).subscribe({
        next: (newType) => {
          this.types.push(newType);
          this.saveTerm(text, newType);
        },
        error: () => this.snackBar.open('Failed to create type', 'Close', { duration: 3000 })
      });
    } else {
      this.saveTerm(text, existingType || null);
    }
  }

  saveTerm(text: string, type: TcType | null): void {
    const payload: any = {
      termText: text,
      sortOrder: this.terms.length + 1   // new terms go to the end
    };
    if (type) payload.tcType = { typeId: type.typeId, typeName: type.typeName };

    this.tcLibraryService.createTerm(payload).subscribe({
      next: (saved) => {
        this.terms.push(saved);
        this.newTermText = '';
        this.typeInputValue = '';
        this.selectedTypeId = null;
        this.snackBar.open('Term added', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to add term', 'Close', { duration: 3000 })
    });
  }

  startEdit(term: TcLibraryItem): void {
    this.editingTermId = term.termId!;
    this.editingTermText = term.termText;
    this.editingTypeId = term.tcType?.typeId ?? null;
    this.editingTypeInput = term.tcType?.typeName || '';
  }

  saveEdit(term: TcLibraryItem): void {
    if (!this.editingTermText.trim()) return;

    const typeName = this.editingTypeInput.trim();
    const existingType = this.types.find(
      t => t.typeName.toLowerCase() === typeName.toLowerCase()
    );

    if (typeName && !existingType) {
      this.tcLibraryService.createType({ typeName }).subscribe({
        next: (newType) => {
          this.types.push(newType);
          this.doSaveEdit(term, newType);
        },
        error: () => this.snackBar.open('Failed to create type', 'Close', { duration: 3000 })
      });
    } else {
      this.doSaveEdit(term, existingType || null);
    }
  }

  doSaveEdit(term: TcLibraryItem, type: TcType | null): void {
    const updated: any = {
      termText: this.editingTermText,
      sortOrder: term.sortOrder,
      tcType: type ? { typeId: type.typeId, typeName: type.typeName } : null
    };

    this.tcLibraryService.updateTerm(term.termId!, updated).subscribe({
      next: (saved) => {
        const idx = this.terms.findIndex(t => t.termId === term.termId);
        if (idx !== -1) this.terms[idx] = saved;
        this.editingTermId = null;
        this.editingTypeInput = '';
        this.editingTypeId = null;
        this.snackBar.open('Term updated', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to update term', 'Close', { duration: 3000 })
    });
  }

  cancelEdit(): void {
    this.editingTermId = null;
  }

  deleteTerm(termId: number): void {
    if (!confirm('Delete this term?')) return;
    this.tcLibraryService.deleteTerm(termId).subscribe({
      next: () => {
        this.terms = this.terms.filter(t => t.termId !== termId);
        // Re-number sortOrder after delete
        this.terms.forEach((t, i) => t.sortOrder = i + 1);
        this.snackBar.open('Term deleted', 'Close', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to delete term', 'Close', { duration: 3000 })
    });
  }

  getTermCountByType(typeId: number): number {
    return this.terms.filter(t => t.tcType?.typeId === typeId).length;
  }
}