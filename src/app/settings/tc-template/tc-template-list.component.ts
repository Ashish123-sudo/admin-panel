import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TcTemplateService } from '../services/tc-template.service';
import { TcTemplate } from '../models/tc-template.model';

@Component({
  selector: 'app-tc-template-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './tc-template-list.component.html',
  styleUrls: ['./tc-template-list.component.scss']
})
export class TcTemplateListComponent implements OnInit {

  templates: TcTemplate[] = [];
  isLoading = true;
  expandedTemplateId: string | null = null;  // Changed from number to string

  constructor(
    private tcTemplateService: TcTemplateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.tcTemplateService.getAll().subscribe({
      next: (data) => {
        this.templates = data;
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load templates', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  toggleExpand(templateId: string): void {  // Changed from number to string
    this.expandedTemplateId = this.expandedTemplateId === templateId ? null : templateId;
  }

  getGroupedTerms(template: TcTemplate): { typeName: string, terms: any[] }[] {
    if (!template.terms) return [];
    const grouped: Record<string, any[]> = {};
    template.terms.forEach(term => {
      const type = term.tcType?.typeName || 'General';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(term);
    });
    return Object.keys(grouped).map(typeName => ({ typeName, terms: grouped[typeName] }));
  }

  addNew(): void {
    this.router.navigate(['/settings/templates/add']);
  }

  edit(templateId: string): void {  // Changed from number to string
    this.router.navigate(['/settings/templates/edit', templateId]);
  }

  delete(templateId: string): void {  // Changed from number to string
    if (!confirm('Delete this template?')) return;
    this.tcTemplateService.delete(templateId).subscribe({
      next: () => {
        this.templates = this.templates.filter(t => t.templateId !== templateId);
        this.snackBar.open('Template deleted', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 })
    });
  }

  getTermCount(template: TcTemplate): number {
    return template.terms?.length ?? 0;
  }

  getTypesSummary(template: TcTemplate): string {
    if (!template.terms || template.terms.length === 0) return 'No terms';
    const types = [...new Set(template.terms.map(t => t.tcType?.typeName).filter(Boolean))];
    return types.join(', ');
  }
}