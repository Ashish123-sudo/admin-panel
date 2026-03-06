import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TermsService } from '../services/terms.service';
import { TermsTemplate, TermsGroup } from '../models/terms.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-tc-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule],
  templateUrl: './tc-edit.component.html',
  styleUrls: ['./tc-edit.component.scss']
})
export class TcEditComponent implements OnInit {
  tcForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  currentGroupName = '';
  groups: (TermsGroup & { currentTerm: string })[] = [];
  templateId!: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private termsService: TermsService,
    private cdr: ChangeDetectorRef
  ) { }
  
  addGroup(): void {
  const name = this.currentGroupName.trim();
  if (name) {
    this.groups.push({ groupName: name, termsDetails: [], currentTerm: '' });
    this.currentGroupName = '';
  }
}

  ngOnInit(): void {
    this.tcForm = this.fb.group({
      templateName: ['', [Validators.required, Validators.maxLength(255)]],
    });

    this.templateId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Template ID:', this.templateId);
    this.loadTemplate();
  }
  loadTemplate(): void {
    this.isLoading = true;
    this.termsService.getTemplateById(this.templateId).subscribe({
      next: (data: TermsTemplate) => {
        this.tcForm.patchValue({ templateName: data.templateName });
        this.groups = data.termsGroups.map(g => ({ ...g, currentTerm: '' }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: { message: string }) => {
        alert('Failed to load template.');
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  removeGroup(groupIndex: number): void {
    this.groups.splice(groupIndex, 1);
  }

  addTerm(groupIndex: number): void {
    const trimmed = this.groups[groupIndex].currentTerm.trim();
    if (trimmed) {
      this.groups[groupIndex].termsDetails.push({ termText: trimmed });
      this.groups[groupIndex].currentTerm = '';
    }
  }

  removeTerm(groupIndex: number, termIndex: number): void {
    this.groups[groupIndex].termsDetails.splice(termIndex, 1);
  }

  onSubmit(): void {
  // Auto-add any unsaved terms in textareas
    this.groups.forEach((g, gi) => {
      if (g.currentTerm?.trim()) {
        this.addTerm(gi);
      }
    });
    if (this.tcForm.valid && this.groups.length > 0 && !this.isSubmitting) {
      this.isSubmitting = true;
      

      const payload: TermsTemplate = {
        templateId: this.templateId,
        templateName: this.tcForm.value.templateName,
        termsGroups: this.groups.map((g, i) => ({
          groupId: g.groupId,
          groupName: g.groupName,
          sortOrder: i + 1,
          termsDetails: g.termsDetails.map((d, j) => ({
            detailId: d.detailId,
            termText: d.termText,
            sortOrder: j + 1
          }))
        }))
      };

      this.termsService.updateTemplate(this.templateId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/settings/terms']);
        },
        error: (err: { message: string }) => {
          alert('Failed to update template. Please try again.');
          console.error(err);
          this.isSubmitting = false;
        }
      });
    } else {
      if (this.groups.length === 0) {
        alert('Please add at least one term type.');
      } else {
        alert('Please fill in all required fields.');
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/settings/terms']);
  }
}