import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TermsService } from '../services/terms.service';
import { TermsTemplate, TermsGroup } from '../models/terms.model';

@Component({
  selector: 'app-tc-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule],
  templateUrl: './tc-add.component.html',
  styleUrls: ['./tc-add.component.scss']
})
export class TcAddComponent implements OnInit {
  tcForm!: FormGroup;
  isSubmitting = false;
  currentGroupName = '';
  groups: (TermsGroup & { currentTerm: string })[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private termsService: TermsService
  ) {}

  ngOnInit(): void {
    this.tcForm = this.fb.group({
      templateName: ['', [Validators.required, Validators.maxLength(255)]],
    });
  }

  addGroup(): void {
    const name = this.currentGroupName.trim();
    if (name) {
      this.groups.push({ groupName: name, termsDetails: [], currentTerm: '' });
      this.currentGroupName = '';
    }
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
        templateName: this.tcForm.value.templateName,
        termsGroups: this.groups.map((g, i) => ({
          groupName: g.groupName,
          sortOrder: i + 1,
          termsDetails: g.termsDetails.map((d, j) => ({
            termText: d.termText,
            sortOrder: j + 1
          }))
        }))
      };

      this.termsService.createTemplate(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/settings/terms']);
        },
        error: (err: { message: string }) => {
          console.error('Error creating template:', err);
          alert('Failed to save template. Please try again.');
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