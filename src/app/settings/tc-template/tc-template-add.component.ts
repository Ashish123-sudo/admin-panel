import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TcTemplateService } from '../services/tc-template.service';
import { TcLibraryService } from '../services/tc-library.service';
import { TcLibraryItem, TcType } from '../models/tc-library.model';

interface FlatItem {
  isHeader: boolean;
  label?: string;
  count?: number;
  term?: TcLibraryItem;
}

@Component({
  selector: 'app-tc-template-add',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, DragDropModule],
  templateUrl: './tc-template-add.component.html',
  styleUrls: ['./tc-template-add.component.scss']
})
export class TcTemplateAddComponent implements OnInit {

  templateName = '';
  types: TcType[] = [];
  allTerms: TcLibraryItem[] = [];
  selectedTerms: TcLibraryItem[] = [];
  availableTerms: TcLibraryItem[] = [];
  availableFlatList: FlatItem[] = [];

  isLoading = true;
  isSaving = false;
  isEditMode = false;
  editTemplateId: string | null = null;  // ← string, not number

  constructor(
    private tcTemplateService: TcTemplateService,
    private tcLibraryService: TcLibraryService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editTemplateId = id;  // ← no Number() conversion
    }
    this.loadLibrary();
  }

  loadLibrary(): void {
    this.isLoading = true;
    this.tcLibraryService.getTypes().subscribe({
      next: (types) => {
        this.types = types;
        this.tcLibraryService.getTerms().subscribe({
          next: (terms) => {
            this.allTerms = terms.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            if (this.isEditMode) {
              this.loadTemplate();
            } else {
              this.availableTerms = [...this.allTerms];
              this.rebuildFlatList();
              setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); }); // ✅
            }
          },
          error: () => {
            setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); });
          }
        });
      },
      error: () => {
        setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  loadTemplate(): void {
    this.tcTemplateService.getById(this.editTemplateId!).subscribe({
      next: (template) => {
        this.templateName = template.templateName;
        const selectedIds = new Set((template.terms || []).map((t: TcLibraryItem) => t.termId!));
        this.selectedTerms = (template.terms || [])
          .map((t: TcLibraryItem) => this.allTerms.find(a => a.termId === t.termId)!)
          .filter(Boolean);
        this.availableTerms = this.allTerms.filter(t => !selectedIds.has(t.termId!));
        this.rebuildFlatList();
        setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); }); // ✅
      },
      error: () => {
        this.snackBar.open('Failed to load template', 'Close', { duration: 3000 });
        setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); }); // ✅
      }
    });
  }

  rebuildFlatList(): void {
    const map = new Map<string, TcLibraryItem[]>();
    for (const term of this.availableTerms) {
      const key = term.tcType?.typeName || 'General';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(term);
    }
    const flat: FlatItem[] = [];
    for (const [label, terms] of map.entries()) {
      flat.push({ isHeader: true, label, count: terms.length });
      for (const term of terms) {
        flat.push({ isHeader: false, term });
      }
    }
    this.availableFlatList = flat;
  }

  addTerm(term: TcLibraryItem): void {
    this.availableTerms = this.availableTerms.filter(t => t.termId !== term.termId);
    this.selectedTerms = [...this.selectedTerms, term];
    this.rebuildFlatList();
    this.cdr.detectChanges();
  }

  removeTerm(index: number): void {
    const [removed] = this.selectedTerms.splice(index, 1);
    this.availableTerms = [...this.availableTerms, removed]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    this.rebuildFlatList();
    this.cdr.detectChanges();
  }

  onDropSelected(event: CdkDragDrop<TcLibraryItem[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.selectedTerms, event.previousIndex, event.currentIndex);
    } else {
      const term: TcLibraryItem = event.item.data;
      this.availableTerms = this.availableTerms.filter(t => t.termId !== term.termId);
      this.selectedTerms.splice(event.currentIndex, 0, term);
      this.rebuildFlatList();
    }
    this.cdr.detectChanges();
  }

  onDropAvailable(event: CdkDragDrop<TcLibraryItem[]>): void {
    if (event.previousContainer === event.container) return;
    const term: TcLibraryItem = event.item.data;
    this.selectedTerms = this.selectedTerms.filter(t => t.termId !== term.termId);
    this.availableTerms = [...this.availableTerms, term]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    this.rebuildFlatList();
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.templateName.trim()) {
      this.snackBar.open('Please enter a template name', 'Close', { duration: 3000 });
      return;
    }
    if (this.selectedTerms.length === 0) {
      this.snackBar.open('Please add at least one term', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const payload = {
      templateName: this.templateName.trim(),
      termIds: this.selectedTerms.map(t => String(t.termId!))  // ← string[]
    };

    const request = this.isEditMode
      ? this.tcTemplateService.update(this.editTemplateId!, payload)
      : this.tcTemplateService.create(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Template updated' : 'Template created',
          'Close', { duration: 2000 }
        );
        this.router.navigate(['/settings/templates']);
      },
      error: () => {
        this.snackBar.open('Failed to save template', 'Close', { duration: 3000 });
        setTimeout(() => { this.isSaving = false; this.cdr.detectChanges(); }); // ✅
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/settings/templates']);
  }
}