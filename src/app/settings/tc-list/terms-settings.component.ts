import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TermsService } from '../services/terms.service';
import { TermsTemplate } from '../models/terms.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-terms-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './terms-settings.component.html',
  styleUrls: ['./terms-settings.component.scss']
})
export class TermsSettingsComponent implements OnInit {
  termsList: TermsTemplate[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private termsService: TermsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.termsService.getAllTemplates().subscribe({
      next: (data: TermsTemplate[]) => {
        this.termsList = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: { message: string }) => {
        this.errorMessage = 'Failed to load templates.';
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onAdd(): void {
    this.router.navigate(['/settings/terms/add']);
  }

  onEdit(item: TermsTemplate): void {
    this.router.navigate(['/settings/terms/edit', item.templateId]);
  }

  onDelete(item: TermsTemplate): void {
    if (confirm(`Are you sure you want to delete "${item.templateName}"?`)) {
      this.termsService.deleteTemplate(item.templateId!).subscribe({
        next: () => {
          this.termsList = this.termsList.filter(t => t.templateId !== item.templateId);
        },
        error: (err: { message: string }) => {
          alert('Failed to delete template. Please try again.');
          console.error(err);
        }
      });
    }
  }
}